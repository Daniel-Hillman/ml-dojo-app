'use server';

// Using fetch to call our API routes instead of direct runFlow
import { z } from 'zod';
import { getPrimaryApiKey } from '@/lib/api-keys';

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
    // Try to use personal API keys first, fallback to Genkit
    try {
      const { generateWithPersonalKey } = await import('@/lib/ai-client');
      const response = await generateWithPersonalKey(
        `You are a helpful AI tutor. The user is working on: ${input.drillContext}. They asked: ${input.userQuery}. Provide a helpful hint without giving away the complete answer.`
      );
      return response.text;
    } catch (personalKeyError) {
      console.log('Personal API key failed, falling back to Genkit:', personalKeyError);
      
      // Fallback to original Genkit implementation
      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate(
        `You are a helpful AI tutor. The user is working on: ${input.drillContext}. They asked: ${input.userQuery}. Provide a helpful hint without giving away the complete answer.`
      );
      return response.text;
    }
  } catch (error) {
    console.error(error);
    return 'Sorry, I could not generate a hint at this time. Please check your API key configuration.';
  }
}

export async function getClarification(input: z.infer<typeof GenerateClarificationInputSchema>) {
  try {
    // Try to use personal API keys first, fallback to Genkit
    try {
      const { generateWithPersonalKey } = await import('@/lib/ai-client');
      const response = await generateWithPersonalKey(
        `You are an expert tutor explaining ${input.concept}. The user asked: ${input.userQuestion}. Provide a clear, educational explanation.`
      );
      return response.text;
    } catch (personalKeyError) {
      console.log('Personal API key failed, falling back to Genkit:', personalKeyError);
      
      // Fallback to original Genkit implementation
      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate(
        `You are an expert tutor explaining ${input.concept}. The user asked: ${input.userQuestion}. Provide a clear, educational explanation.`
      );
      return response.text;
    }
  } catch (error) {
    console.error(error);
    return 'Sorry, I could not generate a clarification at this time. Please check your API key configuration.';
  }
}

export async function getCodeCompletion(input: z.infer<typeof GenerateCodeCompletionInputSchema>) {
  try {
    // Try to use personal API keys first, fallback to Genkit
    try {
      const { generateWithPersonalKey } = await import('@/lib/ai-client');
      const response = await generateWithPersonalKey(
        `You are a coding assistant. Help complete this ${input.language} code: ${input.codeContext}. Provide helpful suggestions or explanations.`
      );
      return response.text;
    } catch (personalKeyError) {
      console.log('Personal API key failed, falling back to Genkit:', personalKeyError);
      
      // Fallback to original Genkit implementation
      const { ai } = await import('@/ai/genkit');
      const response = await ai.generate(
        `You are a coding assistant. Help complete this ${input.language} code: ${input.codeContext}. Provide helpful suggestions or explanations.`
      );
      return response.text;
    }
  } catch (error) {
    console.error(error);
    return 'Sorry, I could not generate a code completion at this time. Please check your API key configuration.';
  }
}

const GenerateDynamicDrillInputSchema = z.object({
  drill: z.any(),
  workoutMode: z.enum(["Crawl", "Walk", "Run"]),
});

// Simple in-memory cache for generated drill content
const drillContentCache = new Map<string, any[]>();

function getCacheKey(drillId: string, workoutMode: string): string {
  return `${drillId}-${workoutMode}`;
}

