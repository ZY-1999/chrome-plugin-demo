import { crawlerInitListeners, listenMessage } from "@/common/message/MessageListener";
import { ExtensionJsType } from "@/common/interface/ExtensionJsType";
import { getCurrentJsType } from "@/common/utils/chromeUtil";
import { setInter } from "@/common/utils/setIntervalUtil";
import { sendMessage } from "@/common/message/MessageSender";

console.log("before init", '------crawler---------');

crawlerInitListeners();
listenMessage('test', ExtensionJsType.POPUP, (data) => {
    console.log(getCurrentJsType(), 'listen message', data);
    return getCurrentJsType() + data;
})

let i = 0;
setInter(() => {
    console.log('send to background', );
    sendMessage('test', ExtensionJsType.BACKGROUND, i++).then(res => {
        console.log('back from background', res);
    });
}, 2000)