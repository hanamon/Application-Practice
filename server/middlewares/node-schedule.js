const schedule = require('node-schedule');

let scheduleObj = null;

const set = (s) => {
  const rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = s.dayOfWeek;
  rule.hour = s.hour;
  rule.minute = s.minute;

  const job = schedule.scheduleJob(rule, () => {
    console.log('예약된 작업 실행!');
  });

  scheduleObj = job;
};

const cancel = () => {
  if (scheduleObj !== null) {
    console.log('이전 작업 취소');
    scheduleObj.cancel();
  }
};

const setScheduler = (s) => {
  console.log('예약하였습니다.');
  cancel();
  set(s);
};

const scheduleData = {
  dayOfWeek: [2],
  hour: 3,
  minute: 57
};

const scheduleData2 = {
  dayOfWeek: [2],
  hour: 3,
  minute: 58
};

setScheduler(scheduleData);

setTimeout(() => setScheduler(scheduleData2), 1000);
