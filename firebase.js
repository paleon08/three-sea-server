// firebase.js
const admin = require('firebase-admin');

// Render에서는 환경변수에 서비스 계정 JSON 전체를 문자열로 저장하고 사용
const raw = process.env.FIREBASE_CONFIG;

console.log("✅ DEBUG: typeof FIREBASE_CONFIG =", typeof raw);
console.log("✅ DEBUG: FIREBASE_CONFIG begins with =", raw?.slice(0, 80));

if (!raw) {
  throw new Error("❌ FIREBASE_CONFIG 환경변수가 설정되지 않았습니다.");
}

const serviceAccount = JSON.parse(raw);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://threeseasproject-d3721.firebaseio.com'  // 실제 Firebase 프로젝트 ID에 맞춰 설정
});

const db = admin.firestore();

module.exports = db;
