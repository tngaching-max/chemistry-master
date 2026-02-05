
import React, { useState, useEffect } from 'react';
import { generateBuilderChallenges } from '../services/geminiService';
import { EquationChallenge, Language, EquationComponent } from '../types';
import { formatFormula, parseFormula } from '../utils';

interface Props {
  onBack: () => void;
  language: Language;
}

interface UserInputItem {
  id: string;
  coeff: string;
  formula: string;
}

const EquationBuilder: React.FC<Props> = ({ onBack, language }) => {
  const [challenges, setChallenges] = useState<EquationChallenge[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  
  const [userReactants, setUserReactants] = useState<UserInputItem[]>([]);
  const [userProducts, setUserProducts] = useState<UserInputItem[]>([]);
  
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [feedbackMessages, setFeedbackMessages] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // 總共 6 個課題組（1&2, 3, 4, 6, 7, 8）
    const result = await generateBuilderChallenges(6, language);
    setChallenges(result.data);
    setIsOffline(result.isOffline);
    setLoading(false);
    if (result.data.length > 0) {
      setCurrentIndex(0);
      resetInputs();
    }
  };

  const resetInputs = () => {
    setUserReactants([{ id: 'r-0', coeff: '', formula: '' }]);
    setUserProducts([{ id: 'p-0', coeff: '', formula: '' }]);
    setFeedback('none');
    setFeedbackMessages([]);
  };

  const addItem = (type: 'REACTANT' | 'PRODUCT') => {
    const newItem = { id: `${type === 'REACTANT' ? 'r' : 'p'}-${Date.now()}`, coeff: '', formula: '' };
    if (type === 'REACTANT') {
      setUserReactants([...userReactants, newItem]);
    } else {
      setUserProducts([...userProducts, newItem]);
    }
    if (feedback !== 'none') setFeedback('none');
  };

  const removeItem = (type: 'REACTANT' | 'PRODUCT', id: string) => {
    if (type === 'REACTANT') {
      if (userReactants.length > 1) {
        setUserReactants(userReactants.filter(item => item.id !== id));
      }
    } else {
      if (userProducts.length > 1) {
        setUserProducts(userProducts.filter(item => item.id !== id));
      }
    }
    if (feedback !== 'none') setFeedback('none');
  };

  const updateItem = (type: 'REACTANT' | 'PRODUCT', id: string, field: 'coeff' | 'formula', value: string) => {
    const setter = type === 'REACTANT' ? setUserReactants : setUserProducts;
    setter(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
    if (feedback !== 'none') setFeedback('none');
  };

  const checkAnswer = () => {
    const current = challenges[currentIndex];
    const newFeedbackMessages: string[] = [];
    
    const normalize = (str: string) => str.trim().replace(/\s+/g, '');
    const getCoeff = (c: string) => c.trim() === '' ? 1 : parseInt(c);
    
    // --- 1. Validate Reactant Formulas ---
    const userR = userReactants.filter(i => i.formula.trim() !== '');
    
    current.reactants.forEach(cr => {
      const match = userR.find(ur => normalize(ur.formula) === normalize(cr.formula));
      if (!match) {
         const mistake = userR.find(ur => {
            const uNorm = normalize(ur.formula);
            const cNorm = normalize(cr.formula);
            const diatomics = ['H2', 'O2', 'N2', 'Cl2', 'Br2', 'I2', 'F2'];
            if (diatomics.includes(cNorm) && uNorm === cNorm.replace('2', '')) return true;
            return false;
         });
         
         if (mistake) {
           newFeedbackMessages.push(`⚠️ ${language === 'ZH' ? '反應物' : 'Reactant'}: "${mistake.formula}" ${language === 'ZH' ? '不正確。請注意' : 'is incorrect. Note that'} ${cr.formula} ${language === 'ZH' ? '是雙原子分子。' : 'is a diatomic molecule.'}`);
         } else {
           newFeedbackMessages.push(`⚠️ ${language === 'ZH' ? '缺漏或錯誤反應物' : 'Missing/Incorrect Reactant'}: ${cr.formula} (${language === 'ZH' ? '請檢查化學式' : 'Check formula'})`);
         }
      }
    });

    userR.forEach(ur => {
       const uNorm = normalize(ur.formula);
       if (!current.reactants.some(cr => normalize(cr.formula) === uNorm)) {
           if (!newFeedbackMessages.some(msg => msg.includes(ur.formula))) {
              newFeedbackMessages.push(`⚠️ ${language === 'ZH' ? '多餘的反應物' : 'Extra Reactant'}: ${ur.formula}`);
           }
       }
    });


    // --- 2. Validate Product Formulas ---
    const userP = userProducts.filter(i => i.formula.trim() !== '');
    
    current.products.forEach(cp => {
      const match = userP.find(up => normalize(up.formula) === normalize(cp.formula));
      if (!match) {
         newFeedbackMessages.push(`⚠️ ${language === 'ZH' ? '缺漏或錯誤生成物' : 'Missing/Incorrect Product'}: ${cp.formula}`);
      }
    });
     userP.forEach(up => {
       const uNorm = normalize(up.formula);
       if (!current.products.some(cp => normalize(cp.formula) === uNorm)) {
           newFeedbackMessages.push(`⚠️ ${language === 'ZH' ? '多餘的生成物' : 'Extra Product'}: ${up.formula}`);
       }
    });

    // --- 3. Validate Coefficients (Balancing) ---
    if (newFeedbackMessages.length === 0) {
        const rAtoms: Record<string, number> = {};
        const pAtoms: Record<string, number> = {};
        
        userR.forEach(ur => {
           const c = getCoeff(ur.coeff);
           const counts = parseFormula(ur.formula); 
           for(const [el, n] of Object.entries(counts)) rAtoms[el] = (rAtoms[el] || 0) + n * c;
        });
        
        userP.forEach(up => {
           const c = getCoeff(up.coeff);
           const counts = parseFormula(up.formula);
           for(const [el, n] of Object.entries(counts)) pAtoms[el] = (pAtoms[el] || 0) + n * c;
        });
        
        const allEls = new Set([...Object.keys(rAtoms), ...Object.keys(pAtoms)]);
        let balanced = true;
        const balanceIssues: string[] = [];

        allEls.forEach(el => {
            const l = rAtoms[el] || 0;
            const r = pAtoms[el] || 0;
            if (l !== r) {
                balanced = false;
                balanceIssues.push(`${el} (L:${l}, R:${r})`);
            }
        });
        
        if (!balanced) {
            newFeedbackMessages.push(`⚠️ ${language === 'ZH' ? '原子未平衡' : 'Atoms Unbalanced'}: ${balanceIssues.join(', ')}`);
        }
    }

    if (newFeedbackMessages.length === 0) {
        setFeedback('correct');
        setScore(s => s + 10);
        setFeedbackMessages([]);
    } else {
        setFeedback('incorrect');
        setFeedbackMessages(newFeedbackMessages);
    }
  };

  const nextLevel = () => {
    if (currentIndex < challenges.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetInputs();
    } else {
      loadData();
    }
  };

  const topicOrderNames = {
    ZH: ['課題 1 & 2', '課題 3', '課題 4', '課題 6', '課題 7', '課題 8'],
    EN: ['Topic 1 & 2', 'Topic 3', 'Topic 4', 'Topic 6', 'Topic 7', 'Topic 8']
  }[language];

  const txt = {
    ZH: {
      title: "方程式建構",
      loading: "正在生成題目...",
      descLabel: "目標反應：",
      reactants: "反應物",
      products: "生成物",
      check: "檢查答案",
      next: "下一題",
      correct: "正確！",
      incorrect: "答案不正確",
      errBoth: "反應物和生成物都有錯誤。",
      errReactants: "反應物部分有誤。",
      errProducts: "生成物部分有誤。",
      guide: "請輸入化學式及係數 (如係數為 1 可留空)。",
      score: "得分",
      offline: "離線模式",
      add: "新增",
      inputFormula: "化學式 (如 O2)",
      inputCoeff: "係數",
      progress: "進度"
    },
    EN: {
      title: "Equation Builder",
      loading: "Generating challenges...",
      descLabel: "Target Reaction:",
      reactants: "Reactants",
      products: "Products",
      check: "Check Answer",
      next: "Next",
      correct: "Correct!",
      incorrect: "Incorrect",
      errBoth: "Both reactants and products are incorrect.",
      errReactants: "Reactants are incorrect.",
      errProducts: "Products are incorrect.",
      guide: "Enter formulas and coefficients (leave coefficient empty for 1).",
      score: "Score",
      offline: "Offline Mode",
      add: "Add",
      inputFormula: "Formula (e.g. O2)",
      inputCoeff: "Coeff",
      progress: "Progress"
    }
  }[language];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-rose-500 mb-6"></div>
        <p className="text-slate-600 text-xl animate-pulse">{txt.loading}</p>
      </div>
    );
  }

  const currentChallenge = challenges[currentIndex];

  const renderSection = (title: string, items: UserInputItem[], type: 'REACTANT' | 'PRODUCT', colorClass: string) => (
    <div className={`flex-1 p-6 rounded-xl border-2 bg-white/50 ${colorClass}`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-slate-700 uppercase text-sm tracking-wider">{title}</h4>
      </div>
      
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={item.id} className="flex gap-3 items-start animate-fade-in">
             {/* Coefficient Input */}
             <div className="w-20 flex-shrink-0">
               <input
                 type="number"
                 placeholder="1"
                 value={item.coeff}
                 onChange={(e) => updateItem(type, item.id, 'coeff', e.target.value)}
                 className="w-full p-3 text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none font-mono font-bold text-xl"
               />
               <div className="text-xs text-center text-slate-400 mt-1">{txt.inputCoeff}</div>
             </div>

             {/* Formula Input */}
             <div className="flex-grow">
               <input
                 type="text"
                 placeholder={txt.inputFormula}
                 value={item.formula}
                 onChange={(e) => updateItem(type, item.id, 'formula', e.target.value)}
                 className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none font-mono text-lg"
               />
               {/* Preview */}
               <div className="h-6 text-lg text-slate-600 font-bold mt-1 px-1">
                 {item.formula ? formatFormula(item.formula) : <span className="opacity-0">-</span>}
               </div>
             </div>

             {/* Delete Button */}
             {items.length > 1 && (
               <button 
                onClick={() => removeItem(type, item.id)}
                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             )}
          </div>
        ))}
      </div>

      <button 
        onClick={() => addItem(type)}
        className="mt-6 w-full py-3 flex items-center justify-center text-base font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg dashed-border border-2 border-slate-200 border-dashed"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        {txt.add}
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto w-full px-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden">
         {isOffline && (
          <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-xs px-2 py-1 rounded-bl-lg font-bold z-10">
            {txt.offline}
          </div>
        )}
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-medium text-lg flex items-center z-10">
          <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <div className="text-center z-10 hidden md:block">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{txt.progress}</div>
           <div className="flex gap-2">
             {challenges.map((_, i) => (
               <div key={i} className={`w-3 h-3 rounded-full ${i === currentIndex ? 'bg-rose-500 scale-125' : i < currentIndex ? 'bg-emerald-400' : 'bg-slate-200'} transition-all`} />
             ))}
           </div>
        </div>
        <div className="text-xl font-bold text-slate-800 z-10">
          {txt.score}: <span className="text-rose-600 text-3xl">{score}</span>
        </div>
      </div>

      {/* Description Box */}
      <div className="bg-white p-8 rounded-2xl shadow-md border-l-4 border-rose-500 mb-10">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest">{txt.descLabel}</h3>
          <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-xs font-black uppercase">
            {topicOrderNames[currentIndex]}
          </span>
        </div>
        <p className="text-2xl md:text-3xl font-bold text-slate-800 leading-relaxed">
          {currentChallenge.description}
        </p>
      </div>

      {/* Builder Zone */}
      <div className="flex flex-col lg:flex-row gap-8 mb-10 relative">
        {renderSection(txt.reactants, userReactants, 'REACTANT', 'border-amber-100')}
        
        {/* Arrow Divider */}
        <div className="flex items-center justify-center lg:pt-12">
           <div className="bg-white p-3 rounded-full shadow-md border border-slate-200 text-slate-400">
             <svg className="w-8 h-8 rotate-90 lg:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
           </div>
        </div>

        {renderSection(txt.products, userProducts, 'PRODUCT', 'border-indigo-100')}
      </div>

      {/* Controls */}
      <div className="text-center pb-24">
        {feedback === 'none' && (
          <button
            onClick={checkAnswer}
            className="px-14 py-5 bg-slate-800 text-white text-xl font-bold rounded-2xl hover:bg-slate-700 hover:shadow-lg transition-all active:scale-95"
          >
            {txt.check}
          </button>
        )}

        {feedback === 'incorrect' && (
          <div className="flex flex-col items-center animate-pop">
            <p className="text-red-500 text-xl font-bold mb-3 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {txt.incorrect}
            </p>
            {feedbackMessages.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-6 text-left max-w-2xl w-full">
                {feedbackMessages.map((msg, i) => (
                  <div key={i} className="text-slate-700 text-lg mb-2 last:mb-0 flex items-start">
                    <span className="mr-3 mt-1">•</span>
                    <span>{msg}</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setFeedback('none')}
              className="px-10 py-4 bg-slate-800 text-white text-lg rounded-xl hover:bg-slate-700"
            >
              Retry
            </button>
          </div>
        )}

        {feedback === 'correct' && (
          <div className="flex flex-col items-center animate-pop">
            <div className="text-emerald-500 font-bold text-2xl mb-6 flex items-center">
              <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              {txt.correct}
            </div>
            <button
              onClick={nextLevel}
              className="px-14 py-5 bg-emerald-600 text-white text-xl font-bold rounded-2xl hover:bg-emerald-700 hover:shadow-lg transition-all"
            >
              {txt.next}
            </button>
          </div>
        )}
        
        <p className="text-slate-400 text-sm mt-10 border-t pt-6 border-slate-200 inline-block px-6">
          {txt.guide}
        </p>
      </div>
    </div>
  );
};

export default EquationBuilder;
