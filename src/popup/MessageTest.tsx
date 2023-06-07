import React, { useState } from "react";
import { ExtensionJsType } from "@/common/interface/ExtensionJsType";
import { sendMessage } from "@/common/message/MessageSender";

const MessageTest = () => {


    const types = Object.values(ExtensionJsType);
    const [callbacks, setCallBacks] = useState<{[x: string]: any}>({})

    const send = (type: ExtensionJsType) => {
        sendMessage('test', type, 'from popup')
            .then((res) => {
                setCallBacks({...callbacks, [type]: res});
            })
    }

    return (
        <div style={{margin: '20px, 20px'}}>
            {
                types.map(type => {
                    return <div style={{cursor: 'pointer', padding: '10px 20px'}} key={type} onClick={() => send(type)}>{callbacks[type.toString()] || "init"}</div>
                })
            }
        </div>
    )
}

export default MessageTest;