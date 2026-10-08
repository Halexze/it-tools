// 论文参考文献格式转换服务
// 支持 GB/T 7714、APA、MLA、Chicago

export type CitationType = 'journal' | 'book' | 'conference' | 'thesis' | 'web';

export interface ParsedCitation {
  type: CitationType;
  authors: string[]; // 原始作者字符串列表
  title: string;
  source: string; // 期刊名 / 出版社 / 会议名 / 学校
  year: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  url?: string;
  raw: string;
}

export type CitationStyle = 'gb7714' | 'apa' | 'mla' | 'chicago';

// 将作者字符串拆分为姓和名（简单处理）
function splitAuthorName(name: string): { last: string; first: string } {
  const trimmed = name.trim();
  // 英文作者：Last, First 或 First Last
  if (trimmed.includes(',')) {
    const [last, first] = trimmed.split(',').map(s => s.trim());
    return { last, first };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { last: parts[0], first: '' };
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(' ');
  return { last, first };
}

// 作者名首字母缩写
function initials(first: string): string {
  return first.split(/\s+/).filter(Boolean).map(p => p[0]?.toUpperCase() ?? '').join(' ');
}

// 解析单条参考文献
export function parseCitation(raw: string): ParsedCitation | null {
  const text = raw.trim();
  if (!text) return null;

  // 提取 URL
  let url = '';
  const urlMatch = text.match(/(https?:\/\/\S+)/);
  if (urlMatch) url = urlMatch[1];

  // 提取年份
  const yearMatch = text.match(/(19|20)\d{2}/);
  const year = yearMatch ? yearMatch[0] : '';

  // 提取页码
  const pagesMatch = text.match(/(\d+)\s*[-–]\s*(\d+)/);
  const pages = pagesMatch ? `${pagesMatch[1]}-${pagesMatch[2]}` : '';

  // 提取卷(期)：如 12(3) 或 Vol.12, No.3
  let volume = '';
  let issue = '';
  const volIssueMatch = text.match(/(\d+)\s*[（(]\s*(\d+)\s*[)）]/)
    || text.match(/Vol\.?\s*(\d+)[^\d]*No\.?\s*(\d+)/i);
  if (volIssueMatch) {
    volume = volIssueMatch[1];
    issue = volIssueMatch[2];
  } else {
    const volMatch = text.match(/Vol\.?\s*(\d+)/i);
    if (volMatch) volume = volMatch[1];
  }

  // 判断类型
  let type: CitationType = 'journal';
  if (/硕士论文|博士论文|学位论文|dissertation|thesis/i.test(text)) type = 'thesis';
  else if (/\[M\]|出版社|press|publisher/i.test(text)) type = 'book';
  else if (/\[C\]|会议|proceedings|conference/i.test(text)) type = 'conference';
  else if (url && !/\[J\]/.test(text)) type = 'web';

  // 提取作者（第一个句号之前，或开头到年份前）
  let authorsStr = '';
  const beforeYear = year ? text.split(year)[0] : text.split('.')[0];
  authorsStr = beforeYear.replace(/[.\s]+$/, '').trim();

  // 分离作者和标题：作者部分通常不含中文标题词
  let authors: string[] = [];
  let title = '';
  let source = '';
  let publisher = '';

  // 尝试按句号分割：作者. 标题. 来源.
  // 简化处理：第一个 [文献类型标识] 之前为作者+标题
  const typeMarkMatch = text.match(/\[JMCBARDW]\]/);
  if (typeMarkMatch) {
    const beforeMark = text.slice(0, typeMarkMatch.index);
    const dotParts = beforeMark.split('.').map(s => s.trim()).filter(Boolean);
    if (dotParts.length >= 1) authors = dotParts[0].split(/[,，;；]/).map(s => s.trim()).filter(Boolean);
    if (dotParts.length >= 2) title = dotParts[1];
  } else {
    // 无类型标识：用句号切分
    const dotParts = text.split('.').map(s => s.trim()).filter(Boolean);
    if (dotParts.length >= 1) authors = dotParts[0].split(/[,，;；]/).map(s => s.trim()).filter(Boolean);
    if (dotParts.length >= 2) title = dotParts[1];
    if (dotParts.length >= 3) source = dotParts[2];
  }

  // 清理标题中的多余内容
  title = title.replace(/\[JMCBARDW]\].*$/, '').trim();
  source = source.replace(/\[JMCBARDW]\].*$/, '').trim();

  // 提取出版社
  const pubMatch = text.match(/([\u4e00-\u9fa5A-Za-z]+出版社|[A-Za-z\s]+Press)/i);
  if (pubMatch) publisher = pubMatch[1];

  if (!title && authors.length) {
    // 退而求其次
    title = authors.pop() || '';
  }

  return { type, authors, title, source, year, volume, issue, pages, publisher, url, raw: text };
}

