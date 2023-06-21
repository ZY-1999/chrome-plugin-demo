# chrome-plugin-demo
chrome-plugin; chrome插件; react; A demo for Chrome plugin development to solve common plugin development issues.

#### 目前实现了各个js间的通信及回调
* popup, background, content, crawler 间任意发送message并处理回调
* demo: 
```
// background.js
listenMessage('test', ExtensionJsType.POPUP, (data) => {
    console.log(getCurrentJsType(), 'listen message', data);
    return getCurrentJsType() + data;
})

// popup.js
 sendMessage('test', type, 'from popup')
            .then((res) => {
                setCallBacks({...callbacks, [type]: res});
            })

```
