
import React from 'react';
import { Screen, Language, UserProfile } from '../types';

interface Props {
  onSelectScreen: (screen: Screen) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  user: UserProfile;
  onLogout: () => void;
}

// Static Background Decoration Component
const StaticBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
    {/* --- ORIGINAL ELEMENTS --- */}

    {/* Decoration 1: Benzene Ring Style (Top Right - Moved down) */}
    <svg className="absolute top-[80px] md:top-[120px] right-[-20px] w-64 h-64 text-slate-200 opacity-60 transform rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" />
      <circle cx="50" cy="50" r="20" strokeWidth="1" />
      <path d="M50 10 L50 30 M85 30 L67 40 M85 70 L67 60 M50 90 L50 70 M15 70 L33 60 M15 30 L33 40" strokeWidth="1" opacity="0.5" />
    </svg>

    {/* Decoration 2: Molecular Chain (Bottom Left) */}
    <svg className="absolute bottom-0 left-0 w-80 h-80 text-indigo-100 opacity-50 transform -translate-x-10 translate-y-10" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="3">
       <line x1="40" y1="160" x2="80" y2="130" />
       <line x1="80" y1="130" x2="120" y2="160" />
       <line x1="120" y1="160" x2="160" y2="130" />
       
       <circle cx="40" cy="160" r="8" fill="#e0e7ff" stroke="none" />
       <circle cx="80" cy="130" r="8" fill="#e0e7ff" stroke="none" />
       <circle cx="120" cy="160" r="8" fill="#e0e7ff" stroke="none" />
       <circle cx="160" cy="130" r="8" fill="#e0e7ff" stroke="none" />
       
       <text x="35" y="164" fontSize="10" fill="#6366f1" fontWeight="bold">C</text>
       <text x="75" y="134" fontSize="10" fill="#6366f1" fontWeight="bold">C</text>
       <text x="115" y="164" fontSize="10" fill="#6366f1" fontWeight="bold">C</text>
       <text x="155" y="134" fontSize="10" fill="#6366f1" fontWeight="bold">C</text>
    </svg>

    {/* Decoration 3: Element Tile (Floating behind content - Top Left) */}
    <div className="absolute top-[20%] left-[10%] opacity-20 hidden md:block rotate-12">
        <div className="border-4 border-slate-300 p-4 rounded-xl w-32 h-32 flex flex-col items-center justify-center bg-white">
            <div className="self-start text-xs font-bold text-slate-400">11</div>
            <div className="text-5xl font-black text-slate-400 my-1">Na</div>
            <div className="text-xs text-slate-400">22.99</div>
        </div>
    </div>
    
    {/* Decoration 4: Hexagon Grid Pattern (Subtle) */}
    <div className="absolute top-1/2 right-[15%] w-40 h-40 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12 2l8.66 5v10L12 22 3.34 17V7L12 2z' fill='none' stroke='%2364748b' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 40px'
        }}
    ></div>

    {/* --- ADDED APPARATUS FIGURES (Subtle) --- */}

    {/* Apparatus 1: Conical Flask (Bottom Right) */}
    <svg className="absolute bottom-[5%] right-[5%] w-48 h-48 text-emerald-100 opacity-40 transform -rotate-12 hidden md:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
       <path strokeLinecap="round" strokeLinejoin="round" d="M10 2h4v6l5 13H5l5-13V2z" />
       <path strokeLinecap="round" strokeLinejoin="round" d="M8 14h8" strokeDasharray="2 2" />
       <circle cx="14" cy="18" r="1" fill="currentColor" className="opacity-50" />
       <circle cx="11" cy="19" r="0.5" fill="currentColor" className="opacity-50" />
    </svg>

    {/* Apparatus 2: Test Tube (Middle Left, floating near molecule) */}
    <svg className="absolute top-[40%] left-[5%] w-32 h-32 text-rose-100 opacity-30 transform rotate-[15deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6v15a3 3 0 01-6 0V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6" strokeDasharray="1 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15h6" strokeDasharray="1 3" />
    </svg>

    {/* Apparatus 3: Beaker (Top Center/Right) */}
    <svg className="absolute top-[10%] right-[30%] w-40 h-40 text-slate-100 opacity-40 transform rotate-6 hidden lg:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
       <path strokeLinecap="round" strokeLinejoin="round" d="M6 5v14a2 2 0 002 2h8a2 2 0 002-2V5" />
       <path strokeLinecap="round" strokeLinejoin="round" d="M18 5H6" />
       <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" strokeDasharray="2 2" />
    </svg>

  </div>
);

