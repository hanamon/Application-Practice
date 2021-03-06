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
  from: '"Hanamon π»" <devparkhana@gmail.com>',
  to: '76a29c582d-dfb390@inbox.mailtrap.io',
  subject: 'νμκ°μ μΈμ¦ μ΄λ©μΌ',
  text: 'νμκ°μ μΈμ¦ URLμ μ μνμ¬ μΈμ¦μ μλ£ν΄μ£ΌμΈμ.'
};

const send = async (data) => {
  nodemailer.createTransport(email).sendMail(data, (err, info) => {
    if (err) console.log(err);
    console.log('success!');
  });
};

send(content);
