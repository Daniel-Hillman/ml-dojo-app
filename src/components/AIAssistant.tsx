"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateClarification } from "@/ai/flows/generate-clarification";
import { generateHint } from "@/ai/flows/generate-hint";
import { generateCodeCompletion } from "@/ai/flows/generate-code-completion";
import { generateDeeperExplanation } from "@/ai/flows/generate-deeper-explanation";
import { LoaderCircle } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
  isProactive?: boolean;
};

export function AIAssistant({
  concept,
  drillContext,
  codeContext,
  proactiveHint,
  drillCompleted,
}: {
  concept: string;
  drillContext: string;
  codeContext: string;
  proactiveHint: string | null;
  drillCompleted: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [proactiveHintVisible, setProactiveHintVisible] = useState(false);

  useEffect(() => {
    if (proactiveHint) {
      setMessages((prev) => [...prev, { role: 'assistant', content: proactiveHint, isProactive: true }]);
      setProactiveHintVisible(true);
    }
  }, [proactiveHint]);

  const handleSendMessage = async (flow: "clarification" | "hint" | "code" | "deeperExplanation", content?: string) => {
    let userMessageContent = content || input;
    if (flow === "hint" && !content) {
      userMessageContent = "Can I have a hint?";
    } else if (flow === "code") {
      userMessageContent = "Can you help me complete this code?";
    } else if (flow === "deeperExplanation") {
        userMessageContent = "Can you explain this concept in more detail?";
    }

    if (userMessageContent.trim() === "" && flow === "clarification") return;

    const userMessage: Message = { role: "user", content: userMessageContent };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      let response;
      if (flow === "clarification") {
        response = await generateClarification({
          concept: concept,
          userQuestion: input,
        });
      } else if (flow === "hint") {
        response = await generateHint({
          drillContext: drillContext,
          userQuery: userMessageContent,
        });
      } else if (flow === "code") {
        response = await generateCodeCompletion({
          codeContext: codeContext,
          language: "python",
        });
      } else {
        response = await generateDeeperExplanation({
            concept,
            drillContext,
        });
      }
      const assistantMessage: Message = {
        role: "assistant",
        content:
          (response as any).clarification ||
          (response as any).hint ||
          (response as any).completion ||
            (response as any).explanation,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(`Error generating ${flow}:`, error);
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I couldn't generate a ${flow} at this time.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProactiveHintResponse = (response: 'yes' | 'no') => {
    setProactiveHintVisible(false);
    if(response === 'yes'){
        handleSendMessage('hint', 'Yes, please');
    }
  }

  return (
    <div className="flex flex-col h-full border rounded-md">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">AI Assistant</h3>
        <p className="text-sm text-muted-foreground">
          Ask for hints, clarifications, or code explanations.
        </p>
      </div>
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.content}
              </div>
              {message.isProactive && proactiveHintVisible && (
                <div className="flex space-x-2 mt-2">
                    <Button onClick={() => handleProactiveHintResponse('yes')} size="sm">Yes, please</Button>
                    <Button onClick={() => handleProactiveHintResponse('no')} size="sm" variant="outline">No, thanks</Button>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-center">
              <LoaderCircle className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        {drillCompleted && (
            <Button onClick={() => handleSendMessage('deeperExplanation')} className="w-full mb-2">Go Deeper</Button>
        )}
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            onKeyDown={(e) =>
              e.key === "Enter" && handleSendMessage("clarification")
            }
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSendMessage("clarification")}
            disabled={isLoading}
          >
            Clarify
          </Button>
        </div>
        <div className="flex space-x-2 mt-2">
          <Button
            onClick={() => handleSendMessage("hint")}
            disabled={isLoading}
            variant="outline"
          >
            Hint
          </Button>
          <Button
            onClick={() => handleSendMessage("code")}
            disabled={isLoading}
            variant="outline"
          >
            Complete Code
          </Button>
        </div>
      </div>
    </div>
  );
}
