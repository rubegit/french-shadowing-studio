# Plan: Implement Tombstone-based Distributed Sync

## Context
The current synchronization logic in `js/supabase-sync.js` uses a simple `Union` merge strategy. This causes "resurrection" of deleted items because the absence of a record is interpreted as a new addition.

## Goal
Implement a "Tombstone" mechanism to allow deletions to propagate across devices.

## Decisions & Design

### 1. Data Structure Changes
- Add a `deleted: boolean` property to items in `vocab`, `history`, and `progress` objects.
- Ensure the `keyOf` function and merge logic account for the `deleted` flag.

### 2. Summary of logic
- **Local Deletion:** Instead of removing an item from the array, set `item.deleted = true`.
- **Merge Logic:**
    - If an item exists in one list but not the other, and it is marked `deleted: true`, it should be treated as a deletion command.
    - If an item is `deleted: true` in the `cloudList`, it must be removed from the `localList`.
    - If an item is `deleted: true` in the `localList`, it must be pushed to the `cloudList`.
- **Cleanup (Garbage Collection):** 
    - **Trigger:** Runs inside `pullAllDataFromCloud`, after a successful two-way sync.
    - **Condition:** Removes items where `deleted: true` AND `updated_at < (now - 30 days)`.

### 3. Affected Files
- `js/supabase-sync.js`: Core logic for merging, pulling, and pushing.
- User-facing scripts/UI (implied): The code that triggers deletions must be updated to use the "soft delete" (tombstone) approach.

## Implementation Tasks

### Phase 1: Core Sync Logic Refactor
1.  **Update `keyOf` (if necessary):** Ensure the key generation is stable for tombstoned items.
2.  **Update `mergeVocabLists`:**
    - Handle `deleted: true` flags.
    - Ensure `hasLocalNew` and `hasCloudNew` correctly reflect the state of deletions.
3.  **Update `mergeHistoryLists`:**
    - Handle `deleted: true` flags.
4.  **Update `mergeProgressObjs`:**
    - Handle `deleted: true` flags.
5.  **Update `pullAllDataFromCloud`:**
    - Integrate the new merge logic.
    - Implement a cleanup step to remove tombstones from the local state after a successful sync.
6.  **Update `pushAllDataToCloud`:**
    - Ensure tombstones are sent to the cloud.

### Phase 2: User Action Refactor
1.  Identify all locations where `localList.splice(...)` or `filter(...)` is used to delete items.
2.  Replace them with `item.deleted = true` (or adding the item with the flag).

### Phase 3: Validation
1.  Verify that deleting on Device A propagates to Device B.
2.  Verify that "resurrection" no longer occurs.
3.  Verify that the JSON size remains manageable via the cleanup step.

## Risks & Mitigations
- **Risk:** If the cleanup step is too aggressive, we might lose the ability to propagate a deletion.
- **Mitigation:** Only perform cleanup *after* a successful two-way sync where the tombstone has been successfully propagated to the other side.
- **Risk:** Breaking existing data.
- **Mitigation:** The `deleted` flag is additive and shouldn't break existing logic if handled carefully.
