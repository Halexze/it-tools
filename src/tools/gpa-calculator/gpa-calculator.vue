<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NInput, NInputNumber, NSpace, NSelect } from 'naive-ui';
import { School } from '@vicons/tabler';
import { algorithms, calculateGpa, type Course, type GpaAlgorithm } from './gpa-calculator.service';

const genId = () => Math.random().toString(36).slice(2, 10);

const algorithm = ref<GpaAlgorithm>('pku-4.0');
const courses = ref<Course[]>([
  { id: genId(), name: '高等数学', credit: 4, score: '92' },
  { id: genId(), name: '大学英语', credit: 3, score: '85' },
  { id: genId(), name: '程序设计', credit: 4, score: '88' },
  { id: genId(), name: '线性代数', credit: 3, score: '78' },
  { id: genId(), name: '体育', credit: 1, score: '65' },
]);

const result = computed(() => calculateGpa(courses.value, algorithm.value));

function addCourse() {
  courses.value.push({ id: genId(), name: '', credit: 2, score: '' });
}
function removeCourse(id: string) {
  courses.value = courses.value.filter(c => c.id !== id);
}
function clearAll() {
  courses.value = [{ id: genId(), name: '', credit: 2, score: '' }];
}

const algoOptions = computed(() => algorithms.map(a => ({ label: a.name, value: a.key })));
const currentAlgo = computed(() => algorithms.find(a => a.key === algorithm.value));
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 900px">
      <c-card mb-3>
        <div flex items-center gap-2 mb-2>
          <n-icon :component="School" size="22" />
          <span text-lg font-600>绩点 / 学分 / 加权平均分换算</span>
        </div>
        <div mb-2 text-sm text-#888>
          支持多种高校常用绩点算法，自动计算 GPA 与加权平均分。成绩可输入数字分数（0-100）或等级（A/B+/优秀/良好 等）。
        </div>
        <div flex items-center gap-3 flex-wrap>
          <span text-sm>算法：</span>
          <n-select v-model:value="algorithm" :options="algoOptions" style="width: 220px" />
          <span v-if="currentAlgo" text-xs text-#888>{{ currentAlgo.description }}</span>
        </div>
      </c-card>

      <c-card mb-3>
        <div flex justify-between items-center mb-3>
          <span font-600>课程列表</span>
          <n-space>
            <n-button size="small" @click="addCourse">添加课程</n-button>
            <n-button size="small" type="error" @click="clearAll">清空</n-button>
          </n-space>
        </div>

        <div mb-2 grid gap-2 text-sm font-600 text-#666 style="grid-template-columns: 1fr 90px 140px 60px">
          <div>课程名称</div>
          <div>学分</div>
          <div>成绩</div>
          <div></div>
        </div>

        <div v-for="c in courses" :key="c.id" mb-2 grid gap-2 style="grid-template-columns: 1fr 90px 140px 60px">
          <n-input v-model:value="c.name" placeholder="课程名称" />
          <n-input-number v-model:value="c.credit" :min="0" :max="20" :step="0.5" />
          <n-input v-model:value="c.score" placeholder="分数 或 等级" />
          <n-button size="small" type="error" quaternary @click="removeCourse(c.id)">删除</n-button>
        </div>
      </c-card>

      <c-card mb-3>
        <div font-600 mb-3>计算结果</div>
        <div grid grid-cols-2 md:grid-cols-4 gap-3>
          <div p-3 rounded bg-#f5f5f5 dark:bg-#262626>
            <div text-xs text-#888>GPA</div>
            <div text-2xl font-700 text-green-6>{{ result.gpa.toFixed(3) }}</div>
          </div>
          <div p-3 rounded bg-#f5f5f5 dark:bg-#262626>
            <div text-xs text-#888>加权平均分</div>
            <div text-2xl font-700 text-blue-6>{{ result.weightedAverage.toFixed(2) }}</div>
          </div>
          <div p-3 rounded bg-#f5f5f5 dark:bg-#262626>
            <div text-xs text-#888>总学分</div>
            <div text-2xl font-700>{{ result.totalCredits }}</div>
          </div>
          <div p-3 rounded bg-#f5f5f5 dark:bg-#262626>
            <div text-xs text-#888>已获学分</div>
            <div text-2xl font-700 text-orange-6>{{ result.passedCredits }}</div>
          </div>
        </div>

        <div v-if="result.details.length" mt-4>
          <div font-600 mb-2 text-sm>明细</div>
          <div overflow-x-auto>
            <table w-full text-sm style="border-collapse: collapse">
              <thead>
                <tr text-left text-#666>
                  <th p-1>课程</th>
                  <th p-1>学分</th>
                  <th p-1>成绩</th>
                  <th p-1>绩点</th>
                  <th p-1>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in result.details" :key="d.course.id" border-top border-#eee>
                  <td p-1>{{ d.course.name || '(未命名)' }}</td>
                  <td p-1>{{ d.course.credit }}</td>
                  <td p-1>{{ d.numericScore }}</td>
                  <td p-1>{{ d.gpa.toFixed(2) }}</td>
                  <td p-1 :class="d.passed ? 'text-green-6' : 'text-red-6'">{{ d.passed ? '通过' : '未通过' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="result.invalidCourses.length" mt-3 text-sm text-orange-6>
          有 {{ result.invalidCourses.length }} 门课程成绩或学分无效，已忽略。
        </div>
      </c-card>
    </div>
  </div>
</template>
