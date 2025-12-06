import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 py-20 px-4">
      <div className="max-w-5xl mx-auto">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Get in Touch</h1>
          <p className="text-slate-600 dark:text-slate-400">We'd love to hear from you. Our team is always here to chat.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Contact Info Cards */}
          <div className="space-y-4">
            <ContactCard 
              icon={Mail} 
              title="Email Us" 
              info="support@prodoc.ai" 
              sub="Expect a reply in 24h" 
            />
            <ContactCard 
              icon={Phone} 
              title="Call Us" 
              info="+1 (555) 000-0000" 
              sub="Mon-Fri, 9am - 5pm EST" 
            />
            <ContactCard 
              icon={MapPin} 
              title="Visit Us" 
              info="123 Innovation Dr" 
              sub="Tech City, TC 90210" 
            />
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800">
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                <input type="email" className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"></textarea>
              </div>

              <button type="button" className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition transform active:scale-95">
                Send Message
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

const ContactCard = ({ icon: Icon, title, info, sub }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-slate-200 dark:border-gray-800 text-center hover:shadow-md transition">
    <div className="bg-blue-50 dark:bg-gray-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
      <Icon size={20} />
    </div>
    <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
    <p className="text-blue-600 dark:text-blue-400 font-medium mt-1">{info}</p>
    <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{sub}</p>
  </div>
);