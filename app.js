const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const keys = ["secret", "key"];

const controlLicense = (key) => {
    if (keys.includes(key)) {
        return true;
    }
    return false;
}

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });

    win.setMenuBarVisibility(false);
    win.loadFile('./pages/keyLogin.html');

    ipcMain.on('keyLogin', (event, key) => {
        if (!controlLicense(key)) {
            win.loadFile('./pages/license.html');
            
            ipcMain.on('buy', (event) => {
                console.log('buy');
            });
    
            return;
        } else {
            win.loadFile('./pages/index.html');
        }
    });
    


    let bot; 

    ipcMain.on('start', (event) => {
        console.log('start');

        bot = spawn('node', ['bot.js']);

        bot.stdout.on('data', (data) => {
            event.sender.send('log', data.toString());
        });

        bot.stderr.on('data', (data) => {
            event.sender.send('log', data.toString());
        });

        bot.on('close', (code) => {
            event.sender.send('log', `child process exited with code ${code}`);
            event.sender.send('stopped', 'stopped');
        });

        event.sender.send('started', 'started');
    });

    ipcMain.on('stop', (event) => {
        event.sender.send('log', 'stopping...');
        bot.kill();
        event.sender.send('log', 'stopped');
        event.sender.send('stopped', 'stopped');
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
