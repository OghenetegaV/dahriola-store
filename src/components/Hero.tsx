import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="dahriola-hero flex items-end">
      <div className="absolute inset-0 -z-20">
        <Image
          src="/bespoke.jpg"
          alt="Dahriola premium contemporary fashion"
          fill
          priority
          sizes="100vw"
          className="dahriola-hero__image"
        />
      </div>

      <div className="dahriola-hero__overlay absolute inset-0 -z-10" />

      <div className="w-full px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1400px] pt-28 pb-8 sm:pt-32 sm:pb-10 lg:pt-36 lg:pb-14">
          <div className="max-w-[760px]">

            <h1 className="font-display dahriola-fade-up dahriola-fade-up-delay-2 max-w-[8ch] text-[3rem] leading-[0.9] tracking-[-0.04em] text-brand-white sm:text-[4.5rem] lg:text-[6.5rem]">
              Premium Contemporary Fashion
            </h1>

            <div className="dahriola-fade-up dahriola-fade-up-delay-3 mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
              <Link
                href="/shop"
                className="inline-flex h-11 min-w-[118px] items-center justify-center rounded-full bg-brand-white px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-black transition-all duration-500 hover:-translate-y-0.5 hover:bg-brand-sage"
              >
                Shop
              </Link>

              <Link
                href="/bespoke"
                className="dahriola-glass-btn inline-flex h-11 min-w-[118px] items-center justify-center rounded-full border border-white/70 bg-white/5 px-6 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-white transition-all duration-500 hover:-translate-y-0.5 hover:border-white hover:bg-white/12"
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