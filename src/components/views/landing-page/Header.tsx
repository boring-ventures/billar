"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from "@/providers/auth-provider";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  const navigation = [
    { name: "Características", href: "/#features" },
    { name: "Precios", href: "/#pricing" },
    { name: "Nosotros", href: "/#about" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#191919]/80 backdrop-blur-md border-b border-gray-800/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/brand-assets/logo.svg"
              alt="BILLARPRO Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-white">BILLARPRO</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {isLoading ? (
              <div className="h-9 w-[100px] animate-pulse rounded-md bg-gray-700" />
            ) : user ? (
              <Link href="/dashboard">
                <Button className="flex items-center gap-2 bg-red-500 hover:bg-red-600">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium px-2"
                >
                  Iniciar Sesión
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="text-gray-300 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Abrir menú</span>
              {isMenuOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-[#191919] border-t border-gray-800">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 pb-3 border-t border-gray-800">
              {isLoading ? (
                <div className="px-3">
                  <div className="h-9 w-full animate-pulse rounded-md bg-gray-700" />
                </div>
              ) : user ? (
                <div className="px-3">
                  <Link
                    href="/dashboard"
                    className="block w-full"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button className="w-full bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center px-3">
                    <Link
                      href="/sign-in"
                      className="block w-full text-center px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Iniciar Sesión
                    </Link>
                  </div>
                  <div className="mt-3 px-3">
                    <Link
                      href="/sign-up"
                      className="block w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Button className="w-full bg-red-500 hover:bg-red-600">
                        Registrarse
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
