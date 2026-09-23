// Regenerates public/exam-results.json. Deterministic: same seed, same file.
// Run with: node tools/generate-data.mjs
import { writeFileSync, mkdirSync } from 'node:fs';

const SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Biology',
  'Chemistry',
  'Physics',
  'History',
  'Geography',
];

// Streams are deliberately very different sizes.
const STREAMS = [
  { name: 'North', size: 1400 },
  { name: 'South', size: 900 },
  { name: 'East', size: 500 },
  { name: 'West', size: 200 },
];

const FIRST = [
  'Achieng', 'Baraka', 'Chebet', 'Dalmas', 'Esther', 'Faith', 'Gideon', 'Hawa',
  'Imani', 'Juma', 'Kamau', 'Lydia', 'Mwangi', 'Njeri', 'Omondi', 'Pauline',
  'Quinter', 'Rotich', 'Sifa', 'Tabitha', 'Upendo', 'Vincent', 'Wanjiku', 'Zawadi',
];
const LAST = [
  'Otieno', 'Mutua', 'Wafula', 'Kiprop', 'Njoroge', 'Adhiambo', 'Barasa',
  'Cherono', 'Kilonzo', 'Maina', 'Odhiambo', 'Wekesa',
];

// Small deterministic PRNG so the file never changes between runs.
let seed = 20260922;
function rnd() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}

const students = [];
let id = 1000;
for (const stream of STREAMS) {
  for (let i = 0; i < stream.size; i++) {
    students.push({
      id: id,
      admissionNumber: 'ADM' + (2400 + id - 1000),
      name: FIRST[id % FIRST.length] + ' ' + LAST[(id / 3 | 0) % LAST.length],
      form: 3,
      stream: stream.name,
    });
    id++;
  }
}

const exams = [
  { id: 9001, name: 'Term 2 Opener', term: 2, year: 2026, satOn: '2026-05-12' },
  { id: 9002, name: 'Term 2 Mid Term', term: 2, year: 2026, satOn: '2026-06-24' },
];

const entries = [];
for (const exam of exams) {
  for (const student of students) {
    for (const subject of SUBJECTS) {
      // Roughly 8% of entries are absences. A real school has them.
      if (rnd() < 0.08) {
        entries.push({ examId: exam.id, studentId: student.id, subject, score: null });
        continue;
      }
      let base = 30 + Math.floor(rnd() * 60);
      if (subject === 'Mathematics') base -= 6;
      if (subject === 'English') base += 4;
      // The mid term went noticeably better than the opener, school wide.
      if (exam.id === 9002) base += 10;
      // West is the small high-performing stream. This is what makes the
      // weighting of the school mean visible.
      if (student.stream === 'West') base += 14;
      entries.push({
        examId: exam.id,
        studentId: student.id,
        subject,
        score: Math.max(0, Math.min(100, base)),
      });
    }
  }
}

const payload = { subjects: SUBJECTS, exams, students, entries };

mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
writeFileSync(
  new URL('../public/exam-results.json', import.meta.url),
  JSON.stringify(payload),
);

console.log(
  'students=' + students.length + ' entries=' + entries.length + ' exams=' + exams.length,
);
