import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { USER_ROLES, ChildStatus } from '../types';
import {
  getUrgencyStyles,
  formatDateTime,
  formatTimeAgo,
  isCaseEscalated,
  getWaitingTime,
} from '../utils/helpers';
import {
  ArrowLeft,
  Building2,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Send,
  CheckCircle,
  FileText,
  User,
  AlertTriangle,
  Calendar,
  CheckSquare,
} from 'lucide-react';

export const SharedCaseView: React.FC = () => {
  const {
    selectedCaseId,
    cases,
    currentRole,
    recordAction,
    requestClosure,
    approveClosure,
    setActiveView,
    setSelectedCaseId,
  } = useApp();

  const activeCase = cases.find((c) => c.id === selectedCaseId);

  // Action form state
  const [actionTaken, setActionTaken] = useState('');
  const [childStatus, setChildStatus] = useState<ChildStatus>('Safe');
  const [nextStep, setNextStep] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [actionSuccess, setActionSuccess] = useState(false);

  // Closure request state
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [closureReason, setClosureReason] = useState('');

  if (!activeCase) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-sm font-semibold text-slate-600">No case selected.</p>
        <button
          onClick={() => setActiveView('dashboard')}
          className="px-4 py-2 rounded-lg bg-[#14324A] text-white text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const roleInfo = USER_ROLES[currentRole];
  const canSeeIdentity = roleInfo.canViewChildIdentity;
  const urgencyStyles = getUrgencyStyles(activeCase.urgency);
  const isEscalated = isCaseEscalated(activeCase);

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim()) {
      alert('Please state the specific action taken by your agency.');
      return;
    }

    recordAction(activeCase.id, {
      actionTaken: actionTaken.trim(),
      childStatus,
      nextStep: nextStep.trim() || 'Ongoing monitoring',
      dueDate,
    });

    setActionTaken('');
    setNextStep('');
    setActionSuccess(true);
    setTimeout(() => setActionSuccess(false), 3000);
  };

  const handleRequestClosureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureReason.trim()) return;
    requestClosure(activeCase.id, closureReason.trim());
    setShowClosureModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg text-[#14324A]">{activeCase.id}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${urgencyStyles.badge}`}>
                {activeCase.urgency}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  activeCase.status === 'Closed'
                    ? 'bg-slate-100 text-slate-700'
                    : activeCase.status === 'Pending Closure'
                    ? 'bg-purple-100 text-purple-800'
                    : activeCase.status === 'In Progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {activeCase.status}
              </span>
              {isEscalated && (
                <span className="px-2 py-0.5 rounded bg-[#C0392B] text-white font-black text-[10px] animate-pulse">
                  ESCALATED
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Logged via {activeCase.source} • {formatDateTime(activeCase.createdAt)} ({formatTimeAgo(activeCase.createdAt)})
            </p>
          </div>
        </div>

        {/* Closure Actions */}
        <div className="flex items-center gap-2">
          {activeCase.status !== 'Closed' && (
            <button
              onClick={() => setShowClosureModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Request Closure
            </button>
          )}

          {currentRole === 'MBSSE_DESK' && activeCase.status !== 'Closed' && (
            <button
              onClick={() => {
                if (confirm('Approve closure of this child protection case?')) {
                  approveClosure(activeCase.id);
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Approve Closure (National Desk)</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Case Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
            <h3 className="text-xs font-bold text-[#14324A] uppercase tracking-wider border-b border-slate-100 pb-2">
              Case Summary & Triage
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Abuse Classification</span>
                <span className="font-bold text-slate-800 text-sm">{activeCase.abuseType}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Location</span>
                <span className="font-semibold text-slate-800">
                  {activeCase.district} District, {activeCase.community}
                </span>
              </div>

              {activeCase.school && (
                <div>
                  <span className="text-slate-400 block text-[11px]">School Facility</span>
                  <span className="font-semibold text-slate-800">{activeCase.school}</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block text-[11px]">Alleged Perpetrator</span>
                <span className="font-semibold text-slate-800">{activeCase.allegedPerpetrator}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Immediate Danger</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                    activeCase.dangerNow ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {activeCase.dangerNow ? 'YES - Immediate Danger' : 'NO'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Intake Summary</span>
                <p className="p-2.5 rounded bg-slate-50 border border-slate-100 text-slate-700 italic leading-relaxed">
                  "{activeCase.narrative}"
                </p>
              </div>
            </div>

            {/* Child Identity Privacy Section */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold text-[#14324A] mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#1F7A74]" />
                <span>Survivor & Caller Identity</span>
              </h4>

              {canSeeIdentity ? (
                <div className="p-3 bg-teal-50/70 rounded-lg border border-teal-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Child Identifier:</span>
                    <span className="font-bold text-[#14324A]">{activeCase.childAlias}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sex & Age Band:</span>
                    <span className="font-bold text-slate-800">
                      {activeCase.childSex}, {activeCase.childAgeBand} yrs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Caller Callback:</span>
                    <span className="font-mono font-bold text-slate-800">{activeCase.callerNumber}</span>
                  </div>
                  <span className="text-[10px] text-teal-800 block pt-1 border-t border-teal-200 font-medium">
                    ✓ Identity decrypted for authorized {roleInfo.name} caseworker
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs space-y-1 text-slate-600">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Protected Confidential Data</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Under Sierra Leone Child Rights Act & data minimization rules, direct survivor identity and caller contacts are restricted to Police FSU, MoGCA Social Workers, and Rainbo Centre clinicians.
                  </p>
                </div>
              )}
            </div>

            {/* Routed Departments */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Routed Multi-Agency Units
              </span>
              <div className="space-y-1">
                {activeCase.routedDepartments.map((dept, i) => {
                  const isAck = activeCase.acknowledgedBy.some((d) => d.includes(dept) || dept.includes(d));
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded bg-slate-50 border border-slate-100"
                    >
                      <span className="text-slate-700 font-medium">{dept}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isAck ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isAck ? 'Acknowledged' : 'Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Timeline of Actions by all departments (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-[#14324A] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#1F7A74]" />
                <span>Inter-Agency Action Timeline</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">{activeCase.timeline.length} Actions</span>
            </div>

            {activeCase.timeline.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-1">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-medium">No actions recorded yet.</p>
                <p className="text-[11px]">Use the action panel on the right to log your first response.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeCase.timeline.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-[#14324A] text-white text-[10px] font-bold">
                        {act.department}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatTimeAgo(act.timestamp)}</span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-normal">{act.actionTaken}</p>

                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Child:</span>
                        <span
                          className={`font-bold px-1.5 py-0.2 rounded ${
                            act.childStatus === 'Safe'
                              ? 'bg-emerald-100 text-emerald-800'
                              : act.childStatus === 'At Risk'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {act.childStatus}
                        </span>
                      </div>

                      <div className="text-slate-500">
                        <span>Due: </span>
                        <span className="font-semibold text-slate-700">{act.dueDate}</span>
                      </div>
                    </div>

                    {act.nextStep && (
                      <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                        <span className="font-semibold text-slate-700">Next step: </span>
                        <span>{act.nextStep}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: "Record your action" Form (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4 border-t-4 border-t-[#1F7A74]">
            <div>
              <h3 className="text-sm font-bold text-[#14324A]">Record Your Action</h3>
              <p className="text-xs text-slate-500">
                Acting as: <span className="font-bold text-[#1F7A74]">{roleInfo.name}</span>
              </p>
            </div>

            {actionSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2 border border-emerald-200 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Action recorded & SMS update broadcast to sister agencies!</span>
              </div>
            )}

            <form onSubmit={handleActionSubmit} className="space-y-4">
              {/* Action Taken */}
              <div>
                <label htmlFor="action-taken" className="block text-xs font-bold text-[#14324A] mb-1">
                  Action Taken *
                </label>
                <textarea
                  id="action-taken"
                  rows={4}
                  placeholder="e.g. Conducted emergency home visit, dispatched FSU patrol, administered medical PEP, initiated TSC school inquiry..."
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74]"
                  required
                />
              </div>

              {/* Child Status */}
              <div>
                <label className="block text-xs font-bold text-[#14324A] mb-1">Current Child Status *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Safe', 'At Risk', 'Unknown'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setChildStatus(s)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                        childStatus === s
                          ? s === 'Safe'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : s === 'At Risk'
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-amber-500 text-white border-amber-500'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Next Step */}
              <div>
                <label htmlFor="action-next-step" className="block text-xs font-bold text-[#14324A] mb-1">
                  Next Step Required
                </label>
                <input
                  id="action-next-step"
                  type="text"
                  placeholder="e.g. Follow-up trauma session on Day 3, Magistrate bail hearing..."
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74]"
                />
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="action-due-date" className="block text-xs font-bold text-[#14324A] mb-1">
                  Due Date
                </label>
                <input
                  id="action-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74]"
                  required
                />
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#1F7A74] hover:bg-[#18605c] text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Action & Broadcast SMS Alert</span>
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-normal">
                Logging an action automatically notifies other routed departments via SMS and resets the SLA counter.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Closure Request Modal */}
      {showClosureModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-[#14324A]">Request Case Closure</h3>
            <p className="text-xs text-slate-500">
              State why this case is ready for closure (e.g. child verified safe, legal/medical processes concluded, school attendance restored). MBSSE National Desk will review and approve.
            </p>

            <form onSubmit={handleRequestClosureSubmit} className="space-y-4">
              <textarea
                rows={4}
                placeholder="Reason for closure..."
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74]"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClosureModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#14324A] text-white text-xs font-semibold hover:bg-[#1a4060]"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
