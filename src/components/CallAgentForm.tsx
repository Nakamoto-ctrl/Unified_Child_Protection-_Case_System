import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  SIERRA_LEONE_DISTRICTS,
  District,
  DISTRICT_CODES,
  ABUSE_TYPES,
  AbuseType,
  PERPETRATOR_TYPES,
  PerpetratorType,
  AGE_BANDS,
  AgeBand,
  UrgencyLevel,
} from '../types';
import {
  PhoneCall,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Building2,
  Send,
  Loader2,
  FileCheck,
  UserCheck,
  Volume2,
} from 'lucide-react';

export const CallAgentForm: React.FC = () => {
  const { createCase, setSelectedCaseId, setActiveView } = useApp();

  // 8 Core Fields
  const [district, setDistrict] = useState<District>('Bo');
  const [community, setCommunity] = useState<string>('Kakua');
  const [school, setSchool] = useState<string>('');
  const [childSex, setChildSex] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [childAgeBand, setChildAgeBand] = useState<AgeBand>('12-14');
  const [abuseType, setAbuseType] = useState<AbuseType>('Sexual abuse');
  const [allegedPerpetrator, setAllegedPerpetrator] = useState<PerpetratorType>('Teacher');
  const [dangerNow, setDangerNow] = useState<boolean>(true);
  const [narrative, setNarrative] = useState<string>('');
  const [callerNumber, setCallerNumber] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // AI Fill Modal & State
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiNotes, setAiNotes] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Success Feedback
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);

  // Compute dynamic urgency
  const computeUrgency = (): UrgencyLevel => {
    if (dangerNow || abuseType === 'Sexual abuse' || abuseType === 'Trafficking') {
      return 'RED';
    }
    if (
      abuseType === 'Physical abuse' ||
      abuseType === 'Early/forced marriage' ||
      abuseType === 'Child labour' ||
      abuseType === 'School-based violence'
    ) {
      return 'AMBER';
    }
    return 'GREEN';
  };

  const currentUrgency = computeUrgency();

  // Compute routed agencies
  const computeAlerts = (): string[] => {
    const list = [
      `Police FSU (${district})`,
      `MoGCA Social Worker (${district})`,
      `Health/Rainbo Centre (${district})`,
      `District Education Office (${district})`,
    ];
    if (currentUrgency === 'RED') {
      list.push('MBSSE National Desk');
    }
    if (allegedPerpetrator === 'Teacher' || allegedPerpetrator === 'School staff') {
      list.push('Teacher Service Commission (TSC)');
    }
    return list;
  };

  const willAlertList = computeAlerts();

  // Handle AI Fill Submission
  const handleAiFill = async () => {
    if (!aiNotes.trim()) return;
    setIsAiLoading(true);
    setAiMessage(null);

    try {
      const res = await fetch('/api/ai/fill-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: aiNotes }),
      });

      if (!res.ok) throw new Error('AI extraction failed');

      const data = await res.json();

      if (data.district && SIERRA_LEONE_DISTRICTS.includes(data.district)) {
        setDistrict(data.district);
      }
      if (data.community) setCommunity(data.community);
      if (data.school !== undefined) setSchool(data.school);
      if (data.childSex) setChildSex(data.childSex);
      if (data.childAgeBand && AGE_BANDS.includes(data.childAgeBand)) setChildAgeBand(data.childAgeBand);
      if (data.abuseType && ABUSE_TYPES.includes(data.abuseType)) setAbuseType(data.abuseType);
      if (data.allegedPerpetrator && PERPETRATOR_TYPES.includes(data.allegedPerpetrator)) {
        setAllegedPerpetrator(data.allegedPerpetrator);
      }
      if (typeof data.dangerNow === 'boolean') setDangerNow(data.dangerNow);
      if (data.narrative) setNarrative(data.narrative);
      if (data.callerNumber) {
        if (data.callerNumber.toLowerCase().includes('anon')) {
          setIsAnonymous(true);
          setCallerNumber('');
        } else {
          setIsAnonymous(false);
          setCallerNumber(data.callerNumber);
        }
      }

      setAiMessage('Form auto-populated! Review the 8 fields below and confirm.');
      setShowAiModal(false);
    } catch (err: any) {
      console.error(err);
      setAiMessage('Unable to connect to AI service. Using manual intake.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Preset sample call notes in Krio and English for quick demo
  const sampleKrioNote = `Caller na auntie from Bo town, Kakua chiefdom. Di child na gel pikin, age 13 years old, dey attend St. Paul Secondary School. Di mathematics teacher dey call am after class dey touch am and talk say if e no gree e go fail am. Di pikin dey cry say e dey afraid for go school tomorrow, e say di man threatened for beat am if e talk. Caller phone: 076-492-811. Child in urgent danger.`;

  const sampleEnglishNote = `Intake call from community elder in Magburaka, Tonkolili. Male student age 10 at Government Secondary School was beaten severely with an electrical cable by the boarding master. Child has open cuts and is crying in pain. Child is currently locked in dorm. Caller wants immediate police and medical response. Caller is anonymous.`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!narrative.trim()) {
      alert('Please enter a brief description of what happened.');
      return;
    }

    const savedCase = createCase({
      source: 'Call',
      district,
      community: community.trim() || 'Central',
      school: school.trim(),
      childSex,
      childAgeBand,
      abuseType,
      allegedPerpetrator,
      dangerNow,
      narrative: narrative.trim(),
      callerNumber: isAnonymous ? 'Anonymous' : callerNumber.trim() || 'Anonymous',
    });

    setSubmittedCaseId(savedCase.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header card with Toll-free hotline branding */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-l-4 border-l-[#1F7A74]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#1F7A74] flex items-center justify-center flex-shrink-0 shadow-inner">
            <PhoneCall className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#14324A]">Call Agent Intake Form</h2>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                Toll-Free #4060 / 116
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Only 8 fields. Streamlined for rapid, calm intake while keeping caller engaged on the line.
            </p>
          </div>
        </div>

        {/* AI Fill Trigger */}
        <button
          type="button"
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#1F7A74] to-[#14324A] text-white text-xs font-semibold shadow hover:opacity-95 transition self-start md:self-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>AI Fill from Rough Notes (English / Krio)</span>
        </button>
      </div>

      {aiMessage && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-50 text-emerald-900 text-xs flex items-center justify-between border border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{aiMessage}</span>
          </div>
          <button onClick={() => setAiMessage(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Success Notification Modal / Card */}
      {submittedCaseId && (
        <div className="mb-6 p-6 rounded-2xl bg-white border-2 border-emerald-500 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-[#14324A]">Case Saved & Agencies Alerted!</h3>
              <p className="text-sm text-slate-600 mt-1">
                Assigned Case ID:{' '}
                <span className="font-mono font-bold text-lg text-[#14324A] bg-slate-100 px-2 py-0.5 rounded">
                  {submittedCaseId}
                </span>{' '}
                with urgency level{' '}
                <span
                  className={`px-2 py-0.5 rounded font-bold text-xs ${
                    currentUrgency === 'RED'
                      ? 'bg-red-600 text-white'
                      : currentUrgency === 'AMBER'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {currentUrgency}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Simulated SMS alerts were immediately broadcast to the SMS Outbox for:
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {willAlertList.map((dept, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                  >
                    {dept}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedCaseId(submittedCaseId);
                    setActiveView('case-detail');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#14324A] text-white text-xs font-semibold hover:bg-[#1a4060] transition"
                >
                  Open Shared Case View
                </button>
                <button
                  onClick={() => {
                    setSubmittedCaseId(null);
                    setNarrative('');
                    setSchool('');
                    setCallerNumber('');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                >
                  Log Another Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8-Field Fast Intake Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Field 1: District & Community */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="case-district" className="block text-xs font-bold text-[#14324A] uppercase tracking-wider mb-1.5">
                1. District *
              </label>
              <select
                id="case-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value as District)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74] bg-white font-medium text-slate-800"
                required
              >
                {SIERRA_LEONE_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d} ({DISTRICT_CODES[d]})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="case-community" className="block text-xs font-bold text-[#14324A] uppercase tracking-wider mb-1.5">
                Community / Town / Chiefdom *
              </label>
              <input
                id="case-community"
                type="text"
                placeholder="e.g. Kakua, Susan's Bay, Makeni Central"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74]"
                required
              />
            </div>
          </div>

          {/* Field 2: School (Optional) */}
          <div>
            <label htmlFor="case-school" className="block text-xs font-bold text-[#14324A] uppercase tracking-wider mb-1.5">
              2. School (Optional)
            </label>
            <div className="relative">
              <input
                id="case-school"
                type="text"
                placeholder="e.g. St. Paul Secondary School, Bo (leave blank if not school-based)"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74]"
              />
              <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Field 3: Child Sex & Age Band */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#14324A] uppercase tracking-wider mb-1.5">
                3. Child Sex *
              </label>
              <div className="flex gap-2">
                {(['Female', 'Male', 'Other'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setChildSex(s)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                      childSex === s
                        ? 'bg-[#14324A] text-white border-[#14324A]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#14324A] uppercase tracking-wider mb-1.5">
                Age Band *
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {AGE_BANDS.map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setChildAgeBand(band)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      childAgeBand === band
                        ? 'bg-[#1F7A74] text-white border-[#1F7A74]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {band} yrs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Field 4: Abuse Type */}
          <div>
            <label htmlFor="case-abuse-type" className="block text-xs font-bold text-[#14324A] uppercase tracking-wider mb-1.5">
              4. Abuse Type *
            </label>
            <select
              id="case-abuse-type"
              value={abuseType}
              onChange={(e) => setAbuseType(e.target.value as AbuseType)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74] bg-white font-medium text-slate-800"
              required
            >
              {ABUSE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Field 5: Alleged Perpetrator */}
          <div>
            <label className="block text-xs font-bold text-[#14324A] uppercase tracking-wider mb-1.5">
              5. Alleged Perpetrator *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PERPETRATOR_TYPES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAllegedPerpetrator(p)}
                  className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition truncate ${
                    allegedPerpetrator === p
                      ? 'bg-[#14324A] text-white border-[#14324A]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {(allegedPerpetrator === 'Teacher' || allegedPerpetrator === 'School staff') && (
              <p className="text-[11px] text-teal-700 font-semibold mt-1.5 flex items-center gap-1">
                <span>⚡ School personnel flagged: Teacher Service Commission (TSC) will be alerted.</span>
              </p>
            )}
          </div>

          {/* Field 6: Child in Danger Now? (Yes/No Toggle) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="block text-xs font-bold text-[#14324A] uppercase tracking-wider">
                6. Child in Danger Right Now? *
              </span>
              <p className="text-xs text-slate-500">
                Is child in immediate peril, active threat of physical/sexual harm, or locked up?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDangerNow(true)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  dangerNow
                    ? 'bg-[#C0392B] text-white ring-2 ring-red-400'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>YES (RED)</span>
              </button>

              <button
                type="button"
                onClick={() => setDangerNow(false)}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
                  !dangerNow
                    ? 'bg-[#1F7A74] text-white ring-2 ring-teal-400'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>NO</span>
              </button>
            </div>
          </div>

          {/* Field 7: What Happened (2-3 lines narrative) */}
          <div>
            <label htmlFor="case-narrative" className="block text-xs font-bold text-[#14324A] uppercase tracking-wider mb-1.5">
              7. What Happened (2–3 lines summary) *
            </label>
            <textarea
              id="case-narrative"
              rows={3}
              placeholder="State key facts: specific act, location, time, injuries, whether child is sheltered safely. (Never include real full names of children; use 'Child A')."
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74]"
              required
            />
          </div>

          {/* Field 8: Caller Callback Number or Anonymous */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label htmlFor="case-callback" className="block text-xs font-bold text-[#14324A] uppercase tracking-wider mb-1.5">
                8. Caller Callback Number *
              </label>
              <input
                id="case-callback"
                type="tel"
                placeholder="+232 76 000 000"
                disabled={isAnonymous}
                value={callerNumber}
                onChange={(e) => setCallerNumber(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74] ${
                  isAnonymous ? 'bg-slate-100 text-slate-400 border-slate-200' : 'border-slate-300'
                }`}
              />
            </div>

            <div className="sm:pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => {
                    setIsAnonymous(e.target.checked);
                    if (e.target.checked) setCallerNumber('');
                  }}
                  className="w-4 h-4 rounded text-[#1F7A74] focus:ring-[#1F7A74] border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Caller requested Anonymity (No callback number)
                </span>
              </label>
            </div>
          </div>

          {/* Urgency & Routing Preview Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Calculated Urgency:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                    currentUrgency === 'RED'
                      ? 'bg-[#C0392B] text-white animate-pulse'
                      : currentUrgency === 'AMBER'
                      ? 'bg-amber-500 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {currentUrgency} CASE
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {currentUrgency === 'RED'
                  ? 'Mandatory 2-Hour SLA for First Action'
                  : currentUrgency === 'AMBER'
                  ? '24-Hour SLA for Multi-Agency Action'
                  : 'Standard 48-Hour Review'}
              </span>
            </div>

            <div>
              <span className="text-xs font-bold text-[#14324A] block mb-1.5">Will alert on save:</span>
              <div className="flex flex-wrap gap-1.5">
                {willAlertList.map((dept, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-white text-[#14324A] text-xs font-semibold border border-slate-200 shadow-xs flex items-center gap-1"
                  >
                    <Building2 className="w-3 h-3 text-[#1F7A74]" />
                    <span>{dept}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500 hidden sm:block">
            Auto-generates Case ID and triggers SMS dispatch to all routed agencies.
          </p>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#1F7A74] hover:bg-[#18605c] text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Save Case & Broadcast SMS Alerts</span>
          </button>
        </div>
      </form>

      {/* AI Fill Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1F7A74] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#14324A]">AI Fill from Rough Notes</h3>
                  <p className="text-xs text-slate-500">Paste English or Krio intake conversation</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Sample Buttons */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                Quick Test Samples:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAiNotes(sampleKrioNote)}
                  className="px-2.5 py-1 rounded bg-teal-50 text-[#1F7A74] border border-teal-200 text-xs font-medium hover:bg-teal-100 transition"
                >
                  🇸🇱 Load Krio Sexual Abuse Sample (Bo)
                </button>
                <button
                  type="button"
                  onClick={() => setAiNotes(sampleEnglishNote)}
                  className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium hover:bg-slate-200 transition"
                >
                  🏫 Load School Violence Sample (Tonkolili)
                </button>
              </div>
            </div>

            <textarea
              rows={5}
              placeholder="Paste raw caller notes in English or Sierra Leone Krio..."
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F7A74] font-mono leading-relaxed"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAiFill}
                disabled={isAiLoading || !aiNotes.trim()}
                className="px-4 py-2 rounded-lg bg-[#1F7A74] text-white text-xs font-semibold hover:bg-[#18605c] transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Extract & Auto-Fill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
