
import * as PDFJS from 'pdfjs-dist';
import * as mammoth from 'mammoth';

class PDFExtractor {
  static initialize() {
    try {
      // Set worker via direct path to worker
      PDFJS.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.js`;
      console.log('PDF.js worker initialized with direct path');
    } catch (error) {
      console.error('Failed to initialize PDF.js worker, falling back:', error);
      
      // Fallback: Use the built-in worker
      PDFJS.GlobalWorkerOptions.workerSrc = '';
    }
  }

  static async extractText(file: File): Promise<string | null> {
    console.log(`Extracting text from ${file.name} (type: ${file.type})`);
    
    // For PDF files, use PDF.js
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        console.log('Attempting PDF.js extraction for PDF file');
        return await this.extractWithPDFJS(file);
      } catch (error) {
        console.error('PDF extraction error:', error);
        return `Error extracting PDF: ${error.message}. Please try another file format.`;
      }
    }
    
    // For Word documents (docx)
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.toLowerCase().endsWith('.docx')) {
      try {
        console.log('Word document detected, using mammoth');
        return await this.extractFromWord(file);
      } catch (error) {
        console.error('Word document extraction error:', error);
        return `Error extracting Word document: ${error.message}. Please try another file format.`;
      }
    }
    
    // For plain text files, use simple text extraction
    if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
      console.log('Text file detected');
      return this.extractAsText(file);
    }
    
    // Reject other file types
    return `Unsupported file type: ${file.type || file.name.split('.').pop()}. Please upload a PDF, Word document (.docx), or plain text file.`;
  }

  private static async extractWithPDFJS(file: File): Promise<string | null> {
    try {
      console.log('Starting PDF.js extraction process');
      
      // Load the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      console.log('File loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
      
      // Create a new PDF document with the loaded data
      console.log('Loading PDF document with PDF.js');
      
      // Use a minimal set of options
      const loadingTask = PDFJS.getDocument({
        data: arrayBuffer,
      } as any); // Use 'any' type to bypass TypeScript checking for options
      
      const pdf = await loadingTask.promise;
      
      console.log('PDF loaded with', pdf.numPages, 'pages');
      
      // Extract text from each page
      let completeText = '';
      
      // Track if we've extracted any meaningful content
      let hasExtractedContent = false;
      
      for (let i = 1; i <= Math.min(pdf.numPages, 50); i++) { // Limit to 50 pages for performance
        console.log(`Extracting text from page ${i}/${pdf.numPages}`);
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          if (textContent.items.length > 0) {
            hasExtractedContent = true;
          }
          
          // Join text items with proper spacing
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          if (pageText.trim().length > 0) {
            completeText += pageText + '\n\n';
          }
        } catch (pageError) {
          console.warn(`Error extracting text from page ${i}:`, pageError);
          completeText += `[Error extracting page ${i}]\n\n`;
        }
      }
      
      console.log('PDF text extraction complete, extracted', completeText.length, 'characters');
      
      // Clean up the extracted text to remove PDF syntax or binary artifacts
      completeText = this.cleanupExtractedText(completeText);
      
      if (completeText.trim().length < 100 || !hasExtractedContent) {
        console.warn('Insufficient text extracted or content appears to be binary');
        return 'This PDF appears to be a scanned document or image-based PDF. Please upload a text-based PDF, Word document, or save the text in a .txt file.';
      }
      
      return completeText;
    } catch (error) {
      console.error('Error in PDF extraction:', error);
      throw error;
    }
  }

  private static async extractFromWord(file: File): Promise<string | null> {
    try {
      console.log('Extracting text from Word document');
      const arrayBuffer = await file.arrayBuffer();
      
      // Use mammoth to extract text from the Word document
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      console.log(`Word text extracted, length: ${text.length}`);
      
      if (text.trim().length < 50) {
        return 'Insufficient text extracted from the Word document. The file may be corrupt or contain no text content.';
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting text from Word document:', error);
      throw error;
    }
  }

  private static cleanupExtractedText(text: string): string {
    // Remove any PDF-specific markers or syntax
    let cleanText = text.replace(/%PDF[\s\S]*?(?=\w{3,})/g, '');
    
    // Remove common PDF syntax elements
    cleanText = cleanText.replace(/<<\/?[\w\/]+>>/g, '');
    cleanText = cleanText.replace(/endobj|obj|\d+ \d+ R/g, '');
    
    // Remove binary data markers
    cleanText = cleanText.replace(/stream[\s\S]*?endstream/g, '');
    
    // Remove non-readable characters
    cleanText = cleanText.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    
    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Check for common indicators of binary content
    if (cleanText.includes('FlateDecode') || cleanText.includes('Filter')) {
      console.warn('Text appears to contain binary PDF data');
    }
    
    return cleanText;
  }

  private static async extractAsText(file: File): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const text = event.target.result as string;
          console.log(`Text extracted, length: ${text.length}`);
          
          // Check if text appears to be binary data
          if (text.includes('%PDF') || text.includes('obj') || text.includes('endobj') || 
              /[\x00-\x08\x0E-\x1F\x80-\xFF]/.test(text.substring(0, 200))) {
            // Detected binary content
            resolve('This appears to be a binary file that cannot be read as text. Please upload a text-based PDF or a plain text file instead.');
          } else {
            resolve(text);
          }
        } else {
          reject(new Error('FileReader result is null'));
        }
      };
      
      reader.onerror = (error) => reject(error);
      
      // Read as text
      reader.readAsText(file);
    });
  }
}

export default PDFExtractor;
