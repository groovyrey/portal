import { Financials } from '@/types';
import { Clock, CreditCard, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CARD_THEMES } from '@/lib/card-themes';

interface FinancialSummaryProps {
  financials: Financials;
}

export default function FinancialSummary({ financials }: FinancialSummaryProps) {
  const isPaid = !financials.balance || financials.balance === '₱0.00';
  const hasDueToday = financials.dueToday && financials.dueToday !== '₱0.00';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className={cn("border-border bg-gradient-to-br", CARD_THEMES.violet.bg)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", CARD_THEMES.violet.tile)}>
            <CreditCard className={cn("h-4 w-4", CARD_THEMES.violet.icon)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{financials.total || '₱0.00'}</div>
          <p className="text-xs text-muted-foreground mt-1">Current semester total</p>
        </CardContent>
      </Card>

      <Card className={cn("border-border bg-gradient-to-br", CARD_THEMES.rose.bg)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Today</CardTitle>
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", CARD_THEMES.rose.tile)}>
            <Clock className={cn("h-4 w-4", hasDueToday ? CARD_THEMES.rose.icon : "text-muted-foreground")} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold tracking-tight",
            hasDueToday && "text-rose-600 dark:text-rose-400"
          )}>
            {financials.dueToday || '₱0.00'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Immediate payment due</p>
        </CardContent>
      </Card>

      <Card className={cn("border-border bg-gradient-to-br sm:col-span-2 lg:col-span-1", CARD_THEMES.emerald.bg)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", CARD_THEMES.emerald.tile)}>
            <Wallet className={cn("h-4 w-4", isPaid ? CARD_THEMES.emerald.icon : "text-muted-foreground")} />
          </div>
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
