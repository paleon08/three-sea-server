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

// ✅ 주요 라우트
app.get('/api/sea-temp', async (req, res) => {
  const { obsCode, date } = req.query;

  // ✅ 입력 유효성 검증
  if (!obsCode || !date || !isValidDate(date)) {
    return res.status(400).json({ error: '필수 쿼리(obsCode, date)가 잘못됨' });
  }

  const apiUrl = `http://www.khoa.go.kr/api/oceangrid/tidalBuTemp/search.do?ServiceKey=${API_KEY}&ObsCode=${obsCode}&Date=${date}&ResultType=json`;

  try {
    const response = await axios.get(apiUrl);
    const result = response.data;

    // ✅ 데이터가 있으면 Firebase 저장
    if (result.result?.data?.length) {
      console.log("🔥 Firebase 저장 시도 중...");
      const docRef = db.collection('sea_temperature').doc(`${obsCode}_${date}`);
      await docRef.set({
        obsCode,
        date,
        fetchedAt: new Date().toISOString(),
        data: result.result.data
      });
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

// ✅ 기본 루트 확인용
app.get('/', (req, res) => {
  res.send('🌊 Three-Seas 서버 작동 중입니다.');
});

// ✅ 서버 시작
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 서버 실행 중 on port ${port}`);
});
