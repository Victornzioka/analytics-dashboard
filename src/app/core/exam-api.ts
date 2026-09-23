import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExamPayload } from './models';

/**
 * Stands in for the Analytics API. Reads a static file and adds the kind of latency
 * a school on a slow connection sees. No backend, no network beyond localhost.
 */
@Injectable({ providedIn: 'root' })
export class ExamApi {
  /**
   * Latency is per exam and deliberately uneven, the way a real endpoint is when one
   * exam has more entries cached than another.
   */
  private static readonly LATENCY: Record<number, number> = {
    9001: 1200,
    9002: 250,
  };

  load(examId: number): Observable<ExamPayload> {
    return new Observable<ExamPayload>((subscriber) => {
      const delay = ExamApi.LATENCY[examId] ?? 400;
      let cancelled = false;

      const timer = setTimeout(() => {
        fetch('/exam-results.json')
          .then((r) => {
            if (!r.ok) {
              throw new Error('exam-results.json returned ' + r.status);
            }
            return r.json();
          })
          .then((payload: ExamPayload) => {
            if (cancelled) {
              return;
            }
            subscriber.next({
              subjects: payload.subjects,
              exams: payload.exams,
              students: payload.students,
              entries: payload.entries.filter((e) => e.examId === examId),
            });
            subscriber.complete();
          })
          .catch((err) => {
            if (!cancelled) {
              subscriber.error(err);
            }
          });
      }, delay);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    });
  }
}
