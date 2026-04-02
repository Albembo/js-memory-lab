import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

const ITERATIONS = 1_000_000;

// ==========================================
// 1. WORKER THREAD LOGIC
// ==========================================
if (!isMainThread) {
    const { sharedBuffer, mode } = workerData;

    // Create an integer view over the raw shared memory buffer
    const sharedArray = new Int32Array(sharedBuffer);

    for (let i = 0; i < ITERATIONS; i++) {
        if (mode === 'unsafe') {
            // THE WRONG WAY: Classic JS addition.
            // Read, increment, and write are separate CPU instructions.
            // A Context Switch between threads here causes a Race Condition.
            sharedArray[0]++;
        } else if (mode === 'safe') {
            // THE CORRECT WAY: Atomic addition.
            // The CPU locks the memory address until the operation is 100% complete.
            Atomics.add(sharedArray, 0, 1);
        }
    }

    // Signal the Main Thread that this worker has finished its 1M iterations
    parentPort.postMessage('done');
}

// ==========================================
// 2. MAIN THREAD LOGIC (Test Runner)
// ==========================================
else {
    const runTest = (mode, name) => {
        return new Promise((resolve) => {
            console.log(`\n=========================================`);
            console.log(`${name}`);
            console.log(`=========================================`);

            // Create a 4-byte shared memory buffer (exactly enough for one 32-bit integer)
            const sharedBuffer = new SharedArrayBuffer(4);
            const sharedArray = new Int32Array(sharedBuffer);

            // Initialize our shared counter to 0
            sharedArray[0] = 0;

            let completedWorkers = 0;
            const startTime = Date.now();

            // Spawn 2 workers, passing them the EXACT SAME memory buffer
            for (let i = 0; i < 2; i++) {
                const worker = new Worker(new URL(import.meta.url), {
                    workerData: { sharedBuffer, mode }
                });

                worker.on('message', () => {
                    completedWorkers++;

                    // When BOTH workers have finished...
                    if (completedWorkers === 2) {
                        const duration = Date.now() - startTime;
                        const expected = ITERATIONS * 2;
                        const actual = sharedArray[0];
                        const lost = expected - actual;

                        console.log(`⏱️  Time taken: ${duration} ms`);
                        console.log(`🎯 Expected: ${expected}`);
                        console.log(`🛑 Actual:   ${actual}`);

                        if (lost > 0) {
                            console.log(`🚨 Race Condition detected! We lost ${lost} operations.`);
                        } else {
                            console.log(`✅ Perfect sync! No operations lost.`);
                        }
                        resolve();
                    }
                });
            }
        });
    };

    const startBenchmark = async () => {
        console.log('\n🚀 STARTING SHARED MEMORY BENCHMARK');

        // TEST 1: The Race Condition
        await runTest('unsafe', '❌ TEST 1: Unsafe Shared Memory (Race Condition)');

        // TEST 2: The Fix
        await runTest('safe', '✅ TEST 2: Safe Shared Memory (Using Atomics)');

        console.log('\n🎉 Benchmarks completed!\n');
        process.exit(0);
    };

    startBenchmark();
}