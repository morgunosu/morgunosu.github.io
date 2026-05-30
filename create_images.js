const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 1. Создаем иконку (favicon)
const faviconSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <circle cx="256" cy="256" r="250" fill="url(#grad1)"/>
  <circle cx="256" cy="256" r="240" fill="none" stroke="#ff66aa" stroke-width="3" opacity="0.4" filter="url(#glow)"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="280" font-weight="bold" 
        text-anchor="middle" fill="#ffffff" letter-spacing="5">m</text>
  <circle cx="390" cy="220" r="35" fill="#ff66aa" filter="url(#glow)"/>
</svg>`;

// 2. Создаем preview картинку - просто morgun на черном фоне
const previewSvg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0f"/>
  <text x="600" y="350" font-family="Arial, sans-serif" font-size="180" font-weight="bold" 
        text-anchor="middle" fill="#ffffff" letter-spacing="3">morgun</text>
</svg>`;

// 3. Создаем иконку osu stats
const osuStatsSvg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="osuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff66aa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff5588;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <circle cx="256" cy="256" r="250" fill="url(#osuGradient)"/>
  <circle cx="256" cy="256" r="220" fill="#ffffff" opacity="0.95"/>
  <circle cx="256" cy="150" r="50" fill="#ff66aa" filter="url(#glow)"/>
  <rect x="150" y="280" width="180" height="30" rx="5" fill="#ff66aa" opacity="0.8"/>
  <rect x="150" y="280" width="140" height="30" rx="5" fill="#ffaacc" opacity="0.5"/>
  <rect x="150" y="330" width="180" height="30" rx="5" fill="#ff66aa" opacity="0.8"/>
  <rect x="150" y="330" width="160" height="30" rx="5" fill="#ffaacc" opacity="0.5"/>
  <rect x="150" y="380" width="180" height="30" rx="5" fill="#ff66aa" opacity="0.8"/>
  <rect x="150" y="380" width="120" height="30" rx="5" fill="#ffaacc" opacity="0.5"/>
  <circle cx="256" cy="256" r="240" fill="none" stroke="#ff66aa" stroke-width="2" opacity="0.3" filter="url(#glow)"/>
</svg>`;

// Генерируем все изображения
Promise.all([
    sharp(Buffer.from(faviconSvg)).png().toFile(path.join(__dirname, 'img', 'icon.png')),
    sharp(Buffer.from(previewSvg)).png().toFile(path.join(__dirname, 'img', 'preview.png')),
    sharp(Buffer.from(osuStatsSvg)).png().toFile(path.join(__dirname, 'img', 'osu-stats.png'))
])
.then(results => {
    console.log('✅ Все изображения созданы успешно!');
    console.log(`📁 icon.png (512x512px)`);
    console.log(`📁 preview.png (1200x630px)`);
    console.log(`📁 osu-stats.png (512x512px)`);
})
.catch(err => console.error('❌ Ошибка:', err.message));
