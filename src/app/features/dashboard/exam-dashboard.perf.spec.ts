import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ExamApi } from '../../core/exam-api';
import { ExamPayload } from '../../core/models';
import { ExamDashboard } from './exam-dashboard';

/**
 * Runs against the real 3,000-student file so the numbers match what a big school sees.
 */
describe('ExamDashboard search on a full school', () => {
  let payload: ExamPayload;
  let fixture: ComponentFixture<ExamDashboard>;
  let dash: ExamDashboard;
  let input: HTMLInputElement;

  beforeAll(async () => {
    const all: ExamPayload = await (await fetch('/exam-results.json')).json();
    payload = { ...all, entries: all.entries.filter((e) => e.examId === 9001) };
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamDashboard],
      providers: [{ provide: ExamApi, useValue: { load: () => of(payload) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ExamDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    dash = fixture.componentInstance;
    input = fixture.nativeElement.querySelector('input');
  });

  function type(text: string): number {
    const start = performance.now();
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    return performance.now() - start;
  }

  it('does not rebuild the candidate rows on a keystroke', () => {
    const before = dash.rows;
    type('wa');
    expect(dash.rows === before).withContext('rows rebuilt by a keystroke').toBeTrue();
  });

  it('still filters by what was typed', () => {
    type('ADM2400');
    expect(dash.filteredRows.map((r) => r.admissionNumber)).toEqual(['ADM2400']);
    type('');
    expect(dash.filteredRows.length).toBe(3000);
  });

  it('measures the cost of one keystroke', () => {
    const word = 'wanjiku';
    const times: number[] = [];
    for (let round = 0; round < 5; round++) {
      for (let i = 1; i <= word.length; i++) {
        times.push(type(word.substring(0, i)));
      }
      times.push(type(''));
    }
    times.sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)];
    const worst = times[times.length - 1];
    console.log(
      'keystroke ms: median ' + median.toFixed(1) + ', worst ' + worst.toFixed(1) +
        ', samples ' + times.length,
    );
    expect(times.length).toBe(40);
  });
});
