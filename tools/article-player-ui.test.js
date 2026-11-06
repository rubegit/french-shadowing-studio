const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('M34.1: partials/view-practice.html contains Article Player Bar with pc and pc-r1 video layout', () => {
  const partialHtml = fs.readFileSync(path.join(__dirname, '../partials/view-practice.html'), 'utf8');

  // Player bar container
  assert.match(partialHtml, /id="art-player-bar"/, 'Must contain #art-player-bar');
  // Uses video layout classes
  assert.match(partialHtml, /class="pc"/, 'Must contain .pc container');
  assert.match(partialHtml, /class="pc-r1"/, 'Must contain .pc-r1 row');
  assert.match(partialHtml, /id="art-tl"/, 'Must contain #art-tl timeline');

  // Timeline elements
  assert.match(partialHtml, /id="art-pb-cur-time"/, 'Must contain #art-pb-cur-time');
  assert.match(partialHtml, /id="art-pb-track"/, 'Must contain #art-pb-track');
  assert.match(partialHtml, /id="art-pb-fill"/, 'Must contain #art-pb-fill');
  assert.match(partialHtml, /id="art-pb-range"/, 'Must contain #art-pb-range');
  assert.match(partialHtml, /id="art-pb-dur-time"/, 'Must contain #art-pb-dur-time');

  // Circular translate icon button
  assert.match(partialHtml, /id="art-translate-btn"/, 'Must contain #art-translate-btn');
  assert.match(partialHtml, /class="art-translate-icon"/, 'Must contain .art-translate-icon');
  assert.match(partialHtml, /文/, 'Must contain Chinese character 文 in translate icon');
  assert.match(partialHtml, /A/, 'Must contain letter A in translate icon');

  // Recording button
  assert.match(partialHtml, /id="art-rec-btn"/, 'Must contain #art-rec-btn');
  assert.match(partialHtml, /id="art-rec-lbl"/, 'Must contain #art-rec-lbl');

  // Speed controls
  assert.match(partialHtml, /id="art-rate-input"/, 'Must contain #art-rate-input');
  assert.match(partialHtml, /id="art-speeds"/, 'Must contain #art-speeds');
});

test('M34.2: Play/Stop button is placed before Auto-stop in sentence navigation', () => {
  const partialHtml = fs.readFileSync(path.join(__dirname, '../partials/view-practice.html'), 'utf8');

  // Verify placement: prev -> play -> auto -> next
  const prevIdx = partialHtml.indexOf('id="art-cs-prev"');
  const playIdx = partialHtml.indexOf('id="art-cs-play"');
  const autoIdx = partialHtml.indexOf('id="art-cs-auto"');
  const nextIdx = partialHtml.indexOf('id="art-cs-next"');

  assert.ok(prevIdx > 0 && playIdx > 0 && autoIdx > 0 && nextIdx > 0, 'All nav buttons must exist');
  assert.ok(prevIdx < playIdx, 'art-cs-prev must be before art-cs-play');
  assert.ok(playIdx < autoIdx, 'art-cs-play must be before art-cs-auto');
  assert.ok(autoIdx < nextIdx, 'art-cs-auto must be before art-cs-next');

  // Verify icons inside play button
  assert.match(partialHtml, /class="art-cs-play-ico"/, 'Must contain play icon');
  assert.match(partialHtml, /class="art-cs-pause-ico"/, 'Must contain pause icon');
});

test('M34.3: Seamless UI styles merge 3 boxes and customize scrollbar', () => {
  const cssCard = fs.readFileSync(path.join(__dirname, '../css/14-subtitle-card.css'), 'utf8');

  // Top box: rounded top only, margin 0
  assert.match(cssCard, /#art-player-bar\s*\{[^}]*border-radius:\s*16px 16px 0 0/s, 'art-player-bar must have rounded top only');
  assert.match(cssCard, /#art-player-bar\s*\{[^}]*margin-bottom:\s*0/s, 'art-player-bar must have margin-bottom 0');

  // Middle box: flat corners, margin 0
  assert.match(cssCard, /#art-cs-card\s*\{[^}]*border-radius:\s*0/s, 'art-cs-card must have flat border-radius');
  assert.match(cssCard, /#art-cs-card\s*\{[^}]*margin-bottom:\s*0/s, 'art-cs-card must have margin-bottom 0');

  // Bottom box: rounded bottom only, full width
  assert.match(cssCard, /body\.text-mode #subtitles-scroll-container\s*\{[^}]*border-radius:\s*0 0 16px 16px/s, 'subtitles-scroll-container must have rounded bottom only');
  assert.match(cssCard, /body\.text-mode #subtitles-scroll-container\s*\{[^}]*max-width:\s*none/s, 'subtitles-scroll-container must be full width');

  // Scrollbar customization
  assert.match(cssCard, /#subtitles-scroll-container::-webkit-scrollbar/, 'Must customize scrollbar');
  assert.match(cssCard, /#subtitles-scroll-container::-webkit-scrollbar-thumb/, 'Must customize scrollbar thumb');

  // Translate button sizing
  assert.match(cssCard, /#art-player-bar \.art-translate-btn\s*\{[^}]*width:\s*var\(--rate-h,\s*41px\)/s, 'Translate btn must match rate-h');
});

test('M34.4: css/18-controls-layout.css shares pc-r1 nowrap and rate input width with art-player-bar', () => {
  const cssLayout = fs.readFileSync(path.join(__dirname, '../css/18-controls-layout.css'), 'utf8');

  assert.match(cssLayout, /#art-player-bar \.pc-r1/, 'Must include #art-player-bar in pc-r1');
  assert.match(cssLayout, /#art-player-bar \.rate-ctl\.big #art-rate-input/, 'Must constrain #art-rate-input width');
});

test('M34.5: js/01d-player.js defines audio control, timeline thumb tracking, and speed handler functions', () => {
  const js = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');

  assert.match(js, /window\.toggleArtAudioPlay\s*=/, 'Must export toggleArtAudioPlay');
  assert.match(js, /window\.setArtAudioSpeed\s*=/, 'Must export setArtAudioSpeed');
  assert.match(js, /window\.commitArtRateInput\s*=/, 'Must export commitArtRateInput');
  assert.match(js, /window\.artRateInputKey\s*=/, 'Must export artRateInputKey');
  assert.match(js, /window\.toggleArticleRec\s*=/, 'Must export toggleArticleRec');
  assert.match(js, /art-pb-thumb/, 'Must sync art-pb-thumb position');
});
