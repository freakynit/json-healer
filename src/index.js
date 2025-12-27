/**
 * JsonHealer - Robust JSON repair utility for malformed JSON strings
 * Handles common issues from LLMs, copy-paste errors, and format conversions
 */
export class JsonHealer {
  // Strategy order: extraction → syntax cleanup → structural fixes
  static strategies = [
    'extractFromMarkdown',
    'extractFromMixedText',
    'removeComments',
    'fixPythonLiterals',
    'fixSingleQuotes',
    'escapeControlCharacters',
    'fixUnquotedKeys',
    'fixMissingColons',
    'fixTrailingCommas',
    'fixLeadingCommas',
    'fixMultipleCommas',
    'closeBrokenStrings',
    'fixMissingCommas',
    'balanceBrackets',
  ];

  /**
   * Main healing function - applies strategies until JSON is valid
   * @param {string} input - Malformed JSON string
   * @param {object} [options] - Configuration options
   * @param {boolean} [options.aggressive=false] - Use aggressive repair as fallback
   * @returns {string} - Healed JSON string or original if unrepairable
   */
  static heal(input, options = {}) {
    if (typeof input !== 'string' || !input.trim()) return input;
    if (this.isValidJSON(input)) return input;

    let current = input;

    for (const strategyName of this.strategies) {
      const strategy = this[strategyName];
      if (typeof strategy === 'function') {
        try {
          const result = strategy.call(this, current);
          if (result && typeof result === 'string') {
            current = result;
            if (this.isValidJSON(current)) {
              return current;
            }
          }
        } catch (e) {
          // Strategy failed, continue with next
          console.debug?.(`JsonHealer: Strategy "${strategyName}" threw:`, e.message);
        }
      }
    }

    // Try combined aggressive repair as last resort
    if (options.aggressive !== false) {
      try {
        const aggressive = this.aggressiveRepair(input);
        if (this.isValidJSON(aggressive)) {
          return aggressive;
        }
      } catch (e) {
        // Aggressive repair failed
      }
    }

    return current; // Return best effort
  }

  /**
   * Parse with healing - returns parsed object or null
   * @param {string} input - JSON string to parse
   * @param {object} [options] - Healing options
   * @returns {any} - Parsed object or null if unparseable
   */
  static parse(input, options = {}) {
    const healed = this.heal(input, options);
    try {
      return JSON.parse(healed);
    } catch {
      return null;
    }
  }

