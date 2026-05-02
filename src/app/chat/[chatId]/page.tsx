import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/actions/messageActions";
import { getServerSession } from "next-auth";
import { 
  MessageSquare, AlertCircle, Info, 
  MapPin, Calendar, CircleDollarSign, Scale, FileBox, Package,
  Truck, CreditCard, ShieldCheck, ShieldAlert, List, CalendarClock, Anchor, Shield, Send
} from "lucide-react";
import MediaGallery from "@/components/MediaGallery";
import ChatInput from "@/components/ChatInput"; 
import EmailDispatcher from "@/components/EmailDispatcher";
import DealStatusManager from "@/components/DealStatusManager";
import DocumentGenerator from "@/components/DocumentGenerator"; 
import RealtimeMessageFeed from "@/components/RealtimeMessageFeed"; // NEW: Realtime Websocket Feed

export default async function ChatRoomPage({ params }: { params: Promise<{ chatId: string }> }) {
  const session = await getServerSession();
  const resolvedParams = await params;
  const chatId = resolvedParams.chatId;

  // 1. Secure Role & Enterprise Branding Check
  let userRole = "GUEST";
  let userLetterhead: string | null = null;
  
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, letterheadUrl: true }
    });
    if (dbUser) {
      userRole = dbUser.role;
      userLetterhead = dbUser.letterheadUrl;
    }
  }

  // 2. Fetch Room, Users, and Clients
  const [room, internalUsers, clients] = await Promise.all([
    prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: {
        demand: { include: { createdBy: true, documents: true } }, 
        supply: { include: { createdBy: true, documents: true } }, 
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
    prisma.client.findMany({
      orderBy: { name: "asc" }
    })
  ]);

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6">
        <div className="bg-white p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <ShieldAlert className="mx-auto text-rose-500 mb-4 w-10 h-10 md:w-12 md:h-12" />
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h1>
          <p className="text-slate-500 mt-2 text-xs md:text-sm">This negotiation room does not exist or has been closed by the administrator.</p>
        </div>
      </div>
    );
  }

  const contextItem = room.demand || room.supply;
  const isDemand = !!room.demand;
  const typeLabel = isDemand ? "DEMAND" : "SUPPLY";
  
  const themeColor = isDemand ? "blue" : "emerald";
  const ThemeIcon = isDemand ? FileBox : Package;

  // Safely handle optional pricing
  const rawPrice = isDemand ? (contextItem as any)?.targetPrice : (contextItem as any)?.price;
  const displayPrice = rawPrice ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rawPrice) : "TBD (Upon Request)";

  // SOP Compliance
  const canEditStatus = userRole === "ADMIN" || userRole === "TRADING_REP";
  const send = sendMessage.bind(null, chatId);

  // Helper function to render Logistics fields cleanly in the narrow sidebar
  const renderLogisticsItem = (label: string, value: string | null, icon: React.ReactNode) => (
    <div className="flex flex-col bg-slate-50 p-2 md:p-2.5 rounded-lg border border-slate-100">
      <div className="flex items-center gap-1 md:gap-1.5 text-slate-400 mb-0.5">
        {icon} <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-[10px] md:text-xs font-bold text-slate-900 leading-tight truncate" title={value || ""}>
        {value || <span className="text-slate-400 font-normal italic">Not specified</span>}
      </p>
    </div>
  );

  return (
    // Changed to min-h-full to allow natural scrolling on mobile without forced cutoffs
    <div className="min-h-full bg-slate-50 p-2 sm:p-4 lg:p-8 font-sans flex flex-col selection:bg-indigo-500/30 selection:text-indigo-900 overflow-x-hidden">
      
      <div className="max-w-[1600px] mx-auto w-full mb-4 md:mb-6 shrink-0 px-2 sm:px-0">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 md:gap-3">
          <MessageSquare size={20} className={`text-${themeColor}-600 md:w-6 md:h-6`} />
          Active Negotiation Terminal
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">End-to-end encrypted internal communication channel.</p>
      </div>

      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col lg:flex-row gap-4 md:gap-6 pb-2 lg:pb-4 h-auto lg:h-[calc(100vh-140px)]">
        
        {/* LEFT PANE: CHAT ENGINE (Takes up full height on desktop, min height on mobile) */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[500px] lg:min-h-0 order-2 lg:order-1">
          
          <div className="bg-slate-900 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center shrink-0 border-b border-slate-800 z-10 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3">
              <span className={`hidden sm:inline-block px-2 md:px-2.5 py-1 text-[8px] md:text-[9px] font-black uppercase tracking-widest rounded-md ${isDemand ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {typeLabel} ROOM
              </span>
              <h2 className="text-sm md:text-lg font-bold text-white tracking-wide truncate max-w-[150px] sm:max-w-xs md:max-w-md">{contextItem?.title}</h2>
            </div>
            <div className="bg-slate-800 text-slate-300 text-[8px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl border border-slate-700 flex items-center gap-1.5 md:gap-2 shadow-inner whitespace-nowrap">
               <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isDemand ? 'bg-blue-500' : 'bg-emerald-500'} animate-pulse`}></div>
               {room.messages.length} <span className="hidden sm:inline">Transmissions</span>
            </div>
          </div>

          {/* REALTIME WEBSOCKET MESSAGE FEED */}
          <RealtimeMessageFeed 
            initialMessages={room.messages as any} 
            chatId={chatId} 
            currentUserEmail={session?.user?.email || undefined} 
            themeColor={themeColor} 
          />

          <ChatInput 
            chatId={chatId} 
            users={internalUsers} 
            themeColor={themeColor} 
            sendAction={send} 
          />
        </div>

        {/* RIGHT PANE: PRODUCT CONTEXT & ACTIONS (Stacks on top on mobile, sits on right on desktop) */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 flex flex-col h-auto lg:h-full overflow-hidden order-1 lg:order-2">
          
          <div className="bg-slate-50 px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-slate-400 shrink-0" />
              <h3 className="text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-widest">Context Details</h3>
            </div>
            <div className="w-full sm:w-auto">
              <DealStatusManager 
                itemId={contextItem!.id} 
                currentStatus={contextItem!.status} 
                type={isDemand ? "DEMAND" : "SUPPLY"} 
                chatId={chatId}
                canEdit={canEditStatus}
              />
            </div>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
            
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8 border-b border-slate-100 pb-4 md:pb-6">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${isDemand ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                <ThemeIcon size={24} className="md:w-7 md:h-7" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight truncate">{contextItem?.title}</h2>
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 md:mt-1 truncate">GlobCom Reference Data</p>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 md:gap-3 mb-6 md:mb-8">
              
              <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 mb-1 md:mb-1.5"><Scale size={12} className="md:w-3.5 md:h-3.5"/> <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Quantity</span></div>
                <div>
                  <span className="font-black text-base md:text-lg text-slate-900 truncate block">
                    {new Intl.NumberFormat().format(contextItem?.quantity || 0)} <span className="text-[10px] md:text-xs text-slate-500 ml-0.5 md:ml-1">{(contextItem as any)?.quantityUnit || "MT"}</span>
                  </span>
                  {(contextItem as any)?.tolerance && (
                    <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate" title={(contextItem as any).tolerance}>
                      {(contextItem as any).tolerance}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 mb-1 md:mb-1.5"><CircleDollarSign size={12} className="md:w-3.5 md:h-3.5"/> <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest truncate">{isDemand ? 'Target Price' : 'Listing Price'}</span></div>
                <span className={`font-black text-base md:text-lg truncate block ${rawPrice ? 'text-slate-900' : 'text-slate-400 italic text-xs md:text-sm'}`}>{displayPrice}</span>
              </div>

              <div className="bg-slate-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 mb-1 md:mb-1.5">
                  {isDemand ? <><Calendar size={12} className="md:w-3.5 md:h-3.5"/> <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Timeline</span></> : <><MapPin size={12} className="md:w-3.5 md:h-3.5"/> <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Location</span></>}
                </div>
                <span className="font-bold text-xs md:text-sm text-slate-800 truncate block" title={(contextItem as any)?.timeline || (contextItem as any)?.location}>
                  {(contextItem as any)?.timeline || (contextItem as any)?.location}
                </span>
              </div>

              {!isDemand && (contextItem as any)?.validityDate && (
                <div className="bg-rose-50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-rose-100 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 md:gap-2 text-rose-500/70 mb-1 md:mb-1.5"><CalendarClock size={12} className="md:w-3.5 md:h-3.5"/> <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">Validity</span></div>
                  <span className="font-bold text-xs md:text-sm text-rose-600 truncate block">
                    {new Date((contextItem as any).validityDate).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Trade Logistics Grid */}
            <div className="mb-6 md:mb-8">
              <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
                <Truck size={12} className={`text-${themeColor}-500 md:w-3.5 md:h-3.5`} /> Trade Logistics
              </h4>
              <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                {renderLogisticsItem("Origin", (contextItem as any)?.origin, <MapPin size={10} className="md:w-3 md:h-3 text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Destination", (contextItem as any)?.destination, <MapPin size={10} className="md:w-3 md:h-3 text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Load Port", (contextItem as any)?.loadPort, <Anchor size={10} className="md:w-3 md:h-3 text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Incoterms", (contextItem as any)?.incoterms, <Truck size={10} className="md:w-3 md:h-3 text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Insurance", (contextItem as any)?.insurance, <Shield size={10} className="md:w-3 md:h-3 text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Payment", (contextItem as any)?.paymentTerms, <CreditCard size={10} className="md:w-3 md:h-3 text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Inspection", (contextItem as any)?.inspection, <ShieldCheck size={10} className="md:w-3 md:h-3 text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Packaging", (contextItem as any)?.packaging, <Package size={10} className="md:w-3 md:h-3 text-slate-400 shrink-0" />)}
              </div>
            </div>

            {/* Technical Specifications (Dynamic JSON) */}
            {(contextItem as any)?.keyTerms && Array.isArray((contextItem as any).keyTerms) && (contextItem as any).keyTerms.length > 0 && (
              <div className="mb-6 md:mb-8">
                <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
                  <List size={12} className={`text-${themeColor}-500 md:w-3.5 md:h-3.5`} /> Technical Specs
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {(contextItem as any).keyTerms.map((term: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 md:p-3 bg-slate-50 border border-slate-100 rounded-lg md:rounded-xl">
                      <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0 mr-2">{term.label}</span>
                      <span className="text-[10px] md:text-xs font-bold text-slate-900 text-right truncate" title={term.value}>{term.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Documents */}
            {contextItem?.attachments && contextItem.attachments.length > 0 && (
              <div className="mb-6 md:mb-8">
                <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
                  Attached Documents ({contextItem.attachments.length})
                </h4>
                <MediaGallery attachments={contextItem.attachments} />
              </div>
            )}
            
            <div className="mt-auto pt-4 md:pt-6 border-t border-slate-100 space-y-2.5 md:space-y-3">
              
              {/* SMART PROPOSAL GENERATOR */}
              {clients.length > 0 ? (
                <DocumentGenerator 
                  clients={clients} 
                  contextItem={contextItem}
                  defaultDocType={isDemand ? "LOI" : "FCO"} 
                  buttonStyle={`w-full bg-slate-900 hover:bg-slate-800 text-white px-3 md:px-4 py-3 md:py-3.5 rounded-xl text-xs md:text-sm font-bold transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20`}
                  userLetterhead={userLetterhead}
                />
              ) : (
                <div className="bg-rose-50 text-rose-600 text-[10px] md:text-xs font-bold p-2.5 md:p-3 rounded-xl border border-rose-100 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" /> Add clients in CRM to generate proposals.
                </div>
              )}

              {/* EXTERNAL EMAIL DISPATCHER */}
              <EmailDispatcher 
                buyers={clients} 
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