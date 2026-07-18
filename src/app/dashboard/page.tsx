"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useUser } from "./layout";
import {
  Activity,
  Calendar,
  FileText,
  Pill,
  Heart,
  Phone,
  ShieldAlert,
  ArrowRight,
  Plus,
  MessageSquare,
  Clock,
  ExternalLink,
  Flame,
  Shield,
  PhoneCall,
  MapPin,
  Droplet,
  Building,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    medicationsCount: 0,
    recordsCount: 0,
    appointmentsCount: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all data in parallel
        const [medsRes, recordsRes, appointmentsRes] = await Promise.all([
          fetch("/api/medications"),
          fetch("/api/records"),
          fetch("/api/appointments"),
        ]);

        const medsData = await medsRes.json();
        const recordsData = await recordsRes.json();
        const appointmentsData = await appointmentsRes.json();

        const activeMeds = (medsData.medications || []).filter((m: any) => m.active);
        const scheduledAppts = (appointmentsData.appointments || []).filter(
          (a: any) => a.status === "Scheduled"
        );

        setStats({
          medicationsCount: activeMeds.length,
          recordsCount: (recordsData.records || []).length,
          appointmentsCount: scheduledAppts.length,
        });

        setUpcomingAppointments((appointmentsData.appointments || []).slice(0, 2));
        setRecentRecords((recordsData.records || []).slice(0, 3));
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 bg-slate-950 text-slate-100 min-h-full">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Hello, {user?.name || "Patient"}
          </h1>
          <p className="text-slate-400 text-sm">Here is your health tracker overview for today.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Last Sync: Just now</span>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile and Emergency info (Left 2 cols on wide) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Medical Profile Summary */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Heart className="w-5 h-5 text-cyan-400" />
              Clinical Profile
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/50 space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Age</span>
                <p className="text-sm font-bold text-white">{user?.age ? `${user.age} yrs` : "Not specified"}</p>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/50 space-y-1">
                <span className="text-xs text-slate-500 font-semibold uppercase">Blood Type</span>
                <p className="text-sm font-bold text-cyan-400">{user?.bloodType || "Not specified"}</p>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/50 col-span-2 sm:col-span-1 space-y-1 truncate">
                <span className="text-xs text-slate-500 font-semibold uppercase">Allergies</span>
                <p className="text-sm font-bold text-rose-400 truncate" title={user?.allergies || "None declared"}>
                  {user?.allergies || "None declared"}
                </p>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900/50 col-span-2 sm:col-span-1 space-y-1 truncate">
                <span className="text-xs text-slate-500 font-semibold uppercase">Conditions</span>
                <p className="text-sm font-bold text-amber-400 truncate" title={user?.chronicConditions || "None declared"}>
                  {user?.chronicConditions || "None declared"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/dashboard/chat"
                className="flex items-start gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/20 hover:bg-slate-900/60 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm group-hover:text-cyan-400 transition-colors">Consult AI Companion</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">Get instant insights regarding symptoms, report analyses, and medicine guidance.</p>
                </div>
              </Link>
              <Link
                href="/dashboard/records"
                className="flex items-start gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/20 hover:bg-slate-900/60 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                  <Plus className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm group-hover:text-purple-400 transition-colors">Analyze Health Record</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">Upload lab results, prescriptions, or clinical summaries for AI summarization.</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Nearby Services Search Panel */}
          <div className="space-y-4 pt-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-cyan-455" />
              One-Tap Nearby Services
            </h2>
            <p className="text-slate-400 text-xs leading-normal">
              Click any service to immediately locate and view options in your area via Google Maps.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <a
                href="https://www.google.com/maps/search/?api=1&query=hospitals+near+me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-cyan-500/20 hover:bg-slate-900/60 transition-all text-center group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 mb-3 text-cyan-400 group-hover:scale-105 transition-transform">
                  <Building className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs text-white group-hover:text-cyan-400 transition-colors">Nearby Hospitals</h3>
                <p className="text-[10px] text-slate-500 mt-1">Locate trauma centers</p>
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=pharmacy+near+me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-purple-500/20 hover:bg-slate-900/60 transition-all text-center group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-3 text-purple-400 group-hover:scale-105 transition-transform">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs text-white group-hover:text-purple-400 transition-colors">Nearby Pharmacies</h3>
                <p className="text-[10px] text-slate-500 mt-1">Find 24/7 medicine</p>
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=police+station+near+me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/20 hover:bg-slate-900/60 transition-all text-center group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-3 text-indigo-400 group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs text-white group-hover:text-indigo-400 transition-colors">Police Stations</h3>
                <p className="text-[10px] text-slate-500 mt-1">Get emergency safety</p>
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=blood+bank+near+me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-rose-500/20 hover:bg-slate-900/60 transition-all text-center group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 mb-3 text-rose-455 group-hover:scale-105 transition-transform">
                  <Droplet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs text-white group-hover:text-rose-455 transition-colors">Blood Banks</h3>
                <p className="text-[10px] text-slate-500 mt-1">Find active donors</p>
              </a>
            </div>
          </div>
        </div>

        {/* Right side panels: Emergency contact & Upcoming events */}
        <div className="space-y-8">
          {/* Emergency Service Call Desk */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-455">
              <PhoneCall className="w-5 h-5 animate-pulse" />
              <h2 className="font-bold text-sm tracking-wide uppercase">Emergency Call Desk</h2>
            </div>
            <p className="text-xs text-slate-400 leading-normal">
              One-tap buttons to immediately dial emergency dispatch services.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href="tel:108"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/35 transition-all group text-center cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform mb-2">
                  <Activity className="w-4.5 h-4.5 text-rose-450" />
                </div>
                <h3 className="font-extrabold text-xs text-white">Ambulance</h3>
                <span className="text-[10px] text-rose-400 font-bold mt-0.5">Call 108</span>
              </a>
              <a
                href="tel:101"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/35 transition-all group text-center cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform mb-2">
                  <Flame className="w-4 h-4 text-amber-405" />
                </div>
                <h3 className="font-extrabold text-xs text-white">Fire Dept</h3>
                <span className="text-[10px] text-amber-455 font-bold mt-0.5">Call 101</span>
              </a>
              <a
                href="tel:112"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 hover:border-cyan-500/35 transition-all group text-center cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform mb-2">
                  <Shield className="w-4.5 h-4.5 text-cyan-455" />
                </div>
                <h3 className="font-extrabold text-xs text-white">Police</h3>
                <span className="text-[10px] text-cyan-455 font-bold mt-0.5">Call 112</span>
              </a>
              <a
                href="tel:1930"
                className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/35 transition-all group text-center cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform mb-2">
                  <ShieldAlert className="w-4.5 h-4.5 text-indigo-455" />
                </div>
                <h3 className="font-extrabold text-xs text-white">Cyber Fraud</h3>
                <span className="text-[10px] text-indigo-455 font-bold mt-0.5">Call 1930</span>
              </a>
            </div>
          </div>

          {/* Emergency Contacts Widget */}
          <div className="bg-gradient-to-br from-rose-500/10 to-slate-900/50 border border-rose-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h2 className="font-bold text-sm tracking-wide uppercase">Emergency Contact</h2>
            </div>
            {user?.emergencyContactName ? (
              <div className="space-y-3 pt-2">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Contact Name</p>
                  <p className="text-sm font-bold text-white">{user.emergencyContactName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase">Phone Number</p>
                  <a
                    href={`tel:${user.emergencyContactPhone}`}
                    className="inline-flex items-center gap-2 text-sm font-bold text-rose-400 hover:underline pt-0.5"
                  >
                    <Phone className="w-4 h-4" />
                    {user.emergencyContactPhone}
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <p className="text-xs text-slate-400 leading-relaxed">No emergency contacts set. Please update your profile with contact details.</p>
              </div>
            )}
          </div>

          {/* Upcoming Appointments List */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold tracking-wide uppercase text-slate-400">Upcoming Visits</h2>
            {loading ? (
              <p className="text-xs text-slate-500">Loading appointments...</p>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-3.5">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="bg-slate-950/40 border border-slate-900/60 p-3.5 rounded-xl flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{appt.doctorName}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{appt.specialty}</p>
                      <p className="text-xs text-slate-500 font-medium mt-2">
                        {new Date(appt.dateTime).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-wider">
                      Scheduled
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 leading-relaxed">No visits scheduled. Book an appointment with your practitioner.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
