
/**
 * Count job-related keywords in text
 */
export function countJobKeywords(text: string): number {
  const keywords = [
    'experience', 'skills', 'requirements', 'qualifications', 
    'responsibilities', 'job', 'position', 'role', 'work',
    'candidate', 'applicant', 'team', 'salary', 'benefits'
  ];
  
  const lowerText = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    return count + (lowerText.match(new RegExp(keyword, 'g')) || []).length;
  }, 0);
}

/**
 * Convert HTML to plain text with better formatting
 */
export function convertHtmlToText(html: string): string {
  if (!html) return '';
  
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n')
    .replace(/<\/p>\s*<p/gi, '</p>\n<p')
    .replace(/<\/div>\s*<div/gi, '</div>\n<div')
    .replace(/<\/h[1-6]>\s*<(?!h[1-6])/gi, '</h$1>\n<')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '—')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Helper function to detect content patterns for debugging
 */
export function detectContentPatterns(html: string) {
  const patterns = {
    hasJobDescriptionClass: html.includes('job-description') || html.includes('jobDescription'),
    hasDescriptionClass: html.includes('description'),
    hasDetailsClass: html.includes('details'),
    hasJobPostingSchema: html.includes('JobPosting'),
    iframeCount: (html.match(/<iframe/g) || []).length,
    scriptCount: (html.match(/<script/g) || []).length,
    divCount: (html.match(/<div/g) || []).length,
    mainContentGuess: html.includes('main-content') ? 'main-content' : 
                      html.includes('content-main') ? 'content-main' : 
                      html.includes('job-content') ? 'job-content' : 'unknown',
    hasLoginForms: html.includes('login') || html.includes('signin') || html.includes('sign in'),
    hasAccessRestriction: html.includes('access denied') || html.includes('access restricted')
  };
  
  return patterns;
}

/**
 * Categorize text into sections like requirements, responsibilities, etc.
 */
export function categorizeSections(text: string) {
  const sections: Record<string, string[]> = {
    requirements: [],
    responsibilities: [],
    qualifications: [],
    benefits: [],
    about: [],
    other: []
  };
  
  // Split by common section headers
  const lines = text.split('\n');
  let currentSection = 'other';
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detect section headers
    if (lowerLine.includes('requirement') || lowerLine.includes('what you need')) {
      currentSection = 'requirements';
      continue;
    } else if (lowerLine.includes('responsibilit') || lowerLine.includes('what you will do')) {
      currentSection = 'responsibilities';
      continue;
    } else if (lowerLine.includes('qualif') || lowerLine.includes('skills') || lowerLine.includes('experience')) {
      currentSection = 'qualifications';
      continue;
    } else if (lowerLine.includes('benefit') || lowerLine.includes('perks') || lowerLine.includes('what we offer')) {
      currentSection = 'benefits';
      continue;
    } else if (lowerLine.includes('about') && (lowerLine.includes('us') || lowerLine.includes('company'))) {
      currentSection = 'about';
      continue;
    }
    
    // Add content to current section
    if (line.trim()) {
      sections[currentSection].push(line.trim());
    }
  }
  
  return sections;
}

/**
 * Extract the most relevant sections from multiple job descriptions
 */
export function extractRelevantSections(descriptions: string[]): Record<string, string> {
  const allSections: Record<string, string[]> = {
    requirements: [],
    responsibilities: [],
    qualifications: [],
    benefits: [],
    about: [],
    summary: []
  };
  
  // Process each description and collect sections
  for (const description of descriptions) {
    const sections = categorizeSections(description);
    
    // Add sections to our collection
    for (const [key, lines] of Object.entries(sections)) {
      if (key in allSections && lines.length > 0) {
        allSections[key].push(...lines);
      }
    }
    
    // Extract potential summary (first paragraph)
    const firstParagraph = description.split('\n\n')[0];
    if (firstParagraph && firstParagraph.length > 50 && firstParagraph.length < 500) {
      allSections.summary.push(firstParagraph);
    }
  }
  
  // Deduplicate and select best content for each section
  const result: Record<string, string> = {};
  
  for (const [key, lines] of Object.entries(allSections)) {
    if (lines.length === 0) continue;
    
    // Remove duplicates and similar lines
    const uniqueLines = [...new Set(lines)];
    
    // Limit section size
    const selectedLines = uniqueLines.slice(0, 10);
    result[key] = selectedLines.join('\n\n');
  }
  
  return result;
}
