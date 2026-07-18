"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  Clock,
  User,
  Stethoscope,
  FileText,
  CheckCircle,
  XCircle,
  ChevronRight,
  Filter,
  Video,
  ExternalLink,
} from "lucide-react";

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  dateTime: string;
  notes: string | null;
  status: "Scheduled" | "Completed" | "Cancelled";
  createdAt: string;
}

const SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Dermatology",
  "Endocrinology",
  "Gynecology",
  "Neurology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "General Surgery",
  "Other",
];

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");

  // Form states
  const [doctorName, setDoctorName] = useState("");
  const [specialty, setSpecialty] = useState("General Medicine");
  const [dateTime, setDateTime] = useState("");
  const [notes, setNotes] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName || !specialty || !dateTime) {
      setError("Doctor name, specialty, and date/time are required.");
      return;
    }

    setAddLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName,
          specialty,
          dateTime,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule appointment.");
      }

      fetchAppointments();
      setShowAddModal(false);
      // Reset form
      setDoctorName("");
      setSpecialty("General Medicine");
      setDateTime("");
      setNotes("");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "Completed" | "Cancelled") => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        fetchAppointments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update appointment status.");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this appointment from log history?")) return;

    try {
      const res = await fetch(`/api/appointments?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAppointments();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete appointment.");
      }
    } catch (err) {
      console.error("Failed to delete appointment:", err);
    }
  };

  // Group appointments
  const now = new Date();
  const upcomingAppts = appointments.filter(
    (a) => a.status === "Scheduled" && new Date(a.dateTime) >= now
  );
  const historyAppts = appointments.filter(
    (a) => a.status !== "Scheduled" || new Date(a.dateTime) < now
  );

  const formatAppointmentTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
      case "Completed":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "Cancelled":
        return "bg-rose-500/10 border-rose-500/20 text-rose-450";
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-400";
    }
  };

  const currentTabAppts = activeTab === "upcoming" ? upcomingAppts : historyAppts;

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 bg-slate-950 text-slate-100 min-h-full relative overflow-y-auto">
      {/* Decorative background glows */}
      <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-400" />
            Appointments & Visits
          </h1>
          <p className="text-slate-400 text-sm">
            Keep track of doctor consultations, scheduled diagnostic visits, and clinical treatment follow-ups.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Book Visit
        </button>
      </div>

      {/* Telehealth Virtual Consultations Hub */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-slate-900/50 border border-indigo-500/25 rounded-2xl p-6 space-y-4 relative z-10">
        <div className="flex items-center gap-2 text-indigo-400">
          <Video className="w-5 h-5 animate-pulse" />
          <h2 className="font-bold text-sm tracking-wide uppercase">Virtual Consultation & Telehealth Hub</h2>
        </div>
        <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
          Connect immediately with certified clinicians online. Select a provider below to launch video consultations on external clinical platforms.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Practo */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4.5 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all group">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">Practo Consult</h3>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wide">Active</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal font-light">
                Consult immediately with top-tier Indian general practitioners, specialists, and therapists.
              </p>
            </div>
            <a
              href="https://www.practo.com/consult"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-850 hover:text-white transition-all cursor-pointer animate-pulse"
            >
              Consult Online
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Teladoc */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4.5 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all group">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">Teladoc Virtual</h3>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wide">Active</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal font-light">
                24/7 on-demand virtual care platform providing board-certified telehealth physicians.
              </p>
            </div>
            <a
              href="https://www.teladoc.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
            >
              Launch Teladoc
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Zocdoc */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4.5 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all group">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">Zocdoc Video</h3>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wide">Active</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal font-light">
                Find local top-rated doctors, read reviews, and schedule virtual video appointments.
              </p>
            </div>
            <a
              href="https://www.zocdoc.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
            >
              Book Video Visit
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Amwell */}
          <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4.5 flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all group">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">Amwell Care</h3>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-wide">Active</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal font-light">
                Face-to-face video consultation platform for general medicine, therapy, and psychiatry.
              </p>
            </div>
            <a
              href="https://amwell.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-850 hover:text-white transition-all cursor-pointer"
            >
              Consult Amwell
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>


      {/* Tab selection */}
      <div className="flex border-b border-slate-900 pb-px relative z-10">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`pb-4 px-6 text-sm font-bold relative transition-all cursor-pointer ${
            activeTab === "upcoming" ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Scheduled Visits ({upcomingAppts.length})
          {activeTab === "upcoming" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 animate-slideIn" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`pb-4 px-6 text-sm font-bold relative transition-all cursor-pointer ${
            activeTab === "history" ? "text-cyan-400" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Visit History ({historyAppts.length})
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 animate-slideIn" />
          )}
        </button>
      </div>

      {/* Listing component */}
      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium py-12 justify-center relative z-10">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <span>Synchronizing appointment schedules...</span>
        </div>
      ) : (
        <div className="relative z-10">
          {currentTabAppts.length === 0 ? (
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
              <Calendar className="w-10 h-10 text-slate-650 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400">
                  {activeTab === "upcoming" ? "No scheduled visits" : "No visit history logged"}
                </p>
                <p className="text-xs text-slate-500 leading-normal">
                  {activeTab === "upcoming"
                    ? "Ensure you stay on top of your health program. Schedule consultations or follow-up tests."
                    : "No previous clinics or medical treatments recorded in history archives."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentTabAppts.map((appt) => {
                const { date, time } = formatAppointmentTime(appt.dateTime);
                const isScheduled = appt.status === "Scheduled";
                
                return (
                  <div
                    key={appt.id}
                    className="bg-slate-900/30 border border-slate-850 hover:border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-4">
                      {/* Name / Specialty */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center shrink-0 text-indigo-400">
                            <Stethoscope className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-white">{appt.doctorName}</h3>
                            <p className="text-xs text-slate-450 mt-0.5">{appt.specialty}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(appt.status)}`}>
                          {appt.status}
                        </span>
                      </div>

                      {/* Time / Date info */}
                      <div className="bg-slate-950/40 border border-slate-900/80 rounded-xl p-3.5 flex items-center gap-3.5 text-xs">
                        <div className="flex items-center gap-2 text-cyan-400">
                          <Clock className="w-4 h-4" />
                          <span className="font-bold">{time}</span>
                        </div>
                        <div className="w-px h-4 bg-slate-850" />
                        <span className="text-slate-350">{date}</span>
                      </div>

                      {/* Notes text */}
                      {appt.notes && (
                        <div className="flex items-start gap-2 text-xs text-slate-400">
                          <FileText className="w-4 h-4 text-slate-550 shrink-0 mt-0.5" />
                          <p className="leading-relaxed"><strong className="text-slate-350 font-semibold">Notes:</strong> {appt.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-900">
                      <div className="flex gap-2">
                        {isScheduled && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "Completed")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 text-[11px] font-bold text-emerald-400 transition-all cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Check-In
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(appt.id, "Cancelled")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 hover:border-rose-500/20 text-[11px] font-bold text-rose-400 transition-all cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAppointment(appt.id)}
                        className="p-2 rounded-lg bg-slate-950 hover:bg-rose-500/10 border border-slate-900 hover:border-rose-500/10 text-slate-500 hover:text-rose-450 transition-colors cursor-pointer"
                        title="Delete Visit log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Book Visit Modal */}
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
                <Calendar className="w-5 h-5 text-indigo-400" />
                Schedule Consultation
              </h2>
              <p className="text-xs text-slate-400 leading-normal">
                Enter details to track upcoming appointments and log clinical instructions.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddAppointment} className="space-y-4">
              {/* Doctor Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">Doctor Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all placeholder:text-slate-650"
                  />
                </div>
              </div>

              {/* Specialty */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">Specialty</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Stethoscope className="w-4 h-4" />
                  </span>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all"
                  >
                    {SPECIALTIES.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DateTime */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all"
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">Notes / Instructions (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bring previous test results. Fasting required."
                  className="w-full h-24 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-xs text-white transition-all placeholder:text-slate-650 resize-none"
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
                    Scheduling...
                  </>
                ) : (
                  "Book Visit"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
