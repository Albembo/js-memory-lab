// ==========================================
// 1. THE TARGET CLASS (With Private Fields)
// ==========================================
// A standard class representing a database connection.
// It uses modern JS private fields (#) for security.
class DatabaseConnection {
    #password = 'super-secret-db-pass';
    username = 'admin';

    // A getter that relies on the internal 'this' context
    get connectionString() {
        return `${this.username}:${this.#password}@localhost:5432`;
    }
}

const db = new DatabaseConnection();

// ==========================================
// 2. THE BROKEN PROXY (The Junior Mistake)
// ==========================================
// Wrapping the class instance directly.
const brokenProxy = new Proxy(db, {
    get(target, prop) {
        console.log(`[LOG] Intercepted read access to: '${prop}'`);

        // DANGER: Returning the property directly. 
        // If the property is a getter, 'this' will now refer to the Proxy itself,
        // and the Proxy does NOT have access to the original object's private fields.
        return target[prop];
    }
});

// ==========================================
// 3. THE FIXED PROXY (Using Reflect)
// ==========================================
// The correct architectural approach.
const safeProxy = new Proxy(db, {
    get(target, prop, receiver) {
        console.log(`[LOG] Safely intercepted read access to: '${prop}'`);

        // Reflect.get forwards the exact same operation but allows us to pass 
        // the 'receiver' (the original context), preserving the correct 'this' binding.
        return Reflect.get(target, prop, receiver);
    }
});

// ==========================================
// 4. TEST RUNNER
// ==========================================
const runTests = () => {
    console.log('\n--- TEST 1: Direct Access (No Proxy) ---');
    console.log(`Result: ${db.connectionString}`);

    console.log('\n--- TEST 2: The Broken Proxy ---');
    try {
        // This will crash! 
        // TypeError: Cannot read private member from an object whose class did not declare it
        console.log(`Result: ${brokenProxy.connectionString}`);
    } catch (err) {
        console.log(`[CRASH DETECTED] ${err.name}: ${err.message}`);
    }

    console.log('\n--- TEST 3: The Safe Proxy (Using Reflect) ---');
    // This works perfectly, because Reflect fixed the 'this' binding.
    console.log(`Result: ${safeProxy.connectionString}\n`);
};

runTests();