// Content validation functions
function validateDrillContent(content: any[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(content)) {
    errors.push("Content must be an array");
    return { isValid: false, errors };
  }
  
  content.forEach((item, index) => {
    // Validate basic structure
    if (!item.type || !item.value) {
      errors.push(`Item ${index}: Missing required fields 'type' or 'value'`);
      return;
    }
    
    // Validate type
    if (!['theory', 'code', 'mcq'].includes(item.type)) {
      errors.push(`Item ${index}: Invalid type '${item.type}'`);
    }
    
    // Validate code blocks
    if (item.type === 'code') {
      const blankCount = (item.value.match(/____/g) || []).length;
      
      if (blankCount === 0) {
        errors.push(`Item ${index}: Code block has no blanks`);
      }
      
      if (item.solution) {
        if (!Array.isArray(item.solution)) {
          errors.push(`Item ${index}: Solution must be an array`);
        } else if (item.solution.length !== blankCount) {
          errors.push(`Item ${index}: Solution array length (${item.solution.length}) doesn't match blank count (${blankCount})`);
        }
      }
    }
    
    // Validate MCQ blocks
    if (item.type === 'mcq') {
      if (!item.choices || !Array.isArray(item.choices)) {
        errors.push(`Item ${index}: MCQ must have choices array`);
      } else if (item.choices.length < 2) {
        errors.push(`Item ${index}: MCQ must have at least 2 choices`);
      }
      
      if (typeof item.answer !== 'number') {
        errors.push(`Item ${index}: MCQ answer must be a number`);
      } else if (item.choices && (item.answer < 0 || item.answer >= item.choices.length)) {
        errors.push(`Item ${index}: MCQ answer index out of range`);
      }
    }
    
    // Validate content length
    if (typeof item.value !== 'string' || item.value.trim().length === 0) {
      errors.push(`Item ${index}: Value must be a non-empty string`);
    }
  });
  
  return { isValid: errors.length === 0, errors };
}

