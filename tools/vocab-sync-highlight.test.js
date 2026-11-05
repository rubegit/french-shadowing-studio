'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Tạo mock element thông minh
function createDummyEl() {
  return {
    addEventListener: () => {},
    removeEventListener: () => {},
    querySelectorAll: () => [],
    querySelector: () => null,
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    style: {},
    setAttribute: () => {},
    getAttribute: () => '',
    removeAttribute: () => {}
  };
}

global.window = global;
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.screen = { width: 1024, height: 768 };
global.document = {
  getElementById: () => createDummyEl(),
  querySelectorAll: () => [],
  querySelector: () => null,
  addEventListener: () => {},
  documentElement: { dataset: {} }
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.currentVideoId = '7wUXSXZgNlU';
global.isTextMode = false;
global.sentences = [];
global.getVocab = () => [];
global.getLocalHistory = () => [];

// Tải file mã nguồn
const codeVocabList = fs.readFileSync(path.join(__dirname, '../js/01g-vocab-list.js'), 'utf8');
const codeAudioSync = fs.readFileSync(path.join(__dirname, '../js/06-audio-sync.js'), 'utf8');

eval(codeVocabList);
eval(codeAudioSync);

test('M3.1 - hlExample tô sáng chính xác 17 ví dụ tiếng Pháp thực tế', () => {
  const cases = [
    { term: 'en fait', ex: "Je pensais qu'il était français, mais en fait il est belge." },
    { term: "C'est parti !", ex: "Tout le monde est prêt ? Alors, c'est parti !" },
    { term: 'point épineux', ex: "C'est un point épineux du projet qu'il faut régler rapidement." },
    { term: 'de bonne heure', ex: 'Demain, je dois partir de bonne heure pour éviter les bouchons.' },
    { term: 'se faire du café', ex: 'Attends une minute, je me fais un café avant de commencer.' },
    { term: 'se débarbouiller', ex: 'Va te débarbouiller avant de passer à table !' },
    { term: 'se brosser les dents', ex: "N'oublie pas de te brosser les dents avant de dormir." },
    { term: 'après quoi', ex: 'Nous avons déjeuné, après quoi nous sommes allés au cinéma.' },
    { term: 'Faut que', ex: "Faut que j'y aille, je suis en retard !" },
    { term: 'se rendre compte', ex: 'Je me suis rendu compte de mon erreur trop tard.' },
    { term: 'être en retard', ex: 'Dépêche-toi, le train va partir et on est en retard !' },
    { term: 'par hasard', ex: "J'ai croisé mon ancien professeur par hasard au supermarché." },
    { term: 'prendre des nouvelles', ex: "Je t'appelle juste pour prendre de tes nouvelles." },
    { term: 'se balader', ex: 'Le dimanche après-midi, nous aimons nous balader dans le parc.' },
    { term: 'se mettre à', ex: "Tout à coup, il s'est mis à pleuvoir très fort." },
    { term: 'ces derniers temps', ex: 'Je suis rất occupé par mon travail ces derniers temps.' },
    { term: "avoir l'habitude de", ex: "J'ai l'habitude de prendre un thé vert après le déjeuner." }
  ];

  cases.forEach((c) => {
    const res = hlExample(c.ex, c.term);
    assert.ok(res.includes('<mark>'), `hlExample thất bại với từ "${c.term}" trong câu: "${c.ex}"`);
  });
});

test('M3.2 - smartHighlightInContext tô sáng đúng ngữ cảnh và tự sửa tọa độ hs/he sai', () => {
  const en = 'elles partent se balader ensemble.';
  // Giả lập hs, he bị lệch vào dấu chấm cuối câu (phản thân chỉ tô động từ nòng cốt balader)
  const resBadCoord = smartHighlightInContext(en, 'se balader', 33, 34);
  assert.ok(resBadCoord.includes('<mark class="vocab-hl">balader</mark>') || resBadCoord.includes('<mark class="vocab-hl">se balader</mark>'), 'Phải tự sửa tọa độ hs/he sai để highlight đúng "balader"');

  const enConj = "Après avoir pris des nouvelles l'une de l'autre";
  const resConj = smartHighlightInContext(enConj, 'prendre des nouvelles');
  assert.ok(resConj.includes('<mark class="vocab-hl">pris des nouvelles</mark>'), 'Phải highlight động từ đã chia "pris des nouvelles"');
});

test('M3.3 - computeVocabMap tìm đúng toạ độ cho cả 2 từ trong cùng một câu phụ đề', () => {
  const S = [
    {
      id: 101,
      startTime: 183.6,
      endTime: 191.51,
      text: "Après avoir pris des nouvelles l'une de l'autre, elles partent se balader ensemble.",
      words: [
        { word: 'Après', startTime: 183.6, endTime: 184.0 },
        { word: 'avoir', startTime: 184.0, endTime: 184.3 },
        { word: 'pris', startTime: 184.3, endTime: 184.7 },
        { word: 'des', startTime: 184.7, endTime: 185.0 },
        { word: 'nouvelles', startTime: 185.0, endTime: 185.6 },
        { word: "l'une", startTime: 185.6, endTime: 186.0 },
        { word: 'de', startTime: 186.0, endTime: 186.2 },
        { word: "l'autre,", startTime: 186.2, endTime: 186.7 },
        { word: 'elles', startTime: 186.7, endTime: 187.0 },
        { word: 'partent', startTime: 187.0, endTime: 187.5 },
        { word: 'se', startTime: 187.5, endTime: 187.8 },
        { word: 'balader', startTime: 187.8, endTime: 188.3 },
        { word: 'ensemble.', startTime: 188.3, endTime: 191.51 }
      ]
    }
  ];

  const vocab = [
    {
      id: 'v1',
      videoId: 'yt:7wUXSXZgNlU',
      text: 'prendre des nouvelles',
      en: "Après avoir pris des nouvelles l'une de l'autre",
      t: 183.6
    },
    {
      id: 'v2',
      videoId: '7wUXSXZgNlU',
      text: 'se balader',
      en: 'elles partent se balader ensemble.',
      t: 187.5
    }
  ];

  global.getVocab = () => vocab;
  global.sentences = S;
  global.currentVideoId = '7wUXSXZgNlU';

  const map = window.computeVocabMap(S, '7wUXSXZgNlU');
  assert.ok(map.has('101'), 'Phải tìm thấy câu 101');
  const ranges = map.get('101');
  assert.equal(ranges.length, 2, 'Cả 2 từ đều phải được lập toạ độ trong câu 101');

  // Kiểm tra cờ class áp dụng cho các từ
  const toks = S[0].words.map((w) => w.word);
  const fl = window.vsFlags(S[0], toks);
  assert.ok(fl, 'Phải sinh danh sách class cho câu 101');

  // pris des nouvelles: vị trí 2, 3, 4
  assert.ok(fl[2].includes('vs-w') && fl[2].includes('vs-first'), 'pris phải có class vs-w vs-first');
  assert.ok(fl[3].includes('vs-w') && fl[3].includes('vs-cont'), 'des phải có class vs-w vs-cont');
  assert.ok(fl[4].includes('vs-w') && fl[4].includes('vs-last'), 'nouvelles phải có class vs-w vs-last');

  // l'une, de, l'autre, elles, partent: không highlight
  assert.equal(fl[5], '');
  assert.equal(fl[6], '');
  assert.equal(fl[7], '');
  assert.equal(fl[8], '');
  assert.equal(fl[9], '');

  // se balader: vị trí 10, 11
  assert.ok(fl[10].includes('vs-w') && fl[10].includes('vs-first'), 'se phải có class vs-w vs-first');
  assert.ok(fl[11].includes('vs-w') && fl[11].includes('vs-last'), 'balader phải có class vs-w vs-last');

  // ensemble: vị trí 12 không highlight
  assert.equal(fl[12], '');
});
