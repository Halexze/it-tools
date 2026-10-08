import { School } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '绩点 / 加权平均分换算',
  path: '/gpa-calculator',
  description: '支持标准4.0、北大4.0、交大4.3、浙大5.0等多种算法的绩点与加权平均分计算。',
  keywords: ['gpa', '绩点', '加权平均分', '学分', '成绩', '校园', '算法'],
  component: () => import('./gpa-calculator.vue'),
  icon: School,
  createdAt: new Date('2026-10-08'),
});
