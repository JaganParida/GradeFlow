const mongoose = require("mongoose");
require("dotenv").config();
const Ranking = require("./models/Ranking");

async function checkRank() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const userRegNo = "230301120327";
  const userRankings = await Ranking.findOne({ regNo: userRegNo, semester: 6 });
  
  const topRanks = await Ranking.find({ semester: 6, sgpa: { $gt: 9.70 } }).sort({ sgpa: -1 });
  
  const uniqueSgpas = new Set();
  topRanks.forEach(r => uniqueSgpas.add(r.sgpa));
  
  console.log(`Unique SGPAs above 9.70: ${uniqueSgpas.size}`);
  console.log([...uniqueSgpas]);
  
  process.exit();
}
checkRank();
