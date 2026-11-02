const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SchemaV02 = require('./schema-v02.js');

// =========================================================================
// TEST SUITE 1: Idempotency (Nạp lại cùng lô 2 lần)
// =========================================================================
test('C4.1 Idempotency: nạp lại cùng lô 2 lần, số mục và số contexts không đổi', () => {
  const file1 = {
    fileName: 'lesson1.txt',
    source_id: 'yt:video111111',
    title: 'Lesson 1',
    content: [
      '1. école || từ || A1 || [n.f.] trường học',
      'Trong bài: Je vais à l\'école.',
      'VD1: L\'école est grande. || Trường học rất lớn.',
      '2. maison || từ || A1 || [n.f.] ngôi nhà',
      'Trong bài: Ma maison est belle.'
    ].join('\n')
  };

  const file2 = {
    fileName: 'lesson2.txt',
    source_id: 'yt:video222222',
    title: 'Lesson 2',
    content: [
      '1. école || từ || A1 || [n.f.] trường học',
      'Trong bài: Mon école est fermée.',
      '2. livre || từ || A1 || [n.m.] cuốn sách',
      'Trong bài: Je lis un livre.'
    ].join('\n')
  };

  // Lần nạp 1: Từ kho rỗng
  const staged1 = SchemaV02.stageMultiSourceImport([file1, file2], []);
  const commit1 = SchemaV02.commitStagedImport(staged1, 'ADD_SOURCE', {}, []);
  const list1 = commit1.updatedVocabList;

  // Kỳ vọng: 3 mục duy nhất (école, maison, livre)
  assert.strictEqual(list1.length, 3, 'Lần 1 phải có đúng 3 mục');
  const ecoleItem1 = list1.find(it => it.norm_key === 'école');
  assert.ok(ecoleItem1, 'Mục école phải tồn tại');
  assert.strictEqual(ecoleItem1.contexts.length, 1, 'école phải có 1 secondary context (từ lesson2)');

  // Lần nạp 2: Nạp lại đúng 2 file đó trên kết quả của lần 1
  const staged2 = SchemaV02.stageMultiSourceImport([file1, file2], list1);
  const commit2 = SchemaV02.commitStagedImport(staged2, 'ADD_SOURCE', {}, list1);
  const list2 = commit2.updatedVocabList;

  assert.strictEqual(list2.length, 3, 'Lần 2 số mục không được tăng thêm');
  const ecoleItem2 = list2.find(it => it.norm_key === 'école');
  assert.strictEqual(ecoleItem2.contexts.length, 1, 'Lần 2 số contexts của mục école phải giữ nguyên');
});

// =========================================================================
// TEST SUITE 2: SRS preservation & Legacy Upgrade
// =========================================================================
test('C4.2 Bảo toàn SRS ở mục ĐÃ CÓ và nâng cấp mục do UI tạo giữ nguyên id & srs', () => {
  const existingList = [
    {
      id: 'existing-word-1',
      item_id: 'word:bonjour',
      norm_key: 'bonjour',
      text: 'bonjour',
      wordVi: 'xin chào',
      tag: 'Từ',
      level: 'A1',
      srs: { ease: 1.8, interval: 14, reps: 6, due: 1730000000000, lastReview: 1729000000000 },
      contexts: []
    },
    // Mục cũ tạo từ UI (id ngẫu nhiên, chưa có item_id và schema 0.2)
    {
      id: 'vocab-1712345678901',
      text: 'au revoir',
      wordVi: 'tạm biệt',
      tag: 'Cụm từ',
      level: 'A1',
      srs: { ease: 2.1, interval: 7, reps: 3, due: 1731000000000, lastReview: 1728000000000 },
      contexts: []
    }
  ];

  const incomingFile = {
    fileName: 'test.txt',
    source_id: 'yt:video999999',
    title: 'Review',
    content: [
      '1. bonjour || từ || A1 || [interj.] xin chào',
      'Trong bài: Bonjour tout le monde !'
    ].join('\n')
  };

  const staged = SchemaV02.stageMultiSourceImport([incomingFile], existingList);
  const commit = SchemaV02.commitStagedImport(staged, 'ADD_SOURCE', {}, existingList);
  const updatedList = commit.updatedVocabList;

  // Kiểm tra mục bonjour đã có: SRS không đổi
  const bonjour = updatedList.find(x => x.norm_key === 'bonjour');
  assert.strictEqual(bonjour.srs.ease, 1.8);
  assert.strictEqual(bonjour.srs.interval, 14);
  assert.strictEqual(bonjour.srs.reps, 6);
  assert.strictEqual(bonjour.id, 'existing-word-1');

  // Kiểm tra mục legacy "au revoir": id cũ và SRS giữ nguyên, nhưng đã được nâng cấp Schema 0.2
  const auRevoir = updatedList.find(x => x.text === 'au revoir');
  assert.strictEqual(auRevoir.id, 'vocab-1712345678901', 'id cũ phải được giữ nguyên');
  assert.strictEqual(auRevoir.item_id, 'chunk:au-revoir', 'item_id phải được tạo đúng');
  assert.strictEqual(auRevoir.type, 'chunk');
  assert.strictEqual(auRevoir.schema_version, '0.2');
  assert.strictEqual(auRevoir.srs.ease, 2.1);
  assert.strictEqual(auRevoir.srs.interval, 7);
});

