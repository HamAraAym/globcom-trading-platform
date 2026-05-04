"use client";

import { useState, useRef, useEffect } from "react";
import { PlusCircle, Calendar, UploadCloud, FileText, Loader2, X, Image as ImageIcon, FileBox, Plus, Trash2, Edit, Sparkles } from "lucide-react";
import { createDemand, updateDemand } from "@/actions/demandActions"; 
import { extractDealData } from "@/actions/aiActions"; 

interface DemandFormProps {
  demandToEdit?: any; 
}

export default function DemandForm({ demandToEdit }: DemandFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false); 
  
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [keyTerms, setKeyTerms] = useState<{label: string, value: string}[]>(() => {
    if (demandToEdit?.keyTerms) {
      try {
        return typeof demandToEdit.keyTerms === "string" 
          ? JSON.parse(demandToEdit.keyTerms) 
          : demandToEdit.keyTerms;
      } catch (e) { return []; }
    }
    return [];
  });

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleAiExtraction = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await extractDealData(formData);

      if (response.success && response.data && formRef.current) {
        const { title, quantity, quantityUnit, price, incoterms, origin, destination, specs } = response.data;
        const form = formRef.current;

        if (title) (form.elements.namedItem("title") as HTMLInputElement).value = title;
        if (quantity) (form.elements.namedItem("quantity") as HTMLInputElement).value = quantity.toString();
        if (quantityUnit) (form.elements.namedItem("quantityUnit") as HTMLSelectElement).value = quantityUnit.toUpperCase();
        if (price) (form.elements.namedItem("targetPrice") as HTMLInputElement).value = price.toString(); 
        if (incoterms) (form.elements.namedItem("incoterms") as HTMLInputElement).value = incoterms;
        if (origin) (form.elements.namedItem("origin") as HTMLInputElement).value = origin;
        if (destination) (form.elements.namedItem("destination") as HTMLInputElement).value = destination;
        if (specs) (form.elements.namedItem("specs") as HTMLTextAreaElement).value = specs;

        setPdfFile(file);
      } else {
        alert(response.error || "Failed to extract data. The PDF might be unreadable.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred during AI extraction.");
    } finally {
      setIsExtracting(false);
      e.target.value = ""; 
    }
  };

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

  const addKeyTerm = () => setKeyTerms([...keyTerms, { label: "", value: "" }]);
  const updateKeyTerm = (index: number, field: "label" | "value", val: string) => {
    const newTerms = [...keyTerms];
    newTerms[index][field] = val;
    setKeyTerms(newTerms);
  };
  const removeKeyTerm = (index: number) => {
    setKeyTerms(keyTerms.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      formData.delete("images"); formData.delete("pdf");
      images.forEach(img => formData.append("images", img));
      if (pdfFile) formData.append("pdf", pdfFile);

      const validKeyTerms = keyTerms.filter(t => t.label.trim() && t.value.trim());
      formData.append("keyTerms", JSON.stringify(validKeyTerms));

      if (demandToEdit) {
        formData.append("id", demandToEdit.id);
        await updateDemand(formData);
      } else {
        await createDemand(formData);
      }
      
      if (!demandToEdit) {
        setImages([]); setImagePreviews([]); setPdfFile(null); setKeyTerms([]);
        formRef.current?.reset();
      }
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {demandToEdit ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="p-1.5 md:p-2 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 rounded-lg shadow-sm transition-colors"
          title="Edit Deal"
        >
          <Edit size={16} />
        </button>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-1.5 md:gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-sm md:text-base font-bold shadow-lg shadow-blue-600/20 transition-all shrink-0 w-full sm:w-auto"
        >
          <PlusCircle size={18} className="md:w-5 md:h-5" />
          Post Demand
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          
          {/* NATIVE MOBILE UPGRADE: Bottom Sheet on Mobile, Centered Modal on Desktop */}
          <div className="bg-white w-full max-w-3xl h-[92vh] sm:h-auto sm:max-h-[95vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200">
            
            <div className="px-4 md:px-6 py-4 md:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2 md:gap-3 text-blue-700">
                <div className="bg-blue-100 p-1.5 md:p-2 rounded-lg">
                  <FileBox size={18} className="md:w-5 md:h-5" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate max-w-[200px] sm:max-w-none">{demandToEdit ? "Edit Request" : "Post Request"}</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full transition-colors border border-slate-200 shadow-sm shrink-0">
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1 relative">
              
              {!demandToEdit && (
                <div className={`mb-6 relative border-2 border-dashed rounded-2xl overflow-hidden transition-all ${isExtracting ? 'border-indigo-400 bg-indigo-50' : 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-indigo-400'}`}>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleAiExtraction}
                    disabled={isExtracting}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                  />
                  <div className="p-5 md:p-6 flex items-center justify-center gap-4 text-center sm:text-left">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center shrink-0">
                      {isExtracting ? <Loader2 size={24} className="text-indigo-500 animate-spin" /> : <Sparkles size={24} className="text-indigo-500" />}
                    </div>
                    <div>
                      <h3 className="text-sm md:text-base font-black text-slate-900 flex items-center gap-2">
                        {isExtracting ? "AI is reading RFQ..." : "Magic Upload (PDF)"}
                        {!isExtracting && <span className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">New</span>}
                      </h3>
                      {/* NATIVE MOBILE UPGRADE: Say "Tap" instead of "Drag" */}
                      <p className="text-[10px] md:text-xs text-slate-500 font-medium mt-1 max-w-sm">
                        {isExtracting ? "Extracting pricing, specs, and incoterms. Please wait." : "Tap to upload or drag an RFQ/Spec Sheet here. Gemini AI will read it and auto-fill this entire form for you in seconds."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 md:space-y-8 relative">
                {isExtracting && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-xl"></div>
                )}
                
                {/* SECTION 1: Core Information */}
                <div className="space-y-4">
                  <h3 className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2">1. Core Information</h3>
                  
                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Product Required <span className="text-red-500">*</span>
                    </label>
                    <input type="text" name="title" defaultValue={demandToEdit?.title} required className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. Granular Sulphur" />
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Packaging</label>
                    <input type="text" name="packaging" defaultValue={demandToEdit?.packaging} className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. In Bulk" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input type="number" step="any" name="quantity" defaultValue={demandToEdit?.quantity} required className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. 25000" />
                      </div>
                      <div className="w-1/3 min-w-[70px]">
                        <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Unit <span className="text-red-500">*</span>
                        </label>
                        <select name="quantityUnit" defaultValue={demandToEdit?.quantityUnit || "MT"} className="w-full mt-1.5 p-3 sm:p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium cursor-pointer text-base sm:text-sm">
                          <option value="MT">MT</option>
                          <option value="KG">KG</option>
                          <option value="BBL">BBL</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Target Price ($)</label>
                      <input type="number" step="0.01" name="targetPrice" defaultValue={demandToEdit?.targetPrice} className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. 150.00" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Tolerance Level</label>
                    <input type="text" name="tolerance" defaultValue={demandToEdit?.tolerance} className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. +/- 10% Vessel Option" />
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Delivery Timeline <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <Calendar className="absolute left-3 top-3.5 text-slate-400" size={18} />
                      <input type="text" name="timeline" defaultValue={demandToEdit?.timeline} required className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. 1st week Jan 2026" />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: Strict Business Terms */}
                <div className="space-y-4">
                  <h3 className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2">2. Trade Logistics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Origin</label>
                      <input type="text" name="origin" defaultValue={demandToEdit?.origin} className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. UAE / Oman" />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Destination</label>
                      <input type="text" name="destination" defaultValue={demandToEdit?.destination} className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. Any port in India" />
                    </div>
                    
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Load Port</label>
                      <input type="text" name="loadPort" defaultValue={demandToEdit?.loadPort} className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. One safe port, Oman" />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Insurance Terms</label>
                      <input type="text" name="insurance" defaultValue={demandToEdit?.insurance} className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. To be covered by the seller" />
                    </div>

                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Incoterms</label>
                      <input type="text" name="incoterms" defaultValue={demandToEdit?.incoterms} className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. CIF, FOB" />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Terms</label>
                      <input type="text" name="paymentTerms" defaultValue={demandToEdit?.paymentTerms} className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. 100% LC at sight" />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Inspection</label>
                      <input type="text" name="inspection" defaultValue={demandToEdit?.inspection} className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm" placeholder="e.g. SGS at loading port" />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: Dynamic Key Terms */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-widest">3. Technical Specs</h3>
                    <button type="button" onClick={addKeyTerm} className="text-[10px] md:text-xs font-bold text-blue-600 flex items-center gap-1 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded-md">
                      <Plus size={14} /> Add Property
                    </button>
                  </div>
                  
                  {keyTerms.length === 0 ? (
                    <div className="text-xs md:text-sm text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                      No technical specifications added. Click "Add Property" to define purity, moisture, etc.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {keyTerms.map((term, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-white p-2 border border-slate-200 rounded-xl shadow-sm">
                          <input 
                            type="text" 
                            placeholder="Label (e.g. Purity)" 
                            value={term.label} 
                            onChange={(e) => updateKeyTerm(idx, "label", e.target.value)}
                            className="flex-1 w-0 p-3 sm:p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-base sm:text-sm font-bold text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input 
                            type="text" 
                            placeholder="Value" 
                            value={term.value} 
                            onChange={(e) => updateKeyTerm(idx, "value", e.target.value)}
                            className="flex-1 w-0 p-3 sm:p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-base sm:text-sm text-slate-700 outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button type="button" onClick={() => removeKeyTerm(idx)} className="p-3 sm:p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0">
                            <Trash2 size={18} className="sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 4: General Notes */}
                <div>
                  <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">
                    General Notes / Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea name="specs" rows={3} defaultValue={demandToEdit?.specs} required className="w-full mt-1.5 p-3 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 font-medium text-base sm:text-sm"></textarea>
                </div>

                {/* SECTION 5: Media Uploads */}
                <div className="space-y-4">
                  <h3 className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2">4. Attachments</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Images */}
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl md:rounded-2xl">
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                        <span>Add Images</span>
                        <span className={images.length === 5 ? "text-rose-500" : "text-blue-600"}>{images.length} / 5</span>
                      </label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-100 transition-colors relative mb-3">
                        <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} disabled={images.length >= 5} />
                        <ImageIcon className="mx-auto text-slate-400 mb-2 w-6 h-6" />
                        <p className="text-[10px] font-bold text-slate-600">Tap or Drop images here</p>
                      </div>
                      {imagePreviews.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                          {imagePreviews.map((src, i) => (
                            <div key={i} className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-slate-200 group">
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
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl md:rounded-2xl flex flex-col">
                      <label className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Upload New RFQ</label>
                      <div className={`flex-1 border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-colors relative ${pdfFile ? 'border-blue-300 bg-blue-50/50' : 'border-slate-300 hover:bg-slate-100'}`}>
                        {pdfFile ? (
                          <div className="flex items-center justify-between w-full p-2 bg-white rounded-lg border border-blue-100 shadow-sm relative z-20">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <FileText className="text-rose-600 shrink-0 w-4 h-4" size={14} />
                              <span className="text-[10px] font-bold text-slate-700 truncate">{pdfFile.name}</span>
                            </div>
                            <button type="button" onClick={removePdf} className="text-slate-400 hover:text-rose-500 p-2 sm:p-1 rounded-md transition-colors shrink-0">
                              <X size={14} className="sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <input type="file" accept="application/pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handlePdfChange} />
                            <UploadCloud className="mx-auto text-slate-400 mb-2 w-6 h-6" />
                            <p className="text-[10px] font-bold text-slate-600">Attach Official RFQ (PDF)</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* NATIVE MOBILE UPGRADE: Added pb-8 for iOS Home indicator padding */}
            <div className="px-4 md:px-6 py-4 md:py-4 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-2 md:gap-3 shrink-0 pb-8 sm:pb-4">
              <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-3 sm:py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors w-full sm:w-auto text-center">
                Cancel
              </button>
              <button onClick={() => formRef.current?.requestSubmit()} disabled={isSubmitting || isExtracting} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-3 sm:py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all w-full sm:w-auto">
                {isSubmitting ? <><Loader2 size={16} className="animate-spin md:w-4 md:h-4" /> Saving...</> : (demandToEdit ? "Save Changes" : "Publish to Board")}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}