// 公文格式自检服务（参考《党政机关公文格式》GB/T 9704 及高校协会公文规范）

export interface FormatIssue {
  level: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  suggestion?: string;
  line?: number;
}

export interface CheckResult {
  issues: FormatIssue[];
  stats: {
    totalChars: number;
    paragraphCount: number;
    title?: string;
    hasDocNumber: boolean;
    hasRecipient: boolean;
    hasDate: boolean;
    hasSealMark: boolean;
  };
}

const LEVEL_LABEL: Record<FormatIssue['level'], string> = {
  error: '错误',
  warning: '警告',
  info: '提示',
};

export function getLevelLabel(level: FormatIssue['level']): string {
  return LEVEL_LABEL[level];
}

// 发文字号正则：机关代字〔年份〕序号
const docNumberRegex = /[〔\[【\[]\s*\d{4}\s*[〕\]】\]]\s*\d+号/;
// 成文日期：YYYY年M月D日
const dateRegex = /(20\d{2}|19\d{2})\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/;
// 主送机关：顶格 + 冒号结尾
const recipientRegex = /^[^\s].+[：:]$/m;

export function checkDocumentFormat(text: string): CheckResult {
  const issues: FormatIssue[] = [];
  const lines = text.split(/\r?\n/);
  const paragraphs = lines.filter(l => l.trim().length > 0);
  const totalChars = text.replace(/\s/g, '').length;

  const stats = {
    totalChars,
    paragraphCount: paragraphs.length,
    title: undefined as string | undefined,
    hasDocNumber: docNumberRegex.test(text),
    hasRecipient: recipientRegex.test(text),
    hasDate: dateRegex.test(text),
    hasSealMark: /（印章）|盖章|〔印章〕/.test(text),
  };

  // 1. 标题检查
  const firstNonEmpty = paragraphs[0];
  if (firstNonEmpty) {
    stats.title = firstNonEmpty.trim();
    // 标题应居中（前导空格或换行后居中），一般不超过50字
    if (firstNonEmpty.length > 50) {
      issues.push({
        level: 'warning',
        category: '标题',
        message: `标题较长（${firstNonEmpty.length} 字），建议精简至 50 字以内。`,
        suggestion: '公文标题一般由发文机关+事由+文种组成，简明扼要。',
        line: 1,
      });
    }
    if (/[。！？，；]/.test(firstNonEmpty)) {
      issues.push({
        level: 'error',
        category: '标题',
        message: '标题中不应使用标点符号（除书名号、引号外）。',
        suggestion: '删除标题中的顿号、逗号、句号等标点。',
        line: 1,
      });
    }
  } else {
    issues.push({ level: 'error', category: '标题', message: '未检测到公文标题。' });
  }

  // 2. 发文字号检查
  if (!stats.hasDocNumber) {
    issues.push({
      level: 'warning',
      category: '发文字号',
      message: '未检测到规范的发文字号。',
      suggestion: '格式应为：机关代字〔年份〕序号，例如：校学字〔2024〕15号。注意年份用六角括号〔〕。',
    });
  } else {
    // 检查六角括号
    const match = text.match(/[〔\[【\[]\s*\d{4}\s*[〕\]】\]]/);
    if (match && !match[0].includes('〔') && !match[0].includes('〕')) {
      issues.push({
        level: 'error',
        category: '发文字号',
        message: '发文字号中的年份应使用六角括号〔〕，而非方括号[]或【】。',
        suggestion: '将 [2024] 或【2024】改为〔2024〕。',
      });
    }
  }

  // 3. 主送机关检查
  if (!stats.hasRecipient) {
    issues.push({
      level: 'warning',
      category: '主送机关',
      message: '未检测到主送机关。',
      suggestion: '主送机关应顶格书写，后加全角冒号，如：各学院、各部门：',
    });
  }

  // 4. 成文日期检查
  if (!stats.hasDate) {
    issues.push({
      level: 'warning',
      category: '成文日期',
      message: '未检测到成文日期。',
      suggestion: '成文日期应使用阿拉伯数字全称，如：2024年10月1日。',
    });
  } else {
    // 检查是否用了中文数字
    const cnDate = /[一二三四五六七八九十〇零]{2,4}\s*年/;
    if (cnDate.test(text)) {
      issues.push({
        level: 'error',
        category: '成文日期',
        message: '成文日期中的年份应使用阿拉伯数字，不应使用中文数字。',
        suggestion: '将"二〇二四年"改为"2024年"。',
      });
    }
  }

  // 5. 印章提示
  if (!stats.hasSealMark) {
    issues.push({
      level: 'info',
      category: '印章',
      message: '未标注印章位置。',
      suggestion: '正式公文需在成文日期上方居中处标注"（印章）"，实际打印时加盖公章。',
    });
  }

  // 6. 层级标题规范检查
  const levelPatterns = [
    { re: /^[一二三四五六七八九十]+、/m, label: '第一层（一、）' },
    { re: /^（[一二三四五六七八九十]+）/m, label: '第二层（（一））' },
    { re: /^\d+\./m, label: '第三层（1.）' },
    { re: /^（\d+）/m, label: '第四层（（1））' },
  ];
  const foundLevels: string[] = [];
  for (const p of levelPatterns) {
    if (p.re.test(text)) foundLevels.push(p.label);
  }

  // 7. 数字用法检查：定量数字应用阿拉伯数字
  const cnNumInContext = /[一二三四五六七八九十百千万]+[个名项条章节页人元年月日]/.test(text);
  if (cnNumInContext) {
    issues.push({
      level: 'warning',
      category: '数字用法',
      message: '公文中的定量数字建议使用阿拉伯数字。',
      suggestion: '如"三个部门"改为"3个部门"，"第五条"改为"第5条"（定型词如"三个代表"除外）。',
    });
  }

  // 8. 标点符号检查：避免中英文标点混用
  const mixedPunct = /[\u4e00-\u9fa5][,.!?;:][\u4e00-\u9fa5]/.test(text);
  if (mixedPunct) {
    issues.push({
      level: 'warning',
      category: '标点符号',
      message: '中文行文中混用了英文半角标点。',
      suggestion: '中文公文应使用全角标点，将 , . ! ? ; : 替换为 ，。！？；：',
    });
  }

  // 9. 错别字/常见不规范用词
  const commonErrors: [RegExp, string, string][] = [
    [/截止到/, '截止', '表示到某个时间点为止应用"截至"，"截止"后不加时间词。'],
    [/拟定于/, '拟定于', '规范用法为"拟订于"或"定于"。'],
    [/其它/, '其它', '指代事物时宜用"其他"。'],
    [/做出/, '做出', '抽象事物用"作出"，具体东西用"做出"。'],
    [/帐本|帐目/, '帐', '表示财务应用"账"（账本、账目）。'],
  ];
  for (const [re, word, sugg] of commonErrors) {
    if (re.test(text)) {
      issues.push({
        level: 'info',
        category: '用词规范',
        message: `检测到不规范用词"${word}"。`,
        suggestion: sugg,
      });
    }
  }

  // 10. 正文字数建议
  if (totalChars > 0 && totalChars < 50) {
    issues.push({
      level: 'info',
      category: '内容',
      message: `正文仅 ${totalChars} 字，内容较少。`,
    });
  }

  // 11. 段落首行缩进检查
  let noIndentCount = 0;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    // 标题、主送机关、日期等除外
    if (line === firstNonEmpty) continue;
    if (recipientRegex.test(line)) continue;
    if (dateRegex.test(line)) continue;
    if (/^\s{2}/.test(line)) continue; // 有缩进
    noIndentCount++;
  }
  if (noIndentCount > 2) {
    issues.push({
      level: 'warning',
      category: '段落格式',
      message: `检测到 ${noIndentCount} 个段落未首行缩进 2 字符。`,
      suggestion: '正文每段首行应缩进 2 个字符。',
    });
  }

  return { issues, stats };
}