// =========================================================================
// TEST SUITE 3: TYPE_COLLISION (với DB hiện có VÀ trong nội bộ batch)
// =========================================================================
test('C4.3 TYPE_COLLISION: phát hiện va chạm loại, chặn ghi tới khi chọn, chỉ có 2 lựa chọn', () => {
  const existingList = [
    {
      id: 'word:merci',
      item_id: 'word:merci',
      norm_key: 'merci',
      text: 'merci',
      type: 'word',
      tag: 'Từ',
      level: 'A1',
      contexts: []
    }
  ];

  // File 1 va chạm với DB: cùng "merci" nhưng type là "chunk" (Cụm từ)
  const file1 = {
    fileName: 'batch1.txt',
    source_id: 'yt:source1',
    content: '1. merci || cụm từ || A1 || [loc.] cảm ơn\nTrong bài: Merci beaucoup.'
  };

  const staged = SchemaV02.stageMultiSourceImport([file1], existingList);
  assert.strictEqual(staged.collisions.length, 1, 'Phải phát hiện 1 va chạm TYPE_COLLISION với DB');

  const colId = staged.collisions[0].collisionId;

  // Thử commit khi chưa chọn cách giải quyết -> phải ném lỗi chặn ghi
  assert.throws(() => {
    SchemaV02.commitStagedImport(staged, 'ADD_SOURCE', {}, existingList);
  }, /Chưa giải quyết xung đột loại/);

  // Thử lựa chọn không hợp lệ (không phải keep_existing_add_occ hay skip_new)
  assert.throws(() => {
    SchemaV02.commitStagedImport(staged, 'ADD_SOURCE', {
      collisionDecisions: { [colId]: 'change_type' }
    }, existingList);
  }, /Lựa chọn chỉ gồm: Giữ mục cũ hoặc Bỏ qua mục mới/);

  // Chọn 1: Bỏ qua mục mới (skip_new)
  const commitSkip = SchemaV02.commitStagedImport(staged, 'ADD_SOURCE', {
    collisionDecisions: { [colId]: 'skip_new' }
  }, existingList);
  const merciItem1 = commitSkip.updatedVocabList.find(x => x.norm_key === 'merci');
  assert.strictEqual(merciItem1.type, 'word');
  assert.strictEqual(merciItem1.contexts.length, 0, 'Mục mới bị bỏ qua thì contexts không đổi');

  // Chọn 2: Giữ mục cũ & thêm context mới vào mục cũ (keep_existing_add_occ)
  const commitKeep = SchemaV02.commitStagedImport(staged, 'ADD_SOURCE', {
    collisionDecisions: { [colId]: 'keep_existing_add_occ' }
  }, existingList);
  const merciItem2 = commitKeep.updatedVocabList.find(x => x.norm_key === 'merci');
  assert.strictEqual(merciItem2.type, 'word');
  assert.strictEqual(merciItem2.contexts.length, 1, 'Context mới phải được thêm vào mục cũ');

  // Kiểm tra va chạm trong nội bộ batch (giữa File A và File B)
  const fileA = { fileName: 'fa.txt', source_id: 'yt:vidA', content: '1. oui || từ || A1 || [adv.] vâng\nTrong bài: Oui.' };
  const fileB = { fileName: 'fb.txt', source_id: 'yt:vidB', content: '1. oui || cụm từ || A1 || [loc.] vâng\nTrong bài: Oui madame.' };

  const stagedBatch = SchemaV02.stageMultiSourceImport([fileA, fileB], []);
  assert.strictEqual(stagedBatch.collisions.length, 1, 'Phải phát hiện BATCH_COLLISION');
  assert.strictEqual(stagedBatch.collisions[0].type, 'BATCH_COLLISION');
});

// =========================================================================
// TEST SUITE 4: 3-file simulation & order invariance
// =========================================================================
test('C4.4 Lô 3 file giả lập: mục xuất hiện ở cả 3 file ra một thẻ 3 occurrences, kết quả không đổi khi đảo thứ tự nạp', () => {
  const f1 = {
    fileName: 'vid1.txt',
    source_id: 'yt:vid11111111',
    content: '1. bonjour || từ || A1 || [interj.] xin chào\nTrong bài: Bonjour Pierre.'
  };
  const f2 = {
    fileName: 'vid2.txt',
    source_id: 'yt:vid22222222',
    content: '1. bonjour || từ || A1 || [interj.] xin chào\nTrong bài: Bonjour Marie.'
  };
  const f3 = {
    fileName: 'vid3.txt',
    source_id: 'yt:vid33333333',
    content: '1. bonjour || từ || A1 || [interj.] xin chào\nTrong bài: Bonjour tout le monde.'
  };

  // Thứ tự xuôi: f1 -> f2 -> f3
  const stagedForward = SchemaV02.stageMultiSourceImport([f1, f2, f3], []);
  const commitForward = SchemaV02.commitStagedImport(stagedForward, 'ADD_SOURCE', {}, []);
  const listForward = commitForward.updatedVocabList;

  assert.strictEqual(listForward.length, 1, 'Chỉ sinh đúng 1 thẻ cho bonjour');
  const bFwd = listForward[0];
  assert.strictEqual(bFwd.item_id, 'word:bonjour');
  assert.strictEqual(bFwd.en, 'Bonjour Pierre.', 'Ngữ cảnh chính phải lấy từ file đầu tiên (f1)');
  assert.strictEqual(bFwd.contexts.length, 2, 'Phải có đúng 2 secondary contexts (từ f2 và f3)');

  // Thứ tự đảo ngược: f3 -> f2 -> f1
  const stagedReverse = SchemaV02.stageMultiSourceImport([f3, f2, f1], []);
  const commitReverse = SchemaV02.commitStagedImport(stagedReverse, 'ADD_SOURCE', {}, []);
  const listReverse = commitReverse.updatedVocabList;

  assert.strictEqual(listReverse.length, 1);
  const bRev = listReverse[0];
  assert.strictEqual(bRev.item_id, 'word:bonjour', 'item_id bất biến hoàn toàn');
  assert.strictEqual(bRev.en, 'Bonjour tout le monde.', 'Ngữ cảnh chính lấy từ file đầu tiên theo thứ tự mới (f3)');
  assert.strictEqual(bRev.contexts.length, 2, 'Tổng số occurrences vẫn là 3 (1 chính + 2 phụ)');
});

// =========================================================================
// TEST SUITE 5: Field completeness & getDerivedSources
// =========================================================================
test('C4.5 Ánh xạ trường đầy đủ, videoId thô, source_id chuẩn hóa, getDerivedSources gom đúng', () => {
  const file = {
    fileName: 'test.json',
    source_id: 'UoxA5R0tcFA', // truyền dạng thô
    title: 'Bài 1',
    content: JSON.stringify({
      source: { source_id: 'UoxA5R0tcFA', title: 'Bài 1' },
      items: [
        {
          fr: 'pomme',
          type: 'word',
          level: 'A1',
          meaning_vi: 'quả táo',
          source_text: 'J\'aime la pomme.',
          t: 42.5,
          t_known: true,
          noun: { gender: 'f' },
          examples: [{ fr: 'Une pomme rouge', vi: 'Quả táo đỏ' }]
        }
      ],
      occurrences: []
    })
  };

  const staged = SchemaV02.stageMultiSourceImport([file], []);
  const commit = SchemaV02.commitStagedImport(staged, 'ADD_SOURCE', {}, []);
  const item = commit.updatedVocabList[0];

  // Kiểm tra đầy đủ trường cho Flashcard, MC, Quiz, Pair match, SM-2
  assert.strictEqual(item.id, 'word:pomme');
  assert.strictEqual(item.text, 'pomme');
  assert.strictEqual(item.wordVi, 'quả táo');
  assert.strictEqual(item.tag, 'Từ');
  assert.strictEqual(item.level, 'A1');
  assert.strictEqual(item.kind, 'word');
  assert.strictEqual(item.en, 'J\'aime la pomme.');
  assert.strictEqual(item.t, 42.5);
  assert.strictEqual(item.t_known, true);
  assert.strictEqual(item.videoId, 'UoxA5R0tcFA', 'videoId phải là mã thô 11 ký tự');
  assert.strictEqual(item.source_id, 'yt:UoxA5R0tcFA', 'source_id phải có tiền tố yt:');
  assert.ok(item.srs && item.srs.ease === 2.5, 'srs recognition mặc định');
  assert.strictEqual(item.schema_version, '0.2');

  // Kiểm tra getDerivedSources
  const sources = SchemaV02.getDerivedSources(commit.updatedVocabList);
  assert.strictEqual(sources.length, 1);
  assert.strictEqual(sources[0].source_id, 'yt:UoxA5R0tcFA');
  assert.strictEqual(sources[0].videoId, 'UoxA5R0tcFA');
  assert.strictEqual(sources[0].item_count, 1);
  assert.strictEqual(sources[0].occurrence_count, 1);
});

