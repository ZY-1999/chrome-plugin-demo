export enum ExtensionJsType {
    POPUP = 'popup',
    BACKGROUND = 'background',
    CONTENT = 'content',
    CRAWLER = 'crawler',
}

/**
 *           popup
 * 特殊页面，用户点击插件图标打开
 * 打开后才可通信
 *                                   content.js                         crawler.js
 *                          插件有访问权限的页面，可注入               由content注入页面的脚本，注入需配置 web_accessible_resources
 *                          共享页面dom，js隔离，可使用部分chrome api
 *          background
 * 提供服务，需要时才被唤醒
 *
 */