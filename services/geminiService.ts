import { GoogleGenAI, Type } from '@google/genai';
import { Question, EvaluationResult } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const evaluationSchema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: 'The score awarded to the student, from 0 to the maxMarks.',
    },
    feedback: {
      type: Type.STRING,
      description: 'A friendly, constructive summary paragraph. If the answer is good, praise them. If it\'s partially correct, explain which parts are right and what\'s wrong. If it\'s incorrect, provide a clear explanation of the concept.',
    },
    missingConcepts: {
        type: Type.ARRAY,
        description: "A list of specific, key concepts or points from the canonical answer that the student missed. For example: 'Forgot to mention the role of the diaphragm'. If nothing is missing, return an empty array.",
        items: { type: Type.STRING }
    },
    terminologyCorrections: {
        type: Type.ARRAY,
        description: "A list of specific terminology corrections. Each string should be in the format 'Instead of \"[student's term]\", try using \"[correct term]\".' If no corrections are needed, return an empty array.",
        items: { type: Type.STRING }
    },
    modelAnswerImprovement: {
        type: Type.STRING,
        description: "A concrete suggestion for improvement, such as an improved sentence or a hint to focus on a particular detail. If the answer is excellent, this can be an empty string."
    },
    isCorrect: {
      type: Type.BOOLEAN,
      description: 'True if the score is at least 75% of the maximum possible score.'
    },
  },
  required: ['score', 'feedback', 'isCorrect', 'missingConcepts', 'terminologyCorrections', 'modelAnswerImprovement'],
};

export const evaluateAnswer = async (question: Question, studentAnswer: string): Promise<EvaluationResult> => {
  const prompt = `
    You are an expert CBSE Class 11 academic coach. Your task is to evaluate a student's answer to a question based on CBSE standards.
    Provide a score and specific, constructive feedback designed to help the student learn and improve. The maximum possible score is ${question.maxMarks}.

    **Evaluation Criteria (CBSE Class 11 Standards):**
    1.  **Conceptual Accuracy (50% weight):** Is the answer factually correct and aligned with the core concepts in the canonical answer? Minor inaccuracies should be penalized.
    2.  **Completeness & Key Points (25% weight):** Does the answer cover all the essential parts, definitions, and examples required for the given marks?
    3.  **Scientific Terminology & Precision (15% weight):** Does the student use precise, appropriate scientific terms expected at the CBSE Class 11 level? Avoids vague or colloquial language.
    4.  **Clarity & Structure (10% weight):** Is the explanation clear, concise, and logically structured? For questions worth more than 2 marks, look for a well-organized answer.

    **Question:**
    "${question.prompt}"

    **Canonical Answer (for your reference, do not just repeat this):**
    "${question.canonicalAnswer}"

    **Student's Answer:**
    "${studentAnswer}"

    **Your Task:**
    Analyze the student's answer based on the criteria above.
    Return a JSON object with the following structure:
    - "score": A number between 0 and ${question.maxMarks}, rounded to the nearest integer, reflecting the weighted criteria.
    - "feedback": A friendly, constructive summary paragraph. Start by acknowledging the student's effort. If the answer is good, praise them and highlight what made it strong. If it's partially correct, explain which parts are right and then clearly explain the parts that are incorrect or incomplete. If the answer is mostly incorrect, provide a clear, step-by-step explanation of the correct concept, gently correcting the main misconception. The goal is to teach, not just to grade.
    - "missingConcepts": A list of key concepts, definitions, or examples from the canonical answer that the student missed entirely. Be specific. For example, instead of "missed the second part", say "Forgot to mention the role of the diaphragm in inhalation". If nothing is missing, return an empty array.
    - "terminologyCorrections": A list of specific terminology corrections. Each string should be in the format 'Instead of "[student's term]", try using "[correct term]".' If no corrections are needed, return an empty array.
    - "modelAnswerImprovement": A concrete suggestion for how the student could improve their answer next time. This could be an improved sentence, a hint to focus on a particular detail, or a suggestion to structure the answer differently. For example: "A great way to improve this would be to start with the definition of...". If the answer is excellent, this can be an empty string.
    - "isCorrect": A boolean, which should be true if the calculated score is 75% or more of the maxMarks.

    If the student's answer is empty or nonsensical, give a score of 0, provide appropriate feedback explaining why, and return empty arrays for the other lists.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: evaluationSchema,
        temperature: 0.3,
      },
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    // Basic validation
    if (typeof result.score !== 'number' || typeof result.feedback !== 'string' || typeof result.isCorrect !== 'boolean' || !Array.isArray(result.missingConcepts) || !Array.isArray(result.terminologyCorrections) || typeof result.modelAnswerImprovement !== 'string') {
        throw new Error('Invalid JSON response structure from API.');
    }

    return {
      score: Math.max(0, Math.min(question.maxMarks, Math.round(result.score))),
      feedback: result.feedback,
      isCorrect: result.isCorrect,
      missingConcepts: result.missingConcepts,
      terminologyCorrections: result.terminologyCorrections,
      modelAnswerImprovement: result.modelAnswerImprovement,
    };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get evaluation from AI service.");
  }
};