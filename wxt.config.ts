import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Career OS · 简历秒填助手',
    description: '从 Career OS 桌面应用只读获取资料，预览并填写网页表单',
    version: '0.5.0',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: [
      'http://127.0.0.1:43119/*'
    ],
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png'
    },
    action: {
      default_title: '简历秒填助手',
      default_icon: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png'
      }
    },
    options_ui: { page: 'options.html', open_in_tab: true }
  }
});
