import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/actions/messageActions";
import { getServerSession } from "next-auth";
import { getGlobalSettings } from "@/actions/adminActions"; 
import { 
  MessageSquare, AlertCircle, Info, 
  MapPin, Calendar, CircleDollarSign, Scale, FileBox, Package,
  Truck, CreditCard, ShieldCheck, ShieldAlert, List, CalendarClock, Anchor, Shield,
  X, PanelRightOpen // ⚡ NEW: Icons for the mobile drawer
} from "lucide-react";
import MediaGallery from "@/components/MediaGallery";
import ChatInput from "@/components/ChatInput"; 
import EmailDispatcher from "@/components/EmailDispatcher";
import DealStatusManager from "@/components/DealStatusManager";
import DocumentGenerator from "@/components/DocumentGenerator"; 
import RealtimeMessageFeed from "@/components/RealtimeMessageFeed"; 

export default async function ChatRoomPage({ params }: { params: Promise<{ chatId: string }> }) {
  const session = await getServerSession();
  const resolvedParams = await params;
  const chatId = resolvedParams.chatId;

  // 1. Secure Role Check
  let userRole = "GUEST";
  
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true } 
    });
    if (dbUser) {
      userRole = dbUser.role;
    }
  }

  // 2. Fetch the Global Enterprise Letterhead
  const systemSettings = await getGlobalSettings();
  const userLetterhead = systemSettings?.letterheadUrl || null;

  // 3. Fetch Room, Users, and Clients
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
  
  // Hardcoded GlobCom Theming
  const themeColor = isDemand ? "blue" : "green";
  const ThemeIcon = isDemand ? FileBox : Package;

  const rawPrice = isDemand ? (contextItem as any)?.targetPrice : (contextItem as any)?.price;
  const displayPrice = rawPrice ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rawPrice) : "TBD (Upon Request)";

  const canEditStatus = userRole === "ADMIN" || userRole === "TRADING_REP";
  const send = sendMessage.bind(null, chatId);

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
    <div 
      // ⚡ FIX: Hard-locked to 100dvh and flex-col to prevent keyboard scrolling bugs on mobile
      className="h-[100dvh] bg-slate-50/50 flex flex-col overflow-hidden w-full relative"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      
      {/* 1. Desktop Header Area (Hidden on Mobile to maximize chat space) */}
      <div className="hidden md:flex max-w-[1600px] mx-auto w-full mb-4 shrink-0 px-4 pt-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <MessageSquare size={20} className={isDemand ? "text-blue-800" : "text-green-600"} />
            Active Negotiation Terminal
          </h1>
          <p className="text-sm text-slate-500 mt-1">End-to-end encrypted internal communication channel.</p>
        </div>
      </div>

      {/* ⚡ THE CSS-ONLY MOBILE DRAWER STATE */}
      {/* This hidden checkbox controls the sliding sidebar without needing React State! */}
      <input type="checkbox" id="context-drawer" className="hidden peer" />

      {/* ⚡ Mobile Drawer Overlay (Dims background when open) */}
      <label htmlFor="context-drawer" className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 hidden peer-checked:block transition-opacity"></label>

      {/* Main Workspace Frame */}
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex md:px-4 md:pb-4 min-h-0 overflow-hidden relative">
        
        {/* ========================================================= */}
        {/* LEFT PANE: CHAT ENGINE (Fills screen on mobile)           */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col bg-white md:rounded-l-3xl shadow-sm md:border md:border-r-0 border-slate-200 overflow-hidden relative min-w-0 z-10">
          
          {/* Chat Header */}
          <div className="bg-[#0f172a] px-3 md:px-6 py-3 flex justify-between items-center shrink-0 border-b border-slate-800 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <span className={`hidden sm:inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md ${isDemand ? 'bg-blue-100/20 text-blue-300 border border-blue-100/30' : 'bg-green-100/20 text-green-300 border border-green-100/30'}`}>
                {typeLabel} ROOM
              </span>
              <h2 className="text-sm md:text-lg font-bold text-white tracking-wide truncate max-w-[180px] sm:max-w-xs md:max-w-md">{contextItem?.title}</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden md:flex bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-slate-700 items-center gap-2 shadow-inner">
                <div className={`w-2 h-2 rounded-full ${isDemand ? 'bg-blue-400' : 'bg-green-400'} animate-pulse`}></div>
                {room.messages.length} Transmissions
              </div>
              
              {/* ⚡ Mobile Toggle Trigger */}
              <label 
                htmlFor="context-drawer" 
                className="md:hidden flex items-center gap-1.5 bg-slate-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-slate-700 transition-colors"
              >
                <PanelRightOpen size={14} /> Specs
              </label>
            </div>
          </div>

          {/* REALTIME WEBSOCKET MESSAGE FEED */}
          <div className="flex-1 overflow-hidden relative bg-slate-50/50">
            <RealtimeMessageFeed 
              initialMessages={room.messages as any} 
              chatId={chatId} 
              currentUserEmail={session?.user?.email || undefined} 
              themeColor={themeColor} 
            />
          </div>

          <ChatInput 
            chatId={chatId} 
            users={internalUsers} 
            themeColor={themeColor} 
            sendAction={send} 
          />
        </div>

        {/* ========================================================= */}
        {/* RIGHT PANE: INTELLIGENCE SIDEBAR (Slide-out on Mobile)    */}
        {/* ========================================================= */}
        <div className="fixed inset-y-0 right-0 z-50 w-[85vw] sm:w-[400px] bg-white shadow-2xl transition-transform duration-300 translate-x-full peer-checked:translate-x-0 md:relative md:translate-x-0 md:w-[400px] xl:w-[450px] md:z-0 flex flex-col md:rounded-r-3xl md:border md:border-l border-slate-200">
          
          {/* Mobile Close Header */}
          <div className="md:hidden bg-[#0f172a] px-4 py-3 flex justify-between items-center shrink-0 border-b border-slate-800 text-white" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}>
             <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
               <Info size={16} className="text-slate-400" /> Deal Intelligence
             </h3>
             <label htmlFor="context-drawer" className="p-1.5 bg-slate-800 rounded-lg cursor-pointer">
               <X size={18} />
             </label>
          </div>

          <div className="hidden md:flex bg-slate-50 px-6 py-4 border-b border-slate-100 items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-slate-400 shrink-0" />
              <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">Deal Intelligence</h3>
            </div>
          </div>

          {/* Sidebar Content (Scrollable) */}
          <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col bg-white">
            
            <div className="mb-4 md:hidden">
              <DealStatusManager 
                itemId={contextItem!.id} 
                currentStatus={contextItem!.status} 
                type={isDemand ? "DEMAND" : "SUPPLY"} 
                chatId={chatId}
                canEdit={canEditStatus}
              />
            </div>

            <div className="hidden md:block mb-6 border-b border-slate-100 pb-6">
              <DealStatusManager 
                itemId={contextItem!.id} 
                currentStatus={contextItem!.status} 
                type={isDemand ? "DEMAND" : "SUPPLY"} 
                chatId={chatId}
                canEdit={canEditStatus}
              />
            </div>

            {/* Title & Icon Header */}
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${isDemand ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                <ThemeIcon size={24} className="md:w-7 md:h-7" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-lg md:text-xl font-black text-slate-900 tracking-tight truncate">{contextItem?.title}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate">GlobCom Reference Data</p>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6 md:mb-8">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5"><Scale size={12} className="md:w-3.5 md:h-3.5"/> <span className="text-[9px] font-black uppercase tracking-widest">Quantity</span></div>
                <div>
                  <span className="font-black text-lg text-slate-900 truncate block">
                    {new Intl.NumberFormat().format(contextItem?.quantity || 0)} <span className="text-xs text-slate-500 ml-1">{(contextItem as any)?.quantityUnit || "MT"}</span>
                  </span>
                  {(contextItem as any)?.tolerance && (
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate" title={(contextItem as any).tolerance}>
                      {(contextItem as any).tolerance}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5"><CircleDollarSign size={12} className="md:w-3.5 md:h-3.5"/> <span className="text-[9px] font-black uppercase tracking-widest truncate">{isDemand ? 'Target Price' : 'Listing Price'}</span></div>
                <span className={`font-black text-lg truncate block ${rawPrice ? 'text-slate-900' : 'text-slate-400 italic text-sm'}`}>{displayPrice}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-slate-500 mb-1.5">
                  {isDemand ? <><Calendar size={12} className="md:w-3.5 md:h-3.5"/> <span className="text-[9px] font-black uppercase tracking-widest">Timeline</span></> : <><MapPin size={12} className="md:w-3.5 md:h-3.5"/> <span className="text-[9px] font-black uppercase tracking-widest">Location</span></>}
                </div>
                <span className="font-bold text-sm text-slate-800 truncate block" title={(contextItem as any)?.timeline || (contextItem as any)?.location}>
                  {(contextItem as any)?.timeline || (contextItem as any)?.location}
                </span>
              </div>

              {!isDemand && (contextItem as any)?.validityDate && (
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-rose-500/70 mb-1.5"><CalendarClock size={12} className="md:w-3.5 md:h-3.5"/> <span className="text-[9px] font-black uppercase tracking-widest">Validity</span></div>
                  <span className="font-bold text-sm text-rose-600 truncate block">
                    {new Date((contextItem as any).validityDate).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Trade Logistics Grid */}
            <div className="mb-6 md:mb-8">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Truck size={12} className={isDemand ? "text-blue-800" : "text-green-600"} /> Trade Logistics
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {renderLogisticsItem("Origin", (contextItem as any)?.origin, <MapPin size={10} className="text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Destination", (contextItem as any)?.destination, <MapPin size={10} className="text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Load Port", (contextItem as any)?.loadPort, <Anchor size={10} className="text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Incoterms", (contextItem as any)?.incoterms, <Truck size={10} className="text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Insurance", (contextItem as any)?.insurance, <Shield size={10} className="text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Payment", (contextItem as any)?.paymentTerms, <CreditCard size={10} className="text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Inspection", (contextItem as any)?.inspection, <ShieldCheck size={10} className="text-slate-400 shrink-0" />)}
                {renderLogisticsItem("Packaging", (contextItem as any)?.packaging, <Package size={10} className="text-slate-400 shrink-0" />)}
              </div>
            </div>

            {/* Technical Specifications */}
            {(contextItem as any)?.keyTerms && Array.isArray((contextItem as any).keyTerms) && (contextItem as any).keyTerms.length > 0 && (
              <div className="mb-6 md:mb-8">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <List size={12} className={isDemand ? "text-blue-800" : "text-green-600"} /> Technical Specs
                </h4>
                <div className="grid grid-cols-1 gap-1.5">
                  {(contextItem as any).keyTerms.map((term: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0 mr-2">{term.label}</span>
                      <span className="text-xs font-bold text-slate-900 text-right truncate" title={term.value}>{term.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Documents */}
            {contextItem?.attachments && contextItem.attachments.length > 0 && (
              <div className="mb-6 md:mb-8">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  Attached Documents ({contextItem.attachments.length})
                </h4>
                <MediaGallery attachments={contextItem.attachments} />
              </div>
            )}
            
            <div className="mt-auto pt-6 border-t border-slate-100 space-y-3 pb-8 md:pb-0">
              
              {/* SMART PROPOSAL GENERATOR */}
              {clients.length > 0 ? (
                <DocumentGenerator 
                  clients={clients} 
                  contextItem={contextItem}
                  defaultDocType={isDemand ? "LOI" : "FCO"} 
                  buttonStyle={`w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-3.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20`}
                  userLetterhead={userLetterhead}
                />
              ) : (
                <div className="bg-rose-50 text-rose-600 text-xs font-bold p-3 rounded-xl border border-rose-100 flex items-center gap-2">
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