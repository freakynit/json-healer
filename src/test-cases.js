import JsonHealer from './index.js';

/**
 * Comprehensive test suite for JsonHealer
 */

// ==================== TEST CONFIGURATION ====================

const testSuites = {
  // ==================== BASIC FUNCTIONALITY ====================
  'Basic Functionality': [
    {
      name: 'Valid JSON object - unchanged',
      input: '{"name": "Alice", "age": 30}',
      expected: '{"name": "Alice", "age": 30}',
      shouldParse: true
    },
    {
      name: 'Valid JSON array - unchanged',
      input: '[1, 2, 3, "test"]',
      expected: '[1, 2, 3, "test"]',
      shouldParse: true
    },
    {
      name: 'Empty object',
      input: '{}',
      expected: '{}',
      shouldParse: true
    },
    {
      name: 'Empty array',
      input: '[]',
      expected: '[]',
      shouldParse: true
    },
    {
      name: 'Null input',
      input: null,
      expected: null,
      shouldParse: false,
      skipValidation: true
    },
    {
      name: 'Empty string',
      input: '',
      expected: '',
      shouldParse: false,
      skipValidation: true
    },
    {
      name: 'Whitespace only',
      input: '   \n\t  ',
      shouldParse: false,
      skipValidation: true
    }
  ],

  // ==================== BRACKET BALANCING ====================
  'Bracket Balancing': [
    {
      name: 'Missing closing brace',
      input: '{"name": "Alice", "age": 30',
      shouldParse: true,
      expectedValue: { name: 'Alice', age: 30 }
    },
    {
      name: 'Missing multiple closing braces',
      input: '{"user": {"name": "Bob", "details": {"age": 25',
      shouldParse: true
    },
    {
      name: 'Missing closing bracket in array',
      input: '[1, 2, 3, 4, 5',
      shouldParse: true,
      expectedValue: [1, 2, 3, 4, 5]
    },
    {
      name: 'Missing multiple closing brackets',
      input: '[[1, 2], [3, 4',
      shouldParse: true
    },
    {
      name: 'Mixed missing brackets',
      input: '{"items": [1, 2, 3',
      shouldParse: true
    },
    {
      name: 'Extra closing brace',
      input: '{"name": "Test"}}',
      shouldParse: true
    },
    {
      name: 'Extra closing bracket',
      input: '[1, 2, 3]]',
      shouldParse: true
    },
    {
      name: 'Deeply nested missing brackets',
      input: '{"a": {"b": {"c": {"d": [1, 2, 3',
      shouldParse: true
    }
  ],

  // ==================== TRAILING COMMAS ====================
  'Trailing Commas': [
    {
      name: 'Single trailing comma in object',
      input: '{"name": "David", "age": 35,}',
      shouldParse: true,
      expectedValue: { name: 'David', age: 35 }
    },
    {
      name: 'Single trailing comma in array',
      input: '[1, 2, 3,]',
      shouldParse: true,
      expectedValue: [1, 2, 3]
    },
    {
      name: 'Multiple trailing commas',
      input: '{"a": 1,, }',
      shouldParse: true
    },
    {
      name: 'Trailing comma in nested object',
      input: '{"user": {"name": "Test",}, "active": true}',
      shouldParse: true
    },
    {
      name: 'Trailing comma in nested array',
      input: '{"items": [1, 2, 3,]}',
      shouldParse: true
    },
    {
      name: 'Trailing comma with whitespace',
      input: '{"name": "Test"  ,  \n  }',
      shouldParse: true
    }
  ],

  // ==================== LEADING COMMAS ====================
  'Leading Commas': [
    {
      name: 'Leading comma in object',
      input: '{, "name": "Test"}',
      shouldParse: true
    },
    {
      name: 'Leading comma in array',
      input: '[, 1, 2, 3]',
      shouldParse: true
    },
    {
      name: 'Leading comma after bracket with whitespace',
      input: '{  ,  "name": "Test"}',
      shouldParse: true
    }
  ],

  // ==================== UNQUOTED KEYS ====================
  'Unquoted Keys': [
    {
      name: 'Simple unquoted key',
      input: '{name: "Eve"}',
      shouldParse: true,
      expectedValue: { name: 'Eve' }
    },
    {
      name: 'Multiple unquoted keys',
      input: '{name: "Eve", age: 40, active: true}',
      shouldParse: true,
      expectedValue: { name: 'Eve', age: 40, active: true }
    },
    {
      name: 'Unquoted key with underscore',
      input: '{first_name: "John", last_name: "Doe"}',
      shouldParse: true
    },
    {
      name: 'Unquoted key with dollar sign',
      input: '{$id: 123, $type: "user"}',
      shouldParse: true
    },
    {
      name: 'Nested unquoted keys',
      input: '{user: {name: "Test", details: {age: 25}}}',
      shouldParse: true
    },
    {
      name: 'Mixed quoted and unquoted keys',
      input: '{"name": "Test", age: 30, "active": true}',
      shouldParse: true
    },
    {
      name: 'Unquoted key with camelCase',
      input: '{firstName: "John", lastName: "Doe"}',
      shouldParse: true
    }
  ],

  // ==================== SINGLE QUOTES ====================
  'Single Quotes': [
    {
      name: 'Single quoted strings',
      input: "{'name': 'Frank', 'age': 45}",
      shouldParse: true,
      expectedValue: { name: 'Frank', age: 45 }
    },
    {
      name: 'Single quoted array',
      input: "['a', 'b', 'c']",
      shouldParse: true,
      expectedValue: ['a', 'b', 'c']
    },
    {
      name: 'Nested single quotes',
      input: "{'user': {'name': 'Test'}}",
      shouldParse: true
    },
    {
      name: 'Single quote with embedded double quote',
      input: `{'message': 'He said "hello"'}`,
      shouldParse: true
    },
    {
      name: 'Mixed quotes (more singles)',
      input: `{'name': 'Test', "age": 30}`,
      shouldParse: true
    }
  ],

  // ==================== PYTHON LITERALS ====================
  'Python Literals': [
    {
      name: 'Python True',
      input: '{"active": True}',
      shouldParse: true,
      expectedValue: { active: true }
    },
    {
      name: 'Python False',
      input: '{"active": False}',
      shouldParse: true,
      expectedValue: { active: false }
    },
    {
      name: 'Python None',
      input: '{"value": None}',
      shouldParse: true,
      expectedValue: { value: null }
    },
    {
      name: 'All Python literals',
      input: '{"a": True, "b": False, "c": None}',
      shouldParse: true,
      expectedValue: { a: true, b: false, c: null }
    },
    {
      name: 'Python literals in array',
      input: '[True, False, None, 1, 2]',
      shouldParse: true,
      expectedValue: [true, false, null, 1, 2]
    },
    {
      name: 'Python True in string should not change',
      input: '{"message": "True story"}',
      shouldParse: true,
      expectedValue: { message: 'True story' }
    },
    {
      name: 'JavaScript undefined',
      input: '{"value": undefined}',
      shouldParse: true,
      expectedValue: { value: null }
    },
    {
      name: 'JavaScript NaN',
      input: '{"value": NaN}',
      shouldParse: true,
      expectedValue: { value: null }
    },
    {
      name: 'JavaScript Infinity',
      input: '{"value": Infinity}',
      shouldParse: true,
      expectedValue: { value: null }
    }
  ],

  // ==================== COMMENTS ====================
  'Comments': [
    {
      name: 'Single-line comment at end',
      input: '{"name": "Test"} // This is a comment',
      shouldParse: true
    },
    {
      name: 'Single-line comment between properties',
      input: '{"name": "Test", // comment\n"age": 30}',
      shouldParse: true
    },
    {
      name: 'Multi-line comment',
      input: '{"name": /* inline comment */ "Test"}',
      shouldParse: true
    },
    {
      name: 'Multi-line block comment',
      input: '{\n/* This is a\nmulti-line\ncomment */\n"name": "Test"\n}',
      shouldParse: true
    },
    {
      name: 'URL in string should not be treated as comment',
      input: '{"url": "https://example.com"}',
      shouldParse: true,
      expectedValue: { url: 'https://example.com' }
    },
    {
      name: 'String with // should not be treated as comment',
      input: '{"path": "C://Users//Test"}',
      shouldParse: true,
      expectedValue: { path: 'C://Users//Test' }
    }
  ],

  // ==================== MARKDOWN EXTRACTION ====================
  'Markdown Extraction': [
    {
      name: 'JSON in markdown code block',
      input: '```json\n{"name": "Test"}\n```',
      shouldParse: true,
      expectedValue: { name: 'Test' }
    },
    {
      name: 'JSON in generic code block',
      input: '```\n{"name": "Test"}\n```',
      shouldParse: true
    },
    {
      name: 'JSON in code block with surrounding text',
      input: 'Here is the response:\n```json\n{"data": [1, 2, 3]}\n```\nEnd of response.',
      shouldParse: true
    },
    {
      name: 'JSON with uppercase JSON marker',
      input: '```JSON\n{"name": "Test"}\n```',
      shouldParse: true
    },
    {
      name: 'Nested code blocks - extract outer',
      input: '```json\n{"code": "```"}\n```',
      shouldParse: true
    }
  ],

  // ==================== MIXED TEXT EXTRACTION ====================
  'Mixed Text Extraction': [
    {
      name: 'JSON with text before',
      input: 'Here is your data:\n{"name": "Charlie"}',
      shouldParse: true,
      expectedValue: { name: 'Charlie' }
    },
    {
      name: 'JSON with text after',
      input: '{"name": "Charlie"}\nThat is all.',
      shouldParse: true
    },
    {
      name: 'JSON with text before and after',
      input: 'Response: {"status": "ok"} - Done!',
      shouldParse: true
    },
    {
      name: 'Array with surrounding text',
      input: 'The numbers are: [1, 2, 3, 4, 5] in order.',
      shouldParse: true,
      expectedValue: [1, 2, 3, 4, 5]
    },
    {
      name: 'Multiple JSON objects - extract first complete',
      input: 'First: {"a": 1} Second: {"b": 2}',
      shouldParse: true
    },
    {
      name: 'JSON with LLM preamble',
      input: "Sure! Here's the JSON you requested:\n\n{\"result\": \"success\"}",
      shouldParse: true
    }
  ],

  // ==================== CONTROL CHARACTERS ====================
  'Control Characters': [
    {
      name: 'Unescaped newline in string',
      input: '{"text": "Line 1\nLine 2"}',
      shouldParse: true
    },
    {
      name: 'Unescaped tab in string',
      input: '{"text": "Col1\tCol2"}',
      shouldParse: true
    },
    {
      name: 'Unescaped carriage return',
      input: '{"text": "Line 1\rLine 2"}',
      shouldParse: true
    },
    {
      name: 'Multiple control characters',
      input: '{"text": "A\tB\nC\rD"}',
      shouldParse: true
    }
  ],

  // ==================== MISSING COMMAS ====================
  'Missing Commas': [
    {
      name: 'Missing comma between properties',
      input: '{"a": 1 "b": 2}',
      shouldParse: true
    },
    {
      name: 'Missing comma between array elements',
      input: '[1 2 3]',
      shouldParse: true
    },
    {
      name: 'Missing comma between objects',
      input: '[{"a": 1} {"b": 2}]',
      shouldParse: true
    },
    {
      name: 'Missing comma between arrays',
      input: '[[1, 2] [3, 4]]',
      shouldParse: true
    },
    {
      name: 'Missing comma between string and object',
      input: '["test" {"a": 1}]',
      shouldParse: true
    },
    {
      name: 'Missing comma between literals',
      input: '[true false null]',
      shouldParse: true
    }
  ],

  // ==================== BROKEN STRINGS ====================
  'Broken Strings': [
    {
      name: 'Unclosed string at end',
      input: '{"name": "Test}',
      shouldParse: true
    },
    {
      name: 'Unclosed string before brace',
      input: '{"name": "Test, "age": 30}',
      shouldParse: true
    },
    {
      name: 'Unclosed string in nested object',
      input: '{"user": {"name": "Test}}',
      shouldParse: true
    }
  ],

  // ==================== COMPLEX COMBINED ISSUES ====================
  'Complex Combined Issues': [
    {
      name: 'Multiple issues: unquoted keys + trailing comma + missing bracket',
      input: '{user: {name: "Helen", age: 28,}, active: true,',
      shouldParse: true
    },
    {
      name: 'Multiple issues: single quotes + Python literals + trailing comma',
      input: "{'name': 'Test', 'active': True, 'value': None,}",
      shouldParse: true
    },
    {
      name: 'Multiple issues: markdown + unquoted keys + missing bracket',
      input: '```json\n{name: "Test", items: [1, 2, 3\n```',
      shouldParse: true
    },
    {
      name: 'Multiple issues: comments + trailing commas + Python',
      input: '{\n  "name": "Test", // user name\n  "active": True,\n}',
      shouldParse: true
    },
    {
      name: 'LLM response with explanation',
      input: `I've created the JSON for you:

\`\`\`json
{
  name: "John Doe",
  age: 30,
  skills: ["JavaScript", "Python",],
  active: True,
}
\`\`\`

Let me know if you need changes!`,
      shouldParse: true
    },
    {
      name: 'Deeply nested with multiple issues',
      input: `{
        users: [
          {name: 'Alice', role: 'admin', active: True,},
          {name: 'Bob', role: 'user', active: False,}
        ],
        meta: {
          count: 2,
          page: 1
      }`,
      shouldParse: true
    },
    {
      name: 'Real-world API response with issues',
      input: `{
        "status": "success",
        data: {
          items: [
            {id: 1, name: "Item 1", price: 9.99,},
            {id: 2, name: "Item 2", price: 19.99,},
          ],
          pagination: {
            page: 1,
            total: 100,
            hasMore: True
          }
        }
      }`,
      shouldParse: true
    }
  ],

  // ==================== EDGE CASES ====================
  'Edge Cases': [
    {
      name: 'Unicode characters',
      input: '{"emoji": "😀", "chinese": "中文", "arabic": "العربية"}',
      shouldParse: true
    },
    {
      name: 'Escaped quotes in string',
      input: '{"quote": "He said \\"hello\\""}',
      shouldParse: true
    },
    {
      name: 'Backslashes in string',
      input: '{"path": "C:\\\\Users\\\\Test"}',
      shouldParse: true
    },
    {
      name: 'Very long string',
      input: `{"data": "${'a'.repeat(10000)}"}`,
      shouldParse: true
    },
    {
      name: 'Deeply nested structure (10 levels)',
      input: '{"a":{"b":{"c":{"d":{"e":{"f":{"g":{"h":{"i":{"j":"deep"}}}}}}}}}}',
      shouldParse: true
    },
    {
      name: 'Array of empty objects',
      input: '[{},{},{},{}]',
      shouldParse: true
    },
    {
      name: 'Object with empty string key',
      input: '{"": "empty key"}',
      shouldParse: true
    },
    {
      name: 'Numbers in various formats',
      input: '{"int": 42, "float": 3.14, "neg": -10, "exp": 1e10, "negExp": 1e-5}',
      shouldParse: true
    },
    {
      name: 'Boolean and null values',
      input: '{"t": true, "f": false, "n": null}',
      shouldParse: true
    },
    {
      name: 'String that looks like JSON',
      input: '{"json": "{\\"nested\\": \\"string\\"}"}',
      shouldParse: true
    },
    {
      name: 'Whitespace variations',
      input: '{\n\t"name"\n:\n\t"Test"\n,\n\t"age"\n:\n\t30\n}',
      shouldParse: true
    },
    {
      name: 'Colon in string value',
      input: '{"time": "12:30:45", "url": "http://test.com"}',
      shouldParse: true,
      expectedValue: { time: '12:30:45', url: 'http://test.com' }
    },
    {
      name: 'Brackets in string value',
      input: '{"code": "arr[0] = {a: 1}"}',
      shouldParse: true
    }
  ],

  // ==================== PARSE METHOD TESTS ====================
  'Parse Method': [
    {
      name: 'Parse valid JSON',
      input: '{"test": true}',
      useParseMethod: true,
      expectedValue: { test: true }
    },
    {
      name: 'Parse with healing needed',
      input: '{test: True,}',
      useParseMethod: true,
      expectedValue: { test: true }
    },
    {
      name: 'Parse completely invalid returns null',
      input: 'not json at all {{{{',
      useParseMethod: true,
      expectedValue: null,
      shouldParse: false,
      skipValidation: true
    }
  ]
};

