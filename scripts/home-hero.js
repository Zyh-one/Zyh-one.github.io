'use strict';

const hero = `
<section class="home-hero" aria-label="profile">
  <div class="home-hero-main">
    <p class="home-hero-eyebrow">算子一号 / Zone</p>
    <h2 class="home-hero-title">AI Infra 学习日志</h2>
    <p class="home-hero-desc">
      从 Kernel 到 Inference，记录大模型基础设施的升级打怪之路。
    </p>
    <div class="home-hero-tags" aria-label="topics">
      <span>CUDA Kernel</span>
      <span>LLM Inference</span>
      <span>SGLang</span>
      <span>Systems</span>
    </div>
  </div>
  <div class="home-hero-aside">
    <p class="home-hero-aside-title">内容入口</p>
    <a href="https://github.com/Zyh-one" target="_blank" rel="noopener">GitHub 实验</a>
    <span>抖音 83165780684</span>
    <a href="/archives/">阅读最新文章</a>
  </div>
</section>
`;

hexo.extend.filter.register('after_render:html', function injectHomeHero(str, data) {
  if (!data || data.path !== 'index.html' || str.includes('class="home-hero"')) {
    return str;
  }

  return str.replace(
    /(<div class="main-inner index posts-expand">\s*)/,
    `$1${hero}\n`
  );
});
