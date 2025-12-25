
const API_URL = 'http://localhost:5000/api/users/register';

async function measureLatency() {
    const ts = Date.now();
    const user = {
        name: 'Latency Test',
        username: `lat_${ts}`,
        email: `lat_${ts}@test.com`,
        mobile: '1234567890',
        password: 'Password123!',
        confirmPassword: 'Password123!'
    };

    const start = Date.now();
    try {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        const duration = Date.now() - start;
        const body = await res.json();
        console.log(`Status: ${res.status}, Duration: ${duration}ms`);
        if (duration > 2000) {
            console.log('WARNING: Response took longer than 2s');
        } else {
            console.log('SUCCESS: Response was fast');
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

measureLatency();
