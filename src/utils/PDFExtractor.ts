
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

  static async extractText(file: File, method: 'pdfjs' | 'text' = 'text'): Promise<string | null> {
    console.log(`Extracting text from ${file.name} using ${method} method`);
    
    // For Word documents (.docx, .doc), always treat as binary
    if (file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') || 
        file.type.includes('word') || file.type.includes('officedocument')) {
      console.log('Word document detected, treating as binary');
      return `Content from ${file.name} (Word document)`;
    }
    
    // For PDF files
    if (file.type === 'application/pdf') {
      try {
        if (method === 'pdfjs') {
          console.log('Attempting PDF.js extraction for PDF file');
          const text = await this.extractWithPDFJS(file);
          if (text) return text;
        }
        
        console.log('Falling back to text extraction for PDF');
        return this.extractAsText(file);
      } catch (error) {
        console.error('PDF extraction failed with error:', error);
        return this.extractAsText(file);
      }
    }
    
    // For text files and all other formats
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
              
              // For Word documents, return a placeholder content
              if (file.name.toLowerCase().endsWith('.docx') || 
                  file.name.toLowerCase().endsWith('.doc') || 
                  file.type.includes('word') || 
                  file.type.includes('officedocument')) {
                console.log('Word document detected, returning placeholder text');
                resolve(`Content from ${file.name} (Word document)`);
              } else if (text.startsWith('PK')) {
                console.log('Detected Office Open XML format (.docx)');
                resolve(`Content from ${file.name} (DOCX document)`);
              } else {
                // For unknown binary content
                console.log('Unknown binary format');
                resolve(`Content from ${file.name} (binary file)`);
              }
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
}

export default PDFExtractor;
