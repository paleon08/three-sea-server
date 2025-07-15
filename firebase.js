const raw = process.env.FIREBASE_CONFIG;

if (!raw) {
  throw new Error("❌ FIREBASE_CONFIG 환경변수가 설정되지 않았습니다.");
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(raw);

  // 줄바꿈 복원
  if (serviceAccount.private_key.includes('\\n')) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

} catch (e) {
  throw new Error("❌ FIREBASE_CONFIG JSON 파싱 실패: " + e.message);
}

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://threeseasproject-d3721.firebaseio.com',
});

const db = admin.firestore();
module.exports = db;
