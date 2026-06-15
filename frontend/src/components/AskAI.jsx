import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles, Languages } from "lucide-react";
import ReactMarkdown from "react-markdown";

const STORAGE_KEY = "oculux_ai_session_v1";

export default function AskAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your OculuxVision concierge. Ask me anything about our smart glasses — in English, हिन्दी, or any language you prefer.\n\n_Try: \"Show me a kids frame under ₹10,000\" or \"क्या आपके पास titanium frame है?\"_" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async (text) => {
    if (!text.trim() || busy) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "…", streaming: true }]);
    setInput("");
    setBusy(true);
    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/ai/chat`;
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId || undefined,
          messages: next.map(({ role, content }) => ({ role, content })),
        }),
      });
      const newSid = r.headers.get("X-Session-Id");
      if (newSid && newSid !== sessionId) {
        setSessionId(newSid);
        localStorage.setItem(STORAGE_KEY, newSid);
      }
      if (!r.ok || !r.body) {
        throw new Error(`HTTP ${r.status}`);
      }
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMessages((cur) => {
          const arr = [...cur];
          arr[arr.length - 1] = { role: "assistant", content: acc, streaming: true };
          return arr;
        });
      }
      setMessages((cur) => {
        const arr = [...cur];
        arr[arr.length - 1] = { role: "assistant", content: acc || "(no response)" };
        return arr;
      });
    } catch (e) {
      setMessages((cur) => {
        const arr = [...cur];
        arr[arr.length - 1] = { role: "assistant", content: "Sorry — I had trouble connecting. Please try again." };
        return arr;
      });
    } finally { setBusy(false); }
  };

  const suggestions = [
    { en: "Best kids frame under ₹10,000?", hi: "₹10000 तक का सबसे अच्छा kids frame?" },
    { en: "Compare Pro Onyx vs Pro Titan", hi: "Pro Onyx और Titan में अंतर?" },
    { en: "What's the lens quality?", hi: "Lens कैसा है?" },
  ];

  return (
    <>
      <button
        data-testid="ask-ai-toggle"
        onClick={() => setOpen((s) => !s)}
        className="fixed bottom-6 right-6 z-40 h-14 px-5 rounded-full bg-[#1D1D1F] text-white flex items-center gap-2 shadow-[0_18px_40px_-10px_rgba(0,0,0,0.4)] hover:scale-105 transition-transform"
        aria-label="Toggle Ask AI"
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
        <span className="text-sm font-medium">{open ? "Close" : "Ask AI"}</span>
      </button>

      {open && (
        <div
          data-testid="ask-ai-widget"
          className="fixed bottom-24 right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-7rem)] glass-card rounded-2xl flex flex-col overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-[#E5E5EA] flex items-center gap-3 bg-white">
            <div className="w-9 h-9 rounded-full bg-[#1D1D1F] grid place-items-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="display text-base ink leading-none">OculuxVision Concierge</p>
              <p className="text-[10px] mono ink-faint mt-1 flex items-center gap-1">
                <Languages className="w-3 h-3"/> Multilingual · powered by Claude
              </p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#FAFAFB]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  data-testid={`ask-ai-msg-${m.role}`}
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-[#1D1D1F] text-white rounded-br-sm"
                      : "bg-white border border-[#E5E5EA] ink rounded-bl-sm"
                  }`}
                >
                  <div className="prose prose-sm prose-neutral max-w-none [&_p]:my-1 [&_a]:text-[#1D1D1F] [&_a]:underline">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {messages.length <= 1 && (
            <div className="px-3 py-2 bg-[#FAFAFB] border-t border-[#E5E5EA] flex gap-2 overflow-x-auto">
              {suggestions.map((s) => (
                <button
                  key={s.en}
                  onClick={() => send(s.en)}
                  className="text-[11px] whitespace-nowrap px-3 py-1.5 rounded-full bg-white border border-[#E5E5EA] hover:border-[#1D1D1F]"
                >
                  {s.en}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="px-3 py-3 border-t border-[#E5E5EA] bg-white flex gap-2"
          >
            <input
              data-testid="ask-ai-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type in any language…"
              className="flex-1 bg-white border border-[#E5E5EA] rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#1D1D1F]"
            />
            <button
              data-testid="ask-ai-send"
              type="submit"
              disabled={busy || !input.trim()}
              className="w-10 h-10 grid place-items-center rounded-full bg-[#1D1D1F] text-white disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
