import { ExtensionJsType } from "@/common/interface/ExtensionJsType";

export interface MessageChannel {
    key: string;
    source: ExtensionJsType;
    target?: ExtensionJsType; // listener 不填
}

export interface Message {
    channel: MessageChannel;
    data: any;
}

export type MessageCallback = (data: any, channel: MessageChannel) => any;