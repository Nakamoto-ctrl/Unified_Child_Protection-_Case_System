import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { USER_ROLES, UrgencyLevel } from '../types';
import {
  filterCasesForRole,
  isCaseEscalated,
  getWaitingTime,
  getUrgencyStyles,
  formatTimeAgo,
} from '../utils/helpers';
import {
  Inbox,
  CheckCircle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  ExternalLink,
  Building2,
  AlertCircle,
} from 'lucide-react';

export const DepartmentInbox: React.FC = () => {
  const {
    cases,
    currentRole,
    currentDistrictFilter,
    acknowledgeCase,
    setSelectedCaseId,
    setActiveView,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyLevel | 'ALL'>('ALL');

  const roleInfo = USER_ROLES[currentRole];
  const deptKey = roleInfo.departmentKey;

  // Filter for role & district
  const routedCases = filterCasesForRole(cases, currentRole, currentDistrictFilter).filter(
    (c) => c.status !== 'To Verify'
  );

  // Search & urgency filters
  const displayedCases = routedCases.filter((c) => {
    if (urgencyFilter !== 'ALL' && c.urgency !== urgencyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.community.toLowerCase().includes(q) ||
        c.abuseType.toLowerCase().includes(q) ||
        (c.school && c.school.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Sort most urgent first (RED > AMBER > GREEN), then waiting time
  displayedCases.sort((a, b) => {
    const urgencyOrder = { RED: 0, AMBER: 1, GREEN: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Inbox Header Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-l-4 border-l-[#14324A]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#14324A]">{roleInfo.name} Case Inbox</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#14324A] text-xs font-bold border border-slate-200">
              {displayedCases.length} routed cases
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {roleInfo.description} {currentDistrictFilter !== 'All' ? `• Viewing ${currentDistrictFilter} District` : ''}
          </p>
        </div>

        {/* Search & Urgency Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              placeholder="Search ID, school, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1F7A74] w-48 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {(['ALL', 'RED', 'AMBER', 'GREEN'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setUrgencyFilter(lvl)}
                className={`px-2 py-0.5 rounded font-semibold text-[11px] transition ${
                  urgencyFilter === lvl
                    ? lvl === 'RED'
                      ? 'bg-[#C0392B] text-white'
                      : lvl === 'AMBER'
                      ? 'bg-amber-500 text-white'
                      : lvl === 'GREEN'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#14324A] text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Case List Cards */}
      {displayedCases.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No cases found in this view</h3>
          <p className="text-xs text-slate-400">
            All routed cases for this department and district criteria have been handled.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedCases.map((c) => {
            const urgencyStyles = getUrgencyStyles(c.urgency);
            const isEscalated = isCaseEscalated(c);
            const isAcknowledged = c.acknowledgedBy.some((d) => d.includes(deptKey) || d === deptKey);
            const waitingTime = getWaitingTime(c);
            const actionsCount = c.timeline.length;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl shadow-xs border p-4 sm:p-5 transition hover:shadow-md ${urgencyStyles.border} ${
                  isEscalated ? 'border-red-300 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left: Identification & Facts */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-base text-[#14324A]">{c.id}</span>

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${urgencyStyles.badge}`}>
                        {c.urgency}
                      </span>

                      {isEscalated && (
                        <span className="px-2 py-0.5 rounded bg-[#C0392B] text-white font-black text-[10px] animate-pulse flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>ESCALATED (&gt;2h NO ACTION)</span>
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          c.status === 'Closed'
                            ? 'bg-slate-100 text-slate-700'
                            : c.status === 'Pending Closure'
                            ? 'bg-purple-100 text-purple-800'
                            : c.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.status}
                      </span>

                      <span className="text-xs text-slate-400">• Source: {c.source}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div>
                        <span className="font-bold text-slate-800">Abuse:</span> {c.abuseType}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">District:</span> {c.district} (
                        {c.community})
                      </div>
                      {c.school && (
                        <div>
                          <span className="font-bold text-slate-800">School:</span> {c.school}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-slate-800">Perpetrator:</span>{' '}
                        {c.allegedPerpetrator}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic line-clamp-2">
                      "{c.narrative}"
                    </p>
                  </div>

                  {/* Right: Waiting Time, Acknowledge & Act */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 flex-shrink-0">
                    <div className="text-left sm:text-right">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                        <Clock className={`w-3.5 h-3.5 ${isEscalated ? 'text-red-600' : 'text-slate-400'}`} />
                        <span>Waiting Time:</span>
                        <span className={`font-mono font-bold ${isEscalated ? 'text-red-600' : 'text-[#14324A]'}`}>
                          {waitingTime}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Received {formatTimeAgo(c.createdAt)} • {actionsCount} action(s) logged
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Acknowledge Button */}
                      {!isAcknowledged ? (
                        <button
                          onClick={() => acknowledgeCase(c.id, deptKey)}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-[#1F7A74] border border-teal-200 text-xs font-semibold transition flex items-center gap-1"
                          title="Confirm your department is aware and responding"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Acknowledge</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Acknowledged</span>
                        </span>
                      )}

                      {/* Open Case Details Button */}
                      <button
                        onClick={() => {
                          setSelectedCaseId(c.id);
                          setActiveView('case-detail');
                        }}
                        className="px-4 py-1.5 rounded-lg bg-[#14324A] hover:bg-[#1a4060] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <span>Open Case</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
