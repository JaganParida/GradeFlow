import { CheckCircle, GraduationCap, Info, Target, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const COMPANY_DATA = {
  CSE: [
    ["TCS", "60%", "60%", "6.0 CGPA / 60%", 6.0],
    ["Infosys", "60%", "60%", "6.0 CGPA", 6.0],
    ["Wipro", "60%", "60%", "6.0 CGPA", 6.0],
    ["Cognizant", "60%", "60%", "6.0 CGPA", 6.0],
    ["Accenture", "65%", "65%", "6.5 CGPA", 6.5],
    ["IBM", "65%", "65%", "6.5 CGPA", 6.5],
    ["Amazon", "70%", "70%", "7.0 CGPA", 7.0],
    ["Microsoft", "70%", "70%", "7.0 CGPA", 7.0],
    ["Oracle", "70%", "70%", "7.0 CGPA", 7.0],
    ["Capgemini", "60%", "60%", "6.0 CGPA", 6.0],
  ],
  CIVIL: [
    ["Larsen & Toubro (L&T)", "60%", "60%", "6.75 CGPA", 6.75],
    ["Tata Projects", "60%", "60%", "6.0 CGPA", 6.0],
    ["Shapoorji Pallonji", "60%", "60%", "6.0 CGPA", 6.0],
    ["Afcons Infrastructure", "60%", "60%", "6.0 CGPA", 6.0],
    ["Hindustan Construction Co. (HCC)", "60%", "60%", "6.0 CGPA", 6.0],
    ["JSW Steel (Civil)", "60%", "60%", "6.0 CGPA", 6.0],
    ["GMR Group", "60%", "60%", "6.0 CGPA", 6.0],
    ["Reliance Infrastructure", "60%", "60%", "6.0 CGPA", 6.0],
    ["Coal India Limited", "60%", "60%", "60%", 6.0],
    ["RITES Ltd", "60%", "60%", "60%", 6.0],
  ],
  ME: [
    ["Larsen & Toubro (L&T)", "60%", "60%", "6.75 CGPA", 6.75],
    ["Tata Motors", "60%", "60%", "6.0 CGPA", 6.0],
    ["Mahindra & Mahindra", "60%", "60%", "6.0 CGPA", 6.0],
    ["Maruti Suzuki", "65%", "65%", "6.5 CGPA", 6.5],
    ["Bajaj Auto", "65%", "65%", "6.5 CGPA", 6.5],
    ["Bosch", "70%", "70%", "7.0 CGPA", 7.0],
    ["Ashok Leyland", "60%", "60%", "6.0 CGPA", 6.0],
    ["Godrej & Boyce", "60%", "60%", "6.0 CGPA", 6.0],
    ["Thermax", "60%", "60%", "6.0 CGPA", 6.0],
    ["Coal India Limited", "60%", "60%", "60%", 6.0],
  ],
  ECE: [
    ["Texas Instruments", "70%", "70%", "7.0 CGPA", 7.0],
    ["Intel", "70%", "70%", "7.0 CGPA", 7.0],
    ["Qualcomm", "75%", "75%", "7.5 CGPA", 7.5],
    ["Cisco", "70%", "70%", "7.0 CGPA", 7.0],
    ["Samsung R&D", "70%", "70%", "7.0 CGPA", 7.0],
    ["TCS (Embedded/IT)", "60%", "60%", "6.0 CGPA / 60%", 6.0],
    ["Ericsson", "60%", "60%", "6.0 CGPA", 6.0],
    ["Nokia", "60%", "60%", "6.0 CGPA", 6.0],
    ["NXP Semiconductors", "70%", "70%", "7.0 CGPA", 7.0],
    ["Bharat Electronics Ltd (BEL)", "60%", "60%", "60%", 6.0],
  ],
  EEE: [
    ["Siemens", "60%", "60%", "6.0 CGPA", 6.0],
    ["Schneider Electric", "60%", "60%", "6.0 CGPA", 6.0],
    ["ABB India", "60%", "60%", "6.0 CGPA", 6.0],
    ["General Electric (GE)", "65%", "65%", "6.5 CGPA", 6.5],
    ["Crompton Greaves", "60%", "60%", "6.0 CGPA", 6.0],
    ["Havells India", "60%", "60%", "6.0 CGPA", 6.0],
    ["Tata Power", "60%", "60%", "6.0 CGPA", 6.0],
    ["Adani Power", "60%", "60%", "6.0 CGPA", 6.0],
    ["NTPC", "65%", "65%", "65%", 6.5],
    ["Coal India Limited", "60%", "60%", "60%", 6.0],
  ],
  BIO: [
    ["Biocon", "60%", "60%", "6.0 CGPA", 6.0],
    ["Dr. Reddy's Laboratories", "60%", "60%", "6.0 CGPA", 6.0],
    ["Serum Institute of India", "60%", "60%", "6.0 CGPA", 6.0],
    ["Bharat Biotech", "60%", "60%", "6.0 CGPA", 6.0],
    ["Cipla", "60%", "60%", "6.0 CGPA", 6.0],
    ["Sun Pharma", "60%", "60%", "6.0 CGPA", 6.0],
    ["Novozymes", "65%", "65%", "6.5 CGPA", 6.5],
    ["GlaxoSmithKline (GSK)", "60%", "60%", "6.0 CGPA", 6.0],
    ["Thermo Fisher Scientific", "65%", "65%", "6.5 CGPA", 6.5],
    ["Zydus Lifesciences", "60%", "60%", "6.0 CGPA", 6.0],
  ],
  MI: [
    ["Coal India Limited", "60%", "60%", "60%", 6.0],
    ["Vedanta Resources", "60%", "60%", "6.0 CGPA", 6.0],
    ["Hindustan Zinc", "60%", "60%", "6.0 CGPA", 6.0],
    ["Tata Steel (Mining)", "65%", "65%", "6.5 CGPA", 6.5],
    ["NMDC", "60%", "60%", "6.0 CGPA", 6.0],
    ["Rio Tinto (India)", "65%", "65%", "6.5 CGPA", 6.5],
    ["JSW Steel (Mining)", "60%", "60%", "6.0 CGPA", 6.0],
    ["Adani Enterprises (Mining)", "60%", "60%", "6.0 CGPA", 6.0],
    ["Essel Mining & Industries", "60%", "60%", "6.0 CGPA", 6.0],
    ["Hindalco Industries", "60%", "60%", "6.0 CGPA", 6.0],
  ],
  AERO: [
    ["Hindustan Aeronautics (HAL)", "65%", "65%", "6.5 CGPA", 6.5],
    ["ISRO", "65%", "65%", "6.5 CGPA / 65%", 6.5],
    ["DRDO", "60%", "60%", "6.0 CGPA", 6.0],
    ["Boeing India", "70%", "70%", "7.0 CGPA", 7.0],
    ["Airbus India", "70%", "70%", "7.0 CGPA", 7.0],
    ["GE Aerospace", "70%", "70%", "7.0 CGPA", 7.0],
    ["Rolls-Royce India", "70%", "70%", "7.0 CGPA", 7.0],
    ["Tata Advanced Systems", "60%", "60%", "6.0 CGPA", 6.0],
    ["Mahindra Aerospace", "60%", "60%", "6.0 CGPA", 6.0],
    ["Collins Aerospace", "65%", "65%", "6.5 CGPA", 6.5],
  ],
};

function normalizeBranch(branch) {
  const key = String(branch || "").trim().toUpperCase();
  if (key.includes("CIVIL")) return "CIVIL";
  if (key.includes("CSE") || key.includes("COMPUTER")) return "CSE";
  if (key.includes("ECE") || key.includes("ELECTRONICS")) return "ECE";
  if (key.includes("EEE") || key.includes("ELECTRICAL")) return "EEE";
  if (key === "ME" || key.includes("MECHANICAL")) return "ME";
  if (key.includes("BIO")) return "BIO";
  if (key === "MI" || key.includes("MINING")) return "MI";
  if (key.includes("AERO")) return "AERO";
  return key;
}

export default function CompanyEligibility({ branch, cgpa }) {
  const branchKey = normalizeBranch(branch);
  const numericCgpa = Number(cgpa) || 0;
  const companies = (COMPANY_DATA[branchKey] || []).map(([name, tenth, twelfth, btech, cgpaReq]) => ({
    name,
    tenth,
    twelfth,
    btech,
    cgpaReq,
    eligible: numericCgpa >= cgpaReq,
    gap: Math.max(cgpaReq - numericCgpa, 0),
  }));
  const eligibleCount = companies.filter((company) => company.eligible).length;

  if (!companies.length) {
    return (
      <div className="placement-empty">
        <Info size={24} />
        <div>
          <h3>No company list mapped for {branch || "this branch"}</h3>
          <p>Branch is detected from registration number format. Add this branch to the placement list to show eligibility.</p>
        </div>
      </div>
    );
  }

  return (
    <section className="placement-eligibility">
      <div className="placement-hero">
        <div>
          <p className="placement-eyebrow">
            <Target size={14} /> Branch filtered companies
          </p>
          <h2>Placement Eligibility</h2>
          <p>
            Showing companies for <strong>{branchKey}</strong>. Eligibility badge is calculated from CGPA only.
            10th and 12th percentages are shown as company requirements, not calculated here.
          </p>
        </div>
        <div className="placement-score-card">
          <span>Your CGPA</span>
          <strong>{numericCgpa.toFixed(2)}</strong>
          <small>{eligibleCount} of {companies.length} eligible</small>
        </div>
      </div>

      <div className="placement-summary-grid">
        <div>
          <span>Branch</span>
          <strong>{branchKey}</strong>
        </div>
        <div>
          <span>Eligible Now</span>
          <strong>{eligibleCount}</strong>
        </div>
        <div>
          <span>Need Improvement</span>
          <strong>{companies.length - eligibleCount}</strong>
        </div>
      </div>

      <div className="placement-company-grid">
        {companies.map((company, index) => (
          <motion.article
            key={company.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`placement-company-card ${company.eligible ? "eligible" : "locked"}`}
          >
            <div className="placement-company-head">
              <div>
                <span className="placement-company-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{company.name}</h3>
              </div>
              <span className={`placement-status ${company.eligible ? "eligible" : "locked"}`}>
                {company.eligible ? <CheckCircle size={13} /> : <XCircle size={13} />}
                {company.eligible ? "Eligible" : "Not Yet"}
              </span>
            </div>

            <div className="placement-requirements">
              <div>
                <span>10th</span>
                <strong>{company.tenth}</strong>
              </div>
              <div>
                <span>12th</span>
                <strong>{company.twelfth}</strong>
              </div>
              <div>
                <span>B.Tech</span>
                <strong>{company.btech}</strong>
              </div>
            </div>

            <div className="placement-progress-row">
              <div>
                <span>CGPA requirement</span>
                <strong>{company.cgpaReq.toFixed(2)}</strong>
              </div>
              <div className="placement-progress-track" aria-hidden="true">
                <div style={{ width: `${Math.min((numericCgpa / company.cgpaReq) * 100, 100)}%` }} />
              </div>
            </div>

            {!company.eligible && (
              <p className="placement-gap">
                Need {company.gap.toFixed(2)} more CGPA for this company.
              </p>
            )}
          </motion.article>
        ))}
      </div>

      <div className="placement-note">
        <GraduationCap size={16} />
        <p>
          Final placement eligibility may also depend on backlog history, active backlogs, aptitude rounds,
          branch-specific rules, and official company policy.
        </p>
      </div>
    </section>
  );
}
