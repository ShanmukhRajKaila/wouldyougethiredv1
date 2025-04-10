
import * as PDFJS from 'pdfjs-dist';

class PDFExtractor {
  static initialize() {
    // Use a CDN URL for the PDF.js worker
    const workerUrl = 'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.js';
    console.log('Setting PDF.js worker URL:', workerUrl);
    PDFJS.GlobalWorkerOptions.workerSrc = workerUrl;
  }

  static async extractText(file: File, method: 'pdfjs' | 'text' = 'pdfjs'): Promise<string | null> {
    console.log(`Extracting text from ${file.name} using ${method} method`);
    
    if (method === 'pdfjs' && file.type === 'application/pdf') {
      return this.extractWithPDFJS(file);
    } else {
      return this.extractAsText(file);
    }
  }

  private static async extractWithPDFJS(file: File): Promise<string | null> {
    try {
      console.log('Starting PDF.js extraction');
      const arrayBuffer = await file.arrayBuffer();
      console.log('File loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
      
      // Load the document
      console.log('Creating PDF document');
      const loadingTask = PDFJS.getDocument({data: arrayBuffer});
      const pdf = await Promise.race([
        loadingTask.promise,
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('PDF loading timeout')), 10000)
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
      console.log('Using FileReader text extraction');
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (event.target?.result) {
            const text = event.target.result as string;
            console.log('FileReader text extraction complete. Length:', text.length);
            resolve(text);
          } else {
            reject(new Error('FileReader result is null'));
          }
        };
        
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(error);
        };
        
        if (file.type === 'application/pdf') {
          // For PDFs, use readAsArrayBuffer and then a fallback method
          console.log('PDF detected, using ArrayBuffer approach');
          reader.readAsArrayBuffer(file);
        } else {
          // For text-based files, use readAsText
          reader.readAsText(file);
        }
      });
    } catch (error) {
      console.error('Error in text extraction:', error);
      return null;
    }
  }
}

export default PDFExtractor;
