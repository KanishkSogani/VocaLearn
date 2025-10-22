import { Request, Response } from "express";
import { getSupportedLanguageCodes, supportedLanguages } from "../utils/languages";

export const getSupportedLanguages = (req: Request, res: Response) => {
  res.json({
    languages: supportedLanguages,
    codes: getSupportedLanguageCodes()
  });
};


export const startPracticeSession = (req: Request, res: Response): any => {
  const { mode, learningLanguage, nativeLanguage } = req.body;
  
  if (!["echo", "dialogue", "quiz"].includes(mode)) {
    return res.status(400).json({ error: "Invalid mode" });
  }
  
  const supportedCodes = getSupportedLanguageCodes();
  if (!learningLanguage || !nativeLanguage) {
    return res.status(400).json({ error: "Missing languages" });
  }
  
  if (!supportedCodes.includes(learningLanguage) || !supportedCodes.includes(nativeLanguage)) {
    return res.status(400).json({ 
      error: "Unsupported language", 
      supportedLanguages: supportedCodes 
    });
  }
  
  return res.json({
    sessionId: Date.now().toString(),
    mode,
    learningLanguage,
    nativeLanguage,
  });
};
