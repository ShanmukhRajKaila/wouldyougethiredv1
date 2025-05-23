
import React from 'react';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppContext } from '@/context/AppContext';

interface ResumeUploadFormProps {
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  coverLetterFile: File | null;
  setCoverLetterFile: (file: File | null) => void;
  extractionWarning: string | null;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ResumeUploadForm: React.FC<ResumeUploadFormProps> = ({
  resumeFile,
  setResumeFile,
  coverLetterFile,
  setCoverLetterFile,
  extractionWarning,
  isSubmitting,
  onBack,
  onSubmit
}) => {
  const { isCoverLetterIncluded, setIsCoverLetterIncluded } = useAppContext();

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FileUpload
        label="Resume"
        onChange={setResumeFile}
        value={resumeFile}
        required
        maxSizeMB={5}
      />
      
      {extractionWarning && (
        <div className="mb-6 p-3 border border-yellow-300 bg-yellow-50 rounded-md">
          <p className="text-sm text-yellow-800">{extractionWarning}</p>
          <p className="text-xs text-gray-600 mt-1">
            If you're having issues with PDF files, try uploading your resume as a Word document (.docx) 
            for better results.
          </p>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="cover-letter-toggle" className="text-consulting-charcoal font-medium">
              Cover Letter Analysis
            </Label>
            <p className="text-xs text-gray-600 mt-1">
              Include your cover letter in the analysis for more comprehensive feedback.
            </p>
          </div>
          <Switch 
            id="cover-letter-toggle"
            checked={isCoverLetterIncluded}
            onCheckedChange={setIsCoverLetterIncluded}
          />
        </div>
      </div>
      
      {isCoverLetterIncluded && (
        <div className="bg-consulting-lightblue/10 p-4 rounded-md border border-consulting-lightblue">
          <FileUpload
            label="Cover Letter"
            onChange={setCoverLetterFile}
            value={coverLetterFile}
            required={isCoverLetterIncluded}
            maxSizeMB={5}
          />
          <p className="text-xs text-consulting-blue mt-2">
            For best results, upload your cover letter as a PDF or Word document (.docx).
          </p>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onBack}
          className="mr-4"
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button 
          type="submit"
          disabled={!resumeFile || (isCoverLetterIncluded && !coverLetterFile) || isSubmitting}
          className="bg-consulting-navy hover:bg-consulting-blue"
        >
          {isSubmitting ? 'Processing...' : 'Run AI Analysis'}
        </Button>
      </div>
    </form>
  );
};

export default ResumeUploadForm;
