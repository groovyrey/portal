import { Financials } from '@/types';
import { Clock, CreditCard, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FinancialSummaryProps {
  financials: Financials;
}

export default function FinancialSummary({ financials }: FinancialSummaryProps) {
  const isPaid = !financials.balance || financials.balance === '₱0.00';
  const hasDueToday = financials.dueToday && financials.dueToday !== '₱0.00';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{financials.total || '₱0.00'}</div>
          <p className="text-xs text-muted-foreground mt-1">Current semester total</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Today</CardTitle>
          <Clock className={cn("h-4 w-4", hasDueToday ? "text-destructive" : "text-muted-foreground")} />
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold tracking-tight",
            hasDueToday && "text-destructive"
          )}>
            {financials.dueToday || '₱0.00'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Immediate payment due</p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          <Wallet className={cn("h-4 w-4", isPaid ? "text-primary" : "text-muted-foreground")} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{financials.balance || '₱0.00'}</div>
          <div className="mt-2">
            <Badge variant={isPaid ? "default" : "outline"} className="text-[10px]">
              {isPaid ? 'Fully Paid' : 'Balance Outstanding'}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
