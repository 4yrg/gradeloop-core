"use client"

import { useState, useEffect, useRef } from 'react';
import { Keyboard } from 'lucide-react';
import type { KeystrokeEvent } from '@/hooks/use-keystroke-capture';

interface CodeEditorTypingProps {
  userId: string;
  onKeystroke: (event: KeystrokeEvent) => void;
  placeholder?: string;
}

export function CodeEditorTyping({
  userId,
  onKeystroke,
  placeholder = "# Start typing your code here...\n# Your typing pattern will be analyzed\n",
}: CodeEditorTypingProps) {
  const [typedText, setTypedText] = useState('');
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sessionId = `editor_${Date.now()}`;
  const lastKeyUp = useRef<number | null>(null);
  const keyDownTimes = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Focus textarea on mount
    textareaRef.current?.focus();
  }, []);

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
    setKeystrokeCount(prev => prev + 1);

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
      
      // Check if current line ends with : or { for smart indentation
      const shouldAddExtraIndent = currentLine.trim().endsWith(':') || currentLine.trim().endsWith('{');
      const extraIndent = shouldAddExtraIndent ? '    ' : ''; // 4 spaces
      
      // Insert newline with indentation
      const newValue = value.substring(0, start) + '\n' + indent + extraIndent + value.substring(start);
      setTypedText(newValue);
      
      // Set cursor position after state update
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length + extraIndent.length;
      }, 0);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTypedText(e.target.value);
  };

  const lineCount = typedText.split('\n').length;
  const charCount = typedText.length;
  const wordCount = typedText.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="h-full flex flex-col">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-sm mb-4 pb-3 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{keystrokeCount} keystrokes</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="text-muted-foreground">Lines: </span>
            <span className="font-medium">{lineCount}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="text-muted-foreground">Words: </span>
            <span className="font-medium">{wordCount}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div>
            <span className="text-muted-foreground">Characters: </span>
            <span className="font-medium">{charCount}</span>
          </div>
        </div>
      </div>

      {/* Code editor area */}
      <div className="flex-1 relative border rounded-lg overflow-hidden bg-[#1e1e1e] shadow-sm">
        <textarea
          ref={textareaRef}
          value={typedText}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full h-full p-6 bg-transparent text-[#d4d4d4] font-mono text-sm leading-relaxed resize-none outline-none placeholder:text-muted-foreground/30"
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>

      {/* Helper text */}
      <div className="mt-3 text-xs text-muted-foreground">
        Type naturally - your keystroke patterns are being captured in real-time
      </div>
    </div>
  );
}
