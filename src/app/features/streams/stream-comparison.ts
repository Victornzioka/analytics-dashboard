import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { StreamRow } from '../../core/models';
import { spread, weightedMean } from './internal/stream-stats';

/**
 * The streams feature. Owns `internal/stream-stats.ts`.
 */
@Component({
  selector: 'app-stream-comparison',
  standalone: true,
  template: `
    <div class="card">
      <h2>Stream comparison</h2>
      <table>
        <thead>
          <tr>
            <th>Stream</th>
            <th>Candidates</th>
            <th>Mean</th>
            <th>Grade</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track row.stream) {
            <tr>
              <td>{{ row.stream }}</td>
              <td>{{ row.candidates }}</td>
              <td>{{ row.mean | number: '1.2-2' }}</td>
              <td>{{ row.grade }}</td>
            </tr>
          }
        </tbody>
      </table>
      <p class="muted">
        Weighted mean across streams: {{ weighted | number: '1.2-2' }} · spread
        {{ gap | number: '1.2-2' }}
      </p>
    </div>
  `,
  styles: `
    .card {
      background: #fff;
      border: 1px solid #e3e6eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .muted {
      color: #6b7280;
      font-size: 12px;
    }
  `,
  imports: [DecimalPipe],
})
export class StreamComparison {
  @Input() rows: StreamRow[] = [];

  get weighted(): number {
    return weightedMean(this.rows);
  }

  get gap(): number {
    return spread(this.rows);
  }
}
