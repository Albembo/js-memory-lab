import { run, bench, group } from 'mitata';

async function main() {
    const SIZE = 10_000; // Keep it lower to highlight the access cost rather than iteration cost

    // 1. Monomorphic: All identical, created in the exact same order
    const monoArray = [];
    for (let i = 0; i < SIZE; i++) {
        monoArray.push({ a: i, b: i * 2 });
    }

    // 2. Polymorphic: Same data, but different property creation order
    const polyArray = [];
    for (let i = 0; i < SIZE; i++) {
        if (i % 2 === 0) {
            polyArray.push({ a: i, b: i * 2 }); // Shape A
        } else {
            polyArray.push({ b: i * 2, a: i }); // Shape B
        }
    }

    /** BENCHMARKS */
    group('Part 1: Array Element Kinds (The cost of "dirty types")', () => {

        // Case A: Array of pure Integers (PACKED_SMI_ELEMENTS)
        const arrSmi = new Array(SIZE).fill(0).map((_, i) => i);

        // Case B: Array of Integers + 1 Double (Forces transition to PACKED_DOUBLE_ELEMENTS)
        const arrDouble = new Array(SIZE).fill(0).map((_, i) => i);
        arrDouble[SIZE - 1] = 0.5; // <--- The party pooper

        // Case C: Array of Integers + 1 String (Forces transition to PACKED_ELEMENTS / Generic)
        const arrTagged = new Array(SIZE).fill(0).map((_, i) => i);
        arrTagged[SIZE - 1] = "I am slow"; // <--- The disaster

        bench('Read Packed SMI (Integers only)', () => {
            let sum = 0;
            for (let i = 0; i < SIZE; i++) sum += arrSmi[i]; // Fast direct access
            return sum;
        });

        bench('Read Packed DOUBLE (With 1 decimal)', () => {
            let sum = 0;
            for (let i = 0; i < SIZE; i++) sum += arrDouble[i]; // Fast (modern CPUs handle floats very well)
            return sum;
        });

        bench('Read Packed ELEMENTS (With 1 string)', () => {
            let sum = 0;
            // Here V8 has to do a type check and unboxing on EVERY element
            for (let i = 0; i < SIZE; i++) {
                // Forcing a math operation to highlight the type checking overhead
                const val = typeof arrTagged[i] === 'number' ? arrTagged[i] : 0;
                sum += val;
            }
            return sum;
        });
    });

    group('Part 2: Object Shapes (Monomorphic vs Polymorphic)', () => {

        bench('Read Monomorphic {a, b}', () => {
            let sum = 0;
            for (let i = 0; i < SIZE; i++) {
                sum += monoArray[i].a; // Direct access (Fixed offset in memory)
            }
            return sum;
        });

        bench('Read Polymorphic {a, b} vs {b, a}', () => {
            let sum = 0;
            for (let i = 0; i < SIZE; i++) {
                sum += polyArray[i].a; // V8 has to check the Hidden Class (Shape) every time
            }
            return sum;
        });

    });

    await run();
}

main();