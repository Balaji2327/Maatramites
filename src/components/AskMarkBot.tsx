"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  MinusIcon,
  ArrowPathIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  options?: string[];
}

export default function AskMarkBot() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialMessages: Message[] = [
    {
      id: "welcome-1",
      sender: "bot",
      text: "Hello! I'm Mark, your Maatram Student & Alumni AI Assistant. How can I assist you today?",
      timestamp: "Just now",
      options: [
        "Volunteer verification tips",
        "Academic marksheet submission",
        "Upcoming events & RSVP",
        "Alumni mentorship connect",
      ],
    },
  ];

  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  const handleSend = (userQuery?: string) => {
    const textToSend = userQuery || inputText;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userQuery) setInputText("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = "Thank you for asking! Maatram Foundation scholars are supported 100% with free education. Remember to submit your semester grade sheet on time and participate in volunteer calls.";
      const lower = textToSend.toLowerCase();

      if (lower.includes("volunteer") || lower.includes("verification") || lower.includes("applicant")) {
        reply = "Volunteer Verification Guide: During telephonic verification, verify the applicant's family income, parents' occupation, single parent/orphan status, and genuinely listen to their financial story. Enter detailed, objective remarks so the trust committee can make the right decision.";
      } else if (lower.includes("academic") || lower.includes("marks") || lower.includes("semester")) {
        reply = "Academic Excellence: Scholars must maintain at least 75% attendance and no standing arrears. You can track your SGPA/CGPA and upload your latest semester grade card directly in the Academic tab!";
      } else if (lower.includes("event") || lower.includes("workshop") || lower.includes("meet")) {
        reply = "Events & Workshops: Check the Events tab for upcoming leadership sessions, career guidance workshops, and annual volunteer meets. You can RSVP with one click!";
      } else if (lower.includes("alumni") || lower.includes("mentor")) {
        reply = "Alumni Mentorship: Maatram Alumni work at premier firms like TCS, Zoho, Infosys, and Cognizant. Switch to the Alumni section or view mentorship posts to connect with senior alumni!";
      }

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: reply,
        timestamp: "Just now",
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 700);
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-2.5 bg-brand text-black font-heading font-bold text-xs rounded-md shadow-sm transition-all duration-300 cursor-pointer border border-brand/60 select-none"
          title="Ask Mark AI Assistant"
        >
          <SparklesIcon className="w-4 h-4 animate-spin-slow text-black" />
          <span>Ask Mark AI</span>
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
        </button>
      )}

      {/* Chat Window Container */}
      {isOpen && (
        <div
          className={`fixed bottom-5 right-5 z-50 w-[360px] sm:w-[400px] bg-white border border-black/15 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized ? "h-14" : "h-[540px]"
          }`}
        >
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between border-b border-black">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-black font-heading font-bold text-xs">
                M
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-heading font-bold text-xs text-white">Ask Mark</h4>
                  <span className="text-[10px] bg-brand text-black font-bold px-1.5 py-0.2 rounded-md">
                    AI
                  </span>
                </div>
                <p className="text-[10px] text-black/65">Student & Volunteer Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 text-black/65 hover:text-white rounded-lg transition"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-black/65 hover:text-black/65 rounded-lg transition"
                title="Close"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-black/5 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg ${
                        msg.sender === "user"
                          ? "bg-black text-white rounded-tr-xs "
                          : "bg-white text-black border border-black/15 rounded-tl-xs "
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {msg.options && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSend(opt)}
                            className="px-2.5 py-1 bg-brand/15 hover:bg-brand/15 border border-brand/60 text-black rounded-md text-[11px] font-bold transition cursor-pointer"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-black/65 text-[11px] italic p-1">
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                    <span>Mark is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 bg-white border-t border-black/15">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask Mark anything..."
                    className="flex-1 bg-black/5 border border-black/15 rounded-md px-3.5 py-2 text-xs text-black placeholder-black/65 focus:outline-none focus:border-brand focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2 bg-brand hover:brightness-95 disabled:opacity-50 text-black rounded-md transition cursor-pointer"
                  >
                    <PaperAirplaneIcon className="w-4 h-4 stroke-[2]" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
