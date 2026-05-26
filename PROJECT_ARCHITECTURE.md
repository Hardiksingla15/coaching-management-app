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

Fields:

{
  name,
  mobile,
  role,

  institutionCode,

  assignedBatches: [],

  classLevel,
  batch,

  subjects: [],

  createdAt
}

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

# 5. DASHBOARD UX ARCHITECTURE

IMPORTANT:
Dashboard UX should minimize confusion between:
- classes
- batches
- subjects

The app should always make users understand:
1. current batch
2. current subject
3. current notifications
4. current resources

without deep navigation confusion.

--------------------------------------------------

# 6. OWNER DASHBOARD UX

Top Section:
- institute overview cards

Cards:
- total students
- total teachers
- total pending fees
- today attendance

--------------------------------------------------

Middle Section:
Quick Actions Grid

Actions:
- manage students
- manage teachers
- assign teachers
- manage batches
- upload notes
- announcements
- attendance
- fees

--------------------------------------------------

Bottom Section:
Recent Activity Feed

Includes:
- recent uploads
- attendance updates
- fee updates
- announcements

--------------------------------------------------

# 7. TEACHER DASHBOARD UX

Top:
Assigned Batch Cards

Example:
- 11 Morning
- 12 Evening

Teacher first selects batch.

This avoids confusion.

--------------------------------------------------

After Batch Selection:
Dashboard switches context to selected batch.

Then shows:
- notes
- attendance
- announcements
- doubts

ONLY for selected batch.

--------------------------------------------------

Quick Actions:
- upload note
- mark attendance
- send announcement
- answer doubts

--------------------------------------------------

# 8. STUDENT DASHBOARD UX

IMPORTANT:
Student UX should prioritize:
- clarity
- low confusion
- quick access

--------------------------------------------------

Top Section:
Current Batch Card

Example:
- Class 11
- Morning Batch
- Physics/Chemistry

Student always sees:
current assigned batch context.

--------------------------------------------------

Middle Section:
Important Notification Card

Global notifications shown separately.

Includes:
- urgent notices
- fee reminders
- exam notices

--------------------------------------------------

Main Dashboard Sections:

1. Notes Card
2. Attendance Card
3. Fees Card
4. Doubts Card

Each card clearly shows:
- subject
- batch label
- latest updates

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

# 9. MANAGE STUDENTS FEATURE

Owner only.

Features:
- create
- edit
- update
- delete
- assign batch
- assign subjects
- assign teacher mapping

Student cards should show:
- name
- class
- batch
- subjects
- fee status

Search + filter required.

--------------------------------------------------

# 10. MANAGE TEACHERS FEATURE

Owner only.

Features:
- create
- edit
- delete
- assign batches
- assign subjects

Teacher cards should show:
- assigned batches
- assigned subjects

--------------------------------------------------

# 11. ASSIGN TEACHERS SYSTEM

Owner selects:
- class
- batch
- subject

Then:
assign teacher.

Teacher only sees assigned data after login.

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

  firebase/
    auth.ts
    firestore.ts
    notes.ts
    attendance.ts
    announcements.ts
    doubts.ts
    fees.ts

  hooks/

  services/

  constants/

  types/

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