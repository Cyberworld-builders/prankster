import Image from "next/image";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Hero: full-bleed image container */}
      <div className="absolute inset-0">
        <Image
          src="/images/pranksterface.png"
          alt="Scary Prankster"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Low-opacity black overlay */}
        <div className="absolute inset-0 bg-black/55" aria-hidden />
      </div>

      {/* Content overlay: centered, z-index above image */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-sans text-5xl font-bold tracking-tight sm:text-7xl">
          Scary Prankster
        </h1>
        <p className="font-mono mt-6 max-w-2xl text-lg text-[#e8e8e8]/90 sm:text-xl">
          The dark of the Void is infinite but the light of Creation is
          endless....
        </p>
        <p className="font-mono mt-4 text-sm text-[#e8e8e8]/60">
          Coming soon.
        </p>
      </div>
    </div>
  );
}
