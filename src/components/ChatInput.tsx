"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, Loader2, AtSign, ArrowRightLeft, DollarSign, Scale, FileText } from "lucide-react";

// The shape of the users we will pass in for the mention dropdown
type MentionUser = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
};

interface ChatInputProps {
  chatId: string;
  users: MentionUser[];
  themeColor: string;
  // Bound server action from the parent page
  sendAction: (formData: FormData) => Promise<void>; 
}

export default function ChatInput({ chatId, users, themeColor, sendAction }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ⚡ COUNTER-OFFER STATE
  const [isOfferMode, setIsOfferMode] = useState(false);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerQty, setOfferQty] = useState("");
  const [offerUnit, setOfferUnit] = useState("MT");
  const [offerNotes, setOfferNotes] = useState("");

  // Mention System State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 🎨 GLOBCOM BRANDING MAP
  const colorMap = {
    blue: {
      primary: "bg-blue-800",
      lightBg: "bg-blue-50",
      text: "text-blue-800",
      ring: "focus:ring-blue-800/20",
      border: "focus:border-blue-800",
      hover: "hover:bg-blue-900",
      buttonBg: "bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800"
    },
    green: {
      primary: "bg-green-600",
      lightBg: "bg-green-50",
      text: "text-green-700", // slightly darker for readability
      ring: "focus:ring-green-600/20",
      border: "focus:border-green-600",
      hover: "hover:bg-green-700",
      buttonBg: "bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
    }
  };
  const theme = colorMap[themeColor as keyof typeof colorMap] || colorMap.blue;

  // Filter users based on what is typed after the '@'
  const filteredUsers = users.filter((u) => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(mentionQuery.toLowerCase())
  ).slice(0, 5); // Max 5 suggestions to keep UI clean

  // Handle typing and detect if we are in an active '@' mention
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPosition);
    
    // Regex to find if the user just typed '@' followed by word characters
    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@(\w*)$/);

    if (mentionMatch) {
      setShowMentions(true);
      setMentionQuery(mentionMatch[1]);
      setSelectedIndex(0);
    } else {
      setShowMentions(false);
    }
  };

  // Insert the selected user into the text box
  const insertMention = (user: MentionUser) => {
    if (!textareaRef.current) return;
    
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    
    // Find where the '@' started
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    // Replace the '@query' with '@FirstNameLastName '
    const newTextBefore = textBeforeCursor.slice(0, lastAtIndex) + `@${user.firstName}${user.lastName} `;
    
    setContent(newTextBefore + textAfterCursor);
    setShowMentions(false);
    
    // Reset focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newTextBefore.length, newTextBefore.length);
    }, 0);
  };

  // Intercept Keyboard strokes for the dropdown and fast submission
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredUsers.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredUsers.length - 1));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredUsers[selectedIndex]);
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      // Fast submit on pure Enter (Shift+Enter makes a new line)
      e.preventDefault();
      if (content.trim()) {
        formRef.current?.requestSubmit();
      }
    }
  };

  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate based on mode
    if (isOfferMode) {
      if (!offerPrice || !offerQty) return;
    } else {
      if (!content.trim()) return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      if (isOfferMode) {
        // Construct the strict JSON payload for the RealtimeMessageFeed parser
        const payload = {
          type: "COUNTER_OFFER",
          price: parseFloat(offerPrice),
          quantity: parseFloat(offerQty),
          unit: offerUnit,
          notes: offerNotes.trim()
        };
        formData.append("content", JSON.stringify(payload));
      } else {
        formData.append("content", content);
      }

      await sendAction(formData);
      
      // Reset State
      setContent("");
      setShowMentions(false);
      setIsOfferMode(false);
      setOfferPrice("");
      setOfferQty("");
      setOfferNotes("");
      
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative p-3 md:p-4 bg-white border-t border-slate-200 shrink-0 z-20 pb-safe">
      
      {/* THE MENTION DROPDOWN (Responsive Width & Position) */}
      {showMentions && filteredUsers.length > 0 && !isOfferMode && (
        <div className="absolute bottom-full left-2 right-2 md:right-auto md:left-14 mb-2 md:mb-3 md:w-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="bg-slate-50 px-3 py-2.5 border-b border-slate-100 flex items-center gap-2">
            <AtSign size={14} className="text-slate-400 shrink-0" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tag Team Member</span>
          </div>
          <div className="p-1.5 space-y-0.5">
            {filteredUsers.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-3 py-2 rounded-xl flex flex-col transition-colors ${
                  idx === selectedIndex ? theme.lightBg : "hover:bg-slate-50"
                }`}
              >
                <span className={`text-sm font-bold ${idx === selectedIndex ? theme.text : 'text-slate-900'}`}>
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  {user.role.replace("_", " ")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* THE INPUT AREA */}
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-2">
        
        {/* Toggle Bar */}
        <div className="flex justify-between items-center px-1">
          <button 
            type="button" 
            onClick={() => setIsOfferMode(!isOfferMode)}
            className={`text-[10px] md:text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shadow-sm ${
              isOfferMode 
                ? `${theme.primary} text-white border-transparent` 
                : theme.buttonBg
            }`}
          >
            <ArrowRightLeft size={14} /> 
            {isOfferMode ? "Cancel Offer" : "Draft Official Offer"}
          </button>
          
          {!isOfferMode && (
            <button type="button" className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors">
              <Paperclip size={18} />
            </button>
          )}
        </div>

        {/* Dynamic Input Zone */}
        <div className="flex items-end gap-2 md:gap-3">
          
          <div className="flex-1 relative">
            {isOfferMode ? (
              // ⚡ OFFER MODE FORM
              <div className={`p-4 bg-slate-50 border-2 ${theme.border} rounded-2xl animate-in fade-in slide-in-from-bottom-2`}>
                <h3 className={`text-[10px] md:text-xs font-black uppercase tracking-widest mb-3 ${theme.text}`}>Structured Deal Terms</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      type="number" step="0.01" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} required
                      className={`w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${theme.ring} ${theme.border} text-sm font-bold placeholder:text-slate-400`}
                      placeholder="Target Price"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Scale size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input 
                        type="number" step="any" value={offerQty} onChange={(e) => setOfferQty(e.target.value)} required
                        className={`w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${theme.ring} ${theme.border} text-sm font-bold placeholder:text-slate-400`}
                        placeholder="Volume"
                      />
                    </div>
                    <select 
                      value={offerUnit} onChange={(e) => setOfferUnit(e.target.value)}
                      className={`w-16 bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 ${theme.ring} ${theme.border}`}
                    >
                      <option value="MT">MT</option>
                      <option value="KG">KG</option>
                      <option value="BBL">BBL</option>
                    </select>
                  </div>
                </div>
                <div className="relative">
                  <FileText size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input 
                    type="text" value={offerNotes} onChange={(e) => setOfferNotes(e.target.value)}
                    className={`w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 ${theme.ring} ${theme.border} text-sm font-medium placeholder:text-slate-400`}
                    placeholder="Optional conditions (e.g., Delivery in March)"
                  />
                </div>
              </div>
            ) : (
              // 💬 STANDARD TEXT MODE
              <textarea 
                ref={textareaRef}
                name="content"
                value={content}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                rows={2}
                placeholder="Type your message... (@ to tag)"
                required
                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-base md:text-sm focus:outline-none focus:ring-2 ${theme.ring} ${theme.border} transition-all resize-none custom-scrollbar shadow-inner`}
              />
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={isOfferMode ? (!offerPrice || !offerQty || isSubmitting) : (!content.trim() || isSubmitting)}
            className={`p-3 md:p-3.5 ${theme.primary} ${theme.hover} disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl transition-all shadow-lg shadow-slate-900/10 group shrink-0 self-end`}
          >
            {isSubmitting ? <Loader2 size={20} className="animate-spin w-5 h-5" /> : <Send size={20} className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
          </button>
        </div>
      </form>
    </div>
  );
}