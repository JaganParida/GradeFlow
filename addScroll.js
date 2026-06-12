const fs = require('fs');

function addScrollToDashboard() {
  let code = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');

  // Semester handler
  code = code.replace(
    /setSelectedSem\(r\.semester\);\s*loadSemester\(r\.semester\);\s*setIsNavSheetOpen\(false\);/g,
    "setSelectedSem(r.semester); loadSemester(r.semester); setIsNavSheetOpen(false); setTimeout(() => { if (tabsRef.current) { const y = tabsRef.current.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: y, behavior: 'smooth' }); } }, 150);"
  );

  // Tab handler
  code = code.replace(
    /setTab\(t\);\s*setIsNavSheetOpen\(false\);/g,
    "setTab(t); setIsNavSheetOpen(false); setTimeout(() => { if (tabsRef.current) { const y = tabsRef.current.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: y, behavior: 'smooth' }); } }, 150);"
  );

  fs.writeFileSync('frontend/src/pages/Dashboard.jsx', code);
  console.log('Dashboard click handlers updated');
}

function addScrollToAnalytics() {
  let code = fs.readFileSync('frontend/src/pages/Analytics.jsx', 'utf8');

  // Tab handler
  code = code.replace(
    /setTab\(t\);\s*setIsNavSheetOpen\(false\);/g,
    "setTab(t); setIsNavSheetOpen(false); setTimeout(() => { if (tabsRef.current) { const y = tabsRef.current.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: y, behavior: 'smooth' }); } }, 150);"
  );

  fs.writeFileSync('frontend/src/pages/Analytics.jsx', code);
  console.log('Analytics click handlers updated');
}

addScrollToDashboard();
addScrollToAnalytics();
