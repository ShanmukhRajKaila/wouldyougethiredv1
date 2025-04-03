
export const topCompanies = [
  {
    id: 'mckinsey',
    name: 'McKinsey & Company',
    logo: '/placeholder.svg',
    values: ['Problem solving', 'Leadership', 'Entrepreneurship', 'Innovation'],
    defaultJobDescription: `Strategy Consultant
      
As a Strategy Consultant at McKinsey, you will work with global organizations on their most challenging issues, providing unique insight and driving impact. You'll collaborate with senior leaders and build strong client relationships, developing high-caliber deliverables that transform businesses.

Requirements:
• MBA or advanced degree from a top institution
• 3-5 years of professional experience
• Exceptional analytical and quantitative skills
• Outstanding leadership capabilities
• Strong communication and collaboration skills
• Proven track record of impact and achievement
• Ability to work in team settings and individually`
  },
  {
    id: 'bcg',
    name: 'Boston Consulting Group',
    logo: '/placeholder.svg',
    values: ['Client impact', 'Respect for the individual', 'Integrity', 'Diversity'],
    defaultJobDescription: `Management Consultant
      
As a Management Consultant at BCG, you will collaborate with clients to drive transformative change and create lasting competitive advantage. You'll analyze complex business problems, develop strategic recommendations, and work closely with executives to implement solutions that deliver measurable impact.

Requirements:
• MBA from a leading business school
• 2-5 years of professional experience
• Strong analytical abilities
• Exceptional problem-solving skills
• Excellent communication and interpersonal skills
• Proven leadership experience
• Collaborative approach and entrepreneurial mindset`
  },
  {
    id: 'bain',
    name: 'Bain & Company',
    logo: '/placeholder.svg',
    values: ['Results delivery', 'Pragmatism', 'Passion', 'Teamwork'],
    defaultJobDescription: `Associate Consultant
      
As an Associate Consultant at Bain, you will help solve complex business challenges for global clients across industries. You'll gather and analyze data, formulate insights, develop recommendations, and support implementation of strategic initiatives that create lasting impact.

Requirements:
• MBA or equivalent advanced degree
• 2-4 years of professional experience
• Exceptional analytical capabilities
• Strong problem-solving orientation
• Effective communication skills
• Leadership potential
• Team-oriented mindset
• Passion for delivering results`
  },
  {
    id: 'google',
    name: 'Google',
    logo: '/placeholder.svg',
    values: ['Innovation', 'User focus', 'Fast pace', 'Data-driven decisions'],
    defaultJobDescription: `Product Manager
      
As a Product Manager at Google, you will be responsible for building innovative products that serve billions of users. You'll work cross-functionally with engineering, design, and marketing teams to develop product strategy, define product requirements, and drive product launches.

Requirements:
• MBA or equivalent experience
• 3+ years of product management experience
• Technical background or experience working with technical concepts
• Strong analytical and problem-solving skills
• Excellent communication and leadership abilities
• Experience shipping consumer products
• Ability to thrive in ambiguity and fast-paced environments`
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logo: '/placeholder.svg',
    values: ['Customer obsession', 'Ownership', 'Innovation', 'High standards'],
    defaultJobDescription: `Senior Product Manager
      
As a Senior Product Manager at Amazon, you will own and drive product strategy for key business areas. You'll identify customer needs, set product vision, define roadmaps, and work with engineering and design teams to deliver exceptional customer experiences at scale.

Requirements:
• MBA from top program
• 5+ years of product management experience
• Data-driven decision-making approach
• Strong business acumen and technical capabilities
• Excellent problem-solving and analytical skills
• Proven track record of shipping successful products
• Customer-focused mindset
• Ability to influence and lead without authority`
  }
];

