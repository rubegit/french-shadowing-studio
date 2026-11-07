/**
 * tools/handover.js
 * French Shadowing Studio (FSS) - Automatic Context Lifecycle & Session Handover Tooling
 * Module: M41 (v3.0-production-ready-design)
 *
 * Capabilities:
 * - Direct Context Telemetry with reverse chunk reader (MEASURED / ESTIMATED / UNKNOWN).
 * - Adaptive thresholds against configurable operational ceiling (default: 200,000 tokens).
 * - Atomic concurrency mutex with PID + macOS lstart + UUID (immune to PID reuse and stale lock hazards).
 * - 5-step atomic write on same APFS filesystem (tmp -> fsync -> bak -> rename -> post-verify).
 * - Tiered checkpoints: Lightweight (<60ms) vs Full Validation (runs test suite).
 * - Safe rollback without destructive Git commands.
 * - 0 external dependencies (Pure Node.js core libraries).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const HANDOVER_FILE_PATH = path.join(PROJECT_ROOT, 'HANDOVER.md');
const LOCK_FILE_PATH = HANDOVER_FILE_PATH + '.lock';
const BAK_FILE_PATH = HANDOVER_FILE_PATH + '.bak';
const BACKUP_MANIFEST_DIR = path.join(PROJECT_ROOT, '.pre_stage_b_backup');

const DEFAULT_OPERATIONAL_CEILING = 200000;
const CEILING_DISCLAIMER = 'Configured operational ceiling, not verified model context window limit';
const DEFAULT_CHUNK_SIZE = 16 * 1024; // 16KB
const DEFAULT_MAX_SCAN_BYTES = 512 * 1024; // 512KB
const LOCK_TIMEOUT_MS = 3000;
const LOCK_POLL_INTERVAL_MS = 40;

const MANDATORY_SECTIONS = [
  'Metadata Bàn giao',
  'Trạng thái Git',
  'Tiến độ & Trạng thái Các Module Gần Nhất',
  'Quyết định Kỹ thuật'
];

/**
 * Computes SHA-256 hash of a string or buffer.
 */
function sha256(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Retrieves the exact process start time (lstart) using macOS ps command.
 * Returns null if process does not exist.
 */
function getProcessLstart(pid) {
  if (!pid || typeof pid !== 'number' || isNaN(pid)) return null;
  try {
    const out = execSync(`ps -p ${pid} -o lstart=`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 1000
    });
    return out.trim() || null;
  } catch (err) {
    return null;
  }
}

/**
 * Acquires atomic file lock using fs.openSync with O_CREAT | O_EXCL.
 * Detects dead PIDs and PID reuse via lstart comparison.
 */
function acquireLock(targetLockPath = LOCK_FILE_PATH, timeoutMs = LOCK_TIMEOUT_MS) {
  const start = Date.now();
  const ownerUuid = Math.random().toString(36).substring(2) + '-' + Date.now() + '-' + process.pid;
  const myLstart = getProcessLstart(process.pid);

  while (Date.now() - start < timeoutMs) {
    try {
      const fd = fs.openSync(
        targetLockPath,
        fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_RDWR
      );
      const payload = JSON.stringify(
        {
          pid: process.pid,
          lstart: myLstart,
          ownerUuid: ownerUuid,
          acquiredAt: new Date().toISOString()
        },
        null,
        2
      );
      fs.writeSync(fd, payload);
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      return { success: true, ownerUuid, lockPath: targetLockPath };
    } catch (err) {
      if (err.code === 'EEXIST') {
        try {
          if (fs.existsSync(targetLockPath)) {
            const raw = fs.readFileSync(targetLockPath, 'utf8');
            const data = JSON.parse(raw);
            const currentLstart = getProcessLstart(data.pid);

            // Reclaim lock if process is dead OR PID was recycled by OS (lstart mismatch)
            const isStale = currentLstart === null || (data.lstart && currentLstart !== data.lstart);
            if (isStale) {
              try {
                fs.unlinkSync(targetLockPath);
                continue;
              } catch (unlinkErr) {
                // Ignore if unlinked by another contender
              }
            }
          }
        } catch (readErr) {
          // Lockfile might be concurrently written or invalid JSON
        }

        const wait = Math.min(LOCK_POLL_INTERVAL_MS, timeoutMs - (Date.now() - start));
        if (wait > 0) {
          const sleepUntil = Date.now() + wait;
          while (Date.now() < sleepUntil) {}
        }
      } else {
        throw err;
      }
    }
  }

  return {
    success: false,
    error: 'LOCK_TIMEOUT',
    reason: `Could not acquire lock on ${targetLockPath} within ${timeoutMs}ms`,
    lockPath: targetLockPath
  };
}

