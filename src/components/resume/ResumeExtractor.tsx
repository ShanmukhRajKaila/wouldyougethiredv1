
import React, { useState, useEffect, useRef } from 'react';
import PDFExtractor from '@/utils/PDFExtractor';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ResumeExtractorProps {
  resumeFile: File | null;
  onTextExtracted: (text: string) => void;
  onBulletsExtracted: (bullets: string[]) => void;
  onExtractionError: (error: string | null) => void;
}

const ResumeExtractor: React.FC<ResumeExtractorProps> = ({ 
  resumeFile, 
  onTextExtracted, 
  onBulletsExtracted,
  onExtractionError 
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const processedFileRef = useRef<File | null>(null);
  const maxRetries = 2;
  const [retryCount, setRetryCount] = useState(0);
  
  const extractText = async (file: File) => {
    try {
      setIsLoading(true);
      const text = await PDFExtractor.extractText(file);
      
      if (text) {
        if (text.includes('scanned document') || 
            text.includes('image-based PDF') || 
            text.includes('Error extracting') ||
            text.includes('binary file')) {
          setExtractionError(text);
          setResumeText('');
          onExtractionError(text);
        } else {
          setResumeText(text);
          setExtractionError(null);
          onExtractionError(null);
          onTextExtracted(text);
        }
      } else {
        throw new Error("Could not extract text from the uploaded file.");
      }
    } catch (err: any) {
      console.error("Error extracting text:", err);
      
      // Retry logic for transient errors
      if (retryCount < maxRetries) {
        console.log(`Retrying extraction (${retryCount + 1}/${maxRetries})...`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => extractText(file), 1000); // Retry after 1 second
        return;
      }
      
      const errorMsg = `Error extracting text: ${err.message}`;
      setExtractionError(errorMsg);
      onExtractionError(errorMsg);
      
      // Even on error, try to extract any text that might be available
      if (err.partialText && typeof err.partialText === 'string' && err.partialText.length > 100) {
        setResumeText(err.partialText);
        onTextExtracted(err.partialText);
        toast.warning("Partial resume content extracted. Some information might be missing.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!resumeFile || (processedFileRef.current && 
        processedFileRef.current.name === resumeFile.name && 
        processedFileRef.current.size === resumeFile.size &&
        processedFileRef.current.lastModified === resumeFile.lastModified)) {
      return;
    }
    
    setIsLoading(true);
    setExtractionError(null);
    setRetryCount(0);
    
    processedFileRef.current = resumeFile;
    extractText(resumeFile);
  }, [resumeFile, onTextExtracted, onExtractionError, onBulletsExtracted]);

  const handleRetry = () => {
    if (!resumeFile) return;
    
    setExtractionError(null);
    setRetryCount(0);
    toast.info("Retrying text extraction...");
    extractText(resumeFile);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Extracting resume content...</div>;
  }
  
  if (extractionError) {
    return (
      <div className="p-4 text-red-50 bg-red-100 rounded-md">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
          <div>
            <p className="text-red-800 font-medium">{extractionError}</p>
            <p className="mt-2 text-sm text-gray-700">
              For best results:
              <ul className="list-disc pl-5 mt-1">
                <li>Use text-based PDFs (not scanned documents)</li>
                <li>Try Word documents (.docx) for better compatibility</li>
                <li>Or save your resume as plain text (.txt)</li>
              </ul>
            </p>
            <div className="mt-3">
              <Button 
                onClick={handleRetry} 
                variant="outline" 
                size="sm"
                className="bg-red-50 text-red-800 border-red-300 hover:bg-red-100"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!resumeText) {
    return (
      <div className="p-4 text-consulting-gray">
        No resume content available. Please upload a resume file (.pdf, .docx, or .txt).
      </div>
    );
  }
  
  return (
    <div className="whitespace-pre-wrap font-mono text-sm">
      {resumeText}
    </div>
  );
};

export default ResumeExtractor;
