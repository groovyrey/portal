import { Student } from '../types';

interface DashboardHeaderProps {
  student: Student;
  onLogout: () => void;
}

export default function DashboardHeader({ student, onLogout }: DashboardHeaderProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex flex-col items-center md:items-start">
        <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
        <p className="text-slate-500 font-medium text-sm mt-1">{student.course}</p>
        <div className="flex gap-2 mt-3 flex-wrap justify-center md:justify-start">
          <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">
            ID: {student.id}
          </span>
          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
            {student.yearLevel}
          </span>
          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
            {student.semester}
          </span>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg text-sm transition-colors duration-200 flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Sign Out
      </button>
    </div>
  );
}
