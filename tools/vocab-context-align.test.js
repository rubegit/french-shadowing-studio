const test = require('node:test');
const assert = require('node:assert/strict');
const SchemaV02 = require('../js/schema-v02.js');

test('Vocab Context Alignment & Multi-occurrence Disambiguation', async (t) => {
  await t.test('normalizeForMatching handles spaces around apostrophes (d \x27 -> d\x27)', () => {
    const s1 = "Et puis, au Canada, le gouvernement veut soutenir la langue française avec un plan d \x27investissement de plusieurs milliards de dollars.";
    const cand = "un plan d’investissement de plusieurs milliards";

    const sClean = SchemaV02.normalizeForMatching(s1);
    const candClean = SchemaV02.normalizeForMatching(cand);

    assert.ok(sClean.includes(candClean), 'Clean sentence should include clean candidate context');
  });

  await t.test('alignSubtitleForContext disambiguates multiple occurrences using targetT', () => {
    const sents = [
      { id: 1, startTime: 138, endTime: 144, text: "L\x27automne a toujours eu quelque chose de particulier à mes yeux." },
      { id: 20, startTime: 518, endTime: 524, text: "L\x27automne a toujours eu quelque chose de particulier à mes yeux." }
    ];

    // When targetT is 518 (8:38 level B1)
    const resB1 = SchemaV02.alignSubtitleForContext(
      "L'automne a toujours eu quelque chose de particulier à mes yeux.",
      "a toujours eu",
      sents,
      null,
      518
    );
    assert.equal(resB1.matched, true);
    assert.equal(resB1.t, 518, 'Should pick 518s when targetT is around 518s');

    // When targetT is 138 (2:18 level A1)
    const resA1 = SchemaV02.alignSubtitleForContext(
      "L'automne a toujours eu quelque chose de particulier à mes yeux.",
      "a toujours eu",
      sents,
      null,
      138
    );
    assert.equal(resA1.matched, true);
    assert.equal(resA1.t, 138, 'Should pick 138s when targetT is around 138s');
  });

  await t.test('Context fallback search finds session when title and videoId do not match', () => {
    const hist = [
      {
        videoId: 'txt_427a1b8c',
        title: "Et puis, au Canada, le gouvernement veut soutenir...",
        isText: true,
        sentences: [
          { startTime: 0, text: "Et puis, au Canada, le gouvernement veut soutenir la langue française avec un plan d 'investissement de plusieurs milliards de dollars." }
        ]
      }
    ];

    const v = {
      text: "investissement",
      en: "un plan d’investissement de plusieurs milliards",
      videoId: "rfi_A1_Grammaire_devoir_pouvoir_vouloir",
      videoTitle: "Devoir, pouvoir, vouloir au présent de l’indicatif",
      t_known: false
    };

    const norm = (str) => String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s*[\u2018\u2019\u201B\u0060\u00B4ʻʼ']\s*/g, "'")
      .replace(/[.,;:\?!¿¡\(\)\[\]\{\}"«»“”]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const cleanEn = norm(v.en);
    let matchedH = null;
    for (const h of hist) {
      if (h.sentences && h.sentences.some(s => norm(s.text).includes(cleanEn))) {
        matchedH = h;
        v.videoId = h.videoId;
        v.videoTitle = h.title;
        break;
      }
    }

    assert.ok(matchedH, 'Should match article in history via context sentence');
    assert.equal(v.videoId, 'txt_427a1b8c');
  });

  await t.test('Fallback word matching respects French word boundaries (va does not match cravate)', () => {
    const norm = (str) => String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s*[\u2018\u2019\u201B\u0060\u00B4ʻʼ']\s*/g, "'")
      .replace(/[.,;:\?!¿¡\(\)\[\]\{\}"«»“”]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const cleanWord = norm('va');
    const escWord = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const reWordBound = new RegExp('(^|[^\\p{L}\x27\u2019])' + escWord + '(?=$|[^\\p{L}\x27\u2019])', 'u');

    // Should NOT match inside substrings
    assert.equal(reWordBound.test(norm('Elle porte une belle cravate.')), false, 'va must not match inside cravate');
    assert.equal(reWordBound.test(norm('Le carnaval commence.')), false, 'va must not match inside carnaval');
    assert.equal(reWordBound.test(norm('Bon courage pour votre travail.')), false, 'va must not match inside travail');

    // Should MATCH standalone words
    assert.equal(reWordBound.test(norm('Comment ça va ?')), true, 'va must match in comment ca va');
    assert.equal(reWordBound.test(norm('Il va au marché ce matin.')), true, 'va must match in il va au marche');
  });

  await t.test('tryAlignSingleVocabItem recalculates hs/he on new sentence and clears stale coordinates', () => {
    // Read and evaluate js/01g-vocab-list.js in mock environment
    const fs = require('node:fs');
    const path = require('node:path');
    const code = fs.readFileSync(path.join(__dirname, '../js/01g-vocab-list.js'), 'utf8');

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

    // Mock environment
    const mockGlobal = {
      window: {
        addEventListener: () => {},
        removeEventListener: () => {}
      },
      document: {
        getElementById: () => createDummyEl(),
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener: () => {},
        documentElement: { dataset: {} }
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      localStorage: { getItem: () => null, setItem: () => {} },
      escapeHtml: (s) => String(s || ''),
      escHtml: (s) => String(s || ''),
      formatTime: () => '0:00'
    };
    Object.assign(mockGlobal.window, mockGlobal);
    mockGlobal.window.SchemaV02 = SchemaV02;

    const fn = new Function('global', 'window', 'document', 'localStorage', 'escapeHtml', 'escHtml', 'formatTime',
      code + '\nreturn { tryAlignSingleVocabItem, findWordSpanInString };'
    );
    const { tryAlignSingleVocabItem } = fn(
      mockGlobal, mockGlobal.window, mockGlobal.document, mockGlobal.localStorage,
      mockGlobal.escapeHtml, mockGlobal.escHtml, mockGlobal.formatTime
    );

    // Case 1: Item has old coordinates from previous sentence (hs: 35, he: 42)
    // Aligning to a new sentence containing the word ("Il va au marché", va)
    let currentMockSents = [
      { startTime: 12.5, text: "Il va au marché ce matin." }
    ];
    global.getLocalHistory = () => [
      { videoId: 'test_vid', sentences: currentMockSents }
    ];

    const v1 = {
      text: "va",
      en: "Il va au marché",
      videoId: "test_vid",
      hs: 35,
      he: 42,
      t: 0,
      t_known: false
    };

    const res1 = tryAlignSingleVocabItem(v1);
    assert.equal(res1, true, 'Should successfully align');
    assert.equal(v1.t, 12.5, 'Timestamp should be 12.5s');
    assert.equal(v1.hs, 3, 'hs should be recalculated to 3 (position of "va" in "Il va...")');
    assert.equal(v1.he, 5, 'he should be recalculated to 5');

    // Case 2: Aligning to sentence where text is not directly found (fallback via en only)
    currentMockSents = [
      { startTime: 40.0, text: "Nous nous promenons souvent ensemble." }
    ];

    const v2 = {
      text: "balader", // text is not present in "Nous nous promenons..."
      en: "Nous nous promenons souvent ensemble.", // matches via cleanEn
      videoId: "test_vid",
      hs: 99,
      he: 105,
      t: 0,
      t_known: false
    };

    const res2 = tryAlignSingleVocabItem(v2);
    assert.equal(res2, true, 'Should align via context sentence match');
    assert.equal(v2.t, 40.0, 'Timestamp updated');
    assert.equal(v2.hs, 0, 'Old hs: 99 must be cleared to 0');
    assert.equal(v2.he, 0, 'Old he: 105 must be cleared to 0');
  });
});
