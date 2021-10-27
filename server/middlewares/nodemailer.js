require('dotenv').config();
const nodemailer = require('nodemailer');

const email = {
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
  subject: '회원가입 인증 이메일',
  text: '회원가입 인증 URL에 접속하여 인증을 완료해주세요.'
};

const send = async (data) => {
  nodemailer.createTransport(email).sendMail(data, (err, info) => {
    if (err) console.log(err);
    console.log('success!');
  });
};

send(content);
