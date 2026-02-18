import { run, bench, group } from 'mitata';

async function main() {
    const SIZE = 100_000;

    // Benchmark Group: Compare different allocation strategies
    group(`Array Creation vs Allocation (Size: ${SIZE})`, () => {

        // 1. Literal Array + push
        // Pros: Born as "Packed" (V8 friendly). Cons: Dynamic resizing overhead.
        bench('[] + push', () => {
            const arr = [];
            for (let i = 0; i < SIZE; i++) {
                arr.push(i);
            }
            return arr[SIZE - 1];
        });

        // 2. Pre-allocation (Holey)
        // Pros: No resizing. Cons: Born "Holey" (sparse), slower access initially.
        bench('new Array(n) + index set', () => {
            const arr = new Array(SIZE);
            for (let i = 0; i < SIZE; i++) {
                arr[i] = i; // Filling the holes one by one
            }
            return arr[SIZE - 1];
        });

        // 3. Pre-allocation + Fill (Packed)
        // Pros: No resizing AND no holes (V8 treats it as Packed immediately).
        bench('new Array(n).fill(0)', () => {
            const arr = new Array(SIZE).fill(0);
            for (let i = 0; i < SIZE; i++) {
                arr[i] = i;
            }
            return arr[SIZE - 1];
        });

        // 4. Typed Array (Raw Binary Data)
        // Theoretical baseline: Contiguous memory, no boxing overhead.
        bench('Int32Array', () => {
            const arr = new Int32Array(SIZE);
            for (let i = 0; i < SIZE; i++) {
                arr[i] = i;
            }
            return arr[SIZE - 1];
        });

    });

    await run();
}

main();