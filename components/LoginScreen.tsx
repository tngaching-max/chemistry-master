import React, { useState } from 'react';
import { Language } from '../types';

interface Props {
  onLogin: (name: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin, language, setLanguage }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  const t = {
    ZH: {
      welcome: "歡迎來到化學大師",
      enterName: "請輸入您的名字開始遊戲",
      placeholder: "您的名字 (例如: Peter)",
      start: "開始學習",
      desc: "我們會記錄您的學習進度，下次回來可以繼續挑戰！"
    },
    EN: {
      welcome: "Welcome to Chemistry Master",
      enterName: "Enter your name to start",
      placeholder: "Your Name (e.g. Peter)",
      start: "Start Learning",
      desc: "We will save your progress so you can continue later!"
    }
  }[language];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 px-4">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 md:top-10 md:right-10 z-20">
        <div className="bg-white/20 backdrop-blur-md p-1 rounded-full border border-white/30 flex">
          <button
            onClick={() => setLanguage('ZH')}
            className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${language === 'ZH' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'}`}
          >
            中文
          </button>
          <button
            onClick={() => setLanguage('EN')}
            className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${language === 'EN' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/10'}`}
          >
            English
          </button>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md animate-pop text-center relative overflow-hidden">
        {/* Decoration */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-300 rounded-full blur-3xl opacity-20"></div>

        <div className="mb-8 flex justify-center">
            <div className="p-4 bg-indigo-50 rounded-full">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t.welcome}</h1>
        <p className="text-slate-500 mb-8">{t.enterName}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <input
              type="text"
              required
              className="block w-full pl-10 pr-3 py-4 border border-slate-300 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg transition-all"
              placeholder={t.placeholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg transition-transform active:scale-95"
          >
            {t.start}
          </button>
        </form>
        
        <p className="mt-6 text-xs text-slate-400">{t.desc}</p>
      </div>
    </div>
  );
};

export default LoginScreen;