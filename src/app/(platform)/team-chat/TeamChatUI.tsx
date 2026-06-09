"use client";

import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { Send, Loader2, MessageSquare, Hash, Paperclip, X, FileText, Image as ImageIcon, Plus, Users, Menu } from "lucide-react";
import { getUserChannels, getChannelMessages, sendChannelMessage, createChannel } from "@/actions/teamChatActions";

interface Message {
  id: string;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  createdAt: Date;
  senderId: string;
  sender: { id: string; firstName: string; lastName: string; role: string; };
}

interface Channel {
  id: string;
  name: string | null;
  isGroup: boolean;
  members: { id: string; firstName: string; lastName: string; onlineStatus: string }[];
  messages: { content: string | null; fileName: string | null; createdAt: Date }[];
}

const getInitials = (first: string, last: string) => `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase();

export default function TeamChatUI({ 
  currentUserId,
  users = [] // ⚡ NEW: We will pass all users from the page.tsx next!
}: { 
  currentUserId: string;
  users?: any[]; 
}) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load: Fetch Channels
  useEffect(() => {
    getUserChannels().then(data => {
      setChannels(data as any);
      if (data.length > 0) setActiveChannel(data[0] as any);
    });
  }, []);

  // 2. Room Switcher: Fetch Messages & Subscribe to private Pusher channel
  useEffect(() => {
    if (!activeChannel) return;

    getChannelMessages(activeChannel.id).then(data => {
      setMessages(data as any);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 100);
    });

    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusherClient.subscribe(`channel-${activeChannel.id}`);
    channel.bind("new-message", (newMessage: Message) => {
      setMessages(prev => {
        if (prev.some((msg) => msg.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => {
      pusherClient.unsubscribe(`channel-${activeChannel.id}`);
      pusherClient.disconnect();
    };
  }, [activeChannel?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || isSending || !activeChannel) return;

    const formData = new FormData();
    formData.append("channelId", activeChannel.id);
    formData.append("content", input.trim());
    if (attachedFile) formData.append("file", attachedFile);

    setInput("");
    setAttachedFile(null);
    setIsSending(true);

    try {
      await sendChannelMessage(formData);
      // Refresh sidebar to update 'last message' timestamps
      const updatedChannels = await getUserChannels();
      setChannels(updatedChannels as any);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message or upload file.");
    } finally {
      setIsSending(false);
    }
  };

  const getChannelDisplay = (channel: Channel) => {
    if (channel.isGroup) return { name: channel.name, icon: <Hash size={18} /> };
    const otherUser = channel.members.find(m => m.id !== currentUserId);
    return { 
      name: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Direct Message", 
      icon: <div className={`w-2 h-2 rounded-full ${otherUser?.onlineStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    };
  };

  const formatTime = (dateString: string | Date) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex h-full w-full bg-white overflow-hidden relative">
      
      {/* ========================================== */}
      {/* LEFT SIDEBAR (CHANNELS & DMs)              */}
      {/* ========================================== */}
      <div className={`absolute md:relative z-30 h-full w-72 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h2 className="text-white font-black tracking-tight flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-500" />
            Comms Hub
          </h2>
          <button onClick={() => setShowNewChatModal(true)} className="p-1.5 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg transition-colors">
            <Plus size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
          
          {/* Groups List */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Channels</h3>
            <div className="space-y-0.5">
              {channels.filter(c => c.isGroup).map(channel => {
                const isActive = activeChannel?.id === channel.id;
                return (
                  <button 
                    key={channel.id} onClick={() => { setActiveChannel(channel); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"}`}
                  >
                    <Hash size={16} className={isActive ? "text-indigo-200" : "text-slate-500"} />
                    <span className="truncate">{channel.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DMs List */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-2">Direct Messages</h3>
            <div className="space-y-0.5">
              {channels.filter(c => !c.isGroup).map(channel => {
                const isActive = activeChannel?.id === channel.id;
                const { name, icon } = getChannelDisplay(channel);
                return (
                  <button 
                    key={channel.id} onClick={() => { setActiveChannel(channel); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-indigo-600 text-white shadow-md" : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"}`}
                  >
                    <div className="w-4 flex justify-center">{icon}</div>
                    <span className="truncate">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* ========================================== */}
      {/* MAIN CHAT AREA                             */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col h-full bg-[#f8fafc] relative w-full">
        
        {activeChannel ? (
          <>
            {/* Header */}
            <div className="flex-none h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center shadow-sm z-10 gap-3">
              <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                {getChannelDisplay(activeChannel).icon}
              </div>
              <div>
                <h1 className="text-[15px] font-bold text-slate-900 tracking-tight leading-none">{getChannelDisplay(activeChannel).name}</h1>
                <p className="text-[11px] font-medium text-slate-500 mt-1">
                  {activeChannel.isGroup ? `${activeChannel.members.length} members` : 'Secure Direct Message'}
                </p>
              </div>
            </div>

            {/* Message Feed */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar">
              <div className="max-w-4xl mx-auto w-full flex flex-col space-y-6">
                
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-slate-400 space-y-4 pt-20 h-full">
                    <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
                      <MessageSquare size={28} className="text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">This is the start of your conversation.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender.id === currentUserId;
                    const showHeader = idx === 0 || messages[idx - 1].sender.id !== msg.sender.id;

                    return (
                      <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                        
                        {/* Avatar */}
                        {!isMe && (
                          <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[11px] font-bold shrink-0 mr-3 mt-auto mb-5 hidden sm:flex border border-slate-300">
                            {getInitials(msg.sender.firstName, msg.sender.lastName)}
                          </div>
                        )}

                        <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                          
                          {/* Name Header */}
                          {!isMe && showHeader && (
                            <div className="flex items-center gap-2 mb-1.5 ml-1 sm:ml-0">
                              <span className="text-[12px] font-bold text-slate-700">{msg.sender.firstName} {msg.sender.lastName}</span>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 uppercase tracking-wider">{msg.sender.role.replace("_", " ")}</span>
                            </div>
                          )}

                          {/* Bubble */}
                          <div className={`px-4 md:px-5 py-3 text-[14px] md:text-[15px] font-medium leading-relaxed break-words shadow-sm ${
                            isMe ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm"
                          }`}>
                            {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                            {/* ⚡ NEW: Vercel Blob File Renderer */}
                            {msg.fileUrl && (
                              <div className={`mt-2 ${msg.content ? "pt-2 border-t border-white/20" : ""}`}>
                                {msg.fileType === "IMAGE" ? (
                                  <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="block max-w-sm rounded-lg overflow-hidden border border-white/20 shadow-sm hover:opacity-90">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={msg.fileUrl} alt="Attachment" className="w-full h-auto object-cover" />
                                  </a>
                                ) : (
                                  <a href={msg.fileUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-lg border shadow-sm transition-colors text-xs font-bold ${isMe ? "bg-indigo-700 border-indigo-500 text-indigo-50 hover:bg-indigo-800" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                                    <FileText size={16} /> {msg.fileName || "Download Attachment"}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>

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

            {/* Input Form */}
            <div className="flex-none bg-white border-t border-slate-200 p-4 z-20">
              <div className="max-w-4xl mx-auto w-full">
                
                {/* File Preview */}
                {attachedFile && (
                  <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 border border-indigo-100 px-3 py-2 rounded-lg text-xs font-bold shadow-sm animate-in fade-in zoom-in duration-200 w-max mb-3">
                    {attachedFile.type.startsWith('image/') ? <ImageIcon size={14} /> : <FileText size={14} />}
                    <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                    <button type="button" onClick={() => setAttachedFile(null)} className="ml-2 hover:text-red-500 p-1 bg-white rounded-md shadow-sm">
                      <X size={12} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSend} className="relative flex items-center">
                  <input 
                    type="file" className="hidden" ref={fileInputRef}
                    onChange={(e) => { if (e.target.files && e.target.files[0]) setAttachedFile(e.target.files[0]); }}
                  />
                  <button 
                    type="button" onClick={() => fileInputRef.current?.click()}
                    className="absolute left-2 p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors z-10"
                  >
                    <Paperclip size={20} />
                  </button>
                  <input 
                    type="text" value={input} onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message ${getChannelDisplay(activeChannel).name}...`} 
                    className="w-full bg-slate-50 border border-slate-300 text-sm font-medium text-slate-800 placeholder:text-slate-400 rounded-xl pl-12 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button 
                    type="submit" disabled={(!input.trim() && !attachedFile) || isSending}
                    className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white transition-all active:scale-95"
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-6 text-center">
            <div className="w-20 h-20 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm mb-4">
              <MessageSquare size={32} className="text-slate-300" />
            </div>
            <h2 className="text-lg font-bold text-slate-700 mb-2">No Channel Selected</h2>
            <p className="text-sm">Select a conversation from the sidebar or start a new direct message.</p>
            <button className="md:hidden mt-6 px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              View Channels
            </button>
          </div>
        )}

      </div>

      {/* ⚡ THE REAL NEW CHAT MODAL */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-bold text-lg text-slate-900">Start Conversation</h3>
                <button onClick={() => setShowNewChatModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="text-slate-400 hover:text-slate-800" size={20} />
                </button>
              </div>
              
              <div className="relative mb-4 shrink-0">
                <input type="text" placeholder="Search colleagues..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Direct Messages</p>
                {users?.map(u => (
                  <button 
                    key={u.id}
                    onClick={async () => {
                      try {
                        const newRoom = await createChannel([u.id], undefined, false);
                        const updatedChannels = await getUserChannels();
                        setChannels(updatedChannels as any);
                        setActiveChannel(newRoom as any);
                        setShowNewChatModal(false);
                      } catch (err) {
                        alert("Failed to create chat.");
                      }
                    }}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-300 group-hover:border-indigo-300 transition-colors">
                        {getInitials(u.firstName, u.lastName)}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${u.onlineStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{u.firstName} {u.lastName}</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{u.role.replace("_", " ")}</span>
                    </div>
                  </button>
                ))}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}