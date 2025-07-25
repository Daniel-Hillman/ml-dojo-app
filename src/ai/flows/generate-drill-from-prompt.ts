import { z } from "zod";
import { ai } from "../genkit";

const contentSchema = z.union([
  z.object({
    type: z.literal("theory"),
    value: z.string().describe("A short paragraph explaining the core concept."),
  }),
  z.object({
    type: z.literal("code"),
    value: z.string().describe("A code block with one or more blanks represented by '____'."),
    language: z.enum(["python"]),
    solution: z.array(z.string()).describe("An array of strings, where each string is the solution for a blank."),
  }),
  z.object({
    type: z.literal("mcq"),
    value: z.string().describe("The question for the multiple-choice question."),
    choices: z.array(z.string()).describe("An array of strings, representing the choices for the MCQ."),
    answer: z.number().describe("The 0-based index of the correct answer in the 'choices' array."),
  }),
]);

const formSchema = z.object({
  title: z.string().describe("A short, descriptive title for the drill."),
  concept: z.string().describe("The core concept being taught."),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]),
  description: z.string().describe("A brief, one-sentence description of the drill's goal."),
  content: z.array(contentSchema),
});

// This is the new, temporary debug schema
const debugOutputSchema = z.object({
    rawCreativeText: z.string(),
    finalJson: formSchema.optional(),
    error: z.string().optional(),
});


export const generateDrillFromPrompt = ai.defineFlow(
  {
    name: "generateDrillFromPrompt",
    inputSchema: z.object({
      prompt: z.string(),
    }),
    outputSchema: debugOutputSchema, // We will still return the debug info for our test page
  },
  async ({ prompt }) => {
    
    // Step 1: Creative Generation
    const creativeResponse = await ai.generate({
      prompt: `You are an expert AI programming tutor. A user wants to create a practice drill. Based on their prompt, generate the content for a drill.

      User Prompt: "${prompt}"

      Generate the content as plain text. Include a title, concept, difficulty, description, and at least one theory block, one code block, and one MCQ.`,
    });

    const drillText = creativeResponse.text();

    try {
        // Step 2: Structuring & Formatting (in the same flow)
        const refineResponse = await ai.generate({
            prompt: `You are a JSON formatting expert. Take the following text, which describes a practice drill, and convert it into a valid JSON object that follows the provided schema.

            Drill Text:
            ---
            ${drillText}
            ---

            Respond with ONLY the JSON object, nothing else.`,
            format: "json",
        });

        const finalJson = refineResponse.output();
        const validatedJson = formSchema.parse(finalJson);

        return {
            rawCreativeText: drillText,
            finalJson: validatedJson,
        };

    } catch (error: any) {
        return {
            rawCreativeText: drillText, // Still return the raw text for debugging
            error: error.message,
        };
    }
  }
);
