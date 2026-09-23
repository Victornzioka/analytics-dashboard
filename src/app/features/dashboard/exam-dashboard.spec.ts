import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ExamApi } from '../../core/exam-api';
import { ExamPayload } from '../../core/models';
import { ExamDashboard } from './exam-dashboard';

/**
 * Four subjects, so one absence is a quarter of the divisor and cannot hide.
 * North has two candidates and West has one. West scores higher, so an
 * unweighted average of the stream means sits above the mean of the candidates.
 */
const payload: ExamPayload = {
  subjects: ['Mathematics', 'English', 'Kiswahili', 'Biology'],
  exams: [{ id: 9001, name: 'Term 2 Opener', term: 2, year: 2026, satOn: '2026-05-12' }],
  students: [
    { id: 1, admissionNumber: 'ADM1', name: 'Amina Otieno', form: 3, stream: 'North' },
    { id: 2, admissionNumber: 'ADM2', name: 'Baraka Mutua', form: 3, stream: 'North' },
    { id: 3, admissionNumber: 'ADM3', name: 'Chebet Wekesa', form: 3, stream: 'West' },
  ],
  entries: [
    { examId: 9001, studentId: 1, subject: 'Mathematics', score: 80 },
    { examId: 9001, studentId: 1, subject: 'English', score: 80 },
    { examId: 9001, studentId: 1, subject: 'Kiswahili', score: 80 },
    { examId: 9001, studentId: 1, subject: 'Biology', score: 80 },
    // Missed Biology. Slip mean is 240 / 3 = 80. Counting the absence as zero is 60.
    { examId: 9001, studentId: 2, subject: 'Mathematics', score: 80 },
    { examId: 9001, studentId: 2, subject: 'English', score: 80 },
    { examId: 9001, studentId: 2, subject: 'Kiswahili', score: 80 },
    { examId: 9001, studentId: 2, subject: 'Biology', score: null },
    { examId: 9001, studentId: 3, subject: 'Mathematics', score: 90 },
    { examId: 9001, studentId: 3, subject: 'English', score: 90 },
    { examId: 9001, studentId: 3, subject: 'Kiswahili', score: 90 },
    { examId: 9001, studentId: 3, subject: 'Biology', score: 90 },
  ],
};

describe('ExamDashboard means', () => {
  let dash: ExamDashboard;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamDashboard],
      providers: [{ provide: ExamApi, useValue: { load: () => of(payload) } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamDashboard);
    fixture.detectChanges();
    dash = fixture.componentInstance;
  });

  function row(name: string) {
    const found = dash.rows.find((r) => r.name === name);
    if (!found) {
      throw new Error('missing row ' + name);
    }
    return found;
  }

  it('keeps the mean of a student who sat every subject', () => {
    expect(row('Amina Otieno').mean).toBe(80);
  });

  it('averages only the subjects a student sat', () => {
    // 240 / 3, not 240 / 4.
    expect(row('Baraka Mutua').mean).toBe(80);
  });

  it('builds a stream mean from those student means', () => {
    const north = dash.streamRows.find((s) => s.stream === 'North');
    expect(north?.mean).toBe(80);
  });

  it('weights the school mean by candidates', () => {
    // (80 + 80 + 90) / 3 = 83.33. The unweighted stream average is (80 + 90) / 2 = 85.
    expect(dash.schoolMean).toBe(83.33);
  });
});

describe('ExamDashboard with a student who sat nothing', () => {
  it('reports mean 0', async () => {
    const empty: ExamPayload = {
      subjects: ['Mathematics', 'English'],
      exams: [{ id: 9001, name: 'Term 2 Opener', term: 2, year: 2026, satOn: '2026-05-12' }],
      students: [
        { id: 1, admissionNumber: 'ADM1', name: 'Dalmas Kilonzo', form: 3, stream: 'East' },
      ],
      entries: [
        { examId: 9001, studentId: 1, subject: 'Mathematics', score: null },
        { examId: 9001, studentId: 1, subject: 'English', score: null },
      ],
    };

    await TestBed.configureTestingModule({
      imports: [ExamDashboard],
      providers: [{ provide: ExamApi, useValue: { load: () => of(empty) } }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExamDashboard);
    fixture.detectChanges();
    expect(fixture.componentInstance.rows[0].mean).toBe(0);
    expect(fixture.componentInstance.schoolMean).toBe(0);
  });
});
