const MODEL_NAME = "gemini-3.5-flash";



export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface UserMedicalContext {
  name: string;
  age: number | null;
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  activeMedications: Array<{ name: string; dosage: string; schedule: string }>;
  recentRecords: Array<{ fileName: string; category: string; aiSummary: string | null }>;
}

function getApiKey(): string {
  const rawKey = process.env.GEMINI_API_KEY || "";
  return rawKey.replace(/^["']|["']$/g, "").trim();
}

function extractJson(rawText: string): any {
  let text = rawText.trim();
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(text);
}

const MODEL_FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash-lite",
  "gemini-flash-latest"
];

async function queryGemini(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemInstruction?: string,
  maxOutputTokens: number = 800
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  let lastError: any = null;

  for (const model of MODEL_FALLBACKS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body: any = {
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens
        }
      };

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Model ${model} returned HTTP ${response.status}: ${errorText.slice(0, 100)}`);
        lastError = new Error(`Gemini API error (${response.status}): ${errorText}`);
        continue;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        return text.trim();
      }
    } catch (err: any) {
      console.warn(`Fetch error for model ${model}:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed to respond");
}




/**
 * Summarize and categorize the medical document text
 */
export async function analyzeMedicalDocument(
  text: string,
  hintCategory?: string
): Promise<{ summary: string; category: string }> {
  const prompt = `Please analyze the following extracted text from a medical document and provide:
1. A concise, easy-to-read summary (markdown bullet points) outlining key findings, diagnoses, prescriptions, or laboratory values.
2. A suggested categorization. The categories available are: "Prescription", "Lab Report", "Discharge Summary", or "Other".

Document text:
"""
${text}
"""

Provide your answer in the following structured JSON format:
{
  "summary": "AI summary here",
  "category": "Prescription | Lab Report | Discharge Summary | Other"
}

Ensure your response is valid JSON only. Do not wrap it in markdown code blocks.`;

  const systemInstruction = "You are a professional medical document analysis engine. Your job is to summarize complex medical records into understandable points for patients, and classify documents accurately. Keep all medical terminology correct but explain key results.";

  try {
    const contents = [{ role: "user", parts: [{ text: prompt }] }];
    const rawResult = await queryGemini(contents, systemInstruction);
    
    // Clean JSON result if wrapped in markdown formatting
    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    const parsed = JSON.parse(cleanJson);
    return {
      summary: parsed.summary || "Summary could not be generated.",
      category: parsed.category || hintCategory || "Other"
    };
  } catch (error) {
    console.error("Error analyzing medical document with Gemini:", error);
    return {
      summary: `Failed to analyze record. Original Text Snippet: ${text.slice(0, 200)}...`,
      category: hintCategory || "Other"
    };
  }
}

/**
 * Check if a medication conflicts with existing medications, allergies, or chronic conditions
 */
export async function checkMedicationConflict(
  newMedName: string,
  newMedDosage: string,
  existingMeds: Array<{ name: string; dosage: string }>,
  allergies: string | null,
  chronicConditions: string | null
): Promise<string | null> {
  if (existingMeds.length === 0 && !allergies && !chronicConditions) {
    return null; // No context to check conflicts against
  }

  const existingMedsStr = existingMeds.map(m => `- ${m.name} (${m.dosage})`).join("\n") || "None";
  const prompt = `Analyze if there are any potential drug conflicts, interactions, allergy issues, or chronic condition contraindications for:
New Medication: ${newMedName} (${newMedDosage})

Patient Context:
- Active Medications:\n${existingMedsStr}
- Allergies: ${allergies || "None declared"}
- Chronic Conditions: ${chronicConditions || "None declared"}

Please check for:
1. Critical interactions (e.g. taking Aspirin and Warfarin).
2. Allergies contraindications (e.g. penicillin allergy).
3. Chronic condition warnings (e.g. NSAIDs in kidney disease).

If any mild, moderate, or severe conflicts are identified, provide a summary warning. Start with a risk tier: [SAFE], [INFO] (minor interactions or precautions), [MODERATE] (moderate risks requiring doctor consultation), or [SEVERE] (dangerous combination, high risk).
If it is safe (no interactions/allergies/conditions flagged), start with [SAFE] and keep it extremely brief.

Return only a concise markdown explanation of the conflict or warnings, or [SAFE] if no concerns.`;

  const systemInstruction = "You are a clinical pharmacy AI assistant. You analyze potential drug interactions, allergies, and patient conditions to warn of conflicts. Provide accurate, clear safety information. Always advise consulting a medical professional.";

  try {
    const contents = [{ role: "user", parts: [{ text: prompt }] }];
    const result = await queryGemini(contents, systemInstruction);
    const trimmed = result.trim();
    if (trimmed.startsWith("[SAFE]")) {
      return null;
    }
    return trimmed;
  } catch (error) {
    console.error("Error checking medication conflicts:", error);
    return null;
  }
}

/**
 * Chat with the personal medical health chatbot using history and patient context
 */
export async function chatWithAssistant(
  query: string,
  history: ChatMessage[],
  context: UserMedicalContext
): Promise<string> {
  const existingMedsStr = context.activeMedications.map(m => `- ${m.name} (${m.dosage}, ${m.schedule})`).join("\n") || "None";
  const recentRecordsStr = context.recentRecords.map(r => `- ${r.fileName} [${r.category}]: ${r.aiSummary || "No summary"}`).join("\n") || "None";

  const systemInstruction = `You are "Lifeline Companion", an advanced, helpful, friendly, and professional personal health AI assistant. 
Patient: ${context.name}
Medical Context:
- Allergies: ${context.allergies || "None declared"}
- Chronic Conditions: ${context.chronicConditions || "None declared"}
- Active Medications: ${existingMedsStr}

Guidelines:
1. Answer the user's question directly, clearly, and completely. Do NOT cut off mid-sentence.
2. Do NOT repeat greeting phrases like "Hello [Name]" on every response in an ongoing conversation.
3. If asked how to use platform features (such as First Aid Assistance, Drug Research, Pharmacy, Medications, or Medical Records), give clear, concise step-by-step instructions on navigating the dashboard menu.
4. For medical or emergency questions, provide practical, safe guidance.
5. End your response with a concise disclaimer in italics: "*Disclaimer: I am an AI health companion, not a doctor. Please consult a qualified medical provider for medical advice.*"`;

  try {
    const sanitizedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of history) {
      const role = msg.role === "user" ? "user" : "model";
      if (sanitizedContents.length === 0 && role === "model") {
        continue;
      }
      if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === role) {
        sanitizedContents[sanitizedContents.length - 1].parts[0].text += `\n${msg.content}`;
      } else {
        sanitizedContents.push({ role, parts: [{ text: msg.content }] });
      }
    }

    if (sanitizedContents.length > 0 && sanitizedContents[sanitizedContents.length - 1].role === "user") {
      sanitizedContents[sanitizedContents.length - 1].parts[0].text += `\n${query}`;
    } else {
      sanitizedContents.push({ role: "user", parts: [{ text: query }] });
    }

    return await queryGemini(sanitizedContents, systemInstruction, 1500);
  } catch (error: any) {
    console.error("Error in chat assistant:", error);
    const q = query.toLowerCase();

    if (q.includes("pharmacy") || q.includes("buy") || q.includes("order")) {
      return `To use the **Online Pharmacy**:\n\n1. Click **Online Pharmacy** in the left sidebar menu.\n2. Browse over-the-counter medications, health supplements, and healthcare products.\n3. Select your items and proceed to checkout for convenient delivery.\n\n*Disclaimer: Always consult a licensed doctor or pharmacist before starting new medications.*`;
    }

    if (q.includes("drug") || q.includes("research") || q.includes("side effect") || q.includes("interaction")) {
      return `To use **Drug Research**:\n\n1. Click **Drug Research** in the left sidebar menu.\n2. Search any generic or brand medication name (e.g., Paracetamol, Aspirin, Amoxicillin).\n3. Access comprehensive clinical profiles including therapeutic uses, standard adult dosage, side effects, and precautions.\n\n*Disclaimer: I am an AI health companion, not a doctor. Consult a physician for medical advice.*`;
    }

    if (q.includes("appointment") || q.includes("doctor") || q.includes("book") || q.includes("schedule")) {
      return `To manage **Appointments**:\n\n1. Click **Appointments** in the left sidebar menu.\n2. View upcoming consultations or click **Schedule New Appointment**.\n3. Choose your medical specialty, doctor, date, and preferred time slot.\n\n*Disclaimer: For immediate life-threatening medical emergencies, call 112/108 instead of scheduling an appointment.*`;
    }

    if (q.includes("record") || q.includes("upload") || q.includes("lab") || q.includes("report")) {
      return `To use **Medical Records**:\n\n1. Click **Medical Records** in the left sidebar menu.\n2. Upload your lab reports, prescriptions, or discharge summaries.\n3. Lifeline AI automatically categorizes your files and generates an instant AI summary.\n\n*Disclaimer: Maintain physical copies of critical medical documents for clinical visits.*`;
    }

    if (q.includes("medication") || q.includes("pill") || q.includes("tracker")) {
      return `To manage **Medications & Pill Tracker**:\n\n1. Click **Medications** in the left sidebar menu.\n2. Log your active prescriptions, dosage amounts, and intake schedules.\n3. The Drug Interaction Guard automatically checks for conflicts with your allergies or existing prescriptions.\n\n*Disclaimer: Never adjust prescription dosages without consulting your prescribing physician.*`;
    }

    if (q.includes("first aid") || q.includes("emergency")) {
      return `To use **First Aid Health Assistance**:\n\n1. Click **First Aid Assistance** in the left sidebar menu.\n2. Describe your emergency by typing or clicking the **Microphone button** for voice input.\n3. Or click any Quick Emergency Preset (Chest Pain, Thermal Burn, Deep Bleeding, Choking, Toothache).\n4. Click **Get 5-Step First Aid Instructions** for clear, step-by-step guidance.\n\n*Disclaimer: For life-threatening emergencies, call 112 / 108 immediately.*`;
    }

    return `Hello! I am your Lifeline AI Health Companion. Based on your patient profile (Allergies: ${context.allergies || "None declared"}, Active Meds: ${context.activeMedications.map(m => m.name).join(", ") || "None declared"}), feel free to ask me about any symptoms, medication interactions, or navigate any dashboard feature in the left sidebar.\n\n*Disclaimer: I am an AI health companion, not a doctor. Please consult a qualified medical provider for medical advice.*`;
  }
}




