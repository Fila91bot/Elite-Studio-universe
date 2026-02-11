# Elite Studio - Plan Testiranja

Ovaj dokument opisuje kako provjeriti ispravnost rada aplikacije Elite Studio.

## 1. Brzi Dijagnostički Test (Unutar aplikacije)
Idite na **Setup & API** (donji lijevi kut) i kliknite na **"Run System Diagnostics"**. 
Aplikacija će pokušati:
- Inicijalizirati API klijent.
- Poslati testni upit Gemini Flash modelu.
- Provjeriti status kvota.

## 2. Ručno Testiranje po Modulima

### Chat Lab (Tekst)
- [ ] Odaberite **Gemini Flash Lite** i pošaljite poruku "Zdravo". Odgovor mora biti trenutan.
- [ ] Odaberite **Gemini 3 Pro** i uključite **Web Search**. Pitajte: "Tko je pobijedio na zadnjoj utakmici [klub]?". Provjerite pojavljuju li se linkovi (izvori) na dnu poruke.

### Visual Studio (Slike)
- [ ] Generirajte sliku pomoću **Flash** modela.
- [ ] Prebacite na **Imagen 4** i generirajte nešto kompleksno (npr. "A futuristic city in the style of Van Gogh").
- [ ] *Očekivano*: Imagen 4 može trajati nekoliko sekundi duže, ali mora rezultirati visokom rezolucijom.

### Motion Lab (Video / Veo)
- [ ] **Samo tekst**: Unesite "A peaceful waterfall" i kliknite Generate.
- [ ] **Image-to-Video**: Učitajte bilo koju PNG/JPG sliku, unesite prompt "Animate the background" i kliknite na **Animate Image with Veo**.
- [ ] *Očekivano*: Status se mora mijenjati iz "Initializing" u "Synthesizing" te na kraju prikazati video player.

### Live Radio (Audio)
- [ ] Kliknite na ikonu mikrofona (dozvolite pristup u browseru).
- [ ] Recite "Hello, can you hear me?". 
- [ ] *Očekivano*: Pulsirajući krug mora reagirati na vaš glas, a Gemini bi trebao odgovoriti glasom (osigurajte da su zvučnici upaljeni).

## 3. Testiranje Grešaka (429 Quota)
- Ako koristite besplatni ključ, pokušajte generirati 2-3 videa zaredom.
- Aplikacija bi trebala prikazati crveni banner: **"Free Tier Quota Exhausted"**.
- Provjerite radi li gumb **"Unlock Unlimited"** (mora otvoriti dijalog za unos ključa).

## 4. Automatski Testovi (Lokalno)
Ako imate instaliran `vitest` ili `jest`, možete pokrenuti `GeminiService.test.ts`.
