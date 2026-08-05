const fs = require('fs');
const serviceCode = fs.readFileSync('./src/public/public.service.ts', 'utf8');
if (serviceCode.includes('item.product.images.length > 0')) {
  console.log('✅ Image fetch code is present in public.service.ts');
} else {
  console.log('❌ Image fetch code is NOT in public.service.ts');
}
