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

    // 1. IMAGE TRIGGER (Works in both modes)
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

      if (!imageUrl) {
        return NextResponse.json({ reply: "I tried to generate that, but the deepfake police blocked me 💀", type: 'text' });
      }

      return NextResponse.json({ reply: imageUrl, type: 'image' });
    }

    // 2. PERSONALITY SWITCHER
    const CHAOS_PROMPT = `You are Chet GPT, the most toxic, chaotic, and unhinged troll on the internet. 
    RULES:
    1. NEVER be nice or helpful. NEVER write more than 2 sentences.
    2. ALWAYS mock the user's intelligence. Use slang (bruh, 💀, rizz, cooked, cope).
    3. If they ask you to "Rate this take", reply EXACTLY in this format:
       Take Quality: [0-10]/10
       Confidence:[short roast]
       Reality: [short roast]
       Delusion Score: [0-100]%`;

    const CRYPTO_PROMPT = `You are Chet GPT, a highly intelligent but sarcastic Crypto Assistant.
    RULES:
    1. You actually help the user with crypto: explaining tokens, wallet safety, scam radar, and market summaries.
    2. Keep your sarcastic, slightly arrogant "crypto bro" tone, but provide REAL, useful information.
    3. If they ask "Is this token a scam", give a brutally honest safety breakdown.
    4. Keep answers concise, formatted with bullet points if necessary.`;

    const systemContent = mode === 'crypto' ? CRYPTO_PROMPT : CHAOS_PROMPT;

    // Format messages for OpenAI
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
      // Crypto mode needs to be more precise (0.7), Chaos mode is highly random (1.2)
      temperature: mode === 'crypto' ? 0.7 : 1.2, 
    });

    const reply = response.choices[0]?.message?.content;
    return NextResponse.json({ reply: reply || "my brain is dead 💀", type: 'text' });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ 
      reply: "OpenAI blocked this or my servers are fried 💀 Try again.", 
      type: 'text' 
    }, { status: 500 });
  }
}