
import { GoogleGenAI, Type } from "@google/genai";
import { Ion, ChemicalEquation, Language, EquationTopic, EquationChallenge } from '../types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using gemini-3-pro-preview for complex visual reasoning like OCR and grading
const visionModel = 'gemini-3-pro-preview';
const textModel = 'gemini-3-flash-preview';

/**
 * 完整離子數據庫
 */
const ION_POOL: (Ion & { category: 'MONO' | 'POLY' })[] = [
  // Cations (MONO)
  { formula: "Na^+", chineseName: "鈉離子", englishName: "Sodium ion", type: "Cation", charge: 1, category: 'MONO' },
  { formula: "K^+", chineseName: "鉀離子", englishName: "Potassium ion", type: "Cation", charge: 1, category: 'MONO' },
  { formula: "Cu^+", chineseName: "銅(I) 離子", englishName: "Copper(I) ion", type: "Cation", charge: 1, category: 'MONO' },
  { formula: "Ag^+", chineseName: "銀離子", englishName: "Silver ion", type: "Cation", charge: 1, category: 'MONO' },
  { formula: "Hg^+", chineseName: "汞(I) 離子", englishName: "Mercury(I) ion", type: "Cation", charge: 1, category: 'MONO' },
  { formula: "H^+", chineseName: "氫離子", englishName: "Hydrogen ion", type: "Cation", charge: 1, category: 'MONO' },
  { formula: "Mg^2+", chineseName: "鎂離子", englishName: "Magnesium ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Ca^2+", chineseName: "鈣離子", englishName: "Calcium ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Ba^2+", chineseName: "鋇離子", englishName: "Barium ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Pb^2+", chineseName: "鉛(II) 離子", englishName: "Lead(II) ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Fe^2+", chineseName: "鐵(II) 離子", englishName: "Iron(II) ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Co^2+", chineseName: "鈷(II) 離子", englishName: "Cobalt(II) ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Ni^2+", chineseName: "鎳(II) 離子", englishName: "Nickel(II) ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Mn^2+", chineseName: "錳(II) 離子", englishName: "Manganese(II) ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Cu^2+", chineseName: "銅(II) 離子", englishName: "Copper(II) ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Zn^2+", chineseName: "鋅離子", englishName: "Zinc ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Hg^2+", chineseName: "汞(II) 離子", englishName: "Mercury(II) ion", type: "Cation", charge: 2, category: 'MONO' },
  { formula: "Al^3+", chineseName: "鋁離子", englishName: "Aluminium ion", type: "Cation", charge: 3, category: 'MONO' },
  { formula: "Fe^3+", chineseName: "鐵(III) 離子", englishName: "Iron(III) ion", type: "Cation", charge: 3, category: 'MONO' },
  { formula: "Cr^3+", chineseName: "鉻(III) 離子", englishName: "Chromium(III) ion", type: "Cation", charge: 3, category: 'MONO' },
  
  // Anions (MONO)
  { formula: "H^-", chineseName: "氫負離子", englishName: "Hydride ion", type: "Anion", charge: -1, category: 'MONO' },
  { formula: "Cl^-", chineseName: "氯離子", englishName: "Chloride ion", type: "Anion", charge: -1, category: 'MONO' },
  { formula: "Br^-", chineseName: "溴離子", englishName: "Bromide ion", type: "Anion", charge: -1, category: 'MONO' },
  { formula: "I^-", chineseName: "碘離子", englishName: "Iodide ion", type: "Anion", charge: -1, category: 'MONO' },
  { formula: "O^2-", chineseName: "氧離子", englishName: "Oxide ion", type: "Anion", charge: -2, category: 'MONO' },
  { formula: "S^2-", chineseName: "硫離子", englishName: "Sulphide ion", type: "Anion", charge: -2, category: 'MONO' },
  { formula: "N^3-", chineseName: "氮離子", englishName: "Nitride ion", type: "Anion", charge: -3, category: 'MONO' },
  { formula: "P^3-", chineseName: "磷離子", englishName: "Phosphide ion", type: "Anion", charge: -3, category: 'MONO' },

  // Polyatomic (POLY)
  { formula: "NH4^+", chineseName: "銨離子", englishName: "Ammonium ion", type: "Cation", charge: 1, category: 'POLY' },
  { formula: "OH^-", chineseName: "氫氧離子", englishName: "Hydroxide ion", type: "Anion", charge: -1, category: 'POLY' },
  { formula: "NO3^-", chineseName: "硝酸根離子", englishName: "Nitrate ion", type: "Anion", charge: -1, category: 'POLY' },
  { formula: "NO2^-", chineseName: "亞硝酸根離子", englishName: "Nitrite ion", type: "Anion", charge: -1, category: 'POLY' },
  { formula: "HCO3^-", chineseName: "碳酸氫根離子", englishName: "Hydrogencarbonate ion", type: "Anion", charge: -1, category: 'POLY' },
  { formula: "HSO4^-", chineseName: "硫酸氫根離子", englishName: "Hydrogensulphate ion", type: "Anion", charge: -1, category: 'POLY' },
  { formula: "CN^-", chineseName: "氰離子", englishName: "Cyanide ion", type: "Anion", charge: -1, category: 'POLY' },
  { formula: "MnO4^-", chineseName: "高錳酸根離子", englishName: "Permanganate ion", type: "Anion", charge: -1, category: 'POLY' },
  { formula: "ClO3^-", chineseName: "氯酸根離子", englishName: "Chlorate ion", type: "Anion", charge: -1, category: 'POLY' },
  { formula: "ClO^-", chineseName: "次氯酸根離子", englishName: "Hypochlorite ion", type: "Anion", charge: -1, category: 'POLY' },
  { formula: "SO4^2-", chineseName: "硫酸根離子", englishName: "Sulphate ion", type: "Anion", charge: -2, category: 'POLY' },
  { formula: "SO3^2-", chineseName: "亞硫酸根離子", englishName: "Sulphite ion", type: "Anion", charge: -2, category: 'POLY' },
  { formula: "S2O3^2-", chineseName: "硫代硫酸根離子", englishName: "Thiosulphate ion", type: "Anion", charge: -2, category: 'POLY' },
  { formula: "SiO3^2-", chineseName: "硅酸根離子", englishName: "Silicate ion", type: "Anion", charge: -2, category: 'POLY' },
  { formula: "CO3^2-", chineseName: "碳酸根離子", englishName: "Carbonate ion", type: "Anion", charge: -2, category: 'POLY' },
  { formula: "CrO4^2-", chineseName: "鉻酸根離子", englishName: "Chromate ion", type: "Anion", charge: -2, category: 'POLY' },
  { formula: "Cr2O7^2-", chineseName: "重鉻酸根離子", englishName: "Dichromate ion", type: "Anion", charge: -2, category: 'POLY' },
  { formula: "PO4^3-", chineseName: "磷酸根離子", englishName: "Phosphate ion", type: "Anion", charge: -3, category: 'POLY' },
];

