"use client";

import { useEffect, useState } from "react";
import {
  Pill,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Sparkles,
  Info,
  Loader2,
  X,
  FileText,
} from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  schedule: string;
  instructions: string | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
  flaggedConflicts: string | null;
}

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [schedule, setSchedule] = useState("");
  const [instructions, setInstructions] = useState("");
  const [endDate, setEndDate] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const fetchMedications = async () => {
    try {
      const res = await fetch("/api/medications");
      if (res.ok) {
        const data = await res.json();
        setMedications(data.medications || []);
      }
    } catch (err) {
      console.error("Error loading medications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage || !schedule) {
      setError("Name, dosage, and schedule are required.");
      return;
    }

    setAddLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dosage,
          schedule,
          instructions,
          endDate: endDate || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to log medication.");
      }

      // Refresh list, close modal, clear form
      fetchMedications();
      setShowAddModal(false);
      setName("");
      setDosage("");
      setSchedule("");
      setInstructions("");
      setEndDate("");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/medications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !currentStatus }),
      });

      if (res.ok) {
        fetchMedications();
      }
    } catch (err) {
      console.error("Failed to toggle medication status:", err);
    }
  };

  const handleDeleteMedication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medication from history?")) return;
    try {
      const res = await fetch(`/api/medications?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchMedications();
      }
    } catch (err) {
      console.error("Failed to delete medication:", err);
    }
  };

  // Helper to parse interaction risk tags
  const renderConflictWarning = (conflictText: string | null) => {
    if (!conflictText) return null;

    let bgClass = "bg-sky-500/10 border-sky-500/25 text-sky-400";
    let icon = <Info className="w-4.5 h-4.5 shrink-0 text-sky-400" />;
    let title = "Clinical Warning";

    if (conflictText.includes("[SEVERE]")) {
      bgClass = "bg-rose-500/10 border-rose-500/25 text-rose-400";
      icon = <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-rose-400 animate-pulse" />;
      title = "Severe Interaction Alert";
    } else if (conflictText.includes("[MODERATE]")) {
      bgClass = "bg-amber-500/10 border-amber-500/25 text-amber-400";
      icon = <AlertTriangle className="w-4.5 h-4.5 shrink-0 text-amber-400" />;
      title = "Moderate Interaction Precaution";
    } else if (conflictText.includes("[INFO]")) {
      bgClass = "bg-yellow-500/10 border-yellow-500/25 text-yellow-400";
      icon = <Info className="w-4.5 h-4.5 shrink-0 text-yellow-400" />;
      title = "Precaution Advisory";
    }

    // Clean tag prefix for rendering
    const cleanedText = conflictText
      .replace("[SEVERE]", "")
      .replace("[MODERATE]", "")
      .replace("[INFO]", "")
      .replace("[SAFE]", "")
      .trim();

    return (
      <div className={`mt-4 p-4 rounded-xl border flex flex-col gap-1.5 ${bgClass}`}>
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
          {icon}
          <span>{title}</span>
        </div>
        <p className="text-xs leading-normal font-light">{cleanedText}</p>
      </div>
    );
  };

  const activeMeds = medications.filter((m) => m.active);
  const inactiveMeds = medications.filter((m) => !m.active);

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 bg-slate-950 text-slate-100 min-h-full relative">
      {/* Decorative Blur glows */}
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      {/* Title bar & Log button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Pill className="w-8 h-8 text-cyan-400" />
            Medications Tracker
          </h1>
          <p className="text-slate-400 text-sm">
            Maintain your drug logs and check automatically for clinical conflicts.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Medication
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <span>Analyzing logged pharmacotherapy...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Medications List */}
          <div className="space-y-4">
            <h2 className="text-md font-bold tracking-wide uppercase text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              Active Prescriptions ({activeMeds.length})
            </h2>

            {activeMeds.length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-8 text-center max-w-lg">
                <Pill className="w-8 h-8 text-slate-650 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-semibold">No active medications registered</p>
                <p className="text-xs text-slate-500 mt-1 leading-normal">
                  Log your active medications to enable interaction checking with other medicines or chronic conditions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeMeds.map((med) => (
                  <div
                    key={med.id}
                    className="relative overflow-hidden bg-slate-900/30 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-4">
                      {/* Name / Dosage */}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-extrabold text-lg text-white">{med.name}</h3>
                          <p className="text-xs text-cyan-400 font-semibold mt-0.5">{med.dosage}</p>
                        </div>
                        <button
                          onClick={() => handleToggleActive(med.id, med.active)}
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wide hover:bg-emerald-500/20 transition-all cursor-pointer"
                        >
                          Active
                        </button>
                      </div>

                      {/* Instructions / Schedule */}
                      <div className="space-y-2.5 text-xs text-slate-350">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>Schedule: <strong className="text-slate-200">{med.schedule}</strong></span>
                        </div>
                        {med.instructions && (
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">Instructions: {med.instructions}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-500">
                          <Calendar className="w-4 h-4" />
                          <span>Logged: {new Date(med.startDate).toLocaleDateString()}</span>
                          {med.endDate && (
                            <span>&bull; Ends: {new Date(med.endDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Conflict alerts */}
                      {renderConflictWarning(med.flaggedConflicts)}
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-900">
                      <button
                        onClick={() => handleDeleteMedication(med.id)}
                        className="p-2 rounded-lg bg-slate-950 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-slate-900 hover:border-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inactive Medications List (History) */}
          {inactiveMeds.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-slate-900">
              <h2 className="text-md font-bold tracking-wide uppercase text-slate-500 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-650 shrink-0" />
                History & Inactive ({inactiveMeds.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inactiveMeds.map((med) => (
                  <div
                    key={med.id}
                    className="bg-slate-900/15 border border-slate-900 rounded-2xl p-6 flex flex-col justify-between opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-300 line-through">{med.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{med.dosage}</p>
                        </div>
                        <button
                          onClick={() => handleToggleActive(med.id, med.active)}
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 uppercase tracking-wide hover:bg-slate-700 transition-all cursor-pointer"
                        >
                          Inactive
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-2 border-t border-slate-900">
                      <button
                        onClick={() => handleDeleteMedication(med.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Log Medication
              </h2>
              <p className="text-xs text-slate-400 leading-normal">
                Logging scans your medical history for immediate contraindications.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddMedication} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">Medication Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lisinopril, Lipitor"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all placeholder:text-slate-650"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Dosage */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">Dosage</label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 10mg, 500mg"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all placeholder:text-slate-650"
                  />
                </div>

                {/* Schedule */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">Schedule</label>
                  <input
                    type="text"
                    required
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    placeholder="e.g. Every morning, Twice a day"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all placeholder:text-slate-650"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">Instructions (Optional)</label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take with food, avoid alcohol"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all placeholder:text-slate-650"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">End Date (Optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={addLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold text-white shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {addLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Screening Conflicts...
                  </>
                ) : (
                  "Add Medication"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
