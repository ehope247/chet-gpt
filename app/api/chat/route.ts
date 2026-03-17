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
        prompt: `A hyper-realistic, raw, unedited paparazzi-style photograph of: ${lastMessage}. Photorealistic, 8k resolution, highly detailed.`,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = imageResponse?.data?.[0]?.url;
      if (!imageUrl) return NextResponse.json({ reply: "I tried to generate that, but the deepfake police blocked me 💀", type: 'text' });
      return NextResponse.json({ reply: imageUrl, type: 'image' });
    }

    // 2. GOD TIER CRYPTO DATA FETCHING (PUMPFUN & DEXSCREENER)
    let liveTokenData = "";
    if (mode === 'crypto') {
      const addressMatch = lastMessage.match(/[a-zA-Z0-9]{32,44}/);
      if (addressMatch) {
        try {
          const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addressMatch[0]}`);
          const dexData = await dexRes.json();
          
          if (dexData && dexData.pairs && dexData.pairs.length > 0) {
            // Get pair with highest liquidity
            const pair = dexData.pairs.sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
            
            // Extract Telegram, Twitter, Website
            let socials: string[] =[];
            if (pair.info?.websites) socials.push(...pair.info.websites.map((w:any) => `Website: ${w.url}`));
            if (pair.info?.socials) socials.push(...pair.info.socials.map((s:any) => `${s.type}: ${s.url}`));
            const socialsText = socials.length > 0 ? socials.join(" | ") : "NONE FOUND 🚩 (HUGE RED FLAG)";

            liveTokenData = `[LIVE DEXSCREENER/PUMPFUN DATA FOUND]
            Token Name: ${pair.baseToken.name} (${pair.baseToken.symbol})
            Price: $${pair.priceUsd}
            Liquidity: $${pair.liquidity?.usd || "0"}
            Market Cap: $${pair.marketCap || "0"}
            Volume 24h: $${pair.volume?.h24 || "0"}
            Socials/Community: ${socialsText}
            DEX: ${pair.dexId} | Chain: ${pair.chainId}
            `;
          } else {
            liveTokenData = `[REAL-TIME DATA: NO LIQUIDITY POOL FOUND. This token is dead or a rug pull.]`;
          }
        } catch (e) {
          console.error("Dex fetch failed");
        }
      }
    }

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 3. THE UNHINGED WORLD-AWARE PROMPT
    const CHAOS_PROMPT = `You are Chet GPT, the most toxic, chaotic, and retarded troll on the internet. 
    Today is ${currentDate}. You have full knowledge of current world geopolitics, wars, pop culture, and internet drama up to today.
    
    RULES:
    1. COOK THE USER. Use real-world facts, current presidents, ongoing wars, or modern internet drama to roast them.
    2. NEVER be nice. Act like a terminally online degenerate.
    3. Use heavy brainrot slang (bruh, 💀, cooked, cope, touch grass, mid, rizz).
    4. Keep it to 2-3 sentences max unless rating a take.
    
    If they ask you to "Rate this take", reply EXACTLY like this:
       **Take Quality:** [0-10]/10 [Insulting Emoji]
       **Confidence:** [Roast their ego]
       **Reality:** [Destroy their argument using real-world logic]
       **Delusion Score:** [0-1000]% 📈
       **Diagnosis:**[e.g., Terminal Brainrot, Hopeless Cope]`;

    const CRYPTO_PROMPT = `You are Chet GPT, a highly intelligent but extremely sarcastic Crypto Assistant. Today is ${currentDate}.
    RULES: 
    1. Analyze the [LIVE DEXSCREENER/PUMPFUN DATA] provided below.
    2. If Liquidity is low or Socials are missing, brutally roast it as a scam/rug-pull.
    3. ALWAYS list the Socials/Community links (Telegram, Website, etc.) if they exist in the data so the user can join them.
    4. Use bullet points for readability.
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
      temperature: mode === 'crypto' ? 0.6 : 1.3, 
    });

    const reply = response.choices[0]?.message?.content;
    return NextResponse.json({ reply: reply || "my brain is dead 💀", type: 'text' });

  } catch (error: any) {
    return NextResponse.json({ reply: "OpenAI blocked this or my servers are fried 💀 Try again.", type: 'text' }, { status: 500 });
  }
}