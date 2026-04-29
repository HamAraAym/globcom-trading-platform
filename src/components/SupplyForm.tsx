"use client";

import { useState, useRef, useEffect } from "react";
import { PlusCircle, MapPin, UploadCloud, FileText, Loader2, X, Image as ImageIcon, Package, Plus, Trash2, Calendar } from "lucide-react";
import { createSupply } from "@/actions/supplyActions";

export default function SupplyForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Dynamic State for Commodity Specifications
  const [keyTerms, setKeyTerms] = useState<{label: string, value: string}[]>([]);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // --- Image Handling ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (images.length + newFiles.length > 5) {
      alert("SOP Violation: Maximum 5 images allowed.");
      e.target.value = ""; return;
    }
    const updatedImages = [...images, ...newFiles];
    setImages(updatedImages);
    setImagePreviews(updatedImages.map(f => URL.createObjectURL(f)));
    e.target.value = "";
  };

  const removeImage = (indexToRemove: number) => {
    setImages(images.filter((_, i) => i !== indexToRemove));
    setImagePreviews(imagePreviews.filter((_, i) => i !== indexToRemove));
  };

  // --- PDF Handling ---
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setPdfFile(e.target.files[0]);
    e.target.value = "";
  };
  const removePdf = () => setPdfFile(null);

  // --- Dynamic Key Terms Handling ---
  const addKeyTerm = () => setKeyTerms([...keyTerms, { label: "", value: "" }]);
  const updateKeyTerm = (index: number, field: "label" | "value", val: string) => {
    const newTerms = [...keyTerms];
    newTerms[index][field] = val;
    setKeyTerms(newTerms);
  };
  const removeKeyTerm = (index: number) => {
    setKeyTerms(keyTerms.filter((_, i) => i !== index));
  };

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      // Handle Media
      formData.delete("images"); formData.delete("pdf");
      images.forEach(img => formData.append("images", img));
      if (pdfFile) formData.append("pdf", pdfFile);

      // Handle Dynamic JSON terms
      const validKeyTerms = keyTerms.filter(t => t.label.trim() && t.value.trim());
      formData.append("keyTerms", JSON.stringify(validKeyTerms));

      await createSupply(formData);
      
      // Reset & Close
      setImages([]); setImagePreviews([]); setPdfFile(null); setKeyTerms([]);
      formRef.current?.reset();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to upload. Ensure files are under 10MB.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all shrink-0"
      >
        <PlusCircle size={20} />
        Post Supply
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 text-emerald-700">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Package size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Add New Inventory</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors border border-slate-200 shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                
                {/* SECTION 1: Standard Inputs */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-slate-100 pb-2">1. Core Information</h3>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input type="text" name="title" required className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium" placeholder="e.g. Granular Sulphur" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Packaging</label>
                    <input type="text" name="packaging" className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium" placeholder="e.g. In Bulk" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* QUANTITY & UNIT */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Available Qty <span className="text-red-500">*</span>
                        </label>
                        <input type="number" step="any" name="quantity" required className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium" placeholder="e.g. 25000" />
                      </div>
                      <div className="w-1/3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Unit <span className="text-red-500">*</span>
                        </label>
                        <select name="quantityUnit" className="w-full mt-1.5 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium cursor-pointer">
                          <option value="MT">MT</option>
                          <option value="KG">KG</option>
                          <option value="BBL">BBL</option>
                        </select>
                      </div>
                    </div>

                    {/* PRICE (OPTIONAL) */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price per unit ($)</label>
                      <input type="number" step="0.01" name="price" className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium" placeholder="e.g. 150.00" />
                    </div>
                  </div>

                  {/* NEW: TOLERANCE LEVEL */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tolerance Level</label>
                    <input type="text" name="tolerance" className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium text-sm" placeholder="e.g. +/- 10% Seller Option" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Storage Location <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                        <input type="text" name="location" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium" placeholder="e.g. JAFZA Warehouse" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Offer Validity Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative mt-1.5">
                        <Calendar className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                        <input type="datetime-local" name="validityDate" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium text-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Strict Business Terms */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-slate-100 pb-2">2. Trade Logistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Origin</label>
                      <input type="text" name="origin" className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium text-sm" placeholder="e.g. Oman / Middle East" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</label>
                      <input type="text" name="destination" className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium text-sm" placeholder="e.g. Any port in Thailand" />
                    </div>

                    {/* NEW: LOAD PORT */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Load Port</label>
                      <input type="text" name="loadPort" className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium text-sm" placeholder="e.g. Oman/Middle East Port" />
                    </div>

                    {/* NEW: INSURANCE */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Insurance Terms</label>
                      <input type="text" name="insurance" className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium text-sm" placeholder="e.g. To be covered by the buyer" />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Incoterms</label>
                      <input type="text" name="incoterms" className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium text-sm" placeholder="e.g. CFR, FOB" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Terms</label>
                      <input type="text" name="paymentTerms" className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium text-sm" placeholder="e.g. 20% Advance, Balance against Docs" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inspection</label>
                      <input type="text" name="inspection" className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium text-sm" placeholder="e.g. Independent surveyor at load port" />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Dynamic Key Terms */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest">3. Technical Specifications</h3>
                    <button type="button" onClick={addKeyTerm} className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:text-emerald-800 transition-colors bg-emerald-50 px-2 py-1 rounded-md">
                      <Plus size={14} /> Add Property
                    </button>
                  </div>
                  
                  {keyTerms.length === 0 ? (
                    <div className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                      No technical specifications added. Click "Add Property" to define purity, ash content, etc.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {keyTerms.map((term, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-white p-2 border border-slate-200 rounded-xl shadow-sm">
                          <input 
                            type="text" 
                            placeholder="Label (e.g. Ash Content)" 
                            value={term.label} 
                            onChange={(e) => updateKeyTerm(idx, "label", e.target.value)}
                            className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <input 
                            type="text" 
                            placeholder="Value (e.g. 0.05% Max)" 
                            value={term.value} 
                            onChange={(e) => updateKeyTerm(idx, "value", e.target.value)}
                            className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <button type="button" onClick={() => removeKeyTerm(idx)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 4: General Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    General Notes / Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea name="specs" rows={3} required className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium"></textarea>
                </div>

                {/* SECTION 5: Media Uploads */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-slate-100 pb-2">4. Attachments</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Images */}
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                        <span>Reference Images</span>
                        <span className={images.length === 5 ? "text-rose-500" : "text-emerald-600"}>{images.length} / 5</span>
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-100 transition-colors relative mb-3">
                        <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} disabled={images.length >= 5} />
                        <ImageIcon className="mx-auto text-slate-400 mb-2" size={20} />
                        <p className="text-[10px] font-bold text-slate-600">Drop images here</p>
                      </div>
                      {imagePreviews.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                          {imagePreviews.map((src, i) => (
                            <div key={i} className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-slate-200 group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt="preview" className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PDF */}
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Official Spec Sheet (PDF)</label>
                      <div className={`flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors relative ${pdfFile ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-300 hover:bg-slate-100'}`}>
                        {pdfFile ? (
                          <div className="flex items-center justify-between w-full p-2 bg-white rounded-lg border border-emerald-100 shadow-sm relative z-20">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <FileText className="text-rose-600 shrink-0" size={16} />
                              <span className="text-[10px] font-bold text-slate-700 truncate">{pdfFile.name}</span>
                            </div>
                            <button type="button" onClick={removePdf} className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors shrink-0">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handlePdfChange} />
                            <UploadCloud className="mx-auto text-slate-400 mb-2" size={20} />
                            <p className="text-[10px] font-bold text-slate-600">Attach Official Specs</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={() => formRef.current?.requestSubmit()} disabled={isSubmitting} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all">
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Uploading...</> : "Publish to Board"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}