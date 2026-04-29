// ==========================================
// 1. TARGET FUNCTION (Business Logic)
// ==========================================
// This function represents a heavy operation (e.g., a slow DB query).
// It is completely unaware of the caching layer.
const fetchUserProfile = async (userId) => {
    console.log(`[DB] Executing complex query for User ${userId}...`);
    
    // Simulating a 2-second database latency
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return { id: userId, username: 'Nicola', tier: 'Pro' };
};

// ==========================================
// 2. CACHE INFRASTRUCTURE
// ==========================================
const cache = new Map();
const TTL_MS = 3000; // Time-To-Live: 3 seconds

// ==========================================
// 3. THE PROXY (Decorator Pattern)
// ==========================================
const memoizedFetch = new Proxy(fetchUserProfile, {
    
    // Intercepting the function execution (the 'apply' trap)
    apply(target, thisArg, args) {
        const cacheKey = JSON.stringify(args);
        const now = Date.now();

        // CACHE CHECK
        if (cache.has(cacheKey)) {
            const { value, expiry } = cache.get(cacheKey);
            
            if (now < expiry) {
                console.log(`[CACHE HIT] Data retrieved instantly for User ${args}`);
                return value; // Return cached data, bypassing the real function
            } else {
                console.log(`[CACHE EXPIRED] Stale data for User ${args}. Evicting.`);
                cache.delete(cacheKey);
            }
        }

        // CACHE MISS: Execute the real function
        const promiseResult = target.apply(thisArg, args);
        
        // Store the promise in the cache with its expiration timestamp
        cache.set(cacheKey, { value: promiseResult, expiry: now + TTL_MS });
        
        return promiseResult;
    }
});

// ==========================================
// 4. TEST RUNNER
// ==========================================
const runTests = async () => {
    console.log('\n--- TEST 1: Initial Call (Expected Cache Miss) ---');
    console.time('Test 1 Duration');
    await memoizedFetch(42); 
    console.timeEnd('Test 1 Duration'); // Expected: ~2000ms

    console.log('\n--- TEST 2: Immediate Call (Expected Cache Hit) ---');
    console.time('Test 2 Duration');
    await memoizedFetch(42); 
    console.timeEnd('Test 2 Duration'); // Expected: ~0.1ms

    console.log('\n--- TEST 3: Waiting for TTL expiration (3.5s) ---');
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    console.log('\n--- TEST 4: Call after expiration (Expected Cache Miss) ---');
    console.time('Test 4 Duration');
    await memoizedFetch(42);
    console.timeEnd('Test 4 Duration'); // Expected: ~2000ms
};

runTests();