"use client";
import { useState, useEffect } from "react";
import { Send, Copy } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "chet"; text: string; type?: 'text' | 'image' }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const newMsgs = [...messages, { role: "user" as const, text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "chet", text: data.reply, type: data.type }]);
    } catch {
      setMessages((prev) => [...prev, { role: "chet", text: "i'm broken 💀" }]);
    } finally { setLoading(false); }
  };

  // HYDRATION SHIELD: Prevents the red error box
  if (!mounted) return <div className="h-screen bg-black" />;

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <main className="flex-1 flex flex-col h-full border-r border-neutral-800">
        <div className="p-4 border-b border-neutral-800 flex items-center gap-3 bg-black">
          <img src="/logo.png" className="w-10 h-10 rounded-xl object-cover" alt="logo" />
          <h1 className="font-bold tracking-tighter">CHET GPT <span className="text-red-500 text-xs">PRO</span></h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="group relative max-w-[80%] bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                {m.type === 'image' ? <img src={m.text} className="rounded-xl max-w-full" alt="ai gen" /> : <p className="text-sm">{m.text}</p>}
                {m.role === 'chet' && m.type !== 'image' && (
                  <button onClick={() => navigator.clipboard.writeText(m.text)} className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy size={16} className="text-neutral-500 hover:text-white" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-neutral-500 animate-pulse">Chet is typing...</div>}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="p-4 bg-black border-t border-neutral-800">
          <div className="relative">
            <input value={input} onChange={(e) => setInput(e.target.value)} className="w-full bg-neutral-900 py-4 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-red-600" placeholder="Type something stupid..." />
            <button type="submit" className="absolute right-3 top-3 p-2 bg-red-600 rounded-full"><Send size={18} /></button>
          </div>
        </form>
      </main>

      <aside className="hidden md:flex w-80 p-8 flex-col items-center bg-[#050505] text-center">
        <img src="/logo.png" className="w-24 h-24 mb-6 rounded-full border border-neutral-800 shadow-2xl" alt="logo" />
        <h2 className="text-xl font-bold mb-2">CHET GPT</h2>
        <p className="text-neutral-500 text-xs mb-8 uppercase tracking-widest">Highly retarded. Use at your own risk.</p>
        <a href="https://x.com/chetgpt_ai" target="_blank" className="w-full bg-white text-black py-3 rounded-full font-bold text-sm transition-transform hover:scale-105">Join Community</a>
        <div className="mt-auto text-[10px] text-neutral-800 font-bold uppercase tracking-tighter">Powered by Aliens</div>
      </aside>
    </div>
  );
}