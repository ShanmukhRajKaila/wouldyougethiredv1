import { useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '@/context/AppContext';
import PDFExtractor from '@/utils/PDFExtractor';

export const useFileExtraction = (resumeFile: File | null, coverLetterFile: File | null = null) => {
  const [extractionWarning, setExtractionWarning] = useState<string | null>(null);
  const { setCoverLetterText } = useAppContext();

  const checkFileExtraction = async () => {
    // Check resume file
    if (resumeFile) {
      try {
        const text = await PDFExtractor.extractText(resumeFile);
        
        if (text && text.includes('This PDF appears to be')) {
          setExtractionWarning(text);
        } else if (text && text.includes('Error extracting')) {
          setExtractionWarning('There was an issue extracting text from your resume. Try uploading a different file format.');
        } else {
          setExtractionWarning(null);
        }
      } catch (error) {
        console.error('Error checking file extraction:', error);
        setExtractionWarning('Could not validate the PDF. Please try uploading as a Word or text file instead.');
      }
    }

    // Check cover letter file
    if (coverLetterFile) {
      try {
        const text = await PDFExtractor.extractText(coverLetterFile);
        
        if (text && text.includes('Error extracting')) {
          toast.error('There was an issue extracting text from your cover letter. Try uploading a different file format.');
        } else if (text && text.trim().length > 0) {
          setCoverLetterText(text);
        }
      } catch (error) {
        console.error('Error checking cover letter extraction:', error);
        toast.error('Could not extract text from your cover letter. Please try a different file format.');
      }
    }
  };

  return {
    extractionWarning,
    setExtractionWarning,
    checkFileExtraction
  };
};
