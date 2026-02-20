# Dolgozó CRM - Telepítési Útmutató

## Rendszerkövetelmények

- **Node.js** 18+ (frontend)
- **Python** 3.10+ (backend)
- **MongoDB** 6.0+ (adatbázis)

---

## 1. Fájlok Letöltése

A projekt két fő mappából áll:
```
dolgozocrm/
├── backend/          # FastAPI Python backend
│   ├── server.py
│   ├── requirements.txt
│   └── .env
├── frontend/         # React frontend
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env
└── README.md
```

---

## 2. Backend Telepítés

### 2.1 Python környezet
```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate

# Linux/Mac:
source venv/bin/activate
```

### 2.2 Függőségek telepítése
```bash
pip install -r requirements.txt
```

### 2.3 Környezeti változók (.env)
Hozz létre egy `.env` fájlt a `backend/` mappában:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=dolgozocrm
JWT_SECRET=egyedi-titkos-kulcs-legalabb-32-karakter
CORS_ORIGINS=http://localhost:3000
```

### 2.4 Backend indítása
```bash
# Fejlesztési mód
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Produkciós mód
uvicorn server:app --host 0.0.0.0 --port 8001 --workers 4
```

### 2.5 Seed adatok létrehozása
Első indítás után hívd meg a seed endpoint-ot:
```bash
curl -X POST http://localhost:8001/api/seed
```

Ez létrehozza:
- Admin felhasználó: `admin@dolgozocrm.hu` / `admin123`
- Teszt toborzó: `toborzo@dolgozocrm.hu` / `toborzo123`
- Alapértelmezett típusok, státuszok, címkék

---

## 3. Frontend Telepítés

### 3.1 Függőségek telepítése
```bash
cd frontend
yarn install
# vagy
npm install
```

### 3.2 Környezeti változók (.env)
Hozz létre egy `.env` fájlt a `frontend/` mappában:

```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

**Produkció esetén** a saját domain-edet add meg:
```env
REACT_APP_BACKEND_URL=https://api.temainded.hu
```

### 3.3 Frontend indítása
```bash
# Fejlesztési mód
yarn start
# vagy
npm start

# Produkciós build
yarn build
# vagy
npm run build
```

A `build/` mappa tartalmát másold fel a webszerverre.

---

## 4. Produkciós Telepítés

### 4.1 MongoDB
- Használj MongoDB Atlas-t (ingyenes tier), vagy
- Telepíts lokális MongoDB-t

### 4.2 Backend (VPS/Szerver)

**Systemd service fájl** (`/etc/systemd/system/dolgozocrm.service`):
```ini
[Unit]
Description=Dolgozó CRM Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/dolgozocrm/backend
Environment="PATH=/var/www/dolgozocrm/backend/venv/bin"
ExecStart=/var/www/dolgozocrm/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable dolgozocrm
sudo systemctl start dolgozocrm
```

### 4.3 Nginx konfiguráció

```nginx
server {
    listen 80;
    server_name dolgozocrm.hu www.dolgozocrm.hu;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name dolgozocrm.hu www.dolgozocrm.hu;

    ssl_certificate /etc/letsencrypt/live/dolgozocrm.hu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dolgozocrm.hu/privkey.pem;

    # Frontend (statikus fájlok)
    root /var/www/dolgozocrm/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.4 SSL tanúsítvány (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dolgozocrm.hu -d www.dolgozocrm.hu
```

---

## 5. cPanel Tárhely Telepítés

Ha cPanel-es tárhely.eu vagy hasonló szolgáltatást használsz:

### 5.1 Python alkalmazás
1. cPanel → Setup Python App
2. Python verzió: 3.10+
3. Application root: `backend`
4. Application URL: `api.dolgozocrm.hu` vagy `dolgozocrm.hu/api`
5. Startup file: `server.py`
6. Application entry point: `app`

### 5.2 Node.js alkalmazás (frontend build)
1. Lokálisan futtasd: `yarn build`
2. A `build/` mappa tartalmát töltsd fel a `public_html` mappába

### 5.3 .htaccess (SPA routing)
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

---

## 6. Biztonsági Beállítások

### 6.1 Kötelező teendők
- [ ] Változtasd meg a `JWT_SECRET`-et egy erős, egyedi kulcsra
- [ ] Változtasd meg az admin jelszót első bejelentkezés után
- [ ] Állíts be HTTPS-t (SSL tanúsítvány)
- [ ] Korlátozd a CORS_ORIGINS-t a saját domain-edre

### 6.2 MongoDB biztonság
- Használj erős jelszót
- Korlátozd a hozzáférést IP cím alapján
- Engedélyezd a hitelesítést

---

## 7. Hibaelhárítás

### Backend nem indul
```bash
# Ellenőrizd a logokat
tail -f /var/log/dolgozocrm.log

# Ellenőrizd a MongoDB kapcsolatot
mongo --eval "db.adminCommand('ping')"
```

### Frontend 404 hiba
- Ellenőrizd, hogy a `.htaccess` vagy nginx konfig megfelelő-e
- SPA routing kell: minden 404-et az `index.html`-re irányíts

### CORS hiba
- Ellenőrizd a `CORS_ORIGINS` környezeti változót
- A frontend URL-nek pontosan egyeznie kell

---

## 8. Kapcsolat

Ha kérdésed van a telepítéssel kapcsolatban, ellenőrizd:
1. A környezeti változók helyesek-e
2. A MongoDB fut-e és elérhető-e
3. A portok nyitva vannak-e (8001 backend, 3000 frontend dev)

---

## Verziók

- **Backend**: FastAPI 0.115.x, Python 3.10+
- **Frontend**: React 19, Node.js 18+
- **Adatbázis**: MongoDB 6.0+
