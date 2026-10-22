/**
 * ============================================================================
 * FRENCH SHADOWING STUDIO - VOCABULARY PRACTICE HUB
 * Module M1: Speed Quiz (Trắc nghiệm 4 đáp án)
 * Module M2: Audio & Video Cloze Test (Luyện Nghe & Điền từ khuyết)
 * Module M3: 3D Flashcards & Fast Match Game (Thẻ ghi nhớ & Ghép thẻ)
 * Module M4: Deep Spaced Repetition (SRS SuperMemo SM-2) Engine across all modes
 * ============================================================================
 */

(function () {
  'use strict';

  // Curated fallback French words if user has fewer than 4 saved words (tagged with standard Larousse abbreviations)
  const CURATED_FALLBACK_VOCAB = [
    { text: 'bonjour', wordVi: '[loc.] xin chào (buổi sáng/ngày)', en: 'Bonjour, comment allez-vous aujourd’hui ?' },
    { text: 'merci', wordVi: '[loc.] cảm ơn', en: 'Merci nhiều pour votre aide précieuse.' },
    { text: "s'il vous plaît", wordVi: '[loc.] làm ơn / xin vui lòng', en: 'Un café noir, s’il vous plaît.' },
    { text: 'beaucoup', wordVi: '[adv.] rất nhiều', en: 'J’aime beaucoup voyager en France.' },
    { text: 'toujours', wordVi: '[adv.] luôn luôn / vẫn', en: 'Il est toujours à l’heure aux rendez-vous.' },
    { text: 'maintenant', wordVi: '[adv.] bây giờ / hiện tại', en: 'Nous pouvons commencer la leçon maintenant.' },
    { text: 'magnifique', wordVi: '[adj.] tuyệt vời / lộng lẫy', en: 'Cette vue sur Paris est vraiment magnifique.' },
    { text: 'comprendre', wordVi: '[v. inf.] hiểu', en: 'Je commence à bien comprendre le français.' },
    { text: "aujourd'hui", wordVi: '[adv.] hôm nay', en: 'Quel temps fait-il aujourd’hui à Lyon ?' },
    { text: 'ensemble', wordVi: '[adv.] cùng nhau', en: 'Nous allons pratiquer le français ensemble.' },
    { text: "d'accord", wordVi: '[loc.] đồng ý / được thôi', en: 'D’accord, on se retrouve demain matin.' },
    { text: 'irons', wordVi: '[v. aller · fut. 1p] chúng tôi sẽ đi', en: 'Demain, nous irons visiter le musée du Louvre.' },
    { text: 'savait', wordVi: '[v. savoir · imp. 3s] anh ấy/cô ấy đã biết', en: 'Il savait déjà toute la vérité.' },
    { text: 'voyage', wordVi: '[n.m.] chuyến đi, hành trình', en: 'Bon voyage et à très bientôt !' },
    { text: 'maison', wordVi: '[n.f.] ngôi nhà', en: 'Bienvenue dans notre nouvelle maison.' }
  ];

  // ==================== FRENCH GRAMMAR TAGGING & ANTI-SPOIL HELPERS (M5) ====================
  function maskGrammarTag(text) {
    if (!text) return '';
    // Transforms [v. aller · fut. 1p] -> [v. fut. 1p] (anti-spoil: conceals root verb while keeping tense & person)
    return String(text).replace(/\[v\.\s*([^·\]]+)\s*·\s*([^\]]+)\]/gi, (match, root, rest) => {
      return `[v. ${rest.trim()}]`;
    });
  }

  function extractGrammarTag(text) {
    if (!text) return '';
    const m = String(text).match(/\[(v\.[^\]]*|n\.m\.|n\.f\.|n\.pl\.|n\.m\.\/f\.|adj\.|adv\.|loc\.[^\]]*|prep\.|conj\.)\]/i);
    return m ? m[0] : '';
  }

  function formatGrammarBadgeHtml(text, options = {}) {
    if (!text) return '';
    let str = String(text);
    if (options.mask) {
      str = maskGrammarTag(str);
    }
    return str.replace(/\[(v\.[^\]]*|n\.m\.|n\.f\.|n\.pl\.|n\.m\.\/f\.|adj\.|adv\.|loc\.[^\]]*|prep\.|conj\.)\]/gi, (match, tag) => {
      let colorClass = 'vph-badge-default';
      const t = tag.toLowerCase().trim();
      if (t.startsWith('v.')) colorClass = 'vph-badge-verb';
      else if (t === 'n.m.') colorClass = 'vph-badge-nm';
      else if (t === 'n.f.') colorClass = 'vph-badge-nf';
      else if (t.startsWith('adj') || t.startsWith('adv')) colorClass = 'vph-badge-adj';
      else if (t.startsWith('loc')) colorClass = 'vph-badge-loc';
      return `<span class="vph-grammar-badge ${colorClass}" title="${escHtml(match)}">${escHtml(match)}</span>`;
    });
  }

  // ==================== SPACED REPETITION (SM-2) CORE ====================
  function srsDefault() {
    return { ease: 2.5, interval: 0, reps: 0, due: 0, lastReview: null };
  }

  function getSrs(item) {
    return Object.assign(srsDefault(), item && item.srs ? item.srs : {});
  }

  function srsIsDue(item, now = Date.now()) {
    return getSrs(item).due <= now;
  }

  function srsCompute(s, rating) {
    let { ease, interval, reps } = s;
    const now = Date.now();

    if (rating === 'again') {
      reps = 0;
      ease = Math.max(1.3, ease - 0.2);
      return { ease, interval: 0, reps, due: now + 10 * 60 * 1000, lastReview: now };
    }

    if (rating === 'hard') {
      interval = interval > 0 ? Math.max(1, Math.round(interval * 1.2)) : 1;
      ease = Math.max(1.3, ease - 0.15);
    } else if (rating === 'good') {
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 3;
      else interval = Math.max(1, Math.round(interval * ease));
    } else if (rating === 'easy') {
      interval = reps === 0 ? 4 : Math.max(1, Math.round(interval * ease * 1.3));
      ease = Math.min(2.8, ease + 0.15);
    }

    reps += 1;
    return { ease, interval, reps, due: now + interval * 24 * 60 * 60 * 1000, lastReview: now };
  }

  function srsFormatDelta(ms) {
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${Math.max(1, mins)}p`;
    const days = Math.round(ms / 86400000);
    return days <= 1 ? '1 ngày' : `${days} ngày`;
  }

  // Update item's SRS state in memory + persist to localStorage + Supabase sync
  function updateItemSrs(itemId, rating) {
    if (!itemId) return null;
    const all = getRawVocabList();
    const item = all.find(v => v.id === itemId);
    if (!item) return null;

    const currentSrs = getSrs(item);
    const newSrs = srsCompute(currentSrs, rating);
    item.srs = newSrs;

    persistVocabList(all);
    updateMasteryStats();
    return newSrs;
  }

  // Global Hub State
  const state = {
    isOpen: false,
    currentMode: 'quiz', // 'quiz' | 'cloze' | 'match'
    m3SubMode: 'match',  // 'match' | 'flashcard'
    scope: 'all',
    onlyDue: false,      // SRS filter: only due items
    items: [],
    questions: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    answered: false,
    timerEnabled: true,
    timerSeconds: 12,
    timerRemaining: 12,
    timerInterval: null,
    wrongList: [],

    // Cloze state
    clozeHintsUsed: 0,
    clozeInputEl: null,

    // Match Game state
    matchCards: [],
    selectedCard1: null,
    selectedCard2: null,
    matchedPairsCount: 0,
    totalPairs: 0,
    matchStartTime: null,
    matchTimerInterval: null,
    matchElapsedMs: 0,

    // Flashcard state
    isCardFlipped: false
  };

  // Web Audio Synthesizer for instant offline sound feedback
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playSound(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'correct') {
        // Melodic chime: C5 -> E5 -> G5
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.3);
        });
      } else if (type === 'wrong') {
        // Subtle low buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.22);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.24);
      } else if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch (e) {}
  }

  // Web Speech API for French Pronunciation
  function speakFrench(text, rate = 0.92) {
    if (!('speechSynthesis' in window) || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = 'fr-FR';
      utt.rate = rate;

      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find(v => v.lang.startsWith('fr') && (v.name.includes('Thomas') || v.name.includes('Audrey') || v.name.includes('Amelie') || v.name.includes('Google') || v.name.includes('Natural')));
      if (frVoice) utt.voice = frVoice;

      window.speechSynthesis.speak(utt);
    } catch (e) {}
  }

  // Utility: HTML Escaping
  function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Utility: Normalize French Accents
  function normalizeAccents(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’']/g, "'")
      .replace(/œ/g, 'oe')
      .replace(/æ/g, 'ae')
      .trim()
      .toLowerCase();
  }

  // Retrieve raw saved vocab from storage / app context
  function getRawVocabList() {
    if (typeof window.getVocab === 'function') {
      return window.getVocab();
    }
    try {
      const d = JSON.parse(localStorage.getItem('shadowing_saved_vocab_v1') || '[]');
      return Array.isArray(d) ? d : [];
    } catch (e) {
      return [];
    }
  }

  function getScopedVocabList(scope, onlyDue = false) {
    const all = getRawVocabList();
    let list = all;
    if (scope && scope !== 'all') {
      if (typeof window.vocabSourceInfo === 'function') {
        list = all.filter(x => window.vocabSourceInfo(x).key === scope);
      } else {
        list = all.filter(x => (x.videoId === scope || (x.bookId && x.bookId === scope)));
      }
    }
    if (onlyDue) {
      list = list.filter(item => srsIsDue(item));
    }
    return list;
  }

  // Save updated vocab list back to localStorage and trigger cloud sync
  function persistVocabList(allList) {
    if (typeof window.setVocab === 'function') {
      return window.setVocab(allList);
    }
    try {
      localStorage.setItem('shadowing_saved_vocab_v1', JSON.stringify(allList));
      if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.syncVocabDebounced === 'function') {
        window.FSS_SUPABASE.syncVocabDebounced(allList);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // ==================== QUIZ SESSION GENERATOR (M1 + M4) ====================
  function buildQuizSession(scopedItems) {
    const sourceList = scopedItems.length > 0 ? scopedItems : CURATED_FALLBACK_VOCAB;
    const pool = sourceList.filter(x => x && x.text && (x.wordVi || x.vi));
    
    const combinedPool = [...pool];
    CURATED_FALLBACK_VOCAB.forEach(fb => {
      if (!combinedPool.some(it => it.text.toLowerCase() === fb.text.toLowerCase())) {
        combinedPool.push(fb);
      }
    });

    const shuffled = [...sourceList].sort(() => Math.random() - 0.5);
    const sessionSize = Math.min(10, Math.max(5, shuffled.length));
    const targetSubset = shuffled.slice(0, sessionSize);

    return targetSubset.map((item, qIndex) => {
      const isFrToVi = Math.random() >= 0.4 || !item.wordVi;
      const rawPrompt = isFrToVi ? item.text : (item.wordVi || item.vi || item.text);
      const targetPrompt = isFrToVi ? rawPrompt : maskGrammarTag(rawPrompt);
      
      const rawAnswer = isFrToVi ? (item.wordVi || item.vi || 'Nghĩa từ vựng') : item.text;
      const correctAnswer = isFrToVi ? maskGrammarTag(rawAnswer) : rawAnswer;

      const distractors = [];
      const distractorPool = combinedPool.filter(c => c.text.toLowerCase() !== item.text.toLowerCase()).sort(() => Math.random() - 0.5);

      for (let cand of distractorPool) {
        let val = isFrToVi ? (cand.wordVi || cand.vi) : cand.text;
        if (val) {
          if (isFrToVi) val = maskGrammarTag(val);
          if (val !== correctAnswer && !distractors.includes(val)) {
            distractors.push(val);
            if (distractors.length === 3) break;
          }
        }
      }

      if (distractors.length < 3) {
        for (let fb of CURATED_FALLBACK_VOCAB) {
          let val = isFrToVi ? fb.wordVi : fb.text;
          if (val) {
            if (isFrToVi) val = maskGrammarTag(val);
            if (val !== correctAnswer && !distractors.includes(val)) {
              distractors.push(val);
              if (distractors.length === 3) break;
            }
          }
        }
      }

      const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);

      return {
        id: item.id || `q_${qIndex}`,
        item,
        isFrToVi,
        prompt: targetPrompt,
        correctAnswer,
        options,
        ctx: item.en || '',
        hs: item.hs || 0,
        he: item.he || 0,
        frenchWord: item.text,
        vietnameseMeaning: item.wordVi || item.vi || ''
      };
    });
  }

  // ==================== CLOZE SESSION GENERATOR (M2 + M4) ====================
  function buildClozeSession(scopedItems) {
    const sourceList = scopedItems.length > 0 ? scopedItems : CURATED_FALLBACK_VOCAB;
    const pool = sourceList.filter(x => x && x.text && x.en);
    const candidateList = pool.length > 0 ? pool : CURATED_FALLBACK_VOCAB;

    const shuffled = [...candidateList].sort(() => Math.random() - 0.5);
    const sessionSize = Math.min(10, Math.max(5, shuffled.length));
    const targetSubset = shuffled.slice(0, sessionSize);

    return targetSubset.map((item, qIndex) => {
      const frenchWord = item.text.trim();
      const sentence = (item.en || '').trim();
      const meaning = item.wordVi || item.vi || 'Từ cần điền';

      let maskedSentence = '';
      if (item.he > item.hs && item.he <= sentence.length) {
        maskedSentence = escHtml(sentence.slice(0, item.hs)) + 
          `<span class="vph-cloze-blank-pill" id="vph-blank-pill">_______</span>` + 
          escHtml(sentence.slice(item.he));
      } else {
        const escaped = frenchWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`(${escaped})`, 'i');
        if (re.test(sentence)) {
          maskedSentence = sentence.replace(re, `<span class="vph-cloze-blank-pill" id="vph-blank-pill">_______</span>`);
        } else {
          maskedSentence = `<span class="vph-cloze-blank-pill" id="vph-blank-pill">_______</span> (${sentence})`;
        }
      }

      return {
        id: item.id || `cloze_${qIndex}`,
        item,
        frenchWord,
        sentence,
        maskedSentence,
        meaning,
        videoId: item.videoId || '',
        t: item.t || 0
      };
    });
  }

  // ==================== MATCH GAME SESSION GENERATOR (M3 + M4) ====================
  function buildMatchSession(scopedItems) {
    const sourceList = scopedItems.length > 0 ? scopedItems : CURATED_FALLBACK_VOCAB;
    const pool = sourceList.filter(x => x && x.text && (x.wordVi || x.vi));
    const candidateList = pool.length >= 4 ? pool : CURATED_FALLBACK_VOCAB;

    const shuffled = [...candidateList].sort(() => Math.random() - 0.5);
    const pairCount = Math.min(6, Math.max(4, shuffled.length));
    const selected = shuffled.slice(0, pairCount);

    const cards = [];
    selected.forEach((item, index) => {
      const pairId = `pair_${index}`;
      cards.push({
        id: `fr_${index}`,
        pairId,
        type: 'fr',
        text: item.text,
        item
      });
      cards.push({
        id: `vi_${index}`,
        pairId,
        type: 'vi',
        text: item.wordVi || item.vi || item.text,
        item
      });
    });

    return {
      cards: cards.sort(() => Math.random() - 0.5),
      totalPairs: pairCount
    };
  }

  // ==================== DOM CREATION & HUB STRUCTURE ====================
  function ensureModalElement() {
    let backdrop = document.getElementById('vph-backdrop');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = 'vph-backdrop';
    backdrop.className = 'vph-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    backdrop.innerHTML = `
      <div class="vph-modal" id="vph-modal">
        <!-- Top Header -->
        <div class="vph-header">
          <div class="vph-brand">
            <span class="vph-brand-icon">🎮</span>
            <span>Trung tâm Luyện tập Từ vựng</span>
          </div>
          <button type="button" class="vph-close-btn" id="vph-close-btn" title="Đóng (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <!-- Mode Navigation Bar -->
        <div class="vph-tabs-bar">
          <div class="vph-mode-tabs">
            <button type="button" class="vph-tab-btn active" data-mode="quiz">
              <span>🎯 Trắc nghiệm 4 đáp án</span>
            </button>
            <button type="button" class="vph-tab-btn" data-mode="cloze">
              <span>🎧 Nghe & Điền từ</span>
            </button>
            <button type="button" class="vph-tab-btn" data-mode="match">
              <span>🃏 Ghép thẻ & Flashcard</span>
            </button>
          </div>

          <div class="vph-controls-right">
            <!-- SRS Due Filter Toggle -->
            <button type="button" class="vph-srs-filter-btn" id="vph-srs-filter-btn" title="Chỉ luyện những từ đã đến hạn lặp lại theo Spaced Repetition">
              <span>🧠 Đến hạn:</span>
              <b id="vph-due-badge">0</b>
            </button>

            <!-- Video Scope Selector -->
            <select class="vph-scope-select" id="vph-scope-select" aria-label="Phạm vi từ vựng">
              <option value="all">Toàn bộ kho từ đã lưu</option>
            </select>
          </div>
        </div>

        <!-- SRS Mastery Level Strip -->
        <div class="vph-mastery-strip" id="vph-mastery-strip">
          <div class="vph-mastery-tags">
            <span class="vph-mastery-tag"><span class="vph-dot new"></span> Mới lưu: <b id="vph-stat-new">0</b></span>
            <span class="vph-mastery-tag"><span class="vph-dot learning"></span> Đang củng cố: <b id="vph-stat-learning">0</b></span>
            <span class="vph-mastery-tag"><span class="vph-dot mastered"></span> Thuộc lòng: <b id="vph-stat-mastered">0</b></span>
          </div>
          <div style="font-weight:600; color:#cbd5e1" id="vph-scope-label">Đang xem: Toàn bộ bài học</div>
        </div>

        <!-- Score & Streak Strip -->
        <div class="vph-stats-strip" id="vph-stats-strip">
          <div class="vph-streak-pill" id="vph-streak-pill">
            <span>🔥 Chuỗi:</span>
            <b id="vph-streak-count">0</b>
          </div>

          <div class="vph-progress-track">
            <div class="vph-progress-fill" id="vph-progress-fill" style="width: 0%"></div>
          </div>

          <div class="vph-score-box">
            <span>Điểm:</span>
            <b id="vph-score-count">0</b>
          </div>
        </div>

        <!-- Main Body -->
        <div class="vph-body" id="vph-body">
          <!-- Content dynamically rendered -->
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);

    // Event listeners
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeVocabPracticeHub();
    });

    document.getElementById('vph-close-btn').addEventListener('click', closeVocabPracticeHub);

    // Mode tab switching
    backdrop.querySelectorAll('.vph-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        switchMode(mode);
      });
    });

    // SRS Due Filter Toggle
    const srsBtn = document.getElementById('vph-srs-filter-btn');
    srsBtn.addEventListener('click', () => {
      state.onlyDue = !state.onlyDue;
      srsBtn.classList.toggle('active', state.onlyDue);
      playSound('click');
      startSession();
    });

    // Scope select change
    const scopeSel = document.getElementById('vph-scope-select');
    scopeSel.addEventListener('change', () => {
      state.scope = scopeSel.value;
      startSession();
    });

    // Global Keydown
    window.addEventListener('keydown', handleGlobalKeydown);

    return backdrop;
  }

  function handleGlobalKeydown(e) {
    if (!state.isOpen) return;

    if (e.key === 'Escape') {
      closeVocabPracticeHub();
      return;
    }

    if (state.currentMode === 'quiz' && !state.answered && state.questions.length > 0) {
      const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
      if (e.key in keyMap) {
        e.preventDefault();
        const btns = document.querySelectorAll('.vph-option-btn');
        const idx = keyMap[e.key];
        if (btns[idx]) btns[idx].click();
      } else if (e.key === ' ' && document.activeElement?.tagName !== 'INPUT') {
        const currentQ = state.questions[state.currentIndex];
        if (currentQ) speakFrench(currentQ.frenchWord);
      }
    } else if (state.currentMode === 'cloze') {
      if (e.key === ' ' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const currentQ = state.questions[state.currentIndex];
        if (currentQ) speakFrench(currentQ.sentence);
      }
    } else if (state.currentMode === 'match' && state.m3SubMode === 'flashcard') {
      if (e.key === ' ' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        toggleFlashcardFlip();
      } else if (e.key === '1') {
        rateFlashcard('again');
      } else if (e.key === '2') {
        rateFlashcard('hard');
      } else if (e.key === '3') {
        rateFlashcard('good');
      } else if (e.key === '4') {
        rateFlashcard('easy');
      }
    }
  }

  function switchMode(mode) {
    playSound('click');
    state.currentMode = mode;

    document.querySelectorAll('.vph-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });

    startSession();
  }

  // Update Mastery Stats Bar & Scope Options
  function updateMasteryStats() {
    const allInScope = getScopedVocabList(state.scope, false);
    let newCount = 0, learningCount = 0, masteredCount = 0, dueCount = 0;

    allInScope.forEach(item => {
      const s = getSrs(item);
      if (srsIsDue(item)) dueCount++;
      if (s.reps === 0) newCount++;
      else if (s.interval >= 14 && s.reps >= 2) masteredCount++;
      else learningCount++;
    });

    const dueBadge = document.getElementById('vph-due-badge');
    const newEl = document.getElementById('vph-stat-new');
    const learningEl = document.getElementById('vph-stat-learning');
    const masteredEl = document.getElementById('vph-stat-mastered');

    if (dueBadge) dueBadge.textContent = dueCount;
    if (newEl) newEl.textContent = newCount;
    if (learningEl) learningEl.textContent = learningCount;
    if (masteredEl) masteredEl.textContent = masteredCount;
  }

  function updateScopeOptions() {
    const sel = document.getElementById('vph-scope-select');
    if (!sel) return;

    const all = getRawVocabList();
    const sourceMap = new Map();

    all.forEach(item => {
      if (typeof window.vocabSourceInfo === 'function') {
        const info = window.vocabSourceInfo(item);
        if (info && info.key && info.key !== 'all' && !sourceMap.has(info.key)) {
          sourceMap.set(info.key, info.title);
        }
      } else if (item.videoId && !sourceMap.has(item.videoId)) {
        sourceMap.set(item.videoId, item.videoTitle || item.videoId);
      }
    });

    let opts = `<option value="all">Toàn bộ (${all.length} từ đã lưu)</option>`;
    sourceMap.forEach((title, key) => {
      opts += `<option value="${escHtml(key)}">${escHtml(title)}</option>`;
    });

    sel.innerHTML = opts;
    sel.value = state.scope;

    const scopeLabel = document.getElementById('vph-scope-label');
    if (scopeLabel) {
      if (state.scope === 'all') {
        scopeLabel.textContent = 'Đang xem: Toàn bộ bài học';
      } else {
        const title = sourceMap.get(state.scope) || state.scope;
        scopeLabel.textContent = `Bài: ${title.length > 28 ? title.slice(0, 28) + '…' : title}`;
      }
    }
  }

  // Start new session depending on active mode & SRS filter
  function startSession() {
    stopTimer();
    stopMatchTimer();
    updateMasteryStats();

    const items = getScopedVocabList(state.scope, state.onlyDue);
    state.items = items;
    state.currentIndex = 0;
    state.score = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.wrongList = [];
    state.answered = false;

    // Check if onlyDue is active but 0 due items
    if (state.onlyDue && items.length === 0) {
      renderNoDueItemsScreen();
      return;
    }

    if (state.currentMode === 'quiz') {
      state.questions = buildQuizSession(items);
      updateStatsBar();
      renderQuizQuestion();
    } else if (state.currentMode === 'cloze') {
      state.questions = buildClozeSession(items);
      updateStatsBar();
      renderClozeQuestion();
    } else if (state.currentMode === 'match') {
      if (state.m3SubMode === 'match') {
        startMatchGame(items);
      } else {
        startFlashcards(items);
      }
    }
  }

  function renderNoDueItemsScreen() {
    const body = document.getElementById('vph-body');
    if (!body) return;

    const allInScope = getScopedVocabList(state.scope, false);
    const soonestItem = allInScope.map(x => getSrs(x).due).filter(d => d > Date.now()).sort((a, b) => a - b)[0];
    const deltaStr = soonestItem ? srsFormatDelta(soonestItem - Date.now()) : '';

    body.innerHTML = `
      <div class="vph-empty">
        <div class="vph-empty-icon">🎉</div>
        <h3 style="color:#ffffff; font-size:20px; font-weight:800">Không có từ nào đến hạn ôn!</h3>
        <p style="font-size:14px; line-height:1.6; color:#94a3b8">
          Bạn đã hoàn thành xuất sắc toàn bộ các từ cần ôn theo chu kỳ lặp lại ngắt quãng (SRS).
          ${deltaStr ? `<br>Từ tiếp theo sẽ đến hạn sau khoảng <b>${deltaStr}</b> nữa.` : ''}
        </p>
        <div style="display:flex; gap:10px; margin-top:8px">
          <button type="button" class="vph-primary-btn" id="vph-turn-off-due-btn">
            <span>Luyện tập tất cả (${allInScope.length} từ)</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('vph-turn-off-due-btn')?.addEventListener('click', () => {
      state.onlyDue = false;
      document.getElementById('vph-srs-filter-btn')?.classList.remove('active');
      startSession();
    });
  }

  function updateStatsBar() {
    const streakEl = document.getElementById('vph-streak-count');
    const scoreEl = document.getElementById('vph-score-count');
    const fillEl = document.getElementById('vph-progress-fill');

    if (streakEl) streakEl.textContent = state.streak;
    if (scoreEl) scoreEl.textContent = state.score;

    if (fillEl && state.questions.length > 0) {
      const pct = Math.round((state.currentIndex / state.questions.length) * 100);
      fillEl.style.width = `${pct}%`;
    }
  }

  // ==================== QUIZ MODE ENGINE (M1 + M4) ====================
  function renderQuizQuestion() {
    stopTimer();
    state.answered = false;
    const body = document.getElementById('vph-body');
    if (!body) return;

    if (state.currentIndex >= state.questions.length) {
      renderDoneScreen();
      return;
    }

    updateStatsBar();
    const q = state.questions[state.currentIndex];

    let ctxHtml = '';
    if (q.ctx) {
      if (q.he > q.hs) {
        ctxHtml = escHtml(q.ctx.slice(0, q.hs)) + '<mark>' + escHtml(q.ctx.slice(q.hs, q.he)) + '</mark>' + escHtml(q.ctx.slice(q.he));
      } else {
        ctxHtml = escHtml(q.ctx);
      }
    }

    const directionLabel = q.isFrToVi ? '🇫🇷 Tiếng Pháp → 🇻🇳 Tiếng Việt' : '🇻🇳 Tiếng Việt → 🇫🇷 Tiếng Pháp';
    const srsDueTag = srsIsDue(q.item) ? `<span style="font-size:11px;padding:2px 8px;border-radius:6px;background:rgba(239,68,68,0.2);color:#fca5a5;font-weight:700">Đến hạn ôn</span>` : '';
    const qNum = `Câu ${state.currentIndex + 1} / ${state.questions.length}`;

    body.innerHTML = `
      <div class="vph-quiz-container">
        <!-- Meta & Direction -->
        <div class="vph-quiz-meta">
          <div style="display:flex; align-items:center; gap:8px">
            <span class="vph-direction-badge">${directionLabel}</span>
            ${srsDueTag}
          </div>
          <span style="font-weight:700; color:#cbd5e1">${qNum}</span>
        </div>

        <!-- Timer bar -->
        <div class="vph-timer-bar">
          <div class="vph-timer-fill" id="vph-timer-fill" style="width: 100%"></div>
        </div>

        <!-- Question Prompt -->
        <div class="vph-question-card">
          <div class="vph-question-target">${formatGrammarBadgeHtml(escHtml(q.prompt), { mask: true })}</div>
          
          <button type="button" class="vph-question-audio-btn" id="vph-audio-btn" title="Nghe phát âm tiếng Pháp (Phím Space)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            <span>Phát âm (Space)</span>
          </button>

          ${ctxHtml ? `<div class="vph-question-ctx">"${ctxHtml}"</div>` : ''}
        </div>

        <!-- 4 Options Grid -->
        <div class="vph-options-grid">
          ${q.options.map((opt, i) => `
            <button type="button" class="vph-option-btn" data-index="${i}">
              <span class="vph-opt-key">${i + 1}</span>
              <span class="vph-opt-text">${formatGrammarBadgeHtml(escHtml(opt), { mask: true })}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    body.querySelectorAll('.vph-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        handleQuizAnswer(q.options[idx], btn);
      });
    });

    const audioBtn = document.getElementById('vph-audio-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => speakFrench(q.frenchWord));
    }

    if (q.isFrToVi) {
      setTimeout(() => speakFrench(q.frenchWord), 180);
    }

    startTimer();
  }

  function startTimer() {
    state.timerRemaining = state.timerSeconds;
    const timerFill = document.getElementById('vph-timer-fill');
    if (!timerFill) return;

    timerFill.style.width = '100%';
    const stepMs = 100;
    const totalSteps = (state.timerSeconds * 1000) / stepMs;
    let currentStep = totalSteps;

    state.timerInterval = setInterval(() => {
      currentStep--;
      state.timerRemaining = (currentStep * stepMs) / 1000;
      const pct = Math.max(0, (currentStep / totalSteps) * 100);
      if (timerFill) timerFill.style.width = `${pct}%`;

      if (currentStep <= 0) {
        stopTimer();
        handleQuizAnswer('__TIMEOUT__', null);
      }
    }, stepMs);
  }

  function stopTimer() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function handleQuizAnswer(selectedAnswer, clickedBtn) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();

    const q = state.questions[state.currentIndex];
    const isCorrect = selectedAnswer === q.correctAnswer;
    const allBtns = document.querySelectorAll('.vph-option-btn');

    allBtns.forEach((b, idx) => {
      b.disabled = true;
      if (q.options[idx] === q.correctAnswer) {
        b.classList.add('correct');
        // Unmask root verb on the correct answer button if it has a grammar tag
        if (q.isFrToVi && q.vietnameseMeaning) {
          const optTextEl = b.querySelector('.vph-opt-text');
          if (optTextEl) {
            optTextEl.innerHTML = formatGrammarBadgeHtml(escHtml(q.vietnameseMeaning), { mask: false });
          }
        }
      }
    });

    // If prompt was Vietnamese meaning, unmask the full root verb in the question card
    if (!q.isFrToVi && q.vietnameseMeaning) {
      const targetCard = document.querySelector('.vph-question-target');
      if (targetCard) {
        targetCard.innerHTML = formatGrammarBadgeHtml(escHtml(q.vietnameseMeaning), { mask: false });
      }
    }

    if (isCorrect) {
      playSound('correct');
      state.score += 10 + Math.min(20, state.streak * 2);
      state.streak += 1;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      if (clickedBtn) clickedBtn.classList.add('correct');

      // SM-2 SRS auto-update: fast answer (< 5s) = good/easy, slower = hard
      const elapsedSec = state.timerSeconds - state.timerRemaining;
      const rating = elapsedSec <= 4 && state.streak >= 2 ? 'easy' : (elapsedSec <= 7 ? 'good' : 'hard');
      updateItemSrs(q.item?.id, rating);
    } else {
      playSound('wrong');
      state.streak = 0;
      if (clickedBtn) clickedBtn.classList.add('wrong');
      state.wrongList.push({ frenchWord: q.frenchWord, vietnameseMeaning: q.vietnameseMeaning });

      // SM-2 SRS auto-update: wrong = again
      updateItemSrs(q.item?.id, 'again');
    }

    updateStatsBar();

    setTimeout(() => {
      state.currentIndex++;
      renderQuizQuestion();
    }, 1150);
  }

  // ==================== CLOZE MODE ENGINE (M2 + M4) ====================
  function renderClozeQuestion() {
    state.answered = false;
    state.clozeHintsUsed = 0;
    const body = document.getElementById('vph-body');
    if (!body) return;

    if (state.currentIndex >= state.questions.length) {
      renderDoneScreen();
      return;
    }

    updateStatsBar();
    const q = state.questions[state.currentIndex];
    const qNum = `Câu ${state.currentIndex + 1} / ${state.questions.length}`;

    const ytUrl = (q.videoId && !q.item?.bookId)
      ? `https://www.youtube.com/watch?v=${encodeURIComponent(q.videoId)}&t=${Math.max(0, Math.floor((q.t || 0) - 2))}s`
      : '';

    body.innerHTML = `
      <div class="vph-cloze-container">
        <div class="vph-quiz-meta">
          <div style="display:flex; align-items:center; gap:8px">
            <span class="vph-direction-badge">🎧 Nghe & Điền từ khuyết</span>
            ${srsIsDue(q.item) ? `<span style="font-size:11px;padding:2px 8px;border-radius:6px;background:rgba(239,68,68,0.2);color:#fca5a5;font-weight:700">Đến hạn ôn</span>` : ''}
          </div>
          <span style="font-weight:700; color:#cbd5e1">${qNum}</span>
        </div>

        <div class="vph-cloze-card">
          <div class="vph-cloze-audio-row">
            <button type="button" class="vph-audio-play-btn" id="vph-cloze-audio-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              <span>Nghe cả câu (Pháp)</span>
            </button>

            <button type="button" class="vph-question-audio-btn" id="vph-cloze-word-btn" style="margin-top:0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <span>Nghe từ cần điền</span>
            </button>

            ${ytUrl ? `
              <a href="${ytUrl}" target="_blank" rel="noopener" class="vph-video-play-btn">
                <span>▶ Xem video gốc</span>
              </a>
            ` : ''}
          </div>

          <div class="vph-cloze-sentence">${q.maskedSentence}</div>

          <div class="vph-cloze-meaning">
            Gợi ý nghĩa: <span style="color:#6ee7b7">${formatGrammarBadgeHtml(escHtml(q.meaning), { mask: true })}</span>
          </div>
        </div>

        <form class="vph-cloze-form" id="vph-cloze-form" onsubmit="return false;">
          <div class="vph-input-wrap">
            <input 
              type="text" 
              class="vph-cloze-input" 
              id="vph-cloze-input" 
              placeholder="Gõ từ tiếng Pháp vào đây..." 
              autocomplete="off" 
              autocapitalize="none" 
              spellcheck="false"
            />
            <button type="button" class="vph-hint-btn" id="vph-hint-btn" title="Gợi ý chữ cái đầu">
              <span>💡 Gợi ý</span>
            </button>
            <button type="submit" class="vph-submit-btn" id="vph-submit-btn">
              <span>Kiểm tra</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </button>
          </div>

          <div id="vph-feedback-area"></div>

          <button type="button" class="vph-skip-btn" id="vph-skip-btn">Bỏ qua câu này →</button>
        </form>
      </div>
    `;

    const input = document.getElementById('vph-cloze-input');
    state.clozeInputEl = input;

    setTimeout(() => {
      if (input) input.focus();
    }, 150);

    document.getElementById('vph-cloze-audio-btn')?.addEventListener('click', () => speakFrench(q.sentence));
    document.getElementById('vph-cloze-word-btn')?.addEventListener('click', () => speakFrench(q.frenchWord));

    setTimeout(() => speakFrench(q.sentence), 220);

    const hintBtn = document.getElementById('vph-hint-btn');
    hintBtn?.addEventListener('click', () => {
      playSound('click');
      state.clozeHintsUsed++;
      const target = q.frenchWord;
      const lettersToShow = Math.min(target.length, state.clozeHintsUsed);
      const hintPrefix = target.slice(0, lettersToShow);

      if (input) {
        input.value = hintPrefix;
        input.focus();
      }

      const blankPill = document.getElementById('vph-blank-pill');
      if (blankPill) {
        blankPill.textContent = hintPrefix + '_'.repeat(Math.max(1, target.length - lettersToShow));
      }
    });

    const form = document.getElementById('vph-cloze-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      handleClozeSubmit();
    });

    document.getElementById('vph-skip-btn')?.addEventListener('click', () => {
      handleClozeSkip();
    });
  }

  function handleClozeSubmit() {
    if (state.answered) return;
    const input = state.clozeInputEl;
    if (!input) return;

    const val = input.value.trim();
    if (!val) {
      input.focus();
      return;
    }

    const q = state.questions[state.currentIndex];
    const target = q.frenchWord.trim();
    const feedbackArea = document.getElementById('vph-feedback-area');
    const blankPill = document.getElementById('vph-blank-pill');

    const exactMatch = val.toLowerCase() === target.toLowerCase();
    const normalizedMatch = normalizeAccents(val) === normalizeAccents(target);

    if (exactMatch || normalizedMatch) {
      state.answered = true;
      playSound('correct');
      input.disabled = true;
      input.classList.add('valid');

      if (blankPill) {
        blankPill.textContent = target;
        blankPill.style.color = '#6ee7b7';
        blankPill.style.borderColor = '#10b981';
      }

      const meaningEl = document.querySelector('.vph-cloze-meaning');
      if (meaningEl) {
        meaningEl.innerHTML = `Nghĩa đầy đủ: <span style="color:#6ee7b7">${formatGrammarBadgeHtml(escHtml(q.meaning), { mask: false })}</span>`;
      }

      const bonus = state.clozeHintsUsed === 0 ? 15 : 10;
      state.score += bonus + Math.min(20, state.streak * 2);
      state.streak += 1;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      updateStatsBar();

      // SM-2 SRS auto-update
      const srsRating = (exactMatch && state.clozeHintsUsed === 0) ? 'easy' : (state.clozeHintsUsed <= 1 ? 'good' : 'hard');
      updateItemSrs(q.item?.id, srsRating);

      if (exactMatch) {
        if (feedbackArea) {
          feedbackArea.innerHTML = `<div class="vph-feedback-box success">🎉 Tuyệt vời! Chính xác 100%: <b>${escHtml(target)}</b> — ${formatGrammarBadgeHtml(escHtml(q.meaning), { mask: false })}</div>`;
        }
      } else {
        if (feedbackArea) {
          feedbackArea.innerHTML = `<div class="vph-feedback-box warning">👍 Rất tốt! Hãy lưu ý dấu chính tả: <b>${escHtml(target)}</b> — ${formatGrammarBadgeHtml(escHtml(q.meaning), { mask: false })}</div>`;
        }
      }

      speakFrench(target);

      setTimeout(() => {
        state.currentIndex++;
        renderClozeQuestion();
      }, 1450);
    } else {
      playSound('wrong');
      input.classList.add('invalid');
      setTimeout(() => input.classList.remove('invalid'), 450);

      if (feedbackArea) {
        feedbackArea.innerHTML = `<div class="vph-feedback-box error">Chưa chính xác! Thử lại hoặc bấm "Gợi ý" để xem chữ cái đầu.</div>`;
      }
    }
  }

  function handleClozeSkip() {
    if (state.answered) return;
    state.answered = true;
    playSound('wrong');

    const q = state.questions[state.currentIndex];
    state.streak = 0;
    state.wrongList.push({ frenchWord: q.frenchWord, vietnameseMeaning: q.meaning });
    updateStatsBar();

    // SM-2 SRS auto-update: skipped = again
    updateItemSrs(q.item?.id, 'again');

    const input = state.clozeInputEl;
    if (input) {
      input.value = q.frenchWord;
      input.disabled = true;
      input.classList.add('invalid');
    }

    const blankPill = document.getElementById('vph-blank-pill');
    if (blankPill) {
      blankPill.textContent = q.frenchWord;
      blankPill.style.color = '#fca5a5';
    }

    const meaningEl = document.querySelector('.vph-cloze-meaning');
    if (meaningEl) {
      meaningEl.innerHTML = `Nghĩa đầy đủ: <span style="color:#6ee7b7">${formatGrammarBadgeHtml(escHtml(q.meaning), { mask: false })}</span>`;
    }

    const feedbackArea = document.getElementById('vph-feedback-area');
    if (feedbackArea) {
      feedbackArea.innerHTML = `<div class="vph-feedback-box error">Đáp án đúng là: <b>${escHtml(q.frenchWord)}</b> — ${formatGrammarBadgeHtml(escHtml(q.meaning), { mask: false })}</div>`;
    }

    speakFrench(q.frenchWord);

    setTimeout(() => {
      state.currentIndex++;
      renderClozeQuestion();
    }, 1750);
  }

  // ==================== MATCH GAME & FLASHCARD ENGINE (M3 + M4) ====================
  function startMatchGame(scopedItems) {
    stopMatchTimer();
    state.m3SubMode = 'match';
    const matchData = buildMatchSession(scopedItems);
    state.matchCards = matchData.cards;
    state.totalPairs = matchData.totalPairs;
    state.matchedPairsCount = 0;
    state.selectedCard1 = null;
    state.selectedCard2 = null;
    state.matchStartTime = Date.now();
    state.matchElapsedMs = 0;

    renderMatchScreen();
    startMatchTimer();
  }

  function renderMatchScreen() {
    const body = document.getElementById('vph-body');
    if (!body) return;

    body.innerHTML = `
      <div class="vph-subnav-bar">
        <button type="button" class="vph-subnav-btn active" id="vph-sub-match">🧩 Ghép thẻ nhanh</button>
        <button type="button" class="vph-subnav-btn" id="vph-sub-fc">🎴 Flashcard 3D (SRS)</button>
      </div>

      <div class="vph-match-container">
        <div class="vph-match-meta">
          <span>Chạm vào cặp tương ứng <b>(Pháp ↔ Việt)</b> để ghép</span>
          <div class="vph-match-timer-pill" id="vph-match-stopwatch">⏱️ 00:00.0</div>
        </div>

        <div class="vph-match-grid" id="vph-match-grid">
          ${state.matchCards.map(c => `
            <div class="vph-match-card" data-card-id="${c.id}" data-pair-id="${c.pairId}" data-type="${c.type}">
              <span>${formatGrammarBadgeHtml(escHtml(c.text), { mask: true })}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('vph-sub-match')?.addEventListener('click', () => {
      state.m3SubMode = 'match';
      startMatchGame(getScopedVocabList(state.scope, state.onlyDue));
    });

    document.getElementById('vph-sub-fc')?.addEventListener('click', () => {
      state.m3SubMode = 'flashcard';
      startFlashcards(getScopedVocabList(state.scope, state.onlyDue));
    });

    document.querySelectorAll('.vph-match-card').forEach(cardEl => {
      cardEl.addEventListener('click', () => handleMatchCardClick(cardEl));
    });
  }

  function startMatchTimer() {
    stopMatchTimer();
    state.matchStartTime = Date.now();
    const swEl = document.getElementById('vph-match-stopwatch');

    state.matchTimerInterval = setInterval(() => {
      state.matchElapsedMs = Date.now() - state.matchStartTime;
      const totalSec = state.matchElapsedMs / 1000;
      const mins = Math.floor(totalSec / 60);
      const secs = Math.floor(totalSec % 60);
      const tenths = Math.floor((state.matchElapsedMs % 1000) / 100);

      const str = `⏱️ ${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
      if (swEl) swEl.textContent = str;
    }, 100);
  }

  function stopMatchTimer() {
    if (state.matchTimerInterval) {
      clearInterval(state.matchTimerInterval);
      state.matchTimerInterval = null;
    }
  }

  function handleMatchCardClick(cardEl) {
    if (cardEl.classList.contains('matched') || cardEl.classList.contains('selected')) return;
    if (state.selectedCard1 && state.selectedCard2) return;

    playSound('click');
    cardEl.classList.add('selected');

    if (cardEl.getAttribute('data-type') === 'fr') {
      const cardObj = state.matchCards.find(c => c.id === cardEl.getAttribute('data-card-id'));
      const text = cardObj ? cardObj.text : cardEl.textContent.trim();
      speakFrench(text);
    }

    if (!state.selectedCard1) {
      state.selectedCard1 = cardEl;
    } else {
      state.selectedCard2 = cardEl;
      checkMatchPair();
    }
  }

  function checkMatchPair() {
    const c1 = state.selectedCard1;
    const c2 = state.selectedCard2;
    if (!c1 || !c2) return;

    const pair1 = c1.getAttribute('data-pair-id');
    const pair2 = c2.getAttribute('data-pair-id');
    const type1 = c1.getAttribute('data-type');
    const type2 = c2.getAttribute('data-type');

    const isMatch = (pair1 === pair2) && (type1 !== type2);

    if (isMatch) {
      playSound('correct');
      state.score += 25;
      state.streak += 1;
      state.matchedPairsCount += 1;
      updateStatsBar();

      // Find item and update SRS as good
      const cardObj = state.matchCards.find(c => c.id === c1.getAttribute('data-card-id'));
      if (cardObj?.item?.id) {
        updateItemSrs(cardObj.item.id, 'good');
      }

      c1.classList.remove('selected');
      c2.classList.remove('selected');
      c1.classList.add('matched');
      c2.classList.add('matched');

      state.selectedCard1 = null;
      state.selectedCard2 = null;

      if (state.matchedPairsCount >= state.totalPairs) {
        stopMatchTimer();
        setTimeout(renderMatchWinScreen, 450);
      }
    } else {
      playSound('wrong');
      c1.classList.add('wrong');
      c2.classList.add('wrong');

      setTimeout(() => {
        c1.classList.remove('selected', 'wrong');
        c2.classList.remove('selected', 'wrong');
        state.selectedCard1 = null;
        state.selectedCard2 = null;
      }, 420);
    }
  }

  function renderMatchWinScreen() {
    playSound('correct');
    const body = document.getElementById('vph-body');
    if (!body) return;

    const totalSec = (state.matchElapsedMs / 1000).toFixed(1);

    body.innerHTML = `
      <div class="vph-done-card">
        <div class="vph-trophy-badge">⚡</div>
        <h3 class="vph-done-title">Phá kỷ lục Ghép thẻ!</h3>
        <p class="vph-done-desc">Bạn đã ghép chính xác tất cả ${state.totalPairs} cặp từ vựng trong thời gian kỷ lục:</p>

        <div style="font-size:38px; font-weight:800; color:#38bdf8; font-family:'JetBrains Mono', monospace; margin: 10px 0;">
          ${totalSec} giây
        </div>

        <div class="vph-actions-row">
          <button type="button" class="vph-primary-btn" id="vph-match-again-btn">
            <span>🔄 Chơi ván mới</span>
          </button>
          <button type="button" class="vph-secondary-btn" id="vph-match-fc-btn">
            <span>Chuyển sang Flashcard 3D</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('vph-match-again-btn')?.addEventListener('click', () => {
      startMatchGame(getScopedVocabList(state.scope, state.onlyDue));
    });

    document.getElementById('vph-match-fc-btn')?.addEventListener('click', () => {
      state.m3SubMode = 'flashcard';
      startFlashcards(getScopedVocabList(state.scope, state.onlyDue));
    });
  }

  // ==================== 3D FLASHCARD ENGINE (M3 + M4) ====================
  function startFlashcards(scopedItems) {
    stopMatchTimer();
    state.m3SubMode = 'flashcard';
    const sourceList = scopedItems.length > 0 ? scopedItems : CURATED_FALLBACK_VOCAB;
    state.questions = [...sourceList].sort((a, b) => (getSrs(a).due - getSrs(b).due) || (Math.random() - 0.5));
    state.currentIndex = 0;
    state.isCardFlipped = false;

    renderFlashcardScreen();
  }

  function renderFlashcardScreen() {
    const body = document.getElementById('vph-body');
    if (!body) return;

    if (state.currentIndex >= state.questions.length) {
      renderDoneScreen();
      return;
    }

    state.isCardFlipped = false;
    const item = state.questions[state.currentIndex];
    const total = state.questions.length;
    const qNum = `Thẻ ${state.currentIndex + 1} / ${total}`;

    // Compute intervals preview for the 4 SuperMemo SM-2 buttons
    const curSrs = getSrs(item);
    const prevAgain = srsFormatDelta(srsCompute(curSrs, 'again').due - Date.now());
    const prevHard = srsFormatDelta(srsCompute(curSrs, 'hard').due - Date.now());
    const prevGood = srsFormatDelta(srsCompute(curSrs, 'good').due - Date.now());
    const prevEasy = srsFormatDelta(srsCompute(curSrs, 'easy').due - Date.now());

    let ctxHtml = item.en || '';
    if (item.he > item.hs && item.he <= ctxHtml.length) {
      ctxHtml = escHtml(ctxHtml.slice(0, item.hs)) + `<b style="color:#fbbf24;text-decoration:underline">${escHtml(ctxHtml.slice(item.hs, item.he))}</b>` + escHtml(ctxHtml.slice(item.he));
    } else {
      ctxHtml = escHtml(ctxHtml);
    }

    body.innerHTML = `
      <div class="vph-subnav-bar">
        <button type="button" class="vph-subnav-btn" id="vph-sub-match">🧩 Ghép thẻ nhanh</button>
        <button type="button" class="vph-subnav-btn active" id="vph-sub-fc">🎴 Flashcard 3D (SRS)</button>
      </div>

      <div class="vph-flashcard-container">
        <div style="font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.04em">
          ${qNum} · Chạm vào thẻ hoặc ấn Space để lật
        </div>

        <div class="vph-fc-wrapper" id="vph-fc-wrapper">
          <div class="vph-fc-card" id="vph-fc-card">
            <!-- Mặt trước (Front) -->
            <div class="vph-fc-front">
              <span class="vph-fc-top-tag">Tiếng Pháp</span>
              
              <div class="vph-fc-word">${escHtml(item.text)}</div>

              ${extractGrammarTag(item.wordVi) ? `
                <div class="vph-fc-front-tag">
                  ${formatGrammarBadgeHtml(extractGrammarTag(item.wordVi), { mask: true })}
                </div>
              ` : ''}

              <div class="vph-fc-ctx">${ctxHtml}</div>

              <div class="vph-fc-hint-flip">
                <span>🔄 Nhấn vào thẻ để xem nghĩa tiếng Việt</span>
              </div>
            </div>

            <!-- Mặt sau (Back) -->
            <div class="vph-fc-back">
              <span class="vph-fc-top-tag" style="color:#d946ef;background:rgba(217,70,239,0.15)">Nghĩa & Bản dịch</span>
              
              <div class="vph-fc-meaning">${formatGrammarBadgeHtml(escHtml(item.wordVi || item.vi || item.text), { mask: false })}</div>

              ${item.vi ? `<div class="vph-fc-sentvi">“${escHtml(item.vi)}”</div>` : ''}

              <button type="button" class="vph-audio-play-btn" id="vph-fc-audio-btn" style="padding:6px 14px;font-size:12px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                <span>Nghe phát âm</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 4 SuperMemo SM-2 SRS Action Buttons -->
        <div class="vph-fc-srs-actions">
          <button type="button" class="vph-srs-btn again" id="vph-srs-again" title="Phím tắt: 1">
            <span class="vph-srs-label">Lặp lại</span>
            <span class="vph-srs-delta">${prevAgain}</span>
          </button>
          <button type="button" class="vph-srs-btn hard" id="vph-srs-hard" title="Phím tắt: 2">
            <span class="vph-srs-label">Khó</span>
            <span class="vph-srs-delta">${prevHard}</span>
          </button>
          <button type="button" class="vph-srs-btn good" id="vph-srs-good" title="Phím tắt: 3">
            <span class="vph-srs-label">Tốt</span>
            <span class="vph-srs-delta">${prevGood}</span>
          </button>
          <button type="button" class="vph-srs-btn easy" id="vph-srs-easy" title="Phím tắt: 4">
            <span class="vph-srs-label">Dễ</span>
            <span class="vph-srs-delta">${prevEasy}</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('vph-sub-match')?.addEventListener('click', () => {
      state.m3SubMode = 'match';
      startMatchGame(getScopedVocabList(state.scope, state.onlyDue));
    });

    document.getElementById('vph-sub-fc')?.addEventListener('click', () => {
      state.m3SubMode = 'flashcard';
      startFlashcards(getScopedVocabList(state.scope, state.onlyDue));
    });

    document.getElementById('vph-fc-wrapper')?.addEventListener('click', (e) => {
      if (e.target.closest('#vph-fc-audio-btn')) return;
      toggleFlashcardFlip();
    });

    document.getElementById('vph-fc-audio-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      speakFrench(item.text);
    });

    document.getElementById('vph-srs-again')?.addEventListener('click', () => rateFlashcard('again'));
    document.getElementById('vph-srs-hard')?.addEventListener('click', () => rateFlashcard('hard'));
    document.getElementById('vph-srs-good')?.addEventListener('click', () => rateFlashcard('good'));
    document.getElementById('vph-srs-easy')?.addEventListener('click', () => rateFlashcard('easy'));

    setTimeout(() => speakFrench(item.text), 180);
  }

  function toggleFlashcardFlip() {
    playSound('click');
    const cardEl = document.getElementById('vph-fc-card');
    if (!cardEl) return;
    state.isCardFlipped = !state.isCardFlipped;
    cardEl.classList.toggle('flipped', state.isCardFlipped);
  }

  function rateFlashcard(rating) {
    const item = state.questions[state.currentIndex];
    if (!item) return;

    if (rating === 'good' || rating === 'easy') {
      playSound('correct');
      state.score += rating === 'easy' ? 20 : 15;
      state.streak += 1;
    } else {
      playSound(rating === 'hard' ? 'click' : 'wrong');
      if (rating === 'again') {
        state.streak = 0;
        state.wrongList.push({ frenchWord: item.text, vietnameseMeaning: item.wordVi || item.vi || '' });
      }
    }
    updateStatsBar();

    // SM-2 SRS update
    updateItemSrs(item.id, rating);

    state.currentIndex++;
    renderFlashcardScreen();
  }

  // ==================== COMPLETION SUMMARY SCREEN ====================
  function renderDoneScreen() {
    stopTimer();
    stopMatchTimer();
    const body = document.getElementById('vph-body');
    if (!body) return;

    const total = state.questions.length;
    const correctCount = Math.max(0, total - state.wrongList.length);
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    playSound('correct');

    let wrongReviewHtml = '';
    if (state.wrongList.length > 0) {
      wrongReviewHtml = `
        <div style="width:100%; text-align:left; background:rgba(2,6,23,0.5); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:14px; margin-top:8px;">
          <div style="font-size:12px; font-weight:700; color:#f87171; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.04em">
            Từ cần lưu ý ôn lại (${state.wrongList.length}):
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; max-height:160px; overflow-y:auto;">
            ${state.wrongList.map(w => `
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; padding:6px 10px; background:rgba(255,255,255,0.03); border-radius:8px;">
                <b style="color:#6ee7b7">${escHtml(w.frenchWord)}</b>
                <span style="color:#cbd5e1">${formatGrammarBadgeHtml(escHtml(w.vietnameseMeaning), { mask: false })}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    let modeName = 'Trắc nghiệm phản xạ';
    if (state.currentMode === 'cloze') modeName = 'Luyện Nghe & Điền từ';
    else if (state.currentMode === 'match') modeName = state.m3SubMode === 'match' ? 'Ghép thẻ nhanh' : 'Flashcard 3D (SRS)';

    body.innerHTML = `
      <div class="vph-done-card">
        <div class="vph-trophy-badge">🏆</div>
        <h3 class="vph-done-title">Hoàn thành phiên luyện tập!</h3>
        <p class="vph-done-desc">Bạn vừa hoàn thành xuất sắc vòng ${modeName} (${total} mục).</p>

        <div class="vph-score-grid">
          <div class="vph-score-stat">
            <span class="vph-stat-val">${correctCount}/${total}</span>
            <span class="vph-stat-lbl">Chính xác (${accuracy}%)</span>
          </div>
          <div class="vph-score-stat">
            <span class="vph-stat-val" style="color:#fbbf24">${state.score}</span>
            <span class="vph-stat-lbl">Tổng điểm</span>
          </div>
          <div class="vph-score-stat">
            <span class="vph-stat-val" style="color:#a855f7">${state.maxStreak} 🔥</span>
            <span class="vph-stat-lbl">Chuỗi dài nhất</span>
          </div>
        </div>

        ${wrongReviewHtml}

        <div class="vph-actions-row">
          <button type="button" class="vph-primary-btn" id="vph-restart-btn">
            <span>🔄 Luyện tập lại vòng mới</span>
          </button>
          <button type="button" class="vph-secondary-btn" id="vph-done-close-btn">
            <span>Đóng</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('vph-restart-btn')?.addEventListener('click', startSession);
    document.getElementById('vph-done-close-btn')?.addEventListener('click', closeVocabPracticeHub);
  }

  // Public API
  function openVocabPracticeHub(scope) {
    const backdrop = ensureModalElement();
    state.isOpen = true;
    state.scope = scope || 'all';
    updateScopeOptions();
    backdrop.classList.add('open');
    startSession();
  }

  function closeVocabPracticeHub() {
    stopTimer();
    stopMatchTimer();
    state.isOpen = false;
    const backdrop = document.getElementById('vph-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  // Expose to window
  window.VocabPracticeHub = {
    open: openVocabPracticeHub,
    close: closeVocabPracticeHub,
    switchMode: switchMode,
    maskGrammarTag: maskGrammarTag,
    formatGrammarBadgeHtml: formatGrammarBadgeHtml,
    extractGrammarTag: extractGrammarTag
  };

  // Helper alias
  window.openVocabPracticeHub = openVocabPracticeHub;

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureModalElement);
  } else {
    ensureModalElement();
  }
})();
