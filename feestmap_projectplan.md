# Feestmap — projectplan

## 1. Het idee

Feestmap is een eenvoudige, mobile-first kaartapp voor het ontdekken van feesten en clubavonden. Het concept lijkt op Party Atlas: gebruikers zien direct **waar** feesten plaatsvinden en kunnen filteren op **muziekgenre** en **datum**.

De app start met evenementen in heel Nederland, maar de architectuur moet later ook andere landen ondersteunen. De kaart is het centrale onderdeel, niet een lange lijst met evenementen.

### Productprincipes

- **Keep it simple:** geen yoga, algemene activiteitenagenda of overbodige sociale functies.
- **Map-first:** de kaart is het startscherm.
- **Snel filteren:** genre en datum bepalen welke pins zichtbaar zijn.
- **Mobielvriendelijk:** eerst een responsive webapp, eventueel later een installeerbare PWA of native app.
- **Betrouwbare gegevens:** toon alleen evenementen uit bronnen die hergebruik toestaan.

### MVP-functionaliteiten

1. Interactieve kaart met Nederland als beginweergave; vrij in- en uitzoomen, ook buiten Nederland.
2. Pins voor evenementen op basis van lengte- en breedtegraad.
3. Klik/tik op een pin voor naam, locatie, datum, tijd, genres en link naar tickets of organisator.
4. Filter op muziekgenre (bijv. house, techno, disco, drum & bass).
5. Filter op datum (vandaag, morgen, weekend of specifieke datum).
6. Responsive layout voor telefoon en desktop.

**Bewust buiten de MVP:** gebruikersaccounts, vrienden, chats, reviews, aanbevelingsalgoritmen, betalingen en notificaties.

## 2. Onderscheid ten opzichte van bestaande apps

Party Atlas is de belangrijkste referentie: een kaartgerichte webapp voor feesten. Andere evenementplatforms bieden vaak veel bredere activiteiten of extra functies. Feestmap wil juist een eenvoudige en goed werkende kaart voor het nachtleven zijn.

Mogelijke onderscheidende punten om te **onderzoeken en valideren**:

- Betere mobiele gebruikerservaring.
- Breder geografisch bereik (heel Nederland in plaats van alleen een stad).
- Completere dekking door meerdere **toegestane** evenementbronnen te combineren.
- Duidelijke en consistente genre-indeling.

Dit zijn producthypothesen, geen bewezen voordelen. Vergelijk de dekking, snelheid en bruikbaarheid met Party Atlas en andere aanbieders voordat je er ontwikkeltijd in investeert.

## 3. Voorgestelde technologie

| Onderdeel | Keuze | Doel |
|---|---|---|
| Frontend | React + TypeScript | UI en filters |
| Ontwikkeltool | Vite | Lokale server en productiebuild |
| Kaartbibliotheek | MapLibre GL JS | Interactieve kaart, markers en popups |
| Kaarttegels/stijl | OpenFreeMap voor prototype | Kaartweergave zonder API-key; controleer voorwaarden voor productie |
| Data-import (later) | Python | Evenementen ophalen, opschonen en normaliseren |
| Backend (optioneel, later) | FastAPI | Eigen API indien nodig |
| Database (later) | Supabase / PostgreSQL | Evenementen opslaan en ophalen |
| Frontendhosting (later) | Cloudflare Pages | Publiceren van webapp |
| Versiebeheer | Private GitHub- of GitLab-repository | Code beheren |

**Architectuurkeuze:** begin zonder eigen backend of database. Gebruik eerst lokale fictieve JSON-data; voeg pas infrastructuur toe wanneer echte data beschikbaar is.

## 4. Stappenplan

### Fase 1 — Project opzetten (ca. 1–2 uur)

- [ ] Private Git-repository aanmaken, bijvoorbeeld `feestmap`.
- [ ] Node.js LTS en npm installeren.
- [ ] Repository lokaal clonen en openen in VS Code.
- [ ] React + TypeScript + Vite initialiseren.
- [ ] Dependencies installeren en ontwikkelserver starten.
- [ ] Eerste commit pushen.

```bash
# Vanuit de bestaande repositorymap:
npm create vite@latest . -- --template react-ts
npm install
npm run dev
```

Controleer of de standaard Vite-pagina opent op de URL die de terminal toont (meestal `http://localhost:5173/`). Als de repository al een README bevat, zorg dat die behouden blijft bij het initialiseren.

### Fase 2 — Kaart toevoegen (ca. 3–6 uur)

- [x] MapLibre installeren.
- [x] `src/Map.tsx` maken.
- [x] Kaart centreren op Nederland.
- [x] Zoom- en navigatieknoppen toevoegen.
- [x] De standaard Vite-pagina vervangen door de kaart.
- [x] CSS aanpassen zodat de kaart het scherm vult.
- [ ] Op desktop en telefoon testen.

