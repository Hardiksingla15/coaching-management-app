export type AcademicStructure = {
  id: string;
  classLevel: string;
  batch: string;
  subjects: string[];
  assignedTeachers?: string[];
  createdAt?: number;
};
