/* ============================================================================
   TCF EXAM SIMULATION (MÔ PHỎNG THI NGHE TCF CANADA) - ENGINE
   ============================================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'shadowing_tcf_tests_v1';
  let tcfState = {
    selectedCount: 'auto',
    selectedLevel: 'all',
    currentQuestions: [],
    userAnswers: {},
    isSubmitted: false,
    startTime: 0,
    timerInterval: null,
    audioHidden: false,
    isPlaying: false
  };

  // Helper: Format seconds to mm:ss
  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Helper: Parse mm:ss to seconds
  function parseTimeToSeconds(str) {
    if (!str) return 0;
    const match = String(str).match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Helper: Retrieve active sentences from app state or DOM fallback
  function getSentences() {
    if (typeof window.getCurrentSentences === 'function') {
      try {
        const s = window.getCurrentSentences();
        if (Array.isArray(s) && s.length) return s;
      } catch (e) {}
    }
    if (typeof window.sentences !== 'undefined' && Array.isArray(window.sentences) && window.sentences.length) {
      return window.sentences;
    }
    // Fallback: Read subtitles directly from DOM containers
    const domLines = document.querySelectorAll('#subtitles-scroll-container .sub-line, #text-shadow-subtitles-container .sub-line, #subtitles-container .sub-line');
    if (domLines && domLines.length) {
      const collected = [];
      domLines.forEach((el, idx) => {
        const txtEl = el.querySelector('.sub-text, .subtitle-text, .karaoke-word-container') || el;
        const clone = txtEl.cloneNode(true);
        clone.querySelectorAll('.sub-vi, .sub-trans, .karaoke-time, .vocab-popover').forEach(rm => rm.remove());
        const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
        const st = parseFloat(el.getAttribute('data-start') || el.getAttribute('data-time') || String(idx * 3));
        const et = parseFloat(el.getAttribute('data-end') || String(st + 3));
        if (text) collected.push({ id: idx + 1, text, startTime: st, endTime: et });
      });
      if (collected.length) return collected;
    }
    // Fallback: Check local history
    try {
      const hist = JSON.parse(localStorage.getItem('shadowing_history') || '[]');
      const vid = (typeof window.getCurrentVideoId === 'function' ? window.getCurrentVideoId() : window.currentVideoId) || '';
      if (vid && Array.isArray(hist)) {
        const match = hist.find(h => h.videoId === vid && Array.isArray(h.sentences) && h.sentences.length);
        if (match) return match.sentences;
      }
    } catch (e) {}
    return [];
  }

  // Helper: Get active video metadata
  function getVideoInfo() {
    let id = '';
    let title = '';
    if (typeof window.getCurrentVideoId === 'function') id = window.getCurrentVideoId();
    else if (window.currentVideoId) id = window.currentVideoId;

    if (typeof window.getCurrentVideoTitle === 'function') title = window.getCurrentVideoTitle();
    else if (window.currentVideoTitle) title = window.currentVideoTitle;

    if (!title) {
      const el = document.getElementById('video-title-display') || document.querySelector('.yt-card.active .yt-title');
      if (el) title = el.textContent.trim();
    }
    return {
      id: id || 'current',
      title: title || 'Bài luyện tiếng Pháp'
    };
  }

  // Get transcript stats
  function getTranscriptStats() {
    const sents = getSentences();
    if (!sents.length) {
      return { words: 0, duration: 0, durationFormatted: '00:00', recommendedCount: 5, estLevel: 'B1-B2' };
    }

    let wordCount = 0;
    sents.forEach((s) => {
      const text = String(s.text || '').trim();
      if (text) wordCount += text.split(/\s+/).length;
    });

    const startTime = (sents[0] && typeof sents[0].startTime === 'number') ? sents[0].startTime : 0;
    const lastSent = sents[sents.length - 1];
    const endTime = (lastSent && typeof lastSent.endTime === 'number') ? lastSent.endTime : (startTime + sents.length * 4);
    const duration = Math.max(10, Math.round(endTime - startTime));

    let suggestedRangeText = 'khoảng 3 - 5 câu';
    let suggestedMax = 5;
    if (duration >= 1800 || wordCount >= 3000) {
      suggestedRangeText = 'khoảng 20 - 39 câu';
      suggestedMax = 39;
    } else if (duration >= 900 || wordCount >= 1500) {
      suggestedRangeText = 'khoảng 12 - 25 câu';
      suggestedMax = 25;
    } else if (duration >= 400 || wordCount >= 700) {
      suggestedRangeText = 'khoảng 8 - 15 câu';
      suggestedMax = 15;
    } else if (duration >= 180 || wordCount >= 300) {
      suggestedRangeText = 'khoảng 5 - 8 câu';
      suggestedMax = 8;
    } else {
      suggestedRangeText = 'khoảng 3 - 5 câu';
      suggestedMax = 5;
    }

    let estLevel = 'A2 - B1';
    if (wordCount > 400) estLevel = 'B1 - B2';
    if (wordCount > 1000) estLevel = 'B2 - C1';

    return {
      words: wordCount,
      duration: duration,
      durationFormatted: formatTime(duration),
      suggestedRangeText: suggestedRangeText,
      suggestedMax: suggestedMax,
      maxAllowed: 39,
      recommendedCount: suggestedMax,
      estLevel: estLevel
    };
  }

  // Build Timestamped Transcript for AI
  function buildTimestampedTranscript() {
    const sents = getSentences();
    let out = '';
    sents.forEach((s) => {
      const st = formatTime(s.startTime || 0);
      const et = formatTime(s.endTime || (s.startTime + 3));
      const t = String(s.text || '').trim();
      if (t) out += `[${st} - ${et}] ${t}\n`;
    });
    return out.trim();
  }

  // Build Prompt for AI
  function buildTcfPrompt() {
    const stats = getTranscriptStats();
    const count = tcfState.selectedCount === 'auto' ? stats.recommendedCount : tcfState.selectedCount;
    const level = tcfState.selectedLevel;

    let levelInstruction = '';
    if (level === 'A2-B1') {
      levelInstruction = '- Trọng tâm độ khó: A2 đến B1 (Hội thoại đời sống thường nhật, thông báo, mục đích giao tiếp, thông tin sự kiện cơ bản).\n';
    } else if (level === 'B1-B2') {
      levelInstruction = '- Trọng tâm độ khó: B1 đến B2 (Thảo luận quan điểm, nguyên nhân, công việc, phóng sự, tin tức xã hội).\n';
    } else if (level === 'B2-C1') {
      levelInstruction = '- Trọng tâm độ khó: B2 đến C1 (Chương trình phân tích chuyên sâu, hàm ý - implicite, thái độ của người nói, tông giọng và kết luận).\n';
    } else {
      levelInstruction = '- Trọng tâm độ khó: Đa cấp độ phân hóa theo chuẩn đề TCF (từ các câu đầu A2/B1 hỏi ý chính, đến các câu B2/C1 hỏi nguyên nhân sâu xa, thái độ, bẫy nghe).\n';
    }

    let countInstruction = '';
    if (tcfState.selectedCount === 'auto') {
      countInstruction = `Căn cứ theo chuẩn đề thi Nghe hiểu TCF Canada (Compréhension Orale gồm 39 câu), dựa vào khối lượng thông tin và thời lượng thực tế của bản ghi âm lời thoại (${stats.words} từ, thời lượng ${stats.durationFormatted}), hãy TỰ ĐỘNG THẨM ĐỊNH VÀ QUYẾT ĐỊNH SỐ LƯỢNG CÂU HỎI PHÙ HỢP NHẤT, MIỄN LÀ TUYỆT ĐỐI KHÔNG VƯỢT QUÁ 39 CÂU (TỐI ĐA 39 CÂU).
   - Hãy rải đều các câu hỏi theo trục thời gian từ đầu đến cuối bài nghe (${stats.suggestedRangeText}), không hỏi dồn cục vào một đoạn ngắn, không hỏi vụn vặt và không hỏi lặp ý.`;
    } else {
      countInstruction = `Hãy biên soạn chính xác đúng ${count} câu hỏi trắc nghiệm QCM (chuẩn TCF Canada) rải đều nội dung bài nghe từ đầu đến cuối (tối đa không quá ${count} câu).`;
    }

    const transcript = buildTimestampedTranscript();

    return `Bạn là một Chuyên gia Khảo thí Ngôn ngữ Pháp hàng đầu thuộc France Éducation international (Bộ Giáo dục Pháp), phụ trách biên soạn đề thi trắc nghiệm phần Nghe hiểu (Compréhension Orale) cho kỳ thi TCF Canada (Test de connaissance du français pour le Canada).

NHIỆM VỤ CỦA BẠN:
Đọc kỹ bản ghi âm lời thoại tiếng Pháp có mốc thời gian [mm:ss - mm:ss] được cung cấp bên dưới, và biên soạn một bộ đề thi trắc nghiệm mô phỏng đề thi nghe TCF Canada thực tế.

CÁC TIÊU CHUẨN KHẢO THÍ TCF BẮT BUỘC TUÂN THỦ:
1. SỐ LƯỢNG CÂU HỎI:
   - ${countInstruction}
   - BẮT BUỘC PHẢI TẠO ĐỦ CÁC CÂU HỎI. TUYỆT ĐỐI KHÔNG TRẢ VỀ MẢNG RỖNG [] HAY TỪ CHỐI TẠO ĐỀ.

2. CẤP ĐỘ CEFR:
${levelInstruction}
3. DẠNG CÂU HỎI TRẮC NGHIỆM (QCM) 4 LỰA CHỌN (A, B, C, D) HOÀN TOÀN BẰNG TIẾNG PHÁP:
   - Các trục câu hỏi khai thác chuẩn TCF:
     + Ý chính / Bối cảnh: "Quel est le sujet principal... ?", "Pourquoi la personne appelle-t-elle... ?", "Où se déroule cette scène ?"
     + Chi tiết / Nguyên nhân: "Pourquoi... ?", "Quelle condition est nécessaire... ?", "Qu'est-ce qui est reproché... ?"
     + Thái độ / Hàm ý: "Quelle est l'attitude du locuteur vis-à-vis de... ?", "Que sous-entend la personne en disant que... ?"
4. BẪY NGHE VÀ NGUYÊN TẮC PARAPHRASE CHUẨN TCF:
   - Đáp án ĐÚNG phải được DIỄN GIẢI LẠI (paraphrase) bằng từ đồng nghĩa hoặc cấu trúc tương đương, TUYỆT ĐỐI KHÔNG lặp lại nguyên văn từng chữ trong lời thoại.
   - 3 đáp án SAI (distracteurs) phải là các bẫy nghe logic (sử dụng từ vựng có xuất hiện trong bài nhưng bị bóp méo ý nghĩa, thông tin sai sự thật, hoặc ý kiến trái ngược).
5. MỐC THỜI GIAN (TIMESTAMP):
   - Mỗi câu hỏi phải chỉ rõ mốc thời gian [mm:ss - mm:ss] trong bài thoại chứa dữ liệu trả lời để người học nghe lại (ví dụ "time": "00:45 - 01:15", "timeSeconds": 45).
6. GIẢI THÍCH CHI TIẾT BẰNG TIẾNG VIỆT:
   - Dịch nghĩa câu hỏi và đáp án đúng.
   - Chỉ rõ bẫy nghe (Piège TCF) khiến người nghe dễ chọn nhầm phương án gây nhiễu.
   - Trích dẫn câu thoại tiếng Pháp làm bằng chứng (quote).

QUY TẮC ĐỊNH DẠNG ĐẦU RA:
- Trả về kết quả thuần JSON hợp lệ nằm trong DUY NHẤT MỘT khối code (\`\`\`json ... \`\`\`).
- TUYỆT ĐỐI KHÔNG viết bất kỳ lời dẫn giải, chào hỏi hay văn bản nào bên ngoài khối code JSON.

Cấu trúc JSON bắt buộc:
\`\`\`json
[
  {
    "id": 1,
    "level": "A2",
    "type": "Idée générale",
    "question": "Quel est le sujet principal de cet extrait ?",
    "options": {
      "A": "L'organisation d'un voyage à l'étranger",
      "B": "La recherche d'un nouveau logement",
      "C": "Un changement de poste professionnel",
      "D": "La préparation d'une fête de famille"
    },
    "answer": "B",
    "time": "00:25 - 00:55",
    "timeSeconds": 25,
    "quote": "Je consulte des annonces pour louer un appartement plus grand.",
    "explain": "Người phụ nữ đang xem các tin đăng để thuê một căn hộ lớn hơn. Các phương án khác không được thảo luận.",
    "piege": "Có nhắc đến từ 'voyage' nhưng chỉ là kỷ niệm quá khứ, không phải chủ đề chính của cuộc trò chuyện."
  }
]
\`\`\`

Bản ghi lời thoại tiếng Pháp kèm mốc thời gian của bài nghe:
<<<
${transcript}
>>>`;
  }

  // Parse AI Response
  function parseTcfResponse(rawText) {
    if (!rawText || !rawText.trim()) return [];

    let cleanJson = '';
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (jsonMatch) {
      cleanJson = jsonMatch[1].trim();
    } else {
      const firstBracket = rawText.indexOf('[');
      const lastBracket = rawText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        cleanJson = rawText.slice(firstBracket, lastBracket + 1).trim();
      } else {
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          cleanJson = rawText.slice(firstBrace, lastBrace + 1).trim();
        }
      }
    }

    // Helper: Normalize options
    function normalizeOptions(opts) {
      const res = { A: '', B: '', C: '', D: '' };
      if (!opts) return res;
      if (Array.isArray(opts)) {
        opts.forEach((item, idx) => {
          const k = ['A', 'B', 'C', 'D'][idx] || 'A';
          if (typeof item === 'string') {
            const m = item.match(/^([A-D])[\.\:\)]\s*(.*)$/i);
            if (m) res[m[1].toUpperCase()] = m[2].trim();
            else res[k] = item.trim();
          } else if (item && typeof item === 'object') {
            const key = String(item.key || item.option || item.id || k).toUpperCase();
            res[key] = String(item.text || item.value || item.content || '').trim();
          }
        });
      } else if (typeof opts === 'object') {
        ['A', 'B', 'C', 'D'].forEach(k => {
          res[k] = String(opts[k] || opts[k.toLowerCase()] || '').trim();
        });
      }
      return res;
    }

    // Helper: Normalize answer
    function normalizeAnswer(ans) {
      if (!ans) return 'A';
      const str = String(ans).replace(/^(?:option|choix|réponse|đáp án|answer)\s*[:\.]?\s*/i, '').trim();
      const m = str.match(/^[A-D]/i);
      return m ? m[0].toUpperCase() : 'A';
    }

    if (cleanJson) {
      try {
        const parsed = JSON.parse(cleanJson);
        let itemsArr = null;
        if (Array.isArray(parsed)) {
          itemsArr = parsed;
        } else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.questions)) itemsArr = parsed.questions;
          else if (Array.isArray(parsed.exam)) itemsArr = parsed.exam;
          else if (Array.isArray(parsed.data)) itemsArr = parsed.data;
          else if (Array.isArray(parsed.items)) itemsArr = parsed.items;
          else {
            const arrVal = Object.values(parsed).find(v => Array.isArray(v) && v.length && typeof v[0] === 'object');
            if (arrVal) itemsArr = arrVal;
          }
        }

        if (itemsArr && itemsArr.length > 0) {
          return itemsArr.map((item, idx) => {
            const opts = normalizeOptions(item.options);
            return {
              id: item.id || (idx + 1),
              level: String(item.level || 'B1').toUpperCase().trim(),
              type: item.type || 'Compréhension',
              question: String(item.question || '').trim(),
              options: opts,
              answer: normalizeAnswer(item.answer || item.correctAnswer || item.correct_answer),
              time: String(item.time || '').trim(),
              timeSeconds: typeof item.timeSeconds === 'number' ? item.timeSeconds : parseTimeToSeconds(item.time),
              quote: String(item.quote || '').trim(),
              explain: String(item.explain || item.explanation || '').trim(),
              piege: String(item.piege || item.trap || '').trim()
            };
          }).filter(q => q.question && q.options.A && q.options.B);
        }
      } catch (e) {
        console.warn('JSON parse failed, trying regex fallback:', e);
      }
    }

    // Fallback regex parser if AI returns text format
    const questions = [];
    const blocks = rawText.split(/(?=\d+[\.\)]\s+)/g);
    blocks.forEach((block, idx) => {
      if (!block.trim()) return;
      const qMatch = block.match(/\d+[\.\)]\s*(?:\[(.*?)\])?\s*(.*?)(?=\n[A-D][\.\)]|\n\s*[A-D]\b)/s);
      const aMatch = block.match(/A[\.\)]\s*(.*?)(?=\nB[\.\)]|\n\s*B\b)/s);
      const bMatch = block.match(/B[\.\)]\s*(.*?)(?=\nC[\.\)]|\n\s*C\b)/s);
      const cMatch = block.match(/C[\.\)]\s*(.*?)(?=\nD[\.\)]|\n\s*D\b)/s);
      const dMatch = block.match(/D[\.\)]\s*(.*?)(?=\n(?:Đáp án|Answer|Trích dẫn|Giải thích|\d+[\.\)])|$)/s);
      const ansMatch = block.match(/(?:Đáp án|Answer|Bonne réponse)\s*:\s*([A-D])/i);
      const timeMatch = block.match(/\[(\d{1,2}:\d{2}(?:\s*-\s*\d{1,2}:\d{2})?)\]/);
      const expMatch = block.match(/(?:Giải thích|Explication)\s*:\s*(.*?)(?=\n(?:Bẫy nghe|Piège|\d+[\.\)])|$)/s);
      const piegeMatch = block.match(/(?:Bẫy nghe|Piège)\s*:\s*(.*?)(?=\n\d+[\.\)]|$)/s);

      if (qMatch && aMatch && bMatch) {
        questions.push({
          id: idx + 1,
          level: qMatch[1] || 'B1',
          type: 'Compréhension',
          question: qMatch[2].trim(),
          options: {
            A: aMatch[1].trim(),
            B: bMatch[1].trim(),
            C: cMatch ? cMatch[1].trim() : '',
            D: dMatch ? dMatch[1].trim() : ''
          },
          answer: ansMatch ? ansMatch[1].toUpperCase() : 'A',
          time: timeMatch ? timeMatch[1] : '',
          timeSeconds: timeMatch ? parseTimeToSeconds(timeMatch[1]) : 0,
          quote: '',
          explain: expMatch ? expMatch[1].trim() : '',
          piege: piegeMatch ? piegeMatch[1].trim() : ''
        });
      }
    });

    return questions;
  }

  // Local Storage Helpers
  function getSavedTestsMap() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function getSavedTest(videoId) {
    if (!videoId) return null;
    const map = getSavedTestsMap();
    return map[videoId] || null;
  }

  function saveTestToStorage(videoId, testData) {
    if (!videoId) return;
    try {
      const map = getSavedTestsMap();
      map[videoId] = Object.assign({ updatedAt: Date.now() }, testData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch (e) {}
  }

  // Ensure DOM for TCF Modal
  function ensureTcfModalElement() {
    let modal = document.getElementById('tcf-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'tcf-modal';
    modal.className = 'ai-modal-backdrop';
    modal.onmousedown = function (e) { if (e.target === this) closeTcfModal(); };

    modal.innerHTML = `
      <div class="ai-modal" role="dialog" aria-modal="true">
        <div class="ai-modal-head">
          <div class="ai-modal-title" style="display:flex;align-items:center;gap:8px;">
            <span>🇨🇦</span>
            <span>Thi thử TCF Canada (Compréhension Orale)</span>
          </div>
          <button type="button" class="ai-modal-close" onclick="TcfExam.closeModal()" title="Đóng (Esc)"><i data-lucide="x"></i></button>
        </div>

        <div id="tcf-input-view">
          <div class="tcf-brand-badge">🍁 Mô phỏng khảo thí France Éducation international</div>
          <p class="ai-step-text" style="margin-bottom:8px">
            Tạo bộ đề thi nghe trắc nghiệm TCF (QCM 4 đáp án) dựa trên lời thoại video. Nghe 1 lần duy nhất, chấm điểm và xem giải thích chi tiết bẫy nghe (pièges).
          </p>

          <!-- Saved Test Alert Banner -->
          <div id="tcf-saved-box" style="display:none" class="tcf-saved-alert">
            <div>
              <b>✨ Đã có đề thi được lưu cho video này!</b>
              <div id="tcf-saved-info" style="font-size:12px;opacity:0.85"></div>
            </div>
            <button type="button" class="tcf-btn-retake-saved" onclick="TcfExam.loadSavedExam()">⚡ Làm lại đề ngay</button>
          </div>

          <!-- Analysis stats -->
          <div class="tcf-analysis-card" id="tcf-stats-box"></div>

          <!-- Options: Question Count -->
          <div class="tcf-options-group">
            <label class="tcf-options-label">Số lượng câu hỏi:</label>
            <div class="tcf-chips-row" id="tcf-count-chips">
              <button type="button" class="tcf-chip active" data-count="auto" onclick="TcfExam.selectCount('auto')">✨ Tự động theo bài (Tối đa 39 câu)</button>
              <button type="button" class="tcf-chip" data-count="5" onclick="TcfExam.selectCount(5)">5 câu (Nhanh)</button>
              <button type="button" class="tcf-chip" data-count="10" onclick="TcfExam.selectCount(10)">10 câu (Tiêu chuẩn)</button>
              <button type="button" class="tcf-chip" data-count="20" onclick="TcfExam.selectCount(20)">20 câu (Luyện sâu)</button>
              <button type="button" class="tcf-chip" data-count="39" onclick="TcfExam.selectCount(39)">39 câu (Trọn vẹn 1 đề TCF)</button>
            </div>
          </div>

          <!-- Options: CEFR Level -->
          <div class="tcf-options-group">
            <label class="tcf-options-label">Độ khó mục tiêu:</label>
            <div class="tcf-chips-row" id="tcf-level-chips">
              <button type="button" class="tcf-chip active" data-lvl="all" onclick="TcfExam.selectLevel('all')">✓ Đa cấp độ A2-C1 (Chuẩn TCF)</button>
              <button type="button" class="tcf-chip" data-lvl="A2-B1" onclick="TcfExam.selectLevel('A2-B1')">A2 - B1 (Cơ bản - Trung cấp)</button>
              <button type="button" class="tcf-chip" data-lvl="B1-B2" onclick="TcfExam.selectLevel('B1-B2')">B1 - B2 (Trọng tâm CLB 7)</button>
              <button type="button" class="tcf-chip" data-lvl="B2-C1" onclick="TcfExam.selectLevel('B2-C1')">B2 - C1 (Nâng cao / Hàm ý)</button>
            </div>
          </div>

          <!-- Copy Prompt Row -->
          <div class="ai-copy-row">
            <button type="button" class="ai-btn ai-btn-copy" id="tcf-copy-btn" onclick="TcfExam.copyPrompt(this)">
              <i data-lucide="copy"></i><span>1. Copy prompt cho AI</span>
            </button>
            <span class="ai-open-links">
              <a class="ai-btn ai-open-link" href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="gmg-tcf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4285f4"/><stop offset=".55" stop-color="#9b72cb"/><stop offset="1" stop-color="#d96570"/></linearGradient></defs><path fill="url(#gmg-tcf)" d="M12 0C12 6.63 6.63 12 0 12c6.63 0 12 5.37 12 12 0-6.63 5.37-12 12-12-6.63 0-12-5.37-12-12z"/></svg>
                <span>Mở Gemini</span>
              </a>
              <a class="ai-btn ai-open-link" href="https://claude.ai/" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><g fill="#d97757"><rect x="10.8" y="1" width="2.4" height="22" rx="1.2"/><rect x="10.8" y="1" width="2.4" height="22" rx="1.2" transform="rotate(45 12 12)"/><rect x="10.8" y="1" width="2.4" height="22" rx="1.2" transform="rotate(90 12 12)"/><rect x="10.8" y="1" width="2.4" height="22" rx="1.2" transform="rotate(135 12 12)"/></g></svg>
                <span>Mở Claude</span>
              </a>
            </span>
          </div>

          <!-- Paste text area -->
          <textarea id="tcf-textarea" class="ai-textarea" spellcheck="false" placeholder="2. Dán toàn bộ câu trả lời JSON / trắc nghiệm từ AI vào đây..."></textarea>

          <div class="ai-actions">
            <button type="button" class="ai-btn ai-btn-primary" onclick="TcfExam.applyAnswer()">
              <i data-lucide="check"></i><span>Bắt đầu làm bài thi TCF →</span>
            </button>
            <button type="button" class="ai-btn ai-btn-ghost" onclick="TcfExam.closeModal()">Đóng</button>
          </div>
          <div id="tcf-status" class="ai-status"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    return modal;
  }

  // Ensure DOM for Exam Simulation Overlay
  function ensureExamBackdropElement() {
    let backdrop = document.getElementById('tcf-exam-backdrop');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = 'tcf-exam-backdrop';
    backdrop.className = 'tcf-exam-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');

    backdrop.innerHTML = `
      <div class="tcf-exam-container" id="tcf-exam-container">
        <!-- Header -->
        <div class="tcf-exam-header">
          <div class="tcf-exam-title-box">
            <span class="tcf-exam-badge">TCF CANADA</span>
            <span class="tcf-exam-title" id="tcf-exam-video-title">Bài thi nghe TCF</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;">
            <div class="tcf-exam-timer" id="tcf-exam-timer">⏱ 00:00</div>
            <button type="button" class="tcf-exam-close" onclick="TcfExam.closeExam()" title="Đóng bài thi">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        </div>

        <!-- Audio Player Bar (Exam mode) -->
        <div class="tcf-audio-bar" id="tcf-audio-bar">
          <div style="display:flex;align-items:center;gap:12px;">
            <button type="button" class="tcf-play-btn" id="tcf-exam-play-btn" onclick="TcfExam.togglePlayAudio()">
              <span id="tcf-play-icon">▶</span>
              <span id="tcf-play-text">Bắt đầu nghe bài thi</span>
            </button>
            <div class="tcf-audio-status" id="tcf-audio-status">
              <span id="tcf-status-label">Đang dừng</span>
              <div class="tcf-audio-wave" id="tcf-audio-wave" style="display:none">
                <span></span><span></span><span></span><span></span>
              </div>
            </div>
          </div>
          <div class="tcf-mode-note">⚠️ Quy tắc TCF: Bạn chỉ được nghe audio 1 lần duy nhất để chọn đáp án.</div>
        </div>

        <!-- Questions Scroll Area -->
        <div class="tcf-exam-scroll" id="tcf-exam-scroll"></div>

        <!-- Footer -->
        <div class="tcf-exam-footer" id="tcf-exam-footer">
          <div class="tcf-progress-text" id="tcf-progress-text">Đã chọn: <b>0</b> / 0 câu</div>
          <div style="display:flex;gap:10px;">
            <button type="button" class="ai-btn ai-btn-ghost" onclick="TcfExam.closeExam()">Thoát</button>
            <button type="button" class="tcf-submit-btn" id="tcf-submit-btn" onclick="TcfExam.submitExam()">
              Nộp bài &amp; Xem kết quả ✓
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    return backdrop;
  }

  // Open Modal
  function openTcfModal() {
    ensureTcfModalElement();
    const modal = document.getElementById('tcf-modal');
    if (!modal) return;

    const sents = getSentences();
    const stats = getTranscriptStats();
    const info = getVideoInfo();
    tcfState.selectedCount = 'auto';
    tcfState.selectedLevel = 'all';

    // Render stats
    const statsBox = document.getElementById('tcf-stats-box');
    if (statsBox) {
      if (!sents.length) {
        statsBox.innerHTML = `
          <div style="width:100%;color:#fca5a5;font-size:13px;display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(239,68,68,0.15);border-radius:8px;border:1px solid rgba(239,68,68,0.3)">
            <span>⚠️ Chưa phát hiện nội dung bài nghe. Hãy chọn một video hoặc bài đọc trong phòng luyện trước khi tạo đề TCF.</span>
          </div>
        `;
      } else {
        statsBox.innerHTML = `
          <span class="tcf-stat-item">⏱ Thời lượng: <b>${stats.durationFormatted}</b></span>
          <span class="tcf-stat-item">📝 Tổng số từ: <b>${stats.words.toLocaleString()} từ</b> (${sents.length} câu)</span>
          <span class="tcf-stat-item">🎯 Độ khó ước tính: <b>${stats.estLevel}</b></span>
          <span class="tcf-stat-item" style="color:#60a5fa">🇨🇦 Chuẩn TCF Canada: <b>Tối đa 39 câu</b> (AI tự định lượng, gợi ý: ${stats.suggestedRangeText})</span>
        `;
      }
    }

    // Update count chip label
    const autoChip = document.querySelector('#tcf-count-chips .tcf-chip[data-count="auto"]');
    if (autoChip) {
      autoChip.textContent = `✨ Tự động theo bài (Tối đa 39 câu - Gợi ý: ${stats.suggestedRangeText})`;
    }

    // Check saved test
    const videoId = info.id;
    const saved = getSavedTest(videoId);
    const savedBox = document.getElementById('tcf-saved-box');
    const savedInfo = document.getElementById('tcf-saved-info');
    if (saved && saved.questions && saved.questions.length) {
      if (savedBox) savedBox.style.display = 'flex';
      if (savedInfo) {
        const scoreText = saved.lastScore ? `Điểm lần trước: ${saved.lastScore.correct}/${saved.lastScore.total} (${saved.lastScore.percent}%) · ` : '';
        savedInfo.textContent = `${scoreText}Bộ đề gồm ${saved.questions.length} câu hỏi trắc nghiệm.`;
      }
    } else {
      if (savedBox) savedBox.style.display = 'none';
    }

    // Clear textarea & status
    const ta = document.getElementById('tcf-textarea');
    if (ta) ta.value = '';
    const status = document.getElementById('tcf-status');
    if (status) { status.textContent = ''; status.className = 'ai-status'; }

    modal.classList.add('open');
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }

  function closeTcfModal() {
    const modal = document.getElementById('tcf-modal');
    if (modal) modal.classList.remove('open');
  }

  // Select Count & Level Chips
  function selectCount(count) {
    tcfState.selectedCount = count;
    document.querySelectorAll('#tcf-count-chips .tcf-chip').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-count') === String(count));
    });
  }

  function selectLevel(lvl) {
    tcfState.selectedLevel = lvl;
    document.querySelectorAll('#tcf-level-chips .tcf-chip').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-lvl') === String(lvl));
    });
  }

  // Copy Prompt
  function copyPrompt(btn) {
    const sents = getSentences();
    if (!sents || !sents.length) {
      if (window.showVocabToast) {
        window.showVocabToast('⚠️ Chưa có dữ liệu bài nghe. Vui lòng mở video hoặc bài đọc!', false);
      } else {
        alert('⚠️ Chưa có dữ liệu bài nghe. Vui lòng mở một video hoặc bài đọc!');
      }
      return;
    }
    const text = buildTcfPrompt();
    if (window.copyTextToClipboard) {
      window.copyTextToClipboard(text).then(() => {
        if (window.flashCopied) window.flashCopied(btn, 1800);
        if (window.showVocabToast) window.showVocabToast('✓ Đã copy prompt đề thi TCF vào bộ nhớ tạm!', true);
      }).catch(() => {
        if (window.openManualPromptModal) window.openManualPromptModal(text);
      });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        if (window.showVocabToast) window.showVocabToast('✓ Đã copy prompt đề thi TCF!', true);
      });
    }
  }

  // Apply Answer & Start Exam
  function applyAnswer() {
    const ta = document.getElementById('tcf-textarea');
    const status = document.getElementById('tcf-status');
    if (!ta || !ta.value.trim()) {
      if (status) {
        status.textContent = 'Vui lòng dán câu trả lời của AI vào ô trước khi tiếp tục.';
        status.className = 'ai-status err';
      }
      return;
    }

    const questions = parseTcfResponse(ta.value);
    if (!questions || !questions.length) {
      if (status) {
        status.textContent = 'Không nhận diện được câu hỏi nào từ nội dung dán. Đảm bảo bạn đã sao chép đầy đủ khối JSON hoặc danh sách câu hỏi A, B, C, D từ AI.';
        status.className = 'ai-status err';
      }
      return;
    }

    // Save test for current video
    const info = getVideoInfo();
    const videoId = info.id;
    const videoTitle = info.title;
    saveTestToStorage(videoId, {
      videoId,
      videoTitle,
      questions
    });

    closeTcfModal();
    startExam(questions, videoTitle);
  }

  // Load Saved Exam
  function loadSavedExam() {
    const info = getVideoInfo();
    const videoId = info.id;
    const saved = getSavedTest(videoId);
    if (saved && saved.questions && saved.questions.length) {
      closeTcfModal();
      startExam(saved.questions, saved.videoTitle || info.title || 'Bài thi TCF');
    }
  }

  // ==================== EXAM RUNNER ENGINE ====================
  function startExam(questions, videoTitle) {
    ensureExamBackdropElement();
    const backdrop = document.getElementById('tcf-exam-backdrop');
    if (!backdrop) return;

    tcfState.currentQuestions = questions;
    tcfState.userAnswers = {};
    tcfState.isSubmitted = false;
    tcfState.secondsElapsed = 0;
    tcfState.isPlaying = false;

    // Reset Title
    const titleEl = document.getElementById('tcf-exam-video-title');
    if (titleEl) titleEl.textContent = videoTitle || 'Bài thi nghe TCF Canada';

    // Start Timer
    if (tcfState.timerInterval) clearInterval(tcfState.timerInterval);
    const timerEl = document.getElementById('tcf-exam-timer');
    tcfState.timerInterval = setInterval(() => {
      tcfState.secondsElapsed++;
      if (timerEl) timerEl.textContent = `⏱ ${formatTime(tcfState.secondsElapsed)}`;
    }, 1000);

    // Audio bar reset
    updateAudioBar(false);

    // Render Question Cards
    renderQuestions(questions);

    // Update Progress
    updateProgressCounter();

    // Show Footer
    const footer = document.getElementById('tcf-exam-footer');
    if (footer) footer.style.display = 'flex';

    backdrop.classList.add('open');
  }

  function closeExam() {
    if (tcfState.timerInterval) {
      clearInterval(tcfState.timerInterval);
      tcfState.timerInterval = null;
    }
    // Pause video
    try {
      if (window.ytPlayer && typeof window.ytPlayer.pauseVideo === 'function') {
        window.ytPlayer.pauseVideo();
      }
    } catch (e) {}

    const backdrop = document.getElementById('tcf-exam-backdrop');
    if (backdrop) backdrop.classList.remove('open');
  }

  // Audio Control in Exam
  function togglePlayAudio() {
    const yt = window.ytPlayer;
    if (!yt) return;

    try {
      if (tcfState.isPlaying) {
        if (typeof yt.pauseVideo === 'function') yt.pauseVideo();
        updateAudioBar(false);
      } else {
        if (typeof yt.playVideo === 'function') yt.playVideo();
        updateAudioBar(true);
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  function updateAudioBar(playing) {
    tcfState.isPlaying = playing;
    const playBtn = document.getElementById('tcf-exam-play-btn');
    const playIcon = document.getElementById('tcf-play-icon');
    const playText = document.getElementById('tcf-play-text');
    const wave = document.getElementById('tcf-audio-wave');
    const label = document.getElementById('tcf-status-label');

    if (playBtn) playBtn.classList.toggle('playing', playing);
    if (playIcon) playIcon.textContent = playing ? '⏸' : '▶';
    if (playText) playText.textContent = playing ? 'Tạm dừng bài nghe' : 'Tiếp tục nghe bài thi';
    if (wave) wave.style.display = playing ? 'inline-flex' : 'none';
    if (label) label.textContent = playing ? 'Đang phát bài nghe...' : 'Đang dừng';
  }

  // Render Questions
  function renderQuestions(questions) {
    const scrollArea = document.getElementById('tcf-exam-scroll');
    if (!scrollArea) return;

    let html = '';
    questions.forEach((q, qIndex) => {
      const selected = tcfState.userAnswers[qIndex];
      html += `
        <div class="tcf-q-card" id="tcf-q-card-${qIndex}">
          <div class="tcf-q-head">
            <span class="tcf-q-num">Câu hỏi ${qIndex + 1} / ${questions.length}</span>
            <div class="tcf-q-meta">
              <span class="tcf-q-level">${esc(q.level || 'B1')}</span>
              ${q.type ? `<span class="tcf-q-type">${esc(q.type)}</span>` : ''}
            </div>
          </div>
          <div class="tcf-q-text">${esc(q.question)}</div>
          <div class="tcf-q-options">
            ${['A', 'B', 'C', 'D'].map((letter) => {
              const optText = q.options[letter];
              if (!optText) return '';
              const isSel = selected === letter;
              return `
                <button type="button" class="tcf-opt-btn${isSel ? ' selected' : ''}" 
                  id="tcf-opt-${qIndex}-${letter}" 
                  onclick="TcfExam.selectOption(${qIndex}, '${letter}')">
                  <span class="tcf-opt-letter">${letter}</span>
                  <span>${esc(optText)}</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    scrollArea.innerHTML = html;
  }

  function selectOption(qIndex, letter) {
    if (tcfState.isSubmitted) return; // Locked once submitted
    tcfState.userAnswers[qIndex] = letter;

    // Update styling for this question
    ['A', 'B', 'C', 'D'].forEach((l) => {
      const btn = document.getElementById(`tcf-opt-${qIndex}-${l}`);
      if (btn) btn.classList.toggle('selected', l === letter);
    });

    updateProgressCounter();
  }

  function updateProgressCounter() {
    const total = tcfState.currentQuestions.length;
    const answered = Object.keys(tcfState.userAnswers).length;
    const progText = document.getElementById('tcf-progress-text');
    if (progText) {
      progText.innerHTML = `Đã chọn: <b>${answered}</b> / ${total} câu`;
    }
  }

  // Jump to specific audio timestamp
  function jumpToTimestamp(seconds) {
    if (typeof window.seekToTime === 'function') {
      window.seekToTime(seconds, 0, true);
    } else if (window.ytPlayer && typeof window.ytPlayer.seekTo === 'function') {
      window.ytPlayer.seekTo(seconds, true);
      window.ytPlayer.playVideo();
    }
    updateAudioBar(true);
  }

  // Submit & Grade
  function submitExam() {
    const total = tcfState.currentQuestions.length;
    const answered = Object.keys(tcfState.userAnswers).length;

    if (answered < total) {
      const confirmSubmit = confirm(`Bạn mới trả lời ${answered}/${total} câu hỏi. Bạn có chắc chắn muốn nộp bài thi ngay không?`);
      if (!confirmSubmit) return;
    }

    // Stop timer
    if (tcfState.timerInterval) {
      clearInterval(tcfState.timerInterval);
      tcfState.timerInterval = null;
    }

    tcfState.isSubmitted = true;

    // Calculate Score
    let correctCount = 0;
    tcfState.currentQuestions.forEach((q, idx) => {
      if (tcfState.userAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / total) * 100);

    // Save Score
    const info = getVideoInfo();
    const videoId = info.id;
    saveTestToStorage(videoId, {
      videoId,
      videoTitle: info.title || '',
      questions: tcfState.currentQuestions,
      lastScore: {
        correct: correctCount,
        total: total,
        percent: percent,
        date: Date.now()
      }
    });

    // Render Results View
    renderResults(correctCount, total, percent);
  }

  function renderResults(correct, total, percent) {
    const scrollArea = document.getElementById('tcf-exam-scroll');
    if (!scrollArea) return;

    // CEFR & CLB Mapping
    let levelBadge = 'Niveau A2 (CLB 4-5)';
    let comment = 'Bạn đang ở mức căn bản. Hãy nghe lại từng đoạn và luyện tập nối âm nhiều hơn để bắt kịp tốc độ nói.';
    if (percent >= 85) {
      levelBadge = 'Niveau C1 (CLB 9 - 10)';
      comment = 'Xuất sắc! Khả năng nghe hiểu tiếng Pháp của bạn rất điêu luyện, nắm bắt trọn vẹn cả những ý đồ ẩn dụ và bẫy nghe phức tạp.';
    } else if (percent >= 70) {
      levelBadge = 'Niveau B2 (CLB 7 - 8) ★ Đạt chuẩn Express Entry Canada';
      comment = 'Tuyệt vời! Bạn đã đạt mức điểm vàng B2 (CLB 7) đủ điều kiện cộng tối đa điểm tiếng Pháp định cư Canada.';
    } else if (percent >= 50) {
      levelBadge = 'Niveau B1 (CLB 6)';
      comment = 'Khá tốt! Bạn đã nắm vững các ý chính và thông tin quan trọng. Hãy chú ý các bẫy nghe từ đồng nghĩa để bứt phá lên B2.';
    }

    let bannerHtml = `
      <div class="tcf-result-banner">
        <div class="tcf-score-circle">
          <span>${correct}</span><small>/ ${total}</small>
        </div>
        <div class="tcf-level-badge-large">${esc(levelBadge)}</div>
        <p class="tcf-comment">${esc(comment)}</p>
        <div style="margin-top:14px;font-size:12px;color:#94a3b8">
          ⏱ Thời gian làm bài: <b>${formatTime(tcfState.secondsElapsed)}</b> · Tỉ lệ đúng: <b>${percent}%</b>
        </div>
      </div>
    `;

    // Render each reviewed question with explanations & audio jump
    let questionsHtml = '';
    tcfState.currentQuestions.forEach((q, qIndex) => {
      const userChoice = tcfState.userAnswers[qIndex];
      const isCorrect = userChoice === q.answer;

      questionsHtml += `
        <div class="tcf-q-card ${isCorrect ? 'is-correct' : 'is-wrong'}">
          <div class="tcf-q-head">
            <span class="tcf-q-num">Câu hỏi ${qIndex + 1} / ${total}</span>
            <div class="tcf-q-meta">
              <span class="tcf-status-tag ${isCorrect ? 'correct' : 'wrong'}">
                ${isCorrect ? '✓ Đúng' : '✗ Sai'}
              </span>
              <span class="tcf-q-level">${esc(q.level || 'B1')}</span>
            </div>
          </div>
          <div class="tcf-q-text">${esc(q.question)}</div>
          
          <div class="tcf-q-options">
            ${['A', 'B', 'C', 'D'].map((letter) => {
              const optText = q.options[letter];
              if (!optText) return '';
              const isCorrectAns = letter === q.answer;
              const isUserPicked = letter === userChoice;

              let stateClass = '';
              if (isCorrectAns) stateClass = ' correct-choice';
              else if (isUserPicked && !isCorrect) stateClass = ' wrong-choice';

              return `
                <div class="tcf-opt-btn${stateClass}">
                  <span class="tcf-opt-letter">${letter}</span>
                  <span>${esc(optText)}</span>
                  ${isCorrectAns ? '<span style="margin-left:auto;color:#34d399;font-weight:700">✓ Đáp án đúng</span>' : ''}
                  ${isUserPicked && !isCorrect ? '<span style="margin-left:auto;color:#f87171;font-weight:700">✗ Bạn đã chọn</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Audio Jump -->
          ${q.timeSeconds ? `
            <button type="button" class="tcf-jump-btn" onclick="TcfExam.jumpToTimestamp(${q.timeSeconds})">
              <span>🎧 Nghe lại đoạn này (${esc(q.time || formatTime(q.timeSeconds))})</span>
            </button>
          ` : ''}

          <!-- Explanation & Pièges -->
          <div class="tcf-explain-box">
            <div class="tcf-explain-title">💡 Giải thích chi tiết &amp; Dẫn chứng:</div>
            ${q.quote ? `<div style="font-style:italic;margin-bottom:6px;color:#93c5fd">"${esc(q.quote)}"</div>` : ''}
            <div>${esc(q.explain || 'Đáp án đúng dựa trên thông tin chính trong bài nghe.')}</div>
            ${q.piege ? `<div class="tcf-explain-piege">⚠️ <b>Bẫy TCF:</b> ${esc(q.piege)}</div>` : ''}
          </div>
        </div>
      `;
    });

    scrollArea.innerHTML = bannerHtml + questionsHtml;

    // Update Footer for Review Mode
    const footer = document.getElementById('tcf-exam-footer');
    if (footer) {
      footer.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <button type="button" class="ai-btn ai-btn-primary" onclick="TcfExam.retakeExam()">
            <span>↺ Làm lại bài thi này</span>
          </button>
          <button type="button" class="ai-btn ai-btn-ghost" onclick="TcfExam.openModal()">
            <span>📋 Tạo đề mới với AI</span>
          </button>
        </div>
        <button type="button" class="ai-btn ai-btn-ghost" onclick="TcfExam.closeExam()">Đóng</button>
      `;
    }

    scrollArea.scrollTop = 0;
  }

  function retakeExam() {
    startExam(tcfState.currentQuestions, getVideoInfo().title);
  }

  // Escape HTML helper
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Public Interface
  window.TcfExam = {
    openModal: openTcfModal,
    closeModal: closeTcfModal,
    selectCount: selectCount,
    selectLevel: selectLevel,
    copyPrompt: copyPrompt,
    applyAnswer: applyAnswer,
    loadSavedExam: loadSavedExam,
    startExam: startExam,
    closeExam: closeExam,
    togglePlayAudio: togglePlayAudio,
    selectOption: selectOption,
    submitExam: submitExam,
    retakeExam: retakeExam,
    jumpToTimestamp: jumpToTimestamp
  };

  // Keyboard shortcut (Escape to close)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const exam = document.getElementById('tcf-exam-backdrop');
      if (exam && exam.classList.contains('open')) {
        closeExam();
      } else {
        closeTcfModal();
      }
    }
  });

})();
