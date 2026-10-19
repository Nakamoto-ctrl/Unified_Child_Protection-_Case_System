import React from 'react';
import { useApp } from '../context/AppContext';
import { USER_ROLES, UserRole, SIERRA_LEONE_DISTRICTS, District } from '../types';
import { isCaseEscalated } from '../utils/helpers';
import {
  ShieldAlert,
  PhoneCall,
  Bell,
  RefreshCw,
  MessageSquare,
  FileText,
  Inbox,
  LayoutDashboard,
  MapPin,
  BookOpen,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentDistrictFilter,
    setCurrentDistrictFilter,
    cases,
    smsMessages,
    activeView,
    setActiveView,
    resetToSampleData,
  } = useApp();

  const escalatedCount = cases.filter(isCaseEscalated).length;
  const toVerifyCount = cases.filter((c) => c.status === 'To Verify').length;

  const currentRoleInfo = USER_ROLES[currentRole];

  return (
    <header className="bg-[#14324A] text-white shadow-md border-b border-white/10 sticky top-0 z-50">
      {/* Top Ministerial Branding Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Sierra Leone Emblem / Crest */}
          <div className="w-10 h-10 rounded-lg bg-[#1F7A74] flex items-center justify-center font-bold text-white shadow-inner border border-emerald-400/30 flex-shrink-0">
            <span className="text-sm tracking-tighter font-serif font-black">SL</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Protect Pikin
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-[#1F7A74] text-emerald-100 font-sans">
                  MBSSE System
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-300">
              Ministry of Basic & Senior Secondary Education • Republic of Sierra Leone
            </p>
          </div>
        </div>

        {/* Global Action Badges & Reset Demo */}
        <div className="flex items-center flex-wrap gap-2.5">
          {escalatedCount > 0 && (
            <button
              onClick={() => {
                setActiveView('dashboard');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#C0392B] text-white text-xs font-semibold animate-pulse shadow-sm hover:bg-red-700 transition"
              title="Cases with no action within 2-hour SLA"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{escalatedCount} Escalated RED</span>
            </button>
          )}

          {toVerifyCount > 0 && currentRole === 'CALL_AGENT' && (
            <button
              onClick={() => setActiveView('to-verify')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-600 text-white text-xs font-semibold shadow-sm hover:bg-amber-700 transition"
            >
              <span>{toVerifyCount} WhatsApp To Verify</span>
            </button>
          )}

          <button
            onClick={() => setActiveView('sms-outbox')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition border ${
              activeView === 'sms-outbox'
                ? 'bg-[#1F7A74] text-white border-teal-300'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
            }`}
            title="View Simulated SMS Outbox"
          >
            <Bell className="w-3.5 h-3.5 text-amber-300" />
            <span>SMS Outbox</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] text-amber-300 font-bold">
              {smsMessages.length}
            </span>
          </button>

          <button
            onClick={() => {
              if (confirm('Reset prototype to 30 pristine sample cases and initial data?')) {
                resetToSampleData();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-xs transition border border-white/10"
            title="Reset to 30 sample cases"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Role Switcher & Navigation Bar */}
      <div className="bg-[#0e2436] border-t border-white/10 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Role Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider flex items-center gap-1">
              Role:
            </span>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(USER_ROLES) as UserRole[]).map((rKey) => {
                const r = USER_ROLES[rKey];
                const isSelected = currentRole === rKey;
                return (
                  <button
                    key={rKey}
                    onClick={() => {
                      setCurrentRole(rKey);
                      if (rKey === 'CITIZEN') {
                        setActiveView('citizen-chatbot');
                      } else if (rKey === 'CALL_AGENT' && activeView === 'citizen-chatbot') {
                        setActiveView('new-case');
                      }
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#1F7A74] text-white shadow-sm ring-1 ring-teal-300'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span>{r.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* District View Filter */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-teal-400" />
            <label htmlFor="district-select" className="text-xs text-slate-300">
              District:
            </label>
            <select
              id="district-select"
              value={currentDistrictFilter}
              onChange={(e) => setCurrentDistrictFilter(e.target.value as District | 'All')}
              className="bg-[#14324A] text-xs text-white border border-white/20 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400"
            >
              <option value="All">All Sierra Leone (16 Districts)</option>
              {SIERRA_LEONE_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#14324A] border-t border-white/10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition ${
              activeView === 'dashboard'
                ? 'bg-white text-[#14324A] font-semibold'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveView('new-case')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition ${
              activeView === 'new-case'
                ? 'bg-white text-[#14324A] font-semibold'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-teal-300" />
            <span>Call Agent (Intake #4060)</span>
          </button>

          <button
            onClick={() => setActiveView('inbox')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition ${
              activeView === 'inbox'
                ? 'bg-white text-[#14324A] font-semibold'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Department Inbox ({currentRoleInfo.name})</span>
          </button>

          <button
            onClick={() => setActiveView('to-verify')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition ${
              activeView === 'to-verify'
                ? 'bg-white text-[#14324A] font-semibold'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>WhatsApp "To Verify" Queue</span>
            {toVerifyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {toVerifyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('citizen-chatbot')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition ${
              activeView === 'citizen-chatbot'
                ? 'bg-[#25D366] text-slate-900 font-bold'
                : 'text-emerald-300 hover:bg-white/10'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Citizen WhatsApp Bot</span>
          </button>

          <button
            onClick={() => setActiveView('knowledge-base')}
            className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition ml-auto ${
              activeView === 'knowledge-base'
                ? 'bg-white text-[#14324A] font-semibold'
                : 'text-slate-200 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Base</span>
          </button>
        </div>
      </div>
    </header>
  );
};
