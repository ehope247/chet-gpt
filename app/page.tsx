"use client";
import { useState, useEffect } from "react";
import { Send, Copy, Flame, TrendingUp, Target, ShieldAlert } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const[mode, setMode] = useState<'chaos' | 'crypto'>('chaos');
  const[messages, setMessages] = useState<{ role: "user" | "chet"; text: string; type?: 'text' | 'image' }[]>([]);
  const [input, setInput] = useState("");
  const[loading, setLoading] = useState(false);

  useEffect(() => { setMounted(true); },[]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const newMsgs =[...messages, { role: "user" as const, text }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // We now send the MODE to the backend!
        body: JSON.stringify({ messages: newMsgs, mode }),
      });
      const data = await res.json();
      setMessages((prev) =>[...prev, { role: "chet", text: data.reply, type: data.type }]);
    } catch {
      setMessages((prev) =>[...prev, { role: "chet", text: "i'm broken 💀" }]);
    } finally { setLoading(false); }
  };

  if (!mounted) return <div className="h-screen bg-black" />;

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <main className="flex-1 flex flex-col h-full border-r border-neutral-800">
        
        {/* HEADER WITH MODE TOGGLE */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="w-10 h-10 rounded-xl object-cover" alt="logo" />
            <h1 className="font-bold tracking-tighter hidden sm:block">CHET GPT <span className="text-red-500 text-xs">PRO</span></h1>
          </div>
          
          {/* THE TOGGLE SWITCH */}
          <div className="flex bg-neutral-900 rounded-full p-1 border border-neutral-800">
            <button 
              onClick={() => setMode('chaos')} 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'chaos' ? 'bg-red-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              <Flame size={14} /> Chaos
            </button>
            <button 
              onClick={() => setMode('crypto')} 
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'crypto' ? 'bg-blue-600 text-white shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              <TrendingUp size={14} /> Crypto Pro
            </button>
          </div>
        </div>
        
        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
              <p className="text-sm">{mode === 'chaos' ? "Chaos mode active. Prepare to be roasted." : "Crypto mode active. Let's analyze some bags."}</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`group relative max-w-[85%] p-4 rounded-2xl border ${m.role === 'user' ? 'bg-neutral-800 border-neutral-700' : mode === 'chaos' ? 'bg-red-950/20 border-red-900/50' : 'bg-blue-950/20 border-blue-900/50'}`}>
                {m.type === 'image' ? <img src={m.text} className="rounded-xl max-w-full" alt="ai gen" /> : <p className="text-sm whitespace-pre-wrap">{m.text}</p>}
                {m.role === 'chet' && m.type !== 'image' && (
                  <button onClick={() => navigator.clipboard.writeText(m.text)} className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy size={16} className="text-neutral-500 hover:text-white" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-neutral-500 animate-pulse">Chet is cooking...</div>}
        </div>

        {/* INPUT AREA WITH QUICK ACTIONS */}
        <div className="p-4 bg-black border-t border-neutral-800">
          
          {/* QUICK ACTION BUTTONS */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => { setMode('chaos'); setInput("Rate this take: "); }} className="flex items-center gap-1 text-xs bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors whitespace-nowrap">
              <Target size={12} /> Rate a Take
            </button>
            <button onClick={() => { setMode('crypto'); setInput("Is this token a scam: "); }} className="flex items-center gap-1 text-xs bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors whitespace-nowrap">
              <ShieldAlert size={12} /> Scam Radar
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="relative">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              className={`w-full bg-neutral-900 py-4 px-6 pr-14 rounded-full focus:outline-none focus:ring-1 transition-all ${mode === 'chaos' ? 'focus:ring-red-600' : 'focus:ring-blue-600'}`} 
              placeholder={mode === 'chaos' ? "Type something stupid..." : "Paste a contract address or crypto question..."} 
            />
            <button type="submit" className={`absolute right-2 top-2 p-2 rounded-full transition-colors ${mode === 'chaos' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </main>

      <aside className="hidden md:flex w-80 p-8 flex-col items-center bg-[#050505] text-center border-l border-neutral-900">
        <img src="/logo.png" className="w-24 h-24 mb-6 rounded-full border border-neutral-800 shadow-2xl" alt="logo" />
        <h2 className="text-xl font-bold mb-2">CHET GPT</h2>
        <p className="text-neutral-500 text-xs mb-8 uppercase tracking-widest">
          {mode === 'chaos' ? "Highly retarded. Use at your own risk." : "Web3 Assistant. DYOR."}
        </p>
        <a href="https://x.com/chetgpt_ai" target="_blank" className="w-full bg-white text-black py-3 rounded-full font-bold text-sm transition-transform hover:scale-105 mb-4">Join Community</a>
        
        {/* COMMUNITY ROAST SUBMISSION LINK */}
        <a href="https://x.com/chetgpt_ai" target="_blank" className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 py-3 rounded-full font-bold text-xs transition-colors hover:bg-neutral-800">
          Submit a Roast
        </a>

        <div className="mt-auto text-[10px] text-neutral-800 font-bold uppercase tracking-tighter">Powered by Aliens</div>
      </aside>
    </div>
  );
}