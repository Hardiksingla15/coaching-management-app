# PROJECT_STATUS.md

**Project:** Coaching Institute Management App  
**Last updated:** June 7, 2026  
**Architecture reference:** [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)

---

## Overall Maturity

| Area | Status | Estimate |
|------|--------|----------|
| Auth & routing | ✅ Complete | 100% |
| Data model & sync | ✅ Mostly complete | 85% |
| Owner institute admin | ✅ Complete | 90% |
| Batch/slot context layer | ✅ Complete | 95% |
| Teaching modules | ⚠️ Partial | 25% |
| Student modules | ⚠️ Partial | 40% |
| Security (Firestore rules) | ❌ Not started | 0% |
| Tests & CI | ❌ Not started | 0% |

**Summary:** Foundation is solid — role routing, subject-slot model, owner CRUD, and shared context work. Most teaching/student modules beyond notes and announcement reading are placeholders. Security rules are not in the repo.

---

## Data Model Status

| Layer | Status | Notes |
|-------|--------|-------|
| `academicStructure` (institute truth) | ✅ Working | Owner CRUD in `manage-batches.tsx` |
| `users.assignedSubjects` (denormalized view) | ✅ Working | Sync via `subjectSlotSync.ts` after slot changes |
| Legacy field migration | ✅ Working | Normalized on read; stripped on write |
| Teacher list display | ✅ Working | Reads from `academicStructure` |
| Teacher dashboard slots | ✅ Working | Reads from synced `assignedSubjects` |
| Student list display | ✅ Working | Enriched with structure teacher names |
| `ManageUserForm` → sync gap | ⚠️ Partial | Direct user writes; no auto-sync after save |

---

## Module Status

### Authentication
| Feature | Status |
|---------|--------|
| Login (mobile + password) | ✅ Complete |
| Signup (student / teacher) | ✅ Complete |
| Owner account creation | ⚠️ Manual seed only (no signup UI) |
| Role-based redirect | ✅ Complete |
| Route-level role guards | ❌ Not implemented |

### Owner — Institute Management
| Feature | Status |
|---------|--------|
| Dashboard stats (students, teachers, pending fees) | ✅ Complete |
| Manage subject slots (add / edit / delete) | ✅ Complete |
| Assign teacher to slots | ✅ Complete |
| Student list + create / edit | ✅ Complete |
| Teacher list + create / edit | ✅ Complete |
| Fees management UI | ❌ Placeholder (dashboard card disabled) |
| Delete user (Firestore profile) | ✅ Complete |
| Delete user (Firebase Auth) | ❌ Not implemented |

### Owner / Teacher — Teaching Tools
| Feature | Status |
|---------|--------|
| Subject-slot selector (BatchContext) | ✅ Complete |
| Quick actions (attendance, uploads, announcements, doubts) | ⚠️ Navigation only |
| Upload notes (text) | ✅ Complete |
| Mark attendance | ❌ Placeholder |
| Send announcements | ❌ Placeholder |
| Answer doubts | ❌ Placeholder |

### Student Modules
| Feature | Status |
|---------|--------|
| Subject-slot selector | ✅ Complete |
| View notes (slot-filtered) | ✅ Complete |
| View announcements (slot-filtered) | ✅ Complete |
| View attendance | ❌ Placeholder |
| View / pay fees | ❌ Placeholder |
| Ask / view doubts | ❌ Placeholder |

---

## Firestore Collections

| Collection | Schema in architecture | Code typed | UI wired |
|------------|------------------------|------------|----------|
| `users` | ✅ | ✅ | ✅ |
| `academicStructure` | ✅ | ✅ | ✅ |
| `notes` | ✅ | ✅ | ✅ (text only; no PDF) |
| `announcements` | ✅ | ✅ | ⚠️ Read only (student) |
| `attendance` | ✅ | ✅ | ❌ |
| `fees` | ✅ | ❌ Untyped | ❌ (count only on dashboard) |
| `doubts` | ✅ | ❌ Untyped | ❌ |

---

## Known Issues (Open)

| Issue | Severity | Notes |
|-------|----------|-------|
| No Firestore security rules in repo | Critical | All permissions are client-side |
| Hardcoded signup access codes in app | High | `appConstants.ts` |
| Teacher uploads can override `subject` field | Medium | Breaks slot filtering contract |
| `ManageUserForm` save does not trigger profile sync | Medium | Can diverge from `academicStructure` |
| Full-collection fetch for notes / announcements | Medium | Scalability risk |
| Bulk teacher sync on every slot change | Medium | Updates all teachables each time |
| `uploadedBy` not set on note writes | Low | Schema field unused |
| TypeScript errors in unused template files | Low | `collapsible.tsx`, `use-theme.ts` |
| Dead components in repo | Low | `RoleCard`, `TeacherQuickActions`, etc. |

---

## Recently Completed

- Subject-slot CRUD with teacher assignment and profile sync
- Fix: Firestore `undefined` values on teacher profile sync
- Fix: Delete slot UX (inline confirmation, resilient delete order)
- Teachers tab reads slots from `academicStructure`
- Students tab enriches slots with structure teacher names
- Architecture doc: data model hierarchy, fees schema, doubts schema

---

## Tech Stack

- **Expo** ~54, **Expo Router** ~6
- **React Native** 0.81, **React** 19
- **Firebase** 12 (Auth + Firestore)
- **TypeScript** 5.9
- ~98 source files, 21 screens, 7 Firestore collections
