
import React, { useState, useEffect } from 'react';
import { generateEquations } from '../services/geminiService';
import { ChemicalEquation, Language, EquationTopic } from '../types';
import { formatFormula, parseFormula } from '../utils';

interface Props {
  onBack: () => void;
  language: Language;
}

const getCharge = (formula: string): number => {
  if (formula.includes('e^-')) return -1;
  const parts = formula.split('^');
  if (parts.length < 2) return 0;
  const chargePart = parts[1];
  const match = chargePart.match(/(\d*)([\+\-])/);
  if (!match) return 0;
  const num = match[1] ? parseInt(match[1], 10) : 1;
  const sign = match[2] === '+' ? 1 : -1;
  return num * sign;
};

const EquationBalancer: React.FC<Props> = ({ onBack, language }) => {
  const [selectedTopic, setSelectedTopic] = useState<EquationTopic | null>(null);
  const [topicSelectionStep, setTopicSelectionStep] = useState<'MAIN' | 'GENERAL_SUB' | 'REDOX_SUB'>('MAIN');

  const [equations, setEquations] = useState<ChemicalEquation[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userCoefficients, setUserCoefficients] = useState<{[key: string]: string}>({});
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [hintMessage, setHintMessage] = useState<string>('');
  const [isFinished, setIsFinished] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (selectedTopic) startNewSession();
  }, [selectedTopic]);

  const startNewSession = async () => {
    setLoading(true);
    setCurrentIndex(0);
    setIsFinished(false);
    resetState();
    const { data } = await generateEquations(5, selectedTopic!, language, history);
    setEquations(data);
    setLoading(false);
  };

  const resetState = () => {
    setUserCoefficients({});
    setFeedback('none');
    setHintMessage('');
  };

  const handleCoefficientChange = (id: string, value: string) => {
    if (value === '' || /^[1-9]\d*$/.test(value)) {
       setUserCoefficients(prev => ({ ...prev, [id]: value }));
       if (feedback === 'incorrect') setFeedback('none');
    }
  };

  const checkAnswer = () => {
    const currentEquation = equations[currentIndex];
    if (!currentEquation) return;
    
    const hintTxt = txt[language];
    const rCounts: Record<string, number> = {};
    const pCounts: Record<string, number> = {};
    let totalChargeL = 0;
    let totalChargeR = 0;
    
    currentEquation.reactants.forEach((r, idx) => {
      const coeff = parseInt(userCoefficients[`r-${idx}`] || '1', 10);
      const atoms = parseFormula(r.formula);
      for (const [el, count] of Object.entries(atoms)) {
        if (el !== 'e') rCounts[el] = (rCounts[el] || 0) + (count * coeff);
      }
      totalChargeL += coeff * getCharge(r.formula);
    });

    currentEquation.products.forEach((p, idx) => {
      const coeff = parseInt(userCoefficients[`p-${idx}`] || '1', 10);
      const atoms = parseFormula(p.formula);
      for (const [el, count] of Object.entries(atoms)) {
        if (el !== 'e') pCounts[el] = (pCounts[el] || 0) + (count * coeff);
      }
      totalChargeR += coeff * getCharge(p.formula);
    });

    const allElements = Array.from(new Set([...Object.keys(rCounts), ...Object.keys(pCounts)]));
    const unbalanced: string[] = [];
    allElements.forEach(el => {
      if ((rCounts[el] || 0) !== (pCounts[el] || 0)) unbalanced.push(el);
    });

    if (unbalanced.length > 0 || totalChargeL !== totalChargeR) {
        setFeedback('incorrect');
        setHintMessage(hintTxt.error);
        return;
    }

    setFeedback('correct');
    setScore(prev => prev + 10);
  };

  const handleNext = () => {
    if (currentIndex < equations.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetState();
    } else {
      setIsFinished(true);
    }
  };

  const txt: any = {
    ZH: {
      back: "返回",
      score: "總得分",
      loading: "正在準備題目...",
      title: "平衡化學反應式",
      error: "原子或電荷未平衡，請再試一次。",
      success: "完全正確！",
      next: "下一題",
      selectTopic: "選擇練習課題",
      topicGeneral: "HKDSE 綜合化學 (課題 1-8)",
      topicRedox: "氧化還原反應 (Redox)",
      redoxHalf: "半反應式 (half equation)",
      redoxFull: "氧化還原反應式 (Full equation)",
      guide: "提示：留空代表係數為 1。",
      guideTitle: "平衡指南",
      sessionComplete: "練習完成！",

      topicNames: {
        TOPIC_1_2_EARTH_MICRO: "課題 1 & 2 地球與微觀世界 Planet Earth & Micro World",
        TOPIC_3_METALS: "課題 3 金屬 Metals",
        TOPIC_4_ACIDS: "課題 4 酸和鹼 Acids and Bases",
        TOPIC_6_ORGANIC: "課題 6 化石燃料和碳化合物 Fossil Fuels and Carbon Compounds",
        TOPIC_7_PERIODICITY: "課題 7 週期律 Periodicity",
        TOPIC_8_ENERGETICS: "課題 8 化學反應中的能量變化 Chemical Reactions and Energy",
        REDOX_HALF: "半反應式 (half equation)",
        REDOX_FULL: "氧化還原反應式 (Full equation)"
      },
      
      generalTitle: "如何平衡化學方程式？",
      generalStep1: "(a) 先平衡含有最多原子數量的複雜化學式。",
      generalStep2: "(b) 平衡只出現在左右兩方各一個位置的元素。",
      generalStep3: "(c) 最後平衡以單質形式出現的元素（如 O2, H2, Mg）。",
      generalStep4: "(d) 若出現分數係數，將整條方程式乘以分母以化為整數。",
      generalStep5: "(e) 檢查方程式左右兩方的原子總數是否相等。",

      redoxHalfTitle: "如何平衡半反應式？",
      mhSectionA: "(a) 平衡原子的數目。",
      mhStepA1: "(i) 先平衡非氧和氫的原子，在化學式前加上適當的系數。",
      mhStepA2: "(ii) 在半方程式的左右兩方加上適當數目的H2O以平衡氧原子數目。*",
      mhStepA3: "(iii) 在半方程式的左右兩方加上加上適當數目的H+以平衡氫原子數目。*",
      mhSectionB: "(b) 在半方程式的其中一方加上適當數目的電子，以平衡電荷。",
      mhNote: "*該反應是在酸化的條件下",
      
      redoxFullTitle: "如何平衡全反應方程式？",
      method1: "方法一：氧化數法 (Oxidation Number Method)",
      m1Step1: "1. 寫出氧化劑、還原劑及其主生成物。",
      m1Step2: "2. (a) 訂出元素的氧化數。(b) 求出每個式單位獲得或失去的電子數目。",
      m1Step3: "3. 在左方加入係數，確保氧化劑「獲得的電子」等於還原劑「失去的電子」。",
      m1Step4: "4. 平衡右方生成物的係數。",
      m1Step5: "5. 平衡 O 和 H 以外的所有原子。",
      m1Step6: "6. 加入 H⁺ 或 OH⁻ 平衡電荷 (酸性介質加 H⁺ 於缺正電方)。",
      m1Step7: "7. (a) 加入 H₂O 平衡 O 原子。(b) 最後檢查 H 原子是否平衡。",
      method2: "方法二：半反應法 (Half-Equation Method)",
      m2Step1: "1. 將每條平衡的半方程式乘以適當數目，使兩邊電子數相等。",
      m2Step2: "2. 合併半方程式，約去電子及相同物種。"
    },
    EN: {
      back: "Back",
      score: "Score",
      loading: "Loading...",
      title: "Equation Balancing",
      error: "Atoms or charges unbalanced.",
      success: "Correct!",
      next: "Next",
      selectTopic: "Select Topic",
      topicGeneral: "General Chemistry (Topic 1-8)",
      topicRedox: "Redox Reactions",
      redoxHalf: "half equation",
      redoxFull: "Full equation",
      guide: "Hint: Empty means 1.",
      guideTitle: "Balancing Guide",

      topicNames: {
        TOPIC_1_2_EARTH_MICRO: "Topic 1 & 2 Planet Earth & Micro World",
        TOPIC_3_METALS: "Topic 3 Metals",
        TOPIC_4_ACIDS: "Topic 4 Acids and Bases",
        TOPIC_6_ORGANIC: "Topic 6 Fossil Fuels and Carbon Compounds",
        TOPIC_7_PERIODICITY: "Topic 7 Periodicity",
        TOPIC_8_ENERGETICS: "Topic 8 Chemical Reactions and Energy",
        REDOX_HALF: "half equation",
        REDOX_FULL: "Full equation"
      },

      generalTitle: "How to Balance Chemical Equations?",
      generalStep1: "(a) Start by balancing the most complex molecule (the one with the largest number of atoms).",
      generalStep2: "(b) Balance elements that appear in only one reactant and one product first.",
      generalStep3: "(c) Balance elements that exist as free elements (e.g., O2, H2, Mg) last.",
      generalStep4: "(d) If fractional coefficients are used, multiply the entire equation by the denominator to obtain whole numbers.",
      generalStep5: "(e) Check that the total number of atoms for each element is equal on both sides.",

      redoxHalfTitle: "How to Balance Half-Equations?",
      mhSectionA: "(a) Balance the number of atoms in half equation:",
      mhStepA1: "(i) Balance the atoms of non-oxygen-and-hydrogen first, add suitable coefficients before the formulae.",
      mhStepA2: "(ii) Add the correct number of H2O, on either side of the half equation, to balance the number of oxygen atoms.*",
      mhStepA3: "(iii) Add the correct number of H+, on either side of the half equation, to balance the number of hydrogen atoms.*",
      mhSectionB: "(b) Balance the charges by adding correct number of electrons on one side of the half equation.",
      mhNote: "*The reaction is under acidified condition",
    }
  };

  const t = txt[language];

  if (!selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 animate-fade-in mb-20">
        <div className="flex items-center mb-10">
           <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {t.back}
          </button>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 text-center mb-10">{t.selectTopic}</h1>
        {topicSelectionStep === 'MAIN' && (
          <div className="grid gap-6">
            <button onClick={() => setTopicSelectionStep('GENERAL_SUB')} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 flex items-center group transition-all">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mr-6 text-emerald-600 font-bold text-2xl group-hover:bg-emerald-100">A</div>
              <div className="text-left"><h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-700">{t.topicGeneral}</h3></div>
            </button>
            <button onClick={() => setTopicSelectionStep('REDOX_SUB')} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 flex items-center group transition-all">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mr-6 text-indigo-600 font-bold text-2xl group-hover:bg-indigo-100">B</div>
              <div className="text-left"><h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-700">{t.topicRedox}</h3></div>
            </button>
          </div>
        )}
        {(topicSelectionStep === 'GENERAL_SUB' || topicSelectionStep === 'REDOX_SUB') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                <div className="md:col-span-2 flex justify-between items-center mb-2">
                    <button onClick={() => setTopicSelectionStep('MAIN')} className="text-slate-400 hover:text-slate-600 flex items-center uppercase text-xs font-bold tracking-widest">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>{t.back}
                    </button>
                </div>
                {topicSelectionStep === 'GENERAL_SUB' ? (
                    ['TOPIC_1_2_EARTH_MICRO', 'TOPIC_3_METALS', 'TOPIC_4_ACIDS', 'TOPIC_6_ORGANIC', 'TOPIC_7_PERIODICITY', 'TOPIC_8_ENERGETICS'].map(id => (
                        <button key={id} onClick={() => setSelectedTopic(id as EquationTopic)} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:border-emerald-300 text-left transition-all font-bold text-slate-700 text-sm md:text-base leading-snug">
                            {t.topicNames[id]}
                        </button>
                    ))
                ) : (
                    ['REDOX_HALF', 'REDOX_FULL'].map(id => (
                        <button key={id} onClick={() => setSelectedTopic(id as EquationTopic)} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-300 text-left transition-all font-bold text-slate-700">
                            {t.topicNames[id]}
                        </button>
                    ))
                )}
            </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="text-center py-20 text-slate-500">{t.loading}</div>;

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100">
          <h2 className="text-4xl font-black text-slate-800 mb-4">{t.sessionComplete}</h2>
          <div className="text-2xl font-bold text-indigo-600 mb-10">{t.score}: {score}</div>
          <button onClick={() => setSelectedTopic(null)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-lg">{t.back}</button>
        </div>
      </div>
    );
  }

  const currentEquation = equations[currentIndex];
  if (!currentEquation) return null;

  return (
    <div className="max-w-6xl mx-auto w-full px-4 mb-20 animate-fade-in">
       <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <button onClick={() => setSelectedTopic(null)} className="text-slate-500 hover:text-slate-800 font-medium flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg> {t.back}
        </button>
        <div className="text-xl font-bold text-slate-800">{t.score}: <span className="text-emerald-600">{score}</span></div>
      </div>

      <div className="mb-10 bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
         <h3 className="text-xl font-bold text-indigo-700 mb-6">{t.guideTitle}</h3>
         <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 text-sm md:text-base max-h-[400px] overflow-y-auto">
           {selectedTopic === 'REDOX_FULL' ? (
             <div className="space-y-6">
                <h4 className="font-bold text-indigo-800 text-lg">{t.redoxFullTitle}</h4>
                <div>
                    <p className="font-bold mb-2 text-indigo-600">{t.method1}</p>
                    <ul className="space-y-1">
                        <li>{t.m1Step1}</li>
                        <li>{t.m1Step2}</li>
                        <li>{t.m1Step3}</li>
                        <li className="font-bold text-slate-800 border-t pt-2 mt-2">平衡原子與電荷</li>
                        <li>{t.m1Step4}</li>
                        <li>{t.m1Step5}</li>
                        <li>{t.m1Step6}</li>
                        <li>{t.m1Step7}</li>
                    </ul>
                </div>
                <div>
                    <p className="font-bold mb-2 text-indigo-600">{t.method2}</p>
                    <ul className="space-y-1">
                        <li>{t.m2Step1}</li>
                        <li>{t.m2Step2}</li>
                    </ul>
                </div>
             </div>
           ) : selectedTopic === 'REDOX_HALF' ? (
            <div className="space-y-4">
               <h4 className="font-bold text-indigo-800 text-lg">{t.redoxHalfTitle}</h4>
               <ul className="space-y-2">
                 <li className="font-bold text-slate-800">{t.mhSectionA}</li>
                 <li className="pl-4">{t.mhStepA1}</li>
                 <li className="pl-4">{t.mhStepA2}</li>
                 <li className="pl-4">{t.mhStepA3}</li>
                 <li className="font-bold text-slate-800 mt-2">{t.mhSectionB}</li>
                 <li className="text-xs text-slate-500 mt-4 italic">{t.mhNote}</li>
               </ul>
            </div>
           ) : (
             <div className="space-y-4">
               <h4 className="font-bold text-indigo-800 text-lg">{t.generalTitle}</h4>
               <ul className="space-y-2">
                 <li>{t.generalStep1}</li>
                 <li>{t.generalStep2}</li>
                 <li>{t.generalStep3}</li>
                 <li>{t.generalStep4}</li>
                 <li>{t.generalStep5}</li>
                 <li className="text-xs text-slate-500 mt-4 italic">{t.guide}</li>
               </ul>
             </div>
           )}
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 relative mb-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-10 text-2xl md:text-3xl font-medium mb-16">
          {currentEquation.reactants.map((r, idx) => (
            <React.Fragment key={`r-${idx}`}>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center space-x-2">
                    <input type="text" placeholder="1" value={userCoefficients[`r-${idx}`] || ''} onChange={(e) => handleCoefficientChange(`r-${idx}`, e.target.value)} disabled={feedback === 'correct'}
                    className={`w-12 h-12 md:w-16 md:h-16 text-center border-2 rounded-xl outline-none transition-all ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:border-indigo-400'}`} />
                    <span>{formatFormula(r.formula)}</span>
                </div>
                {(language === 'ZH' ? r.nameZH : r.nameEN) && r.formula !== 'e^-' && (
                  <span className="text-xs text-slate-400 font-bold max-w-[100px] text-center leading-tight">
                    {language === 'ZH' ? r.nameZH : r.nameEN}
                  </span>
                )}
              </div>
              {idx < currentEquation.reactants.length - 1 && <span className="text-slate-300 self-start mt-4">+</span>}
            </React.Fragment>
          ))}
          <div className="px-2 text-slate-300 font-bold self-start mt-4">→</div>
          {currentEquation.products.map((p, idx) => (
            <React.Fragment key={`p-${idx}`}>
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center space-x-2">
                    <input type="text" placeholder="1" value={userCoefficients[`p-${idx}`] || ''} onChange={(e) => handleCoefficientChange(`p-${idx}`, e.target.value)} disabled={feedback === 'correct'}
                    className={`w-12 h-12 md:w-16 md:h-16 text-center border-2 rounded-xl outline-none transition-all ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 focus:border-indigo-400'}`} />
                    <span>{formatFormula(p.formula)}</span>
                </div>
                {(language === 'ZH' ? p.nameZH : p.nameEN) && p.formula !== 'e^-' && (
                  <span className="text-xs text-slate-400 font-bold max-w-[100px] text-center leading-tight">
                    {language === 'ZH' ? p.nameZH : p.nameEN}
                  </span>
                )}
              </div>
              {idx < currentEquation.products.length - 1 && <span className="text-slate-300 self-start mt-4">+</span>}
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col items-center">
          {feedback === 'incorrect' && (
            <div className="text-rose-500 font-bold mb-6 bg-rose-50 px-6 py-3 rounded-xl border border-rose-100 animate-pop">
              {hintMessage || t.error}
            </div>
          )}
          {feedback === 'correct' ? (
            <div className="animate-pop text-center">
              <p className="text-emerald-600 text-2xl font-black mb-8">{t.success}</p>
              <button onClick={handleNext} className="px-16 py-5 bg-emerald-600 text-white rounded-2xl font-bold text-xl shadow-xl hover:bg-emerald-700 transition-all">{t.next}</button>
            </div>
          ) : (
            <button onClick={checkAnswer} className="px-20 py-5 bg-slate-900 text-white font-bold text-xl rounded-2xl hover:bg-slate-800 transition-all shadow-xl">檢查答案</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquationBalancer;
