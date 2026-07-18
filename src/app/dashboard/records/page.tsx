"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  FileDigit,
  Sparkles,
  Calendar,
  Layers,
  Search,
} from "lucide-react";

interface MedicalRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string | null;
  extractedText: string | null;
  aiSummary: string | null;
  category: string;
  uploadedAt: string;
}

const MOCK_TEMPLATES = {
  lipid: {
    name: "Lipid Panel Lab Report",
    category: "Lab Report",
    fileType: "pdf",
    text: `PATIENT: Patient Name\nDATE: October 12, 2025\nTEST: Lipid Panel\n\nRESULTS:\n- Total Cholesterol: 245 mg/dL (High, Ref Range: < 200 mg/dL)\n- LDL Cholesterol: 162 mg/dL (High, Ref Range: < 100 mg/dL)\n- HDL Cholesterol: 38 mg/dL (Low, Ref Range: > 40 mg/dL)\n- Triglycerides: 225 mg/dL (High, Ref Range: < 150 mg/dL)\n\nCOMMENTS: Patient presents with a hyperlipidemic cardiovascular risk profile. Recommended low-saturated-fat diet, regular aerobic exercise, and re-evaluation in 3 months. Consider statin therapy if lifestyle modifications do not lower LDL below 130 mg/dL.`,
  },
  amoxicillin: {
    name: "Amoxicillin Prescription Rx",
    category: "Prescription",
    fileType: "image",
    text: `Rx: Amoxicillin 500mg capsules\nQty: 30 capsules\nDirections: Take 1 capsule by mouth every 8 hours (three times daily) for 10 days until finished.\nIndication: Acute streptococcal pharyngitis\nRefills: 0\nPrescriber: Dr. Sarah Jenkins, MD\n\nWarning: Finish all medication even if symptoms resolve. Take with or without food. Avoid alcohol.`,
  },
  appendectomy: {
    name: "Appendectomy Discharge Summary",
    category: "Discharge Summary",
    fileType: "pdf",
    text: `DISCHARGE SUMMARY\nPATIENT: Patient Name\nADMISSION DATE: January 14, 2026\nDISCHARGE DATE: January 16, 2026\n\nPRIMARY DIAGNOSIS: Acute appendicitis\nSECONDARY DIAGNOSIS: None\n\nPROCEDURE PERFORMED: Laparoscopic appendectomy\n\nHOSPITAL COURSE: Uneventful. The patient presented with right lower quadrant pain and fever. Ultrasounds confirmed appendicitis. Surgery completed successfully without complications. Patient tolerated post-operative diet well and is ambulating normally.\n\nDISCHARGE INSTRUCTIONS:\n- Activity: Do not lift anything over 10 lbs for 2 weeks. Avoid strenuous exercise.\n- Wound Care: Keep incision sites clean and dry. Staples/steri-strips will dissolve/fall off.\n- Medications: Acetaminophen 500mg every 6 hours as needed for moderate pain. Do not take Ibuprofen due to history of mild gastritis.\n- Diet: Resume normal diet as tolerated, high fiber recommended.\n- Follow Up: Follow up with general surgery clinic in 10 days.`,
  },
};

