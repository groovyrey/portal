import { getTestFeature } from '@/lib/flags';
import PageHeader from '@/components/shared/PageHeader';

export default async function TestPage() {
  const flagData = await getTestFeature();

  return (
    <div className="container mx-auto p-4">
      <PageHeader 
        title="Feature Flag Test" 
        description="Testing Vercel Feature Flags integration"
      />
      
      <div className="mt-8 p-6 bg-card rounded-lg border border-border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Flag Status</h2>
        
        {flagData ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded text-green-600 dark:text-green-400">
              <p className="font-medium">✅ The "test-feature" flag is ON</p>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
              <p className="text-sm text-slate-500 mb-2 uppercase tracking-wider font-semibold">Greeting Value:</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 italic">
                "{flagData.greeting}"
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded text-red-600 dark:text-red-400">
            <p className="font-medium">❌ The "test-feature" flag is OFF</p>
            <p className="mt-2 text-sm opacity-90">
              The experimental feature is currently disabled or no greeting data was found.
            </p>
          </div>
        )}

        <div className="mt-6 text-sm text-muted-foreground pt-4 border-t border-border">
          <p>
            This value is being pulled from <code>lib/flags.ts</code>. 
            When deployed, Vercel will inject the actual "greeting" key-pair value you configured.
          </p>
        </div>
      </div>
    </div>
  );
}
