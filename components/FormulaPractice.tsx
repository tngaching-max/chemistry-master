
import React, { useState, useEffect, useRef } from 'react';
import { generateIons, evaluateHandwrittenAnswers, EvaluationResult } from '../services/geminiService';
import { Ion, Language, GameCard, UserProfile, QuizRecord, Stage5Answer } from '../types';
import { formatFormula } from '../utils';

interface Props {
  onBack: () => void;
  language: Language;
  user: UserProfile;
  onUserUpdate: (user: UserProfile) => void;
  onProgressUpdate: (newMaxStage: number) => void;
}

interface ElementData {
  atomic: number;
  symbol: string;
  zh: string;
  en: string;
  col: number; 
  row: number; 
}

interface MasteryQuestion {
  el: ElementData;
  mode: 'TO_SYMBOL' | 'TO_NAME';
}

interface CompoundQuestion {
  nameZH: string;
  nameEN: string;
  formula: string;
}

interface AdvancedCompoundQuestion extends CompoundQuestion {
  mode: 'NAME_TO_FORMULA' | 'FORMULA_TO_NAME';
}

const ELEMENTS_1_20: ElementData[] = [
  { atomic: 1, symbol: 'H', zh: '氫', en: 'Hydrogen', row: 1, col: 9 }, 
  { atomic: 2, symbol: 'He', zh: '氦', en: 'Helium', row: 1, col: 18 },
  { atomic: 3, symbol: 'Li', zh: '鋰', en: 'Lithium', row: 2, col: 1 },
  { atomic: 4, symbol: 'Be', zh: '鈹', en: 'Beryllium', row: 2, col: 2 },
  { atomic: 5, symbol: 'B', zh: '硼', en: 'Boron', row: 2, col: 13 },
  { atomic: 6, symbol: 'C', zh: '碳', en: 'Carbon', row: 2, col: 14 },
  { atomic: 7, symbol: 'N', zh: '氮', en: 'Nitrogen', row: 2, col: 15 },
  { atomic: 8, symbol: 'O', zh: '氧', en: 'Oxygen', row: 2, col: 16 },
  { atomic: 9, symbol: 'F', zh: '氟', en: 'Fluorine', row: 2, col: 17 },
  { atomic: 10, symbol: 'Ne', zh: '氖', en: 'Neon', row: 2, col: 18 },
  { atomic: 11, symbol: 'Na', zh: '鈉', en: 'Sodium', row: 3, col: 1 },
  { atomic: 12, symbol: 'Mg', zh: '鎂', en: 'Magnesium', row: 3, col: 2 },
  { atomic: 13, symbol: 'Al', zh: '鋁', en: 'Aluminium', row: 3, col: 13 },
  { atomic: 14, symbol: 'Si', zh: '硅', en: 'Silicon', row: 3, col: 14 },
  { atomic: 15, symbol: 'P', zh: '磷', en: 'Phosphorus', row: 3, col: 15 },
  { atomic: 16, symbol: 'S', zh: '硫', en: 'Sulphur', row: 3, col: 16 },
  { atomic: 17, symbol: 'Cl', zh: '氯', en: 'Chlorine', row: 3, col: 17 },
  { atomic: 18, symbol: 'Ar', zh: '氬', en: 'Argon', row: 3, col: 18 },
  { atomic: 19, symbol: 'K', zh: '鉀', en: 'Potassium', row: 4, col: 1 },
  { atomic: 20, symbol: 'Ca', zh: '鈣', en: 'Calcium', row: 4, col: 2 },
];

const METALS_STAGE_3: ElementData[] = [
  { atomic: 24, symbol: 'Cr', zh: '鉻', en: 'Chromium', row: 4, col: 6 },
  { atomic: 27, symbol: 'Co', zh: '鈷', en: 'Cobalt', row: 4, col: 9 },
  { atomic: 79, symbol: 'Au', zh: '金', en: 'Gold', row: 6, col: 11 },
  { atomic: 82, symbol: 'Pb', zh: '鉛', en: 'Lead', row: 6, col: 14 },
  { atomic: 26, symbol: 'Fe', zh: '鐵', en: 'Iron', row: 4, col: 8 },
  { atomic: 29, symbol: 'Cu', zh: '銅', en: 'Copper', row: 4, col: 11 },
  { atomic: 25, symbol: 'Mn', zh: '錳', en: 'Manganese', row: 4, col: 7 },
  { atomic: 80, symbol: 'Hg', zh: '汞', en: 'Mercury', row: 6, col: 12 },
  { atomic: 28, symbol: 'Ni', zh: '鎳', en: 'Nickel', row: 4, col: 10 },
  { atomic: 78, symbol: 'Pt', zh: '鉑', en: 'Platinum', row: 6, col: 10 },
  { atomic: 47, symbol: 'Ag', zh: '銀', en: 'Silver', row: 5, col: 11 },
  { atomic: 50, symbol: 'Sn', zh: '錫', en: 'Tin', row: 5, col: 14 },
  { atomic: 30, symbol: 'Zn', zh: '鋅', en: 'Zinc', row: 4, col: 12 },
];

const COMPOUNDS_DATA: CompoundQuestion[] = [
  { nameZH: "氧化鎂", nameEN: "Magnesium oxide", formula: "MgO" },
  { nameZH: "氯化鈉", nameEN: "Sodium chloride", formula: "NaCl" },
  { nameZH: "氯化鈣", nameEN: "Calcium chloride", formula: "CaCl2" },
  { nameZH: "氧化鋁", nameEN: "Aluminium oxide", formula: "Al2O3" },
  { nameZH: "硫化鉀", nameEN: "Potassium sulphide", formula: "K2S" },
  { nameZH: "氯化鐵(II)", nameEN: "Iron(II) chloride", formula: "FeCl2" },
  { nameZH: "氧化銀", nameEN: "Silver oxide", formula: "Ag2O" },
  { nameZH: "氯化鋁", nameEN: "Aluminium chloride", formula: "AlCl3" },
  { nameZH: "氫氧化鈉", nameEN: "Sodium hydroxide", formula: "NaOH" },
  { nameZH: "硫酸鋅", nameEN: "Zinc sulphate", formula: "ZnSO4" },
  { nameZH: "碳酸鈣", nameEN: "Calcium carbonate", formula: "CaCO3" },
  { nameZH: "硝酸鋇", nameEN: "Barium nitrate", formula: "Ba(NO3)2" },
  { nameZH: "氯化銅(II)", nameEN: "Copper(II) chloride", formula: "CuCl2" },
  { nameZH: "硝酸鉛(II)", nameEN: "Lead(II) nitrate", formula: "Pb(NO3)2" },
  { nameZH: "硫酸鐵(III)", nameEN: "Iron(III) sulphate", formula: "Fe2(SO4)3" },
  { nameZH: "氯化銅(I)", nameEN: "Copper(I) chloride", formula: "CuCl" },
];

