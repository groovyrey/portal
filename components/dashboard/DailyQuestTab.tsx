'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, CheckCircle, XCircle, Loader2, BrainCircuit, Monitor, Calculator, 
  FlaskConical, History, Map, Gamepad2, Palette, LayoutGrid, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useStudent } from '@/lib/hooks';

interface TriviaQuestion {
  category: string;
  type: "multiple" | "boolean";
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

const TOTAL_QUESTIONS = 10;

const CATEGORIES = [
  { id: 'General', name: 'General', icon: LayoutGrid },
  { id: 'Computers', name: 'Computers', icon: Monitor },
  { id: 'Math', name: 'Math', icon: Calculator },
  { id: 'Science', name: 'Science', icon: FlaskConical },
  { id: 'History', name: 'History', icon: History },
  { id: 'Geography', name: 'Geography', icon: Map },
  { id: 'Sports', name: 'Sports', icon: Trophy },
  { id: 'Gaming', name: 'Gaming', icon: Gamepad2 },
  { id: 'Art', name: 'Art', icon: Palette },
];

interface QuestStats {
  gainedExp: number;
  newExp: number;
  newLevel: number;
  levelUp: boolean;
  totalQuests: number;
}

export default function DailyQuestTab() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [questStats, setQuestStats] = useState<QuestStats | null>(null);
  const [currentStats, setCurrentStats] = useState<any>(null);

  const { student } = useStudent();

  useEffect(() => {
    fetchDailyStatus();
    fetchCurrentStats();
  }, [student?.id]);

