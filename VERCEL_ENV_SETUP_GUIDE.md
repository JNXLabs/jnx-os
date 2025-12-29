# Vercel Environment Variables - Setup Guide

**Status:** Ready to Execute  
**Last Updated:** 2024-12-29 12:05 UTC  
**Production URL:** https://www.jnxlabs.ai

---

## 🎯 Schritt-für-Schritt Anleitung

### **1. Vercel Dashboard öffnen**

```
https://vercel.com/dashboard
```

### **2. Projekt auswählen**

- Klicke auf dein Projekt (z.B. **jnx-os** oder der Name deines Deployments)
- Du siehst die Deployment-Übersicht

### **3. Settings öffnen**

- Klicke im oberen Menü auf **"Settings"**
- Im linken Sidebar klicke auf **"Environment Variables"**

---

## 📝 Die 4 Variablen zum Hinzufügen

### **Variable 1: SHOPIFY_API_KEY**

```
Name: SHOPIFY_API_KEY
Value: 6e62aef5f8013048ca5b446fa86c6fae
```

**Environments auswählen:**
- ✅ Production
- ✅ Preview
- ✅ Development

**Klicke:** "Add" oder "Save"

---

### **Variable 2: SHOPIFY_API_SECRET**

```
Name: SHOPIFY_API_SECRET
Value: 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
```

**Environments auswählen:**
- ✅ Production
- ✅ Preview
- ✅ Development

**WICHTIG:** ⚠️ Setze den Haken bei **"Sensitive"** oder markiere als **"Secret"**  
(Dadurch wird der Wert in Logs nicht angezeigt)

**Klicke:** "Add" oder "Save"

---

### **Variable 3: SHOPIFY_APP_URL**

```
Name: SHOPIFY_APP_URL
Value: https://www.jnxlabs.ai
```

**Environments auswählen:**
- ✅ Production
- ✅ Preview
- ✅ Development

**KRITISCH:** ⚠️ Diese URL MUSS EXAKT mit der Shopify App URL übereinstimmen!

**Klicke:** "Add" oder "Save"

---

### **Variable 4: SHOPIFY_SCOPES**

```
Name: SHOPIFY_SCOPES
Value: read_products,read_product_listings,read_customers,read_orders
```

**Environments auswählen:**
- ✅ Production
- ✅ Preview
- ✅ Development

**WICHTIG:** ⚠️ Kommas **OHNE Leerzeichen**! Genau so kopieren wie oben.

**Klicke:** "Add" oder "Save"

---

## ✅ Verification

### **Nach dem Hinzufügen solltest du sehen:**

```
Environment Variables (4 Shopify-related)

✅ SHOPIFY_API_KEY           Production, Preview, Development
✅ SHOPIFY_API_SECRET         Production, Preview, Development (Sensitive)
✅ SHOPIFY_APP_URL            Production, Preview, Development
✅ SHOPIFY_SCOPES             Production, Preview, Development
```

---

## 🔍 Troubleshooting

### **Problem: "Variable already exists"**

**Lösung:**
1. Finde die existierende Variable in der Liste
2. Klicke auf **"..."** (drei Punkte) rechts neben der Variable
3. Wähle **"Edit"**
4. Update den Wert
5. Stelle sicher, dass alle 3 Environments ausgewählt sind
6. Speichern

### **Problem: "Value too long" oder "Invalid format"**

**Lösung:**
- Kopiere den Wert nochmal direkt aus diesem Dokument
- Achte darauf, dass KEINE Leerzeichen am Anfang oder Ende sind
- Bei `SHOPIFY_SCOPES`: Keine Leerzeichen nach Kommas!

### **Problem: "Cannot find Settings tab"**

**Lösung:**
1. Stelle sicher, dass du im richtigen Projekt bist
2. Du musst Owner oder Admin des Vercel-Projekts sein
3. Versuche: Dashboard → Projekt auswählen → Settings (oben)

---

## 🚀 Nächster Schritt: Vercel Redeploy

**WICHTIG:** Nach dem Setzen aller 4 Variablen MUSST du ein Redeploy durchführen, damit die neuen Environment Variables aktiv werden!

### **Redeploy Anleitung:**

1. **Gehe zu:** Vercel Dashboard → dein Projekt → **"Deployments"** Tab

2. **Finde das neueste Deployment** (ganz oben in der Liste)

3. **Klicke auf die drei Punkte "..."** rechts neben dem Deployment

4. **Wähle "Redeploy"**

5. **IM POP-UP:**
   - ⚠️ **DEAKTIVIERE** den Haken bei **"Use existing Build Cache"**
   - Das ist KRITISCH! Ohne frischen Build werden die neuen Env Vars nicht geladen

6. **Bestätige mit "Redeploy"**

7. **Warte 2-3 Minuten** bis das Deployment abgeschlossen ist
   - Status: Building → Deploying → Ready
   - Du siehst eine grüne Markierung wenn fertig

8. **Öffne die deployed URL:** https://www.jnxlabs.ai

---

## 🧪 Test nach Deployment

### **Test 1: Qryx Dashboard laden**

```
https://www.jnxlabs.ai/app/qryx
```

**Erwartung:**
- ✅ Dashboard lädt ohne Fehler
- ✅ Zeigt "Qryx Not Installed" (NICHT "Configuration Error")
- ✅ Button "Install Qryx on Shopify" ist sichtbar

### **Test 2: Installation Flow starten**

1. Klicke auf **"Install Qryx on Shopify"** Button
2. Gib deine Shopify Store URL ein (z.B. `your-store.myshopify.com`)
3. Klicke "Install"

**Erwartung:**
- ✅ Redirect zu Shopify OAuth
- ✅ URL Format:
  ```
  https://YOUR-STORE.myshopify.com/admin/oauth/authorize?
  client_id=6e62aef5f8013048ca5b446fa86c6fae&
  scope=read_products,read_product_listings,read_customers,read_orders&
  redirect_uri=https://www.jnxlabs.ai/api/shopify/callback&
  state=...
  ```

**Falls Fehler:**
- Check Vercel Function Logs (Deployments → Functions → Logs)
- Check Browser Console (F12 → Console Tab)
- Screenshot machen und mir schicken

---

## 📊 Status Checklist

- ✅ Shopify App URL: `https://www.jnxlabs.ai`
- ✅ Shopify Redirect URI: `https://www.jnxlabs.ai/api/shopify/callback`
- ⏳ Vercel Env Vars: **Jetzt setzen**
  - [ ] SHOPIFY_API_KEY
  - [ ] SHOPIFY_API_SECRET
  - [ ] SHOPIFY_APP_URL
  - [ ] SHOPIFY_SCOPES
- ⏳ Vercel Redeploy: **Nach Env Vars**
- ⏳ Installation Flow Test: **Nach Redeploy**

---

## 📞 Support

Wenn du Probleme hast:
1. Mache einen Screenshot von der Fehlermeldung
2. Schicke mir den Screenshot
3. Ich helfe dir weiter!

---

**Viel Erfolg! 🚀**

Du bist fast am Ziel! Nach dem Redeploy können wir die erste Qryx-Installation testen.