const ADVANCED_COMPOUNDS: CompoundQuestion[] = [
  { nameZH: "高錳酸鉀", nameEN: "Potassium permanganate", formula: "KMnO4" },
  { nameZH: "碳酸鈉", nameEN: "Sodium carbonate", formula: "Na2CO3" },
  { nameZH: "硫酸銨", nameEN: "Ammonium sulphate", formula: "(NH4)2SO4" },
  { nameZH: "氫氧化鐵(III)", nameEN: "Iron(III) hydroxide", formula: "Fe(OH)3" },
  { nameZH: "硝酸銀", nameEN: "Silver nitrate", formula: "AgNO3" },
  { nameZH: "硝酸鋅", nameEN: "Zinc nitrate", formula: "Zn(NO3)2" },
  { nameZH: "重鉻酸鉀", nameEN: "Potassium dichromate", formula: "K2Cr2O7" },
  { nameZH: "氯化鉛(II)", nameEN: "Lead(II) chloride", formula: "PbCl2" },
  { nameZH: "碳酸氫鎂", nameEN: "Magnesium hydrogencarbonate", formula: "Mg(HCO3)2" },
  { nameZH: "氯化銨", nameEN: "Ammonium chloride", formula: "NH4Cl" },
  { nameZH: "硫酸鋇", nameEN: "Barium sulphate", formula: "BaSO4" },
  { nameZH: "氫氧化鈣", nameEN: "Calcium hydroxide", formula: "Ca(OH)2" },
];

const getGlobalLeaderboard = (stage: 5 | 9 | 12) => {
    const rawData = localStorage.getItem('chemistry_master_users_v1');
    if (!rawData) return [];
    const allUsers: Record<string, UserProfile> = JSON.parse(rawData);
    let key: 'stage5Result' | 'stage9Result' | 'stage12Result';
    if (stage === 5) key = 'stage5Result';
    else if (stage === 9) key = 'stage9Result';
    else key = 'stage12Result';
    return Object.values(allUsers).filter(u => u[key]).sort((a, b) => b[key]!.score - a[key]!.score).slice(0, 10);
};

const FormulaPractice: React.FC<Props> = ({ onBack, language, user, onUserUpdate, onProgressUpdate }) => {
  const [activeStage, setActiveStage] = useState(0); 
  const [completedStages, setCompletedStages] = useState<number[]>([]);

  // 從 UserProfile 加載已完成的階段紀錄
  useEffect(() => {
    const done = [];
    if (user.stage5Result) done.push(5);
    if (user.stage9Result) done.push(9);
    if (user.stage12Result) done.push(12);
    // 基礎練習 1-4 只要完成就會記錄在 localState
    setCompletedStages(prev => Array.from(new Set([...prev, ...done])));
  }, [user]);

  const handleStageComplete = (completedStageNum: number) => {
    setCompletedStages(prev => Array.from(new Set([...prev, completedStageNum])));
    setActiveStage(0); 
  };

  const renderStage = () => {
    switch(activeStage) {
      case 1: return <Stage1_Ordering onComplete={() => handleStageComplete(1)} onBack={() => setActiveStage(0)} language={language} />;
      case 2: return <Stage2_Writing1to20 onComplete={() => handleStageComplete(2)} onBack={() => setActiveStage(0)} language={language} />;
      case 3: return <Stage3_WritingMetals onComplete={() => handleStageComplete(3)} onBack={() => setActiveStage(0)} language={language} />;
      case 4: return <Stage4_MasteryTest onComplete={() => handleStageComplete(4)} onBack={() => setActiveStage(0)} language={language} />;
      case 5: return <Stage5_OneTimeTest onComplete={() => handleStageComplete(5)} onBack={() => setActiveStage(0)} language={language} user={user} onUserUpdate={onUserUpdate} />;
      case 6: return <MemoryGameStage difficulty="EASY" stageNum={6} onComplete={() => handleStageComplete(6)} onBack={() => setActiveStage(0)} language={language} />;
      case 7: return <MemoryGameStage difficulty="MEDIUM" stageNum={7} onComplete={() => handleStageComplete(7)} onBack={() => setActiveStage(0)} language={language} />;
      case 8: return <MemoryGameStage difficulty="HARD" stageNum={8} onComplete={() => handleStageComplete(8)} onBack={() => setActiveStage(0)} language={language} />;
      case 9: return <Stage9_SynthesisTest onComplete={() => handleStageComplete(9)} onBack={() => setActiveStage(0)} language={language} user={user} onUserUpdate={onUserUpdate} />;
      case 10: return <Stage10_CompoundWriting onComplete={() => handleStageComplete(10)} onBack={() => setActiveStage(0)} language={language} />;
      case 11: return <Stage11_AdvancedCompounds onComplete={() => handleStageComplete(11)} onBack={() => setActiveStage(0)} language={language} />;
      case 12: return <Stage12_FinalCompoundHandwrittenTest onComplete={() => handleStageComplete(12)} onBack={() => setActiveStage(0)} language={language} user={user} onUserUpdate={onUserUpdate} />;
      default: return (
        <StageMenu 
          completedStages={completedStages} 
          onSelectStage={setActiveStage} 
          onBack={onBack} 
          language={language} 
          user={user}
        />
      );
    }
  };

  return <div className="w-full">{renderStage()}</div>;
};

// --- Common UI Components ---

const Header: React.FC<{title: string, step: string, onBack: () => void, instruction: string}> = ({title, step, onBack, instruction}) => (
  <div className="mb-8">
    <div className="flex justify-between items-center mb-6">
      <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium text-lg flex items-center">
        <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back
      </button>
      <div className="text-base font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">{step}</div>
    </div>
    <div className="text-center">
      <h1 className="text-4xl font-bold text-slate-800 mb-3">{title}</h1>
      <p className="text-slate-500 text-lg">{instruction}</p>
    </div>
  </div>
);

const HonestyDeclaration: React.FC<{onStart: () => void, onBack: () => void, language: Language, title: string}> = ({onStart, onBack, language, title}) => {
    const isZH = language === 'ZH';
    return (
        <div className="max-w-xl mx-auto px-4 py-10 animate-fade-in">
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
                <div className="inline-block px-4 py-1 rounded-full bg-rose-50 text-rose-600 text-sm font-black mb-6 tracking-tight uppercase">
                    {isZH ? "正式評測 • 僅限一次機會" : "Official Assessment • One Attempt Only"}
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl text-left mb-8 border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        {isZH ? "誠實宣言" : "Honesty Declaration"}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                        {isZH ? "我承諾在測驗過程中保持誠實，獨立完成所有題目，不翻閱教科書、筆記或使用網絡資源尋找答案。" : "I promise to complete this test independently and honestly, without referring to any books, notes, or internet resources."}
                    </p>
                </div>
                <button onClick={onStart} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all mb-4">
                    {isZH ? "我已準備好，開始測驗" : "I'm ready, Start Test"}
                </button>
                <button onClick={onBack} className="w-full py-3 text-slate-400 hover:text-slate-600 font-bold transition-colors">
                    {isZH ? "先去練習，晚點再來" : "Go practice first, come back later"}
                </button>
            </div>
        </div>
    );
};

