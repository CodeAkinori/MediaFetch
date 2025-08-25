const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { execFile } = require('child_process');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 920,
    icon: path.join(__dirname, 'assets', 'logo.png'), 
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

const ytDlpPath = path.join(__dirname, 'bin', 'yt-dlp.exe');
const ffmpegPath = path.join(__dirname, 'bin', 'ffmpeg.exe');

// Listener para baixar vídeo
ipcMain.handle('baixar-video', async (event, { url, formato }) => {
  // Obter título do vídeo com yt-dlp
  const getTitle = () => {
    return new Promise((resolve, reject) => {
      execFile(ytDlpPath, ['--get-title', url], (err, stdout, stderr) => {
        if (err) {
          console.error(stderr.toString());
          return reject('Não foi possível obter o título do vídeo.');
        }
        resolve(stdout.toString().trim());
      });
    });
  };

  let titulo;
  try {
    titulo = await getTitle();
  } catch (e) {
    titulo = 'video';
  }

  // Abrir janela para escolher onde salvar
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Salvar vídeo como...',
    defaultPath: titulo,
    filters: [
      { name: 'Vídeo', extensions: formato === 'mp3' ? ['mp3'] : [formato] },
      { name: 'Todos os Arquivos', extensions: ['*'] }
    ]
  });

  if (canceled || !filePath) {
    return 'Download cancelado pelo usuário.';
  }

  return new Promise((resolve, reject) => {
    let args;

    if (formato === 'mp3') {
      args = [
        '-x',
        '--audio-format', 'mp3',
        '--ffmpeg-location', ffmpegPath,
        '-o', filePath,
        url
      ];
    } else if (formato === 'webm') {
      args = [
        '-f', 'bestvideo[ext=webm]+bestaudio[ext=webm]/webm',
        '--merge-output-format', 'webm',
        '--ffmpeg-location', ffmpegPath,
        '-o', filePath,
        url
      ];
    } else {
      args = [
        '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4',
        '--merge-output-format', 'mp4',
        '--ffmpeg-location', ffmpegPath,
        '-o', filePath,
        url
      ];
    }

    const processo = execFile(ytDlpPath, args);

    processo.stdout.on('data', (data) => console.log(data.toString()));
    processo.stderr.on('data', (data) => console.error(data.toString()));

    processo.on('close', (code) => {
      if (code === 0) {
        resolve(`Download concluído e salvo em:\n${filePath}`);
      } else {
        reject(`Erro no download, código ${code}`);
      }
    });
  });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