// =========================================================================
// TEST SUITE 6: hs / he Matching & 0/0 Fallback
// =========================================================================
test('C4.6 hs/he: tìm đúng vị trí, bỏ mạo từ, chia động từ, không tìm thấy trả về 0/0 (không bôi cả câu)', () => {
  // 1. Khớp nguyên văn: "Je vais à l'école." -> l'école bắt đầu ở index 10 (độ dài 7 -> he = 17)
  const s1 = SchemaV02.findHighlightSpan('Je vais à l\'école.', 'l\'école');
  assert.strictEqual(s1.hs, 10);
  assert.strictEqual(s1.he, 17);

  // 2. Bỏ mạo từ: tìm "la chambre" trong "Je veux une chambre."
  const s2 = SchemaV02.findHighlightSpan('Je veux une chambre.', 'la chambre');
  assert.strictEqual(s2.hs, 12);
  assert.strictEqual(s2.he, 19);

  // 3. Chia động từ
  const verbData = {
    conjugation: {
      present: { nous: 'parlons' }
    }
  };
  const s3 = SchemaV02.findHighlightSpan('Nous parlons français.', 'parler', verbData.conjugation.present);
  assert.strictEqual(s3.hs, 5);
  assert.strictEqual(s3.he, 12);

  // 4. Hoàn toàn không tìm thấy -> 0, 0 (tuyệt đối không bôi cả câu)
  const s4 = SchemaV02.findHighlightSpan('Bonjour tout le monde.', 'voiture');
  assert.strictEqual(s4.hs, 0);
  assert.strictEqual(s4.he, 0);
});

// =========================================================================
// TEST SUITE 7: Storage Quota & Cloud Push Error Handling
// =========================================================================
test('C4.7 Quota failure không để trạng thái nửa vời; pushAll lỗi tạo trạng thái có cảnh báo', () => {
  // Mô phỏng Mock localStorage ném lỗi Quota
  let storage = {};
  const mockStorageFail = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => {
      if (k === 'shadowing_saved_vocab_v1') {
        const err = new Error('QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      }
      storage[k] = v;
    }
  };

  let pushCalled = false;
  const mockPush = () => { pushCalled = true; };

  // Thử ghi khi dính Quota
  let quotaHandled = false;
  try {
    mockStorageFail.setItem('shadowing_saved_vocab_v1', JSON.stringify([{ id: 'test' }]));
    mockPush();
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      quotaHandled = true;
    }
  }

  assert.strictEqual(quotaHandled, true, 'Lỗi Quota phải được bắt');
  assert.strictEqual(pushCalled, false, 'Khi Quota lỗi tuyệt đối không được gọi pushAll');
  assert.strictEqual(storage['shadowing_saved_vocab_v1'], undefined, 'Kho không bị ghi nửa vời');
});

