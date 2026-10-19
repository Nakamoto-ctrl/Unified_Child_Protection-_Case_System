import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CaseRecord,
  SMSMessage,
  CitizenTopicInquiry,
  UserRole,
  District,
  DISTRICT_CODES,
  UrgencyLevel,
  CaseAction,
  ChildStatus,
} from '../types';
import {
  SEED_CASES,
  INITIAL_SMS_MESSAGES,
  INITIAL_TOPIC_COUNTS,
  INITIAL_KNOWLEDGE_BASE,
  DISTRICT_CONTACTS,
} from '../data/seedData';

interface AppContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentDistrictFilter: District | 'All';
  setCurrentDistrictFilter: (d: District | 'All') => void;
  cases: CaseRecord[];
  smsMessages: SMSMessage[];
  topicInquiries: CitizenTopicInquiry[];
  knowledgeBase: string;
  setKnowledgeBase: (kb: string) => void;
  activeView: string;
  setActiveView: (view: string) => void;
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  unreadSmsCount: number;

  // Actions
  createCase: (data: Partial<CaseRecord>) => CaseRecord;
  acknowledgeCase: (caseId: string, departmentName: string) => void;
  recordAction: (
    caseId: string,
    action: { actionTaken: string; childStatus: ChildStatus; nextStep: string; dueDate: string }
  ) => void;
  requestClosure: (caseId: string, reason: string) => void;
  approveClosure: (caseId: string) => void;
  verifyWhatsAppCase: (caseId: string) => void;
  recordCitizenTopic: (topic: string, district?: District) => void;
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_CASES = 'protect_pikin_cases_v2';
const STORAGE_KEY_SMS = 'protect_pikin_sms_v2';
const STORAGE_KEY_TOPICS = 'protect_pikin_topics_v2';
const STORAGE_KEY_KB = 'protect_pikin_kb_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('MBSSE_DESK');
  const [currentDistrictFilter, setCurrentDistrictFilter] = useState<District | 'All'>('All');
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Cases state
  const [cases, setCases] = useState<CaseRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CASES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return SEED_CASES;
  });

  // SMS state
  const [smsMessages, setSmsMessages] = useState<SMSMessage[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SMS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SMS_MESSAGES;
  });

  // Topic inquiries
  const [topicInquiries, setTopicInquiries] = useState<CitizenTopicInquiry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TOPICS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TOPIC_COUNTS;
  });

  // Knowledge base
  const [knowledgeBase, setKnowledgeBase] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_KB);
      if (stored) return stored;
    } catch (e) {
      console.error(e);
    }
    return INITIAL_KNOWLEDGE_BASE;
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SMS, JSON.stringify(smsMessages));
  }, [smsMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TOPICS, JSON.stringify(topicInquiries));
  }, [topicInquiries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_KB, knowledgeBase);
  }, [knowledgeBase]);

  // Compute urgency from fields
  const computeUrgency = (dangerNow: boolean, abuseType: string): UrgencyLevel => {
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

  // Compute routed departments
  const computeRouting = (urgency: UrgencyLevel, perpetrator: string): string[] => {
    const list = [
      'Police FSU',
      'MoGCA Social Worker',
      'Health/Rainbo Centre',
      'District Education Office',
    ];
    if (urgency === 'RED') {
      list.push('MBSSE National Desk');
    }
    if (perpetrator === 'Teacher' || perpetrator === 'School staff') {
      list.push('Teacher Service Commission');
    }
    return list;
  };

  // Helper to get phone for a department in district
  const getDeptPhone = (dept: string, district: District): string => {
    const contacts = DISTRICT_CONTACTS[district] || DISTRICT_CONTACTS['Western Area Urban'];
    if (dept.includes('Police')) return contacts.fsuPhone;
    if (dept.includes('Social Worker')) return contacts.socialWorkerPhone;
    if (dept.includes('Rainbo') || dept.includes('Health')) return contacts.rainboPhone;
    if (dept.includes('Education')) return contacts.deoPhone;
    if (dept.includes('Teacher Service')) return '+232 76 800 200';
    if (dept.includes('MBSSE')) return '+232 76 000 116';
    return '+232 76 116 116';
  };

  // Create Case
  const createCase = (data: Partial<CaseRecord>): CaseRecord => {
    const district: District = data.district || 'Western Area Urban';
    const districtCode = DISTRICT_CODES[district] || 'WAU';
    const randomSuffix = Math.floor(2000 + Math.random() * 900);
    const caseId = `SL-${districtCode}-${randomSuffix}`;

    const dangerNow = Boolean(data.dangerNow);
    const abuseType = data.abuseType || 'Physical abuse';
    const urgency = computeUrgency(dangerNow, abuseType);
    const perpetrator = data.allegedPerpetrator || 'Unknown';
    const routedDepts = computeRouting(urgency, perpetrator);

    const isWhatsAppToVerify = data.source === 'WhatsApp' && urgency !== 'RED';

    const newCase: CaseRecord = {
      id: caseId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: data.source || 'Call',
      status: isWhatsAppToVerify ? 'To Verify' : 'New',
      urgency,
      district,
      community: data.community || 'Central',
      school: data.school || '',
      childSex: data.childSex || 'Female',
      childAgeBand: data.childAgeBand || '12-14',
      childAlias: data.childAlias || `Child ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      abuseType,
      allegedPerpetrator: perpetrator,
      dangerNow,
      narrative: data.narrative || 'Intake report recorded via Protect Pikin system.',
      callerNumber: data.callerNumber || 'Anonymous',
      routedDepartments: routedDepts,
      acknowledgedBy: [],
      timeline: [],
    };

    setCases((prev) => [newCase, ...prev]);

    // If not in "To Verify", trigger SMS outbox immediately
    if (!isWhatsAppToVerify) {
      triggerRoutingSMS(newCase);
    }

    return newCase;
  };

  // Trigger initial SMS to routed departments
  const triggerRoutingSMS = (c: CaseRecord) => {
    const newSMSList: SMSMessage[] = c.routedDepartments.map((dept) => {
      const recipientPhone = getDeptPhone(dept, c.district);
      const isRed = c.urgency === 'RED';
      const text = isRed
        ? `NEW RED CASE ${c.id}. ${c.abuseType}. ${c.district}, ${c.community}. Log in to act within 2 hrs.`
        : `NEW ${c.urgency} CASE ${c.id}. ${c.abuseType}. ${c.district}, ${c.community}. Review case details in Protect Pikin portal.`;

      return {
        id: `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        recipientDept: `${dept} (${c.district})`,
        recipientPhone,
        text,
        caseId: c.id,
        urgency: c.urgency,
        delivered: true,
      };
    });

    setSmsMessages((prev) => [...newSMSList, ...prev]);
  };

  // Acknowledge case
  const acknowledgeCase = (caseId: string, departmentName: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const acknowledgedBy = c.acknowledgedBy.includes(departmentName)
          ? c.acknowledgedBy
          : [...c.acknowledgedBy, departmentName];
        return {
          ...c,
          acknowledgedBy,
          status: c.status === 'New' ? 'In Progress' : c.status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Record an action
  const recordAction = (
    caseId: string,
    actionData: { actionTaken: string; childStatus: ChildStatus; nextStep: string; dueDate: string }
  ) => {
    const actorDept =
      currentRole === 'POLICE_FSU'
        ? 'Police FSU'
        : currentRole === 'MOGCA_SW'
        ? 'MoGCA Social Worker'
        : currentRole === 'RAINBO_HEALTH'
        ? 'Health/Rainbo Centre'
        : currentRole === 'DEO'
        ? 'District Education Office'
        : currentRole === 'TSC'
        ? 'Teacher Service Commission'
        : currentRole === 'MBSSE_DESK'
        ? 'MBSSE National Desk'
        : 'Call Centre';

    const actorName = `${actorDept} Officer`;
    const newAction: CaseAction = {
      id: `ACT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      department: actorDept,
      actorName,
      actionTaken: actionData.actionTaken,
      childStatus: actionData.childStatus,
      nextStep: actionData.nextStep,
      dueDate: actionData.dueDate,
    };

    let updatedTargetCase: CaseRecord | null = null;

    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const updated: CaseRecord = {
          ...c,
          status: c.status === 'Closed' ? 'Closed' : 'In Progress',
          updatedAt: new Date().toISOString(),
          timeline: [newAction, ...c.timeline],
        };
        updatedTargetCase = updated;
        return updated;
      })
    );

    // Broadcast SMS updates to other routed departments
    if (updatedTargetCase) {
      const c = updatedTargetCase as CaseRecord;
      const otherDepts = c.routedDepartments.filter((d) => !d.includes(actorDept));
      const updateSmsList: SMSMessage[] = otherDepts.map((dept) => ({
        id: `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        recipientDept: `${dept} (${c.district})`,
        recipientPhone: getDeptPhone(dept, c.district),
        text: `UPDATE ON CASE ${c.id}: Action logged by ${actorDept}. Status: ${actionData.childStatus}. Log in to view timeline.`,
        caseId: c.id,
        urgency: c.urgency,
        delivered: true,
      }));
      setSmsMessages((prev) => [...updateSmsList, ...prev]);
    }
  };

  // Request closure
  const requestClosure = (caseId: string, reason: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          closureRequested: true,
          closureReason: reason,
          status: 'Pending Closure',
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Approve closure
  const approveClosure = (caseId: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        return {
          ...c,
          status: 'Closed',
          closedAt: new Date().toISOString(),
          closedBy: 'MBSSE National Desk Officer',
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Verify WhatsApp report
  const verifyWhatsAppCase = (caseId: string) => {
    let verifiedCase: CaseRecord | null = null;
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const updated: CaseRecord = {
          ...c,
          status: 'New',
          updatedAt: new Date().toISOString(),
        };
        verifiedCase = updated;
        return updated;
      })
    );

    if (verifiedCase) {
      triggerRoutingSMS(verifiedCase);
    }
  };

  // Record citizen question topic
  const recordCitizenTopic = (topic: string, district?: District) => {
    const d: District = district || 'Western Area Urban';
    const newTopic: CitizenTopicInquiry = {
      id: `T-${Date.now()}`,
      topic,
      district: d,
      date: new Date().toISOString().split('T')[0],
    };
    setTopicInquiries((prev) => [newTopic, ...prev]);
  };

  // Reset demo
  const resetToSampleData = () => {
    setCases(SEED_CASES);
    setSmsMessages(INITIAL_SMS_MESSAGES);
    setTopicInquiries(INITIAL_TOPIC_COUNTS);
    setKnowledgeBase(INITIAL_KNOWLEDGE_BASE);
    localStorage.removeItem(STORAGE_KEY_CASES);
    localStorage.removeItem(STORAGE_KEY_SMS);
    localStorage.removeItem(STORAGE_KEY_TOPICS);
    localStorage.removeItem(STORAGE_KEY_KB);
  };

  const unreadSmsCount = smsMessages.length;

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentDistrictFilter,
        setCurrentDistrictFilter,
        cases,
        smsMessages,
        topicInquiries,
        knowledgeBase,
        setKnowledgeBase,
        activeView,
        setActiveView,
        selectedCaseId,
        setSelectedCaseId,
        unreadSmsCount,
        createCase,
        acknowledgeCase,
        recordAction,
        requestClosure,
        approveClosure,
        verifyWhatsAppCase,
        recordCitizenTopic,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
