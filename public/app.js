const form = document.getElementById('form');
const repoUrlInput = document.getElementById('repoUrl');
const output = document.getElementById('output');
const statusEl = document.getElementById('status');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

function setStatus(msg) { statusEl.textContent = msg || ''; }
function enableActions(enabled) { copyBtn.disabled = downloadBtn.disabled = !enabled; }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  enableActions(false);
  output.value = '';
  setStatus('Generating README… this usually takes a few seconds.');

  try {
    const repoUrl = repoUrlInput.value.trim();
    const res = await fetch('/api/generate-readme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repoUrl })
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Request failed');

    output.value = data.markdown;
    enableActions(true);
    setStatus('Done! You can copy or download the README.');
  } catch (err) {
    console.error(err);
    setStatus('Error: ' + err.message);
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    setStatus('Copied to clipboard ✔');
  } catch { setStatus('Copy failed'); }
});

downloadBtn.addEventListener('click', () => {
  const blob = new Blob([output.value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'README.md';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});