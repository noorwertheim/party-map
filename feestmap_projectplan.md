# Feestmap — projectplan

## 1. Het idee

Feestmap is een eenvoudige, mobile-first kaartapp voor het ontdekken van feesten en clubavonden. Het concept lijkt op Party Atlas: gebruikers zien direct **waar** feesten plaatsvinden en kunnen filteren op **muziekgenre** en **datum**.

De app start met evenementen in heel Nederland, maar de architectuur moet later ook andere landen ondersteunen. De kaart is het centrale onderdeel, niet een lange lijst met evenementen.

### Productprincipes

- **Keep it simple:** geen yoga, algemene activiteitenagenda of overbodige sociale functies.
- **Map-first:** de kaart is het startscherm.
- **Snel filteren:** genre en datum bepalen welke pins zichtbaar zijn.
- **Mobielvriendelijk:** eerst een responsive webapp, eventueel later een installeerbare PWA of native app.
- **Vervangbare databron:** voor het lokale prototype onderzoeken we de Party Atlas API; voor structureel of publiek hergebruik regelen we eerst toestemming en een duurzame bron.

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
| Prototype-eventbron (voorwaardelijk) | Party Atlas `/api/ra-events` | RA-evenementgegevens verkennen; hergebruik alleen waar toegestaan |
| Data-adapter | TypeScript `getEvents()` | Party Atlas-response omzetten naar eigen eventmodel; later eenvoudig wisselen |
| Data-import (later) | Python | Toegestane bronnen ophalen, opschonen en normaliseren |
| Backend (optioneel, later) | FastAPI | Eigen API indien nodig |
| Database (later) | Supabase / PostgreSQL | Evenementen opslaan en ophalen |
| Frontendhosting (later) | Cloudflare Pages | Publiceren van webapp |
| Versiebeheer | Private GitHub- of GitLab-repository | Code beheren |

**Architectuurkeuze:** begin zonder eigen backend of database. Gebruik een `getEvents()`-adapter met lokale JSON als veilige fallback en een **optionele Party Atlas-adapter voor verkenning wanneer toegang en gebruik zijn toegestaan**. Een publieke deployment mag niet stilzwijgend afhankelijk worden van Party Atlas. Voeg pas infrastructuur toe wanneer nodig.

### Party Atlas: prototypebron (status: toestemming nog niet vastgesteld)

Tijdens inspectie van de webapp is dit publiek bereikbaar ogende endpoint gevonden:

```text
GET https://partyatlas.app/api/ra-events?areaId=29&from=2026-10-19&to=2026-10-19
```

De door de ontwikkelaar bekeken voorbeeldresponse heeft `data.eventListings.data` met per item een `event`, plus `totalResults`. De events bevatten onder andere `id`, `title`, `startTime`, `endTime`, `venue.location.latitude/longitude`, `genres`, `artists`, `images` en `contentUrl`. `areaId=29` correspondeert in dit voorbeeld met Amsterdam. De response heeft `access-control-allow-origin: *`, maar **CORS is geen licentie**. Party Atlas draait blijkens de responseheaders achter Fly.io; dat bewijst niet hoe hun backend RA-data ophaalt.

**Randvoorwaarden:**

- Vraag Party Atlas om toestemming voor herhaald ophalen, opslag en weergave van data in Feestmap. RA-rechten kunnen daarnaast van toepassing zijn.
- Behandel dit endpoint als ongedocumenteerd en veranderlijk; geen gegarandeerde beschikbaarheid, volledigheid of gebruiksrechten.
- Totdat toestemming duidelijk is: werk met de reeds handmatig verkregen voorbeeldresponse als lokale fixture; automatiseer geen herhaalde requests of publieke doorlevering.
- Als toestemming volgt, implementeer toegang achter een adapter, met redelijke caching, foutafhandeling en zonder omzeiling van toegangsbeperkingen.
- Bouw een fallback naar fixtures en later een eigen gelicentieerde bron.


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

- [ ] MapLibre installeren.
- [ ] `src/Map.tsx` maken.
- [ ] Kaart centreren op Nederland.
- [ ] Zoom- en navigatieknoppen toevoegen.
- [ ] De standaard Vite-pagina vervangen door de kaart.
- [ ] CSS aanpassen zodat de kaart het scherm vult.
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

### Fase 3 — Events tonen via een vervangbare adapter (ca. 1 dag)

- [ ] Definieer `FeestmapEvent` in `src/types/event.ts` (id, naam, locatie, datum/tijd, genres, coördinaten, bron-URL).
- [ ] Sla de eerder handmatig bekeken Party Atlas-JSON lokaal op als `src/data/partyAtlasSample.json` (of gebruik fictieve data).
- [ ] Maak `src/services/normalizePartyAtlas.ts` om `data.eventListings.data[].event` om te zetten naar `FeestmapEvent[]`.
- [ ] Maak `src/services/getEvents.ts` met een bronkeuze (`fixture` als standaard, `partyAtlas` pas na toestemming).
- [ ] Voeg markers toe met popups voor naam, venue, datum, genres en bronlink.
- [ ] Voeg filters voor datum en genres toe, onafhankelijk van de gekozen bron.
- [ ] Test lege resultaten, ontbrekende genres/line-ups, ontbrekende coördinaten en events na middernacht.
- [ ] Controleer de mobiele weergave.

**Voorbeeld van de externe response (ingekort):**

