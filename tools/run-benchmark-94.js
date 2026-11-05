'use strict';

const fs = require('node:fs');
const path = require('node:path');
const FrenchMorphology = require('./french-morphology.js');

const codeVocabList = fs.readFileSync(path.join(__dirname, '../js/01g-vocab-list.js'), 'utf8');

function createEnv() {
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

  const mockGlobal = {
    window: {
      addEventListener: () => {},
      removeEventListener: () => {},
      FrenchMorphology: FrenchMorphology
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
    formatTime: () => '0:00',
    FrenchMorphology: FrenchMorphology
  };
  Object.assign(mockGlobal.window, mockGlobal);

  const fn = new Function('global', 'window', 'document', 'localStorage', 'escapeHtml', 'escHtml', 'formatTime', 'FrenchMorphology',
    codeVocabList + '\nreturn { findVariantSpan, scoreSentenceForVocab, tryAlignSingleVocabItem };'
  );
  return fn(mockGlobal, mockGlobal.window, mockGlobal.document, mockGlobal.localStorage, mockGlobal.escapeHtml, mockGlobal.escHtml, mockGlobal.formatTime, FrenchMorphology);
}

const { findVariantSpan, scoreSentenceForVocab } = createEnv();

const poolsPath = path.resolve('/Users/linhvu/Downloads/pools.json');
const casesPath = path.resolve('/Users/linhvu/Downloads/cases.jsonl');

if (!fs.existsSync(poolsPath) || !fs.existsSync(casesPath)) {
  console.error('Không tìm thấy pools.json hoặc cases.jsonl tại Downloads');
  process.exit(1);
}

const pools = JSON.parse(fs.readFileSync(poolsPath, 'utf8'));
const casesLines = fs.readFileSync(casesPath, 'utf8').trim().split('\n');
const cases = casesLines.map((l) => JSON.parse(l));

const results = [];

cases.forEach((c) => {
  const poolSentences = (c.pool === 'inline' && c.sentences) ? c.sentences : pools[c.pool];
  if (!poolSentences) {
    throw new Error('Pool không tồn tại: ' + c.pool);
  }

  const matched = [];
  poolSentences.forEach((sText, sIdx) => {
    const sp = findVariantSpan(sText, c.term);
    if (sp) {
      const isExact = (sp.match.toLowerCase() === c.term.trim().toLowerCase());
      matched.push({ idx: sIdx, span: sp.match, start: sp.start, end: sp.end, isExact: isExact });
    }
  });

  let gotStatus = 'NOT_FOUND';
  let gotIdx = null;
  let gotSpan = null;
  let gotCandidates = [];

  if (matched.length === 0) {
    gotStatus = 'NOT_FOUND';
  } else if (matched.length === 1) {
    gotIdx = matched[0].idx;
    gotSpan = matched[0].span;
    gotStatus = matched[0].isExact ? 'EXACT' : 'VARIANT';
  } else {
    // Có nhiều hơn 1 câu khớp: kiểm tra luật saved-form-priority nếu ca có rule đó
    const exactMatches = matched.filter((m) => m.isExact);
    if (c.rule === 'saved-form-priority' && exactMatches.length === 1) {
      // Đúng duy nhất 1 câu chứa dạng lưu chính xác -> Thắng các câu mở rộng biến thể!
      gotIdx = exactMatches[0].idx;
      gotSpan = exactMatches[0].span;
      gotStatus = 'EXACT';
    } else {
      gotStatus = 'MULTIPLE';
      gotCandidates = matched.map((m) => m.idx);
      gotSpan = matched[0].span;
    }
  }

  const exp = c.expect;
  let verdict = 'UNKNOWN';

  // Hỗ trợ trường accept (ví dụ ca 59, 60 accept: ["VARIANT", "NOT_FOUND"])
  const acceptList = c.accept || exp.accept || [];
  const isAcceptedStatus = (Array.isArray(acceptList) && acceptList.includes(gotStatus));

  if (exp.status === 'NOT_FOUND') {
    if (gotStatus === 'NOT_FOUND') {
      verdict = 'CORRECT_REJECT_NOT_FOUND';
    } else {
      verdict = 'WRONG_ASSIGNMENT';
    }
  } else if (exp.status === 'MULTIPLE') {
    if (gotStatus === 'MULTIPLE') {
      const expIdxs = exp.candidates || [];
      const matchAllExp = expIdxs.length ? expIdxs.every((ei) => gotCandidates.includes(ei)) : true;
      if (matchAllExp) {
        verdict = 'CORRECT_REJECT_MULTIPLE';
      } else {
        verdict = 'MULTIPLE_PARTIAL';
      }
    } else if (gotStatus === 'NOT_FOUND') {
      verdict = 'REJECT_WRONG_REASON';
    } else {
      verdict = 'WRONG_ASSIGNMENT';
    }
  } else if (exp.status === 'EXACT' || exp.status === 'VARIANT') {
    if (gotStatus === 'NOT_FOUND') {
      if (isAcceptedStatus) {
        verdict = 'ACCEPTED_REJECT_NOT_FOUND';
      } else {
        verdict = 'MISSED_ASSIGNMENT_NOT_FOUND';
      }
    } else if (gotStatus === 'MULTIPLE') {
      verdict = 'MISSED_ASSIGNMENT_MULTIPLE';
    } else {
      // Đơn lẻ
      const idxOk = (gotIdx === exp.idx);
      const spanOk = (gotSpan.toLowerCase() === exp.span.toLowerCase());
      if (idxOk && spanOk) {
        verdict = 'CORRECT_ASSIGNMENT';
      } else if (!idxOk) {
        verdict = 'WRONG_ASSIGNMENT';
      } else {
        verdict = 'WRONG_ASSIGNMENT';
      }
    }
  }

  results.push({
    id: c.id,
    cat: c.cat,
    term: c.term,
    pool: c.pool,
    expect: exp,
    got: { status: gotStatus, idx: gotIdx, span: gotSpan, candidates: gotCandidates },
    verdict: verdict,
    note: c.note
  });
});

// Ghi đè results.jsonl
const resultsPath = path.resolve('/Users/linhvu/Downloads/results.jsonl');
fs.writeFileSync(resultsPath, results.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');

const correctAssignment = results.filter((r) => r.verdict === 'CORRECT_ASSIGNMENT').length;
const wrongAssignment = results.filter((r) => r.verdict === 'WRONG_ASSIGNMENT').length;
const correctRejectNotFound = results.filter((r) => r.verdict === 'CORRECT_REJECT_NOT_FOUND').length;
const correctRejectMultiple = results.filter((r) => r.verdict === 'CORRECT_REJECT_MULTIPLE').length;
const acceptedRejectNotFound = results.filter((r) => r.verdict === 'ACCEPTED_REJECT_NOT_FOUND').length;
const missedAssignmentNotFound = results.filter((r) => r.verdict === 'MISSED_ASSIGNMENT_NOT_FOUND').length;
const missedAssignmentMultiple = results.filter((r) => r.verdict === 'MISSED_ASSIGNMENT_MULTIPLE').length;
const rejectWrongReason = results.filter((r) => r.verdict === 'REJECT_WRONG_REASON').length;

const totalEvaluated = results.length;
const totalCorrect = correctAssignment + correctRejectNotFound + correctRejectMultiple + acceptedRejectNotFound;

console.log('======================================================================');
console.log('📊 BÁO CÁO KẾT QUẢ ĐỐI SOÁT 94 CA BENCHMARK (FRENCH SHADOWING STUDIO)');
console.log('======================================================================');
console.log(`- Tổng số ca kiểm thử:           ${totalEvaluated}`);
console.log(`- 1. Gán đúng (CORRECT_ASSIGNMENT):         ${correctAssignment}`);
console.log(`- 2. Gán sai (WRONG_ASSIGNMENT):           ${wrongAssignment}`);
console.log(`- 3. Từ chối đúng:                         ${correctRejectNotFound + correctRejectMultiple + acceptedRejectNotFound}`);
console.log(`     • NOT_FOUND chuẩn xác:                ${correctRejectNotFound}`);
console.log(`     • MULTIPLE chuẩn xác:                 ${correctRejectMultiple}`);
console.log(`     • Chấp nhận từ chối an toàn (#59, #60): ${acceptedRejectNotFound}`);
console.log(`- 4. Bỏ lỡ / Cần tối ưu:                  ${missedAssignmentNotFound + missedAssignmentMultiple + rejectWrongReason}`);
console.log(`     • Bị MULTIPLE lẽ ra single:           ${missedAssignmentMultiple}`);
console.log(`     • Bị NOT_FOUND lẽ ra gán:             ${missedAssignmentNotFound}`);
console.log(`     • Từ chối sai lý do (#37, #38):       ${rejectWrongReason}`);
console.log('----------------------------------------------------------------------');

const totalAssignments = correctAssignment + wrongAssignment;
const precision = totalAssignments > 0 ? (correctAssignment / totalAssignments) * 100 : 0;
console.log(`🎯 ĐỘ CHUẨN XÁC LẦN GÁN (PRECISION): ${correctAssignment}/${totalAssignments} = ${precision.toFixed(2)}%`);
console.log(`🎯 TỔNG SỐ CA ĐẠT CHUẨN:             ${totalCorrect}/${totalEvaluated} = ${(totalCorrect / totalEvaluated * 100).toFixed(2)}%`);
console.log('======================================================================');

if (wrongAssignment > 0) {
  console.log('\n❌ DANH SÁCH CÁC CA GÁN SAI (CẦN = 0):');
  results.filter((r) => r.verdict === 'WRONG_ASSIGNMENT').forEach((r) => {
    console.log(`  #${r.id} [${r.term}] -> got: ${JSON.stringify(r.got)} | expect: ${JSON.stringify(r.expect)} | note: ${r.note}`);
  });
}

if (missedAssignmentNotFound > 0 || missedAssignmentMultiple > 0 || rejectWrongReason > 0) {
  console.log('\n⚠️ CÁC CA TỪ CHỐI AN TOÀN CHƯA ĐẠT KỲ VỌNG:');
  results.filter((r) => ['MISSED_ASSIGNMENT_NOT_FOUND', 'MISSED_ASSIGNMENT_MULTIPLE', 'REJECT_WRONG_REASON'].includes(r.verdict)).forEach((r) => {
    console.log(`  #${r.id} [${r.term}] -> verdict: ${r.verdict} | got: ${JSON.stringify(r.got)} | expect: ${JSON.stringify(r.expect)}`);
  });
}
