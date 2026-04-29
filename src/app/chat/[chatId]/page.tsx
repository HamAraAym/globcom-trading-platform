import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/actions/messageActions";
import { getServerSession } from "next-auth";
import { 
  MessageSquare, AlertCircle, Info, 
  MapPin, Calendar, CircleDollarSign, Scale, FileBox, Package,
  Truck, CreditCard, ShieldCheck, List, CalendarClock, FileText, Anchor, Shield 
} from "lucide-react";
import MediaGallery from "@/components/MediaGallery";
import ChatInput from "@/components/ChatInput"; 
import EmailDispatcher from "@/components/EmailDispatcher";
import DealStatusManager from "@/components/DealStatusManager";
import DocumentGenerator from "@/components/DocumentGenerator"; 

export default async function ChatRoomPage({ params }: { params: { chatId: string } }) {
  const session = await getServerSession();
  const resolvedParams = await params;
  const chatId = resolvedParams.chatId;

  // 1. Secure Role & Enterprise Branding Check
  let userRole = "GUEST";
  let userLetterhead: string | null = null;
  
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, letterheadUrl: true } // Fetch the letterhead!
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

  // Safely handle optional pricing
  const rawPrice = isDemand ? (contextItem as any)?.targetPrice : (contextItem as any)?.price;
  const displayPrice = rawPrice ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rawPrice) : "TBD (Upon Request)";

  // SOP Compliance: Only Trading Team & Admins can change status
  const canEditStatus = userRole === "ADMIN" || userRole === "TRADING_REP";

  const send = sendMessage.bind(null, chatId);

  // Helper function to render Logistics fields cleanly in the narrow sidebar
  const renderLogisticsItem = (label: string, value: string | null, icon: React.ReactNode) => (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
        {icon} <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-bold text-slate-900 leading-tight">
        {value || <span className="text-slate-300 font-normal italic">Not specified</span>}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-8 font-sans flex flex-col h-screen overflow-hidden">
      
      <div className="max-w-[1600px] mx-auto w-full mb-6 shrink-0">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <MessageSquare size={24} className={`text-${themeColor}-600`} />
          Active Negotiation Terminal
        </h1>
        <p className="text-sm text-slate-500 mt-1">End-to-end encrypted internal communication channel.</p>
      </div>

      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden pb-4">
        
        {/* LEFT PANE: CHAT ENGINE */}
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
                          {msg.sender.role.replace("_", " ")}
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

        {/* RIGHT PANE: PRODUCT CONTEXT & ACTIONS */}
        <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
          
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Context Details</h3>
            </div>
            <DealStatusManager 
              itemId={contextItem!.id} 
              currentStatus={contextItem!.status} 
              type={isDemand ? "DEMAND" : "SUPPLY"} 
              chatId={chatId}
              canEdit={canEditStatus}
            />
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 flex flex-col">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm ${isDemand ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <ThemeIcon size={24} />
            </div>
            
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6">{contextItem?.title}</h2>

            {/* Core Metrics */}
            <div className="space-y-4 mb-8">
              
              {/* UPDATED: Quantity & Tolerance Display */}
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500"><Scale size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Quantity</span></div>
                <div className="text-right">
                  <span className="font-bold text-slate-900">
                    {new Intl.NumberFormat().format(contextItem?.quantity || 0)} <span className="text-xs text-slate-500 ml-1">{(contextItem as any)?.quantityUnit || "MT"}</span>
                  </span>
                  {(contextItem as any)?.tolerance && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                      {(contextItem as any).tolerance}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500"><CircleDollarSign size={16}/> <span className="text-xs font-bold uppercase tracking-wider">{isDemand ? 'Target Price' : 'Listing Price'}</span></div>
                <span className={`font-bold ${rawPrice ? 'text-slate-900' : 'text-slate-400 italic text-sm'}`}>{displayPrice}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-500">
                  {isDemand ? <><Calendar size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Timeline</span></> : <><MapPin size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Location</span></>}
                </div>
                <span className="font-bold text-slate-900 truncate max-w-[150px]" title={(contextItem as any)?.timeline || (contextItem as any)?.location}>
                  {(contextItem as any)?.timeline || (contextItem as any)?.location}
                </span>
              </div>
              {!isDemand && (contextItem as any)?.validityDate && (
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500"><CalendarClock size={16}/> <span className="text-xs font-bold uppercase tracking-wider">Validity</span></div>
                  <span className="font-bold text-rose-600">
                    {new Date((contextItem as any).validityDate).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Trade Logistics Grid */}
            <div className="mb-8">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Truck size={14} className={`text-${themeColor}-500`} /> Trade Logistics
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-y-4 gap-x-3">
                {renderLogisticsItem("Origin", (contextItem as any)?.origin, <MapPin size={12} className="text-slate-400" />)}
                {renderLogisticsItem("Destination", (contextItem as any)?.destination, <MapPin size={12} className="text-slate-400" />)}
                {renderLogisticsItem("Load Port", (contextItem as any)?.loadPort, <Anchor size={12} className="text-slate-400" />)}
                {renderLogisticsItem("Incoterms", (contextItem as any)?.incoterms, <Truck size={12} className="text-slate-400" />)}
                {renderLogisticsItem("Insurance", (contextItem as any)?.insurance, <Shield size={12} className="text-slate-400" />)}
                {renderLogisticsItem("Payment", (contextItem as any)?.paymentTerms, <CreditCard size={12} className="text-slate-400" />)}
                {renderLogisticsItem("Inspection", (contextItem as any)?.inspection, <ShieldCheck size={12} className="text-slate-400" />)}
                {renderLogisticsItem("Packaging", (contextItem as any)?.packaging, <Package size={12} className="text-slate-400" />)}
              </div>
            </div>

            {/* Technical Specifications (Dynamic JSON) */}
            {(contextItem as any)?.keyTerms && Array.isArray((contextItem as any).keyTerms) && (contextItem as any).keyTerms.length > 0 && (
              <div className="mb-8">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <List size={14} className={`text-${themeColor}-500`} /> Technical Specs
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {(contextItem as any).keyTerms.map((term: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{term.label}</span>
                      <span className="text-xs font-bold text-slate-900 text-right">{term.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Documents */}
            {contextItem?.attachments && contextItem.attachments.length > 0 && (
              <div className="mb-8">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  Attached Documents ({contextItem.attachments.length})
                </h4>
                <MediaGallery attachments={contextItem.attachments} />
              </div>
            )}
            
            <div className="mt-auto pt-6 border-t border-slate-100 space-y-4">
              
              {/* SMART PROPOSAL GENERATOR - NOW ACCEPTS LETTERHEAD */}
              {clients.length > 0 ? (
                <DocumentGenerator 
                  clientId={clients[0].id} 
                  clientName={clients[0].name}
                  clientCompany={clients[0].company || "Individual Entity"}
                  contextItem={contextItem}
                  defaultDocType={isDemand ? "LOI" : "FCO"} 
                  buttonStyle={`w-full bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-lg shadow-slate-900/20`}
                  userLetterhead={userLetterhead}
                />
              ) : (
                <div className="bg-rose-50 text-rose-600 text-xs font-bold p-3 rounded-xl border border-rose-100 flex items-center gap-2">
                  <AlertCircle size={14} /> Add clients in CRM to generate proposals.
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