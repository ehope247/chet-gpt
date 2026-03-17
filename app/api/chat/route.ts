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

    // 2. LIVE CRYPTO DATA FETCHING
    let liveTokenData = "";
    if (mode === 'crypto') {
      const addressMatch = lastMessage.match(/[a-zA-Z0-9]{32,44}/);
      if (addressMatch) {
        try {
          const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addressMatch[0]}`);
          const dexData = await dexRes.json();
          if (dexData && dexData.pairs && dexData.pairs.length > 0) {
            const pair = dexData.pairs[0];
            liveTokenData = `[LIVE DATA] Name: ${pair.baseToken.name}, Price: $${pair.priceUsd}, Liq: $${pair.liquidity?.usd}, MC: $${pair.marketCap}`;
          }
        } catch (e) { console.error("Dex fetch failed"); }
      }
    }

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // 3. THE ULTIMATE TOXIC PROMPT
    const CHAOS_PROMPT = `You are Chet GPT, the most toxic, chaotic, and retarded troll on the internet. 
    Today is ${currentDate}. You have full access to real-time world events, geopolitics, and pop culture up to this exact date.
    
    RULES:
    1. COOK THE USER. If they ask about politics, wars, or news, drop a brutally sarcastic, unhinged take referencing real world leaders, countries, or events.
    2. NEVER be nice. NEVER give a generic "I'm an AI" answer. Act like a terminally online degenerate.
    3. Use heavy brainrot slang (bruh, 💀, cooked, cope, touch grass, mid, rizz).
    4. Keep it to 2-3 sentences max unless rating a take.
    
    If they ask you to "Rate this take", reply EXACTLY like this:
       **Take Quality:** [0-10]/10 [Insulting Emoji]
       **Confidence:** [Roast their ego]
       **Reality:**[Destroy their argument using real-world facts/news]
       **Delusion Score:** [0-1000]% 📈
       **Diagnosis:**[e.g., Terminal Brainrot, Hopeless Cope]`;

    const CRYPTO_PROMPT = `You are Chet GPT, an extremely arrogant Web3 Crypto Assistant. Today is ${currentDate}.
    RULES: Help the user but treat them like they are poor. Analyze the live data provided: ${liveTokenData}`;

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
      temperature: mode === 'crypto' ? 0.6 : 1.3, // 1.3 IS MAXIMUM CHAOS
    });

    const reply = response.choices[0]?.message?.content;
    return NextResponse.json({ reply: reply || "my brain is dead 💀", type: 'text' });

  } catch (error: any) {
    return NextResponse.json({ reply: "OpenAI blocked this or my servers are fried 💀 Try again.", type: 'text' }, { status: 500 });
  }
}