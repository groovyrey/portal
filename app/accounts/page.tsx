'use client';

import FinancialSummary from '@/components/dashboard/FinancialSummary';
import { useStudentQuery } from '@/lib/hooks';
import { 
  CreditCard, 
  History, 
  FileText, 
  Calendar,
  RefreshCw,
  Loader2,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Skeleton from '@/components/ui/Skeleton';
import LottieAnimation from '@/components/ui/LottieAnimation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function AccountsPage() {
  const { data: student, isLoading: loadingQuery, isFetching, refetch } = useStudentQuery();

  const handleManualRefresh = async () => {
    if (!student) return;
    const refreshToast = toast.loading('Syncing your accounts...');
    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), 
      });
      const result = await res.json();
      
      if (result.success) {
        localStorage.setItem('student_data', JSON.stringify(result.data));
        window.dispatchEvent(new Event('local-storage-update'));
        await refetch();
        toast.success('Accounts updated!', { id: refreshToast });
      } else {
        toast.error(result.error || 'Sync failed.', { id: refreshToast });
      }
    } catch {
      toast.error('Failed to sync.', { id: refreshToast });
    }
  };

  if (loadingQuery && !student) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-[150px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-md" />
      </div>
    );
  }

  if (!student || !student.financials) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <LottieAnimation 
          animationPath="/animations/girl-relaxing-error.json"
          className="w-64 h-64 mb-4"
        />
        <h2 className="text-2xl font-bold tracking-tight">No accounts found</h2>
        <p className="text-muted-foreground mb-8 max-w-sm">
          We couldn&apos;t find any financial records for your account. Try refreshing your data.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <a href="/">Go Home</a>
          </Button>
          <Button onClick={handleManualRefresh} disabled={isFetching}>
            {isFetching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const { financials } = student;

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
          <p className="text-muted-foreground">
            View your balance and payment history.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleManualRefresh}
            disabled={isFetching}
            variant="outline"
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Now
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        <FinancialSummary financials={financials} />

        {/* Payment Schedule */}
        {financials.dueAccounts && financials.dueAccounts.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Payment Schedule</CardTitle>
              </div>
              {financials.dueToday && financials.dueToday !== '₱0.00' && (
                <Badge variant="destructive" className="text-[10px]">Due Today</Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Description</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Paid</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {financials.dueAccounts.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{item.dueDate}</td>
                        <td className="px-6 py-4 font-medium uppercase text-xs">{item.description}</td>
                        <td className="px-6 py-4 text-right tabular-nums">₱{item.amount.replace('₱', '')}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 tabular-nums font-medium">₱{item.paid.replace('₱', '')}</td>
                        <td className="px-6 py-4 text-right tabular-nums font-bold">
                          {item.due.replace('₱', '') !== '0.00' ? (
                            <span className="text-destructive">₱{item.due.replace('₱', '')}</span>
                          ) : (
                            <span className="text-muted-foreground/50">₱0.00</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        {financials.payments && financials.payments.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Reference</th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {financials.payments.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 font-medium">{item.date}</td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="font-mono text-[10px] bg-background">
                            {item.reference}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right tabular-nums font-bold">₱{item.amount.replace('₱', '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fee Breakdown */}
          {financials.assessment && financials.assessment.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 bg-muted/30">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">Fee Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <tbody className="divide-y">
                    {financials.assessment.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-3.5 text-muted-foreground uppercase">{item.description}</td>
                        <td className="px-6 py-3.5 text-right font-bold tabular-nums">₱{item.amount.replace('₱', '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {/* Installments */}
            {financials.installments && financials.installments.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 space-y-0 bg-muted/30">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm">Installments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <tbody className="divide-y">
                      {financials.installments.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-3">
                            <p className="font-semibold uppercase">{item.description}</p>
                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{item.dueDate}</p>
                          </td>
                          <td className="px-6 py-3 text-right">
                            {item.outstanding.replace('₱', '') === '0.00' ? (
                              <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Paid</Badge>
                            ) : (
                              <span className="font-bold tabular-nums text-destructive text-sm">₱{item.outstanding.replace('₱', '')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* Adjustments */}
            {financials.adjustments && financials.adjustments.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 space-y-0 bg-muted/30">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm">Adjustments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <tbody className="divide-y">
                      {financials.adjustments.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-3">
                            <p className="font-semibold uppercase">{item.description}</p>
                            <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{item.dueDate}</p>
                          </td>
                          <td className="px-6 py-3 text-right font-bold tabular-nums text-primary text-sm">
                            ₱{item.adjustment.replace('₱', '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
