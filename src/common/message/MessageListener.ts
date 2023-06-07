import { MessageCallback } from "@/common/interface/Message";
import { contentAccessibleKey, popUpActiveKey } from "@/common/message/MessageConst";
import { ExtensionJsType } from "@/common/interface/ExtensionJsType";
import chromeMessageHelper from "@/common/message/ChromeMessageHelper";

const ALL_SOURCES = Object.values(ExtensionJsType);

export const listenMessage = (key: string, source: ExtensionJsType | ExtensionJsType[] = ALL_SOURCES, callback: MessageCallback ) => {
    let sources: ExtensionJsType[] = [];
    if (Array.isArray(source)) {
        sources.push(...source);
    } else {
        sources.push(source);
    }
    sources.forEach((v) => {
        chromeMessageHelper.addListener(key, v, callback);
    });
}

// 注解方式使用
export function listener(key: string, source: ExtensionJsType | ExtensionJsType[] = ALL_SOURCES): Function {
    return (target: any, property: string, descriptor: PropertyDescriptor) => {
        if (property && descriptor) {
            const fnc = descriptor.value.bind(target);
            listenMessage(key, source, fnc);
        }
    };
}

export const contentInitListeners = () => {
    listenMessage(contentAccessibleKey, ExtensionJsType.BACKGROUND, () => ({success: true}));
    listenMessage(contentAccessibleKey, ExtensionJsType.POPUP, () => ({success: true}));
    chromeMessageHelper.initListeners(ExtensionJsType.CONTENT);
}

export const backgroundInitListeners = () => {
    chromeMessageHelper.initListeners(ExtensionJsType.BACKGROUND);
}

export const popupInitListeners = () => {
    listenMessage(popUpActiveKey, ExtensionJsType.CONTENT, () => {});
    chromeMessageHelper.initListeners(ExtensionJsType.POPUP);
}

export const crawlerInitListeners = () => {
    chromeMessageHelper.initListeners(ExtensionJsType.CRAWLER);
}
