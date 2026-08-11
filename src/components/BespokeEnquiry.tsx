"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MapPin, Globe, CheckCircle2, X, PhoneCall, Upload, Image as ImageIcon } from "lucide-react";

// The Library Imports
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { sendBespokeEnquiry } from "@/src/app/actions/bespoke";

export default function BespokeEnquiry() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [phoneValue, setPhoneValue] = useState<string | undefined>();
  const [isBulk, setIsBulk] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Field state
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("Bridal & Wedding Party");
  const [vision, setVision] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFileName(f.name);
      setImageFile(f);
    }
  };

  // Convert a File to raw base64 (no data: prefix) for the server action.
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      // Guard against very large images (email attachment limits ~10MB).
      let image = null;
      if (imageFile) {
        if (imageFile.size > 8 * 1024 * 1024) {
          setErrorMsg("That image is too large (max 8MB). Please upload a smaller one.");
          setSubmitting(false);
          return;
        }
        const contentBase64 = await fileToBase64(imageFile);
        image = {
          filename: imageFile.name,
          contentBase64,
          contentType: imageFile.type || "image/jpeg",
        };
      }

      const res = await sendBespokeEnquiry({
        clientName,
        email,
        phone: phoneValue,
        service,
        vision,
        isBulk,
        image,
      });

      if (res.success) {
        setIsSubmitted(true);
        // reset the form
        setClientName("");
        setEmail("");
        setPhoneValue(undefined);
        setService("Bridal & Wedding Party");
        setVision("");
        setIsBulk(false);
        setFileName(null);
        setImageFile(null);
      } else {
        setErrorMsg(res.message || "Something went wrong. Please try again or call us.");
      }
    } catch (err) {
      setErrorMsg("Something went wrong sending your enquiry. Please try again or call us.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex  justify-center items-center relative">
      
      {/* SUCCESS POPUP */}
      <AnimatePresence>
        {isSubmitted && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl text-center relative"
            >
              <button onClick={() => setIsSubmitted(false)} className="absolute top-6 right-6 text-neutral-400 hover:text-black">
                <X size={20} />
              </button>
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <CheckCircle2 size={32} />
                </div>
              </div>
              <h3 className="font-display text-3xl text-neutral-900 lowercase tracking-tighter mb-4">request received</h3>
              <p className="text-sm text-neutral-500 mb-8">
                Thank you for reaching out. A member of our staff will contact you within <span className="font-bold">24 hours</span> to discuss your vision in further detail.
              </p>
              <div className="bg-neutral-50 rounded-2xl p-6 border border-neutral-100">
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold mb-3">Urgent Orders?</p>
                <a href="tel:+2347065364401" className="flex items-center justify-center gap-3 text-neutral-900 font-bold transition-transform hover:scale-105">
                  <PhoneCall size={18} /> Call the Designer
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
        className="w-full max-w-2xl bg-white shadow-[0_30px_100px_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden border border-neutral-100 flex flex-col"
      >
        <div className="bg-neutral-900 p-8 text-center space-y-2">
          <h2 className="font-display text-3xl text-white lowercase tracking-tighter">bespoke enquiry</h2>
          <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold">dahriola</p>
        </div>

        <div className="p-8 md:p-12 space-y-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Client Name</label>
                <input required type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-neutral-50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-neutral-200 transition-all" placeholder="e.g. Temi Adekoya" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Phone Number</label>
                <div className="atelier-phone-input">
                  <PhoneInput
                    international
                    defaultCountry="NG"
                    value={phoneValue}
                    onChange={setPhoneValue}
                    placeholder="Enter phone number"
                    className="flex w-full bg-neutral-50 rounded-xl px-4 py-1.5 text-sm outline-none border-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Email Address</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-neutral-50 border-none rounded-xl px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-neutral-200 transition-all" placeholder="contact@email.com" />
            </div>

            <div className="space-y-1 relative">
              <label className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Service Interest</label>
              <select value={service} onChange={(e) => setService(e.target.value)} className="w-full bg-neutral-50 border-none rounded-xl px-4 py-3 text-sm outline-none appearance-none text-neutral-600 cursor-pointer focus:ring-1 focus:ring-neutral-200 transition-all">
                <option>Bridal & Wedding Party</option>
                <option>Red Carpet & Gala</option>
                <option>Traditional Bespoke (Aso-Ebi)</option>
                <option>Ready-to-Wear Customization</option>
                <option>Corporate Outfits</option>
                <option>Branding / Uniforms</option>
                <option>Consultation Only</option>
                <option>Others</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Your Vision</label>
              <textarea rows={3} value={vision} onChange={(e) => setVision(e.target.value)} className="w-full bg-neutral-50 border-none rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-1 focus:ring-neutral-200 transition-all" placeholder="Describe the design or occasion..." />
            </div>

            {/* INSPIRATION UPLOAD BAR */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold ml-1">Do you have Inspo Pictures? (Optional)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-neutral-50 border border-dashed border-neutral-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-neutral-400 group-hover:text-neutral-900 transition-colors">
                    <Upload size={18} strokeWidth={1.5} />
                  </div>
                  <span className="text-xs text-neutral-500">
                    {fileName ? fileName : "Upload your inspos or sketches"}
                  </span>
                </div>
                {fileName && <ImageIcon size={16} className="text-neutral-900" />}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden" 
                />
              </div>
            </div>

            {/* BULK ORDER CHECKBOX */}
            <div className="flex items-center gap-3 py-1 group cursor-pointer" onClick={() => setIsBulk(!isBulk)}>
                <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${isBulk ? 'bg-neutral-900 border-neutral-900' : 'bg-transparent border-neutral-300 group-hover:border-neutral-900'}`}>
                    {isBulk && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="text-[11px] uppercase tracking-widest text-neutral-600 font-medium select-none">This is a bulk order enquiry</span>
            </div>

            {errorMsg && (
              <p className="text-[12px] text-red-500 text-center">{errorMsg}</p>
            )}

            <button type="submit" disabled={submitting} className="w-full bg-neutral-900 text-white py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-neutral-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? "Sending..." : (<>Send Enquiry <Send size={14} /></>)}
            </button>
          </form>

          {/* <div className="pt-4 border-t border-neutral-100 flex flex-wrap justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400"><MapPin size={14} /></div>
              <p className="text-[10px] text-neutral-500 font-medium">Lagos, Nigeria</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400"><Globe size={14} /></div>
              <p className="text-[10px] text-neutral-500 font-medium">Worldwide Shipping</p>
            </div>
          </div> */}
        </div>
      </motion.div>

      <style jsx global>{`
        .atelier-phone-input .PhoneInputInput {
          background: transparent;
          border: none;
          outline: none;
          padding: 10px 0;
          font-size: 14px;
        }
        .atelier-phone-input .PhoneInputCountry {
          margin-right: 10px;
        }
        .atelier-phone-input .PhoneInputCountrySelectArrow {
          display: none;
        }
      `}</style>
    </section>
  );
}