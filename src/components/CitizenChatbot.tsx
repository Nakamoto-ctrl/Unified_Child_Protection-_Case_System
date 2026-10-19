import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DISTRICT_CONTACTS } from '../data/seedData';
import { SIERRA_LEONE_DISTRICTS, District } from '../types';
import {
  Send,
  PhoneCall,
  ShieldAlert,
  MapPin,
  FileText,
  Search,
  BookOpen,
  CheckCheck,
  Loader2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isUrgentDanger?: boolean;
}

export const CitizenChatbot: React.FC = () => {
  const {
    cases,
    createCase,
    recordCitizenTopic,
    knowledgeBase,
    setActiveView,
    setSelectedCaseId,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'bot',
      text: `🇸🇱 Kushe! Welcome to Protect Pikin (MBSSE) WhatsApp Line.\n\nI can help you with:\n• Answers about Child Rights & Laws in Sierra Leone\n• Signs of abuse, violence, or early marriage\n• Finding local Police FSU & Rainbo Centre help near you\n• Reporting a child protection concern safely\n• Checking the status of an existing case\n\n⚠️ Disclaimer: I provide general information only, not legal or medical advice. If a child is in immediate danger, dial toll-free #4060 or 116 right now (Free call).`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportStep, setReportStep] = useState<number | null>(null);
  const [reportDraft, setReportDraft] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Push user message & bot message
  const appendMessage = (sender: 'user' | 'bot', text: string, isUrgentDanger = false) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUrgentDanger,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Find help near me handler
  const handleFindHelp = (districtName: District) => {
    const contact = DISTRICT_CONTACTS[districtName];
    recordCitizenTopic('Emergency help', districtName);

    appendMessage('user', `Find help in ${districtName}`);

    const reply = `📍 Child Protection Contacts for ${districtName} District:

• Police Family Support Unit (FSU):
  ${contact.fsuContact} - ${contact.fsuStation}
  📞 Phone: ${contact.fsuPhone}

• Rainbo Centre (Free Medical & Forensic Care <72h):
  ${contact.rainboClinic}
  📞 Phone: ${contact.rainboPhone}

• Ministry of Gender & Children's Affairs (MoGCA):
  ${contact.socialWorkerName}
  📞 Phone: ${contact.socialWorkerPhone}

• District Education Office (MBSSE):
  ${contact.deoOfficer}
  📞 Phone: ${contact.deoPhone}

• National Toll-Free Emergency Hotline:
  Dial #4060 or 116 (Free 24/7 on Africell, Orange, Qcell)`;

    appendMessage('bot', reply);
  };

  // Check case status handler
  const handleCheckCaseStatus = (caseId: string) => {
    appendMessage('user', `Check case status: ${caseId}`);
    const normalized = caseId.trim().toUpperCase();
    const foundCase = cases.find((c) => c.id.toUpperCase() === normalized);

    if (!foundCase) {
      appendMessage(
        'bot',
        `❌ Case ${normalized} not found in the Protect Pikin system.\nPlease verify the Case ID format (e.g. SL-BO-2041) or call #4060 for assistance.`
      );
      recordCitizenTopic('Case status check');
      return;
    }

    // High-level status ONLY - strictly protect survivor privacy
    let friendlyStatus = 'Received';
    if (foundCase.status === 'Closed') {
      friendlyStatus = 'Closed / Resolved (Action concluded by multi-agency team)';
    } else if (foundCase.status === 'In Progress' || foundCase.status === 'Pending Closure') {
      friendlyStatus = 'Being Handled by District Child Protection Response Team';
    } else if (foundCase.status === 'To Verify') {
      friendlyStatus = 'Received and undergoing intake verification';
    }

    const reply = `🔍 CASE STATUS INQUIRY:
Case ID: ${foundCase.id}
Status: ${friendlyStatus}
District: ${foundCase.district}
Date Received: ${new Date(foundCase.createdAt).toLocaleDateString()}

*Note: For the child's safety and privacy, specific confidential medical and investigative details are restricted to designated legal and social work officers.*`;

    appendMessage('bot', reply);
    recordCitizenTopic('Case status check', foundCase.district);
  };

  // Conversational Report a Concern Step Machine
  const startReportConversation = () => {
    setReportStep(1);
    setReportDraft({ source: 'WhatsApp' });
    appendMessage('user', 'I want to report a concern about a child.');
    appendMessage(
      'bot',
      `Thank you for taking a stand for child protection. You may remain completely anonymous.\n\nFirst, what District in Sierra Leone is this happening in?\n(e.g., Bo, Bombali, Western Area Urban, Kenema, Tonkolili, Port Loko, etc.)`
    );
  };

  // Handle user submit
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query) return;

    setInput('');
    appendMessage('user', query);

    // 1. Check if user is checking case status
    if (
      query.toUpperCase().startsWith('SL-') ||
      query.toLowerCase().includes('case status') ||
      query.toLowerCase().includes('check case')
    ) {
      const match = query.match(/SL-[A-Z]{2,3}-\d{3,4}/i);
      if (match) {
        handleCheckCaseStatus(match[0]);
        return;
      }
    }

    // 2. Check if user is in conversational reporting flow
    if (reportStep !== null) {
      handleReportFlow(query);
      return;
    }

    // 3. Check for immediate danger trigger
    const dangerKeywords = ['danger', 'threat', 'beating right now', 'killing', 'dying', 'rape now', 'in danger now'];
    const isUrgent = dangerKeywords.some((k) => query.toLowerCase().includes(k));

    if (isUrgent) {
      appendMessage(
        'bot',
        `⚠️🚨 URGENT SAFETY ALERT:
If this child is in danger right now, please CALL #4060 or 116 IMMEDIATELY!

The call is completely free on all networks (Orange, Africell, Qcell). Our Police FSU emergency operators are on standby 24/7.`,
        true
      );
    }

    // Call server Gemini API for citizen response
    setLoading(true);
    try {
      const chatHistory = messages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      }));
      chatHistory.push({ role: 'user', content: query });

      const res = await fetch('/api/ai/citizen-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          knowledgeBase,
        }),
      });

      if (!res.ok) throw new Error('Citizen chat endpoint failed');
      const data = await res.json();

      appendMessage('bot', data.reply);
      if (data.detectedTopic) {
        recordCitizenTopic(data.detectedTopic);
      }
    } catch (err: any) {
      console.error(err);
      appendMessage(
        'bot',
        `Thank you for contacting Protect Pikin. Under Sierra Leone law, every child is protected from violence, abuse, and exploitation. If a child is in danger, please call #4060 or 116 immediately. How else can I assist you?`
      );
      recordCitizenTopic('General Inquiry');
    } finally {
      setLoading(false);
    }
  };

  // Conversational intake logic
  const handleReportFlow = (text: string) => {
    const draft = { ...reportDraft };

    if (reportStep === 1) {
      // District & Community
      const matchedDistrict = SIERRA_LEONE_DISTRICTS.find(
        (d) => text.toLowerCase().includes(d.toLowerCase())
      ) || 'Western Area Urban';
      draft.district = matchedDistrict;
      draft.community = text;
      setReportDraft(draft);
      setReportStep(2);
      appendMessage(
        'bot',
        `Noted: ${matchedDistrict}. Is the child in danger RIGHT NOW?\n(Reply YES or NO)`
      );
      return;
    }

    if (reportStep === 2) {
      const isYes = text.toLowerCase().includes('yes');
      draft.dangerNow = isYes;
      setReportDraft(draft);

      if (isYes) {
        appendMessage(
          'bot',
          `🚨 CALL #4060 or 116 NOW, IT IS FREE! Since the child is in danger right now, we are marking this as an immediate RED emergency case!`,
          true
        );
      }

      setReportStep(3);
      appendMessage(
        'bot',
        `What type of abuse is this?\n(Sexual abuse, Physical abuse, Emotional abuse, Neglect, Child labour, Trafficking, Early marriage, or School violence)`
      );
      return;
    }

    if (reportStep === 3) {
      draft.abuseType = text;
      setReportDraft(draft);
      setReportStep(4);
      appendMessage(
        'bot',
        `What is the child's sex and age band?\n(Sex: Female or Male; Age: 0-5, 6-11, 12-14, or 15-17. Please do NOT state the child's full real name.)`
      );
      return;
    }

    if (reportStep === 4) {
      draft.childSex = text.toLowerCase().includes('boy') || text.toLowerCase().includes('male') ? 'Male' : 'Female';
      draft.childAgeBand = text.includes('15') || text.includes('16') || text.includes('17')
        ? '15-17'
        : text.includes('12') || text.includes('13') || text.includes('14')
        ? '12-14'
        : text.includes('0') || text.includes('3') || text.includes('4')
        ? '0-5'
        : '6-11';
      setReportDraft(draft);
      setReportStep(5);
      appendMessage(
        'bot',
        `Who is the alleged perpetrator?\n(Relative, Teacher, School staff, Pupil, Neighbour, Stranger, Employer, or Unknown)`
      );
      return;
    }

    if (reportStep === 5) {
      draft.allegedPerpetrator = text;
      setReportDraft(draft);
      setReportStep(6);
      appendMessage(
        'bot',
        `In 2–3 sentences, what happened? (Mention any school name if applicable, but keep identities anonymous)`
      );
      return;
    }

    if (reportStep === 6) {
      draft.narrative = text;
      setReportDraft(draft);
      setReportStep(7);
      appendMessage(
        'bot',
        `Lastly, do you wish to provide a phone number for callback updates, or do you prefer to remain completely Anonymous?\n(Type your phone number or type "Anonymous")`
      );
      return;
    }

    if (reportStep === 7) {
      const isAnon = text.toLowerCase().includes('anon');
      draft.callerNumber = isAnon ? 'Anonymous' : text;

      // Finalize and save case!
      const newCase = createCase(draft);
      setReportStep(null);
      setReportDraft({});

      const isRed = newCase.urgency === 'RED';

      const completionMessage = `✅ REPORT REGISTERED SUCCESSFULLY!

Case ID: ${newCase.id}
Urgency: ${newCase.urgency}
Status: ${isRed ? 'RED ALERT - Dispatched Immediately to District Teams' : 'Placed in Verification Queue'}

${
  isRed
    ? '🚨 Because this was flagged as urgent or child in danger, Police FSU, Rainbo Centre, and MoGCA Social Workers have been alerted right away via SMS.'
    : 'ℹ️ Your report has been submitted to the Call Agent verification queue. A certified officer will verify details before dispatching.'
}

You can check your case progress anytime on this chat by typing: "Check status ${newCase.id}".

Thank you for protecting our children. Every child counts.`;

      appendMessage('bot', completionMessage, isRed);
      recordCitizenTopic('Reporting concern', newCase.district);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-2 sm:px-4 py-4 h-[calc(100vh-140px)] flex flex-col">
      {/* WhatsApp Container */}
      <div className="bg-[#EFEAE2] flex-1 rounded-2xl shadow-xl border border-slate-300 flex flex-col overflow-hidden relative">
        {/* WhatsApp Header (#075E54) */}
        <div className="bg-[#075E54] text-white p-3 sm:p-4 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#1F7A74] border-2 border-emerald-300 flex items-center justify-center font-bold text-white text-sm shadow-inner flex-shrink-0">
              PP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm tracking-wide">Protect Pikin (MBSSE)</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
              </div>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                <span>Verified Govt Helpline • Toll-Free #4060 / 116</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:4060"
              className="px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Call #4060</span>
            </a>
          </div>
        </div>

        {/* Quick Action Chips Bar */}
        <div className="bg-[#f0f2f5] border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto text-xs z-10">
          <button
            onClick={() => {
              appendMessage(
                'bot',
                '🚨 CALL #4060 OR 116 IMMEDIATELY! If a child is undergoing violence or in danger, please call our toll-free hotline right now. Operators are ready.',
                true
              );
            }}
            className="px-2.5 py-1 rounded-full bg-red-100 text-[#C0392B] font-bold border border-red-200 hover:bg-red-200 transition flex items-center gap-1 flex-shrink-0"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Child in Danger Now</span>
          </button>

          <button
            onClick={startReportConversation}
            className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-semibold border border-teal-200 hover:bg-teal-200 transition flex items-center gap-1 flex-shrink-0"
          >
            <FileText className="w-3 h-3" />
            <span>Report a Concern</span>
          </button>

          <button
            onClick={() => {
              const district = prompt(
                'Enter Sierra Leone District for emergency help contacts (e.g. Bo, Bombali, Western Area Urban, Kenema, etc.):',
                'Bo'
              );
              if (district) {
                const match = SIERRA_LEONE_DISTRICTS.find(
                  (d) => d.toLowerCase() === district.trim().toLowerCase()
                ) || 'Bo';
                handleFindHelp(match);
              }
            }}
            className="px-2.5 py-1 rounded-full bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 flex-shrink-0"
          >
            <MapPin className="w-3 h-3 text-teal-600" />
            <span>Find Help Near Me</span>
          </button>

          <button
            onClick={() => {
              const cId = prompt('Enter Case ID to check status (e.g. SL-BO-2041):', 'SL-BO-2041');
              if (cId) handleCheckCaseStatus(cId);
            }}
            className="px-2.5 py-1 rounded-full bg-white text-slate-700 font-medium border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1 flex-shrink-0"
          >
            <Search className="w-3 h-3 text-slate-500" />
            <span>Check My Case</span>
          </button>

          <button
            onClick={() => {
              setInput('Wetin di law say about ticha wey dey flog pikin na school?');
            }}
            className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-medium border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1 flex-shrink-0"
          >
            <span>🇸🇱 Ask in Krio</span>
          </button>
        </div>

        {/* Chat Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl p-3 shadow-xs relative text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#DCF8C6] text-slate-900 rounded-tr-none'
                      : m.isUrgentDanger
                      ? 'bg-red-50 text-red-950 border-2 border-red-500 rounded-tl-none font-medium'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400">
                    <span>{m.timestamp}</span>
                    {isUser && <CheckCheck className="w-3 h-3 text-blue-500" />}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-xl rounded-tl-none p-3 shadow-xs text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-[#075E54] animate-spin" />
                <span>Protect Pikin is typing in English/Krio...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="bg-[#f0f2f5] p-2.5 sm:p-3 flex items-center gap-2 border-t border-slate-200">
          <input
            type="text"
            placeholder={
              reportStep !== null
                ? `Replying to question ${reportStep} of 7...`
                : 'Type in English or Krio (e.g. Signs of abuse, report concern, check status)...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-white px-3.5 py-2 text-xs rounded-full border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#075E54]"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-9 h-9 rounded-full bg-[#075E54] hover:bg-[#064e46] text-white flex items-center justify-center transition disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
