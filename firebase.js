// firebase.js
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(), // Render에서는 이거!
  databaseURL: 'https://threeseasproject-d3721.firebaseio.com' // 정확히 프로젝트 ID 반영
});

const db = admin.firestore();
module.exports = db;
