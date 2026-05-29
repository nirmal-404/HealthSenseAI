'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, Download, Eye, Pill, RefreshCcw, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { downloadPrescription, getPatientPrescriptions } from '@/lib/prescriptions.api';
import type { PrescriptionRecord } from '@/lib/prescriptions.types';
import { formatAppointmentDate } from '@/lib/appointments.utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();

  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [doctorFilter, setDoctorFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionRecord | null>(null);

  const fetchPrescriptions = useCallback(
    async (showRefresh = false) => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await getPatientPrescriptions(user.id, {
          doctorId: doctorFilter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          search: search || undefined,
        });
        setPrescriptions(result);
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Failed to load prescriptions.'));
      } finally {
        if (showRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [dateFrom, dateTo, doctorFilter, search, user?.id]
  );

  useEffect(() => {
    void fetchPrescriptions();
  }, [fetchPrescriptions]);

  const medicationCount = useMemo(
    () => prescriptions.reduce((count, prescription) => count + prescription.medications.length, 0),
    [prescriptions]
  );

  const handleDownload = async (prescription: PrescriptionRecord) => {
    try {
      await downloadPrescription(
        prescription.prescriptionId,
        `prescription-${prescription.prescriptionId}.pdf`
      );
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to download prescription.'));
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card className="border border-[#dce5f4] bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-[#1f2a44]">My Prescriptions</CardTitle>
            <p className="text-sm text-slate-500">
              View and download prescriptions issued for your paid appointments.
            </p>
          </div>
          <Button
            variant="outline"
            className="border-[#dce5f4] text-[#2f58db]"
            onClick={() => void fetchPrescriptions(true)}
            disabled={refreshing}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Filter by doctor ID"
            value={doctorFilter}
            onChange={(event) => setDoctorFilter(event.target.value)}
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search medications or notes"
              className="pl-9"
            />
          </label>

          <div className="md:col-span-2 lg:col-span-4 flex justify-end">
            <Button className="bg-[#2f58db] text-white hover:bg-[#2446b8]" onClick={() => void fetchPrescriptions(true)}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[#dce5f4] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-[#1f2a44]">
            {prescriptions.length} prescriptions • {medicationCount} medication lines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-xl border border-dashed border-[#dce5f4] bg-[#f8fbff] p-5 text-sm text-slate-500">
              Loading prescriptions...
            </div>
          ) : prescriptions.length ? (
            <div className="space-y-3">
              {prescriptions.map((prescription) => (
                <article
                  key={prescription.prescriptionId}
                  className="rounded-xl border border-[#e2eaf6] bg-[#fbfdff] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#1f2a44]">
                        Prescription #{prescription.prescriptionId.slice(0, 8)}
                      </p>
                      <p className="text-xs text-slate-500">Doctor ID: {prescription.doctorId}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-600">
                        <CalendarDays className="h-3.5 w-3.5 text-[#315ae7]" />
                        {formatAppointmentDate(prescription.issuedDate)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-semibold text-[#2f58db]">
                        {prescription.medications.length} meds
                      </span>
                      <Button
                        variant="outline"
                        className="h-8 border-[#dce5f4] px-3 text-xs"
                        onClick={() => {
                          setSelectedPrescription(prescription);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 border-[#dce5f4] px-3 text-xs"
                        onClick={() => void handleDownload(prescription)}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {prescription.medications.slice(0, 3).map((medication, index) => (
                      <span
                        key={`${prescription.prescriptionId}-med-${index}`}
                        className="rounded-full border border-[#dce5f4] bg-white px-2.5 py-1 text-[11px] text-slate-600"
                      >
                        <Pill className="mr-1 inline h-3 w-3 text-[#2f58db]" />
                        {medication.name} ({medication.dosage})
                      </span>
                    ))}
                    {prescription.medications.length > 3 ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                        +{prescription.medications.length - 3} more
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#dce5f4] bg-[#f8fbff] p-5 text-sm text-slate-500">
              No prescriptions available yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              Review your full medication plan and download the official prescription file.
            </DialogDescription>
          </DialogHeader>

          {selectedPrescription ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[#e2eaf6] bg-[#f8fbff] p-3 text-sm text-slate-700">
                <p>
                  <span className="font-semibold text-[#1f2a44]">Prescription ID:</span>{' '}
                  {selectedPrescription.prescriptionId}
                </p>
                <p>
                  <span className="font-semibold text-[#1f2a44]">Appointment ID:</span>{' '}
                  {selectedPrescription.appointmentId}
                </p>
                <p>
                  <span className="font-semibold text-[#1f2a44]">Doctor ID:</span>{' '}
                  {selectedPrescription.doctorId}
                </p>
                <p>
                  <span className="font-semibold text-[#1f2a44]">Issued:</span>{' '}
                  {formatAppointmentDate(selectedPrescription.issuedDate)}
                </p>
              </div>

              <div className="space-y-2">
                {selectedPrescription.medications.map((medication, index) => (
                  <div
                    key={`${selectedPrescription.prescriptionId}-detail-${index}`}
                    className="rounded-lg border border-[#e2eaf6] bg-white p-3 text-sm text-slate-700"
                  >
                    <p className="font-semibold text-[#1f2a44]">{index + 1}. {medication.name}</p>
                    <p>Dosage: {medication.dosage}</p>
                    <p>Frequency: {medication.frequency}</p>
                    <p>Duration: {medication.duration}</p>
                  </div>
                ))}
              </div>

              {selectedPrescription.notes?.trim() ? (
                <div className="rounded-lg border border-[#e2eaf6] bg-[#fbfdff] p-3 text-sm text-slate-700">
                  <p className="font-semibold text-[#1f2a44]">Notes</p>
                  <p className="mt-1 whitespace-pre-wrap">{selectedPrescription.notes}</p>
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button
                  className="bg-[#2f58db] text-white hover:bg-[#2446b8]"
                  onClick={() => void handleDownload(selectedPrescription)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}