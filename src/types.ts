// 插件设置接口
export interface DocumentSyncerSettings {
    // S3 相关配置
    s3BucketName: string;       // S3 桶名称
    s3Endpoint: string;         // S3 端点
    s3AccessKey: string;        // 访问密钥
    s3AccessSecret: string;     // 访问密钥密文
    s3Region: string;           // 区域
    s3FilePath: string;         // 文件路径前缀
    
    // 通用配置
    autoSync: boolean;
    autoSyncInterval: number;   // 以分钟为单位
    lastSyncTime: string;
    lastSyncTimestamp: number;  // 上次同步时间戳（毫秒）
    syncFolder: string;
}

// 默认设置
export const DEFAULT_SETTINGS: DocumentSyncerSettings = {
    // S3 相关配置
    s3BucketName: '',
    s3Endpoint: '',
    s3AccessKey: '',
    s3AccessSecret: '',
    s3Region: '',
    s3FilePath: '',
    
    // 通用配置
    autoSync: false,
    autoSyncInterval: 30,
    lastSyncTime: '',
    lastSyncTimestamp: 0,
    syncFolder: ''
};

// 文档接口
export interface Document {
    id: string;
    title: string;
    content: string;
    path: string;
    timestamp: string;
}

// S3 对象接口
export interface S3Object {
    key: string;           // 对象键名（文件路径）
    lastModified: Date;    // 最后修改时间
    size: number;          // 文件大小
    content?: string;      // 文件内容
}


