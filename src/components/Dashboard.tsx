import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  filterCasesForRole,
  isCaseEscalated,
  isCaseOverdue,
  formatTimeAgo,
  getUrgencyStyles,
  calculateDepartmentPerformance,
} from '../utils/helpers';
import { SIERRA_LEONE_DISTRICTS, District } from '../types';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  PhoneCall,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Calendar,
  ExternalLink,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { WeeklyBriefModal } from './WeeklyBriefModal';

export const Dashboard: React.FC = () => {
  const {
    cases,
    currentRole,
    currentDistrictFilter,
    topicInquiries,
    setSelectedCaseId,
    setActiveView,
  } = useApp();

  const [showWeeklyBriefModal, setShowWeeklyBriefModal] = useState(false);

  // Filter cases for the current context
  const filteredCases = filterCasesForRole(cases, currentRole, currentDistrictFilter);

  // 1. Four Big Number Tiles Metrics
  const now = Date.now();
  const oneDayMs = 24 * 3600 * 1000;
  const sevenDaysMs = 7 * oneDayMs;

  const newToday = filteredCases.filter((c) => {
    return now - new Date(c.createdAt).getTime() <= oneDayMs && c.status !== 'Closed';
  }).length;

  const openRedCases = filteredCases.filter(
    (c) => c.urgency === 'RED' && c.status !== 'Closed' && c.status !== 'To Verify'
  ).length;

  const overdueCases = filteredCases.filter(isCaseOverdue).length;

  const closedThisWeek = filteredCases.filter((c) => {
    if (c.status !== 'Closed') return false;
    const closedTime = c.closedAt ? new Date(c.closedAt).getTime() : new Date(c.updatedAt).getTime();
    return now - closedTime <= sevenDaysMs;
  }).length;

  // Escalated RED cases
  const escalatedList = filteredCases.filter(isCaseEscalated);

  // Latest 10 cases (excluding to-verify if general dashboard)
  const latestTenCases = [...filteredCases]
    .filter((c) => c.status !== 'To Verify')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  // 2. Bar Chart: Cases by District this week
  const districtCounts: Record<string, number> = {};
  filteredCases.forEach((c) => {
    districtCounts[c.district] = (districtCounts[c.district] || 0) + 1;
  });

  // Pick top 6 districts or all if filtered
  const sortedDistricts = Object.entries(districtCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  const maxDistrictCount = Math.max(...Object.values(districtCounts), 1);

  // 3. Line Chart: Weekly cases last 8 weeks
  const weeklyTrends = [
    { week: 'Wk 35', count: 18 },
    { week: 'Wk 36', count: 22 },
    { week: 'Wk 37', count: 26 },
    { week: 'Wk 38', count: 21 },
    { week: 'Wk 39', count: 29 },
    { week: 'Wk 40', count: 34 },
    { week: 'Wk 41', count: 31 },
    { week: 'Wk 42 (Current)', count: filteredCases.length },
  ];
  const maxWeeklyCount = Math.max(...weeklyTrends.map((w) => w.count), 40);

  // 4. Reports by Source (Call vs WhatsApp)
  const callCount = filteredCases.filter((c) => c.source === 'Call').length;
  const whatsappCount = filteredCases.filter((c) => c.source === 'WhatsApp').length;
  const totalReports = Math.max(1, callCount + whatsappCount);
  const callPercent = Math.round((callCount / totalReports) * 100);
  const whatsappPercent = 100 - callPercent;

  // 5. Top Citizen Questions this week (from chatbot topics)
  const topicCounts: Record<string, number> = {};
  topicInquiries.forEach((t) => {
    topicCounts[t.topic] = (topicCounts[t.topic] || 0) + 1;
  });
  const sortedTopics = Object.entries(topicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxTopicCount = Math.max(...Object.values(topicCounts), 1);

  // 6. Response Time per Department
  const deptPerformance = calculateDepartmentPerformance(filteredCases);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Scope Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#14324A]">MBSSE Child Protection Overview</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1F7A74]/10 text-[#1F7A74] text-xs font-semibold">
              {currentDistrictFilter === 'All' ? 'National Overview' : `${currentDistrictFilter} District`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inter-agency dashboard uniting Call Line #4060, Police FSU, MoGCA, Health/Rainbo, DEO and TSC.
          </p>
        </div>

        {/* Weekly Brief Button for National Desk or Leadership */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeeklyBriefModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14324A] hover:bg-[#1a4060] text-white text-xs font-semibold shadow-sm transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Generate Weekly Executive Brief</span>
          </button>
        </div>
      </div>

      {/* Escalation Warning Banner (if RED cases exceeded 2h) */}
      {escalatedList.length > 0 && (
        <div className="bg-red-50 border-l-4 border-[#C0392B] p-4 rounded-r-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#C0392B] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#C0392B] flex items-center gap-2">
                <span>{escalatedList.length} HIGH-PRIORITY RED CASES ESCALATED</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-red-100 text-red-800">
                  SLA breached (&gt; 2 Hours Without Action)
                </span>
              </h3>
              <p className="text-xs text-red-900 mt-1">
                These critical cases require immediate multi-agency mobilization. Cases:{' '}
                <span className="font-semibold">
                  {escalatedList.map((c) => `${c.id} (${c.district})`).join(', ')}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (escalatedList[0]) {
                setSelectedCaseId(escalatedList[0].id);
                setActiveView('case-detail');
              }
            }}
            className="self-start sm:self-center px-3 py-1.5 rounded bg-[#C0392B] text-white text-xs font-semibold hover:bg-red-700 transition flex items-center gap-1.5"
          >
            <span>Act on Escalated Case</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Four Big Number Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: New Today */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">New Today</span>
            <div className="w-9 h-9 rounded-lg bg-teal-50 text-[#1F7A74] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#14324A]">{newToday}</span>
            <span className="text-xs text-slate-500">cases logged</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3 text-teal-600" />
            <span>Past 24 hours inflow</span>
          </p>
        </div>

        {/* Tile 2: Open RED Cases */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition hover:shadow-md border-t-4 border-t-[#C0392B]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#C0392B] uppercase tracking-wider">Open RED Cases</span>
            <div className="w-9 h-9 rounded-lg bg-red-100 text-[#C0392B] flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#C0392B]">{openRedCases}</span>
            <span className="text-xs text-red-700 font-medium">high urgency</span>
          </div>
          <p className="text-[11px] text-red-600 mt-2 font-medium">
            Danger = Yes / Sexual abuse / Trafficking
          </p>
        </div>

        {/* Tile 3: Overdue (No action) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Overdue (No Action)</span>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700">{overdueCases}</span>
            <span className="text-xs text-slate-500">exceeding SLA</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            RED (&gt;2h) or AMBER (&gt;24h) without action
          </p>
        </div>

        {/* Tile 4: Closed This Week */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 transition hover:shadow-md border-t-4 border-t-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Closed This Week</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-800">{closedThisWeek}</span>
            <span className="text-xs text-slate-500">safeguarded</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-2 font-medium">
            Approved by MBSSE National Desk
          </p>
        </div>
      </div>

      {/* Row 2: Charts (Bar Chart: District vs Line Chart: 8-Week Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Cases by District */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#14324A] flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-[#1F7A74]" />
                <span>Cases by District This Week</span>
              </h3>
              <p className="text-xs text-slate-500">Distribution across highest-volume administrative districts</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Total: {filteredCases.length}</span>
          </div>

          <div className="space-y-3 pt-2">
            {sortedDistricts.map(([district, count]) => {
              const pct = Math.round((count / maxDistrictCount) * 100);
              return (
                <div key={district} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{district}</span>
                    <span className="font-bold text-[#14324A]">{count} cases</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#1F7A74] to-[#14324A] h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Line Chart: Weekly cases last 8 weeks */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#14324A] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Weekly Case Volume (Last 8 Weeks)</span>
                </h3>
                <p className="text-xs text-slate-500">Longitudinal intake trend across Sierra Leone</p>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                +14% Reporting Awareness
              </span>
            </div>

            {/* SVG Line / Area chart */}
            <div className="pt-4 pb-2">
              <div className="relative h-44 w-full">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 350 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1F7A74" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#1F7A74" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  <line x1="0" y1="30" x2="350" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="60" x2="350" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="0" y1="90" x2="350" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                  {/* Area fill */}
                  <path
                    d={`M 0,${110 - (weeklyTrends[0].count / maxWeeklyCount) * 85} ` +
                      weeklyTrends
                        .map((w, i) => {
                          const x = (i / (weeklyTrends.length - 1)) * 350;
                          const y = 110 - (w.count / maxWeeklyCount) * 85;
                          return `L ${x},${y}`;
                        })
                        .join(' ') +
                      ` L 350,115 L 0,115 Z`}
                    fill="url(#chartGradient)"
                  />

                  {/* Stroke path */}
                  <path
                    d={`M 0,${110 - (weeklyTrends[0].count / maxWeeklyCount) * 85} ` +
                      weeklyTrends
                        .map((w, i) => {
                          const x = (i / (weeklyTrends.length - 1)) * 350;
                          const y = 110 - (w.count / maxWeeklyCount) * 85;
                          return `L ${x},${y}`;
                        })
                        .join(' ')}
                    fill="none"
                    stroke="#1F7A74"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {weeklyTrends.map((w, i) => {
                    const x = (i / (weeklyTrends.length - 1)) * 350;
                    const y = 110 - (w.count / maxWeeklyCount) * 85;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="4" fill="#ffffff" stroke="#14324A" strokeWidth="2" />
                      </g>
                    );
                  })}
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
                  {weeklyTrends.map((w, i) => (
                    <span key={i} className="text-center truncate" style={{ width: '12%' }}>
                      {w.week.split(' ')[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>Highest surge: Week 40 (School Term Opening)</span>
            <span className="font-semibold text-[#14324A]">Average: 27 cases/wk</span>
          </div>
        </div>
      </div>

      {/* Row 3: Reports by Source & Top Citizen Questions & Response Time */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports by Source */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-[#14324A] flex items-center gap-1.5 mb-1">
            <PhoneCall className="w-4 h-4 text-[#1F7A74]" />
            <span>Reports by Source</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">Toll-Free #4060/116 vs WhatsApp</p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#14324A]" />
                  Toll-Free Call (#4060 / 116)
                </span>
                <span className="font-bold text-[#14324A]">
                  {callCount} ({callPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-[#14324A] h-3 rounded-full" style={{ width: `${callPercent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#25D366]" />
                  Citizen WhatsApp Bot
                </span>
                <span className="font-bold text-emerald-700">
                  {whatsappCount} ({whatsappPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-[#25D366] h-3 rounded-full" style={{ width: `${whatsappPercent}%` }} />
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border border-slate-100 mt-2">
              <p className="font-medium text-slate-800">Unified Architecture:</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Regardless of source channel, every report generates ONE synchronized case routed simultaneously across all 5 responsible ministries and departments.
              </p>
            </div>
          </div>
        </div>

        {/* Top Citizen Questions this week */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-[#14324A] flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Top Citizen Questions</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">Chatbot topic counts from WhatsApp inquiries</p>

          <div className="space-y-3">
            {sortedTopics.map(([topic, count]) => {
              const pct = Math.round((count / maxTopicCount) * 100);
              return (
                <div key={topic} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate pr-2">{topic}</span>
                    <span className="font-bold text-emerald-700">{count} inquiries</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 mt-3 italic">
            *Inquiries are completely anonymous and never stored with survivor data.
          </p>
        </div>

        {/* Response Time per Department */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-[#14324A] flex items-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Response Time per Agency</span>
          </h3>
          <p className="text-xs text-slate-500 mb-3">Median time to first recorded action</p>

          <div className="space-y-3">
            {deptPerformance.map((dp) => {
              const badgeClass =
                dp.slaStatus === 'green'
                  ? 'bg-emerald-100 text-emerald-800'
                  : dp.slaStatus === 'amber'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800';

              return (
                <div
                  key={dp.department}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <div>
                    <span className="text-xs font-semibold text-[#14324A] block">{dp.department}</span>
                    <span className="text-[10px] text-slate-400">{dp.totalActions} logged actions</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeClass}`}>
                      {dp.medianHours} hrs
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {dp.slaStatus === 'green' ? '<2h SLA Target' : dp.slaStatus === 'amber' ? '2-4h Amber' : '>4h Breached'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Latest 10 Cases Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#14324A]">Latest 10 Active Protection Cases</h3>
            <p className="text-xs text-slate-500">Live feed across all 16 Sierra Leone education districts</p>
          </div>
          <button
            onClick={() => setActiveView('inbox')}
            className="text-xs font-semibold text-[#1F7A74] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Department Cases</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Time Received</th>
                <th className="py-3 px-4">Abuse Type</th>
                <th className="py-3 px-4">District & Community</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latestTenCases.map((c) => {
                const urgencyStyle = getUrgencyStyles(c.urgency);
                const isEscalated = isCaseEscalated(c);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-[#14324A] whitespace-nowrap">
                      {c.id}
                      {isEscalated && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded bg-red-600 text-white font-black text-[9px]">
                          ESCALATED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatTimeAgo(c.createdAt)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{c.abuseType}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <span className="font-semibold text-slate-800">{c.district}</span>, {c.community}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${urgencyStyle.badge}`}>
                        {c.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
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
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="flex items-center gap-1 text-slate-600">
                        {c.source === 'Call' ? (
                          <PhoneCall className="w-3 h-3 text-[#14324A]" />
                        ) : (
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{c.source}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedCaseId(c.id);
                          setActiveView('case-detail');
                        }}
                        className="px-2.5 py-1 rounded bg-[#1F7A74] hover:bg-[#18605c] text-white text-[11px] font-semibold transition"
                      >
                        Open Case
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Executive Brief Modal */}
      {showWeeklyBriefModal && (
        <WeeklyBriefModal
          isOpen={showWeeklyBriefModal}
          onClose={() => setShowWeeklyBriefModal(false)}
        />
      )}
    </div>
  );
};
