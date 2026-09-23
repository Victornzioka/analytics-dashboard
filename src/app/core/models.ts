export interface Student {
  id: number;
  admissionNumber: string;
  name: string;
  form: number;
  stream: string;
}

export interface Exam {
  id: number;
  name: string;
  term: number;
  year: number;
  satOn: string;
}

export interface ExamEntry {
  examId: number;
  studentId: number;
  subject: string;
  score: number | null;
}

export interface ExamPayload {
  subjects: string[];
  exams: Exam[];
  students: Student[];
  entries: ExamEntry[];
}

export interface StudentRow {
  studentId: number;
  admissionNumber: string;
  name: string;
  stream: string;
  scores: Record<string, number | null>;
  mean: number;
  grade: string;
  position: number;
}

export interface StreamRow {
  stream: string;
  candidates: number;
  mean: number;
  grade: string;
}
