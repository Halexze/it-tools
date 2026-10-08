<script setup lang="ts">
import { computed } from 'vue';
import { NButton, NSelect, NSpace } from 'naive-ui';
import { Book } from '@vicons/tabler';
import { convertAll, parseCitation, styleLabels, type CitationStyle } from './citation-format-converter.service';

const defaultInput = `张三, 李四. 基于深度学习的图像识别研究[J]. 计算机学报, 2024, 47(3): 512-525.
Wang H, Chen L. A novel approach to natural language processing. Journal of AI Research, 2023, 76(2): 123-145.
王五. 大数据环境下的数据挖掘技术研究[D]. 清华大学, 2023.
Smith J. Introduction to Machine Learning[M]. Cambridge University Press, 2022.`;

const input = ref(defaultInput);
const style = ref<CitationStyle>('gb7714');

const output = computed(() => convertAll(input.value, style.value));

const styleOptions = computed(() =>
  (Object.keys(styleLabels) as CitationStyle[]).map(k => ({ label: styleLabels[k], value: k })),
);

const parsedPreview = computed(() => {
  const first = input.value.split(/\r?\n/).map(l => l.trim()).find(Boolean);
  if (!first) return null;
  return parseCitation(first);
});

function copyOutput() {
  navigator.clipboard?.writeText(output.value);
}
function loadExample() {
  input.value = defaultInput;
}
</script>

<template>
  <div style="flex: 0 0 100%">
    <div style="margin: 0 auto; max-width: 1000px">
      <c-card mb-3>
        <div flex items-center gap-2 mb-2>
          <n-icon :component="Book" size="22" />
          <span text-lg font-600>论文参考文献格式转换</span>
        </div>
        <div text-sm text-#888>
          粘贴参考文献条目（每行一条），自动解析作者、标题、来源、年份、卷期页码，并转换为 GB/T 7714、APA、MLA、Chicago 格式。
        </div>
        <div flex items-center gap-3 mt-3>
          <span text-sm>目标格式：</span>
          <n-select v-model:value="style" :options="styleOptions" style="width: 260px" />
          <n-button size="small" @click="loadExample">载入示例</n-button>
        </div>
      </c-card>

      <c-card mb-3>
        <div font-600 mb-2>输入参考文献（每行一条）</div>
        <n-input
          v-model:value="input"
          type="textarea"
          :rows="10"
          placeholder="粘贴参考文献，每行一条..."
        />
      </c-card>

      <c-card mb-3 v-if="parsedPreview">
        <div font-600 mb-2 text-sm>首条解析预览</div>
        <div text-xs text-#888 leading-relaxed>
          类型：{{ parsedPreview.type }} ｜ 作者：{{ parsedPreview.authors.join('; ') || '(未识别)' }} ｜
          年份：{{ parsedPreview.year || '-' }} ｜ 卷期：{{ parsedPreview.volume }}{{ parsedPreview.issue ? `(${parsedPreview.issue})` : '' }} ｜
          页码：{{ parsedPreview.pages || '-' }}
        </div>
      </c-card>

      <c-card mb-3>
        <div flex justify-between items-center mb-2>
          <span font-600>转换结果（{{ styleLabels[style] }}）</span>
          <n-button size="small" @click="copyOutput">复制全部</n-button>
        </div>
        <n-input
          :value="output"
          type="textarea"
          :rows="10"
          readonly
          style="font-family: monospace;"
        />
      </c-card>

      <c-card mb-3>
        <div font-600 mb-2>使用说明</div>
        <ul text-sm leading-relaxed text-#666>
          <li>支持识别 [J] 期刊、[M] 专著、[C] 会议、[D] 学位论文、[EB/OL] 网络资源等类型标识。</li>
          <li>无类型标识时，将根据"出版社"、"会议"、"学位论文"等关键词自动推断。</li>
          <li>中文作者按"姓, 名"分隔；英文作者可自动处理 Last, First 格式。</li>
          <li>年份、卷(期)、页码通过正则自动提取，复杂条目建议手动核对。</li>
        </ul>
      </c-card>
    </div>
  </div>
</template>
