'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  RefreshCw, 
  DatabaseZap, 
  Plus, 
  Check, 
  Trash2, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleTask } from '@/types/g-space';
import Skeleton from '@/components/ui/Skeleton';
import Modal from '@/components/ui/Modal';

interface TaskTabProps {
  linkedEmail: string | null;
  isLinking: boolean;
  isFetching: boolean;
  googleTasks: GoogleTask[];
  handleGoogleVerify: () => void;
  setIsAddingTask: (val: boolean) => void;
  handleToggleTaskStatus: (task: GoogleTask) => void;
  handleDeleteTask: (taskId: string) => void;
}

export default function TaskTab({
  linkedEmail,
  isLinking,
  isFetching,
  googleTasks,
  handleGoogleVerify,
  setIsAddingTask,
  handleToggleTaskStatus,
  handleDeleteTask
}: TaskTabProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (taskToDelete) {
      handleDeleteTask(taskToDelete);
      setTaskToDelete(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Google Tasks</h2>
          <p className="text-xs text-muted-foreground font-medium">Syncing {googleTasks.length} tasks from your Google Account.</p>
        </div>
        <button 
          onClick={() => setIsAddingTask(true)}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-full text-xs font-bold shadow-sm hover:opacity-90 transition-all shadow-primary/10"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isFetching && googleTasks.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)
        ) : googleTasks.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-muted/10 border border-dashed border-border rounded-3xl">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-muted-foreground">Queue Empty</h3>
            <p className="text-[11px] text-muted-foreground/60 mt-1">Add tasks to see them here.</p>
          </div>
        ) : (
          googleTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            return (
              <div 
                key={task.id}
                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                className={`group bg-card border border-border/50 rounded-3xl p-5 hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer relative flex flex-col h-fit ${task.status === 'completed' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleToggleTaskStatus(task); }}
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.status === 'completed' 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'border-border/60 hover:border-primary'
                    }`}
                  >
                    {task.status === 'completed' && <Check className="h-3 w-3 stroke-[4]" />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setTaskToDelete(task.id); }}
                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all"
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                
                <h4 className={`text-xs font-bold leading-relaxed ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''} ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {task.title}
                </h4>
                
                {task.notes && (
                  <p className={`text-[10px] text-muted-foreground mt-2 leading-relaxed ${isExpanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
                    {task.notes}
                  </p>
                )}
                
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase">
                    <Clock className="h-3 w-3" />
                    {new Date(task.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        title={
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-5 w-5" />
            <span className="font-bold">Confirm Deletion</span>
          </div>
        }
        maxWidth="max-w-sm"
      >
        <div className="p-6 space-y-6">
          <p className="text-sm font-medium text-muted-foreground leading-relaxed">
            Are you sure you want to delete this task? This action is permanent and cannot be undone.
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setTaskToDelete(null)}
              className="flex-1 py-2.5 text-xs font-bold text-muted-foreground bg-accent hover:bg-accent/80 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all active:scale-95 shadow-rose-600/20"
            >
              Delete Task
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
