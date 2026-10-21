# Today & Upcoming reminders — v21

Apply after v20. Deploy frontend and backend. No npm dependencies or manual data migration are required. Mongoose initializes the ReminderPreference collection and its unique academy/user index before preference writes.

The global dashboard bell opens Today / Upcoming / Earlier / Settings. Existing communication notifications remain available through Other notifications. Existing guardian fee/attendance reminder APIs remain intact.

Daily flashes: birthday first, fee due next; each card remains 8 seconds, pauses on hover/focus and is closable. Each kind is claimed atomically once per academy/user/day, across tabs/devices. Page changes and reloads do not repeat a claimed flash. A failed claim can retry on a later refresh. Claims acknowledged immediately before a browser closes may be considered shown; a flash is a best-effort UI delivery, not a guaranteed-message receipt.

Settings are per account, per academy: birthdays/dues/flash on/off, 7/15/30-day upcoming range, inactive birthday/fee options and editable WhatsApp templates using {name}/{date}. Default: 7 days, 30-day birthday history, inactive birthdays included and inactive fee dues excluded. February 29 birthdays are observed February 28 in non-leap years. Students without a valid DOB do not produce birthday events.

Due reminders use configured membership effective/next due dates and unpaid balances. Missing membership dates do not invent a due date. Paused, waived, complimentary, fee-exempt, manual-paid overrides and remaining paid time suppress inappropriate due alerts. Clear fee-label alone does not erase a real balance. No monetary amount is invented for reminders. Paid membership changes remove or move the due event on the next refresh.

The center refreshes on first load, fee-change signals, academy changes, midnight checks and periodically while visible (5 minutes). Focus refreshes are throttled. It does not dispatch attendance reload events. Read state is separate from paid state. Opening WhatsApp only opens a draft; no automatic messages are sent.

Academy owner/super-admin reminders are academy-scoped. Assistant coaches are limited to assigned active branches by the existing backend access resolver. Parent/student roles cannot use these management endpoints. Other product notifications remain separate.

Verification: reminder date/range/leap-year/business-state tests; atomic-claim controller test with a deterministic database stub; role/branch checks; full backend/frontend test suites; backend app import and production build. Production MongoDB concurrency and live browser rendering have not been verified in this workspace.
