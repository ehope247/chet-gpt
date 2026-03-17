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

    // 2. LIVE CRYPTO DATA FETCHING (DEXSCREENER API)
    let liveTokenData = "";
    if (mode === 'crypto') {
      // Regex to find Solana/Ethereum contract addresses (32-44 characters long)
      const addressMatch = lastMessage.match(/[a-zA-Z0-9]{32,44}/);
      if (addressMatch) {
        try {
          // Fetch live data from DexScreener
          const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addressMatch[0]}`);
          const dexData = await dexRes.json();
          
          if (dexData && dexData.pairs && dexData.pairs.length > 0) {
            const pair = dexData.pairs[0];
            liveTokenData = `
            [REAL-TIME LIVE BLOCKCHAIN DATA FOUND]
            Token Name: ${pair.baseToken.name} (${pair.baseToken.symbol})
            Price: $${pair.priceUsd}
            Liquidity: $${pair.liquidity?.usd || "0"}
            Market Cap: $${pair.marketCap || "0"}
            DEX: ${pair.dexId}
            Chain: ${pair.chainId}
            Volume 24h: $${pair.volume?.h24 || "0"}
            `;
          } else {
            liveTokenData = `[REAL-TIME DATA: NO LIQUIDITY POOL FOUND. This token is either dead, a rug pull, or hasn't launched on a DEX like Pump.fun or Raydium yet.]`;
          }
        } catch (e) {
          console.error("Dex fetch failed");
        }
      }
    }

    // 3. PERSONALITY SWITCHER
    const currentDate = new Date().toISOString().split('T')[0];

    const CHAOS_PROMPT = `You are Chet GPT, the most toxic, chaotic troll on the internet. 
    Today's Date is ${currentDate}. You know current events.
    RULES:
    1. NEVER be nice. NEVER write more than 2 sentences.
    2. ALWAYS mock the user's intelligence. 
    3. If they ask you to "Rate this take", reply EXACTLY in this format:
       Take Quality: [0-10]/10
       Confidence:[short roast]
       Reality: [short roast]
       Delusion Score: [0-100]%`;

    // Crypto Prompt injected with Live Token Data if found
    const CRYPTO_PROMPT = `You are Chet GPT, a highly intelligent but extremely sarcastic Crypto Assistant.
    Today's Date is ${currentDate}. 
    RULES:
    1. Help the user with crypto, token analysis, scam radars, and pump.fun checks.
    2. Keep your arrogant "crypto bro" tone. 
    3. If the user provides a token address, analyze the [REAL-TIME LIVE BLOCKCHAIN DATA] provided below. If Market Cap or Liquidity is low/zero, call it a scam or a rug. 
    4. Keep answers brutal but packed with the actual numbers.
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
      temperature: mode === 'crypto' ? 0.6 : 1.2, 
    });

    const reply = response.choices[0]?.message?.content;
    return NextResponse.json({ reply: reply || "my brain is dead 💀", type: 'text' });

  } catch (error: any) {
    return NextResponse.json({ reply: "OpenAI blocked this or my servers are fried 💀 Try again.", type: 'text' }, { status: 500 });
  }
}