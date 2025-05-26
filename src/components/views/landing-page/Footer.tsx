import Link from "next/link";
import { Facebook, Twitter, Instagram, Github as GitHub } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { name: "Características", href: "/#features" },
    { name: "Precios", href: "/#pricing" },
    { name: "Nosotros", href: "/#about" },
    { name: "Términos", href: "/terms" },
    { name: "Privacidad", href: "/privacy" },
  ];

  const socialLinks = [
    { name: "Twitter", icon: Twitter },
    { name: "Facebook", icon: Facebook },
    { name: "Instagram", icon: Instagram },
    { name: "GitHub", icon: GitHub },
  ];

  return (
    <footer className="bg-[#191919] text-gray-400 border-t border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-8 md:mb-0">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-red-500"></div>
              <span className="text-xl font-bold text-white">BILLARPRO</span>
            </Link>
            <p className="text-sm max-w-xs">
              Sistema de gestión integral para salones de billar.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <div className="flex space-x-6 mb-6">
              {socialLinks.map((social) => {
                const SocialIcon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={`https://${social.name.toLowerCase()}.com`}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label={social.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SocialIcon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>

            <div className="flex flex-wrap justify-center gap-6 mb-6">
              {footerLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm hover:text-red-500 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <p className="text-sm text-gray-500">
              &copy; {currentYear} BILLARPRO. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
