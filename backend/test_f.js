require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Ranking = require('./models/Ranking');
  const count1 = await Ranking.countDocuments({ regNo: { $regex: '^2303011203[0-6][0-9]' }, semester: 6 });
  const count2 = await Ranking.countDocuments({ regNo: { $regex: '^2303011203[0-6][0-9]' }, semester: 6, sgpa: { $gt: 0 } });
  console.log('Total F:', count1);
  console.log('F with SGPA>0:', count2);
  process.exit();
});
