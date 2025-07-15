// .env 파일에서 환경 변수(API_KEY)를 읽어옴
require('dotenv').config();

const express = require('express');  // 웹서버 프레임워크
const axios = require('axios');      // 외부 API 요청 도구
const cors = require('cors');        // CORS 허용 (웹에서 접속 가능하게)

const app = express();               // 서버 앱 초기화
const port = 3000;                   // 서버 포트 번호

app.use(cors());                     // 모든 요청에 대해 CORS 허용

const API_KEY = process.env.API_KEY; // .env에서 키 불러오기

// http://localhost:3000/api/sea-temp?obsCode=TW_0062&date=20250101
app.get('/api/sea-temp', async (req, res) => {
    const obsCode = req.query.obsCode;
    const date = req.query.date;

    async function fetchTemp(dateStr) {
        const apiUrl = `http://www.khoa.go.kr/api/oceangrid/tidalBuTemp/search.do?ServiceKey=${API_KEY}&ObsCode=${obsCode}&Date=${dateStr}&ResultType=json`;
        return await axios.get(apiUrl);
    }

    try {
        let response = await fetchTemp(date);

        // 에러 없이 성공했다면 그대로 전달
        res.json(response.data);
    } catch (error) {
        // 날짜 문제인 경우 어제 날짜로 재시도
        if (error.response?.data?.result?.error === "invalid date") {
            const yest = new Date();
            yest.setDate(yest.getDate() - 1);
            const yyyy = yest.getFullYear();
            const mm = String(yest.getMonth() + 1).padStart(2, '0');
            const dd = String(yest.getDate()).padStart(2, '0');
            const yestDate = `${yyyy}${mm}${dd}`;
            console.log('Retrying with:', yestDate);
            try {
                const retry = await fetchTemp(yestDate);
                res.json(retry.data);
            } catch (retryErr) {
                res.status(500).json({ error: "어제 날짜로도 실패", details: retryErr.message });
            }
        } else {
            res.status(500).json({ error: "데이터 요청 실패", details: error.message });
        }
    }
});
