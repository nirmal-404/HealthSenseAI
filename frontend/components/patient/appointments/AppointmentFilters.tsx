'use client';

import { Loader2, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AppointmentStatusFilter } from '@/lib/appointments.types';

type AppointmentFiltersProps = {
  status: AppointmentStatusFilter;
  date: string;
  onStatusChange: (status: AppointmentStatusFilter) => void;
  onDateChange: (date: string) => void;
  onClear: () => void;
  onRefresh: () => void;
  refreshing?: boolean;
};

const statusOptions: Array<{ label: string; value: AppointmentStatusFilter }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Rejected', value: 'rejected' },
];

export function AppointmentFilters({
  status,
  date,
  onStatusChange,
  onDateChange,
  onClear,
  onRefresh,
  refreshing,
}: AppointmentFiltersProps) {
  return (
    <div className="rounded-2xl border border-[#dce5f4] bg-white p-4 shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</p>
            <Select value={status} onValueChange={(value) => onStatusChange(value as AppointmentStatusFilter)}>
              <SelectTrigger className="h-10 w-full rounded-xl border-[#dce5f2] bg-[#f8fbff] text-slate-700">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Date</p>
            <Input
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              className="h-10 rounded-xl border-[#dce5f2] bg-[#f8fbff] text-slate-700"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={onRefresh}
            variant="outline"
            className="h-10 rounded-xl border-[#dce5f2] bg-white text-slate-700 hover:bg-[#eef4ff] hover:text-[#2f58db]"
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Refreshing
              </>
            ) : (
              <>
                <RotateCw className="mr-1.5 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>

          <Button
            type="button"
            onClick={onClear}
            variant="ghost"
            className="h-10 rounded-xl text-slate-600 hover:bg-[#eef4ff] hover:text-[#2f58db]"
          >
            Clear filters
          </Button>
        </div>
      </div>
    </div>
  );
}
