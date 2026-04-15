"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ChevronRight, ChevronLeft, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck } from "lucide-react";

const CLIENTS = [
  {
    id: 1,
    name: "tokemakinwa",
    video: "/videos/client-1.mp4",
    link: "https://instagram.com/dahriola_",
    caption: "The power of bespoke. Toke in our signature velvet drop. Pure luxury in every stitch.",
  },
  {
    id: 1,
    name: "tokemakinwa",
    video: "/videos/client-2.mp4",
    link: "https://instagram.com/dahriola_",
    caption: "The power of bespoke. Toke in our signature velvet drop. Pure luxury in every stitch.",
  },
  {
    id: 2,
    name: "zainabbalogun",
    video: "/videos/client-3.mp4",
    link: "https://instagram.com/dahriola_",
    caption: "One pair, endless style possibilities. @ibk.horbs didn't just style the Ankara Capri Pants - he owned them in multiple fresh and creative ways. The looks, the video, the vibe? 10/10! This is how you turn one statement piece into a full-on fashion moment. <br><br> Which look is your fave? #dahriola #explore #streetwear #ankaracargopants",
  },
];

export default function ClientShowcase() {
  const [index, setIndex] = useState(0);

  const nextSlide = () => setIndex((prev) => (prev === CLIENTS.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setIndex((prev) => (prev === 0 ? CLIENTS.length - 1 : prev - 1));

  return (
    <section className="relative h-[100svh] bg-black overflow-hidden flex items-center justify-center">
      
      {/* Container: Max-width for desktop, full-screen for mobile */}
      <div className="relative w-full max-w-6xl lg:h-[85vh] grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] bg-black lg:bg-neutral-900/40 lg:rounded-3xl lg:border lg:border-white/5 overflow-hidden shadow-2xl">
        
        {/* VIDEO AREA (Full screen on mobile, left side on desktop) */}
        <div className="relative h-[100svh] lg:h-full bg-black overflow-hidden border-r border-white/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={`video-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full"
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover lg:object-contain"
              >
                <source src={CLIENTS[index].video} type="video/mp4" />
              </video>
            </motion.div>
          </AnimatePresence>

          {/* MOBILE OVERLAY UI (Only visible on small screens) */}
          <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden">
            <div className="flex justify-between items-end pb-10">
              <div className="space-y-4 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-white/50 overflow-hidden">
                    <video src={CLIENTS[index].video} autoPlay muted loop className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm font-bold text-white tracking-tight flex items-center gap-1">
                    {CLIENTS[index].name} <BadgeCheck size={14} className="text-blue-500 fill-blue-500" />
                  </span>
                </div>
                <p className="text-xs text-white/90 line-clamp-2 leading-snug">
                  {CLIENTS[index].caption}
                </p>
                <a href={CLIENTS[index].link} target="_blank" className="inline-flex items-center gap-2 text-[10px] text-white/60 uppercase tracking-widest font-bold">
                  View Story <ArrowUpRight size={12} />
                </a>
              </div>
              
              {/* Vertical Action Bar (Reel Style) */}
              <div className="flex flex-col gap-6 text-white items-center">
                <div className="flex flex-col items-center gap-1"><Heart size={26} /> <span className="text-[10px]">9k</span></div>
                <div className="flex flex-col items-center gap-1"><MessageCircle size={26} /> <span className="text-[10px]">124</span></div>
                <Send size={24} />
                <MoreHorizontal size={24} />
              </div>
            </div>
          </div>

          {/* SHARED NAVIGATION ARROWS */}
          <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 lg:hover:bg-black/60 transition-all">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 lg:hover:bg-black/60 transition-all">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* DESKTOP-ONLY FEED UI (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col h-full bg-black">
          <div className="p-4 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-brand-beryl p-[2px]">
                <div className="w-full h-full rounded-full bg-neutral-800 overflow-hidden">
                   <video src={CLIENTS[index].video} autoPlay muted loop className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-white tracking-tight">{CLIENTS[index].name}</span>
                <BadgeCheck size={14} className="text-blue-500 fill-blue-500" />
              </div>
            </div>
            <MoreHorizontal size={18} className="text-neutral-400" />
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex gap-3">
               <span className="text-xs font-bold text-white">{CLIENTS[index].name}</span>
               <p className="text-xs text-neutral-300 leading-relaxed">{CLIENTS[index].caption}</p>
            </div>
          </div>

          <div className="p-4 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-white">
                <Heart size={22} className="hover:text-red-500 cursor-pointer" />
                <MessageCircle size={22} />
                <Send size={22} />
              </div>
              <Bookmark size={22} />
            </div>
            <p className="text-xs font-bold text-white">Liked by dahriola and others</p>
          </div>

          <a href={CLIENTS[index].link} target="_blank" className="p-4 border-t border-white/5 flex items-center justify-between group bg-white/5 hover:bg-brand-beryl/10 transition-colors">
            <span className="text-xs text-neutral-400 group-hover:text-white">View full story on Instagram...</span>
            <ArrowUpRight size={16} className="text-neutral-500 group-hover:text-brand-beryl" />
          </a>
        </div>

      </div>
    </section>
  );
}