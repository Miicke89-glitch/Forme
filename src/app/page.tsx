"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Footer, Header } from "@/components/ui";
import { useT, type Key } from "@/lib/i18n";
import type { Dims } from "@/lib/types";

const Preview3D = dynamic(() => import("@/components/Preview3D"), { ssr: false });

const DEMO: Dims = {
  w: { value: 160, source: "customer" }, d: { value: 90, source: "customer" },
  h: { value: 95, source: "customer" }, h2: { value: 60, source: "customer" },
};

export default function Home() {
  const { t } = useT();
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-10 md:grid-cols-2 md:pt-20">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-clay">{t("hero.kicker")}</p>
            <h1 className="font-display text-4xl leading-tight text-forest sm:text-5xl md:text-6xl">{t("hero.title")}</h1>
            <p className="mt-5 max-w-lg text-lg text-ink/80">{t("hero.body")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/order" className="btn btn-primary text-lg">{t("hero.cta")} →</Link>
              <span className="text-sm text-moss">{t("hero.sub")}</span>
            </div>
          </div>
          <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-sand">
            <Preview3D shape="sloped" dims={DEMO} autoRotate className="h-full w-full" />
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/80 px-3 py-1 text-xs text-moss">
              {t("hero.caption")}
            </span>
          </div>
        </section>

        <section id="how" className="scroll-mt-20 bg-sand py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-display text-3xl text-forest sm:text-4xl">{t("how.title")}</h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <li key={n} className="card p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest font-bold text-white">{n}</span>
                  <h3 className="mt-4 text-xl font-semibold">{t(`how.${n}.t` as Key)}</h3>
                  <p className="mt-2 text-ink/75">{t(`how.${n}.b` as Key)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl text-forest sm:text-4xl">{t("trust.title")}</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border-t-2 border-forest pt-4">
                <h3 className="text-lg font-semibold">{t(`trust.${n}.t` as Key)}</h3>
                <p className="mt-2 text-ink/75">{t(`trust.${n}.b` as Key)}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 rounded-[2rem] bg-forest px-6 py-12 text-center text-white">
            <p className="font-display text-2xl sm:text-3xl">“Take a photo. Add dimensions. We make it fit.”</p>
            <Link href="/order" className="btn mt-6 bg-white text-forest hover:bg-sand">{t("trust.cta")} →</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
