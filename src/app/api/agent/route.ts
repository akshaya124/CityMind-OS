import { NextResponse } from "next/server";
import { generateGeminiJSON } from "@/lib/gemini";

// Helper to handle text generation for the final briefing
async function generateText(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `Executive Briefing\nLarge pothole detected near school.\nPriority: Critical\nEstimated accident probability: High\nRecommended repair within 24 hours.\nEstimated budget: ₹18,500\nPotential savings: ₹64,000`;
  }
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7 }
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error("Gemini Text Generation failed.");
  return data.candidates[0].content.parts[0].text;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stage, context } = body;

    let result;

    switch (stage) {
      case "scout":
        result = await generateGeminiJSON(
          "You are the Scout AI. Analyze the image and input data to identify the issue. Return ONLY JSON.",
          `Analyze this issue. Title: ${context.title}. Desc: ${context.description}. GPS: ${context.gps}.
          Required JSON schema:
          {
            "issueType": "string",
            "severity": "Low|Medium|High|Critical",
            "confidence": "number 0-100",
            "detectedObjects": ["string"],
            "summary": "string"
          }`,
          context.base64Image
        );
        break;

      case "analyst":
        result = await generateGeminiJSON(
          "You are the Analyst AI. Analyze the Scout's output and geographic context. Return ONLY JSON.",
          `Scout Output: ${JSON.stringify(context.scout)}. GPS: ${context.gps}.
          Analyze community impact. Required JSON schema:
          {
            "nearbyInfrastructure": ["string"],
            "affectedArea": "string",
            "possibleCause": ["string"],
            "evidence": "string",
            "duplicateProbability": "number 0-100"
          }`
        );
        break;

      case "commander":
        result = await generateGeminiJSON(
          "You are the Commander AI. Assess risk and prioritize based on Scout and Analyst reports. Return ONLY JSON.",
          `Scout: ${JSON.stringify(context.scout)}. Analyst: ${JSON.stringify(context.analyst)}.
          Calculate priority. Required JSON schema:
          {
            "priorityScore": "number 0-100",
            "urgency": "string",
            "riskLevel": "string",
            "affectedCitizens": "number estimate",
            "estimatedDamage": "string",
            "why": "string reasoning",
            "alternatives": "string"
          }`
        );
        break;

      case "planner":
        result = await generateGeminiJSON(
          "You are the Planner AI. Synthesize an actionable repair strategy. Return ONLY JSON.",
          `Commander Priority: ${JSON.stringify(context.commander)}. Issue: ${JSON.stringify(context.scout)}.
          Create plan. Required JSON schema:
          {
            "department": "string",
            "estimatedBudget": "number",
            "workersRequired": "number",
            "estimatedRepairTime": "string",
            "actionPlan": "string"
          }`
        );
        break;

      case "guardian":
        result = await generateGeminiJSON(
          "You are the Guardian AI. Establish post-repair monitoring protocols. Return ONLY JSON.",
          `Plan: ${JSON.stringify(context.planner)}. Risk: ${JSON.stringify(context.commander)}.
          Create monitoring protocol. Required JSON schema:
          {
            "followUpSchedule": "string",
            "monitoringPlan": "string",
            "verificationChecklist": ["string"],
            "futureRisk": "string"
          }`
        );
        break;

      case "briefing":
        // This is a plain text generation, not JSON
        const briefingText = await generateText(
          `Explain this issue as if you are briefing the Municipal Commissioner. 
          Use this data:
          Scout: ${JSON.stringify(context.scout)}
          Commander: ${JSON.stringify(context.commander)}
          Planner: ${JSON.stringify(context.planner)}
          
          Format exactly like this example (but use actual estimated values):
          Executive Briefing
          Large pothole detected near school.
          Priority: Critical
          Estimated accident probability: High
          Recommended repair within 24 hours.
          Estimated budget: ₹18,500
          Potential savings: ₹64,000`
        );
        return NextResponse.json({ text: briefingText });

      default:
        throw new Error("Invalid stage");
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
