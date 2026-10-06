// Firebase Authentication — SMS OTP (phone) support for the frontend.
// Configure your Firebase Web app keys in frontend/.env (see the template at
// the bottom of that file). When enabled, the "mobile number" login step and
// the onboarding recovery-phone step deliver the code as a REAL SMS through
// Firebase — supported in every country Firebase covers. When not configured,
// both flows automatically fall back to the existing WhatsApp OTP endpoints.
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut } from 'firebase/auth';

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
);

const RECAPTCHA_ID = 'nx-firebase-recaptcha';
let app = null;
let auth = null;
let verifier = null;

const ensureAuth = () => {
  if (!firebaseEnabled) throw new Error('Firebase is not configured. Set the VITE_FIREBASE_* values in frontend/.env');
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return auth;
};

const ensureVerifier = () => {
  const a = ensureAuth();
  if (verifier) return verifier;
  if (!document.getElementById(RECAPTCHA_ID)) {
    throw new Error('reCAPTCHA container is missing on this page.');
  }
  verifier = new RecaptchaVerifier(a, RECAPTCHA_ID, { size: 'invisible' });
  return verifier;
};

export const clearFirebaseRecaptcha = () => {
  if (verifier) {
    try { verifier.clear(); } catch { /* widget already gone */ }
    verifier = null;
  }
};

// Send the SMS code via Firebase (all countries). Returns the ConfirmationResult
export const sendFirebaseSms = async (phoneE164) => {
  const a = ensureAuth();
  clearFirebaseRecaptcha();
  const appVerifier = ensureVerifier();
  return signInWithPhoneNumber(a, phoneE164, appVerifier);
};

// Confirm the 6-digit code and return a backend-verifiable ID token
export const confirmFirebaseSmsCode = async (confirmationResult, code) => {
  if (!confirmationResult) throw new Error('No SMS session. Please request a new code.');
  const credential = await confirmationResult.confirm(code);
  const user = credential?.user || credential;
  if (!user) throw new Error('invalid-verification-code');
  const idToken = await user.getIdToken(true);
  try { await signOut(ensureAuth()); } catch { /* best-effort session cleanup */ }
  clearFirebaseRecaptcha();
  return idToken;
};

// Firebase error codes → user-readable messages
export const firebaseSmsMessage = (err) => {
  const code = String(err?.code || err?.message || '');
  if (code.includes('invalid-api-key') || code.includes('api-key-not-valid')) return 'Firebase Web API key is invalid. Copy the Web API key from Firebase Project settings and update frontend/.env.';
  if (code.includes('configuration-not-found') || code.includes('project-not-found')) return 'Firebase project configuration was not found. Check the project ID and Web App settings in frontend/.env.';
  if (code.includes('invalid-phone-number')) return 'That mobile number is not valid for the selected country.';
  if (code.includes('missing-verification-code')) return 'Enter the 6-digit code from the SMS.';
  if (code.includes('invalid-verification-code')) return 'That code is not correct. Check the SMS and try again.';
  if (code.includes('code-expired') || code.includes('missing-verification-info')) return 'That code has expired. Resend to get a new one.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a moment and try again.';
  if (code.includes('captcha')) return 'reCAPTCHA could not verify this browser. Refresh the page and try again.';
  if (code.includes('quota-exceeded')) return 'SMS quota has been reached for now. Please try again later.';
  if (code.includes('operation-not-allowed')) return 'Phone sign-in is not enabled in the Firebase console yet (Authentication → Sign-in method → Phone).';
  if (code.includes('app-not-authorized') || code.includes('unauthorized-domain')) return 'This domain is not authorised in the Firebase console (Authentication → Settings → Authorized domains).';
  if (code.includes('admin-restricted-operation')) return 'Phone SMS is restricted for this project. Check the Firebase console settings.';
  return import.meta.env.DEV && code
    ? `Firebase SMS error (${code}). Check the Firebase Phone provider, Authorized domains, billing/SMS limits, and restart Vite after changing .env.`
    : 'Could not send or verify the SMS code. Please try again.';
};
