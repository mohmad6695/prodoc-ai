import Link from 'next/link';
import { CheckCircle2, Users, Globe2, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="py-20 bg-slate-50 dark:bg-gray-800 text-center px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
          Empowering Business <span className="text-blue-600">Growth</span>
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          We are on a mission to simplify the financial documentation process for freelancers, agencies, and small businesses worldwide.
        </p>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Our Story</h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                ProDoc AI started with a simple frustration: invoice tools were either too expensive, too complex, or too ugly.
              </p>
              <p>
                We believed that sending an invoice shouldn't take longer than doing the actual work. That's why we built a tool that combines speed, professional aesthetics, and intelligent automation.
              </p>
              <p>
                Today, thousands of documents are generated on our platform, helping professionals get paid faster and look better doing it.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mt-10">
               <Stat number="10k+" label="Documents Created" />
               <Stat number="99.9%" label="Uptime Reliability" />
            </div>
          </div>
          
          <div className="bg-slate-100 dark:bg-gray-800 p-8 rounded-2xl border border-slate-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Why Professionals Choose Us</h3>
            <ul className="space-y-4">
              <Reason text="No credit card required to start" />
              <Reason text="Bank-level data security" />
              <Reason text="Beautiful, customizable templates" />
              <Reason text="Real-time PDF generation" />
              <Reason text="Global currency support" />
            </ul>
            <Link href="/editor/new" className="block mt-8 text-center bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
              Try It Yourself
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const Stat = ({ number, label }) => (
    <div>
        <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{number}</div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
    </div>
);

const Reason = ({ text }) => (
    <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
        <CheckCircle2 size={20} className="text-green-500 flex-shrink-0" />
        <span>{text}</span>
    </li>
);