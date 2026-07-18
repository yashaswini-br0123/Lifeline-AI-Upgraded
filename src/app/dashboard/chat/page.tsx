"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "../layout";
import {
  Activity,
  Send,
  Loader2,
  AlertTriangle,
  Heart,
  MessageSquare,
  Bot,
  User as UserIcon,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export default function ChatPage() {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    { label: "Understand Lab Results", text: "What does a high cholesterol level in my lab report usually mean?" },
    { label: "Medication Interactions", text: "Are there any interactions between ibuprofen and blood pressure medicines?" },
    { label: "Symptoms Advice", text: "What are the common warning signs of dehydration, and how is it managed?" },
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch response from AI Companion.");
      }

      const modelMessage: ChatMessage = { role: "model", content: data.reply };
      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 h-full relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 px-6 py-5 border-b border-slate-900 bg-slate-950/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
            <Bot className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-md font-bold text-white flex items-center gap-1.5">
              Lifeline Companion
            </h1>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              Online & Diagnostic-ready
            </span>
          </div>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-900/60 border border-slate-800 px-3.5 py-1.5 rounded-lg max-w-xs truncate">
          <span className="font-semibold text-slate-500">Context:</span>
          <span className="truncate">{user?.name}</span>
        </div>
      </header>

      {/* Message Feed Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 relative z-10">
        {messages.length === 0 ? (
          /* Empty chat welcome state */
          <div className="max-w-2xl mx-auto text-center pt-12 space-y-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-white">Ask your Medical Assistant</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Consult regarding chronic care, test explanations, medication checks, and general symptoms. I use your clinical context for personalized advice.
              </p>
            </div>

            {/* Quick starts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => handleSendMessage(prompt.text)}
                  className="bg-slate-900/40 border border-slate-800 rounded-xl p-4.5 hover:border-cyan-500/25 hover:bg-slate-900/60 transition-all text-xs font-semibold text-slate-300 hover:text-white space-y-1 cursor-pointer"
                >
                  <span className="text-[10px] text-cyan-400 font-bold tracking-wide uppercase block">{prompt.label}</span>
                  <p className="font-normal leading-normal">{prompt.text}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation elements */
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div key={idx} className={`flex items-start gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Avatar bubble */}
                  <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border ${
                    isUser 
                      ? "bg-indigo-600/15 border-indigo-500/20 text-indigo-400" 
                      : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                  }`}>
                    {isUser ? <UserIcon className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
                  </div>

                  {/* Message bubble card */}
                  <div className={`max-w-[80%] px-5 py-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line border ${
                    isUser
                      ? "bg-gradient-to-br from-indigo-600 to-indigo-700/80 border-indigo-500/20 text-white rounded-tr-none"
                      : "bg-slate-900/40 border-slate-800 text-slate-200 rounded-tl-none font-light"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* Loading placeholder */}
            {loading && (
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border bg-cyan-500/10 border-cyan-500/20 text-cyan-400">
                  <Bot className="w-4.5 h-4.5 animate-bounce" />
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-3 text-slate-400 text-xs font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>AI Companion is thinking...</span>
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs max-w-lg mx-auto">
                <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input query panel */}
      <footer className="relative z-10 px-6 py-4 border-t border-slate-900 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-3xl mx-auto space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask anything about symptoms, medication interactions, or health guidelines..."
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-3.5 outline-none text-sm text-white placeholder:text-slate-500 transition-all disabled:opacity-50 disabled:pointer-events-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold text-white hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick disclaimer indicator */}
          <p className="text-[10px] text-center text-slate-500 italic">
            Lifeline AI does not diagnose emergency conditions. If you experience severe symptoms, call local emergency services immediately.
          </p>
        </div>
      </footer>
    </div>
  );
}
