import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Get these values from Firebase Console:
// https://console.firebase.google.com → Project Settings → Your apps → SDK setup → Config
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || 'ai-uprising-last-escape.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || 'ai-uprising-last-escape',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || 'ai-uprising-last-escape.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '',
}

// Only initialize if the required keys are present — prevents network errors and
// console noise during local dev before .env.local is filled in.
const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.appId)

export const db = configured
  ? getFirestore(initializeApp(firebaseConfig))
  : null
