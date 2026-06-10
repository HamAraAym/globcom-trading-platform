"use client";

import { useEffect } from "react";

export default function ThemeFix() {
  useEffect(() => {
    // When the Global Hub loads, force the physical iOS body to be dark
    document.body.classList.remove("bg-slate-50");
    document.body.classList.add("bg-[#0B0F19]");
    
    // When the user clicks "Launch Module" and leaves, instantly swap it back to light
    return () => {
      document.body.classList.remove("bg-[#0B0F19]");
      document.body.classList.add("bg-slate-50");
    };
  }, []);

  return null; // This component is invisible, it just does the dirty work!
}