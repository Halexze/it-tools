// 绩点计算服务：支持多种常见算法
export type ScoreType = 'number' | 'grade';

export interface Course {
  id: string;
  name: string;
  credit: number;
  score: string; // 数字分数或等级
}

export type GpaAlgorithm =
  | 'standard-4.0'
  | 'improved-4.0'
  | 'pku-4.0'
  | 'sjtu-4.3'
  | 'zju-5.0'
  | 'fudan-4.0';

export interface AlgorithmInfo {
  key: GpaAlgorithm;
  name: string;
  description: string;
}

export const algorithms: AlgorithmInfo[] = [
  { key: 'standard-4.0', name: '标准 4.0 制', description: '90-100:4.0, 80-89:3.0, 70-79:2.0, 60-69:1.0, <60:0' },
  { key: 'improved-4.0', name: '改进 4.0 制', description: '85-100:4.0, 70-84:3.0, 60-69:2.0, <60:0' },
  { key: 'pku-4.0', name: '北大 4.0 制', description: '90-100:4.0, 85-89:3.7, 82-84:3.3, 78-81:3.0, 75-77:2.7, 72-74:2.3, 68-71:2.0, 64-67:1.5, 60-63:1.0, <60:0' },
  { key: 'sjtu-4.3', name: '交大 4.3 制', description: '95-100:4.3, 90-94:4.0, 85-89:3.7, 80-84:3.3, 75-79:3.0, 70-74:2.7, 67-69:2.3, 65-66:2.0, 62-64:1.7, 60-61:1.0, <60:0' },
  { key: 'zju-5.0', name: '浙大 5.0 制', description: '95-100:5.0, 90-94:4.8, 85-89:4.5, 80-84:4.0, 75-79:3.5, 70-74:3.0, 65-69:2.5, 60-64:1.5, <60:0' },
  { key: 'fudan-4.0', name: '复旦 4.0 制', description: 'A(90-100):4.0, A-(85-89):3.7, B+(82-84):3.3, B(78-81):3.0, B-(75-77):2.7, C+(72-74):2.3, C(68-71):2.0, C-(65-67):1.7, D(62-64):1.3, D-(60-61):1.0, F(<60):0' },
];

// 等级到分数区间的映射（用于等级制输入）
const gradeToScore: Record<string, number> = {
  A: 95, 'A-': 87, 'B+': 83, B: 79, 'B-': 76, 'C+': 73, C: 69, 'C-': 66, 'D+': 63, D: 61, F: 50,
  优秀: 95, 良好: 85, 中等: 75, 及格: 65, 不及格: 50,
  优: 95, 良: 85, 中: 75,
};

function parseScore(score: string): number | null {
  const s = score.trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isNaN(n)) return n;
  // 等级制
  const upper = s.toUpperCase();
  if (gradeToScore[upper] !== undefined) return gradeToScore[upper];
  if (gradeToScore[s] !== undefined) return gradeToScore[s];
  return null;
}

// 根据分数返回对应算法的绩点
export function scoreToGpa(score: number, algo: GpaAlgorithm): number {
  switch (algo) {
    case 'standard-4.0':
      if (score >= 90) return 4.0;
      if (score >= 80) return 3.0;
      if (score >= 70) return 2.0;
      if (score >= 60) return 1.0;
      return 0;
    case 'improved-4.0':
      if (score >= 85) return 4.0;
      if (score >= 70) return 3.0;
      if (score >= 60) return 2.0;
      return 0;
    case 'pku-4.0':
      if (score >= 90) return 4.0;
      if (score >= 85) return 3.7;
      if (score >= 82) return 3.3;
      if (score >= 78) return 3.0;
      if (score >= 75) return 2.7;
      if (score >= 72) return 2.3;
      if (score >= 68) return 2.0;
      if (score >= 64) return 1.5;
      if (score >= 60) return 1.0;
      return 0;
    case 'sjtu-4.3':
      if (score >= 95) return 4.3;
      if (score >= 90) return 4.0;
      if (score >= 85) return 3.7;
      if (score >= 80) return 3.3;
      if (score >= 75) return 3.0;
      if (score >= 70) return 2.7;
      if (score >= 67) return 2.3;
      if (score >= 65) return 2.0;
      if (score >= 62) return 1.7;
      if (score >= 60) return 1.0;
      return 0;
    case 'zju-5.0':
      if (score >= 95) return 5.0;
      if (score >= 90) return 4.8;
      if (score >= 85) return 4.5;
      if (score >= 80) return 4.0;
      if (score >= 75) return 3.5;
      if (score >= 70) return 3.0;
      if (score >= 65) return 2.5;
      if (score >= 60) return 1.5;
      return 0;
    case 'fudan-4.0':
      if (score >= 90) return 4.0;
      if (score >= 85) return 3.7;
      if (score >= 82) return 3.3;
      if (score >= 78) return 3.0;
      if (score >= 75) return 2.7;
      if (score >= 72) return 2.3;
      if (score >= 68) return 2.0;
      if (score >= 65) return 1.7;
      if (score >= 62) return 1.3;
      if (score >= 60) return 1.0;
      return 0;
    default:
      return 0;
  }
}

export interface GpaResult {
  gpa: number;
  weightedAverage: number;
  totalCredits: number;
  passedCredits: number;
  courseCount: number;
  details: { course: Course; numericScore: number; gpa: number; passed: boolean }[];
  invalidCourses: Course[];
}

export function calculateGpa(courses: Course[], algo: GpaAlgorithm): GpaResult {
  const details: GpaResult['details'] = [];
  const invalidCourses: Course[] = [];
  let totalCredits = 0;
  let passedCredits = 0;
  let gpaSum = 0;
  let scoreSum = 0;

  for (const c of courses) {
    const numeric = parseScore(c.score);
    if (numeric === null || c.credit <= 0) {
      invalidCourses.push(c);
      continue;
    }
    const gpa = scoreToGpa(numeric, algo);
    const passed = numeric >= 60;
    details.push({ course: c, numericScore: numeric, gpa, passed });
    totalCredits += c.credit;
    if (passed) {
      passedCredits += c.credit;
      gpaSum += gpa * c.credit;
    }
    scoreSum += numeric * c.credit;
  }

  const gpa = passedCredits > 0 ? gpaSum / passedCredits : 0;
  const weightedAverage = totalCredits > 0 ? scoreSum / totalCredits : 0;

  return {
    gpa,
    weightedAverage,
    totalCredits,
    passedCredits,
    courseCount: details.length,
    details,
    invalidCourses,
  };
}
