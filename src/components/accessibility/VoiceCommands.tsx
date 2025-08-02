'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VoiceCommandsProps {
  children: React.ReactNode;
}

interface VoiceCommand {
  pattern: RegExp;
  action: (matches: RegExpMatchArray) => void;
  description: string;
}

export function VoiceCommands({ children }: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Voice commands configuration
  const commands: VoiceCommand[] = [
    {
      pattern: /^(run|execute) code$/i,
      action: () => {
        const runButton = document.querySelector('[data-run-code]') as HTMLElement;
        runButton?.click();
        speak('Running code');
      },
      description: 'Run code'
    },
    {
      pattern: /^(open|show) search$/i,
      action: () => {
        const searchButton = document.querySelector('[data-search-trigger]') as HTMLElement;
        searchButton?.click();
        speak('Opening search');
      },
      description: 'Open search'
    },
    {
      pattern: /^(go to|navigate to) (.+)$/i,
      action: (matches) => {
        const destination = matches[2].toLowerCase();
        let url = '';
        
        switch (destination) {
          case 'playground':
            url = '/playground';
            break;
          case 'drills':
            url = '/drills';
            break;
          case 'community':
            url = '/community';
            break;
          case 'profile':
            url = '/profile';
            break;
          case 'home':
            url = '/';
            break;
          default:
            speak(`I don't know how to navigate to ${destination}`);
            return;
        }
        
        window.location.href = url;
        speak(`Navigating to ${destination}`);
      },
      description: 'Navigate to page (playground, drills, community, profile, home)'
    },
    {
      pattern: /^(create|new) drill$/i,
      action: () => {
        window.location.href = '/drills/create';
        speak('Creating new drill');
      },
      description: 'Create new drill'
    },
    {
      pattern: /^(copy|copy code)$/i,
      action: () => {
        const copyButton = document.querySelector('[data-copy-code]') as HTMLElement;
        copyButton?.click();
        speak('Code copied');
      },
      description: 'Copy code'
    },
    {
      pattern: /^(help|show help|what can I say)$/i,
      action: () => {
        showVoiceHelp();
        speak('Showing voice commands help');
      },
      description: 'Show voice commands help'
    },
    {
      pattern: /^(scroll up|scroll down|scroll to top|scroll to bottom)$/i,
      action: (matches) => {
        const command = matches[1].toLowerCase();
        switch (command) {
          case 'scroll up':
            window.scrollBy(0, -300);
            break;
          case 'scroll down':
            window.scrollBy(0, 300);
            break;
          case 'scroll to top':
            window.scrollTo(0, 0);
            break;
          case 'scroll to bottom':
            window.scrollTo(0, document.body.scrollHeight);
            break;
        }
        speak(`${command.replace('scroll ', 'Scrolling ')}`);
      },
      description: 'Scroll page (up, down, to top, to bottom)'
    },
    {
      pattern: /^(click|press|select) (.+)$/i,
      action: (matches) => {
        const elementText = matches[2].toLowerCase();
        const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
        
        const targetButton = buttons.find(button => 
          button.textContent?.toLowerCase().includes(elementText)
        ) as HTMLElement;
        
        if (targetButton) {
          targetButton.click();
          speak(`Clicking ${elementText}`);
        } else {
          speak(`Could not find ${elementText}`);
        }
      },
      description: 'Click button or link by name'
    },
    {
      pattern: /^(focus|select) (input|text field|search box)$/i,
      action: () => {
        const input = document.querySelector('input[type="text"], input[type="search"], textarea') as HTMLElement;
        input?.focus();
        speak('Focusing input field');
      },
      description: 'Focus input field'
    },
    {
      pattern: /^(read|speak) (page|content)$/i,
      action: () => {
        const content = document.body.textContent || '';
        const summary = content.substring(0, 500) + '...';
        speak(summary);
      },
      description: 'Read page content'
    }
  ];

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        speak('Voice commands activated');
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use voice commands.",
            variant: "destructive",
          });
        }
      };
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.trim();
        
        setTranscript(transcript);
        
        if (event.results[current].isFinal) {
          processVoiceCommand(transcript);
          setTranscript('');
        }
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const processVoiceCommand = (transcript: string) => {
    console.log('Processing voice command:', transcript);
    
    for (const command of commands) {
      const matches = transcript.match(command.pattern);
      if (matches) {
        command.action(matches);
        return;
      }
    }
    
    // No command matched
    speak("I didn't understand that command. Say 'help' to see available commands.");
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const showVoiceHelp = () => {
    const helpText = commands.map(cmd => cmd.description).join('. ');
    speak(`Available voice commands: ${helpText}`);
    
    // Also show visual help
    toast({
      title: "Voice Commands",
      description: "Check the console for a full list of available commands.",
    });
    
    console.log('Available Voice Commands:', commands.map(cmd => ({
      description: cmd.description,
      pattern: cmd.pattern.source
    })));
  };

  if (!isSupported) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Voice command controls */}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
        <Button
          variant={isListening ? "default" : "outline"}
          size="sm"
          onClick={isListening ? stopListening : startListening}
          className="flex items-center gap-2"
          title={isListening ? "Stop voice commands" : "Start voice commands"}
        >
          {isListening ? <Mic size={16} /> : <MicOff size={16} />}
          {isListening ? 'Listening...' : 'Voice Commands'}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={showVoiceHelp}
          className="flex items-center gap-2"
          title="Show voice commands help"
        >
          <Volume2 size={16} />
          Help
        </Button>
      </div>
      
      {/* Voice command feedback */}
      {isListening && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm">
              {transcript || 'Listening for voice commands...'}
            </span>
          </div>
        </div>
      )}
      
      <VoiceCommandStyles />
    </>
  );
}

