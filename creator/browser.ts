'use strict';

/**
 * 插件定义的方法
 * Methods defined by extension
 * 可以在 package.json 里的 contributions 里定义 messages 触发这里的方法
 * And of course, messages can be defined in the contributions section in package.JSON to trigger the method here
 */
exports.methods = {
    async importCreatorProject() {
        const result = await Editor.Dialog.select({
            title: Editor.I18n.t('importer.select_dialog.title'),
            path: await Editor.Profile.getConfig('importer', 'import-path') || Editor.Project.path,
            type: 'directory',
        });
        if (!result.filePaths || !result.filePaths[0]) {
            return;
        }
        Editor.Profile.setConfig('importer', 'import-path', result.filePaths[0]);
        Editor.Panel.open('importer.creator');
    },
};

/**
 * 启动的时候执行的初始化方法
 * Initialization method performed at startup
 */
exports.load = function() {};

/**
 * 插件被关闭的时候执行的卸载方法
 * Uninstall method performed when the extension is closed
 */
exports.unload = function() {};
