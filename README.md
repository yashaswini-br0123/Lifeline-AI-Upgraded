# 🏥 LifeLine AI — Intelligent Healthcare & Emergency Assistance Platform

> **Hack2Skill AI Code Submission Document**  
> **Vertical**: Healthcare & Clinical Decision Support  
> **Live Web Application**: [https://lifeline-ai-upgraded.vercel.app](https://lifeline-ai-upgraded.vercel.app)  
> **GitHub Repository**: [yashaswini-br0123/Lifeline-AI-Upgraded](https://github.com/yashaswini-br0123/Lifeline-AI-Upgraded)

---

## 🎯 1. Chosen Vertical
**Healthcare & Emergency Clinical Support**

LifeLine AI is an end-to-end, AI-powered health management platform designed to bridge the gap between patient emergency symptoms, drug interaction safety, medical records storage, and clinical navigation.

---

## 🧠 2. Approach & Logic

LifeLine AI approaches healthcare assistance through a multi-tier clinical intelligence framework:

1. **Context-Aware Emergency Triage (First Aid Assistance)**:
   - Evaluates patient symptoms supplied via **Voice (Web Speech API)** or **Text**.
   - Uses AI reasoning to assess emergency severity instantly.
   - For life-threatening emergencies (e.g., suspected myocardial infarction, respiratory distress, profuse arterial bleeding), it triggers immediate **112 / 108 emergency hotline action banners**.
   - Generates **5 clear, numbered, step-by-step first-aid instructions** in plain language.

2. **AI Companion & Clinical Symptom Checker**:
   - Maintains full user clinical history context (age, blood type, known allergies, chronic conditions) to provide personalized guidance.
   - Provides structured advice while emphasizing safety boundaries.

3. **Drug Research & Interaction Guard**:
   - Parses pharmaceutical queries for side effects, contraindications, and dosage warnings.
   - Evaluates potential drug-drug interactions before users record new prescriptions.

4. **Integrated Patient Health Record (PHR)**:
   - Unified vault for managing digital medical records, active prescription regimens, and upcoming doctor appointments.

---

## ⚙️ 3. How the Solution Works

### Technology Stack
- **Framework**: Next.js 16 (App Router with Server & Client Components)
- **Programming Language**: TypeScript (Strict type checking)
- **AI Core**: Google Gemini API (`@google/genai` with `gemini-flash-latest`)
- **Speech Recognition**: Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`)
- **Database & ORM**: Prisma ORM with SQLite database
- **Authentication**: JWT signed session cookies with `bcryptjs` password hashing
- **Styling & UI**: Tailwind CSS, Lucide Icons, glassmorphism design system

### Architecture Diagram & Workflow

```
[ User Input (Voice/Text) ]
             │
             ▼
[ Next.js Client Component ] (Speech-to-Text / UI)
             │
             ▼
[ Authenticated API Route (/api/first-aid) ] (JWT Verification)
             │
             ▼
[ Gemini AI Triage Engine (src/lib/gemini.ts) ]
             │
   ┌─────────┴─────────┐
   ▼                   ▼
[ 112/108 Hotline ] [ 5 Step Instructions ]
```

---

## 📋 4. Key Assumptions & Safety Guardrails

1. **Emergency Callout Protocols**:
   - The AI is programmed with strict triage rules: any symptom indicating acute cardiac, respiratory, or neurologic failure immediately presents standard emergency service numbers (**112 / 108** in India).
2. **Clinical Disclaimer**:
   - AI outputs are intended for decision-support and immediate first-aid guidance only, not to replace licensed medical emergency physicians.
3. **Graceful Fallback & Rate Resilience**:
   - If network or API quota limits occur, system safety fallbacks return pre-validated emergency guidelines to ensure user safety is never compromised.

---

## 🛡️ 5. Evaluation Focus Areas

### 🔒 Security & Privacy
- **Zero Exposed Secrets**: All AI calls execute strictly on the server-side via Next.js API routes (`src/app/api/...`). API keys are stored safely in `.env` environment variables and omitted from Git via `.gitignore`.
- **Session Protection**: Passwords are hashed with `bcryptjs` before storage; sessions rely on `HttpOnly` `SameSite=Lax` JWT cookies.

### ⚡ Efficiency & Resource Optimization
- **Minimal Repository Footprint**: Complete source code zip archive size is **~101 KB (0.1 MB)**, well below the 10 MB limit.
- **Fast Build**: Server-side page generation and static page optimization complete in seconds.

### ♿ Accessibility & Inclusivity
- **Voice-Enabled Interface**: Integrated microphone recording for users in physical distress who cannot type.
- **Accessible UI**: High-contrast slate theme, semantic HTML5 sectioning (`<header>`, `<aside>`, `<main>`), full keyboard focus states, and backdrop overlays for mobile drawer navigation.

---

## 🚀 6. Getting Started & Local Setup

### Prerequisites
- Node.js 18+ and npm

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yashaswini-br0123/Lifeline-AI-Upgraded.git
   cd Lifeline-AI-Upgraded
   ```

2. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Set your `GEMINI_API_KEY` in `.env`.

3. **Install Dependencies & Initialize Database**:
   ```bash
   npm install
   npx prisma db push
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 7. Verification & Testing

- **TypeScript Compilation Check**: `npx tsc --noEmit` — 0 Errors.
- **Production Build Verification**: Successfully built and deployed to Vercel production.
