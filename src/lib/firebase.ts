import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyAW8ai-4kHFpW02fLTNYqUgqDjIXV1k1UQ",
    authDomain: "craftchain-auth-77afb.firebaseapp.com",
    projectId: "craftchain-auth-77afb",
    storageBucket: "craftchain-auth-77afb.firebasestorage.app",
    messagingSenderId: "768548552123",
    appId: "1:768548552123:web:032d75dab77192f6d2d89e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
