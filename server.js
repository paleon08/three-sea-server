const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// 환경 변수에서 API_KEY 읽기 (.env 없이 Render 대시보드에서 직접 설정해야 함)
const API_KEY = process.env.API_KEY;

// API 라우트
app.get('/api/sea-temp', async (req, res) => {
  const obsCode = req.query.obsCode;
  const date = req.query.date;

  const apiUrl = `http://www.khoa.go.kr/api/oceangrid/tidalBuTemp/search.do?ServiceKey=${API_KEY}&ObsCode=${obsCode}&Date=${date}&ResultType=json`;

  try {
    const response = await axios.get(apiUrl);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: '데이터 요청 실패',
      detail: error.message,
    });
  }
});

// ✅ 포트는 Render가 지정하므로 환경변수에서 받아야 함
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`서버 실행 중 on port ${port}`);
});
