'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CommonForm from './Form';
import { loginFormControls } from '@/config';

const initialFormData = Object.fromEntries(
  loginFormControls.map(ctrl => [ctrl.name, ""])
);

export default function LoginDialog({ open, onOpenChange, setIsSignupOpen }: any) {
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
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>
        
        <CommonForm 
        formControls={loginFormControls}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        buttonText={isSubmitting ? "Logging In..." : "Login"}
        isBtnDisabled={isSubmitting}
        />

        <div className="text-center text-sm">
          <span className="text-foreground/70">Don&apos;t have an account? </span>
          <button
            onClick={() => {
              onOpenChange(false);
              setIsSignupOpen(true)
            }}
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
