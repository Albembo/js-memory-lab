# JS Memory Lab
A playground to explore V8 memory management, array performance, and optimization techniques in Node.js.

Benchmarks included:

- **Array Allocation Strategies** — push vs `new Array` vs TypedArray (`bench-array`)
- **Element Kinds & Hidden Classes** — SMI vs Double vs Tagged arrays, Monomorphic vs Polymorphic objects (`bench-types`)

How to run:

```bash
npm install

# Array allocation strategies
npm run bench-array

# Element kinds & object shapes
npm run bench-types
```
