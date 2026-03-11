/// <reference types="vite/client" />

interface FileSystemDirectoryHandle {
  readonly kind: "directory";
  readonly name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  queryPermission?(descriptor: { mode: string }): Promise<string>;
  requestPermission?(descriptor: { mode: string }): Promise<string>;
}

interface FileSystemFileHandle {
  readonly kind: "file";
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BufferSource | Blob | string): Promise<void>;
  close(): Promise<void>;
}

interface Window {
  showDirectoryPicker?(options?: { mode?: string }): Promise<FileSystemDirectoryHandle>;
}
