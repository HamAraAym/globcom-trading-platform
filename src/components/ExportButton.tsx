"use client";

import { Download } from "lucide-react";

export default function ExportButton({ data, type }: { data: any[], type: string }) {
  const handleExport = () => {
    if (!data || data.length === 0) return alert("No data to export.");

    // Filter out complex nested objects (like chatRooms) for a clean CSV
    const headers = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    
    const csvRows = data.map(row => 
      headers.map(fieldName => {
        let cellData = row[fieldName];
        // Handle strings with commas by wrapping them in quotes
        if (typeof cellData === "string") {
            cellData = cellData.replace(/"/g, '""'); // Escape inner quotes
            return `"${cellData}"`;
        }
        return cellData === null || cellData === undefined ? "" : cellData;
      }).join(",")
    );
    
    // Add header row to the top
    csvRows.unshift(headers.map(h => `"${h.toUpperCase()}"`).join(","));
    const csvString = csvRows.join("\n");

    // Trigger Download
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", `${type}_Pipeline_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button 
      onClick={handleExport} 
      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-slate-900/10"
    >
      <Download size={16} /> Export to Excel
    </button>
  );
}