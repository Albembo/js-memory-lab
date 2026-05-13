// ==========================================
// 1. THE ARCHITECTURE: A Native-like Pager
// ==========================================
// This class simulates a paginated database result.
// Instead of forcing the user to call .nextPage() manually,
// we use a Well-Known Symbol to hook into the language's iteration protocol.
class DatabasePager {
    #pages = [
        ['User 1', 'User 2'],
        ['User 3', 'User 4'],
        ['User 5', 'User 6']
    ];

    // Symbol.asyncIterator is a special "hook" that Node.js looks for
    // when you use the "for await...of" syntax.
    async *[Symbol.asyncIterator]() {
        for (const page of this.#pages) {
            // Simulating network latency for each page fetch
            await new Promise(resolve => setTimeout(resolve, 1000));

            // "Yielding" the data makes this an Async Generator
            yield page;
        }
    }
}

// ==========================================
// 2. TEST RUNNER (The Developer Experience)
// ==========================================
const runTest = async () => {
    const pager = new DatabasePager();

    console.log('--- STARTING NATIVE ITERATION ---');
    console.time('Total Execution Time');

    // Because we implemented Symbol.asyncIterator, 
    // the object is now "natively iterable".
    // This is much cleaner than manual while-loops.
    for await (const users of pager) {
        console.log(`[BATCH LOADED] Users: ${users.join(', ')}`);
    }

    console.timeEnd('Total Execution Time');
    console.log('--- ITERATION FINISHED ---');
};

runTest();