
import { useState, useEffect } from 'react';
import PDFExtractor from '@/utils/PDFExtractor';

export const useFileExtraction = (resumeFile: File | null) => {
  const [extractionWarning, setExtractionWarning] = useState<string | null>(null);

  const checkFileExtraction = async () => {
    if (resumeFile) {
      setExtractionWarning(null);
      // Test extract text to verify it can be read properly
      try {
        const text = await PDFExtractor.extractText(resumeFile);
        // Check if we got a valid extraction or an error message
        if (text && (text.includes('Error extracting') || 
                    text.includes('binary file') || 
                    text.includes('scanned document'))) {
          setExtractionWarning(
            "Warning: Your file may not be properly readable. For best results, use a text-based PDF, Word document (.docx), or a .txt file."
          );
        } else if (!text || text.trim().length < 50) {
          setExtractionWarning(
            "Warning: Very little text could be extracted from your file. Use a text-based file for best results."
          );
        }
      } catch (err) {
        setExtractionWarning("Warning: There might be issues reading this file format.");
        console.error("Preview extraction error:", err);
      }
    }
  };

  // Reset warning when file changes
  useEffect(() => {
    if (resumeFile) {
      setExtractionWarning(null);
    }
  }, [resumeFile]);

  return { 
    extractionWarning, 
    setExtractionWarning, 
    checkFileExtraction 
  };
};
