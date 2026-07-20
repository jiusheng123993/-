import { getStorage, setStorage } from '../../utils/storage';
import type { PetVaccination, VaccineReminder, VaccineReminderStatus } from '../types/memoryBodyTypes';

const STORAGE_KEYS = {
  VACCINATIONS: 'vaccinations',
  VACCINE_REMINDERS: 'vaccine_reminders'
};

export class VaccineTrackerAdapter {
  private userId: string;

  constructor(userId: string) {
    if (!userId) {
      throw new Error('[VaccineTrackerAdapter] userId is required');
    }
    this.userId = userId;
  }

  private userKey(key: string): string {
    return `${key}_${this.userId}`;
  }

  addVaccination(vaccination: PetVaccination): void {
    try {
      const vaccinations = this.getVaccinations();
      vaccinations.push(vaccination);
      setStorage(this.userKey(STORAGE_KEYS.VACCINATIONS), vaccinations);
      this.generateReminders(vaccination);
    } catch (error) {
    }
  }

  getVaccinations(): PetVaccination[] {
    return getStorage<PetVaccination[]>(this.userKey(STORAGE_KEYS.VACCINATIONS)) || [];
  }

  getVaccinationsByPet(petId: string): PetVaccination[] {
    return this.getVaccinations().filter(v => v.petId === petId);
  }

  markCompleted(vaccinationId: string): void {
    try {
      const vaccinations = this.getVaccinations();
      const index = vaccinations.findIndex(v => v.id === vaccinationId);
      if (index !== -1) {
        vaccinations[index].completedDate = new Date().toISOString().split('T')[0];
        vaccinations[index].isOverdue = false;
        setStorage(this.userKey(STORAGE_KEYS.VACCINATIONS), vaccinations);
        this.removeReminder(vaccinationId);
      }
    } catch (error) {
    }
  }

  getReminders(petId?: string): VaccineReminder[] {
    try {
      const reminders = getStorage<VaccineReminder[]>(this.userKey(STORAGE_KEYS.VACCINE_REMINDERS)) || [];
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const updated = reminders.map(r => {
        const scheduledDate = new Date(r.scheduledDate);
        const todayDate = new Date(today);
        const diffDays = Math.ceil((scheduledDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

        let status: VaccineReminderStatus = r.status;
        let isOverdue = r.isOverdue;

        if (r.status !== 'completed' && r.status !== 'skipped') {
          if (diffDays < 0) {
            status = 'overdue';
            isOverdue = true;
          } else if (diffDays === 0) {
            status = 'due';
          } else if (diffDays <= 7) {
            status = 'upcoming';
          }
        }

        return {
          ...r,
          status,
          daysUntilDue: diffDays,
          isOverdue
        };
      });

      setStorage(this.userKey(STORAGE_KEYS.VACCINE_REMINDERS), updated);

      if (petId) {
        return updated.filter(r => r.petId === petId);
      }
      return updated;
    } catch (error) {
      return [];
    }
  }

  getOverdueReminders(petId?: string): VaccineReminder[] {
    return this.getReminders(petId).filter(r => r.isOverdue);
  }

  getUpcomingReminders(petId?: string, withinDays: number = 7): VaccineReminder[] {
    return this.getReminders(petId).filter(r => r.daysUntilDue >= 0 && r.daysUntilDue <= withinDays);
  }

  skipReminder(reminderId: string): void {
    try {
      const reminders = getStorage<VaccineReminder[]>(this.userKey(STORAGE_KEYS.VACCINE_REMINDERS)) || [];
      const index = reminders.findIndex(r => r.id === reminderId);
      if (index !== -1) {
        reminders[index].status = 'skipped';
        setStorage(this.userKey(STORAGE_KEYS.VACCINE_REMINDERS), reminders);
      }
    } catch (error) {
    }
  }

  private generateReminders(vaccination: PetVaccination): void {
    const reminders = getStorage<VaccineReminder[]>(this.userKey(STORAGE_KEYS.VACCINE_REMINDERS)) || [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const scheduledDate = new Date(vaccination.scheduledDate);
    const diffDays = Math.ceil((scheduledDate.getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));

    let status: VaccineReminderStatus = 'upcoming';
    let isOverdue = false;

    if (diffDays < 0) {
      status = 'overdue';
      isOverdue = true;
    } else if (diffDays === 0) {
      status = 'due';
    }

    const existingIndex = reminders.findIndex(r => r.vaccinationId === vaccination.id);
    const reminder: VaccineReminder = {
      id: `reminder_${vaccination.id}`,
      petId: vaccination.petId,
      vaccinationId: vaccination.id,
      vaccineName: vaccination.vaccineName,
      scheduledDate: vaccination.scheduledDate,
      status,
      daysUntilDue: diffDays,
      isOverdue
    };

    if (existingIndex !== -1) {
      reminders[existingIndex] = reminder;
    } else {
      reminders.push(reminder);
    }

    setStorage(this.userKey(STORAGE_KEYS.VACCINE_REMINDERS), reminders);
  }

  private removeReminder(vaccinationId: string): void {
    const reminders = getStorage<VaccineReminder[]>(this.userKey(STORAGE_KEYS.VACCINE_REMINDERS)) || [];
    const index = reminders.findIndex(r => r.vaccinationId === vaccinationId);
    if (index !== -1) {
      reminders[index].status = 'completed';
      reminders[index].isOverdue = false;
      setStorage(this.userKey(STORAGE_KEYS.VACCINE_REMINDERS), reminders);
    }
  }

  clear(): void {
    setStorage(this.userKey(STORAGE_KEYS.VACCINATIONS), []);
    setStorage(this.userKey(STORAGE_KEYS.VACCINE_REMINDERS), []);
  }
}
