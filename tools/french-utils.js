/**
 * French Shadowing Studio - French Language Utilities Module (Pure Logic)
 * Chứa các hàm ngữ pháp và xử lý văn bản tiếng Pháp phục vụ bài tập Sản xuất (Production).
 * Hoàn toàn thuần túy (pure functions), không truy cập localStorage hay môi trường ngoài.
 * Chạy được trên cả Node.js và Trình duyệt (UMD).
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FrenchUtils = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Tập hợp các ký tự bắt đầu bằng nguyên âm tiếng Pháp (kể cả dấu và ligatures)
  var VOWEL_REGEX = /^[aeiouyàâäéèêëîïôöùûüœæ]/i;

  /**
   * Kiểm tra một từ có bắt đầu bằng âm nguyên âm hoặc mute h (h muet) hay không
   */
  function startsWithVowelSound(wordStr, hAspire) {
    if (!wordStr || typeof wordStr !== 'string') return false;
    var clean = wordStr.normalize('NFC').trim().toLowerCase();
    // Bỏ nháy đầu nếu có
    clean = clean.replace(/^['’]/, '');
    if (!clean) return false;

    // Nếu là h aspiré (h thở), không được coi là bắt đầu bằng âm nguyên âm
    if (hAspire) return false;

    // Bắt đầu bằng nguyên âm
    if (VOWEL_REGEX.test(clean)) return true;

    // Bắt đầu bằng chữ 'h' và không phải h_aspire -> mặc định là h muet (âm câm)
    if (clean.startsWith('h')) {
      return true;
    }

    return false;
  }

  /**
   * 1. definiteArticle(noun)
   * Trả về mạo từ xác định: le, la, l', les
   * Trả về null nếu thiếu dữ liệu giống (gender) hoặc dữ liệu không hợp lệ.
   */
  function definiteArticle(noun) {
    if (!noun) return null;
    var n = typeof noun === 'string' ? { fr: noun } : noun;

    if (n.article_def) return n.article_def;
    if (n.plural) return 'les';

    var gender = (n.gender || '').toLowerCase().trim();
    if (gender !== 'm' && gender !== 'f') {
      return null; // Không đoán giống khi thiếu
    }

    var fr = (n.fr || n.lemma || '').trim();
    var isVowelSound = n.starts_with_vowel_sound || startsWithVowelSound(fr, !!n.h_aspire);

    if (isVowelSound) {
      return "l'";
    }

    return gender === 'm' ? 'le' : 'la';
  }

  /**
   * 2. indefiniteArticle(noun)
   * Trả về mạo từ không xác định: un, une, des
   * Trả về null nếu thiếu dữ liệu giống (gender).
   */
  function indefiniteArticle(noun) {
    if (!noun) return null;
    var n = typeof noun === 'string' ? { fr: noun } : noun;

    if (n.article_indef) return n.article_indef;
    if (n.plural) return 'des';

    var gender = (n.gender || '').toLowerCase().trim();
    if (gender !== 'm' && gender !== 'f') {
      return null; // Không đoán
    }

    return gender === 'm' ? 'un' : 'une';
  }

  /**
   * 3. partitiveArticle(noun)
   * Trả về mạo từ bộ phận: du, de la, de l', des
   * Trả về null nếu thiếu dữ liệu giống (gender).
   */
  function partitiveArticle(noun) {
    if (!noun) return null;
    var n = typeof noun === 'string' ? { fr: noun } : noun;

    if (n.plural) return 'des';

    var gender = (n.gender || '').toLowerCase().trim();
    if (gender !== 'm' && gender !== 'f') {
      return null;
    }

    var fr = (n.fr || n.lemma || '').trim();
    var isVowelSound = n.starts_with_vowel_sound || startsWithVowelSound(fr, !!n.h_aspire);

    if (isVowelSound) {
      return "de l'";
    }

    return gender === 'm' ? 'du' : 'de la';
  }

  /**
   * 4. elide(prefix, nextWord, options)
   * Lược âm (elision): le/la -> l', de -> d', je -> j', ne -> n', me -> m', te -> t', se -> s', ce -> c', que -> qu', si -> s' (chỉ trước il/ils)
   * Bỏ qua nếu nextWord có h_aspire: true.
   */
  var ELIDABLE_PREFIXES = {
    'le': "l'",
    'la': "l'",
    'de': "d'",
    'je': "j'",
    'ne': "n'",
    'me': "m'",
    'te': "t'",
    'se': "s'",
    'ce': "c'",
    'que': "qu'",
    'jusque': "jusqu'",
    'puisque': "puisqu'",
    'lorsque': "lorsqu'"
  };

  function elide(prefix, nextWord, options) {
    if (!prefix || typeof prefix !== 'string') return '';
    var pClean = prefix.trim();
    var pLower = pClean.toLowerCase();

    var wStr = '';
    var hAspire = false;
    var vowelSound = false;

    if (typeof nextWord === 'string') {
      wStr = nextWord.trim();
      hAspire = !!(options && options.h_aspire);
      vowelSound = options && options.starts_with_vowel_sound !== undefined
        ? !!options.starts_with_vowel_sound
        : startsWithVowelSound(wStr, hAspire);
    } else if (nextWord && typeof nextWord === 'object') {
      wStr = (nextWord.fr || nextWord.lemma || '').trim();
      hAspire = !!nextWord.h_aspire;
      vowelSound = nextWord.starts_with_vowel_sound !== undefined
        ? !!nextWord.starts_with_vowel_sound
        : startsWithVowelSound(wStr, hAspire);
    }

    if (!wStr) return pClean;

    // Không lược âm trước h aspiré
    if (hAspire) {
      return pClean + ' ' + wStr;
    }

    // Trường hợp riêng của "si": chỉ lược âm trước "il" hoặc "ils"
    if (pLower === 'si') {
      var wLower = wStr.toLowerCase();
      if (wLower === 'il' || wLower.startsWith('il ') || wLower === 'ils' || wLower.startsWith('ils ')) {
        return "s'" + wStr;
      }
      return pClean + ' ' + wStr;
    }

    // Các từ có thể lược âm thông thường
    if (ELIDABLE_PREFIXES[pLower] && vowelSound) {
      return ELIDABLE_PREFIXES[pLower] + wStr;
    }

    return pClean + ' ' + wStr;
  }

  /**
   * 5. contract(preposition, article)
   * Rút gọn giới từ và mạo từ (contraction):
   * à + le -> au, à + les -> aux
   * de + le -> du, de + les -> des
   * Trả về null nếu preposition hoặc article không thuộc nhóm có thể kết hợp.
   */
  function contract(preposition, article) {
    if (!preposition || !article) return null;
    var p = preposition.normalize('NFC').trim().toLowerCase();
    var a = article.normalize('NFC').trim().toLowerCase();

    if (p === 'à' || p === 'a') {
      if (a === 'le') return 'au';
      if (a === 'les') return 'aux';
      if (a === 'la') return 'à la';
      if (a === "l'" || a === "l’") return "à l'";
      return null;
    }

    if (p === 'de') {
      if (a === 'le') return 'du';
      if (a === 'les') return 'des';
      if (a === 'la') return 'de la';
      if (a === "l'" || a === "l’") return "de l'";
      return null;
    }

    return null;
  }

  // Danh sách các danh từ bất quy tắc đặc biệt (không áp dụng thêm -s hay -x thông thường)
  var IRREGULAR_NOUNS = new Set([
    'œil', 'oeil', 'ciel', 'monsieur', 'madame', 'mademoiselle', 'bonhomme', 'gentilhomme'
  ]);

  /**
   * 6. pluralize(noun)
   * Chuyển danh từ số ít sang số nhiều.
   * Nếu là từ bất quy tắc hoặc có nhiều cách chia (-au, -ou, -al, -ail) mà không có sẵn noun.plural -> trả về null, không tự đoán.
   */
  function pluralize(noun) {
    if (!noun) return null;
    var n = typeof noun === 'string' ? { lemma: noun } : noun;

    if (n.plural) return n.plural;
    if (n.irregular) return null; // Bất quy tắc mà không có dữ liệu -> trả null

    var str = (n.lemma || n.fr || '').normalize('NFC').trim();
    if (!str) return null;
    var lower = str.toLowerCase();

    // Các từ bất quy tắc đặc biệt không có sẵn plural -> trả về null, không đoán mò
    if (IRREGULAR_NOUNS.has(lower)) {
      return null;
    }

    // Kết thúc bằng -s, -x, -z: giữ nguyên (e.g. temps, prix, nez, os)
    if (/[sxz]$/i.test(lower)) {
      return str;
    }

    // Kết thúc bằng -eau: thêm -x (e.g. eau -> eaux, chapeau -> chapeaux)
    if (/eau$/i.test(lower)) {
      return str + 'x';
    }

    // Kết thúc bằng -eu: thêm -x (jeu -> jeux), ngoại lệ: pneu, bleu -> pneus, bleus
    if (/eu$/i.test(lower)) {
      if (lower === 'pneu' || lower === 'bleu') return str + 's';
      return str + 'x';
    }

    // Kết thúc bằng -au: bất quy tắc (-x hoặc -s) -> không có sẵn noun.plural thì trả về null
    if (/au$/i.test(lower)) {
      return null;
    }

    // Kết thúc bằng -ou: bất quy tắc (-s hoặc -x: bijou, chou, caillou...) -> không có sẵn noun.plural thì trả về null
    if (/ou$/i.test(lower)) {
      return null;
    }

    // Kết thúc bằng -al hoặc -ail: bất quy tắc đa dạng (cheval -> chevaux, travail -> travaux, nhưng festival -> festivals)
    // Theo quy tắc không tự bịa: nếu là đuôi -al / -ail mà không có chỉ định, trả về null để yêu cầu bổ sung
    if (/al$/i.test(lower) || /ail$/i.test(lower)) {
      return null;
    }

    // Mặc định quy tắc chung: thêm -s
    return str + 's';
  }

  /**
   * 7. fillFrame(frame, slotValue, options)
   * Điền giá trị vào mẫu câu (frame) và tự động xử lý lược âm (elision) / rút gọn (contraction) ở ranh giới.
   * Mẫu câu chứa {slot}, [...] hoặc ___
   * Hỗ trợ các thẻ gợi ý mạo từ có ngữ nghĩa: {NOUN_INDEF}, {NOUN_DEF}, {NOUN_PART}.
   * Nếu thẻ yêu cầu mạo từ mà đối tượng noun thiếu dữ liệu giống (gender), hàm trả về null (không đoán).
   */
  function fillFrame(frame, slotValue, options) {
    if (!frame || typeof frame !== 'string') return null;
    if (slotValue === undefined || slotValue === null) return null;

    var slotStr = typeof slotValue === 'string' ? slotValue.trim() : (slotValue.fr || slotValue.lemma || '').trim();
    if (!slotStr) return null;

    if (!/\{[a-zA-Z0-9_-]+\}|\[\.\.\.\]|___/.test(frame)) {
      return null; // Không có ô trống
    }

    var failed = false;

    // Bắt prefix đứng liền trước placeholder (ví dụ "de {drink}" hoặc "à {place}")
    var placeholderWithPrefixRegex = /([a-zA-Zàâäéèêëîïôöùûüç']+)?(\s*)(\{[a-zA-Z0-9_-]+\}|\[\.\.\.\]|___)/g;

    var filled = frame.replace(placeholderWithPrefixRegex, function (match, prefix, space, placeholder) {
      if (failed) return match;

      var tag = placeholder.replace(/[{}]/g, '').toUpperCase();
      var resolvedSlotStr = slotStr;

      if (tag === 'NOUN_INDEF') {
        var art = indefiniteArticle(slotValue);
        if (!art) {
          failed = true;
          return match;
        }
        resolvedSlotStr = art + ' ' + slotStr;
      } else if (tag === 'NOUN_DEF') {
        var art = definiteArticle(slotValue);
        if (!art) {
          failed = true;
          return match;
        }
        resolvedSlotStr = art.endsWith("'") ? (art + slotStr) : (art + ' ' + slotStr);
      } else if (tag === 'NOUN_PART') {
        var art = partitiveArticle(slotValue);
        if (!art) {
          failed = true;
          return match;
        }
        resolvedSlotStr = art.endsWith("'") ? (art + slotStr) : (art + ' ' + slotStr);
      }

      if (!prefix) {
        return resolvedSlotStr;
      }

      // Kiểm tra rút gọn giới từ trước (ví dụ "à {place}" + "le parc" -> "au parc")
      var matchContract = resolvedSlotStr.match(/^([a-zA-Zàâäéèêëîïôöùûüç']+)\s+(.*)$/i);
      if (matchContract) {
        var article = matchContract[1];
        var contracted = contract(prefix, article);
        if (contracted) {
          return contracted + ' ' + matchContract[2];
        }
      }

      // Kiểm tra lược âm (ví dụ "de {drink}" + "eau" -> "d'eau")
      var elided = elide(prefix, resolvedSlotStr, options);
      return elided;
    });

    if (failed) return null;

    // Chuẩn hóa khoảng trắng tiếng Pháp trước ? ! : ;
    filled = formatFrenchPunctuation(filled);

    return filled;
  }

  /**
   * Chuẩn hóa dấu câu tiếng Pháp:
   * Trước các dấu hai chấm (:), chấm phẩy (;), chấm than (!), chấm hỏi (?) phải có 1 khoảng trắng
   */
  function formatFrenchPunctuation(str) {
    if (!str || typeof str !== 'string') return '';
    var s = str.normalize('NFC');
    // Thay nháy cong
    s = s.replace(/[\u2018\u2019\u201B\u0060\u00B4]/g, "'");
    // Bỏ khoảng trắng quanh nháy
    s = s.replace(/([a-zA-Z])\s*'\s*([a-zA-Z])/g, "$1'$2");

    // Tạm bảo vệ URL để không bị chèn khoảng trắng trước dấu :
    var urls = [];
    s = s.replace(/(https?:\/\/[^\s]+|[a-zA-Z0-9_-]+:\/\/[^\s]+)/g, function (m) {
      urls.push(m);
      return '___URL_' + (urls.length - 1) + '___';
    });

    // Tạm bảo vệ định dạng giờ giữa các chữ số (ví dụ 15:30)
    var times = [];
    s = s.replace(/(\b\d{1,2}):(\d{2}\b)/g, function (m) {
      times.push(m);
      return '___TIME_' + (times.length - 1) + '___';
    });

    // Xử lý cụm dấu hỏi/than liền nhau như ?!, !?, !!, ?? -> gộp không khoảng trắng giữa các dấu
    s = s.replace(/([?!])\s+([?!])/g, '$1$2');

    // Chèn 1 khoảng trắng trước cụm [?!]+ nếu đứng sau chữ cái, số hoặc dấu câu đóng
    s = s.replace(/([a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ0-9»”\)\]\.…])\s*([?!]+)/g, '$1 $2');

    // Chèn 1 khoảng trắng trước : hoặc ; nếu đứng sau chữ cái hoặc dấu câu đóng và không phải URL/Time
    s = s.replace(/([a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ»”\)\]\.…])\s*([:;])/g, '$1 $2');

    // Phục hồi time và URL
    s = s.replace(/___TIME_(\d+)___/g, function (m, idx) { return times[idx]; });
    s = s.replace(/___URL_(\d+)___/g, function (m, idx) { return urls[idx]; });

    // Bỏ khoảng trắng trước dấu chấm (.) và dấu phẩy (,)
    s = s.replace(/\s+([.,])/g, '$1');

    // Thu gọn khoảng trắng liên tiếp
    s = s.replace(/[ \t]+/g, ' ');
    return s.trim();
  }

  /**
   * 8. normalizeAnswer(userAnswer, expectedAnswer, options)
   * So sánh câu trả lời của người học với đáp án mong đợi.
   * Theo đặc tả: BỎ khoảng trắng trước ? ! : ; để so sánh nhất quán và tránh lệch diff hiển thị.
   * options: { mode: 'strict' | 'lenient' }
   * Trả về: { isCorrect, normalizedUser, normalizedExpected, diff }
   */
  function normalizeAnswer(userAnswer, expectedAnswer, options) {
    var mode = (options && options.mode === 'lenient') ? 'lenient' : 'strict';

    var rawU = (userAnswer || '').normalize('NFC').trim();
    var rawE = (expectedAnswer || '').normalize('NFC').trim();

    // Chuẩn hóa cơ bản: chữ thường, nháy thẳng, và BỎ khoảng trắng trước ? ! : ;
    var cleanString = function (str) {
      if (!str) return '';
      var s = str.normalize('NFC').toLowerCase();
      s = s.replace(/[\u2018\u2019\u201B\u0060\u00B4]/g, "'");
      s = s.replace(/([a-zA-Z])\s*'\s*([a-zA-Z])/g, "$1'$2");
      // BỎ khoảng trắng trước ? ! : ; theo đúng đặc tả
      s = s.replace(/\s+([?!:;])/g, '$1');
      // Bỏ khoảng trắng trước . và ,
      s = s.replace(/\s+([.,])/g, '$1');
      // Thu gọn khoảng trắng liên tiếp
      s = s.replace(/[ \t]+/g, ' ');
      return s.trim();
    };

    var cleanU = cleanString(rawU);
    var cleanE = cleanString(rawE);

    var normForCompare = function (s, isLenient) {
      var res = s;
      // Bỏ dấu câu cuối câu để người học không bị phạt vì thiếu chấm/hỏi
      res = res.replace(/[\.,;:!\?¿¡\(\)\[\]\{\}"«»“”]+$/g, '').trim();
      if (isLenient) {
        // Chế độ nới lỏng (lenient): bỏ dấu phụ
        res = res.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      }
      return res;
    };

    var compU = normForCompare(cleanU, mode === 'lenient');
    var compE = normForCompare(cleanE, mode === 'lenient');

    var isCorrect = (compU === compE);

    // Tính mảng diff ký tự giữa cleanU và cleanE (không bị lệch do khoảng trắng trước dấu câu)
    var diff = computeDiff(cleanU, cleanE);

    return {
      isCorrect: isCorrect,
      mode: mode,
      normalizedUser: cleanU,
      normalizedExpected: cleanE,
      diff: diff
    };
  }

  /**
   * Thuật toán so khớp diff đơn giản (Longest Common Subsequence) cho chuỗi
   */
  function computeDiff(userStr, expectedStr) {
    var u = userStr.split('');
    var e = expectedStr.split('');
    var n = u.length;
    var m = e.length;

    // Bảng quy hoạch động LCS
    var dp = Array(n + 1).fill(null).map(function () { return Array(m + 1).fill(0); });
    for (var i = 1; i <= n; i++) {
      for (var j = 1; j <= m; j++) {
        if (u[i - 1] === e[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    var result = [];
    var ci = n, cj = m;
    while (ci > 0 || cj > 0) {
      if (ci > 0 && cj > 0 && u[ci - 1] === e[cj - 1]) {
        result.unshift({ status: 'match', value: u[ci - 1] });
        ci--;
        cj--;
      } else if (cj > 0 && (ci === 0 || dp[ci][cj - 1] >= dp[ci - 1][cj])) {
        result.unshift({ status: 'missing', value: e[cj - 1] });
        cj--;
      } else if (ci > 0 && (cj === 0 || dp[ci][cj - 1] < dp[ci - 1][cj])) {
        result.unshift({ status: 'extra', value: u[ci - 1] });
        ci--;
      }
    }

    return result;
  }

  /**
   * 9. conjugate(verbItem, tense, person)
   * Tra cứu chia động từ từ trường verbItem.conjugation.
   * TUYỆT ĐỐI CHỈ DÙNG DỮ LIỆU ĐÃ CUNG CẤP, KHÔNG TỰ BỊA / ĐOÁN.
   * Nếu thiếu verbItem.conjugation, thiếu tense hoặc thiếu person -> TRẢ VỀ null.
   * Thứ tự tham số chuẩn theo đặc tả: (verbItem, tense, person).
   *
   * @param {Object} verbItem - Đối tượng từ vựng động từ có trường conjugation
   * @param {string} tense - Tên thì (ví dụ 'present', 'imparfait', 'passe_compose')
   * @param {string} person - Ngôi chia (ví dụ '1s', '2s', '3s', '1p', '2p', '3p')
   * @returns {string|null} - Từ đã chia ở dạng NFC, hoặc null nếu thiếu dữ liệu
   */
  function conjugate(verbItem, tense, person) {
    if (!verbItem || typeof verbItem !== 'object') return null;
    if (!verbItem.conjugation || typeof verbItem.conjugation !== 'object') return null;
    if (!tense || typeof tense !== 'string') return null;
    if (!person || typeof person !== 'string') return null;

    var tenseData = verbItem.conjugation[tense];
    if (!tenseData || typeof tenseData !== 'object') return null;

    var form = tenseData[person];
    if (!form || typeof form !== 'string') return null;

    return form.normalize('NFC').trim();
  }

  return {
    definiteArticle: definiteArticle,
    indefiniteArticle: indefiniteArticle,
    partitiveArticle: partitiveArticle,
    elide: elide,
    contract: contract,
    pluralize: pluralize,
    fillFrame: fillFrame,
    normalizeAnswer: normalizeAnswer,
    formatFrenchPunctuation: formatFrenchPunctuation,
    conjugate: conjugate
  };
});
