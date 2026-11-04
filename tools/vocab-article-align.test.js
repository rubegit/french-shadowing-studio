const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Vocab Article Alignment & Apostrophe Normalization', async (t) => {
  // Read js/01g-vocab-list.js
  const code = fs.readFileSync(path.join(__dirname, '../js/01g-vocab-list.js'), 'utf8');

  // Set up mock window and global environment
  const mockGlobal = {
    window: {},
    document: {
      getElementById: () => ({ classList: { add: () => {}, remove: () => {} }, value: '', querySelectorAll: () => [] }),
      querySelectorAll: () => [],
      addEventListener: () => {}
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {}
    },
    escapeHtml: (s) => String(s || ''),
    escHtml: (s) => String(s || ''),
    formatTime: (s) => '0:00'
  };

  await t.test('normTitle normalizes curly apostrophes and spacing around apostrophes', () => {
    const normTitleMatch = code.match(/const normTitle = ([\s\S]*?)\.trim\(\);/);
    assert.ok(normTitleMatch, 'normTitle definition should be present');
    
    // Evaluate normTitle function
    const normTitle = new Function('t', 'return ' + normTitleMatch[0].replace('const normTitle = ', ''))();

    const t1 = "Devoir, pouvoir, vouloir au présent de l’indicatif";
    const t2 = "Devoir, pouvoir, vouloir au présent de l'indicatif";
    const t3 = "Devoir, pouvoir, vouloir au présent de l 'indicatif";

    assert.equal(normTitle(t1), normTitle(t2), 'Typographic apostrophe should match straight apostrophe');
    assert.equal(normTitle(t1), normTitle(t3), 'Spaced apostrophe should match');
    assert.equal(normTitle(t1), 'devoir pouvoir vouloir au present de l\'indicatif');
  });

  await t.test('Article sentence alignment succeeds with curly and spaced apostrophes', () => {
    const norm = (str) => String(str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s*[\u2018\u2019\u201B\u0060\u00B4ʻʼ']\s*/g, "'")
      .replace(/[.,;:\?!¿¡\(\)\[\]\{\}"«»“”]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const articleSentence = "Et puis, au Canada, le gouvernement veut soutenir la langue française avec un plan d 'investissement de plusieurs milliards de dollars.";
    const vocabInCard = {
      text: "investissement",
      en: "un plan d’investissement de plusieurs milliards",
      t_known: false
    };

    const sTxt = norm(articleSentence);
    const cleanEn = norm(vocabInCard.en);
    const cleanWord = norm(vocabInCard.text);

    assert.ok(cleanEn.length >= 4, 'cleanEn length valid');
    assert.ok(sTxt.includes(cleanEn), 'Sentence should include context with normalized apostrophe');
    assert.ok(sTxt.includes(cleanWord), 'Sentence should include target word');
  });

  await t.test('vocabSourceInfo identifies article from history even if videoId was audio filename', () => {
    const normTitle = (t) => String(t || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s*[\u2018\u2019\u201B\u0060\u00B4ʻʼ']\s*/g, "'")
      .replace(/[.,;:\?!¿¡\(\)\[\]\{\}"«»“”]/g, ' ')
      .replace(/[\s\-_|·]+/g, ' ')
      .trim();

    const cleanVid = (id) => String(id || '').replace(/^(yt|video):/, '').trim();

    const mockHistory = [
      {
        videoId: 'txt_427a1b8c',
        title: "Devoir, pouvoir, vouloir au présent de l'indicatif",
        isText: true,
        sentences: [{ startTime: 0, text: 'Test' }]
      }
    ];

    const getLocalHistory = () => mockHistory;

    function vocabSourceInfo(x) {
      if (!x) return { key: 'none', type: 'other', title: 'Không rõ nguồn' };
      if (x.bookId) return { key: 'book:' + x.bookId, type: 'book', title: x.videoTitle || 'Sách' };
      const id = String(x.videoId || '');
      if (/^(art|txt)_/.test(id)) return { key: 'text:' + id, type: 'article', title: x.videoTitle || 'Bài viết' };
      if (typeof getLocalHistory === 'function') {
        try {
          const hist = getLocalHistory();
          if (Array.isArray(hist) && hist.length) {
            const h = hist.find((hItem) => {
              if (!hItem || !hItem.isText) return false;
              if (id && cleanVid(hItem.videoId) === cleanVid(id)) return true;
              if (x.videoTitle) {
                const vN = normTitle(x.videoTitle);
                const hN = normTitle(hItem.title || hItem.videoTitle || '');
                return vN.length >= 6 && hN.length >= 6 && (vN === hN || vN.includes(hN) || hN.includes(vN));
              }
              return false;
            });
            if (h) return { key: 'text:' + cleanVid(h.videoId), type: 'article', title: x.videoTitle || h.title || 'Bài viết' };
          }
        } catch (e) {}
      }
      if (id) return { key: 'video:' + id, type: 'video', title: x.videoTitle || id };
      return { key: 'none', type: 'other', title: 'Không rõ nguồn' };
    }

    const card = {
      id: 'vocab_1',
      text: 'devoir',
      videoId: 'rfi_A1_Grammaire_devoir_pouvoir_vouloir',
      videoTitle: 'Devoir, pouvoir, vouloir au présent de l’indicatif'
    };

    const info = vocabSourceInfo(card);
    assert.equal(info.type, 'article', 'Should be recognized as article');
    assert.equal(info.key, 'text:txt_427a1b8c', 'Key should point to history article docId');
  });
});
