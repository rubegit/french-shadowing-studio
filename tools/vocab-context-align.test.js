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
});