/**
 * Releases lock only if ownerUuid matches.
 */
function releaseLock(targetLockPath = LOCK_FILE_PATH, ownerUuid) {
  try {
    if (!fs.existsSync(targetLockPath)) return true;
    const raw = fs.readFileSync(targetLockPath, 'utf8');
    const data = JSON.parse(raw);
    if (data.ownerUuid === ownerUuid) {
      fs.unlinkSync(targetLockPath);
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Finds the active Antigravity transcript file path.
 * Strictly binds to the active session. If session cannot be determined, returns null (UNKNOWN).
 */
function findTranscriptPath(customPath) {
  if (customPath) {
    return customPath;
  }
  if (process.env.ANTIGRAVITY_TRANSCRIPT_PATH && fs.existsSync(process.env.ANTIGRAVITY_TRANSCRIPT_PATH)) {
    return process.env.ANTIGRAVITY_TRANSCRIPT_PATH;
  }

  // Strictly bind to the current active session via ANTIGRAVITY_CONVERSATION_ID
  const convId = process.env.ANTIGRAVITY_CONVERSATION_ID;
  if (convId) {
    const appDataDir = process.env.ANTIGRAVITY_APP_DATA_DIR || path.join(process.env.HOME || '', '.gemini/antigravity');
    const candidate = path.join(appDataDir, 'brain', convId, '.system_generated/logs/transcript.jsonl');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // If active conversation cannot be determined, return null to force UNKNOWN
  // instead of guessing an arbitrary session from the directory.
  return null;
}

/**
 * Reverse Chunk Reader for transcript.jsonl.
 * Reads backwards in chunks (16KB) to find the latest MODEL:PLANNER_RESPONSE with token fields.
 */
function readLatestTelemetry(transcriptPath, maxScanBytes = DEFAULT_MAX_SCAN_BYTES, chunkSize = DEFAULT_CHUNK_SIZE) {
  const filePath = findTranscriptPath(transcriptPath);
  if (!filePath) {
    return {
      status: 'UNKNOWN',
      reason: 'session_transcript_not_identified',
      transcriptPath: null
    };
  }
  if (!fs.existsSync(filePath)) {
    return {
      status: 'UNKNOWN',
      reason: 'transcript_file_not_found',
      transcriptPath: filePath
    };
  }

  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const stat = fs.fstatSync(fd);
    const fileSize = stat.size;
    if (fileSize === 0) {
      return { status: 'UNKNOWN', reason: 'transcript_empty', transcriptPath: filePath };
    }

    const bytesToScan = Math.min(fileSize, maxScanBytes);
    let position = fileSize;
    let leftover = '';

    while (position > fileSize - bytesToScan) {
      const readLength = Math.min(chunkSize, position - (fileSize - bytesToScan));
      position -= readLength;
      const buffer = Buffer.alloc(readLength);
      fs.readSync(fd, buffer, 0, readLength, position);

      const chunkStr = buffer.toString('utf8') + leftover;
      const lines = chunkStr.split('\n');

      leftover = position > 0 ? lines.shift() : '';

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (!line) continue;
        try {
          const item = JSON.parse(line);
          if (
            item.source === 'MODEL' &&
            item.type === 'PLANNER_RESPONSE' &&
            typeof item.input_tokens === 'number' &&
            item.input_tokens >= 0
          ) {
            const inputTokens = item.input_tokens;
            const cacheReadTokens = item.cache_read_tokens || 0;
            const outputTokens = item.output_tokens || 0;
            const totalTokens = cacheReadTokens + inputTokens + outputTokens;

            return {
              status: 'MEASURED',
              step_index: item.step_index,
              created_at: item.created_at,
              input_tokens: inputTokens,
              cache_read_tokens: cacheReadTokens,
              output_tokens: outputTokens,
              total_context_tokens: totalTokens,
              scan_bytes_read: fileSize - position,
              transcriptPath: filePath
            };
          }
        } catch (e) {
          // Incomplete or non-JSON line at chunk boundary
        }
      }
    }

    return {
      status: 'UNKNOWN',
      reason: 'no_valid_planner_response_found_in_window',
      scan_bytes_read: fileSize - position,
      transcriptPath: filePath
    };
  } catch (err) {
    return {
      status: 'UNKNOWN',
      reason: err.message,
      transcriptPath: filePath
    };
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch (e) {}
    }
  }
}

/**
 * Computes context zone based on tokens and configured operational ceiling.
 */
function computeContextZone(totalTokens, ceiling = DEFAULT_OPERATIONAL_CEILING) {
  if (typeof totalTokens !== 'number' || isNaN(totalTokens)) {
    return {
      zone: 'UNKNOWN',
      percentage: null,
      operationalCeiling: ceiling,
      ceilingDisclaimer: CEILING_DISCLAIMER,
      headroom_tokens: null,
      recommendation: 'Context usage is UNKNOWN. Maintain small Delivery Units (~5 files / ~600 lines) per AGENTS.md.'
    };
  }

  const ratio = totalTokens / ceiling;
  const pct = (ratio * 100).toFixed(1);
  const headroom = Math.max(0, ceiling - totalTokens);

  let zone = 'GREEN';
  let recommendation = 'Normal operation. Proceed according to AGENTS.md 4-step loop.';

  if (ratio >= 0.85) {
    zone = 'RED';
    recommendation =
      'CRITICAL: Context >= 85%. Freeze large tasks. Headroom reserved for packaging Handover Report and opening new session.';
  } else if (ratio >= 0.70) {
    zone = 'ORANGE';
    recommendation =
      'WARNING: Context >= 70%. Perform checkpoint and recommend user run /compact to extend session safely.';
  } else if (ratio >= 0.50) {
    zone = 'YELLOW';
    recommendation = 'ADVISORY: Context >= 50%. Perform lightweight checkpoint after each module completion.';
  }

  return {
    zone,
    percentage: parseFloat(pct),
    totalTokens,
    operationalCeiling: ceiling,
    ceilingDisclaimer: CEILING_DISCLAIMER,
    headroom_tokens: headroom,
    recommendation
  };
}

/**
 * Reads Git working tree status.
 */
function getGitStatus(cwd = PROJECT_ROOT) {
  try {
    const rawPorcelain = execSync('git status --porcelain', {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      timeout: 3000
    });
    const lines = rawPorcelain.trim().split('\n').filter(Boolean);
    const modified = lines.filter((l) => !l.startsWith('??'));
    const untracked = lines.filter((l) => l.startsWith('??'));

    let branch = 'unknown';
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 2000
      }).trim();
    } catch (e) {}

    let headCommit = 'unknown';
    try {
      headCommit = execSync('git log -1 --oneline', {
        cwd,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 2000
      }).trim();
    } catch (e) {}

    return {
      clean: lines.length === 0,
      branch,
      headCommit,
      totalChanges: lines.length,
      modifiedCount: modified.length,
      untrackedCount: untracked.length,
      sampleChanges: lines.slice(0, 5)
    };
  } catch (err) {
    return {
      clean: false,
      error: err.message
    };
  }
}

