"use client";

import { useState, useRef, useEffect } from "react";
import { PlusCircle, MapPin, UploadCloud, FileText, Loader2, X, Image as ImageIcon, Package } from "lucide-react";
import { createSupply } from "@/actions/supplyActions";

export default function SupplyForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Lock background scrolling when modal is open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

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

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setPdfFile(e.target.files[0]);
    e.target.value = "";
  };

  const removePdf = () => setPdfFile(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.delete("images"); formData.delete("pdf");
      
      images.forEach(img => formData.append("images", img));
      if (pdfFile) formData.append("pdf", pdfFile);

      await createSupply(formData);
      
      // Reset & Close
      setImages([]); setImagePreviews([]); setPdfFile(null);
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
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all"
      >
        <PlusCircle size={20} />
        Post Supply
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          
          {/* Modal Content */}
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
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

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                
                {/* Standard Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
                    <input type="text" name="title" required className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium" placeholder="e.g. Urea 46% Prilled" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Qty</label>
                      <input type="number" name="quantity" required className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price per unit ($)</label>
                      <input type="number" step="0.01" name="price" required className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
                    <div className="relative mt-1.5">
                      <MapPin className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                      <input type="text" name="location" required className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium" placeholder="e.g. JAFZA Warehouse" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specifications</label>
                    <textarea name="specs" rows={3} required className="w-full mt-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-medium"></textarea>
                  </div>
                </div>

                {/* UPGRADED IMAGE UPLOAD ZONE */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Reference Images</span>
                    <span className={images.length === 5 ? "text-rose-500" : "text-emerald-600"}>{images.length} / 5</span>
                  </label>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50 text-center hover:bg-slate-100/50 transition-colors group relative">
                    <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} disabled={images.length >= 5} />
                    
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform border border-slate-100">
                        <ImageIcon className="text-slate-400" size={24} />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Click or drag images here</p>
                      <p className="text-xs text-slate-500 mt-1">JPEG, PNG up to 10MB each</p>
                    </div>
                  </div>

                  {/* Enhanced Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-5 gap-3 mt-4">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-200 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => removeImage(i)} className="bg-rose-500 text-white rounded-full p-1.5 hover:scale-110 transition-transform shadow-lg">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* UPGRADED PDF UPLOAD ZONE */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Official Spec Sheet (PDF)</label>
                  <div className={`border-2 border-dashed rounded-2xl p-2 transition-colors relative ${pdfFile ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'}`}>
                    {pdfFile ? (
                      <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-emerald-100 shadow-sm relative z-20">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-rose-100 p-2 rounded-lg"><FileText className="text-rose-600" size={18} /></div>
                          <span className="text-sm font-bold text-slate-700 truncate">{pdfFile.name}</span>
                        </div>
                        <button type="button" onClick={removePdf} className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-colors">
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handlePdfChange} />
                        <div className="flex items-center justify-center gap-3 p-4 pointer-events-none text-slate-500">
                          <UploadCloud size={20} />
                          <span className="text-sm font-semibold">Attach PDF Document</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
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