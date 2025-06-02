import { Notice, Plugin } from 'obsidian';
import { DocumentSyncerSettingTab } from './src/settings';
import { DocumentSyncer } from './src/sync';
import { DEFAULT_SETTINGS, DocumentSyncerSettings } from './src/types';

export default class DocumentSyncerPlugin extends Plugin {
    settings: DocumentSyncerSettings;
    private syncer: DocumentSyncer;
    private autoSyncIntervalId: number | null = null;
    private isSyncing: boolean = false; // 同步状态标志

    async onload() {
        await this.loadSettings();

        // 初始化同步器
        this.syncer = new DocumentSyncer(this.settings, this.app.vault);

        // 添加设置选项卡
        this.addSettingTab(new DocumentSyncerSettingTab(this.app, this));

        // 添加同步命令
        this.addCommand({
            id: 'sync-documents',
            name: '同步文档',
            callback: async () => {
                await this.syncDocuments();
            },
        });

        // 添加功能区按钮
        this.addRibbonIcon('sync', '同步文档到 Obsidian', async () => {
            await this.syncDocuments();
        });

        // 添加状态栏项
        const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText('MpClipper Sync');
        statusBarItemEl.onClickEvent(() => {
            this.syncDocuments();
        });

        // 如果启用了自动同步，启动自动同步
        if (this.settings.autoSync) {
            this.startAutoSync();
        }

        // 当插件加载时显示通知
        new Notice('MpClipper Sync 已加载');
    }

    onunload() {
        this.stopAutoSync();
    }

    async loadSettings() {
        const data = await this.loadData();
        this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * 同步文档
     * 从服务器或 S3 同步文档，并保存同步进度
     */
    async syncDocuments(): Promise<boolean> {
        // 检查是否有同步任务正在运行
        if (this.isSyncing) {
            new Notice('正在同步中，请稍后再试');
            return false;
        }
        
        try {
            // 设置同步状态为正在同步
            this.isSyncing = true;
            
            // 在同步前显示通知
            new Notice('开始同步文档...');
            
            // 执行同步
            const success = await this.syncer.syncDocuments();
            
            // 如果同步成功，保存设置
            if (success) {
                await this.saveSettings();
            }
            
            return success;
        } catch (error) {
            console.error('同步文档失败:', error);
            new Notice(`同步文档失败: ${error.message}`);
            return false;
        } finally {
            // 无论同步成功还是失败，都重置同步状态
            this.isSyncing = false;
        }
    }

    /**
     * 启动自动同步
     */
    startAutoSync() {
        if (this.autoSyncIntervalId !== null) {
            this.stopAutoSync();
        }

        const intervalMs = this.settings.autoSyncInterval * 60 * 1000;
        this.autoSyncIntervalId = window.setInterval(() => {
            this.syncDocuments();
        }, intervalMs);
    }

    /**
     * 停止自动同步
     */
    stopAutoSync() {
        if (this.autoSyncIntervalId !== null) {
            window.clearInterval(this.autoSyncIntervalId);
            this.autoSyncIntervalId = null;
        }
    }

    /**
     * 重启自动同步（用于更新间隔时间）
     */
    restartAutoSync() {
        this.stopAutoSync();
        this.startAutoSync();
    }
}
