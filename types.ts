
export enum Screen {
  HOME = 'HOME',
  LEVEL_1 = 'LEVEL_1', // Ion Mastery (Memory Game)
  LEVEL_2 = 'LEVEL_2', // Equation Balancing
  LEVEL_3 = 'LEVEL_3', // Equation Builder (Writing Equations)
}

export type Language = 'ZH' | 'EN';

export interface QuizRecord {
  score: number;       // 0 - 100 (or raw score)
  totalQuestions: number;
  timeTaken: number;   // in seconds
  timestamp: number;   // when the quiz was taken
}

export interface Stage5Answer {
  question: string;
  expected: string;
  userAnswer: string;
  isCorrect: boolean;
}

export interface UserProfile {
  name: string;
  progress: {
    level1MaxStage: number; // 1 to 12
  };
  quizRecord?: QuizRecord; // General record
  stage5Result?: {
    score: number;
    timeTaken: number;
    timestamp: number;
    details: Stage5Answer[];
  };
  stage9Result?: {
    score: number;
    timestamp: number;
  };
  stage12Result?: {
    score: number;
    timestamp: number;
    details: {
      question: string;
      expected: string;
      userAnswer: string;
      isCorrect: boolean;
    }[];
  };
  challengeAttempts?: number; 
  challengeRecord?: {
    bestScore: number;
    bestTime: number; 
    timestamp: number;
  };
}

export interface Ion {
  id?: string;
  formula: string;
  chineseName: string;
  englishName: string;
  type: 'Cation' | 'Anion';
  charge: number;
}

export interface GameCard {
  id: string;
  ionIndex: number;
  content: string;
  type: 'FORMULA' | 'NAME';
  isFlipped: boolean;
  isMatched: boolean;
}

export interface EquationComponent {
  formula: string;
  nameZH?: string;
  nameEN?: string;
  coefficient: number;
}

export interface ChemicalEquation {
  reactants: EquationComponent[];
  products: EquationComponent[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface EquationChallenge {
  description: string;
  reactants: EquationComponent[];
  products: EquationComponent[];
}

export type QuestionType = 'NAME_TO_FORMULA' | 'FORMULA_TO_NAME';

export type EquationTopic = 
  | 'TOPIC_1_2_EARTH_MICRO' // 合併課題 1 & 2
  | 'TOPIC_1_EARTH'        // 地球
  | 'TOPIC_2_MICRO'        // 微觀世界
  | 'TOPIC_3_METALS'       // 金屬
  | 'TOPIC_4_ACIDS'        // 酸鹼鹽
  | 'TOPIC_6_ORGANIC'      // 有機/化石燃料
  | 'TOPIC_7_PERIODICITY'  // 週期律
  | 'TOPIC_8_ENERGETICS'   // 化學能量
  | 'REDOX_HALF'           // 氧化還原半反應
  | 'REDOX_FULL';          // 氧化還原全反應
