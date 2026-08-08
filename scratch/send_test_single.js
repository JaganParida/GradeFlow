async function sendTest() {
  const regNo = '230301120327';
  console.log(`Sending email for ${regNo}...`);
  try {
    const response = await fetch('https://grade-flow-navy.vercel.app/api/send-backlog-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regNo })
    });
    const data = await response.json();
    console.log('Result:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

sendTest();
