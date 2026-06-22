import { GoogleGenAI, Type } from "@google/genai";

function getAI() {
  let apiKey = '';
  
  // In Vite, process.env.GEMINI_API_KEY is replaced at build time by the define config
  // We also check for VITE_GEMINI_API_KEY as a fallback
  apiKey = (process.env.GEMINI_API_KEY as string) || 
           (import.meta as any).env?.VITE_GEMINI_API_KEY || 
           '';

  // Fallback for local development or if define failed
  if (!apiKey && typeof window !== 'undefined') {
    const customKey = localStorage.getItem('custom_gemini_api_key');
    if (customKey) apiKey = customKey;
  }

  if (!apiKey) {
    console.warn("Gemini API Key not found. Please ensure GEMINI_API_KEY is set in the environment.");
  }

  return new GoogleGenAI({ apiKey });
}

export async function researchKeywords(niche: string): Promise<string[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Research 15 trending Pinterest keywords for the niche: "${niche}". 
    Focus on high-volume, viral search terms. 
    Return as a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  
  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse keywords", e);
    return [];
  }
}

export async function generatePinIdeas(
  niche: string, 
  ideas: string, 
  keywords: string[], 
  numPins: number
): Promise<{ title: string; description: string; imagePrompt: string }[]> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate ${numPins} unique, viral Pinterest pin variations for the niche: "${niche}".
    User's base ideas: "${ideas}"
    Trending keywords to include: ${keywords.join(", ")}
    
    For each pin, provide:
    1. A catchy title (max 100 chars)
    2. A viral description (100-200 chars) optimized with keywords.
    3. A detailed image generation prompt.
    
    The style for images must be "Nano Banana" aesthetic: very sticky, viscous, organic, bulging, hyper-realistic textures, vibrant colors, and 3D depth. 
    The image prompt should be descriptive and visual, e.g., "A sticky, bulging minimalist living room with viscous beige textures, soft sunlight, organic shapes, high resolution".
    
    Return as a JSON array of objects.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["title", "description", "imagePrompt"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse pin ideas", e);
    return [];
  }
}

export async function generatePinImage(prompt: string): Promise<string> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: `Generate a high-quality vertical image for Pinterest. 
            Style: Nano Banana, sticky and bulging, organic textures.
            Details: ${prompt}`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "1K"
        },
      },
    });

    const candidate = response.candidates?.[0];
    if (candidate) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const base64Data = part.inlineData.data;
          return `data:image/png;base64,${base64Data}`;
        }
      }
    }
    
    throw new Error("No image data found in Gemini response");
  } catch (error) {
    console.error("Gemini image generation failed, falling back to Pollinations", error);
    
    // Fallback to Pollinations.ai if Gemini fails
    const truncatedPrompt = `sticky bulging Nano Banana style ${prompt}`.substring(0, 500);
    const encodedPrompt = encodeURIComponent(truncatedPrompt);
    const width = 1000;
    const height = 1500; 
    const seed = Math.floor(Math.random() * 1000000);
    
    return `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  }
}
