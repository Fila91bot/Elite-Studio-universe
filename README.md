# Elite Studio - Gemini Multimodal Platform

Elite Studio je napredna web platforma koja objedinjuje najmoćnije Googleove modele umjetne inteligencije u jedno kohezivno i luksuzno sučelje.

## 🚀 Glavne Značajke

### 1. Chat Lab (Tekstualna Inteligencija)
- **Modeli**: Gemini 3.1 Pro (za kompleksno zaključivanje), Gemini 2.5 Flash (za opće zadatke).
- **Google Search Grounding**: Sposobnost pretraživanja interneta u stvarnom vremenu s prikazom izvora informacija.

### 2. Code Studio Lab
- **Gemini 3.1 Pro**: Visoka kvaliteta i preciznost promptova.
- **Gemini 2.5 Flash**: Brz, besplatan, multimodalan.
- **Galerija**: Brzi pregled i organizacija generiranih dokumenata.

### 4. Live Radio (Audio u stvarnom vremenu)
- **Gemini 2.5 Flash Native Audio i Gemini 1.5 Flash za lite razgovore.
- **Native Audio**: Prirodna glasovna komunikacija s modelom bez kašnjenja.
- **Interakcija**: Model sluša, vidi (preko kamere), razmišlja i odgovara ljudskim glasom (Zephyr engine).

## 🛠️ Tehničke Upute i Billing

Ova aplikacija koristi **Google AI Studio** sustav za upravljanje ključevima.

### Aktivacija Plaćanja (Pay-as-you-go):
Premium modeli poput **Gemini 3.1 Pro** često zahtijevaju API ključ koji je povezan s Google Cloud projektom koji ima **uključeno plaćanje (billing)**.
1. Ako dobijete grešku **429 (Resource Exhausted)**, to znači da ste iscrpili besplatnu kvotu.
2. U postavkama (**Setup & API**) odaberite "Change Studio Key" i odaberite projekt koji ima aktiviran Billing.
3. Aplikacija će automatski prepoznati novi ključ bez potrebe za osvježavanjem stranice.

## 📦 Struktura Projekta
- `App.tsx`: Centralna logika i upravljanje kvotama.
- `services/geminiService.ts`: Integracija s Google GenAI SDK-om i rukovanje greškama.
- `components/`: Modularni UI elementi (Chat, Live, CODE STUDIO LAB).
- `metadata.json`: Dozvole za kameru i mikrofon.
- ELITE STUDIO v2
├── 🗨️ Chat Lab - Gemini 3.1 PRO + 2.5 Flash
│   └── Povezat sa Code Lab-om (clipboard actions)
│
├── 🎙️ Live Lab - Gemini 2.5 Flash Native Audio
│   └── Dodat: Gemini 1.5 Flash za lite razgovore
│   └── Povezat: Live tutoring ili customer support mode
│
└── 🆕 CODE STUDIO LAB
    ├── Code Upload & Analysis (Gemini 3.1 PRO)
    ├── Real-time Documentation (Gemini 2.5 Flash)
    ├── Live Pair Programming (Gemini 2.5 Flash Audio)
    └── Integration sa Chat Labom

---
**Elite Studio v2** - Izgrađeno za kreativne profesionalce.
