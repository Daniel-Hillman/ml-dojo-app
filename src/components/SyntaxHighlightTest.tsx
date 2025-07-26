"use client";

import React from 'react';

export function SyntaxHighlightTest() {
  const testCode = `class Dog:
    def __init__(self, name, breed, age):
        self.name = name  # Public attribute
        self._breed = breed  # Protected attribute
        self.__age = age  # Private attribute

    def bark(self):
        print("Woof!")

my_dog = Dog("Buddy", "Golden Retriever", 3)
print(my_dog.name)  # Accessing public attribute`;

  // Same highlighting function as in InteractiveCodeBlock
  const applySyntaxHighlighting = (code: string) => {
    const tokens: Array<{start: number, end: number, className: string, content: string}> = [];
    
    const addToken = (match: RegExpMatchArray, className: string) => {
      const start = match.index!;
      const end = start + match[0].length;
      
      const overlaps = tokens.some(token => 
        (start >= token.start && start < token.end) || 
        (end > token.start && end <= token.end) ||
        (start <= token.start && end >= token.end)
      );
      
      if (!overlaps) {
        tokens.push({ start, end, className, content: match[0] });
      }
    };

    // Find matches in order of precedence
    const commentMatches = [...code.matchAll(/(#.*$)/gm)];
    commentMatches.forEach(match => addToken(match, 'text-green-500'));

    const stringMatches = [...code.matchAll(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)];
    stringMatches.forEach(match => addToken(match, 'text-yellow-300'));

    const numberMatches = [...code.matchAll(/\b(\d+\.?\d*)\b/g)];
    numberMatches.forEach(match => addToken(match, 'text-orange-400'));

    const keywordMatches = [...code.matchAll(/\b(def|class|if|elif|else|for|while|try|except|finally|with|import|from|as|return|yield|break|continue|pass|lambda|and|or|not|in|is|True|False|None)\b/g)];
    keywordMatches.forEach(match => addToken(match, 'text-purple-400'));

    const functionMatches = [...code.matchAll(/\b(print|len|range|str|int|float|list|dict|set|tuple|type|isinstance|hasattr|getattr|setattr)\b/g)];
    functionMatches.forEach(match => addToken(match, 'text-blue-400'));

    const operatorMatches = [...code.matchAll(/([+\-*/%=<>!&|^~])/g)];
    operatorMatches.forEach(match => addToken(match, 'text-red-400'));

    tokens.sort((a, b) => a.start - b.start);

    let result = '';
    let lastIndex = 0;

    tokens.forEach(token => {
      result += code.slice(lastIndex, token.start)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      result += `<span class="${token.className}">${token.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')}</span>`;
      
      lastIndex = token.end;
    });

    result += code.slice(lastIndex)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return result;
  };

  const highlightedCode = applySyntaxHighlighting(testCode);

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Syntax Highlighting Test</h3>
      
      <div className="mb-4">
        <h4 className="font-semibold mb-2">Expected Colors:</h4>
        <ul className="text-sm space-y-1">
          <li><span className="text-purple-400">Purple</span>: Keywords (class, def)</li>
          <li><span className="text-blue-400">Blue</span>: Built-in functions (print)</li>
          <li><span className="text-yellow-300">Yellow</span>: Strings ("Buddy")</li>
          <li><span className="text-orange-400">Orange</span>: Numbers (3)</li>
          <li><span className="text-red-400">Red</span>: Operators (=)</li>
          <li><span className="text-green-500">Green</span>: Comments (# comments)</li>
        </ul>
      </div>

      <div className="font-mono text-sm leading-relaxed bg-gray-900 p-4 rounded-lg overflow-x-auto">
        <div 
          className="whitespace-pre"
          dangerouslySetInnerHTML={{ __html: highlightedCode }}
        />
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <details>
          <summary>Raw HTML Output</summary>
          <pre className="mt-2 p-2 bg-gray-800 rounded text-xs overflow-x-auto">
            {highlightedCode}
          </pre>
        </details>
      </div>
    </div>
  );
}