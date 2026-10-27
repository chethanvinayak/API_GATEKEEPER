# Security Specification & Threat Model

## 1. Data Invariants

1. **Security Incidents (`/incidents/{incidentId}`)**:
   - Every incident document must possess a valid string `id`, `ip`, `action`, and numeric `score`.
   - Incident records cannot be modified or forged by unauthenticated users.

2. **Banned IP Records (`/banned_ips/{ipId}`)**:
   - An IP ban record must contain an `ip` and `strikes` count.
   - Banned IP entries require authenticated SecOps clearance to mutate or unban.

3. **User Profiles (`/users/{userId}`)**:
   - `userId` path parameter must match the authenticated `request.auth.uid`.
   - Users cannot escalate their own `role` or `clearance` attributes.

## 2. Dirty Dozen Threat Payloads

1. Unauthenticated write to `/incidents/{id}` -> REJECTED
2. Incident payload with score > 1000 or malicious string injection -> REJECTED
3. Path parameter ID spoofing with invalid characters -> REJECTED
4. User modifying someone else's `/users/{userId}` profile -> REJECTED
5. User elevating role to `super_admin` in profile update -> REJECTED
6. Banned IP write with negative strikes value -> REJECTED
7. Unauthenticated read of user profiles -> REJECTED
8. Payload exceeding max string boundaries (> 4096 chars) -> REJECTED
9. Spoofed user email without verification -> REJECTED
10. Attempt to delete incident audit log -> REJECTED
11. Bypassing schema validation with shadow keys -> REJECTED
12. Attempting orphan write to invalid path -> REJECTED
