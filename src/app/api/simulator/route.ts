import { NextResponse } from "next/server";
import { generateGeminiJSON } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, aiSummary, timeframe } = body; // timeframe e.g., '1 Week', '1 Month', '6 Months'

    const systemPrompt = `
      You are the Impact Simulator module for CityMind OS.
      Your job is to predict the cascading catastrophic consequences of ignoring civic infrastructure issues.
      
      The user will provide the issue title, the current AI summary, and a timeframe (e.g., 6 Months).
      You must predict what happens if this issue is completely ignored for that timeframe.
      
      Return a structured JSON with this exact schema:
      {
        "costMultiplier": number (e.g. 2.5 means 2.5x more expensive to fix),
        "riskLevel": "Moderate" | "High" | "Critical",
        "predictedComplaints": number,
        "narrativeSummary": "string (A dramatic 2-sentence prediction of the fallout)"
      }
    `;

    const userPrompt = `
      Issue: ${title}
      Current State: ${aiSummary}
      Timeframe of inaction: ${timeframe}
    `;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mock logic for demo purposes
      let multiplier = 1.2;
      let risk = "Moderate";
      let complaints = 15;
      let narrative = "Minor inconveniences continue. Small increase in public frustration.";
      
      if (timeframe === "1 Month") {
        multiplier = 3.5;
        risk = "High";
        complaints = 142;
        narrative = "The issue has expanded significantly. Local businesses are reporting disruptions and media has picked up the story.";
      } else if (timeframe === "6 Months") {
        multiplier = 12.8;
        risk = "Critical";
        complaints = 890;
        narrative = "Catastrophic infrastructure failure. Surrounding systems are now compromised, leading to severe public safety hazards and massive budget overruns.";
      }

      return NextResponse.json({
        costMultiplier: multiplier,
        riskLevel: risk,
        predictedComplaints: complaints,
        narrativeSummary: narrative
      });
    }

    const result = await generateGeminiJSON(systemPrompt, userPrompt);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Simulator API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
