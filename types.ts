export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
}

export interface Correspondence {
  id: string;
  date: string;
  direction: 'incoming' | 'outgoing';
  contact: string;
  subject: string;
  content: string;
  method: string;
}

export interface ActionItem {
  id: string;
  title: string;
  createdDate: string; // ISO Date string
  dueDate: string;
  completedDate?: string; // ISO Date string (optional)
  status: 'pending' | 'completed' | 'dropped';
  priority: 'low' | 'medium' | 'high';
  assignee: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  address: string;
}

export interface CaseLogEntry {
  id: string;
  caseNumber: string;
  title: string; // Usually Patient Name or Reference
  status: 'open' | 'pending' | 'closed';
  dateOpened: string;
  
  // HLC-7 Context
  patientAge?: string;
  patientGender?: string;
  hospital?: string;
  diagnosis?: string;
  
  // Clinical Snapshot
  hgb?: string; // Hemoglobin
  platelets?: string; // Platelet count
  physicianName?: string;
  
  // Lessons Learned / Retrospective
  physicianCooperation?: 'cooperative' | 'neutral' | 'hostile' | 'unknown';
  treatmentsUsed?: string; // What strategies were employed?
  articlesUsed?: string; // Were specific medical articles helpful?
  
  // The "Good, Bad, and Ugly"
  successes?: string; // What went well?
  challenges?: string; // The "Bad/Ugly" - obstacles faced
  trainingNeeds?: string; // Lessons for the committee/Training opps
  
  notes?: string; // General overflow notes
}

export interface CommitteeMember {
  id: string;
  firstName: string;
  lastName: string;
  group: 'HLC' | 'PVG' | 'Recommendation';
  role: string;
  email: string;
  homePhone: string;
  mobilePhone: string;
  gender: string;
  congregation: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  comments: string;
  
  // Recommendation Specific Fields
  jwpubEmail?: string;
  medicalEmail?: string;
  languages?: string;
  congregationNumber?: string;
  circuitOverseer?: string;
  dob?: string;
  dateBaptism?: string;
  dateElder?: string;
  otherResponsibilities?: string;
  onPVG?: boolean;
  familyObligations?: string;
  secularObligations?: string;
  recommendationReason?: string;

  // Deprecated fields kept for migration safety
  name?: string; 
  position?: string;
  termEnd?: string;
}

export interface AppSettings {
  enableEncryption: boolean;
  enablePIIScrub: boolean;
  enableCommitteeLogin: boolean;
}

export interface AppData {
  meetings: Meeting[];
  correspondence: Correspondence[];
  actionItems: ActionItem[];
  contacts: Contact[];
  caseLog: CaseLogEntry[];
  committeeRoster: CommitteeMember[];
  stickyNote: string;
  lastUpdated: string | null;
}

export type TabId = 'dashboard' | 'meetings' | 'correspondence' | 'actionItems' | 'caseLog' | 'roster' | 'settings';