import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative w-full h-[90vh] min-h-[600px] flex items-end overflow-hidden bg-black">
      {/* Background Image Container */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/agbada_1.jpg"
          alt="Dahriola premium contemporary fashion"
          width={1920}
          height={1080}
          priority
          className="h-full w-full object-cover object-center transition-transform duration-[10000ms] hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full px-5 sm:px-8 lg:px-12 pb-12 sm:pb-20">
        <div className="mx-auto max-w-[1400px]">
          <div className="max-w-[800px]">
            
            {/* Title - Smooth Fade In (Standard Tailwind) */}
            <h1 className="font-display transition-all duration-1000 ease-out translate-y-0 opacity-100 max-w-[10ch] text-[3.5rem] leading-[0.85] tracking-[-0.04em] text-white sm:text-[4rem] lg:text-[6.5rem]">
              Premium Contemporary Fashion
            </h1>

            {/* Buttons - Interaction focus */}
            <div className="mt-8 flex flex-wrap items-center gap-4 sm:mt-10">
              <Link
                href="/shop"
                className="group relative inline-flex h-12 min-w-[140px] items-center justify-center overflow-hidden rounded-full bg-white px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-black transition-all duration-300 hover:bg-neutral-200"
              >
                <span className="relative z-10">Shop</span>
              </Link>

              <Link
                href="/BespokeGallery"
                className="inline-flex h-12 min-w-[140px] items-center justify-center rounded-full border border-white/30 bg-white/5 backdrop-blur-md px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-all duration-500 hover:border-white hover:bg-white/20 hover:-translate-y-1"
              >
                Bespoke
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}