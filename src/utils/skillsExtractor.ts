
export const cleanSkillName = (skillText: string): string => {
  return skillText
    .replace(/lacks (specific )?(mention of |experience in |knowledge of )?/ig, '')
    .replace(/which (could|would|might|may) be /ig, '')
    .replace(/important for this role\.?/ig, '')
    .replace(/beneficial for this position\.?/ig, '')
    .replace(/according to the job description\.?/ig, '')
    .replace(/as mentioned in the job requirements\.?/ig, '')
    .replace(/is not mentioned in your resume\.?/ig, '')
    .replace(/not highlighted in your experience\.?/ig, '')
    .replace(/\.$/g, '')
    .trim();
};

export const extractSkillsFromWeaknesses = (weaknesses: string[]): string[] => {
  return weaknesses
    .filter(weakness => 
      weakness.toLowerCase().includes('skill') || 
      weakness.toLowerCase().includes('experience') ||
      weakness.toLowerCase().includes('knowledge')
    )
    .flatMap(weakness => {
      const cleaned = cleanSkillName(weakness);
      return cleaned.split(/(?:,|\sand\s)+/)
        .map(s => s.trim())
        .filter(s => s.length > 2)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1));
    });
};
