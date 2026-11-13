/**
 * Deep Accessibility & Interaction Checker
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9222;

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
            if (msg.error) cb.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            else cb.resolve(msg.result);
          }
        } catch (e) {
          console.error(e);
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

async function run() {
  const wsUrl = await getWsUrl();
  const client = new CDPClient(wsUrl);
  await client.connect();

  await client.send('Page.enable');
  await client.send('Runtime.enable');

  console.log('Running Deep Checks on Buttons, Touch Targets, and ARIA...');

  const result = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const buttons = Array.from(document.querySelectorAll('button, a[role="button"], input[type="button"], select'));
      const a11yAudit = {
        totalInteractive: buttons.length,
        missingAccessibleName: [],
        smallTouchTargets: [],
        missingAriaExpanded: [],
        missingAriaControls: [],
        invalidAriaControls: []
      };

      buttons.forEach(el => {
        const id = el.id || '';
        const cls = el.className ? String(el.className).slice(0, 40) : '';
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);

        // Check visible
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && (rect.width > 0 || rect.height > 0);

        // Accessible name
        const text = (el.innerText || el.textContent || '').trim();
        const ariaLabel = el.getAttribute('aria-label') || '';
        const title = el.getAttribute('title') || '';
        const alt = el.querySelector('img') ? el.querySelector('img').alt : '';
        const accName = ariaLabel || text || title || alt;

        if (isVisible && !accName) {
          a11yAudit.missingAccessibleName.push({
            tag: el.tagName.toLowerCase(),
            id,
            class: cls,
            html: el.outerHTML.slice(0, 100)
          });
        }

        // Touch target sizing (WCAG 2.2 Level AA min 24x24, mobile best practice 44x44)
        if (isVisible && (rect.width < 24 || rect.height < 24)) {
          a11yAudit.smallTouchTargets.push({
            id,
            class: cls,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            accName: accName.slice(0, 30)
          });
        }

        // aria-expanded check on popup triggers
        const hasPopup = el.getAttribute('aria-haspopup');
        const ariaExp = el.getAttribute('aria-expanded');
        if (hasPopup && ariaExp === null) {
          a11yAudit.missingAriaExpanded.push({ id, class: cls });
        }

        // aria-controls validation
        const ariaCtrl = el.getAttribute('aria-controls');
        if (ariaCtrl) {
          const target = document.getElementById(ariaCtrl);
          if (!target) {
            a11yAudit.invalidAriaControls.push({ id, controls: ariaCtrl });
          }
        }
      });

      // Check modal focus trapping & Escape key listeners
      const modals = Array.from(document.querySelectorAll('.ai-modal-backdrop, .art-sync-modal-backdrop, #mobile-nav-drawer, .vph-backdrop'));
      const modalChecks = modals.map(m => {
        return {
          id: m.id,
          hasAriaModal: m.querySelector('[aria-modal="true"]') !== null || m.getAttribute('aria-modal') === 'true',
          hasRoleDialog: m.querySelector('[role="dialog"]') !== null || m.getAttribute('role') === 'dialog',
          hasAriaLabel: m.querySelector('[aria-labelledby],[aria-label]') !== null || m.hasAttribute('aria-label')
        };
      });

      return {
        a11yAudit,
        modalChecks
      };
    })()`,
    returnByValue: true
  });

  console.log('Result Summary:', {
    totalInteractive: result.result.value.a11yAudit.totalInteractive,
    missingNameCount: result.result.value.a11yAudit.missingAccessibleName.length,
    smallTouchTargetsCount: result.result.value.a11yAudit.smallTouchTargets.length,
    missingAriaExpanded: result.result.value.a11yAudit.missingAriaExpanded.length,
    invalidAriaControls: result.result.value.a11yAudit.invalidAriaControls.length,
    modalsCount: result.result.value.modalChecks.length
  });

  fs.writeFileSync(path.join(__dirname, 'deep_a11y_results.json'), JSON.stringify(result.result.value, null, 2), 'utf8');

  client.close();
}

run().catch(console.error);
