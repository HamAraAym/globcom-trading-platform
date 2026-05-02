"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Send, Paperclip, Loader2, AtSign } from "lucide-react";

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
  // We pass the bound server action from the parent page
  sendAction: (formData: FormData) => Promise<void>; 
}

export default function ChatInput({ chatId, users, themeColor, sendAction }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention System State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Tailwind safe-mapping for dynamic colors
  const colorMap = {
    blue: {
      lightBg: "bg-blue-50",
      text: "text-blue-700",
      ring: "focus:ring-blue-500/30",
      border: "focus:border-blue-500",
      hover: "hover:bg-blue-600",
    },
    emerald: {
      lightBg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "focus:ring-emerald-500/30",
      border: "focus:border-emerald-500",
      hover: "hover:bg-emerald-600",
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
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      await sendAction(formData);
      setContent("");
      setShowMentions(false);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative p-2 md:p-4 bg-white border-t border-slate-200 shrink-0 z-20 pb-safe">
      
      {/* THE MENTION DROPDOWN (Responsive Width & Position) */}
      {showMentions && filteredUsers.length > 0 && (
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

      {/* THE INPUT BAR */}
      <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2 md:gap-3">
        <button type="button" className="p-3 md:p-3.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200 shrink-0">
          <Paperclip size={20} className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative">
          <textarea 
            ref={textareaRef}
            name="content"
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Type your message... (@ to tag)"
            required
            // CRITICAL FIX: text-base on mobile prevents iOS keyboard zoom, md:text-sm for desktop
            className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3 md:px-4 py-2.5 md:py-3.5 text-base md:text-sm focus:outline-none focus:ring-2 ${theme.ring} ${theme.border} transition-all resize-none custom-scrollbar`}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={!content.trim() || isSubmitting}
          className={`p-3 md:p-3.5 bg-slate-900 ${theme.hover} disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-100 text-white rounded-xl transition-all shadow-lg shadow-slate-900/10 group shrink-0`}
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin w-5 h-5" /> : <Send size={20} className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
        </button>
      </form>
    </div>
  );
}