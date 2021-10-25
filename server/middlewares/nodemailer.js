require('dotenv').config();
const nodemailer = require('nodemailer');

const email = {
  host: process.env.NODEMAILER_HOST,
  port: 2525,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS
  }
};

const send = async (data) => {
  nodemailer.createTransport(email).sendMail(data, (err, info) => {
    if (err) console.log(err);
    else {
      console.log(info);
      return info.response;
    }
  });
};

const content = {
  from: '"Hanamon 👻" <devparkhana@gmail.com>',
  to: '76a29c582d-dfb390@inbox.mailtrap.io',
  subject: 'nodemailer 이메일 보내기',
  text: 'nodemailer 를 이용한 이메일 보내기 구현'
};

send(content);
