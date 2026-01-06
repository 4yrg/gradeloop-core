"use client"

import { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, ArrowRight, Keyboard } from 'lucide-react';
import { EnrollmentWizard } from './enrollment-wizard';
import { keystrokeAuthService } from '../../../lib/keystroke-auth-service';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

export function TrainUserForm() {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);
  const [enrolledUsers, setEnrolledUsers] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEnrolledUsers();
  }, []);

  const fetchEnrolledUsers = async () => {
    try {
      const response = await keystrokeAuthService.getEnrolledUsers();
      setEnrolledUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching enrolled users:', error);
    }
  };

  const validateUsername = (name: string) => {
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(name);
  };

  const handleStartTraining = () => {
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!validateUsername(username)) {
      setError('Username must be 3-20 characters long and contain only letters, numbers, and underscores');
      return;
    }

    // Check if username already exists (allow re-enrollment with warning)
    if (enrolledUsers.includes(username)) {
      const confirmed = window.confirm(
        `"${username}" is already enrolled. Re-enrolling will overwrite the existing template.\n\nDo you want to continue?`
      );
      if (!confirmed) {
        return;
      }
    }

    // Generate user ID and start enrollment
    setUserId(username);
    setIsEnrolling(true);
  };

  const handleEnrollmentComplete = async (result: any) => {
    if (result.success) {
      setEnrollmentComplete(true);
      // Refresh enrolled users list
      await fetchEnrolledUsers();
    } else {
      setError(result.message || 'Enrollment failed. Please try again.');
      setIsEnrolling(false);
    }
  };

  const handleTrainAnother = () => {
    setUsername('');
    setUserId('');
    setIsEnrolling(false);
    setEnrollmentComplete(false);
    setError('');
  };

  const handleGoToRecognition = () => {
    window.location.href = '/recognize';
  };

  if (enrollmentComplete) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-linear-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex flex-col items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-3xl">Training Complete!</CardTitle>
              <CardDescription className="text-center text-base">
                User <strong className="text-foreground">{username}</strong> has been successfully enrolled.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              The system has learned your typing pattern. You can now use the Recognition page to test identification.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleGoToRecognition} size="lg">
                <Keyboard className="h-4 w-4" />
                Go to Recognition
              </Button>
              <Button variant="outline" onClick={handleTrainAnother} size="lg">
                <UserCheck className="h-4 w-4" />
                Train Another User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEnrolling) {
    return (
      <div className="h-full">
        <EnrollmentWizard
          userId={userId}
          onEnrollmentComplete={handleEnrollmentComplete}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-8 bg-linear-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <Card className="max-w-3xl w-full">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Train New User</CardTitle>
              <CardDescription className="text-base">
                Enter a username and complete typing exercises to enroll
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username (e.g., student_alice)"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleStartTraining();
                  }
                }}
                disabled={isLoading}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <Button
              onClick={handleStartTraining}
              disabled={isLoading || !username.trim()}
              className="w-full"
              size="lg"
            >
              <ArrowRight className="h-4 w-4" />
              Start Training
            </Button>
          </div>

          {enrolledUsers.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium mb-3">Enrolled Users ({enrolledUsers.length})</h3>
              <div className="flex flex-wrap gap-2">
                {enrolledUsers.map((user) => (
                  <div
                    key={user}
                    className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium"
                  >
                    {user}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
