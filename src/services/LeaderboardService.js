import {
  collection, addDoc, getDocs,
  query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION = 'leaderboard'

const LeaderboardService = {
  /**
   * Submit a score entry. Returns true on success, false on failure.
   * Silently swallows errors so a Firebase mis-config never crashes the game.
   */
  async submitScore({ name, score, zone, kills, distance }) {
    if (!db) return false
    try {
      await addDoc(collection(db, COLLECTION), {
        name:      (name || 'UNKNOWN').trim().slice(0, 14).toUpperCase(),
        score:     Math.floor(score),
        zone:      zone ?? 1,
        kills:     kills ?? 0,
        distance:  Math.floor(distance ?? 0),
        timestamp: serverTimestamp(),
      })
      return true
    } catch (e) {
      console.warn('[Leaderboard] submit failed:', e.message)
      return false
    }
  },

  /**
   * Fetch top N scores ordered by score descending.
   * Returns an array of { id, name, score, zone, kills, distance } objects.
   * Returns [] on any error.
   */
  async getTopScores(n = 10) {
    if (!db) return []
    try {
      const q    = query(collection(db, COLLECTION), orderBy('score', 'desc'), limit(n))
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    } catch (e) {
      console.warn('[Leaderboard] fetch failed:', e.message)
      return []
    }
  },
}

export default LeaderboardService
