import zlib from "node:zlib";

// biome-ignore lint: cbb
const make = (ctx: any, handle: zlib.Gzip) =>
	Object.assign(ctx, {
		writable: new WritableStream({
			write: (chunk) => void handle.write(chunk),
			close: () => void handle.end(),
		}),
		readable: new ReadableStream({
			start(ctrl) {
				handle.on("data", (chunk: ArrayBufferView) => ctrl.enqueue(chunk));
				handle.once("end", () => ctrl.close());
			},
		}),
	});
Object.assign(globalThis, {
	CompressionStream: class CompressionStream {
		constructor(format: string) {
			make(
				this,
				format === "deflate"
					? zlib.createDeflate()
					: format === "gzip"
						? zlib.createGzip()
						: zlib.createDeflateRaw(),
			);
		}
	},
	DecompressionStream: class DecompressionStream {
		constructor(format: string) {
			make(
				this,
				format === "deflate"
					? zlib.createInflate()
					: format === "gzip"
						? zlib.createGunzip()
						: zlib.createInflateRaw(),
			);
		}
	},
});
