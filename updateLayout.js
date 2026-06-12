const fs = require('fs');

function applyStyles() {
  let indexCss = fs.readFileSync('frontend/src/index.css', 'utf8');

  // 1. Force two tabs per row
  indexCss = indexCss.replace(
    /flex: 1 1 auto;(\r?\n)\s*padding: 10px 12px;/,
    "flex: 0 0 calc(50% - 3px);$1    padding: 10px 12px;"
  );

  // 2. Add history cards grid if not present
  if (!indexCss.includes('.history-cards-grid')) {
    indexCss += `\n
/* ── Semester History Grid ───────────────────────────────────── */
.history-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

@media (min-width: 768px) {
  .history-cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .history-cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
`;
  }
  
  fs.writeFileSync('frontend/src/index.css', indexCss);
  console.log('index.css updated');

  let dashboard = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');
  dashboard = dashboard.replace(
    /<div style=\{\{\s*display:\s*["']flex["'],\s*flexDirection:\s*["']column["'],\s*gap:\s*10\s*\}\}>([\s\S]*?\{results\.map\()/g,
    '<div className="history-cards-grid">$1'
  );
  fs.writeFileSync('frontend/src/pages/Dashboard.jsx', dashboard);
  console.log('Dashboard updated');
}

applyStyles();
