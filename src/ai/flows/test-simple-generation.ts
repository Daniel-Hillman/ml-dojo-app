import { z } from "zod";
import { ai } from "../genkit";

export const testSimpleGeneration = ai.defineFlow(
  {
    name: "testSimpleGeneration",
    inputSchema: z.object({
      question: z.string(),
    }),
    outputSchema: z.object({
      answer: z.string(),
    }),
  },
  async ({ question }) => {
    const response = await ai.generate({
      prompt: `You are a helpful AI assistant. Answer the following question clearly and concisely: ${question}`,
    });

    return {
      answer: response.text(),
    };
  }
);