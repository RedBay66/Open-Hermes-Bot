'use strict';

/**
 * The macOS menu, in the language the window is using.
 *
 * Roles keep the shortcuts and the behaviour. The words are ours, so a
 * Chinese window stays Chinese even when the system language is something
 * else, and an English window stays English.
 *
 * @param {'zh-CN' | 'en'} locale
 * @param {{ openSettings: () => void, showAbout: () => void }} actions
 * @returns {import('electron').MenuItemConstructorOptions[]}
 */
function menuTemplate(locale, actions) {
  const zh = locale === 'zh-CN';
  const label = zh
    ? {
        about: '关于 Hermes Bot 个人中文版',
        settings: '设置…',
        hide: '隐藏 Hermes Bot',
        hideOthers: '隐藏其他',
        showAll: '显示全部',
        quit: '退出 Hermes Bot',
        edit: '编辑',
        undo: '撤销',
        redo: '重做',
        cut: '剪切',
        copy: '拷贝',
        paste: '粘贴',
        pasteStyle: '粘贴并匹配样式',
        delete: '删除',
        selectAll: '全选',
        speech: '语音',
        startSpeaking: '开始朗读',
        stopSpeaking: '停止朗读',
        view: '显示',
        reload: '重新载入',
        forceReload: '强制重新载入',
        devtools: '开发者工具',
        actual: '实际大小',
        zoomIn: '放大',
        zoomOut: '缩小',
        fullscreen: '进入全屏幕',
        window: '窗口',
        minimize: '最小化',
        zoom: '缩放',
        close: '关闭窗口',
        front: '前置全部窗口',
      }
    : {
        about: 'About Hermes Bot',
        settings: 'Settings…',
        hide: 'Hide Hermes Bot',
        hideOthers: 'Hide Others',
        showAll: 'Show All',
        quit: 'Quit Hermes Bot',
        edit: 'Edit',
        undo: 'Undo',
        redo: 'Redo',
        cut: 'Cut',
        copy: 'Copy',
        paste: 'Paste',
        pasteStyle: 'Paste and Match Style',
        delete: 'Delete',
        selectAll: 'Select All',
        speech: 'Speech',
        startSpeaking: 'Start Speaking',
        stopSpeaking: 'Stop Speaking',
        view: 'View',
        reload: 'Reload',
        forceReload: 'Force Reload',
        devtools: 'Toggle Developer Tools',
        actual: 'Actual Size',
        zoomIn: 'Zoom In',
        zoomOut: 'Zoom Out',
        fullscreen: 'Toggle Full Screen',
        window: 'Window',
        minimize: 'Minimize',
        zoom: 'Zoom',
        close: 'Close',
        front: 'Bring All to Front',
      };

  return /** @type {import('electron').MenuItemConstructorOptions[]} */ ([
    {
      label: 'Hermes Bot',
      submenu: [
        { label: label.about, click: actions.showAbout },
        { type: 'separator' },
        {
          label: label.settings,
          accelerator: 'CmdOrCtrl+,',
          click: actions.openSettings,
        },
        { type: 'separator' },
        { role: 'hide', label: label.hide },
        { role: 'hideOthers', label: label.hideOthers },
        { role: 'unhide', label: label.showAll },
        { type: 'separator' },
        { role: 'quit', label: label.quit },
      ],
    },
    {
      label: label.edit,
      submenu: [
        { role: 'undo', label: label.undo },
        { role: 'redo', label: label.redo },
        { type: 'separator' },
        { role: 'cut', label: label.cut },
        { role: 'copy', label: label.copy },
        { role: 'paste', label: label.paste },
        { role: 'pasteAndMatchStyle', label: label.pasteStyle },
        { role: 'delete', label: label.delete },
        { type: 'separator' },
        { role: 'selectAll', label: label.selectAll },
        { type: 'separator' },
        {
          label: label.speech,
          submenu: [
            { role: 'startSpeaking', label: label.startSpeaking },
            { role: 'stopSpeaking', label: label.stopSpeaking },
          ],
        },
      ],
    },
    {
      label: label.view,
      submenu: [
        { role: 'reload', label: label.reload },
        { role: 'forceReload', label: label.forceReload },
        { role: 'toggleDevTools', label: label.devtools },
        { type: 'separator' },
        { role: 'resetZoom', label: label.actual },
        { role: 'zoomIn', label: label.zoomIn },
        { role: 'zoomOut', label: label.zoomOut },
        { type: 'separator' },
        { role: 'togglefullscreen', label: label.fullscreen },
      ],
    },
    {
      label: label.window,
      submenu: [
        { role: 'minimize', label: label.minimize },
        { role: 'zoom', label: label.zoom },
        { role: 'close', label: label.close },
        { type: 'separator' },
        { role: 'front', label: label.front },
      ],
    },
  ]);
}

/** The About box. MIT and the Bloub notice stay; this build is not upstream. */
function aboutCopy(locale) {
  if (locale === 'zh-CN') {
    return [
      '个人简体中文版，不是 AZERDSQ131/Open-Hermes-Bot 的官方版本。',
      '',
      'Hermes Bot 是 Hermes 的界面。连接、会话、助手、群聊、工具和记忆仍由你自己的 Hermes 主机负责。',
      '',
      '本程序基于上游项目修改，遵循 MIT 许可（Copyright © 2026 Jules Yzerd）。',
      '头像几何来自 Bloub（MIT，Copyright © 2026 Jérémy Perret），详见 THIRD_PARTY_NOTICES。',
      '',
      '官方更新会用英文原版替换这份汉化，因此本版本不会自动下载或安装上游发布。',
    ].join('\n');
  }
  return [
    'Personal Simplified Chinese edition. This is not an official release of AZERDSQ131/Open-Hermes-Bot.',
    '',
    'Hermes Bot is an interface for Hermes. The connection, sessions, bots, groups, tools and memory stay on your own Hermes host.',
    '',
    'This program is based on the upstream project and remains under the MIT license (Copyright © 2026 Jules Yzerd).',
    'Avatar geometry comes from Bloub (MIT, Copyright © 2026 Jérémy Perret); see THIRD_PARTY_NOTICES.',
    '',
    'An official update would replace this translation, so this edition does not download or install upstream releases.',
  ].join('\n');
}

module.exports = { menuTemplate, aboutCopy };
