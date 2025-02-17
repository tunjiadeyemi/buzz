chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAGE_INFO') {
    console.log('Received page title:', message.title);
  }
});
