export type UserRole =
  | 'CALL_AGENT'
  | 'POLICE_FSU'
  | 'MOGCA_SW'
  | 'RAINBO_HEALTH'
  | 'DEO'
  | 'TSC'
  | 'MBSSE_DESK'
  | 'CITIZEN';

export interface RoleInfo {
  id: UserRole;
  name: string;
  badge: string;
  departmentKey: string;
  description: string;
  canViewChildIdentity: boolean;
  canApproveClosure: boolean;
  canVerifyWhatsApp: boolean;
}

export const USER_ROLES: Record<UserRole, RoleInfo> = {
  CALL_AGENT: {
    id: 'CALL_AGENT',
    name: 'Call Agent',
    badge: 'Toll-Free #4060 / 116',
    departmentKey: 'Call Centre',
    description: 'Intake operator fielding reports on national toll-free lines and verifying WhatsApp citizen alerts.',
    canViewChildIdentity: true,
    canApproveClosure: false,
    canVerifyWhatsApp: true,
  },
  POLICE_FSU: {
    id: 'POLICE_FSU',
    name: 'Police FSU',
    badge: 'Family Support Unit',
    departmentKey: 'Police FSU',
    description: 'Sierra Leone Police specialized unit for child protection, arrests, and legal investigation.',
    canViewChildIdentity: true,
    canApproveClosure: false,
    canVerifyWhatsApp: false,
  },
  MOGCA_SW: {
    id: 'MOGCA_SW',
    name: 'MoGCA Social Worker',
    badge: 'Social Welfare Officer',
    departmentKey: 'MoGCA Social Worker',
    description: 'Ministry of Gender and Children’s Affairs officer managing emergency shelter, safe homes and child welfare.',
    canViewChildIdentity: true,
    canApproveClosure: false,
    canVerifyWhatsApp: false,
  },
  RAINBO_HEALTH: {
    id: 'RAINBO_HEALTH',
    name: 'Health / Rainbo Centre',
    badge: 'Medical & Clinical Care',
    departmentKey: 'Health/Rainbo Centre',
    description: 'Specialized clinical care, forensic examination, emergency PEP treatment (<72h), and psychosocial counseling.',
    canViewChildIdentity: true,
    canApproveClosure: false,
    canVerifyWhatsApp: false,
  },
  DEO: {
    id: 'DEO',
    name: 'District Education Office',
    badge: 'MBSSE District Desk',
    departmentKey: 'District Education Office',
    description: 'District Deputy Director of Education coordinating school visits, student safety, and school administration.',
    canViewChildIdentity: false, // Protected view for education admin
    canApproveClosure: false,
    canVerifyWhatsApp: false,
  },
  TSC: {
    id: 'TSC',
    name: 'Teacher Service Commission',
    badge: 'TSC Disciplinary Desk',
    departmentKey: 'Teacher Service Commission',
    description: 'Statutory body handling teacher conduct, suspension, decertification, and school staff disciplinary tribunals.',
    canViewChildIdentity: false, // Protected view
    canApproveClosure: false,
    canVerifyWhatsApp: false,
  },
  MBSSE_DESK: {
    id: 'MBSSE_DESK',
    name: 'MBSSE National Desk',
    badge: 'National Child Protection HQ',
    departmentKey: 'MBSSE National Desk',
    description: 'National overview, escalation monitoring, policy coordination, and ministerial briefing.',
    canViewChildIdentity: false, // Summarized identity
    canApproveClosure: true,
    canVerifyWhatsApp: false,
  },
  CITIZEN: {
    id: 'CITIZEN',
    name: 'Citizen (Chatbot)',
    badge: 'WhatsApp Protect Pikin',
    departmentKey: 'Public',
    description: 'Public WhatsApp chatbot interface for reporting concerns, checking case status, and finding district help.',
    canViewChildIdentity: false,
    canApproveClosure: false,
    canVerifyWhatsApp: false,
  },
};

export const SIERRA_LEONE_DISTRICTS = [
  'Bo',
  'Bombali',
  'Bonthe',
  'Falaba',
  'Kailahun',
  'Kambia',
  'Karene',
  'Kenema',
  'Kono',
  'Koinadugu',
  'Moyamba',
  'Port Loko',
  'Pujehun',
  'Tonkolili',
  'Western Area Rural',
  'Western Area Urban',
] as const;

