# Quick Start Guide: Submissions & Integrity Review

## 🚀 Quick Navigation

### From Assignment Overview Dashboard

**Option 1: View All Submissions**
```
Click "Submissions" card → See full student list
```

**Option 2: Review Integrity Flags**
```
Click "Integrity Flags" card → See only flagged students (score < 50%)
```

---

## 📋 Submissions Page

**URL Pattern:**
```
/instructor/courses/{courseId}/assignments/{assignmentId}/submissions
```

**Features:**
- Search by student name or ID
- Filter by status: All / Graded / Ungraded / Flagged
- View stats: Total, Graded, Ungraded, Flagged
- Click any row to view student detail

---

## 🚨 Integrity Flags Page

**URL Pattern:**
```
/instructor/courses/{courseId}/assignments/{assignmentId}/integrity-flags
```

**Auto-Filtered To Show:**
- Students with keystroke auth score < 50%

**Risk Levels:**
- 🔴 Critical: Score < 40%
- 🟡 Medium: Score 40-49%

---

## 🔍 Student Detail Page

**URL Pattern:**
```
/instructor/courses/{courseId}/assignments/{assignmentId}/submissions/{studentId}
```

### Left Sidebar: Submission History
- Lists all attempts by this student
- Click to switch between attempts
- Shows score, timestamp, integrity score

### Center: Session Playback
**Controls:**
- ▶️ Play/Pause
- ⏪ Skip Back 10s
- ⏩ Skip Forward 10s
- 🔄 Reset
- Speed: 0.5x | 1x | 1.5x | 2x

**What It Shows:**
- Code appearing character-by-character
- Simulates how student typed over time
- Current typing speed (WPM)

### Bottom: Keystroke Timeline Chart

**Reading the Chart:**
- 🟢 Green line (>70%): High confidence - Normal behavior
- 🟡 Yellow line (50-70%): Moderate - Watch for patterns
- 🔴 Red line (<50%): Low confidence - Integrity concern

**Chart Features:**
- Hover over points for details
- Blue vertical line = current playback position
- Dashed lines = score thresholds (50%, 70%)

---

## 🎯 Common Use Cases

### Use Case 1: Weekly Grading Session
1. Go to assignment overview
2. Click "Submissions" card
3. Filter by "Ungraded"
4. Click each student to review and grade

### Use Case 2: Integrity Investigation
1. Notice "Integrity Flags" count > 0 on overview
2. Click the card to see flagged students
3. Click flagged student to investigate
4. Watch playback + timeline to identify suspicious patterns
5. Take action: Schedule viva, compare attempts, etc.

### Use Case 3: Comparing Student Attempts
1. Navigate to student detail page
2. Use submission history sidebar on left
3. Click different attempts to compare
4. Watch how coding style evolved

---

## 🎨 Color Code Reference

**Status Colors:**
- 🟢 Graded: Emerald (#10b981)
- 🟡 Ungraded: Yellow (#f59e0b)
- 🔴 Flagged: Red (#ef4444)

**Integrity Score Colors:**
- 🟢 70-100%: High Confidence (Green)
- 🟡 50-69%: Moderate (Yellow)
- 🔴 0-49%: Low Confidence (Red)

---

## ⚡ Keyboard Shortcuts (Session Playback)

- `Space`: Play/Pause
- `R`: Reset
- `←`: Skip backward 10s
- `→`: Skip forward 10s
- `1-4`: Change speed (0.5x, 1x, 1.5x, 2x)

*(Note: Keyboard shortcuts would need to be implemented for actual functionality)*

---

## 🔔 Alert Indicators

**Red Alert Card:**
- Appears when integrity score < 50%
- Suggests actions: Schedule viva, compare attempts, flag for review

**Green Success Card:**
- Appears when integrity score ≥ 70%
- Confirms healthy authentication profile

---

## 📊 Stats Cards (Overview)

**Submissions Card:**
- Shows total submission count
- Shows how many are graded
- Click to view full list

**Integrity Flags Card:**
- Shows count of flagged submissions
- Red highlight if count > 0
- Click to review flagged students

**Avg. Score Card:**
- Shows assignment average
- Compare to target

**Viva Completion Card:**
- Shows viva progress percentage

---

## 🛠️ Troubleshooting

**Q: Submission not showing?**
A: Check if student ID exists in mock data. Refresh page.

**Q: Playback not working?**
A: Ensure code is not empty. Check browser console for errors.

**Q: Timeline chart not displaying?**
A: Verify keystroke data exists. Check data format.

**Q: No flagged submissions?**
A: This is good! Means all students have integrity score ≥ 50%.

---

## 📱 Mobile Support

All pages are fully responsive:
- Submissions table scrolls horizontally on mobile
- Playback controls stack vertically on small screens
- Timeline chart adjusts to screen width
- Sidebar becomes collapsible on mobile

---

## 🔒 Permissions

**Who Can Access:**
- ✅ Instructors (of the course)
- ✅ Course TAs (if implemented)
- ❌ Students (cannot view other students' submissions)
- ❌ System admins (unless explicitly granted)

---

**Need Help?** 
Check the full implementation guide: [SUBMISSIONS_INTEGRITY_IMPLEMENTATION.md](./SUBMISSIONS_INTEGRITY_IMPLEMENTATION.md)
