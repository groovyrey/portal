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
        <IdCard className="h-16 w-16 text-slate-200 mb-4" />
        <h2 className="text-xl font-black text-slate-800 uppercase">Profile Not Found</h2>
        <p className="text-slate-500 text-sm mt-2 mb-8">The requested student profile could not be loaded.</p>
        <Link href="/" className="bg-blue-600 text-white font-black text-xs uppercase px-8 py-3 rounded-2xl shadow-lg">Return Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Link href={isPublicView ? "/community" : "/"} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-bold text-xs uppercase tracking-widest">
            <ArrowLeft className="h-4 w-4" />
            Back to {isPublicView ? "Community" : "Dashboard"}
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100">
            <ShieldCheck className="h-3 w-3" />
            <span className="text-[10px] font-black uppercase tracking-tighter">
                {isPublicView ? "Public Profile" : "Verified Profile"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Digital ID Card */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[2.5rem] p-8 shadow-2xl shadow-blue-200 relative overflow-hidden text-white aspect-[3/4.5] flex flex-col items-center text-center">
                {/* ID Card Background Pattern */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                
                {/* School Branding */}
                <div className="relative z-10 w-full flex justify-between items-start mb-10">
                  <div className="text-left">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">La Concepcion</h2>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 leading-none">College, Inc.</h2>
                  </div>
                  <IdCard className="h-6 w-6 opacity-50" />
                </div>

                {/* Profile Photo Placeholder */}
                <div className="relative z-10 mb-6">
                  <div className="w-32 h-32 rounded-3xl bg-white p-1 shadow-2xl">
                    <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=f1f5f9&color=1e293b&size=256&font-size=0.33&bold=true`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-xl shadow-lg border-4 border-indigo-800">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                </div>

                {/* Name & ID */}
                <div className="relative z-10 space-y-1 mb-8">
                  <h3 className="text-xl font-black uppercase tracking-tight leading-tight">{student.name}</h3>
                  <p className="text-blue-200 text-xs font-bold tracking-[0.3em]">{student.id}</p>
                </div>

                {/* Course */}
                <div className="relative z-10 w-full bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 mb-8">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-60 block mb-1">Enrolled Program</span>
                  <p className="text-[10px] font-bold leading-tight uppercase">{student.course}</p>
                </div>

                {/* Fake QR Code for "Digital Feel" */}
                <div className="mt-auto relative z-10 bg-white p-3 rounded-2xl shadow-inner">
                  <QrCode className="h-16 w-16 text-slate-900" />
                </div>
                <p className="mt-4 text-[8px] font-black uppercase tracking-[0.4em] opacity-40">Scan for Verification</p>
              </div>
            </div>
          </div>

          {/* Detailed Info */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                Academic Background
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InfoItem icon={<User className="text-blue-500" />} label="Year Level" value={student.yearLevel} />
                <InfoItem icon={<Calendar className="text-indigo-500" />} label="Current Semester" value={student.semester} />
                <InfoItem icon={<GraduationCap className="text-purple-500" />} label="Program" value={student.course} />
                <InfoItem icon={<IdCard className="text-orange-500" />} label="Student Number" value={student.id} />
              </div>
            </div>

            {!isPublicView && (
              <>
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Contact Information
                  </h3>
                  
                  <div className="space-y-8">
                    <InfoItem icon={<Mail className="text-emerald-500" />} label="Registered Email" value={student.email} />
                    <InfoItem icon={<Phone className="text-sky-500" />} label="Mobile Number" value={student.contact} />
                    <InfoItem icon={<MapPin className="text-red-500" />} label="Permanent Address" value={student.address} />
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex items-center justify-between overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-full bg-white/5 skew-x-[-20deg] translate-x-8"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-widest">Privacy Protected</h4>
                            <p className="text-[10px] text-slate-400 font-bold">This data is encrypted and only visible to you.</p>
                        </div>
                    </div>
                    <Link href="/change-password" title="Settings" className="relative z-10 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all">
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
    <div className="flex items-start gap-4 group">
      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value || 'Not Provided'}</p>
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
