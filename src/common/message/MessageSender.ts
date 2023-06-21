import { ExtensionJsType } from "@/common/interface/ExtensionJsType";
import chromeMessageUtil from "@/common/message/ChromeMessageHelper";

export const sendMessage = (key: string, target: ExtensionJsType, data: any): Promise<any> => {
    return chromeMessageUtil.send(key, target, data);
}