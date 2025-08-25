"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    getConfig: () => electron_1.ipcRenderer.invoke('get-config'),
};
electron_1.contextBridge.exposeInMainWorld('api', api);
