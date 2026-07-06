import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
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

export function resolveLocalStoragePath(storageKey: string, root = process.env.LOCAL_STORAGE_ROOT || "storage/products") {
  const storageRoot = resolveLocalStorageRoot(root);
  const normalizedKey = storageKey.replace(/\\/g, "/").trim();

  if (!normalizedKey || path.isAbsolute(normalizedKey) || normalizedKey.includes("\0")) {
    throw new Error("Invalid storage key.");
  }

  const segments = normalizedKey.split("/").filter(Boolean);

  if (!segments.length || segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error("Invalid storage key.");
  }

  const target = path.resolve(storageRoot, ...segments);

  if (target !== storageRoot && !target.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("Invalid storage key.");
  }

  return { root: storageRoot, target, storageKey: segments.join("/") };
}

export function sanitizeStorageSegment(value: string, fallback = "file") {
  const sanitized = value
    .toLowerCase()
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    ?.replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return sanitized || fallback;
}

export function createProductStorageKey({
  productSlug,
  version,
  filename,
}: {
  productSlug: string;
  version: string;
  filename: string;
}) {
  const safeProduct = sanitizeStorageSegment(productSlug, "product");
  const safeVersion = sanitizeStorageSegment(version, "release");
  const safeFilename = sanitizeStorageSegment(filename, "download.bin");
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return `${safeProduct}/${safeVersion}/${stamp}-${safeFilename}`;
}

export async function writeLocalStorageFile(storageKey: string, data: Uint8Array) {
  const { target, storageKey: normalizedKey } = resolveLocalStoragePath(storageKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
  return normalizedKey;
}

export async function deleteLocalStorageFile(storageKey: string) {
  const { target } = resolveLocalStoragePath(storageKey);
  await rm(target, { force: true });
}

export class LocalStorageProvider implements StorageProvider {
  private root: string;

  constructor(root = process.env.LOCAL_STORAGE_ROOT || "storage/products") {
    this.root = resolveLocalStorageRoot(root);
  }

  private resolveKey(storageKey: string) {
    return resolveLocalStoragePath(storageKey, this.root).target;
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
