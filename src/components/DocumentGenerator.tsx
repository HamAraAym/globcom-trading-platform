"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { FileEdit, X, Loader2, Download, FileText, CheckCircle2 } from "lucide-react";
import { saveGeneratedDocument } from "@/actions/documentActions";
import { DocumentType } from "@prisma/client";

// Dynamically import the patched React 19 version of Quill
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
}

export default function DocumentGenerator({ 
  clientId, 
  clientName, 
  clientCompany, 
  contextItem, 
  defaultDocType = "SCO",
  buttonStyle = "bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
}: DocumentGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [docType, setDocType] = useState<DocumentType>(defaultDocType);
  const [content, setContent] = useState<string>("");

  // Ensure Portal only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scrolling when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // SMART DATA INJECTION
  useEffect(() => {
    if (!isOpen) return;

    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const refNo = `GC-${docType}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const product = contextItem?.title || "[Commodity Name]";
    
    // Dynamically pull the correct unit (MT, KG, etc.), default to MT if missing
    const unit = contextItem?.quantityUnit || "MT";
    const qty = contextItem?.quantity ? `${new Intl.NumberFormat().format(contextItem.quantity)} ${unit}` : "[Quantity]";
    
    // Safely handle Optional Pricing
    const rawPrice = contextItem?.targetPrice || contextItem?.price;
    const formattedPrice = rawPrice 
      ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rawPrice)} per ${unit}` 
      : "To Be Determined (TBD)";

    // Extract the new logistics fields with fallbacks
    const loadPort = contextItem?.loadPort || 'TBA';
    const insurance = contextItem?.insurance || 'TBA';
    const origin = contextItem?.origin || 'TBA';
    const destination = contextItem?.destination || 'TBA';
    const incoterms = contextItem?.incoterms || 'TBA';

    let htmlTemplate = "";

    if (docType === "LOI") {
      htmlTemplate = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #000;">
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Ref No.:</strong> ${refNo}</p>
          <h2 style="text-align: center; margin-top: 40px; margin-bottom: 40px; text-decoration: underline;">LETTER OF INTEREST (LOI)</h2>
          <p><strong>To:</strong><br/>${clientCompany}<br/>ATTN: ${clientName}</p>
          <p><strong>SUBJECT:</strong> Purchase of ${product} in Bulk, Qty: ${qty}</p>
          <p>Dear Sir/Madam,</p>
          <p>We, GlobCom International FZE, are pleased to hereby issue our Letter of Interest (LOI) with full corporate responsibility, stating our readiness to purchase the following commodity:</p>
          <ul style="margin-bottom: 20px;">
            <li><strong>Product:</strong> ${product}</li>
            <li><strong>Quantity:</strong> ${qty} (+/- 10% vessel/buyer option)</li>
            <li><strong>Target Price:</strong> ${formattedPrice}</li>
            <li><strong>Origin:</strong> ${origin}</li>
            <li><strong>Destination:</strong> ${destination}</li>
            <li><strong>Load Port:</strong> ${loadPort}</li>
            <li><strong>Insurance:</strong> ${insurance}</li>
            <li><strong>Payment Terms:</strong> ${contextItem?.paymentTerms || 'To be mutually agreed'}</li>
          </ul>
          <p>All other terms and conditions shall be mutually discussed and agreed upon before finalising the contract.</p>
          <p>We look forward to receiving your firm offer (FCO) at your earliest convenience to proceed further.</p>
          <br/><br/>
          <p>Best Regards,<br/><br/><strong>GLOBCOM INTERNATIONAL FZE</strong><br/>(AUTHORIZED SIGNATORY)</p>
        </div>
      `;
    } else {
      htmlTemplate = `
        <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #000;">
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Ref No.:</strong> ${refNo}</p>
          <h2 style="text-align: center; margin-top: 40px; margin-bottom: 40px; text-decoration: underline;">FULL CORPORATE OFFER (FCO)</h2>
          <p><strong>To:</strong><br/>${clientCompany}<br/>ATTN: ${clientName}</p>
          <p>Dear Sir/Madam,</p>
          <p>We, GlobCom International FZE, are pleased to issue this Full Corporate Offer (FCO) under the following terms and conditions:</p>
          <ul style="margin-bottom: 20px;">
            <li><strong>Commodity:</strong> ${product}</li>
            <li><strong>Quantity:</strong> ${qty} (+/- 10% Seller Option)</li>
            <li><strong>Price:</strong> ${formattedPrice}</li>
            <li><strong>Origin:</strong> ${origin}</li>
            <li><strong>Delivery Terms:</strong> ${incoterms} to ${destination}</li>
            <li><strong>Load Port:</strong> ${loadPort}</li>
            <li><strong>Insurance:</strong> ${insurance}</li>
            <li><strong>Payment Terms:</strong> ${contextItem?.paymentTerms || 'To be mutually agreed'}</li>
            <li><strong>Packaging:</strong> ${contextItem?.packaging || 'Bulk'}</li>
          </ul>
          <p><strong>Validity:</strong> The above offer is valid until formal revocation or execution of the Sales & Purchase Agreement.</p>
          <p>We look forward to receiving your confirmation to establish business cooperation with your esteemed entity.</p>
          <br/><br/>
          <p>Best Regards,<br/><br/><strong>GLOBCOM INTERNATIONAL FZE</strong><br/>(AUTHORIZED SIGNATORY)</p>
        </div>
      `;
    }

    setContent(htmlTemplate);
  }, [isOpen, docType, contextItem, clientCompany, clientName]);

  const handleGeneratePdf = async () => {
    setIsGenerating(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      
      const element = document.createElement("div");
      element.innerHTML = content;
      // Format specifically for PDF generation
      element.style.padding = "1in"; 
      
      const opt: any = {
        margin:       0, // Margins handled by padding above
        filename:     `${docType}_${clientCompany.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
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

  // The actual Modal UI, wrapped in a Portal
  const modalContent = isOpen && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-100 rounded-2xl w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-700">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-2 rounded-lg"><FileText size={20} /></div>
            <h2 className="text-lg font-bold tracking-wide">Live Contract Editor</h2>
          </div>
          <button onClick={() => setIsOpen(false)} disabled={isGenerating} className="text-slate-400 hover:text-white transition-colors p-2 bg-slate-800 rounded-full disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          {success ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-50 text-emerald-600 z-50">
              <CheckCircle2 size={64} className="mb-4 animate-bounce" />
              <h2 className="text-2xl font-black">Document Generated & Saved!</h2>
              <p className="text-sm font-bold text-emerald-700/70 mt-2">Added to CRM Activity Timeline.</p>
            </div>
          ) : (
            <>
              {/* Toolbar Section */}
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
              
              {/* Google Docs Style Editor Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-200 relative">
                <style>{`
                  .quill { display: flex; flex-direction: column; height: auto; min-height: 100%; padding-bottom: 40px; }
                  .ql-toolbar { 
                    position: sticky; 
                    top: 0; 
                    z-index: 10; 
                    background: white; 
                    border: none !important; 
                    border-bottom: 1px solid #e2e8f0 !important; 
                    padding: 12px 24px !important;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
                    display: flex;
                    justify-content: center;
                  }
                  .ql-container { border: none !important; font-family: 'Times New Roman', Times, serif; font-size: 15px; }
                  .ql-editor { 
                    background: white; 
                    min-height: 1056px; 
                    max-width: 816px; 
                    margin: 2rem auto;
                    padding: 1in !important; 
                    box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
                    border: 1px solid #cbd5e1;
                  }
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

        {/* Footer */}
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