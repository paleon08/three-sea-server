const express = require('express');
const axios = require('axios');
const cors = require('cors');
const db = require('./firebase'); // 🔥 Firebase 연동

const app = express();
app.use(cors());

const API_KEY = process.env.API_KEY;

app.get('/api/sea-temp', async (req, res) => {
  const obsCode = req.query.obsCode;
  const date = req.query.date;

  const apiUrl = `http://www.khoa.go.kr/api/oceangrid/tidalBuTemp/search.do?ServiceKey=${API_KEY}&ObsCode=${obsCode}&Date=${date}&ResultType=json`;

  try {
    const response = await axios.get(apiUrl);
    const result = response.data;

    // 🔥 수온 데이터를 Firebase에 저장
    if (result.result?.data) {
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
    res.status(500).json({
      error: '데이터 요청 실패',
      detail: error.message,
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`서버 실행 중 on port ${port}`);
});
