# 🛡️ JNX-OS Conversation Starter - Heiliger Code

**CRITICAL: Lies dies ZUERST in jeder neuen Konversation!**

---

## 📌 Projekt-Kontext

**Projekt:** JNX-OS v2.0 - Enterprise SaaS Foundation  
**Status:** ✅ Production-Ready (Vercel Deployed)  
**Stack:** Next.js 14 + Clerk Auth + Supabase PostgreSQL + Tailwind CSS v3.3.3  
**Location:** `/home/ubuntu/jnx-os/nextjs_space/`

---

## 🚨 ABSOLUTE RULES (Non-Negotiable)

### 1. **PROTECTED FILES - NICHT ÄNDERN ohne expliziten Grund:**

```
Authentication (Clerk Integration):
  ✋ lib/auth/clerk-client.ts
  ✋ lib/auth/clerk-server.ts
  ✋ lib/auth/helpers.ts
  ✋ lib/auth/rbac.ts
  ✋ middleware.ts

Database (Idempotente Operationen):
  ✋ lib/db/helpers.ts           # UPSERT functions
  ✋ lib/db/schema-v2.sql        # Production schema
  ✋ MIGRATION_SIMPLE.sql        # GDPR migration

Security & GDPR:
  ✋ lib/security/rate-limit.ts
  ✋ lib/security/headers.ts
  ✋ lib/privacy/*               # redaction, export, deletion
  ✋ lib/observability/logger.ts

Webhook (Kritisch für Clerk→Supabase Sync):
  ✋ app/api/webhooks/clerk/route.ts
```

### 2. **FORBIDDEN ACTIONS (Wird Production kaputt machen):**

❌ **Database:**
  - Nie `INSERT` ohne UPSERT verwenden (Race Conditions!)
  - Nie `DELETE` direkt (nur soft-delete via `deleted_at`)
  - Nie `clerk_user_id` oder `clerk_org_id` Spalten entfernen
  - Nie Schema ändern ohne Migration-File

❌ **Authentication:**
  - Nie Webhook-Signature-Verification überspringen
  - Nie `requireAuth()` auf protected Routes weglassen
  - Nie Custom Session Management bauen

❌ **Security:**
  - Nie Rate Limiting deaktivieren
  - Nie PII ohne Redaction loggen
  - Nie Security Headers entfernen

❌ **Code Quality:**
  - Nie `any` Type verwenden (use proper types)
  - Nie `@ts-ignore` ohne Kommentar
  - Nie Error Handling entfernen

### 3. **MUST USE Patterns:**

✅ **Database Operations:**
```typescript
// IMMER diese Functions verwenden:
import { upsertUser, upsertOrg, createUserWithOrg } from '@/lib/db/helpers';

// NIE direktes INSERT:
await upsertUser({ clerkUserId, email, fullName }); // ✅ Gut
await supabase.from('users').insert({...}); // ❌ Schlecht (Race Condition)
```

✅ **Authentication (Server-Side):**
```typescript
import { requireAuth, requireAdmin } from '@/lib/auth/helpers';

const { user, jnxUser } = await requireAuth(); // ✅ Immer verwenden
```

✅ **Logging mit PII Redaction:**
```typescript
import { Logger } from '@/lib/observability/logger';

const logger = new Logger('api/your-route');
logger.info('User action', { userId }); // ✅ Auto-redacted
```

---

## 🎯 Kritische System-Architektur

### **Authentication Flow (Clerk → Supabase):**

```
1. User signs up via Clerk
   ↓
2. Clerk sends webhook → /api/webhooks/clerk
   ↓
3. Webhook handler uses createUserWithOrg() (transactional, idempotent)
   ↓
4. User synced to Supabase
   ↓
5. Dashboard loads with server-side fallback (syncUserFromClerk)
```

**Key Point:** Dashboard funktioniert AUCH wenn Webhook verzögert ist (server-side fallback in `app/app/page.tsx`).

### **Database Schema (Clerk-Aligned):**

```sql
-- Users (Multi-Tenant)
users (
  clerk_user_id TEXT UNIQUE NOT NULL,  -- Clerk sync key
  org_id UUID REFERENCES orgs(id),
  deleted_at TIMESTAMPTZ,              -- GDPR soft-delete
  ...
)

-- Organizations
orgs (
  clerk_org_id TEXT UNIQUE,
  ...
)
```

**Key Point:** `clerk_user_id` ist die Source of Truth für User-Sync. NIEMALS ändern/entfernen.

---

## 📚 Vollständige Dokumentation (Bei Unsicherheit lesen)

### **Vor Code-Änderungen:**
1. **BACKEND_PROTECTION_PROMPT.md** (900 Zeilen)
   - Pre-Development Checklist
   - 5 Sections (Auth, Database, Security, API, UI)
   - Forbidden Actions
   - Safe Patterns

2. **QUICK_REFERENCE.md** (300 Zeilen)
   - Code-Snippets (Copy-Paste ready)
   - Testing Commands
   - Troubleshooting
   - File Locations

### **Architektur & Setup:**
- `README.md` - Projekt-Übersicht
- `docs/ARCHITECTURE.md` - System Design
- `docs/BACKEND_CONTRACT.md` - Non-Negotiable Rules
- `docs/CLERK_SETUP.md` - Clerk Konfiguration
- `docs/GDPR_COMPLIANCE.md` - Privacy Features

---

## ⚡ Quick Commands (Häufig gebraucht)

```bash
# Build Check (MUSS vor Deployment erfolgen)
cd /home/ubuntu/jnx-os/nextjs_space && yarn build

# Type Check
yarn tsc --noEmit

# Dev Server
yarn dev

# Prisma Client regenerieren
yarn prisma generate

# Database Browser
yarn prisma studio
```

