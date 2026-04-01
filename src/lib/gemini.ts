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
    
    The image prompt should be descriptive and visual, e.g., "A cozy minimalist living room with beige aesthetic, soft sunlight, high resolution".
    
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
  // Fallback to Pollinations.ai (Totally free, no key needed)
  // We use the /p/ endpoint which is more stable than the image. subdomain
  // We also truncate the prompt to avoid URL length issues
  const truncatedPrompt = prompt.substring(0, 500);
  const encodedPrompt = encodeURIComponent(truncatedPrompt);
  const width = 1000;
  const height = 1500; 
  const seed = Math.floor(Math.random() * 1000000);
  
  // Use pollinations.ai/p/ which returns the image directly
  const imageUrl = `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
  
  console.log(`Generated Pollinations Image URL: ${imageUrl}`);
  return imageUrl;
}