  const fetchCurrentStats = async () => {
    if (!student?.id) return;
    try {
      const res = await fetch(`/api/quests/stats?studentId=${student.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch current stats");
    }
  };

  const fetchDailyStatus = async () => {
    if (!student?.id) return;
    try {
      const res = await fetch('/api/quests/daily');
      const data = await res.json();
      if (!data.is_new) {
        setQuestions(data.questions);
        setCurrentIndex(data.current_index);
        setScore(data.score);
        setIsCompleted(!!data.is_completed);
        
        if (data.is_completed) {
            fetchCurrentStats();
        } else if (data.questions && data.questions[data.current_index]) {
          prepareQuestion(data.questions[data.current_index]);
        }
      }
    } catch (e) {
      toast.error("Failed to load quest status");
    } finally {
      setLoading(false);
    }
  };

  const startQuest = async (category: string, difficulty: string = 'medium') => {
    setLoading(true);
    try {
      // Free tier: only one generation allowed unless system is new
      const forceNew = isCompleted;

      let excludedQuestions = [];
      try {
        const localHistory = localStorage.getItem('quest_history_local');
        excludedQuestions = localHistory ? JSON.parse(localHistory) : [];
      } catch (e) {
        console.error("Failed to load local history");
      }

      const res = await fetch('/api/quests/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category, 
          difficulty,
          excludedQuestions,
          force: forceNew 
        })
      });
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setScore(0);
        setIsCompleted(false);
        prepareQuestion(data.questions[0]);
      }
    } catch (e) {
      toast.error("Failed to start quest");
    } finally {
      setLoading(false);
    }
  };

  const prepareQuestion = (question: TriviaQuestion) => {
    const all = [...question.incorrect_answers, question.correct_answer].sort(() => Math.random() - 0.5);
    setShuffledAnswers(all);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  const handleAnswer = async (answer: string) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedAnswer(answer);
    
    const currentQuestion = questions[currentIndex];
    const correct = answer === currentQuestion.correct_answer;
    const newScore = correct ? score + 1 : score;
    const nextIndex = currentIndex + 1;
    const completed = nextIndex >= TOTAL_QUESTIONS;

    if (correct) {
      toast.success("Correct!");
      saveToLocalHistory(currentQuestion.question);
    } else {
      toast.error("Incorrect!");
    }

    setScore(newScore);

    try {
      await fetch('/api/quests/daily', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentIndex: nextIndex,
          score: newScore,
          isCompleted: completed
        })
      });
    } catch (e) {
      console.error("Failed to save progress");
    }

    setTimeout(() => {
      if (completed) {
        setIsCompleted(true);
        updateOverallStats(newScore);
      } else {
        setCurrentIndex(nextIndex);
        if (questions[nextIndex]) {
          prepareQuestion(questions[nextIndex]);
        }
      }
    }, 1500);
  };

  const saveToLocalHistory = (questionText: string) => {
    try {
      const historyJson = localStorage.getItem('quest_history_local');
      let history: string[] = historyJson ? JSON.parse(historyJson) : [];
      if (!history.includes(questionText)) {
        history.unshift(questionText);
        history = history.slice(0, 50);
        localStorage.setItem('quest_history_local', JSON.stringify(history));
      }
    } catch (e) {
      console.error("Local history save failed", e);
    }
  };

  const updateOverallStats = async (finalScore: number) => {
    if (!student?.id) return;
    try {
      const res = await fetch('/api/quests/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: finalScore,
          difficulty: 'medium',
          studentId: student.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQuestStats(data);
        if (data.levelUp) {
            toast.success(`LEVEL UP! You reached Level ${data.newLevel}!`, { icon: '🎊' });
        }
      }
    } catch (e) {
      console.error("Stats update failed");
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  if (isCompleted) {
    const stats = questStats || { 
        newLevel: currentStats?.level || 1, 
        newExp: currentStats?.exp || 0,
        gainedExp: score * 20 
    };

    return (
      <div className="text-center py-10 space-y-8 max-w-md mx-auto">
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
            <Trophy className="h-20 w-20 text-primary mx-auto" />
        </motion.div>
        
        <div className="space-y-2">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Quest Completed!</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Masterfully Conquered</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="surface-neutral p-6 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Final Score</p>
                <div className="text-3xl font-black text-primary">{score} / {TOTAL_QUESTIONS}</div>
            </div>
            <div className="surface-neutral p-6 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">EXP Gained</p>
                <div className="text-3xl font-black text-emerald-500">+{questStats?.gainedExp || (score * 20)}</div>
            </div>
        </div>

        {stats && (
            <div className="surface-neutral p-6 rounded-2xl border border-primary/20 bg-primary/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
                    <motion.div 
                        className="h-full bg-primary shadow-[0_0_10px_rgba(37,99,235,0.5)]" 
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.newExp % 100)}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </div>
                <div className="flex justify-between items-end">
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Current Level</p>
                        <div className="text-2xl font-black italic">LVL {stats.newLevel}</div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Experience</p>
                        <div className="text-lg font-bold">{(stats.newExp || 0).toLocaleString()} <span className="text-[10px] uppercase">EXP</span></div>
                    </div>
                </div>
            </div>
        )}

        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">New quest available at 12:00 AM</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
            <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Daily Quest</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select your challenge</p>
            </div>
            {currentStats && (
                <div className="text-right">
                    <div className="text-xs font-black text-primary uppercase tracking-widest">Level {currentStats.level}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{currentStats.exp} EXP</div>
                </div>
            )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => startQuest(cat.name)} className="surface-neutral p-6 rounded-2xl border border-border/50 hover:border-primary/50 transition-all group flex flex-col items-center gap-3">
              <cat.icon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="font-bold text-xs uppercase tracking-widest">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          <span className="text-sm font-black uppercase tracking-widest">Question {currentIndex + 1}/10</span>
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase">Score: {score}</div>
      </div>

      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary" animate={{ width: `${(currentIndex / TOTAL_QUESTIONS) * 100}%` }} />
      </div>

      <div className="surface-neutral p-8 rounded-2xl border border-border/50 space-y-8">
        <h3 className="text-xl sm:text-2xl font-bold text-center leading-tight">{currentQ.question}</h3>
        <div className="grid gap-3">
          {shuffledAnswers.map((ans, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(ans)}
              disabled={isAnswered}
              className={`p-5 rounded-xl border text-left font-bold transition-all ${
                isAnswered 
                  ? ans === currentQ.correct_answer 
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600'
                    : selectedAnswer === ans ? 'bg-rose-500/10 border-rose-500/50 text-rose-600' : 'opacity-40 grayscale border-border'
                  : 'border-border hover:border-primary hover:bg-primary/5'
              }`}
            >
              {ans}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
