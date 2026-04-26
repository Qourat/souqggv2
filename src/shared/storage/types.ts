export interface UploadInput {
  bucket: string;
  path: string;
  body: ArrayBuffer | Blob | Buffer;
  contentType?: string;
  upsert?: boolean;
}

export interface SignedUrlInput {
  bucket: string;
  path: string;
  expiresInSeconds: number;
  download?: boolean;
  filename?: string;
}

export interface StorageAdapter {
  upload(input: UploadInput): Promise<{ path: string }>;
  signedDownloadUrl(input: SignedUrlInput): Promise<{ url: string; expiresAt: Date }>;
  remove(bucket: string, paths: string[]): Promise<void>;
}
