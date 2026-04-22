# LAN '26 Poll

Retro game poll app voor de LAN party. React + Vite + Firebase Realtime Database.

## Setup

### 1. Firebase project aanmaken
1. Ga naar [console.firebase.google.com](https://console.firebase.google.com)
2. Maak een nieuw project aan
3. Ga naar **Build → Realtime Database** → maak een database aan (kies Europe West)
4. Zet de rules tijdelijk op open (voor de LAN party):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
5. Ga naar **Project settings → Your apps → Web app** → kopieer de config

### 2. Environment variables
```bash
cp .env.example .env
```
Vul je Firebase config in in `.env`.

### 3. Lokaal draaien
```bash
npm install
npm run dev
```

### 4. Deployen naar Vercel
```bash
# Push naar GitHub, dan in Vercel:
# 1. Import GitHub repo
# 2. Voeg environment variables toe (zelfde als .env)
# 3. Deploy
```

Of via Vercel CLI:
```bash
npm i -g vercel
vercel --prod
```
Vergeet niet de environment variables in te stellen via `vercel env add`.

## Features
- Realtime stemmen via Firebase
- Games toevoegen (verschijnt direct bij iedereen)
- Stem herzien op basis van naam
- Live resultaten met bar charts
- Reset functie
