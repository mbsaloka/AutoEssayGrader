import React from "react";
import {
  FacebookLogo,
  InstagramLogo,
  TwitterLogo,
  LinkedinLogo,
} from "phosphor-react";

export default function Footer() {
  return (
    <footer className="bg-[#1e1f22] border-t border-gray-700 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/about"
                  className="hover:text-yellow-400 transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  Work
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  For the Record
                </a>
              </li>
            </ul>
          </div>

          {/* Community Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  For Artist
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  Developer
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  Advertisement
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  Vendor
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  Investor
                </a>
              </li>
            </ul>
          </div>

          {/* Useful Links Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Useful Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  Support System
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-400 transition-colors">
                  Free Router App
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media Section */}
          <div>
            <h3 className="text-white font-semibold mb-4">Follow Us</h3>
            <div className="flex gap-3">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-yellow-600 flex items-center justify-center transition-colors"
              >
                <InstagramLogo className="w-5 h-5 text-white" weight="bold" />
              </a>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-yellow-600 flex items-center justify-center transition-colors"
              >
                <TwitterLogo className="w-5 h-5 text-white" weight="bold" />
              </a>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-yellow-600 flex items-center justify-center transition-colors"
              >
                <FacebookLogo className="w-5 h-5 text-white" weight="bold" />
              </a>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gray-700 hover:bg-yellow-600 flex items-center justify-center transition-colors"
              >
                <LinkedinLogo className="w-5 h-5 text-white" weight="bold" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs md:text-sm">
              <a href="#" className="hover:text-yellow-400 transition-colors">
                Legal
              </a>
              <a href="#" className="hover:text-yellow-400 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-yellow-400 transition-colors">
                Cookies
              </a>
              <a href="#" className="hover:text-yellow-400 transition-colors">
                About Ads
              </a>
              <a href="#" className="hover:text-yellow-400 transition-colors">
                Accessibility
              </a>
            </div>

            {/* Copyright */}
            <p className="text-xs md:text-sm text-gray-400">
              © 2025 Grade Mind. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
