
import { useState, useEffect } from 'react';
import { cleanSkillName, extractSkillsFromWeaknesses } from '../utils/skillsExtractor';

interface AnalysisResults {
  weaknesses?: string[];
  recommendations?: string[];
  [key: string]: any;
}

export const useSkillsAnalysis = (
  resumeText: string,
  jobDescription: string | null,
  analysisResults: AnalysisResults | null
) => {
  const [missingSkills, setMissingSkills] = useState<string[]>([]);

  useEffect(() => {
    if (resumeText && jobDescription) {
      identifyMissingSkills(resumeText, jobDescription, analysisResults);
    }
  }, [resumeText, jobDescription, analysisResults]);

  const identifyMissingSkills = (
    resumeText: string,
    jobDesc: string,
    analysisResults: AnalysisResults | null
  ) => {
    // First try to get skills from analysis results
    if (analysisResults?.weaknesses) {
      const skillWeaknesses = analysisResults.weaknesses.filter(weakness => 
        weakness.toLowerCase().includes('skill') || 
        weakness.toLowerCase().includes('experience') ||
        weakness.toLowerCase().includes('knowledge')
      );
      
      if (skillWeaknesses.length > 0) {
        const extractedSkills = skillWeaknesses.flatMap(weakness => {
          const cleaned = cleanSkillName(weakness);
          return cleaned.split(/(?:,|\sand\s)+/)
            .map(s => s.trim())
            .filter(s => s.length > 2)
            .map(s => s.charAt(0).toUpperCase() + s.slice(1));
        });
        
        // If we have enough skills from the analysis, use them
        if (extractedSkills.length >= 3) {
          setMissingSkills(extractedSkills);
          return;
        }
      }
    }
    
    // Common skills to check for if we need more skills
    const commonSkills = [
      { term: "stakeholder management", alias: ["stakeholder", "stakeholders", "relationship management"] },
      { term: "data science", alias: ["data scientist", "data analysis", "data analytics"] },
      { term: "commercial acumen", alias: ["business acumen", "commercial sense", "business sense"] },
      { term: "ai models", alias: ["artificial intelligence", "machine learning models", "ml models"] },
      { term: "data modeling", alias: ["data modelling", "data model", "database design"] },
      { term: "communication skills", alias: ["communicator", "verbal communication", "written communication"] },
      { term: "cross-functional collaboration", alias: ["cross-departmental", "cross functional", "team collaboration"] },
      { term: "leadership", alias: ["team leadership", "people management", "managing teams"] },
      { term: "project management", alias: ["project coordination", "project delivery", "program management"] },
      { term: "strategic thinking", alias: ["strategic planning", "strategy development", "strategic vision"] },
      { term: "problem solving", alias: ["analytical thinking", "critical thinking", "solutions development"] },
      { term: "agile methodology", alias: ["scrum", "kanban", "sprint planning"] },
      { term: "technical expertise", alias: ["technical skills", "technical knowledge", "subject matter expertise"] },
      { term: "data analysis", alias: ["data interpretation", "statistical analysis", "data insights"] },
      { term: "client relations", alias: ["customer service", "client management", "account management"] }
    ];
    
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDesc.toLowerCase();
    
    const missing = commonSkills.filter(skill => {
      const inJobDesc = jobLower.includes(skill.term) || 
                         skill.alias.some(alias => jobLower.includes(alias));
      
      const inResume = resumeLower.includes(skill.term) || 
                       skill.alias.some(alias => resumeLower.includes(alias));
      
      return inJobDesc && !inResume;
    }).map(skill => skill.term);
    
    // Combine extracted skills from weaknesses (if any) with missing skills from common skills check
    const existingSkills = analysisResults?.weaknesses 
      ? extractSkillsFromWeaknesses(analysisResults.weaknesses)
      : [];
    
    const combinedSkills = [...existingSkills, ...missing];
    
    // Ensure we show at least 3 skills if possible
    if (combinedSkills.length < 3) {
      // If we still don't have enough skills, add some generic important skills
      const genericImportantSkills = ["stakeholder management", "communication skills", "data analysis"]
        .filter(skill => !combinedSkills.includes(skill))
        .filter(skill => jobLower.includes(skill) || jobLower.includes(skill.replace(" ", "")));
      
      combinedSkills.push(...genericImportantSkills);
    }
    
    // Deduplicate and limit to a reasonable number
    const uniqueSkills = [...new Set(combinedSkills)];
    setMissingSkills(uniqueSkills.slice(0, 7)); // Show up to 7 skills maximum
  };

  return { missingSkills };
};
