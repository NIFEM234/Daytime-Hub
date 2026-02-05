import http from 'node:http';

const data = JSON.stringify({
  fullName: 'E2E Test User',
  email: 'e2e.test@example.com',
  address: '2 Integration Road',
  postcode: 'IT2 2ST',
  phone: '07123456789',
  emergencyName: 'Tester Contact',
  emergencyPhone: '07987654321',
  role: 'Volunteer',
  availability: 'Weekends',
  consent: true
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/apply',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'x-forwarded-proto': 'https'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.setEncoding('utf8');
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers));
    try { console.log('Body:', JSON.parse(body)); } catch (e) { console.log('Body:', body); }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
  if (e && e.code) console.error('Error code:', e.code);
});

req.write(data);
req.end();
