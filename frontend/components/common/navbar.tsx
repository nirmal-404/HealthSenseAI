'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginDialog from './login-dialog';
import SignupDialog from './signup-dialog';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 font-bold text-lg">
          <div className="h-6 w-6 rounded">
            <img src="/logo.png" alt="Logo" />
          </div>
          <span className="hidden sm:inline">HealthSense AI</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Link 1
          </a>
          <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Link 2
          </a>
          <a href="#" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">
            Link 3
          </a>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLoginOpen(true)}
          >
            Login
          </Button>
          <Button
            size="sm"
            onClick={() => setIsSignupOpen(true)}
          >
            Sign up
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <a
              href="#"
              className="block text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Link 1
            </a>
            <a
              href="#"
              className="block text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Link 2
            </a>
            <a
              href="#"
              className="block text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Link 3
            </a>
            <div className="flex flex-col gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsLoginOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Login
              </Button>
              <Button
                className="w-full"
                onClick={() => {
                  setIsSignupOpen(true);
                  setIsMenuOpen(false);
                }}
              >
                Sign up
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} setIsSignupOpen={setIsSignupOpen} />
      <SignupDialog open={isSignupOpen} onOpenChange={setIsSignupOpen} setIsLoginOpen={setIsLoginOpen} />
    </nav>
  );
}
