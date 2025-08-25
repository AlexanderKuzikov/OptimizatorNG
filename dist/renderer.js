"use strict";
(() => {
  // src/renderer.ts
  var stepsContainer;
  var statusLog;
  var selectFilesButton;
  var startProcessingButton;
  var logContent = "";
  function log(message) {
    if (statusLog) {
      logContent += message + "\n";
      statusLog.innerHTML = logContent;
      statusLog.scrollTop = statusLog.scrollHeight;
    }
  }
  async function renderUI() {
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
      stepsContainer.innerHTML = "";
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
        stepsContainer.appendChild(groupDiv);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stepsContainer.innerHTML = `<p style="color: red;">\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438: ${message}</p>`;
      log(`[ERROR] \u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u043A\u043E\u043D\u0444\u0438\u0433\u0430: ${message}`);
    }
  }
  function main() {
    stepsContainer = document.getElementById("processing-steps");
    statusLog = document.getElementById("status-log");
    selectFilesButton = document.getElementById("select-files-button");
    startProcessingButton = document.getElementById("start-processing-button");
    if (!stepsContainer || !statusLog || !selectFilesButton || !startProcessingButton) {
      console.error("\u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430: \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B \u0432\u0441\u0435 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u044B\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B DOM. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 index.html.");
      document.body.innerHTML = `<h1 style="color: red;">\u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430: \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 HTML \u043D\u0430\u0440\u0443\u0448\u0435\u043D\u0430.</h1>`;
      return;
    }
    selectFilesButton.addEventListener("click", async () => {
      logContent = "";
      log("\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u0432\u044B\u0431\u043E\u0440 \u0444\u0430\u0439\u043B\u043E\u0432...");
      await window.api.selectFiles();
    });
    startProcessingButton.addEventListener("click", async () => {
      logContent = "";
      log("\u0417\u0430\u043F\u0443\u0441\u043A \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438...");
      const checkboxes = document.querySelectorAll('#processing-steps input[type="checkbox"]');
      const enabledSteps = Array.from(checkboxes).filter((i) => i.checked).map((i) => i.id);
      await window.api.startProcessing(enabledSteps);
    });
    window.api.onUpdateStatus((_event, message) => {
      log(message);
    });
    renderUI();
  }
  window.addEventListener("DOMContentLoaded", main);
})();
