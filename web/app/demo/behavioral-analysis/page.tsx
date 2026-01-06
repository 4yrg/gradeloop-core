"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { Brain, FileCode, Play } from 'lucide-react';
import { behavioralAnalysisService, type KeystrokeSessionEvent } from '../../../lib/behavioral-analysis-service';
import { BehavioralAnalysisReport } from '../../../components/instructor/behavioral-analysis-report';
import type { BehavioralAnalysisResult } from '../../../lib/behavioral-analysis-service';

export default function BehavioralAnalysisDemo() {
  const [studentId, setStudentId] = useState('student_001');
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  const [keystrokeData, setKeystrokeData] = useState('');
  const [finalCode, setFinalCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<BehavioralAnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setError('');
    setIsAnalyzing(true);
    
    try {
      // Parse keystroke data
      let events: KeystrokeSessionEvent[];
      try {
        events = JSON.parse(keystrokeData);
      } catch (e) {
        throw new Error('Invalid JSON format for keystroke data');
      }
      
      if (!Array.isArray(events)) {
        throw new Error('Keystroke data must be an array');
      }
      
      // Perform analysis
      const analysis = await behavioralAnalysisService.analyzeSession({
        sessionId,
        studentId,
        events,
        finalCode,
        includeReport: true
      });
      
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSampleData = () => {
    // Generate sample keystroke data
    const sampleEvents: KeystrokeSessionEvent[] = [];
    let timestamp = 0;
    const code = `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr`;
    
    // Simulate typing the code
    for (const char of code) {
      const dwellTime = 50 + Math.random() * 100;
      const flightTime = 100 + Math.random() * 300;
      
      sampleEvents.push({
        timestamp: timestamp,
        key: char,
        keyCode: char.charCodeAt(0),
        dwellTime: Math.round(dwellTime),
        flightTime: Math.round(flightTime),
        action: 'type'
      });
      
      timestamp += dwellTime + flightTime;
    }
    
    // Add some deletions (simulating corrections)
    for (let i = 0; i < 10; i++) {
      const insertAt = Math.floor(Math.random() * sampleEvents.length);
      sampleEvents.splice(insertAt, 0, {
        timestamp: sampleEvents[insertAt - 1]?.timestamp + 200 || 0,
        key: 'Backspace',
        keyCode: 8,
        dwellTime: 50,
        flightTime: 200,
        action: 'delete'
      });
    }
    
    // Add some pauses (simulating thinking)
    for (let i = 0; i < 5; i++) {
      const insertAt = Math.floor(Math.random() * sampleEvents.length);
      if (sampleEvents[insertAt]) {
        sampleEvents[insertAt].flightTime = 3000 + Math.random() * 2000;
      }
    }
    
    setKeystrokeData(JSON.stringify(sampleEvents, null, 2));
    setFinalCode(code);
  };

  if (result) {
    return (
      <>
        <Button 
          variant="outline" 
          onClick={() => setResult(null)}
          className="m-6"
        >
          ← New Analysis
        </Button>
        <BehavioralAnalysisReport 
          analysis={result} 
          onClose={() => setResult(null)}
        />
      </>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Behavioral Analysis Demo</h1>
          <p className="text-muted-foreground">
            Analyze keystroke session logs for authenticity and learning patterns
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Information</CardTitle>
          <CardDescription>Identify the student and session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Student ID</label>
              <Input 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g., student_001"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Session ID</label>
              <Input 
                value={sessionId} 
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="e.g., session_12345"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Keystroke Event Data</CardTitle>
              <CardDescription>
                Provide keystroke events as JSON array
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              Load Sample Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={keystrokeData}
            onChange={(e) => setKeystrokeData(e.target.value)}
            placeholder={`[\n  {\n    "timestamp": 0,\n    "key": "d",\n    "keyCode": 100,\n    "dwellTime": 80,\n    "flightTime": 120,\n    "action": "type"\n  },\n  ...\n]`}
            className="font-mono text-sm min-h-[200px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Each event should have: timestamp, key, keyCode, dwellTime, flightTime, action
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Final Code Submission
          </CardTitle>
          <CardDescription>The completed code from the session</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            value={finalCode}
            onChange={(e) => setFinalCode(e.target.value)}
            placeholder="def solution():\n    pass"
            className="font-mono text-sm min-h-[150px]"
          />
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <Button 
        onClick={handleAnalyze} 
        disabled={isAnalyzing || !keystrokeData || !finalCode}
        className="w-full"
        size="lg"
      >
        <Play className="h-4 w-4" />
        {isAnalyzing ? 'Analyzing...' : 'Run Behavioral Analysis'}
      </Button>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. Developmental Logic:</strong> Analyzes incremental vs all-at-once construction patterns</p>
          <p><strong>2. Cognitive Load:</strong> Identifies friction points, pauses, and problem-solving rhythm</p>
          <p><strong>3. Authenticity:</strong> Detects human vs synthetic signatures (copy-paste, AI assistance)</p>
          <p><strong>4. Pedagogical Feedback:</strong> Identifies struggle areas and provides learning insights</p>
        </CardContent>
      </Card>
    </div>
  );
}