// 格式化作者列表
function formatAuthorsGB(authors: string[]): string {
  if (authors.length === 0) return '';
  if (authors.length <= 3) return authors.join(', ');
  return `${authors.slice(0, 3).join(', ')}, 等`;
}

function formatAuthorsAPA(authors: string[]): string {
  if (authors.length === 0) return '';
  const formatted = authors.map(a => {
    const { last, first } = splitAuthorName(a);
    return first ? `${last}, ${initials(first)}.` : last;
  });
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
}

function formatAuthorsMLA(authors: string[]): string {
  if (authors.length === 0) return '';
  if (authors.length === 1) {
    const { last, first } = splitAuthorName(authors[0]);
    return first ? `${last}, ${first}` : last;
  }
  const first = (() => {
    const { last, first } = splitAuthorName(authors[0]);
    return first ? `${last}, ${first}` : last;
  })();
  const rest = authors.slice(1).map(a => a.trim()).join(', ');
  return `${first}, et al.`;
}

function formatAuthorsChicago(authors: string[]): string {
  if (authors.length === 0) return '';
  const formatted = authors.map(a => {
    const { last, first } = splitAuthorName(a);
    return first ? `${last}, ${first}` : last;
  });
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, and ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
}

// 按指定格式输出参考文献
export function formatCitation(c: ParsedCitation, style: CitationStyle): string {
  switch (style) {
    case 'gb7714': {
      const authors = formatAuthorsGB(c.authors);
      const typeMark = c.type === 'journal' ? '[J]' : c.type === 'book' ? '[M]' : c.type === 'conference' ? '[C]' : c.type === 'thesis' ? '[D]' : '[EB/OL]';
      let out = `${authors}. ${c.title}${typeMark}`;
      if (c.source) out += `. ${c.source}`;
      if (c.year) out += `, ${c.year}`;
      if (c.volume) out += `, ${c.volume}${c.issue ? `(${c.issue})` : ''}`;
      if (c.pages) out += `: ${c.pages}`;
      out += '.';
      if (c.url) out += ` [2026-10-08]. ${c.url}.`;
      return out;
    }
    case 'apa': {
      const authors = formatAuthorsAPA(c.authors);
      let out = `${authors} (${c.year || 'n.d.'}). ${c.title}`;
      if (c.type === 'journal') {
        out += `. ${c.source}`;
        if (c.volume) out += `, ${c.volume}${c.issue ? `(${c.issue})` : ''}`;
      } else if (c.type === 'book' && c.publisher) {
        out += `. ${c.publisher}`;
      } else if (c.source) {
        out += `. ${c.source}`;
      }
      if (c.pages) out += `, ${c.pages}`;
      out += '.';
      if (c.url) out += ` ${c.url}`;
      return out;
    }
    case 'mla': {
      const authors = formatAuthorsMLA(c.authors);
      let out = `${authors}. "${c.title}."`;
      if (c.type === 'journal') {
        out += ` ${c.source}`;
        if (c.volume) out += `, vol. ${c.volume}${c.issue ? `, no. ${c.issue}` : ''}`;
        if (c.year) out += `, ${c.year}`;
        if (c.pages) out += `, pp. ${c.pages}`;
      } else if (c.type === 'book') {
        if (c.publisher) out += ` ${c.publisher}`;
        if (c.year) out += `, ${c.year}`;
      } else {
        if (c.source) out += ` ${c.source}`;
        if (c.year) out += `, ${c.year}`;
      }
      out += '.';
      if (c.url) out += ` ${c.url}.`;
      return out;
    }
    case 'chicago': {
      const authors = formatAuthorsChicago(c.authors);
      let out = `${authors}. "${c.title}."`;
      if (c.type === 'journal') {
        out += ` ${c.source}`;
        if (c.volume) out += ` ${c.volume}${c.issue ? `, no. ${c.issue}` : ''}`;
        if (c.year) out += ` (${c.year})`;
        if (c.pages) out += `: ${c.pages}`;
      } else if (c.type === 'book') {
        if (c.publisher) out += ` ${c.publisher}`;
        if (c.year) out += `, ${c.year}`;
      } else {
        if (c.source) out += ` ${c.source}`;
        if (c.year) out += `, ${c.year}`;
      }
      out += '.';
      if (c.url) out += ` ${c.url}.`;
      return out;
    }
    default:
      return c.raw;
  }
}

export function convertAll(input: string, style: CitationStyle): string {
  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const results: string[] = [];
  for (const line of lines) {
    const parsed = parseCitation(line);
    if (!parsed) continue;
    results.push(formatCitation(parsed, style));
  }
  return results.join('\n');
}

export const styleLabels: Record<CitationStyle, string> = {
  gb7714: 'GB/T 7714（国标）',
  apa: 'APA（美国心理学会）',
  mla: 'MLA（现代语言协会）',
  chicago: 'Chicago（芝加哥）',
};
