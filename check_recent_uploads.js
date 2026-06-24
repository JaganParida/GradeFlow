const mongoose = require("mongoose");
const SemesterResult = require("./backend/models/SemesterResult");
require("dotenv").config({ path: "./backend/.env" });

async function checkRecentUploads() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 3);

    const recentResults = await SemesterResult.aggregate([
      {
        $match: {
          uploadedAt: { $gte: twoDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$uploadedAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    console.log("Recent Uploads by Date:");
    console.log(recentResults);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkRecentUploads();
