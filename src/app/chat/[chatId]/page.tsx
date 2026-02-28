import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/actions/messageActions";
import { getServerSession } from "next-auth";
import { 
  MessageSquare, AlertCircle, Info, 
  MapPin, Calendar, CircleDollarSign, Scale, FileBox, Package 
} from "lucide-react";
import MediaGallery from "@/components/MediaGallery";
import ChatInput from "@/components/ChatInput"; 
import EmailDispatcher from "@/components/EmailDispatcher"; // NEW: The Email Dispatcher

export default async function ChatRoomPage({ params }: { params: { chatId: string } }) {
  const session = await getServerSession();
  const resolvedParams = await params;
  const chatId = resolvedParams.chatId;

  // 1. Fetch Room, Internal Users (for @mentions), and External Buyers (for Dispatching)
  const [room, internalUsers, externalBuyers] = await Promise.all([
    prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: {
        demand: { include: { createdBy: true } },
        supply: { include: { createdBy: true } },
        messages: {
          include: { sender: true },
          orderBy: { createdAt: "asc" }, 
        }
      }
    }),
    prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, role: true },
      orderBy: { firstName: 'asc' }
    }),
    prisma.externalBuyer.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md">
          <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
          <p className="text-slate-500 mt-2 text-sm">This negotiation room does not exist or has been closed by the administrator.</p>
        </div>
      </div>
    );
  }

  const contextItem = room.demand || room.supply;
  const isDemand = !!room.demand;
  const typeLabel = isDemand ? "DEMAND" : "SUPPLY";
  const themeColor = isDemand ? "blue" : "emerald";
  const ThemeIcon = isDemand ? FileBox : Package;

  // Bind the specific Chat ID to the server action
  const send = sendMessage.bind(null, chatId);

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* Page Header */}
      <div className="max-w-[1600px] mx-auto w-full mb-6 shrink-0">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <MessageSquare size={24} className={`text-${themeColor}-600`} />
          Active Negotiation Terminal
        </h1>
        <p className="text-sm text-slate-500 mt-1">End-to-end encrypted internal communication channel.</p>
      </div>

      {/* Split-Pane Layout */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden pb-4">
        
        {/* ========================================== */}
        {/* LEFT PANE: THE CHAT ENGINE                 */}
        {/* ========================================== */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
          
          <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0 border-b border-slate-800 z-10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-md ${isDemand ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {typeLabel} ROOM
                </span>
                <h2 className="text-lg font-bold text-white tracking-wide truncate max-w-md">{contextItem?.title}</h2>
              </div>
            </div>
            <div className="bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl shadow-inner flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isDemand ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`}></div>
               {room.messages.length} Transmissions
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 custom-scrollbar relative">
            {room.messages.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <MessageSquare size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold">Secure connection established.</p>
                <p className="text-xs mt-1">Begin the negotiation process below.</p>
              </div>
            ) : (
              room.messages.map((msg) => {
                const isMe = msg.sender.email === session?.user?.email;

                return (
                  <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`flex flex-col max-w-[80%] lg:max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-2 mb-1.5 px-1">
                        <span className="text-xs font-bold text-slate-700">{msg.sender.firstName} {msg.sender.lastName}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md">
                          {msg.sender.role}
                        </span>
                      </div>
                      
                      <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isMe 
                          ? `bg-${themeColor}-600 text-white rounded-tr-sm` 
                          : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                      }`}>
                        {msg.content}
                      </div>
                      
                      <span className="text-[10px] font-bold text-slate-400 mt-1.5 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <ChatInput 
            chatId={chatId} 
            users={internalUsers} 
            themeColor={themeColor} 
            sendAction={send} 
          />
        </div>

        {/* ========================================== */}
        {/* RIGHT PANE: PRODUCT CONTEXT & DISPATCHER   */}
        {/* ========================================== */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-2 shrink-0">
            <Info size={18} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Context Details</h3>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm ${isDemand ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <ThemeIcon size={24} />
            </div>
            
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">{contextItem?.title}</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500"><Scale size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Quantity</span></div>
                <span className="font-bold text-slate-900">{new Intl.NumberFormat().format(contextItem?.quantity || 0)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500"><CircleDollarSign size={16}/> <span className="text-xs font-bold uppercase tracking-wider">{isDemand ? 'Target Price' : 'Listing Price'}</span></div>
                <span className="font-bold text-slate-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((contextItem as any)?.targetPrice || (contextItem as any)?.price || 0)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500">
                  {isDemand ? <><Calendar size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Timeline</span></> : <><MapPin size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Location</span></>}
                </div>
                <span className="font-bold text-slate-900 truncate max-w-[150px]" title={(contextItem as any)?.timeline || (contextItem as any)?.location}>
                  {(contextItem as any)?.timeline || (contextItem as any)?.location}
                </span>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Specifications</h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {contextItem?.specs}
              </div>
            </div>

            {contextItem?.attachments && contextItem.attachments.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Attached Documents</h4>
                <MediaGallery attachments={contextItem.attachments} />
              </div>
            )}
            
            {/* THE NEW EMAIL DISPATCHER MODAL */}
            <div className="mt-auto pt-6 border-t border-slate-100">
              <EmailDispatcher 
                buyers={externalBuyers} 
                contextItem={contextItem} 
                type={isDemand ? "DEMAND" : "SUPPLY"} 
                themeColor={themeColor} 
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}