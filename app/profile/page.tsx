'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Student } from '@/types';
import { 
  GraduationCap, 
  ShieldCheck,
  ArrowLeft,
  IdCard,
  Loader2,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';
import PersonalInfo from '@/components/PersonalInfo';
import { parseStudentName } from '@/lib/utils';

function ProfileContent() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
  const searchParams = useSearchParams();
  const profileId = searchParams.get('id');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      
      const saved = localStorage.getItem('student_data');
      const currentUser = saved ? JSON.parse(saved) : null;
      const currentUserId = currentUser?.id;

      // Determine if we are viewing someone else's profile
      const viewingOthers = !!(profileId && profileId !== currentUserId);
      setIsPublicView(viewingOthers);

      if (viewingOthers) {
        try {
          const docRef = doc(db, 'students', profileId!);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStudent({
              id: profileId,
              name: data.name,
              parsedName: parseStudentName(data.name),
              course: data.course,
              yearLevel: data.year_level,
              semester: data.semester,
              email: data.email,
              settings: data.settings || {
                notifications: true,
                isPublic: true,
                showAcademicInfo: true
              }
            } as any);
          }
        } catch (err) {
          console.error('Failed to fetch public profile', err);
        }
      } else {
        // Viewing own profile
        if (currentUser) {
          setStudent(currentUser);
        } else {
          // If no local data, try to fetch from /me
          try {
            const res = await fetch('/api/student/me');
            const result = await res.json();
            if (result.success) setStudent(result.data);
          } catch (e) {
            console.error('Failed to fetch own profile', e);
          }
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, [profileId]);

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
    </div>
  );

  if (!student) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
      <IdCard className="h-12 w-12 text-slate-200 mb-4" />
      <h2 className="text-xl font-bold text-slate-900">Profile Not Found</h2>
      <Link href="/" className="mt-4 text-blue-600 font-semibold">Return Home</Link>
    </div>
  );

  if (isPublicView && student.settings && !student.settings.isPublic) return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <Link href="/community" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium mb-8">
        <ArrowLeft className="h-4 w-4" />
        Back to Community
      </Link>
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
          <Lock className="h-8 w-8 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">This Profile is Private</h2>
        <p className="text-slate-500 max-w-sm mx-auto">
          The student has chosen to keep their profile information private.
        </p>
      </div>
    </div>
  );

  const showAcademic = !isPublicView || (student.settings?.showAcademicInfo ?? true);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <Link href={isPublicView ? "/community" : "/"} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${isPublicView ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-green-50 text-green-600 border-green-100'}`}>
          <ShieldCheck className="h-3 w-3" />
          {isPublicView ? "Public View" : "Verified Account"}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Profile Header */}
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 p-1 shrink-0 shadow-sm">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=f8fafc&color=334155&size=256&font-size=0.33&bold=true`}
                alt={student.name}
                className="w-full h-full rounded-xl object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-1">
                {student.parsedName 
                  ? `${student.parsedName.firstName} ${student.parsedName.lastName}`
                  : student.name}
              </h1>
              <p className="text-slate-500 font-mono text-sm mb-3">{student.id}</p>
              {showAcademic && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wider border border-blue-100">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {student.course}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-8">
          {showAcademic && (
            <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-slate-50">
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Year Level</p>
                 <p className="text-sm font-semibold text-slate-700">{student.yearLevel}</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Semester</p>
                 <p className="text-sm font-semibold text-slate-700">{student.semester}</p>
               </div>
            </div>
          )}
          <PersonalInfo student={student} isPublic={isPublicView} />

          {!isPublicView && (
            <div className="mt-12 p-4 bg-slate-900 rounded-xl text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">Privacy Control</p>
                  <p className="text-[10px] text-slate-400">Personal details are only visible to you.</p>
                </div>
              </div>
              <Link href="/settings" title="Settings" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Lock className="h-4 w-4" />
              </Link>
            </div>
          )}
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
