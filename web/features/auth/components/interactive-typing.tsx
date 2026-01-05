"use client"

import { useState, useEffect, useRef } from 'react';
import { Keyboard } from 'lucide-react';
import type { KeystrokeEvent } from '@/hooks/use-keystroke-capture';

interface InteractiveTypingProps {
  template: string;
  userId: string;
  onKeystroke: (event: KeystrokeEvent) => void;
  minKeystrokes: number;
  currentKeystrokes: number;
  key?: string | number; // Add key prop to force remount
}

export function InteractiveTyping({
  template,
  userId,
  onKeystroke,
  minKeystrokes,
  currentKeystrokes,
}: InteractiveTypingProps) {
  const [typedText, setTypedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = `interactive_${Date.now()}`;
  const lastKeyUp = useRef<number | null>(null);
  const keyDownTimes = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Focus input on mount and reset state when template changes
    setTypedText('');
    setCurrentIndex(0);
    inputRef.current?.focus();
  }, [template]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const timestamp = Date.now();
    const key = e.key;
    keyDownTimes.current.set(key, timestamp);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const timestamp = Date.now();
    const key = e.key;

    // Calculate dwell time (how long key was held)
    const keyDownTime = keyDownTimes.current.get(key);
    const dwellTime = keyDownTime ? timestamp - keyDownTime : 0;

    // Calculate flight time (time since last key release)
    const flightTime = lastKeyUp.current ? timestamp - lastKeyUp.current : 0;

    // Create keystroke event
    const keystrokeEvent: KeystrokeEvent = {
      userId,
      sessionId,
      timestamp,
      key,
      dwellTime,
      flightTime,
      keyCode: e.keyCode,
    };

    // Send to parent
    onKeystroke(keystrokeEvent);

    // Update last keyup time
    lastKeyUp.current = timestamp;

    // Clean up
    keyDownTimes.current.delete(key);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const value = textarea.value;
      
      // Get the current line
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = value.indexOf('\n', start);
      const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
      
      // Calculate indentation (spaces at the start of the line)
      const indentMatch = currentLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';
      
      // Check if current line ends with : (for Python-style indentation)
      const shouldAddExtraIndent = currentLine.trim().endsWith(':');
      const extraIndent = shouldAddExtraIndent ? '    ' : ''; // 4 spaces for Python
      
      // Insert newline with indentation
      const newValue = value.substring(0, start) + '\n' + indent + extraIndent + value.substring(start);
      setTypedText(newValue);
      setCurrentIndex(start + 1 + indent.length + extraIndent.length);
      
      // Set cursor position after state update
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length + extraIndent.length;
      }, 0);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTypedText(value);
    setCurrentIndex(value.length);
  };

  const renderCharacters = () => {
    return template.split('').map((char, index) => {
      let className = 'inline-block whitespace-pre';
      
      if (index < typedText.length) {
        // Character has been typed
        if (typedText[index] === char) {
          className += ' text-green-500 bg-green-500/10';
        } else {
          className += ' text-red-500 bg-red-500/20';
        }
      } else if (index === typedText.length) {
        // Current character to type
        className += ' text-foreground bg-primary/20 animate-pulse';
      } else {
        // Not yet typed
        className += ' text-black/80';
      }

      // Handle newlines
      if (char === '\n') {
        return <br key={index} />;
      }

      return (
        <span key={index} className={className}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  const accuracy = typedText.length > 0
    ? (typedText.split('').filter((char, idx) => char === template[idx]).length / typedText.length * 100)
    : 100;

  const progress = (typedText.length / template.length) * 100;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-muted-foreground" />
            <span className={currentKeystrokes >= minKeystrokes ? 'text-green-500 font-medium' : 'text-muted-foreground'}>
              {currentKeystrokes} / {minKeystrokes} keystrokes
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="text-muted-foreground">Progress: </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="text-muted-foreground">Accuracy: </span>
            <span className={`font-medium ${accuracy >= 95 ? 'text-green-500' : accuracy >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
              {accuracy.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Typing area */}
      <div 
        ref={containerRef}
        className="relative flex-1 border rounded-lg p-6 bg-card shadow-sm overflow-auto cursor-text font-mono text-sm leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="relative">
          {/* Display text with character-by-character feedback */}
          <div className="select-none pointer-events-none">
            {renderCharacters()}
          </div>
          
          {/* Hidden textarea for input capture */}
          <textarea
            ref={inputRef}
            value={typedText}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onKeyPress={handleKeyPress}
            className="absolute inset-0 w-full h-full opacity-0 resize-none outline-none"
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-green-500/10 border border-green-500/20 rounded"></span>
          <span>Correct</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-red-500/20 border border-red-500/30 rounded"></span>
          <span>Incorrect</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-primary/20 border border-primary/30 rounded animate-pulse"></span>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 bg-muted border border-border rounded"></span>
          <span>Pending</span>
        </div>
      </div>
    </div>
  );
}
