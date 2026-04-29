"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { FileEdit, X, Loader2, Download, FileText, CheckCircle2 } from "lucide-react";
import { saveGeneratedDocument } from "@/actions/documentActions";
import { DocumentType } from "@prisma/client";

// Dynamically import React Quill
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

// @ts-ignore
import "react-quill-new/dist/quill.snow.css";

interface DocumentGeneratorProps {
  clientId: string;
  clientName: string;
  clientCompany: string;
  contextItem?: any; 
  defaultDocType?: DocumentType;
  buttonStyle?: string;
  userLetterhead?: string | null; // NEW: The enterprise letterhead!
}

export default function DocumentGenerator({ 
  clientId, 
  clientName, 
  clientCompany, 
  contextItem, 
  defaultDocType = "SCO",
  buttonStyle = "bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2",
  userLetterhead
}: DocumentGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [docType, setDocType] = useState<DocumentType>(defaultDocType);
  const [content, setContent] = useState<string>("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // SMART DATA & TEMPLATE INJECTION
  useEffect(() => {
    if (!isOpen) return;

    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const refNo = `GC-${docType}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const product = contextItem?.title || "[Commodity Name]";
    
    // NEW: Dynamic Quantity & Tolerance Formatting
    const unit = contextItem?.quantityUnit || "MT";
    const baseQty = contextItem?.quantity ? new Intl.NumberFormat().format(contextItem.quantity) : "[Quantity]";
    const toleranceStr = contextItem?.tolerance ? ` ${contextItem.tolerance}` : "";
    const qtyDisplay = `${baseQty} ${unit}${toleranceStr}`; // e.g. "25,000 MT +/- 10% Vessel Option"
    
    const rawPrice = contextItem?.targetPrice || contextItem?.price;
    const formattedPrice = rawPrice ? `USD ${new Intl.NumberFormat('en-US').format(rawPrice)} per ${unit}` : "USD ______ per metric tonne";

    // Dynamic Specifications Builder
    let specsHtml = "";
    if (contextItem?.keyTerms && Array.isArray(contextItem.keyTerms) && contextItem.keyTerms.length > 0) {
      specsHtml = contextItem.keyTerms.map((term: any) => 
        `<li style="margin-bottom: 4px;"><strong>${term.label}:</strong> ${term.value}</li>`
      ).join("");
    } else {
      specsHtml = `<li><strong>Specifications:</strong> As per standard export quality.</li>`;
    }

    // NEW: Dynamic Letterhead Injection
    const letterheadHtml = userLetterhead 
      ? `<div style="text-align: center; margin-bottom: 30px;"><img src="${userLetterhead}" style="max-width: 100%; max-height: 150px; object-fit: contain;" alt="Official Letterhead" /></div>` 
      : ``;

    let htmlTemplate = "";

    // 1. LETTER OF INTEREST
    if (docType === "LOI") {
      htmlTemplate = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.5; color: #000; font-size: 14px;">
          ${letterheadHtml}
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Ref No.:</strong> ${refNo}</p>
          <h2 style="text-align: center; margin-top: 30px; margin-bottom: 20px; text-decoration: underline; font-size: 18px;">LETTER OF INTEREST</h2>
          <p><strong>To:</strong><br/>${clientCompany}<br/>ATTN: ${clientName}</p>
          <p><strong>SUBJECT: Purchase of ${product} in Bulk, Qty: ${qtyDisplay}</strong></p>
          <p>Dear Sir,</p>
          <p>We are pleased to hereby issue our Letter of Interest (LOI) for the same on the following basis:</p>
          <ul style="list-style-type: none; padding-left: 0; margin-bottom: 20px;">
            <li><strong>Product:</strong> ${product} in Bulk</li>
            <li style="margin-top: 10px;"><strong><u>Specifications:</u></strong></li>
            <ul style="margin-top: 5px; margin-bottom: 15px;">
              ${specsHtml}
            </ul>
            <li><strong>Quantity:</strong> ${qtyDisplay}</li>
            <li><strong>Origin:</strong> ${contextItem?.origin || 'UAE / Oman'}</li>
            <li><strong>Destination:</strong> ${contextItem?.destination || 'Open as per buyer option'}</li>
            <li><strong>Shipment:</strong> ${contextItem?.timeline || '1st week January 2026'}</li>
            <li><strong>Price:</strong> ${formattedPrice}, CIF ${contextItem?.destination || 'Any Port'}</li>
            <li><strong>Insurance:</strong> ${contextItem?.insurance || 'To be covered by the seller.'}</li>
            <li><strong>Payment Terms:</strong> ${contextItem?.paymentTerms || '100% payment before completion of discharging at discharge port.'}</li>
            <li><strong>Load Port:</strong> ${contextItem?.loadPort || 'One safe port, one safe berth.'}</li>
            <li><strong>Discharge Rate:</strong> To be provided by the buyer at the time of vessel nomination.</li>
            <li><strong>Inspection:</strong> Inspection shall be carried out by SGS at the loading port and at the discharge port for both quality and quantity.</li>
          </ul>
          <p>Any discrepancy in the quality or quantity, the discharge port report shall be considered as final and binding.</p>
          <p>All other terms and conditions shall be mutually discussed and agreed upon before finalising the contract.</p>
          <p>We look forward to receiving your firm offer at the earliest to proceed further accordingly.</p>
          <br/><br/>
          <p>Thanks & Regards,<br/><br/><strong>GLOBCOM INTERNATIONAL FZE</strong><br/>(AUTHORIZED SIGNATORY)</p>
        </div>
      `;
    } 
    // 2. FULL CORPORATE OFFER
    else if (docType === "FCO") {
      htmlTemplate = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.5; color: #000; font-size: 14px;">
          ${letterheadHtml}
          <p><strong>Ref. No:</strong> ${refNo}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>TO:</strong> ${clientCompany}</p>
          <p><strong>Attn:</strong> ${clientName}</p>
          <h2 style="text-align: center; margin-top: 30px; margin-bottom: 20px; text-decoration: underline; font-size: 18px;">SUBJECT: OFFER FOR ${product.toUpperCase()}</h2>
          <p>Dear Sir,</p>
          <p>We are pleased to offer the ${product} as per the terms and conditions.</p>
          <ul style="list-style-type: none; padding-left: 0; margin-bottom: 20px;">
            <li><strong>Commodity:</strong> ${product}</li>
            <li><strong>Quantity:</strong> ${qtyDisplay}</li>
            <li style="margin-top: 10px;"><strong><u>Quality:</u></strong></li>
            <ul style="margin-top: 5px; margin-bottom: 15px;">
              ${specsHtml}
            </ul>
            <li><strong>Packing:</strong> ${contextItem?.packaging || 'In Bulk.'}</li>
            <li><strong>Origin:</strong> ${contextItem?.origin || 'Oman / Middle East'}</li>
            <li><strong>Shipment Date:</strong> ${contextItem?.timeline || '1st Half of February 2026.'}</li>
            <li><strong>Payment Terms:</strong> ${contextItem?.paymentTerms || '20% Advance and Balance against document before discharging.'}</li>
            <li><strong>Delivery Terms:</strong> ${contextItem?.incoterms || 'CFR'} ${contextItem?.destination || 'Any Port'}</li>
            <li><strong>Price:</strong> ${formattedPrice} CFR ${contextItem?.destination || 'Any Port'}</li>
            <li><strong>Currency:</strong> USD, or in case of AED Payment, the Exchange rate of 1 USD = 3.6725 AED shall be applicable.</li>
            <li><strong>Inspection of Quality / Quantity:</strong> Q&Q will be determined by an independent inspection agency appointed by the seller at the load port. The results of the loading port shall be final and binding on both the buyer and seller.</li>
            <li><strong>Insurance:</strong> ${contextItem?.insurance || 'To be covered by the buyer.'}</li>
            <li style="margin-top: 10px;"><strong><u>Shipping Terms:</u></strong></li>
            <ul>
               <li><strong>Loading port:</strong> ${contextItem?.loadPort || 'Middle East Port'}</li>
               <li><strong>Discharge Port:</strong> CFR ${contextItem?.destination || 'Any Port'}</li>
               <li><strong>Discharge Rate:</strong> 10,000 Mt per day SHHINC PWWD</li>
            </ul>
            <li style="margin-top: 10px;"><strong>Other Terms:</strong> All other terms and conditions as per Incoterms 2020 or to be further discussed for the contract.</li>
            <li style="margin-top: 10px;"><strong>Validity:</strong> The above offer is valid until 18:00 Hrs., ${new Date(contextItem?.validityDate || Date.now() + 86400000).toLocaleDateString('en-GB')}, UAE time.</li>
          </ul>
          <p>We look forward to receiving your confirmation to establish our business cooperation with your esteemed company.</p>
          <br/><br/>
          <p>Thanks & Regards,<br/><br/><strong>GLOBCOM INTERNATIONAL FZE</strong><br/>(AUTHORIZED SIGNATORY)</p>
        </div>
      `;
    }
    // 3. SOFT CORPORATE OFFER
    else {
        htmlTemplate = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.5; color: #000; font-size: 14px;">
          ${letterheadHtml}
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Ref No.:</strong> ${refNo}</p>
          <h2 style="text-align: center; margin-top: 30px; margin-bottom: 20px; text-decoration: underline; font-size: 18px;">SOFT CORPORATE OFFER (SCO)</h2>
          <p><strong>To:</strong><br/>${clientCompany}<br/>ATTN: ${clientName}</p>
          <p>Dear Sir,</p>
          <p>For preliminary discussion purposes, we are pleased to outline the following soft offer for ${product}:</p>
          <ul>
            <li><strong>Commodity:</strong> ${product}</li>
            <li><strong>Quantity Available:</strong> ${qtyDisplay}</li>
            <li><strong>Indicative Price:</strong> ${formattedPrice}</li>
            <li><strong>Origin:</strong> ${contextItem?.origin || 'TBA'}</li>
            <li><strong>Proposed Incoterms:</strong> ${contextItem?.incoterms || 'TBA'} ${contextItem?.destination || ''}</li>
          </ul>
          <p>Please note this is a Soft Offer and is not legally binding. A Full Corporate Offer (FCO) and draft contract will follow upon agreement of these preliminary terms.</p>
          <br/><br/>
          <p>Thanks & Regards,<br/><br/><strong>GLOBCOM INTERNATIONAL FZE</strong></p>
        </div>
      `;
    }

    setContent(htmlTemplate);
  }, [isOpen, docType, contextItem, clientCompany, clientName, userLetterhead]);

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      
      const element = document.createElement("div");
      element.innerHTML = content;
      element.style.padding = "1in"; 
      
      const opt: any = {
        margin:       0, 
        filename:     `${docType}_${clientCompany.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true,
          // FIX: Prevent html2canvas from crashing on modern Next.js/Tailwind CSS colors
          onclone: (clonedDoc: any) => {
            const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach((s: any) => s.remove());
          }
        },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const pdfFile = new File([pdfBlob], opt.filename, { type: "application/pdf" });

      const formData = new FormData();
      formData.append("clientId", clientId);
      formData.append("title", `${docType} - ${contextItem?.title || "Commodity"}`);
      formData.append("type", docType);
      formData.append("pdf", pdfFile);
      
      if (contextItem?.id) {
        if (contextItem.price !== undefined) formData.append("supplyId", contextItem.id);
        else formData.append("demandId", contextItem.id);
      }

      await saveGeneratedDocument(formData);
      
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error(error);
      alert("Failed to generate or save the document.");
    } finally {
      setIsGenerating(false);
    }
  };

  const modalContent = isOpen && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-100 rounded-2xl w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-700">
        
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg"><FileText size={20} /></div>
            <h2 className="text-lg font-bold tracking-wide">Live Contract Editor</h2>
          </div>
          <button onClick={() => setIsOpen(false)} disabled={isGenerating} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-full disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col relative">
          {success ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-50 text-emerald-600 z-50">
              <CheckCircle2 size={64} className="mb-4 animate-bounce" />
              <h2 className="text-2xl font-black">Document Generated & Saved!</h2>
              <p className="text-sm font-bold text-emerald-700/70 mt-2">Added to CRM Activity Timeline.</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center gap-4 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Type:</label>
                  <select 
                    value={docType} 
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="bg-transparent text-sm font-bold text-indigo-700 focus:outline-none cursor-pointer"
                  >
                    <option value="SCO">Soft Corporate Offer (SCO)</option>
                    <option value="FCO">Full Corporate Offer (FCO)</option>
                    <option value="LOI">Letter of Interest (LOI)</option>
                  </select>
                </div>
                <p className="text-xs font-medium text-slate-400 ml-auto flex items-center gap-2">
                  <FileEdit size={14} className="text-indigo-400"/> Modify the legal text below before exporting
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-200 relative">
                <style>{`
                  .quill { display: flex; flex-direction: column; height: auto; min-height: 100%; padding-bottom: 40px; }
                  .ql-toolbar { position: sticky; top: 0; z-index: 10; background: white; border: none !important; border-bottom: 1px solid #e2e8f0 !important; padding: 12px 24px !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); display: flex; justify-content: center; }
                  .ql-container { border: none !important; font-family: 'Times New Roman', Times, serif; font-size: 15px; }
                  .ql-editor { background: white; min-height: 1056px; max-width: 816px; margin: 2rem auto; padding: 1in !important; box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); border: 1px solid #cbd5e1; }
                `}</style>
                <ReactQuill 
                  theme="snow" 
                  value={content} 
                  onChange={setContent} 
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'align': [] }],
                      ['clean']
                    ]
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0 z-20">
          <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
            Target Client: <span className="text-slate-900 bg-slate-100 px-2 py-1 rounded-md">{clientCompany || clientName}</span>
          </p>
          <div className="flex gap-3">
            <button onClick={() => setIsOpen(false)} disabled={isGenerating} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleGeneratePdf} 
              disabled={isGenerating || success} 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
            >
              {isGenerating ? <><Loader2 size={18} className="animate-spin" /> Generating PDF...</> : <><Download size={18} /> Lock & Export to CRM</>}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={buttonStyle}>
        <FileEdit size={18} /> Generate Official Proposal
      </button>
      {modalContent}
    </>
  );
}