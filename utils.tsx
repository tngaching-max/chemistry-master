import React from "react";

/**
 * Formats a chemical formula string into JSX with subscripts and superscripts.
 * Expects format like "H2O" or "SO4^2-" or "Fe^3+".
 */
export const formatFormula = (formula: string): React.ReactNode => {
  // Check if there is a charge component denoted by ^
  const parts = formula.split('^');
  const base = parts[0];
  const charge = parts.length > 1 ? parts[1] : null;

  // Format the base (subscripts for numbers)
  const formattedBase = base.split(/(\d+)/).map((part, index) => {
    if (/^\d+$/.test(part)) {
      return <sub key={`sub-${index}`} className="text-[75%]">{part}</sub>;
    }
    return <span key={`base-${index}`}>{part}</span>;
  });

  return (
    <span className="font-mono font-medium inline-flex items-baseline">
      <span>{formattedBase}</span>
      {charge && <sup className="text-[75%] ml-0.5">{charge}</sup>}
    </span>
  );
};

/**
 * Parses a chemical formula into atom counts.
 * Handles parentheses (e.g. Ca(OH)2) and ignores charge/hydrate dots.
 * Supports electrons 'e' as an element for redox logic.
 */
export const parseFormula = (formula: string): Record<string, number> => {
  // Remove charge (e.g., ^2+, ^-)
  let clean = formula.split('^')[0];
  // Remove hydrate dot (e.g., Fe2O3.H2O -> Fe2O3H2O) - treating as single molecule for counting
  clean = clean.replace(/\./g, '');

  const stack: Record<string, number>[] = [{}];
  
  // Regex matches:
  // 1. Element (Start with Upper case letter) OR electron 'e'
  // 2. Count (optional digits)
  // 3. (
  // 4. )
  // 5. Count after ) (optional digits)
  const tokenRegex = /([A-Z][a-z]*|e)(\d*)|(\()|(\))(\d*)/g;
  
  let match;
  while ((match = tokenRegex.exec(clean)) !== null) {
    if (match[1]) { // Element or e
      const element = match[1];
      const count = parseInt(match[2] || '1', 10);
      const current = stack[stack.length - 1];
      current[element] = (current[element] || 0) + count;
    } else if (match[3]) { // (
      stack.push({});
    } else if (match[4]) { // )
      const multiplier = parseInt(match[5] || '1', 10);
      const popped = stack.pop();
      if (popped) {
        const current = stack[stack.length - 1];
        for (const [el, cnt] of Object.entries(popped)) {
          current[el] = (current[el] || 0) + (cnt * multiplier);
        }
      }
    }
  }
  
  return stack[0];
};