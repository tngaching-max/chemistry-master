import React, { useState, useEffect } from 'react';
import { generateEquations } from '../services/geminiService';
import { ChemicalEquation, Language, EquationTopic } from '../types';
import { formatFormula, parseFormula } from '../utils';

interface Props {
  onBack: () => void;
  language: Language;
}

// Helper to get charge from formula string (e.g. "Fe^2+" -> 2, "Cl^-" -> -1, "e^-" -> -1)
const getCharge = (formula: string): number => {
  // Check for caret indicating charge
  const parts = formula.split('^');
  if (parts.length < 2) {
      // Fallback for simple electron notation if not using caret
      if (formula === 'e' || formula === 'e-') return -1;
      return 0;
  }
  const chargePart = parts[1]; 
  const match = chargePart.match(/(\d*)([\+\-])/);
  if (!match) return 0;
  
  const num = match[1] ? parseInt(match[1], 10) : 1;
  const sign = match[2] === '+' ? 1 : -1;
  return num * sign;
};

const EquationBalancer: React.FC<Props> = ({ onBack, language }) => {
  // Topic Selection State
  const [selectedTopic, setSelectedTopic] = useState<EquationTopic | null>(null);
  const [topicSelectionStep, setTopicSelectionStep] = useState<'MAIN' | 'GENERAL_SUB' | 'REDOX_SUB'>('MAIN');

  // Game State
  const [equations, setEquations] = useState<ChemicalEquation[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userCoefficients, setUserCoefficients] = useState<{[key: string]: string}>({});
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [hintMessage, setHintMessage] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // History State to prevent repetition
  // Stores a simple signature of the equation, e.g., "Na+H2O"
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (selectedTopic) {
      // Reset history when topic changes so we don't block equations from other topics 
      // (though signature usually handles this, it's safer/cleaner)
      setHistory([]);
      loadData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopic]);

  const loadData = async (currentHistory: string[] = history) => {
    if (!selectedTopic) return;
    setLoading(true);
    setCurrentIndex(0);
    setScore(0);
    
    // Request 5 equations, passing the history to exclude recently seen ones
    const { data, isOffline } = await generateEquations(5, selectedTopic, language, currentHistory);
    
    setEquations(data);
    setIsOfflineMode(isOffline);
    
    // Update history with new equations
    const newSignatures = data.map(eq => 
        eq.reactants.map(r => r.formula).sort().join('+')
    );
    
    // Keep history manageable (e.g., last 30 items) to prevent memory bloat
    // but enough to avoid repeats in consecutive runs
    setHistory(prev => [...prev, ...newSignatures].slice(-30));
    
    setLoading(false);
    resetState();
  };

  const resetState = () => {
    setUserCoefficients({});
    setFeedback('none');
    setHintMessage('');
    setShowAnswer(false);
  };

  const currentEquation = equations[currentIndex];

  const handleCoefficientChange = (id: string, value: string) => {
    // Only allow positive integers
    if (value === '' || /^[1-9]\d*$/.test(value)) {
       setUserCoefficients(prev => ({ ...prev, [id]: value }));
       // Clear feedback when user types to encourage retry
       if (feedback === 'incorrect') {
         setFeedback('none');
         setHintMessage('');
       }
    }
  };

  const checkAnswer = () => {
    if (!currentEquation) return;
    const isZH = language === 'ZH';
    
    // Calculate atom balance and charge balance
    const rCounts: Record<string, number> = {};
    const pCounts: Record<string, number> = {};
    let totalChargeL = 0;
    let totalChargeR = 0;
    
    // Sum Reactants
    currentEquation.reactants.forEach((r, idx) => {
      const coeff = parseInt(userCoefficients[`r-${idx}`] || '1', 10);
      
      // Atoms
      const atoms = parseFormula(r.formula);
      for (const [el, count] of Object.entries(atoms)) {
        if (el === 'e') continue; // Ignore electrons in atom count (they are for charge)
        rCounts[el] = (rCounts[el] || 0) + (count * coeff);
      }
      
      // Charge
      totalChargeL += coeff * getCharge(r.formula);
    });

    // Sum Products
    currentEquation.products.forEach((p, idx) => {
      const coeff = parseInt(userCoefficients[`p-${idx}`] || '1', 10);
      
      // Atoms
      const atoms = parseFormula(p.formula);
      for (const [el, count] of Object.entries(atoms)) {
        if (el === 'e') continue; // Ignore electrons in atom count
        pCounts[el] = (pCounts[el] || 0) + (count * coeff);
      }

      // Charge
      totalChargeR += coeff * getCharge(p.formula);
    });

    // Find Unbalanced Atoms
    const allElements = Array.from(new Set([...Object.keys(rCounts), ...Object.keys(pCounts)]));
    const unbalanced: string[] = [];
    const unbalancedElementsList: string[] = []; // Just element names
    const unbalancedDetails: {element: string, left: number, right: number}[] = [];
    
    allElements.forEach(el => {
      const left = rCounts[el] || 0;
      const right = pCounts[el] || 0;
      if (left !== right) {
        unbalanced.push(`${el} (L:${left}, R:${right})`);
        unbalancedElementsList.push(el);
        unbalancedDetails.push({element: el, left, right});
      }
    });

    if (unbalanced.length === 0) {
      // Atoms are balanced.
      // Check Charge Balance
      if (totalChargeL !== totalChargeR) {
         setFeedback('incorrect');
         
         const chargeMsg = isZH 
             ? `電荷未平衡 (左: ${totalChargeL > 0 ? '+' + totalChargeL : totalChargeL}, 右: ${totalChargeR > 0 ? '+' + totalChargeR : totalChargeR})`
             : `Charge unbalanced (Left: ${totalChargeL > 0 ? '+' + totalChargeL : totalChargeL}, Right: ${totalChargeR > 0 ? '+' + totalChargeR : totalChargeR})`;
             
         // Add guide-based hint for charge
         let guideHint = '';
         if (selectedTopic === 'REDOX_HALF') {
             guideHint = isZH
                ? `\n\n💡 提示：根據步驟 (b)，原子平衡後，請調整電子 (e⁻) 的數量來平衡電荷。`
                : `\n\n💡 Hint: According to Step (b), after atoms are balanced, adjust electrons (e⁻) to balance the charge.`;
         } else if (selectedTopic === 'REDOX_FULL') {
             guideHint = isZH
                ? `\n\n💡 提示：根據方法一的步驟 6，請添加 H⁺ (酸性介質) 來平衡電荷。`
                : `\n\n💡 Hint: According to Method 1 Step 6, add H⁺ (in acidic medium) to balance the charges.`;
         }

         setHintMessage(chargeMsg + guideHint);
         return;
      }

      // Both Atoms and Charge are balanced. 
      // Now check if coefficients match the "correct" (simplest) ones.
      let isExactMatch = true;
      currentEquation.reactants.forEach((r, idx) => {
         if (parseInt(userCoefficients[`r-${idx}`] || '1', 10) !== r.coefficient) isExactMatch = false;
      });
      currentEquation.products.forEach((p, idx) => {
         if (parseInt(userCoefficients[`p-${idx}`] || '1', 10) !== p.coefficient) isExactMatch = false;
      });

      if (isExactMatch) {
        setFeedback('correct');
        setScore(prev => prev + 10);
        setHintMessage('');
      } else {
        // Balanced but not simplest form
        setFeedback('incorrect');
        setHintMessage(language === 'ZH' ? '原子與電荷已平衡，但請使用最簡整數比。' : 'Balanced, but please use simplest whole number ratios.');
      }
    } else {
      // Not balanced (Atoms)
      setFeedback('incorrect');
      
      let advice = '';

      // --- GUIDE-BASED HINTS ---
      if (selectedTopic === 'REDOX_HALF') {
         // Priority: Non-O/H -> O -> H
         const nonOH = unbalancedElementsList.find(el => el !== 'O' && el !== 'H');
         const hasO = unbalancedElementsList.includes('O');
         const hasH = unbalancedElementsList.includes('H');

         if (nonOH) {
             advice = isZH
               ? `💡 提示：根據步驟 (a)(i)，請先平衡 ${nonOH} 原子。`
               : `💡 Hint: According to Step (a)(i), balance ${nonOH} atoms first.`;
         } else if (hasO) {
             advice = isZH
               ? `💡 提示：根據步驟 (a)(ii)，其他原子已平衡。現在請調整 H₂O 的係數來平衡氧(O)原子。`
               : `💡 Hint: According to Step (a)(ii), others are balanced. Now adjust H₂O to balance Oxygen.`;
         } else if (hasH) {
             advice = isZH
               ? `💡 提示：根據步驟 (a)(iii)，氧原子已平衡。現在請調整 H⁺ 的係數來平衡氫(H)原子。`
               : `💡 Hint: According to Step (a)(iii), Oxygen is balanced. Now adjust H⁺ to balance Hydrogen.`;
         }
      } else if (selectedTopic === 'REDOX_FULL') {
         // Full Redox specific hints (Method 1 logic)
         const nonOH = unbalancedElementsList.find(el => el !== 'O' && el !== 'H');
         const hasO = unbalancedElementsList.includes('O');
         const hasH = unbalancedElementsList.includes('H');

         if (nonOH) {
            advice = isZH
               ? `💡 提示：根據方法一的步驟 4-5，請先平衡 O 和 H 以外的原子 (${nonOH})。`
               : `💡 Hint: According to Method 1 Steps 4-5, balance atoms other than O and H first (${nonOH}).`;
         } else if (hasO) {
            advice = isZH
               ? `💡 提示：根據方法一的步驟 7(a)，請添加 H₂O 以平衡 O 原子。`
               : `💡 Hint: According to Method 1 Step 7(a), add H₂O to balance O atoms.`;
         } else if (hasH) {
             advice = isZH
               ? `💡 提示：根據方法一的步驟 7(b)，請檢查並確保 H 原子的數目是平衡的。`
               : `💡 Hint: According to Method 1 Step 7(b), check to make sure that the number of H atoms is balanced.`;
         }
      } else {
         // General Strategy
         const nonOH = unbalancedElementsList.find(el => el !== 'O' && el !== 'H');
         const hasOH = unbalancedElementsList.some(el => el === 'O' || el === 'H');

         if (nonOH) {
            advice = isZH
               ? `💡 提示：根據步驟 3，建議先平衡金屬或非金屬原子 (${nonOH})，最後才處理 H 和 O。`
               : `💡 Hint: According to Step 3, balance metal/non-metal atoms (${nonOH}) first, leaving H and O for last.`;
         } else if (hasOH) {
            advice = isZH
               ? `💡 提示：根據步驟 3，其他原子已平衡。最後請檢查並平衡氫(H)和氧(O)原子。`
               : `💡 Hint: According to Step 3, other atoms are balanced. Finally, check and balance Hydrogen and Oxygen.`;
         }
      }
      
      // Fallback to Odd/Even hint
      if (!advice) {
          const oddEvenMismatch = unbalancedDetails.find(d => (d.left % 2 !== d.right % 2));
          if (oddEvenMismatch) {
             const { element, left, right } = oddEvenMismatch;
             const isLeftOdd = left % 2 !== 0;
             const side = isLeftOdd ? (isZH ? "左側" : "left side") : (isZH ? "右側" : "right side");
             const count = isLeftOdd ? left : right;
             advice = isZH
               ? `💡 技巧：${element} 原子的數量在${side}是奇數 (${count})。通常將含有該原子的化合物係數乘以 2 (變成偶數) 會有幫助。`
               : `💡 Tip: ${element} atoms are odd (${count}) on the ${side}. Doubling the coefficient to make it even often helps.`;
          }
      }

      const msg = isZH 
        ? `未平衡：${unbalanced.join(', ')}\n\n${advice}`
        : `Unbalanced: ${unbalanced.join(', ')}\n\n${advice}`;
      setHintMessage(msg);
    }
  };

  const handleNext = () => {
    if (currentIndex < equations.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetState();
    } else {
      loadData(); // This now uses the current history state
    }
  };

  // Determine which steps to show based on topic
  const getSteps = () => {
    const isZH = language === 'ZH';
    
    if (selectedTopic === 'REDOX_HALF') {
       return isZH ? [
        {
          title: "(a) 平衡原子的數目",
          desc: "(i) 先平衡非氧和氫的原子，在化學式前加上適當的系數。\n(ii) 在半方程式的左右兩方加上適當數目的H₂O以平衡氧原子數目。*\n(iii) 在半方程式的左右兩方加上加上適當數目的H⁺以平衡氫原子數目。*"
        },
        {
          title: "(b) 平衡電荷",
          desc: "在半方程式的其中一方加上適當數目的電子，以平衡電荷。"
        },
        {
          title: "*備註",
          desc: "該反應是在酸化的條件下"
        }
       ] : [
        {
          title: "(a) Balance atoms in half equation",
          desc: "(i) Balance the atoms of non-oxygen-and-hydrogen first, add suitable coefficients before the formulae.\n(ii) Add the correct number of H₂O, on either side of the half equation, to balance the number of oxygen atoms.*\n(iii) Add the correct number of H⁺, on either side of the half equation, to balance the number of hydrogen atoms.*"
        },
        {
          title: "(b) Balance charges",
          desc: "Balance the charges by adding correct number of electrons on one side of the half equation."
        },
        {
          title: "*Note",
          desc: "The reaction is under acidified condition"
        }
       ];
    }

    if (selectedTopic === 'REDOX_FULL') {
      return isZH ? [
       {
         title: "方法一：氧化數法 (Oxidation Number Method)",
         desc: "1. 寫出氧化劑、還原劑及其主生成物。\n2. (a) 訂出元素的氧化數。(b) 求出每個式單位獲得或失去的電子數目。\n3. 在左方加入係數，確保氧化劑「獲得的電子」等於還原劑「失去的電子」。"
       },
       {
         title: "平衡原子與電荷",
         desc: "4. 平衡右方生成物的係數。\n5. 平衡 O 和 H 以外的所有原子。\n6. 加入 H⁺ 或 OH⁻ 平衡電荷 (酸性介質加 H⁺ 於缺正電方)。\n7. (a) 加入 H₂O 平衡 O 原子。(b) 最後檢查 H 原子是否平衡。"
       },
       {
         title: "方法二：半反應法 (Half-Equation Method)",
         desc: "1. 將每條平衡的半方程式乘以適當數目，使兩邊電子數相等。\n2. 合併半方程式，約去電子及相同物種。"
       }
      ] : [
       {
         title: "Method 1: Oxidation Numbers",
         desc: "1. Identify agents and products. \n2. (a) Assign oxidation numbers. (b) Determine electrons gained/lost per formula unit.\n3. Add coefficients to reactants so electrons gained equals electrons lost."
       },
       {
         title: "Balance Atoms & Charge",
         desc: "4. Add coefficients to products to balance atoms.\n5. Balance all atoms except O and H.\n6. Add H⁺ or OH⁻ to balance charges (Add H⁺ to positive-deficient side in acid).\n7. (a) Add H₂O to balance O atoms. (b) Check if H atoms are balanced."
       },
       {
         title: "Method 2: Half Equations",
         desc: "1. Multiply balanced half equations so electron counts match.\n2. Combine equations to eliminate electrons and common species."
       }
      ];
   }

    return isZH ? [
        {
          title: "步驟 1：列出原子清單",
          desc: "分別計算箭頭左側（反應物）和右側（生成物）每一種元素的原子總數。"
        },
        {
          title: "步驟 2：調整係數",
          desc: "在化學式前面填入數字（係數）來增加原子數量。注意：絕對不能更改化學式右下角的小數字（下標）！"
        },
        {
          title: "步驟 3：平衡策略",
          desc: "建議順序：先平衡金屬原子，接著是非金屬原子，最後才處理氫(H)和氧(O)。"
        },
        {
          title: "步驟 4：重新檢查",
          desc: "每更改一個係數，都要重新計算兩邊的所有原子數量，確保完全相等。"
        }
      ] : [
        {
          title: "Step 1: List Atoms",
          desc: "Count the total number of atoms for each element on both the reactant (left) and product (right) sides."
        },
        {
          title: "Step 2: Change Coefficients",
          desc: "Place numbers (coefficients) in front of formulas to balance the atoms. Never change the small subscript numbers!"
        },
        {
          title: "Step 3: Strategy",
          desc: "Recommended Order: Balance Metals first, then Non-metals, then Hydrogen, and leave Oxygen for last."
        },
        {
          title: "Step 4: Double Check",
          desc: "Every time you change a coefficient, recount all atoms on both sides to ensure they are equal."
        }
      ];
  };

  const steps = getSteps();

  const txt = {
    ZH: {
      back: "返回",
      score: "得分",
      loading: "正在生成化學反應式...",
      title: "平衡下列化學反應式",
      error: "答案不正確",
      success: "太棒了！平衡正確！",
      next: "下一題",
      correctCoeffs: "正確係數：",
      reactants: "反應物",
      products: "生成物",
      giveUp: "放棄",
      check: "檢查答案",
      hint: "提示：如果不填寫，預設係數為 1。",
      offline: "離線模式",
      selectTopic: "選擇練習部分", 
      topicGeneral: "HKDSE 綜合化學 (Topics 3-5 & Eqm)",
      topicRedox: "氧化還原反應 (Redox)",
      topicRedoxHalf: "半反應式 (Half-Equations)",
      topicRedoxFull: "完整氧化還原反應式 (Full Equations)",
      
      // General Sub-topics
      subMetals: "1. 金屬 (Metals)",
      subAcids: "2. 酸和鹼 (Acids & Bases)",
      subFuels: "3. 化石燃料與碳化合物",
      subEqm: "4. 化學平衡 (Equilibrium)",

      guideTitle: "如何平衡化學方程式？",
    },
    EN: {
      back: "Back",
      score: "Score",
      loading: "Generating chemical equations...",
      title: "Balance the following equation",
      error: "Incorrect Answer",
      success: "Great job! Balanced correctly!",
      next: "Next Question",
      correctCoeffs: "Correct Coefficients:",
      reactants: "Reactants",
      products: "Products",
      giveUp: "Give Up",
      check: "Check Answer",
      hint: "Hint: If left empty, coefficient defaults to 1.",
      offline: "Offline Mode",
      selectTopic: "Select Practice Part", 
      topicGeneral: "HKDSE General Chem (Topics 3-5 & Eqm)",
      topicRedox: "Redox Reactions",
      topicRedoxHalf: "Half-Equations",
      topicRedoxFull: "Full Redox Equations",
      
      subMetals: "1. Metals",
      subAcids: "2. Acids & Bases",
      subFuels: "3. Fossil Fuels & Carbon",
      subEqm: "4. Chemical Equilibrium",

      guideTitle: "How to Balance Equations?",
    }
  }[language];

  // --- TOPIC SELECTION SCREEN ---
  if (!selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto w-full px-4 animate-fade-in">
        <div className="flex items-center mb-10">
           <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium text-lg flex items-center">
            <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {txt.back}
          </button>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">{txt.selectTopic}</h1>
          <div className="w-20 h-1 bg-emerald-500 mx-auto rounded-full"></div>
        </div>

        {/* MAIN MENU */}
        {topicSelectionStep === 'MAIN' && (
          <div className="grid gap-6">
            <button 
              onClick={() => setTopicSelectionStep('GENERAL_SUB')}
              className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all flex items-center group"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mr-8 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-2xl font-bold text-slate-800 group-hover:text-emerald-600">{txt.topicGeneral}</h3>
                <p className="text-slate-500 text-lg mt-1">HKDSE Core Topics</p>
              </div>
              <div className="ml-auto">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>

            <button 
              onClick={() => setTopicSelectionStep('REDOX_SUB')}
              className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex items-center group"
            >
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mr-8 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="text-left flex-1">
                <h3 className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600">{txt.topicRedox}</h3>
                <p className="text-slate-500 text-lg mt-1">Topic VII (Chemical Cells, Electrolysis)</p>
              </div>
              <div className="ml-auto">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          </div>
        )}

        {/* GENERAL SUB-TOPICS */}
        {topicSelectionStep === 'GENERAL_SUB' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
             <div className="md:col-span-2">
                <button 
                  onClick={() => setTopicSelectionStep('MAIN')}
                  className="mb-4 text-slate-500 hover:text-slate-800 flex items-center text-lg"
                >
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  {txt.back}
                </button>
             </div>

             {/* Metals */}
             <button 
              onClick={() => setSelectedTopic('METALS')}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600 font-bold text-xl group-hover:bg-emerald-100">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600">{txt.subMetals}</h3>
            </button>

            {/* Acids */}
            <button 
              onClick={() => setSelectedTopic('ACIDS_BASES')}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600 font-bold text-xl group-hover:bg-emerald-100">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600">{txt.subAcids}</h3>
            </button>

            {/* Fossil Fuels */}
            <button 
              onClick={() => setSelectedTopic('FOSSIL_FUELS')}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600 font-bold text-xl group-hover:bg-emerald-100">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600">{txt.subFuels}</h3>
            </button>

             {/* Equilibrium */}
             <button 
              onClick={() => setSelectedTopic('EQUILIBRIUM')}
              className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all text-left group"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-600 font-bold text-xl group-hover:bg-emerald-100">
                4
              </div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600">{txt.subEqm}</h3>
            </button>
          </div>
        )}

        {/* REDOX SUB-TOPICS */}
        {topicSelectionStep === 'REDOX_SUB' && (
          <div className="grid gap-6 animate-fade-in">
             <button 
              onClick={() => setTopicSelectionStep('MAIN')}
              className="mb-4 text-slate-500 hover:text-slate-800 flex items-center justify-center text-lg"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7-7" /></svg>
              Back to Topics
            </button>

            <button 
              onClick={() => setSelectedTopic('REDOX_HALF')}
              className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex items-center group"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mr-8 font-mono text-indigo-600 font-bold text-2xl group-hover:bg-indigo-100 transition-colors">
                ½
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600">{txt.topicRedoxHalf}</h3>
                <p className="text-slate-500 text-base mt-1">Include electrons (e⁻)</p>
              </div>
            </button>

            <button 
              onClick={() => setSelectedTopic('REDOX_FULL')}
              className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all flex items-center group"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mr-8 font-mono text-indigo-600 font-bold text-2xl group-hover:bg-indigo-100 transition-colors">
                Full
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-indigo-600">{txt.topicRedoxFull}</h3>
                <p className="text-slate-500 text-base mt-1">Balanced ionic equations</p>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- GAME PLAY ---
  if (loading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-emerald-500 mb-6"></div>
        <p className="text-slate-600 text-xl animate-pulse">{txt.loading}</p>
      </div>
    );
  }

  if (!currentEquation) return null;

  return (
    <div className="max-w-6xl mx-auto w-full">
       {/* Header */}
       <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
        {isOfflineMode && (
          <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-xs px-2 py-1 rounded-bl-lg font-bold z-10">
            {txt.offline}
          </div>
        )}
        <button onClick={() => { setSelectedTopic(null); setTopicSelectionStep('MAIN'); }} className="text-slate-500 hover:text-slate-800 font-medium text-lg flex items-center z-10">
          <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          {txt.back}
        </button>
        
        <div className="flex items-center gap-4 z-10">
          <div className="text-xl font-bold text-slate-800">
            {txt.score}: <span className="text-emerald-600 text-3xl">{score}</span>
          </div>
        </div>
      </div>

      {/* Guide Section (Visible directly above) */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 shadow-sm">
        <h3 className="text-indigo-900 font-bold mb-4 flex items-center text-lg uppercase tracking-wide">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {txt.guideTitle}
        </h3>
        <div className="grid gap-4 text-base text-slate-700 leading-relaxed">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white/50 p-3 rounded-lg border border-indigo-50/50">
              <span className="font-bold text-indigo-700 block mb-1 text-lg">{step.title}</span>
              <span className="whitespace-pre-line text-slate-600">{step.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12 relative">
        <div className="absolute top-4 right-6 text-slate-400 text-lg">
           {currentIndex + 1} / {equations.length}
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-700 mb-10 mt-4">
          {txt.title}
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xl md:text-3xl font-medium mb-16 min-h-[180px]">
          
          {/* Reactants */}
          {currentEquation.reactants.map((reactant, idx) => (
            <React.Fragment key={`r-${idx}`}>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="1"
                  value={userCoefficients[`r-${idx}`] || ''}
                  onChange={(e) => handleCoefficientChange(`r-${idx}`, e.target.value)}
                  disabled={feedback === 'correct' || showAnswer}
                  className={`w-14 h-14 md:w-20 md:h-20 text-center border-2 rounded-xl outline-none text-2xl md:text-4xl transition-all
                    ${showAnswer && reactant.coefficient !== parseInt(userCoefficients[`r-${idx}`] || '1') ? 'border-red-400 bg-red-50 text-red-600' : ''}
                    ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 focus:border-emerald-500 focus:shadow-md'}`}
                />
                <div className="flex flex-col items-center">
                   <span>{formatFormula(reactant.formula)}</span>
                   <span className="text-sm text-slate-400 font-normal">{reactant.name}</span>
                </div>
              </div>
              {idx < currentEquation.reactants.length - 1 && <span className="text-slate-400">+</span>}
            </React.Fragment>
          ))}

          {/* Arrow */}
          <div className="px-2 text-slate-400">
            {/* Display double arrow for Equilibrium, single for others */}
            {selectedTopic === 'EQUILIBRIUM' ? (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            ) : (
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            )}
          </div>

          {/* Products */}
          {currentEquation.products.map((product, idx) => (
            <React.Fragment key={`p-${idx}`}>
              <div className="flex items-center space-x-2">
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="1"
                  value={userCoefficients[`p-${idx}`] || ''}
                  onChange={(e) => handleCoefficientChange(`p-${idx}`, e.target.value)}
                  disabled={feedback === 'correct' || showAnswer}
                  className={`w-14 h-14 md:w-20 md:h-20 text-center border-2 rounded-xl outline-none text-2xl md:text-4xl transition-all
                    ${showAnswer && product.coefficient !== parseInt(userCoefficients[`p-${idx}`] || '1') ? 'border-red-400 bg-red-50 text-red-600' : ''}
                    ${feedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 focus:border-emerald-500 focus:shadow-md'}`}
                />
                <div className="flex flex-col items-center">
                   <span>{formatFormula(product.formula)}</span>
                   <span className="text-sm text-slate-400 font-normal">{product.name}</span>
                </div>
              </div>
              {idx < currentEquation.products.length - 1 && <span className="text-slate-400">+</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center space-y-6">
          {feedback === 'incorrect' && !showAnswer && (
            <div className="flex flex-col items-center w-full">
               <div className="text-red-500 font-bold text-xl mb-3 animate-bounce flex items-center">
                 <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 {txt.error}
               </div>
               {hintMessage && (
                 <div className="text-slate-700 bg-red-50 px-6 py-4 rounded-xl border border-red-100 text-lg mb-6 inline-block text-center max-w-2xl whitespace-pre-line leading-relaxed shadow-sm">
                   {hintMessage}
                 </div>
               )}
            </div>
          )}

          {feedback === 'correct' ? (
            <div className="animate-pop text-center">
              <p className="text-emerald-600 text-2xl font-bold mb-6 flex items-center justify-center">
                <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {txt.success}
              </p>
              <button 
                onClick={handleNext}
                className="px-10 py-4 bg-emerald-600 text-white text-xl rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all font-bold"
              >
                {txt.next}
              </button>
            </div>
          ) : showAnswer ? (
             <div className="w-full bg-slate-50 p-8 rounded-2xl text-center border border-slate-200">
                <p className="mb-6 text-slate-600 font-bold text-xl">{txt.correctCoeffs}</p>
                <div className="flex justify-center flex-wrap gap-6 text-xl mb-8">
                  <div className="space-x-2">
                    <span className="font-bold text-slate-500">{txt.reactants}:</span>
                    {currentEquation.reactants.map(r => 
                      <span key={r.formula} className="inline-block bg-white px-3 py-1 rounded-lg border border-slate-200 mx-1 shadow-sm">
                        <span className="text-emerald-600 font-bold">{r.coefficient}</span> {formatFormula(r.formula)}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-400 flex items-center">
                    {selectedTopic === 'EQUILIBRIUM' ? '⇌' : '→'}
                  </div>
                  <div className="space-x-2">
                    <span className="font-bold text-slate-500">{txt.products}:</span>
                    {currentEquation.products.map(p => 
                      <span key={p.formula} className="inline-block bg-white px-3 py-1 rounded-lg border border-slate-200 mx-1 shadow-sm">
                        <span className="text-emerald-600 font-bold">{p.coefficient}</span> {formatFormula(p.formula)}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                onClick={handleNext}
                className="px-10 py-4 bg-slate-800 text-white text-xl rounded-xl hover:bg-slate-700 font-bold shadow-lg"
              >
                {txt.next}
              </button>
             </div>
          ) : (
            <div className="flex space-x-6 w-full justify-center">
               <button
                onClick={() => setShowAnswer(true)}
                className="px-8 py-4 text-slate-400 hover:text-red-500 font-medium text-lg transition-colors"
              >
                {txt.giveUp}
              </button>
              <button
                onClick={checkAnswer}
                className="px-12 py-4 bg-slate-900 text-white text-xl font-bold rounded-xl hover:bg-slate-800 hover:shadow-lg transition-all active:scale-95"
              >
                {txt.check}
              </button>
            </div>
          )}
        </div>
        
        {/* Helper text */}
        {!feedback && !showAnswer && (
           <p className="text-center text-slate-400 text-base mt-10">
             {txt.hint}
           </p>
        )}
      </div>

    </div>
  );
};

export default EquationBalancer;