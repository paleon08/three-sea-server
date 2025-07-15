const express = require('express');
const axios = require('axios');
const cors = require('cors');
const db = require('./firebase'); // 🔥 Firebase 연동

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  console.error("❌ API_KEY 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

// ✅ 유틸 함수
function isValidDate(str) {
  return /^\d{8}$/.test(str);
}

// ✅ 실시간 수온 조회 및 저장
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
  const seaData = req.body;
  if (!seaData || typeof seaData !== 'object') {
    return res.status(400).json({ error: '올바른 seaData JSON이 필요함' });
  }

  try {
    for (const sea of Object.keys(seaData)) {
      const seaRef = db.collection('seas').doc(sea);

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

// ✅ 월별 평균 수온 계산 API
app.get('/api/monthly-average', async (req, res) => {
  const region = req.query.region; // ex) eastSea, westSea, southSea
  if (!region) {
    return res.status(400).json({ error: 'region 쿼리 파라미터가 필요합니다.' });
  }

  try {
    const snapshot = await db.collection('seas').doc(region).collection('temperature').get();
    const monthlyData = {};

    snapshot.forEach(doc => {
      const { value } = doc.data();
      const month = doc.id.slice(4, 6); // '20250715' => '07'
      if (!monthlyData[month]) monthlyData[month] = [];
      monthlyData[month].push(value);
    });

    const averages = Object.entries(monthlyData).map(([month, values]) => {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = +(sum / values.length).toFixed(2);
      return { month: parseInt(month), avgTemp: avg };
    }).sort((a, b) => a.month - b.month);

    res.json({ region, averages });
  } catch (error) {
    console.error('🔥 월별 평균 수온 계산 실패:', error.message);
    res.status(500).json({ error: '월별 평균 계산 오류', detail: error.message });
  }
});

// ✅ 루트
app.get('/', (req, res) => {
  res.send('🌊 Three-Seas 서버 작동 중입니다.');
});

// ✅ 서버 실행
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 서버 실행 중 on port ${port}`);
});
