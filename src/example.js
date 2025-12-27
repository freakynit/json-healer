import JsonHealer from './index.js';

// Refer test-cases.js for full suite of examples/test-cases.

// Example 1: Missing closing bracket
const example1 = '{"name": "Alice", "age": 30';
console.log('Example 1:', JsonHealer.heal(example1));
// Output: {"name": "Alice", "age": 30}

// Example 2: Markdown wrapped
const example2 = `\`\`\`json
{"name": "Bob"}
\`\`\``;
console.log('Example 2:', JsonHealer.heal(example2));
// Output: {"name": "Bob"}

// Example 3: Mixed text
const example3 = `Here's the data you requested:
{"name": "Charlie", "age": 25}`;
console.log('Example 3:', JsonHealer.heal(example3));
// Output: {"name": "Charlie", "age": 25}

// Example 4: Trailing comma
const example4 = '{"name": "David", "age": 35,}';
console.log('Example 4:', JsonHealer.heal(example4));
// Output: {"name": "David", "age": 35}

// Example 5: Unquoted keys
const example5 = '{name: "Eve", age: 40}';
console.log('Example 5:', JsonHealer.heal(example5));
// Output: {"name": "Eve", "age": 40}

// Example 6: Custom strategy
JsonHealer.registerStrategy('removeEmojis', function(input) {
  return input.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
}, 0); // Priority 0 means it runs first

const example7 = '😀{"name": "Frank"}😀';
console.log('Example 7:', JsonHealer.heal(example7));
// Output: {"name": "Frank"}
