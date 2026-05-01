"use client";
import React, { useRef, useEffect } from "react";
import { Send, X } from "lucide-react";

const ChatPanel = ({ messages, inputMessage, setInputMessage, onSend, onClose }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputMessage.trim()) {
      onSend();
    }
  };

  return (
    <aside className="w-80 border-l border-white/[0.06] bg-[#09090b] flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-[11px] uppercase tracking-widest text-white/40">Team Chat</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/20 hover:text-white transition-colors p-1 rounded-md hover:bg-white/[0.04]"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-white/10 text-xs mt-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center mx-auto">
              <span className="text-xl">💬</span>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-white/20 uppercase tracking-tighter">No messages yet</p>
              <p className="text-[10px] text-white/10">Start the conversation with your team.</p>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="flex flex-col gap-1.5 group">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-bold flex-shrink-0 text-white/80"
                style={{ backgroundColor: `${msg.sender?.color}33` || "rgba(255,255,255,0.05)", border: `1px solid ${msg.sender?.color}66` || "rgba(255,255,255,0.1)" }}
              >
                {msg.sender?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <span
                className="text-[10px] font-bold tracking-tight opacity-80"
                style={{ color: msg.sender?.color || "#fff" }}
              >
                {msg.sender?.name || "Anonymous"}
              </span>
              <span className="text-[8px] font-bold text-white/10 ml-auto opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
                {msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </span>
            </div>
            <div className="ml-7 bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] p-3 rounded-2xl rounded-tl-none text-xs text-white/60 leading-relaxed transition-all">
              {String(msg.message)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/[0.06] flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.08] rounded-2xl px-3 py-2.5 focus-within:border-white/20 transition-all">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/10 focus:outline-none"
          />
          <button
            onClick={onSend}
            disabled={!inputMessage.trim()}
            className="p-2 rounded-xl bg-white text-black hover:bg-white/90 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
          >
            <Send size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
        <p className="text-[9px] text-white/10 mt-2 text-center uppercase tracking-widest font-bold">Press Enter to send</p>
      </div>
    </aside>
  );
};

export default ChatPanel;
