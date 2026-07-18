"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Shield, FileText, MessageSquare, Heart, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-cyan-500 selection:text-slate-900">
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900/50 backdrop-blur-sm bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
            Lifeline AI
          </span>
        </div>
        <nav className="flex items-center gap-6">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-medium text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold hover:bg-slate-850 hover:border-slate-700 transition-all duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-400">
            <Heart className="w-3.5 h-3.5 text-cyan-400" />
            <span>24/7 AI-Powered Health Companion</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            Your clinical-grade{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              health companion
            </span>
          </h1>

          <p className="text-lg text-slate-400 leading-relaxed font-light">
            Empower your healthcare journey with dynamic AI chat guidance, real-time drug interaction checks, medical document analysis, and comprehensive health records scheduling.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-300 text-base"
              >
                Enter Health Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all duration-300 text-base"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 font-semibold text-slate-200 hover:bg-slate-850 hover:border-slate-700 transition-all duration-200 text-base"
                >
                  Sign In to Lifeline
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          {/* Card 1 */}
          <div className="relative group overflow-hidden rounded-2xl border border-slate-900 bg-slate-950/40 p-8 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/5 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">AI Health Companion</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Consult with a personalized AI companion that understands your clinical context, medications, allergies, and lab results, providing helpful, patient-friendly guidance.
            </p>
          </div>

          {/* Card 2 */}
          <div className="relative group overflow-hidden rounded-2xl border border-slate-900 bg-slate-950/40 p-8 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Medication Conflict Checker</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Avoid dangerous drug interactions. Adding any medication triggers an automated AI screening against your existing profile, allergies, and chronic conditions.
            </p>
          </div>

          {/* Card 3 */}
          <div className="relative group overflow-hidden rounded-2xl border border-slate-900 bg-slate-950/40 p-8 backdrop-blur-md transition-all duration-300 hover:border-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/5 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
              <FileText className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Document Summarization</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload lab reports, prescriptions, or discharge forms. The AI parses the text, extracts key information, and presents structured, easily readable summaries.
            </p>
          </div>
        </div>

        {/* Footer info & emergency disclaimer */}
        <div className="mt-28 border-t border-slate-900 pt-8 text-center space-y-4">
          <p className="text-xs text-slate-500 max-w-xl mx-auto italic">
            Disclaimer: Lifeline AI is a health tracking and information tool designed for educational purposes only. It is not a replacement for professional medical advice, diagnosis, or treatment.
          </p>
          <p className="text-xs text-slate-650">
            &copy; {new Date().getFullYear()} Lifeline AI. Built for wellness.
          </p>
        </div>
      </main>
    </div>
  );
}
