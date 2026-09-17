# Encryption Key Rotation

Ciphertext now carries a key ID. Old `v1` ciphertext remains readable while the corresponding old key is configured.

1. Take and verify a restorable database backup.
2. Before the first rotation, set `DATA_HASH_KEY` equal to the current `DATA_ENCRYPTION_KEY` so existing blind indexes remain valid; keep it stable afterward. Never rotate this key together with ciphertext keys. Keep the current encryption key in `DATA_ENCRYPTION_PREVIOUS_KEYS` and `INTEGRATION_ENCRYPTION_PREVIOUS_KEYS` under its old ID.
3. Set new random primary keys and new IDs. Never reuse JWT, audit or media signing secrets.
4. Deploy with both old and new keys, then run `npm run security:rotate-keys` (dry-run).
5. Review counts and errors. In a maintenance window run `npm run security:rotate-keys -- --apply`.
6. Rerun dry-run; expected rotation counts are zero. Exercise MFA and tournament integration in a test account.
7. Retain old keys in the secret manager until backup-retention and rollback windows expire, then remove them.

If decryption fails, stop immediately. Do not remove an old key or rerun writes until the backup and key mapping are confirmed.
