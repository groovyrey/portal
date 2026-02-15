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
  ledger?: {
    date: string;
    description: string;
    debit: string;
    credit: string;
    balance: string;
  }[];
}

export interface ProspectusSubject {
  code: string;
  description: string;
  units: string;
  preReq: string;
}

export interface ProspectusYear {
  year: string;
  semesters: {
    semester: string;
    subjects: ProspectusSubject[];
  }[];
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
  prospectus?: ProspectusYear[];
  offeredSubjects?: ProspectusSubject[];
  grades?: SemesterGrade[];
  availableReports?: ReportLink[];
}

export interface LoginResponse {
  success: boolean;
  data?: Student;
  error?: string;
  debugLog?: string;
}
