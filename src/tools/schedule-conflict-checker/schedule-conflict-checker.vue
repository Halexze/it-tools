<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NInput, NInputNumber, NSelect, NSpace } from 'naive-ui';
import { Calendar } from '@vicons/tabler';
import {
  buildWeekMatrix,
  computeFreeSlots,
  detectConflicts,
  getDayName,
  type ScheduleCourse,
} from './schedule-conflict-checker.service';

const genId = () => Math.random().toString(36).slice(2, 10);

const totalWeeks = ref(20);
const currentWeek = ref(1);
const maxPeriods = ref(12);

const courses = ref<ScheduleCourse[]>([
  { id: genId(), name: '高等数学', day: 1, startPeriod: 1, endPeriod: 2, startWeek: 1, endWeek: 16, weekType: 'all', location: '教1-101' },
  { id: genId(), name: '大学英语', day: 1, startPeriod: 3, endPeriod: 4, startWeek: 1, endWeek: 16, weekType: 'all', location: '教2-201' },
  { id: genId(), name: '程序设计', day: 2, startPeriod: 5, endPeriod: 6, startWeek: 1, endWeek: 16, weekType: 'all', location: '实验楼' },
  { id: genId(), name: '线性代数', day: 3, startPeriod: 1, endPeriod: 2, startWeek: 1, endWeek: 16, weekType: 'odd', location: '教1-102' },
  { id: genId(), name: '体育', day: 4, startPeriod: 7, endPeriod: 8, startWeek: 1, endWeek: 16, weekType: 'all', location: '操场' },
  { id: genId(), name: '物理实验', day: 5, startPeriod: 9, endPeriod: 10, startWeek: 3, endWeek: 14, weekType: 'all', location: '物理楼' },
]);

const dayOptions = [1, 2, 3, 4, 5, 6, 7].map(d => ({ label: getDayName(d), value: d }));
const weekTypeOptions = [
  { label: '每周', value: 'all' },
  { label: '单周', value: 'odd' },
  { label: '双周', value: 'even' },
];

const conflicts = computed(() => detectConflicts(courses.value, totalWeeks.value));
const freeSlots = computed(() => computeFreeSlots(courses.value, currentWeek.value, maxPeriods.value));
const matrix = computed(() => buildWeekMatrix(courses.value, currentWeek.value, maxPeriods.value));

function addCourse() {
  courses.value.push({
    id: genId(), name: '', day: 1, startPeriod: 1, endPeriod: 2,
    startWeek: 1, endWeek: 16, weekType: 'all', location: '',
  });
}
function removeCourse(id: string) {
  courses.value = courses.value.filter(c => c.id !== id);
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 1000px">
      <c-card mb-3>
        <div flex items-center gap-2 mb-2>
          <n-icon :component="Calendar" size="22" />
          <span text-lg font-600>课表冲突检测 & 空闲时段计算</span>
        </div>
        <div flex items-center gap-4 flex-wrap text-sm>
          <div flex items-center gap-1>总周数 <n-input-number v-model:value="totalWeeks" :min="1" :max="30" size="small" style="width:80px" /></div>
          <div flex items-center gap-1>每天节数 <n-input-number v-model:value="maxPeriods" :min="1" :max="14" size="small" style="width:80px" /></div>
          <div flex items-center gap-1>查看周次 <n-input-number v-model:value="currentWeek" :min="1" :max="totalWeeks" size="small" style="width:80px" /></div>
        </div>
      </c-card>

      <c-card mb-3>
        <div flex justify-between items-center mb-3>
          <span font-600>课程列表</span>
          <n-button size="small" @click="addCourse">添加课程</n-button>
        </div>
        <div mb-2 grid gap-1 text-xs font-600 text-#666 style="grid-template-columns: 1.4fr 70px 70px 70px 70px 70px 90px 1fr 60px">
          <div>课程名</div><div>星期</div><div>起节</div><div>止节</div><div>起周</div><div>止周</div><div>单双周</div><div>地点</div><div></div>
        </div>
        <div v-for="c in courses" :key="c.id" mb-1 grid gap-1 style="grid-template-columns: 1.4fr 70px 70px 70px 70px 70px 90px 1fr 60px">
          <n-input v-model:value="c.name" size="small" placeholder="课程名" />
          <n-select v-model:value="c.day" :options="dayOptions" size="small" />
          <n-input-number v-model:value="c.startPeriod" :min="1" :max="maxPeriods" size="small" />
          <n-input-number v-model:value="c.endPeriod" :min="1" :max="maxPeriods" size="small" />
          <n-input-number v-model:value="c.startWeek" :min="1" :max="totalWeeks" size="small" />
          <n-input-number v-model:value="c.endWeek" :min="1" :max="totalWeeks" size="small" />
          <n-select v-model:value="c.weekType" :options="weekTypeOptions" size="small" />
          <n-input v-model:value="c.location" size="small" placeholder="地点" />
          <n-button size="small" type="error" quaternary @click="removeCourse(c.id)">删</n-button>
        </div>
      </c-card>

      <c-card mb-3 v-if="conflicts.length">
        <div font-600 text-red-6 mb-2>检测到 {{ conflicts.length }} 处冲突</div>
        <div v-for="(cf, i) in conflicts" :key="i" text-sm mb-1>
          <b>{{ getDayName(cf.day) }}</b> 第 {{ cf.periods.join('-') }} 节：
          <span text-red-6>{{ cf.courseA }}</span> 与 <span text-red-6>{{ cf.courseB }}</span>
          <span text-#888 ml-1>（第 {{ cf.weeks.join(',') }} 周）</span>
        </div>
      </c-card>

      <c-card mb-3>
        <div font-600 mb-2>第 {{ currentWeek }} 周课表</div>
        <div overflow-x-auto>
          <table w-full text-xs text-center style="border-collapse: collapse">
            <thead>
              <tr>
                <th p-1 border border-#ddd bg-#f5f5f5>节次</th>
                <th v-for="d in 7" :key="d" p-1 border border-#ddd bg-#f5f5f5>{{ getDayName(d) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in maxPeriods" :key="p">
                <td p-1 border border-#ddd bg-#fafafa font-600>{{ p }}</td>
                <td v-for="d in 7" :key="d" p-1 border border-#ddd :class="matrix[d-1][p-1] ? 'bg-blue-50 text-blue-7' : ''">
                  {{ matrix[d-1][p-1] || '' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </c-card>

      <c-card mb-3>
        <div font-600 mb-2>第 {{ currentWeek }} 周空闲时段</div>
        <div grid grid-cols-1 md:grid-cols-2 gap-2>
          <div v-for="s in freeSlots" :key="s.day + '-' + s.startPeriod" p-2 rounded bg-green-50 text-sm class="dark:bg-green-900/20">
            <b>{{ getDayName(s.day) }}</b> 第 {{ s.startPeriod }}-{{ s.endPeriod }} 节（共 {{ s.duration }} 节空闲）
          </div>
          <div v-if="!freeSlots.length" text-#888 text-sm>本周无空闲时段。</div>
        </div>
      </c-card>
    </div>
  </div>
</template>
