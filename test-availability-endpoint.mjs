import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/delivery/availability?startDate=2026-06-25',
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Response:', data);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  process.exit(1);
});

req.end();
