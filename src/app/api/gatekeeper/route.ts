import { NextResponse } from "next/server";
import { generateGeminiJSON } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description, gps, base64Image } = body;

    const systemPrompt = `
      You are the Gatekeeper AI for a City Infrastructure reporting system.
      Your job is to act as a firewall against spam, irrelevant photos (e.g., selfies, pets), and duplicates.
      
      Analyze the provided image and user description.
      
      Return a strict JSON with this exact schema:
      {
        "isValid": boolean,
        "isDuplicate": boolean,
        "reason": "string (Polite explanation if rejected, or confirmation if accepted)"
      }
      
      RULES:
      1. If the image is explicitly a human face (selfie), animal, or entirely unrelated to civic infrastructure, set isValid: false.
      2. Otherwise, accept it (isValid: true, isDuplicate: false). You must be highly lenient for testing purposes.
    `;

    const userPrompt = `
      Title: ${title}
      Description: ${description}
      Location: ${gps}
    `;

    // Special case for missing API key: simulate validation logic
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Basic mock logic: reject if title contains "selfie" or "test false"
      if (title.toLowerCase().includes("selfie")) {
        return NextResponse.json({ isValid: false, isDuplicate: false, reason: "The image appears to be a person, not infrastructure." });
      }
      if (title.toLowerCase().includes("duplicate")) {
        return NextResponse.json({ isValid: true, isDuplicate: true, reason: "This issue was already reported yesterday at this location." });
      }
      
      return NextResponse.json({ isValid: true, isDuplicate: false, reason: "Valid infrastructure issue detected." });
    }

    const result = await generateGeminiJSON(systemPrompt, userPrompt, base64Image);
    
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Gatekeeper API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
