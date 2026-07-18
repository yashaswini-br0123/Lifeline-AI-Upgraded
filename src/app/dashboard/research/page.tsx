"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  AlertTriangle,
  BookOpen,
  CheckCircle,
  HelpCircle,
  ShieldAlert,
  Activity,
} from "lucide-react";

interface DrugProfile {
  name: string;
  class: string;
  uses: string[];
  dosage: string;
  sideEffects: string[];
  precautions: string[];
  color: string; // "cyan" | "purple" | "emerald" | "amber" | "rose" | "indigo" | "blue"
  shape: string; // "capsule" | "round" | "oval"
}

const BROWSE_SUGGESTIONS = [
  { name: "Metformin", label: "Diabetes" },
  { name: "Amoxicillin", label: "Antibiotic" },
  { name: "Atorvastatin", label: "Cholesterol" },
  { name: "Ibuprofen", label: "Pain Relief" },
  { name: "Aspirin", label: "Cardio Care" },
  { name: "Cetirizine", label: "Allergy Relief" },
];

export default function DrugResearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DrugProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"uses" | "dosage" | "sideEffects" | "precautions">("uses");

  const handleSearch = async (name: string) => {
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      const res = await fetch(`/api/drug-research?name=${encodeURIComponent(name)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch drug information.");
      }

      if (!data.profile || !data.profile.name) {
        throw new Error("Medication profile not found. Please try another name.");
      }

      setProfile(data.profile);
      setActiveTab("uses");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const getPillColorClasses = (color: string) => {
    switch (color) {
      case "purple":
        return {
          left: "from-purple-500 to-purple-600 shadow-purple-500/20",
          right: "from-indigo-600 to-indigo-700 shadow-indigo-600/20",
          glow: "bg-purple-500/10",
          text: "text-purple-400 border-purple-500/20 bg-purple-500/5",
        };
      case "emerald":
        return {
          left: "from-emerald-400 to-emerald-500 shadow-emerald-500/20",
          right: "from-teal-600 to-teal-700 shadow-teal-600/20",
          glow: "bg-emerald-500/10",
          text: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
        };
      case "amber":
        return {
          left: "from-amber-450 to-amber-500 shadow-amber-500/20",
          right: "from-orange-600 to-orange-700 shadow-orange-600/20",
          glow: "bg-amber-500/10",
          text: "text-amber-400 border-amber-500/20 bg-amber-500/5",
        };
      case "rose":
        return {
          left: "from-rose-500 to-rose-600 shadow-rose-500/20",
          right: "from-pink-600 to-pink-700 shadow-pink-600/20",
          glow: "bg-rose-500/10",
          text: "text-rose-455 border-rose-500/20 bg-rose-500/5",
        };
      case "indigo":
        return {
          left: "from-indigo-500 to-indigo-600 shadow-indigo-500/20",
          right: "from-blue-600 to-blue-700 shadow-blue-600/20",
          glow: "bg-indigo-500/10",
          text: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
        };
      case "blue":
        return {
          left: "from-blue-400 to-blue-500 shadow-blue-500/20",
          right: "from-cyan-600 to-cyan-700 shadow-cyan-600/20",
          glow: "bg-blue-500/10",
          text: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
        };
      case "cyan":
      default:
        return {
          left: "from-cyan-400 to-cyan-500 shadow-cyan-500/20",
          right: "from-slate-650 to-slate-700 shadow-slate-650/20",
          glow: "bg-cyan-500/10",
          text: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
        };
    }
  };

  const renderPillModel = (shape: string, color: string) => {
    const theme = getPillColorClasses(color);

    if (shape === "capsule") {
      return (
        <div className="relative flex items-center justify-center h-28 w-48 mx-auto animate-float">
          {/* Ambient Glow */}
          <div className={`absolute inset-4 rounded-full blur-[30px] transition-all duration-300 ${theme.glow}`} />
          {/* Left Cap */}
          <div className={`w-16 h-10 rounded-l-full bg-gradient-to-r shadow-lg border-y border-l border-white/10 ${theme.left}`} />
          {/* Joiner */}
          <div className="w-1.5 h-10 bg-slate-950 border-y border-white/5 relative z-10" />
          {/* Right Cap */}
          <div className={`w-16 h-10 rounded-r-full bg-gradient-to-r shadow-lg border-y border-r border-white/10 ${theme.right}`} />
        </div>
      );
    }

    if (shape === "oval") {
      return (
        <div className="relative flex items-center justify-center h-28 w-28 mx-auto animate-float">
          <div className={`absolute inset-2 rounded-full blur-[25px] transition-all duration-300 ${theme.glow}`} />
          <div className={`w-24 h-12 rounded-full bg-gradient-to-br border border-white/10 shadow-lg relative flex items-center justify-center ${theme.left}`}>
            {/* Center score line */}
            <div className="w-0.5 h-12 bg-white/20" />
          </div>
        </div>
      );
    }

    // Default Round Pill
    return (
      <div className="relative flex items-center justify-center h-28 w-28 mx-auto animate-float">
        <div className={`absolute inset-2 rounded-full blur-[25px] transition-all duration-300 ${theme.glow}`} />
        <div className={`w-20 h-20 rounded-full bg-gradient-to-br border border-white/10 shadow-lg relative flex items-center justify-center ${theme.left}`}>
          {/* Score line */}
          <div className="w-px h-20 bg-white/20 transform rotate-45" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 bg-slate-950 text-slate-100 min-h-full relative overflow-y-auto">
      {/* Background glow effects */}
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header Title */}
      <div className="relative z-10 max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-cyan-400" />
          Global Medicine & Drug Research
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Search details, uses, dosages, and safety contraindications for any pharmaceutical tablet or medication worldwide.
        </p>
      </div>

      {/* Search Input bar */}
      <div className="relative z-10 max-w-2xl bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchQuery);
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Enter medication name (e.g. Paracetamol, Metformin, Lipitor)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all placeholder:text-slate-650"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold text-white shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </button>
        </form>

        {/* Suggestion Chips */}
        <div className="space-y-2">
          <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider block">Popular Queries</span>
          <div className="flex flex-wrap gap-2">
            {BROWSE_SUGGESTIONS.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setSearchQuery(item.name);
                  handleSearch(item.name);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-cyan-500/35 hover:bg-slate-900/40 text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{item.name}</span>
                <span className="text-[9px] text-cyan-500 font-normal">({item.label})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search results view */}
      <div className="relative z-10 max-w-4xl">
        {loading && (
          <div className="flex flex-col items-center gap-3 text-slate-400 text-sm font-medium py-16">
            <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
            <span>Consulting clinical databases for drug monographs...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-455 text-sm max-w-xl mx-auto">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {profile && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-900/20 border border-slate-850 rounded-2xl p-6 md:p-8 animate-fadeIn">
            
            {/* Left: Pill Model and Classification */}
            <div className="flex flex-col items-center justify-center space-y-6 md:border-r border-slate-900 md:pr-8">
              {/* Pill Visual model */}
              <div className="p-4 bg-slate-950/20 border border-slate-900/60 rounded-2xl w-full flex items-center justify-center">
                {renderPillModel(profile.shape, profile.color)}
              </div>
              <div className="text-center space-y-2 w-full">
                <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                <span className={`inline-block px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getPillColorClasses(profile.color).text}`}>
                  {profile.class}
                </span>
                <p className="text-[10px] text-slate-550 italic leading-normal px-2 pt-1 border-t border-slate-900/60 mt-4">
                  Visual pill styling modeled from category parameters. Always read package insert labels for absolute verification.
                </p>
              </div>
            </div>

            {/* Right: Detailed Drug Tabs */}
            <div className="md:col-span-2 flex flex-col space-y-6">
              {/* Tabs buttons */}
              <div className="flex border-b border-slate-900 pb-px">
                <button
                  onClick={() => setActiveTab("uses")}
                  className={`pb-3 px-4 text-xs font-bold relative transition-all cursor-pointer ${
                    activeTab === "uses" ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Clinical Uses
                  {activeTab === "uses" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("dosage")}
                  className={`pb-3 px-4 text-xs font-bold relative transition-all cursor-pointer ${
                    activeTab === "dosage" ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Dosage
                  {activeTab === "dosage" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("sideEffects")}
                  className={`pb-3 px-4 text-xs font-bold relative transition-all cursor-pointer ${
                    activeTab === "sideEffects" ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Side Effects
                  {activeTab === "sideEffects" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("precautions")}
                  className={`pb-3 px-4 text-xs font-bold relative transition-all cursor-pointer ${
                    activeTab === "precautions" ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Precautions
                  {activeTab === "precautions" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                  )}
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="flex-1 bg-slate-950/20 border border-slate-900 p-5 rounded-xl min-h-60">
                {activeTab === "uses" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wide flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                      Approved Clinical Indications
                    </h3>
                    <ul className="space-y-2.5">
                      {profile.uses.map((use, idx) => (
                        <li key={idx} className="text-sm text-slate-250 leading-relaxed pl-5 relative before:content-[''] before:absolute before:left-1 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-cyan-400">
                          {use}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === "dosage" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wide flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Dosage Instructions
                    </h3>
                    <p className="text-sm text-slate-250 leading-relaxed">
                      {profile.dosage}
                    </p>
                  </div>
                )}

                {activeTab === "sideEffects" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wide flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-rose-455" />
                      Adverse Reactions & Side Effects
                    </h3>
                    <ul className="space-y-2.5">
                      {profile.sideEffects.map((effect, idx) => (
                        <li key={idx} className="text-sm text-slate-250 leading-relaxed pl-5 relative before:content-[''] before:absolute before:left-1 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-rose-455">
                          {effect}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === "precautions" && (
                  <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase text-slate-400 tracking-wide flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-450 animate-pulse" />
                      Critical Safety Precautions
                    </h3>
                    <ul className="space-y-2.5">
                      {profile.precautions.map((pre, idx) => (
                        <li key={idx} className="text-sm text-slate-250 leading-relaxed pl-5 relative before:content-[''] before:absolute before:left-1 before:top-2 before:w-1.5 before:h-1.5 before:rounded-full before:bg-amber-450">
                          {pre}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-slate-500 italic mt-auto">
                *Disclaimer: The information above is powered by AI and provided for educational research only. It is not medical advice. Consult a doctor or healthcare professional before consuming or changing medications.*
              </p>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
