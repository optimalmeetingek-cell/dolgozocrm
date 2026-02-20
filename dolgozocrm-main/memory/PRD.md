# Dolgozó CRM - PRD & Dokumentáció

## Projekt Áttekintés
**Verzió:** 1.2.0  
**Utolsó frissítés:** 2025.12.22  
**Státusz:** MVP Kész + Előzmények Funkció

## Célcsoport
- Munkaerő-kölcsönző cégek
- HR csapatok
- Toborzók
- Projektmenedzserek

## Felhasználói Szerepkörök

### Admin
- Minden dolgozót lát (összes toborzóét)
- Szűrhet toborzó szerint
- Törölhet dolgozót
- Látja ki hány dolgozót vitt fel (statisztikák)
- Excel export összes dolgozóról
- Felhasználókat kezelhet (létrehozás)
- Típusok, státuszok, jellemzők kezelése
- Látja ki adta hozzá a dolgozót (profil ikon + név)
- Látja ki hozta létre a projektet
- Toborzókat rendelhet projektekhez

### Toborzó (User)
- Csak saját dolgozóit látja
- Nem törölhet, csak szerkeszthet
- Excel export saját dolgozókról
- Csak saját projektjeit látja (amit ő hozott létre VAGY hozzá van rendelve)

---

## Implementált Funkciók

### 1. Autentikáció
- [x] JWT alapú bejelentkezés
- [x] 24 órás token lejárat
- [x] Jelszó változtatás
- [x] Profil szerkesztés

### 2. Dolgozók Kezelése
- [x] CRUD műveletek
- [x] Kategóriák (Felvitt, Hideg jelentkező, Ingázó, Szállásos, stb.)
- [x] Típusok (Betanított munkás, Szakmunkás, Targoncás, stb.)
- [x] Pozíció mező (szabadon beírható szöveg)
- [x] Pozíció tapasztalat mező
- [x] Jellemzők (Tags) színes címkékkel
- [x] Toborzó megjelenítés (profil ikon + név) táblázatban
- [x] Kompakt táblázatos nézet
- [x] **Előzmények fül** - projekt részvételek és státuszok megjelenítése
- [x] **Probléma számláló** - piros badge negatív státuszoknál

### 3. Projektek Kezelése
- [x] CRUD műveletek
- [x] Elvárt létszám mező
- [x] Aktuális/elvárt létszám kijelzés
- [x] Feltöltöttség százalék + progress bar
- [x] Dolgozó hozzáadás/eltávolítás
- [x] Státusz kezelés dolgozónként
- [x] **Megjegyzés mező** státusz változtatáskor
- [x] Projekt lezárás/újranyitás
- [x] Toborzó hozzárendelés projektekhez (multi-select)
- [x] Létrehozó megjelenítés (profil ikon + név)
- [x] RBAC: toborzó csak saját/hozzárendelt projekteket látja
- [x] **Megjegyzés oszlop** a dolgozók táblázatában

### 4. Excel Export
- [x] Toborzónként külön XLS fájl
- [x] Kategóriánként külön lapok
- [x] Admin: összes dolgozó export
- [x] Formázott fejlécek, automatikus oszlopszélesség

### 5. Admin Panel
- [x] Dolgozó típusok kezelése
- [x] Projekt státuszok kezelése  
- [x] Jellemzők kezelése (szín választóval)
- [x] Felhasználók listázása
- [x] Felhasználó létrehozás (email + jelszó)
- [x] Toborzó statisztikák (ki hány dolgozót vitt fel)

### 6. Mobilbarát Design
- [x] Responsive layout minden oldalon
- [x] Mobil navigáció (hamburger menü)
- [x] Touch-barát gombok és inputok
- [x] Kattintható telefonszámok

---

## Technikai Stack

- **Backend:** FastAPI (Python)
- **Frontend:** React 19 + Tailwind CSS
- **Adatbázis:** MongoDB
- **UI komponensek:** shadcn/ui
- **Autentikáció:** JWT + bcrypt

## API Végpontok

### Auth
- POST /api/auth/login
- POST /api/auth/register (admin only)
- GET /api/auth/me
- PUT /api/auth/profile
- PUT /api/auth/password

