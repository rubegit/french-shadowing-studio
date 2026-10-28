    // ==================== XỬ LÝ CÂU TRẢ LỜI CỦA AI (THÊM DẤU CÂU / BẢN DỊCH SONG NGỮ) ====================
    // Nguyên tắc thiết kế: KHÔNG tin văn bản AI trả về là "đáp án đúng", mà căn chỉnh (alignment) từng
    // từ của AI với chuỗi từ GỐC của phụ đề (vốn đã có mốc thời gian). Nhờ vậy:
    //   - Từ gốc + timestamp luôn được giữ nguyên; AI chỉ đóng góp: dấu câu, viết hoa, ranh giới câu,
    //     và (với bản dịch) câu tiếng Việt tương ứng.
    //   - AI chèn thêm từ, đổi từ, bỏ từ, đảo trật tự, kèm lời dẫn đầu/cuối... đều không làm hỏng dữ liệu.
    //   - Phụ đề gốc không có dấu câu vẫn khớp được, vì ranh giới câu lấy theo cách AI chia câu.

    const AIC_TITLE_ABBREV = new Set(['mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'st.', 'mt.', 'vs.', 'gen.', 'col.', 'sgt.', 'capt.', 'lt.', 'rev.', 'hon.']);
    const AIC_SOFT_ABBREV = new Set(['etc.', 'u.s.', 'u.k.', 'u.s.a.', 'a.m.', 'p.m.', 'ph.d.', 'inc.', 'ltd.', 'co.', 'corp.', 'approx.', 'dept.']);
    const AIC_NEVER_END = new Set(['e.g.', 'i.e.']);
    // Ký tự CHỈ có trong tiếng Việt (không nhầm với tên riêng châu Âu như "Brené"): ă ơ ư đ và các dấu hỏi/ngã/nặng, tổ hợp mũ+dấu...
    const AIC_VI_UNIQUE = /[ăơưđĂƠƯĐảẻỉỏủỷạẹịọụỵẽĩũỹấầẩẫậếềểễệốồổỗộắằẳẵặớờởỡợứừửữựẢẺỈỎỦỶẠẸỊỌỤỴẼĨŨỸẤẦẨẪẬẾỀỂỄỆỐỒỔỖỘẮẰẲẴẶỚỜỞỠỢỨỪỬỮỰ]/;

    // Chuẩn hóa từ để so khớp: bỏ hết dấu câu/ký hiệu, thường hóa, bỏ dấu nháy đơn (don't = dont).
    function aicNorm(s) {
      return String(s).toLowerCase().replace(/[\u2019\u2018`\u00b4]/g, "'").replace(/[^\p{L}\p{N}]+/gu, '');
    }

    // Token này có kết thúc một câu không? (xét viết tắt Mr./Dr., chữ cái đầu J., dấu ba chấm "..." không ngắt câu)
    function aicEndsSentence(tok, next) {
      const t = String(tok).replace(/["'\u201d\u2019)\]*_]+$/, '');
      if (!/[.?!\u2026]$/.test(t)) return false;
      if (/(\.\.|\u2026)$/.test(t)) return false;
      if (/[?!]$/.test(t)) return true;
      const low = t.toLowerCase();
      if (AIC_NEVER_END.has(low) || AIC_TITLE_ABBREV.has(low)) return false;
      if (/^[B-HJ-Z]\.$/.test(t)) return false;
      const nextLower = next ? /^["'\u201c(]*\p{Ll}/u.test(next) : false;
      if (AIC_SOFT_ABBREV.has(low) || /^([a-z]\.){2,}$/i.test(low)) return !nextLower;
      return true;
    }

    function aicCleanRaw(raw) {
      return String(raw || '')
        .replace(/\r\n?/g, '\n')
        .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
        .replace(/```[a-z]*\n?/gi, '\n')
        .replace(/\*|__/g, '')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s*>\s?/gm, '')
        .replace(/^\s*(?:[-\u2022]|\d{1,3}[.)])\s+/gm, '')
        .replace(/^\s*(?:EN|VI|English|Vietnamese|Ti\u1ebfng Anh|Ti\u1ebfng Vi\u1ec7t|Anh|Vi\u1ec7t|G\u1ed1c|D\u1ecbch)\s*[:\uff1a]\s*/gim, '');
    }

    function aicSplitAtDashes(piece) {
      const out = [];
      let cur = '';
      for (let k = 0; k < piece.length; k++) {
        const ch = piece[k];
        if (ch === '\u2014' && cur.length > 0 && k < piece.length - 1) {
          out.push(cur + '\u2014');
          cur = '';
        } else {
          cur += ch;
        }
      }
      if (cur) out.push(cur);
      return out;
    }

    // Tách văn bản thành các token; "do—that" thành "do—" + "that" (joinNext để hiển thị liền nhau),
    // token chỉ toàn dấu câu (— hoặc ...) được dán vào token liền trước.
    function aicTokenize(raw, unit) {
      const text = aicCleanRaw(raw).replace(/--+/g, '\u2014').replace(/\s*[\u2014\u2013]\s*/g, '\u2014');
      const toks = [];
      text.split(/\s+/).forEach((piece) => {
        if (!piece) return;
        const parts = aicSplitAtDashes(piece);
        parts.forEach((part, pi) => {
          const norm = aicNorm(part);
          if (!norm) {
            if (toks.length) { toks[toks.length - 1].text += part; toks[toks.length - 1].joinNext = false; }
            return;
          }
          toks.push({ text: part, norm, joinNext: part.endsWith('\u2014') && pi < parts.length - 1, unit: unit === undefined ? 0 : unit });
        });
      });
      return toks;
    }

    // Trải phẳng phụ đề hiện tại thành danh sách từ có mốc thời gian.
    function aicFlatten(sents) {
      const flat = [];
      (sents || []).forEach((s, sIdx) => {
        const flatStart = flat.length;
        let ws = s.words && s.words.length ? s.words : null;
        if (!ws) {
          const toks = String(s.text || '').split(/\s+/).filter(Boolean);
          const dur = Math.max(0.6, (s.endTime || s.startTime) - s.startTime);
          const step = dur / Math.max(1, toks.length);
          ws = toks.map((t, k) => ({ word: t, startTime: s.startTime + k * step, endTime: s.startTime + (k + 1) * step }));
        }
        ws.forEach((w) => {
          const parts = String(w.word).split(/\s+/).filter(Boolean);
          if (parts.length > 1) {
            const tot = parts.reduce((a, p) => a + p.length + 1, 0);
            let acc = 0;
            parts.forEach((p) => {
              const s0 = w.startTime + (w.endTime - w.startTime) * acc / tot;
              acc += p.length + 1;
              const e0 = w.startTime + (w.endTime - w.startTime) * acc / tot;
              flat.push({ w: p, s: s0, e: e0, auto: false, sent: sIdx, norm: aicNorm(p) });
            });
            return;
          }
          flat.push({ w: w.word, s: w.startTime, e: w.endTime, auto: !!w.autoPunct, sent: sIdx, norm: aicNorm(w.word) });
        });
        // Bài đọc import từ extension: ảnh / đầu đoạn / tiêu đề gắn vào TỪ ĐẦU của câu để không mất khi dựng lại câu
        if (flat.length > flatStart && (s.ps || s.hd || s.ti || (s.imgs && s.imgs.length))) {
          flat[flatStart].mk = { ps: s.ps ? 1 : 0, hd: s.hd ? 1 : 0, ti: s.ti ? 1 : 0, im: (s.imgs && s.imgs.length) ? s.imgs : null };
        }
      });
      return flat;
    }

    // Tìm điểm neo bắt đầu: bỏ qua lời dẫn của AI ("Dưới đây là đoạn văn đã được thêm dấu câu:") bằng cách
    // tìm chỗ đầu tiên mà vài từ đầu của phụ đề gốc xuất hiện liên tiếp trong câu trả lời.
    function aicFindStart(O, A) {
      const n = O.length, m = A.length;
      // Lời dẫn của AI / dòng credit của phụ đề người làm ("Transcriber: ... Reviewer: ...") chỉ có thể dài vài chục từ,
      // nên điểm bắt đầu phải nằm GẦN ĐẦU bản kia. Trước đây tìm trên toàn bài nên cụm 3 từ ngắn ("so when i") khớp tình cờ
      // ở cuối bài và kéo cả phép căn chỉnh chạy từ cuối. Giờ: ưu tiên cụm dài, cửa sổ hẹp; chỉ mở rộng khi cụm đủ dài.
      const maxI = Math.min(40, n - 3);
      const tryFind = (lens, jMax, maxScore) => {
        for (const L of lens) {
          let best = null;
          for (let i0 = 0; i0 <= maxI; i0++) {
            if (i0 + L > n) continue;
            const jEnd = Math.min(jMax, m - L);
            for (let j = 0; j <= jEnd; j++) {
              let ok = true;
              for (let q = 0; q < L; q++) {
                if (O[i0 + q] === '' || O[i0 + q] !== A[j + q]) { ok = false; break; }
              }
              if (ok) {
                const score = i0 + j;   // càng gần đầu cả hai bên càng tốt
                if (score <= (maxScore === undefined ? Infinity : maxScore) && (!best || score < best.score)) best = { i0, j0: j, score };
                break;
              }
            }
          }
          if (best) return { i0: best.i0, j0: best.j0 };
        }
        return null;
      };
      // Hai bản đều BẮT ĐẦU khớp nhau ngay từ đầu (>= 5 từ liên tiếp): chọn luôn, kẻo cụm dài hơn ở phía sau (>= 8 từ) kéo điểm bắt đầu
      // đi muộn và làm mất phần mở đầu (ví dụ phụ đề người làm thiếu 1 chữ "of" ở câu đầu -> 8 từ đầu bị bỏ khỏi phép đối chiếu).
      return tryFind([5], 12, 3)
          || tryFind([8, 6, 5, 4], 150)      // cụm dài, gần đầu
          || tryFind([3], 40)                // cụm 3 từ chỉ tin khi rất gần đầu
          || tryFind([10, 8, 6], m)          // lời dẫn/credit rất dài: cho tìm rộng nhưng chỉ nhận cụm dài
          || { i0: 0, j0: 0 };
    }

    // Căn chỉnh tối ưu (quy hoạch động) cho MỘT đoạn lệch ngắn giữa từ gốc và từ AI: khớp đúng những từ giống nhau,
    // coi các từ còn lại là thay thế / chèn / bỏ với chi phí nhỏ nhất. Nhờ vậy dấu câu của AI rơi đúng vào từ gốc tương ứng.
    function aicAlignGap(O, A, oS, oL, aS, aL, map) {
      const W = aL + 1;
      const cost = new Float32Array((oL + 1) * W);
      for (let x = 1; x <= oL; x++) cost[x * W] = x;
      for (let y = 1; y <= aL; y++) cost[y] = y;
      const sub = (x, y) => {
        const a = O[oS + x], b = A[aS + y];
        if (a !== '' && a === b) return 0;
        if (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a))) return 0.5;
        return 1;
      };
      for (let x = 1; x <= oL; x++) {
        for (let y = 1; y <= aL; y++) {
          const d = cost[(x - 1) * W + (y - 1)] + sub(x - 1, y - 1);
          const u = cost[(x - 1) * W + y] + 1;
          const l = cost[x * W + (y - 1)] + 1;
          cost[x * W + y] = Math.min(d, u, l);
        }
      }
      let x = oL, y = aL;
      while (x > 0 && y > 0) {
        const cur = cost[x * W + y];
        const c = sub(x - 1, y - 1);
        if (Math.abs(cur - (cost[(x - 1) * W + (y - 1)] + c)) < 1e-6) { map[oS + x - 1] = aS + y - 1; x--; y--; }
        else if (Math.abs(cur - (cost[(x - 1) * W + y] + 1)) < 1e-6) { x--; }
        else { y--; }
      }
    }

    // Căn chỉnh tham lam có "đồng bộ lại" (resync): khi lệch, thử coi là AI đổi từ / chèn thêm / bỏ bớt và
    // chọn phương án tốn ít chỉnh sửa nhất mà 3 từ kế tiếp lại khớp. map[i] = chỉ số token AI ứng với từ gốc i
    // (-1: không khớp, -2: bị gộp vào từ ghép phía trước, ví dụ "one dimensional" -> "one-dimensional").
    function aicAlign(O, A, i0, j0) {
      const n = O.length, m = A.length;
      const map = new Int32Array(n).fill(-1);
      const merge = new Uint8Array(n);
      let i = i0, j = j0, exact = 0;
      const run = (oi, aj, L) => {
        let k = 0;
        while (k < L && oi + k < n && aj + k < m && O[oi + k] !== '' && O[oi + k] === A[aj + k]) k++;
        return k;
      };
      while (i < n && j < m) {
        if (O[i] !== '' && O[i] === A[j]) { map[i] = j; exact++; i++; j++; continue; }

        let mk = 0;
        if (A[j] !== '') {
          let cat = O[i];
          for (let k = 2; k <= 4 && i + k <= n; k++) {
            cat += O[i + k - 1];
            if (cat === A[j]) { mk = k; break; }
          }
        }
        if (mk) {
          map[i] = j; merge[i] = mk;
          for (let q = 1; q < mk; q++) map[i + q] = -2;
          exact += mk; i += mk; j++;
          continue;
        }

        const remO = n - i, remA = m - j;
        // Tìm phương án sửa tốn ít chỉnh sửa nhất (cost = max(di, dj)): thay thế / AI chèn / AI bỏ / thay cụm khác độ dài
        // (ví dụ 3 từ gốc "a long way" bị AI viết thành 1 từ "far"), miễn là các từ kế tiếp lại khớp nhau.
        const tryResync = (D, from, L) => {
          for (let cost = from; cost <= D; cost++) {
            const cands = [[cost, cost], [0, cost], [cost, 0]];
            for (let k = 1; k < cost; k++) { cands.push([cost, k]); cands.push([k, cost]); }
            for (const [di, dj] of cands) {
              if (i + di < n && j + dj < m && run(i + di, j + dj, L) >= L) return { di, dj };
            }
          }
          return null;
        };
        let found = tryResync(12, 1, Math.max(1, Math.min(3, remO, remA)));
        if (!found) found = tryResync(40, 13, Math.max(1, Math.min(4, remO, remA)));
        if (!found) {
          const L3 = Math.max(1, Math.min(6, remO, remA));
          for (let d = 41; d <= 400 && !found; d++) {
            if (j + d < m && run(i, j + d, L3) >= L3) found = { di: 0, dj: d };
            else if (i + d < n && run(i + d, j, L3) >= L3) found = { di: d, dj: 0 };
          }
        }
        if (!found) break;
        if (found.di > 0 && found.dj > 0) aicAlignGap(O, A, i, found.di, j, found.dj, map);
        i += found.di; j += found.dj;
      }
      return { map, merge, exact };
    }

    // Từ gốc bị AI đổi chữ (ví dụ work -> worked): giữ chữ gốc nhưng vẫn lấy dấu câu AI gắn vào.
    function aicAdoptPunct(origWord, tokText) {
      const lead = (tokText.match(/^[^\p{L}\p{N}]*/u) || [''])[0];
      const trail = (tokText.match(/[^\p{L}\p{N}]*$/u) || [''])[0];
      const core = origWord.replace(/^[^\p{L}\p{N}]+/u, '').replace(/[^\p{L}\p{N}]+$/u, '');
      return lead + (core || origWord) + trail;
    }

    function aicSplitLongWords(words, maxW) {
      if (words.length <= maxW) return [words];
      let best = -1, bestDist = Infinity;
      const mid = words.length / 2;
      for (let k = 8; k < words.length - 8; k++) {
        if (/[,;:\u2014]$/.test(words[k].word)) {
          const d = Math.abs(k - mid);
          if (d < bestDist) { bestDist = d; best = k; }
        }
      }
      if (best < 0) best = Math.floor(mid) - 1;
      return [...aicSplitLongWords(words.slice(0, best + 1), maxW), ...aicSplitLongWords(words.slice(best + 1), maxW)];
    }

    function aicComposeText(words) {
      let out = '';
      words.forEach((w, k) => {
        out += w.word;
        if (k < words.length - 1 && !w.joinNext) out += ' ';
      });
      return out;
    }

    // Câu trả lời của AI thường bọc cả đoạn trong ngoặc kép (do prompt); bỏ cặp ngoặc bọc ngoài đó đi.
    function aicStripWrapperQuotes(sentences) {
      if (!sentences.length) return;
      const straight = (s) => s.words.reduce((a, w) => a + (w.word.match(/"/g) || []).length, 0);
      const first = sentences[0], last = sentences[sentences.length - 1];
      const fw = first.words[0];
      if (/^[\u201c"]/.test(fw.word)) {
        const balanced = fw.word[0] === '"' ? straight(first) % 2 === 0 : first.words.some((w) => /\u201d/.test(w.word));
        if (!balanced) fw.word = fw.word.replace(/^[\u201c"]+/, '');
      }
      const lw = last.words[last.words.length - 1];
      if (/[\u201d"]$/.test(lw.word)) {
        const balanced = lw.word.slice(-1) === '"' ? straight(last) % 2 === 0 : last.words.some((w) => /\u201c/.test(w.word));
        if (!balanced) lw.word = lw.word.replace(/[\u201d"]+$/, '');
      }
    }

    // Dựng lại danh sách câu từ kết quả căn chỉnh.
    // Mỗi từ gốc thuộc về một "unit" (câu do AI chia). Từ gốc không khớp được sẽ:
    //   - đoạn ngắn (<7 từ) chen giữa: dồn vào câu kế tiếp (dấu câu của AI nằm ở từ khớp cuối câu trước);
    //   - đoạn dài (AI bỏ sót cả câu / phần đuôi chưa được trả lời): giữ NGUYÊN cấu trúc câu gốc.
    function aicRebuild(flat, tokens, al, unitVi, opts, unitGrp) {
      const n = flat.length;
      const { map, merge } = al;
      const unit = new Array(n).fill(null);
      for (let i = 0; i < n; i++) {
        if (map[i] >= 0) unit[i] = tokens[map[i]].unit;
        else if (map[i] === -2) unit[i] = unit[i - 1];
      }
      const nextU = new Array(n + 1).fill(null);
      for (let i = n - 1; i >= 0; i--) nextU[i] = unit[i] !== null ? unit[i] : nextU[i + 1];

      const gapUnit = new Array(n).fill(false);
      let prevU = null;
      for (let i = 0; i < n; ) {
        if (unit[i] !== null) { prevU = unit[i]; i++; continue; }
        let b = i;
        while (b + 1 < n && unit[b + 1] === null) b++;
        const len = b - i + 1;
        const q = nextU[b + 1];
        for (let k = i; k <= b; k++) {
          if (len >= 7 || (q === null && len > 3)) { unit[k] = 'g' + flat[k].sent; gapUnit[k] = true; }
          else if (q !== null) unit[k] = q;
          else unit[k] = prevU;
        }
        i = b + 1;
      }

      const groups = [];
      for (let i = 0; i < n; i++) {
        if (map[i] === -2) continue;
        const ow = flat[i];
        // Bản dịch song ngữ: từ gốc mà AI đã lược bỏ và là tiếng ngập ngừng (um, uh...) hoặc nhãn trong ngoặc vuông ([Music]...) thì bỏ hẳn, không giữ lại
        if (map[i] === -1 && opts && opts.dropFillers && (MC_HESITATIONS.has(ow.norm) || /^\[[^\]]*\]$/.test(ow.w))) continue;
        let text, endTime = ow.e, joinNext = false;
        if (map[i] >= 0) {
          const t = tokens[map[i]];
          if (merge[i]) { text = t.text; endTime = flat[i + merge[i] - 1].e; }
          else if (t.norm === ow.norm) text = t.text;
          else text = aicAdoptPunct(ow.w, t.text);
          joinNext = t.joinNext;
        } else {
          text = (ow.auto && !gapUnit[i]) ? ow.w.replace(/[.?!]+$/, '') : ow.w;
        }
        const w = { word: text, startTime: ow.s, endTime };
        if (joinNext) w.joinNext = true;
        if (ow.mk) w.mk = ow.mk;
        const u = unit[i];
        const lastG = groups[groups.length - 1];
        if (lastG && lastG.unit === u) lastG.words.push(w);
        else groups.push({ unit: u, words: [w] });
      }

      let out = [];
      groups.forEach((g) => {
        const vi = (typeof g.unit === 'number' && unitVi) ? unitVi[g.unit] : undefined;
        const pieces = (opts && opts.splitLong && typeof g.unit === 'number') ? aicSplitLongWords(g.words, opts.splitLong) : [g.words];
        const gid0 = (typeof g.unit === 'number' && unitGrp) ? unitGrp[g.unit] : undefined;   // nhóm "câu theo dấu chấm" chứa đoạn AI này
        pieces.forEach((ws, pi) => {
          ws[ws.length - 1].joinNext = false;
          out.push({ words: ws, vi: (pi === pieces.length - 1 && vi) ? vi : undefined, gid: gid0 === undefined ? undefined : (pieces.length > 1 ? gid0 + '.' + pi : gid0) });
        });
      });
      aicStripWrapperQuotes(out);

      const result = out.map((g, idx) => {
        const s = {
          id: idx + 1,
          startTime: g.words[0].startTime,
          endTime: g.words[g.words.length - 1].endTime,
          text: aicComposeText(g.words),
          words: g.words
        };
        if (g.vi) s.vi = g.vi;
        if (g.gid !== undefined) s.gid = g.gid;   // các đoạn cùng gid = cùng một câu (kết thúc bằng . ? !): giao diện Mặc định tắt song ngữ sẽ nối liền lại
        let mkPs = 0, mkHd = 0, mkTi = 0, mkIm = null;
        g.words.forEach((gw, gi) => {
          if (!gw.mk) return;
          if (gw.mk.ps) mkPs = 1;
          if (gi === 0 && gw.mk.hd) mkHd = 1;
          if (gi === 0 && gw.mk.ti) mkTi = 1;
          if (gw.mk.im && gw.mk.im.length) mkIm = (mkIm || []).concat(gw.mk.im);
          delete gw.mk;
        });
        if (mkPs) s.ps = 1;
        if (mkHd) s.hd = 1;
        if (mkTi) s.ti = 1;
        if (mkIm) s.imgs = mkIm;
        return s;
      });
      for (let k = 0; k < result.length - 1; k++) {
        const nextStart = result[k + 1].startTime;
        if (result[k].endTime > nextStart) {
          result[k].endTime = nextStart;
          const lw = result[k].words[result[k].words.length - 1];
          if (lw.endTime > nextStart) lw.endTime = nextStart;
        }
      }
      return result;
    }

    function aicRun(sents, tokens, unitVi, mode, unitGrp, sourceWordsByUnit) {
      const flat = aicFlatten(sents);
      const n = flat.length;
      if (!n) return { ok: false, error: 'Chưa có phụ đề để xử lý.' };
      if (!tokens.length) return { ok: false, error: 'Không tìm thấy nội dung tiếng Pháp nào trong câu trả lời vừa dán.' };
      const O = flat.map((f) => f.norm);
      const A = tokens.map((t) => t.norm);
      const st = aicFindStart(O, A);
      const al = aicAlign(O, A, st.i0, st.j0);
      // Xét chất lượng khớp theo MẬT ĐỘ trong đoạn đã được AI phủ tới (không phải % toàn bài): AI trả lời thiếu
      // (video dài bị cắt giữa chừng) vẫn hợp lệ; còn dán nhầm/AI diễn đạt lại thì mật độ khớp rất thấp -> từ chối.
      let firstMapped = -1, lastMapped = -1;
      for (let i = 0; i < n; i++) {
        if (al.map[i] !== -1) { if (firstMapped < 0) firstMapped = i; lastMapped = i; }
      }
      const span = lastMapped >= 0 ? lastMapped - firstMapped + 1 : 0;
      const density = span ? al.exact / span : 0;
      if (al.exact < Math.min(n, 6) || density < 0.6) {
        return {
          ok: false,
          error: `Nội dung vừa dán không khớp với phụ đề gốc (chỉ khớp được ${al.exact}/${n} từ) nên chưa áp dụng. Có thể AI đã diễn đạt lại nội dung, hoặc bạn dán nhầm câu trả lời.`
        };
      }
      const dropFillers = mode === 'trans' ? { dropFillers: true, sourceWordsByUnit } : null;
      const sentences = aicRebuild(flat, tokens, al, unitVi, mode === 'punct' ? { splitLong: 50 } : dropFillers, unitGrp);
      const tailWords = n - 1 - lastMapped;
      return {
        ok: true,
        sentences,
        stats: {
          totalWords: n,
          coverage: al.exact / n,
          headWords: firstMapped,
          tailWords,
          tailPct: Math.round(((lastMapped + 1) / n) * 100),
          sentenceCount: sentences.length,
          translated: sentences.filter((x) => x.vi).length
        }
      };
    }

    // (1) THÊM DẤU CÂU: câu trả lời của AI là văn bản tiếng Pháp đã có dấu câu.
    // opts.lineChunks (video): mỗi DÒNG trong câu trả lời của AI là một đoạn riêng (AI thường xuống dòng ở dấu phẩy / gạch ngang để chia câu dài thành
    // các cụm 8-18 từ cho dễ luyện) -> ngoài ranh giới ở . ? ! còn có ranh giới ở cuối mỗi dòng.
    function applyPunctuationFromAi(sents, aiText, opts) {
      const lineChunks = !!(opts && opts.lineChunks);
      let textToParse = aiText;
      const cbMatch = String(aiText || '').match(/```[a-z]*\s*\n([\s\S]*?)\n```/i);
      if (cbMatch) textToParse = cbMatch[1];
      let tokens = [];
      if (lineChunks) {
        aicCleanRaw(textToParse).split('\n').forEach((line) => {
          const lt = aicTokenize(line, 0);
          if (lt.length) { lt[lt.length - 1].lineEnd = true; tokens = tokens.concat(lt); }
        });
      } else tokens = aicTokenize(textToParse, 0);
      let u = 0, sentEnds = 0, gcount = 0;
      const unitGrp = [];
      tokens.forEach((t, k) => {
        t.unit = u;
        unitGrp[u] = gcount;
        const nxt = tokens[k + 1];
        const se = aicEndsSentence(t.text, nxt ? nxt.text : '');
        if (se) { sentEnds++; gcount++; }
        if (se || t.lineEnd) u++;
      });
      if (sentEnds < Math.max(1, Math.floor(tokens.length / 60))) {
        return { ok: false, error: 'Câu trả lời của AI gần như không có dấu kết thúc câu (. ? !) nên chưa thể chia câu. Hãy nhờ AI thêm dấu câu đầy đủ rồi dán lại.' };
      }
      return aicRun(sents, tokens, null, 'punct', lineChunks ? unitGrp : undefined);
    }

    // ==================== GHÉP PHỤ ĐỀ THỦ CÔNG (NGƯỜI LÀM) VÀO PHỤ ĐỀ TỰ ĐỘNG (WORD-LEVEL) ====================
    // Extension v1.1 gửi kèm 2 bản: ASR tiếng Pháp (thời gian từng từ) + phụ đề thủ công tiếng Pháp (chữ và dấu câu chuẩn).
    // Nguyên tắc: CHỮ + DẤU CÂU + CHIA CÂU lấy từ bản người làm (đáng tin hơn), THỜI GIAN từng từ lấy từ ASR.
    //   - Từ khớp nhau: giữ chữ của người làm, mượn mốc thời gian của từ ASR tương ứng.
    //   - ASR nghe sai (their/there...): chữ người làm thay vào, vẫn dùng mốc thời gian ASR.
    //   - Người làm có mà ASR bỏ sót: chèn thêm từ, thời gian nội suy theo độ dài chữ.
    //   - ASR có mà người làm không viết (you know, I mean, lặp cụm từ 2 từ trở lên... người nói CÓ nói): GIỮ LẠI; riêng tiếng ngập ngừng um/uh/hmm... và lặp đúng 1 từ (\"I I\") thì bỏ/gộp, gắn vào câu của từ người làm bên cạnh;
    //     (dài >= 7 từ: người làm cắt bớt lời) giữ nguyên cấu trúc câu của ASR.
    //   - Phụ đề người làm lệch hẳn ASR (mật độ khớp < 60%) thì KHÔNG ghép, giữ nguyên bản ASR như cũ.
    function mcCleanCue(t) {
      return String(t || '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/<[^>]+>/g, '')
        .replace(/\r\n|\n|\r/g, ' ')
        .replace(/\[[^\]]{0,60}\]/g, ' ')                  // [Music], [Applause]
        .replace(/\((?:[^()\s]+\s?){1,4}\)/g, ' ')         // (laughs), (music playing)
        .replace(/[\u266a\u266b\u266c][^\u266a\u266b\u266c]*[\u266a\u266b\u266c]/g, ' ')   // ♪ lời hát ♪
        .replace(/[\u266a\u266b\u266c]+/g, ' ')            // ♪ lẻ
        .replace(/>>+/g, ' ')                              // đổi người nói
        .replace(/^\s*-\s+/, '')                           // gạch đầu dòng thoại ở đầu cue
        .replace(/^\s*[A-Z][A-Z0-9 .'\-]{1,24}:\s+/, '')   // nhãn người nói "JOHN: "
        .replace(/\s+/g, ' ').trim();
    }

    function mcJson3ToText(raw) {
      const evs = (raw && Array.isArray(raw.events) ? raw.events : []).filter((ev) => ev && Array.isArray(ev.segs));
      evs.sort((a, b) => (a.tStartMs || 0) - (b.tStartMs || 0));
      const parts = [];
      evs.forEach((ev) => {
        const t = mcCleanCue(ev.segs.map((s) => s.utf8 || '').join(''));
        if (t) parts.push(t);
      });
      return parts.join(' ');
    }

    // Chia khoảng thời gian [t0, t1] cho một dãy token theo độ dài chữ (mỗi từ tối thiểu ~0.08s).
    function mcSpread(tokens, t0, t1) {
      const cnt = tokens.length;
      if (t1 < t0 + 0.08 * cnt) t1 = t0 + 0.08 * cnt;
      const total = tokens.reduce((a, t) => a + Math.max(1, t.norm.length) + 1, 0);
      let acc = 0;
      return tokens.map((t) => {
        const s = t0 + (t1 - t0) * acc / total;
        acc += Math.max(1, t.norm.length) + 1;
        return { s, e: t0 + (t1 - t0) * acc / total };
      });
    }

    // Tiếng đệm / cụm chêm mà người nói thật sự nói, ASR nghe được nhưng phụ đề người làm thường lược bỏ.
    // Dùng khi một đoạn ASR bị thay bằng chữ người làm: tách các cụm này ở đầu/cuối đoạn ra để giữ lại (xếp cụm dài trước).
    const MC_FILLER_PHRASES = [
      ['you', 'know', 'what', 'i', 'mean'], ['you', 'know'], ['i', 'mean'], ['you', 'see']
    ];
    // Tiếng ngập ngừng vô nghĩa (um, uh, hmm...): người chép chính tả không viết ra nên KHÔNG giữ lại khi đối chiếu
    const MC_HESITATIONS = new Set(['um', 'umm', 'uh', 'uhh', 'uhm', 'er', 'erm', 'ah', 'hmm', 'hm', 'mm', 'mmm']);
    // Từ thường gặp ở đầu câu: có thể hạ chữ hoa khi đứng sau tiếng đệm mở câu (\"Um, so ...\")
    const MC_LOWER_AFTER_FILLER = new Set(['so', 'and', 'but', 'well', 'okay', 'ok', 'now', 'then', 'yes', 'no', 'the', 'a', 'an', 'we', 'you', 'they', 'it', 'he', 'she',
      'this', 'that', 'there', 'when', 'what', 'how', 'why', 'if', 'as', 'because', 'while', 'or', 'just', 'really', 'actually', 'basically', 'anyway', 'my', 'our', 'your', 'in', 'on', 'at', 'to', 'for', 'with']);
    // Cụm chêm có dấu phẩy hai bên khi đứng giữa câu
    const MC_PAREN_FILLERS = new Set(['you know what i mean', 'you know', 'i mean', 'you see']);

    // idxs: chỉ số các từ ASR trong đoạn; minKeep: số từ tối thiểu phải còn lại (để thay bằng chữ người làm). Trả về { lead, trail, rest }.
    function mcPeelFillers(idxs, flat, minKeep) {
      let rest = idxs.slice();
      const lead = [], trail = [];
      const matchLen = (arr, atEnd) => {
        for (const ph of MC_FILLER_PHRASES) {
          const L = ph.length;
          if (arr.length - L < minKeep) continue;
          const seg = atEnd ? arr.slice(arr.length - L) : arr.slice(0, L);
          if (seg.every((i, q) => flat[i].norm === ph[q])) return L;
        }
        return 0;
      };
      let L;
      while ((L = matchLen(rest, false))) { lead.push(...rest.slice(0, L)); rest = rest.slice(L); }
      while ((L = matchLen(rest, true))) { trail.unshift(...rest.slice(rest.length - L)); rest = rest.slice(0, rest.length - L); }
      return { lead, trail, rest };
    }

    function mergeManualIntoAsr(sents, manualText) {
      const flat = aicFlatten(sents);
      const n = flat.length;
      if (!n) return { ok: false, error: 'Chưa có phụ đề tự động để ghép.' };
      const toks = aicTokenize(manualText, 0);
      if (toks.length < Math.min(8, Math.ceil(n / 2))) return { ok: false, error: 'Phụ đề người làm rỗng hoặc quá ngắn.' };

      // Chia câu theo dấu câu của bản người làm (nếu bản đó gần như không có dấu câu thì giữ cách chia câu của ASR)
      let u = 0;
      toks.forEach((t, k) => {
        t.unit = u;
        const nxt = toks[k + 1];
        if (aicEndsSentence(t.text, nxt ? nxt.text : '')) u++;
      });
      const useManualSentences = u >= Math.max(2, Math.floor(toks.length / 60));

      // Căn chỉnh từng từ ASR (O) với từ người làm (A)
      const O = flat.map((f) => f.norm);
      const A = toks.map((t) => t.norm);
      const st = aicFindStart(O, A);
      const al = aicAlign(O, A, st.i0, st.j0);

      let firstMapped = -1, lastMapped = -1;
      for (let i = 0; i < n; i++) if (al.map[i] !== -1) { if (firstMapped < 0) firstMapped = i; lastMapped = i; }
      const span = lastMapped >= 0 ? lastMapped - firstMapped + 1 : 0;
      const density = span ? al.exact / span : 0;
      if (al.exact < Math.min(n, 6) || density < 0.6) {
        return { ok: false, error: `Phụ đề người làm không khớp với phụ đề tự động (chỉ khớp ${al.exact}/${n} từ).` };
      }

      // Các "mỏ neo": từ người làm j <-> đoạn từ ASR [i0..i1]
      const anchors = [];
      let lastJ = -1;
      for (let i = 0; i < n; i++) {
        const j = al.map[i];
        if (j >= 0 && j > lastJ) {
          anchors.push({ i0: i, i1: i + (al.merge[i] || 1) - 1, j });
          lastJ = j;
        }
      }
      if (!anchors.length) return { ok: false, error: 'Không tìm được từ nào khớp giữa hai phụ đề.' };

      const items = [];   // { w, s, e, asr, auto, sent, unit, joinNext }
      const pushAsr = (i) => /^\[[^\]]*\][.!?,]*$/.test(String(flat[i].w).trim()) ? null : items.push({ w: flat[i].w, s: flat[i].s, e: flat[i].e, asr: true, auto: !!flat[i].auto, sent: flat[i].sent });
      const manualItem = (j, s, e, sent) => ({ w: toks[j].text, s, e, asr: false, sent, unit: toks[j].unit, joinNext: !!toks[j].joinNext });
      let inserted = 0, keptAsr = 0;

      // Từ ASR mà phụ đề người làm lược bỏ nhưng người nói VẪN NÓI (you know, I mean, um, lặp từ...): giữ lại, để người học
      // chép chính tả đúng với những gì nghe được. Các từ này được gắn vào câu của từ người làm đứng cạnh (không tách thành câu riêng).
      const pushKept = (idxs, jPrev, jNext) => {
        const kept = idxs.filter((i) => flat[i].norm !== '' && !/^\[[^\]]*\][.!?,]*$/.test(String(flat[i].w).trim()));
        if (!kept.length) return;
        // Lặp đúng 1 từ (\"I I had\", \"the the\"): gộp thành 1, bỏ từ thừa. Lặp cả cụm từ 2 từ trở lên (\"we went to the, we went to the store\") thì giữ.
        const adj = [toks[jPrev].norm, toks[jNext] ? toks[jNext].norm : ''];
        if (kept.every((i) => flat[i].norm !== '' && adj.includes(flat[i].norm))) return;
        const startsNew = aicEndsSentence(toks[jPrev].text, toks[jPrev + 1] ? toks[jPrev + 1].text : '');   // câu trước đã kết thúc -> mở đầu câu kế
        const unit = startsNew ? toks[jNext].unit : toks[jPrev].unit;
        const first = items.length;
        kept.forEach((i) => {
          let w = flat[i].auto ? String(flat[i].w).replace(/[.?!]+$/, '') : flat[i].w;
          if (/^i(?:'(?:m|ll|d|ve))?$/.test(w)) w = 'I' + w.slice(1);   // đại từ \"I\" luôn viết hoa
          items.push({ w, s: flat[i].s, e: flat[i].e, asr: true, auto: false, sent: flat[i].sent, unit });
        });
        keptAsr += kept.length;
        if (startsNew) {
          if (useManualSentences) {
            items[first].w = items[first].w.charAt(0).toUpperCase() + items[first].w.slice(1);
            const phrase = kept.map((i) => flat[i].norm).join(' ');
            if (MC_FILLER_PHRASES.some((ph) => ph.join(' ') === phrase)) {
              // \"Um, so I want...\": tiếng đệm mở đầu câu -> thêm dấu phẩy, từ người làm đứng sau hạ chữ hoa (xem bước hậu xử lý bên dưới)
              const last = items[items.length - 1];
              if (!/[,.;:!?\u2014\u2013]$/.test(last.w)) last.w += ',';
              last.lowerNext = true;
            }
          }
        } else if (MC_PAREN_FILLERS.has(kept.map((i) => flat[i].norm).join(' '))) {
          // "is, you know, you're": chèn dấu phẩy quanh cụm chêm giữa câu (nếu chưa có dấu câu)
          const prev = items[first - 1], last = items[items.length - 1];
          if (prev && !prev.joinNext && !/[,.;:!?\u2014\u2013)\"'\u201d\u2019]$/.test(prev.w)) {
            prev.w += ',';
            if (!/[,.;:!?\u2014\u2013)\"'\u201d\u2019]$/.test(last.w)) last.w += ',';
          }
        }
      };

      for (let i = 0; i < anchors[0].i0; i++) pushAsr(i);   // ASR trước đoạn khớp đầu tiên (người làm không có): giữ nguyên

      for (let k = 0; k < anchors.length; k++) {
        const a = anchors[k];
        const cur = manualItem(a.j, flat[a.i0].s, flat[a.i1].e, flat[a.i0].sent);
        items.push(cur);
        const nx = anchors[k + 1];
        if (!nx) break;

        const gapA = [];
        for (let i = a.i1 + 1; i < nx.i0; i++) if (!MC_HESITATIONS.has(flat[i].norm)) gapA.push(i);
        const gapM = [];
        for (let j = a.j + 1; j < nx.j; j++) gapM.push(j);

        const useManualGap = gapM.length >= 3 || (gapM.length > 0 && gapA.length < 7);
        if (useManualGap) {
          const gm = gapM.map((j) => toks[j]);
          // Đoạn ASR dài hơn đoạn người làm và có tiếng đệm (you know, I mean, um...) ở đầu/cuối: tách ra giữ lại, phần còn lại mới thay bằng chữ người làm
          let ga = gapA, lead = [], trail = [];
          if (gapA.length > gapM.length) { const p = mcPeelFillers(gapA, flat, gapM.length); ga = p.rest; lead = p.lead; trail = p.trail; }
          pushKept(lead, a.j, gapM[0]);
          if (ga.length) {
            // ASR có các từ ở đây (nhưng không khớp chữ): dùng đúng khoảng thời gian đó cho các từ người làm
            const times = mcSpread(gm, flat[ga[0]].s, flat[ga[ga.length - 1]].e);
            gapM.forEach((j, q) => items.push(manualItem(j, times[q].s, times[q].e, flat[ga[0]].sent)));
          } else {
            // ASR bỏ sót hẳn từ này: "mượn" thời gian của từ khớp liền trước + khoảng trống phía sau
            const gapTime = Math.max(0, flat[nx.i0].s - cur.e);
            const extra = Math.min(gapTime, 0.2 * gm.length);
            const times = mcSpread([toks[a.j]].concat(gm), cur.s, cur.e + extra);
            cur.s = times[0].s; cur.e = times[0].e;
            gapM.forEach((j, q) => items.push(manualItem(j, times[q + 1].s, times[q + 1].e, cur.sent)));
          }
          pushKept(trail, gapM[gapM.length - 1], nx.j);
          inserted += gapM.length;
        } else if (gapA.length >= 7) {
          gapA.forEach(pushAsr);   // người làm cắt bớt lời nói -> vẫn giữ phần ASR nghe được
        } else if (gapA.length) {
          pushKept(gapA, a.j, nx.j);   // vài từ ASR người làm không viết (you know, um, lặp từ...) nhưng người nói có nói -> GIỮ
        }
      }

      for (let i = anchors[anchors.length - 1].i1 + 1; i < n; i++) pushAsr(i);   // ASR sau đoạn khớp cuối: giữ nguyên

      // Thời gian phải tăng dần, các từ không chồng lên nhau
      for (let k = 0; k < items.length - 1; k++) {
        const a = items[k], b = items[k + 1];
        if (b.s < a.s) b.s = a.s;
        if (b.e < b.s + 0.05) b.e = b.s + 0.05;
        if (a.e > b.s) a.e = Math.max(a.s + 0.05, b.s);
      }

      // Từ người làm đứng ngay sau tiếng đệm mở câu (\"Um, So...\"): hạ chữ hoa nếu là từ thường gặp (không đụng tới tên riêng và \"I\")
      for (let k = 0; k < items.length - 1; k++) {
        if (!items[k].lowerNext) continue;
        const nw = items[k + 1];
        if (nw && !nw.asr && MC_LOWER_AFTER_FILLER.has(nw.w.toLowerCase().replace(/[^a-z']/g, ''))) nw.w = nw.w.replace(/^([^A-Za-z]*)([A-Z])/, (m, p, c) => p + c.toLowerCase());
      }

      // Gom thành câu
      items.forEach((it) => {
        if (it.asr) it.g = (useManualSentences && it.unit !== undefined) ? it.unit : 'a' + it.sent;   // từ ASR được giữ lại thì nằm chung câu với từ người làm bên cạnh
        else it.g = useManualSentences ? it.unit : 's' + it.sent;
      });
      if (!useManualSentences) items.forEach((it) => { if (it.asr) it.g = 's' + it.sent; });

      const groups = [];
      items.forEach((it) => {
        const w = { word: it.w, startTime: it.s, endTime: it.e };
        if (it.joinNext) w.joinNext = true;
        if (it.asr && it.auto) w.autoPunct = true;
        const last = groups[groups.length - 1];
        if (last && last.g === it.g) last.words.push(w);
        else groups.push({ g: it.g, words: [w] });
      });

      const out = [];
      groups.forEach((g) => {
        const pieces = useManualSentences ? aicSplitLongWords(g.words, 50) : [g.words];
        pieces.forEach((ws) => {
          ws[ws.length - 1].joinNext = false;
          if (!useManualSentences) {
            const lw = ws[ws.length - 1];
            if (!/[.!?\u2026]["'\u201d\u2019)]*$/.test(lw.word)) { lw.word += '.'; lw.autoPunct = true; }
          }
          out.push(ws);
        });
      });

      const result = out.map((ws, idx) => ({
        id: idx + 1,
        startTime: ws[0].startTime,
        endTime: ws[ws.length - 1].endTime,
        text: aicComposeText(ws),
        words: ws
      }));
      for (let k = 0; k < result.length - 1; k++) {
        const nextStart = result[k + 1].startTime;
        if (result[k].endTime > nextStart) {
          result[k].endTime = nextStart;
          const lw = result[k].words[result[k].words.length - 1];
          if (lw.endTime > nextStart) lw.endTime = nextStart;
        }
      }

      return {
        ok: true,
        sentences: result,
        stats: {
          asrWords: n,
          manualWords: toks.length,
          matched: anchors.length,
          inserted,
          keptAsr,
          coverage: Math.round((anchors.length / toks.length) * 100),
          sentenceCount: result.length,
          usedManualSentences: useManualSentences
        }
      };
    }

    // (2) BẢN DỊCH SONG NGỮ: AI trả lời xen kẽ "câu Anh / câu Việt" (cùng dòng hoặc khác dòng).
    // Bản theo DÒNG (video): mỗi dòng AI trả lời là một đoạn. Một dòng có thể chứa cả Anh lẫn Việt không có dấu . ? ! ở giữa
    // (vd. "So, you know—you get started a little slowly, Nghĩa là, bạn biết đấy—...,"), nên tìm điểm chuyển ngôn ngữ trong dòng:
    // chọn vị trí k sao cho các từ trước k là tiếng Pháp (có trong phụ đề gốc, không có dấu tiếng Việt) và các từ sau k là tiếng Việt.
    function aicParseBilingualLines(raw, vocab) {
      const lines = aicCleanRaw(raw).split('\n').map((x) => x.trim()).filter(Boolean);
      const segs = [];
      const pushSegs = (toks, lang) => {
        let cur = [];
        toks.forEach((t, k) => {
          cur.push(t);
          if (aicEndsSentence(t, toks[k + 1])) { segs.push({ lang, text: cur.join(' ') }); cur = []; }
        });
        if (cur.length) segs.push({ lang, text: cur.join(' ') });   // hết dòng / hết phần Anh mà chưa có dấu kết câu: vẫn là một đoạn
      };
      let prevPureEn = false;   // dòng ngay trước là dòng thuần tiếng Pháp (định dạng xen kẽ Anh / Việt)
      lines.forEach((line) => {
        const toks = line.split(/\s+/);
        const n = toks.length;
        const f = toks.map((t) => { const nm = aicNorm(t); return { viU: AIC_VI_UNIQUE.test(t), has: !!nm, inV: vocab.has(nm) }; });
        const pre = [0];
        for (let i = 0; i < n; i++) pre.push(pre[i] + (f[i].viU ? 3 : (f[i].has && !f[i].inV ? 1 : 0)));
        const suf = new Array(n + 1).fill(0);
        for (let i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] + ((!f[i].viU && f[i].has && f[i].inV) ? 1 : 0);
        let best = 0, bestCost = Infinity;
        for (let k = 0; k <= n; k++) {
          let cut = 0;
          if (k > 0 && k < n) {
            // Chỉ cho phép cắt giữa dòng (Anh | Việt) tại một RANH GIỚI thật. Dòng Việt mở đầu bằng chuỗi tên riêng tiếng Pháp
            // (vd "Thomas Jefferson, John Adams, George Washington, chỉ là ba...") trước đây bị cắt nhầm ngay sau dấu phẩy -> mất bản dịch của câu trước.
            const last = toks[k - 1];
            const isBoundary = aicEndsSentence(last, toks[k]) || /[\u2014\u2013][\"'\u201d)]*$/.test(last);
            if (/[,;:][\"'\u201d)]*$/.test(last)) continue;   // phần "Anh" dừng giữa câu (dấu phẩy...) -> chưa phải ranh giới Anh/Việt
            if (prevPureEn && !isBoundary) continue;           // dòng ngay sau một dòng Anh là dòng Việt: không tách tên riêng ở đầu dòng ra làm dòng Anh
            cut = 2.5;   // cắt giữa dòng cần bằng chứng rõ
          }
          const cost = pre[k] + suf[k] + cut;
          if (cost < bestCost - 1e-9) { bestCost = cost; best = k; }
        }
        prevPureEn = (best === n);
        if (best > 0) pushSegs(toks.slice(0, best), 'source');
        if (best < n) pushSegs(toks.slice(best), 'vi');
      });
      const blocks = [];
      let cur = null;
      segs.forEach((sg) => {
        if (sg.lang === 'source') {
          if (!cur || cur.vi.length > 0) { cur = { source: [], vi: [] }; blocks.push(cur); }
          cur.source.push(sg.text);
        } else if (cur) cur.vi.push(sg.text);
      });
      const units = [];
      blocks.forEach((b, bi) => {
        let vi = b.vi;
        if (bi === blocks.length - 1 && vi.length > b.source.length) vi = vi.slice(0, Math.max(1, b.source.length));
        b.source.forEach((sourceText, k) => {
          let v = '';
          if (vi.length === b.source.length) v = vi[k];
          else if (vi.length > 0 && k === b.source.length - 1) v = vi.join(' ');
          units.push({ source: sourceText, vi: v.trim() });
        });
      });
      // Nhóm "câu theo dấu chấm": các đoạn liên tiếp cho tới khi gặp đoạn kết thúc bằng . ? !
      let gc = 0;
      units.forEach((u) => {
        u.g = gc;
        const tk = u.source.trim().split(/\s+/);
        if (aicEndsSentence(tk[tk.length - 1], '')) gc++;
      });
      return units;
    }

    function aicParseBilingual(raw, vocab, lineChunks) {
      if (lineChunks) {
        const lu = aicParseBilingualLines(raw, vocab);
        if (lu.length && lu.some((x) => x.vi)) return lu;   // không nhận ra theo dòng -> quay về cách cũ
      }
      const lines = aicCleanRaw(raw).split('\n').map((s) => s.trim()).filter(Boolean);
      const classify = (text) => {
        const toks = text.split(/\s+/).map(aicNorm).filter(Boolean);
        let inVocab = 0;
        toks.forEach((t) => { if (vocab.has(t)) inVocab++; });
        const ratio = toks.length ? inVocab / toks.length : 0;
        let lang;
        if (ratio >= 0.45) lang = 'source';
        else if (AIC_VI_UNIQUE.test(text) || ratio < 0.4) lang = 'vi';
        else lang = 'source';
        return { lang, text };
      };
      const segs = [];
      lines.forEach((line) => {
        const toks = line.split(/\s+/);
        let cur = [];
        toks.forEach((t, k) => {
          cur.push(t);
          if (aicEndsSentence(t, toks[k + 1])) { segs.push(classify(cur.join(' '))); cur = []; }
        });
        if (cur.length) segs.push(classify(cur.join(' ')));
      });

      const blocks = [];
      let cur = null;
      segs.forEach((sg) => {
        if (sg.lang === 'source') {
          if (!cur || cur.vi.length > 0) { cur = { source: [], vi: [] }; blocks.push(cur); }
          cur.source.push(sg.text);
        } else if (cur) {
          cur.vi.push(sg.text);
        }
      });

      const units = [];
      blocks.forEach((b, bi) => {
        let vi = b.vi;
        if (bi === blocks.length - 1 && vi.length > b.source.length) vi = vi.slice(0, Math.max(1, b.source.length));
        b.source.forEach((sourceText, k) => {
          let v = '';
          if (vi.length === b.source.length) v = vi[k];
          else if (vi.length > 0 && k === b.source.length - 1) v = vi.join(' ');
          units.push({ source: sourceText, vi: v.trim() });
        });
      });
      return units;
    }

    function applyBilingualFromAi(sents, aiText, opts) {
      const lineChunks = !!(opts && opts.lineChunks);
      let textToParse = aiText;
      const cbMatch = String(aiText || '').match(/```[a-z]*\s*\n([\s\S]*?)\n```/i);
      if (cbMatch) textToParse = cbMatch[1];
      const flat = aicFlatten(sents);
      const vocab = new Set(flat.map((f) => f.norm).filter(Boolean));
      const units = aicParseBilingual(textToParse, vocab, lineChunks);
      if (!units.length) return { ok: false, error: 'Không nhận ra được các cặp câu tiếng Pháp – tiếng Việt trong câu trả lời. Hãy kiểm tra lại nội dung đã dán.' };
      let tokens = [];
      const unitVi = [], unitGrp = [], unitFrenchWords = [];
      units.forEach((u, idx) => {
        tokens = tokens.concat(aicTokenize(u.source, idx));
        unitFrenchWords.push(new Set(u.source.split(/\s+/).map(aicNorm).filter(Boolean)));
        unitVi.push(u.vi);
        unitGrp.push(u.g);
      });
      if (!unitVi.some(Boolean)) return { ok: false, error: 'Không tìm thấy phần tiếng Việt trong câu trả lời. Hãy dán cả câu tiếng Pháp lẫn bản dịch tiếng Việt của AI.' };
      return aicRun(sents, tokens, unitVi, 'trans', (lineChunks && units[0].g !== undefined) ? unitGrp : undefined, unitFrenchWords);
    }

    // Tỉ lệ từ có dấu câu THẬT (không tính dấu chấm do app tự chèn theo khoảng lặng) -> phát hiện phụ đề "không dấu câu".
    function aicPunctuationDensity(sents) {
      let total = 0, punct = 0;
      (sents || []).forEach((s) => (s.words || []).forEach((w) => {
        total++;
        if (!w.autoPunct && /[.,?!;:]["')\u201d]*$/.test(w.word)) punct++;
      }));
      return total ? punct / total : 1;
    }

    // Transcript thuần văn bản để đưa vào prompt (không timecode). Bỏ dấu chấm app tự chèn.
    function aicPlainTranscript(sents) {
      let out = '';
      (sents || []).forEach((s) => {
        const ws = s.words && s.words.length ? s.words : String(s.text || '').split(/\s+/).filter(Boolean).map((w) => ({ word: w }));
        ws.forEach((w) => {
          out += (w.autoPunct ? w.word.replace(/[.?!]+$/, '') : w.word) + (w.joinNext ? '' : ' ');
        });
      });
      return out.trim();
    }

    function aicHasTranslation(sents) {
      return (sents || []).some((s) => s.vi && String(s.vi).trim());
    }

    function changeSubtitleFontSize(delta) {
      const newSize = Math.max(13, Math.min(32, currentSubFontSize + delta));
      if (newSize === currentSubFontSize) return;
      applySubtitleFontSize(newSize);
      saveUserPreferences();
    }

    function resetSubtitleFontSize() {
      if (currentSubFontSize === DEFAULT_SUB_FONT_SIZE) return;
      applySubtitleFontSize(DEFAULT_SUB_FONT_SIZE);
      saveUserPreferences();
    }

    function applySubtitleFontSize(size) {
      const container = document.getElementById('subtitles-scroll-container');
      if (!container) return;

      let anchorEl = currentHighlightedWordEl;
      if (!anchorEl) {
        const activeCard = container.querySelector('.sub-item-active');
        if (activeCard) anchorEl = activeCard;
      }

      let anchorOffsetBefore = 0;
      if (anchorEl) {
        anchorOffsetBefore = anchorEl.getBoundingClientRect().top - container.getBoundingClientRect().top;
      }

      currentSubFontSize = size;
      const transSize = Math.max(12, Math.round(size * 0.95)); // tỉ lệ chữ Việt / chữ Anh (VI_SIZE_RATIO)
      document.documentElement.style.setProperty('--sub-font-size', `${currentSubFontSize}px`);
      document.documentElement.style.setProperty('--sub-trans-size', `${transSize}px`);
      try { if (window.VP) VP.onRightSize(); } catch (e) {}   // nút CC: cập nhật số cỡ chữ nếu đang theo cỡ chữ bên phải

      if (anchorEl) {
        requestAnimationFrame(() => {
          const anchorOffsetAfter = anchorEl.getBoundingClientRect().top - container.getBoundingClientRect().top;
          const diff = anchorOffsetAfter - anchorOffsetBefore;
          if (Math.abs(diff) > 0.5) {
            container.scrollTop += diff;
          }
        });
      }
    }

    function changeSubtitleLineHeight(delta) {
      currentTextLineHeight = Math.max(1.15, Math.min(2.0, Number((currentTextLineHeight + delta).toFixed(2))));
      currentTextGap = Math.max(4, Math.min(20, Math.round(currentTextGap + delta * 15)));
      applySubtitleLineHeight();
      saveUserPreferences();
    }

    function resetSubtitleLineHeight() {
      currentCardLineHeight = 1.30;
      currentTextLineHeight = 1.42;
      currentTextGap = 8;
      applySubtitleLineHeight();
      saveUserPreferences();
    }

    function applySubtitleLineHeight() {
      document.documentElement.style.setProperty('--sub-card-line-height', `${currentCardLineHeight}`);
      document.documentElement.style.setProperty('--sub-textmode-line-height', `${currentTextLineHeight}`);
      document.documentElement.style.setProperty('--sub-textmode-gap', `${currentTextGap}px`);
    }

    function initSplitResizer() {
      const resizer = document.getElementById('split-resizer');
      const container = document.getElementById('split-container');
      const leftPanel = document.getElementById('panel-left');
      const rightPanel = document.getElementById('panel-right');
      if (!resizer || !container || !leftPanel || !rightPanel) return;

      let isDragging = false;
      let startX = 0;
      let startLeftWidth = 0;
      let containerWidth = 0;
      let animationFrameId = null;

      const onStart = (clientX) => {
        if (window.innerWidth < 1024) return;
        isDragging = true;
        startX = clientX;
        containerWidth = container.getBoundingClientRect().width;
        startLeftWidth = leftPanel.getBoundingClientRect().width;

        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(f => f.style.pointerEvents = 'none');
      };

      const onMove = (clientX) => {
        if (!isDragging) return;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        animationFrameId = requestAnimationFrame(() => {
          const deltaX = clientX - startX;
          let newLeftWidth = startLeftWidth + deltaX;
          let percentage = (newLeftWidth / containerWidth) * 100;

          if (percentage < 30) percentage = 30;
          if (percentage > 70) percentage = 70;

          const rightPercentage = 100 - percentage;
          leftPanel.style.width = `calc(${percentage}% - 4px)`;
          rightPanel.style.width = `calc(${rightPercentage}% - 4px)`;
        });
      };

      const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        resizer.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(f => f.style.pointerEvents = 'auto');
        ensurePageFocus();
      };

      resizer.addEventListener('mousedown', (e) => {
        onStart(e.clientX);
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (isDragging) onMove(e.clientX);
      });

      window.addEventListener('mouseup', onEnd);

      resizer.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) onStart(e.touches[0].clientX);
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length > 0) onMove(e.touches[0].clientX);
      }, { passive: true });

      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
    }

