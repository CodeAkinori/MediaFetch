const { ipcRenderer } = require('electron');

window.onload = () => {
  const urlInput = document.getElementById('urlInput');
  const formatSelect = document.getElementById('formatSelect');
  const btn = document.getElementById('downloadBtn');
  const log = document.getElementById('log');

  btn.onclick = async () => {
    const url = urlInput.value.trim();
    const formato = formatSelect.value;

    if (!url) {
      log.textContent = 'Cole uma URL válida!';
      return;
    }

    log.textContent = `Iniciando download em ${formato.toUpperCase()}...`;

    try {
      const result = await ipcRenderer.invoke('baixar-video', { url, formato });
      log.textContent = result;
    } catch (err) {
      log.textContent = 'Erro: ' + err;
    }
  };
};
