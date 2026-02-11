# Elite Studio - Gemini & Veo Creative Platform

Elite Studio je napredna web platforma koja objedinjuje najmoćnije Googleove modele umjetne inteligencije u jedno kohezivno i luksuzno sučelje.

## 🚀 Glavne Značajke

### 1. Chat Lab (Tekstualna Inteligencija)
- **Modeli**: Gemini 3 Pro (za kompleksno zaključivanje), Gemini 3 Flash (za opće zadatke) i **Gemini Flash Lite** (za maksimalnu brzinu).
- **Google Search Grounding**: Sposobnost pretraživanja interneta u stvarnom vremenu s prikazom izvora informacija.

### 2. Visual Studio (Generiranje Slika)
- **Gemini Pro Vision**: Visoka kvaliteta i preciznost promptova.
- **Imagen 4**: Najnapredniji Googleov model za generiranje slika (ekvivalent DALL-E 3), optimiziran za fotorealizam i detalje.
- **Galerija**: Brzi pregled i organizacija generiranih vizuala.

### 3. Motion Lab (Veo Video Produkcija)
- **Text-to-Video**: Stvaranje kinematografskih isječaka iz tekstualnog opisa.
- **Image-to-Video**: Učitajte sliku i animirajte je pomoću **Veo 3.1** enginea.
- **Formati**: Odabir između 16:9 (Landscape) i 9:16 (Portrait) omjera.

### 4. Live Radio (Audio u stvarnom vremenu)
- **Native Audio**: Prirodna glasovna komunikacija s modelom bez kašnjenja.
- **Interakcija**: Model sluša, razmišlja i odgovara ljudskim glasom (Zephyr engine).

## 🛠️ Tehničke Upute i Billing

Ova aplikacija koristi **Google AI Studio** sustav za upravljanje ključevima.

### Aktivacija Plaćanja (Pay-as-you-go):
Premium modeli poput **Veo**, **Imagen 4** i **Gemini 3 Pro** često zahtijevaju API ključ koji je povezan s Google Cloud projektom koji ima **uključeno plaćanje (billing)**.
1. Ako dobijete grešku **429 (Resource Exhausted)**, to znači da ste iscrpili besplatnu kvotu.
2. U postavkama (**Setup & API**) odaberite "Change Studio Key" i odaberite projekt koji ima aktiviran Billing.
3. Aplikacija će automatski prepoznati novi ključ bez potrebe za osvježavanjem stranice.

## 📦 Struktura Projekta
- `App.tsx`: Centralna logika i upravljanje kvotama.
- `services/geminiService.ts`: Integracija s Google GenAI SDK-om i rukovanje greškama.
- `components/`: Modularni UI elementi (Chat, Live, Image, Video).
- `metadata.json`: Dozvole za kameru i mikrofon.

---
**Elite Studio** - Izgrađeno za kreativne profesionalce.
