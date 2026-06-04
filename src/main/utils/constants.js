/**
 * Konstanta yang digunakan di main process.
 * Dipusatkan agar tidak ada magic string yang tersebar di multiple files.
 */

// ── Automation IPC event markers ──────────────────────────────────────────
export const AUTOMATION_EVENTS = {
    DONE: '__AUTOMATION_DONE__',
    STOPPED: '__AUTOMATION_STOPPED__',
}