const drugCache = new Map<string, any>();

const COMMON_DRUGS: Record<string, any> = {
  "paracetamol": {
    name: "Paracetamol (Acetaminophen)",
    class: "Analgesic & Antipyretic",
    uses: ["Fever reduction", "Mild to moderate pain relief", "Headache & toothache management"],
    dosage: "500mg - 1000mg every 4-6 hours as needed (Max 4000mg/day)",
    sideEffects: ["Rare allergic skin rash", "Liver distress at high doses", "Nausea"],
    precautions: ["Avoid alcohol consumption", "Do not exceed maximum daily dosage", "Caution in chronic liver disease"],
    color: "cyan",
    shape: "round"
  },
  "dolo 650": {
    name: "Dolo 650 (Paracetamol 650mg)",
    class: "Analgesic & Antipyretic",
    uses: ["High fever management", "Body pain & joint discomfort", "Post-vaccination fever"],
    dosage: "1 tablet (650mg) every 6 hours as prescribed by physician",
    sideEffects: ["Mild stomach upset", "Rare skin rash", "Drowsiness"],
    precautions: ["Maintain 6-hour gap between doses", "Avoid combining with other paracetamol products"],
    color: "cyan",
    shape: "oval"
  },
  "aspirin": {
    name: "Aspirin (Acetylsalicylic Acid)",
    class: "NSAID & Antiplatelet",
    uses: ["Pain relief & inflammation", "Cardiovascular prophylaxis", "Fever reduction"],
    dosage: "75mg-100mg daily (cardiac) or 300mg-600mg (pain)",
    sideEffects: ["Stomach irritation or ulcers", "Increased bleeding risk", "Heartburn"],
    precautions: ["Avoid in children under 16", "Take with food", "Avoid in active peptic ulcer"],
    color: "amber",
    shape: "round"
  },
  "ibuprofen": {
    name: "Ibuprofen (Advil, Nurofen)",
    class: "Nonsteroidal Anti-Inflammatory Drug (NSAID)",
    uses: ["Joint & muscle inflammation", "Toothache & headache relief", "Menstrual pain"],
    dosage: "200mg - 400mg every 6-8 hours with food",
    sideEffects: ["Stomach upset", "Dizziness", "Mild elevation in blood pressure"],
    precautions: ["Take after meals", "Caution in kidney impairment or asthma", "Avoid long-term unmonitored use"],
    color: "rose",
    shape: "capsule"
  },
  "amoxicillin": {
    name: "Amoxicillin (Amoxil)",
    class: "Penicillin Antibiotic",
    uses: ["Bacterial respiratory infections", "Ear, nose, and throat infections", "Dental abscesses"],
    dosage: "250mg - 500mg three times daily for 5-7 days",
    sideEffects: ["Nausea or mild diarrhea", "Skin rash", "Oral thrush"],
    precautions: ["Complete full prescribed course", "Contraindicated in penicillin allergy", "Take at evenly spaced intervals"],
    color: "indigo",
    shape: "capsule"
  },
  "cetirizine": {
    name: "Cetirizine (Zyrtec)",
    class: "Antihistamine (Second Generation)",
    uses: ["Allergic rhinitis & sneezing", "Hives & skin itching", "Watery eyes & runny nose"],
    dosage: "10mg once daily, preferably in the evening",
    sideEffects: ["Mild drowsiness", "Dry mouth", "Fatigue"],
    precautions: ["Avoid alcohol", "Caution when operating heavy machinery", "Adjust dose in severe renal impairment"],
    color: "purple",
    shape: "oval"
  },
  "metformin": {
    name: "Metformin (Glucophage)",
    class: "Biguanide Antidiabetic Agent",
    uses: ["Type 2 Diabetes mellitus management", "Insulin sensitivity improvement", "PCOS symptom support"],
    dosage: "500mg - 850mg twice daily with meals",
    sideEffects: ["Gastrointestinal distress", "Metallic taste", "Vitamin B12 deficiency over long term"],
    precautions: ["Take with or after meals to reduce stomach upset", "Monitor kidney function annually"],
    color: "emerald",
    shape: "oval"
  },
  "omeprazole": {
    name: "Omeprazole (Prilosec)",
    class: "Proton Pump Inhibitor (PPI)",
    uses: ["Gastroesophageal reflux disease (GERD)", "Gastric ulcer treatment", "Acidity & heartburn"],
    dosage: "20mg - 40mg once daily before breakfast",
    sideEffects: ["Headache", "Abdominal pain", "Flatulence"],
    precautions: ["Take 30-60 minutes before first meal", "Do not crush or chew delayed-release capsules"],
    color: "blue",
    shape: "capsule"
  }
};

