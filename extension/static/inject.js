console.log('Inject script running...');

chrome.runtime.sendMessage({
  type: 'PAGE_INFO',
  title: document.title,
  body: document.body.innerText // Extract page content
});
