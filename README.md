# json-healer

A robust JSON repair utility for malformed JSON strings. Handles common issues from LLMs, copy-paste errors, Python-to-JSON conversions, and various format inconsistencies.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Installation](#installation)
- [Features](#features)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [heal(input, options)](#healinput-options)
  - [parse(input, options)](#parseinput-options)
  - [isValidJSON(str)](#isvalidjsonstr)
  - [registerStrategy(name, strategy, priority)](#registerstrategyname-strategy-priority)
  - [removeStrategy(name)](#removestrategyname)
- [Built-in Healing Strategies](#built-in-healing-strategies)
- [Custom Strategies](#custom-strategies)
- [Examples](#examples)
- [Performance](#performance)
- [Contributing](#contributing)
- [License](#license)

## Installation

```bash
npm install @freakynit/json-healer
```

Or with yarn:

```bash
yarn add @freakynit/json-healer
```

## Features

- **Markdown Extraction**: Extracts JSON from markdown code blocks (common in LLM responses)
- **Mixed Text Extraction**: Isolates JSON from surrounding explanatory text
- **Comment Removal**: Strips JavaScript/JSONC style comments (`//` and `/* */`)
- **Python Literal Conversion**: Converts `True`, `False`, `None` to JSON equivalents
- **Quote Normalization**: Converts single quotes to double quotes intelligently
- **Control Character Escaping**: Properly escapes unescaped control characters in strings
- **Unquoted Key Fixing**: Adds quotes to unquoted object keys
- **Trailing/Leading Comma Removal**: Cleans up extra commas
- **Missing Comma Insertion**: Detects and adds missing commas between elements
- **Bracket Balancing**: Automatically closes unclosed brackets and braces
- **Broken String Recovery**: Closes unclosed string literals
- **Extensible**: Register custom healing strategies with priority control

## Quick Start

```javascript
import JsonHealer from '@freakynit/json-healer';

// Heal malformed JSON and get the fixed string
const healed = JsonHealer.heal('{name: "John", active: True,}');
console.log(healed); // '{"name": "John", "active": true}'

// Parse directly to object (returns null if unrepairable)
const obj = JsonHealer.parse('{name: "John", active: True,}');
console.log(obj); // { name: 'John', active: true }
```

## API Reference

### heal(input, options)

Attempts to repair malformed JSON and returns the healed string.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | The malformed JSON string to heal |
| `options` | `object` | Optional configuration object |
| `options.aggressive` | `boolean` | If `true` (default), uses aggressive repair as fallback |

**Returns:** `string` - The healed JSON string, or the best effort result if unrepairable.

```javascript
const result = JsonHealer.heal('{"items": [1, 2, 3', { aggressive: true });
// Returns: '{"items": [1, 2, 3]}'
```

### parse(input, options)

Heals the input and parses it to a JavaScript object.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `input` | `string` | The malformed JSON string to heal and parse |
| `options` | `object` | Optional configuration (same as `heal()`) |

**Returns:** `any` - The parsed JavaScript object, or `null` if parsing fails.

```javascript
const data = JsonHealer.parse("{'name': 'Alice', 'score': None}");
// Returns: { name: 'Alice', score: null }
```

### isValidJSON(str)

Checks if a string is valid JSON.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `str` | `string` | The string to validate |

**Returns:** `boolean` - `true` if valid JSON, `false` otherwise.

```javascript
JsonHealer.isValidJSON('{"valid": true}');  // true
JsonHealer.isValidJSON('{invalid: true}');  // false
```

### registerStrategy(name, strategy, priority)

Registers a custom healing strategy.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Unique name for the strategy |
| `strategy` | `function` | Function that receives input string and returns healed string |
| `priority` | `number` | Optional index position (lower = runs earlier) |

```javascript
JsonHealer.registerStrategy('fixArrows', (input) => {
  return input.replace(/=>/g, ':');
}, 5);
```

### removeStrategy(name)

Removes a registered strategy.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Name of the strategy to remove |

```javascript
JsonHealer.removeStrategy('fixArrows');
```

## Built-in Healing Strategies

The following strategies are applied in order until valid JSON is produced:

| Strategy | Description |
|----------|-------------|
| `extractFromMarkdown` | Extracts JSON from markdown code blocks |
| `extractFromMixedText` | Extracts JSON object/array from surrounding text |
| `removeComments` | Removes `//` and `/* */` style comments |
| `fixPythonLiterals` | Converts `True`, `False`, `None`, `undefined`, `NaN`, `Infinity` |
| `fixSingleQuotes` | Converts single quotes to double quotes |
| `escapeControlCharacters` | Escapes unescaped control characters in strings |
| `fixUnquotedKeys` | Adds quotes to unquoted object keys |
| `fixMissingColons` | Adds missing colons between keys and values |
| `fixTrailingCommas` | Removes trailing commas before `]` or `}` |
| `fixLeadingCommas` | Removes leading commas after `[` or `{` |
| `fixMultipleCommas` | Reduces multiple consecutive commas to one |
| `closeBrokenStrings` | Closes unclosed string literals |
| `fixMissingCommas` | Adds missing commas between elements |
| `balanceBrackets` | Adds missing closing brackets/braces |

## Custom Strategies

You can extend the healer with custom strategies:

```javascript
import JsonHealer from '@freakynit/json-healer';

// Add a strategy to fix custom syntax
JsonHealer.registerStrategy('fixCustomSyntax', (input) => {
  // Your custom transformation logic
  return input.replace(/\|>/g, ':');
}, 0); // Priority 0 = runs first

// Later, remove if needed
JsonHealer.removeStrategy('fixCustomSyntax');
```

**Strategy Function Requirements:**

- Receives a single string parameter (the current JSON string)
- Must return a string (the transformed result)
- Should not throw errors (wrap risky operations in try/catch)
- Should be idempotent when possible

## Examples

### LLM Response Extraction

```javascript
const llmResponse = `
Here's the JSON you requested:

\`\`\`json
{
  name: "John Doe",
  age: 30,
  active: True,
}
\`\`\`

Let me know if you need anything else!
`;

const data = JsonHealer.parse(llmResponse);
// { name: 'John Doe', age: 30, active: true }
```

### Python Dictionary Conversion

```javascript
const pythonDict = "{'users': [{'name': 'Alice', 'active': True}, {'name': 'Bob', 'active': False}], 'count': None}";

const data = JsonHealer.parse(pythonDict);
// { users: [{ name: 'Alice', active: true }, { name: 'Bob', active: false }], count: null }
```

### Truncated JSON Recovery

```javascript
const truncated = '{"items": [{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"';

const data = JsonHealer.parse(truncated);
// { items: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }] }
```

### JSONC (JSON with Comments)

```javascript
const jsonc = `{
  // Database configuration
  "host": "localhost",
  "port": 5432, /* default PostgreSQL port */
  "database": "myapp",
}`;

const data = JsonHealer.parse(jsonc);
// { host: 'localhost', port: 5432, database: 'myapp' }
```

### Missing Commas

```javascript
const messy = '[1 2 3 {"a": 1} {"b": 2} "hello" "world"]';

const data = JsonHealer.parse(messy);
// [1, 2, 3, { a: 1 }, { b: 2 }, 'hello', 'world']
```

### Unquoted Keys

```javascript
const unquoted = '{firstName: "John", lastName: "Doe", age: 30}';

const data = JsonHealer.parse(unquoted);
// { firstName: 'John', lastName: 'Doe', age: 30 }
```

## Performance

JsonHealer is optimized for common cases:

| Scenario | Operations/sec | Avg Time |
|----------|---------------|----------|
| Valid JSON (passthrough) | ~3,000,000 | ~0.0003ms |
| Simple repairs | ~22,000 | ~0.045ms |
| Complex repairs | ~5,000 | ~0.2ms |
| Large inputs (100 items) | ~30 | ~33ms |

**Note:** Valid JSON is detected early and returned immediately without applying any transformations.

## Project Structure

```
json-healer/
├── src/
│   ├── index.js        # Core JsonHealer class
│   ├── test-cases.js   # Comprehensive test suite
│   └── example.js      # Usage examples
├── LICENSE
├── package.json
└── README.md
```

## Running Tests

```bash
node src/test-cases.js
```

## Running Examples

```bash
node src/example.js
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Guidelines

- Add tests for new features
- Ensure all existing tests pass
- Follow the existing code style
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [npm Package](https://www.npmjs.com/package/@freakynit/json-healer)
- [GitHub Repository](https://github.com/freakynit/json-healer)
- [Issue Tracker](https://github.com/freakynit/json-healer/issues)

## Author

[freakynit](https://github.com/freakynit)
