
/**
 * URL content extraction utility for job descriptions
 */
export class UrlExtractor {
  /**
   * Extract job details from a URL
   */
  async extractFromUrl(url: string): Promise<{
    companyName: string | null;
    jobDescription: string | null;
    jobTitle?: string | null;
    error?: string;
  }> {
    try {
      console.log('Extracting content from URL:', url);
      
      // In this simplified version, we'll return mock data
      // In production, this would perform actual HTTP requests and scraping
      
      // Simulate different responses based on the URL
      if (url.includes('linkedin.com')) {
        return {
          companyName: this.extractCompanyFromUrl(url) || 'LinkedIn Company',
          jobDescription: this.generateMockJobDescription('product manager'),
          jobTitle: 'Product Manager'
        };
      } else if (url.includes('indeed.com')) {
        return {
          companyName: 'Indeed Company',
          jobDescription: this.generateMockJobDescription('finance'),
          jobTitle: 'Finance Manager'
        };
      } else if (url.includes('glassdoor.com')) {
        return {
          companyName: 'Glassdoor Company',
          jobDescription: this.generateMockJobDescription('consulting'),
          jobTitle: 'Management Consultant'
        };
      } else if (url.includes('monster.com')) {
        return {
          companyName: 'Monster Company',
          jobDescription: this.generateMockJobDescription('marketing'),
          jobTitle: 'Marketing Director'
        };
      } else {
        return {
          companyName: 'Example Company',
          jobDescription: this.generateMockJobDescription('general'),
          jobTitle: 'Business Role'
        };
      }
    } catch (error) {
      console.error('Error extracting content from URL:', error);
      return { 
        companyName: null, 
        jobDescription: null,
        jobTitle: null,
        error: error instanceof Error ? error.message : 'Failed to extract content from the provided URL'
      };
    }
  }
  
  /**
   * Extract company name from URL
   */
  private extractCompanyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // For LinkedIn URLs
      if (hostname.includes('linkedin.com')) {
        // Example: https://www.linkedin.com/company/acme-corp/
        if (url.includes('/company/')) {
          const companyPath = url.split('/company/')[1].split('/')[0];
          return this.formatCompanyName(companyPath);
        }
        
        // For job postings, find "at Company" in the URL
        if (url.includes('/jobs/view/')) {
          // Check if there's a company name in the URL path
          const atCompanyMatch = urlObj.pathname.match(/at-([\w-]+)/i);
          if (atCompanyMatch && atCompanyMatch[1]) {
            return this.formatCompanyName(atCompanyMatch[1]);
          }
        }
      } 
      
      // For other job boards
      const domain = hostname.replace('www.', '').split('.')[0];
      if (!['linkedin', 'indeed', 'glassdoor', 'monster', 'jobs'].includes(domain)) {
        return this.formatCompanyName(domain);
      }
      
      return null;
    } catch (e) {
      console.error('Error parsing URL:', e);
      return null;
    }
  }
  
  /**
   * Format company name from URL slug
   */
  private formatCompanyName(name: string): string {
    if (!name) return '';
    
    // Replace hyphens and underscores with spaces
    let formatted = name.replace(/[-_]/g, ' ');
    
    // Capitalize words
    formatted = formatted.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    return formatted;
  }

  /**
   * Generate mock job descriptions for testing
   */
  private generateMockJobDescription(role: string): string {
    const descriptions = {
      'product manager': `
# Product Manager

## About the Role
We're looking for an experienced Product Manager to drive the vision and execution of our core products. You'll work closely with engineering, design, and business teams to deliver exceptional user experiences.

## Responsibilities
- Lead the product development lifecycle from conception to launch
- Define product strategy, roadmap, and requirements
- Work with cross-functional teams to deliver high-quality products
- Analyze market trends and competitive landscape
- Make data-driven decisions using qualitative and quantitative insights

## Requirements
- 5+ years of product management experience
- MBA or equivalent advanced degree preferred
- Strong analytical and problem-solving skills
- Excellent communication and stakeholder management abilities
- Experience with agile development methodologies
      `,
      'finance': `
# Finance Manager

## About the Role
Join our Finance team to help drive financial planning, analysis, and strategic decision-making across the organization.

## Responsibilities
- Develop and maintain financial models and forecasts
- Lead annual budgeting and quarterly forecasting processes
- Provide financial analysis to support strategic decisions
- Partner with business leaders to optimize financial performance
- Manage month-end close process and financial reporting

## Requirements
- MBA with concentration in Finance or equivalent
- 7+ years of finance experience, preferably in a multinational company
- Advanced Excel, financial modeling, and data analysis skills
- Experience with financial systems and ERP software
- CFA or CPA certification preferred
      `,
      'consulting': `
# Management Consultant

## About the Role
We're seeking exceptional problem solvers to join our consulting team, helping clients address their most complex business challenges.

## Responsibilities
- Lead client engagements and manage project workstreams
- Analyze business problems and develop strategic recommendations
- Present findings and recommendations to executive stakeholders
- Manage client relationships and identify growth opportunities
- Mentor junior consultants and contribute to practice development

## Requirements
- MBA or advanced degree from a top-tier institution
- 3-5 years of consulting experience or relevant industry expertise
- Strong analytical and quantitative skills
- Excellent communication and presentation abilities
- Willingness to travel (up to 80%)
      `,
      'marketing': `
# Marketing Director

## About the Role
Lead our marketing team in developing and executing strategies that drive brand awareness, customer acquisition, and revenue growth.

## Responsibilities
- Develop comprehensive marketing strategies and campaigns
- Manage brand positioning and messaging across channels
- Lead a team of marketing specialists across digital, content, and events
- Set marketing KPIs and analyze performance
- Manage marketing budget and optimize ROI

## Requirements
- MBA with marketing focus or equivalent
- 8+ years of progressive marketing experience
- Experience managing integrated marketing campaigns
- Data-driven approach to marketing strategy
- Strong leadership and team management skills
      `,
      'general': `
# Business Role

## About the Role
Join our team in this strategic role that combines business strategy, operational excellence, and leadership.

## Responsibilities
- Drive strategic initiatives across the organization
- Analyze business performance and identify opportunities
- Collaborate with cross-functional teams on key projects
- Develop and present recommendations to senior leadership
- Manage resources and timelines for critical projects

## Requirements
- MBA or equivalent business degree
- 5+ years of relevant professional experience
- Strong analytical and strategic thinking skills
- Excellent communication and stakeholder management
- Ability to lead through influence and drive results
      `
    };

    return descriptions[role] || descriptions['general'];
  }
}