const LevelSelection: React.FC<Props> = ({ onSelectScreen, language, setLanguage, user, onLogout }) => {
  
  const content = {
    ZH: {
      title: "化學大師",
      subtitle: "透過 AI 驅動的練習，精通化學式書寫與方程式平衡。",
      welcome: "你好, ",
      logout: "登出",
      level1Title: "第一關：元素與離子特訓",
      level1Desc: "共 10 個階段的紮實特訓：從 1-20 號元素排序、符號書寫，到離子記憶翻牌，最終進入化合物化學式組合練習。",
      level1Example: "例如：根據名稱「氧化鎂」寫出 MgO。",
      level1Btn: "開始特訓",
      level1Progress: `目前進度：階段 ${user.progress.level1MaxStage}`,
      level2Title: "第二關：方程式平衡",
      level2Desc: "利用化學式填寫係數，平衡化學反應方程式。",
      level2Example: "例如：2H₂ + O₂ → 2H₂O",
      level2Btn: "開始挑戰",
      level3Title: "第三關：方程式建構",
      level3Desc: "根據文字描述，選出正確的反應物和生成物，建構完整的化學方程式。",
      level3Example: "例如：鎂燃燒 → 選出 Mg, O₂ 和 MgO",
      level3Btn: "開始建構"
    },
    EN: {
      title: "Chemistry Master",
      subtitle: "Master chemical formulas and equation balancing with AI-powered practice.",
      welcome: "Hi, ",
      logout: "Logout",
      level1Title: "Level 1: Elements & Ions",
      level1Desc: "10-stage intensive training: From element ordering and symbol writing to ion memory matching and compound formula construction.",
      level1Example: "Ex: Write 'MgO' for Magnesium Oxide.",
      level1Btn: "Start Training",
      level1Progress: `Current: Stage ${user.progress.level1MaxStage}`,
      level2Title: "Level 2: Equation Balancing",
      level2Desc: "Balance chemical reaction equations by filling in the correct coefficients.",
      level2Example: "Ex: 2H₂ + O₂ → 2H₂O",
      level2Btn: "Start Challenge",
      level3Title: "Level 3: Equation Builder",
      level3Desc: "Construct the full chemical equation from a text description by selecting the correct species.",
      level3Example: "Ex: Burning Magnesium → Pick Mg, O₂, MgO",
      level3Btn: "Start Building"
    }
  };

  const t = content[language];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-8 animate-fade-in w-full pb-10">
      
      {/* Background Decorations */}
      <StaticBackground />

      {/* Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start md:items-center">
        {/* EDB Branding */}
        <div className="select-none hidden md:block">
          <div className="font-bold text-slate-700 text-lg md:text-xl leading-tight">教育局科學教育組</div>
          <div className="text-sm md:text-base text-slate-500 font-medium">EDB Science Education Section</div>
        </div>

        {/* User Info & Controls */}
        <div className="flex flex-col md:flex-row items-end md:items-center gap-3 w-full md:w-auto">
           {/* User Badge */}
           <div className="flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-indigo-100">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-2">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-slate-700 font-bold mr-3">{t.welcome}{user.name}</span>
              <button onClick={onLogout} className="text-xs text-slate-400 hover:text-red-500 font-medium border-l pl-3 border-slate-300">
                {t.logout}
              </button>
           </div>

           {/* Language Toggle */}
           <div className="bg-white p-1 rounded-full shadow-sm border border-slate-200 flex">
            <button
              onClick={() => setLanguage('ZH')}
              className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                language === 'ZH' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setLanguage('EN')}
              className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all duration-200 ${
                language === 'EN' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-indigo-600'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center pt-32 md:pt-20 mb-4">
        {/* Title Block with Aligned Logo */}
        <div className="flex flex-row items-center justify-center space-x-4 bg-white/60 backdrop-blur-sm p-4 pr-8 rounded-3xl border border-white/50 shadow-sm mb-4">
          <div className="p-3 bg-indigo-100 rounded-full shadow-inner flex-shrink-0">
            <svg className="w-10 h-10 md:w-12 md:h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 tracking-tight drop-shadow-sm">
            {t.title}
          </h1>
        </div>

        <p className="text-xl text-slate-600 max-w-lg mx-auto bg-white/40 backdrop-blur-sm rounded-lg p-2 text-center">
          {t.subtitle}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mt-4 z-10 relative">
        {/* Level 1 Card */}
        <button
          onClick={() => onSelectScreen(Screen.LEVEL_1)}
          className="group relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-indigo-300 transition-all duration-300 text-left overflow-hidden h-full flex flex-col hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-7xl font-black">1</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">
            {t.level1Title}
          </h2>
          <div className="mb-4 inline-block bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 text-sm font-bold border border-indigo-100">
             {t.level1Progress}
          </div>
          <p className="text-lg text-slate-600 flex-grow">
            {t.level1Desc}<br/>
            <span className="text-base text-slate-500 mt-2 block">{t.level1Example}</span>
          </p>
          <div className="mt-6 flex items-center text-indigo-600 font-bold text-lg">
            {t.level1Btn}
            <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
        </button>

        {/* Level 2 Card */}
        <button
          onClick={() => onSelectScreen(Screen.LEVEL_2)}
          className="group relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-emerald-300 transition-all duration-300 text-left overflow-hidden h-full flex flex-col hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-7xl font-black">2</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-emerald-600 transition-colors">
            {t.level2Title}
          </h2>
          <p className="text-lg text-slate-600 flex-grow">
            {t.level2Desc}<br/>
            <span className="text-base text-slate-500 mt-2 block">{t.level2Example}</span>
          </p>
          <div className="mt-6 flex items-center text-emerald-600 font-bold text-lg">
            {t.level2Btn}
            <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
        </button>

         {/* Level 3 Card */}
         <button
          onClick={() => onSelectScreen(Screen.LEVEL_3)}
          className="group relative bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-sm hover:shadow-xl border border-slate-200 hover:border-rose-300 transition-all duration-300 text-left overflow-hidden h-full flex flex-col hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-7xl font-black">3</span>
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-3 group-hover:text-rose-600 transition-colors">
            {t.level3Title}
          </h2>
          <p className="text-lg text-slate-600 flex-grow">
            {t.level3Desc}<br/>
            <span className="text-base text-slate-500 mt-2 block">{t.level3Example}</span>
          </p>
          <div className="mt-6 flex items-center text-rose-600 font-bold text-lg">
            {t.level3Btn}
            <svg className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </div>
        </button>
      </div>
    </div>
  );
};

export default LevelSelection;
