'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Student } from '@/types';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  QrCode, 
  ShieldCheck,
  ArrowLeft,
  IdCard,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';

function ProfileContent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
  const searchParams = useSearchParams();
  const profileId = searchParams.get('id');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      
      // If an ID is in the URL, we are viewing someone else
      if (profileId) {
        setIsPublicView(true);
        try {
          const docRef = doc(db, 'students', profileId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStudent({
              id: profileId,
              name: data.name,
              course: data.course,
              yearLevel: data.year_level,
              semester: data.semester,
              gender: data.gender,
              email: data.email,
              contact: data.contact,
              address: data.address
            } as any);
          }
        } catch (err) {
          console.error('Failed to fetch public profile', err);
        }
      } else {
        // Own profile from local storage
        const saved = localStorage.getItem('student_data');
        if (saved) setStudent(JSON.parse(saved));
        setIsPublicView(false);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-8">
        <IdCard className="h-12 w-12 text-slate-200 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
        <p className="text-slate-500 text-sm mt-1 mb-8">The requested student profile could not be loaded.</p>
        <Link href="/" className="bg-blue-600 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition-colors">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href={isPublicView ? "/community" : "/"} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold text-xs uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4" />
            Back to {isPublicView ? "Community" : "Dashboard"}
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
            <ShieldCheck className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
                {isPublicView ? "Public" : "Verified"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Digital ID Card */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden flex flex-col items-center text-center">
                {/* Branding */}
                <div className="w-full flex justify-between items-start mb-10">
                  <div className="text-left">
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Student Identity</h2>
                    <h2 className="text-xs font-bold text-slate-900 leading-none">Portal Card</h2>
                  </div>
                  <IdCard className="h-5 w-5 text-slate-300" />
                </div>

                {/* Profile Photo */}
                <div className="mb-6">
                  <div className="w-32 h-32 rounded-2xl bg-slate-50 border border-slate-100 p-1">
                    <div className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=f1f5f9&color=1e293b&size=256&font-size=0.33&bold=true`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* Name & ID */}
                <div className="space-y-1 mb-8">
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{student.name}</h3>
                  <p className="text-slate-500 text-xs font-mono font-semibold tracking-wider">{student.id}</p>
                </div>

                {/* Course */}
                <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 mb-8">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Enrolled Program</span>
                  <p className="text-xs font-semibold text-slate-700 leading-tight uppercase">{student.course}</p>
                </div>

                {/* QR Code */}
                <div className="mt-auto bg-white p-3 rounded-xl border border-slate-100">
                  <QrCode className="h-12 w-12 text-slate-900" />
                </div>
                <p className="mt-3 text-[8px] font-bold uppercase tracking-widest text-slate-400">Digital Verification</p>
              </div>
            </div>
          </div>

          {/* Detailed Info */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                Academic Background
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoItem icon={<User className="text-slate-400" />} label="Year Level" value={student.yearLevel} />
                <InfoItem icon={<Calendar className="text-slate-400" />} label="Current Semester" value={student.semester} />
                <InfoItem icon={<GraduationCap className="text-slate-400" />} label="Program" value={student.course} />
                <InfoItem icon={<IdCard className="text-slate-400" />} label="Student Number" value={student.id} />
              </div>
            </div>

            {!isPublicView && (
              <>
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Contact Information
                  </h3>
                  
                  <div className="space-y-8">
                    <InfoItem icon={<Mail className="text-slate-400" />} label="Registered Email" value={student.email} />
                    <InfoItem icon={<Phone className="text-slate-400" />} label="Mobile Number" value={student.contact} />
                    <InfoItem icon={<MapPin className="text-slate-400" />} label="Permanent Address" value={student.address} />
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 text-white flex items-center justify-between overflow-hidden relative">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider">Privacy Protected</h4>
                            <p className="text-[10px] text-slate-400 font-medium">This data is encrypted and only visible to you.</p>
                        </div>
                    </div>
                    <Link href="/change-password" title="Settings" className="relative z-10 p-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        <LockIcon size={16} />
                    </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value || 'Not Provided'}</p>
      </div>
    </div>
  );
}

function LockIcon({ size }: { size: number }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
        >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
    )
}
