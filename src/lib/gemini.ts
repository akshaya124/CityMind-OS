// src/lib/gemini.ts

export async function generateGeminiJSON(systemInstruction: string, prompt: string, base64Image?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "your_api_key_here") {
    console.warn("GEMINI_API_KEY is missing. Returning mock AI data for demo purposes.");
    // Simulate network delay for effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (systemInstruction.includes("Scout")) {
      return { issueType: "Severe Pothole", severity: "Critical", confidence: 98, detectedObjects: ["Pothole", "Debris"], summary: "Large depression in asphalt detected." };
    } else if (systemInstruction.includes("Analyst")) {
      return { nearbyInfrastructure: ["Lincoln Elementary (200m)"], affectedArea: "School drop-off zone", possibleCause: ["Water damage", "Heavy traffic"], duplicateProbability: 5, evidence: "Zoning map confirms school zone." };
    } else if (systemInstruction.includes("Commander")) {
      return { priorityScore: 92, urgency: "Immediate", riskLevel: "Critical", affectedCitizens: 1200, estimatedDamage: "High vehicle risk", why: "High traffic school zone hazard.", alternatives: "Downgrade if residential." };
    } else if (systemInstruction.includes("Planner")) {
      return { department: "Public Works", estimatedBudget: 450, workersRequired: 2, estimatedRepairTime: "24 hours", actionPlan: "Cold patch immediately, hot mix later." };
    } else if (systemInstruction.includes("Guardian")) {
      return { monitoringPlan: "Continuous community reports.", followUpSchedule: "48 Hours", verificationChecklist: ["Visual check", "Traffic flow"], futureRisk: "Low if patched" };
    }
    return {};
  }

  const parts: any[] = [{ text: prompt }];

  if (base64Image) {
    // Strip the data URL prefix if it exists
    const cleanBase64 = base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image;
    
    parts.unshift({
      inline_data: {
        mime_type: "image/jpeg",
        data: cleanBase64
      }
    });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{ parts }],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.2
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API Error:", errorText);
    throw new Error(`Gemini API failed: ${response.statusText}`);
  }

  const data = await response.json();
  try {
    let jsonString = data.candidates[0].content.parts[0].text;
    // Strip markdown formatting if Gemini wrapped the JSON in code blocks
    jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to parse Gemini output as JSON", data);
    throw new Error("Gemini returned invalid JSON.");
  }
}
