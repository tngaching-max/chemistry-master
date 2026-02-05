
import { GoogleGenAI, Type } from "@google/genai";
import { Ion, ChemicalEquation, Language, EquationTopic, EquationChallenge, EquationComponent } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const visionModel = 'gemini-3-pro-preview';
const textModel = 'gemini-3-flash-preview';

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

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const MASTER_EQUATIONS: Record<string, ChemicalEquation[]> = {
  TOPIC_1_EARTH: [
    { reactants: [{formula:"CO2", coefficient:6, nameZH: "二氧化碳", nameEN: "Carbon dioxide"}, {formula:"H2O", coefficient:6, nameZH: "水", nameEN: "Water"}], products: [{formula:"C6H12O6", coefficient:1, nameZH: "葡萄糖", nameEN: "Glucose"}, {formula:"O2", coefficient:6, nameZH: "氧氣", nameEN: "Oxygen"}], difficulty:"hard" },
    { reactants: [{formula:"CaCO3", coefficient:1, nameZH: "碳酸鈣", nameEN: "Calcium carbonate"}], products: [{formula:"CaO", coefficient:1, nameZH: "氧化鈣", nameEN: "Calcium oxide"}, {formula:"CO2", coefficient:1, nameZH: "二氧化碳", nameEN: "Carbon dioxide"}], difficulty:"easy" },
    { reactants: [{formula:"CaCO3", coefficient:1, nameZH: "碳酸鈣", nameEN: "Calcium carbonate"}, {formula:"H2O", coefficient:1, nameZH: "水", nameEN: "Water"}, {formula:"CO2", coefficient:1, nameZH: "二氧化碳", nameEN: "Carbon dioxide"}], products: [{formula:"Ca(HCO3)2", coefficient:1, nameZH: "碳酸氫鈣", nameEN: "Calcium hydrogencarbonate"}], difficulty:"medium" },
  ],
  TOPIC_2_MICRO: [
    { reactants: [{formula:"Na", coefficient:2, nameZH: "鈉", nameEN: "Sodium"}, {formula:"Cl2", coefficient:1, nameZH: "氯氣", nameEN: "Chlorine"}], products: [{formula:"NaCl", coefficient:2, nameZH: "氯化鈉", nameEN: "Sodium chloride"}], difficulty:"easy" },
    { reactants: [{formula:"Mg", coefficient:2, nameZH: "鎂", nameEN: "Magnesium"}, {formula:"O2", coefficient:1, nameZH: "氧氣", nameEN: "Oxygen"}], products: [{formula:"MgO", coefficient:2, nameZH: "氧化鎂", nameEN: "Magnesium oxide"}], difficulty:"easy" },
  ],
  TOPIC_3_METALS: [
    { reactants: [{formula:"Fe2O3", coefficient:1, nameZH: "氧化鐵(III)", nameEN: "Iron(III) oxide"}, {formula:"CO", coefficient:3, nameZH: "一氧化碳", nameEN: "Carbon monoxide"}], products: [{formula:"Fe", coefficient:2, nameZH: "鐵", nameEN: "Iron"}, {formula:"CO2", coefficient:3, nameZH: "二氧化碳", nameEN: "Carbon dioxide"}], difficulty:"hard" },
  ],
  TOPIC_4_ACIDS: [
    { reactants: [{formula:"Zn", coefficient:1, nameZH:"鋅", nameEN:"Zinc"}, {formula:"H^+", coefficient:2, nameZH:"氫離子", nameEN:"Hydrogen ion"}], products: [{formula:"Zn^2+", coefficient:1, nameZH:"鋅離子", nameEN:"Zinc ion"}, {formula:"H2", coefficient:1, nameZH:"氫氣", nameEN:"Hydrogen"}], difficulty:"medium" },
    { reactants: [{formula:"Mg", coefficient:1, nameZH:"鎂", nameEN:"Magnesium"}, {formula:"HCl", coefficient:2, nameZH:"鹽酸", nameEN:"Hydrochloric acid"}], products: [{formula:"MgCl2", coefficient:1, nameZH:"氯化鎂", nameEN:"Magnesium chloride"}, {formula:"H2", coefficient:1, nameZH:"氫氣", nameEN:"Hydrogen"}], difficulty:"medium" },
    { reactants: [{formula:"Fe", coefficient:1, nameZH:"鐵", nameEN:"Iron"}, {formula:"H2SO4", coefficient:1, nameZH:"硫酸", nameEN:"Sulphuric acid"}], products: [{formula:"FeSO4", coefficient:1, nameZH:"硫酸亞鐵", nameEN:"Iron(II) sulphate"}, {formula:"H2", coefficient:1, nameZH:"氫氣", nameEN:"Hydrogen"}], difficulty:"medium" },
    { reactants: [{formula:"Zn", coefficient:1, nameZH:"鋅", nameEN:"Zinc"}, {formula:"CH3COOH", coefficient:2, nameZH:"乙酸", nameEN:"Ethanoic acid"}], products: [{formula:"(CH3COO)2Zn", coefficient:1, nameZH:"乙酸鋅", nameEN:"Zinc ethanoate"}, {formula:"H2", coefficient:1, nameZH:"氫氣", nameEN:"Hydrogen"}], difficulty:"hard" },
    { reactants: [{formula:"Mg", coefficient:1, nameZH:"鎂", nameEN:"Magnesium"}, {formula:"CH3COOH", coefficient:2, nameZH:"乙酸", nameEN:"Ethanoic acid"}], products: [{formula:"(CH3COO)2Mg", coefficient:1, nameZH:"乙酸鎂", nameEN:"Magnesium ethanoate"}, {formula:"H2", coefficient:1, nameZH:"氫氣", nameEN:"Hydrogen"}], difficulty:"hard" },
    { reactants: [{formula:"CuO", coefficient:1, nameZH:"氧化銅(II)", nameEN:"Copper(II) oxide"}, {formula:"H2SO4", coefficient:1, nameZH:"硫酸", nameEN:"Sulphuric acid"}], products: [{formula:"CuSO4", coefficient:1, nameZH:"硫酸銅(II)", nameEN:"Copper(II) sulphate"}, {formula:"H2O", coefficient:1, nameZH:"水", nameEN:"Water"}], difficulty:"medium" },
    { reactants: [{formula:"Mg(OH)2", coefficient:1, nameZH:"氫氧化鎂", nameEN:"Magnesium hydroxide"}, {formula:"HCl", coefficient:2, nameZH:"鹽酸", nameEN:"Hydrochloric acid"}], products: [{formula:"MgCl2", coefficient:1, nameZH:"氯化鎂", nameEN:"Magnesium chloride"}, {formula:"H2O", coefficient:2, nameZH:"水", nameEN:"Water"}], difficulty:"medium" },
    { reactants: [{formula:"CaCO3", coefficient:1, nameZH:"碳酸鈣", nameEN:"Calcium carbonate"}, {formula:"HCl", coefficient:2, nameZH:"鹽酸", nameEN:"Hydrochloric acid"}], products: [{formula:"CaCl2", coefficient:1, nameZH:"氯化鈣", nameEN:"Calcium chloride"}, {formula:"CO2", coefficient:1, nameZH:"二氧化碳", nameEN:"Carbon dioxide"}, {formula:"H2O", coefficient:1, nameZH:"水", nameEN:"Water"}], difficulty:"hard" },
    { reactants: [{formula:"NaHCO3", coefficient:1, nameZH:"碳酸氫鈉", nameEN:"Sodium hydrogencarbonate"}, {formula:"HCl", coefficient:1, nameZH:"鹽酸", nameEN:"Hydrochloric acid"}], products: [{formula:"NaCl", coefficient:1, nameZH:"氯化鈉", nameEN:"Sodium chloride"}, {formula:"CO2", coefficient:1, nameZH:"二氧化碳", nameEN:"Carbon dioxide"}, {formula:"H2O", coefficient:1, nameZH:"水", nameEN:"Water"}], difficulty:"medium" },
    { reactants: [{formula:"NaOH", coefficient:2, nameZH:"氫氧化鈉", nameEN:"Sodium hydroxide"}, {formula:"CO2", coefficient:1, nameZH:"二氧化碳", nameEN:"Carbon dioxide"}], products: [{formula:"Na2CO3", coefficient:1, nameZH:"碳酸鈉", nameEN:"Sodium carbonate"}, {formula:"H2O", coefficient:1, nameZH:"水", nameEN:"Water"}], difficulty:"medium" },
    { reactants: [{formula:"NH4Cl", coefficient:1, nameZH:"氯化銨", nameEN:"Ammonium chloride"}, {formula:"NaOH", coefficient:1, nameZH:"氫氧化鈉", nameEN:"Sodium hydroxide"}], products: [{formula:"NH3", coefficient:1, nameZH:"氨", nameEN:"Ammonia"}, {formula:"NaCl", coefficient:1, nameZH:"氯化鈉", nameEN:"Sodium chloride"}, {formula:"H2O", coefficient:1, nameZH:"水", nameEN:"Water"}], difficulty:"medium" },
    { reactants: [{formula:"Cu^2+", coefficient:1, nameZH:"銅(II)離子", nameEN:"Copper(II) ion"}, {formula:"OH^-", coefficient:2, nameZH:"氫氧根離子", nameEN:"Hydroxide ion"}], products: [{formula:"Cu(OH)2", coefficient:1, nameZH:"氫氧化銅(II)", nameEN:"Copper(II) hydroxide"}], difficulty:"easy" },
  ],
  REDOX_HALF: [
    { reactants: [{formula:"MnO4^-", coefficient:1, nameZH: "高錳酸根離子", nameEN: "Permanganate ion"}, {formula:"H^+", coefficient:8, nameZH: "氫離子", nameEN: "Hydrogen ion"}, {formula:"e^-", coefficient:5, nameZH: "電子", nameEN: "Electron"}], products: [{formula:"Mn^2+", coefficient:1, nameZH: "錳(II)離子", nameEN: "Manganese(II) ion"}, {formula:"H2O", coefficient:4, nameZH: "水", nameEN: "Water"}], difficulty:"hard" },
    { reactants: [{formula:"Cr2O7^2-", coefficient:1, nameZH: "重鉻酸根離子", nameEN: "Dichromate ion"}, {formula:"H^+", coefficient:14, nameZH: "氫離子", nameEN: "Hydrogen ion"}, {formula:"e^-", coefficient:6, nameZH: "電子", nameEN: "Electron"}], products: [{formula:"Cr^3+", coefficient:2, nameZH: "鉻(III)離子", nameEN: "Chromium(III) ion"}, {formula:"H2O", coefficient:7, nameZH: "水", nameEN: "Water"}], difficulty:"hard" },
    { reactants: [{formula:"Fe^2+", coefficient:1, nameZH: "亞鐵離子", nameEN: "Iron(II) ion"}], products: [{formula:"Fe^3+", coefficient:1, nameZH: "鐵(III)離子", nameEN: "Iron(III) ion"}, {formula:"e^-", coefficient:1, nameZH: "電子", nameEN: "Electron"}], difficulty: "easy" },
    { reactants: [{formula:"H2C2O4", coefficient:1, nameZH: "乙二酸", nameEN: "Oxalic acid"}], products: [{formula:"CO2", coefficient:2, nameZH: "二氧化碳", nameEN: "Carbon dioxide"}, {formula:"H^+", coefficient:2, nameZH: "氫離子", nameEN: "Hydrogen ion"}, {formula:"e^-", coefficient:2, nameZH: "電子", nameEN: "Electron"}], difficulty: "medium" },
  ],
  REDOX_FULL: [
    { reactants: [{formula:"MnO4^-", coefficient:1, nameZH:"高錳酸根離子", nameEN:"Permanganate ion"}, {formula:"H^+", coefficient:8, nameZH:"氫離子", nameEN:"Hydrogen ion"}, {formula:"Fe^2+", coefficient:5, nameZH:"亞鐵離子", nameEN:"Iron(II) ion"}], products: [{formula:"Mn^2+", coefficient:1, nameZH:"錳(II)離子", nameEN:"Manganese(II) ion"}, {formula:"H2O", coefficient:4, nameZH:"水", nameEN:"Water"}, {formula:"Fe^3+", coefficient:5, nameZH:"鐵(III)離子", nameEN:"Iron(III) ion"}], difficulty:"hard" },
  ] 
};