---

## 🔧 Häufige Probleme (Quick Fix)

### Problem: "Column does not exist" Error
**Lösung:** Run `MIGRATION_SIMPLE.sql` in Supabase SQL Editor

### Problem: Webhook Failed in Clerk Logs
**Lösung:** Check `CLERK_WEBHOOK_SECRET` in `.env`, verify Supabase connection

### Problem: Dashboard stuck on setup screen
**Lösung:** 
1. Check Supabase connection
2. Verify user exists: `SELECT * FROM users WHERE clerk_user_id = 'user_xxx'`
3. Check webhook logs in Clerk Dashboard

### Problem: Admin Panel shows "Unauthorized"
**Lösung:** Set user role in Clerk Dashboard → User → Public Metadata:
```json
{ "role": "admin" }
```

### Problem: Build fails with "Module not found"
**Lösung:** `cd nextjs_space && yarn install && yarn prisma generate`

---

## 🚀 Deployment Status

**Current Deployment:**
- ✅ GitHub: `JNXLabs/jnx-os` (main branch)
- ✅ Vercel: Auto-Deploy aktiv
- ✅ Database: Supabase PostgreSQL (Schema v2)
- ✅ Build: Passing (Tailwind CSS v3.3.3)

**Environment Variables (Required):**
```bash
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

---

## 💎 Production Quality Metrics (Erreicht)

| Metrik | Before | After |
|--------|--------|-------|
| Webhook Success Rate | ~70% | 100% |
| Dashboard Load Time | 8-15s | <3s |
| 500 Errors | Häufig | 0 |
| Race Conditions | Ja | Nein |
| Infinite Loops | Ja | Nein |

---

## 🎯 Workflow für neue Features

### **1. Planung (5-10 min):**
```
1. Lies BACKEND_PROTECTION_PROMPT.md
2. Beantworte Pre-Development Checklist:
   - Auth betreffend?
   - Database betreffend?
   - Security betreffend?
   - API betreffend?
   - UI betreffend?
3. Lies relevante Sections
```

### **2. Entwicklung (30-60 min):**
```
1. Öffne QUICK_REFERENCE.md
2. Kopiere relevante Code-Templates
3. Entwickle Feature
4. Teste lokal (yarn build)
```

### **3. Testing (10-15 min):**
```
1. yarn build (MUSS erfolgen)
2. yarn tsc --noEmit (keine Errors)
3. Test Auth-Flow (Login/Signup)
4. Test Feature funktioniert
5. Check Console (keine Errors)
```

### **4. Deployment:**
```
1. Git commit + push
2. Vercel auto-deploy
3. Monitor deployment logs
4. Verify production works
```

---

## 🎊 Was du JETZT machen kannst

**Stabile Features (Touch nichts an):**
- ✅ Clerk Authentication + Google SSO
- ✅ Role-Based Access Control (Admin/Member)
- ✅ Multi-Tenant Database (Orgs + Users)
- ✅ GDPR Compliance (Soft-Delete, Export, Deletion)
- ✅ Security (Rate Limiting, Headers, PII Redaction)
- ✅ Webhook Sync (100% idempotent)
- ✅ Dashboard mit Server-Side Fallback

**Neue Features hinzufügen (Safe):**
- ✅ Neue UI Pages (verwende JNX Dark components)
- ✅ Neue API Routes (verwende Template aus Quick Reference)
- ✅ Neue Database Tables (mit Migration-File)
- ✅ Business Logic (erweitere, modifiziere nicht Core)

---

## 📋 Checklist: Vor JEDER Code-Änderung

```
[ ] Habe ich BACKEND_PROTECTION_PROMPT.md gelesen?
[ ] Betrifft meine Änderung Protected Files?
[ ] Verwende ich die richtigen Patterns (UPSERT, requireAuth)?
[ ] Habe ich Migration-File erstellt (wenn Schema-Änderung)?
[ ] Habe ich lokal getestet (yarn build)?
[ ] Keine TypeScript Errors?
[ ] Keine Console Errors im Browser?
[ ] Auth-Flow funktioniert noch?
```

**Wenn alle ✅ → Deploy safe!**

---

## 🔥 Emergency Contacts

**Bei kritischen Problemen:**
1. Check `BACKEND_PROTECTION_PROMPT.md` Section für dein Problem
2. Check `QUICK_REFERENCE.md` "Common Issues"
3. Check Vercel Deployment Logs
4. Check Clerk Webhook Logs
5. Check Supabase Logs

**Letzte Resort:** Restore zu letztem Checkpoint via Abacus AI

---

## 🎯 TL;DR (Zu Lang; Nicht Gelesen)

**3 Goldene Regeln:**

1. **🛡️ Schütze was funktioniert**
   - Keine Protected Files ändern
   - Immer idempotente Operationen (UPSERT)
   - Nie Security Features deaktivieren

2. **📖 Folge den Patterns**
   - Verwende Templates aus Quick Reference
   - Kopiere bewährte Code-Strukturen
   - Erweitere, modifiziere nicht Core

3. **🧪 Teste vor Deployment**
   - Lokaler Build muss erfolgen
   - Auth-Flows testen
   - Keine TypeScript-Fehler

**Bei Unsicherheit:** Lies vollständige Doku in `BACKEND_PROTECTION_PROMPT.md`

---

**Version:** 2.0  
**Last Updated:** 2024-12-27  
**Status:** ✅ Production Ready  
**Deployment:** Vercel (Auto-Deploy from GitHub)  

---

**🚀 Du bist jetzt geschützt! Viel Erfolg beim Entwickeln!**
