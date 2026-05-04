'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, CheckCircle, XCircle, Loader2, BrainCircuit, Monitor, Calculator, 
  FlaskConical, History, Map, Gamepad2, Palette, LayoutGrid, Zap, GraduationCap,
  ArrowRight, BookOpenCheck, RefreshCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useStudent } from '@/lib/hooks';
import QuestMarkdown from '@/components/shared/QuestMarkdown';
import { getPHDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

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
  { id: 'easy', name: 'Easy', multiplier: 1, variant: 'secondary' as any },
  { id: 'medium', name: 'Medium', multiplier: 1.5, variant: 'default' as any },
  { id: 'hard', name: 'Hard', multiplier: 2, variant: 'outline' as any },
  { id: 'extreme', name: 'Extreme', multiplier: 3, variant: 'destructive' as any },
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
    .filter((value, index, self) => self.indexOf(value) === index)
    .map(name => ({ id: `acad-${name}`, name, icon: GraduationCap, isAcademic: true }));

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
    const existing = allQuests.find(q => q.category === category);
    if (existing) {
      const today = getPHDate();
      if (existing.quest_date === today && existing.is_completed) {
        toast.error(`Category completed for today.`);
        return;
      }
    }

    const difficulty = selectedDifficulty;
    setLoading(true);
    try {
      const res = await fetch('/api/quests/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, difficulty, force: false })
      });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Failed to start");
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
      setShuffledAnswers(['True', 'False']);
      setOpenAnswer("");
    } else {
      const all = [...cleanIncorrect, cleanCorrect].sort(() => Math.random() - 0.5);
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
        feedback = evalResult.feedback || (isCorrect ? "Perfect!" : "Not quite.");
        setEvaluationFeedback(feedback);
      } catch (e) {
        isCorrect = answer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();
        feedback = isCorrect ? "Perfect match!" : `Expected: ${currentQuestion.correct_answer}`;
        setEvaluationFeedback(feedback);
      } finally {
        setIsEvaluating(false);
      }
    } else {
      isCorrect = answer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();
      feedback = isCorrect ? "Correct!" : `Incorrect. The answer was: ${currentQuestion.correct_answer}`;
      setEvaluationFeedback(feedback);
    }

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
          questions: updatedQuestions
        })
      });
    } catch (e) {
      console.error("Failed to save progress");
    }
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= totalQuestions) {
      setIsCompleted(true);
      updateOverallStats(score);
    } else {
      setCurrentIndex(nextIndex);
      prepareQuestion(questions[nextIndex]);
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
    } catch (e) {}
  };

  const updateOverallStats = async (finalScore: number) => {
    if (!student?.id || !currentCategory) return;
    try {
      const res = await fetch('/api/quests/update-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: finalScore,
          difficulty: selectedDifficulty,
          studentId: student.id,
          category: currentCategory
        })
      });
      if (res.ok) {
        const data = await res.json();
        setQuestStats(data);
        if (data.levelUp) toast.success(`LEVEL UP! Level ${data.newLevel}!`);
        fetchCurrentStats();
      }
    } catch (e) {}
  };

  const getCategoryStatus = (category: string) => {
    const quest = allQuests.find(q => q.category === category);
    const isFeatured = category === currentStats?.featuredCategory;
    const today = getPHDate();
    if (!quest) return { status: 'available', isFeatured };
    if (quest.quest_date !== today) return { status: 'available', isFeatured };
    if (!quest.is_completed) return { status: 'in-progress', isFeatured };
    return { status: 'cooldown', isFeatured };
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
      <p className="text-sm text-muted-foreground">Loading quests...</p>
    </div>
  );

  if (isReviewMode) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Review</h2>
            <p className="text-sm text-muted-foreground">{currentCategory}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsReviewMode(false)} className="self-end sm:self-auto">
            <XCircle className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-4">
          {questions.map((q, i) => (
            <Card key={i} className={cn(q.isCorrect ? "border-emerald-500/20 bg-emerald-500/5" : "border-destructive/20 bg-destructive/5")}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">Q{i+1}</Badge>
                  {q.isCorrect ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                </div>
                <p className="text-sm font-semibold">{q.question}</p>
                <div className="grid gap-1">
                  <p className="text-xs text-muted-foreground">Your Answer: <span className="text-foreground font-bold">{q.userAnswer || 'None'}</span></p>
                  {!q.isCorrect && <p className="text-xs text-muted-foreground">Correct: <span className="text-emerald-600 font-bold">{q.correct_answer}</span></p>}
                </div>
                {q.feedback && <p className="text-xs italic text-muted-foreground border-l-2 pl-3 py-1">AI: {q.feedback}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={() => setIsReviewMode(false)} className="w-full">Back to Menu</Button>
      </div>
    );
  }

  if (isCompleted) {
    const stats = questStats || { 
        newLevel: currentStats?.level || 1, 
        newExp: currentStats?.exp || 0,
        gainedExp: 0
    };

    return (
      <div className="text-center py-6 space-y-8 max-w-sm mx-auto">
        <div className="space-y-2">
            <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold tracking-tight">Quest Over!</h2>
            <p className="text-sm text-muted-foreground">Great work on completing the challenge.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <Card>
                <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-[10px] uppercase font-bold">Score</CardDescription>
                    <CardTitle className="text-2xl">{score}/{totalQuestions}</CardTitle>
                </CardHeader>
            </Card>
            <Card>
                <CardHeader className="p-4 pb-2">
                    <CardDescription className="text-[10px] uppercase font-bold">EXP</CardDescription>
                    <CardTitle className="text-2xl text-emerald-600">+{stats.gainedExp}</CardTitle>
                </CardHeader>
            </Card>
        </div>

        <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium px-1">
                <span>Level {stats.newLevel}</span>
                <span className="text-muted-foreground">Progress to {stats.newLevel + 1}</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((stats.newExp % 100) / 100) * 100}%` }}
                />
            </div>
        </div>

        <div className="grid gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsReviewMode(true)} className="gap-2">
                <BookOpenCheck className="h-4 w-4" />
                Review Answers
            </Button>
            <Button onClick={() => { setIsCompleted(false); fetchDailyStatus(); }}>
                Done
            </Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Daily Quests</h3>
                <p className="text-sm text-muted-foreground">Earn EXP by answering trivia.</p>
            </div>
            {currentStats && (
                <div className="flex flex-wrap gap-2 sm:gap-4 self-start sm:self-auto">
                  <Badge variant="outline" className="gap-1.5 h-8">
                    <Trophy className="h-3 w-3 text-orange-500" />
                    Streak: {currentStats.streak}
                  </Badge>
                  <Badge variant="secondary" className="gap-1.5 h-8">
                    <Zap className="h-3 w-3 fill-primary text-primary" />
                    LVL {currentStats.level}
                  </Badge>
                </div>
            )}
        </div>

        <div className="space-y-3">
          <Label className="text-xs uppercase font-bold text-muted-foreground ml-1">Difficulty</Label>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_CONFIG.map((diff) => (
                <SelectItem key={diff.id} value={diff.id}>
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span>{diff.name}</span>
                    <span className="text-[10px] text-muted-foreground">({diff.multiplier}x EXP)</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {[
          { label: 'Academic Subjects', categories: academicCategories },
          { label: 'General Knowledge', categories: CATEGORIES }
        ].map((section, idx) => (
          section.categories.length > 0 && (
            <div key={idx} className="space-y-4">
              <Separator />
              <Label className="text-xs uppercase font-bold text-muted-foreground ml-1">{section.label}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {section.categories.map(cat => {
                  const status = getCategoryStatus(cat.name);
                  const isCooldown = status.status === 'cooldown';
                  return (
                    <Button 
                      key={cat.id} 
                      variant="outline"
                      onClick={() => startQuest(cat.name)} 
                      disabled={isCooldown}
                      className={cn(
                        "h-auto p-4 sm:p-6 flex-col gap-3 relative whitespace-normal",
                        !isCooldown && "border-primary/20 bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      {status.isFeatured && <Badge className="absolute -top-2 -right-2 px-1.5 py-0 h-4 text-[8px]">Featured</Badge>}
                      <cat.icon className={cn("h-6 w-6", isCooldown ? "text-muted-foreground" : "text-primary")} />
                      <span className="text-[10px] sm:text-xs font-bold text-center line-clamp-2">{cat.name}</span>
                      {isCooldown ? <span className="text-[9px] text-destructive">Ready tomorrow</span> : 
                       status.status === 'in-progress' ? <span className="text-[9px] text-amber-500">In Progress</span> : null}
                    </Button>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider">Question {currentIndex + 1} of {totalQuestions}</span>
        </div>
        <Badge variant="outline" className="font-mono">Score: {score}</Badge>
      </div>

      <Progress value={(currentIndex / totalQuestions) * 100} className="h-1" />

      <div className="space-y-8 pt-4">
        <div className="text-lg md:text-xl font-bold text-center leading-tight">
            <QuestMarkdown content={currentQ.question} />
        </div>
        
        {currentQ.type === 'open' ? (
          <div className="space-y-4">
            <Input 
              value={openAnswer}
              onChange={(e) => setOpenAnswer(e.target.value)}
              disabled={isAnswered || isEvaluating}
              placeholder="Type your answer..."
              className="h-12 text-center"
              onKeyDown={(e) => e.key === 'Enter' && openAnswer.trim() && !isAnswered && handleAnswer(openAnswer)}
            />
            {!isAnswered && (
              <Button onClick={() => handleAnswer(openAnswer)} disabled={!openAnswer.trim() || isEvaluating} className="w-full h-12">
                {isEvaluating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Submit Answer
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-2">
            {shuffledAnswers.map((ans, i) => (
              <Button
                key={i}
                variant={isAnswered ? (ans === currentQ.correct_answer ? "default" : selectedAnswer === ans ? "destructive" : "outline") : "outline"}
                disabled={isAnswered}
                onClick={() => handleAnswer(ans)}
                className={cn(
                  "h-auto py-4 px-6 justify-start text-left text-sm whitespace-normal",
                  isAnswered && ans !== currentQ.correct_answer && selectedAnswer !== ans && "opacity-50"
                )}
              >
                <QuestMarkdown content={ans} />
              </Button>
            ))}
          </div>
        )}

        <AnimatePresence>
          {isAnswered && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("p-4 rounded-md border text-sm", isCurrentCorrect ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-destructive/5 border-destructive/10 text-destructive")}>
                  <div className="flex items-center gap-2 mb-1.5 font-bold uppercase text-[10px]">
                      {isCurrentCorrect ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {isCurrentCorrect ? 'Correct' : 'Incorrect'}
                  </div>
                  <p className="font-medium leading-relaxed italic">"{evaluationFeedback}"</p>
              </motion.div>
          )}
        </AnimatePresence>

        {isAnswered && !isEvaluating && (
          <Button onClick={nextQuestion} size="lg" className="w-full gap-2">
            {currentIndex + 1 >= totalQuestions ? 'Finish' : 'Next Question'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