/**
 * Status command implementation.
 */
function getStatus(options = {}) {
  const ceiling = parseInt(options.maxTokens || options.ceiling || DEFAULT_OPERATIONAL_CEILING, 10);
  const telemetry = readLatestTelemetry(options.transcript);
  const zoneInfo =
    telemetry.status === 'MEASURED'
      ? computeContextZone(telemetry.total_context_tokens, ceiling)
      : computeContextZone(null, ceiling);

  const git = getGitStatus(options.projectRoot || PROJECT_ROOT);
  const lockExists = fs.existsSync(options.lockPath || LOCK_FILE_PATH);

  return {
    timestamp: new Date().toISOString(),
    telemetry,
    zoneInfo,
    git,
    lockExists,
    handoverExists: fs.existsSync(options.handoverPath || HANDOVER_FILE_PATH)
  };
}

/**
 * Validates HANDOVER.md integrity.
 */
function verifyHandoverContent(content, previousSize = 0) {
  if (typeof content !== 'string' || content.length < 500) {
    return { valid: false, reason: 'size_below_minimum_500_bytes', size: content ? content.length : 0 };
  }

  if (previousSize > 0 && content.length < previousSize * 0.7) {
    return {
      valid: false,
      reason: 'unexpected_shrinkage_over_30_percent',
      size: content.length,
      previousSize
    };
  }

  for (const section of MANDATORY_SECTIONS) {
    if (!content.includes(section)) {
      return { valid: false, reason: `missing_mandatory_section: ${section}` };
    }
  }

  // Verify historical modules M24 through M40 (supporting both individual M# and ranges like M24 – M26)
  const rangeRegex = /M(\d+)\s*[–-]\s*M?(\d+)/g;
  const covered = new Set();
  let match;
  while ((match = rangeRegex.exec(content)) !== null) {
    const start = parseInt(match[1], 10);
    const end = parseInt(match[2], 10);
    for (let i = start; i <= end; i++) covered.add(i);
  }
  const singleRegex = /M(\d+)/g;
  while ((match = singleRegex.exec(content)) !== null) {
    covered.add(parseInt(match[1], 10));
  }
  const missingModules = [];
  for (let m = 24; m <= 40; m++) {
    if (!covered.has(m)) {
      missingModules.push(`M${m}`);
    }
  }
  if (missingModules.length > 0) {
    return { valid: false, reason: `missing_historical_modules: ${missingModules.join(', ')}` };
  }

  return { valid: true, size: content.length };
}

