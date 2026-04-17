'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  CalendarDays,
  Download,
  Eye,
  Pencil,
  Pill,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDoctorAppointments } from '@/lib/appointments.api';
import type { Appointment } from '@/lib/appointments.types';
import { formatAppointmentDate, formatAppointmentTimeRange } from '@/lib/appointments.utils';
import {
  createPrescription,
  deletePrescription,
  downloadPrescription,
  getDoctorPrescriptions,
  updatePrescription,
} from '@/lib/prescriptions.api';
import type { MedicationLine, PrescriptionRecord } from '@/lib/prescriptions.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const newMedication = (): MedicationLine => ({
  name: '',
  dosage: '',
  frequency: '',
  duration: '',
});

const getErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.message || error?.message || fallback;

const clearFieldClassName =
  'bg-white text-slate-900 placeholder:text-slate-400 caret-slate-900 [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a] [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#ffffff]';

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [paidAppointments, setPaidAppointments] = useState<Appointment[]>([]);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [medications, setMedications] = useState<MedicationLine[]>([newMedication()]);
  const [notes, setNotes] = useState('');
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionRecord | null>(null);
  const [search, setSearch] = useState('');
  const [prefillApplied, setPrefillApplied] = useState(false);

  const appointmentIdFromQuery = searchParams.get('appointmentId') || '';
  const patientIdFromQuery = searchParams.get('patientId') || '';

  const selectedAppointment = useMemo(
    () => paidAppointments.find((appointment) => appointment.appointmentId === selectedAppointmentId),
    [paidAppointments, selectedAppointmentId]
  );

  const appointmentById = useMemo(
    () => new Map(paidAppointments.map((appointment) => [appointment.appointmentId, appointment])),
    [paidAppointments]
  );

  const filteredPrescriptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return prescriptions;
    }

    return prescriptions.filter((prescription) => {
      const medicationText = prescription.medications
        .map((medication) => `${medication.name} ${medication.dosage} ${medication.frequency} ${medication.duration}`)
        .join(' ')
        .toLowerCase();

      return (
        prescription.patientId.toLowerCase().includes(keyword) ||
        prescription.appointmentId.toLowerCase().includes(keyword) ||
        prescription.prescriptionId.toLowerCase().includes(keyword) ||
        medicationText.includes(keyword)
      );
    });
  }, [prescriptions, search]);

  const fetchData = useCallback(
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
        const [prescriptionData, appointmentData] = await Promise.all([
          getDoctorPrescriptions(user.id),
          getDoctorAppointments(user.id, { status: 'all' }),
        ]);

        setPrescriptions(prescriptionData);
        setPaidAppointments(
          appointmentData.filter(
            (appointment) =>
              appointment.status === 'confirmed' && appointment.paymentStatus === 'paid'
          )
        );
      } catch (error: any) {
        toast.error(getErrorMessage(error, 'Failed to load prescription data.'));
      } finally {
        if (showRefresh) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [user?.id]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (prefillApplied) {
      return;
    }

    if (!appointmentIdFromQuery) {
      setPrefillApplied(true);
      return;
    }

    const matched = paidAppointments.find(
      (appointment) => appointment.appointmentId === appointmentIdFromQuery
    );

    if (matched) {
      setSelectedAppointmentId(matched.appointmentId);
      setSelectedPatientId(matched.patientId);
      setPrefillApplied(true);
      return;
    }

    if (patientIdFromQuery) {
      setSelectedPatientId(patientIdFromQuery);
    }

    setPrefillApplied(true);
  }, [appointmentIdFromQuery, paidAppointments, patientIdFromQuery, prefillApplied]);

  const resetForm = () => {
    setEditingPrescriptionId(null);
    setSelectedAppointmentId('');
    setSelectedPatientId('');
    setMedications([newMedication()]);
    setNotes('');
  };

  const handleSelectAppointment = (appointmentId: string) => {
    if (editingPrescriptionId) {
      return;
    }

    const appointment = paidAppointments.find((item) => item.appointmentId === appointmentId);
    setSelectedAppointmentId(appointmentId);
    setSelectedPatientId(appointment?.patientId || '');
  };

  const handleMedicationChange = (
    index: number,
    field: keyof MedicationLine,
    value: string
  ) => {
    setMedications((prev) =>
      prev.map((medication, medicationIndex) =>
        medicationIndex === index ? { ...medication, [field]: value } : medication
      )
    );
  };

  const handleAddMedication = () => {
    setMedications((prev) => [...prev, newMedication()]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications((prev) => {
      if (prev.length === 1) {
        return prev;
      }

      return prev.filter((_, medicationIndex) => medicationIndex !== index);
    });
  };

  const handleStartEdit = (prescription: PrescriptionRecord) => {
    setEditingPrescriptionId(prescription.prescriptionId);
    setSelectedAppointmentId(prescription.appointmentId);
    setSelectedPatientId(prescription.patientId);
    setMedications(
      prescription.medications.length
        ? prescription.medications.map((medication) => ({ ...medication }))
        : [newMedication()]
    );
    setNotes(prescription.notes || '');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('Session lost. Please sign in again.');
      return;
    }

    if (!selectedAppointmentId || !selectedPatientId) {
      toast.error('Please select a paid appointment first.');
      return;
    }

    const hasInvalidMedication = medications.some(
      (medication) =>
        !medication.name.trim() ||
        !medication.dosage.trim() ||
        !medication.frequency.trim() ||
        !medication.duration.trim()
    );

    if (hasInvalidMedication) {
      toast.error('Please complete all medication fields.');
      return;
    }

    setSubmitting(true);

    try {
      if (editingPrescriptionId) {
        await updatePrescription(editingPrescriptionId, {
          medications,
          notes,
        });
        toast.success('Prescription updated successfully.');
      } else {
        await createPrescription({
          patientId: selectedPatientId,
          doctorId: user.id,
          appointmentId: selectedAppointmentId,
          medications,
          notes,
        });
        toast.success('Prescription created successfully.');
      }

      resetForm();
      await fetchData(true);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to save prescription.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePrescription = async (prescription: PrescriptionRecord) => {
    const confirmed = window.confirm(
      'Delete this prescription permanently? This action cannot be undone.'
    );

    if (!confirmed) {
      return;
    }

    try {
      await deletePrescription(prescription.prescriptionId);
      toast.success('Prescription deleted successfully.');

      if (editingPrescriptionId === prescription.prescriptionId) {
        resetForm();
      }

      await fetchData(true);
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to delete prescription.'));
    }
  };

  const handleDownloadPrescription = async (prescription: PrescriptionRecord) => {
    try {
      await downloadPrescription(
        prescription.prescriptionId,
        `prescription-${prescription.prescriptionId}.pdf`
      );
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Failed to download prescription.'));
    }
  };

  const openDetails = (prescription: PrescriptionRecord) => {
    setSelectedPrescription(prescription);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Card className="border border-[#dce5f4] bg-white shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-[#1f2a44]">
              {editingPrescriptionId ? 'Edit Prescription' : 'Create Prescription'}
            </CardTitle>
            <p className="text-sm text-slate-500">
              Create prescriptions from confirmed and paid appointments.
            </p>
          </div>
          {editingPrescriptionId ? (
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700"
              onClick={resetForm}
            >
              Cancel Edit
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-[#1f2a44]">Paid Appointments</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {paidAppointments.length ? (
                paidAppointments.map((appointment) => {
                  const isActive = appointment.appointmentId === selectedAppointmentId;
                  const label = appointment.patientName?.trim()
                    ? appointment.patientName
                    : `Patient ${appointment.patientId.slice(0, 6)}`;

                  return (
                    <button
                      key={appointment.appointmentId}
                      type="button"
                      onClick={() => handleSelectAppointment(appointment.appointmentId)}
                      className={`rounded-xl border p-3 text-left transition ${
                        isActive
                          ? 'border-[#315ae7] bg-[#eef4ff]'
                          : 'border-[#dce5f4] bg-white hover:border-[#bfcdf0]'
                      } ${editingPrescriptionId ? 'cursor-not-allowed opacity-70' : ''}`}
                      disabled={Boolean(editingPrescriptionId)}
                    >
                      <p className="text-sm font-semibold text-[#1f2a44]">{label}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatAppointmentDate(appointment.appointmentDate)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatAppointmentTimeRange(appointment.startTime, appointment.endTime)}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-[#dce5f4] bg-[#f8fbff] p-4 text-sm text-slate-500 md:col-span-2">
                  No paid appointments available yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1f2a44]">Medications</p>
              <Button
                type="button"
                variant="outline"
                className="border-[#dce5f4] text-[#2f58db]"
                onClick={handleAddMedication}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Medication
              </Button>
            </div>

            <div className="space-y-3">
              {medications.map((medication, index) => (
                <div
                  key={`medication-${index}`}
                  className="grid gap-2 rounded-xl border border-[#e2eaf6] bg-[#fbfdff] p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
                >
                  <Input
                    placeholder="Medication name"
                    value={medication.name}
                    onChange={(event) =>
                      handleMedicationChange(index, 'name', event.target.value)
                    }
                    className={clearFieldClassName}
                  />
                  <Input
                    placeholder="Dosage"
                    value={medication.dosage}
                    onChange={(event) =>
                      handleMedicationChange(index, 'dosage', event.target.value)
                    }
                    className={clearFieldClassName}
                  />
                  <Input
                    placeholder="Frequency"
                    value={medication.frequency}
                    onChange={(event) =>
                      handleMedicationChange(index, 'frequency', event.target.value)
                    }
                    className={clearFieldClassName}
                  />
                  <Input
                    placeholder="Duration"
                    value={medication.duration}
                    onChange={(event) =>
                      handleMedicationChange(index, 'duration', event.target.value)
                    }
                    className={clearFieldClassName}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-rose-200 px-3 text-rose-600 hover:bg-rose-50"
                    onClick={() => handleRemoveMedication(index)}
                    disabled={medications.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-[#1f2a44]">Clinical Notes</p>
            <Textarea
              placeholder="Add additional prescription notes..."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className={`min-h-24 ${clearFieldClassName}`}
            />
          </div>

          <div className="flex items-center justify-end">
            <Button
              onClick={() => void handleSubmit()}
              disabled={submitting || !selectedAppointmentId || !selectedPatientId}
              className="bg-[#2f58db] text-white hover:bg-[#2446b8]"
            >
              {submitting
                ? 'Saving...'
                : editingPrescriptionId
                  ? 'Update Prescription'
                  : 'Create Prescription'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-[#dce5f4] bg-white shadow-[0_10px_24px_rgba(45,90,180,0.07)]">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-[#1f2a44]">Issued Prescriptions</CardTitle>
            <p className="text-sm text-slate-500">Manage your issued prescriptions.</p>
          </div>
          <Button
            variant="outline"
            className="border-[#dce5f4] text-[#2f58db]"
            onClick={() => void fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCcw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by patient, appointment, medication, or prescription ID"
              className={`pl-9 ${clearFieldClassName}`}
            />
          </label>

          {loading ? (
            <div className="rounded-xl border border-dashed border-[#dce5f4] bg-[#f8fbff] p-5 text-sm text-slate-500">
              Loading prescriptions...
            </div>
          ) : filteredPrescriptions.length ? (
            <div className="space-y-3">
              {filteredPrescriptions.map((prescription) => {
                const relatedAppointment = appointmentById.get(prescription.appointmentId);
                const patientLabel = relatedAppointment?.patientName?.trim()
                  ? relatedAppointment.patientName
                  : `Patient ${prescription.patientId.slice(0, 6)}`;

                return (
                  <article
                    key={prescription.prescriptionId}
                    className="rounded-xl border border-[#e2eaf6] bg-[#fbfdff] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#1f2a44]">{patientLabel}</p>
                        <p className="text-xs text-slate-500">
                          Prescription #{prescription.prescriptionId.slice(0, 8)}
                        </p>
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
                          onClick={() => openDetails(prescription)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 border-[#dce5f4] px-3 text-xs"
                          onClick={() => void handleDownloadPrescription(prescription)}
                        >
                          <Download className="mr-1 h-3.5 w-3.5" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 border-[#dce5f4] px-3 text-xs"
                          onClick={() => handleStartEdit(prescription)}
                        >
                          <Pencil className="mr-1 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="h-8 border-rose-200 px-3 text-xs text-rose-600 hover:bg-rose-50"
                          onClick={() => void handleDeletePrescription(prescription)}
                        >
                          <Trash2 className="mr-1 h-3.5 w-3.5" />
                          Delete
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
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#dce5f4] bg-[#f8fbff] p-5 text-sm text-slate-500">
              No prescriptions found.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prescription Details</DialogTitle>
            <DialogDescription>
              Review medication lines and patient-facing notes before sharing.
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
                  <span className="font-semibold text-[#1f2a44]">Patient ID:</span>{' '}
                  {selectedPrescription.patientId}
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
                  onClick={() => void handleDownloadPrescription(selectedPrescription)}
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
