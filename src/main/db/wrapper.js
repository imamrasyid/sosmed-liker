/**
 * Thin Promise wrapper di atas sqlite3 callback API.
 * Eliminasi boilerplate `new Promise((resolve, reject) => db.run(...))` di seluruh queries.js.
 *
 * Semua fungsi lempar error secara natural — caller cukup pakai try/catch atau .catch().
 */

/**
 * Jalankan query yang tidak mengembalikan baris (INSERT, UPDATE, DELETE, CREATE).
 * Resolve dengan { lastID, changes }.
 * @param {import('sqlite3').Database} db
 * @param {string} sql
 * @param {any[]} [params=[]]
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
export function run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err)
            else resolve({ lastID: this.lastID, changes: this.changes })
        })
    })
}

/**
 * Ambil satu baris hasil query SELECT.
 * Resolve dengan baris atau undefined jika tidak ditemukan.
 * @param {import('sqlite3').Database} db
 * @param {string} sql
 * @param {any[]} [params=[]]
 * @returns {Promise<object|undefined>}
 */
export function get(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err)
            else resolve(row)
        })
    })
}

/**
 * Ambil semua baris hasil query SELECT.
 * Resolve dengan array (kosong jika tidak ada hasil).
 * @param {import('sqlite3').Database} db
 * @param {string} sql
 * @param {any[]} [params=[]]
 * @returns {Promise<object[]>}
 */
export function all(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err)
            else resolve(rows || [])
        })
    })
}

/**
 * Jalankan beberapa operasi dalam satu transaksi.
 * Kalau salah satu gagal, semua di-rollback.
 * @param {import('sqlite3').Database} db
 * @param {() => Promise<any>} fn - async function berisi operasi DB
 * @returns {Promise<any>}
 */
export async function transaction(db, fn) {
    await run(db, 'BEGIN')
    try {
        const result = await fn()
        await run(db, 'COMMIT')
        return result
    } catch (err) {
        await run(db, 'ROLLBACK').catch(() => { }) // best-effort rollback
        throw err
    }
}
