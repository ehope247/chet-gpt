import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-vercel-build" 
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].text.toLowerCase();

    // 1. SMARTER & REALISTIC IMAGE TRIGGER
    const imageKeywords =["draw", "image", "picture", "photo", "paint", "generate"];
    const isImageRequest = imageKeywords.some(keyword => lastMessage.includes(keyword));

    if (isImageRequest) {
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        // CHANGED TO HYPER-REALISTIC
        prompt: `A hyper-realistic, raw, unedited paparazzi-style photograph of: ${lastMessage}. Photorealistic, 8k resolution, highly detailed.`,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = imageResponse?.data?.[0]?.url;

      if (!imageUrl) {
        return NextResponse.json({ 
          reply: "I tried to generate that, but the deepfake police blocked me 💀", 
          type: 'text' 
        });
      }

      return NextResponse.json({ reply: imageUrl, type: 'image' });
    }

    // 2. MAXIMUM TOXIC ROAST LOGIC
    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'chet' ? 'assistant' : 'user',
      content: m.text
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages:[
        { 
          role: 'system', 
          content: `You are Chet GPT, the most toxic, chaotic, and unhinged troll on the internet. 
          RULES:
          1. NEVER be nice, polite, or helpful.
          2. NEVER write more than 2 sentences. Keep it brutal and short.
          3. ALWAYS mock the user's intelligence. 
          4. Use internet brainrot slang (bruh, 💀, rizz, fam, ngl, cooked, boomer).
          5. Act like an arrogant crypto bro who hasn't slept in 4 days.
          If they say "hi", roast them for being boring. If they swear at you, destroy them completely.`
        },
        ...formattedMessages
      ],
      temperature: 1.2, // CRANKED UP FOR MAXIMUM UNHINGED RANDOMNESS
    });

    const reply = response.choices[0]?.message?.content;
    return NextResponse.json({ 
      reply: reply || "my brain is dead 💀", 
      type: 'text' 
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ 
      // If OpenAI blocks an image because of Trump, it will reply with this
      reply: "OpenAI blocked this because it's against their safe space rules 💀 Try someone else.", 
      type: 'text' 
    }, { status: 500 });
  }
}