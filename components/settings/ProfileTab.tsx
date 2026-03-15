'use client';

import React, { useState, useMemo } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap, 
  Calendar, 
  Shield,
  Save
} from 'lucide-react';
import { Student } from '@/types';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  ThemeProvider,
  createTheme
} from '@mui/material';
import { useTheme } from '@/components/shared/ThemeProvider';

interface ProfileTabProps {
  student: Student;
  updateSettings: (newSettings: any) => Promise<void>;
}

export default function ProfileTab({ student, updateSettings }: ProfileTabProps) {
  const [selectedCampus, setSelectedCampus] = useState(student.settings?.campus || '');
  const [isSaving, setIsSaving] = useState(false);
  const { resolvedTheme } = useTheme();

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: resolvedTheme,
      primary: {
        main: '#3b82f6', // blue-500
      },
      background: {
        paper: resolvedTheme === 'dark' ? '#1e293b' : '#ffffff', // slate-800 or white
      },
      text: {
        primary: resolvedTheme === 'dark' ? '#f8fafc' : '#0f172a',
        secondary: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b',
      }
    },
    typography: {
      fontFamily: 'inherit',
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: '12px',
            border: resolvedTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
          }
        }
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#3b82f6',
            },
          }
        }
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            fontWeight: 500,
          }
        }
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            fontSize: '0.875rem',
            fontWeight: 500,
          }
        }
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            fontWeight: 500,
          }
        }
      }
    }
  }), [resolvedTheme]);

  const handleCampusChange = (event: SelectChangeEvent) => {
    setSelectedCampus(event.target.value as string);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings({
      ...(student.settings || {}),
      campus: selectedCampus
    });
    setIsSaving(false);
  };

  const hasChanges = selectedCampus !== (student.settings?.campus || '');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 p-6 bg-card rounded-2xl border border-border shadow-sm">
          <div className="w-20 h-20 rounded-full bg-accent border border-border shrink-0 overflow-hidden">
              <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=0f172a&color=f8fafc&size=256&bold=true`}
                  alt={student.name}
                  className="w-full h-full object-cover dark:opacity-80"
              />
          </div>
          <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl text-foreground leading-tight truncate">{student.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:text-blue-400 rounded border border-blue-500/20 uppercase tracking-wider">ID</span>
                <p className="text-xs text-muted-foreground font-mono font-bold tracking-tight">{student.id}</p>
              </div>
          </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Personal Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <InfoItem icon={<User />} label="First Name" value={student.parsedName?.firstName} />
                <InfoItem icon={<User />} label="Middle Name" value={student.parsedName?.middleName} />
                <InfoItem icon={<User />} label="Last Name" value={student.parsedName?.lastName} />
            </div>
          </div>
          
          <div className="pt-6 border-t border-border">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Contact Information</h4>
              <div className="space-y-4">
                  <InfoItem icon={<Mail />} label="Email Address" value={student.email} />
                  <InfoItem icon={<Phone />} label="Mobile Number" value={student.mobile} />
                  <InfoItem icon={<MapPin />} label="Mailing Address" value={student.address} />
              </div>
          </div>

          <div className="pt-6 border-t border-border">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Academic Background</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InfoItem icon={<GraduationCap />} label="Program" value={student.course} />
                  <InfoItem icon={<Calendar />} label="Year & Semester" value={`${student.yearLevel} / ${student.semester}`} />
              </div>
          </div>

          <div className="pt-6 border-t border-border">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Campus Location</h4>
              <div className="space-y-4">
                <ThemeProvider theme={muiTheme}>
                  <FormControl fullWidth variant="outlined" size="medium">
                    <InputLabel id="campus-select-label">Select Campus</InputLabel>
                    <Select
                      labelId="campus-select-label"
                      id="campus-select"
                      value={selectedCampus}
                      label="Select Campus"
                      onChange={handleCampusChange}
                    >
                      <MenuItem value="Muzon Campus">Muzon Campus</MenuItem>
                      <MenuItem value="Francisco Homes Campus">Francisco Homes Campus</MenuItem>
                      <MenuItem value="Main Campus (CBAS)">Main Campus (CBAS)</MenuItem>
                    </Select>
                  </FormControl>
                </ThemeProvider>

                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
                    hasChanges && !isSaving
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                  }`}
                >
                  <Save size={18} className={isSaving ? 'animate-pulse' : ''} />
                  {isSaving ? 'Saving Changes...' : 'Save Profile Settings'}
                </button>
              </div>
          </div>
      </div>

      <div className="p-4 bg-primary rounded-xl text-primary-foreground flex items-center gap-4 shadow-lg shadow-primary/20">
        <div className="p-2.5 bg-primary-foreground/10 rounded-lg">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <p className="text-xs text-primary-foreground/80 font-medium leading-relaxed">
          Your personal data is encrypted and strictly private. Only you can view these records.
        </p>
      </div>
    </div>
  );
}

      <div className="p-4 bg-primary rounded-xl text-primary-foreground flex items-center gap-4 shadow-lg shadow-primary/20">
        <div className="p-2.5 bg-primary-foreground/10 rounded-lg">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <p className="text-xs text-primary-foreground/80 font-medium leading-relaxed">
          Your personal data is encrypted and strictly private. Only you can view these records.
        </p>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shrink-0 border border-border text-primary shadow-sm">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18 }) : icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-bold text-foreground leading-tight">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}
