// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore , enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";


// Your Firebase configuration object
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Its a PUBLIC API! SO CHECK IT IN
const firebaseConfig = {
    apiKey: "AIzaSyD7H6TcSXz2hdOIcFNLqVMA-_d3T4d9q3w",
    authDomain: "som-rit-ourvoice.firebaseapp.com",
    databaseURL: "https://som-rit-ourvoice.firebaseio.com",
    projectId: "som-rit-ourvoice",
    storageBucket: "ov_walk_files",
    messagingSenderId:"696489330177",
    appId: "1:696489330177:web:268b76243b9281a0a3e200",
    measurementId: "G-5MTXG6HGDL",
    // persistence: true,
    // forceOwnership: true,
    // experimentalTabSynchronization: true
};

// Initialize Firebase
const firebase              = initializeApp(firebaseConfig);
export const auth           = getAuth(firebase);
export const storage        = getStorage(firebase)
export const storage_2      = getStorage(firebase, "transform_ov_walk_files");

export const firestore      = getFirestore(firebase);

enableIndexedDbPersistence(firestore, { experimentalForceOwningTab: true })
    .catch((error) => {
        if (error.code === 'failed-precondition') {
            // Possibly multiple tabs open at once.
            console.error('Persistence can only be enabled in one tab at a time.');
            // Inform the user that offline mode is only available in one tab.
        } else if (error.code === 'unimplemented') {
            // The current browser does not support all the features required to enable persistence
            console.error('This browser does not support offline data persistence.');
            // Inform the user that offline capabilities are not supported in this browser.
        } else {
            // Handle other errors that could occur
            console.error('An unexpected error occurred enabling offline persistence', error);
            // Inform the user there was an error setting up offline capabilities.
        }
    });

export const analytics      = getAnalytics(firebase);