/**
 * Fetch structured drug research profile from cache or Gemini
 */
export async function getDrugProfile(drugName: string): Promise<any> {
  const norm = drugName.toLowerCase().trim();
  
  if (COMMON_DRUGS[norm]) {
    return COMMON_DRUGS[norm];
  }
  
  for (const [key, profile] of Object.entries(COMMON_DRUGS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return profile;
    }
  }

  if (drugCache.has(norm)) {
    return drugCache.get(norm);
  }

  const prompt = `Please provide detailed, patient-friendly clinical information for the medication: "${drugName}".
Provide your answer in the following structured JSON format:
{
  "name": "Generic and Common Brand Names",
  "class": "Drug Class / Category",
  "uses": ["Use 1", "Use 2", "Use 3"],
  "dosage": "Typical adult dosage guidelines",
  "sideEffects": ["Side effect 1", "Side effect 2", "Side effect 3"],
  "precautions": ["Precaution 1", "Precaution 2", "Precaution 3"],
  "color": "cyan | purple | emerald | amber | rose | indigo | blue",
  "shape": "capsule | round | oval"
}

Ensure your response is valid JSON only. Do not wrap it in markdown code blocks.`;

  const systemInstruction = "You are a professional clinical drug information bot. Return accurate drug profiles in structured JSON rapidly.";

  try {
    const contents = [{ role: "user", parts: [{ text: prompt }] }];
    const rawResult = await queryGemini(contents, systemInstruction, 400);
    const parsed = extractJson(rawResult);
    if (parsed && parsed.name) {
      drugCache.set(norm, parsed);
      return parsed;
    }
    throw new Error("Invalid drug JSON structure");
  } catch (error) {
    console.error("Error fetching drug profile from Gemini, returning clinical fallback:", error);
    const fallback = {
      name: drugName.toUpperCase(),
      class: "General Clinical Medication",
      uses: [`Treatment and therapeutic relief associated with ${drugName}`, "Symptom management as prescribed by physician"],
      dosage: "Follow exact dosage instructions provided on prescription packaging or by pharmacist.",
      sideEffects: ["Mild drowsiness or digestive discomfort", "Consult healthcare provider if adverse reactions occur"],
      precautions: ["Take strictly as prescribed", "Keep out of reach of children", "Inform physician of existing allergies"],
      color: "indigo",
      shape: "capsule"
    };
    drugCache.set(norm, fallback);
    return fallback;
  }
}


