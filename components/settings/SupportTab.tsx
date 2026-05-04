'use client';

import React from 'react';
import { 
  Star, 
  Shield, 
  ChevronRight,
  MessageSquare,
  BookOpen,
  LifeBuoy
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import StarRating from '@/components/ui/StarRating';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SupportTab() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Support</h4>
        <p className="text-sm text-muted-foreground">
          Get help and share your feedback with us.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col h-full">
          <CardHeader className="text-center items-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Rate Experience</CardTitle>
            <CardDescription>
              Your feedback helps us improve.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            <div className="p-4 rounded-md border bg-muted/30">
              <StarRating onSuccess={() => {}} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          <SupportItem 
            icon={<BookOpen className="h-4 w-4" />} 
            title="Help Center" 
            description="Documentation and FAQs"
            onClick={() => router.push('/docs')}
          />
          <SupportItem 
            icon={<MessageSquare className="h-4 w-4" />} 
            title="Guidelines" 
            description="Our platform rules"
            onClick={() => {}}
          />
          <SupportItem 
            icon={<Shield className="h-4 w-4" />} 
            title="Privacy" 
            description="How we protect your data"
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

function SupportItem({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) {
  return (
    <Button 
      variant="outline"
      onClick={onClick}
      className="h-auto w-full flex items-center justify-between p-4 group text-left"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground group-hover:bg-background transition-colors">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate leading-none mb-1">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
    </Button>
  );
}
