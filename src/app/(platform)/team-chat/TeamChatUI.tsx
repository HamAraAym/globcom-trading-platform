"use client";

import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";
import { Send, Loader2, MessageSquare, Hash, Paperclip, X, FileText, Image as ImageIcon, Plus, Menu, ChevronRight } from "lucide-react";
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
  users = [] 
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

  useEffect(() => {
    getUserChannels().then(data => {
      setChannels(data as any);
      if (data.length > 0) setActiveChannel(data[0] as any);
    });
  }, []);

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
    if (channel.isGroup) return { name: channel.name, icon: <Hash size={15} className="text-slate-400" /> };
    const otherUser = channel.members.find(m => m.id !== currentUserId);
    return { 
      name: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : "Direct Message", 
      icon: <div className={`w-2 h-2 rounded-full ${otherUser?.onlineStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
    };
  };

  const formatTime = (dateString: string | Date) => new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    // ⚡ FIX: Added padding and a subtle background so the chat window floats beautifully
    <div className="flex h-full w-full bg-slate-50 p-2 md:p-4 lg:p-6">
      
      {/* ⚡ FIX: The "App Window" wrapper with rounded corners and shadows */}
      <div className="flex h-full w-full bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden relative">
        
        {/* ========================================== */}
        {/* LEFT WORKSPACE SIDEBAR                     */}
        {/* ========================================== */}
        <div className={`absolute md:relative z-30 h-full w-72 bg-slate-50/50 border-r border-slate-100 flex flex-col transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
          
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-transparent h-16 shrink-0">
            <h2 className="text-slate-800 font-bold tracking-tight text-[15px] flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                <MessageSquare size={14} />
              </div>
              Team Comms
            </h2>
            <button onClick={() => setShowNewChatModal(true)} className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg shadow-sm transition-all active:scale-95">
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
            
            {/* Channels Section */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-3">Channels</h3>
              <div className="space-y-0.5">
                {channels.filter(c => c.isGroup).map(channel => {
                  const isActive = activeChannel?.id === channel.id;
                  return (
                    <button 
                      key={channel.id} onClick={() => { setActiveChannel(channel); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive 
                          ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60" 
                          : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent"
                      }`}
                    >
                      <Hash size={16} className={isActive ? "text-indigo-500" : "text-slate-400"} />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DMs Section */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-3">Direct Messages</h3>
              <div className="space-y-0.5">
                {channels.filter(c => !c.isGroup).map(channel => {
                  const isActive = activeChannel?.id === channel.id;
                  const { name, icon } = getChannelDisplay(channel);
                  return (
                    <button 
                      key={channel.id} onClick={() => { setActiveChannel(channel); setIsSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive 
                          ? "bg-white text-indigo-700 shadow-sm border border-slate-200/60" 
                          : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 border border-transparent"
                      }`}
                    >
                      <div className="w-4 flex items-center justify-center">{icon}</div>
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/20 z-20 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

        {/* ========================================== */}
        {/* MAIN CONVERSATION PANE                     */}
        {/* ========================================== */}
        <div className="flex-1 flex flex-col h-full bg-slate-50/30 relative w-full">
          
          {activeChannel ? (
            <>
              {/* Modern Frosted Header */}
              <div className="flex-none h-16 border-b border-slate-100 px-5 md:px-8 flex items-center bg-white/80 backdrop-blur-md z-10 gap-3">
                <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg" onClick={() => setIsSidebarOpen(true)}>
                  <Menu size={18} />
                </button>
                <div>
                  <h1 className="text-[16px] font-bold text-slate-900 tracking-tight leading-none flex items-center gap-2">
                    {activeChannel.isGroup ? <Hash size={16} className="text-slate-400" /> : getChannelDisplay(activeChannel).icon}
                    {getChannelDisplay(activeChannel).name}
                  </h1>
                  <p className="text-[11px] font-medium text-slate-400 mt-1.5 uppercase tracking-wider">
                    {activeChannel.isGroup ? `${activeChannel.members.length} operators` : 'End-to-End Encrypted'}
                  </p>
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar">
                <div className="max-w-4xl mx-auto w-full flex flex-col space-y-4">
                  
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-4 pt-20 h-full">
                      <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
                        <MessageSquare size={28} className="text-indigo-200" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">This is the start of a secure conversation.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.sender.id === currentUserId;
                      const showHeader = idx === 0 || messages[idx - 1].sender.id !== msg.sender.id;

                      return (
                        <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} ${showHeader && idx !== 0 ? "pt-3" : ""}`}>
                          
                          {!isMe && (
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-black shrink-0 mr-3 mt-0.5 border border-slate-300 hidden sm:flex">
                              {getInitials(msg.sender.firstName, msg.sender.lastName)}
                            </div>
                          )}

                          <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                            
                            {!isMe && showHeader && (
                              <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                                <span className="text-[12px] font-bold text-slate-800">{msg.sender.firstName} {msg.sender.lastName}</span>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase tracking-widest">{msg.sender.role.replace("_", " ")}</span>
                              </div>
                            )}

                            {/* Clean Message Bubble */}
                            <div className={`px-4 py-2.5 text-[14px] md:text-[15px] leading-relaxed shadow-sm rounded-2xl ${
                              isMe 
                                ? "bg-indigo-600 text-white rounded-tr-sm" 
                                : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm"
                            }`}>
                              {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}

                              {msg.fileUrl && (
                                <div className={`mt-2 ${msg.content ? "pt-2 border-t border-slate-200/20" : ""}`}>
                                  {msg.fileType === "IMAGE" ? (
                                    <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-slate-200 bg-slate-50 hover:opacity-90 transition-opacity">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={msg.fileUrl} alt="Attachment" className="max-w-[240px] max-h-[240px] object-cover w-full h-auto" />
                                    </a>
                                  ) : (
                                    <a href={msg.fileUrl} target="_blank" rel="noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm text-xs font-bold transition-all ${isMe ? "bg-indigo-700 border-indigo-500 hover:bg-indigo-800 text-white" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"}`}>
                                      <FileText size={16} className={isMe ? "text-indigo-200" : "text-indigo-500"} />
                                      <span className="truncate max-w-[180px]">{msg.fileName || "Download Document"}</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>

                            <span className="text-[10px] font-medium text-slate-400 mt-1 px-1">
                              {formatTime(msg.createdAt)}
                            </span>

                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} className="h-4" />
                </div>
              </div>

              {/* ⚡ FIX: Floating Input Bar */}
              <div className="flex-none p-4 md:p-6 z-20 bg-gradient-to-t from-white via-white to-transparent">
                <div className="max-w-4xl mx-auto w-full">
                  
                  {attachedFile && (
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 border border-indigo-100 px-3 py-2 rounded-xl text-xs font-bold shadow-sm w-max mb-3 animate-in zoom-in-95 duration-200">
                      {attachedFile.type.startsWith('image/') ? <ImageIcon size={14} className="text-indigo-600" /> : <FileText size={14} className="text-indigo-600" />}
                      <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                      <button type="button" onClick={() => setAttachedFile(null)} className="ml-2 hover:bg-white p-1 rounded-md transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSend} className="relative flex items-center bg-white border border-slate-300 shadow-sm rounded-2xl p-1 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 transition-all">
                    <input 
                      type="file" className="hidden" ref={fileInputRef}
                      onChange={(e) => { if (e.target.files && e.target.files[0]) setAttachedFile(e.target.files[0]); }}
                    />
                    <button 
                      type="button" onClick={() => fileInputRef.current?.click()}
                      className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors ml-1"
                    >
                      <Paperclip size={20} />
                    </button>
                    <input 
                      type="text" value={input} onChange={(e) => setInput(e.target.value)}
                      placeholder={`Message ${getChannelDisplay(activeChannel).name}...`} 
                      className="w-full bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 px-3 py-3 focus:outline-none"
                    />
                    <button 
                      type="submit" disabled={(!input.trim() && !attachedFile) || isSending}
                      className="p-3 ml-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white transition-all active:scale-95 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 disabled:shadow-none"
                    >
                      {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-slate-400 p-6 text-center">
              <div className="w-16 h-16 bg-white border border-slate-200/60 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                <MessageSquare size={24} className="text-slate-300" />
              </div>
              <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">Communication Center</h2>
              <p className="text-xs font-medium text-slate-400 max-w-sm mt-1.5 leading-relaxed">Select an ongoing conversation thread from the panel or spin up a new Direct Message.</p>
              <button className="md:hidden mt-5 px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md" onClick={() => setIsSidebarOpen(true)}>
                Open Channels
              </button>
            </div>
          )}

        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[75vh]">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="font-bold text-slate-900 text-[16px]">Start Direct Message</h3>
                <button onClick={() => setShowNewChatModal(false)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-2">
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
                        alert("Failed to build message channel.");
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold border border-slate-200 group-hover:border-slate-300 transition-colors">
                          {getInitials(u.firstName, u.lastName)}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${u.onlineStatus === 'ONLINE' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-slate-800">{u.firstName} {u.lastName}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{u.role.replace("_", " ")}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </button>
                ))}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}