import { fmtWhen } from './lib.js';

const ext = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);

async function show() {
  const { backup } = await ext.storage.local.get('backup');
  if (!backup) {
    $('meta').textContent = 'No backup yet. One is taken automatically right before the first save for each account.';
    $('json').textContent = '';
    $('download').disabled = true;
    $('delete').disabled = true;
    return;
  }
  const text = JSON.stringify(backup.json, null, 2);
  $('meta').textContent = `Your whole profile as Naukri returned it on ${fmtWhen(backup.t, 0)} IST, `
    + `taken right before the first automatic edit${backup.name ? ` (${backup.name})` : ''}. `
    + 'It is stored only in this browser. Use it to restore anything by hand if a save ever went wrong.';
  $('json').textContent = text;
  $('download').disabled = false;
  $('delete').disabled = false;
  $('download').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = `naukri-profile-backup-${new Date(backup.t).toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
  };
}

$('delete').addEventListener('click', async () => {
  if (!window.confirm('Delete the backup from this browser? A new one is taken before the next first save for an account.')) return;
  await ext.storage.local.remove(['backup', 'backupMeta']);
  show();
});

show();
