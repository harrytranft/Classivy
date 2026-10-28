# Tham chiếu: trang loading DictaLearn (Phase 8.2)

Trích từ repo DictaLearn để không cần đính kèm repo đó nữa.

## CSS (index.html)
```css

      .dl-splash{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 38%,#ffffff 0%,#f6f8ff 55%,#eef0ff 100%);}
      .dl-splash__inner{display:flex;flex-direction:column;align-items:center;gap:22px;padding:24px;}
      .dl-splash__logo{width:min(320px,70vw);height:auto;user-select:none;animation:dlSplashIn .7s cubic-bezier(.22,1,.36,1) both;}
      .dl-splash__logo--static{animation:none;}
      .dl-splash__bar{width:min(150px,40vw);height:4px;border-radius:999px;background:rgba(99,102,241,.14);overflow:hidden;}
      .dl-splash__bar span{display:block;height:100%;width:40%;border-radius:999px;background:linear-gradient(90deg,#4f46e5,#a855f7);animation:dlSplashBar 1.2s ease-in-out infinite;}
      .dl-splash--leaving{pointer-events:none;animation:dlSplashOut .65s cubic-bezier(.4,0,.2,1) forwards;}
      .dl-splash--leaving .dl-splash__logo{animation:dlSplashLogoOut .65s cubic-bezier(.4,0,.2,1) forwards;}
      .dl-splash--leaving .dl-splash__bar{opacity:0;transition:opacity .2s;}
      @keyframes dlSplashIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
      @keyframes dlSplashBar{0%{transform:translateX(-110%)}100%{transform:translateX(280%)}}
      @keyframes dlSplashOut{0%{opacity:1}100%{opacity:0;visibility:hidden}}
      @keyframes dlSplashLogoOut{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.35)}}
      @media (prefers-reduced-motion:reduce){.dl-splash__logo,.dl-splash__bar span{animation-duration:.01s}.dl-splash--leaving,.dl-splash--leaving .dl-splash__logo{animation-duration:.2s}}
    
```

## Boot splash tĩnh (index.html)
```html
<div id="boot-splash" class="dl-splash" aria-hidden="true">
      <div class="dl-splash__inner">
        <img class="dl-splash__logo" src="/logo/dictalearn-wordmark.png" alt="DictaLearn" draggable="false" />
        <div class="dl-splash__bar"><span></span></div>
      </div>
```
