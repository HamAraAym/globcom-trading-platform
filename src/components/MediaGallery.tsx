"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, FileText, Download, Maximize2, Image as ImageIcon, File } from "lucide-react";

export default function MediaGallery({ attachments }: { attachments: string[] }) {
  // Separate states for the two different viewers
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [activePdfIndex, setActivePdfIndex] = useState<number | null>(null);

  const pdfs = attachments.filter(url => url.toLowerCase().includes(".pdf"));
  const images = attachments.filter(url => !url.toLowerCase().includes(".pdf"));

  const getFileName = (url: string) => {
    try {
      const parts = url.split("/");
      const cleanFilename = decodeURIComponent(parts[parts.length - 1].split('?')[0]);
      return cleanFilename.length > 40 ? cleanFilename.substring(0, 37) + "..." : cleanFilename;
    } catch {
      return "Document";
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImageIndex(null);
        setActivePdfIndex(null);
      }
      if (activeImageIndex !== null) {
        if (e.key === "ArrowRight") showNextImage(e as any);
        if (e.key === "ArrowLeft") showPrevImage(e as any);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, images.length]);

  const showNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === null || prev === images.length - 1 ? 0 : prev + 1));
  };

  const showPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === null || prev === 0 ? images.length - 1 : prev - 1));
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-6 flex flex-col gap-8">
      
      {/* ==========================================
          SECTION 1: OFFICIAL DOCUMENTS (PDFs)
          ========================================== */}
      {pdfs.length > 0 && (
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <FileText size={16} className="text-rose-500" /> Official Documents ({pdfs.length})
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pdfs.map((pdf, idx) => (
              <button
                key={idx}
                onClick={() => setActivePdfIndex(idx)}
                className="group flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all text-left"
              >
                <div className="bg-rose-50 p-3 rounded-lg group-hover:bg-rose-100 transition-colors">
                  <FileText size={28} className="text-rose-600" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate">{getFileName(pdf)}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Click to view document</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          SECTION 2: LARGE MEDIA GALLERY (Images)
          ========================================== */}
      {images.length > 0 && (
        <div className="flex flex-col gap-4">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ImageIcon size={16} className="text-blue-500" /> Media Gallery ({images.length})
          </h4>
          
          {/* Using a responsive grid with large, aspect-square thumbnails */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className="group relative aspect-square w-full bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Media ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                  <Maximize2 size={32} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transition-all scale-75 group-hover:scale-100" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 1: PDF VIEWER
          ========================================== */}
      {activePdfIndex !== null && (
        <div 
          className="fixed inset-0 z-[999] bg-slate-950/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
          onClick={() => setActivePdfIndex(null)}
        >
          <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/10 shrink-0 text-white bg-black/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="bg-rose-600 p-1.5 rounded-md"><FileText size={18} /></div>
              <p className="text-sm font-medium text-slate-200 truncate">{getFileName(pdfs[activePdfIndex])}</p>
            </div>
            <div className="flex items-center gap-2">
              <a href={pdfs[activePdfIndex]} download target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-300" onClick={(e) => e.stopPropagation()}>
                <Download size={20} />
              </a>
              <button onClick={() => setActivePdfIndex(null)} className="p-2 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>
          <div className="flex-1 p-4 md:p-8 flex items-center justify-center overflow-hidden pointer-events-none">
            <div className="w-full h-full max-w-5xl bg-white rounded-xl overflow-hidden shadow-2xl border border-white/10 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
               <iframe src={`${pdfs[activePdfIndex]}#toolbar=0&view=FitH`} className="w-full h-full border-none" title="PDF Viewer" />
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: IMAGE LIGHTBOX
          ========================================== */}
      {activeImageIndex !== null && (
        <div 
          className="fixed inset-0 z-[999] bg-slate-950/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
          onClick={() => setActiveImageIndex(null)}
        >
          <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/10 shrink-0 text-white bg-black/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 px-3 py-1 rounded-md text-xs font-black tracking-widest">
                {activeImageIndex + 1} / {images.length}
              </div>
            </div>
            <button onClick={() => setActiveImageIndex(null)} className="p-2 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
            {images.length > 1 && (
              <>
                <button onClick={showPrevImage} className="absolute left-4 md:left-8 z-10 p-3 md:p-4 bg-black/40 hover:bg-blue-600 text-white rounded-full transition-all">
                  <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
                </button>
                <button onClick={showNextImage} className="absolute right-4 md:right-8 z-10 p-3 md:p-4 bg-black/40 hover:bg-blue-600 text-white rounded-full transition-all">
                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
                </button>
              </>
            )}
            <div className="w-full h-full max-w-6xl flex items-center justify-center pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[activeImageIndex]} alt="Full view" className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}