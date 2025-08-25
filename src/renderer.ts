import type { IElectronAPI } from './preload';

declare global {
    interface Window {
        api: IElectronAPI;
    }
}

interface ProcessingStep {
    id: string;
    name: string;
    targetFile: string;
    enabled: boolean;
}
interface Config {
    processingSteps: ProcessingStep[];
}

async function renderUI(container: HTMLElement) {
    try {
        const config: Config = await window.api.getConfig();
        const groups: { [key: string]: ProcessingStep[] } = config.processingSteps.reduce(
            (acc: { [key:string]: ProcessingStep[] }, step: ProcessingStep) => {
                const groupName = step.targetFile || 'general';
                if (!acc[groupName]) acc[groupName] = [];
                acc[groupName].push(step);
                return acc;
            }, {});
        container.innerHTML = '';
        for (const groupName in groups) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'step-group';
            groupDiv.innerHTML = `<h2>${groupName}</h2>`;
            groups[groupName].forEach((step: ProcessingStep) => {
                const label = document.createElement('label');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = step.id;
                checkbox.checked = step.enabled;
                label.appendChild(checkbox);
                label.append(` ${step.name}`);
                groupDiv.appendChild(label);
            });
            container.appendChild(groupDiv);
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        container.innerHTML = `<p style="color: red;">Ошибка: ${message}</p>`;
    }
}

function main() {
    const stepsContainer = document.getElementById('processing-steps');
    if (!stepsContainer) {
        console.error("Критическая ошибка: контейнер #processing-steps не найден.");
        return;
    }
    renderUI(stepsContainer);
}

window.addEventListener('DOMContentLoaded', main);