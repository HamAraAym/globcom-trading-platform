"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Loader2, Sparkles, User } from "lucide-react";
import { processAIPrompt } from "@/actions/aiActions";

type Message = { role: "user" | "ai"; content: string };

export default function GlobalAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Hello! I am the GlobCom AI Assistant. How can I help you navigate the platform today?" }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await processAIPrompt(userMessage);
      setMessages(prev => [...prev, { role: "ai", content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "ai", content: "Sorry, I am having trouble connecting to the GlobCom servers right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-[340px] md:w-[380px] h-[500px] mb-4 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-5 fade-in duration-200">
          
          {/* Header */}
          <div className="bg-blue-800 p-4 flex items-center justify-between shrink-0 shadow-md z-10">
            <div className="flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-1">GlobCom AI <Sparkles size={12} className="text-blue-300"/></h3>
                <p className="text-[10px] text-blue-200 font-medium uppercase tracking-widest">Platform Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-200 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === "user" ? "bg-slate-200 text-slate-500" : "bg-blue-100 text-blue-800 border border-blue-200"}`}>
                  {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div className={`p-3 text-sm rounded-2xl max-w-[85%] whitespace-pre-wrap leading-relaxed shadow-sm ${msg.role === "user" ? "bg-blue-800 text-white rounded-tr-sm" : "bg-white text-slate-800 border border-slate-200 rounded-tl-sm"}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                  <Bot size={12} className="text-blue-800" />
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2 text-slate-400">
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 shrink-0">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about contracts, KYC, or roles..." 
                className="w-full bg-slate-100 text-sm font-medium text-slate-800 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all border border-transparent"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-1.5 bg-blue-800 hover:bg-blue-900 disabled:bg-slate-300 text-white rounded-lg transition-colors shadow-sm"
              >
                <Send size={16} />
              </button>
            </div>
          </form>

        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 ${isOpen ? "bg-slate-800 text-white rotate-90" : "bg-blue-800 text-white shadow-blue-800/30"}`}
      >
        {isOpen ? <X size={24} /> : <Bot size={26} />}
      </button>
    </div>
  );
}