// ==================== TEST RUNNER ====================

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      failures: []
    };
  }

  run() {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║              JsonHealer Comprehensive Test Suite               ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    for (const [suiteName, tests] of Object.entries(testSuites)) {
      this.runSuite(suiteName, tests);
    }

    this.printSummary();
    return this.results.failed === 0;
  }

  runSuite(suiteName, tests) {
    console.log(`\n┌── ${suiteName} ${'─'.repeat(Math.max(0, 55 - suiteName.length))}┐`);

    for (const test of tests) {
      this.runTest(test);
    }

    console.log(`└${'─'.repeat(60)}┘`);
  }

  runTest(test) {
    this.results.total++;

    try {
      let result;
      let parsed = null;

      if (test.useParseMethod) {
        // Test the parse() method
        parsed = JsonHealer.parse(test.input);
        result = parsed !== null ? JSON.stringify(parsed) : null;
      } else {
        // Test the heal() method
        result = JsonHealer.heal(test.input);
        if (result && typeof result === 'string') {
          try {
            parsed = JSON.parse(result);
          } catch {
            parsed = null;
          }
        }
      }

      const isValid = result !== null && JsonHealer.isValidJSON(result);

      // Determine pass/fail
      let passed = true;
      let failReason = '';

      if (test.skipValidation) {
        // Just check the result matches expected if provided
        if (test.expected !== undefined && result !== test.expected) {
          passed = false;
          failReason = `Expected "${test.expected}", got "${result}"`;
        }
      } else if (test.shouldParse === false) {
        // Expected to fail
        if (isValid) {
          passed = false;
          failReason = 'Expected invalid JSON but got valid';
        }
      } else {
        // Expected to succeed
        if (!isValid) {
          passed = false;
          failReason = 'Failed to produce valid JSON';
        } else if (test.expected !== undefined && result !== test.expected) {
          passed = false;
          failReason = `Output mismatch: expected "${test.expected}"`;
        } else if (test.expectedValue !== undefined) {
          const valueMatch = JSON.stringify(parsed) === JSON.stringify(test.expectedValue);
          if (!valueMatch) {
            passed = false;
            failReason = `Value mismatch: expected ${JSON.stringify(test.expectedValue)}, got ${JSON.stringify(parsed)}`;
          }
        }
      }

      if (passed) {
        this.results.passed++;
        console.log(`│ ✅ ${this.truncate(test.name, 54)} │`);
      } else {
        this.results.failed++;
        this.results.failures.push({ test, result, failReason });
        console.log(`│ ❌ ${this.truncate(test.name, 54)} │`);
      }

    } catch (error) {
      this.results.failed++;
      this.results.failures.push({ test, error: error.message });
      console.log(`│ 💥 ${this.truncate(test.name, 54)} │`);
    }
  }

  truncate(str, maxLen) {
    if (str.length <= maxLen) {
      return str + ' '.repeat(maxLen - str.length);
    }
    return str.substring(0, maxLen - 3) + '...';
  }

  printSummary() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                         TEST SUMMARY                           ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');

    const passRate = ((this.results.passed / this.results.total) * 100).toFixed(1);

    console.log(`║  Total Tests:  ${String(this.results.total).padStart(4)}                                          ║`);
    console.log(`║  Passed:       ${String(this.results.passed).padStart(4)}  ✅                                      ║`);
    console.log(`║  Failed:       ${String(this.results.failed).padStart(4)}  ${this.results.failed > 0 ? '❌' : '  '}                                      ║`);
    console.log(`║  Pass Rate:    ${passRate.padStart(5)}%                                        ║`);

    console.log('╚════════════════════════════════════════════════════════════════╝');

    if (this.results.failures.length > 0) {
      console.log('\n');
      console.log('┌──────────────────────────────────────────────────────────────────┐');
      console.log('│                       FAILURE DETAILS                            │');
      console.log('└──────────────────────────────────────────────────────────────────┘');

      for (const failure of this.results.failures) {
        console.log(`\n  Test: ${failure.test.name}`);
        console.log(`  Input: ${this.formatForDisplay(failure.test.input)}`);

        if (failure.error) {
          console.log(`  Error: ${failure.error}`);
        } else {
          console.log(`  Output: ${this.formatForDisplay(failure.result)}`);
          console.log(`  Reason: ${failure.failReason}`);
        }
      }
    }

    console.log('\n');

    if (this.results.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log(`⚠️  ${this.results.failed} test(s) failed.`);
    }
  }

  formatForDisplay(str) {
    if (str === null) return 'null';
    if (str === undefined) return 'undefined';
    if (typeof str !== 'string') return String(str);

    const escaped = str.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r');
    if (escaped.length > 60) {
      return escaped.substring(0, 57) + '...';
    }
    return escaped;
  }
}

