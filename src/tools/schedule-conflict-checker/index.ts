import { Calendar } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '课表冲突检测 & 空闲时段',
  path: '/schedule-conflict-checker',
  description: '录入课程后自动检测时间冲突，并按周计算每日空闲时段，可视化周课表。',
  keywords: ['课表', '冲突', '空闲时段', '课程', '排课', '校园', '周课表'],
  component: () => import('./schedule-conflict-checker.vue'),
  icon: Calendar,
  createdAt: new Date('2026-10-08'),
});
