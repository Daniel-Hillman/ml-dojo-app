import { z } from "zod";
import { ai } from "../genkit";
import { Drill, DrillContent } from "@/app/(app)/drills/page";

export const generateDynamicDrill = ai.defineFlow(
  {
    name: "generateDynamicDrill",
    inputSchema: z.object({
      drill: z.any(), // Using any for now, but should be a Zod schema for Drill
      workoutMode: z.enum(["Crawl", "Walk", "Run"]),
    }),
    outputSchema: z.object({
      drillContent: z.any(), // Using any for now, but should be a Zod schema for DrillContent[]
    }),
  },
  async ({ drill, workoutMode }) => {
    const originalContent = drill.drill_content;
    
    let prompt;
    switch (workoutMode) {
      case "Crawl":
        prompt = `You are an expert AI programming tutor. Here is a code drill:

${JSON.stringify(originalContent, null, 2)}

This is the "Crawl" mode. Modify the drill content to have many small, simple blanks. The goal is to guide the user through the code step-by-step.`;
        break;
      case "Walk":
        prompt = `You are an expert AI programming tutor. Here is a code drill:

${JSON.stringify(originalContent, null, 2)}

This is the "Walk" mode. Modify the drill content to have blanks for key functions and methods. The goal is to test the user's recall of the most important parts of the code.`;
        break;
      case "Run":
        prompt = `You are an expert AI programming tutor. Here is a code drill:

${JSON.stringify(originalContent, null, 2)}

This is the "Run" mode. Modify the drill content to have a single, large blank for the entire solution. The goal is to challenge the user to write the solution from scratch.`;
        break;
    }

    const response = await ai.generate({ prompt });
    
    // In a real application, you would parse the response.text to create the new drill content.
    // For now, we'll just return the original content.
    return {
      drillContent: originalContent,
    };
  }
);
