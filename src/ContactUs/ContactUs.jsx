import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function ContactUs() {
  const navigate = useNavigate();
  const goHome = () => navigate('/login', { replace: true });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-3 md:p-6 animate-[fadeIn_0.5s_ease-out]">
      <div className="w-full max-w-lg bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-white/60 p-5 md:p-8">
        <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 text-lg hover:text-primary hover:border-primary hover:-translate-x-0.5 transition-all shadow-sm cursor-pointer flex-shrink-0 font-sans mb-5" onClick={goHome} title="Back to Home">
          <i className="pi pi-arrow-left"></i>
        </button>

        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-5 relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-1 after:w-14 after:bg-gradient-to-r after:from-primary after:to-primary-light after:rounded">
          Contact Developer
        </h2>

        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="pi pi-user text-2xl text-white"></i>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-5">Aishwary Jhaveri</h3>

          <div className="flex flex-col gap-3 mb-6">
            <a href="tel:+918160682897" className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl border border-gray-200 text-gray-600 text-sm md:text-base font-medium no-underline transition-all hover:border-primary hover:bg-indigo-50 hover:text-primary-dark hover:-translate-y-0.5 hover:shadow-md">
              <i className="pi pi-phone text-lg text-primary"></i>
              <span>8160682897</span>
            </a>

            <a href="mailto:aishwaryzaveri@gmail.com" className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-xl border border-gray-200 text-gray-600 text-sm md:text-base font-medium no-underline transition-all hover:border-primary hover:bg-indigo-50 hover:text-primary-dark hover:-translate-y-0.5 hover:shadow-md">
              <i className="pi pi-envelope text-lg text-primary"></i>
              <span>aishwaryzaveri@gmail.com</span>
            </a>
          </div>

          <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-200 mb-5 text-left">
            <i className="pi pi-info-circle text-lg text-primary flex-shrink-0 mt-0.5"></i>
            <p className="m-0 text-indigo-800 text-sm leading-relaxed">
              Please contact the developer to purchase additional login slots.
            </p>
          </div>
        </div>

        <div className="flex justify-center mt-5">
          <button className="!bg-gradient-to-r !from-primary !to-primary-dark !text-white !font-semibold !rounded-lg !px-5 !py-2.5 !shadow-md hover:!shadow-lg hover:!-translate-y-0.5 !transition-all !border-none inline-flex items-center cursor-pointer font-sans" onClick={goHome}>
            <i className="pi pi-home mr-2"></i>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
