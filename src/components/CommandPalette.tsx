"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Building, FileBox, Box, Loader2, X } from "lucide-react";
import { globalSearch } from "@/actions/searchActions";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  link: string;
};

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Listen for Cmd+K (Keyboard) OR Custom Mobile Event (Tap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleMobileOpen = () => setIsOpen(true);

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("open-command-palette", handleMobileOpen);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("open-command-palette", handleMobileOpen);
    };
  }, []);

  // 2. Auto-focus the input when opened & lock background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // 3. Handle live debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await globalSearch(query);
        setResults(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Wait 300ms after the user stops typing to hit the database

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (link: string) => {
    setIsOpen(false);
    router.push(link);
  };

  const getIcon = (type: string) => {
    switch (type) {
      // NEW: GlobCom Branding applied to icons
      case "CLIENT": return <Building size={16} className="text-slate-700" />;
      case "DEMAND": return <FileBox size={16} className="text-blue-800" />;
      case "SUPPLY": return <Box size={16} className="text-green-600" />;
      default: return <Search size={16} className="text-slate-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>

      <div className="bg-white rounded-2xl md:rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Search Input Area */}
        <div className="flex items-center px-4 md:px-6 py-4 border-b border-slate-100 bg-white relative">
          <Search size={20} className="text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, demands, supplies..."
            className="flex-1 bg-transparent border-none outline-none text-base md:text-lg text-slate-900 placeholder:text-slate-400"
          />
          {isLoading && <Loader2 size={18} className="animate-spin text-slate-400 ml-3 shrink-0" />}
          <div className="hidden sm:flex items-center gap-1 ml-4 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-400 shrink-0">
            ESC to close
          </div>
          {/* Mobile Close */}
          <button onClick={() => setIsOpen(false)} className="sm:hidden ml-3 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-800">
             <X size={16} />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50">
          
          {query.length >= 2 && results.length === 0 && !isLoading && (
            <div className="p-8 text-center text-slate-500">
              <p className="font-bold text-sm">No results found for "{query}"</p>
              <p className="text-xs mt-1">Try searching a different company, product, or email.</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-2 md:p-3">
              <div className="px-3 pb-2 pt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Search Results
              </div>
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result.link)}
                    className="w-full flex items-center justify-between p-3 md:p-4 rounded-xl bg-transparent hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                      <div className="p-2 bg-slate-100 group-hover:bg-slate-50 rounded-lg shrink-0">
                        {getIcon(result.type)}
                      </div>
                      <div className="truncate">
                        <p className="text-sm md:text-base font-bold text-slate-900 truncate">{result.title}</p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-500 truncate mt-0.5">{result.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-100 rounded text-slate-500 shrink-0 ml-3">
                      {result.type}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty State Instructions */}
          {query.length < 2 && (
            <div className="p-6 md:p-10 text-center text-slate-400 flex flex-col items-center">
              <Search size={32} className="opacity-20 mb-3" />
              <p className="text-sm font-bold text-slate-600">Start typing to search globally.</p>
              <p className="text-[10px] md:text-xs mt-1 max-w-xs">Instantly jump to CRM profiles, find matching supply requests, or navigate to a demand.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}