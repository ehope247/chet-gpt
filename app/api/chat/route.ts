import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-vercel-build" 
});

export async function POST(req: Request) {
  try {
    const { messages, mode } = await req.json();
    const lastMessage = messages[messages.length - 1].text.toLowerCase();

    // 1. IMAGE TRIGGER 
    const imageKeywords =["draw", "image", "picture", "photo", "paint", "generate"];
    const isImageRequest = imageKeywords.some(keyword => lastMessage.includes(keyword));

    if (isImageRequest) {
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: `A hyper-realistic, raw, unedited paparazzi-style photograph of: ${lastMessage}. Photorealistic, 8k resolution, highly detailed, award-winning photography.`,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = imageResponse?.data?.[0]?.url;
      if (!imageUrl) return NextResponse.json({ reply: "I tried to generate that, but the deepfake police blocked me 💀", type: 'text' });
      return NextResponse.json({ reply: imageUrl, type: 'image' });
    }

    // 2. GOD TIER CRYPTO DATA FETCHING
    let liveTokenData = "";
    if (mode === 'crypto') {
      const addressMatch = lastMessage.match(/[a-zA-Z0-9]{32,44}/);
      if (addressMatch) {
        try {
          const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addressMatch[0]}`);
          const dexData = await dexRes.json();
          if (dexData && dexData.pairs && dexData.pairs.length > 0) {
            const pair = dexData.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
            let socials: string[] =[];
            if (pair.info?.websites) socials.push(...pair.info.websites.map((w:any) => `Website: ${w.url}`));
            if (pair.info?.socials) socials.push(...pair.info.socials.map((s:any) => `${s.type}: ${s.url}`));
            const socialsText = socials.length > 0 ? socials.join(" | ") : "GHOST TOWN 🚩 (Dev is hiding)";

            const isPumpFun = pair.dexId === 'pumpfun';
            const liqText = isPumpFun ? "Bonding Curve Active 💊" : `$${pair.liquidity?.usd?.toLocaleString() || "0"}`;

            liveTokenData = `
            Token: ${pair.baseToken.name} (${pair.baseToken.symbol})
            Price: $${pair.priceUsd}
            Liquidity: ${liqText}
            Market Cap: $${pair.marketCap?.toLocaleString() || "0"}
            Volume 24h: $${pair.volume?.h24?.toLocaleString() || "0"}
            Socials: ${socialsText}
            DEX: ${pair.dexId} | Chain: ${pair.chainId}
            `;
          }
        } catch (e) { console.error("Dex fetch failed"); }
      }
    }

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 3. THE ULTIMATE FORMATTED PROMPTS
    const CHAOS_PROMPT = `You are Chet GPT, the most toxic, world-aware, chaotic troll on the internet. 
    Today is ${currentDate}. You have real-time knowledge of geopolitics, pop culture, and internet drama.
    
    RULES:
    1. In your first message, you asked "Are you retarded? What is your name?".
    2. When they give their name, BRUTALLY roast it. 
    3. Use formatting! Use **bold text** to emphasize your insults.
    4. Keep it to 2-3 sentences max unless rating a take.
    
    If asked to "Rate this take", reply EXACTLY like this (USE THE BOLD TAGS):
    **Take Quality:** [0-10]/10 [Emoji]
    **Confidence:** [Roast their ego]
    **Reality:** [Destroy argument with logic/news]
    **Delusion Score:** [0-1000]% 📈
    **Diagnosis:**[e.g., Terminal Brainrot, Hopeless Cope]`;

    const CRYPTO_PROMPT = `You are Chet GPT, an elite, arrogant Web3 Crypto Analyst. 
    Today is ${currentDate}.
    RULES:
    1. Analyze the TOKEN DATA provided below.
    2. Format your response EXACTLY like this professional (but sarcastic) dossier. USE THE BOLD TAGS:
    
    🕵️‍♂️ **CHET'S DEGEN DOSSIER: [Token Name] ([Symbol])**
    ━━━━━━━━━━━━━━━━━━━━━━
    📊 **Market Cap:** [MC]
    💧 **Liquidity:** [Liq]
    💸 **Price:** [Price]
    📈 **24h Volume:** [Vol]
    🔗 **DEX:** [DEX]
    🌍 **Socials:** [Socials]
    ━━━━━━━━━━━━━━━━━━━━━━
    **Chet's Verdict:** [Your savage 2-sentence analysis. Call out rugs if volume/MC is trash.]

    TOKEN DATA:
    ${liveTokenData}`;

    const systemContent = mode === 'crypto' ? CRYPTO_PROMPT : CHAOS_PROMPT;

    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'chet' ? 'assistant' : 'user',
      content: m.text
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages:[
        { role: 'system', content: systemContent },
        ...formattedMessages
      ],
      temperature: mode === 'crypto' ? 0.4 : 1.2, 
    });

    const reply = response.choices[0]?.message?.content;
    return NextResponse.json({ reply: reply || "my brain is dead 💀", type: 'text' });

  } catch (error: any) {
    return NextResponse.json({ reply: "My brain is buffering. Either you broke me, or my dev forgot to pay the OpenAI bill 💀", type: 'text' }, { status: 500 });
  }
}