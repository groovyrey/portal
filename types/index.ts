export interface ScheduleItem {
  subject: string;
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

export interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
  likes?: string[];
  commentCount?: number;
}

export interface CommunityComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
}

export interface Student {
  name: string;
  id: string;
  course: string;
  gender?: string;
  address?: string;
  contact?: string;
  email?: string;
  yearLevel?: string;
  semester?: string;
  section?: string;
  schedule?: ScheduleItem[];
  financials?: Financials;
  offeredSubjects?: ProspectusSubject[];
  grades?: SemesterGrade[];
  availableReports?: ReportLink[];
  settings?: {
    notifications: boolean;
    isPublic: boolean;
    showAcademicInfo: boolean;
  };
}

export interface LoginResponse {
  success: boolean;
  data?: Student;
  error?: string;
  debugLog?: string;
}
