import React from 'react';
import ReactDOM from 'react-dom';
import { listenMessage, popupInitListeners } from "@/common/message/MessageListener";
import MessageTest from "@/popup/MessageTest";
import { ExtensionJsType } from "@/common/interface/ExtensionJsType";
import { getCurrentJsType } from "@/common/utils/chromeUtil";

console.log("before init", '------popup---------');

popupInitListeners();
listenMessage('test', ExtensionJsType.POPUP, (data) => {
    console.log(getCurrentJsType(), 'listen message', data);
    return getCurrentJsType() + data;
})

const app = (
    <div>
        <MessageTest/>
    </div>
);

ReactDOM.render(app, document.getElementById('app'));