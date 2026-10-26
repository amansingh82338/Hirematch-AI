/**
 * Direct NLP Engine adapter.
 * Replaces all Google AI / Gemini dependencies with deterministic, embedded NLP models.
 */
export {
  extractJobDescription,
  parseResumeText,
  generateSpeechTTS,
  generateRecruitmentImage,
  chatWithTalentCopilot,
  isGeminiConfigured,
  isNlpEngineActive,
  tokenize,
  extractSkillMatches,
  SKILLS_TAXONOMY,
} from './nlpEngine';
