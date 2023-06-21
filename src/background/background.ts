/**
 * chrome 插件serviceWorker, 入口文件, 不能存储状态, 只能被调用
 * 状态存储使用存储api
 */
import { backgroundInitListeners, listenMessage } from "@/common/message/MessageListener";
import { ExtensionJsType } from "@/common/interface/ExtensionJsType";
import { getCurrentJsType } from "@/common/utils/chromeUtil";

console.log("before init", '------background---------');

backgroundInitListeners();
let i = 0;

listenMessage('test', [ExtensionJsType.CONTENT, ExtensionJsType.CRAWLER], (data) => {
    console.log(getCurrentJsType(), 'listen message', data);
    return i++;
})

listenMessage('test', ExtensionJsType.POPUP, (data) => {
    console.log(getCurrentJsType(), 'listen message', data);
    return getCurrentJsType() + data;
})