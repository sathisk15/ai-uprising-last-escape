import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || 'ai-uprising-last-escape.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || 'ai-uprising-last-escape',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || 'ai-uprising-last-escape.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '',
}

const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.appId)

// Guard against duplicate-app error on Vite HMR re-execution
let db = null
if (configured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    db = getFirestore(app)
  } catch (e) {
    console.warn('[Firebase] init failed:', e.message)
  }
}

export { db }
