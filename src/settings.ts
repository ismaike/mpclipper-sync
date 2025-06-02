import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import DocumentSyncerPlugin from '../main';
import { S3ApiClient } from './s3Client';

export class DocumentSyncerSettingTab extends PluginSettingTab {
    plugin: DocumentSyncerPlugin;

    constructor(app: App, plugin: DocumentSyncerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();
        
        // 添加自定义 CSS 类名，用于样式定制
        containerEl.addClass('mpclipper-sync-settings');

        containerEl.createEl('h2', { text: 'MpClipper Sync 设置' });
        
        containerEl.createEl('h3', { text: 'S3 对象存储设置' });
        
        new Setting(containerEl)
            .setName('S3 桶名称')
            .setDesc('存储文档的 S3 桶名称')
            .addText(text => text
                .setPlaceholder('my-documents-bucket')
                .setValue(this.plugin.settings.s3BucketName)
                .onChange(async (value) => {
                    this.plugin.settings.s3BucketName = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('S3 端点')
            .setDesc('S3 服务的端点 URL')
            .addText(text => text
                .setPlaceholder('https://s3.amazonaws.com')
                .setValue(this.plugin.settings.s3Endpoint)
                .onChange(async (value) => {
                    this.plugin.settings.s3Endpoint = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('区域')
            .setDesc('S3 区域（如 us-east-1）')
            .addText(text => text
                .setPlaceholder('us-east-1')
                .setValue(this.plugin.settings.s3Region)
                .onChange(async (value) => {
                    this.plugin.settings.s3Region = value;
                    await this.plugin.saveSettings();
                }));
            
        new Setting(containerEl)
            .setName('访问密钥 ID')
            .setDesc('S3 访问密钥 ID')
            .addText(text => text
                .setPlaceholder('AKIAIOSFODNN7EXAMPLE')
                .setValue(this.plugin.settings.s3AccessKey)
                .onChange(async (value) => {
                    this.plugin.settings.s3AccessKey = value;
                    await this.plugin.saveSettings();
                }));
        
        new Setting(containerEl)
            .setName('访问密钥密文')
            .setDesc('S3 访问密钥密文')
            .addText(text => {
                // 将输入框设置为密码类型
                const textEl = text.inputEl as HTMLInputElement;
                textEl.type = 'password';
                
                return text
                    .setPlaceholder('访问密钥密文')
                    .setValue(this.plugin.settings.s3AccessSecret)
                    .onChange(async (value: string) => {
                        this.plugin.settings.s3AccessSecret = value;
                        await this.plugin.saveSettings();
                    });
            });
        
        new Setting(containerEl)
            .setName('文件路径前缀')
            .setDesc('要同步的文件路径前缀（可选）')
            .addText(text => text
                .setPlaceholder('documents/')
                .setValue(this.plugin.settings.s3FilePath)
                .onChange(async (value) => {
                    this.plugin.settings.s3FilePath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('同步文件夹')
            .setDesc('文档将被同步到的文件夹路径')
            .addText(text => text
                .setPlaceholder('文档/同步')
                .setValue(this.plugin.settings.syncFolder)
                .onChange(async (value) => {
                    this.plugin.settings.syncFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('自动同步')
            .setDesc('启用自动同步')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoSync)
                .onChange(async (value) => {
                    this.plugin.settings.autoSync = value;
                    await this.plugin.saveSettings();
                    if (value) {
                        this.plugin.startAutoSync();
                    } else {
                        this.plugin.stopAutoSync();
                    }
                }));

        new Setting(containerEl)
            .setName('自动同步间隔')
            .setDesc('自动同步的间隔时间（分钟）')
            .addSlider(slider => slider
                .setLimits(5, 120, 5)
                .setValue(this.plugin.settings.autoSyncInterval)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.autoSyncInterval = value;
                    await this.plugin.saveSettings();
                    if (this.plugin.settings.autoSync) {
                        this.plugin.restartAutoSync();
                    }
                }));

        new Setting(containerEl)
            .setName('上次同步')
            .setDesc('上次成功同步的时间')
            .addText(text => text
                .setValue(this.plugin.settings.lastSyncTime || '从未同步')
                .setDisabled(true));
                
        if (this.plugin.settings.lastSyncTimestamp > 0) {
            new Setting(containerEl)
                .setName('上次同步时间戳')
                .setDesc('上次同步的时间戳（毫秒）')
                .addText(text => text
                    .setValue(this.plugin.settings.lastSyncTimestamp.toString())
                    .setDisabled(true));
        }

        new Setting(containerEl)
            .setName('测试连接')
            .setDesc('测试与服务的连接')
            .addButton(button => button
                .setButtonText('测试')
                .onClick(async () => {
                    let success = false;
                    
                    const s3Client = new S3ApiClient(this.plugin.settings);
                    success = await s3Client.testConnection();
                    
                    if (success) {
                        new Notice('S3 连接成功！');
                    } else {
                        new Notice('S3 连接失败，请检查配置信息');
                    }
                }));

        new Setting(containerEl)
            .setName('立即同步')
            .setDesc('立即从服务器同步文档')
            .addButton(button => button
                .setButtonText('同步')
                .onClick(async () => {
                    await this.plugin.syncDocuments();
                }));
    }
}
