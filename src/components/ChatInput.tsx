"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
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
    <div className="relative p-4 bg-white border-t border-slate-200 shrink-0 z-20">
      
      {/* THE MENTION DROPDOWN */}
      {showMentions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-16 mb-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center gap-2">
            <AtSign size={14} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tag Team Member</span>
          </div>
          <div className="p-1">
            {filteredUsers.map((user, idx) => (
              <button
                key={user.id}
                type="button"
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-3 py-2 rounded-xl flex flex-col transition-colors ${
                  idx === selectedIndex ? `bg-${themeColor}-50` : "hover:bg-slate-50"
                }`}
              >
                <span className={`text-sm font-bold ${idx === selectedIndex ? `text-${themeColor}-700` : 'text-slate-900'}`}>
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {user.role.replace("_", " ")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* THE INPUT BAR */}
      <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-3">
        <button type="button" className="p-3.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200 shrink-0">
          <Paperclip size={20} />
        </button>
        
        <div className="flex-1 relative">
          <textarea 
            ref={textareaRef}
            name="content"
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Type your message... (Use @ to tag your team)"
            required
            className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/30 focus:border-${themeColor}-500 transition-all resize-none custom-scrollbar`}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={!content.trim() || isSubmitting}
          className={`p-3.5 bg-slate-900 hover:bg-${themeColor}-600 disabled:bg-slate-300 disabled:opacity-50 text-white rounded-xl transition-all shadow-lg shadow-slate-900/20 group shrink-0`}
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
        </button>
      </form>
    </div>
  );
}