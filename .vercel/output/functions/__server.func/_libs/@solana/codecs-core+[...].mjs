//#region node_modules/@solana/errors/dist/index.node.mjs
var SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY = 8078e3;
var SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH = 8078001;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH = 8078004;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH = 8078005;
var SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH = 8078006;
var SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE = 8078011;
function encodeValue(value) {
	if (Array.isArray(value)) return "%5B" + value.map(encodeValue).join("%2C%20") + "%5D";
	else if (typeof value === "bigint") return `${value}n`;
	else return encodeURIComponent(String(value != null && Object.getPrototypeOf(value) === null ? { ...value } : value));
}
function encodeObjectContextEntry([key, value]) {
	return `${key}=${encodeValue(value)}`;
}
function encodeContextObject(context) {
	const searchParamsString = Object.entries(context).map(encodeObjectContextEntry).join("&");
	return Buffer.from(searchParamsString, "utf8").toString("base64");
}
function getErrorMessage(code, context = {}) {
	{
		let decodingAdviceMessage = `Solana error #${code}; Decode this error by running \`npx @solana/errors decode -- ${code}`;
		if (Object.keys(context).length) decodingAdviceMessage += ` '${encodeContextObject(context)}'`;
		return `${decodingAdviceMessage}\``;
	}
}
var SolanaError = class extends Error {
	/**
	* Indicates the root cause of this {@link SolanaError}, if any.
	*
	* For example, a transaction error might have an instruction error as its root cause. In this
	* case, you will be able to access the instruction error on the transaction error as `cause`.
	*/
	cause = this.cause;
	/**
	* Contains context that can assist in understanding or recovering from a {@link SolanaError}.
	*/
	context;
	constructor(...[code, contextAndErrorOptions]) {
		let context;
		let errorOptions;
		if (contextAndErrorOptions) Object.entries(Object.getOwnPropertyDescriptors(contextAndErrorOptions)).forEach(([name, descriptor]) => {
			if (name === "cause") errorOptions = { cause: descriptor.value };
			else {
				if (context === void 0) context = { __code: code };
				Object.defineProperty(context, name, descriptor);
			}
		});
		const message = getErrorMessage(code, context);
		super(message, errorOptions);
		this.context = Object.freeze(context === void 0 ? { __code: code } : context);
		this.name = "SolanaError";
	}
};
//#endregion
//#region node_modules/@solana/codecs-core/dist/index.node.mjs
function getEncodedSize(value, encoder) {
	return "fixedSize" in encoder ? encoder.fixedSize : encoder.getSizeFromValue(value);
}
function createEncoder(encoder) {
	return Object.freeze({
		...encoder,
		encode: (value) => {
			const bytes = new Uint8Array(getEncodedSize(value, encoder));
			encoder.write(value, bytes, 0);
			return bytes;
		}
	});
}
function createDecoder(decoder) {
	return Object.freeze({
		...decoder,
		decode: (bytes, offset = 0) => decoder.read(bytes, offset)[0]
	});
}
function isFixedSize(codec) {
	return "fixedSize" in codec && typeof codec.fixedSize === "number";
}
function combineCodec(encoder, decoder) {
	if (isFixedSize(encoder) !== isFixedSize(decoder)) throw new SolanaError(SOLANA_ERROR__CODECS__ENCODER_DECODER_SIZE_COMPATIBILITY_MISMATCH);
	if (isFixedSize(encoder) && isFixedSize(decoder) && encoder.fixedSize !== decoder.fixedSize) throw new SolanaError(SOLANA_ERROR__CODECS__ENCODER_DECODER_FIXED_SIZE_MISMATCH, {
		decoderFixedSize: decoder.fixedSize,
		encoderFixedSize: encoder.fixedSize
	});
	if (!isFixedSize(encoder) && !isFixedSize(decoder) && encoder.maxSize !== decoder.maxSize) throw new SolanaError(SOLANA_ERROR__CODECS__ENCODER_DECODER_MAX_SIZE_MISMATCH, {
		decoderMaxSize: decoder.maxSize,
		encoderMaxSize: encoder.maxSize
	});
	return {
		...decoder,
		...encoder,
		decode: decoder.decode,
		encode: encoder.encode,
		read: decoder.read,
		write: encoder.write
	};
}
function assertByteArrayIsNotEmptyForCodec(codecDescription, bytes, offset = 0) {
	if (bytes.length - offset <= 0) throw new SolanaError(SOLANA_ERROR__CODECS__CANNOT_DECODE_EMPTY_BYTE_ARRAY, { codecDescription });
}
function assertByteArrayHasEnoughBytesForCodec(codecDescription, expected, bytes, offset = 0) {
	const bytesLength = bytes.length - offset;
	if (bytesLength < expected) throw new SolanaError(SOLANA_ERROR__CODECS__INVALID_BYTE_LENGTH, {
		bytesLength,
		codecDescription,
		expected
	});
}
function toArrayBuffer(bytes, offset, length) {
	const bytesOffset = bytes.byteOffset + (offset ?? 0);
	const bytesLength = length ?? bytes.byteLength;
	let buffer;
	if (typeof SharedArrayBuffer === "undefined") buffer = bytes.buffer;
	else if (bytes.buffer instanceof SharedArrayBuffer) {
		buffer = new ArrayBuffer(bytes.length);
		new Uint8Array(buffer).set(new Uint8Array(bytes));
	} else buffer = bytes.buffer;
	return (bytesOffset === 0 || bytesOffset === -bytes.byteLength) && bytesLength === bytes.byteLength ? buffer : buffer.slice(bytesOffset, bytesOffset + bytesLength);
}
//#endregion
export { createEncoder as a, SolanaError as c, createDecoder as i, assertByteArrayIsNotEmptyForCodec as n, toArrayBuffer as o, combineCodec as r, SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE as s, assertByteArrayHasEnoughBytesForCodec as t };
