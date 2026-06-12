const fs = require('fs');

function patchDashboard() {
  let code = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');

  code = code.replace(/import \{ motion \} from "framer-motion";/, 'import { motion, AnimatePresence } from "framer-motion";');
  code = code.replace(/from "lucide-react";/, ', X, List } from "lucide-react";');
  
  if (!code.includes('isNavSheetOpen')) {
    code = code.replace('const [tabsVisible, setTabsVisible] = useState(true);', 'const [tabsVisible, setTabsVisible] = useState(true);\n  const [isNavSheetOpen, setIsNavSheetOpen] = useState(false);');
  }

  const newBlock = `      {/* Floating Quick Navigation Button */}
      <AnimatePresence>
      {!tabsVisible && isMobile && !isNavSheetOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsNavSheetOpen(true)}
          style={{
            position: 'fixed',
            bottom: 'calc(90px + env(safe-area-inset-bottom))',
            right: 24,
            zIndex: 1100,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            width: 56,
            height: 56,
            borderRadius: 28,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <List size={24} />
        </motion.button>
      )}
      </AnimatePresence>

      {/* Mobile Navigation Bottom Sheet */}
      <AnimatePresence>
        {isNavSheetOpen && (
          <>
            <motion.div
              className="mobile-bottom-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavSheetOpen(false)}
            />
            <motion.div
              className="mobile-bottom-sheet"
              style={{ zIndex: 1200 }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="mobile-bottom-sheet-grabber" />
              <div className="mobile-bottom-sheet-head">
                <h3>Quick Navigation</h3>
                <button type="button" className="mobile-bottom-sheet-close" onClick={() => setIsNavSheetOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 800, letterSpacing: 1 }}>SEMESTER</p>
                <div className="tabs" style={{ flexWrap: 'wrap', marginBottom: 24, gap: 6 }}>
                  {results.map((r) => (
                    <button
                      key={r.semester}
                      className={\`tab-btn \${selectedSem === r.semester ? "active" : ""}\`}
                      onClick={() => {
                        setSelectedSem(r.semester);
                        loadSemester(r.semester);
                        setIsNavSheetOpen(false);
                      }}
                      style={{ margin: 0 }}
                    >
                      Sem {r.semester}
                    </button>
                  ))}
                </div>

                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 800, letterSpacing: 1 }}>SECTIONS</p>
                <div className="tabs" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {[
                    ["result", "Result", <FileText size={14} key="result" />],
                    ["internal", "Internal Marks", <FileEdit size={14} key="int" />],
                    ["history", "Semester History", <Calendar size={14} key="hist" />],
                    ["baskets", "Degree Progress", <Layout size={14} key="basket" />],
                    ["predictor", "Target Predictor", <Calculator size={14} key="pred" />],
                  ].map(([t, l, icon]) => (
                    <button
                      key={t}
                      className={\`tab-btn \${tab === t ? "active" : ""}\`}
                      onClick={() => {
                        setTab(t);
                        setIsNavSheetOpen(false);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}
                    >
                      {icon} {l}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>`;

  code = code.replace(/\{\/\* Floating Quick Navigation Button \*\/\}[\s\S]*?<\/motion\.div>/, newBlock);

  fs.writeFileSync('frontend/src/pages/Dashboard.jsx', code);
  console.log('Dashboard patched');
}

function patchAnalytics() {
  let code = fs.readFileSync('frontend/src/pages/Analytics.jsx', 'utf8');

  code = code.replace(/import \{ motion, animate \} from "framer-motion";/, 'import { motion, animate, AnimatePresence } from "framer-motion";');
  code = code.replace(/from "lucide-react";/, ', X, List } from "lucide-react";');
  
  if (!code.includes('isNavSheetOpen')) {
    code = code.replace('const [tabsVisible, setTabsVisible] = useState(true);', 'const [tabsVisible, setTabsVisible] = useState(true);\n  const [isNavSheetOpen, setIsNavSheetOpen] = useState(false);');
  }

  const newBlock = `      {/* Floating Quick Navigation Button */}
      <AnimatePresence>
      {!tabsVisible && isMobile && !isNavSheetOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsNavSheetOpen(true)}
          style={{
            position: 'fixed',
            bottom: 'calc(90px + env(safe-area-inset-bottom))',
            right: 24,
            zIndex: 1100,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            width: 56,
            height: 56,
            borderRadius: 28,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <List size={24} />
        </motion.button>
      )}
      </AnimatePresence>

      {/* Mobile Navigation Bottom Sheet */}
      <AnimatePresence>
        {isNavSheetOpen && (
          <>
            <motion.div
              className="mobile-bottom-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavSheetOpen(false)}
            />
            <motion.div
              className="mobile-bottom-sheet"
              style={{ zIndex: 1200 }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="mobile-bottom-sheet-grabber" />
              <div className="mobile-bottom-sheet-head">
                <h3>Quick Navigation</h3>
                <button type="button" className="mobile-bottom-sheet-close" onClick={() => setIsNavSheetOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 800, letterSpacing: 1 }}>SECTIONS</p>
                <div className="tabs" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {[
                    ["overview", "Overview", <BarChart2 size={14} key="ov" />],
                    ["predictor", "Predictor", <Target size={14} key="pr" />],
                    ["whatif", "What-If", <PieChart size={14} key="wi" />],
                    ["placement", "Placement", <Briefcase size={14} key="pl" />],
                  ].map(([t, l, icon]) => (
                    <button
                      key={t}
                      className={\`tab-btn \${tab === t ? "active" : ""}\`}
                      onClick={() => {
                        setTab(t);
                        setIsNavSheetOpen(false);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}
                    >
                      {icon} {l}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>`;

  code = code.replace(/\{\/\* Floating Quick Navigation Button \*\/\}[\s\S]*?<\/motion\.div>/, newBlock);

  fs.writeFileSync('frontend/src/pages/Analytics.jsx', code);
  console.log('Analytics patched');
}

patchDashboard();
patchAnalytics();
