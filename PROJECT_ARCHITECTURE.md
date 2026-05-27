# PROJECT_ARCHITECTURE.md

# Coaching Institute Management App

Modern lightweight coaching ERP + LMS hybrid application built using:
- Expo React Native
- Expo Router
- Firebase Auth
- Firestore
- Cloudinary

Primary Goal:
Create a simple, scalable, mobile-first coaching management system for:
- owners
- teachers
- students

The app should prioritize:
- simplicity
- fast usage
- clean UX
- low confusion
- batch clarity
- subject clarity
- owner ease-of-management

--------------------------------------------------

# 1. TECH STACK

Frontend:
- Expo React Native
- Expo Router
- TypeScript

Backend:
- Firebase Auth
- Firestore Database

Storage:
- Cloudinary

Hosting:
- Vercel PWA later

State:
- useState/useEffect initially
- scalable later to Zustand if required

--------------------------------------------------

# 2. USER ROLES

## OWNER

Institute admin + can also teach.

Permissions:
- manage all students
- manage all teachers
- assign teachers
- create/edit/delete batches
- create/edit/delete academic structures
- manage fees
- upload notes
- send announcements
- manage attendance
- manage doubts
- access analytics
- access all data

Owner has full access.

--------------------------------------------------

## TEACHER

Permissions:
- access assigned batches only
- upload notes for assigned batches
- attendance for assigned students only
- send announcements to assigned batches only
- answer student doubts
- view assigned students

Restrictions:
- cannot manage fees
- cannot assign teachers
- cannot access all institute students
- cannot modify institute structures

--------------------------------------------------

## STUDENT

Permissions:
- view assigned batch data
- view notes
- view attendance
- view announcements
- view fees
- ask doubts

Restrictions:
- only assigned class/batch/subject data visible

--------------------------------------------------

# 3. FIRESTORE COLLECTIONS

## users

Primary batch model (single source of truth):

{
  name,
  mobile,
  role,
  institutionCode,
  assignedBatches: [
    {
      classLevel: "11",
      batch: "Morning",
      subjects: ["Physics", "Chemistry"]
    }
  ],
  createdAt
}

Notes:
- `assignedBatches` is used for owner, teacher, and student.
- Legacy `classLevel`, `batch`, `subjects` fields may exist in old documents and are migrated into `assignedBatches` on read.
- A user may have multiple batch assignments.

--------------------------------------------------

## academicStructure

Fields:

{
  classLevel,

  batch,

  subjects: [],

  assignedTeachers: [],

  createdAt
}

Purpose:
Central academic configuration.

--------------------------------------------------

## notes

Fields:

{
  title,

  description,

  pdfUrl,

  classLevel,
  batch,
  subject,

  uploadedBy,

  uploadedAt
}

Purpose:
PDF notes/resources.

--------------------------------------------------

## announcements

Fields:

{
  title,

  message,

  targetType,

  classLevel,
  batch,
  subject,

  multiBatches: [],

  createdBy,

  createdAt
}

targetType values:
- all
- class
- batch
- multibatch
- subject

--------------------------------------------------

## attendance

Fields:

{
  studentId,

  classLevel,
  batch,
  subject,

  date,

  status,

  markedBy,

  createdAt
}

status values:
- present
- absent

--------------------------------------------------

## doubts

Fields:

{
  studentId,
  teacherId,

  classLevel,
  batch,
  subject,

  message,

  reply,

  status,

  createdAt
}

status values:
- pending
- answered

--------------------------------------------------

## fees

Fields:

{
  studentId,

  amount,

  status,

  dueDate,

  updatedBy,

  updatedAt
}

status values:
- paid
- pending

--------------------------------------------------

# 4. ROLE ACCESS MATRIX

| Feature | Owner | Teacher | Student |
|---|---|---|---|
| All Students | YES | NO | NO |
| Assigned Students | YES | YES | NO |
| Upload Notes | YES | YES | NO |
| Batch Notes View | YES | YES | YES |
| Attendance | YES | YES assigned only | View only |
| Fees | YES | NO | View only |
| Announcements | YES | YES assigned only | View only |
| Doubts | YES | YES | YES |
| Assign Teachers | YES | NO | NO |
| Manage Batches | YES | NO | NO |

--------------------------------------------------

# 5. BATCH CONTEXT ARCHITECTURE

Core principle:
- One dynamic dashboard per role (not separate dashboards per batch).
- User selects an active batch card → session context updates.
- All modules filter using the active batch context.

Implementation:
- `BatchContextProvider` stores `activeBatch` for the session.
- `BatchSelector` + `BatchCard` for selectable batch UI.
- `batchFiltering.ts` filters notes, announcements, attendance, doubts, fees.
- `batchUtils.ts` normalizes and deduplicates `assignedBatches`.

Legacy migration:
- If `assignedBatches` is empty but legacy `classLevel` + `batch` exist, they are merged on read.

--------------------------------------------------

# 6. DASHBOARD UX ARCHITECTURE

IMPORTANT:
Dashboard UX should minimize confusion between:
- classes
- batches
- subjects

The app should always make users understand:
1. active batch context
2. current subject scope (within batch)
3. current notifications
4. current resources

without deep navigation confusion.

--------------------------------------------------

# 7. OWNER DASHBOARD UX

