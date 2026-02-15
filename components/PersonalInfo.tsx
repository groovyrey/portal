import { Student } from '../types';

interface PersonalInfoProps {
  student: Student;
}

export default function PersonalInfo({ student }: PersonalInfoProps) {
  const details = [
    { label: 'Gender', value: student.gender, icon: '👤' },
    { label: 'Contact', value: student.contact, icon: '📱' },
    { label: 'Email', value: student.email, icon: '📧' },
    { label: 'Address', value: student.address, icon: '📍' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Personal Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {details.map((detail, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <span className="text-xl">{detail.icon}</span>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">{detail.label}</p>
              <p className="text-sm font-semibold text-slate-700">{detail.value || 'N/A'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