export type District = typeof SIERRA_LEONE_DISTRICTS[number];

export const DISTRICT_CODES: Record<District, string> = {
  'Bo': 'BO',
  'Bombali': 'BOM',
  'Bonthe': 'BNT',
  'Falaba': 'FAL',
  'Kailahun': 'KAI',
  'Kambia': 'KAM',
  'Karene': 'KAR',
  'Kenema': 'KEN',
  'Kono': 'KON',
  'Koinadugu': 'KOI',
  'Moyamba': 'MOY',
  'Port Loko': 'PLK',
  'Pujehun': 'PUJ',
  'Tonkolili': 'TON',
  'Western Area Rural': 'WAR',
  'Western Area Urban': 'WAU',
};

export type AbuseType =
  | 'Sexual abuse'
  | 'Physical abuse'
  | 'Emotional abuse'
  | 'Neglect'
  | 'Child labour'
  | 'Trafficking'
  | 'Early/forced marriage'
  | 'School-based violence'
  | 'Other';

export const ABUSE_TYPES: AbuseType[] = [
  'Sexual abuse',
  'Physical abuse',
  'Emotional abuse',
  'Neglect',
  'Child labour',
  'Trafficking',
  'Early/forced marriage',
  'School-based violence',
  'Other',
];

export type PerpetratorType =
  | 'Relative'
  | 'Teacher'
  | 'School staff'
  | 'Pupil'
  | 'Neighbour'
  | 'Stranger'
  | 'Employer'
  | 'Unknown';

export const PERPETRATOR_TYPES: PerpetratorType[] = [
  'Relative',
  'Teacher',
  'School staff',
  'Pupil',
  'Neighbour',
  'Stranger',
  'Employer',
  'Unknown',
];

export type AgeBand = '0-5' | '6-11' | '12-14' | '15-17';
export const AGE_BANDS: AgeBand[] = ['0-5', '6-11', '12-14', '15-17'];

export type UrgencyLevel = 'RED' | 'AMBER' | 'GREEN';
export type CaseStatus = 'New' | 'In Progress' | 'Pending Closure' | 'Closed' | 'To Verify';
export type CaseSource = 'Call' | 'WhatsApp';
export type ChildStatus = 'Safe' | 'At Risk' | 'Unknown';

export interface CaseAction {
  id: string;
  timestamp: string; // ISO string
  department: string;
  actorName: string;
  actionTaken: string;
  childStatus: ChildStatus;
  nextStep: string;
  dueDate: string;
}

export interface CaseRecord {
  id: string; // e.g. SL-BO-2041
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  source: CaseSource;
  status: CaseStatus;
  urgency: UrgencyLevel;
  district: District;
  community: string;
  school?: string;
  childSex: 'Female' | 'Male' | 'Other';
  childAgeBand: AgeBand;
  childAlias: string; // e.g. "Child A" (real names prohibited)
  abuseType: AbuseType;
  allegedPerpetrator: PerpetratorType;
  dangerNow: boolean;
  narrative: string;
  callerNumber: string; // Phone number or "Anonymous"
  routedDepartments: string[];
  acknowledgedBy: string[];
  timeline: CaseAction[];
  closureRequested?: boolean;
  closureReason?: string;
  closedAt?: string;
  closedBy?: string;
}

export interface SMSMessage {
  id: string;
  timestamp: string;
  recipientDept: string;
  recipientPhone: string;
  text: string;
  caseId: string;
  urgency: UrgencyLevel;
  delivered: boolean;
}

export interface CitizenTopicInquiry {
  id: string;
  topic: string;
  district: District;
  date: string;
}

export interface DistrictContactInfo {
  district: District;
  fsuContact: string;
  fsuPhone: string;
  fsuStation: string;
  rainboClinic: string;
  rainboPhone: string;
  hospital: string;
  socialWorkerName: string;
  socialWorkerPhone: string;
  deoOfficer: string;
  deoPhone: string;
}
