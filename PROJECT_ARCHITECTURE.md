# PROJECT_ARCHITECTURE.md

## Coaching Institute Management App (Final Academic Workflow Freeze)

Stack:
- Expo Router
- React Native + TypeScript
- Firebase Auth
- Firestore

This document freezes the app architecture around **subject-slot operations**.

---

## 1) Core Academic Unit

The app operates on one unit everywhere:

`classLevel + batch + subject`

Examples:
- `11 | 6am-7am | Physics`
- `11 | 7am-8am | Chemistry`

---

## 2) Data Model Hierarchy

| Layer | Collection / Field | Role |
|-------|-------------------|------|
| **Institute Source of Truth** | `academicStructure` | Canonical registry of all subject slots and teacher assignments |
| **Denormalized User View** | `users.assignedSubjects` | Per-user copy used for dashboards, context selection, and module filtering |

Rules:
- Owner creates and edits slots in `academicStructure`.
- Changes propagate to `users.assignedSubjects` via sync (`subjectSlotSync`).
- UI reads user profiles for active-slot context; institute admin screens may read `academicStructure` directly.
- Legacy user fields (`assignedBatches`, `classLevel`, `batch`, `subjects`) are normalized on read and removed on write.

---

## 3) Users Collection Model

Collection: `users`

```ts
{
  name: string,
  mobile: string,
  role: "owner" | "teacher" | "student",
  institutionCode: string | null,
  assignedSubjects: [
    {
      classLevel: string,
      batch: string,
      subject: string,
      teacherId?: string,      // students only
      teacherName?: string     // students only
    }
  ],
  createdAt: number
}
```

Notes:
- `assignedSubjects` is the **denormalized user view** — not the institute registry.
- Teachers and owners store teaching slots only (no `teacherId` / `teacherName`).
- Students include `teacherId` / `teacherName` from matching `academicStructure` entries.
- Legacy fields may exist in old docs and are normalized to `assignedSubjects` during reads.

---

## 4) Role Capabilities

### Owner
- Institute operations: manage students, teachers, subject slots, fees.
- Teaching operations: same quick actions as teacher for owner’s own assigned subjects.
- Owner appears in teacher assignment lists.

### Teacher
- Access only their `assignedSubjects`.
- Slot-context quick actions: attendance, notes, announcements, doubts.

### Student
- Sees own `assignedSubjects`.
- Selects one active subject slot and gets filtered modules.

---

## 5) Routing Structure (Preserved)

`src/app/`
- `(auth)`
- `(owner)`
- `(teacher)`
- `(student)`

No duplicate routing systems.

---

## 6) Dashboards (Single Dynamic Dashboard Per Role)

### Student Dashboard
- Top: selectable subject-slot cards.
- Active context header.
- Modules filtered by active slot: notes, attendance, announcements, doubts, fees.

### Teacher Dashboard
- Top: selectable teaching subject-slot cards.
- Active context header.
- Quick actions bound to active slot only.

### Owner Dashboard
- Institute management section.
- Teaching section with reusable teacher workflows and active slot context.

---

## 7) Academic Structure / Subject Slots

Collection: `academicStructure` — **Institute Source of Truth**

```ts
{
  classLevel: string,
  batch: string,
  subject: string,
  assignedTeacherId?: string,
  assignedTeacherName?: string,
  createdAt: number
}
```

Rules:
- Duplicate prevention on `(classLevel, batch, subject)`.
- Owner can create and assign teacher/owner to slots.
- Slot changes sync to `users.assignedSubjects` for affected teachers and students.

---

## 8) Firestore Collections

Only:
- `users`
- `academicStructure`
- `notes`
- `announcements`
- `attendance`
- `doubts`
- `fees`

---

## 9) Notes Foundation

Collection: `notes`

```ts
{
  title: string,
  description: string,
  classLevel: string,
  batch: string,
  subject: string,
  uploadedBy?: string,
  uploadedAt: number,
  pdfUrl?: string
}
```

Cloudinary upload flow is intentionally deferred.

---

## 10) Attendance Foundation

Collection: `attendance`

```ts
{
  studentId: string,
  classLevel: string,
  batch: string,
  subject: string,
  date: string,
  status: "present" | "absent",
  markedBy: string,
  createdAt: number
}
```

Designed for date-wise, teacher-filtered, student-specific tracking by subject slot.

---

## 11) Announcements Foundation

Collection: `announcements`

```ts
{
  title: string,
  message: string,
  targetType: "institute" | "singleSlot" | "multiSlot",
  classLevel?: string,
  batch?: string,
  subject?: string,
  multiSlots?: [{ classLevel, batch, subject }],
  createdBy?: string,
  createdAt: number
}
```

Student views include:
- targeted slot announcements
- institute-wide announcements

---

## 12) Fees Foundation

Collection: `fees`

```ts
{
  studentId: string,
  amount: number,
  dueDate: string,
  status: "pending" | "paid",
  createdAt: number
}
```

Notes:
- Scoped to a student; filter by `studentId` for student fee views.
- Owner dashboard pending-fees count uses `status == "pending"`.
- Slot-level fee filtering (by `classLevel + batch + subject`) may be added in a later phase if needed.

---

## 13) Doubts Foundation

Collection: `doubts`

```ts
{
  studentId: string,
  teacherId: string,
  subject: string,
  question: string,
  answer?: string,
  status: "open" | "resolved",
  createdAt: number
}
```

Notes:
- `teacherId` is the assigned teacher for the doubt.
- `subject` identifies the subject context (may be combined with active slot context in UI).
- Teachers see open doubts for their students; students see their own doubt history.

---

## 14) Filtering Contract (Reusable)

All current and future modules must filter by:
- `classLevel`
- `batch`
- `subject`

Applied to:
- notes
- attendance
- announcements
- doubts (where slot context applies)
- fees (where slot context applies)

---

## 15) Folder Architecture

`src/`
- `app/(auth|owner|teacher|student)`
- `components/batch`
- `components/dashboard`
- `components/owner`
- `context/BatchContext.tsx` (active subject-slot context)
- `firebase/*` (service layer)
- `hooks/*`
- `services/*` (slot utils + filtering)
- `types/*`

---

## 16) Guardrails

- Preserve stable auth and routing flows.
- No duplicate dashboards.
- No unnecessary libraries.
- Keep code beginner-readable and reusable.
- Build scalable foundations only; avoid production-heavy features in this phase.
- Treat `academicStructure` as institute truth; keep `users.assignedSubjects` in sync after structure changes.
