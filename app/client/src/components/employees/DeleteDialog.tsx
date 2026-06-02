'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Employee } from '@/src/lib/types/api';

interface Props {
  employee: Employee | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteDialog({ employee, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete employee.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={employee !== null} onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-sm text-center" showCloseButton={false}>
        <DialogHeader>
          <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-1">
            <Trash2 className="size-6 text-rose-500" />
          </div>
          <DialogTitle className="text-center">Delete Employee</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground pb-2">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-700">{employee?.fullName}</span>?
          <br />This action cannot be undone.
        </p>

        <div className="flex gap-3 -mx-4 -mb-4 rounded-b-xl border-t bg-muted/50 p-4">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
