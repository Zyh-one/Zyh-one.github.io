'use strict';

const hero = `
<section class="ai-home-hero" aria-label="AI Infra Notes hero">
  <div class="ai-hero-topbar">
    <nav class="ai-hero-topnav" aria-label="external links">
      <a href="https://github.com/Zyh-one" target="_blank" rel="noopener">GitHub</a>
      <a href="/archives/">归档</a>
      <a href="/categories/">分类</a>
      <a href="/tags/">标签</a>
      <span class="ai-hero-follow">
        关注抖音
        <span class="ai-hero-qr-card">
          <img src="/images/douyin-qr.jpg" alt="抖音二维码：算子一号">
          <strong>扫码关注：算子一号</strong>
        </span>
      </span>
    </nav>
  </div>
  <div class="ai-hero-content">
    <div class="ai-hero-copy">
      <div class="ai-hero-brand">
        <span class="ai-hero-logo">◎</span>
        <span>算子一号 · AI Infra Lab</span>
      </div>
      <div class="ai-hero-title-wrap">
        <h1>从 CUDA Kernel 到<br>LLM Inference</h1>
        <p>记录大模型推理系统、模型并行、KV Cache、SGLang/vLLM 与 AI Infra 工程实践。</p>
      </div>
    </div>
    <div class="ai-hero-visual" aria-hidden="true">
      <div class="ai-chip">AI</div>
      <div class="ai-code">&lt;/&gt;</div>
      <div class="ai-lines"></div>
    </div>
  </div>
  <div class="ai-hero-wave" aria-hidden="true"></div>
  <div class="ai-hero-scroll" aria-hidden="true"><span></span><i></i></div>
</section>
`;

hexo.extend.filter.register('after_render:html', function injectHomeHero(str, data) {
  if (!data || data.path !== 'index.html' || str.includes('class="ai-home-hero"')) {
    return str;
  }

  return str
    .replace(/<body([^>]*)class="([^"]*)"/, '<body$1class="$2 home-page"')
    .replace(/(<main class="main">)/, `${hero}\n$1`);
});
