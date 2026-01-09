import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const explainPartialDerivative = async (
  funcStr: string,
  x: number,
  y: number,
  variable: 'x' | 'y'
) => {
  const ai = getAiClient();
  const prompt = `
    Given the function f(x, y) = ${funcStr}.
    Explain the partial derivative with respect to ${variable} at the point (x=${x}, y=${y}).
    1. First, provide the symbolic partial derivative.
    2. Then, calculate the exact value.
    3. Finally, explain what this value represents geometrically (slope of tangent in which direction?) and physically (rate of change).
    Keep it concise and clear for a calculus student.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a world-class calculus tutor. Use Markdown for math formatting.",
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate explanation at this time. Please check your API key.";
  }
};

export const chatWithMathTutor = async (
  history: { role: 'user' | 'model'; text: string }[],
  message: string,
  context: { func: string; x: number; y: number }
) => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are a helpful math tutor specializing in Multivariable Calculus. 
      The student is currently looking at the function f(x, y) = ${context.func} at point (${context.x}, ${context.y}).
      Always relate your answers back to the visualization of cross-sections and slopes.
      Keep responses brief and encouraging.`,
    }
  });

  // Replay history to set context (simplified for this demo)
  // In a real app, we would maintain the chat object state properly
  const chatHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  
  // We can't easily inject history into a fresh chat object in the SDK this way without using history param in create
  // So we will just append context to the prompt for this stateless approach or use the history prop correctly.
  
  try {
      // Stateless single-turn for simplicity in this demo structure, 
      // but ideally we'd persist the chat session object.
      // We will just prompt-engineer the context into a generateContent call for the 'chat' feel if we don't persist the chat object.
      // However, let's try to use generateContent with the full history as context.
      
      const contents = [
          ...chatHistory,
          { role: 'user', parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: contents as any, // Type cast for flexibility
      });
      
      return response.text;

  } catch (error) {
    console.error("Chat Error:", error);
    return "I'm having trouble connecting to the math mainframe. Try again?";
  }
};
