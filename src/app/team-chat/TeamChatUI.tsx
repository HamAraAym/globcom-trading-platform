"use client";

import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { Send, Loader2, MessageSquare, Globe2 } from "lucide-react";
import { sendTeamMessage } from "@/actions/teamChatActions";

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export default function TeamChatUI({ 
  initialMessages, 
  currentUserId 
}: { 
  initialMessages: any[]; 
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Connect to Pusher for Real-Time Updates
  useEffect(() => {
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { // <-- Changed this line
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusherClient.subscribe("global-team-chat");

    channel.bind("new-message", (newMessage: Message) => {
      setMessages((prev) => {
        // Prevent duplicate messages if the sender receives their own broadcast
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
    if (!input.trim() || isSending) return;

    const messageText = input.trim();
    setInput("");
    setIsSending(true);

    try {
      await sendTeamMessage(messageText);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string | Date) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-screen bg-slate-50">
      
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm flex items-center gap-3 shrink-0">
        <div className="bg-blue-100 p-2.5 rounded-xl text-blue-800">
          <Globe2 size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Global Team Chat</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">GlobCom Command Center</p>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
            <MessageSquare size={48} className="opacity-50" />
            <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.sender.id === currentUserId;
            const showHeader = idx === 0 || messages[idx - 1].sender.id !== msg.sender.id;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {showHeader && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1 flex items-center gap-2">
                    {isMe ? "You" : `${msg.sender.firstName} ${msg.sender.lastName}`} 
                    {!isMe && <span className="bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded text-[8px]">{msg.sender.role.replace("_", " ")}</span>}
                  </span>
                )}
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] md:max-w-[65%] text-sm font-medium shadow-sm leading-relaxed ${
                  isMe 
                    ? "bg-blue-800 text-white rounded-tr-sm" 
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[9px] font-semibold text-slate-400 mt-1 px-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-slate-200 shrink-0">
        <form onSubmit={handleSend} className="max-w-5xl mx-auto relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message to the global team..." 
            className="w-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 rounded-xl pl-4 pr-16 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isSending}
            className="absolute right-2 p-2 bg-blue-800 hover:bg-blue-900 disabled:bg-slate-300 text-white rounded-lg transition-colors shadow-md disabled:shadow-none"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>

    </div>
  );
}