function fixDrillContent(content: any[]): any[] {
  return content.map(item => {
    const fixedItem = { ...item };
    
    // Fix code blocks
    if (item.type === 'code') {
      const blankCount = (item.value.match(/____/g) || []).length;
      
      // Ensure solution array exists and matches blank count
      if (!fixedItem.solution || !Array.isArray(fixedItem.solution)) {
        fixedItem.solution = Array(blankCount).fill("");
      } else if (fixedItem.solution.length !== blankCount) {
        if (fixedItem.solution.length < blankCount) {
          // Pad with empty strings
          fixedItem.solution = [...fixedItem.solution, ...Array(blankCount - fixedItem.solution.length).fill("")];
        } else {
          // Trim excess solutions
          fixedItem.solution = fixedItem.solution.slice(0, blankCount);
        }
      }
      
      // Set blanks count
      fixedItem.blanks = blankCount;
      
      // Ensure language is set
      if (!fixedItem.language) {
        fixedItem.language = 'python';
      }
    }
    
    // Fix MCQ blocks
    if (item.type === 'mcq') {
      // Ensure choices array exists
      if (!fixedItem.choices || !Array.isArray(fixedItem.choices)) {
        fixedItem.choices = ["Option A", "Option B"];
      }
      
      // Ensure answer is valid
      if (typeof fixedItem.answer !== 'number' || fixedItem.answer < 0 || fixedItem.answer >= fixedItem.choices.length) {
        fixedItem.answer = 0;
      }
    }
    
    return fixedItem;
  });
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export async function generateDynamicDrill(input: z.infer<typeof GenerateDynamicDrillInputSchema>) {
  try {
    
    const originalContent = input.drill.drill_content;
    
    // For Walk mode, ensure we have proper blanks - use original content but validate it has blanks
    if (input.workoutMode === "Walk") {
      // Check if original content has blanks, if not, create some
      const codeContent = originalContent.find(item => item.type === 'code');
      if (codeContent && !codeContent.value.includes('____')) {
        console.log('Walk mode: Original has no blanks, generating some...');
        // Continue to AI generation to create moderate blanks
      } else {
        return { drillContent: originalContent };
      }
    }
    
    // Check cache first
    const cacheKey = getCacheKey(input.drill.id, input.workoutMode);
    const cachedContent = drillContentCache.get(cacheKey);
    if (cachedContent) {
      console.log(`Using cached content for ${input.workoutMode} mode`);
      return { drillContent: cachedContent };
    }
    
    let prompt;
    switch (input.workoutMode) {
      case "Crawl":
        prompt = `You are an expert AI programming tutor. Transform this drill for BEGINNER learners who need to focus on the most essential concepts only.

ORIGINAL DRILL CONTENT:
${JSON.stringify(originalContent, null, 2)}

CRAWL MODE TRANSFORMATION RULES (Like Mimo/Khan Academy for beginners):

For CODE blocks:
1. MINIMIZE blanks: Only blank out the MOST IMPORTANT concepts (1-2 key blanks max)
2. Focus on UNIVERSAL, PREDICTABLE blanks:
   - Variable names that follow clear patterns
   - Standard function names (print, len, range, etc.)
   - Common operators (+, -, *, /, ==, etc.)
   - Standard keywords (if, for, while, def, return)
   - Logical values (True, False, None)
3. AVOID blanking:
   - File paths or URLs (like 'data.csv', 'http://...')
   - Arbitrary strings that could be anything
   - Complex expressions that have multiple valid answers
   - Library-specific parameters that vary by use case
4. Examples of GOOD blanks:
   - "name = ____" → solution: "Alice" (clear context)
   - "for i in ____:" → solution: "range(10)" (standard pattern)
   - "if x ____ 0:" → solution: ">" (clear comparison)
5. Examples of BAD blanks to avoid:
   - "pd.read_csv('____')" → Don't blank filenames
   - "requests.get('____')" → Don't blank URLs
   - "model.fit(____)" → Don't blank complex parameters

For MCQ blocks:
1. Make questions very straightforward
2. Focus on basic syntax and fundamental concepts
3. Provide obvious correct answers

CRITICAL REQUIREMENTS:
- FEWER blanks than original (focus on essentials only)
- Only blank things with clear, universal answers
- Avoid ambiguous or context-dependent blanks
- Maximum guidance and scaffolding

Return ONLY the JSON array of modified drill content. No explanations, no markdown formatting.`;
        break;
        
      case "Run":
      case "Walk":
        prompt = `You are an expert AI programming tutor. Transform this drill for INTERMEDIATE learners who need a balanced challenge.

ORIGINAL DRILL CONTENT:
${JSON.stringify(originalContent, null, 2)}

WALK MODE TRANSFORMATION RULES (Like W3Schools/standard tutorials):

For CODE blocks:
1. MODERATE blanks: Create a fair amount of blanks (50-60% of key elements)
2. Focus on important concepts without overwhelming:
   - Blank key variable names and values
   - Blank important function calls
   - Blank essential operators and keywords
   - Keep some scaffolding visible for guidance
3. Examples:
   - "name = ____" (blank the value)
   - "____ = Dog(____)" (blank variable and parameter)
   - "for ____ in range(10):" (blank iterator)
   - "if x ____ 0:" (blank operator)
4. Solution array should have clear, standard answers

For MCQ blocks:
1. Standard difficulty questions
2. Test understanding of core concepts
3. Mix of syntax and conceptual questions

CRITICAL REQUIREMENTS:
- MODERATE number of blanks (not too easy, not too hard)
- Focus on learning key programming concepts
- Solutions should be clear and educational
- Maintain good learning progression

Return ONLY the JSON array of modified drill content. No explanations, no markdown formatting.`;
        break;
        
      case "Run":
        prompt = `You are an expert AI programming tutor. Transform this drill for EXPERT learners who want maximum challenge.

ORIGINAL DRILL CONTENT:
${JSON.stringify(originalContent, null, 2)}

RUN MODE TRANSFORMATION RULES (Like advanced coding challenges):

For CODE blocks:
1. MAXIMIZE blanks: Blank out MOST of the code (80-90% should be blanks)
2. Create comprehensive challenges but keep solutions REALISTIC:
   - Blank entire variable assignments: "____" 
   - Blank complete function calls: "____"
   - Blank entire expressions: "____"
   - Blank control structures: "____"
3. STILL avoid impossible blanks:
   - Don't blank arbitrary filenames unless context makes it obvious
   - Don't blank URLs or paths without clear context
   - For data files, provide hints like "____" with solution "data.csv" only if it's the standard name
4. Allow multiple valid answers where appropriate:
   - Variable names can vary: "data", "df", "dataset" all acceptable
   - File extensions should be consistent with context
5. Examples:
   - "____ = ____" (blank both variable and value)
   - "for ____ in ____:" (blank iterator and iterable)
   - "df = pd.read_csv('____')" → only if filename is contextually obvious
6. Solution array should contain the MOST COMMON/STANDARD answers

For MCQ blocks:
1. Add complex scenarios and edge cases
2. Test deep understanding and best practices
3. Include tricky, advanced concepts

CRITICAL REQUIREMENTS:
- MANY MORE blanks than original (maximum challenge)
- Solutions should be realistic and achievable
- Allow for common variations in answers
- Test expertise while remaining fair

Return ONLY the JSON array of modified drill content. No explanations, no markdown formatting.`;
        break;
    }

    console.log(`Generating ${input.workoutMode} mode content with enhanced prompts`);
    
    // Use retry logic for AI generation with personal API keys
    const response = await retryWithBackoff(async () => {
      try {
        const { generateWithPersonalKey } = await import('@/lib/ai-client');
        return await generateWithPersonalKey(prompt);
      } catch (personalKeyError) {
        console.log('Personal API key failed, falling back to Genkit:', personalKeyError);
        
        // Fallback to original Genkit implementation
        const { ai } = await import('@/ai/genkit');
        return await ai.generate(prompt);
      }
    }, 3, 1000);
    
    // Enhanced JSON cleaning and validation
    let jsonText = response.text.trim();
    
    // Remove various markdown formatting
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing text that isn't JSON
    const jsonStart = jsonText.indexOf('[');
    const jsonEnd = jsonText.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1);
    }
    
    try {
      const modifiedContent = JSON.parse(jsonText);
      
      // Validate the generated content
      const validation = validateDrillContent(modifiedContent);
      
      if (!validation.isValid) {
        console.warn("Generated content has validation errors:", validation.errors);
        console.log("Attempting to fix content automatically...");
        
        // Try to fix the content automatically
        const fixedContent = fixDrillContent(modifiedContent);
        
        // Validate the fixed content
        const fixedValidation = validateDrillContent(fixedContent);
        
        if (fixedValidation.isValid) {
          console.log("Successfully fixed content validation issues");
          return { drillContent: fixedContent };
        } else {
          console.error("Could not fix content validation issues:", fixedValidation.errors);
          throw new Error("Generated content is invalid and could not be fixed");
        }
      }
      
      console.log(`Successfully generated and validated ${input.workoutMode} mode content`);
      
      // Cache the generated content
      drillContentCache.set(cacheKey, modifiedContent);
      
      return { drillContent: modifiedContent };
      
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw response:", jsonText);
      console.error("Full AI response:", response.text);
      
      // Enhanced fallback: try to extract partial content or return original
      console.log(`Falling back to original content for ${input.workoutMode} mode`);
      return { drillContent: originalContent };
    }
    
  } catch (error) {
    console.error("Error generating dynamic drill:", error);
    // Fallback to original content if generation fails
    console.log(`Error fallback: returning original content for ${input.workoutMode} mode`);
    return { drillContent: input.drill.drill_content };
  }
}

