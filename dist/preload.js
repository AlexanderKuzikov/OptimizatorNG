"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    getConfig: () => electron_1.ipcRenderer.invoke('get-config'),
    selectFiles: () => electron_1.ipcRenderer.invoke('select-files'),
    startProcessing: (enabledSteps) => electron_1.ipcRenderer.invoke('start-processing', enabledSteps),
    onUpdateStatus: (callback) => electron_1.ipcRenderer.on('update-status', callback)
};
electron_1.contextBridge.exposeInMainWorld('api', api);
