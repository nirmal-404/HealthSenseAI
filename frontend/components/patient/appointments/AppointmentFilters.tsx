'use client';

import { Loader2, RotateCw, Filter, X } from 'lucide-react';
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
  const hasFilters = status !== 'all' || date !== '';

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-600" />
          <h3 className="text-base font-semibold text-slate-900">Filter Appointments</h3>
        </div>

        {/* Filters grid */}
        <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Status
            </label>
            <Select value={status} onValueChange={(value) => onStatusChange(value as AppointmentStatusFilter)}>
              <SelectTrigger className="h-9 rounded-lg border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:ring-blue-500">
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

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Appointment Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              className="h-9 rounded-lg border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
          <Button
            type="button"
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="rounded-lg border-slate-300 text-slate-700 hover:bg-white"
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Refreshing
              </>
            ) : (
              <>
                <RotateCw className="mr-1.5 h-3.5 w-3.5" />
                Refresh
              </>
            )}
          </Button>

          {hasFilters && (
            <Button
              type="button"
              onClick={onClear}
              variant="ghost"
              size="sm"
              className="rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Clear filters
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
