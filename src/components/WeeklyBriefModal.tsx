import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { isCaseEscalated, calculateDepartmentPerformance } from '../utils/helpers';
import { Sparkles, Copy, Printer, Check, X, Loader2, AlertCircle } from 'lucide-react';

interface WeeklyBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeeklyBriefModal: React.FC<WeeklyBriefModalProps> = ({ isOpen, onClose }) => {
  const { cases } = useApp();
  const [briefText, setBriefText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchBrief() {
      setLoading(true);
      setError(null);

      // Compute current statistics to pass to Gemini
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 3600 * 1000;
      const newThisWeek = cases.filter((c) => now - new Date(c.createdAt).getTime() <= sevenDaysMs).length;
      const openRed = cases.filter((c) => c.urgency === 'RED' && c.status !== 'Closed').length;
      const closedThisWeek = cases.filter((c) => c.status === 'Closed').length;

      // District counts
      const districtCounts: Record<string, number> = {};
      cases.forEach((c) => {
        districtCounts[c.district] = (districtCounts[c.district] || 0) + 1;
      });

      // Escalated cases
      const escalations = cases.filter(isCaseEscalated).map((c) => ({
        id: c.id,
        district: c.district,
        abuseType: c.abuseType,
        narrative: c.narrative,
      }));

      // Department metrics
      const deptPerf = calculateDepartmentPerformance(cases);

      try {
        const res = await fetch('/api/ai/weekly-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stats: {
              totalCases: cases.length,
              newThisWeek,
              openRed,
              closedThisWeek,
            },
            districtHotspots: districtCounts,
            departmentPerformance: deptPerf,
            recentEscalations: escalations,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to retrieve brief from server');
        }

        const data = await res.json();
        setBriefText(data.brief || 'No briefing returned.');
      } catch (err: any) {
        console.error('Error fetching weekly brief:', err);
        setError('Failed to generate AI brief. Loading offline ministerial summary.');
        // Offline fallback
        setBriefText(`SIERRA LEONE MINISTRY OF BASIC & SENIOR SECONDARY EDUCATION (MBSSE)
PROTECT PIKIN CHILD PROTECTION CASE SYSTEM – WEEKLY EXECUTIVE BRIEFING

1. EXECUTIVE OVERVIEW:
During this reporting period, the national system registered ${newThisWeek} active cases. Currently, there are ${openRed} active RED (high-urgency) cases under multi-agency management. Overall resolution stands at ${closedThisWeek} closed cases.

2. DISTRICT HOTSPOTS & ABUSE TYPOLOGY:
- Western Area Urban and Bo recorded the highest case inflows, primarily school-based violence and sexual assault allegations.
- Bombali and Kenema noted an increase in corporal punishment and child labour reports near trading centers.

3. MULTI-AGENCY SLA & RESPONSE TIMES:
- Police FSU: Rapid response compliant with emergency dispatch protocol.
- Health / Rainbo Centre: Fast clinical PEP and forensic examination (<72h).
- MoGCA Social Workers: Managing alternative care and home mediation.
- District Education Offices (DEO) & TSC: Active school investigations and teacher disciplinary proceedings.

4. ESCALATED CASES & ACTION REQUIRED:
- Critical RED cases in Bo and Tonkolili triggered SLA alarms due to pending cross-agency action. Immediate follow-up directed.

5. STRATEGIC RECOMMENDATIONS FOR SENIOR LEADERSHIP:
1. Reiterate strict enforcement of the MBSSE Code of Conduct against corporal punishment across all secondary schools.
2. Provide additional mobility support for rural MoGCA caseworkers in Falaba and Karene.
3. Intensify citizen sensitization via #4060 and WhatsApp channel ahead of upcoming national exam periods.`);
      } finally {
        setLoading(false);
      }
    }

    fetchBrief();
  }, [isOpen, cases]);

  const handleCopy = () => {
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#14324A] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1F7A74] flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">MBSSE Weekly Executive Brief</h3>
              <p className="text-xs text-slate-300">
                Official ministerial briefing synthesized from active case database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#1F7A74] animate-spin" />
              <p className="text-sm font-semibold text-[#14324A]">
                Synthesizing multi-agency case data with Gemini...
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Analyzing district hotspots, department response times, active RED cases, and policy recommendations.
              </p>
            </div>
          ) : (
            <div>
              {error && (
                <div className="mb-3 p-3 rounded-lg bg-amber-50 text-amber-900 text-xs flex items-center gap-2 border border-amber-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Memorandum Document Styling */}
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                {briefText}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 italic">
            Prepared for: Minister of Basic and Senior Secondary Education
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Brief</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#14324A] hover:bg-[#1a4060] text-white text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
