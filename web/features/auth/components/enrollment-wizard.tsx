"use client"

/**
 * Enrollment Wizard Component
 * Guides users through the keystroke authentication enrollment process
 */

import { useState } from 'react';
import { CheckCircle2, Keyboard, ArrowRight } from 'lucide-react';
import { InteractiveTyping } from './interactive-typing';
import { keystrokeAuthService } from '../../../lib/keystroke-auth-service';
import type { KeystrokeEvent } from '../../../hooks/use-keystroke-capture';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';

interface Exercise {
  id: number;
  title: string;
  description: string;
  template: string;
  minKeystrokes: number;
}

const ENROLLMENT_EXERCISES: Exercise[] = [
  {
    id: 1,
    title: 'Hello World',
    description: 'Type the following Python program exactly as shown',
    template: `def greet(name):
    """Return a greeting message."""
    return f"Hello, {name}! Welcome to Python."

# Main execution
if __name__ == "__main__":
    user_name = input("Enter your name: ")
    message = greet(user_name)
    print(message)`,
    minKeystrokes: 50,
  },
  {
    id: 2,
    title: 'Function Definition',
    description: 'Type this function that performs mathematical operations',
    template: `def calculate_average(numbers):
    """Calculate the average of a list of numbers."""
    if not numbers:
        return 0

    total = sum(numbers)
    count = len(numbers)
    average = total / count

    return round(average, 2)

# Example usage
scores = [85, 92, 78, 90, 88]
result = calculate_average(scores)
print(f"Average score: {result}")`,
    minKeystrokes: 50,
  },
  {
    id: 3,
    title: 'Loop Practice',
    description: 'Type this code that demonstrates loops and conditionals',
    template: `def find_even_numbers(start, end):
    """Find all even numbers in a given range."""
    even_nums = []

    for num in range(start, end + 1):
        if num % 2 == 0:
            even_nums.append(num)

    return even_nums

# Test the function
numbers = find_even_numbers(1, 20)
print(f"Even numbers: {numbers}")
print(f"Count: {len(numbers)}")`,
    minKeystrokes: 50,
  },
  {
    id: 4,
    title: 'Class Definition',
    description: 'Type this class implementation with methods',
    template: `class Student:
    """Represents a student with name and grades."""

    def __init__(self, name, student_id):
        self.name = name
        self.student_id = student_id
        self.grades = []

    def add_grade(self, grade):
        """Add a grade to the student's record."""
        if 0 <= grade <= 100:
            self.grades.append(grade)
            return True
        return False

    def get_average(self):
        """Calculate the student's average grade."""
        if not self.grades:
            return 0
        return sum(self.grades) / len(self.grades)

# Create student instance
student = Student("Alice", "S12345")
student.add_grade(95)
student.add_grade(88)
print(f"{student.name}'s average: {student.get_average():.2f}")`,
    minKeystrokes: 100,
  },
];

interface EnrollmentWizardProps {
  userId: string;
  onEnrollmentComplete?: (result: any) => void;
}

