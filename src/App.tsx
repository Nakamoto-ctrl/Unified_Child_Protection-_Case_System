import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CallAgentForm } from './components/CallAgentForm';
import { DepartmentInbox } from './components/DepartmentInbox';
import { SharedCaseView } from './components/SharedCaseView';
import { CitizenChatbot } from './components/CitizenChatbot';
import { SmsOutboxModal } from './components/SmsOutboxModal';
import { ToVerifyQueue } from './components/ToVerifyQueue';
import { KnowledgeBaseSettings } from './components/KnowledgeBaseSettings';
import { PhoneCall, Shield, Building2 } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeView } = useApp();

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'new-case':
        return <CallAgentForm />;
      case 'inbox':
        return <DepartmentInbox />;
      case 'to-verify':
        return <ToVerifyQueue />;
      case 'case-detail':
        return <SharedCaseView />;
      case 'sms-outbox':
        return <SmsOutboxModal />;
      case 'citizen-chatbot':
        return <CitizenChatbot />;
      case 'knowledge-base':
        return <KnowledgeBaseSettings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800">
      <Header />
      <main className="flex-1 pb-12">{renderView()}</main>

      {/* Required Official Footer */}
      <footer className="bg-[#14324A] text-slate-300 border-t border-white/10 py-6 px-4 sm:px-6 lg:px-8 mt-auto text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#1F7A74] flex items-center justify-center font-bold text-white font-serif">
              SL
            </div>
            <div>
              <p className="font-semibold text-white">Protect Pikin – MBSSE Child Protection Case System</p>
              <p className="text-[11px] text-slate-400">
                Ministry of Basic and Senior Secondary Education • New England Ville, Freetown, Sierra Leone
              </p>
            </div>
          </div>

          <div className="text-center md:text-right space-y-1">
            <p className="font-medium text-slate-200">
              Prototype with sample data. Production version runs on DHIS2 Tracker with real SMS and WhatsApp Business.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-[11px] text-teal-300">
              <span>National Toll-Free Emergency: #4060 or 116</span>
              <span>•</span>
              <span>Police FSU / Rainbo / MoGCA Multi-Agency Integrated</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
