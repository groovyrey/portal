export interface ScheduleItem {
  subject: string; // The subject code/name from the portal
  description: string; // The descriptive name of the subject
  section: string;
  units: string;
  time: string;
  room: string;
}

export interface Financials {
  total: string;
  balance: string;
  dueToday?: string;
  dueAccounts?: {
    dueDate: string;
    description: string;
    amount: string;
    paid: string;
    due: string;
  }[];
  payments?: {
    date: string;
    reference: string;
    amount: string;
  }[];
  installments?: {
    dueDate: string;
    description: string;
    assessed: string;
    outstanding: string;
  }[];
  adjustments?: {
    dueDate: string;
    description: string;
    adjustment: string;
    outstanding: string;
  }[];
  assessment?: {
    description: string;
    amount: string;
  }[];
}

export interface ProspectusSubject {
  code: string;
  description: string;
  units: string;
  preReq: string;
}

export interface SubjectGrade {
  code: string;
  description: string;
  grade: string;
  remarks: string;
}

export interface SemesterGrade {
  semester: string;
  subjects: SubjectGrade[];
}

export interface ReportLink {
  text: string;
  href: string;
}

export interface ParsedName {
  firstName: string;
  lastName: string;
  middleName: string;
  full: string;
}

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  content: string;
  topic?: string;
  isUnreviewed?: boolean;
  createdAt: any;
  likes?: string[];
  commentCount?: number;
  poll?: {
    question: string;
    options: {
      text: string;
      votes: string[]; // array of userIds
    }[];
    expiresAt?: any;
  };
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: any;
  link?: string;
}

export interface Student {
  name: string;
  parsedName?: ParsedName;
  id: string;
  course: string;
  email?: string;
  address?: string;
  mobile?: string;
  enrollment_date?: string;
  yearLevel?: string;
  semester?: string;
  section?: string;
  schedule?: ScheduleItem[];
  financials?: Financials;
  offeredSubjects?: ProspectusSubject[];
  grades?: SemesterGrade[];
  availableReports?: ReportLink[];
  updated_at?: any;
  settings?: {
    notifications: boolean;
    isPublic: boolean;
    showAcademicInfo: boolean;
    showStudentId?: boolean;
    classReminders?: boolean;
    paymentReminders?: boolean;
  };
}

export interface LoginResponse {
  success: boolean;
  data?: Student;
  error?: string;
  debugLog?: string;
}