Section 1 — Institute management:
- overview cards (students, teachers, pending fees)
- manage academic structure
- manage students (create/edit/delete, multi-batch assignment)
- manage teachers (create/edit/delete, multi-batch assignment)

Section 2 — Personal teaching (reuses teacher workflow):
- selectable assigned teaching batches
- batch-context quick actions (notes, attendance, announcements, doubts)
- owner uses the same teacher screens for teaching tools

--------------------------------------------------

# 8. TEACHER DASHBOARD UX

1. Selectable assigned batch cards (only assigned batches visible)
2. Active batch context header
3. Quick actions apply ONLY to active batch
4. Teacher cannot access unrelated batches

--------------------------------------------------

# 9. STUDENT DASHBOARD UX

1. "Your Batches" — horizontal selectable batch cards
2. Active batch context header
3. One dashboard; modules unlock after batch selection
4. Filtered modules: notes, attendance, fees, announcements, doubts

Student must select a batch before module screens show batch-filtered data.

--------------------------------------------------

NOTES UX:

Student first sees:
Subject Cards

Example:
- Physics
- Chemistry
- Math

After selecting subject:
show notes/resources.

This avoids mixed content confusion.

--------------------------------------------------

ANNOUNCEMENT UX:

Each announcement must display:
- target batch label
- subject label

Example:
[11 Morning - Physics]

--------------------------------------------------

ATTENDANCE UX:

Subject-wise attendance cards.

Example:
- Physics Attendance
- Chemistry Attendance

Simple percentages.

--------------------------------------------------

# 10. MANAGE STUDENTS FEATURE

Owner only.

Features:
- create / edit / delete student
- multi-batch assignment UX (`MultiBatchAssignment`)
- multiple subjects per batch
- remove individual batch assignments

Uses `assignedBatches[]` as stored model.

--------------------------------------------------

# 11. MANAGE TEACHERS FEATURE

Owner only.

Features:
- create / edit / delete teacher
- assign multiple teaching batches
- assign multiple subjects per batch
- remove batch assignments

Teacher list shows all assigned batches per teacher.

--------------------------------------------------

# 12. MULTI-BATCH ANNOUNCEMENTS (planned)

Announcements support:
- single batch
- multi-batch (`multiBatches`)
- class-wide / institute-wide targets

Teachers: only assigned batches.
Owner: all institute targets.

--------------------------------------------------

# 12. NOTES SYSTEM

Teacher uploads:
- title
- description
- PDF
- batch
- subject

PDF uploaded to:
Cloudinary

Metadata stored in:
Firestore.

Students only see:
matching notes.

--------------------------------------------------

# 13. ANNOUNCEMENT SYSTEM

Owner:
can send to:
- all students
- class-wise
- batch-wise
- multi-batch
- subject-wise

Teacher:
can send ONLY to assigned batches.

Announcements should support:
- priority flag
- pinned flag later

--------------------------------------------------

# 14. ATTENDANCE SYSTEM

Teacher marks attendance:
subject-wise
batch-wise

Students view:
subject-wise attendance only.

Owner can view:
full institute attendance.

--------------------------------------------------

# 15. FEES SYSTEM

Owner only management.

Features:
- pending
- paid
- due dates
- fee reminders

Students only view:
their fee data.

--------------------------------------------------

# 16. DOUBTS SYSTEM

Students:
ask doubts subject-wise.

Teachers:
reply to assigned students only.

Owner:
can monitor all doubts.

--------------------------------------------------

# 17. FINAL FOLDER STRUCTURE

src/

  app/
    (auth)
    (owner)
    (teacher)
    (student)

  components/
    batch/
      BatchCard.tsx
      BatchSelector.tsx
      BatchContextWrapper.tsx
      ContextHeader.tsx
      DashboardSection.tsx
      EmptyState.tsx
      MultiBatchAssignment.tsx
      BatchFilteredListScreen.tsx
    owner/
      ManageUserForm.tsx
    dashboard/

  context/
    BatchContext.tsx

  firebase/
    auth.ts
    firestore.ts
    instituteAuth.ts
    notes.ts
    attendance.ts
    announcements.ts
    doubts.ts
    fees.ts
    academic.ts

  hooks/
    useCurrentUser.ts
    useUserBatches.ts

  services/
    batchUtils.ts
    batchFiltering.ts
    academicGrouping.ts
    roleRouting.ts

  constants/

  types/
    user.ts
    academic.ts

--------------------------------------------------

# 18. MVP PRIORITY ORDER

1. Role System
2. Teacher Assignment
3. Notes Upload/View
4. Announcements
5. Attendance
6. Fees
7. Doubts

--------------------------------------------------

# 19. IMPORTANT DEVELOPMENT RULES

- maintain clean scalable architecture
- avoid duplicate Firestore schemas
- avoid hardcoded batch names
- all batch/subject data should come from Firestore
- reusable components preferred
- keep mobile-first UX
- reduce student confusion
- owner operations should require minimum clicks
- teacher workflows should be batch-context based

--------------------------------------------------

# 20. CURSOR IMPLEMENTATION GOAL

Cursor should:
- generate scalable pages
- generate CRUD systems
- maintain role restrictions
- implement filtering correctly
- implement Cloudinary uploads
- keep clean TypeScript architecture
- keep reusable UI components
- keep responsive PWA-friendly layouts