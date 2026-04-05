'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, CheckCircle, XCircle, Loader2, BrainCircuit, Monitor, Calculator, 
  FlaskConical, History, Map, Gamepad2, Palette, LayoutGrid, Zap, GraduationCap,
  RefreshCcw, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useStudent } from '@/lib/hooks';
import QuestMarkdown from '@/components/shared/QuestMarkdown';

interface TriviaQuestion {
  category: string;
  type: "multiple" | "boolean" | "open";
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

const DIFFICULTY_CONFIG = [
  { id: 'easy', name: 'Easy', multiplier: 1, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { id: 'medium', name: 'Medium', multiplier: 1.5, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { id: 'hard', name: 'Hard', multiplier: 2, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  { id: 'extreme', name: 'Extreme', multiplier: 3, color: 'text-purple-600', bg: 'bg-purple-600/10', border: 'border-purple-600/20' },
];

export default function TestQuestTab() {
  const [loading, setLoading] = useState(false);
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
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  const { student } = useStudent();

  useEffect(() => {
    if (currentStats?.level) {
        if (currentStats.level <= 3) setSelectedDifficulty('easy');
        else if (currentStats.level <= 10) setSelectedDifficulty('medium');
        else if (currentStats.level <= 20) setSelectedDifficulty('hard');
        else setSelectedDifficulty('extreme');
    }
  }, [currentStats?.level]);

  useEffect(() => {
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

  const academicCategories = (student?.schedule || [])
    .map(s => s.description)
    .filter(desc => desc && desc.length > 5 && !desc.includes('BREAK') && !desc.includes('LUNCH'))
    .filter((value, index, self) => self.indexOf(value) === index) // Unique
    .map(name => ({ id: `acad-${name}`, name, icon: GraduationCap, isAcademic: true }));

  const allCategories = [...CATEGORIES, ...academicCategories];

  const getDifficulty = () => {
    return selectedDifficulty;
  };

  const startQuest = async (category: string) => {
    const difficulty = getDifficulty();
    setLoading(true);
    try {
      let excludedQuestions = [];
      try {
        const localHistory = localStorage.getItem('quest_history_local');
        excludedQuestions = localHistory ? JSON.parse(localHistory) : [];
      } catch (e) {}

      // For Test/Practice mode, we ALWAYS force a new generation and DON'T check server status
      const res = await fetch('/api/quests/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category, 
          difficulty,
          excludedQuestions,
          force: true,
          practice: true
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
      toast.error("Failed to start test quest");
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
    let finalAnswer = answer;

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
        if (evalResult.feedback) setEvaluationFeedback(evalResult.feedback);
      } catch (e) {
        // Fallback to simple string match if AI fails
        isCorrect = answer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();
        setEvaluationFeedback(isCorrect ? "Perfect match!" : `Expected: ${currentQuestion.correct_answer}`);
      } finally {
        setIsEvaluating(false);
      }
    } else if (currentQuestion.type === 'boolean') {
      isCorrect = answer.toLowerCase() === currentQuestion.correct_answer.toLowerCase();
      setEvaluationFeedback(isCorrect ? "Correct assessment!" : `Incorrect. The correct answer was: ${currentQuestion.correct_answer}`);
    } else {
      isCorrect = answer === currentQuestion.correct_answer;
      setEvaluationFeedback(isCorrect ? "Correct answer selected!" : `Incorrect. The correct answer was: ${currentQuestion.correct_answer}`);
    }

    setIsCurrentCorrect(isCorrect);
    setIsAnswered(true);
    setSelectedAnswer(finalAnswer);
    
    const newScore = isCorrect ? score + 1 : score;
    const nextIndex = currentIndex + 1;
    const completed = nextIndex >= TOTAL_QUESTIONS;

    if (isCorrect) {
      toast.success("Correct!");
      saveToLocalHistory(currentQuestion.question);
    } else {
      toast.error("Incorrect!");
    }

    setScore(newScore);

    // Note: In TEST MODE, we DO NOT save progress via PATCH to /api/quests/daily
    // This keeps the "Daily" record untouched for the real quest.
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    const completed = nextIndex >= TOTAL_QUESTIONS;

    if (completed) {
      setIsCompleted(true);
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

  const resetTest = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setIsCompleted(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
      <div className="text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-primary animate-pulse">Our AI Agent is generating your questions...</p>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Building practice session in Sandbox</p>
      </div>
    </div>
  );

  if (isCompleted) {
    const diffInfo = DIFFICULTY_CONFIG.find(d => d.id === selectedDifficulty) || DIFFICULTY_CONFIG[1];
    const expectedExp = Math.floor(score * 20 * diffInfo.multiplier);

    return (
      <div className="text-center py-10 space-y-8 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <BrainCircuit className="h-20 w-20 text-primary mx-auto" />
        </motion.div>
        
        <div className="space-y-2">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Practice Over!</h2>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-primary">No EXP earned in Test Mode</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="surface-neutral p-6 rounded-2xl border border-border/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Final Test Score</p>
                <div className="text-3xl font-black text-primary">{score} / {TOTAL_QUESTIONS}</div>
            </div>
            <div className="surface-neutral p-6 rounded-2xl border border-border/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Expected EXP</p>
                <div className="text-2xl font-black text-emerald-500">+{expectedExp}</div>
                <div className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${diffInfo.color}`}>
                    {diffInfo.name} ({diffInfo.multiplier}x)
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-3">
            <button 
                onClick={resetTest}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
                <RefreshCcw className="h-5 w-5" />
                Retake Another Test
            </button>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Test mode results are not saved to your profile.
            </p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
            <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-primary">Test Mode</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sandbox for testing new features</p>
            </div>
            <div className="bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Staff Preview</span>
                {currentStats && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${
                    DIFFICULTY_CONFIG.find(d => d.id === selectedDifficulty)?.bg || 'bg-amber-500/10'
                  } ${
                    DIFFICULTY_CONFIG.find(d => d.id === selectedDifficulty)?.border || 'border-amber-500/20'
                  } ${
                    DIFFICULTY_CONFIG.find(d => d.id === selectedDifficulty)?.color || 'text-amber-600'
                  }`}>
                    {selectedDifficulty}
                  </span>
                )}
            </div>
        </div>

        {/* Difficulty Selector */}
        <div className="px-2 space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Practice Difficulty</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DIFFICULTY_CONFIG.map((diff) => (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  selectedDifficulty === diff.id
                    ? `${diff.bg} ${diff.border} ring-1 ring-current`
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedDifficulty === diff.id ? diff.color : 'text-muted-foreground'}`}>
                  {diff.name}
                </span>
                <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${selectedDifficulty === diff.id ? diff.color : 'text-muted-foreground/50'}`}>
                   Multiplier: {diff.multiplier}x
                </span>
              </button>
            ))}
          </div>
        </div>

        {academicCategories.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Academic Subjects</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {academicCategories.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => startQuest(cat.name)} 
                  className="surface-neutral p-6 rounded-2xl border border-primary/20 bg-primary/5 hover:border-primary/50 transition-all group flex flex-col items-center gap-3"
                >
                  <cat.icon className="h-8 w-8 transition-colors text-primary" />
                  <span className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-center">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">General Categories</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => startQuest(cat.name)} 
                className="surface-neutral p-6 rounded-2xl border border-border/50 hover:border-primary/50 transition-all group flex flex-col items-center gap-3"
              >
                <cat.icon className="h-8 w-8 transition-colors text-muted-foreground group-hover:text-primary" />
                <span className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-center">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-black uppercase tracking-widest">Test Run {currentIndex + 1}/10</span>
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase">Practice Score: {score}</div>
      </div>

      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <motion.div className="h-full bg-primary" animate={{ width: `${(currentIndex / TOTAL_QUESTIONS) * 100}%` }} />
      </div>

      <div className="surface-neutral p-8 rounded-2xl border border-primary/20 bg-primary/5 space-y-8">
        <QuestMarkdown content={currentQ.question} className="text-xl sm:text-2xl font-bold text-center leading-tight flex justify-center" />
        
        {currentQ.type === 'open' ? (
          <div className="space-y-4">
            <input 
              type="text"
              value={openAnswer}
              onChange={(e) => setOpenAnswer(e.target.value)}
              disabled={isAnswered || isEvaluating}
              placeholder="Type your answer here..."
              className="w-full p-4 rounded-xl bg-background border border-border font-bold focus:border-primary outline-none transition-all"
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
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
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
                className={`p-5 rounded-xl border text-left font-bold transition-all ${
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
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-5 rounded-xl border-2 flex flex-col gap-2 ${
                    isCurrentCorrect
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700'
                    : 'bg-rose-500/5 border-rose-500/20 text-rose-700'
                }`}
            >
                <div className="flex items-center gap-2">
                    {isCurrentCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    <span className="text-xs font-black uppercase tracking-widest">
                        {isCurrentCorrect ? 'Analysis: Accepted' : 'Analysis: Rejected'}
                    </span>
                </div>
                <p className="text-sm font-medium leading-relaxed italic">
                    "{evaluationFeedback || (isCurrentCorrect ? 'Correct!' : 'Incorrect.')}"
                </p>
            </motion.div>
        )}

        {isAnswered && !isEvaluating && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={nextQuestion}
            className="w-full py-4 rounded-xl bg-foreground text-background font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-black/10"
          >
            {currentIndex + 1 >= TOTAL_QUESTIONS ? 'Finish Practice' : 'Continue'}
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        )}
      </div>
      
      <div className="text-center">
        <button onClick={resetTest} className="text-[10px] font-black text-muted-foreground hover:text-rose-500 uppercase tracking-[0.2em] transition-colors">
            Exit Test Mode
        </button>
      </div>
    </div>
  );
}
