import React, { useState, useMemo } from 'react';
import { SUBJECTS } from '../data/questions';
import { Difficulty } from '../types';

interface SetupScreenProps {
  onStartQuiz: (subject: string, chapter: string, difficulty: Difficulty) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStartQuiz }) => {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');

  const subjects = Object.keys(SUBJECTS);
  const chapters = useMemo(() => {
    return selectedSubject ? SUBJECTS[selectedSubject].chapters.map(c => c.name) : [];
  }, [selectedSubject]);

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubject(e.target.value);
    setSelectedChapter('');
  };
  
  const handleChapterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChapter(e.target.value);
  };
  
  const handleDifficultyClick = (difficulty: Difficulty) => {
    if (selectedSubject && selectedChapter) {
      onStartQuiz(selectedSubject, selectedChapter, difficulty);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">
          CBSE Class 11 AI Tutor
        </h1>
        <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
          Choose your subject and chapter to begin a voice-based practice session with AI feedback.
        </p>
      </header>
      
      <div className="w-full max-w-lg p-8 space-y-6 bg-white/50 backdrop-blur-lg border border-white/30 rounded-2xl shadow-xl">
        <div className="space-y-2">
          <label htmlFor="subject-select" className="text-sm font-medium text-slate-700">Choose your subject</label>
          <select 
            id="subject-select"
            value={selectedSubject}
            onChange={handleSubjectChange}
            className="w-full px-4 py-3 bg-sky-50 text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
          >
            <option value="">Select a subject...</option>
            {subjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
          </select>
        </div>

        {selectedSubject && (
          <div className="space-y-2 animate-fade-in-fast">
            <label htmlFor="chapter-select" className="text-sm font-medium text-slate-700">Choose your chapter</label>
            <select
              id="chapter-select"
              value={selectedChapter}
              onChange={handleChapterChange}
              className="w-full px-4 py-3 bg-sky-50 text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
            >
              <option value="">Select a chapter...</option>
              {chapters.map(chapter => <option key={chapter} value={chapter}>{chapter}</option>)}
            </select>
          </div>
        )}

        {selectedChapter && (
          <div className="pt-4 animate-fade-in">
            <h3 className="text-center font-medium text-slate-700 mb-4">Select Difficulty</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(Object.keys(Difficulty) as Array<keyof typeof Difficulty>).map(key => (
                <button
                  key={key}
                  onClick={() => handleDifficultyClick(Difficulty[key])}
                  className="w-full py-4 text-lg font-semibold text-white rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:ring-indigo-500"
                >
                  {Difficulty[key]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupScreen;