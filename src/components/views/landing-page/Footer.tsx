import Link from "next/link";
import {
  FacebookIcon,
  TwitterIcon,
  InstagramIcon,
  CircleDot,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center space-x-2 mb-5">
              <CircleDot className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-white">Billar</span>
            </div>
            <p className="text-gray-400">
              Modern pool games management platform
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/#features"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/#testimonials"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  href="/sign-up"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Connect</h4>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <FacebookIcon size={24} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <TwitterIcon size={24} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary transition-colors"
              >
                <InstagramIcon size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} Billar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
