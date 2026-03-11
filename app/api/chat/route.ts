import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].text.toLowerCase();

    // 1. SMARTER IMAGE TRIGGER (Catches: draw, image, picture, photo, paint)
    const imageKeywords = ["draw", "image", "picture", "photo", "paint", "generate"];
    const isImageRequest = imageKeywords.some(keyword => lastMessage.includes(keyword));

    if (isImageRequest) {
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: `A chaotic, meme-style, dramatic and funny interpretation of: ${lastMessage}. High quality, cinematic lighting.`,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = imageResponse?.data?.[0]?.url;

      if (!imageUrl) {
        return NextResponse.json({ 
          reply: "I tried to draw that, but my hands were shaking 💀", 
          type: 'text' 
        });
      }

      return NextResponse.json({ reply: imageUrl, type: 'image' });
    }

    // 2. TEXT ROAST LOGIC (If no image keywords were found)
    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'chet' ? 'assistant' : 'user',
      content: m.text
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: "You are Chet GPT, the world's most chaotic roast bot. You have access to real-time data. If someone asks for a picture and the code triggers this text, mock them for being too poor to afford the image generator. Otherwise, be unhinged and sarcastic." 
        },
        ...formattedMessages
      ],
    });

    const reply = response.choices[0]?.message?.content;
    return NextResponse.json({ 
      reply: reply || "my brain is dead 💀", 
      type: 'text' 
    });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ 
      reply: "API Error: " + (error.message || "Unknown error"), 
      type: 'text' 
    }, { status: 500 });
  }
}