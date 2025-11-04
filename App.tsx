import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SUBJECTS } from './data/questions';
import { Difficulty, Question, EvaluationResult } from './types';
import SetupScreen from './components/SetupScreen';
import QuestionScreen from './components/QuestionScreen';
import SummaryScreen from './components/SummaryScreen';
import { QUESTIONS_PER_SESSION } from './constants';
import { evaluateAnswer } from './services/geminiService';

// Comment: Questions are originally worded and aligned to CBSE Class 11 topics without reproducing NCERT verbatim.

type AppState = 'setup' | 'quiz' | 'summary';

export default function App() {
  const [appState, setAppState] = useState<AppState>('setup');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Array<{ question: Question, studentAnswer: string, result: EvaluationResult | null }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(() => {
    const savedStreak = localStorage.getItem('streak');
    return savedStreak ? parseInt(savedStreak, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem('streak', streak.toString());
  }, [streak]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const handleStartQuiz = useCallback((subject: string, chapter: string, difficulty: Difficulty) => {
    try {
      const chapterData = SUBJECTS[subject]?.chapters.find(c => c.name === chapter);
      if (!chapterData) throw new Error("Chapter not found");

      const questionPool = chapterData.questions[difficulty];
      if (!questionPool || questionPool.length === 0) throw new Error("No questions available for this selection.");

      const shuffledQuestions = shuffleArray(questionPool).slice(0, QUESTIONS_PER_SESSION);
      
      setQuestions(shuffledQuestions);
      setSelectedSubject(subject);
      setSelectedChapter(chapter);
      setSelectedDifficulty(difficulty);
      setCurrentQuestionIndex(0);
      setTotalScore(0);
      setSessionAnswers([]);
      setError(null);
      setAppState('quiz');
    } catch (e: any) {
      setError(e.message || "Failed to start the quiz. Please try again.");
    }
  }, []);

  const handleAnswerSubmit = useCallback(async (studentAnswer: string) => {
    setIsLoading(true);
    setError(null);
    const currentQuestion = questions[currentQuestionIndex];
    
    try {
      const result = await evaluateAnswer(currentQuestion, studentAnswer);
      setTotalScore(prev => prev + result.score);
      if (result.isCorrect) {
        setStreak(prev => prev + 1);
      } else {
        setStreak(0);
      }
      const newSessionAnswer = { question: currentQuestion, studentAnswer, result };
      setSessionAnswers(prev => [...prev, newSessionAnswer]);
      return result;
    } catch (e) {
      console.error("Evaluation failed:", e);
      setError("Sorry, there was an error evaluating your answer. Please try again.");
      setStreak(0); // Reset streak on error
      const errorResult: EvaluationResult = { 
        score: 0, 
        feedback: "Error during evaluation.", 
        isCorrect: false,
        missingConcepts: [],
        terminologyCorrections: [],
        modelAnswerImprovement: ""
      };
      const newSessionAnswer = { question: currentQuestion, studentAnswer, result: errorResult };
      setSessionAnswers(prev => [...prev, newSessionAnswer]);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestionIndex, questions]);

  const handleNextQuestion = useCallback((wasAnswered: boolean) => {
    // If the question was not answered on screen, it means the user clicked "Next" to skip it.
    if (!wasAnswered) {
      setStreak(0); // Reset streak on skip
      const currentQuestion = questions[currentQuestionIndex];
      const skippedResult = {
        question: currentQuestion,
        studentAnswer: "", // Empty string for a skip
        result: {
          score: 0,
          feedback: "You skipped this question.",
          isCorrect: false,
          missingConcepts: [],
          terminologyCorrections: [],
          modelAnswerImprovement: "",
        }
      };
      setSessionAnswers(prev => [...prev, skippedResult]);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppState('summary');
    }
  }, [currentQuestionIndex, questions]);

  const handleRestart = useCallback(() => {
    setAppState('setup');
    setSelectedSubject('');
    setSelectedChapter('');
    setSelectedDifficulty(null);
  }, []);

  const maxPossibleScore = useMemo(() => {
    return questions.reduce((acc, q) => acc + q.maxMarks, 0);
  }, [questions]);
  
  const renderContent = () => {
    if (error && appState === 'setup') {
      return (
        <div className="text-center text-red-700 bg-red-100 p-4 rounded-lg border border-red-300">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
            Dismiss
          </button>
        </div>
      );
    }
    
    switch (appState) {
      case 'quiz':
        return (
          <QuestionScreen
            question={questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            totalScore={totalScore}
            streak={streak}
            isLoading={isLoading}
            error={error}
            onSubmit={handleAnswerSubmit}
            onNext={handleNextQuestion}
          />
        );
      case 'summary':
        return (
          <SummaryScreen
            totalScore={totalScore}
            maxPossibleScore={maxPossibleScore}
            onRestart={handleRestart}
            sessionAnswers={sessionAnswers}
            difficulty={selectedDifficulty}
          />
        );
      case 'setup':
      default:
        return <SetupScreen onStartQuiz={handleStartQuiz} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-300 to-purple-400 font-sans text-slate-800 p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col">
        {renderContent()}
      </main>
    </div>
  );
}