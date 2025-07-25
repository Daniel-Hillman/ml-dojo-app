'use server';

// Using fetch to call our API routes instead of direct runFlow
import { z } from 'zod';

// We define the input schemas here to ensure type safety
const GenerateHintInputSchema = z.object({
  drillContext: z.string(),
  userQuery: z.string(),
});

const GenerateClarificationInputSchema = z.object({
  concept: z.string(),
  userQuestion: z.string(),
});

const GenerateCodeCompletionInputSchema = z.object({
  codeContext: z.string(),
  language: z.string(),
});

// The actions now use runFlow to call the Genkit API endpoint
export async function getHint(input: z.infer<typeof GenerateHintInputSchema>) {
  try {
    // Import the AI instance directly since we're in a server action
    const { ai } = await import('@/ai/genkit');
    
    const response = await ai.generate(
      `You are a helpful AI tutor. The user is working on: ${input.drillContext}. They asked: ${input.userQuery}. Provide a helpful hint without giving away the complete answer.`
    );
    
    return response.text;
  } catch (error) {
    console.error(error);
    return 'Sorry, I could not generate a hint at this time.';
  }
}

export async function getClarification(input: z.infer<typeof GenerateClarificationInputSchema>) {
  try {
    // Import the AI instance directly since we're in a server action
    const { ai } = await import('@/ai/genkit');
    
    const response = await ai.generate(
      `You are an expert tutor explaining ${input.concept}. The user asked: ${input.userQuestion}. Provide a clear, educational explanation.`
    );
    
    return response.text;
  } catch (error) {
    console.error(error);
    return 'Sorry, I could not generate a clarification at this time.';
  }
}

export async function getCodeCompletion(input: z.infer<typeof GenerateCodeCompletionInputSchema>) {
  try {
    // Import the AI instance directly since we're in a server action
    const { ai } = await import('@/ai/genkit');
    
    const response = await ai.generate(
      `You are a coding assistant. Help complete this ${input.language} code: ${input.codeContext}. Provide helpful suggestions or explanations.`
    );
    
    return response.text;
  } catch (error) {
    console.error(error);
    return 'Sorry, I could not generate a code completion at this time.';
  }
}

export async function generateDrillAction(prompt: string) {
    try {
        // Import the AI instance directly since we're in a server action
        const { ai } = await import('@/ai/genkit');
        
        // Step 1: Creative Generation
        const creativeResponse = await ai.generate(
          `You are an expert AI programming tutor. A user wants to create a practice drill. Based on their prompt, generate the content for a drill.

          User Prompt: "${prompt}"

          Generate the content as plain text. Include a title, concept, difficulty, description, and at least one theory block, one code block, and one MCQ.`
        );

        const drillText = creativeResponse.text;

        try {
          // Step 2: Structuring & Formatting
          const refineResponse = await ai.generate(
            `You are a JSON formatting expert. Take the following drill content and convert it into a valid JSON object.

            IMPORTANT: Return ONLY the JSON object with no markdown formatting, no code blocks, no explanations.

            Required JSON structure:
            {
              "title": "string",
              "concept": "string", 
              "difficulty": "Beginner" | "Intermediate" | "Advanced",
              "description": "string",
              "content": [
                {
                  "type": "theory",
                  "value": "string"
                },
                {
                  "type": "code",
                  "value": "string with ____ for blanks",
                  "language": "python",
                  "solution": ["array", "of", "solutions"]
                },
                {
                  "type": "mcq",
                  "value": "question string",
                  "choices": ["choice1", "choice2", "choice3"],
                  "answer": 0
                }
              ]
            }

            Extract the information from this drill content:
            ---
            ${drillText}
            ---

            Return the JSON object directly without any formatting:`
          );

          // Clean the response text to extract JSON
          let jsonText = refineResponse.text.trim();
          
          // Remove markdown code blocks if present
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          console.log('Cleaned JSON text:', jsonText);
          const finalJson = JSON.parse(jsonText);
          return finalJson;

        } catch (error: any) {
          console.error("Error parsing AI response:", error);
          console.error("Raw creative text:", drillText);
          return { error: 'Failed to generate drill. The AI returned invalid data.' };
        }

    } catch (error: any) {
        console.error("Error calling generateDrillAction:", error);
        return { error: 'Failed to generate drill. Please check the server logs.' };
    }
}