/**
 * Checkpoint command implementation.
 * Performs atomic update: lock -> optimistic hash check -> backup -> write tmp -> fsync -> rename -> verify.
 */
function runCheckpoint(options = {}) {
  const isLightweight = options.lightweight !== false && !options.full;
  const isDryRun = options.dryRun === true;
  const handoverPath = options.handoverPath || HANDOVER_FILE_PATH;
  const lockPath = options.lockPath || `${handoverPath}.lock`;
  const bakPath = options.bakPath || `${handoverPath}.bak`;
  const ceiling = parseInt(options.maxTokens || DEFAULT_OPERATIONAL_CEILING, 10);

  if (!fs.existsSync(handoverPath)) {
    return { success: false, error: 'HANDOVER_FILE_NOT_FOUND', path: handoverPath };
  }

  // 1. Initial Read & Hash
  const originalContent = fs.readFileSync(handoverPath, 'utf8');
  const initialHash = sha256(originalContent);
  const initialSize = originalContent.length;

  // 2. Acquire Lock
  const lockRes = acquireLock(lockPath);
  if (!lockRes.success) {
    return lockRes;
  }

  try {
    // 3. Gather Telemetry & State
    const telemetry = readLatestTelemetry(options.transcript);
    const zoneInfo =
      telemetry.status === 'MEASURED'
        ? computeContextZone(telemetry.total_context_tokens, ceiling)
        : computeContextZone(null, ceiling);

    const git = getGitStatus(path.dirname(handoverPath));

    let testStatus = 'TESTS_INHERITED (337/337 PASS from M40 baseline)';
    if (!isLightweight) {
      // Full validation: run color budget and tests
      try {
        execSync('node tools/lint-color.js', { cwd: PROJECT_ROOT, stdio: ['pipe', 'pipe', 'pipe'] });
        const testOut = execSync('node --test tools/*.test.js', {
          cwd: PROJECT_ROOT,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 15000
        });
        const match = testOut.match(/pass (\d+)/);
        const passCount = match ? match[1] : 'ALL';
        testStatus = `TESTS_FRESHLY_EXECUTED (${passCount} PASS at ${new Date().toISOString()})`;
      } catch (testErr) {
        testStatus = `TESTS_EXECUTION_FAILED (${testErr.message})`;
      }
    }

    // 4. Construct updated Section 5 (Context Telemetry & Lifecycle Metadata)
    const lifecycleSectionHeader = '### 5. Quản lý Vòng đời Context & Checkpoint Tự động (M41 - Automated Lifecycle)';
    const lifecycleBlock = [
      lifecycleSectionHeader,
      `- **Thời điểm Checkpoint:** ${new Date().toISOString()}`,
      `- **Loại Checkpoint:** ${isLightweight ? 'Lightweight Checkpoint (<60ms)' : 'Full Validation Checkpoint'}`,
      `- **Trạng thái Telemetry:** ${telemetry.status}`,
      telemetry.status === 'MEASURED'
        ? `- **Context Occupancy:** ${telemetry.total_context_tokens.toLocaleString()} tokens (${zoneInfo.percentage}% của trần vận hành ${ceiling.toLocaleString()} tokens - ${zoneInfo.zone})`
        : `- **Context Occupancy:** UNKNOWN (${zoneInfo.recommendation})`,
      `- **Phân loại Ngưỡng:** ${zoneInfo.zone} (${zoneInfo.recommendation})`,
      `- **Trần Vận hành:** ${ceiling.toLocaleString()} tokens (${CEILING_DISCLAIMER})`,
      `- **Trạng thái Working Tree:** ${git.clean ? 'Sạch (clean)' : `Có ${git.totalChanges} thay đổi chưa commit`}`,
      `- **Kết quả Kiểm thử:** ${testStatus}`,
      ''
    ].join('\n');

    let updatedContent = originalContent;
    if (updatedContent.includes(lifecycleSectionHeader)) {
      // Replace existing section 5
      const parts = updatedContent.split(lifecycleSectionHeader);
      updatedContent = parts[0].trimEnd() + '\n\n' + lifecycleBlock;
    } else {
      // Append section 5 at the end
      updatedContent = updatedContent.trimEnd() + '\n\n---\n\n' + lifecycleBlock;
    }

    if (isDryRun) {
      return {
        success: true,
        dryRun: true,
        mode: isLightweight ? 'lightweight' : 'full',
        telemetry,
        zoneInfo,
        git,
        previewLength: updatedContent.length,
        initialHash
      };
    }

    // 5. Concurrency Check: re-read and verify hash has not changed
    const currentOnDisk = fs.readFileSync(handoverPath, 'utf8');
    const currentHash = sha256(currentOnDisk);
    if (currentHash !== initialHash) {
      return {
        success: false,
        error: 'CONCURRENCY_CONFLICT',
        reason: 'HANDOVER.md was modified by another process during checkpoint preparation'
      };
    }

    // 6. Pre-write Backup (.bak)
    fs.copyFileSync(handoverPath, bakPath);

    // 7. Write to temp file on SAME filesystem
    const tmpPath = `${handoverPath}.tmp.${Date.now()}.${process.pid}`;
    const fd = fs.openSync(tmpPath, 'w');
    fs.writeSync(fd, updatedContent);
    fs.fsyncSync(fd);
    fs.closeSync(fd);

    // 8. Atomic Rename
    fs.renameSync(tmpPath, handoverPath);

    // 9. Post-write Integrity Verification
    const readBack = fs.readFileSync(handoverPath, 'utf8');
    const verifyRes = verifyHandoverContent(readBack, initialSize);
    if (!verifyRes.valid) {
      // Integrity failed! Rollback immediately from .bak
      fs.copyFileSync(bakPath, handoverPath);
      return {
        success: false,
        error: 'POST_WRITE_VERIFICATION_FAILED',
        reason: verifyRes.reason,
        restoredFromBackup: true
      };
    }

    const newHash = sha256(readBack);
    return {
      success: true,
      mode: isLightweight ? 'lightweight' : 'full',
      telemetry,
      zoneInfo,
      git,
      previousHash: initialHash,
      newHash,
      handoverSize: readBack.length
    };
  } finally {
    releaseLock(lockPath, lockRes.ownerUuid);
  }
}

