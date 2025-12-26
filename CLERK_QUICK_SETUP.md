# Clerk Setup - Quick Guide 🚀

## 1. Webhook in Clerk einrichten (WICHTIG!)

Damit User-Daten von Clerk zu Supabase synchronisiert werden:

### Schritt 1: Webhook Endpoint erstellen
1. Gehe zu: https://dashboard.clerk.com/
2. Wähle deine App: **warm-chamois-25**
3. Sidebar → **Webhooks** → **Add Endpoint**

### Schritt 2: URL & Events konfigurieren
**Webhook URL:**
- Für Produktion: `https://deine-domain.com/api/webhooks/clerk`
- Für lokalen Test: Nutze Clerk CLI (siehe unten)

**Events auswählen** (alle markieren):
- ✅ `user.created`
- ✅ `user.updated`  
- ✅ `user.deleted`
- ✅ `organization.created`
- ✅ `organization.updated`
- ✅ `organizationMembership.created`
- ✅ `organizationMembership.updated`

### Schritt 3: Webhook Secret speichern
1. Nach dem Erstellen des Endpoints → **Signing Secret** kopieren
2. Secret in `.env` eintragen:

```bash
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 2. Organizations aktivieren

1. Clerk Dashboard → **Organizations** (Sidebar)
2. Toggle auf **ON** schalten
3. Einstellungen:
   - **Name format:** Organization name
   - **Max memberships:** Unlimited (oder dein Limit)

---

## 3. Admin User erstellen

**NACH dem ersten Login:**

1. Gehe zu Clerk Dashboard → **Users**
2. Klicke auf deinen User
3. Gehe zu **Metadata** → **Public Metadata**
4. Klicke **Edit**
5. Füge hinzu:

```json
{
  "role": "admin"
}
```

6. **Save** klicken
7. Ausloggen + neu einloggen → Admin Dashboard verfügbar!

---

## 4. Lokale Webhook Tests (Optional)

Für lokale Entwicklung (localhost):

```bash
# Clerk CLI installieren
npm install -g @clerk/clerk-cli

# Webhook an localhost forwarden
clerk webhooks forward --url http://localhost:3000/api/webhooks/clerk
```

---

## ✅ Fertig!

Nach dem Setup kannst du:
- Login/Signup testen
- Admin Dashboard nutzen (nach Role-Zuweisung)
- User-Daten werden automatisch zu Supabase synchronisiert

---

## 🔑 Wichtige URLs

- **Clerk Dashboard:** https://dashboard.clerk.com/
- **Deine App:** warm-chamois-25
- **Webhook Endpoint:** `/api/webhooks/clerk`
- **Login:** http://localhost:3000/login
- **Signup:** http://localhost:3000/signup
- **Dashboard:** http://localhost:3000/app
- **Admin:** http://localhost:3000/admin
