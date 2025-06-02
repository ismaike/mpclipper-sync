import { Notice, TFile, TFolder, Vault } from 'obsidian';
import { S3ApiClient } from './s3Client';
import { Document, DocumentSyncerSettings, S3Object } from './types';

export class DocumentSyncer {
    private settings: DocumentSyncerSettings;
    private vault: Vault;
    private s3Client: S3ApiClient;

    constructor(settings: DocumentSyncerSettings, vault: Vault) {
        this.settings = settings;
        this.vault = vault;
        this.s3Client = new S3ApiClient(settings);
    }

    /**
     * 同步文档
     */
    async syncDocuments(): Promise<boolean> {
        try {
            return await this.syncFromS3();
        } catch (error) {
            console.error('同步文档失败:', error);
            new Notice(`同步文档失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 从 S3 同步文档
     */
    private async syncFromS3(): Promise<boolean> {
        try {
            // 确保同步文件夹存在
            await this.ensureSyncFolderExists();
            
            // 获取上次同步时间戳，如果没有则使用 0（从未同步）
            const startTimestamp = this.settings.lastSyncTimestamp || 0;
            
            // 获取文件列表
            const s3Objects = await this.s3Client.listFiles(startTimestamp);
            
            if (s3Objects.length === 0) {
                new Notice('没有新文档需要同步');
                return true;
            }
            
            new Notice(`开始从 S3 同步 ${s3Objects.length} 个文档...`);
            
            // 保存文档
            let successCount = 0;
            let latestTimestamp = startTimestamp;
            
            for (const s3Obj of s3Objects) {
                // 下载文件内容
                const content = await this.s3Client.downloadFile(s3Obj.key);
                if (!content) {
                    continue;
                }
                
                // 构建文档对象
                const fileName = s3Obj.key.split('/').pop() || '';
                const title = fileName.replace(/\.md$/, '');
                const doc: Document = {
                    id: s3Obj.key,
                    title: title,
                    content: content,
                    path: this.getRelativePath(s3Obj.key),
                    timestamp: s3Obj.lastModified.toISOString()
                };
                
                // 保存文档
                if (await this.saveDocument(doc)) {
                    successCount++;
                    
                    // 更新最新时间戳
                    const objTimestamp = s3Obj.lastModified.getTime();
                    if (objTimestamp > latestTimestamp) {
                        latestTimestamp = objTimestamp;
                    }
                }
            }
            
            // 更新同步状态
            const now = new Date();
            
            // 更新设置
            this.settings.lastSyncTimestamp = latestTimestamp;
            this.settings.lastSyncTime = now.toISOString();
            
            new Notice(`同步完成，成功导入 ${successCount}/${s3Objects.length} 个文档`);
            return true;
        } catch (error) {
            console.error('从 S3 同步文档失败:', error);
            new Notice(`从 S3 同步文档失败: ${error.message}`);
            return false;
        }
    }

    /**
     * 确保同步文件夹存在
     */
    private async ensureSyncFolderExists(): Promise<void> {
        if (!this.settings.syncFolder) {
            return;
        }

        const folderPath = this.settings.syncFolder;
        const folderExists = this.vault.getAbstractFileByPath(folderPath) instanceof TFolder;

        if (!folderExists) {
            try {
                await this.vault.createFolder(folderPath);
            } catch (error) {
                console.error('创建同步文件夹失败:', error);
                throw new Error(`创建同步文件夹失败: ${error.message}`);
            }
        }
    }

    /**
     * 保存文档到 Obsidian 库
     */
    private async saveDocument(doc: Document): Promise<boolean> {
        try {
            // 构建文件路径
            let filePath = doc.path;
            if (this.settings.syncFolder) {
                // 如果设置了同步文件夹，将文档保存到该文件夹下
                filePath = `${this.settings.syncFolder}/${doc.path}`;
            }

            // 确保文件夹存在
            const folderPath = filePath.substring(0, filePath.lastIndexOf('/'));
            if (folderPath) {
                const folderExists = this.vault.getAbstractFileByPath(folderPath) instanceof TFolder;
                if (!folderExists) {
                    await this.vault.createFolder(folderPath);
                }
            }

            // 检查文件是否已存在
            const existingFile = this.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) {
                // 更新现有文件
                await this.vault.modify(existingFile, doc.content);
            } else {
                // 创建新文件
                await this.vault.create(filePath, doc.content);
            }

            return true;
        } catch (error) {
            console.error(`保存文档 ${doc.title} 失败:`, error);
            new Notice(`保存文档 ${doc.title} 失败: ${error.message}`);
            return false;
        }
    }
    
    /**
     * 获取相对路径
     * 从 S3 对象键名中提取相对路径
     */
    private getRelativePath(key: string): string {
        // 移除前缀路径
        let path = key;
        if (this.settings.s3FilePath && path.startsWith(this.settings.s3FilePath)) {
            path = path.substring(this.settings.s3FilePath.length);
        }
        
        // 移除开头的斜杠
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        
        return path;
    }
}
