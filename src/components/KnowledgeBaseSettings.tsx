import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { INITIAL_KNOWLEDGE_BASE } from '../data/seedData';
import { BookOpen, Save, RefreshCw, CheckCircle, Info } from 'lucide-react';

export const KnowledgeBaseSettings: React.FC = () => {
  const { knowledgeBase, setKnowledgeBase } = useApp();
  const [editText, setEditText] = useState(knowledgeBase);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setKnowledgeBase(editText);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    if (confirm('Reset knowledge base to standard MBSSE child protection policies & laws?')) {
      setEditText(INITIAL_KNOWLEDGE_BASE);
      setKnowledgeBase(INITIAL_KNOWLEDGE_BASE);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-l-4 border-l-[#14324A]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#14324A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1F7A74]" />
              <span>MBSSE Child Protection Knowledge Base</span>
            </h2>
            <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[11px] font-bold">
              AI Grounding Text
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            This live knowledge text directly conditions the Citizen WhatsApp Chatbot. Update laws, emergency contacts, or ministerial directives anytime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Official Base</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg bg-[#1F7A74] hover:bg-[#18605c] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Knowledge Base</span>
          </button>
        </div>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2 border border-emerald-200 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Knowledge base updated! The Citizen Chatbot will now cite these updated guidelines.</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
          <Info className="w-4 h-4 text-[#1F7A74] flex-shrink-0" />
          <span>
            You can edit or paste Sierra Leone Child Rights Act sections, Sexual Offences penalties, MBSSE Teacher Code of Conduct circulars, or Rainbo Centre clinical protocols below.
          </span>
        </div>

        <textarea
          rows={18}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          className="w-full p-4 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1F7A74] leading-relaxed bg-slate-50/50"
        />
      </div>
    </div>
  );
};
