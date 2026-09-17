# Data Retention and Deletion Policy

Default operational periods:

| Data | Default | Action |
| --- | ---: | --- |
| Completed/failed import sessions and chunks | 30 days | Delete |
| Closed admission enquiries | 730 days | Delete |
| Security audit logs | 365 days | MongoDB TTL |
| Student, attendance, fee and payment records | No automatic deletion | Owner/legal review and controlled export/deletion |

Run `npm run security:retention` for a dry-run. After legal/contract review and a verified backup, use `npm run security:retention -- --apply`.

Deletion requests must verify the requester, academy ownership, applicable legal hold and accounting obligations. Export required records first. Use a two-person review for academy-wide deletion. Preserve only the minimum immutable audit evidence permitted by law, remove files from storage/CDN, revoke sessions and integrations, and record completion without retaining deleted personal content.

This file is an operational baseline, not legal advice. Configure periods for the academy's jurisdiction and contracts.
