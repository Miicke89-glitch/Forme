# FORME

*Custom covers. Made effortless.* — beställningstjänst för specialtillverkade överdrag.
Kunden fotograferar sitt föremål, anger mått, får en 3D-förhandsvisning och skickar en offertförfrågan
som tillverkaren granskar innan pris och produktion fastställs.

Det här är **fas 1 (Beställnings-MVP)** enligt produktvisionen.

## Kom igång

```bash
npm install
npm run dev          # http://localhost:3000
```

Leverantörsportalen finns på `/supplier`. I utvecklingsläge är nyckeln `forme-demo`;
i produktion måste `SUPPLIER_KEY` sättas (se `.env.example`), annars är portalen låst.

## Vad som finns

| Del | Sökväg |
| --- | --- |
| Startsida (sv/en) | `src/app/page.tsx` |
| Kundresan: foto → mått → förhandsvisning → offert | `src/app/order/page.tsx` |
| Kundens sida: status, komplettering, offertsvar, utskrift/PDF | `src/app/request/[id]` |
| Leverantörsportal: lista, granskning, komplettering, korrigering, offert, måttgodkännande, leverans | `src/app/supplier` |
| Teknisk motor: formmallar, validering, status A/B/C, 2D-vyer | `src/lib/geometry.ts` |
| 3D-förhandsvisning (Three.js / React Three Fiber) | `src/components/Preview3D.tsx` |
| Måttsatta front-, sido- och toppvyer (SVG) | `src/components/Drawings.tsx` |
| API och lagring | `src/app/api`, `src/lib/store.ts` |

Principer från underlaget som koden följer:

- All geometri beräknas av programkod från bekräftade mått; 3D och 2D bygger på samma värden.
- Varje mått sparar sitt ursprung (kund / leverantör / föreslaget) och okända mått markeras – inget gissas.
- Ritningar är märkta PRELIMINÄR tills leverantören dokumenterat godkänt måtten; utan det går en order inte till produktion.
- Varje förfrågan har projektnummer, revisionsnummer och revisionshistorik.

## Inte byggt ännu

- **Databas:** förfrågningar sparas i en JSON-fil (`.data/requests.json`). Det fungerar lokalt och på en egen server,
  men inte på serverlösa plattformar som Vercel. `src/lib/store.ts` är gjord för att bytas mot Supabase/PostgreSQL.
- **Inloggning:** leverantörsportalen skyddas av en delad nyckel, inte rollbaserade konton.
- **Mejl:** inga notifieringar skickas; kunden följer sin förfrågan via sin länk.
- **PDF:** underlaget skrivs ut / sparas som PDF via webbläsaren, inte servergenererat.
- **AI-bildtolkning, betalning (Stripe), prismotor:** fas 2–3.
