// firebase.js
const admin = require('firebase-admin');

// Render에서는 환경변수에 서비스 계정 JSON 전체를 문자열로 저장하고 사용
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY_JSON);  // 환경변수에서 파싱

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://threeseasproject-d3721.firebaseio.com'  // 실제 Firebase 프로젝트 ID에 맞춰 설정
});

const db = admin.firestore();

module.exports = db;
