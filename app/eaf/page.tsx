'use client';

import React, { useState } from 'react';
import { FileText, Loader2, Download, RefreshCw, Sparkles, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function EAFPage() {
  const [rawHtml, setRawHtml] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchEAF = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/student/eaf');
      const data = await res.json();

      if (data.success) {
        const injectedHtml = data.html.replace('</HEAD>', `
          <style>
            body { background-color: white !important; padding: 20px !important; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          </style>
          </HEAD>
        `);
        setRawHtml(injectedHtml);
        toast.success('Registration Form Loaded');
      } else {
        toast.error(data.error || 'Failed to load form');
      }
    } catch (err) {
      toast.error('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Registration</h2>
          <p className="text-muted-foreground">
            View and print your official Enrollment Form.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {rawHtml && (
            <>
              <Button variant="outline" size="sm" onClick={fetchEAF} disabled={loading}>
                <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                Sync
              </Button>
              <Button size="sm" onClick={() => window.print()} disabled={loading}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            </>
          )}
        </div>
      </div>

      <Separator />

      {!rawHtml && !loading ? (
        <Card className="max-w-md mx-auto text-center p-12 mt-12">
          <CardHeader className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Form Access</CardTitle>
            <CardDescription>
              Download your official schedule and fees assessment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchEAF} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Load Form
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card className="max-w-md mx-auto text-center p-12 mt-12">
          <CardContent className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Getting your document from the portal...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="bg-muted/50 border rounded-md p-3 flex items-center justify-center gap-2">
            <Sparkles size={14} className="text-primary" />
            <p className="text-xs font-medium text-muted-foreground">
              Official Digital Copy of your Certificate of Matriculation.
            </p>
          </div>

          <Card className="overflow-hidden border shadow-lg bg-white">
            <iframe
              srcDoc={rawHtml}
              title="Certificate of Matriculation"
              className="w-full h-[1000px] border-none"
              sandbox="allow-same-origin allow-scripts allow-forms allow-modals"
            />
          </Card>
        </div>
      )}
    </div>
  );
}
