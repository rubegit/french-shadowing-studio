/**
 * French Shadowing Studio - Schema 0.2 Core Module (Pure Logic)
 * Không phụ thuộc thư viện ngoài (zero external dependencies).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SchemaV02 = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * Chuẩn hóa từ vựng tiếng Pháp cơ bản fr_basic:
   * 1. Ép chặt về Unicode NFC ngay từ đầu để đồng nhất dạng rời (NFD: e + U+0301) và dạng ghép (NFC: é)
   * 2. Chuyển chữ thường, cắt khoảng trắng đầu/cuối và thu gọn khoảng trắng liên tiếp
   * 3. Thay thế nháy cong ’ -> nháy thẳng '
   * 4. Thay thế ký tự ghép (ligatures): œ -> oe, Œ -> oe, æ -> ae, Æ -> ae
   * 5. Giữ nguyên dấu tiếng Pháp (é, è, ê, ë, à, â, î, ï, ô, û, ù, ç) để phân biệt từ vựng khác nghĩa (ou/où, a/à, du/dû, sur/sûr)
   * 6. TUYỆT ĐỐI KHÔNG bỏ tiền tố phản xạ (s', se) để phân biệt động từ nguyên mẫu và phản xạ (améliorer vs s'améliorer)
   * 7. Loại bỏ dấu câu viền (dấu chấm, phẩy, chấm hỏi, ngoặc ở 2 đầu)
   * 8. Đảm bảo chuỗi kết quả trả về là Unicode NFC
   */
  function fr_basic(str) {
    if (!str || typeof str !== 'string') return '';
    var s = str.normalize('NFC').trim().toLowerCase();
    // Thay nháy cong
    s = s.replace(/[\u2018\u2019\u201B\u0060\u00B4]/g, "'");
    // Thay ligatures
    s = s.replace(/œ/g, 'oe').replace(/æ/g, 'ae');
    // Thu gọn khoảng trắng
    s = s.replace(/\s+/g, ' ');
    // Bỏ dấu câu ở 2 đầu (giữ dấu nháy đơn bên trong như s'il, l'eau, d'un)
    s = s.replace(/^[\s\.,;:!\?¿¡\(\)\[\]\{\}"«»“”]+|[\s\.,;:!\?¿¡\(\)\[\]\{\}"«»“”]+$/g, '');
    return s.normalize('NFC');
  }

  /**
   * Khóa chuẩn hóa so sánh norm_key:
   * Quy chuẩn hóa bằng fr_basic
   */
  function norm_key(str) {
    return fr_basic(str);
  }

  /**
   * Tạo chuỗi slug URL/ID-safe bất biến từ chuỗi văn bản:
   * Giữ nguyên chữ cái tiếng Pháp (bao gồm é, è, ê, ë, à, â, î, ï, ô, û, ù, ç)
   * Thay khoảng trắng, nháy và ký tự đặc biệt thành gạch nối.
   * Đảm bảo tính xác định (deterministic) 100%, không phụ thuộc thứ tự nạp dữ liệu.
   */
  function slug(str) {
    if (!str || typeof str !== 'string') return '';
    var s = norm_key(str).normalize('NFC');
    // Thay nháy và ký tự không phải chữ cái/số thành gạch nối, giữ nguyên ký tự tiếng Pháp
    s = s.replace(/[^a-z0-9àâäéèêëîïôöùûüç]+/g, '-');
    // Bỏ gạch nối thừa ở đầu/cuối
    s = s.replace(/^-+|-+$/g, '');
    return s.normalize('NFC') || 'item';
  }

  /**
   * Ánh xạ tag hiện tại sang type chuẩn trong Schema 0.2:
   * Từ -> word, Cụm từ -> chunk, Collocation -> collocation, Slang -> slang, Idiom -> idiom
   */
  var TAG_TO_TYPE_MAP = {
    'từ': 'word',
    'word': 'word',
    'cụm từ': 'chunk',
    'chunk': 'chunk',
    'collocation': 'collocation',
    'slang': 'slang',
    'idiom': 'idiom'
  };

  function mapTagToType(tag) {
    if (!tag || typeof tag !== 'string') return null;
    var clean = tag.trim().toLowerCase();
    return TAG_TO_TYPE_MAP[clean] || null;
  }

  /**
   * Ánh xạ type chuẩn sang tag tiếng Việt:
   * word -> Từ, chunk -> Cụm từ, collocation -> Collocation, slang -> Slang, idiom -> Idiom
   */
  var TYPE_TO_TAG_MAP = {
    'word': 'Từ',
    'chunk': 'Cụm từ',
    'collocation': 'Collocation',
    'slang': 'Slang',
    'idiom': 'Idiom'
  };

  function mapTypeToTag(type) {
    if (!type || typeof type !== 'string') return 'Cụm từ';
    var clean = type.trim().toLowerCase();
    return TYPE_TO_TAG_MAP[clean] || 'Cụm từ';
  }

  /**
   * Chuẩn hóa source_id: luôn có tiền tố 'yt:'
   */
  function canonicalSourceId(id) {
    if (!id || typeof id !== 'string') return '';
    var clean = id.trim();
    if (!clean) return '';
    return clean.startsWith('yt:') ? clean : ('yt:' + clean);
  }

  /**
   * Trích xuất videoId thô (bỏ tiền tố 'yt:' nếu có)
   */
  function rawVideoId(id) {
    if (!id || typeof id !== 'string') return '';
    var clean = id.trim();
    if (!clean) return '';
    return clean.startsWith('yt:') ? clean.substring(3) : clean;
  }

  /**
   * Tìm vị trí bôi vàng hs / he trong câu ngữ cảnh:
   * 1. Tìm nguyên văn fr (không phân biệt hoa thường)
   * 2. Tìm sau khi bỏ mạo từ / giới từ đứng đầu (l', le, la, les, un, une, des, du, de la, de l', d', à, au, aux)
   * 3. Tìm dạng chia động từ nếu có verbData / verbData.conjugation
   * 4. Không tìm thấy -> hs = 0, he = 0 (tuyệt đối không bao giờ gán cả câu)
   */
  function findHighlightSpan(sourceText, fr, verbData) {
    if (!sourceText || !fr || typeof sourceText !== 'string' || typeof fr !== 'string') {
      return { hs: 0, he: 0 };
    }
    var sNorm = sourceText.normalize('NFC');
    var sLower = sNorm.toLowerCase();
    var frNorm = fr.normalize('NFC').trim();

    function searchExact(target) {
      if (!target) return -1;
      var tLower = target.normalize('NFC').toLowerCase().trim();
      if (!tLower) return -1;
      return sLower.indexOf(tLower);
    }

    // 1. Tìm nguyên văn fr
    var idx = searchExact(frNorm);
    if (idx !== -1) {
      return { hs: idx, he: idx + frNorm.length };
    }

    // 2. Tìm sau khi bỏ mạo từ / giới từ đứng đầu
    var stripped = frNorm.replace(/^(l'|d'|de\s+l'|de\s+la\s+|du\s+|le\s+|la\s+|les\s+|un\s+|une\s+|des\s+|à\s+|au\s+|aux\s+)/i, '').trim();
    if (stripped && stripped !== frNorm) {
      idx = searchExact(stripped);
      if (idx !== -1) {
        return { hs: idx, he: idx + stripped.length };
      }
    }

    // 3. Nếu có dữ liệu chia động từ
    if (verbData) {
      var conjTable = verbData.conjugation || verbData;
      if (typeof conjTable === 'object' && conjTable !== null) {
        for (var key in conjTable) {
          if (!Object.prototype.hasOwnProperty.call(conjTable, key)) continue;
          var form = conjTable[key];
          if (typeof form === 'string' && form.trim()) {
            var cleanForm = form.trim();
            idx = searchExact(cleanForm);
            if (idx !== -1) {
              return { hs: idx, he: idx + cleanForm.length };
            }
          }
        }
      }
    }

    // 4. Không tìm thấy -> 0, 0
    return { hs: 0, he: 0 };
  }

  /**
   * Chuẩn hóa phục vụ so khớp phụ đề:
   * NFC, chữ thường, nháy cong -> nháy thẳng, bỏ nhãn âm thanh [...], gộp khoảng trắng, bỏ dấu câu
   */
  var RE_SOUND_TAG = /\[[^\]\n]{1,30}\]/g;

  function normalizeForMatching(str) {
    if (!str || typeof str !== 'string') return '';
    return str.normalize('NFC')
      .replace(RE_SOUND_TAG, ' ')
      .replace(/\s*[\u2018\u2019\u201B\u0060\u00B4ʻʼ']\s*/g, "'")
      .toLowerCase()
      .replace(/[.,;:\?!¿¡\(\)\[\]\{\}"«»“”]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tìm vị trí bôi vàng hs / he trong câu gốc, cho phép có nhãn âm thanh xen giữa từ vựng:
   * Ví dụ: "et maintenant passons à la vidéo c'est [Musique] parti" khớp với "c'est parti"
   */
  function findHighlightSpanWithSoundTags(sentenceText, frText, verbData) {
    if (!sentenceText || !frText) return { hs: 0, he: 0 };
    var sNorm = sentenceText.normalize('NFC');
    var frNorm = frText.normalize('NFC').trim();
    if (!frNorm) return { hs: 0, he: 0 };

    var escRe = function (t) {
      return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/[\x27\u2019]/g, "[\x27\u2019]");
    };
    var words = frNorm.split(/\s+/).filter(Boolean).map(escRe);
    if (words.length > 0) {
      var reStr = words.join('(?:\\s*\\[[^\\]\\n]{1,30}\\]\\s*|\\s+)');
      var re = new RegExp('(^|[^\\p{L}])(' + reStr + ')(?=$|[^\\p{L}])', 'iu');
      var m = re.exec(sNorm);
      if (m) {
        var hs = m.index + m[1].length;
        var he = hs + m[2].length;
        return { hs: hs, he: he };
      }
    }
    return findHighlightSpan(sentenceText, frText, verbData);
  }

  /**
   * Căn mốc thời gian và ngữ cảnh với mảng phụ đề sentences[]:
   * - candText: chuỗi câu "Trong bài" (2A)
   * - frText: từ/cụm từ cần tìm
   * - sentences: mảng câu phụ đề [{ text, vi, startTime, endTime }, ...]
   */
  function alignSubtitleForContext(candText, frText, sentences, verbData, targetT) {
    if (!Array.isArray(sentences) || !sentences.length) {
      return {
        matched: false,
        status: 'NO_SUBTITLES',
        t: 0,
        t_known: false,
        en: candText || frText || '',
        vi: '',
        hs: 0,
        he: 0,
        prev: ''
      };
    }

    var cleanCand = normalizeForMatching(candText);
    var cleanFr = normalizeForMatching(frText);

    // 1. Ưu tiên khớp nguyên văn sau chuẩn hóa với "Trong bài" (candText)
    var candMatches = [];
    if (cleanCand && cleanCand.length >= 3) {
      for (var i = 0; i < sentences.length; i++) {
        var sClean = normalizeForMatching(sentences[i].text);
        if (sClean && (sClean.includes(cleanCand) || cleanCand.includes(sClean))) {
          candMatches.push({ index: i, sentence: sentences[i] });
        }
      }
    }

    if (candMatches.length === 1 || (candMatches.length > 1 && typeof targetT === 'number' && targetT > 0)) {
      var bestIdx = 0;
      if (candMatches.length > 1) {
        var minDiff = Infinity;
        for (var k = 0; k < candMatches.length; k++) {
          var diff = Math.abs((candMatches[k].sentence.startTime || 0) - targetT);
          if (diff < minDiff) {
            minDiff = diff;
            bestIdx = k;
          }
        }
      }
      var sObj = candMatches[bestIdx].sentence;
      var sIdx = candMatches[bestIdx].index;
      var span = findHighlightSpanWithSoundTags(sObj.text, frText, verbData);
      var prevText = (sIdx > 0 && sentences[sIdx - 1]) ? String(sentences[sIdx - 1].text || '').trim() : '';
      var matchedT = typeof sObj.startTime === 'number' ? sObj.startTime : 0;
      if (Array.isArray(sObj.words) && sObj.words.length > 0 && span.hs > 0) {
        var charAcc = 0;
        for (var w = 0; w < sObj.words.length; w++) {
          var wTxt = sObj.words[w].word || '';
          var wStart = charAcc;
          var wEnd = charAcc + wTxt.length;
          if (span.hs >= wStart && span.hs <= wEnd && typeof sObj.words[w].startTime === 'number') {
            matchedT = sObj.words[w].startTime;
            break;
          }
          charAcc = wEnd + 1;
        }
      }
      return {
        matched: true,
        status: 'EXACT',
        t: matchedT,
        t_known: true,
        en: String(sObj.text || '').trim(),
        vi: String(sObj.vi || '').trim(),
        hs: span.hs,
        he: span.he,
        prev: prevText
      };
    }

    if (candMatches.length > 1) {
      // Nhiều câu cùng khớp: KHÔNG tự lấy câu đầu nếu không có targetT
      return {
        matched: false,
        status: 'MULTIPLE',
        match_count: candMatches.length,
        t: null,
        t_known: false,
        en: candText || frText || '',
        vi: '',
        hs: 0,
        he: 0,
        prev: ''
      };
    }

    // 2. Fallback: Khớp theo từ/cụm (frText) - chỉ chấp nhận khi duy nhất 1 câu khớp
    var frMatches = [];
    if (cleanFr && cleanFr.length >= 2) {
      var escWord = cleanFr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var wordRe = new RegExp('(^|\\s)' + escWord + '(?=\\s|$)', 'i');
      for (var j = 0; j < sentences.length; j++) {
        var sjClean = normalizeForMatching(sentences[j].text);
        if (wordRe.test(sjClean)) {
          frMatches.push({ index: j, sentence: sentences[j] });
        }
      }
    }

    if (frMatches.length === 1) {
      var sfObj = frMatches[0].sentence;
      var sfIdx = frMatches[0].index;
      var spanF = findHighlightSpanWithSoundTags(sfObj.text, frText, verbData);
      var prevTextF = (sfIdx > 0 && sentences[sfIdx - 1]) ? String(sentences[sfIdx - 1].text || '').trim() : '';
      var matchedTf = typeof sfObj.startTime === 'number' ? sfObj.startTime : 0;
      if (Array.isArray(sfObj.words) && sfObj.words.length > 0 && spanF.hs > 0) {
        var charAccF = 0;
        for (var wf = 0; wf < sfObj.words.length; wf++) {
          var wfTxt = sfObj.words[wf].word || '';
          var wfStart = charAccF;
          var wfEnd = charAccF + wfTxt.length;
          if (spanF.hs >= wfStart && spanF.hs <= wfEnd && typeof sfObj.words[wf].startTime === 'number') {
            matchedTf = sfObj.words[wf].startTime;
            break;
          }
          charAccF = wfEnd + 1;
        }
      }
      return {
        matched: true,
        status: 'FUZZY',
        t: matchedTf,
        t_known: true,
        en: String(sfObj.text || '').trim(),
        vi: String(sfObj.vi || '').trim(),
        hs: spanF.hs,
        he: spanF.he,
        prev: prevTextF
      };
    }

    if (frMatches.length > 1) {
      return {
        matched: false,
        status: 'MULTIPLE',
        match_count: frMatches.length,
        t: null,
        t_known: false,
        en: candText || frText || '',
        vi: '',
        hs: 0,
        he: 0,
        prev: ''
      };
    }

    // 3. Không tìm thấy câu nào khớp
    var defaultSpan = findHighlightSpan(candText || frText, frText, verbData);
    return {
      matched: false,
      status: 'NOT_FOUND',
      t: 0,
      t_known: false,
      en: candText || frText || '',
      vi: '',
      hs: defaultSpan.hs,
      he: defaultSpan.he,
      prev: ''
    };
  }

  /**
   * Sinh item_id theo cấu trúc: type + ":" + slug(norm_key)
   * Có hỗ trợ hậu tố phân biệt khi xảy ra va chạm slug (ví dụ "ou" và "où" cùng slug -> "word:ou" và "word:ou#2")
   */
  function generateItemId(type, normKey, disambiguateIndex) {
    var safeType = (type || 'chunk').toLowerCase().trim();
    var safeSlug = slug(normKey);
    var base = safeType + ':' + safeSlug;
    if (typeof disambiguateIndex === 'number' && disambiguateIndex > 1) {
      return base + '#' + disambiguateIndex;
    }
    return base;
  }

  /**
   * Kiểm tra cặp nghi trùng (Suspicious duplicate / fuzzy match):
   * Ví dụ: "améliorer" và "s'améliorer" khác nhau về norm_key nhưng chung gốc từ
   */
  function areSuspiciousDuplicates(itemA, itemB) {
    var kA = norm_key(itemA.fr || itemA.text || '');
    var kB = norm_key(itemB.fr || itemB.text || '');
    if (!kA || !kB || kA === kB) return false;

    // So sánh sau khi bỏ tiền tố phản xạ s' hoặc se
    var stripReflexive = function (s) {
      return s.replace(/^(s'|se\s+)/, '').trim();
    };
    var baseA = stripReflexive(kA);
    var baseB = stripReflexive(kB);
    if (baseA === baseB) return true;

    // So sánh cụm từ khác nhau ở phần lược âm cuối (de vs d', à vs au, etc.)
    var stripTrailingElision = function (s) {
      return s.replace(/\s+(de|d'|du|des|à|au|aux)$/i, '').trim();
    };
    var trailA = stripTrailingElision(kA);
    var trailB = stripTrailingElision(kB);
    if (trailA && trailB && trailA === trailB) return true;

    // So sánh không dấu nếu khác dấu hoàn toàn
    var unaccentA = kA.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    var unaccentB = kB.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (unaccentA === unaccentB && kA !== kB) return true;

    return false;
  }

  /**
   * Phân loại mục nhập đối chiếu với kho từ vựng hiện có:
   * - 'TYPE_COLLISION': Trùng norm_key nhưng khác type
   * - 'EXISTS' ('ĐÃ CÓ'): Trùng norm_key và cùng type với một mục active trong kho
   * - 'SUSPICIOUS' ('NGHI TRÙNG'): Khác norm_key nhưng nghi ngờ trùng (chung gốc từ/khác tiền tố phản xạ s' hoặc khác dấu phụ)
   * - 'NEW' ('MỤC MỚI'): Không trùng và không nghi trùng
   */
  function classifyImportItem(importItem, existingVocabList) {
    if (!importItem) return null;
    var rawFr = (importItem.fr || importItem.text || '').normalize('NFC');
    var nKey = norm_key(rawFr);
    if (!nKey) return null;

    var rawInTag = importItem.tag || importItem.raw_tag || importItem.raw_type;
    var hasIncomingType = !!(importItem.type || rawInTag);
    var incomingType = importItem.type || mapTagToType(rawInTag) || 'chunk';

    var activeMap = new Map();
    if (Array.isArray(existingVocabList)) {
      existingVocabList.forEach(function (x) {
        if (!x || x._deleted) return;
        var k = norm_key(x.fr || x.text || '');
        if (k && !activeMap.has(k)) activeMap.set(k, x);
      });
    } else if (existingVocabList instanceof Map) {
      activeMap = existingVocabList;
    }

    if (activeMap.has(nKey)) {
      var matched = activeMap.get(nKey);
      var rawExTag = matched.tag || matched.raw_tag || matched.raw_type;
      var hasExType = !!(matched.type || rawExTag);
      var exType = matched.type || mapTagToType(rawExTag) || 'chunk';

      if (hasIncomingType && hasExType && incomingType !== exType) {
        return {
          status: 'TYPE_COLLISION',
          label: 'XUNG ĐỘT LOẠI',
          matchedItem: matched,
          incomingType: incomingType,
          existingType: exType
        };
      }
      return { status: 'EXISTS', label: 'ĐÃ CÓ', matchedItem: matched };
    }

    for (var entry of activeMap.entries()) {
      var exItem = entry[1];
      if (areSuspiciousDuplicates({ fr: rawFr }, { fr: exItem.fr || exItem.text })) {
        return { status: 'SUSPICIOUS', label: 'NGHI TRÙNG', matchedItem: exItem };
      }
    }

    return { status: 'NEW', label: 'MỤC MỚI', matchedItem: null };
  }

  /**
   * Suy ra danh sách nguồn từ kho từ vựng và các contexts:
   * Gom nhóm theo source_id chuẩn hóa, đếm số mục (item_count) và số lần xuất hiện (occurrence_count).
   */
  function getDerivedSources(vocabList) {
    if (!Array.isArray(vocabList)) return [];
    var srcMap = new Map();

    vocabList.forEach(function (it) {
      if (!it || it._deleted) return;

      var pSrc = it.source_id || (it.videoId ? canonicalSourceId(it.videoId) : '');
      if (pSrc) {
        pSrc = canonicalSourceId(pSrc);
        if (!srcMap.has(pSrc)) {
          srcMap.set(pSrc, {
            source_id: pSrc,
            videoId: rawVideoId(pSrc),
            title: it.videoTitle || it.sourceTitle || '',
            item_count: 0,
            occurrence_count: 0,
            added: it.createdAt || Date.now()
          });
        }
        var entry = srcMap.get(pSrc);
        entry.item_count++;
        entry.occurrence_count++;
        if (it.videoTitle && !entry.title) entry.title = it.videoTitle;
        if (it.createdAt && it.createdAt < entry.added) entry.added = it.createdAt;
      }

      if (Array.isArray(it.contexts)) {
        it.contexts.forEach(function (ctx) {
          var cSrc = ctx.source_id || (ctx.videoId ? canonicalSourceId(ctx.videoId) : '');
          if (cSrc) {
            cSrc = canonicalSourceId(cSrc);
            if (!srcMap.has(cSrc)) {
              srcMap.set(cSrc, {
                source_id: cSrc,
                videoId: rawVideoId(cSrc),
                title: ctx.videoTitle || '',
                item_count: 0,
                occurrence_count: 0,
                added: it.createdAt || Date.now()
              });
            }
            var cEntry = srcMap.get(cSrc);
            cEntry.occurrence_count++;
            if (ctx.videoTitle && !cEntry.title) cEntry.title = ctx.videoTitle;
          }
        });
      }
    });

    var result = Array.from(srcMap.values());
    result.sort(function (a, b) { return a.added - b.added; });
    return result;
  }

  /**
   * Xây dựng đối tượng từ vựng phẳng chuẩn Schema 0.2 (tương thích 100% trường cũ):
   */
  function buildFlatVocabItem(it, source, options) {
    options = options || {};
    var frText = (it.fr || it.text || '').normalize('NFC').trim();
    var nKey = it.norm_key || norm_key(frText);
    var itemType = it.type || mapTagToType(it.tag || it.raw_tag || it.raw_type) || 'chunk';
    var finalItemId = it.item_id || generateItemId(itemType, nKey);

    var srcId = canonicalSourceId(source && source.source_id ? source.source_id : (it.source_id || it.videoId || ''));
    var rawVid = rawVideoId(srcId);
    var srcTitle = (source && source.title) ? source.title : (it.videoTitle || it.sourceTitle || '');

    var pCtx = it.primaryContext || {};
    var enSentence = (pCtx.source_text || pCtx.en || it.source_text || it.en || '').trim();
    var viSentence = (pCtx.translation || pCtx.vi || it.translation || it.vi || '').trim();

    var span = { hs: 0, he: 0 };
    if (typeof pCtx.hs === 'number' && typeof pCtx.he === 'number' && pCtx.he > pCtx.hs) {
      span = { hs: pCtx.hs, he: pCtx.he };
    } else if (typeof it.hs === 'number' && typeof it.he === 'number' && it.he > it.hs) {
      span = { hs: it.hs, he: it.he };
    } else if (enSentence) {
      span = findHighlightSpan(enSentence, frText, it.verb);
    }

    var tVal = null;
    if (typeof pCtx.t === 'number') {
      tVal = pCtx.t;
    } else if (typeof it.t === 'number') {
      tVal = it.t;
    } else if (pCtx.t === null || it.t === null) {
      tVal = null;
    } else {
      tVal = 0;
    }

    var tKnown = false;
    if (typeof pCtx.t_known === 'boolean') {
      tKnown = pCtx.t_known;
    } else if (typeof it.t_known === 'boolean') {
      tKnown = it.t_known;
    } else {
      tKnown = (typeof tVal === 'number' && tVal > 0);
    }

    var kindVal = it.kind;
    if (!kindVal) {
      var wordCount = frText.split(/\s+/).filter(Boolean).length;
      if (wordCount > 4) kindVal = 'sentence';
      else if (wordCount > 1) kindVal = 'phrase';
      else kindVal = 'word';
    }

    var flatItem = {
      // 1. Các trường cũ bắt buộc giữ nguyên tên và kiểu dữ liệu
      id: it.id || finalItemId,
      text: frText,
      wordVi: (it.meaning_vi || it.wordVi || it.vi || '').trim(),
      tag: mapTypeToTag(itemType),
      level: it.level || 'A2',
      kind: kindVal,
      en: enSentence,
      vi: viSentence,
      hs: span.hs,
      he: span.he,
      t: tVal,
      videoId: rawVid,
      videoTitle: srcTitle,
      examples: Array.isArray(it.examples) ? it.examples : [],
      srs: it.srs || { ease: 2.5, interval: 0, reps: 0, due: Date.now(), lastReview: null },
      createdAt: it.createdAt || Date.now(),
      updatedAt: it.updatedAt || Date.now(),
      contexts: Array.isArray(it.contexts) ? it.contexts : [],

      // 2. Các trường Schema 0.2 mở rộng
      item_id: finalItemId,
      norm_key: nKey,
      type: itemType,
      pos: it.pos || null,
      schema_version: '0.2',
      source_id: srcId,
      t_known: tKnown,
      register: it.register || null,
      noun: it.noun || null,
      verb: it.verb || null,
      frame: it.frame || null,
      slot: it.slot || null,
      related: it.related || null,
      extra_accepted: it.extra_accepted || null,
      possible_dup_of: it.possible_dup_of || null,
      seq: (typeof it.seq === 'number') ? it.seq : (typeof pCtx.seq === 'number' ? pCtx.seq : null),
      scene: it.scene || pCtx.scene || null,
      source_corrected: it.source_corrected || pCtx.source_corrected || null,
      source_original: it.source_original || pCtx.source_original || null
    };

    return flatItem;
  }

  var CONTEXT_PREFIX_REGEX = /^(?:Trong bài|Trong văn bản|Dans bài|Dans le texte|Dans le transcript|Dans la vidéo|In the text|In the transcript|In text|Source|Context)\s*[:：]\s*/i;

  function stripContextPrefix(text) {
    if (!text || typeof text !== 'string') return '';
    return text.replace(CONTEXT_PREFIX_REGEX, '').trim();
  }

  function hasContextPrefix(text) {
    if (!text || typeof text !== 'string') return false;
    return CONTEXT_PREFIX_REGEX.test(text.trim());
  }

  /**
   * Bộ phân tích định dạng 2A (.txt)
   */
  function parseText2A(rawText, defaultSourceId) {
    var lines = (rawText || '').split(/\r?\n/);
    var result = {
      source: { source_id: defaultSourceId || '', title: '' },
      items: [],
      occurrences: [],
      errors: []
    };

    var i = 0;
    while (i < lines.length) {
      var line = lines[i].trim();
      var lineNum = i + 1;

      if (!line || line.startsWith('```') || line.startsWith('Điểm dừng:') || line.startsWith('Đã xuất xong') || line.startsWith('Hết phần')) {
        i++;
        continue;
      }

      if (line.startsWith('# SOURCE:')) {
        var headerContent = line.substring(9).trim();
        var hParts = headerContent.split('|').map(function (s) { return s.trim(); });
        if (hParts[0]) result.source.source_id = hParts[0];
        if (hParts[1]) result.source.title = hParts[1];
        i++;
        continue;
      }

      if (line.startsWith('#')) {
        i++;
        continue;
      }

      var matchOccDirect = line.match(/^OCC\s*:\s*([^|]+)(?:\|\|\s*(.*))?$/i);
      if (matchOccDirect) {
        var frOcc = matchOccDirect[1].trim();
        var rawSource = (matchOccDirect[2] || '').trim();
        var sourceText = stripContextPrefix(rawSource);
        if (!sourceText && i + 1 < lines.length && hasContextPrefix(lines[i + 1])) {
          sourceText = stripContextPrefix(lines[i + 1]);
          i += 2;
        } else {
          i++;
        }
        result.occurrences.push({
          seq: result.occurrences.length + 1,
          fr: frOcc,
          norm_key: norm_key(frOcc),
          source_text: sourceText,
          t: 0,
          t_known: false,
          line: lineNum
        });
        continue;
      }

      var matchSeq = line.match(/^(\d+)\.\s+(.*)$/);
      if (!matchSeq) {
        result.errors.push({ line: lineNum, text: line, message: 'Dòng không bắt đầu bằng số thứ tự hợp lệ ("<seq>.")' });
        i++;
        continue;
      }

      var seq = parseInt(matchSeq[1], 10);
      var rest = matchSeq[2].trim();

      if (rest.startsWith('OCC ||') || rest.startsWith('OCC||')) {
        var occParts = rest.split('||').map(function (s) { return s.trim(); });
        var frOcc = occParts[1] || '';
        var nextLine = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
        var sourceText = '';
        if (hasContextPrefix(nextLine)) {
          sourceText = stripContextPrefix(nextLine);
          i += 2;
        } else {
          sourceText = stripContextPrefix(nextLine);
          i += 2;
        }
        result.occurrences.push({
          seq: seq,
          fr: frOcc,
          norm_key: norm_key(frOcc),
          source_text: sourceText,
          t: 0,
          t_known: false,
          line: lineNum
        });
        continue;
      }

      var parts = rest.split('||').map(function (s) { return s.trim(); });
      if (parts.length < 4) {
        result.errors.push({ line: lineNum, text: line, message: 'Dòng 1 thiếu trường (cần tối thiểu 4 trường cách nhau bởi " || ")' });
        i++;
        continue;
      }

      var fr = parts[0];
      var rawType = parts[1];
      var level = parts[2];
      var rawMeaning = parts[3];
      var possibleDup = parts[4] ? parts[4].replace(/^≈\s*/, '').trim() : null;

      var pos = '';
      var meaningVi = rawMeaning;
      var tagMatch = rawMeaning.match(/^\[(.*?)\]\s*(.*)$/);
      if (tagMatch) {
        pos = tagMatch[1].trim();
        meaningVi = tagMatch[2].trim();
      }

      var line2 = (i + 1 < lines.length) ? lines[i + 1].trim() : '';
      var sourceTextItem = stripContextPrefix(line2);

      var examples = [];
      var cursor = i + 2;
      while (cursor < lines.length && examples.length < 3) {
        var cLine = lines[cursor].trim();
        if (!cLine || cLine.match(/^\d+\.\s+/)) {
          break;
        }
        var exMatch = cLine.match(/^VD\d*:\s*(.*)$/i);
        var exContent = exMatch ? exMatch[1].trim() : cLine;
        var exParts = exContent.split('||').map(function (s) { return s.trim(); });
        if (exParts[0]) {
          examples.push({ fr: exParts[0], vi: exParts[1] || '' });
        }
        cursor++;
      }

      var mappedType = mapTagToType(rawType) || 'chunk';
      var nKey = norm_key(fr);
      var itemId = generateItemId(mappedType, nKey);

      result.items.push({
        seq: seq,
        item_id: itemId,
        norm_key: nKey,
        fr: fr,
        type: mappedType,
        raw_type: rawType,
        level: level,
        pos: pos,
        meaning_vi: meaningVi,
        possible_dup_of: possibleDup,
        source_text: sourceTextItem,
        t: 0,
        t_known: false,
        examples: examples,
        line: lineNum
      });

      i = cursor;
    }

    return result;
  }

  /**
   * Bộ phân tích định dạng 2B (.json)
   */
  function parseJson2B(jsonObj, existingVocabList) {
    var result = {
      source: { source_id: '', title: '' },
      items: [],
      occurrences: [],
      unresolved_occurrences: [],
      errors: []
    };

    if (!jsonObj || typeof jsonObj !== 'object') {
      result.errors.push({ message: 'Dữ liệu JSON không hợp lệ' });
      return result;
    }

    if (jsonObj.source && typeof jsonObj.source === 'object') {
      result.source.source_id = jsonObj.source.source_id || '';
      result.source.title = jsonObj.source.title || '';
    }

    var rawItems = Array.isArray(jsonObj.items) ? jsonObj.items : [];
    var itemsNormMap = new Map();

    rawItems.forEach(function (raw, idx) {
      var fr = raw.fr || '';
      var nKey = norm_key(fr);
      var rawType = raw.type || 'cụm từ';
      var mappedType = mapTagToType(rawType) || 'chunk';
      var itemId = raw.item_id || generateItemId(mappedType, nKey);

      var it = {
        seq: raw.seq || (idx + 1),
        item_id: itemId,
        norm_key: nKey,
        fr: fr,
        type: mappedType,
        level: raw.level || 'A2',
        pos: raw.pos || '',
        meaning_vi: raw.meaning_vi || raw.vi || '',
        register: raw.register || null,
        scene: raw.scene || null,
        source_text: raw.source_text || raw.en || '',
        possible_dup_of: raw.possible_dup_of || null,
        examples: Array.isArray(raw.examples) ? raw.examples : [],
        noun: raw.noun || null,
        verb: raw.verb || null,
        frame: raw.frame || null,
        slot: raw.slot || null,
        related: raw.related || null,
        extra_accepted: raw.extra_accepted || null,
        source_corrected: raw.source_corrected || null,
        source_original: raw.source_original || null,
        t: typeof raw.t === 'number' ? raw.t : 0,
        t_known: typeof raw.t_known === 'boolean' ? raw.t_known : (typeof raw.t === 'number' && raw.t > 0),
        hs: typeof raw.hs === 'number' ? raw.hs : null,
        he: typeof raw.he === 'number' ? raw.he : null
      };

      result.items.push(it);

      if (!itemsNormMap.has(nKey)) {
        itemsNormMap.set(nKey, []);
      }
      itemsNormMap.get(nKey).push(it);
    });

    var existingNormMap = new Map();
    if (Array.isArray(existingVocabList)) {
      existingVocabList.forEach(function (x) {
        if (!x || x._deleted) return;
        var k = norm_key(x.text || x.fr || '');
        if (k) {
          if (!existingNormMap.has(k)) existingNormMap.set(k, []);
          existingNormMap.get(k).push(x);
        }
      });
    }

    var rawOccs = Array.isArray(jsonObj.occurrences) ? jsonObj.occurrences : [];
    rawOccs.forEach(function (occ, idx) {
      var fr = occ.fr || '';
      var nKey = norm_key(fr);

      var matchesInFile = itemsNormMap.get(nKey) || [];
      var matchesInExisting = existingNormMap.get(nKey) || [];
      var totalMatches = matchesInFile.length + matchesInExisting.length;

      if (totalMatches === 1) {
        var matched = matchesInFile[0] || matchesInExisting[0];
        result.occurrences.push({
          seq: occ.seq || (idx + 1),
          item_id: matched.item_id || generateItemId(mapTagToType(matched.tag) || 'chunk', nKey),
          fr: fr,
          norm_key: nKey,
          scene: occ.scene || null,
          source_text: occ.source_text || occ.en || '',
          translation: occ.translation || occ.vi || '',
          t: typeof occ.t === 'number' ? occ.t : 0,
          t_known: typeof occ.t_known === 'boolean' ? occ.t_known : (typeof occ.t === 'number' && occ.t > 0),
          hs: occ.hs,
          he: occ.he,
          source_corrected: occ.source_corrected || null,
          source_original: occ.source_original || null
        });
      } else if (totalMatches === 0) {
        result.unresolved_occurrences.push({
          occ: occ,
          reason: 'Không tìm thấy mục từ vựng tương ứng với fr: "' + fr + '"'
        });
      } else {
        result.unresolved_occurrences.push({
          occ: occ,
          reason: 'Có nhiều hơn 1 mục từ vựng trùng khớp (' + totalMatches + ' mục) với fr: "' + fr + '"'
        });
      }
    });

    return result;
  }

  /**
   * Đọc kho hiện tại sang cấu trúc Schema 0.2
   */
  function readExistingVocabToSchemaV02(vocabList) {
    if (!Array.isArray(vocabList)) {
      return {
        items: [], occurrences: [], tombstones: [], unmappedTags: [], suspiciousPairs: [], collisions: [], stats: {}
      };
    }

    var itemsMap = new Map();
    var occurrences = [];
    var tombstones = [];
    var unmappedTags = [];
    var suspiciousPairs = [];
    var collisions = [];
    var slugTracking = new Map();

    vocabList.forEach(function (raw) {
      if (!raw) return;
      if (raw._deleted) {
        tombstones.push(raw);
        return;
      }

      var fr = raw.text || raw.fr || '';
      var tag = raw.tag || 'Cụm từ';
      var mappedType = mapTagToType(tag);
      if (!mappedType) {
        unmappedTags.push({ id: raw.id, text: fr, tag: tag });
        mappedType = 'chunk';
      }

      var nKey = norm_key(fr);
      var finalItemId = raw.item_id || generateItemId(mappedType, nKey);

      if (slugTracking.has(finalItemId)) {
        var tracker = slugTracking.get(finalItemId);
        if (tracker.normKey !== nKey) {
          collisions.push({
            item_id: finalItemId,
            fr: fr,
            norm_key: nKey,
            collided_with_fr: tracker.fr,
            collided_with_norm_key: tracker.normKey
          });
        }
      } else {
        slugTracking.set(finalItemId, { normKey: nKey, fr: fr });
      }

      var primaryVideo = raw.videoId || 'unknown';

      if (!itemsMap.has(finalItemId)) {
        itemsMap.set(finalItemId, {
          item_id: finalItemId,
          norm_key: nKey,
          fr: fr,
          type: mappedType,
          raw_tag: tag,
          level: raw.level || 'A2',
          meaning_vi: raw.wordVi || raw.vi || '',
          examples: Array.isArray(raw.examples) ? raw.examples : [],
          srs: raw.srs || null,
          createdAt: raw.createdAt || Date.now(),
          original_id: raw.id,
          needs_review: finalItemId.includes('#')
        });
      }

      occurrences.push({
        item_id: finalItemId,
        source_id: canonicalSourceId(primaryVideo),
        videoId: rawVideoId(primaryVideo),
        seq: null,
        source_text: raw.en || '',
        translation: raw.vi || '',
        t: raw.t || 0,
        t_known: typeof raw.t_known === 'boolean' ? raw.t_known : ((raw.t || 0) > 0),
        hs: raw.hs || 0,
        he: raw.he || 0,
        is_primary: true
      });

      if (Array.isArray(raw.contexts)) {
        raw.contexts.forEach(function (ctx) {
          var ctxVid = ctx.videoId || primaryVideo;
          occurrences.push({
            item_id: finalItemId,
            source_id: canonicalSourceId(ctxVid),
            videoId: rawVideoId(ctxVid),
            seq: ctx.seq || null,
            source_text: ctx.en || '',
            translation: ctx.vi || '',
            t: ctx.t || 0,
            t_known: typeof ctx.t_known === 'boolean' ? ctx.t_known : ((ctx.t || 0) > 0),
            hs: ctx.hs || 0,
            he: ctx.he || 0,
            is_primary: false
          });
        });
      }
    });

    var itemsArray = Array.from(itemsMap.values());
    for (var a = 0; a < itemsArray.length; a++) {
      for (var b = a + 1; b < itemsArray.length; b++) {
        if (areSuspiciousDuplicates(itemsArray[a], itemsArray[b])) {
          suspiciousPairs.push([itemsArray[a], itemsArray[b]]);
        }
      }
    }

    return {
      items: itemsArray,
      occurrences: occurrences,
      tombstones: tombstones,
      unmappedTags: unmappedTags,
      suspiciousPairs: suspiciousPairs,
      collisions: collisions,
      stats: {
        total_raw: vocabList.length,
        active_count: vocabList.length - tombstones.length,
        tombstone_count: tombstones.length,
        unique_items: itemsArray.length,
        total_occurrences: occurrences.length,
        unmapped_tags_count: unmappedTags.length,
        suspicious_pairs_count: suspiciousPairs.length,
        collisions_count: collisions.length
      }
    };
  }

  /**
   * Helper kiểm tra xem một context đã tồn tại trong danh sách contexts hay chưa
   */
  function isContextDuplicate(existingContexts, candidate, primaryContext) {
    var candSrc = canonicalSourceId(candidate.source_id || candidate.videoId);
    var candT = typeof candidate.t === 'number' ? candidate.t : 0;
    var candEn = (candidate.en || candidate.source_text || '').trim().toLowerCase();
    var candSeq = (typeof candidate.seq === 'number') ? candidate.seq : null;

    if (primaryContext) {
      var pSrc = canonicalSourceId(primaryContext.source_id || primaryContext.videoId);
      var pT = typeof primaryContext.t === 'number' ? primaryContext.t : 0;
      var pEn = (primaryContext.en || primaryContext.source_text || '').trim().toLowerCase();
      var pSeq = (typeof primaryContext.seq === 'number') ? primaryContext.seq : null;

      if (candSrc === pSrc) {
        if (candSeq !== null && pSeq !== null && candSeq === pSeq) return true;
        if (candEn && pEn && candEn === pEn) return true;
        if (candT > 0 && Math.abs(candT - pT) < 0.5) return true;
      }
    }

    if (Array.isArray(existingContexts)) {
      for (var i = 0; i < existingContexts.length; i++) {
        var c = existingContexts[i];
        var cSrc = canonicalSourceId(c.source_id || c.videoId);
        var cT = typeof c.t === 'number' ? c.t : 0;
        var cEn = (c.en || c.source_text || '').trim().toLowerCase();
        var cSeq = (typeof c.seq === 'number') ? c.seq : null;

        if (candSrc === cSrc) {
          if (candSeq !== null && cSeq !== null && candSeq === cSeq) return true;
          if (candEn && cEn && candEn === cEn) return true;
          if (candT > 0 && Math.abs(candT - cT) < 0.5) return true;
        }
      }
    }
    return false;
  }

  /**
   * Chuẩn bị (Staging) nạp nhiều nguồn cùng lúc:
   * Nhận mảng files: [ { fileName, content, source_id, title }, ... ]
   */
  function stageMultiSourceImport(files, existingVocabList, options) {
    options = options || {};
    var currentSourceId = canonicalSourceId(options.currentSourceId || options.currentVideoId || '');
    var stagedFiles = Array.isArray(files) ? files : [files];
    var existingList = Array.isArray(existingVocabList) ? existingVocabList : [];

    var existingActiveMap = new Map();
    existingList.forEach(function (x) {
      if (!x || x._deleted) return;
      var k = norm_key(x.fr || x.text || '');
      if (k && !existingActiveMap.has(k)) existingActiveMap.set(k, x);
    });

    var stagedItemsMap = new Map();
    var allCollisions = [];
    var allSuspicious = [];
    var allUnresolvedOccs = [];
    var allErrors = [];
    var allWarnings = [];
    var fileSummaries = [];
    var alignStats = { exact: 0, fuzzy: 0, multiple: 0, notFound: 0 };
    var hasSubtitles = Array.isArray(options.sentences) && options.sentences.length > 0;

    stagedFiles.forEach(function (fileObj, fIdx) {
      var rawContent = typeof fileObj === 'string' ? fileObj : (fileObj.content || '');
      var fileName = fileObj.fileName || ('File ' + (fIdx + 1));
      var srcId = fileObj.source_id ? canonicalSourceId(fileObj.source_id) : '';
      var srcTitle = fileObj.title || '';

      var parsed = null;
      var trimmed = (rawContent || '').trim();
      if (trimmed.startsWith('{') || typeof rawContent === 'object') {
        var jsonObj = typeof rawContent === 'object' ? rawContent : JSON.parse(trimmed);
        parsed = parseJson2B(jsonObj, existingList);
      } else {
        parsed = parseText2A(trimmed, srcId);
      }

      var explicitSrcId = srcId || (parsed.source && parsed.source.source_id ? canonicalSourceId(parsed.source.source_id) : '');
      var hasExplicitHeader = !!explicitSrcId;
      var finalSrcId = '';
      var finalTitle = '';

      if (hasExplicitHeader) {
        finalSrcId = explicitSrcId;
        finalTitle = srcTitle || (parsed.source && parsed.source.title) || fileName;
      } else {
        // Nội dung không có header thì dùng source_id của video đang mở
        finalSrcId = currentSourceId || canonicalSourceId('source_' + (fIdx + 1));
        finalTitle = srcTitle || options.currentVideoTitle || (parsed.source && parsed.source.title) || fileName;
      }

      var isSourceMismatch = false;
      var fileWarning = null;

      if (currentSourceId && finalSrcId !== currentSourceId) {
        isSourceMismatch = true;
      } else if (hasSubtitles && !currentSourceId) {
        isSourceMismatch = true;
      }

      if (isSourceMismatch) {
        var currDisplay = currentSourceId || 'chưa mở video';
        fileWarning = 'Nguồn trong file (' + finalSrcId + ') khác video đang mở (' + currDisplay + '): chưa căn mốc thời gian';
        allWarnings.push({ file: fileName, warning: fileWarning });
      }

      if (parsed.errors && parsed.errors.length) {
        parsed.errors.forEach(function (err) {
          allErrors.push({ file: fileName, error: err });
        });
      }

      var fileItemCount = 0;
      var fileOccCount = 0;

      // Xử lý từng item trong file
      parsed.items.forEach(function (it) {
        fileItemCount++;
        var frText = (it.fr || it.text || '').normalize('NFC').trim();
        var nKey = it.norm_key || norm_key(frText);
        var itType = it.type || mapTagToType(it.raw_type || it.tag) || 'chunk';

        var occSpan = findHighlightSpan(it.source_text || '', frText, it.verb);
        var primaryCtx = {
          source_id: finalSrcId,
          videoId: rawVideoId(finalSrcId),
          videoTitle: finalTitle,
          source_text: it.source_text || '',
          translation: it.meaning_vi || it.translation || it.vi || '',
          en: it.source_text || '',
          vi: it.meaning_vi || it.translation || it.vi || '',
          hs: occSpan.hs,
          he: occSpan.he,
          t: isSourceMismatch ? null : (typeof it.t === 'number' ? it.t : 0),
          t_known: isSourceMismatch ? false : (typeof it.t_known === 'boolean' ? it.t_known : (typeof it.t === 'number' && it.t > 0)),
          seq: it.seq || null,
          scene: it.scene || null,
          source_corrected: it.source_corrected || null,
          source_original: it.source_original || null,
          is_primary: true,
          align_status: isSourceMismatch ? 'SOURCE_MISMATCH' : 'PENDING'
        };

        if (hasSubtitles && !isSourceMismatch) {
          var aligned = alignSubtitleForContext(it.source_text || '', frText, options.sentences, it.verb);
          if (aligned.status === 'EXACT') {
            alignStats.exact++;
            primaryCtx.en = aligned.en;
            primaryCtx.vi = aligned.vi || primaryCtx.translation;
            primaryCtx.t = aligned.t;
            primaryCtx.t_known = true;
            primaryCtx.hs = aligned.hs;
            primaryCtx.he = aligned.he;
            primaryCtx.prev = aligned.prev;
            primaryCtx.align_status = 'EXACT';
          } else if (aligned.status === 'FUZZY') {
            alignStats.fuzzy++;
            primaryCtx.en = aligned.en;
            primaryCtx.vi = aligned.vi || primaryCtx.translation;
            primaryCtx.t = aligned.t;
            primaryCtx.t_known = true;
            primaryCtx.hs = aligned.hs;
            primaryCtx.he = aligned.he;
            primaryCtx.prev = aligned.prev;
            primaryCtx.align_status = 'FUZZY';
          } else if (aligned.status === 'MULTIPLE') {
            alignStats.multiple++;
            primaryCtx.t = null;
            primaryCtx.t_known = false;
            primaryCtx.align_status = 'MULTIPLE';
            primaryCtx.match_count = aligned.match_count;
          } else {
            alignStats.notFound++;
            primaryCtx.t = 0;
            primaryCtx.t_known = false;
            primaryCtx.align_status = 'NOT_FOUND';
          }
        }

        // 1. Kiểm tra va chạm trong nội bộ lô (BATCH)
        if (stagedItemsMap.has(nKey)) {
          var prevStaged = stagedItemsMap.get(nKey);
          if (prevStaged.type !== itType) {
            allCollisions.push({
              collisionId: 'col_batch_' + nKey,
              type: 'BATCH_COLLISION',
              norm_key: nKey,
              fr: frText,
              existingType: prevStaged.type,
              incomingType: itType,
              source_id: finalSrcId,
              firstSource: prevStaged.source_id,
              existingItem: prevStaged,
              incomingItem: it
            });
          } else {
            // Cùng type, cùng norm_key: file sau thêm occurrence vào mục tạo từ file trước
            var candOcc = Object.assign({}, primaryCtx, { is_primary: false });
            if (!isContextDuplicate(prevStaged.occurrences, candOcc, prevStaged.primaryContext)) {
              prevStaged.occurrences.push(candOcc);
              fileOccCount++;
            }
          }
          return;
        }

        // 2. Chưa có trong lô: kiểm tra với DB hiện có
        var classification = classifyImportItem(it, existingActiveMap);

        if (classification && classification.status === 'TYPE_COLLISION') {
          allCollisions.push({
            collisionId: 'col_db_' + nKey,
            type: 'DB_COLLISION',
            norm_key: nKey,
            fr: frText,
            existingType: classification.existingType,
            incomingType: classification.incomingType,
            source_id: finalSrcId,
            matchedItem: classification.matchedItem,
            incomingItem: it
          });
        } else if (classification && classification.status === 'SUSPICIOUS') {
          allSuspicious.push({
            suspiciousId: 'susp_db_' + nKey + '_' + (classification.matchedItem.id || 'db'),
            type: 'DB_SUSPICIOUS',
            norm_key: nKey,
            fr: frText,
            matchedFr: classification.matchedItem.text || classification.matchedItem.fr,
            matchedNormKey: norm_key(classification.matchedItem.text || classification.matchedItem.fr),
            source_id: finalSrcId,
            matchedItem: classification.matchedItem,
            incomingItem: it
          });
        }

        // Kiểm tra nghi trùng với các mục khác đã nạp trong lô
        for (var entry of stagedItemsMap.entries()) {
          var stItem = entry[1];
          if (areSuspiciousDuplicates(it, stItem)) {
            allSuspicious.push({
              suspiciousId: 'susp_batch_' + nKey + '_' + stItem.norm_key,
              type: 'BATCH_SUSPICIOUS',
              norm_key: nKey,
              fr: frText,
              matchedFr: stItem.fr,
              matchedNormKey: stItem.norm_key,
              source_id: finalSrcId,
              matchedItem: stItem,
              incomingItem: it
            });
          }
        }

        stagedItemsMap.set(nKey, {
          item_id: it.item_id || generateItemId(itType, nKey),
          norm_key: nKey,
          fr: frText,
          type: itType,
          level: it.level || 'A2',
          pos: it.pos || null,
          meaning_vi: it.meaning_vi || it.vi || '',
          examples: Array.isArray(it.examples) ? it.examples : [],
          source_id: finalSrcId,
          videoTitle: finalTitle,
          primaryContext: primaryCtx,
          occurrences: [],
          status: classification ? classification.status : 'NEW',
          matchedItem: classification ? classification.matchedItem : null,
          noun: it.noun || null,
          verb: it.verb || null,
          frame: it.frame || null,
          slot: it.slot || null,
          related: it.related || null,
          extra_accepted: it.extra_accepted || null,
          register: it.register || null,
          seq: it.seq || null
        });
      });

      // Xử lý các occurrences rời trong file
      parsed.occurrences.forEach(function (occ) {
        var frOcc = (occ.fr || '').normalize('NFC').trim();
        var nKey = occ.norm_key || norm_key(frOcc);
        var target = stagedItemsMap.get(nKey);

        if (!target && existingActiveMap.has(nKey)) {
          target = existingActiveMap.get(nKey);
        }

        if (target) {
          var targetVerb = target.verb || null;
          var occSpan = findHighlightSpan(occ.source_text || '', frOcc, targetVerb);
          var occObj = {
            source_id: finalSrcId,
            videoId: rawVideoId(finalSrcId),
            videoTitle: finalTitle,
            source_text: occ.source_text || '',
            translation: occ.translation || occ.vi || '',
            en: occ.source_text || '',
            vi: occ.translation || occ.vi || '',
            hs: occSpan.hs,
            he: occSpan.he,
            t: isSourceMismatch ? null : (typeof occ.t === 'number' ? occ.t : 0),
            t_known: isSourceMismatch ? false : (typeof occ.t_known === 'boolean' ? occ.t_known : (typeof occ.t === 'number' && occ.t > 0)),
            seq: occ.seq || null,
            scene: occ.scene || null,
            source_corrected: occ.source_corrected || null,
            source_original: occ.source_original || null,
            is_primary: false,
            align_status: isSourceMismatch ? 'SOURCE_MISMATCH' : 'PENDING'
          };

          if (hasSubtitles && !isSourceMismatch) {
            var occAligned = alignSubtitleForContext(occ.source_text || '', frOcc, options.sentences, targetVerb);
            if (occAligned.status === 'EXACT') {
              alignStats.exact++;
              occObj.en = occAligned.en;
              occObj.vi = occAligned.vi || occObj.translation;
              occObj.t = occAligned.t;
              occObj.t_known = true;
              occObj.hs = occAligned.hs;
              occObj.he = occAligned.he;
              occObj.prev = occAligned.prev;
              occObj.align_status = 'EXACT';
            } else if (occAligned.status === 'FUZZY') {
              alignStats.fuzzy++;
              occObj.en = occAligned.en;
              occObj.vi = occAligned.vi || occObj.translation;
              occObj.t = occAligned.t;
              occObj.t_known = true;
              occObj.hs = occAligned.hs;
              occObj.he = occAligned.he;
              occObj.prev = occAligned.prev;
              occObj.align_status = 'FUZZY';
            } else if (occAligned.status === 'MULTIPLE') {
              alignStats.multiple++;
              occObj.t = null;
              occObj.t_known = false;
              occObj.align_status = 'MULTIPLE';
              occObj.match_count = occAligned.match_count;
            } else {
              alignStats.notFound++;
              occObj.t = 0;
              occObj.t_known = false;
              occObj.align_status = 'NOT_FOUND';
            }
          }

          if (target.occurrences) {
            if (!isContextDuplicate(target.occurrences, occObj, target.primaryContext)) {
              target.occurrences.push(occObj);
              fileOccCount++;
            }
          } else {
            // Target là mục đã có trong DB
            target.pendingOccurrences = target.pendingOccurrences || [];
            if (!isContextDuplicate(target.pendingOccurrences, occObj, target)) {
              target.pendingOccurrences.push(occObj);
              fileOccCount++;
            }
          }
        } else {
          allUnresolvedOccs.push({
            file: fileName,
            occ: occ,
            reason: 'Không tìm thấy mục từ vựng tương ứng với fr: "' + frOcc + '"'
          });
        }
      });

      fileSummaries.push({
        fileName: fileName,
        source_id: finalSrcId,
        title: finalTitle,
        itemsCount: fileItemCount,
        occurrencesCount: fileOccCount,
        warning: fileWarning
      });
    });

    var stagedList = Array.from(stagedItemsMap.values());
    var newCount = 0;
    var existsCount = 0;

    stagedList.forEach(function (it) {
      if (it.status === 'EXISTS') existsCount++;
      else if (it.status === 'NEW') newCount++;
    });

    return {
      files: fileSummaries,
      stagedItems: stagedList,
      stagedItemsMap: stagedItemsMap,
      collisions: allCollisions,
      suspicious: allSuspicious,
      unresolvedOccurrences: allUnresolvedOccs,
      errors: allErrors,
      warnings: allWarnings,
      stats: {
        totalFiles: stagedFiles.length,
        totalItems: stagedList.length,
        newCount: newCount,
        existsCount: existsCount,
        collisionCount: allCollisions.length,
        suspiciousCount: allSuspicious.length,
        unresolvedOccCount: allUnresolvedOccs.length,
        errorCount: allErrors.length,
        hasSubtitles: hasSubtitles,
        alignStats: alignStats
      }
    };
  }

  /**
   * Thực hiện ghi dữ liệu sau khi người dùng xác nhận:
   * mode: 'ADD_SOURCE' (Thêm nguồn) hoặc 'REPLACE_ALL' (Thay thế toàn bộ)
   */
  function commitStagedImport(stagedResult, mode, userChoices, currentVocabList, options) {
    options = options || {};
    userChoices = userChoices || {};
    mode = mode || 'ADD_SOURCE';

    if (mode === 'REPLACE_ALL') {
      if (userChoices.confirmationText !== 'THAY THE') {
        throw new Error('Chế độ Thay thế toàn bộ yêu cầu gõ đúng "THAY THE" để xác nhận.');
      }
    }

    var colDecisions = userChoices.collisionDecisions || {};
    var suspDecisions = userChoices.suspiciousDecisions || {};

    // 1. Kiểm tra chặn ghi: tất cả TYPE_COLLISION liên quan phải được giải quyết
    var relevantCollisions = stagedResult.collisions.filter(function (col) {
      if (mode === 'REPLACE_ALL' && col.type === 'DB_COLLISION') {
        return false; // Bỏ qua xung đột với DB cũ bị xóa
      }
      return true;
    });

    for (var i = 0; i < relevantCollisions.length; i++) {
      var col = relevantCollisions[i];
      var dec = colDecisions[col.collisionId];
      if (!dec || (dec !== 'keep_existing_add_occ' && dec !== 'skip_new')) {
        throw new Error('Chưa giải quyết xung đột loại cho mục "' + col.fr + '". Lựa chọn chỉ gồm: Giữ mục cũ hoặc Bỏ qua mục mới.');
      }
    }

    // 2. Kiểm tra chặn ghi: tất cả SUSPICIOUS liên quan phải được giải quyết
    var relevantSuspicious = stagedResult.suspicious.filter(function (s) {
      if (mode === 'REPLACE_ALL' && s.type === 'DB_SUSPICIOUS') {
        return false;
      }
      return true;
    });

    for (var j = 0; j < relevantSuspicious.length; j++) {
      var susp = relevantSuspicious[j];
      var sDec = suspDecisions[susp.suspiciousId] || userChoices.bulkSuspicious;
      if (!sDec || (sDec !== 'merge' && sDec !== 'separate' && sDec !== 'skip')) {
        throw new Error('Chưa giải quyết mục nghi trùng "' + susp.fr + '" vs "' + susp.matchedFr + '".');
      }
    }

    // 3. Khởi tạo danh sách kết quả
    var finalList = [];
    var finalById = new Map();
    var finalByNormKey = new Map();

    if (mode === 'ADD_SOURCE') {
      // Sao chép và nâng cấp các mục hiện có
      (currentVocabList || []).forEach(function (raw) {
        if (!raw) return;
        var clone = Object.assign({}, raw);
        if (clone._deleted) {
          finalList.push(clone);
          return;
        }

        var frVal = (clone.fr || clone.text || '').normalize('NFC').trim();
        var nk = clone.norm_key || norm_key(frVal);
        var t = clone.type || mapTagToType(clone.tag || clone.raw_tag) || 'chunk';
        var iid = clone.item_id || generateItemId(t, nk);

        clone.item_id = iid;
        clone.norm_key = nk;
        clone.type = t;
        clone.schema_version = '0.2';
        if (typeof clone.t_known !== 'boolean') {
          clone.t_known = (typeof clone.t === 'number' && clone.t > 0);
        }

        finalList.push(clone);
        finalById.set(clone.id || iid, clone);
        if (!finalByNormKey.has(nk)) finalByNormKey.set(nk, clone);
      });
    }

    // 4. Áp dụng từng mục từ kết quả Staging
    stagedResult.stagedItems.forEach(function (stItem) {
      var nk = stItem.norm_key;

      // Xử lý nếu dính TYPE_COLLISION
      var hitCol = relevantCollisions.find(function (c) { return c.norm_key === nk; });
      if (hitCol) {
        var colChoice = colDecisions[hitCol.collisionId];
        if (colChoice === 'skip_new') {
          return;
        }
        if (colChoice === 'keep_existing_add_occ') {
          var targetItem = finalByNormKey.get(nk) || hitCol.matchedItem;
          if (targetItem) {
            targetItem.contexts = targetItem.contexts || [];
            var allCandidateOccs = [stItem.primaryContext].concat(stItem.occurrences || []);
            allCandidateOccs.forEach(function (cOcc) {
              var cand = Object.assign({}, cOcc, { is_primary: false });
              if (!isContextDuplicate(targetItem.contexts, cand, { source_id: targetItem.source_id || targetItem.videoId, en: targetItem.en, t: targetItem.t, seq: targetItem.seq })) {
                targetItem.contexts.push(cand);
              }
            });
            targetItem.updatedAt = Date.now();
          }
          return;
        }
      }

      // Xử lý nếu dính SUSPICIOUS
      var hitSusp = relevantSuspicious.find(function (s) { return s.norm_key === nk; });
      if (hitSusp) {
        var suspChoice = suspDecisions[hitSusp.suspiciousId] || userChoices.bulkSuspicious;
        if (suspChoice === 'skip') {
          return;
        }
        if (suspChoice === 'merge') {
          var mergeTarget = finalByNormKey.get(hitSusp.matchedNormKey) || hitSusp.matchedItem;
          if (mergeTarget) {
            mergeTarget.contexts = mergeTarget.contexts || [];
            var allMergeOccs = [stItem.primaryContext].concat(stItem.occurrences || []);
            allMergeOccs.forEach(function (mOcc) {
              var candM = Object.assign({}, mOcc, { is_primary: false });
              if (!isContextDuplicate(mergeTarget.contexts, candM, { source_id: mergeTarget.source_id || mergeTarget.videoId, en: mergeTarget.en, t: mergeTarget.t, seq: mergeTarget.seq })) {
                mergeTarget.contexts.push(candM);
              }
            });
            mergeTarget.updatedAt = Date.now();
          }
          return;
        }
        // suspChoice === 'separate' -> tiếp tục nạp bình thường bên dưới
      }

      // Mục đã tồn tại trong danh sách đang xử lý
      if (finalByNormKey.has(nk)) {
        var existingIt = finalByNormKey.get(nk);
        existingIt.contexts = existingIt.contexts || [];

        // Ghi đè thông tin nếu user chọn
        if (userChoices.overwriteContent) {
          existingIt.wordVi = stItem.meaning_vi || existingIt.wordVi;
          existingIt.level = stItem.level || existingIt.level;
          if (stItem.examples && stItem.examples.length) {
            existingIt.examples = stItem.examples;
          }
        } else {
          // Rule 4: Chỉ điền các trường đang trống (wordVi, level, examples), không ghi đè giá trị cũ, giữ srs nguyên
          if (!existingIt.wordVi && stItem.meaning_vi) existingIt.wordVi = stItem.meaning_vi;
          if ((!existingIt.level || existingIt.level === 'A2') && stItem.level) existingIt.level = stItem.level;
          if ((!existingIt.examples || !existingIt.examples.length) && (stItem.examples && stItem.examples.length)) {
            existingIt.examples = stItem.examples;
          }
        }

        var incomingOccs = [stItem.primaryContext].concat(stItem.occurrences || []);
        incomingOccs.forEach(function (occ) {
          var cObj = Object.assign({}, occ, { is_primary: false });
          if (!isContextDuplicate(existingIt.contexts, cObj, { source_id: existingIt.source_id || existingIt.videoId, en: existingIt.en, t: existingIt.t, seq: existingIt.seq })) {
            existingIt.contexts.push(cObj);
          }
        });
        existingIt.updatedAt = Date.now();
        return;
      }

      // Mục hoàn toàn mới: Xây dựng flat item
      var newFlat = buildFlatVocabItem(stItem, { source_id: stItem.source_id, title: stItem.videoTitle });
      newFlat.contexts = [];
      if (stItem.occurrences && stItem.occurrences.length) {
        stItem.occurrences.forEach(function (occ) {
          var cObj = Object.assign({}, occ, { is_primary: false });
          if (!isContextDuplicate(newFlat.contexts, cObj, newFlat.primaryContext)) {
            newFlat.contexts.push(cObj);
          }
        });
      }

      finalList.push(newFlat);
      finalById.set(newFlat.id, newFlat);
      finalByNormKey.set(nk, newFlat);
    });

    // Đồng bộ các pendingOccurrences trên currentVocabList nếu có
    (currentVocabList || []).forEach(function (exItem) {
      if (exItem && exItem.pendingOccurrences && exItem.pendingOccurrences.length) {
        var trg = finalByNormKey.get(norm_key(exItem.fr || exItem.text || '')) || exItem;
        trg.contexts = trg.contexts || [];
        exItem.pendingOccurrences.forEach(function (occ) {
          var cObj = Object.assign({}, occ, { is_primary: false });
          if (!isContextDuplicate(trg.contexts, cObj, { source_id: trg.source_id || trg.videoId, en: trg.en, t: trg.t, seq: trg.seq })) {
            trg.contexts.push(cObj);
          }
        });
        delete exItem.pendingOccurrences;
        trg.updatedAt = Date.now();
      }
    });

    if (mode === 'REPLACE_ALL' && finalList.length === 0) {
      throw new Error('Danh sách kết quả rỗng. Từ chối ghi.');
    }

    return {
      success: true,
      updatedVocabList: finalList,
      stats: {
        total: finalList.length,
        active: finalList.filter(function (x) { return !x._deleted; }).length,
        tombstones: finalList.filter(function (x) { return !!x._deleted; }).length
      }
    };
  }

  /**
   * Khôi phục từ bản sao lưu JSON mảng phẳng (shadowing_saved_vocab_v1):
   * Yêu cầu xác nhận "KHOI PHUC"
   */
  function restoreFlatBackup(backupJsonStr, confirmationToken) {
    if (confirmationToken !== 'KHOI PHUC') {
      throw new Error('Xác nhận không hợp lệ. Cần gõ chính xác "KHOI PHUC".');
    }
    if (!backupJsonStr || typeof backupJsonStr !== 'string') {
      throw new Error('Dữ liệu sao lưu rỗng.');
    }
    var parsed = null;
    try {
      parsed = JSON.parse(backupJsonStr);
    } catch (e) {
      throw new Error('Dữ liệu JSON không hợp lệ: ' + e.message);
    }
    var itemsArray = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : null);
    if (!itemsArray || itemsArray.length === 0) {
      throw new Error('File sao lưu phải là một mảng JSON hoặc object có trường items chứa các mục từ vựng và không được rỗng.');
    }

    var validList = [];
    var now = Date.now();
    itemsArray.forEach(function (it) {
      if (!it || typeof it !== 'object') return;
      if (!it.text && !it.fr) return;
      var clone = Object.assign({}, it);
      var frText = (clone.fr || clone.text || '').normalize('NFC').trim();
      var nk = clone.norm_key || norm_key(frText);
      var t = clone.type || mapTagToType(clone.tag || clone.raw_tag) || 'chunk';
      var iid = clone.item_id || generateItemId(t, nk);

      clone.item_id = iid;
      clone.norm_key = nk;
      clone.type = t;
      clone.id = clone.id || iid;
      clone.schema_version = '0.2';
      clone.updatedAt = now;
      if (typeof clone.t_known !== 'boolean') {
        clone.t_known = (typeof clone.t === 'number' && clone.t > 0);
      }
      validList.push(clone);
    });

    if (validList.length === 0) {
      throw new Error('Không tìm thấy mục từ vựng hợp lệ trong file sao lưu.');
    }

    return {
      success: true,
      restoredVocabList: validList,
      count: validList.length
    };
  }

  return {
    fr_basic: fr_basic,
    norm_key: norm_key,
    slug: slug,
    mapTagToType: mapTagToType,
    mapTypeToTag: mapTypeToTag,
    canonicalSourceId: canonicalSourceId,
    rawVideoId: rawVideoId,
    findHighlightSpan: findHighlightSpan,
    findHighlightSpanWithSoundTags: findHighlightSpanWithSoundTags,
    normalizeForMatching: normalizeForMatching,
    alignSubtitleForContext: alignSubtitleForContext,
    generateItemId: generateItemId,
    areSuspiciousDuplicates: areSuspiciousDuplicates,
    classifyImportItem: classifyImportItem,
    getDerivedSources: getDerivedSources,
    buildFlatVocabItem: buildFlatVocabItem,
    parseText2A: parseText2A,
    parseJson2B: parseJson2B,
    readExistingVocabToSchemaV02: readExistingVocabToSchemaV02,
    stageMultiSourceImport: stageMultiSourceImport,
    commitStagedImport: commitStagedImport,
    restoreFlatBackup: restoreFlatBackup
  };
});
