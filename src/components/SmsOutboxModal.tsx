import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SMSMessage } from '../types';
import { formatDateTime, getUrgencyStyles } from '../utils/helpers';
import {
  Bell,
  Search,
  CheckCheck,
  ShieldCheck,
  Phone,
  Clock,
  Filter,
  X,
  MessageSquare,
} from 'lucide-react';

export const SmsOutboxModal: React.FC = () => {
  const { smsMessages, setActiveView } = useApp();
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Filter messages
  const filteredMessages = smsMessages.filter((m) => {
    if (selectedDept !== 'ALL' && !m.recipientDept.includes(selectedDept)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.caseId.toLowerCase().includes(q) ||
        m.recipientDept.toLowerCase().includes(q) ||
        m.text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-l-4 border-l-[#1F7A74]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#14324A] flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span>Simulated SMS Outbox & Dispatch Gateway</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[#14324A] text-xs font-bold border border-slate-200">
              {filteredMessages.length} Messages Dispatched
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Orange SL & Africell government SMPP gateway simulation. Transmits automated emergency alerts to FSU, MoGCA, Health & DEO.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Case ID or text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1F7A74] w-48 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1F7A74] bg-white text-slate-700"
          >
            <option value="ALL">All Departments</option>
            <option value="Police FSU">Police FSU</option>
            <option value="Social Worker">MoGCA Social Worker</option>
            <option value="Rainbo">Health / Rainbo Centre</option>
            <option value="Education">District Education Office</option>
            <option value="Teacher Service">Teacher Service Commission</option>
            <option value="National Desk">MBSSE National Desk</option>
          </select>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-900">
        <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
        <p>
          <span className="font-bold">Golden Privacy Guarantee:</span> Child personal names and caller phone numbers are strictly scrubbed by the system and NEVER broadcast in SMS text.
        </p>
      </div>

      {/* Message List */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
            No SMS messages found.
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const urgencyStyles = getUrgencyStyles(msg.urgency);

            return (
              <div
                key={msg.id}
                className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 transition hover:shadow-md flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#14324A] text-white text-[11px] font-bold font-mono">
                      {msg.caseId}
                    </span>

                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${urgencyStyles.badge}`}>
                      {msg.urgency}
                    </span>

                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#1F7A74]" />
                      <span>{msg.recipientDept}</span>
                      <span className="font-mono text-slate-400 text-[11px]">({msg.recipientPhone})</span>
                    </span>
                  </div>

                  {/* SMS Bubble Styling */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 leading-relaxed max-w-2xl">
                    {msg.text}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 text-[11px] text-slate-400 flex-shrink-0">
                  <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Delivered</span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(msg.timestamp)}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
