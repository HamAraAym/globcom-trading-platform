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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
        <MessageSquare className="mb-3 md:mb-4 opacity-20 w-10 h-10 md:w-12 md:h-12" />
        <p className="text-xs md:text-sm font-bold text-slate-600">Secure connection established.</p>
        <p className="text-[10px] md:text-xs mt-1">Begin the negotiation process below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 bg-slate-50/50 custom-scrollbar relative" ref={scrollRef}>
      {messages.map((msg) => {
        const isMe = msg.sender?.email === currentUserEmail;

        // FIXED: Safe dynamic color rendering for Tailwind Purger
        const bubbleColor = isMe 
          ? (themeColor === "blue" ? "bg-blue-600 text-white" : "bg-emerald-600 text-white")
          : "bg-white border border-slate-200 text-slate-800";

        return (
          <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex flex-col max-w-[85%] md:max-w-[75%] lg:max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5 px-1">
                <span className="text-[10px] md:text-xs font-bold text-slate-700">
                  {msg.sender?.firstName || "Unknown"} {msg.sender?.lastName || ""}
                </span>
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md">
                  {msg.sender?.role?.replace("_", " ") || "USER"}
                </span>
              </div>
              
              <div className={`px-4 py-3 md:px-5 md:py-3.5 text-xs md:text-sm leading-relaxed shadow-sm ${bubbleColor} ${
                isMe ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm"
              }`}>
                {msg.content}
              </div>
              
              <span className="text-[8px] md:text-[9px] font-bold text-slate-400 mt-1 md:mt-1.5 px-1 tracking-widest uppercase">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}