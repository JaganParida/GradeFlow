const axios = require('axios');
axios.post('https://grade-flow-navy.vercel.app/api/send-backlog-email', {
  regNo: '230301120137'
}).then(r => console.log(r.data)).catch(e => console.error(e.response?.data || e.message));
