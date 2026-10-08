// 课表冲突检测与空闲时段计算服务

export interface ScheduleCourse {
  id: string;
  name: string;
  day: number; // 1-7 周一到周日
  startPeriod: number; // 开始节次，从1开始
  endPeriod: number; // 结束节次（含）
  startWeek: number; // 开始周
  endWeek: number; // 结束周
  weekType: 'all' | 'odd' | 'even'; // 单双周
  location?: string;
}

export interface Conflict {
  type: 'time' | 'week';
  courseA: string;
  courseB: string;
  day: number;
  periods: number[];
  weeks: number[];
}

export interface FreeSlot {
  day: number;
  startPeriod: number;
  endPeriod: number;
  duration: number;
}

const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function getDayName(day: number): string {
  return DAY_NAMES[day - 1] ?? `周${day}`;
}

// 判断某门课在指定周是否上课
function courseActiveOnWeek(c: ScheduleCourse, week: number): boolean {
  if (week < c.startWeek || week > c.endWeek) return false;
  if (c.weekType === 'odd') return week % 2 === 1;
  if (c.weekType === 'even') return week % 2 === 0;
  return true;
}

// 获取某门课在某周实际上课的节次集合
function getActivePeriods(c: ScheduleCourse, week: number): number[] {
  if (!courseActiveOnWeek(c, week)) return [];
  const periods: number[] = [];
  for (let p = c.startPeriod; p <= c.endPeriod; p++) periods.push(p);
  return periods;
}

// 检测所有冲突
export function detectConflicts(courses: ScheduleCourse[], totalWeeks = 20): Conflict[] {
  const conflicts: Conflict[] = [];
  const seen = new Set<string>();

  for (let w = 1; w <= totalWeeks; w++) {
    // 按天分组
    const byDay: Record<number, ScheduleCourse[]> = {};
    for (const c of courses) {
      if (courseActiveOnWeek(c, w)) {
        (byDay[c.day] ||= []).push(c);
      }
    }

    for (const day of Object.keys(byDay)) {
      const list = byDay[Number(day)];
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i];
          const b = list[j];
          // 节次重叠
          const overlapStart = Math.max(a.startPeriod, b.startPeriod);
          const overlapEnd = Math.min(a.endPeriod, b.endPeriod);
          if (overlapStart <= overlapEnd) {
            const key = `${a.id}-${b.id}-${day}-${overlapStart}-${overlapEnd}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const periods: number[] = [];
            for (let p = overlapStart; p <= overlapEnd; p++) periods.push(p);
            conflicts.push({
              type: 'time',
              courseA: a.name,
              courseB: b.name,
              day: Number(day),
              periods,
              weeks: [w],
            });
          }
        }
      }
    }
  }

  // 合并相同课程对在不同周的冲突
  const merged: Conflict[] = [];
  const map = new Map<string, Conflict>();
  for (const c of conflicts) {
    const key = `${c.courseA}|${c.courseB}|${c.day}|${c.periods.join(',')}`;
    if (map.has(key)) {
      map.get(key)!.weeks.push(...c.weeks);
    } else {
      map.set(key, { ...c });
    }
  }
  for (const v of map.values()) merged.push(v);
  return merged.sort((x, y) => x.day - y.day || x.periods[0] - y.periods[0]);
}

// 计算指定周的每日空闲时段
export function computeFreeSlots(
  courses: ScheduleCourse[],
  week: number,
  maxPeriodsPerDay = 12,
): FreeSlot[] {
  const slots: FreeSlot[] = [];
  for (let day = 1; day <= 7; day++) {
    const occupied = new Set<number>();
    for (const c of courses) {
      if (c.day !== day) continue;
      for (const p of getActivePeriods(c, week)) occupied.add(p);
    }
    let start: number | null = null;
    for (let p = 1; p <= maxPeriodsPerDay; p++) {
      if (!occupied.has(p)) {
        if (start === null) start = p;
      } else if (start !== null) {
        const end = p - 1;
        slots.push({ day, startPeriod: start, endPeriod: end, duration: end - start + 1 });
        start = null;
      }
    }
    if (start !== null) {
      const end = maxPeriodsPerDay;
      slots.push({ day, startPeriod: start, endPeriod: end, duration: end - start + 1 });
    }
  }
  return slots;
}

// 生成周课表矩阵 [day][period] = course name
export function buildWeekMatrix(courses: ScheduleCourse[], week: number, maxPeriods = 12): (string | null)[][] {
  const matrix: (string | null)[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: maxPeriods }, () => null),
  );
  for (const c of courses) {
    if (!courseActiveOnWeek(c, week)) continue;
    for (let p = c.startPeriod; p <= c.endPeriod && p <= maxPeriods; p++) {
      matrix[c.day - 1][p - 1] = c.name;
    }
  }
  return matrix;
}
