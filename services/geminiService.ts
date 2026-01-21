
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getProfessionalDescription = async (basicText: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Transform this basic invoice line item description into a professional service entry. Keep it concise (max 15 words). Basic text: "${basicText}"`,
    });
    return response.text?.trim() || basicText;
  } catch (error) {
    console.error("Gemini Error:", error);
    return basicText;
  }
};

export const generateInvoiceNotes = async (clientName: string, total: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short professional thank you note for an invoice to ${clientName} for a total of ${total}. Mention that payment is appreciated by the due date. Keep it warm but professional.`,
    });
    return response.text?.trim() || `Thank you for choosing INTECH PC VENTURES. We appreciate your business.`;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Thank you for choosing INTECH PC VENTURES.`;
  }
};
