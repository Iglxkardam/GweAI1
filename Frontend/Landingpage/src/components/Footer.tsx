import React from 'react';
import { FaTwitter, FaLinkedin, FaGithub, FaDiscord } from 'react-icons/fa';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-white/5 text-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 md:gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/igl-sipfi-logo.svg" 
                alt="SipLedger" 
                className="h-10 w-10"
              />
              <h3 className="text-xl font-bold text-white">SipLedger</h3>
            </div>
            <p className="text-white/50 mb-6 text-sm leading-relaxed">
              AI-powered automated investing for the next generation of crypto traders.
            </p>
            <div className="flex gap-3">
              <a 
                href="https://x.com/Jhod869800" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <FaTwitter />
              </a>
              <a 
                href="https://www.linkedin.com/in/iglxkardam/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <FaLinkedin />
              </a>
              <a 
                href="https://github.com/Iglxkardam" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <FaGithub />
              </a>
              <a 
                href="https://discord.com/users/iglxkardam" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
              >
                <FaDiscord />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-white/50 hover:text-white transition-colors text-sm">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-white/50 hover:text-white transition-colors text-sm">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#tech-stack" className="text-white/50 hover:text-white transition-colors text-sm">
                  Technology
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://iglxkardam.vercel.app" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors text-sm">
                  About
                </a>
              </li>
              <li>
                <a href="mailto:sachinkardam5581@gmail.com" className="text-white/50 hover:text-white transition-colors text-sm">
                  Contact
                </a>
              </li>
              <li>
                <a href="https://github.com/Iglxkardam" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors text-sm">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-white text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="#faq" className="text-white/50 hover:text-white transition-colors text-sm">
                  FAQ
                </a>
              </li>
              <li>
                <a href="https://docs.abstract.xyz" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors text-sm">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://iglxkardam.vercel.app" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors text-sm">
                  Portfolio
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/5 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/50">
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Security
              </a>
            </div>
            <div>
              Built with ❤️ in India 🇮🇳
            </div>
          </div>
          <div className="text-center mt-6 text-xs text-white/40">
            © {currentYear} SipLedger. All rights reserved. Not financial advice.
          </div>
        </div>
      </div>
    </footer>
  );
};
