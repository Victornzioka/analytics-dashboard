import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Observable, map, timer } from 'rxjs';
import { ExamApi } from '../../core/exam-api';
import { ExamPayload } from '../../core/models';
import { ExamDashboard } from './exam-dashboard';

/**
 * Same delays as ExamApi, and the same strict `examId ===` filter, so a string id
 * matches nothing just as it does against the real file.
 */
const LATENCY: Record<number, number> = { 9001: 1200, 9002: 250 };

const all: ExamPayload = {
  subjects: ['Mathematics'],
  exams: [
    { id: 9001, name: 'Term 2 Opener', term: 2, year: 2026, satOn: '2026-05-12' },
    { id: 9002, name: 'Term 2 Mid Term', term: 2, year: 2026, satOn: '2026-06-24' },
  ],
  students: [{ id: 1, admissionNumber: 'ADM1', name: 'Juma Maina', form: 3, stream: 'North' }],
  entries: [
    { examId: 9001, studentId: 1, subject: 'Mathematics', score: 40 },
    { examId: 9002, studentId: 1, subject: 'Mathematics', score: 70 },
  ],
};

class SlowApi {
  failNext = false;

  load(examId: number): Observable<ExamPayload> {
    const delay = LATENCY[examId] ?? 400;
    if (this.failNext) {
      this.failNext = false;
      return timer(delay).pipe(map(() => { throw new Error('offline'); }));
    }
    return timer(delay).pipe(
      map(() => ({ ...all, entries: all.entries.filter((e) => e.examId === examId) })),
    );
  }
}

describe('ExamDashboard loading', () => {
  let fixture: ComponentFixture<ExamDashboard>;
  let dash: ExamDashboard;
  let api: SlowApi;

  beforeEach(async () => {
    api = new SlowApi();
    await TestBed.configureTestingModule({
      imports: [ExamDashboard],
      providers: [{ provide: ExamApi, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(ExamDashboard);
    dash = fixture.componentInstance;
  });

  function pickExam(index: number): void {
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    select.value = select.options[index].value;
    select.dispatchEvent(new Event('change'));
  }

  it('keeps the exam the user switched to when an older load lands later', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit starts 9001, which takes 1,200 ms
    dash.selectedExamId = 9002;
    dash.onExamChange(); // 9002 takes 250 ms

    tick(250);
    expect(dash.rows[0].mean).withContext('Mid Term after 250 ms').toBe(70);

    tick(1000);
    expect(dash.rows[0].mean).withContext('still Mid Term once the Opener lands').toBe(70);
    expect(dash.loading).toBeFalse();
  }));

  it('retries the exam picked in the dropdown', fakeAsync(() => {
    fixture.detectChanges();
    tick(1200);
    fixture.detectChanges();
    tick();

    api.failNext = true;
    pickExam(1); // Term 2 Mid Term
    tick(250);
    fixture.detectChanges();
    expect(dash.failed).toBeTrue();

    const retry: HTMLButtonElement = fixture.nativeElement.querySelector('.state button');
    retry.click();
    tick(250);

    expect(dash.rows.length).withContext('candidates after retry').toBe(1);
    expect(dash.rows[0].mean).toBe(70);
  }));
});