const StageMenu: React.FC<{ completedStages: number[]; onSelectStage: (stage: number) => void; onBack: () => void; language: Language; user: UserProfile }> = ({ completedStages, onSelectStage, onBack, language, user }) => {
  const isZH = language === 'ZH';
  const stages = [
    { id: 1, title: isZH ? "週期表排序 (1-20)" : "Order Elements (1-20)", icon: "🧩" },
    { id: 2, title: isZH ? "元素符號書寫 (1-20)" : "Write Symbols (1-20)", icon: "✏️" },
    { id: 3, title: isZH ? "常見金屬符號" : "Common Metals", icon: "⚒️" },
    { id: 4, title: isZH ? "綜合精通練習" : "Mastery Practice", icon: "🎯" },
    { id: 5, title: isZH ? "限時終極測驗" : "Final Timed Test", icon: "🏆", isTest: true },
    { id: 6, title: isZH ? "離子翻牌 (初級)" : "Ion Match (Easy)", icon: "🟢" },
    { id: 7, title: isZH ? "離子翻牌 (中級)" : "Ion Match (Med)", icon: "🟡" },
    { id: 8, title: isZH ? "離子翻牌 (高級)" : "Ion Match (Hard)", icon: "🔴" },
    { id: 9, title: isZH ? "離子手寫綜合測試" : "Ion Synthesis Test", icon: "👑", isTest: true },
    { id: 10, title: isZH ? "化合物化學式書寫" : "Compound Writing", icon: "🧪" },
    { id: 11, title: isZH ? "進階離子化合物書寫" : "Advanced Compounds", icon: "🧬" },
    { id: 12, title: isZH ? "化合物手寫終極測試" : "Final Compound Test", icon: "🎖️", isTest: true },
  ];

  const totalScore = (user.stage5Result?.score || 0) + (user.stage9Result?.score || 0) + (user.stage12Result?.score || 0);
  const isAllTestsDone = !!user.stage12Result;

  const medal = isAllTestsDone ? (
    totalScore >= 45 ? { name: isZH ? "💎 鑽石大師勳章" : "💎 Perfect Master", color: "from-sky-400 to-indigo-500", icon: "💎" } :
    totalScore >= 35 ? { name: isZH ? "🥇 金級精英勳章" : "🥇 Gold Expert", color: "from-amber-400 to-orange-500", icon: "🥇" } :
    totalScore >= 20 ? { name: isZH ? "🥈 銀級進取勳章" : "🥈 Silver Learner", color: "from-slate-300 to-slate-500", icon: "🥈" } :
    { name: isZH ? "🥉 銅級潛力勳章" : "🥉 Bronze Starter", color: "from-orange-600 to-red-800", icon: "🥉" }
  ) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 animate-fade-in mb-20">
       <div className="mb-8">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium text-lg flex items-center mb-6">
          <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          {isZH ? "返回主頁" : "Back Home"}
        </button>
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">{isZH ? "第一關：元素與離子特訓" : "Level 1: Elements & Ions"}</h1>
          <p className="text-slate-500 text-xl mb-12">{isZH ? "所有關卡已開放，你可以按任何順序練習或進行測驗。" : "All stages are unlocked. You can practice or take tests in any order."}</p>
          {medal && (
             <div className="flex flex-col items-center mb-12 animate-pop">
                <div className={`p-8 md:p-12 rounded-[3rem] bg-gradient-to-br ${medal.color} text-white shadow-2xl relative overflow-hidden text-center max-w-lg w-full`}>
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
                   <div className="text-7xl mb-4 drop-shadow-md">{medal.icon}</div>
                   <div className="text-4xl font-black mb-4">{medal.name}</div>
                   <div className="inline-block px-6 py-2 rounded-full bg-black/10 border border-white/20 font-bold">
                      {isZH ? `Level 1 測驗總分：${totalScore} / 45` : `Level 1 Total Score: ${totalScore} / 45`}
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage) => {
          const isCompleted = (stage.isTest && (
            (stage.id === 5 && !!user.stage5Result) || 
            (stage.id === 9 && !!user.stage9Result) || 
            (stage.id === 12 && !!user.stage12Result)
          )) || completedStages.includes(stage.id);

          return (
            <button
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className="relative p-6 rounded-2xl border-2 text-left transition-all duration-300 flex items-center overflow-hidden min-h-[110px] bg-white border-indigo-100 shadow-sm hover:border-indigo-400 hover:shadow-md hover:-translate-y-1 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-3xl font-bold mr-5 flex-shrink-0 bg-indigo-50 text-indigo-600">
                {stage.icon}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-slate-400">{isZH ? `階段 ${stage.id}` : `Stage ${stage.id}`} {stage.isTest && <span className="ml-1 text-rose-400">● 測驗</span>}</div>
                <div className="font-bold text-lg leading-tight text-slate-800">{stage.title}</div>
              </div>
              {isCompleted && <div className="absolute top-2 right-2 text-emerald-500"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg></div>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- STAGE COMPONENTS 1-4 ---

const Stage1_Ordering: React.FC<{ onComplete: () => void, onBack: () => void, language: Language }> = ({ onComplete, onBack, language }) => {
  const isZH = language === 'ZH';
  const [placedElements, setPlacedElements] = useState<number[]>([]); 
  const [shuffledChips, setShuffledChips] = useState<ElementData[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  useEffect(() => { setShuffledChips([...ELEMENTS_1_20].sort(() => 0.5 - Math.random())); }, []);
  const handlePointerDown = (e: React.PointerEvent, atomic: number) => {
    const target = e.currentTarget as HTMLElement; const rect = target.getBoundingClientRect();
    setDraggingId(atomic); setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDragPos({ x: e.clientX, y: e.clientY }); target.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => { if (draggingId !== null) setDragPos({ x: e.clientX, y: e.clientY }); };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId === null) return;
    const target = e.target as HTMLElement; target.releasePointerCapture(e.pointerId);
    const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
    const slot = dropTarget?.closest('[data-slot-id]'); 
    if (slot) {
      const slotId = parseInt(slot.getAttribute('data-slot-id') || '0', 10);
      if (slotId === draggingId) setPlacedElements(prev => [...prev, draggingId]);
    }
    setDraggingId(null);
  };
  const isComplete = placedElements.length === ELEMENTS_1_20.length;
  const draggingElementData = ELEMENTS_1_20.find(e => e.atomic === draggingId);
  return (
    <div className="max-w-4xl mx-auto px-2 animate-fade-in relative min-h-screen flex flex-col overflow-hidden touch-none">
      <Header title={isZH ? "階段 1: 週期表排序 (1-20)" : "Stage 1: Order Elements 1-20"} step="1/12" onBack={onBack} instruction={isZH ? "拖曳卡牌到正確位置。" : "Drag cards to the correct spot."} />
      <div className="bg-white/80 backdrop-blur p-4 rounded-xl shadow-md border border-slate-200 mb-4 overflow-x-auto">
        <div className="grid grid-cols-[repeat(18,minmax(30px,1fr))] gap-1 w-full mx-auto max-w-[800px]">
          {ELEMENTS_1_20.map((el) => {
            const isFilled = placedElements.includes(el.atomic);
            return (
              <div key={el.atomic} data-slot-id={el.atomic} className={`aspect-[3/4] rounded border flex items-center justify-center relative ${isFilled ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-300'}`} style={{ gridColumn: el.col, gridRow: el.row }}>
                <span className="absolute top-0.5 left-0.5 text-[8px] text-slate-400">{el.atomic}</span>
                <span className={`font-bold ${isFilled ? 'text-sm md:text-xl' : 'text-[10px]'}`}>{isFilled ? el.symbol : el.atomic}</span>
              </div>
            );
          })}
        </div>
      </div>
      {!isComplete ? (
         <div className="bg-white p-4 rounded-t-2xl shadow-lg border-t min-h-[180px]">
           <div className="flex flex-wrap justify-center gap-2 touch-none">
             {shuffledChips.filter(el => !placedElements.includes(el.atomic)).map((el) => (
               <div key={el.atomic} onPointerDown={(e) => handlePointerDown(e, el.atomic)} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} className={`w-12 h-12 md:w-16 md:h-16 rounded-lg border-2 font-bold flex flex-col items-center justify-center shadow-sm cursor-grab bg-white text-slate-700 border-slate-200 ${draggingId === el.atomic ? 'opacity-0' : ''}`}>
                 <span className="text-lg md:text-xl">{el.symbol}</span>
               </div>
             ))}
           </div>
         </div>
      ) : (
        <div className="text-center py-8 animate-pop"><button onClick={onComplete} className="px-10 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg">{isZH ? "完成並返回選單" : "Complete & Return"}</button></div>
      )}
      {draggingId && draggingElementData && (
        <div className="fixed w-14 h-14 md:w-20 md:h-20 rounded-lg border-2 border-indigo-500 bg-indigo-600 text-white font-bold flex flex-col items-center justify-center shadow-xl z-50 pointer-events-none" style={{ left: dragPos.x - dragOffset.x, top: dragPos.y - dragOffset.y }}>
            <span className="text-xl md:text-2xl">{draggingElementData.symbol}</span>
        </div>
      )}
    </div>
  );
};

const Stage2_Writing1to20: React.FC<{ onComplete: () => void, onBack: () => void, language: Language }> = ({ onComplete, onBack, language }) => {
  const isZH = language === 'ZH';
  const [inputs, setInputs] = useState<{[key: number]: string}>({}); const [status, setStatus] = useState<{[key: number]: 'correct'|'error'}>({});
  const checkAll = () => {
    const newStatus: {[key: number]: 'correct'|'error'} = {}; let allCorrect = true;
    ELEMENTS_1_20.forEach(el => {
      if ((inputs[el.atomic] || '').trim() === el.symbol) newStatus[el.atomic] = 'correct';
      else { newStatus[el.atomic] = 'error'; allCorrect = false; }
    });
    setStatus(newStatus); if (allCorrect) setTimeout(onComplete, 1000);
  };
  return (
    <div className="max-w-6xl mx-auto px-2 animate-fade-in">
       <Header title={isZH ? "階段 2: 元素符號書寫" : "Stage 2: Write Symbols"} step="2/12" onBack={onBack} instruction={isZH ? "輸入 1-20 號元素符號 (注意大小寫)。" : "Type symbols 1-20 (Case-sensitive)."} />
       <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 mb-8 overflow-x-auto">
        <div className="grid grid-cols-[repeat(18,minmax(40px,1fr))] gap-2">
          {ELEMENTS_1_20.map((el) => (
            <div key={el.atomic} className={`aspect-square rounded border flex flex-col items-center justify-center relative ${status[el.atomic] === 'correct' ? 'bg-emerald-50 border-emerald-300' : status[el.atomic] === 'error' ? 'bg-red-50 border-red-300' : 'bg-white'}`} style={{ gridColumn: el.col, gridRow: el.row }}>
              <span className="absolute top-0.5 left-1 text-[10px] text-slate-400">{el.atomic}</span>
              {status[el.atomic] === 'correct' ? <span className="text-emerald-700 font-bold">{el.symbol}</span> : <input type="text" className="w-full text-center bg-transparent outline-none font-bold" value={inputs[el.atomic] || ''} onChange={(e) => setInputs({...inputs, [el.atomic]: e.target.value})} maxLength={2} />}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center"><button onClick={checkAll} className="px-12 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">{isZH ? "檢查答案" : "Check Answers"}</button></div>
    </div>
  );
};

const Stage3_WritingMetals: React.FC<{ onComplete: () => void, onBack: () => void, language: Language }> = ({ onComplete, onBack, language }) => {
  const isZH = language === 'ZH';
  const [inputs, setInputs] = useState<{[key: number]: string}>({}); const [submitted, setSubmitted] = useState(false);
  const check = () => setSubmitted(true);
  const allCorrect = submitted && METALS_STAGE_3.every(el => (inputs[el.atomic] || '').trim() === el.symbol);
  return (
    <div className="max-w-5xl mx-auto px-4 animate-fade-in">
       <Header title={isZH ? "階段 3: 常見金屬符號" : "Stage 3: Common Metals"} step="3/12" onBack={onBack} instruction={isZH ? "寫出對應的金屬符號 (注意大小寫)。" : "Write the symbols for common metals (Case-sensitive)."} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {METALS_STAGE_3.map(el => (
             <div key={el.atomic} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                <div className="text-slate-600 mb-2 font-medium">{isZH ? el.zh : el.en}</div>
                <input type="text" className={`w-24 h-16 text-center text-3xl font-bold border-b-2 outline-none ${submitted && (inputs[el.atomic] || '').trim() !== el.symbol ? 'border-red-400 text-rose-600' : 'border-indigo-200'}`} value={inputs[el.atomic] || ''} onChange={(e) => setInputs({...inputs, [el.atomic]: e.target.value})} maxLength={2} />
             </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-6">
         {!allCorrect ? <button onClick={check} className="px-12 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg">{isZH ? "檢查答案" : "Check Answers"}</button> : <button onClick={onComplete} className="px-12 py-4 bg-emerald-600 text-white font-bold rounded-xl shadow-lg animate-pop">{isZH ? "完成並返回選單" : "Complete & Return"}</button>}
      </div>
    </div>
  );
};

const Stage4_MasteryTest: React.FC<{ onComplete: () => void, onBack: () => void, language: Language }> = ({ onComplete, onBack, language }) => {
  const isZH = language === 'ZH';
  const [questions, setQuestions] = useState<MasteryQuestion[]>([]);
  const [inputs, setInputs] = useState<{[key: number]: string}>({});
  const [results, setResults] = useState<{[key: number]: 'correct' | 'wrong' | 'none'}>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const allItems = [...ELEMENTS_1_20, ...METALS_STAGE_3];
    const shuffled = allItems.sort(() => 0.5 - Math.random()).slice(0, 15);
    const qs: MasteryQuestion[] = shuffled.map(el => ({ el, mode: Math.random() > 0.5 ? 'TO_SYMBOL' : 'TO_NAME' }));
    setQuestions(qs);
  }, []);

  const checkAnswers = () => {
    const newResults: {[key: number]: 'correct' | 'wrong'} = {};
    questions.forEach((q, idx) => {
      const userVal = (inputs[idx] || '').trim();
      let correctVal = q.mode === 'TO_SYMBOL' ? q.el.symbol : (isZH ? q.el.zh : q.el.en);
      const isCorrect = q.mode === 'TO_SYMBOL' ? userVal === correctVal : userVal.toLowerCase() === correctVal.toLowerCase();
      newResults[idx] = isCorrect ? 'correct' : 'wrong';
    });
    setResults(newResults);
    setSubmitted(true);
  };

  const allCorrect = submitted && Object.values(results).every(r => r === 'correct');

  return (
    <div className="max-w-5xl mx-auto px-4 mb-20 animate-fade-in">
      <Header title={isZH ? "階段 4: 綜合精通練習" : "Stage 4: Mastery Practice"} step="4/12" onBack={onBack} instruction={isZH ? "寫出對應的符號或名稱 (注意符號大小寫需正確)。" : "Write symbol/name (Symbols must be correctly cased)."} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {questions.map((q, idx) => (
          <div key={idx} className={`p-4 rounded-xl border-2 transition-all bg-white flex flex-col ${results[idx] === 'correct' ? 'border-emerald-200 bg-emerald-50' : results[idx] === 'wrong' ? 'border-rose-200 bg-rose-50' : 'border-slate-100'}`}>
            <div className="text-slate-400 text-xs font-bold mb-2">#{idx + 1}</div>
            <div className="text-2xl font-bold text-slate-800 mb-3 text-center py-2">{q.mode === 'TO_SYMBOL' ? (isZH ? q.el.zh : q.el.en) : q.el.symbol}</div>
            <input type="text" className={`w-full p-2 border-2 rounded-lg outline-none transition-all text-center ${results[idx] === 'wrong' ? 'border-rose-300' : results[idx] === 'correct' ? 'border-emerald-300 bg-white' : 'border-slate-200 focus:border-indigo-400'}`} value={inputs[idx] || ''} onChange={(e) => { setInputs({...inputs, [idx]: e.target.value}); if (submitted) setResults({...results, [idx]: 'none'}); }} placeholder={q.mode === 'TO_SYMBOL' ? (isZH ? "輸入符號" : "Symbol") : (isZH ? "輸入名稱" : "Name")} />
            {results[idx] === 'wrong' && (
              <div className="mt-2 text-[11px] text-rose-500 font-bold text-center normal-case">
                {isZH ? "正確：" : "Correct: "} <span className="font-mono">{q.mode === 'TO_SYMBOL' ? q.el.symbol : (isZH ? q.el.zh : q.el.en)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center">
        {!allCorrect ? <button onClick={checkAnswers} className="px-16 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">{isZH ? "檢查答案" : "Check Answers"}</button> : (
          <div className="animate-pop text-center">
            <div className="text-emerald-600 text-xl font-bold mb-6 flex items-center justify-center"><svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>{isZH ? "全對！做得好！已達成進度。" : "Perfect! Well done! Progress saved."}</div>
            <button onClick={onComplete} className="px-20 py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-2xl hover:bg-emerald-700 hover:scale-105 transition-all">{isZH ? "完成並返回選單" : "Complete & Return"}</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- STAGE 5: ONE-TIME TEST ---

const Stage5_OneTimeTest: React.FC<{ onComplete: () => void, onBack: () => void, language: Language, user: UserProfile, onUserUpdate: (u: UserProfile) => void }> = ({ onComplete, onBack, language, user, onUserUpdate }) => {
  const isZH = language === 'ZH';
  const [questions, setQuestions] = useState<MasteryQuestion[]>([]);
  const [inputs, setInputs] = useState<{[key: number]: string}>({});
  const [timeLeft, setTimeLeft] = useState(240); 
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(!!user.stage5Result);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!user.stage5Result && questions.length === 0) {
      const allItems = [...ELEMENTS_1_20, ...METALS_STAGE_3];
      const shuffled = allItems.sort(() => 0.5 - Math.random()).slice(0, 15);
      const qs: MasteryQuestion[] = shuffled.map(el => ({ el, mode: Math.random() > 0.5 ? 'TO_SYMBOL' : 'TO_NAME' }));
      setQuestions(qs);
    }
  }, [user.stage5Result]);

  useEffect(() => {
    if (isStarted && !isFinished && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && !isFinished) {
      handleSubmit();
    }
    return () => clearInterval(timerRef.current);
  }, [isStarted, isFinished, timeLeft]);

  const handleSubmit = () => {
    if (isFinished) return;
    clearInterval(timerRef.current);
    let score = 0;
    const details: Stage5Answer[] = questions.map((q, idx) => {
      const userVal = (inputs[idx] || '').trim();
      const correctVal = q.mode === 'TO_SYMBOL' ? q.el.symbol : (isZH ? q.el.zh : q.el.en);
      const isCorrect = q.mode === 'TO_SYMBOL' ? userVal === correctVal : userVal.toLowerCase() === correctVal.toLowerCase();
      if (isCorrect) score++;
      return { question: q.mode === 'TO_SYMBOL' ? (isZH ? q.el.zh : q.el.en) : q.el.symbol, expected: correctVal, userAnswer: userVal || (isZH ? "(未填寫)" : "(Blank)"), isCorrect };
    });
    const result = { score, timeTaken: 240 - timeLeft, timestamp: Date.now(), details };
    onUserUpdate({ ...user, stage5Result: result });
    setIsFinished(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isFinished && user.stage5Result) {
    const leaderboard = getGlobalLeaderboard(5);
    return (
      <div className="max-w-4xl mx-auto px-4 mb-20 animate-fade-in">
        <Header title={isZH ? "測驗結算" : "Test Summary"} step="5/12" onBack={onBack} instruction={isZH ? "測驗已完成，每位學生僅限測試一次。" : "Test completed. One attempt only per student."} />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">{isZH ? "答題詳情" : "Details"}</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 text-sm">
              {user.stage5Result.details.map((d, i) => (
                <div key={i} className={`p-3 rounded-lg border ${d.isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                  <div className="flex justify-between font-bold mb-1">
                    <span>{i + 1}. {d.question}</span>
                    <span className={d.isCorrect ? 'text-emerald-600' : 'text-rose-600'}>{d.isCorrect ? '✓' : '✗'}</span>
                  </div>
                  <div><span className="text-slate-500">{isZH ? "你的答案：" : "Yours: "}</span> {d.userAnswer}</div>
                  {!d.isCorrect && <div className="text-emerald-700 font-bold">{isZH ? "正確答案：" : "Expected: "} {d.expected}</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col space-y-8">
            <div className="bg-indigo-600 text-white p-8 rounded-2xl shadow-xl text-center">
              <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">{isZH ? "你的得分" : "Your Score"}</div>
              <div className="text-6xl font-black mb-2">{user.stage5Result.score} / 15</div>
              <div className="text-lg opacity-90">{isZH ? `用時：${user.stage5Result.timeTaken} 秒` : `Time: ${user.stage5Result.timeTaken}s`}</div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
               <h3 className="text-xl font-bold mb-4 flex items-center">
                 <svg className="w-6 h-6 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                 {isZH ? "全服龍虎榜 (前 10)" : "Global Top 10"}
               </h3>
               <div className="space-y-2">
                 {leaderboard.map((u, i) => (
                   <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${u.name === user.name ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-slate-50 border border-slate-100'}`}>
                     <div className="flex items-center">
                       <span className={`w-6 font-bold ${i < 3 ? 'text-amber-500' : 'text-slate-400'}`}>{i + 1}</span>
                       <span className="font-bold text-slate-700 ml-2">{u.name}</span>
                     </div>
                     <div className="text-right font-black text-indigo-600">{u.stage5Result!.score}</div>
                   </div>
                 ))}
               </div>
            </div>
            <button onClick={onComplete} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl hover:bg-emerald-700 transition-all">{isZH ? "返回選單" : "Back to Menu"}</button>
          </div>
        </div>
      </div>
    );
  }

  if (!isStarted) return (
    <HonestyDeclaration 
        title={isZH ? "階段 5：終極限時測驗" : "Stage 5: Final Test"}
        onStart={() => setIsStarted(true)}
        onBack={onBack}
        language={language}
    />
  );

  return (
    <div className="max-w-5xl mx-auto px-4 mb-20 animate-fade-in">
       <div className="sticky top-4 z-50 flex justify-between items-center bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-indigo-100 mb-8">
          <div className="text-xl font-bold text-slate-600">{isZH ? "測驗進行中" : "Exam in Progress"}</div>
          <div className={`text-3xl font-black ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-indigo-600'}`}>⏱️ {formatTime(timeLeft)}</div>
          <button onClick={handleSubmit} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700">{isZH ? "提交答案" : "Submit"}</button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {questions.map((q, idx) => (
          <div key={idx} className="p-4 rounded-xl border-2 border-slate-100 bg-white flex flex-col shadow-sm focus-within:border-indigo-400 transition-colors">
            <div className="text-slate-400 text-xs font-bold mb-2">#{idx + 1}</div>
            <div className="text-2xl font-bold text-slate-800 mb-3 text-center py-2">{q.mode === 'TO_SYMBOL' ? (isZH ? q.el.zh : q.el.en) : q.el.symbol}</div>
            <input type="text" className="w-full p-2 border-2 border-slate-50 rounded-lg outline-none text-center bg-slate-50 focus:bg-white focus:border-indigo-200 transition-all font-bold" value={inputs[idx] || ''} onChange={(e) => setInputs({...inputs, [idx]: e.target.value})} placeholder={q.mode === 'TO_SYMBOL' ? (isZH ? "輸入符號" : "Symbol") : (isZH ? "輸入名稱" : "Name")} />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- STAGE COMPONENTS 6-8 (MEMORY GAME) ---

const MemoryGameStage: React.FC<{ difficulty: 'EASY' | 'MEDIUM' | 'HARD', stageNum: number, onComplete: () => void, onBack: () => void, language: Language }> = ({ difficulty, stageNum, onComplete, onBack, language }) => {
  const isZH = language === 'ZH';
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matches, setMatches] = useState(0);
  const [isMemorizing, setIsMemorizing] = useState(true);
  const [previewTime, setPreviewTime] = useState(difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : 30);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const initGame = async () => {
      const count = difficulty === 'EASY' ? 4 : difficulty === 'MEDIUM' ? 6 : 8;
      const ions = await generateIons(count, 'medium', difficulty === 'EASY' ? 'MONO' : 'MIXED');
      const cardPairs: GameCard[] = [];
      ions.forEach((ion, index) => {
        cardPairs.push({ id: `f-${index}`, ionIndex: index, content: ion.formula, type: 'FORMULA', isFlipped: false, isMatched: false });
        cardPairs.push({ id: `n-${index}`, ionIndex: index, content: isZH ? ion.chineseName : ion.englishName, type: 'NAME', isFlipped: false, isMatched: false });
      });
      setCards(cardPairs.sort(() => 0.5 - Math.random()));
    };
    initGame();
  }, [difficulty, isZH]);

  useEffect(() => {
    if (isMemorizing && previewTime > 0) {
      timerRef.current = setInterval(() => setPreviewTime(p => p - 1), 1000);
    } else if (previewTime === 0) {
      setIsMemorizing(false);
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isMemorizing, previewTime]);

  const handleFlip = (id: string) => {
    if (isMemorizing || flipped.length === 2 || cards.find(c => c.id === id)?.isMatched || cards.find(c => c.id === id)?.isFlipped) return;
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      const card1 = cards.find(c => c.id === newFlipped[0]);
      const card2 = cards.find(c => c.id === newFlipped[1]);
      if (card1 && card2 && card1.ionIndex === card2.ionIndex) {
        setCards(prev => prev.map(c => (c.id === card1.id || c.id === card2.id) ? { ...c, isMatched: true } : c));
        setFlipped([]);
        setMatches(m => m + 1);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const isWon = matches > 0 && matches === cards.length / 2;

  return (
    <div className="max-w-5xl mx-auto px-4 mb-20">
      <Header title={isZH ? `離子翻牌 (${difficulty})` : `Ion Match (${difficulty})`} step={`${stageNum}/12`} onBack={onBack} instruction={isMemorizing ? (isZH ? `記憶模式：請記住所有卡牌位置 (${previewTime}s)` : `Memorize Mode: Remember all cards (${previewTime}s)`) : (isZH ? "找出成對的名稱與化學式。" : "Match name with formula.")} />
      {isMemorizing && (
        <div className="mb-6 flex justify-center">
           <div className="bg-amber-50 border-2 border-amber-200 text-amber-700 px-8 py-3 rounded-full font-bold text-xl animate-pulse">⏳ {isZH ? `剩餘記憶時間：${previewTime} 秒` : `Time left: ${previewTime}s`}</div>
        </div>
      )}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6 mb-10">
        {cards.map(card => {
          const isRevealed = isMemorizing || card.isMatched || flipped.includes(card.id);
          return (
            <div key={card.id} className="relative h-40 md:h-52 w-full perspective-1000">
              <div onClick={() => handleFlip(card.id)} className={`relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer ${isRevealed ? '' : 'rotate-y-180'}`}>
                <div className={`absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-4 rounded-2xl border-2 shadow-lg bg-white ${card.isMatched ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-indigo-100'}`}>
                   <div className={`text-center font-bold text-indigo-700 ${card.type === 'FORMULA' ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`}>{card.type === 'FORMULA' ? formatFormula(card.content) : card.content}</div>
                   {card.isMatched && <div className="mt-2 text-emerald-500 font-bold text-sm">MATCHED</div>}
                </div>
                <div className={`absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center rounded-2xl border-2 border-indigo-700 shadow-xl overflow-hidden bg-slate-900`}>
                   <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M15 0 L30 7.5 L30 22.5 L15 30 L0 22.5 L0 7.5 Z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`, backgroundSize: '40px 40px' }}></div>
                   <div className="relative z-10 flex flex-col items-center">
                     <svg className="w-16 h-16 text-indigo-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                     <div className="text-white text-[10px] font-black tracking-widest uppercase opacity-40">MEMORIZE</div>
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {isWon && (
        <div className="text-center animate-pop">
           <div className="text-emerald-600 text-2xl font-bold mb-6">{isZH ? "全數配對成功！" : "All Matched!"}</div>
           <button onClick={onComplete} className="px-16 py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl hover:scale-105 transition-all">{isZH ? "完成並返回選單" : "Complete & Return"}</button>
        </div>
      )}
      <style>{`.perspective-1000 { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}</style>
    </div>
  );
};

// --- STAGE 9: ION HANDWRITTEN TEST ---

const Stage9_SynthesisTest: React.FC<{ onComplete: () => void, onBack: () => void, language: Language, user: UserProfile, onUserUpdate: (u: UserProfile) => void }> = ({ onComplete, onBack, language, user, onUserUpdate }) => {
  const isZH = language === 'ZH';
  const [questions, setQuestions] = useState<Ion[]>([]);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFinished = !!user.stage9Result;

  useEffect(() => {
    if (!isFinished && !isStarted) {
        const init = async () => { const q = await generateIons(15, 'hard', 'MIXED'); setQuestions(q); };
        init();
    }
  }, [isFinished, isStarted]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const payload = questions.map(q => ({ zh: q.chineseName, en: q.englishName, formula: q.formula }));
        const result = await evaluateHandwrittenAnswers(reader.result as string, payload);
        onUserUpdate({ ...user, stage9Result: { score: result.score, timestamp: Date.now() } });
        setEvalResult(result);
      } catch (err) { alert("Evaluation failed. Please try again."); } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  if (isFinished) {
    const leaderboard = getGlobalLeaderboard(9);
    return (
        <div className="max-w-4xl mx-auto px-4 mb-20">
            <Header title={isZH ? "測驗結果：離子手寫" : "Result: Ion Handwriting"} step="9/12" onBack={onBack} instruction={isZH ? "你已完成此項測驗，每個帳號僅限一次機會。" : "Completed. One attempt per student."} />
            <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
                <div className="bg-indigo-600 text-white p-12 rounded-3xl shadow-xl text-center flex flex-col justify-center">
                    <div className="text-lg font-bold opacity-80 mb-2 uppercase tracking-widest">{isZH ? "你的得分" : "Your Score"}</div>
                    <div className="text-8xl font-black">{user.stage9Result?.score} / 15</div>
                </div>
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
                    <h3 className="text-xl font-bold mb-6 flex items-center text-indigo-600">🏆 {isZH ? "全服即時龍虎榜" : "Global Leaderboard"}</h3>
                    <div className="space-y-3">
                        {leaderboard.map((u, i) => (
                        <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${u.name === user.name ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-slate-50 border border-slate-100'}`}>
                            <div className="flex items-center">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i < 3 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'}`}>{i + 1}</span>
                            <span className="font-bold text-slate-700 ml-3 truncate">{u.name}</span>
                            </div>
                            <div className="font-black text-indigo-600">{u.stage9Result!.score}</div>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
            <button onClick={onComplete} className="w-full mt-10 py-5 bg-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-700 transition-all">{isZH ? "返回選單" : "Back to Menu"}</button>
        </div>
    );
  }

  if (!isStarted) return (
    <HonestyDeclaration title={isZH ? "階段 9：離子手寫綜合測試" : "Stage 9: Ion Synthesis Test"} onStart={() => setIsStarted(true)} onBack={onBack} language={language} />
  );

  return (
    <div className="max-w-4xl mx-auto px-4 mb-20">
      <Header title={isZH ? "階段 9: 離子手寫綜合測試" : "Stage 9: Ion Synthesis Test"} step="9/12" onBack={onBack} instruction={isZH ? "請在紙上寫下這 15 個離子的化學式，拍照並上傳。" : "Write the formulas for these 15 ions on paper, then upload a photo."} />
      {!evalResult ? (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {questions.map((q, i) => (<div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium text-slate-800">{i+1}. {isZH ? q.chineseName : q.englishName}</div>))}
          </div>
          <div className="text-center">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
            <button onClick={() => fileInputRef.current?.click()} disabled={loading} className={`px-10 py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transition-transform'}`}>
              {loading ? (isZH ? "分析中..." : "Analyzing...") : (isZH ? "📷 上傳手寫照片" : "📷 Upload Photo")}
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-pop text-center">
           <div className="bg-emerald-50 border border-emerald-200 p-12 rounded-3xl mb-10">
              <h2 className="text-2xl font-bold text-emerald-800 mb-2">{isZH ? "測驗完成" : "Test Completed"}</h2>
              <p className="text-8xl font-black text-emerald-600 mb-4">{evalResult.score} / 15</p>
              <p className="text-lg italic text-emerald-700">{evalResult.overallFeedback}</p>
           </div>
           <button onClick={() => window.location.reload()} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">查看紀錄並繼續</button>
        </div>
      )}
    </div>
  );
};

// --- STAGE 10: COMPOUND WRITING ---

const Stage10_CompoundWriting: React.FC<{ onComplete: () => void, onBack: () => void, language: Language }> = ({ onComplete, onBack, language }) => {
  const isZH = language === 'ZH';
  const [questions, setQuestions] = useState<CompoundQuestion[]>([]);
  const [inputs, setInputs] = useState<{[key: number]: string}>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<{[key: number]: 'correct' | 'error' | 'none'}>({});
  useEffect(() => { setQuestions([...COMPOUNDS_DATA].sort(() => 0.5 - Math.random()).slice(0, 10)); }, []);
  const checkAll = () => {
    const newStatus: {[key: number]: 'correct' | 'error' | 'none'} = {}; let allCorrect = true;
    questions.forEach((q, idx) => {
      const userVal = (inputs[idx] || '').trim().replace(/\s+/g, '');
      if (userVal === q.formula) newStatus[idx] = 'correct'; else { newStatus[idx] = 'error'; allCorrect = false; }
    });
    setStatus(newStatus); setSubmitted(true);
  };
  const allCorrect = submitted && questions.every((q, i) => (inputs[i] || '').trim().replace(/\s+/g, '') === q.formula);
  return (
    <div className="max-w-4xl mx-auto px-4 mb-20">
      <Header title={isZH ? "階段 10: 化合物化學式書寫" : "Stage 10: Compound Writing"} step="10/12" onBack={onBack} instruction={isZH ? "根據名稱寫出化學式。輸入時下方會顯示格式化預覽。" : "Type the formulas. The preview will appear below each input."} />
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-10">
          {questions.map((q, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-800 font-bold text-lg">{idx + 1}. {isZH ? q.nameZH : q.nameEN}</span>
                {status[idx] === 'correct' && <span className="text-emerald-500 font-bold text-sm">✓</span>}
                {status[idx] === 'error' && <span className="text-rose-500 font-bold text-sm">✗</span>}
              </div>
              <div className="relative">
                <input type="text" disabled={allCorrect} className={`w-full p-3 border-2 rounded-xl font-mono text-xl outline-none transition-all ${status[idx] === 'error' ? 'border-rose-300 bg-rose-50' : status[idx] === 'correct' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 focus:border-indigo-500'}`} value={inputs[idx] || ''} onChange={(e) => { setInputs({...inputs, [idx]: e.target.value}); if (submitted) setStatus({...status, [idx]: 'none'}); }} placeholder="e.g. Al2O3" />
              </div>
              <div className="mt-2 min-h-[32px] flex items-center px-2 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                <span className="text-slate-400 text-xs mr-3">{isZH ? "預覽:" : "Preview:"}</span>
                <div className="text-lg">{inputs[idx] ? formatFormula(inputs[idx]) : <span className="text-slate-300 italic text-sm">-</span>}</div>
              </div>
              {status[idx] === 'error' && <div className="mt-1 text-xs text-rose-500 font-bold pl-2 normal-case">{isZH ? '正確：' : 'Expected: '} <span className="font-mono">{q.formula}</span></div>}
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center border-t border-slate-100 pt-8">
           {!allCorrect ? (<button onClick={checkAll} className="px-16 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">檢查答案</button>) : (
             <div className="text-center animate-pop">
                <div className="text-emerald-600 font-black text-2xl mb-6 flex items-center justify-center"><svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>全數正確！</div>
                <button onClick={onComplete} className="px-20 py-5 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl hover:bg-emerald-700 transition-all">完成並返回</button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

// --- STAGE 11: ADVANCED COMPOUNDS ---

const Stage11_AdvancedCompounds: React.FC<{ onComplete: () => void, onBack: () => void, language: Language }> = ({ onComplete, onBack, language }) => {
  const isZH = language === 'ZH';
  const [questions, setQuestions] = useState<AdvancedCompoundQuestion[]>([]);
  const [inputs, setInputs] = useState<{[key: number]: string}>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<{[key: number]: 'correct' | 'error' | 'none'}>({});
  useEffect(() => {
    const shuffledCompounds = [...ADVANCED_COMPOUNDS].sort(() => 0.5 - Math.random()).slice(0, 10);
    const qList: AdvancedCompoundQuestion[] = shuffledCompounds.map((q, idx) => ({ ...q, mode: idx < 7 ? 'NAME_TO_FORMULA' : 'FORMULA_TO_NAME' }));
    setQuestions(qList.sort(() => 0.5 - Math.random()));
  }, []);
  const checkAll = () => {
    const newStatus: {[key: number]: 'correct' | 'error' | 'none'} = {}; let allCorrect = true;
    questions.forEach((q, idx) => {
      const userVal = (inputs[idx] || '').trim();
      const target = q.mode === 'NAME_TO_FORMULA' ? q.formula : (isZH ? q.nameZH : q.nameEN);
      if (userVal.replace(/\s+/g, '').toLowerCase() === target.replace(/\s+/g, '').toLowerCase()) newStatus[idx] = 'correct'; else { newStatus[idx] = 'error'; allCorrect = false; }
    });
    setStatus(newStatus); setSubmitted(true);
  };
  const allCorrect = submitted && Object.values(status).every(s => s === 'correct');
  return (
    <div className="max-w-5xl mx-auto px-4 mb-20 animate-fade-in">
      <Header title={isZH ? "階段 11: 進階離子化合物特訓" : "Stage 11: Advanced Compounds Mastery"} step="11/12" onBack={onBack} instruction={isZH ? "挑戰更複雜的多原子離子化合物。請根據提示寫出對應的名稱或化學式。" : "Challenge complex polyatomic ionic compounds. Write the formula or name."} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {questions.map((q, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border-2 transition-all bg-white flex flex-col shadow-sm ${status[idx] === 'correct' ? 'border-emerald-200 bg-emerald-50' : status[idx] === 'error' ? 'border-rose-200 bg-rose-50' : 'border-slate-100 focus-within:border-indigo-400'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">#{idx + 1} - {q.mode === 'NAME_TO_FORMULA' ? (isZH ? '寫出化學式' : 'Write Formula') : (isZH ? '寫出名稱' : 'Write Name')}</span>
              {status[idx] === 'correct' && <span className="text-emerald-500 font-bold">✓</span>}
              {status[idx] === 'error' && <span className="text-rose-500 font-bold">✗</span>}
            </div>
            <div className="text-2xl font-bold text-slate-800 mb-4 text-center">{q.mode === 'NAME_TO_FORMULA' ? (isZH ? q.nameZH : q.nameEN) : formatFormula(q.formula)}</div>
            <input type="text" className={`w-full p-4 border-2 rounded-xl outline-none font-medium text-lg text-center transition-all ${status[idx] === 'error' ? 'border-rose-300' : 'border-slate-100 focus:bg-white focus:border-indigo-300'}`} value={inputs[idx] || ''} onChange={(e) => { setInputs({...inputs, [idx]: e.target.value}); if (submitted) setStatus({...status, [idx]: 'none'}); }} placeholder={q.mode === 'NAME_TO_FORMULA' ? "e.g. KMnO4" : "e.g. Potassium..."} />
            {q.mode === 'NAME_TO_FORMULA' && inputs[idx] && (<div className="mt-3 flex items-center justify-center p-2 bg-white/60 rounded-lg border border-dashed border-indigo-100"><span className="text-xs text-slate-400 mr-3">{isZH ? '預覽:' : 'Preview:'}</span><div className="text-xl">{formatFormula(inputs[idx])}</div></div>)}
            {status[idx] === 'error' && (<div className="mt-3 text-sm text-rose-600 font-bold text-center normal-case">{isZH ? '正確答案：' : 'Correct: '} {q.mode === 'NAME_TO_FORMULA' ? q.formula : (isZH ? q.nameZH : q.nameEN)}</div>)}
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center">
        {!allCorrect ? (<button onClick={checkAll} className="px-20 py-5 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">檢查答案</button>) : (
          <div className="text-center animate-pop">
             <div className="text-emerald-600 font-black text-2xl mb-6 flex items-center justify-center">全對！</div>
             <button onClick={onComplete} className="px-24 py-6 bg-emerald-600 text-white font-bold rounded-2xl shadow-2xl hover:bg-emerald-700 transition-all">完成並返回</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- STAGE 12: FINAL COMPOUND HANDWRITTEN TEST ---

const Stage12_FinalCompoundHandwrittenTest: React.FC<{ onComplete: () => void, onBack: () => void, language: Language, user: UserProfile, onUserUpdate: (u: UserProfile) => void }> = ({ onComplete, onBack, language, user, onUserUpdate }) => {
  const isZH = language === 'ZH';
  const [questions, setQuestions] = useState<CompoundQuestion[]>([]);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(!!user.stage12Result);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!isFinished && questions.length === 0) { setQuestions([...COMPOUNDS_DATA, ...ADVANCED_COMPOUNDS].sort(() => 0.5 - Math.random()).slice(0, 15)); } }, [isFinished, questions.length]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const payload = questions.map(q => ({ zh: q.nameZH, en: q.nameEN, formula: q.formula }));
        const result = await evaluateHandwrittenAnswers(reader.result as string, payload);
        const savedResult = { score: result.score, timestamp: Date.now(), details: result.results.map(r => ({ question: r.question, expected: r.expected, userAnswer: r.studentWrote, isCorrect: r.isCorrect })) };
        onUserUpdate({ ...user, stage12Result: savedResult });
        setEvalResult(result); setIsFinished(true);
      } catch (err) { alert("Evaluation failed. Please try again."); } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const displayResult = evalResult || (user.stage12Result ? { score: user.stage12Result.score, overallFeedback: isZH ? "測驗已完成，這是你的評核紀錄。" : "Test completed. Here is your evaluation record.", results: user.stage12Result.details.map(d => ({ question: d.question, expected: d.expected, studentWrote: d.userAnswer, isCorrect: d.isCorrect })) } : null);

  if (isFinished && displayResult) {
    const leaderboard = getGlobalLeaderboard(12);
    return (
      <div className="max-w-6xl mx-auto px-4 mb-20 animate-fade-in">
        <Header title={isZH ? "階段 12: 最終評核結算" : "Stage 12: Final Summary"} step="12/12" onBack={onBack} instruction={isZH ? "測驗已完成。每個帳號僅限一次最終手寫評估機會。" : "Evaluation complete. One attempt per account."} />
        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-indigo-600 text-white p-10 rounded-3xl shadow-xl text-center">
                 <div className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">最終得分</div>
                 <div className="text-8xl font-black">{displayResult.score} / 15</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
                <h3 className="text-xl font-bold mb-6 text-slate-800 border-b pb-4">批改詳情</h3>
                <div className="space-y-4">
                  {displayResult.results.map((r, i) => (
                    <div key={i} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${r.isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                      <div className="flex-grow">
                        <div className="font-bold text-slate-800 mb-1">{i+1}. {r.question}</div>
                        <div className="text-sm normal-case"><span className="text-slate-400">寫法:</span> <span className={r.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>{formatFormula(r.studentWrote)}</span> {!r.isCorrect && <><span className="mx-2">|</span><span className="text-slate-400">正確:</span> <span className="text-emerald-800 font-bold">{formatFormula(r.expected)}</span></>}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>
           <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-amber-200"><h3 className="text-xl font-black mb-6 flex items-center text-amber-600">🏆 龍虎榜</h3><div className="space-y-3">{leaderboard.map((u, i) => (<div key={i} className={`flex items-center justify-between p-3 rounded-xl ${u.name === user.name ? 'bg-indigo-50 border-2 border-indigo-200' : 'bg-slate-50 border border-slate-100'}`}><span className="font-bold">{i+1}. {u.name}</span><span className="font-black text-indigo-600">{u.stage12Result!.score}</span></div>))}</div></div>
              <button onClick={onComplete} className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg">返回選單</button>
           </div>
        </div>
      </div>
    );
  }

  if (!isStarted) return (<HonestyDeclaration title={isZH ? "階段 12：化合物手寫終極測試" : "Stage 12: Final Compound Test"} onStart={() => setIsStarted(true)} onBack={onBack} language={language} />);

  return (
    <div className="max-w-4xl mx-auto px-4 mb-20">
      <Header title={isZH ? "階段 12: 化合物手寫終極測試" : "Stage 12: Final Compound Test"} step="12/12" onBack={onBack} instruction={isZH ? "請在紙上按順序寫下這 15 個化合物的化學式，然後拍照上傳讓 AI 評分。" : "Write chemical formulas for these 15 compounds on paper in order, then upload for AI grading."} />
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-10">{questions.map((q, i) => (<div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold text-slate-800 flex justify-between shadow-sm"><span>{i+1}. {isZH ? q.nameZH : q.nameEN}</span></div>))}</div>
        <div className="text-center p-8 bg-indigo-50/30 rounded-2xl border-2 border-dashed border-indigo-100">
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={loading} className={`px-12 py-6 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-2xl transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}>{loading ? "閱卷中..." : "📷 拍照上傳 (15題)"}</button>
        </div>
      </div>
    </div>
  );
};

export default FormulaPractice;
