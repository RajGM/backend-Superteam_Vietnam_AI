// firebaseConfig.js
const { initializeApp, cert } = require ("firebase-admin/app");
const { getFirestore, doc, getDoc } = require('firebase-admin/firestore');

// Your Firebase configuration
const firebaseConfig = {
    //type: process.env.type,
    project_id: process.env.project_id,
    //private_key_id: process.env.private_key_id,
    private_key: process.env.private_key.replace(/\\n/g, '\n'),
    clientEmail: process.env.client_email,
    // client_id: process.env.client_id,
    // auth_uri: process.env.auth_uri,
    // token_uri: process.env.token_uri,
    // auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    // client_x509_cert_url: process.env.client_x509_cert_url,
    // universe_domain: process.env.universe_domain,
}

initializeApp({credential:cert (firebaseConfig)});
const admin = require('firebase-admin');
const db = getFirestore();

// // Initialize Firebase app only once
// let app;
// if (!getApps().length) {
//     app = initializeApp(firebaseConfig);
// } else {
//     app = getApp();
// }

module.exports = { db, admin, doc, getDoc }; 
