const fs = require('fs');

function compactDashboard() {
  let code = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');

  // Reduce gap between sections
  code = code.replace(/<div className="mobile-bottom-sheet-head" style=\{\{ marginBottom: 20 \}\}>/, '<div className="mobile-bottom-sheet-head" style={{ marginBottom: 12 }}>');
  code = code.replace(/<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(4, 1fr\)', gap: 8, marginBottom: 28 \}\}>/, '<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 16 }}>');
  
  // Make semester buttons more compact
  code = code.replace(/padding: '12px 0',/g, "padding: '10px 0',");
  
  // Make Views list more compact
  code = code.replace(/<div style=\{\{ display: 'flex', flexDirection: 'column', gap: 8 \}\}>/g, '<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>');
  
  // Update view buttons
  code = code.replace(/padding: '16px',/g, "padding: '10px 14px',");
  code = code.replace(/gap: 14,/g, "gap: 12,");
  code = code.replace(/borderRadius: 16,/g, "borderRadius: 14,");
  
  // Update icons container inside view buttons
  code = code.replace(/width: 36, height: 36, borderRadius: 10,/g, "width: 32, height: 32, borderRadius: 8,");
  
  fs.writeFileSync('frontend/src/pages/Dashboard.jsx', code);
  console.log('Dashboard compacted');
}

function compactAnalytics() {
  let code = fs.readFileSync('frontend/src/pages/Analytics.jsx', 'utf8');

  // Reduce gap between sections
  code = code.replace(/<div className="mobile-bottom-sheet-head" style=\{\{ marginBottom: 20 \}\}>/, '<div className="mobile-bottom-sheet-head" style={{ marginBottom: 16 }}>');
  
  // Make Views list more compact
  code = code.replace(/<div style=\{\{ display: 'flex', flexDirection: 'column', gap: 8 \}\}>/g, '<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>');
  
  // Update view buttons
  code = code.replace(/padding: '16px',/g, "padding: '10px 14px',");
  code = code.replace(/gap: 14,/g, "gap: 12,");
  code = code.replace(/borderRadius: 16,/g, "borderRadius: 14,");
  
  // Update icons container inside view buttons
  code = code.replace(/width: 36, height: 36, borderRadius: 10,/g, "width: 32, height: 32, borderRadius: 8,");

  fs.writeFileSync('frontend/src/pages/Analytics.jsx', code);
  console.log('Analytics compacted');
}

compactDashboard();
compactAnalytics();
