/**
 * French Shadowing Studio - Dry-run Verification Script
 * Chạy hoàn toàn ngoại tuyến trên file backup JSON: backup/supabase_vocab_backup_20261101.json
 * và đối chiếu với backup/video1_291.txt
 */

const fs = require('fs');
const path = require('path');
const { readExistingVocabToSchemaV02, parseText2A, norm_key } = require('./schema-v02.js');

const backupPath = path.join(__dirname, '..', 'backup', 'supabase_vocab_backup_20261101.json');
const txt291Path = path.join(__dirname, '..', 'backup', 'video1_291.txt');

if (!fs.existsSync(backupPath)) {
  console.error('[LỖI] Không tìm thấy file backup tại:', backupPath);
  process.exit(1);
}

const rawData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
const result = readExistingVocabToSchemaV02(rawData);

console.log('================================================================');
console.log('      FRENCH SHADOWING STUDIO - BÁO CÁO ĐỐI CHIẾU DRY-RUN       ');
console.log('================================================================');

// 1. Kiểm tra số lượng mục thô, active và tombstone
console.log(`\n1. TỔNG SỐ BẢN GHI:`);
console.log(`   - Tổng số bản ghi thô: ${result.stats.total_raw}`);
console.log(`   - Số mục Active: ${result.stats.active_count} (Yêu cầu: 504)`);
console.log(`   - Số tombstone bị loại bỏ: ${result.stats.tombstone_count} (Yêu cầu: 770)`);

// 2. Phân bổ mục active theo Video
const videoCounts = {};
rawData.filter(x => !x._deleted).forEach(x => {
  const vid = x.videoId || 'unknown';
  videoCounts[vid] = (videoCounts[vid] || 0) + 1;
});

console.log(`\n2. PHÂN BỔ THEO VIDEO (ACTIVE):`);
console.log(`   - Video UoxA5R0tcFA: ${videoCounts['UoxA5R0tcFA'] || 0} (Yêu cầu: 280)`);
console.log(`   - Video dwt1yeNtKeQ: ${videoCounts['dwt1yeNtKeQ'] || 0} (Yêu cầu: 138)`);
console.log(`   - Video 0a8m1JaypTo: ${videoCounts['0a8m1JaypTo'] || 0} (Yêu cầu: 86)`);

// 3. Số mục có contexts
const itemsWithContexts = rawData.filter(x => !x._deleted && Array.isArray(x.contexts) && x.contexts.length > 0);
console.log(`\n3. SỐ MỤC CÓ CONTEXTS:`);
console.log(`   - Số mục có contexts liên video: ${itemsWithContexts.length} (Yêu cầu: 31)`);

// 4. Các cặp nghi trùng (Suspicious duplicate pairs)
console.log(`\n4. CẶP NGHI TRÙNG THEO NORM_KEY / GỐC TỪ:`);
console.log(`   - Số cặp phát hiện: ${result.suspiciousPairs.length} (Yêu cầu: 1)`);
result.suspiciousPairs.forEach((pair, idx) => {
  console.log(`     ${idx + 1}. "${pair[0].fr}" (${pair[0].item_id}) <-> "${pair[1].fr}" (${pair[1].item_id})`);
});

// 5. Số mục có tag không ánh xạ được sang type
console.log(`\n5. KIỂM TRA ÁNH XẠ TAG SANG TYPE:`);
console.log(`   - Số tag không ánh xạ được: ${result.unmappedTags.length} (Yêu cầu: 0)`);

// 6. Kiểm tra va chạm item_id (slug trùng nhau do bỏ dấu)
console.log(`\n6. KIỂM TRA VA CHẠM ITEM_ID:`);
console.log(`   - Số ca va chạm slug trong 504 mục hiện hành: ${result.collisions.length} (Yêu cầu: 0)`);
if (result.collisions.length > 0) {
  result.collisions.forEach(col => {
    console.log(`     - [CẢNH BÁO] item_id "${col.item_id}" va chạm giữa "${col.fr}" và "${col.collided_with_fr}"`);
  });
}

// 7. Đối chiếu với file 291 mục gốc
if (fs.existsSync(txt291Path)) {
  console.log(`\n7. ĐỐI CHIẾU NGOẠI TUYẾN VỚI TỆP 291 MỤC GỐC (backup/video1_291.txt):`);
  const txtContent = fs.readFileSync(txt291Path, 'utf-8');
  const p291 = parseText2A(txtContent, 'yt:UoxA5R0tcFA');
  console.log(`   - Số mục parse thành công: ${p291.items.length}/291 (Số lỗi cú pháp: ${p291.errors.length})`);
}

// 8. Tổng kết xác thực (Assertion Check)
console.log('\n================================================================');
const passed = (
  result.stats.active_count === 504 &&
  result.stats.tombstone_count === 770 &&
  videoCounts['UoxA5R0tcFA'] === 280 &&
  videoCounts['dwt1yeNtKeQ'] === 138 &&
  videoCounts['0a8m1JaypTo'] === 86 &&
  itemsWithContexts.length === 31 &&
  result.suspiciousPairs.length === 1 &&
  result.unmappedTags.length === 0 &&
  result.collisions.length === 0
);

if (passed) {
  console.log('✅ KẾT QUẢ ĐỐI CHIẾU: TẤT CẢ CÁC CHỈ SỐ ĐỀU KHỚP TUYỆT ĐỐI 100%!');
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error('❌ KẾT QUẢ ĐỐI CHIẾU: CÓ SAI LỆCH VỚI CHỈ SỐ YÊU CẦU!');
  console.log('================================================================\n');
  process.exit(1);
}
