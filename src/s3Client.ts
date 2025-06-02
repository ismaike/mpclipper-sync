import { 
    S3Client, 
    ListObjectsV2Command, 
    ListObjectsV2CommandInput, 
    GetObjectCommand,
    GetObjectCommandInput,
    _Object
} from "@aws-sdk/client-s3";
import { DocumentSyncerSettings, S3Object } from './types';
import { Notice } from 'obsidian';

/**
 * S3 API 客户端
 * 负责与 S3 服务交互，获取和下载文件
 */
export class S3ApiClient {
    private client: S3Client | null = null;
    private settings: DocumentSyncerSettings;
    
    /**
     * 构造函数
     * @param settings 插件设置
     */
    constructor(settings: DocumentSyncerSettings) {
        this.settings = settings;
        // 不在构造函数中初始化 S3Client，而是在需要时才初始化
    }
    
    /**
     * 获取 S3 客户端实例
     * 延迟初始化，只在需要时才创建客户端
     * @returns S3Client 实例
     */
    private getClient(): S3Client {
        if (!this.client) {
            // 只有在客户端为空时才初始化
            this.client = new S3Client({
                region: this.settings.s3Region || 'us-east-1', // 提供默认区域
                endpoint: this.settings.s3Endpoint,
                credentials: {
                    accessKeyId: this.settings.s3AccessKey,
                    secretAccessKey: this.settings.s3AccessSecret
                }
            });
        }
        return this.client;
    }
    
    /**
     * 测试 S3 连接
     * @returns 连接是否成功
     */
    async testConnection(): Promise<boolean> {
        try {
            if (!this.validateSettings()) {
                return false;
            }
            
            // 尝试列出一个对象，只获取一个结果，测试连接
            const params: ListObjectsV2CommandInput = {
                Bucket: this.settings.s3BucketName,
                MaxKeys: 1,
                Prefix: this.settings.s3FilePath
            };
            
            const command = new ListObjectsV2Command(params);
            const response = await this.getClient().send(command);
            
            return true;
        } catch (error) {
            console.error('S3 连接测试失败:', error);
            return false;
        }
    }
    
    /**
     * 获取指定时间戳之后的文件列表
     * @param startTimestamp 开始时间戳（毫秒）
     * @returns S3 对象列表
     */
    async listFiles(startTimestamp: number): Promise<S3Object[]> {
        try {
            if (!this.validateSettings()) {
                return [];
            }
            
            const params: ListObjectsV2CommandInput = {
                Bucket: this.settings.s3BucketName,
                Prefix: this.settings.s3FilePath
            };
            
            const command = new ListObjectsV2Command(params);
            const s3Objects: S3Object[] = [];
            
            let isTruncated = true;
            let continuationToken: string | undefined = undefined;
            
            // 处理分页结果
            while (isTruncated) {
                if (continuationToken) {
                    params.ContinuationToken = continuationToken;
                }
                
                const response = await this.getClient().send(new ListObjectsV2Command(params));
                
                // 处理当前页的对象
                const objects = response.Contents || [];
                for (const obj of objects) {
                    if (obj.Key && obj.LastModified && obj.Size) {
                        // 只处理 Markdown 文件
                        if (!obj.Key.endsWith('.md')) {
                            continue;
                        }
                        
                        // 只处理指定时间戳之后的文件
                        if (obj.LastModified.getTime() > startTimestamp) {
                            s3Objects.push({
                                key: obj.Key,
                                lastModified: obj.LastModified,
                                size: obj.Size
                            });
                        }
                    }
                }
                
                // 检查是否有更多页
                isTruncated = response.IsTruncated || false;
                continuationToken = response.NextContinuationToken;
            }
            
            // 按时间戳排序
            s3Objects.sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime());
            
            return s3Objects;
        } catch (error) {
            console.error('获取 S3 文件列表失败:', error);
            new Notice(`获取 S3 文件列表失败: ${error.message}`);
            return [];
        }
    }
    
    /**
     * 下载文件内容
     * @param key 文件键名
     * @returns 文件内容
     */
    async downloadFile(key: string): Promise<string | null> {
        try {
            if (!this.validateSettings()) {
                return null;
            }
            
            const params: GetObjectCommandInput = {
                Bucket: this.settings.s3BucketName,
                Key: key
            };
            
            const command = new GetObjectCommand(params);
            const response = await this.getClient().send(command);
            
            // 读取文件内容
            if (response.Body) {
                // 将流转换为字符串
                const streamReader = response.Body.transformToString();
                return await streamReader;
            }
            
            return null;
        } catch (error) {
            console.error(`下载文件 ${key} 失败:`, error);
            new Notice(`下载文件失败: ${error.message}`);
            return null;
        }
    }
    
    /**
     * 验证 S3 设置是否完整
     * @returns 设置是否有效
     */
    private validateSettings(): boolean {
        if (!this.settings.s3BucketName) {
            new Notice('S3 桶名称未配置');
            return false;
        }
        
        if (!this.settings.s3Endpoint) {
            new Notice('S3 端点未配置');
            return false;
        }
        
        if (!this.settings.s3AccessKey || !this.settings.s3AccessSecret) {
            new Notice('S3 访问密钥未配置');
            return false;
        }
        
        return true;
    }
}
