/**
 * Automated Verification Script for M49
 * Single-column Article Reader, Contextual Sandwich Menu, Sticky Player Bar & Smart Back Navigation
 * Native Chrome CDP implementation (Zero external npm dependencies)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function getFreePort() {
  return new Promise((resolve) => {
    const s = http.createServer();
    s.listen(0, () => {
      const port = s.address().port;
      s.close(() => resolve(port));
    });
  });
}

async function runM49Verification() {
  const httpPort = await getFreePort();
  const cdpPort = await getFreePort();

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0].split('#')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(projectRoot, reqPath);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise(r => server.listen(httpPort, r));
  console.log(`HTTP Server active on ephemeral port http://localhost:${httpPort}`);

  const userDataDir = path.join('/tmp', 'chrome-m49-test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7));
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  try {
    await new Promise(r => setTimeout(r, 1200));

    const listRes = await fetch(`http://127.0.0.1:${cdpPort}/json`);
    const targets = await listRes.json();
    const pageTarget = targets.find(t => t.type === 'page');
    const wsUrl = pageTarget.webSocketDebuggerUrl;

    const ws = new globalThis.WebSocket(wsUrl);
    let id = 1;
    const pending = new Map();
    const consoleErrors = [];

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            console.error('Console Error:', msg.params.args.map(a => a.value || a.description).join(' '));
            consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
          }
          if (msg.method === 'Runtime.exceptionThrown') {
            console.error('Runtime Unhandled Exception:', msg.params.exceptionDetails);
          }
          if (msg.id && pending.has(msg.id)) {
            const cb = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) cb.reject(new Error(msg.error.message));
            else cb.resolve(msg.result);
          }
        } catch (e) {}
      };
    });

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const curId = id++;
        pending.set(curId, { resolve, reject });
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    async function evaluate(expression) {
      const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (r && r.exceptionDetails) {
        console.error('Evaluate Exception:', r.exceptionDetails);
      }
      return r && r.result ? r.result.value : null;
    }

    async function setViewport(width, height) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width <= 900
      });
      await send('Emulation.setVisibleSize', { width, height });
    }

    async function screenshot(filename) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      if (r && r.data) {
        const outPath = path.join(projectRoot, 'audit/menu-navigation/screenshots', filename);
        fs.writeFileSync(outPath, Buffer.from(r.data, 'base64'));
        console.log(`📸 Screenshot saved: ${filename}`);
      }
    }

    await send('Page.enable');
    await send('Runtime.enable');

    console.log('\n--- 1. Loading Application ---');
    await send('Page.navigate', { url: `http://localhost:${httpPort}/index.html` });
    await new Promise(r => setTimeout(r, 2000));

    // Ensure sample article exists
    await evaluate(`(() => {
      if (!window.getLocalHistory().some(h => h.videoId === 'sample_rfi_test')) {
        saveToLocalHistory({
          videoId: 'sample_rfi_test',
          title: 'RFI Français Facile - Le climat en France',
          format: 'text',
          isText: true,
          sentences: [
            { text: "Bonjour à toutes et à tous, bienvenue sur RFI.", vi: "Xin chào tất cả các bạn, chào mừng đến với RFI." },
            { text: "Aujourd'hui nous allons parler de l'environnement en France.", vi: "Hôm nay chúng ta sẽ nói về môi trường ở Pháp." },
            { text: "Le gouvernement annonce de nouvelles mesures écologiques importantes.", vi: "Chính phủ công bố các biện pháp sinh thái quan trọng mới." },
            { text: "Ces initiatives visent à réduire les émissions de carbone.", vi: "Những sáng kiến này nhằm giảm lượng khí thải carbon." }
          ]
        });
      }
    })()`);

    console.log('\n--- 2. Testing Tablet Portrait (768x1024) Article Reading Mode ---');
    await setViewport(768, 1024);

    const openResult = await evaluate(`(() => {
      const parsed = [
        { text: "Bonjour à toutes et à tous, bienvenue sur RFI.", vi: "Xin chào tất cả các bạn, chào mừng đến với RFI." },
        { text: "Aujourd'hui nous allons parler de l'environnement en France.", vi: "Hôm nay chúng ta sẽ nói về môi trường ở Pháp." },
        { text: "Le gouvernement annonce de nouvelles mesures écologiques importantes.", vi: "Chính phủ công bố các biện pháp sinh thái quan trọng mới." },
        { text: "Ces initiatives visent à réduire les émissions de carbone.", vi: "Những sáng kiến này nhằm giảm lượng khí thải carbon." }
      ];
      window.openTextSession('sample_rfi_test', 'RFI Français Facile - Le climat en France', parsed);
      return {
        isTextMode: window.isTextMode,
        bodyHasTextMode: document.body.classList.contains('text-mode'),
        practiceVisible: !document.getElementById('screen-practice').classList.contains('hidden')
      };
    })()`);
    console.log('Article session opened:', openResult);

    await new Promise(r => setTimeout(r, 500));

    // Check Article Layout on Tablet Portrait
    const layoutTablet = await evaluate(`(() => {
      const sidePanel = document.getElementById('article-side-panel');
      const sidePanelDisplay = sidePanel ? window.getComputedStyle(sidePanel).display : 'missing';
      const playerBar = document.getElementById('art-player-bar');
      const playerBarDisplay = playerBar ? window.getComputedStyle(playerBar).display : 'missing';
      const playerBarRect = playerBar ? playerBar.getBoundingClientRect() : null;
      const backLabel = document.getElementById('practice-back-btn-label');
      const backText = backLabel ? backLabel.textContent.trim() : '';

      return {
        sidePanelDisplay,
        playerBarDisplay,
        playerBarTop: playerBarRect ? playerBarRect.top : -1,
        playerBarVisible: playerBarRect ? (playerBarRect.top >= 0 && playerBarRect.top < 100) : false,
        backText
      };
    })()`);

    console.log('Tablet layout metrics:', layoutTablet);
    if (layoutTablet.sidePanelDisplay !== 'none') throw new Error(`Expected #article-side-panel to be display:none, got ${layoutTablet.sidePanelDisplay}`);
    if (layoutTablet.playerBarDisplay !== 'flex') throw new Error(`Expected #art-player-bar to be display:flex, got ${layoutTablet.playerBarDisplay}`);
    if (!layoutTablet.playerBarVisible) throw new Error(`Expected #art-player-bar top < 100px, got ${layoutTablet.playerBarTop}`);
    if (layoutTablet.backText !== 'Bài đọc') throw new Error(`Expected back button text "Bài đọc", got "${layoutTablet.backText}"`);

    await screenshot('m49_tablet_portrait_reader.png');

    console.log('\n--- 3. Testing Contextual Sandwich Menu in Article Mode ---');
    // Open Sandwich Menu in Article Mode
    await evaluate(`window.togglePracticeMobileMenu()`);
    await new Promise(r => setTimeout(r, 300));

    const menuArticleMode = await evaluate(`(() => {
      const menu = document.getElementById('practice-sandwich-menu');
      const isOpen = menu && !menu.classList.contains('pv-x');
      const videoSection = menu.querySelector('.psm-video-only');
      const videoDisplay = videoSection ? window.getComputedStyle(videoSection).display : 'missing';
      const articleSection = menu.querySelector('.psm-article-only');
      const articleDisplay = articleSection ? window.getComputedStyle(articleSection).display : 'missing';
      const srcText = document.getElementById('psm-art-source') ? document.getElementById('psm-art-source').textContent : '';
      const wcText = document.getElementById('psm-art-wc') ? document.getElementById('psm-art-wc').textContent : '';
      const scText = document.getElementById('psm-art-sc') ? document.getElementById('psm-art-sc').textContent : '';

      return {
        isOpen,
        videoDisplay,
        articleDisplay,
        srcText,
        wcText,
        scText
      };
    })()`);

    console.log('Article mode menu metrics:', menuArticleMode);
    if (!menuArticleMode.isOpen) throw new Error('Expected Sandwich Menu to be open');
    if (menuArticleMode.videoDisplay !== 'none') throw new Error(`Expected .psm-video-only display:none in article mode, got ${menuArticleMode.videoDisplay}`);
    if (menuArticleMode.articleDisplay === 'none') throw new Error(`Expected .psm-article-only visible in article mode, got ${menuArticleMode.articleDisplay}`);
    if (!menuArticleMode.srcText.includes('RFI')) throw new Error(`Expected #psm-art-source to include "RFI", got "${menuArticleMode.srcText}"`);
    if (menuArticleMode.scText !== '4') throw new Error(`Expected #psm-art-sc to be "4", got "${menuArticleMode.scText}"`);

    await screenshot('m49_tablet_sandwich_menu_article.png');

    // Close Menu
    await evaluate(`window.closePracticeMobileMenu()`);
    await new Promise(r => setTimeout(r, 200));

    console.log('\n--- 4. Testing Smart Back Navigation to "text" Tab ---');
    const backNav = await evaluate(`(() => {
      window.backToInputScreen();
      return {
        currentInputMode: window.currentInputMode,
        textModePaneVisible: !document.getElementById('text-input-mode').classList.contains('hidden'),
        homeScreenVisible: !document.getElementById('screen-input').classList.contains('hidden')
      };
    })()`);
    console.log('Back navigation metrics:', backNav);
    if (!backNav.homeScreenVisible) throw new Error('Expected home screen to be visible');
    if (backNav.currentInputMode !== 'text') throw new Error(`Expected currentInputMode to be "text", got "${backNav.currentInputMode}"`);
    if (!backNav.textModePaneVisible) throw new Error('Expected #text-input-mode pane to be visible');

    console.log('\n--- 5. Testing Video Mode Contextual Sandwich Menu ---');
    // Open a video
    await evaluate(`(() => {
      const vItem = {
        videoId: 'M7lc1UVf-VE',
        title: 'Learn French with YouTube',
        format: 'srt',
        isText: false,
        userTrans: true,
        sentences: [
          { start: 0, end: 5, text: "Bienvenue dans cette vidéo.", vi: "Chào mừng bạn đến với video này." }
        ]
      };
      window.saveToLocalHistory(vItem);
      window.loadFromHistory('M7lc1UVf-VE');
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const videoState = await evaluate(`(() => {
      const backLabel = document.getElementById('practice-back-btn-label');
      const backText = backLabel ? backLabel.textContent.trim() : '';
      window.togglePracticeMobileMenu();
      const menu = document.getElementById('practice-sandwich-menu');
      const videoSection = menu.querySelector('.psm-video-only');
      const videoDisplay = videoSection ? window.getComputedStyle(videoSection).display : 'missing';
      const articleSection = menu.querySelector('.psm-article-only');
      const articleDisplay = articleSection ? window.getComputedStyle(articleSection).display : 'missing';

      return {
        backText,
        videoDisplay,
        articleDisplay
      };
    })()`);

    console.log('Video mode metrics:', videoState);
    if (videoState.backText !== 'Trang chủ') throw new Error(`Expected back text "Trang chủ" in video mode, got "${videoState.backText}"`);
    if (videoState.videoDisplay === 'none') throw new Error(`Expected .psm-video-only visible in video mode, got ${videoState.videoDisplay}`);
    if (videoState.articleDisplay !== 'none') throw new Error(`Expected .psm-article-only display:none in video mode, got ${videoState.articleDisplay}`);

    await screenshot('m49_video_sandwich_menu.png');

    await evaluate(`window.closePracticeMobileMenu()`);
    await evaluate(`window.backToInputScreen()`);

    console.log('\n--- 6. Testing Desktop (1280x800) Single-Column Reader ---');
    await setViewport(1280, 800);
    await evaluate(`(() => {
      const parsed = [
        { text: "Bonjour à toutes et à tous, bienvenue sur RFI.", vi: "Xin chào tất cả các bạn, chào mừng đến với RFI." },
        { text: "Aujourd'hui nous allons parler de l'environnement en France.", vi: "Hôm nay chúng ta sẽ nói về môi trường ở Pháp." }
      ];
      window.openTextSession('sample_rfi_test', 'RFI Français Facile - Le climat en France', parsed);
    })()`);
    await new Promise(r => setTimeout(r, 500));

    const desktopMetrics = await evaluate(`(() => {
      const sidePanel = document.getElementById('article-side-panel');
      const sidePanelDisplay = sidePanel ? window.getComputedStyle(sidePanel).display : 'missing';
      const splitContainer = document.getElementById('split-container');
      const splitContainerWidth = splitContainer ? splitContainer.getBoundingClientRect().width : 0;
      const playerBar = document.getElementById('art-player-bar');
      const playerBarRect = playerBar ? playerBar.getBoundingClientRect() : null;

      return {
        sidePanelDisplay,
        splitContainerWidth,
        playerBarTop: playerBarRect ? playerBarRect.top : -1,
        playerBarDisplay: playerBar ? window.getComputedStyle(playerBar).display : 'missing'
      };
    })()`);

    console.log('Desktop 1-column metrics:', desktopMetrics);
    if (desktopMetrics.sidePanelDisplay !== 'none') throw new Error(`Expected #article-side-panel to be display:none on desktop, got ${desktopMetrics.sidePanelDisplay}`);
    if (desktopMetrics.playerBarDisplay !== 'flex') throw new Error(`Expected #art-player-bar to be display:flex on desktop, got ${desktopMetrics.playerBarDisplay}`);
    if (desktopMetrics.splitContainerWidth > 1000) throw new Error(`Expected max-width <= 960px (+padding), got ${desktopMetrics.splitContainerWidth}`);

    await screenshot('m49_desktop_single_column.png');

    console.log('\n--- 7. Testing Tablet Landscape (1024x768) ---');
    await setViewport(1024, 768);
    await new Promise(r => setTimeout(r, 300));
    await screenshot('m49_tablet_landscape_single_column.png');

    console.log('\n✅ ALL M49 VERIFICATION CHECKS PASSED PERFECTLY!');
  } finally {
    try { chromeProc.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
  }
}

runM49Verification().catch(err => {
  console.error('❌ M49 Verification failed:', err);
  process.exit(1);
});
