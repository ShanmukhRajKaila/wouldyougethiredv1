
import React from 'react';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';

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
  return (
    <form onSubmit={onSubmit}>
      <FileUpload
        label="Resume"
        accept=".pdf,.txt,.docx"
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
            or plain text (.txt) file for better results.
          </p>
        </div>
      )}
      
      <FileUpload
        label="Cover Letter (Optional)"
        accept=".pdf,.txt,.docx"
        onChange={setCoverLetterFile}
        value={coverLetterFile}
        maxSizeMB={5}
      />
      
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
          disabled={!resumeFile || isSubmitting}
          className="bg-consulting-navy hover:bg-consulting-blue"
        >
          {isSubmitting ? 'Processing...' : 'Run AI Analysis'}
        </Button>
      </div>
    </form>
  );
};

export default ResumeUploadForm;
