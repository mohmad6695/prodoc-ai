import Link from 'next/link';
import { ArrowRight, CheckCircle, Shield, Zap, Star, Globe, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default async function LandingPage() {
  // We keep this check for the buttons, but Navbar handles its own state now
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;

  return (
    <div className="flex flex-col bg-white">
      
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-28 lg:pt-32 lg:pb-40 text-center overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-30 pointer-events-none">
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-20 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-sm font-semibold mb-8 shadow-sm">
              <Star size={14} className="text-yellow-500 fill-yellow-500" /> Voted #1 Easy Invoice Maker
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.1]">
              Create Perfect Invoices.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Get Paid Faster.</span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Stop fighting with Word and Excel. Create professional estimates and invoices in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-16">
              <Link href="/editor/new" className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-full hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-500/20">
                Start Creating <ArrowRight size={20} />
              </Link>
              {!isLoggedIn && (
                <Link href="/login" className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 text-lg font-bold rounded-full hover:bg-slate-50 transition">
                  Login to Save Work
                </Link>
              )}
            </div>
            
            {/* CSS Mockup Representation - High Contrast Version */}
            <div className="relative mx-auto max-w-4xl rounded-xl bg-slate-800 p-3 shadow-2xl ring-1 ring-slate-900/10">
                 {/* Browser Dots */}
                 <div className="flex gap-2 mb-3 ml-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 </div>

                 <div className="rounded-lg bg-white overflow-hidden aspect-[16/9] flex flex-row border border-slate-600">
                    {/* Fake Sidebar */}
                    <div className="w-1/4 bg-slate-100 border-r border-slate-300 p-4 space-y-4 hidden sm:block">
                        <div className="h-6 w-3/4 bg-slate-300 rounded mb-8"></div>
                        <div className="h-4 w-full bg-blue-200 rounded"></div>
                        <div className="h-4 w-full bg-slate-200 rounded"></div>
                        <div className="h-4 w-full bg-slate-200 rounded"></div>
                        <div className="mt-8 p-3 bg-white border border-slate-300 rounded-lg shadow-sm">
                             <div className="h-10 w-10 rounded-full bg-slate-200 mb-2"></div>
                             <div className="h-2 w-full bg-slate-200 rounded"></div>
                        </div>
                    </div>
                    {/* Fake Main Content */}
                    <div className="flex-1 p-6 bg-slate-50 flex flex-col">
                        <div className="flex justify-between mb-8">
                            <div className="h-10 w-1/3 bg-white border border-slate-300 rounded-lg shadow-sm"></div>
                            <div className="h-10 w-32 bg-blue-600 rounded-lg shadow-sm"></div>
                        </div>
                        {/* The 'Paper' */}
                        <div className="bg-white rounded-lg border border-slate-200 flex-1 shadow-md p-8 flex flex-col relative">
                             <div className="flex justify-between items-start mb-8">
                                <div>
                                    <div className="h-8 w-40 bg-slate-800 rounded mb-2"></div> {/* Logo Placeholder */}
                                    <div className="h-2 w-24 bg-slate-200 rounded"></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-bold text-slate-200">INVOICE</div>
                                    <div className="h-2 w-20 bg-slate-200 rounded ml-auto mt-2"></div>
                                </div>
                             </div>
                             
                             {/* Fake Lines */}
                             <div className="w-full mt-4 space-y-3">
                                 <div className="flex gap-4">
                                     <div className="h-8 bg-slate-100 w-2/3 rounded"></div>
                                     <div className="h-8 bg-slate-100 w-1/3 rounded"></div>
                                 </div>
                                 <div className="flex gap-4">
                                     <div className="h-8 bg-slate-100 w-2/3 rounded"></div>
                                     <div className="h-8 bg-slate-100 w-1/3 rounded"></div>
                                 </div>
                             </div>

                             <div className="mt-auto self-end w-1/3">
                                 <div className="h-2 w-full bg-slate-200 rounded mb-2"></div>
                                 <div className="h-8 w-full bg-slate-800 rounded"></div>
                             </div>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Everything you need</h2>
            <p className="text-lg text-slate-600">Simple enough for freelancers, powerful enough for agencies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="text-amber-500" />} 
              title="Lightning Fast" 
              desc="Create a quote in under 30 seconds. Auto-calculations mean no math errors, ever." 
            />
            <FeatureCard 
              icon={<Shield className="text-emerald-500" />} 
              title="Secure & Private" 
              desc="Logged-in data is encrypted at rest using Supabase technology." 
            />
            <FeatureCard 
              icon={<CheckCircle className="text-blue-500" />} 
              title="Professional PDF" 
              desc="Generate crisp, vector-quality A4 PDFs that look perfect on any device." 
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 bg-slate-900 text-center">
        <div className="max-w-3xl mx-auto">
           <h2 className="text-3xl font-bold text-white mb-6">Ready to upgrade your workflow?</h2>
           <Link href="/editor/new" className="inline-block px-10 py-4 bg-white text-slate-900 text-lg font-bold rounded-full hover:bg-blue-50 transition transform hover:scale-105 shadow-xl">
             Create Your First Invoice
           </Link>
        </div>
      </section>

    </div>
  );
}

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300">
    <div className="mb-6 p-4 bg-white rounded-2xl inline-block shadow-sm ring-1 ring-slate-100">{icon}</div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-500 leading-relaxed">{desc}</p>
  </div>
);