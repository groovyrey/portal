'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  BrainCircuit, 
  Monitor, 
  Calculator, 
  FlaskConical, 
  History, 
  Map, 
  Gamepad2, 
  Palette,
  LayoutGrid
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface TriviaQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

const TOTAL_QUESTIONS = 5;

const CATEGORIES = [
  { id: 9, name: 'General', icon: LayoutGrid },
  { id: 18, name: 'Computers', icon: Monitor },
  { id: 19, name: 'Math', icon: Calculator },
  { id: 17, name: 'Science', icon: FlaskConical },
  { id: 23, name: 'History', icon: History },
  { id: 22, name: 'Geography', icon: Map },
  { id: 21, name: 'Sports', icon: Trophy },
  { id: 15, name: 'Gaming', icon: Gamepad2 },
  { id: 25, name: 'Art', icon: Palette },
];

const DIFFICULTIES = [
  { id: 'easy', name: 'Easy', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { id: 'medium', name: 'Medium', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { id: 'hard', name: 'Hard', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
];

export default function DailyQuestTab() {
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [categorySelected, setCategorySelected] = useState(false);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [shuffledAnswers, setShuffledAnswers] = useState<string[]>([]);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [dailyScore, setDailyScore] = useState<number | null>(null);

  useEffect(() => {
    // Check if played today
    const today = new Date().toISOString().split('T')[0];
    const lastPlayed = localStorage.getItem('daily_quest_date');
    const lastScore = localStorage.getItem('daily_quest_score');

    if (lastPlayed === today) {
      setHasPlayedToday(true);
      setDailyScore(lastScore ? parseInt(lastScore) : 0);
      setLoading(false);
    } else {
      // Don't fetch questions immediately, show category select first
      setLoading(false);
    }
  }, []);

  const fetchQuestions = async (categoryId?: number, difficulty?: string) => {
    setLoading(true);
    try {
      // Fetch daily random questions
      let url = `https://opentdb.com/api.php?amount=${TOTAL_QUESTIONS}&type=multiple`;
      if (categoryId) {
        url += `&category=${categoryId}`;
      }
      if (difficulty) {
        url += `&difficulty=${difficulty}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        // Pre-decode all questions to avoid DOM calls in render
        const decodedResults = data.results.map((q: TriviaQuestion) => ({
          ...q,
          question: decode(q.question),
          correct_answer: decode(q.correct_answer),
          incorrect_answers: q.incorrect_answers.map(a => decode(a)),
          category: decode(q.category)
        }));
        
        setQuestions(decodedResults);
        prepareQuestion(decodedResults[0]);
        setCategorySelected(true);
      } else {
        toast.error('No questions found for this combination. Try another.');
        if (difficulty) {
           setCategorySelected(false);
        }
      }
    } catch (e) {
      toast.error('Network error. Could not fetch quest.');
    } finally {
      setLoading(false);
    }
  };

  const prepareQuestion = (question: TriviaQuestion) => {
    const allAnswers = [...question.incorrect_answers, question.correct_answer];
    setShuffledAnswers(allAnswers.sort(() => Math.random() - 0.5));
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const isCorrect = answer === questions[currentIndex].correct_answer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      toast.success('Correct!', { duration: 1000 });
    } else {
      toast.error('Incorrect!', { duration: 1000 });
    }

    // Wait a bit then go to next
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        prepareQuestion(questions[currentIndex + 1]);
      } else {
        finishQuest(isCorrect ? score + 1 : score);
      }
    }, 1500);
  };

  const finishQuest = (finalScore: number) => {
    setCompleted(true);
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('daily_quest_date', today);
    localStorage.setItem('daily_quest_score', finalScore.toString());
    setHasPlayedToday(true);
    setDailyScore(finalScore);
    
    if (finalScore >= 4) {
      toast.success('Quest Master! Outstanding performance!');
    } else if (finalScore >= 3) {
      toast.success('Well done! Good score.');
    } else {
      toast.success('Quest completed. Better luck tomorrow!');
    }
  };

  // Helper to decode HTML entities
  const decode = (str: string) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  };

  const answeredCount = currentIndex + (isAnswered ? 1 : 0);
  const currentCorrectRate = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;
  const todayCorrectRate = dailyScore !== null ? Math.round((dailyScore / TOTAL_QUESTIONS) * 100) : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] gap-3">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Summoning the Quest Master...</p>
      </div>
    );
  }

  if (hasPlayedToday) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 text-center">
        <Trophy className="h-16 w-16 text-primary" />
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Quest Completed</h2>
          <p className="text-sm text-muted-foreground">You have finished today&apos;s challenge.</p>
        </div>

        <div className="w-full max-w-sm rounded-lg border border-border bg-card p-4">
          <p className="mb-2 text-xs text-muted-foreground">Today&apos;s Score</p>
          <div className="flex items-center justify-center gap-2">
             <span className="text-4xl font-semibold text-primary">{dailyScore}</span>
             <span className="text-lg text-muted-foreground">/ {TOTAL_QUESTIONS}</span>
          </div>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            Correct Answer Rate: <span className="text-foreground">{todayCorrectRate}%</span>
          </p>
        </div>

        <div className="max-w-md rounded-md border border-border bg-muted/20 p-3">
           <p className="text-xs font-medium text-muted-foreground">
             New quest available tomorrow at 12:00 AM.
           </p>
        </div>
      </div>
    );
  }

  if (!categorySelected || questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Daily Quest</h2>
          <p className="text-sm text-muted-foreground">
            {selectedCat === null 
              ? "Choose a category to start your daily trivia challenge."
              : "Now choose your difficulty level."}
          </p>
        </div>

        {selectedCat === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-95 group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <cat.icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">{cat.name}</span>
              </button>
            ))}
            <button
              onClick={() => setSelectedCat(0)} // 0 means any
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-95 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Any Topic</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.id}
                  onClick={() => fetchQuestions(selectedCat || undefined, diff.id)}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-all hover:bg-accent active:scale-95 group ${diff.color}`}
                >
                  <span className="font-bold uppercase tracking-wider">{diff.name}</span>
                  <Trophy className="h-5 w-5 opacity-20 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              <button
                onClick={() => fetchQuestions(selectedCat || undefined)}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:bg-accent active:scale-95 group"
              >
                <span className="text-muted-foreground font-bold uppercase tracking-wider text-sm">Mixed Difficulty</span>
                <BrainCircuit className="h-5 w-5 opacity-20 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            
            <button 
              onClick={() => setSelectedCat(null)}
              className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Categories
            </button>
          </div>
        )}
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Daily Trivia</h2>
            <p className="text-xs font-medium text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-muted rounded-md border border-border text-right">
          <p className="text-xs font-medium">Score: {score}</p>
          <p className="text-[10px] text-muted-foreground">Rate: {currentCorrectRate}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-accent rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Question Card */}
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="mb-6">
           <span className="mb-3 inline-block rounded-md border border-border bg-muted/20 px-2 py-0.5 text-[10px] text-muted-foreground">
             {currentQ.category}
           </span>
           <span className={`inline-block ml-2 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide mb-3 ${
             currentQ.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600' :
             currentQ.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-600' :
             'bg-rose-500/10 text-rose-600'
           }`}>
             {currentQ.difficulty}
           </span>
           <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
             {currentQ.question}
           </h3>
        </div>

        <div className="grid gap-3">
          {shuffledAnswers.map((answer, idx) => {
             const isSelected = selectedAnswer === answer;
             const isCorrect = answer === currentQ.correct_answer;
             const showResult = isAnswered;

             let buttonStyle = "border-border hover:bg-accent hover:border-accent";
             if (showResult) {
                if (isCorrect) {
                  buttonStyle = "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400";
                } else if (isSelected) {
                  buttonStyle = "bg-rose-500/10 border-rose-500/50 text-rose-700 dark:text-rose-400";
                } else {
                  buttonStyle = "opacity-50 border-border";
                }
             } else if (isSelected) {
                buttonStyle = "border-primary bg-primary/5 text-primary";
             }

             return (
               <button
                 key={idx}
                 onClick={() => handleAnswer(answer)}
                 disabled={isAnswered}
                 className={`
                   relative w-full text-left p-4 rounded-lg border transition-colors duration-200
                   font-semibold text-sm sm:text-base
                   ${buttonStyle}
                 `}
               >
                 <div className="flex items-center justify-between">
                   <span>{answer}</span>
                   {showResult && isCorrect && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                   {showResult && isSelected && !isCorrect && <XCircle className="h-5 w-5 text-rose-500" />}
                 </div>
               </button>
             );
          })}
        </div>
      </div>
    </div>
  );
}
