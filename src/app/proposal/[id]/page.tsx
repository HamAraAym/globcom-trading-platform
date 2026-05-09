import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { 
  MapPin, Anchor, Truck, Shield, CreditCard, ShieldCheck, Package, 
  Scale, CircleDollarSign, Calendar, FileText, Download, CheckCircle2, Globe 
} from "lucide-react";

// NEW: Typed params as a Promise for Next.js 16 compatibility
export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  // NEW: Await the params to extract the ID
  const { id } = await params;

  // 1. Check if it's a Demand or a Supply
  let deal: any = await prisma.demand.findUnique({
    where: { id },
    include: { createdBy: true }
  });
  let dealType = "Demand";

  if (!deal) {
    deal = await prisma.supply.findUnique({
      where: { id },
      include: { createdBy: true }
    });
    dealType = "Supply";
  }

  // If the ID doesn't exist in either table, show a 404
  if (!deal) {
    return notFound();
  }

  // Helper for dynamic key terms
  let parsedKeyTerms = [];
  if (deal.keyTerms) {
    try {
      parsedKeyTerms = typeof deal.keyTerms === "string" ? JSON.parse(deal.keyTerms) : deal.keyTerms;
    } catch (e) {
      console.error("Failed to parse key terms");
    }
  }

  // Helper for Logistics
  const LogisticsItem = ({ label, value, icon: Icon }: { label: string, value: string | null, icon: any }) => (
    <div className="flex flex-col bg-slate-50 p-4 rounded-xl border border-slate-100">
      <div className="flex items-center gap-2 text-slate-400 mb-2">
        <Icon size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-900 leading-tight">
        {value || <span className="text-slate-300 font-normal italic">Not specified</span>}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* BRANDING HEADER */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center text-white shadow-lg mb-4">
            <Globe size={24} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">GlobCom International</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Official Trade {dealType === "Supply" ? "Proposal" : "Request"}</p>
        </div>

        {/* MAIN DOCUMENT */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          
          {/* Status Bar */}
          <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={20} />
              <span className="text-white font-bold tracking-wide">VERIFIED SECURE DOCUMENT</span>
            </div>
            <div className="text-slate-400 text-xs font-medium">
              Ref ID: <span className="text-slate-300 font-mono">{deal.id.split("").reverse().join("").substring(0, 8).toUpperCase()}</span>
            </div>
          </div>

          <div className="p-6 md:p-10">
            {/* Title & Rep */}
            <div className="mb-10">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                {deal.title}
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pt-4 border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Authorized Rep: <strong className="text-slate-900">{deal.createdBy?.firstName} {deal.createdBy?.lastName}</strong>
                </p>
                <p className="text-sm text-slate-500">
                  Issued: <strong className="text-slate-900">{new Date(deal.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </p>
              </div>
            </div>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-blue-700"><Scale size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Volume</span></div>
                <p className="text-2xl font-black text-blue-900">{new Intl.NumberFormat().format(deal.quantity)} <span className="text-sm font-bold text-blue-700 ml-1">{deal.quantityUnit || "MT"}</span></p>
              </div>
              <div className="bg-green-50 border border-green-100 p-6 rounded-2xl flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-green-600"><CircleDollarSign size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">Target Price</span></div>
                <p className="text-2xl font-black text-green-900">
                  {deal.price || deal.targetPrice ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(deal.price || deal.targetPrice) : "Upon Request"}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex flex-col">
                <div className="flex items-center gap-2 mb-2 text-slate-600"><Calendar size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">{dealType === "Supply" ? "Validity" : "Timeline"}</span></div>
                <p className="text-lg font-bold text-slate-900 leading-tight">
                  {deal.timeline || (deal.validityDate ? new Date(deal.validityDate).toLocaleDateString() : "TBD")}
                </p>
              </div>
            </div>

            {/* Logistics Grid */}
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Trade Logistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <LogisticsItem label="Origin" value={deal.origin} icon={MapPin} />
              <LogisticsItem label="Destination" value={deal.destination} icon={MapPin} />
              <LogisticsItem label="Incoterms" value={deal.incoterms} icon={Truck} />
              <LogisticsItem label="Load Port" value={deal.loadPort} icon={Anchor} />
              <LogisticsItem label="Insurance" value={deal.insurance} icon={Shield} />
              <LogisticsItem label="Payment" value={deal.paymentTerms} icon={CreditCard} />
              <LogisticsItem label="Inspection" value={deal.inspection} icon={ShieldCheck} />
              <LogisticsItem label="Packaging" value={deal.packaging} icon={Package} />
            </div>

            {/* Specifications */}
            <div className="mb-10">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Technical Specifications</h3>
              
              {parsedKeyTerms.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {parsedKeyTerms.map((term: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-xs font-bold text-slate-500 uppercase">{term.label}</span>
                      <span className="text-sm font-bold text-slate-900 text-right">{term.value}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{deal.specs}</p>
              </div>
            </div>

            {/* Attachments */}
            {deal.attachments && deal.attachments.length > 0 && (
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FileText size={16} /> Official Documents
                </h3>
                <div className="flex flex-col gap-3">
                  {deal.attachments.map((url: string, index: number) => {
                    const isPdf = url.toLowerCase().includes('.pdf');
                    const fileName = url.split('/').pop() || `Document ${index + 1}`;
                    return (
                      <a 
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className={`p-3 rounded-lg ${isPdf ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                            <FileText size={20} />
                          </div>
                          <span className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-800 transition-colors">
                            {fileName}
                          </span>
                        </div>
                        <div className="p-3 bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-700 rounded-lg transition-colors shrink-0">
                          <Download size={18} />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* FOOTER */}
        <div className="text-center mt-12 mb-8">
          <p className="text-xs text-slate-400 mb-2">
            To negotiate or accept these terms, please reply directly to your assigned trading representative.
          </p>
          <p className="text-[10px] text-slate-400">
            © {new Date().getFullYear()} GlobCom International FZE. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}