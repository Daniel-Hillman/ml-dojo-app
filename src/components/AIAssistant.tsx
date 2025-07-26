"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getHint, getClarification, getCodeCompletion } from "@/lib/actions";
import { LoaderCircle } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

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
  currentUserCode,
}: {
  concept: string;
  drillContext: string;
  codeContext: string;
  proactiveHint: string | null;
  drillCompleted: boolean;
  currentUserCode?: string;
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

  // Function to detect and format code blocks in AI responses
  const formatMessageContent = (content: string) => {
    // Split content by code blocks (looking for ```python or ``` patterns)
    const codeBlockRegex = /```(?:python)?\n?([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index).trim();
        if (textBefore) {
          parts.push({ type: 'text', content: textBefore });
        }
      }
      
      // Add code block
      parts.push({ type: 'code', content: match[1].trim() });
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex).trim();
      if (remainingText) {
        parts.push({ type: 'text', content: remainingText });
      }
    }
    
    // If no code blocks found, return as text
    if (parts.length === 0) {
      parts.push({ type: 'text', content: content });
    }
    
    return parts;
  };

  const handleSendMessage = async (flow: "clarification" | "hint" | "code" | "deeperExplanation", content?: string) => {
    let userMessageContent = content || input;
    
    // Validate that user is asking about coding/drill related topics
    if (flow === "clarification" && input.trim()) {
      const offTopicKeywords = ['omelette', 'cooking', 'recipe', 'food', 'weather', 'sports', 'movie', 'music'];
      const isOffTopic = offTopicKeywords.some(keyword => 
        input.toLowerCase().includes(keyword)
      );
      
      if (isOffTopic) {
        const errorMessage: Message = {
          role: "assistant",
          content: "I'm here to help you with coding and this drill specifically. Please ask questions related to programming, the current exercise, or the concepts we're learning!",
        };
        setMessages((prev) => [...prev, { role: "user", content: input }, errorMessage]);
        setInput("");
        return;
      }
    }
    
    if (flow === "hint" && !content) {
      userMessageContent = "Can I have a hint for the current code I'm working on?";
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
        response = await getClarification({
          concept: concept,
          userQuestion: `Context: ${drillContext}\nCurrent code: ${currentUserCode || codeContext}\nUser question: ${input}`,
        });
      } else if (flow === "hint") {
        response = await getHint({
          drillContext: `${drillContext}\nCurrent progress: ${currentUserCode || 'Just started'}`,
          userQuery: userMessageContent,
        });
      } else if (flow === "code") {
        response = await getCodeCompletion({
          codeContext: `${codeContext}\nCurrent user input: ${currentUserCode || 'None yet'}`,
          language: "python",
        });
      } else {
        response = await getClarification({
          concept: concept,
          userQuestion: "Can you explain this concept in more detail?",
        });
      }
      
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
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
    <div className="flex flex-col h-[600px] border rounded-md">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg">AI Assistant</h3>
        <p className="text-sm text-muted-foreground">
          Ask for hints, clarifications, or code explanations.
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                message.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground p-3"
                    : "bg-muted p-3"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="space-y-3">
                    {formatMessageContent(message.content).map((part, partIndex) => (
                      <div key={partIndex}>
                        {part.type === 'code' ? (
                          <div className="my-2">
                            <div className="bg-gray-800 px-2 py-1 text-xs text-gray-300 rounded-t border-b border-gray-700">
                              💻 Code
                            </div>
                            <CodeMirror
                              value={part.content}
                              height="auto"
                              extensions={[python()]}
                              theme={vscodeDark}
                              editable={false}
                              className="rounded-b text-sm"
                            />
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">
                            {part.content}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm">{message.content}</div>
                )}
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
      
      <div className="p-4 border-t bg-background">
        {drillCompleted && (
          <Button onClick={() => handleSendMessage('deeperExplanation')} className="w-full mb-2">
            Go Deeper
          </Button>
        )}
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the code or concept..."
            onKeyDown={(e) =>
              e.key === "Enter" && handleSendMessage("clarification")
            }
            disabled={isLoading}
            className="text-sm"
          />
          <Button
            onClick={() => handleSendMessage("clarification")}
            disabled={isLoading}
            size="sm"
          >
            Ask
          </Button>
        </div>
        <div className="flex space-x-2 mt-2">
          <Button
            onClick={() => handleSendMessage("hint")}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            💡 Hint
          </Button>
          <Button
            onClick={() => handleSendMessage("code")}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            🔧 Help Code
          </Button>
        </div>
      </div>
    </div>
  );
}
