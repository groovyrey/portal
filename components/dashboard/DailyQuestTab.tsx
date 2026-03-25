'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, CheckCircle, XCircle, Loader2, BrainCircuit, RefreshCw, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface TriviaQuestion {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

export default function DailyQuestTab() {
  const [loading, setLoading] = useState(true);
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
      fetchQuestions();
    }
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // Fetch 5 random questions
      const res = await fetch('https://opentdb.com/api.php?amount=5&type=multiple');
      const data = await res.json();
      
      if (data.results && data.results.length > 0) {
        setQuestions(data.results);
        prepareQuestion(data.results[0]);
      } else {
        toast.error('Failed to load quest data.');
      }
    } catch (e) {
      toast.error('Network error. Could not fetch quest.');
    } finally {
      setLoading(false);
    }
  };

  const prepareQuestion = (question: TriviaQuestion) => {
    // Decode HTML entities in question and answers if necessary (OpenTDB returns HTML entities)
    // For simplicity, we'll just shuffle here. Decoding is better done with a utility or DOMParser.
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Summoning the Quest Master...</p>
      </div>
    );
  }

  if (hasPlayedToday) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <Trophy className="h-24 w-24 text-primary relative z-10" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tight">Quest Completed</h2>
          <p className="text-muted-foreground font-medium">You have finished today&apos;s challenge.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Today&apos;s Score</p>
          <div className="flex items-center justify-center gap-2">
             <span className="text-5xl font-black text-primary">{dailyScore}</span>
             <span className="text-xl font-bold text-muted-foreground">/ 5</span>
          </div>
        </div>

        <div className="p-4 bg-accent/50 rounded-xl max-w-md">
           <p className="text-xs font-medium text-muted-foreground">
             New quest available tomorrow at 12:00 AM.
           </p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight">Daily Trivia</h2>
            <p className="text-xs font-medium text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>
        <div className="px-3 py-1 bg-accent rounded-full border border-border">
          <span className="text-xs font-bold text-foreground">Score: {score}</span>
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
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="mb-6">
           <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-3">
             {decode(currentQ.category)}
           </span>
           <span className={`inline-block ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-3 ${
             currentQ.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-600' :
             currentQ.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-600' :
             'bg-rose-500/10 text-rose-600'
           }`}>
             {currentQ.difficulty}
           </span>
           <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
             {decode(currentQ.question)}
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
                   relative w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                   font-semibold text-sm sm:text-base
                   ${buttonStyle}
                 `}
               >
                 <div className="flex items-center justify-between">
                   <span>{decode(answer)}</span>
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
