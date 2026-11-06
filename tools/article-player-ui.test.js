const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('M33.1: partials/view-practice.html and index.html contain Article Player Bar components', () => {
  const partialHtml = fs.readFileSync(path.join(__dirname, '../partials/view-practice.html'), 'utf8');
  const indexHtml = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

  [partialHtml, indexHtml].forEach(html => {
    // Player bar container
    assert.match(html, /id="art-player-bar"/, 'Must contain #art-player-bar');
    // Timeline elements
    assert.match(html, /id="art-pb-cur-time"/, 'Must contain #art-pb-cur-time');
    assert.match(html, /id="art-pb-track"/, 'Must contain #art-pb-track');
    assert.match(html, /id="art-pb-fill"/, 'Must contain #art-pb-fill');
    assert.match(html, /id="art-pb-range"/, 'Must contain #art-pb-range');
    assert.match(html, /id="art-pb-dur-time"/, 'Must contain #art-pb-dur-time');

    // Circular translate icon button
    assert.match(html, /id="art-translate-btn"/, 'Must contain #art-translate-btn');
    assert.match(html, /class="art-translate-icon"/, 'Must contain .art-translate-icon');
    assert.match(html, /文/, 'Must contain Chinese character 文 in translate icon');
    assert.match(html, /A/, 'Must contain letter A in translate icon');

    // Recording button
    assert.match(html, /id="art-rec-btn"/, 'Must contain #art-rec-btn');
    assert.match(html, /id="art-rec-lbl"/, 'Must contain #art-rec-lbl');

    // Speed controls
    assert.match(html, /id="art-rate-input"/, 'Must contain #art-rate-input');
    assert.match(html, /id="art-speeds"/, 'Must contain #art-speeds');
    assert.match(html, /data-sp="0\.5"/, 'Must contain 0.5x speed option');
    assert.match(html, /data-sp="0\.75"/, 'Must contain 0.75x speed option');
    assert.match(html, /data-sp="0\.9"/, 'Must contain 0.9x speed option');
    assert.match(html, /data-sp="1"/, 'Must contain 1.0x speed option');
    assert.match(html, /data-sp="1\.25"/, 'Must contain 1.25x speed option');
  });
});

test('M33.2: Play/Stop button is placed before Auto-stop in sentence navigation', () => {
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

test('M33.3: CSS styles define styling for Player Bar and Translation active/inactive states', () => {
  const css = fs.readFileSync(path.join(__dirname, '../css/14-subtitle-card.css'), 'utf8');

  assert.match(css, /\.art-player-bar\s*\{/, 'Must define .art-player-bar');
  assert.match(css, /\.art-pb-timeline\s*\{/, 'Must define .art-pb-timeline');
  assert.match(css, /\.art-pb-fill\s*\{/, 'Must define .art-pb-fill');
  assert.match(css, /\.art-translate-btn\s*\{/, 'Must define .art-translate-btn');
  assert.match(css, /\.art-translate-btn\.active\s*\{/, 'Must define .art-translate-btn.active');
  assert.match(css, /\.art-cs-play-btn\s*\{/, 'Must define .art-cs-play-btn');
  assert.match(css, /\.art-cs-play-btn\.playing\s*\{/, 'Must define .art-cs-play-btn.playing');

  // Must use variables for styling
  assert.match(css, /var\(--fs-surface-card\)/, 'Must use surface-card token');
  assert.match(css, /var\(--fs-accent-text\)/, 'Must use accent-text token');
  assert.match(css, /var\(--fs-tint\)/, 'Must use tint token');
});

test('M33.4: js/01d-player.js defines audio control and speed handler functions', () => {
  const js = fs.readFileSync(path.join(__dirname, '../js/01d-player.js'), 'utf8');

  assert.match(js, /window\.toggleArtAudioPlay\s*=/, 'Must export toggleArtAudioPlay');
  assert.match(js, /window\.setArtAudioSpeed\s*=/, 'Must export setArtAudioSpeed');
  assert.match(js, /window\.commitArtRateInput\s*=/, 'Must export commitArtRateInput');
  assert.match(js, /window\.artRateInputKey\s*=/, 'Must export artRateInputKey');
  assert.match(js, /window\.toggleArticleRec\s*=/, 'Must export toggleArticleRec');
  assert.match(js, /art-player-bar/, 'Must handle art-player-bar visibility');
});
