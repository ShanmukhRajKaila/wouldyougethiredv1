
import * as PDFJS from 'pdfjs-dist';

class PDFExtractor {
  static initialize() {
    try {
      // Use a bundled worker from node_modules instead of CDN
      const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url);
      console.log('Setting PDF.js worker URL:', workerSrc);
      PDFJS.GlobalWorkerOptions.workerSrc = workerSrc.toString();
      console.log('PDF.js worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PDF.js worker:', error);
      // Fallback to CDN if needed
      const workerUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.js';
      console.log('Falling back to CDN worker URL:', workerUrl);
      PDFJS.GlobalWorkerOptions.workerSrc = workerUrl;
    }
  }

  static async extractText(file: File): Promise<string | null> {
    console.log(`Extracting text from ${file.name} using PDF.js`);
    
    // For Word documents (.docx, .doc), use a specialized extraction method
    if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') || 
        file.type.includes('word') || file.type.includes('officedocument')) {
      console.log('Word document detected, using binary extraction');
      return this.extractWordDocument(file);
    }
    
    // For PDF files, use PDF.js
    if (file.type === 'application/pdf') {
      try {
        console.log('Attempting PDF.js extraction for PDF file');
        const text = await this.extractWithPDFJS(file);
        if (text) {
          console.log('PDF extraction succeeded with length:', text.length);
          return text;
        }
        console.log('PDF.js extraction failed, falling back to text extraction');
      } catch (error) {
        console.error('PDF extraction failed with error:', error);
      }
    }
    
    // Fallback to text extraction for all other cases
    return this.extractAsText(file);
  }

  private static async extractWithPDFJS(file: File): Promise<string | null> {
    try {
      console.log('Starting PDF.js extraction');
      const arrayBuffer = await file.arrayBuffer();
      console.log('File loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
      
      // Load the document
      console.log('Creating PDF document');
      const loadingTask = PDFJS.getDocument({data: arrayBuffer});
      
      // Add a timeout to prevent hanging
      const pdf = await Promise.race([
        loadingTask.promise,
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('PDF loading timeout')), 15000)
        )
      ]) as PDFJS.PDFDocumentProxy;
      
      console.log('PDF loaded successfully with', pdf.numPages, 'pages');
      
      let fullText = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log('Processing page', i, 'of', pdf.numPages);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
        console.log(`Page ${i} text extraction complete. Length: ${pageText.length}`);
      }
      
      console.log('PDF.js text extraction complete. Total text length:', fullText.length);
      return fullText.trim();
    } catch (error) {
      console.error('Error in PDF.js extraction:', error);
      return null;
    }
  }

  private static async extractWordDocument(file: File): Promise<string | null> {
    // For Word documents, read the content directly
    try {
      console.log('Extracting Word document content');
      // Since we can't directly extract text from .doc/.docx in the browser,
      // we'll read the file content and check if it contains some recognizable Word format markers
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      
      // Check for Word document signatures
      if (this.isDocxFile(bytes) || this.isDocFile(bytes)) {
        // Return the raw text as extracted by the browser (will be incomplete but better than nothing)
        console.log('Confirmed Word document format');
        const text = await this.extractAsText(file);
        if (text && text.length > 100) {
          return text;
        } else {
          console.log('Word document text extraction yielded insufficient content, returning raw content');
          return `Raw content from ${file.name} - please convert to PDF or TXT for better results`;
        }
      }
      
      console.log('Document does not appear to be a valid Word format');
      return `Content extraction failed for ${file.name} - please convert to PDF or TXT`;
    } catch (error) {
      console.error('Error in Word document extraction:', error);
      return null;
    }
  }

  private static async extractAsText(file: File): Promise<string | null> {
    try {
      console.log('Using text extraction for file type:', file.type);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (event.target?.result) {
            let text = event.target.result as string;
            console.log('Text extraction complete. First 100 chars:', text.substring(0, 100));
            
            // Check if the text looks like binary (for Word docs and other binary formats)
            const isBinary = /[\x00-\x08\x0E-\x1F\x80-\xFF]/.test(text.substring(0, 100));
            
            if (isBinary) {
              console.log('Detected binary content in text extraction');
              // For binary content that failed extraction
              resolve(`Raw content from ${file.name} - please convert to PDF or TXT for better results`);
            } else {
              // For plain text content
              console.log('Plain text content detected, length:', text.length);
              resolve(text);
            }
          } else {
            reject(new Error('FileReader result is null'));
          }
        };
        
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        
        // For all files, use readAsText first
        reader.readAsText(file);
      });
    } catch (error) {
      console.error('Error in text extraction:', error);
      return null;
    }
  }

  // Helper method to detect DOCX files by header
  private static isDocxFile(bytes: Uint8Array): boolean {
    // DOCX files are ZIP files starting with PK\x03\x04
    return bytes.length >= 4 && 
           bytes[0] === 0x50 && bytes[1] === 0x4B && 
           bytes[2] === 0x03 && bytes[3] === 0x04;
  }
  
  // Helper method to detect DOC files by header
  private static isDocFile(bytes: Uint8Array): boolean {
    // DOC files often start with D0 CF 11 E0 A1 B1 1A E1
    return bytes.length >= 8 && 
           bytes[0] === 0xD0 && bytes[1] === 0xCF && 
           bytes[2] === 0x11 && bytes[3] === 0xE0 &&
           bytes[4] === 0xA1 && bytes[5] === 0xB1 && 
           bytes[6] === 0x1A && bytes[7] === 0xE1;
  }
}

export default PDFExtractor;
