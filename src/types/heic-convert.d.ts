declare module "heic-convert" {
  export default function convert(opts: {
    buffer: Buffer | ArrayBufferLike | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  }): Promise<ArrayBuffer>;
}
