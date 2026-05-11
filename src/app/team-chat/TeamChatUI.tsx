"use client";

import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { Send, Loader2, MessageSquare, Hash, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { sendTeamMessage } from "@/actions/teamChatActions";

interface Message {
  id: string;
  content: string;
  attachments?: string[];
  createdAt: Date;
  senderId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

const getInitials = (first: string, last: string) => {
  return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();
};

export default function TeamChatUI({ 
  initialMessages, 
  currentUserId 
}: { 
  initialMessages: any[]; 
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusherClient.subscribe("global-team-chat");

    channel.bind("new-message", (newMessage: Message) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      pusherClient.unsubscribe("global-team-chat");
      pusherClient.disconnect();
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isSending) return;

    // Compile text and files into FormData
    const formData = new FormData();
    formData.append("content", input.trim());
    attachments.forEach(file => formData.append("attachments", file));

    // Optimistically clear UI
    setInput("");
    setAttachments([]);
    setIsSending(true);

    try {
      // ⚡ FIX: Added 'as any' to bypass the strict TS string inference
      await sendTeamMessage(formData as any);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message or upload files.");
    } finally {
      setIsSending(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isImage = (url: string) => {
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8fafc]">
      
      {/* Sleek Slack-style Header */}
      <div className="flex-none h-16 bg-white border-b border-slate-200 px-6 flex items-center shadow-sm z-10 gap-3">
        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
          <Hash size={20} />
        </div>
        <div>
          <h1 className="text-[15px] font-bold text-slate-900 tracking-tight leading-none">global-team-chat</h1>
          <p className="text-[11px] font-medium text-slate-500 mt-1">Company-wide communications and announcements</p>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar">
        <div className="max-w-5xl mx-auto w-full flex flex-col space-y-6">
          
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 space-y-4 pt-20 h-full">
              <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
                <MessageSquare size={28} className="text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500">Welcome to the beginning of the #global-team-chat channel.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender.id === currentUserId;
              const showHeader = idx === 0 || messages[idx - 1].sender.id !== msg.sender.id;

              return (
                <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                  
                  {/* Sender Avatar */}
                  {!isMe && (
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[11px] font-bold shrink-0 mr-3 mt-auto mb-5 hidden sm:flex border border-slate-300">
                      {getInitials(msg.sender.firstName, msg.sender.lastName)}
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                    
                    {/* Header (Name & Role) */}
                    {!isMe && showHeader && (
                      <div className="flex items-center gap-2 mb-1.5 ml-1 sm:ml-0">
                        <span className="text-[12px] font-bold text-slate-700">{msg.sender.firstName} {msg.sender.lastName}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 uppercase tracking-wider">{msg.sender.role.replace("_", " ")}</span>
                      </div>
                    )}

                    {/* Chat Bubble (Text + Attachments) */}
                    <div className={`px-4 md:px-5 py-3 text-[14px] md:text-[15px] font-medium leading-relaxed break-words whitespace-pre-wrap shadow-sm ${
                      isMe 
                        ? "bg-blue-800 text-white rounded-2xl rounded-tr-sm" 
                        : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm"
                    }`}>
                      {msg.content}

                      {/* ATTACHMENT RENDERER */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className={`flex flex-wrap gap-2 ${msg.content ? 'mt-3' : ''}`}>
                          {msg.attachments.map((url, i) => (
                            isImage(url) ? (
                              <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-48 h-32 rounded-lg overflow-hidden border border-white/20 shadow-sm hover:opacity-90 transition-opacity">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                              </a>
                            ) : (
                              <a key={i} href={url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm transition-colors text-xs font-bold ${isMe ? "bg-blue-900 border-blue-700 text-blue-100 hover:bg-blue-950" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                                <FileText size={16} /> Document Attached
                              </a>
                            )
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className={`text-[10px] font-semibold text-slate-400 mt-1.5 ${isMe ? "mr-1" : "ml-1 sm:ml-0"}`}>
                      {formatTime(msg.createdAt)}
                    </span>

                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-none bg-white border-t border-slate-200 p-4 md:p-6 z-20">
        <div className="max-w-5xl mx-auto w-full">
          
          {/* ATTACHMENT PREVIEW BAR */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 px-1">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm animate-in fade-in zoom-in duration-200">
                  {file.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <button type="button" onClick={() => removeAttachment(idx)} className="ml-1 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="relative flex items-center">
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
              }}
            />

            {/* Paperclip Button */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="absolute left-2 p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-10"
            >
              <Paperclip size={20} />
            </button>

            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message #global-team-chat..." 
              className="w-full bg-slate-50 border border-slate-300 hover:border-slate-400 text-sm font-medium text-slate-800 placeholder:text-slate-400 rounded-xl pl-12 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            <button 
              type="submit" 
              disabled={(!input.trim() && attachments.length === 0) || isSending}
              className="absolute right-2 p-2 rounded-lg bg-blue-800 hover:bg-blue-900 disabled:bg-slate-300 flex items-center justify-center text-white shadow-sm disabled:shadow-none transition-all active:scale-95"
            >
              {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}