export function EnrollmentWizard({ userId, onEnrollmentComplete }: EnrollmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [keystrokeData, setKeystrokeData] = useState<KeystrokeEvent[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState(
    ENROLLMENT_EXERCISES.map(() => ({ completed: false, keystrokes: 0 }))
  );
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const currentExercise = ENROLLMENT_EXERCISES[currentStep];
  const currentProgress = exerciseProgress[currentStep];
  const canProceed = currentProgress.keystrokes >= currentExercise.minKeystrokes;
  const overallProgress = ((currentStep + 1) / ENROLLMENT_EXERCISES.length) * 100;

  // Handle individual keystroke events
  const handleKeystroke = (keystrokeEvent: KeystrokeEvent) => {
    setKeystrokeData((prev) => [...prev, keystrokeEvent]);

    // Update progress for current exercise
    setExerciseProgress((prev) => {
      const newProgress = [...prev];
      newProgress[currentStep] = {
        ...newProgress[currentStep],
        keystrokes: prev[currentStep].keystrokes + 1,
      };
      return newProgress;
    });
  };

  const handleNext = () => {
    if (currentStep < ENROLLMENT_EXERCISES.length - 1) {
      // Mark current as completed
      setExerciseProgress((prev) => {
        const newProgress = [...prev];
        newProgress[currentStep].completed = true;
        return newProgress;
      });

      // Move to next exercise
      setCurrentStep(currentStep + 1);
    } else {
      // All exercises complete, proceed to enrollment
      handleEnrollment();
    }
  };

  const handleEnrollment = async () => {
    setIsEnrolling(true);

    try {
      // Ensure we have enough data
      if (keystrokeData.length < 200) {
        setEnrollmentStatus({
          success: false,
          message: 'Not enough typing data collected. Please complete more exercises.',
        });
        setIsEnrolling(false);
        return;
      }

      // Send enrollment request
      const result = await keystrokeAuthService.enrollUser(userId, keystrokeData);

      if (result.success) {
        setEnrollmentStatus({
          success: true,
          message: 'Enrollment successful! You are now authenticated.',
          details: result,
        });

        // Call completion callback after delay
        setTimeout(() => {
          if (onEnrollmentComplete) {
            onEnrollmentComplete(result);
          }
        }, 2000);
      } else {
        setEnrollmentStatus({
          success: false,
          message: 'Enrollment failed. Please try again.',
        });
      }
    } catch (error: any) {
      setEnrollmentStatus({
        success: false,
        message: error.message || 'An error occurred during enrollment.',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  if (enrollmentStatus) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-linear-to-br from-background to-muted/30">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-6">
              {enrollmentStatus.success ? (
                <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <span className="text-4xl">✕</span>
                </div>
              )}
            </div>
            <CardTitle className="text-center text-2xl">
              {enrollmentStatus.success ? 'Enrollment Complete!' : 'Enrollment Failed'}
            </CardTitle>
            <CardDescription className="text-center text-base">
              {enrollmentStatus.message}
            </CardDescription>
          </CardHeader>
          {enrollmentStatus.success && (
            <CardContent className="text-center text-sm text-muted-foreground">
              <p>Total keystrokes captured: <strong className="text-foreground">{keystrokeData.length}</strong></p>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 bg-linear-to-br from-background to-muted/30">
      <div className="max-w-7xl w-full mx-auto space-y-6 flex-1 flex flex-col">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Keyboard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Enrollment Process</CardTitle>
                  <CardDescription>
                    Step {currentStep + 1} of {ENROLLMENT_EXERCISES.length}
                  </CardDescription>
                </div>
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {Math.round(overallProgress)}% Complete
              </div>
            </div>
            <Progress value={overallProgress} className="mt-4 h-2" />
          </CardHeader>
        </Card>

        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{currentExercise.title}</CardTitle>
                <CardDescription className="text-base mt-1">{currentExercise.description}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Keystrokes</div>
                <div className={`text-2xl font-bold ${canProceed ? 'text-green-500' : 'text-primary'}`}>
                  {currentProgress.keystrokes} / {currentExercise.minKeystrokes}
                </div>
                {canProceed && <span className="text-xs text-green-500">✓ Ready to continue</span>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1 min-h-0">
              <InteractiveTyping
                key={currentStep}
                template={currentExercise.template}
                userId={userId}
                onKeystroke={handleKeystroke}
                minKeystrokes={currentExercise.minKeystrokes}
                currentKeystrokes={currentProgress.keystrokes}
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <div className="flex gap-2">
                {ENROLLMENT_EXERCISES.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className={`h-2 w-16 rounded-full transition-all ${idx < currentStep
                        ? 'bg-green-500'
                        : idx === currentStep
                          ? 'bg-primary'
                          : 'bg-muted'
                      }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                disabled={!canProceed || isEnrolling}
                size="lg"
              >
                {currentStep < ENROLLMENT_EXERCISES.length - 1 ? 'Next Exercise' : 'Complete Enrollment'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
