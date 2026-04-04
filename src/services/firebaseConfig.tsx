import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { initializeFirestore, memoryLocalCache } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
};

const app = initializeApp(firebaseConfig);
const Auth = getAuth(app);

export let messaging: any = null;

if (typeof window !== 'undefined') {
  import('firebase/messaging').then(({ getMessaging }) => {
    messaging = getMessaging(app);
  });

  navigator.serviceWorker.register(
    window.location.origin + '/firebase-messaging-sw.js'
  );

  setPersistence(Auth, browserSessionPersistence)
    .then(() => console.log("Auth session is now in-memory (resets every session)."))
    .catch((error) => console.error("Error setting persistence:", error));

  initializeFirestore(Auth.app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: false,
    experimentalAutoDetectLongPolling: true,
  });
}

export default Auth;
