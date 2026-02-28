"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Map, Globe2, Building2 } from "lucide-react";

export default function LocationAutocomplete() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");

  useEffect(() => {
    // Wait for the Google Maps script to load globally
    const checkGoogle = setInterval(() => {
      if (window.google && inputRef.current) {
        clearInterval(checkGoogle);
        
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["geocode", "establishment"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          let tempArea = "", tempCity = "", tempCountry = "";

          place.address_components?.forEach((comp) => {
            const types = comp.types;
            if (types.includes("sublocality") || types.includes("neighborhood") || types.includes("route")) {
              tempArea = comp.long_name;
            }
            if (types.includes("locality") || types.includes("administrative_area_level_2")) {
              tempCity = comp.long_name;
            }
            if (types.includes("country")) {
              tempCountry = comp.long_name;
            }
          });

          // Fallback if area is missing but name exists
          if (!tempArea && place.name && place.name !== tempCity) tempArea = place.name;

          setArea(tempArea);
          setCity(tempCity);
          setCountry(tempCountry);
        });
      }
    }, 100);

    return () => clearInterval(checkGoogle);
  }, []);

  return (
    <div className="space-y-4">
      {/* The Google Search Bar */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Address</label>
        <div className="relative mt-1.5">
          <MapPin className="absolute left-3.5 top-3.5 text-indigo-400" size={18} />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Start typing an address or landmark..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-900 font-medium shadow-sm" 
          />
        </div>
      </div>

      {/* The Auto-Populated Split Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Map size={12}/> Area / Route</label>
          <input type="text" name="area" value={area} readOnly required className="w-full p-2.5 bg-slate-100/50 border border-slate-200 rounded-lg text-slate-700 text-sm font-semibold focus:outline-none" placeholder="Auto-fills..." />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Building2 size={12}/> City / Emirate</label>
          <input type="text" name="city" value={city} readOnly required className="w-full p-2.5 bg-slate-100/50 border border-slate-200 rounded-lg text-slate-700 text-sm font-semibold focus:outline-none" placeholder="Auto-fills..." />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5"><Globe2 size={12}/> Country</label>
          <input type="text" name="country" value={country} readOnly required className="w-full p-2.5 bg-slate-100/50 border border-slate-200 rounded-lg text-slate-700 text-sm font-semibold focus:outline-none" placeholder="Auto-fills..." />
        </div>
      </div>
    </div>
  );
}