// ==================== CUSTOM STRATEGY TESTS ====================

function testCustomStrategies() {
  console.log('\n');
  console.log('┌──────────────────────────────────────────────────────────────────┐');
  console.log('│                   CUSTOM STRATEGY TESTS                          │');
  console.log('└──────────────────────────────────────────────────────────────────┘\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Register custom strategy
  try {
    JsonHealer.registerStrategy('fixArrowFunctions', (input) => {
      return input.replace(/=>/g, ':');
    }, 5);

    const result = JsonHealer.heal('{"fn" => "test"}');
    const isValid = JsonHealer.isValidJSON(result);

    if (isValid) {
      console.log('  ✅ Custom strategy registration works');
      passed++;
    } else {
      console.log('  ❌ Custom strategy registration failed');
      failed++;
    }
  } catch (e) {
    console.log(`  ❌ Custom strategy registration threw: ${e.message}`);
    failed++;
  }

  // Test 2: Remove custom strategy
  try {
    JsonHealer.removeStrategy('fixArrowFunctions');

    if (!JsonHealer.strategies.includes('fixArrowFunctions')) {
      console.log('  ✅ Custom strategy removal works');
      passed++;
    } else {
      console.log('  ❌ Custom strategy removal failed');
      failed++;
    }
  } catch (e) {
    console.log(`  ❌ Custom strategy removal threw: ${e.message}`);
    failed++;
  }

  // Test 3: Strategy priority
  try {
    const originalLength = JsonHealer.strategies.length;
    JsonHealer.registerStrategy('testPriority', (x) => x, 0);

    if (JsonHealer.strategies[0] === 'testPriority') {
      console.log('  ✅ Strategy priority works');
      passed++;
    } else {
      console.log('  ❌ Strategy priority failed');
      failed++;
    }

    JsonHealer.removeStrategy('testPriority');
  } catch (e) {
    console.log(`  ❌ Strategy priority threw: ${e.message}`);
    failed++;
  }

  // Test 4: Invalid strategy
  try {
    JsonHealer.registerStrategy('invalid', 'not a function');
    console.log('  ❌ Should have thrown for non-function strategy');
    failed++;
  } catch (e) {
    console.log('  ✅ Properly rejects non-function strategies');
    passed++;
  }

  console.log(`\n  Results: ${passed} passed, ${failed} failed`);

  return failed === 0;
}

// ==================== PERFORMANCE TESTS ====================

function testPerformance() {
  console.log('\n');
  console.log('┌──────────────────────────────────────────────────────────────────┐');
  console.log('│                     PERFORMANCE TESTS                            │');
  console.log('└──────────────────────────────────────────────────────────────────┘\n');

  const iterations = 1000;

  // Test 1: Simple healing performance
  const simpleInput = '{name: "Test", value: 123,}';
  const startSimple = performance.now();
  for (let i = 0; i < iterations; i++) {
    JsonHealer.heal(simpleInput);
  }
  const endSimple = performance.now();
  console.log(`  Simple healing (${iterations}x): ${(endSimple - startSimple).toFixed(2)}ms`);
  console.log(`  Average: ${((endSimple - startSimple) / iterations).toFixed(4)}ms per operation`);

  // Test 2: Complex healing performance
  const complexInput = `{
    users: [
      {name: 'Alice', role: 'admin', active: True,},
      {name: 'Bob', role: 'user', active: False,}
    ],
    meta: {count: 2, page: 1}
  `;
  const startComplex = performance.now();
  for (let i = 0; i < iterations; i++) {
    JsonHealer.heal(complexInput);
  }
  const endComplex = performance.now();
  console.log(`\n  Complex healing (${iterations}x): ${(endComplex - startComplex).toFixed(2)}ms`);
  console.log(`  Average: ${((endComplex - startComplex) / iterations).toFixed(4)}ms per operation`);

  // Test 3: Large input performance
  const largeArray = Array(100).fill().map((_, i) => `{id: ${i}, name: 'Item ${i}', active: True,}`).join(',');
  const largeInput = `[${largeArray}]`;
  const startLarge = performance.now();
  for (let i = 0; i < 100; i++) {
    JsonHealer.heal(largeInput);
  }
  const endLarge = performance.now();
  console.log(`\n  Large input healing (100x): ${(endLarge - startLarge).toFixed(2)}ms`);
  console.log(`  Average: ${((endLarge - startLarge) / 100).toFixed(4)}ms per operation`);

  // Test 4: Already valid JSON (should be fast path)
  const validInput = JSON.stringify({ name: 'Test', value: 123, items: [1, 2, 3] });
  const startValid = performance.now();
  for (let i = 0; i < iterations; i++) {
    JsonHealer.heal(validInput);
  }
  const endValid = performance.now();
  console.log(`\n  Valid JSON passthrough (${iterations}x): ${(endValid - startValid).toFixed(2)}ms`);
  console.log(`  Average: ${((endValid - startValid) / iterations).toFixed(4)}ms per operation`);
}

// ==================== MAIN ====================

function main() {
  const runner = new TestRunner();
  const mainTestsPassed = runner.run();
  const customTestsPassed = testCustomStrategies();
  testPerformance();

  console.log('\n');

  if (mainTestsPassed && customTestsPassed) {
    console.log('════════════════════════════════════════════════════════════════');
    console.log('                    ✅ ALL TESTS PASSED                         ');
    console.log('════════════════════════════════════════════════════════════════');
    process.exit(0);
  } else {
    console.log('════════════════════════════════════════════════════════════════');
    console.log('                    ❌ SOME TESTS FAILED                        ');
    console.log('════════════════════════════════════════════════════════════════');
    process.exit(1);
  }
}

main();
