import { Component } from '@angular/core';
import { ExamDashboard } from './features/dashboard/exam-dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ExamDashboard],
  template: '<app-exam-dashboard />',
})
export class App {}