// Styles for voice command indicators
function VoiceCommandStyles() {
  return (
    <style jsx global>{`
      @keyframes pulse-ring {
        0% {
          transform: scale(0.33);
        }
        40%, 50% {
          opacity: 1;
        }
        100% {
          opacity: 0;
          transform: scale(1.33);
        }
      }
      
      .voice-listening::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 100%;
        height: 100%;
        border: 2px solid #3b82f6;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        animation: pulse-ring 1.5s ease-out infinite;
      }
    `}</style>
  );
}

// Hook for voice commands
export function useVoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
  }, []);

  const startListening = (onResult: (transcript: string) => void) => {
    if (!isSupported || isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    
    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
    }
  };

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    speak
  };
}

// Voice-controlled form component
export function VoiceControlledForm({ 
  children, 
  onVoiceInput 
}: { 
  children: React.ReactNode;
  onVoiceInput?: (field: string, value: string) => void;
}) {
  const { startListening, speak, isSupported } = useVoiceCommands();
  const [activeField, setActiveField] = useState<string | null>(null);

  const handleVoiceInput = (fieldName: string) => {
    setActiveField(fieldName);
    speak(`Listening for ${fieldName}`);
    
    startListening((transcript) => {
      onVoiceInput?.(fieldName, transcript);
      setActiveField(null);
      speak(`Set ${fieldName} to ${transcript}`);
    });
  };

  if (!isSupported) {
    return <>{children}</>;
  }

  return (
    <div className="voice-controlled-form">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.props.name) {
          return React.cloneElement(child, {
            ...child.props,
            'data-voice-field': child.props.name,
            onFocus: () => {
              // Add voice input button when field is focused
              const button = document.createElement('button');
              button.innerHTML = '🎤';
              button.onclick = () => handleVoiceInput(child.props.name);
              button.className = 'voice-input-btn';
              child.props.parentElement?.appendChild(button);
            }
          });
        }
        return child;
      })}
    </div>
  );
}

// Declare global types for speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}