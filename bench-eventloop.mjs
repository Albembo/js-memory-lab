import http from 'http';

const ITERATIONS = 5_000_000; // 5 million is usually enough to visibly block the CPU

// --- 1. THE SERVER ---
function starveWithPromises(iterations) {
    if (iterations === 0) return Promise.resolve();
    return Promise.resolve().then(() => starveWithPromises(iterations - 1));
}

function yieldWithImmediate(iterations, callback) {
    if (iterations === 0) return callback();
    setImmediate(() => yieldWithImmediate(iterations - 1, callback));
}

const server = http.createServer((req, res) => {
    if (req.url === '/ping') {
        res.writeHead(200);
        return res.end('Pong');
    }

    if (req.url === '/promise-block') {
        starveWithPromises(ITERATIONS).then(() => {
            res.writeHead(200);
            res.end('Promise finished');
        });
        return;
    }

    if (req.url === '/immediate-yield') {
        yieldWithImmediate(ITERATIONS, () => {
            res.writeHead(200);
            res.end('setImmediate finished');
        });
        return;
    }
});

// --- 2. AUTOMATED TEST RUNNER ---
const runTest = async (route, name) => {
    return new Promise(async (resolve) => {
        console.log(`=========================================`);
        console.log(`${name}`);
        console.log(`=========================================`);

        const startTime = Date.now();
        let isDone = false;

        // Lag Monitor: expects to run every 100ms. If delayed, the thread is blocked.
        let lastTick = Date.now();
        const lagMonitor = setInterval(() => {
            if (isDone) return;
            const lag = Date.now() - lastTick - 100;
            if (lag > 50) console.log(`🚨 [LAG] Event Loop blocked for ${lag.toFixed(0)} ms!`);
            lastTick = Date.now();
        }, 100);

        // 1. Trigger the heavy computation
        console.log(`[0 ms] ⚙️  Server: Starting computation on ${route}...`);
        fetch(`http://localhost:3000${route}`).then(() => {
            isDone = true;
            console.log(`[${Date.now() - startTime} ms] ⚙️  Server: Computation finished!`);
        });

        // Wait 50ms to ensure the server is under load before sending pings
        await new Promise(r => setTimeout(r, 50));

        // 2. Send 2 Pings while the server is "busy"
        console.log(`[${Date.now() - startTime} ms] 👤 Client: Sending Ping 1...`);
        fetch('http://localhost:3000/ping').then(() => console.log(`[${Date.now() - startTime} ms] 👤 Client: Received Pong 1`));

        console.log(`[${Date.now() - startTime} ms] 👤 Client: Sending Ping 2...`);
        fetch('http://localhost:3000/ping').then(() => console.log(`[${Date.now() - startTime} ms] 👤 Client: Received Pong 2`));

        // Wait for the route to finish processing
        const checkDone = setInterval(() => {
            if (isDone) {
                clearInterval(checkDone);
                clearInterval(lagMonitor);
                resolve();
            }
        }, 100);
    });
};

// Start the server and run the test suite
server.listen(3000, async () => {
    console.log('\n🚀 STARTING EVENT LOOP BENCHMARK\n');

    // TEST 1 (Incorrect way: Microtasks)
    await runTest('/promise-block', '❌ TEST 1: The Promise Trap (Blocking)');

    console.log('\n⏳ Pausing for 2 seconds to cool down CPU...\n');
    await new Promise(r => setTimeout(r, 2000));

    // TEST 2 (Correct way: Macrotasks)
    await runTest('/immediate-yield', '✅ TEST 2: Breathing with setImmediate (Non-blocking)');

    console.log('\n🎉 Benchmarks completed! Use the output above for your screenshots.\n');
    process.exit(0);
});