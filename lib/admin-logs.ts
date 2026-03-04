import { db } from './db';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

export interface AdminLog {
  id?: string;
  timestamp: any;
  adminId: string;
  adminName: string;
  targetId: string;
  targetName?: string;
  action: string;
  details: string;
}

export async function logAdminAction(data: Omit<AdminLog, 'id' | 'timestamp'>) {
  try {
    const logsRef = collection(db, 'admin_logs');
    await addDoc(logsRef, {
      ...data,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

export async function getAdminLogs(maxCount: number = 50): Promise<AdminLog[]> {
  try {
    const logsRef = collection(db, 'admin_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxCount));
    const querySnap = await getDocs(q);
    
    const logs: AdminLog[] = [];
    querySnap.forEach(doc => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        timestamp: data.timestamp,
        adminId: data.adminId,
        adminName: data.adminName,
        targetId: data.targetId,
        targetName: data.targetName,
        action: data.action,
        details: data.details,
      });
    });
    
    return logs;
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return [];
  }
}
