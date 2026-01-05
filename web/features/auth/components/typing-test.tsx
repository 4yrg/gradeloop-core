"use client"

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Keyboard } from 'lucide-react';
import { useKeystrokeCapture } from '@/hooks/use-keystroke-capture';
import type { KeystrokeEvent } from '@/hooks/use-keystroke-capture';
import type { editor as MonacoEditor } from 'monaco-editor';

interface TypingTestProps {
  template: string;
  userId: string;
  onKeystroke: (event: KeystrokeEvent) => void;
  minKeystrokes: number;
  currentKeystrokes: number;
}

export function TypingTest({
  template,
  userId,
  onKeystroke,
  minKeystrokes,
  currentKeystrokes,
}: TypingTestProps) {
  const [editor, setEditor] = useState<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const sessionId = `test_${Date.now()}`;

  // Handle keystroke data batches
  const handleKeystrokeData = (batch: KeystrokeEvent[]) => {
    batch.forEach((event) => onKeystroke(event));
  };

  // Attach keystroke capture to editor
  useKeystrokeCapture(editor, userId, sessionId, handleKeystrokeData);

  const handleEditorMount = (editorInstance: MonacoEditor.IStandaloneCodeEditor) => {
    setEditor(editorInstance);
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Template */}
        <div className="flex flex-col">
          <div className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wide">Template Code:</div>
          <div className="border rounded-lg overflow-hidden shadow-sm flex-1">
            <Editor
              height="100%"
              defaultLanguage="python"
              value={template}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                padding: { top: 16, bottom: 16 },
              }}
              theme="vs-dark"
            />
          </div>
        </div>

        {/* User input */}
        <div className="flex flex-col">
          <div className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wide flex items-center justify-between">
            <span>Your Typing:</span>
            <span className="flex items-center gap-2">
              <Keyboard className="h-3 w-3" />
              <span className={currentKeystrokes >= minKeystrokes ? 'text-green-500' : ''}>{currentKeystrokes} keystrokes</span>
            </span>
          </div>
          <div className="border rounded-lg overflow-hidden shadow-sm flex-1">
            <Editor
              height="100%"
              defaultLanguage="python"
              defaultValue="# Start typing here...\n"
              onMount={handleEditorMount}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                padding: { top: 16, bottom: 16 },
              }}
              theme="vs-dark"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
