
import React from 'react';
import { topCompanies } from '@/data/mockData';
import { useAppContext } from '@/context/AppContext';

const CompanySelector = () => {
  const { selectedCompany, setSelectedCompany, setJobDescription } = useAppContext();
  
  const handleSelectCompany = (company: typeof topCompanies[0]) => {
    setSelectedCompany(company);
    setJobDescription(company.defaultJobDescription);
  };
  
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-consulting-charcoal mb-4">
        Popular Companies (click to pre-fill job description)
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {topCompanies.map((company) => (
          <div
            key={company.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all
              ${selectedCompany?.id === company.id 
                ? 'border-consulting-accent bg-consulting-lightblue/20 shadow-md' 
                : 'border-gray-200 hover:border-consulting-accent hover:bg-consulting-lightblue/10'
              }`}
            onClick={() => handleSelectCompany(company)}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-2 flex items-center justify-center">
                {company.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-consulting-navy">{company.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanySelector;