export default function RecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState("All");

  // Form states
  const [fileName, setFileName] = useState("");
  const [category, setCategory] = useState("Lab Report");
  const [fileType, setFileType] = useState("pdf");
  const [extractedText, setExtractedText] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/records");
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error("Error fetching medical records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleTemplateChange = (key: string) => {
    setSelectedTemplate(key);
    if (key && key in MOCK_TEMPLATES) {
      const template = MOCK_TEMPLATES[key as keyof typeof MOCK_TEMPLATES];
      setFileName(template.name);
      setCategory(template.category);
      setFileType(template.fileType);
      setExtractedText(template.text);
    } else {
      setFileName("");
      setExtractedText("");
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileType) {
      setError("Document Name and File Type are required.");
      return;
    }

    setAddLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          fileType,
          category,
          extractedText: extractedText || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process medical document.");
      }

      fetchRecords();
      setShowAddModal(false);
      // Reset form
      setFileName("");
      setCategory("Lab Report");
      setFileType("pdf");
      setExtractedText("");
      setSelectedTemplate("");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this medical record?")) return;

    try {
      const res = await fetch(`/api/records?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchRecords();
        if (expandedRecordId === id) setExpandedRecordId(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete record.");
      }
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  const toggleExpandRecord = (id: string) => {
    setExpandedRecordId(expandedRecordId === id ? null : id);
  };

  const categories = ["All", "Prescription", "Lab Report", "Discharge Summary", "Other"];

  // Filter records
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.aiSummary && rec.aiSummary.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategoryTab === "All" || rec.category === selectedCategoryTab;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case "Prescription":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "Lab Report":
        return "bg-purple-500/10 border-purple-500/20 text-purple-400";
      case "Discharge Summary":
        return "bg-cyan-500/10 border-cyan-500/20 text-cyan-400";
      default:
        return "bg-slate-500/10 border-slate-500/20 text-slate-400";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 bg-slate-950 text-slate-100 min-h-full relative overflow-y-auto">
      {/* Decorative background glows */}
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-purple-400" />
            Medical Documents & Records
          </h1>
          <p className="text-slate-400 text-sm">
            Securely upload, categorize, and summarize lab tests, prescriptions, and summaries using Gemini AI.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Document
        </button>
      </div>

      {/* Control panel (Search & Tabs) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4 relative z-10">
        {/* Search */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search documents or clinical summaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all placeholder:text-slate-500"
          />
        </div>

        {/* Categories Tab */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryTab(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                selectedCategoryTab === cat
                  ? "bg-slate-850 border border-slate-700/60 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Record elements */}
      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 text-sm font-medium py-12 justify-center relative z-10">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
          <span>Syncing with secure clinical archives...</span>
        </div>
      ) : (
        <div className="relative z-10 space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4">
              <Layers className="w-10 h-10 text-slate-650 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-400">No medical records found</p>
                <p className="text-xs text-slate-500 leading-normal">
                  {searchTerm || selectedCategoryTab !== "All"
                    ? "Try adjusting your query or category filters."
                    : "Add your clinical report text or check mock templates to get started."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((rec) => {
                const isExpanded = expandedRecordId === rec.id;
                return (
                  <div
                    key={rec.id}
                    className={`bg-slate-900/30 border rounded-2xl transition-all duration-300 ${
                      isExpanded ? "border-cyan-500/20 shadow-lg shadow-cyan-500/5 bg-slate-900/40" : "border-slate-850 hover:border-slate-700"
                    }`}
                  >
                    {/* Collapsed top bar */}
                    <div
                      onClick={() => toggleExpandRecord(rec.id)}
                      className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Doc icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          rec.category === "Prescription" 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : rec.category === "Lab Report"
                            ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                            : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                        }`}>
                          <FileDigit className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-white truncate max-w-md" title={rec.fileName}>
                            {rec.fileName}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(rec.category)}`}>
                              {rec.category}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(rec.uploadedAt).toLocaleDateString()}
                            </span>
                            <span className="uppercase font-bold tracking-widest text-[9px] text-slate-600">
                              {rec.fileType}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRecord(rec.id);
                          }}
                          className="p-2 rounded-lg bg-slate-950 hover:bg-rose-500/10 border border-slate-900 hover:border-rose-500/10 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="text-slate-400 shrink-0">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded details container */}
                    {isExpanded && (
                      <div className="px-5 pb-6 pt-2 border-t border-slate-900/60 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                        {/* Left column: AI summary result */}
                        <div className="bg-gradient-to-tr from-cyan-500/5 to-indigo-500/5 rounded-xl border border-cyan-500/10 p-5 space-y-4">
                          <div className="flex items-center gap-2 text-cyan-400">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            <h4 className="font-bold text-xs uppercase tracking-wide">Gemini Clinical Summary</h4>
                          </div>
                          <div className="text-xs leading-relaxed font-light text-slate-200 whitespace-pre-line prose prose-invert">
                            {rec.aiSummary || "No summary generated."}
                          </div>
                        </div>

                        {/* Right column: Extracted text */}
                        <div className="bg-slate-950/40 rounded-xl border border-slate-900 p-5 space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-wide text-slate-400">Extracted Document Data</h4>
                          <div className="text-[11px] leading-relaxed font-mono text-slate-450 h-48 overflow-y-auto bg-slate-950/20 p-3 rounded-lg border border-slate-900/50 whitespace-pre-wrap">
                            {rec.extractedText || "No text data was extracted from this file."}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Log Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Upload & Analyze Document
              </h2>
              <p className="text-xs text-slate-400 leading-normal">
                Submit health report texts to automatically extract structured clinical insights and diagnose risks.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleAddRecord} className="space-y-4">
              {/* Mock Template Select dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  Quick-Fill Mock Templates (Recommended for Testing)
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all"
                >
                  <option value="">-- Start from scratch / Fill manually --</option>
                  <option value="lipid">Mock: Lipid Panel Report (High Cholesterol Lab)</option>
                  <option value="amoxicillin">Mock: Amoxicillin Prescription Rx (Infection)</option>
                  <option value="appendectomy">Mock: Appendectomy Discharge Summary (Post-Op)</option>
                </select>
              </div>

              {/* Document name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">Document Name</label>
                <input
                  type="text"
                  required
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. Lipids Blood Test Oct, Dr. Jenkins Prescription"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all placeholder:text-slate-650"
                />
              </div>

              {/* Category & File Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all"
                  >
                    <option value="Lab Report">Lab Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">File Format</label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-sm text-white transition-all"
                  >
                    <option value="pdf">PDF File</option>
                    <option value="image">Image File (JPG/PNG)</option>
                  </select>
                </div>
              </div>

              {/* Extracted Text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase">
                    Extracted Text Content (Clinical Text)
                  </label>
                  <span className="text-[10px] text-slate-550 italic">Simulated OCR text content</span>
                </div>
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  placeholder="Paste or write the medical details, lab scores, diagnoses, or dosage directions here..."
                  className="w-full h-36 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 outline-none text-xs text-white transition-all placeholder:text-slate-650 resize-none font-mono"
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
                    Analyzing Medical Text with Gemini AI...
                  </>
                ) : (
                  "Log and Analyze"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
