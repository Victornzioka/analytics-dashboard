import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ExamApi } from '../../core/exam-api';
import { Exam, ExamEntry, ExamPayload, Student, StreamRow, StudentRow } from '../../core/models';
import { StreamComparison } from '../streams/stream-comparison';

/**
 * The exam dashboard a school opens after results are entered.
 *
 * This component has grown with the product. Everything it does today is what the
 * school sees today.
 */
@Component({
  selector: 'app-exam-dashboard',
  standalone: true,
  imports: [FormsModule, DecimalPipe, StreamComparison],
  templateUrl: './exam-dashboard.html',
  styleUrl: './exam-dashboard.css',
})
export class ExamDashboard implements OnInit {
  exams: Exam[] = [];
  subjects: string[] = [];
  students: Student[] = [];
  entries: ExamEntry[] = [];

  selectedExamId = 9001;
  search = '';
  streamFilter = 'ALL';
  sortField: 'position' | 'name' | 'mean' | 'stream' = 'position';
  sortDir: 'asc' | 'desc' = 'asc';

  loading = false;
  failed = false;

  // Derived once per exam load, then refiltered when search, stream or sort change.
  // Change detection reads these on every keystroke, so they must not be getters.
  rows: StudentRow[] = [];
  streamRows: StreamRow[] = [];
  schoolMean = 0;
  streamNames: string[] = ['ALL'];
  filteredRows: StudentRow[] = [];
  visibleRows: StudentRow[] = [];

  private destroyRef = inject(DestroyRef);
  private load?: Subscription;

  constructor(private api: ExamApi) {}

  ngOnInit(): void {
    this.loadExam(this.selectedExamId);
  }

  loadExam(examId: number): void {
    // Exams load at different speeds. An older request left running can land
    // after the newer one and paint the wrong exam.
    this.load?.unsubscribe();
    this.loading = true;
    this.failed = false;
    this.load = this.api
      .load(examId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (payload: ExamPayload) => {
          this.exams = payload.exams;
          this.subjects = payload.subjects;
          this.students = payload.students;
          this.entries = payload.entries;
          this.derive();
          this.loading = false;
        },
        error: () => {
          this.failed = true;
          this.loading = false;
        },
      });
  }

  onExamChange(): void {
    this.loadExam(this.selectedExamId);
  }

  // ------------------------------------------------------------------ derived data

  private derive(): void {
    this.rows = this.buildRows();
    this.streamRows = this.buildStreamRows();
    this.schoolMean = this.buildSchoolMean();
    this.streamNames = this.buildStreamNames();
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredRows = this.buildFilteredRows();
    this.visibleRows = this.filteredRows.slice(0, 100);
  }

  private buildRows(): StudentRow[] {
    const byStudent = new Map<number, ExamEntry[]>();
    for (const entry of this.entries) {
      const list = byStudent.get(entry.studentId);
      if (list) {
        list.push(entry);
      } else {
        byStudent.set(entry.studentId, [entry]);
      }
    }

    const rows: StudentRow[] = [];
    for (const student of this.students) {
      const studentEntries = byStudent.get(student.id);
      if (!studentEntries) {
        continue;
      }

      const scores: Record<string, number | null> = {};
      let total = 0;
      let sat = 0;
      for (const entry of studentEntries) {
        scores[entry.subject] = entry.score;
        if (entry.score !== null) {
          total = total + entry.score;
          sat = sat + 1;
        }
      }

      // An absence is a paper not sat. Counting it as zero made the on-screen
      // mean lower than the printed slip.
      const mean = sat === 0 ? 0 : Math.round((total / sat) * 100) / 100;

      rows.push({
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        name: student.name,
        stream: student.stream,
        scores,
        mean,
        grade: this.gradeFor(mean),
        position: 0,
      });
    }

    rows.sort((a, b) => b.mean - a.mean);
    for (let i = 0; i < rows.length; i++) {
      rows[i].position = i + 1;
    }
    return rows;
  }

  private buildFilteredRows(): StudentRow[] {
    let out = this.rows;

    if (this.search.length >= 2) {
      const needle = this.search.toLowerCase();
      out = out.filter(
        (r) =>
          r.name.toLowerCase().includes(needle) ||
          r.admissionNumber.toLowerCase().includes(needle),
      );
    }

    if (this.streamFilter !== 'ALL') {
      out = out.filter((r) => r.stream === this.streamFilter);
    }

    out = out.slice().sort((a, b) => {
      let cmp = 0;
      if (this.sortField === 'mean') {
        cmp = a.mean - b.mean;
      } else if (this.sortField === 'position') {
        cmp = a.position - b.position;
      } else if (this.sortField === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = a.stream.localeCompare(b.stream);
      }
      return this.sortDir === 'asc' ? cmp : -cmp;
    });

    return out;
  }

  private buildStreamRows(): StreamRow[] {
    const byStream = new Map<string, StudentRow[]>();
    for (const row of this.rows) {
      const list = byStream.get(row.stream);
      if (list) {
        list.push(row);
      } else {
        byStream.set(row.stream, [row]);
      }
    }

    const out: StreamRow[] = [];
    byStream.forEach((rows, stream) => {
      let total = 0;
      for (const r of rows) {
        total = total + r.mean;
      }
      const mean = rows.length === 0 ? 0 : total / rows.length;
      out.push({
        stream,
        candidates: rows.length,
        mean: Math.round(mean * 100) / 100,
        grade: this.gradeFor(mean),
      });
    });

    out.sort((a, b) => b.mean - a.mean);
    return out;
  }

  private buildSchoolMean(): number {
    const candidates = this.rows;
    if (candidates.length === 0) {
      return 0;
    }
    // Each candidate counts once. Averaging the stream means gives the
    // smallest stream the same weight as the largest.
    let total = 0;
    for (const row of candidates) {
      total = total + row.mean;
    }
    return Math.round((total / candidates.length) * 100) / 100;
  }

  get schoolGrade(): string {
    return this.gradeFor(this.schoolMean);
  }

  private buildStreamNames(): string[] {
    const names = new Set<string>();
    for (const student of this.students) {
      names.add(student.stream);
    }
    return ['ALL', ...names];
  }

  get candidateCount(): number {
    return this.rows.length;
  }

  // ------------------------------------------------------------------ template helpers

  scoreFor(row: StudentRow, subject: string): string {
    const score = row.scores[subject];
    return score === null || score === undefined ? 'ABS' : String(score);
  }

  gradeFor(score: number): string {
    if (score >= 80) return 'A';
    if (score >= 75) return 'A-';
    if (score >= 70) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 60) return 'B-';
    if (score >= 55) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 45) return 'C-';
    if (score >= 40) return 'D+';
    if (score >= 35) return 'D';
    if (score >= 30) return 'D-';
    return 'E';
  }

  sortBy(field: 'position' | 'name' | 'mean' | 'stream'): void {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.applyFilters();
  }
}
