'use strict';

const intros = {
  archive: {
    eyebrow: 'Archive',
    title: '归档',
    desc: '按时间线整理 AI Infra 学习记录，持续回看从 CUDA Kernel 到 LLM Inference 的成长路径。'
  },
  categories: {
    eyebrow: 'Categories',
    title: '分类',
    desc: '按主题组织文章，把 Kernel、Inference、Notes 等内容沉淀成清晰的知识索引。'
  },
  tags: {
    eyebrow: 'Tags',
    title: '标签',
    desc: '用关键词串联具体知识点，方便追踪 AI Infra、SGLang 与系统实践中的细分主题。'
  }
};

function getIntro(path) {
  if (path === 'archives/' || path.startsWith('archives/')) return intros.archive;
  if (path === 'categories/' || path.startsWith('categories/')) return intros.categories;
  if (path === 'tags/' || path.startsWith('tags/')) return intros.tags;
  return null;
}

function renderIntro(intro) {
  return `
<section class="page-intro" aria-label="${intro.title}">
  <div>
    <p class="page-intro-eyebrow">${intro.eyebrow}</p>
    <h1>${intro.title}</h1>
    <p class="page-intro-desc">${intro.desc}</p>
  </div>
  <nav class="page-intro-nav" aria-label="quick links">
    <a href="https://github.com/Zyh-one" target="_blank" rel="noopener">GitHub</a>
    <a href="/archives/">归档</a>
    <a href="/categories/">分类</a>
    <a href="/tags/">标签</a>
    <span class="page-intro-follow">
      关注抖音
      <span class="page-intro-qr">
        <img src="/images/douyin-qr.jpg" alt="抖音二维码：算子一号">
        <strong>扫码关注：算子一号</strong>
      </span>
    </span>
  </nav>
</section>
`;
}

hexo.extend.filter.register('after_render:html', function injectPageIntro(str, data) {
  if (!data || str.includes('class="page-intro"')) return str;

  const intro = getIntro(data.path || '');
  if (!intro) return str;

  return str.replace(
    /(<div class="main-inner [^"]*">\s*)/,
    `$1${renderIntro(intro)}\n`
  );
});
