import { 
  migratePortalTables,
  migrateCommunity, 
  migrateNotifications, 
  migrateActivityLogs, 
  migrateStudentStats, 
  migrateDailyQuests,
  migrateIncidentReports,
  migrateAdminLogs,
  migrateCronRuns
} from './db-migrate';

let initializationPromise: Promise<void> | null = null;

export async function initDatabase() {
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      // Run migrations in sequence
      await migratePortalTables();
      await migrateCommunity();
      await migrateNotifications();
      await migrateActivityLogs();
      await migrateStudentStats();
      await migrateDailyQuests();
      await migrateIncidentReports();
      await migrateAdminLogs();
      await migrateCronRuns();
      
      console.log('[DB-Init] Turso migrations completed.');
    } catch (error) {
      console.error('[DB-Init] Migration error:', error);
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}
