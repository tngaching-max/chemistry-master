const fs = require('fs');
const content = fs.readFileSync('services/geminiService.ts', 'utf8');

// 只替換環境變數部分
const fixed = content.replace(
  'const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });',
  `const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;`
);

// 在 evaluateHandwrittenAnswers 函數開頭加上檢查
const withCheck = fixed.replace(
  'export const evaluateHandwrittenAnswers = async (imageBase64: string, questions: {zh: string, en: string, formula: string}[]): Promise<EvaluationResult> => {',
  `export const evaluateHandwrittenAnswers = async (imageBase64: string, questions: {zh: string, en: string, formula: string}[]): Promise<EvaluationResult> => {
  if (!ai) {
    throw new Error('Gemini API 金鑰未設定，請檢查環境變數');
  }`
);

fs.writeFileSync('services/geminiService.ts', withCheck);
console.log('✅ 更新完成，數據庫完整保留');
