# GDPR Compliance Guide

## Overview

JNX-OS implements **Privacy by Design** and includes features to help you comply with GDPR (General Data Protection Regulation).

⚠️ **Disclaimer**: This guide provides technical implementation details. Consult legal counsel to ensure full GDPR compliance for your specific use case.

---

## GDPR Principles Implemented

### 1. **Data Minimization** ✅

**Principle**: Only collect data that's necessary.

**Implementation**:
- User table stores only: email, name, role, org_id
- No unnecessary personal data collected
- Optional fields marked as nullable

**What YOU must do**:
- Don't add unnecessary fields to database
- Justify each data point collected
- Document purpose of data collection

---

### 2. **Right to Access (Data Portability)** ✅

**Principle**: Users can request their data.

**Implementation**:
- Data export service: `lib/privacy/export.ts`
- Exports: user profile, audit logs, billing data, entitlements
- Returns JSON format

**Usage**:
```typescript
import { exportUserData } from '@/lib/privacy/export';

const data = await exportUserData(userId);
// Returns complete user data in JSON
```

**API Endpoint** (Future):
```typescript
// POST /api/privacy/export
// Returns download link to user data
```

---

### 3. **Right to Erasure (Right to be Forgotten)** ✅

**Principle**: Users can request deletion of their data.

**Implementation**:
- Soft delete: `deleteUser(userId, true)`
- Hard delete: `deleteUser(userId, false)`
- Anonymization: `anonymizeUser(userId)`

**Deletion Strategies**:

#### Soft Delete (Recommended)
```typescript
import { softDeleteUser } from '@/lib/privacy/deletion';

await softDeleteUser(userId);
// Marks user as deleted, keeps audit trail
```

#### Hard Delete (Irreversible)
```typescript
import { hardDeleteUser } from '@/lib/privacy/deletion';

await hardDeleteUser(userId);
// Permanently removes all user data
```

#### Anonymization
```typescript
import { anonymizeUser } from '@/lib/privacy/deletion';

await anonymizeUser(userId);
// Replaces PII with anonymized values
```

---

### 4. **Data Protection** ✅

**Principle**: Protect personal data from breaches.

**Implementation**:
- ✅ HTTPS only (enforced by Vercel)
- ✅ Database encryption at rest (Supabase)
- ✅ Encrypted connections (Supabase/Clerk)
- ✅ PII redaction in logs
- ✅ Secure session management (Clerk)

**PII Redaction**:
```typescript
import { redactAll } from '@/lib/privacy/redaction';

const safeMessage = redactAll(unsafeMessage);
// Redacts emails, phones, SSN, credit cards
```

---

### 5. **Consent & Transparency** ✅

**Implementation**:
- Privacy Policy page: `/privacy`
- Terms of Service page: `/terms`

**What YOU must do**:
- ✅ Update Privacy Policy with your company details
- ✅ Specify data retention periods
- ✅ List third-party processors (Clerk, Supabase)
- ✅ Provide contact info for data requests

---

### 6. **Audit Trail** ✅

**Principle**: Track all data processing activities.

**Implementation**:
- `audit_logs` table logs all significant actions
- Immutable log entries
- Includes: action, actor, target, timestamp

**Logged Events**:
- User signup/login/logout
- User created/updated/deleted
- Organization created/updated
- Admin actions
- Data export/deletion requests

---

## GDPR-Required Features Checklist

### Implemented ✅

- [x] Privacy Policy page
- [x] Terms of Service page
- [x] Data export functionality
- [x] Data deletion functionality
- [x] PII redaction in logs
- [x] Audit logging
- [x] Secure data storage
- [x] HTTPS enforcement
- [x] User authentication
- [x] Role-based access control

### To Customize 🔧

- [ ] Update Privacy Policy with your details
- [ ] Update Terms of Service with your details
- [ ] Add cookie consent banner (if using cookies beyond essential)
- [ ] Create data processing agreement (DPA) for customers
- [ ] Document data retention policies
- [ ] Set up data breach notification process

---

## Data Processing Records

### Data Categories

| Category | Purpose | Retention | Legal Basis |
|----------|---------|-----------|-------------|
| Account Data | User authentication | Until deletion | Contract |
| Email Address | Communication, login | Until deletion | Contract |
| Usage Logs | Security, debugging | 90 days | Legitimate Interest |
| Audit Logs | Compliance, security | 1 year | Legal Obligation |
| Billing Data | Payment processing | 7 years | Legal Obligation |

