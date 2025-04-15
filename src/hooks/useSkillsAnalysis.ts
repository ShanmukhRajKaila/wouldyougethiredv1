
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
    // Enhanced skill extraction from analysis results
    if (analysisResults?.weaknesses) {
      const skillWeaknesses = analysisResults.weaknesses.filter(weakness => 
        weakness.toLowerCase().includes('skill') || 
        weakness.toLowerCase().includes('experience') ||
        weakness.toLowerCase().includes('knowledge') ||
        weakness.toLowerCase().includes('proficiency') ||
        weakness.toLowerCase().includes('ability') ||
        weakness.toLowerCase().includes('competency')
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
    
    // Enhanced skill detection for deep skill matching
    const technicalSkills = [
      { term: "python", alias: ["python programming", "python development", "python scripting"] },
      { term: "javascript", alias: ["js", "js development", "javascript programming", "javascript framework"] },
      { term: "typescript", alias: ["ts", "typescript programming", "typed javascript"] },
      { term: "react", alias: ["reactjs", "react framework", "react development"] },
      { term: "node.js", alias: ["nodejs", "node", "node development", "server-side javascript"] },
      { term: "java", alias: ["java programming", "core java", "java development"] },
      { term: "c#", alias: ["c sharp", "csharp", ".net", "dotnet"] },
      { term: "sql", alias: ["database", "rdbms", "mysql", "postgresql", "sql server"] },
      { term: "nosql", alias: ["mongodb", "dynamodb", "cosmosdb", "document database"] },
      { term: "aws", alias: ["amazon web services", "aws cloud", "amazon cloud"] },
      { term: "azure", alias: ["microsoft azure", "azure cloud", "microsoft cloud"] },
      { term: "gcp", alias: ["google cloud", "google cloud platform"] },
      { term: "docker", alias: ["containerization", "docker container", "container"] },
      { term: "kubernetes", alias: ["k8s", "container orchestration", "k8s orchestration"] },
      { term: "terraform", alias: ["infrastructure as code", "iac", "tf"] },
      { term: "ci/cd", alias: ["continuous integration", "continuous delivery", "devops pipeline"] },
    ];
    
    const businessSkills = [
      { term: "stakeholder management", alias: ["stakeholder", "stakeholders", "relationship management"] },
      { term: "agile methodology", alias: ["agile", "scrum", "kanban", "sprint planning"] },
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
      { term: "technical expertise", alias: ["technical skills", "technical knowledge", "subject matter expertise"] },
      { term: "data analysis", alias: ["data interpretation", "statistical analysis", "data insights"] },
      { term: "client relations", alias: ["customer service", "client management", "account management"] }
    ];
    
    // Combine all skill categories for deep analysis
    const allSkills = [...technicalSkills, ...businessSkills];
    
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDesc.toLowerCase();
    
    // Enhanced skill matching that distinguishes between required and nice-to-have skills
    const requiredMissing: string[] = [];
    const optionalMissing: string[] = [];
    
    // Look for "required" skills patterns in job description
    const requiredSection = jobLower.match(/(?:requirements|required skills|required experience|qualifications|what you'll need)(?:[\s\S]*?)(?:preferred|desired|nice to have|plus|bonus|about us|benefits|what we offer|why join|company description|apply|application process|$)/i);
    const requiredText = requiredSection ? requiredSection[0] : jobLower;
    
    // Look for "nice to have" skills patterns
    const preferredSection = jobLower.match(/(?:preferred|desired|nice to have|plus|bonus)(?:[\s\S]*?)(?:about us|benefits|what we offer|why join|company description|apply|application process|$)/i);
    const preferredText = preferredSection ? preferredSection[0] : "";
    
    allSkills.forEach(skill => {
      const inResume = resumeLower.includes(skill.term) || 
                     skill.alias.some(alias => resumeLower.includes(alias));
      
      // Skip if the skill is already in the resume
      if (inResume) return;
      
      const inRequiredSection = requiredText.includes(skill.term) || 
                             skill.alias.some(alias => requiredText.includes(alias));
      
      const inPreferredSection = preferredText && (preferredText.includes(skill.term) || 
                               skill.alias.some(alias => preferredText.includes(alias)));
      
      const inJobDesc = jobLower.includes(skill.term) || 
                      skill.alias.some(alias => jobLower.includes(alias));
      
      if (inRequiredSection) {
        requiredMissing.push(skill.term);
      } else if ((inPreferredSection || inJobDesc) && !inRequiredSection) {
        optionalMissing.push(skill.term);
      }
    });
    
    // Prioritize required skills, then add optional skills if needed
    const prioritizedSkills = [...requiredMissing];
    
    // If we don't have enough required skills, add some optional skills
    if (prioritizedSkills.length < 5 && optionalMissing.length > 0) {
      prioritizedSkills.push(...optionalMissing.slice(0, 5 - prioritizedSkills.length));
    }
    
    // If we still don't have enough skills, look for keyword patterns in job description
    if (prioritizedSkills.length < 3) {
      // Look for skill patterns like "proficient in X" or "experience with Y"
      const skillPatterns = [
        /experience (?:with|in) ([\w\s,]+)/gi,
        /proficient (?:with|in) ([\w\s,]+)/gi,
        /knowledge of ([\w\s,]+)/gi,
        /familiar with ([\w\s,]+)/gi,
        /background in ([\w\s,]+)/gi,
        /expertise in ([\w\s,]+)/gi
      ];
      
      for (const pattern of skillPatterns) {
        const matches = [...jobDesc.matchAll(pattern)];
        for (const match of matches) {
          if (match[1]) {
            const extraSkill = match[1].trim().split(/,|\sand\s/)[0].trim();
            if (extraSkill && extraSkill.length > 3 && !resumeLower.includes(extraSkill.toLowerCase())) {
              // Format skill with first letter capitalized
              const formattedSkill = extraSkill.charAt(0).toUpperCase() + extraSkill.slice(1);
              if (!prioritizedSkills.includes(formattedSkill)) {
                prioritizedSkills.push(formattedSkill);
              }
              
              // Break if we have enough skills
              if (prioritizedSkills.length >= 5) break;
            }
          }
        }
        
        if (prioritizedSkills.length >= 5) break;
      }
    }
    
    // Combine with any existing skills from weaknesses analysis
    const existingSkills = analysisResults?.weaknesses 
      ? extractSkillsFromWeaknesses(analysisResults.weaknesses)
      : [];
    
    const combinedSkills = [...existingSkills, ...prioritizedSkills];
    
    // Ensure we have at least 3 skills if possible
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
