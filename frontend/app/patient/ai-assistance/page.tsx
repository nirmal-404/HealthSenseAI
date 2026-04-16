'use client';

import HealthSenseBot from '@/components/ai/health-sense-bot';
import { Bot } from 'lucide-react';

export default function PatientAIAssistancePage() {
  return (
      <div className="h-[calc(100vh-230px)] min-h-[560px]">
        <HealthSenseBot mode="embedded" />
      </div>

  );
}
