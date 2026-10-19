import React from 'react';
import { useApp } from '../context/AppContext';
import { getUrgencyStyles, formatTimeAgo } from '../utils/helpers';
import { FileText, CheckCircle, ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ToVerifyQueue: React.FC = () => {
  const { cases, verifyWhatsAppCase, setSelectedCaseId, setActiveView, currentRole } = useApp();

  const toVerifyCases = cases.filter((c) => c.status === 'To Verify');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-l-4 border-l-amber-500">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#14324A] flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              <span>WhatsApp Citizen Reports ("To Verify" Queue)</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {toVerifyCases.length} Pending Verification
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Non-urgent reports submitted by citizens via WhatsApp. Designated Call Agents review facts and verify validity before triggering multi-agency SMS alerts.
          </p>
        </div>
      </div>

      {toVerifyCases.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Verification Queue is Clear</h3>
          <p className="text-xs text-slate-400">
            All citizen WhatsApp reports have been reviewed and dispatched to relevant district teams.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {toVerifyCases.map((c) => {
            const urgencyStyles = getUrgencyStyles(c.urgency);

            return (
              <div
                key={c.id}
                className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-base text-[#14324A]">{c.id}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${urgencyStyles.badge}`}>
                      {c.urgency}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                      To Verify
                    </span>
                    <span className="text-xs text-slate-400">
                      • Received via WhatsApp {formatTimeAgo(c.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        verifyWhatsAppCase(c.id);
                        alert(`Case ${c.id} verified! SMS alerts dispatched to district response agencies.`);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1F7A74] hover:bg-[#18605c] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Verify & Alert Agencies</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCaseId(c.id);
                        setActiveView('case-detail');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Location</span>
                    <span className="font-semibold text-slate-800">
                      {c.district} District ({c.community})
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Abuse & Perpetrator</span>
                    <span className="font-semibold text-slate-800">
                      {c.abuseType} • Alleged: {c.allegedPerpetrator}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Child Demographic</span>
                    <span className="font-semibold text-slate-800">
                      {c.childSex}, Age: {c.childAgeBand} yrs ({c.childAlias})
                    </span>
                  </div>
                </div>

                {/* Narrative */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 italic">
                  "{c.narrative}"
                </div>

                {/* Routing Preview */}
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-slate-700">Will route to:</span>
                  {c.routedDepartments.map((dept, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px] border border-slate-200"
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
