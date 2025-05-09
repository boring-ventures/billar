"use client";

import Link from "next/link";
import { CircleDot, Mail, MapPin, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { MotionSection, MotionStagger } from "@/components/magicui/motion-section";
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: "Product",
      links: [
        { href: "#features", label: "Features" },
        { href: "#", label: "Pricing" },
        { href: "#", label: "Case Studies" },
        { href: "#", label: "Testimonials" },
        { href: "#", label: "Demo" },
      ],
    },
    {
      title: "Resources",
      links: [
        { href: "#", label: "Documentation" },
        { href: "#", label: "Blog" },
        { href: "#", label: "Knowledge Base" },
        { href: "#", label: "API Reference" },
        { href: "#", label: "Partners" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "#", label: "About Us" },
        { href: "#", label: "Careers" },
        { href: "#", label: "Press" },
        { href: "#", label: "Contact" },
        { href: "#", label: "Privacy Policy" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "#", label: "Terms of Service" },
        { href: "#", label: "Privacy Policy" },
        { href: "#", label: "Cookie Policy" },
        { href: "#", label: "GDPR" },
        { href: "#", label: "Security" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main footer content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Logo and contact info */}
          <MotionSection type="slide" duration={0.6} className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <motion.div 
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <CircleDot className="h-8 w-8 text-primary" />
              </motion.div>
              <Link href="/" className="text-2xl font-bold text-white">
                Billar
              </Link>
            </div>
            <p className="text-gray-400 mb-6">
              The complete management solution for billar hall owners and operators.
            </p>
            <div className="space-y-4">
              <motion.div 
                className="flex items-start"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <MapPin className="h-5 w-5 text-primary mr-3 mt-0.5" />
                <div>123 Business Avenue, Suite 400<br />San Francisco, CA 94107</div>
              </motion.div>
              <motion.div 
                className="flex items-center"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Phone className="h-5 w-5 text-primary mr-3" />
                <a href="tel:+1-555-123-4567" className="hover:text-white transition-colors">+1-555-123-4567</a>
              </motion.div>
              <motion.div 
                className="flex items-center"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Mail className="h-5 w-5 text-primary mr-3" />
                <a href="mailto:info@billarapp.com" className="hover:text-white transition-colors">info@billarapp.com</a>
              </motion.div>
            </div>
          </MotionSection>

          {/* Footer links */}
          {footerLinks.map((group, index) => (
            <MotionSection 
              key={group.title} 
              delay={0.2 + (index * 0.1)} 
              type="slide" 
              duration={0.5}
            >
              <h3 className="text-white font-semibold mb-4">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link, linkIdx) => (
                  <motion.li 
                    key={link.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ 
                      delay: 0.3 + (index * 0.1) + (linkIdx * 0.05), 
                      duration: 0.4
                    }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </MotionSection>
          ))}
        </div>
      </div>

      {/* Social links and copyright */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <MotionSection delay={0.6} type="fade" duration={0.6}>
              <div className="text-gray-500 text-sm mb-4 md:mb-0">
                © {currentYear} Billar. All rights reserved.
              </div>
            </MotionSection>
            <MotionStagger 
              className="flex space-x-6"
              staggerChildren={0.08}
              delay={0.7}
              duration={0.4}
            >
              {[
                { icon: Facebook, href: "#" },
                { icon: Twitter, href: "#" },
                { icon: Instagram, href: "#" },
                { icon: Linkedin, href: "#" },
              ].map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  className="text-gray-400 hover:text-primary transition-colors"
                  aria-label={`Follow us on ${social.icon.name}`}
                  whileHover={{ y: -3, scale: 1.2 }}
                  whileTap={{ y: 0, scale: 1 }}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </MotionStagger>
          </div>
        </div>
      </div>
    </footer>
  );
}
