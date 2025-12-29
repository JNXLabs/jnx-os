# Vercel Environment Variables - Shopify Configuration Update

**Last Updated:** 2024-12-29
**Production URL:** https://www.jnxlabs.ai

## 🎯 Action Required

Bitte diese Environment Variables im **Vercel Dashboard** setzen:

### Navigation:
1. Gehe zu: https://vercel.com/dashboard
2. Wähle Projekt: **jnx-os** (oder wie auch immer es heißt)
3. Gehe zu: **Settings** → **Environment Variables**

---

## 📋 Variables zum Hinzufügen/Aktualisieren

### **1. SHOPIFY_API_KEY**
```
SHOPIFY_API_KEY=6e62aef5f8013048ca5b446fa86c6fae
```
- Environments: ✅ Production, ✅ Preview, ✅ Development

### **2. SHOPIFY_API_SECRET**
```
SHOPIFY_API_SECRET=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
```
- Environments: ✅ Production, ✅ Preview, ✅ Development
- **WICHTIG:** Als **Secret** markieren (wird nicht angezeigt)

### **3. SHOPIFY_APP_URL** ⚠️ **KRITISCH**
```
SHOPIFY_APP_URL=https://www.jnxlabs.ai
```
- Environments: ✅ Production, ✅ Preview, ✅ Development
- **WICHTIG:** Muss EXAKT mit der Shopify App URL übereinstimmen!

### **4. SHOPIFY_SCOPES**
```
SHOPIFY_SCOPES=read_products,read_product_listings,read_customers,read_orders
```
- Environments: ✅ Production, ✅ Preview, ✅ Development
- **WICHTIG:** Kommas OHNE Leerzeichen!

### **5. SHOPIFY_WEBHOOK_SECRET** (Optional)
```
SHOPIFY_WEBHOOK_SECRET=to_be_generated_by_shopify
```
- Kann vorerst leer bleiben
- Wird später von Shopify generiert

---

## 🔐 Shopify Partner Dashboard - Verification Checklist

### Zu überprüfen in: https://partners.shopify.com → Apps → QRYX

#### ✅ **App URL** (bereits korrekt):
```
https://www.jnxlabs.ai
```

#### ⚠️ **Allowed Redirection URL(s)** - MUSS HINZUGEFÜGT WERDEN:
```
https://www.jnxlabs.ai/api/shopify/callback
```

**Wie hinzufügen:**
1. Gehe zu: Apps → QRYX → Configuration
2. Scrolle zu: **Allowed redirection URL(s)**
3. Füge hinzu: `https://www.jnxlabs.ai/api/shopify/callback`
4. **Save** klicken

#### ✅ **API Scopes** (bereits korrekt):
```
read_customers, read_orders, read_product_listings, read_products
```

---

## 🚀 Nach dem Update

### 1. Vercel Redeploy
1. Gehe zu: Vercel Dashboard → Deployments
2. Klicke auf **Latest Deployment**
3. Klicke auf **"Redeploy"** (3-Punkte-Menü)
4. ⚠️ **WICHTIG:** Deaktiviere **"Use existing Build Cache"**
5. Klicke **Redeploy**
6. Warte 2-3 Minuten

### 2. Teste Installation Flow
1. Öffne: https://www.jnxlabs.ai/app/qryx
2. Erwartung: "Qryx Not Installed" (nicht "Configuration Error")
3. Klicke: **"Install Qryx on Shopify"** Button
4. Erwartung: Redirect zu Shopify OAuth
5. Format der Redirect URL:
   ```
   https://YOUR-STORE.myshopify.com/admin/oauth/authorize?
   client_id=6e62aef5f8013048ca5b446fa86c6fae&
   scope=read_products,read_product_listings,read_customers,read_orders&
   redirect_uri=https://www.jnxlabs.ai/api/shopify/callback&
   state=...
   ```

---

## 🐛 Troubleshooting

### Problem: "Redirect URI mismatch"
**Lösung:**
- Überprüfe, dass `https://www.jnxlabs.ai/api/shopify/callback` in Shopify Partner Dashboard unter **Allowed redirection URL(s)** eingetragen ist

### Problem: "Configuration Error" im Dashboard
**Lösung:**
- Überprüfe Supabase Variables in Vercel (sollten bereits gesetzt sein):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Problem: "Invalid API credentials"
**Lösung:**
- Überprüfe, dass `SHOPIFY_API_KEY` und `SHOPIFY_API_SECRET` korrekt in Vercel gesetzt sind
- Überprüfe, dass sie mit den Werten im Shopify Partner Dashboard übereinstimmen

---

## ✅ Success Criteria

- ✅ Lokale `.env` aktualisiert mit `SHOPIFY_APP_URL=https://www.jnxlabs.ai`
- ⏳ Vercel Environment Variables gesetzt (alle 4 Shopify-Variablen)
- ⏳ Shopify Redirect URI hinzugefügt (`https://www.jnxlabs.ai/api/shopify/callback`)
- ⏳ Vercel Redeploy abgeschlossen (ohne Build Cache)
- ⏳ Qryx Dashboard zeigt "Not Installed" (nicht "Configuration Error")
- ⏳ Installation Flow funktioniert (Redirect zu Shopify OAuth)

---

## 📝 Notizen

- **Production URL:** `https://www.jnxlabs.ai` (Custom Domain via Vercel)
- **Vercel Deployment URLs:**
  - `jnx-os-git-main-shop-bot.vercel.app`
  - `jnx-n3pe8w0c8-shop-bot.vercel.app`
- **Shopify Partner Dashboard:** https://partners.shopify.com
- **Qryx App Name:** QRYX
- **API Version:** 2025-10

---

**Next Steps:**
1. Setze Vercel Environment Variables (siehe oben)
2. Füge Redirect URI in Shopify hinzu (siehe Checklist)
3. Redeploy Vercel (ohne Cache)
4. Teste Installation Flow

**Support:** Bei Problemen die Build Logs in Vercel überprüfen
