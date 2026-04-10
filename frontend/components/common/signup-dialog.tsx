'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registerFormControls } from '@/config';
import CommonForm from './Form';

const initialFormData = Object.fromEntries(
  registerFormControls.map(ctrl => [ctrl.name, ""])
);

export default function SignupDialog({ open, onOpenChange, setIsLoginOpen }: any) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // setIsSubmitting(false);
    // setFormData(initialFormData);
    // onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Sign up</DialogTitle>
          <DialogDescription>
            Create your account to get started
          </DialogDescription>
        </DialogHeader>
        
        <CommonForm 
        formControls={registerFormControls}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        buttonText={isSubmitting ? "Registering..." : "Register"}
        isBtnDisabled={isSubmitting}
        />

        <div className="text-center text-sm">
          <span className="text-foreground/70">Already have an account? </span>
          <button
            onClick={() => {
              onOpenChange(false);
              setIsLoginOpen(true)
            }}
            className="text-primary hover:underline font-medium"
          >
            Login
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
