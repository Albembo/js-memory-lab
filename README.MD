# JS Memory Lab
A playground to explore V8 memory management, array performance, and optimization techniques in Node.js.

Benchmarks included:

- **Array Allocation Strategies** — push vs `new Array` vs TypedArray (`bench-array`)
- **Element Kinds & Hidden Classes** — SMI vs Double vs Tagged arrays, Monomorphic vs Polymorphic objects (`bench-types`)
- **Garbage Collection** — Map vs WeakMap (`bench-gc`)
- **Event Loop** — Promise vs setImmediate (`bench-eventloop`)
- **Worker Threads** — CPU-bound task on Main Thread vs Worker Thread (`bench-workers`)
- **Shared Memory** — Race Condition vs Atomics (`bench-atomics`)
- **Proxy Cache** — Using Map to cache the result of a proxy (`proxy-cache.mjs`)
- **Proxies & Private Fields** — Proxies and the pitfalls of private fields (`proxy-reflect.mjs`)
- **Proxy Symbols** — Using Well-Known Symbols to hook into the language's iteration protocol (`proxy-symbols.mjs`)

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

# Proxies & Private Fields
npm run proxy-reflect

# Proxy Cache
npm run proxy-cache

# Proxy Symbols
npm run proxy-symbols
```
