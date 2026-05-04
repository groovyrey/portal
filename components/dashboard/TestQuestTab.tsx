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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  { id: 'easy', name: 'Easy', multiplier: 1 },
  { id: 'medium', name: 'Medium', multiplier: 1.5 },
  { id: 'hard', name: 'Hard', multiplier: 2 },
  { id: 'extreme', name: 'Extreme', multiplier: 3 },
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
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['multiple', 'boolean', 'open']);

  const { student } = useStudent();
  const totalQuestions = questions.length || 10;

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
    } catch (e) {}
  };

  const academicCategories = (student?.schedule || [])
    .map(s => s.description)
    .filter(desc => desc && desc.length > 5 && !desc.includes('BREAK') && !desc.includes('LUNCH'))
    .filter((value, index, self) => self.indexOf(value) === index)
    .map(name => ({ id: `acad-${name}`, name, icon: GraduationCap, isAcademic: true }));

  const startQuest = async (category: string) => {
    setLoading(true);
    try {
      let excludedQuestions = [];
      try {
        const localHistory = localStorage.getItem('quest_history_local');
        excludedQuestions = localHistory ? JSON.parse(localHistory) : [];
      } catch (e) {}

      const res = await fetch('/api/quests/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          category, 
          difficulty: selectedDifficulty,
          types: selectedTypes,
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
      toast.error("Failed to start test");
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
        isCorrect = answer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();
        setEvaluationFeedback(isCorrect ? "Match!" : `Expected: ${currentQuestion.correct_answer}`);
      } finally {
        setIsEvaluating(false);
      }
    } else {
      isCorrect = answer.toLowerCase().trim() === currentQuestion.correct_answer.toLowerCase().trim();
      setEvaluationFeedback(isCorrect ? "Correct!" : `Incorrect. Answer: ${currentQuestion.correct_answer}`);
    }

    setIsCurrentCorrect(isCorrect);
    setIsAnswered(true);
    setSelectedAnswer(answer);
    
    if (isCorrect) {
      setScore(s => s + 1);
      toast.success("Correct!");
      saveToLocalHistory(currentQuestion.question);
    } else {
      toast.error("Incorrect!");
    }
  };

  const nextQuestion = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= totalQuestions) {
      setIsCompleted(true);
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

  const resetTest = () => {
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setIsCompleted(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
      <p className="text-sm text-muted-foreground">Generating test...</p>
    </div>
  );

  if (isCompleted) {
    const diffInfo = DIFFICULTY_CONFIG.find(d => d.id === selectedDifficulty) || DIFFICULTY_CONFIG[1];
    const expectedExp = Math.floor(score * 20 * diffInfo.multiplier);

    return (
      <div className="text-center py-6 space-y-8 max-w-sm mx-auto">
        <div className="space-y-2">
            <BrainCircuit className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold tracking-tight">Test Over!</h2>
            <p className="text-sm text-muted-foreground">Results from sandbox mode are not saved.</p>
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
                    <CardDescription className="text-[10px] uppercase font-bold">Potential EXP</CardDescription>
                    <CardTitle className="text-2xl text-emerald-600">+{expectedExp}</CardTitle>
                </CardHeader>
            </Card>
        </div>

        <div className="grid gap-3 pt-4">
            <Button onClick={resetTest} className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Start New Test
            </Button>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Practice makes perfect.</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-primary">Sandbox Mode</h3>
                <p className="text-sm text-muted-foreground">Test features and practice questions.</p>
            </div>
            <Badge variant="outline" className="h-8 self-start sm:self-auto">Staff Access</Badge>
        </div>

        <div className="grid gap-6">
          <div className="space-y-3">
            <Label className="text-xs uppercase font-bold text-muted-foreground ml-1">Practice Difficulty</Label>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTY_CONFIG.map((diff) => (
                  <SelectItem key={diff.id} value={diff.id}>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span>{diff.name}</span>
                      <span className="text-[10px] text-muted-foreground">({diff.multiplier}x)</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-xs uppercase font-bold text-muted-foreground ml-1">Question Types</Label>
            <div className="flex flex-wrap gap-x-8 gap-y-4 p-4 rounded-lg border bg-muted/20">
              {[
                { id: 'multiple', name: 'Choices', icon: LayoutGrid },
                { id: 'boolean', name: 'T/F', icon: Zap },
                { id: 'open', name: 'Open', icon: BrainCircuit }
              ].map((type) => (
                <div key={type.id} className="flex items-center space-x-2.5">
                  <Checkbox 
                    id={type.id} 
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={(checked) => {
                      setSelectedTypes(prev => {
                        if (!checked) {
                          if (prev.length === 1) return prev;
                          return prev.filter(t => t !== type.id);
                        }
                        return [...prev, type.id];
                      });
                    }}
                  />
                  <Label 
                    htmlFor={type.id}
                    className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                  >
                    <type.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {type.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
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
                {section.categories.map(cat => (
                  <Button 
                    key={cat.id} 
                    variant="outline"
                    onClick={() => startQuest(cat.name)} 
                    className="h-auto p-4 sm:p-6 flex-col gap-3 border-primary/20 bg-primary/5 hover:bg-primary/10 whitespace-normal"
                  >
                    <cat.icon className="h-6 w-6 text-primary" />
                    <span className="text-[10px] sm:text-xs font-bold text-center line-clamp-2">{cat.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Test Run: {currentIndex + 1} / {totalQuestions}</span>
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
              placeholder="Type test answer..."
              className="h-12 text-center"
              onKeyDown={(e) => e.key === 'Enter' && openAnswer.trim() && !isAnswered && handleAnswer(openAnswer)}
            />
            {!isAnswered && (
              <Button onClick={() => handleAnswer(openAnswer)} disabled={!openAnswer.trim() || isEvaluating} className="w-full h-12">
                {isEvaluating ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Evaluate
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
                  <p className="font-medium leading-relaxed italic">"{evaluationFeedback}"</p>
              </motion.div>
          )}
        </AnimatePresence>

        {isAnswered && !isEvaluating && (
          <div className="space-y-4">
            <Button onClick={nextQuestion} size="lg" className="w-full gap-2">
              {currentIndex + 1 >= totalQuestions ? 'Complete Practice' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetTest} className="w-full text-[10px] uppercase font-bold">
              Exit Sandbox
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
