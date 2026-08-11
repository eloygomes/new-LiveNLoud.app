const extensionApi = globalThis.browser || globalThis.chrome;

async function enableActionSidePanel() {
  if (!extensionApi?.sidePanel?.setPanelBehavior) return;
  await extensionApi.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
}

extensionApi.runtime.onInstalled.addListener(() => {
  enableActionSidePanel().catch(console.error);
});

extensionApi.runtime.onStartup.addListener(() => {
  enableActionSidePanel().catch(console.error);
});

enableActionSidePanel().catch(console.error);