### Workers
- GET /api/workers (szűrhető: search, category, worker_type_id, tag_id, owner_id)
- GET /api/workers/:id
- POST /api/workers
- PUT /api/workers/:id
- DELETE /api/workers/:id (admin only)
- POST /api/workers/:id/tags/:tagId
- DELETE /api/workers/:id/tags/:tagId

### Projects
- GET /api/projects (RBAC szűrés: toborzó csak saját/hozzárendelt)
- GET /api/projects/:id
- POST /api/projects
- PUT /api/projects/:id
- DELETE /api/projects/:id
- POST /api/projects/:id/workers
- DELETE /api/projects/:id/workers/:workerId
- **PUT /api/projects/:id/workers/:workerId/status** (státusz + megjegyzés)
- POST /api/projects/:id/recruiters (toborzó hozzárendelés)
- DELETE /api/projects/:id/recruiters/:userId (toborzó eltávolítás)

### Admin
- GET /api/worker-types
- POST /api/worker-types (admin)
- DELETE /api/worker-types/:id (admin)
- GET /api/statuses
- POST /api/statuses (admin)
- DELETE /api/statuses/:id (admin)
- GET /api/tags
- POST /api/tags (admin)
- DELETE /api/tags/:id (admin)
- GET /api/users (admin)
- GET /api/users/stats (admin)

### Export
- GET /api/export/workers
- GET /api/export/workers/:userId (admin)
- GET /api/export/all (admin)

---

## Adatmodell

### Worker
```json
{
  "id": "uuid",
  "name": "string",
  "phone": "string",
  "worker_type_id": "uuid",
  "position": "string (szabadon beírható)",
  "position_experience": "string",
  "category": "string",
  "address": "string",
  "email": "string",
  "experience": "string",
  "notes": "string",
  "tag_ids": ["uuid"],
  "owner_id": "uuid",
  "created_at": "datetime"
}
```

### Project
```json
{
  "id": "uuid",
  "name": "string",
  "date": "date",
  "location": "string",
  "notes": "string",
  "expected_workers": "int",
  "recruiter_ids": ["uuid"],
  "is_closed": "boolean",
  "owner_id": "uuid",
  "created_at": "datetime"
}
```

### ProjectWorker (dolgozó-projekt kapcsolat)
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "worker_id": "uuid",
  "status_id": "uuid",
  "notes": "string (megjegyzés)",
  "added_by": "uuid",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

## Teszt Felhasználók

| Email | Jelszó | Szerepkör |
|-------|--------|-----------|
| admin@dolgozocrm.hu | admin123 | Admin |
| toborzo@dolgozocrm.hu | toborzo123 | Toborzó |

---

## Jövőbeli Fejlesztések (Backlog)

### P1 - Fontos
- [ ] Elavult pozíció kezelő kód törlése az Admin Panelből
- [ ] Email értesítések (új dolgozó, státusz változás)
- [ ] Űrlapos jelentkezés (nyilvános form)
- [ ] Állásajánlatok modul

### P2 - Nice to have
- [ ] Képfeltöltés dolgozókhoz
- [ ] PDF export/riport
- [ ] Statisztikák és grafikonok
- [ ] Import Excel-ből

---

## Változásnapló

### v1.2.0 (2025.12.22)
- **Előzmények fül**: Dolgozóknál új "Előzmények" tab a projekt részvételekkel
- **Megjegyzés funkció**: Státusz változtatáskor megjegyzés írható (pl. "Nem jelent meg, nem vette fel a telefont")
- **Probléma számláló**: Piros badge a dolgozó fejlécében negatív státuszok számlálásával
- **Színes státuszok**: Pozitív (zöld) és negatív (piros) státuszok vizuális megkülönböztetése
- **Megjegyzés oszlop**: Projekt dolgozó listában látszik a megjegyzés

### v1.1.0 (2025.12.22)
- Tulajdonos megjelenítés: Dolgozóknál és projekteknél látszik ki hozta létre
- RBAC bővítés: Toborzók csak saját projektjeiket látják
- Toborzó hozzárendelés: Admin toborzókat rendelhet projektekhez
- Pozíció mező: Szabadon beírható szöveg
- Pozíció tapasztalat: Új mező a dolgozóknál
- Kompakt táblázat: Dolgozók lista átdolgozva táblázatos nézetre

### v1.0.0 (2025.02.19)
- Teljes MVP implementáció
- Toborzó szerepkör korlátozások
- Excel export funkció
- Elvárt létszám projekteknél
- Mobilbarát design
