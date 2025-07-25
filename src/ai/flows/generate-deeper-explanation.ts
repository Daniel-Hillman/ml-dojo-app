import { z } from "zod";
import { ai } from "../genkit";

export const generateDeeperExplanation = ai.defineFlow(
  {
    name: "generateDeeperExplanation",
    inputSchema: z.object({
      concept: z.string(),
      drillContext: z.string(),
    }),
    outputSchema: z.object({
      explanation: z.string(),
    }),
  },
  async ({ concept, drillContext }) => {
    const prompt = `You are an expert AI programming tutor. A student has just completed a drill about "${concept}". The drill was about: "${drillContext}". 

Provide a deeper explanation of the concept. Include:
1.  A clear, concise definition.
2.  A real-world analogy to help with understanding.
3.  A brief mention of common use cases or applications.
4.  A link to a high-quality resource for further learning (e.g., a documentation page, a well-known blog post, or a video).`;

    const response = await ai.generate({ prompt });

    return {
      explanation: response.text,
    };
  }
);