```bash
npm install maplibre-gl
```

**`src/Map.tsx`**

```tsx
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [5.3, 52.1], // [longitude, latitude]
      zoom: 6.8,
    });

    map.addControl(new maplibregl.NavigationControl());

    return () => map.remove();
  }, []);

  return <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />;
}
```

**`src/App.tsx`**

```tsx
import Map from "./Map";

export default function App() {
  return <Map />;
}
```

**`src/index.css`**

```css
* { box-sizing: border-box; }
html, body, #root { margin: 0; width: 100%; height: 100%; }
body { min-width: 320px; }
```

Verwijder eventueel beperkende standaardstijlen uit `src/App.css` (of verwijder de import als het bestand niet meer wordt gebruikt).

**Acceptatiecriterium:** een volledig schermvullende, interactieve kaart van Nederland waarop je kunt pannen en zoomen.

### Fase 3 — Fictieve evenementen en filters (ca. 1 dag)

- [x] Maak `src/data/events.ts` met circa 20 fictieve evenementen in meerdere Nederlandse steden.
- [x] Definieer een TypeScript-type `Event` met ID, naam, venue, stad, starttijd, eindtijd (optioneel), genres, coördinaten en URL (optioneel).
- [x] Toon elk evenement als marker op de kaart.
- [x] Toon een popup/detailkaart bij een klik.
- [x] Voeg een genre-filter toe; meerdere genres kunnen selecteerbaar zijn.
- [ ] Voeg een datumfilter toe.
- [ ] Zorg dat markers direct reageren op filterwijzigingen.
- [ ] Test de mobiele weergave.

Voorbeeld van een fictief evenement:

```json
{
  "id": "event-001",
  "name": "Saturday House Session",
  "venue": "Club Example",
  "city": "Amsterdam",
  "starts_at": "2026-10-24T23:00:00+02:00",
  "genres": ["house", "deep-house"],
  "latitude": 52.37,
  "longitude": 4.89,
  "ticket_url": "https://example.com/tickets"
}
```

**Acceptatiecriterium:** de kaart toont fictieve feesten in verschillende steden en genre-/datumfilters veranderen de zichtbare pins correct.

### Fase 4 — Echte evenementdata (ca. 1–3 dagen of langer)

- [x] Vraag Resident Advisor om toestemming/API-toegang (aangevraagd door de gebruiker).
- [ ] Bevestig toegang en afspraken voor ophalen en weergeven; toestemming is nog niet bevestigd.
- [ ] Onderzoek welke organisatoren, ticketplatforms of evenementenplatforms een officiële API, feed of toestemming voor hergebruik bieden.
- [ ] Vergelijk dekking en voorwaarden van verschillende bronnen.
- [ ] Maak een uniform datamodel en genre-taxonomie.
- [ ] Bouw een Python-importscript voor de gekozen bron(nen).
- [ ] Zet adressen zo nodig via geocoding om in coördinaten.
- [ ] Verwijder dubbele evenementen en leg de herkomst vast.
- [ ] Controleer actualiteit, annuleringen en ontbrekende gegevens.

**Belangrijk:** Resident Advisor heeft een onofficiële GraphQL-endpoint, maar dat is niet automatisch een toegestane of stabiele databron. Gebruik geautomatiseerde toegang en herpublicatie alleen met de benodigde toestemming en conform de voorwaarden. Ook PartyPilot heeft voor zover onderzocht geen publiek gedocumenteerde API. Bouw geen productieafhankelijkheid op ongedocumenteerde endpoints zonder toestemming.

**Acceptatiecriterium:** minstens één legitieme bron levert betrouwbaar en herhaalbaar echte evenementen.

### Fase 5 — Opslag en automatische updates (ca. 1–2 dagen)

- [ ] Supabase/PostgreSQL-project aanmaken als lokale data niet meer volstaat.
- [ ] Tabellen voor evenementen, locaties en eventueel bronnen/genres ontwerpen.
- [ ] Importscript idempotent maken (upserts in plaats van duplicaten).
- [ ] Periodieke updates instellen.
- [ ] Basislogging en foutafhandeling toevoegen.
- [ ] Alleen publieke, noodzakelijke velden aan de frontend beschikbaar maken; secrets nooit in frontendcode plaatsen.

Een aparte FastAPI-backend is **optioneel**. Als de frontend veilig rechtstreeks publieke eventdata uit Supabase kan lezen, kun je die backend voorlopig overslaan.

### Fase 6 — Publiceren en valideren (ca. 1 dag, exclusief verbeteringen)

