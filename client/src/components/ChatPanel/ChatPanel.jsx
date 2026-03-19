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
    <aside className="w-80 border-l border-white/5 bg-[#141414] flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-semibold text-sm text-white">Team Chat</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="text-center text-white/20 text-xs mt-8">
            <p className="text-2xl mb-2">💬</p>
            <p>No messages yet.</p>
            <p>Start the conversation!</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="flex flex-col gap-1 group">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0"
                style={{ backgroundColor: msg.sender?.color || "#8a2be2" }}
              >
                {msg.sender?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <span
                className="text-[10px] font-bold"
                style={{ color: msg.sender?.color || "#8a2be2" }}
              >
                {msg.sender?.name || "Anonymous"}
              </span>
              <span className="text-[9px] text-white/20 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                {msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </span>
            </div>
            <div className="ml-7 bg-white/5 hover:bg-white/8 p-3 rounded-2xl rounded-tl-none text-sm text-white/80 transition-colors">
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 focus-within:border-[#8a2be2]/70 transition-colors">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/30 focus:outline-none"
          />
          <button
            onClick={onSend}
            disabled={!inputMessage.trim()}
            className="p-1.5 rounded-lg bg-[#8a2be2] hover:bg-[#7a1be0] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={12} />
          </button>
        </div>
        <p className="text-[9px] text-white/20 mt-1.5 text-center">Press Enter to send</p>
      </div>
    </aside>
  );
};

export default ChatPanel;
