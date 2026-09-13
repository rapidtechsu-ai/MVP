# Pending Decisions & Confirmations Checklist

Work through this with your team. Each item notes who needs to decide
and what happens if it's left unresolved. Check items off as they're
settled — nothing here blocks continued testing, but everything under
**Sections A–C** should be resolved before real customers or real money
touch the system.

---

## A. Business decisions (you / management decide — not code)

- [x] **Rounding rule** — Confirmed: no rounding, exact calculated value shown.
- [ ] **Price-lock moment** — Currently: locks after OTP + availability confirmed. Confirm or change.
- [ ] **Supplier settlement trigger** — Currently: payable created at cash collection. Alternatives: at reservation, or at delivery.
- [ ] **Partial fulfillment policy** — Not addressed. What happens if only some items in an order are available?
- [ ] **Returns/refunds policy** — Not built. Customer Policies page currently says "pending."
- [ ] **Warranty responsibility** — Store vs. supplier. Not decided.
- [ ] **Real OTP provider selection** — WhatsApp BSP + email provider. System supports any provider, but none is actually signed up/connected yet. Codes currently just log to the server console.
- [ ] **Supplier payable currency** — Currently stored in SDG; suppliers are quoted in AED. Confirm which currency you actually settle with suppliers.
- [ ] **Delivery zone list, fees, SLA** — Currently 3 placeholder zones (الخرطوم 2,500 / بحري 3,000 / أم درمان 4,000 SDG, 24h SLA). Need real numbers.
- [ ] **Arabic digit style** — Currently using Western digits (0123) throughout. Confirm vs. Arabic-Indic (٠١٢٣).
- [ ] **Brand name, logo, color palette** — Not addressed. Build currently uses placeholder purple/teal tokens.
- [ ] **English language support timeline** — Currently "coming soon" with no real plan.

---

## B. Technical defaults set without explicit confirmation

- [ ] **OTP threshold** — 1,000,000 SDG (order value that triggers verification). Inherited from the original doc's example — confirm this is the real number.
- [ ] **RBAC role assignments** — Judgment calls on which role guards which action (e.g. delivery zones require OPERATIONS). Review once real staff/roles are assigned.
- [ ] **JWT session length** — Both staff and customer logins stay valid 7 days. Confirm this trade-off (security vs. convenience) is acceptable.
- [ ] **No OTP send rate-limiting** — Nothing currently stops repeated OTP requests to the same number. Should be fixed regardless of other decisions.
- [ ] **No maker-checker approval** — Section 9 of the original doc recommends dual-approval for large FX/markup changes. Currently single-approver only.

---

## C. Security — must happen before any real use

- [ ] **Change the seeded superuser password** (`ChangeMe123!`) — do this immediately after first login.
- [ ] **Replace the placeholder `JWT_SECRET`** with a real random value before any production-adjacent deployment.
- [ ] **Lock down CORS** to your actual frontend URL (currently open to any origin by default).
- [ ] **Review image storage credential handling** if you move S3 keys into dashboard config rather than env vars.

---

## D. Content that's entirely placeholder right now

- [ ] **Product catalog** — Seed data (Samsung/Xiaomi phones, made-up costs). Needs your real inventory.
- [ ] **Supplier info** — "مورد الخليج" is fictional. No real supplier contacts/terms exist yet.
- [ ] **Staff accounts** — Only the seeded superuser exists. Add your real team via Settings → Users & Roles.
- [ ] **Legal terms, privacy policy, consumer protection language** — Deliberately not written (not something to auto-generate) — needs actual legal review before public launch.

---

## E. Infrastructure / operations

- [ ] **Long-term deployment stack** — Free tier (Vercel + Render + Neon) set up for testing. Confirm if this is also the launch plan, or if you'll move to a paid tier without cold-starts.
- [ ] **Backup/restore schedule** — Not set up.
- [ ] **Domain name** — Not discussed. Currently using auto-generated subdomains.

---

## Notes / Owner assignments

Use this space to assign who's responsible for each open item and by when:

| Item | Owner | Target date | Status |
|---|---|---|---|
| | | | |
| | | | |
| | | | |