```json
{
  "data": {
    "eventListings": {
      "data": [
        {
          "event": {
            "id": "2524671",
            "title": "Hard Mondays Amsterdam - HARD TECHNO NIGHT",
            "startTime": "2026-10-19T23:00:00.000",
            "endTime": "2026-10-20T04:00:00.000",
            "contentUrl": "/events/2524671",
            "venue": {
              "name": "John Doe",
              "location": { "latitude": 52.366478, "longitude": 4.897596 }
            },
            "genres": [{ "name": "Hardcore" }, { "name": "Industrial" }]
          }
        }
      ],
      "totalResults": 3
    }
  }
}
```

Dit fragment is een **fixture/schema-voorbeeld**, niet een aanbeveling om de externe endpoint automatisch te bevragen. Gebruik bij voorkeur `venue.location` voor de marker en valideer coördinaten; `venue.lat/lng` zijn alternatieve velden die soms licht afwijken. De RA-datums bevatten in het voorbeeld geen expliciete tijdzone: interpreteer die niet automatisch als UTC en test de tijdzoneconversie expliciet.

**Aanbevolen adapterinterface:**

```ts
export type FeestmapEvent = {
  id: string;
  name: string;
  venue: string;
  startsAt: string;
  endsAt?: string;
  genres: string[];
  latitude: number;
  longitude: number;
  sourceUrl?: string;
};

export async function getEvents(): Promise<FeestmapEvent[]> {
  // MVP: lees en normaliseer een lokale fixture.
  // Later: vervang de implementatie door een toegestane API/backend.
  return [];
}
```

**Acceptatiecriterium:** de kaart toont evenementen uit de lokale Party Atlas-voorbeeldstructuur en de genre-/datumfilters werken; wisselen van databron vereist geen aanpassing aan kaartcomponenten.

### Fase 4 — Party Atlas-toegang toetsen en echte data koppelen (doorlooptijd onzeker)

- [ ] Neem contact op met Party Atlas over toegestane API-toegang, weergave, caching, attributie, rate limits en eventuele kosten.
- [ ] Verifieer of ook toestemming/licenties van Resident Advisor nodig zijn.
- [ ] Leg schriftelijke toestemming en gebruiksvoorwaarden vast voordat je structureel ophaalt of publiek herpubliceert.
- [ ] Indien toegestaan: implementeer een `partyAtlas`-provider achter `getEvents()`; gebruik een serverproxy als secrets of gecontroleerde caching nodig zijn.
- [ ] Voeg timeouts, responsevalidatie, lege-resultaat-afhandeling en een fixture-fallback toe.
- [ ] Beperk requests tot benodigde datumvensters en ondersteunde `areaId`-waarden; ga niet uit van automatische dekking van heel Nederland.
- [ ] Ontwerp een alternatief met rechtstreekse feeds van clubs, organisatoren of officiële evenement-API's.
- [ ] Voeg bronmetadata en deduplicatie toe wanneer meerdere bronnen beschikbaar komen.

**Belangrijk:** de Party Atlas API is geen officieel aangeboden, gedocumenteerd developerproduct voor Feestmap. Een `200 OK` of `access-control-allow-origin: *` geeft geen toestemming voor hergebruik. Als toestemming uitblijft, blijf bij fixtures en stap over op een toegestane bron.

**Acceptatiecriterium:** minimaal één toegestane bron levert herhaalbaar echte evenementen, zonder dat frontend en filters aan die bron gekoppeld zijn.

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
| Evenementdata | Lokale voorbeeldfixture €0 | Party Atlas/RA-toestemming en eventuele licentie onbekend |
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
│   │   └── partyAtlasSample.json
│   ├── services/
│   │   ├── getEvents.ts
│   │   └── normalizePartyAtlas.ts
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
- **Genres:** bepaal hoe subgenres aan hoofdgenres gekoppeld worden (bijv. deep house onder house).
- **Datum/tijd:** sla tijdstippen op met tijdzone; let op feesten die na middernacht doorgaan.
- **Meerdere events op één locatie:** bepaal hoe je overlappende pins presenteert.
- **Schaalbaarheid:** haal later alleen evenementen op binnen het zichtbare kaartgebied en relevante tijdvenster.
- **Bronrechten:** Party Atlas is de beoogde prototypebron, maar structureel gebruik en publicatie vereisen passende toestemming; de lokale fixture is de standaard totdat dit is opgehelderd.
- **Party Atlas-bereik:** `areaId` is gebiedsgebonden; een kaart van heel Nederland betekent nog niet dat de gekozen bron landelijke eventdata levert.
- **Afhankelijkheid:** zorg dat `getEvents()` kan omschakelen naar een andere provider zonder wijzigingen in UI of kaart.
- **Privacy:** geen accounts of locatiepermissies nodig voor de MVP.

## 8. Eerstvolgende actie

**Huidige stap: fase 2 — MapLibre toevoegen.**

1. Controleer dat de Vite-app lokaal draait.
2. Installeer `maplibre-gl`.
3. Voeg `src/Map.tsx` toe met de kaart van Nederland.
4. Vervang `src/App.tsx` en pas de CSS aan.
5. Start `npm run dev` en controleer dat de kaart werkt.
6. Commit de werkende kaart.

**Eerste mijlpaal:** een interactieve kaart van Nederland in de browser.

**Tweede mijlpaal:** de handmatig verkregen Party Atlas-voorbeelddata (aangevuld met fixtures) als klikbare pins, met werkende genre- en datumfilters.

**Parallelle actie:** vraag Party Atlas en zo nodig Resident Advisor naar toestemming en eventuele voorwaarden voor live API-gebruik; pas daarna automatische requests inschakelen.
