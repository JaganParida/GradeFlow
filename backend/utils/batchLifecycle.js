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
  const maxExpiredBatchYear = currentYear - 6; // e.g. in 2026, 2026 - 6 = 2020. Batches <= 2020 are expired

  try {
    const expiredBatches = [];
    const expiredPrefixes = [];

    for (let y = 2000; y <= maxExpiredBatchYear; y++) {
      const bStr = String(y);
      expiredBatches.push(bStr);
      expiredPrefixes.push(bStr.slice(-2));
    }

    const regNoRegex = new RegExp(`^(${expiredPrefixes.join("|")})`);

    // Query filter matching regNo prefix OR batch string
    const queryFilter = {
      $or: [
        { regNo: regNoRegex },
        { batch: { $in: expiredBatches } }
      ]
    };

    // Find affected RegNos
    const affectedResults = await SemesterResult.find(queryFilter, "regNo batch").lean();
    const affectedRankings = await Ranking.find(queryFilter, "regNo batch").lean();
    const affectedInternals = await InternalMark.find(queryFilter, "regNo batch").lean();

    const affectedRegNos = [
      ...new Set([
        ...affectedResults.map((r) => r.regNo),
        ...affectedRankings.map((r) => r.regNo),
        ...affectedInternals.map((r) => r.regNo),
      ]),
    ].filter(Boolean);

    if (!affectedRegNos.length && !affectedResults.length && !affectedRankings.length && !affectedInternals.length) {
      console.log(`[Batch Lifecycle] No expired batch records found for year ${currentYear}.`);
      return { purgedCount: 0, expiredBatches: [] };
    }

    console.log(`[Batch Lifecycle] Found ${affectedRegNos.length} unique expired student(s) to purge across database.`);

    // Perform bulk deleteMany
    const delRes = await SemesterResult.deleteMany(queryFilter);
    const delRank = await Ranking.deleteMany(queryFilter);
    const delInt = await InternalMark.deleteMany(queryFilter);
    let delStudCount = 0;
    if (affectedRegNos.length > 0) {
      const delStud = await Student.deleteMany({ regNo: { $in: affectedRegNos } });
      delStudCount = delStud.deletedCount || 0;
    }

    const totalRecordsDeleted =
      (delRes.deletedCount || 0) +
      (delRank.deletedCount || 0) +
      (delInt.deletedCount || 0);

    // Group logs by batch for Audit Log
    const byBatch = {};
    affectedResults.concat(affectedRankings).concat(affectedInternals).forEach((r) => {
      let b = r.batch;
      if (!b && r.regNo && /^\d{2}/.test(r.regNo)) {
        b = `20${r.regNo.slice(0, 2)}`;
      }
      if (!b) b = "Expired";
      if (!byBatch[b]) byBatch[b] = [];
      byBatch[b].push(r.regNo);
    });

    const purgedBatchesList = Object.keys(byBatch);

    for (const [batch, regNos] of Object.entries(byBatch)) {
      const uniqueRegs = [...new Set(regNos)];
      await BatchPurgeLog.create({
        batch,
        purgedAt: new Date(),
        recordsDeleted: regNos.length,
        studentsAffected: uniqueRegs.length,
        sampleRegNos: uniqueRegs.slice(0, 20),
        triggerReason: `5-Year Batch Retention Limit Reached (Batch ${batch} expired in ${currentYear})`,
      });
    }

    console.log(`[Batch Lifecycle] Purged ${purgedBatchesList.length} expired batch(es): ${totalRecordsDeleted} records deleted.`);

    return {
      purgedCount: purgedBatchesList.length,
      expiredBatches: purgedBatchesList,
      totalRecordsDeleted,
      studentsAffected: affectedRegNos.length,
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
