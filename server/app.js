require('dotenv').config();
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const nodemailer = require('nodemailer');
const app = express();
const { order, user } = require('./models');

app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'pug');

// AWS S3 File Upload
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID, //노출주의
  secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY, //노출주의
  region: process.env.AWS_S3_REGION //노출주의
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'jisiksponsor.com/resource',
    key: function (req, file, done) {
      const ext = path.extname(file.originalname);
      done(null, Date.now() + '-' + file.originalname);
    },
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE
  })
});

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

// HTML template engine
app.get('/pug', (req, res) => {
  res.render('emails/customer-new-account', { title: '퍼그지롱롱' });
});

// HTML template engine
app.get('/layout', (req, res) => {
  res.render('index', { title: '레이아웃' });
});

// upload view
app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/upload.html'));
});

app.post('/upload', upload.single('image'), (req, res) => {
  const image = req.file;
  res.json({ image });
});

// import view
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

// "/payments/complete/mobile/"에 대한 GET 요청을 처리
app.get('/payments/complete/mobile/', async (req, res) => {
  try {
    // req의 query에서 imp_uid, merchant_uid 추출
    const { imp_uid, merchant_uid } = req.query;

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
      method: 'GET', // GET method
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

// signup
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/signup.html'));
});

app.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  const key_one = crypto.randomBytes(256).toString('hex').substr(100, 5);
  const key_two = crypto.randomBytes(256).toString('base64').substr(50, 5);
  const key_for_verify = key_one + key_two;

  const newUser = await user.create({ email, password, key_for_verify });

  const url = 'http://localhost:4000/confirm/email?key=' + key_for_verify;

  const smtpTransport = {
    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT,
    secure: false,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS
    }
  };

  const content = {
    from: '"Hanamon 👻" <devparkhana@gmail.com>',
    to: '76a29c582d-dfb390@inbox.mailtrap.io',
    subject: '회원가입 이메일 인증을 진행해주세요.',
    html: `<h1>회원가입 인증 URL에 접속하여 인증을 완료해주세요.</h1><br><a src="${url}">${url}</a>`
  };

  const send = async (data) => {
    nodemailer.createTransport(smtpTransport).sendMail(data, (err, info) => {
      if (err) console.log(err);
      console.log('email has been sent!');
    });
  };

  send(content);

  res.send(
    '<script type="text/javascript">alert("이메일을 확인하세요."); window.location="/"; </script>'
  );
});

app.get('/confirm/email', async (req, res) => {
  const { key } = req.query;
  console.log(key);
  const findUser = await user.findOne({ where: { key_for_verify: key } });
  if (!findUser) return res.status(404).send('Not Found!');
  const updateUser = await user.update(
    { email_verified: true },
    { where: { key_for_verify: key } }
  );
  res.redirect('http://localhost:4000/mypage');
});

app.get('/mypage', (req, res) => {
  res.send('mypage');
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
  res.locals.message = err.message;
  res.locals.status = err.status;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
