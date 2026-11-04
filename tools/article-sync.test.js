/**
 * tools/article-sync.test.js
 * Kiểm thử tính năng đồng bộ Transcript & Word-Timestamps từ AI cho bài báo (Module M3)
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// Import parser logic hoặc giả lập hàm phân tích cú pháp chuẩn
function parseTimestampToSeconds(ts) {
  if (typeof ts === 'number') return ts;
  if (!ts) return 0;
  const s = String(ts).trim().replace(',', '.');
  const parts = s.split(':');
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  const val = parseFloat(s);
  return isNaN(val) ? 0 : val;
}

function cleanMarkdownFences(str) {
  if (!str) return '';
  let s = String(str).trim();
  // Bỏ ```json ... ``` hoặc ```vtt ... ```
  if (s.startsWith('```')) {
    s = s.replace(/^```[a-zA-Z0-9_-]*\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
  }
  return s;
}

function parseAiSyncData(rawInput, baseSentences = []) {
  const cleaned = cleanMarkdownFences(rawInput);
  if (!cleaned) throw new Error('Dữ liệu nhập vào trống');

  // Thử parse dạng JSON trước
  if (cleaned.startsWith('[') || cleaned.startsWith('{')) {
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Tìm mảng JSON đầu tiên trong chuỗi nếu có chữ thừa
      const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Định dạng JSON không hợp lệ: ' + e.message);
      }
    }

    const items = Array.isArray(parsed) ? parsed : (parsed.sentences || parsed.subtitles || parsed.cues || []);
    if (!Array.isArray(items) || !items.length) {
      throw new Error('JSON không chứa mảng câu hoặc từ hợp lệ');
    }

    // Trường hợp 1: Mảng câu (sentence-level hoặc sentence + words)
    if (items[0].text !== undefined || items[0].sentence !== undefined || items[0].words !== undefined) {
      const out = items.map((it, idx) => {
        const text = String(it.text || it.sentence || (baseSentences[idx] && baseSentences[idx].text) || '').trim();
        const start = parseTimestampToSeconds(it.startTime !== undefined ? it.startTime : it.start);
        const end = parseTimestampToSeconds(it.endTime !== undefined ? it.endTime : it.end);
        let words = null;
        if (Array.isArray(it.words)) {
          words = it.words.map((w) => ({
            word: String(w.word || w.text || '').trim(),
            startTime: parseTimestampToSeconds(w.startTime !== undefined ? w.startTime : w.start),
            endTime: parseTimestampToSeconds(w.endTime !== undefined ? w.endTime : w.end)
          })).filter((w) => w.word.length > 0);
        }
        return {
          id: it.id || idx + 1,
          startTime: start,
          endTime: Math.max(start + 0.5, end),
          text,
          words: words && words.length ? words : undefined
        };
      });
      return { format: 'json-sentences', sentences: out, count: out.length };
    }

    // Trường hợp 2: Mảng từ thuần (word-level array)
    if (items[0].word !== undefined) {
      return { format: 'json-words', rawWords: items, count: items.length };
    }
  }

  // Thử parse dạng SRT / WebVTT
  const cueRegex = /(?:(\d+)\s*\n)?(?:(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*(?:(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3})[^\n]*\n([\s\S]*?)(?=\n\s*(?:(?:\d+\s*\n)?(?:(?:\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}))|$)/g;
  const timeRegex = /((?:(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}))\s*-->\s*((?:(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}))/;

  const blocks = cleaned.split(/\n\s*\n+/);
  const cues = [];
  for (const block of blocks) {
    const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    let timeLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (timeRegex.test(lines[i])) { timeLineIdx = i; break; }
    }
    if (timeLineIdx !== -1) {
      const match = lines[timeLineIdx].match(timeRegex);
      const start = parseTimestampToSeconds(match[1]);
      const end = parseTimestampToSeconds(match[3]);
      const text = lines.slice(timeLineIdx + 1).join(' ').replace(/<[^>]+>/g, '').trim();
      if (text) {
        cues.push({ id: cues.length + 1, startTime: start, endTime: end, text });
      }
    }
  }

  if (cues.length > 0) {
    return { format: 'vtt-srt', sentences: cues, count: cues.length };
  }

  throw new Error('Không nhận diện được định dạng JSON, WebVTT hoặc SRT');
}

test('M3.1 AI Sync Parser: Phân tích JSON có word-level timestamps bọc trong markdown fences', () => {
  const jsonWithFence = `\`\`\`json
  [
    {
      "id": 1,
      "startTime": 0.5,
      "endTime": 3.2,
      "text": "Bonjour à tous.",
      "words": [
        { "word": "Bonjour", "startTime": 0.5, "endTime": 1.2 },
        { "word": "à", "startTime": 1.3, "endTime": 1.5 },
        { "word": "tous.", "startTime": 1.6, "endTime": 2.2 }
      ]
    },
    {
      "id": 2,
      "startTime": 3.4,
      "endTime": 6.8,
      "text": "Bienvenue dans ce cours.",
      "words": [
        { "word": "Bienvenue", "startTime": 3.4, "endTime": 4.1 },
        { "word": "dans", "startTime": 4.2, "endTime": 4.6 },
        { "word": "ce", "startTime": 4.7, "endTime": 5.0 },
        { "word": "cours.", "startTime": 5.1, "endTime": 6.2 }
      ]
    }
  ]
  \`\`\``;

  const result = parseAiSyncData(jsonWithFence);
  assert.equal(result.format, 'json-sentences');
  assert.equal(result.count, 2);
  assert.equal(result.sentences[0].startTime, 0.5);
  assert.equal(result.sentences[0].endTime, 3.2);
  assert.equal(result.sentences[0].words.length, 3);
  assert.equal(result.sentences[0].words[0].word, 'Bonjour');
  assert.equal(result.sentences[0].words[0].startTime, 0.5);
  assert.equal(result.sentences[1].words[3].word, 'cours.');
});

test('M3.2 AI Sync Parser: Phân tích phụ đề định dạng WebVTT và SRT', () => {
  const srtData = `1
00:00:01,200 --> 00:00:04,500
Le président de la République s'est exprimé.

2
00:00:04,800 --> 00:00:08,150
Il a évoqué les enjeux climatiques majeurs.`;

  const result = parseAiSyncData(srtData);
  assert.equal(result.format, 'vtt-srt');
  assert.equal(result.count, 2);
  assert.equal(result.sentences[0].startTime, 1.2);
  assert.equal(result.sentences[0].endTime, 4.5);
  assert.equal(result.sentences[0].text, "Le président de la République s'est exprimé.");
  assert.equal(result.sentences[1].startTime, 4.8);
  assert.equal(result.sentences[1].endTime, 8.15);
});

test('M3.3 AI Prompt Generator: Tạo nội dung prompt chuẩn cho mô hình AI', () => {
  function generatePrompt(title, sents) {
    const list = sents.map((s, i) => `${i + 1}. ${s.text}`).join('\n');
    return `Bạn là chuyên gia căn chỉnh phụ đề âm thanh (Audio-Text Alignment).
Tôi có file audio MP3 cho bài báo: "${title}".
Dưới đây là danh sách câu tiếng Pháp trong bài báo:
${list}

Hãy nghe và trả về danh sách mốc thời gian chuẩn xác (tính bằng giây) dưới dạng mảng JSON thuần túy (không thêm lời giải thích):
[
  {
    "id": 1,
    "startTime": 0.0,
    "endTime": 3.5,
    "text": "...",
    "words": [
      { "word": "...", "startTime": 0.0, "endTime": 0.8 }
    ]
  }
]`;
  }

  const prompt = generatePrompt('Bài báo Le Monde', [
    { text: 'Bonjour la France.' },
    { text: 'Voici les actualités.' }
  ]);

  assert.ok(prompt.includes('Bài báo Le Monde'));
  assert.ok(prompt.includes('1. Bonjour la France.'));
  assert.ok(prompt.includes('2. Voici les actualités.'));
  assert.ok(prompt.includes('"words"'));
});
