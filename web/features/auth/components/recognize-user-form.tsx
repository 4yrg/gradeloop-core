"use client"

import { useState, useEffect } from 'react';
import { Keyboard, User, Trophy, AlertTriangle, RefreshCw, UserCheck } from 'lucide-react';
import { CodeEditorTyping } from './code-editor-typing';
import { keystrokeAuthService } from '../../../lib/keystroke-auth-service';
import type { KeystrokeEvent } from '../../../hooks/use-keystroke-capture';
import type { IdentificationCandidate } from '../../../lib/keystroke-auth-service';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import Link from 'next/link';

export function RecognizeUserForm() {
  const [keystrokeData, setKeystrokeData] = useState<KeystrokeEvent[]>([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [results, setResults] = useState<{
    candidates: IdentificationCandidate[];
    confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noUsersEnrolled, setNoUsersEnrolled] = useState(false);

  const userId = 'recognition_user'; // Temporary user ID for capturing keystrokes

  // Handle keystroke data
  const handleKeystrokeData = (event: KeystrokeEvent) => {
    setKeystrokeData((prev) => [...prev, event]);
  };

  // Check if users are enrolled on mount
  useEffect(() => {
    checkEnrolledUsers();
  }, []);

  const checkEnrolledUsers = async () => {
    try {
      const response = await keystrokeAuthService.getEnrolledUsers();
      if (response.count === 0) {
        setNoUsersEnrolled(true);
      } else {
        setNoUsersEnrolled(false);
      }
    } catch (error) {
      console.error('Error checking enrolled users:', error);
    }
  };

  const handleRecognize = async () => {
    if (keystrokeData.length < 100) {
      setError('Please type at least 100 keystrokes for accurate recognition.');
      return;
    }

    setIsRecognizing(true);
    setError(null);
    setResults(null);

    try {
      const result = await keystrokeAuthService.identifyUser(keystrokeData, 3);

      if (result.candidates) {
        setResults({
          candidates: result.candidates,
          confidence_level: result.confidence_level || 'LOW',
        });

        // Show warning for low confidence
        if (result.confidence_level === 'LOW') {
          setError('Low confidence match. Results may not be accurate.');
        }
      }
    } catch (err: any) {
      console.error('Recognition error:', err);
      if (err.message && err.message.includes('No users enrolled')) {
        setNoUsersEnrolled(true);
        setError('No users enrolled yet. Please train at least one user first.');
      } else {
        setError('Recognition failed. Please ensure you have typed enough and try again.');
      }
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleClear = () => {
    setKeystrokeData([]);
    setResults(null);
    setError(null);
    // Clearing will be handled by remounting the component
    window.location.reload();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500/10 border-green-500/20';
    if (confidence >= 60) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-destructive/10 border-destructive/20';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'HIGH';
    if (confidence >= 60) return 'MEDIUM';
    return 'LOW';
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  if (noUsersEnrolled) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-linear-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex flex-col items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-2xl">No Users Enrolled</CardTitle>
              <CardDescription className="text-center text-base">
                Please enroll at least one user before using recognition
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild size="lg">
              <Link href="/enroll">
                <UserCheck className="h-4 w-4" />
                Go to Training Page
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 bg-linear-to-br from-background to-muted/30">
      <div className="max-w-400 w-full mx-auto space-y-6 flex-1 flex flex-col">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Keyboard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">User Recognition</CardTitle>
                <CardDescription className="text-base">
                  Type anything to identify yourself based on your typing pattern
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Typing Section */}
          <div className="xl:col-span-2 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Keyboard className="h-4 w-4" />
                    <span>Captured: <strong className="text-lg">{keystrokeData.length}</strong> keystrokes</span>
                    {keystrokeData.length < 100 && (
                      <span className="text-muted-foreground">(min 100 required)</span>
                    )}
                    {keystrokeData.length >= 100 && (
                      <span className="text-green-500 font-medium">✓ Ready</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 min-h-0">
                  <CodeEditorTyping
                    userId={userId}
                    onKeystroke={handleKeystrokeData}
                    placeholder="# Type anything here...\n# Your typing pattern will be analyzed\n"
                  />
                </div>

                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={handleRecognize}
                    disabled={keystrokeData.length < 100 || isRecognizing}
                    className="flex-1"
                    size="lg"
                  >
                    {isRecognizing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4" />
                        Identify User
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={isRecognizing}
                    size="lg"
                  >
                    Clear
                  </Button>
                </div>

                {error && (
                  <div className="mt-4 text-sm text-destructive bg-destructive/10 p-3 rounded-md flex items-start gap-2 border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="xl:col-span-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Recognition Results
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {!results && !isRecognizing && (
                  <div className="text-center py-12 text-muted-foreground h-full flex flex-col items-center justify-center">
                    <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Results will appear here after recognition</p>
                  </div>
                )}

                {isRecognizing && (
                  <div className="text-center py-12 text-muted-foreground h-full flex flex-col items-center justify-center">
                    <RefreshCw className="h-16 w-16 mx-auto mb-4 animate-spin opacity-50" />
                    <p className="text-sm">Analyzing typing pattern...</p>
                  </div>
                )}

                {results && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg border ${getConfidenceBg(results.candidates[0]?.confidence || 0)}`}>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Confidence Level
                      </div>
                      <div className={`text-2xl font-bold ${getConfidenceColor(results.candidates[0]?.confidence || 0)}`}>
                        {getConfidenceLabel(results.candidates[0]?.confidence || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {results.candidates[0]?.confidence.toFixed(1)}% match confidence
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Top Matches
                      </div>
                      {results.candidates.map((candidate) => (
                        <div
                          key={candidate.userId}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getRankMedal(candidate.rank)}</span>
                            <div>
                              <div className="font-medium">{candidate.userId}</div>
                              <div className="text-xs text-muted-foreground">
                                Rank #{candidate.rank}
                              </div>
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${getConfidenceColor(candidate.confidence)}`}>
                            {candidate.confidence.toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
