import { a as createEncoder, c as SolanaError, i as createDecoder, n as assertByteArrayIsNotEmptyForCodec, o as toArrayBuffer, r as combineCodec, s as SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE, t as assertByteArrayHasEnoughBytesForCodec } from "./@solana/codecs-core+[...].mjs";
//#region node_modules/@solana/codecs-numbers/dist/index.node.mjs
function assertNumberIsBetweenForCodec(codecDescription, min, max, value) {
	if (value < min || value > max) throw new SolanaError(SOLANA_ERROR__CODECS__NUMBER_OUT_OF_RANGE, {
		codecDescription,
		max,
		min,
		value
	});
}
function isLittleEndian(config) {
	return config?.endian === 1 ? false : true;
}
function numberEncoderFactory(input) {
	return createEncoder({
		fixedSize: input.size,
		write(value, bytes, offset) {
			if (input.range) assertNumberIsBetweenForCodec(input.name, input.range[0], input.range[1], value);
			const arrayBuffer = new ArrayBuffer(input.size);
			input.set(new DataView(arrayBuffer), value, isLittleEndian(input.config));
			bytes.set(new Uint8Array(arrayBuffer), offset);
			return offset + input.size;
		}
	});
}
function numberDecoderFactory(input) {
	return createDecoder({
		fixedSize: input.size,
		read(bytes, offset = 0) {
			assertByteArrayIsNotEmptyForCodec(input.name, bytes, offset);
			assertByteArrayHasEnoughBytesForCodec(input.name, input.size, bytes, offset);
			const view = new DataView(toArrayBuffer(bytes, offset, input.size));
			return [input.get(view, isLittleEndian(input.config)), offset + input.size];
		}
	});
}
var getU64Encoder = (config = {}) => numberEncoderFactory({
	config,
	name: "u64",
	range: [0n, BigInt("0xffffffffffffffff")],
	set: (view, value, le) => view.setBigUint64(0, BigInt(value), le),
	size: 8
});
var getU64Decoder = (config = {}) => numberDecoderFactory({
	config,
	get: (view, le) => view.getBigUint64(0, le),
	name: "u64",
	size: 8
});
var getU64Codec = (config = {}) => combineCodec(getU64Encoder(config), getU64Decoder(config));
//#endregion
export { getU64Encoder as n, getU64Codec as t };
