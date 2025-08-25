"use strict";
(() => {
  // src/renderer.ts
  async function renderUI(container) {
    try {
      const config = await window.api.getConfig();
      const groups = config.processingSteps.reduce(
        (acc, step) => {
          const groupName = step.targetFile || "general";
          if (!acc[groupName]) acc[groupName] = [];
          acc[groupName].push(step);
          return acc;
        },
        {}
      );
      container.innerHTML = "";
      for (const groupName in groups) {
        const groupDiv = document.createElement("div");
        groupDiv.className = "step-group";
        groupDiv.innerHTML = `<h2>${groupName}</h2>`;
        groups[groupName].forEach((step) => {
          const label = document.createElement("label");
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = step.id;
          checkbox.checked = step.enabled;
          label.appendChild(checkbox);
          label.append(` ${step.name}`);
          groupDiv.appendChild(label);
        });
        container.appendChild(groupDiv);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      container.innerHTML = `<p style="color: red;">\u041E\u0448\u0438\u0431\u043A\u0430: ${message}</p>`;
    }
  }
  function main() {
    const stepsContainer = document.getElementById("processing-steps");
    if (!stepsContainer) {
      console.error("\u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430: \u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440 #processing-steps \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D.");
      return;
    }
    renderUI(stepsContainer);
  }
  window.addEventListener("DOMContentLoaded", main);
})();
