
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, FileText, FilePdf, FileWord } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
  value: File | null;
  required?: boolean;
  maxSizeMB?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  accept, 
  onChange, 
  value,
  required = false,
  maxSizeMB = 10
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }
    
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const acceptedFormats = accept.split(',').map(type => 
      type.trim().replace('.', '').toLowerCase()
    );
    
    if (!acceptedFormats.includes(fileExtension) && !accept.includes(file.type)) {
      toast.error(`Invalid file format. Accepted formats: ${getAcceptedTypes()}`);
      return;
    }

    onChange(file);
  };

  // Get accepted file types as a readable string
  const getAcceptedTypes = () => {
    const types = accept.split(',').map(type => {
      const cleaned = type.trim().replace('.', '').toUpperCase();
      switch(cleaned) {
        case 'DOCX': return 'Word (.docx)';
        case 'DOC': return 'Word (.doc)';
        case 'PDF': return 'PDF';
        case 'TXT': return 'Text (.txt)';
        case 'RTF': return 'Rich Text (.rtf)';
        default: return cleaned;
      }
    });
    return types.join(', ');
  };

  const getFileIcon = () => {
    if (!value) return null;
    
    const extension = value.name.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') {
      return <FilePdf className="h-6 w-6 text-red-500" />;
    } else if (extension === 'docx' || extension === 'doc') {
      return <FileWord className="h-6 w-6 text-blue-500" />;
    } else {
      return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const removeFile = () => {
    onChange(null);
  };

  return (
    <div className="mb-6">
      <label className="block text-consulting-charcoal font-medium mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {!value ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${dragActive 
              ? 'border-consulting-accent bg-consulting-lightblue/30' 
              : 'border-gray-300 hover:border-consulting-accent hover:bg-consulting-lightblue/10'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById(`file-${label}`)?.click()}
        >
          <input
            id={`file-${label}`}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleChange}
          />
          <div className="flex flex-col items-center justify-center">
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              {getAcceptedTypes()} (MAX. {maxSizeMB}MB)
            </p>
            <div className="flex gap-2 mt-3 text-xs text-gray-500">
              <FilePdf className="h-5 w-5 text-red-500" /><span>PDF</span>
              <FileWord className="h-5 w-5 text-blue-500 ml-2" /><span>Word</span>
              <FileText className="h-5 w-5 text-gray-500 ml-2" /><span>TXT</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-consulting-lightblue/10">
          <div className="flex items-center">
            {getFileIcon()}
            <div className="ml-3">
              <p className="text-sm font-medium text-consulting-navy">{value.name}</p>
              <p className="text-xs text-gray-500">{(value.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={removeFile}
            className="text-gray-500 hover:text-red-500"
          >
            <X size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
