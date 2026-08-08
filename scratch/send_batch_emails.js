const regNos = [
  '230301120484',
  '230301120342'
];

async function sendAll() {
  const results = [];
  for (const regNo of regNos) {
    try {
      console.log(`Sending email for ${regNo}...`);
      const response = await fetch('https://grade-flow-navy.vercel.app/api/send-backlog-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regNo })
      });
      const data = await response.json();
      console.log(`Response for ${regNo}:`, data);
      results.push({ regNo, status: response.ok ? 'SUCCESS' : 'FAILED', data });
    } catch (err) {
      console.error(`Failed for ${regNo}:`, err.message);
      results.push({ regNo, status: 'FAILED', error: err.message });
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  console.log('--- FINAL RESULTS ---');
  console.log(JSON.stringify(results, null, 2));
}

sendAll();
