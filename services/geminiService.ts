import { GoogleGenAI, Type, Modality } from "@google/genai";
import { OutfitSuggestion, StyleProfile } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const outfitSuggestionSchema = {
  type: Type.OBJECT,
  properties: {
    outfitName: { type: Type.STRING, description: "A catchy name for the outfit, e.g., 'Urban Explorer'." },
    description: { type: Type.STRING, description: "A brief, stylish description of the outfit's vibe and where to wear it." },
    shirt: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "Type of shirt, e.g., 'Button-down', 'Graphic Tee', 'Polo'." },
        description: { type: Type.STRING, description: "Description of the shirt's style, color, and fabric." },
      },
    },
    pants: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "Type of pants, e.g., 'Chinos', 'Slim-fit Jeans', 'Trousers'." },
        description: { type: Type.STRING, description: "Description of the pants' style, color, and fit." },
      },
    },
    dress: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Type of dress, e.g., 'Sundress', 'Cocktail Dress'." },
          description: { type: Type.STRING, description: "Description of the dress's style, color, and length." },
        },
    },
    shoes: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: "Type of shoes, e.g., 'Leather Loafers', 'White Sneakers', 'Heeled Sandals'." },
        description: { type: Type.STRING, description: "Description of the shoes' style and material." },
      },
      required: ['type', 'description'],
    },
    accessories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Name of the accessory, e.g., 'Silver Watch', 'Aviator Sunglasses'." },
          description: { type: Type.STRING, description: "Description of the accessory's style." },
        },
        required: ['name', 'description'],
      },
    },
    colorPalette: { type: Type.STRING, description: "A descriptive string of 3-4 complementary colors for the outfit, e.g., 'Earthy tones: olive green, beige, and terracotta brown'." }
  },
  required: ['outfitName', 'description', 'shoes', 'accessories', 'colorPalette'],
};

const responseSchema = {
  type: Type.ARRAY,
  items: outfitSuggestionSchema
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const buildPrompt = (basePrompt: string, profile: StyleProfile) => {
  let prompt = basePrompt;
  if (profile.gender) {
    prompt += ` The suggestions should be appropriate for a ${profile.gender}.`;
  }
  if (profile.style || profile.colors) {
    prompt += ` The user's style profile is: Style - ${profile.style || 'not specified'}, Favorite Colors - ${profile.colors || 'not specified'}. Please tailor the suggestions to this profile.`;
  }
  return prompt;
};

export const getSuggestionsForOccasion = async (occasion: string, profile: StyleProfile): Promise<OutfitSuggestion[]> => {
  try {
    let basePrompt = `Based on the occasion "${occasion}", suggest 3 complete, stylish and fashionable outfits.`;
    let prompt = buildPrompt(basePrompt, profile);
    prompt += ` If it's a one-piece outfit like a dress, do not suggest a shirt or pants. Otherwise, suggest a shirt and pants. Always include shoes, 2-3 matching accessories, a complementary color palette, and a name and a brief description for each outfit.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error fetching suggestions for occasion:", error);
    throw new Error("Failed to get suggestions. The model may be unavailable or the request was invalid.");
  }
};

export const getMatchesForItem = async (imageFile: File, profile: StyleProfile): Promise<OutfitSuggestion[]> => {
    const base64Data = await fileToBase64(imageFile);
    return getMatchesForImage(base64Data, imageFile.type, "This is a photo of a clothing item.", profile);
}

export const getMatchesForImage = async (base64Data: string, mimeType: string, userPrompt: string, profile: StyleProfile): Promise<OutfitSuggestion[]> => {
  try {
    const imagePart = {
      inlineData: { data: base64Data, mimeType },
    };
    
    let baseText = `The user has provided an image of a clothing item and a prompt about it: "${userPrompt}". Analyze the item and the user's request. Based on this, suggest 3 complete, stylish, and fashionable outfits that incorporate the item.`;
    let text = buildPrompt(baseText, profile);
    text += ` For each outfit, suggest complementary clothing (e.g., if a shirt is provided, suggest pants, or if it's a dress, don't suggest other main garments), shoes, 2-3 matching accessories, a complementary color palette, and a name and a brief description for each outfit.`;

    const textPart = { text };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error fetching matches for item:", error);
    throw new Error("Failed to get matches. Please try a different image or check the model's availability.");
  }
};

export const getSpeechForText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data received from TTS model.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate speech from text.");
  }
};


export const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};