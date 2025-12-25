
const bcrypt = require('bcryptjs');

async function bench() {
    console.log('Starting bcryptjs benchmark...');
    const start = Date.now();
    await bcrypt.hash('testpassword', 10);
    const end = Date.now();
    console.log(`Time for cost 10: ${end - start}ms`);

    const start8 = Date.now();
    await bcrypt.hash('testpassword', 8);
    const end8 = Date.now();
    console.log(`Time for cost 8: ${end8 - start8}ms`);
}

bench();
