
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CompanySelector = () => {
  const { selectedCompany, setSelectedCompany } = useAppContext();
  
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const companyName = e.target.value;
    setSelectedCompany(companyName ? { 
      id: 'custom', 
      name: companyName,
      logo: '' 
    } : null);
  };
  
  return (
    <div className="mb-6">
      <Label htmlFor="company" className="block text-consulting-charcoal font-medium mb-2">
        Company Name <span className="text-red-500">*</span>
      </Label>
      <Input
        id="company"
        type="text"
        value={selectedCompany?.name || ''}
        onChange={handleCompanyChange}
        placeholder="Enter the company name"
        className="w-full"
        required
      />
    </div>
  );
};

export default CompanySelector;