**Action Required**: Customize this table for your use case.

---

## Data Processors (Sub-processors)

### Third-Party Services

| Service | Purpose | Data Shared | Location | DPA Available |
|---------|---------|-------------|----------|---------------|
| Clerk | Authentication | Email, Name | USA (AWS) | Yes |
| Supabase | Database | All user data | Your choice | Yes |
| Vercel | Hosting | IP addresses | Global | Yes |

**Action Required**:
1. Sign DPAs with each processor
2. List in your Privacy Policy
3. Update if you add new services

---

## Data Subject Rights

### How to Handle Requests

#### 1. Right to Access
```typescript
// User requests their data
const data = await exportUserData(userId);
// Send JSON to user's email
```

#### 2. Right to Rectification
```typescript
// User requests data correction
await updateUser(userId, {
  email: newEmail,
  first_name: correctedName,
});
```

#### 3. Right to Erasure
```typescript
// User requests deletion
const safety = await checkDeletionSafety(userId);
if (safety.canDelete) {
  await softDeleteUser(userId);
}
```

#### 4. Right to Restrict Processing
```typescript
// Mark user as restricted
await updateUser(userId, {
  metadata: { processing_restricted: true },
});
```

#### 5. Right to Data Portability
```typescript
// Export in machine-readable format
const data = await exportUserData(userId);
const json = JSON.stringify(data, null, 2);
// Provide download link
```

---

## Data Retention Policy

### Recommended Retention Periods

| Data Type | Retention Period | Reason |
|-----------|------------------|--------|
| Active Users | Indefinite | Active account |
| Deleted Users | 30 days (soft delete) | Grace period for recovery |
| Audit Logs | 1 year | Compliance, security |
| System Logs | 90 days | Debugging, monitoring |
| Billing Records | 7 years | Legal requirement |

**Implementation**:
```typescript
// Run this as a cron job
async function cleanupOldRecords() {
  // Delete soft-deleted users after 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Hard delete users soft-deleted more than 30 days ago
  // (Implement based on your retention policy)
}
```

---

## Compliance Checklist

### Before Launch

- [ ] Privacy Policy published and accessible
- [ ] Terms of Service published and accessible
- [ ] Cookie consent implemented (if needed)
- [ ] Data protection measures documented
- [ ] Sub-processors listed in Privacy Policy
- [ ] DPAs signed with all processors
- [ ] Data retention policy defined and implemented
- [ ] Data breach notification process established
- [ ] Employee training on GDPR completed

### Ongoing Compliance

- [ ] Monitor data breach attempts
- [ ] Review audit logs regularly
- [ ] Update Privacy Policy when adding features
- [ ] Respond to data requests within 30 days
- [ ] Annual GDPR compliance review
- [ ] Keep records of processing activities

---

## Reporting Data Breaches

**Requirement**: Report breaches within 72 hours.

**Process**:
1. Detect breach via monitoring/logs
2. Assess scope and impact
3. Notify supervisory authority (if high risk)
4. Notify affected users
5. Document the breach

**Implementation** (Future):
```typescript
// lib/compliance/breach-notification.ts
export async function reportDataBreach(details: BreachDetails) {
  // Log the breach
  await logSystemEvent('data_breach', 'critical', 'Data breach detected', details);

  // Notify admin
  // Send email to DPO
  // Create incident report
}
```

---

## Resources

- [GDPR Official Text](https://gdpr-info.eu/)
- [Clerk GDPR Compliance](https://clerk.com/docs/security/gdpr)
- [Supabase Security](https://supabase.com/security)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/authentication)

---

## Contact for Data Requests

**Update with your information**:

- Email: privacy@yourcompany.com
- Address: Your company address
- DPO: Data Protection Officer name

---

## Summary

✅ **What's Implemented**:
- Data export
- Data deletion
- PII redaction
- Audit logging
- Security measures

🔧 **What YOU Need to Do**:
- Customize Privacy Policy
- Sign DPAs with processors
- Set up data breach process
- Train team on GDPR
- Monitor compliance

**Remember**: GDPR compliance is ongoing, not one-time!
