import {
  collection, doc, getDoc, getDocs, setDoc,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'players'
const normalizeName = (name) => (name || '').trim().slice(0, 14).toUpperCase()
const playerDocRef = (name) => doc(db, COLLECTION, normalizeName(name))

const LeaderboardService = {
  /**
   * Submit a score entry. Returns true on success, false on failure.
   * Silently swallows errors so a Firebase mis-config never crashes the game.
   */
  async ensurePlayer(name) {
    if (!db) return { ok: false, exists: false, player: null, reason: 'not-configured' }
    const normalized = normalizeName(name)
    if (!normalized) return { ok: false, exists: false, player: null, reason: 'invalid-name' }
    try {
      const ref  = playerDocRef(normalized)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        await setDoc(ref, {
          name: normalized,
          bestScore: 0,
          finalScore: 0,
          totalKills: 0,
          bestDistance: 0,
          gamesPlayed: 0,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        })
        return { ok: true, exists: false, player: { name: normalized, bestScore: 0, finalScore: 0 }, reason: null }
      }
      return { ok: true, exists: true, player: snap.data(), reason: null }
    } catch (e) {
      console.warn('[Leaderboard] ensure player failed:', e.message)
      return {
        ok: false,
        exists: false,
        player: null,
        reason: e?.code === 'permission-denied' ? 'permission-denied' : (e?.code === 'unavailable' ? 'unavailable' : 'unknown'),
      }
    }
  },

  async updatePlayerResult({ name, score, kills, distance }) {
    if (!db) return false
    const normalized = normalizeName(name)
    if (!normalized) return false
    try {
      const ref  = playerDocRef(normalized)
      const snap = await getDoc(ref)
      const prev = snap.exists() ? snap.data() : {
        name: normalized, bestScore: 0, finalScore: 0, totalKills: 0, bestDistance: 0, gamesPlayed: 0,
      }
      const finalScore = Math.floor(score ?? 0)
      const finalKills = Math.floor(kills ?? 0)
      const finalDist  = Math.floor(distance ?? 0)
      await setDoc(ref, {
        ...prev,
        name: normalized,
        finalScore,
        bestScore: Math.max(prev.bestScore ?? 0, finalScore),
        totalKills: (prev.totalKills ?? 0) + finalKills,
        bestDistance: Math.max(prev.bestDistance ?? 0, finalDist),
        gamesPlayed: (prev.gamesPlayed ?? 0) + 1,
        updatedAt: serverTimestamp(),
        createdAt: prev.createdAt ?? serverTimestamp(),
      }, { merge: true })
      return true
    } catch (e) {
      console.warn('[Leaderboard] update player failed:', e.message)
      return false
    }
  },

  /**
   * Fetch top N scores ordered by score descending.
   * Returns an array of { id, name, score, zone, kills, distance } objects.
   * Returns [] on any error.
   */
  async getTopScores(n = 3) {
    if (!db) return []
    try {
      const q    = query(collection(db, COLLECTION), orderBy('bestScore', 'desc'), limit(n))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.warn('[Leaderboard] fetch failed:', e.message)
      return []
    }
  },
}

export default LeaderboardService
