import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const body = await request.json();
    const { slug } = await params;

    console.log(`API call to ${slug} with body:`, body);
    console.log('Environment API key:', process.env.GOOGLE_API_KEY?.substring(0, 10) + '...');

    switch (slug) {
      case 'testSimpleGeneration':
        const { question } = body;
        if (!question) {
          return NextResponse.json(
            { error: 'Question is required' },
            { status: 400 }
          );
        }

        // Check if we have a valid API key
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.length < 30) {
          return NextResponse.json({
            answer: `Mock Response: You asked "${question}". This is a test response because the Google AI API key is not configured properly. Please get a valid API key from https://aistudio.google.com/`,
          });
        }

        const response = await ai.generate(
          `You are a helpful AI assistant. Answer the following question clearly and concisely: ${question}`
        );

        return NextResponse.json({
          answer: response.text,
        });

      case 'generateHint':
        const { drillContext, userQuery } = body;
        const hintResponse = await ai.generate(
          `You are a helpful AI tutor. The user is working on: ${drillContext}. They asked: ${userQuery}. Provide a helpful hint without giving away the complete answer.`
        );
        return NextResponse.json({ hint: hintResponse.text });

      case 'generateClarification':
        const { concept, userQuestion } = body;
        const clarificationResponse = await ai.generate(
          `You are an expert tutor explaining ${concept}. The user asked: ${userQuestion}. Provide a clear, educational explanation.`
        );
        return NextResponse.json({ clarification: clarificationResponse.text });

      case 'generateCodeCompletion':
        const { codeContext, language } = body;
        const codeResponse = await ai.generate(
          `You are a coding assistant. Help complete this ${language} code: ${codeContext}. Provide helpful suggestions or explanations.`
        );
        return NextResponse.json({ completion: codeResponse.text });
        
      case 'generateDrillFromPrompt':
        const { prompt } = body;
        if (!prompt) {
          return NextResponse.json(
            { error: 'Prompt is required' },
            { status: 400 }
          );
        }

        // Check if we have a valid API key
        if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.length < 30) {
          const mockDrill = {
            title: "Mock Python Loops Drill",
            concept: "Python For Loops",
            difficulty: "Beginner",
            description: "Learn the basics of Python for loops with this interactive drill.",
            content: [
              {
                type: "theory",
                value: "A for loop in Python is used to iterate over a sequence (like a list, tuple, or string)."
              },
              {
                type: "code",
                value: "for i in range(____): print(i)",
                language: "python",
                solution: ["5"]
              },
              {
                type: "mcq",
                value: "What does range(5) generate?",
                choices: ["0,1,2,3,4", "1,2,3,4,5", "0,1,2,3,4,5"],
                answer: 0
              }
            ]
          };

          return NextResponse.json({
            rawCreativeText: "Mock drill generated because API key is not configured",
            finalJson: mockDrill,
          });
        }

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
            `You are a JSON formatting expert. Take the following text, which describes a practice drill, and convert it into a valid JSON object.

            The JSON should have this structure:
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

            Drill Text:
            ---
            ${drillText}
            ---

            Respond with ONLY the JSON object, nothing else.`
          );

          const finalJson = JSON.parse(refineResponse.text);

          return NextResponse.json({
            rawCreativeText: drillText,
            finalJson: finalJson,
          });

        } catch (error: any) {
          return NextResponse.json({
            rawCreativeText: drillText,
            error: error.message,
          });
        }
        
      default:
        return NextResponse.json(
          { error: `Unknown flow: ${slug}` },
          { status: 404 }
        );
    }
  } catch (error: any) {
    console.error('Genkit API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