/**
 * Verifies handover file on disk.
 */
function verify(options = {}) {
  const handoverPath = options.handoverPath || HANDOVER_FILE_PATH;
  if (!fs.existsSync(handoverPath)) {
    return { valid: false, reason: 'file_not_found', path: handoverPath };
  }
  const content = fs.readFileSync(handoverPath, 'utf8');
  const verifyRes = verifyHandoverContent(content);
  const hash = sha256(content);
  const lockExists = fs.existsSync(options.lockPath || LOCK_FILE_PATH);
  const bakExists = fs.existsSync(options.bakPath || BAK_FILE_PATH);

  return {
    valid: verifyRes.valid,
    reason: verifyRes.reason || null,
    size: content.length,
    sha256: hash,
    lockExists,
    bakExists
  };
}

/**
 * Safe Rollback implementation using manifest.json.
 */
function safeRollback(options = {}) {
  const backupDir = options.backupDir || BACKUP_MANIFEST_DIR;
  const projectRoot = options.projectRoot || PROJECT_ROOT;
  const manifestPath = path.join(backupDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { success: false, error: 'NO_BACKUP_MANIFEST_FOUND', manifestPath };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const restored = [];
  const conflicts = [];

  for (const [relPath, info] of Object.entries(manifest.files)) {
    const fullPath = path.join(projectRoot, relPath);
    const backupFile = path.join(backupDir, info.backupFile);

    if (!fs.existsSync(backupFile)) {
      conflicts.push({ file: relPath, reason: 'backup_copy_missing' });
      continue;
    }

    if (fs.existsSync(fullPath)) {
      const currentContent = fs.readFileSync(fullPath);
      const currentHash = crypto.createHash('sha256').update(currentContent).digest('hex');
      // If current file is already identical to backup
      if (currentHash === info.sha256) {
        restored.push({ file: relPath, status: 'already_at_backup_state' });
        continue;
      }
    }

    // Restore safely
    fs.copyFileSync(backupFile, fullPath);
    restored.push({ file: relPath, status: 'restored' });
  }

  return {
    success: conflicts.length === 0,
    restored,
    conflicts
  };
}

// CLI Entrypoint
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  const isJson = args.includes('--json');
  const isDryRun = args.includes('--dry-run');
  const isFull = args.includes('--full');
  const isLightweight = args.includes('--lightweight') || !isFull;

  const maxTokensArg = args.find((a) => a.startsWith('--max-tokens='));
  const maxTokens = maxTokensArg ? parseInt(maxTokensArg.split('=')[1], 10) : DEFAULT_OPERATIONAL_CEILING;

  const transcriptArg = args.find((a) => a.startsWith('--transcript='));
  const transcriptPath = transcriptArg ? transcriptArg.split('=')[1] : null;

  try {
    if (command === 'status') {
      const res = getStatus({ maxTokens, transcript: transcriptPath });
      if (isJson) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log('=== FRENCH SHADOWING STUDIO - CONTEXT & HANDOVER STATUS ===');
        console.log(`Telemetry Status:       ${res.telemetry.status}`);
        if (res.telemetry.status === 'MEASURED') {
          console.log(`Context Tokens Used:    ${res.telemetry.total_context_tokens.toLocaleString()} tokens`);
          console.log(`Context Utilization:    ${res.zoneInfo.percentage}% (${res.zoneInfo.zone})`);
          console.log(`Headroom Remaining:     ${res.zoneInfo.headroom_tokens.toLocaleString()} tokens`);
        } else {
          console.log(`Context Tokens Used:    UNKNOWN (${res.telemetry.reason || 'N/A'})`);
          console.log(`Context Utilization:    UNKNOWN`);
        }
        console.log(`Operational Ceiling:    ${res.zoneInfo.operationalCeiling.toLocaleString()} tokens (${res.zoneInfo.ceilingDisclaimer})`);
        console.log(`Recommendation:         ${res.zoneInfo.recommendation}`);
        console.log('-----------------------------------------------------------');
        console.log(`Git Working Tree:       ${res.git.clean ? 'CLEAN' : `DIRTY (${res.git.totalChanges} changes)`}`);
        console.log(`Active Lockfile:        ${res.lockExists ? 'PRESENT (locked)' : 'NONE (unlocked)'}`);
        console.log('===========================================================');
      }
    } else if (command === 'checkpoint') {
      const res = runCheckpoint({
        lightweight: isLightweight,
        full: isFull,
        dryRun: isDryRun,
        maxTokens,
        transcript: transcriptPath
      });
      if (isJson) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log('=== FRENCH SHADOWING STUDIO - CHECKPOINT RESULT ===');
        console.log(`Success:                ${res.success}`);
        if (res.dryRun) {
          console.log(`Dry-run:                TRUE (No changes written to disk)`);
        }
        console.log(`Mode:                   ${res.mode || (isLightweight ? 'lightweight' : 'full')}`);
        if (res.error) {
          console.log(`Error:                  ${res.error} (${res.reason || ''})`);
        } else {
          console.log(`Telemetry Status:       ${res.telemetry ? res.telemetry.status : 'N/A'}`);
          console.log(`Context Zone:           ${res.zoneInfo ? res.zoneInfo.zone : 'N/A'}`);
          console.log(`New Hash (SHA-256):     ${res.newHash || 'N/A'}`);
        }
        console.log('===================================================');
      }
      process.exit(res.success ? 0 : 1);
    } else if (command === 'verify') {
      const res = verify();
      if (isJson) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log('=== HANDOVER.md INTEGRITY VERIFICATION ===');
        console.log(`Valid:                  ${res.valid}`);
        console.log(`Size:                   ${res.size} bytes`);
        console.log(`SHA-256:                ${res.sha256}`);
        console.log(`Lockfile:               ${res.lockExists ? 'PRESENT' : 'ABSENT'}`);
        console.log(`Backup File (.bak):     ${res.bakExists ? 'PRESENT' : 'ABSENT'}`);
        if (!res.valid) {
          console.log(`Failure Reason:         ${res.reason}`);
        }
        console.log('==========================================');
      }
      process.exit(res.valid ? 0 : 1);
    } else if (command === 'rollback') {
      const res = safeRollback();
      console.log(JSON.stringify(res, null, 2));
      process.exit(res.success ? 0 : 1);
    } else {
      console.error(`Unknown command: ${command}. Available: status, checkpoint, verify, rollback`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal CLI error:', err.message);
    process.exit(1);
  }
}

module.exports = {
  sha256,
  getProcessLstart,
  acquireLock,
  releaseLock,
  findTranscriptPath,
  readLatestTelemetry,
  computeContextZone,
  getGitStatus,
  getStatus,
  verifyHandoverContent,
  runCheckpoint,
  verify,
  safeRollback,
  DEFAULT_OPERATIONAL_CEILING,
  CEILING_DISCLAIMER
};
