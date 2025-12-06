import Link from 'next/link';
import { FileText, Twitter, Linkedin, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 text-white p-1 rounded-md">
                <FileText size={20} />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">ProDoc AI</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Empowering freelancers and businesses with intelligent, beautiful documentation tools.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/editor/new" className="hover:text-blue-600 transition">Invoice Maker</Link></li>
              <li><Link href="/editor/new" className="hover:text-blue-600 transition">Quotation Generator</Link></li>
              <li><Link href="/dashboard" className="hover:text-blue-600 transition">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li><Link href="/about" className="hover:text-blue-600 transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600 transition">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600 transition">Privacy Policy</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Connect</h3>
            <div className="flex space-x-4">
              <SocialIcon Icon={Twitter} />
              <SocialIcon Icon={Linkedin} />
              <SocialIcon Icon={Github} />
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} ProDoc AI. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
             <span className="w-2 h-2 rounded-full bg-green-500"></span>
             <span className="text-xs text-slate-500">System Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

const SocialIcon = ({ Icon }) => (
  <a href="#" className="p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-full text-slate-500 hover:text-blue-600 hover:border-blue-600 transition">
    <Icon size={18} />
  </a>
);