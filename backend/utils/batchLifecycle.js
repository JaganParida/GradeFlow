const SemesterResult = require("../models/SemesterResult");
const Ranking = require("../models/Ranking");
const InternalMark = require("../models/InternalMark");
const Student = require("../models/Student");
const BatchPurgeLog = require("../models/BatchPurgeLog");

/**
 * Extracts batch string "20XX" from Registration Number (first 2 digits).
 */
function getBatchFromRegNo(regNo) {
  if (!regNo) return "";
  const r = String(regNo).trim();
  if (/^\d{2}/.test(r)) {
    return `20${r.slice(0, 2)}`;
  }
  return "";
}

/**
 * Checks if a given batch string (e.g. "2019", "2020") has exceeded the 5-year retention limit.
 * A batch Y is valid through year Y + 5.
 * In calendar year C, it is expired if C > Y + 5.
 */
function isBatchExpired(batchStr, referenceYear = new Date().getFullYear()) {
  if (!batchStr) return false;
  const bYear = parseInt(batchStr, 10);
  if (isNaN(bYear)) return false;

  const maxValidYear = bYear + 5;
  return referenceYear > maxValidYear;
}

/**
 * Sweeps the database for expired batches (> 5 years old),
 * purges all associated records, and creates audit log entries.
 */
async function purgeExpiredBatches() {
  const currentYear = new Date().getFullYear();
  try {
    // Distinct batches present in SemesterResult and Ranking
    const resultBatches = await SemesterResult.distinct("batch");
    const rankingBatches = await Ranking.distinct("batch");
    const internalBatches = await InternalMark.distinct("batch");

    const allBatches = [
      ...new Set([...resultBatches, ...rankingBatches, ...internalBatches]),
    ].filter(Boolean);

    const expiredBatches = allBatches.filter((b) => isBatchExpired(b, currentYear));

    if (!expiredBatches.length) {
      console.log(`[Batch Lifecycle] No expired batches found for year ${currentYear}.`);
      return { purgedCount: 0, expiredBatches: [] };
    }

    console.log(`[Batch Lifecycle] Found ${expiredBatches.length} expired batch(es) to purge: ${expiredBatches.join(", ")}`);

    const purgeSummary = [];

    for (const batch of expiredBatches) {
      // Find all affected regNos for this batch
      const affectedResults = await SemesterResult.find({ batch }, "regNo").lean();
      const affectedRegNos = [...new Set(affectedResults.map((r) => r.regNo))];

      // Perform bulk deletions
      const deletedResults = await SemesterResult.deleteMany({ batch });
      const deletedRankings = await Ranking.deleteMany({ batch });
      const deletedInternals = await InternalMark.deleteMany({ batch });

      let deletedStudentsCount = 0;
      if (affectedRegNos.length > 0) {
        const delStudentsRes = await Student.deleteMany({ regNo: { $in: affectedRegNos } });
        deletedStudentsCount = delStudentsRes.deletedCount || 0;
      }

      const totalRecordsDeleted =
        (deletedResults.deletedCount || 0) +
        (deletedRankings.deletedCount || 0) +
        (deletedInternals.deletedCount || 0);

      // Create Audit Log
      await BatchPurgeLog.create({
        batch,
        purgedAt: new Date(),
        recordsDeleted: totalRecordsDeleted,
        studentsAffected: affectedRegNos.length,
        sampleRegNos: affectedRegNos.slice(0, 20),
        triggerReason: `5-Year Batch Retention Limit Reached (Batch ${batch} expired in ${currentYear})`,
      });

      purgeSummary.push({
        batch,
        recordsDeleted: totalRecordsDeleted,
        studentsAffected: affectedRegNos.length,
      });

      console.log(`[Batch Lifecycle] Purged Batch ${batch}: ${totalRecordsDeleted} records deleted for ${affectedRegNos.length} students.`);
    }

    return {
      purgedCount: expiredBatches.length,
      expiredBatches,
      summary: purgeSummary,
    };
  } catch (err) {
    console.error("[Batch Lifecycle] Error during expired batch purge:", err);
    throw err;
  }
}

module.exports = {
  getBatchFromRegNo,
  isBatchExpired,
  purgeExpiredBatches,
};
