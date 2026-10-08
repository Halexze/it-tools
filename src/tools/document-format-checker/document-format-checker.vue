<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NSpace, NTag } from 'naive-ui';
import { FileText } from '@vicons/tabler';
import { checkDocumentFormat, getLevelLabel, type FormatIssue } from './document-format-checker.service';

const defaultText = `关于开展2024年度社团招新工作的通知

各学院团委、各学生社团：

  为丰富校园文化生活，促进学生全面发展，经研究决定，定于2024年9月开展年度社团招新工作。现将有关事项通知如下：

一、招新时间
  2024年9月15日至9月20日。

二、招新地点
  大学生活动中心广场。

三、相关要求
  （一）各社团须提前提交招新方案；
  （二）现场须安排专人负责咨询。

  特此通知。

                              （印章）
                         2024年9月10日`;

const text = ref(defaultText);
const result = computed(() => checkDocumentFormat(text.value));

function loadExample() {
  text.value = defaultText;
}
function clearText() {
  text.value = '';
}

const levelColor: Record<FormatIssue['level'], string> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const errorCount = computed(() => result.value.issues.filter(i => i.level === 'error').length);
const warnCount = computed(() => result.value.issues.filter(i => i.level === 'warning').length);
const infoCount = computed(() => result.value.issues.filter(i => i.level === 'info').length);
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 1000px">
      <c-card mb-3>
        <div flex items-center gap-2 mb-2>
          <n-icon :component="FileText" size="22" />
          <span text-lg font-600>公文格式自检</span>
        </div>
        <div text-sm text-#888>
          参考《党政机关公文格式》GB/T 9704 及高校学生组织公文规范，自动检查标题、发文字号、主送机关、成文日期、层级标题、标点与用词等。
        </div>
      </c-card>

      <c-card mb-3>
        <div flex justify-between items-center mb-2>
          <span font-600>公文正文</span>
          <n-space>
            <n-button size="small" @click="loadExample">载入示例</n-button>
            <n-button size="small" @click="clearText">清空</n-button>
          </n-space>
        </div>
        <n-input
          v-model:value="text"
          type="textarea"
          :rows="18"
          placeholder="在此粘贴或输入公文内容..."
          style="font-family: 'FangSong', '仿宋_GB2312', serif; font-size: 16px; line-height: 1.8;"
        />
      </c-card>

      <c-card mb-3>
        <div flex items-center gap-3 mb-3>
          <span font-600>检查结果</span>
          <n-tag size="small" type="error">错误 {{ errorCount }}</n-tag>
          <n-tag size="small" type="warning">警告 {{ warnCount }}</n-tag>
          <n-tag size="small" type="info">提示 {{ infoCount }}</n-tag>
        </div>

        <div grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 text-sm>
          <div p-2 rounded bg-#f5f5f5 dark:bg-#262626>总字符数：{{ result.stats.totalChars }}</div>
          <div p-2 rounded bg-#f5f5f5 dark:bg-#262626>段落数：{{ result.stats.paragraphCount }}</div>
          <div p-2 rounded bg-#f5f5f5 dark:bg-#262626>发文字号：{{ result.stats.hasDocNumber ? '✓' : '✗' }}</div>
          <div p-2 rounded bg-#f5f5f5 dark:bg-#262626>主送机关：{{ result.stats.hasRecipient ? '✓' : '✗' }}</div>
          <div p-2 rounded bg-#f5f5f5 dark:bg-#262626>成文日期：{{ result.stats.hasDate ? '✓' : '✗' }}</div>
          <div p-2 rounded bg-#f5f5f5 dark:bg-#262626>印章标注：{{ result.stats.hasSealMark ? '✓' : '✗' }}</div>
        </div>

        <div v-if="result.issues.length">
          <div v-for="(issue, i) in result.issues" :key="i" mb-2 p-3 rounded border-l-4 border-current
               :class="issue.level === 'error' ? 'border-red-5 bg-red-50 dark:bg-red-900/10' : issue.level === 'warning' ? 'border-orange-5 bg-orange-50 dark:bg-orange-900/10' : 'border-blue-5 bg-blue-50 dark:bg-blue-900/10'">
            <div flex items-center gap-2 mb-1>
              <n-tag size="small" :type="levelColor[issue.level]">{{ getLevelLabel(issue.level) }}</n-tag>
              <span font-600 text-sm>[{{ issue.category }}]</span>
              <span v-if="issue.line" text-xs text-#888>第 {{ issue.line }} 行</span>
            </div>
            <div text-sm>{{ issue.message }}</div>
            <div v-if="issue.suggestion" text-xs text-#666 mt-1>💡 {{ issue.suggestion }}</div>
          </div>
        </div>
        <div v-else p-3 text-green-6 text-sm>未检测到格式问题，公文基本符合规范。</div>
      </c-card>

      <c-card mb-3>
        <div font-600 mb-2>排版规范参考</div>
        <ul text-sm leading-relaxed>
          <li>标题：方正小标宋简体，二号，居中</li>
          <li>正文：仿宋_GB2312，三号，首行缩进 2 字符</li>
          <li>一级标题：黑体，三号；二级标题：楷体_GB2312，三号</li>
          <li>行间距：固定值 28-30 磅</li>
          <li>页边距：上 3.7cm / 下 3.5cm / 左 2.8cm / 右 2.6cm</li>
          <li>发文字号：机关代字〔年份〕序号，年份用六角括号</li>
          <li>成文日期：阿拉伯数字全称，右空四字</li>
        </ul>
      </c-card>
    </div>
  </div>
</template>
