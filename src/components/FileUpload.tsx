
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, File } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  label: string;
  onChange: (file: File | null) => void;
  value: File | null;
  required?: boolean;
  maxSizeMB?: number;
  accept?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  onChange, 
  value,
  required = false,
  maxSizeMB = 10,
  accept = '.docx'
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
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    
    if (fileExtension !== 'docx') {
      toast.error('Only Word documents (.docx) are accepted');
      return;
    }

    onChange(file);
  };

  const getAcceptedTypes = () => 'Word (.docx)';

  const getFileIcon = () => (
    <File className="h-6 w-6 text-blue-500" />
  );

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
              <File className="h-5 w-5 text-blue-500" /><span>DOCX</span>
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
