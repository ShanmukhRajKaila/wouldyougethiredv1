
import * as PDFJS from 'pdfjs-dist';

class PDFExtractor {
  static initialize() {
    try {
      // Set the worker source path correctly
      const workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.js';
      PDFJS.GlobalWorkerOptions.workerSrc = workerSrc;
      console.log('PDF.js worker initialized successfully with CDN worker');
    } catch (error) {
      console.error('Failed to initialize PDF.js worker:', error);
    }
  }

  static async extractText(file: File): Promise<string | null> {
    console.log(`Extracting text from ${file.name} (type: ${file.type})`);
    
    // For PDF files, use PDF.js
    if (file.type === 'application/pdf') {
      try {
        console.log('Attempting PDF.js extraction for PDF file');
        return await this.extractWithPDFJS(file);
      } catch (error) {
        console.error('PDF extraction error:', error);
        return `Error extracting PDF: ${error.message}. Please try another file format.`;
      }
    }
    
    // For Word documents (.docx, .doc), use a specialized extraction method
    if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') || 
        file.type.includes('word') || file.type.includes('officedocument')) {
      console.log('Word document detected');
      return this.extractAsText(file);
    }
    
    // Fallback to text extraction for all other cases
    return this.extractAsText(file);
  }

  private static async extractWithPDFJS(file: File): Promise<string | null> {
    try {
      console.log('Starting PDF.js extraction process');
      
      // Load the file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      console.log('File loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
      
      // Create a new PDF document with the loaded data
      console.log('Loading PDF document with PDF.js');
      const pdf = await PDFJS.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF loaded with', pdf.numPages, 'pages');
      
      // Extract text from each page
      let completeText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`Extracting text from page ${i}/${pdf.numPages}`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Join text items with spaces
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        completeText += pageText + '\n\n';
      }
      
      console.log('PDF text extraction complete, extracted', completeText.length, 'characters');
      if (completeText.trim().length === 0) {
        console.warn('Extracted text is empty');
        return 'No readable text found in the PDF. It might be a scanned document or an image-based PDF.';
      }
      
      return completeText;
    } catch (error) {
      console.error('Error in PDF extraction:', error);
      throw error;
    }
  }

  private static async extractAsText(file: File): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const text = event.target.result as string;
          console.log(`Text extracted, length: ${text.length}`);
          
          if (text.includes('%PDF') || text.includes('obj') || 
              /[\x00-\x08\x0E-\x1F\x80-\xFF]/.test(text.substring(0, 100))) {
            // Detected binary content
            resolve('This appears to be a binary file that cannot be read as text. Please upload a PDF instead.');
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
