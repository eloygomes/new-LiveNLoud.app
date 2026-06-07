import { useMemo } from "react";

import musicianImage from "../../assets/musician.jpg";

const musicBackdrops = [
  musicianImage,
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1800&q=85",
  "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=1800&q=85",
];

export default function AuthShell({
  title,
  subtitle,
  panelTitle,
  panelCopy,
  hideHeader = false,
  children,
}) {
  const backdropImage = useMemo(() => {
    const index = Math.floor(Math.random() * musicBackdrops.length);
    return musicBackdrops[index];
  }, []);

  return (
    <div className="relative h-[100dvh] min-h-[100dvh] overflow-hidden bg-[#5f6660] px-4 py-5 md:h-[calc(100dvh/var(--desktop-app-zoom))] md:min-h-[calc(100dvh/var(--desktop-app-zoom))] lg:px-8">
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
        style={{ backgroundImage: `url(${backdropImage})` }}
      />
      <div className="absolute inset-0 bg-[#4f574f]/72" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),rgba(0,0,0,0.34))]" />

      <div className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-4">
        {!hideHeader ? (
          <div className="hidden neuphormism-b items-center justify-between rounded-[20px] bg-white/80 px-6 backdrop-blur lg:flex">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[goldenrod]">
                # sustenido
              </div>
              <h1 className="mt-1 text-2xl font-bold uppercase tracking-tight sm:text-3xl">
                {title}
              </h1>
            </div>
            <div className="hidden text-right text-sm text-gray-500 md:block">
              Keep the same access flow.
            </div>
          </div>
        ) : null}

        <div className="flex min-h-0 flex-1 items-center justify-center">
          <main className="grid w-full max-w-5xl overflow-hidden rounded-[8px] border border-white/30 bg-[#efefef]/88 p-2 shadow-[0_18px_54px_rgba(0,0,0,0.26),0_0_42px_rgba(255,255,255,0.28),inset_1px_1px_0_rgba(255,255,255,0.82),inset_-1px_-1px_0_rgba(172,172,172,0.26)] backdrop-blur-md lg:h-[min(710px,calc(100dvh-2.5rem))] lg:grid-cols-[1.03fr,0.97fr]">
            <section className="relative hidden min-h-0 overflow-hidden rounded-[6px] lg:block">
              <img
                src={backdropImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-10 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[goldenrod]">
                  # sustenido
                </p>
                <h2 className="mt-4 max-w-sm text-3xl font-bold uppercase leading-none sm:text-4xl">
                  {panelTitle}
                </h2>
                <p className="mt-4 max-w-md text-sm font-medium leading-6 text-white/86">
                  {panelCopy}
                </p>
                <div className="mt-7 flex gap-2">
                  <span className="h-2 w-8 rounded-full bg-white" />
                  <span className="h-2 w-2 rounded-full bg-white/45" />
                  <span className="h-2 w-2 rounded-full bg-white/45" />
                </div>
              </div>
            </section>

            <section className="flex h-[calc(100dvh-2.5rem)] w-full items-center justify-center overflow-y-auto rounded-[6px] bg-[#f4f4f2] px-5 py-8 sm:px-8 lg:h-full lg:px-12">
              <div className="w-full max-w-md">
                <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-full bg-[#efefef] text-xl font-black uppercase text-black shadow-[6px_6px_14px_rgba(180,180,180,0.65),-6px_-6px_14px_rgba(255,255,255,0.95)]">
                  #
                </div>
                <div className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-[goldenrod]">
                  Account access
                </div>
                <div className="mt-4 text-center text-2xl font-bold uppercase leading-tight sm:text-3xl">
                  {subtitle}
                </div>
                <div className="mx-auto mt-3 max-w-sm text-center text-sm leading-6 text-gray-600">
                  Use the same routes and actions already connected to the
                  backend.
                </div>

                <div className="mt-8">{children}</div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
