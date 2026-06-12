const fs = require('fs');

function updateDashboard() {
  let code = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');

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
            right: 20,
            zIndex: 1100,
            background: 'rgba(15,15,15,0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.12)',
            width: 48,
            height: 48,
            borderRadius: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <List size={20} />
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
              <div className="mobile-bottom-sheet-head" style={{ marginBottom: 20 }}>
                <h3>Navigation</h3>
                <button type="button" className="mobile-bottom-sheet-close" onClick={() => setIsNavSheetOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700, letterSpacing: 1, paddingLeft: 4 }}>SEMESTER</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 28 }}>
                  {results.map((r) => {
                    const isActive = selectedSem === r.semester;
                    return (
                    <button
                      key={r.semester}
                      onClick={() => {
                        setSelectedSem(r.semester);
                        loadSemester(r.semester);
                        setIsNavSheetOpen(false);
                      }}
                      style={{
                        padding: '12px 0',
                        borderRadius: 14,
                        border: isActive ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.06)',
                        background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                        color: isActive ? 'var(--accent)' : 'var(--text)',
                        fontSize: 14,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {r.semester}
                    </button>
                  )})}
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700, letterSpacing: 1, paddingLeft: 4 }}>VIEWS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ["result", "Result", <FileText size={18} key="result" />],
                    ["internal", "Internal Marks", <FileEdit size={18} key="int" />],
                    ["history", "Semester History", <Calendar size={18} key="hist" />],
                    ["baskets", "Degree Progress", <Layout size={18} key="basket" />],
                    ["predictor", "Target Predictor", <Calculator size={18} key="pred" />],
                  ].map(([t, l, icon]) => {
                    const isActive = tab === t;
                    return (
                    <button
                      key={t}
                      onClick={() => {
                        setTab(t);
                        setIsNavSheetOpen(false);
                      }}
                      style={{ 
                        width: '100%',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 14,
                        padding: '16px',
                        borderRadius: 16,
                        border: isActive ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
                        background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                        fontSize: 15,
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36, borderRadius: 10,
                        background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                        color: isActive ? '#000' : 'var(--text)',
                      }}>
                        {icon}
                      </div>
                      {l}
                    </button>
                  )})}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>`;

  code = code.replace(/\{\/\* Floating Quick Navigation Button \*\/\}[\s\S]*?<\/motion\.div>/, newBlock);
  fs.writeFileSync('frontend/src/pages/Dashboard.jsx', code);
  console.log('Dashboard updated');
}

function updateAnalytics() {
  let code = fs.readFileSync('frontend/src/pages/Analytics.jsx', 'utf8');

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
            right: 20,
            zIndex: 1100,
            background: 'rgba(15,15,15,0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            color: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(255,255,255,0.12)',
            width: 48,
            height: 48,
            borderRadius: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <List size={20} />
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
              <div className="mobile-bottom-sheet-head" style={{ marginBottom: 20 }}>
                <h3>Navigation</h3>
                <button type="button" className="mobile-bottom-sheet-close" onClick={() => setIsNavSheetOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700, letterSpacing: 1, paddingLeft: 4 }}>ANALYTICS VIEWS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ["overview", "Overview", <BarChart2 size={18} key="ov" />],
                    ["predictor", "Predictor", <Target size={18} key="pr" />],
                    ["whatif", "What-If", <PieChart size={18} key="wi" />],
                    ["placement", "Placement", <Briefcase size={18} key="pl" />],
                  ].map(([t, l, icon]) => {
                    const isActive = tab === t;
                    return (
                    <button
                      key={t}
                      onClick={() => {
                        setTab(t);
                        setIsNavSheetOpen(false);
                      }}
                      style={{ 
                        width: '100%',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 14,
                        padding: '16px',
                        borderRadius: 16,
                        border: isActive ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.04)',
                        background: isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                        fontSize: 15,
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36, borderRadius: 10,
                        background: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                        color: isActive ? '#000' : 'var(--text)',
                      }}>
                        {icon}
                      </div>
                      {l}
                    </button>
                  )})}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>`;

  code = code.replace(/\{\/\* Floating Quick Navigation Button \*\/\}[\s\S]*?<\/motion\.div>/, newBlock);
  fs.writeFileSync('frontend/src/pages/Analytics.jsx', code);
  console.log('Analytics updated');
}

updateDashboard();
updateAnalytics();
