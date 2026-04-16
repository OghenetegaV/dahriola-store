"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  Heart, 
  MessageCircle, 
  Send, 
  Bookmark, 
  MoreHorizontal, 
  BadgeCheck 
} from "lucide-react";

const CLIENTS = [
  {
    id: 1,
    clientName: "",
    video: "/videos/client-3.mp4",
    likes: "12,490",
    comments: "156",
    caption: "@ibk.horbs didn't just style the Ankara Capri Pants - he owned them in multiple fresh and creative ways.🔥 <br><br> Which is your favourite? <br><br> #Dahriola #LuxuryBespoke #ankaracargopants",
  },
  {
    id: 2,
    clientName: "",
    video: "/videos/client-2.mp4",
    likes: "8,204",
    comments: "92",
    caption: "@naomi_anyaegbu slayed our Wura skirt to perfection😍😍 <br><br> Beauty at it&apos;s peak! <br> Grace personified💚 <br><br> #dahriolawoman",
  },
  {
    id: 3,
    clientName: "",
    video: "/videos/client-1.mp4",
    likes: "15,102",
    comments: "214",
    caption: "Our Mide dress has been an highlight since we reposted the pretty @peacebaiyere on our story last week🥰✨ <br><br> #DahriolaWoman #BespokeFashion",
  }
];

export default function ClientShowcase() {
  const [index, setIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  if (!CLIENTS || CLIENTS.length === 0 || !CLIENTS[index]) return null;

  const nextSlide = () => {
    setIsLiked(false);
    setIndex((prev) => (prev === CLIENTS.length - 1 ? 0 : prev + 1));
  };
  const prevSlide = () => {
    setIsLiked(false);
    setIndex((prev) => (prev === 0 ? CLIENTS.length - 1 : prev - 1));
  };

  const toggleLike = () => setIsLiked(!isLiked);

  return (
    <section className="relative w-full bg-black flex items-center justify-center py-4 px-4 font-sans border-t border-neutral-900">
      
      <div className="relative w-full max-w-[935px] h-[75vh] lg:h-[calc(100vh-140px)] max-h-[800px] grid grid-cols-1 lg:grid-cols-[1fr_350px] bg-black lg:border lg:border-neutral-800 overflow-hidden shadow-2xl rounded-sm">
        
        {/* LEFT: MEDIA SIDE */}
        <div className="relative flex h-full bg-black items-center justify-center border-r border-neutral-900 overflow-hidden">
          
          {/* Centered Navigation Arrows */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 z-30 pointer-events-none">
            <button onClick={prevSlide} className="pointer-events-auto p-2 rounded-full bg-black/50 text-white border border-white/10 hover:bg-black/80 transition-all shadow-xl"><ChevronLeft size={24} /></button>
            <button onClick={nextSlide} className="pointer-events-auto p-2 rounded-full bg-black/50 text-white border border-white/10 hover:bg-black/80 transition-all shadow-xl"><ChevronRight size={24} /></button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={`video-${index}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full flex items-center justify-center">
              <video autoPlay muted loop playsInline className="h-full w-full object-contain">
                <source src={CLIENTS[index].video} type="video/mp4" />
              </video>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* RIGHT: DESKTOP SIDEBAR */}
        <div className="hidden lg:flex flex-col h-full bg-black relative">
          
          {/* SLEEK TAP INDICATOR ANIMATION */}
          <motion.div
            className="absolute bottom-[88px] left-[32px] pointer-events-none z-50"
            initial={{ opacity: 0, scale: 4 }}
            whileInView={{
              opacity: [0, 1, 1, 0],
              scale: [2, 1, 0.8, 1.5],
            }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ delay: 1.5, duration: 1.5, ease: "circOut" }}
            onAnimationComplete={() => {
              setTimeout(() => setIsLiked(true), 500); 
            }}
          >
            <div className="w-10 h-10 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            </div>
          </motion.div>


          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1 overflow-hidden">
                <img src="/logo.png" alt="Dahriola" className="w-full h-full object-contain" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-white tracking-tight">dahriola</span>
                <BadgeCheck size={16} className="text-[#0095f6] fill-[#0095f6] text-white" />
              </div>
            </div>
            <MoreHorizontal size={18} className="text-neutral-400 cursor-pointer" />
          </div>

          {/* Captions */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
            <div className="flex gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-white p-1 overflow-hidden">
                <img src="/logo.png" alt="Dahriola" className="w-full h-full object-contain" />
              </div>
              <div className="text-sm">
                <p className="text-white leading-relaxed">
                  <span className="font-semibold mr-2">dahriola</span>
                  <span dangerouslySetInnerHTML={{ __html: CLIENTS[index].caption }} />
                </p>
                <p className="text-neutral-500 text-[11px] mt-2 uppercase font-medium">Just now</p>
              </div>
            </div>
          </div>

          {/* Action Area */}
          <div className="p-4 border-t border-neutral-900 space-y-2 bg-black">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <motion.div
                    onClick={toggleLike}
                    className="cursor-pointer"
                    animate={isLiked ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {isLiked ? (
                        <Heart size={24} className="text-red-500 fill-red-500 transition-colors" />
                    ) : (
                        <Heart size={24} className="text-white hover:text-red-500 transition-colors" />
                    )}
                </motion.div>
                <MessageCircle size={24} className="hover:opacity-50 cursor-pointer" />
                <Send size={24} className="hover:opacity-50 cursor-pointer" />
              </div>
              <Bookmark size={24} className="cursor-pointer" />
            </div>
            <p className="text-sm font-semibold text-white">{CLIENTS[index].likes} likes</p>
          </div>
        </div>

        {/* MOBILE REEL OVERLAY */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-5 pb-8 bg-gradient-to-t from-black via-transparent to-transparent lg:hidden flex justify-between items-end pointer-events-none">
          <div className="max-w-[70%] space-y-3 pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white p-1 overflow-hidden">
                <img src="/logo.png" alt="Dahriola" className="w-full h-full object-contain" />
              </div>
              <span className="text-sm font-bold text-white flex items-center gap-1">
                dahriola <BadgeCheck size={14} className="text-[#0095f6] fill-[#0095f6]" />
              </span>
            </div>
            <p className="text-[13px] text-white/95 leading-relaxed line-clamp-2">
              <span className="font-semibold mr-1">{CLIENTS[index].clientName}</span>
              {CLIENTS[index].caption.replace(/<br>/g, ' ')}
            </p>
          </div>
          
          <div className="flex flex-col gap-5 text-white items-center pointer-events-auto">
            <motion.div
                onClick={toggleLike}
                animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {isLiked ? (
                    <Heart size={28} className="text-red-500 fill-red-500 transition-colors" />
                ) : (
                    <Heart size={28} className="text-white hover:text-red-500 transition-colors" />
                )}
            </motion.div>
            <span className="text-[10px] font-medium mt-[-16px]">{CLIENTS[index].likes}</span>
            <div className="flex flex-col items-center gap-1"><MessageCircle size={28} /> <span className="text-[10px] font-medium">{CLIENTS[index].comments}</span></div>
            <Send size={26} />
            <MoreHorizontal size={24} className="mt-1" />
          </div>
        </div>

      </div>
    </section>
  );
}