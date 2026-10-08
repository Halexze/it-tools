import { Book } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: '论文参考文献格式转换',
  path: '/citation-format-converter',
  description: '自动解析参考文献并转换为 GB/T 7714、APA、MLA、Chicago 等格式。',
  keywords: ['参考文献', '格式', 'GB/T 7714', 'APA', 'MLA', 'Chicago', '论文', '引用'],
  component: () => import('./citation-format-converter.vue'),
  icon: Book,
  createdAt: new Date('2026-10-08'),
});
