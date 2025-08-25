import { contextBridge, ipcRenderer } from 'electron';
import type { Config } from './main';

export interface IElectronAPI {
    getConfig: () => Promise<Config>;
}

const api: IElectronAPI = {
    getConfig: () => ipcRenderer.invoke('get-config'),
};

contextBridge.exposeInMainWorld('api', api);