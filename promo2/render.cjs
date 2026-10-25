// 사용법: node render.cjs build | stills [t1,t2,...] | full
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');

const DIR = __dirname;
const HTML = path.join(DIR, 'promo.html');
const OUT = path.join(DIR, 'output.mp4');
const WORK = process.env.WORK || path.join(DIR, '.work');
const FPS = 60, SUB = 3, DUR = 20;

function build() {
  const font = fs.readFileSync(path.join(DIR, 'PretendardVariable.woff2')).toString('base64');
  const src = fs.readFileSync(path.join(DIR, 'src.html'), 'utf8')
    .replace('url(PretendardVariable.woff2)', `url(data:font/woff2;base64,${font})`)
    .replace(/assets\/(\w+)\.jpg/g, (m, n) => `data:image/jpeg;base64,${fs.readFileSync(path.join(DIR, 'assets', n + '.jpg')).toString('base64')}`);
  fs.writeFileSync(HTML, src);
}

async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('pageerror', e));
  await page.goto('file://' + HTML);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  return page;
}

async function shot(page, t, type = 'png') {
  await page.evaluate(t => window.seek(t), t);
  return page.screenshot({ type, ...(type === 'jpeg' ? { quality: 95 } : {}) });
}

async function stills(times) {
  fs.mkdirSync(path.join(WORK, 'stills'), { recursive: true });
  const browser = await chromium.launch();
  const page = await open(browser);
  console.log(await page.evaluate(() => window.INFO));
  for (const t of times) {
    fs.writeFileSync(path.join(WORK, 'stills', `t${t.toFixed(3).padStart(6, '0')}.png`), await shot(page, t));
  }
  await browser.close();
}

// 한 구간: 서브프레임 3장(프레임 시각 중심) → tmix → 3장 중 1장 선택 → x264
async function segment(i, f0, f1) {
  const browser = await chromium.launch();
  const page = await open(browser);
  const seg = path.join(WORK, `seg${i}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS * SUB), '-c:v', 'png', '-i', '-',
    '-vf', `tmix=frames=${SUB},select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB)`,
    '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', seg], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    for (let j = 0; j < SUB; j++) {
      let t = f / FPS + (j - (SUB - 1) / 2) / (FPS * SUB);
      t = ((t % DUR) + DUR) % DUR;                  // 반복 영상이므로 경계 서브프레임은 감아서
      const buf = await shot(page, t);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    if (f % 60 === 0) console.log(`seg${i} frame ${f}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  return seg;
}

function wav(b64) {
  const pcm = Buffer.from(b64, 'base64');
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(48000, 24); h.writeUInt32LE(48000 * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

async function full() {
  fs.mkdirSync(WORK, { recursive: true });
  const browser = await chromium.launch();
  const page = await open(browser);
  fs.writeFileSync(path.join(WORK, 'audio.wav'), wav(await page.evaluate(() => window.renderAudio())));
  await browser.close();

  const N = FPS * DUR, K = 4, per = Math.ceil(N / K);
  const segs = await Promise.all([...Array(K)].map((_, i) => segment(i, i * per, Math.min(N, (i + 1) * per))));
  fs.writeFileSync(path.join(WORK, 'list.txt'), segs.map(s => `file '${s}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'list.txt'),
    '-i', path.join(WORK, 'audio.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', OUT], { stdio: 'inherit' });
  console.log('wrote', OUT);
}

(async () => {
  const mode = process.argv[2];
  build();
  if (mode === 'stills') {
    const arg = process.argv[3];
    const times = arg ? arg.split(',').map(Number) : [...Array(40)].map((_, i) => i * 0.5);
    await stills(times);
  } else if (mode === 'full') await full();
})();
