import React, { useState } from 'react';
import { Question, EvaluationResult, Difficulty } from '../types';
import { CheckIcon, CrossIcon } from './Icons';

interface SummaryScreenProps {
  totalScore: number;
  maxPossibleScore: number;
  onRestart: () => void;
  sessionAnswers: Array<{ question: Question; result: EvaluationResult | null }>;
  difficulty: Difficulty | null;
}

const SummaryScreen: React.FC<SummaryScreenProps> = ({ totalScore, maxPossibleScore, onRestart, sessionAnswers, difficulty }) => {
  const [hoveredDifficulty, setHoveredDifficulty] = useState<Difficulty | null>(null);
  const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

  const getFeedbackMessage = () => {
    if (percentage >= 85) {
      return {
        title: "Fantastic Work!",
        message: "You have an excellent grasp of the concepts. Keep up the brilliant effort!",
        color: "text-green-500"
      };
    } else if (percentage >= 60) {
      return {
        title: "Great Effort!",
        message: "You're doing well and building a solid foundation. A little more revision will make you an expert.",
        color: "text-sky-500"
      };
    } else {
      return {
        title: "Keep Practicing!",
        message: "You're on the right track. Consistent practice and reviewing the feedback will surely boost your scores. Don't give up!",
        color: "text-orange-500"
      };
    }
  };

  const feedback = getFeedbackMessage();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in p-2 sm:p-6">
      <div className="w-full max-w-2xl p-6 sm:p-10 bg-white/50 backdrop-blur-lg border border-white/30 rounded-2xl shadow-xl">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Session Complete!</h2>
        <p className="text-slate-600 mb-8">Here's your performance summary.</p>
        
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto mb-8">
            <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                    className="text-slate-300/50"
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                <path
                    className={feedback.color}
                    strokeDasharray={`${percentage}, 100`}
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-slate-900">{percentage}%</span>
                <span className="text-lg text-slate-600">{totalScore} / {maxPossibleScore}</span>
            </div>
        </div>

        <h3 className={`text-2xl font-bold ${feedback.color.replace('text-', 'text-')} mb-2`}>{feedback.title}</h3>
        <p className="text-slate-700 mb-10">{feedback.message}</p>

        {/* Question by Question review */}
        <div className="w-full text-left my-10">
          <h4 className="text-xl font-bold text-slate-800 mb-4 text-center">Question Review</h4>
          <div className="max-h-[30vh] overflow-y-auto space-y-3 pr-2 border-t border-b border-slate-300/70 py-4">
            {sessionAnswers.map((answer, index) => (
              <div key={answer.question.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 transition-shadow hover:shadow-md">
                <div className="flex justify-between items-start gap-4">
                  <p className="font-semibold text-slate-800 flex-grow text-sm">
                    <span className="font-bold">Q{index + 1}:</span> {answer.question.prompt}
                  </p>
                  <div className="flex-shrink-0 flex items-center gap-2 text-sm font-medium text-slate-700">
                    {answer.result?.isCorrect ? <CheckIcon /> : <CrossIcon />}
                    <span className="font-bold">{answer.result?.score ?? 0}/{answer.question.maxMarks}</span>
                  </div>
                </div>
                {answer.result?.feedback && (
                  <p className="text-sm text-slate-600 mt-2 pt-2 border-t border-slate-200">
                    <strong>AI Feedback:</strong> {answer.result.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-full mb-10">
            <h4 className="text-xl font-bold text-slate-800 mb-4">Score by Difficulty</h4>
            <div className="flex justify-around items-end h-40 bg-slate-200/50 p-4 rounded-lg space-x-4 text-center">
                {Object.values(Difficulty).map((d) => {
                    const isCurrentDifficulty = d === difficulty;
                    const scorePercentage = isCurrentDifficulty ? percentage : 0;
                    return (
                        <div 
                            key={d} 
                            className="relative flex flex-col items-center w-1/3 h-full"
                            onMouseEnter={() => setHoveredDifficulty(d)}
                            onMouseLeave={() => setHoveredDifficulty(null)}
                        >
                            {hoveredDifficulty === d && (
                                <div className="absolute bottom-full mb-2 w-max px-3 py-2 text-sm font-medium text-white bg-slate-800 rounded-md shadow-lg transition-opacity duration-300 pointer-events-none z-10">
                                    {isCurrentDifficulty ? (
                                        <div className="text-left">
                                            <p><strong>Score:</strong> {percentage}%</p>
                                            <p><strong>Questions:</strong> {sessionAnswers.length}</p>
                                            <p><strong>Marks:</strong> {totalScore}/{maxPossibleScore}</p>
                                        </div>
                                    ) : (
                                        "Not played in this session"
                                    )}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-800"></div>
                                </div>
                            )}
                            <div className="w-full h-full flex items-end">
                                <div
                                    className={`w-full rounded-t-md transition-all duration-1000 ease-out ${isCurrentDifficulty ? 'bg-sky-500' : 'bg-slate-300'}`}
                                    style={{ height: `${scorePercentage}%` }}
                                ></div>
                            </div>
                            <span className={`mt-2 text-sm font-semibold ${isCurrentDifficulty ? 'text-sky-600 font-bold' : 'text-slate-500'}`}>
                                {d}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Practice Another Chapter
        </button>
      </div>
    </div>
  );
};

export default SummaryScreen;