import { t as secp256k1 } from "./noble__curves+noble__hashes.mjs";
import { t as keccak_256 } from "./noble__hashes.mjs";
import { t as ens_normalize } from "./adraffy__ens-normalize.mjs";
import http from "http";
import https from "https";
import { createHash } from "crypto";
import { gunzipSync } from "zlib";
//#region node_modules/ethers/lib.esm/_version.js
/**
*  The current version of Ethers.
*/
var version = "6.17.0";
//#endregion
//#region node_modules/ethers/lib.esm/utils/properties.js
/**
*  Property helper functions.
*
*  @_subsection api/utils:Properties  [about-properties]
*/
function checkType(value, type, name) {
	const types = type.split("|").map((t) => t.trim());
	for (let i = 0; i < types.length; i++) switch (type) {
		case "any": return;
		case "bigint":
		case "boolean":
		case "number":
		case "string": if (typeof value === type) return;
	}
	const error = /* @__PURE__ */ new Error(`invalid value for type ${type}`);
	error.code = "INVALID_ARGUMENT";
	error.argument = `value.${name}`;
	error.value = value;
	throw error;
}
/**
*  Resolves to a new object that is a copy of %%value%%, but with all
*  values resolved.
*/
async function resolveProperties(value) {
	const keys = Object.keys(value);
	return (await Promise.all(keys.map((k) => Promise.resolve(value[k])))).reduce((accum, v, index) => {
		accum[keys[index]] = v;
		return accum;
	}, {});
}
/**
*  Assigns the %%values%% to %%target%% as read-only values.
*
*  It %%types%% is specified, the values are checked.
*/
function defineProperties(target, values, types) {
	for (let key in values) {
		let value = values[key];
		const type = types ? types[key] : null;
		if (type) checkType(value, type, key);
		Object.defineProperty(target, key, {
			enumerable: true,
			value,
			writable: false
		});
	}
}
//#endregion
//#region node_modules/ethers/lib.esm/utils/errors.js
/**
*  All errors in ethers include properties to ensure they are both
*  human-readable (i.e. ``.message``) and machine-readable (i.e. ``.code``).
*
*  The [[isError]] function can be used to check the error ``code`` and
*  provide a type guard for the properties present on that error interface.
*
*  @_section: api/utils/errors:Errors  [about-errors]
*/
function stringify(value, seen) {
	if (value == null) return "null";
	if (seen == null) seen = /* @__PURE__ */ new Set();
	if (typeof value === "object") {
		if (seen.has(value)) return "[Circular]";
		seen.add(value);
	}
	if (Array.isArray(value)) return "[ " + value.map((v) => stringify(v, seen)).join(", ") + " ]";
	if (value instanceof Uint8Array) {
		const HEX = "0123456789abcdef";
		let result = "0x";
		for (let i = 0; i < value.length; i++) {
			result += HEX[value[i] >> 4];
			result += HEX[value[i] & 15];
		}
		return result;
	}
	if (typeof value === "object" && typeof value.toJSON === "function") return stringify(value.toJSON(), seen);
	switch (typeof value) {
		case "boolean":
		case "number":
		case "symbol": return value.toString();
		case "bigint": return BigInt(value).toString();
		case "string": return JSON.stringify(value);
		case "object": {
			const keys = Object.keys(value);
			keys.sort();
			return "{ " + keys.map((k) => `${stringify(k, seen)}: ${stringify(value[k], seen)}`).join(", ") + " }";
		}
	}
	return `[ COULD NOT SERIALIZE ]`;
}
/**
*  Returns true if the %%error%% matches an error thrown by ethers
*  that matches the error %%code%%.
*
*  In TypeScript environments, this can be used to check that %%error%%
*  matches an EthersError type, which means the expected properties will
*  be set.
*
*  @See [ErrorCodes](api:ErrorCode)
*  @example
*    try {
*      // code....
*    } catch (e) {
*      if (isError(e, "CALL_EXCEPTION")) {
*          // The Type Guard has validated this object
*          console.log(e.data);
*      }
*    }
*/
function isError(error, code) {
	return error && error.code === code;
}
/**
*  Returns true if %%error%% is a [[CallExceptionError].
*/
function isCallException(error) {
	return isError(error, "CALL_EXCEPTION");
}
/**
*  Returns a new Error configured to the format ethers emits errors, with
*  the %%message%%, [[api:ErrorCode]] %%code%% and additional properties
*  for the corresponding EthersError.
*
*  Each error in ethers includes the version of ethers, a
*  machine-readable [[ErrorCode]], and depending on %%code%%, additional
*  required properties. The error message will also include the %%message%%,
*  ethers version, %%code%% and all additional properties, serialized.
*/
function makeError(message, code, info) {
	let shortMessage = message;
	{
		const details = [];
		if (info) {
			if ("message" in info || "code" in info || "name" in info) throw new Error(`value will overwrite populated values: ${stringify(info)}`);
			for (const key in info) {
				if (key === "shortMessage") continue;
				const value = info[key];
				details.push(key + "=" + stringify(value));
			}
		}
		details.push(`code=${code}`);
		details.push(`version=${version}`);
		if (details.length) message += " (" + details.join(", ") + ")";
	}
	let error;
	switch (code) {
		case "INVALID_ARGUMENT":
			error = new TypeError(message);
			break;
		case "NUMERIC_FAULT":
		case "BUFFER_OVERRUN":
			error = new RangeError(message);
			break;
		default: error = new Error(message);
	}
	defineProperties(error, { code });
	if (info) Object.assign(error, info);
	if (error.shortMessage == null) defineProperties(error, { shortMessage });
	return error;
}
/**
*  Throws an EthersError with %%message%%, %%code%% and additional error
*  %%info%% when %%check%% is falsish..
*
*  @see [[api:makeError]]
*/
function assert(check, message, code, info) {
	if (!check) throw makeError(message, code, info);
}
/**
*  A simple helper to simply ensuring provided arguments match expected
*  constraints, throwing if not.
*
*  In TypeScript environments, the %%check%% has been asserted true, so
*  any further code does not need additional compile-time checks.
*/
function assertArgument(check, message, name, value) {
	assert(check, message, "INVALID_ARGUMENT", {
		argument: name,
		value
	});
}
function assertArgumentCount(count, expectedCount, message) {
	if (message == null) message = "";
	if (message) message = ": " + message;
	assert(count >= expectedCount, "missing argument" + message, "MISSING_ARGUMENT", {
		count,
		expectedCount
	});
	assert(count <= expectedCount, "too many arguments" + message, "UNEXPECTED_ARGUMENT", {
		count,
		expectedCount
	});
}
var _normalizeForms = [
	"NFD",
	"NFC",
	"NFKD",
	"NFKC"
].reduce((accum, form) => {
	try {
		/* c8 ignore start */
		if ("test".normalize(form) !== "test") throw new Error("bad");
		/* c8 ignore stop */
		if (form === "NFD") {
			/* c8 ignore start */
			if (String.fromCharCode(233).normalize("NFD") !== String.fromCharCode(101, 769)) throw new Error("broken");
		}
		accum.push(form);
	} catch (error) {}
	return accum;
}, []);
/**
*  Throws if the normalization %%form%% is not supported.
*/
function assertNormalize(form) {
	assert(_normalizeForms.indexOf(form) >= 0, "platform missing String.prototype.normalize", "UNSUPPORTED_OPERATION", {
		operation: "String.prototype.normalize",
		info: { form }
	});
}
/**
*  Many classes use file-scoped values to guard the constructor,
*  making it effectively private. This facilitates that pattern
*  by ensuring the %%givenGaurd%% matches the file-scoped %%guard%%,
*  throwing if not, indicating the %%className%% if provided.
*/
function assertPrivate(givenGuard, guard, className) {
	if (className == null) className = "";
	if (givenGuard !== guard) {
		let method = className, operation = "new";
		if (className) {
			method += ".";
			operation += " " + className;
		}
		assert(false, `private constructor; use ${method}from* methods`, "UNSUPPORTED_OPERATION", { operation });
	}
}
//#endregion
//#region node_modules/ethers/lib.esm/utils/data.js
/**
*  Some data helpers.
*
*
*  @_subsection api/utils:Data Helpers  [about-data]
*/
function _getBytes(value, name, copy) {
	if (value instanceof Uint8Array) {
		if (copy) return new Uint8Array(value);
		return value;
	}
	if (typeof value === "string" && value.length % 2 === 0 && value.match(/^0x[0-9a-f]*$/i)) {
		const result = new Uint8Array((value.length - 2) / 2);
		let offset = 2;
		for (let i = 0; i < result.length; i++) {
			result[i] = parseInt(value.substring(offset, offset + 2), 16);
			offset += 2;
		}
		return result;
	}
	assertArgument(false, "invalid BytesLike value", name || "value", value);
}
/**
*  Get a typed Uint8Array for %%value%%. If already a Uint8Array
*  the original %%value%% is returned; if a copy is required use
*  [[getBytesCopy]].
*
*  @see: getBytesCopy
*/
function getBytes(value, name) {
	return _getBytes(value, name, false);
}
/**
*  Get a typed Uint8Array for %%value%%, creating a copy if necessary
*  to prevent any modifications of the returned value from being
*  reflected elsewhere.
*
*  @see: getBytes
*/
function getBytesCopy(value, name) {
	return _getBytes(value, name, true);
}
/**
*  Returns true if %%value%% is a valid [[HexString]].
*
*  If %%length%% is ``true`` or a //number//, it also checks that
*  %%value%% is a valid [[DataHexString]] of %%length%% (if a //number//)
*  bytes of data (e.g. ``0x1234`` is 2 bytes).
*/
function isHexString(value, length) {
	if (typeof value !== "string" || !value.match(/^0x[0-9A-Fa-f]*$/)) return false;
	if (typeof length === "number" && value.length !== 2 + 2 * length) return false;
	if (length === true && value.length % 2 !== 0) return false;
	return true;
}
/**
*  Returns true if %%value%% is a valid representation of arbitrary
*  data (i.e. a valid [[DataHexString]] or a Uint8Array).
*/
function isBytesLike(value) {
	return isHexString(value, true) || value instanceof Uint8Array;
}
var HexCharacters = "0123456789abcdef";
/**
*  Returns a [[DataHexString]] representation of %%data%%.
*/
function hexlify(data) {
	const bytes = getBytes(data);
	let result = "0x";
	for (let i = 0; i < bytes.length; i++) {
		const v = bytes[i];
		result += HexCharacters[(v & 240) >> 4] + HexCharacters[v & 15];
	}
	return result;
}
/**
*  Returns a [[DataHexString]] by concatenating all values
*  within %%data%%.
*/
function concat(datas) {
	return "0x" + datas.map((d) => hexlify(d).substring(2)).join("");
}
/**
*  Returns the length of %%data%%, in bytes.
*/
function dataLength(data) {
	if (isHexString(data, true)) return (data.length - 2) / 2;
	return getBytes(data).length;
}
/**
*  Returns a [[DataHexString]] by slicing %%data%% from the %%start%%
*  offset to the %%end%% offset.
*
*  By default %%start%% is 0 and %%end%% is the length of %%data%%.
*/
function dataSlice(data, start, end) {
	const bytes = getBytes(data);
	if (end != null && end > bytes.length) assert(false, "cannot slice beyond data bounds", "BUFFER_OVERRUN", {
		buffer: bytes,
		length: bytes.length,
		offset: end
	});
	return hexlify(bytes.slice(start == null ? 0 : start, end == null ? bytes.length : end));
}
function zeroPad(data, length, left) {
	const bytes = getBytes(data);
	assert(length >= bytes.length, "padding exceeds data length", "BUFFER_OVERRUN", {
		buffer: new Uint8Array(bytes),
		length,
		offset: length + 1
	});
	const result = new Uint8Array(length);
	result.fill(0);
	if (left) result.set(bytes, length - bytes.length);
	else result.set(bytes, 0);
	return hexlify(result);
}
/**
*  Return the [[DataHexString]] of %%data%% padded on the **left**
*  to %%length%% bytes.
*
*  If %%data%% already exceeds %%length%%, a [[BufferOverrunError]] is
*  thrown.
*
*  This pads data the same as **values** are in Solidity
*  (e.g. ``uint128``).
*/
function zeroPadValue(data, length) {
	return zeroPad(data, length, true);
}
/**
*  Return the [[DataHexString]] of %%data%% padded on the **right**
*  to %%length%% bytes.
*
*  If %%data%% already exceeds %%length%%, a [[BufferOverrunError]] is
*  thrown.
*
*  This pads data the same as **bytes** are in Solidity
*  (e.g. ``bytes16``).
*/
function zeroPadBytes(data, length) {
	return zeroPad(data, length, false);
}
//#endregion
//#region node_modules/ethers/lib.esm/utils/maths.js
/**
*  Some mathematic operations.
*
*  @_subsection: api/utils:Math Helpers  [about-maths]
*/
var BN_0$8 = BigInt(0);
var BN_1$3 = BigInt(1);
var maxValue = 9007199254740991;
/**
*  Convert %%value%% from a twos-compliment representation of %%width%%
*  bits to its value.
*
*  If the highest bit is ``1``, the result will be negative.
*/
function fromTwos(_value, _width) {
	const value = getUint(_value, "value");
	const width = BigInt(getNumber(_width, "width"));
	assert(value >> width === BN_0$8, "overflow", "NUMERIC_FAULT", {
		operation: "fromTwos",
		fault: "overflow",
		value: _value
	});
	if (value >> width - BN_1$3) {
		const mask = (BN_1$3 << width) - BN_1$3;
		return -((~value & mask) + BN_1$3);
	}
	return value;
}
/**
*  Convert %%value%% to a twos-compliment representation of
*  %%width%% bits.
*
*  The result will always be positive.
*/
function toTwos(_value, _width) {
	let value = getBigInt(_value, "value");
	const width = BigInt(getNumber(_width, "width"));
	const limit = BN_1$3 << width - BN_1$3;
	if (value < BN_0$8) {
		value = -value;
		assert(value <= limit, "too low", "NUMERIC_FAULT", {
			operation: "toTwos",
			fault: "overflow",
			value: _value
		});
		const mask = (BN_1$3 << width) - BN_1$3;
		return (~value & mask) + BN_1$3;
	} else assert(value < limit, "too high", "NUMERIC_FAULT", {
		operation: "toTwos",
		fault: "overflow",
		value: _value
	});
	return value;
}
/**
*  Mask %%value%% with a bitmask of %%bits%% ones.
*/
function mask(_value, _bits) {
	return getUint(_value, "value") & (BN_1$3 << BigInt(getNumber(_bits, "bits"))) - BN_1$3;
}
/**
*  Gets a BigInt from %%value%%. If it is an invalid value for
*  a BigInt, then an ArgumentError will be thrown for %%name%%.
*/
function getBigInt(value, name) {
	switch (typeof value) {
		case "bigint": return value;
		case "number":
			assertArgument(Number.isInteger(value), "underflow", name || "value", value);
			assertArgument(value >= -9007199254740991 && value <= maxValue, "overflow", name || "value", value);
			return BigInt(value);
		case "string": try {
			if (value === "") throw new Error("empty string");
			if (value[0] === "-" && value[1] !== "-") return -BigInt(value.substring(1));
			return BigInt(value);
		} catch (e) {
			assertArgument(false, `invalid BigNumberish string: ${e.message}`, name || "value", value);
		}
	}
	assertArgument(false, "invalid BigNumberish value", name || "value", value);
}
/**
*  Returns %%value%% as a bigint, validating it is valid as a bigint
*  value and that it is positive.
*/
function getUint(value, name) {
	const result = getBigInt(value, name);
	assert(result >= BN_0$8, "unsigned value cannot be negative", "NUMERIC_FAULT", {
		fault: "overflow",
		operation: "getUint",
		value
	});
	return result;
}
var Nibbles = "0123456789abcdef";
function toBigInt(value) {
	if (value instanceof Uint8Array) {
		let result = "0x0";
		for (const v of value) {
			result += Nibbles[v >> 4];
			result += Nibbles[v & 15];
		}
		return BigInt(result);
	}
	return getBigInt(value);
}
/**
*  Gets a //number// from %%value%%. If it is an invalid value for
*  a //number//, then an ArgumentError will be thrown for %%name%%.
*/
function getNumber(value, name) {
	switch (typeof value) {
		case "bigint":
			assertArgument(value >= -9007199254740991 && value <= maxValue, "overflow", name || "value", value);
			return Number(value);
		case "number":
			assertArgument(Number.isInteger(value), "underflow", name || "value", value);
			assertArgument(value >= -9007199254740991 && value <= maxValue, "overflow", name || "value", value);
			return value;
		case "string": try {
			if (value === "") throw new Error("empty string");
			return getNumber(BigInt(value), name);
		} catch (e) {
			assertArgument(false, `invalid numeric string: ${e.message}`, name || "value", value);
		}
	}
	assertArgument(false, "invalid numeric value", name || "value", value);
}
/**
*  Converts %%value%% to a number. If %%value%% is a Uint8Array, it
*  is treated as Big Endian data. Throws if the value is not safe.
*/
function toNumber(value) {
	return getNumber(toBigInt(value));
}
/**
*  Converts %%value%% to a Big Endian hexstring, optionally padded to
*  %%width%% bytes.
*/
function toBeHex(_value, _width) {
	const value = getUint(_value, "value");
	let result = value.toString(16);
	if (_width == null) {
		if (result.length % 2) result = "0" + result;
	} else {
		const width = getNumber(_width, "width");
		if (width === 0 && value === BN_0$8) return "0x";
		assert(width * 2 >= result.length, `value exceeds width (${width} bytes)`, "NUMERIC_FAULT", {
			operation: "toBeHex",
			fault: "overflow",
			value: _value
		});
		while (result.length < width * 2) result = "0" + result;
	}
	return "0x" + result;
}
/**
*  Converts %%value%% to a Big Endian Uint8Array.
*/
function toBeArray(_value, _width) {
	const value = getUint(_value, "value");
	if (value === BN_0$8) {
		const width = _width != null ? getNumber(_width, "width") : 0;
		return new Uint8Array(width);
	}
	let hex = value.toString(16);
	if (hex.length % 2) hex = "0" + hex;
	if (_width != null) {
		const width = getNumber(_width, "width");
		while (hex.length < width * 2) hex = "00" + hex;
		assert(width * 2 === hex.length, `value exceeds width (${width} bytes)`, "NUMERIC_FAULT", {
			operation: "toBeArray",
			fault: "overflow",
			value: _value
		});
	}
	const result = new Uint8Array(hex.length / 2);
	for (let i = 0; i < result.length; i++) {
		const offset = i * 2;
		result[i] = parseInt(hex.substring(offset, offset + 2), 16);
	}
	return result;
}
/**
*  Returns a [[HexString]] for %%value%% safe to use as a //Quantity//.
*
*  A //Quantity// does not have and leading 0 values unless the value is
*  the literal value `0x0`. This is most commonly used for JSSON-RPC
*  numeric values.
*/
function toQuantity(value) {
	let result = hexlify(isBytesLike(value) ? value : toBeArray(value)).substring(2);
	while (result.startsWith("0")) result = result.substring(1);
	if (result === "") result = "0";
	return "0x" + result;
}
//#endregion
//#region node_modules/ethers/lib.esm/utils/base58.js
/**
*  The [Base58 Encoding](link-base58) scheme allows a **numeric** value
*  to be encoded as a compact string using a radix of 58 using only
*  alpha-numeric characters. Confusingly similar characters are omitted
*  (i.e. ``"l0O"``).
*
*  Note that Base58 encodes a **numeric** value, not arbitrary bytes,
*  since any zero-bytes on the left would get removed. To mitigate this
*  issue most schemes that use Base58 choose specific high-order values
*  to ensure non-zero prefixes.
*
*  @_subsection: api/utils:Base58 Encoding [about-base58]
*/
var Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
var BN_58 = BigInt(58);
/**
*  Encode %%value%% as a Base58-encoded string.
*/
function encodeBase58(_value) {
	const bytes = getBytes(_value);
	let value = toBigInt(bytes);
	let result = "";
	while (value) {
		result = Alphabet[Number(value % BN_58)] + result;
		value /= BN_58;
	}
	for (let i = 0; i < bytes.length; i++) {
		if (bytes[i]) break;
		result = Alphabet[0] + result;
	}
	return result;
}
//#endregion
//#region node_modules/ethers/lib.esm/utils/base64.js
/**
*  [Base64 encoding](link-wiki-base64) using 6-bit words to encode
*  arbitrary bytes into a string using 65 printable symbols, the
*  upper-case and lower-case alphabet, the digits ``0`` through ``9``,
*  ``"+"`` and ``"/"`` with the ``"="`` used for padding.
*
*  @_subsection: api/utils:Base64 Encoding  [about-base64]
*/
/**
*  Decodes the base-64 encoded %%value%%.
*
*  @example:
*    // The decoded value is always binary data...
*    result = decodeBase64("SGVsbG8gV29ybGQhIQ==")
*    //_result:
*
*    // ...use toUtf8String to convert it to a string.
*    toUtf8String(result)
*    //_result:
*
*    // Decoding binary data
*    decodeBase64("EjQ=")
*    //_result:
*/
function decodeBase64(value) {
	return getBytesCopy(Buffer.from(value, "base64"));
}
/**
*  Encodes %%data%% as a base-64 encoded string.
*
*  @example:
*    // Encoding binary data as a hexstring
*    encodeBase64("0x1234")
*    //_result:
*
*    // Encoding binary data as a Uint8Array
*    encodeBase64(new Uint8Array([ 0x12, 0x34 ]))
*    //_result:
*
*    // The input MUST be data...
*    encodeBase64("Hello World!!")
*    //_error:
*
*    // ...use toUtf8Bytes for this.
*    encodeBase64(toUtf8Bytes("Hello World!!"))
*    //_result:
*/
function encodeBase64(data) {
	return Buffer.from(getBytes(data)).toString("base64");
}
//#endregion
//#region node_modules/ethers/lib.esm/utils/events.js
/**
*  Events allow for applications to use the observer pattern, which
*  allows subscribing and publishing events, outside the normal
*  execution paths.
*
*  @_section api/utils/events:Events  [about-events]
*/
/**
*  When an [[EventEmitterable]] triggers a [[Listener]], the
*  callback always ahas one additional argument passed, which is
*  an **EventPayload**.
*/
var EventPayload = class {
	/**
	*  The event filter.
	*/
	filter;
	/**
	*  The **EventEmitterable**.
	*/
	emitter;
	#listener;
	/**
	*  Create a new **EventPayload** for %%emitter%% with
	*  the %%listener%% and for %%filter%%.
	*/
	constructor(emitter, listener, filter) {
		this.#listener = listener;
		defineProperties(this, {
			emitter,
			filter
		});
	}
	/**
	*  Unregister the triggered listener for future events.
	*/
	async removeListener() {
		if (this.#listener == null) return;
		await this.emitter.off(this.filter, this.#listener);
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/utils/utf8.js
/**
*  Using strings in Ethereum (or any security-basd system) requires
*  additional care. These utilities attempt to mitigate some of the
*  safety issues as well as provide the ability to recover and analyse
*  strings.
*
*  @_subsection api/utils:Strings and UTF-8  [about-strings]
*/
function errorFunc(reason, offset, bytes, output, badCodepoint) {
	assertArgument(false, `invalid codepoint at offset ${offset}; ${reason}`, "bytes", bytes);
}
function ignoreFunc(reason, offset, bytes, output, badCodepoint) {
	if (reason === "BAD_PREFIX" || reason === "UNEXPECTED_CONTINUE") {
		let i = 0;
		for (let o = offset + 1; o < bytes.length; o++) {
			if (bytes[o] >> 6 !== 2) break;
			i++;
		}
		return i;
	}
	if (reason === "OVERRUN") return bytes.length - offset - 1;
	return 0;
}
function replaceFunc(reason, offset, bytes, output, badCodepoint) {
	if (reason === "OVERLONG") {
		assertArgument(typeof badCodepoint === "number", "invalid bad code point for replacement", "badCodepoint", badCodepoint);
		output.push(badCodepoint);
		return 0;
	}
	output.push(65533);
	return ignoreFunc(reason, offset, bytes, output, badCodepoint);
}
/**
*  A handful of popular, built-in UTF-8 error handling strategies.
*
*  **``"error"``** - throws on ANY illegal UTF-8 sequence or
*  non-canonical (overlong) codepoints (this is the default)
*
*  **``"ignore"``** - silently drops any illegal UTF-8 sequence
*  and accepts non-canonical (overlong) codepoints
*
*  **``"replace"``** - replace any illegal UTF-8 sequence with the
*  UTF-8 replacement character (i.e. ``"\\ufffd"``) and accepts
*  non-canonical (overlong) codepoints
*
*  @returns: Record<"error" | "ignore" | "replace", Utf8ErrorFunc>
*/
var Utf8ErrorFuncs = Object.freeze({
	error: errorFunc,
	ignore: ignoreFunc,
	replace: replaceFunc
});
function getUtf8CodePoints(_bytes, onError) {
	if (onError == null) onError = Utf8ErrorFuncs.error;
	const bytes = getBytes(_bytes, "bytes");
	const result = [];
	let i = 0;
	while (i < bytes.length) {
		const c = bytes[i++];
		if (c >> 7 === 0) {
			result.push(c);
			continue;
		}
		let extraLength = null;
		let overlongMask = null;
		if ((c & 224) === 192) {
			extraLength = 1;
			overlongMask = 127;
		} else if ((c & 240) === 224) {
			extraLength = 2;
			overlongMask = 2047;
		} else if ((c & 248) === 240) {
			extraLength = 3;
			overlongMask = 65535;
		} else {
			if ((c & 192) === 128) i += onError("UNEXPECTED_CONTINUE", i - 1, bytes, result);
			else i += onError("BAD_PREFIX", i - 1, bytes, result);
			continue;
		}
		if (i - 1 + extraLength >= bytes.length) {
			i += onError("OVERRUN", i - 1, bytes, result);
			continue;
		}
		let res = c & (1 << 8 - extraLength - 1) - 1;
		for (let j = 0; j < extraLength; j++) {
			let nextChar = bytes[i];
			if ((nextChar & 192) != 128) {
				i += onError("MISSING_CONTINUE", i, bytes, result);
				res = null;
				break;
			}
			res = res << 6 | nextChar & 63;
			i++;
		}
		if (res === null) continue;
		if (res > 1114111) {
			i += onError("OUT_OF_RANGE", i - 1 - extraLength, bytes, result, res);
			continue;
		}
		if (res >= 55296 && res <= 57343) {
			i += onError("UTF16_SURROGATE", i - 1 - extraLength, bytes, result, res);
			continue;
		}
		if (res <= overlongMask) {
			i += onError("OVERLONG", i - 1 - extraLength, bytes, result, res);
			continue;
		}
		result.push(res);
	}
	return result;
}
/**
*  Returns the UTF-8 byte representation of %%str%%.
*
*  If %%form%% is specified, the string is normalized.
*/
function toUtf8Bytes(str, form) {
	assertArgument(typeof str === "string", "invalid string value", "str", str);
	if (form != null) {
		assertNormalize(form);
		str = str.normalize(form);
	}
	let result = [];
	for (let i = 0; i < str.length; i++) {
		const c = str.charCodeAt(i);
		if (c < 128) result.push(c);
		else if (c < 2048) {
			result.push(c >> 6 | 192);
			result.push(c & 63 | 128);
		} else if ((c & 64512) == 55296) {
			i++;
			const c2 = str.charCodeAt(i);
			assertArgument(i < str.length && (c2 & 64512) === 56320, "invalid surrogate pair", "str", str);
			const pair = 65536 + ((c & 1023) << 10) + (c2 & 1023);
			result.push(pair >> 18 | 240);
			result.push(pair >> 12 & 63 | 128);
			result.push(pair >> 6 & 63 | 128);
			result.push(pair & 63 | 128);
		} else {
			result.push(c >> 12 | 224);
			result.push(c >> 6 & 63 | 128);
			result.push(c & 63 | 128);
		}
	}
	return new Uint8Array(result);
}
function _toUtf8String(codePoints) {
	return codePoints.map((codePoint) => {
		if (codePoint <= 65535) return String.fromCharCode(codePoint);
		codePoint -= 65536;
		return String.fromCharCode((codePoint >> 10 & 1023) + 55296, (codePoint & 1023) + 56320);
	}).join("");
}
/**
*  Returns the string represented by the UTF-8 data %%bytes%%.
*
*  When %%onError%% function is specified, it is called on UTF-8
*  errors allowing recovery using the [[Utf8ErrorFunc]] API.
*  (default: [error](Utf8ErrorFuncs))
*/
function toUtf8String(bytes, onError) {
	return _toUtf8String(getUtf8CodePoints(bytes, onError));
}
//#endregion
//#region node_modules/ethers/lib.esm/utils/geturl.js
/**
*  @_ignore:
*/
function createGetUrl(options) {
	async function getUrl(req, signal) {
		assert(signal == null || !signal.cancelled, "request cancelled before sending", "CANCELLED");
		const protocol = req.url.split(":")[0].toLowerCase();
		assert(protocol === "http" || protocol === "https", `unsupported protocol ${protocol}`, "UNSUPPORTED_OPERATION", {
			info: { protocol },
			operation: "request"
		});
		assert(protocol === "https" || !req.credentials || req.allowInsecureAuthentication, "insecure authorized connections unsupported", "UNSUPPORTED_OPERATION", { operation: "request" });
		const reqOptions = {
			method: req.method,
			headers: Object.assign({}, req.headers)
		};
		if (options) {
			if (options.agent) reqOptions.agent = options.agent;
		}
		let abort = null;
		try {
			abort = new AbortController();
			reqOptions.abort = abort.signal;
		} catch (e) {
			console.log(e);
		}
		const request = (protocol === "http" ? http : https).request(req.url, reqOptions);
		request.setTimeout(req.timeout);
		const body = req.body;
		if (body) request.write(Buffer.from(body));
		request.end();
		return new Promise((resolve, reject) => {
			if (signal) signal.addListener(() => {
				if (abort) abort.abort();
				reject(makeError("request cancelled", "CANCELLED"));
			});
			request.on("timeout", () => {
				reject(makeError("request timeout", "TIMEOUT"));
			});
			request.once("response", (resp) => {
				const statusCode = resp.statusCode || 0;
				const statusMessage = resp.statusMessage || "";
				const headers = Object.keys(resp.headers || {}).reduce((accum, name) => {
					let value = resp.headers[name] || "";
					if (Array.isArray(value)) value = value.join(", ");
					accum[name] = value;
					return accum;
				}, {});
				let body = null;
				resp.on("data", (chunk) => {
					if (signal) try {
						signal.checkSignal();
					} catch (error) {
						return reject(error);
					}
					if (body == null) body = chunk;
					else {
						const newBody = new Uint8Array(body.length + chunk.length);
						newBody.set(body, 0);
						newBody.set(chunk, body.length);
						body = newBody;
					}
				});
				resp.on("end", () => {
					try {
						if (headers["content-encoding"] === "gzip" && body) body = getBytes(gunzipSync(body));
						resolve({
							statusCode,
							statusMessage,
							headers,
							body
						});
					} catch (error) {
						reject(makeError("bad response data", "SERVER_ERROR", {
							request: req,
							info: {
								response: resp,
								error
							}
						}));
					}
				});
				resp.on("error", (error) => {
					error.response = {
						statusCode,
						statusMessage,
						headers,
						body
					};
					reject(error);
				});
			});
			request.on("error", (error) => {
				reject(error);
			});
		});
	}
	return getUrl;
}
//#endregion
//#region node_modules/ethers/lib.esm/utils/fetch.js
/**
*  Fetching content from the web is environment-specific, so Ethers
*  provides an abstraction that each environment can implement to provide
*  this service.
*
*  On [Node.js](link-node), the ``http`` and ``https`` libs are used to
*  create a request object, register event listeners and process data
*  and populate the [[FetchResponse]].
*
*  In a browser, the [DOM fetch](link-js-fetch) is used, and the resulting
*  ``Promise`` is waited on to retrieve the payload.
*
*  The [[FetchRequest]] is responsible for handling many common situations,
*  such as redirects, server throttling, authentication, etc.
*
*  It also handles common gateways, such as IPFS and data URIs.
*
*  @_section api/utils/fetching:Fetching Web Content  [about-fetch]
*/
var MAX_ATTEMPTS = 12;
var SLOT_INTERVAL = 250;
var defaultGetUrlFunc = createGetUrl();
var reData = /* @__PURE__ */ new RegExp("^data:([^;:]*)?(;base64)?,(.*)$", "i");
var reIpfs = /* @__PURE__ */ new RegExp("^ipfs://(ipfs/)?(.*)$", "i");
var locked$1 = false;
async function dataGatewayFunc(url, signal) {
	try {
		const match = url.match(reData);
		if (!match) throw new Error("invalid data");
		return new FetchResponse(200, "OK", { "content-type": match[1] || "text/plain" }, match[2] ? decodeBase64(match[3]) : unpercent(match[3]));
	} catch (error) {
		return new FetchResponse(599, "BAD REQUEST (invalid data: URI)", {}, null, new FetchRequest(url));
	}
}
/**
*  Returns a [[FetchGatewayFunc]] for fetching content from a standard
*  IPFS gateway hosted at %%baseUrl%%.
*/
function getIpfsGatewayFunc(baseUrl) {
	async function gatewayIpfs(url, signal) {
		try {
			const match = url.match(reIpfs);
			if (!match) throw new Error("invalid link");
			return new FetchRequest(`${baseUrl}${match[2]}`);
		} catch (error) {
			return new FetchResponse(599, "BAD REQUEST (invalid IPFS URI)", {}, null, new FetchRequest(url));
		}
	}
	return gatewayIpfs;
}
var Gateways = {
	"data": dataGatewayFunc,
	"ipfs": getIpfsGatewayFunc("https://gateway.ipfs.io/ipfs/")
};
var fetchSignals = /* @__PURE__ */ new WeakMap();
/**
*  @_ignore
*/
var FetchCancelSignal = class {
	#listeners;
	#cancelled;
	constructor(request) {
		this.#listeners = [];
		this.#cancelled = false;
		fetchSignals.set(request, () => {
			if (this.#cancelled) return;
			this.#cancelled = true;
			for (const listener of this.#listeners) setTimeout(() => {
				listener();
			}, 0);
			this.#listeners = [];
		});
	}
	addListener(listener) {
		assert(!this.#cancelled, "singal already cancelled", "UNSUPPORTED_OPERATION", { operation: "fetchCancelSignal.addCancelListener" });
		this.#listeners.push(listener);
	}
	get cancelled() {
		return this.#cancelled;
	}
	checkSignal() {
		assert(!this.cancelled, "cancelled", "CANCELLED", {});
	}
};
function checkSignal(signal) {
	if (signal == null) throw new Error("missing signal; should not happen");
	signal.checkSignal();
	return signal;
}
/**
*  Represents a request for a resource using a URI.
*
*  By default, the supported schemes are ``HTTP``, ``HTTPS``, ``data:``,
*  and ``IPFS:``.
*
*  Additional schemes can be added globally using [[registerGateway]].
*
*  @example:
*    req = new FetchRequest("https://www.ricmoo.com")
*    resp = await req.send()
*    resp.body.length
*    //_result:
*/
var FetchRequest = class FetchRequest {
	#allowInsecure;
	#gzip;
	#headers;
	#method;
	#timeout;
	#url;
	#body;
	#bodyType;
	#creds;
	#preflight;
	#process;
	#retry;
	#signal;
	#throttle;
	#getUrlFunc;
	/**
	*  The fetch URL to request.
	*/
	get url() {
		return this.#url;
	}
	set url(url) {
		this.#url = String(url);
	}
	/**
	*  The fetch body, if any, to send as the request body. //(default: null)//
	*
	*  When setting a body, the intrinsic ``Content-Type`` is automatically
	*  set and will be used if **not overridden** by setting a custom
	*  header.
	*
	*  If %%body%% is null, the body is cleared (along with the
	*  intrinsic ``Content-Type``).
	*
	*  If %%body%% is a string, the intrinsic ``Content-Type`` is set to
	*  ``text/plain``.
	*
	*  If %%body%% is a Uint8Array, the intrinsic ``Content-Type`` is set to
	*  ``application/octet-stream``.
	*
	*  If %%body%% is any other object, the intrinsic ``Content-Type`` is
	*  set to ``application/json``.
	*/
	get body() {
		if (this.#body == null) return null;
		return new Uint8Array(this.#body);
	}
	set body(body) {
		if (body == null) {
			this.#body = void 0;
			this.#bodyType = void 0;
		} else if (typeof body === "string") {
			this.#body = toUtf8Bytes(body);
			this.#bodyType = "text/plain";
		} else if (body instanceof Uint8Array) {
			this.#body = body;
			this.#bodyType = "application/octet-stream";
		} else if (typeof body === "object") {
			this.#body = toUtf8Bytes(JSON.stringify(body));
			this.#bodyType = "application/json";
		} else throw new Error("invalid body");
	}
	/**
	*  Returns true if the request has a body.
	*/
	hasBody() {
		return this.#body != null;
	}
	/**
	*  The HTTP method to use when requesting the URI. If no method
	*  has been explicitly set, then ``GET`` is used if the body is
	*  null and ``POST`` otherwise.
	*/
	get method() {
		if (this.#method) return this.#method;
		if (this.hasBody()) return "POST";
		return "GET";
	}
	set method(method) {
		if (method == null) method = "";
		this.#method = String(method).toUpperCase();
	}
	/**
	*  The headers that will be used when requesting the URI. All
	*  keys are lower-case.
	*
	*  This object is a copy, so any changes will **NOT** be reflected
	*  in the ``FetchRequest``.
	*
	*  To set a header entry, use the ``setHeader`` method.
	*/
	get headers() {
		const headers = Object.assign({}, this.#headers);
		if (this.#creds) headers["authorization"] = `Basic ${encodeBase64(toUtf8Bytes(this.#creds))}`;
		if (this.allowGzip) headers["accept-encoding"] = "gzip";
		if (headers["content-type"] == null && this.#bodyType) headers["content-type"] = this.#bodyType;
		if (this.body) headers["content-length"] = String(this.body.length);
		return headers;
	}
	/**
	*  Get the header for %%key%%, ignoring case.
	*/
	getHeader(key) {
		return this.headers[key.toLowerCase()];
	}
	/**
	*  Set the header for %%key%% to %%value%%. All values are coerced
	*  to a string.
	*/
	setHeader(key, value) {
		this.#headers[String(key).toLowerCase()] = String(value);
	}
	/**
	*  Clear all headers, resetting all intrinsic headers.
	*/
	clearHeaders() {
		this.#headers = {};
	}
	[Symbol.iterator]() {
		const headers = this.headers;
		const keys = Object.keys(headers);
		let index = 0;
		return { next: () => {
			if (index < keys.length) {
				const key = keys[index++];
				return {
					value: [key, headers[key]],
					done: false
				};
			}
			return {
				value: void 0,
				done: true
			};
		} };
	}
	/**
	*  The value that will be sent for the ``Authorization`` header.
	*
	*  To set the credentials, use the ``setCredentials`` method.
	*/
	get credentials() {
		return this.#creds || null;
	}
	/**
	*  Sets an ``Authorization`` for %%username%% with %%password%%.
	*/
	setCredentials(username, password) {
		assertArgument(!username.match(/:/), "invalid basic authentication username", "username", "[REDACTED]");
		this.#creds = `${username}:${password}`;
	}
	/**
	*  Enable and request gzip-encoded responses. The response will
	*  automatically be decompressed. //(default: true)//
	*/
	get allowGzip() {
		return this.#gzip;
	}
	set allowGzip(value) {
		this.#gzip = !!value;
	}
	/**
	*  Allow ``Authentication`` credentials to be sent over insecure
	*  channels. //(default: false)//
	*/
	get allowInsecureAuthentication() {
		return !!this.#allowInsecure;
	}
	set allowInsecureAuthentication(value) {
		this.#allowInsecure = !!value;
	}
	/**
	*  The timeout (in milliseconds) to wait for a complete response.
	*  //(default: 5 minutes)//
	*/
	get timeout() {
		return this.#timeout;
	}
	set timeout(timeout) {
		assertArgument(timeout >= 0, "timeout must be non-zero", "timeout", timeout);
		this.#timeout = timeout;
	}
	/**
	*  This function is called prior to each request, for example
	*  during a redirection or retry in case of server throttling.
	*
	*  This offers an opportunity to populate headers or update
	*  content before sending a request.
	*/
	get preflightFunc() {
		return this.#preflight || null;
	}
	set preflightFunc(preflight) {
		this.#preflight = preflight;
	}
	/**
	*  This function is called after each response, offering an
	*  opportunity to provide client-level throttling or updating
	*  response data.
	*
	*  Any error thrown in this causes the ``send()`` to throw.
	*
	*  To schedule a retry attempt (assuming the maximum retry limit
	*  has not been reached), use [[response.throwThrottleError]].
	*/
	get processFunc() {
		return this.#process || null;
	}
	set processFunc(process) {
		this.#process = process;
	}
	/**
	*  This function is called on each retry attempt.
	*/
	get retryFunc() {
		return this.#retry || null;
	}
	set retryFunc(retry) {
		this.#retry = retry;
	}
	/**
	*  This function is called to fetch content from HTTP and
	*  HTTPS URLs and is platform specific (e.g. nodejs vs
	*  browsers).
	*
	*  This is by default the currently registered global getUrl
	*  function, which can be changed using [[registerGetUrl]].
	*  If this has been set, setting is to ``null`` will cause
	*  this FetchRequest (and any future clones) to revert back to
	*  using the currently registered global getUrl function.
	*
	*  Setting this is generally not necessary, but may be useful
	*  for developers that wish to intercept requests or to
	*  configurege a proxy or other agent.
	*/
	get getUrlFunc() {
		return this.#getUrlFunc || defaultGetUrlFunc;
	}
	set getUrlFunc(value) {
		this.#getUrlFunc = value;
	}
	/**
	*  Create a new FetchRequest instance with default values.
	*
	*  Once created, each property may be set before issuing a
	*  ``.send()`` to make the request.
	*/
	constructor(url) {
		this.#url = String(url);
		this.#allowInsecure = false;
		this.#gzip = true;
		this.#headers = {};
		this.#method = "";
		this.#timeout = 3e5;
		this.#throttle = {
			slotInterval: SLOT_INTERVAL,
			maxAttempts: MAX_ATTEMPTS
		};
		this.#getUrlFunc = null;
	}
	toString() {
		return `<FetchRequest method=${JSON.stringify(this.method)} url=${JSON.stringify(this.url)} headers=${JSON.stringify(this.headers)} body=${this.#body ? hexlify(this.#body) : "null"}>`;
	}
	/**
	*  Update the throttle parameters used to determine maximum
	*  attempts and exponential-backoff properties.
	*/
	setThrottleParams(params) {
		if (params.slotInterval != null) this.#throttle.slotInterval = params.slotInterval;
		if (params.maxAttempts != null) this.#throttle.maxAttempts = params.maxAttempts;
	}
	async #send(attempt, expires, delay, _request, _response) {
		if (attempt >= this.#throttle.maxAttempts) return _response.makeServerError("exceeded maximum retry limit");
		assert(getTime$1() <= expires, "timeout", "TIMEOUT", {
			operation: "request.send",
			reason: "timeout",
			request: _request
		});
		if (delay > 0) await wait(delay);
		let req = this.clone();
		const scheme = (req.url.split(":")[0] || "").toLowerCase();
		if (scheme in Gateways) {
			const result = await Gateways[scheme](req.url, checkSignal(_request.#signal));
			if (result instanceof FetchResponse) {
				let response = result;
				if (this.processFunc) {
					checkSignal(_request.#signal);
					try {
						response = await this.processFunc(req, response);
					} catch (error) {
						if (error.throttle == null || typeof error.stall !== "number") response.makeServerError("error in post-processing function", error).assertOk();
					}
				}
				return response;
			}
			req = result;
		}
		if (this.preflightFunc) req = await this.preflightFunc(req);
		const resp = await this.getUrlFunc(req, checkSignal(_request.#signal));
		let response = new FetchResponse(resp.statusCode, resp.statusMessage, resp.headers, resp.body, _request);
		if ([
			301,
			302,
			307,
			308
		].indexOf(response.statusCode) >= 0) {
			try {
				const location = response.headers.location || "";
				return req.redirect(location).#send(attempt + 1, expires, 0, _request, response);
			} catch (error) {}
			return response;
		} else if (response.statusCode === 429) {
			if (this.retryFunc == null || await this.retryFunc(req, response, attempt)) {
				const retryAfter = response.headers["retry-after"];
				let delay = this.#throttle.slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
				if (typeof retryAfter === "string" && retryAfter.match(/^[1-9][0-9]*$/)) delay = parseInt(retryAfter);
				return req.clone().#send(attempt + 1, expires, delay, _request, response);
			}
		}
		if (this.processFunc) {
			checkSignal(_request.#signal);
			try {
				response = await this.processFunc(req, response);
			} catch (error) {
				if (error.throttle == null || typeof error.stall !== "number") response.makeServerError("error in post-processing function", error).assertOk();
				let delay = this.#throttle.slotInterval * Math.trunc(Math.random() * Math.pow(2, attempt));
				if (error.stall >= 0) delay = error.stall;
				return req.clone().#send(attempt + 1, expires, delay, _request, response);
			}
		}
		return response;
	}
	/**
	*  Resolves to the response by sending the request.
	*/
	send() {
		assert(this.#signal == null, "request already sent", "UNSUPPORTED_OPERATION", { operation: "fetchRequest.send" });
		this.#signal = new FetchCancelSignal(this);
		return this.#send(0, getTime$1() + this.timeout, 0, this, new FetchResponse(0, "", {}, null, this));
	}
	/**
	*  Cancels the inflight response, causing a ``CANCELLED``
	*  error to be rejected from the [[send]].
	*/
	cancel() {
		assert(this.#signal != null, "request has not been sent", "UNSUPPORTED_OPERATION", { operation: "fetchRequest.cancel" });
		const signal = fetchSignals.get(this);
		if (!signal) throw new Error("missing signal; should not happen");
		signal();
	}
	/**
	*  Returns a new [[FetchRequest]] that represents the redirection
	*  to %%location%%.
	*/
	redirect(location) {
		const current = this.url.split(":")[0].toLowerCase();
		const target = location.split(":")[0].toLowerCase();
		assert((current !== "https" || target !== "http") && location.match(/^https?:/), `unsupported redirect`, "UNSUPPORTED_OPERATION", { operation: `redirect(${this.method} ${JSON.stringify(this.url)} => ${JSON.stringify(location)})` });
		const req = new FetchRequest(location);
		req.method = this.method;
		req.allowGzip = this.allowGzip;
		req.timeout = this.timeout;
		req.#headers = Object.assign({}, this.#headers);
		if (this.#body) req.#body = new Uint8Array(this.#body);
		req.#bodyType = this.#bodyType;
		return req;
	}
	/**
	*  Create a new copy of this request.
	*/
	clone() {
		const clone = new FetchRequest(this.url);
		clone.#method = this.#method;
		if (this.#body) clone.#body = this.#body;
		clone.#bodyType = this.#bodyType;
		clone.#headers = Object.assign({}, this.#headers);
		clone.#creds = this.#creds;
		if (this.allowGzip) clone.allowGzip = true;
		clone.timeout = this.timeout;
		if (this.allowInsecureAuthentication) clone.allowInsecureAuthentication = true;
		clone.#preflight = this.#preflight;
		clone.#process = this.#process;
		clone.#retry = this.#retry;
		clone.#throttle = Object.assign({}, this.#throttle);
		clone.#getUrlFunc = this.#getUrlFunc;
		return clone;
	}
	/**
	*  Locks all static configuration for gateways and FetchGetUrlFunc
	*  registration.
	*/
	static lockConfig() {
		locked$1 = true;
	}
	/**
	*  Get the current Gateway function for %%scheme%%.
	*/
	static getGateway(scheme) {
		return Gateways[scheme.toLowerCase()] || null;
	}
	/**
	*  Use the %%func%% when fetching URIs using %%scheme%%.
	*
	*  This method affects all requests globally.
	*
	*  If [[lockConfig]] has been called, no change is made and this
	*  throws.
	*/
	static registerGateway(scheme, func) {
		scheme = scheme.toLowerCase();
		if (scheme === "http" || scheme === "https") throw new Error(`cannot intercept ${scheme}; use registerGetUrl`);
		if (locked$1) throw new Error("gateways locked");
		Gateways[scheme] = func;
	}
	/**
	*  Use %%getUrl%% when fetching URIs over HTTP and HTTPS requests.
	*
	*  This method affects all requests globally.
	*
	*  If [[lockConfig]] has been called, no change is made and this
	*  throws.
	*/
	static registerGetUrl(getUrl) {
		if (locked$1) throw new Error("gateways locked");
		defaultGetUrlFunc = getUrl;
	}
	/**
	*  Creates a getUrl function that fetches content from HTTP and
	*  HTTPS URLs.
	*
	*  The available %%options%% are dependent on the platform
	*  implementation of the default getUrl function.
	*
	*  This is not generally something that is needed, but is useful
	*  when trying to customize simple behaviour when fetching HTTP
	*  content.
	*/
	static createGetUrlFunc(options) {
		return createGetUrl(options);
	}
	/**
	*  Creates a function that can "fetch" data URIs.
	*
	*  Note that this is automatically done internally to support
	*  data URIs, so it is not necessary to register it.
	*
	*  This is not generally something that is needed, but may
	*  be useful in a wrapper to perfom custom data URI functionality.
	*/
	static createDataGateway() {
		return dataGatewayFunc;
	}
	/**
	*  Creates a function that will fetch IPFS (unvalidated) from
	*  a custom gateway baseUrl.
	*
	*  The default IPFS gateway used internally is
	*  ``"https:/\/gateway.ipfs.io/ipfs/"``.
	*/
	static createIpfsGatewayFunc(baseUrl) {
		return getIpfsGatewayFunc(baseUrl);
	}
};
/**
*  The response for a FetchRequest.
*/
var FetchResponse = class FetchResponse {
	#statusCode;
	#statusMessage;
	#headers;
	#body;
	#request;
	#error;
	toString() {
		return `<FetchResponse status=${this.statusCode} body=${this.#body ? hexlify(this.#body) : "null"}>`;
	}
	/**
	*  The response status code.
	*/
	get statusCode() {
		return this.#statusCode;
	}
	/**
	*  The response status message.
	*/
	get statusMessage() {
		return this.#statusMessage;
	}
	/**
	*  The response headers. All keys are lower-case.
	*/
	get headers() {
		return Object.assign({}, this.#headers);
	}
	/**
	*  The response body, or ``null`` if there was no body.
	*/
	get body() {
		return this.#body == null ? null : new Uint8Array(this.#body);
	}
	/**
	*  The response body as a UTF-8 encoded string, or the empty
	*  string (i.e. ``""``) if there was no body.
	*
	*  An error is thrown if the body is invalid UTF-8 data.
	*/
	get bodyText() {
		try {
			return this.#body == null ? "" : toUtf8String(this.#body);
		} catch (error) {
			assert(false, "response body is not valid UTF-8 data", "UNSUPPORTED_OPERATION", {
				operation: "bodyText",
				info: { response: this }
			});
		}
	}
	/**
	*  The response body, decoded as JSON.
	*
	*  An error is thrown if the body is invalid JSON-encoded data
	*  or if there was no body.
	*/
	get bodyJson() {
		try {
			return JSON.parse(this.bodyText);
		} catch (error) {
			assert(false, "response body is not valid JSON", "UNSUPPORTED_OPERATION", {
				operation: "bodyJson",
				info: { response: this }
			});
		}
	}
	[Symbol.iterator]() {
		const headers = this.headers;
		const keys = Object.keys(headers);
		let index = 0;
		return { next: () => {
			if (index < keys.length) {
				const key = keys[index++];
				return {
					value: [key, headers[key]],
					done: false
				};
			}
			return {
				value: void 0,
				done: true
			};
		} };
	}
	constructor(statusCode, statusMessage, headers, body, request) {
		this.#statusCode = statusCode;
		this.#statusMessage = statusMessage;
		this.#headers = Object.keys(headers).reduce((accum, k) => {
			accum[k.toLowerCase()] = String(headers[k]);
			return accum;
		}, {});
		this.#body = body == null ? null : new Uint8Array(body);
		this.#request = request || null;
		this.#error = { message: "" };
	}
	/**
	*  Return a Response with matching headers and body, but with
	*  an error status code (i.e. 599) and %%message%% with an
	*  optional %%error%%.
	*/
	makeServerError(message, error) {
		let statusMessage;
		if (!message) {
			message = `${this.statusCode} ${this.statusMessage}`;
			statusMessage = `CLIENT ESCALATED SERVER ERROR (${message})`;
		} else statusMessage = `CLIENT ESCALATED SERVER ERROR (${this.statusCode} ${this.statusMessage}; ${message})`;
		const response = new FetchResponse(599, statusMessage, this.headers, this.body, this.#request || void 0);
		response.#error = {
			message,
			error
		};
		return response;
	}
	/**
	*  If called within a [request.processFunc](FetchRequest-processFunc)
	*  call, causes the request to retry as if throttled for %%stall%%
	*  milliseconds.
	*/
	throwThrottleError(message, stall) {
		if (stall == null) stall = -1;
		else assertArgument(Number.isInteger(stall) && stall >= 0, "invalid stall timeout", "stall", stall);
		const error = new Error(message || "throttling requests");
		defineProperties(error, {
			stall,
			throttle: true
		});
		throw error;
	}
	/**
	*  Get the header value for %%key%%, ignoring case.
	*/
	getHeader(key) {
		return this.headers[key.toLowerCase()];
	}
	/**
	*  Returns true if the response has a body.
	*/
	hasBody() {
		return this.#body != null;
	}
	/**
	*  The request made for this response.
	*/
	get request() {
		return this.#request;
	}
	/**
	*  Returns true if this response was a success statusCode.
	*/
	ok() {
		return this.#error.message === "" && this.statusCode >= 200 && this.statusCode < 300;
	}
	/**
	*  Throws a ``SERVER_ERROR`` if this response is not ok.
	*/
	assertOk() {
		if (this.ok()) return;
		let { message, error } = this.#error;
		if (message === "") message = `server response ${this.statusCode} ${this.statusMessage}`;
		let requestUrl = null;
		if (this.request) requestUrl = this.request.url;
		let responseBody = null;
		try {
			if (this.#body) responseBody = toUtf8String(this.#body);
		} catch (e) {}
		assert(false, message, "SERVER_ERROR", {
			request: this.request || "unknown request",
			response: this,
			error,
			info: {
				requestUrl,
				responseBody,
				responseStatus: `${this.statusCode} ${this.statusMessage}`
			}
		});
	}
};
function getTime$1() {
	return (/* @__PURE__ */ new Date()).getTime();
}
function unpercent(value) {
	return toUtf8Bytes(value.replace(/%([0-9a-f][0-9a-f])/gi, (all, code) => {
		return String.fromCharCode(parseInt(code, 16));
	}));
}
function wait(delay) {
	return new Promise((resolve) => setTimeout(resolve, delay));
}
//#endregion
//#region node_modules/ethers/lib.esm/utils/rlp-decode.js
function hexlifyByte(value) {
	let result = value.toString(16);
	while (result.length < 2) result = "0" + result;
	return "0x" + result;
}
function unarrayifyInteger(data, offset, length) {
	let result = 0;
	for (let i = 0; i < length; i++) result = result * 256 + data[offset + i];
	return result;
}
function _decodeChildren(data, offset, childOffset, length) {
	const result = [];
	while (childOffset < offset + 1 + length) {
		const decoded = _decode(data, childOffset);
		result.push(decoded.result);
		childOffset += decoded.consumed;
		assert(childOffset <= offset + 1 + length, "child data too short", "BUFFER_OVERRUN", {
			buffer: data,
			length,
			offset
		});
	}
	return {
		consumed: 1 + length,
		result
	};
}
function _decode(data, offset) {
	assert(data.length !== 0, "data too short", "BUFFER_OVERRUN", {
		buffer: data,
		length: 0,
		offset: 1
	});
	const checkOffset = (offset) => {
		assert(offset <= data.length, "data short segment too short", "BUFFER_OVERRUN", {
			buffer: data,
			length: data.length,
			offset
		});
	};
	if (data[offset] >= 248) {
		const lengthLength = data[offset] - 247;
		checkOffset(offset + 1 + lengthLength);
		const length = unarrayifyInteger(data, offset + 1, lengthLength);
		checkOffset(offset + 1 + lengthLength + length);
		return _decodeChildren(data, offset, offset + 1 + lengthLength, lengthLength + length);
	} else if (data[offset] >= 192) {
		const length = data[offset] - 192;
		checkOffset(offset + 1 + length);
		return _decodeChildren(data, offset, offset + 1, length);
	} else if (data[offset] >= 184) {
		const lengthLength = data[offset] - 183;
		checkOffset(offset + 1 + lengthLength);
		const length = unarrayifyInteger(data, offset + 1, lengthLength);
		checkOffset(offset + 1 + lengthLength + length);
		const result = hexlify(data.slice(offset + 1 + lengthLength, offset + 1 + lengthLength + length));
		return {
			consumed: 1 + lengthLength + length,
			result
		};
	} else if (data[offset] >= 128) {
		const length = data[offset] - 128;
		checkOffset(offset + 1 + length);
		const result = hexlify(data.slice(offset + 1, offset + 1 + length));
		return {
			consumed: 1 + length,
			result
		};
	}
	return {
		consumed: 1,
		result: hexlifyByte(data[offset])
	};
}
/**
*  Decodes %%data%% into the structured data it represents.
*/
function decodeRlp(_data) {
	const data = getBytes(_data, "data");
	const decoded = _decode(data, 0);
	assertArgument(decoded.consumed === data.length, "unexpected junk after rlp payload", "data", _data);
	return decoded.result;
}
//#endregion
//#region node_modules/ethers/lib.esm/utils/rlp-encode.js
function arrayifyInteger(value) {
	const result = [];
	while (value) {
		result.unshift(value & 255);
		value >>= 8;
	}
	return result;
}
function _encode(object) {
	if (Array.isArray(object)) {
		let payload = [];
		object.forEach(function(child) {
			payload = payload.concat(_encode(child));
		});
		if (payload.length <= 55) {
			payload.unshift(192 + payload.length);
			return payload;
		}
		const length = arrayifyInteger(payload.length);
		length.unshift(247 + length.length);
		return length.concat(payload);
	}
	const data = Array.prototype.slice.call(getBytes(object, "object"));
	if (data.length === 1 && data[0] <= 127) return data;
	else if (data.length <= 55) {
		data.unshift(128 + data.length);
		return data;
	}
	const length = arrayifyInteger(data.length);
	length.unshift(183 + length.length);
	return length.concat(data);
}
var nibbles = "0123456789abcdef";
/**
*  Encodes %%object%% as an RLP-encoded [[DataHexString]].
*/
function encodeRlp(object) {
	let result = "0x";
	for (const v of _encode(object)) {
		result += nibbles[v >> 4];
		result += nibbles[v & 15];
	}
	return result;
}
var Padding = /* @__PURE__ */ new Uint8Array(32);
var passProperties$1 = ["then"];
var _guard$2 = {};
var resultNames = /* @__PURE__ */ new WeakMap();
function getNames(result) {
	return resultNames.get(result);
}
function setNames(result, names) {
	resultNames.set(result, names);
}
function throwError(name, error) {
	const wrapped = /* @__PURE__ */ new Error(`deferred error during ABI decoding triggered accessing ${name}`);
	wrapped.error = error;
	throw wrapped;
}
function toObject(names, items, deep) {
	if (names.indexOf(null) >= 0) return items.map((item, index) => {
		if (item instanceof Result) return toObject(getNames(item), item, deep);
		return item;
	});
	return names.reduce((accum, name, index) => {
		let item = items.getValue(name);
		if (!(name in accum)) {
			if (deep && item instanceof Result) item = toObject(getNames(item), item, deep);
			accum[name] = item;
		}
		return accum;
	}, {});
}
/**
*  A [[Result]] is a sub-class of Array, which allows accessing any
*  of its values either positionally by its index or, if keys are
*  provided by its name.
*
*  @_docloc: api/abi
*/
var Result = class Result extends Array {
	#names;
	/**
	*  @private
	*/
	constructor(...args) {
		const guard = args[0];
		let items = args[1];
		let names = (args[2] || []).slice();
		let wrap = true;
		if (guard !== _guard$2) {
			items = args;
			names = [];
			wrap = false;
		}
		super(items.length);
		items.forEach((item, index) => {
			this[index] = item;
		});
		const nameCounts = names.reduce((accum, name) => {
			if (typeof name === "string") accum.set(name, (accum.get(name) || 0) + 1);
			return accum;
		}, /* @__PURE__ */ new Map());
		setNames(this, Object.freeze(items.map((item, index) => {
			const name = names[index];
			if (name != null && nameCounts.get(name) === 1) return name;
			return null;
		})));
		this.#names = [];
		if (this.#names == null) this.#names;
		if (!wrap) return;
		Object.freeze(this);
		const proxy = new Proxy(this, { get: (target, prop, receiver) => {
			if (typeof prop === "string") {
				if (prop.match(/^[0-9]+$/)) {
					const index = getNumber(prop, "%index");
					if (index < 0 || index >= this.length) throw new RangeError("out of result range");
					const item = target[index];
					if (item instanceof Error) throwError(`index ${index}`, item);
					return item;
				}
				if (passProperties$1.indexOf(prop) >= 0) return Reflect.get(target, prop, receiver);
				const value = target[prop];
				if (value instanceof Function) return function(...args) {
					return value.apply(this === receiver ? target : this, args);
				};
				else if (!(prop in target)) return target.getValue.apply(this === receiver ? target : this, [prop]);
			}
			return Reflect.get(target, prop, receiver);
		} });
		setNames(proxy, getNames(this));
		return proxy;
	}
	/**
	*  Returns the Result as a normal Array. If %%deep%%, any children
	*  which are Result objects are also converted to a normal Array.
	*
	*  This will throw if there are any outstanding deferred
	*  errors.
	*/
	toArray(deep) {
		const result = [];
		this.forEach((item, index) => {
			if (item instanceof Error) throwError(`index ${index}`, item);
			if (deep && item instanceof Result) item = item.toArray(deep);
			result.push(item);
		});
		return result;
	}
	/**
	*  Returns the Result as an Object with each name-value pair. If
	*  %%deep%%, any children which are Result objects are also
	*  converted to an Object.
	*
	*  This will throw if any value is unnamed, or if there are
	*  any outstanding deferred errors.
	*/
	toObject(deep) {
		const names = getNames(this);
		return names.reduce((accum, name, index) => {
			assert(name != null, `value at index ${index} unnamed`, "UNSUPPORTED_OPERATION", { operation: "toObject()" });
			return toObject(names, this, deep);
		}, {});
	}
	/**
	*  @_ignore
	*/
	slice(start, end) {
		if (start == null) start = 0;
		if (start < 0) {
			start += this.length;
			if (start < 0) start = 0;
		}
		if (end == null) end = this.length;
		if (end < 0) {
			end += this.length;
			if (end < 0) end = 0;
		}
		if (end > this.length) end = this.length;
		const _names = getNames(this);
		const result = [], names = [];
		for (let i = start; i < end; i++) {
			result.push(this[i]);
			names.push(_names[i]);
		}
		return new Result(_guard$2, result, names);
	}
	/**
	*  @_ignore
	*/
	filter(callback, thisArg) {
		const _names = getNames(this);
		const result = [], names = [];
		for (let i = 0; i < this.length; i++) {
			const item = this[i];
			if (item instanceof Error) throwError(`index ${i}`, item);
			if (callback.call(thisArg, item, i, this)) {
				result.push(item);
				names.push(_names[i]);
			}
		}
		return new Result(_guard$2, result, names);
	}
	/**
	*  @_ignore
	*/
	map(callback, thisArg) {
		const result = [];
		for (let i = 0; i < this.length; i++) {
			const item = this[i];
			if (item instanceof Error) throwError(`index ${i}`, item);
			result.push(callback.call(thisArg, item, i, this));
		}
		return result;
	}
	/**
	*  Returns the value for %%name%%.
	*
	*  Since it is possible to have a key whose name conflicts with
	*  a method on a [[Result]] or its superclass Array, or any
	*  JavaScript keyword, this ensures all named values are still
	*  accessible by name.
	*/
	getValue(name) {
		const index = getNames(this).indexOf(name);
		if (index === -1) return;
		const value = this[index];
		if (value instanceof Error) throwError(`property ${JSON.stringify(name)}`, value.error);
		return value;
	}
	/**
	*  Creates a new [[Result]] for %%items%% with each entry
	*  also accessible by its corresponding name in %%keys%%.
	*/
	static fromItems(items, keys) {
		return new Result(_guard$2, items, keys);
	}
};
function getValue$1(value) {
	let bytes = toBeArray(value);
	assert(bytes.length <= 32, "value out-of-bounds", "BUFFER_OVERRUN", {
		buffer: bytes,
		length: 32,
		offset: bytes.length
	});
	if (bytes.length !== 32) bytes = getBytesCopy(concat([Padding.slice(bytes.length % 32), bytes]));
	return bytes;
}
/**
*  @_ignore
*/
var Coder = class {
	name;
	type;
	localName;
	dynamic;
	constructor(name, type, localName, dynamic) {
		defineProperties(this, {
			name,
			type,
			localName,
			dynamic
		}, {
			name: "string",
			type: "string",
			localName: "string",
			dynamic: "boolean"
		});
	}
	_throwError(message, value) {
		assertArgument(false, message, this.localName, value);
	}
};
/**
*  @_ignore
*/
var Writer = class {
	#data;
	#dataLength;
	constructor() {
		this.#data = [];
		this.#dataLength = 0;
	}
	get data() {
		return concat(this.#data);
	}
	get length() {
		return this.#dataLength;
	}
	#writeData(data) {
		this.#data.push(data);
		this.#dataLength += data.length;
		return data.length;
	}
	appendWriter(writer) {
		return this.#writeData(getBytesCopy(writer.data));
	}
	writeBytes(value) {
		let bytes = getBytesCopy(value);
		const paddingOffset = bytes.length % 32;
		if (paddingOffset) bytes = getBytesCopy(concat([bytes, Padding.slice(paddingOffset)]));
		return this.#writeData(bytes);
	}
	writeValue(value) {
		return this.#writeData(getValue$1(value));
	}
	writeUpdatableValue() {
		const offset = this.#data.length;
		this.#data.push(Padding);
		this.#dataLength += 32;
		return (value) => {
			this.#data[offset] = getValue$1(value);
		};
	}
};
/**
*  @_ignore
*/
var Reader = class Reader {
	allowLoose;
	#data;
	#offset;
	#bytesRead;
	#parent;
	#maxInflation;
	constructor(data, allowLoose, maxInflation) {
		defineProperties(this, { allowLoose: !!allowLoose });
		this.#data = getBytesCopy(data);
		this.#bytesRead = 0;
		this.#parent = null;
		this.#maxInflation = maxInflation != null ? maxInflation : 1024;
		this.#offset = 0;
	}
	get data() {
		return hexlify(this.#data);
	}
	get dataLength() {
		return this.#data.length;
	}
	get consumed() {
		return this.#offset;
	}
	get bytes() {
		return new Uint8Array(this.#data);
	}
	#incrementBytesRead(count) {
		if (this.#parent) return this.#parent.#incrementBytesRead(count);
		this.#bytesRead += count;
		assert(this.#maxInflation < 1 || this.#bytesRead <= this.#maxInflation * this.dataLength, `compressed ABI data exceeds inflation ratio of ${this.#maxInflation} ( see: https:/\/github.com/ethers-io/ethers.js/issues/4537 )`, "BUFFER_OVERRUN", {
			buffer: getBytesCopy(this.#data),
			offset: this.#offset,
			length: count,
			info: {
				bytesRead: this.#bytesRead,
				dataLength: this.dataLength
			}
		});
	}
	#peekBytes(offset, length, loose) {
		let alignedLength = Math.ceil(length / 32) * 32;
		if (this.#offset + alignedLength > this.#data.length) {
			if (this.allowLoose && loose && this.#offset + length <= this.#data.length) alignedLength = length;
			else assert(false, "data out-of-bounds", "BUFFER_OVERRUN", {
				buffer: getBytesCopy(this.#data),
				length: this.#data.length,
				offset: this.#offset + alignedLength
			});
		}
		return this.#data.slice(this.#offset, this.#offset + alignedLength);
	}
	subReader(offset) {
		const reader = new Reader(this.#data.slice(this.#offset + offset), this.allowLoose, this.#maxInflation);
		reader.#parent = this;
		return reader;
	}
	readBytes(length, loose) {
		let bytes = this.#peekBytes(0, length, !!loose);
		this.#incrementBytesRead(length);
		this.#offset += bytes.length;
		return bytes.slice(0, length);
	}
	readValue() {
		return toBigInt(this.readBytes(32));
	}
	readIndex() {
		return toNumber(this.readBytes(32));
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/crypto/keccak.js
/**
*  Cryptographic hashing functions
*
*  @_subsection: api/crypto:Hash Functions [about-crypto-hashing]
*/
var locked = false;
var _keccak256 = function(data) {
	return keccak_256(data);
};
var __keccak256 = _keccak256;
/**
*  Compute the cryptographic KECCAK256 hash of %%data%%.
*
*  The %%data%% **must** be a data representation, to compute the
*  hash of UTF-8 data use the [[id]] function.
*
*  @returns DataHexstring
*  @example:
*    keccak256("0x")
*    //_result:
*
*    keccak256("0x1337")
*    //_result:
*
*    keccak256(new Uint8Array([ 0x13, 0x37 ]))
*    //_result:
*
*    // Strings are assumed to be DataHexString, otherwise it will
*    // throw. To hash UTF-8 data, see the note above.
*    keccak256("Hello World")
*    //_error:
*/
function keccak256(_data) {
	const data = getBytes(_data, "data");
	return hexlify(__keccak256(data));
}
keccak256._ = _keccak256;
keccak256.lock = function() {
	locked = true;
};
keccak256.register = function(func) {
	if (locked) throw new TypeError("keccak256 is locked");
	__keccak256 = func;
};
Object.freeze(keccak256);
//#endregion
//#region node_modules/ethers/lib.esm/crypto/sha2.js
var _sha256 = function(data) {
	return createHash("sha256").update(data).digest();
};
var _sha512 = function(data) {
	return createHash("sha512").update(data).digest();
};
var __sha256 = _sha256;
var __sha512 = _sha512;
var locked256 = false;
var locked512 = false;
/**
*  Compute the cryptographic SHA2-256 hash of %%data%%.
*
*  @_docloc: api/crypto:Hash Functions
*  @returns DataHexstring
*
*  @example:
*    sha256("0x")
*    //_result:
*
*    sha256("0x1337")
*    //_result:
*
*    sha256(new Uint8Array([ 0x13, 0x37 ]))
*    //_result:
*
*/
function sha256(_data) {
	const data = getBytes(_data, "data");
	return hexlify(__sha256(data));
}
sha256._ = _sha256;
sha256.lock = function() {
	locked256 = true;
};
sha256.register = function(func) {
	if (locked256) throw new Error("sha256 is locked");
	__sha256 = func;
};
Object.freeze(sha256);
/**
*  Compute the cryptographic SHA2-512 hash of %%data%%.
*
*  @_docloc: api/crypto:Hash Functions
*  @returns DataHexstring
*
*  @example:
*    sha512("0x")
*    //_result:
*
*    sha512("0x1337")
*    //_result:
*
*    sha512(new Uint8Array([ 0x13, 0x37 ]))
*    //_result:
*/
function sha512(_data) {
	const data = getBytes(_data, "data");
	return hexlify(__sha512(data));
}
sha512._ = _sha512;
sha512.lock = function() {
	locked512 = true;
};
sha512.register = function(func) {
	if (locked512) throw new Error("sha512 is locked");
	__sha512 = func;
};
Object.freeze(sha256);
//#endregion
//#region node_modules/ethers/lib.esm/constants/addresses.js
/**
*  A constant for the zero address.
*
*  (**i.e.** ``"0x0000000000000000000000000000000000000000"``)
*/
var ZeroAddress = "0x0000000000000000000000000000000000000000";
//#endregion
//#region node_modules/ethers/lib.esm/constants/hashes.js
/**
*  A constant for the zero hash.
*
*  (**i.e.** ``"0x0000000000000000000000000000000000000000000000000000000000000000"``)
*/
var ZeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
//#endregion
//#region node_modules/ethers/lib.esm/crypto/signature.js
var BN_0$7 = BigInt(0);
var BN_1$2 = BigInt(1);
var BN_2$2 = BigInt(2);
var BN_27$1 = BigInt(27);
var BN_28$1 = BigInt(28);
var BN_35$1 = BigInt(35);
var BN_N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
var BN_N_2 = BN_N / BN_2$2;
var inspect$3 = Symbol.for("nodejs.util.inspect.custom");
var _guard$1 = {};
function toUint256(value) {
	return zeroPadValue(toBeArray(value), 32);
}
/**
*  A Signature  @TODO
*
*
*  @_docloc: api/crypto:Signing
*/
var Signature = class Signature {
	#r;
	#s;
	#v;
	#networkV;
	/**
	*  The ``r`` value for a signature.
	*
	*  This represents the ``x`` coordinate of a "reference" or
	*  challenge point, from which the ``y`` can be computed.
	*/
	get r() {
		return this.#r;
	}
	set r(value) {
		assertArgument(dataLength(value) === 32, "invalid r", "value", value);
		this.#r = hexlify(value);
	}
	/**
	*  The ``s`` value for a signature.
	*/
	get s() {
		assertArgument(parseInt(this.#s.substring(0, 3)) < 8, "non-canonical s; use ._s", "s", this.#s);
		return this.#s;
	}
	set s(_value) {
		assertArgument(dataLength(_value) === 32, "invalid s", "value", _value);
		this.#s = hexlify(_value);
	}
	/**
	*  Return the s value, unchecked for EIP-2 compliance.
	*
	*  This should generally not be used and is for situations where
	*  a non-canonical S value might be relevant, such as Frontier blocks
	*  that were mined prior to EIP-2 or invalid Authorization List
	*  signatures.
	*/
	get _s() {
		return this.#s;
	}
	/**
	*  Returns true if the Signature is valid for [[link-eip-2]] signatures.
	*/
	isValid() {
		return BigInt(this.#s) <= BN_N_2;
	}
	/**
	*  The ``v`` value for a signature.
	*
	*  Since a given ``x`` value for ``r`` has two possible values for
	*  its correspondin ``y``, the ``v`` indicates which of the two ``y``
	*  values to use.
	*
	*  It is normalized to the values ``27`` or ``28`` for legacy
	*  purposes.
	*/
	get v() {
		return this.#v;
	}
	set v(value) {
		const v = getNumber(value, "value");
		assertArgument(v === 27 || v === 28, "invalid v", "v", value);
		this.#v = v;
	}
	/**
	*  The EIP-155 ``v`` for legacy transactions. For non-legacy
	*  transactions, this value is ``null``.
	*/
	get networkV() {
		return this.#networkV;
	}
	/**
	*  The chain ID for EIP-155 legacy transactions. For non-legacy
	*  transactions, this value is ``null``.
	*/
	get legacyChainId() {
		const v = this.networkV;
		if (v == null) return null;
		return Signature.getChainId(v);
	}
	/**
	*  The ``yParity`` for the signature.
	*
	*  See ``v`` for more details on how this value is used.
	*/
	get yParity() {
		return this.v === 27 ? 0 : 1;
	}
	/**
	*  The [[link-eip-2098]] compact representation of the ``yParity``
	*  and ``s`` compacted into a single ``bytes32``.
	*/
	get yParityAndS() {
		const yParityAndS = getBytes(this.s);
		if (this.yParity) yParityAndS[0] |= 128;
		return hexlify(yParityAndS);
	}
	/**
	*  The [[link-eip-2098]] compact representation.
	*/
	get compactSerialized() {
		return concat([this.r, this.yParityAndS]);
	}
	/**
	*  The serialized representation.
	*/
	get serialized() {
		return concat([
			this.r,
			this.s,
			this.yParity ? "0x1c" : "0x1b"
		]);
	}
	/**
	*  @private
	*/
	constructor(guard, r, s, v) {
		assertPrivate(guard, _guard$1, "Signature");
		this.#r = r;
		this.#s = s;
		this.#v = v;
		this.#networkV = null;
	}
	/**
	*  Returns the canonical signature.
	*
	*  This is only necessary when dealing with legacy transaction which
	*  did not enforce canonical S values (i.e. [[link-eip-2]]. Most
	*  developers should never require this.
	*/
	getCanonical() {
		if (this.isValid()) return this;
		const s = BN_N - BigInt(this._s);
		const v = 55 - this.v;
		const result = new Signature(_guard$1, this.r, toUint256(s), v);
		if (this.networkV) result.#networkV = this.networkV;
		return result;
	}
	/**
	*  Returns a new identical [[Signature]].
	*/
	clone() {
		const clone = new Signature(_guard$1, this.r, this._s, this.v);
		if (this.networkV) clone.#networkV = this.networkV;
		return clone;
	}
	/**
	*  Returns a representation that is compatible with ``JSON.stringify``.
	*/
	toJSON() {
		const networkV = this.networkV;
		return {
			_type: "signature",
			networkV: networkV != null ? networkV.toString() : null,
			r: this.r,
			s: this._s,
			v: this.v
		};
	}
	[inspect$3]() {
		return this.toString();
	}
	toString() {
		if (this.isValid()) return `Signature { r: ${this.r}, s: ${this._s}, v: ${this.v} }`;
		return `Signature { r: ${this.r}, s: ${this._s}, v: ${this.v}, valid: false }`;
	}
	/**
	*  Compute the chain ID from the ``v`` in a legacy EIP-155 transactions.
	*
	*  @example:
	*    Signature.getChainId(45)
	*    //_result:
	*
	*    Signature.getChainId(46)
	*    //_result:
	*/
	static getChainId(v) {
		const bv = getBigInt(v, "v");
		if (bv == BN_27$1 || bv == BN_28$1) return BN_0$7;
		assertArgument(bv >= BN_35$1, "invalid EIP-155 v", "v", v);
		return (bv - BN_35$1) / BN_2$2;
	}
	/**
	*  Compute the ``v`` for a chain ID for a legacy EIP-155 transactions.
	*
	*  Legacy transactions which use [[link-eip-155]] hijack the ``v``
	*  property to include the chain ID.
	*
	*  @example:
	*    Signature.getChainIdV(5, 27)
	*    //_result:
	*
	*    Signature.getChainIdV(5, 28)
	*    //_result:
	*
	*/
	static getChainIdV(chainId, v) {
		return getBigInt(chainId) * BN_2$2 + BigInt(35 + v - 27);
	}
	/**
	*  Compute the normalized legacy transaction ``v`` from a ``yParirty``,
	*  a legacy transaction ``v`` or a legacy [[link-eip-155]] transaction.
	*
	*  @example:
	*    // The values 0 and 1 imply v is actually yParity
	*    Signature.getNormalizedV(0)
	*    //_result:
	*
	*    // Legacy non-EIP-1559 transaction (i.e. 27 or 28)
	*    Signature.getNormalizedV(27)
	*    //_result:
	*
	*    // Legacy EIP-155 transaction (i.e. >= 35)
	*    Signature.getNormalizedV(46)
	*    //_result:
	*
	*    // Invalid values throw
	*    Signature.getNormalizedV(5)
	*    //_error:
	*/
	static getNormalizedV(v) {
		const bv = getBigInt(v);
		if (bv === BN_0$7 || bv === BN_27$1) return 27;
		if (bv === BN_1$2 || bv === BN_28$1) return 28;
		assertArgument(bv >= BN_35$1, "invalid v", "v", v);
		return bv & BN_1$2 ? 27 : 28;
	}
	/**
	*  Creates a new [[Signature]].
	*
	*  If no %%sig%% is provided, a new [[Signature]] is created
	*  with default values.
	*
	*  If %%sig%% is a string, it is parsed.
	*/
	static from(sig) {
		function assertError(check, message) {
			assertArgument(check, message, "signature", sig);
		}
		if (sig == null) return new Signature(_guard$1, ZeroHash, ZeroHash, 27);
		if (typeof sig === "string") {
			const bytes = getBytes(sig, "signature");
			if (bytes.length === 64) {
				const r = hexlify(bytes.slice(0, 32));
				const s = bytes.slice(32, 64);
				const v = s[0] & 128 ? 28 : 27;
				s[0] &= 127;
				return new Signature(_guard$1, r, hexlify(s), v);
			}
			if (bytes.length === 65) {
				const r = hexlify(bytes.slice(0, 32));
				const s = hexlify(bytes.slice(32, 64));
				const v = Signature.getNormalizedV(bytes[64]);
				return new Signature(_guard$1, r, s, v);
			}
			assertError(false, "invalid raw signature length");
		}
		if (sig instanceof Signature) return sig.clone();
		const _r = sig.r;
		assertError(_r != null, "missing r");
		const r = toUint256(_r);
		const s = (function(s, yParityAndS) {
			if (s != null) return toUint256(s);
			if (yParityAndS != null) {
				assertError(isHexString(yParityAndS, 32), "invalid yParityAndS");
				const bytes = getBytes(yParityAndS);
				bytes[0] &= 127;
				return hexlify(bytes);
			}
			assertError(false, "missing s");
		})(sig.s, sig.yParityAndS);
		const { networkV, v } = (function(_v, yParityAndS, yParity) {
			if (_v != null) {
				const v = getBigInt(_v);
				return {
					networkV: v >= BN_35$1 ? v : void 0,
					v: Signature.getNormalizedV(v)
				};
			}
			if (yParityAndS != null) {
				assertError(isHexString(yParityAndS, 32), "invalid yParityAndS");
				return { v: getBytes(yParityAndS)[0] & 128 ? 28 : 27 };
			}
			if (yParity != null) {
				switch (getNumber(yParity, "sig.yParity")) {
					case 0: return { v: 27 };
					case 1: return { v: 28 };
				}
				assertError(false, "invalid yParity");
			}
			assertError(false, "missing v");
		})(sig.v, sig.yParityAndS, sig.yParity);
		const result = new Signature(_guard$1, r, s, v);
		if (networkV) result.#networkV = networkV;
		assertError(sig.yParity == null || getNumber(sig.yParity, "sig.yParity") === result.yParity, "yParity mismatch");
		assertError(sig.yParityAndS == null || sig.yParityAndS === result.yParityAndS, "yParityAndS mismatch");
		return result;
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/crypto/signing-key.js
/**
*  Add details about signing here.
*
*  @_subsection: api/crypto:Signing  [about-signing]
*/
/**
*  A **SigningKey** provides high-level access to the elliptic curve
*  cryptography (ECC) operations and key management.
*/
var SigningKey = class SigningKey {
	#privateKey;
	/**
	*  Creates a new **SigningKey** for %%privateKey%%.
	*/
	constructor(privateKey) {
		assertArgument(dataLength(privateKey) === 32, "invalid private key", "privateKey", "[REDACTED]");
		this.#privateKey = hexlify(privateKey);
	}
	/**
	*  The private key.
	*/
	get privateKey() {
		return this.#privateKey;
	}
	/**
	*  The uncompressed public key.
	*
	* This will always begin with the prefix ``0x04`` and be 132
	* characters long (the ``0x`` prefix and 130 hexadecimal nibbles).
	*/
	get publicKey() {
		return SigningKey.computePublicKey(this.#privateKey);
	}
	/**
	*  The compressed public key.
	*
	*  This will always begin with either the prefix ``0x02`` or ``0x03``
	*  and be 68 characters long (the ``0x`` prefix and 33 hexadecimal
	*  nibbles)
	*/
	get compressedPublicKey() {
		return SigningKey.computePublicKey(this.#privateKey, true);
	}
	/**
	*  Return the signature of the signed %%digest%%.
	*/
	sign(digest) {
		assertArgument(dataLength(digest) === 32, "invalid digest length", "digest", digest);
		const sig = secp256k1.sign(getBytesCopy(digest), getBytesCopy(this.#privateKey), { lowS: true });
		return Signature.from({
			r: toBeHex(sig.r, 32),
			s: toBeHex(sig.s, 32),
			v: sig.recovery ? 28 : 27
		});
	}
	/**
	*  Returns the [[link-wiki-ecdh]] shared secret between this
	*  private key and the %%other%% key.
	*
	*  The %%other%% key may be any type of key, a raw public key,
	*  a compressed/uncompressed pubic key or aprivate key.
	*
	*  Best practice is usually to use a cryptographic hash on the
	*  returned value before using it as a symetric secret.
	*
	*  @example:
	*    sign1 = new SigningKey(id("some-secret-1"))
	*    sign2 = new SigningKey(id("some-secret-2"))
	*
	*    // Notice that privA.computeSharedSecret(pubB)...
	*    sign1.computeSharedSecret(sign2.publicKey)
	*    //_result:
	*
	*    // ...is equal to privB.computeSharedSecret(pubA).
	*    sign2.computeSharedSecret(sign1.publicKey)
	*    //_result:
	*/
	computeSharedSecret(other) {
		const pubKey = SigningKey.computePublicKey(other);
		return hexlify(secp256k1.getSharedSecret(getBytesCopy(this.#privateKey), getBytes(pubKey), false));
	}
	/**
	*  Compute the public key for %%key%%, optionally %%compressed%%.
	*
	*  The %%key%% may be any type of key, a raw public key, a
	*  compressed/uncompressed public key or private key.
	*
	*  @example:
	*    sign = new SigningKey(id("some-secret"));
	*
	*    // Compute the uncompressed public key for a private key
	*    SigningKey.computePublicKey(sign.privateKey)
	*    //_result:
	*
	*    // Compute the compressed public key for a private key
	*    SigningKey.computePublicKey(sign.privateKey, true)
	*    //_result:
	*
	*    // Compute the uncompressed public key
	*    SigningKey.computePublicKey(sign.publicKey, false);
	*    //_result:
	*
	*    // Compute the Compressed a public key
	*    SigningKey.computePublicKey(sign.publicKey, true);
	*    //_result:
	*/
	static computePublicKey(key, compressed) {
		let bytes = getBytes(key, "key");
		if (bytes.length === 32) return hexlify(secp256k1.getPublicKey(bytes, !!compressed));
		if (bytes.length === 64) {
			const pub = /* @__PURE__ */ new Uint8Array(65);
			pub[0] = 4;
			pub.set(bytes, 1);
			bytes = pub;
		}
		return hexlify(secp256k1.ProjectivePoint.fromHex(bytes).toRawBytes(compressed));
	}
	/**
	*  Returns the public key for the private key which produced the
	*  %%signature%% for the given %%digest%%.
	*
	*  @example:
	*    key = new SigningKey(id("some-secret"))
	*    digest = id("hello world")
	*    sig = key.sign(digest)
	*
	*    // Notice the signer public key...
	*    key.publicKey
	*    //_result:
	*
	*    // ...is equal to the recovered public key
	*    SigningKey.recoverPublicKey(digest, sig)
	*    //_result:
	*
	*/
	static recoverPublicKey(digest, signature) {
		assertArgument(dataLength(digest) === 32, "invalid digest length", "digest", digest);
		const sig = Signature.from(signature);
		let secpSig = secp256k1.Signature.fromCompact(getBytesCopy(concat([sig.r, sig.s])));
		secpSig = secpSig.addRecoveryBit(sig.yParity);
		const pubKey = secpSig.recoverPublicKey(getBytesCopy(digest));
		assertArgument(pubKey != null, "invalid signature for digest", "signature", signature);
		return "0x" + pubKey.toHex(false);
	}
	/**
	*  Returns the point resulting from adding the ellipic curve points
	*  %%p0%% and %%p1%%.
	*
	*  This is not a common function most developers should require, but
	*  can be useful for certain privacy-specific techniques.
	*
	*  For example, it is used by [[HDNodeWallet]] to compute child
	*  addresses from parent public keys and chain codes.
	*/
	static addPoints(p0, p1, compressed) {
		const pub0 = secp256k1.ProjectivePoint.fromHex(SigningKey.computePublicKey(p0).substring(2));
		const pub1 = secp256k1.ProjectivePoint.fromHex(SigningKey.computePublicKey(p1).substring(2));
		return "0x" + pub0.add(pub1).toHex(!!compressed);
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/address/address.js
var BN_0$6 = BigInt(0);
var BN_36 = BigInt(36);
function getChecksumAddress(address) {
	address = address.toLowerCase();
	const chars = address.substring(2).split("");
	const expanded = /* @__PURE__ */ new Uint8Array(40);
	for (let i = 0; i < 40; i++) expanded[i] = chars[i].charCodeAt(0);
	const hashed = getBytes(keccak256(expanded));
	for (let i = 0; i < 40; i += 2) {
		if (hashed[i >> 1] >> 4 >= 8) chars[i] = chars[i].toUpperCase();
		if ((hashed[i >> 1] & 15) >= 8) chars[i + 1] = chars[i + 1].toUpperCase();
	}
	return "0x" + chars.join("");
}
var ibanLookup = {};
for (let i = 0; i < 10; i++) ibanLookup[String(i)] = String(i);
for (let i = 0; i < 26; i++) ibanLookup[String.fromCharCode(65 + i)] = String(10 + i);
var safeDigits = 15;
function ibanChecksum(address) {
	address = address.toUpperCase();
	address = address.substring(4) + address.substring(0, 2) + "00";
	let expanded = address.split("").map((c) => {
		return ibanLookup[c];
	}).join("");
	while (expanded.length >= safeDigits) {
		let block = expanded.substring(0, safeDigits);
		expanded = parseInt(block, 10) % 97 + expanded.substring(block.length);
	}
	let checksum = String(98 - parseInt(expanded, 10) % 97);
	while (checksum.length < 2) checksum = "0" + checksum;
	return checksum;
}
var Base36 = (function() {
	const result = {};
	for (let i = 0; i < 36; i++) {
		const key = "0123456789abcdefghijklmnopqrstuvwxyz"[i];
		result[key] = BigInt(i);
	}
	return result;
})();
function fromBase36(value) {
	value = value.toLowerCase();
	let result = BN_0$6;
	for (let i = 0; i < value.length; i++) result = result * BN_36 + Base36[value[i]];
	return result;
}
/**
*  Returns a normalized and checksumed address for %%address%%.
*  This accepts non-checksum addresses, checksum addresses and
*  [[getIcapAddress]] formats.
*
*  The checksum in Ethereum uses the capitalization (upper-case
*  vs lower-case) of the characters within an address to encode
*  its checksum, which offers, on average, a checksum of 15-bits.
*
*  If %%address%% contains both upper-case and lower-case, it is
*  assumed to already be a checksum address and its checksum is
*  validated, and if the address fails its expected checksum an
*  error is thrown.
*
*  If you wish the checksum of %%address%% to be ignore, it should
*  be converted to lower-case (i.e. ``.toLowercase()``) before
*  being passed in. This should be a very rare situation though,
*  that you wish to bypass the safegaurds in place to protect
*  against an address that has been incorrectly copied from another
*  source.
*
*  @example:
*    // Adds the checksum (via upper-casing specific letters)
*    getAddress("0x8ba1f109551bd432803012645ac136ddd64dba72")
*    //_result:
*
*    // Converts ICAP address and adds checksum
*    getAddress("XE65GB6LDNXYOFTX0NSV3FUWKOWIXAMJK36");
*    //_result:
*
*    // Throws an error if an address contains mixed case,
*    // but the checksum fails
*    getAddress("0x8Ba1f109551bD432803012645Ac136ddd64DBA72")
*    //_error:
*/
function getAddress(address) {
	assertArgument(typeof address === "string", "invalid address", "address", address);
	if (address.match(/^(0x)?[0-9a-fA-F]{40}$/)) {
		if (!address.startsWith("0x")) address = "0x" + address;
		const result = getChecksumAddress(address);
		assertArgument(!address.match(/([A-F].*[a-f])|([a-f].*[A-F])/) || result === address, "bad address checksum", "address", address);
		return result;
	}
	if (address.match(/^XE[0-9]{2}[0-9A-Za-z]{30,31}$/)) {
		assertArgument(address.substring(2, 4) === ibanChecksum(address), "bad icap checksum", "address", address);
		let result = fromBase36(address.substring(4)).toString(16);
		while (result.length < 40) result = "0" + result;
		return getChecksumAddress("0x" + result);
	}
	assertArgument(false, "invalid address", "address", address);
}
//#endregion
//#region node_modules/ethers/lib.esm/address/contract-address.js
/**
*  Returns the address that would result from a ``CREATE`` for %%tx%%.
*
*  This can be used to compute the address a contract will be
*  deployed to by an EOA when sending a deployment transaction (i.e.
*  when the ``to`` address is ``null``).
*
*  This can also be used to compute the address a contract will be
*  deployed to by a contract, by using the contract's address as the
*  ``to`` and the contract's nonce.
*
*  @example
*    from = "0x8ba1f109551bD432803012645Ac136ddd64DBA72";
*    nonce = 5;
*
*    getCreateAddress({ from, nonce });
*    //_result:
*/
function getCreateAddress(tx) {
	const from = getAddress(tx.from);
	let nonceHex = getBigInt(tx.nonce, "tx.nonce").toString(16);
	if (nonceHex === "0") nonceHex = "0x";
	else if (nonceHex.length % 2) nonceHex = "0x0" + nonceHex;
	else nonceHex = "0x" + nonceHex;
	return getAddress(dataSlice(keccak256(encodeRlp([from, nonceHex])), 12));
}
//#endregion
//#region node_modules/ethers/lib.esm/address/checks.js
/**
*  Returns true if %%value%% is an object which implements the
*  [[Addressable]] interface.
*
*  @example:
*    // Wallets and AbstractSigner sub-classes
*    isAddressable(Wallet.createRandom())
*    //_result:
*
*    // Contracts
*    contract = new Contract("dai.tokens.ethers.eth", [ ], provider)
*    isAddressable(contract)
*    //_result:
*/
function isAddressable(value) {
	return value && typeof value.getAddress === "function";
}
async function checkAddress(target, promise) {
	const result = await promise;
	if (result == null || result === "0x0000000000000000000000000000000000000000") {
		assert(typeof target !== "string", "unconfigured name", "UNCONFIGURED_NAME", { value: target });
		assertArgument(false, "invalid AddressLike value; did not resolve to a value address", "target", target);
	}
	return getAddress(result);
}
/**
*  Resolves to an address for the %%target%%, which may be any
*  supported address type, an [[Addressable]] or a Promise which
*  resolves to an address.
*
*  If an ENS name is provided, but that name has not been correctly
*  configured a [[UnconfiguredNameError]] is thrown.
*
*  @example:
*    addr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
*
*    // Addresses are return synchronously
*    resolveAddress(addr, provider)
*    //_result:
*
*    // Address promises are resolved asynchronously
*    resolveAddress(Promise.resolve(addr))
*    //_result:
*
*    // ENS names are resolved asynchronously
*    resolveAddress("dai.tokens.ethers.eth", provider)
*    //_result:
*
*    // Addressable objects are resolved asynchronously
*    contract = new Contract(addr, [ ])
*    resolveAddress(contract, provider)
*    //_result:
*
*    // Unconfigured ENS names reject
*    resolveAddress("nothing-here.ricmoo.eth", provider)
*    //_error:
*
*    // ENS names require a NameResolver object passed in
*    // (notice the provider was omitted)
*    resolveAddress("nothing-here.ricmoo.eth")
*    //_error:
*/
function resolveAddress(target, resolver) {
	if (typeof target === "string") {
		if (target.match(/^0x[0-9a-f]{40}$/i)) return getAddress(target);
		assert(resolver != null, "ENS resolution requires a provider", "UNSUPPORTED_OPERATION", { operation: "resolveName" });
		return checkAddress(target, resolver.resolveName(target));
	} else if (isAddressable(target)) return checkAddress(target, target.getAddress());
	else if (target && typeof target.then === "function") return checkAddress(target, target);
	assertArgument(false, "unsupported addressable value", "target", target);
}
//#endregion
//#region node_modules/ethers/lib.esm/abi/typed.js
/**
*  A Typed object allows a value to have its type explicitly
*  specified.
*
*  For example, in Solidity, the value ``45`` could represent a
*  ``uint8`` or a ``uint256``. The value ``0x1234`` could represent
*  a ``bytes2`` or ``bytes``.
*
*  Since JavaScript has no meaningful way to explicitly inform any
*  APIs which what the type is, this allows transparent interoperation
*  with Soldity.
*
*  @_subsection: api/abi:Typed Values
*/
var _gaurd = {};
function n(value, width) {
	let signed = false;
	if (width < 0) {
		signed = true;
		width *= -1;
	}
	return new Typed(_gaurd, `${signed ? "" : "u"}int${width}`, value, {
		signed,
		width
	});
}
function b(value, size) {
	return new Typed(_gaurd, `bytes${size ? size : ""}`, value, { size });
}
var _typedSymbol = Symbol.for("_ethers_typed");
/**
*  The **Typed** class to wrap values providing explicit type information.
*/
var Typed = class Typed {
	/**
	*  The type, as a Solidity-compatible type.
	*/
	type;
	/**
	*  The actual value.
	*/
	value;
	#options;
	/**
	*  @_ignore:
	*/
	_typedSymbol;
	/**
	*  @_ignore:
	*/
	constructor(gaurd, type, value, options) {
		if (options == null) options = null;
		assertPrivate(_gaurd, gaurd, "Typed");
		defineProperties(this, {
			_typedSymbol,
			type,
			value
		});
		this.#options = options;
		this.format();
	}
	/**
	*  Format the type as a Human-Readable type.
	*/
	format() {
		if (this.type === "array") throw new Error("");
		else if (this.type === "dynamicArray") throw new Error("");
		else if (this.type === "tuple") return `tuple(${this.value.map((v) => v.format()).join(",")})`;
		return this.type;
	}
	/**
	*  The default value returned by this type.
	*/
	defaultValue() {
		return 0;
	}
	/**
	*  The minimum value for numeric types.
	*/
	minValue() {
		return 0;
	}
	/**
	*  The maximum value for numeric types.
	*/
	maxValue() {
		return 0;
	}
	/**
	*  Returns ``true`` and provides a type guard is this is a [[TypedBigInt]].
	*/
	isBigInt() {
		return !!this.type.match(/^u?int[0-9]+$/);
	}
	/**
	*  Returns ``true`` and provides a type guard is this is a [[TypedData]].
	*/
	isData() {
		return this.type.startsWith("bytes");
	}
	/**
	*  Returns ``true`` and provides a type guard is this is a [[TypedString]].
	*/
	isString() {
		return this.type === "string";
	}
	/**
	*  Returns the tuple name, if this is a tuple. Throws otherwise.
	*/
	get tupleName() {
		if (this.type !== "tuple") throw TypeError("not a tuple");
		return this.#options;
	}
	/**
	*  Returns the length of the array type or ``-1`` if it is dynamic.
	*
	*  Throws if the type is not an array.
	*/
	get arrayLength() {
		if (this.type !== "array") throw TypeError("not an array");
		if (this.#options === true) return -1;
		if (this.#options === false) return this.value.length;
		return null;
	}
	/**
	*  Returns a new **Typed** of %%type%% with the %%value%%.
	*/
	static from(type, value) {
		return new Typed(_gaurd, type, value);
	}
	/**
	*  Return a new ``uint8`` type for %%v%%.
	*/
	static uint8(v) {
		return n(v, 8);
	}
	/**
	*  Return a new ``uint16`` type for %%v%%.
	*/
	static uint16(v) {
		return n(v, 16);
	}
	/**
	*  Return a new ``uint24`` type for %%v%%.
	*/
	static uint24(v) {
		return n(v, 24);
	}
	/**
	*  Return a new ``uint32`` type for %%v%%.
	*/
	static uint32(v) {
		return n(v, 32);
	}
	/**
	*  Return a new ``uint40`` type for %%v%%.
	*/
	static uint40(v) {
		return n(v, 40);
	}
	/**
	*  Return a new ``uint48`` type for %%v%%.
	*/
	static uint48(v) {
		return n(v, 48);
	}
	/**
	*  Return a new ``uint56`` type for %%v%%.
	*/
	static uint56(v) {
		return n(v, 56);
	}
	/**
	*  Return a new ``uint64`` type for %%v%%.
	*/
	static uint64(v) {
		return n(v, 64);
	}
	/**
	*  Return a new ``uint72`` type for %%v%%.
	*/
	static uint72(v) {
		return n(v, 72);
	}
	/**
	*  Return a new ``uint80`` type for %%v%%.
	*/
	static uint80(v) {
		return n(v, 80);
	}
	/**
	*  Return a new ``uint88`` type for %%v%%.
	*/
	static uint88(v) {
		return n(v, 88);
	}
	/**
	*  Return a new ``uint96`` type for %%v%%.
	*/
	static uint96(v) {
		return n(v, 96);
	}
	/**
	*  Return a new ``uint104`` type for %%v%%.
	*/
	static uint104(v) {
		return n(v, 104);
	}
	/**
	*  Return a new ``uint112`` type for %%v%%.
	*/
	static uint112(v) {
		return n(v, 112);
	}
	/**
	*  Return a new ``uint120`` type for %%v%%.
	*/
	static uint120(v) {
		return n(v, 120);
	}
	/**
	*  Return a new ``uint128`` type for %%v%%.
	*/
	static uint128(v) {
		return n(v, 128);
	}
	/**
	*  Return a new ``uint136`` type for %%v%%.
	*/
	static uint136(v) {
		return n(v, 136);
	}
	/**
	*  Return a new ``uint144`` type for %%v%%.
	*/
	static uint144(v) {
		return n(v, 144);
	}
	/**
	*  Return a new ``uint152`` type for %%v%%.
	*/
	static uint152(v) {
		return n(v, 152);
	}
	/**
	*  Return a new ``uint160`` type for %%v%%.
	*/
	static uint160(v) {
		return n(v, 160);
	}
	/**
	*  Return a new ``uint168`` type for %%v%%.
	*/
	static uint168(v) {
		return n(v, 168);
	}
	/**
	*  Return a new ``uint176`` type for %%v%%.
	*/
	static uint176(v) {
		return n(v, 176);
	}
	/**
	*  Return a new ``uint184`` type for %%v%%.
	*/
	static uint184(v) {
		return n(v, 184);
	}
	/**
	*  Return a new ``uint192`` type for %%v%%.
	*/
	static uint192(v) {
		return n(v, 192);
	}
	/**
	*  Return a new ``uint200`` type for %%v%%.
	*/
	static uint200(v) {
		return n(v, 200);
	}
	/**
	*  Return a new ``uint208`` type for %%v%%.
	*/
	static uint208(v) {
		return n(v, 208);
	}
	/**
	*  Return a new ``uint216`` type for %%v%%.
	*/
	static uint216(v) {
		return n(v, 216);
	}
	/**
	*  Return a new ``uint224`` type for %%v%%.
	*/
	static uint224(v) {
		return n(v, 224);
	}
	/**
	*  Return a new ``uint232`` type for %%v%%.
	*/
	static uint232(v) {
		return n(v, 232);
	}
	/**
	*  Return a new ``uint240`` type for %%v%%.
	*/
	static uint240(v) {
		return n(v, 240);
	}
	/**
	*  Return a new ``uint248`` type for %%v%%.
	*/
	static uint248(v) {
		return n(v, 248);
	}
	/**
	*  Return a new ``uint256`` type for %%v%%.
	*/
	static uint256(v) {
		return n(v, 256);
	}
	/**
	*  Return a new ``uint256`` type for %%v%%.
	*/
	static uint(v) {
		return n(v, 256);
	}
	/**
	*  Return a new ``int8`` type for %%v%%.
	*/
	static int8(v) {
		return n(v, -8);
	}
	/**
	*  Return a new ``int16`` type for %%v%%.
	*/
	static int16(v) {
		return n(v, -16);
	}
	/**
	*  Return a new ``int24`` type for %%v%%.
	*/
	static int24(v) {
		return n(v, -24);
	}
	/**
	*  Return a new ``int32`` type for %%v%%.
	*/
	static int32(v) {
		return n(v, -32);
	}
	/**
	*  Return a new ``int40`` type for %%v%%.
	*/
	static int40(v) {
		return n(v, -40);
	}
	/**
	*  Return a new ``int48`` type for %%v%%.
	*/
	static int48(v) {
		return n(v, -48);
	}
	/**
	*  Return a new ``int56`` type for %%v%%.
	*/
	static int56(v) {
		return n(v, -56);
	}
	/**
	*  Return a new ``int64`` type for %%v%%.
	*/
	static int64(v) {
		return n(v, -64);
	}
	/**
	*  Return a new ``int72`` type for %%v%%.
	*/
	static int72(v) {
		return n(v, -72);
	}
	/**
	*  Return a new ``int80`` type for %%v%%.
	*/
	static int80(v) {
		return n(v, -80);
	}
	/**
	*  Return a new ``int88`` type for %%v%%.
	*/
	static int88(v) {
		return n(v, -88);
	}
	/**
	*  Return a new ``int96`` type for %%v%%.
	*/
	static int96(v) {
		return n(v, -96);
	}
	/**
	*  Return a new ``int104`` type for %%v%%.
	*/
	static int104(v) {
		return n(v, -104);
	}
	/**
	*  Return a new ``int112`` type for %%v%%.
	*/
	static int112(v) {
		return n(v, -112);
	}
	/**
	*  Return a new ``int120`` type for %%v%%.
	*/
	static int120(v) {
		return n(v, -120);
	}
	/**
	*  Return a new ``int128`` type for %%v%%.
	*/
	static int128(v) {
		return n(v, -128);
	}
	/**
	*  Return a new ``int136`` type for %%v%%.
	*/
	static int136(v) {
		return n(v, -136);
	}
	/**
	*  Return a new ``int144`` type for %%v%%.
	*/
	static int144(v) {
		return n(v, -144);
	}
	/**
	*  Return a new ``int52`` type for %%v%%.
	*/
	static int152(v) {
		return n(v, -152);
	}
	/**
	*  Return a new ``int160`` type for %%v%%.
	*/
	static int160(v) {
		return n(v, -160);
	}
	/**
	*  Return a new ``int168`` type for %%v%%.
	*/
	static int168(v) {
		return n(v, -168);
	}
	/**
	*  Return a new ``int176`` type for %%v%%.
	*/
	static int176(v) {
		return n(v, -176);
	}
	/**
	*  Return a new ``int184`` type for %%v%%.
	*/
	static int184(v) {
		return n(v, -184);
	}
	/**
	*  Return a new ``int92`` type for %%v%%.
	*/
	static int192(v) {
		return n(v, -192);
	}
	/**
	*  Return a new ``int200`` type for %%v%%.
	*/
	static int200(v) {
		return n(v, -200);
	}
	/**
	*  Return a new ``int208`` type for %%v%%.
	*/
	static int208(v) {
		return n(v, -208);
	}
	/**
	*  Return a new ``int216`` type for %%v%%.
	*/
	static int216(v) {
		return n(v, -216);
	}
	/**
	*  Return a new ``int224`` type for %%v%%.
	*/
	static int224(v) {
		return n(v, -224);
	}
	/**
	*  Return a new ``int232`` type for %%v%%.
	*/
	static int232(v) {
		return n(v, -232);
	}
	/**
	*  Return a new ``int240`` type for %%v%%.
	*/
	static int240(v) {
		return n(v, -240);
	}
	/**
	*  Return a new ``int248`` type for %%v%%.
	*/
	static int248(v) {
		return n(v, -248);
	}
	/**
	*  Return a new ``int256`` type for %%v%%.
	*/
	static int256(v) {
		return n(v, -256);
	}
	/**
	*  Return a new ``int256`` type for %%v%%.
	*/
	static int(v) {
		return n(v, -256);
	}
	/**
	*  Return a new ``bytes1`` type for %%v%%.
	*/
	static bytes1(v) {
		return b(v, 1);
	}
	/**
	*  Return a new ``bytes2`` type for %%v%%.
	*/
	static bytes2(v) {
		return b(v, 2);
	}
	/**
	*  Return a new ``bytes3`` type for %%v%%.
	*/
	static bytes3(v) {
		return b(v, 3);
	}
	/**
	*  Return a new ``bytes4`` type for %%v%%.
	*/
	static bytes4(v) {
		return b(v, 4);
	}
	/**
	*  Return a new ``bytes5`` type for %%v%%.
	*/
	static bytes5(v) {
		return b(v, 5);
	}
	/**
	*  Return a new ``bytes6`` type for %%v%%.
	*/
	static bytes6(v) {
		return b(v, 6);
	}
	/**
	*  Return a new ``bytes7`` type for %%v%%.
	*/
	static bytes7(v) {
		return b(v, 7);
	}
	/**
	*  Return a new ``bytes8`` type for %%v%%.
	*/
	static bytes8(v) {
		return b(v, 8);
	}
	/**
	*  Return a new ``bytes9`` type for %%v%%.
	*/
	static bytes9(v) {
		return b(v, 9);
	}
	/**
	*  Return a new ``bytes10`` type for %%v%%.
	*/
	static bytes10(v) {
		return b(v, 10);
	}
	/**
	*  Return a new ``bytes11`` type for %%v%%.
	*/
	static bytes11(v) {
		return b(v, 11);
	}
	/**
	*  Return a new ``bytes12`` type for %%v%%.
	*/
	static bytes12(v) {
		return b(v, 12);
	}
	/**
	*  Return a new ``bytes13`` type for %%v%%.
	*/
	static bytes13(v) {
		return b(v, 13);
	}
	/**
	*  Return a new ``bytes14`` type for %%v%%.
	*/
	static bytes14(v) {
		return b(v, 14);
	}
	/**
	*  Return a new ``bytes15`` type for %%v%%.
	*/
	static bytes15(v) {
		return b(v, 15);
	}
	/**
	*  Return a new ``bytes16`` type for %%v%%.
	*/
	static bytes16(v) {
		return b(v, 16);
	}
	/**
	*  Return a new ``bytes17`` type for %%v%%.
	*/
	static bytes17(v) {
		return b(v, 17);
	}
	/**
	*  Return a new ``bytes18`` type for %%v%%.
	*/
	static bytes18(v) {
		return b(v, 18);
	}
	/**
	*  Return a new ``bytes19`` type for %%v%%.
	*/
	static bytes19(v) {
		return b(v, 19);
	}
	/**
	*  Return a new ``bytes20`` type for %%v%%.
	*/
	static bytes20(v) {
		return b(v, 20);
	}
	/**
	*  Return a new ``bytes21`` type for %%v%%.
	*/
	static bytes21(v) {
		return b(v, 21);
	}
	/**
	*  Return a new ``bytes22`` type for %%v%%.
	*/
	static bytes22(v) {
		return b(v, 22);
	}
	/**
	*  Return a new ``bytes23`` type for %%v%%.
	*/
	static bytes23(v) {
		return b(v, 23);
	}
	/**
	*  Return a new ``bytes24`` type for %%v%%.
	*/
	static bytes24(v) {
		return b(v, 24);
	}
	/**
	*  Return a new ``bytes25`` type for %%v%%.
	*/
	static bytes25(v) {
		return b(v, 25);
	}
	/**
	*  Return a new ``bytes26`` type for %%v%%.
	*/
	static bytes26(v) {
		return b(v, 26);
	}
	/**
	*  Return a new ``bytes27`` type for %%v%%.
	*/
	static bytes27(v) {
		return b(v, 27);
	}
	/**
	*  Return a new ``bytes28`` type for %%v%%.
	*/
	static bytes28(v) {
		return b(v, 28);
	}
	/**
	*  Return a new ``bytes29`` type for %%v%%.
	*/
	static bytes29(v) {
		return b(v, 29);
	}
	/**
	*  Return a new ``bytes30`` type for %%v%%.
	*/
	static bytes30(v) {
		return b(v, 30);
	}
	/**
	*  Return a new ``bytes31`` type for %%v%%.
	*/
	static bytes31(v) {
		return b(v, 31);
	}
	/**
	*  Return a new ``bytes32`` type for %%v%%.
	*/
	static bytes32(v) {
		return b(v, 32);
	}
	/**
	*  Return a new ``address`` type for %%v%%.
	*/
	static address(v) {
		return new Typed(_gaurd, "address", v);
	}
	/**
	*  Return a new ``bool`` type for %%v%%.
	*/
	static bool(v) {
		return new Typed(_gaurd, "bool", !!v);
	}
	/**
	*  Return a new ``bytes`` type for %%v%%.
	*/
	static bytes(v) {
		return new Typed(_gaurd, "bytes", v);
	}
	/**
	*  Return a new ``string`` type for %%v%%.
	*/
	static string(v) {
		return new Typed(_gaurd, "string", v);
	}
	/**
	*  Return a new ``array`` type for %%v%%, allowing %%dynamic%% length.
	*/
	static array(v, dynamic) {
		throw new Error("not implemented yet");
	}
	/**
	*  Return a new ``tuple`` type for %%v%%, with the optional %%name%%.
	*/
	static tuple(v, name) {
		throw new Error("not implemented yet");
	}
	/**
	*  Return a new ``uint8`` type for %%v%%.
	*/
	static overrides(v) {
		return new Typed(_gaurd, "overrides", Object.assign({}, v));
	}
	/**
	*  Returns true only if %%value%% is a [[Typed]] instance.
	*/
	static isTyped(value) {
		return value && typeof value === "object" && "_typedSymbol" in value && value._typedSymbol === _typedSymbol;
	}
	/**
	*  If the value is a [[Typed]] instance, validates the underlying value
	*  and returns it, otherwise returns value directly.
	*
	*  This is useful for functions that with to accept either a [[Typed]]
	*  object or values.
	*/
	static dereference(value, type) {
		if (Typed.isTyped(value)) {
			if (value.type !== type) throw new Error(`invalid type: expecetd ${type}, got ${value.type}`);
			return value.value;
		}
		return value;
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/coders/address.js
/**
*  @_ignore
*/
var AddressCoder = class extends Coder {
	constructor(localName) {
		super("address", "address", localName, false);
	}
	defaultValue() {
		return "0x0000000000000000000000000000000000000000";
	}
	encode(writer, _value) {
		let value = Typed.dereference(_value, "string");
		try {
			value = getAddress(value);
		} catch (error) {
			return this._throwError(error.message, _value);
		}
		return writer.writeValue(value);
	}
	decode(reader) {
		return getAddress(toBeHex(reader.readValue(), 20));
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/coders/anonymous.js
/**
*  Clones the functionality of an existing Coder, but without a localName
*
*  @_ignore
*/
var AnonymousCoder = class extends Coder {
	coder;
	constructor(coder) {
		super(coder.name, coder.type, "_", coder.dynamic);
		this.coder = coder;
	}
	defaultValue() {
		return this.coder.defaultValue();
	}
	encode(writer, value) {
		return this.coder.encode(writer, value);
	}
	decode(reader) {
		return this.coder.decode(reader);
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/coders/array.js
/**
*  @_ignore
*/
function pack(writer, coders, values) {
	let arrayValues = [];
	if (Array.isArray(values)) arrayValues = values;
	else if (values && typeof values === "object") {
		let unique = {};
		arrayValues = coders.map((coder) => {
			const name = coder.localName;
			assert(name, "cannot encode object for signature with missing names", "INVALID_ARGUMENT", {
				argument: "values",
				info: { coder },
				value: values
			});
			assert(!unique[name], "cannot encode object for signature with duplicate names", "INVALID_ARGUMENT", {
				argument: "values",
				info: { coder },
				value: values
			});
			unique[name] = true;
			return values[name];
		});
	} else assertArgument(false, "invalid tuple value", "tuple", values);
	assertArgument(coders.length === arrayValues.length, "types/value length mismatch", "tuple", values);
	let staticWriter = new Writer();
	let dynamicWriter = new Writer();
	let updateFuncs = [];
	coders.forEach((coder, index) => {
		let value = arrayValues[index];
		if (coder.dynamic) {
			let dynamicOffset = dynamicWriter.length;
			coder.encode(dynamicWriter, value);
			let updateFunc = staticWriter.writeUpdatableValue();
			updateFuncs.push((baseOffset) => {
				updateFunc(baseOffset + dynamicOffset);
			});
		} else coder.encode(staticWriter, value);
	});
	updateFuncs.forEach((func) => {
		func(staticWriter.length);
	});
	let length = writer.appendWriter(staticWriter);
	length += writer.appendWriter(dynamicWriter);
	return length;
}
/**
*  @_ignore
*/
function unpack(reader, coders) {
	let values = [];
	let keys = [];
	let baseReader = reader.subReader(0);
	coders.forEach((coder) => {
		let value = null;
		if (coder.dynamic) {
			let offset = reader.readIndex();
			let offsetReader = baseReader.subReader(offset);
			try {
				value = coder.decode(offsetReader);
			} catch (error) {
				if (isError(error, "BUFFER_OVERRUN")) throw error;
				value = error;
				value.baseType = coder.name;
				value.name = coder.localName;
				value.type = coder.type;
			}
		} else try {
			value = coder.decode(reader);
		} catch (error) {
			if (isError(error, "BUFFER_OVERRUN")) throw error;
			value = error;
			value.baseType = coder.name;
			value.name = coder.localName;
			value.type = coder.type;
		}
		if (value == void 0) throw new Error("investigate");
		values.push(value);
		keys.push(coder.localName || null);
	});
	return Result.fromItems(values, keys);
}
/**
*  @_ignore
*/
var ArrayCoder = class extends Coder {
	coder;
	length;
	constructor(coder, length, localName) {
		const type = coder.type + "[" + (length >= 0 ? length : "") + "]";
		const dynamic = length === -1 || coder.dynamic;
		super("array", type, localName, dynamic);
		defineProperties(this, {
			coder,
			length
		});
	}
	defaultValue() {
		const defaultChild = this.coder.defaultValue();
		const result = [];
		for (let i = 0; i < this.length; i++) result.push(defaultChild);
		return result;
	}
	encode(writer, _value) {
		const value = Typed.dereference(_value, "array");
		if (!Array.isArray(value)) this._throwError("expected array value", value);
		let count = this.length;
		if (count === -1) {
			count = value.length;
			writer.writeValue(value.length);
		}
		assertArgumentCount(value.length, count, "coder array" + (this.localName ? " " + this.localName : ""));
		let coders = [];
		for (let i = 0; i < value.length; i++) coders.push(this.coder);
		return pack(writer, coders, value);
	}
	decode(reader) {
		let count = this.length;
		if (count === -1) {
			count = reader.readIndex();
			assert(count * 32 <= reader.dataLength, "insufficient data length", "BUFFER_OVERRUN", {
				buffer: reader.bytes,
				offset: count * 32,
				length: reader.dataLength
			});
		}
		let coders = [];
		for (let i = 0; i < count; i++) coders.push(new AnonymousCoder(this.coder));
		return unpack(reader, coders);
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/coders/boolean.js
/**
*  @_ignore
*/
var BooleanCoder = class extends Coder {
	constructor(localName) {
		super("bool", "bool", localName, false);
	}
	defaultValue() {
		return false;
	}
	encode(writer, _value) {
		const value = Typed.dereference(_value, "bool");
		return writer.writeValue(value ? 1 : 0);
	}
	decode(reader) {
		return !!reader.readValue();
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/coders/bytes.js
/**
*  @_ignore
*/
var DynamicBytesCoder = class extends Coder {
	constructor(type, localName) {
		super(type, type, localName, true);
	}
	defaultValue() {
		return "0x";
	}
	encode(writer, value) {
		value = getBytesCopy(value);
		let length = writer.writeValue(value.length);
		length += writer.writeBytes(value);
		return length;
	}
	decode(reader) {
		return reader.readBytes(reader.readIndex(), true);
	}
};
/**
*  @_ignore
*/
var BytesCoder = class extends DynamicBytesCoder {
	constructor(localName) {
		super("bytes", localName);
	}
	decode(reader) {
		return hexlify(super.decode(reader));
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/coders/fixed-bytes.js
/**
*  @_ignore
*/
var FixedBytesCoder = class extends Coder {
	size;
	constructor(size, localName) {
		let name = "bytes" + String(size);
		super(name, name, localName, false);
		defineProperties(this, { size }, { size: "number" });
	}
	defaultValue() {
		return "0x0000000000000000000000000000000000000000000000000000000000000000".substring(0, 2 + this.size * 2);
	}
	encode(writer, _value) {
		let data = getBytesCopy(Typed.dereference(_value, this.type));
		if (data.length !== this.size) this._throwError("incorrect data length", _value);
		return writer.writeBytes(data);
	}
	decode(reader) {
		return hexlify(reader.readBytes(this.size));
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/coders/null.js
var Empty = new Uint8Array([]);
/**
*  @_ignore
*/
var NullCoder = class extends Coder {
	constructor(localName) {
		super("null", "", localName, false);
	}
	defaultValue() {
		return null;
	}
	encode(writer, value) {
		if (value != null) this._throwError("not null", value);
		return writer.writeBytes(Empty);
	}
	decode(reader) {
		reader.readBytes(0);
		return null;
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/coders/number.js
var BN_0$5 = BigInt(0);
var BN_1$1 = BigInt(1);
var BN_MAX_UINT256$1 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
/**
*  @_ignore
*/
var NumberCoder = class extends Coder {
	size;
	signed;
	constructor(size, signed, localName) {
		const name = (signed ? "int" : "uint") + size * 8;
		super(name, name, localName, false);
		defineProperties(this, {
			size,
			signed
		}, {
			size: "number",
			signed: "boolean"
		});
	}
	defaultValue() {
		return 0;
	}
	encode(writer, _value) {
		let value = getBigInt(Typed.dereference(_value, this.type));
		let maxUintValue = mask(BN_MAX_UINT256$1, 256);
		if (this.signed) {
			let bounds = mask(maxUintValue, this.size * 8 - 1);
			if (value > bounds || value < -(bounds + BN_1$1)) this._throwError("value out-of-bounds", _value);
			value = toTwos(value, 256);
		} else if (value < BN_0$5 || value > mask(maxUintValue, this.size * 8)) this._throwError("value out-of-bounds", _value);
		return writer.writeValue(value);
	}
	decode(reader) {
		let value = mask(reader.readValue(), this.size * 8);
		if (this.signed) value = fromTwos(value, this.size * 8);
		return value;
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/coders/string.js
/**
*  @_ignore
*/
var StringCoder = class extends DynamicBytesCoder {
	constructor(localName) {
		super("string", localName);
	}
	defaultValue() {
		return "";
	}
	encode(writer, _value) {
		return super.encode(writer, toUtf8Bytes(Typed.dereference(_value, "string")));
	}
	decode(reader) {
		return toUtf8String(super.decode(reader));
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/coders/tuple.js
/**
*  @_ignore
*/
var TupleCoder = class extends Coder {
	coders;
	constructor(coders, localName) {
		let dynamic = false;
		const types = [];
		coders.forEach((coder) => {
			if (coder.dynamic) dynamic = true;
			types.push(coder.type);
		});
		const type = "tuple(" + types.join(",") + ")";
		super("tuple", type, localName, dynamic);
		defineProperties(this, { coders: Object.freeze(coders.slice()) });
	}
	defaultValue() {
		const values = [];
		this.coders.forEach((coder) => {
			values.push(coder.defaultValue());
		});
		const uniqueNames = this.coders.reduce((accum, coder) => {
			const name = coder.localName;
			if (name) {
				if (!accum[name]) accum[name] = 0;
				accum[name]++;
			}
			return accum;
		}, {});
		this.coders.forEach((coder, index) => {
			let name = coder.localName;
			if (!name || uniqueNames[name] !== 1) return;
			if (name === "length") name = "_length";
			if (values[name] != null) return;
			values[name] = values[index];
		});
		return Object.freeze(values);
	}
	encode(writer, _value) {
		const value = Typed.dereference(_value, "tuple");
		return pack(writer, this.coders, value);
	}
	decode(reader) {
		return unpack(reader, this.coders);
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/transaction/accesslist.js
function accessSetify(addr, storageKeys) {
	return {
		address: getAddress(addr),
		storageKeys: storageKeys.map((storageKey, index) => {
			assertArgument(isHexString(storageKey, 32), "invalid slot", `storageKeys[${index}]`, storageKey);
			return storageKey.toLowerCase();
		})
	};
}
/**
*  Returns a [[AccessList]] from any ethers-supported access-list structure.
*/
function accessListify(value) {
	if (Array.isArray(value)) return value.map((set, index) => {
		if (Array.isArray(set)) {
			assertArgument(set.length === 2, "invalid slot set", `value[${index}]`, set);
			return accessSetify(set[0], set[1]);
		}
		assertArgument(set != null && typeof set === "object", "invalid address-slot set", "value", value);
		return accessSetify(set.address, set.storageKeys);
	});
	assertArgument(value != null && typeof value === "object", "invalid access list", "value", value);
	const result = Object.keys(value).map((addr) => {
		const storageKeys = value[addr].reduce((accum, storageKey) => {
			accum[storageKey] = true;
			return accum;
		}, {});
		return accessSetify(addr, Object.keys(storageKeys).sort());
	});
	result.sort((a, b) => a.address.localeCompare(b.address));
	return result;
}
//#endregion
//#region node_modules/ethers/lib.esm/transaction/authorization.js
function authorizationify(auth) {
	return {
		address: getAddress(auth.address),
		nonce: getBigInt(auth.nonce != null ? auth.nonce : 0),
		chainId: getBigInt(auth.chainId != null ? auth.chainId : 0),
		signature: Signature.from(auth.signature)
	};
}
//#endregion
//#region node_modules/ethers/lib.esm/transaction/address.js
/**
*  Returns the address for the %%key%%.
*
*  The key may be any standard form of public key or a private key.
*/
function computeAddress(key) {
	let pubkey;
	if (typeof key === "string") pubkey = SigningKey.computePublicKey(key, false);
	else pubkey = key.publicKey;
	return getAddress(keccak256("0x" + pubkey.substring(4)).substring(26));
}
/**
*  Returns the recovered address for the private key that was
*  used to sign %%digest%% that resulted in %%signature%%.
*/
function recoverAddress(digest, signature) {
	return computeAddress(SigningKey.recoverPublicKey(digest, signature));
}
//#endregion
//#region node_modules/ethers/lib.esm/transaction/transaction.js
var BN_0$4 = BigInt(0);
var BN_2$1 = BigInt(2);
var BN_27 = BigInt(27);
var BN_28 = BigInt(28);
var BN_35 = BigInt(35);
var BN_MAX_UINT = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
var inspect$2 = Symbol.for("nodejs.util.inspect.custom");
var BLOB_SIZE = 131072;
var CELL_COUNT = 128;
function getKzgLibrary(kzg) {
	const blobToKzgCommitment = (blob) => {
		if ("computeBlobProof" in kzg) {
			if ("blobToKzgCommitment" in kzg && typeof kzg.blobToKzgCommitment === "function") return getBytes(kzg.blobToKzgCommitment(hexlify(blob)));
		} else if ("blobToKzgCommitment" in kzg && typeof kzg.blobToKzgCommitment === "function") return getBytes(kzg.blobToKzgCommitment(blob));
		if ("blobToKZGCommitment" in kzg && typeof kzg.blobToKZGCommitment === "function") return getBytes(kzg.blobToKZGCommitment(hexlify(blob)));
		assertArgument(false, "unsupported KZG library", "kzg", kzg);
	};
	const computeBlobKzgProof = (blob, commitment) => {
		if ("computeBlobProof" in kzg && typeof kzg.computeBlobProof === "function") return getBytes(kzg.computeBlobProof(hexlify(blob), hexlify(commitment)));
		if ("computeBlobKzgProof" in kzg && typeof kzg.computeBlobKzgProof === "function") return kzg.computeBlobKzgProof(blob, commitment);
		if ("computeBlobKZGProof" in kzg && typeof kzg.computeBlobKZGProof === "function") return getBytes(kzg.computeBlobKZGProof(hexlify(blob), hexlify(commitment)));
		assertArgument(false, "unsupported KZG library", "kzg", kzg);
	};
	return {
		blobToKzgCommitment,
		computeBlobKzgProof
	};
}
function getVersionedHash(version, hash) {
	let versioned = version.toString(16);
	while (versioned.length < 2) versioned = "0" + versioned;
	versioned += sha256(hash).substring(4);
	return "0x" + versioned;
}
function handleAddress(value) {
	if (value === "0x") return null;
	return getAddress(value);
}
function handleAccessList(value, param) {
	try {
		return accessListify(value);
	} catch (error) {
		assertArgument(false, error.message, param, value);
	}
}
function handleAuthorizationList(value, param) {
	try {
		if (!Array.isArray(value)) throw new Error("authorizationList: invalid array");
		const result = [];
		for (let i = 0; i < value.length; i++) {
			const auth = value[i];
			if (!Array.isArray(auth)) throw new Error(`authorization[${i}]: invalid array`);
			if (auth.length !== 6) throw new Error(`authorization[${i}]: wrong length`);
			if (!auth[1]) throw new Error(`authorization[${i}]: null address`);
			result.push({
				address: handleAddress(auth[1]),
				nonce: handleUint(auth[2], "nonce"),
				chainId: handleUint(auth[0], "chainId"),
				signature: Signature.from({
					yParity: handleNumber(auth[3], "yParity"),
					r: zeroPadValue(auth[4], 32),
					s: zeroPadValue(auth[5], 32)
				})
			});
		}
		return result;
	} catch (error) {
		assertArgument(false, error.message, param, value);
	}
}
function handleNumber(_value, param) {
	if (_value === "0x") return 0;
	return getNumber(_value, param);
}
function handleUint(_value, param) {
	if (_value === "0x") return BN_0$4;
	const value = getBigInt(_value, param);
	assertArgument(value <= BN_MAX_UINT, "value exceeds uint size", param, value);
	return value;
}
function formatNumber(_value, name) {
	const value = getBigInt(_value, "value");
	const result = toBeArray(value);
	assertArgument(result.length <= 32, `value too large`, `tx.${name}`, value);
	return result;
}
function formatAccessList(value) {
	return accessListify(value).map((set) => [set.address, set.storageKeys]);
}
function formatAuthorizationList(value) {
	return value.map((a) => {
		return [
			formatNumber(a.chainId, "chainId"),
			a.address,
			formatNumber(a.nonce, "nonce"),
			formatNumber(a.signature.yParity, "yParity"),
			toBeArray(a.signature.r),
			toBeArray(a.signature._s)
		];
	});
}
function formatHashes(value, param) {
	assertArgument(Array.isArray(value), `invalid ${param}`, "value", value);
	for (let i = 0; i < value.length; i++) assertArgument(isHexString(value[i], 32), "invalid ${ param } hash", `value[${i}]`, value[i]);
	return value;
}
function _parseLegacy(data) {
	const fields = decodeRlp(data);
	assertArgument(Array.isArray(fields) && (fields.length === 9 || fields.length === 6), "invalid field count for legacy transaction", "data", data);
	const tx = {
		type: 0,
		nonce: handleNumber(fields[0], "nonce"),
		gasPrice: handleUint(fields[1], "gasPrice"),
		gasLimit: handleUint(fields[2], "gasLimit"),
		to: handleAddress(fields[3]),
		value: handleUint(fields[4], "value"),
		data: hexlify(fields[5]),
		chainId: BN_0$4
	};
	if (fields.length === 6) return tx;
	const v = handleUint(fields[6], "v");
	const r = handleUint(fields[7], "r");
	const s = handleUint(fields[8], "s");
	if (r === BN_0$4 && s === BN_0$4) tx.chainId = v;
	else {
		let chainId = (v - BN_35) / BN_2$1;
		if (chainId < BN_0$4) chainId = BN_0$4;
		tx.chainId = chainId;
		assertArgument(chainId !== BN_0$4 || v === BN_27 || v === BN_28, "non-canonical legacy v", "v", fields[6]);
		tx.signature = Signature.from({
			r: zeroPadValue(fields[7], 32),
			s: zeroPadValue(fields[8], 32),
			v
		});
	}
	return tx;
}
function _serializeLegacy(tx, sig) {
	const fields = [
		formatNumber(tx.nonce, "nonce"),
		formatNumber(tx.gasPrice || 0, "gasPrice"),
		formatNumber(tx.gasLimit, "gasLimit"),
		tx.to || "0x",
		formatNumber(tx.value, "value"),
		tx.data
	];
	let chainId = BN_0$4;
	if (tx.chainId != BN_0$4) {
		chainId = getBigInt(tx.chainId, "tx.chainId");
		assertArgument(!sig || sig.networkV == null || sig.legacyChainId === chainId, "tx.chainId/sig.v mismatch", "sig", sig);
	} else if (tx.signature) {
		const legacy = tx.signature.legacyChainId;
		if (legacy != null) chainId = legacy;
	}
	if (!sig) {
		if (chainId !== BN_0$4) {
			fields.push(toBeArray(chainId));
			fields.push("0x");
			fields.push("0x");
		}
		return encodeRlp(fields);
	}
	let v = BigInt(27 + sig.yParity);
	if (chainId !== BN_0$4) v = Signature.getChainIdV(chainId, sig.v);
	else if (BigInt(sig.v) !== v) assertArgument(false, "tx.chainId/sig.v mismatch", "sig", sig);
	fields.push(toBeArray(v));
	fields.push(toBeArray(sig.r));
	fields.push(toBeArray(sig._s));
	return encodeRlp(fields);
}
function _parseEipSignature(tx, fields) {
	let yParity;
	try {
		yParity = handleNumber(fields[0], "yParity");
		if (yParity !== 0 && yParity !== 1) throw new Error("bad yParity");
	} catch (error) {
		assertArgument(false, "invalid yParity", "yParity", fields[0]);
	}
	const r = zeroPadValue(fields[1], 32);
	const s = zeroPadValue(fields[2], 32);
	tx.signature = Signature.from({
		r,
		s,
		yParity
	});
}
function _parseEip1559(data) {
	const fields = decodeRlp(getBytes(data).slice(1));
	assertArgument(Array.isArray(fields) && (fields.length === 9 || fields.length === 12), "invalid field count for transaction type: 2", "data", hexlify(data));
	const tx = {
		type: 2,
		chainId: handleUint(fields[0], "chainId"),
		nonce: handleNumber(fields[1], "nonce"),
		maxPriorityFeePerGas: handleUint(fields[2], "maxPriorityFeePerGas"),
		maxFeePerGas: handleUint(fields[3], "maxFeePerGas"),
		gasPrice: null,
		gasLimit: handleUint(fields[4], "gasLimit"),
		to: handleAddress(fields[5]),
		value: handleUint(fields[6], "value"),
		data: hexlify(fields[7]),
		accessList: handleAccessList(fields[8], "accessList")
	};
	if (fields.length === 9) return tx;
	_parseEipSignature(tx, fields.slice(9));
	return tx;
}
function _serializeEip1559(tx, sig) {
	const fields = [
		formatNumber(tx.chainId, "chainId"),
		formatNumber(tx.nonce, "nonce"),
		formatNumber(tx.maxPriorityFeePerGas || 0, "maxPriorityFeePerGas"),
		formatNumber(tx.maxFeePerGas || 0, "maxFeePerGas"),
		formatNumber(tx.gasLimit, "gasLimit"),
		tx.to || "0x",
		formatNumber(tx.value, "value"),
		tx.data,
		formatAccessList(tx.accessList || [])
	];
	if (sig) {
		fields.push(formatNumber(sig.yParity, "yParity"));
		fields.push(toBeArray(sig.r));
		fields.push(toBeArray(sig.s));
	}
	return concat(["0x02", encodeRlp(fields)]);
}
function _parseEip2930(data) {
	const fields = decodeRlp(getBytes(data).slice(1));
	assertArgument(Array.isArray(fields) && (fields.length === 8 || fields.length === 11), "invalid field count for transaction type: 1", "data", hexlify(data));
	const tx = {
		type: 1,
		chainId: handleUint(fields[0], "chainId"),
		nonce: handleNumber(fields[1], "nonce"),
		gasPrice: handleUint(fields[2], "gasPrice"),
		gasLimit: handleUint(fields[3], "gasLimit"),
		to: handleAddress(fields[4]),
		value: handleUint(fields[5], "value"),
		data: hexlify(fields[6]),
		accessList: handleAccessList(fields[7], "accessList")
	};
	if (fields.length === 8) return tx;
	_parseEipSignature(tx, fields.slice(8));
	return tx;
}
function _serializeEip2930(tx, sig) {
	const fields = [
		formatNumber(tx.chainId, "chainId"),
		formatNumber(tx.nonce, "nonce"),
		formatNumber(tx.gasPrice || 0, "gasPrice"),
		formatNumber(tx.gasLimit, "gasLimit"),
		tx.to || "0x",
		formatNumber(tx.value, "value"),
		tx.data,
		formatAccessList(tx.accessList || [])
	];
	if (sig) {
		fields.push(formatNumber(sig.yParity, "recoveryParam"));
		fields.push(toBeArray(sig.r));
		fields.push(toBeArray(sig.s));
	}
	return concat(["0x01", encodeRlp(fields)]);
}
function _parseEip4844(data) {
	let fields = decodeRlp(getBytes(data).slice(1));
	let typeName = "3";
	let blobWrapperVersion = null;
	let blobs = null;
	if (fields.length === 4 && Array.isArray(fields[0])) {
		typeName = "3 (network format)";
		const fBlobs = fields[1], fCommits = fields[2], fProofs = fields[3];
		assertArgument(Array.isArray(fBlobs), "invalid network format: blobs not an array", "fields[1]", fBlobs);
		assertArgument(Array.isArray(fCommits), "invalid network format: commitments not an array", "fields[2]", fCommits);
		assertArgument(Array.isArray(fProofs), "invalid network format: proofs not an array", "fields[3]", fProofs);
		assertArgument(fBlobs.length === fCommits.length, "invalid network format: blobs/commitments length mismatch", "fields", fields);
		assertArgument(fBlobs.length === fProofs.length, "invalid network format: blobs/proofs length mismatch", "fields", fields);
		blobs = [];
		for (let i = 0; i < fields[1].length; i++) blobs.push({
			data: fBlobs[i],
			commitment: fCommits[i],
			proof: fProofs[i]
		});
		fields = fields[0];
	} else if (fields.length === 5 && Array.isArray(fields[0])) {
		typeName = "3 (EIP-7594 network format)";
		blobWrapperVersion = getNumber(fields[1]);
		const fBlobs = fields[2], fCommits = fields[3], fProofs = fields[4];
		assertArgument(blobWrapperVersion === 1, `unsupported EIP-7594 network format version: ${blobWrapperVersion}`, "fields[1]", blobWrapperVersion);
		assertArgument(Array.isArray(fBlobs), "invalid EIP-7594 network format: blobs not an array", "fields[2]", fBlobs);
		assertArgument(Array.isArray(fCommits), "invalid EIP-7594 network format: commitments not an array", "fields[3]", fCommits);
		assertArgument(Array.isArray(fProofs), "invalid EIP-7594 network format: proofs not an array", "fields[4]", fProofs);
		assertArgument(fBlobs.length === fCommits.length, "invalid network format: blobs/commitments length mismatch", "fields", fields);
		assertArgument(fBlobs.length * CELL_COUNT === fProofs.length, "invalid network format: blobs/proofs length mismatch", "fields", fields);
		blobs = [];
		for (let i = 0; i < fBlobs.length; i++) {
			const proof = [];
			for (let j = 0; j < CELL_COUNT; j++) proof.push(fProofs[i * CELL_COUNT + j]);
			blobs.push({
				data: fBlobs[i],
				commitment: fCommits[i],
				proof: concat(proof)
			});
		}
		fields = fields[0];
	}
	assertArgument(Array.isArray(fields) && (fields.length === 11 || fields.length === 14), `invalid field count for transaction type: ${typeName}`, "data", hexlify(data));
	const tx = {
		type: 3,
		chainId: handleUint(fields[0], "chainId"),
		nonce: handleNumber(fields[1], "nonce"),
		maxPriorityFeePerGas: handleUint(fields[2], "maxPriorityFeePerGas"),
		maxFeePerGas: handleUint(fields[3], "maxFeePerGas"),
		gasPrice: null,
		gasLimit: handleUint(fields[4], "gasLimit"),
		to: handleAddress(fields[5]),
		value: handleUint(fields[6], "value"),
		data: hexlify(fields[7]),
		accessList: handleAccessList(fields[8], "accessList"),
		maxFeePerBlobGas: handleUint(fields[9], "maxFeePerBlobGas"),
		blobVersionedHashes: fields[10],
		blobWrapperVersion
	};
	if (blobs) tx.blobs = blobs;
	assertArgument(tx.to != null, `invalid address for transaction type: ${typeName}`, "data", data);
	assertArgument(Array.isArray(tx.blobVersionedHashes), "invalid blobVersionedHashes: must be an array", "data", data);
	for (let i = 0; i < tx.blobVersionedHashes.length; i++) assertArgument(isHexString(tx.blobVersionedHashes[i], 32), `invalid blobVersionedHash at index ${i}: must be length 32`, "data", data);
	if (fields.length === 11) return tx;
	_parseEipSignature(tx, fields.slice(11));
	return tx;
}
function _serializeEip4844(tx, sig, blobs) {
	const fields = [
		formatNumber(tx.chainId, "chainId"),
		formatNumber(tx.nonce, "nonce"),
		formatNumber(tx.maxPriorityFeePerGas || 0, "maxPriorityFeePerGas"),
		formatNumber(tx.maxFeePerGas || 0, "maxFeePerGas"),
		formatNumber(tx.gasLimit, "gasLimit"),
		tx.to || "0x0000000000000000000000000000000000000000",
		formatNumber(tx.value, "value"),
		tx.data,
		formatAccessList(tx.accessList || []),
		formatNumber(tx.maxFeePerBlobGas || 0, "maxFeePerBlobGas"),
		formatHashes(tx.blobVersionedHashes || [], "blobVersionedHashes")
	];
	if (sig) {
		fields.push(formatNumber(sig.yParity, "yParity"));
		fields.push(toBeArray(sig.r));
		fields.push(toBeArray(sig.s));
		if (blobs) {
			if (tx.blobWrapperVersion != null) {
				const wrapperVersion = toBeArray(tx.blobWrapperVersion);
				const cellProofs = [];
				for (const { proof } of blobs) {
					const p = getBytes(proof);
					const cellSize = p.length / CELL_COUNT;
					for (let i = 0; i < p.length; i += cellSize) cellProofs.push(p.subarray(i, i + cellSize));
				}
				return concat(["0x03", encodeRlp([
					fields,
					wrapperVersion,
					blobs.map((b) => b.data),
					blobs.map((b) => b.commitment),
					cellProofs
				])]);
			}
			return concat(["0x03", encodeRlp([
				fields,
				blobs.map((b) => b.data),
				blobs.map((b) => b.commitment),
				blobs.map((b) => b.proof)
			])]);
		}
	}
	return concat(["0x03", encodeRlp(fields)]);
}
function _parseEip7702(data) {
	const fields = decodeRlp(getBytes(data).slice(1));
	assertArgument(Array.isArray(fields) && (fields.length === 10 || fields.length === 13), "invalid field count for transaction type: 4", "data", hexlify(data));
	const tx = {
		type: 4,
		chainId: handleUint(fields[0], "chainId"),
		nonce: handleNumber(fields[1], "nonce"),
		maxPriorityFeePerGas: handleUint(fields[2], "maxPriorityFeePerGas"),
		maxFeePerGas: handleUint(fields[3], "maxFeePerGas"),
		gasPrice: null,
		gasLimit: handleUint(fields[4], "gasLimit"),
		to: handleAddress(fields[5]),
		value: handleUint(fields[6], "value"),
		data: hexlify(fields[7]),
		accessList: handleAccessList(fields[8], "accessList"),
		authorizationList: handleAuthorizationList(fields[9], "authorizationList")
	};
	if (fields.length === 10) return tx;
	_parseEipSignature(tx, fields.slice(10));
	return tx;
}
function _serializeEip7702(tx, sig) {
	const fields = [
		formatNumber(tx.chainId, "chainId"),
		formatNumber(tx.nonce, "nonce"),
		formatNumber(tx.maxPriorityFeePerGas || 0, "maxPriorityFeePerGas"),
		formatNumber(tx.maxFeePerGas || 0, "maxFeePerGas"),
		formatNumber(tx.gasLimit, "gasLimit"),
		tx.to || "0x",
		formatNumber(tx.value, "value"),
		tx.data,
		formatAccessList(tx.accessList || []),
		formatAuthorizationList(tx.authorizationList || [])
	];
	if (sig) {
		fields.push(formatNumber(sig.yParity, "yParity"));
		fields.push(toBeArray(sig.r));
		fields.push(toBeArray(sig.s));
	}
	return concat(["0x04", encodeRlp(fields)]);
}
/**
*  A **Transaction** describes an operation to be executed on
*  Ethereum by an Externally Owned Account (EOA). It includes
*  who (the [[to]] address), what (the [[data]]) and how much (the
*  [[value]] in ether) the operation should entail.
*
*  @example:
*    tx = new Transaction()
*    //_result:
*
*    tx.data = "0x1234";
*    //_result:
*/
var Transaction = class Transaction {
	#type;
	#to;
	#data;
	#nonce;
	#gasLimit;
	#gasPrice;
	#maxPriorityFeePerGas;
	#maxFeePerGas;
	#value;
	#chainId;
	#sig;
	#accessList;
	#maxFeePerBlobGas;
	#blobVersionedHashes;
	#kzg;
	#blobs;
	#auths;
	#blobWrapperVersion;
	/**
	*  The transaction type.
	*
	*  If null, the type will be automatically inferred based on
	*  explicit properties.
	*/
	get type() {
		return this.#type;
	}
	set type(value) {
		switch (value) {
			case null:
				this.#type = null;
				break;
			case 0:
			case "legacy":
				this.#type = 0;
				break;
			case 1:
			case "berlin":
			case "eip-2930":
				this.#type = 1;
				break;
			case 2:
			case "london":
			case "eip-1559":
				this.#type = 2;
				break;
			case 3:
			case "cancun":
			case "eip-4844":
				this.#type = 3;
				break;
			case 4:
			case "pectra":
			case "eip-7702":
				this.#type = 4;
				break;
			default: assertArgument(false, "unsupported transaction type", "type", value);
		}
	}
	/**
	*  The name of the transaction type.
	*/
	get typeName() {
		switch (this.type) {
			case 0: return "legacy";
			case 1: return "eip-2930";
			case 2: return "eip-1559";
			case 3: return "eip-4844";
			case 4: return "eip-7702";
		}
		return null;
	}
	/**
	*  The ``to`` address for the transaction or ``null`` if the
	*  transaction is an ``init`` transaction.
	*/
	get to() {
		const value = this.#to;
		if (value == null && this.type === 3) return ZeroAddress;
		return value;
	}
	set to(value) {
		this.#to = value == null ? null : getAddress(value);
	}
	/**
	*  The transaction nonce.
	*/
	get nonce() {
		return this.#nonce;
	}
	set nonce(value) {
		this.#nonce = getNumber(value, "value");
	}
	/**
	*  The gas limit.
	*/
	get gasLimit() {
		return this.#gasLimit;
	}
	set gasLimit(value) {
		this.#gasLimit = getBigInt(value);
	}
	/**
	*  The gas price.
	*
	*  On legacy networks this defines the fee that will be paid. On
	*  EIP-1559 networks, this should be ``null``.
	*/
	get gasPrice() {
		const value = this.#gasPrice;
		if (value == null && (this.type === 0 || this.type === 1)) return BN_0$4;
		return value;
	}
	set gasPrice(value) {
		this.#gasPrice = value == null ? null : getBigInt(value, "gasPrice");
	}
	/**
	*  The maximum priority fee per unit of gas to pay. On legacy
	*  networks this should be ``null``.
	*/
	get maxPriorityFeePerGas() {
		const value = this.#maxPriorityFeePerGas;
		if (value == null) {
			if (this.type === 2 || this.type === 3) return BN_0$4;
			return null;
		}
		return value;
	}
	set maxPriorityFeePerGas(value) {
		this.#maxPriorityFeePerGas = value == null ? null : getBigInt(value, "maxPriorityFeePerGas");
	}
	/**
	*  The maximum total fee per unit of gas to pay. On legacy
	*  networks this should be ``null``.
	*/
	get maxFeePerGas() {
		const value = this.#maxFeePerGas;
		if (value == null) {
			if (this.type === 2 || this.type === 3) return BN_0$4;
			return null;
		}
		return value;
	}
	set maxFeePerGas(value) {
		this.#maxFeePerGas = value == null ? null : getBigInt(value, "maxFeePerGas");
	}
	/**
	*  The transaction data. For ``init`` transactions this is the
	*  deployment code.
	*/
	get data() {
		return this.#data;
	}
	set data(value) {
		this.#data = hexlify(value);
	}
	/**
	*  The amount of ether (in wei) to send in this transactions.
	*/
	get value() {
		return this.#value;
	}
	set value(value) {
		this.#value = getBigInt(value, "value");
	}
	/**
	*  The chain ID this transaction is valid on.
	*/
	get chainId() {
		return this.#chainId;
	}
	set chainId(value) {
		this.#chainId = getBigInt(value);
	}
	/**
	*  If signed, the signature for this transaction.
	*/
	get signature() {
		return this.#sig || null;
	}
	set signature(value) {
		this.#sig = value == null ? null : Signature.from(value);
	}
	isValid() {
		const sig = this.signature;
		if (sig && !sig.isValid()) return false;
		const auths = this.authorizationList;
		if (auths) {
			for (const auth of auths) if (!auth.signature.isValid()) return false;
		}
		return true;
	}
	/**
	*  The access list.
	*
	*  An access list permits discounted (but pre-paid) access to
	*  bytecode and state variable access within contract execution.
	*/
	get accessList() {
		const value = this.#accessList || null;
		if (value == null) {
			if (this.type === 1 || this.type === 2 || this.type === 3) return [];
			return null;
		}
		return value;
	}
	set accessList(value) {
		this.#accessList = value == null ? null : accessListify(value);
	}
	get authorizationList() {
		const value = this.#auths || null;
		if (value == null) {
			if (this.type === 4) return [];
		}
		return value;
	}
	set authorizationList(auths) {
		this.#auths = auths == null ? null : auths.map((a) => authorizationify(a));
	}
	/**
	*  The max fee per blob gas for Cancun transactions.
	*/
	get maxFeePerBlobGas() {
		const value = this.#maxFeePerBlobGas;
		if (value == null && this.type === 3) return BN_0$4;
		return value;
	}
	set maxFeePerBlobGas(value) {
		this.#maxFeePerBlobGas = value == null ? null : getBigInt(value, "maxFeePerBlobGas");
	}
	/**
	*  The BLOb versioned hashes for Cancun transactions.
	*/
	get blobVersionedHashes() {
		let value = this.#blobVersionedHashes;
		if (value == null && this.type === 3) return [];
		return value;
	}
	set blobVersionedHashes(value) {
		if (value != null) {
			assertArgument(Array.isArray(value), "blobVersionedHashes must be an Array", "value", value);
			value = value.slice();
			for (let i = 0; i < value.length; i++) assertArgument(isHexString(value[i], 32), "invalid blobVersionedHash", `value[${i}]`, value[i]);
		}
		this.#blobVersionedHashes = value;
	}
	/**
	*  The BLObs for the Transaction, if any.
	*
	*  If ``blobs`` is non-``null``, then the [[seriailized]]
	*  will return the network formatted sidecar, otherwise it
	*  will return the standard [[link-eip-2718]] payload. The
	*  [[unsignedSerialized]] is unaffected regardless.
	*
	*  When setting ``blobs``, either fully valid [[Blob]] objects
	*  may be specified (i.e. correctly padded, with correct
	*  committments and proofs) or a raw [[BytesLike]] may
	*  be provided.
	*
	*  If raw [[BytesLike]] are provided, the [[kzg]] property **must**
	*  be already set. The blob will be correctly padded and the
	*  [[KzgLibrary]] will be used to compute the committment and
	*  proof for the blob.
	*
	*  A BLOb is a sequence of field elements, each of which must
	*  be within the BLS field modulo, so some additional processing
	*  may be required to encode arbitrary data to ensure each 32 byte
	*  field is within the valid range.
	*
	*  Setting this automatically populates [[blobVersionedHashes]],
	*  overwriting any existing values. Setting this to ``null``
	*  does **not** remove the [[blobVersionedHashes]], leaving them
	*  present.
	*/
	get blobs() {
		if (this.#blobs == null) return null;
		return this.#blobs.map((b) => Object.assign({}, b));
	}
	set blobs(_blobs) {
		if (_blobs == null) {
			this.#blobs = null;
			return;
		}
		const blobs = [];
		const versionedHashes = [];
		for (let i = 0; i < _blobs.length; i++) {
			const blob = _blobs[i];
			if (isBytesLike(blob)) {
				assert(this.#kzg, "adding a raw blob requires a KZG library", "UNSUPPORTED_OPERATION", { operation: "set blobs()" });
				let data = getBytes(blob);
				assertArgument(data.length <= BLOB_SIZE, "blob is too large", `blobs[${i}]`, blob);
				if (data.length !== BLOB_SIZE) {
					const padded = new Uint8Array(BLOB_SIZE);
					padded.set(data);
					data = padded;
				}
				const commit = this.#kzg.blobToKzgCommitment(data);
				const proof = hexlify(this.#kzg.computeBlobKzgProof(data, commit));
				blobs.push({
					data: hexlify(data),
					commitment: hexlify(commit),
					proof
				});
				versionedHashes.push(getVersionedHash(1, commit));
			} else {
				const data = hexlify(blob.data);
				const commitment = hexlify(blob.commitment);
				const proof = hexlify(blob.proof);
				blobs.push({
					data,
					commitment,
					proof
				});
				versionedHashes.push(getVersionedHash(1, commitment));
			}
		}
		this.#blobs = blobs;
		this.#blobVersionedHashes = versionedHashes;
	}
	get kzg() {
		return this.#kzg;
	}
	set kzg(kzg) {
		if (kzg == null) this.#kzg = null;
		else this.#kzg = getKzgLibrary(kzg);
	}
	get blobWrapperVersion() {
		return this.#blobWrapperVersion;
	}
	set blobWrapperVersion(value) {
		this.#blobWrapperVersion = value;
	}
	/**
	*  Creates a new Transaction with default values.
	*/
	constructor() {
		this.#type = null;
		this.#to = null;
		this.#nonce = 0;
		this.#gasLimit = BN_0$4;
		this.#gasPrice = null;
		this.#maxPriorityFeePerGas = null;
		this.#maxFeePerGas = null;
		this.#data = "0x";
		this.#value = BN_0$4;
		this.#chainId = BN_0$4;
		this.#sig = null;
		this.#accessList = null;
		this.#maxFeePerBlobGas = null;
		this.#blobVersionedHashes = null;
		this.#kzg = null;
		this.#blobs = null;
		this.#auths = null;
		this.#blobWrapperVersion = null;
	}
	/**
	*  The transaction hash, if signed. Otherwise, ``null``.
	*/
	get hash() {
		if (this.signature == null) return null;
		return keccak256(this.#getSerialized(true, false));
	}
	/**
	*  The pre-image hash of this transaction.
	*
	*  This is the digest that a [[Signer]] must sign to authorize
	*  this transaction.
	*/
	get unsignedHash() {
		return keccak256(this.unsignedSerialized);
	}
	/**
	*  The sending address, if signed. Otherwise, ``null``.
	*/
	get from() {
		if (this.signature == null) return null;
		return recoverAddress(this.unsignedHash, this.signature.getCanonical());
	}
	/**
	*  The public key of the sender, if signed. Otherwise, ``null``.
	*/
	get fromPublicKey() {
		if (this.signature == null) return null;
		return SigningKey.recoverPublicKey(this.unsignedHash, this.signature.getCanonical());
	}
	/**
	*  Returns true if signed.
	*
	*  This provides a Type Guard that properties requiring a signed
	*  transaction are non-null.
	*/
	isSigned() {
		return this.signature != null;
	}
	#getSerialized(signed, sidecar) {
		assert(!signed || this.signature != null, "cannot serialize unsigned transaction; maybe you meant .unsignedSerialized", "UNSUPPORTED_OPERATION", { operation: ".serialized" });
		const sig = signed ? this.signature : null;
		switch (this.inferType()) {
			case 0: return _serializeLegacy(this, sig);
			case 1: return _serializeEip2930(this, sig);
			case 2: return _serializeEip1559(this, sig);
			case 3: return _serializeEip4844(this, sig, sidecar ? this.blobs : null);
			case 4: return _serializeEip7702(this, sig);
		}
		assert(false, "unsupported transaction type", "UNSUPPORTED_OPERATION", { operation: ".serialized" });
	}
	/**
	*  The serialized transaction.
	*
	*  This throws if the transaction is unsigned. For the pre-image,
	*  use [[unsignedSerialized]].
	*/
	get serialized() {
		return this.#getSerialized(true, true);
	}
	/**
	*  The transaction pre-image.
	*
	*  The hash of this is the digest which needs to be signed to
	*  authorize this transaction.
	*/
	get unsignedSerialized() {
		return this.#getSerialized(false, false);
	}
	/**
	*  Return the most "likely" type; currently the highest
	*  supported transaction type.
	*/
	inferType() {
		const types = this.inferTypes();
		if (types.indexOf(2) >= 0) return 2;
		return types.pop();
	}
	/**
	*  Validates the explicit properties and returns a list of compatible
	*  transaction types.
	*/
	inferTypes() {
		const hasGasPrice = this.gasPrice != null;
		const hasFee = this.maxFeePerGas != null || this.maxPriorityFeePerGas != null;
		const hasAccessList = this.accessList != null;
		const hasBlob = this.#maxFeePerBlobGas != null || this.#blobVersionedHashes;
		if (this.maxFeePerGas != null && this.maxPriorityFeePerGas != null) assert(this.maxFeePerGas >= this.maxPriorityFeePerGas, "priorityFee cannot be more than maxFee", "BAD_DATA", { value: this });
		assert(!hasFee || this.type !== 0 && this.type !== 1, "transaction type cannot have maxFeePerGas or maxPriorityFeePerGas", "BAD_DATA", { value: this });
		assert(this.type !== 0 || !hasAccessList, "legacy transaction cannot have accessList", "BAD_DATA", { value: this });
		const types = [];
		if (this.type != null) types.push(this.type);
		else if (this.authorizationList && this.authorizationList.length) types.push(4);
		else if (hasFee) types.push(2);
		else if (hasGasPrice) {
			types.push(1);
			if (!hasAccessList) types.push(0);
		} else if (hasAccessList) {
			types.push(1);
			types.push(2);
		} else if (hasBlob && this.to) types.push(3);
		else {
			types.push(0);
			types.push(1);
			types.push(2);
			types.push(3);
		}
		types.sort();
		return types;
	}
	/**
	*  Returns true if this transaction is a legacy transaction (i.e.
	*  ``type === 0``).
	*
	*  This provides a Type Guard that the related properties are
	*  non-null.
	*/
	isLegacy() {
		return this.type === 0;
	}
	/**
	*  Returns true if this transaction is berlin hardform transaction (i.e.
	*  ``type === 1``).
	*
	*  This provides a Type Guard that the related properties are
	*  non-null.
	*/
	isBerlin() {
		return this.type === 1;
	}
	/**
	*  Returns true if this transaction is london hardform transaction (i.e.
	*  ``type === 2``).
	*
	*  This provides a Type Guard that the related properties are
	*  non-null.
	*/
	isLondon() {
		return this.type === 2;
	}
	/**
	*  Returns true if this transaction is an [[link-eip-4844]] BLOB
	*  transaction.
	*
	*  This provides a Type Guard that the related properties are
	*  non-null.
	*/
	isCancun() {
		return this.type === 3;
	}
	/**
	*  Create a copy of this transaciton.
	*/
	clone() {
		return Transaction.from(this);
	}
	/**
	*  Return a JSON-friendly object.
	*/
	toJSON() {
		const s = (v) => {
			if (v == null) return null;
			return v.toString();
		};
		return {
			type: this.type,
			to: this.to,
			data: this.data,
			nonce: this.nonce,
			gasLimit: s(this.gasLimit),
			gasPrice: s(this.gasPrice),
			maxPriorityFeePerGas: s(this.maxPriorityFeePerGas),
			maxFeePerGas: s(this.maxFeePerGas),
			value: s(this.value),
			chainId: s(this.chainId),
			sig: this.signature ? this.signature.toJSON() : null,
			accessList: this.accessList
		};
	}
	[inspect$2]() {
		return this.toString();
	}
	toString() {
		const output = [];
		const add = (key) => {
			let value = this[key];
			if (typeof value === "string") value = JSON.stringify(value);
			output.push(`${key}: ${value}`);
		};
		if (this.type) add("type");
		add("to");
		add("data");
		add("nonce");
		add("gasLimit");
		add("value");
		if (this.chainId != null) add("chainId");
		if (this.signature) {
			add("from");
			output.push(`signature: ${this.signature.toString()}`);
		}
		const auths = this.authorizationList;
		if (auths) {
			const outputAuths = [];
			for (const auth of auths) {
				const o = [];
				o.push(`address: ${JSON.stringify(auth.address)}`);
				if (auth.nonce != null) o.push(`nonce: ${auth.nonce}`);
				if (auth.chainId != null) o.push(`chainId: ${auth.chainId}`);
				if (auth.signature) o.push(`signature: ${auth.signature.toString()}`);
				outputAuths.push(`Authorization { ${o.join(", ")} }`);
			}
			output.push(`authorizations: [ ${outputAuths.join(", ")} ]`);
		}
		return `Transaction { ${output.join(", ")} }`;
	}
	/**
	*  Create a **Transaction** from a serialized transaction or a
	*  Transaction-like object.
	*/
	static from(tx) {
		if (tx == null) return new Transaction();
		if (typeof tx === "string") {
			const payload = getBytes(tx);
			if (payload[0] >= 127) return Transaction.from(_parseLegacy(payload));
			switch (payload[0]) {
				case 1: return Transaction.from(_parseEip2930(payload));
				case 2: return Transaction.from(_parseEip1559(payload));
				case 3: return Transaction.from(_parseEip4844(payload));
				case 4: return Transaction.from(_parseEip7702(payload));
			}
			assert(false, "unsupported transaction type", "UNSUPPORTED_OPERATION", { operation: "from" });
		}
		const result = new Transaction();
		if (tx.type != null) result.type = tx.type;
		if (tx.to != null) result.to = tx.to;
		if (tx.nonce != null) result.nonce = tx.nonce;
		if (tx.gasLimit != null) result.gasLimit = tx.gasLimit;
		if (tx.gasPrice != null) result.gasPrice = tx.gasPrice;
		if (tx.maxPriorityFeePerGas != null) result.maxPriorityFeePerGas = tx.maxPriorityFeePerGas;
		if (tx.maxFeePerGas != null) result.maxFeePerGas = tx.maxFeePerGas;
		if (tx.maxFeePerBlobGas != null) result.maxFeePerBlobGas = tx.maxFeePerBlobGas;
		if (tx.data != null) result.data = tx.data;
		if (tx.value != null) result.value = tx.value;
		if (tx.chainId != null) result.chainId = tx.chainId;
		if (tx.signature != null) result.signature = Signature.from(tx.signature);
		if (tx.accessList != null) result.accessList = tx.accessList;
		if (tx.authorizationList != null) result.authorizationList = tx.authorizationList;
		if (tx.blobVersionedHashes != null) result.blobVersionedHashes = tx.blobVersionedHashes;
		if (tx.kzg != null) result.kzg = tx.kzg;
		if (tx.blobWrapperVersion != null) result.blobWrapperVersion = tx.blobWrapperVersion;
		if (tx.blobs != null) result.blobs = tx.blobs;
		if (tx.hash != null) {
			assertArgument(result.isSigned(), "unsigned transaction cannot define '.hash'", "tx", tx);
			assertArgument(result.hash === tx.hash, "hash mismatch", "tx", tx);
		}
		if (tx.from != null) {
			assertArgument(result.isSigned(), "unsigned transaction cannot define '.from'", "tx", tx);
			assertArgument(result.from.toLowerCase() === (tx.from || "").toLowerCase(), "from mismatch", "tx", tx);
		}
		return result;
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/hash/id.js
/**
*  A simple hashing function which operates on UTF-8 strings to
*  compute an 32-byte identifier.
*
*  This simply computes the [UTF-8 bytes](toUtf8Bytes) and computes
*  the [[keccak256]].
*
*  @example:
*    id("hello world")
*    //_result:
*/
function id(value) {
	return keccak256(toUtf8Bytes(value));
}
//#endregion
//#region node_modules/ethers/lib.esm/hash/namehash.js
var Zeros = /* @__PURE__ */ new Uint8Array(32);
Zeros.fill(0);
function checkComponent(comp) {
	assertArgument(comp.length !== 0, "invalid ENS name; empty component", "comp", comp);
	return comp;
}
function ensNameSplit(name) {
	const bytes = toUtf8Bytes(ensNormalize(name));
	const comps = [];
	if (name.length === 0) return comps;
	let last = 0;
	for (let i = 0; i < bytes.length; i++) if (bytes[i] === 46) {
		comps.push(checkComponent(bytes.slice(last, i)));
		last = i + 1;
	}
	assertArgument(last < bytes.length, "invalid ENS name; empty component", "name", name);
	comps.push(checkComponent(bytes.slice(last)));
	return comps;
}
/**
*  Returns the ENS %%name%% normalized.
*/
function ensNormalize(name) {
	try {
		if (name.length === 0) throw new Error("empty label");
		return ens_normalize(name);
	} catch (error) {
		assertArgument(false, `invalid ENS name (${error.message})`, "name", name);
	}
}
/**
*  Returns ``true`` if %%name%% is a valid ENS name.
*/
function isValidName(name) {
	try {
		return ensNameSplit(name).length !== 0;
	} catch (error) {}
	return false;
}
/**
*  Returns the [[link-namehash]] for %%name%%.
*/
function namehash(name) {
	assertArgument(typeof name === "string", "invalid ENS name; not a string", "name", name);
	assertArgument(name.length, `invalid ENS name (empty label)`, "name", name);
	let result = Zeros;
	const comps = ensNameSplit(name);
	while (comps.length) result = keccak256(concat([result, keccak256(comps.pop())]));
	return hexlify(result);
}
/**
*  Returns the DNS encoded %%name%%.
*
*  This is used for various parts of ENS name resolution, such
*  as the wildcard resolution.
*/
function dnsEncode(name, _maxLength) {
	const length = _maxLength != null ? _maxLength : 63;
	assertArgument(length <= 255, "DNS encoded label cannot exceed 255", "length", length);
	return hexlify(concat(ensNameSplit(name).map((comp) => {
		assertArgument(comp.length <= length, `label ${JSON.stringify(name)} exceeds ${length} bytes`, "name", name);
		const bytes = new Uint8Array(comp.length + 1);
		bytes.set(comp, 1);
		bytes[0] = bytes.length - 1;
		return bytes;
	}))) + "00";
}
//#endregion
//#region node_modules/ethers/lib.esm/hash/typed-data.js
var padding = /* @__PURE__ */ new Uint8Array(32);
padding.fill(0);
var BN__1 = BigInt(-1);
var BN_0$3 = BigInt(0);
var BN_1 = BigInt(1);
var BN_MAX_UINT256 = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
function hexPadRight(value) {
	const bytes = getBytes(value);
	const padOffset = bytes.length % 32;
	if (padOffset) return concat([bytes, padding.slice(padOffset)]);
	return hexlify(bytes);
}
var hexTrue = toBeHex(BN_1, 32);
var hexFalse = toBeHex(BN_0$3, 32);
var domainFieldTypes = {
	name: "string",
	version: "string",
	chainId: "uint256",
	verifyingContract: "address",
	salt: "bytes32"
};
var domainFieldNames = [
	"name",
	"version",
	"chainId",
	"verifyingContract",
	"salt"
];
function checkString(key) {
	return function(value) {
		assertArgument(typeof value === "string", `invalid domain value for ${JSON.stringify(key)}`, `domain.${key}`, value);
		return value;
	};
}
var domainChecks = {
	name: checkString("name"),
	version: checkString("version"),
	chainId: function(_value) {
		const value = getBigInt(_value, "domain.chainId");
		assertArgument(value >= 0, "invalid chain ID", "domain.chainId", _value);
		if (Number.isSafeInteger(value)) return Number(value);
		return toQuantity(value);
	},
	verifyingContract: function(value) {
		try {
			return getAddress(value).toLowerCase();
		} catch (error) {}
		assertArgument(false, `invalid domain value "verifyingContract"`, "domain.verifyingContract", value);
	},
	salt: function(value) {
		const bytes = getBytes(value, "domain.salt");
		assertArgument(bytes.length === 32, `invalid domain value "salt"`, "domain.salt", value);
		return hexlify(bytes);
	}
};
function getBaseEncoder(type) {
	{
		const match = type.match(/^(u?)int(\d+)$/);
		if (match) {
			const signed = match[1] === "";
			const width = parseInt(match[2]);
			assertArgument(width % 8 === 0 && width !== 0 && width <= 256 && match[2] === String(width), "invalid numeric width", "type", type);
			const boundsUpper = mask(BN_MAX_UINT256, signed ? width - 1 : width);
			const boundsLower = signed ? (boundsUpper + BN_1) * BN__1 : BN_0$3;
			return function(_value) {
				const value = getBigInt(_value, "value");
				assertArgument(value >= boundsLower && value <= boundsUpper, `value out-of-bounds for ${type}`, "value", value);
				return toBeHex(signed ? toTwos(value, 256) : value, 32);
			};
		}
	}
	{
		const match = type.match(/^bytes(\d+)$/);
		if (match) {
			const width = parseInt(match[1]);
			assertArgument(width !== 0 && width <= 32 && match[1] === String(width), "invalid bytes width", "type", type);
			return function(value) {
				assertArgument(getBytes(value).length === width, `invalid length for ${type}`, "value", value);
				return hexPadRight(value);
			};
		}
	}
	switch (type) {
		case "address": return function(value) {
			return zeroPadValue(getAddress(value), 32);
		};
		case "bool": return function(value) {
			return !value ? hexFalse : hexTrue;
		};
		case "bytes": return function(value) {
			return keccak256(value);
		};
		case "string": return function(value) {
			return id(value);
		};
	}
	return null;
}
function encodeType(name, fields) {
	return `${name}(${fields.map(({ name, type }) => type + " " + name).join(",")})`;
}
function splitArray(type) {
	const match = type.match(/^([^\x5b]*)((\x5b\d*\x5d)*)(\x5b(\d*)\x5d)$/);
	if (match) return {
		base: match[1],
		index: match[2] + match[4],
		array: {
			base: match[1],
			prefix: match[1] + match[2],
			count: match[5] ? parseInt(match[5]) : -1
		}
	};
	return { base: type };
}
/**
*  A **TypedDataEncode** prepares and encodes [[link-eip-712]] payloads
*  for signed typed data.
*
*  This is useful for those that wish to compute various components of a
*  typed data hash, primary types, or sub-components, but generally the
*  higher level [[Signer-signTypedData]] is more useful.
*/
var TypedDataEncoder = class TypedDataEncoder {
	/**
	*  The primary type for the structured [[types]].
	*
	*  This is derived automatically from the [[types]], since no
	*  recursion is possible, once the DAG for the types is consturcted
	*  internally, the primary type must be the only remaining type with
	*  no parent nodes.
	*/
	primaryType;
	#types;
	/**
	*  The types.
	*/
	get types() {
		return JSON.parse(this.#types);
	}
	#fullTypes;
	#encoderCache;
	/**
	*  Create a new **TypedDataEncoder** for %%types%%.
	*
	*  This performs all necessary checking that types are valid and
	*  do not violate the [[link-eip-712]] structural constraints as
	*  well as computes the [[primaryType]].
	*/
	constructor(_types) {
		this.#fullTypes = /* @__PURE__ */ new Map();
		this.#encoderCache = /* @__PURE__ */ new Map();
		const links = /* @__PURE__ */ new Map();
		const parents = /* @__PURE__ */ new Map();
		const subtypes = /* @__PURE__ */ new Map();
		const types = {};
		Object.keys(_types).forEach((type) => {
			types[type] = _types[type].map(({ name, type }) => {
				let { base, index } = splitArray(type);
				if (base === "int" && !_types["int"]) base = "int256";
				if (base === "uint" && !_types["uint"]) base = "uint256";
				return {
					name,
					type: base + (index || "")
				};
			});
			links.set(type, /* @__PURE__ */ new Set());
			parents.set(type, []);
			subtypes.set(type, /* @__PURE__ */ new Set());
		});
		this.#types = JSON.stringify(types);
		for (const name in types) {
			const uniqueNames = /* @__PURE__ */ new Set();
			for (const field of types[name]) {
				assertArgument(!uniqueNames.has(field.name), `duplicate variable name ${JSON.stringify(field.name)} in ${JSON.stringify(name)}`, "types", _types);
				uniqueNames.add(field.name);
				const baseType = splitArray(field.type).base;
				assertArgument(baseType !== name, `circular type reference to ${JSON.stringify(baseType)}`, "types", _types);
				if (getBaseEncoder(baseType)) continue;
				assertArgument(parents.has(baseType), `unknown type ${JSON.stringify(baseType)}`, "types", _types);
				parents.get(baseType).push(name);
				links.get(name).add(baseType);
			}
		}
		const primaryTypes = Array.from(parents.keys()).filter((n) => parents.get(n).length === 0);
		assertArgument(primaryTypes.length !== 0, "missing primary type", "types", _types);
		assertArgument(primaryTypes.length === 1, `ambiguous primary types or unused types: ${primaryTypes.map((t) => JSON.stringify(t)).join(", ")}`, "types", _types);
		defineProperties(this, { primaryType: primaryTypes[0] });
		function checkCircular(type, found) {
			assertArgument(!found.has(type), `circular type reference to ${JSON.stringify(type)}`, "types", _types);
			found.add(type);
			for (const child of links.get(type)) {
				if (!parents.has(child)) continue;
				checkCircular(child, found);
				for (const subtype of found) subtypes.get(subtype).add(child);
			}
			found.delete(type);
		}
		checkCircular(this.primaryType, /* @__PURE__ */ new Set());
		for (const [name, set] of subtypes) {
			const st = Array.from(set);
			st.sort();
			this.#fullTypes.set(name, encodeType(name, types[name]) + st.map((t) => encodeType(t, types[t])).join(""));
		}
	}
	/**
	*  Returnthe encoder for the specific %%type%%.
	*/
	getEncoder(type) {
		let encoder = this.#encoderCache.get(type);
		if (!encoder) {
			encoder = this.#getEncoder(type);
			this.#encoderCache.set(type, encoder);
		}
		return encoder;
	}
	#getEncoder(type) {
		{
			const encoder = getBaseEncoder(type);
			if (encoder) return encoder;
		}
		const array = splitArray(type).array;
		if (array) {
			const subtype = array.prefix;
			const subEncoder = this.getEncoder(subtype);
			return (value) => {
				assertArgument(array.count === -1 || array.count === value.length, `array length mismatch; expected length ${array.count}`, "value", value);
				let result = value.map(subEncoder);
				if (this.#fullTypes.has(subtype)) result = result.map(keccak256);
				return keccak256(concat(result));
			};
		}
		const fields = this.types[type];
		if (fields) {
			const encodedType = id(this.#fullTypes.get(type));
			return (value) => {
				const values = fields.map(({ name, type }) => {
					const result = this.getEncoder(type)(value[name]);
					if (this.#fullTypes.has(type)) return keccak256(result);
					return result;
				});
				values.unshift(encodedType);
				return concat(values);
			};
		}
		assertArgument(false, `unknown type: ${type}`, "type", type);
	}
	/**
	*  Return the full type for %%name%%.
	*/
	encodeType(name) {
		const result = this.#fullTypes.get(name);
		assertArgument(result, `unknown type: ${JSON.stringify(name)}`, "name", name);
		return result;
	}
	/**
	*  Return the encoded %%value%% for the %%type%%.
	*/
	encodeData(type, value) {
		return this.getEncoder(type)(value);
	}
	/**
	*  Returns the hash of %%value%% for the type of %%name%%.
	*/
	hashStruct(name, value) {
		return keccak256(this.encodeData(name, value));
	}
	/**
	*  Return the fulled encoded %%value%% for the [[types]].
	*/
	encode(value) {
		return this.encodeData(this.primaryType, value);
	}
	/**
	*  Return the hash of the fully encoded %%value%% for the [[types]].
	*/
	hash(value) {
		return this.hashStruct(this.primaryType, value);
	}
	/**
	*  @_ignore:
	*/
	_visit(type, value, callback) {
		if (getBaseEncoder(type)) return callback(type, value);
		const array = splitArray(type).array;
		if (array) {
			assertArgument(array.count === -1 || array.count === value.length, `array length mismatch; expected length ${array.count}`, "value", value);
			return value.map((v) => this._visit(array.prefix, v, callback));
		}
		const fields = this.types[type];
		if (fields) return fields.reduce((accum, { name, type }) => {
			accum[name] = this._visit(type, value[name], callback);
			return accum;
		}, {});
		assertArgument(false, `unknown type: ${type}`, "type", type);
	}
	/**
	*  Call %%calback%% for each value in %%value%%, passing the type and
	*  component within %%value%%.
	*
	*  This is useful for replacing addresses or other transformation that
	*  may be desired on each component, based on its type.
	*/
	visit(value, callback) {
		return this._visit(this.primaryType, value, callback);
	}
	/**
	*  Create a new **TypedDataEncoder** for %%types%%.
	*/
	static from(types) {
		return new TypedDataEncoder(types);
	}
	/**
	*  Return the primary type for %%types%%.
	*/
	static getPrimaryType(types) {
		return TypedDataEncoder.from(types).primaryType;
	}
	/**
	*  Return the hashed struct for %%value%% using %%types%% and %%name%%.
	*/
	static hashStruct(name, types, value) {
		return TypedDataEncoder.from(types).hashStruct(name, value);
	}
	/**
	*  Return the domain hash for %%domain%%.
	*/
	static hashDomain(domain) {
		const domainFields = [];
		for (const name in domain) {
			if (domain[name] == null) continue;
			const type = domainFieldTypes[name];
			assertArgument(type, `invalid typed-data domain key: ${JSON.stringify(name)}`, "domain", domain);
			domainFields.push({
				name,
				type
			});
		}
		domainFields.sort((a, b) => {
			return domainFieldNames.indexOf(a.name) - domainFieldNames.indexOf(b.name);
		});
		return TypedDataEncoder.hashStruct("EIP712Domain", { EIP712Domain: domainFields }, domain);
	}
	/**
	*  Return the fully encoded [[link-eip-712]] %%value%% for %%types%% with %%domain%%.
	*/
	static encode(domain, types, value) {
		return concat([
			"0x1901",
			TypedDataEncoder.hashDomain(domain),
			TypedDataEncoder.from(types).hash(value)
		]);
	}
	/**
	*  Return the hash of the fully encoded [[link-eip-712]] %%value%% for %%types%% with %%domain%%.
	*/
	static hash(domain, types, value) {
		return keccak256(TypedDataEncoder.encode(domain, types, value));
	}
	/**
	* Resolves to the value from resolving all addresses in %%value%% for
	* %%types%% and the %%domain%%.
	*/
	static async resolveNames(domain, types, value, resolveName) {
		domain = Object.assign({}, domain);
		for (const key in domain) if (domain[key] == null) delete domain[key];
		const ensCache = {};
		if (domain.verifyingContract && !isHexString(domain.verifyingContract, 20)) ensCache[domain.verifyingContract] = "0x";
		const encoder = TypedDataEncoder.from(types);
		encoder.visit(value, (type, value) => {
			if (type === "address" && !isHexString(value, 20)) ensCache[value] = "0x";
			return value;
		});
		for (const name in ensCache) ensCache[name] = await resolveName(name);
		if (domain.verifyingContract && ensCache[domain.verifyingContract]) domain.verifyingContract = ensCache[domain.verifyingContract];
		value = encoder.visit(value, (type, value) => {
			if (type === "address" && ensCache[value]) return ensCache[value];
			return value;
		});
		return {
			domain,
			value
		};
	}
	/**
	*  Returns the JSON-encoded payload expected by nodes which implement
	*  the JSON-RPC [[link-eip-712]] method.
	*/
	static getPayload(domain, types, value) {
		TypedDataEncoder.hashDomain(domain);
		const domainValues = {};
		const domainTypes = [];
		domainFieldNames.forEach((name) => {
			const value = domain[name];
			if (value == null) return;
			domainValues[name] = domainChecks[name](value);
			domainTypes.push({
				name,
				type: domainFieldTypes[name]
			});
		});
		const encoder = TypedDataEncoder.from(types);
		types = encoder.types;
		const typesWithDomain = Object.assign({}, types);
		assertArgument(typesWithDomain.EIP712Domain == null, "types must not contain EIP712Domain type", "types.EIP712Domain", types);
		typesWithDomain.EIP712Domain = domainTypes;
		encoder.encode(value);
		return {
			types: typesWithDomain,
			domain: domainValues,
			primaryType: encoder.primaryType,
			message: encoder.visit(value, (type, value) => {
				if (type.match(/^bytes(\d*)/)) return hexlify(getBytes(value));
				if (type.match(/^u?int/)) return getBigInt(value).toString();
				switch (type) {
					case "address": return value.toLowerCase();
					case "bool": return !!value;
					case "string":
						assertArgument(typeof value === "string", "invalid string", "value", value);
						return value;
				}
				assertArgument(false, "unsupported type", "type", type);
			})
		};
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/fragments.js
/**
*  A fragment is a single item from an ABI, which may represent any of:
*
*  - [Functions](FunctionFragment)
*  - [Events](EventFragment)
*  - [Constructors](ConstructorFragment)
*  - Custom [Errors](ErrorFragment)
*  - [Fallback or Receive](FallbackFragment) functions
*
*  @_subsection api/abi/abi-coder:Fragments  [about-fragments]
*/
function setify(items) {
	const result = /* @__PURE__ */ new Set();
	items.forEach((k) => result.add(k));
	return Object.freeze(result);
}
var KwVisibDeploy = setify("external public payable override".split(" "));
var _kwVisib = "constant external internal payable private public pure view override";
var KwVisib = setify(_kwVisib.split(" "));
var _kwTypes = "constructor error event fallback function receive struct";
var KwTypes = setify(_kwTypes.split(" "));
var _kwModifiers = "calldata memory storage payable indexed";
var KwModifiers = setify(_kwModifiers.split(" "));
var Keywords = setify([
	_kwTypes,
	_kwModifiers,
	"tuple returns",
	_kwVisib
].join(" ").split(" "));
var SimpleTokens = {
	"(": "OPEN_PAREN",
	")": "CLOSE_PAREN",
	"[": "OPEN_BRACKET",
	"]": "CLOSE_BRACKET",
	",": "COMMA",
	"@": "AT"
};
var regexWhitespacePrefix = /* @__PURE__ */ new RegExp("^(\\s*)");
var regexNumberPrefix = /* @__PURE__ */ new RegExp("^([0-9]+)");
var regexIdPrefix = /* @__PURE__ */ new RegExp("^([a-zA-Z$_][a-zA-Z0-9$_]*)");
var regexId = /* @__PURE__ */ new RegExp("^([a-zA-Z$_][a-zA-Z0-9$_]*)$");
var regexType = /* @__PURE__ */ new RegExp("^(address|bool|bytes([0-9]*)|string|u?int([0-9]*))$");
var TokenString = class TokenString {
	#offset;
	#tokens;
	get offset() {
		return this.#offset;
	}
	get length() {
		return this.#tokens.length - this.#offset;
	}
	constructor(tokens) {
		this.#offset = 0;
		this.#tokens = tokens.slice();
	}
	clone() {
		return new TokenString(this.#tokens);
	}
	reset() {
		this.#offset = 0;
	}
	#subTokenString(from = 0, to = 0) {
		return new TokenString(this.#tokens.slice(from, to).map((t) => {
			return Object.freeze(Object.assign({}, t, {
				match: t.match - from,
				linkBack: t.linkBack - from,
				linkNext: t.linkNext - from
			}));
		}));
	}
	popKeyword(allowed) {
		const top = this.peek();
		if (top.type !== "KEYWORD" || !allowed.has(top.text)) throw new Error(`expected keyword ${top.text}`);
		return this.pop().text;
	}
	popType(type) {
		if (this.peek().type !== type) {
			const top = this.peek();
			throw new Error(`expected ${type}; got ${top.type} ${JSON.stringify(top.text)}`);
		}
		return this.pop().text;
	}
	popParen() {
		const top = this.peek();
		if (top.type !== "OPEN_PAREN") throw new Error("bad start");
		const result = this.#subTokenString(this.#offset + 1, top.match + 1);
		this.#offset = top.match + 1;
		return result;
	}
	popParams() {
		const top = this.peek();
		if (top.type !== "OPEN_PAREN") throw new Error("bad start");
		const result = [];
		while (this.#offset < top.match - 1) {
			const link = this.peek().linkNext;
			result.push(this.#subTokenString(this.#offset + 1, link));
			this.#offset = link;
		}
		this.#offset = top.match + 1;
		return result;
	}
	peek() {
		if (this.#offset >= this.#tokens.length) throw new Error("out-of-bounds");
		return this.#tokens[this.#offset];
	}
	peekKeyword(allowed) {
		const top = this.peekType("KEYWORD");
		return top != null && allowed.has(top) ? top : null;
	}
	peekType(type) {
		if (this.length === 0) return null;
		const top = this.peek();
		return top.type === type ? top.text : null;
	}
	pop() {
		const result = this.peek();
		this.#offset++;
		return result;
	}
	toString() {
		const tokens = [];
		for (let i = this.#offset; i < this.#tokens.length; i++) {
			const token = this.#tokens[i];
			tokens.push(`${token.type}:${token.text}`);
		}
		return `<TokenString ${tokens.join(" ")}>`;
	}
};
function lex(text) {
	const tokens = [];
	const throwError = (message) => {
		const token = offset < text.length ? JSON.stringify(text[offset]) : "$EOI";
		throw new Error(`invalid token ${token} at ${offset}: ${message}`);
	};
	let brackets = [];
	let commas = [];
	let offset = 0;
	while (offset < text.length) {
		let cur = text.substring(offset);
		let match = cur.match(regexWhitespacePrefix);
		if (match) {
			offset += match[1].length;
			cur = text.substring(offset);
		}
		const token = {
			depth: brackets.length,
			linkBack: -1,
			linkNext: -1,
			match: -1,
			type: "",
			text: "",
			offset,
			value: -1
		};
		tokens.push(token);
		let type = SimpleTokens[cur[0]] || "";
		if (type) {
			token.type = type;
			token.text = cur[0];
			offset++;
			if (type === "OPEN_PAREN") {
				brackets.push(tokens.length - 1);
				commas.push(tokens.length - 1);
			} else if (type == "CLOSE_PAREN") {
				if (brackets.length === 0) throwError("no matching open bracket");
				token.match = brackets.pop();
				tokens[token.match].match = tokens.length - 1;
				token.depth--;
				token.linkBack = commas.pop();
				tokens[token.linkBack].linkNext = tokens.length - 1;
			} else if (type === "COMMA") {
				token.linkBack = commas.pop();
				tokens[token.linkBack].linkNext = tokens.length - 1;
				commas.push(tokens.length - 1);
			} else if (type === "OPEN_BRACKET") token.type = "BRACKET";
			else if (type === "CLOSE_BRACKET") {
				let suffix = tokens.pop().text;
				if (tokens.length > 0 && tokens[tokens.length - 1].type === "NUMBER") {
					const value = tokens.pop().text;
					suffix = value + suffix;
					tokens[tokens.length - 1].value = getNumber(value);
				}
				if (tokens.length === 0 || tokens[tokens.length - 1].type !== "BRACKET") throw new Error("missing opening bracket");
				tokens[tokens.length - 1].text += suffix;
			}
			continue;
		}
		match = cur.match(regexIdPrefix);
		if (match) {
			token.text = match[1];
			offset += token.text.length;
			if (Keywords.has(token.text)) {
				token.type = "KEYWORD";
				continue;
			}
			if (token.text.match(regexType)) {
				token.type = "TYPE";
				continue;
			}
			token.type = "ID";
			continue;
		}
		match = cur.match(regexNumberPrefix);
		if (match) {
			token.text = match[1];
			token.type = "NUMBER";
			offset += token.text.length;
			continue;
		}
		throw new Error(`unexpected token ${JSON.stringify(cur[0])} at position ${offset}`);
	}
	return new TokenString(tokens.map((t) => Object.freeze(t)));
}
function allowSingle(set, allowed) {
	let included = [];
	for (const key in allowed.keys()) if (set.has(key)) included.push(key);
	if (included.length > 1) throw new Error(`conflicting types: ${included.join(", ")}`);
}
function consumeName(type, tokens) {
	if (tokens.peekKeyword(KwTypes)) {
		const keyword = tokens.pop().text;
		if (keyword !== type) throw new Error(`expected ${type}, got ${keyword}`);
	}
	return tokens.popType("ID");
}
function consumeKeywords(tokens, allowed) {
	const keywords = /* @__PURE__ */ new Set();
	while (true) {
		const keyword = tokens.peekType("KEYWORD");
		if (keyword == null || allowed && !allowed.has(keyword)) break;
		tokens.pop();
		if (keywords.has(keyword)) throw new Error(`duplicate keywords: ${JSON.stringify(keyword)}`);
		keywords.add(keyword);
	}
	return Object.freeze(keywords);
}
function consumeMutability(tokens) {
	let modifiers = consumeKeywords(tokens, KwVisib);
	allowSingle(modifiers, setify("constant payable nonpayable".split(" ")));
	allowSingle(modifiers, setify("pure view payable nonpayable".split(" ")));
	if (modifiers.has("view")) return "view";
	if (modifiers.has("pure")) return "pure";
	if (modifiers.has("payable")) return "payable";
	if (modifiers.has("nonpayable")) return "nonpayable";
	if (modifiers.has("constant")) return "view";
	return "nonpayable";
}
function consumeParams(tokens, allowIndexed) {
	return tokens.popParams().map((t) => ParamType.from(t, allowIndexed));
}
function consumeGas(tokens) {
	if (tokens.peekType("AT")) {
		tokens.pop();
		if (tokens.peekType("NUMBER")) return getBigInt(tokens.pop().text);
		throw new Error("invalid gas");
	}
	return null;
}
function consumeEoi(tokens) {
	if (tokens.length) throw new Error(`unexpected tokens at offset ${tokens.offset}: ${tokens.toString()}`);
}
var regexArrayType = /* @__PURE__ */ new RegExp(/^(.*)\[([0-9]*)\]$/);
function verifyBasicType(type) {
	const match = type.match(regexType);
	assertArgument(match, "invalid type", "type", type);
	if (type === "uint") return "uint256";
	if (type === "int") return "int256";
	if (match[2]) {
		const length = parseInt(match[2]);
		assertArgument(length !== 0 && length <= 32, "invalid bytes length", "type", type);
	} else if (match[3]) {
		const size = parseInt(match[3]);
		assertArgument(size !== 0 && size <= 256 && size % 8 === 0, "invalid numeric width", "type", type);
	}
	return type;
}
var _guard = {};
var internal$1 = Symbol.for("_ethers_internal");
var ParamTypeInternal = "_ParamTypeInternal";
var ErrorFragmentInternal = "_ErrorInternal";
var EventFragmentInternal = "_EventInternal";
var ConstructorFragmentInternal = "_ConstructorInternal";
var FallbackFragmentInternal = "_FallbackInternal";
var FunctionFragmentInternal = "_FunctionInternal";
var StructFragmentInternal = "_StructInternal";
/**
*  Each input and output of a [[Fragment]] is an Array of **ParamType**.
*/
var ParamType = class ParamType {
	/**
	*  The local name of the parameter (or ``""`` if unbound)
	*/
	name;
	/**
	*  The fully qualified type (e.g. ``"address"``, ``"tuple(address)"``,
	*  ``"uint256[3][]"``)
	*/
	type;
	/**
	*  The base type (e.g. ``"address"``, ``"tuple"``, ``"array"``)
	*/
	baseType;
	/**
	*  True if the parameters is indexed.
	*
	*  For non-indexable types this is ``null``.
	*/
	indexed;
	/**
	*  The components for the tuple.
	*
	*  For non-tuple types this is ``null``.
	*/
	components;
	/**
	*  The array length, or ``-1`` for dynamic-lengthed arrays.
	*
	*  For non-array types this is ``null``.
	*/
	arrayLength;
	/**
	*  The type of each child in the array.
	*
	*  For non-array types this is ``null``.
	*/
	arrayChildren;
	/**
	*  @private
	*/
	constructor(guard, name, type, baseType, indexed, components, arrayLength, arrayChildren) {
		assertPrivate(guard, _guard, "ParamType");
		Object.defineProperty(this, internal$1, { value: ParamTypeInternal });
		if (components) components = Object.freeze(components.slice());
		if (baseType === "array") {
			if (arrayLength == null || arrayChildren == null) throw new Error("");
		} else if (arrayLength != null || arrayChildren != null) throw new Error("");
		if (baseType === "tuple") {
			if (components == null) throw new Error("");
		} else if (components != null) throw new Error("");
		defineProperties(this, {
			name,
			type,
			baseType,
			indexed,
			components,
			arrayLength,
			arrayChildren
		});
	}
	/**
	*  Return a string representation of this type.
	*
	*  For example,
	*
	*  ``sighash" => "(uint256,address)"``
	*
	*  ``"minimal" => "tuple(uint256,address) indexed"``
	*
	*  ``"full" => "tuple(uint256 foo, address bar) indexed baz"``
	*/
	format(format) {
		if (format == null) format = "sighash";
		if (format === "json") {
			const name = this.name || "";
			if (this.isArray()) {
				const result = JSON.parse(this.arrayChildren.format("json"));
				result.name = name;
				result.type += `[${this.arrayLength < 0 ? "" : String(this.arrayLength)}]`;
				return JSON.stringify(result);
			}
			const result = {
				type: this.baseType === "tuple" ? "tuple" : this.type,
				name
			};
			if (typeof this.indexed === "boolean") result.indexed = this.indexed;
			if (this.isTuple()) result.components = this.components.map((c) => JSON.parse(c.format(format)));
			return JSON.stringify(result);
		}
		let result = "";
		if (this.isArray()) {
			result += this.arrayChildren.format(format);
			result += `[${this.arrayLength < 0 ? "" : String(this.arrayLength)}]`;
		} else if (this.isTuple()) result += "(" + this.components.map((comp) => comp.format(format)).join(format === "full" ? ", " : ",") + ")";
		else result += this.type;
		if (format !== "sighash") {
			if (this.indexed === true) result += " indexed";
			if (format === "full" && this.name) result += " " + this.name;
		}
		return result;
	}
	/**
	*  Returns true if %%this%% is an Array type.
	*
	*  This provides a type gaurd ensuring that [[arrayChildren]]
	*  and [[arrayLength]] are non-null.
	*/
	isArray() {
		return this.baseType === "array";
	}
	/**
	*  Returns true if %%this%% is a Tuple type.
	*
	*  This provides a type gaurd ensuring that [[components]]
	*  is non-null.
	*/
	isTuple() {
		return this.baseType === "tuple";
	}
	/**
	*  Returns true if %%this%% is an Indexable type.
	*
	*  This provides a type gaurd ensuring that [[indexed]]
	*  is non-null.
	*/
	isIndexable() {
		return this.indexed != null;
	}
	/**
	*  Walks the **ParamType** with %%value%%, calling %%process%%
	*  on each type, destructing the %%value%% recursively.
	*/
	walk(value, process) {
		if (this.isArray()) {
			if (!Array.isArray(value)) throw new Error("invalid array value");
			if (this.arrayLength !== -1 && value.length !== this.arrayLength) throw new Error("array is wrong length");
			const _this = this;
			return value.map((v) => _this.arrayChildren.walk(v, process));
		}
		if (this.isTuple()) {
			if (!Array.isArray(value)) throw new Error("invalid tuple value");
			if (value.length !== this.components.length) throw new Error("array is wrong length");
			const _this = this;
			return value.map((v, i) => _this.components[i].walk(v, process));
		}
		return process(this.type, value);
	}
	#walkAsync(promises, value, process, setValue) {
		if (this.isArray()) {
			if (!Array.isArray(value)) throw new Error("invalid array value");
			if (this.arrayLength !== -1 && value.length !== this.arrayLength) throw new Error("array is wrong length");
			const childType = this.arrayChildren;
			const result = value.slice();
			result.forEach((value, index) => {
				childType.#walkAsync(promises, value, process, (value) => {
					result[index] = value;
				});
			});
			setValue(result);
			return;
		}
		if (this.isTuple()) {
			const components = this.components;
			let result;
			if (Array.isArray(value)) result = value.slice();
			else {
				if (value == null || typeof value !== "object") throw new Error("invalid tuple value");
				result = components.map((param) => {
					if (!param.name) throw new Error("cannot use object value with unnamed components");
					if (!(param.name in value)) throw new Error(`missing value for component ${param.name}`);
					return value[param.name];
				});
			}
			if (result.length !== this.components.length) throw new Error("array is wrong length");
			result.forEach((value, index) => {
				components[index].#walkAsync(promises, value, process, (value) => {
					result[index] = value;
				});
			});
			setValue(result);
			return;
		}
		const result = process(this.type, value);
		if (result.then) promises.push((async function() {
			setValue(await result);
		})());
		else setValue(result);
	}
	/**
	*  Walks the **ParamType** with %%value%%, asynchronously calling
	*  %%process%% on each type, destructing the %%value%% recursively.
	*
	*  This can be used to resolve ENS names by walking and resolving each
	*  ``"address"`` type.
	*/
	async walkAsync(value, process) {
		const promises = [];
		const result = [value];
		this.#walkAsync(promises, value, process, (value) => {
			result[0] = value;
		});
		if (promises.length) await Promise.all(promises);
		return result[0];
	}
	/**
	*  Creates a new **ParamType** for %%obj%%.
	*
	*  If %%allowIndexed%% then the ``indexed`` keyword is permitted,
	*  otherwise the ``indexed`` keyword will throw an error.
	*/
	static from(obj, allowIndexed) {
		if (ParamType.isParamType(obj)) return obj;
		if (typeof obj === "string") try {
			return ParamType.from(lex(obj), allowIndexed);
		} catch (error) {
			assertArgument(false, "invalid param type", "obj", obj);
		}
		else if (obj instanceof TokenString) {
			let type = "", baseType = "";
			let comps = null;
			if (consumeKeywords(obj, setify(["tuple"])).has("tuple") || obj.peekType("OPEN_PAREN")) {
				baseType = "tuple";
				comps = obj.popParams().map((t) => ParamType.from(t));
				type = `tuple(${comps.map((c) => c.format()).join(",")})`;
			} else {
				type = verifyBasicType(obj.popType("TYPE"));
				baseType = type;
			}
			let arrayChildren = null;
			let arrayLength = null;
			while (obj.length && obj.peekType("BRACKET")) {
				const bracket = obj.pop();
				arrayChildren = new ParamType(_guard, "", type, baseType, null, comps, arrayLength, arrayChildren);
				arrayLength = bracket.value;
				type += bracket.text;
				baseType = "array";
				comps = null;
			}
			let indexed = null;
			if (consumeKeywords(obj, KwModifiers).has("indexed")) {
				if (!allowIndexed) throw new Error("");
				indexed = true;
			}
			const name = obj.peekType("ID") ? obj.pop().text : "";
			if (obj.length) throw new Error("leftover tokens");
			return new ParamType(_guard, name, type, baseType, indexed, comps, arrayLength, arrayChildren);
		}
		const name = obj.name;
		assertArgument(!name || typeof name === "string" && name.match(regexId), "invalid name", "obj.name", name);
		let indexed = obj.indexed;
		if (indexed != null) {
			assertArgument(allowIndexed, "parameter cannot be indexed", "obj.indexed", obj.indexed);
			indexed = !!indexed;
		}
		let type = obj.type;
		let arrayMatch = type.match(regexArrayType);
		if (arrayMatch) {
			const arrayLength = parseInt(arrayMatch[2] || "-1");
			const arrayChildren = ParamType.from({
				type: arrayMatch[1],
				components: obj.components
			});
			return new ParamType(_guard, name || "", type, "array", indexed, null, arrayLength, arrayChildren);
		}
		if (type === "tuple" || type.startsWith("tuple(") || type.startsWith("(")) {
			const comps = obj.components != null ? obj.components.map((c) => ParamType.from(c)) : null;
			return new ParamType(_guard, name || "", type, "tuple", indexed, comps, null, null);
		}
		type = verifyBasicType(obj.type);
		return new ParamType(_guard, name || "", type, type, indexed, null, null, null);
	}
	/**
	*  Returns true if %%value%% is a **ParamType**.
	*/
	static isParamType(value) {
		return value && value[internal$1] === ParamTypeInternal;
	}
};
/**
*  An abstract class to represent An individual fragment from a parse ABI.
*/
var Fragment = class Fragment {
	/**
	*  The type of the fragment.
	*/
	type;
	/**
	*  The inputs for the fragment.
	*/
	inputs;
	/**
	*  @private
	*/
	constructor(guard, type, inputs) {
		assertPrivate(guard, _guard, "Fragment");
		inputs = Object.freeze(inputs.slice());
		defineProperties(this, {
			type,
			inputs
		});
	}
	/**
	*  Creates a new **Fragment** for %%obj%%, wich can be any supported
	*  ABI frgament type.
	*/
	static from(obj) {
		if (typeof obj === "string") {
			try {
				Fragment.from(JSON.parse(obj));
			} catch (e) {}
			return Fragment.from(lex(obj));
		}
		if (obj instanceof TokenString) switch (obj.peekKeyword(KwTypes)) {
			case "constructor": return ConstructorFragment.from(obj);
			case "error": return ErrorFragment.from(obj);
			case "event": return EventFragment.from(obj);
			case "fallback":
			case "receive": return FallbackFragment.from(obj);
			case "function": return FunctionFragment.from(obj);
			case "struct": return StructFragment.from(obj);
		}
		else if (typeof obj === "object") {
			switch (obj.type) {
				case "constructor": return ConstructorFragment.from(obj);
				case "error": return ErrorFragment.from(obj);
				case "event": return EventFragment.from(obj);
				case "fallback":
				case "receive": return FallbackFragment.from(obj);
				case "function": return FunctionFragment.from(obj);
				case "struct": return StructFragment.from(obj);
			}
			assert(false, `unsupported type: ${obj.type}`, "UNSUPPORTED_OPERATION", { operation: "Fragment.from" });
		}
		assertArgument(false, "unsupported frgament object", "obj", obj);
	}
	/**
	*  Returns true if %%value%% is a [[ConstructorFragment]].
	*/
	static isConstructor(value) {
		return ConstructorFragment.isFragment(value);
	}
	/**
	*  Returns true if %%value%% is an [[ErrorFragment]].
	*/
	static isError(value) {
		return ErrorFragment.isFragment(value);
	}
	/**
	*  Returns true if %%value%% is an [[EventFragment]].
	*/
	static isEvent(value) {
		return EventFragment.isFragment(value);
	}
	/**
	*  Returns true if %%value%% is a [[FunctionFragment]].
	*/
	static isFunction(value) {
		return FunctionFragment.isFragment(value);
	}
	/**
	*  Returns true if %%value%% is a [[StructFragment]].
	*/
	static isStruct(value) {
		return StructFragment.isFragment(value);
	}
};
/**
*  An abstract class to represent An individual fragment
*  which has a name from a parse ABI.
*/
var NamedFragment = class extends Fragment {
	/**
	*  The name of the fragment.
	*/
	name;
	/**
	*  @private
	*/
	constructor(guard, type, name, inputs) {
		super(guard, type, inputs);
		assertArgument(typeof name === "string" && name.match(regexId), "invalid identifier", "name", name);
		inputs = Object.freeze(inputs.slice());
		defineProperties(this, { name });
	}
};
function joinParams(format, params) {
	return "(" + params.map((p) => p.format(format)).join(format === "full" ? ", " : ",") + ")";
}
/**
*  A Fragment which represents a //Custom Error//.
*/
var ErrorFragment = class ErrorFragment extends NamedFragment {
	/**
	*  @private
	*/
	constructor(guard, name, inputs) {
		super(guard, "error", name, inputs);
		Object.defineProperty(this, internal$1, { value: ErrorFragmentInternal });
	}
	/**
	*  The Custom Error selector.
	*/
	get selector() {
		return id(this.format("sighash")).substring(0, 10);
	}
	/**
	*  Returns a string representation of this fragment as %%format%%.
	*/
	format(format) {
		if (format == null) format = "sighash";
		if (format === "json") return JSON.stringify({
			type: "error",
			name: this.name,
			inputs: this.inputs.map((input) => JSON.parse(input.format(format)))
		});
		const result = [];
		if (format !== "sighash") result.push("error");
		result.push(this.name + joinParams(format, this.inputs));
		return result.join(" ");
	}
	/**
	*  Returns a new **ErrorFragment** for %%obj%%.
	*/
	static from(obj) {
		if (ErrorFragment.isFragment(obj)) return obj;
		if (typeof obj === "string") return ErrorFragment.from(lex(obj));
		else if (obj instanceof TokenString) {
			const name = consumeName("error", obj);
			const inputs = consumeParams(obj);
			consumeEoi(obj);
			return new ErrorFragment(_guard, name, inputs);
		}
		return new ErrorFragment(_guard, obj.name, obj.inputs ? obj.inputs.map(ParamType.from) : []);
	}
	/**
	*  Returns ``true`` and provides a type guard if %%value%% is an
	*  **ErrorFragment**.
	*/
	static isFragment(value) {
		return value && value[internal$1] === ErrorFragmentInternal;
	}
};
/**
*  A Fragment which represents an Event.
*/
var EventFragment = class EventFragment extends NamedFragment {
	/**
	*  Whether this event is anonymous.
	*/
	anonymous;
	/**
	*  @private
	*/
	constructor(guard, name, inputs, anonymous) {
		super(guard, "event", name, inputs);
		Object.defineProperty(this, internal$1, { value: EventFragmentInternal });
		defineProperties(this, { anonymous });
	}
	/**
	*  The Event topic hash.
	*/
	get topicHash() {
		return id(this.format("sighash"));
	}
	/**
	*  Returns a string representation of this event as %%format%%.
	*/
	format(format) {
		if (format == null) format = "sighash";
		if (format === "json") return JSON.stringify({
			type: "event",
			anonymous: this.anonymous,
			name: this.name,
			inputs: this.inputs.map((i) => JSON.parse(i.format(format)))
		});
		const result = [];
		if (format !== "sighash") result.push("event");
		result.push(this.name + joinParams(format, this.inputs));
		if (format !== "sighash" && this.anonymous) result.push("anonymous");
		return result.join(" ");
	}
	/**
	*  Return the topic hash for an event with %%name%% and %%params%%.
	*/
	static getTopicHash(name, params) {
		params = (params || []).map((p) => ParamType.from(p));
		return new EventFragment(_guard, name, params, false).topicHash;
	}
	/**
	*  Returns a new **EventFragment** for %%obj%%.
	*/
	static from(obj) {
		if (EventFragment.isFragment(obj)) return obj;
		if (typeof obj === "string") try {
			return EventFragment.from(lex(obj));
		} catch (error) {
			assertArgument(false, "invalid event fragment", "obj", obj);
		}
		else if (obj instanceof TokenString) {
			const name = consumeName("event", obj);
			const inputs = consumeParams(obj, true);
			const anonymous = !!consumeKeywords(obj, setify(["anonymous"])).has("anonymous");
			consumeEoi(obj);
			return new EventFragment(_guard, name, inputs, anonymous);
		}
		return new EventFragment(_guard, obj.name, obj.inputs ? obj.inputs.map((p) => ParamType.from(p, true)) : [], !!obj.anonymous);
	}
	/**
	*  Returns ``true`` and provides a type guard if %%value%% is an
	*  **EventFragment**.
	*/
	static isFragment(value) {
		return value && value[internal$1] === EventFragmentInternal;
	}
};
/**
*  A Fragment which represents a constructor.
*/
var ConstructorFragment = class ConstructorFragment extends Fragment {
	/**
	*  Whether the constructor can receive an endowment.
	*/
	payable;
	/**
	*  The recommended gas limit for deployment or ``null``.
	*/
	gas;
	/**
	*  @private
	*/
	constructor(guard, type, inputs, payable, gas) {
		super(guard, type, inputs);
		Object.defineProperty(this, internal$1, { value: ConstructorFragmentInternal });
		defineProperties(this, {
			payable,
			gas
		});
	}
	/**
	*  Returns a string representation of this constructor as %%format%%.
	*/
	format(format) {
		assert(format != null && format !== "sighash", "cannot format a constructor for sighash", "UNSUPPORTED_OPERATION", { operation: "format(sighash)" });
		if (format === "json") return JSON.stringify({
			type: "constructor",
			stateMutability: this.payable ? "payable" : "undefined",
			payable: this.payable,
			gas: this.gas != null ? this.gas : void 0,
			inputs: this.inputs.map((i) => JSON.parse(i.format(format)))
		});
		const result = [`constructor${joinParams(format, this.inputs)}`];
		if (this.payable) result.push("payable");
		if (this.gas != null) result.push(`@${this.gas.toString()}`);
		return result.join(" ");
	}
	/**
	*  Returns a new **ConstructorFragment** for %%obj%%.
	*/
	static from(obj) {
		if (ConstructorFragment.isFragment(obj)) return obj;
		if (typeof obj === "string") try {
			return ConstructorFragment.from(lex(obj));
		} catch (error) {
			assertArgument(false, "invalid constuctor fragment", "obj", obj);
		}
		else if (obj instanceof TokenString) {
			consumeKeywords(obj, setify(["constructor"]));
			const inputs = consumeParams(obj);
			const payable = !!consumeKeywords(obj, KwVisibDeploy).has("payable");
			const gas = consumeGas(obj);
			consumeEoi(obj);
			return new ConstructorFragment(_guard, "constructor", inputs, payable, gas);
		}
		return new ConstructorFragment(_guard, "constructor", obj.inputs ? obj.inputs.map(ParamType.from) : [], !!obj.payable, obj.gas != null ? obj.gas : null);
	}
	/**
	*  Returns ``true`` and provides a type guard if %%value%% is a
	*  **ConstructorFragment**.
	*/
	static isFragment(value) {
		return value && value[internal$1] === ConstructorFragmentInternal;
	}
};
/**
*  A Fragment which represents a method.
*/
var FallbackFragment = class FallbackFragment extends Fragment {
	/**
	*  If the function can be sent value during invocation.
	*/
	payable;
	constructor(guard, inputs, payable) {
		super(guard, "fallback", inputs);
		Object.defineProperty(this, internal$1, { value: FallbackFragmentInternal });
		defineProperties(this, { payable });
	}
	/**
	*  Returns a string representation of this fallback as %%format%%.
	*/
	format(format) {
		const type = this.inputs.length === 0 ? "receive" : "fallback";
		if (format === "json") {
			const stateMutability = this.payable ? "payable" : "nonpayable";
			return JSON.stringify({
				type,
				stateMutability
			});
		}
		return `${type}()${this.payable ? " payable" : ""}`;
	}
	/**
	*  Returns a new **FallbackFragment** for %%obj%%.
	*/
	static from(obj) {
		if (FallbackFragment.isFragment(obj)) return obj;
		if (typeof obj === "string") try {
			return FallbackFragment.from(lex(obj));
		} catch (error) {
			assertArgument(false, "invalid fallback fragment", "obj", obj);
		}
		else if (obj instanceof TokenString) {
			const errorObj = obj.toString();
			assertArgument(obj.peekKeyword(setify(["fallback", "receive"])), "type must be fallback or receive", "obj", errorObj);
			if (obj.popKeyword(setify(["fallback", "receive"])) === "receive") {
				const inputs = consumeParams(obj);
				assertArgument(inputs.length === 0, `receive cannot have arguments`, "obj.inputs", inputs);
				consumeKeywords(obj, setify(["payable"]));
				consumeEoi(obj);
				return new FallbackFragment(_guard, [], true);
			}
			let inputs = consumeParams(obj);
			if (inputs.length) assertArgument(inputs.length === 1 && inputs[0].type === "bytes", "invalid fallback inputs", "obj.inputs", inputs.map((i) => i.format("minimal")).join(", "));
			else inputs = [ParamType.from("bytes")];
			const mutability = consumeMutability(obj);
			assertArgument(mutability === "nonpayable" || mutability === "payable", "fallback cannot be constants", "obj.stateMutability", mutability);
			if (consumeKeywords(obj, setify(["returns"])).has("returns")) {
				const outputs = consumeParams(obj);
				assertArgument(outputs.length === 1 && outputs[0].type === "bytes", "invalid fallback outputs", "obj.outputs", outputs.map((i) => i.format("minimal")).join(", "));
			}
			consumeEoi(obj);
			return new FallbackFragment(_guard, inputs, mutability === "payable");
		}
		if (obj.type === "receive") return new FallbackFragment(_guard, [], true);
		if (obj.type === "fallback") {
			const inputs = [ParamType.from("bytes")];
			const payable = obj.stateMutability === "payable";
			return new FallbackFragment(_guard, inputs, payable);
		}
		assertArgument(false, "invalid fallback description", "obj", obj);
	}
	/**
	*  Returns ``true`` and provides a type guard if %%value%% is a
	*  **FallbackFragment**.
	*/
	static isFragment(value) {
		return value && value[internal$1] === FallbackFragmentInternal;
	}
};
/**
*  A Fragment which represents a method.
*/
var FunctionFragment = class FunctionFragment extends NamedFragment {
	/**
	*  If the function is constant (e.g. ``pure`` or ``view`` functions).
	*/
	constant;
	/**
	*  The returned types for the result of calling this function.
	*/
	outputs;
	/**
	*  The state mutability (e.g. ``payable``, ``nonpayable``, ``view``
	*  or ``pure``)
	*/
	stateMutability;
	/**
	*  If the function can be sent value during invocation.
	*/
	payable;
	/**
	*  The recommended gas limit to send when calling this function.
	*/
	gas;
	/**
	*  @private
	*/
	constructor(guard, name, stateMutability, inputs, outputs, gas) {
		super(guard, "function", name, inputs);
		Object.defineProperty(this, internal$1, { value: FunctionFragmentInternal });
		outputs = Object.freeze(outputs.slice());
		const constant = stateMutability === "view" || stateMutability === "pure";
		const payable = stateMutability === "payable";
		defineProperties(this, {
			constant,
			gas,
			outputs,
			payable,
			stateMutability
		});
	}
	/**
	*  The Function selector.
	*/
	get selector() {
		return id(this.format("sighash")).substring(0, 10);
	}
	/**
	*  Returns a string representation of this function as %%format%%.
	*/
	format(format) {
		if (format == null) format = "sighash";
		if (format === "json") return JSON.stringify({
			type: "function",
			name: this.name,
			constant: this.constant,
			stateMutability: this.stateMutability !== "nonpayable" ? this.stateMutability : void 0,
			payable: this.payable,
			gas: this.gas != null ? this.gas : void 0,
			inputs: this.inputs.map((i) => JSON.parse(i.format(format))),
			outputs: this.outputs.map((o) => JSON.parse(o.format(format)))
		});
		const result = [];
		if (format !== "sighash") result.push("function");
		result.push(this.name + joinParams(format, this.inputs));
		if (format !== "sighash") {
			if (this.stateMutability !== "nonpayable") result.push(this.stateMutability);
			if (this.outputs && this.outputs.length) {
				result.push("returns");
				result.push(joinParams(format, this.outputs));
			}
			if (this.gas != null) result.push(`@${this.gas.toString()}`);
		}
		return result.join(" ");
	}
	/**
	*  Return the selector for a function with %%name%% and %%params%%.
	*/
	static getSelector(name, params) {
		params = (params || []).map((p) => ParamType.from(p));
		return new FunctionFragment(_guard, name, "view", params, [], null).selector;
	}
	/**
	*  Returns a new **FunctionFragment** for %%obj%%.
	*/
	static from(obj) {
		if (FunctionFragment.isFragment(obj)) return obj;
		if (typeof obj === "string") try {
			return FunctionFragment.from(lex(obj));
		} catch (error) {
			assertArgument(false, "invalid function fragment", "obj", obj);
		}
		else if (obj instanceof TokenString) {
			const name = consumeName("function", obj);
			const inputs = consumeParams(obj);
			const mutability = consumeMutability(obj);
			let outputs = [];
			if (consumeKeywords(obj, setify(["returns"])).has("returns")) outputs = consumeParams(obj);
			const gas = consumeGas(obj);
			consumeEoi(obj);
			return new FunctionFragment(_guard, name, mutability, inputs, outputs, gas);
		}
		let stateMutability = obj.stateMutability;
		if (stateMutability == null) {
			stateMutability = "payable";
			if (typeof obj.constant === "boolean") {
				stateMutability = "view";
				if (!obj.constant) {
					stateMutability = "payable";
					if (typeof obj.payable === "boolean" && !obj.payable) stateMutability = "nonpayable";
				}
			} else if (typeof obj.payable === "boolean" && !obj.payable) stateMutability = "nonpayable";
		}
		return new FunctionFragment(_guard, obj.name, stateMutability, obj.inputs ? obj.inputs.map(ParamType.from) : [], obj.outputs ? obj.outputs.map(ParamType.from) : [], obj.gas != null ? obj.gas : null);
	}
	/**
	*  Returns ``true`` and provides a type guard if %%value%% is a
	*  **FunctionFragment**.
	*/
	static isFragment(value) {
		return value && value[internal$1] === FunctionFragmentInternal;
	}
};
/**
*  A Fragment which represents a structure.
*/
var StructFragment = class StructFragment extends NamedFragment {
	/**
	*  @private
	*/
	constructor(guard, name, inputs) {
		super(guard, "struct", name, inputs);
		Object.defineProperty(this, internal$1, { value: StructFragmentInternal });
	}
	/**
	*  Returns a string representation of this struct as %%format%%.
	*/
	format() {
		throw new Error("@TODO");
	}
	/**
	*  Returns a new **StructFragment** for %%obj%%.
	*/
	static from(obj) {
		if (typeof obj === "string") try {
			return StructFragment.from(lex(obj));
		} catch (error) {
			assertArgument(false, "invalid struct fragment", "obj", obj);
		}
		else if (obj instanceof TokenString) {
			const name = consumeName("struct", obj);
			const inputs = consumeParams(obj);
			consumeEoi(obj);
			return new StructFragment(_guard, name, inputs);
		}
		return new StructFragment(_guard, obj.name, obj.inputs ? obj.inputs.map(ParamType.from) : []);
	}
	/**
	*  Returns ``true`` and provides a type guard if %%value%% is a
	*  **StructFragment**.
	*/
	static isFragment(value) {
		return value && value[internal$1] === StructFragmentInternal;
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/abi-coder.js
/**
*  When sending values to or receiving values from a [[Contract]], the
*  data is generally encoded using the [ABI standard](link-solc-abi).
*
*  The AbiCoder provides a utility to encode values to ABI data and
*  decode values from ABI data.
*
*  Most of the time, developers should favour the [[Contract]] class,
*  which further abstracts a lot of the finer details of ABI data.
*
*  @_section api/abi/abi-coder:ABI Encoding
*/
var PanicReasons$1 = /* @__PURE__ */ new Map();
PanicReasons$1.set(0, "GENERIC_PANIC");
PanicReasons$1.set(1, "ASSERT_FALSE");
PanicReasons$1.set(17, "OVERFLOW");
PanicReasons$1.set(18, "DIVIDE_BY_ZERO");
PanicReasons$1.set(33, "ENUM_RANGE_ERROR");
PanicReasons$1.set(34, "BAD_STORAGE_DATA");
PanicReasons$1.set(49, "STACK_UNDERFLOW");
PanicReasons$1.set(50, "ARRAY_RANGE_ERROR");
PanicReasons$1.set(65, "OUT_OF_MEMORY");
PanicReasons$1.set(81, "UNINITIALIZED_FUNCTION_CALL");
var paramTypeBytes = /* @__PURE__ */ new RegExp(/^bytes([0-9]*)$/);
var paramTypeNumber = /* @__PURE__ */ new RegExp(/^(u?int)([0-9]*)$/);
var defaultCoder = null;
var defaultMaxInflation = 1024;
function getBuiltinCallException(action, tx, data, abiCoder) {
	let message = "missing revert data";
	let reason = null;
	const invocation = null;
	let revert = null;
	if (data) {
		message = "execution reverted";
		const bytes = getBytes(data);
		data = hexlify(data);
		if (bytes.length === 0) {
			message += " (no data present; likely require(false) occurred";
			reason = "require(false)";
		} else if (bytes.length % 32 !== 4) message += " (could not decode reason; invalid data length)";
		else if (hexlify(bytes.slice(0, 4)) === "0x08c379a0") try {
			reason = abiCoder.decode(["string"], bytes.slice(4))[0];
			revert = {
				signature: "Error(string)",
				name: "Error",
				args: [reason]
			};
			message += `: ${JSON.stringify(reason)}`;
		} catch (error) {
			message += " (could not decode reason; invalid string data)";
		}
		else if (hexlify(bytes.slice(0, 4)) === "0x4e487b71") try {
			const code = Number(abiCoder.decode(["uint256"], bytes.slice(4))[0]);
			revert = {
				signature: "Panic(uint256)",
				name: "Panic",
				args: [code]
			};
			reason = `Panic due to ${PanicReasons$1.get(code) || "UNKNOWN"}(${code})`;
			message += `: ${reason}`;
		} catch (error) {
			message += " (could not decode panic code)";
		}
		else message += " (unknown custom error)";
	}
	const transaction = {
		to: tx.to ? getAddress(tx.to) : null,
		data: tx.data || "0x"
	};
	if (tx.from) transaction.from = getAddress(tx.from);
	return makeError(message, "CALL_EXCEPTION", {
		action,
		data,
		reason,
		transaction,
		invocation,
		revert
	});
}
/**
*  The **AbiCoder** is a low-level class responsible for encoding JavaScript
*  values into binary data and decoding binary data into JavaScript values.
*/
var AbiCoder = class AbiCoder {
	#getCoder(param) {
		if (param.isArray()) return new ArrayCoder(this.#getCoder(param.arrayChildren), param.arrayLength, param.name);
		if (param.isTuple()) return new TupleCoder(param.components.map((c) => this.#getCoder(c)), param.name);
		switch (param.baseType) {
			case "address": return new AddressCoder(param.name);
			case "bool": return new BooleanCoder(param.name);
			case "string": return new StringCoder(param.name);
			case "bytes": return new BytesCoder(param.name);
			case "": return new NullCoder(param.name);
		}
		let match = param.type.match(paramTypeNumber);
		if (match) {
			let size = parseInt(match[2] || "256");
			assertArgument(size !== 0 && size <= 256 && size % 8 === 0, "invalid " + match[1] + " bit length", "param", param);
			return new NumberCoder(size / 8, match[1] === "int", param.name);
		}
		match = param.type.match(paramTypeBytes);
		if (match) {
			let size = parseInt(match[1]);
			assertArgument(size !== 0 && size <= 32, "invalid bytes length", "param", param);
			return new FixedBytesCoder(size, param.name);
		}
		assertArgument(false, "invalid type", "type", param.type);
	}
	/**
	*  Get the default values for the given %%types%%.
	*
	*  For example, a ``uint`` is by default ``0`` and ``bool``
	*  is by default ``false``.
	*/
	getDefaultValue(types) {
		return new TupleCoder(types.map((type) => this.#getCoder(ParamType.from(type))), "_").defaultValue();
	}
	/**
	*  Encode the %%values%% as the %%types%% into ABI data.
	*
	*  @returns DataHexstring
	*/
	encode(types, values) {
		assertArgumentCount(values.length, types.length, "types/values length mismatch");
		const coder = new TupleCoder(types.map((type) => this.#getCoder(ParamType.from(type))), "_");
		const writer = new Writer();
		coder.encode(writer, values);
		return writer.data;
	}
	/**
	*  Decode the ABI %%data%% as the %%types%% into values.
	*
	*  If %%loose%% decoding is enabled, then strict padding is
	*  not enforced. Some older versions of Solidity incorrectly
	*  padded event data emitted from ``external`` functions.
	*/
	decode(types, data, loose) {
		return new TupleCoder(types.map((type) => this.#getCoder(ParamType.from(type))), "_").decode(new Reader(data, loose, defaultMaxInflation));
	}
	static _setDefaultMaxInflation(value) {
		assertArgument(typeof value === "number" && Number.isInteger(value), "invalid defaultMaxInflation factor", "value", value);
		defaultMaxInflation = value;
	}
	/**
	*  Returns the shared singleton instance of a default [[AbiCoder]].
	*
	*  On the first call, the instance is created internally.
	*/
	static defaultAbiCoder() {
		if (defaultCoder == null) defaultCoder = new AbiCoder();
		return defaultCoder;
	}
	/**
	*  Returns an ethers-compatible [[CallExceptionError]] Error for the given
	*  result %%data%% for the [[CallExceptionAction]] %%action%% against
	*  the Transaction %%tx%%.
	*/
	static getBuiltinCallException(action, tx, data) {
		return getBuiltinCallException(action, tx, data, AbiCoder.defaultAbiCoder());
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/abi/interface.js
/**
*  The Interface class is a low-level class that accepts an
*  ABI and provides all the necessary functionality to encode
*  and decode paramaters to and results from methods, events
*  and errors.
*
*  It also provides several convenience methods to automatically
*  search and find matching transactions and events to parse them.
*
*  @_subsection api/abi:Interfaces  [interfaces]
*/
/**
*  When using the [[Interface-parseLog]] to automatically match a Log to its event
*  for parsing, a **LogDescription** is returned.
*/
var LogDescription = class {
	/**
	*  The matching fragment for the ``topic0``.
	*/
	fragment;
	/**
	*  The name of the Event.
	*/
	name;
	/**
	*  The full Event signature.
	*/
	signature;
	/**
	*  The topic hash for the Event.
	*/
	topic;
	/**
	*  The arguments passed into the Event with ``emit``.
	*/
	args;
	/**
	*  @_ignore:
	*/
	constructor(fragment, topic, args) {
		const name = fragment.name, signature = fragment.format();
		defineProperties(this, {
			fragment,
			name,
			signature,
			topic,
			args
		});
	}
};
/**
*  When using the [[Interface-parseTransaction]] to automatically match
*  a transaction data to its function for parsing,
*  a **TransactionDescription** is returned.
*/
var TransactionDescription = class {
	/**
	*  The matching fragment from the transaction ``data``.
	*/
	fragment;
	/**
	*  The name of the Function from the transaction ``data``.
	*/
	name;
	/**
	*  The arguments passed to the Function from the transaction ``data``.
	*/
	args;
	/**
	*  The full Function signature from the transaction ``data``.
	*/
	signature;
	/**
	*  The selector for the Function from the transaction ``data``.
	*/
	selector;
	/**
	*  The ``value`` (in wei) from the transaction.
	*/
	value;
	/**
	*  @_ignore:
	*/
	constructor(fragment, selector, args, value) {
		const name = fragment.name, signature = fragment.format();
		defineProperties(this, {
			fragment,
			name,
			args,
			signature,
			selector,
			value
		});
	}
};
/**
*  When using the [[Interface-parseError]] to automatically match an
*  error for a call result for parsing, an **ErrorDescription** is returned.
*/
var ErrorDescription = class {
	/**
	*  The matching fragment.
	*/
	fragment;
	/**
	*  The name of the Error.
	*/
	name;
	/**
	*  The arguments passed to the Error with ``revert``.
	*/
	args;
	/**
	*  The full Error signature.
	*/
	signature;
	/**
	*  The selector for the Error.
	*/
	selector;
	/**
	*  @_ignore:
	*/
	constructor(fragment, selector, args) {
		const name = fragment.name, signature = fragment.format();
		defineProperties(this, {
			fragment,
			name,
			args,
			signature,
			selector
		});
	}
};
/**
*  An **Indexed** is used as a value when a value that does not
*  fit within a topic (i.e. not a fixed-length, 32-byte type). It
*  is the ``keccak256`` of the value, and used for types such as
*  arrays, tuples, bytes and strings.
*/
var Indexed = class {
	/**
	*  The ``keccak256`` of the value logged.
	*/
	hash;
	/**
	*  @_ignore:
	*/
	_isIndexed;
	/**
	*  Returns ``true`` if %%value%% is an **Indexed**.
	*
	*  This provides a Type Guard for property access.
	*/
	static isIndexed(value) {
		return !!(value && value._isIndexed);
	}
	/**
	*  @_ignore:
	*/
	constructor(hash) {
		defineProperties(this, {
			hash,
			_isIndexed: true
		});
	}
};
var PanicReasons = {
	"0": "generic panic",
	"1": "assert(false)",
	"17": "arithmetic overflow",
	"18": "division or modulo by zero",
	"33": "enum overflow",
	"34": "invalid encoded storage byte array accessed",
	"49": "out-of-bounds array access; popping on an empty array",
	"50": "out-of-bounds access of an array or bytesN",
	"65": "out of memory",
	"81": "uninitialized function"
};
var BuiltinErrors = {
	"0x08c379a0": {
		signature: "Error(string)",
		name: "Error",
		inputs: ["string"],
		reason: (message) => {
			return `reverted with reason string ${JSON.stringify(message)}`;
		}
	},
	"0x4e487b71": {
		signature: "Panic(uint256)",
		name: "Panic",
		inputs: ["uint256"],
		reason: (code) => {
			let reason = "unknown panic code";
			if (code >= 0 && code <= 255 && PanicReasons[code.toString()]) reason = PanicReasons[code.toString()];
			return `reverted with panic code 0x${code.toString(16)} (${reason})`;
		}
	}
};
/**
*  An Interface abstracts many of the low-level details for
*  encoding and decoding the data on the blockchain.
*
*  An ABI provides information on how to encode data to send to
*  a Contract, how to decode the results and events and how to
*  interpret revert errors.
*
*  The ABI can be specified by [any supported format](InterfaceAbi).
*/
var Interface = class Interface {
	/**
	*  All the Contract ABI members (i.e. methods, events, errors, etc).
	*/
	fragments;
	/**
	*  The Contract constructor.
	*/
	deploy;
	/**
	*  The Fallback method, if any.
	*/
	fallback;
	/**
	*  If receiving ether is supported.
	*/
	receive;
	#errors;
	#events;
	#functions;
	#abiCoder;
	/**
	*  Create a new Interface for the %%fragments%%.
	*/
	constructor(fragments) {
		let abi = [];
		if (typeof fragments === "string") abi = JSON.parse(fragments);
		else abi = fragments;
		this.#functions = /* @__PURE__ */ new Map();
		this.#errors = /* @__PURE__ */ new Map();
		this.#events = /* @__PURE__ */ new Map();
		const frags = [];
		for (const a of abi) try {
			frags.push(Fragment.from(a));
		} catch (error) {
			console.log(`[Warning] Invalid Fragment ${JSON.stringify(a)}:`, error.message);
		}
		defineProperties(this, { fragments: Object.freeze(frags) });
		let fallback = null;
		let receive = false;
		this.#abiCoder = this.getAbiCoder();
		this.fragments.forEach((fragment, index) => {
			let bucket;
			switch (fragment.type) {
				case "constructor":
					if (this.deploy) {
						console.log("duplicate definition - constructor");
						return;
					}
					defineProperties(this, { deploy: fragment });
					return;
				case "fallback":
					if (fragment.inputs.length === 0) receive = true;
					else {
						assertArgument(!fallback || fragment.payable !== fallback.payable, "conflicting fallback fragments", `fragments[${index}]`, fragment);
						fallback = fragment;
						receive = fallback.payable;
					}
					return;
				case "function":
					bucket = this.#functions;
					break;
				case "event":
					bucket = this.#events;
					break;
				case "error":
					bucket = this.#errors;
					break;
				default: return;
			}
			const signature = fragment.format();
			if (bucket.has(signature)) return;
			bucket.set(signature, fragment);
		});
		if (!this.deploy) defineProperties(this, { deploy: ConstructorFragment.from("constructor()") });
		defineProperties(this, {
			fallback,
			receive
		});
	}
	/**
	*  Returns the entire Human-Readable ABI, as an array of
	*  signatures, optionally as %%minimal%% strings, which
	*  removes parameter names and unneceesary spaces.
	*/
	format(minimal) {
		const format = minimal ? "minimal" : "full";
		return this.fragments.map((f) => f.format(format));
	}
	/**
	*  Return the JSON-encoded ABI. This is the format Solidiy
	*  returns.
	*/
	formatJson() {
		const abi = this.fragments.map((f) => f.format("json"));
		return JSON.stringify(abi.map((j) => JSON.parse(j)));
	}
	/**
	*  The ABI coder that will be used to encode and decode binary
	*  data.
	*/
	getAbiCoder() {
		return AbiCoder.defaultAbiCoder();
	}
	#getFunction(key, values, forceUnique) {
		if (isHexString(key)) {
			const selector = key.toLowerCase();
			for (const fragment of this.#functions.values()) if (selector === fragment.selector) return fragment;
			return null;
		}
		if (key.indexOf("(") === -1) {
			const matching = [];
			for (const [name, fragment] of this.#functions) if (name.split("(")[0] === key) matching.push(fragment);
			if (values) {
				const lastValue = values.length > 0 ? values[values.length - 1] : null;
				let valueLength = values.length;
				let allowOptions = true;
				if (Typed.isTyped(lastValue) && lastValue.type === "overrides") {
					allowOptions = false;
					valueLength--;
				}
				for (let i = matching.length - 1; i >= 0; i--) {
					const inputs = matching[i].inputs.length;
					if (inputs !== valueLength && (!allowOptions || inputs !== valueLength - 1)) matching.splice(i, 1);
				}
				for (let i = matching.length - 1; i >= 0; i--) {
					const inputs = matching[i].inputs;
					for (let j = 0; j < values.length; j++) {
						if (!Typed.isTyped(values[j])) continue;
						if (j >= inputs.length) {
							if (values[j].type === "overrides") continue;
							matching.splice(i, 1);
							break;
						}
						if (values[j].type !== inputs[j].baseType) {
							matching.splice(i, 1);
							break;
						}
					}
				}
			}
			if (matching.length === 1 && values && values.length !== matching[0].inputs.length) {
				const lastArg = values[values.length - 1];
				if (lastArg == null || Array.isArray(lastArg) || typeof lastArg !== "object") matching.splice(0, 1);
			}
			if (matching.length === 0) return null;
			if (matching.length > 1 && forceUnique) assertArgument(false, `ambiguous function description (i.e. matches ${matching.map((m) => JSON.stringify(m.format())).join(", ")})`, "key", key);
			return matching[0];
		}
		const result = this.#functions.get(FunctionFragment.from(key).format());
		if (result) return result;
		return null;
	}
	/**
	*  Get the function name for %%key%%, which may be a function selector,
	*  function name or function signature that belongs to the ABI.
	*/
	getFunctionName(key) {
		const fragment = this.#getFunction(key, null, false);
		assertArgument(fragment, "no matching function", "key", key);
		return fragment.name;
	}
	/**
	*  Returns true if %%key%% (a function selector, function name or
	*  function signature) is present in the ABI.
	*
	*  In the case of a function name, the name may be ambiguous, so
	*  accessing the [[FunctionFragment]] may require refinement.
	*/
	hasFunction(key) {
		return !!this.#getFunction(key, null, false);
	}
	/**
	*  Get the [[FunctionFragment]] for %%key%%, which may be a function
	*  selector, function name or function signature that belongs to the ABI.
	*
	*  If %%values%% is provided, it will use the Typed API to handle
	*  ambiguous cases where multiple functions match by name.
	*
	*  If the %%key%% and %%values%% do not refine to a single function in
	*  the ABI, this will throw.
	*/
	getFunction(key, values) {
		return this.#getFunction(key, values || null, true);
	}
	/**
	*  Iterate over all functions, calling %%callback%%, sorted by their name.
	*/
	forEachFunction(callback) {
		const names = Array.from(this.#functions.keys());
		names.sort((a, b) => a.localeCompare(b));
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			callback(this.#functions.get(name), i);
		}
	}
	#getEvent(key, values, forceUnique) {
		if (isHexString(key)) {
			const eventTopic = key.toLowerCase();
			for (const fragment of this.#events.values()) if (eventTopic === fragment.topicHash) return fragment;
			return null;
		}
		if (key.indexOf("(") === -1) {
			const matching = [];
			for (const [name, fragment] of this.#events) if (name.split("(")[0] === key) matching.push(fragment);
			if (values) {
				for (let i = matching.length - 1; i >= 0; i--) if (matching[i].inputs.length < values.length) matching.splice(i, 1);
				for (let i = matching.length - 1; i >= 0; i--) {
					const inputs = matching[i].inputs;
					for (let j = 0; j < values.length; j++) {
						if (!Typed.isTyped(values[j])) continue;
						if (values[j].type !== inputs[j].baseType) {
							matching.splice(i, 1);
							break;
						}
					}
				}
			}
			if (matching.length === 0) return null;
			if (matching.length > 1 && forceUnique) assertArgument(false, `ambiguous event description (i.e. matches ${matching.map((m) => JSON.stringify(m.format())).join(", ")})`, "key", key);
			return matching[0];
		}
		const result = this.#events.get(EventFragment.from(key).format());
		if (result) return result;
		return null;
	}
	/**
	*  Get the event name for %%key%%, which may be a topic hash,
	*  event name or event signature that belongs to the ABI.
	*/
	getEventName(key) {
		const fragment = this.#getEvent(key, null, false);
		assertArgument(fragment, "no matching event", "key", key);
		return fragment.name;
	}
	/**
	*  Returns true if %%key%% (an event topic hash, event name or
	*  event signature) is present in the ABI.
	*
	*  In the case of an event name, the name may be ambiguous, so
	*  accessing the [[EventFragment]] may require refinement.
	*/
	hasEvent(key) {
		return !!this.#getEvent(key, null, false);
	}
	/**
	*  Get the [[EventFragment]] for %%key%%, which may be a topic hash,
	*  event name or event signature that belongs to the ABI.
	*
	*  If %%values%% is provided, it will use the Typed API to handle
	*  ambiguous cases where multiple events match by name.
	*
	*  If the %%key%% and %%values%% do not refine to a single event in
	*  the ABI, this will throw.
	*/
	getEvent(key, values) {
		return this.#getEvent(key, values || null, true);
	}
	/**
	*  Iterate over all events, calling %%callback%%, sorted by their name.
	*/
	forEachEvent(callback) {
		const names = Array.from(this.#events.keys());
		names.sort((a, b) => a.localeCompare(b));
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			callback(this.#events.get(name), i);
		}
	}
	/**
	*  Get the [[ErrorFragment]] for %%key%%, which may be an error
	*  selector, error name or error signature that belongs to the ABI.
	*
	*  If %%values%% is provided, it will use the Typed API to handle
	*  ambiguous cases where multiple errors match by name.
	*
	*  If the %%key%% and %%values%% do not refine to a single error in
	*  the ABI, this will throw.
	*/
	getError(key, values) {
		if (isHexString(key)) {
			const selector = key.toLowerCase();
			if (BuiltinErrors[selector]) return ErrorFragment.from(BuiltinErrors[selector].signature);
			for (const fragment of this.#errors.values()) if (selector === fragment.selector) return fragment;
			return null;
		}
		if (key.indexOf("(") === -1) {
			const matching = [];
			for (const [name, fragment] of this.#errors) if (name.split("(")[0] === key) matching.push(fragment);
			if (matching.length === 0) {
				if (key === "Error") return ErrorFragment.from("error Error(string)");
				if (key === "Panic") return ErrorFragment.from("error Panic(uint256)");
				return null;
			} else if (matching.length > 1) assertArgument(false, `ambiguous error description (i.e. ${matching.map((m) => JSON.stringify(m.format())).join(", ")})`, "name", key);
			return matching[0];
		}
		key = ErrorFragment.from(key).format();
		if (key === "Error(string)") return ErrorFragment.from("error Error(string)");
		if (key === "Panic(uint256)") return ErrorFragment.from("error Panic(uint256)");
		const result = this.#errors.get(key);
		if (result) return result;
		return null;
	}
	/**
	*  Iterate over all errors, calling %%callback%%, sorted by their name.
	*/
	forEachError(callback) {
		const names = Array.from(this.#errors.keys());
		names.sort((a, b) => a.localeCompare(b));
		for (let i = 0; i < names.length; i++) {
			const name = names[i];
			callback(this.#errors.get(name), i);
		}
	}
	_decodeParams(params, data) {
		return this.#abiCoder.decode(params, data);
	}
	_encodeParams(params, values) {
		return this.#abiCoder.encode(params, values);
	}
	/**
	*  Encodes a ``tx.data`` object for deploying the Contract with
	*  the %%values%% as the constructor arguments.
	*/
	encodeDeploy(values) {
		return this._encodeParams(this.deploy.inputs, values || []);
	}
	/**
	*  Decodes the result %%data%% (e.g. from an ``eth_call``) for the
	*  specified error (see [[getError]] for valid values for
	*  %%key%%).
	*
	*  Most developers should prefer the [[parseCallResult]] method instead,
	*  which will automatically detect a ``CALL_EXCEPTION`` and throw the
	*  corresponding error.
	*/
	decodeErrorResult(fragment, data) {
		if (typeof fragment === "string") {
			const f = this.getError(fragment);
			assertArgument(f, "unknown error", "fragment", fragment);
			fragment = f;
		}
		assertArgument(dataSlice(data, 0, 4) === fragment.selector, `data signature does not match error ${fragment.name}.`, "data", data);
		return this._decodeParams(fragment.inputs, dataSlice(data, 4));
	}
	/**
	*  Encodes the transaction revert data for a call result that
	*  reverted from the the Contract with the sepcified %%error%%
	*  (see [[getError]] for valid values for %%fragment%%) with the %%values%%.
	*
	*  This is generally not used by most developers, unless trying to mock
	*  a result from a Contract.
	*/
	encodeErrorResult(fragment, values) {
		if (typeof fragment === "string") {
			const f = this.getError(fragment);
			assertArgument(f, "unknown error", "fragment", fragment);
			fragment = f;
		}
		return concat([fragment.selector, this._encodeParams(fragment.inputs, values || [])]);
	}
	/**
	*  Decodes the %%data%% from a transaction ``tx.data`` for
	*  the function specified (see [[getFunction]] for valid values
	*  for %%fragment%%).
	*
	*  Most developers should prefer the [[parseTransaction]] method
	*  instead, which will automatically detect the fragment.
	*/
	decodeFunctionData(fragment, data) {
		if (typeof fragment === "string") {
			const f = this.getFunction(fragment);
			assertArgument(f, "unknown function", "fragment", fragment);
			fragment = f;
		}
		assertArgument(dataSlice(data, 0, 4) === fragment.selector, `data signature does not match function ${fragment.name}.`, "data", data);
		return this._decodeParams(fragment.inputs, dataSlice(data, 4));
	}
	/**
	*  Encodes the ``tx.data`` for a transaction that calls the function
	*  specified (see [[getFunction]] for valid values for %%fragment%%) with
	*  the %%values%%.
	*/
	encodeFunctionData(fragment, values) {
		if (typeof fragment === "string") {
			const f = this.getFunction(fragment);
			assertArgument(f, "unknown function", "fragment", fragment);
			fragment = f;
		}
		return concat([fragment.selector, this._encodeParams(fragment.inputs, values || [])]);
	}
	/**
	*  Decodes the result %%data%% (e.g. from an ``eth_call``) for the
	*  specified function (see [[getFunction]] for valid values for
	*  %%key%%).
	*
	*  Most developers should prefer the [[parseCallResult]] method instead,
	*  which will automatically detect a ``CALL_EXCEPTION`` and throw the
	*  corresponding error.
	*/
	decodeFunctionResult(fragment, data) {
		if (typeof fragment === "string") {
			const f = this.getFunction(fragment);
			assertArgument(f, "unknown function", "fragment", fragment);
			fragment = f;
		}
		let message = "invalid length for result data";
		const bytes = getBytesCopy(data);
		if (bytes.length % 32 === 0) try {
			return this.#abiCoder.decode(fragment.outputs, bytes);
		} catch (error) {
			message = "could not decode result data";
		}
		assert(false, message, "BAD_DATA", {
			value: hexlify(bytes),
			info: {
				method: fragment.name,
				signature: fragment.format()
			}
		});
	}
	makeError(_data, tx) {
		const data = getBytes(_data, "data");
		const error = AbiCoder.getBuiltinCallException("call", tx, data);
		if (error.message.startsWith("execution reverted (unknown custom error)")) {
			const selector = hexlify(data.slice(0, 4));
			const ef = this.getError(selector);
			if (ef) try {
				const args = this.#abiCoder.decode(ef.inputs, data.slice(4));
				error.revert = {
					name: ef.name,
					signature: ef.format(),
					args
				};
				error.reason = error.revert.signature;
				error.message = `execution reverted: ${error.reason}`;
			} catch (e) {
				error.message = `execution reverted (coult not decode custom error)`;
			}
		}
		const parsed = this.parseTransaction(tx);
		if (parsed) error.invocation = {
			method: parsed.name,
			signature: parsed.signature,
			args: parsed.args
		};
		return error;
	}
	/**
	*  Encodes the result data (e.g. from an ``eth_call``) for the
	*  specified function (see [[getFunction]] for valid values
	*  for %%fragment%%) with %%values%%.
	*
	*  This is generally not used by most developers, unless trying to mock
	*  a result from a Contract.
	*/
	encodeFunctionResult(fragment, values) {
		if (typeof fragment === "string") {
			const f = this.getFunction(fragment);
			assertArgument(f, "unknown function", "fragment", fragment);
			fragment = f;
		}
		return hexlify(this.#abiCoder.encode(fragment.outputs, values || []));
	}
	encodeFilterTopics(fragment, values) {
		if (typeof fragment === "string") {
			const f = this.getEvent(fragment);
			assertArgument(f, "unknown event", "eventFragment", fragment);
			fragment = f;
		}
		assert(values.length <= fragment.inputs.length, `too many arguments for ${fragment.format()}`, "UNEXPECTED_ARGUMENT", {
			count: values.length,
			expectedCount: fragment.inputs.length
		});
		const topics = [];
		if (!fragment.anonymous) topics.push(fragment.topicHash);
		const encodeTopic = (param, value) => {
			if (param.type === "string") return id(value);
			else if (param.type === "bytes") return keccak256(hexlify(value));
			if (param.type === "bool" && typeof value === "boolean") value = value ? "0x01" : "0x00";
			else if (param.type.match(/^u?int/)) value = toBeHex(value);
			else if (param.type.match(/^bytes/)) value = zeroPadBytes(value, 32);
			else if (param.type === "address") this.#abiCoder.encode(["address"], [value]);
			return zeroPadValue(hexlify(value), 32);
		};
		values.forEach((value, index) => {
			const param = fragment.inputs[index];
			if (!param.indexed) {
				assertArgument(value == null, "cannot filter non-indexed parameters; must be null", "contract." + param.name, value);
				return;
			}
			if (value == null) topics.push(null);
			else if (param.baseType === "array" || param.baseType === "tuple") assertArgument(false, "filtering with tuples or arrays not supported", "contract." + param.name, value);
			else if (Array.isArray(value)) topics.push(value.map((value) => encodeTopic(param, value)));
			else topics.push(encodeTopic(param, value));
		});
		while (topics.length && topics[topics.length - 1] === null) topics.pop();
		return topics;
	}
	encodeEventLog(fragment, values) {
		if (typeof fragment === "string") {
			const f = this.getEvent(fragment);
			assertArgument(f, "unknown event", "eventFragment", fragment);
			fragment = f;
		}
		const topics = [];
		const dataTypes = [];
		const dataValues = [];
		if (!fragment.anonymous) topics.push(fragment.topicHash);
		assertArgument(values.length === fragment.inputs.length, "event arguments/values mismatch", "values", values);
		fragment.inputs.forEach((param, index) => {
			const value = values[index];
			if (param.indexed) {
				if (param.type === "string") topics.push(id(value));
				else if (param.type === "bytes") topics.push(keccak256(value));
				else if (param.baseType === "tuple" || param.baseType === "array") throw new Error("not implemented");
				else topics.push(this.#abiCoder.encode([param.type], [value]));
			} else {
				dataTypes.push(param);
				dataValues.push(value);
			}
		});
		return {
			data: this.#abiCoder.encode(dataTypes, dataValues),
			topics
		};
	}
	decodeEventLog(fragment, data, topics) {
		if (typeof fragment === "string") {
			const f = this.getEvent(fragment);
			assertArgument(f, "unknown event", "eventFragment", fragment);
			fragment = f;
		}
		if (topics != null && !fragment.anonymous) {
			const eventTopic = fragment.topicHash;
			assertArgument(isHexString(topics[0], 32) && topics[0].toLowerCase() === eventTopic, "fragment/topic mismatch", "topics[0]", topics[0]);
			topics = topics.slice(1);
		}
		const indexed = [];
		const nonIndexed = [];
		const dynamic = [];
		fragment.inputs.forEach((param, index) => {
			if (param.indexed) {
				if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
					indexed.push(ParamType.from({
						type: "bytes32",
						name: param.name
					}));
					dynamic.push(true);
				} else {
					indexed.push(param);
					dynamic.push(false);
				}
			} else {
				nonIndexed.push(param);
				dynamic.push(false);
			}
		});
		const resultIndexed = topics != null ? this.#abiCoder.decode(indexed, concat(topics)) : null;
		const resultNonIndexed = this.#abiCoder.decode(nonIndexed, data, true);
		const values = [];
		const keys = [];
		let nonIndexedIndex = 0, indexedIndex = 0;
		fragment.inputs.forEach((param, index) => {
			let value = null;
			if (param.indexed) {
				if (resultIndexed == null) value = new Indexed(null);
				else if (dynamic[index]) value = new Indexed(resultIndexed[indexedIndex++]);
				else try {
					value = resultIndexed[indexedIndex++];
				} catch (error) {
					value = error;
				}
			} else try {
				value = resultNonIndexed[nonIndexedIndex++];
			} catch (error) {
				value = error;
			}
			values.push(value);
			keys.push(param.name || null);
		});
		return Result.fromItems(values, keys);
	}
	/**
	*  Parses a transaction, finding the matching function and extracts
	*  the parameter values along with other useful function details.
	*
	*  If the matching function cannot be found, return null.
	*/
	parseTransaction(tx) {
		const data = getBytes(tx.data, "tx.data");
		const value = getBigInt(tx.value != null ? tx.value : 0, "tx.value");
		const fragment = this.getFunction(hexlify(data.slice(0, 4)));
		if (!fragment) return null;
		const args = this.#abiCoder.decode(fragment.inputs, data.slice(4));
		return new TransactionDescription(fragment, fragment.selector, args, value);
	}
	parseCallResult(data) {
		throw new Error("@TODO");
	}
	/**
	*  Parses a receipt log, finding the matching event and extracts
	*  the parameter values along with other useful event details.
	*
	*  If the matching event cannot be found, returns null.
	*/
	parseLog(log) {
		const fragment = this.getEvent(log.topics[0]);
		if (!fragment || fragment.anonymous) return null;
		return new LogDescription(fragment, fragment.topicHash, this.decodeEventLog(fragment, log.data, log.topics));
	}
	/**
	*  Parses a revert data, finding the matching error and extracts
	*  the parameter values along with other useful error details.
	*
	*  If the matching error cannot be found, returns null.
	*/
	parseError(data) {
		const hexData = hexlify(data);
		const fragment = this.getError(dataSlice(hexData, 0, 4));
		if (!fragment) return null;
		const args = this.#abiCoder.decode(fragment.inputs, dataSlice(hexData, 4));
		return new ErrorDescription(fragment, fragment.selector, args);
	}
	/**
	*  Creates a new [[Interface]] from the ABI %%value%%.
	*
	*  The %%value%% may be provided as an existing [[Interface]] object,
	*  a JSON-encoded ABI or any Human-Readable ABI format.
	*/
	static from(value) {
		if (value instanceof Interface) return value;
		if (typeof value === "string") return new Interface(JSON.parse(value));
		if (typeof value.formatJson === "function") return new Interface(value.formatJson());
		if (typeof value.format === "function") return new Interface(value.format("json"));
		return new Interface(value);
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/providers/provider.js
var BN_0$2 = BigInt(0);
function getValue(value) {
	if (value == null) return null;
	return value;
}
function toJson(value) {
	if (value == null) return null;
	return value.toString();
}
/**
*  A **FeeData** wraps all the fee-related values associated with
*  the network.
*/
var FeeData = class {
	/**
	*  The gas price for legacy networks.
	*/
	gasPrice;
	/**
	*  The maximum fee to pay per gas.
	*
	*  The base fee per gas is defined by the network and based on
	*  congestion, increasing the cost during times of heavy load
	*  and lowering when less busy.
	*
	*  The actual fee per gas will be the base fee for the block
	*  and the priority fee, up to the max fee per gas.
	*
	*  This will be ``null`` on legacy networks (i.e. [pre-EIP-1559](link-eip-1559))
	*/
	maxFeePerGas;
	/**
	*  The additional amout to pay per gas to encourage a validator
	*  to include the transaction.
	*
	*  The purpose of this is to compensate the validator for the
	*  adjusted risk for including a given transaction.
	*
	*  This will be ``null`` on legacy networks (i.e. [pre-EIP-1559](link-eip-1559))
	*/
	maxPriorityFeePerGas;
	/**
	*  Creates a new FeeData for %%gasPrice%%, %%maxFeePerGas%% and
	*  %%maxPriorityFeePerGas%%.
	*/
	constructor(gasPrice, maxFeePerGas, maxPriorityFeePerGas) {
		defineProperties(this, {
			gasPrice: getValue(gasPrice),
			maxFeePerGas: getValue(maxFeePerGas),
			maxPriorityFeePerGas: getValue(maxPriorityFeePerGas)
		});
	}
	/**
	*  Returns a JSON-friendly value.
	*/
	toJSON() {
		const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = this;
		return {
			_type: "FeeData",
			gasPrice: toJson(gasPrice),
			maxFeePerGas: toJson(maxFeePerGas),
			maxPriorityFeePerGas: toJson(maxPriorityFeePerGas)
		};
	}
};
/**
*  Returns a copy of %%req%% with all properties coerced to their strict
*  types.
*/
function copyRequest(req) {
	const result = {};
	if (req.to) result.to = req.to;
	if (req.from) result.from = req.from;
	if (req.data) result.data = hexlify(req.data);
	const bigIntKeys = "chainId,gasLimit,gasPrice,maxFeePerBlobGas,maxFeePerGas,maxPriorityFeePerGas,value".split(/,/);
	for (const key of bigIntKeys) {
		if (!(key in req) || req[key] == null) continue;
		result[key] = getBigInt(req[key], `request.${key}`);
	}
	const numberKeys = "type,nonce".split(/,/);
	for (const key of numberKeys) {
		if (!(key in req) || req[key] == null) continue;
		result[key] = getNumber(req[key], `request.${key}`);
	}
	if (req.accessList) result.accessList = accessListify(req.accessList);
	if (req.authorizationList) result.authorizationList = req.authorizationList.slice();
	if ("blockTag" in req) result.blockTag = req.blockTag;
	if ("enableCcipRead" in req) result.enableCcipRead = !!req.enableCcipRead;
	if ("customData" in req) result.customData = req.customData;
	if ("blobVersionedHashes" in req && req.blobVersionedHashes) result.blobVersionedHashes = req.blobVersionedHashes.slice();
	if ("kzg" in req) result.kzg = req.kzg;
	if ("blobWrapperVersion" in req) result.blobWrapperVersion = req.blobWrapperVersion;
	if ("blobs" in req && req.blobs) result.blobs = req.blobs.map((b) => {
		if (isBytesLike(b)) return hexlify(b);
		return Object.assign({}, b);
	});
	return result;
}
/**
*  A **Block** represents the data associated with a full block on
*  Ethereum.
*/
var Block = class {
	/**
	*  The provider connected to the block used to fetch additional details
	*  if necessary.
	*/
	provider;
	/**
	*  The block number, sometimes called the block height. This is a
	*  sequential number that is one higher than the parent block.
	*/
	number;
	/**
	*  The block hash.
	*
	*  This hash includes all properties, so can be safely used to identify
	*  an exact set of block properties.
	*/
	hash;
	/**
	*  The timestamp for this block, which is the number of seconds since
	*  epoch that this block was included.
	*/
	timestamp;
	/**
	*  The block hash of the parent block.
	*/
	parentHash;
	/**
	*  The hash tree root of the parent beacon block for the given
	*  execution block. See [[link-eip-4788]].
	*/
	parentBeaconBlockRoot;
	/**
	*  The nonce.
	*
	*  On legacy networks, this is the random number inserted which
	*  permitted the difficulty target to be reached.
	*/
	nonce;
	/**
	*  The difficulty target.
	*
	*  On legacy networks, this is the proof-of-work target required
	*  for a block to meet the protocol rules to be included.
	*
	*  On modern networks, this is a random number arrived at using
	*  randao.  @TODO: Find links?
	*/
	difficulty;
	/**
	*  The total gas limit for this block.
	*/
	gasLimit;
	/**
	*  The total gas used in this block.
	*/
	gasUsed;
	/**
	*  The root hash for the global state after applying changes
	*  in this block.
	*/
	stateRoot;
	/**
	*  The hash of the transaction receipts trie.
	*/
	receiptsRoot;
	/**
	*  The hash of the transactions.
	*/
	transactionsRoot;
	/**
	*  The total amount of blob gas consumed by the transactions
	*  within the block. See [[link-eip-4844]].
	*/
	blobGasUsed;
	/**
	*  The running total of blob gas consumed in excess of the
	*  target, prior to the block. See [[link-eip-4844]].
	*/
	excessBlobGas;
	/**
	*  The miner coinbase address, wihch receives any subsidies for
	*  including this block.
	*/
	miner;
	/**
	*  The latest RANDAO mix of the post beacon state of
	*  the previous block.
	*/
	prevRandao;
	/**
	*  Any extra data the validator wished to include.
	*/
	extraData;
	/**
	*  The base fee per gas that all transactions in this block were
	*  charged.
	*
	*  This adjusts after each block, depending on how congested the network
	*  is.
	*/
	baseFeePerGas;
	#transactions;
	/**
	*  Create a new **Block** object.
	*
	*  This should generally not be necessary as the unless implementing a
	*  low-level library.
	*/
	constructor(block, provider) {
		this.#transactions = block.transactions.map((tx) => {
			if (typeof tx !== "string") return new TransactionResponse(tx, provider);
			return tx;
		});
		defineProperties(this, {
			provider,
			hash: getValue(block.hash),
			number: block.number,
			timestamp: block.timestamp,
			parentHash: block.parentHash,
			parentBeaconBlockRoot: block.parentBeaconBlockRoot,
			nonce: block.nonce,
			difficulty: block.difficulty,
			gasLimit: block.gasLimit,
			gasUsed: block.gasUsed,
			blobGasUsed: block.blobGasUsed,
			excessBlobGas: block.excessBlobGas,
			miner: block.miner,
			prevRandao: getValue(block.prevRandao),
			extraData: block.extraData,
			baseFeePerGas: getValue(block.baseFeePerGas),
			stateRoot: block.stateRoot,
			receiptsRoot: block.receiptsRoot,
			transactionsRoot: block.transactionsRoot
		});
	}
	/**
	*  Returns the list of transaction hashes, in the order
	*  they were executed within the block.
	*/
	get transactions() {
		return this.#transactions.map((tx) => {
			if (typeof tx === "string") return tx;
			return tx.hash;
		});
	}
	/**
	*  Returns the complete transactions, in the order they
	*  were executed within the block.
	*
	*  This is only available for blocks which prefetched
	*  transactions, by passing ``true`` to %%prefetchTxs%%
	*  into [[Provider-getBlock]].
	*/
	get prefetchedTransactions() {
		const txs = this.#transactions.slice();
		if (txs.length === 0) return [];
		assert(typeof txs[0] === "object", "transactions were not prefetched with block request", "UNSUPPORTED_OPERATION", { operation: "transactionResponses()" });
		return txs;
	}
	/**
	*  Returns a JSON-friendly value.
	*/
	toJSON() {
		const { baseFeePerGas, difficulty, extraData, gasLimit, gasUsed, hash, miner, prevRandao, nonce, number, parentHash, parentBeaconBlockRoot, stateRoot, receiptsRoot, transactionsRoot, timestamp, transactions } = this;
		return {
			_type: "Block",
			baseFeePerGas: toJson(baseFeePerGas),
			difficulty: toJson(difficulty),
			extraData,
			gasLimit: toJson(gasLimit),
			gasUsed: toJson(gasUsed),
			blobGasUsed: toJson(this.blobGasUsed),
			excessBlobGas: toJson(this.excessBlobGas),
			hash,
			miner,
			prevRandao,
			nonce,
			number,
			parentHash,
			timestamp,
			parentBeaconBlockRoot,
			stateRoot,
			receiptsRoot,
			transactionsRoot,
			transactions
		};
	}
	[Symbol.iterator]() {
		let index = 0;
		const txs = this.transactions;
		return { next: () => {
			if (index < this.length) return {
				value: txs[index++],
				done: false
			};
			return {
				value: void 0,
				done: true
			};
		} };
	}
	/**
	*  The number of transactions in this block.
	*/
	get length() {
		return this.#transactions.length;
	}
	/**
	*  The [[link-js-date]] this block was included at.
	*/
	get date() {
		if (this.timestamp == null) return null;
		return /* @__PURE__ */ new Date(this.timestamp * 1e3);
	}
	/**
	*  Get the transaction at %%indexe%% within this block.
	*/
	async getTransaction(indexOrHash) {
		let tx = void 0;
		if (typeof indexOrHash === "number") tx = this.#transactions[indexOrHash];
		else {
			const hash = indexOrHash.toLowerCase();
			for (const v of this.#transactions) if (typeof v === "string") {
				if (v !== hash) continue;
				tx = v;
				break;
			} else {
				if (v.hash !== hash) continue;
				tx = v;
				break;
			}
		}
		if (tx == null) throw new Error("no such tx");
		if (typeof tx === "string") return await this.provider.getTransaction(tx);
		else return tx;
	}
	/**
	*  If a **Block** was fetched with a request to include the transactions
	*  this will allow synchronous access to those transactions.
	*
	*  If the transactions were not prefetched, this will throw.
	*/
	getPrefetchedTransaction(indexOrHash) {
		const txs = this.prefetchedTransactions;
		if (typeof indexOrHash === "number") return txs[indexOrHash];
		indexOrHash = indexOrHash.toLowerCase();
		for (const tx of txs) if (tx.hash === indexOrHash) return tx;
		assertArgument(false, "no matching transaction", "indexOrHash", indexOrHash);
	}
	/**
	*  Returns true if this block been mined. This provides a type guard
	*  for all properties on a [[MinedBlock]].
	*/
	isMined() {
		return !!this.hash;
	}
	/**
	*  Returns true if this block is an [[link-eip-2930]] block.
	*/
	isLondon() {
		return !!this.baseFeePerGas;
	}
	/**
	*  @_ignore:
	*/
	orphanedEvent() {
		if (!this.isMined()) throw new Error("");
		return createOrphanedBlockFilter(this);
	}
};
/**
*  A **Log** in Ethereum represents an event that has been included in a
*  transaction using the ``LOG*`` opcodes, which are most commonly used by
*  Solidity's emit for announcing events.
*/
var Log = class {
	/**
	*  The provider connected to the log used to fetch additional details
	*  if necessary.
	*/
	provider;
	/**
	*  The transaction hash of the transaction this log occurred in. Use the
	*  [[Log-getTransaction]] to get the [[TransactionResponse]].
	*/
	transactionHash;
	/**
	*  The block hash of the block this log occurred in. Use the
	*  [[Log-getBlock]] to get the [[Block]].
	*/
	blockHash;
	/**
	*  The block number of the block this log occurred in. It is preferred
	*  to use the [[Block-hash]] when fetching the related [[Block]],
	*  since in the case of an orphaned block, the block at that height may
	*  have changed.
	*/
	blockNumber;
	/**
	*  If the **Log** represents a block that was removed due to an orphaned
	*  block, this will be true.
	*
	*  This can only happen within an orphan event listener.
	*/
	removed;
	/**
	*  The address of the contract that emitted this log.
	*/
	address;
	/**
	*  The data included in this log when it was emitted.
	*/
	data;
	/**
	*  The indexed topics included in this log when it was emitted.
	*
	*  All topics are included in the bloom filters, so they can be
	*  efficiently filtered using the [[Provider-getLogs]] method.
	*/
	topics;
	/**
	*  The index within the block this log occurred at. This is generally
	*  not useful to developers, but can be used with the various roots
	*  to proof inclusion within a block.
	*/
	index;
	/**
	*  The index within the transaction of this log.
	*/
	transactionIndex;
	/**
	*  @_ignore:
	*/
	constructor(log, provider) {
		this.provider = provider;
		const topics = Object.freeze(log.topics.slice());
		defineProperties(this, {
			transactionHash: log.transactionHash,
			blockHash: log.blockHash,
			blockNumber: log.blockNumber,
			removed: log.removed,
			address: log.address,
			data: log.data,
			topics,
			index: log.index,
			transactionIndex: log.transactionIndex
		});
	}
	/**
	*  Returns a JSON-compatible object.
	*/
	toJSON() {
		const { address, blockHash, blockNumber, data, index, removed, topics, transactionHash, transactionIndex } = this;
		return {
			_type: "log",
			address,
			blockHash,
			blockNumber,
			data,
			index,
			removed,
			topics,
			transactionHash,
			transactionIndex
		};
	}
	/**
	*  Returns the block that this log occurred in.
	*/
	async getBlock() {
		const block = await this.provider.getBlock(this.blockHash);
		assert(!!block, "failed to find transaction", "UNKNOWN_ERROR", {});
		return block;
	}
	/**
	*  Returns the transaction that this log occurred in.
	*/
	async getTransaction() {
		const tx = await this.provider.getTransaction(this.transactionHash);
		assert(!!tx, "failed to find transaction", "UNKNOWN_ERROR", {});
		return tx;
	}
	/**
	*  Returns the transaction receipt fot the transaction that this
	*  log occurred in.
	*/
	async getTransactionReceipt() {
		const receipt = await this.provider.getTransactionReceipt(this.transactionHash);
		assert(!!receipt, "failed to find transaction receipt", "UNKNOWN_ERROR", {});
		return receipt;
	}
	/**
	*  @_ignore:
	*/
	removedEvent() {
		return createRemovedLogFilter(this);
	}
};
/**
*  A **TransactionReceipt** includes additional information about a
*  transaction that is only available after it has been mined.
*/
var TransactionReceipt = class {
	/**
	*  The provider connected to the log used to fetch additional details
	*  if necessary.
	*/
	provider;
	/**
	*  The address the transaction was sent to.
	*/
	to;
	/**
	*  The sender of the transaction.
	*/
	from;
	/**
	*  The address of the contract if the transaction was directly
	*  responsible for deploying one.
	*
	*  This is non-null **only** if the ``to`` is empty and the ``data``
	*  was successfully executed as initcode.
	*/
	contractAddress;
	/**
	*  The transaction hash.
	*/
	hash;
	/**
	*  The index of this transaction within the block transactions.
	*/
	index;
	/**
	*  The block hash of the [[Block]] this transaction was included in.
	*/
	blockHash;
	/**
	*  The block number of the [[Block]] this transaction was included in.
	*/
	blockNumber;
	/**
	*  The bloom filter bytes that represent all logs that occurred within
	*  this transaction. This is generally not useful for most developers,
	*  but can be used to validate the included logs.
	*/
	logsBloom;
	/**
	*  The actual amount of gas used by this transaction.
	*
	*  When creating a transaction, the amount of gas that will be used can
	*  only be approximated, but the sender must pay the gas fee for the
	*  entire gas limit. After the transaction, the difference is refunded.
	*/
	gasUsed;
	/**
	*  The gas used for BLObs. See [[link-eip-4844]].
	*/
	blobGasUsed;
	/**
	*  The amount of gas used by all transactions within the block for this
	*  and all transactions with a lower ``index``.
	*
	*  This is generally not useful for developers but can be used to
	*  validate certain aspects of execution.
	*/
	cumulativeGasUsed;
	/**
	*  The actual gas price used during execution.
	*
	*  Due to the complexity of [[link-eip-1559]] this value can only
	*  be caluclated after the transaction has been mined, snce the base
	*  fee is protocol-enforced.
	*/
	gasPrice;
	/**
	*  The price paid per BLOB in gas. See [[link-eip-4844]].
	*/
	blobGasPrice;
	/**
	*  The [[link-eip-2718]] transaction type.
	*/
	type;
	/**
	*  The status of this transaction, indicating success (i.e. ``1``) or
	*  a revert (i.e. ``0``).
	*
	*  This is available in post-byzantium blocks, but some backends may
	*  backfill this value.
	*/
	status;
	/**
	*  The root hash of this transaction.
	*
	*  This is no present and was only included in pre-byzantium blocks, but
	*  could be used to validate certain parts of the receipt.
	*/
	root;
	#logs;
	/**
	*  @_ignore:
	*/
	constructor(tx, provider) {
		this.#logs = Object.freeze(tx.logs.map((log) => {
			return new Log(log, provider);
		}));
		let gasPrice = BN_0$2;
		if (tx.effectiveGasPrice != null) gasPrice = tx.effectiveGasPrice;
		else if (tx.gasPrice != null) gasPrice = tx.gasPrice;
		defineProperties(this, {
			provider,
			to: tx.to,
			from: tx.from,
			contractAddress: tx.contractAddress,
			hash: tx.hash,
			index: tx.index,
			blockHash: tx.blockHash,
			blockNumber: tx.blockNumber,
			logsBloom: tx.logsBloom,
			gasUsed: tx.gasUsed,
			cumulativeGasUsed: tx.cumulativeGasUsed,
			blobGasUsed: tx.blobGasUsed,
			gasPrice,
			blobGasPrice: tx.blobGasPrice,
			type: tx.type,
			status: tx.status,
			root: tx.root
		});
	}
	/**
	*  The logs for this transaction.
	*/
	get logs() {
		return this.#logs;
	}
	/**
	*  Returns a JSON-compatible representation.
	*/
	toJSON() {
		const { to, from, contractAddress, hash, index, blockHash, blockNumber, logsBloom, logs, status, root } = this;
		return {
			_type: "TransactionReceipt",
			blockHash,
			blockNumber,
			contractAddress,
			cumulativeGasUsed: toJson(this.cumulativeGasUsed),
			from,
			gasPrice: toJson(this.gasPrice),
			blobGasUsed: toJson(this.blobGasUsed),
			blobGasPrice: toJson(this.blobGasPrice),
			gasUsed: toJson(this.gasUsed),
			hash,
			index,
			logs,
			logsBloom,
			root,
			status,
			to
		};
	}
	/**
	*  @_ignore:
	*/
	get length() {
		return this.logs.length;
	}
	[Symbol.iterator]() {
		let index = 0;
		return { next: () => {
			if (index < this.length) return {
				value: this.logs[index++],
				done: false
			};
			return {
				value: void 0,
				done: true
			};
		} };
	}
	/**
	*  The total fee for this transaction, in wei.
	*/
	get fee() {
		return this.gasUsed * this.gasPrice;
	}
	/**
	*  Resolves to the block this transaction occurred in.
	*/
	async getBlock() {
		const block = await this.provider.getBlock(this.blockHash);
		if (block == null) throw new Error("TODO");
		return block;
	}
	/**
	*  Resolves to the transaction this transaction occurred in.
	*/
	async getTransaction() {
		const tx = await this.provider.getTransaction(this.hash);
		if (tx == null) throw new Error("TODO");
		return tx;
	}
	/**
	*  Resolves to the return value of the execution of this transaction.
	*
	*  Support for this feature is limited, as it requires an archive node
	*  with the ``debug_`` or ``trace_`` API enabled.
	*/
	async getResult() {
		return await this.provider.getTransactionResult(this.hash);
	}
	/**
	*  Resolves to the number of confirmations this transaction has.
	*/
	async confirmations() {
		return await this.provider.getBlockNumber() - this.blockNumber + 1;
	}
	/**
	*  @_ignore:
	*/
	removedEvent() {
		return createRemovedTransactionFilter(this);
	}
	/**
	*  @_ignore:
	*/
	reorderedEvent(other) {
		assert(!other || other.isMined(), "unmined 'other' transction cannot be orphaned", "UNSUPPORTED_OPERATION", { operation: "reorderedEvent(other)" });
		return createReorderedTransactionFilter(this, other);
	}
};
/**
*  A **TransactionResponse** includes all properties about a transaction
*  that was sent to the network, which may or may not be included in a
*  block.
*
*  The [[TransactionResponse-isMined]] can be used to check if the
*  transaction has been mined as well as type guard that the otherwise
*  possibly ``null`` properties are defined.
*/
var TransactionResponse = class TransactionResponse {
	/**
	*  The provider this is connected to, which will influence how its
	*  methods will resolve its async inspection methods.
	*/
	provider;
	/**
	*  The block number of the block that this transaction was included in.
	*
	*  This is ``null`` for pending transactions.
	*/
	blockNumber;
	/**
	*  The blockHash of the block that this transaction was included in.
	*
	*  This is ``null`` for pending transactions.
	*/
	blockHash;
	/**
	*  The index within the block that this transaction resides at.
	*/
	index;
	/**
	*  The transaction hash.
	*/
	hash;
	/**
	*  The [[link-eip-2718]] transaction envelope type. This is
	*  ``0`` for legacy transactions types.
	*/
	type;
	/**
	*  The receiver of this transaction.
	*
	*  If ``null``, then the transaction is an initcode transaction.
	*  This means the result of executing the [[data]] will be deployed
	*  as a new contract on chain (assuming it does not revert) and the
	*  address may be computed using [[getCreateAddress]].
	*/
	to;
	/**
	*  The sender of this transaction. It is implicitly computed
	*  from the transaction pre-image hash (as the digest) and the
	*  [[signature]] using ecrecover.
	*/
	from;
	/**
	*  The nonce, which is used to prevent replay attacks and offer
	*  a method to ensure transactions from a given sender are explicitly
	*  ordered.
	*
	*  When sending a transaction, this must be equal to the number of
	*  transactions ever sent by [[from]].
	*/
	nonce;
	/**
	*  The maximum units of gas this transaction can consume. If execution
	*  exceeds this, the entries transaction is reverted and the sender
	*  is charged for the full amount, despite not state changes being made.
	*/
	gasLimit;
	/**
	*  The gas price can have various values, depending on the network.
	*
	*  In modern networks, for transactions that are included this is
	*  the //effective gas price// (the fee per gas that was actually
	*  charged), while for transactions that have not been included yet
	*  is the [[maxFeePerGas]].
	*
	*  For legacy transactions, or transactions on legacy networks, this
	*  is the fee that will be charged per unit of gas the transaction
	*  consumes.
	*/
	gasPrice;
	/**
	*  The maximum priority fee (per unit of gas) to allow a
	*  validator to charge the sender. This is inclusive of the
	*  [[maxFeeFeePerGas]].
	*/
	maxPriorityFeePerGas;
	/**
	*  The maximum fee (per unit of gas) to allow this transaction
	*  to charge the sender.
	*/
	maxFeePerGas;
	/**
	*  The [[link-eip-4844]] max fee per BLOb gas.
	*/
	maxFeePerBlobGas;
	/**
	*  The data.
	*/
	data;
	/**
	*  The value, in wei. Use [[formatEther]] to format this value
	*  as ether.
	*/
	value;
	/**
	*  The chain ID.
	*/
	chainId;
	/**
	*  The signature.
	*/
	signature;
	/**
	*  The [[link-eip-2930]] access list for transaction types that
	*  support it, otherwise ``null``.
	*/
	accessList;
	/**
	*  The [[link-eip-4844]] BLOb versioned hashes.
	*/
	blobVersionedHashes;
	/**
	*  The [[link-eip-7702]] authorizations (if any).
	*/
	authorizationList;
	#startBlock;
	/**
	*  @_ignore:
	*/
	constructor(tx, provider) {
		this.provider = provider;
		this.blockNumber = tx.blockNumber != null ? tx.blockNumber : null;
		this.blockHash = tx.blockHash != null ? tx.blockHash : null;
		this.hash = tx.hash;
		this.index = tx.index;
		this.type = tx.type;
		this.from = tx.from;
		this.to = tx.to || null;
		this.gasLimit = tx.gasLimit;
		this.nonce = tx.nonce;
		this.data = tx.data;
		this.value = tx.value;
		this.gasPrice = tx.gasPrice;
		this.maxPriorityFeePerGas = tx.maxPriorityFeePerGas != null ? tx.maxPriorityFeePerGas : null;
		this.maxFeePerGas = tx.maxFeePerGas != null ? tx.maxFeePerGas : null;
		this.maxFeePerBlobGas = tx.maxFeePerBlobGas != null ? tx.maxFeePerBlobGas : null;
		this.chainId = tx.chainId;
		this.signature = tx.signature;
		this.accessList = tx.accessList != null ? tx.accessList : null;
		this.blobVersionedHashes = tx.blobVersionedHashes != null ? tx.blobVersionedHashes : null;
		this.authorizationList = tx.authorizationList != null ? tx.authorizationList : null;
		this.#startBlock = -1;
	}
	/**
	*  Returns a JSON-compatible representation of this transaction.
	*/
	toJSON() {
		const { blockNumber, blockHash, index, hash, type, to, from, nonce, data, signature, accessList, blobVersionedHashes } = this;
		return {
			_type: "TransactionResponse",
			accessList,
			blockNumber,
			blockHash,
			blobVersionedHashes,
			chainId: toJson(this.chainId),
			data,
			from,
			gasLimit: toJson(this.gasLimit),
			gasPrice: toJson(this.gasPrice),
			hash,
			maxFeePerGas: toJson(this.maxFeePerGas),
			maxPriorityFeePerGas: toJson(this.maxPriorityFeePerGas),
			maxFeePerBlobGas: toJson(this.maxFeePerBlobGas),
			nonce,
			signature,
			to,
			index,
			type,
			value: toJson(this.value)
		};
	}
	/**
	*  Resolves to the Block that this transaction was included in.
	*
	*  This will return null if the transaction has not been included yet.
	*/
	async getBlock() {
		let blockNumber = this.blockNumber;
		if (blockNumber == null) {
			const tx = await this.getTransaction();
			if (tx) blockNumber = tx.blockNumber;
		}
		if (blockNumber == null) return null;
		const block = this.provider.getBlock(blockNumber);
		if (block == null) throw new Error("TODO");
		return block;
	}
	/**
	*  Resolves to this transaction being re-requested from the
	*  provider. This can be used if you have an unmined transaction
	*  and wish to get an up-to-date populated instance.
	*/
	async getTransaction() {
		return this.provider.getTransaction(this.hash);
	}
	/**
	*  Resolve to the number of confirmations this transaction has.
	*/
	async confirmations() {
		if (this.blockNumber == null) {
			const { tx, blockNumber } = await resolveProperties({
				tx: this.getTransaction(),
				blockNumber: this.provider.getBlockNumber()
			});
			if (tx == null || tx.blockNumber == null) return 0;
			return blockNumber - tx.blockNumber + 1;
		}
		return await this.provider.getBlockNumber() - this.blockNumber + 1;
	}
	/**
	*  Resolves once this transaction has been mined and has
	*  %%confirms%% blocks including it (default: ``1``) with an
	*  optional %%timeout%%.
	*
	*  This can resolve to ``null`` only if %%confirms%% is ``0``
	*  and the transaction has not been mined, otherwise this will
	*  wait until enough confirmations have completed.
	*/
	async wait(_confirms, _timeout) {
		const confirms = _confirms == null ? 1 : _confirms;
		const timeout = _timeout == null ? 0 : _timeout;
		let startBlock = this.#startBlock;
		let nextScan = -1;
		let stopScanning = startBlock === -1 ? true : false;
		const checkReplacement = async () => {
			if (stopScanning) return null;
			const { blockNumber, nonce } = await resolveProperties({
				blockNumber: this.provider.getBlockNumber(),
				nonce: this.provider.getTransactionCount(this.from)
			});
			if (nonce < this.nonce) {
				startBlock = blockNumber;
				return;
			}
			if (stopScanning) return null;
			const mined = await this.getTransaction();
			if (mined && mined.blockNumber != null) return;
			if (nextScan === -1) {
				nextScan = startBlock - 3;
				if (nextScan < this.#startBlock) nextScan = this.#startBlock;
			}
			while (nextScan <= blockNumber) {
				if (stopScanning) return null;
				const block = await this.provider.getBlock(nextScan, true);
				if (block == null) return;
				for (const hash of block) if (hash === this.hash) return;
				for (let i = 0; i < block.length; i++) {
					const tx = await block.getTransaction(i);
					if (tx.from === this.from && tx.nonce === this.nonce) {
						if (stopScanning) return null;
						const receipt = await this.provider.getTransactionReceipt(tx.hash);
						if (receipt == null) return;
						if (blockNumber - receipt.blockNumber + 1 < confirms) return;
						let reason = "replaced";
						if (tx.data === this.data && tx.to === this.to && tx.value === this.value) reason = "repriced";
						else if (tx.data === "0x" && tx.from === tx.to && tx.value === BN_0$2) reason = "cancelled";
						assert(false, "transaction was replaced", "TRANSACTION_REPLACED", {
							cancelled: reason === "replaced" || reason === "cancelled",
							reason,
							replacement: tx.replaceableTransaction(startBlock),
							hash: tx.hash,
							receipt
						});
					}
				}
				nextScan++;
			}
		};
		const checkReceipt = (receipt) => {
			if (receipt == null || receipt.status !== 0) return receipt;
			assert(false, "transaction execution reverted", "CALL_EXCEPTION", {
				action: "sendTransaction",
				data: null,
				reason: null,
				invocation: null,
				revert: null,
				transaction: {
					to: receipt.to,
					from: receipt.from,
					data: ""
				},
				receipt
			});
		};
		const receipt = await this.provider.getTransactionReceipt(this.hash);
		if (confirms === 0) return checkReceipt(receipt);
		if (receipt) {
			if (confirms === 1 || await receipt.confirmations() >= confirms) return checkReceipt(receipt);
		} else {
			await checkReplacement();
			if (confirms === 0) return null;
		}
		return await new Promise((resolve, reject) => {
			const cancellers = [];
			const cancel = () => {
				cancellers.forEach((c) => c());
			};
			cancellers.push(() => {
				stopScanning = true;
			});
			if (timeout > 0) {
				const timer = setTimeout(() => {
					cancel();
					reject(makeError("wait for transaction timeout", "TIMEOUT"));
				}, timeout);
				cancellers.push(() => {
					clearTimeout(timer);
				});
			}
			const txListener = async (receipt) => {
				if (await receipt.confirmations() >= confirms) {
					cancel();
					try {
						resolve(checkReceipt(receipt));
					} catch (error) {
						reject(error);
					}
				}
			};
			cancellers.push(() => {
				this.provider.off(this.hash, txListener);
			});
			this.provider.on(this.hash, txListener);
			if (startBlock >= 0) {
				const replaceListener = async () => {
					try {
						await checkReplacement();
					} catch (error) {
						if (isError(error, "TRANSACTION_REPLACED")) {
							cancel();
							reject(error);
							return;
						}
					}
					if (!stopScanning) this.provider.once("block", replaceListener);
				};
				cancellers.push(() => {
					this.provider.off("block", replaceListener);
				});
				this.provider.once("block", replaceListener);
			}
		});
	}
	/**
	*  Returns ``true`` if this transaction has been included.
	*
	*  This is effective only as of the time the TransactionResponse
	*  was instantiated. To get up-to-date information, use
	*  [[getTransaction]].
	*
	*  This provides a Type Guard that this transaction will have
	*  non-null property values for properties that are null for
	*  unmined transactions.
	*/
	isMined() {
		return this.blockHash != null;
	}
	/**
	*  Returns true if the transaction is a legacy (i.e. ``type == 0``)
	*  transaction.
	*
	*  This provides a Type Guard that this transaction will have
	*  the ``null``-ness for hardfork-specific properties set correctly.
	*/
	isLegacy() {
		return this.type === 0;
	}
	/**
	*  Returns true if the transaction is a Berlin (i.e. ``type == 1``)
	*  transaction. See [[link-eip-2070]].
	*
	*  This provides a Type Guard that this transaction will have
	*  the ``null``-ness for hardfork-specific properties set correctly.
	*/
	isBerlin() {
		return this.type === 1;
	}
	/**
	*  Returns true if the transaction is a London (i.e. ``type == 2``)
	*  transaction. See [[link-eip-1559]].
	*
	*  This provides a Type Guard that this transaction will have
	*  the ``null``-ness for hardfork-specific properties set correctly.
	*/
	isLondon() {
		return this.type === 2;
	}
	/**
	*  Returns true if hte transaction is a Cancun (i.e. ``type == 3``)
	*  transaction. See [[link-eip-4844]].
	*/
	isCancun() {
		return this.type === 3;
	}
	/**
	*  Returns a filter which can be used to listen for orphan events
	*  that evict this transaction.
	*/
	removedEvent() {
		assert(this.isMined(), "unmined transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
		return createRemovedTransactionFilter(this);
	}
	/**
	*  Returns a filter which can be used to listen for orphan events
	*  that re-order this event against %%other%%.
	*/
	reorderedEvent(other) {
		assert(this.isMined(), "unmined transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
		assert(!other || other.isMined(), "unmined 'other' transaction canot be orphaned", "UNSUPPORTED_OPERATION", { operation: "removeEvent()" });
		return createReorderedTransactionFilter(this, other);
	}
	/**
	*  Returns a new TransactionResponse instance which has the ability to
	*  detect (and throw an error) if the transaction is replaced, which
	*  will begin scanning at %%startBlock%%.
	*
	*  This should generally not be used by developers and is intended
	*  primarily for internal use. Setting an incorrect %%startBlock%% can
	*  have devastating performance consequences if used incorrectly.
	*/
	replaceableTransaction(startBlock) {
		assertArgument(Number.isInteger(startBlock) && startBlock >= 0, "invalid startBlock", "startBlock", startBlock);
		const tx = new TransactionResponse(this, this.provider);
		tx.#startBlock = startBlock;
		return tx;
	}
};
function createOrphanedBlockFilter(block) {
	return {
		orphan: "drop-block",
		hash: block.hash,
		number: block.number
	};
}
function createReorderedTransactionFilter(tx, other) {
	return {
		orphan: "reorder-transaction",
		tx,
		other
	};
}
function createRemovedTransactionFilter(tx) {
	return {
		orphan: "drop-transaction",
		tx
	};
}
function createRemovedLogFilter(log) {
	return {
		orphan: "drop-log",
		log: {
			transactionHash: log.transactionHash,
			blockHash: log.blockHash,
			blockNumber: log.blockNumber,
			address: log.address,
			data: log.data,
			topics: Object.freeze(log.topics.slice()),
			index: log.index
		}
	};
}
//#endregion
//#region node_modules/ethers/lib.esm/contract/wrappers.js
/**
*  An **EventLog** contains additional properties parsed from the [[Log]].
*/
var EventLog = class extends Log {
	/**
	*  The Contract Interface.
	*/
	interface;
	/**
	*  The matching event.
	*/
	fragment;
	/**
	*  The parsed arguments passed to the event by ``emit``.
	*/
	args;
	/**
	* @_ignore:
	*/
	constructor(log, iface, fragment) {
		super(log, log.provider);
		const args = iface.decodeEventLog(fragment, log.data, log.topics);
		defineProperties(this, {
			args,
			fragment,
			interface: iface
		});
	}
	/**
	*  The name of the event.
	*/
	get eventName() {
		return this.fragment.name;
	}
	/**
	*  The signature of the event.
	*/
	get eventSignature() {
		return this.fragment.format();
	}
};
/**
*  An **EventLog** contains additional properties parsed from the [[Log]].
*/
var UndecodedEventLog = class extends Log {
	/**
	*  The error encounted when trying to decode the log.
	*/
	error;
	/**
	* @_ignore:
	*/
	constructor(log, error) {
		super(log, log.provider);
		defineProperties(this, { error });
	}
};
/**
*  A **ContractTransactionReceipt** includes the parsed logs from a
*  [[TransactionReceipt]].
*/
var ContractTransactionReceipt = class extends TransactionReceipt {
	#iface;
	/**
	*  @_ignore:
	*/
	constructor(iface, provider, tx) {
		super(tx, provider);
		this.#iface = iface;
	}
	/**
	*  The parsed logs for any [[Log]] which has a matching event in the
	*  Contract ABI.
	*/
	get logs() {
		return super.logs.map((log) => {
			const fragment = log.topics.length ? this.#iface.getEvent(log.topics[0]) : null;
			if (fragment) try {
				return new EventLog(log, this.#iface, fragment);
			} catch (error) {
				return new UndecodedEventLog(log, error);
			}
			return log;
		});
	}
};
/**
*  A **ContractTransactionResponse** will return a
*  [[ContractTransactionReceipt]] when waited on.
*/
var ContractTransactionResponse = class extends TransactionResponse {
	#iface;
	/**
	*  @_ignore:
	*/
	constructor(iface, provider, tx) {
		super(tx, provider);
		this.#iface = iface;
	}
	/**
	*  Resolves once this transaction has been mined and has
	*  %%confirms%% blocks including it (default: ``1``) with an
	*  optional %%timeout%%.
	*
	*  This can resolve to ``null`` only if %%confirms%% is ``0``
	*  and the transaction has not been mined, otherwise this will
	*  wait until enough confirmations have completed.
	*/
	async wait(confirms, timeout) {
		const receipt = await super.wait(confirms, timeout);
		if (receipt == null) return null;
		return new ContractTransactionReceipt(this.#iface, this.provider, receipt);
	}
};
/**
*  A **ContractUnknownEventPayload** is included as the last parameter to
*  Contract Events when the event does not match any events in the ABI.
*/
var ContractUnknownEventPayload = class extends EventPayload {
	/**
	*  The log with no matching events.
	*/
	log;
	/**
	*  @_event:
	*/
	constructor(contract, listener, filter, log) {
		super(contract, listener, filter);
		defineProperties(this, { log });
	}
	/**
	*  Resolves to the block the event occured in.
	*/
	async getBlock() {
		return await this.log.getBlock();
	}
	/**
	*  Resolves to the transaction the event occured in.
	*/
	async getTransaction() {
		return await this.log.getTransaction();
	}
	/**
	*  Resolves to the transaction receipt the event occured in.
	*/
	async getTransactionReceipt() {
		return await this.log.getTransactionReceipt();
	}
};
/**
*  A **ContractEventPayload** is included as the last parameter to
*  Contract Events when the event is known.
*/
var ContractEventPayload = class extends ContractUnknownEventPayload {
	/**
	*  @_ignore:
	*/
	constructor(contract, listener, filter, fragment, _log) {
		super(contract, listener, filter, new EventLog(_log, contract.interface, fragment));
		const args = contract.interface.decodeEventLog(fragment, this.log.data, this.log.topics);
		defineProperties(this, {
			args,
			fragment
		});
	}
	/**
	*  The event name.
	*/
	get eventName() {
		return this.fragment.name;
	}
	/**
	*  The event signature.
	*/
	get eventSignature() {
		return this.fragment.format();
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/contract/contract.js
var BN_0$1 = BigInt(0);
function canCall(value) {
	return value && typeof value.call === "function";
}
function canEstimate(value) {
	return value && typeof value.estimateGas === "function";
}
function canResolve(value) {
	return value && typeof value.resolveName === "function";
}
function canSend(value) {
	return value && typeof value.sendTransaction === "function";
}
function getResolver(value) {
	if (value != null) {
		if (canResolve(value)) return value;
		if (value.provider) return value.provider;
	}
}
var PreparedTopicFilter = class {
	#filter;
	fragment;
	constructor(contract, fragment, args) {
		defineProperties(this, { fragment });
		if (fragment.inputs.length < args.length) throw new Error("too many arguments");
		const runner = getRunner(contract.runner, "resolveName");
		const resolver = canResolve(runner) ? runner : null;
		this.#filter = (async function() {
			const resolvedArgs = await Promise.all(fragment.inputs.map((param, index) => {
				if (args[index] == null) return null;
				return param.walkAsync(args[index], (type, value) => {
					if (type === "address") {
						if (Array.isArray(value)) return Promise.all(value.map((v) => resolveAddress(v, resolver)));
						return resolveAddress(value, resolver);
					}
					return value;
				});
			}));
			return contract.interface.encodeFilterTopics(fragment, resolvedArgs);
		})();
	}
	getTopicFilter() {
		return this.#filter;
	}
};
function getRunner(value, feature) {
	if (value == null) return null;
	if (typeof value[feature] === "function") return value;
	if (value.provider && typeof value.provider[feature] === "function") return value.provider;
	return null;
}
function getProvider(value) {
	if (value == null) return null;
	return value.provider || null;
}
/**
*  @_ignore:
*/
async function copyOverrides(arg, allowed) {
	const _overrides = Typed.dereference(arg, "overrides");
	assertArgument(typeof _overrides === "object", "invalid overrides parameter", "overrides", arg);
	const overrides = copyRequest(_overrides);
	assertArgument(overrides.to == null || (allowed || []).indexOf("to") >= 0, "cannot override to", "overrides.to", overrides.to);
	assertArgument(overrides.data == null || (allowed || []).indexOf("data") >= 0, "cannot override data", "overrides.data", overrides.data);
	if (overrides.from) overrides.from = overrides.from;
	return overrides;
}
/**
*  @_ignore:
*/
async function resolveArgs(_runner, inputs, args) {
	const runner = getRunner(_runner, "resolveName");
	const resolver = canResolve(runner) ? runner : null;
	return await Promise.all(inputs.map((param, index) => {
		return param.walkAsync(args[index], (type, value) => {
			value = Typed.dereference(value, type);
			if (type === "address") return resolveAddress(value, resolver);
			return value;
		});
	}));
}
function buildWrappedFallback(contract) {
	const populateTransaction = async function(overrides) {
		const tx = await copyOverrides(overrides, ["data"]);
		tx.to = await contract.getAddress();
		if (tx.from) tx.from = await resolveAddress(tx.from, getResolver(contract.runner));
		const iface = contract.interface;
		const noValue = getBigInt(tx.value || BN_0$1, "overrides.value") === BN_0$1;
		const noData = (tx.data || "0x") === "0x";
		if (iface.fallback && !iface.fallback.payable && iface.receive && !noData && !noValue) assertArgument(false, "cannot send data to receive or send value to non-payable fallback", "overrides", overrides);
		assertArgument(iface.fallback || noData, "cannot send data to receive-only contract", "overrides.data", tx.data);
		assertArgument(iface.receive || iface.fallback && iface.fallback.payable || noValue, "cannot send value to non-payable fallback", "overrides.value", tx.value);
		assertArgument(iface.fallback || noData, "cannot send data to receive-only contract", "overrides.data", tx.data);
		return tx;
	};
	const staticCall = async function(overrides) {
		const runner = getRunner(contract.runner, "call");
		assert(canCall(runner), "contract runner does not support calling", "UNSUPPORTED_OPERATION", { operation: "call" });
		const tx = await populateTransaction(overrides);
		try {
			return await runner.call(tx);
		} catch (error) {
			if (isCallException(error) && error.data) throw contract.interface.makeError(error.data, tx);
			throw error;
		}
	};
	const send = async function(overrides) {
		const runner = contract.runner;
		assert(canSend(runner), "contract runner does not support sending transactions", "UNSUPPORTED_OPERATION", { operation: "sendTransaction" });
		const tx = await runner.sendTransaction(await populateTransaction(overrides));
		const provider = getProvider(contract.runner);
		return new ContractTransactionResponse(contract.interface, provider, tx);
	};
	const estimateGas = async function(overrides) {
		const runner = getRunner(contract.runner, "estimateGas");
		assert(canEstimate(runner), "contract runner does not support gas estimation", "UNSUPPORTED_OPERATION", { operation: "estimateGas" });
		return await runner.estimateGas(await populateTransaction(overrides));
	};
	const method = async (overrides) => {
		return await send(overrides);
	};
	defineProperties(method, {
		_contract: contract,
		estimateGas,
		populateTransaction,
		send,
		staticCall
	});
	return method;
}
function buildWrappedMethod(contract, key) {
	const getFragment = function(...args) {
		const fragment = contract.interface.getFunction(key, args);
		assert(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
			operation: "fragment",
			info: {
				key,
				args
			}
		});
		return fragment;
	};
	const populateTransaction = async function(...args) {
		const fragment = getFragment(...args);
		let overrides = {};
		if (fragment.inputs.length + 1 === args.length) {
			overrides = await copyOverrides(args.pop());
			if (overrides.from) overrides.from = await resolveAddress(overrides.from, getResolver(contract.runner));
		}
		if (fragment.inputs.length !== args.length) throw new Error("internal error: fragment inputs doesn't match arguments; should not happen");
		const resolvedArgs = await resolveArgs(contract.runner, fragment.inputs, args);
		return Object.assign({}, overrides, await resolveProperties({
			to: contract.getAddress(),
			data: contract.interface.encodeFunctionData(fragment, resolvedArgs)
		}));
	};
	const staticCall = async function(...args) {
		const result = await staticCallResult(...args);
		if (result.length === 1) return result[0];
		return result;
	};
	const send = async function(...args) {
		const runner = contract.runner;
		assert(canSend(runner), "contract runner does not support sending transactions", "UNSUPPORTED_OPERATION", { operation: "sendTransaction" });
		const tx = await runner.sendTransaction(await populateTransaction(...args));
		const provider = getProvider(contract.runner);
		return new ContractTransactionResponse(contract.interface, provider, tx);
	};
	const estimateGas = async function(...args) {
		const runner = getRunner(contract.runner, "estimateGas");
		assert(canEstimate(runner), "contract runner does not support gas estimation", "UNSUPPORTED_OPERATION", { operation: "estimateGas" });
		return await runner.estimateGas(await populateTransaction(...args));
	};
	const staticCallResult = async function(...args) {
		const runner = getRunner(contract.runner, "call");
		assert(canCall(runner), "contract runner does not support calling", "UNSUPPORTED_OPERATION", { operation: "call" });
		const tx = await populateTransaction(...args);
		let result = "0x";
		try {
			result = await runner.call(tx);
		} catch (error) {
			if (isCallException(error) && error.data) throw contract.interface.makeError(error.data, tx);
			throw error;
		}
		const fragment = getFragment(...args);
		return contract.interface.decodeFunctionResult(fragment, result);
	};
	const method = async (...args) => {
		if (getFragment(...args).constant) return await staticCall(...args);
		return await send(...args);
	};
	defineProperties(method, {
		name: contract.interface.getFunctionName(key),
		_contract: contract,
		_key: key,
		getFragment,
		estimateGas,
		populateTransaction,
		send,
		staticCall,
		staticCallResult
	});
	Object.defineProperty(method, "fragment", {
		configurable: false,
		enumerable: true,
		get: () => {
			const fragment = contract.interface.getFunction(key);
			assert(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
				operation: "fragment",
				info: { key }
			});
			return fragment;
		}
	});
	return method;
}
function buildWrappedEvent(contract, key) {
	const getFragment = function(...args) {
		const fragment = contract.interface.getEvent(key, args);
		assert(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
			operation: "fragment",
			info: {
				key,
				args
			}
		});
		return fragment;
	};
	const method = function(...args) {
		return new PreparedTopicFilter(contract, getFragment(...args), args);
	};
	defineProperties(method, {
		name: contract.interface.getEventName(key),
		_contract: contract,
		_key: key,
		getFragment
	});
	Object.defineProperty(method, "fragment", {
		configurable: false,
		enumerable: true,
		get: () => {
			const fragment = contract.interface.getEvent(key);
			assert(fragment, "no matching fragment", "UNSUPPORTED_OPERATION", {
				operation: "fragment",
				info: { key }
			});
			return fragment;
		}
	});
	return method;
}
var internal = Symbol.for("_ethersInternal_contract");
var internalValues = /* @__PURE__ */ new WeakMap();
function setInternal(contract, values) {
	internalValues.set(contract[internal], values);
}
function getInternal(contract) {
	return internalValues.get(contract[internal]);
}
function isDeferred(value) {
	return value && typeof value === "object" && "getTopicFilter" in value && typeof value.getTopicFilter === "function" && value.fragment;
}
async function getSubInfo(contract, event) {
	let topics;
	let fragment = null;
	if (Array.isArray(event)) {
		const topicHashify = function(name) {
			if (isHexString(name, 32)) return name;
			const fragment = contract.interface.getEvent(name);
			assertArgument(fragment, "unknown fragment", "name", name);
			return fragment.topicHash;
		};
		topics = event.map((e) => {
			if (e == null) return null;
			if (Array.isArray(e)) return e.map(topicHashify);
			return topicHashify(e);
		});
	} else if (event === "*") topics = [null];
	else if (typeof event === "string") {
		if (isHexString(event, 32)) topics = [event];
		else {
			fragment = contract.interface.getEvent(event);
			assertArgument(fragment, "unknown fragment", "event", event);
			topics = [fragment.topicHash];
		}
	} else if (isDeferred(event)) topics = await event.getTopicFilter();
	else if ("fragment" in event) {
		fragment = event.fragment;
		topics = [fragment.topicHash];
	} else assertArgument(false, "unknown event name", "event", event);
	topics = topics.map((t) => {
		if (t == null) return null;
		if (Array.isArray(t)) {
			const items = Array.from(new Set(t.map((t) => t.toLowerCase())).values());
			if (items.length === 1) return items[0];
			items.sort();
			return items;
		}
		return t.toLowerCase();
	});
	const tag = topics.map((t) => {
		if (t == null) return "null";
		if (Array.isArray(t)) return t.join("|");
		return t;
	}).join("&");
	return {
		fragment,
		tag,
		topics
	};
}
async function hasSub(contract, event) {
	const { subs } = getInternal(contract);
	return subs.get((await getSubInfo(contract, event)).tag) || null;
}
async function getSub(contract, operation, event) {
	const provider = getProvider(contract.runner);
	assert(provider, "contract runner does not support subscribing", "UNSUPPORTED_OPERATION", { operation });
	const { fragment, tag, topics } = await getSubInfo(contract, event);
	const { addr, subs } = getInternal(contract);
	let sub = subs.get(tag);
	if (!sub) {
		const filter = {
			address: addr ? addr : contract,
			topics
		};
		const listener = (log) => {
			let foundFragment = fragment;
			if (foundFragment == null) try {
				foundFragment = contract.interface.getEvent(log.topics[0]);
			} catch (error) {}
			if (foundFragment) {
				const _foundFragment = foundFragment;
				emit(contract, event, fragment ? contract.interface.decodeEventLog(fragment, log.data, log.topics) : [], (listener) => {
					return new ContractEventPayload(contract, listener, event, _foundFragment, log);
				});
			} else emit(contract, event, [], (listener) => {
				return new ContractUnknownEventPayload(contract, listener, event, log);
			});
		};
		let starting = [];
		const start = () => {
			if (starting.length) return;
			starting.push(provider.on(filter, listener));
		};
		const stop = async () => {
			if (starting.length == 0) return;
			let started = starting;
			starting = [];
			await Promise.all(started);
			provider.off(filter, listener);
		};
		sub = {
			tag,
			listeners: [],
			start,
			stop
		};
		subs.set(tag, sub);
	}
	return sub;
}
var lastEmit = Promise.resolve();
async function _emit(contract, event, args, payloadFunc) {
	await lastEmit;
	const sub = await hasSub(contract, event);
	if (!sub) return false;
	const count = sub.listeners.length;
	sub.listeners = sub.listeners.filter(({ listener, once }) => {
		const passArgs = Array.from(args);
		if (payloadFunc) passArgs.push(payloadFunc(once ? null : listener));
		try {
			listener.call(contract, ...passArgs);
		} catch (error) {}
		return !once;
	});
	if (sub.listeners.length === 0) {
		sub.stop();
		getInternal(contract).subs.delete(sub.tag);
	}
	return count > 0;
}
async function emit(contract, event, args, payloadFunc) {
	try {
		await lastEmit;
	} catch (error) {}
	const resultPromise = _emit(contract, event, args, payloadFunc);
	lastEmit = resultPromise;
	return await resultPromise;
}
var passProperties = ["then"];
var BaseContract = class BaseContract {
	/**
	*  The target to connect to.
	*
	*  This can be an address, ENS name or any [[Addressable]], such as
	*  another contract. To get the resolved address, use the ``getAddress``
	*  method.
	*/
	target;
	/**
	*  The contract Interface.
	*/
	interface;
	/**
	*  The connected runner. This is generally a [[Provider]] or a
	*  [[Signer]], which dictates what operations are supported.
	*
	*  For example, a **Contract** connected to a [[Provider]] may
	*  only execute read-only operations.
	*/
	runner;
	/**
	*  All the Events available on this contract.
	*/
	filters;
	/**
	*  @_ignore:
	*/
	[internal];
	/**
	*  The fallback or receive function if any.
	*/
	fallback;
	/**
	*  Creates a new contract connected to %%target%% with the %%abi%% and
	*  optionally connected to a %%runner%% to perform operations on behalf
	*  of.
	*/
	constructor(target, abi, runner, _deployTx) {
		assertArgument(typeof target === "string" || isAddressable(target), "invalid value for Contract target", "target", target);
		if (runner == null) runner = null;
		const iface = Interface.from(abi);
		defineProperties(this, {
			target,
			runner,
			interface: iface
		});
		Object.defineProperty(this, internal, { value: {} });
		let addrPromise;
		let addr = null;
		let deployTx = null;
		if (_deployTx) {
			const provider = getProvider(runner);
			deployTx = new ContractTransactionResponse(this.interface, provider, _deployTx);
		}
		let subs = /* @__PURE__ */ new Map();
		if (typeof target === "string") {
			if (isHexString(target)) {
				addr = target;
				addrPromise = Promise.resolve(target);
			} else {
				const resolver = getRunner(runner, "resolveName");
				if (!canResolve(resolver)) throw makeError("contract runner does not support name resolution", "UNSUPPORTED_OPERATION", { operation: "resolveName" });
				addrPromise = resolver.resolveName(target).then((addr) => {
					if (addr == null) throw makeError("an ENS name used for a contract target must be correctly configured", "UNCONFIGURED_NAME", { value: target });
					getInternal(this).addr = addr;
					return addr;
				});
			}
		} else addrPromise = target.getAddress().then((addr) => {
			if (addr == null) throw new Error("TODO");
			getInternal(this).addr = addr;
			return addr;
		});
		setInternal(this, {
			addrPromise,
			addr,
			deployTx,
			subs
		});
		const filters = new Proxy({}, {
			get: (target, prop, receiver) => {
				if (typeof prop === "symbol" || passProperties.indexOf(prop) >= 0) return Reflect.get(target, prop, receiver);
				try {
					return this.getEvent(prop);
				} catch (error) {
					if (!isError(error, "INVALID_ARGUMENT") || error.argument !== "key") throw error;
				}
			},
			has: (target, prop) => {
				if (passProperties.indexOf(prop) >= 0) return Reflect.has(target, prop);
				return Reflect.has(target, prop) || this.interface.hasEvent(String(prop));
			}
		});
		defineProperties(this, { filters });
		defineProperties(this, { fallback: iface.receive || iface.fallback ? buildWrappedFallback(this) : null });
		return new Proxy(this, {
			get: (target, prop, receiver) => {
				if (typeof prop === "symbol" || prop in target || passProperties.indexOf(prop) >= 0) return Reflect.get(target, prop, receiver);
				try {
					return target.getFunction(prop);
				} catch (error) {
					if (!isError(error, "INVALID_ARGUMENT") || error.argument !== "key") throw error;
				}
			},
			has: (target, prop) => {
				if (typeof prop === "symbol" || prop in target || passProperties.indexOf(prop) >= 0) return Reflect.has(target, prop);
				return target.interface.hasFunction(prop);
			}
		});
	}
	/**
	*  Return a new Contract instance with the same target and ABI, but
	*  a different %%runner%%.
	*/
	connect(runner) {
		return new BaseContract(this.target, this.interface, runner);
	}
	/**
	*  Return a new Contract instance with the same ABI and runner, but
	*  a different %%target%%.
	*/
	attach(target) {
		return new BaseContract(target, this.interface, this.runner);
	}
	/**
	*  Return the resolved address of this Contract.
	*/
	async getAddress() {
		return await getInternal(this).addrPromise;
	}
	/**
	*  Return the deployed bytecode or null if no bytecode is found.
	*/
	async getDeployedCode() {
		const provider = getProvider(this.runner);
		assert(provider, "runner does not support .provider", "UNSUPPORTED_OPERATION", { operation: "getDeployedCode" });
		const code = await provider.getCode(await this.getAddress());
		if (code === "0x") return null;
		return code;
	}
	/**
	*  Resolve to this Contract once the bytecode has been deployed, or
	*  resolve immediately if already deployed.
	*/
	async waitForDeployment() {
		const deployTx = this.deploymentTransaction();
		if (deployTx) {
			await deployTx.wait();
			return this;
		}
		if (await this.getDeployedCode() != null) return this;
		const provider = getProvider(this.runner);
		assert(provider != null, "contract runner does not support .provider", "UNSUPPORTED_OPERATION", { operation: "waitForDeployment" });
		return new Promise((resolve, reject) => {
			const checkCode = async () => {
				try {
					if (await this.getDeployedCode() != null) return resolve(this);
					provider.once("block", checkCode);
				} catch (error) {
					reject(error);
				}
			};
			checkCode();
		});
	}
	/**
	*  Return the transaction used to deploy this contract.
	*
	*  This is only available if this instance was returned from a
	*  [[ContractFactory]].
	*/
	deploymentTransaction() {
		return getInternal(this).deployTx;
	}
	/**
	*  Return the function for a given name. This is useful when a contract
	*  method name conflicts with a JavaScript name such as ``prototype`` or
	*  when using a Contract programmatically.
	*/
	getFunction(key) {
		if (typeof key !== "string") key = key.format();
		return buildWrappedMethod(this, key);
	}
	/**
	*  Return the event for a given name. This is useful when a contract
	*  event name conflicts with a JavaScript name such as ``prototype`` or
	*  when using a Contract programmatically.
	*/
	getEvent(key) {
		if (typeof key !== "string") key = key.format();
		return buildWrappedEvent(this, key);
	}
	/**
	*  @_ignore:
	*/
	async queryTransaction(hash) {
		throw new Error("@TODO");
	}
	/**
	*  Provide historic access to event data for %%event%% in the range
	*  %%fromBlock%% (default: ``0``) to %%toBlock%% (default: ``"latest"``)
	*  inclusive.
	*/
	async queryFilter(event, fromBlock, toBlock) {
		if (fromBlock == null) fromBlock = 0;
		if (toBlock == null) toBlock = "latest";
		const { addr, addrPromise } = getInternal(this);
		const address = addr ? addr : await addrPromise;
		const { fragment, topics } = await getSubInfo(this, event);
		const filter = {
			address,
			topics,
			fromBlock,
			toBlock
		};
		const provider = getProvider(this.runner);
		assert(provider, "contract runner does not have a provider", "UNSUPPORTED_OPERATION", { operation: "queryFilter" });
		return (await provider.getLogs(filter)).map((log) => {
			let foundFragment = fragment;
			if (foundFragment == null) try {
				foundFragment = this.interface.getEvent(log.topics[0]);
			} catch (error) {}
			if (foundFragment) try {
				return new EventLog(log, this.interface, foundFragment);
			} catch (error) {
				return new UndecodedEventLog(log, error);
			}
			return new Log(log, provider);
		});
	}
	/**
	*  Add an event %%listener%% for the %%event%%.
	*/
	async on(event, listener) {
		const sub = await getSub(this, "on", event);
		sub.listeners.push({
			listener,
			once: false
		});
		sub.start();
		return this;
	}
	/**
	*  Add an event %%listener%% for the %%event%%, but remove the listener
	*  after it is fired once.
	*/
	async once(event, listener) {
		const sub = await getSub(this, "once", event);
		sub.listeners.push({
			listener,
			once: true
		});
		sub.start();
		return this;
	}
	/**
	*  Emit an %%event%% calling all listeners with %%args%%.
	*
	*  Resolves to ``true`` if any listeners were called.
	*/
	async emit(event, ...args) {
		return await emit(this, event, args, null);
	}
	/**
	*  Resolves to the number of listeners of %%event%% or the total number
	*  of listeners if unspecified.
	*/
	async listenerCount(event) {
		if (event) {
			const sub = await hasSub(this, event);
			if (!sub) return 0;
			return sub.listeners.length;
		}
		const { subs } = getInternal(this);
		let total = 0;
		for (const { listeners } of subs.values()) total += listeners.length;
		return total;
	}
	/**
	*  Resolves to the listeners subscribed to %%event%% or all listeners
	*  if unspecified.
	*/
	async listeners(event) {
		if (event) {
			const sub = await hasSub(this, event);
			if (!sub) return [];
			return sub.listeners.map(({ listener }) => listener);
		}
		const { subs } = getInternal(this);
		let result = [];
		for (const { listeners } of subs.values()) result = result.concat(listeners.map(({ listener }) => listener));
		return result;
	}
	/**
	*  Remove the %%listener%% from the listeners for %%event%% or remove
	*  all listeners if unspecified.
	*/
	async off(event, listener) {
		const sub = await hasSub(this, event);
		if (!sub) return this;
		if (listener) {
			const index = sub.listeners.map(({ listener }) => listener).indexOf(listener);
			if (index >= 0) sub.listeners.splice(index, 1);
		}
		if (listener == null || sub.listeners.length === 0) {
			sub.stop();
			getInternal(this).subs.delete(sub.tag);
		}
		return this;
	}
	/**
	*  Remove all the listeners for %%event%% or remove all listeners if
	*  unspecified.
	*/
	async removeAllListeners(event) {
		if (event) {
			const sub = await hasSub(this, event);
			if (!sub) return this;
			sub.stop();
			getInternal(this).subs.delete(sub.tag);
		} else {
			const { subs } = getInternal(this);
			for (const { tag, stop } of subs.values()) {
				stop();
				subs.delete(tag);
			}
		}
		return this;
	}
	/**
	*  Alias for [on].
	*/
	async addListener(event, listener) {
		return await this.on(event, listener);
	}
	/**
	*  Alias for [off].
	*/
	async removeListener(event, listener) {
		return await this.off(event, listener);
	}
	/**
	*  Create a new Class for the %%abi%%.
	*/
	static buildClass(abi) {
		class CustomContract extends BaseContract {
			constructor(address, runner = null) {
				super(address, abi, runner);
			}
		}
		return CustomContract;
	}
	/**
	*  Create a new BaseContract with a specified Interface.
	*/
	static from(target, abi, runner) {
		if (runner == null) runner = null;
		return new this(target, abi, runner);
	}
};
function _ContractBase() {
	return BaseContract;
}
/**
*  A [[BaseContract]] with no type guards on its methods or events.
*/
var Contract = class extends _ContractBase() {};
//#endregion
//#region node_modules/ethers/lib.esm/providers/ens-resolver.js
/**
*  ENS is a service which allows easy-to-remember names to map to
*  network addresses.
*
*  @_section: api/providers/ens-resolver:ENS Resolver  [about-ens-rsolver]
*/
var BN_60 = BigInt(60);
function getIpfsLink(link) {
	if (link.match(/^ipfs:\/\/ipfs\//i)) link = link.substring(12);
	else if (link.match(/^ipfs:\/\//i)) link = link.substring(7);
	else assertArgument(false, "unsupported IPFS format", "link", link);
	return `https:/\/gateway.ipfs.io/ipfs/${link}`;
}
/**
*  A provider plugin super-class for processing multicoin address types.
*/
var MulticoinProviderPlugin = class {
	/**
	*  The name.
	*/
	name;
	/**
	*  Creates a new **MulticoinProviderPluing** for %%name%%.
	*/
	constructor(name) {
		defineProperties(this, { name });
	}
	connect(provider) {
		return this;
	}
	/**
	*  Returns ``true`` if %%coinType%% is supported by this plugin.
	*/
	supportsCoinType(coinType) {
		return false;
	}
	/**
	*  Resolves to the encoded %%address%% for %%coinType%%.
	*/
	async encodeAddress(coinType, address) {
		throw new Error("unsupported coin");
	}
	/**
	*  Resolves to the decoded %%data%% for %%coinType%%.
	*/
	async decodeAddress(coinType, data) {
		throw new Error("unsupported coin");
	}
};
var matcherIpfs = /* @__PURE__ */ new RegExp("^(ipfs)://(.*)$", "i");
var matchers = [
	/* @__PURE__ */ new RegExp("^(https)://(.*)$", "i"),
	/* @__PURE__ */ new RegExp("^(data):(.*)$", "i"),
	matcherIpfs,
	/* @__PURE__ */ new RegExp("^eip155:[0-9]+/(erc[0-9]+):(.*)$", "i")
];
function isEvmCoinType(coinType) {
	return coinType === BN_60 || coinType >= 2147483648 && coinType <= 4294967295;
}
/**
*  A connected object to a resolved ENS name resolver, which can be
*  used to query additional details.
*/
var EnsResolver = class EnsResolver {
	/**
	*  The connected provider.
	*/
	provider;
	/**
	*  The address of the resolver.
	*/
	address;
	/**
	*  The name this resolver was resolved against.
	*/
	name;
	#supports2544;
	#resolver;
	constructor(provider, address, name, supportsWildcard) {
		defineProperties(this, {
			provider,
			address,
			name
		});
		this.#supports2544 = supportsWildcard != null ? Promise.resolve(supportsWildcard) : null;
		this.#resolver = new Contract(address, [
			"function supportsInterface(bytes4) view returns (bool)",
			"function resolve(bytes, bytes) view returns (bytes)",
			"function addr(bytes32) view returns (address)",
			"function addr(bytes32, uint) view returns (bytes)",
			"function text(bytes32, string) view returns (string)",
			"function contenthash(bytes32) view returns (bytes)",
			"function name(bytes32) view returns (string)"
		], provider);
	}
	/**
	*  Resolves to true if the resolver supports wildcard resolution.
	*/
	async supportsWildcard() {
		if (this.#supports2544 == null) this.#supports2544 = (async () => {
			try {
				return await this.#resolver.supportsInterface("0x9061b923");
			} catch (error) {
				if (isError(error, "CALL_EXCEPTION")) return false;
				this.#supports2544 = null;
				throw error;
			}
		})();
		return await this.#supports2544;
	}
	async #fetch(funcName, params) {
		params = (params || []).slice();
		const iface = this.#resolver.interface;
		params.unshift(namehash(this.name));
		let fragment = null;
		if (await this.supportsWildcard()) {
			fragment = iface.getFunction(funcName);
			assert(fragment, "missing fragment", "UNKNOWN_ERROR", { info: { funcName } });
			params = [dnsEncode(this.name, 255), iface.encodeFunctionData(fragment, params)];
			funcName = "resolve(bytes,bytes)";
		}
		params.push({ enableCcipRead: true });
		try {
			const result = await this.#resolver[funcName](...params);
			if (fragment) return iface.decodeFunctionResult(fragment, result)[0];
			return result;
		} catch (error) {
			if (!isError(error, "CALL_EXCEPTION")) throw error;
		}
		return null;
	}
	/**
	*  Resolves to the address for %%coinType%% or null if the
	*  provided %%coinType%% has not been configured.
	*/
	async getAddress(_coinType) {
		const coinType = _coinType == null ? BN_60 : getBigInt(_coinType);
		if (coinType === BN_60) try {
			const result = await this.#fetch("addr(bytes32)");
			if (result == null || result === "0x0000000000000000000000000000000000000000") return null;
			return result;
		} catch (error) {
			if (isError(error, "CALL_EXCEPTION")) return null;
			throw error;
		}
		if (isEvmCoinType(coinType)) {
			const data = await this.#fetch("addr(bytes32,uint)", [coinType]);
			if (isHexString(data, 20)) return getAddress(data);
			return null;
		}
		if (coinType >= 0 && coinType < 2147483648) {
			let ethCoinType = coinType + BigInt(2147483648);
			const data = await this.#fetch("addr(bytes32,uint)", [ethCoinType]);
			if (isHexString(data, 20)) return getAddress(data);
		}
		let coinPlugin = null;
		for (const plugin of this.provider.plugins) {
			if (!(plugin instanceof MulticoinProviderPlugin)) continue;
			if (coinType <= 2147483648 && plugin.supportsCoinType(Number(coinType))) {
				coinPlugin = plugin;
				break;
			}
		}
		if (coinPlugin == null) return null;
		const data = await this.#fetch("addr(bytes32,uint)", [coinType]);
		if (data == null || data === "0x") return null;
		if (coinType < 2147483648) {
			const address = await coinPlugin.decodeAddress(Number(coinType), data);
			if (address != null) return address;
		}
		assert(false, `invalid coin data`, "UNSUPPORTED_OPERATION", {
			operation: `getAddress(${coinType})`,
			info: {
				coinType,
				data
			}
		});
	}
	/**
	*  Resolves to the EIP-634 text record for %%key%%, or ``null``
	*  if unconfigured.
	*/
	async getText(key) {
		const data = await this.#fetch("text(bytes32,string)", [key]);
		if (data == null || data === "0x") return null;
		return data;
	}
	/**
	*  Rsolves to the content-hash or ``null`` if unconfigured.
	*/
	async getContentHash() {
		const data = await this.#fetch("contenthash(bytes32)");
		if (data == null || data === "0x") return null;
		const ipfs = data.match(/^0x(e3010170|e5010172)(([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f]*))$/);
		if (ipfs) {
			const scheme = ipfs[1] === "e3010170" ? "ipfs" : "ipns";
			const length = parseInt(ipfs[4], 16);
			if (ipfs[5].length === length * 2) return `${scheme}:/\/${encodeBase58("0x" + ipfs[2])}`;
		}
		const swarm = data.match(/^0xe40101fa011b20([0-9a-f]*)$/);
		if (swarm && swarm[1].length === 64) return `bzz:/\/${swarm[1]}`;
		assert(false, `invalid or unsupported content hash data`, "UNSUPPORTED_OPERATION", {
			operation: "getContentHash()",
			info: { data }
		});
	}
	async getName() {
		return await this.#fetch("name(bytes32)");
	}
	/**
	*  Resolves to the avatar url or ``null`` if the avatar is either
	*  unconfigured or incorrectly configured (e.g. references an NFT
	*  not owned by the address).
	*
	*  If diagnosing issues with configurations, the [[_getAvatar]]
	*  method may be useful.
	*/
	async getAvatar() {
		return (await this._getAvatar()).url;
	}
	/**
	*  When resolving an avatar, there are many steps involved, such
	*  fetching metadata and possibly validating ownership of an
	*  NFT.
	*
	*  This method can be used to examine each step and the value it
	*  was working from.
	*/
	async _getAvatar() {
		const linkage = [{
			type: "name",
			value: this.name
		}];
		try {
			const avatar = await this.getText("avatar");
			if (avatar == null) {
				linkage.push({
					type: "!avatar",
					value: ""
				});
				return {
					url: null,
					linkage
				};
			}
			linkage.push({
				type: "avatar",
				value: avatar
			});
			for (let i = 0; i < matchers.length; i++) {
				const match = avatar.match(matchers[i]);
				if (match == null) continue;
				const scheme = match[1].toLowerCase();
				switch (scheme) {
					case "https":
					case "data":
						linkage.push({
							type: "url",
							value: avatar
						});
						return {
							linkage,
							url: avatar
						};
					case "ipfs": {
						const url = getIpfsLink(avatar);
						linkage.push({
							type: "ipfs",
							value: avatar
						});
						linkage.push({
							type: "url",
							value: url
						});
						return {
							linkage,
							url
						};
					}
					case "erc721":
					case "erc1155": {
						const selector = scheme === "erc721" ? "tokenURI(uint256)" : "uri(uint256)";
						linkage.push({
							type: scheme,
							value: avatar
						});
						const owner = await this.getAddress();
						if (owner == null) {
							linkage.push({
								type: "!owner",
								value: ""
							});
							return {
								url: null,
								linkage
							};
						}
						const comps = (match[2] || "").split("/");
						if (comps.length !== 2) {
							linkage.push({
								type: `!${scheme}caip`,
								value: match[2] || ""
							});
							return {
								url: null,
								linkage
							};
						}
						const tokenId = comps[1];
						const contract = new Contract(comps[0], [
							"function tokenURI(uint) view returns (string)",
							"function ownerOf(uint) view returns (address)",
							"function uri(uint) view returns (string)",
							"function balanceOf(address, uint256) view returns (uint)"
						], this.provider);
						if (scheme === "erc721") {
							const tokenOwner = await contract.ownerOf(tokenId);
							if (owner !== tokenOwner) {
								linkage.push({
									type: "!owner",
									value: tokenOwner
								});
								return {
									url: null,
									linkage
								};
							}
							linkage.push({
								type: "owner",
								value: tokenOwner
							});
						} else if (scheme === "erc1155") {
							const balance = await contract.balanceOf(owner, tokenId);
							if (!balance) {
								linkage.push({
									type: "!balance",
									value: "0"
								});
								return {
									url: null,
									linkage
								};
							}
							linkage.push({
								type: "balance",
								value: balance.toString()
							});
						}
						let metadataUrl = await contract[selector](tokenId);
						if (metadataUrl == null || metadataUrl === "0x") {
							linkage.push({
								type: "!metadata-url",
								value: ""
							});
							return {
								url: null,
								linkage
							};
						}
						linkage.push({
							type: "metadata-url-base",
							value: metadataUrl
						});
						if (scheme === "erc1155") {
							metadataUrl = metadataUrl.replace("{id}", toBeHex(tokenId, 32).substring(2));
							linkage.push({
								type: "metadata-url-expanded",
								value: metadataUrl
							});
						}
						if (metadataUrl.match(/^ipfs:/i)) metadataUrl = getIpfsLink(metadataUrl);
						linkage.push({
							type: "metadata-url",
							value: metadataUrl
						});
						let metadata = {};
						const response = await new FetchRequest(metadataUrl).send();
						response.assertOk();
						try {
							metadata = response.bodyJson;
						} catch (error) {
							try {
								linkage.push({
									type: "!metadata",
									value: response.bodyText
								});
							} catch (error) {
								const bytes = response.body;
								if (bytes) linkage.push({
									type: "!metadata",
									value: hexlify(bytes)
								});
								return {
									url: null,
									linkage
								};
							}
							return {
								url: null,
								linkage
							};
						}
						if (!metadata) {
							linkage.push({
								type: "!metadata",
								value: ""
							});
							return {
								url: null,
								linkage
							};
						}
						linkage.push({
							type: "metadata",
							value: JSON.stringify(metadata)
						});
						let imageUrl = metadata.image;
						if (typeof imageUrl !== "string") {
							linkage.push({
								type: "!imageUrl",
								value: ""
							});
							return {
								url: null,
								linkage
							};
						}
						if (imageUrl.match(/^(https:\/\/|data:)/i)) {} else {
							if (imageUrl.match(matcherIpfs) == null) {
								linkage.push({
									type: "!imageUrl-ipfs",
									value: imageUrl
								});
								return {
									url: null,
									linkage
								};
							}
							linkage.push({
								type: "imageUrl-ipfs",
								value: imageUrl
							});
							imageUrl = getIpfsLink(imageUrl);
						}
						linkage.push({
							type: "url",
							value: imageUrl
						});
						return {
							linkage,
							url: imageUrl
						};
					}
				}
			}
		} catch (error) {}
		return {
			linkage,
			url: null
		};
	}
	static async getEnsAddress(provider) {
		const network = await provider.getNetwork();
		const ensPlugin = network.getPlugin("org.ethers.plugins.network.Ens");
		assert(ensPlugin, "network does not support ENS", "UNSUPPORTED_OPERATION", {
			operation: "getEnsAddress",
			info: { network }
		});
		return ensPlugin.address;
	}
	static async getUniversalResolverAddress(provider) {
		const ensPlugin = (await provider.getNetwork()).getPlugin("org.ethers.plugins.network.Ens");
		if (ensPlugin && ensPlugin.universalResolver) return ensPlugin.universalResolver;
		return null;
	}
	static async #getResolver(provider, name) {
		const ensAddr = await EnsResolver.getEnsAddress(provider);
		try {
			const addr = await new Contract(ensAddr, ["function resolver(bytes32) view returns (address)"], provider).resolver(namehash(name), { enableCcipRead: true });
			if (addr === "0x0000000000000000000000000000000000000000") return null;
			return addr;
		} catch (error) {
			throw error;
		}
	}
	static async lookupAddress(provider, address, _coinType) {
		const coinType = _coinType == null ? BN_60 : getBigInt(_coinType);
		if (isEvmCoinType(coinType)) address = getAddress(address);
		const universal = await createUniversal(provider);
		if (universal) try {
			const addr = (await universal.reverse(address, coinType, { enableCcipRead: true })).primary;
			if (!isValidName(addr)) return null;
			return addr;
		} catch (e) {
			if (isError(e, "CALL_EXCEPTION") && e.reason === "ResolverNotFound(bytes)") return null;
			throw e;
		}
		assert(coinType === BN_60, "lookupAddress coinType requires ENS Universal Resolver", "UNSUPPORTED_OPERATION", { operation: "lookupAddress" });
		try {
			const resolver = await EnsResolver.fromName(provider, `${address.toLowerCase().substring(2)}.addr.reverse`);
			if (!resolver) return null;
			const name = await resolver.getName();
			if (name == null || !isValidName(name)) return null;
			if (await provider.resolveName(name) !== address) return null;
			return name;
		} catch (error) {
			if (isError(error, "BAD_DATA") && error.value === "0x") return null;
			if (isError(error, "CALL_EXCEPTION")) return null;
			throw error;
		}
	}
	/**
	*  Resolve to the ENS resolver for %%name%% using %%provider%% or
	*  ``null`` if unconfigured.
	*/
	static async fromName(provider, name) {
		const universal = await createUniversal(provider);
		if (universal) {
			let dnsName;
			try {
				dnsName = dnsEncode(ensNormalize(name), 255);
			} catch (error) {
				return null;
			}
			const result = await universal.requireResolver(dnsName);
			return new EnsResolver(provider, result.resolver, name, result.extended);
		}
		let currentName = name;
		while (true) {
			if (currentName === "" || currentName === ".") return null;
			if (name !== "eth" && currentName === "eth") return null;
			const addr = await EnsResolver.#getResolver(provider, currentName);
			if (addr != null) {
				const resolver = new EnsResolver(provider, addr, name);
				if (currentName !== name && !await resolver.supportsWildcard()) return null;
				return resolver;
			}
			currentName = currentName.split(".").slice(1).join(".");
		}
	}
};
async function createUniversal(provider) {
	const address = await EnsResolver.getUniversalResolverAddress(provider);
	if (!address) return null;
	return new Contract(address, [
		"function requireResolver(bytes) view returns ((bytes name, uint256 offset, bytes32 node, address resolver, bool extended))",
		"function findResolver(bytes) view returns (address resolver, bytes32 node, uint offset)",
		"function resolve(bytes name, bytes data) view returns (bytes result, address resolver)",
		"function reverse(bytes name, uint coinType) view returns (string primary, address resolver, address reverseResolver)",
		"error ResolverNotFound(bytes name)",
		"error ResolverNotContract(bytes name, address resolver)",
		"error ReverseAddressMismatch(string primary, bytes primaryAddress)",
		"error HttpError(uint16 statusCode, string statusMessage)"
	], provider);
}
//#endregion
//#region node_modules/ethers/lib.esm/providers/format.js
/**
*  @_ignore
*/
var BN_0 = BigInt(0);
function allowNull(format, nullValue) {
	return (function(value) {
		if (value == null) return nullValue;
		return format(value);
	});
}
function arrayOf(format, allowNull) {
	return ((array) => {
		if (allowNull && array == null) return null;
		if (!Array.isArray(array)) throw new Error("not an array");
		return array.map((i) => format(i));
	});
}
function object(format, altNames) {
	return ((value) => {
		const result = {};
		for (const key in format) {
			let srcKey = key;
			if (altNames && key in altNames && !(srcKey in value)) {
				for (const altKey of altNames[key]) if (altKey in value) {
					srcKey = altKey;
					break;
				}
			}
			try {
				const nv = format[key](value[srcKey]);
				if (nv !== void 0) result[key] = nv;
			} catch (error) {
				assert(false, `invalid value for value.${key} (${error instanceof Error ? error.message : "not-an-error"})`, "BAD_DATA", { value });
			}
		}
		return result;
	});
}
function formatBoolean(value) {
	switch (value) {
		case true:
		case "true": return true;
		case false:
		case "false": return false;
	}
	assertArgument(false, `invalid boolean; ${JSON.stringify(value)}`, "value", value);
}
function formatData(value) {
	assertArgument(isHexString(value, true), "invalid data", "value", value);
	return value;
}
function formatHash(value) {
	assertArgument(isHexString(value, 32), "invalid hash", "value", value);
	return value;
}
var _formatLog = object({
	address: getAddress,
	blockHash: formatHash,
	blockNumber: getNumber,
	data: formatData,
	index: getNumber,
	removed: allowNull(formatBoolean, false),
	topics: arrayOf(formatHash),
	transactionHash: formatHash,
	transactionIndex: getNumber
}, { index: ["logIndex"] });
function formatLog(value) {
	return _formatLog(value);
}
var _formatBlock = object({
	hash: allowNull(formatHash),
	parentHash: formatHash,
	parentBeaconBlockRoot: allowNull(formatHash, null),
	number: getNumber,
	timestamp: getNumber,
	nonce: allowNull(formatData),
	difficulty: getBigInt,
	gasLimit: getBigInt,
	gasUsed: getBigInt,
	stateRoot: allowNull(formatHash, null),
	receiptsRoot: allowNull(formatHash, null),
	transactionsRoot: allowNull(formatHash, null),
	blobGasUsed: allowNull(getBigInt, null),
	excessBlobGas: allowNull(getBigInt, null),
	miner: allowNull(getAddress),
	prevRandao: allowNull(formatHash, null),
	extraData: formatData,
	baseFeePerGas: allowNull(getBigInt)
}, { prevRandao: ["mixHash"] });
function formatBlock(value) {
	const result = _formatBlock(value);
	result.transactions = value.transactions.map((tx) => {
		if (typeof tx === "string") return tx;
		return formatTransactionResponse(tx);
	});
	return result;
}
var _formatReceiptLog = object({
	transactionIndex: getNumber,
	blockNumber: getNumber,
	transactionHash: formatHash,
	address: getAddress,
	topics: arrayOf(formatHash),
	data: formatData,
	index: getNumber,
	blockHash: formatHash
}, { index: ["logIndex"] });
function formatReceiptLog(value) {
	return _formatReceiptLog(value);
}
var _formatTransactionReceipt = object({
	to: allowNull(getAddress, null),
	from: allowNull(getAddress, null),
	contractAddress: allowNull(getAddress, null),
	index: getNumber,
	root: allowNull(hexlify),
	gasUsed: getBigInt,
	blobGasUsed: allowNull(getBigInt, null),
	logsBloom: allowNull(formatData),
	blockHash: formatHash,
	hash: formatHash,
	logs: arrayOf(formatReceiptLog),
	blockNumber: getNumber,
	cumulativeGasUsed: getBigInt,
	effectiveGasPrice: allowNull(getBigInt),
	blobGasPrice: allowNull(getBigInt, null),
	status: allowNull(getNumber),
	type: allowNull(getNumber, 0)
}, {
	effectiveGasPrice: ["gasPrice"],
	hash: ["transactionHash"],
	index: ["transactionIndex"]
});
function formatTransactionReceipt(value) {
	return _formatTransactionReceipt(value);
}
function formatTransactionResponse(value) {
	if (value.to && getBigInt(value.to) === BN_0) value.to = "0x0000000000000000000000000000000000000000";
	const result = object({
		hash: formatHash,
		index: allowNull(getNumber, void 0),
		type: (value) => {
			if (value === "0x" || value == null) return 0;
			return getNumber(value);
		},
		accessList: allowNull(accessListify, null),
		blobVersionedHashes: allowNull(arrayOf(formatHash, true), null),
		authorizationList: allowNull(arrayOf((v) => {
			let sig;
			if (v.signature) sig = v.signature;
			else {
				let yParity = v.yParity;
				if (yParity === "0x1b") yParity = 0;
				else if (yParity === "0x1c") yParity = 1;
				sig = Object.assign({}, v, { yParity });
			}
			return {
				address: getAddress(v.address),
				chainId: getBigInt(v.chainId),
				nonce: getBigInt(v.nonce),
				signature: Signature.from(sig)
			};
		}, false), null),
		blockHash: allowNull(formatHash, null),
		blockNumber: allowNull(getNumber, null),
		transactionIndex: allowNull(getNumber, null),
		from: getAddress,
		gasPrice: allowNull(getBigInt),
		maxPriorityFeePerGas: allowNull(getBigInt),
		maxFeePerGas: allowNull(getBigInt),
		maxFeePerBlobGas: allowNull(getBigInt, null),
		gasLimit: getBigInt,
		to: allowNull(getAddress, null),
		value: getBigInt,
		nonce: getNumber,
		data: formatData,
		creates: allowNull(getAddress, null),
		chainId: allowNull(getBigInt, null)
	}, {
		data: ["input"],
		gasLimit: ["gas"],
		index: ["transactionIndex"]
	})(value);
	if (result.to == null && result.creates == null) result.creates = getCreateAddress(result);
	if ((value.type === 1 || value.type === 2) && value.accessList == null) result.accessList = [];
	if (value.signature) result.signature = Signature.from(value.signature);
	else result.signature = Signature.from(value);
	if (result.chainId == null) {
		const chainId = result.signature.legacyChainId;
		if (chainId != null) result.chainId = chainId;
	}
	if (result.blockHash && getBigInt(result.blockHash) === BN_0) result.blockHash = null;
	return result;
}
//#endregion
//#region node_modules/ethers/lib.esm/providers/plugins-network.js
var EnsAddress = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
var inspect$1 = Symbol.for("nodejs.util.inspect.custom");
/**
*  A **NetworkPlugin** provides additional functionality on a [[Network]].
*/
var NetworkPlugin = class NetworkPlugin {
	/**
	*  The name of the plugin.
	*
	*  It is recommended to use reverse-domain-notation, which permits
	*  unique names with a known authority as well as hierarchal entries.
	*/
	name;
	/**
	*  Creates a new **NetworkPlugin**.
	*/
	constructor(name) {
		defineProperties(this, { name });
	}
	[inspect$1]() {
		return this.toString();
	}
	toString() {
		return `${this.name} { }`;
	}
	/**
	*  Creates a copy of this plugin.
	*/
	clone() {
		return new NetworkPlugin(this.name);
	}
};
/**
*  A **GasCostPlugin** allows a network to provide alternative values when
*  computing the intrinsic gas required for a transaction.
*/
var GasCostPlugin = class GasCostPlugin extends NetworkPlugin {
	/**
	*  The block number to treat these values as valid from.
	*
	*  This allows a hardfork to have updated values included as well as
	*  mulutiple hardforks to be supported.
	*/
	effectiveBlock;
	/**
	*  The transactions base fee.
	*/
	txBase;
	/**
	*  The fee for creating a new account.
	*/
	txCreate;
	/**
	*  The fee per zero-byte in the data.
	*/
	txDataZero;
	/**
	*  The fee per non-zero-byte in the data.
	*/
	txDataNonzero;
	/**
	*  The fee per storage key in the [[link-eip-2930]] access list.
	*/
	txAccessListStorageKey;
	/**
	*  The fee per address in the [[link-eip-2930]] access list.
	*/
	txAccessListAddress;
	/**
	*  Creates a new GasCostPlugin from %%effectiveBlock%% until the
	*  latest block or another GasCostPlugin supercedes that block number,
	*  with the associated %%costs%%.
	*/
	constructor(effectiveBlock, costs) {
		if (effectiveBlock == null) effectiveBlock = 0;
		super(`org.ethers.network.plugins.GasCost#${effectiveBlock || 0}`);
		const props = { effectiveBlock };
		function set(name, nullish) {
			let value = (costs || {})[name];
			if (value == null) value = nullish;
			assertArgument(typeof value === "number", `invalud value for ${name}`, "costs", costs);
			props[name] = value;
		}
		set("txBase", 21e3);
		set("txCreate", 32e3);
		set("txDataZero", 4);
		set("txDataNonzero", 16);
		set("txAccessListStorageKey", 1900);
		set("txAccessListAddress", 2400);
		defineProperties(this, props);
	}
	toString() {
		return `${this.name} { txBase: ${this.txBase}, txCreate: ${this.txCreate}, txDataZero: ${this.txDataZero}, txAccessListStorageKey: ${this.txAccessListStorageKey}, txAccessListAddress: ${this.txAccessListAddress} }`;
	}
	clone() {
		return new GasCostPlugin(this.effectiveBlock, this);
	}
};
/**
*  An **EnsPlugin** allows a [[Network]] to specify the ENS Registry
*  Contract address and the target network to use when using that
*  contract.
*
*  Various testnets have their own instance of the contract to use, but
*  in general, the mainnet instance supports multi-chain addresses and
*  should be used.
*/
var EnsPlugin = class EnsPlugin extends NetworkPlugin {
	/**
	*  The ENS Registrty Contract address.
	*/
	address;
	/**
	*  The chain ID that the ENS contract lives on.
	*/
	targetNetwork;
	/**
	*  The Universal Resolver Contract Address.
	*/
	universalResolver;
	/**
	*  Creates a new **EnsPlugin** connected to %%address%% on the
	*  %%targetNetwork%%. The default ENS address and mainnet is used
	*  if unspecified.
	*/
	constructor(address, targetNetwork, universalResolver) {
		super("org.ethers.plugins.network.Ens");
		defineProperties(this, {
			address: address || EnsAddress,
			targetNetwork: targetNetwork == null ? 1 : targetNetwork,
			universalResolver
		});
	}
	toString() {
		return `${this.name} { address: ${this.address}, targetNetwork: ${this.targetNetwork}, universalResolver: ${this.universalResolver} }`;
	}
	clone() {
		return new EnsPlugin(this.address, this.targetNetwork, this.universalResolver);
	}
};
var FetchUrlFeeDataNetworkPlugin = class extends NetworkPlugin {
	#url;
	#processFunc;
	/**
	*  The URL to initialize the FetchRequest with in %%processFunc%%.
	*/
	get url() {
		return this.#url;
	}
	/**
	*  The callback to use when computing the FeeData.
	*/
	get processFunc() {
		return this.#processFunc;
	}
	/**
	*  Creates a new **FetchUrlFeeDataNetworkPlugin** which will
	*  be used when computing the fee data for the network.
	*/
	constructor(url, processFunc) {
		super("org.ethers.plugins.network.FetchUrlFeeDataPlugin");
		this.#url = url;
		this.#processFunc = processFunc;
	}
	toString() {
		return `${this.name} { url: ${this.url} }`;
	}
	clone() {
		return this;
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/providers/network.js
/**
*  A **Network** encapsulates the various properties required to
*  interact with a specific chain.
*
*  @_subsection: api/providers:Networks  [networks]
*/
var inspect = Symbol.for("nodejs.util.inspect.custom");
var Networks = /* @__PURE__ */ new Map();
/**
*  A **Network** provides access to a chain's properties and allows
*  for plug-ins to extend functionality.
*/
var Network = class Network {
	#name;
	#chainId;
	#plugins;
	/**
	*  Creates a new **Network** for %%name%% and %%chainId%%.
	*/
	constructor(name, chainId) {
		this.#name = name;
		this.#chainId = getBigInt(chainId);
		this.#plugins = /* @__PURE__ */ new Map();
	}
	[inspect]() {
		return this.toString();
	}
	toString() {
		const plugins = [];
		for (const plugin of this.#plugins.values()) plugins.push(plugin.toString());
		return `Network { name: ${this.name}, chainId: ${this.chainId}, plugins: [ ${plugins.join(", ")} ] }`;
	}
	/**
	*  Returns a JSON-compatible representation of a Network.
	*/
	toJSON() {
		return {
			name: this.name,
			chainId: String(this.chainId)
		};
	}
	/**
	*  The network common name.
	*
	*  This is the canonical name, as networks migh have multiple
	*  names.
	*/
	get name() {
		return this.#name;
	}
	set name(value) {
		this.#name = value;
	}
	/**
	*  The network chain ID.
	*/
	get chainId() {
		return this.#chainId;
	}
	set chainId(value) {
		this.#chainId = getBigInt(value, "chainId");
	}
	/**
	*  Returns true if %%other%% matches this network. Any chain ID
	*  must match, and if no chain ID is present, the name must match.
	*
	*  This method does not currently check for additional properties,
	*  such as ENS address or plug-in compatibility.
	*/
	matches(other) {
		if (other == null) return false;
		if (typeof other === "string") {
			try {
				return this.chainId === getBigInt(other);
			} catch (error) {}
			return this.name === other;
		}
		if (typeof other === "number" || typeof other === "bigint") {
			try {
				return this.chainId === getBigInt(other);
			} catch (error) {}
			return false;
		}
		if (typeof other === "object") {
			if (other.chainId != null) {
				try {
					return this.chainId === getBigInt(other.chainId);
				} catch (error) {}
				return false;
			}
			if (other.name != null) return this.name === other.name;
			return false;
		}
		return false;
	}
	/**
	*  Returns the list of plugins currently attached to this Network.
	*/
	get plugins() {
		return Array.from(this.#plugins.values());
	}
	/**
	*  Attach a new %%plugin%% to this Network. The network name
	*  must be unique, excluding any fragment.
	*/
	attachPlugin(plugin) {
		if (this.#plugins.get(plugin.name)) throw new Error(`cannot replace existing plugin: ${plugin.name} `);
		this.#plugins.set(plugin.name, plugin.clone());
		return this;
	}
	/**
	*  Return the plugin, if any, matching %%name%% exactly. Plugins
	*  with fragments will not be returned unless %%name%% includes
	*  a fragment.
	*/
	getPlugin(name) {
		return this.#plugins.get(name) || null;
	}
	/**
	*  Gets a list of all plugins that match %%name%%, with otr without
	*  a fragment.
	*/
	getPlugins(basename) {
		return this.plugins.filter((p) => p.name.split("#")[0] === basename);
	}
	/**
	*  Create a copy of this Network.
	*/
	clone() {
		const clone = new Network(this.name, this.chainId);
		this.plugins.forEach((plugin) => {
			clone.attachPlugin(plugin.clone());
		});
		return clone;
	}
	/**
	*  Compute the intrinsic gas required for a transaction.
	*
	*  A GasCostPlugin can be attached to override the default
	*  values.
	*/
	computeIntrinsicGas(tx) {
		const costs = this.getPlugin("org.ethers.plugins.network.GasCost") || new GasCostPlugin();
		let gas = costs.txBase;
		if (tx.to == null) gas += costs.txCreate;
		if (tx.data) for (let i = 2; i < tx.data.length; i += 2) if (tx.data.substring(i, i + 2) === "00") gas += costs.txDataZero;
		else gas += costs.txDataNonzero;
		if (tx.accessList) {
			const accessList = accessListify(tx.accessList);
			for (const addr in accessList) gas += costs.txAccessListAddress + costs.txAccessListStorageKey * accessList[addr].storageKeys.length;
		}
		return gas;
	}
	/**
	*  Returns a new Network for the %%network%% name or chainId.
	*/
	static from(network) {
		injectCommonNetworks();
		if (network == null) return Network.from("mainnet");
		if (typeof network === "number") network = BigInt(network);
		if (typeof network === "string" || typeof network === "bigint") {
			const networkFunc = Networks.get(network);
			if (networkFunc) return networkFunc();
			if (typeof network === "bigint") return new Network("unknown", network);
			assertArgument(false, "unknown network", "network", network);
		}
		if (typeof network.clone === "function") return network.clone();
		if (typeof network === "object") {
			assertArgument(typeof network.name === "string" && typeof network.chainId === "number", "invalid network object name or chainId", "network", network);
			const custom = new Network(network.name, network.chainId);
			const n = network;
			if (n.ensAddress || n.ensNetwork != null || n.ensUniversalResolver) custom.attachPlugin(new EnsPlugin(n.ensAddress, n.ensNetwork, n.ensUniversalResolver));
			return custom;
		}
		assertArgument(false, "invalid network", "network", network);
	}
	/**
	*  Register %%nameOrChainId%% with a function which returns
	*  an instance of a Network representing that chain.
	*/
	static register(nameOrChainId, networkFunc) {
		if (typeof nameOrChainId === "number") nameOrChainId = BigInt(nameOrChainId);
		const existing = Networks.get(nameOrChainId);
		if (existing) assertArgument(false, `conflicting network for ${JSON.stringify(existing.name)}`, "nameOrChainId", nameOrChainId);
		Networks.set(nameOrChainId, networkFunc);
	}
};
function parseUnits(_value, decimals) {
	const value = String(_value);
	if (!value.match(/^[0-9.]+$/)) throw new Error(`invalid gwei value: ${_value}`);
	const comps = value.split(".");
	if (comps.length === 1) comps.push("");
	if (comps.length !== 2) throw new Error(`invalid gwei value: ${_value}`);
	while (comps[1].length < decimals) comps[1] += "0";
	if (comps[1].length > 9) {
		let frac = BigInt(comps[1].substring(0, 9));
		if (!comps[1].substring(9).match(/^0+$/)) frac++;
		comps[1] = frac.toString();
	}
	return BigInt(comps[0] + comps[1]);
}
function getGasStationPlugin(url) {
	return new FetchUrlFeeDataNetworkPlugin(url, async (fetchFeeData, provider, request) => {
		request.setHeader("User-Agent", "ethers");
		let response;
		try {
			const [_response, _feeData] = await Promise.all([request.send(), fetchFeeData()]);
			response = _response;
			const payload = response.bodyJson.standard;
			return {
				gasPrice: _feeData.gasPrice,
				maxFeePerGas: parseUnits(payload.maxFee, 9),
				maxPriorityFeePerGas: parseUnits(payload.maxPriorityFee, 9)
			};
		} catch (error) {
			assert(false, `error encountered with polygon gas station (${JSON.stringify(request.url)})`, "SERVER_ERROR", {
				request,
				response,
				error
			});
		}
	});
}
var injected = false;
function injectCommonNetworks() {
	if (injected) return;
	injected = true;
	function registerEth(name, chainId, options) {
		const func = function() {
			const network = new Network(name, chainId);
			if (options.ensNetwork != null) network.attachPlugin(new EnsPlugin(null, options.ensNetwork, options.ensUniversalResolver));
			network.attachPlugin(new GasCostPlugin());
			(options.plugins || []).forEach((plugin) => {
				network.attachPlugin(plugin);
			});
			return network;
		};
		Network.register(name, func);
		Network.register(chainId, func);
		if (options.altNames) options.altNames.forEach((name) => {
			Network.register(name, func);
		});
	}
	const ensUniversalResolver = "0xeEeEEEeE14D718C2B47D9923Deab1335E144EeEe";
	registerEth("mainnet", 1, {
		ensUniversalResolver,
		ensNetwork: 1,
		altNames: ["homestead"]
	});
	registerEth("ropsten", 3, { ensNetwork: 3 });
	registerEth("rinkeby", 4, { ensNetwork: 4 });
	registerEth("goerli", 5, { ensNetwork: 5 });
	registerEth("kovan", 42, { ensNetwork: 42 });
	registerEth("sepolia", 11155111, {
		ensUniversalResolver,
		ensNetwork: 11155111
	});
	registerEth("holesky", 17e3, { ensNetwork: 17e3 });
	registerEth("classic", 61, {});
	registerEth("classicKotti", 6, {});
	registerEth("arbitrum", 42161, { ensNetwork: 1 });
	registerEth("arbitrum-goerli", 421613, {});
	registerEth("arbitrum-sepolia", 421614, {});
	registerEth("base", 8453, { ensNetwork: 1 });
	registerEth("base-goerli", 84531, {});
	registerEth("base-sepolia", 84532, {});
	registerEth("bnb", 56, { ensNetwork: 1 });
	registerEth("bnbt", 97, {});
	registerEth("filecoin", 314, {});
	registerEth("filecoin-calibration", 314159, {});
	registerEth("linea", 59144, { ensNetwork: 1 });
	registerEth("linea-goerli", 59140, {});
	registerEth("linea-sepolia", 59141, {});
	registerEth("matic", 137, {
		ensNetwork: 1,
		plugins: [getGasStationPlugin("https://gasstation.polygon.technology/v2")]
	});
	registerEth("matic-amoy", 80002, {});
	registerEth("matic-mumbai", 80001, {
		altNames: ["maticMumbai", "maticmum"],
		plugins: [getGasStationPlugin("https://gasstation-testnet.polygon.technology/v2")]
	});
	registerEth("optimism", 10, {
		ensNetwork: 1,
		plugins: []
	});
	registerEth("optimism-goerli", 420, {});
	registerEth("optimism-sepolia", 11155420, {});
	registerEth("xdai", 100, { ensNetwork: 1 });
}
//#endregion
//#region node_modules/ethers/lib.esm/providers/subscriber-polling.js
function copy$2(obj) {
	return JSON.parse(JSON.stringify(obj));
}
/**
*  A **PollingBlockSubscriber** polls at a regular interval for a change
*  in the block number.
*
*  @_docloc: api/providers/abstract-provider
*/
var PollingBlockSubscriber = class {
	#provider;
	#poller;
	#interval;
	#blockNumber;
	/**
	*  Create a new **PollingBlockSubscriber** attached to %%provider%%.
	*/
	constructor(provider) {
		this.#provider = provider;
		this.#poller = null;
		this.#interval = 4e3;
		this.#blockNumber = -2;
	}
	/**
	*  The polling interval.
	*/
	get pollingInterval() {
		return this.#interval;
	}
	set pollingInterval(value) {
		this.#interval = value;
	}
	async #poll() {
		try {
			const blockNumber = await this.#provider.getBlockNumber();
			if (this.#blockNumber === -2) {
				this.#blockNumber = blockNumber;
				return;
			}
			if (blockNumber !== this.#blockNumber) {
				for (let b = this.#blockNumber + 1; b <= blockNumber; b++) {
					if (this.#poller == null) return;
					await this.#provider.emit("block", b);
				}
				this.#blockNumber = blockNumber;
			}
		} catch (error) {}
		if (this.#poller == null) return;
		this.#poller = this.#provider._setTimeout(this.#poll.bind(this), this.#interval);
	}
	start() {
		if (this.#poller) return;
		this.#poller = this.#provider._setTimeout(this.#poll.bind(this), this.#interval);
		this.#poll();
	}
	stop() {
		if (!this.#poller) return;
		this.#provider._clearTimeout(this.#poller);
		this.#poller = null;
	}
	pause(dropWhilePaused) {
		this.stop();
		if (dropWhilePaused) this.#blockNumber = -2;
	}
	resume() {
		this.start();
	}
};
/**
*  An **OnBlockSubscriber** can be sub-classed, with a [[_poll]]
*  implmentation which will be called on every new block.
*
*  @_docloc: api/providers/abstract-provider
*/
var OnBlockSubscriber = class {
	#provider;
	#poll;
	#running;
	/**
	*  Create a new **OnBlockSubscriber** attached to %%provider%%.
	*/
	constructor(provider) {
		this.#provider = provider;
		this.#running = false;
		this.#poll = (blockNumber) => {
			this._poll(blockNumber, this.#provider);
		};
	}
	/**
	*  Called on every new block.
	*/
	async _poll(blockNumber, provider) {
		throw new Error("sub-classes must override this");
	}
	start() {
		if (this.#running) return;
		this.#running = true;
		this.#poll(-2);
		this.#provider.on("block", this.#poll);
	}
	stop() {
		if (!this.#running) return;
		this.#running = false;
		this.#provider.off("block", this.#poll);
	}
	pause(dropWhilePaused) {
		this.stop();
	}
	resume() {
		this.start();
	}
};
var PollingBlockTagSubscriber = class extends OnBlockSubscriber {
	#tag;
	#lastBlock;
	constructor(provider, tag) {
		super(provider);
		this.#tag = tag;
		this.#lastBlock = -2;
	}
	pause(dropWhilePaused) {
		if (dropWhilePaused) this.#lastBlock = -2;
		super.pause(dropWhilePaused);
	}
	async _poll(blockNumber, provider) {
		const block = await provider.getBlock(this.#tag);
		if (block == null) return;
		if (this.#lastBlock === -2) this.#lastBlock = block.number;
		else if (block.number > this.#lastBlock) {
			provider.emit(this.#tag, block.number);
			this.#lastBlock = block.number;
		}
	}
};
/**
*  @_ignore:
*
*  @_docloc: api/providers/abstract-provider
*/
var PollingOrphanSubscriber = class extends OnBlockSubscriber {
	#filter;
	constructor(provider, filter) {
		super(provider);
		this.#filter = copy$2(filter);
	}
	async _poll(blockNumber, provider) {
		throw new Error("@TODO");
	}
};
/**
*  A **PollingTransactionSubscriber** will poll for a given transaction
*  hash for its receipt.
*
*  @_docloc: api/providers/abstract-provider
*/
var PollingTransactionSubscriber = class extends OnBlockSubscriber {
	#hash;
	/**
	*  Create a new **PollingTransactionSubscriber** attached to
	*  %%provider%%, listening for %%hash%%.
	*/
	constructor(provider, hash) {
		super(provider);
		this.#hash = hash;
	}
	async _poll(blockNumber, provider) {
		const tx = await provider.getTransactionReceipt(this.#hash);
		if (tx) provider.emit(this.#hash, tx);
	}
};
/**
*  A **PollingEventSubscriber** will poll for a given filter for its logs.
*
*  @_docloc: api/providers/abstract-provider
*/
var PollingEventSubscriber = class {
	#provider;
	#filter;
	#poller;
	#running;
	#blockNumber;
	/**
	*  Create a new **PollingTransactionSubscriber** attached to
	*  %%provider%%, listening for %%filter%%.
	*/
	constructor(provider, filter) {
		this.#provider = provider;
		this.#filter = copy$2(filter);
		this.#poller = this.#poll.bind(this);
		this.#running = false;
		this.#blockNumber = -2;
	}
	async #poll(blockNumber) {
		if (this.#blockNumber === -2) return;
		const filter = copy$2(this.#filter);
		filter.fromBlock = this.#blockNumber + 1;
		filter.toBlock = blockNumber;
		const logs = await this.#provider.getLogs(filter);
		if (logs.length === 0) {
			if (this.#blockNumber < blockNumber - 60) this.#blockNumber = blockNumber - 60;
			return;
		}
		for (const log of logs) {
			this.#provider.emit(this.#filter, log);
			this.#blockNumber = log.blockNumber;
		}
	}
	start() {
		if (this.#running) return;
		this.#running = true;
		if (this.#blockNumber === -2) this.#provider.getBlockNumber().then((blockNumber) => {
			this.#blockNumber = blockNumber;
		});
		this.#provider.on("block", this.#poller);
	}
	stop() {
		if (!this.#running) return;
		this.#running = false;
		this.#provider.off("block", this.#poller);
	}
	pause(dropWhilePaused) {
		this.stop();
		if (dropWhilePaused) this.#blockNumber = -2;
	}
	resume() {
		this.start();
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/providers/abstract-provider.js
/**
*  The available providers should suffice for most developers purposes,
*  but the [[AbstractProvider]] class has many features which enable
*  sub-classing it for specific purposes.
*
*  @_section: api/providers/abstract-provider: Subclassing Provider  [abstract-provider]
*/
var BN_2 = BigInt(2);
var MAX_CCIP_REDIRECTS = 10;
function stall$1(duration) {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
}
function isPromise(value) {
	return value && typeof value.then === "function";
}
function getTag(prefix, value) {
	return prefix + ":" + JSON.stringify(value, (k, v) => {
		if (v == null) return "null";
		if (typeof v === "bigint") return `bigint:${v.toString()}`;
		if (typeof v === "string") return v.toLowerCase();
		if (typeof v === "object" && !Array.isArray(v)) {
			const keys = Object.keys(v);
			keys.sort();
			return keys.reduce((accum, key) => {
				accum[key] = v[key];
				return accum;
			}, {});
		}
		return v;
	});
}
/**
*  An **UnmanagedSubscriber** is useful for events which do not require
*  any additional management, such as ``"debug"`` which only requires
*  emit in synchronous event loop triggered calls.
*/
var UnmanagedSubscriber = class {
	/**
	*  The name fof the event.
	*/
	name;
	/**
	*  Create a new UnmanagedSubscriber with %%name%%.
	*/
	constructor(name) {
		defineProperties(this, { name });
	}
	start() {}
	stop() {}
	pause(dropWhilePaused) {}
	resume() {}
};
function copy$1(value) {
	return JSON.parse(JSON.stringify(value));
}
function concisify(items) {
	items = Array.from(new Set(items).values());
	items.sort();
	return items;
}
async function getSubscription(_event, provider) {
	if (_event == null) throw new Error("invalid event");
	if (Array.isArray(_event)) _event = { topics: _event };
	if (typeof _event === "string") switch (_event) {
		case "block":
		case "debug":
		case "error":
		case "finalized":
		case "network":
		case "pending":
		case "safe": return {
			type: _event,
			tag: _event
		};
	}
	if (isHexString(_event, 32)) {
		const hash = _event.toLowerCase();
		return {
			type: "transaction",
			tag: getTag("tx", { hash }),
			hash
		};
	}
	if (_event.orphan) {
		const event = _event;
		return {
			type: "orphan",
			tag: getTag("orphan", event),
			filter: copy$1(event)
		};
	}
	if (_event.address || _event.topics) {
		const event = _event;
		const filter = { topics: (event.topics || []).map((t) => {
			if (t == null) return null;
			if (Array.isArray(t)) return concisify(t.map((t) => t.toLowerCase()));
			return t.toLowerCase();
		}) };
		if (event.address) {
			const addresses = [];
			const promises = [];
			const addAddress = (addr) => {
				if (isHexString(addr)) addresses.push(addr);
				else promises.push((async () => {
					addresses.push(await resolveAddress(addr, provider));
				})());
			};
			if (Array.isArray(event.address)) event.address.forEach(addAddress);
			else addAddress(event.address);
			if (promises.length) await Promise.all(promises);
			filter.address = concisify(addresses.map((a) => a.toLowerCase()));
		}
		return {
			filter,
			tag: getTag("event", filter),
			type: "event"
		};
	}
	assertArgument(false, "unknown ProviderEvent", "event", _event);
}
function getTime() {
	return (/* @__PURE__ */ new Date()).getTime();
}
var defaultOptions$1 = {
	cacheTimeout: 250,
	pollingInterval: 4e3
};
/**
*  An **AbstractProvider** provides a base class for other sub-classes to
*  implement the [[Provider]] API by normalizing input arguments and
*  formatting output results as well as tracking events for consistent
*  behaviour on an eventually-consistent network.
*/
var AbstractProvider = class {
	#subs;
	#plugins;
	#pausedState;
	#destroyed;
	#networkPromise;
	#anyNetwork;
	#performCache;
	#lastBlockNumber;
	#nextTimer;
	#timers;
	#disableCcipRead;
	#requestRate;
	#requestTimes;
	#options;
	/**
	*  Create a new **AbstractProvider** connected to %%network%%, or
	*  use the various network detection capabilities to discover the
	*  [[Network]] if necessary.
	*/
	constructor(_network, options) {
		this.#options = Object.assign({}, defaultOptions$1, options || {});
		if (_network === "any") {
			this.#anyNetwork = true;
			this.#networkPromise = null;
		} else if (_network) {
			const network = Network.from(_network);
			this.#anyNetwork = false;
			this.#networkPromise = Promise.resolve(network);
			setTimeout(() => {
				this.emit("network", network, null);
			}, 0);
		} else {
			this.#anyNetwork = false;
			this.#networkPromise = null;
		}
		this.#lastBlockNumber = -1;
		this.#performCache = /* @__PURE__ */ new Map();
		this.#subs = /* @__PURE__ */ new Map();
		this.#plugins = /* @__PURE__ */ new Map();
		this.#pausedState = null;
		this.#destroyed = false;
		this.#nextTimer = 1;
		this.#timers = /* @__PURE__ */ new Map();
		this.#disableCcipRead = false;
		this.#requestRate = 0;
		this.#requestTimes = [];
	}
	/**
	*  Limit the number of requests per second. (default: no limit)
	*/
	get _requestRate() {
		const value = this.#requestRate;
		if (value == 0) return null;
		return value;
	}
	set _requestRate(value) {
		if (value == null || value < 0) value = 0;
		this.#requestRate = getNumber(value);
	}
	get pollingInterval() {
		return this.#options.pollingInterval;
	}
	/**
	*  Returns ``this``, to allow an **AbstractProvider** to implement
	*  the [[ContractRunner]] interface.
	*/
	get provider() {
		return this;
	}
	/**
	*  Returns all the registered plug-ins.
	*/
	get plugins() {
		return Array.from(this.#plugins.values());
	}
	/**
	*  Attach a new plug-in.
	*/
	attachPlugin(plugin) {
		if (this.#plugins.get(plugin.name)) throw new Error(`cannot replace existing plugin: ${plugin.name} `);
		this.#plugins.set(plugin.name, plugin.connect(this));
		return this;
	}
	/**
	*  Get a plugin by name.
	*/
	getPlugin(name) {
		return this.#plugins.get(name) || null;
	}
	/**
	*  Prevent any CCIP-read operation, regardless of whether requested
	*  in a [[call]] using ``enableCcipRead``.
	*/
	get disableCcipRead() {
		return this.#disableCcipRead;
	}
	set disableCcipRead(value) {
		this.#disableCcipRead = !!value;
	}
	#getDelay() {
		let requestRate = this.#requestRate;
		if (requestRate === 0) return 0;
		const requests = this.#requestTimes;
		const now = getTime();
		requests.push(now);
		const scanTime = now - 1e3;
		while (requests.length && requests[0] < scanTime) requests.shift();
		if (requests.length < requestRate) return 0;
		return requests[0] + 1e3 - now;
	}
	async #perform(req) {
		const timeout = this.#options.cacheTimeout;
		if (timeout < 0) {
			const delay = this.#getDelay();
			if (delay) await stall$1(delay);
			return await this._perform(req);
		}
		const tag = getTag(req.method, req);
		let perform = this.#performCache.get(tag);
		if (!perform) {
			const delay = this.#getDelay();
			if (delay) await stall$1(delay);
			perform = this._perform(req);
			this.#performCache.set(tag, perform);
			setTimeout(() => {
				if (this.#performCache.get(tag) === perform) this.#performCache.delete(tag);
			}, timeout);
		}
		return await perform;
	}
	/**
	*  Resolves to the data for executing the CCIP-read operations.
	*/
	async ccipReadFetch(tx, calldata, urls) {
		if (this.disableCcipRead || urls.length === 0 || tx.to == null) return null;
		const sender = tx.to.toLowerCase();
		const data = calldata.toLowerCase();
		const errorMessages = [];
		for (let i = 0; i < urls.length; i++) {
			const url = urls[i];
			const request = new FetchRequest(url.replace("{sender}", sender).replace("{data}", data));
			if (url.indexOf("{data}") === -1) request.body = {
				data,
				sender
			};
			this.emit("debug", {
				action: "sendCcipReadFetchRequest",
				request,
				index: i,
				urls
			});
			let errorMessage = "unknown error";
			let resp;
			try {
				resp = await request.send();
			} catch (error) {
				errorMessages.push(error.message);
				this.emit("debug", {
					action: "receiveCcipReadFetchError",
					request,
					result: { error }
				});
				continue;
			}
			try {
				const result = resp.bodyJson;
				if (result.data) {
					this.emit("debug", {
						action: "receiveCcipReadFetchResult",
						request,
						result
					});
					return result.data;
				}
				if (result.message) errorMessage = result.message;
				this.emit("debug", {
					action: "receiveCcipReadFetchError",
					request,
					result
				});
			} catch (error) {}
			assert(resp.statusCode < 400 || resp.statusCode >= 500, `response not found during CCIP fetch: ${errorMessage}`, "OFFCHAIN_FAULT", {
				reason: "404_MISSING_RESOURCE",
				transaction: tx,
				info: {
					url,
					errorMessage
				}
			});
			errorMessages.push(errorMessage);
		}
		assert(false, `error encountered during CCIP fetch: ${errorMessages.map((m) => JSON.stringify(m)).join(", ")}`, "OFFCHAIN_FAULT", {
			reason: "500_SERVER_ERROR",
			transaction: tx,
			info: {
				urls,
				errorMessages
			}
		});
	}
	/**
	*  Provides the opportunity for a sub-class to wrap a block before
	*  returning it, to add additional properties or an alternate
	*  sub-class of [[Block]].
	*/
	_wrapBlock(value, network) {
		return new Block(formatBlock(value), this);
	}
	/**
	*  Provides the opportunity for a sub-class to wrap a log before
	*  returning it, to add additional properties or an alternate
	*  sub-class of [[Log]].
	*/
	_wrapLog(value, network) {
		return new Log(formatLog(value), this);
	}
	/**
	*  Provides the opportunity for a sub-class to wrap a transaction
	*  receipt before returning it, to add additional properties or an
	*  alternate sub-class of [[TransactionReceipt]].
	*/
	_wrapTransactionReceipt(value, network) {
		return new TransactionReceipt(formatTransactionReceipt(value), this);
	}
	/**
	*  Provides the opportunity for a sub-class to wrap a transaction
	*  response before returning it, to add additional properties or an
	*  alternate sub-class of [[TransactionResponse]].
	*/
	_wrapTransactionResponse(tx, network) {
		return new TransactionResponse(formatTransactionResponse(tx), this);
	}
	/**
	*  Resolves to the Network, forcing a network detection using whatever
	*  technique the sub-class requires.
	*
	*  Sub-classes **must** override this.
	*/
	_detectNetwork() {
		assert(false, "sub-classes must implement this", "UNSUPPORTED_OPERATION", { operation: "_detectNetwork" });
	}
	/**
	*  Sub-classes should use this to perform all built-in operations. All
	*  methods sanitizes and normalizes the values passed into this.
	*
	*  Sub-classes **must** override this.
	*/
	async _perform(req) {
		assert(false, `unsupported method: ${req.method}`, "UNSUPPORTED_OPERATION", {
			operation: req.method,
			info: req
		});
	}
	async getBlockNumber() {
		const blockNumber = getNumber(await this.#perform({ method: "getBlockNumber" }), "%response");
		if (this.#lastBlockNumber >= 0) this.#lastBlockNumber = blockNumber;
		return blockNumber;
	}
	/**
	*  Returns or resolves to the address for %%address%%, resolving ENS
	*  names and [[Addressable]] objects and returning if already an
	*  address.
	*/
	_getAddress(address) {
		return resolveAddress(address, this);
	}
	/**
	*  Returns or resolves to a valid block tag for %%blockTag%%, resolving
	*  negative values and returning if already a valid block tag.
	*/
	_getBlockTag(blockTag) {
		if (blockTag == null) return "latest";
		switch (blockTag) {
			case "earliest": return "0x0";
			case "finalized":
			case "latest":
			case "pending":
			case "safe": return blockTag;
		}
		if (isHexString(blockTag)) {
			if (isHexString(blockTag, 32)) return blockTag;
			return toQuantity(blockTag);
		}
		if (typeof blockTag === "bigint") blockTag = getNumber(blockTag, "blockTag");
		if (typeof blockTag === "number") {
			if (blockTag >= 0) return toQuantity(blockTag);
			if (this.#lastBlockNumber >= 0) return toQuantity(this.#lastBlockNumber + blockTag);
			return this.getBlockNumber().then((b) => toQuantity(b + blockTag));
		}
		assertArgument(false, "invalid blockTag", "blockTag", blockTag);
	}
	/**
	*  Returns or resolves to a filter for %%filter%%, resolving any ENS
	*  names or [[Addressable]] object and returning if already a valid
	*  filter.
	*/
	_getFilter(filter) {
		const topics = (filter.topics || []).map((t) => {
			if (t == null) return null;
			if (Array.isArray(t)) return concisify(t.map((t) => t.toLowerCase()));
			return t.toLowerCase();
		});
		const blockHash = "blockHash" in filter ? filter.blockHash : void 0;
		const resolve = (_address, fromBlock, toBlock) => {
			let address = void 0;
			switch (_address.length) {
				case 0: break;
				case 1:
					address = _address[0];
					break;
				default:
					_address.sort();
					address = _address;
			}
			if (blockHash) {
				if (fromBlock != null || toBlock != null) throw new Error("invalid filter");
			}
			const filter = {};
			if (address) filter.address = address;
			if (topics.length) filter.topics = topics;
			if (fromBlock) filter.fromBlock = fromBlock;
			if (toBlock) filter.toBlock = toBlock;
			if (blockHash) filter.blockHash = blockHash;
			return filter;
		};
		let address = [];
		if (filter.address) {
			if (Array.isArray(filter.address)) for (const addr of filter.address) address.push(this._getAddress(addr));
			else address.push(this._getAddress(filter.address));
		}
		let fromBlock = void 0;
		if ("fromBlock" in filter) fromBlock = this._getBlockTag(filter.fromBlock);
		let toBlock = void 0;
		if ("toBlock" in filter) toBlock = this._getBlockTag(filter.toBlock);
		if (address.filter((a) => typeof a !== "string").length || fromBlock != null && typeof fromBlock !== "string" || toBlock != null && typeof toBlock !== "string") return Promise.all([
			Promise.all(address),
			fromBlock,
			toBlock
		]).then((result) => {
			return resolve(result[0], result[1], result[2]);
		});
		return resolve(address, fromBlock, toBlock);
	}
	/**
	*  Returns or resolves to a transaction for %%request%%, resolving
	*  any ENS names or [[Addressable]] and returning if already a valid
	*  transaction.
	*/
	_getTransactionRequest(_request) {
		const request = copyRequest(_request);
		const promises = [];
		["to", "from"].forEach((key) => {
			if (request[key] == null) return;
			const addr = resolveAddress(request[key], this);
			if (isPromise(addr)) promises.push((async function() {
				request[key] = await addr;
			})());
			else request[key] = addr;
		});
		if (request.blockTag != null) {
			const blockTag = this._getBlockTag(request.blockTag);
			if (isPromise(blockTag)) promises.push((async function() {
				request.blockTag = await blockTag;
			})());
			else request.blockTag = blockTag;
		}
		if (promises.length) return (async function() {
			await Promise.all(promises);
			return request;
		})();
		return request;
	}
	async getNetwork() {
		if (this.#networkPromise == null) {
			const detectNetwork = (async () => {
				try {
					const network = await this._detectNetwork();
					this.emit("network", network, null);
					return network;
				} catch (error) {
					if (this.#networkPromise === detectNetwork) this.#networkPromise = null;
					throw error;
				}
			})();
			this.#networkPromise = detectNetwork;
			return (await detectNetwork).clone();
		}
		const networkPromise = this.#networkPromise;
		const [expected, actual] = await Promise.all([networkPromise, this._detectNetwork()]);
		if (expected.chainId !== actual.chainId) {
			if (this.#anyNetwork) {
				this.emit("network", actual, expected);
				if (this.#networkPromise === networkPromise) this.#networkPromise = Promise.resolve(actual);
			} else assert(false, `network changed: ${expected.chainId} => ${actual.chainId} `, "NETWORK_ERROR", { event: "changed" });
		}
		return expected.clone();
	}
	async getFeeData() {
		const network = await this.getNetwork();
		const getFeeDataFunc = async () => {
			const { _block, gasPrice, priorityFee } = await resolveProperties({
				_block: this.#getBlock("latest", false),
				gasPrice: (async () => {
					try {
						return getBigInt(await this.#perform({ method: "getGasPrice" }), "%response");
					} catch (error) {}
					return null;
				})(),
				priorityFee: (async () => {
					try {
						return getBigInt(await this.#perform({ method: "getPriorityFee" }), "%response");
					} catch (error) {}
					return null;
				})()
			});
			let maxFeePerGas = null;
			let maxPriorityFeePerGas = null;
			const block = this._wrapBlock(_block, network);
			if (block && block.baseFeePerGas) {
				maxPriorityFeePerGas = priorityFee != null ? priorityFee : BigInt("1000000000");
				maxFeePerGas = block.baseFeePerGas * BN_2 + maxPriorityFeePerGas;
			}
			return new FeeData(gasPrice, maxFeePerGas, maxPriorityFeePerGas);
		};
		const plugin = network.getPlugin("org.ethers.plugins.network.FetchUrlFeeDataPlugin");
		if (plugin) {
			const req = new FetchRequest(plugin.url);
			const feeData = await plugin.processFunc(getFeeDataFunc, this, req);
			return new FeeData(feeData.gasPrice, feeData.maxFeePerGas, feeData.maxPriorityFeePerGas);
		}
		return await getFeeDataFunc();
	}
	async estimateGas(_tx) {
		let tx = this._getTransactionRequest(_tx);
		if (isPromise(tx)) tx = await tx;
		return getBigInt(await this.#perform({
			method: "estimateGas",
			transaction: tx
		}), "%response");
	}
	async #call(tx, blockTag, attempt) {
		assert(attempt < MAX_CCIP_REDIRECTS, "CCIP read exceeded maximum redirections", "OFFCHAIN_FAULT", {
			reason: "TOO_MANY_REDIRECTS",
			transaction: Object.assign({}, tx, {
				blockTag,
				enableCcipRead: true
			})
		});
		const transaction = copyRequest(tx);
		try {
			const delay = this.#getDelay();
			if (delay) await stall$1(delay);
			return hexlify(await this._perform({
				method: "call",
				transaction,
				blockTag
			}));
		} catch (error) {
			if (!this.disableCcipRead && isCallException(error) && error.data && attempt >= 0 && blockTag === "latest" && transaction.to != null && dataSlice(error.data, 0, 4) === "0x556f1830") {
				const data = error.data;
				const txSender = await resolveAddress(transaction.to, this);
				let ccipArgs;
				try {
					ccipArgs = parseOffchainLookup(dataSlice(error.data, 4));
				} catch (error) {
					assert(false, error.message, "OFFCHAIN_FAULT", {
						reason: "BAD_DATA",
						transaction,
						info: { data }
					});
				}
				assert(ccipArgs.sender.toLowerCase() === txSender.toLowerCase(), "CCIP Read sender mismatch", "CALL_EXCEPTION", {
					action: "call",
					data,
					reason: "OffchainLookup",
					transaction,
					invocation: null,
					revert: {
						signature: "OffchainLookup(address,string[],bytes,bytes4,bytes)",
						name: "OffchainLookup",
						args: ccipArgs.errorArgs
					}
				});
				const ccipResult = await this.ccipReadFetch(transaction, ccipArgs.calldata, ccipArgs.urls);
				assert(ccipResult != null, "CCIP Read failed to fetch data", "OFFCHAIN_FAULT", {
					reason: "FETCH_FAILED",
					transaction,
					info: {
						data: error.data,
						errorArgs: ccipArgs.errorArgs
					}
				});
				const tx = {
					to: txSender,
					data: concat([ccipArgs.selector, encodeBytes([ccipResult, ccipArgs.extraData])])
				};
				this.emit("debug", {
					action: "sendCcipReadCall",
					transaction: tx
				});
				try {
					const result = await this.#call(tx, blockTag, attempt + 1);
					this.emit("debug", {
						action: "receiveCcipReadCallResult",
						transaction: Object.assign({}, tx),
						result
					});
					return result;
				} catch (error) {
					this.emit("debug", {
						action: "receiveCcipReadCallError",
						transaction: Object.assign({}, tx),
						error
					});
					throw error;
				}
			}
			throw error;
		}
	}
	async #checkNetwork(promise) {
		const { value } = await resolveProperties({
			network: this.getNetwork(),
			value: promise
		});
		return value;
	}
	async call(_tx) {
		const { tx, blockTag } = await resolveProperties({
			tx: this._getTransactionRequest(_tx),
			blockTag: this._getBlockTag(_tx.blockTag)
		});
		return await this.#checkNetwork(this.#call(tx, blockTag, _tx.enableCcipRead ? 0 : -1));
	}
	async #getAccountValue(request, _address, _blockTag) {
		let address = this._getAddress(_address);
		let blockTag = this._getBlockTag(_blockTag);
		if (typeof address !== "string" || typeof blockTag !== "string") [address, blockTag] = await Promise.all([address, blockTag]);
		return await this.#checkNetwork(this.#perform(Object.assign(request, {
			address,
			blockTag
		})));
	}
	async getBalance(address, blockTag) {
		return getBigInt(await this.#getAccountValue({ method: "getBalance" }, address, blockTag), "%response");
	}
	async getTransactionCount(address, blockTag) {
		return getNumber(await this.#getAccountValue({ method: "getTransactionCount" }, address, blockTag), "%response");
	}
	async getCode(address, blockTag) {
		return hexlify(await this.#getAccountValue({ method: "getCode" }, address, blockTag));
	}
	async getStorage(address, _position, blockTag) {
		const position = getBigInt(_position, "position");
		return hexlify(await this.#getAccountValue({
			method: "getStorage",
			position
		}, address, blockTag));
	}
	async broadcastTransaction(signedTx) {
		const { blockNumber, hash, network } = await resolveProperties({
			blockNumber: this.getBlockNumber(),
			hash: this._perform({
				method: "broadcastTransaction",
				signedTransaction: signedTx
			}),
			network: this.getNetwork()
		});
		const tx = Transaction.from(signedTx);
		if (tx.hash !== hash) throw new Error("@TODO: the returned hash did not match");
		return this._wrapTransactionResponse(tx, network).replaceableTransaction(blockNumber);
	}
	async #getBlock(block, includeTransactions) {
		if (isHexString(block, 32)) return await this.#perform({
			method: "getBlock",
			blockHash: block,
			includeTransactions
		});
		let blockTag = this._getBlockTag(block);
		if (typeof blockTag !== "string") blockTag = await blockTag;
		return await this.#perform({
			method: "getBlock",
			blockTag,
			includeTransactions
		});
	}
	async getBlock(block, prefetchTxs) {
		const { network, params } = await resolveProperties({
			network: this.getNetwork(),
			params: this.#getBlock(block, !!prefetchTxs)
		});
		if (params == null) return null;
		return this._wrapBlock(params, network);
	}
	async getTransaction(hash) {
		const { network, params } = await resolveProperties({
			network: this.getNetwork(),
			params: this.#perform({
				method: "getTransaction",
				hash
			})
		});
		if (params == null) return null;
		return this._wrapTransactionResponse(params, network);
	}
	async getTransactionReceipt(hash) {
		const { network, params } = await resolveProperties({
			network: this.getNetwork(),
			params: this.#perform({
				method: "getTransactionReceipt",
				hash
			})
		});
		if (params == null) return null;
		if (params.gasPrice == null && params.effectiveGasPrice == null) {
			const tx = await this.#perform({
				method: "getTransaction",
				hash
			});
			if (tx == null) throw new Error("report this; could not find tx or effectiveGasPrice");
			params.effectiveGasPrice = tx.gasPrice;
		}
		return this._wrapTransactionReceipt(params, network);
	}
	async getTransactionResult(hash) {
		const { result } = await resolveProperties({
			network: this.getNetwork(),
			result: this.#perform({
				method: "getTransactionResult",
				hash
			})
		});
		if (result == null) return null;
		return hexlify(result);
	}
	async getLogs(_filter) {
		let filter = this._getFilter(_filter);
		if (isPromise(filter)) filter = await filter;
		const { network, params } = await resolveProperties({
			network: this.getNetwork(),
			params: this.#perform({
				method: "getLogs",
				filter
			})
		});
		return params.map((p) => this._wrapLog(p, network));
	}
	_getProvider(chainId) {
		assert(false, "provider cannot connect to target network", "UNSUPPORTED_OPERATION", { operation: "_getProvider()" });
	}
	async getResolver(name) {
		return await EnsResolver.fromName(this, name);
	}
	async getAvatar(name) {
		const resolver = await this.getResolver(name);
		if (resolver) return await resolver.getAvatar();
		return null;
	}
	async resolveName(name, coinType) {
		const resolver = await this.getResolver(name);
		if (resolver) return await resolver.getAddress(coinType);
		return null;
	}
	async lookupAddress(address, coinType) {
		return await EnsResolver.lookupAddress(this, address, coinType);
	}
	async waitForTransaction(hash, _confirms, timeout) {
		const confirms = _confirms != null ? _confirms : 1;
		if (confirms === 0) return this.getTransactionReceipt(hash);
		return new Promise(async (resolve, reject) => {
			let timer = null;
			const listener = (async (blockNumber) => {
				try {
					const receipt = await this.getTransactionReceipt(hash);
					if (receipt != null) {
						if (blockNumber - receipt.blockNumber + 1 >= confirms) {
							resolve(receipt);
							if (timer) {
								clearTimeout(timer);
								timer = null;
							}
							return;
						}
					}
				} catch (error) {
					console.log("EEE", error);
				}
				this.once("block", listener);
			});
			if (timeout != null) timer = setTimeout(() => {
				if (timer == null) return;
				timer = null;
				this.off("block", listener);
				reject(makeError("timeout", "TIMEOUT", { reason: "timeout" }));
			}, timeout);
			listener(await this.getBlockNumber());
		});
	}
	async waitForBlock(blockTag) {
		assert(false, "not implemented yet", "NOT_IMPLEMENTED", { operation: "waitForBlock" });
	}
	/**
	*  Clear a timer created using the [[_setTimeout]] method.
	*/
	_clearTimeout(timerId) {
		const timer = this.#timers.get(timerId);
		if (!timer) return;
		if (timer.timer) clearTimeout(timer.timer);
		this.#timers.delete(timerId);
	}
	/**
	*  Create a timer that will execute %%func%% after at least %%timeout%%
	*  (in ms). If %%timeout%% is unspecified, then %%func%% will execute
	*  in the next event loop.
	*
	*  [Pausing](AbstractProvider-paused) the provider will pause any
	*  associated timers.
	*/
	_setTimeout(_func, timeout) {
		if (timeout == null) timeout = 0;
		const timerId = this.#nextTimer++;
		const func = () => {
			this.#timers.delete(timerId);
			_func();
		};
		if (this.paused) this.#timers.set(timerId, {
			timer: null,
			func,
			time: timeout
		});
		else {
			const timer = setTimeout(func, timeout);
			this.#timers.set(timerId, {
				timer,
				func,
				time: getTime()
			});
		}
		return timerId;
	}
	/**
	*  Perform %%func%% on each subscriber.
	*/
	_forEachSubscriber(func) {
		for (const sub of this.#subs.values()) func(sub.subscriber);
	}
	/**
	*  Sub-classes may override this to customize subscription
	*  implementations.
	*/
	_getSubscriber(sub) {
		switch (sub.type) {
			case "debug":
			case "error":
			case "network": return new UnmanagedSubscriber(sub.type);
			case "block": {
				const subscriber = new PollingBlockSubscriber(this);
				subscriber.pollingInterval = this.pollingInterval;
				return subscriber;
			}
			case "safe":
			case "finalized": return new PollingBlockTagSubscriber(this, sub.type);
			case "event": return new PollingEventSubscriber(this, sub.filter);
			case "transaction": return new PollingTransactionSubscriber(this, sub.hash);
			case "orphan": return new PollingOrphanSubscriber(this, sub.filter);
		}
		throw new Error(`unsupported event: ${sub.type}`);
	}
	/**
	*  If a [[Subscriber]] fails and needs to replace itself, this
	*  method may be used.
	*
	*  For example, this is used for providers when using the
	*  ``eth_getFilterChanges`` method, which can return null if state
	*  filters are not supported by the backend, allowing the Subscriber
	*  to swap in a [[PollingEventSubscriber]].
	*/
	_recoverSubscriber(oldSub, newSub) {
		for (const sub of this.#subs.values()) if (sub.subscriber === oldSub) {
			if (sub.started) sub.subscriber.stop();
			sub.subscriber = newSub;
			if (sub.started) newSub.start();
			if (this.#pausedState != null) newSub.pause(this.#pausedState);
			break;
		}
	}
	async #hasSub(event, emitArgs) {
		let sub = await getSubscription(event, this);
		if (sub.type === "event" && emitArgs && emitArgs.length > 0 && emitArgs[0].removed === true) sub = await getSubscription({
			orphan: "drop-log",
			log: emitArgs[0]
		}, this);
		return this.#subs.get(sub.tag) || null;
	}
	async #getSub(event) {
		const subscription = await getSubscription(event, this);
		const tag = subscription.tag;
		let sub = this.#subs.get(tag);
		if (!sub) {
			sub = {
				subscriber: this._getSubscriber(subscription),
				tag,
				addressableMap: /* @__PURE__ */ new WeakMap(),
				nameMap: /* @__PURE__ */ new Map(),
				started: false,
				listeners: []
			};
			this.#subs.set(tag, sub);
		}
		return sub;
	}
	async on(event, listener) {
		const sub = await this.#getSub(event);
		sub.listeners.push({
			listener,
			once: false
		});
		if (!sub.started) {
			sub.subscriber.start();
			sub.started = true;
			if (this.#pausedState != null) sub.subscriber.pause(this.#pausedState);
		}
		return this;
	}
	async once(event, listener) {
		const sub = await this.#getSub(event);
		sub.listeners.push({
			listener,
			once: true
		});
		if (!sub.started) {
			sub.subscriber.start();
			sub.started = true;
			if (this.#pausedState != null) sub.subscriber.pause(this.#pausedState);
		}
		return this;
	}
	async emit(event, ...args) {
		const sub = await this.#hasSub(event, args);
		if (!sub || sub.listeners.length === 0) return false;
		const count = sub.listeners.length;
		sub.listeners = sub.listeners.filter(({ listener, once }) => {
			const payload = new EventPayload(this, once ? null : listener, event);
			try {
				listener.call(this, ...args, payload);
			} catch (error) {}
			return !once;
		});
		if (sub.listeners.length === 0) {
			if (sub.started) sub.subscriber.stop();
			this.#subs.delete(sub.tag);
		}
		return count > 0;
	}
	async listenerCount(event) {
		if (event) {
			const sub = await this.#hasSub(event);
			if (!sub) return 0;
			return sub.listeners.length;
		}
		let total = 0;
		for (const { listeners } of this.#subs.values()) total += listeners.length;
		return total;
	}
	async listeners(event) {
		if (event) {
			const sub = await this.#hasSub(event);
			if (!sub) return [];
			return sub.listeners.map(({ listener }) => listener);
		}
		let result = [];
		for (const { listeners } of this.#subs.values()) result = result.concat(listeners.map(({ listener }) => listener));
		return result;
	}
	async off(event, listener) {
		const sub = await this.#hasSub(event);
		if (!sub) return this;
		if (listener) {
			const index = sub.listeners.map(({ listener }) => listener).indexOf(listener);
			if (index >= 0) sub.listeners.splice(index, 1);
		}
		if (!listener || sub.listeners.length === 0) {
			if (sub.started) sub.subscriber.stop();
			this.#subs.delete(sub.tag);
		}
		return this;
	}
	async removeAllListeners(event) {
		if (event) {
			const { tag, started, subscriber } = await this.#getSub(event);
			if (started) subscriber.stop();
			this.#subs.delete(tag);
		} else for (const [tag, { started, subscriber }] of this.#subs) {
			if (started) subscriber.stop();
			this.#subs.delete(tag);
		}
		return this;
	}
	async addListener(event, listener) {
		return await this.on(event, listener);
	}
	async removeListener(event, listener) {
		return this.off(event, listener);
	}
	/**
	*  If this provider has been destroyed using the [[destroy]] method.
	*
	*  Once destroyed, all resources are reclaimed, internal event loops
	*  and timers are cleaned up and no further requests may be sent to
	*  the provider.
	*/
	get destroyed() {
		return this.#destroyed;
	}
	/**
	*  Sub-classes may use this to shutdown any sockets or release their
	*  resources and reject any pending requests.
	*
	*  Sub-classes **must** call ``super.destroy()``.
	*/
	destroy() {
		this.removeAllListeners();
		for (const timerId of this.#timers.keys()) this._clearTimeout(timerId);
		this.#destroyed = true;
	}
	/**
	*  Whether the provider is currently paused.
	*
	*  A paused provider will not emit any events, and generally should
	*  not make any requests to the network, but that is up to sub-classes
	*  to manage.
	*
	*  Setting ``paused = true`` is identical to calling ``.pause(false)``,
	*  which will buffer any events that occur while paused until the
	*  provider is unpaused.
	*/
	get paused() {
		return this.#pausedState != null;
	}
	set paused(pause) {
		if (!!pause === this.paused) return;
		if (this.paused) this.resume();
		else this.pause(false);
	}
	/**
	*  Pause the provider. If %%dropWhilePaused%%, any events that occur
	*  while paused are dropped, otherwise all events will be emitted once
	*  the provider is unpaused.
	*/
	pause(dropWhilePaused) {
		this.#lastBlockNumber = -1;
		if (this.#pausedState != null) {
			if (this.#pausedState == !!dropWhilePaused) return;
			assert(false, "cannot change pause type; resume first", "UNSUPPORTED_OPERATION", { operation: "pause" });
		}
		this._forEachSubscriber((s) => s.pause(dropWhilePaused));
		this.#pausedState = !!dropWhilePaused;
		for (const timer of this.#timers.values()) {
			if (timer.timer) clearTimeout(timer.timer);
			timer.time = getTime() - timer.time;
		}
	}
	/**
	*  Resume the provider.
	*/
	resume() {
		if (this.#pausedState == null) return;
		this._forEachSubscriber((s) => s.resume());
		this.#pausedState = null;
		for (const timer of this.#timers.values()) {
			let timeout = timer.time;
			if (timeout < 0) timeout = 0;
			timer.time = getTime();
			setTimeout(timer.func, timeout);
		}
	}
};
function _parseString(result, start) {
	try {
		const bytes = _parseBytes(result, start);
		if (bytes) return toUtf8String(bytes);
	} catch (error) {}
	return null;
}
function _parseBytes(result, start) {
	if (result === "0x") return null;
	try {
		const offset = getNumber(dataSlice(result, start, start + 32));
		const length = getNumber(dataSlice(result, offset, offset + 32));
		return dataSlice(result, offset + 32, offset + 32 + length);
	} catch (error) {}
	return null;
}
function numPad(value) {
	const result = toBeArray(value);
	if (result.length > 32) throw new Error("internal; should not happen");
	const padded = /* @__PURE__ */ new Uint8Array(32);
	padded.set(result, 32 - result.length);
	return padded;
}
function bytesPad(value) {
	if (value.length % 32 === 0) return value;
	const result = new Uint8Array(Math.ceil(value.length / 32) * 32);
	result.set(value);
	return result;
}
var empty = new Uint8Array([]);
function encodeBytes(datas) {
	const result = [];
	let byteCount = 0;
	for (let i = 0; i < datas.length; i++) {
		result.push(empty);
		byteCount += 32;
	}
	for (let i = 0; i < datas.length; i++) {
		const data = getBytes(datas[i]);
		result[i] = numPad(byteCount);
		result.push(numPad(data.length));
		result.push(bytesPad(data));
		byteCount += 32 + Math.ceil(data.length / 32) * 32;
	}
	return concat(result);
}
var zeros = "0x0000000000000000000000000000000000000000000000000000000000000000";
function parseOffchainLookup(data) {
	const result = {
		sender: "",
		urls: [],
		calldata: "",
		selector: "",
		extraData: "",
		errorArgs: []
	};
	assert(dataLength(data) >= 160, "insufficient OffchainLookup data", "OFFCHAIN_FAULT", { reason: "insufficient OffchainLookup data" });
	const sender = dataSlice(data, 0, 32);
	assert(dataSlice(sender, 0, 12) === dataSlice(zeros, 0, 12), "corrupt OffchainLookup sender", "OFFCHAIN_FAULT", { reason: "corrupt OffchainLookup sender" });
	result.sender = dataSlice(sender, 12);
	try {
		const urls = [];
		const urlsOffset = getNumber(dataSlice(data, 32, 64));
		const urlsLength = getNumber(dataSlice(data, urlsOffset, urlsOffset + 32));
		const urlsData = dataSlice(data, urlsOffset + 32);
		for (let u = 0; u < urlsLength; u++) {
			const url = _parseString(urlsData, u * 32);
			if (url == null) throw new Error("abort");
			urls.push(url);
		}
		result.urls = urls;
	} catch (error) {
		assert(false, "corrupt OffchainLookup urls", "OFFCHAIN_FAULT", { reason: "corrupt OffchainLookup urls" });
	}
	try {
		const calldata = _parseBytes(data, 64);
		if (calldata == null) throw new Error("abort");
		result.calldata = calldata;
	} catch (error) {
		assert(false, "corrupt OffchainLookup calldata", "OFFCHAIN_FAULT", { reason: "corrupt OffchainLookup calldata" });
	}
	assert(dataSlice(data, 100, 128) === dataSlice(zeros, 0, 28), "corrupt OffchainLookup callbaackSelector", "OFFCHAIN_FAULT", { reason: "corrupt OffchainLookup callbaackSelector" });
	result.selector = dataSlice(data, 96, 100);
	try {
		const extraData = _parseBytes(data, 128);
		if (extraData == null) throw new Error("abort");
		result.extraData = extraData;
	} catch (error) {
		assert(false, "corrupt OffchainLookup extraData", "OFFCHAIN_FAULT", { reason: "corrupt OffchainLookup extraData" });
	}
	result.errorArgs = "sender,urls,calldata,selector,extraData".split(/,/).map((k) => result[k]);
	return result;
}
//#endregion
//#region node_modules/ethers/lib.esm/providers/abstract-signer.js
/**
*  Generally the [[Wallet]] and [[JsonRpcSigner]] and their sub-classes
*  are sufficient for most developers, but this is provided to
*  fascilitate more complex Signers.
*
*  @_section: api/providers/abstract-signer: Subclassing Signer [abstract-signer]
*/
function checkProvider(signer, operation) {
	if (signer.provider) return signer.provider;
	assert(false, "missing provider", "UNSUPPORTED_OPERATION", { operation });
}
async function populate(signer, tx) {
	let pop = copyRequest(tx);
	if (pop.to != null) pop.to = resolveAddress(pop.to, signer);
	if (pop.from != null) {
		const from = pop.from;
		pop.from = Promise.all([signer.getAddress(), resolveAddress(from, signer)]).then(([address, from]) => {
			assertArgument(address.toLowerCase() === from.toLowerCase(), "transaction from mismatch", "tx.from", from);
			return address;
		});
	} else pop.from = signer.getAddress();
	return await resolveProperties(pop);
}
/**
*  An **AbstractSigner** includes most of teh functionality required
*  to get a [[Signer]] working as expected, but requires a few
*  Signer-specific methods be overridden.
*
*/
var AbstractSigner = class {
	/**
	*  The provider this signer is connected to.
	*/
	provider;
	/**
	*  Creates a new Signer connected to %%provider%%.
	*/
	constructor(provider) {
		defineProperties(this, { provider: provider || null });
	}
	async getNonce(blockTag) {
		return checkProvider(this, "getTransactionCount").getTransactionCount(await this.getAddress(), blockTag);
	}
	async populateCall(tx) {
		return await populate(this, tx);
	}
	async populateTransaction(tx) {
		const provider = checkProvider(this, "populateTransaction");
		const pop = await populate(this, tx);
		if (pop.nonce == null) pop.nonce = await this.getNonce("pending");
		if (pop.gasLimit == null) pop.gasLimit = await this.estimateGas(pop);
		const network = await this.provider.getNetwork();
		if (pop.chainId != null) assertArgument(getBigInt(pop.chainId) === network.chainId, "transaction chainId mismatch", "tx.chainId", tx.chainId);
		else pop.chainId = network.chainId;
		const hasEip1559 = pop.maxFeePerGas != null || pop.maxPriorityFeePerGas != null;
		if (pop.gasPrice != null && (pop.type === 2 || hasEip1559)) assertArgument(false, "eip-1559 transaction do not support gasPrice", "tx", tx);
		else if ((pop.type === 0 || pop.type === 1) && hasEip1559) assertArgument(false, "pre-eip-1559 transaction do not support maxFeePerGas/maxPriorityFeePerGas", "tx", tx);
		if ((pop.type === 2 || pop.type == null) && pop.maxFeePerGas != null && pop.maxPriorityFeePerGas != null) pop.type = 2;
		else if (pop.type === 0 || pop.type === 1) {
			const feeData = await provider.getFeeData();
			assert(feeData.gasPrice != null, "network does not support gasPrice", "UNSUPPORTED_OPERATION", { operation: "getGasPrice" });
			if (pop.gasPrice == null) pop.gasPrice = feeData.gasPrice;
		} else {
			const feeData = await provider.getFeeData();
			if (pop.type == null) {
				if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
					if (pop.authorizationList && pop.authorizationList.length) pop.type = 4;
					else pop.type = 2;
					if (pop.gasPrice != null) {
						const gasPrice = pop.gasPrice;
						delete pop.gasPrice;
						pop.maxFeePerGas = gasPrice;
						pop.maxPriorityFeePerGas = gasPrice;
					} else {
						if (pop.maxFeePerGas == null) pop.maxFeePerGas = feeData.maxFeePerGas;
						if (pop.maxPriorityFeePerGas == null) pop.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
					}
				} else if (feeData.gasPrice != null) {
					assert(!hasEip1559, "network does not support EIP-1559", "UNSUPPORTED_OPERATION", { operation: "populateTransaction" });
					if (pop.gasPrice == null) pop.gasPrice = feeData.gasPrice;
					pop.type = 0;
				} else assert(false, "failed to get consistent fee data", "UNSUPPORTED_OPERATION", { operation: "signer.getFeeData" });
			} else if (pop.type === 2 || pop.type === 3 || pop.type === 4) {
				if (pop.maxFeePerGas == null) pop.maxFeePerGas = feeData.maxFeePerGas;
				if (pop.maxPriorityFeePerGas == null) pop.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
			}
		}
		return await resolveProperties(pop);
	}
	async populateAuthorization(_auth) {
		const auth = Object.assign({}, _auth);
		if (auth.chainId == null) auth.chainId = (await checkProvider(this, "getNetwork").getNetwork()).chainId;
		if (auth.nonce == null) auth.nonce = await this.getNonce();
		return auth;
	}
	async estimateGas(tx) {
		return checkProvider(this, "estimateGas").estimateGas(await this.populateCall(tx));
	}
	async call(tx) {
		return checkProvider(this, "call").call(await this.populateCall(tx));
	}
	async resolveName(name) {
		return await checkProvider(this, "resolveName").resolveName(name);
	}
	async sendTransaction(tx) {
		const provider = checkProvider(this, "sendTransaction");
		const pop = await this.populateTransaction(tx);
		delete pop.from;
		const txObj = Transaction.from(pop);
		return await provider.broadcastTransaction(await this.signTransaction(txObj));
	}
	authorize(authorization) {
		assert(false, "authorization not implemented for this signer", "UNSUPPORTED_OPERATION", { operation: "authorize" });
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/providers/subscriber-filterid.js
function copy(obj) {
	return JSON.parse(JSON.stringify(obj));
}
/**
*  Some backends support subscribing to events using a Filter ID.
*
*  When subscribing with this technique, the node issues a unique
*  //Filter ID//. At this point the node dedicates resources to
*  the filter, so that periodic calls to follow up on the //Filter ID//
*  will receive any events since the last call.
*
*  @_docloc: api/providers/abstract-provider
*/
var FilterIdSubscriber = class {
	#provider;
	#filterIdPromise;
	#poller;
	#running;
	#network;
	#hault;
	/**
	*  Creates a new **FilterIdSubscriber** which will used [[_subscribe]]
	*  and [[_emitResults]] to setup the subscription and provide the event
	*  to the %%provider%%.
	*/
	constructor(provider) {
		this.#provider = provider;
		this.#filterIdPromise = null;
		this.#poller = this.#poll.bind(this);
		this.#running = false;
		this.#network = null;
		this.#hault = false;
	}
	/**
	*  Sub-classes **must** override this to begin the subscription.
	*/
	_subscribe(provider) {
		throw new Error("subclasses must override this");
	}
	/**
	*  Sub-classes **must** override this handle the events.
	*/
	_emitResults(provider, result) {
		throw new Error("subclasses must override this");
	}
	/**
	*  Sub-classes **must** override this handle recovery on errors.
	*/
	_recover(provider) {
		throw new Error("subclasses must override this");
	}
	async #poll(blockNumber) {
		try {
			if (this.#filterIdPromise == null) this.#filterIdPromise = this._subscribe(this.#provider);
			let filterId = null;
			try {
				filterId = await this.#filterIdPromise;
			} catch (error) {
				if (!isError(error, "UNSUPPORTED_OPERATION") || error.operation !== "eth_newFilter") throw error;
			}
			if (filterId == null) {
				this.#filterIdPromise = null;
				this.#provider._recoverSubscriber(this, this._recover(this.#provider));
				return;
			}
			const network = await this.#provider.getNetwork();
			if (!this.#network) this.#network = network;
			if (this.#network.chainId !== network.chainId) throw new Error("chaid changed");
			if (this.#hault) return;
			const result = await this.#provider.send("eth_getFilterChanges", [filterId]);
			await this._emitResults(this.#provider, result);
		} catch (error) {
			console.log("@TODO", error);
		}
		this.#provider.once("block", this.#poller);
	}
	#teardown() {
		const filterIdPromise = this.#filterIdPromise;
		if (filterIdPromise) {
			this.#filterIdPromise = null;
			filterIdPromise.then((filterId) => {
				if (this.#provider.destroyed) return;
				this.#provider.send("eth_uninstallFilter", [filterId]);
			});
		}
	}
	start() {
		if (this.#running) return;
		this.#running = true;
		this.#poll(-2);
	}
	stop() {
		if (!this.#running) return;
		this.#running = false;
		this.#hault = true;
		this.#teardown();
		this.#provider.off("block", this.#poller);
	}
	pause(dropWhilePaused) {
		if (dropWhilePaused) this.#teardown();
		this.#provider.off("block", this.#poller);
	}
	resume() {
		this.start();
	}
};
/**
*  A **FilterIdSubscriber** for receiving contract events.
*
*  @_docloc: api/providers/abstract-provider
*/
var FilterIdEventSubscriber = class extends FilterIdSubscriber {
	#event;
	/**
	*  Creates a new **FilterIdEventSubscriber** attached to %%provider%%
	*  listening for %%filter%%.
	*/
	constructor(provider, filter) {
		super(provider);
		this.#event = copy(filter);
	}
	_recover(provider) {
		return new PollingEventSubscriber(provider, this.#event);
	}
	async _subscribe(provider) {
		return await provider.send("eth_newFilter", [this.#event]);
	}
	async _emitResults(provider, results) {
		for (const result of results) provider.emit(this.#event, provider._wrapLog(result, provider._network));
	}
};
/**
*  A **FilterIdSubscriber** for receiving pending transactions events.
*
*  @_docloc: api/providers/abstract-provider
*/
var FilterIdPendingSubscriber = class extends FilterIdSubscriber {
	async _subscribe(provider) {
		return await provider.send("eth_newPendingTransactionFilter", []);
	}
	async _emitResults(provider, results) {
		for (const result of results) provider.emit("pending", result);
	}
};
//#endregion
//#region node_modules/ethers/lib.esm/providers/provider-jsonrpc.js
/**
*  One of the most common ways to interact with the blockchain is
*  by a node running a JSON-RPC interface which can be connected to,
*  based on the transport, using:
*
*  - HTTP or HTTPS - [[JsonRpcProvider]]
*  - WebSocket - [[WebSocketProvider]]
*  - IPC - [[IpcSocketProvider]]
*
* @_section: api/providers/jsonrpc:JSON-RPC Provider  [about-jsonrpcProvider]
*/
var Primitive = "bigint,boolean,function,number,string,symbol".split(/,/g);
function deepCopy(value) {
	if (value == null || Primitive.indexOf(typeof value) >= 0) return value;
	if (typeof value.getAddress === "function") return value;
	if (Array.isArray(value)) return value.map(deepCopy);
	if (typeof value === "object") return Object.keys(value).reduce((accum, key) => {
		accum[key] = value[key];
		return accum;
	}, {});
	throw new Error(`should not happen: ${value} (${typeof value})`);
}
function stall(duration) {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
}
function getLowerCase(value) {
	if (value) return value.toLowerCase();
	return value;
}
function isPollable(value) {
	return value && typeof value.pollingInterval === "number";
}
var defaultOptions = {
	polling: false,
	staticNetwork: null,
	batchStallTime: 10,
	batchMaxSize: 1 << 20,
	batchMaxCount: 100,
	cacheTimeout: 250,
	pollingInterval: 4e3
};
var JsonRpcSigner = class extends AbstractSigner {
	address;
	constructor(provider, address) {
		super(provider);
		address = getAddress(address);
		defineProperties(this, { address });
	}
	connect(provider) {
		assert(false, "cannot reconnect JsonRpcSigner", "UNSUPPORTED_OPERATION", { operation: "signer.connect" });
	}
	async getAddress() {
		return this.address;
	}
	async populateTransaction(tx) {
		return await this.populateCall(tx);
	}
	async sendUncheckedTransaction(_tx) {
		const tx = deepCopy(_tx);
		const promises = [];
		if (tx.from) {
			const _from = tx.from;
			promises.push((async () => {
				const from = await resolveAddress(_from, this.provider);
				assertArgument(from != null && from.toLowerCase() === this.address.toLowerCase(), "from address mismatch", "transaction", _tx);
				tx.from = from;
			})());
		} else tx.from = this.address;
		if (tx.gasLimit == null) promises.push((async () => {
			tx.gasLimit = await this.provider.estimateGas({
				...tx,
				from: this.address
			});
		})());
		if (tx.to != null) {
			const _to = tx.to;
			promises.push((async () => {
				tx.to = await resolveAddress(_to, this.provider);
			})());
		}
		if (promises.length) await Promise.all(promises);
		const hexTx = this.provider.getRpcTransaction(tx);
		return this.provider.send("eth_sendTransaction", [hexTx]);
	}
	async sendTransaction(tx) {
		const blockNumber = await this.provider.getBlockNumber();
		const hash = await this.sendUncheckedTransaction(tx);
		return await new Promise((resolve, reject) => {
			const timeouts = [1e3, 100];
			let invalids = 0;
			const checkTx = async () => {
				try {
					const tx = await this.provider.getTransaction(hash);
					if (tx != null) {
						resolve(tx.replaceableTransaction(blockNumber));
						return;
					}
				} catch (error) {
					if (isError(error, "CANCELLED") || isError(error, "BAD_DATA") || isError(error, "NETWORK_ERROR") || isError(error, "UNSUPPORTED_OPERATION")) {
						if (error.info == null) error.info = {};
						error.info.sendTransactionHash = hash;
						reject(error);
						return;
					}
					if (isError(error, "INVALID_ARGUMENT")) {
						invalids++;
						if (error.info == null) error.info = {};
						error.info.sendTransactionHash = hash;
						if (invalids > 10) {
							reject(error);
							return;
						}
					}
					this.provider.emit("error", makeError("failed to fetch transation after sending (will try again)", "UNKNOWN_ERROR", { error }));
				}
				this.provider._setTimeout(() => {
					checkTx();
				}, timeouts.pop() || 4e3);
			};
			checkTx();
		});
	}
	async signTransaction(_tx) {
		const tx = deepCopy(_tx);
		if (tx.from) {
			const from = await resolveAddress(tx.from, this.provider);
			assertArgument(from != null && from.toLowerCase() === this.address.toLowerCase(), "from address mismatch", "transaction", _tx);
			tx.from = from;
		} else tx.from = this.address;
		const hexTx = this.provider.getRpcTransaction(tx);
		return await this.provider.send("eth_signTransaction", [hexTx]);
	}
	async signMessage(_message) {
		const message = typeof _message === "string" ? toUtf8Bytes(_message) : _message;
		return await this.provider.send("personal_sign", [hexlify(message), this.address.toLowerCase()]);
	}
	async signTypedData(domain, types, _value) {
		const value = deepCopy(_value);
		const populated = await TypedDataEncoder.resolveNames(domain, types, value, async (value) => {
			const address = await resolveAddress(value);
			assertArgument(address != null, "TypedData does not support null address", "value", value);
			return address;
		});
		return await this.provider.send("eth_signTypedData_v4", [this.address.toLowerCase(), JSON.stringify(TypedDataEncoder.getPayload(populated.domain, types, populated.value))]);
	}
	async unlock(password) {
		return this.provider.send("personal_unlockAccount", [
			this.address.toLowerCase(),
			password,
			null
		]);
	}
	async _legacySignMessage(_message) {
		const message = typeof _message === "string" ? toUtf8Bytes(_message) : _message;
		return await this.provider.send("eth_sign", [this.address.toLowerCase(), hexlify(message)]);
	}
};
/**
*  The JsonRpcApiProvider is an abstract class and **MUST** be
*  sub-classed.
*
*  It provides the base for all JSON-RPC-based Provider interaction.
*
*  Sub-classing Notes:
*  - a sub-class MUST override _send
*  - a sub-class MUST call the `_start()` method once connected
*/
var JsonRpcApiProvider = class extends AbstractProvider {
	#options;
	#nextId;
	#payloads;
	#drainTimer;
	#notReady;
	#network;
	#pendingDetectNetwork;
	#scheduleDrain() {
		if (this.#drainTimer) return;
		const stallTime = this._getOption("batchMaxCount") === 1 ? 0 : this._getOption("batchStallTime");
		this.#drainTimer = setTimeout(() => {
			this.#drainTimer = null;
			const payloads = this.#payloads;
			this.#payloads = [];
			while (payloads.length) {
				const batch = [payloads.shift()];
				while (payloads.length) {
					if (batch.length === this.#options.batchMaxCount) break;
					batch.push(payloads.shift());
					if (JSON.stringify(batch.map((p) => p.payload)).length > this.#options.batchMaxSize) {
						payloads.unshift(batch.pop());
						break;
					}
				}
				(async () => {
					const payload = batch.length === 1 ? batch[0].payload : batch.map((p) => p.payload);
					this.emit("debug", {
						action: "sendRpcPayload",
						payload
					});
					try {
						const result = await this._send(payload);
						this.emit("debug", {
							action: "receiveRpcResult",
							result
						});
						for (const { resolve, reject, payload } of batch) {
							if (this.destroyed) {
								reject(makeError("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", { operation: payload.method }));
								continue;
							}
							const resp = result.filter((r) => r.id === payload.id)[0];
							if (resp == null) {
								const error = makeError("missing response for request", "BAD_DATA", {
									value: result,
									info: { payload }
								});
								this.emit("error", error);
								reject(error);
								continue;
							}
							if ("error" in resp) {
								reject(this.getRpcError(payload, resp));
								continue;
							}
							resolve(resp.result);
						}
					} catch (error) {
						this.emit("debug", {
							action: "receiveRpcError",
							error
						});
						for (const { reject } of batch) reject(error);
					}
				})();
			}
		}, stallTime);
	}
	constructor(network, options) {
		super(network, options);
		this.#nextId = 1;
		this.#options = Object.assign({}, defaultOptions, options || {});
		this.#payloads = [];
		this.#drainTimer = null;
		this.#network = null;
		this.#pendingDetectNetwork = null;
		{
			let resolve = null;
			const promise = new Promise((_resolve) => {
				resolve = _resolve;
			});
			this.#notReady = {
				promise,
				resolve
			};
		}
		const staticNetwork = this._getOption("staticNetwork");
		if (typeof staticNetwork === "boolean") {
			assertArgument(!staticNetwork || network !== "any", "staticNetwork cannot be used on special network 'any'", "options", options);
			if (staticNetwork && network != null) this.#network = Network.from(network);
		} else if (staticNetwork) {
			assertArgument(network == null || staticNetwork.matches(network), "staticNetwork MUST match network object", "options", options);
			this.#network = staticNetwork;
		}
	}
	/**
	*  Returns the value associated with the option %%key%%.
	*
	*  Sub-classes can use this to inquire about configuration options.
	*/
	_getOption(key) {
		return this.#options[key];
	}
	/**
	*  Gets the [[Network]] this provider has committed to. On each call, the network
	*  is detected, and if it has changed, the call will reject.
	*/
	get _network() {
		assert(this.#network, "network is not available yet", "NETWORK_ERROR");
		return this.#network;
	}
	/**
	*  Resolves to the non-normalized value by performing %%req%%.
	*
	*  Sub-classes may override this to modify behavior of actions,
	*  and should generally call ``super._perform`` as a fallback.
	*/
	async _perform(req) {
		if (req.method === "call" || req.method === "estimateGas") {
			let tx = req.transaction;
			if (tx && tx.type != null && getBigInt(tx.type)) {
				if (tx.maxFeePerGas == null && tx.maxPriorityFeePerGas == null) {
					const feeData = await this.getFeeData();
					if (feeData.maxFeePerGas == null && feeData.maxPriorityFeePerGas == null) req = Object.assign({}, req, { transaction: Object.assign({}, tx, { type: void 0 }) });
				}
			}
		}
		const request = this.getRpcRequest(req);
		if (request != null) return await this.send(request.method, request.args);
		return super._perform(req);
	}
	/**
	*  Sub-classes may override this; it detects the *actual* network that
	*  we are **currently** connected to.
	*
	*  Keep in mind that [[send]] may only be used once [[ready]], otherwise the
	*  _send primitive must be used instead.
	*/
	async _detectNetwork() {
		const network = this._getOption("staticNetwork");
		if (network) {
			if (network === true) {
				if (this.#network) return this.#network;
			} else return network;
		}
		if (this.#pendingDetectNetwork) return await this.#pendingDetectNetwork;
		if (this.ready) {
			this.#pendingDetectNetwork = (async () => {
				try {
					const result = Network.from(getBigInt(await this.send("eth_chainId", [])));
					this.#pendingDetectNetwork = null;
					return result;
				} catch (error) {
					this.#pendingDetectNetwork = null;
					throw error;
				}
			})();
			return await this.#pendingDetectNetwork;
		}
		this.#pendingDetectNetwork = (async () => {
			const payload = {
				id: this.#nextId++,
				method: "eth_chainId",
				params: [],
				jsonrpc: "2.0"
			};
			this.emit("debug", {
				action: "sendRpcPayload",
				payload
			});
			let result;
			try {
				result = (await this._send(payload))[0];
				this.#pendingDetectNetwork = null;
			} catch (error) {
				this.#pendingDetectNetwork = null;
				this.emit("debug", {
					action: "receiveRpcError",
					error
				});
				throw error;
			}
			this.emit("debug", {
				action: "receiveRpcResult",
				result
			});
			if ("result" in result) return Network.from(getBigInt(result.result));
			throw this.getRpcError(payload, result);
		})();
		return await this.#pendingDetectNetwork;
	}
	/**
	*  Sub-classes **MUST** call this. Until [[_start]] has been called, no calls
	*  will be passed to [[_send]] from [[send]]. If it is overridden, then
	*  ``super._start()`` **MUST** be called.
	*
	*  Calling it multiple times is safe and has no effect.
	*/
	_start() {
		if (this.#notReady == null || this.#notReady.resolve == null) return;
		this.#notReady.resolve();
		this.#notReady = null;
		(async () => {
			while (this.#network == null && !this.destroyed) try {
				this.#network = await this._detectNetwork();
			} catch (error) {
				if (this.destroyed) break;
				console.log("JsonRpcProvider failed to detect network and cannot start up; retry in 1s (perhaps the URL is wrong or the node is not started)");
				this.emit("error", makeError("failed to bootstrap network detection", "NETWORK_ERROR", {
					event: "initial-network-discovery",
					info: { error }
				}));
				await stall(1e3);
			}
			this.#scheduleDrain();
		})();
	}
	/**
	*  Resolves once the [[_start]] has been called. This can be used in
	*  sub-classes to defer sending data until the connection has been
	*  established.
	*/
	async _waitUntilReady() {
		if (this.#notReady == null) return;
		return await this.#notReady.promise;
	}
	/**
	*  Return a Subscriber that will manage the %%sub%%.
	*
	*  Sub-classes may override this to modify the behavior of
	*  subscription management.
	*/
	_getSubscriber(sub) {
		if (sub.type === "pending") return new FilterIdPendingSubscriber(this);
		if (sub.type === "event") {
			if (this._getOption("polling")) return new PollingEventSubscriber(this, sub.filter);
			return new FilterIdEventSubscriber(this, sub.filter);
		}
		if (sub.type === "orphan" && sub.filter.orphan === "drop-log") return new UnmanagedSubscriber("orphan");
		return super._getSubscriber(sub);
	}
	/**
	*  Returns true only if the [[_start]] has been called.
	*/
	get ready() {
		return this.#notReady == null;
	}
	/**
	*  Returns %%tx%% as a normalized JSON-RPC transaction request,
	*  which has all values hexlified and any numeric values converted
	*  to Quantity values.
	*/
	getRpcTransaction(tx) {
		const result = {};
		[
			"chainId",
			"gasLimit",
			"gasPrice",
			"type",
			"maxFeePerGas",
			"maxPriorityFeePerGas",
			"nonce",
			"value"
		].forEach((key) => {
			if (tx[key] == null) return;
			let dstKey = key;
			if (key === "gasLimit") dstKey = "gas";
			result[dstKey] = toQuantity(getBigInt(tx[key], `tx.${key}`));
		});
		[
			"from",
			"to",
			"data"
		].forEach((key) => {
			if (tx[key] == null) return;
			result[key] = hexlify(tx[key]);
		});
		if (tx.accessList) result["accessList"] = accessListify(tx.accessList);
		if (tx.blobVersionedHashes) result["blobVersionedHashes"] = tx.blobVersionedHashes.map((h) => h.toLowerCase());
		if (tx.authorizationList) result["authorizationList"] = tx.authorizationList.map((_a) => {
			const a = authorizationify(_a);
			return {
				address: a.address,
				nonce: toQuantity(a.nonce),
				chainId: toQuantity(a.chainId),
				yParity: toQuantity(a.signature.yParity),
				r: toQuantity(a.signature.r),
				s: toQuantity(a.signature.s)
			};
		});
		return result;
	}
	/**
	*  Returns the request method and arguments required to perform
	*  %%req%%.
	*/
	getRpcRequest(req) {
		switch (req.method) {
			case "chainId": return {
				method: "eth_chainId",
				args: []
			};
			case "getBlockNumber": return {
				method: "eth_blockNumber",
				args: []
			};
			case "getGasPrice": return {
				method: "eth_gasPrice",
				args: []
			};
			case "getPriorityFee": return {
				method: "eth_maxPriorityFeePerGas",
				args: []
			};
			case "getBalance": return {
				method: "eth_getBalance",
				args: [getLowerCase(req.address), req.blockTag]
			};
			case "getTransactionCount": return {
				method: "eth_getTransactionCount",
				args: [getLowerCase(req.address), req.blockTag]
			};
			case "getCode": return {
				method: "eth_getCode",
				args: [getLowerCase(req.address), req.blockTag]
			};
			case "getStorage": return {
				method: "eth_getStorageAt",
				args: [
					getLowerCase(req.address),
					"0x" + req.position.toString(16),
					req.blockTag
				]
			};
			case "broadcastTransaction": return {
				method: "eth_sendRawTransaction",
				args: [req.signedTransaction]
			};
			case "getBlock":
				if ("blockTag" in req) return {
					method: "eth_getBlockByNumber",
					args: [req.blockTag, !!req.includeTransactions]
				};
				else if ("blockHash" in req) return {
					method: "eth_getBlockByHash",
					args: [req.blockHash, !!req.includeTransactions]
				};
				break;
			case "getTransaction": return {
				method: "eth_getTransactionByHash",
				args: [req.hash]
			};
			case "getTransactionReceipt": return {
				method: "eth_getTransactionReceipt",
				args: [req.hash]
			};
			case "call": return {
				method: "eth_call",
				args: [this.getRpcTransaction(req.transaction), req.blockTag]
			};
			case "estimateGas": return {
				method: "eth_estimateGas",
				args: [this.getRpcTransaction(req.transaction)]
			};
			case "getLogs":
				if (req.filter && req.filter.address != null) {
					if (Array.isArray(req.filter.address)) req.filter.address = req.filter.address.map(getLowerCase);
					else req.filter.address = getLowerCase(req.filter.address);
				}
				return {
					method: "eth_getLogs",
					args: [req.filter]
				};
		}
		return null;
	}
	/**
	*  Returns an ethers-style Error for the given JSON-RPC error
	*  %%payload%%, coalescing the various strings and error shapes
	*  that different nodes return, coercing them into a machine-readable
	*  standardized error.
	*/
	getRpcError(payload, _error) {
		const { method } = payload;
		const { error } = _error;
		if (method === "eth_estimateGas" && error.message) {
			const msg = error.message;
			if (!msg.match(/revert/i) && msg.match(/insufficient funds/i)) return makeError("insufficient funds", "INSUFFICIENT_FUNDS", {
				transaction: payload.params[0],
				info: {
					payload,
					error
				}
			});
			else if (msg.match(/nonce/i) && msg.match(/too low/i)) return makeError("nonce has already been used", "NONCE_EXPIRED", {
				transaction: payload.params[0],
				info: {
					payload,
					error
				}
			});
		}
		if (method === "eth_call" || method === "eth_estimateGas") {
			const result = spelunkData(error);
			const e = AbiCoder.getBuiltinCallException(method === "eth_call" ? "call" : "estimateGas", payload.params[0], result ? result.data : null);
			e.info = {
				error,
				payload
			};
			return e;
		}
		const message = JSON.stringify(spelunkMessage(error));
		if (typeof error.message === "string" && error.message.match(/user denied|ethers-user-denied/i)) return makeError(`user rejected action`, "ACTION_REJECTED", {
			action: {
				eth_sign: "signMessage",
				personal_sign: "signMessage",
				eth_signTypedData_v4: "signTypedData",
				eth_signTransaction: "signTransaction",
				eth_sendTransaction: "sendTransaction",
				eth_requestAccounts: "requestAccess",
				wallet_requestAccounts: "requestAccess"
			}[method] || "unknown",
			reason: "rejected",
			info: {
				payload,
				error
			}
		});
		if (method === "eth_sendRawTransaction" || method === "eth_sendTransaction") {
			const transaction = payload.params[0];
			if (message.match(/insufficient funds|base fee exceeds gas limit/i)) return makeError("insufficient funds for intrinsic transaction cost", "INSUFFICIENT_FUNDS", {
				transaction,
				info: { error }
			});
			if (message.match(/nonce/i) && message.match(/too low/i)) return makeError("nonce has already been used", "NONCE_EXPIRED", {
				transaction,
				info: { error }
			});
			if (message.match(/replacement transaction/i) && message.match(/underpriced/i)) return makeError("replacement fee too low", "REPLACEMENT_UNDERPRICED", {
				transaction,
				info: { error }
			});
			if (message.match(/only replay-protected/i)) return makeError("legacy pre-eip-155 transactions not supported", "UNSUPPORTED_OPERATION", {
				operation: method,
				info: {
					transaction,
					info: { error }
				}
			});
		}
		let unsupported = !!message.match(/the method .* does not exist/i);
		if (!unsupported) {
			if (error && error.details && error.details.startsWith("Unauthorized method:")) unsupported = true;
		}
		if (unsupported) return makeError("unsupported operation", "UNSUPPORTED_OPERATION", {
			operation: payload.method,
			info: {
				error,
				payload
			}
		});
		return makeError("could not coalesce error", "UNKNOWN_ERROR", {
			error,
			payload
		});
	}
	/**
	*  Requests the %%method%% with %%params%% via the JSON-RPC protocol
	*  over the underlying channel. This can be used to call methods
	*  on the backend that do not have a high-level API within the Provider
	*  API.
	*
	*  This method queues requests according to the batch constraints
	*  in the options, assigns the request a unique ID.
	*
	*  **Do NOT override** this method in sub-classes; instead
	*  override [[_send]] or force the options values in the
	*  call to the constructor to modify this method's behavior.
	*/
	send(method, params) {
		if (this.destroyed) return Promise.reject(makeError("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", { operation: method }));
		const id = this.#nextId++;
		const promise = new Promise((resolve, reject) => {
			this.#payloads.push({
				resolve,
				reject,
				payload: {
					method,
					params,
					id,
					jsonrpc: "2.0"
				}
			});
		});
		this.#scheduleDrain();
		return promise;
	}
	/**
	*  Resolves to the [[Signer]] account for  %%address%% managed by
	*  the client.
	*
	*  If the %%address%% is a number, it is used as an index in the
	*  the accounts from [[listAccounts]].
	*
	*  This can only be used on clients which manage accounts (such as
	*  Geth with imported account or MetaMask).
	*
	*  Throws if the account doesn't exist.
	*/
	async getSigner(address) {
		if (address == null) address = 0;
		const accountsPromise = this.send("eth_accounts", []);
		if (typeof address === "number") {
			const accounts = await accountsPromise;
			if (address >= accounts.length) throw new Error("no such account");
			return new JsonRpcSigner(this, accounts[address]);
		}
		const { accounts } = await resolveProperties({
			network: this.getNetwork(),
			accounts: accountsPromise
		});
		address = getAddress(address);
		for (const account of accounts) if (getAddress(account) === address) return new JsonRpcSigner(this, address);
		throw new Error("invalid account");
	}
	async listAccounts() {
		return (await this.send("eth_accounts", [])).map((a) => new JsonRpcSigner(this, a));
	}
	destroy() {
		if (this.#drainTimer) {
			clearTimeout(this.#drainTimer);
			this.#drainTimer = null;
		}
		for (const { payload, reject } of this.#payloads) reject(makeError("provider destroyed; cancelled request", "UNSUPPORTED_OPERATION", { operation: payload.method }));
		this.#payloads = [];
		super.destroy();
	}
};
/**
*  @_ignore:
*/
var JsonRpcApiPollingProvider = class extends JsonRpcApiProvider {
	#pollingInterval;
	constructor(network, options) {
		super(network, options);
		let pollingInterval = this._getOption("pollingInterval");
		if (pollingInterval == null) pollingInterval = defaultOptions.pollingInterval;
		this.#pollingInterval = pollingInterval;
	}
	_getSubscriber(sub) {
		const subscriber = super._getSubscriber(sub);
		if (isPollable(subscriber)) subscriber.pollingInterval = this.#pollingInterval;
		return subscriber;
	}
	/**
	*  The polling interval (default: 4000 ms)
	*/
	get pollingInterval() {
		return this.#pollingInterval;
	}
	set pollingInterval(value) {
		if (!Number.isInteger(value) || value < 0) throw new Error("invalid interval");
		this.#pollingInterval = value;
		this._forEachSubscriber((sub) => {
			if (isPollable(sub)) sub.pollingInterval = this.#pollingInterval;
		});
	}
};
/**
*  The JsonRpcProvider is one of the most common Providers,
*  which performs all operations over HTTP (or HTTPS) requests.
*
*  Events are processed by polling the backend for the current block
*  number; when it advances, all block-base events are then checked
*  for updates.
*/
var JsonRpcProvider = class extends JsonRpcApiPollingProvider {
	#connect;
	constructor(url, network, options) {
		if (url == null) url = "http://localhost:8545";
		super(network, options);
		if (typeof url === "string") this.#connect = new FetchRequest(url);
		else this.#connect = url.clone();
	}
	_getConnection() {
		return this.#connect.clone();
	}
	async send(method, params) {
		await this._start();
		return await super.send(method, params);
	}
	async _send(payload) {
		const request = this._getConnection();
		request.body = JSON.stringify(payload);
		request.setHeader("content-type", "application/json");
		const response = await request.send();
		response.assertOk();
		let resp = response.bodyJson;
		if (!Array.isArray(resp)) resp = [resp];
		return resp;
	}
};
function spelunkData(value) {
	if (value == null) return null;
	if (typeof value.message === "string" && value.message.match(/revert/i) && isHexString(value.data)) return {
		message: value.message,
		data: value.data
	};
	if (typeof value === "object") {
		for (const key in value) {
			const result = spelunkData(value[key]);
			if (result) return result;
		}
		return null;
	}
	if (typeof value === "string") try {
		return spelunkData(JSON.parse(value));
	} catch (error) {}
	return null;
}
function _spelunkMessage(value, result) {
	if (value == null) return;
	if (typeof value.message === "string") result.push(value.message);
	if (typeof value === "object") for (const key in value) _spelunkMessage(value[key], result);
	if (typeof value === "string") try {
		return _spelunkMessage(JSON.parse(value), result);
	} catch (error) {}
}
function spelunkMessage(value) {
	const result = [];
	_spelunkMessage(value, result);
	return result;
}
//#endregion
export { id as a, toQuantity as c, Interface as i, hexlify as l, Network as n, getAddress as o, Contract as r, ZeroAddress as s, JsonRpcProvider as t };
