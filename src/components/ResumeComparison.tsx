
import React, { useState } from 'react';
import { mockAnalysisResult } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StarAnalysisItem {
  original: string;
  improved: string;
  feedback: string;
}

interface ResumeComparisonProps {
  starAnalysis: StarAnalysisItem[];
}

const ResumeComparison: React.FC<ResumeComparisonProps> = ({ starAnalysis }) => {
  const [activeTab, setActiveTab] = useState<string>('original');
  
  // Ensure starAnalysis is properly initialized
  const validStarAnalysis = Array.isArray(starAnalysis) ? starAnalysis : [];
  
  const renderResume = (tailored: boolean) => {
    const { tailoredResume } = mockAnalysisResult;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{tailoredResume.name}</h1>
          <p className="text-consulting-gray">{tailoredResume.email} | {tailoredResume.phone}</p>
        </div>
        
        <div>
          <h2 className="text-xl font-bold border-b border-consulting-navy pb-1 mb-3">
            Education
          </h2>
          {tailoredResume.education.map((edu, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold">{edu.institution}</h3>
                <span className="text-consulting-gray">{edu.date}</span>
              </div>
              <p className="font-medium">{edu.degree}</p>
              <ul className="list-disc pl-5 text-sm">
                {edu.highlights.map((highlight, idx) => (
                  <li key={idx} className={`${tailored && idx === 2 ? 'text-consulting-accent font-medium' : ''}`}>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div>
          <h2 className="text-xl font-bold border-b border-consulting-navy pb-1 mb-3">
            Experience
          </h2>
          {tailoredResume.experience.map((exp, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between items-start">
                <h3 className="font-bold">{exp.company}</h3>
                <span className="text-consulting-gray">{exp.date}</span>
              </div>
              <p className="font-medium">{exp.role}</p>
              <ul className="list-disc pl-5 text-sm">
                {exp.bullets.map((bullet, idx) => {
                  // Find a matching STAR analysis item if possible
                  const starItem = validStarAnalysis.length > 0 && idx < validStarAnalysis.length ? 
                    validStarAnalysis[idx] : null;
                  
                  return (
                    <li key={idx} className={`${tailored && idx === 1 ? 'text-consulting-accent font-medium' : ''}`}>
                      {tailored && starItem ? starItem.improved : bullet}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        
        <div>
          <h2 className="text-xl font-bold border-b border-consulting-navy pb-1 mb-3">
            Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {tailoredResume.skills.map((skill, index) => (
              <span 
                key={index}
                className={`px-3 py-1 rounded-full text-sm ${
                  tailored && (index === 0 || index === 2) 
                    ? 'bg-consulting-accent text-white' 
                    : 'bg-gray-200 text-consulting-charcoal'
                }`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6">
      <Tabs defaultValue="original" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="original">Original Resume</TabsTrigger>
          <TabsTrigger value="tailored">Tailored Resume</TabsTrigger>
        </TabsList>
        <TabsContent value="original">
          <Card className="p-6">
            {renderResume(false)}
          </Card>
        </TabsContent>
        <TabsContent value="tailored">
          <Card className="p-6">
            {renderResume(true)}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResumeComparison;
