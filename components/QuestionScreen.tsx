import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Question, EvaluationResult } from '../types';
import { MicIcon, SendIcon, VolumeUpIcon, VolumeOffIcon, NextIcon, LightbulbIcon, PencilIcon, SparklesIcon, FireIcon } from './Icons';

// Fix: Add type definitions for the Web Speech API to resolve TypeScript errors.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface QuestionScreenProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  totalScore: number;
  streak: number;
  isLoading: boolean;
  error: string | null;
  onSubmit: (answer: string) => Promise<EvaluationResult>;
  onNext: (wasAnswered: boolean) => void;
}

const QuestionScreen: React.FC<QuestionScreenProps> = ({
  question,
  questionNumber,
  totalQuestions,
  totalScore,
  streak,
  isLoading,
  error,
  onSubmit,
  onNext,
}) => {
  const [studentAnswer, setStudentAnswer] = useState('');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);

  // Fix: Cast window to any to access vendor-prefixed SpeechRecognition API
  // and rename variable to avoid shadowing the global SpeechRecognition type.
  const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTranscriptRef = useRef('');
  const isSpeechSupported = !!SpeechRecognitionImpl;

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window && !isMuted) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, [isMuted]);

  useEffect(() => {
    setStudentAnswer('');
    setEvaluationResult(null);
    setShowCorrectAnswer(false);
    speak(question.prompt);
  }, [question, speak]);

  useEffect(() => {
    if (isSpeechSupported) {
      recognitionRef.current = new SpeechRecognitionImpl();
      const recognition = recognitionRef.current;
      if (!recognition) {
        return;
      }
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        setStudentAnswer(baseTranscriptRef.current + fullTranscript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
    }
  }, [isSpeechSupported, SpeechRecognitionImpl]);
  
  const toggleRecording = () => {
    if (!isSpeechSupported) return;
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      baseTranscriptRef.current = studentAnswer ? studentAnswer.trim() + ' ' : '';
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };
  
  const handleAnswerSubmit = async () => {
    if (!studentAnswer.trim() || isLoading) return;
    if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
    }
    const result = await onSubmit(studentAnswer);
    setEvaluationResult(result);
    speak(result.feedback);
  };

  const handleShowCorrectAnswerToggle = () => {
    // We are about to show the answer if `showCorrectAnswer` is currently false.
    if (!showCorrectAnswer && evaluationResult?.isCorrect) {
      speak("Excellent work! Your answer was correct. Here is the model answer for comparison.");
    }
    setShowCorrectAnswer(prev => !prev);
  };

  const scoreColor = evaluationResult?.isCorrect ? 'text-green-700' : 'text-orange-700';

  return (
    <div className="w-full h-full flex flex-col p-4 sm:p-6 bg-white/60 backdrop-blur-lg border border-white/30 rounded-2xl shadow-xl animate-fade-in">
      <header className="flex justify-between items-center mb-4 pb-4 border-b border-slate-300/70">
        <div className="text-lg font-semibold text-blue-600">
          Question {questionNumber}/{totalQuestions}
        </div>
        <div className="flex items-center gap-6">
            {streak > 1 && (
                <div 
                    className="flex items-center gap-1 text-lg font-bold text-orange-500 animate-fade-in-fast"
                    title={`${streak} correct answers in a row!`}
                >
                    <FireIcon />
                    <span>{streak} Streak</span>
                </div>
            )}
            <div className="text-lg font-semibold text-slate-800">
                Total Score: <span className="font-bold text-indigo-600">{totalScore}</span>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600 select-none" id="mute-label">
            {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
          </span>
          <button
            onClick={() => setIsMuted(!isMuted)}
            type="button"
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isMuted ? 'bg-slate-300' : 'bg-blue-500'}`}
            role="switch"
            aria-checked={!isMuted}
            aria-label="Toggle spoken feedback"
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMuted ? 'translate-x-0' : 'translate-x-5'}`}
            />
          </button>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto pr-2">
        <div className="bg-blue-500/10 p-6 rounded-lg mb-4 flex items-start gap-4">
          <p className="text-xl font-medium text-slate-900 leading-relaxed flex-grow">{question.prompt}</p>
          <button
            onClick={() => speak(question.prompt)}
            className="flex-shrink-0 p-2 rounded-full text-blue-500 hover:bg-blue-200/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Read question aloud"
          >
            <VolumeUpIcon />
          </button>
        </div>
        
        <div className="relative">
          <textarea
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
            placeholder={isSpeechSupported ? "Click the mic to speak or type your answer here..." : "Type your answer here..."}
            className="w-full h-40 p-4 bg-white/70 border border-slate-300 text-slate-900 placeholder-slate-500 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            disabled={!!evaluationResult || isLoading}
          />
          {isSpeechSupported && (
            <button
              onClick={toggleRecording}
              disabled={!!evaluationResult || isLoading}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
              className={`absolute bottom-3 right-14 p-3 rounded-full transition-all transform ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-110'}`}
            >
              <MicIcon />
            </button>
          )}
          <button
            onClick={handleAnswerSubmit}
            disabled={!studentAnswer.trim() || !!evaluationResult || isLoading}
            aria-label="Submit answer"
            className="absolute bottom-3 right-3 p-3 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
                <SendIcon />
            )}
          </button>
        </div>

        {error && <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg">{error}</div>}

        {evaluationResult && (
          <div className="mt-6 p-5 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in-fast">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-slate-900">Feedback</h3>
                <div className={`text-lg font-bold px-4 py-1 rounded-full ${evaluationResult.isCorrect ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    Marks: <span className={scoreColor}>{evaluationResult.score}</span> / {question.maxMarks}
                </div>
            </div>
            <p className="text-slate-700 leading-relaxed mb-4">{evaluationResult.feedback}</p>

            {evaluationResult.missingConcepts.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                <h4 className="flex items-center gap-2 font-semibold text-yellow-800">
                  <LightbulbIcon />
                  Points to include:
                </h4>
                <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1 pl-2">
                  {evaluationResult.missingConcepts.map((concept, index) => (
                    <li key={index}>{concept}</li>
                  ))}
                </ul>
              </div>
            )}

            {evaluationResult.terminologyCorrections.length > 0 && (
              <div className="mt-4 p-3 bg-purple-50 border-l-4 border-purple-400 rounded-r-lg">
                <h4 className="flex items-center gap-2 font-semibold text-purple-800">
                  <PencilIcon />
                  Terminology suggestions:
                </h4>
                <ul className="list-disc list-inside text-slate-600 mt-2 space-y-1 pl-2">
                  {evaluationResult.terminologyCorrections.map((correction, index) => (
                    <li key={index}>{correction}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {evaluationResult.modelAnswerImprovement && (
              <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                <h4 className="flex items-center gap-2 font-semibold text-blue-800">
                  <SparklesIcon />
                  Example Improvement:
                </h4>
                <p className="text-blue-700 italic mt-1">"{evaluationResult.modelAnswerImprovement}"</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-200">
              <button
                onClick={handleShowCorrectAnswerToggle}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {showCorrectAnswer 
                  ? 'Hide Model Answer' 
                  : evaluationResult.isCorrect 
                    ? 'Compare with Model Answer' 
                    : 'Show Correct Answer'}
              </button>
              {showCorrectAnswer && (
                <div className="mt-2 p-3 bg-green-50/70 border-l-4 border-green-500 rounded-r-lg animate-fade-in-fast">
                  <h4 className="font-semibold text-green-800">Model Answer:</h4>
                  <p className="text-slate-800 mt-1">{question.canonicalAnswer}</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      <div className="mt-auto pt-4 flex justify-end">
        <button 
          onClick={() => onNext(!!evaluationResult)}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {questionNumber === totalQuestions ? 'Finish' : 'Next Question'}
          <NextIcon />
        </button>
      </div>
    </div>
  );
};

export default QuestionScreen;