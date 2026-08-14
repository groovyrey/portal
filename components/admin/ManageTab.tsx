'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import BadgeDisplay from '@/components/shared/BadgeDisplay';
import { Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PAGE_SIZE = 10;

export default function ManageTab() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return students.slice(start, start + PAGE_SIZE);
  }, [students, currentPage]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('/api/admin/students/courses');
        const data = await response.json();
        if (data.success) setCourses(data.courses || []);
      } catch {
        // courses list is optional; fall back to search only
      }
    };
    loadCourses();
  }, []);

  const fetchStudents = useCallback(async (query: string, course: string) => {
    const trimmed = query.trim();
    const courseParam = course && course !== 'all' ? course : '';

    if (!trimmed && !courseParam) {
      setStudents([]);
      setHasSearched(false);
      setCurrentPage(1);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setCurrentPage(1);

    try {
      const params = new URLSearchParams();
      if (trimmed) params.set('search', trimmed);
      if (courseParam) params.set('course', courseParam);
      const response = await fetch(`/api/admin/students?${params.toString()}`);
      const data = (await response.json()) as { success: boolean; students?: Student[]; error?: string };

      if (!data.success) {
        toast.error(data.error || 'Failed to fetch');
        return;
      }

      setStudents(data.students || []);
    } catch {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchStudents(searchTerm, courseFilter);
  };

  const handleCourseChange = (value: string) => {
    setCourseFilter(value);
    setCurrentPage(1);
    if (searchTerm.trim() || value !== 'all') {
      fetchStudents(searchTerm, value);
    } else {
      setStudents([]);
      setHasSearched(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">User Directory</CardTitle>
        <CardDescription>Search and manage student profiles.</CardDescription>
        <div className="pt-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Name or Student ID..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={courseFilter} onValueChange={handleCourseChange}>
              <SelectTrigger className="sm:w-[220px]">
                <SelectValue placeholder="All courses" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[2000] max-h-[280px]">
                <SelectItem value="all">All courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Search
            </Button>
          </form>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 text-left">ID</th>
                <th className="px-6 py-3 text-left">Student</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Details</th>
                <th className="px-6 py-3 text-left">Badges</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-3" />
                    <p className="text-xs font-medium">Finding students...</p>
                  </td>
                </tr>
              ) : !hasSearched ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <p className="text-sm font-medium">Enter a search term to begin.</p>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <p className="text-sm font-medium">No matches found for &quot;{searchTerm}&quot;</p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{student.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold truncate max-w-[120px] sm:max-w-none">{student.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase truncate max-w-[120px] sm:max-w-none">{student.course}</p>
                    </td>
                    <td className="px-6 py-4 text-xs hidden md:table-cell">
                      {student.yearLevel} • {student.semester}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <BadgeDisplay badgeIds={student.badges} size="sm" />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/manage?id=${encodeURIComponent(student.id)}`)}
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && students.length > 0 && (
          <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              {students.length} results found
            </p>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <p className="text-xs font-medium text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
