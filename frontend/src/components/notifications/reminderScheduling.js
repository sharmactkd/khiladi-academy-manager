// On a direct attendance visit, let the main register request finish before
// starting optional reminders. The timeout also covers navigation/cancel/error.
export function scheduleInitialReminderRefresh(refresh, target = window) {
  let finished = false;
  let timer;
  const cancel = () => {
    finished = true;
    target.clearTimeout(timer);
    target.removeEventListener("khiladi:attendance-ready", ready);
  };
  const ready = () => {
    if (finished) return;
    cancel();
    refresh();
  };
  if (target.location.pathname.replace(/\/$/, "") === "/attendance") {
    target.addEventListener("khiladi:attendance-ready", ready);
    timer = target.setTimeout(ready, 10000);
  } else {
    timer = target.setTimeout(ready, 0);
  }
  return cancel;
}
