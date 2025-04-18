import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Validate Firebase configuration
/*const validateConfig = (config) => {
    const requiredFields = [
        'apiKey',
        'authDomain',
        'projectId',
        'storageBucket',
        'messagingSenderId',
        'appId'
    ];

    const missingFields = requiredFields.filter(field => !config[field]);
    if (missingFields.length > 0) {
        throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
    }
    
    return true;
};*/

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBt9tzisH1lRcivPB4wh7D2WzHxgkp9v4Y",
    authDomain: "onlyfries-app.firebaseapp.com",
    projectId: "onlyfries-app",
    storageBucket: "onlyfries-app.firebasestorage.app",
    messagingSenderId: "933935883918",
    appId: "1:933935883918:web:66bb3a09f5981791918bdf",
    measurementId: "G-RWD456SCHN"
};

// Initialize Firebase
//let app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize services
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, 'onlyfries-app'); //Need to specify the database name!!!!
const auth = getAuth(app);
const storage = getStorage(app);

// Initialize Analytics in browser environment
if (typeof window !== 'undefined') {
    isSupported().then(yes => yes && getAnalytics(app));
}

// Log initialization
console.log('Firebase initialized with config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
});

export { auth, db, storage };
