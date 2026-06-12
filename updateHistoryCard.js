const fs = require('fs');

function updateHistoryCard() {
  let code = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');

  const oldBlockRegex = /<motion\.div\s+key=\{r\.semester\}[\s\S]*?<\/motion\.div>/;

  const newBlock = `<motion.div
                      key={r.semester}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      onClick={() => { setSelectedSem(r.semester); loadSemester(r.semester); setTab("result"); }}
                      style={{ 
                        background: "rgba(30, 30, 30, 0.4)", 
                        border: "1px solid rgba(255,255,255,0.06)", 
                        borderRadius: 16, 
                        padding: 16, 
                        cursor: "pointer", 
                        display: "flex", 
                        flexDirection: "column",
                        gap: 16
                      }}
                      whileHover={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(35, 35, 35, 0.6)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Top Row: Info & SGPA */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          {/* Sem Icon */}
                          <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.04)" }}>
                            <span style={{ fontSize: 9, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Sem</span>
                            <span style={{ fontFamily: "Space Mono", fontSize: 18, fontWeight: 800, lineHeight: 1.1, color: "var(--text)" }}>{r.semester}</span>
                          </div>
                          
                          {/* Title & Session */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text)" }}>Semester {r.semester}</span>
                            {r.session && <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{r.session}</span>}
                          </div>
                        </div>

                        {/* SGPA */}
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>SGPA</div>
                          <div style={{ fontFamily: "Space Mono", fontWeight: 800, fontSize: 24, color: sgpaColor, lineHeight: 1 }}>{liveSGPA.toFixed(2)}</div>
                        </div>
                      </div>

                      {/* Bottom Row: Badges */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: isClear ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: isClear ? "var(--success)" : "var(--danger)", border: \`1px solid \${isClear ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}\` }}>
                          {isClear ? "✓ Clear" : "✗ Backlog"}
                        </span>
                        
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.04)" }}>
                          Credits: <strong style={{ color: "var(--text)", fontWeight: 700 }}>{creditsCleared}/{totalCredits}</strong>
                        </span>
                      </div>
                    </motion.div>`;

  code = code.replace(oldBlockRegex, newBlock);
  fs.writeFileSync('frontend/src/pages/Dashboard.jsx', code);
  console.log('History card updated');
}

updateHistoryCard();
