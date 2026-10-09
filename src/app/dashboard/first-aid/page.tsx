"use client";

import { useState, useEffect, useRef } from "react";
import {
  HeartPulse,
  Mic,
  MicOff,
  AlertTriangle,
  PhoneCall,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Info,
  Activity,
  Flame,
  Droplet,
  Stethoscope,
} from "lucide-react";

interface FirstAidGuidance {
  emergencyType: string;
  isLifeThreatening: boolean;
  warningAlert: string;
  steps: string[];
  whenToCall112: string;
}

const EMERGENCY_PRESETS = [
  { label: "Chest Pain / Heart Attack", query: "Person has sudden severe chest pain, shortness of breath, and left arm pain.", icon: Activity },
  { label: "Severe Thermal Burn", query: "Accidental boiling water burn on arm with blisters and severe pain.", icon: Flame },
  { label: "Deep Wound Bleeding", query: "Deep cut on arm bleeding heavily and not stopping with light pressure.", icon: Droplet },
  { label: "Choking / Breathing Trouble", query: "Person is choking on food and struggling to breathe or speak.", icon: ShieldAlert },
  { label: "Severe Toothache", query: "Severe throbbing toothache with jaw swelling and sharp pain.", icon: Stethoscope },
];

export default function FirstAidPage() {
  const [symptomText, setSymptomText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<FirstAidGuidance | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setSymptomText(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      alert("Voice input is not supported in this browser. Please type your description.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
      }
    }
  };

  const handleGetFirstAid = async (queryText: string) => {
    if (!queryText.trim()) return;

    setLoading(true);
    setError(null);
    setGuidance(null);

    try {
      const res = await fetch("/api/first-aid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: queryText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch first aid instructions.");
      }

      if (!data.guidance || !data.guidance.steps) {
        throw new Error("Invalid response format received from AI assistance core.");
      }

      setGuidance(data.guidance);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. If this is a medical crisis, call 112 immediately.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 bg-slate-950 text-slate-100 min-h-full relative overflow-y-auto">
      {/* Background ambient glow */}
      <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      {/* Title & Subtitle */}
      <div className="relative z-10 max-w-3xl space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <HeartPulse className="w-8 h-8 text-rose-500 animate-pulse" />
          First Aid Health Assistance
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Get immediate 5-step emergency first-aid protocols. Type or speak your symptoms below.
        </p>
      </div>

      {/* Emergency Hotline Alert Banner */}
      <div className="bg-gradient-to-r from-rose-500/15 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-5 relative z-10 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400 mt-0.5">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                Critical Medical Emergency Notice
              </h3>
              <p className="text-xs text-rose-200/90 leading-relaxed max-w-2xl font-light">
                For life-threatening symptoms—such as suspected heart attack, chest tightness, severe bleeding, or breathing collapse—<strong>call 112 in India immediately</strong> instead of waiting for AI guidance.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="tel:112"
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-md shadow-rose-600/30 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              Call 112 (Emergency)
            </a>
            <a
              href="tel:108"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              Call 108 (Ambulance)
            </a>
          </div>
        </div>
      </div>

      {/* Input Box Area */}
      <div className="relative z-10 max-w-3xl bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
            <span>Describe the Medical Situation or Symptoms</span>
            {isListening && (
              <span className="text-rose-400 font-bold animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Listening to speech...
              </span>
            )}
          </label>
          <div className="relative">
            <textarea
              value={symptomText}
              onChange={(e) => setSymptomText(e.target.value)}
              placeholder="Type or speak symptoms (e.g., 'Severe chest pain radiating to arm', 'Boiling water burn on hand', 'Choking on food')..."
              className="w-full h-32 p-4 pr-14 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 outline-none text-sm text-white placeholder:text-slate-600 resize-none transition-all"
            />
            {/* Voice Input Microphone button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? "Stop Voice Input" : "Start Voice Input"}
              className={`absolute top-3.5 right-3.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-500/40"
                  : "bg-slate-900 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
              }`}
            >
              {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Quick Emergency Presets */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Quick Presets</span>
          <div className="flex flex-wrap gap-2">
            {EMERGENCY_PRESETS.map((preset) => {
              const IconComponent = preset.icon;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSymptomText(preset.query);
                    handleGetFirstAid(preset.query);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-rose-500/40 hover:bg-rose-500/5 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <IconComponent className="w-3.5 h-3.5 text-rose-400" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleGetFirstAid(symptomText)}
          disabled={loading || !symptomText.trim()}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 font-extrabold text-white text-sm shadow-lg shadow-rose-600/20 hover:shadow-rose-600/40 active:scale-[0.99] transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating 5-Step First Aid Protocol...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Get 5-Step First Aid Instructions
            </>
          )}
        </button>
      </div>

      {/* Output Results View */}
      <div className="relative z-10 max-w-3xl space-y-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-slate-900/20 border border-slate-800/60 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
            <p className="text-sm font-semibold text-slate-300">Formulating immediate first-aid steps...</p>
            <p className="text-xs text-slate-550">Consulting emergency triage guidelines...</p>
          </div>
        )}

        {error && (
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-white">Service Error</p>
              <p className="text-xs text-rose-200/90 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {guidance && !loading && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header & Classification Badge */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Triage Classification</span>
                  <h2 className="text-xl font-bold text-white mt-0.5">{guidance.emergencyType}</h2>
                </div>
                {guidance.isLifeThreatening && (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-black uppercase tracking-wider shrink-0 animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    Life-Threatening Emergency
                  </span>
                )}
              </div>

              {/* Warning Alert Box */}
              <div className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed flex items-start gap-3 ${
                guidance.isLifeThreatening
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-200"
                  : "bg-amber-500/15 border-amber-500/30 text-amber-200"
              }`}>
                <Info className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div>{guidance.warningAlert}</div>
              </div>
            </div>

            {/* 5 Numbered First Aid Steps */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2 px-1">
                <CheckCircle2 className="w-4.5 h-4.5 text-rose-400" />
                5-Step First Aid Protocol
              </h3>

              <div className="space-y-3">
                {guidance.steps.map((stepText, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/40 border border-slate-800 hover:border-slate-750 rounded-2xl p-5 flex items-start gap-4 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center shrink-0 font-extrabold text-sm text-white shadow-md">
                      {idx + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm text-slate-200 font-medium leading-relaxed">
                        {stepText}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Red Flag "When to call 112" box */}
            {guidance.whenToCall112 && (
              <div className="bg-slate-900/40 border border-rose-500/30 rounded-2xl p-6 space-y-3">
                <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <PhoneCall className="w-4 h-4" />
                  Red Flag Warning Symptoms (Call 112 / 108)
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {guidance.whenToCall112}
                </p>
              </div>
            )}

            {/* Medical Disclaimer */}
            <p className="text-[10px] text-slate-550 italic text-center leading-relaxed">
              *Disclaimer: This AI first-aid guide is for educational emergency assistance only and does not replace professional emergency medical personnel. If condition worsens or if symptoms are severe, call 112 immediately.*
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
