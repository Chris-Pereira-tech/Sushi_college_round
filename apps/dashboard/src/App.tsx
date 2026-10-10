import React from 'react';

export const App = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="relative z-10 bg-slate-800/50 backdrop-blur-md p-10 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center text-center max-w-lg w-full mx-4">
        <h1 className="text-5xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">
          Patchwork
        </h1>
        <p className="text-xl text-slate-300 font-medium mb-8">Hotfix the Internet</p>
        
        <div className="w-full bg-slate-900/50 rounded-lg p-6 mb-8 border border-slate-700/50">
          <p className="text-slate-400 text-lg">Dashboard coming in Phase 4</p>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-full border border-slate-700">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)] animate-pulse"></div>
          <span className="text-sm font-medium text-slate-300">System Status: Ready</span>
        </div>
      </div>
    </div>
  );
};
