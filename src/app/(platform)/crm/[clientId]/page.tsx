import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { 
  Building, Mail, Phone, MapPin, ShieldCheck, Clock, ShieldAlert, 
  Briefcase, Activity, FileText, CheckCircle2, ChevronLeft, Plus, FileEdit,
  User, FileBadge, Globe, ExternalLink, Trash2, Edit, Send, Download,
  Package, ArrowRight, Landmark, FileSpreadsheet
} from "lucide-react";
import DocumentGenerator from "@/components/DocumentGenerator";
import KycStatusUpdater from "@/components/KycStatusUpdater"; 
import { createSystemNotification } from "@/actions/notificationActions"; // ⚡ NEW: Hooked into the Alert Engine

export default async function ClientProfilePage({ params }: { params: Promise<{ clientId: string }> }) {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true }
  });

  const resolvedParams = await params;
  const clientId = resolvedParams.clientId;

  const clientData = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      assignedRep: true,
      activities: { 
        orderBy: { createdAt: "desc" },
        include: { user: true }
      },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { generatedBy: true }
      }
    }
  });

  if (!clientData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="mx-auto text-rose-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Entity Not Found</h1>
          <p className="text-slate-500 mt-2">This client profile does not exist or has been purged.</p>
          <Link href="/buyers" className="mt-6 inline-block bg-blue-800 text-white px-6 py-2.5 rounded-xl font-bold">Return to CRM</Link>
        </div>
      </div>
    );
  }

  // Type Safety Overrides
  const client = clientData as any; 
  const demands = [] as any[]; 
  const supplies = [] as any[]; 
  const activities = (client.activities || []) as any[];
  const documents = (client.documents || []) as any[];

  const isAdmin = currentUser?.role === "ADMIN";

  // ==========================================
  // INLINE SERVER ACTIONS (Now securely wired!)
  // ==========================================
  const deleteEntity = async () => {
    "use server";
    if (currentUser?.role !== "ADMIN") return;

    // ⚡ Log the destructive action before deletion
    await prisma.auditLog.create({
      data: {
        action: "PURGED_CLIENT",
        details: `Deleted client entity: ${client.company || client.name}`,
        userId: currentUser.id
      }
    });

    await prisma.client.delete({ where: { id: clientId } });
    redirect("/buyers");
  };

  const dispatchDocument = async (formData: FormData) => {
    "use server";
    const docTitle = formData.get("docTitle") as string;
    if (currentUser) {
      
      // 1. Log the Activity
      await prisma.clientActivity.create({
        data: {
          type: "DOCUMENT_DISPATCHED",
          description: `Dispatched official document [${docTitle}] to the client's registered email.`,
          clientId: clientId,
          userId: currentUser.id
        }
      });

      // ⚡ 2. Notify the assigned rep (if someone else sent it)
      if (client.assignedRepId && client.assignedRepId !== currentUser.id) {
        await createSystemNotification({
          userId: client.assignedRepId,
          title: "Document Dispatched",
          message: `A new document [${docTitle}] was sent to your client ${client.company || client.name}.`,
          link: `/crm/${clientId}`
        });
      }

      revalidatePath(`/crm/${clientId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans flex flex-col overflow-y-auto custom-scrollbar">
      
      <div className="max-w-[1400px] mx-auto w-full mb-8">
        <Link href="/buyers" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-800 transition-colors mb-4">
          <ChevronLeft size={16} /> Back to Master Database
        </Link>
        
        {/* HERO CARD */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          
          {/* Dark Structural Header */}
          <div className="bg-slate-900 px-6 md:px-8 py-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3 text-white">
              <Building className="text-blue-400" size={18} />
              <span className="font-bold tracking-wide text-sm md:text-base">Client Profile Master Record</span>
            </div>
            <div className="flex items-center gap-2 relative z-20">
               <Link href={`/crm/${clientId}/edit`} className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 shadow-sm" title="Edit Entity">
                 <Edit size={16} />
               </Link>
               {isAdmin && (
                 <form action={deleteEntity}>
                   <button type="submit" className="p-2 bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 shadow-sm" title="Purge Entity">
                     <Trash2 size={16} />
                   </button>
                 </form>
               )}
            </div>
          </div>

          {/* Hero Content */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            
            <div className="absolute right-0 bottom-0 opacity-[0.02] translate-x-10 translate-y-10 pointer-events-none">
              {client.type === "CORPORATE" ? <Building size={300} /> : <User size={300} />}
            </div>

            <div className="flex items-center gap-5">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-md shrink-0 border ${client.type === 'CORPORATE' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mr-2">{client.company || client.name}</h1>
                  
                  {client.type === "CORPORATE" ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200"><Building size={12} /> Corporate</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200"><User size={12} /> Individual</span>
                  )}

                  {isAdmin ? (
                    <KycStatusUpdater clientId={client.id} currentStatus={client.kycStatus} />
                  ) : (
                    <>
                      {client.kycStatus === "VERIFIED" && <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-2.5 py-1 rounded border border-green-200"><ShieldCheck size={14} /> Verified</span>}
                      {client.kycStatus === "PENDING" && <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200"><Clock size={14} /> Pending Docs</span>}
                      {client.kycStatus === "REJECTED" && <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200"><ShieldAlert size={14} /> Rejected</span>}
                    </>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm font-medium text-slate-500 mt-2">
                  {client.type === "CORPORATE" && client.company && (
                    <span className="flex items-center gap-1.5"><User size={16} className="text-slate-400" /> Rep: {client.name}</span>
                  )}
                  {client.type === "CORPORATE" && client.registrationNo && (
                    <span className="flex items-center gap-1.5"><FileBadge size={16} className="text-slate-400" /> {client.registrationNo}</span>
                  )}
                  <span className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-400" /> {client.address || client.country || "Location N/A"}</span>
                  {client.type === "CORPORATE" && client.website && (
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors">
                      <Globe size={16} className="text-blue-400" /> {client.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left md:text-right relative z-10 pt-4 md:pt-0 border-t border-slate-100 md:border-0 w-full md:w-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Account Executive</p>
              {client.assignedRep ? (
                <div className="text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center md:justify-end gap-2 shadow-sm">
                  <Briefcase size={14} className="text-blue-600" />
                  {client.assignedRep.firstName} {client.assignedRep.lastName}
                </div>
              ) : (
                <div className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-200 border-dashed px-4 py-2 rounded-xl flex items-center md:justify-end gap-2">
                  -- Unassigned --
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
        
        {/* LEFT COLUMN: Static Data & Document Vault */}
        <div className="space-y-6 md:space-y-8">
          
          {/* Contact Protocols Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
               <Mail className="text-blue-800" size={16} />
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Contact Protocols</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-sm font-bold text-slate-800">{client.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Direct Line</p>
                <p className="text-sm font-bold text-slate-800">{client.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Internal Notes</p>
                <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {client.notes || "No notes on file."}
                </p>
              </div>
            </div>
          </div>

          {/* Compliance Vault Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-2">
                 <ShieldCheck className="text-green-600" size={16} />
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Compliance Vault</h3>
               </div>
               <Link href={`/crm/${clientId}/edit`} className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-widest">
                  Upload <Plus size={12}/>
               </Link>
            </div>
            <div className="p-6 space-y-3">
              
              {/* Global KYC Docs */}
              <a href={client.passportUrl || "#"} target={client.passportUrl ? "_blank" : "_self"} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${client.passportUrl ? 'border-green-200 bg-green-50/50 hover:border-green-400' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                <span className={`text-sm font-bold flex items-center gap-2 ${client.passportUrl ? 'text-green-800' : 'text-slate-600 group-hover:text-blue-800'}`}><User size={16}/> Signatory Passport</span>
                {client.passportUrl ? <ExternalLink size={16} className="text-green-600" /> : <Plus size={16} className="text-slate-400 group-hover:text-blue-600" />}
              </a>

              <a href={client.proofOfFundsUrl || "#"} target={client.proofOfFundsUrl ? "_blank" : "_self"} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${client.proofOfFundsUrl ? 'border-green-200 bg-green-50/50 hover:border-green-400' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                <span className={`text-sm font-bold flex items-center gap-2 ${client.proofOfFundsUrl ? 'text-green-800' : 'text-slate-600 group-hover:text-blue-800'}`}><Landmark size={16}/> Proof of Funds (POF)</span>
                {client.proofOfFundsUrl ? <ExternalLink size={16} className="text-green-600" /> : <Plus size={16} className="text-slate-400 group-hover:text-blue-600" />}
              </a>

              <a href={client.bankReferenceUrl || "#"} target={client.bankReferenceUrl ? "_blank" : "_self"} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${client.bankReferenceUrl ? 'border-green-200 bg-green-50/50 hover:border-green-400' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                <span className={`text-sm font-bold flex items-center gap-2 ${client.bankReferenceUrl ? 'text-green-800' : 'text-slate-600 group-hover:text-blue-800'}`}><FileSpreadsheet size={16}/> Bank Reference Letter</span>
                {client.bankReferenceUrl ? <ExternalLink size={16} className="text-green-600" /> : <Plus size={16} className="text-slate-400 group-hover:text-blue-600" />}
              </a>

              {/* Corporate Specific KYC Docs */}
              {client.type === "CORPORATE" && (
                <>
                  <a href={client.tradeLicenseUrl || "#"} target={client.tradeLicenseUrl ? "_blank" : "_self"} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${client.tradeLicenseUrl ? 'border-green-200 bg-green-50/50 hover:border-green-400' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <span className={`text-sm font-bold flex items-center gap-2 ${client.tradeLicenseUrl ? 'text-green-800' : 'text-slate-600 group-hover:text-blue-800'}`}><FileText size={16}/> Trade License</span>
                    {client.tradeLicenseUrl ? <ExternalLink size={16} className="text-green-600" /> : <Plus size={16} className="text-slate-400 group-hover:text-blue-600" />}
                  </a>

                  <a href={client.companyProfileUrl || "#"} target={client.companyProfileUrl ? "_blank" : "_self"} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${client.companyProfileUrl ? 'border-green-200 bg-green-50/50 hover:border-green-400' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                    <span className={`text-sm font-bold flex items-center gap-2 ${client.companyProfileUrl ? 'text-green-800' : 'text-slate-600 group-hover:text-blue-800'}`}><Briefcase size={16}/> Company Profile / Deck</span>
                    {client.companyProfileUrl ? <ExternalLink size={16} className="text-green-600" /> : <Plus size={16} className="text-slate-400 group-hover:text-blue-600" />}
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Generated Contracts Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
               <FileBadge className="text-blue-800" size={16} />
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Generated Contracts</h3>
            </div>
            <div className="p-6 space-y-3">
              {documents.length === 0 ? (
                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <p className="text-xs font-bold text-slate-500">No contracts generated yet.</p>
                </div>
              ) : (
                documents.map((doc: any) => (
                  <div key={doc.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between bg-white shadow-sm hover:border-blue-300 transition-colors">
                    <div className="flex-1 overflow-hidden pr-2">
                      <p className="text-sm font-bold text-slate-800 truncate" title={doc.title}>{doc.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {new Date(doc.createdAt).toLocaleDateString()} • By {doc.generatedBy?.firstName || "System"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="View/Download PDF">
                        <Download size={16} />
                      </a>
                      <form action={dispatchDocument}>
                        <input type="hidden" name="docTitle" value={doc.title} />
                        <button type="submit" className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1" title="Email to Client">
                          <Send size={16} />
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Deal History & Activity */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* Document Generation Engine Card */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col">
            <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4 pointer-events-none"><FileEdit size={150} /></div>
            
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center gap-2 shrink-0 relative z-10">
               <FileEdit className="text-blue-400" size={16} />
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Document Generation Engine</h3>
            </div>
            
            <div className="p-6 md:p-8 relative z-10">
              <p className="text-slate-400 text-sm mb-6 max-w-md">
                Draft legally formatted Soft Corporate Offers (SCO) and Full Corporate Offers (FCO) to send directly to {client.company || client.name}.
              </p>
              <DocumentGenerator clients={[client]} />
            </div>
          </div>

          {/* Live Deal Pipeline Card */}
          {(demands.length > 0 || supplies.length > 0) && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
                 <Package className="text-blue-800" size={16} />
                 <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Live Deal Pipeline</h3>
              </div>
              <div className="p-6 space-y-3">
                {demands.map((demand: any) => (
                  <div key={demand.id} className="p-4 border border-blue-200 bg-blue-50/50 rounded-2xl flex items-center justify-between group hover:border-blue-400 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">Demand</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${demand.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{demand.status?.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{demand.title} <span className="text-slate-400 font-medium ml-1">• {demand.quantity} {demand.quantityUnit}</span></p>
                    </div>
                    {demand.chatRoomId && (
                      <Link href={`/chat/${demand.chatRoomId}`} className="text-xs font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg border border-blue-300 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        View Desk <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                ))}

                {supplies.map((supply: any) => (
                  <div key={supply.id} className="p-4 border border-green-200 bg-green-50/50 rounded-2xl flex items-center justify-between group hover:border-green-400 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-green-100 text-green-800 px-2 py-0.5 rounded border border-green-200">Supply</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${supply.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{supply.status?.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900">{supply.title} <span className="text-slate-400 font-medium ml-1">• {supply.quantity} {supply.quantityUnit}</span></p>
                    </div>
                    {supply.chatRoomId && (
                      <Link href={`/chat/${supply.chatRoomId}`} className="text-xs font-bold text-green-800 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg border border-green-300 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        View Desk <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col max-h-[500px] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0">
               <Activity className="text-blue-600" size={16} />
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Activity Timeline</h3>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar pr-4 space-y-6 relative">
              <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-100 z-0"></div>

              {activities.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 z-10 relative">
                  <Clock size={32} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold">No activity recorded.</p>
                  <p className="text-xs mt-1 text-center max-w-xs">Generated documents, sent emails, and calls will appear here.</p>
                </div>
              ) : (
                activities.map((activity: any) => (
                  <div key={activity.id} className="flex gap-4 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <Activity size={12} className="text-slate-400" />
                    </div>
                    <div className="pt-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900">{activity.type?.replace(/_/g, " ")}</span>
                        <span className="text-[10px] text-slate-400 font-bold">• {new Date(activity.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                        {activity.description}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                        Logged by: {activity.user?.firstName || "System"} {activity.user?.lastName || ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}