import { FileText } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '公文格式自检',
  path: '/document-format-checker',
  description: '参考公文规范自动检查标题、发文字号、主送机关、成文日期、层级标题、标点与用词等。',
  keywords: ['公文', '格式', '规范', '自检', '协会', '通知', '校园', 'GB/T 9704'],
  component: () => import('./document-format-checker.vue'),
  icon: FileText,
  createdAt: new Date('2026-10-08'),
});
