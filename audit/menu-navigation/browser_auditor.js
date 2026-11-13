/**
 * Chrome CDP Browser Auditor for French Shadowing Studio
 * Zero external dependencies. Uses Node.js native WebSocket and Chrome DevTools Protocol.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9222;
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const page = list.find(p => p.type === 'page');
          if (page && page.webSocketDebuggerUrl) {
            resolve(page.webSocketDebuggerUrl);
          } else {
            reject(new Error('No debuggable page found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id && this.callbacks.has(msg.id)) {
            const cb = this.callbacks.get(msg.id);
            this.callbacks.delete(msg.id);
            if (msg.error) {
              cb.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            } else {
              cb.resolve(msg.result);
            }
          }
        } catch (e) {
          console.error('CDP parse error:', e);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      this.callbacks.set(msgId, { resolve, reject });
      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runAudit() {
  console.log('Connecting to Chrome DevTools Protocol...');
  const wsUrl = await getWsUrl();
  const client = new CDPClient(wsUrl);
  await client.connect();
  console.log('CDP connected.');

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('DOM.enable');

  const viewports = [
    { name: 'Small Mobile', width: 320, height: 568, deviceScaleFactor: 2, mobile: true },
    { name: 'Mobile', width: 375, height: 667, deviceScaleFactor: 2, mobile: true },
    { name: 'Large Mobile', width: 430, height: 932, deviceScaleFactor: 3, mobile: true },
    { name: 'Small Tablet', width: 600, height: 960, deviceScaleFactor: 2, mobile: true },
    { name: 'Tablet Portrait', width: 768, height: 1024, deviceScaleFactor: 2, mobile: true },
    { name: 'Tablet Landscape', width: 1024, height: 768, deviceScaleFactor: 2, mobile: false },
    { name: 'Small Laptop', width: 1280, height: 720, deviceScaleFactor: 1, mobile: false },
    { name: 'Desktop', width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
    { name: 'Large Desktop', width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false }
  ];

  const results = [];

  for (const vp of viewports) {
    console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.deviceScaleFactor,
      mobile: vp.mobile
    });
    await new Promise(r => setTimeout(r, 400));

    // Audit DOM overflow and geometry
    const evalResult = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const docEl = document.documentElement;
        const scrollW = docEl.scrollWidth;
        const clientW = docEl.clientWidth;
        const hasOverflowX = scrollW > clientW + 1;

        // Find overflowing elements
        const overflowing = [];
        const all = document.querySelectorAll('*');
        for (let el of all) {
          if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
          const rect = el.getBoundingClientRect();
          if (rect.right > clientW + 1.5) {
            overflowing.push({
              tag: el.tagName.toLowerCase(),
              id: el.id,
              class: el.className ? String(el.className).slice(0, 50) : '',
              right: Math.round(rect.right),
              excess: Math.round(rect.right - clientW)
            });
          }
        }

        // Test Menu Elements Visibility & Sizes
        const menuChecks = {};
        const selectors = {
          homeBrand: '.fs-brand',
          homeVocabBtn: '.vocab-btn.home-top-btn',
          homeSyncBtn: '#btn-cloud-sync',
          homeThemeToggle: '.fs-theme-toggle',
          homeMobileMenuBtn: '#btn-mobile-menu',
          mobileNavDrawer: '#mobile-nav-drawer',
          catalogToolbar: '.video-catalog-toolbar',
          searchField: '#library-search-input',
          sortSelect: '#video-sort-select',
          viewModeToggle: '.view-mode-toggle-group'
        };

        for (const [key, sel] of Object.entries(selectors)) {
          const el = document.querySelector(sel);
          if (el) {
            const style = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            menuChecks[key] = {
              found: true,
              display: style.display,
              visibility: style.visibility,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
            };
          } else {
            menuChecks[key] = { found: false };
          }
        }

        return {
          scrollW,
          clientW,
          hasOverflowX,
          overflowCount: overflowing.length,
          topOverflowElements: overflowing.slice(0, 5),
          menuChecks
        };
      })()`,
      returnByValue: true
    });

    const metrics = evalResult.result.value;
    console.log(`  scrollWidth: ${metrics.scrollW}, clientWidth: ${metrics.clientW}, overflowX: ${metrics.hasOverflowX ? 'YES (' + metrics.overflowCount + ' elements)' : 'NO'}`);
    if (metrics.topOverflowElements.length > 0) {
      console.log('  Overflow elements:', metrics.topOverflowElements);
    }

    // Capture screenshot
    const screenshot = await client.send('Page.captureScreenshot', {
      format: 'png',
      quality: 80
    });
    const filename = `viewport_${vp.width}x${vp.height}_${vp.name.replace(/\s+/g, '_').toLowerCase()}.png`;
    fs.writeFileSync(path.join(SCREENSHOT_DIR, filename), Buffer.from(screenshot.data, 'base64'));

    results.push({
      viewport: vp,
      metrics
    });
  }

  // Next: Test Interactive Drawer Opening on Mobile (375x667)
  console.log('\nTesting Mobile Drawer Interaction (375x667)...');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 300));

  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-mobile-menu');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  const drawerState = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const drawer = document.getElementById('mobile-nav-drawer');
      const card = drawer ? drawer.querySelector('.mobile-nav-card') : null;
      if (!drawer || !card) return { open: false };
      const cardRect = card.getBoundingClientRect();
      const items = Array.from(card.querySelectorAll('.mobile-nav-item')).map(item => {
        const rect = item.getBoundingClientRect();
        return {
          mode: item.getAttribute('data-mode'),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          title: item.querySelector('.title') ? item.querySelector('.title').textContent : ''
        };
      });
      return {
        open: !drawer.classList.contains('hidden'),
        cardWidth: Math.round(cardRect.width),
        cardHeight: Math.round(cardRect.height),
        items
      };
    })()`,
    returnByValue: true
  });
  console.log('Mobile Drawer State:', drawerState.result.value);

  const drawerScreenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'mobile_drawer_open_375x667.png'), Buffer.from(drawerScreenshot.data, 'base64'));

  // Close drawer
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const backdrop = document.querySelector('.mobile-nav-backdrop');
      if (backdrop) backdrop.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  // Next: Test Practice Screen Navigation & Sandwich Menu
  console.log('\nTesting Practice Screen Navigation (1440x900)...');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 300));

  // Switch to Practice Screen
  const practiceSwitch = await client.send('Runtime.evaluate', {
    expression: `(() => {
      // Simulate opening a sample lesson
      if (typeof openLesson === 'function') {
        openLesson('sample_vi_fr_1');
        return { success: true, mode: 'lesson' };
      }
      // Or show practice screen
      const scr = document.getElementById('screen-practice');
      const inp = document.getElementById('screen-input');
      if (scr && inp) {
        inp.classList.add('hidden');
        scr.classList.remove('hidden');
        return { success: true, mode: 'direct' };
      }
      return { success: false };
    })()`,
    returnByValue: true
  });
  console.log('Practice Switch:', practiceSwitch.result.value);
  await new Promise(r => setTimeout(r, 500));

  const practiceScreenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'practice_desktop_1440x900.png'), Buffer.from(practiceScreenshot.data, 'base64'));

  // Open Practice Sandwich Menu
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('practice-sandwich-btn');
      if (btn) btn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  const sandwichScreenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'practice_sandwich_menu_open_1440x900.png'), Buffer.from(sandwichScreenshot.data, 'base64'));

  // Test Practice Screen on Mobile (375x667)
  console.log('\nTesting Practice Screen on Mobile (375x667)...');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 400));

  const practiceMobileScreenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'practice_mobile_375x667.png'), Buffer.from(practiceMobileScreenshot.data, 'base64'));

  // Test Vocab Screen
  console.log('\nTesting Vocab Screen (1440x900)...');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      if (typeof openVocabScreen === 'function') openVocabScreen();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));
  const vocabScreenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'vocab_desktop_1440x900.png'), Buffer.from(vocabScreenshot.data, 'base64'));

  // Open Vocab Practice Hub (M45)
  console.log('Testing Vocab Practice Hub (M45)...');
  await client.send('Runtime.evaluate', {
    expression: `(() => {
      if (window.openVocabPracticeHub) window.openVocabPracticeHub();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));
  const vphScreenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'vocab_practice_hub_1440x900.png'), Buffer.from(vphScreenshot.data, 'base64'));

  // Save audit data
  fs.writeFileSync(path.join(__dirname, 'browser_audit_results.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log('\nBrowser Audit completed successfully. Results saved to audit/menu-navigation/browser_audit_results.json');

  client.close();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
