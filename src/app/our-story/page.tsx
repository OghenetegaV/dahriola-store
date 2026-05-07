import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Our Story | Dahriola",
  description:
    "Learn the story behind Dahriola, a Nigerian-based contemporary African fashion brand founded by Lola.",
  openGraph: {
    title: "Our Story | Dahriola",
    description:
      "Learn the story behind Dahriola, a Nigerian-based contemporary African fashion brand founded by Lola.",
    url: "https://www.dahriola.com/our-story",
    siteName: "Dahriola",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dahriola Our Story",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Story | Dahriola",
    description:
      "Learn the story behind Dahriola, a Nigerian-based contemporary African fashion brand founded by Lola.",
    images: ["/og-image.jpg"],
  },
};

export default function OurStoryPage() {
  return (
    <main className="bg-[#fbfaf7] text-neutral-900">
      {/* HERO */}
      <section className="pt-32 md:pt-40 pb-12 px-5 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mx-auto mb-5 flex h-9 w-9 items-center justify-center">
            <span className="block h-2 w-2 rounded-full bg-brand-beryl" />
          </div>

          <p className="text-[10px] uppercase tracking-[0.45em] text-brand-beryl font-bold mb-5">
            Behind the Brand
          </p>

          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-[-0.04em] leading-none text-black">
            Our Story
          </h1>
        </div>
      </section>

      {/* STORY CONTENT */}
      <section className="px-5 md:px-8 pb-20 md:pb-28">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* OWNER IMAGE */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="relative w-full overflow-hidden rounded-[2rem] bg-neutral-100 shadow-[0_35px_90px_-50px_rgba(0,0,0,0.55)]">
                <Image
                  src="/founder.jpg"
                  alt="Lola, founder of Dahriola"
                  width={900}
                  height={1200}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>

              <div className="mt-8 text-center">
                <h2 className="font-display text-4xl md:text-5xl tracking-[-0.04em] text-black">
                  Lola
                </h2>

                <div className="mt-5 flex items-center justify-center gap-3">
                  <span className="h-px w-20 bg-brand-beryl/30" />
                  <span className="h-1.5 w-1.5 rotate-45 bg-brand-beryl" />
                  <span className="h-px w-20 bg-brand-beryl/30" />
                </div>

                <p className="mt-5 text-[10px] uppercase tracking-[0.35em] text-neutral-400 font-bold">
                  Founder / Creative Director
                </p>
              </div>
            </div>
          </aside>

          {/* TEXT */}
          <article className="lg:col-span-7">
            <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_90px_-70px_rgba(0,0,0,0.5)] p-6 md:p-10 lg:p-12">
              <div className="space-y-6 text-[15px] md:text-[16px] leading-8 text-neutral-700">
                <p>
                  DAHRIOLA is a Nigerian-based contemporary African fashion
                  brand founded in 2021, built on the idea that clothing should
                  feel natural, expressive, and comfortable—without forcing
                  people into unrealistic standards of style or body type.
                </p>

                <p>
                  The foundation of the brand is deeply personal. Growing up,
                  fashion was always present in my environment through my mother,
                  who ran a fashion business. As a child, I wasn’t actively
                  interested in tailoring or construction, but I was constantly
                  surrounded by styling, fabrics, colours, and the quiet
                  discipline of putting pieces together intentionally. Without
                  realising it, that environment shaped my understanding of
                  fashion from an early age.
                </p>

                <p>
                  My interest in fashion design and garment creation came later
                  in life. I gradually moved from appreciation to
                  practice—learning, experimenting, and building the technical
                  skills that would eventually lead to the creation of DAHRIOLA
                </p>

                <p>
                  DAHRIOLA first began as a small streetwear-focused
                  idea—hoodies, sweatshirts, and everyday pieces that felt easy,
                  comfortable, and expressive. But as the brand grew, so did its
                  purpose.
                </p>

                <p>
                  Today, DAHRIOLA is a Nigerian-based contemporary African
                  fashion brand designed with one clear intention: to challenge
                  the idea that people have to fit into a certain body type or
                  standard before clothing looks good on them. We believe
                  clothing should adapt to the wearer—not the other way around.
                  Comfort, confidence, and individuality are at the core of every
                  piece we create.
                </p>

                <p>
                  Over time, we have evolved into a more structured design house,
                  offering versatile unisex and womenswear pieces that reflect
                  both culture and modern lifestyle. Our focus remains on
                  creating clothing that feels good, looks intentional, and fits
                  real people living real lives.
                </p>

                <p>
                  At the heart of DAHRIOLA is community. We value the people who
                  wear our pieces, engage with our journey, and grow with us.
                  Every collection is a continuation of that relationship between
                  design and the people it is made for.
                </p>

                <p className="font-medium text-black">
                  DAHRIOLA is not just a brand—it is an ongoing expression of
                  growth, identity, and the belief that style should feel
                  natural, not forced.
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* VALUES STRIP */}
      <section className="border-y border-neutral-100 bg-white px-5 md:px-8 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center px-4">
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-black">
              Nigerian Roots
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Designed with culture at our core.
            </p>
          </div>

          <div className="text-center px-4">
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-black">
              Made For Every Body
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Clothing that adapts to you.
            </p>
          </div>

          <div className="text-center px-4">
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-black">
              Timeless By Design
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Pieces that move with you, season after season.
            </p>
          </div>

          <div className="text-center px-4">
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-black">
              Community First
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              We grow through the people who wear and believe in us.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}