# Graded Assignment Review Walkthrough

This walkthrough demonstrates the new Graded Assignment Review and Learning Sandbox features.

## 1. Student Dashboard - Recent Grades

The student dashboard now lists recently graded assignments.

- **Changes**: Added a "Recent Grades" section in `apps/web/app/(dashboard)/student/page.tsx`.
- **Features**: 
    - Lists assignments with `graded` status.
    - Displays a "Graded" badge.
    - Provides a "View Results" link.

## 2. Graded Assignment Review Page

A new page (`/student/graded/[id]`) provides detailed feedback.

- **URL**: `/student/graded/s1` (example)
- **Features**:
    - **Back Navigation**: Link back to dashboard.
    - **Evaluation Results**: Visual breakdown of scores (Objectives, Style, Analysis).
    - **Socratic Feedback**: Tiered feedback (e.g., Tier 3) that guides the student without giving the answer.
    - **Test Cases**: Mocked test results showing pass/fail status and finding.
    - **Open Learning Sandbox**: Button to open the IDE in a safe mode.

## 3. IDE Learning Sandbox

The IDE now supports a "Sandbox" mode.

- **URL**: `/ide/[id]?mode=sandbox`
- **Features**:
    - **Visual Indicator**: Top bar shows "Learning Sandbox" in orange.
    - **Submission Disabled**: The "Submit" button is replaced by a disabled "Sandbox Mode" button.
    - **Code Loading**: Loads the snapshot of the code from the submission (simulated via mocks).

## Verification Steps (Manual)

1.  **Dashboard**: Navigate to `/student` and verify the "Recent Grades" list appears.
2.  **Review**: Click "View Results" on "Design Pattern Implementation". Verify score charts and text feedback are visible.
3.  **Sandbox**: Click "Open Learning Sandbox".
    - Verify the header says "Learning Sandbox".
    - Verify the code is loaded (e.g., `singleton.py` content).
    - Try to find the Submit button; verify it is disabled/replaced.
