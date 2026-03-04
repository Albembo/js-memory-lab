// Run this script using: node --expose-gc bench-gc.mjs
// If you don't use --expose-gc, global.gc() will throw an error.

// Utility function to format bytes into Megabytes for readability
const toMB = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

// Utility function to print current Heap usage
const printMemory = (label) => {
    const memory = process.memoryUsage();
    console.log(`${label.padEnd(35)}: ${toMB(memory.heapUsed)}`);
};

// Create a massive object to simulate a heavy payload (e.g., cached database rows)
const createHeavyData = () => {
    const data = new Array(1_000_000);
    for (let i = 0; i < data.length; i++) {
        data[i] = { id: i, val: Math.random() };
    }
    return data;
};

async function main() {
    console.log('\n--- V8 GARBAGE COLLECTION LAB: Map vs WeakMap ---\n');

    // Force an initial GC run to get a clean baseline
    global.gc();
    printMemory('1. Initial Baseline');

    // ==========================================
    // TEST A: The Memory Leak (Using standard Map)
    // ==========================================
    let standardMap = new Map();
    let objKey1 = { id: 1 }; // The reference key

    standardMap.set(objKey1, createHeavyData());
    printMemory('2. After Map allocation');

    // We "delete" the original reference to the key, simulating a user disconnecting
    // or a component unmounting.
    objKey1 = null;

    // Force Garbage Collection
    global.gc();
    printMemory('3. After Map GC (Memory Leak!)');

    // Clear the map manually to reset for the next test
    standardMap.clear();
    standardMap = null;
    global.gc();
    console.log('\n-------------------------------------------------\n');

    // ==========================================
    // TEST B: The GC Hero (Using WeakMap)
    // ==========================================
    let weakMap = new WeakMap();
    let objKey2 = { id: 2 }; // The reference key

    weakMap.set(objKey2, createHeavyData());
    printMemory('4. After WeakMap allocation');

    // We remove the original reference again
    objKey2 = null;

    // Force Garbage Collection. 
    // Since WeakMap doesn't prevent GC, V8 will sweep the heavy data. 
    global.gc();
    printMemory('5. After WeakMap GC (Memory Cleared!)');

    console.log('\nDone.\n');
}

main();