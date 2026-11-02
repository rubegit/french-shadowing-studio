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

  // ==================== CẤU HÌNH THUẬT TOÁN SM-2 BÀI DỊCH (skills.translate) ====================
  const TRANSLATE_SM2_CONFIG = {
    // Ngưỡng mở bài & công tắc
    MIN_RECOGNITION_REPS: 2,          // Ngưỡng reps nhận diện tối thiểu khi tắt công tắc
    DEFAULT_INCLUDE_LOW_REPS: true,   // Bật mặc định khi app chưa release

    // Hệ số điều chỉnh độ dễ (Ease Factor)
    DEFAULT_EASE: 2.5,
    MIN_EASE: 1.3,
    MAX_EASE: 2.8,
    PERFECT_EASE_BONUS: 0.15,         // Tăng ease khi đúng hoàn toàn không gợi ý (+0.15)
    NEAR_FAIL_EASE_PENALTY: 0.10,     // Giảm ease khi đúng nhưng dùng gợi ý mức 3-4 (-0.10)
    FAIL_EASE_PENALTY: 0.25,          // Giảm ease khi sai hoặc xem đáp án (-0.25)

    // Khoảng cách ôn (Interval - ngày) khi đúng hoàn hảo (Mức 0)
    PERFECT_INITIAL_INTERVAL_REP0: 2, // Lần 1 đúng: 2 ngày
    PERFECT_INITIAL_INTERVAL_REP1: 4, // Lần 2 đúng: 4 ngày
    PERFECT_BONUS_MULTIPLIER: 1.2,     // Hệ số thưởng các lần tiếp theo (interval * ease * 1.2)

    // Khoảng cách ôn khi dùng gợi ý mức 1-2 (Hard)
    HARD_INITIAL_INTERVAL: 1,          // Lần 1 đúng với gợi ý mức 1-2: 1 ngày
    HARD_MULTIPLIER: 1.2,              // Hệ số nhân cho các lần sau (interval * 1.2)

    // Hẹn giờ ôn lại khi trượt
    FAIL_DUE_MS: 10 * 60 * 1000        // 10 phút
  };

  const TRANSLATE_SM2_CONSTANTS = TRANSLATE_SM2_CONFIG;
  const TRANSLATE_MIN_RECOGNITION_REPS = TRANSLATE_SM2_CONFIG.MIN_RECOGNITION_REPS;
  const TRANSLATE_DEFAULT_INCLUDE_LOW_REPS = TRANSLATE_SM2_CONFIG.DEFAULT_INCLUDE_LOW_REPS;

  // ==================== CẤU HÌNH THUẬT TOÁN SM-2 BÀI SẮP XẾP CÂU (skills.reorder) ====================
  const REORDER_SM2_CONFIG = {
    // Ngưỡng mở bài & công tắc
    MIN_RECOGNITION_REPS: 2,          // Ngưỡng reps nhận diện tối thiểu khi tắt công tắc
    DEFAULT_INCLUDE_LOW_REPS: true,   // Bật mặc định khi app chưa release

    // Giới hạn độ dài câu
    MIN_TOKENS: 3,
    MAX_TOKENS: 15,

    // Hệ số điều chỉnh độ dễ (Ease Factor)
    DEFAULT_EASE: 2.5,
    MIN_EASE: 1.3,
    MAX_EASE: 2.8,
    PERFECT_EASE_BONUS: 0.10,         // Tăng ease khi đúng hoàn toàn không gợi ý (+0.10) - nhỏ hơn bài dịch 0.15 vì có gợi ý trực quan từ các chip
    NEAR_FAIL_EASE_PENALTY: 0.10,     // Giảm ease khi dùng gợi ý mức 2 (ghim 50% từ) (-0.10)
    FAIL_EASE_PENALTY: 0.25,          // Giảm ease khi dùng gợi ý mức 3 (xem đáp án) hoặc sai (-0.25)

    // Khoảng cách ôn (Interval - ngày) khi đúng hoàn hảo (Mức 0)
    PERFECT_INITIAL_INTERVAL_REP0: 2, // Lần 1 đúng: 2 ngày
    PERFECT_INITIAL_INTERVAL_REP1: 4, // Lần 2 đúng: 4 ngày
    PERFECT_BONUS_MULTIPLIER: 1.2,     // Hệ số thưởng các lần tiếp theo (interval * ease * 1.2)

    // Khoảng cách ôn khi đúng có gợi ý mức 1 (đánh số mờ)
    HINT1_MULTIPLIER: 1.2,

    // Hẹn giờ ôn lại khi sai / xem đáp án
    FAIL_DUE_MS: 10 * 60 * 1000       // 10 phút
  };

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

  // ==================== SKILLS: TRANSLATE (SM-2 CHUYÊN BIỆT CHO DỊCH VIỆT -> PHÁP) ====================
  function translateSkillDefault() {
    return { ease: TRANSLATE_SM2_CONFIG.DEFAULT_EASE, interval: 0, reps: 0, due: 0, lastReview: null };
  }

  function getTranslateSkill(item) {
    return Object.assign(translateSkillDefault(), item && item.skills && item.skills.translate ? item.skills.translate : {});
  }

  function translateSkillCompute(s, isCorrect, hintLevel = 0) {
    let { ease, interval, reps } = s;
    const now = Date.now();
    const cfg = TRANSLATE_SM2_CONFIG;

    // 1. Trả lời sai hoặc xem full đáp án (hintLevel >= 5): Đánh giá Fail
    if (!isCorrect || hintLevel >= 5) {
      reps = 0;
      ease = Math.max(cfg.MIN_EASE, ease - cfg.FAIL_EASE_PENALTY);
      interval = 0;
      return { ease, interval, reps, due: now + cfg.FAIL_DUE_MS, lastReview: now };
    }

    // 2. Đúng nhưng có dùng gợi ý mức 3 hoặc 4 (Mở từ theo thứ tự / Nghe mẫu): Đánh giá gần trượt
    if (hintLevel >= 3) {
      ease = Math.max(cfg.MIN_EASE, ease - cfg.NEAR_FAIL_EASE_PENALTY);
      const currentInterval = Math.max(1, interval);
      return {
        ease,
        interval: currentInterval,
        reps,
        due: now + currentInterval * 24 * 60 * 60 * 1000,
        lastReview: now
      };
    }

    // 3. Đúng với gợi ý mức 1 hoặc 2 (Gạch chữ / Chữ cái đầu): Đánh giá Hard
    if (hintLevel >= 1) {
      if (reps === 0) interval = cfg.HARD_INITIAL_INTERVAL;
      else interval = Math.max(1, Math.round(interval * cfg.HARD_MULTIPLIER));
      reps += 1;
      return {
        ease,
        interval,
        reps,
        due: now + interval * 24 * 60 * 60 * 1000,
        lastReview: now
      };
    }

    // 4. Đúng hoàn toàn không dùng gợi ý (hintLevel === 0): Thăng cấp bình thường (Good / Easy)
    if (reps === 0) interval = cfg.PERFECT_INITIAL_INTERVAL_REP0;
    else if (reps === 1) interval = cfg.PERFECT_INITIAL_INTERVAL_REP1;
    else interval = Math.max(1, Math.round(interval * ease * cfg.PERFECT_BONUS_MULTIPLIER));

    ease = Math.min(cfg.MAX_EASE, ease + cfg.PERFECT_EASE_BONUS);
    reps += 1;
    return { ease, interval, reps, due: now + interval * 24 * 60 * 60 * 1000, lastReview: now };
  }

  function updateItemTranslateSkill(itemId, isCorrect, hintLevel = 0) {
    if (!itemId) return null;
    const all = getRawVocabList();
    const item = all.find(v => v.id === itemId);
    if (!item) return null;

    item.skills = item.skills || {};
    const current = getTranslateSkill(item);
    const updated = translateSkillCompute(current, isCorrect, hintLevel);
    item.skills.translate = updated;

    // TUYỆT ĐỐI KHÔNG chạm vào item.srs!
    persistVocabList(all);
    return updated;
  }

  function reorderSkillDefault() {
    return { ease: 2.5, interval: 0, reps: 0, due: 0, lastReview: null };
  }

  function getReorderSkill(item) {
    if (!item) return reorderSkillDefault();
    const skills = item.skills || {};
    return Object.assign(reorderSkillDefault(), skills.reorder || {});
  }

  function reorderSkillCompute(s, isCorrect, hintLevel = 0) {
    let { ease, interval, reps } = s;
    const now = Date.now();
    const cfg = REORDER_SM2_CONFIG;

    // 1. Trả lời sai HOẶC xem câu mẫu (hintLevel >= 3): Tính là Fail
    if (!isCorrect || hintLevel >= 3) {
      reps = 0;
      ease = Math.max(cfg.MIN_EASE, ease - cfg.FAIL_EASE_PENALTY);
      interval = 0;
      return { ease, interval, reps, due: now + cfg.FAIL_DUE_MS, lastReview: now };
    }

    // 2. Đúng nhưng dùng gợi ý mức 2 (Ghim 50% từ đầu): Gần trượt (khớp bài dịch: giữ nguyên reps và interval, ease -0.10)
    if (hintLevel === 2) {
      ease = Math.max(cfg.MIN_EASE, ease - cfg.NEAR_FAIL_EASE_PENALTY);
      const currentInterval = Math.max(1, interval);
      return {
        ease,
        interval: currentInterval,
        reps,
        due: now + currentInterval * 24 * 60 * 60 * 1000,
        lastReview: now
      };
    }

    // 3. Đúng có dùng gợi ý mức 1 (Đánh số mờ 1-2 từ đầu): Giữ ease (+0.00), interval tăng nhẹ
    if (hintLevel === 1) {
      reps = reps + 1;
      let nextInterval = 1;
      if (reps === 1) nextInterval = cfg.PERFECT_INITIAL_INTERVAL_REP0;
      else if (reps === 2) nextInterval = cfg.PERFECT_INITIAL_INTERVAL_REP1;
      else nextInterval = Math.max(1, Math.round(interval * cfg.HINT1_MULTIPLIER));
      return {
        ease,
        interval: nextInterval,
        reps,
        due: now + nextInterval * 24 * 60 * 60 * 1000,
        lastReview: now
      };
    }

    // 4. Đúng hoàn toàn không gợi ý (hintLevel === 0): Thưởng ease +0.10, reps + 1
    if (reps === 0) interval = cfg.PERFECT_INITIAL_INTERVAL_REP0;
    else if (reps === 1) interval = cfg.PERFECT_INITIAL_INTERVAL_REP1;
    else interval = Math.max(1, Math.round(interval * ease * cfg.PERFECT_BONUS_MULTIPLIER));

    ease = Math.min(cfg.MAX_EASE, ease + cfg.PERFECT_EASE_BONUS);
    reps += 1;
    return { ease, interval, reps, due: now + interval * 24 * 60 * 60 * 1000, lastReview: now };
  }

  function updateItemReorderSkill(itemId, isCorrect, hintLevel = 0) {
    if (!itemId) return null;
    const all = getRawVocabList();
    const item = all.find(v => v.id === itemId);
    if (!item) return null;

    item.skills = item.skills || {};
    const current = getReorderSkill(item);
    const updated = reorderSkillCompute(current, isCorrect, hintLevel);
    item.skills.reorder = updated;

    // TUYỆT ĐỐI KHÔNG chạm vào item.srs!
    persistVocabList(all);
    return updated;
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
    currentMode: 'quiz', // 'quiz' | 'cloze' | 'match' | 'flashcard' | 'translate' | 'reorder'
    m3SubMode: 'match',  // 'match' | 'flashcard' (giữ tương thích)
    scope: 'all',
    level: 'all',        // CEFR level filter: 'all' | 'A1' | 'A2' | 'A2+' | 'B1' | 'B2' | 'C1' | 'C2'
    onlyDue: false,      // SRS filter: only due items
    translateIgnoreAccents: false, // Tùy chọn bỏ qua dấu phụ cho bài Dịch Việt -> Pháp
    translateIncludeLowReps: TRANSLATE_DEFAULT_INCLUDE_LOW_REPS, // Công tắc: gồm cả thẻ reps < 2
    translateSkippedInfo: { lowReps: 0, noExamples: 0 },
    reorderIncludeLowReps: REORDER_SM2_CONFIG.DEFAULT_INCLUDE_LOW_REPS, // Công tắc: gồm cả thẻ reps < 2
    reorderSkippedInfo: { lowReps: 0, noExamples: 0 },
    reorderBankTokens: [],
    reorderSelectedTokens: [],
    reorderCurrentTokens: [],
    reorderPunct: '',
    reorderHintLevel: 0,
    reorderCanAdvance: false,
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
    isCardFlipped: false,

    // Translate Mode state
    translateHintLevel: 0,        // 0: chưa gợi ý, 1: gạch, 2: chữ cái đầu, 3: mở từ theo thứ tự, 4: TTS, >=5: xem đáp án
    translateRevealedWords: 0,    // Số từ đã mở trọn vẹn ở mức 3
    translateCanAdvance: false,   // Khóa Enter ngăn tự động bỏ qua khi vừa submit
    translateAdvancing: false
  };

  // Font Scaling controls (Nhỏ, Vừa, Lớn, Rất lớn)
  const FONT_SCALE_LEVELS = [0.92, 1.08, 1.24, 1.42];
  const FONT_SCALE_LABELS = ['Nhỏ', 'Vừa', 'Lớn', 'Rất lớn'];
  const FONT_SCALE_STORAGE_KEY = 'fss_practice_font_scale';

  function getFontScaleIndex() {
    try {
      const saved = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx >= 0 && idx < FONT_SCALE_LEVELS.length) return idx;
      }
    } catch (_) {}
    return 1; // Mặc định: 'Vừa' (1.08)
  }

  function setFontScaleIndex(idx) {
    const clamped = Math.max(0, Math.min(FONT_SCALE_LEVELS.length - 1, idx));
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(clamped));
    } catch (_) {}
    applyFontScale(clamped);
    return clamped;
  }

  function applyFontScale(idx) {
    const scale = FONT_SCALE_LEVELS[idx] || 1.08;
    const modal = (typeof document.querySelector === 'function' ? document.querySelector('.vph-modal') : null)
      || (typeof document.getElementById === 'function' ? document.getElementById('vph-modal') : null);
    if (modal && modal.style) {
      if (typeof modal.style.setProperty === 'function') {
        modal.style.setProperty('--vph-font-scale', String(scale));
      } else {
        modal.style['--vph-font-scale'] = String(scale);
      }
    }
    const labelEl = typeof document.getElementById === 'function' ? document.getElementById('vph-font-scale-label') : null;
    if (labelEl) {
      labelEl.textContent = FONT_SCALE_LABELS[idx] || 'Vừa';
    }
  }

  // Multi-level Sentence Hint Formatter
  function tokenizeFrenchSentence(sentence) {
    const tokens = [];
    const regex = /([a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]+)|([^a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ]+)/g;
    let match;
    let wordIndex = 0;
    while ((match = regex.exec(sentence)) !== null) {
      if (match[1]) {
        tokens.push({ text: match[1], isWord: true, wordIndex: wordIndex++ });
      } else if (match[2]) {
        tokens.push({ text: match[2], isWord: false });
      }
    }
    return { tokens, totalWords: wordIndex };
  }

  function countSentenceWords(sentence) {
    return tokenizeFrenchSentence(sentence || '').totalWords;
  }

  // Tokenizer cho Bài luyện Sắp xếp câu (M46)
  const FRENCH_PROPER_NOUNS = new Set([
    'France', 'Paris', 'Marie', 'Pierre', 'Jean', 'Paul', 'Marc', 'Luc',
    'Vietnam', 'Hanoï', 'Saigon', 'Lyon', 'Marseille', 'Bordeaux', 'Nice', 'Toulouse'
  ]);

  function tokenizeFrenchForReorder(sentence) {
    if (!sentence || typeof sentence !== 'string') {
      return { tokens: [], punct: '', valid: false, reason: 'empty', count: 0 };
    }

    // 1. Chuẩn hóa nháy cong ’ -> ' và khoảng trắng trước ? ! : ;
    let text = sentence.replace(/[\u2018\u2019]/g, "'");
    text = text.replace(/[\u00A0\s]+([?!:;])/g, ' $1').trim();

    // 2. Tách dấu câu kết thúc (. ? ! ...)
    let punct = '';
    const punctMatch = text.match(/([.?!…]+)$/);
    if (punctMatch) {
      punct = punctMatch[1];
      text = text.slice(0, -punct.length).trim();
    }

    // 3. Tách từ theo khoảng trắng
    const rawWords = text.split(/\s+/).filter(Boolean);

    if (rawWords.length < REORDER_SM2_CONFIG.MIN_TOKENS) {
      return { tokens: [], punct: punct, valid: false, reason: 'too_short', count: rawWords.length };
    }
    if (rawWords.length > REORDER_SM2_CONFIG.MAX_TOKENS) {
      return { tokens: [], punct: punct, valid: false, reason: 'too_long', count: rawWords.length };
    }

    const tokens = rawWords.map((word, idx) => {
      let displayText = word;
      if (idx === 0) {
        // Nếu không phải tên riêng thì viết thường chữ cái đầu tiên để không lộ từ đầu
        const cleanWord = word.replace(/[,\u2019'].*$/, '');
        if (!FRENCH_PROPER_NOUNS.has(cleanWord) && !FRENCH_PROPER_NOUNS.has(word)) {
          displayText = word.charAt(0).toLowerCase() + word.slice(1);
        }
      }
      return {
        id: 'tok_' + idx,
        origIndex: idx,
        text: word,
        displayText: displayText
      };
    });

    return { tokens: tokens, punct: punct, valid: true, count: tokens.length };
  }

  function formatWordBlanks(word, showFirstLetter) {
    if (!word) return '';
    if (word.length === 1) {
      return showFirstLetter ? word : '_';
    }
    if (showFirstLetter) {
      const rest = Array(word.length - 1).fill('_').join(' ');
      return `${word[0]} ${rest}`;
    }
    return Array(word.length).fill('_').join(' ');
  }

  function generateSentenceHint(sentence, level, revealedWordsCount = 0) {
    if (!sentence || level <= 0) return '';
    const { tokens } = tokenizeFrenchSentence(sentence);

    function isWordFullyRevealed(idx) {
      if (idx < 0 || idx >= tokens.length) return false;
      const t = tokens[idx];
      if (!t || !t.isWord) return false;
      if (level >= 4) return true;
      if (level === 3 && typeof t.wordIndex === 'number' && t.wordIndex < revealedWordsCount) return true;
      return false;
    }

    return tokens.map((tok, idx) => {
      if (!tok.isWord) {
        if (level < 4) {
          // Tìm từ đứng trước và từ đứng sau khoảng trắng này
          let prevWordIdx = idx - 1;
          while (prevWordIdx >= 0 && !tokens[prevWordIdx].isWord) prevWordIdx--;
          let nextWordIdx = idx + 1;
          while (nextWordIdx < tokens.length && !tokens[nextWordIdx].isWord) nextWordIdx++;

          const bothRevealed = isWordFullyRevealed(prevWordIdx) && isWordFullyRevealed(nextWordIdx);
          if (bothRevealed) {
            return tok.text;
          }
          // Khi có từ đang hiển thị dạng gạch rời (_ _), khoảng trắng giữa các từ nhân đôi
          // để phân biệt rõ ranh giới giữa các từ theo đúng quy cách: "_ _ _  _ _ _ _ _"
          return tok.text.replace(/ /g, '  ');
        }
        return tok.text;
      }
      if (level >= 4) return tok.text;
      if (level === 3 && tok.wordIndex < revealedWordsCount) return tok.text;
      const showFirst = (level >= 2);
      return formatWordBlanks(tok.text, showFirst);
    }).join('');
  }

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

  // Universal French Pronunciation Engine
  function speakFrench(text, rate = 0.92) {
    if (!text) return;
    if (typeof window.playFrenchAudio === 'function') {
      window.playFrenchAudio(text, { rate });
      return;
    }
    try {
      const cleanText = String(text).trim();
      if (!cleanText) return;
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
      const audio = new Audio(ttsUrl);
      audio.playbackRate = rate;
      audio.play().catch(() => {});
    } catch (e) {}
  }

  // Play native audio segment directly from the YouTube video (hidden player, no video frame shown)
  function playQuestionVideoAudio(q) {
    if (!q) return;
    const vid = q.videoId || q.item?.videoId;
    const frenchWord = q.frenchWord || (q.item && q.item.text) || q.text || '';
    if (!vid) {
      speakFrench(frenchWord);
      return;
    }
    const btns = document.querySelectorAll('.vph-video-audio-btn');
    const isCurrentlyPlaying = Array.from(btns).some(b => b.classList.contains('playing'));
    if (isCurrentlyPlaying) {
      if (typeof window.stopVideoAudioSegment === 'function') window.stopVideoAudioSegment();
      btns.forEach(b => b.classList.remove('playing'));
      return;
    }

    btns.forEach(b => b.classList.add('playing'));
    // Rule 1 & 2: Chưa căn mốc thời gian -> chuyển thẳng sang đọc TTS câu/từ
    if (q.t_known === false || (q.item && q.item.t_known === false)) {
      btns.forEach(b => b.classList.remove('playing'));
      speakFrench(frenchWord);
      return;
    }
    if (typeof window.playVideoAudioSegment === 'function') {
      const dur = q.duration || (q.sentence || q.ctx ? Math.max(2.5, Math.min(8.0, (q.sentence || q.ctx).split(/\s+/).length * 0.45 + 1.0)) : 4);
      window.playVideoAudioSegment(vid, q.t || 0, dur, {
        onStart: () => { btns.forEach(b => b.classList.add('playing')); },
        onEnd: () => { btns.forEach(b => b.classList.remove('playing')); },
        onError: () => {
          btns.forEach(b => b.classList.remove('playing'));
          speakFrench(frenchWord);
        }
      });
    } else {
      speakFrench(frenchWord);
    }
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

  function deduplicateVocabItems(items) {
    if (!Array.isArray(items)) return [];
    const map = new Map();
    items.forEach(it => {
      if (!it || !it.text) return;
      const key = String(it.text).trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, Object.assign({}, it));
      } else {
        const target = map.get(key);
        if (!target.wordVi && it.wordVi) target.wordVi = it.wordVi;
        if ((!target.examples || !target.examples.length) && it.examples?.length) target.examples = it.examples;
        if (it.contexts?.length) {
          if (!Array.isArray(target.contexts)) target.contexts = [];
          it.contexts.forEach(c => {
            if (!target.contexts.some(tc => tc.videoId === c.videoId && Math.abs((tc.t || 0) - (c.t || 0)) < 2)) {
              target.contexts.push(c);
            }
          });
        }
      }
    });
    return Array.from(map.values());
  }

  function getScopedVocabList(scope, onlyDue = false, level = state.level || 'all') {
    const all = getRawVocabList();
    let list = all;
    if (scope && scope !== 'all') {
      if (typeof window.vocabInScope === 'function') {
        list = window.vocabInScope(scope);
      } else if (typeof window.vocabSourceInfo === 'function') {
        list = all.filter(x => {
          if (window.vocabSourceInfo(x).key === scope) return true;
          if (Array.isArray(x.contexts) && x.contexts.some(c => window.vocabSourceInfo(c).key === scope)) return true;
          return false;
        });
      } else {
        list = all.filter(x => (x.videoId === scope || (x.bookId && x.bookId === scope)));
      }
    }
    if (level && level !== 'all') {
      const targetLvl = String(level).trim().toUpperCase();
      list = list.filter(item => {
        const itemLvl = String(item.level || '').trim().toUpperCase();
        return itemLvl === targetLvl;
      });
    }
    if (onlyDue) {
      list = list.filter(item => srsIsDue(item));
    }
    return deduplicateVocabItems(list);
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

  // Helper: Che từ cần học trong câu ví dụ một cách an toàn, tuyệt đối không làm lộ câu gốc
  function maskWordInSentence(sentence, targetWord, hs = 0, he = 0) {
    const s = String(sentence || '').trim();
    if (!s) return { masked: `<span class="vph-cloze-blank-pill" id="vph-blank-pill">_______</span>`, targetWordInCtx: targetWord };

    if (he > hs && he <= s.length) {
      const wordInCtx = s.slice(hs, he);
      return {
        masked: escHtml(s.slice(0, hs)) + `<span class="vph-cloze-blank-pill" id="vph-blank-pill">_______</span>` + escHtml(s.slice(he)),
        targetWordInCtx: wordInCtx
      };
    }

    // Khớp nguyên từ không phân biệt hoa thường
    const escWord = targetWord.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let re = new RegExp(`(^|[^\\p{L}])(${escWord})([^\\p{L}]|$)`, 'iu');
    let m = re.exec(s);
    if (m) {
      const start = m.index + m[1].length;
      const end = start + m[2].length;
      return {
        masked: escHtml(s.slice(0, start)) + `<span class="vph-cloze-blank-pill" id="vph-blank-pill">_______</span>` + escHtml(s.slice(end)),
        targetWordInCtx: m[2]
      };
    }

    // Khớp theo gốc từ (bỏ đuôi chia động từ / số nhiều: er, ir, re, ez, ent, ons, ant, é, és, ée, ées, e, s)
    const base = targetWord.trim().split(/\s+/)[0].replace(/(er|ir|re|ez|ent|ons|ant|é|és|ée|ées|e|s)$/i, '');
    if (base.length >= 3) {
      const escBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      re = new RegExp(`(^|[^\\p{L}])(${escBase}[\\p{L}']*)([^\\p{L}]|$)`, 'iu');
      m = re.exec(s);
      if (m) {
        const start = m.index + m[1].length;
        const end = start + m[2].length;
        return {
          masked: escHtml(s.slice(0, start)) + `<span class="vph-cloze-blank-pill" id="vph-blank-pill">_______</span>` + escHtml(s.slice(end)),
          targetWordInCtx: m[2]
        };
      }
    }

    // Tuyệt đối không in lộ câu gốc nếu không xác định được vị trí
    return {
      masked: `<span class="vph-cloze-blank-pill" id="vph-blank-pill">_______</span>`,
      targetWordInCtx: targetWord
    };
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
      const ctxResult = maskWordInSentence(item.en || '', item.text, item.hs || 0, item.he || 0);

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
        maskedCtx: ctxResult.masked,
        targetWordInCtx: ctxResult.targetWordInCtx,
        frenchWord: item.text,
        vietnameseMeaning: item.wordVi || item.vi || '',
        videoId: item.videoId || '',
        t: item.t || 0,
        t_known: (typeof item.t_known === 'boolean') ? item.t_known : true,
        duration: item.duration || (item.en ? Math.max(2.5, Math.min(8.0, item.en.split(/\s+/).length * 0.45 + 1.0)) : 4)
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
      let en = (item.en || '').trim();
      let hs = item.hs || 0;
      let he = item.he || 0;
      let videoId = item.videoId || '';
      let t = item.t || 0;
      let t_known = (typeof item.t_known === 'boolean') ? item.t_known : true;
      if (Array.isArray(item.contexts) && item.contexts.length > 0 && Math.random() < 0.5) {
        const randCtx = item.contexts[Math.floor(Math.random() * item.contexts.length)];
        if (randCtx && randCtx.en) {
          en = String(randCtx.en).trim();
          hs = randCtx.hs || 0;
          he = randCtx.he || 0;
          videoId = randCtx.videoId || videoId;
          t = randCtx.t || t;
          t_known = (typeof randCtx.t_known === 'boolean') ? randCtx.t_known : true;
        }
      }
      const sentence = en;
      const meaning = item.wordVi || item.vi || 'Từ cần điền';

      const maskedRes = maskWordInSentence(sentence, frenchWord, hs, he);
      const maskedSentence = maskedRes.masked;

      return {
        id: item.id || `cloze_${qIndex}`,
        item,
        frenchWord,
        sentence,
        maskedSentence,
        targetWordInCtx: maskedRes.targetWordInCtx,
        meaning,
        videoId,
        t,
        t_known,
        duration: item.duration || (sentence ? Math.max(2.5, Math.min(8.0, sentence.split(/\s+/).length * 0.45 + 1.0)) : 4)
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

  // ==================== FRENCH UTILS HELPER ====================
  function getFrenchUtils() {
    if (typeof window !== 'undefined' && window.frenchUtils) return window.frenchUtils;
    if (typeof globalThis !== 'undefined' && globalThis.frenchUtils) return globalThis.frenchUtils;
    return null;
  }

  function normalizeTranslateAnswer(userAnswer, expectedAnswer, options) {
    const fu = getFrenchUtils();
    if (fu && typeof fu.normalizeAnswer === 'function') {
      return fu.normalizeAnswer(userAnswer, expectedAnswer, options);
    }
    const clean = s => (s || '').normalize('NFC').trim().toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[.,;:!?]+$/, '');
    return { isCorrect: clean(userAnswer) === clean(expectedAnswer) };
  }

  // ==================== WORD-LEVEL DIFF ALGORITHM (M44) ====================
  function computeWordDiff(userStr, expectedStr) {
    const uWords = (userStr || '').trim().split(/\s+/).filter(Boolean);
    const eWords = (expectedStr || '').trim().split(/\s+/).filter(Boolean);
    const n = uWords.length;
    const m = eWords.length;

    const cleanWord = w => (w || '').toLowerCase().replace(/[\u2018\u2019\u201B\u0060\u00B4]/g, "'").replace(/[.,;:!?¿¡]+$/, '');

    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (cleanWord(uWords[i - 1]) === cleanWord(eWords[j - 1])) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result = [];
    let ci = n, cj = m;
    while (ci > 0 || cj > 0) {
      if (ci > 0 && cj > 0 && cleanWord(uWords[ci - 1]) === cleanWord(eWords[cj - 1])) {
        result.unshift({ status: 'match', value: uWords[ci - 1] });
        ci--;
        cj--;
      } else if (cj > 0 && (ci === 0 || dp[ci][cj - 1] >= dp[ci - 1][cj])) {
        result.unshift({ status: 'missing', value: eWords[cj - 1] });
        cj--;
      } else if (ci > 0 && (cj === 0 || dp[ci][cj - 1] < dp[ci - 1][cj])) {
        result.unshift({ status: 'extra', value: uWords[ci - 1] });
        ci--;
      }
    }
    return result;
  }

  function renderWordDiffHtml(userStr, expectedStr) {
    const tokens = computeWordDiff(userStr, expectedStr);
    return tokens.map(t => {
      const val = escHtml(t.value);
      if (t.status === 'match') {
        return `<span class="vph-diff-match">${val}</span>`;
      } else if (t.status === 'missing') {
        return `<span class="vph-diff-missing" title="Từ còn thiếu trong đáp án chuẩn">${val}</span>`;
      } else {
        return `<span class="vph-diff-extra" title="Từ chưa chính xác">${val}</span>`;
      }
    }).join(' ');
  }

  // ==================== TRANSLATE SESSION GENERATOR (M44) ====================
  function buildTranslateSession(scopedItems, options) {
    const includeLowReps = (options && typeof options.includeLowReps === 'boolean')
      ? options.includeLowReps
      : (typeof state !== 'undefined' && typeof state.translateIncludeLowReps === 'boolean'
          ? state.translateIncludeLowReps
          : TRANSLATE_DEFAULT_INCLUDE_LOW_REPS);

    const sourceList = scopedItems.length > 0 ? scopedItems : CURATED_FALLBACK_VOCAB;
    let skippedLowReps = 0;
    let skippedNoExamples = 0;

    const eligible = [];
    sourceList.forEach(item => {
      if (!item) return;
      const reps = (item.srs && typeof item.srs.reps === 'number') ? item.srs.reps : 0;
      if (!includeLowReps && reps < TRANSLATE_MIN_RECOGNITION_REPS) {
        skippedLowReps++;
        return;
      }

      // Lọc các ví dụ có cả fr và vi không rỗng (VD1 đến VD3)
      const validExamples = (Array.isArray(item.examples) ? item.examples : []).filter(ex => {
        return ex && ex.fr && String(ex.fr).trim() && ex.vi && String(ex.vi).trim();
      });

      if (validExamples.length === 0) {
        skippedNoExamples++;
        return;
      }

      eligible.push({
        item: item,
        examples: validExamples
      });
    });

    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const sessionSize = Math.min(10, Math.max(5, shuffled.length));
    const targetSubset = shuffled.slice(0, sessionSize);

    const questions = targetSubset.map((entry, qIndex) => {
      const { item, examples } = entry;
      // Chọn ngẫu nhiên 1 trong các câu ví dụ (VD1 đến VD3)
      const chosen = examples[Math.floor(Math.random() * examples.length)];
      return {
        id: item.id || `translate_${qIndex}`,
        item: item,
        promptVi: chosen.vi.trim(),
        expectedFr: chosen.fr.trim(),
        wordVi: item.wordVi || item.vi || '',
        frenchWord: item.text || item.fr || '',
        extra_accepted: Array.isArray(item.extra_accepted) ? item.extra_accepted : []
      };
    });

    return {
      questions: questions,
      eligibleCount: eligible.length,
      skippedLowReps: skippedLowReps,
      skippedNoExamples: skippedNoExamples
    };
  }

  // Practice Modes Metadata (Single Source of Truth for Modes and Menu)
  const MODE_METADATA = {
    quiz: { icon: '🎯', title: 'Trắc nghiệm 4 đáp án', desc: 'Luyện nhận diện nghĩa từ vựng nhanh' },
    cloze: { icon: '🎧', title: 'Nghe & Điền từ', desc: 'Rèn luyện nghe phát âm và chính tả' },
    match: { icon: '🃏', title: 'Ghép thẻ nhanh', desc: 'Thử thách tốc độ ghép cặp từ và nghĩa' },
    flashcard: { icon: '🎴', title: 'Flashcard 3D (SRS)', desc: 'Ôn tập chủ động ghi nhớ dài hạn' },
    translate: { icon: '✍️', title: 'Dịch Việt → Pháp', desc: 'Luyện dịch câu song ngữ phản xạ xuôi' },
    reorder: { icon: '🧩', title: 'Sắp xếp câu', desc: 'Chạm các thẻ từ để ghép thành câu tiếng Pháp hoàn chỉnh' }
  };

  function buildSandwichMenuItemsHtml(activeMode = 'quiz') {
    return Object.entries(MODE_METADATA).map(([modeKey, meta]) => {
      const isActive = modeKey === activeMode ? ' active' : '';
      return `
                <button type="button" class="vph-sandwich-item vph-tab-btn${isActive}" data-mode="${modeKey}" role="menuitem">
                  <span class="vph-sandwich-item-icon">${meta.icon}</span>
                  <div class="vph-sandwich-item-text">
                    <div class="vph-sandwich-item-title">${escHtml(meta.title)}</div>
                    <div class="vph-sandwich-item-desc">${escHtml(meta.desc)}</div>
                  </div>
                  <span class="vph-sandwich-item-check">✓</span>
                </button>`;
    }).join('\n');
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
            <span class="vph-brand-title-full">Trung tâm Luyện tập Từ vựng</span>
            <span class="vph-brand-title-short">Luyện từ vựng</span>
          </div>
          <button type="button" class="vph-close-btn" id="vph-close-btn" title="Đóng (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <!-- Mode Navigation Bar with Sandwich Menu (M45) -->
        <div class="vph-tabs-bar">
          <div class="vph-sandwich-menu-wrapper" id="vph-sandwich-menu-wrapper">
            <button type="button" class="vph-sandwich-btn" id="vph-sandwich-btn" aria-haspopup="true" aria-expanded="false" title="Bấm để chọn bài luyện tập">
              <div class="vph-sandwich-icon-box">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </div>
              <div class="vph-sandwich-current">
                <span class="vph-sandwich-mode-title" id="vph-current-mode-title">
                  <span class="vph-current-mode-icon">🎯</span> <span>Trắc nghiệm 4 đáp án</span>
                </span>
              </div>
              <svg class="vph-sandwich-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>

            <div class="vph-sandwich-dropdown" id="vph-sandwich-dropdown" role="menu">
              <div class="vph-sandwich-dropdown-header">
                <span>Chọn bài luyện tập</span>
              </div>
              <div class="vph-sandwich-items">
                ${buildSandwichMenuItemsHtml('quiz')}
              </div>
            </div>
          </div>

          <div class="vph-controls-right">
            <!-- SRS Due Filter Toggle -->
            <button type="button" class="vph-srs-filter-btn" id="vph-srs-filter-btn" title="Chỉ luyện những từ đã đến hạn lặp lại theo Spaced Repetition">
              <span>🧠 Đến hạn:</span>
              <b id="vph-due-badge">0</b>
            </button>

            <!-- CEFR Level Selector -->
            <select class="vph-level-select" id="vph-level-select" aria-label="Lọc theo cấp độ CEFR">
              <option value="all">Tất cả cấp độ</option>
              <option value="A1">Cấp A1</option>
              <option value="A2">Cấp A2</option>
              <option value="A2+">Cấp A2+</option>
              <option value="B1">Cấp B1</option>
              <option value="B2">Cấp B2</option>
              <option value="C1">Cấp C1</option>
              <option value="C2">Cấp C2</option>
            </select>

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
          <div class="vph-scope-label-box" id="vph-scope-label">Đang xem: Toàn bộ bài học</div>
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
      const wrapper = document.getElementById('vph-sandwich-menu-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        closeSandwichMenu();
      }
      if (e.target === backdrop) closeVocabPracticeHub();
    });

    document.getElementById('vph-close-btn').addEventListener('click', closeVocabPracticeHub);

    // Sandwich Menu trigger button (M45)
    const sandwichBtn = document.getElementById('vph-sandwich-btn');
    if (sandwichBtn) {
      sandwichBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSandwichMenu();
      });
    }

    // Mode switching from Sandwich Menu items & tabs
    backdrop.querySelectorAll('.vph-sandwich-item, .vph-tab-btn').forEach(btn => {
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
      updateScopeOptions();
      startSession();
    });

    // Level select change
    const levelSel = document.getElementById('vph-level-select');
    if (levelSel) {
      levelSel.addEventListener('change', () => {
        state.level = levelSel.value;
        startSession();
      });
    }

    // Global Keydown
    window.addEventListener('keydown', handleGlobalKeydown);

    return backdrop;
  }


  function toggleSandwichMenu(force) {
    const dropdown = document.getElementById('vph-sandwich-dropdown');
    const btn = document.getElementById('vph-sandwich-btn');
    if (!dropdown || !btn) return;
    const isOpen = typeof force === 'boolean' ? force : !dropdown.classList.contains('open');
    dropdown.classList.toggle('open', isOpen);
    btn.classList.toggle('active', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
  }

  function openSandwichMenu() {
    toggleSandwichMenu(true);
  }

  function closeSandwichMenu() {
    toggleSandwichMenu(false);
  }

  function updateModeUi() {
    const meta = MODE_METADATA[state.currentMode] || MODE_METADATA.quiz;
    const titleEl = document.getElementById('vph-current-mode-title');
    if (titleEl) {
      titleEl.innerHTML = `<span class="vph-current-mode-icon">${meta.icon}</span> <span>${escHtml(meta.title)}</span>`;
    }

    document.querySelectorAll('.vph-sandwich-item, .vph-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-mode') === state.currentMode);
    });
  }

  function handleGlobalKeydown(e) {
    if (!state.isOpen) return;

    if (e.key === 'Escape') {
      const dropdown = document.getElementById('vph-sandwich-dropdown');
      if (dropdown && dropdown.classList.contains('open')) {
        e.preventDefault();
        closeSandwichMenu();
        return;
      }
      closeVocabPracticeHub();
      return;
    }

    if (state.currentMode === 'quiz' && state.questions.length > 0) {
      const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
      if (!state.answered && e.key in keyMap) {
        e.preventDefault();
        const btns = document.querySelectorAll('.vph-option-btn');
        const idx = keyMap[e.key];
        if (btns[idx]) btns[idx].click();
      } else if (e.key === ' ' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const currentQ = state.questions[state.currentIndex];
        if (currentQ && (currentQ.isFrToVi || state.answered)) {
          speakFrench(currentQ.frenchWord);
          const audioBtn = document.getElementById('vph-audio-btn');
          if (audioBtn) {
            audioBtn.classList.add('playing');
            setTimeout(() => audioBtn.classList.remove('playing'), 600);
          }
        }
      } else if ((e.key === 'v' || e.key === 'V') && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const currentQ = state.questions[state.currentIndex];
        if (currentQ && (currentQ.videoId || currentQ.item?.videoId) && (currentQ.isFrToVi || state.answered)) {
          playQuestionVideoAudio(currentQ);
        }
      }
    } else if (state.currentMode === 'cloze') {
      if (e.key === ' ' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const currentQ = state.questions[state.currentIndex];
        if (currentQ) speakFrench(currentQ.sentence);
      }
    } else if (state.currentMode === 'flashcard' || (state.currentMode === 'match' && state.m3SubMode === 'flashcard')) {
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
    } else if (state.currentMode === 'translate') {
      handleTranslateKeydown(e);
    } else if (state.currentMode === 'reorder') {
      handleReorderKeydown(e);
    }
  }

  function switchMode(mode) {
    if (!MODE_METADATA[mode]) return;
    playSound('click');
    state.currentMode = mode;
    updateModeUi();
    closeSandwichMenu();
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
    const lvlSel = document.getElementById('vph-level-select');
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

    // Cập nhật các lựa chọn cấp độ trong phạm vi đang chọn
    if (lvlSel) {
      const scopeItems = getScopedVocabList(state.scope, false, 'all');
      const CEFR_LEVELS = ['A1', 'A2', 'A2+', 'B1', 'B2', 'C1', 'C2'];
      const counts = {};
      CEFR_LEVELS.forEach(l => { counts[l] = 0; });
      let unassigned = 0;

      scopeItems.forEach(item => {
        const l = String(item.level || '').trim().toUpperCase();
        if (counts[l] !== undefined) counts[l]++;
        else unassigned++;
      });

      let lvlOpts = `<option value="all">Tất cả cấp độ (${scopeItems.length})</option>`;
      CEFR_LEVELS.forEach(l => {
        const c = counts[l] || 0;
        lvlOpts += `<option value="${l}">${l} (${c})</option>`;
      });

      lvlSel.innerHTML = lvlOpts;
      lvlSel.value = state.level;
    }

    const scopeLabel = document.getElementById('vph-scope-label');
    if (scopeLabel) {
      const lvlLabel = state.level && state.level !== 'all' ? ` · Cấp ${state.level}` : '';
      if (state.scope === 'all') {
        scopeLabel.textContent = `Đang xem: Toàn bộ bài học${lvlLabel}`;
      } else {
        const title = sourceMap.get(state.scope) || state.scope;
        scopeLabel.textContent = `Bài: ${title.length > 24 ? title.slice(0, 24) + '…' : title}${lvlLabel}`;
      }
    }
  }

  function renderNoLevelItemsScreen() {
    const body = document.getElementById('vph-body');
    if (!body) return;
    const lvlText = state.level && state.level !== 'all' ? `Cấp độ ${state.level}` : 'cấp độ này';
    body.innerHTML = `
      <div class="vph-empty">
        <div class="vph-empty-icon">📚</div>
        <h3 class="vph-empty-title">Chưa có từ nào thuộc ${lvlText}!</h3>
        <p class="vph-empty-desc">
          Trong phạm vi bài học đang chọn chưa có từ vựng nào gắn nhãn <b>${lvlText}</b>.<br>
          Bạn có thể chuyển sang cấp độ khác hoặc luyện tập toàn bộ từ vựng.
        </p>
        <div style="display:flex; gap:10px; margin-top:12px">
          <button type="button" class="vph-primary-btn" id="vph-reset-level-btn">
            <span>Luyện tập tất cả cấp độ</span>
          </button>
        </div>
      </div>
    `;
    document.getElementById('vph-reset-level-btn')?.addEventListener('click', () => {
      state.level = 'all';
      const lvlSel = document.getElementById('vph-level-select');
      if (lvlSel) lvlSel.value = 'all';
      startSession();
    });
  }

  // Start new session depending on active mode & SRS filter
  function startSession() {
    stopTimer();
    stopMatchTimer();
    updateMasteryStats();

    const items = getScopedVocabList(state.scope, state.onlyDue, state.level);
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

    // Check if level filter is active but 0 items
    if (state.level !== 'all' && items.length === 0) {
      renderNoLevelItemsScreen();
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
      startMatchGame(items);
    } else if (state.currentMode === 'flashcard') {
      startFlashcards(items);
    } else if (state.currentMode === 'translate') {
      const sessionData = buildTranslateSession(items);
      state.translateSkippedInfo = {
        lowReps: sessionData.skippedLowReps,
        noExamples: sessionData.skippedNoExamples
      };
      if (sessionData.questions.length === 0) {
        renderNoTranslateEligibleScreen(sessionData);
        return;
      }
      state.questions = sessionData.questions;
      updateStatsBar();
      renderTranslateQuestion();
    } else if (state.currentMode === 'reorder') {
      const sessionData = buildReorderSession(items);
      state.reorderSkippedInfo = {
        lowReps: sessionData.skippedLowReps,
        noExamples: sessionData.skippedNoExamples
      };
      if (sessionData.questions.length === 0) {
        renderNoReorderEligibleScreen(sessionData);
        return;
      }
      state.questions = sessionData.questions;
      updateStatsBar();
      renderReorderQuestion();
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
        <h3 class="vph-empty-title">Không có từ nào đến hạn ôn!</h3>
        <p class="vph-empty-desc">
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
      if (q.isFrToVi) {
        // Hướng Pháp -> Việt: Prompt đã là tiếng Pháp, câu ví dụ tô sáng từ tiếng Pháp để hiểu ngữ cảnh
        const targetWord = q.targetWordInCtx || q.frenchWord;
        if (q.he > q.hs && q.he <= q.ctx.length) {
          ctxHtml = escHtml(q.ctx.slice(0, q.hs)) + `<mark class="vph-revealed-ctx">${escHtml(q.ctx.slice(q.hs, q.he))}</mark>` + escHtml(q.ctx.slice(q.he));
        } else if (q.maskedCtx) {
          ctxHtml = q.maskedCtx.replace('id="vph-blank-pill">_______</span>', `class="vph-revealed-ctx">${escHtml(targetWord)}</span>`);
        } else {
          ctxHtml = escHtml(q.ctx);
        }
      } else {
        // Hướng Việt -> Pháp: Prompt là tiếng Việt, câu ví dụ PHẢI CHE TỪ TIẾNG PHÁP bằng [ _______ ]
        if (q.maskedCtx) {
          ctxHtml = q.maskedCtx.replace('id="vph-blank-pill"', 'id="vph-quiz-ctx-mark" class="vph-blank-ctx"');
        } else if (q.he > q.hs && q.he <= q.ctx.length) {
          ctxHtml = escHtml(q.ctx.slice(0, q.hs)) + `<mark class="vph-blank-ctx" id="vph-quiz-ctx-mark">_______</mark>` + escHtml(q.ctx.slice(q.he));
        } else {
          ctxHtml = `<mark class="vph-blank-ctx" id="vph-quiz-ctx-mark">_______</mark>`;
        }
      }
    }

    const directionLabel = q.isFrToVi ? '🇫🇷 Tiếng Pháp → 🇻🇳 Tiếng Việt' : '🇻🇳 Tiếng Việt → 🇫🇷 Tiếng Pháp';
    const srsDueTag = srsIsDue(q.item) ? `<span class="vph-srs-due-badge">Đến hạn ôn</span>` : '';
    const qNum = `Câu ${state.currentIndex + 1} / ${state.questions.length}`;

    if (typeof window.stopVideoAudioSegment === 'function') window.stopVideoAudioSegment();
    body.innerHTML = `
      <div class="vph-quiz-container">
        <!-- Meta & Direction -->
        <div class="vph-quiz-meta">
          <div style="display:flex; align-items:center; gap:8px">
            <span class="vph-direction-badge">${directionLabel}</span>
            ${srsDueTag}
          </div>
          <span class="vph-qnum-tag">${qNum}</span>
        </div>

        <!-- Timer bar -->
        <div class="vph-timer-bar">
          <div class="vph-timer-fill" id="vph-timer-fill" style="width: 100%"></div>
        </div>

        <!-- Question Prompt -->
        <div class="vph-question-card">
          <div class="vph-question-target">${formatGrammarBadgeHtml(escHtml(q.prompt), { mask: true })}</div>
          
          <div class="vph-audio-actions-row">
            <button type="button" class="vph-question-audio-btn" id="vph-audio-btn" style="${q.isFrToVi ? '' : 'display:none'}" title="Nghe phát âm từ vựng (Phím Space)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              <span>Phát âm (Space)</span>
            </button>

            ${(q.videoId && !q.item?.bookId) ? `
              <button type="button" class="vph-video-audio-btn" id="vph-video-audio-btn" style="${q.isFrToVi ? '' : 'display:none'}" title="Nghe đoạn âm thanh từ video gốc (người bản xứ nói, phím V)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                <span>Audio video gốc (V)</span>
              </button>
            ` : ''}
          </div>

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
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        audioBtn.classList.add('playing');
        setTimeout(() => audioBtn.classList.remove('playing'), 600);
        speakFrench(q.frenchWord);
      });
    }

    const videoAudioBtn = document.getElementById('vph-video-audio-btn');
    if (videoAudioBtn) {
      videoAudioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playQuestionVideoAudio(q);
      });
    }

    if (q.isFrToVi) {
      setTimeout(() => {
        if (!state.answered) speakFrench(q.frenchWord);
      }, 250);
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

    // Unmask the target word in the example sentence if it was masked (direction Việt -> Pháp)
    const ctxMark = document.getElementById('vph-quiz-ctx-mark');
    if (ctxMark) {
      ctxMark.className = 'vph-revealed-ctx';
      ctxMark.textContent = q.targetWordInCtx || q.frenchWord;
    }
    const audioBtn = document.getElementById('vph-audio-btn');
    if (audioBtn) {
      audioBtn.style.display = 'inline-flex';
    }
    const videoAudioBtn = document.getElementById('vph-video-audio-btn');
    if (videoAudioBtn) {
      videoAudioBtn.style.display = 'inline-flex';
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

    // Tự động phát âm từ tiếng Pháp đúng khi người dùng chọn đáp án
    const wordToPronounce = q.frenchWord || q.targetWordInCtx;
    if (wordToPronounce) {
      setTimeout(() => {
        speakFrench(wordToPronounce);
      }, 120);
    }

    updateStatsBar();

    setTimeout(() => {
      state.currentIndex++;
      renderQuizQuestion();
    }, 1650);
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
    const srsDueTag = srsIsDue(q.item) ? `<span class="vph-srs-due-badge">Đến hạn ôn</span>` : '';

    const ytUrl = (q.videoId && !q.item?.bookId)
      ? (q.t_known === false || q.item?.t_known === false
          ? `https://www.youtube.com/watch?v=${encodeURIComponent(q.videoId)}`
          : `https://www.youtube.com/watch?v=${encodeURIComponent(q.videoId)}&t=${Math.max(0, Math.floor((q.t || 0) - 2))}s`)
      : '';

    if (typeof window.stopVideoAudioSegment === 'function') window.stopVideoAudioSegment();
    body.innerHTML = `
      <div class="vph-cloze-container">
        <div class="vph-quiz-meta">
          <div style="display:flex; align-items:center; gap:8px">
            <span class="vph-direction-badge">🎧 Nghe & Điền từ khuyết</span>
            ${srsDueTag}
          </div>
          <span class="vph-qnum-tag">${qNum}</span>
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

            ${(q.videoId && !q.item?.bookId) ? `
              <button type="button" class="vph-video-audio-btn" id="vph-cloze-video-audio-btn" style="margin-top:0" title="Nghe âm thanh từ video gốc (không chiếu video)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                <span>🎧 Audio video gốc</span>
              </button>
            ` : ''}

            ${ytUrl ? `
              <a href="${ytUrl}" target="_blank" rel="noopener" class="vph-video-play-btn">
                <span>▶ Mở YouTube</span>
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
    document.getElementById('vph-cloze-video-audio-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      playQuestionVideoAudio(q);
    });

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
      switchMode('flashcard');
    });
  }

  // ==================== 3D FLASHCARD ENGINE (M3 + M4) ====================
  function startFlashcards(scopedItems) {
    stopMatchTimer();
    state.currentMode = 'flashcard';
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

              <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">
                <button type="button" class="vph-audio-play-btn" id="vph-fc-audio-btn" style="padding:6px 14px;font-size:12px">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                  <span>🗣️ Phát âm từ</span>
                </button>
                ${(item.videoId && !item.bookId) ? `
                  <button type="button" class="vph-video-audio-btn" id="vph-fc-video-audio-btn" style="padding:6px 14px;font-size:12px;margin-top:0" title="Nghe đoạn âm thanh từ video gốc (không chiếu video)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    <span>🎧 Audio video</span>
                  </button>
                ` : ''}
              </div>
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

    document.getElementById('vph-fc-wrapper')?.addEventListener('click', (e) => {
      if (e.target.closest('#vph-fc-audio-btn, #vph-fc-video-audio-btn')) return;
      toggleFlashcardFlip();
    });

    document.getElementById('vph-fc-audio-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      speakFrench(item.text);
    });

    document.getElementById('vph-fc-video-audio-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      playQuestionVideoAudio(item);
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

  // ==================== TRANSLATE MODE ENGINE (M44) ====================
  function renderTranslateQuestion() {
    state.answered = false;
    state.translateCanAdvance = false;
    state.translateHintLevel = 0;
    state.translateRevealedWords = 0;

    const body = document.getElementById('vph-body');
    if (!body) return;

    if (state.currentIndex >= state.questions.length) {
      renderDoneScreen();
      return;
    }

    updateStatsBar();
    const q = state.questions[state.currentIndex];
    const qNum = `Câu ${state.currentIndex + 1} / ${state.questions.length}`;
    const levelBadge = q.item?.level ? `<span class="vph-level-badge">${escHtml(q.item.level)}</span>` : '';
    const currentScaleIdx = getFontScaleIndex();

    const skippedTotal = (state.translateSkippedInfo?.lowReps || 0) + (state.translateSkippedInfo?.noExamples || 0);
    const skippedNotice = skippedTotal > 0 && state.currentIndex === 0
      ? `<div style="font-size:11px; color:#94a3b8; margin-bottom:8px; text-align:center;">
           ℹ️ Đã tự động bỏ qua ${skippedTotal} thẻ (chưa đạt reps ≥ ${TRANSLATE_MIN_RECOGNITION_REPS} hoặc thiếu câu ví dụ song ngữ).
         </div>`
      : '';

    body.innerHTML = `
      <div class="vph-translate-container">
        ${skippedNotice}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.04em">${qNum}</span>
            ${levelBadge}
          </div>
          <div class="vph-font-controls" title="Điều chỉnh cỡ chữ bài luyện">
            <button type="button" class="vph-font-btn" id="vph-font-dec-btn" title="Giảm cỡ chữ (A−)">A−</button>
            <span class="vph-font-label" id="vph-font-scale-label">${FONT_SCALE_LABELS[currentScaleIdx]}</span>
            <button type="button" class="vph-font-btn" id="vph-font-inc-btn" title="Tăng cỡ chữ (A+)">A+</button>
          </div>
        </div>

        <div class="vph-translate-prompt-box">
          <div class="vph-translate-prompt-label">Dịch câu tiếng Việt sau sang tiếng Pháp:</div>
          <div class="vph-translate-prompt-text">“${escHtml(q.promptVi)}”</div>
          <div class="vph-translate-hint">
            <span>💡 Gợi ý từ vựng:</span>
            <span class="vph-hint-pill">${escHtml(q.wordVi || q.frenchWord)}</span>
          </div>
          <div class="vph-translate-hint-section" id="vph-translate-hint-section"></div>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          <textarea
            id="vph-translate-input"
            class="vph-translate-textarea"
            rows="2"
            placeholder="Nhập câu tiếng Pháp... (Enter: kiểm tra, Shift+Enter: xuống dòng)"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
          ></textarea>
        </div>

        <div class="vph-translate-controls">
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
              <button type="button" class="vph-secondary-btn" id="vph-translate-hint-btn" title="Gợi ý: Ctrl+/ trong ô gõ, hoặc '?' khi không gõ">
                <span>💡 Gợi ý (Mức 1/4)</span>
              </button>
              <button type="button" class="vph-secondary-btn" id="vph-translate-speak-btn" title="Nghe phát âm tiếng Pháp">
                <span>🔊 Nghe gợi ý</span>
              </button>
              <button type="button" class="vph-secondary-btn" id="vph-translate-reveal-btn" title="Xem đáp án (tính là câu sai)">
                <span>👁️ Xem đáp án</span>
              </button>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <label class="vph-toggle-label" title="Khi bật, hệ thống sẽ bỏ qua sự khác nhau về dấu é, è, ê, à... và dấu câu cuối">
                <input type="checkbox" id="vph-translate-ignore-accents" ${state.translateIgnoreAccents ? 'checked' : ''}>
                <span>Bỏ qua dấu phụ (accents)</span>
              </label>
              <label class="vph-toggle-label" title="Luyện dịch cả những thẻ từ vựng mới học (reps < 2) nhưng đã có câu ví dụ song ngữ">
                <input type="checkbox" id="vph-translate-include-low-reps" ${state.translateIncludeLowReps ? 'checked' : ''}>
                <span>Gồm cả thẻ chưa đạt nhận biết (reps &lt; 2)</span>
              </label>
            </div>
          </div>

          <div style="display:flex; gap:8px; align-items:flex-start;">
            <button type="button" class="vph-secondary-btn" id="vph-translate-skip-btn">
              <span>Bỏ qua</span>
            </button>
            <button type="button" class="vph-primary-btn" id="vph-translate-submit-btn">
              <span>Kiểm tra (Enter)</span>
            </button>
          </div>
        </div>

        <div id="vph-translate-feedback" style="min-height:24px;"></div>
      </div>
    `;

    applyFontScale(currentScaleIdx);

    const input = document.getElementById('vph-translate-input');
    const toggleAccents = document.getElementById('vph-translate-ignore-accents');
    const toggleLowReps = document.getElementById('vph-translate-include-low-reps');
    const submitBtn = document.getElementById('vph-translate-submit-btn');
    const skipBtn = document.getElementById('vph-translate-skip-btn');
    const hintBtn = document.getElementById('vph-translate-hint-btn');
    const speakBtn = document.getElementById('vph-translate-speak-btn');
    const revealBtn = document.getElementById('vph-translate-reveal-btn');
    const fontDecBtn = document.getElementById('vph-font-dec-btn');
    const fontIncBtn = document.getElementById('vph-font-inc-btn');

    if (input) {
      input.focus();
    }

    if (fontDecBtn) {
      fontDecBtn.addEventListener('click', () => {
        setFontScaleIndex(getFontScaleIndex() - 1);
      });
    }

    if (fontIncBtn) {
      fontIncBtn.addEventListener('click', () => {
        setFontScaleIndex(getFontScaleIndex() + 1);
      });
    }

    if (hintBtn) {
      hintBtn.addEventListener('click', handleTranslateHintAdvance);
    }

    if (speakBtn) {
      speakBtn.addEventListener('click', () => {
        speakFrench(q.expectedFr);
      });
    }

    if (revealBtn) {
      revealBtn.addEventListener('click', handleTranslateRevealAnswer);
    }

    if (toggleAccents) {
      toggleAccents.addEventListener('change', () => {
        state.translateIgnoreAccents = toggleAccents.checked;
      });
    }

    if (toggleLowReps) {
      toggleLowReps.addEventListener('change', () => {
        state.translateIncludeLowReps = toggleLowReps.checked;
        startSession();
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', handleTranslateSubmit);
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', handleTranslateSkip);
    }
  }

  function advanceToNextTranslateQuestion() {
    if (state.translateAdvancing) return;
    state.translateAdvancing = true;
    state.currentIndex++;
    renderTranslateQuestion();
    setTimeout(() => {
      state.translateAdvancing = false;
    }, 100);
  }

  function handleTranslateHintAdvance() {
    if (state.answered) return;
    const q = state.questions[state.currentIndex];
    if (!q || !q.expectedFr) return;

    const totalWords = countSentenceWords(q.expectedFr);

    if (state.translateHintLevel === 0) {
      state.translateHintLevel = 1;
    } else if (state.translateHintLevel === 1) {
      state.translateHintLevel = 2;
    } else if (state.translateHintLevel === 2) {
      state.translateHintLevel = 3;
      state.translateRevealedWords = 1;
    } else if (state.translateHintLevel === 3) {
      if (state.translateRevealedWords < totalWords) {
        state.translateRevealedWords++;
      } else {
        state.translateHintLevel = 4;
        speakFrench(q.expectedFr);
      }
    } else if (state.translateHintLevel >= 4) {
      speakFrench(q.expectedFr);
    }

    updateTranslateHintUI();
  }

  function updateTranslateHintUI() {
    const q = state.questions[state.currentIndex];
    if (!q || !q.expectedFr) return;

    const totalWords = countSentenceWords(q.expectedFr);
    const hintSec = document.getElementById('vph-translate-hint-section');
    const hintBtn = document.getElementById('vph-translate-hint-btn');

    if (hintSec) {
      if (state.translateHintLevel > 0) {
        const hintText = generateSentenceHint(q.expectedFr, state.translateHintLevel, state.translateRevealedWords);
        let levelLabel = `Mức ${state.translateHintLevel}/4`;
        if (state.translateHintLevel === 1) levelLabel += ': Số từ & độ dài';
        else if (state.translateHintLevel === 2) levelLabel += ': Chữ cái đầu';
        else if (state.translateHintLevel === 3) levelLabel += `: Mở từ (${state.translateRevealedWords}/${totalWords})`;
        else if (state.translateHintLevel >= 4) levelLabel += ': Nghe câu mẫu';

        hintSec.innerHTML = `
          <div class="vph-hint-display">
            <div style="font-size:11px; text-transform:uppercase; color:#f59e0b; font-weight:700; margin-bottom:4px;">
              💡 Gợi ý câu (${levelLabel}):
            </div>
            <div class="vph-hint-code">${escHtml(hintText)}</div>
          </div>
        `;
      } else {
        hintSec.innerHTML = '';
      }
    }

    if (hintBtn) {
      let nextLabel = 'Mức 1/4';
      if (state.translateHintLevel === 1) nextLabel = 'Mức 2/4 (Chữ đầu)';
      else if (state.translateHintLevel === 2) nextLabel = 'Mức 3/4 (Mở từ)';
      else if (state.translateHintLevel === 3) {
        nextLabel = state.translateRevealedWords < totalWords
          ? `Mở tiếp từ (${state.translateRevealedWords + 1}/${totalWords})`
          : 'Mức 4/4 (Nghe)';
      } else if (state.translateHintLevel >= 4) {
        nextLabel = 'Nghe lại 🔊';
      }
      hintBtn.innerHTML = `<span>💡 Gợi ý (${nextLabel})</span>`;
    }
  }

  function handleTranslateRevealAnswer() {
    if (state.answered) return;
    state.translateHintLevel = 5; // Mức >= 5: Xem đáp án (tính là câu sai)
    handleTranslateSkip();
  }

  function handleTranslateKeydown(e) {
    if (!state.isOpen || state.currentMode !== 'translate') return;

    // Phím tắt gợi ý:
    // 1. Trong ô gõ (hoặc bất kỳ đâu): Ctrl+/ (chỉ phím Control, không dùng Cmd để tránh xung đột hệ thống macOS)
    if (e.ctrlKey && !e.metaKey && (e.key === '/' || e.code === 'Slash')) {
      e.preventDefault();
      handleTranslateHintAdvance();
      return;
    }
    // 2. Khi không focus ô gõ/textarea: phím '?'
    if (e.key === '?' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleTranslateHintAdvance();
      return;
    }

    if (e.key !== 'Enter') return;

    // Cho phép Shift+Enter xuống dòng trong textarea
    if (e.shiftKey) return;

    // Bỏ qua nếu đang gõ bộ gõ tiếng Việt (IME composing) hoặc phím đang giữ lặp lại (repeat)
    if (e.isComposing || e.keyCode === 229 || e.repeat) return;

    if (!state.answered) {
      e.preventDefault();
      handleTranslateSubmit();
    } else if (state.translateCanAdvance) {
      e.preventDefault();
      advanceToNextTranslateQuestion();
    }
  }

  function renderNoTranslateEligibleScreen(sessionData) {
    const body = document.getElementById('vph-body');
    if (!body) return;

    const enableLowRepsBtnHtml = (sessionData.skippedLowReps > 0 && !state.translateIncludeLowReps)
      ? `<button type="button" class="vph-primary-btn" id="vph-enable-low-reps-btn" style="background:#2563eb; color:#fff;">
           <span>⚡ Bật "Gồm cả thẻ reps &lt; 2" (${sessionData.skippedLowReps} thẻ)</span>
         </button>`
      : '';

    body.innerHTML = `
      <div class="vph-empty">
        <div class="vph-empty-icon">✍️</div>
        <h3 class="vph-empty-title">Chưa có thẻ nào đủ điều kiện luyện Dịch</h3>
        <p class="vph-empty-desc" style="max-width:520px; margin:0 auto 16px auto; line-height:1.6;">
          Bài luyện <b>Dịch Việt → Pháp</b> yêu cầu:
          <br>1. Thẻ từ đã đạt độ nhận biết cơ bản (<b>reps ≥ ${TRANSLATE_MIN_RECOGNITION_REPS}</b> qua Flashcard hoặc Trắc nghiệm).
          <br>2. Thẻ có ít nhất một câu ví dụ song ngữ Pháp - Việt (VD1 - VD3).
        </p>
        <div style="font-size:12px; color:#94a3b8; margin-bottom:20px;">
          (Đã kiểm tra: ${sessionData.skippedLowReps} thẻ chưa đủ reps, ${sessionData.skippedNoExamples} thẻ thiếu câu ví dụ).
        </div>
        <div class="vph-actions-row">
          ${enableLowRepsBtnHtml}
          <button type="button" class="vph-primary-btn" id="vph-switch-to-flashcard-btn">
            <span>🎴 Học Flashcard</span>
          </button>
          <button type="button" class="vph-secondary-btn" id="vph-switch-to-quiz-btn">
            <span>🎯 Luyện Trắc nghiệm</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('vph-enable-low-reps-btn')?.addEventListener('click', () => {
      state.translateIncludeLowReps = true;
      startSession();
    });
    document.getElementById('vph-switch-to-flashcard-btn')?.addEventListener('click', () => switchMode('flashcard'));
    document.getElementById('vph-switch-to-quiz-btn')?.addEventListener('click', () => switchMode('quiz'));
  }

  function handleTranslateSubmit() {
    if (state.answered) return;
    const input = document.getElementById('vph-translate-input');
    const feedbackArea = document.getElementById('vph-translate-feedback');
    const submitBtn = document.getElementById('vph-translate-submit-btn');
    const skipBtn = document.getElementById('vph-translate-skip-btn');
    const hintBtn = document.getElementById('vph-translate-hint-btn');
    const revealBtn = document.getElementById('vph-translate-reveal-btn');
    if (!input) return;

    const userAnswer = input.value.trim();
    if (!userAnswer) {
      input.focus();
      return;
    }

    state.answered = true;
    state.translateCanAdvance = false;
    setTimeout(() => {
      state.translateCanAdvance = true;
    }, 180);

    input.disabled = true;
    if (submitBtn) submitBtn.style.display = 'none';
    if (skipBtn) skipBtn.style.display = 'none';
    if (hintBtn) hintBtn.disabled = true;
    if (revealBtn) revealBtn.disabled = true;

    const q = state.questions[state.currentIndex];
    const mode = state.translateIgnoreAccents ? 'lenient' : 'strict';

    // So khớp với expectedFr
    let res = normalizeTranslateAnswer(userAnswer, q.expectedFr, { mode });

    // So khớp với extra_accepted nếu có
    if (!res.isCorrect && Array.isArray(q.extra_accepted)) {
      for (const alt of q.extra_accepted) {
        const altRes = normalizeTranslateAnswer(userAnswer, alt, { mode });
        if (altRes.isCorrect) {
          res = altRes;
          break;
        }
      }
    }

    if (res.isCorrect) {
      playSound('correct');
      state.score += 10;
      state.streak += 1;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      updateStatsBar();

      // Cập nhật SM-2 Translate Skill với hintLevel đã dùng
      updateItemTranslateSkill(q.item?.id, true, state.translateHintLevel);

      if (feedbackArea) {
        feedbackArea.innerHTML = `
          <div class="vph-feedback-box success" style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-weight:700;">🎉 Chính xác!</div>
              <button type="button" id="vph-translate-next-btn" class="vph-primary-btn" style="padding:6px 14px; font-size:13px;">
                <span>Câu tiếp (Enter) ➔</span>
              </button>
            </div>
            <div style="font-size:calc(1.15rem * var(--vph-font-scale, 1.08)); font-weight:600; color:#ecfdf5;">${escHtml(q.expectedFr)}</div>
          </div>
        `;
        document.getElementById('vph-translate-next-btn')?.addEventListener('click', advanceToNextTranslateQuestion);
      }

      speakFrench(q.expectedFr);

      setTimeout(() => {
        if (state.answered && state.currentMode === 'translate') {
          advanceToNextTranslateQuestion();
        }
      }, 2000);
    } else {
      playSound('wrong');
      state.streak = 0;
      state.wrongList.push({
        frenchWord: q.expectedFr,
        vietnameseMeaning: q.promptVi
      });
      updateStatsBar();

      // Cập nhật SM-2 Translate Skill (SAI)
      updateItemTranslateSkill(q.item?.id, false, state.translateHintLevel);

      const wordDiffHtml = renderWordDiffHtml(userAnswer, q.expectedFr);

      if (feedbackArea) {
        feedbackArea.innerHTML = `
          <div class="vph-feedback-box error" style="display:flex; flex-direction:column; gap:10px;">
            <div style="font-weight:700;">Chưa chính xác!</div>
            <div>
              <div style="font-size:11px; text-transform:uppercase; color:#94a3b8; font-weight:700;">Đáp án chuẩn:</div>
              <div style="font-size:calc(1.15rem * var(--vph-font-scale, 1.08)); font-weight:600; color:#6ee7b7; margin-top:2px;">${escHtml(q.expectedFr)}</div>
            </div>
            <div>
              <div style="font-size:11px; text-transform:uppercase; color:#94a3b8; font-weight:700;">So sánh chi tiết theo từ:</div>
              <div class="vph-word-diff-box">${wordDiffHtml}</div>
            </div>
            <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:8px; margin-top:6px;">
              <button type="button" id="vph-accept-alt-btn" class="vph-btn-accept-alt" title="Lưu cách diễn đạt này vào danh sách được chấp nhận cho riêng bạn">
                💡 Chấp nhận cách nói khác
              </button>
              <button type="button" id="vph-translate-next-btn" class="vph-primary-btn">
                <span>Câu tiếp (Enter) ➔</span>
              </button>
            </div>
          </div>
        `;

        document.getElementById('vph-accept-alt-btn')?.addEventListener('click', () => {
          handleAcceptAlternative(q, userAnswer);
        });

        document.getElementById('vph-translate-next-btn')?.addEventListener('click', advanceToNextTranslateQuestion);
      }
    }
  }

  function handleAcceptAlternative(q, userAnswer) {
    const btn = document.getElementById('vph-accept-alt-btn');
    if (!q || !q.item) return;

    const all = getRawVocabList();
    const item = all.find(v => v.id === q.item.id);
    if (!item) return;

    item.extra_accepted = Array.isArray(item.extra_accepted) ? item.extra_accepted : [];
    const trimmed = userAnswer.trim();
    if (!item.extra_accepted.includes(trimmed)) {
      item.extra_accepted.push(trimmed);
    }
    persistVocabList(all);

    // Hồi phục lại điểm và ghi nhận đúng
    updateItemTranslateSkill(item.id, true, state.translateHintLevel);
    if (state.wrongList.length > 0 && state.wrongList[state.wrongList.length - 1].frenchWord === q.expectedFr) {
      state.wrongList.pop();
    }
    state.score += 10;
    updateStatsBar();

    if (btn) {
      btn.disabled = true;
      btn.textContent = '✓ Đã lưu cách nói này vào kho cục bộ';
      btn.style.color = '#34d399';
      btn.style.borderColor = '#10b981';
    }
  }

  function handleTranslateSkip() {
    if (state.answered) return;
    state.answered = true;
    state.translateCanAdvance = false;
    setTimeout(() => {
      state.translateCanAdvance = true;
    }, 180);

    const input = document.getElementById('vph-translate-input');
    const feedbackArea = document.getElementById('vph-translate-feedback');
    const submitBtn = document.getElementById('vph-translate-submit-btn');
    const skipBtn = document.getElementById('vph-translate-skip-btn');
    const hintBtn = document.getElementById('vph-translate-hint-btn');
    const revealBtn = document.getElementById('vph-translate-reveal-btn');
    if (input) input.disabled = true;
    if (submitBtn) submitBtn.style.display = 'none';
    if (skipBtn) skipBtn.style.display = 'none';
    if (hintBtn) hintBtn.disabled = true;
    if (revealBtn) revealBtn.disabled = true;

    playSound('wrong');
    const q = state.questions[state.currentIndex];
    state.streak = 0;
    state.wrongList.push({
      frenchWord: q.expectedFr,
      vietnameseMeaning: q.promptVi
    });
    updateStatsBar();

    // Giảm SM-2 (tính là sai / fail)
    updateItemTranslateSkill(q.item?.id, false, state.translateHintLevel >= 5 ? 5 : 0);

    if (feedbackArea) {
      const title = state.translateHintLevel >= 5 ? 'Đáp án là:' : 'Đáp án chuẩn là:';
      feedbackArea.innerHTML = `
        <div class="vph-feedback-box error" style="display:flex; flex-direction:column; gap:8px;">
          <div style="font-weight:700;">${title}</div>
          <div style="font-size:calc(1.15rem * var(--vph-font-scale, 1.08)); font-weight:600; color:#6ee7b7;">${escHtml(q.expectedFr)}</div>
          <div style="margin-top:6px;">
            <button type="button" id="vph-translate-next-btn" class="vph-primary-btn">
              <span>Câu tiếp (Enter) ➔</span>
            </button>
          </div>
        </div>
      `;
      document.getElementById('vph-translate-next-btn')?.addEventListener('click', advanceToNextTranslateQuestion);
    }

    speakFrench(q.expectedFr);
  }

  // ==================== BÀI LUYỆN SẮP XẾP CÂU (SENTENCE REORDERING - M46) ====================
  function buildReorderSession(scopedItems, options) {
    const includeLowReps = (options && typeof options.includeLowReps === 'boolean')
      ? options.includeLowReps
      : (typeof state !== 'undefined' && typeof state.reorderIncludeLowReps === 'boolean'
          ? state.reorderIncludeLowReps
          : REORDER_SM2_CONFIG.DEFAULT_INCLUDE_LOW_REPS);

    const sourceList = scopedItems.length > 0 ? scopedItems : CURATED_FALLBACK_VOCAB;
    let skippedLowReps = 0;
    let skippedNoExamples = 0;

    const eligible = [];
    sourceList.forEach(item => {
      if (!item) return;
      const reps = (item.srs && typeof item.srs.reps === 'number') ? item.srs.reps : 0;
      if (!includeLowReps && reps < REORDER_SM2_CONFIG.MIN_RECOGNITION_REPS) {
        skippedLowReps++;
        return;
      }

      const validExamples = (Array.isArray(item.examples) ? item.examples : []).filter(ex => {
        if (!ex || !ex.fr || !String(ex.fr).trim() || !ex.vi || !String(ex.vi).trim()) return false;
        const tok = tokenizeFrenchForReorder(String(ex.fr).trim());
        return tok.valid;
      });

      if (validExamples.length === 0) {
        skippedNoExamples++;
        return;
      }

      eligible.push({
        item: item,
        examples: validExamples
      });
    });

    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    const sessionSize = Math.min(10, Math.max(5, shuffled.length));
    const targetSubset = shuffled.slice(0, sessionSize);

    const questions = targetSubset.map((entry, qIndex) => {
      const { item, examples } = entry;
      const chosen = examples[Math.floor(Math.random() * examples.length)];
      const tokRes = tokenizeFrenchForReorder(chosen.fr.trim());

      const bankShuffled = [...tokRes.tokens].sort(() => Math.random() - 0.5);
      if (bankShuffled.length >= 3 && bankShuffled.every((t, i) => t.origIndex === i)) {
        const tmp = bankShuffled[0];
        bankShuffled[0] = bankShuffled[1];
        bankShuffled[1] = tmp;
      }

      return {
        id: item.id || `reorder_${qIndex}`,
        item: item,
        promptVi: chosen.vi.trim(),
        expectedFr: chosen.fr.trim(),
        tokens: tokRes.tokens,
        shuffledTokens: bankShuffled,
        punct: tokRes.punct,
        wordVi: item.wordVi || item.vi || '',
        frenchWord: item.text || item.fr || ''
      };
    });

    return {
      questions: questions,
      eligibleCount: eligible.length,
      skippedLowReps: skippedLowReps,
      skippedNoExamples: skippedNoExamples
    };
  }

  function renderReorderQuestion() {
    state.answered = false;
    state.reorderCanAdvance = false;
    state.reorderHintLevel = 0;

    const body = document.getElementById('vph-body');
    if (!body) return;

    if (state.currentIndex >= state.questions.length) {
      renderDoneScreen();
      return;
    }

    updateStatsBar();
    const q = state.questions[state.currentIndex];
    state.reorderCurrentTokens = q.tokens;
    state.reorderBankTokens = [...q.shuffledTokens];
    state.reorderSelectedTokens = [];
    state.reorderPunct = q.punct;

    const qNum = `Câu ${state.currentIndex + 1} / ${state.questions.length}`;
    const levelBadge = q.item?.level ? `<span class="vph-level-badge">${escHtml(q.item.level)}</span>` : '';
    const currentScaleIdx = getFontScaleIndex();

    const skippedTotal = (state.reorderSkippedInfo?.lowReps || 0) + (state.reorderSkippedInfo?.noExamples || 0);
    const skippedNotice = skippedTotal > 0 && state.currentIndex === 0
      ? `<div style="font-size:11px; color:#94a3b8; margin-bottom:8px; text-align:center;">
           ℹ️ Đã tự động bỏ qua ${skippedTotal} thẻ (chưa đạt reps ≥ ${REORDER_SM2_CONFIG.MIN_RECOGNITION_REPS} hoặc câu ví dụ không nằm trong khoảng 3–15 từ).
         </div>`
      : '';

    body.innerHTML = `
      <div class="vph-reorder-container">
        ${skippedNotice}
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.04em">${qNum}</span>
            ${levelBadge}
          </div>
          <div class="vph-font-controls" title="Điều chỉnh cỡ chữ bài luyện">
            <button type="button" class="vph-font-btn" id="vph-font-dec-btn" title="Giảm cỡ chữ (A−)">A−</button>
            <span class="vph-font-label" id="vph-font-scale-label">${FONT_SCALE_LABELS[currentScaleIdx]}</span>
            <button type="button" class="vph-font-btn" id="vph-font-inc-btn" title="Tăng cỡ chữ (A+)">A+</button>
          </div>
        </div>

        <div class="vph-translate-prompt-box">
          <div class="vph-translate-prompt-label">Sắp xếp các từ tiếng Pháp sau thành câu hoàn chỉnh:</div>
          <div class="vph-translate-prompt-text">“${escHtml(q.promptVi)}”</div>
          <div class="vph-translate-hint">
            <span>💡 Từ trọng tâm:</span>
            <span class="vph-hint-pill">${escHtml(q.wordVi || q.frenchWord)}</span>
          </div>
          <div class="vph-translate-hint-section" id="vph-reorder-hint-section"></div>
        </div>

        <!-- Answer Zone (Vùng ghép câu) -->
        <div class="vph-reorder-zone-card">
          <div class="vph-reorder-zone-header">
            <span>Câu đang ghép:</span>
            <div style="display:flex; gap:6px;">
              <button type="button" class="vph-font-btn" id="vph-reorder-undo-btn" title="Lùi 1 từ (Phím Backspace)">⌫ Lùi</button>
              <button type="button" class="vph-font-btn" id="vph-reorder-clear-btn" title="Xóa hết để ghép lại">↺ Xóa hết</button>
            </div>
          </div>
          <div class="vph-reorder-answer-zone" id="vph-reorder-answer-zone"></div>
        </div>

        <!-- Word Bank (Ngân hàng từ) -->
        <div class="vph-reorder-zone-card">
          <div class="vph-reorder-zone-header">
            <span>Ngân hàng từ (Bấm vào từ hoặc bấm phím số 1–9):</span>
          </div>
          <div class="vph-reorder-word-bank" id="vph-reorder-word-bank"></div>
        </div>

        <!-- Controls -->
        <div class="vph-translate-controls">
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
              <button type="button" class="vph-secondary-btn" id="vph-reorder-hint-btn" title="Gợi ý: Ctrl+/ hoặc phím '?'">
                <span>💡 Gợi ý (Mức 1/3)</span>
              </button>
              <button type="button" class="vph-secondary-btn" id="vph-reorder-speak-btn" title="Nghe phát âm câu tiếng Pháp">
                <span>🔊 Nghe câu</span>
              </button>
              <button type="button" class="vph-secondary-btn" id="vph-reorder-reveal-btn" title="Xem đáp án chuẩn (tính là câu sai)">
                <span>👁️ Xem đáp án</span>
              </button>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              <label class="vph-toggle-label" title="Luyện sắp xếp cả những thẻ từ vựng mới học (reps < 2) có câu ví dụ song ngữ 3–15 từ">
                <input type="checkbox" id="vph-reorder-include-low-reps" ${state.reorderIncludeLowReps ? 'checked' : ''}>
                <span>Gồm cả thẻ chưa đạt nhận biết (reps &lt; 2)</span>
              </label>
            </div>
          </div>

          <div style="display:flex; gap:8px; align-items:flex-start;">
            <button type="button" class="vph-secondary-btn" id="vph-reorder-skip-btn">
              <span>Bỏ qua</span>
            </button>
            <button type="button" class="vph-primary-btn" id="vph-reorder-submit-btn">
              <span>Kiểm tra (Enter)</span>
            </button>
          </div>
        </div>

        <div id="vph-reorder-feedback" style="min-height:24px;"></div>
      </div>
    `;

    applyFontScale(currentScaleIdx);

    const decBtn = document.getElementById('vph-font-dec-btn');
    const incBtn = document.getElementById('vph-font-inc-btn');
    if (decBtn) decBtn.onclick = () => setFontScaleIndex(getFontScaleIndex() - 1);
    if (incBtn) incBtn.onclick = () => setFontScaleIndex(getFontScaleIndex() + 1);

    const undoBtn = document.getElementById('vph-reorder-undo-btn');
    const clearBtn = document.getElementById('vph-reorder-clear-btn');
    if (undoBtn) undoBtn.onclick = handleReorderUndo;
    if (clearBtn) clearBtn.onclick = handleReorderClear;

    const hintBtn = document.getElementById('vph-reorder-hint-btn');
    const speakBtn = document.getElementById('vph-reorder-speak-btn');
    const revealBtn = document.getElementById('vph-reorder-reveal-btn');
    const submitBtn = document.getElementById('vph-reorder-submit-btn');
    const skipBtn = document.getElementById('vph-reorder-skip-btn');
    const toggleLowReps = document.getElementById('vph-reorder-include-low-reps');

    if (hintBtn) hintBtn.onclick = handleReorderHintAdvance;
    if (speakBtn) speakBtn.onclick = () => speakFrench(q.expectedFr);
    if (revealBtn) revealBtn.onclick = handleReorderRevealAnswer;
    if (submitBtn) {
      submitBtn.onclick = () => {
        if (!state.answered) handleReorderSubmit();
        else if (state.reorderCanAdvance) advanceToNextReorderQuestion();
      };
    }
    if (skipBtn) skipBtn.onclick = () => advanceToNextReorderQuestion();
    if (toggleLowReps) {
      toggleLowReps.onchange = (e) => {
        state.reorderIncludeLowReps = e.target.checked;
        startSession();
      };
    }

    renderReorderZones();
  }

  function renderReorderZones() {
    const answerZone = document.getElementById('vph-reorder-answer-zone');
    const wordBank = document.getElementById('vph-reorder-word-bank');
    if (!answerZone || !wordBank) return;

    // 1. Render Answer Zone
    if (state.reorderSelectedTokens.length === 0) {
      answerZone.className = 'vph-reorder-answer-zone';
      answerZone.innerHTML = `<span class="vph-reorder-empty-prompt">Chạm vào các từ bên dưới (hoặc bấm phím số 1–9) để ghép câu...</span>`;
    } else {
      answerZone.className = 'vph-reorder-answer-zone has-tokens';
      let chipsHtml = state.reorderSelectedTokens.map((t, idx) => {
        let posClass = '';
        if (state.answered) {
          const expectedTok = state.reorderCurrentTokens[idx];
          const isMatch = expectedTok && !!(normalizeTranslateAnswer(t.text, expectedTok.text)?.isCorrect);
          posClass = isMatch ? 'correct-pos' : 'misplaced-pos';
        }
        return `<button type="button" class="vph-reorder-chip in-answer ${posClass}" data-id="${t.id}" onclick="window.VocabPracticeHub.handleReorderTokenDeselect('${t.id}')">
                  ${escHtml(t.displayText || t.text)}
                </button>`;
      }).join('');

      const punctChip = state.reorderPunct
        ? `<span class="vph-reorder-punct-chip">${escHtml(state.reorderPunct)}</span>`
        : '';
      answerZone.innerHTML = chipsHtml + punctChip;
    }

    // 2. Render Word Bank
    if (state.reorderBankTokens.length === 0) {
      wordBank.innerHTML = `<span style="color:#64748b; font-size:12px; font-style:italic;">(Đã đưa hết các từ lên câu đang ghép)</span>`;
    } else {
      wordBank.innerHTML = state.reorderBankTokens.map((t, idx) => {
        const keyBadge = idx < 9 ? `<span class="vph-reorder-key-badge">${idx + 1}</span>` : '';
        const isHintWord = state.reorderHintLevel >= 1 && t.origIndex < 2;
        const hintStar = isHintWord ? `<span class="vph-reorder-hint-star" title="Từ số ${t.origIndex + 1} trong câu">⭐${t.origIndex + 1} </span>` : '';
        return `<button type="button" class="vph-reorder-chip" data-id="${t.id}" onclick="window.VocabPracticeHub.handleReorderTokenSelect('${t.id}')">
                  ${keyBadge}${hintStar}${escHtml(t.displayText || t.text)}
                </button>`;
      }).join('');
    }
  }

  function handleReorderTokenSelect(tokenId) {
    if (state.answered) return;
    const idx = state.reorderBankTokens.findIndex(t => t.id === tokenId);
    if (idx < 0) return;
    const token = state.reorderBankTokens.splice(idx, 1)[0];
    state.reorderSelectedTokens.push(token);

    const fb = document.getElementById('vph-reorder-feedback');
    if (fb && typeof fb.querySelector === 'function' && fb.querySelector('.vph-reorder-warning')) {
      fb.innerHTML = '';
    }

    playSound('click');
    renderReorderZones();
  }

  function handleReorderTokenDeselect(tokenId) {
    if (state.answered) return;
    const idx = state.reorderSelectedTokens.findIndex(t => t.id === tokenId);
    if (idx < 0) return;
    const token = state.reorderSelectedTokens.splice(idx, 1)[0];
    state.reorderBankTokens.push(token);

    playSound('click');
    renderReorderZones();
  }

  function handleReorderUndo() {
    if (state.answered || state.reorderSelectedTokens.length === 0) return;
    const token = state.reorderSelectedTokens.pop();
    state.reorderBankTokens.push(token);
    playSound('click');
    renderReorderZones();
  }

  function handleReorderClear() {
    if (state.answered || state.reorderSelectedTokens.length === 0) return;
    state.reorderBankTokens = [...state.reorderBankTokens, ...state.reorderSelectedTokens];
    state.reorderSelectedTokens = [];
    playSound('click');
    renderReorderZones();
  }

  function handleReorderSubmit() {
    if (state.answered) return;
    const q = state.questions[state.currentIndex];
    if (!q) return;

    const fb = document.getElementById('vph-reorder-feedback');
    const submitBtn = document.getElementById('vph-reorder-submit-btn');

    // 1. Kiểm tra đã đặt đủ token chưa
    if (state.reorderSelectedTokens.length < state.reorderCurrentTokens.length) {
      if (fb) {
        fb.innerHTML = `<div class="vph-reorder-warning">⚠️ Chưa đủ từ. Vui lòng chọn hết các từ còn lại trong ngân hàng từ (${state.reorderSelectedTokens.length} / ${state.reorderCurrentTokens.length}).</div>`;
      }
      if (submitBtn) {
        submitBtn.innerHTML = `<span>Kiểm tra (Enter)</span>`;
      }
      return;
    }

    // 2. Chấm bằng cách ghép chuỗi và so sánh không phân biệt hoa/thường
    state.answered = true;
    state.reorderCanAdvance = true;

    const userJoined = state.reorderSelectedTokens.map(t => t.text).join(' ');
    const expectedJoined = state.reorderCurrentTokens.map(t => t.text).join(' ');
    const checkRes = normalizeTranslateAnswer(userJoined, expectedJoined);
    const isCorrect = !!(checkRes && checkRes.isCorrect);

    if (isCorrect) {
      state.score += 10;
      state.streak += 1;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      playSound('correct');

      updateItemReorderSkill(q.item?.id, true, state.reorderHintLevel);

      if (fb) {
        fb.innerHTML = `
          <div class="vph-diff-box" style="border-color:rgba(16,185,129,0.5); background:rgba(16,185,129,0.1); color:#4ade80;">
            <div style="font-weight:700; margin-bottom:2px;">✓ Chính xác! Bạn đã ghép đúng thứ tự câu.</div>
          </div>
        `;
      }
    } else {
      state.streak = 0;
      state.wrongList.push({
        frenchWord: q.expectedFr,
        vietnameseMeaning: q.promptVi
      });
      playSound('wrong');

      updateItemReorderSkill(q.item?.id, false, state.reorderHintLevel);

      if (fb) {
        fb.innerHTML = `
          <div class="vph-diff-box" style="border-color:rgba(239,68,68,0.5); background:rgba(239,68,68,0.1);">
            <div style="color:#f87171; font-weight:700; margin-bottom:4px;">✕ Chưa chính xác.</div>
            <div style="color:#cbd5e1; font-size:13px;">Đáp án chuẩn: <strong style="color:#4ade80;">${escHtml(q.expectedFr)}</strong></div>
          </div>
        `;
      }
    }

    if (submitBtn) {
      submitBtn.innerHTML = `<span>Câu tiếp theo (Enter)</span>`;
      submitBtn.classList.add('vph-pulse');
    }

    renderReorderZones();
  }

  function advanceToNextReorderQuestion() {
    state.currentIndex += 1;
    if (state.currentIndex >= state.questions.length) {
      renderDoneScreen();
    } else {
      renderReorderQuestion();
    }
  }

  function handleReorderHintAdvance() {
    if (state.answered) return;
    const q = state.questions[state.currentIndex];
    if (!q) return;

    const hintBtn = document.getElementById('vph-reorder-hint-btn');
    const hintSection = document.getElementById('vph-reorder-hint-section');

    if (state.reorderHintLevel === 0) {
      state.reorderHintLevel = 1;
      if (hintBtn) hintBtn.innerHTML = `<span>💡 Gợi ý (Mức 2/3: Ghim 50%)</span>`;
      if (hintSection) {
        hintSection.innerHTML = `
          <div style="font-size:12px; color:#fbbf24; margin-top:6px;">
            💡 Đã đánh dấu ⭐1, ⭐2 cho 1–2 từ mở đầu câu trong ngân hàng từ.
          </div>
        `;
      }
      renderReorderZones();
    } else if (state.reorderHintLevel === 1) {
      state.reorderHintLevel = 2;
      if (hintBtn) hintBtn.innerHTML = `<span>💡 Gợi ý (Mức 3/3: Xem câu mẫu)</span>`;

      const halfCount = Math.max(1, Math.floor(state.reorderCurrentTokens.length / 2));
      const pinnedTokens = state.reorderCurrentTokens.slice(0, halfCount);
      const pinnedIds = new Set(pinnedTokens.map(t => t.id));

      state.reorderSelectedTokens = [...pinnedTokens];
      state.reorderBankTokens = q.tokens.filter(t => !pinnedIds.has(t.id)).sort(() => Math.random() - 0.5);

      if (hintSection) {
        hintSection.innerHTML = `
          <div style="font-size:12px; color:#fbbf24; margin-top:6px;">
            💡 Đã ghim sẵn ${halfCount} từ đầu tiên vào đúng vị trí câu đang ghép.
          </div>
        `;
      }
      renderReorderZones();
    } else if (state.reorderHintLevel === 2) {
      handleReorderRevealAnswer();
    }
  }

  function handleReorderRevealAnswer() {
    if (state.answered) return;
    const q = state.questions[state.currentIndex];
    if (!q) return;

    state.reorderHintLevel = 3;
    const hintSection = document.getElementById('vph-reorder-hint-section');
    const hintBtn = document.getElementById('vph-reorder-hint-btn');

    if (hintBtn) hintBtn.innerHTML = `<span>💡 Đã mở câu mẫu</span>`;
    if (hintSection) {
      hintSection.innerHTML = `
        <div class="vph-diff-box" style="border-color:#f59e0b; background:rgba(245,158,11,0.1); margin-top:8px;">
          <span style="color:#fbbf24; font-weight:700;">Câu mẫu tiếng Pháp:</span>
          <strong style="color:#ffffff; margin-left:4px;">${escHtml(q.expectedFr)}</strong>
        </div>
      `;
    }
    state.reorderSelectedTokens = [...state.reorderCurrentTokens];
    state.reorderBankTokens = [];
    renderReorderZones();
  }

  function handleReorderKeydown(e) {
    if (!state.isOpen || state.currentMode !== 'reorder') return;

    if (e.ctrlKey && !e.metaKey && (e.key === '/' || e.code === 'Slash')) {
      e.preventDefault();
      handleReorderHintAdvance();
      return;
    }
    if (e.key === '?' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleReorderHintAdvance();
      return;
    }

    if (e.isComposing || e.keyCode === 229 || e.repeat) return;

    if (!state.answered && e.key >= '1' && e.key <= '9') {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < state.reorderBankTokens.length) {
        e.preventDefault();
        handleReorderTokenSelect(state.reorderBankTokens[idx].id);
        return;
      }
    }

    if (!state.answered && e.key === 'Backspace' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleReorderUndo();
      return;
    }

    if (e.key === 'Enter') {
      if (!state.answered) {
        e.preventDefault();
        handleReorderSubmit();
      } else if (state.reorderCanAdvance) {
        e.preventDefault();
        advanceToNextReorderQuestion();
      }
    }
  }

  function renderNoReorderEligibleScreen(sessionData) {
    const body = document.getElementById('vph-body');
    if (!body) return;

    const enableLowRepsBtnHtml = (sessionData.skippedLowReps > 0 && !state.reorderIncludeLowReps)
      ? `<button type="button" class="vph-primary-btn" id="vph-enable-reorder-low-reps-btn" style="background:#2563eb; color:#fff;">
           <span>⚡ Bật "Gồm cả thẻ reps &lt; 2" (${sessionData.skippedLowReps} thẻ)</span>
         </button>`
      : '';

    body.innerHTML = `
      <div class="vph-empty">
        <div class="vph-empty-icon">🧩</div>
        <h3 class="vph-empty-title">Chưa có thẻ từ vựng đủ điều kiện sắp xếp câu</h3>
        <p class="vph-empty-desc" style="max-width:520px; margin:0 auto 16px auto; line-height:1.6;">
          Bài luyện <b>Sắp xếp câu</b> yêu cầu thẻ có câu ví dụ song ngữ (Pháp - Việt) với độ dài từ 3 đến 15 từ.
          ${sessionData.skippedLowReps > 0 ? `<br>Hiện có <b>${sessionData.skippedLowReps}</b> thẻ chưa đạt reps ≥ ${REORDER_SM2_CONFIG.MIN_RECOGNITION_REPS}.` : ''}
          ${sessionData.skippedNoExamples > 0 ? `<br>Có <b>${sessionData.skippedNoExamples}</b> thẻ thiếu ví dụ song ngữ 3–15 từ.` : ''}
        </p>
        <div class="vph-actions-row">
          ${enableLowRepsBtnHtml}
          <button type="button" class="vph-primary-btn" id="vph-switch-to-flashcard-from-reorder-btn">
            <span>🎴 Học Flashcard</span>
          </button>
          <button type="button" class="vph-secondary-btn" id="vph-switch-to-quiz-from-reorder-btn">
            <span>🎯 Luyện Trắc nghiệm</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('vph-enable-reorder-low-reps-btn')?.addEventListener('click', () => {
      state.reorderIncludeLowReps = true;
      startSession();
    });
    document.getElementById('vph-switch-to-flashcard-from-reorder-btn')?.addEventListener('click', () => switchMode('flashcard'));
    document.getElementById('vph-switch-to-quiz-from-reorder-btn')?.addEventListener('click', () => switchMode('quiz'));
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
        <div class="vph-wrong-review-card">
          <div class="vph-wrong-review-title">
            Từ cần lưu ý ôn lại (${state.wrongList.length}):
          </div>
          <div class="vph-wrong-review-list">
            ${state.wrongList.map(w => `
              <div class="vph-wrong-review-row">
                <b class="vph-wrong-word">${escHtml(w.frenchWord)}</b>
                <span class="vph-wrong-meaning">${formatGrammarBadgeHtml(escHtml(w.vietnameseMeaning), { mask: false })}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    let modeName = 'Trắc nghiệm phản xạ';
    if (state.currentMode === 'cloze') modeName = 'Luyện Nghe & Điền từ';
    else if (state.currentMode === 'match') modeName = 'Ghép thẻ nhanh';
    else if (state.currentMode === 'flashcard') modeName = 'Flashcard 3D (SRS)';
    else if (state.currentMode === 'translate') modeName = 'Dịch Việt → Pháp';
    else if (state.currentMode === 'reorder') modeName = 'Sắp xếp câu';

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
  function openVocabPracticeHub(scope, level, initialMode) {
    const backdrop = ensureModalElement();
    state.isOpen = true;
    state.scope = scope || 'all';
    if (level) state.level = level;
    if (initialMode && MODE_METADATA[initialMode]) {
      state.currentMode = initialMode;
    }
    updateScopeOptions();
    backdrop.classList.add('open');
    applyFontScale(getFontScaleIndex());
    updateModeUi();
    closeSandwichMenu();

    startSession();
  }

  function closeVocabPracticeHub() {
    stopTimer();
    stopMatchTimer();
    closeSandwichMenu();
    state.isOpen = false;
    const backdrop = document.getElementById('vph-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  // Expose to window & CommonJS
  const exportedApi = {
    open: openVocabPracticeHub,
    close: closeVocabPracticeHub,
    switchMode: switchMode,
    toggleSandwichMenu: toggleSandwichMenu,
    openSandwichMenu: openSandwichMenu,
    closeSandwichMenu: closeSandwichMenu,
    updateModeUi: updateModeUi,
    MODE_METADATA: MODE_METADATA,
    maskGrammarTag: maskGrammarTag,
    formatGrammarBadgeHtml: formatGrammarBadgeHtml,
    extractGrammarTag: extractGrammarTag,
    buildTranslateSession: buildTranslateSession,
    computeWordDiff: computeWordDiff,
    renderWordDiffHtml: renderWordDiffHtml,
    translateSkillCompute: translateSkillCompute,
    updateItemTranslateSkill: updateItemTranslateSkill,
    getTranslateSkill: getTranslateSkill,
    formatWordBlanks: formatWordBlanks,
    generateSentenceHint: generateSentenceHint,
    countSentenceWords: countSentenceWords,
    tokenizeFrenchSentence: tokenizeFrenchSentence,
    getFontScaleIndex: getFontScaleIndex,
    setFontScaleIndex: setFontScaleIndex,
    applyFontScale: applyFontScale,
    FONT_SCALE_LEVELS: FONT_SCALE_LEVELS,
    FONT_SCALE_LABELS: FONT_SCALE_LABELS,
    TRANSLATE_SM2_CONFIG: TRANSLATE_SM2_CONFIG,
    TRANSLATE_SM2_CONSTANTS: TRANSLATE_SM2_CONSTANTS,
    advanceToNextTranslateQuestion: advanceToNextTranslateQuestion,
    handleTranslateKeydown: handleTranslateKeydown,
    handleTranslateSubmit: handleTranslateSubmit,
    handleTranslateHintAdvance: handleTranslateHintAdvance,
    handleTranslateRevealAnswer: handleTranslateRevealAnswer,
    REORDER_SM2_CONFIG: REORDER_SM2_CONFIG,
    buildSandwichMenuItemsHtml: buildSandwichMenuItemsHtml,
    reorderSkillCompute: reorderSkillCompute,
    getReorderSkill: getReorderSkill,
    updateItemReorderSkill: updateItemReorderSkill,
    tokenizeFrenchForReorder: tokenizeFrenchForReorder,
    buildReorderSession: buildReorderSession,
    renderReorderQuestion: renderReorderQuestion,
    renderReorderZones: renderReorderZones,
    handleReorderTokenSelect: handleReorderTokenSelect,
    handleReorderTokenDeselect: handleReorderTokenDeselect,
    handleReorderUndo: handleReorderUndo,
    handleReorderClear: handleReorderClear,
    handleReorderSubmit: handleReorderSubmit,
    advanceToNextReorderQuestion: advanceToNextReorderQuestion,
    handleReorderHintAdvance: handleReorderHintAdvance,
    handleReorderRevealAnswer: handleReorderRevealAnswer,
    handleReorderKeydown: handleReorderKeydown,
    _state: state,
    TRANSLATE_MIN_RECOGNITION_REPS: TRANSLATE_MIN_RECOGNITION_REPS,
    TRANSLATE_DEFAULT_INCLUDE_LOW_REPS: TRANSLATE_DEFAULT_INCLUDE_LOW_REPS
  };

  window.VocabPracticeHub = exportedApi;
  if (typeof module === 'object' && module.exports) {
    module.exports = exportedApi;
  }

  // Helper alias
  window.openVocabPracticeHub = openVocabPracticeHub;

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureModalElement);
  } else {
    ensureModalElement();
  }
})();
