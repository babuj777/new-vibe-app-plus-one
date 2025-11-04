export enum Difficulty {
  Basic = 'Basic',
  Medium = 'Medium',
  Difficult = 'Difficult',
}

export interface Question {
  id: string;
  prompt: string;
  canonicalAnswer: string;
  maxMarks: number;
}

export interface Chapter {
  name: string;
  questions: {
    [Difficulty.Basic]: Question[];
    [Difficulty.Medium]: Question[];
    [Difficulty.Difficult]: Question[];
  };
}

export interface Subject {
  name: string;
  chapters: Chapter[];
}

export type SubjectsData = {
  [key: string]: Subject;
};

export interface EvaluationResult {
  score: number;
  feedback: string;
  isCorrect: boolean;
  missingConcepts: string[];
  terminologyCorrections: string[];
  modelAnswerImprovement: string;
}