// 分課題存儲挑戰題目
const CHALLENGES_BY_TOPIC: Record<string, EquationChallenge[]> = {
  TOPIC_1_2: [
    {
      description: "加熱碳酸鈣固體，發生熱分解生成氧化鈣和二氧化碳。",
      reactants: [{ formula: "CaCO3", coefficient: 1 }],
      products: [{ formula: "CaO", coefficient: 1 }, { formula: "CO2", coefficient: 1 }]
    },
    {
      description: "碳酸鈣與水及二氧化碳反應，生成碳酸氫鈣。",
      reactants: [{ formula: "CaCO3", coefficient: 1 }, { formula: "H2O", coefficient: 1 }, { formula: "CO2", coefficient: 1 }],
      products: [{ formula: "Ca(HCO3)2", coefficient: 1 }]
    },
    {
      description: "鈉在氯氣中燃燒生成氯化鈉。",
      reactants: [{ formula: "Na", coefficient: 2 }, { formula: "Cl2", coefficient: 1 }],
      products: [{ formula: "NaCl", coefficient: 2 }]
    },
    {
      description: "Heating calcium carbonate solid to undergo thermal decomposition, forming calcium oxide and carbon dioxide.",
      reactants: [{ formula: "CaCO3", coefficient: 1 }],
      products: [{ formula: "CaO", coefficient: 1 }, { formula: "CO2", coefficient: 1 }]
    }
  ],
  TOPIC_3: [
    {
      description: "鎂在氧氣中燃燒生成氧化鎂。",
      reactants: [{ formula: "Mg", coefficient: 2 }, { formula: "O2", coefficient: 1 }],
      products: [{ formula: "MgO", coefficient: 2 }]
    },
    {
      description: "鋁在氯氣中燃燒生成氯化鋁。",
      reactants: [{ formula: "Al", coefficient: 2 }, { formula: "Cl2", coefficient: 3 }],
      products: [{ formula: "AlCl3", coefficient: 2 }]
    },
    {
      description: "銅片放入硝酸銀溶液中，置換出銀並生成硝酸銅(II)。",
      reactants: [{ formula: "Cu", coefficient: 1 }, { formula: "AgNO3", coefficient: 2 }],
      products: [{ formula: "Cu(NO3)2", coefficient: 1 }, { formula: "Ag", coefficient: 2 }]
    },
    {
      description: "Magnesium burns in oxygen to form magnesium oxide.",
      reactants: [{ formula: "Mg", coefficient: 2 }, { formula: "O2", coefficient: 1 }],
      products: [{ formula: "MgO", coefficient: 2 }]
    }
  ],
  TOPIC_4: [
    {
      description: "鋅與稀鹽酸反應，生成氯化鋅和氫氣。",
      reactants: [{ formula: "Zn", coefficient: 1 }, { formula: "HCl", coefficient: 2 }],
      products: [{ formula: "ZnCl2", coefficient: 1 }, { formula: "H2", coefficient: 1 }]
    },
    {
      description: "氫氧化鈉溶液與稀硫酸反應，發生中和反應生成硫酸鈉和水。",
      reactants: [{ formula: "NaOH", coefficient: 2 }, { formula: "H2SO4", coefficient: 1 }],
      products: [{ formula: "Na2SO4", coefficient: 1 }, { formula: "H2O", coefficient: 2 }]
    },
    {
      description: "碳酸氫鈉與鹽酸反應，生成氯化鈉、二氧化碳和水。",
      reactants: [{ formula: "NaHCO3", coefficient: 1 }, { formula: "HCl", coefficient: 1 }],
      products: [{ formula: "NaCl", coefficient: 1 }, { formula: "CO2", coefficient: 1 }, { formula: "H2O", coefficient: 1 }]
    },
    {
      description: "Zinc reacts with dilute hydrochloric acid to produce zinc chloride and hydrogen gas.",
      reactants: [{ formula: "Zn", coefficient: 1 }, { formula: "HCl", coefficient: 2 }],
      products: [{ formula: "ZnCl2", coefficient: 1 }, { formula: "H2", coefficient: 1 }]
    }
  ],
  TOPIC_6: [
    {
      description: "甲烷在氧氣中完全燃燒，生成二氧化碳和水。",
      reactants: [{ formula: "CH4", coefficient: 1 }, { formula: "O2", coefficient: 2 }],
      products: [{ formula: "CO2", coefficient: 1 }, { formula: "H2O", coefficient: 2 }]
    },
    {
      description: "乙烯在氧氣中完全燃燒，生成二氧化碳和水。",
      reactants: [{ formula: "C2H4", coefficient: 1 }, { formula: "O2", coefficient: 3 }],
      products: [{ formula: "CO2", coefficient: 2 }, { formula: "H2O", coefficient: 2 }]
    },
    {
      description: "Methane burns completely in oxygen to produce carbon dioxide and water.",
      reactants: [{ formula: "CH4", coefficient: 1 }, { formula: "O2", coefficient: 2 }],
      products: [{ formula: "CO2", coefficient: 1 }, { formula: "H2O", coefficient: 2 }]
    }
  ],
  TOPIC_7: [
    {
      description: "氯氣與溴化鉀溶液反應，置換出溴並生成氯化鉀。",
      reactants: [{ formula: "Cl2", coefficient: 1 }, { formula: "KBr", coefficient: 2 }],
      products: [{ formula: "Br2", coefficient: 1 }, { formula: "KCl", coefficient: 2 }]
    },
    {
      description: "鈉與水劇烈反應，生成氫氧化鈉和氫氣。",
      reactants: [{ formula: "Na", coefficient: 2 }, { formula: "H2O", coefficient: 2 }],
      products: [{ formula: "NaOH", coefficient: 2 }, { formula: "H2", coefficient: 1 }]
    },
    {
      description: "Sodium reacts vigorously with water to form sodium hydroxide and hydrogen gas.",
      reactants: [{ formula: "Na", coefficient: 2 }, { formula: "H2O", coefficient: 2 }],
      products: [{ formula: "NaOH", coefficient: 2 }, { formula: "H2", coefficient: 1 }]
    }
  ],
  TOPIC_8: [
    {
      description: "氫氣在氧氣中燃燒生成水。",
      reactants: [{ formula: "H2", coefficient: 2 }, { formula: "O2", coefficient: 1 }],
      products: [{ formula: "H2O", coefficient: 2 }]
    },
    {
      description: "光合作用：二氧化碳和水在光照下生成葡萄糖和氧氣。",
      reactants: [{ formula: "CO2", coefficient: 6 }, { formula: "H2O", coefficient: 6 }],
      products: [{ formula: "C6H12O6", coefficient: 1 }, { formula: "O2", coefficient: 6 }]
    },
    {
      description: "Hydrogen burns in oxygen to form water.",
      reactants: [{ formula: "H2", coefficient: 2 }, { formula: "O2", coefficient: 1 }],
      products: [{ formula: "H2O", coefficient: 2 }]
    }
  ]
};

export const generateEquations = async (count: number = 5, topic: EquationTopic = 'TOPIC_3_METALS', language: Language = 'ZH', history: string[] = []): Promise<{ data: ChemicalEquation[], isOffline: boolean }> => {
  let pool: ChemicalEquation[] = [];
  if (topic === 'TOPIC_1_2_EARTH_MICRO') pool = [...MASTER_EQUATIONS.TOPIC_1_EARTH, ...MASTER_EQUATIONS.TOPIC_2_MICRO];
  else pool = [...(MASTER_EQUATIONS[topic as string] || [])];
  return { data: shuffleArray(pool).slice(0, count), isOffline: true };
};

export const generateIons = async (count: number = 6, difficulty: string = 'medium', category: 'MONO' | 'POLY' | 'MIXED' = 'MIXED'): Promise<Ion[]> => {
  return []; 
};

export const evaluateHandwrittenAnswers = async (imageBase64: string, questions: any[]): Promise<EvaluationResult> => {
  return { score: 0, results: [], overallFeedback: "" };
};

export const generateBuilderChallenges = async (count: number = 3, language: Language = 'ZH'): Promise<{ data: EquationChallenge[], isOffline: boolean }> => {
  const isZH = language === 'ZH';
  
  // 按照 1-8 課題順序抽取題目
  const orderedTopics = ['TOPIC_1_2', 'TOPIC_3', 'TOPIC_4', 'TOPIC_6', 'TOPIC_7', 'TOPIC_8'];
  const selected: EquationChallenge[] = [];

  orderedTopics.forEach(topicKey => {
    const topicPool = CHALLENGES_BY_TOPIC[topicKey] || [];
    // 過濾語言
    const filteredPool = topicPool.filter(c => {
      const hasChinese = /[\u4e00-\u9fa5]/.test(c.description);
      return isZH ? hasChinese : !hasChinese;
    });

    if (filteredPool.length > 0) {
      // 隨機挑選一個該課題的題目，確保每次進入描述不同
      const randomChallenge = filteredPool[Math.floor(Math.random() * filteredPool.length)];
      selected.push(randomChallenge);
    }
  });

  // 如果抽取到的數量超過請求的 count，則截斷（或根據需要返回全部）
  // 這裡我們返回 selected 中按順序的前 count 個
  return { data: selected.slice(0, count), isOffline: true };
};