export interface FirstAidResponse {
  emergencyType: string;
  isLifeThreatening: boolean;
  warningAlert: string;
  steps: string[];
  whenToCall112: string;
}

/**
 * Fetch structured 5-step emergency first-aid advice from Gemini
 */
export async function getFirstAidGuidance(symptomDescription: string): Promise<FirstAidResponse> {
  const prompt = `A user or bystander is describing a medical emergency or physical symptom:
"${symptomDescription}"

Assess the emergency and provide emergency first-aid assistance in the following structured JSON format:
{
  "emergencyType": "Name of identified emergency (e.g., Suspected Heart Attack, Severe Thermal Burn, Deep Bleeding Wound, Choking, Toothache, Allergic Reaction)",
  "isLifeThreatening": true or false (set to true for heart attack, severe chest pain, stroke, severe breathing difficulty, major blood loss, or unconsciousness),
  "warningAlert": "An urgent warning statement. If life-threatening, instruct the user to call 112 in India immediately without waiting.",
  "steps": [
    "Step 1: Immediate action or positioning...",
    "Step 2: Practical first-aid procedure...",
    "Step 3: Monitoring or secondary care...",
    "Step 4: Symptom management or precautions to avoid...",
    "Step 5: Transition to medical care or ambulance arrival protocol..."
  ],
  "whenToCall112": "Critical red-flag symptoms requiring immediate emergency dispatch (112 / 108)."
}

CRITICAL REQUIREMENTS:
1. "steps" MUST contain EXACTLY 5 clear, numbered, easy-to-understand first-aid instructions written in simple language.
2. If life-threatening (e.g. chest pain, heart attack, breathing difficulty, severe bleeding), emphasize calling 112 immediately in India.
3. Do not offer a formal medical diagnosis. Focus strictly on safe, actionable first-aid steps.
4. Ensure the output is valid raw JSON only. Do not wrap in markdown code blocks.`;

  const systemInstruction = "You are an emergency medical first-aid protocol AI. Provide 5 clear, practical, life-saving first-aid steps in simple language. Highlight calling 112 in India for severe symptoms.";

  try {
    const contents = [{ role: "user", parts: [{ text: prompt }] }];
    const rawResult = await queryGemini(contents, systemInstruction);
    const parsed = extractJson(rawResult);
    if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
      return parsed;
    }
    throw new Error("Invalid structure returned from Gemini");
  } catch (error) {
    console.error("Error fetching first aid guidance from Gemini, using symptom-specific fallback:", error);
    const desc = symptomDescription.toLowerCase();

    if (/burn|scald|heat|fire/i.test(desc)) {
      return {
        emergencyType: "Thermal Burn First Aid",
        isLifeThreatening: false,
        warningAlert: "Do not apply ice directly or pop blisters. If burn covers a large area or face, seek emergency care immediately.",
        steps: [
          "Step 1: Immediately remove the heat source and cool the burned area under cool running water for 10 to 20 minutes.",
          "Step 2: Gently remove jewelry or tight clothing near the burn before swelling occurs (do not remove stuck clothing).",
          "Step 3: Cover the burn loosely with sterile gauze or a clean, dry cloth to protect against infection.",
          "Step 4: Take over-the-counter pain relievers (like acetaminophen or ibuprofen) if needed for pain relief.",
          "Step 5: Seek urgent medical attention if blisters cover a large area, or if the burn turns white, charred, or leathery."
        ],
        whenToCall112: "Call 112/108 if the burn is chemical, electrical, involves the face or throat, or covers a large part of the body."
      };
    } else if (/tooth|dent|gum|jaw/i.test(desc)) {
      return {
        emergencyType: "Dental & Toothache Relief",
        isLifeThreatening: false,
        warningAlert: "Avoid placing aspirin directly against gums as it causes tissue burns. Schedule a dental evaluation as soon as possible.",
        steps: [
          "Step 1: Rinse your mouth thoroughly with warm salt water (half a teaspoon of salt in warm water) to clean the area.",
          "Step 2: Gently use dental floss to remove any trapped food particles between the teeth.",
          "Step 3: Apply a cold compress or ice pack wrapped in a cloth to the outside of your cheek for 15-minute intervals.",
          "Step 4: Take over-the-counter pain relievers such as ibuprofen or acetaminophen as directed on the label.",
          "Step 5: Avoid extremely hot, cold, or sugary foods, and contact a dentist promptly for treatment."
        ],
        whenToCall112: "Call emergency services or seek emergency room care if swelling spreads to your eye, neck, or causes difficulty swallowing or breathing."
      };
    } else if (/bleed|wound|cut|hemorrhage|blood/i.test(desc)) {
      return {
        emergencyType: "Bleeding & Deep Wound Care",
        isLifeThreatening: desc.includes("severe") || desc.includes("heavy") || desc.includes("profuse"),
        warningAlert: "Apply firm, continuous pressure to control bleeding. Do not remove soaked cloths—add more layers directly on top.",
        steps: [
          "Step 1: Apply direct, firm pressure on the wound using a clean cloth, towel, or sterile gauze pad.",
          "Step 2: Maintain continuous pressure for at least 10 to 15 minutes without lifting the cloth to inspect.",
          "Step 3: Elevate the bleeding limb above the level of the heart if possible while continuing firm pressure.",
          "Step 4: Once bleeding slows, secure the bandage firmly with medical tape or a clean cloth wrap.",
          "Step 5: Seek urgent clinical evaluation for deep cuts requiring sutures or tetanus immunization."
        ],
        whenToCall112: "Call 112/108 immediately if blood spurts continuously, bleeding persists after 15 mins of direct pressure, or victim feels faint."
      };
    } else if (/chok|airway|gasp|swallow/i.test(desc)) {
      return {
        emergencyType: "Choking & Airway Obstruction",
        isLifeThreatening: true,
        warningAlert: "URGENT: If the person cannot speak, cough, or breathe, perform Heimlich maneuver (abdominal thrusts) immediately!",
        steps: [
          "Step 1: Stand behind the person and lean them slightly forward. Give up to 5 sharp back blows between shoulder blades with heel of hand.",
          "Step 2: If back blows fail, perform up to 5 abdominal thrusts: place fist above navel, grasp with other hand, thrust inward and upward.",
          "Step 3: Alternate between 5 back blows and 5 abdominal thrusts until object is dislodged or person becomes unconscious.",
          "Step 4: If person loses consciousness, lower gently to ground and begin CPR (30 chest compressions, check mouth before rescue breaths).",
          "Step 5: Ensure emergency services (112) are dispatched immediately while continuing first aid."
        ],
        whenToCall112: "Call 112 / 108 immediately if choking is not resolved within seconds or if the victim loses consciousness."
      };
    } else if (/chest|heart|attack|pressure|arm pain|stroke/i.test(desc)) {
      return {
        emergencyType: "Suspected Myocardial Infarction / Chest Pain",
        isLifeThreatening: true,
        warningAlert: "CRITICAL: Call 112 / 108 immediately. Have the person sit down immediately and remain still.",
        steps: [
          "Step 1: Call 112 or 108 emergency hotline immediately and request an emergency medical team.",
          "Step 2: Have the person stop all exertion and sit down in a comfortable position (sitting upright on floor against a wall).",
          "Step 3: Loosen tight clothing around the neck, chest, and waist to ease breathing effort.",
          "Step 4: Ask if patient has prescribed emergency medication (like nitroglycerin) or chewable aspirin if appropriate.",
          "Step 5: Continuously monitor responsiveness and breathing until emergency medical responders arrive."
        ],
        whenToCall112: "Call 112 / 108 immediately for severe chest pressure, crushing pain radiating to arm/jaw, or shortness of breath."
      };
    } else {
      return {
        emergencyType: "General First Aid & Symptom Care",
        isLifeThreatening: false,
        warningAlert: "If symptoms worsen, become severe, or cause distress, contact local emergency medical services (112) immediately.",
        steps: [
          "Step 1: Pause physical activity and assist the person into a comfortable, safe sitting or lying position.",
          "Step 2: Check vital signs (airway, breathing, alertness) and ensure fresh airflow around the individual.",
          "Step 3: Administer basic symptom relief: apply cool compress for fever/pain, or offer small sips of water if fully conscious.",
          "Step 4: Monitor closely for red-flag symptoms such as severe pain, dizziness, nausea, or breathing changes.",
          "Step 5: Consult a healthcare professional or contact emergency service 112 if symptoms do not improve quickly."
        ],
        whenToCall112: "Call 112/108 immediately for severe chest pain, extreme breathlessness, sudden weakness, or loss of consciousness."
      };
    }
  }

}