export async function generateDrillAction(prompt: string) {
    try {
        // Step 1: Creative Generation with personal API keys
        let creativeResponse;
        try {
          const { generateWithPersonalKey } = await import('@/lib/ai-client');
          creativeResponse = await generateWithPersonalKey(
            `You are an expert AI programming tutor. A user wants to create a practice drill. Based on their prompt, generate the content for a drill.

            User Prompt: "${prompt}"

            Generate the content as plain text. Include a title, concept, difficulty, description, and at least one theory block, one code block, and one MCQ.`
          );
        } catch (personalKeyError) {
          console.log('Personal API key failed, falling back to Genkit:', personalKeyError);
          
          // Fallback to original Genkit implementation
          const { ai } = await import('@/ai/genkit');
          creativeResponse = await ai.generate(
            `You are an expert AI programming tutor. A user wants to create a practice drill. Based on their prompt, generate the content for a drill.

            User Prompt: "${prompt}"

            Generate the content as plain text. Include a title, concept, difficulty, description, and at least one theory block, one code block, and one MCQ.`
          );
        }

        const drillText = creativeResponse.text;

        try {
          // Step 2: Structuring & Formatting with personal API keys
          let refineResponse;
          try {
            const { generateWithPersonalKey } = await import('@/lib/ai-client');
            refineResponse = await generateWithPersonalKey(
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
          } catch (personalKeyError) {
            console.log('Personal API key failed for refine step, falling back to Genkit:', personalKeyError);
            
            // Fallback to original Genkit implementation
            const { ai } = await import('@/ai/genkit');
            refineResponse = await ai.generate(
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
          }

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
