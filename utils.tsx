
import React from "react";

/**
 * 將化學式字符串轉換為包含下標與上標的 JSX。
 * 支持 "H2O", "SO4^2-", "Fe^3+", "e^-", "[Cu(NH3)4]^2+" 等格式。
 */
export const formatFormula = (formula: string): React.ReactNode => {
  // 移除對 e^- 的特殊處理，使其進入統一的格式化流程，確保樣式一致
  const parts = formula.split('^');
  const base = parts[0];
  const charge = parts.length > 1 ? parts[1] : null;

  const formattedBase = base.split(/(\d+)/).map((part, index) => {
    if (/^\d+$/.test(part)) {
      return <sub key={`sub-${index}`} className="text-[70%] leading-none">{part}</sub>;
    }
    return <span key={`base-${index}`}>{part}</span>;
  });

  return (
    <span className="font-mono font-medium inline-flex items-center leading-none">
      <span className="flex items-baseline">
        {formattedBase}
      </span>
      {charge && <sup className="text-[70%] ml-0.5 leading-none">{charge}</sup>}
    </span>
  );
};

/**
 * 解析化學式中的原子計數。
 * 支持括號 (e.g. Ca(OH)2) 與方括號 (e.g. [Zn(OH)4]^2-) 並忽略電荷。
 */
export const parseFormula = (formula: string): Record<string, number> => {
  if (formula.includes('e^-')) return { 'e': 1 };

  let clean = formula.split('^')[0];
  clean = clean.replace(/\./g, ''); // 移除結晶水點

  const stack: Record<string, number>[] = [{}];
  // 匹配元素、左括號、右括號及其倍數、左方括號、右方括號及其倍數
  const tokenRegex = /([A-Z][a-z]*|e)(\d*)|(\()|(\))(\d*)|(\[)|(\])(\d*)/g;
  
  let match;
  while ((match = tokenRegex.exec(clean)) !== null) {
    if (match[1]) { // 元素
      const element = match[1];
      const count = parseInt(match[2] || '1', 10);
      const current = stack[stack.length - 1];
      current[element] = (current[element] || 0) + count;
    } else if (match[3] || match[6]) { // ( 或 [
      stack.push({});
    } else if (match[4] || match[7]) { // ) 或 ]
      const multiplier = parseInt((match[5] || match[8]) || '1', 10);
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
