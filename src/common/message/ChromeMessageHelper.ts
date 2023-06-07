import { Message, MessageCallback } from "@/common/interface/Message";
import { getCurrentJsType } from "@/common/utils/chromeUtil";
import { ExtensionJsType } from "@/common/interface/ExtensionJsType";
import { contentAccessibleKey } from "@/common/message/MessageConst";
import { setInter } from "@/common/utils/setIntervalUtil";

interface ChromeMessage extends Message {
    id: number;
    type: 'message' | 'response' ;
    tabId?: number;
    needTransfer?: boolean;
}
interface ResponseHandler {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    expiredTime: number;
}
const RESPONSE_HANDLER_EFFECTIVE_MS = 30 * 1000;

class ListenerDispatcher {

    listenerMap: { [key: string]: { [source: string]: MessageCallback } } = {};

    public async dispatch(message: Message): Promise<any> {
        const { channel: { key, source, target, }, data } = message;
        const callbacks = this.listenerMap[key] || {};
        const callback = callbacks[source];
        if (callback == undefined) {
            throw new Error(`can not find listener, key:${key}, source:${source}, target:${target}`);
        }
        return await callback(data, message.channel);
    }

    public register(key: string, source: ExtensionJsType, callback: MessageCallback) {
        let callbacks = this.listenerMap[key] || {};
        callbacks[source] = callback;
        this.listenerMap = {...this.listenerMap, [key]: callbacks};
    }
}


class ChromeMessageHelper {

    messageId = 1;

    responseHandlers: { [messageId: string]: ResponseHandler } = {};

    listenerDispatcher = new ListenerDispatcher();

    constructor() {
        this.clearExpiredResponseHandler();
    }

    public async send(key: string, target: ExtensionJsType, data: any): Promise<any> {
        const current = getCurrentJsType();
        const message = {channel: {key, source: current, target}, data};
        if (message.channel.target === getCurrentJsType()) {
            return await this.listenerDispatcher.dispatch(message);
        }
        let tabId = 0;
        if (current === ExtensionJsType.BACKGROUND || current === ExtensionJsType.POPUP) {
            tabId = await this.getFirstAccessibleTabId();
        }
        return await this.sendMessageWithRes({ ...message, id: this.messageId++, type: 'message', tabId })
    }

    public addListener(key: string, source: ExtensionJsType, callback: MessageCallback) {
        this.listenerDispatcher.register(key, source, callback);
    }

    public initListeners(currentJs: ExtensionJsType) {
        globalThis.currentJsType = currentJs;
        if (currentJs !== ExtensionJsType.CRAWLER) {
            chrome.runtime.onMessage.addListener(async (message: ChromeMessage, sender) => {
                await this.handleMessage(message, sender.tab?.id || 0);
            })
        }
        if (currentJs !== ExtensionJsType.POPUP && currentJs !== ExtensionJsType.BACKGROUND) {
            window.addEventListener("message", async (e) => {
                const message: ChromeMessage = e.data;
                await this.handleMessage(message);
            }, false);
        }
    }

    public async isTabAccessible(tabId = 0) {
        try {
            const message: ChromeMessage = {
                channel: { key: contentAccessibleKey, source: getCurrentJsType(), target: ExtensionJsType.CONTENT },
                id: this.messageId++,
                data: {},
                type: 'message',
                tabId
            };
            const res = await this.sendMessageWithRes(message);
            return res?.success;
        } catch (e) {
            return false;
        }
    }

    public async getFirstAccessibleTabId(url = ''){
        const tabs = await chrome.tabs.query({}) || [];
        for (let tab of tabs) {
            if (tab.id && tab.active && tab.url?.includes(url) && (await this.isTabAccessible(tab.id))) {
                return tab.id;
            }
        }
        for (let tab of tabs) {
            if (tab.id  && tab.url?.includes(url) && (await this.isTabAccessible(tab.id))) {
                return tab.id;
            }
        }
        return 0;
    }

    async handleMessage(message: ChromeMessage, messageFromTabId = 0) {
        if (!this.messageCheck(message)) {
            return;
        }
        const { id, channel: { key, source, target }, data, type, needTransfer } = message;
        const currentJs = getCurrentJsType();
        // 转发
        if (currentJs === ExtensionJsType.CONTENT && this.isTransferMessage(message) && needTransfer) {
            this.sendMessage({...message, needTransfer: false});
            return;
        }
        if (currentJs === target) {
            if (type === 'response') {
                const { resolve, reject } = this.responseHandlers[id];
                data.success ? resolve(data.result) : reject(data.result);
                delete this.responseHandlers[id];
            } else {
                const channel = { key, 'source': currentJs, 'target': source }
                let resultData;
                try {
                    resultData = { result: await this.listenerDispatcher.dispatch(message), success: true };
                } catch (e: any) {
                    resultData = { result: e.message, success: true };
                }
                const responseMessage: ChromeMessage = { id, type: 'response', 'data': resultData, channel, tabId: messageFromTabId };
                this.sendMessage({...responseMessage, needTransfer: this.isTransferMessage(responseMessage)});
            }
        }
    }

    messageCheck(message: ChromeMessage) {
        if (message && message.id > 0 && message.channel) {
            const { key, source } = message.channel;
            return !!(key) && key.length > 0 && !!(source) && source.length > 0 && source !== getCurrentJsType();
        }
        return false;
    }

    sendMessageWithRes(message: ChromeMessage) {
        return new Promise<any>((resolve, reject) => {
            this.responseHandlers[message.id] = { resolve, reject, expiredTime: new Date().getTime() + RESPONSE_HANDLER_EFFECTIVE_MS };
            this.sendMessage({...message, needTransfer: this.isTransferMessage(message)});
        })
    }

    sendMessage(message: ChromeMessage) {
        const tabId = message.tabId || 0;
        const currentJsType = getCurrentJsType();
        if (currentJsType === ExtensionJsType.POPUP || currentJsType === ExtensionJsType.BACKGROUND) {
            chrome.tabs.sendMessage(tabId, message);
        }else if (currentJsType === ExtensionJsType.CRAWLER || (currentJsType === ExtensionJsType.CONTENT && message.channel.target === ExtensionJsType.CRAWLER)) {
            window.postMessage(message, '*');
        } else {
            chrome.runtime.sendMessage(message)
        }
    }

    isTransferMessage(message: ChromeMessage) {
        return ExtensionJsType.CONTENT !== message.channel.target
            && ExtensionJsType.CONTENT !== message.channel.source;
    }

    clearExpiredResponseHandler() {
        setInter(() => {
            const nowMs = new Date().getTime();
            Object.keys(this.responseHandlers).forEach(messageId => {
                const { reject, expiredTime } = this.responseHandlers[messageId] || {};
                if ( expiredTime && expiredTime < nowMs) {
                    reject(`response time out,  response must return in ${RESPONSE_HANDLER_EFFECTIVE_MS} ms`);
                    delete this.responseHandlers[messageId];
                }
            })
        }, RESPONSE_HANDLER_EFFECTIVE_MS);
    }

}

export default new ChromeMessageHelper();