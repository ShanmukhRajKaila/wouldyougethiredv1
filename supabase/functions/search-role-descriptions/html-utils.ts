
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
