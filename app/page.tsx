"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Copy, Flame, TrendingUp, Target, ShieldAlert, Sun, Moon } from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mode, setMode] = useState<'chaos' | 'crypto'>('chaos');
  const[messages, setMessages] = useState<{ role: "user" | "chet"; text: string; type?: 'text' | 'image' }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); },[]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

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
    <div className={`${theme} transition-colors duration-300`}>
      <div className="flex h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white font-sans overflow-hidden transition-colors duration-300">
        
        <main className="flex-1 flex flex-col h-full border-r border-gray-200 dark:border-neutral-800">
          
          {/* HEADER */}
          <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-[#050505] transition-colors duration-300">
            <div className="flex items-center gap-3">
              <img src="/logo.png" className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="logo" />
              <h1 className="font-extrabold tracking-tighter hidden sm:block text-lg">
                CHET GPT <span className="text-red-500 text-[10px] align-top bg-red-100 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full">PRO</span>
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {/* THEME TOGGLE */}
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors text-gray-500 dark:text-gray-400">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* MODE TOGGLE */}
              <div className="flex bg-gray-100 dark:bg-neutral-900 rounded-full p-1 border border-gray-200 dark:border-neutral-800">
                <button onClick={() => setMode('chaos')} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'chaos' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white'}`}>
                  <Flame size={14} /> Chaos
                </button>
                <button onClick={() => setMode('crypto')} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'crypto' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 dark:text-neutral-500 hover:text-gray-900 dark:hover:text-white'}`}>
                  <TrendingUp size={14} /> Crypto Pro
                </button>
              </div>
            </div>
          </div>
          
          {/* CHAT AREA */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-[#050505] transition-colors duration-300">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-neutral-600 space-y-2 animate-in fade-in duration-700">
                <p className="text-sm font-medium">{mode === 'chaos' ? "Chaos mode active. Prepare to be roasted." : "Crypto mode active. Paste a token address for live data."}</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}>
                <div className={`group relative max-w-[85%] p-4 rounded-2xl border shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-gray-900 text-white border-gray-800 dark:bg-neutral-800 dark:border-neutral-700' 
                    : mode === 'chaos' 
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 text-gray-900 dark:text-neutral-200' 
                      : 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50 text-gray-900 dark:text-neutral-200'
                }`}>
                  {m.type === 'image' ? <img src={m.text} className="rounded-xl max-w-full shadow-md" alt="ai gen" /> : <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.text}</p>}
                  {m.role === 'chet' && m.type !== 'image' && (
                    <button onClick={() => navigator.clipboard.writeText(m.text)} className="absolute -right-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white dark:bg-neutral-800 rounded-full shadow-sm border border-gray-200 dark:border-neutral-700">
                      <Copy size={14} className="text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-in fade-in">
                <div className="bg-gray-200 dark:bg-neutral-900 px-4 py-3 rounded-2xl text-xs text-gray-500 dark:text-neutral-500 animate-pulse border border-gray-300 dark:border-neutral-800">
                  Chet is typing...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-4 bg-white dark:bg-[#050505] border-t border-gray-200 dark:border-neutral-800 transition-colors duration-300">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
              <button onClick={() => { setMode('chaos'); setInput("Rate this take: "); }} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 px-3 py-1.5 rounded-full text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap shadow-sm">
                <Target size={12} /> Rate a Take
              </button>
              <button onClick={() => { setMode('crypto'); setInput("Scan this token: "); }} className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 px-3 py-1.5 rounded-full text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap shadow-sm">
                <ShieldAlert size={12} /> Scam Radar
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="relative">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                className={`w-full bg-gray-100 dark:bg-neutral-900 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-neutral-500 py-4 px-6 pr-14 rounded-full focus:outline-none focus:ring-2 transition-all shadow-inner border border-transparent dark:border-neutral-800 ${mode === 'chaos' ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`} 
                placeholder={mode === 'chaos' ? "Type something stupid..." : "Paste a contract address (e.g. Pump.fun, Solana)..."} 
              />
              <button type="submit" className={`absolute right-2 top-2 p-2 rounded-full transition-all shadow-md ${mode === 'chaos' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                <Send size={18} className="text-white" />
              </button>
            </form>
          </div>
        </main>

        <aside className="hidden md:flex w-80 p-8 flex-col items-center bg-white dark:bg-[#050505] text-center border-l border-gray-200 dark:border-neutral-900 transition-colors duration-300">
          <img src="/logo.png" className="w-28 h-28 mb-6 rounded-full border-4 border-gray-100 dark:border-neutral-900 shadow-xl object-cover" alt="logo" />
          <h2 className="text-2xl font-black mb-2 text-gray-900 dark:text-white tracking-tight">CHET GPT</h2>
          <p className="text-gray-500 dark:text-neutral-500 text-xs mb-8 uppercase tracking-widest font-medium">
            {mode === 'chaos' ? "Highly retarded. Use at your own risk." : "Web3 Assistant. DYOR."}
          </p>
          <a href="https://x.com/chetgpt_ai" target="_blank" className="w-full bg-gray-900 dark:bg-white text-white dark:text-black py-3.5 rounded-full font-bold text-sm transition-transform hover:scale-105 shadow-lg mb-4">Join Community</a>
          
          <a href="https://x.com/chetgpt_ai" target="_blank" className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-neutral-300 py-3 rounded-full font-bold text-xs transition-colors hover:bg-gray-200 dark:hover:bg-neutral-800 shadow-sm">
            Submit a Roast
          </a>

          <div className="mt-auto text-[10px] text-gray-400 dark:text-neutral-700 font-bold uppercase tracking-widest">Powered by Aliens</div>
        </aside>
      </div>
    </div>
  );
}