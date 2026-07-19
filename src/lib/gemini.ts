const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash";

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

async function queryGemini(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  systemInstruction?: string
): Promise<string> {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;
  
  const body: any = {
    contents
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [
        { text: systemInstruction }
      ]
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  return text;
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

  const systemInstruction = `You are "Lifeline Companion", an advanced, friendly, and professional personal health AI assistant. 
Your patient is ${context.name}.
Patient Profile & Medical Context:
- Name: ${context.name}
- Age: ${context.age !== null ? context.age : "Not specified"}
- Blood Type: ${context.bloodType || "Not specified"}
- Allergies: ${context.allergies || "None declared"}
- Chronic Conditions: ${context.chronicConditions || "None declared"}
- Active Medications:\n${existingMedsStr}
- Recent Medical Records:\n${recentRecordsStr}

Guidelines:
1. Give responses tailored specifically to the patient's context (e.g., if they ask about taking ibuprofen, remind them of any NSAID allergies or kidney issues they have).
2. Explain complex medical concepts in simple, reassuring, and clear patient-friendly language.
3. If they ask about symptoms that suggest an emergency (e.g., sudden chest pain, shortness of breath, severe head injury, facial drooping), advise them to seek immediate emergency care and contact their emergency contacts.
4. **CRITICAL**: Always include a supportive medical disclaimer at the bottom of your response in italics (e.g., "*Disclaimer: I am an AI health companion, not a doctor. Please consult a qualified medical provider for medical advice.*"). Keep it neat and distinct.
5. Use markdown lists and headings for high readability.`;

  try {
    // Map history to Gemini format
    const contents = history.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));
    
    // Add the new user message to contents
    contents.push({
      role: "user",
      parts: [{ text: query }]
    });

    return await queryGemini(contents, systemInstruction);
  } catch (error: any) {
    console.error("Error in chat assistant:", error);
    return `I apologize, ${context.name}, but I encountered an error communicating with my AI core. Please check your network connection and try again.\n\n*Disclaimer: I am an AI health companion, not a doctor. Please consult a qualified medical provider for medical advice.*`;
  }
}

/**
 * Fetch structured drug research profile from Gemini
 */
export async function getDrugProfile(drugName: string): Promise<any> {
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

  const systemInstruction = "You are a professional clinical drug information bot. Your job is to return accurate, evidence-based medication profiles in structured JSON. If the requested drug name does not exist, return an empty object {} or error key.";

  try {
    const contents = [{ role: "user", parts: [{ text: prompt }] }];
    const rawResult = await queryGemini(contents, systemInstruction);
    
    let cleanJson = rawResult.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.slice(7);
    }
    if (cleanJson.endsWith("```")) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error fetching drug profile from Gemini:", error);
    throw error;
  }
}
