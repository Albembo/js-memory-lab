# JS Memory Lab
A playground to explore V8 memory management, array performance, and optimization techniques in Node.js.

Benchmarks included:

- **Array Allocation Strategies** — push vs `new Array` vs TypedArray (`bench-array`)
- **Element Kinds & Hidden Classes** — SMI vs Double vs Tagged arrays, Monomorphic vs Polymorphic objects (`bench-types`)
- **Garbage Collection** — Map vs WeakMap (`bench-gc`)
- **Event Loop** — Promise vs setImmediate (`bench-eventloop`)
- **Worker Threads** — CPU-bound task on Main Thread vs Worker Thread (`bench-workers`)
- **Shared Memory** — Race Condition vs Atomics (`bench-atomics`)

How to run:

```bash
npm install

# Array allocation strategies
npm run bench-array

# Element kinds & object shapes
npm run bench-types

# Garbage Collection
npm run bench-gc

# Event Loop
npm run bench-eventloop

# Worker Threads
npm run bench-workers

# Shared Memory
npm run bench-atomics
```
