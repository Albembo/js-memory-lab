import { run, bench, group } from 'mitata';

async function main() {
    const SIZE = 100_000;

    // Titolo del gruppo di test
    group(`Array Creation vs Allocation (Size: ${SIZE})`, () => {

        // 1. Array letterale + push
        // Vantaggio: Nasce Packed (Veloce). Svantaggio: Resize dinamico.
        bench('[] + push', () => {
            const arr = [];
            for (let i = 0; i < SIZE; i++) {
                arr.push(i);
            }
            return arr[SIZE - 1];
        });

        // 2. Pre-allocazione (Holey)
        // Vantaggio: Niente resize. Svantaggio: Nasce "bucato" (Holey).
        bench('new Array(n) + index set', () => {
            const arr = new Array(SIZE);
            for (let i = 0; i < SIZE; i++) {
                arr[i] = i; // Riempire i buchi uno a uno
            }
            return arr[SIZE - 1];
        });

        // 3. Pre-allocazione + Fill (Packed)
        // Vantaggio: Niente resize E niente buchi iniziali.
        bench('new Array(n).fill(0)', () => {
            const arr = new Array(SIZE).fill(0);
            for (let i = 0; i < SIZE; i++) {
                arr[i] = i;
            }
            return arr[SIZE - 1];
        });

        // 4. Typed Array (Raw Memory)
        // Il riferimento teorico (dovrebbe essere il più veloce).
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