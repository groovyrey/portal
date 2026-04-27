import { 
  migrateCommunity, 
  migrateNotifications, 
  migrateActivityLogs, 
  migrateStudentStats, 
  migrateDailyQuests,
  migrateIncidentReports
} from './db-migrate';

let initializationPromise: Promise<void> | null = null;

export async function initDatabase() {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    // Firestore is schema-less, so no explicit initialization is strictly required.
    // For Turso (SQLite), we ensure tables exist.
    try {
      // Run migrations in sequence to avoid potential lock issues, 
      // or at least grouped logically.
      await migrateCommunity();
      await migrateNotifications();
      await migrateActivityLogs();
      await migrateStudentStats();
      await migrateDailyQuests();
      await migrateIncidentReports();
      
      console.log('[DB-Init] Turso migrations completed.');
    } catch (error) {
      console.error('[DB-Init] Migration error:', error);
      // Reset promise so we can try again on next call if it failed
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}
