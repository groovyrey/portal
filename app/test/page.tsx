import { showTestFeature } from '@/lib/flags';
import { PageHeader } from '@/components/shared/PageHeader';

export default async function TestPage() {
  const isEnabled = await showTestFeature();

  return (
    <div className="container mx-auto p-4">
      <PageHeader 
        title="Feature Flag Test" 
        description="Testing Vercel Feature Flags integration"
      />
      
      <div className="mt-8 p-6 bg-card rounded-lg border border-border shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Flag Status</h2>
        
        {isEnabled ? (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded text-green-600 dark:text-green-400">
            <p className="font-medium">✅ The "test-feature" flag is ON</p>
            <p className="mt-2 text-sm opacity-90">
              This content is only visible because the flag returned true. 
              In development, this flag is set to default to true.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded text-red-600 dark:text-red-400">
            <p className="font-medium">❌ The "test-feature" flag is OFF</p>
            <p className="mt-2 text-sm opacity-90">
              The experimental feature is currently disabled.
            </p>
          </div>
        )}

        <div className="mt-6 text-sm text-muted-foreground">
          <p>
            To manage this flag, you can use the Vercel Toolbar or update the logic in 
            <code>lib/flags.ts</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
