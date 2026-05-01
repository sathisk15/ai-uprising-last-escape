import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || 'AIzaSyAnhSUTs4FtfloE1PfG0cTcNrE9yqUcf4c',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || 'ai-uprising-last-escape.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || 'ai-uprising-last-escape',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || 'ai-uprising-last-escape.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '11620552966',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '1:11620552966:web:417046158016deda268e87',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID      || 'G-8RMMF62KKN',
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
