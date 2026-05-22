import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { updateBuyer } from "@/actions/buyerActions";
import Link from "next/link";
import { ChevronLeft, Building, User, Mail, Phone, MapPin, Globe, FileBadge, Save, Edit, UploadCloud } from "lucide-react";

export default async function EditClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.clientId;

  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) redirect("/buyers");

  const handleUpdate = async (formData: FormData) => {
    "use server";
    await updateBuyer(formData);
    redirect(`/crm/${clientId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans">
      <div className="max-w-3xl mx-auto w-full">
        
        <Link href={`/crm/${clientId}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-800 transition-colors mb-6">
          <ChevronLeft size={16} /> Back to Profile
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 px-6 py-5 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-3">
              <Edit size={20} className="text-blue-400" /> Edit Entity Profile
            </h2>
          </div>

          <div className="p-6 md:p-8">
            <form action={handleUpdate} className="space-y-8">
              <input type="hidden" name="id" value={client.id} />
              
              {/* --- 1. BASIC INFORMATION --- */}
              <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-widest">General Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className={client.type === "INDIVIDUAL" ? "md:col-span-2" : ""}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      {client.type === "CORPORATE" ? "Primary Contact Name" : "Full Legal Name"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input type="text" name="name" defaultValue={client.name} required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium" />
                    </div>
                  </div>

                  {client.type === "CORPORATE" && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Company Name</label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-3 text-slate-400" size={16} />
                        <input type="text" name="company" defaultValue={client.company || ""} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium" />
                    </div>
                  </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input type="email" name="email" defaultValue={client.email} required className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input type="tel" name="phone" defaultValue={client.phone || ""} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Physical Address / Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 text-slate-400" size={16} />
                      <input type="text" name="address" defaultValue={client.address || ""} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium" />
                    </div>
                  </div>

                  {client.type === "CORPORATE" && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Registration / Tax No.</label>
                        <div className="relative">
                          <FileBadge className="absolute left-3.5 top-3 text-slate-400" size={16} />
                          <input type="text" name="registrationNo" defaultValue={client.registrationNo || ""} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Website</label>
                        <div className="relative">
                          <Globe className="absolute left-3.5 top-3 text-slate-400" size={16} />
                          <input type="url" name="website" defaultValue={client.website || ""} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* --- 2. KYC FILE UPLOADS --- */}
              <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <UploadCloud size={18} className="text-blue-600" /> KYC & Compliance Documents
                </h3>
                <p className="text-xs text-slate-500 mb-4">Upload new files here to replace existing documents. Leave blank to keep current files.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Global KYC */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Passport / National ID</label>
                    <input type="file" name="passport" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer" />
                    {client.passportUrl && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ File currently on record</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Proof of Funds (POF)</label>
                    <input type="file" name="proofOfFunds" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer" />
                    {client.proofOfFundsUrl && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ File currently on record</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Bank Reference Letter</label>
                    <input type="file" name="bankReference" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer" />
                    {client.bankReferenceUrl && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ File currently on record</p>}
                  </div>

                  {/* Corporate Specific KYC */}
                  {client.type === "CORPORATE" && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Trade License</label>
                        <input type="file" name="tradeLicense" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer" />
                        {client.tradeLicenseUrl && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ File currently on record</p>}
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">Company Profile</label>
                        <input type="file" name="companyProfile" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer" />
                        {client.companyProfileUrl && <p className="text-[10px] text-green-600 mt-1 font-medium">✓ File currently on record</p>}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button type="submit" className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-800/20 transition-all">
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}