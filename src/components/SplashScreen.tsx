"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // 1. Wait for hydration and basic data loading (1.2 seconds)
    const fadeTimer = setTimeout(() => {
      setFade(true); // Start the CSS fade out
    }, 1200);

    // 2. Completely remove it from the DOM after the fade finishes
    const removeTimer = setTimeout(() => {
      setShow(false);
    }, 1700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div 
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0B0F19] transition-opacity duration-500 ease-in-out ${
        fade ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center animate-pulse">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/icon.png" 
          alt="GlobCom" 
          className="w-24 h-24 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.3)] border border-slate-700/50" 
        />
      </div>
    </div>
  );
}