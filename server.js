const express = require('express');
const axios = require('axios');
const cors = require('cors');
const db = require('./firebase'); // 🔥 Firebase 연동

const app = express();
app.use(cors());
app.use(express.json()); // ⚠️ POST 요청 대비 JSON 파싱

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("❌ API_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1); // 실행 중단
}

// ✅ 유틸 함수: 날짜 형식 검사
function isValidDate(str) {
  return /^\d{8}$/.test(str);
}

// ✅ 주요 라우트: 실시간 수온 조회 및 저장
app.get('/api/sea-temp', async (req, res) => {
  const { obsCode, date } = req.query;

  if (!obsCode || !date || !isValidDate(date)) {
    return res.status(400).json({ error: '필수 쿼리(obsCode, date)가 잘못됨' });
  }

  const apiUrl = `http://www.khoa.go.kr/api/oceangrid/tidalBuTemp/search.do?ServiceKey=${API_KEY}&ObsCode=${obsCode}&Date=${date}&ResultType=json`;

  try {
    const response = await axios.get(apiUrl);
    const result = response.data;

    if (result.result?.data?.length) {
      console.log("🔥 Firebase 저장 시도 중...");
      try {
        const docRef = db.collection('sea_temperature').doc(`${obsCode}_${date}`);
        await docRef.set({
          obsCode,
          date,
          fetchedAt: new Date().toISOString(),
          data: result.result.data
        });
        console.log("✅ Firebase 저장 완료");
      } catch (e) {
        console.error("❌ Firebase 저장 실패:", e.message);
      }
    }

    res.json(result);
  } catch (error) {
    console.error("🔥 KHOA API 오류:", error.message);
    res.status(500).json({
      error: 'KHOA API 요청 실패',
      detail: error.message,
    });
  }
});

// ✅ 동해/서해/남해 카테고리별 데이터 일괄 저장
app.post('/api/sea-data/bulk-insert', async (req, res) => {
  const seaData = req.body; // JSON 객체 { eastSea: {...}, westSea: {...}, southSea: {...} }
  if (!seaData || typeof seaData !== 'object') {
    return res.status(400).json({ error: '올바른 seaData JSON이 필요함' });
  }

  try {
    for (const sea of Object.keys(seaData)) {
      const seaRef = db.collection('seas').doc(sea); // ex) 'eastSea'

      for (const category of Object.keys(seaData[sea])) {
        const dataList = seaData[sea][category];
        const categoryRef = seaRef.collection(category);

        for (const dataPoint of dataList) {
          await categoryRef.doc(dataPoint.date).set({
            value: dataPoint.value,
          });
        }
      }
    }
    res.json({ success: true, message: '카테고리별 데이터 저장 완료' });
  } catch (error) {
    console.error('🔥 Firebase bulk 저장 오류:', error.message);
    res.status(500).json({ error: 'Firebase 저장 중 오류 발생', detail: error.message });
  }
});

// ✅ 기본 루트 확인용
app.get('/', (req, res) => {
  res.send('🌊 Three-Seas 서버 작동 중입니다.');
});

// ✅ 서버 시작
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 서버 실행 중 on port ${port}`);
});
