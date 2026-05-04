'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import SecuritySettings from '@/components/dashboard/SecuritySettings';

export default function SecurityTab() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Account Security</h4>
        <p className="text-sm text-muted-foreground">
          Change your password and manage your account protection.
        </p>
      </div>

      <div className="max-w-md">
        <SecuritySettings />
      </div>
    </div>
  );
}
