console.log('Content script loaded');

// Extract the page title
const pageTitle = document.title;
const pageBody = document.body.innerText;

// Send data to the background script
chrome.runtime.sendMessage({ type: 'PAGE_INFO', title: pageTitle, body: pageBody});
