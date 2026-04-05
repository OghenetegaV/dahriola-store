{/* Bespoke CTA Section with Fabric Background */}
      <section className="relative h-[500px] w-full overflow-hidden flex items-center justify-center">
        {/* Background Image with Blur */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/fabric.jpg"
            alt="Fabric texture"
            fill
            className="object-cover scale-100"
          />
          {/* Overlay to ensure text stands out */}
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <h4 className="font-display text-4xl md:text-6xl lowercase mb-8 text-white tracking-tighter">
            need a <span className="italic text-brand-beryl">unique</span> outfit?
          </h4>
          <p className="text-white/80 text-sm mb-10 max-w-md mx-auto font-light leading-relaxed">
            Whether it&apos;s a dream design or a special occasion, let&apos;s create something that is uniquely yours.
          </p>
          <Link 
            href="/bespoke" 
            className="inline-block bg-white text-neutral-900 text-[10px] uppercase tracking-[0.4em] px-12 py-5 rounded-full hover:bg-brand-beryl hover:text-white transition-all active:scale-95"
          >
            Start Bespoke Inquiry
          </Link>
        </div>
      </section>