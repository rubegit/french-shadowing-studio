const http = require('http');

http.get('http://127.0.0.1:9222/json', res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const p = JSON.parse(d).find(x => x.type === 'page');
    const ws = new WebSocket(p.webSocketDebuggerUrl);
    ws.onopen = () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            try {
              document.getElementById("screen-input").classList.add("hidden");
              document.getElementById("screen-practice").classList.remove("hidden");
              if (window.pvToggleMenu) window.pvToggleMenu();
              if (window.togglePracticeMobileMenu) window.togglePracticeMobileMenu();
              const m1 = !document.getElementById("pv-menu").classList.contains("pv-x");
              const m2 = !document.getElementById("practice-sandwich-menu").classList.contains("pv-x");
              return { pvMenuOpen: m1, sandwichMenuOpen: m2 };
            } catch (err) {
              return { error: err.message, stack: err.stack };
            }
          })()`,
          returnByValue: true
        }
      }));
    };
    ws.onmessage = e => {
      const msg = JSON.parse(e.data);
      if (msg.id === 1) {
        console.log('Dual Open Result:', msg.result.result.value);
        ws.close();
        process.exit(0);
      }
    };
  });
});
