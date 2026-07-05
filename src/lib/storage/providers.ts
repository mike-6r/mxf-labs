import { LocalStorageProvider } from "@/lib/storage/local";
import type { StorageProvider } from "@/lib/storage/types";

export function getStorageProvider(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase();

  if (provider !== "local") {
    throw new Error(`Storage provider "${provider}" is not enabled in this build. Use STORAGE_PROVIDER=local.`);
  }

  return new LocalStorageProvider();
}
