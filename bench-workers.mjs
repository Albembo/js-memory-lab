import http from 'http';
import { Worker, isMainThread, parentPort } from 'worker_threads';

// Brutal CPU-bound computation: a synchronous loop with billions of iterations
const RUN_HEAVY_COMPUTATION = () => {
    let count = 0;
    for (let i = 0; i < 4_000_000_000; i++) {
        count++;
    }
    return count;
};

// ==========================================
// 1. WORKER THREAD LOGIC (Separate V8 Isolate)
// ==========================================
if (!isMainThread) {
    // This block is executed ONLY when Node.js spawns a new Worker.
    // The Worker has its own isolated Event Loop, so it doesn't block the Main Thread.
    const result = RUN_HEAVY_COMPUTATION();

    // Send the result back to the Main Thread (Node.js clones the data)
    parentPort.postMessage(result);
}

// ==========================================
// 2. MAIN THREAD LOGIC (Server + Test Runner)
// ==========================================
else {
    const server = http.createServer((req, res) => {
        if (req.url === '/ping') {
            res.writeHead(200);
            return res.end('Pong');
        }

        if (req.url === '/block-main') {
            // THE WRONG WAY: Computation executed directly on the Main Thread
            const result = RUN_HEAVY_COMPUTATION();
            res.writeHead(200);
            return res.end(`Finished on Main Thread: ${result}`);
        }

        if (req.url === '/use-worker') {
            // THE CORRECT WAY: Delegate the heavy lifting to a Worker Thread.
            // We pass import.meta.url to tell the new Worker to execute this 
            // exact same file, but this time it will enter the "if (!isMainThread)" block.
            const worker = new Worker(new URL(import.meta.url));

            worker.on('message', (result) => {
                res.writeHead(200);
                res.end(`Finished on Worker Thread: ${result}`);
            });

            worker.on('error', (err) => {
                res.writeHead(500);
                res.end(`Worker Error: ${err.message}`);
            });
            return;
        }
    });

    // --- AUTOMATED TEST RUNNER ---
    const runTest = async (route, name) => {
        return new Promise(async (resolve) => {
            console.log(`\n=========================================`);
            console.log(`${name}`);
            console.log(`=========================================`);

            const startTime = Date.now();
            let isDone = false;

            // Lag Monitor (If this triggers, the Main Thread is suffering Starvation)
            let lastTick = Date.now();
            const lagMonitor = setInterval(() => {
                if (isDone) return;
                const lag = Date.now() - lastTick - 100;
                if (lag > 50) console.log(`🚨 [LAG] Main Thread blocked for ${lag.toFixed(0)} ms!`);
                lastTick = Date.now();
            }, 100);

            // 1. Trigger the heavy computation request
            console.log(`[0 ms] ⚙️  Server: Requesting ${route}...`);
            fetch(`http://localhost:3000${route}`).then(() => {
                isDone = true;
                console.log(`[${Date.now() - startTime} ms] ⚙️  Server: Computation completed!`);
            });

            // Wait 50ms to ensure the server is under load before testing responsiveness
            await new Promise(r => setTimeout(r, 50));

            // 2. Fire simple Pings while the server is processing the heavy route
            console.log(`[${Date.now() - startTime} ms] 👤 Client: Sending Ping 1...`);
            fetch('http://localhost:3000/ping').then(() => console.log(`[${Date.now() - startTime} ms] 👤 Client: Received Pong 1`));

            console.log(`[${Date.now() - startTime} ms] 👤 Client: Sending Ping 2...`);
            fetch('http://localhost:3000/ping').then(() => console.log(`[${Date.now() - startTime} ms] 👤 Client: Received Pong 2`));

            // Polling to check when the route is fully resolved
            const checkDone = setInterval(() => {
                if (isDone) {
                    clearInterval(checkDone);
                    clearInterval(lagMonitor);
                    resolve();
                }
            }, 100);
        });
    };

    server.listen(3000, async () => {
        console.log('\n🚀 STARTING WORKER THREADS BENCHMARK');

        // TEST 1: Blocked Main Thread
        await runTest('/block-main', '❌ TEST 1: CPU Starvation on Main Thread');

        console.log('\n⏳ Pausing for 2 seconds to cool down CPU...');
        await new Promise(r => setTimeout(r, 2000));

        // TEST 2: Using the Worker Thread
        await runTest('/use-worker', '✅ TEST 2: CPU Delegation to Worker Thread');

        console.log('\n🎉 Benchmarks completed! Server is shutting down.\n');
        process.exit(0);
    });
}