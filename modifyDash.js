const fs = require('fs');

function modifyDashboard() {
  let code = fs.readFileSync('frontend/src/pages/Dashboard.jsx', 'utf8');

  // Add useRef
  code = code.replace(
    'import React, { useEffect, useState } from "react";',
    'import React, { useEffect, useState, useRef } from "react";'
  );

  // Add states and intersection observer
  const stateStr = '  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);';
  const newStateStr = `  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const tabsRef = useRef(null);
  const [tabsVisible, setTabsVisible] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setTabsVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    if (tabsRef.current) observer.observe(tabsRef.current);
    return () => observer.disconnect();
  }, []);`;
  code = code.replace(stateStr, newStateStr);
  
  // Remove the old resize listener if it existed right below stateStr
  code = code.replace(/  useEffect\(\(\) => \{\n    const handleResize = \(\) => setIsMobile\(window\.innerWidth < 1024\);\n    window\.addEventListener\("resize", handleResize\);\n    return \(\) => window\.removeEventListener\("resize", handleResize\);\n  \}, \[\]\);\n\n/, '');

  // Wrap nav controls in ref
  code = code.replace(
    '{/* Navigation Controls */}\n      <div className="dashboard-nav-controls">',
    '{/* Navigation Controls */}\n      <div className="dashboard-nav-controls" ref={tabsRef}>'
  );

  const buttonCode = `
      {/* Floating Quick Navigation Button */}
      {!tabsVisible && isMobile && (
        <motion.button
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99,
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            padding: '14px 28px',
            borderRadius: 30,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Layout size={18} /> Quick Navigation
        </motion.button>
      )}
    </motion.div>
  );
}`;
  
  // Find the end of Dashboard.jsx
  // Currently ends with:
  //     </div>
  //   </motion.div>
  // );
  // }
  
  code = code.replace(/\n    <\/motion\.div>\n  \);\n}\s*$/, buttonCode);

  fs.writeFileSync('frontend/src/pages/Dashboard.jsx', code);
  console.log('Dashboard modified correctly');
}

modifyDashboard();
