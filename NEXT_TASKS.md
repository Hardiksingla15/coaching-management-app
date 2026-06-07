# NEXT_TASKS.md

**Project:** Coaching Institute Management App  
**Last updated:** June 7, 2026  
**Architecture reference:** [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)  
**Status reference:** [PROJECT_STATUS.md](./PROJECT_STATUS.md)

Tasks are priority-ordered. Complete P0 before building new modules.

---

## P0 — Security & Data Integrity

### 1. Add Firestore security rules
- [ ] Create `firestore.rules` in repo
- [ ] Owner: full read/write on `users`, `academicStructure`, admin collections
- [ ] Teacher: read own profile; write slot-scoped `notes`, `attendance`, `announcements`, `doubts`
- [ ] Student: read own profile; read slot-filtered content; write own `doubts`, read own `fees`
- [ ] Block client writes to `role` field
- [ ] Deploy rules to Firebase project

### 2. Close sync gap after ManageUserForm save
- [ ] After student save → call `syncStudentTeacherFieldsFromStructure()`
- [ ] After teacher save → call `syncAllTeachableSlotsFromStructure()`
- [ ] Aligns `users.assignedSubjects` with `academicStructure` per architecture Section 2

### 3. Lock note writes to active slot
- [ ] Remove subject override field in `(teacher)/uploads.tsx`
- [ ] Always write `activeBatch.classLevel`, `activeBatch.batch`, `activeBatch.subject`
- [ ] Set `uploadedBy` from current user UID

---

## P1 — Core Module Implementation

### 4. Fees module
Schema (architecture Section 12):
```ts
{ studentId, amount, dueDate, status: "pending" | "paid", createdAt }
```
- [ ] Add `FeeRecord` type in `src/types/` or `src/firebase/fees.ts`
- [ ] Implement `addFee`, `updateFeeStatus`, `getFeesForStudent`
- [ ] Owner: create / mark paid UI
- [ ] Student: view own fees in `(student)/fees.tsx`
- [ ] Wire owner dashboard Fees card (replace `onPress={() => {}}`)

### 5. Doubts module
Schema (architecture Section 13):
```ts
{ studentId, teacherId, subject, question, answer?, status: "open" | "resolved", createdAt }
```
- [ ] Add `DoubtRecord` type
- [ ] Implement `addDoubt`, `answerDoubt`, `getDoubtsForStudent`, `getOpenDoubtsForTeacher`
- [ ] Student `(student)/doubts.tsx`: ask + view history
- [ ] Teacher `(teacher)/doubts.tsx`: inbox + answer flow

### 6. Attendance module
Schema (architecture Section 10):
- [ ] Teacher `(teacher)/attendance.tsx`: mark present/absent for students in active slot
- [ ] Student `(student)/attendance.tsx`: view own records for active slot
- [ ] Use deterministic doc ID or duplicate check (`studentId + date + slot`)
- [ ] Query by `classLevel + batch + subject` (not full collection scan)

### 7. Teacher announcements UI
Schema (architecture Section 11):
- [ ] Wire `(teacher)/announcements.tsx` to `addAnnouncement()`
- [ ] Target active slot (`targetType: "singleSlot"`)
- [ ] Set `createdBy` from current user UID
- [ ] Student read path already works in `notifications.tsx`

---

## P2 — Architecture & Scalability

### 8. Replace full-collection reads with slot queries
- [ ] `getNotesForSlot` — Firestore `where` on `classLevel`, `batch`, `subject`
- [ ] `getAnnouncementsForSlot` — indexed `targetSlotKeys` or equivalent
- [ ] Document required composite indexes in architecture or `firestore.indexes.json`

### 9. Incremental slot sync (replace bulk teacher rebuild)
- [ ] On slot edit: update only old + new `assignedTeacherId` profiles
- [ ] On slot delete: update only affected teacher + students
- [ ] Reduces write volume at scale

### 10. Route-level role guards
- [ ] Check `user.role` in `(owner)/_layout.tsx` — redirect non-owners
- [ ] Optional guards for `(teacher)` and `(student)` groups
- [ ] Complement Firestore rules (UI layer only)

### 11. Add `slotKey` field to feature documents
- [ ] Normalize `classLevel::batch::subject` on writes for notes, attendance, announcements
- [ ] Enables simpler queries and future cross-module filtering

---

## P3 — Cleanup & Polish

### 12. TypeScript & dead code cleanup
- [ ] Remove or fix `src/components/ui/collapsible.tsx`
- [ ] Fix or remove `src/hooks/use-theme.ts` errors
- [ ] Delete unused: `RoleCard`, `TeacherQuickActions`, `AssignedBatchesList`, `CurrentBatchCard`, `SectionTitle`

### 13. Move access codes out of client
- [ ] `STUDENT_INSTITUTION_CODE`, `TEACHER_ACCESS_CODE` → env or remote config
- [ ] Or restrict teacher signup to owner-created accounts only

### 14. User delete: remove Auth account
- [ ] Cloud Function or Admin SDK to disable/delete Firebase Auth user on profile delete
- [ ] Document behavior in architecture

### 15. Owner bootstrap documentation
- [ ] Document how to seed first owner account in Firestore + Auth
- [ ] Or add one-time owner setup flow

### 16. PDF notes upload (deferred per architecture)
- [ ] Firebase Storage or Cloudinary integration
- [ ] Populate `pdfUrl` on `notes` documents

---

## Suggested Build Order

```
P0 (rules + sync + note fix)
  → P1: Fees → Doubts → Attendance → Announcements compose
  → P2: Queries + incremental sync + route guards
  → P3: Cleanup + hardening
```

---

## Definition of Done (per module)

- [ ] Matches schema in `PROJECT_ARCHITECTURE.md`
- [ ] Filtered by active subject slot where applicable
- [ ] Firestore rules enforce role access
- [ ] Loading, empty, and error states in UI
- [ ] No full-collection fetch for slot-scoped data
- [ ] `users.assignedSubjects` stays in sync with `academicStructure` after admin changes
