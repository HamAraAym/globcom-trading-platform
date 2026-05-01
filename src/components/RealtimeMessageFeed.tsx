"use client";

import { useEffect, useState, useRef } from "react";
import Pusher from "pusher-js";
import { MessageSquare } from "lucide-react";

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
    // 1. Initialize Pusher Client SDK
    // We do this inside useEffect so it only runs on the client browser
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    // 2. Subscribe to this specific chat room's secure channel
    const channel = pusherClient.subscribe(`chat-${chatId}`);

    // 3. Listen for the 'new-message' event we broadcast from the server
    channel.bind("new-message", (newMessage: Message) => {
      setMessages((current) => {
        // Prevent duplicates if React StrictMode fires twice
        if (current.find((m) => m.id === newMessage.id)) return current;
        return [...current, newMessage];
      });
    });

    // 4. Cleanup the connection when the user leaves the room
    return () => {
      pusherClient.unsubscribe(`chat-${chatId}`);
      pusherClient.disconnect();
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