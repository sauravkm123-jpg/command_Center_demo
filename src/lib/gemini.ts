import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AgentReport {
  id: string; // The ID of the agent (e.g., 'crowd', 'anomaly', 'security')
  status: 'idle' | 'monitoring' | 'alert' | 'warning';
  message: string;
  actionTaken: string | null;
  confidence: number;
}

export async function analyzeFrame(base64Image: string): Promise<AgentReport[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
        {
          text: `You are an AI Multi-Agent Event Management System analyzing CCTV/live video footage for a stadium.
          
Analyze the provided frame and produce a report from the perspective of three distinct agents:

1. 'crowd': Detects bottlenecks at Stadium ticket gates or entry/exit points. If a bottleneck is detected, alert authorities and suggest alternate routes or free counters.
2. 'anomaly': Checks for anomalous crowd behavior (e.g., aggressive behavior, someone standing dangerously close to balconies/edges, unusual activities). Send alerts to security guards if detected.
3. 'security': Detects unattended baggage or suspicious objects in/around the stadium. Alert security personnel if detected.

For each agent, evaluate the scene. If the specific scenario for an agent is NOT visible in the frame, report a 'monitoring' status with a generic monitoring message like "Monitoring normal". 

If an issue IS detected, set status to 'alert' or 'warning', specify the message, and detail the actionTaken.
`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: "Agent ID: 'crowd', 'anomaly', or 'security'" },
              status: { type: Type.STRING, description: "Status: 'idle', 'monitoring', 'warning', or 'alert'" },
              message: { type: Type.STRING, description: "Observation details." },
              actionTaken: { type: Type.STRING, description: "Action taken, or null if none." },
              confidence: { type: Type.NUMBER, description: "Confidence score from 0 to 100." }
            },
            required: ["id", "status", "message", "actionTaken", "confidence"]
          }
        }
      }
    });

    if (response.text) {
      try {
        const data = JSON.parse(response.text) as AgentReport[];
        return data;
      } catch (e) {
        console.error("Failed to parse Gemini JSON response", e);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
