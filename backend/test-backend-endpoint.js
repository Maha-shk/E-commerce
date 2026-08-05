const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/public/orders/ORD-2026-8715',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('Full API Response:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('\nImage URLs returned:');
      result.data.items.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name}: ${item.image}`);
      });
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