  /**
   * Check if string is valid JSON
   * @param {string} str
   * @returns {boolean}
   */
  static isValidJSON(str) {
    if (typeof str !== 'string') return false;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  // ==================== STRATEGIES ====================

  /**
   * Extract JSON from markdown code blocks
   */
  static extractFromMarkdown(input) {
    // Match ```json ... ``` or ``` ... ```
    const patterns = [
      /```json\s*([\s\S]*?)\s*```/i,
      /```\s*([\s\S]*?)\s*```/,
    ];

    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match && match[1]) {
        const extracted = match[1].trim();
        // Verify it looks like JSON
        if (/^[\[{]/.test(extracted)) {
          return extracted;
        }
      }
    }
    return input;
  }

  /**
   * Extract JSON object or array from surrounding text
   */
  static extractFromMixedText(input) {
    const trimmed = input.trim();

    // Find all potential start positions
    const objStart = trimmed.indexOf('{');
    const arrStart = trimmed.indexOf('[');

    // Determine which comes first (and exists)
    let startChar, endChar, startIdx;

    if (objStart === -1 && arrStart === -1) {
      return input;
    } else if (objStart === -1) {
      startChar = '[';
      endChar = ']';
      startIdx = arrStart;
    } else if (arrStart === -1) {
      startChar = '{';
      endChar = '}';
      startIdx = objStart;
    } else {
      // Both exist, pick the first one
      if (objStart < arrStart) {
        startChar = '{';
        endChar = '}';
        startIdx = objStart;
      } else {
        startChar = '[';
        endChar = ']';
        startIdx = arrStart;
      }
    }

    // Find matching end bracket using stack-based matching
    const endIdx = this._findMatchingBracket(trimmed, startIdx, startChar, endChar);

    if (endIdx !== -1) {
      return trimmed.substring(startIdx, endIdx + 1);
    }

    // Fallback: use lastIndexOf
    const lastEnd = trimmed.lastIndexOf(endChar);
    if (lastEnd > startIdx) {
      return trimmed.substring(startIdx, lastEnd + 1);
    }

    // If no matching bracket found, return from start to end
    return trimmed.substring(startIdx);
  }

  /**
   * Remove JavaScript/JSONC style comments (safe - avoids strings)
   */
  static removeComments(input) {
    let result = '';
    let i = 0;
    let inString = false;
    let stringChar = null;

    while (i < input.length) {
      const char = input[i];
      const next = input[i + 1];

      // Handle string boundaries
      if ((char === '"' || char === "'") && (i === 0 || input[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
        }
        result += char;
        i++;
        continue;
      }

      // Skip comments only when not in string
      if (!inString) {
        // Single-line comment
        if (char === '/' && next === '/') {
          // Skip until newline
          while (i < input.length && input[i] !== '\n') {
            i++;
          }
          continue;
        }

        // Multi-line comment
        if (char === '/' && next === '*') {
          i += 2;
          while (i < input.length - 1 && !(input[i] === '*' && input[i + 1] === '/')) {
            i++;
          }
          i += 2; // Skip */
          continue;
        }
      }

      result += char;
      i++;
    }

    return result;
  }

  /**
   * Fix Python/LLM specific literals (True, False, None)
   */
  static fixPythonLiterals(input) {
    // Only replace outside of strings
    return this._replaceOutsideStrings(input, [
      [/^True\b/, 'true'],
      [/^False\b/, 'false'],
      [/^None\b/, 'null'],
      [/^undefined\b/, 'null'],
      [/^NaN\b/, 'null'],
      [/^Infinity\b/, 'null'],
      [/^-Infinity\b/, 'null'],
    ]);
  }

  /**
   * Escape unescaped control characters within strings
   */
  static escapeControlCharacters(input) {
    let result = '';
    let inString = false;
    let i = 0;

    while (i < input.length) {
      const char = input[i];

      // Track string boundaries
      if (char === '"' && (i === 0 || input[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
        i++;
        continue;
      }

      // Only escape control characters inside strings
      if (inString) {
        const code = char.charCodeAt(0);
        if (code < 32) {
          switch (code) {
            case 8: result += '\\b'; break;
            case 9: result += '\\t'; break;
            case 10: result += '\\n'; break;
            case 12: result += '\\f'; break;
            case 13: result += '\\r'; break;
            default: result += `\\u${code.toString(16).padStart(4, '0')}`;
          }
          i++;
          continue;
        }
      }

      result += char;
      i++;
    }

    return result;
  }

  /**
   * Fix trailing commas before ] or }
   */
  static fixTrailingCommas(input) {
    // Handle one or more trailing commas with optional whitespace
    return input.replace(/,(\s*,)*(\s*[}\]])/g, '$2');
  }

  /**
   * Fix leading commas after [ or {
   */
  static fixLeadingCommas(input) {
    return input.replace(/([{\[])\s*,+/g, '$1');
  }

  /**
   * Fix multiple consecutive commas
   */
  static fixMultipleCommas(input) {
    // Replace multiple commas with single comma (outside strings)
    let result = '';
    let i = 0;
    let inString = false;

    while (i < input.length) {
      const char = input[i];

      if (char === '"' && (i === 0 || input[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
        i++;
        continue;
      }

      if (inString) {
        result += char;
        i++;
        continue;
      }

      // If we see a comma, skip any following commas and whitespace then add just one comma
      if (char === ',') {
        result += ',';
        i++;
        // Skip whitespace and additional commas
        while (i < input.length) {
          const next = input[i];
          if (next === ',') {
            i++;
          } else if (/\s/.test(next)) {
            result += next;
            i++;
          } else {
            break;
          }
        }
        continue;
      }

      result += char;
      i++;
    }

    return result;
  }

  /**
   * Fix unquoted object keys (safe - avoids strings)
   */
  static fixUnquotedKeys(input) {
    let result = '';
    let i = 0;
    let inString = false;

    while (i < input.length) {
      const char = input[i];

      // Track string state
      if (char === '"' && (i === 0 || input[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
        i++;
        continue;
      }

      if (inString) {
        result += char;
        i++;
        continue;
      }

      // Look for unquoted keys after { or ,
      const lastNonWhitespace = result.replace(/\s+$/, '').slice(-1);
      if (lastNonWhitespace === '{' || lastNonWhitespace === ',') {
        const keyMatch = input.slice(i).match(/^(\s*)([a-zA-Z_$][\w$]*)\s*:/);
        if (keyMatch) {
          const [fullMatch, whitespace, key] = keyMatch;
          result += `${whitespace}"${key}":`;
          i += fullMatch.length;
          continue;
        }
      }

      result += char;
      i++;
    }

    return result;
  }

  /**
   * Fix missing colons between keys and values
   */
  static fixMissingColons(input) {
    // Only add colons in object context (after { or ,)
    // Pattern: { or , followed by "key" then whitespace then value (without colon)
    let result = '';
    let i = 0;
    let inString = false;
    let lastStructural = '';

    while (i < input.length) {
      const char = input[i];

      if (char === '"' && (i === 0 || input[i - 1] !== '\\')) {
        if (!inString) {
          inString = true;
          // Check if this is a key that needs a colon after it
          if (lastStructural === '{' || lastStructural === ',') {
            // Find the end of this string
            let j = i + 1;
            while (j < input.length && !(input[j] === '"' && input[j - 1] !== '\\')) {
              j++;
            }
            if (j < input.length) {
              // Got the full string, check what follows
              const afterString = input.slice(j + 1).match(/^(\s*)(.)/);
              if (afterString && afterString[2] !== ':' && /[\[{"tfn\d-]/.test(afterString[2])) {
                // Missing colon - add the string with colon
                result += input.slice(i, j + 1) + ':' + afterString[1];
                i = j + 1 + afterString[1].length;
                inString = false;
                continue;
              }
            }
          }
        } else {
          inString = false;
        }
        result += char;
        i++;
        continue;
      }

      if (!inString && /[{},\[\]]/.test(char)) {
        lastStructural = char;
      }

      result += char;
      i++;
    }

    return result;
  }

  /**
   * Fix single quotes to double quotes (smart detection)
   */
  static fixSingleQuotes(input) {
    const doubleCount = (input.match(/"/g) || []).length;
    const singleCount = (input.match(/'/g) || []).length;

    // Only convert if single quotes dominate
    if (singleCount <= doubleCount) {
      return input;
    }

    let result = '';
    let i = 0;
    let inString = false;
    let stringChar = null;

    while (i < input.length) {
      const char = input[i];
      const prev = i > 0 ? input[i - 1] : '';

      if ((char === "'" || char === '"') && prev !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
          result += '"'; // Always output double quote
        } else if (char === stringChar) {
          inString = false;
          stringChar = null;
          result += '"'; // Always output double quote
        } else {
          // Different quote inside string - escape if needed
          if (char === '"') {
            result += '\\"';
          } else {
            result += char;
          }
        }
      } else {
        result += char;
      }
      i++;
    }

    return result;
  }

  /**
   * Close broken/unclosed strings
   */
  static closeBrokenStrings(input) {
    let result = '';
    let i = 0;
    let inString = false;
    let stringContent = '';

    while (i < input.length) {
      const char = input[i];
      const prev = i > 0 ? input[i - 1] : '';

      if (char === '"' && prev !== '\\') {
        if (!inString) {
          inString = true;
          stringContent = '';
          result += char;
          i++;
          continue;
        } else {
          inString = false;
          stringContent = '';
          result += char;
          i++;
          continue;
        }
      }

      if (inString) {
        stringContent += char;
        
        // Check for patterns that suggest the string should have ended
        // Pattern: comma-space-quote-word-quote-colon suggests broken string
        if (char === ',' || char === ':') {
          const remaining = input.slice(i);
          // Look for pattern like: , "key": or similar that suggests we're outside string
          const breakPattern = remaining.match(/^,\s*"[^"]+"\s*:/);
          if (breakPattern) {
            // Insert closing quote before the comma
            result += '"';
            inString = false;
            stringContent = '';
            // Continue without incrementing - let normal processing handle the comma
            continue;
          }
        }
        
        result += char;
        i++;
        continue;
      }

      result += char;
      i++;
    }

    // Close any unclosed string at end
    if (inString) {
      result += '"';
    }

    return result;
  }

  /**
   * Balance brackets and braces using a proper stack
   */
  static balanceBrackets(input) {
    let result = input.trim();

    // Track bracket stack to know the correct closing order
    const stack = [];
    let inString = false;

    for (let i = 0; i < result.length; i++) {
      const char = result[i];
      const prev = i > 0 ? result[i - 1] : '';

      if (char === '"' && prev !== '\\') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') {
          stack.push('{');
        } else if (char === '[') {
          stack.push('[');
        } else if (char === '}') {
          // Find matching open brace
          for (let j = stack.length - 1; j >= 0; j--) {
            if (stack[j] === '{') {
              stack.splice(j, 1);
              break;
            }
          }
        } else if (char === ']') {
          // Find matching open bracket
          for (let j = stack.length - 1; j >= 0; j--) {
            if (stack[j] === '[') {
              stack.splice(j, 1);
              break;
            }
          }
        }
      }
    }

    // Add missing closing brackets in reverse stack order (LIFO)
    while (stack.length > 0) {
      const open = stack.pop();
      result += open === '{' ? '}' : ']';
    }

    // Handle extra closing brackets by removing them
    // Re-scan to find unmatched closers
    const finalStack = [];
    let finalInString = false;
    let toRemove = [];

    for (let i = 0; i < result.length; i++) {
      const char = result[i];
      const prev = i > 0 ? result[i - 1] : '';

      if (char === '"' && prev !== '\\') {
        finalInString = !finalInString;
        continue;
      }

      if (!finalInString) {
        if (char === '{' || char === '[') {
          finalStack.push({ char, index: i });
        } else if (char === '}') {
          let found = false;
          for (let j = finalStack.length - 1; j >= 0; j--) {
            if (finalStack[j].char === '{') {
              finalStack.splice(j, 1);
              found = true;
              break;
            }
          }
          if (!found) toRemove.push(i);
        } else if (char === ']') {
          let found = false;
          for (let j = finalStack.length - 1; j >= 0; j--) {
            if (finalStack[j].char === '[') {
              finalStack.splice(j, 1);
              found = true;
              break;
            }
          }
          if (!found) toRemove.push(i);
        }
      }
    }

    // Remove unmatched closing brackets from end
    if (toRemove.length > 0) {
      toRemove.sort((a, b) => b - a); // Sort descending to remove from end first
      for (const idx of toRemove) {
        result = result.slice(0, idx) + result.slice(idx + 1);
      }
    }

    return result;
  }

  /**
   * Fix missing commas between elements
   */
  static fixMissingCommas(input) {
    let result = input;
    
    // Fix missing comma between } and {
    result = result.replace(/}(\s*){/g, '},$1{');
    // Fix missing comma between ] and [
    result = result.replace(/](\s*)\[/g, '],$1[');
    // Fix missing comma between } and "
    result = result.replace(/}(\s*)"/g, '},$1"');
    // Fix missing comma between ] and "
    result = result.replace(/](\s*)"/g, '],$1"');
    // Fix missing comma between " and {
    result = result.replace(/"(\s*){/g, '",$1{');
    // Fix missing comma between " and [
    result = result.replace(/"(\s*)\[/g, '",$1[');
    // Fix missing comma between values: "value" "next" or "value""next"
    result = result.replace(/"(\s+)"/g, '",$1"');
    // Fix missing comma between number and "
    result = result.replace(/(\d)(\s+)"/g, '$1,$2"');
    // Fix missing comma between " and number
    result = result.replace(/"(\s+)(-?\d)/g, '",$1$2');
    // Fix missing comma between numbers (but not in strings)
    result = this._fixMissingCommasBetweenNumbers(result);
    // Fix missing comma between literals (true, false, null)
    result = this._fixMissingCommasBetweenLiterals(result);
    // Fix missing comma between ] and number
    result = result.replace(/](\s+)(\d)/g, '],$1$2');
    // Fix missing comma between number and [
    result = result.replace(/(\d)(\s+)\[/g, '$1,$2[');
    // Fix missing comma between number and {
    result = result.replace(/(\d)(\s+){/g, '$1,$2{');
    // Fix missing comma between } and number
    result = result.replace(/}(\s+)(\d)/g, '},$1$2');
    // Fix missing comma between } and literal
    result = result.replace(/}(\s+)(true|false|null)\b/g, '},$1$2');
    // Fix missing comma between literal and {
    result = result.replace(/\b(true|false|null)(\s+){/g, '$1,$2{');
    // Fix missing comma between ] and literal
    result = result.replace(/](\s+)(true|false|null)\b/g, '],$1$2');
    // Fix missing comma between literal and [
    result = result.replace(/\b(true|false|null)(\s+)\[/g, '$1,$2[');
    // Fix missing comma between " and literal
    result = result.replace(/"(\s+)(true|false|null)\b/g, '",$1$2');
    // Fix missing comma between literal and "
    result = result.replace(/\b(true|false|null)(\s+)"/g, '$1,$2"');

    return result;
  }

  /**
   * Fix missing commas between numbers in arrays (outside strings)
   */
  static _fixMissingCommasBetweenNumbers(input) {
    let result = '';
    let i = 0;
    let inString = false;
    let inArray = 0;

    while (i < input.length) {
      const char = input[i];

      if (char === '"' && (i === 0 || input[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
        i++;
        continue;
      }

      if (inString) {
        result += char;
        i++;
        continue;
      }

      if (char === '[') inArray++;
      if (char === ']') inArray--;

      // Look for number followed by whitespace followed by another number (only in arrays)
      if (inArray > 0 && /[\d.]/.test(char)) {
        // Collect the full number
        let numStr = '';
        let j = i;
        while (j < input.length && /[\d.eE+-]/.test(input[j])) {
          numStr += input[j];
          j++;
        }
        result += numStr;
        i = j;

        // Check for whitespace followed by another number or minus sign starting a number
        const afterNum = input.slice(i).match(/^(\s+)(-?[\d.])/);
        if (afterNum) {
          result += ',' + afterNum[1];
          i += afterNum[1].length;
        }
        continue;
      }

      result += char;
      i++;
    }

    return result;
  }

  /**
   * Fix missing commas between literals in arrays
   */
  static _fixMissingCommasBetweenLiterals(input) {
    let result = '';
    let i = 0;
    let inString = false;
    let inArray = 0;

    while (i < input.length) {
      const char = input[i];

      if (char === '"' && (i === 0 || input[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
        i++;
        continue;
      }

      if (inString) {
        result += char;
        i++;
        continue;
      }

      if (char === '[') inArray++;
      if (char === ']') inArray--;

      // Look for literal followed by whitespace followed by another literal/value
      if (inArray > 0) {
        const remaining = input.slice(i);
        const literalMatch = remaining.match(/^(true|false|null)\b/);
        if (literalMatch) {
          result += literalMatch[1];
          i += literalMatch[1].length;

          // Check for whitespace followed by another value
          const afterLiteral = input.slice(i).match(/^(\s+)(true|false|null|"|-?[\d.]|\[|{)/);
          if (afterLiteral) {
            result += ',' + afterLiteral[1];
            i += afterLiteral[1].length;
          }
          continue;
        }
      }

      result += char;
      i++;
    }

    return result;
  }

  /**
   * Aggressive repair - applies all strategies and attempts reconstruction
   */
  static aggressiveRepair(input) {
    let result = input;

    // Apply all strategies in sequence
    for (const strategyName of this.strategies) {
      const strategy = this[strategyName];
      if (typeof strategy === 'function') {
        try {
          result = strategy.call(this, result);
        } catch {
          // Continue
        }
      }
    }

    // Ensure it starts and ends with proper characters
    result = result.trim();

    if (!result.startsWith('{') && !result.startsWith('[')) {
      // Wrap in object if it looks like key-value pairs
      if (/"[\w]+":\s*/.test(result)) {
        result = '{' + result + '}';
      }
    }

    // Final bracket balance
    result = this.balanceBrackets(result);

    return result;
  }

  /**
   * Apply all strategies (legacy compatibility)
   */
  static applyAllStrategies(input) {
    return this.aggressiveRepair(input);
  }

  /**
   * Register a custom healing strategy
   * @param {string} name - Strategy name
   * @param {Function} strategy - Strategy function (receives input, returns output)
   * @param {number} [priority] - Optional index position (lower = runs earlier)
   */
  static registerStrategy(name, strategy, priority) {
    if (typeof strategy !== 'function') {
      throw new Error('Strategy must be a function');
    }

    this[name] = strategy;

    // Remove existing if present
    const existingIdx = this.strategies.indexOf(name);
    if (existingIdx !== -1) {
      this.strategies.splice(existingIdx, 1);
    }

    if (typeof priority === 'number' && priority >= 0) {
      this.strategies.splice(Math.min(priority, this.strategies.length), 0, name);
    } else {
      this.strategies.push(name);
    }
  }

  /**
   * Remove a strategy
   * @param {string} name - Strategy name to remove
   */
  static removeStrategy(name) {
    const idx = this.strategies.indexOf(name);
    if (idx !== -1) {
      this.strategies.splice(idx, 1);
    }
    delete this[name];
  }

  // ==================== HELPER METHODS ====================

  /**
   * Find matching closing bracket using stack-based approach
   * @private
   */
  static _findMatchingBracket(str, startIdx, openChar, closeChar) {
    let depth = 0;
    let inString = false;
    let i = startIdx;

    while (i < str.length) {
      const char = str[i];
      const prev = i > 0 ? str[i - 1] : '';

      // Track string state
      if (char === '"' && prev !== '\\') {
        inString = !inString;
      }

      if (!inString) {
        if (char === openChar) {
          depth++;
        } else if (char === closeChar) {
          depth--;
          if (depth === 0) {
            return i;
          }
        }
      }

      i++;
    }

    return -1;
  }

  /**
   * Count brackets outside of strings
   * @private
   */
  static _countBrackets(str) {
    let openBraces = 0;
    let closeBraces = 0;
    let openBrackets = 0;
    let closeBrackets = 0;
    let inString = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const prev = i > 0 ? str[i - 1] : '';

      if (char === '"' && prev !== '\\') {
        inString = !inString;
        continue;
      }

      if (!inString) {
        switch (char) {
          case '{': openBraces++; break;
          case '}': closeBraces++; break;
          case '[': openBrackets++; break;
          case ']': closeBrackets++; break;
        }
      }
    }

    return { openBraces, closeBraces, openBrackets, closeBrackets };
  }

  /**
   * Replace patterns only outside of quoted strings
   * FIXED: Uses non-global regex patterns for proper index checking
   * @private
   */
  static _replaceOutsideStrings(input, replacements) {
    let result = '';
    let i = 0;
    let inString = false;

    while (i < input.length) {
      const char = input[i];

      if (char === '"' && (i === 0 || input[i - 1] !== '\\')) {
        inString = !inString;
        result += char;
        i++;
        continue;
      }

      if (inString) {
        result += char;
        i++;
        continue;
      }

      // Try each replacement
      let matched = false;
      for (const [pattern, replacement] of replacements) {
        const remaining = input.slice(i);
        // Pattern should be anchored to start (^) for proper matching
        const match = remaining.match(pattern);
        if (match && match.index === 0) {
          result += replacement;
          i += match[0].length;
          matched = true;
          break;
        }
      }

      if (!matched) {
        result += char;
        i++;
      }
    }

    return result;
  }
}

export default JsonHealer;
