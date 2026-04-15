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
    likes: "12.4k",
    caption: "The power of bespoke. Toke in our signature velvet drop. Pure luxury in every stitch.",
  },
  {
    id: 2,
    name: "zainabbalogun",
    video: "/videos/client-3.mp4",
    link: "https://instagram.com/dahriola_",
    likes: "8,204",
    caption: "One pair, endless style possibilities. @ibk.horbs didn't just style the Ankara Capri Pants - he owned them in multiple fresh and creative ways. <br><br> Which look is your fave? #dahriola #explore",
  },
];

export default function ClientShowcase() {
  const [index, setIndex] = useState(0);

  const nextSlide = () => setIndex((prev) => (prev === CLIENTS.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setIndex((prev) => (prev === 0 ? CLIENTS.length - 1 : prev - 1));

  return (
    <section className="relative h-[100svh] bg-black overflow-hidden flex items-center justify-center font-sans">
      
      {/* Main Instagram Wrapper */}
      <div className="relative w-full max-w-5xl lg:h-[85vh] grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] bg-black lg:border lg:border-neutral-800 overflow-hidden shadow-2xl">
        
        {/* LEFT: MEDIA SIDE */}
        <div className="relative h-full bg-black flex items-center justify-center border-r border-neutral-900">
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
                className="h-full w-full object-contain bg-black"
              >
                <source src={CLIENTS[index].video} type="video/mp4" />
              </video>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows (Desktop Style) */}
          <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-neutral-100/10 backdrop-blur-md text-white hover:bg-neutral-100/20 transition-all">
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-neutral-100/10 backdrop-blur-md text-white hover:bg-neutral-100/20 transition-all">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* RIGHT: FEED SIDE (Desktop Only) */}
        <div className="hidden lg:flex flex-col h-full bg-black">
          
          {/* Header */}
          <div className="p-3.5 flex items-center justify-between border-b border-neutral-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-700 overflow-hidden" />
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white tracking-tight">{CLIENTS[index].name}</span>
                <BadgeCheck size={16} className="text-[#0095f6] fill-[#0095f6] text-white" strokeWidth={2.5} />
                <span className="text-neutral-500 text-xs">• Follow</span>
              </div>
            </div>
            <MoreHorizontal size={20} className="text-white cursor-pointer" />
          </div>

          {/* Scrollable Caption Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex gap-3 items-start">
               <div className="w-8 h-8 shrink-0 rounded-full bg-neutral-700" />
               <div className="text-[14px]">
                 <span className="font-semibold text-white mr-2">{CLIENTS[index].name}</span>
                 <span className="text-neutral-200 leading-relaxed" dangerouslySetInnerHTML={{ __html: CLIENTS[index].caption }} />
                 <p className="text-neutral-500 text-[12px] mt-4 uppercase tracking-tighter font-medium">14h</p>
               </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-neutral-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-white">
                <Heart size={26} className="hover:text-neutral-400 transition-colors cursor-pointer" />
                <MessageCircle size={26} className="hover:text-neutral-400 transition-colors cursor-pointer" />
                <Send size={26} className="hover:text-neutral-400 transition-colors cursor-pointer" />
              </div>
              <Bookmark size={26} className="hover:text-neutral-400 transition-colors cursor-pointer" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">{CLIENTS[index].likes} likes</p>
              <p className="text-[10px] text-neutral-500 uppercase font-medium">April 15, 2026</p>
            </div>
          </div>

          {/* Add a Comment Placeholder */}
          <div className="p-4 border-t border-neutral-900 flex justify-between items-center text-sm">
            <span className="text-neutral-500">Add a comment...</span>
            <span className="text-[#0095f6] font-semibold opacity-50 cursor-default">Post</span>
          </div>
        </div>

        {/* MOBILE REEL OVERLAY */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent lg:hidden flex justify-between items-end">
          <div className="max-w-[80%] space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full border-2 border-white bg-neutral-800" />
              <span className="text-sm font-semibold text-white flex items-center gap-1">
                {CLIENTS[index].name} <BadgeCheck size={14} className="text-[#0095f6] fill-[#0095f6]" />
              </span>
              <button className="text-xs border border-white/50 rounded-md px-2 py-0.5 text-white font-semibold ml-2">Follow</button>
            </div>
            <p className="text-[13px] text-white line-clamp-2 leading-snug">
              {CLIENTS[index].caption.replace(/<br>/g, ' ')}
            </p>
          </div>
          
          <div className="flex flex-col gap-5 text-white items-center">
            <div className="flex flex-col items-center gap-1"><Heart size={28} /> <span className="text-xs">92k</span></div>
            <div className="flex flex-col items-center gap-1"><MessageCircle size={28} /> <span className="text-xs">841</span></div>
            <Send size={26} />
            <MoreHorizontal size={26} />
            <div className="w-7 h-7 rounded bg-white/20 border border-white/40" />
          </div>
        </div>

      </div>
    </section>
  );
}