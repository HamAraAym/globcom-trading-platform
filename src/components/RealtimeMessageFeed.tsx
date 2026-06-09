"use client";

import { useEffect, useState, useRef } from "react";
import Pusher from "pusher-js";
import { MessageSquare, ArrowRightLeft, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

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
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner border border-slate-200">
          <MessageSquare className="opacity-40 w-8 h-8 text-slate-600" />
        </div>
        <p className="text-sm font-black text-slate-700 tracking-tight">Encrypted Channel Established</p>
        <p className="text-xs mt-1 text-slate-500 max-w-xs">All messages are secured. Begin your negotiation below.</p>
        <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <ShieldCheck size={12} /> GlobCom Compliance Active
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-5 md:space-y-6 custom-scrollbar relative" ref={scrollRef}>
      {messages.map((msg) => {
        const isMe = msg.sender?.email === currentUserEmail;

        // 🧠 STRUCTURED COUNTER-OFFER PARSER
        let isOffer = false;
        let offerData: any = null;
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed && parsed.type === "COUNTER_OFFER") {
            isOffer = true;
            offerData = parsed;
          }
        } catch (e) {
          // Standard string message, ignore JSON parse error
        }

        // 🎨 GLOBCOM THEME LOGIC (⚡ FIX: Fully spelled out for Tailwind compiler)
        const isBlue = themeColor === "blue";
        const primaryBg = isBlue ? "bg-blue-800" : "bg-green-600";
        const primaryText = isBlue ? "text-blue-800" : "text-green-600";
        const lightBg = isBlue ? "bg-blue-50" : "bg-green-50";
        const borderColor = isBlue ? "border-blue-200" : "border-green-200";

        const bubbleColor = isMe 
          ? `${primaryBg} text-white shadow-md`
          : "bg-white border border-slate-200 text-slate-800 shadow-sm";

        return (
          <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex flex-col max-w-[92%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
              
              {/* Sender Info Label */}
              <div className={`flex items-center gap-1.5 md:gap-2 mb-1 md:mb-1.5 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <span className="text-[10px] md:text-xs font-bold text-slate-700">
                  {isMe ? "You" : `${msg.sender?.firstName || "Unknown"} ${msg.sender?.lastName || ""}`}
                </span>
                {!isMe && (
                  <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded-md">
                    {msg.sender?.role?.replace("_", " ") || "USER"}
                  </span>
                )}
              </div>
              
              {/* ⚡ THE INTERACTIVE OFFER CARD OR STANDARD BUBBLE */}
              {isOffer ? (
                <div className={`w-full sm:min-w-[320px] md:min-w-[380px] bg-white border-2 ${borderColor} rounded-2xl overflow-hidden shadow-lg`}>
                  <div className={`px-4 py-3 ${primaryBg} text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-2 font-black text-xs md:text-sm tracking-widest uppercase">
                      <ArrowRightLeft size={16} /> Official Counter-Offer
                    </div>
                  </div>
                  <div className="p-4 md:p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className={`p-3 rounded-xl border ${borderColor} ${lightBg}`}>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Proposed Price</p>
                        <p className={`text-base md:text-lg font-black ${primaryText}`}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(offerData.price)}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl border ${borderColor} ${lightBg}`}>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Volume</p>
                        <p className={`text-base md:text-lg font-black ${primaryText}`}>
                          {new Intl.NumberFormat().format(offerData.quantity)} <span className="text-xs text-slate-500">{offerData.unit || "MT"}</span>
                        </p>
                      </div>
                    </div>
                    {offerData.notes && (
                      <div className="text-xs md:text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic relative">
                        <span className="absolute top-2 left-2 text-2xl text-slate-300 font-serif leading-none">"</span>
                        <span className="pl-4 relative z-10 block">{offerData.notes}</span>
                      </div>
                    )}
                    
                    {/* Action Buttons (UI Only for now) */}
                    {!isMe && (
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <button className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-3 rounded-xl font-bold text-xs text-white ${primaryBg} hover:opacity-90 transition-opacity shadow-sm active:scale-95`}>
                          <CheckCircle2 size={16} /> Accept Terms
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1.5 py-2.5 md:py-3 rounded-xl font-bold text-xs text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors active:scale-95">
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`px-4 py-3 md:px-5 md:py-3.5 text-sm md:text-[15px] leading-relaxed shadow-sm ${bubbleColor} ${
                  isMe ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
              )}
              
              {/* Timestamp */}
              <span className={`text-[8px] md:text-[9px] font-bold text-slate-400 mt-1 md:mt-1.5 px-1 tracking-widest uppercase flex items-center gap-1`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isMe && <CheckCircle2 size={10} className="text-slate-300" />}
              </span>
            </div>
          </div>
        );
      })}
      
      {/* ⚡ A small spacer to ensure the last message isn't hidden by the input bar */}
      <div className="h-2 w-full shrink-0"></div>
    </div>
  );
}