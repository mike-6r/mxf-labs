import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import type { StorageProvider, StoredFile } from "@/lib/storage/types";

const contentTypes: Record<string, string> = {
  JAR: "application/java-archive",
  ZIP: "application/zip",
  PDF: "application/pdf",
  JSON: "application/json",
  TXT: "text/plain; charset=utf-8",
};

export function resolveLocalStorageRoot(root = process.env.LOCAL_STORAGE_ROOT || "storage/products") {
  const normalizedRoot = root.trim();

  if (path.isAbsolute(normalizedRoot)) {
    return path.resolve(normalizedRoot);
  }

  const scopedRoot = normalizedRoot.replace(/\\/g, "/").replace(/^storage\/?/, "") || "products";
  return path.join(process.cwd(), "storage", scopedRoot);
}

export class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(root = process.env.LOCAL_STORAGE_ROOT || "storage/products") {
    this.root = resolveLocalStorageRoot(root);
  }

  private resolveKey(storageKey: string) {
    const target = path.resolve(this.root, storageKey);

    if (target !== this.root && !target.startsWith(`${this.root}${path.sep}`)) {
      throw new Error("Invalid storage key.");
    }

    return target;
  }

  async getFile(storageKey: string, filename: string, fileType = "Other"): Promise<StoredFile | null> {
    const target = this.resolveKey(storageKey);

    try {
      const fileStat = await stat(target);
      const nodeStream = createReadStream(target);

      return {
        stream: Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>,
        size: fileStat.size,
        contentType: contentTypes[fileType.toUpperCase()] || "application/octet-stream",
        filename,
      };
    } catch {
      return null;
    }
  }
}