/**
 * 根據類別隨機生成離子
 */
export const generateIons = async (count: number = 6, difficulty: string = 'medium', category: 'MONO' | 'POLY' | 'MIXED' = 'MIXED'): Promise<Ion[]> => {
  let filtered = [...ION_POOL];
  if (category === 'MONO') {
    filtered = ION_POOL.filter(i => i.category === 'MONO');
  } else if (category === 'POLY') {
    filtered = ION_POOL.filter(i => i.category === 'POLY');
  }
  
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export interface EvaluationResult {
  score: number;
  results: {
    question: string;
    expected: string;
    studentWrote: string;
    isCorrect: boolean;
    feedback?: string;
  }[];
  overallFeedback: string;
}

/**
 * 使用 Gemini AI 評估學生手寫的離子或化合物化學式
 */
export const evaluateHandwrittenAnswers = async (imageBase64: string, questions: {zh: string, en: string, formula: string}[]): Promise<EvaluationResult> => {
  const prompt = `You are a professional chemistry teacher grading a student's handwritten chemical formula test.
  
  QUESTIONS (Expected answers):
  ${questions.map((q, i) => `${i+1}. ${q.en} (${q.zh}) -> Expected: ${q.formula}`).join('\n')}

  STRICT GRADING MANDATE:
  1. ABSOLUTE CASE SENSITIVITY: Element symbols must be perfectly cased.
     - Manganese is 'Mn'. If the student writes 'MN', 'mn', or 'mN', mark it as WRONG.
     - Cobalt is 'Co'. 'CO' (Carbon Monoxide) is WRONG.
     - Sodium is 'Na'. 'NA' is WRONG.
     - FIRST letter MUST be UPPERCASE, SECOND letter (if any) MUST be lowercase.
  2. SUBSCRIPTS & SUPERSCRIPTS: Numbers and charges must be in correct positions.
  3. IDENTICAL MATCH: For compounds, they must be neutral.
  
  Please perform OCR on the provided image and return the evaluation in JSON format.
  If the casing is wrong, you MUST set isCorrect to false and state "Wrong casing for element symbol" in feedback.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: "Total correct out of 15" },
      results: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            expected: { type: Type.STRING },
            studentWrote: { type: Type.STRING, description: "The exact characters student wrote" },
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ["question", "expected", "studentWrote", "isCorrect"]
        }
      },
      overallFeedback: { type: Type.STRING }
    },
    required: ["score", "results", "overallFeedback"]
  };

  try {
    const response = await ai.models.generateContent({
      model: visionModel,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64.split(',')[1] 
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text || '';
    return JSON.parse(text.trim()) as EvaluationResult;
  } catch (error) {
    console.error("AI Evaluation failed:", error);
    throw error;
  }
};

export const generateEquations = async (count: number = 3, topic: EquationTopic = 'METALS', language: Language = 'ZH', history: string[] = []): Promise<{ data: ChemicalEquation[], isOffline: boolean }> => {
  const componentSchema = {
    type: Type.OBJECT,
    properties: {
      formula: { type: Type.STRING },
      name: { type: Type.STRING },
      coefficient: { type: Type.INTEGER }
    },
    required: ["formula", "name", "coefficient"]
  };

  const equationSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        reactants: { type: Type.ARRAY, items: componentSchema },
        products: { type: Type.ARRAY, items: componentSchema },
        difficulty: { type: Type.STRING, enum: ["easy", "medium", "hard"] }
      },
      required: ["reactants", "products", "difficulty"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents: `Generate ${count} balanced chemical equations for topic: ${topic}.
      Topic context: HKDSE Chemistry level.
      Excluded equations (already used): ${history.join(', ')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: equationSchema,
        temperature: 0.7,
      }
    });

    if (response.text) {
      return { data: JSON.parse(response.text.trim()) as ChemicalEquation[], isOffline: false };
    }
    return { data: getFallbackEquations(count, topic, language), isOffline: true };
  } catch (error) {
    return { data: getFallbackEquations(count, topic, language), isOffline: true };
  }
};

