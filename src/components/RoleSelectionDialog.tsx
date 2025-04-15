
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface RoleSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inputRole: string;
  setInputRole: (role: string) => void;
  onSubmit: () => void;
}

const RoleSelectionDialog: React.FC<RoleSelectionDialogProps> = ({
  open,
  onOpenChange,
  inputRole,
  setInputRole,
  onSubmit
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter Job Role</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">
            Please enter the job role title.
          </p>
          <Input 
            placeholder="e.g. Data Analyst, Software Engineer" 
            value={inputRole} 
            onChange={(e) => setInputRole(e.target.value)}
            className="w-full"
          />
        </div>
        <DialogFooter>
          <Button type="submit" onClick={onSubmit} disabled={!inputRole.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RoleSelectionDialog;
