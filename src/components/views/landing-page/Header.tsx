"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, CircleDot } from "lucide-react";
import { AuthHeader } from "./auth-header";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <CircleDot className="h-8 w-8 text-primary" />
            <Link href="/" className="text-2xl font-bold text-primary">
              Billar
            </Link>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/#features"
              className="text-foreground hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#testimonials"
              className="text-foreground hover:text-primary transition-colors"
            >
              Testimonials
            </Link>
          </nav>
          <div className="hidden md:flex">
            <AuthHeader />
          </div>
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden bg-background">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/#features"
              className="block px-3 py-2 text-foreground hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#testimonials"
              className="block px-3 py-2 text-foreground hover:text-primary transition-colors"
            >
              Testimonials
            </Link>
            <div className="px-3 py-2">
              <AuthHeader />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
