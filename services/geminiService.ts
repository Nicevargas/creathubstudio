
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('Variável de ambiente VITE_GEMINI_API_KEY é obrigatória');
}
const ai = new GoogleGenAI({ apiKey });

// Using gemini-3-flash-preview for basic text tasks as per coding guidelines
export const generateNewsSummary = async (url: string, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a marketing assistant. I have a news article URL: ${url}. The category is ${category}. 
      Please generate a short, engaging summary of what this article might be about based on the URL keywords, 
      and suggest a social media post caption for it. Format it clearly.`,
    });
    return response.text || "Conteúdo não gerado.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao gerar resumo. Verifique sua API Key.";
  }
};

// Using gemini-3-flash-preview for basic text tasks as per coding guidelines
export const generatePostCaption = async (topic: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a creative and engaging social media post caption about: ${topic}. Include emojis and hashtags.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao gerar legenda.";
  }
};
