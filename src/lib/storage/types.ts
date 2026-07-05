export type StoredFile = {
  stream: ReadableStream<Uint8Array>;
  size: number;
  contentType: string;
  filename: string;
};

export interface StorageProvider {
  getFile(storageKey: string, filename: string, fileType?: string | null): Promise<StoredFile | null>;
}