const getFallbackEquations = (count: number, topic: EquationTopic, language: Language): ChemicalEquation[] => {
  const all: ChemicalEquation[] = [
    {
      reactants: [{ formula: "H2", name: "Hydrogen", coefficient: 2 }, { formula: "O2", name: "Oxygen", coefficient: 1 }],
      products: [{ formula: "H2O", name: "Water", coefficient: 2 }],
      difficulty: "easy"
    },
    {
      reactants: [{ formula: "Mg", name: "Magnesium", coefficient: 2 }, { formula: "O2", name: "Oxygen", coefficient: 1 }],
      products: [{ formula: "MgO", name: "Magnesium Oxide", coefficient: 2 }],
      difficulty: "easy"
    },
    {
      reactants: [{ formula: "Zn", name: "Zinc", coefficient: 1 }, { formula: "CuSO4", name: "Copper(II) Sulphate", coefficient: 1 }],
      products: [{ formula: "ZnSO4", name: "Zinc Sulphate", coefficient: 1 }, { formula: "Cu", name: "Copper", coefficient: 1 }],
      difficulty: "medium"
    }
  ];
  return all.slice(0, count);
};

export const generateBuilderChallenges = async (count: number = 3, language: Language = 'ZH'): Promise<{ data: EquationChallenge[], isOffline: boolean }> => {
  const componentSchema = {
    type: Type.OBJECT,
    properties: {
      formula: { type: Type.STRING },
      coefficient: { type: Type.INTEGER },
      name: { type: Type.STRING }
    },
    required: ["formula", "coefficient"]
  };

  const challengeSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING },
        reactants: { type: Type.ARRAY, items: componentSchema },
        products: { type: Type.ARRAY, items: componentSchema },
      },
      required: ["description", "reactants", "products"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents: `Generate ${count} chemical builder challenges in ${language === 'ZH' ? 'Traditional Chinese' : 'English'}.
      Describe a reaction (e.g., 'Burning of methane') and provide balanced parts.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: challengeSchema,
        temperature: 0.4,
      }
    });

    if (response.text) {
      return { data: JSON.parse(response.text.trim()) as EquationChallenge[], isOffline: false };
    }
    return { data: getFallbackBuilderChallenges(count, language), isOffline: true };
  } catch (error) {
    return { data: getFallbackBuilderChallenges(count, language), isOffline: true };
  }
};

const getFallbackBuilderChallenges = (count: number, language: Language): EquationChallenge[] => {
  return [
    {
      description: language === 'ZH' ? "氫氣與氧氣反應生成水" : "Hydrogen reacts with oxygen to form water",
      reactants: [{ formula: "H2", coefficient: 2 }, { formula: "O2", coefficient: 1 }],
      products: [{ formula: "H2O", coefficient: 2 }]
    },
    {
      description: language === 'ZH' ? "甲烷在氧氣中燃燒生成二氧化碳和水" : "Methane burns in oxygen to form carbon dioxide and water",
      reactants: [{ formula: "CH4", coefficient: 1 }, { formula: "O2", coefficient: 2 }],
      products: [{ formula: "CO2", coefficient: 1 }, { formula: "H2O", coefficient: 2 }]
    }
  ].slice(0, count);
};
