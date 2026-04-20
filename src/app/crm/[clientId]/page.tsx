import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { 
  Building, Mail, Phone, MapPin, ShieldCheck, Clock, ShieldAlert, 
  Briefcase, Activity, FileText, CheckCircle2, ChevronLeft, Plus, FileEdit,
  User, FileBadge, Globe, ExternalLink, Trash2, Edit, Send, Download
} from "lucide-react";
import DocumentGenerator from "@/components/DocumentGenerator";

export default async function ClientProfilePage({ params }: { params: { clientId: string } }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const clientId = resolvedParams.clientId;

  // Fetch the full 360-degree profile
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      assignedRep: true,
      activities: { 
        orderBy: { createdAt: "desc" },
        include: { user: true }
      },
      tasks: {
        orderBy: { dueDate: "asc" },
        include: { assignedTo: true }
      },
      documents: {
        orderBy: { createdAt: "desc" },
        include: { generatedBy: true }
      }
    }
  });

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <ShieldAlert className="mx-auto text-rose-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Entity Not Found</h1>
          <p className="text-slate-500 mt-2">This client profile does not exist or has been purged.</p>
          <Link href="/buyers" className="mt-6 inline-block bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold">Return to CRM</Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // INLINE SERVER ACTIONS (Next.js 14+)
  // ==========================================
  
  const deleteEntity = async () => {
    "use server";
    // Cascades and deletes all associated timeline activities and documents automatically!
    await prisma.client.delete({ where: { id: clientId } });
    redirect("/buyers");
  };

  const dispatchDocument = async (formData: FormData) => {
    "use server";
    const docTitle = formData.get("docTitle") as string;
    const currentUser = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });

    if (currentUser) {
      await prisma.clientActivity.create({
        data: {
          type: "DOCUMENT_DISPATCHED",
          description: `Dispatched official document [${docTitle}] to the client's registered email.`,
          clientId: clientId,
          userId: currentUser.id
        }
      });
      revalidatePath(`/crm/${clientId}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans flex flex-col overflow-y-auto custom-scrollbar">
      
      {/* Navigation Header */}
      <div className="max-w-[1400px] mx-auto w-full mb-8">
        <Link href="/buyers" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-4">
          <ChevronLeft size={16} /> Back to Master Database
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          
          {/* Subtle Background Icon based on Entity Type */}
          <div className="absolute right-0 top-0 opacity-[0.03] translate-x-10 -translate-y-10 pointer-events-none">
            {client.type === "CORPORATE" ? <Building size={300} /> : <User size={300} />}
          </div>

          {/* NEW: Action Controls (Edit & Delete) */}
          <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
             <Link href={`/crm/${clientId}/edit`} className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 rounded-xl transition-all shadow-sm" title="Edit Entity">
               <Edit size={16} />
             </Link>
             <form action={deleteEntity}>
               <button type="submit" className="p-2.5 bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 rounded-xl transition-all shadow-sm" title="Purge Entity">
                 <Trash2 size={16} />
               </button>
             </form>
          </div>

          <div className="flex items-center gap-5 relative z-10 mt-6 md:mt-0">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg shrink-0 ${client.type === 'CORPORATE' ? 'bg-indigo-900 text-indigo-50 shadow-indigo-900/20' : 'bg-emerald-900 text-emerald-50 shadow-emerald-900/20'}`}>
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{client.name}</h1>
                
                {/* Type Badge */}
                {client.type === "CORPORATE" ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200"><Building size={12} /> Corporate</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200"><User size={12} /> Individual</span>
                )}

                {/* KYC Badge */}
                {client.kycStatus === "VERIFIED" && <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200"><ShieldCheck size={14} /> Verified</span>}
                {client.kycStatus === "PENDING" && <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200"><Clock size={14} /> Pending Docs</span>}
                {client.kycStatus === "REJECTED" && <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200"><ShieldAlert size={14} /> Rejected</span>}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
                {client.type === "CORPORATE" && client.company && (
                  <span className="flex items-center gap-1.5"><Building size={16} className="text-indigo-400" /> {client.company}</span>
                )}
                {client.type === "CORPORATE" && client.registrationNo && (
                  <span className="flex items-center gap-1.5"><FileBadge size={16} className="text-amber-500" /> {client.registrationNo}</span>
                )}
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-rose-400" /> {client.address || "Location N/A"}</span>
                {client.type === "CORPORATE" && client.website && (
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                    <Globe size={16} className="text-blue-400" /> {client.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="text-right relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Account Executive</p>
            <p className="text-lg font-bold text-slate-900 flex items-center justify-end gap-2">
              <Briefcase size={18} className="text-indigo-500" /> 
              {client.assignedRep ? `${client.assignedRep.firstName} ${client.assignedRep.lastName}` : <span className="text-slate-400 italic">Unassigned</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        
        {/* LEFT COLUMN: Static Data & Document Vault */}
        <div className="space-y-8">
          
          {/* Contact Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Mail size={16} className="text-indigo-500" /> Contact Protocols
            </h3>
            <div className="space-y-4">
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

          {/* Smart Compliance Vault */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" /> Compliance Vault
            </h3>
            <div className="space-y-3">
              
              {client.type === "CORPORATE" && (
                <a href={client.tradeLicenseUrl || "#"} target={client.tradeLicenseUrl ? "_blank" : "_self"} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${client.tradeLicenseUrl ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                  <span className={`text-sm font-bold flex items-center gap-2 ${client.tradeLicenseUrl ? 'text-emerald-800' : 'text-slate-700 group-hover:text-indigo-700'}`}><FileText size={16}/> Trade License</span>
                  {client.tradeLicenseUrl ? <ExternalLink size={16} className="text-emerald-600" /> : <Plus size={16} className="text-slate-400 group-hover:text-indigo-500" />}
                </a>
              )}

              <a href={client.passportUrl || "#"} target={client.passportUrl ? "_blank" : "_self"} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${client.passportUrl ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400' : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}>
                <span className={`text-sm font-bold flex items-center gap-2 ${client.passportUrl ? 'text-emerald-800' : 'text-slate-700 group-hover:text-indigo-700'}`}><FileText size={16}/> Signatory ID / Passport</span>
                {client.passportUrl ? <ExternalLink size={16} className="text-emerald-600" /> : <Plus size={16} className="text-slate-400 group-hover:text-indigo-500" />}
              </a>
              
            </div>
          </div>

          {/* NEW: Generated Contracts Vault */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
              <FileBadge size={16} className="text-indigo-500" /> Generated Contracts
            </h3>
            <div className="space-y-3">
              {client.documents.length === 0 ? (
                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                   <p className="text-xs font-bold text-slate-500">No contracts generated yet.</p>
                </div>
              ) : (
                client.documents.map(doc => (
                  <div key={doc.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between bg-white shadow-sm hover:border-indigo-300 transition-colors">
                    <div className="flex-1 overflow-hidden pr-2">
                      <p className="text-sm font-bold text-slate-800 truncate" title={doc.title}>{doc.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                        {new Date(doc.createdAt).toLocaleDateString()} • By {doc.generatedBy.firstName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title="View/Download PDF">
                        <Download size={16} />
                      </a>
                      <form action={dispatchDocument}>
                        <input type="hidden" name="docTitle" value={doc.title} />
                        <button type="submit" className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1" title="Email to Client">
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

        {/* RIGHT COLUMN: Dynamic Timeline & Engine */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* THE PROPOSAL ENGINE LAUNCHER */}
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4"><FileEdit size={150} /></div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Document Generation Engine</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-md">
                Draft legally formatted Soft Corporate Offers (SCO) and Full Corporate Offers (FCO) to send directly to {client.company || client.name}.
              </p>
              
              <DocumentGenerator 
                clientId={client.id}
                clientName={client.name}
                clientCompany={client.company || "Individual Entity"}
              />
              
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col h-[500px]">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2 shrink-0">
              <Activity size={16} className="text-rose-500" /> Activity Timeline
            </h3>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 relative">
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100 z-0"></div>

              {client.activities.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 z-10 relative">
                  <Clock size={32} className="mb-3 opacity-20" />
                  <p className="text-sm font-bold">No activity recorded.</p>
                  <p className="text-xs mt-1 text-center max-w-xs">Generated documents, sent emails, and calls will appear here.</p>
                </div>
              ) : (
                client.activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                      <Activity size={16} className="text-slate-400" />
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900">{activity.type.replace(/_/g, " ")}</span>
                        <span className="text-[10px] text-slate-400 font-bold">• {new Date(activity.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {activity.description}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                        Logged by: {activity.user.firstName} {activity.user.lastName}
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