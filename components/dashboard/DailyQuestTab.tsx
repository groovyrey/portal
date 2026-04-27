'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, CheckCircle, XCircle, Loader2, BrainCircuit, Monitor, Calculator, 
  FlaskConical, History, Map, Gamepad2, Palette, LayoutGrid, Zap, GraduationCap,
  ArrowRight, Sparkles, BookOpenCheck, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useStudent } from '@/lib/hooks';
import QuestMarkdown from '@/components/shared/QuestMarkdown';
import { getPHDate } from '@/lib/utils';

interface TriviaQuestion {
  category: string;
  type: "multiple" | "boolean" | "open";
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  userAnswer?: string;
  isCorrect?: boolean;
  feedback?: string;
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

const DIFFICULTY_CONFIG = [
  { id: 'easy', name: 'Easy', multiplier: 1, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'medium', name: 'Medium', multiplier: 1.5, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'hard', name: 'Hard', multiplier: 2, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { id: 'extreme', name: 'Extreme', multiplier: 3, color: 'text-purple-600', bg: 'bg-purple-600/10', border: 'border-purple-600/20' },
];

interface QuestStats {
  gainedExp: number;
  newExp: number;
  newLevel: number;
  levelUp: boolean;
  totalQuests: number;
  streak: number;
  isFeatured: boolean;
  isCapped: boolean;
}

export default function DailyQuestTab() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [openAnswer, setOpenAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState<boolean | null>(null);
  const [evaluationFeedback, setEvaluationFeedback] = useState<string | null>(null);
  const [questStats, setQuestStats] = useState<QuestStats | null>(null);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [statsUpdated, setStatsUpdated] = useState(false);
  const [allQuests, setAllQuests] = useState<any[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  const { student } = useStudent();
  const totalQuestions = questions.length || 10;

  const academicCategories = (student?.schedule || [])
    .map(s => s.description)
    .filter(desc => desc && desc.length > 5 && !desc.includes('BREAK') && !desc.includes('LUNCH'))
    .filter((value, index, self) => self.indexOf(value) === index) // Unique
    .map(name => ({ id: `acad-${name}`, name, icon: GraduationCap, isAcademic: true }));

  const allCategories = [...CATEGORIES, ...academicCategories];

  const getDifficulty = () => {
    return selectedDifficulty;
  };

  useEffect(() => {
    if (currentStats?.level) {
        if (currentStats.level <= 3) setSelectedDifficulty('easy');
        else if (currentStats.level <= 10) setSelectedDifficulty('medium');
        else if (currentStats.level <= 20) setSelectedDifficulty('hard');
        else setSelectedDifficulty('extreme');
    }
  }, [currentStats?.level]);

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
      setAllQuests(data.quests || []);
      
      if (data.activeQuest) {
        setQuestions(data.activeQuest.questions);
        setCurrentIndex(data.activeQuest.current_index);
        setScore(data.activeQuest.score);
        setIsCompleted(!!data.activeQuest.is_completed);
        setStatsUpdated(!!data.activeQuest.stats_updated);
        setCurrentCategory(data.activeQuest.category);
        
        if (data.activeQuest.questions && data.activeQuest.questions[data.activeQuest.current_index]) {
          prepareQuestion(data.activeQuest.questions[data.activeQuest.current_index]);
        } else if (data.activeQuest.questions && data.activeQuest.current_index >= data.activeQuest.questions.length) {
          setIsCompleted(true);
        }
      } else if (data.completedTodayQuest) {
        setQuestions(data.completedTodayQuest.questions || []);
        setScore(data.completedTodayQuest.score || 0);
        setIsCompleted(true);
        setCurrentCategory(data.completedTodayQuest.category);
        setStatsUpdated(!!data.completedTodayQuest.stats_updated);
      } else {
        setIsCompleted(false);
        setQuestions([]);
        setCurrentCategory(null);
      }
    } catch (e) {
      toast.error("Failed to load quest status");
    } finally {
      setLoading(false);
    }
  };

  const startQuest = async (category: string) => {
    // Check local cooldown state
    const existing = allQuests.find(q => q.category === category);
    if (existing) {
      const today = getPHDate();
      const isSameDay = existing.quest_date === today;
      if (isSameDay && existing.is_completed) {
        toast.error(`"${category}" has already been completed today. Come back tomorrow!`);
        return;
      }
    }

    const difficulty = getDifficulty();
    setLoading(true);
    try {
      const res = await fetch('/api/quests/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category, 
          difficulty,
          force: false 
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Failed to start quest");
        return;
      }

      if (data.questions) {
        setQuestions(data.questions);
        setCurrentIndex(data.current_index || 0);
        setScore(data.score || 0);
        setIsCompleted(!!data.is_completed);
        setStatsUpdated(!!data.stats_updated);
        setCurrentCategory(category);
        prepareQuestion(data.questions[data.current_index || 0]);
      }
    } catch (e) {
      toast.error("Failed to start quest");
    } finally {
      setLoading(false);
    }
  };
  const prepareQuestion = (question: TriviaQuestion) => {
    // Note: AI cleanup - remove any accidentally generated markers like ">" or "*"
    const cleanCorrect = question.correct_answer.replace(/^[>*\-\s]+|["']/g, '').trim();
    const cleanIncorrect = (question.incorrect_answers || []).map(ans => 
      ans.replace(/^[>*\-\s]+|["']/g, '').trim()
    );
    
    question.correct_answer = cleanCorrect;
    question.incorrect_answers = cleanIncorrect;

    if (question.type === 'open') {
      setShuffledAnswers([]);
      setOpenAnswer("");
    } else if (question.type === 'boolean') {
      // Force True/False for boolean types if they are missing or mangled
      setShuffledAnswers(['True', 'False']);
      setOpenAnswer("");
    } else {
      const incorrect = question.incorrect_answers || [];
      const all = [...incorrect, question.correct_answer].sort(() => Math.random() - 0.5);
      setShuffledAnswers(all);
    }
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsCurrentCorrect(null);
    setEvaluationFeedback(null);
  };

  const handleAnswer = async (answer: string) => {
    if (isAnswered || isEvaluating) return;
    
    const currentQuestion = questions[currentIndex];
    let isCorrect = false;
    let feedback = "";

    if (currentQuestion.type === 'open') {
      setIsEvaluating(true);
      try {
        const res = await fetch('/api/quests/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentQuestion.question,
            userAnswer: answer,
            correctAnswer: currentQuestion.correct_answer
          })
        });
        const evalResult = await res.json();
        isCorrect = evalResult.isCorrect;
        feedback = evalResult.feedback || (isCorrect ? "Perfect logic!" : "Not quite right.");
        setEvaluationFeedback(feedback);
      } catch (e) {
        // Fallback to simple string match if AI fails
        isCorrect = answer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();
        feedback = isCorrect ? "Perfect match!" : `Expected: ${currentQuestion.correct_answer}`;
        setEvaluationFeedback(feedback);
      } finally {
        setIsEvaluating(false);
      }
    } else if (currentQuestion.type === 'boolean') {
      // Normalize both for comparison
      const normalizedUser = answer.toLowerCase().trim();
      const normalizedCorrect = (currentQuestion.correct_answer || "").toLowerCase().trim();
      
      isCorrect = normalizedUser === normalizedCorrect;
      feedback = isCorrect ? "Correct assessment!" : `Incorrect. The correct answer was: ${currentQuestion.correct_answer || 'Unknown'}`;
      setEvaluationFeedback(feedback);
    } else {
      isCorrect = answer.trim() === (currentQuestion.correct_answer || "").trim();
      feedback = isCorrect ? "Correct answer selected!" : `Incorrect. The correct answer was: ${currentQuestion.correct_answer || 'Unknown'}`;
      setEvaluationFeedback(feedback);
    }

    // Save user answer and result for review mode
    const updatedQuestions = [...questions];
    updatedQuestions[currentIndex] = {
      ...currentQuestion,
      userAnswer: answer,
      isCorrect,
      feedback
    };
    setQuestions(updatedQuestions);

    setIsCurrentCorrect(isCorrect);
    setIsAnswered(true);
    setSelectedAnswer(answer);
    
    const newScore = isCorrect ? score + 1 : score;
    const nextIndex = currentIndex + 1;
    const completed = nextIndex >= totalQuestions;

    if (isCorrect) {
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
          isCompleted: completed,
          category: currentCategory,
          questions: updatedQuestions // Save the user's answers too
        })
      });
    } catch (e) {
      console.error("Failed to save progress");
    }
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    const completed = nextIndex >= totalQuestions;

    if (completed) {
      setIsCompleted(true);
      updateOverallStats(score);
    } else {
      setCurrentIndex(nextIndex);
      if (questions[nextIndex]) {
        prepareQuestion(questions[nextIndex]);
      }
    }
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
    if (!student?.id || !currentCategory) return;
    const difficulty = getDifficulty();
    try {
      const res = await fetch('/api/quests/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: finalScore,
          difficulty,
          studentId: student.id,
          category: currentCategory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQuestStats(data);
        if (data.levelUp) {
            toast.success(`LEVEL UP! You reached Level ${data.newLevel}!`, { icon: '🎊' });
        }
        if (data.isFeatured) {
            toast.success("FEATURED BONUS! 2x EXP granted!", { icon: '✨' });
        }
        if (data.isCapped) {
            toast.info("Daily EXP Cap reached. Some EXP was reduced.", { icon: '🛑' });
        }
        // Refresh global stats after update
        fetchCurrentStats();
      }
    } catch (e) {
      console.error("Stats update failed");
    }
  };

  const getCategoryStatus = (category: string) => {
    const quest = allQuests.find(q => q.category === category);
    const isFeatured = category === currentStats?.featuredCategory;
    const today = getPHDate();
    
    if (!quest) return { status: 'available', isFeatured };
    
    const isSameDay = quest.quest_date === today;

    if (!isSameDay) return { status: 'available', isFeatured };
    
    if (!quest.is_completed) return { status: 'in-progress', isFeatured };
    
    return { status: 'cooldown', hoursLeft: 'Midnight', isFeatured };
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
    </div>
  );

  if (isReviewMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Quest Review</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{currentCategory}</p>
          </div>
          <button 
            onClick={() => setIsReviewMode(false)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <XCircle className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={i} className={`p-4 rounded-lg border ${q.isCorrect ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-muted/50">Q{i+1}</span>
                {q.isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                )}
              </div>
              <h4 className="font-bold mb-3 leading-tight">{q.question}</h4>
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Your Answer:</div>
                <div className={`text-sm font-bold ${q.isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>{q.userAnswer || 'No answer'}</div>
                {!q.isCorrect && (
                  <>
                    <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-2">Correct Answer/Guideline:</div>
                    <div className="text-sm font-bold text-emerald-700">{q.correct_answer}</div>
                  </>
                )}
                {q.feedback && (
                  <div className="mt-3 p-3 rounded-lg bg-white/50 border border-current/10 italic text-[11px] font-medium leading-relaxed">
                    "AI: <QuestMarkdown content={q.feedback} className="inline" />"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button 
            onClick={() => setIsReviewMode(false)}
            className="w-full py-4 rounded-lg bg-foreground text-background font-black uppercase tracking-wider flex items-center justify-center gap-2"
        >
            Close Review
        </button>
      </div>
    );
  }

    if (isCompleted) {
    const diffInfo = DIFFICULTY_CONFIG.find(d => d.id === selectedDifficulty) || DIFFICULTY_CONFIG[1];
    const stats = questStats || { 
        newLevel: currentStats?.level || 1, 
        newExp: currentStats?.exp || 0,
        gainedExp: Math.floor(score * 20 * diffInfo.multiplier)
    };

    return (
      <div className="text-center py-10 space-y-8 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Trophy className="h-16 w-16 text-primary mx-auto" />
        </motion.div>
        
        <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight">Quest Completed!</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Masterfully Conquered</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-4 rounded-lg text-center border border-border/50">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Final Score</p>
                <div className="text-2xl font-black text-primary">{score} / {totalQuestions}</div>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg text-center border border-border/50">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">EXP Gained</p>
                <div className={`text-xl font-black uppercase ${statsUpdated && !questStats ? 'text-muted-foreground' : 'text-emerald-500'}`}>
                    {statsUpdated && !questStats ? 'Daily Limit' : `+${stats.gainedExp}`}
                </div>
                {selectedDifficulty !== 'medium' && (
                  <div className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${diffInfo.color}`}>
                    {diffInfo.name} ({diffInfo.multiplier}x)
                  </div>
                )}
                {questStats?.isFeatured && <span className="text-[8px] font-black text-orange-500 uppercase">✨ 2x Featured Bonus</span>}
                {questStats?.isCapped && <span className="text-[8px] font-black text-rose-500 uppercase">🛑 Daily Cap Applied</span>}
            </div>
        </div>

        {stats && (
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 relative overflow-hidden text-left">
                <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
                    <motion.div 
                        className="h-full bg-primary" 
                        initial={{ width: 0 }}
                        animate={{ width: `${((stats.newExp - (Math.pow(stats.newLevel - 1, 2) * 100)) / ((Math.pow(stats.newLevel, 2) * 100) - (Math.pow(stats.newLevel - 1, 2) * 100))) * 100}%` }}
                        transition={{ duration: 1.5, ease: "linear" }}
                    />
                </div>
                <div className="flex justify-between items-end">
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-wider text-primary">Current Level</p>
                        <div className="text-xl font-black">LVL {stats.newLevel}</div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Progress to LVL {stats.newLevel + 1}</p>
                        <div className="text-base font-bold">{(stats.newExp || 0).toLocaleString()} / {(Math.pow(stats.newLevel, 2) * 100).toLocaleString()} <span className="text-[10px] uppercase">EXP</span></div>
                    </div>
                </div>
            </div>
        )}

        <div className="flex flex-col gap-3">
            <button 
                onClick={() => setIsReviewMode(true)}
                className="w-full py-4 rounded-lg border border-primary/20 bg-primary/5 text-primary font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors"
            >
                <BookOpenCheck className="h-5 w-5" />
                Review Your Answers
            </button>
            <button 
                onClick={() => {
                  setIsCompleted(false);
                  fetchDailyStatus();
                }}
                disabled={isCompleted && !questions.length} // Fallback check
                className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                Back to Categories
            </button>
            {(isCompleted && questions.length > 0) && (
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mt-2">
                Daily limit reached. See you tomorrow!
              </p>
            )}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
            <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Daily Quest</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select your challenge</p>
            </div>
            {currentStats && (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                      <div className="text-xs font-black text-orange-500 uppercase tracking-wider flex items-center gap-1 justify-end">
                        <Trophy className="h-3 w-3" />
                        Streak: {currentStats.streak}
                      </div>
                      <div className="text-[10px] font-black text-primary uppercase tracking-wider flex items-center gap-1 justify-end">
                        <Zap className="h-3 w-3 fill-primary" />
                        LVL {currentStats.level}
                      </div>
                  </div>
                </div>
            )}
        </div>

        {/* Difficulty Selector */}
        <div className="px-2 space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Challenge Difficulty</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIFFICULTY_CONFIG.map((diff) => (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  selectedDifficulty === diff.id
                    ? `${diff.bg} ${diff.border}`
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-wider ${selectedDifficulty === diff.id ? diff.color : 'text-muted-foreground'}`}>
                  {diff.name}
                </span>
                <span className={`text-[8px] font-bold uppercase tracking-wider mt-0.5 ${selectedDifficulty === diff.id ? diff.color : 'text-muted-foreground/50'}`}>
                  {diff.multiplier}x EXP
                </span>
              </button>
            ))}
          </div>
        </div>

        {academicCategories.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">Academic Subjects</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {academicCategories.map(cat => {
                const status = getCategoryStatus(cat.name);
                const isCooldown = status.status === 'cooldown';
                return (
                  <button 
                    key={cat.id} 
                    onClick={() => startQuest(cat.name)} 
                    disabled={isCooldown}
                    className={`bg-muted/10 p-6 rounded-lg border transition-all group flex flex-col items-center gap-3 relative overflow-hidden ${
                      isCooldown 
                        ? 'opacity-50 grayscale border-border cursor-not-allowed' 
                        : 'border-primary/20 bg-primary/5 hover:border-primary/50'
                    }`}
                  >
                    {status.isFeatured && (
                      <div className="absolute top-0 right-0 bg-orange-500 text-[8px] font-black text-white px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                        Featured
                      </div>
                    )}
                    <cat.icon className={`h-8 w-8 transition-colors ${isCooldown ? 'text-muted-foreground' : 'text-primary'}`} />
                    <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-center">{cat.name}</span>
                    {isCooldown && <span className="text-[8px] font-black text-rose-500">Reset at Midnight</span>}
                    {status.status === 'in-progress' && <span className="text-[8px] font-black text-amber-500">In Progress</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">General Categories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => {
              const status = getCategoryStatus(cat.name);
              const isCooldown = status.status === 'cooldown';
              return (
                <button 
                  key={cat.id} 
                  onClick={() => startQuest(cat.name)} 
                  disabled={isCooldown}
                  className={`bg-muted/10 p-6 rounded-lg border transition-all group flex flex-col items-center gap-3 relative overflow-hidden ${
                    isCooldown 
                      ? 'opacity-50 grayscale border-border cursor-not-allowed' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {status.isFeatured && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-[8px] font-black text-white px-2 py-0.5 rounded-bl-lg uppercase tracking-wider flex items-center gap-1">
                      Featured
                    </div>
                  )}
                  <cat.icon className={`h-8 w-8 transition-colors ${isCooldown ? 'text-muted-foreground' : 'text-muted-foreground group-hover:text-primary'}`} />
                  <span className="font-bold text-[10px] sm:text-xs uppercase tracking-wider text-center">{cat.name}</span>
                  {isCooldown && <span className="text-[8px] font-black text-rose-500">Reset at Midnight</span>}
                  {status.status === 'in-progress' && <span className="text-[8px] font-black text-amber-500">In Progress</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  if (!currentQ) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          <span className="text-sm font-black uppercase tracking-wider">Question {currentIndex + 1}/{totalQuestions}</span>
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase">Score: {score}</div>
      </div>

      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary" animate={{ width: `${(currentIndex / totalQuestions) * 100}%` }} />
      </div>

      <div className="bg-card p-6 sm:p-8 rounded-lg border border-border/50 space-y-8">
        <QuestMarkdown content={currentQ.question} className="text-xl sm:text-2xl font-bold text-center leading-tight flex justify-center" />
        
        {currentQ.type === 'open' ? (
          <div className="space-y-4">
            <input 
              type="text"
              value={openAnswer}
              onChange={(e) => setOpenAnswer(e.target.value)}
              disabled={isAnswered || isEvaluating}
              placeholder="Type your answer here..."
              className="w-full p-4 rounded-lg bg-background border border-border font-bold focus:border-primary outline-none transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && openAnswer.trim() && !isAnswered) {
                  handleAnswer(openAnswer);
                }
              }}
            />
            {!isAnswered && (
              <button
                onClick={() => handleAnswer(openAnswer)}
                disabled={isAnswered || isEvaluating || !openAnswer.trim()}
                className="w-full py-4 rounded-lg bg-primary text-primary-foreground font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isEvaluating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Answer'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {shuffledAnswers.map((ans, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(ans)}
                disabled={isAnswered}
                className={`p-4 rounded-lg border text-left font-bold transition-all ${
                  isAnswered 
                    ? ans === currentQ.correct_answer 
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-600'
                      : selectedAnswer === ans ? 'bg-rose-500/10 border-rose-500/50 text-rose-600' : 'opacity-40 grayscale border-border'
                    : 'border-border hover:border-primary hover:bg-primary/5'
                }`}
              >
                <QuestMarkdown content={ans} />
              </button>
            ))}
          </div>
        )}

        {isAnswered && (
            <div 
                className={`p-4 rounded-lg border flex flex-col gap-2 ${
                    isCurrentCorrect
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700'
                    : 'bg-rose-500/5 border-rose-500/20 text-rose-700'
                }`}
            >
                <div className="flex items-center gap-2">
                    {isCurrentCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span className="text-[10px] font-black uppercase tracking-wider">
                        {isCurrentCorrect ? 'Accepted' : 'Rejected'}
                    </span>
                </div>
                <div className="text-sm font-medium leading-relaxed">
                    "<QuestMarkdown content={evaluationFeedback || (isCurrentCorrect ? 'Correct!' : 'Incorrect.')} className="inline" />"
                </div>
            </div>
        )}

        {isAnswered && !isEvaluating && (
          <button
            onClick={nextQuestion}
            className="w-full py-4 rounded-lg bg-foreground text-background font-black uppercase tracking-wider flex items-center justify-center gap-2"
          >
            {currentIndex + 1 >= totalQuestions ? 'Finish Quest' : 'Continue'}
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