export const mockAnalysisResult = {
  success: true,
  company: 'BCG',
  role: 'Strategy Consultant',
  verdict: false, // false = not hired, true = hired
  alignmentScore: 60,
  strengths: [
    'Strong analytical background demonstrated through quantitative projects',
    'Excellent academic credentials from target institution',
    'International experience across multiple countries',
    'Technical skills including data analysis and financial modeling'
  ],
  weaknesses: [
    'Resume too operations-heavy, lacks client-facing leadership stories',
    'STAR stories not well framed—missing quantifiable results',
    'Limited evidence of team leadership in challenging environments',
    'Too much focus on technical skills rather than strategic problem solving'
  ],
  recommendations: [
    'Add bullet on managing ambiguity in cross-functional teams',
    'Quantify impact for each accomplishment (%, $, scale)',
    'Highlight client-facing experiences and results delivered',
    'Restructure bullets using clear STAR framework with emphasis on results',
    'Emphasize strategic thinking and business problem solving capabilities'
  ],
  starAnalysis: [
    {
      original: 'Led digital transformation initiative for financial services client',
      improved: 'Led 6-month digital transformation initiative for $2B financial services client, resulting in 30% cost reduction and 15% improvement in customer satisfaction scores',
      feedback: 'Missing specifics about situation, actions taken, and quantifiable results'
    },
    {
      original: 'Analyzed customer data to identify growth opportunities',
      improved: 'Analyzed 3TB of customer transaction data for retail banking client to identify $40M in cross-selling opportunities; developed and pitched strategy to C-suite that was implemented across 200+ branches',
      feedback: 'Lacks details on methodology, scale, and business impact'
    },
    {
      original: 'Managed team of analysts for strategic project',
      improved: "Recruited and managed cross-functional team of 8 analysts to deliver strategic market entry recommendation under tight 4-week deadline, resulting in successful $50M acquisition that expanded client's market share by 12%",
      feedback: 'Too vague; needs context, challenge overcome, and concrete outcomes'
    }
  ],
  tailoredResume: {
    name: 'John Smith',
    email: 'john.smith@mba2023.edu',
    phone: '(123) 456-7890',
    education: [
      {
        institution: 'Harvard Business School',
        degree: 'Master of Business Administration',
        date: '2021-2023',
        highlights: [
          'GMAT: 760, GPA: 3.8/4.0',
          'Honors: Baker Scholar (top 5% of class)',
          'Leadership: Consulting Club President, organized 15+ recruiting events with top firms'
        ]
      },
      {
        institution: 'University of Pennsylvania',
        degree: 'Bachelor of Science in Economics',
        date: '2014-2018',
        highlights: [
          'GPA: 3.7/4.0, magna cum laude',
          "Honors: Dean's List (all semesters)",
          'Activities: Investment Club, Debate Team'
        ]
      }
    ],
    experience: [
      {
        company: 'Goldman Sachs',
        role: 'Investment Banking Associate',
        date: '2018-2021',
        bullets: [
          'Led financial analysis for $500M merger between two fintech companies, creating detailed valuation models that enabled client to negotiate 15% higher acquisition price',
          'Managed due diligence process for 3 IPOs worth combined $2.5B, coordinating cross-functional teams of 12+ professionals to meet critical deadlines',
          'Developed strategic recommendation for retail client entering e-commerce space, resulting in successful platform launch that captured 8% market share within first year'
        ]
      },
      {
        company: 'Deloitte Consulting',
        role: 'Business Analyst',
        date: '2016-2018',
        bullets: [
          'Analyzed operational inefficiencies for Fortune 500 retail client, identifying $15M in cost savings opportunities through supply chain optimization',
          'Created dashboard visualizing key performance metrics for C-suite executives, enabling data-driven decision making that improved profitability by 12%',
          'Conducted market research across 5 countries to support global expansion strategy, resulting in successful entry into 2 new markets with $30M+ revenue potential'
        ]
      }
    ],
    skills: [
      'Strategic Analysis',
      'Financial Modeling',
      'Client Relationship Management',
      'Project Leadership',
      'Data Analytics (SQL, Python, Tableau)',
      'Cross-functional Team Leadership'
    ]
  }
};