- [ ] Productiebuild maken met `npm run build`.
- [ ] Deployen op bijvoorbeeld Cloudflare Pages.
- [ ] Op mobiel en desktop testen.
- [ ] Performance, laadgedrag en kaartproviderlimieten controleren.
- [ ] Eventueel PWA-ondersteuning toevoegen.
- [ ] Testen met vrienden: vinden zij snel een relevant feest?
- [ ] Feedback verzamelen en pas daarna uitbreiden.

**Later, indien zinvol:** native iOS/Android-app via bijvoorbeeld React Native/Expo, met extra ontwikkelwerk en appstorekosten. Een PWA is niet hetzelfde als een native app.

## 5. Kostenindicatie

| Kostenpost | Eerste prototype | Later |
|---|---|---|
| React, TypeScript, Vite, MapLibre | €0 | €0 |
| Private Git-repository | €0 op gratis tier | Afhankelijk van plan |
| Kaartprovider | Mogelijk €0 | Afhankelijk van verkeer en voorwaarden |
| Frontendhosting | €0 lokaal | Vaak gratis instapniveau |
| Database/backend | Niet nodig | Gratis tier of betaald |
| Domeinnaam | Niet nodig | Indicatief €1–€2/maand |
| Evenementdata | Fictieve data €0 | Licentie/voorwaarden nog onbekend |
| Apple Developer | Niet nodig | $99/jaar voor App Store-publicatie |
| Google Play | Niet nodig | $25 eenmalig voor ontwikkelaarsregistratie |

Dit zijn indicaties, geen offerte of garantie van actuele prijzen. **Het prototype kan gratis worden ontwikkeld.** De grootste onbekende voor een publieke app is de toegang tot evenementgegevens.

## 6. Voorgestelde projectstructuur (later)

```text
feestmap/
├── public/
├── src/
│   ├── components/
│   │   ├── EventMap.tsx
│   │   ├── EventPopup.tsx
│   │   └── EventFilters.tsx
│   ├── data/
│   │   └── events.ts
│   ├── types/
│   │   └── event.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── scripts/                 # Later: Python-data-import
├── package.json
├── README.md
└── ...
```

Dit is een groeirichting, geen structuur die direct helemaal moet worden aangemaakt.

## 7. Belangrijkste ontwerpkeuzes en open vragen

- **Geografie:** start met Nederland, maar ondersteun kaartnavigatie wereldwijd. Breid evenementdekking pas uit als er bronnen beschikbaar zijn.
- **Genres:** house omvat ook deep house. Bij meerdere geselecteerde genres is één overeenkomst voldoende; zonder selectie zijn alle genres zichtbaar.
- **Datum/tijd:** sla tijdstippen op met tijdzone; let op feesten die na middernacht doorgaan.
- **Meerdere events op één locatie:** bepaal hoe je overlappende pins presenteert.
- **Schaalbaarheid:** haal later alleen evenementen op binnen het zichtbare kaartgebied en relevante tijdvenster.
- **Bronrechten:** verifieer toestemming, actualiteit en licentievoorwaarden voordat echte data wordt geïmporteerd.
- **Privacy:** geen accounts of locatiepermissies nodig voor de MVP.

## 8. Eerstvolgende actie

**Huidige stap: fase 3 — genre-filter controleren, daarna datumfilters toevoegen.**

De kaart werkt volgens de browsercontrole van de gebruiker. Het kaartcontrast is daarna aangepast. Er zijn nu 20 fictieve feesten in 20 steden toegevoegd, met paarse pins en popups. Het genre-filter ondersteunt meerdere selecties, house inclusief deep house en een reset naar alle genres. De teller toont het aantal bijpassende feesten; de kaartpositie blijft behouden wanneer de pins veranderen. De build, datacontroles en controles van de filterlogica slagen. Pins, popups en filters moeten nog visueel worden gecontroleerd, ook op mobiel.

1. Open de lokaal draaiende app en kies Techno: de teller hoort 6 van 20 aan te geven.
2. Kies daarnaast House: de teller hoort 15 van 20 aan te geven, zonder dubbele pins.
3. Klik op Alle genres: alle 20 feesten worden weer getoond.
4. Controleer dat de kaartpositie behouden blijft en pins en popups correct reageren.
5. Voeg vervolgens de datumfilters toe, gecombineerd met de genreselectie.
6. Test de mobiele weergave en commit de werkende wijzigingen.

Resident Advisor is de voorkeursbron voor de API. De gebruiker heeft toestemming gevraagd; in afwachting daarvan blijven we fictieve data gebruiken.

**Eerste mijlpaal:** een interactieve kaart van Nederland in de browser.

**Tweede mijlpaal:** 20 fictieve feesten met klikbare pins en werkende genre- en datumfilters.
