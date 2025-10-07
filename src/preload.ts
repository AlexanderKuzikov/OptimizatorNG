import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { Config } from './main';

// Интерфейс API, который мы предоставляем
export interface IElectronAPI {
    getConfig: () => Promise<Config>;
    selectFiles: () => Promise<void>;
    startProcessing: (enabledSteps: string[]) => Promise<void>;
    onUpdateStatus: (callback: (event: IpcRendererEvent, message: string) => void) => void;
}

const api: IElectronAPI = {
    getConfig: () => ipcRenderer.invoke('get-config'),
    selectFiles: () => ipcRenderer.invoke('select-files'),
    startProcessing: (enabledSteps: string[]) => ipcRenderer.invoke('start-processing', enabledSteps),
    onUpdateStatus: (callback: (event: IpcRendererEvent, message: string) => void) => 
        ipcRenderer.on('update-status', callback)
};

contextBridge.exposeInMainWorld('api', api);