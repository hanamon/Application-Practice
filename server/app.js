require('dotenv').config();
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const { order } = require('./models');

// Handling unexpected exceptions
process.on('uncaughtException', (err) => {
  console.log('uncaughtException : ', err);
});

// Middleware
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [process.env.CLIENT_ORIGIN],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
  })
);

// Routing
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/import', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/import.html'));
});

// "/payments/complete"에 대한 POST 요청을 처리
app.post('/payments/complete', async (req, res) => {
  try {
    // req의 body에서 imp_uid, merchant_uid 추출
    const { imp_uid, merchant_uid } = req.body;

    // 1. 액세스 토큰(access token) 발급 받기
    const getToken = await axios({
      url: 'https://api.iamport.kr/users/getToken',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        imp_key: process.env.IMP_KEY, // REST API 키
        imp_secret: process.env.IMP_SECRET // REST API Secret
      }
    });
    // 인증 토큰 추출하기
    const { access_token } = getToken.data.response;
    console.log('access_token', access_token);

    // 2. imp_uid로 아임포트 서버에서 결제 정보 조회
    const getPaymentData = await axios({
      url: `https://api.iamport.kr/payments/${imp_uid}`, // imp_uid 전달
      method: 'GET',
      headers: { Authorization: access_token } // 인증 토큰 Authorization header에 추가
    });
    // 조회한 결제 정보
    const paymentData = getPaymentData.data.response;
    console.log('paymentData', paymentData);

    // 3. DB에서 결제되어야 하는 금액 조회
    const order = await order.findOne(paymentData.merchant_uid);
    const amountToBePaid = order.amount; // 결제 되어야 하는 금액

    // 4. 결제 검증하기
    const { amount, status } = paymentData;

    if (amount === amountToBePaid) {
      // 결제금액 일치. 결제 된 금액 === 결제 되어야 하는 금액
      await order.update(
        // DB에 결제 정보 저장
        {
          card_name: paymentData.card_name,
          status: paymentData.status
        },
        { where: { merchant_uid } }
      );
      switch (status) {
        case 'paid': // 결제 완료
          res.json({ status: 'success', message: '일반 결제 성공' });
          break;
      }
    } else {
      // 결제금액 불일치. 위/변조 된 결제
      throw { status: 'forgery', message: '위조된 결제시도' };
    }

    // 이후 적절한 로직 구현
    return res.json({ paymentData });
  } catch (err) {
    console.error(err);
    res.status(400).json({ err, message: 'Client Error' });
  }
});

// "/iamport-webhook"에 대한 POST 요청을 처리
app.post('/iamport-webhook', async (req, res) => {
  try {
    // req의 body에서 imp_uid, merchant_uid 추출
    const { imp_uid, merchant_uid } = req.body;

    // 1. 액세스 토큰(access token) 발급 받기
    const getToken = await axios({
      url: 'https://api.iamport.kr/users/getToken',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      data: {
        imp_key: process.env.IMP_KEY, // REST API 키
        imp_secret: process.env.IMP_SECRET // REST API Secret
      }
    });
    // 인증 토큰 추출하기
    const { access_token } = getToken.data.response;
    console.log('access_token', access_token);

    // 2. imp_uid로 아임포트 서버에서 결제 정보 조회
    const getPaymentData = await axios({
      url: `https://api.iamport.kr/payments/${imp_uid}`, // imp_uid 전달
      method: 'GET',
      headers: { Authorization: access_token } // 인증 토큰 Authorization header에 추가
    });
    // 조회한 결제 정보
    const paymentData = getPaymentData.data.response;
    console.log('paymentData', paymentData);

    // 3. DB에서 결제되어야 하는 금액 조회
    const order = await order.findOne(paymentData.merchant_uid);
    const amountToBePaid = order.amount; // 결제 되어야 하는 금액

    // 4. 결제 검증하기
    const { amount, status } = paymentData;

    if (amount === amountToBePaid) {
      // 결제금액 일치. 결제 된 금액 === 결제 되어야 하는 금액
      await order.update(
        // DB에 결제 정보 저장
        {
          card_name: paymentData.card_name,
          status: paymentData.status
        },
        { where: { merchant_uid } }
      );
      switch (status) {
        case 'paid': // 결제 완료
          res.json({ status: 'success', message: '일반 결제 성공' });
          break;
      }
    } else {
      // 결제금액 불일치. 위/변조 된 결제
      throw { status: 'forgery', message: '위조된 결제시도' };
    }

    // 이후 적절한 로직 구현
    return res.json({ paymentData });
  } catch (err) {
    console.error(err);
    res.status(400).json({ err, message: 'Client Error' });
  }
});

// Error handling
app.use((req, res, next) => {
  const error = new Error(
    `${req.method} ${req.originalUrl} There is no router.`
  );
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send(err.message);
});

module.exports = app;