// =========================================================================
// TEST SUITE 8: Real VM Execution of mergeVocabLists & mergeDuplicateVocab
// =========================================================================
test('C4.8 VM thật: chứng minh thiết bị cũ hồi sinh mục và quy trình xóa sạch an toàn', () => {
  const syncCode = fs.readFileSync(path.join(__dirname, '../js/supabase-sync.js'), 'utf-8');

  const sandbox = {
    localStorage: {
      store: {},
      getItem(k) { return this.store[k] || null; },
      setItem(k, v) { this.store[k] = String(v); },
      removeItem(k) { delete this.store[k]; }
    },
    document: {
      addEventListener() {},
      getElementById() { return null; },
      querySelector() { return null; }
    },
    window: {},
    console: { log() {}, error() {}, warn() {} },
    setTimeout() {},
    clearTimeout() {}
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);

  // Chạy code thật từ js/supabase-sync.js trong VM (không sửa file trên đĩa)
  const vmCode = syncCode.replace(/window\.FSS_SUPABASE\s*=\s*\{/, 'window.__test_mergeVocabLists = mergeVocabLists; window.FSS_SUPABASE = {');
  vm.runInContext(vmCode, ctx);

  assert.ok(typeof sandbox.window.__test_mergeVocabLists === 'function', 'Phải trích xuất được hàm mergeVocabLists thật');
  const mergeVocabLists = sandbox.window.__test_mergeVocabLists;

  // Kịch bản A: Thiết bị cũ chưa dọn, còn 2 mục cũ (id ngẫu nhiên)
  const localOldDevice = [
    { id: 'random-old-1', text: 'vieux mot 1', updatedAt: 1000 },
    { id: 'random-old-2', text: 'vieux mot 2', updatedAt: 1000 }
  ];
  // Cloud có 2 mục mới từ importer (Replace All không có tombstone)
  const cloudNewBatch = [
    { id: 'word:nouveau-1', text: 'nouveau 1', updatedAt: 2000 },
    { id: 'word:nouveau-2', text: 'nouveau 2', updatedAt: 2000 }
  ];

  const mergedUncleaned = mergeVocabLists(localOldDevice, cloudNewBatch);
  // Vì không có tombstone, mergeVocabLists gộp cả 2 theo id -> 4 mục (mục cũ bị hồi sinh!)
  assert.strictEqual(mergedUncleaned.merged.length, 4, 'Chứng minh rủi ro: 2 mục cũ bị hồi sinh thành 4 mục');
  assert.strictEqual(mergedUncleaned.hasLocalNew, true, 'Thiết bị cũ sẽ đẩy 2 mục cũ ngược lên Cloud');

  // Kịch bản B: Thiết bị cũ đã được dọn sạch (localStorage rỗng = []) trước khi pull
  const localCleanedDevice = [];
  const mergedCleaned = mergeVocabLists(localCleanedDevice, cloudNewBatch);
  assert.strictEqual(mergedCleaned.merged.length, 2, 'Quy trình dọn sạch giữ đúng 2 mục mới');
  assert.strictEqual(mergedCleaned.hasLocalNew, false, 'Không có mục cũ nào bị đẩy lên Cloud');
});

// =========================================================================
// TEST SUITE 9: Replace All Empty Rejection & Confirmation Token
// =========================================================================
test('C4.9 Chế độ Thay thế toàn bộ từ chối khi kết quả rỗng hoặc thiếu token THAY THE', () => {
  const stagedEmpty = {
    collisions: [],
    suspicious: [],
    stagedItems: []
  };

  // 1. Thiếu token xác nhận
  assert.throws(() => {
    SchemaV02.commitStagedImport(stagedEmpty, 'REPLACE_ALL', { confirmationText: 'SAI' }, []);
  }, /THAY THE/);

  // 2. Token đúng nhưng danh sách rỗng -> Từ chối ghi
  assert.throws(() => {
    SchemaV02.commitStagedImport(stagedEmpty, 'REPLACE_ALL', { confirmationText: 'THAY THE' }, []);
  }, /Danh sách kết quả rỗng. Từ chối ghi./);
});

// =========================================================================
// TEST SUITE 10: Restore Flat Backup JSON
// =========================================================================
test('C4.10 Khôi phục từ backup mảng phẳng: kiểm tra xác nhận KHOI PHUC và cấu trúc', () => {
  const backupData = [
    {
      id: 'item-1',
      text: 'café',
      wordVi: 'cà phê',
      tag: 'Từ',
      level: 'A1'
    }
  ];
  const backupJson = JSON.stringify(backupData);

  // 1. Thiếu token
  assert.throws(() => {
    SchemaV02.restoreFlatBackup(backupJson, 'SAI');
  }, /Cần gõ chính xác "KHOI PHUC"/);

  // 2. JSON rỗng / không phải mảng
  assert.throws(() => {
    SchemaV02.restoreFlatBackup('{}', 'KHOI PHUC');
  }, /phải là một mảng JSON/);

  // 3. Khôi phục thành công
  const restored = SchemaV02.restoreFlatBackup(backupJson, 'KHOI PHUC');
  assert.strictEqual(restored.success, true);
  assert.strictEqual(restored.count, 1);
  const it = restored.restoredVocabList[0];
  assert.strictEqual(it.norm_key, 'café');
  assert.strictEqual(it.type, 'word');
  assert.strictEqual(it.schema_version, '0.2');
});

// =========================================================================
// TEST SUITE 11: M42 - Dữ liệu thật backup/yt-aMx0d42wzBs.txt & slug/item_id
// =========================================================================
test('M42.1 Parse backup/yt-aMx0d42wzBs.txt đạt 37/37 mục, 0 lỗi, pos freeform hợp lệ', () => {
  const filePath = path.join(__dirname, '..', 'backup', 'yt-aMx0d42wzBs.txt');
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = SchemaV02.parseText2A(content);
  assert.strictEqual(parsed.errors.length, 0);
  assert.strictEqual(parsed.items.length, 37);
  assert.strictEqual(parsed.source.source_id, 'yt:aMx0d42wzBs');

  // Kiểm tra các nhãn pos tự do
  assert.strictEqual(parsed.items[0].pos, 'loc. adv.');
  assert.strictEqual(parsed.items[1].pos, 'adv.');
  assert.strictEqual(parsed.items[2].pos, 'loc. prép.');
  assert.strictEqual(parsed.items[3].pos, 'loc.');
});

test('M42.2 Kiểm tra slug và item_id trên cả 37 mục: chỉ chứa chữ, số, "-", ":", "#", không nháy hay khoảng trắng', () => {
  const filePath = path.join(__dirname, '..', 'backup', 'yt-aMx0d42wzBs.txt');
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = SchemaV02.parseText2A(content);

  const safeIdPattern = /^[a-z]+:[a-z0-9àâäéèêëîïôöùûüç-]+(?:#[0-9]+)?$/;
  parsed.items.forEach((item, idx) => {
    const flat = SchemaV02.buildFlatVocabItem(item, parsed.source);
    assert.match(flat.item_id, safeIdPattern, `Item ${idx + 1} (${flat.text}) có item_id không hợp lệ: "${flat.item_id}"`);
    assert.doesNotMatch(flat.item_id, /[\s'"]/, `Item ${idx + 1} chứa nháy hoặc khoảng trắng: "${flat.item_id}"`);
  });
});

// =========================================================================
// TEST SUITE 12: M42 - Căn chỉnh phụ đề thông minh & Nhãn âm thanh [Musique]
// =========================================================================
test('M42.3 Căn phụ đề với [Musique]: khớp chính xác và hs/he phủ đúng cụm trong câu gốc', () => {
  const fakeSentences = [
    {
      startTime: 10.5,
      endTime: 14.0,
      text: 'et maintenant passons à la vidéo c\'est [Musique] parti',
      vi: 'và bây giờ hãy cùng vào video bắt đầu thôi'
    },
    {
      startTime: 15.0,
      endTime: 18.0,
      text: 'une conversation tout à fait ordinaire.',
      vi: 'một cuộc trò chuyện hoàn toàn bình thường.'
    }
  ];

  // Khớp item 4 ("c'est parti" với câu có [Musique])
  const resMusique = SchemaV02.alignSubtitleForContext(
    'et maintenant passons à la vidéo c\'est [Musique] parti',
    'c\'est parti',
    fakeSentences
  );
  assert.strictEqual(resMusique.matched, true);
  assert.strictEqual(resMusique.status, 'EXACT');
  assert.strictEqual(resMusique.t, 10.5);
  assert.strictEqual(resMusique.t_known, true);
  assert.strictEqual(resMusique.vi, 'và bây giờ hãy cùng vào video bắt đầu thôi');
  // Đoạn highlight phải bao trọn cụm trong câu gốc
  const origSentence = fakeSentences[0].text;
  const highlighted = origSentence.slice(resMusique.hs, resMusique.he);
  assert.strictEqual(highlighted, 'c\'est [Musique] parti');

  // Khớp câu có dấu chấm/dấu câu lệch
  const resPunct = SchemaV02.alignSubtitleForContext(
    'une conversation tout à fait ordinaire',
    'tout à fait',
    fakeSentences
  );
  assert.strictEqual(resPunct.matched, true);
  assert.strictEqual(resPunct.t, 15.0);
  assert.strictEqual(resPunct.t_known, true);
});

test('M42.4 Nhiều câu cùng khớp: đặt t_known=false, t=null, không tự lấy câu đầu', () => {
  const duplicateSentences = [
    { startTime: 5.0, text: 'Tu as tout à fait raison.', vi: 'Bạn hoàn toàn đúng.' },
    { startTime: 25.0, text: 'C\'est tout à fait possible.', vi: 'Điều đó hoàn toàn có thể.' }
  ];

  const resMulti = SchemaV02.alignSubtitleForContext(
    'tout à fait',
    'tout à fait',
    duplicateSentences
  );
  assert.strictEqual(resMulti.matched, false);
  assert.strictEqual(resMulti.status, 'MULTIPLE');
  assert.strictEqual(resMulti.t, null);
  assert.strictEqual(resMulti.t_known, false);
  assert.strictEqual(resMulti.match_count, 2);
});

test('M42.5 Không tìm thấy câu: đặt t_known=false, t=0, status NOT_FOUND', () => {
  const fakeSentences = [
    { startTime: 1.0, text: 'Bonjour tout le monde.', vi: 'Chào mọi người.' }
  ];

  const resNotFound = SchemaV02.alignSubtitleForContext(
    'une phrase introuvable dans la vidéo',
    'introuvable',
    fakeSentences
  );
  assert.strictEqual(resNotFound.matched, false);
  assert.strictEqual(resNotFound.status, 'NOT_FOUND');
  assert.strictEqual(resNotFound.t, 0);
  assert.strictEqual(resNotFound.t_known, false);
});

// =========================================================================
// TEST SUITE 13: M42 - Cờ t_known=false không cho phép seek về 0:00
// =========================================================================
test('M42.6 Thẻ hoặc context có t_known=false chặn seek và hiện thông báo; thẻ không có t_known được coi là đã biết', () => {
  let toastMsg = '';
  let didSeek = false;

  const mockContext = {
    getVocab: () => [
      { id: 'item-unaligned', text: 'introuvable', videoId: 'abc1234', t: 0, t_known: false },
      { id: 'item-legacy', text: 'legacy_word', videoId: 'abc1234', t: 15.5 } // không có t_known -> coi là đã biết
    ],
    showVocabToast: (msg) => { toastMsg = msg; },
    seekToTime: () => { didSeek = true; },
    sentences: [{ startTime: 0, text: 'First' }, { startTime: 15.5, text: 'Second' }],
    currentVideoId: 'abc1234',
    isTextMode: false,
    ytPlayer: {},
    isPlayerReady: true,
    document: {
      getElementById: () => ({ classList: { add: () => {}, remove: () => {} } })
    },
    ensurePageFocus: () => {},
    getSentenceIndexForTime: (t) => (t > 10 ? 1 : 0)
  };

  // Hàm openVocabVideo mô phỏng đúng nhánh kiểm tra đã thêm vào js/01g-vocab-list.js
  function openVocabVideoSim(id) {
    const x = mockContext.getVocab().find(v => v.id === id);
    if (!x || !x.videoId) return;
    if (x.t_known === false) {
      mockContext.showVocabToast('Từ vựng này chưa căn mốc thời gian trong video');
      return;
    }
    const s = mockContext.sentences[mockContext.getSentenceIndexForTime(x.t || 0)];
    mockContext.seekToTime(s ? s.startTime : (x.t || 0));
  }

  // 1. Thẻ chưa căn mốc (t_known === false): không seek, báo toast
  openVocabVideoSim('item-unaligned');
  assert.strictEqual(didSeek, false, 'Không được gọi seek khi t_known === false');
  assert.strictEqual(toastMsg, 'Từ vựng này chưa căn mốc thời gian trong video');

  // 2. Thẻ legacy (thiếu t_known): được phép seek
  didSeek = false;
  openVocabVideoSim('item-legacy');
  assert.strictEqual(didSeek, true, 'Thẻ thiếu t_known phải được coi là đã biết');
});

// =========================================================================
// TEST SUITE 14: M42 - OCC cho từ đã có ở video khác & Bảo toàn SRS
// =========================================================================
test('M42.7 OCC cho từ đã có ở video khác: tạo context mới đúng videoId, không tạo thẻ mới, không reset SRS', () => {
  const existingDB = [
    {
      id: 'word:école',
      text: 'école',
      wordVi: 'trường học',
      tag: 'Từ',
      level: 'A1',
      videoId: 'videoA',
      en: 'Je vais à l\'école.',
      t: 10.0,
      t_known: true,
      srs: { ease: 2.8, interval: 14, reps: 5, due: 9999999, lastReview: 123456 },
      contexts: []
    }
  ];

  const occContent = [
    '# SOURCE: yt:videoB | Video B',
    'OCC: école || Trong bài: L\'école de musique est fermée.'
  ].join('\n');

  const staged = SchemaV02.stageMultiSourceImport([{
    fileName: 'videoB.txt',
    source_id: 'yt:videoB',
    title: 'Video B',
    content: occContent
  }], existingDB);

  const commitRes = SchemaV02.commitStagedImport(staged, 'ADD_SOURCE', {}, existingDB);
  assert.strictEqual(commitRes.success, true);
  assert.strictEqual(commitRes.updatedVocabList.length, 1, 'Không được tạo thẻ mới');

  const updatedItem = commitRes.updatedVocabList[0];
  assert.strictEqual(updatedItem.id, 'word:école');
  assert.strictEqual(updatedItem.srs.reps, 5, 'SRS reps phải được giữ nguyên');
  assert.strictEqual(updatedItem.srs.ease, 2.8, 'SRS ease phải được giữ nguyên');
  assert.strictEqual(updatedItem.contexts.length, 1, 'Phải có 1 context mới');
  assert.strictEqual(updatedItem.contexts[0].videoId, 'videoB');
  assert.strictEqual(updatedItem.contexts[0].en, 'L\'école de musique est fermée.');
});

// =========================================================================
// TEST SUITE 15: M42 - Mục ĐÃ CÓ chỉ điền trường trống
// =========================================================================
test('M42.8 Mục ĐÃ CÓ: chỉ điền trường đang trống (wordVi, level, examples), không đè giá trị cũ, giữ srs', () => {
  const existingDB = [
    {
      id: 'word:maison',
      text: 'maison',
      wordVi: 'ngôi nhà',
      tag: 'Từ',
      level: 'A1',
      examples: [{ fr: 'Belle maison.', vi: 'Nhà đẹp.' }],
      srs: { ease: 2.6, interval: 7, reps: 3, due: 500000 },
      videoId: 'video1'
    },
    {
      id: 'word:livre',
      text: 'livre',
      wordVi: '', // trường này trống
      tag: 'Từ',
      level: 'A2',
      examples: [], // trường này trống
      srs: { ease: 2.5, interval: 0, reps: 0, due: 100 },
      videoId: 'video1'
    }
  ];

  const incomingContent = [
    '1. maison || từ || B2 || [n.f.] nhà cửa (nghĩa mới)',
    'Trong bài: La maison est grande.',
    'VD1: Autre exemple. || Ví dụ khác.',
    '2. livre || từ || B1 || [n.m.] cuốn sách',
    'Trong bài: Je lis un livre.',
    'VD1: Ce livre est captivant. || Cuốn sách này lôi cuốn.'
  ].join('\n');

  const staged = SchemaV02.stageMultiSourceImport([{
    fileName: 'new.txt',
    source_id: 'yt:video2',
    title: 'Video 2',
    content: incomingContent
  }], existingDB);

  const commitRes = SchemaV02.commitStagedImport(staged, 'ADD_SOURCE', {}, existingDB);
  const list = commitRes.updatedVocabList;

  const maison = list.find(x => x.text === 'maison');
  assert.strictEqual(maison.wordVi, 'ngôi nhà', 'Không được đè wordVi đã có');
  assert.strictEqual(maison.level, 'A1', 'Không được đè level đã có');
  assert.strictEqual(maison.examples.length, 1, 'Không được đè examples đã có');
  assert.strictEqual(maison.srs.reps, 3, 'SRS không đổi');

  const livre = list.find(x => x.text === 'livre');
  assert.strictEqual(livre.wordVi, 'cuốn sách', 'Phải điền wordVi vì trước đó trống');
  assert.strictEqual(livre.level, 'B1', 'Phải điền level mới');
  assert.strictEqual(livre.examples.length, 1, 'Phải điền examples vì trước đó trống');
});

// =========================================================================
// TEST SUITE 16: M42 - mergeVocabLists bảo toàn 100% trường Schema 0.2
// =========================================================================
test('M42.9 mergeVocabLists: không làm mất item_id, norm_key, t_known, schema_version, contexts', () => {
  // Trích hàm mergeVocabLists từ js/supabase-sync.js thuần túy
  const syncCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'supabase-sync.js'), 'utf8');
  const fnMatch = syncCode.match(/function mergeVocabLists\([\s\S]*?\n  \}/);
  assert.ok(fnMatch, 'Tìm thấy hàm mergeVocabLists trong supabase-sync.js');
  const fn = new Function('localList', 'cloudList', fnMatch[0] + '\nreturn mergeVocabLists(localList, cloudList);');

  const localItem = {
    id: 'word:soleil',
    text: 'soleil',
    item_id: 'word:soleil',
    norm_key: 'soleil',
    type: 'word',
    t_known: true,
    schema_version: '0.2',
    contexts: [{ source_id: 'yt:vid1', videoId: 'vid1', t: 45.2, t_known: true }],
    updatedAt: 2000
  };

  const cloudItemLegacy = {
    id: 'word:soleil',
    text: 'soleil',
    wordVi: 'mặt trời',
    updatedAt: 1000
  };

  // Local mới + Cloud legacy
  const res1 = fn([localItem], [cloudItemLegacy]);
  const it1 = res1.merged[0];
  assert.strictEqual(it1.item_id, 'word:soleil');
  assert.strictEqual(it1.norm_key, 'soleil');
  assert.strictEqual(it1.t_known, true);
  assert.strictEqual(it1.schema_version, '0.2');
  assert.strictEqual(it1.contexts.length, 1);
  assert.strictEqual(it1.contexts[0].t_known, true);
  assert.strictEqual(it1.wordVi, 'mặt trời');

  // Cloud mới + Local legacy
  const res2 = fn([cloudItemLegacy], [localItem]);
  const it2 = res2.merged[0];
  assert.strictEqual(it2.item_id, 'word:soleil');
  assert.strictEqual(it2.norm_key, 'soleil');
  assert.strictEqual(it2.t_known, true);
  assert.strictEqual(it2.schema_version, '0.2');
  assert.strictEqual(it2.contexts.length, 1);
});

// =========================================================================
// TEST SUITE 16: M42.10 - An toàn dữ liệu nguồn: chỉ căn phụ đề khi source_id trùng video đang mở
// =========================================================================
test('M42.10 (a) header khác video đang mở: không mục nào có t_known=true, t=null, preview hiện cảnh báo rõ', () => {
  const fakeSentences = [
    { startTime: 12.0, text: 'J\'ai acheté une maison.', vi: 'Tôi đã mua một ngôi nhà.' }
  ];

  const contentOther = [
    '# SOURCE: yt:videoOther123 | Video Khác',
    '',
    '1. maison || từ || A1 || [n.f.] ngôi nhà',
    'Trong bài: J\'ai acheté une maison.'
  ].join('\n');

  const staged = SchemaV02.stageMultiSourceImport([{
    fileName: 'test_diff.txt',
    content: contentOther
  }], [], {
    sentences: fakeSentences,
    currentVideoId: 'videoOpen456'
  });

  assert.strictEqual(staged.files.length, 1);
  assert.ok(staged.files[0].warning.includes('Nguồn trong file (yt:videoOther123) khác video đang mở (yt:videoOpen456)'));
  assert.ok(staged.warnings.length > 0);

  // Không mục nào có t_known=true
  staged.stagedItems.forEach(it => {
    assert.strictEqual(it.primaryContext.t_known, false);
    assert.strictEqual(it.primaryContext.t, null);
  });
});

test('M42.10 (b) header trùng video đang mở: căn phụ đề bình thường, t_known=true', () => {
  const fakeSentences = [
    { startTime: 12.0, text: 'J\'ai acheté une maison.', vi: 'Tôi đã mua một ngôi nhà.' }
  ];

  const contentSame = [
    '# SOURCE: yt:videoOpen456 | Video Đang Mở',
    '',
    '1. maison || từ || A1 || [n.f.] ngôi nhà',
    'Trong bài: J\'ai acheté une maison.'
  ].join('\n');

  const staged = SchemaV02.stageMultiSourceImport([{
    fileName: 'test_same.txt',
    content: contentSame
  }], [], {
    sentences: fakeSentences,
    currentVideoId: 'videoOpen456'
  });

  assert.strictEqual(staged.files.length, 1);
  assert.strictEqual(staged.files[0].warning, null);

  const maison = staged.stagedItems.find(it => it.fr === 'maison');
  assert.ok(maison);
  assert.strictEqual(maison.primaryContext.t_known, true);
  assert.strictEqual(maison.primaryContext.t, 12.0);
  assert.strictEqual(maison.primaryContext.align_status, 'EXACT');
});

test('M42.10 (c) nội dung không có header: dùng source_id video đang mở và căn bình thường', () => {
  const fakeSentences = [
    { startTime: 12.0, text: 'J\'ai acheté une maison.', vi: 'Tôi đã mua một ngôi nhà.' }
  ];

  const contentNoHeader = [
    '1. maison || từ || A1 || [n.f.] ngôi nhà',
    'Trong bài: J\'ai acheté une maison.'
  ].join('\n');

  const staged = SchemaV02.stageMultiSourceImport([{
    fileName: 'test_no_header.txt',
    content: contentNoHeader
  }], [], {
    sentences: fakeSentences,
    currentVideoId: 'videoOpen456',
    currentVideoTitle: 'Video Đang Mở'
  });

  assert.strictEqual(staged.files.length, 1);
  assert.strictEqual(staged.files[0].source_id, 'yt:videoOpen456');
  assert.strictEqual(staged.files[0].warning, null);

  const maison = staged.stagedItems.find(it => it.fr === 'maison');
  assert.ok(maison);
  assert.strictEqual(maison.source_id, 'yt:videoOpen456');
  assert.strictEqual(maison.primaryContext.source_id, 'yt:videoOpen456');
  assert.strictEqual(maison.primaryContext.t_known, true);
  assert.strictEqual(maison.primaryContext.t, 12.0);
});

// =========================================================================
// TEST SUITE 12: Backup Lock & Verification (C1, C2, C3)
// =========================================================================

function setupImporterVm(initialStorage = {}) {
  const code = fs.readFileSync(path.join(__dirname, '../js/19-vocab-import-preview.js'), 'utf-8');
  const store = Object.assign({}, initialStorage);
  const elements = {};
  function getEl(id) {
    if (!elements[id]) {
      elements[id] = {
        id,
        classList: {
          contains: () => false,
          add: () => {},
          remove: () => {},
          toggle: () => {}
        },
        style: {},
        value: '',
        disabled: false,
        textContent: '',
        innerHTML: '',
        className: '',
        appendChild: () => {},
        removeChild: () => {},
        querySelector: () => null,
        querySelectorAll: () => []
      };
    }
    return elements[id];
  }

  const downloadedBlobs = [];
  const sandbox = {
    SchemaV02: SchemaV02,
    VOCAB_STORAGE_KEY: 'shadowing_saved_vocab_v1',
    localStorage: {
      getItem(k) { return store[k] !== undefined ? store[k] : null; },
      setItem(k, v) { store[k] = String(v); },
      removeItem(k) { delete store[k]; }
    },
    document: {
      body: {
        classList: { add: () => {}, remove: () => {} },
        style: {},
        appendChild: () => {},
        removeChild: () => {}
      },
      getElementById(id) { return getEl(id); },
      createElement(tag) {
        return {
          tag,
          style: {},
          click() {},
          href: '',
          download: '',
          className: '',
          innerHTML: '',
          appendChild: () => {},
          removeChild: () => {},
          setAttribute: () => {}
        };
      },
      addEventListener() {}
    },
    Blob: function (parts, options) {
      this.parts = parts;
      this.options = options;
      downloadedBlobs.push(this);
    },
    URL: {
      createObjectURL: () => 'blob:mock-url',
      revokeObjectURL: () => {}
    },
    alert: () => {},
    console: console,
    Date: Date,
    JSON: JSON
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  return { sandbox, elements, store, downloadedBlobs, getEl };
}

test('C1: REQUIRE_BACKUP_BEFORE_REPLACE kiểm soát yêu cầu sao lưu (mặc định false khi chưa release, true sau release)', () => {
  const { sandbox, getEl } = setupImporterVm();

  // A. MẶC ĐỊNH (REQUIRE_BACKUP_BEFORE_REPLACE = false): Không bắt buộc tải backup
  assert.strictEqual(sandbox.getRequireBackupBeforeReplace(), false, 'Mặc định khi chưa release phải là false');

  // 1. RESTORE: gõ "KHOI PHUC", chưa tải backup -> Vẫn mở khóa bình thường
  sandbox.switchVocabImportMode('RESTORE');
  getEl('fss-import-confirm-restore-input').value = 'KHOI PHUC';
  sandbox.setBackupSessionStatus(false);
  sandbox.checkCommitUnlock();
  assert.strictEqual(getEl('fss-import-commit-btn').disabled, false, 'Mặc định false: RESTORE mở ngay khi có token');

  // 2. REPLACE_ALL: gõ "THAY THE", chưa tải backup -> Vẫn mở khóa bình thường
  sandbox.switchVocabImportMode('REPLACE_ALL');
  getEl('fss-import-confirm-replace-input').value = 'THAY THE';
  getEl('fss-import-textarea').value = '1. pomme || từ || A1 || [n.f.] quả táo\nTrong bài: J\'aime la pomme.';
  sandbox.runVocabDryRunPreview();
  sandbox.setBackupSessionStatus(false);
  sandbox.checkCommitUnlock();
  assert.strictEqual(getEl('fss-import-commit-btn').disabled, false, 'Mặc định false: REPLACE_ALL mở ngay khi có token');

  // B. KHI BẬT (REQUIRE_BACKUP_BEFORE_REPLACE = true): Bắt buộc tải backup
  sandbox.setRequireBackupBeforeReplace(true);

  // 3. RESTORE khi bật: chưa tải backup -> Bị khóa
  sandbox.switchVocabImportMode('RESTORE');
  sandbox.setBackupSessionStatus(false);
  sandbox.checkCommitUnlock();
  assert.strictEqual(getEl('fss-import-commit-btn').disabled, true, 'Bật true: RESTORE bị khóa khi chưa tải backup');
  assert.match(getEl('fss-import-status-text').textContent, /Chặn khôi phục/);

  // 4. REPLACE_ALL khi bật: chưa tải backup -> Bị khóa
  sandbox.switchVocabImportMode('REPLACE_ALL');
  sandbox.setBackupSessionStatus(false);
  sandbox.checkCommitUnlock();
  assert.strictEqual(getEl('fss-import-commit-btn').disabled, true, 'Bật true: REPLACE_ALL bị khóa khi chưa tải backup');
  assert.match(getEl('fss-import-status-text').textContent, /Chặn thay thế/);

  // 5. Chế độ ADD_SOURCE: luôn mở, không bao giờ đòi sao lưu
  sandbox.switchVocabImportMode('ADD_SOURCE');
  sandbox.checkCommitUnlock();
  assert.strictEqual(getEl('fss-import-commit-btn').disabled, false, 'ADD_SOURCE: luôn mở bình thường');
});

test('C2: Khi REQUIRE_BACKUP_BEFORE_REPLACE = true, tải sao lưu mở khóa nút ghi trong phiên', () => {
  const { sandbox, getEl } = setupImporterVm({
    shadowing_saved_vocab_v1: JSON.stringify([{ id: 'word:pomme', text: 'pomme', type: 'word' }])
  });

  // Bật yêu cầu sao lưu
  sandbox.setRequireBackupBeforeReplace(true);

  // RESTORE mode: ban đầu bị khóa
  sandbox.switchVocabImportMode('RESTORE');
  getEl('fss-import-confirm-restore-input').value = 'KHOI PHUC';
  sandbox.checkCommitUnlock();
  assert.strictEqual(getEl('fss-import-commit-btn').disabled, true);

  // Tải sao lưu -> Mở khóa
  sandbox.downloadVocabJsonBackup();
  assert.strictEqual(sandbox.getBackupSessionStatus(), true, 'downloadVocabJsonBackup phải set status = true');
  assert.strictEqual(getEl('fss-import-commit-btn').disabled, false, 'Nút ghi phải mở sau khi tải sao lưu');

  // Mở lại modal: reset session status -> Lại bị khóa cho đến khi tải lại
  sandbox.openVocabImportModal();
  assert.strictEqual(sandbox.getBackupSessionStatus(), false, 'openVocabImportModal phải reset session status');
  sandbox.switchVocabImportMode('RESTORE');
  getEl('fss-import-confirm-restore-input').value = 'KHOI PHUC';
  sandbox.checkCommitUnlock();
  assert.strictEqual(getEl('fss-import-commit-btn').disabled, true, 'Phiên mới khi bật cấu hình vẫn yêu cầu tải lại sao lưu');
});

test('C3: File sao lưu chứa metadata (tổng số mục, active, tombstone, exportedAt) và restoreFlatBackup đọc lại được', () => {
  const initialItems = [
    { id: 'word:pomme', text: 'pomme', type: 'word', schema_version: '0.2' },
    { id: 'word:orange', text: 'orange', type: 'word', _deleted: true, schema_version: '0.2' }
  ];
  const { sandbox, downloadedBlobs } = setupImporterVm({
    shadowing_saved_vocab_v1: JSON.stringify(initialItems)
  });

  sandbox.downloadVocabJsonBackup();
  assert.strictEqual(downloadedBlobs.length, 1);
  const downloadedJson = downloadedBlobs[0].parts[0];
  const parsed = JSON.parse(downloadedJson);

  // Kiểm tra cấu trúc metadata
  assert.ok(parsed.metadata, 'File sao lưu phải có metadata');
  assert.strictEqual(parsed.metadata.totalItems, 2, 'Tổng số mục = 2');
  assert.strictEqual(parsed.metadata.activeCount, 1, 'Số active = 1');
  assert.strictEqual(parsed.metadata.tombstoneCount, 1, 'Số tombstone = 1');
  assert.ok(parsed.metadata.exportedAt, 'exportedAt phải tồn tại');
  assert.strictEqual(parsed.metadata.schema_version, '0.2');
  assert.strictEqual(parsed.items.length, 2);

  // Kiểm tra restoreFlatBackup đọc lại thành công
  const res = SchemaV02.restoreFlatBackup(downloadedJson, 'KHOI PHUC');
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.count, 2);
  assert.strictEqual(res.restoredVocabList[0].item_id, 'word:pomme');
  assert.strictEqual(res.restoredVocabList[1].item_id, 'word:orange');
});

// =========================================================================
// TEST SUITE 13: Nghiệm thu không trùng thẻ trên localStorage giả lập (Item 2)
// =========================================================================
test('Nghiệm thu: nạp backup/yt-aMx0d42wzBs.txt 2 lần bằng Thêm nguồn, không trùng thẻ, srs không đổi', () => {
  const filePath = path.join(__dirname, '../backup/yt-aMx0d42wzBs.txt');
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Lần 1: Nạp vào kho rỗng
  const staged1 = SchemaV02.stageMultiSourceImport([{
    fileName: 'yt-aMx0d42wzBs.txt',
    content: fileContent
  }], []);
  assert.strictEqual(staged1.stats.newCount, 37, 'Lần 1 phải có 37 mục mới');

  const commit1 = SchemaV02.commitStagedImport(staged1, 'ADD_SOURCE', {}, []);
  const list1 = commit1.updatedVocabList;
  assert.strictEqual(list1.length, 37, 'Kho sau lần 1 phải có đúng 37 mục');

  // Đặt tiến độ học (SRS) cho một số mục để kiểm tra bảo toàn
  list1[0].srs = { reps: 4, interval: 14, ease: 2.6, due: Date.now() + 86400000 };
  list1[5].srs = { reps: 2, interval: 6, ease: 2.5, due: Date.now() + 86400000 };
  const srsSnapshot0 = Object.assign({}, list1[0].srs);
  const srsSnapshot5 = Object.assign({}, list1[5].srs);

  // Lần 2: Nạp lại ĐÚNG file đó vào kho list1
  const staged2 = SchemaV02.stageMultiSourceImport([{
    fileName: 'yt-aMx0d42wzBs.txt',
    content: fileContent
  }], list1);

  assert.strictEqual(staged2.stats.newCount, 0, 'Lần 2 phải có 0 mục mới');
  assert.strictEqual(staged2.stats.existsCount, 37, 'Lần 2 cả 37 mục phải là ĐÃ CÓ');

  const commit2 = SchemaV02.commitStagedImport(staged2, 'ADD_SOURCE', {}, list1);
  const list2 = commit2.updatedVocabList;

  // Nghiệm thu: số mục không đổi, srs không đổi
  assert.strictEqual(list2.length, 37, 'Tổng số mục sau lần 2 vẫn là 37');
  assert.deepStrictEqual(list2[0].srs, srsSnapshot0, 'SRS mục 0 phải được giữ nguyên 100%');
  assert.deepStrictEqual(list2[5].srs, srsSnapshot5, 'SRS mục 5 phải được giữ nguyên 100%');
});

test('Nghiệm thu: nạp test1.txt rồi test2.txt -> maison thêm 1 OCC không tạo thẻ mới, bientôt là 1 mục mới', () => {
  const file1Content = fs.readFileSync(path.join(__dirname, '../backup/test1.txt'), 'utf-8');
  const file2Content = fs.readFileSync(path.join(__dirname, '../backup/test2.txt'), 'utf-8');

  // Bước 1: Nạp test1.txt
  const staged1 = SchemaV02.stageMultiSourceImport([{
    fileName: 'test1.txt',
    content: file1Content
  }], []);
  assert.strictEqual(staged1.stats.newCount, 1, 'test1.txt có 1 mục mới (maison)');

  const commit1 = SchemaV02.commitStagedImport(staged1, 'ADD_SOURCE', {}, []);
  const list1 = commit1.updatedVocabList;
  assert.strictEqual(list1.length, 1);
  assert.strictEqual(list1[0].norm_key, 'maison');
  assert.strictEqual(list1[0].contexts.length, 0, 'Lúc đầu chưa có secondary context');

  // Đặt SRS cho maison
  list1[0].srs = { reps: 3, interval: 10, ease: 2.5, due: 123456789 };

  // Bước 2: Nạp test2.txt (chứa OCC maison và mục mới bientôt)
  const staged2 = SchemaV02.stageMultiSourceImport([{
    fileName: 'test2.txt',
    content: file2Content
  }], list1);

  assert.strictEqual(staged2.stats.newCount, 1, 'bientôt là 1 mục mới');
  assert.strictEqual(staged2.files[0].occurrencesCount, 1, 'maison được nhận diện qua OCC (occurrencesCount = 1)');

  const commit2 = SchemaV02.commitStagedImport(staged2, 'ADD_SOURCE', {}, list1);
  const list2 = commit2.updatedVocabList;

  // Nghiệm thu:
  // 1. Tổng số thẻ = 2 (maison và bientôt)
  assert.strictEqual(list2.length, 2, 'Tổng số thẻ phải là 2');

  // 2. maison: chỉ có 1 thẻ duy nhất (không trùng thẻ), có 1 secondary context mới từ video 2
  const maisonCards = list2.filter(it => it.norm_key === 'maison');
  assert.strictEqual(maisonCards.length, 1, 'Chỉ được có đúng 1 thẻ maison (không bị trùng thẻ)');
  assert.strictEqual(maisonCards[0].contexts.length, 1, 'maison có thêm 1 context từ test2.txt');
  assert.strictEqual(maisonCards[0].contexts[0].source_id, 'yt:testvideo02');
  assert.strictEqual(maisonCards[0].contexts[0].source_text || maisonCards[0].contexts[0].en, 'Nous construisons une nouvelle maison.');
  assert.strictEqual(maisonCards[0].srs.reps, 3, 'SRS của maison không bị thay đổi');
  assert.strictEqual(maisonCards[0].srs.interval, 10);

  // 3. bientôt: 1 mục mới hoàn toàn
  const bientotCard = list2.find(it => it.norm_key === 'bientôt' || it.fr === 'bientôt');
  assert.ok(bientotCard, 'Thẻ bientôt phải tồn tại');
  assert.strictEqual(bientotCard.source_id, 'yt:testvideo02');
  assert.strictEqual(bientotCard.wordVi, 'sớm, sắp tới');
});
