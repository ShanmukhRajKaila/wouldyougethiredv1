
/**
 * Count job-related keywords in text
 */
export function countJobKeywords(text: string): number {
  const keywords = [
    'experience', 'skills', 'requirements', 'qualifications', 
    'responsibilities', 'job', 'position', 'role', 'work',
    'candidate', 'applicant', 'team', 'salary', 'benefits',
    'degree', 'education', 'bachelor', 'masters', 'phd',
    'expertise', 'ability', 'duties', 'background', 'year',
    'knowledge', 'understanding', 'proficiency', 'ability'
  ];
  
  const lowerText = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    return count + (lowerText.match(new RegExp('\\b' + keyword + '\\b', 'g')) || []).length;
  }, 0);
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
 * Improved function to convert HTML to plain text with better formatting
 */
export function convertHtmlToText(html: string): string {
  if (!html) return '';
  
  return html
    // Preserve line breaks for certain elements
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p/gi, '</p>\n<p')
    .replace(/<\/div>\s*<div/gi, '</div>\n<div')
    .replace(/<\/h[1-6]>\s*<(?!h[1-6])/gi, '</h$1>\n<')
    
    // Format list items as bullet points
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n')
    
    // Preserve headers
    .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '\n$1\n')
    
    // Handle tables
    .replace(/<\/tr>\s*<tr/gi, '</tr>\n<tr')
    .replace(/<\/td>\s*<td/gi, '</td> | <td')
    
    // Remove all HTML tags
    .replace(/<[^>]+>/g, '')
    
    // Fix common HTML entities
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
    
    // Remove consecutive line breaks and spaces
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    
    // Final trim
    .trim();
}

/**
 * Extract section from text using common section headers
 */
export function extractSection(text: string, sectionName: string): string | null {
  const sectionPatterns: Record<string, RegExp[]> = {
    'responsibilities': [
      /responsibilities:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nrequirements|\nqualifications|\nabout|\ncompany|\nbenefits|$)/i,
      /duties:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nrequirements|\nqualifications|\nabout|\ncompany|\nbenefits|$)/i,
      /what you['']?ll do:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nrequirements|\nqualifications|\nabout|\ncompany|\nbenefits|$)/i
    ],
    'requirements': [
      /requirements:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nresponsibilities|\nduties|\nabout|\ncompany|\nbenefits|$)/i,
      /qualifications:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nresponsibilities|\nduties|\nabout|\ncompany|\nbenefits|$)/i,
      /what you['']?ll need:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nresponsibilities|\nduties|\nabout|\ncompany|\nbenefits|$)/i
    ],
    'skills': [
      /skills:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nresponsibilities|\nduties|\nabout|\ncompany|\nbenefits|$)/i,
      /expertise:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nresponsibilities|\nduties|\nabout|\ncompany|\nbenefits|$)/i
    ],
    'about': [
      /about:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nresponsibilities|\nduties|\nrequirements|\nskills|$)/i,
      /overview:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nresponsibilities|\nduties|\nrequirements|\nskills|$)/i,
      /summary:?([\s\S]*?)(?=\n\s*\n|\n[A-Z][^a-z]|\n[A-Z][a-z]+:|\n\d+\.|\nresponsibilities|\nduties|\nrequirements|\nskills|$)/i
    ]
  };
  
  const patterns = sectionPatterns[sectionName.toLowerCase()];
  if (!patterns) return null;
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 20) {
      return match[1].trim();
    }
  }
  
  return null;
}
