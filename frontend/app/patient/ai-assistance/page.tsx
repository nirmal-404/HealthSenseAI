'use client';

import HealthSenseBot from '@/components/ai/health-sense-bot';

export default function PatientAIAssistancePage() {
  return (
      <div className="h-full w-full overflow-hidden">
        <HealthSenseBot mode="embedded" />
      </div>
  );
}
