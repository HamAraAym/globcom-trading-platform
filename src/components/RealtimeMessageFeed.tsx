"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { MessageSquare } from "lucide-react";

// Initialize the Supabase client for listening to real-time events
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  id: string;
  content: string;
  createdAt: Date | string;
  sender: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface RealtimeMessageFeedProps {
  initialMessages: Message[];
  chatId: string;
  currentUserEmail: string | undefined;
  themeColor: string;
}

export default function RealtimeMessageFeed({ initialMessages, chatId, currentUserEmail, themeColor }: RealtimeMessageFeedProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when a new message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // 1. Subscribe to INSERT events on the "Message" table for this specific chat room
    const channel = supabase
      .channel(`realtime:chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Message",
          filter: `chatRoomId=eq.${chatId}`,
        },
        (payload) => {
          // 2. When a new message hits the database, we receive the payload here.
          // Because the payload only contains the foreign keys (senderId), 
          // we gracefully append it to the UI. 
          
          // Note: In a production app with complex joins, you might fetch the full 
          // sender details here. For now, we update the state to trigger a re-render.
          const newMessage = payload.new as Message;
          
          // Avoid duplicating messages if the sender is the one who just pushed it
          setMessages((current) => {
            if (current.find((m) => m.id === newMessage.id)) return current;
            return [...current, newMessage];
          });
        }
      )
      .subscribe();

    // 3. Cleanup the subscription when the user leaves the room
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  if (messages.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
        <MessageSquare size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-bold text-slate-600">Secure connection established.</p>
        <p className="text-xs mt-1">Begin the negotiation process below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar relative" ref={scrollRef}>
      {messages.map((msg) => {
        const isMe = msg.sender?.email === currentUserEmail;

        return (
          <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex flex-col max-w-[80%] lg:max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <span className="text-xs font-bold text-slate-700">
                  {msg.sender?.firstName || "Unknown"} {msg.sender?.lastName || ""}
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md">
                  {msg.sender?.role?.replace("_", " ") || "USER"}
                </span>
              </div>
              
              <div className={`px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                isMe 
                  ? `bg-${themeColor}-600 text-white rounded-2xl rounded-tr-sm` 
                  : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm"
              }`}>
                {msg.content}
              </div>
              
              <span className="text-[9px] font-bold text-slate-400 mt-1.5 px-1 tracking-widest uppercase">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}