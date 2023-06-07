export const injectCrawlerScript = (path: string) => {
    let node = document.getElementsByTagName('body')[0];
    let script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', chrome.runtime.getURL(path));
    node.appendChild(script);
};
