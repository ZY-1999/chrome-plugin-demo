// 页面被注入的脚本，入口文件
import { injectCrawlerScript } from '@/content/ContentUtil';
import { contentInitListeners, listenMessage } from "@/common/message/MessageListener";
import { ExtensionJsType } from "@/common/interface/ExtensionJsType";
import { getCurrentJsType } from "@/common/utils/chromeUtil";

console.log("before init", '------content---------');

injectCrawlerScript('crawler.js');
contentInitListeners();

listenMessage('test', ExtensionJsType.POPUP, (data) => {
    console.log(getCurrentJsType(), 'listen message', data);
    return getCurrentJsType() + data;
})

listenMessage('winTest', ExtensionJsType.CRAWLER, (data) => {
    console.log(getCurrentJsType(), 'listen message', data);
    return getCurrentJsType() + data;
})

