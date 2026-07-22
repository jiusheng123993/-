import { getStorage, setStorage } from '../../utils/storage';

const STORAGE_KEYS = {
  HEALTH_ENTRIES: 'health_entries',
  MEMORY_INDEX: 'memory_index',
  SCHEDULE_EVENTS: 'schedule_events'
};

export class MiniProgramMemoryBodyStore {
  clearHealthEntries(): void {
    setStorage(STORAGE_KEYS.HEALTH_ENTRIES, []);
    setStorage(STORAGE_KEYS.MEMORY_INDEX, {});
  }

  clearAll(): void {
    setStorage(STORAGE_KEYS.HEALTH_ENTRIES, []);
    setStorage(STORAGE_KEYS.MEMORY_INDEX, {});
    setStorage(STORAGE_KEYS.SCHEDULE_EVENTS, []);
  }
}
