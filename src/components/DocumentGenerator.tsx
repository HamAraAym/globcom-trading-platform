"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { FileEdit, X, Loader2, FileText, CheckCircle2, User, Send, DownloadCloud, ArrowRight, ArrowLeft, Mail } from "lucide-react";
import { saveGeneratedDocument } from "@/actions/documentActions";
import { dispatchToClient } from "@/actions/emailActions"; 
import { DocumentType } from "@prisma/client";

// Dynamically import React Quill for rich text editing without SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

// @ts-ignore - TypeScript doesn't natively type CSS side-effect imports
import "react-quill-new/dist/quill.snow.css";

interface DocumentGeneratorProps {
  clients: { id: string; name: string; company: string | null; email?: string }[]; 
  contextItem?: any; 
  defaultDocType?: DocumentType;
  buttonStyle?: string;
  userLetterhead?: string | null; 
}

export default function DocumentGenerator({ 
  clients, 
  contextItem, 
  defaultDocType = "SCO",
  buttonStyle = "bg-blue-800 hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-800/20 transition-all flex items-center gap-2",
  userLetterhead
}: DocumentGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // WIZARD STATE
  const [step, setStep] = useState<1 | 2>(1);
  
  // Track which action is currently loading
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocumentType>(defaultDocType);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [content, setContent] = useState<string>("");

  // EMAIL DRAFT STATE
  const [customEmailMessage, setCustomEmailMessage] = useState("");

  const activeClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const isSupply = contextItem?.price !== undefined;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else {
      document.body.style.overflow = 'unset';
      setStep(1); // Reset step on close
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // SMART DATA & TEMPLATE INJECTION
  useEffect(() => {
    if (!isOpen || !activeClient) return;

    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const refNo = `GC-${docType}-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const product = contextItem?.title || "[Commodity Name]";
    const unit = contextItem?.quantityUnit || "MT";
    const baseQty = contextItem?.quantity ? new Intl.NumberFormat().format(contextItem.quantity) : "[Quantity]";
    const toleranceStr = contextItem?.tolerance ? ` ${contextItem.tolerance}` : "";
    const qtyDisplay = `${baseQty} ${unit}${toleranceStr}`; 
    const rawPrice = contextItem?.targetPrice || contextItem?.price;
    const formattedPrice = rawPrice ? `USD ${new Intl.NumberFormat('en-US').format(rawPrice)} per ${unit}` : "USD ______ per metric tonne";
    const clientCompany = activeClient.company || "Independent Entity";
    const clientName = activeClient.name;

    let specsHtml = "";
    if (contextItem?.keyTerms && Array.isArray(contextItem.keyTerms) && contextItem.keyTerms.length > 0) {
      specsHtml = contextItem.keyTerms.map((term: any) => `<li style="margin-bottom: 2px;"><strong>${term.label}:</strong> ${term.value}</li>`).join("");
    } else {
      specsHtml = `<li><strong>Specifications:</strong> As per standard export quality.</li>`;
    }

    let htmlTemplate = "";
    if (docType === "LOI") {
      htmlTemplate = `<div style="font-family: 'Times New Roman', Times, serif; line-height: 1.4; color: #000; font-size: 13.5px;"><p><strong>Date:</strong> ${dateStr}</p><p><strong>Ref No.:</strong> ${refNo}</p><h2 style="text-align: center; margin-top: 10px; margin-bottom: 15px; text-decoration: underline; font-size: 16px;">LETTER OF INTEREST</h2><p><strong>To:</strong><br/>${clientCompany}<br/>ATTN: ${clientName}</p><p><strong>SUBJECT: Purchase of ${product} in Bulk, Qty: ${qtyDisplay}</strong></p><p>Dear Sir,</p><p>We are pleased to hereby issue our Letter of Interest (LOI) for the same on the following basis:</p><ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;"><li><strong>Product:</strong> ${product} in Bulk</li><li style="margin-top: 6px;"><strong><u>Specifications:</u></strong></li><ul style="margin-top: 4px; margin-bottom: 10px;">${specsHtml}</ul><li><strong>Quantity:</strong> ${qtyDisplay}</li><li><strong>Origin:</strong> ${contextItem?.origin || 'UAE / Oman'}</li><li><strong>Destination:</strong> ${contextItem?.destination || 'Open as per buyer option'}</li><li><strong>Shipment:</strong> ${contextItem?.timeline || '1st week January 2026'}</li><li><strong>Price:</strong> ${formattedPrice}, CIF ${contextItem?.destination || 'Any Port'}</li><li><strong>Payment Terms:</strong> ${contextItem?.paymentTerms || '100% payment before discharging.'}</li></ul><div style="page-break-inside: avoid; margin-top: 20px;"><p>Thanks & Regards,<br/><br/><strong>GLOBCOM INTERNATIONAL FZE</strong><br/>(AUTHORIZED SIGNATORY)</p></div></div>`;
    } else if (docType === "FCO") {
      htmlTemplate = `<div style="font-family: 'Times New Roman', Times, serif; line-height: 1.4; color: #000; font-size: 13.5px;"><p><strong>Ref. No:</strong> ${refNo}</p><p><strong>Date:</strong> ${dateStr}</p><p><strong>TO:</strong> ${clientCompany}</p><p><strong>Attn:</strong> ${clientName}</p><h2 style="text-align: center; margin-top: 10px; margin-bottom: 15px; text-decoration: underline; font-size: 16px;">SUBJECT: OFFER FOR ${product.toUpperCase()}</h2><p>Dear Sir,</p><p>We are pleased to offer the ${product} as per the terms and conditions.</p><ul style="list-style-type: none; padding-left: 0; margin-bottom: 15px;"><li><strong>Commodity:</strong> ${product}</li><li><strong>Quantity:</strong> ${qtyDisplay}</li><li style="margin-top: 6px;"><strong><u>Quality:</u></strong></li><ul style="margin-top: 4px; margin-bottom: 10px;">${specsHtml}</ul><li><strong>Payment Terms:</strong> ${contextItem?.paymentTerms || '20% Advance and Balance against document.'}</li><li><strong>Delivery Terms:</strong> ${contextItem?.incoterms || 'CFR'} ${contextItem?.destination || 'Any Port'}</li><li><strong>Price:</strong> ${formattedPrice} CFR ${contextItem?.destination || 'Any Port'}</li></ul><p>We look forward to receiving your confirmation to establish our business cooperation.</p><div style="page-break-inside: avoid; margin-top: 20px;"><p>Thanks & Regards,<br/><br/><strong>GLOBCOM INTERNATIONAL FZE</strong><br/>(AUTHORIZED SIGNATORY)</p></div></div>`;
    } else {
        htmlTemplate = `<div style="font-family: 'Times New Roman', Times, serif; line-height: 1.4; color: #000; font-size: 13.5px;"><p><strong>Date:</strong> ${dateStr}</p><p><strong>Ref No.:</strong> ${refNo}</p><h2 style="text-align: center; margin-top: 10px; margin-bottom: 15px; text-decoration: underline; font-size: 16px;">SOFT CORPORATE OFFER (SCO)</h2><p><strong>To:</strong><br/>${clientCompany}<br/>ATTN: ${clientName}</p><p>Dear Sir,</p><p>For preliminary discussion purposes, we are pleased to outline the following soft offer for ${product}:</p><ul style="margin-bottom: 15px;"><li><strong>Commodity:</strong> ${product}</li><li><strong>Quantity Available:</strong> ${qtyDisplay}</li><li><strong>Indicative Price:</strong> ${formattedPrice}</li><li><strong>Origin:</strong> ${contextItem?.origin || 'TBA'}</li></ul><p>Please note this is a Soft Offer and is not legally binding.</p><div style="page-break-inside: avoid; margin-top: 20px;"><p>Thanks & Regards,<br/><br/><strong>GLOBCOM INTERNATIONAL FZE</strong></p></div></div>`;
    }
    setContent(htmlTemplate);

    // ⚡ PRE-FILL EMAIL BASED ON SUPPLY VS DEMAND
    const greeting = `Dear ${clientName},\n\n`;
    const signOff = `\n\nLooking forward to your feedback.\n\nBest regards,\nGlobCom International FZE`;
    
    if (isSupply) {
      setCustomEmailMessage(`${greeting}Please find attached our official ${docType} regarding the supply of ${product}. We are ready to proceed based on the enclosed terms.${signOff}`);
    } else {
      setCustomEmailMessage(`${greeting}Regarding your procurement requirements for ${product}, please find attached our official ${docType}. We are prepared to fulfill this demand as outlined in the attached document.${signOff}`);
    }

  }, [isOpen, docType, selectedClientId, contextItem, activeClient, isSupply]);

  // Core PDF Generation Logic
  const generatePdfBlob = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    
    // Create an isolated, pixel-perfect A4/Letter container
    const element = document.createElement("div");
    
    // We wrap the content in a div that exactly matches an 8.5" x 11" paper at 96 DPI
    element.innerHTML = `
      <div style="
        width: 816px; 
        min-height: 1056px; 
        padding: ${userLetterhead ? '1.8in 1in 1.5in 1in' : '1in'}; 
        background-color: white;
        background-image: ${userLetterhead ? `url('${userLetterhead}')` : 'none'};
        background-size: 100% 100%; 
        background-repeat: no-repeat;
        background-position: top center;
        box-sizing: border-box;
        color: #000000;
        font-family: 'Times New Roman', Times, serif;
      ">
        ${content}
      </div>
    `;
    
    const opt: any = {
      margin: 0, 
      filename: `${docType}_${(activeClient?.company || "Client").replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false,
        // FORCE the canvas to render at exact paper width, regardless of the user's screen size
        width: 816,
        windowWidth: 816,
        // THE MAGIC FIX: Strips out Tailwind CSS from the clone so 'oklch' doesn't crash it
        onclone: (clonedDoc: any) => {
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach((s: any) => s.remove());
        }
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
    return { blob: pdfBlob, filename: opt.filename };
  };

  // ACTION 1: Download Only
  const handleDownloadOnly = async () => {
    setIsDownloading(true);
    try {
      const { blob, filename } = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Failed to generate PDF download.");
    } finally {
      setIsDownloading(false);
    }
  };

  // ACTION 2: Save & Email Directly
  const handleSaveAndEmail = async () => {
    if (!contextItem?.id) return alert("You must be inside an active deal context to email a proposal directly.");
    
    setIsEmailing(true);
    try {
      const { blob, filename } = await generatePdfBlob();
      const pdfFile = new File([blob], filename, { type: "application/pdf" });

      // 1. Upload & Save to Database
      const saveFormData = new FormData();
      saveFormData.append("clientId", activeClient.id);
      saveFormData.append("title", `${docType} - ${contextItem?.title || "Commodity"}`);
      saveFormData.append("type", docType);
      saveFormData.append("pdf", pdfFile);
      if (isSupply) saveFormData.append("supplyId", contextItem.id);
      else saveFormData.append("demandId", contextItem.id);

      const saveRes = await saveGeneratedDocument(saveFormData);

      // 2. Dispatch the Email with the returned Vercel Blob URL and custom message
      const emailFormData = new FormData();
      emailFormData.append("buyerId", activeClient.id);
      emailFormData.append("contextId", contextItem.id);
      emailFormData.append("contextType", isSupply ? "SUPPLY" : "DEMAND");
      emailFormData.append("title", `${docType} - ${contextItem.title}`);
      emailFormData.append("dispatchType", docType);
      emailFormData.append("customMessage", customEmailMessage); // Pass the edited message!
      emailFormData.append("attachedDocs", JSON.stringify([saveRes.document.fileUrl])); 

      await dispatchToClient(emailFormData);
      
      setStep(1);
      setSuccessMsg(`Document saved and emailed to ${activeClient.company || activeClient.name}!`);
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg(null);
      }, 3000);

    } catch (error) {
      console.error(error);
      alert("Failed to save and email the document.");
    } finally {
      setIsEmailing(false);
    }
  };

  const isWorking = isDownloading || isEmailing;

  const modalContent = isOpen && mounted ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-slate-100 rounded-2xl w-full max-w-5xl h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-700">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0f172a] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm border border-blue-500">
              {step === 1 ? <FileText size={20} /> : <Mail size={20} />}
            </div>
            <h2 className="text-lg font-bold tracking-wide">
              {step === 1 ? "Live Contract Editor" : "Official Dispatch Configuration"}
            </h2>
          </div>
          <button onClick={() => setIsOpen(false)} disabled={isWorking} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col relative">
          {successMsg ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-50 text-green-600 z-50">
              <CheckCircle2 size={64} className="mb-4 animate-bounce drop-shadow-sm" />
              <h2 className="text-2xl font-black text-center">{successMsg}</h2>
              <p className="text-sm font-bold text-green-700/70 mt-2">Added to CRM Activity Timeline.</p>
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* STEP 1: PDF CONTRACT EDITOR                               */}
              {/* ========================================================= */}
              <div className={`flex-1 flex-col overflow-hidden ${step === 1 ? "flex" : "hidden"}`}>
                <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center gap-4 shrink-0 shadow-sm z-20">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-inner">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Type:</label>
                    <select value={docType} onChange={(e) => setDocType(e.target.value as DocumentType)} className="bg-transparent text-sm font-bold text-blue-800 focus:outline-none cursor-pointer">
                      <option value="SCO">Soft Corporate Offer (SCO)</option>
                      <option value="FCO">Full Corporate Offer (FCO)</option>
                      <option value="LOI">Letter of Interest (LOI)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-inner">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><User size={12}/> Client:</label>
                    <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="bg-transparent text-sm font-bold text-blue-800 focus:outline-none cursor-pointer max-w-[200px] truncate">
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                    </select>
                  </div>

                  <p className="text-xs font-medium text-slate-400 ml-auto flex items-center gap-2 hidden sm:flex">
                    <FileEdit size={14} className="text-blue-600"/> Modify text below before exporting
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-200 relative">
                  <style>{`
                    .quill { display: flex; flex-direction: column; height: auto; min-height: 100%; padding-bottom: 40px; }
                    .ql-toolbar { position: sticky; top: 0; z-index: 10; background: white; border: none !important; border-bottom: 1px solid #e2e8f0 !important; padding: 12px 24px !important; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); display: flex; justify-content: center; }
                    .ql-container { border: none !important; font-family: 'Times New Roman', Times, serif; font-size: 13.5px; }
                    .ql-editor { background-color: white; min-height: 1056px; max-width: 816px; margin: 2rem auto; box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); border: 1px solid #cbd5e1; 
                      ${userLetterhead ? `background-image: url('${userLetterhead}'); background-size: 816px 1056px; background-repeat: repeat-y; background-position: top center; padding: 1.8in 1in 1.5in 1in !important;` : `padding: 1in !important;`}
                    }
                  `}</style>
                  <ReactQuill theme="snow" value={content} onChange={setContent} modules={{ toolbar: [ [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], [{ 'align': [] }], ['clean'] ] }} />
                </div>
              </div>

              {/* ========================================================= */}
              {/* STEP 2: EMAIL DISPATCHER UI                               */}
              {/* ========================================================= */}
              <div className={`flex-1 flex-col overflow-y-auto custom-scrollbar bg-slate-50 p-6 md:p-10 ${step === 2 ? "flex" : "hidden"}`}>
                <div className="max-w-3xl mx-auto w-full space-y-8">
                  
                  {/* Big Client Selector */}
                  <div>
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <User size={16} className="text-blue-600" /> Select Recipient
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {clients.map(c => (
                        <div 
                          key={c.id} 
                          onClick={() => setSelectedClientId(c.id)}
                          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            selectedClientId === c.id 
                              ? "border-blue-600 bg-blue-50 shadow-md" 
                              : "border-slate-200 bg-white hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className={`font-bold ${selectedClientId === c.id ? "text-blue-900" : "text-slate-700"}`}>
                              {c.company || c.name}
                            </p>
                            {selectedClientId === c.id && <CheckCircle2 size={18} className="text-blue-600" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{c.email || "No email on file"}</p>
                          {c.company && <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-2">ATTN: {c.name}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Email Composer */}
                  <div>
                     <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Mail size={16} className="text-blue-600" /> Draft Message
                    </h3>
                    
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest w-16">Subject:</span>
                        <span className="text-sm font-bold text-slate-900 truncate">Official {docType}: {contextItem?.title}</span>
                      </div>
                      
                      <div className="p-4">
                        <textarea 
                          rows={8}
                          value={customEmailMessage}
                          onChange={(e) => setCustomEmailMessage(e.target.value)}
                          className="w-full bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y custom-scrollbar"
                          placeholder="Type your official message to the client here..."
                        />
                      </div>
                      
                      <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center gap-2">
                        <FileText size={16} className="text-rose-500" />
                        <span className="text-xs font-bold text-slate-600">Attachment:</span>
                        <span className="text-xs font-medium text-slate-500 italic">[{docType}]_{activeClient?.company?.replace(/\s+/g, '_') || "Client"}.pdf</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>

        {/* ⚡ WIZARD FOOTER CONTROLS */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0 z-20">
          {step === 1 ? (
            <button onClick={() => setIsOpen(false)} disabled={isWorking} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
              Cancel
            </button>
          ) : (
            <button onClick={() => setStep(1)} disabled={isWorking} className="px-4 py-2.5 text-sm font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-2">
              <ArrowLeft size={16} /> Back to Editor
            </button>
          )}
          
          <div className="flex items-center gap-3">
            {step === 1 ? (
              <>
                <button 
                  onClick={handleDownloadOnly} 
                  disabled={isWorking || !!successMsg} 
                  className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} />}
                  Download PDF
                </button>

                <button 
                  onClick={() => {
                    if (!contextItem?.id) return alert("You must be inside an active deal context to email a proposal directly.");
                    setStep(2);
                  }} 
                  className="flex items-center gap-2 bg-blue-800 hover:bg-blue-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-800/20 transition-all"
                >
                  Prepare Email <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <button 
                onClick={handleSaveAndEmail} 
                disabled={isWorking || !!successMsg} 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
              >
                {isEmailing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                Lock PDF & Send Email
              </button>
            )}
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