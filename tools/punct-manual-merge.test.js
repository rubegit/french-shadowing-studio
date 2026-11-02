// tools/punct-manual-merge.test.js
// Kiểm tra tính năng "Ghép toàn bộ chữ chuẩn" (mergeManualIntoAsr) cho phụ đề video,
// kiểm tra việc bảo toàn userPunct cho video ngoài YouTube trong saveToLocalHistory,
// và kiểm tra prompt Song ngữ sau khi ghép chữ chuẩn.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

class MockHTMLInputElement {}
Object.defineProperty(MockHTMLInputElement.prototype, 'value', {
  configurable: true,
  get() { return this._value || ''; },
  set(v) { this._value = v; }
});

const dummyEl = {
  style: {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  appendChild: () => {},
  removeChild: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => dummyEl,
  querySelectorAll: () => [],
  setAttribute: () => {},
  getAttribute: () => null,
  closest: () => dummyEl,
  textContent: '',
  innerHTML: '',
  value: '',
  scrollTop: 0
};

function createSubtitlesEnv() {
  const filePath = path.join(__dirname, '..', 'js', '01c-subtitles.js');
  const code = fs.readFileSync(filePath, 'utf8');
  const sandbox = {
    console, Set, Map, Math, String, Array, Date, Infinity, parseFloat, parseInt, Boolean,
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: () => {},
    setTimeout, clearTimeout,
    HTMLInputElement: MockHTMLInputElement,
    window: { addEventListener: () => {}, removeEventListener: () => {} }
  };
  const fn = new Function('sandbox', 'with(sandbox) {\n' + code + '\n return { mergeManualIntoAsr, aicPlainTranscript }; }');
  return fn(sandbox);
}

function createPlayerEnv() {
  const codeSub = fs.readFileSync(path.join(__dirname, '..', 'js', '01c-subtitles.js'), 'utf8');
  const codePlayer = fs.readFileSync(path.join(__dirname, '..', 'js', '01d-player.js'), 'utf8');

  let store = {};
  const sandbox = {
    console, Set, Map, Math, String, Array, Date, Infinity, parseFloat, parseInt, Boolean,
    localStorage: {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
      clear: () => { store = {}; }
    },
    categoryStructure: {},
    hiddenVideoMap: {},
    videoMetadataMap: {},
    currentVideoId: '',
    currentVideoTitle: '',
    sentences: [],
    subtitleFormat: '',
    currentSentenceIndex: 0,
    isTextMode: false,
    userTransVid: '',
    userPunctVid: '',
    pendingSeekTime: null,
    aicHasTranslation: () => false,
    aiClone: (x) => JSON.parse(JSON.stringify(x)),
    selectCategoryVideo: () => {},
    captureHomeState: () => {},
    inputUrl: dummyEl,
    startBtn: dummyEl,
    parseErrorMessage: dummyEl,
    parseErrorAlert: dummyEl,
    fileStatusBadge: dummyEl,
    checkStartReady: () => {},
    resetPlaybackTrackingState: () => {},
    initYouTubePlayer: () => {},
    renderSubtitleList: () => {},
    parseYouTubeId: () => null,
    resetSubtitleSearch: () => {},
    resetBilingualForNewVideo: () => {},
    stopSubtitleLoop: () => {},
    updateActiveSentenceDisplay: () => {},
    ensurePageFocus: () => {},
    trackAndShowVideoStats: () => {},
    document: {
      body: dummyEl,
      createElement: () => dummyEl,
      getElementById: () => dummyEl,
      querySelector: () => dummyEl,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 0),
    cancelAnimationFrame: () => {},
    setTimeout, clearTimeout,
    HTMLInputElement: MockHTMLInputElement,
    window: { ensureYouTubeIframeApi: () => {}, addEventListener: () => {}, removeEventListener: () => {} }
  };

  const fn = new Function('sandbox', 'with(sandbox) {\n' + codeSub + '\n' + codePlayer + '\n return { saveToLocalHistory, getLocalHistory, isLibraryVideo, setUserPunctVid: (v) => { userPunctVid = v; } }; }');
  return fn(sandbox);
}

function createAiEnv() {
  const codeSub = fs.readFileSync(path.join(__dirname, '..', 'js', '01c-subtitles.js'), 'utf8');
  const codeAi = fs.readFileSync(path.join(__dirname, '..', 'js', '01e-translate-ai.js'), 'utf8');

  const sandbox = {
    console, Set, Map, Math, String, Array, Date, Infinity, parseFloat, parseInt, Boolean,
    sentences: [],
    currentVideoId: '',
    currentVideoTitle: '',
    isTextMode: false,
    subtitleFormat: 'srt',
    settings: { bilingual: false },
    searchQuery: '',
    document: {
      body: dummyEl,
      createElement: () => dummyEl,
      getElementById: () => dummyEl,
      querySelector: () => dummyEl,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {}
    },
    window: { addEventListener: () => {}, removeEventListener: () => {} }
  };

  const fn = new Function('sandbox', 'with(sandbox) {\n' + codeSub + '\n' + codeAi + '\n return { aiBuildPrompt, setSentences: (s) => { sentences = s; }, aiApplyManualMerge }; }');
  return fn(sandbox);
}

test('Test 1: saveToLocalHistory cho phép lưu userPunct và userPunctAt cho video ngoài YouTube (isLib = false)', () => {
  const { saveToLocalHistory, getLocalHistory, isLibraryVideo } = createPlayerEnv();
  const vid = '-4p0fngSbUs';
  const now = Date.now();

  assert.equal(isLibraryVideo(vid), false, 'Video -4p0fngSbUs không phải video thư viện');

  // Lưu history với userPunct: true
  saveToLocalHistory({
    videoId: vid,
    title: 'Easy French 67',
    sentences: [{ id: 1, text: 'test', words: [{ word: 'test', startTime: 0, endTime: 1 }] }],
    userPunct: true,
    userPunctAt: now
  });

  const hist = getLocalHistory();
  const item = hist.find((h) => h.videoId === vid);
  assert.ok(item, 'Item phải được lưu trong local history');
  assert.equal(item.userPunct, true, 'userPunct phải là true kể cả khi !isLib');
  assert.equal(item.userPunctAt, now, 'userPunctAt phải được bảo toàn kể cả khi !isLib');
});

test('Test 2: mergeManualIntoAsr thay thế toàn bộ chữ theo bản transcript chuẩn cho video Easy French 67', () => {
  const { mergeManualIntoAsr, aicPlainTranscript } = createSubtitlesEnv();

  // Mock ASR có các từ nghe nhầm của YouTube
  const rawAsr = [
    'Bonjour! Bienvenue dans un nouvel épisode des French.',
    'On se rend dans un boulanger ou éventuellement dans un magasin plus important,',
    'et ensuite on paye concept baguette en fonction du prix qui est octroyé par la boulangerie.',
    'je j\'vais vous prendre le bail est, s\'il vous plaît.',
    'Bonjour, j\'aimerais acheter un poisson it bags.',
    'Merci beaucoup d\'avoir regardé l\'autre épisode daisy French,',
    'Merci, à bientôt.'
  ];

  let t = 0;
  const mockSents = rawAsr.map((line, idx) => {
    const words = line.split(/\s+/).filter(Boolean).map((w) => ({ word: w, startTime: t, endTime: (t += 0.5) }));
    return { id: idx + 1, startTime: words[0].startTime, endTime: words[words.length - 1].endTime, text: line, words };
  });

  const correctedText = [
    'Bonjour ! Bienvenue dans un nouvel épisode d\'Easy French.',
    'On se rend dans une boulangerie ou éventuellement dans un magasin plus important,',
    'et ensuite on paye pour cette baguette en fonction du prix qui est octroyé par la boulangerie.',
    'Bonjour, j\'vais vous prendre une baguette, s\'il vous plaît.',
    'Bonjour, j\'aimerais acheter un croissant et une baguette, s\'il vous plaît.',
    'Merci beaucoup d\'avoir regardé notre épisode d\'Easy French,',
    'Merci, à bientôt.'
  ].join('\n');

  const res = mergeManualIntoAsr(mockSents, correctedText);
  assert.equal(res.ok, true, 'mergeManualIntoAsr phải thành công');

  const plain = aicPlainTranscript(res.sentences);

  // Phải có chữ đúng
  assert.ok(plain.includes("d'Easy French"), "Phải chứa d'Easy French");
  assert.ok(plain.includes('une boulangerie'), 'Phải chứa une boulangerie');
  assert.ok(plain.includes('pour cette baguette'), 'Phải chứa pour cette baguette');
  assert.ok(plain.includes('une baguette'), 'Phải chứa une baguette');
  assert.ok(plain.includes('un croissant et une baguette'), 'Phải chứa un croissant et une baguette');

  // Không còn chữ sai
  assert.equal(plain.includes('des French'), false, 'Không còn des French');
  assert.equal(plain.includes('concept baguette'), false, 'Không còn concept baguette');
  assert.equal(plain.includes('bail est'), false, 'Không còn bail est');
  assert.equal(plain.includes('poisson it bags'), false, 'Không còn poisson it bags');
  assert.equal(plain.includes('daisy French'), false, 'Không còn daisy French');
});

test('Test 3: aiBuildPrompt("trans-player") xuất ra văn bản tiếng Pháp đã sửa sau khi ghép chữ chuẩn', () => {
  const { aiBuildPrompt, setSentences } = createAiEnv();

  const mockSents = [
    {
      id: 1,
      startTime: 0,
      endTime: 2,
      words: [
        { word: 'Bonjour,', startTime: 0, endTime: 0.5 },
        { word: "j'aimerais", startTime: 0.5, endTime: 1.0 },
        { word: 'acheter', startTime: 1.0, endTime: 1.5 },
        { word: 'un', startTime: 1.5, endTime: 1.7 },
        { word: 'croissant', startTime: 1.7, endTime: 2.0 }
      ]
    }
  ];

  setSentences(mockSents);
  const prompt = aiBuildPrompt('trans-player');

  assert.ok(prompt.includes('<<<'), 'Prompt có khối <<<');
  assert.ok(prompt.includes('>>>'), 'Prompt có khối >>>');
  assert.ok(prompt.includes("Bonjour, j'aimerais acheter un croissant"), 'Prompt chứa câu tiếng Pháp đã sửa');
  assert.equal(prompt.includes('poisson it bags'), false, 'Prompt không chứa lỗi ASR cũ');
});

test('Test 4: mergeManualIntoAsr không nhồi từ ASR nghe nhầm (bảo đảm sạch với video 7wUXSXZgNlU)', () => {
  const { mergeManualIntoAsr, aicPlainTranscript } = createSubtitlesEnv();

  const asrRaw = `on parle souvent ne va veut réfléchi mais en fait le terme général et verbe pronominal il s'applique aux verts devant lesquels on place un pronom représentant le sujet aujourd'hui on va vous présenter les verbes pronominaux avec des petites histoires c'est parti si vous voulez tout savoir sur ce sujet et même sur tous les autres points épineux de la grammaire française inscrivez-vous sur pas très haut pour accéder à une banque des grammaires détaillé avec des explications claires et des petits quizz pour tester votre compréhension [Musique] se lever se réveiller se prépare et faire quelque chose ce dauchez se coiffer s'habiller se maquiller s'installer s'appelait hélène se lèvent de bonne heure comme tous les matins pour bien se révéler elle se fait du café et se prépare un bon petit déjeuner ensuite elle va à la salle de bain pour se débarbouiller c'est à dire se laver le visage et se brosser les dents pendant que son chéri sunrise elle va se doucher [Musique] après quoi elle se sèche les cheveux se coiffe hessabi [Musique] elle se regarde dans le miroir et se demande si elle va se maquiller ce matin je me maquille ou pas puis elle regarde leurs fourches me dépêche elle se rend compte qu'elle doit se dépêcher si elle ne veut pas être en retard à sa ruine sous une fois prête elle s'installe sur son siège face à son ordinateur et se connecte pour débuter sa journée de travail elle attend que je dis tu es l'état la compacte elle s'appelle au moins une fois par semaine se rencontrer se promener se saluer se voir s'arrêter s'amuser et l'année judith se rencontrent par hasard dans la rue pendant qu'elle se promène elles se sont vues de loin et se sait qu salut ça va ça va et toi après avoir pris des nouvelles l'une de l'autre elles partent se balader ensemble elle s'arrête devant un magasin avec une drôle de vitrine elle se met à rien alice la mousse bien ensemble [Musique] se discute et s'éloigner se taire se souvenir s'approcher s'excuser judith et hélène se dispute thường ces derniers temps julie n'est pas contente qu'hélène l'appel - elle sans qu hélène s'éloigne d'elle un peu judith est triste và se souvient des bons moments qu'elle avait l'habitude de passer avec il est elle décide de crever l'abcès de s'approcher des laines qui elle est assise un peu plus loin et qui préfèrent se taire plutôt que de dire des choses qu'elle ne pense pas judith veut trop en parler et s'excuse et s'il ya lieu elles finissent par se réconcilier et oui c'est aussi ça l'amitié savoir se pardonner [Musique] je me promène tu te promènes il/elle où se promènent nous nous promenons vous vous promenez il elle se promène merci les amis d'avoir regarder cet épisode on espère qu'il vous a plu n'oubliez pas de vous abonner à notre chaîne pour ne rater aucune de nos vidéos à bientôt [Musique] m`;

  const manualText = `On parle souvent de verbe réfléchi,
mais en fait, le terme général est verbe pronominal.
Il s'applique aux verbes devant lesquels on place un pronom représentant le sujet.
Aujourd'hui, on va vous présenter les verbes pronominaux với des petites histoires.
C'est parti !
Si vous voulez tout savoir sur ce sujet
et même sur tous les autres points épineux de la grammaire française,
inscrivez-vous sur Patreon pour accéder à une banque de grammaire détaillée
avec des explications claires và des petits quiz pour tester votre compréhension.
(Musique).
Se lever, se réveiller, se préparer à faire quelque chose,
se doucher, se coiffer, s'habiller, se maquiller, s'installer, s'appeler.
Hélène se lève de bonne heure comme tous les matins.
Pour bien se réveiller, elle se fait du café và se prépare un bon petit déjeuner.
Ensuite, elle va à la salle de bain pour se débarbouiller,
c'est-à-dire se laver le visage và se brosser les dents.
Pendant que son chéri se réveille, elle va se doucher.
(Musique).
Après quoi, elle se sèche les cheveux, se coiffe và s'habille.
(Musique).
Elle se regarde dans le miroir và se demande si elle va se maquiller ce matin :
Je me maquille ou pas ?
Puis elle regarde l'heure :
Faut que je me dépêche !
Elle se rend compte qu'elle doit se dépêcher si elle ne veut pas être en retard à sa réunion Zoom.
Une fois prête, elle s'installe sur son siège face à son ordinateur
et se connecte pour débuter sa journée de travail.
Elle attend que Judith la contacte.
Elles s'appellent au moins une fois par semaine.
Se rencontrer, se promener, se saluer, se voir, s'arrêter, s'amuser.
Hélène et Judith se rencontrent par hasard dans la rue pendant qu'elles se promènent.
Elles se sont vues de loin và se saluent :
Salut, ça va ?
Ça va, và toi ?
Après avoir pris des nouvelles l'une de l'autre, elles partent se balader ensemble.
Elles s'arrêtent devant un magasin với une drôle de vitrine.
Elles se mettent à rire, elles s'amusent bien ensemble.
(Musique).
Se disputer, s'éloigner, se taire, se souvenir, s'approcher, s'excuser.
Judith et Hélène se disputent thường ces derniers temps.
Judith n'est pas contente qu'Hélène l'appelle moins.
Elle sent qu'Hélène s'éloigne d'elle un peu.
Judith est triste và se souvient des bons moments qu'elle avait l'habitude de passer với Hélène.
Elle décide de crever l'abcès, de s'approcher d'Hélène,
qui, elle, est assise un peu plus loin và qui préfère se taire
plutôt que de dire des choses qu'elle ne pense pas.
Judith veut trop en parler và s'excuser s'il y a lieu.
Elles finissent par se réconcilier.
Et oui, c'est aussi ça l'amitié : savoir se pardonner.
(Musique).
Je me promène,
tu te promènes,
il, elle, on se promène,
nous nous promenons,
vous vous promenez,
ils, elles se promènent.
Merci les amis d'avoir regardé cet épisode.
On espère qu'il vous a plu.
N'oubliez pas de vous abonner à notre chaîne pour ne rater aucune de nos vidéos.
À bientôt !
(Musique).`;

  let t = 0;
  const words = asrRaw.split(/\s+/).filter(Boolean).map((w) => ({ word: w, startTime: t, endTime: (t += 0.3) }));
  const asrSents = [{ id: 1, startTime: 0, endTime: t, words }];

  const res = mergeManualIntoAsr(asrSents, manualText);
  assert.equal(res.ok, true, 'mergeManualIntoAsr phải thành công với 7wUXSXZgNlU');

  const plain = aicPlainTranscript(res.sentences);

  // Phải có chữ đúng
  assert.ok(plain.includes('On parle souvent de verbe réfléchi'), 'Phải là "souvent de", không phải "souvent ne de"');
  assert.ok(plain.includes('sur Patreon'), 'Phải là "sur Patreon", không phải "pas très Patreon"');
  assert.ok(plain.includes('Judith la contacte'), 'Phải là "Judith la contacte", không phải "je dis tu es Judith"');
  assert.ok(plain.includes('se saluent'), 'Phải là "se saluent", không phải "se sait saluent"');
  assert.ok(plain.includes('se mettent à rire'), 'Phải là "à rire", không phải "à rien rire"');
  assert.ok(plain.includes('Se disputer'), 'Phải là "Se disputer", không phải "Se discute disputer"');
  assert.ok(plain.includes('Elle sent qu\'Hélène'), 'Phải là "Elle sent", không phải "Elle sans sent"');
  assert.ok(plain.includes('passer với Hélène') || plain.includes('passer avec Hélène'), 'Phải chứa passer avec Hélène');
  assert.ok(plain.includes('s\'approcher d\'Hélène'), 'Phải là "d\'Hélène", không phải "des d\'Hélène"');

  // Tuyệt đối không còn từ rác ASR bị chèn
  assert.equal(plain.includes('ne de verbe'), false, 'Không còn ne de verbe');
  assert.equal(plain.includes('pas très Patreon'), false, 'Không còn pas rất Patreon');
  assert.equal(plain.includes('je dis tu es Judith'), false, 'Không còn je dis tu es Judith');
  assert.equal(plain.includes('se sait saluent'), false, 'Không còn se sait saluent');
  assert.equal(plain.includes('rien rire'), false, 'Không còn rien rire');
  assert.equal(plain.includes('discute disputer'), false, 'Không còn discute disputer');
  assert.equal(plain.includes('sans sent'), false, 'Không còn sans sent');
  assert.equal(plain.includes('il Hélène'), false, 'Không còn il Hélène');
  assert.equal(plain.includes('des d\'Hélène'), false, 'Không còn des d\'Hélène');
});
