import { a as __toCommonJS, i as __require, n as __esmMin, o as __toESM, r as __exportAll, t as __commonJSMin } from "../../_runtime.mjs";
import { d as ed25519, u as secp256k1 } from "../noble__curves+noble__hashes.mjs";
import { n as keccak_256, r as sha256 } from "../noble__hashes.mjs";
import { t as require_Layout } from "../solana__buffer-layout.mjs";
import { n as getU64Encoder, t as getU64Codec } from "../solana__codecs-numbers.mjs";
import { Buffer as Buffer$1 } from "buffer";
import require$$0 from "util";
import http from "http";
import https, { Agent } from "https";
import Stream from "stream";
import Url from "url";
import zlib from "zlib";
//#region node_modules/bn.js/lib/bn.js
var require_bn = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(module$1, exports$1) {
		"use strict";
		function assert(val, msg) {
			if (!val) throw new Error(msg || "Assertion failed");
		}
		function inherits(ctor, superCtor) {
			ctor.super_ = superCtor;
			var TempCtor = function() {};
			TempCtor.prototype = superCtor.prototype;
			ctor.prototype = new TempCtor();
			ctor.prototype.constructor = ctor;
		}
		function BN(number, base, endian) {
			if (BN.isBN(number)) return number;
			this.negative = 0;
			this.words = null;
			this.length = 0;
			this.red = null;
			if (number !== null) {
				if (base === "le" || base === "be") {
					endian = base;
					base = 10;
				}
				this._init(number || 0, base || 10, endian || "be");
			}
		}
		if (typeof module$1 === "object") module$1.exports = BN;
		else exports$1.BN = BN;
		BN.BN = BN;
		BN.wordSize = 26;
		var Buffer;
		try {
			if (typeof window !== "undefined" && typeof window.Buffer !== "undefined") Buffer = window.Buffer;
			else Buffer = __require("buffer").Buffer;
		} catch (e) {}
		BN.isBN = function isBN(num) {
			if (num instanceof BN) return true;
			return num !== null && typeof num === "object" && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
		};
		BN.max = function max(left, right) {
			if (left.cmp(right) > 0) return left;
			return right;
		};
		BN.min = function min(left, right) {
			if (left.cmp(right) < 0) return left;
			return right;
		};
		BN.prototype._init = function init(number, base, endian) {
			if (typeof number === "number") return this._initNumber(number, base, endian);
			if (typeof number === "object") return this._initArray(number, base, endian);
			if (base === "hex") base = 16;
			assert(base === (base | 0) && base >= 2 && base <= 36);
			number = number.toString().replace(/\s+/g, "");
			var start = 0;
			if (number[0] === "-") {
				start++;
				this.negative = 1;
			}
			if (start < number.length) {
				if (base === 16) this._parseHex(number, start, endian);
				else {
					this._parseBase(number, base, start);
					if (endian === "le") this._initArray(this.toArray(), base, endian);
				}
			}
		};
		BN.prototype._initNumber = function _initNumber(number, base, endian) {
			if (number < 0) {
				this.negative = 1;
				number = -number;
			}
			if (number < 67108864) {
				this.words = [number & 67108863];
				this.length = 1;
			} else if (number < 4503599627370496) {
				this.words = [number & 67108863, number / 67108864 & 67108863];
				this.length = 2;
			} else {
				assert(number < 9007199254740992);
				this.words = [
					number & 67108863,
					number / 67108864 & 67108863,
					1
				];
				this.length = 3;
			}
			if (endian !== "le") return;
			this._initArray(this.toArray(), base, endian);
		};
		BN.prototype._initArray = function _initArray(number, base, endian) {
			assert(typeof number.length === "number");
			if (number.length <= 0) {
				this.words = [0];
				this.length = 1;
				return this;
			}
			this.length = Math.ceil(number.length / 3);
			this.words = new Array(this.length);
			for (var i = 0; i < this.length; i++) this.words[i] = 0;
			var j, w;
			var off = 0;
			if (endian === "be") for (i = number.length - 1, j = 0; i >= 0; i -= 3) {
				w = number[i] | number[i - 1] << 8 | number[i - 2] << 16;
				this.words[j] |= w << off & 67108863;
				this.words[j + 1] = w >>> 26 - off & 67108863;
				off += 24;
				if (off >= 26) {
					off -= 26;
					j++;
				}
			}
			else if (endian === "le") for (i = 0, j = 0; i < number.length; i += 3) {
				w = number[i] | number[i + 1] << 8 | number[i + 2] << 16;
				this.words[j] |= w << off & 67108863;
				this.words[j + 1] = w >>> 26 - off & 67108863;
				off += 24;
				if (off >= 26) {
					off -= 26;
					j++;
				}
			}
			return this._strip();
		};
		function parseHex4Bits(string, index) {
			var c = string.charCodeAt(index);
			if (c >= 48 && c <= 57) return c - 48;
			else if (c >= 65 && c <= 70) return c - 55;
			else if (c >= 97 && c <= 102) return c - 87;
			else assert(false, "Invalid character in " + string);
		}
		function parseHexByte(string, lowerBound, index) {
			var r = parseHex4Bits(string, index);
			if (index - 1 >= lowerBound) r |= parseHex4Bits(string, index - 1) << 4;
			return r;
		}
		BN.prototype._parseHex = function _parseHex(number, start, endian) {
			this.length = Math.ceil((number.length - start) / 6);
			this.words = new Array(this.length);
			for (var i = 0; i < this.length; i++) this.words[i] = 0;
			var off = 0;
			var j = 0;
			var w;
			if (endian === "be") for (i = number.length - 1; i >= start; i -= 2) {
				w = parseHexByte(number, start, i) << off;
				this.words[j] |= w & 67108863;
				if (off >= 18) {
					off -= 18;
					j += 1;
					this.words[j] |= w >>> 26;
				} else off += 8;
			}
			else for (i = (number.length - start) % 2 === 0 ? start + 1 : start; i < number.length; i += 2) {
				w = parseHexByte(number, start, i) << off;
				this.words[j] |= w & 67108863;
				if (off >= 18) {
					off -= 18;
					j += 1;
					this.words[j] |= w >>> 26;
				} else off += 8;
			}
			this._strip();
		};
		function parseBase(str, start, end, mul) {
			var r = 0;
			var b = 0;
			var len = Math.min(str.length, end);
			for (var i = start; i < len; i++) {
				var c = str.charCodeAt(i) - 48;
				r *= mul;
				if (c >= 49) b = c - 49 + 10;
				else if (c >= 17) b = c - 17 + 10;
				else b = c;
				assert(c >= 0 && b < mul, "Invalid character");
				r += b;
			}
			return r;
		}
		BN.prototype._parseBase = function _parseBase(number, base, start) {
			this.words = [0];
			this.length = 1;
			for (var limbLen = 0, limbPow = 1; limbPow <= 67108863; limbPow *= base) limbLen++;
			limbLen--;
			limbPow = limbPow / base | 0;
			var total = number.length - start;
			var mod = total % limbLen;
			var end = Math.min(total, total - mod) + start;
			var word = 0;
			for (var i = start; i < end; i += limbLen) {
				word = parseBase(number, i, i + limbLen, base);
				this.imuln(limbPow);
				if (this.words[0] + word < 67108864) this.words[0] += word;
				else this._iaddn(word);
			}
			if (mod !== 0) {
				var pow = 1;
				word = parseBase(number, i, number.length, base);
				for (i = 0; i < mod; i++) pow *= base;
				this.imuln(pow);
				if (this.words[0] + word < 67108864) this.words[0] += word;
				else this._iaddn(word);
			}
			this._strip();
		};
		BN.prototype.copy = function copy(dest) {
			dest.words = new Array(this.length);
			for (var i = 0; i < this.length; i++) dest.words[i] = this.words[i];
			dest.length = this.length;
			dest.negative = this.negative;
			dest.red = this.red;
		};
		function move(dest, src) {
			dest.words = src.words;
			dest.length = src.length;
			dest.negative = src.negative;
			dest.red = src.red;
		}
		BN.prototype._move = function _move(dest) {
			move(dest, this);
		};
		BN.prototype.clone = function clone() {
			var r = new BN(null);
			this.copy(r);
			return r;
		};
		BN.prototype._expand = function _expand(size) {
			while (this.length < size) this.words[this.length++] = 0;
			return this;
		};
		BN.prototype._strip = function strip() {
			while (this.length > 1 && this.words[this.length - 1] === 0) this.length--;
			return this._normSign();
		};
		BN.prototype._normSign = function _normSign() {
			if (this.length === 1 && this.words[0] === 0) this.negative = 0;
			return this;
		};
		if (typeof Symbol !== "undefined" && typeof Symbol.for === "function") try {
			BN.prototype[Symbol.for("nodejs.util.inspect.custom")] = inspect;
		} catch (e) {
			BN.prototype.inspect = inspect;
		}
		else BN.prototype.inspect = inspect;
		function inspect() {
			return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
		}
		var zeros = [
			"",
			"0",
			"00",
			"000",
			"0000",
			"00000",
			"000000",
			"0000000",
			"00000000",
			"000000000",
			"0000000000",
			"00000000000",
			"000000000000",
			"0000000000000",
			"00000000000000",
			"000000000000000",
			"0000000000000000",
			"00000000000000000",
			"000000000000000000",
			"0000000000000000000",
			"00000000000000000000",
			"000000000000000000000",
			"0000000000000000000000",
			"00000000000000000000000",
			"000000000000000000000000",
			"0000000000000000000000000"
		];
		var groupSizes = [
			0,
			0,
			25,
			16,
			12,
			11,
			10,
			9,
			8,
			8,
			7,
			7,
			7,
			7,
			6,
			6,
			6,
			6,
			6,
			6,
			6,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5,
			5
		];
		var groupBases = [
			0,
			0,
			33554432,
			43046721,
			16777216,
			48828125,
			60466176,
			40353607,
			16777216,
			43046721,
			1e7,
			19487171,
			35831808,
			62748517,
			7529536,
			11390625,
			16777216,
			24137569,
			34012224,
			47045881,
			64e6,
			4084101,
			5153632,
			6436343,
			7962624,
			9765625,
			11881376,
			14348907,
			17210368,
			20511149,
			243e5,
			28629151,
			33554432,
			39135393,
			45435424,
			52521875,
			60466176
		];
		BN.prototype.toString = function toString(base, padding) {
			base = base || 10;
			padding = padding | 0 || 1;
			var out;
			if (base === 16 || base === "hex") {
				out = "";
				var off = 0;
				var carry = 0;
				for (var i = 0; i < this.length; i++) {
					var w = this.words[i];
					var word = ((w << off | carry) & 16777215).toString(16);
					carry = w >>> 24 - off & 16777215;
					off += 2;
					if (off >= 26) {
						off -= 26;
						i--;
					}
					if (carry !== 0 || i !== this.length - 1) out = zeros[6 - word.length] + word + out;
					else out = word + out;
				}
				if (carry !== 0) out = carry.toString(16) + out;
				while (out.length % padding !== 0) out = "0" + out;
				if (this.negative !== 0) out = "-" + out;
				return out;
			}
			if (base === (base | 0) && base >= 2 && base <= 36) {
				var groupSize = groupSizes[base];
				var groupBase = groupBases[base];
				out = "";
				var c = this.clone();
				c.negative = 0;
				while (!c.isZero()) {
					var r = c.modrn(groupBase).toString(base);
					c = c.idivn(groupBase);
					if (!c.isZero()) out = zeros[groupSize - r.length] + r + out;
					else out = r + out;
				}
				if (this.isZero()) out = "0" + out;
				while (out.length % padding !== 0) out = "0" + out;
				if (this.negative !== 0) out = "-" + out;
				return out;
			}
			assert(false, "Base should be between 2 and 36");
		};
		BN.prototype.toNumber = function toNumber() {
			var ret = this.words[0];
			if (this.length === 2) ret += this.words[1] * 67108864;
			else if (this.length === 3 && this.words[2] === 1) ret += 4503599627370496 + this.words[1] * 67108864;
			else if (this.length > 2) assert(false, "Number can only safely store up to 53 bits");
			return this.negative !== 0 ? -ret : ret;
		};
		BN.prototype.toJSON = function toJSON() {
			return this.toString(16, 2);
		};
		if (Buffer) BN.prototype.toBuffer = function toBuffer(endian, length) {
			return this.toArrayLike(Buffer, endian, length);
		};
		BN.prototype.toArray = function toArray(endian, length) {
			return this.toArrayLike(Array, endian, length);
		};
		var allocate = function allocate(ArrayType, size) {
			if (ArrayType.allocUnsafe) return ArrayType.allocUnsafe(size);
			return new ArrayType(size);
		};
		BN.prototype.toArrayLike = function toArrayLike(ArrayType, endian, length) {
			this._strip();
			var byteLength = this.byteLength();
			var reqLength = length || Math.max(1, byteLength);
			assert(byteLength <= reqLength, "byte array longer than desired length");
			assert(reqLength > 0, "Requested array length <= 0");
			var res = allocate(ArrayType, reqLength);
			var postfix = endian === "le" ? "LE" : "BE";
			this["_toArrayLike" + postfix](res, byteLength);
			return res;
		};
		BN.prototype._toArrayLikeLE = function _toArrayLikeLE(res, byteLength) {
			var position = 0;
			var carry = 0;
			for (var i = 0, shift = 0; i < this.length; i++) {
				var word = this.words[i] << shift | carry;
				res[position++] = word & 255;
				if (position < res.length) res[position++] = word >> 8 & 255;
				if (position < res.length) res[position++] = word >> 16 & 255;
				if (shift === 6) {
					if (position < res.length) res[position++] = word >> 24 & 255;
					carry = 0;
					shift = 0;
				} else {
					carry = word >>> 24;
					shift += 2;
				}
			}
			if (position < res.length) {
				res[position++] = carry;
				while (position < res.length) res[position++] = 0;
			}
		};
		BN.prototype._toArrayLikeBE = function _toArrayLikeBE(res, byteLength) {
			var position = res.length - 1;
			var carry = 0;
			for (var i = 0, shift = 0; i < this.length; i++) {
				var word = this.words[i] << shift | carry;
				res[position--] = word & 255;
				if (position >= 0) res[position--] = word >> 8 & 255;
				if (position >= 0) res[position--] = word >> 16 & 255;
				if (shift === 6) {
					if (position >= 0) res[position--] = word >> 24 & 255;
					carry = 0;
					shift = 0;
				} else {
					carry = word >>> 24;
					shift += 2;
				}
			}
			if (position >= 0) {
				res[position--] = carry;
				while (position >= 0) res[position--] = 0;
			}
		};
		if (Math.clz32) BN.prototype._countBits = function _countBits(w) {
			return 32 - Math.clz32(w);
		};
		else BN.prototype._countBits = function _countBits(w) {
			var t = w;
			var r = 0;
			if (t >= 4096) {
				r += 13;
				t >>>= 13;
			}
			if (t >= 64) {
				r += 7;
				t >>>= 7;
			}
			if (t >= 8) {
				r += 4;
				t >>>= 4;
			}
			if (t >= 2) {
				r += 2;
				t >>>= 2;
			}
			return r + t;
		};
		BN.prototype._zeroBits = function _zeroBits(w) {
			if (w === 0) return 26;
			var t = w;
			var r = 0;
			if ((t & 8191) === 0) {
				r += 13;
				t >>>= 13;
			}
			if ((t & 127) === 0) {
				r += 7;
				t >>>= 7;
			}
			if ((t & 15) === 0) {
				r += 4;
				t >>>= 4;
			}
			if ((t & 3) === 0) {
				r += 2;
				t >>>= 2;
			}
			if ((t & 1) === 0) r++;
			return r;
		};
		BN.prototype.bitLength = function bitLength() {
			var w = this.words[this.length - 1];
			var hi = this._countBits(w);
			return (this.length - 1) * 26 + hi;
		};
		function toBitArray(num) {
			var w = new Array(num.bitLength());
			for (var bit = 0; bit < w.length; bit++) {
				var off = bit / 26 | 0;
				var wbit = bit % 26;
				w[bit] = num.words[off] >>> wbit & 1;
			}
			return w;
		}
		BN.prototype.zeroBits = function zeroBits() {
			if (this.isZero()) return 0;
			var r = 0;
			for (var i = 0; i < this.length; i++) {
				var b = this._zeroBits(this.words[i]);
				r += b;
				if (b !== 26) break;
			}
			return r;
		};
		BN.prototype.byteLength = function byteLength() {
			return Math.ceil(this.bitLength() / 8);
		};
		BN.prototype.toTwos = function toTwos(width) {
			if (this.negative !== 0) return this.abs().inotn(width).iaddn(1);
			return this.clone();
		};
		BN.prototype.fromTwos = function fromTwos(width) {
			if (this.testn(width - 1)) return this.notn(width).iaddn(1).ineg();
			return this.clone();
		};
		BN.prototype.isNeg = function isNeg() {
			return this.negative !== 0;
		};
		BN.prototype.neg = function neg() {
			return this.clone().ineg();
		};
		BN.prototype.ineg = function ineg() {
			if (!this.isZero()) this.negative ^= 1;
			return this;
		};
		BN.prototype.iuor = function iuor(num) {
			while (this.length < num.length) this.words[this.length++] = 0;
			for (var i = 0; i < num.length; i++) this.words[i] = this.words[i] | num.words[i];
			return this._strip();
		};
		BN.prototype.ior = function ior(num) {
			assert((this.negative | num.negative) === 0);
			return this.iuor(num);
		};
		BN.prototype.or = function or(num) {
			if (this.length > num.length) return this.clone().ior(num);
			return num.clone().ior(this);
		};
		BN.prototype.uor = function uor(num) {
			if (this.length > num.length) return this.clone().iuor(num);
			return num.clone().iuor(this);
		};
		BN.prototype.iuand = function iuand(num) {
			var b;
			if (this.length > num.length) b = num;
			else b = this;
			for (var i = 0; i < b.length; i++) this.words[i] = this.words[i] & num.words[i];
			this.length = b.length;
			return this._strip();
		};
		BN.prototype.iand = function iand(num) {
			assert((this.negative | num.negative) === 0);
			return this.iuand(num);
		};
		BN.prototype.and = function and(num) {
			if (this.length > num.length) return this.clone().iand(num);
			return num.clone().iand(this);
		};
		BN.prototype.uand = function uand(num) {
			if (this.length > num.length) return this.clone().iuand(num);
			return num.clone().iuand(this);
		};
		BN.prototype.iuxor = function iuxor(num) {
			var a;
			var b;
			if (this.length > num.length) {
				a = this;
				b = num;
			} else {
				a = num;
				b = this;
			}
			for (var i = 0; i < b.length; i++) this.words[i] = a.words[i] ^ b.words[i];
			if (this !== a) for (; i < a.length; i++) this.words[i] = a.words[i];
			this.length = a.length;
			return this._strip();
		};
		BN.prototype.ixor = function ixor(num) {
			assert((this.negative | num.negative) === 0);
			return this.iuxor(num);
		};
		BN.prototype.xor = function xor(num) {
			if (this.length > num.length) return this.clone().ixor(num);
			return num.clone().ixor(this);
		};
		BN.prototype.uxor = function uxor(num) {
			if (this.length > num.length) return this.clone().iuxor(num);
			return num.clone().iuxor(this);
		};
		BN.prototype.inotn = function inotn(width) {
			assert(typeof width === "number" && width >= 0);
			var bytesNeeded = Math.ceil(width / 26) | 0;
			var bitsLeft = width % 26;
			this._expand(bytesNeeded);
			if (bitsLeft > 0) bytesNeeded--;
			for (var i = 0; i < bytesNeeded; i++) this.words[i] = ~this.words[i] & 67108863;
			if (bitsLeft > 0) {
				this.words[i] = ~this.words[i] & 67108863 >> 26 - bitsLeft;
				i++;
			}
			for (; i < this.length; i++) this.words[i] = 0;
			return this._strip();
		};
		BN.prototype.notn = function notn(width) {
			return this.clone().inotn(width);
		};
		BN.prototype.setn = function setn(bit, val) {
			assert(typeof bit === "number" && bit >= 0);
			var off = bit / 26 | 0;
			var wbit = bit % 26;
			this._expand(off + 1);
			if (val) this.words[off] = this.words[off] | 1 << wbit;
			else this.words[off] = this.words[off] & ~(1 << wbit);
			return this._strip();
		};
		BN.prototype.iadd = function iadd(num) {
			var r;
			if (this.negative !== 0 && num.negative === 0) {
				this.negative = 0;
				r = this.isub(num);
				this.negative ^= 1;
				return this._normSign();
			} else if (this.negative === 0 && num.negative !== 0) {
				num.negative = 0;
				r = this.isub(num);
				num.negative = 1;
				return r._normSign();
			}
			var a, b;
			if (this.length > num.length) {
				a = this;
				b = num;
			} else {
				a = num;
				b = this;
			}
			var carry = 0;
			for (var i = 0; i < b.length; i++) {
				r = (a.words[i] | 0) + (b.words[i] | 0) + carry;
				this.words[i] = r & 67108863;
				carry = r >>> 26;
			}
			for (; carry !== 0 && i < a.length; i++) {
				r = (a.words[i] | 0) + carry;
				this.words[i] = r & 67108863;
				carry = r >>> 26;
			}
			this.length = a.length;
			if (carry !== 0) {
				this.words[this.length] = carry;
				this.length++;
			} else if (a !== this) for (; i < a.length; i++) this.words[i] = a.words[i];
			return this;
		};
		BN.prototype.add = function add(num) {
			var res;
			if (num.negative !== 0 && this.negative === 0) {
				num.negative = 0;
				res = this.sub(num);
				num.negative ^= 1;
				return res;
			} else if (num.negative === 0 && this.negative !== 0) {
				this.negative = 0;
				res = num.sub(this);
				this.negative = 1;
				return res;
			}
			if (this.length > num.length) return this.clone().iadd(num);
			return num.clone().iadd(this);
		};
		BN.prototype.isub = function isub(num) {
			if (num.negative !== 0) {
				num.negative = 0;
				var r = this.iadd(num);
				num.negative = 1;
				return r._normSign();
			} else if (this.negative !== 0) {
				this.negative = 0;
				this.iadd(num);
				this.negative = 1;
				return this._normSign();
			}
			var cmp = this.cmp(num);
			if (cmp === 0) {
				this.negative = 0;
				this.length = 1;
				this.words[0] = 0;
				return this;
			}
			var a, b;
			if (cmp > 0) {
				a = this;
				b = num;
			} else {
				a = num;
				b = this;
			}
			var carry = 0;
			for (var i = 0; i < b.length; i++) {
				r = (a.words[i] | 0) - (b.words[i] | 0) + carry;
				carry = r >> 26;
				this.words[i] = r & 67108863;
			}
			for (; carry !== 0 && i < a.length; i++) {
				r = (a.words[i] | 0) + carry;
				carry = r >> 26;
				this.words[i] = r & 67108863;
			}
			if (carry === 0 && i < a.length && a !== this) for (; i < a.length; i++) this.words[i] = a.words[i];
			this.length = Math.max(this.length, i);
			if (a !== this) this.negative = 1;
			return this._strip();
		};
		BN.prototype.sub = function sub(num) {
			return this.clone().isub(num);
		};
		function smallMulTo(self, num, out) {
			out.negative = num.negative ^ self.negative;
			var len = self.length + num.length | 0;
			out.length = len;
			len = len - 1 | 0;
			var a = self.words[0] | 0;
			var b = num.words[0] | 0;
			var r = a * b;
			var lo = r & 67108863;
			var carry = r / 67108864 | 0;
			out.words[0] = lo;
			for (var k = 1; k < len; k++) {
				var ncarry = carry >>> 26;
				var rword = carry & 67108863;
				var maxJ = Math.min(k, num.length - 1);
				for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
					var i = k - j | 0;
					a = self.words[i] | 0;
					b = num.words[j] | 0;
					r = a * b + rword;
					ncarry += r / 67108864 | 0;
					rword = r & 67108863;
				}
				out.words[k] = rword | 0;
				carry = ncarry | 0;
			}
			if (carry !== 0) out.words[k] = carry | 0;
			else out.length--;
			return out._strip();
		}
		var comb10MulTo = function comb10MulTo(self, num, out) {
			var a = self.words;
			var b = num.words;
			var o = out.words;
			var c = 0;
			var lo;
			var mid;
			var hi;
			var a0 = a[0] | 0;
			var al0 = a0 & 8191;
			var ah0 = a0 >>> 13;
			var a1 = a[1] | 0;
			var al1 = a1 & 8191;
			var ah1 = a1 >>> 13;
			var a2 = a[2] | 0;
			var al2 = a2 & 8191;
			var ah2 = a2 >>> 13;
			var a3 = a[3] | 0;
			var al3 = a3 & 8191;
			var ah3 = a3 >>> 13;
			var a4 = a[4] | 0;
			var al4 = a4 & 8191;
			var ah4 = a4 >>> 13;
			var a5 = a[5] | 0;
			var al5 = a5 & 8191;
			var ah5 = a5 >>> 13;
			var a6 = a[6] | 0;
			var al6 = a6 & 8191;
			var ah6 = a6 >>> 13;
			var a7 = a[7] | 0;
			var al7 = a7 & 8191;
			var ah7 = a7 >>> 13;
			var a8 = a[8] | 0;
			var al8 = a8 & 8191;
			var ah8 = a8 >>> 13;
			var a9 = a[9] | 0;
			var al9 = a9 & 8191;
			var ah9 = a9 >>> 13;
			var b0 = b[0] | 0;
			var bl0 = b0 & 8191;
			var bh0 = b0 >>> 13;
			var b1 = b[1] | 0;
			var bl1 = b1 & 8191;
			var bh1 = b1 >>> 13;
			var b2 = b[2] | 0;
			var bl2 = b2 & 8191;
			var bh2 = b2 >>> 13;
			var b3 = b[3] | 0;
			var bl3 = b3 & 8191;
			var bh3 = b3 >>> 13;
			var b4 = b[4] | 0;
			var bl4 = b4 & 8191;
			var bh4 = b4 >>> 13;
			var b5 = b[5] | 0;
			var bl5 = b5 & 8191;
			var bh5 = b5 >>> 13;
			var b6 = b[6] | 0;
			var bl6 = b6 & 8191;
			var bh6 = b6 >>> 13;
			var b7 = b[7] | 0;
			var bl7 = b7 & 8191;
			var bh7 = b7 >>> 13;
			var b8 = b[8] | 0;
			var bl8 = b8 & 8191;
			var bh8 = b8 >>> 13;
			var b9 = b[9] | 0;
			var bl9 = b9 & 8191;
			var bh9 = b9 >>> 13;
			out.negative = self.negative ^ num.negative;
			out.length = 19;
			lo = Math.imul(al0, bl0);
			mid = Math.imul(al0, bh0);
			mid = mid + Math.imul(ah0, bl0) | 0;
			hi = Math.imul(ah0, bh0);
			var w0 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0;
			w0 &= 67108863;
			lo = Math.imul(al1, bl0);
			mid = Math.imul(al1, bh0);
			mid = mid + Math.imul(ah1, bl0) | 0;
			hi = Math.imul(ah1, bh0);
			lo = lo + Math.imul(al0, bl1) | 0;
			mid = mid + Math.imul(al0, bh1) | 0;
			mid = mid + Math.imul(ah0, bl1) | 0;
			hi = hi + Math.imul(ah0, bh1) | 0;
			var w1 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0;
			w1 &= 67108863;
			lo = Math.imul(al2, bl0);
			mid = Math.imul(al2, bh0);
			mid = mid + Math.imul(ah2, bl0) | 0;
			hi = Math.imul(ah2, bh0);
			lo = lo + Math.imul(al1, bl1) | 0;
			mid = mid + Math.imul(al1, bh1) | 0;
			mid = mid + Math.imul(ah1, bl1) | 0;
			hi = hi + Math.imul(ah1, bh1) | 0;
			lo = lo + Math.imul(al0, bl2) | 0;
			mid = mid + Math.imul(al0, bh2) | 0;
			mid = mid + Math.imul(ah0, bl2) | 0;
			hi = hi + Math.imul(ah0, bh2) | 0;
			var w2 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0;
			w2 &= 67108863;
			lo = Math.imul(al3, bl0);
			mid = Math.imul(al3, bh0);
			mid = mid + Math.imul(ah3, bl0) | 0;
			hi = Math.imul(ah3, bh0);
			lo = lo + Math.imul(al2, bl1) | 0;
			mid = mid + Math.imul(al2, bh1) | 0;
			mid = mid + Math.imul(ah2, bl1) | 0;
			hi = hi + Math.imul(ah2, bh1) | 0;
			lo = lo + Math.imul(al1, bl2) | 0;
			mid = mid + Math.imul(al1, bh2) | 0;
			mid = mid + Math.imul(ah1, bl2) | 0;
			hi = hi + Math.imul(ah1, bh2) | 0;
			lo = lo + Math.imul(al0, bl3) | 0;
			mid = mid + Math.imul(al0, bh3) | 0;
			mid = mid + Math.imul(ah0, bl3) | 0;
			hi = hi + Math.imul(ah0, bh3) | 0;
			var w3 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0;
			w3 &= 67108863;
			lo = Math.imul(al4, bl0);
			mid = Math.imul(al4, bh0);
			mid = mid + Math.imul(ah4, bl0) | 0;
			hi = Math.imul(ah4, bh0);
			lo = lo + Math.imul(al3, bl1) | 0;
			mid = mid + Math.imul(al3, bh1) | 0;
			mid = mid + Math.imul(ah3, bl1) | 0;
			hi = hi + Math.imul(ah3, bh1) | 0;
			lo = lo + Math.imul(al2, bl2) | 0;
			mid = mid + Math.imul(al2, bh2) | 0;
			mid = mid + Math.imul(ah2, bl2) | 0;
			hi = hi + Math.imul(ah2, bh2) | 0;
			lo = lo + Math.imul(al1, bl3) | 0;
			mid = mid + Math.imul(al1, bh3) | 0;
			mid = mid + Math.imul(ah1, bl3) | 0;
			hi = hi + Math.imul(ah1, bh3) | 0;
			lo = lo + Math.imul(al0, bl4) | 0;
			mid = mid + Math.imul(al0, bh4) | 0;
			mid = mid + Math.imul(ah0, bl4) | 0;
			hi = hi + Math.imul(ah0, bh4) | 0;
			var w4 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0;
			w4 &= 67108863;
			lo = Math.imul(al5, bl0);
			mid = Math.imul(al5, bh0);
			mid = mid + Math.imul(ah5, bl0) | 0;
			hi = Math.imul(ah5, bh0);
			lo = lo + Math.imul(al4, bl1) | 0;
			mid = mid + Math.imul(al4, bh1) | 0;
			mid = mid + Math.imul(ah4, bl1) | 0;
			hi = hi + Math.imul(ah4, bh1) | 0;
			lo = lo + Math.imul(al3, bl2) | 0;
			mid = mid + Math.imul(al3, bh2) | 0;
			mid = mid + Math.imul(ah3, bl2) | 0;
			hi = hi + Math.imul(ah3, bh2) | 0;
			lo = lo + Math.imul(al2, bl3) | 0;
			mid = mid + Math.imul(al2, bh3) | 0;
			mid = mid + Math.imul(ah2, bl3) | 0;
			hi = hi + Math.imul(ah2, bh3) | 0;
			lo = lo + Math.imul(al1, bl4) | 0;
			mid = mid + Math.imul(al1, bh4) | 0;
			mid = mid + Math.imul(ah1, bl4) | 0;
			hi = hi + Math.imul(ah1, bh4) | 0;
			lo = lo + Math.imul(al0, bl5) | 0;
			mid = mid + Math.imul(al0, bh5) | 0;
			mid = mid + Math.imul(ah0, bl5) | 0;
			hi = hi + Math.imul(ah0, bh5) | 0;
			var w5 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0;
			w5 &= 67108863;
			lo = Math.imul(al6, bl0);
			mid = Math.imul(al6, bh0);
			mid = mid + Math.imul(ah6, bl0) | 0;
			hi = Math.imul(ah6, bh0);
			lo = lo + Math.imul(al5, bl1) | 0;
			mid = mid + Math.imul(al5, bh1) | 0;
			mid = mid + Math.imul(ah5, bl1) | 0;
			hi = hi + Math.imul(ah5, bh1) | 0;
			lo = lo + Math.imul(al4, bl2) | 0;
			mid = mid + Math.imul(al4, bh2) | 0;
			mid = mid + Math.imul(ah4, bl2) | 0;
			hi = hi + Math.imul(ah4, bh2) | 0;
			lo = lo + Math.imul(al3, bl3) | 0;
			mid = mid + Math.imul(al3, bh3) | 0;
			mid = mid + Math.imul(ah3, bl3) | 0;
			hi = hi + Math.imul(ah3, bh3) | 0;
			lo = lo + Math.imul(al2, bl4) | 0;
			mid = mid + Math.imul(al2, bh4) | 0;
			mid = mid + Math.imul(ah2, bl4) | 0;
			hi = hi + Math.imul(ah2, bh4) | 0;
			lo = lo + Math.imul(al1, bl5) | 0;
			mid = mid + Math.imul(al1, bh5) | 0;
			mid = mid + Math.imul(ah1, bl5) | 0;
			hi = hi + Math.imul(ah1, bh5) | 0;
			lo = lo + Math.imul(al0, bl6) | 0;
			mid = mid + Math.imul(al0, bh6) | 0;
			mid = mid + Math.imul(ah0, bl6) | 0;
			hi = hi + Math.imul(ah0, bh6) | 0;
			var w6 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0;
			w6 &= 67108863;
			lo = Math.imul(al7, bl0);
			mid = Math.imul(al7, bh0);
			mid = mid + Math.imul(ah7, bl0) | 0;
			hi = Math.imul(ah7, bh0);
			lo = lo + Math.imul(al6, bl1) | 0;
			mid = mid + Math.imul(al6, bh1) | 0;
			mid = mid + Math.imul(ah6, bl1) | 0;
			hi = hi + Math.imul(ah6, bh1) | 0;
			lo = lo + Math.imul(al5, bl2) | 0;
			mid = mid + Math.imul(al5, bh2) | 0;
			mid = mid + Math.imul(ah5, bl2) | 0;
			hi = hi + Math.imul(ah5, bh2) | 0;
			lo = lo + Math.imul(al4, bl3) | 0;
			mid = mid + Math.imul(al4, bh3) | 0;
			mid = mid + Math.imul(ah4, bl3) | 0;
			hi = hi + Math.imul(ah4, bh3) | 0;
			lo = lo + Math.imul(al3, bl4) | 0;
			mid = mid + Math.imul(al3, bh4) | 0;
			mid = mid + Math.imul(ah3, bl4) | 0;
			hi = hi + Math.imul(ah3, bh4) | 0;
			lo = lo + Math.imul(al2, bl5) | 0;
			mid = mid + Math.imul(al2, bh5) | 0;
			mid = mid + Math.imul(ah2, bl5) | 0;
			hi = hi + Math.imul(ah2, bh5) | 0;
			lo = lo + Math.imul(al1, bl6) | 0;
			mid = mid + Math.imul(al1, bh6) | 0;
			mid = mid + Math.imul(ah1, bl6) | 0;
			hi = hi + Math.imul(ah1, bh6) | 0;
			lo = lo + Math.imul(al0, bl7) | 0;
			mid = mid + Math.imul(al0, bh7) | 0;
			mid = mid + Math.imul(ah0, bl7) | 0;
			hi = hi + Math.imul(ah0, bh7) | 0;
			var w7 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0;
			w7 &= 67108863;
			lo = Math.imul(al8, bl0);
			mid = Math.imul(al8, bh0);
			mid = mid + Math.imul(ah8, bl0) | 0;
			hi = Math.imul(ah8, bh0);
			lo = lo + Math.imul(al7, bl1) | 0;
			mid = mid + Math.imul(al7, bh1) | 0;
			mid = mid + Math.imul(ah7, bl1) | 0;
			hi = hi + Math.imul(ah7, bh1) | 0;
			lo = lo + Math.imul(al6, bl2) | 0;
			mid = mid + Math.imul(al6, bh2) | 0;
			mid = mid + Math.imul(ah6, bl2) | 0;
			hi = hi + Math.imul(ah6, bh2) | 0;
			lo = lo + Math.imul(al5, bl3) | 0;
			mid = mid + Math.imul(al5, bh3) | 0;
			mid = mid + Math.imul(ah5, bl3) | 0;
			hi = hi + Math.imul(ah5, bh3) | 0;
			lo = lo + Math.imul(al4, bl4) | 0;
			mid = mid + Math.imul(al4, bh4) | 0;
			mid = mid + Math.imul(ah4, bl4) | 0;
			hi = hi + Math.imul(ah4, bh4) | 0;
			lo = lo + Math.imul(al3, bl5) | 0;
			mid = mid + Math.imul(al3, bh5) | 0;
			mid = mid + Math.imul(ah3, bl5) | 0;
			hi = hi + Math.imul(ah3, bh5) | 0;
			lo = lo + Math.imul(al2, bl6) | 0;
			mid = mid + Math.imul(al2, bh6) | 0;
			mid = mid + Math.imul(ah2, bl6) | 0;
			hi = hi + Math.imul(ah2, bh6) | 0;
			lo = lo + Math.imul(al1, bl7) | 0;
			mid = mid + Math.imul(al1, bh7) | 0;
			mid = mid + Math.imul(ah1, bl7) | 0;
			hi = hi + Math.imul(ah1, bh7) | 0;
			lo = lo + Math.imul(al0, bl8) | 0;
			mid = mid + Math.imul(al0, bh8) | 0;
			mid = mid + Math.imul(ah0, bl8) | 0;
			hi = hi + Math.imul(ah0, bh8) | 0;
			var w8 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0;
			w8 &= 67108863;
			lo = Math.imul(al9, bl0);
			mid = Math.imul(al9, bh0);
			mid = mid + Math.imul(ah9, bl0) | 0;
			hi = Math.imul(ah9, bh0);
			lo = lo + Math.imul(al8, bl1) | 0;
			mid = mid + Math.imul(al8, bh1) | 0;
			mid = mid + Math.imul(ah8, bl1) | 0;
			hi = hi + Math.imul(ah8, bh1) | 0;
			lo = lo + Math.imul(al7, bl2) | 0;
			mid = mid + Math.imul(al7, bh2) | 0;
			mid = mid + Math.imul(ah7, bl2) | 0;
			hi = hi + Math.imul(ah7, bh2) | 0;
			lo = lo + Math.imul(al6, bl3) | 0;
			mid = mid + Math.imul(al6, bh3) | 0;
			mid = mid + Math.imul(ah6, bl3) | 0;
			hi = hi + Math.imul(ah6, bh3) | 0;
			lo = lo + Math.imul(al5, bl4) | 0;
			mid = mid + Math.imul(al5, bh4) | 0;
			mid = mid + Math.imul(ah5, bl4) | 0;
			hi = hi + Math.imul(ah5, bh4) | 0;
			lo = lo + Math.imul(al4, bl5) | 0;
			mid = mid + Math.imul(al4, bh5) | 0;
			mid = mid + Math.imul(ah4, bl5) | 0;
			hi = hi + Math.imul(ah4, bh5) | 0;
			lo = lo + Math.imul(al3, bl6) | 0;
			mid = mid + Math.imul(al3, bh6) | 0;
			mid = mid + Math.imul(ah3, bl6) | 0;
			hi = hi + Math.imul(ah3, bh6) | 0;
			lo = lo + Math.imul(al2, bl7) | 0;
			mid = mid + Math.imul(al2, bh7) | 0;
			mid = mid + Math.imul(ah2, bl7) | 0;
			hi = hi + Math.imul(ah2, bh7) | 0;
			lo = lo + Math.imul(al1, bl8) | 0;
			mid = mid + Math.imul(al1, bh8) | 0;
			mid = mid + Math.imul(ah1, bl8) | 0;
			hi = hi + Math.imul(ah1, bh8) | 0;
			lo = lo + Math.imul(al0, bl9) | 0;
			mid = mid + Math.imul(al0, bh9) | 0;
			mid = mid + Math.imul(ah0, bl9) | 0;
			hi = hi + Math.imul(ah0, bh9) | 0;
			var w9 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0;
			w9 &= 67108863;
			lo = Math.imul(al9, bl1);
			mid = Math.imul(al9, bh1);
			mid = mid + Math.imul(ah9, bl1) | 0;
			hi = Math.imul(ah9, bh1);
			lo = lo + Math.imul(al8, bl2) | 0;
			mid = mid + Math.imul(al8, bh2) | 0;
			mid = mid + Math.imul(ah8, bl2) | 0;
			hi = hi + Math.imul(ah8, bh2) | 0;
			lo = lo + Math.imul(al7, bl3) | 0;
			mid = mid + Math.imul(al7, bh3) | 0;
			mid = mid + Math.imul(ah7, bl3) | 0;
			hi = hi + Math.imul(ah7, bh3) | 0;
			lo = lo + Math.imul(al6, bl4) | 0;
			mid = mid + Math.imul(al6, bh4) | 0;
			mid = mid + Math.imul(ah6, bl4) | 0;
			hi = hi + Math.imul(ah6, bh4) | 0;
			lo = lo + Math.imul(al5, bl5) | 0;
			mid = mid + Math.imul(al5, bh5) | 0;
			mid = mid + Math.imul(ah5, bl5) | 0;
			hi = hi + Math.imul(ah5, bh5) | 0;
			lo = lo + Math.imul(al4, bl6) | 0;
			mid = mid + Math.imul(al4, bh6) | 0;
			mid = mid + Math.imul(ah4, bl6) | 0;
			hi = hi + Math.imul(ah4, bh6) | 0;
			lo = lo + Math.imul(al3, bl7) | 0;
			mid = mid + Math.imul(al3, bh7) | 0;
			mid = mid + Math.imul(ah3, bl7) | 0;
			hi = hi + Math.imul(ah3, bh7) | 0;
			lo = lo + Math.imul(al2, bl8) | 0;
			mid = mid + Math.imul(al2, bh8) | 0;
			mid = mid + Math.imul(ah2, bl8) | 0;
			hi = hi + Math.imul(ah2, bh8) | 0;
			lo = lo + Math.imul(al1, bl9) | 0;
			mid = mid + Math.imul(al1, bh9) | 0;
			mid = mid + Math.imul(ah1, bl9) | 0;
			hi = hi + Math.imul(ah1, bh9) | 0;
			var w10 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0;
			w10 &= 67108863;
			lo = Math.imul(al9, bl2);
			mid = Math.imul(al9, bh2);
			mid = mid + Math.imul(ah9, bl2) | 0;
			hi = Math.imul(ah9, bh2);
			lo = lo + Math.imul(al8, bl3) | 0;
			mid = mid + Math.imul(al8, bh3) | 0;
			mid = mid + Math.imul(ah8, bl3) | 0;
			hi = hi + Math.imul(ah8, bh3) | 0;
			lo = lo + Math.imul(al7, bl4) | 0;
			mid = mid + Math.imul(al7, bh4) | 0;
			mid = mid + Math.imul(ah7, bl4) | 0;
			hi = hi + Math.imul(ah7, bh4) | 0;
			lo = lo + Math.imul(al6, bl5) | 0;
			mid = mid + Math.imul(al6, bh5) | 0;
			mid = mid + Math.imul(ah6, bl5) | 0;
			hi = hi + Math.imul(ah6, bh5) | 0;
			lo = lo + Math.imul(al5, bl6) | 0;
			mid = mid + Math.imul(al5, bh6) | 0;
			mid = mid + Math.imul(ah5, bl6) | 0;
			hi = hi + Math.imul(ah5, bh6) | 0;
			lo = lo + Math.imul(al4, bl7) | 0;
			mid = mid + Math.imul(al4, bh7) | 0;
			mid = mid + Math.imul(ah4, bl7) | 0;
			hi = hi + Math.imul(ah4, bh7) | 0;
			lo = lo + Math.imul(al3, bl8) | 0;
			mid = mid + Math.imul(al3, bh8) | 0;
			mid = mid + Math.imul(ah3, bl8) | 0;
			hi = hi + Math.imul(ah3, bh8) | 0;
			lo = lo + Math.imul(al2, bl9) | 0;
			mid = mid + Math.imul(al2, bh9) | 0;
			mid = mid + Math.imul(ah2, bl9) | 0;
			hi = hi + Math.imul(ah2, bh9) | 0;
			var w11 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0;
			w11 &= 67108863;
			lo = Math.imul(al9, bl3);
			mid = Math.imul(al9, bh3);
			mid = mid + Math.imul(ah9, bl3) | 0;
			hi = Math.imul(ah9, bh3);
			lo = lo + Math.imul(al8, bl4) | 0;
			mid = mid + Math.imul(al8, bh4) | 0;
			mid = mid + Math.imul(ah8, bl4) | 0;
			hi = hi + Math.imul(ah8, bh4) | 0;
			lo = lo + Math.imul(al7, bl5) | 0;
			mid = mid + Math.imul(al7, bh5) | 0;
			mid = mid + Math.imul(ah7, bl5) | 0;
			hi = hi + Math.imul(ah7, bh5) | 0;
			lo = lo + Math.imul(al6, bl6) | 0;
			mid = mid + Math.imul(al6, bh6) | 0;
			mid = mid + Math.imul(ah6, bl6) | 0;
			hi = hi + Math.imul(ah6, bh6) | 0;
			lo = lo + Math.imul(al5, bl7) | 0;
			mid = mid + Math.imul(al5, bh7) | 0;
			mid = mid + Math.imul(ah5, bl7) | 0;
			hi = hi + Math.imul(ah5, bh7) | 0;
			lo = lo + Math.imul(al4, bl8) | 0;
			mid = mid + Math.imul(al4, bh8) | 0;
			mid = mid + Math.imul(ah4, bl8) | 0;
			hi = hi + Math.imul(ah4, bh8) | 0;
			lo = lo + Math.imul(al3, bl9) | 0;
			mid = mid + Math.imul(al3, bh9) | 0;
			mid = mid + Math.imul(ah3, bl9) | 0;
			hi = hi + Math.imul(ah3, bh9) | 0;
			var w12 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0;
			w12 &= 67108863;
			lo = Math.imul(al9, bl4);
			mid = Math.imul(al9, bh4);
			mid = mid + Math.imul(ah9, bl4) | 0;
			hi = Math.imul(ah9, bh4);
			lo = lo + Math.imul(al8, bl5) | 0;
			mid = mid + Math.imul(al8, bh5) | 0;
			mid = mid + Math.imul(ah8, bl5) | 0;
			hi = hi + Math.imul(ah8, bh5) | 0;
			lo = lo + Math.imul(al7, bl6) | 0;
			mid = mid + Math.imul(al7, bh6) | 0;
			mid = mid + Math.imul(ah7, bl6) | 0;
			hi = hi + Math.imul(ah7, bh6) | 0;
			lo = lo + Math.imul(al6, bl7) | 0;
			mid = mid + Math.imul(al6, bh7) | 0;
			mid = mid + Math.imul(ah6, bl7) | 0;
			hi = hi + Math.imul(ah6, bh7) | 0;
			lo = lo + Math.imul(al5, bl8) | 0;
			mid = mid + Math.imul(al5, bh8) | 0;
			mid = mid + Math.imul(ah5, bl8) | 0;
			hi = hi + Math.imul(ah5, bh8) | 0;
			lo = lo + Math.imul(al4, bl9) | 0;
			mid = mid + Math.imul(al4, bh9) | 0;
			mid = mid + Math.imul(ah4, bl9) | 0;
			hi = hi + Math.imul(ah4, bh9) | 0;
			var w13 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0;
			w13 &= 67108863;
			lo = Math.imul(al9, bl5);
			mid = Math.imul(al9, bh5);
			mid = mid + Math.imul(ah9, bl5) | 0;
			hi = Math.imul(ah9, bh5);
			lo = lo + Math.imul(al8, bl6) | 0;
			mid = mid + Math.imul(al8, bh6) | 0;
			mid = mid + Math.imul(ah8, bl6) | 0;
			hi = hi + Math.imul(ah8, bh6) | 0;
			lo = lo + Math.imul(al7, bl7) | 0;
			mid = mid + Math.imul(al7, bh7) | 0;
			mid = mid + Math.imul(ah7, bl7) | 0;
			hi = hi + Math.imul(ah7, bh7) | 0;
			lo = lo + Math.imul(al6, bl8) | 0;
			mid = mid + Math.imul(al6, bh8) | 0;
			mid = mid + Math.imul(ah6, bl8) | 0;
			hi = hi + Math.imul(ah6, bh8) | 0;
			lo = lo + Math.imul(al5, bl9) | 0;
			mid = mid + Math.imul(al5, bh9) | 0;
			mid = mid + Math.imul(ah5, bl9) | 0;
			hi = hi + Math.imul(ah5, bh9) | 0;
			var w14 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0;
			w14 &= 67108863;
			lo = Math.imul(al9, bl6);
			mid = Math.imul(al9, bh6);
			mid = mid + Math.imul(ah9, bl6) | 0;
			hi = Math.imul(ah9, bh6);
			lo = lo + Math.imul(al8, bl7) | 0;
			mid = mid + Math.imul(al8, bh7) | 0;
			mid = mid + Math.imul(ah8, bl7) | 0;
			hi = hi + Math.imul(ah8, bh7) | 0;
			lo = lo + Math.imul(al7, bl8) | 0;
			mid = mid + Math.imul(al7, bh8) | 0;
			mid = mid + Math.imul(ah7, bl8) | 0;
			hi = hi + Math.imul(ah7, bh8) | 0;
			lo = lo + Math.imul(al6, bl9) | 0;
			mid = mid + Math.imul(al6, bh9) | 0;
			mid = mid + Math.imul(ah6, bl9) | 0;
			hi = hi + Math.imul(ah6, bh9) | 0;
			var w15 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0;
			w15 &= 67108863;
			lo = Math.imul(al9, bl7);
			mid = Math.imul(al9, bh7);
			mid = mid + Math.imul(ah9, bl7) | 0;
			hi = Math.imul(ah9, bh7);
			lo = lo + Math.imul(al8, bl8) | 0;
			mid = mid + Math.imul(al8, bh8) | 0;
			mid = mid + Math.imul(ah8, bl8) | 0;
			hi = hi + Math.imul(ah8, bh8) | 0;
			lo = lo + Math.imul(al7, bl9) | 0;
			mid = mid + Math.imul(al7, bh9) | 0;
			mid = mid + Math.imul(ah7, bl9) | 0;
			hi = hi + Math.imul(ah7, bh9) | 0;
			var w16 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0;
			w16 &= 67108863;
			lo = Math.imul(al9, bl8);
			mid = Math.imul(al9, bh8);
			mid = mid + Math.imul(ah9, bl8) | 0;
			hi = Math.imul(ah9, bh8);
			lo = lo + Math.imul(al8, bl9) | 0;
			mid = mid + Math.imul(al8, bh9) | 0;
			mid = mid + Math.imul(ah8, bl9) | 0;
			hi = hi + Math.imul(ah8, bh9) | 0;
			var w17 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0;
			w17 &= 67108863;
			lo = Math.imul(al9, bl9);
			mid = Math.imul(al9, bh9);
			mid = mid + Math.imul(ah9, bl9) | 0;
			hi = Math.imul(ah9, bh9);
			var w18 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
			c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0;
			w18 &= 67108863;
			o[0] = w0;
			o[1] = w1;
			o[2] = w2;
			o[3] = w3;
			o[4] = w4;
			o[5] = w5;
			o[6] = w6;
			o[7] = w7;
			o[8] = w8;
			o[9] = w9;
			o[10] = w10;
			o[11] = w11;
			o[12] = w12;
			o[13] = w13;
			o[14] = w14;
			o[15] = w15;
			o[16] = w16;
			o[17] = w17;
			o[18] = w18;
			if (c !== 0) {
				o[19] = c;
				out.length++;
			}
			return out;
		};
		if (!Math.imul) comb10MulTo = smallMulTo;
		function bigMulTo(self, num, out) {
			out.negative = num.negative ^ self.negative;
			out.length = self.length + num.length;
			var carry = 0;
			var hncarry = 0;
			for (var k = 0; k < out.length - 1; k++) {
				var ncarry = hncarry;
				hncarry = 0;
				var rword = carry & 67108863;
				var maxJ = Math.min(k, num.length - 1);
				for (var j = Math.max(0, k - self.length + 1); j <= maxJ; j++) {
					var i = k - j;
					var r = (self.words[i] | 0) * (num.words[j] | 0);
					var lo = r & 67108863;
					ncarry = ncarry + (r / 67108864 | 0) | 0;
					lo = lo + rword | 0;
					rword = lo & 67108863;
					ncarry = ncarry + (lo >>> 26) | 0;
					hncarry += ncarry >>> 26;
					ncarry &= 67108863;
				}
				out.words[k] = rword;
				carry = ncarry;
				ncarry = hncarry;
			}
			if (carry !== 0) out.words[k] = carry;
			else out.length--;
			return out._strip();
		}
		function jumboMulTo(self, num, out) {
			return bigMulTo(self, num, out);
		}
		BN.prototype.mulTo = function mulTo(num, out) {
			var res;
			var len = this.length + num.length;
			if (this.length === 10 && num.length === 10) res = comb10MulTo(this, num, out);
			else if (len < 63) res = smallMulTo(this, num, out);
			else if (len < 1024) res = bigMulTo(this, num, out);
			else res = jumboMulTo(this, num, out);
			return res;
		};
		function FFTM(x, y) {
			this.x = x;
			this.y = y;
		}
		FFTM.prototype.makeRBT = function makeRBT(N) {
			var t = new Array(N);
			var l = BN.prototype._countBits(N) - 1;
			for (var i = 0; i < N; i++) t[i] = this.revBin(i, l, N);
			return t;
		};
		FFTM.prototype.revBin = function revBin(x, l, N) {
			if (x === 0 || x === N - 1) return x;
			var rb = 0;
			for (var i = 0; i < l; i++) {
				rb |= (x & 1) << l - i - 1;
				x >>= 1;
			}
			return rb;
		};
		FFTM.prototype.permute = function permute(rbt, rws, iws, rtws, itws, N) {
			for (var i = 0; i < N; i++) {
				rtws[i] = rws[rbt[i]];
				itws[i] = iws[rbt[i]];
			}
		};
		FFTM.prototype.transform = function transform(rws, iws, rtws, itws, N, rbt) {
			this.permute(rbt, rws, iws, rtws, itws, N);
			for (var s = 1; s < N; s <<= 1) {
				var l = s << 1;
				var rtwdf = Math.cos(2 * Math.PI / l);
				var itwdf = Math.sin(2 * Math.PI / l);
				for (var p = 0; p < N; p += l) {
					var rtwdf_ = rtwdf;
					var itwdf_ = itwdf;
					for (var j = 0; j < s; j++) {
						var re = rtws[p + j];
						var ie = itws[p + j];
						var ro = rtws[p + j + s];
						var io = itws[p + j + s];
						var rx = rtwdf_ * ro - itwdf_ * io;
						io = rtwdf_ * io + itwdf_ * ro;
						ro = rx;
						rtws[p + j] = re + ro;
						itws[p + j] = ie + io;
						rtws[p + j + s] = re - ro;
						itws[p + j + s] = ie - io;
						if (j !== l) {
							rx = rtwdf * rtwdf_ - itwdf * itwdf_;
							itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_;
							rtwdf_ = rx;
						}
					}
				}
			}
		};
		FFTM.prototype.guessLen13b = function guessLen13b(n, m) {
			var N = Math.max(m, n) | 1;
			var odd = N & 1;
			var i = 0;
			for (N = N / 2 | 0; N; N = N >>> 1) i++;
			return 1 << i + 1 + odd;
		};
		FFTM.prototype.conjugate = function conjugate(rws, iws, N) {
			if (N <= 1) return;
			for (var i = 0; i < N / 2; i++) {
				var t = rws[i];
				rws[i] = rws[N - i - 1];
				rws[N - i - 1] = t;
				t = iws[i];
				iws[i] = -iws[N - i - 1];
				iws[N - i - 1] = -t;
			}
		};
		FFTM.prototype.normalize13b = function normalize13b(ws, N) {
			var carry = 0;
			for (var i = 0; i < N / 2; i++) {
				var w = Math.round(ws[2 * i + 1] / N) * 8192 + Math.round(ws[2 * i] / N) + carry;
				ws[i] = w & 67108863;
				if (w < 67108864) carry = 0;
				else carry = w / 67108864 | 0;
			}
			return ws;
		};
		FFTM.prototype.convert13b = function convert13b(ws, len, rws, N) {
			var carry = 0;
			for (var i = 0; i < len; i++) {
				carry = carry + (ws[i] | 0);
				rws[2 * i] = carry & 8191;
				carry = carry >>> 13;
				rws[2 * i + 1] = carry & 8191;
				carry = carry >>> 13;
			}
			for (i = 2 * len; i < N; ++i) rws[i] = 0;
			assert(carry === 0);
			assert((carry & -8192) === 0);
		};
		FFTM.prototype.stub = function stub(N) {
			var ph = new Array(N);
			for (var i = 0; i < N; i++) ph[i] = 0;
			return ph;
		};
		FFTM.prototype.mulp = function mulp(x, y, out) {
			var N = 2 * this.guessLen13b(x.length, y.length);
			var rbt = this.makeRBT(N);
			var _ = this.stub(N);
			var rws = new Array(N);
			var rwst = new Array(N);
			var iwst = new Array(N);
			var nrws = new Array(N);
			var nrwst = new Array(N);
			var niwst = new Array(N);
			var rmws = out.words;
			rmws.length = N;
			this.convert13b(x.words, x.length, rws, N);
			this.convert13b(y.words, y.length, nrws, N);
			this.transform(rws, _, rwst, iwst, N, rbt);
			this.transform(nrws, _, nrwst, niwst, N, rbt);
			for (var i = 0; i < N; i++) {
				var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
				iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i];
				rwst[i] = rx;
			}
			this.conjugate(rwst, iwst, N);
			this.transform(rwst, iwst, rmws, _, N, rbt);
			this.conjugate(rmws, _, N);
			this.normalize13b(rmws, N);
			out.negative = x.negative ^ y.negative;
			out.length = x.length + y.length;
			return out._strip();
		};
		BN.prototype.mul = function mul(num) {
			var out = new BN(null);
			out.words = new Array(this.length + num.length);
			return this.mulTo(num, out);
		};
		BN.prototype.mulf = function mulf(num) {
			var out = new BN(null);
			out.words = new Array(this.length + num.length);
			return jumboMulTo(this, num, out);
		};
		BN.prototype.imul = function imul(num) {
			return this.clone().mulTo(num, this);
		};
		BN.prototype.imuln = function imuln(num) {
			var isNegNum = num < 0;
			if (isNegNum) num = -num;
			assert(typeof num === "number");
			assert(num < 67108864);
			var carry = 0;
			for (var i = 0; i < this.length; i++) {
				var w = (this.words[i] | 0) * num;
				var lo = (w & 67108863) + (carry & 67108863);
				carry >>= 26;
				carry += w / 67108864 | 0;
				carry += lo >>> 26;
				this.words[i] = lo & 67108863;
			}
			if (carry !== 0) {
				this.words[i] = carry;
				this.length++;
			}
			if (num === 0) {
				this.length = 1;
				this._normSign();
			}
			return isNegNum ? this.ineg() : this;
		};
		BN.prototype.muln = function muln(num) {
			return this.clone().imuln(num);
		};
		BN.prototype.sqr = function sqr() {
			return this.mul(this);
		};
		BN.prototype.isqr = function isqr() {
			return this.imul(this.clone());
		};
		BN.prototype.pow = function pow(num) {
			var w = toBitArray(num);
			if (w.length === 0) return new BN(1);
			var res = this;
			for (var i = 0; i < w.length; i++, res = res.sqr()) if (w[i] !== 0) break;
			if (++i < w.length) for (var q = res.sqr(); i < w.length; i++, q = q.sqr()) {
				if (w[i] === 0) continue;
				res = res.mul(q);
			}
			return res;
		};
		BN.prototype.iushln = function iushln(bits) {
			assert(typeof bits === "number" && bits >= 0);
			var r = bits % 26;
			var s = (bits - r) / 26;
			var carryMask = 67108863 >>> 26 - r << 26 - r;
			var i;
			if (r !== 0) {
				var carry = 0;
				for (i = 0; i < this.length; i++) {
					var newCarry = this.words[i] & carryMask;
					var c = (this.words[i] | 0) - newCarry << r;
					this.words[i] = c | carry;
					carry = newCarry >>> 26 - r;
				}
				if (carry) {
					this.words[i] = carry;
					this.length++;
				}
			}
			if (s !== 0) {
				for (i = this.length - 1; i >= 0; i--) this.words[i + s] = this.words[i];
				for (i = 0; i < s; i++) this.words[i] = 0;
				this.length += s;
			}
			return this._strip();
		};
		BN.prototype.ishln = function ishln(bits) {
			assert(this.negative === 0);
			return this.iushln(bits);
		};
		BN.prototype.iushrn = function iushrn(bits, hint, extended) {
			assert(typeof bits === "number" && bits >= 0);
			var h;
			if (hint) h = (hint - hint % 26) / 26;
			else h = 0;
			var r = bits % 26;
			var s = Math.min((bits - r) / 26, this.length);
			var mask = 67108863 ^ 67108863 >>> r << r;
			var maskedWords = extended;
			h -= s;
			h = Math.max(0, h);
			if (maskedWords) {
				for (var i = 0; i < s; i++) maskedWords.words[i] = this.words[i];
				maskedWords.length = s;
			}
			if (s === 0) {} else if (this.length > s) {
				this.length -= s;
				for (i = 0; i < this.length; i++) this.words[i] = this.words[i + s];
			} else {
				this.words[0] = 0;
				this.length = 1;
			}
			var carry = 0;
			for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
				var word = this.words[i] | 0;
				this.words[i] = carry << 26 - r | word >>> r;
				carry = word & mask;
			}
			if (maskedWords && carry !== 0) maskedWords.words[maskedWords.length++] = carry;
			if (this.length === 0) {
				this.words[0] = 0;
				this.length = 1;
			}
			return this._strip();
		};
		BN.prototype.ishrn = function ishrn(bits, hint, extended) {
			assert(this.negative === 0);
			return this.iushrn(bits, hint, extended);
		};
		BN.prototype.shln = function shln(bits) {
			return this.clone().ishln(bits);
		};
		BN.prototype.ushln = function ushln(bits) {
			return this.clone().iushln(bits);
		};
		BN.prototype.shrn = function shrn(bits) {
			return this.clone().ishrn(bits);
		};
		BN.prototype.ushrn = function ushrn(bits) {
			return this.clone().iushrn(bits);
		};
		BN.prototype.testn = function testn(bit) {
			assert(typeof bit === "number" && bit >= 0);
			var r = bit % 26;
			var s = (bit - r) / 26;
			var q = 1 << r;
			if (this.length <= s) return false;
			return !!(this.words[s] & q);
		};
		BN.prototype.imaskn = function imaskn(bits) {
			assert(typeof bits === "number" && bits >= 0);
			var r = bits % 26;
			var s = (bits - r) / 26;
			assert(this.negative === 0, "imaskn works only with positive numbers");
			if (this.length <= s) return this;
			if (r !== 0) s++;
			this.length = Math.min(s, this.length);
			if (r !== 0) {
				var mask = 67108863 ^ 67108863 >>> r << r;
				this.words[this.length - 1] &= mask;
			}
			if (this.length === 0) {
				this.words[0] = 0;
				this.length = 1;
			}
			return this._strip();
		};
		BN.prototype.maskn = function maskn(bits) {
			return this.clone().imaskn(bits);
		};
		BN.prototype.iaddn = function iaddn(num) {
			assert(typeof num === "number");
			assert(num < 67108864);
			if (num < 0) return this.isubn(-num);
			if (this.negative !== 0) {
				if (this.length === 1 && (this.words[0] | 0) <= num) {
					this.words[0] = num - (this.words[0] | 0);
					this.negative = 0;
					return this;
				}
				this.negative = 0;
				this.isubn(num);
				this.negative = 1;
				return this;
			}
			return this._iaddn(num);
		};
		BN.prototype._iaddn = function _iaddn(num) {
			this.words[0] += num;
			for (var i = 0; i < this.length && this.words[i] >= 67108864; i++) {
				this.words[i] -= 67108864;
				if (i === this.length - 1) this.words[i + 1] = 1;
				else this.words[i + 1]++;
			}
			this.length = Math.max(this.length, i + 1);
			return this;
		};
		BN.prototype.isubn = function isubn(num) {
			assert(typeof num === "number");
			assert(num < 67108864);
			if (num < 0) return this.iaddn(-num);
			if (this.negative !== 0) {
				this.negative = 0;
				this.iaddn(num);
				this.negative = 1;
				return this;
			}
			this.words[0] -= num;
			if (this.length === 1 && this.words[0] < 0) {
				this.words[0] = -this.words[0];
				this.negative = 1;
			} else for (var i = 0; i < this.length && this.words[i] < 0; i++) {
				this.words[i] += 67108864;
				this.words[i + 1] -= 1;
			}
			return this._strip();
		};
		BN.prototype.addn = function addn(num) {
			return this.clone().iaddn(num);
		};
		BN.prototype.subn = function subn(num) {
			return this.clone().isubn(num);
		};
		BN.prototype.iabs = function iabs() {
			this.negative = 0;
			return this;
		};
		BN.prototype.abs = function abs() {
			return this.clone().iabs();
		};
		BN.prototype._ishlnsubmul = function _ishlnsubmul(num, mul, shift) {
			var len = num.length + shift;
			var i;
			this._expand(len);
			var w;
			var carry = 0;
			for (i = 0; i < num.length; i++) {
				w = (this.words[i + shift] | 0) + carry;
				var right = (num.words[i] | 0) * mul;
				w -= right & 67108863;
				carry = (w >> 26) - (right / 67108864 | 0);
				this.words[i + shift] = w & 67108863;
			}
			for (; i < this.length - shift; i++) {
				w = (this.words[i + shift] | 0) + carry;
				carry = w >> 26;
				this.words[i + shift] = w & 67108863;
			}
			if (carry === 0) return this._strip();
			assert(carry === -1);
			carry = 0;
			for (i = 0; i < this.length; i++) {
				w = -(this.words[i] | 0) + carry;
				carry = w >> 26;
				this.words[i] = w & 67108863;
			}
			this.negative = 1;
			return this._strip();
		};
		BN.prototype._wordDiv = function _wordDiv(num, mode) {
			var shift = this.length - num.length;
			var a = this.clone();
			var b = num;
			var bhi = b.words[b.length - 1] | 0;
			shift = 26 - this._countBits(bhi);
			if (shift !== 0) {
				b = b.ushln(shift);
				a.iushln(shift);
				bhi = b.words[b.length - 1] | 0;
			}
			var m = a.length - b.length;
			var q;
			if (mode !== "mod") {
				q = new BN(null);
				q.length = m + 1;
				q.words = new Array(q.length);
				for (var i = 0; i < q.length; i++) q.words[i] = 0;
			}
			var diff = a.clone()._ishlnsubmul(b, 1, m);
			if (diff.negative === 0) {
				a = diff;
				if (q) q.words[m] = 1;
			}
			for (var j = m - 1; j >= 0; j--) {
				var qj = (a.words[b.length + j] | 0) * 67108864 + (a.words[b.length + j - 1] | 0);
				qj = Math.min(qj / bhi | 0, 67108863);
				a._ishlnsubmul(b, qj, j);
				while (a.negative !== 0) {
					qj--;
					a.negative = 0;
					a._ishlnsubmul(b, 1, j);
					if (!a.isZero()) a.negative ^= 1;
				}
				if (q) q.words[j] = qj;
			}
			if (q) q._strip();
			a._strip();
			if (mode !== "div" && shift !== 0) a.iushrn(shift);
			return {
				div: q || null,
				mod: a
			};
		};
		BN.prototype.divmod = function divmod(num, mode, positive) {
			assert(!num.isZero());
			if (this.isZero()) return {
				div: new BN(0),
				mod: new BN(0)
			};
			var div, mod, res;
			if (this.negative !== 0 && num.negative === 0) {
				res = this.neg().divmod(num, mode);
				if (mode !== "mod") div = res.div.neg();
				if (mode !== "div") {
					mod = res.mod.neg();
					if (positive && mod.negative !== 0) mod.iadd(num);
				}
				return {
					div,
					mod
				};
			}
			if (this.negative === 0 && num.negative !== 0) {
				res = this.divmod(num.neg(), mode);
				if (mode !== "mod") div = res.div.neg();
				return {
					div,
					mod: res.mod
				};
			}
			if ((this.negative & num.negative) !== 0) {
				res = this.neg().divmod(num.neg(), mode);
				if (mode !== "div") {
					mod = res.mod.neg();
					if (positive && mod.negative !== 0) mod.isub(num);
				}
				return {
					div: res.div,
					mod
				};
			}
			if (num.length > this.length || this.cmp(num) < 0) return {
				div: new BN(0),
				mod: this
			};
			if (num.length === 1) {
				if (mode === "div") return {
					div: this.divn(num.words[0]),
					mod: null
				};
				if (mode === "mod") return {
					div: null,
					mod: new BN(this.modrn(num.words[0]))
				};
				return {
					div: this.divn(num.words[0]),
					mod: new BN(this.modrn(num.words[0]))
				};
			}
			return this._wordDiv(num, mode);
		};
		BN.prototype.div = function div(num) {
			return this.divmod(num, "div", false).div;
		};
		BN.prototype.mod = function mod(num) {
			return this.divmod(num, "mod", false).mod;
		};
		BN.prototype.umod = function umod(num) {
			return this.divmod(num, "mod", true).mod;
		};
		BN.prototype.divRound = function divRound(num) {
			var dm = this.divmod(num);
			if (dm.mod.isZero()) return dm.div;
			var mod = dm.mod.abs();
			var half = num.abs().iushrn(1);
			var r2 = num.words[0] & 1;
			var cmp = mod.cmp(half);
			if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;
			var up = new BN(1);
			up.negative = this.negative ^ num.negative;
			return dm.div.iadd(up);
		};
		BN.prototype.modrn = function modrn(num) {
			var isNegNum = num < 0;
			if (isNegNum) num = -num;
			assert(num <= 67108863);
			var p = (1 << 26) % num;
			var acc = 0;
			for (var i = this.length - 1; i >= 0; i--) acc = (p * acc + (this.words[i] | 0)) % num;
			return isNegNum ? -acc : acc;
		};
		BN.prototype.modn = function modn(num) {
			return this.modrn(num);
		};
		BN.prototype.idivn = function idivn(num) {
			var isNegNum = num < 0;
			if (isNegNum) num = -num;
			assert(num <= 67108863);
			var carry = 0;
			for (var i = this.length - 1; i >= 0; i--) {
				var w = (this.words[i] | 0) + carry * 67108864;
				this.words[i] = w / num | 0;
				carry = w % num;
			}
			this._strip();
			return isNegNum ? this.ineg() : this;
		};
		BN.prototype.divn = function divn(num) {
			return this.clone().idivn(num);
		};
		BN.prototype.egcd = function egcd(p) {
			assert(p.negative === 0);
			assert(!p.isZero());
			var x = this;
			var y = p.clone();
			if (x.negative !== 0) x = x.umod(p);
			else x = x.clone();
			var A = new BN(1);
			var B = new BN(0);
			var C = new BN(0);
			var D = new BN(1);
			var g = 0;
			while (x.isEven() && y.isEven()) {
				x.iushrn(1);
				y.iushrn(1);
				++g;
			}
			var yp = y.clone();
			var xp = x.clone();
			while (!x.isZero()) {
				for (var i = 0, im = 1; (x.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
				if (i > 0) {
					x.iushrn(i);
					while (i-- > 0) {
						if (A.isOdd() || B.isOdd()) {
							A.iadd(yp);
							B.isub(xp);
						}
						A.iushrn(1);
						B.iushrn(1);
					}
				}
				for (var j = 0, jm = 1; (y.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
				if (j > 0) {
					y.iushrn(j);
					while (j-- > 0) {
						if (C.isOdd() || D.isOdd()) {
							C.iadd(yp);
							D.isub(xp);
						}
						C.iushrn(1);
						D.iushrn(1);
					}
				}
				if (x.cmp(y) >= 0) {
					x.isub(y);
					A.isub(C);
					B.isub(D);
				} else {
					y.isub(x);
					C.isub(A);
					D.isub(B);
				}
			}
			return {
				a: C,
				b: D,
				gcd: y.iushln(g)
			};
		};
		BN.prototype._invmp = function _invmp(p) {
			assert(p.negative === 0);
			assert(!p.isZero());
			var a = this;
			var b = p.clone();
			if (a.negative !== 0) a = a.umod(p);
			else a = a.clone();
			var x1 = new BN(1);
			var x2 = new BN(0);
			var delta = b.clone();
			while (a.cmpn(1) > 0 && b.cmpn(1) > 0) {
				for (var i = 0, im = 1; (a.words[0] & im) === 0 && i < 26; ++i, im <<= 1);
				if (i > 0) {
					a.iushrn(i);
					while (i-- > 0) {
						if (x1.isOdd()) x1.iadd(delta);
						x1.iushrn(1);
					}
				}
				for (var j = 0, jm = 1; (b.words[0] & jm) === 0 && j < 26; ++j, jm <<= 1);
				if (j > 0) {
					b.iushrn(j);
					while (j-- > 0) {
						if (x2.isOdd()) x2.iadd(delta);
						x2.iushrn(1);
					}
				}
				if (a.cmp(b) >= 0) {
					a.isub(b);
					x1.isub(x2);
				} else {
					b.isub(a);
					x2.isub(x1);
				}
			}
			var res;
			if (a.cmpn(1) === 0) res = x1;
			else res = x2;
			if (res.cmpn(0) < 0) res.iadd(p);
			return res;
		};
		BN.prototype.gcd = function gcd(num) {
			if (this.isZero()) return num.abs();
			if (num.isZero()) return this.abs();
			var a = this.clone();
			var b = num.clone();
			a.negative = 0;
			b.negative = 0;
			for (var shift = 0; a.isEven() && b.isEven(); shift++) {
				a.iushrn(1);
				b.iushrn(1);
			}
			do {
				while (a.isEven()) a.iushrn(1);
				while (b.isEven()) b.iushrn(1);
				var r = a.cmp(b);
				if (r < 0) {
					var t = a;
					a = b;
					b = t;
				} else if (r === 0 || b.cmpn(1) === 0) break;
				a.isub(b);
			} while (true);
			return b.iushln(shift);
		};
		BN.prototype.invm = function invm(num) {
			return this.egcd(num).a.umod(num);
		};
		BN.prototype.isEven = function isEven() {
			return (this.words[0] & 1) === 0;
		};
		BN.prototype.isOdd = function isOdd() {
			return (this.words[0] & 1) === 1;
		};
		BN.prototype.andln = function andln(num) {
			return this.words[0] & num;
		};
		BN.prototype.bincn = function bincn(bit) {
			assert(typeof bit === "number");
			var r = bit % 26;
			var s = (bit - r) / 26;
			var q = 1 << r;
			if (this.length <= s) {
				this._expand(s + 1);
				this.words[s] |= q;
				return this;
			}
			var carry = q;
			for (var i = s; carry !== 0 && i < this.length; i++) {
				var w = this.words[i] | 0;
				w += carry;
				carry = w >>> 26;
				w &= 67108863;
				this.words[i] = w;
			}
			if (carry !== 0) {
				this.words[i] = carry;
				this.length++;
			}
			return this;
		};
		BN.prototype.isZero = function isZero() {
			return this.length === 1 && this.words[0] === 0;
		};
		BN.prototype.cmpn = function cmpn(num) {
			var negative = num < 0;
			if (this.negative !== 0 && !negative) return -1;
			if (this.negative === 0 && negative) return 1;
			this._strip();
			var res;
			if (this.length > 1) res = 1;
			else {
				if (negative) num = -num;
				assert(num <= 67108863, "Number is too big");
				var w = this.words[0] | 0;
				res = w === num ? 0 : w < num ? -1 : 1;
			}
			if (this.negative !== 0) return -res | 0;
			return res;
		};
		BN.prototype.cmp = function cmp(num) {
			if (this.negative !== 0 && num.negative === 0) return -1;
			if (this.negative === 0 && num.negative !== 0) return 1;
			var res = this.ucmp(num);
			if (this.negative !== 0) return -res | 0;
			return res;
		};
		BN.prototype.ucmp = function ucmp(num) {
			if (this.length > num.length) return 1;
			if (this.length < num.length) return -1;
			var res = 0;
			for (var i = this.length - 1; i >= 0; i--) {
				var a = this.words[i] | 0;
				var b = num.words[i] | 0;
				if (a === b) continue;
				if (a < b) res = -1;
				else if (a > b) res = 1;
				break;
			}
			return res;
		};
		BN.prototype.gtn = function gtn(num) {
			return this.cmpn(num) === 1;
		};
		BN.prototype.gt = function gt(num) {
			return this.cmp(num) === 1;
		};
		BN.prototype.gten = function gten(num) {
			return this.cmpn(num) >= 0;
		};
		BN.prototype.gte = function gte(num) {
			return this.cmp(num) >= 0;
		};
		BN.prototype.ltn = function ltn(num) {
			return this.cmpn(num) === -1;
		};
		BN.prototype.lt = function lt(num) {
			return this.cmp(num) === -1;
		};
		BN.prototype.lten = function lten(num) {
			return this.cmpn(num) <= 0;
		};
		BN.prototype.lte = function lte(num) {
			return this.cmp(num) <= 0;
		};
		BN.prototype.eqn = function eqn(num) {
			return this.cmpn(num) === 0;
		};
		BN.prototype.eq = function eq(num) {
			return this.cmp(num) === 0;
		};
		BN.red = function red(num) {
			return new Red(num);
		};
		BN.prototype.toRed = function toRed(ctx) {
			assert(!this.red, "Already a number in reduction context");
			assert(this.negative === 0, "red works only with positives");
			return ctx.convertTo(this)._forceRed(ctx);
		};
		BN.prototype.fromRed = function fromRed() {
			assert(this.red, "fromRed works only with numbers in reduction context");
			return this.red.convertFrom(this);
		};
		BN.prototype._forceRed = function _forceRed(ctx) {
			this.red = ctx;
			return this;
		};
		BN.prototype.forceRed = function forceRed(ctx) {
			assert(!this.red, "Already a number in reduction context");
			return this._forceRed(ctx);
		};
		BN.prototype.redAdd = function redAdd(num) {
			assert(this.red, "redAdd works only with red numbers");
			return this.red.add(this, num);
		};
		BN.prototype.redIAdd = function redIAdd(num) {
			assert(this.red, "redIAdd works only with red numbers");
			return this.red.iadd(this, num);
		};
		BN.prototype.redSub = function redSub(num) {
			assert(this.red, "redSub works only with red numbers");
			return this.red.sub(this, num);
		};
		BN.prototype.redISub = function redISub(num) {
			assert(this.red, "redISub works only with red numbers");
			return this.red.isub(this, num);
		};
		BN.prototype.redShl = function redShl(num) {
			assert(this.red, "redShl works only with red numbers");
			return this.red.shl(this, num);
		};
		BN.prototype.redMul = function redMul(num) {
			assert(this.red, "redMul works only with red numbers");
			this.red._verify2(this, num);
			return this.red.mul(this, num);
		};
		BN.prototype.redIMul = function redIMul(num) {
			assert(this.red, "redMul works only with red numbers");
			this.red._verify2(this, num);
			return this.red.imul(this, num);
		};
		BN.prototype.redSqr = function redSqr() {
			assert(this.red, "redSqr works only with red numbers");
			this.red._verify1(this);
			return this.red.sqr(this);
		};
		BN.prototype.redISqr = function redISqr() {
			assert(this.red, "redISqr works only with red numbers");
			this.red._verify1(this);
			return this.red.isqr(this);
		};
		BN.prototype.redSqrt = function redSqrt() {
			assert(this.red, "redSqrt works only with red numbers");
			this.red._verify1(this);
			return this.red.sqrt(this);
		};
		BN.prototype.redInvm = function redInvm() {
			assert(this.red, "redInvm works only with red numbers");
			this.red._verify1(this);
			return this.red.invm(this);
		};
		BN.prototype.redNeg = function redNeg() {
			assert(this.red, "redNeg works only with red numbers");
			this.red._verify1(this);
			return this.red.neg(this);
		};
		BN.prototype.redPow = function redPow(num) {
			assert(this.red && !num.red, "redPow(normalNum)");
			this.red._verify1(this);
			return this.red.pow(this, num);
		};
		var primes = {
			k256: null,
			p224: null,
			p192: null,
			p25519: null
		};
		function MPrime(name, p) {
			this.name = name;
			this.p = new BN(p, 16);
			this.n = this.p.bitLength();
			this.k = new BN(1).iushln(this.n).isub(this.p);
			this.tmp = this._tmp();
		}
		MPrime.prototype._tmp = function _tmp() {
			var tmp = new BN(null);
			tmp.words = new Array(Math.ceil(this.n / 13));
			return tmp;
		};
		MPrime.prototype.ireduce = function ireduce(num) {
			var r = num;
			var rlen;
			do {
				this.split(r, this.tmp);
				r = this.imulK(r);
				r = r.iadd(this.tmp);
				rlen = r.bitLength();
			} while (rlen > this.n);
			var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
			if (cmp === 0) {
				r.words[0] = 0;
				r.length = 1;
			} else if (cmp > 0) r.isub(this.p);
			else if (r.strip !== void 0) r.strip();
			else r._strip();
			return r;
		};
		MPrime.prototype.split = function split(input, out) {
			input.iushrn(this.n, 0, out);
		};
		MPrime.prototype.imulK = function imulK(num) {
			return num.imul(this.k);
		};
		function K256() {
			MPrime.call(this, "k256", "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f");
		}
		inherits(K256, MPrime);
		K256.prototype.split = function split(input, output) {
			var mask = 4194303;
			var outLen = Math.min(input.length, 9);
			for (var i = 0; i < outLen; i++) output.words[i] = input.words[i];
			output.length = outLen;
			if (input.length <= 9) {
				input.words[0] = 0;
				input.length = 1;
				return;
			}
			var prev = input.words[9];
			output.words[output.length++] = prev & mask;
			for (i = 10; i < input.length; i++) {
				var next = input.words[i] | 0;
				input.words[i - 10] = (next & mask) << 4 | prev >>> 22;
				prev = next;
			}
			prev >>>= 22;
			input.words[i - 10] = prev;
			if (prev === 0 && input.length > 10) input.length -= 10;
			else input.length -= 9;
		};
		K256.prototype.imulK = function imulK(num) {
			num.words[num.length] = 0;
			num.words[num.length + 1] = 0;
			num.length += 2;
			var lo = 0;
			for (var i = 0; i < num.length; i++) {
				var w = num.words[i] | 0;
				lo += w * 977;
				num.words[i] = lo & 67108863;
				lo = w * 64 + (lo / 67108864 | 0);
			}
			if (num.words[num.length - 1] === 0) {
				num.length--;
				if (num.words[num.length - 1] === 0) num.length--;
			}
			return num;
		};
		function P224() {
			MPrime.call(this, "p224", "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001");
		}
		inherits(P224, MPrime);
		function P192() {
			MPrime.call(this, "p192", "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff");
		}
		inherits(P192, MPrime);
		function P25519() {
			MPrime.call(this, "25519", "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed");
		}
		inherits(P25519, MPrime);
		P25519.prototype.imulK = function imulK(num) {
			var carry = 0;
			for (var i = 0; i < num.length; i++) {
				var hi = (num.words[i] | 0) * 19 + carry;
				var lo = hi & 67108863;
				hi >>>= 26;
				num.words[i] = lo;
				carry = hi;
			}
			if (carry !== 0) num.words[num.length++] = carry;
			return num;
		};
		BN._prime = function prime(name) {
			if (primes[name]) return primes[name];
			var prime;
			if (name === "k256") prime = new K256();
			else if (name === "p224") prime = new P224();
			else if (name === "p192") prime = new P192();
			else if (name === "p25519") prime = new P25519();
			else throw new Error("Unknown prime " + name);
			primes[name] = prime;
			return prime;
		};
		function Red(m) {
			if (typeof m === "string") {
				var prime = BN._prime(m);
				this.m = prime.p;
				this.prime = prime;
			} else {
				assert(m.gtn(1), "modulus must be greater than 1");
				this.m = m;
				this.prime = null;
			}
		}
		Red.prototype._verify1 = function _verify1(a) {
			assert(a.negative === 0, "red works only with positives");
			assert(a.red, "red works only with red numbers");
		};
		Red.prototype._verify2 = function _verify2(a, b) {
			assert((a.negative | b.negative) === 0, "red works only with positives");
			assert(a.red && a.red === b.red, "red works only with red numbers");
		};
		Red.prototype.imod = function imod(a) {
			if (this.prime) return this.prime.ireduce(a)._forceRed(this);
			move(a, a.umod(this.m)._forceRed(this));
			return a;
		};
		Red.prototype.neg = function neg(a) {
			if (a.isZero()) return a.clone();
			return this.m.sub(a)._forceRed(this);
		};
		Red.prototype.add = function add(a, b) {
			this._verify2(a, b);
			var res = a.add(b);
			if (res.cmp(this.m) >= 0) res.isub(this.m);
			return res._forceRed(this);
		};
		Red.prototype.iadd = function iadd(a, b) {
			this._verify2(a, b);
			var res = a.iadd(b);
			if (res.cmp(this.m) >= 0) res.isub(this.m);
			return res;
		};
		Red.prototype.sub = function sub(a, b) {
			this._verify2(a, b);
			var res = a.sub(b);
			if (res.cmpn(0) < 0) res.iadd(this.m);
			return res._forceRed(this);
		};
		Red.prototype.isub = function isub(a, b) {
			this._verify2(a, b);
			var res = a.isub(b);
			if (res.cmpn(0) < 0) res.iadd(this.m);
			return res;
		};
		Red.prototype.shl = function shl(a, num) {
			this._verify1(a);
			return this.imod(a.ushln(num));
		};
		Red.prototype.imul = function imul(a, b) {
			this._verify2(a, b);
			return this.imod(a.imul(b));
		};
		Red.prototype.mul = function mul(a, b) {
			this._verify2(a, b);
			return this.imod(a.mul(b));
		};
		Red.prototype.isqr = function isqr(a) {
			return this.imul(a, a.clone());
		};
		Red.prototype.sqr = function sqr(a) {
			return this.mul(a, a);
		};
		Red.prototype.sqrt = function sqrt(a) {
			if (a.isZero()) return a.clone();
			var mod3 = this.m.andln(3);
			assert(mod3 % 2 === 1);
			if (mod3 === 3) {
				var pow = this.m.add(new BN(1)).iushrn(2);
				return this.pow(a, pow);
			}
			var q = this.m.subn(1);
			var s = 0;
			while (!q.isZero() && q.andln(1) === 0) {
				s++;
				q.iushrn(1);
			}
			assert(!q.isZero());
			var one = new BN(1).toRed(this);
			var nOne = one.redNeg();
			var lpow = this.m.subn(1).iushrn(1);
			var z = this.m.bitLength();
			z = new BN(2 * z * z).toRed(this);
			while (this.pow(z, lpow).cmp(nOne) !== 0) z.redIAdd(nOne);
			var c = this.pow(z, q);
			var r = this.pow(a, q.addn(1).iushrn(1));
			var t = this.pow(a, q);
			var m = s;
			while (t.cmp(one) !== 0) {
				var tmp = t;
				for (var i = 0; tmp.cmp(one) !== 0; i++) tmp = tmp.redSqr();
				assert(i < m);
				var b = this.pow(c, new BN(1).iushln(m - i - 1));
				r = r.redMul(b);
				c = b.redSqr();
				t = t.redMul(c);
				m = i;
			}
			return r;
		};
		Red.prototype.invm = function invm(a) {
			var inv = a._invmp(this.m);
			if (inv.negative !== 0) {
				inv.negative = 0;
				return this.imod(inv).redNeg();
			} else return this.imod(inv);
		};
		Red.prototype.pow = function pow(a, num) {
			if (num.isZero()) return new BN(1).toRed(this);
			if (num.cmpn(1) === 0) return a.clone();
			var windowSize = 4;
			var wnd = new Array(1 << windowSize);
			wnd[0] = new BN(1).toRed(this);
			wnd[1] = a;
			for (var i = 2; i < wnd.length; i++) wnd[i] = this.mul(wnd[i - 1], a);
			var res = wnd[0];
			var current = 0;
			var currentLen = 0;
			var start = num.bitLength() % 26;
			if (start === 0) start = 26;
			for (i = num.length - 1; i >= 0; i--) {
				var word = num.words[i];
				for (var j = start - 1; j >= 0; j--) {
					var bit = word >> j & 1;
					if (res !== wnd[0]) res = this.sqr(res);
					if (bit === 0 && current === 0) {
						currentLen = 0;
						continue;
					}
					current <<= 1;
					current |= bit;
					currentLen++;
					if (currentLen !== windowSize && (i !== 0 || j !== 0)) continue;
					res = this.mul(res, wnd[current]);
					currentLen = 0;
					current = 0;
				}
				start = 26;
			}
			return res;
		};
		Red.prototype.convertTo = function convertTo(num) {
			var r = num.umod(this.m);
			return r === num ? r.clone() : r;
		};
		Red.prototype.convertFrom = function convertFrom(num) {
			var res = num.clone();
			res.red = null;
			return res;
		};
		BN.mont = function mont(num) {
			return new Mont(num);
		};
		function Mont(m) {
			Red.call(this, m);
			this.shift = this.m.bitLength();
			if (this.shift % 26 !== 0) this.shift += 26 - this.shift % 26;
			this.r = new BN(1).iushln(this.shift);
			this.r2 = this.imod(this.r.sqr());
			this.rinv = this.r._invmp(this.m);
			this.minv = this.rinv.mul(this.r).isubn(1).div(this.m);
			this.minv = this.minv.umod(this.r);
			this.minv = this.r.sub(this.minv);
		}
		inherits(Mont, Red);
		Mont.prototype.convertTo = function convertTo(num) {
			return this.imod(num.ushln(this.shift));
		};
		Mont.prototype.convertFrom = function convertFrom(num) {
			var r = this.imod(num.mul(this.rinv));
			r.red = null;
			return r;
		};
		Mont.prototype.imul = function imul(a, b) {
			if (a.isZero() || b.isZero()) {
				a.words[0] = 0;
				a.length = 1;
				return a;
			}
			var t = a.imul(b);
			var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
			var u = t.isub(c).iushrn(this.shift);
			var res = u;
			if (u.cmp(this.m) >= 0) res = u.isub(this.m);
			else if (u.cmpn(0) < 0) res = u.iadd(this.m);
			return res._forceRed(this);
		};
		Mont.prototype.mul = function mul(a, b) {
			if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);
			var t = a.mul(b);
			var c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m);
			var u = t.isub(c).iushrn(this.shift);
			var res = u;
			if (u.cmp(this.m) >= 0) res = u.isub(this.m);
			else if (u.cmpn(0) < 0) res = u.iadd(this.m);
			return res._forceRed(this);
		};
		Mont.prototype.invm = function invm(a) {
			return this.imod(a._invmp(this.m).mul(this.r2))._forceRed(this);
		};
	})(typeof module === "undefined" || module, exports);
}));
//#endregion
//#region node_modules/safe-buffer/index.js
var require_safe_buffer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
	var buffer = __require("buffer");
	var Buffer = buffer.Buffer;
	function copyProps(src, dst) {
		for (var key in src) dst[key] = src[key];
	}
	if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) module.exports = buffer;
	else {
		copyProps(buffer, exports);
		exports.Buffer = SafeBuffer;
	}
	function SafeBuffer(arg, encodingOrOffset, length) {
		return Buffer(arg, encodingOrOffset, length);
	}
	SafeBuffer.prototype = Object.create(Buffer.prototype);
	copyProps(Buffer, SafeBuffer);
	SafeBuffer.from = function(arg, encodingOrOffset, length) {
		if (typeof arg === "number") throw new TypeError("Argument must not be a number");
		return Buffer(arg, encodingOrOffset, length);
	};
	SafeBuffer.alloc = function(size, fill, encoding) {
		if (typeof size !== "number") throw new TypeError("Argument must be a number");
		var buf = Buffer(size);
		if (fill !== void 0) {
			if (typeof encoding === "string") buf.fill(fill, encoding);
			else buf.fill(fill);
		} else buf.fill(0);
		return buf;
	};
	SafeBuffer.allocUnsafe = function(size) {
		if (typeof size !== "number") throw new TypeError("Argument must be a number");
		return Buffer(size);
	};
	SafeBuffer.allocUnsafeSlow = function(size) {
		if (typeof size !== "number") throw new TypeError("Argument must be a number");
		return buffer.SlowBuffer(size);
	};
}));
//#endregion
//#region node_modules/base-x/src/index.js
var require_src = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _Buffer = require_safe_buffer().Buffer;
	function base(ALPHABET) {
		if (ALPHABET.length >= 255) throw new TypeError("Alphabet too long");
		var BASE_MAP = /* @__PURE__ */ new Uint8Array(256);
		for (var j = 0; j < BASE_MAP.length; j++) BASE_MAP[j] = 255;
		for (var i = 0; i < ALPHABET.length; i++) {
			var x = ALPHABET.charAt(i);
			var xc = x.charCodeAt(0);
			if (BASE_MAP[xc] !== 255) throw new TypeError(x + " is ambiguous");
			BASE_MAP[xc] = i;
		}
		var BASE = ALPHABET.length;
		var LEADER = ALPHABET.charAt(0);
		var FACTOR = Math.log(BASE) / Math.log(256);
		var iFACTOR = Math.log(256) / Math.log(BASE);
		function encode(source) {
			if (Array.isArray(source) || source instanceof Uint8Array) source = _Buffer.from(source);
			if (!_Buffer.isBuffer(source)) throw new TypeError("Expected Buffer");
			if (source.length === 0) return "";
			var zeroes = 0;
			var length = 0;
			var pbegin = 0;
			var pend = source.length;
			while (pbegin !== pend && source[pbegin] === 0) {
				pbegin++;
				zeroes++;
			}
			var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
			var b58 = new Uint8Array(size);
			while (pbegin !== pend) {
				var carry = source[pbegin];
				var i = 0;
				for (var it1 = size - 1; (carry !== 0 || i < length) && it1 !== -1; it1--, i++) {
					carry += 256 * b58[it1] >>> 0;
					b58[it1] = carry % BASE >>> 0;
					carry = carry / BASE >>> 0;
				}
				if (carry !== 0) throw new Error("Non-zero carry");
				length = i;
				pbegin++;
			}
			var it2 = size - length;
			while (it2 !== size && b58[it2] === 0) it2++;
			var str = LEADER.repeat(zeroes);
			for (; it2 < size; ++it2) str += ALPHABET.charAt(b58[it2]);
			return str;
		}
		function decodeUnsafe(source) {
			if (typeof source !== "string") throw new TypeError("Expected String");
			if (source.length === 0) return _Buffer.alloc(0);
			var psz = 0;
			var zeroes = 0;
			var length = 0;
			while (source[psz] === LEADER) {
				zeroes++;
				psz++;
			}
			var size = (source.length - psz) * FACTOR + 1 >>> 0;
			var b256 = new Uint8Array(size);
			while (psz < source.length) {
				var charCode = source.charCodeAt(psz);
				if (charCode > 255) return;
				var carry = BASE_MAP[charCode];
				if (carry === 255) return;
				var i = 0;
				for (var it3 = size - 1; (carry !== 0 || i < length) && it3 !== -1; it3--, i++) {
					carry += BASE * b256[it3] >>> 0;
					b256[it3] = carry % 256 >>> 0;
					carry = carry / 256 >>> 0;
				}
				if (carry !== 0) throw new Error("Non-zero carry");
				length = i;
				psz++;
			}
			var it4 = size - length;
			while (it4 !== size && b256[it4] === 0) it4++;
			var vch = _Buffer.allocUnsafe(zeroes + (size - it4));
			vch.fill(0, 0, zeroes);
			var j = zeroes;
			while (it4 !== size) vch[j++] = b256[it4++];
			return vch;
		}
		function decode(string) {
			var buffer = decodeUnsafe(string);
			if (buffer) return buffer;
			throw new Error("Non-base" + BASE + " character");
		}
		return {
			encode,
			decodeUnsafe,
			decode
		};
	}
	module.exports = base;
}));
//#endregion
//#region node_modules/bs58/index.js
var require_bs58 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_src()("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");
}));
//#endregion
//#region node_modules/text-encoding-utf-8/src/encoding.js
var encoding_exports = /* @__PURE__ */ __exportAll({
	TextDecoder: () => TextDecoder$1,
	TextEncoder: () => TextEncoder
});
/**
* @param {number} a The number to test.
* @param {number} min The minimum value in the range, inclusive.
* @param {number} max The maximum value in the range, inclusive.
* @return {boolean} True if a >= min and a <= max.
*/
function inRange(a, min, max) {
	return min <= a && a <= max;
}
/**
* @param {*} o
* @return {Object}
*/
function ToDictionary(o) {
	if (o === void 0) return {};
	if (o === Object(o)) return o;
	throw TypeError("Could not convert argument to dictionary");
}
/**
* @param {string} string Input string of UTF-16 code units.
* @return {!Array.<number>} Code points.
*/
function stringToCodePoints(string) {
	var s = String(string);
	var n = s.length;
	var i = 0;
	var u = [];
	while (i < n) {
		var c = s.charCodeAt(i);
		if (c < 55296 || c > 57343) u.push(c);
		else if (56320 <= c && c <= 57343) u.push(65533);
		else if (55296 <= c && c <= 56319) {
			if (i === n - 1) u.push(65533);
			else {
				var d = string.charCodeAt(i + 1);
				if (56320 <= d && d <= 57343) {
					var a = c & 1023;
					var b = d & 1023;
					u.push(65536 + (a << 10) + b);
					i += 1;
				} else u.push(65533);
			}
		}
		i += 1;
	}
	return u;
}
/**
* @param {!Array.<number>} code_points Array of code points.
* @return {string} string String of UTF-16 code units.
*/
function codePointsToString(code_points) {
	var s = "";
	for (var i = 0; i < code_points.length; ++i) {
		var cp = code_points[i];
		if (cp <= 65535) s += String.fromCharCode(cp);
		else {
			cp -= 65536;
			s += String.fromCharCode((cp >> 10) + 55296, (cp & 1023) + 56320);
		}
	}
	return s;
}
/**
* A stream represents an ordered sequence of tokens.
*
* @constructor
* @param {!(Array.<number>|Uint8Array)} tokens Array of tokens that provide the
* stream.
*/
function Stream$1(tokens) {
	/** @type {!Array.<number>} */
	this.tokens = [].slice.call(tokens);
}
/**
* @param {boolean} fatal If true, decoding errors raise an exception.
* @param {number=} opt_code_point Override the standard fallback code point.
* @return {number} The code point to insert on a decoding error.
*/
function decoderError(fatal, opt_code_point) {
	if (fatal) throw TypeError("Decoder error");
	return opt_code_point || 65533;
}
/** @interface */
function Decoder() {}
/** @interface */
function Encoder() {}
/**
* @constructor
* @param {string=} encoding The label of the encoding;
*     defaults to 'utf-8'.
* @param {Object=} options
*/
function TextDecoder$1(encoding, options) {
	if (!(this instanceof TextDecoder$1)) return new TextDecoder$1(encoding, options);
	encoding = encoding !== void 0 ? String(encoding).toLowerCase() : DEFAULT_ENCODING;
	if (encoding !== DEFAULT_ENCODING) throw new Error("Encoding not supported. Only utf-8 is supported");
	options = ToDictionary(options);
	/** @private @type {boolean} */
	this._streaming = false;
	/** @private @type {boolean} */
	this._BOMseen = false;
	/** @private @type {?Decoder} */
	this._decoder = null;
	/** @private @type {boolean} */
	this._fatal = Boolean(options["fatal"]);
	/** @private @type {boolean} */
	this._ignoreBOM = Boolean(options["ignoreBOM"]);
	Object.defineProperty(this, "encoding", { value: "utf-8" });
	Object.defineProperty(this, "fatal", { value: this._fatal });
	Object.defineProperty(this, "ignoreBOM", { value: this._ignoreBOM });
}
/**
* @constructor
* @param {string=} encoding The label of the encoding;
*     defaults to 'utf-8'.
* @param {Object=} options
*/
function TextEncoder(encoding, options) {
	if (!(this instanceof TextEncoder)) return new TextEncoder(encoding, options);
	encoding = encoding !== void 0 ? String(encoding).toLowerCase() : DEFAULT_ENCODING;
	if (encoding !== DEFAULT_ENCODING) throw new Error("Encoding not supported. Only utf-8 is supported");
	options = ToDictionary(options);
	/** @private @type {boolean} */
	this._streaming = false;
	/** @private @type {?Encoder} */
	this._encoder = null;
	/** @private @type {{fatal: boolean}} */
	this._options = { fatal: Boolean(options["fatal"]) };
	Object.defineProperty(this, "encoding", { value: "utf-8" });
}
/**
* @constructor
* @implements {Decoder}
* @param {{fatal: boolean}} options
*/
function UTF8Decoder(options) {
	var fatal = options.fatal;
	var utf8_code_point = 0, utf8_bytes_seen = 0, utf8_bytes_needed = 0, utf8_lower_boundary = 128, utf8_upper_boundary = 191;
	/**
	* @param {Stream} stream The stream of bytes being decoded.
	* @param {number} bite The next byte read from the stream.
	* @return {?(number|!Array.<number>)} The next code point(s)
	*     decoded, or null if not enough data exists in the input
	*     stream to decode a complete code point.
	*/
	this.handler = function(stream, bite) {
		if (bite === end_of_stream && utf8_bytes_needed !== 0) {
			utf8_bytes_needed = 0;
			return decoderError(fatal);
		}
		if (bite === end_of_stream) return finished;
		if (utf8_bytes_needed === 0) {
			if (inRange(bite, 0, 127)) return bite;
			if (inRange(bite, 194, 223)) {
				utf8_bytes_needed = 1;
				utf8_code_point = bite - 192;
			} else if (inRange(bite, 224, 239)) {
				if (bite === 224) utf8_lower_boundary = 160;
				if (bite === 237) utf8_upper_boundary = 159;
				utf8_bytes_needed = 2;
				utf8_code_point = bite - 224;
			} else if (inRange(bite, 240, 244)) {
				if (bite === 240) utf8_lower_boundary = 144;
				if (bite === 244) utf8_upper_boundary = 143;
				utf8_bytes_needed = 3;
				utf8_code_point = bite - 240;
			} else return decoderError(fatal);
			utf8_code_point = utf8_code_point << 6 * utf8_bytes_needed;
			return null;
		}
		if (!inRange(bite, utf8_lower_boundary, utf8_upper_boundary)) {
			utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;
			utf8_lower_boundary = 128;
			utf8_upper_boundary = 191;
			stream.prepend(bite);
			return decoderError(fatal);
		}
		utf8_lower_boundary = 128;
		utf8_upper_boundary = 191;
		utf8_bytes_seen += 1;
		utf8_code_point += bite - 128 << 6 * (utf8_bytes_needed - utf8_bytes_seen);
		if (utf8_bytes_seen !== utf8_bytes_needed) return null;
		var code_point = utf8_code_point;
		utf8_code_point = utf8_bytes_needed = utf8_bytes_seen = 0;
		return code_point;
	};
}
/**
* @constructor
* @implements {Encoder}
* @param {{fatal: boolean}} options
*/
function UTF8Encoder(options) {
	options.fatal;
	/**
	* @param {Stream} stream Input stream.
	* @param {number} code_point Next code point read from the stream.
	* @return {(number|!Array.<number>)} Byte(s) to emit.
	*/
	this.handler = function(stream, code_point) {
		if (code_point === end_of_stream) return finished;
		if (inRange(code_point, 0, 127)) return code_point;
		var count, offset;
		if (inRange(code_point, 128, 2047)) {
			count = 1;
			offset = 192;
		} else if (inRange(code_point, 2048, 65535)) {
			count = 2;
			offset = 224;
		} else if (inRange(code_point, 65536, 1114111)) {
			count = 3;
			offset = 240;
		}
		var bytes = [(code_point >> 6 * count) + offset];
		while (count > 0) {
			var temp = code_point >> 6 * (count - 1);
			bytes.push(128 | temp & 63);
			count -= 1;
		}
		return bytes;
	};
}
var end_of_stream, finished, DEFAULT_ENCODING;
var init_encoding = __esmMin((() => {
	end_of_stream = -1;
	Stream$1.prototype = {
		/**
		* @return {boolean} True if end-of-stream has been hit.
		*/
		endOfStream: function() {
			return !this.tokens.length;
		},
		/**
		* When a token is read from a stream, the first token in the
		* stream must be returned and subsequently removed, and
		* end-of-stream must be returned otherwise.
		*
		* @return {number} Get the next token from the stream, or
		* end_of_stream.
		*/
		read: function() {
			if (!this.tokens.length) return end_of_stream;
			return this.tokens.shift();
		},
		/**
		* When one or more tokens are prepended to a stream, those tokens
		* must be inserted, in given order, before the first token in the
		* stream.
		*
		* @param {(number|!Array.<number>)} token The token(s) to prepend to the stream.
		*/
		prepend: function(token) {
			if (Array.isArray(token)) {
				var tokens = token;
				while (tokens.length) this.tokens.unshift(tokens.pop());
			} else this.tokens.unshift(token);
		},
		/**
		* When one or more tokens are pushed to a stream, those tokens
		* must be inserted, in given order, after the last token in the
		* stream.
		*
		* @param {(number|!Array.<number>)} token The tokens(s) to prepend to the stream.
		*/
		push: function(token) {
			if (Array.isArray(token)) {
				var tokens = token;
				while (tokens.length) this.tokens.push(tokens.shift());
			} else this.tokens.push(token);
		}
	};
	finished = -1;
	Decoder.prototype = { 
	/**
	* @param {Stream} stream The stream of bytes being decoded.
	* @param {number} bite The next byte read from the stream.
	* @return {?(number|!Array.<number>)} The next code point(s)
	*     decoded, or null if not enough data exists in the input
	*     stream to decode a complete code point, or |finished|.
	*/
handler: function(stream, bite) {} };
	Encoder.prototype = { 
	/**
	* @param {Stream} stream The stream of code points being encoded.
	* @param {number} code_point Next code point read from the stream.
	* @return {(number|!Array.<number>)} Byte(s) to emit, or |finished|.
	*/
handler: function(stream, code_point) {} };
	DEFAULT_ENCODING = "utf-8";
	TextDecoder$1.prototype = { 
	/**
	* @param {ArrayBufferView=} input The buffer of bytes to decode.
	* @param {Object=} options
	* @return {string} The decoded string.
	*/
decode: function decode(input, options) {
		var bytes;
		if (typeof input === "object" && input instanceof ArrayBuffer) bytes = new Uint8Array(input);
		else if (typeof input === "object" && "buffer" in input && input.buffer instanceof ArrayBuffer) bytes = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
		else bytes = /* @__PURE__ */ new Uint8Array(0);
		options = ToDictionary(options);
		if (!this._streaming) {
			this._decoder = new UTF8Decoder({ fatal: this._fatal });
			this._BOMseen = false;
		}
		this._streaming = Boolean(options["stream"]);
		var input_stream = new Stream$1(bytes);
		var code_points = [];
		/** @type {?(number|!Array.<number>)} */
		var result;
		while (!input_stream.endOfStream()) {
			result = this._decoder.handler(input_stream, input_stream.read());
			if (result === finished) break;
			if (result === null) continue;
			if (Array.isArray(result)) code_points.push.apply(code_points, result);
			else code_points.push(result);
		}
		if (!this._streaming) {
			do {
				result = this._decoder.handler(input_stream, input_stream.read());
				if (result === finished) break;
				if (result === null) continue;
				if (Array.isArray(result)) code_points.push.apply(code_points, result);
				else code_points.push(result);
			} while (!input_stream.endOfStream());
			this._decoder = null;
		}
		if (code_points.length) {
			if (["utf-8"].indexOf(this.encoding) !== -1 && !this._ignoreBOM && !this._BOMseen) {
				if (code_points[0] === 65279) {
					this._BOMseen = true;
					code_points.shift();
				} else this._BOMseen = true;
			}
		}
		return codePointsToString(code_points);
	} };
	TextEncoder.prototype = { 
	/**
	* @param {string=} opt_string The string to encode.
	* @param {Object=} options
	* @return {Uint8Array} Encoded bytes, as a Uint8Array.
	*/
encode: function encode(opt_string, options) {
		opt_string = opt_string ? String(opt_string) : "";
		options = ToDictionary(options);
		if (!this._streaming) this._encoder = new UTF8Encoder(this._options);
		this._streaming = Boolean(options["stream"]);
		var bytes = [];
		var input_stream = new Stream$1(stringToCodePoints(opt_string));
		/** @type {?(number|!Array.<number>)} */
		var result;
		while (!input_stream.endOfStream()) {
			result = this._encoder.handler(input_stream, input_stream.read());
			if (result === finished) break;
			if (Array.isArray(result)) bytes.push.apply(bytes, result);
			else bytes.push(result);
		}
		if (!this._streaming) {
			while (true) {
				result = this._encoder.handler(input_stream, input_stream.read());
				if (result === finished) break;
				if (Array.isArray(result)) bytes.push.apply(bytes, result);
				else bytes.push(result);
			}
			this._encoder = null;
		}
		return new Uint8Array(bytes);
	} };
}));
//#endregion
//#region node_modules/borsh/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __decorate = exports && exports.__decorate || function(decorators, target, key, desc) {
		var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
		if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
		else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
		return c > 3 && r && Object.defineProperty(target, key, r), r;
	};
	var __importStar = exports && exports.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __importDefault = exports && exports.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.deserializeUnchecked = exports.deserialize = exports.serialize = exports.BinaryReader = exports.BinaryWriter = exports.BorshError = exports.baseDecode = exports.baseEncode = void 0;
	var bn_js_1 = __importDefault(require_bn());
	var bs58_1 = __importDefault(require_bs58());
	var encoding = __importStar((init_encoding(), __toCommonJS(encoding_exports)));
	var textDecoder = new (typeof TextDecoder !== "function" ? encoding.TextDecoder : TextDecoder)("utf-8", { fatal: true });
	function baseEncode(value) {
		if (typeof value === "string") value = Buffer.from(value, "utf8");
		return bs58_1.default.encode(Buffer.from(value));
	}
	exports.baseEncode = baseEncode;
	function baseDecode(value) {
		return Buffer.from(bs58_1.default.decode(value));
	}
	exports.baseDecode = baseDecode;
	var INITIAL_LENGTH = 1024;
	var BorshError = class extends Error {
		constructor(message) {
			super(message);
			this.fieldPath = [];
			this.originalMessage = message;
		}
		addToFieldPath(fieldName) {
			this.fieldPath.splice(0, 0, fieldName);
			this.message = this.originalMessage + ": " + this.fieldPath.join(".");
		}
	};
	exports.BorshError = BorshError;
	var BinaryWriter = class {
		constructor() {
			this.buf = Buffer.alloc(INITIAL_LENGTH);
			this.length = 0;
		}
		maybeResize() {
			if (this.buf.length < 16 + this.length) this.buf = Buffer.concat([this.buf, Buffer.alloc(INITIAL_LENGTH)]);
		}
		writeU8(value) {
			this.maybeResize();
			this.buf.writeUInt8(value, this.length);
			this.length += 1;
		}
		writeU16(value) {
			this.maybeResize();
			this.buf.writeUInt16LE(value, this.length);
			this.length += 2;
		}
		writeU32(value) {
			this.maybeResize();
			this.buf.writeUInt32LE(value, this.length);
			this.length += 4;
		}
		writeU64(value) {
			this.maybeResize();
			this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 8)));
		}
		writeU128(value) {
			this.maybeResize();
			this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 16)));
		}
		writeU256(value) {
			this.maybeResize();
			this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 32)));
		}
		writeU512(value) {
			this.maybeResize();
			this.writeBuffer(Buffer.from(new bn_js_1.default(value).toArray("le", 64)));
		}
		writeBuffer(buffer) {
			this.buf = Buffer.concat([
				Buffer.from(this.buf.subarray(0, this.length)),
				buffer,
				Buffer.alloc(INITIAL_LENGTH)
			]);
			this.length += buffer.length;
		}
		writeString(str) {
			this.maybeResize();
			const b = Buffer.from(str, "utf8");
			this.writeU32(b.length);
			this.writeBuffer(b);
		}
		writeFixedArray(array) {
			this.writeBuffer(Buffer.from(array));
		}
		writeArray(array, fn) {
			this.maybeResize();
			this.writeU32(array.length);
			for (const elem of array) {
				this.maybeResize();
				fn(elem);
			}
		}
		toArray() {
			return this.buf.subarray(0, this.length);
		}
	};
	exports.BinaryWriter = BinaryWriter;
	function handlingRangeError(target, propertyKey, propertyDescriptor) {
		const originalMethod = propertyDescriptor.value;
		propertyDescriptor.value = function(...args) {
			try {
				return originalMethod.apply(this, args);
			} catch (e) {
				if (e instanceof RangeError) {
					const code = e.code;
					if (["ERR_BUFFER_OUT_OF_BOUNDS", "ERR_OUT_OF_RANGE"].indexOf(code) >= 0) throw new BorshError("Reached the end of buffer when deserializing");
				}
				throw e;
			}
		};
	}
	var BinaryReader = class {
		constructor(buf) {
			this.buf = buf;
			this.offset = 0;
		}
		readU8() {
			const value = this.buf.readUInt8(this.offset);
			this.offset += 1;
			return value;
		}
		readU16() {
			const value = this.buf.readUInt16LE(this.offset);
			this.offset += 2;
			return value;
		}
		readU32() {
			const value = this.buf.readUInt32LE(this.offset);
			this.offset += 4;
			return value;
		}
		readU64() {
			const buf = this.readBuffer(8);
			return new bn_js_1.default(buf, "le");
		}
		readU128() {
			const buf = this.readBuffer(16);
			return new bn_js_1.default(buf, "le");
		}
		readU256() {
			const buf = this.readBuffer(32);
			return new bn_js_1.default(buf, "le");
		}
		readU512() {
			const buf = this.readBuffer(64);
			return new bn_js_1.default(buf, "le");
		}
		readBuffer(len) {
			if (this.offset + len > this.buf.length) throw new BorshError(`Expected buffer length ${len} isn't within bounds`);
			const result = this.buf.slice(this.offset, this.offset + len);
			this.offset += len;
			return result;
		}
		readString() {
			const len = this.readU32();
			const buf = this.readBuffer(len);
			try {
				return textDecoder.decode(buf);
			} catch (e) {
				throw new BorshError(`Error decoding UTF-8 string: ${e}`);
			}
		}
		readFixedArray(len) {
			return new Uint8Array(this.readBuffer(len));
		}
		readArray(fn) {
			const len = this.readU32();
			const result = Array();
			for (let i = 0; i < len; ++i) result.push(fn());
			return result;
		}
	};
	__decorate([handlingRangeError], BinaryReader.prototype, "readU8", null);
	__decorate([handlingRangeError], BinaryReader.prototype, "readU16", null);
	__decorate([handlingRangeError], BinaryReader.prototype, "readU32", null);
	__decorate([handlingRangeError], BinaryReader.prototype, "readU64", null);
	__decorate([handlingRangeError], BinaryReader.prototype, "readU128", null);
	__decorate([handlingRangeError], BinaryReader.prototype, "readU256", null);
	__decorate([handlingRangeError], BinaryReader.prototype, "readU512", null);
	__decorate([handlingRangeError], BinaryReader.prototype, "readString", null);
	__decorate([handlingRangeError], BinaryReader.prototype, "readFixedArray", null);
	__decorate([handlingRangeError], BinaryReader.prototype, "readArray", null);
	exports.BinaryReader = BinaryReader;
	function capitalizeFirstLetter(string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
	function serializeField(schema, fieldName, value, fieldType, writer) {
		try {
			if (typeof fieldType === "string") writer[`write${capitalizeFirstLetter(fieldType)}`](value);
			else if (fieldType instanceof Array) {
				if (typeof fieldType[0] === "number") {
					if (value.length !== fieldType[0]) throw new BorshError(`Expecting byte array of length ${fieldType[0]}, but got ${value.length} bytes`);
					writer.writeFixedArray(value);
				} else if (fieldType.length === 2 && typeof fieldType[1] === "number") {
					if (value.length !== fieldType[1]) throw new BorshError(`Expecting byte array of length ${fieldType[1]}, but got ${value.length} bytes`);
					for (let i = 0; i < fieldType[1]; i++) serializeField(schema, null, value[i], fieldType[0], writer);
				} else writer.writeArray(value, (item) => {
					serializeField(schema, fieldName, item, fieldType[0], writer);
				});
			} else if (fieldType.kind !== void 0) switch (fieldType.kind) {
				case "option":
					if (value === null || value === void 0) writer.writeU8(0);
					else {
						writer.writeU8(1);
						serializeField(schema, fieldName, value, fieldType.type, writer);
					}
					break;
				case "map":
					writer.writeU32(value.size);
					value.forEach((val, key) => {
						serializeField(schema, fieldName, key, fieldType.key, writer);
						serializeField(schema, fieldName, val, fieldType.value, writer);
					});
					break;
				default: throw new BorshError(`FieldType ${fieldType} unrecognized`);
			}
			else serializeStruct(schema, value, writer);
		} catch (error) {
			if (error instanceof BorshError) error.addToFieldPath(fieldName);
			throw error;
		}
	}
	function serializeStruct(schema, obj, writer) {
		if (typeof obj.borshSerialize === "function") {
			obj.borshSerialize(writer);
			return;
		}
		const structSchema = schema.get(obj.constructor);
		if (!structSchema) throw new BorshError(`Class ${obj.constructor.name} is missing in schema`);
		if (structSchema.kind === "struct") structSchema.fields.map(([fieldName, fieldType]) => {
			serializeField(schema, fieldName, obj[fieldName], fieldType, writer);
		});
		else if (structSchema.kind === "enum") {
			const name = obj[structSchema.field];
			for (let idx = 0; idx < structSchema.values.length; ++idx) {
				const [fieldName, fieldType] = structSchema.values[idx];
				if (fieldName === name) {
					writer.writeU8(idx);
					serializeField(schema, fieldName, obj[fieldName], fieldType, writer);
					break;
				}
			}
		} else throw new BorshError(`Unexpected schema kind: ${structSchema.kind} for ${obj.constructor.name}`);
	}
	function serialize(schema, obj, Writer = BinaryWriter) {
		const writer = new Writer();
		serializeStruct(schema, obj, writer);
		return writer.toArray();
	}
	exports.serialize = serialize;
	function deserializeField(schema, fieldName, fieldType, reader) {
		try {
			if (typeof fieldType === "string") return reader[`read${capitalizeFirstLetter(fieldType)}`]();
			if (fieldType instanceof Array) {
				if (typeof fieldType[0] === "number") return reader.readFixedArray(fieldType[0]);
				else if (typeof fieldType[1] === "number") {
					const arr = [];
					for (let i = 0; i < fieldType[1]; i++) arr.push(deserializeField(schema, null, fieldType[0], reader));
					return arr;
				} else return reader.readArray(() => deserializeField(schema, fieldName, fieldType[0], reader));
			}
			if (fieldType.kind === "option") {
				if (reader.readU8()) return deserializeField(schema, fieldName, fieldType.type, reader);
				return;
			}
			if (fieldType.kind === "map") {
				let map = /* @__PURE__ */ new Map();
				const length = reader.readU32();
				for (let i = 0; i < length; i++) {
					const key = deserializeField(schema, fieldName, fieldType.key, reader);
					const val = deserializeField(schema, fieldName, fieldType.value, reader);
					map.set(key, val);
				}
				return map;
			}
			return deserializeStruct(schema, fieldType, reader);
		} catch (error) {
			if (error instanceof BorshError) error.addToFieldPath(fieldName);
			throw error;
		}
	}
	function deserializeStruct(schema, classType, reader) {
		if (typeof classType.borshDeserialize === "function") return classType.borshDeserialize(reader);
		const structSchema = schema.get(classType);
		if (!structSchema) throw new BorshError(`Class ${classType.name} is missing in schema`);
		if (structSchema.kind === "struct") {
			const result = {};
			for (const [fieldName, fieldType] of schema.get(classType).fields) result[fieldName] = deserializeField(schema, fieldName, fieldType, reader);
			return new classType(result);
		}
		if (structSchema.kind === "enum") {
			const idx = reader.readU8();
			if (idx >= structSchema.values.length) throw new BorshError(`Enum index: ${idx} is out of range`);
			const [fieldName, fieldType] = structSchema.values[idx];
			const fieldValue = deserializeField(schema, fieldName, fieldType, reader);
			return new classType({ [fieldName]: fieldValue });
		}
		throw new BorshError(`Unexpected schema kind: ${structSchema.kind} for ${classType.constructor.name}`);
	}
	function deserialize(schema, classType, buffer, Reader = BinaryReader) {
		const reader = new Reader(buffer);
		const result = deserializeStruct(schema, classType, reader);
		if (reader.offset < buffer.length) throw new BorshError(`Unexpected ${buffer.length - reader.offset} bytes after deserialized data`);
		return result;
	}
	exports.deserialize = deserialize;
	function deserializeUnchecked(schema, classType, buffer, Reader = BinaryReader) {
		return deserializeStruct(schema, classType, new Reader(buffer));
	}
	exports.deserializeUnchecked = deserializeUnchecked;
}));
//#endregion
//#region node_modules/superstruct/dist/index.mjs
var import_bn = /* @__PURE__ */ __toESM(require_bn());
var import_bs58 = /* @__PURE__ */ __toESM(require_bs58());
var import_lib = require_lib$1();
var import_Layout = /* @__PURE__ */ __toESM(require_Layout());
/**
* A `StructFailure` represents a single specific failure in validation.
*/
/**
* `StructError` objects are thrown (or returned) when validation fails.
*
* Validation logic is design to exit early for maximum performance. The error
* represents the first error encountered during validation. For more detail,
* the `error.failures` property is a generator function that can be run to
* continue validation and receive all the failures in the data.
*/
var StructError = class extends TypeError {
	constructor(failure, failures) {
		let cached;
		const { message, explanation, ...rest } = failure;
		const { path } = failure;
		const msg = path.length === 0 ? message : `At path: ${path.join(".")} -- ${message}`;
		super(explanation ?? msg);
		if (explanation != null) this.cause = msg;
		Object.assign(this, rest);
		this.name = this.constructor.name;
		this.failures = () => {
			return cached ?? (cached = [failure, ...failures()]);
		};
	}
};
/**
* Check if a value is an iterator.
*/
function isIterable(x) {
	return isObject(x) && typeof x[Symbol.iterator] === "function";
}
/**
* Check if a value is a plain object.
*/
function isObject(x) {
	return typeof x === "object" && x != null;
}
/**
* Check if a value is a non-array object.
*/
function isNonArrayObject(x) {
	return isObject(x) && !Array.isArray(x);
}
/**
* Return a value as a printable string.
*/
function print(value) {
	if (typeof value === "symbol") return value.toString();
	return typeof value === "string" ? JSON.stringify(value) : `${value}`;
}
/**
* Shifts (removes and returns) the first value from the `input` iterator.
* Like `Array.prototype.shift()` but for an `Iterator`.
*/
function shiftIterator(input) {
	const { done, value } = input.next();
	return done ? void 0 : value;
}
/**
* Convert a single validation result to a failure.
*/
function toFailure(result, context, struct, value) {
	if (result === true) return;
	else if (result === false) result = {};
	else if (typeof result === "string") result = { message: result };
	const { path, branch } = context;
	const { type } = struct;
	const { refinement, message = `Expected a value of type \`${type}\`${refinement ? ` with refinement \`${refinement}\`` : ""}, but received: \`${print(value)}\`` } = result;
	return {
		value,
		type,
		refinement,
		key: path[path.length - 1],
		path,
		branch,
		...result,
		message
	};
}
/**
* Convert a validation result to an iterable of failures.
*/
function* toFailures(result, context, struct, value) {
	if (!isIterable(result)) result = [result];
	for (const r of result) {
		const failure = toFailure(r, context, struct, value);
		if (failure) yield failure;
	}
}
/**
* Check a value against a struct, traversing deeply into nested values, and
* returning an iterator of failures or success.
*/
function* run(value, struct, options = {}) {
	const { path = [], branch = [value], coerce = false, mask = false } = options;
	const ctx = {
		path,
		branch,
		mask
	};
	if (coerce) value = struct.coercer(value, ctx);
	let status = "valid";
	for (const failure of struct.validator(value, ctx)) {
		failure.explanation = options.message;
		status = "not_valid";
		yield [failure, void 0];
	}
	for (let [k, v, s] of struct.entries(value, ctx)) {
		const ts = run(v, s, {
			path: k === void 0 ? path : [...path, k],
			branch: k === void 0 ? branch : [...branch, v],
			coerce,
			mask,
			message: options.message
		});
		for (const t of ts) if (t[0]) {
			status = t[0].refinement != null ? "not_refined" : "not_valid";
			yield [t[0], void 0];
		} else if (coerce) {
			v = t[1];
			if (k === void 0) value = v;
			else if (value instanceof Map) value.set(k, v);
			else if (value instanceof Set) value.add(v);
			else if (isObject(value)) {
				if (v !== void 0 || k in value) value[k] = v;
			}
		}
	}
	if (status !== "not_valid") for (const failure of struct.refiner(value, ctx)) {
		failure.explanation = options.message;
		status = "not_refined";
		yield [failure, void 0];
	}
	if (status === "valid") yield [void 0, value];
}
/**
* `Struct` objects encapsulate the validation logic for a specific type of
* values. Once constructed, you use the `assert`, `is` or `validate` helpers to
* validate unknown input data against the struct.
*/
var Struct$1 = class {
	constructor(props) {
		const { type, schema, validator, refiner, coercer = (value) => value, entries = function* () {} } = props;
		this.type = type;
		this.schema = schema;
		this.entries = entries;
		this.coercer = coercer;
		if (validator) this.validator = (value, context) => {
			return toFailures(validator(value, context), context, this, value);
		};
		else this.validator = () => [];
		if (refiner) this.refiner = (value, context) => {
			return toFailures(refiner(value, context), context, this, value);
		};
		else this.refiner = () => [];
	}
	/**
	* Assert that a value passes the struct's validation, throwing if it doesn't.
	*/
	assert(value, message) {
		return assert$1(value, this, message);
	}
	/**
	* Create a value with the struct's coercion logic, then validate it.
	*/
	create(value, message) {
		return create(value, this, message);
	}
	/**
	* Check if a value passes the struct's validation.
	*/
	is(value) {
		return is(value, this);
	}
	/**
	* Mask a value, coercing and validating it, but returning only the subset of
	* properties defined by the struct's schema. Masking applies recursively to
	* props of `object` structs only.
	*/
	mask(value, message) {
		return mask(value, this, message);
	}
	/**
	* Validate a value with the struct's validation logic, returning a tuple
	* representing the result.
	*
	* You may optionally pass `true` for the `coerce` argument to coerce
	* the value before attempting to validate it. If you do, the result will
	* contain the coerced result when successful. Also, `mask` will turn on
	* masking of the unknown `object` props recursively if passed.
	*/
	validate(value, options = {}) {
		return validate(value, this, options);
	}
};
/**
* Assert that a value passes a struct, throwing if it doesn't.
*/
function assert$1(value, struct, message) {
	const result = validate(value, struct, { message });
	if (result[0]) throw result[0];
}
/**
* Create a value with the coercion logic of struct and validate it.
*/
function create(value, struct, message) {
	const result = validate(value, struct, {
		coerce: true,
		message
	});
	if (result[0]) throw result[0];
	else return result[1];
}
/**
* Mask a value, returning only the subset of properties defined by a struct.
*/
function mask(value, struct, message) {
	const result = validate(value, struct, {
		coerce: true,
		mask: true,
		message
	});
	if (result[0]) throw result[0];
	else return result[1];
}
/**
* Check if a value passes a struct.
*/
function is(value, struct) {
	return !validate(value, struct)[0];
}
/**
* Validate a value against a struct, returning an error if invalid, or the
* value (with potential coercion) if valid.
*/
function validate(value, struct, options = {}) {
	const tuples = run(value, struct, options);
	const tuple = shiftIterator(tuples);
	if (tuple[0]) return [new StructError(tuple[0], function* () {
		for (const t of tuples) if (t[0]) yield t[0];
	}), void 0];
	else return [void 0, tuple[1]];
}
/**
* Define a new struct type with a custom validation function.
*/
function define(name, validator) {
	return new Struct$1({
		type: name,
		schema: null,
		validator
	});
}
/**
* Ensure that any value passes validation.
*/
function any() {
	return define("any", () => true);
}
function array(Element) {
	return new Struct$1({
		type: "array",
		schema: Element,
		*entries(value) {
			if (Element && Array.isArray(value)) for (const [i, v] of value.entries()) yield [
				i,
				v,
				Element
			];
		},
		coercer(value) {
			return Array.isArray(value) ? value.slice() : value;
		},
		validator(value) {
			return Array.isArray(value) || `Expected an array value, but received: ${print(value)}`;
		}
	});
}
/**
* Ensure that a value is a boolean.
*/
function boolean() {
	return define("boolean", (value) => {
		return typeof value === "boolean";
	});
}
/**
* Ensure that a value is an instance of a specific class.
*/
function instance(Class) {
	return define("instance", (value) => {
		return value instanceof Class || `Expected a \`${Class.name}\` instance, but received: ${print(value)}`;
	});
}
function literal(constant) {
	const description = print(constant);
	const t = typeof constant;
	return new Struct$1({
		type: "literal",
		schema: t === "string" || t === "number" || t === "boolean" ? constant : null,
		validator(value) {
			return value === constant || `Expected the literal \`${description}\`, but received: ${print(value)}`;
		}
	});
}
/**
* Ensure that no value ever passes validation.
*/
function never() {
	return define("never", () => false);
}
/**
* Augment an existing struct to allow `null` values.
*/
function nullable(struct) {
	return new Struct$1({
		...struct,
		validator: (value, ctx) => value === null || struct.validator(value, ctx),
		refiner: (value, ctx) => value === null || struct.refiner(value, ctx)
	});
}
/**
* Ensure that a value is a number.
*/
function number() {
	return define("number", (value) => {
		return typeof value === "number" && !isNaN(value) || `Expected a number, but received: ${print(value)}`;
	});
}
/**
* Augment a struct to allow `undefined` values.
*/
function optional(struct) {
	return new Struct$1({
		...struct,
		validator: (value, ctx) => value === void 0 || struct.validator(value, ctx),
		refiner: (value, ctx) => value === void 0 || struct.refiner(value, ctx)
	});
}
/**
* Ensure that a value is an object with keys and values of specific types, but
* without ensuring any specific shape of properties.
*
* Like TypeScript's `Record` utility.
*/
function record(Key, Value) {
	return new Struct$1({
		type: "record",
		schema: null,
		*entries(value) {
			if (isObject(value)) for (const k in value) {
				const v = value[k];
				yield [
					k,
					k,
					Key
				];
				yield [
					k,
					v,
					Value
				];
			}
		},
		validator(value) {
			return isNonArrayObject(value) || `Expected an object, but received: ${print(value)}`;
		},
		coercer(value) {
			return isNonArrayObject(value) ? { ...value } : value;
		}
	});
}
/**
* Ensure that a value is a string.
*/
function string() {
	return define("string", (value) => {
		return typeof value === "string" || `Expected a string, but received: ${print(value)}`;
	});
}
/**
* Ensure that a value is a tuple of a specific length, and that each of its
* elements is of a specific type.
*/
function tuple(Structs) {
	const Never = never();
	return new Struct$1({
		type: "tuple",
		schema: null,
		*entries(value) {
			if (Array.isArray(value)) {
				const length = Math.max(Structs.length, value.length);
				for (let i = 0; i < length; i++) yield [
					i,
					value[i],
					Structs[i] || Never
				];
			}
		},
		validator(value) {
			return Array.isArray(value) || `Expected an array, but received: ${print(value)}`;
		},
		coercer(value) {
			return Array.isArray(value) ? value.slice() : value;
		}
	});
}
/**
* Ensure that a value has a set of known properties of specific types.
*
* Note: Unrecognized properties are allowed and untouched. This is similar to
* how TypeScript's structural typing works.
*/
function type(schema) {
	const keys = Object.keys(schema);
	return new Struct$1({
		type: "type",
		schema,
		*entries(value) {
			if (isObject(value)) for (const k of keys) yield [
				k,
				value[k],
				schema[k]
			];
		},
		validator(value) {
			return isNonArrayObject(value) || `Expected an object, but received: ${print(value)}`;
		},
		coercer(value) {
			return isNonArrayObject(value) ? { ...value } : value;
		}
	});
}
/**
* Ensure that a value matches one of a set of types.
*/
function union(Structs) {
	const description = Structs.map((s) => s.type).join(" | ");
	return new Struct$1({
		type: "union",
		schema: null,
		coercer(value, ctx) {
			for (const S of Structs) {
				const [error, coerced] = S.validate(value, {
					coerce: true,
					mask: ctx.mask
				});
				if (!error) return coerced;
			}
			return value;
		},
		validator(value, ctx) {
			const failures = [];
			for (const S of Structs) {
				const [ ...tuples] = run(value, S, ctx);
				const [first] = tuples;
				if (!first[0]) return [];
				else for (const [failure] of tuples) if (failure) failures.push(failure);
			}
			return [`Expected the value to satisfy a union of \`${description}\`, but received: ${print(value)}`, ...failures];
		}
	});
}
/**
* Ensure that any value passes validation, without widening its type to `any`.
*/
function unknown() {
	return define("unknown", () => true);
}
/**
* Augment a `Struct` to add an additional coercion step to its input.
*
* This allows you to transform input data before validating it, to increase the
* likelihood that it passes validation—for example for default values, parsing
* different formats, etc.
*
* Note: You must use `create(value, Struct)` on the value to have the coercion
* take effect! Using simply `assert()` or `is()` will not use coercion.
*/
function coerce(struct, condition, coercer) {
	return new Struct$1({
		...struct,
		coercer: (value, ctx) => {
			return is(value, condition) ? struct.coercer(coercer(value, ctx), ctx) : struct.coercer(value, ctx);
		}
	});
}
//#endregion
//#region node_modules/uuid/dist/rng.js
var require_rng = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = rng;
	var _crypto$2 = _interopRequireDefault(__require("crypto"));
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	var rnds8Pool = /* @__PURE__ */ new Uint8Array(256);
	var poolPtr = rnds8Pool.length;
	function rng() {
		if (poolPtr > rnds8Pool.length - 16) {
			_crypto$2.default.randomFillSync(rnds8Pool);
			poolPtr = 0;
		}
		return rnds8Pool.slice(poolPtr, poolPtr += 16);
	}
}));
//#endregion
//#region node_modules/uuid/dist/regex.js
var require_regex = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	exports.default = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
}));
//#endregion
//#region node_modules/uuid/dist/validate.js
var require_validate = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _regex = _interopRequireDefault(require_regex());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function validate(uuid) {
		return typeof uuid === "string" && _regex.default.test(uuid);
	}
	exports.default = validate;
}));
//#endregion
//#region node_modules/uuid/dist/stringify.js
var require_stringify = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _validate = _interopRequireDefault(require_validate());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	/**
	* Convert array of 16 byte values to UUID string format of the form:
	* XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
	*/
	var byteToHex = [];
	for (let i = 0; i < 256; ++i) byteToHex.push((i + 256).toString(16).substr(1));
	function stringify(arr, offset = 0) {
		const uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + "-" + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + "-" + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + "-" + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + "-" + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase();
		if (!(0, _validate.default)(uuid)) throw TypeError("Stringified UUID is invalid");
		return uuid;
	}
	exports.default = stringify;
}));
//#endregion
//#region node_modules/uuid/dist/v1.js
var require_v1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _rng = _interopRequireDefault(require_rng());
	var _stringify = _interopRequireDefault(require_stringify());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	var _nodeId;
	var _clockseq;
	var _lastMSecs = 0;
	var _lastNSecs = 0;
	function v1(options, buf, offset) {
		let i = buf && offset || 0;
		const b = buf || new Array(16);
		options = options || {};
		let node = options.node || _nodeId;
		let clockseq = options.clockseq !== void 0 ? options.clockseq : _clockseq;
		if (node == null || clockseq == null) {
			const seedBytes = options.random || (options.rng || _rng.default)();
			if (node == null) node = _nodeId = [
				seedBytes[0] | 1,
				seedBytes[1],
				seedBytes[2],
				seedBytes[3],
				seedBytes[4],
				seedBytes[5]
			];
			if (clockseq == null) clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 16383;
		}
		let msecs = options.msecs !== void 0 ? options.msecs : Date.now();
		let nsecs = options.nsecs !== void 0 ? options.nsecs : _lastNSecs + 1;
		const dt = msecs - _lastMSecs + (nsecs - _lastNSecs) / 1e4;
		if (dt < 0 && options.clockseq === void 0) clockseq = clockseq + 1 & 16383;
		if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === void 0) nsecs = 0;
		if (nsecs >= 1e4) throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
		_lastMSecs = msecs;
		_lastNSecs = nsecs;
		_clockseq = clockseq;
		msecs += 0xb1d069b5400;
		const tl = ((msecs & 268435455) * 1e4 + nsecs) % 4294967296;
		b[i++] = tl >>> 24 & 255;
		b[i++] = tl >>> 16 & 255;
		b[i++] = tl >>> 8 & 255;
		b[i++] = tl & 255;
		const tmh = msecs / 4294967296 * 1e4 & 268435455;
		b[i++] = tmh >>> 8 & 255;
		b[i++] = tmh & 255;
		b[i++] = tmh >>> 24 & 15 | 16;
		b[i++] = tmh >>> 16 & 255;
		b[i++] = clockseq >>> 8 | 128;
		b[i++] = clockseq & 255;
		for (let n = 0; n < 6; ++n) b[i + n] = node[n];
		return buf || (0, _stringify.default)(b);
	}
	exports.default = v1;
}));
//#endregion
//#region node_modules/uuid/dist/parse.js
var require_parse = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _validate = _interopRequireDefault(require_validate());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function parse(uuid) {
		if (!(0, _validate.default)(uuid)) throw TypeError("Invalid UUID");
		let v;
		const arr = /* @__PURE__ */ new Uint8Array(16);
		arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
		arr[1] = v >>> 16 & 255;
		arr[2] = v >>> 8 & 255;
		arr[3] = v & 255;
		arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
		arr[5] = v & 255;
		arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
		arr[7] = v & 255;
		arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
		arr[9] = v & 255;
		arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
		arr[11] = v / 4294967296 & 255;
		arr[12] = v >>> 24 & 255;
		arr[13] = v >>> 16 & 255;
		arr[14] = v >>> 8 & 255;
		arr[15] = v & 255;
		return arr;
	}
	exports.default = parse;
}));
//#endregion
//#region node_modules/uuid/dist/v35.js
var require_v35 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = _default;
	exports.URL = exports.DNS = void 0;
	var _stringify = _interopRequireDefault(require_stringify());
	var _parse = _interopRequireDefault(require_parse());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function stringToBytes(str) {
		str = unescape(encodeURIComponent(str));
		const bytes = [];
		for (let i = 0; i < str.length; ++i) bytes.push(str.charCodeAt(i));
		return bytes;
	}
	var DNS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
	exports.DNS = DNS;
	var URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
	exports.URL = URL;
	function _default(name, version, hashfunc) {
		function generateUUID(value, namespace, buf, offset) {
			if (typeof value === "string") value = stringToBytes(value);
			if (typeof namespace === "string") namespace = (0, _parse.default)(namespace);
			if (namespace.length !== 16) throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");
			let bytes = new Uint8Array(16 + value.length);
			bytes.set(namespace);
			bytes.set(value, namespace.length);
			bytes = hashfunc(bytes);
			bytes[6] = bytes[6] & 15 | version;
			bytes[8] = bytes[8] & 63 | 128;
			if (buf) {
				offset = offset || 0;
				for (let i = 0; i < 16; ++i) buf[offset + i] = bytes[i];
				return buf;
			}
			return (0, _stringify.default)(bytes);
		}
		try {
			generateUUID.name = name;
		} catch (err) {}
		generateUUID.DNS = DNS;
		generateUUID.URL = URL;
		return generateUUID;
	}
}));
//#endregion
//#region node_modules/uuid/dist/md5.js
var require_md5 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _crypto$1 = _interopRequireDefault(__require("crypto"));
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function md5(bytes) {
		if (Array.isArray(bytes)) bytes = Buffer.from(bytes);
		else if (typeof bytes === "string") bytes = Buffer.from(bytes, "utf8");
		return _crypto$1.default.createHash("md5").update(bytes).digest();
	}
	exports.default = md5;
}));
//#endregion
//#region node_modules/uuid/dist/v3.js
var require_v3 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _v = _interopRequireDefault(require_v35());
	var _md = _interopRequireDefault(require_md5());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	exports.default = (0, _v.default)("v3", 48, _md.default);
}));
//#endregion
//#region node_modules/uuid/dist/v4.js
var require_v4 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _rng = _interopRequireDefault(require_rng());
	var _stringify = _interopRequireDefault(require_stringify());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function v4(options, buf, offset) {
		options = options || {};
		const rnds = options.random || (options.rng || _rng.default)();
		rnds[6] = rnds[6] & 15 | 64;
		rnds[8] = rnds[8] & 63 | 128;
		if (buf) {
			offset = offset || 0;
			for (let i = 0; i < 16; ++i) buf[offset + i] = rnds[i];
			return buf;
		}
		return (0, _stringify.default)(rnds);
	}
	exports.default = v4;
}));
//#endregion
//#region node_modules/uuid/dist/sha1.js
var require_sha1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _crypto = _interopRequireDefault(__require("crypto"));
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function sha1(bytes) {
		if (Array.isArray(bytes)) bytes = Buffer.from(bytes);
		else if (typeof bytes === "string") bytes = Buffer.from(bytes, "utf8");
		return _crypto.default.createHash("sha1").update(bytes).digest();
	}
	exports.default = sha1;
}));
//#endregion
//#region node_modules/uuid/dist/v5.js
var require_v5 = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _v = _interopRequireDefault(require_v35());
	var _sha = _interopRequireDefault(require_sha1());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	exports.default = (0, _v.default)("v5", 80, _sha.default);
}));
//#endregion
//#region node_modules/uuid/dist/nil.js
var require_nil = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	exports.default = "00000000-0000-0000-0000-000000000000";
}));
//#endregion
//#region node_modules/uuid/dist/version.js
var require_version = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = void 0;
	var _validate = _interopRequireDefault(require_validate());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
	function version(uuid) {
		if (!(0, _validate.default)(uuid)) throw TypeError("Invalid UUID");
		return parseInt(uuid.substr(14, 1), 16);
	}
	exports.default = version;
}));
//#endregion
//#region node_modules/uuid/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	Object.defineProperty(exports, "v1", {
		enumerable: true,
		get: function() {
			return _v.default;
		}
	});
	Object.defineProperty(exports, "v3", {
		enumerable: true,
		get: function() {
			return _v2.default;
		}
	});
	Object.defineProperty(exports, "v4", {
		enumerable: true,
		get: function() {
			return _v3.default;
		}
	});
	Object.defineProperty(exports, "v5", {
		enumerable: true,
		get: function() {
			return _v4.default;
		}
	});
	Object.defineProperty(exports, "NIL", {
		enumerable: true,
		get: function() {
			return _nil.default;
		}
	});
	Object.defineProperty(exports, "version", {
		enumerable: true,
		get: function() {
			return _version.default;
		}
	});
	Object.defineProperty(exports, "validate", {
		enumerable: true,
		get: function() {
			return _validate.default;
		}
	});
	Object.defineProperty(exports, "stringify", {
		enumerable: true,
		get: function() {
			return _stringify.default;
		}
	});
	Object.defineProperty(exports, "parse", {
		enumerable: true,
		get: function() {
			return _parse.default;
		}
	});
	var _v = _interopRequireDefault(require_v1());
	var _v2 = _interopRequireDefault(require_v3());
	var _v3 = _interopRequireDefault(require_v4());
	var _v4 = _interopRequireDefault(require_v5());
	var _nil = _interopRequireDefault(require_nil());
	var _version = _interopRequireDefault(require_version());
	var _validate = _interopRequireDefault(require_validate());
	var _stringify = _interopRequireDefault(require_stringify());
	var _parse = _interopRequireDefault(require_parse());
	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : { default: obj };
	}
}));
//#endregion
//#region node_modules/jayson/lib/generateRequest.js
var require_generateRequest = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var uuid = require_dist().v4;
	/**
	*  Generates a JSON-RPC 1.0 or 2.0 request
	*  @param {String} method Name of method to call
	*  @param {Array|Object} params Array of parameters passed to the method as specified, or an object of parameter names and corresponding value
	*  @param {String|Number|null} [id] Request ID can be a string, number, null for explicit notification or left out for automatic generation
	*  @param {Object} [options]
	*  @param {Number} [options.version=2] JSON-RPC version to use (1 or 2)
	*  @param {Boolean} [options.notificationIdNull=false] When true, version 2 requests will set id to null instead of omitting it
	*  @param {Function} [options.generator] Passed the request, and the options object and is expected to return a request ID
	*  @throws {TypeError} If any of the parameters are invalid
	*  @return {Object} A JSON-RPC 1.0 or 2.0 request
	*  @memberOf Utils
	*/
	var generateRequest = function(method, params, id, options) {
		if (typeof method !== "string") throw new TypeError(method + " must be a string");
		options = options || {};
		const version = typeof options.version === "number" ? options.version : 2;
		if (version !== 1 && version !== 2) throw new TypeError(version + " must be 1 or 2");
		const request = { method };
		if (version === 2) request.jsonrpc = "2.0";
		if (params) {
			if (typeof params !== "object" && !Array.isArray(params)) throw new TypeError(params + " must be an object, array or omitted");
			request.params = params;
		}
		if (typeof id === "undefined") request.id = (typeof options.generator === "function" ? options.generator : function() {
			return uuid();
		})(request, options);
		else if (version === 2 && id === null) {
			if (options.notificationIdNull) request.id = null;
		} else request.id = id;
		return request;
	};
	module.exports = generateRequest;
}));
//#endregion
//#region node_modules/jayson/lib/client/browser/index.js
var require_browser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var uuid = require_dist().v4;
	var generateRequest = require_generateRequest();
	/**
	* Constructor for a Jayson Browser Client that does not depend any node.js core libraries
	* @class ClientBrowser
	* @param {Function} callServer Method that calls the server, receives the stringified request and a regular node-style callback
	* @param {Object} [options]
	* @param {Function} [options.reviver] Reviver function for JSON
	* @param {Function} [options.replacer] Replacer function for JSON
	* @param {Number} [options.version=2] JSON-RPC version to use (1|2)
	* @param {Function} [options.generator] Function to use for generating request IDs
	*  @param {Boolean} [options.notificationIdNull=false] When true, version 2 requests will set id to null instead of omitting it
	* @return {ClientBrowser}
	*/
	var ClientBrowser = function(callServer, options) {
		if (!(this instanceof ClientBrowser)) return new ClientBrowser(callServer, options);
		if (!options) options = {};
		this.options = {
			reviver: typeof options.reviver !== "undefined" ? options.reviver : null,
			replacer: typeof options.replacer !== "undefined" ? options.replacer : null,
			generator: typeof options.generator !== "undefined" ? options.generator : function() {
				return uuid();
			},
			version: typeof options.version !== "undefined" ? options.version : 2,
			notificationIdNull: typeof options.notificationIdNull === "boolean" ? options.notificationIdNull : false
		};
		this.callServer = callServer;
	};
	module.exports = ClientBrowser;
	/**
	*  Creates a request and dispatches it if given a callback.
	*  @param {String|Array} method A batch request if passed an Array, or a method name if passed a String
	*  @param {Array|Object} [params] Parameters for the method
	*  @param {String|Number} [id] Optional id. If undefined an id will be generated. If null it creates a notification request
	*  @param {Function} [callback] Request callback. If specified, executes the request rather than only returning it.
	*  @throws {TypeError} Invalid parameters
	*  @return {Object} JSON-RPC 1.0 or 2.0 compatible request
	*/
	ClientBrowser.prototype.request = function(method, params, id, callback) {
		const self = this;
		let request = null;
		const isBatch = Array.isArray(method) && typeof params === "function";
		if (this.options.version === 1 && isBatch) throw new TypeError("JSON-RPC 1.0 does not support batching");
		if (isBatch || !isBatch && method && typeof method === "object" && typeof params === "function") {
			callback = params;
			request = method;
		} else {
			if (typeof id === "function") {
				callback = id;
				id = void 0;
			}
			const hasCallback = typeof callback === "function";
			try {
				request = generateRequest(method, params, id, {
					generator: this.options.generator,
					version: this.options.version,
					notificationIdNull: this.options.notificationIdNull
				});
			} catch (err) {
				if (hasCallback) {
					callback(err);
					return;
				}
				throw err;
			}
			if (!hasCallback) return request;
		}
		let message;
		try {
			message = JSON.stringify(request, this.options.replacer);
		} catch (err) {
			callback(err);
			return;
		}
		this.callServer(message, function(err, response) {
			self._parseResponse(err, response, callback);
		});
		return request;
	};
	/**
	* Parses a response from a server
	* @param {Object} err Error to pass on that is unrelated to the actual response
	* @param {String} responseText JSON-RPC 1.0 or 2.0 response
	* @param {Function} callback Callback that will receive different arguments depending on the amount of parameters
	* @private
	*/
	ClientBrowser.prototype._parseResponse = function(err, responseText, callback) {
		if (err) {
			callback(err);
			return;
		}
		if (!responseText) {
			callback();
			return;
		}
		let response;
		try {
			response = JSON.parse(responseText, this.options.reviver);
		} catch (err) {
			callback(err);
			return;
		}
		if (callback.length === 3) {
			if (Array.isArray(response)) {
				const isError = function(res) {
					return typeof res.error !== "undefined";
				};
				const isNotError = function(res) {
					return !isError(res);
				};
				callback(null, response.filter(isError), response.filter(isNotError));
				return;
			} else {
				callback(null, response.error, response.result);
				return;
			}
		}
		callback(null, response);
	};
}));
//#endregion
//#region node_modules/webidl-conversions/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var conversions = {};
	module.exports = conversions;
	function sign(x) {
		return x < 0 ? -1 : 1;
	}
	function evenRound(x) {
		if (x % 1 === .5 && (x & 1) === 0) return Math.floor(x);
		else return Math.round(x);
	}
	function createNumberConversion(bitLength, typeOpts) {
		if (!typeOpts.unsigned) --bitLength;
		const lowerBound = typeOpts.unsigned ? 0 : -Math.pow(2, bitLength);
		const upperBound = Math.pow(2, bitLength) - 1;
		const moduloVal = typeOpts.moduloBitLength ? Math.pow(2, typeOpts.moduloBitLength) : Math.pow(2, bitLength);
		const moduloBound = typeOpts.moduloBitLength ? Math.pow(2, typeOpts.moduloBitLength - 1) : Math.pow(2, bitLength - 1);
		return function(V, opts) {
			if (!opts) opts = {};
			let x = +V;
			if (opts.enforceRange) {
				if (!Number.isFinite(x)) throw new TypeError("Argument is not a finite number");
				x = sign(x) * Math.floor(Math.abs(x));
				if (x < lowerBound || x > upperBound) throw new TypeError("Argument is not in byte range");
				return x;
			}
			if (!isNaN(x) && opts.clamp) {
				x = evenRound(x);
				if (x < lowerBound) x = lowerBound;
				if (x > upperBound) x = upperBound;
				return x;
			}
			if (!Number.isFinite(x) || x === 0) return 0;
			x = sign(x) * Math.floor(Math.abs(x));
			x = x % moduloVal;
			if (!typeOpts.unsigned && x >= moduloBound) return x - moduloVal;
			else if (typeOpts.unsigned) {
				if (x < 0) x += moduloVal;
				else if (x === -0) return 0;
			}
			return x;
		};
	}
	conversions["void"] = function() {};
	conversions["boolean"] = function(val) {
		return !!val;
	};
	conversions["byte"] = createNumberConversion(8, { unsigned: false });
	conversions["octet"] = createNumberConversion(8, { unsigned: true });
	conversions["short"] = createNumberConversion(16, { unsigned: false });
	conversions["unsigned short"] = createNumberConversion(16, { unsigned: true });
	conversions["long"] = createNumberConversion(32, { unsigned: false });
	conversions["unsigned long"] = createNumberConversion(32, { unsigned: true });
	conversions["long long"] = createNumberConversion(32, {
		unsigned: false,
		moduloBitLength: 64
	});
	conversions["unsigned long long"] = createNumberConversion(32, {
		unsigned: true,
		moduloBitLength: 64
	});
	conversions["double"] = function(V) {
		const x = +V;
		if (!Number.isFinite(x)) throw new TypeError("Argument is not a finite floating-point value");
		return x;
	};
	conversions["unrestricted double"] = function(V) {
		const x = +V;
		if (isNaN(x)) throw new TypeError("Argument is NaN");
		return x;
	};
	conversions["float"] = conversions["double"];
	conversions["unrestricted float"] = conversions["unrestricted double"];
	conversions["DOMString"] = function(V, opts) {
		if (!opts) opts = {};
		if (opts.treatNullAsEmptyString && V === null) return "";
		return String(V);
	};
	conversions["ByteString"] = function(V, opts) {
		const x = String(V);
		let c = void 0;
		for (let i = 0; (c = x.codePointAt(i)) !== void 0; ++i) if (c > 255) throw new TypeError("Argument is not a valid bytestring");
		return x;
	};
	conversions["USVString"] = function(V) {
		const S = String(V);
		const n = S.length;
		const U = [];
		for (let i = 0; i < n; ++i) {
			const c = S.charCodeAt(i);
			if (c < 55296 || c > 57343) U.push(String.fromCodePoint(c));
			else if (56320 <= c && c <= 57343) U.push(String.fromCodePoint(65533));
			else if (i === n - 1) U.push(String.fromCodePoint(65533));
			else {
				const d = S.charCodeAt(i + 1);
				if (56320 <= d && d <= 57343) {
					const a = c & 1023;
					const b = d & 1023;
					U.push(String.fromCodePoint(65536 + 1024 * a + b));
					++i;
				} else U.push(String.fromCodePoint(65533));
			}
		}
		return U.join("");
	};
	conversions["Date"] = function(V, opts) {
		if (!(V instanceof Date)) throw new TypeError("Argument is not a Date object");
		if (isNaN(V)) return;
		return V;
	};
	conversions["RegExp"] = function(V, opts) {
		if (!(V instanceof RegExp)) V = new RegExp(V);
		return V;
	};
}));
//#endregion
//#region node_modules/whatwg-url/lib/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports.mixin = function mixin(target, source) {
		const keys = Object.getOwnPropertyNames(source);
		for (let i = 0; i < keys.length; ++i) Object.defineProperty(target, keys[i], Object.getOwnPropertyDescriptor(source, keys[i]));
	};
	module.exports.wrapperSymbol = Symbol("wrapper");
	module.exports.implSymbol = Symbol("impl");
	module.exports.wrapperForImpl = function(impl) {
		return impl[module.exports.wrapperSymbol];
	};
	module.exports.implForWrapper = function(wrapper) {
		return wrapper[module.exports.implSymbol];
	};
}));
//#endregion
//#region node_modules/tr46/lib/mappingTable.json
var mappingTable_exports = /* @__PURE__ */ __exportAll({ default: () => mappingTable_default });
var mappingTable_default;
var init_mappingTable = __esmMin((() => {
	mappingTable_default = /*#__PURE__*/ JSON.parse("[[[0,44],\"disallowed_STD3_valid\"],[[45,46],\"valid\"],[[47,47],\"disallowed_STD3_valid\"],[[48,57],\"valid\"],[[58,64],\"disallowed_STD3_valid\"],[[65,65],\"mapped\",[97]],[[66,66],\"mapped\",[98]],[[67,67],\"mapped\",[99]],[[68,68],\"mapped\",[100]],[[69,69],\"mapped\",[101]],[[70,70],\"mapped\",[102]],[[71,71],\"mapped\",[103]],[[72,72],\"mapped\",[104]],[[73,73],\"mapped\",[105]],[[74,74],\"mapped\",[106]],[[75,75],\"mapped\",[107]],[[76,76],\"mapped\",[108]],[[77,77],\"mapped\",[109]],[[78,78],\"mapped\",[110]],[[79,79],\"mapped\",[111]],[[80,80],\"mapped\",[112]],[[81,81],\"mapped\",[113]],[[82,82],\"mapped\",[114]],[[83,83],\"mapped\",[115]],[[84,84],\"mapped\",[116]],[[85,85],\"mapped\",[117]],[[86,86],\"mapped\",[118]],[[87,87],\"mapped\",[119]],[[88,88],\"mapped\",[120]],[[89,89],\"mapped\",[121]],[[90,90],\"mapped\",[122]],[[91,96],\"disallowed_STD3_valid\"],[[97,122],\"valid\"],[[123,127],\"disallowed_STD3_valid\"],[[128,159],\"disallowed\"],[[160,160],\"disallowed_STD3_mapped\",[32]],[[161,167],\"valid\",[],\"NV8\"],[[168,168],\"disallowed_STD3_mapped\",[32,776]],[[169,169],\"valid\",[],\"NV8\"],[[170,170],\"mapped\",[97]],[[171,172],\"valid\",[],\"NV8\"],[[173,173],\"ignored\"],[[174,174],\"valid\",[],\"NV8\"],[[175,175],\"disallowed_STD3_mapped\",[32,772]],[[176,177],\"valid\",[],\"NV8\"],[[178,178],\"mapped\",[50]],[[179,179],\"mapped\",[51]],[[180,180],\"disallowed_STD3_mapped\",[32,769]],[[181,181],\"mapped\",[956]],[[182,182],\"valid\",[],\"NV8\"],[[183,183],\"valid\"],[[184,184],\"disallowed_STD3_mapped\",[32,807]],[[185,185],\"mapped\",[49]],[[186,186],\"mapped\",[111]],[[187,187],\"valid\",[],\"NV8\"],[[188,188],\"mapped\",[49,8260,52]],[[189,189],\"mapped\",[49,8260,50]],[[190,190],\"mapped\",[51,8260,52]],[[191,191],\"valid\",[],\"NV8\"],[[192,192],\"mapped\",[224]],[[193,193],\"mapped\",[225]],[[194,194],\"mapped\",[226]],[[195,195],\"mapped\",[227]],[[196,196],\"mapped\",[228]],[[197,197],\"mapped\",[229]],[[198,198],\"mapped\",[230]],[[199,199],\"mapped\",[231]],[[200,200],\"mapped\",[232]],[[201,201],\"mapped\",[233]],[[202,202],\"mapped\",[234]],[[203,203],\"mapped\",[235]],[[204,204],\"mapped\",[236]],[[205,205],\"mapped\",[237]],[[206,206],\"mapped\",[238]],[[207,207],\"mapped\",[239]],[[208,208],\"mapped\",[240]],[[209,209],\"mapped\",[241]],[[210,210],\"mapped\",[242]],[[211,211],\"mapped\",[243]],[[212,212],\"mapped\",[244]],[[213,213],\"mapped\",[245]],[[214,214],\"mapped\",[246]],[[215,215],\"valid\",[],\"NV8\"],[[216,216],\"mapped\",[248]],[[217,217],\"mapped\",[249]],[[218,218],\"mapped\",[250]],[[219,219],\"mapped\",[251]],[[220,220],\"mapped\",[252]],[[221,221],\"mapped\",[253]],[[222,222],\"mapped\",[254]],[[223,223],\"deviation\",[115,115]],[[224,246],\"valid\"],[[247,247],\"valid\",[],\"NV8\"],[[248,255],\"valid\"],[[256,256],\"mapped\",[257]],[[257,257],\"valid\"],[[258,258],\"mapped\",[259]],[[259,259],\"valid\"],[[260,260],\"mapped\",[261]],[[261,261],\"valid\"],[[262,262],\"mapped\",[263]],[[263,263],\"valid\"],[[264,264],\"mapped\",[265]],[[265,265],\"valid\"],[[266,266],\"mapped\",[267]],[[267,267],\"valid\"],[[268,268],\"mapped\",[269]],[[269,269],\"valid\"],[[270,270],\"mapped\",[271]],[[271,271],\"valid\"],[[272,272],\"mapped\",[273]],[[273,273],\"valid\"],[[274,274],\"mapped\",[275]],[[275,275],\"valid\"],[[276,276],\"mapped\",[277]],[[277,277],\"valid\"],[[278,278],\"mapped\",[279]],[[279,279],\"valid\"],[[280,280],\"mapped\",[281]],[[281,281],\"valid\"],[[282,282],\"mapped\",[283]],[[283,283],\"valid\"],[[284,284],\"mapped\",[285]],[[285,285],\"valid\"],[[286,286],\"mapped\",[287]],[[287,287],\"valid\"],[[288,288],\"mapped\",[289]],[[289,289],\"valid\"],[[290,290],\"mapped\",[291]],[[291,291],\"valid\"],[[292,292],\"mapped\",[293]],[[293,293],\"valid\"],[[294,294],\"mapped\",[295]],[[295,295],\"valid\"],[[296,296],\"mapped\",[297]],[[297,297],\"valid\"],[[298,298],\"mapped\",[299]],[[299,299],\"valid\"],[[300,300],\"mapped\",[301]],[[301,301],\"valid\"],[[302,302],\"mapped\",[303]],[[303,303],\"valid\"],[[304,304],\"mapped\",[105,775]],[[305,305],\"valid\"],[[306,307],\"mapped\",[105,106]],[[308,308],\"mapped\",[309]],[[309,309],\"valid\"],[[310,310],\"mapped\",[311]],[[311,312],\"valid\"],[[313,313],\"mapped\",[314]],[[314,314],\"valid\"],[[315,315],\"mapped\",[316]],[[316,316],\"valid\"],[[317,317],\"mapped\",[318]],[[318,318],\"valid\"],[[319,320],\"mapped\",[108,183]],[[321,321],\"mapped\",[322]],[[322,322],\"valid\"],[[323,323],\"mapped\",[324]],[[324,324],\"valid\"],[[325,325],\"mapped\",[326]],[[326,326],\"valid\"],[[327,327],\"mapped\",[328]],[[328,328],\"valid\"],[[329,329],\"mapped\",[700,110]],[[330,330],\"mapped\",[331]],[[331,331],\"valid\"],[[332,332],\"mapped\",[333]],[[333,333],\"valid\"],[[334,334],\"mapped\",[335]],[[335,335],\"valid\"],[[336,336],\"mapped\",[337]],[[337,337],\"valid\"],[[338,338],\"mapped\",[339]],[[339,339],\"valid\"],[[340,340],\"mapped\",[341]],[[341,341],\"valid\"],[[342,342],\"mapped\",[343]],[[343,343],\"valid\"],[[344,344],\"mapped\",[345]],[[345,345],\"valid\"],[[346,346],\"mapped\",[347]],[[347,347],\"valid\"],[[348,348],\"mapped\",[349]],[[349,349],\"valid\"],[[350,350],\"mapped\",[351]],[[351,351],\"valid\"],[[352,352],\"mapped\",[353]],[[353,353],\"valid\"],[[354,354],\"mapped\",[355]],[[355,355],\"valid\"],[[356,356],\"mapped\",[357]],[[357,357],\"valid\"],[[358,358],\"mapped\",[359]],[[359,359],\"valid\"],[[360,360],\"mapped\",[361]],[[361,361],\"valid\"],[[362,362],\"mapped\",[363]],[[363,363],\"valid\"],[[364,364],\"mapped\",[365]],[[365,365],\"valid\"],[[366,366],\"mapped\",[367]],[[367,367],\"valid\"],[[368,368],\"mapped\",[369]],[[369,369],\"valid\"],[[370,370],\"mapped\",[371]],[[371,371],\"valid\"],[[372,372],\"mapped\",[373]],[[373,373],\"valid\"],[[374,374],\"mapped\",[375]],[[375,375],\"valid\"],[[376,376],\"mapped\",[255]],[[377,377],\"mapped\",[378]],[[378,378],\"valid\"],[[379,379],\"mapped\",[380]],[[380,380],\"valid\"],[[381,381],\"mapped\",[382]],[[382,382],\"valid\"],[[383,383],\"mapped\",[115]],[[384,384],\"valid\"],[[385,385],\"mapped\",[595]],[[386,386],\"mapped\",[387]],[[387,387],\"valid\"],[[388,388],\"mapped\",[389]],[[389,389],\"valid\"],[[390,390],\"mapped\",[596]],[[391,391],\"mapped\",[392]],[[392,392],\"valid\"],[[393,393],\"mapped\",[598]],[[394,394],\"mapped\",[599]],[[395,395],\"mapped\",[396]],[[396,397],\"valid\"],[[398,398],\"mapped\",[477]],[[399,399],\"mapped\",[601]],[[400,400],\"mapped\",[603]],[[401,401],\"mapped\",[402]],[[402,402],\"valid\"],[[403,403],\"mapped\",[608]],[[404,404],\"mapped\",[611]],[[405,405],\"valid\"],[[406,406],\"mapped\",[617]],[[407,407],\"mapped\",[616]],[[408,408],\"mapped\",[409]],[[409,411],\"valid\"],[[412,412],\"mapped\",[623]],[[413,413],\"mapped\",[626]],[[414,414],\"valid\"],[[415,415],\"mapped\",[629]],[[416,416],\"mapped\",[417]],[[417,417],\"valid\"],[[418,418],\"mapped\",[419]],[[419,419],\"valid\"],[[420,420],\"mapped\",[421]],[[421,421],\"valid\"],[[422,422],\"mapped\",[640]],[[423,423],\"mapped\",[424]],[[424,424],\"valid\"],[[425,425],\"mapped\",[643]],[[426,427],\"valid\"],[[428,428],\"mapped\",[429]],[[429,429],\"valid\"],[[430,430],\"mapped\",[648]],[[431,431],\"mapped\",[432]],[[432,432],\"valid\"],[[433,433],\"mapped\",[650]],[[434,434],\"mapped\",[651]],[[435,435],\"mapped\",[436]],[[436,436],\"valid\"],[[437,437],\"mapped\",[438]],[[438,438],\"valid\"],[[439,439],\"mapped\",[658]],[[440,440],\"mapped\",[441]],[[441,443],\"valid\"],[[444,444],\"mapped\",[445]],[[445,451],\"valid\"],[[452,454],\"mapped\",[100,382]],[[455,457],\"mapped\",[108,106]],[[458,460],\"mapped\",[110,106]],[[461,461],\"mapped\",[462]],[[462,462],\"valid\"],[[463,463],\"mapped\",[464]],[[464,464],\"valid\"],[[465,465],\"mapped\",[466]],[[466,466],\"valid\"],[[467,467],\"mapped\",[468]],[[468,468],\"valid\"],[[469,469],\"mapped\",[470]],[[470,470],\"valid\"],[[471,471],\"mapped\",[472]],[[472,472],\"valid\"],[[473,473],\"mapped\",[474]],[[474,474],\"valid\"],[[475,475],\"mapped\",[476]],[[476,477],\"valid\"],[[478,478],\"mapped\",[479]],[[479,479],\"valid\"],[[480,480],\"mapped\",[481]],[[481,481],\"valid\"],[[482,482],\"mapped\",[483]],[[483,483],\"valid\"],[[484,484],\"mapped\",[485]],[[485,485],\"valid\"],[[486,486],\"mapped\",[487]],[[487,487],\"valid\"],[[488,488],\"mapped\",[489]],[[489,489],\"valid\"],[[490,490],\"mapped\",[491]],[[491,491],\"valid\"],[[492,492],\"mapped\",[493]],[[493,493],\"valid\"],[[494,494],\"mapped\",[495]],[[495,496],\"valid\"],[[497,499],\"mapped\",[100,122]],[[500,500],\"mapped\",[501]],[[501,501],\"valid\"],[[502,502],\"mapped\",[405]],[[503,503],\"mapped\",[447]],[[504,504],\"mapped\",[505]],[[505,505],\"valid\"],[[506,506],\"mapped\",[507]],[[507,507],\"valid\"],[[508,508],\"mapped\",[509]],[[509,509],\"valid\"],[[510,510],\"mapped\",[511]],[[511,511],\"valid\"],[[512,512],\"mapped\",[513]],[[513,513],\"valid\"],[[514,514],\"mapped\",[515]],[[515,515],\"valid\"],[[516,516],\"mapped\",[517]],[[517,517],\"valid\"],[[518,518],\"mapped\",[519]],[[519,519],\"valid\"],[[520,520],\"mapped\",[521]],[[521,521],\"valid\"],[[522,522],\"mapped\",[523]],[[523,523],\"valid\"],[[524,524],\"mapped\",[525]],[[525,525],\"valid\"],[[526,526],\"mapped\",[527]],[[527,527],\"valid\"],[[528,528],\"mapped\",[529]],[[529,529],\"valid\"],[[530,530],\"mapped\",[531]],[[531,531],\"valid\"],[[532,532],\"mapped\",[533]],[[533,533],\"valid\"],[[534,534],\"mapped\",[535]],[[535,535],\"valid\"],[[536,536],\"mapped\",[537]],[[537,537],\"valid\"],[[538,538],\"mapped\",[539]],[[539,539],\"valid\"],[[540,540],\"mapped\",[541]],[[541,541],\"valid\"],[[542,542],\"mapped\",[543]],[[543,543],\"valid\"],[[544,544],\"mapped\",[414]],[[545,545],\"valid\"],[[546,546],\"mapped\",[547]],[[547,547],\"valid\"],[[548,548],\"mapped\",[549]],[[549,549],\"valid\"],[[550,550],\"mapped\",[551]],[[551,551],\"valid\"],[[552,552],\"mapped\",[553]],[[553,553],\"valid\"],[[554,554],\"mapped\",[555]],[[555,555],\"valid\"],[[556,556],\"mapped\",[557]],[[557,557],\"valid\"],[[558,558],\"mapped\",[559]],[[559,559],\"valid\"],[[560,560],\"mapped\",[561]],[[561,561],\"valid\"],[[562,562],\"mapped\",[563]],[[563,563],\"valid\"],[[564,566],\"valid\"],[[567,569],\"valid\"],[[570,570],\"mapped\",[11365]],[[571,571],\"mapped\",[572]],[[572,572],\"valid\"],[[573,573],\"mapped\",[410]],[[574,574],\"mapped\",[11366]],[[575,576],\"valid\"],[[577,577],\"mapped\",[578]],[[578,578],\"valid\"],[[579,579],\"mapped\",[384]],[[580,580],\"mapped\",[649]],[[581,581],\"mapped\",[652]],[[582,582],\"mapped\",[583]],[[583,583],\"valid\"],[[584,584],\"mapped\",[585]],[[585,585],\"valid\"],[[586,586],\"mapped\",[587]],[[587,587],\"valid\"],[[588,588],\"mapped\",[589]],[[589,589],\"valid\"],[[590,590],\"mapped\",[591]],[[591,591],\"valid\"],[[592,680],\"valid\"],[[681,685],\"valid\"],[[686,687],\"valid\"],[[688,688],\"mapped\",[104]],[[689,689],\"mapped\",[614]],[[690,690],\"mapped\",[106]],[[691,691],\"mapped\",[114]],[[692,692],\"mapped\",[633]],[[693,693],\"mapped\",[635]],[[694,694],\"mapped\",[641]],[[695,695],\"mapped\",[119]],[[696,696],\"mapped\",[121]],[[697,705],\"valid\"],[[706,709],\"valid\",[],\"NV8\"],[[710,721],\"valid\"],[[722,727],\"valid\",[],\"NV8\"],[[728,728],\"disallowed_STD3_mapped\",[32,774]],[[729,729],\"disallowed_STD3_mapped\",[32,775]],[[730,730],\"disallowed_STD3_mapped\",[32,778]],[[731,731],\"disallowed_STD3_mapped\",[32,808]],[[732,732],\"disallowed_STD3_mapped\",[32,771]],[[733,733],\"disallowed_STD3_mapped\",[32,779]],[[734,734],\"valid\",[],\"NV8\"],[[735,735],\"valid\",[],\"NV8\"],[[736,736],\"mapped\",[611]],[[737,737],\"mapped\",[108]],[[738,738],\"mapped\",[115]],[[739,739],\"mapped\",[120]],[[740,740],\"mapped\",[661]],[[741,745],\"valid\",[],\"NV8\"],[[746,747],\"valid\",[],\"NV8\"],[[748,748],\"valid\"],[[749,749],\"valid\",[],\"NV8\"],[[750,750],\"valid\"],[[751,767],\"valid\",[],\"NV8\"],[[768,831],\"valid\"],[[832,832],\"mapped\",[768]],[[833,833],\"mapped\",[769]],[[834,834],\"valid\"],[[835,835],\"mapped\",[787]],[[836,836],\"mapped\",[776,769]],[[837,837],\"mapped\",[953]],[[838,846],\"valid\"],[[847,847],\"ignored\"],[[848,855],\"valid\"],[[856,860],\"valid\"],[[861,863],\"valid\"],[[864,865],\"valid\"],[[866,866],\"valid\"],[[867,879],\"valid\"],[[880,880],\"mapped\",[881]],[[881,881],\"valid\"],[[882,882],\"mapped\",[883]],[[883,883],\"valid\"],[[884,884],\"mapped\",[697]],[[885,885],\"valid\"],[[886,886],\"mapped\",[887]],[[887,887],\"valid\"],[[888,889],\"disallowed\"],[[890,890],\"disallowed_STD3_mapped\",[32,953]],[[891,893],\"valid\"],[[894,894],\"disallowed_STD3_mapped\",[59]],[[895,895],\"mapped\",[1011]],[[896,899],\"disallowed\"],[[900,900],\"disallowed_STD3_mapped\",[32,769]],[[901,901],\"disallowed_STD3_mapped\",[32,776,769]],[[902,902],\"mapped\",[940]],[[903,903],\"mapped\",[183]],[[904,904],\"mapped\",[941]],[[905,905],\"mapped\",[942]],[[906,906],\"mapped\",[943]],[[907,907],\"disallowed\"],[[908,908],\"mapped\",[972]],[[909,909],\"disallowed\"],[[910,910],\"mapped\",[973]],[[911,911],\"mapped\",[974]],[[912,912],\"valid\"],[[913,913],\"mapped\",[945]],[[914,914],\"mapped\",[946]],[[915,915],\"mapped\",[947]],[[916,916],\"mapped\",[948]],[[917,917],\"mapped\",[949]],[[918,918],\"mapped\",[950]],[[919,919],\"mapped\",[951]],[[920,920],\"mapped\",[952]],[[921,921],\"mapped\",[953]],[[922,922],\"mapped\",[954]],[[923,923],\"mapped\",[955]],[[924,924],\"mapped\",[956]],[[925,925],\"mapped\",[957]],[[926,926],\"mapped\",[958]],[[927,927],\"mapped\",[959]],[[928,928],\"mapped\",[960]],[[929,929],\"mapped\",[961]],[[930,930],\"disallowed\"],[[931,931],\"mapped\",[963]],[[932,932],\"mapped\",[964]],[[933,933],\"mapped\",[965]],[[934,934],\"mapped\",[966]],[[935,935],\"mapped\",[967]],[[936,936],\"mapped\",[968]],[[937,937],\"mapped\",[969]],[[938,938],\"mapped\",[970]],[[939,939],\"mapped\",[971]],[[940,961],\"valid\"],[[962,962],\"deviation\",[963]],[[963,974],\"valid\"],[[975,975],\"mapped\",[983]],[[976,976],\"mapped\",[946]],[[977,977],\"mapped\",[952]],[[978,978],\"mapped\",[965]],[[979,979],\"mapped\",[973]],[[980,980],\"mapped\",[971]],[[981,981],\"mapped\",[966]],[[982,982],\"mapped\",[960]],[[983,983],\"valid\"],[[984,984],\"mapped\",[985]],[[985,985],\"valid\"],[[986,986],\"mapped\",[987]],[[987,987],\"valid\"],[[988,988],\"mapped\",[989]],[[989,989],\"valid\"],[[990,990],\"mapped\",[991]],[[991,991],\"valid\"],[[992,992],\"mapped\",[993]],[[993,993],\"valid\"],[[994,994],\"mapped\",[995]],[[995,995],\"valid\"],[[996,996],\"mapped\",[997]],[[997,997],\"valid\"],[[998,998],\"mapped\",[999]],[[999,999],\"valid\"],[[1000,1000],\"mapped\",[1001]],[[1001,1001],\"valid\"],[[1002,1002],\"mapped\",[1003]],[[1003,1003],\"valid\"],[[1004,1004],\"mapped\",[1005]],[[1005,1005],\"valid\"],[[1006,1006],\"mapped\",[1007]],[[1007,1007],\"valid\"],[[1008,1008],\"mapped\",[954]],[[1009,1009],\"mapped\",[961]],[[1010,1010],\"mapped\",[963]],[[1011,1011],\"valid\"],[[1012,1012],\"mapped\",[952]],[[1013,1013],\"mapped\",[949]],[[1014,1014],\"valid\",[],\"NV8\"],[[1015,1015],\"mapped\",[1016]],[[1016,1016],\"valid\"],[[1017,1017],\"mapped\",[963]],[[1018,1018],\"mapped\",[1019]],[[1019,1019],\"valid\"],[[1020,1020],\"valid\"],[[1021,1021],\"mapped\",[891]],[[1022,1022],\"mapped\",[892]],[[1023,1023],\"mapped\",[893]],[[1024,1024],\"mapped\",[1104]],[[1025,1025],\"mapped\",[1105]],[[1026,1026],\"mapped\",[1106]],[[1027,1027],\"mapped\",[1107]],[[1028,1028],\"mapped\",[1108]],[[1029,1029],\"mapped\",[1109]],[[1030,1030],\"mapped\",[1110]],[[1031,1031],\"mapped\",[1111]],[[1032,1032],\"mapped\",[1112]],[[1033,1033],\"mapped\",[1113]],[[1034,1034],\"mapped\",[1114]],[[1035,1035],\"mapped\",[1115]],[[1036,1036],\"mapped\",[1116]],[[1037,1037],\"mapped\",[1117]],[[1038,1038],\"mapped\",[1118]],[[1039,1039],\"mapped\",[1119]],[[1040,1040],\"mapped\",[1072]],[[1041,1041],\"mapped\",[1073]],[[1042,1042],\"mapped\",[1074]],[[1043,1043],\"mapped\",[1075]],[[1044,1044],\"mapped\",[1076]],[[1045,1045],\"mapped\",[1077]],[[1046,1046],\"mapped\",[1078]],[[1047,1047],\"mapped\",[1079]],[[1048,1048],\"mapped\",[1080]],[[1049,1049],\"mapped\",[1081]],[[1050,1050],\"mapped\",[1082]],[[1051,1051],\"mapped\",[1083]],[[1052,1052],\"mapped\",[1084]],[[1053,1053],\"mapped\",[1085]],[[1054,1054],\"mapped\",[1086]],[[1055,1055],\"mapped\",[1087]],[[1056,1056],\"mapped\",[1088]],[[1057,1057],\"mapped\",[1089]],[[1058,1058],\"mapped\",[1090]],[[1059,1059],\"mapped\",[1091]],[[1060,1060],\"mapped\",[1092]],[[1061,1061],\"mapped\",[1093]],[[1062,1062],\"mapped\",[1094]],[[1063,1063],\"mapped\",[1095]],[[1064,1064],\"mapped\",[1096]],[[1065,1065],\"mapped\",[1097]],[[1066,1066],\"mapped\",[1098]],[[1067,1067],\"mapped\",[1099]],[[1068,1068],\"mapped\",[1100]],[[1069,1069],\"mapped\",[1101]],[[1070,1070],\"mapped\",[1102]],[[1071,1071],\"mapped\",[1103]],[[1072,1103],\"valid\"],[[1104,1104],\"valid\"],[[1105,1116],\"valid\"],[[1117,1117],\"valid\"],[[1118,1119],\"valid\"],[[1120,1120],\"mapped\",[1121]],[[1121,1121],\"valid\"],[[1122,1122],\"mapped\",[1123]],[[1123,1123],\"valid\"],[[1124,1124],\"mapped\",[1125]],[[1125,1125],\"valid\"],[[1126,1126],\"mapped\",[1127]],[[1127,1127],\"valid\"],[[1128,1128],\"mapped\",[1129]],[[1129,1129],\"valid\"],[[1130,1130],\"mapped\",[1131]],[[1131,1131],\"valid\"],[[1132,1132],\"mapped\",[1133]],[[1133,1133],\"valid\"],[[1134,1134],\"mapped\",[1135]],[[1135,1135],\"valid\"],[[1136,1136],\"mapped\",[1137]],[[1137,1137],\"valid\"],[[1138,1138],\"mapped\",[1139]],[[1139,1139],\"valid\"],[[1140,1140],\"mapped\",[1141]],[[1141,1141],\"valid\"],[[1142,1142],\"mapped\",[1143]],[[1143,1143],\"valid\"],[[1144,1144],\"mapped\",[1145]],[[1145,1145],\"valid\"],[[1146,1146],\"mapped\",[1147]],[[1147,1147],\"valid\"],[[1148,1148],\"mapped\",[1149]],[[1149,1149],\"valid\"],[[1150,1150],\"mapped\",[1151]],[[1151,1151],\"valid\"],[[1152,1152],\"mapped\",[1153]],[[1153,1153],\"valid\"],[[1154,1154],\"valid\",[],\"NV8\"],[[1155,1158],\"valid\"],[[1159,1159],\"valid\"],[[1160,1161],\"valid\",[],\"NV8\"],[[1162,1162],\"mapped\",[1163]],[[1163,1163],\"valid\"],[[1164,1164],\"mapped\",[1165]],[[1165,1165],\"valid\"],[[1166,1166],\"mapped\",[1167]],[[1167,1167],\"valid\"],[[1168,1168],\"mapped\",[1169]],[[1169,1169],\"valid\"],[[1170,1170],\"mapped\",[1171]],[[1171,1171],\"valid\"],[[1172,1172],\"mapped\",[1173]],[[1173,1173],\"valid\"],[[1174,1174],\"mapped\",[1175]],[[1175,1175],\"valid\"],[[1176,1176],\"mapped\",[1177]],[[1177,1177],\"valid\"],[[1178,1178],\"mapped\",[1179]],[[1179,1179],\"valid\"],[[1180,1180],\"mapped\",[1181]],[[1181,1181],\"valid\"],[[1182,1182],\"mapped\",[1183]],[[1183,1183],\"valid\"],[[1184,1184],\"mapped\",[1185]],[[1185,1185],\"valid\"],[[1186,1186],\"mapped\",[1187]],[[1187,1187],\"valid\"],[[1188,1188],\"mapped\",[1189]],[[1189,1189],\"valid\"],[[1190,1190],\"mapped\",[1191]],[[1191,1191],\"valid\"],[[1192,1192],\"mapped\",[1193]],[[1193,1193],\"valid\"],[[1194,1194],\"mapped\",[1195]],[[1195,1195],\"valid\"],[[1196,1196],\"mapped\",[1197]],[[1197,1197],\"valid\"],[[1198,1198],\"mapped\",[1199]],[[1199,1199],\"valid\"],[[1200,1200],\"mapped\",[1201]],[[1201,1201],\"valid\"],[[1202,1202],\"mapped\",[1203]],[[1203,1203],\"valid\"],[[1204,1204],\"mapped\",[1205]],[[1205,1205],\"valid\"],[[1206,1206],\"mapped\",[1207]],[[1207,1207],\"valid\"],[[1208,1208],\"mapped\",[1209]],[[1209,1209],\"valid\"],[[1210,1210],\"mapped\",[1211]],[[1211,1211],\"valid\"],[[1212,1212],\"mapped\",[1213]],[[1213,1213],\"valid\"],[[1214,1214],\"mapped\",[1215]],[[1215,1215],\"valid\"],[[1216,1216],\"disallowed\"],[[1217,1217],\"mapped\",[1218]],[[1218,1218],\"valid\"],[[1219,1219],\"mapped\",[1220]],[[1220,1220],\"valid\"],[[1221,1221],\"mapped\",[1222]],[[1222,1222],\"valid\"],[[1223,1223],\"mapped\",[1224]],[[1224,1224],\"valid\"],[[1225,1225],\"mapped\",[1226]],[[1226,1226],\"valid\"],[[1227,1227],\"mapped\",[1228]],[[1228,1228],\"valid\"],[[1229,1229],\"mapped\",[1230]],[[1230,1230],\"valid\"],[[1231,1231],\"valid\"],[[1232,1232],\"mapped\",[1233]],[[1233,1233],\"valid\"],[[1234,1234],\"mapped\",[1235]],[[1235,1235],\"valid\"],[[1236,1236],\"mapped\",[1237]],[[1237,1237],\"valid\"],[[1238,1238],\"mapped\",[1239]],[[1239,1239],\"valid\"],[[1240,1240],\"mapped\",[1241]],[[1241,1241],\"valid\"],[[1242,1242],\"mapped\",[1243]],[[1243,1243],\"valid\"],[[1244,1244],\"mapped\",[1245]],[[1245,1245],\"valid\"],[[1246,1246],\"mapped\",[1247]],[[1247,1247],\"valid\"],[[1248,1248],\"mapped\",[1249]],[[1249,1249],\"valid\"],[[1250,1250],\"mapped\",[1251]],[[1251,1251],\"valid\"],[[1252,1252],\"mapped\",[1253]],[[1253,1253],\"valid\"],[[1254,1254],\"mapped\",[1255]],[[1255,1255],\"valid\"],[[1256,1256],\"mapped\",[1257]],[[1257,1257],\"valid\"],[[1258,1258],\"mapped\",[1259]],[[1259,1259],\"valid\"],[[1260,1260],\"mapped\",[1261]],[[1261,1261],\"valid\"],[[1262,1262],\"mapped\",[1263]],[[1263,1263],\"valid\"],[[1264,1264],\"mapped\",[1265]],[[1265,1265],\"valid\"],[[1266,1266],\"mapped\",[1267]],[[1267,1267],\"valid\"],[[1268,1268],\"mapped\",[1269]],[[1269,1269],\"valid\"],[[1270,1270],\"mapped\",[1271]],[[1271,1271],\"valid\"],[[1272,1272],\"mapped\",[1273]],[[1273,1273],\"valid\"],[[1274,1274],\"mapped\",[1275]],[[1275,1275],\"valid\"],[[1276,1276],\"mapped\",[1277]],[[1277,1277],\"valid\"],[[1278,1278],\"mapped\",[1279]],[[1279,1279],\"valid\"],[[1280,1280],\"mapped\",[1281]],[[1281,1281],\"valid\"],[[1282,1282],\"mapped\",[1283]],[[1283,1283],\"valid\"],[[1284,1284],\"mapped\",[1285]],[[1285,1285],\"valid\"],[[1286,1286],\"mapped\",[1287]],[[1287,1287],\"valid\"],[[1288,1288],\"mapped\",[1289]],[[1289,1289],\"valid\"],[[1290,1290],\"mapped\",[1291]],[[1291,1291],\"valid\"],[[1292,1292],\"mapped\",[1293]],[[1293,1293],\"valid\"],[[1294,1294],\"mapped\",[1295]],[[1295,1295],\"valid\"],[[1296,1296],\"mapped\",[1297]],[[1297,1297],\"valid\"],[[1298,1298],\"mapped\",[1299]],[[1299,1299],\"valid\"],[[1300,1300],\"mapped\",[1301]],[[1301,1301],\"valid\"],[[1302,1302],\"mapped\",[1303]],[[1303,1303],\"valid\"],[[1304,1304],\"mapped\",[1305]],[[1305,1305],\"valid\"],[[1306,1306],\"mapped\",[1307]],[[1307,1307],\"valid\"],[[1308,1308],\"mapped\",[1309]],[[1309,1309],\"valid\"],[[1310,1310],\"mapped\",[1311]],[[1311,1311],\"valid\"],[[1312,1312],\"mapped\",[1313]],[[1313,1313],\"valid\"],[[1314,1314],\"mapped\",[1315]],[[1315,1315],\"valid\"],[[1316,1316],\"mapped\",[1317]],[[1317,1317],\"valid\"],[[1318,1318],\"mapped\",[1319]],[[1319,1319],\"valid\"],[[1320,1320],\"mapped\",[1321]],[[1321,1321],\"valid\"],[[1322,1322],\"mapped\",[1323]],[[1323,1323],\"valid\"],[[1324,1324],\"mapped\",[1325]],[[1325,1325],\"valid\"],[[1326,1326],\"mapped\",[1327]],[[1327,1327],\"valid\"],[[1328,1328],\"disallowed\"],[[1329,1329],\"mapped\",[1377]],[[1330,1330],\"mapped\",[1378]],[[1331,1331],\"mapped\",[1379]],[[1332,1332],\"mapped\",[1380]],[[1333,1333],\"mapped\",[1381]],[[1334,1334],\"mapped\",[1382]],[[1335,1335],\"mapped\",[1383]],[[1336,1336],\"mapped\",[1384]],[[1337,1337],\"mapped\",[1385]],[[1338,1338],\"mapped\",[1386]],[[1339,1339],\"mapped\",[1387]],[[1340,1340],\"mapped\",[1388]],[[1341,1341],\"mapped\",[1389]],[[1342,1342],\"mapped\",[1390]],[[1343,1343],\"mapped\",[1391]],[[1344,1344],\"mapped\",[1392]],[[1345,1345],\"mapped\",[1393]],[[1346,1346],\"mapped\",[1394]],[[1347,1347],\"mapped\",[1395]],[[1348,1348],\"mapped\",[1396]],[[1349,1349],\"mapped\",[1397]],[[1350,1350],\"mapped\",[1398]],[[1351,1351],\"mapped\",[1399]],[[1352,1352],\"mapped\",[1400]],[[1353,1353],\"mapped\",[1401]],[[1354,1354],\"mapped\",[1402]],[[1355,1355],\"mapped\",[1403]],[[1356,1356],\"mapped\",[1404]],[[1357,1357],\"mapped\",[1405]],[[1358,1358],\"mapped\",[1406]],[[1359,1359],\"mapped\",[1407]],[[1360,1360],\"mapped\",[1408]],[[1361,1361],\"mapped\",[1409]],[[1362,1362],\"mapped\",[1410]],[[1363,1363],\"mapped\",[1411]],[[1364,1364],\"mapped\",[1412]],[[1365,1365],\"mapped\",[1413]],[[1366,1366],\"mapped\",[1414]],[[1367,1368],\"disallowed\"],[[1369,1369],\"valid\"],[[1370,1375],\"valid\",[],\"NV8\"],[[1376,1376],\"disallowed\"],[[1377,1414],\"valid\"],[[1415,1415],\"mapped\",[1381,1410]],[[1416,1416],\"disallowed\"],[[1417,1417],\"valid\",[],\"NV8\"],[[1418,1418],\"valid\",[],\"NV8\"],[[1419,1420],\"disallowed\"],[[1421,1422],\"valid\",[],\"NV8\"],[[1423,1423],\"valid\",[],\"NV8\"],[[1424,1424],\"disallowed\"],[[1425,1441],\"valid\"],[[1442,1442],\"valid\"],[[1443,1455],\"valid\"],[[1456,1465],\"valid\"],[[1466,1466],\"valid\"],[[1467,1469],\"valid\"],[[1470,1470],\"valid\",[],\"NV8\"],[[1471,1471],\"valid\"],[[1472,1472],\"valid\",[],\"NV8\"],[[1473,1474],\"valid\"],[[1475,1475],\"valid\",[],\"NV8\"],[[1476,1476],\"valid\"],[[1477,1477],\"valid\"],[[1478,1478],\"valid\",[],\"NV8\"],[[1479,1479],\"valid\"],[[1480,1487],\"disallowed\"],[[1488,1514],\"valid\"],[[1515,1519],\"disallowed\"],[[1520,1524],\"valid\"],[[1525,1535],\"disallowed\"],[[1536,1539],\"disallowed\"],[[1540,1540],\"disallowed\"],[[1541,1541],\"disallowed\"],[[1542,1546],\"valid\",[],\"NV8\"],[[1547,1547],\"valid\",[],\"NV8\"],[[1548,1548],\"valid\",[],\"NV8\"],[[1549,1551],\"valid\",[],\"NV8\"],[[1552,1557],\"valid\"],[[1558,1562],\"valid\"],[[1563,1563],\"valid\",[],\"NV8\"],[[1564,1564],\"disallowed\"],[[1565,1565],\"disallowed\"],[[1566,1566],\"valid\",[],\"NV8\"],[[1567,1567],\"valid\",[],\"NV8\"],[[1568,1568],\"valid\"],[[1569,1594],\"valid\"],[[1595,1599],\"valid\"],[[1600,1600],\"valid\",[],\"NV8\"],[[1601,1618],\"valid\"],[[1619,1621],\"valid\"],[[1622,1624],\"valid\"],[[1625,1630],\"valid\"],[[1631,1631],\"valid\"],[[1632,1641],\"valid\"],[[1642,1645],\"valid\",[],\"NV8\"],[[1646,1647],\"valid\"],[[1648,1652],\"valid\"],[[1653,1653],\"mapped\",[1575,1652]],[[1654,1654],\"mapped\",[1608,1652]],[[1655,1655],\"mapped\",[1735,1652]],[[1656,1656],\"mapped\",[1610,1652]],[[1657,1719],\"valid\"],[[1720,1721],\"valid\"],[[1722,1726],\"valid\"],[[1727,1727],\"valid\"],[[1728,1742],\"valid\"],[[1743,1743],\"valid\"],[[1744,1747],\"valid\"],[[1748,1748],\"valid\",[],\"NV8\"],[[1749,1756],\"valid\"],[[1757,1757],\"disallowed\"],[[1758,1758],\"valid\",[],\"NV8\"],[[1759,1768],\"valid\"],[[1769,1769],\"valid\",[],\"NV8\"],[[1770,1773],\"valid\"],[[1774,1775],\"valid\"],[[1776,1785],\"valid\"],[[1786,1790],\"valid\"],[[1791,1791],\"valid\"],[[1792,1805],\"valid\",[],\"NV8\"],[[1806,1806],\"disallowed\"],[[1807,1807],\"disallowed\"],[[1808,1836],\"valid\"],[[1837,1839],\"valid\"],[[1840,1866],\"valid\"],[[1867,1868],\"disallowed\"],[[1869,1871],\"valid\"],[[1872,1901],\"valid\"],[[1902,1919],\"valid\"],[[1920,1968],\"valid\"],[[1969,1969],\"valid\"],[[1970,1983],\"disallowed\"],[[1984,2037],\"valid\"],[[2038,2042],\"valid\",[],\"NV8\"],[[2043,2047],\"disallowed\"],[[2048,2093],\"valid\"],[[2094,2095],\"disallowed\"],[[2096,2110],\"valid\",[],\"NV8\"],[[2111,2111],\"disallowed\"],[[2112,2139],\"valid\"],[[2140,2141],\"disallowed\"],[[2142,2142],\"valid\",[],\"NV8\"],[[2143,2207],\"disallowed\"],[[2208,2208],\"valid\"],[[2209,2209],\"valid\"],[[2210,2220],\"valid\"],[[2221,2226],\"valid\"],[[2227,2228],\"valid\"],[[2229,2274],\"disallowed\"],[[2275,2275],\"valid\"],[[2276,2302],\"valid\"],[[2303,2303],\"valid\"],[[2304,2304],\"valid\"],[[2305,2307],\"valid\"],[[2308,2308],\"valid\"],[[2309,2361],\"valid\"],[[2362,2363],\"valid\"],[[2364,2381],\"valid\"],[[2382,2382],\"valid\"],[[2383,2383],\"valid\"],[[2384,2388],\"valid\"],[[2389,2389],\"valid\"],[[2390,2391],\"valid\"],[[2392,2392],\"mapped\",[2325,2364]],[[2393,2393],\"mapped\",[2326,2364]],[[2394,2394],\"mapped\",[2327,2364]],[[2395,2395],\"mapped\",[2332,2364]],[[2396,2396],\"mapped\",[2337,2364]],[[2397,2397],\"mapped\",[2338,2364]],[[2398,2398],\"mapped\",[2347,2364]],[[2399,2399],\"mapped\",[2351,2364]],[[2400,2403],\"valid\"],[[2404,2405],\"valid\",[],\"NV8\"],[[2406,2415],\"valid\"],[[2416,2416],\"valid\",[],\"NV8\"],[[2417,2418],\"valid\"],[[2419,2423],\"valid\"],[[2424,2424],\"valid\"],[[2425,2426],\"valid\"],[[2427,2428],\"valid\"],[[2429,2429],\"valid\"],[[2430,2431],\"valid\"],[[2432,2432],\"valid\"],[[2433,2435],\"valid\"],[[2436,2436],\"disallowed\"],[[2437,2444],\"valid\"],[[2445,2446],\"disallowed\"],[[2447,2448],\"valid\"],[[2449,2450],\"disallowed\"],[[2451,2472],\"valid\"],[[2473,2473],\"disallowed\"],[[2474,2480],\"valid\"],[[2481,2481],\"disallowed\"],[[2482,2482],\"valid\"],[[2483,2485],\"disallowed\"],[[2486,2489],\"valid\"],[[2490,2491],\"disallowed\"],[[2492,2492],\"valid\"],[[2493,2493],\"valid\"],[[2494,2500],\"valid\"],[[2501,2502],\"disallowed\"],[[2503,2504],\"valid\"],[[2505,2506],\"disallowed\"],[[2507,2509],\"valid\"],[[2510,2510],\"valid\"],[[2511,2518],\"disallowed\"],[[2519,2519],\"valid\"],[[2520,2523],\"disallowed\"],[[2524,2524],\"mapped\",[2465,2492]],[[2525,2525],\"mapped\",[2466,2492]],[[2526,2526],\"disallowed\"],[[2527,2527],\"mapped\",[2479,2492]],[[2528,2531],\"valid\"],[[2532,2533],\"disallowed\"],[[2534,2545],\"valid\"],[[2546,2554],\"valid\",[],\"NV8\"],[[2555,2555],\"valid\",[],\"NV8\"],[[2556,2560],\"disallowed\"],[[2561,2561],\"valid\"],[[2562,2562],\"valid\"],[[2563,2563],\"valid\"],[[2564,2564],\"disallowed\"],[[2565,2570],\"valid\"],[[2571,2574],\"disallowed\"],[[2575,2576],\"valid\"],[[2577,2578],\"disallowed\"],[[2579,2600],\"valid\"],[[2601,2601],\"disallowed\"],[[2602,2608],\"valid\"],[[2609,2609],\"disallowed\"],[[2610,2610],\"valid\"],[[2611,2611],\"mapped\",[2610,2620]],[[2612,2612],\"disallowed\"],[[2613,2613],\"valid\"],[[2614,2614],\"mapped\",[2616,2620]],[[2615,2615],\"disallowed\"],[[2616,2617],\"valid\"],[[2618,2619],\"disallowed\"],[[2620,2620],\"valid\"],[[2621,2621],\"disallowed\"],[[2622,2626],\"valid\"],[[2627,2630],\"disallowed\"],[[2631,2632],\"valid\"],[[2633,2634],\"disallowed\"],[[2635,2637],\"valid\"],[[2638,2640],\"disallowed\"],[[2641,2641],\"valid\"],[[2642,2648],\"disallowed\"],[[2649,2649],\"mapped\",[2582,2620]],[[2650,2650],\"mapped\",[2583,2620]],[[2651,2651],\"mapped\",[2588,2620]],[[2652,2652],\"valid\"],[[2653,2653],\"disallowed\"],[[2654,2654],\"mapped\",[2603,2620]],[[2655,2661],\"disallowed\"],[[2662,2676],\"valid\"],[[2677,2677],\"valid\"],[[2678,2688],\"disallowed\"],[[2689,2691],\"valid\"],[[2692,2692],\"disallowed\"],[[2693,2699],\"valid\"],[[2700,2700],\"valid\"],[[2701,2701],\"valid\"],[[2702,2702],\"disallowed\"],[[2703,2705],\"valid\"],[[2706,2706],\"disallowed\"],[[2707,2728],\"valid\"],[[2729,2729],\"disallowed\"],[[2730,2736],\"valid\"],[[2737,2737],\"disallowed\"],[[2738,2739],\"valid\"],[[2740,2740],\"disallowed\"],[[2741,2745],\"valid\"],[[2746,2747],\"disallowed\"],[[2748,2757],\"valid\"],[[2758,2758],\"disallowed\"],[[2759,2761],\"valid\"],[[2762,2762],\"disallowed\"],[[2763,2765],\"valid\"],[[2766,2767],\"disallowed\"],[[2768,2768],\"valid\"],[[2769,2783],\"disallowed\"],[[2784,2784],\"valid\"],[[2785,2787],\"valid\"],[[2788,2789],\"disallowed\"],[[2790,2799],\"valid\"],[[2800,2800],\"valid\",[],\"NV8\"],[[2801,2801],\"valid\",[],\"NV8\"],[[2802,2808],\"disallowed\"],[[2809,2809],\"valid\"],[[2810,2816],\"disallowed\"],[[2817,2819],\"valid\"],[[2820,2820],\"disallowed\"],[[2821,2828],\"valid\"],[[2829,2830],\"disallowed\"],[[2831,2832],\"valid\"],[[2833,2834],\"disallowed\"],[[2835,2856],\"valid\"],[[2857,2857],\"disallowed\"],[[2858,2864],\"valid\"],[[2865,2865],\"disallowed\"],[[2866,2867],\"valid\"],[[2868,2868],\"disallowed\"],[[2869,2869],\"valid\"],[[2870,2873],\"valid\"],[[2874,2875],\"disallowed\"],[[2876,2883],\"valid\"],[[2884,2884],\"valid\"],[[2885,2886],\"disallowed\"],[[2887,2888],\"valid\"],[[2889,2890],\"disallowed\"],[[2891,2893],\"valid\"],[[2894,2901],\"disallowed\"],[[2902,2903],\"valid\"],[[2904,2907],\"disallowed\"],[[2908,2908],\"mapped\",[2849,2876]],[[2909,2909],\"mapped\",[2850,2876]],[[2910,2910],\"disallowed\"],[[2911,2913],\"valid\"],[[2914,2915],\"valid\"],[[2916,2917],\"disallowed\"],[[2918,2927],\"valid\"],[[2928,2928],\"valid\",[],\"NV8\"],[[2929,2929],\"valid\"],[[2930,2935],\"valid\",[],\"NV8\"],[[2936,2945],\"disallowed\"],[[2946,2947],\"valid\"],[[2948,2948],\"disallowed\"],[[2949,2954],\"valid\"],[[2955,2957],\"disallowed\"],[[2958,2960],\"valid\"],[[2961,2961],\"disallowed\"],[[2962,2965],\"valid\"],[[2966,2968],\"disallowed\"],[[2969,2970],\"valid\"],[[2971,2971],\"disallowed\"],[[2972,2972],\"valid\"],[[2973,2973],\"disallowed\"],[[2974,2975],\"valid\"],[[2976,2978],\"disallowed\"],[[2979,2980],\"valid\"],[[2981,2983],\"disallowed\"],[[2984,2986],\"valid\"],[[2987,2989],\"disallowed\"],[[2990,2997],\"valid\"],[[2998,2998],\"valid\"],[[2999,3001],\"valid\"],[[3002,3005],\"disallowed\"],[[3006,3010],\"valid\"],[[3011,3013],\"disallowed\"],[[3014,3016],\"valid\"],[[3017,3017],\"disallowed\"],[[3018,3021],\"valid\"],[[3022,3023],\"disallowed\"],[[3024,3024],\"valid\"],[[3025,3030],\"disallowed\"],[[3031,3031],\"valid\"],[[3032,3045],\"disallowed\"],[[3046,3046],\"valid\"],[[3047,3055],\"valid\"],[[3056,3058],\"valid\",[],\"NV8\"],[[3059,3066],\"valid\",[],\"NV8\"],[[3067,3071],\"disallowed\"],[[3072,3072],\"valid\"],[[3073,3075],\"valid\"],[[3076,3076],\"disallowed\"],[[3077,3084],\"valid\"],[[3085,3085],\"disallowed\"],[[3086,3088],\"valid\"],[[3089,3089],\"disallowed\"],[[3090,3112],\"valid\"],[[3113,3113],\"disallowed\"],[[3114,3123],\"valid\"],[[3124,3124],\"valid\"],[[3125,3129],\"valid\"],[[3130,3132],\"disallowed\"],[[3133,3133],\"valid\"],[[3134,3140],\"valid\"],[[3141,3141],\"disallowed\"],[[3142,3144],\"valid\"],[[3145,3145],\"disallowed\"],[[3146,3149],\"valid\"],[[3150,3156],\"disallowed\"],[[3157,3158],\"valid\"],[[3159,3159],\"disallowed\"],[[3160,3161],\"valid\"],[[3162,3162],\"valid\"],[[3163,3167],\"disallowed\"],[[3168,3169],\"valid\"],[[3170,3171],\"valid\"],[[3172,3173],\"disallowed\"],[[3174,3183],\"valid\"],[[3184,3191],\"disallowed\"],[[3192,3199],\"valid\",[],\"NV8\"],[[3200,3200],\"disallowed\"],[[3201,3201],\"valid\"],[[3202,3203],\"valid\"],[[3204,3204],\"disallowed\"],[[3205,3212],\"valid\"],[[3213,3213],\"disallowed\"],[[3214,3216],\"valid\"],[[3217,3217],\"disallowed\"],[[3218,3240],\"valid\"],[[3241,3241],\"disallowed\"],[[3242,3251],\"valid\"],[[3252,3252],\"disallowed\"],[[3253,3257],\"valid\"],[[3258,3259],\"disallowed\"],[[3260,3261],\"valid\"],[[3262,3268],\"valid\"],[[3269,3269],\"disallowed\"],[[3270,3272],\"valid\"],[[3273,3273],\"disallowed\"],[[3274,3277],\"valid\"],[[3278,3284],\"disallowed\"],[[3285,3286],\"valid\"],[[3287,3293],\"disallowed\"],[[3294,3294],\"valid\"],[[3295,3295],\"disallowed\"],[[3296,3297],\"valid\"],[[3298,3299],\"valid\"],[[3300,3301],\"disallowed\"],[[3302,3311],\"valid\"],[[3312,3312],\"disallowed\"],[[3313,3314],\"valid\"],[[3315,3328],\"disallowed\"],[[3329,3329],\"valid\"],[[3330,3331],\"valid\"],[[3332,3332],\"disallowed\"],[[3333,3340],\"valid\"],[[3341,3341],\"disallowed\"],[[3342,3344],\"valid\"],[[3345,3345],\"disallowed\"],[[3346,3368],\"valid\"],[[3369,3369],\"valid\"],[[3370,3385],\"valid\"],[[3386,3386],\"valid\"],[[3387,3388],\"disallowed\"],[[3389,3389],\"valid\"],[[3390,3395],\"valid\"],[[3396,3396],\"valid\"],[[3397,3397],\"disallowed\"],[[3398,3400],\"valid\"],[[3401,3401],\"disallowed\"],[[3402,3405],\"valid\"],[[3406,3406],\"valid\"],[[3407,3414],\"disallowed\"],[[3415,3415],\"valid\"],[[3416,3422],\"disallowed\"],[[3423,3423],\"valid\"],[[3424,3425],\"valid\"],[[3426,3427],\"valid\"],[[3428,3429],\"disallowed\"],[[3430,3439],\"valid\"],[[3440,3445],\"valid\",[],\"NV8\"],[[3446,3448],\"disallowed\"],[[3449,3449],\"valid\",[],\"NV8\"],[[3450,3455],\"valid\"],[[3456,3457],\"disallowed\"],[[3458,3459],\"valid\"],[[3460,3460],\"disallowed\"],[[3461,3478],\"valid\"],[[3479,3481],\"disallowed\"],[[3482,3505],\"valid\"],[[3506,3506],\"disallowed\"],[[3507,3515],\"valid\"],[[3516,3516],\"disallowed\"],[[3517,3517],\"valid\"],[[3518,3519],\"disallowed\"],[[3520,3526],\"valid\"],[[3527,3529],\"disallowed\"],[[3530,3530],\"valid\"],[[3531,3534],\"disallowed\"],[[3535,3540],\"valid\"],[[3541,3541],\"disallowed\"],[[3542,3542],\"valid\"],[[3543,3543],\"disallowed\"],[[3544,3551],\"valid\"],[[3552,3557],\"disallowed\"],[[3558,3567],\"valid\"],[[3568,3569],\"disallowed\"],[[3570,3571],\"valid\"],[[3572,3572],\"valid\",[],\"NV8\"],[[3573,3584],\"disallowed\"],[[3585,3634],\"valid\"],[[3635,3635],\"mapped\",[3661,3634]],[[3636,3642],\"valid\"],[[3643,3646],\"disallowed\"],[[3647,3647],\"valid\",[],\"NV8\"],[[3648,3662],\"valid\"],[[3663,3663],\"valid\",[],\"NV8\"],[[3664,3673],\"valid\"],[[3674,3675],\"valid\",[],\"NV8\"],[[3676,3712],\"disallowed\"],[[3713,3714],\"valid\"],[[3715,3715],\"disallowed\"],[[3716,3716],\"valid\"],[[3717,3718],\"disallowed\"],[[3719,3720],\"valid\"],[[3721,3721],\"disallowed\"],[[3722,3722],\"valid\"],[[3723,3724],\"disallowed\"],[[3725,3725],\"valid\"],[[3726,3731],\"disallowed\"],[[3732,3735],\"valid\"],[[3736,3736],\"disallowed\"],[[3737,3743],\"valid\"],[[3744,3744],\"disallowed\"],[[3745,3747],\"valid\"],[[3748,3748],\"disallowed\"],[[3749,3749],\"valid\"],[[3750,3750],\"disallowed\"],[[3751,3751],\"valid\"],[[3752,3753],\"disallowed\"],[[3754,3755],\"valid\"],[[3756,3756],\"disallowed\"],[[3757,3762],\"valid\"],[[3763,3763],\"mapped\",[3789,3762]],[[3764,3769],\"valid\"],[[3770,3770],\"disallowed\"],[[3771,3773],\"valid\"],[[3774,3775],\"disallowed\"],[[3776,3780],\"valid\"],[[3781,3781],\"disallowed\"],[[3782,3782],\"valid\"],[[3783,3783],\"disallowed\"],[[3784,3789],\"valid\"],[[3790,3791],\"disallowed\"],[[3792,3801],\"valid\"],[[3802,3803],\"disallowed\"],[[3804,3804],\"mapped\",[3755,3737]],[[3805,3805],\"mapped\",[3755,3745]],[[3806,3807],\"valid\"],[[3808,3839],\"disallowed\"],[[3840,3840],\"valid\"],[[3841,3850],\"valid\",[],\"NV8\"],[[3851,3851],\"valid\"],[[3852,3852],\"mapped\",[3851]],[[3853,3863],\"valid\",[],\"NV8\"],[[3864,3865],\"valid\"],[[3866,3871],\"valid\",[],\"NV8\"],[[3872,3881],\"valid\"],[[3882,3892],\"valid\",[],\"NV8\"],[[3893,3893],\"valid\"],[[3894,3894],\"valid\",[],\"NV8\"],[[3895,3895],\"valid\"],[[3896,3896],\"valid\",[],\"NV8\"],[[3897,3897],\"valid\"],[[3898,3901],\"valid\",[],\"NV8\"],[[3902,3906],\"valid\"],[[3907,3907],\"mapped\",[3906,4023]],[[3908,3911],\"valid\"],[[3912,3912],\"disallowed\"],[[3913,3916],\"valid\"],[[3917,3917],\"mapped\",[3916,4023]],[[3918,3921],\"valid\"],[[3922,3922],\"mapped\",[3921,4023]],[[3923,3926],\"valid\"],[[3927,3927],\"mapped\",[3926,4023]],[[3928,3931],\"valid\"],[[3932,3932],\"mapped\",[3931,4023]],[[3933,3944],\"valid\"],[[3945,3945],\"mapped\",[3904,4021]],[[3946,3946],\"valid\"],[[3947,3948],\"valid\"],[[3949,3952],\"disallowed\"],[[3953,3954],\"valid\"],[[3955,3955],\"mapped\",[3953,3954]],[[3956,3956],\"valid\"],[[3957,3957],\"mapped\",[3953,3956]],[[3958,3958],\"mapped\",[4018,3968]],[[3959,3959],\"mapped\",[4018,3953,3968]],[[3960,3960],\"mapped\",[4019,3968]],[[3961,3961],\"mapped\",[4019,3953,3968]],[[3962,3968],\"valid\"],[[3969,3969],\"mapped\",[3953,3968]],[[3970,3972],\"valid\"],[[3973,3973],\"valid\",[],\"NV8\"],[[3974,3979],\"valid\"],[[3980,3983],\"valid\"],[[3984,3986],\"valid\"],[[3987,3987],\"mapped\",[3986,4023]],[[3988,3989],\"valid\"],[[3990,3990],\"valid\"],[[3991,3991],\"valid\"],[[3992,3992],\"disallowed\"],[[3993,3996],\"valid\"],[[3997,3997],\"mapped\",[3996,4023]],[[3998,4001],\"valid\"],[[4002,4002],\"mapped\",[4001,4023]],[[4003,4006],\"valid\"],[[4007,4007],\"mapped\",[4006,4023]],[[4008,4011],\"valid\"],[[4012,4012],\"mapped\",[4011,4023]],[[4013,4013],\"valid\"],[[4014,4016],\"valid\"],[[4017,4023],\"valid\"],[[4024,4024],\"valid\"],[[4025,4025],\"mapped\",[3984,4021]],[[4026,4028],\"valid\"],[[4029,4029],\"disallowed\"],[[4030,4037],\"valid\",[],\"NV8\"],[[4038,4038],\"valid\"],[[4039,4044],\"valid\",[],\"NV8\"],[[4045,4045],\"disallowed\"],[[4046,4046],\"valid\",[],\"NV8\"],[[4047,4047],\"valid\",[],\"NV8\"],[[4048,4049],\"valid\",[],\"NV8\"],[[4050,4052],\"valid\",[],\"NV8\"],[[4053,4056],\"valid\",[],\"NV8\"],[[4057,4058],\"valid\",[],\"NV8\"],[[4059,4095],\"disallowed\"],[[4096,4129],\"valid\"],[[4130,4130],\"valid\"],[[4131,4135],\"valid\"],[[4136,4136],\"valid\"],[[4137,4138],\"valid\"],[[4139,4139],\"valid\"],[[4140,4146],\"valid\"],[[4147,4149],\"valid\"],[[4150,4153],\"valid\"],[[4154,4159],\"valid\"],[[4160,4169],\"valid\"],[[4170,4175],\"valid\",[],\"NV8\"],[[4176,4185],\"valid\"],[[4186,4249],\"valid\"],[[4250,4253],\"valid\"],[[4254,4255],\"valid\",[],\"NV8\"],[[4256,4293],\"disallowed\"],[[4294,4294],\"disallowed\"],[[4295,4295],\"mapped\",[11559]],[[4296,4300],\"disallowed\"],[[4301,4301],\"mapped\",[11565]],[[4302,4303],\"disallowed\"],[[4304,4342],\"valid\"],[[4343,4344],\"valid\"],[[4345,4346],\"valid\"],[[4347,4347],\"valid\",[],\"NV8\"],[[4348,4348],\"mapped\",[4316]],[[4349,4351],\"valid\"],[[4352,4441],\"valid\",[],\"NV8\"],[[4442,4446],\"valid\",[],\"NV8\"],[[4447,4448],\"disallowed\"],[[4449,4514],\"valid\",[],\"NV8\"],[[4515,4519],\"valid\",[],\"NV8\"],[[4520,4601],\"valid\",[],\"NV8\"],[[4602,4607],\"valid\",[],\"NV8\"],[[4608,4614],\"valid\"],[[4615,4615],\"valid\"],[[4616,4678],\"valid\"],[[4679,4679],\"valid\"],[[4680,4680],\"valid\"],[[4681,4681],\"disallowed\"],[[4682,4685],\"valid\"],[[4686,4687],\"disallowed\"],[[4688,4694],\"valid\"],[[4695,4695],\"disallowed\"],[[4696,4696],\"valid\"],[[4697,4697],\"disallowed\"],[[4698,4701],\"valid\"],[[4702,4703],\"disallowed\"],[[4704,4742],\"valid\"],[[4743,4743],\"valid\"],[[4744,4744],\"valid\"],[[4745,4745],\"disallowed\"],[[4746,4749],\"valid\"],[[4750,4751],\"disallowed\"],[[4752,4782],\"valid\"],[[4783,4783],\"valid\"],[[4784,4784],\"valid\"],[[4785,4785],\"disallowed\"],[[4786,4789],\"valid\"],[[4790,4791],\"disallowed\"],[[4792,4798],\"valid\"],[[4799,4799],\"disallowed\"],[[4800,4800],\"valid\"],[[4801,4801],\"disallowed\"],[[4802,4805],\"valid\"],[[4806,4807],\"disallowed\"],[[4808,4814],\"valid\"],[[4815,4815],\"valid\"],[[4816,4822],\"valid\"],[[4823,4823],\"disallowed\"],[[4824,4846],\"valid\"],[[4847,4847],\"valid\"],[[4848,4878],\"valid\"],[[4879,4879],\"valid\"],[[4880,4880],\"valid\"],[[4881,4881],\"disallowed\"],[[4882,4885],\"valid\"],[[4886,4887],\"disallowed\"],[[4888,4894],\"valid\"],[[4895,4895],\"valid\"],[[4896,4934],\"valid\"],[[4935,4935],\"valid\"],[[4936,4954],\"valid\"],[[4955,4956],\"disallowed\"],[[4957,4958],\"valid\"],[[4959,4959],\"valid\"],[[4960,4960],\"valid\",[],\"NV8\"],[[4961,4988],\"valid\",[],\"NV8\"],[[4989,4991],\"disallowed\"],[[4992,5007],\"valid\"],[[5008,5017],\"valid\",[],\"NV8\"],[[5018,5023],\"disallowed\"],[[5024,5108],\"valid\"],[[5109,5109],\"valid\"],[[5110,5111],\"disallowed\"],[[5112,5112],\"mapped\",[5104]],[[5113,5113],\"mapped\",[5105]],[[5114,5114],\"mapped\",[5106]],[[5115,5115],\"mapped\",[5107]],[[5116,5116],\"mapped\",[5108]],[[5117,5117],\"mapped\",[5109]],[[5118,5119],\"disallowed\"],[[5120,5120],\"valid\",[],\"NV8\"],[[5121,5740],\"valid\"],[[5741,5742],\"valid\",[],\"NV8\"],[[5743,5750],\"valid\"],[[5751,5759],\"valid\"],[[5760,5760],\"disallowed\"],[[5761,5786],\"valid\"],[[5787,5788],\"valid\",[],\"NV8\"],[[5789,5791],\"disallowed\"],[[5792,5866],\"valid\"],[[5867,5872],\"valid\",[],\"NV8\"],[[5873,5880],\"valid\"],[[5881,5887],\"disallowed\"],[[5888,5900],\"valid\"],[[5901,5901],\"disallowed\"],[[5902,5908],\"valid\"],[[5909,5919],\"disallowed\"],[[5920,5940],\"valid\"],[[5941,5942],\"valid\",[],\"NV8\"],[[5943,5951],\"disallowed\"],[[5952,5971],\"valid\"],[[5972,5983],\"disallowed\"],[[5984,5996],\"valid\"],[[5997,5997],\"disallowed\"],[[5998,6000],\"valid\"],[[6001,6001],\"disallowed\"],[[6002,6003],\"valid\"],[[6004,6015],\"disallowed\"],[[6016,6067],\"valid\"],[[6068,6069],\"disallowed\"],[[6070,6099],\"valid\"],[[6100,6102],\"valid\",[],\"NV8\"],[[6103,6103],\"valid\"],[[6104,6107],\"valid\",[],\"NV8\"],[[6108,6108],\"valid\"],[[6109,6109],\"valid\"],[[6110,6111],\"disallowed\"],[[6112,6121],\"valid\"],[[6122,6127],\"disallowed\"],[[6128,6137],\"valid\",[],\"NV8\"],[[6138,6143],\"disallowed\"],[[6144,6149],\"valid\",[],\"NV8\"],[[6150,6150],\"disallowed\"],[[6151,6154],\"valid\",[],\"NV8\"],[[6155,6157],\"ignored\"],[[6158,6158],\"disallowed\"],[[6159,6159],\"disallowed\"],[[6160,6169],\"valid\"],[[6170,6175],\"disallowed\"],[[6176,6263],\"valid\"],[[6264,6271],\"disallowed\"],[[6272,6313],\"valid\"],[[6314,6314],\"valid\"],[[6315,6319],\"disallowed\"],[[6320,6389],\"valid\"],[[6390,6399],\"disallowed\"],[[6400,6428],\"valid\"],[[6429,6430],\"valid\"],[[6431,6431],\"disallowed\"],[[6432,6443],\"valid\"],[[6444,6447],\"disallowed\"],[[6448,6459],\"valid\"],[[6460,6463],\"disallowed\"],[[6464,6464],\"valid\",[],\"NV8\"],[[6465,6467],\"disallowed\"],[[6468,6469],\"valid\",[],\"NV8\"],[[6470,6509],\"valid\"],[[6510,6511],\"disallowed\"],[[6512,6516],\"valid\"],[[6517,6527],\"disallowed\"],[[6528,6569],\"valid\"],[[6570,6571],\"valid\"],[[6572,6575],\"disallowed\"],[[6576,6601],\"valid\"],[[6602,6607],\"disallowed\"],[[6608,6617],\"valid\"],[[6618,6618],\"valid\",[],\"XV8\"],[[6619,6621],\"disallowed\"],[[6622,6623],\"valid\",[],\"NV8\"],[[6624,6655],\"valid\",[],\"NV8\"],[[6656,6683],\"valid\"],[[6684,6685],\"disallowed\"],[[6686,6687],\"valid\",[],\"NV8\"],[[6688,6750],\"valid\"],[[6751,6751],\"disallowed\"],[[6752,6780],\"valid\"],[[6781,6782],\"disallowed\"],[[6783,6793],\"valid\"],[[6794,6799],\"disallowed\"],[[6800,6809],\"valid\"],[[6810,6815],\"disallowed\"],[[6816,6822],\"valid\",[],\"NV8\"],[[6823,6823],\"valid\"],[[6824,6829],\"valid\",[],\"NV8\"],[[6830,6831],\"disallowed\"],[[6832,6845],\"valid\"],[[6846,6846],\"valid\",[],\"NV8\"],[[6847,6911],\"disallowed\"],[[6912,6987],\"valid\"],[[6988,6991],\"disallowed\"],[[6992,7001],\"valid\"],[[7002,7018],\"valid\",[],\"NV8\"],[[7019,7027],\"valid\"],[[7028,7036],\"valid\",[],\"NV8\"],[[7037,7039],\"disallowed\"],[[7040,7082],\"valid\"],[[7083,7085],\"valid\"],[[7086,7097],\"valid\"],[[7098,7103],\"valid\"],[[7104,7155],\"valid\"],[[7156,7163],\"disallowed\"],[[7164,7167],\"valid\",[],\"NV8\"],[[7168,7223],\"valid\"],[[7224,7226],\"disallowed\"],[[7227,7231],\"valid\",[],\"NV8\"],[[7232,7241],\"valid\"],[[7242,7244],\"disallowed\"],[[7245,7293],\"valid\"],[[7294,7295],\"valid\",[],\"NV8\"],[[7296,7359],\"disallowed\"],[[7360,7367],\"valid\",[],\"NV8\"],[[7368,7375],\"disallowed\"],[[7376,7378],\"valid\"],[[7379,7379],\"valid\",[],\"NV8\"],[[7380,7410],\"valid\"],[[7411,7414],\"valid\"],[[7415,7415],\"disallowed\"],[[7416,7417],\"valid\"],[[7418,7423],\"disallowed\"],[[7424,7467],\"valid\"],[[7468,7468],\"mapped\",[97]],[[7469,7469],\"mapped\",[230]],[[7470,7470],\"mapped\",[98]],[[7471,7471],\"valid\"],[[7472,7472],\"mapped\",[100]],[[7473,7473],\"mapped\",[101]],[[7474,7474],\"mapped\",[477]],[[7475,7475],\"mapped\",[103]],[[7476,7476],\"mapped\",[104]],[[7477,7477],\"mapped\",[105]],[[7478,7478],\"mapped\",[106]],[[7479,7479],\"mapped\",[107]],[[7480,7480],\"mapped\",[108]],[[7481,7481],\"mapped\",[109]],[[7482,7482],\"mapped\",[110]],[[7483,7483],\"valid\"],[[7484,7484],\"mapped\",[111]],[[7485,7485],\"mapped\",[547]],[[7486,7486],\"mapped\",[112]],[[7487,7487],\"mapped\",[114]],[[7488,7488],\"mapped\",[116]],[[7489,7489],\"mapped\",[117]],[[7490,7490],\"mapped\",[119]],[[7491,7491],\"mapped\",[97]],[[7492,7492],\"mapped\",[592]],[[7493,7493],\"mapped\",[593]],[[7494,7494],\"mapped\",[7426]],[[7495,7495],\"mapped\",[98]],[[7496,7496],\"mapped\",[100]],[[7497,7497],\"mapped\",[101]],[[7498,7498],\"mapped\",[601]],[[7499,7499],\"mapped\",[603]],[[7500,7500],\"mapped\",[604]],[[7501,7501],\"mapped\",[103]],[[7502,7502],\"valid\"],[[7503,7503],\"mapped\",[107]],[[7504,7504],\"mapped\",[109]],[[7505,7505],\"mapped\",[331]],[[7506,7506],\"mapped\",[111]],[[7507,7507],\"mapped\",[596]],[[7508,7508],\"mapped\",[7446]],[[7509,7509],\"mapped\",[7447]],[[7510,7510],\"mapped\",[112]],[[7511,7511],\"mapped\",[116]],[[7512,7512],\"mapped\",[117]],[[7513,7513],\"mapped\",[7453]],[[7514,7514],\"mapped\",[623]],[[7515,7515],\"mapped\",[118]],[[7516,7516],\"mapped\",[7461]],[[7517,7517],\"mapped\",[946]],[[7518,7518],\"mapped\",[947]],[[7519,7519],\"mapped\",[948]],[[7520,7520],\"mapped\",[966]],[[7521,7521],\"mapped\",[967]],[[7522,7522],\"mapped\",[105]],[[7523,7523],\"mapped\",[114]],[[7524,7524],\"mapped\",[117]],[[7525,7525],\"mapped\",[118]],[[7526,7526],\"mapped\",[946]],[[7527,7527],\"mapped\",[947]],[[7528,7528],\"mapped\",[961]],[[7529,7529],\"mapped\",[966]],[[7530,7530],\"mapped\",[967]],[[7531,7531],\"valid\"],[[7532,7543],\"valid\"],[[7544,7544],\"mapped\",[1085]],[[7545,7578],\"valid\"],[[7579,7579],\"mapped\",[594]],[[7580,7580],\"mapped\",[99]],[[7581,7581],\"mapped\",[597]],[[7582,7582],\"mapped\",[240]],[[7583,7583],\"mapped\",[604]],[[7584,7584],\"mapped\",[102]],[[7585,7585],\"mapped\",[607]],[[7586,7586],\"mapped\",[609]],[[7587,7587],\"mapped\",[613]],[[7588,7588],\"mapped\",[616]],[[7589,7589],\"mapped\",[617]],[[7590,7590],\"mapped\",[618]],[[7591,7591],\"mapped\",[7547]],[[7592,7592],\"mapped\",[669]],[[7593,7593],\"mapped\",[621]],[[7594,7594],\"mapped\",[7557]],[[7595,7595],\"mapped\",[671]],[[7596,7596],\"mapped\",[625]],[[7597,7597],\"mapped\",[624]],[[7598,7598],\"mapped\",[626]],[[7599,7599],\"mapped\",[627]],[[7600,7600],\"mapped\",[628]],[[7601,7601],\"mapped\",[629]],[[7602,7602],\"mapped\",[632]],[[7603,7603],\"mapped\",[642]],[[7604,7604],\"mapped\",[643]],[[7605,7605],\"mapped\",[427]],[[7606,7606],\"mapped\",[649]],[[7607,7607],\"mapped\",[650]],[[7608,7608],\"mapped\",[7452]],[[7609,7609],\"mapped\",[651]],[[7610,7610],\"mapped\",[652]],[[7611,7611],\"mapped\",[122]],[[7612,7612],\"mapped\",[656]],[[7613,7613],\"mapped\",[657]],[[7614,7614],\"mapped\",[658]],[[7615,7615],\"mapped\",[952]],[[7616,7619],\"valid\"],[[7620,7626],\"valid\"],[[7627,7654],\"valid\"],[[7655,7669],\"valid\"],[[7670,7675],\"disallowed\"],[[7676,7676],\"valid\"],[[7677,7677],\"valid\"],[[7678,7679],\"valid\"],[[7680,7680],\"mapped\",[7681]],[[7681,7681],\"valid\"],[[7682,7682],\"mapped\",[7683]],[[7683,7683],\"valid\"],[[7684,7684],\"mapped\",[7685]],[[7685,7685],\"valid\"],[[7686,7686],\"mapped\",[7687]],[[7687,7687],\"valid\"],[[7688,7688],\"mapped\",[7689]],[[7689,7689],\"valid\"],[[7690,7690],\"mapped\",[7691]],[[7691,7691],\"valid\"],[[7692,7692],\"mapped\",[7693]],[[7693,7693],\"valid\"],[[7694,7694],\"mapped\",[7695]],[[7695,7695],\"valid\"],[[7696,7696],\"mapped\",[7697]],[[7697,7697],\"valid\"],[[7698,7698],\"mapped\",[7699]],[[7699,7699],\"valid\"],[[7700,7700],\"mapped\",[7701]],[[7701,7701],\"valid\"],[[7702,7702],\"mapped\",[7703]],[[7703,7703],\"valid\"],[[7704,7704],\"mapped\",[7705]],[[7705,7705],\"valid\"],[[7706,7706],\"mapped\",[7707]],[[7707,7707],\"valid\"],[[7708,7708],\"mapped\",[7709]],[[7709,7709],\"valid\"],[[7710,7710],\"mapped\",[7711]],[[7711,7711],\"valid\"],[[7712,7712],\"mapped\",[7713]],[[7713,7713],\"valid\"],[[7714,7714],\"mapped\",[7715]],[[7715,7715],\"valid\"],[[7716,7716],\"mapped\",[7717]],[[7717,7717],\"valid\"],[[7718,7718],\"mapped\",[7719]],[[7719,7719],\"valid\"],[[7720,7720],\"mapped\",[7721]],[[7721,7721],\"valid\"],[[7722,7722],\"mapped\",[7723]],[[7723,7723],\"valid\"],[[7724,7724],\"mapped\",[7725]],[[7725,7725],\"valid\"],[[7726,7726],\"mapped\",[7727]],[[7727,7727],\"valid\"],[[7728,7728],\"mapped\",[7729]],[[7729,7729],\"valid\"],[[7730,7730],\"mapped\",[7731]],[[7731,7731],\"valid\"],[[7732,7732],\"mapped\",[7733]],[[7733,7733],\"valid\"],[[7734,7734],\"mapped\",[7735]],[[7735,7735],\"valid\"],[[7736,7736],\"mapped\",[7737]],[[7737,7737],\"valid\"],[[7738,7738],\"mapped\",[7739]],[[7739,7739],\"valid\"],[[7740,7740],\"mapped\",[7741]],[[7741,7741],\"valid\"],[[7742,7742],\"mapped\",[7743]],[[7743,7743],\"valid\"],[[7744,7744],\"mapped\",[7745]],[[7745,7745],\"valid\"],[[7746,7746],\"mapped\",[7747]],[[7747,7747],\"valid\"],[[7748,7748],\"mapped\",[7749]],[[7749,7749],\"valid\"],[[7750,7750],\"mapped\",[7751]],[[7751,7751],\"valid\"],[[7752,7752],\"mapped\",[7753]],[[7753,7753],\"valid\"],[[7754,7754],\"mapped\",[7755]],[[7755,7755],\"valid\"],[[7756,7756],\"mapped\",[7757]],[[7757,7757],\"valid\"],[[7758,7758],\"mapped\",[7759]],[[7759,7759],\"valid\"],[[7760,7760],\"mapped\",[7761]],[[7761,7761],\"valid\"],[[7762,7762],\"mapped\",[7763]],[[7763,7763],\"valid\"],[[7764,7764],\"mapped\",[7765]],[[7765,7765],\"valid\"],[[7766,7766],\"mapped\",[7767]],[[7767,7767],\"valid\"],[[7768,7768],\"mapped\",[7769]],[[7769,7769],\"valid\"],[[7770,7770],\"mapped\",[7771]],[[7771,7771],\"valid\"],[[7772,7772],\"mapped\",[7773]],[[7773,7773],\"valid\"],[[7774,7774],\"mapped\",[7775]],[[7775,7775],\"valid\"],[[7776,7776],\"mapped\",[7777]],[[7777,7777],\"valid\"],[[7778,7778],\"mapped\",[7779]],[[7779,7779],\"valid\"],[[7780,7780],\"mapped\",[7781]],[[7781,7781],\"valid\"],[[7782,7782],\"mapped\",[7783]],[[7783,7783],\"valid\"],[[7784,7784],\"mapped\",[7785]],[[7785,7785],\"valid\"],[[7786,7786],\"mapped\",[7787]],[[7787,7787],\"valid\"],[[7788,7788],\"mapped\",[7789]],[[7789,7789],\"valid\"],[[7790,7790],\"mapped\",[7791]],[[7791,7791],\"valid\"],[[7792,7792],\"mapped\",[7793]],[[7793,7793],\"valid\"],[[7794,7794],\"mapped\",[7795]],[[7795,7795],\"valid\"],[[7796,7796],\"mapped\",[7797]],[[7797,7797],\"valid\"],[[7798,7798],\"mapped\",[7799]],[[7799,7799],\"valid\"],[[7800,7800],\"mapped\",[7801]],[[7801,7801],\"valid\"],[[7802,7802],\"mapped\",[7803]],[[7803,7803],\"valid\"],[[7804,7804],\"mapped\",[7805]],[[7805,7805],\"valid\"],[[7806,7806],\"mapped\",[7807]],[[7807,7807],\"valid\"],[[7808,7808],\"mapped\",[7809]],[[7809,7809],\"valid\"],[[7810,7810],\"mapped\",[7811]],[[7811,7811],\"valid\"],[[7812,7812],\"mapped\",[7813]],[[7813,7813],\"valid\"],[[7814,7814],\"mapped\",[7815]],[[7815,7815],\"valid\"],[[7816,7816],\"mapped\",[7817]],[[7817,7817],\"valid\"],[[7818,7818],\"mapped\",[7819]],[[7819,7819],\"valid\"],[[7820,7820],\"mapped\",[7821]],[[7821,7821],\"valid\"],[[7822,7822],\"mapped\",[7823]],[[7823,7823],\"valid\"],[[7824,7824],\"mapped\",[7825]],[[7825,7825],\"valid\"],[[7826,7826],\"mapped\",[7827]],[[7827,7827],\"valid\"],[[7828,7828],\"mapped\",[7829]],[[7829,7833],\"valid\"],[[7834,7834],\"mapped\",[97,702]],[[7835,7835],\"mapped\",[7777]],[[7836,7837],\"valid\"],[[7838,7838],\"mapped\",[115,115]],[[7839,7839],\"valid\"],[[7840,7840],\"mapped\",[7841]],[[7841,7841],\"valid\"],[[7842,7842],\"mapped\",[7843]],[[7843,7843],\"valid\"],[[7844,7844],\"mapped\",[7845]],[[7845,7845],\"valid\"],[[7846,7846],\"mapped\",[7847]],[[7847,7847],\"valid\"],[[7848,7848],\"mapped\",[7849]],[[7849,7849],\"valid\"],[[7850,7850],\"mapped\",[7851]],[[7851,7851],\"valid\"],[[7852,7852],\"mapped\",[7853]],[[7853,7853],\"valid\"],[[7854,7854],\"mapped\",[7855]],[[7855,7855],\"valid\"],[[7856,7856],\"mapped\",[7857]],[[7857,7857],\"valid\"],[[7858,7858],\"mapped\",[7859]],[[7859,7859],\"valid\"],[[7860,7860],\"mapped\",[7861]],[[7861,7861],\"valid\"],[[7862,7862],\"mapped\",[7863]],[[7863,7863],\"valid\"],[[7864,7864],\"mapped\",[7865]],[[7865,7865],\"valid\"],[[7866,7866],\"mapped\",[7867]],[[7867,7867],\"valid\"],[[7868,7868],\"mapped\",[7869]],[[7869,7869],\"valid\"],[[7870,7870],\"mapped\",[7871]],[[7871,7871],\"valid\"],[[7872,7872],\"mapped\",[7873]],[[7873,7873],\"valid\"],[[7874,7874],\"mapped\",[7875]],[[7875,7875],\"valid\"],[[7876,7876],\"mapped\",[7877]],[[7877,7877],\"valid\"],[[7878,7878],\"mapped\",[7879]],[[7879,7879],\"valid\"],[[7880,7880],\"mapped\",[7881]],[[7881,7881],\"valid\"],[[7882,7882],\"mapped\",[7883]],[[7883,7883],\"valid\"],[[7884,7884],\"mapped\",[7885]],[[7885,7885],\"valid\"],[[7886,7886],\"mapped\",[7887]],[[7887,7887],\"valid\"],[[7888,7888],\"mapped\",[7889]],[[7889,7889],\"valid\"],[[7890,7890],\"mapped\",[7891]],[[7891,7891],\"valid\"],[[7892,7892],\"mapped\",[7893]],[[7893,7893],\"valid\"],[[7894,7894],\"mapped\",[7895]],[[7895,7895],\"valid\"],[[7896,7896],\"mapped\",[7897]],[[7897,7897],\"valid\"],[[7898,7898],\"mapped\",[7899]],[[7899,7899],\"valid\"],[[7900,7900],\"mapped\",[7901]],[[7901,7901],\"valid\"],[[7902,7902],\"mapped\",[7903]],[[7903,7903],\"valid\"],[[7904,7904],\"mapped\",[7905]],[[7905,7905],\"valid\"],[[7906,7906],\"mapped\",[7907]],[[7907,7907],\"valid\"],[[7908,7908],\"mapped\",[7909]],[[7909,7909],\"valid\"],[[7910,7910],\"mapped\",[7911]],[[7911,7911],\"valid\"],[[7912,7912],\"mapped\",[7913]],[[7913,7913],\"valid\"],[[7914,7914],\"mapped\",[7915]],[[7915,7915],\"valid\"],[[7916,7916],\"mapped\",[7917]],[[7917,7917],\"valid\"],[[7918,7918],\"mapped\",[7919]],[[7919,7919],\"valid\"],[[7920,7920],\"mapped\",[7921]],[[7921,7921],\"valid\"],[[7922,7922],\"mapped\",[7923]],[[7923,7923],\"valid\"],[[7924,7924],\"mapped\",[7925]],[[7925,7925],\"valid\"],[[7926,7926],\"mapped\",[7927]],[[7927,7927],\"valid\"],[[7928,7928],\"mapped\",[7929]],[[7929,7929],\"valid\"],[[7930,7930],\"mapped\",[7931]],[[7931,7931],\"valid\"],[[7932,7932],\"mapped\",[7933]],[[7933,7933],\"valid\"],[[7934,7934],\"mapped\",[7935]],[[7935,7935],\"valid\"],[[7936,7943],\"valid\"],[[7944,7944],\"mapped\",[7936]],[[7945,7945],\"mapped\",[7937]],[[7946,7946],\"mapped\",[7938]],[[7947,7947],\"mapped\",[7939]],[[7948,7948],\"mapped\",[7940]],[[7949,7949],\"mapped\",[7941]],[[7950,7950],\"mapped\",[7942]],[[7951,7951],\"mapped\",[7943]],[[7952,7957],\"valid\"],[[7958,7959],\"disallowed\"],[[7960,7960],\"mapped\",[7952]],[[7961,7961],\"mapped\",[7953]],[[7962,7962],\"mapped\",[7954]],[[7963,7963],\"mapped\",[7955]],[[7964,7964],\"mapped\",[7956]],[[7965,7965],\"mapped\",[7957]],[[7966,7967],\"disallowed\"],[[7968,7975],\"valid\"],[[7976,7976],\"mapped\",[7968]],[[7977,7977],\"mapped\",[7969]],[[7978,7978],\"mapped\",[7970]],[[7979,7979],\"mapped\",[7971]],[[7980,7980],\"mapped\",[7972]],[[7981,7981],\"mapped\",[7973]],[[7982,7982],\"mapped\",[7974]],[[7983,7983],\"mapped\",[7975]],[[7984,7991],\"valid\"],[[7992,7992],\"mapped\",[7984]],[[7993,7993],\"mapped\",[7985]],[[7994,7994],\"mapped\",[7986]],[[7995,7995],\"mapped\",[7987]],[[7996,7996],\"mapped\",[7988]],[[7997,7997],\"mapped\",[7989]],[[7998,7998],\"mapped\",[7990]],[[7999,7999],\"mapped\",[7991]],[[8000,8005],\"valid\"],[[8006,8007],\"disallowed\"],[[8008,8008],\"mapped\",[8000]],[[8009,8009],\"mapped\",[8001]],[[8010,8010],\"mapped\",[8002]],[[8011,8011],\"mapped\",[8003]],[[8012,8012],\"mapped\",[8004]],[[8013,8013],\"mapped\",[8005]],[[8014,8015],\"disallowed\"],[[8016,8023],\"valid\"],[[8024,8024],\"disallowed\"],[[8025,8025],\"mapped\",[8017]],[[8026,8026],\"disallowed\"],[[8027,8027],\"mapped\",[8019]],[[8028,8028],\"disallowed\"],[[8029,8029],\"mapped\",[8021]],[[8030,8030],\"disallowed\"],[[8031,8031],\"mapped\",[8023]],[[8032,8039],\"valid\"],[[8040,8040],\"mapped\",[8032]],[[8041,8041],\"mapped\",[8033]],[[8042,8042],\"mapped\",[8034]],[[8043,8043],\"mapped\",[8035]],[[8044,8044],\"mapped\",[8036]],[[8045,8045],\"mapped\",[8037]],[[8046,8046],\"mapped\",[8038]],[[8047,8047],\"mapped\",[8039]],[[8048,8048],\"valid\"],[[8049,8049],\"mapped\",[940]],[[8050,8050],\"valid\"],[[8051,8051],\"mapped\",[941]],[[8052,8052],\"valid\"],[[8053,8053],\"mapped\",[942]],[[8054,8054],\"valid\"],[[8055,8055],\"mapped\",[943]],[[8056,8056],\"valid\"],[[8057,8057],\"mapped\",[972]],[[8058,8058],\"valid\"],[[8059,8059],\"mapped\",[973]],[[8060,8060],\"valid\"],[[8061,8061],\"mapped\",[974]],[[8062,8063],\"disallowed\"],[[8064,8064],\"mapped\",[7936,953]],[[8065,8065],\"mapped\",[7937,953]],[[8066,8066],\"mapped\",[7938,953]],[[8067,8067],\"mapped\",[7939,953]],[[8068,8068],\"mapped\",[7940,953]],[[8069,8069],\"mapped\",[7941,953]],[[8070,8070],\"mapped\",[7942,953]],[[8071,8071],\"mapped\",[7943,953]],[[8072,8072],\"mapped\",[7936,953]],[[8073,8073],\"mapped\",[7937,953]],[[8074,8074],\"mapped\",[7938,953]],[[8075,8075],\"mapped\",[7939,953]],[[8076,8076],\"mapped\",[7940,953]],[[8077,8077],\"mapped\",[7941,953]],[[8078,8078],\"mapped\",[7942,953]],[[8079,8079],\"mapped\",[7943,953]],[[8080,8080],\"mapped\",[7968,953]],[[8081,8081],\"mapped\",[7969,953]],[[8082,8082],\"mapped\",[7970,953]],[[8083,8083],\"mapped\",[7971,953]],[[8084,8084],\"mapped\",[7972,953]],[[8085,8085],\"mapped\",[7973,953]],[[8086,8086],\"mapped\",[7974,953]],[[8087,8087],\"mapped\",[7975,953]],[[8088,8088],\"mapped\",[7968,953]],[[8089,8089],\"mapped\",[7969,953]],[[8090,8090],\"mapped\",[7970,953]],[[8091,8091],\"mapped\",[7971,953]],[[8092,8092],\"mapped\",[7972,953]],[[8093,8093],\"mapped\",[7973,953]],[[8094,8094],\"mapped\",[7974,953]],[[8095,8095],\"mapped\",[7975,953]],[[8096,8096],\"mapped\",[8032,953]],[[8097,8097],\"mapped\",[8033,953]],[[8098,8098],\"mapped\",[8034,953]],[[8099,8099],\"mapped\",[8035,953]],[[8100,8100],\"mapped\",[8036,953]],[[8101,8101],\"mapped\",[8037,953]],[[8102,8102],\"mapped\",[8038,953]],[[8103,8103],\"mapped\",[8039,953]],[[8104,8104],\"mapped\",[8032,953]],[[8105,8105],\"mapped\",[8033,953]],[[8106,8106],\"mapped\",[8034,953]],[[8107,8107],\"mapped\",[8035,953]],[[8108,8108],\"mapped\",[8036,953]],[[8109,8109],\"mapped\",[8037,953]],[[8110,8110],\"mapped\",[8038,953]],[[8111,8111],\"mapped\",[8039,953]],[[8112,8113],\"valid\"],[[8114,8114],\"mapped\",[8048,953]],[[8115,8115],\"mapped\",[945,953]],[[8116,8116],\"mapped\",[940,953]],[[8117,8117],\"disallowed\"],[[8118,8118],\"valid\"],[[8119,8119],\"mapped\",[8118,953]],[[8120,8120],\"mapped\",[8112]],[[8121,8121],\"mapped\",[8113]],[[8122,8122],\"mapped\",[8048]],[[8123,8123],\"mapped\",[940]],[[8124,8124],\"mapped\",[945,953]],[[8125,8125],\"disallowed_STD3_mapped\",[32,787]],[[8126,8126],\"mapped\",[953]],[[8127,8127],\"disallowed_STD3_mapped\",[32,787]],[[8128,8128],\"disallowed_STD3_mapped\",[32,834]],[[8129,8129],\"disallowed_STD3_mapped\",[32,776,834]],[[8130,8130],\"mapped\",[8052,953]],[[8131,8131],\"mapped\",[951,953]],[[8132,8132],\"mapped\",[942,953]],[[8133,8133],\"disallowed\"],[[8134,8134],\"valid\"],[[8135,8135],\"mapped\",[8134,953]],[[8136,8136],\"mapped\",[8050]],[[8137,8137],\"mapped\",[941]],[[8138,8138],\"mapped\",[8052]],[[8139,8139],\"mapped\",[942]],[[8140,8140],\"mapped\",[951,953]],[[8141,8141],\"disallowed_STD3_mapped\",[32,787,768]],[[8142,8142],\"disallowed_STD3_mapped\",[32,787,769]],[[8143,8143],\"disallowed_STD3_mapped\",[32,787,834]],[[8144,8146],\"valid\"],[[8147,8147],\"mapped\",[912]],[[8148,8149],\"disallowed\"],[[8150,8151],\"valid\"],[[8152,8152],\"mapped\",[8144]],[[8153,8153],\"mapped\",[8145]],[[8154,8154],\"mapped\",[8054]],[[8155,8155],\"mapped\",[943]],[[8156,8156],\"disallowed\"],[[8157,8157],\"disallowed_STD3_mapped\",[32,788,768]],[[8158,8158],\"disallowed_STD3_mapped\",[32,788,769]],[[8159,8159],\"disallowed_STD3_mapped\",[32,788,834]],[[8160,8162],\"valid\"],[[8163,8163],\"mapped\",[944]],[[8164,8167],\"valid\"],[[8168,8168],\"mapped\",[8160]],[[8169,8169],\"mapped\",[8161]],[[8170,8170],\"mapped\",[8058]],[[8171,8171],\"mapped\",[973]],[[8172,8172],\"mapped\",[8165]],[[8173,8173],\"disallowed_STD3_mapped\",[32,776,768]],[[8174,8174],\"disallowed_STD3_mapped\",[32,776,769]],[[8175,8175],\"disallowed_STD3_mapped\",[96]],[[8176,8177],\"disallowed\"],[[8178,8178],\"mapped\",[8060,953]],[[8179,8179],\"mapped\",[969,953]],[[8180,8180],\"mapped\",[974,953]],[[8181,8181],\"disallowed\"],[[8182,8182],\"valid\"],[[8183,8183],\"mapped\",[8182,953]],[[8184,8184],\"mapped\",[8056]],[[8185,8185],\"mapped\",[972]],[[8186,8186],\"mapped\",[8060]],[[8187,8187],\"mapped\",[974]],[[8188,8188],\"mapped\",[969,953]],[[8189,8189],\"disallowed_STD3_mapped\",[32,769]],[[8190,8190],\"disallowed_STD3_mapped\",[32,788]],[[8191,8191],\"disallowed\"],[[8192,8202],\"disallowed_STD3_mapped\",[32]],[[8203,8203],\"ignored\"],[[8204,8205],\"deviation\",[]],[[8206,8207],\"disallowed\"],[[8208,8208],\"valid\",[],\"NV8\"],[[8209,8209],\"mapped\",[8208]],[[8210,8214],\"valid\",[],\"NV8\"],[[8215,8215],\"disallowed_STD3_mapped\",[32,819]],[[8216,8227],\"valid\",[],\"NV8\"],[[8228,8230],\"disallowed\"],[[8231,8231],\"valid\",[],\"NV8\"],[[8232,8238],\"disallowed\"],[[8239,8239],\"disallowed_STD3_mapped\",[32]],[[8240,8242],\"valid\",[],\"NV8\"],[[8243,8243],\"mapped\",[8242,8242]],[[8244,8244],\"mapped\",[8242,8242,8242]],[[8245,8245],\"valid\",[],\"NV8\"],[[8246,8246],\"mapped\",[8245,8245]],[[8247,8247],\"mapped\",[8245,8245,8245]],[[8248,8251],\"valid\",[],\"NV8\"],[[8252,8252],\"disallowed_STD3_mapped\",[33,33]],[[8253,8253],\"valid\",[],\"NV8\"],[[8254,8254],\"disallowed_STD3_mapped\",[32,773]],[[8255,8262],\"valid\",[],\"NV8\"],[[8263,8263],\"disallowed_STD3_mapped\",[63,63]],[[8264,8264],\"disallowed_STD3_mapped\",[63,33]],[[8265,8265],\"disallowed_STD3_mapped\",[33,63]],[[8266,8269],\"valid\",[],\"NV8\"],[[8270,8274],\"valid\",[],\"NV8\"],[[8275,8276],\"valid\",[],\"NV8\"],[[8277,8278],\"valid\",[],\"NV8\"],[[8279,8279],\"mapped\",[8242,8242,8242,8242]],[[8280,8286],\"valid\",[],\"NV8\"],[[8287,8287],\"disallowed_STD3_mapped\",[32]],[[8288,8288],\"ignored\"],[[8289,8291],\"disallowed\"],[[8292,8292],\"ignored\"],[[8293,8293],\"disallowed\"],[[8294,8297],\"disallowed\"],[[8298,8303],\"disallowed\"],[[8304,8304],\"mapped\",[48]],[[8305,8305],\"mapped\",[105]],[[8306,8307],\"disallowed\"],[[8308,8308],\"mapped\",[52]],[[8309,8309],\"mapped\",[53]],[[8310,8310],\"mapped\",[54]],[[8311,8311],\"mapped\",[55]],[[8312,8312],\"mapped\",[56]],[[8313,8313],\"mapped\",[57]],[[8314,8314],\"disallowed_STD3_mapped\",[43]],[[8315,8315],\"mapped\",[8722]],[[8316,8316],\"disallowed_STD3_mapped\",[61]],[[8317,8317],\"disallowed_STD3_mapped\",[40]],[[8318,8318],\"disallowed_STD3_mapped\",[41]],[[8319,8319],\"mapped\",[110]],[[8320,8320],\"mapped\",[48]],[[8321,8321],\"mapped\",[49]],[[8322,8322],\"mapped\",[50]],[[8323,8323],\"mapped\",[51]],[[8324,8324],\"mapped\",[52]],[[8325,8325],\"mapped\",[53]],[[8326,8326],\"mapped\",[54]],[[8327,8327],\"mapped\",[55]],[[8328,8328],\"mapped\",[56]],[[8329,8329],\"mapped\",[57]],[[8330,8330],\"disallowed_STD3_mapped\",[43]],[[8331,8331],\"mapped\",[8722]],[[8332,8332],\"disallowed_STD3_mapped\",[61]],[[8333,8333],\"disallowed_STD3_mapped\",[40]],[[8334,8334],\"disallowed_STD3_mapped\",[41]],[[8335,8335],\"disallowed\"],[[8336,8336],\"mapped\",[97]],[[8337,8337],\"mapped\",[101]],[[8338,8338],\"mapped\",[111]],[[8339,8339],\"mapped\",[120]],[[8340,8340],\"mapped\",[601]],[[8341,8341],\"mapped\",[104]],[[8342,8342],\"mapped\",[107]],[[8343,8343],\"mapped\",[108]],[[8344,8344],\"mapped\",[109]],[[8345,8345],\"mapped\",[110]],[[8346,8346],\"mapped\",[112]],[[8347,8347],\"mapped\",[115]],[[8348,8348],\"mapped\",[116]],[[8349,8351],\"disallowed\"],[[8352,8359],\"valid\",[],\"NV8\"],[[8360,8360],\"mapped\",[114,115]],[[8361,8362],\"valid\",[],\"NV8\"],[[8363,8363],\"valid\",[],\"NV8\"],[[8364,8364],\"valid\",[],\"NV8\"],[[8365,8367],\"valid\",[],\"NV8\"],[[8368,8369],\"valid\",[],\"NV8\"],[[8370,8373],\"valid\",[],\"NV8\"],[[8374,8376],\"valid\",[],\"NV8\"],[[8377,8377],\"valid\",[],\"NV8\"],[[8378,8378],\"valid\",[],\"NV8\"],[[8379,8381],\"valid\",[],\"NV8\"],[[8382,8382],\"valid\",[],\"NV8\"],[[8383,8399],\"disallowed\"],[[8400,8417],\"valid\",[],\"NV8\"],[[8418,8419],\"valid\",[],\"NV8\"],[[8420,8426],\"valid\",[],\"NV8\"],[[8427,8427],\"valid\",[],\"NV8\"],[[8428,8431],\"valid\",[],\"NV8\"],[[8432,8432],\"valid\",[],\"NV8\"],[[8433,8447],\"disallowed\"],[[8448,8448],\"disallowed_STD3_mapped\",[97,47,99]],[[8449,8449],\"disallowed_STD3_mapped\",[97,47,115]],[[8450,8450],\"mapped\",[99]],[[8451,8451],\"mapped\",[176,99]],[[8452,8452],\"valid\",[],\"NV8\"],[[8453,8453],\"disallowed_STD3_mapped\",[99,47,111]],[[8454,8454],\"disallowed_STD3_mapped\",[99,47,117]],[[8455,8455],\"mapped\",[603]],[[8456,8456],\"valid\",[],\"NV8\"],[[8457,8457],\"mapped\",[176,102]],[[8458,8458],\"mapped\",[103]],[[8459,8462],\"mapped\",[104]],[[8463,8463],\"mapped\",[295]],[[8464,8465],\"mapped\",[105]],[[8466,8467],\"mapped\",[108]],[[8468,8468],\"valid\",[],\"NV8\"],[[8469,8469],\"mapped\",[110]],[[8470,8470],\"mapped\",[110,111]],[[8471,8472],\"valid\",[],\"NV8\"],[[8473,8473],\"mapped\",[112]],[[8474,8474],\"mapped\",[113]],[[8475,8477],\"mapped\",[114]],[[8478,8479],\"valid\",[],\"NV8\"],[[8480,8480],\"mapped\",[115,109]],[[8481,8481],\"mapped\",[116,101,108]],[[8482,8482],\"mapped\",[116,109]],[[8483,8483],\"valid\",[],\"NV8\"],[[8484,8484],\"mapped\",[122]],[[8485,8485],\"valid\",[],\"NV8\"],[[8486,8486],\"mapped\",[969]],[[8487,8487],\"valid\",[],\"NV8\"],[[8488,8488],\"mapped\",[122]],[[8489,8489],\"valid\",[],\"NV8\"],[[8490,8490],\"mapped\",[107]],[[8491,8491],\"mapped\",[229]],[[8492,8492],\"mapped\",[98]],[[8493,8493],\"mapped\",[99]],[[8494,8494],\"valid\",[],\"NV8\"],[[8495,8496],\"mapped\",[101]],[[8497,8497],\"mapped\",[102]],[[8498,8498],\"disallowed\"],[[8499,8499],\"mapped\",[109]],[[8500,8500],\"mapped\",[111]],[[8501,8501],\"mapped\",[1488]],[[8502,8502],\"mapped\",[1489]],[[8503,8503],\"mapped\",[1490]],[[8504,8504],\"mapped\",[1491]],[[8505,8505],\"mapped\",[105]],[[8506,8506],\"valid\",[],\"NV8\"],[[8507,8507],\"mapped\",[102,97,120]],[[8508,8508],\"mapped\",[960]],[[8509,8510],\"mapped\",[947]],[[8511,8511],\"mapped\",[960]],[[8512,8512],\"mapped\",[8721]],[[8513,8516],\"valid\",[],\"NV8\"],[[8517,8518],\"mapped\",[100]],[[8519,8519],\"mapped\",[101]],[[8520,8520],\"mapped\",[105]],[[8521,8521],\"mapped\",[106]],[[8522,8523],\"valid\",[],\"NV8\"],[[8524,8524],\"valid\",[],\"NV8\"],[[8525,8525],\"valid\",[],\"NV8\"],[[8526,8526],\"valid\"],[[8527,8527],\"valid\",[],\"NV8\"],[[8528,8528],\"mapped\",[49,8260,55]],[[8529,8529],\"mapped\",[49,8260,57]],[[8530,8530],\"mapped\",[49,8260,49,48]],[[8531,8531],\"mapped\",[49,8260,51]],[[8532,8532],\"mapped\",[50,8260,51]],[[8533,8533],\"mapped\",[49,8260,53]],[[8534,8534],\"mapped\",[50,8260,53]],[[8535,8535],\"mapped\",[51,8260,53]],[[8536,8536],\"mapped\",[52,8260,53]],[[8537,8537],\"mapped\",[49,8260,54]],[[8538,8538],\"mapped\",[53,8260,54]],[[8539,8539],\"mapped\",[49,8260,56]],[[8540,8540],\"mapped\",[51,8260,56]],[[8541,8541],\"mapped\",[53,8260,56]],[[8542,8542],\"mapped\",[55,8260,56]],[[8543,8543],\"mapped\",[49,8260]],[[8544,8544],\"mapped\",[105]],[[8545,8545],\"mapped\",[105,105]],[[8546,8546],\"mapped\",[105,105,105]],[[8547,8547],\"mapped\",[105,118]],[[8548,8548],\"mapped\",[118]],[[8549,8549],\"mapped\",[118,105]],[[8550,8550],\"mapped\",[118,105,105]],[[8551,8551],\"mapped\",[118,105,105,105]],[[8552,8552],\"mapped\",[105,120]],[[8553,8553],\"mapped\",[120]],[[8554,8554],\"mapped\",[120,105]],[[8555,8555],\"mapped\",[120,105,105]],[[8556,8556],\"mapped\",[108]],[[8557,8557],\"mapped\",[99]],[[8558,8558],\"mapped\",[100]],[[8559,8559],\"mapped\",[109]],[[8560,8560],\"mapped\",[105]],[[8561,8561],\"mapped\",[105,105]],[[8562,8562],\"mapped\",[105,105,105]],[[8563,8563],\"mapped\",[105,118]],[[8564,8564],\"mapped\",[118]],[[8565,8565],\"mapped\",[118,105]],[[8566,8566],\"mapped\",[118,105,105]],[[8567,8567],\"mapped\",[118,105,105,105]],[[8568,8568],\"mapped\",[105,120]],[[8569,8569],\"mapped\",[120]],[[8570,8570],\"mapped\",[120,105]],[[8571,8571],\"mapped\",[120,105,105]],[[8572,8572],\"mapped\",[108]],[[8573,8573],\"mapped\",[99]],[[8574,8574],\"mapped\",[100]],[[8575,8575],\"mapped\",[109]],[[8576,8578],\"valid\",[],\"NV8\"],[[8579,8579],\"disallowed\"],[[8580,8580],\"valid\"],[[8581,8584],\"valid\",[],\"NV8\"],[[8585,8585],\"mapped\",[48,8260,51]],[[8586,8587],\"valid\",[],\"NV8\"],[[8588,8591],\"disallowed\"],[[8592,8682],\"valid\",[],\"NV8\"],[[8683,8691],\"valid\",[],\"NV8\"],[[8692,8703],\"valid\",[],\"NV8\"],[[8704,8747],\"valid\",[],\"NV8\"],[[8748,8748],\"mapped\",[8747,8747]],[[8749,8749],\"mapped\",[8747,8747,8747]],[[8750,8750],\"valid\",[],\"NV8\"],[[8751,8751],\"mapped\",[8750,8750]],[[8752,8752],\"mapped\",[8750,8750,8750]],[[8753,8799],\"valid\",[],\"NV8\"],[[8800,8800],\"disallowed_STD3_valid\"],[[8801,8813],\"valid\",[],\"NV8\"],[[8814,8815],\"disallowed_STD3_valid\"],[[8816,8945],\"valid\",[],\"NV8\"],[[8946,8959],\"valid\",[],\"NV8\"],[[8960,8960],\"valid\",[],\"NV8\"],[[8961,8961],\"valid\",[],\"NV8\"],[[8962,9000],\"valid\",[],\"NV8\"],[[9001,9001],\"mapped\",[12296]],[[9002,9002],\"mapped\",[12297]],[[9003,9082],\"valid\",[],\"NV8\"],[[9083,9083],\"valid\",[],\"NV8\"],[[9084,9084],\"valid\",[],\"NV8\"],[[9085,9114],\"valid\",[],\"NV8\"],[[9115,9166],\"valid\",[],\"NV8\"],[[9167,9168],\"valid\",[],\"NV8\"],[[9169,9179],\"valid\",[],\"NV8\"],[[9180,9191],\"valid\",[],\"NV8\"],[[9192,9192],\"valid\",[],\"NV8\"],[[9193,9203],\"valid\",[],\"NV8\"],[[9204,9210],\"valid\",[],\"NV8\"],[[9211,9215],\"disallowed\"],[[9216,9252],\"valid\",[],\"NV8\"],[[9253,9254],\"valid\",[],\"NV8\"],[[9255,9279],\"disallowed\"],[[9280,9290],\"valid\",[],\"NV8\"],[[9291,9311],\"disallowed\"],[[9312,9312],\"mapped\",[49]],[[9313,9313],\"mapped\",[50]],[[9314,9314],\"mapped\",[51]],[[9315,9315],\"mapped\",[52]],[[9316,9316],\"mapped\",[53]],[[9317,9317],\"mapped\",[54]],[[9318,9318],\"mapped\",[55]],[[9319,9319],\"mapped\",[56]],[[9320,9320],\"mapped\",[57]],[[9321,9321],\"mapped\",[49,48]],[[9322,9322],\"mapped\",[49,49]],[[9323,9323],\"mapped\",[49,50]],[[9324,9324],\"mapped\",[49,51]],[[9325,9325],\"mapped\",[49,52]],[[9326,9326],\"mapped\",[49,53]],[[9327,9327],\"mapped\",[49,54]],[[9328,9328],\"mapped\",[49,55]],[[9329,9329],\"mapped\",[49,56]],[[9330,9330],\"mapped\",[49,57]],[[9331,9331],\"mapped\",[50,48]],[[9332,9332],\"disallowed_STD3_mapped\",[40,49,41]],[[9333,9333],\"disallowed_STD3_mapped\",[40,50,41]],[[9334,9334],\"disallowed_STD3_mapped\",[40,51,41]],[[9335,9335],\"disallowed_STD3_mapped\",[40,52,41]],[[9336,9336],\"disallowed_STD3_mapped\",[40,53,41]],[[9337,9337],\"disallowed_STD3_mapped\",[40,54,41]],[[9338,9338],\"disallowed_STD3_mapped\",[40,55,41]],[[9339,9339],\"disallowed_STD3_mapped\",[40,56,41]],[[9340,9340],\"disallowed_STD3_mapped\",[40,57,41]],[[9341,9341],\"disallowed_STD3_mapped\",[40,49,48,41]],[[9342,9342],\"disallowed_STD3_mapped\",[40,49,49,41]],[[9343,9343],\"disallowed_STD3_mapped\",[40,49,50,41]],[[9344,9344],\"disallowed_STD3_mapped\",[40,49,51,41]],[[9345,9345],\"disallowed_STD3_mapped\",[40,49,52,41]],[[9346,9346],\"disallowed_STD3_mapped\",[40,49,53,41]],[[9347,9347],\"disallowed_STD3_mapped\",[40,49,54,41]],[[9348,9348],\"disallowed_STD3_mapped\",[40,49,55,41]],[[9349,9349],\"disallowed_STD3_mapped\",[40,49,56,41]],[[9350,9350],\"disallowed_STD3_mapped\",[40,49,57,41]],[[9351,9351],\"disallowed_STD3_mapped\",[40,50,48,41]],[[9352,9371],\"disallowed\"],[[9372,9372],\"disallowed_STD3_mapped\",[40,97,41]],[[9373,9373],\"disallowed_STD3_mapped\",[40,98,41]],[[9374,9374],\"disallowed_STD3_mapped\",[40,99,41]],[[9375,9375],\"disallowed_STD3_mapped\",[40,100,41]],[[9376,9376],\"disallowed_STD3_mapped\",[40,101,41]],[[9377,9377],\"disallowed_STD3_mapped\",[40,102,41]],[[9378,9378],\"disallowed_STD3_mapped\",[40,103,41]],[[9379,9379],\"disallowed_STD3_mapped\",[40,104,41]],[[9380,9380],\"disallowed_STD3_mapped\",[40,105,41]],[[9381,9381],\"disallowed_STD3_mapped\",[40,106,41]],[[9382,9382],\"disallowed_STD3_mapped\",[40,107,41]],[[9383,9383],\"disallowed_STD3_mapped\",[40,108,41]],[[9384,9384],\"disallowed_STD3_mapped\",[40,109,41]],[[9385,9385],\"disallowed_STD3_mapped\",[40,110,41]],[[9386,9386],\"disallowed_STD3_mapped\",[40,111,41]],[[9387,9387],\"disallowed_STD3_mapped\",[40,112,41]],[[9388,9388],\"disallowed_STD3_mapped\",[40,113,41]],[[9389,9389],\"disallowed_STD3_mapped\",[40,114,41]],[[9390,9390],\"disallowed_STD3_mapped\",[40,115,41]],[[9391,9391],\"disallowed_STD3_mapped\",[40,116,41]],[[9392,9392],\"disallowed_STD3_mapped\",[40,117,41]],[[9393,9393],\"disallowed_STD3_mapped\",[40,118,41]],[[9394,9394],\"disallowed_STD3_mapped\",[40,119,41]],[[9395,9395],\"disallowed_STD3_mapped\",[40,120,41]],[[9396,9396],\"disallowed_STD3_mapped\",[40,121,41]],[[9397,9397],\"disallowed_STD3_mapped\",[40,122,41]],[[9398,9398],\"mapped\",[97]],[[9399,9399],\"mapped\",[98]],[[9400,9400],\"mapped\",[99]],[[9401,9401],\"mapped\",[100]],[[9402,9402],\"mapped\",[101]],[[9403,9403],\"mapped\",[102]],[[9404,9404],\"mapped\",[103]],[[9405,9405],\"mapped\",[104]],[[9406,9406],\"mapped\",[105]],[[9407,9407],\"mapped\",[106]],[[9408,9408],\"mapped\",[107]],[[9409,9409],\"mapped\",[108]],[[9410,9410],\"mapped\",[109]],[[9411,9411],\"mapped\",[110]],[[9412,9412],\"mapped\",[111]],[[9413,9413],\"mapped\",[112]],[[9414,9414],\"mapped\",[113]],[[9415,9415],\"mapped\",[114]],[[9416,9416],\"mapped\",[115]],[[9417,9417],\"mapped\",[116]],[[9418,9418],\"mapped\",[117]],[[9419,9419],\"mapped\",[118]],[[9420,9420],\"mapped\",[119]],[[9421,9421],\"mapped\",[120]],[[9422,9422],\"mapped\",[121]],[[9423,9423],\"mapped\",[122]],[[9424,9424],\"mapped\",[97]],[[9425,9425],\"mapped\",[98]],[[9426,9426],\"mapped\",[99]],[[9427,9427],\"mapped\",[100]],[[9428,9428],\"mapped\",[101]],[[9429,9429],\"mapped\",[102]],[[9430,9430],\"mapped\",[103]],[[9431,9431],\"mapped\",[104]],[[9432,9432],\"mapped\",[105]],[[9433,9433],\"mapped\",[106]],[[9434,9434],\"mapped\",[107]],[[9435,9435],\"mapped\",[108]],[[9436,9436],\"mapped\",[109]],[[9437,9437],\"mapped\",[110]],[[9438,9438],\"mapped\",[111]],[[9439,9439],\"mapped\",[112]],[[9440,9440],\"mapped\",[113]],[[9441,9441],\"mapped\",[114]],[[9442,9442],\"mapped\",[115]],[[9443,9443],\"mapped\",[116]],[[9444,9444],\"mapped\",[117]],[[9445,9445],\"mapped\",[118]],[[9446,9446],\"mapped\",[119]],[[9447,9447],\"mapped\",[120]],[[9448,9448],\"mapped\",[121]],[[9449,9449],\"mapped\",[122]],[[9450,9450],\"mapped\",[48]],[[9451,9470],\"valid\",[],\"NV8\"],[[9471,9471],\"valid\",[],\"NV8\"],[[9472,9621],\"valid\",[],\"NV8\"],[[9622,9631],\"valid\",[],\"NV8\"],[[9632,9711],\"valid\",[],\"NV8\"],[[9712,9719],\"valid\",[],\"NV8\"],[[9720,9727],\"valid\",[],\"NV8\"],[[9728,9747],\"valid\",[],\"NV8\"],[[9748,9749],\"valid\",[],\"NV8\"],[[9750,9751],\"valid\",[],\"NV8\"],[[9752,9752],\"valid\",[],\"NV8\"],[[9753,9753],\"valid\",[],\"NV8\"],[[9754,9839],\"valid\",[],\"NV8\"],[[9840,9841],\"valid\",[],\"NV8\"],[[9842,9853],\"valid\",[],\"NV8\"],[[9854,9855],\"valid\",[],\"NV8\"],[[9856,9865],\"valid\",[],\"NV8\"],[[9866,9873],\"valid\",[],\"NV8\"],[[9874,9884],\"valid\",[],\"NV8\"],[[9885,9885],\"valid\",[],\"NV8\"],[[9886,9887],\"valid\",[],\"NV8\"],[[9888,9889],\"valid\",[],\"NV8\"],[[9890,9905],\"valid\",[],\"NV8\"],[[9906,9906],\"valid\",[],\"NV8\"],[[9907,9916],\"valid\",[],\"NV8\"],[[9917,9919],\"valid\",[],\"NV8\"],[[9920,9923],\"valid\",[],\"NV8\"],[[9924,9933],\"valid\",[],\"NV8\"],[[9934,9934],\"valid\",[],\"NV8\"],[[9935,9953],\"valid\",[],\"NV8\"],[[9954,9954],\"valid\",[],\"NV8\"],[[9955,9955],\"valid\",[],\"NV8\"],[[9956,9959],\"valid\",[],\"NV8\"],[[9960,9983],\"valid\",[],\"NV8\"],[[9984,9984],\"valid\",[],\"NV8\"],[[9985,9988],\"valid\",[],\"NV8\"],[[9989,9989],\"valid\",[],\"NV8\"],[[9990,9993],\"valid\",[],\"NV8\"],[[9994,9995],\"valid\",[],\"NV8\"],[[9996,10023],\"valid\",[],\"NV8\"],[[10024,10024],\"valid\",[],\"NV8\"],[[10025,10059],\"valid\",[],\"NV8\"],[[10060,10060],\"valid\",[],\"NV8\"],[[10061,10061],\"valid\",[],\"NV8\"],[[10062,10062],\"valid\",[],\"NV8\"],[[10063,10066],\"valid\",[],\"NV8\"],[[10067,10069],\"valid\",[],\"NV8\"],[[10070,10070],\"valid\",[],\"NV8\"],[[10071,10071],\"valid\",[],\"NV8\"],[[10072,10078],\"valid\",[],\"NV8\"],[[10079,10080],\"valid\",[],\"NV8\"],[[10081,10087],\"valid\",[],\"NV8\"],[[10088,10101],\"valid\",[],\"NV8\"],[[10102,10132],\"valid\",[],\"NV8\"],[[10133,10135],\"valid\",[],\"NV8\"],[[10136,10159],\"valid\",[],\"NV8\"],[[10160,10160],\"valid\",[],\"NV8\"],[[10161,10174],\"valid\",[],\"NV8\"],[[10175,10175],\"valid\",[],\"NV8\"],[[10176,10182],\"valid\",[],\"NV8\"],[[10183,10186],\"valid\",[],\"NV8\"],[[10187,10187],\"valid\",[],\"NV8\"],[[10188,10188],\"valid\",[],\"NV8\"],[[10189,10189],\"valid\",[],\"NV8\"],[[10190,10191],\"valid\",[],\"NV8\"],[[10192,10219],\"valid\",[],\"NV8\"],[[10220,10223],\"valid\",[],\"NV8\"],[[10224,10239],\"valid\",[],\"NV8\"],[[10240,10495],\"valid\",[],\"NV8\"],[[10496,10763],\"valid\",[],\"NV8\"],[[10764,10764],\"mapped\",[8747,8747,8747,8747]],[[10765,10867],\"valid\",[],\"NV8\"],[[10868,10868],\"disallowed_STD3_mapped\",[58,58,61]],[[10869,10869],\"disallowed_STD3_mapped\",[61,61]],[[10870,10870],\"disallowed_STD3_mapped\",[61,61,61]],[[10871,10971],\"valid\",[],\"NV8\"],[[10972,10972],\"mapped\",[10973,824]],[[10973,11007],\"valid\",[],\"NV8\"],[[11008,11021],\"valid\",[],\"NV8\"],[[11022,11027],\"valid\",[],\"NV8\"],[[11028,11034],\"valid\",[],\"NV8\"],[[11035,11039],\"valid\",[],\"NV8\"],[[11040,11043],\"valid\",[],\"NV8\"],[[11044,11084],\"valid\",[],\"NV8\"],[[11085,11087],\"valid\",[],\"NV8\"],[[11088,11092],\"valid\",[],\"NV8\"],[[11093,11097],\"valid\",[],\"NV8\"],[[11098,11123],\"valid\",[],\"NV8\"],[[11124,11125],\"disallowed\"],[[11126,11157],\"valid\",[],\"NV8\"],[[11158,11159],\"disallowed\"],[[11160,11193],\"valid\",[],\"NV8\"],[[11194,11196],\"disallowed\"],[[11197,11208],\"valid\",[],\"NV8\"],[[11209,11209],\"disallowed\"],[[11210,11217],\"valid\",[],\"NV8\"],[[11218,11243],\"disallowed\"],[[11244,11247],\"valid\",[],\"NV8\"],[[11248,11263],\"disallowed\"],[[11264,11264],\"mapped\",[11312]],[[11265,11265],\"mapped\",[11313]],[[11266,11266],\"mapped\",[11314]],[[11267,11267],\"mapped\",[11315]],[[11268,11268],\"mapped\",[11316]],[[11269,11269],\"mapped\",[11317]],[[11270,11270],\"mapped\",[11318]],[[11271,11271],\"mapped\",[11319]],[[11272,11272],\"mapped\",[11320]],[[11273,11273],\"mapped\",[11321]],[[11274,11274],\"mapped\",[11322]],[[11275,11275],\"mapped\",[11323]],[[11276,11276],\"mapped\",[11324]],[[11277,11277],\"mapped\",[11325]],[[11278,11278],\"mapped\",[11326]],[[11279,11279],\"mapped\",[11327]],[[11280,11280],\"mapped\",[11328]],[[11281,11281],\"mapped\",[11329]],[[11282,11282],\"mapped\",[11330]],[[11283,11283],\"mapped\",[11331]],[[11284,11284],\"mapped\",[11332]],[[11285,11285],\"mapped\",[11333]],[[11286,11286],\"mapped\",[11334]],[[11287,11287],\"mapped\",[11335]],[[11288,11288],\"mapped\",[11336]],[[11289,11289],\"mapped\",[11337]],[[11290,11290],\"mapped\",[11338]],[[11291,11291],\"mapped\",[11339]],[[11292,11292],\"mapped\",[11340]],[[11293,11293],\"mapped\",[11341]],[[11294,11294],\"mapped\",[11342]],[[11295,11295],\"mapped\",[11343]],[[11296,11296],\"mapped\",[11344]],[[11297,11297],\"mapped\",[11345]],[[11298,11298],\"mapped\",[11346]],[[11299,11299],\"mapped\",[11347]],[[11300,11300],\"mapped\",[11348]],[[11301,11301],\"mapped\",[11349]],[[11302,11302],\"mapped\",[11350]],[[11303,11303],\"mapped\",[11351]],[[11304,11304],\"mapped\",[11352]],[[11305,11305],\"mapped\",[11353]],[[11306,11306],\"mapped\",[11354]],[[11307,11307],\"mapped\",[11355]],[[11308,11308],\"mapped\",[11356]],[[11309,11309],\"mapped\",[11357]],[[11310,11310],\"mapped\",[11358]],[[11311,11311],\"disallowed\"],[[11312,11358],\"valid\"],[[11359,11359],\"disallowed\"],[[11360,11360],\"mapped\",[11361]],[[11361,11361],\"valid\"],[[11362,11362],\"mapped\",[619]],[[11363,11363],\"mapped\",[7549]],[[11364,11364],\"mapped\",[637]],[[11365,11366],\"valid\"],[[11367,11367],\"mapped\",[11368]],[[11368,11368],\"valid\"],[[11369,11369],\"mapped\",[11370]],[[11370,11370],\"valid\"],[[11371,11371],\"mapped\",[11372]],[[11372,11372],\"valid\"],[[11373,11373],\"mapped\",[593]],[[11374,11374],\"mapped\",[625]],[[11375,11375],\"mapped\",[592]],[[11376,11376],\"mapped\",[594]],[[11377,11377],\"valid\"],[[11378,11378],\"mapped\",[11379]],[[11379,11379],\"valid\"],[[11380,11380],\"valid\"],[[11381,11381],\"mapped\",[11382]],[[11382,11383],\"valid\"],[[11384,11387],\"valid\"],[[11388,11388],\"mapped\",[106]],[[11389,11389],\"mapped\",[118]],[[11390,11390],\"mapped\",[575]],[[11391,11391],\"mapped\",[576]],[[11392,11392],\"mapped\",[11393]],[[11393,11393],\"valid\"],[[11394,11394],\"mapped\",[11395]],[[11395,11395],\"valid\"],[[11396,11396],\"mapped\",[11397]],[[11397,11397],\"valid\"],[[11398,11398],\"mapped\",[11399]],[[11399,11399],\"valid\"],[[11400,11400],\"mapped\",[11401]],[[11401,11401],\"valid\"],[[11402,11402],\"mapped\",[11403]],[[11403,11403],\"valid\"],[[11404,11404],\"mapped\",[11405]],[[11405,11405],\"valid\"],[[11406,11406],\"mapped\",[11407]],[[11407,11407],\"valid\"],[[11408,11408],\"mapped\",[11409]],[[11409,11409],\"valid\"],[[11410,11410],\"mapped\",[11411]],[[11411,11411],\"valid\"],[[11412,11412],\"mapped\",[11413]],[[11413,11413],\"valid\"],[[11414,11414],\"mapped\",[11415]],[[11415,11415],\"valid\"],[[11416,11416],\"mapped\",[11417]],[[11417,11417],\"valid\"],[[11418,11418],\"mapped\",[11419]],[[11419,11419],\"valid\"],[[11420,11420],\"mapped\",[11421]],[[11421,11421],\"valid\"],[[11422,11422],\"mapped\",[11423]],[[11423,11423],\"valid\"],[[11424,11424],\"mapped\",[11425]],[[11425,11425],\"valid\"],[[11426,11426],\"mapped\",[11427]],[[11427,11427],\"valid\"],[[11428,11428],\"mapped\",[11429]],[[11429,11429],\"valid\"],[[11430,11430],\"mapped\",[11431]],[[11431,11431],\"valid\"],[[11432,11432],\"mapped\",[11433]],[[11433,11433],\"valid\"],[[11434,11434],\"mapped\",[11435]],[[11435,11435],\"valid\"],[[11436,11436],\"mapped\",[11437]],[[11437,11437],\"valid\"],[[11438,11438],\"mapped\",[11439]],[[11439,11439],\"valid\"],[[11440,11440],\"mapped\",[11441]],[[11441,11441],\"valid\"],[[11442,11442],\"mapped\",[11443]],[[11443,11443],\"valid\"],[[11444,11444],\"mapped\",[11445]],[[11445,11445],\"valid\"],[[11446,11446],\"mapped\",[11447]],[[11447,11447],\"valid\"],[[11448,11448],\"mapped\",[11449]],[[11449,11449],\"valid\"],[[11450,11450],\"mapped\",[11451]],[[11451,11451],\"valid\"],[[11452,11452],\"mapped\",[11453]],[[11453,11453],\"valid\"],[[11454,11454],\"mapped\",[11455]],[[11455,11455],\"valid\"],[[11456,11456],\"mapped\",[11457]],[[11457,11457],\"valid\"],[[11458,11458],\"mapped\",[11459]],[[11459,11459],\"valid\"],[[11460,11460],\"mapped\",[11461]],[[11461,11461],\"valid\"],[[11462,11462],\"mapped\",[11463]],[[11463,11463],\"valid\"],[[11464,11464],\"mapped\",[11465]],[[11465,11465],\"valid\"],[[11466,11466],\"mapped\",[11467]],[[11467,11467],\"valid\"],[[11468,11468],\"mapped\",[11469]],[[11469,11469],\"valid\"],[[11470,11470],\"mapped\",[11471]],[[11471,11471],\"valid\"],[[11472,11472],\"mapped\",[11473]],[[11473,11473],\"valid\"],[[11474,11474],\"mapped\",[11475]],[[11475,11475],\"valid\"],[[11476,11476],\"mapped\",[11477]],[[11477,11477],\"valid\"],[[11478,11478],\"mapped\",[11479]],[[11479,11479],\"valid\"],[[11480,11480],\"mapped\",[11481]],[[11481,11481],\"valid\"],[[11482,11482],\"mapped\",[11483]],[[11483,11483],\"valid\"],[[11484,11484],\"mapped\",[11485]],[[11485,11485],\"valid\"],[[11486,11486],\"mapped\",[11487]],[[11487,11487],\"valid\"],[[11488,11488],\"mapped\",[11489]],[[11489,11489],\"valid\"],[[11490,11490],\"mapped\",[11491]],[[11491,11492],\"valid\"],[[11493,11498],\"valid\",[],\"NV8\"],[[11499,11499],\"mapped\",[11500]],[[11500,11500],\"valid\"],[[11501,11501],\"mapped\",[11502]],[[11502,11505],\"valid\"],[[11506,11506],\"mapped\",[11507]],[[11507,11507],\"valid\"],[[11508,11512],\"disallowed\"],[[11513,11519],\"valid\",[],\"NV8\"],[[11520,11557],\"valid\"],[[11558,11558],\"disallowed\"],[[11559,11559],\"valid\"],[[11560,11564],\"disallowed\"],[[11565,11565],\"valid\"],[[11566,11567],\"disallowed\"],[[11568,11621],\"valid\"],[[11622,11623],\"valid\"],[[11624,11630],\"disallowed\"],[[11631,11631],\"mapped\",[11617]],[[11632,11632],\"valid\",[],\"NV8\"],[[11633,11646],\"disallowed\"],[[11647,11647],\"valid\"],[[11648,11670],\"valid\"],[[11671,11679],\"disallowed\"],[[11680,11686],\"valid\"],[[11687,11687],\"disallowed\"],[[11688,11694],\"valid\"],[[11695,11695],\"disallowed\"],[[11696,11702],\"valid\"],[[11703,11703],\"disallowed\"],[[11704,11710],\"valid\"],[[11711,11711],\"disallowed\"],[[11712,11718],\"valid\"],[[11719,11719],\"disallowed\"],[[11720,11726],\"valid\"],[[11727,11727],\"disallowed\"],[[11728,11734],\"valid\"],[[11735,11735],\"disallowed\"],[[11736,11742],\"valid\"],[[11743,11743],\"disallowed\"],[[11744,11775],\"valid\"],[[11776,11799],\"valid\",[],\"NV8\"],[[11800,11803],\"valid\",[],\"NV8\"],[[11804,11805],\"valid\",[],\"NV8\"],[[11806,11822],\"valid\",[],\"NV8\"],[[11823,11823],\"valid\"],[[11824,11824],\"valid\",[],\"NV8\"],[[11825,11825],\"valid\",[],\"NV8\"],[[11826,11835],\"valid\",[],\"NV8\"],[[11836,11842],\"valid\",[],\"NV8\"],[[11843,11903],\"disallowed\"],[[11904,11929],\"valid\",[],\"NV8\"],[[11930,11930],\"disallowed\"],[[11931,11934],\"valid\",[],\"NV8\"],[[11935,11935],\"mapped\",[27597]],[[11936,12018],\"valid\",[],\"NV8\"],[[12019,12019],\"mapped\",[40863]],[[12020,12031],\"disallowed\"],[[12032,12032],\"mapped\",[19968]],[[12033,12033],\"mapped\",[20008]],[[12034,12034],\"mapped\",[20022]],[[12035,12035],\"mapped\",[20031]],[[12036,12036],\"mapped\",[20057]],[[12037,12037],\"mapped\",[20101]],[[12038,12038],\"mapped\",[20108]],[[12039,12039],\"mapped\",[20128]],[[12040,12040],\"mapped\",[20154]],[[12041,12041],\"mapped\",[20799]],[[12042,12042],\"mapped\",[20837]],[[12043,12043],\"mapped\",[20843]],[[12044,12044],\"mapped\",[20866]],[[12045,12045],\"mapped\",[20886]],[[12046,12046],\"mapped\",[20907]],[[12047,12047],\"mapped\",[20960]],[[12048,12048],\"mapped\",[20981]],[[12049,12049],\"mapped\",[20992]],[[12050,12050],\"mapped\",[21147]],[[12051,12051],\"mapped\",[21241]],[[12052,12052],\"mapped\",[21269]],[[12053,12053],\"mapped\",[21274]],[[12054,12054],\"mapped\",[21304]],[[12055,12055],\"mapped\",[21313]],[[12056,12056],\"mapped\",[21340]],[[12057,12057],\"mapped\",[21353]],[[12058,12058],\"mapped\",[21378]],[[12059,12059],\"mapped\",[21430]],[[12060,12060],\"mapped\",[21448]],[[12061,12061],\"mapped\",[21475]],[[12062,12062],\"mapped\",[22231]],[[12063,12063],\"mapped\",[22303]],[[12064,12064],\"mapped\",[22763]],[[12065,12065],\"mapped\",[22786]],[[12066,12066],\"mapped\",[22794]],[[12067,12067],\"mapped\",[22805]],[[12068,12068],\"mapped\",[22823]],[[12069,12069],\"mapped\",[22899]],[[12070,12070],\"mapped\",[23376]],[[12071,12071],\"mapped\",[23424]],[[12072,12072],\"mapped\",[23544]],[[12073,12073],\"mapped\",[23567]],[[12074,12074],\"mapped\",[23586]],[[12075,12075],\"mapped\",[23608]],[[12076,12076],\"mapped\",[23662]],[[12077,12077],\"mapped\",[23665]],[[12078,12078],\"mapped\",[24027]],[[12079,12079],\"mapped\",[24037]],[[12080,12080],\"mapped\",[24049]],[[12081,12081],\"mapped\",[24062]],[[12082,12082],\"mapped\",[24178]],[[12083,12083],\"mapped\",[24186]],[[12084,12084],\"mapped\",[24191]],[[12085,12085],\"mapped\",[24308]],[[12086,12086],\"mapped\",[24318]],[[12087,12087],\"mapped\",[24331]],[[12088,12088],\"mapped\",[24339]],[[12089,12089],\"mapped\",[24400]],[[12090,12090],\"mapped\",[24417]],[[12091,12091],\"mapped\",[24435]],[[12092,12092],\"mapped\",[24515]],[[12093,12093],\"mapped\",[25096]],[[12094,12094],\"mapped\",[25142]],[[12095,12095],\"mapped\",[25163]],[[12096,12096],\"mapped\",[25903]],[[12097,12097],\"mapped\",[25908]],[[12098,12098],\"mapped\",[25991]],[[12099,12099],\"mapped\",[26007]],[[12100,12100],\"mapped\",[26020]],[[12101,12101],\"mapped\",[26041]],[[12102,12102],\"mapped\",[26080]],[[12103,12103],\"mapped\",[26085]],[[12104,12104],\"mapped\",[26352]],[[12105,12105],\"mapped\",[26376]],[[12106,12106],\"mapped\",[26408]],[[12107,12107],\"mapped\",[27424]],[[12108,12108],\"mapped\",[27490]],[[12109,12109],\"mapped\",[27513]],[[12110,12110],\"mapped\",[27571]],[[12111,12111],\"mapped\",[27595]],[[12112,12112],\"mapped\",[27604]],[[12113,12113],\"mapped\",[27611]],[[12114,12114],\"mapped\",[27663]],[[12115,12115],\"mapped\",[27668]],[[12116,12116],\"mapped\",[27700]],[[12117,12117],\"mapped\",[28779]],[[12118,12118],\"mapped\",[29226]],[[12119,12119],\"mapped\",[29238]],[[12120,12120],\"mapped\",[29243]],[[12121,12121],\"mapped\",[29247]],[[12122,12122],\"mapped\",[29255]],[[12123,12123],\"mapped\",[29273]],[[12124,12124],\"mapped\",[29275]],[[12125,12125],\"mapped\",[29356]],[[12126,12126],\"mapped\",[29572]],[[12127,12127],\"mapped\",[29577]],[[12128,12128],\"mapped\",[29916]],[[12129,12129],\"mapped\",[29926]],[[12130,12130],\"mapped\",[29976]],[[12131,12131],\"mapped\",[29983]],[[12132,12132],\"mapped\",[29992]],[[12133,12133],\"mapped\",[30000]],[[12134,12134],\"mapped\",[30091]],[[12135,12135],\"mapped\",[30098]],[[12136,12136],\"mapped\",[30326]],[[12137,12137],\"mapped\",[30333]],[[12138,12138],\"mapped\",[30382]],[[12139,12139],\"mapped\",[30399]],[[12140,12140],\"mapped\",[30446]],[[12141,12141],\"mapped\",[30683]],[[12142,12142],\"mapped\",[30690]],[[12143,12143],\"mapped\",[30707]],[[12144,12144],\"mapped\",[31034]],[[12145,12145],\"mapped\",[31160]],[[12146,12146],\"mapped\",[31166]],[[12147,12147],\"mapped\",[31348]],[[12148,12148],\"mapped\",[31435]],[[12149,12149],\"mapped\",[31481]],[[12150,12150],\"mapped\",[31859]],[[12151,12151],\"mapped\",[31992]],[[12152,12152],\"mapped\",[32566]],[[12153,12153],\"mapped\",[32593]],[[12154,12154],\"mapped\",[32650]],[[12155,12155],\"mapped\",[32701]],[[12156,12156],\"mapped\",[32769]],[[12157,12157],\"mapped\",[32780]],[[12158,12158],\"mapped\",[32786]],[[12159,12159],\"mapped\",[32819]],[[12160,12160],\"mapped\",[32895]],[[12161,12161],\"mapped\",[32905]],[[12162,12162],\"mapped\",[33251]],[[12163,12163],\"mapped\",[33258]],[[12164,12164],\"mapped\",[33267]],[[12165,12165],\"mapped\",[33276]],[[12166,12166],\"mapped\",[33292]],[[12167,12167],\"mapped\",[33307]],[[12168,12168],\"mapped\",[33311]],[[12169,12169],\"mapped\",[33390]],[[12170,12170],\"mapped\",[33394]],[[12171,12171],\"mapped\",[33400]],[[12172,12172],\"mapped\",[34381]],[[12173,12173],\"mapped\",[34411]],[[12174,12174],\"mapped\",[34880]],[[12175,12175],\"mapped\",[34892]],[[12176,12176],\"mapped\",[34915]],[[12177,12177],\"mapped\",[35198]],[[12178,12178],\"mapped\",[35211]],[[12179,12179],\"mapped\",[35282]],[[12180,12180],\"mapped\",[35328]],[[12181,12181],\"mapped\",[35895]],[[12182,12182],\"mapped\",[35910]],[[12183,12183],\"mapped\",[35925]],[[12184,12184],\"mapped\",[35960]],[[12185,12185],\"mapped\",[35997]],[[12186,12186],\"mapped\",[36196]],[[12187,12187],\"mapped\",[36208]],[[12188,12188],\"mapped\",[36275]],[[12189,12189],\"mapped\",[36523]],[[12190,12190],\"mapped\",[36554]],[[12191,12191],\"mapped\",[36763]],[[12192,12192],\"mapped\",[36784]],[[12193,12193],\"mapped\",[36789]],[[12194,12194],\"mapped\",[37009]],[[12195,12195],\"mapped\",[37193]],[[12196,12196],\"mapped\",[37318]],[[12197,12197],\"mapped\",[37324]],[[12198,12198],\"mapped\",[37329]],[[12199,12199],\"mapped\",[38263]],[[12200,12200],\"mapped\",[38272]],[[12201,12201],\"mapped\",[38428]],[[12202,12202],\"mapped\",[38582]],[[12203,12203],\"mapped\",[38585]],[[12204,12204],\"mapped\",[38632]],[[12205,12205],\"mapped\",[38737]],[[12206,12206],\"mapped\",[38750]],[[12207,12207],\"mapped\",[38754]],[[12208,12208],\"mapped\",[38761]],[[12209,12209],\"mapped\",[38859]],[[12210,12210],\"mapped\",[38893]],[[12211,12211],\"mapped\",[38899]],[[12212,12212],\"mapped\",[38913]],[[12213,12213],\"mapped\",[39080]],[[12214,12214],\"mapped\",[39131]],[[12215,12215],\"mapped\",[39135]],[[12216,12216],\"mapped\",[39318]],[[12217,12217],\"mapped\",[39321]],[[12218,12218],\"mapped\",[39340]],[[12219,12219],\"mapped\",[39592]],[[12220,12220],\"mapped\",[39640]],[[12221,12221],\"mapped\",[39647]],[[12222,12222],\"mapped\",[39717]],[[12223,12223],\"mapped\",[39727]],[[12224,12224],\"mapped\",[39730]],[[12225,12225],\"mapped\",[39740]],[[12226,12226],\"mapped\",[39770]],[[12227,12227],\"mapped\",[40165]],[[12228,12228],\"mapped\",[40565]],[[12229,12229],\"mapped\",[40575]],[[12230,12230],\"mapped\",[40613]],[[12231,12231],\"mapped\",[40635]],[[12232,12232],\"mapped\",[40643]],[[12233,12233],\"mapped\",[40653]],[[12234,12234],\"mapped\",[40657]],[[12235,12235],\"mapped\",[40697]],[[12236,12236],\"mapped\",[40701]],[[12237,12237],\"mapped\",[40718]],[[12238,12238],\"mapped\",[40723]],[[12239,12239],\"mapped\",[40736]],[[12240,12240],\"mapped\",[40763]],[[12241,12241],\"mapped\",[40778]],[[12242,12242],\"mapped\",[40786]],[[12243,12243],\"mapped\",[40845]],[[12244,12244],\"mapped\",[40860]],[[12245,12245],\"mapped\",[40864]],[[12246,12271],\"disallowed\"],[[12272,12283],\"disallowed\"],[[12284,12287],\"disallowed\"],[[12288,12288],\"disallowed_STD3_mapped\",[32]],[[12289,12289],\"valid\",[],\"NV8\"],[[12290,12290],\"mapped\",[46]],[[12291,12292],\"valid\",[],\"NV8\"],[[12293,12295],\"valid\"],[[12296,12329],\"valid\",[],\"NV8\"],[[12330,12333],\"valid\"],[[12334,12341],\"valid\",[],\"NV8\"],[[12342,12342],\"mapped\",[12306]],[[12343,12343],\"valid\",[],\"NV8\"],[[12344,12344],\"mapped\",[21313]],[[12345,12345],\"mapped\",[21316]],[[12346,12346],\"mapped\",[21317]],[[12347,12347],\"valid\",[],\"NV8\"],[[12348,12348],\"valid\"],[[12349,12349],\"valid\",[],\"NV8\"],[[12350,12350],\"valid\",[],\"NV8\"],[[12351,12351],\"valid\",[],\"NV8\"],[[12352,12352],\"disallowed\"],[[12353,12436],\"valid\"],[[12437,12438],\"valid\"],[[12439,12440],\"disallowed\"],[[12441,12442],\"valid\"],[[12443,12443],\"disallowed_STD3_mapped\",[32,12441]],[[12444,12444],\"disallowed_STD3_mapped\",[32,12442]],[[12445,12446],\"valid\"],[[12447,12447],\"mapped\",[12424,12426]],[[12448,12448],\"valid\",[],\"NV8\"],[[12449,12542],\"valid\"],[[12543,12543],\"mapped\",[12467,12488]],[[12544,12548],\"disallowed\"],[[12549,12588],\"valid\"],[[12589,12589],\"valid\"],[[12590,12592],\"disallowed\"],[[12593,12593],\"mapped\",[4352]],[[12594,12594],\"mapped\",[4353]],[[12595,12595],\"mapped\",[4522]],[[12596,12596],\"mapped\",[4354]],[[12597,12597],\"mapped\",[4524]],[[12598,12598],\"mapped\",[4525]],[[12599,12599],\"mapped\",[4355]],[[12600,12600],\"mapped\",[4356]],[[12601,12601],\"mapped\",[4357]],[[12602,12602],\"mapped\",[4528]],[[12603,12603],\"mapped\",[4529]],[[12604,12604],\"mapped\",[4530]],[[12605,12605],\"mapped\",[4531]],[[12606,12606],\"mapped\",[4532]],[[12607,12607],\"mapped\",[4533]],[[12608,12608],\"mapped\",[4378]],[[12609,12609],\"mapped\",[4358]],[[12610,12610],\"mapped\",[4359]],[[12611,12611],\"mapped\",[4360]],[[12612,12612],\"mapped\",[4385]],[[12613,12613],\"mapped\",[4361]],[[12614,12614],\"mapped\",[4362]],[[12615,12615],\"mapped\",[4363]],[[12616,12616],\"mapped\",[4364]],[[12617,12617],\"mapped\",[4365]],[[12618,12618],\"mapped\",[4366]],[[12619,12619],\"mapped\",[4367]],[[12620,12620],\"mapped\",[4368]],[[12621,12621],\"mapped\",[4369]],[[12622,12622],\"mapped\",[4370]],[[12623,12623],\"mapped\",[4449]],[[12624,12624],\"mapped\",[4450]],[[12625,12625],\"mapped\",[4451]],[[12626,12626],\"mapped\",[4452]],[[12627,12627],\"mapped\",[4453]],[[12628,12628],\"mapped\",[4454]],[[12629,12629],\"mapped\",[4455]],[[12630,12630],\"mapped\",[4456]],[[12631,12631],\"mapped\",[4457]],[[12632,12632],\"mapped\",[4458]],[[12633,12633],\"mapped\",[4459]],[[12634,12634],\"mapped\",[4460]],[[12635,12635],\"mapped\",[4461]],[[12636,12636],\"mapped\",[4462]],[[12637,12637],\"mapped\",[4463]],[[12638,12638],\"mapped\",[4464]],[[12639,12639],\"mapped\",[4465]],[[12640,12640],\"mapped\",[4466]],[[12641,12641],\"mapped\",[4467]],[[12642,12642],\"mapped\",[4468]],[[12643,12643],\"mapped\",[4469]],[[12644,12644],\"disallowed\"],[[12645,12645],\"mapped\",[4372]],[[12646,12646],\"mapped\",[4373]],[[12647,12647],\"mapped\",[4551]],[[12648,12648],\"mapped\",[4552]],[[12649,12649],\"mapped\",[4556]],[[12650,12650],\"mapped\",[4558]],[[12651,12651],\"mapped\",[4563]],[[12652,12652],\"mapped\",[4567]],[[12653,12653],\"mapped\",[4569]],[[12654,12654],\"mapped\",[4380]],[[12655,12655],\"mapped\",[4573]],[[12656,12656],\"mapped\",[4575]],[[12657,12657],\"mapped\",[4381]],[[12658,12658],\"mapped\",[4382]],[[12659,12659],\"mapped\",[4384]],[[12660,12660],\"mapped\",[4386]],[[12661,12661],\"mapped\",[4387]],[[12662,12662],\"mapped\",[4391]],[[12663,12663],\"mapped\",[4393]],[[12664,12664],\"mapped\",[4395]],[[12665,12665],\"mapped\",[4396]],[[12666,12666],\"mapped\",[4397]],[[12667,12667],\"mapped\",[4398]],[[12668,12668],\"mapped\",[4399]],[[12669,12669],\"mapped\",[4402]],[[12670,12670],\"mapped\",[4406]],[[12671,12671],\"mapped\",[4416]],[[12672,12672],\"mapped\",[4423]],[[12673,12673],\"mapped\",[4428]],[[12674,12674],\"mapped\",[4593]],[[12675,12675],\"mapped\",[4594]],[[12676,12676],\"mapped\",[4439]],[[12677,12677],\"mapped\",[4440]],[[12678,12678],\"mapped\",[4441]],[[12679,12679],\"mapped\",[4484]],[[12680,12680],\"mapped\",[4485]],[[12681,12681],\"mapped\",[4488]],[[12682,12682],\"mapped\",[4497]],[[12683,12683],\"mapped\",[4498]],[[12684,12684],\"mapped\",[4500]],[[12685,12685],\"mapped\",[4510]],[[12686,12686],\"mapped\",[4513]],[[12687,12687],\"disallowed\"],[[12688,12689],\"valid\",[],\"NV8\"],[[12690,12690],\"mapped\",[19968]],[[12691,12691],\"mapped\",[20108]],[[12692,12692],\"mapped\",[19977]],[[12693,12693],\"mapped\",[22235]],[[12694,12694],\"mapped\",[19978]],[[12695,12695],\"mapped\",[20013]],[[12696,12696],\"mapped\",[19979]],[[12697,12697],\"mapped\",[30002]],[[12698,12698],\"mapped\",[20057]],[[12699,12699],\"mapped\",[19993]],[[12700,12700],\"mapped\",[19969]],[[12701,12701],\"mapped\",[22825]],[[12702,12702],\"mapped\",[22320]],[[12703,12703],\"mapped\",[20154]],[[12704,12727],\"valid\"],[[12728,12730],\"valid\"],[[12731,12735],\"disallowed\"],[[12736,12751],\"valid\",[],\"NV8\"],[[12752,12771],\"valid\",[],\"NV8\"],[[12772,12783],\"disallowed\"],[[12784,12799],\"valid\"],[[12800,12800],\"disallowed_STD3_mapped\",[40,4352,41]],[[12801,12801],\"disallowed_STD3_mapped\",[40,4354,41]],[[12802,12802],\"disallowed_STD3_mapped\",[40,4355,41]],[[12803,12803],\"disallowed_STD3_mapped\",[40,4357,41]],[[12804,12804],\"disallowed_STD3_mapped\",[40,4358,41]],[[12805,12805],\"disallowed_STD3_mapped\",[40,4359,41]],[[12806,12806],\"disallowed_STD3_mapped\",[40,4361,41]],[[12807,12807],\"disallowed_STD3_mapped\",[40,4363,41]],[[12808,12808],\"disallowed_STD3_mapped\",[40,4364,41]],[[12809,12809],\"disallowed_STD3_mapped\",[40,4366,41]],[[12810,12810],\"disallowed_STD3_mapped\",[40,4367,41]],[[12811,12811],\"disallowed_STD3_mapped\",[40,4368,41]],[[12812,12812],\"disallowed_STD3_mapped\",[40,4369,41]],[[12813,12813],\"disallowed_STD3_mapped\",[40,4370,41]],[[12814,12814],\"disallowed_STD3_mapped\",[40,44032,41]],[[12815,12815],\"disallowed_STD3_mapped\",[40,45208,41]],[[12816,12816],\"disallowed_STD3_mapped\",[40,45796,41]],[[12817,12817],\"disallowed_STD3_mapped\",[40,46972,41]],[[12818,12818],\"disallowed_STD3_mapped\",[40,47560,41]],[[12819,12819],\"disallowed_STD3_mapped\",[40,48148,41]],[[12820,12820],\"disallowed_STD3_mapped\",[40,49324,41]],[[12821,12821],\"disallowed_STD3_mapped\",[40,50500,41]],[[12822,12822],\"disallowed_STD3_mapped\",[40,51088,41]],[[12823,12823],\"disallowed_STD3_mapped\",[40,52264,41]],[[12824,12824],\"disallowed_STD3_mapped\",[40,52852,41]],[[12825,12825],\"disallowed_STD3_mapped\",[40,53440,41]],[[12826,12826],\"disallowed_STD3_mapped\",[40,54028,41]],[[12827,12827],\"disallowed_STD3_mapped\",[40,54616,41]],[[12828,12828],\"disallowed_STD3_mapped\",[40,51452,41]],[[12829,12829],\"disallowed_STD3_mapped\",[40,50724,51204,41]],[[12830,12830],\"disallowed_STD3_mapped\",[40,50724,54980,41]],[[12831,12831],\"disallowed\"],[[12832,12832],\"disallowed_STD3_mapped\",[40,19968,41]],[[12833,12833],\"disallowed_STD3_mapped\",[40,20108,41]],[[12834,12834],\"disallowed_STD3_mapped\",[40,19977,41]],[[12835,12835],\"disallowed_STD3_mapped\",[40,22235,41]],[[12836,12836],\"disallowed_STD3_mapped\",[40,20116,41]],[[12837,12837],\"disallowed_STD3_mapped\",[40,20845,41]],[[12838,12838],\"disallowed_STD3_mapped\",[40,19971,41]],[[12839,12839],\"disallowed_STD3_mapped\",[40,20843,41]],[[12840,12840],\"disallowed_STD3_mapped\",[40,20061,41]],[[12841,12841],\"disallowed_STD3_mapped\",[40,21313,41]],[[12842,12842],\"disallowed_STD3_mapped\",[40,26376,41]],[[12843,12843],\"disallowed_STD3_mapped\",[40,28779,41]],[[12844,12844],\"disallowed_STD3_mapped\",[40,27700,41]],[[12845,12845],\"disallowed_STD3_mapped\",[40,26408,41]],[[12846,12846],\"disallowed_STD3_mapped\",[40,37329,41]],[[12847,12847],\"disallowed_STD3_mapped\",[40,22303,41]],[[12848,12848],\"disallowed_STD3_mapped\",[40,26085,41]],[[12849,12849],\"disallowed_STD3_mapped\",[40,26666,41]],[[12850,12850],\"disallowed_STD3_mapped\",[40,26377,41]],[[12851,12851],\"disallowed_STD3_mapped\",[40,31038,41]],[[12852,12852],\"disallowed_STD3_mapped\",[40,21517,41]],[[12853,12853],\"disallowed_STD3_mapped\",[40,29305,41]],[[12854,12854],\"disallowed_STD3_mapped\",[40,36001,41]],[[12855,12855],\"disallowed_STD3_mapped\",[40,31069,41]],[[12856,12856],\"disallowed_STD3_mapped\",[40,21172,41]],[[12857,12857],\"disallowed_STD3_mapped\",[40,20195,41]],[[12858,12858],\"disallowed_STD3_mapped\",[40,21628,41]],[[12859,12859],\"disallowed_STD3_mapped\",[40,23398,41]],[[12860,12860],\"disallowed_STD3_mapped\",[40,30435,41]],[[12861,12861],\"disallowed_STD3_mapped\",[40,20225,41]],[[12862,12862],\"disallowed_STD3_mapped\",[40,36039,41]],[[12863,12863],\"disallowed_STD3_mapped\",[40,21332,41]],[[12864,12864],\"disallowed_STD3_mapped\",[40,31085,41]],[[12865,12865],\"disallowed_STD3_mapped\",[40,20241,41]],[[12866,12866],\"disallowed_STD3_mapped\",[40,33258,41]],[[12867,12867],\"disallowed_STD3_mapped\",[40,33267,41]],[[12868,12868],\"mapped\",[21839]],[[12869,12869],\"mapped\",[24188]],[[12870,12870],\"mapped\",[25991]],[[12871,12871],\"mapped\",[31631]],[[12872,12879],\"valid\",[],\"NV8\"],[[12880,12880],\"mapped\",[112,116,101]],[[12881,12881],\"mapped\",[50,49]],[[12882,12882],\"mapped\",[50,50]],[[12883,12883],\"mapped\",[50,51]],[[12884,12884],\"mapped\",[50,52]],[[12885,12885],\"mapped\",[50,53]],[[12886,12886],\"mapped\",[50,54]],[[12887,12887],\"mapped\",[50,55]],[[12888,12888],\"mapped\",[50,56]],[[12889,12889],\"mapped\",[50,57]],[[12890,12890],\"mapped\",[51,48]],[[12891,12891],\"mapped\",[51,49]],[[12892,12892],\"mapped\",[51,50]],[[12893,12893],\"mapped\",[51,51]],[[12894,12894],\"mapped\",[51,52]],[[12895,12895],\"mapped\",[51,53]],[[12896,12896],\"mapped\",[4352]],[[12897,12897],\"mapped\",[4354]],[[12898,12898],\"mapped\",[4355]],[[12899,12899],\"mapped\",[4357]],[[12900,12900],\"mapped\",[4358]],[[12901,12901],\"mapped\",[4359]],[[12902,12902],\"mapped\",[4361]],[[12903,12903],\"mapped\",[4363]],[[12904,12904],\"mapped\",[4364]],[[12905,12905],\"mapped\",[4366]],[[12906,12906],\"mapped\",[4367]],[[12907,12907],\"mapped\",[4368]],[[12908,12908],\"mapped\",[4369]],[[12909,12909],\"mapped\",[4370]],[[12910,12910],\"mapped\",[44032]],[[12911,12911],\"mapped\",[45208]],[[12912,12912],\"mapped\",[45796]],[[12913,12913],\"mapped\",[46972]],[[12914,12914],\"mapped\",[47560]],[[12915,12915],\"mapped\",[48148]],[[12916,12916],\"mapped\",[49324]],[[12917,12917],\"mapped\",[50500]],[[12918,12918],\"mapped\",[51088]],[[12919,12919],\"mapped\",[52264]],[[12920,12920],\"mapped\",[52852]],[[12921,12921],\"mapped\",[53440]],[[12922,12922],\"mapped\",[54028]],[[12923,12923],\"mapped\",[54616]],[[12924,12924],\"mapped\",[52280,44256]],[[12925,12925],\"mapped\",[51452,51032]],[[12926,12926],\"mapped\",[50864]],[[12927,12927],\"valid\",[],\"NV8\"],[[12928,12928],\"mapped\",[19968]],[[12929,12929],\"mapped\",[20108]],[[12930,12930],\"mapped\",[19977]],[[12931,12931],\"mapped\",[22235]],[[12932,12932],\"mapped\",[20116]],[[12933,12933],\"mapped\",[20845]],[[12934,12934],\"mapped\",[19971]],[[12935,12935],\"mapped\",[20843]],[[12936,12936],\"mapped\",[20061]],[[12937,12937],\"mapped\",[21313]],[[12938,12938],\"mapped\",[26376]],[[12939,12939],\"mapped\",[28779]],[[12940,12940],\"mapped\",[27700]],[[12941,12941],\"mapped\",[26408]],[[12942,12942],\"mapped\",[37329]],[[12943,12943],\"mapped\",[22303]],[[12944,12944],\"mapped\",[26085]],[[12945,12945],\"mapped\",[26666]],[[12946,12946],\"mapped\",[26377]],[[12947,12947],\"mapped\",[31038]],[[12948,12948],\"mapped\",[21517]],[[12949,12949],\"mapped\",[29305]],[[12950,12950],\"mapped\",[36001]],[[12951,12951],\"mapped\",[31069]],[[12952,12952],\"mapped\",[21172]],[[12953,12953],\"mapped\",[31192]],[[12954,12954],\"mapped\",[30007]],[[12955,12955],\"mapped\",[22899]],[[12956,12956],\"mapped\",[36969]],[[12957,12957],\"mapped\",[20778]],[[12958,12958],\"mapped\",[21360]],[[12959,12959],\"mapped\",[27880]],[[12960,12960],\"mapped\",[38917]],[[12961,12961],\"mapped\",[20241]],[[12962,12962],\"mapped\",[20889]],[[12963,12963],\"mapped\",[27491]],[[12964,12964],\"mapped\",[19978]],[[12965,12965],\"mapped\",[20013]],[[12966,12966],\"mapped\",[19979]],[[12967,12967],\"mapped\",[24038]],[[12968,12968],\"mapped\",[21491]],[[12969,12969],\"mapped\",[21307]],[[12970,12970],\"mapped\",[23447]],[[12971,12971],\"mapped\",[23398]],[[12972,12972],\"mapped\",[30435]],[[12973,12973],\"mapped\",[20225]],[[12974,12974],\"mapped\",[36039]],[[12975,12975],\"mapped\",[21332]],[[12976,12976],\"mapped\",[22812]],[[12977,12977],\"mapped\",[51,54]],[[12978,12978],\"mapped\",[51,55]],[[12979,12979],\"mapped\",[51,56]],[[12980,12980],\"mapped\",[51,57]],[[12981,12981],\"mapped\",[52,48]],[[12982,12982],\"mapped\",[52,49]],[[12983,12983],\"mapped\",[52,50]],[[12984,12984],\"mapped\",[52,51]],[[12985,12985],\"mapped\",[52,52]],[[12986,12986],\"mapped\",[52,53]],[[12987,12987],\"mapped\",[52,54]],[[12988,12988],\"mapped\",[52,55]],[[12989,12989],\"mapped\",[52,56]],[[12990,12990],\"mapped\",[52,57]],[[12991,12991],\"mapped\",[53,48]],[[12992,12992],\"mapped\",[49,26376]],[[12993,12993],\"mapped\",[50,26376]],[[12994,12994],\"mapped\",[51,26376]],[[12995,12995],\"mapped\",[52,26376]],[[12996,12996],\"mapped\",[53,26376]],[[12997,12997],\"mapped\",[54,26376]],[[12998,12998],\"mapped\",[55,26376]],[[12999,12999],\"mapped\",[56,26376]],[[13000,13000],\"mapped\",[57,26376]],[[13001,13001],\"mapped\",[49,48,26376]],[[13002,13002],\"mapped\",[49,49,26376]],[[13003,13003],\"mapped\",[49,50,26376]],[[13004,13004],\"mapped\",[104,103]],[[13005,13005],\"mapped\",[101,114,103]],[[13006,13006],\"mapped\",[101,118]],[[13007,13007],\"mapped\",[108,116,100]],[[13008,13008],\"mapped\",[12450]],[[13009,13009],\"mapped\",[12452]],[[13010,13010],\"mapped\",[12454]],[[13011,13011],\"mapped\",[12456]],[[13012,13012],\"mapped\",[12458]],[[13013,13013],\"mapped\",[12459]],[[13014,13014],\"mapped\",[12461]],[[13015,13015],\"mapped\",[12463]],[[13016,13016],\"mapped\",[12465]],[[13017,13017],\"mapped\",[12467]],[[13018,13018],\"mapped\",[12469]],[[13019,13019],\"mapped\",[12471]],[[13020,13020],\"mapped\",[12473]],[[13021,13021],\"mapped\",[12475]],[[13022,13022],\"mapped\",[12477]],[[13023,13023],\"mapped\",[12479]],[[13024,13024],\"mapped\",[12481]],[[13025,13025],\"mapped\",[12484]],[[13026,13026],\"mapped\",[12486]],[[13027,13027],\"mapped\",[12488]],[[13028,13028],\"mapped\",[12490]],[[13029,13029],\"mapped\",[12491]],[[13030,13030],\"mapped\",[12492]],[[13031,13031],\"mapped\",[12493]],[[13032,13032],\"mapped\",[12494]],[[13033,13033],\"mapped\",[12495]],[[13034,13034],\"mapped\",[12498]],[[13035,13035],\"mapped\",[12501]],[[13036,13036],\"mapped\",[12504]],[[13037,13037],\"mapped\",[12507]],[[13038,13038],\"mapped\",[12510]],[[13039,13039],\"mapped\",[12511]],[[13040,13040],\"mapped\",[12512]],[[13041,13041],\"mapped\",[12513]],[[13042,13042],\"mapped\",[12514]],[[13043,13043],\"mapped\",[12516]],[[13044,13044],\"mapped\",[12518]],[[13045,13045],\"mapped\",[12520]],[[13046,13046],\"mapped\",[12521]],[[13047,13047],\"mapped\",[12522]],[[13048,13048],\"mapped\",[12523]],[[13049,13049],\"mapped\",[12524]],[[13050,13050],\"mapped\",[12525]],[[13051,13051],\"mapped\",[12527]],[[13052,13052],\"mapped\",[12528]],[[13053,13053],\"mapped\",[12529]],[[13054,13054],\"mapped\",[12530]],[[13055,13055],\"disallowed\"],[[13056,13056],\"mapped\",[12450,12497,12540,12488]],[[13057,13057],\"mapped\",[12450,12523,12501,12449]],[[13058,13058],\"mapped\",[12450,12531,12506,12450]],[[13059,13059],\"mapped\",[12450,12540,12523]],[[13060,13060],\"mapped\",[12452,12491,12531,12464]],[[13061,13061],\"mapped\",[12452,12531,12481]],[[13062,13062],\"mapped\",[12454,12457,12531]],[[13063,13063],\"mapped\",[12456,12473,12463,12540,12489]],[[13064,13064],\"mapped\",[12456,12540,12459,12540]],[[13065,13065],\"mapped\",[12458,12531,12473]],[[13066,13066],\"mapped\",[12458,12540,12512]],[[13067,13067],\"mapped\",[12459,12452,12522]],[[13068,13068],\"mapped\",[12459,12521,12483,12488]],[[13069,13069],\"mapped\",[12459,12525,12522,12540]],[[13070,13070],\"mapped\",[12460,12525,12531]],[[13071,13071],\"mapped\",[12460,12531,12510]],[[13072,13072],\"mapped\",[12462,12460]],[[13073,13073],\"mapped\",[12462,12491,12540]],[[13074,13074],\"mapped\",[12461,12517,12522,12540]],[[13075,13075],\"mapped\",[12462,12523,12480,12540]],[[13076,13076],\"mapped\",[12461,12525]],[[13077,13077],\"mapped\",[12461,12525,12464,12521,12512]],[[13078,13078],\"mapped\",[12461,12525,12513,12540,12488,12523]],[[13079,13079],\"mapped\",[12461,12525,12527,12483,12488]],[[13080,13080],\"mapped\",[12464,12521,12512]],[[13081,13081],\"mapped\",[12464,12521,12512,12488,12531]],[[13082,13082],\"mapped\",[12463,12523,12476,12452,12525]],[[13083,13083],\"mapped\",[12463,12525,12540,12493]],[[13084,13084],\"mapped\",[12465,12540,12473]],[[13085,13085],\"mapped\",[12467,12523,12490]],[[13086,13086],\"mapped\",[12467,12540,12509]],[[13087,13087],\"mapped\",[12469,12452,12463,12523]],[[13088,13088],\"mapped\",[12469,12531,12481,12540,12512]],[[13089,13089],\"mapped\",[12471,12522,12531,12464]],[[13090,13090],\"mapped\",[12475,12531,12481]],[[13091,13091],\"mapped\",[12475,12531,12488]],[[13092,13092],\"mapped\",[12480,12540,12473]],[[13093,13093],\"mapped\",[12487,12471]],[[13094,13094],\"mapped\",[12489,12523]],[[13095,13095],\"mapped\",[12488,12531]],[[13096,13096],\"mapped\",[12490,12494]],[[13097,13097],\"mapped\",[12494,12483,12488]],[[13098,13098],\"mapped\",[12495,12452,12484]],[[13099,13099],\"mapped\",[12497,12540,12475,12531,12488]],[[13100,13100],\"mapped\",[12497,12540,12484]],[[13101,13101],\"mapped\",[12496,12540,12524,12523]],[[13102,13102],\"mapped\",[12500,12450,12473,12488,12523]],[[13103,13103],\"mapped\",[12500,12463,12523]],[[13104,13104],\"mapped\",[12500,12467]],[[13105,13105],\"mapped\",[12499,12523]],[[13106,13106],\"mapped\",[12501,12449,12521,12483,12489]],[[13107,13107],\"mapped\",[12501,12451,12540,12488]],[[13108,13108],\"mapped\",[12502,12483,12471,12455,12523]],[[13109,13109],\"mapped\",[12501,12521,12531]],[[13110,13110],\"mapped\",[12504,12463,12479,12540,12523]],[[13111,13111],\"mapped\",[12506,12477]],[[13112,13112],\"mapped\",[12506,12491,12498]],[[13113,13113],\"mapped\",[12504,12523,12484]],[[13114,13114],\"mapped\",[12506,12531,12473]],[[13115,13115],\"mapped\",[12506,12540,12472]],[[13116,13116],\"mapped\",[12505,12540,12479]],[[13117,13117],\"mapped\",[12509,12452,12531,12488]],[[13118,13118],\"mapped\",[12508,12523,12488]],[[13119,13119],\"mapped\",[12507,12531]],[[13120,13120],\"mapped\",[12509,12531,12489]],[[13121,13121],\"mapped\",[12507,12540,12523]],[[13122,13122],\"mapped\",[12507,12540,12531]],[[13123,13123],\"mapped\",[12510,12452,12463,12525]],[[13124,13124],\"mapped\",[12510,12452,12523]],[[13125,13125],\"mapped\",[12510,12483,12495]],[[13126,13126],\"mapped\",[12510,12523,12463]],[[13127,13127],\"mapped\",[12510,12531,12471,12519,12531]],[[13128,13128],\"mapped\",[12511,12463,12525,12531]],[[13129,13129],\"mapped\",[12511,12522]],[[13130,13130],\"mapped\",[12511,12522,12496,12540,12523]],[[13131,13131],\"mapped\",[12513,12460]],[[13132,13132],\"mapped\",[12513,12460,12488,12531]],[[13133,13133],\"mapped\",[12513,12540,12488,12523]],[[13134,13134],\"mapped\",[12516,12540,12489]],[[13135,13135],\"mapped\",[12516,12540,12523]],[[13136,13136],\"mapped\",[12518,12450,12531]],[[13137,13137],\"mapped\",[12522,12483,12488,12523]],[[13138,13138],\"mapped\",[12522,12521]],[[13139,13139],\"mapped\",[12523,12500,12540]],[[13140,13140],\"mapped\",[12523,12540,12502,12523]],[[13141,13141],\"mapped\",[12524,12512]],[[13142,13142],\"mapped\",[12524,12531,12488,12466,12531]],[[13143,13143],\"mapped\",[12527,12483,12488]],[[13144,13144],\"mapped\",[48,28857]],[[13145,13145],\"mapped\",[49,28857]],[[13146,13146],\"mapped\",[50,28857]],[[13147,13147],\"mapped\",[51,28857]],[[13148,13148],\"mapped\",[52,28857]],[[13149,13149],\"mapped\",[53,28857]],[[13150,13150],\"mapped\",[54,28857]],[[13151,13151],\"mapped\",[55,28857]],[[13152,13152],\"mapped\",[56,28857]],[[13153,13153],\"mapped\",[57,28857]],[[13154,13154],\"mapped\",[49,48,28857]],[[13155,13155],\"mapped\",[49,49,28857]],[[13156,13156],\"mapped\",[49,50,28857]],[[13157,13157],\"mapped\",[49,51,28857]],[[13158,13158],\"mapped\",[49,52,28857]],[[13159,13159],\"mapped\",[49,53,28857]],[[13160,13160],\"mapped\",[49,54,28857]],[[13161,13161],\"mapped\",[49,55,28857]],[[13162,13162],\"mapped\",[49,56,28857]],[[13163,13163],\"mapped\",[49,57,28857]],[[13164,13164],\"mapped\",[50,48,28857]],[[13165,13165],\"mapped\",[50,49,28857]],[[13166,13166],\"mapped\",[50,50,28857]],[[13167,13167],\"mapped\",[50,51,28857]],[[13168,13168],\"mapped\",[50,52,28857]],[[13169,13169],\"mapped\",[104,112,97]],[[13170,13170],\"mapped\",[100,97]],[[13171,13171],\"mapped\",[97,117]],[[13172,13172],\"mapped\",[98,97,114]],[[13173,13173],\"mapped\",[111,118]],[[13174,13174],\"mapped\",[112,99]],[[13175,13175],\"mapped\",[100,109]],[[13176,13176],\"mapped\",[100,109,50]],[[13177,13177],\"mapped\",[100,109,51]],[[13178,13178],\"mapped\",[105,117]],[[13179,13179],\"mapped\",[24179,25104]],[[13180,13180],\"mapped\",[26157,21644]],[[13181,13181],\"mapped\",[22823,27491]],[[13182,13182],\"mapped\",[26126,27835]],[[13183,13183],\"mapped\",[26666,24335,20250,31038]],[[13184,13184],\"mapped\",[112,97]],[[13185,13185],\"mapped\",[110,97]],[[13186,13186],\"mapped\",[956,97]],[[13187,13187],\"mapped\",[109,97]],[[13188,13188],\"mapped\",[107,97]],[[13189,13189],\"mapped\",[107,98]],[[13190,13190],\"mapped\",[109,98]],[[13191,13191],\"mapped\",[103,98]],[[13192,13192],\"mapped\",[99,97,108]],[[13193,13193],\"mapped\",[107,99,97,108]],[[13194,13194],\"mapped\",[112,102]],[[13195,13195],\"mapped\",[110,102]],[[13196,13196],\"mapped\",[956,102]],[[13197,13197],\"mapped\",[956,103]],[[13198,13198],\"mapped\",[109,103]],[[13199,13199],\"mapped\",[107,103]],[[13200,13200],\"mapped\",[104,122]],[[13201,13201],\"mapped\",[107,104,122]],[[13202,13202],\"mapped\",[109,104,122]],[[13203,13203],\"mapped\",[103,104,122]],[[13204,13204],\"mapped\",[116,104,122]],[[13205,13205],\"mapped\",[956,108]],[[13206,13206],\"mapped\",[109,108]],[[13207,13207],\"mapped\",[100,108]],[[13208,13208],\"mapped\",[107,108]],[[13209,13209],\"mapped\",[102,109]],[[13210,13210],\"mapped\",[110,109]],[[13211,13211],\"mapped\",[956,109]],[[13212,13212],\"mapped\",[109,109]],[[13213,13213],\"mapped\",[99,109]],[[13214,13214],\"mapped\",[107,109]],[[13215,13215],\"mapped\",[109,109,50]],[[13216,13216],\"mapped\",[99,109,50]],[[13217,13217],\"mapped\",[109,50]],[[13218,13218],\"mapped\",[107,109,50]],[[13219,13219],\"mapped\",[109,109,51]],[[13220,13220],\"mapped\",[99,109,51]],[[13221,13221],\"mapped\",[109,51]],[[13222,13222],\"mapped\",[107,109,51]],[[13223,13223],\"mapped\",[109,8725,115]],[[13224,13224],\"mapped\",[109,8725,115,50]],[[13225,13225],\"mapped\",[112,97]],[[13226,13226],\"mapped\",[107,112,97]],[[13227,13227],\"mapped\",[109,112,97]],[[13228,13228],\"mapped\",[103,112,97]],[[13229,13229],\"mapped\",[114,97,100]],[[13230,13230],\"mapped\",[114,97,100,8725,115]],[[13231,13231],\"mapped\",[114,97,100,8725,115,50]],[[13232,13232],\"mapped\",[112,115]],[[13233,13233],\"mapped\",[110,115]],[[13234,13234],\"mapped\",[956,115]],[[13235,13235],\"mapped\",[109,115]],[[13236,13236],\"mapped\",[112,118]],[[13237,13237],\"mapped\",[110,118]],[[13238,13238],\"mapped\",[956,118]],[[13239,13239],\"mapped\",[109,118]],[[13240,13240],\"mapped\",[107,118]],[[13241,13241],\"mapped\",[109,118]],[[13242,13242],\"mapped\",[112,119]],[[13243,13243],\"mapped\",[110,119]],[[13244,13244],\"mapped\",[956,119]],[[13245,13245],\"mapped\",[109,119]],[[13246,13246],\"mapped\",[107,119]],[[13247,13247],\"mapped\",[109,119]],[[13248,13248],\"mapped\",[107,969]],[[13249,13249],\"mapped\",[109,969]],[[13250,13250],\"disallowed\"],[[13251,13251],\"mapped\",[98,113]],[[13252,13252],\"mapped\",[99,99]],[[13253,13253],\"mapped\",[99,100]],[[13254,13254],\"mapped\",[99,8725,107,103]],[[13255,13255],\"disallowed\"],[[13256,13256],\"mapped\",[100,98]],[[13257,13257],\"mapped\",[103,121]],[[13258,13258],\"mapped\",[104,97]],[[13259,13259],\"mapped\",[104,112]],[[13260,13260],\"mapped\",[105,110]],[[13261,13261],\"mapped\",[107,107]],[[13262,13262],\"mapped\",[107,109]],[[13263,13263],\"mapped\",[107,116]],[[13264,13264],\"mapped\",[108,109]],[[13265,13265],\"mapped\",[108,110]],[[13266,13266],\"mapped\",[108,111,103]],[[13267,13267],\"mapped\",[108,120]],[[13268,13268],\"mapped\",[109,98]],[[13269,13269],\"mapped\",[109,105,108]],[[13270,13270],\"mapped\",[109,111,108]],[[13271,13271],\"mapped\",[112,104]],[[13272,13272],\"disallowed\"],[[13273,13273],\"mapped\",[112,112,109]],[[13274,13274],\"mapped\",[112,114]],[[13275,13275],\"mapped\",[115,114]],[[13276,13276],\"mapped\",[115,118]],[[13277,13277],\"mapped\",[119,98]],[[13278,13278],\"mapped\",[118,8725,109]],[[13279,13279],\"mapped\",[97,8725,109]],[[13280,13280],\"mapped\",[49,26085]],[[13281,13281],\"mapped\",[50,26085]],[[13282,13282],\"mapped\",[51,26085]],[[13283,13283],\"mapped\",[52,26085]],[[13284,13284],\"mapped\",[53,26085]],[[13285,13285],\"mapped\",[54,26085]],[[13286,13286],\"mapped\",[55,26085]],[[13287,13287],\"mapped\",[56,26085]],[[13288,13288],\"mapped\",[57,26085]],[[13289,13289],\"mapped\",[49,48,26085]],[[13290,13290],\"mapped\",[49,49,26085]],[[13291,13291],\"mapped\",[49,50,26085]],[[13292,13292],\"mapped\",[49,51,26085]],[[13293,13293],\"mapped\",[49,52,26085]],[[13294,13294],\"mapped\",[49,53,26085]],[[13295,13295],\"mapped\",[49,54,26085]],[[13296,13296],\"mapped\",[49,55,26085]],[[13297,13297],\"mapped\",[49,56,26085]],[[13298,13298],\"mapped\",[49,57,26085]],[[13299,13299],\"mapped\",[50,48,26085]],[[13300,13300],\"mapped\",[50,49,26085]],[[13301,13301],\"mapped\",[50,50,26085]],[[13302,13302],\"mapped\",[50,51,26085]],[[13303,13303],\"mapped\",[50,52,26085]],[[13304,13304],\"mapped\",[50,53,26085]],[[13305,13305],\"mapped\",[50,54,26085]],[[13306,13306],\"mapped\",[50,55,26085]],[[13307,13307],\"mapped\",[50,56,26085]],[[13308,13308],\"mapped\",[50,57,26085]],[[13309,13309],\"mapped\",[51,48,26085]],[[13310,13310],\"mapped\",[51,49,26085]],[[13311,13311],\"mapped\",[103,97,108]],[[13312,19893],\"valid\"],[[19894,19903],\"disallowed\"],[[19904,19967],\"valid\",[],\"NV8\"],[[19968,40869],\"valid\"],[[40870,40891],\"valid\"],[[40892,40899],\"valid\"],[[40900,40907],\"valid\"],[[40908,40908],\"valid\"],[[40909,40917],\"valid\"],[[40918,40959],\"disallowed\"],[[40960,42124],\"valid\"],[[42125,42127],\"disallowed\"],[[42128,42145],\"valid\",[],\"NV8\"],[[42146,42147],\"valid\",[],\"NV8\"],[[42148,42163],\"valid\",[],\"NV8\"],[[42164,42164],\"valid\",[],\"NV8\"],[[42165,42176],\"valid\",[],\"NV8\"],[[42177,42177],\"valid\",[],\"NV8\"],[[42178,42180],\"valid\",[],\"NV8\"],[[42181,42181],\"valid\",[],\"NV8\"],[[42182,42182],\"valid\",[],\"NV8\"],[[42183,42191],\"disallowed\"],[[42192,42237],\"valid\"],[[42238,42239],\"valid\",[],\"NV8\"],[[42240,42508],\"valid\"],[[42509,42511],\"valid\",[],\"NV8\"],[[42512,42539],\"valid\"],[[42540,42559],\"disallowed\"],[[42560,42560],\"mapped\",[42561]],[[42561,42561],\"valid\"],[[42562,42562],\"mapped\",[42563]],[[42563,42563],\"valid\"],[[42564,42564],\"mapped\",[42565]],[[42565,42565],\"valid\"],[[42566,42566],\"mapped\",[42567]],[[42567,42567],\"valid\"],[[42568,42568],\"mapped\",[42569]],[[42569,42569],\"valid\"],[[42570,42570],\"mapped\",[42571]],[[42571,42571],\"valid\"],[[42572,42572],\"mapped\",[42573]],[[42573,42573],\"valid\"],[[42574,42574],\"mapped\",[42575]],[[42575,42575],\"valid\"],[[42576,42576],\"mapped\",[42577]],[[42577,42577],\"valid\"],[[42578,42578],\"mapped\",[42579]],[[42579,42579],\"valid\"],[[42580,42580],\"mapped\",[42581]],[[42581,42581],\"valid\"],[[42582,42582],\"mapped\",[42583]],[[42583,42583],\"valid\"],[[42584,42584],\"mapped\",[42585]],[[42585,42585],\"valid\"],[[42586,42586],\"mapped\",[42587]],[[42587,42587],\"valid\"],[[42588,42588],\"mapped\",[42589]],[[42589,42589],\"valid\"],[[42590,42590],\"mapped\",[42591]],[[42591,42591],\"valid\"],[[42592,42592],\"mapped\",[42593]],[[42593,42593],\"valid\"],[[42594,42594],\"mapped\",[42595]],[[42595,42595],\"valid\"],[[42596,42596],\"mapped\",[42597]],[[42597,42597],\"valid\"],[[42598,42598],\"mapped\",[42599]],[[42599,42599],\"valid\"],[[42600,42600],\"mapped\",[42601]],[[42601,42601],\"valid\"],[[42602,42602],\"mapped\",[42603]],[[42603,42603],\"valid\"],[[42604,42604],\"mapped\",[42605]],[[42605,42607],\"valid\"],[[42608,42611],\"valid\",[],\"NV8\"],[[42612,42619],\"valid\"],[[42620,42621],\"valid\"],[[42622,42622],\"valid\",[],\"NV8\"],[[42623,42623],\"valid\"],[[42624,42624],\"mapped\",[42625]],[[42625,42625],\"valid\"],[[42626,42626],\"mapped\",[42627]],[[42627,42627],\"valid\"],[[42628,42628],\"mapped\",[42629]],[[42629,42629],\"valid\"],[[42630,42630],\"mapped\",[42631]],[[42631,42631],\"valid\"],[[42632,42632],\"mapped\",[42633]],[[42633,42633],\"valid\"],[[42634,42634],\"mapped\",[42635]],[[42635,42635],\"valid\"],[[42636,42636],\"mapped\",[42637]],[[42637,42637],\"valid\"],[[42638,42638],\"mapped\",[42639]],[[42639,42639],\"valid\"],[[42640,42640],\"mapped\",[42641]],[[42641,42641],\"valid\"],[[42642,42642],\"mapped\",[42643]],[[42643,42643],\"valid\"],[[42644,42644],\"mapped\",[42645]],[[42645,42645],\"valid\"],[[42646,42646],\"mapped\",[42647]],[[42647,42647],\"valid\"],[[42648,42648],\"mapped\",[42649]],[[42649,42649],\"valid\"],[[42650,42650],\"mapped\",[42651]],[[42651,42651],\"valid\"],[[42652,42652],\"mapped\",[1098]],[[42653,42653],\"mapped\",[1100]],[[42654,42654],\"valid\"],[[42655,42655],\"valid\"],[[42656,42725],\"valid\"],[[42726,42735],\"valid\",[],\"NV8\"],[[42736,42737],\"valid\"],[[42738,42743],\"valid\",[],\"NV8\"],[[42744,42751],\"disallowed\"],[[42752,42774],\"valid\",[],\"NV8\"],[[42775,42778],\"valid\"],[[42779,42783],\"valid\"],[[42784,42785],\"valid\",[],\"NV8\"],[[42786,42786],\"mapped\",[42787]],[[42787,42787],\"valid\"],[[42788,42788],\"mapped\",[42789]],[[42789,42789],\"valid\"],[[42790,42790],\"mapped\",[42791]],[[42791,42791],\"valid\"],[[42792,42792],\"mapped\",[42793]],[[42793,42793],\"valid\"],[[42794,42794],\"mapped\",[42795]],[[42795,42795],\"valid\"],[[42796,42796],\"mapped\",[42797]],[[42797,42797],\"valid\"],[[42798,42798],\"mapped\",[42799]],[[42799,42801],\"valid\"],[[42802,42802],\"mapped\",[42803]],[[42803,42803],\"valid\"],[[42804,42804],\"mapped\",[42805]],[[42805,42805],\"valid\"],[[42806,42806],\"mapped\",[42807]],[[42807,42807],\"valid\"],[[42808,42808],\"mapped\",[42809]],[[42809,42809],\"valid\"],[[42810,42810],\"mapped\",[42811]],[[42811,42811],\"valid\"],[[42812,42812],\"mapped\",[42813]],[[42813,42813],\"valid\"],[[42814,42814],\"mapped\",[42815]],[[42815,42815],\"valid\"],[[42816,42816],\"mapped\",[42817]],[[42817,42817],\"valid\"],[[42818,42818],\"mapped\",[42819]],[[42819,42819],\"valid\"],[[42820,42820],\"mapped\",[42821]],[[42821,42821],\"valid\"],[[42822,42822],\"mapped\",[42823]],[[42823,42823],\"valid\"],[[42824,42824],\"mapped\",[42825]],[[42825,42825],\"valid\"],[[42826,42826],\"mapped\",[42827]],[[42827,42827],\"valid\"],[[42828,42828],\"mapped\",[42829]],[[42829,42829],\"valid\"],[[42830,42830],\"mapped\",[42831]],[[42831,42831],\"valid\"],[[42832,42832],\"mapped\",[42833]],[[42833,42833],\"valid\"],[[42834,42834],\"mapped\",[42835]],[[42835,42835],\"valid\"],[[42836,42836],\"mapped\",[42837]],[[42837,42837],\"valid\"],[[42838,42838],\"mapped\",[42839]],[[42839,42839],\"valid\"],[[42840,42840],\"mapped\",[42841]],[[42841,42841],\"valid\"],[[42842,42842],\"mapped\",[42843]],[[42843,42843],\"valid\"],[[42844,42844],\"mapped\",[42845]],[[42845,42845],\"valid\"],[[42846,42846],\"mapped\",[42847]],[[42847,42847],\"valid\"],[[42848,42848],\"mapped\",[42849]],[[42849,42849],\"valid\"],[[42850,42850],\"mapped\",[42851]],[[42851,42851],\"valid\"],[[42852,42852],\"mapped\",[42853]],[[42853,42853],\"valid\"],[[42854,42854],\"mapped\",[42855]],[[42855,42855],\"valid\"],[[42856,42856],\"mapped\",[42857]],[[42857,42857],\"valid\"],[[42858,42858],\"mapped\",[42859]],[[42859,42859],\"valid\"],[[42860,42860],\"mapped\",[42861]],[[42861,42861],\"valid\"],[[42862,42862],\"mapped\",[42863]],[[42863,42863],\"valid\"],[[42864,42864],\"mapped\",[42863]],[[42865,42872],\"valid\"],[[42873,42873],\"mapped\",[42874]],[[42874,42874],\"valid\"],[[42875,42875],\"mapped\",[42876]],[[42876,42876],\"valid\"],[[42877,42877],\"mapped\",[7545]],[[42878,42878],\"mapped\",[42879]],[[42879,42879],\"valid\"],[[42880,42880],\"mapped\",[42881]],[[42881,42881],\"valid\"],[[42882,42882],\"mapped\",[42883]],[[42883,42883],\"valid\"],[[42884,42884],\"mapped\",[42885]],[[42885,42885],\"valid\"],[[42886,42886],\"mapped\",[42887]],[[42887,42888],\"valid\"],[[42889,42890],\"valid\",[],\"NV8\"],[[42891,42891],\"mapped\",[42892]],[[42892,42892],\"valid\"],[[42893,42893],\"mapped\",[613]],[[42894,42894],\"valid\"],[[42895,42895],\"valid\"],[[42896,42896],\"mapped\",[42897]],[[42897,42897],\"valid\"],[[42898,42898],\"mapped\",[42899]],[[42899,42899],\"valid\"],[[42900,42901],\"valid\"],[[42902,42902],\"mapped\",[42903]],[[42903,42903],\"valid\"],[[42904,42904],\"mapped\",[42905]],[[42905,42905],\"valid\"],[[42906,42906],\"mapped\",[42907]],[[42907,42907],\"valid\"],[[42908,42908],\"mapped\",[42909]],[[42909,42909],\"valid\"],[[42910,42910],\"mapped\",[42911]],[[42911,42911],\"valid\"],[[42912,42912],\"mapped\",[42913]],[[42913,42913],\"valid\"],[[42914,42914],\"mapped\",[42915]],[[42915,42915],\"valid\"],[[42916,42916],\"mapped\",[42917]],[[42917,42917],\"valid\"],[[42918,42918],\"mapped\",[42919]],[[42919,42919],\"valid\"],[[42920,42920],\"mapped\",[42921]],[[42921,42921],\"valid\"],[[42922,42922],\"mapped\",[614]],[[42923,42923],\"mapped\",[604]],[[42924,42924],\"mapped\",[609]],[[42925,42925],\"mapped\",[620]],[[42926,42927],\"disallowed\"],[[42928,42928],\"mapped\",[670]],[[42929,42929],\"mapped\",[647]],[[42930,42930],\"mapped\",[669]],[[42931,42931],\"mapped\",[43859]],[[42932,42932],\"mapped\",[42933]],[[42933,42933],\"valid\"],[[42934,42934],\"mapped\",[42935]],[[42935,42935],\"valid\"],[[42936,42998],\"disallowed\"],[[42999,42999],\"valid\"],[[43000,43000],\"mapped\",[295]],[[43001,43001],\"mapped\",[339]],[[43002,43002],\"valid\"],[[43003,43007],\"valid\"],[[43008,43047],\"valid\"],[[43048,43051],\"valid\",[],\"NV8\"],[[43052,43055],\"disallowed\"],[[43056,43065],\"valid\",[],\"NV8\"],[[43066,43071],\"disallowed\"],[[43072,43123],\"valid\"],[[43124,43127],\"valid\",[],\"NV8\"],[[43128,43135],\"disallowed\"],[[43136,43204],\"valid\"],[[43205,43213],\"disallowed\"],[[43214,43215],\"valid\",[],\"NV8\"],[[43216,43225],\"valid\"],[[43226,43231],\"disallowed\"],[[43232,43255],\"valid\"],[[43256,43258],\"valid\",[],\"NV8\"],[[43259,43259],\"valid\"],[[43260,43260],\"valid\",[],\"NV8\"],[[43261,43261],\"valid\"],[[43262,43263],\"disallowed\"],[[43264,43309],\"valid\"],[[43310,43311],\"valid\",[],\"NV8\"],[[43312,43347],\"valid\"],[[43348,43358],\"disallowed\"],[[43359,43359],\"valid\",[],\"NV8\"],[[43360,43388],\"valid\",[],\"NV8\"],[[43389,43391],\"disallowed\"],[[43392,43456],\"valid\"],[[43457,43469],\"valid\",[],\"NV8\"],[[43470,43470],\"disallowed\"],[[43471,43481],\"valid\"],[[43482,43485],\"disallowed\"],[[43486,43487],\"valid\",[],\"NV8\"],[[43488,43518],\"valid\"],[[43519,43519],\"disallowed\"],[[43520,43574],\"valid\"],[[43575,43583],\"disallowed\"],[[43584,43597],\"valid\"],[[43598,43599],\"disallowed\"],[[43600,43609],\"valid\"],[[43610,43611],\"disallowed\"],[[43612,43615],\"valid\",[],\"NV8\"],[[43616,43638],\"valid\"],[[43639,43641],\"valid\",[],\"NV8\"],[[43642,43643],\"valid\"],[[43644,43647],\"valid\"],[[43648,43714],\"valid\"],[[43715,43738],\"disallowed\"],[[43739,43741],\"valid\"],[[43742,43743],\"valid\",[],\"NV8\"],[[43744,43759],\"valid\"],[[43760,43761],\"valid\",[],\"NV8\"],[[43762,43766],\"valid\"],[[43767,43776],\"disallowed\"],[[43777,43782],\"valid\"],[[43783,43784],\"disallowed\"],[[43785,43790],\"valid\"],[[43791,43792],\"disallowed\"],[[43793,43798],\"valid\"],[[43799,43807],\"disallowed\"],[[43808,43814],\"valid\"],[[43815,43815],\"disallowed\"],[[43816,43822],\"valid\"],[[43823,43823],\"disallowed\"],[[43824,43866],\"valid\"],[[43867,43867],\"valid\",[],\"NV8\"],[[43868,43868],\"mapped\",[42791]],[[43869,43869],\"mapped\",[43831]],[[43870,43870],\"mapped\",[619]],[[43871,43871],\"mapped\",[43858]],[[43872,43875],\"valid\"],[[43876,43877],\"valid\"],[[43878,43887],\"disallowed\"],[[43888,43888],\"mapped\",[5024]],[[43889,43889],\"mapped\",[5025]],[[43890,43890],\"mapped\",[5026]],[[43891,43891],\"mapped\",[5027]],[[43892,43892],\"mapped\",[5028]],[[43893,43893],\"mapped\",[5029]],[[43894,43894],\"mapped\",[5030]],[[43895,43895],\"mapped\",[5031]],[[43896,43896],\"mapped\",[5032]],[[43897,43897],\"mapped\",[5033]],[[43898,43898],\"mapped\",[5034]],[[43899,43899],\"mapped\",[5035]],[[43900,43900],\"mapped\",[5036]],[[43901,43901],\"mapped\",[5037]],[[43902,43902],\"mapped\",[5038]],[[43903,43903],\"mapped\",[5039]],[[43904,43904],\"mapped\",[5040]],[[43905,43905],\"mapped\",[5041]],[[43906,43906],\"mapped\",[5042]],[[43907,43907],\"mapped\",[5043]],[[43908,43908],\"mapped\",[5044]],[[43909,43909],\"mapped\",[5045]],[[43910,43910],\"mapped\",[5046]],[[43911,43911],\"mapped\",[5047]],[[43912,43912],\"mapped\",[5048]],[[43913,43913],\"mapped\",[5049]],[[43914,43914],\"mapped\",[5050]],[[43915,43915],\"mapped\",[5051]],[[43916,43916],\"mapped\",[5052]],[[43917,43917],\"mapped\",[5053]],[[43918,43918],\"mapped\",[5054]],[[43919,43919],\"mapped\",[5055]],[[43920,43920],\"mapped\",[5056]],[[43921,43921],\"mapped\",[5057]],[[43922,43922],\"mapped\",[5058]],[[43923,43923],\"mapped\",[5059]],[[43924,43924],\"mapped\",[5060]],[[43925,43925],\"mapped\",[5061]],[[43926,43926],\"mapped\",[5062]],[[43927,43927],\"mapped\",[5063]],[[43928,43928],\"mapped\",[5064]],[[43929,43929],\"mapped\",[5065]],[[43930,43930],\"mapped\",[5066]],[[43931,43931],\"mapped\",[5067]],[[43932,43932],\"mapped\",[5068]],[[43933,43933],\"mapped\",[5069]],[[43934,43934],\"mapped\",[5070]],[[43935,43935],\"mapped\",[5071]],[[43936,43936],\"mapped\",[5072]],[[43937,43937],\"mapped\",[5073]],[[43938,43938],\"mapped\",[5074]],[[43939,43939],\"mapped\",[5075]],[[43940,43940],\"mapped\",[5076]],[[43941,43941],\"mapped\",[5077]],[[43942,43942],\"mapped\",[5078]],[[43943,43943],\"mapped\",[5079]],[[43944,43944],\"mapped\",[5080]],[[43945,43945],\"mapped\",[5081]],[[43946,43946],\"mapped\",[5082]],[[43947,43947],\"mapped\",[5083]],[[43948,43948],\"mapped\",[5084]],[[43949,43949],\"mapped\",[5085]],[[43950,43950],\"mapped\",[5086]],[[43951,43951],\"mapped\",[5087]],[[43952,43952],\"mapped\",[5088]],[[43953,43953],\"mapped\",[5089]],[[43954,43954],\"mapped\",[5090]],[[43955,43955],\"mapped\",[5091]],[[43956,43956],\"mapped\",[5092]],[[43957,43957],\"mapped\",[5093]],[[43958,43958],\"mapped\",[5094]],[[43959,43959],\"mapped\",[5095]],[[43960,43960],\"mapped\",[5096]],[[43961,43961],\"mapped\",[5097]],[[43962,43962],\"mapped\",[5098]],[[43963,43963],\"mapped\",[5099]],[[43964,43964],\"mapped\",[5100]],[[43965,43965],\"mapped\",[5101]],[[43966,43966],\"mapped\",[5102]],[[43967,43967],\"mapped\",[5103]],[[43968,44010],\"valid\"],[[44011,44011],\"valid\",[],\"NV8\"],[[44012,44013],\"valid\"],[[44014,44015],\"disallowed\"],[[44016,44025],\"valid\"],[[44026,44031],\"disallowed\"],[[44032,55203],\"valid\"],[[55204,55215],\"disallowed\"],[[55216,55238],\"valid\",[],\"NV8\"],[[55239,55242],\"disallowed\"],[[55243,55291],\"valid\",[],\"NV8\"],[[55292,55295],\"disallowed\"],[[55296,57343],\"disallowed\"],[[57344,63743],\"disallowed\"],[[63744,63744],\"mapped\",[35912]],[[63745,63745],\"mapped\",[26356]],[[63746,63746],\"mapped\",[36554]],[[63747,63747],\"mapped\",[36040]],[[63748,63748],\"mapped\",[28369]],[[63749,63749],\"mapped\",[20018]],[[63750,63750],\"mapped\",[21477]],[[63751,63752],\"mapped\",[40860]],[[63753,63753],\"mapped\",[22865]],[[63754,63754],\"mapped\",[37329]],[[63755,63755],\"mapped\",[21895]],[[63756,63756],\"mapped\",[22856]],[[63757,63757],\"mapped\",[25078]],[[63758,63758],\"mapped\",[30313]],[[63759,63759],\"mapped\",[32645]],[[63760,63760],\"mapped\",[34367]],[[63761,63761],\"mapped\",[34746]],[[63762,63762],\"mapped\",[35064]],[[63763,63763],\"mapped\",[37007]],[[63764,63764],\"mapped\",[27138]],[[63765,63765],\"mapped\",[27931]],[[63766,63766],\"mapped\",[28889]],[[63767,63767],\"mapped\",[29662]],[[63768,63768],\"mapped\",[33853]],[[63769,63769],\"mapped\",[37226]],[[63770,63770],\"mapped\",[39409]],[[63771,63771],\"mapped\",[20098]],[[63772,63772],\"mapped\",[21365]],[[63773,63773],\"mapped\",[27396]],[[63774,63774],\"mapped\",[29211]],[[63775,63775],\"mapped\",[34349]],[[63776,63776],\"mapped\",[40478]],[[63777,63777],\"mapped\",[23888]],[[63778,63778],\"mapped\",[28651]],[[63779,63779],\"mapped\",[34253]],[[63780,63780],\"mapped\",[35172]],[[63781,63781],\"mapped\",[25289]],[[63782,63782],\"mapped\",[33240]],[[63783,63783],\"mapped\",[34847]],[[63784,63784],\"mapped\",[24266]],[[63785,63785],\"mapped\",[26391]],[[63786,63786],\"mapped\",[28010]],[[63787,63787],\"mapped\",[29436]],[[63788,63788],\"mapped\",[37070]],[[63789,63789],\"mapped\",[20358]],[[63790,63790],\"mapped\",[20919]],[[63791,63791],\"mapped\",[21214]],[[63792,63792],\"mapped\",[25796]],[[63793,63793],\"mapped\",[27347]],[[63794,63794],\"mapped\",[29200]],[[63795,63795],\"mapped\",[30439]],[[63796,63796],\"mapped\",[32769]],[[63797,63797],\"mapped\",[34310]],[[63798,63798],\"mapped\",[34396]],[[63799,63799],\"mapped\",[36335]],[[63800,63800],\"mapped\",[38706]],[[63801,63801],\"mapped\",[39791]],[[63802,63802],\"mapped\",[40442]],[[63803,63803],\"mapped\",[30860]],[[63804,63804],\"mapped\",[31103]],[[63805,63805],\"mapped\",[32160]],[[63806,63806],\"mapped\",[33737]],[[63807,63807],\"mapped\",[37636]],[[63808,63808],\"mapped\",[40575]],[[63809,63809],\"mapped\",[35542]],[[63810,63810],\"mapped\",[22751]],[[63811,63811],\"mapped\",[24324]],[[63812,63812],\"mapped\",[31840]],[[63813,63813],\"mapped\",[32894]],[[63814,63814],\"mapped\",[29282]],[[63815,63815],\"mapped\",[30922]],[[63816,63816],\"mapped\",[36034]],[[63817,63817],\"mapped\",[38647]],[[63818,63818],\"mapped\",[22744]],[[63819,63819],\"mapped\",[23650]],[[63820,63820],\"mapped\",[27155]],[[63821,63821],\"mapped\",[28122]],[[63822,63822],\"mapped\",[28431]],[[63823,63823],\"mapped\",[32047]],[[63824,63824],\"mapped\",[32311]],[[63825,63825],\"mapped\",[38475]],[[63826,63826],\"mapped\",[21202]],[[63827,63827],\"mapped\",[32907]],[[63828,63828],\"mapped\",[20956]],[[63829,63829],\"mapped\",[20940]],[[63830,63830],\"mapped\",[31260]],[[63831,63831],\"mapped\",[32190]],[[63832,63832],\"mapped\",[33777]],[[63833,63833],\"mapped\",[38517]],[[63834,63834],\"mapped\",[35712]],[[63835,63835],\"mapped\",[25295]],[[63836,63836],\"mapped\",[27138]],[[63837,63837],\"mapped\",[35582]],[[63838,63838],\"mapped\",[20025]],[[63839,63839],\"mapped\",[23527]],[[63840,63840],\"mapped\",[24594]],[[63841,63841],\"mapped\",[29575]],[[63842,63842],\"mapped\",[30064]],[[63843,63843],\"mapped\",[21271]],[[63844,63844],\"mapped\",[30971]],[[63845,63845],\"mapped\",[20415]],[[63846,63846],\"mapped\",[24489]],[[63847,63847],\"mapped\",[19981]],[[63848,63848],\"mapped\",[27852]],[[63849,63849],\"mapped\",[25976]],[[63850,63850],\"mapped\",[32034]],[[63851,63851],\"mapped\",[21443]],[[63852,63852],\"mapped\",[22622]],[[63853,63853],\"mapped\",[30465]],[[63854,63854],\"mapped\",[33865]],[[63855,63855],\"mapped\",[35498]],[[63856,63856],\"mapped\",[27578]],[[63857,63857],\"mapped\",[36784]],[[63858,63858],\"mapped\",[27784]],[[63859,63859],\"mapped\",[25342]],[[63860,63860],\"mapped\",[33509]],[[63861,63861],\"mapped\",[25504]],[[63862,63862],\"mapped\",[30053]],[[63863,63863],\"mapped\",[20142]],[[63864,63864],\"mapped\",[20841]],[[63865,63865],\"mapped\",[20937]],[[63866,63866],\"mapped\",[26753]],[[63867,63867],\"mapped\",[31975]],[[63868,63868],\"mapped\",[33391]],[[63869,63869],\"mapped\",[35538]],[[63870,63870],\"mapped\",[37327]],[[63871,63871],\"mapped\",[21237]],[[63872,63872],\"mapped\",[21570]],[[63873,63873],\"mapped\",[22899]],[[63874,63874],\"mapped\",[24300]],[[63875,63875],\"mapped\",[26053]],[[63876,63876],\"mapped\",[28670]],[[63877,63877],\"mapped\",[31018]],[[63878,63878],\"mapped\",[38317]],[[63879,63879],\"mapped\",[39530]],[[63880,63880],\"mapped\",[40599]],[[63881,63881],\"mapped\",[40654]],[[63882,63882],\"mapped\",[21147]],[[63883,63883],\"mapped\",[26310]],[[63884,63884],\"mapped\",[27511]],[[63885,63885],\"mapped\",[36706]],[[63886,63886],\"mapped\",[24180]],[[63887,63887],\"mapped\",[24976]],[[63888,63888],\"mapped\",[25088]],[[63889,63889],\"mapped\",[25754]],[[63890,63890],\"mapped\",[28451]],[[63891,63891],\"mapped\",[29001]],[[63892,63892],\"mapped\",[29833]],[[63893,63893],\"mapped\",[31178]],[[63894,63894],\"mapped\",[32244]],[[63895,63895],\"mapped\",[32879]],[[63896,63896],\"mapped\",[36646]],[[63897,63897],\"mapped\",[34030]],[[63898,63898],\"mapped\",[36899]],[[63899,63899],\"mapped\",[37706]],[[63900,63900],\"mapped\",[21015]],[[63901,63901],\"mapped\",[21155]],[[63902,63902],\"mapped\",[21693]],[[63903,63903],\"mapped\",[28872]],[[63904,63904],\"mapped\",[35010]],[[63905,63905],\"mapped\",[35498]],[[63906,63906],\"mapped\",[24265]],[[63907,63907],\"mapped\",[24565]],[[63908,63908],\"mapped\",[25467]],[[63909,63909],\"mapped\",[27566]],[[63910,63910],\"mapped\",[31806]],[[63911,63911],\"mapped\",[29557]],[[63912,63912],\"mapped\",[20196]],[[63913,63913],\"mapped\",[22265]],[[63914,63914],\"mapped\",[23527]],[[63915,63915],\"mapped\",[23994]],[[63916,63916],\"mapped\",[24604]],[[63917,63917],\"mapped\",[29618]],[[63918,63918],\"mapped\",[29801]],[[63919,63919],\"mapped\",[32666]],[[63920,63920],\"mapped\",[32838]],[[63921,63921],\"mapped\",[37428]],[[63922,63922],\"mapped\",[38646]],[[63923,63923],\"mapped\",[38728]],[[63924,63924],\"mapped\",[38936]],[[63925,63925],\"mapped\",[20363]],[[63926,63926],\"mapped\",[31150]],[[63927,63927],\"mapped\",[37300]],[[63928,63928],\"mapped\",[38584]],[[63929,63929],\"mapped\",[24801]],[[63930,63930],\"mapped\",[20102]],[[63931,63931],\"mapped\",[20698]],[[63932,63932],\"mapped\",[23534]],[[63933,63933],\"mapped\",[23615]],[[63934,63934],\"mapped\",[26009]],[[63935,63935],\"mapped\",[27138]],[[63936,63936],\"mapped\",[29134]],[[63937,63937],\"mapped\",[30274]],[[63938,63938],\"mapped\",[34044]],[[63939,63939],\"mapped\",[36988]],[[63940,63940],\"mapped\",[40845]],[[63941,63941],\"mapped\",[26248]],[[63942,63942],\"mapped\",[38446]],[[63943,63943],\"mapped\",[21129]],[[63944,63944],\"mapped\",[26491]],[[63945,63945],\"mapped\",[26611]],[[63946,63946],\"mapped\",[27969]],[[63947,63947],\"mapped\",[28316]],[[63948,63948],\"mapped\",[29705]],[[63949,63949],\"mapped\",[30041]],[[63950,63950],\"mapped\",[30827]],[[63951,63951],\"mapped\",[32016]],[[63952,63952],\"mapped\",[39006]],[[63953,63953],\"mapped\",[20845]],[[63954,63954],\"mapped\",[25134]],[[63955,63955],\"mapped\",[38520]],[[63956,63956],\"mapped\",[20523]],[[63957,63957],\"mapped\",[23833]],[[63958,63958],\"mapped\",[28138]],[[63959,63959],\"mapped\",[36650]],[[63960,63960],\"mapped\",[24459]],[[63961,63961],\"mapped\",[24900]],[[63962,63962],\"mapped\",[26647]],[[63963,63963],\"mapped\",[29575]],[[63964,63964],\"mapped\",[38534]],[[63965,63965],\"mapped\",[21033]],[[63966,63966],\"mapped\",[21519]],[[63967,63967],\"mapped\",[23653]],[[63968,63968],\"mapped\",[26131]],[[63969,63969],\"mapped\",[26446]],[[63970,63970],\"mapped\",[26792]],[[63971,63971],\"mapped\",[27877]],[[63972,63972],\"mapped\",[29702]],[[63973,63973],\"mapped\",[30178]],[[63974,63974],\"mapped\",[32633]],[[63975,63975],\"mapped\",[35023]],[[63976,63976],\"mapped\",[35041]],[[63977,63977],\"mapped\",[37324]],[[63978,63978],\"mapped\",[38626]],[[63979,63979],\"mapped\",[21311]],[[63980,63980],\"mapped\",[28346]],[[63981,63981],\"mapped\",[21533]],[[63982,63982],\"mapped\",[29136]],[[63983,63983],\"mapped\",[29848]],[[63984,63984],\"mapped\",[34298]],[[63985,63985],\"mapped\",[38563]],[[63986,63986],\"mapped\",[40023]],[[63987,63987],\"mapped\",[40607]],[[63988,63988],\"mapped\",[26519]],[[63989,63989],\"mapped\",[28107]],[[63990,63990],\"mapped\",[33256]],[[63991,63991],\"mapped\",[31435]],[[63992,63992],\"mapped\",[31520]],[[63993,63993],\"mapped\",[31890]],[[63994,63994],\"mapped\",[29376]],[[63995,63995],\"mapped\",[28825]],[[63996,63996],\"mapped\",[35672]],[[63997,63997],\"mapped\",[20160]],[[63998,63998],\"mapped\",[33590]],[[63999,63999],\"mapped\",[21050]],[[64000,64000],\"mapped\",[20999]],[[64001,64001],\"mapped\",[24230]],[[64002,64002],\"mapped\",[25299]],[[64003,64003],\"mapped\",[31958]],[[64004,64004],\"mapped\",[23429]],[[64005,64005],\"mapped\",[27934]],[[64006,64006],\"mapped\",[26292]],[[64007,64007],\"mapped\",[36667]],[[64008,64008],\"mapped\",[34892]],[[64009,64009],\"mapped\",[38477]],[[64010,64010],\"mapped\",[35211]],[[64011,64011],\"mapped\",[24275]],[[64012,64012],\"mapped\",[20800]],[[64013,64013],\"mapped\",[21952]],[[64014,64015],\"valid\"],[[64016,64016],\"mapped\",[22618]],[[64017,64017],\"valid\"],[[64018,64018],\"mapped\",[26228]],[[64019,64020],\"valid\"],[[64021,64021],\"mapped\",[20958]],[[64022,64022],\"mapped\",[29482]],[[64023,64023],\"mapped\",[30410]],[[64024,64024],\"mapped\",[31036]],[[64025,64025],\"mapped\",[31070]],[[64026,64026],\"mapped\",[31077]],[[64027,64027],\"mapped\",[31119]],[[64028,64028],\"mapped\",[38742]],[[64029,64029],\"mapped\",[31934]],[[64030,64030],\"mapped\",[32701]],[[64031,64031],\"valid\"],[[64032,64032],\"mapped\",[34322]],[[64033,64033],\"valid\"],[[64034,64034],\"mapped\",[35576]],[[64035,64036],\"valid\"],[[64037,64037],\"mapped\",[36920]],[[64038,64038],\"mapped\",[37117]],[[64039,64041],\"valid\"],[[64042,64042],\"mapped\",[39151]],[[64043,64043],\"mapped\",[39164]],[[64044,64044],\"mapped\",[39208]],[[64045,64045],\"mapped\",[40372]],[[64046,64046],\"mapped\",[37086]],[[64047,64047],\"mapped\",[38583]],[[64048,64048],\"mapped\",[20398]],[[64049,64049],\"mapped\",[20711]],[[64050,64050],\"mapped\",[20813]],[[64051,64051],\"mapped\",[21193]],[[64052,64052],\"mapped\",[21220]],[[64053,64053],\"mapped\",[21329]],[[64054,64054],\"mapped\",[21917]],[[64055,64055],\"mapped\",[22022]],[[64056,64056],\"mapped\",[22120]],[[64057,64057],\"mapped\",[22592]],[[64058,64058],\"mapped\",[22696]],[[64059,64059],\"mapped\",[23652]],[[64060,64060],\"mapped\",[23662]],[[64061,64061],\"mapped\",[24724]],[[64062,64062],\"mapped\",[24936]],[[64063,64063],\"mapped\",[24974]],[[64064,64064],\"mapped\",[25074]],[[64065,64065],\"mapped\",[25935]],[[64066,64066],\"mapped\",[26082]],[[64067,64067],\"mapped\",[26257]],[[64068,64068],\"mapped\",[26757]],[[64069,64069],\"mapped\",[28023]],[[64070,64070],\"mapped\",[28186]],[[64071,64071],\"mapped\",[28450]],[[64072,64072],\"mapped\",[29038]],[[64073,64073],\"mapped\",[29227]],[[64074,64074],\"mapped\",[29730]],[[64075,64075],\"mapped\",[30865]],[[64076,64076],\"mapped\",[31038]],[[64077,64077],\"mapped\",[31049]],[[64078,64078],\"mapped\",[31048]],[[64079,64079],\"mapped\",[31056]],[[64080,64080],\"mapped\",[31062]],[[64081,64081],\"mapped\",[31069]],[[64082,64082],\"mapped\",[31117]],[[64083,64083],\"mapped\",[31118]],[[64084,64084],\"mapped\",[31296]],[[64085,64085],\"mapped\",[31361]],[[64086,64086],\"mapped\",[31680]],[[64087,64087],\"mapped\",[32244]],[[64088,64088],\"mapped\",[32265]],[[64089,64089],\"mapped\",[32321]],[[64090,64090],\"mapped\",[32626]],[[64091,64091],\"mapped\",[32773]],[[64092,64092],\"mapped\",[33261]],[[64093,64094],\"mapped\",[33401]],[[64095,64095],\"mapped\",[33879]],[[64096,64096],\"mapped\",[35088]],[[64097,64097],\"mapped\",[35222]],[[64098,64098],\"mapped\",[35585]],[[64099,64099],\"mapped\",[35641]],[[64100,64100],\"mapped\",[36051]],[[64101,64101],\"mapped\",[36104]],[[64102,64102],\"mapped\",[36790]],[[64103,64103],\"mapped\",[36920]],[[64104,64104],\"mapped\",[38627]],[[64105,64105],\"mapped\",[38911]],[[64106,64106],\"mapped\",[38971]],[[64107,64107],\"mapped\",[24693]],[[64108,64108],\"mapped\",[148206]],[[64109,64109],\"mapped\",[33304]],[[64110,64111],\"disallowed\"],[[64112,64112],\"mapped\",[20006]],[[64113,64113],\"mapped\",[20917]],[[64114,64114],\"mapped\",[20840]],[[64115,64115],\"mapped\",[20352]],[[64116,64116],\"mapped\",[20805]],[[64117,64117],\"mapped\",[20864]],[[64118,64118],\"mapped\",[21191]],[[64119,64119],\"mapped\",[21242]],[[64120,64120],\"mapped\",[21917]],[[64121,64121],\"mapped\",[21845]],[[64122,64122],\"mapped\",[21913]],[[64123,64123],\"mapped\",[21986]],[[64124,64124],\"mapped\",[22618]],[[64125,64125],\"mapped\",[22707]],[[64126,64126],\"mapped\",[22852]],[[64127,64127],\"mapped\",[22868]],[[64128,64128],\"mapped\",[23138]],[[64129,64129],\"mapped\",[23336]],[[64130,64130],\"mapped\",[24274]],[[64131,64131],\"mapped\",[24281]],[[64132,64132],\"mapped\",[24425]],[[64133,64133],\"mapped\",[24493]],[[64134,64134],\"mapped\",[24792]],[[64135,64135],\"mapped\",[24910]],[[64136,64136],\"mapped\",[24840]],[[64137,64137],\"mapped\",[24974]],[[64138,64138],\"mapped\",[24928]],[[64139,64139],\"mapped\",[25074]],[[64140,64140],\"mapped\",[25140]],[[64141,64141],\"mapped\",[25540]],[[64142,64142],\"mapped\",[25628]],[[64143,64143],\"mapped\",[25682]],[[64144,64144],\"mapped\",[25942]],[[64145,64145],\"mapped\",[26228]],[[64146,64146],\"mapped\",[26391]],[[64147,64147],\"mapped\",[26395]],[[64148,64148],\"mapped\",[26454]],[[64149,64149],\"mapped\",[27513]],[[64150,64150],\"mapped\",[27578]],[[64151,64151],\"mapped\",[27969]],[[64152,64152],\"mapped\",[28379]],[[64153,64153],\"mapped\",[28363]],[[64154,64154],\"mapped\",[28450]],[[64155,64155],\"mapped\",[28702]],[[64156,64156],\"mapped\",[29038]],[[64157,64157],\"mapped\",[30631]],[[64158,64158],\"mapped\",[29237]],[[64159,64159],\"mapped\",[29359]],[[64160,64160],\"mapped\",[29482]],[[64161,64161],\"mapped\",[29809]],[[64162,64162],\"mapped\",[29958]],[[64163,64163],\"mapped\",[30011]],[[64164,64164],\"mapped\",[30237]],[[64165,64165],\"mapped\",[30239]],[[64166,64166],\"mapped\",[30410]],[[64167,64167],\"mapped\",[30427]],[[64168,64168],\"mapped\",[30452]],[[64169,64169],\"mapped\",[30538]],[[64170,64170],\"mapped\",[30528]],[[64171,64171],\"mapped\",[30924]],[[64172,64172],\"mapped\",[31409]],[[64173,64173],\"mapped\",[31680]],[[64174,64174],\"mapped\",[31867]],[[64175,64175],\"mapped\",[32091]],[[64176,64176],\"mapped\",[32244]],[[64177,64177],\"mapped\",[32574]],[[64178,64178],\"mapped\",[32773]],[[64179,64179],\"mapped\",[33618]],[[64180,64180],\"mapped\",[33775]],[[64181,64181],\"mapped\",[34681]],[[64182,64182],\"mapped\",[35137]],[[64183,64183],\"mapped\",[35206]],[[64184,64184],\"mapped\",[35222]],[[64185,64185],\"mapped\",[35519]],[[64186,64186],\"mapped\",[35576]],[[64187,64187],\"mapped\",[35531]],[[64188,64188],\"mapped\",[35585]],[[64189,64189],\"mapped\",[35582]],[[64190,64190],\"mapped\",[35565]],[[64191,64191],\"mapped\",[35641]],[[64192,64192],\"mapped\",[35722]],[[64193,64193],\"mapped\",[36104]],[[64194,64194],\"mapped\",[36664]],[[64195,64195],\"mapped\",[36978]],[[64196,64196],\"mapped\",[37273]],[[64197,64197],\"mapped\",[37494]],[[64198,64198],\"mapped\",[38524]],[[64199,64199],\"mapped\",[38627]],[[64200,64200],\"mapped\",[38742]],[[64201,64201],\"mapped\",[38875]],[[64202,64202],\"mapped\",[38911]],[[64203,64203],\"mapped\",[38923]],[[64204,64204],\"mapped\",[38971]],[[64205,64205],\"mapped\",[39698]],[[64206,64206],\"mapped\",[40860]],[[64207,64207],\"mapped\",[141386]],[[64208,64208],\"mapped\",[141380]],[[64209,64209],\"mapped\",[144341]],[[64210,64210],\"mapped\",[15261]],[[64211,64211],\"mapped\",[16408]],[[64212,64212],\"mapped\",[16441]],[[64213,64213],\"mapped\",[152137]],[[64214,64214],\"mapped\",[154832]],[[64215,64215],\"mapped\",[163539]],[[64216,64216],\"mapped\",[40771]],[[64217,64217],\"mapped\",[40846]],[[64218,64255],\"disallowed\"],[[64256,64256],\"mapped\",[102,102]],[[64257,64257],\"mapped\",[102,105]],[[64258,64258],\"mapped\",[102,108]],[[64259,64259],\"mapped\",[102,102,105]],[[64260,64260],\"mapped\",[102,102,108]],[[64261,64262],\"mapped\",[115,116]],[[64263,64274],\"disallowed\"],[[64275,64275],\"mapped\",[1396,1398]],[[64276,64276],\"mapped\",[1396,1381]],[[64277,64277],\"mapped\",[1396,1387]],[[64278,64278],\"mapped\",[1406,1398]],[[64279,64279],\"mapped\",[1396,1389]],[[64280,64284],\"disallowed\"],[[64285,64285],\"mapped\",[1497,1460]],[[64286,64286],\"valid\"],[[64287,64287],\"mapped\",[1522,1463]],[[64288,64288],\"mapped\",[1506]],[[64289,64289],\"mapped\",[1488]],[[64290,64290],\"mapped\",[1491]],[[64291,64291],\"mapped\",[1492]],[[64292,64292],\"mapped\",[1499]],[[64293,64293],\"mapped\",[1500]],[[64294,64294],\"mapped\",[1501]],[[64295,64295],\"mapped\",[1512]],[[64296,64296],\"mapped\",[1514]],[[64297,64297],\"disallowed_STD3_mapped\",[43]],[[64298,64298],\"mapped\",[1513,1473]],[[64299,64299],\"mapped\",[1513,1474]],[[64300,64300],\"mapped\",[1513,1468,1473]],[[64301,64301],\"mapped\",[1513,1468,1474]],[[64302,64302],\"mapped\",[1488,1463]],[[64303,64303],\"mapped\",[1488,1464]],[[64304,64304],\"mapped\",[1488,1468]],[[64305,64305],\"mapped\",[1489,1468]],[[64306,64306],\"mapped\",[1490,1468]],[[64307,64307],\"mapped\",[1491,1468]],[[64308,64308],\"mapped\",[1492,1468]],[[64309,64309],\"mapped\",[1493,1468]],[[64310,64310],\"mapped\",[1494,1468]],[[64311,64311],\"disallowed\"],[[64312,64312],\"mapped\",[1496,1468]],[[64313,64313],\"mapped\",[1497,1468]],[[64314,64314],\"mapped\",[1498,1468]],[[64315,64315],\"mapped\",[1499,1468]],[[64316,64316],\"mapped\",[1500,1468]],[[64317,64317],\"disallowed\"],[[64318,64318],\"mapped\",[1502,1468]],[[64319,64319],\"disallowed\"],[[64320,64320],\"mapped\",[1504,1468]],[[64321,64321],\"mapped\",[1505,1468]],[[64322,64322],\"disallowed\"],[[64323,64323],\"mapped\",[1507,1468]],[[64324,64324],\"mapped\",[1508,1468]],[[64325,64325],\"disallowed\"],[[64326,64326],\"mapped\",[1510,1468]],[[64327,64327],\"mapped\",[1511,1468]],[[64328,64328],\"mapped\",[1512,1468]],[[64329,64329],\"mapped\",[1513,1468]],[[64330,64330],\"mapped\",[1514,1468]],[[64331,64331],\"mapped\",[1493,1465]],[[64332,64332],\"mapped\",[1489,1471]],[[64333,64333],\"mapped\",[1499,1471]],[[64334,64334],\"mapped\",[1508,1471]],[[64335,64335],\"mapped\",[1488,1500]],[[64336,64337],\"mapped\",[1649]],[[64338,64341],\"mapped\",[1659]],[[64342,64345],\"mapped\",[1662]],[[64346,64349],\"mapped\",[1664]],[[64350,64353],\"mapped\",[1658]],[[64354,64357],\"mapped\",[1663]],[[64358,64361],\"mapped\",[1657]],[[64362,64365],\"mapped\",[1700]],[[64366,64369],\"mapped\",[1702]],[[64370,64373],\"mapped\",[1668]],[[64374,64377],\"mapped\",[1667]],[[64378,64381],\"mapped\",[1670]],[[64382,64385],\"mapped\",[1671]],[[64386,64387],\"mapped\",[1677]],[[64388,64389],\"mapped\",[1676]],[[64390,64391],\"mapped\",[1678]],[[64392,64393],\"mapped\",[1672]],[[64394,64395],\"mapped\",[1688]],[[64396,64397],\"mapped\",[1681]],[[64398,64401],\"mapped\",[1705]],[[64402,64405],\"mapped\",[1711]],[[64406,64409],\"mapped\",[1715]],[[64410,64413],\"mapped\",[1713]],[[64414,64415],\"mapped\",[1722]],[[64416,64419],\"mapped\",[1723]],[[64420,64421],\"mapped\",[1728]],[[64422,64425],\"mapped\",[1729]],[[64426,64429],\"mapped\",[1726]],[[64430,64431],\"mapped\",[1746]],[[64432,64433],\"mapped\",[1747]],[[64434,64449],\"valid\",[],\"NV8\"],[[64450,64466],\"disallowed\"],[[64467,64470],\"mapped\",[1709]],[[64471,64472],\"mapped\",[1735]],[[64473,64474],\"mapped\",[1734]],[[64475,64476],\"mapped\",[1736]],[[64477,64477],\"mapped\",[1735,1652]],[[64478,64479],\"mapped\",[1739]],[[64480,64481],\"mapped\",[1733]],[[64482,64483],\"mapped\",[1737]],[[64484,64487],\"mapped\",[1744]],[[64488,64489],\"mapped\",[1609]],[[64490,64491],\"mapped\",[1574,1575]],[[64492,64493],\"mapped\",[1574,1749]],[[64494,64495],\"mapped\",[1574,1608]],[[64496,64497],\"mapped\",[1574,1735]],[[64498,64499],\"mapped\",[1574,1734]],[[64500,64501],\"mapped\",[1574,1736]],[[64502,64504],\"mapped\",[1574,1744]],[[64505,64507],\"mapped\",[1574,1609]],[[64508,64511],\"mapped\",[1740]],[[64512,64512],\"mapped\",[1574,1580]],[[64513,64513],\"mapped\",[1574,1581]],[[64514,64514],\"mapped\",[1574,1605]],[[64515,64515],\"mapped\",[1574,1609]],[[64516,64516],\"mapped\",[1574,1610]],[[64517,64517],\"mapped\",[1576,1580]],[[64518,64518],\"mapped\",[1576,1581]],[[64519,64519],\"mapped\",[1576,1582]],[[64520,64520],\"mapped\",[1576,1605]],[[64521,64521],\"mapped\",[1576,1609]],[[64522,64522],\"mapped\",[1576,1610]],[[64523,64523],\"mapped\",[1578,1580]],[[64524,64524],\"mapped\",[1578,1581]],[[64525,64525],\"mapped\",[1578,1582]],[[64526,64526],\"mapped\",[1578,1605]],[[64527,64527],\"mapped\",[1578,1609]],[[64528,64528],\"mapped\",[1578,1610]],[[64529,64529],\"mapped\",[1579,1580]],[[64530,64530],\"mapped\",[1579,1605]],[[64531,64531],\"mapped\",[1579,1609]],[[64532,64532],\"mapped\",[1579,1610]],[[64533,64533],\"mapped\",[1580,1581]],[[64534,64534],\"mapped\",[1580,1605]],[[64535,64535],\"mapped\",[1581,1580]],[[64536,64536],\"mapped\",[1581,1605]],[[64537,64537],\"mapped\",[1582,1580]],[[64538,64538],\"mapped\",[1582,1581]],[[64539,64539],\"mapped\",[1582,1605]],[[64540,64540],\"mapped\",[1587,1580]],[[64541,64541],\"mapped\",[1587,1581]],[[64542,64542],\"mapped\",[1587,1582]],[[64543,64543],\"mapped\",[1587,1605]],[[64544,64544],\"mapped\",[1589,1581]],[[64545,64545],\"mapped\",[1589,1605]],[[64546,64546],\"mapped\",[1590,1580]],[[64547,64547],\"mapped\",[1590,1581]],[[64548,64548],\"mapped\",[1590,1582]],[[64549,64549],\"mapped\",[1590,1605]],[[64550,64550],\"mapped\",[1591,1581]],[[64551,64551],\"mapped\",[1591,1605]],[[64552,64552],\"mapped\",[1592,1605]],[[64553,64553],\"mapped\",[1593,1580]],[[64554,64554],\"mapped\",[1593,1605]],[[64555,64555],\"mapped\",[1594,1580]],[[64556,64556],\"mapped\",[1594,1605]],[[64557,64557],\"mapped\",[1601,1580]],[[64558,64558],\"mapped\",[1601,1581]],[[64559,64559],\"mapped\",[1601,1582]],[[64560,64560],\"mapped\",[1601,1605]],[[64561,64561],\"mapped\",[1601,1609]],[[64562,64562],\"mapped\",[1601,1610]],[[64563,64563],\"mapped\",[1602,1581]],[[64564,64564],\"mapped\",[1602,1605]],[[64565,64565],\"mapped\",[1602,1609]],[[64566,64566],\"mapped\",[1602,1610]],[[64567,64567],\"mapped\",[1603,1575]],[[64568,64568],\"mapped\",[1603,1580]],[[64569,64569],\"mapped\",[1603,1581]],[[64570,64570],\"mapped\",[1603,1582]],[[64571,64571],\"mapped\",[1603,1604]],[[64572,64572],\"mapped\",[1603,1605]],[[64573,64573],\"mapped\",[1603,1609]],[[64574,64574],\"mapped\",[1603,1610]],[[64575,64575],\"mapped\",[1604,1580]],[[64576,64576],\"mapped\",[1604,1581]],[[64577,64577],\"mapped\",[1604,1582]],[[64578,64578],\"mapped\",[1604,1605]],[[64579,64579],\"mapped\",[1604,1609]],[[64580,64580],\"mapped\",[1604,1610]],[[64581,64581],\"mapped\",[1605,1580]],[[64582,64582],\"mapped\",[1605,1581]],[[64583,64583],\"mapped\",[1605,1582]],[[64584,64584],\"mapped\",[1605,1605]],[[64585,64585],\"mapped\",[1605,1609]],[[64586,64586],\"mapped\",[1605,1610]],[[64587,64587],\"mapped\",[1606,1580]],[[64588,64588],\"mapped\",[1606,1581]],[[64589,64589],\"mapped\",[1606,1582]],[[64590,64590],\"mapped\",[1606,1605]],[[64591,64591],\"mapped\",[1606,1609]],[[64592,64592],\"mapped\",[1606,1610]],[[64593,64593],\"mapped\",[1607,1580]],[[64594,64594],\"mapped\",[1607,1605]],[[64595,64595],\"mapped\",[1607,1609]],[[64596,64596],\"mapped\",[1607,1610]],[[64597,64597],\"mapped\",[1610,1580]],[[64598,64598],\"mapped\",[1610,1581]],[[64599,64599],\"mapped\",[1610,1582]],[[64600,64600],\"mapped\",[1610,1605]],[[64601,64601],\"mapped\",[1610,1609]],[[64602,64602],\"mapped\",[1610,1610]],[[64603,64603],\"mapped\",[1584,1648]],[[64604,64604],\"mapped\",[1585,1648]],[[64605,64605],\"mapped\",[1609,1648]],[[64606,64606],\"disallowed_STD3_mapped\",[32,1612,1617]],[[64607,64607],\"disallowed_STD3_mapped\",[32,1613,1617]],[[64608,64608],\"disallowed_STD3_mapped\",[32,1614,1617]],[[64609,64609],\"disallowed_STD3_mapped\",[32,1615,1617]],[[64610,64610],\"disallowed_STD3_mapped\",[32,1616,1617]],[[64611,64611],\"disallowed_STD3_mapped\",[32,1617,1648]],[[64612,64612],\"mapped\",[1574,1585]],[[64613,64613],\"mapped\",[1574,1586]],[[64614,64614],\"mapped\",[1574,1605]],[[64615,64615],\"mapped\",[1574,1606]],[[64616,64616],\"mapped\",[1574,1609]],[[64617,64617],\"mapped\",[1574,1610]],[[64618,64618],\"mapped\",[1576,1585]],[[64619,64619],\"mapped\",[1576,1586]],[[64620,64620],\"mapped\",[1576,1605]],[[64621,64621],\"mapped\",[1576,1606]],[[64622,64622],\"mapped\",[1576,1609]],[[64623,64623],\"mapped\",[1576,1610]],[[64624,64624],\"mapped\",[1578,1585]],[[64625,64625],\"mapped\",[1578,1586]],[[64626,64626],\"mapped\",[1578,1605]],[[64627,64627],\"mapped\",[1578,1606]],[[64628,64628],\"mapped\",[1578,1609]],[[64629,64629],\"mapped\",[1578,1610]],[[64630,64630],\"mapped\",[1579,1585]],[[64631,64631],\"mapped\",[1579,1586]],[[64632,64632],\"mapped\",[1579,1605]],[[64633,64633],\"mapped\",[1579,1606]],[[64634,64634],\"mapped\",[1579,1609]],[[64635,64635],\"mapped\",[1579,1610]],[[64636,64636],\"mapped\",[1601,1609]],[[64637,64637],\"mapped\",[1601,1610]],[[64638,64638],\"mapped\",[1602,1609]],[[64639,64639],\"mapped\",[1602,1610]],[[64640,64640],\"mapped\",[1603,1575]],[[64641,64641],\"mapped\",[1603,1604]],[[64642,64642],\"mapped\",[1603,1605]],[[64643,64643],\"mapped\",[1603,1609]],[[64644,64644],\"mapped\",[1603,1610]],[[64645,64645],\"mapped\",[1604,1605]],[[64646,64646],\"mapped\",[1604,1609]],[[64647,64647],\"mapped\",[1604,1610]],[[64648,64648],\"mapped\",[1605,1575]],[[64649,64649],\"mapped\",[1605,1605]],[[64650,64650],\"mapped\",[1606,1585]],[[64651,64651],\"mapped\",[1606,1586]],[[64652,64652],\"mapped\",[1606,1605]],[[64653,64653],\"mapped\",[1606,1606]],[[64654,64654],\"mapped\",[1606,1609]],[[64655,64655],\"mapped\",[1606,1610]],[[64656,64656],\"mapped\",[1609,1648]],[[64657,64657],\"mapped\",[1610,1585]],[[64658,64658],\"mapped\",[1610,1586]],[[64659,64659],\"mapped\",[1610,1605]],[[64660,64660],\"mapped\",[1610,1606]],[[64661,64661],\"mapped\",[1610,1609]],[[64662,64662],\"mapped\",[1610,1610]],[[64663,64663],\"mapped\",[1574,1580]],[[64664,64664],\"mapped\",[1574,1581]],[[64665,64665],\"mapped\",[1574,1582]],[[64666,64666],\"mapped\",[1574,1605]],[[64667,64667],\"mapped\",[1574,1607]],[[64668,64668],\"mapped\",[1576,1580]],[[64669,64669],\"mapped\",[1576,1581]],[[64670,64670],\"mapped\",[1576,1582]],[[64671,64671],\"mapped\",[1576,1605]],[[64672,64672],\"mapped\",[1576,1607]],[[64673,64673],\"mapped\",[1578,1580]],[[64674,64674],\"mapped\",[1578,1581]],[[64675,64675],\"mapped\",[1578,1582]],[[64676,64676],\"mapped\",[1578,1605]],[[64677,64677],\"mapped\",[1578,1607]],[[64678,64678],\"mapped\",[1579,1605]],[[64679,64679],\"mapped\",[1580,1581]],[[64680,64680],\"mapped\",[1580,1605]],[[64681,64681],\"mapped\",[1581,1580]],[[64682,64682],\"mapped\",[1581,1605]],[[64683,64683],\"mapped\",[1582,1580]],[[64684,64684],\"mapped\",[1582,1605]],[[64685,64685],\"mapped\",[1587,1580]],[[64686,64686],\"mapped\",[1587,1581]],[[64687,64687],\"mapped\",[1587,1582]],[[64688,64688],\"mapped\",[1587,1605]],[[64689,64689],\"mapped\",[1589,1581]],[[64690,64690],\"mapped\",[1589,1582]],[[64691,64691],\"mapped\",[1589,1605]],[[64692,64692],\"mapped\",[1590,1580]],[[64693,64693],\"mapped\",[1590,1581]],[[64694,64694],\"mapped\",[1590,1582]],[[64695,64695],\"mapped\",[1590,1605]],[[64696,64696],\"mapped\",[1591,1581]],[[64697,64697],\"mapped\",[1592,1605]],[[64698,64698],\"mapped\",[1593,1580]],[[64699,64699],\"mapped\",[1593,1605]],[[64700,64700],\"mapped\",[1594,1580]],[[64701,64701],\"mapped\",[1594,1605]],[[64702,64702],\"mapped\",[1601,1580]],[[64703,64703],\"mapped\",[1601,1581]],[[64704,64704],\"mapped\",[1601,1582]],[[64705,64705],\"mapped\",[1601,1605]],[[64706,64706],\"mapped\",[1602,1581]],[[64707,64707],\"mapped\",[1602,1605]],[[64708,64708],\"mapped\",[1603,1580]],[[64709,64709],\"mapped\",[1603,1581]],[[64710,64710],\"mapped\",[1603,1582]],[[64711,64711],\"mapped\",[1603,1604]],[[64712,64712],\"mapped\",[1603,1605]],[[64713,64713],\"mapped\",[1604,1580]],[[64714,64714],\"mapped\",[1604,1581]],[[64715,64715],\"mapped\",[1604,1582]],[[64716,64716],\"mapped\",[1604,1605]],[[64717,64717],\"mapped\",[1604,1607]],[[64718,64718],\"mapped\",[1605,1580]],[[64719,64719],\"mapped\",[1605,1581]],[[64720,64720],\"mapped\",[1605,1582]],[[64721,64721],\"mapped\",[1605,1605]],[[64722,64722],\"mapped\",[1606,1580]],[[64723,64723],\"mapped\",[1606,1581]],[[64724,64724],\"mapped\",[1606,1582]],[[64725,64725],\"mapped\",[1606,1605]],[[64726,64726],\"mapped\",[1606,1607]],[[64727,64727],\"mapped\",[1607,1580]],[[64728,64728],\"mapped\",[1607,1605]],[[64729,64729],\"mapped\",[1607,1648]],[[64730,64730],\"mapped\",[1610,1580]],[[64731,64731],\"mapped\",[1610,1581]],[[64732,64732],\"mapped\",[1610,1582]],[[64733,64733],\"mapped\",[1610,1605]],[[64734,64734],\"mapped\",[1610,1607]],[[64735,64735],\"mapped\",[1574,1605]],[[64736,64736],\"mapped\",[1574,1607]],[[64737,64737],\"mapped\",[1576,1605]],[[64738,64738],\"mapped\",[1576,1607]],[[64739,64739],\"mapped\",[1578,1605]],[[64740,64740],\"mapped\",[1578,1607]],[[64741,64741],\"mapped\",[1579,1605]],[[64742,64742],\"mapped\",[1579,1607]],[[64743,64743],\"mapped\",[1587,1605]],[[64744,64744],\"mapped\",[1587,1607]],[[64745,64745],\"mapped\",[1588,1605]],[[64746,64746],\"mapped\",[1588,1607]],[[64747,64747],\"mapped\",[1603,1604]],[[64748,64748],\"mapped\",[1603,1605]],[[64749,64749],\"mapped\",[1604,1605]],[[64750,64750],\"mapped\",[1606,1605]],[[64751,64751],\"mapped\",[1606,1607]],[[64752,64752],\"mapped\",[1610,1605]],[[64753,64753],\"mapped\",[1610,1607]],[[64754,64754],\"mapped\",[1600,1614,1617]],[[64755,64755],\"mapped\",[1600,1615,1617]],[[64756,64756],\"mapped\",[1600,1616,1617]],[[64757,64757],\"mapped\",[1591,1609]],[[64758,64758],\"mapped\",[1591,1610]],[[64759,64759],\"mapped\",[1593,1609]],[[64760,64760],\"mapped\",[1593,1610]],[[64761,64761],\"mapped\",[1594,1609]],[[64762,64762],\"mapped\",[1594,1610]],[[64763,64763],\"mapped\",[1587,1609]],[[64764,64764],\"mapped\",[1587,1610]],[[64765,64765],\"mapped\",[1588,1609]],[[64766,64766],\"mapped\",[1588,1610]],[[64767,64767],\"mapped\",[1581,1609]],[[64768,64768],\"mapped\",[1581,1610]],[[64769,64769],\"mapped\",[1580,1609]],[[64770,64770],\"mapped\",[1580,1610]],[[64771,64771],\"mapped\",[1582,1609]],[[64772,64772],\"mapped\",[1582,1610]],[[64773,64773],\"mapped\",[1589,1609]],[[64774,64774],\"mapped\",[1589,1610]],[[64775,64775],\"mapped\",[1590,1609]],[[64776,64776],\"mapped\",[1590,1610]],[[64777,64777],\"mapped\",[1588,1580]],[[64778,64778],\"mapped\",[1588,1581]],[[64779,64779],\"mapped\",[1588,1582]],[[64780,64780],\"mapped\",[1588,1605]],[[64781,64781],\"mapped\",[1588,1585]],[[64782,64782],\"mapped\",[1587,1585]],[[64783,64783],\"mapped\",[1589,1585]],[[64784,64784],\"mapped\",[1590,1585]],[[64785,64785],\"mapped\",[1591,1609]],[[64786,64786],\"mapped\",[1591,1610]],[[64787,64787],\"mapped\",[1593,1609]],[[64788,64788],\"mapped\",[1593,1610]],[[64789,64789],\"mapped\",[1594,1609]],[[64790,64790],\"mapped\",[1594,1610]],[[64791,64791],\"mapped\",[1587,1609]],[[64792,64792],\"mapped\",[1587,1610]],[[64793,64793],\"mapped\",[1588,1609]],[[64794,64794],\"mapped\",[1588,1610]],[[64795,64795],\"mapped\",[1581,1609]],[[64796,64796],\"mapped\",[1581,1610]],[[64797,64797],\"mapped\",[1580,1609]],[[64798,64798],\"mapped\",[1580,1610]],[[64799,64799],\"mapped\",[1582,1609]],[[64800,64800],\"mapped\",[1582,1610]],[[64801,64801],\"mapped\",[1589,1609]],[[64802,64802],\"mapped\",[1589,1610]],[[64803,64803],\"mapped\",[1590,1609]],[[64804,64804],\"mapped\",[1590,1610]],[[64805,64805],\"mapped\",[1588,1580]],[[64806,64806],\"mapped\",[1588,1581]],[[64807,64807],\"mapped\",[1588,1582]],[[64808,64808],\"mapped\",[1588,1605]],[[64809,64809],\"mapped\",[1588,1585]],[[64810,64810],\"mapped\",[1587,1585]],[[64811,64811],\"mapped\",[1589,1585]],[[64812,64812],\"mapped\",[1590,1585]],[[64813,64813],\"mapped\",[1588,1580]],[[64814,64814],\"mapped\",[1588,1581]],[[64815,64815],\"mapped\",[1588,1582]],[[64816,64816],\"mapped\",[1588,1605]],[[64817,64817],\"mapped\",[1587,1607]],[[64818,64818],\"mapped\",[1588,1607]],[[64819,64819],\"mapped\",[1591,1605]],[[64820,64820],\"mapped\",[1587,1580]],[[64821,64821],\"mapped\",[1587,1581]],[[64822,64822],\"mapped\",[1587,1582]],[[64823,64823],\"mapped\",[1588,1580]],[[64824,64824],\"mapped\",[1588,1581]],[[64825,64825],\"mapped\",[1588,1582]],[[64826,64826],\"mapped\",[1591,1605]],[[64827,64827],\"mapped\",[1592,1605]],[[64828,64829],\"mapped\",[1575,1611]],[[64830,64831],\"valid\",[],\"NV8\"],[[64832,64847],\"disallowed\"],[[64848,64848],\"mapped\",[1578,1580,1605]],[[64849,64850],\"mapped\",[1578,1581,1580]],[[64851,64851],\"mapped\",[1578,1581,1605]],[[64852,64852],\"mapped\",[1578,1582,1605]],[[64853,64853],\"mapped\",[1578,1605,1580]],[[64854,64854],\"mapped\",[1578,1605,1581]],[[64855,64855],\"mapped\",[1578,1605,1582]],[[64856,64857],\"mapped\",[1580,1605,1581]],[[64858,64858],\"mapped\",[1581,1605,1610]],[[64859,64859],\"mapped\",[1581,1605,1609]],[[64860,64860],\"mapped\",[1587,1581,1580]],[[64861,64861],\"mapped\",[1587,1580,1581]],[[64862,64862],\"mapped\",[1587,1580,1609]],[[64863,64864],\"mapped\",[1587,1605,1581]],[[64865,64865],\"mapped\",[1587,1605,1580]],[[64866,64867],\"mapped\",[1587,1605,1605]],[[64868,64869],\"mapped\",[1589,1581,1581]],[[64870,64870],\"mapped\",[1589,1605,1605]],[[64871,64872],\"mapped\",[1588,1581,1605]],[[64873,64873],\"mapped\",[1588,1580,1610]],[[64874,64875],\"mapped\",[1588,1605,1582]],[[64876,64877],\"mapped\",[1588,1605,1605]],[[64878,64878],\"mapped\",[1590,1581,1609]],[[64879,64880],\"mapped\",[1590,1582,1605]],[[64881,64882],\"mapped\",[1591,1605,1581]],[[64883,64883],\"mapped\",[1591,1605,1605]],[[64884,64884],\"mapped\",[1591,1605,1610]],[[64885,64885],\"mapped\",[1593,1580,1605]],[[64886,64887],\"mapped\",[1593,1605,1605]],[[64888,64888],\"mapped\",[1593,1605,1609]],[[64889,64889],\"mapped\",[1594,1605,1605]],[[64890,64890],\"mapped\",[1594,1605,1610]],[[64891,64891],\"mapped\",[1594,1605,1609]],[[64892,64893],\"mapped\",[1601,1582,1605]],[[64894,64894],\"mapped\",[1602,1605,1581]],[[64895,64895],\"mapped\",[1602,1605,1605]],[[64896,64896],\"mapped\",[1604,1581,1605]],[[64897,64897],\"mapped\",[1604,1581,1610]],[[64898,64898],\"mapped\",[1604,1581,1609]],[[64899,64900],\"mapped\",[1604,1580,1580]],[[64901,64902],\"mapped\",[1604,1582,1605]],[[64903,64904],\"mapped\",[1604,1605,1581]],[[64905,64905],\"mapped\",[1605,1581,1580]],[[64906,64906],\"mapped\",[1605,1581,1605]],[[64907,64907],\"mapped\",[1605,1581,1610]],[[64908,64908],\"mapped\",[1605,1580,1581]],[[64909,64909],\"mapped\",[1605,1580,1605]],[[64910,64910],\"mapped\",[1605,1582,1580]],[[64911,64911],\"mapped\",[1605,1582,1605]],[[64912,64913],\"disallowed\"],[[64914,64914],\"mapped\",[1605,1580,1582]],[[64915,64915],\"mapped\",[1607,1605,1580]],[[64916,64916],\"mapped\",[1607,1605,1605]],[[64917,64917],\"mapped\",[1606,1581,1605]],[[64918,64918],\"mapped\",[1606,1581,1609]],[[64919,64920],\"mapped\",[1606,1580,1605]],[[64921,64921],\"mapped\",[1606,1580,1609]],[[64922,64922],\"mapped\",[1606,1605,1610]],[[64923,64923],\"mapped\",[1606,1605,1609]],[[64924,64925],\"mapped\",[1610,1605,1605]],[[64926,64926],\"mapped\",[1576,1582,1610]],[[64927,64927],\"mapped\",[1578,1580,1610]],[[64928,64928],\"mapped\",[1578,1580,1609]],[[64929,64929],\"mapped\",[1578,1582,1610]],[[64930,64930],\"mapped\",[1578,1582,1609]],[[64931,64931],\"mapped\",[1578,1605,1610]],[[64932,64932],\"mapped\",[1578,1605,1609]],[[64933,64933],\"mapped\",[1580,1605,1610]],[[64934,64934],\"mapped\",[1580,1581,1609]],[[64935,64935],\"mapped\",[1580,1605,1609]],[[64936,64936],\"mapped\",[1587,1582,1609]],[[64937,64937],\"mapped\",[1589,1581,1610]],[[64938,64938],\"mapped\",[1588,1581,1610]],[[64939,64939],\"mapped\",[1590,1581,1610]],[[64940,64940],\"mapped\",[1604,1580,1610]],[[64941,64941],\"mapped\",[1604,1605,1610]],[[64942,64942],\"mapped\",[1610,1581,1610]],[[64943,64943],\"mapped\",[1610,1580,1610]],[[64944,64944],\"mapped\",[1610,1605,1610]],[[64945,64945],\"mapped\",[1605,1605,1610]],[[64946,64946],\"mapped\",[1602,1605,1610]],[[64947,64947],\"mapped\",[1606,1581,1610]],[[64948,64948],\"mapped\",[1602,1605,1581]],[[64949,64949],\"mapped\",[1604,1581,1605]],[[64950,64950],\"mapped\",[1593,1605,1610]],[[64951,64951],\"mapped\",[1603,1605,1610]],[[64952,64952],\"mapped\",[1606,1580,1581]],[[64953,64953],\"mapped\",[1605,1582,1610]],[[64954,64954],\"mapped\",[1604,1580,1605]],[[64955,64955],\"mapped\",[1603,1605,1605]],[[64956,64956],\"mapped\",[1604,1580,1605]],[[64957,64957],\"mapped\",[1606,1580,1581]],[[64958,64958],\"mapped\",[1580,1581,1610]],[[64959,64959],\"mapped\",[1581,1580,1610]],[[64960,64960],\"mapped\",[1605,1580,1610]],[[64961,64961],\"mapped\",[1601,1605,1610]],[[64962,64962],\"mapped\",[1576,1581,1610]],[[64963,64963],\"mapped\",[1603,1605,1605]],[[64964,64964],\"mapped\",[1593,1580,1605]],[[64965,64965],\"mapped\",[1589,1605,1605]],[[64966,64966],\"mapped\",[1587,1582,1610]],[[64967,64967],\"mapped\",[1606,1580,1610]],[[64968,64975],\"disallowed\"],[[64976,65007],\"disallowed\"],[[65008,65008],\"mapped\",[1589,1604,1746]],[[65009,65009],\"mapped\",[1602,1604,1746]],[[65010,65010],\"mapped\",[1575,1604,1604,1607]],[[65011,65011],\"mapped\",[1575,1603,1576,1585]],[[65012,65012],\"mapped\",[1605,1581,1605,1583]],[[65013,65013],\"mapped\",[1589,1604,1593,1605]],[[65014,65014],\"mapped\",[1585,1587,1608,1604]],[[65015,65015],\"mapped\",[1593,1604,1610,1607]],[[65016,65016],\"mapped\",[1608,1587,1604,1605]],[[65017,65017],\"mapped\",[1589,1604,1609]],[[65018,65018],\"disallowed_STD3_mapped\",[1589,1604,1609,32,1575,1604,1604,1607,32,1593,1604,1610,1607,32,1608,1587,1604,1605]],[[65019,65019],\"disallowed_STD3_mapped\",[1580,1604,32,1580,1604,1575,1604,1607]],[[65020,65020],\"mapped\",[1585,1740,1575,1604]],[[65021,65021],\"valid\",[],\"NV8\"],[[65022,65023],\"disallowed\"],[[65024,65039],\"ignored\"],[[65040,65040],\"disallowed_STD3_mapped\",[44]],[[65041,65041],\"mapped\",[12289]],[[65042,65042],\"disallowed\"],[[65043,65043],\"disallowed_STD3_mapped\",[58]],[[65044,65044],\"disallowed_STD3_mapped\",[59]],[[65045,65045],\"disallowed_STD3_mapped\",[33]],[[65046,65046],\"disallowed_STD3_mapped\",[63]],[[65047,65047],\"mapped\",[12310]],[[65048,65048],\"mapped\",[12311]],[[65049,65049],\"disallowed\"],[[65050,65055],\"disallowed\"],[[65056,65059],\"valid\"],[[65060,65062],\"valid\"],[[65063,65069],\"valid\"],[[65070,65071],\"valid\"],[[65072,65072],\"disallowed\"],[[65073,65073],\"mapped\",[8212]],[[65074,65074],\"mapped\",[8211]],[[65075,65076],\"disallowed_STD3_mapped\",[95]],[[65077,65077],\"disallowed_STD3_mapped\",[40]],[[65078,65078],\"disallowed_STD3_mapped\",[41]],[[65079,65079],\"disallowed_STD3_mapped\",[123]],[[65080,65080],\"disallowed_STD3_mapped\",[125]],[[65081,65081],\"mapped\",[12308]],[[65082,65082],\"mapped\",[12309]],[[65083,65083],\"mapped\",[12304]],[[65084,65084],\"mapped\",[12305]],[[65085,65085],\"mapped\",[12298]],[[65086,65086],\"mapped\",[12299]],[[65087,65087],\"mapped\",[12296]],[[65088,65088],\"mapped\",[12297]],[[65089,65089],\"mapped\",[12300]],[[65090,65090],\"mapped\",[12301]],[[65091,65091],\"mapped\",[12302]],[[65092,65092],\"mapped\",[12303]],[[65093,65094],\"valid\",[],\"NV8\"],[[65095,65095],\"disallowed_STD3_mapped\",[91]],[[65096,65096],\"disallowed_STD3_mapped\",[93]],[[65097,65100],\"disallowed_STD3_mapped\",[32,773]],[[65101,65103],\"disallowed_STD3_mapped\",[95]],[[65104,65104],\"disallowed_STD3_mapped\",[44]],[[65105,65105],\"mapped\",[12289]],[[65106,65106],\"disallowed\"],[[65107,65107],\"disallowed\"],[[65108,65108],\"disallowed_STD3_mapped\",[59]],[[65109,65109],\"disallowed_STD3_mapped\",[58]],[[65110,65110],\"disallowed_STD3_mapped\",[63]],[[65111,65111],\"disallowed_STD3_mapped\",[33]],[[65112,65112],\"mapped\",[8212]],[[65113,65113],\"disallowed_STD3_mapped\",[40]],[[65114,65114],\"disallowed_STD3_mapped\",[41]],[[65115,65115],\"disallowed_STD3_mapped\",[123]],[[65116,65116],\"disallowed_STD3_mapped\",[125]],[[65117,65117],\"mapped\",[12308]],[[65118,65118],\"mapped\",[12309]],[[65119,65119],\"disallowed_STD3_mapped\",[35]],[[65120,65120],\"disallowed_STD3_mapped\",[38]],[[65121,65121],\"disallowed_STD3_mapped\",[42]],[[65122,65122],\"disallowed_STD3_mapped\",[43]],[[65123,65123],\"mapped\",[45]],[[65124,65124],\"disallowed_STD3_mapped\",[60]],[[65125,65125],\"disallowed_STD3_mapped\",[62]],[[65126,65126],\"disallowed_STD3_mapped\",[61]],[[65127,65127],\"disallowed\"],[[65128,65128],\"disallowed_STD3_mapped\",[92]],[[65129,65129],\"disallowed_STD3_mapped\",[36]],[[65130,65130],\"disallowed_STD3_mapped\",[37]],[[65131,65131],\"disallowed_STD3_mapped\",[64]],[[65132,65135],\"disallowed\"],[[65136,65136],\"disallowed_STD3_mapped\",[32,1611]],[[65137,65137],\"mapped\",[1600,1611]],[[65138,65138],\"disallowed_STD3_mapped\",[32,1612]],[[65139,65139],\"valid\"],[[65140,65140],\"disallowed_STD3_mapped\",[32,1613]],[[65141,65141],\"disallowed\"],[[65142,65142],\"disallowed_STD3_mapped\",[32,1614]],[[65143,65143],\"mapped\",[1600,1614]],[[65144,65144],\"disallowed_STD3_mapped\",[32,1615]],[[65145,65145],\"mapped\",[1600,1615]],[[65146,65146],\"disallowed_STD3_mapped\",[32,1616]],[[65147,65147],\"mapped\",[1600,1616]],[[65148,65148],\"disallowed_STD3_mapped\",[32,1617]],[[65149,65149],\"mapped\",[1600,1617]],[[65150,65150],\"disallowed_STD3_mapped\",[32,1618]],[[65151,65151],\"mapped\",[1600,1618]],[[65152,65152],\"mapped\",[1569]],[[65153,65154],\"mapped\",[1570]],[[65155,65156],\"mapped\",[1571]],[[65157,65158],\"mapped\",[1572]],[[65159,65160],\"mapped\",[1573]],[[65161,65164],\"mapped\",[1574]],[[65165,65166],\"mapped\",[1575]],[[65167,65170],\"mapped\",[1576]],[[65171,65172],\"mapped\",[1577]],[[65173,65176],\"mapped\",[1578]],[[65177,65180],\"mapped\",[1579]],[[65181,65184],\"mapped\",[1580]],[[65185,65188],\"mapped\",[1581]],[[65189,65192],\"mapped\",[1582]],[[65193,65194],\"mapped\",[1583]],[[65195,65196],\"mapped\",[1584]],[[65197,65198],\"mapped\",[1585]],[[65199,65200],\"mapped\",[1586]],[[65201,65204],\"mapped\",[1587]],[[65205,65208],\"mapped\",[1588]],[[65209,65212],\"mapped\",[1589]],[[65213,65216],\"mapped\",[1590]],[[65217,65220],\"mapped\",[1591]],[[65221,65224],\"mapped\",[1592]],[[65225,65228],\"mapped\",[1593]],[[65229,65232],\"mapped\",[1594]],[[65233,65236],\"mapped\",[1601]],[[65237,65240],\"mapped\",[1602]],[[65241,65244],\"mapped\",[1603]],[[65245,65248],\"mapped\",[1604]],[[65249,65252],\"mapped\",[1605]],[[65253,65256],\"mapped\",[1606]],[[65257,65260],\"mapped\",[1607]],[[65261,65262],\"mapped\",[1608]],[[65263,65264],\"mapped\",[1609]],[[65265,65268],\"mapped\",[1610]],[[65269,65270],\"mapped\",[1604,1570]],[[65271,65272],\"mapped\",[1604,1571]],[[65273,65274],\"mapped\",[1604,1573]],[[65275,65276],\"mapped\",[1604,1575]],[[65277,65278],\"disallowed\"],[[65279,65279],\"ignored\"],[[65280,65280],\"disallowed\"],[[65281,65281],\"disallowed_STD3_mapped\",[33]],[[65282,65282],\"disallowed_STD3_mapped\",[34]],[[65283,65283],\"disallowed_STD3_mapped\",[35]],[[65284,65284],\"disallowed_STD3_mapped\",[36]],[[65285,65285],\"disallowed_STD3_mapped\",[37]],[[65286,65286],\"disallowed_STD3_mapped\",[38]],[[65287,65287],\"disallowed_STD3_mapped\",[39]],[[65288,65288],\"disallowed_STD3_mapped\",[40]],[[65289,65289],\"disallowed_STD3_mapped\",[41]],[[65290,65290],\"disallowed_STD3_mapped\",[42]],[[65291,65291],\"disallowed_STD3_mapped\",[43]],[[65292,65292],\"disallowed_STD3_mapped\",[44]],[[65293,65293],\"mapped\",[45]],[[65294,65294],\"mapped\",[46]],[[65295,65295],\"disallowed_STD3_mapped\",[47]],[[65296,65296],\"mapped\",[48]],[[65297,65297],\"mapped\",[49]],[[65298,65298],\"mapped\",[50]],[[65299,65299],\"mapped\",[51]],[[65300,65300],\"mapped\",[52]],[[65301,65301],\"mapped\",[53]],[[65302,65302],\"mapped\",[54]],[[65303,65303],\"mapped\",[55]],[[65304,65304],\"mapped\",[56]],[[65305,65305],\"mapped\",[57]],[[65306,65306],\"disallowed_STD3_mapped\",[58]],[[65307,65307],\"disallowed_STD3_mapped\",[59]],[[65308,65308],\"disallowed_STD3_mapped\",[60]],[[65309,65309],\"disallowed_STD3_mapped\",[61]],[[65310,65310],\"disallowed_STD3_mapped\",[62]],[[65311,65311],\"disallowed_STD3_mapped\",[63]],[[65312,65312],\"disallowed_STD3_mapped\",[64]],[[65313,65313],\"mapped\",[97]],[[65314,65314],\"mapped\",[98]],[[65315,65315],\"mapped\",[99]],[[65316,65316],\"mapped\",[100]],[[65317,65317],\"mapped\",[101]],[[65318,65318],\"mapped\",[102]],[[65319,65319],\"mapped\",[103]],[[65320,65320],\"mapped\",[104]],[[65321,65321],\"mapped\",[105]],[[65322,65322],\"mapped\",[106]],[[65323,65323],\"mapped\",[107]],[[65324,65324],\"mapped\",[108]],[[65325,65325],\"mapped\",[109]],[[65326,65326],\"mapped\",[110]],[[65327,65327],\"mapped\",[111]],[[65328,65328],\"mapped\",[112]],[[65329,65329],\"mapped\",[113]],[[65330,65330],\"mapped\",[114]],[[65331,65331],\"mapped\",[115]],[[65332,65332],\"mapped\",[116]],[[65333,65333],\"mapped\",[117]],[[65334,65334],\"mapped\",[118]],[[65335,65335],\"mapped\",[119]],[[65336,65336],\"mapped\",[120]],[[65337,65337],\"mapped\",[121]],[[65338,65338],\"mapped\",[122]],[[65339,65339],\"disallowed_STD3_mapped\",[91]],[[65340,65340],\"disallowed_STD3_mapped\",[92]],[[65341,65341],\"disallowed_STD3_mapped\",[93]],[[65342,65342],\"disallowed_STD3_mapped\",[94]],[[65343,65343],\"disallowed_STD3_mapped\",[95]],[[65344,65344],\"disallowed_STD3_mapped\",[96]],[[65345,65345],\"mapped\",[97]],[[65346,65346],\"mapped\",[98]],[[65347,65347],\"mapped\",[99]],[[65348,65348],\"mapped\",[100]],[[65349,65349],\"mapped\",[101]],[[65350,65350],\"mapped\",[102]],[[65351,65351],\"mapped\",[103]],[[65352,65352],\"mapped\",[104]],[[65353,65353],\"mapped\",[105]],[[65354,65354],\"mapped\",[106]],[[65355,65355],\"mapped\",[107]],[[65356,65356],\"mapped\",[108]],[[65357,65357],\"mapped\",[109]],[[65358,65358],\"mapped\",[110]],[[65359,65359],\"mapped\",[111]],[[65360,65360],\"mapped\",[112]],[[65361,65361],\"mapped\",[113]],[[65362,65362],\"mapped\",[114]],[[65363,65363],\"mapped\",[115]],[[65364,65364],\"mapped\",[116]],[[65365,65365],\"mapped\",[117]],[[65366,65366],\"mapped\",[118]],[[65367,65367],\"mapped\",[119]],[[65368,65368],\"mapped\",[120]],[[65369,65369],\"mapped\",[121]],[[65370,65370],\"mapped\",[122]],[[65371,65371],\"disallowed_STD3_mapped\",[123]],[[65372,65372],\"disallowed_STD3_mapped\",[124]],[[65373,65373],\"disallowed_STD3_mapped\",[125]],[[65374,65374],\"disallowed_STD3_mapped\",[126]],[[65375,65375],\"mapped\",[10629]],[[65376,65376],\"mapped\",[10630]],[[65377,65377],\"mapped\",[46]],[[65378,65378],\"mapped\",[12300]],[[65379,65379],\"mapped\",[12301]],[[65380,65380],\"mapped\",[12289]],[[65381,65381],\"mapped\",[12539]],[[65382,65382],\"mapped\",[12530]],[[65383,65383],\"mapped\",[12449]],[[65384,65384],\"mapped\",[12451]],[[65385,65385],\"mapped\",[12453]],[[65386,65386],\"mapped\",[12455]],[[65387,65387],\"mapped\",[12457]],[[65388,65388],\"mapped\",[12515]],[[65389,65389],\"mapped\",[12517]],[[65390,65390],\"mapped\",[12519]],[[65391,65391],\"mapped\",[12483]],[[65392,65392],\"mapped\",[12540]],[[65393,65393],\"mapped\",[12450]],[[65394,65394],\"mapped\",[12452]],[[65395,65395],\"mapped\",[12454]],[[65396,65396],\"mapped\",[12456]],[[65397,65397],\"mapped\",[12458]],[[65398,65398],\"mapped\",[12459]],[[65399,65399],\"mapped\",[12461]],[[65400,65400],\"mapped\",[12463]],[[65401,65401],\"mapped\",[12465]],[[65402,65402],\"mapped\",[12467]],[[65403,65403],\"mapped\",[12469]],[[65404,65404],\"mapped\",[12471]],[[65405,65405],\"mapped\",[12473]],[[65406,65406],\"mapped\",[12475]],[[65407,65407],\"mapped\",[12477]],[[65408,65408],\"mapped\",[12479]],[[65409,65409],\"mapped\",[12481]],[[65410,65410],\"mapped\",[12484]],[[65411,65411],\"mapped\",[12486]],[[65412,65412],\"mapped\",[12488]],[[65413,65413],\"mapped\",[12490]],[[65414,65414],\"mapped\",[12491]],[[65415,65415],\"mapped\",[12492]],[[65416,65416],\"mapped\",[12493]],[[65417,65417],\"mapped\",[12494]],[[65418,65418],\"mapped\",[12495]],[[65419,65419],\"mapped\",[12498]],[[65420,65420],\"mapped\",[12501]],[[65421,65421],\"mapped\",[12504]],[[65422,65422],\"mapped\",[12507]],[[65423,65423],\"mapped\",[12510]],[[65424,65424],\"mapped\",[12511]],[[65425,65425],\"mapped\",[12512]],[[65426,65426],\"mapped\",[12513]],[[65427,65427],\"mapped\",[12514]],[[65428,65428],\"mapped\",[12516]],[[65429,65429],\"mapped\",[12518]],[[65430,65430],\"mapped\",[12520]],[[65431,65431],\"mapped\",[12521]],[[65432,65432],\"mapped\",[12522]],[[65433,65433],\"mapped\",[12523]],[[65434,65434],\"mapped\",[12524]],[[65435,65435],\"mapped\",[12525]],[[65436,65436],\"mapped\",[12527]],[[65437,65437],\"mapped\",[12531]],[[65438,65438],\"mapped\",[12441]],[[65439,65439],\"mapped\",[12442]],[[65440,65440],\"disallowed\"],[[65441,65441],\"mapped\",[4352]],[[65442,65442],\"mapped\",[4353]],[[65443,65443],\"mapped\",[4522]],[[65444,65444],\"mapped\",[4354]],[[65445,65445],\"mapped\",[4524]],[[65446,65446],\"mapped\",[4525]],[[65447,65447],\"mapped\",[4355]],[[65448,65448],\"mapped\",[4356]],[[65449,65449],\"mapped\",[4357]],[[65450,65450],\"mapped\",[4528]],[[65451,65451],\"mapped\",[4529]],[[65452,65452],\"mapped\",[4530]],[[65453,65453],\"mapped\",[4531]],[[65454,65454],\"mapped\",[4532]],[[65455,65455],\"mapped\",[4533]],[[65456,65456],\"mapped\",[4378]],[[65457,65457],\"mapped\",[4358]],[[65458,65458],\"mapped\",[4359]],[[65459,65459],\"mapped\",[4360]],[[65460,65460],\"mapped\",[4385]],[[65461,65461],\"mapped\",[4361]],[[65462,65462],\"mapped\",[4362]],[[65463,65463],\"mapped\",[4363]],[[65464,65464],\"mapped\",[4364]],[[65465,65465],\"mapped\",[4365]],[[65466,65466],\"mapped\",[4366]],[[65467,65467],\"mapped\",[4367]],[[65468,65468],\"mapped\",[4368]],[[65469,65469],\"mapped\",[4369]],[[65470,65470],\"mapped\",[4370]],[[65471,65473],\"disallowed\"],[[65474,65474],\"mapped\",[4449]],[[65475,65475],\"mapped\",[4450]],[[65476,65476],\"mapped\",[4451]],[[65477,65477],\"mapped\",[4452]],[[65478,65478],\"mapped\",[4453]],[[65479,65479],\"mapped\",[4454]],[[65480,65481],\"disallowed\"],[[65482,65482],\"mapped\",[4455]],[[65483,65483],\"mapped\",[4456]],[[65484,65484],\"mapped\",[4457]],[[65485,65485],\"mapped\",[4458]],[[65486,65486],\"mapped\",[4459]],[[65487,65487],\"mapped\",[4460]],[[65488,65489],\"disallowed\"],[[65490,65490],\"mapped\",[4461]],[[65491,65491],\"mapped\",[4462]],[[65492,65492],\"mapped\",[4463]],[[65493,65493],\"mapped\",[4464]],[[65494,65494],\"mapped\",[4465]],[[65495,65495],\"mapped\",[4466]],[[65496,65497],\"disallowed\"],[[65498,65498],\"mapped\",[4467]],[[65499,65499],\"mapped\",[4468]],[[65500,65500],\"mapped\",[4469]],[[65501,65503],\"disallowed\"],[[65504,65504],\"mapped\",[162]],[[65505,65505],\"mapped\",[163]],[[65506,65506],\"mapped\",[172]],[[65507,65507],\"disallowed_STD3_mapped\",[32,772]],[[65508,65508],\"mapped\",[166]],[[65509,65509],\"mapped\",[165]],[[65510,65510],\"mapped\",[8361]],[[65511,65511],\"disallowed\"],[[65512,65512],\"mapped\",[9474]],[[65513,65513],\"mapped\",[8592]],[[65514,65514],\"mapped\",[8593]],[[65515,65515],\"mapped\",[8594]],[[65516,65516],\"mapped\",[8595]],[[65517,65517],\"mapped\",[9632]],[[65518,65518],\"mapped\",[9675]],[[65519,65528],\"disallowed\"],[[65529,65531],\"disallowed\"],[[65532,65532],\"disallowed\"],[[65533,65533],\"disallowed\"],[[65534,65535],\"disallowed\"],[[65536,65547],\"valid\"],[[65548,65548],\"disallowed\"],[[65549,65574],\"valid\"],[[65575,65575],\"disallowed\"],[[65576,65594],\"valid\"],[[65595,65595],\"disallowed\"],[[65596,65597],\"valid\"],[[65598,65598],\"disallowed\"],[[65599,65613],\"valid\"],[[65614,65615],\"disallowed\"],[[65616,65629],\"valid\"],[[65630,65663],\"disallowed\"],[[65664,65786],\"valid\"],[[65787,65791],\"disallowed\"],[[65792,65794],\"valid\",[],\"NV8\"],[[65795,65798],\"disallowed\"],[[65799,65843],\"valid\",[],\"NV8\"],[[65844,65846],\"disallowed\"],[[65847,65855],\"valid\",[],\"NV8\"],[[65856,65930],\"valid\",[],\"NV8\"],[[65931,65932],\"valid\",[],\"NV8\"],[[65933,65935],\"disallowed\"],[[65936,65947],\"valid\",[],\"NV8\"],[[65948,65951],\"disallowed\"],[[65952,65952],\"valid\",[],\"NV8\"],[[65953,65999],\"disallowed\"],[[66000,66044],\"valid\",[],\"NV8\"],[[66045,66045],\"valid\"],[[66046,66175],\"disallowed\"],[[66176,66204],\"valid\"],[[66205,66207],\"disallowed\"],[[66208,66256],\"valid\"],[[66257,66271],\"disallowed\"],[[66272,66272],\"valid\"],[[66273,66299],\"valid\",[],\"NV8\"],[[66300,66303],\"disallowed\"],[[66304,66334],\"valid\"],[[66335,66335],\"valid\"],[[66336,66339],\"valid\",[],\"NV8\"],[[66340,66351],\"disallowed\"],[[66352,66368],\"valid\"],[[66369,66369],\"valid\",[],\"NV8\"],[[66370,66377],\"valid\"],[[66378,66378],\"valid\",[],\"NV8\"],[[66379,66383],\"disallowed\"],[[66384,66426],\"valid\"],[[66427,66431],\"disallowed\"],[[66432,66461],\"valid\"],[[66462,66462],\"disallowed\"],[[66463,66463],\"valid\",[],\"NV8\"],[[66464,66499],\"valid\"],[[66500,66503],\"disallowed\"],[[66504,66511],\"valid\"],[[66512,66517],\"valid\",[],\"NV8\"],[[66518,66559],\"disallowed\"],[[66560,66560],\"mapped\",[66600]],[[66561,66561],\"mapped\",[66601]],[[66562,66562],\"mapped\",[66602]],[[66563,66563],\"mapped\",[66603]],[[66564,66564],\"mapped\",[66604]],[[66565,66565],\"mapped\",[66605]],[[66566,66566],\"mapped\",[66606]],[[66567,66567],\"mapped\",[66607]],[[66568,66568],\"mapped\",[66608]],[[66569,66569],\"mapped\",[66609]],[[66570,66570],\"mapped\",[66610]],[[66571,66571],\"mapped\",[66611]],[[66572,66572],\"mapped\",[66612]],[[66573,66573],\"mapped\",[66613]],[[66574,66574],\"mapped\",[66614]],[[66575,66575],\"mapped\",[66615]],[[66576,66576],\"mapped\",[66616]],[[66577,66577],\"mapped\",[66617]],[[66578,66578],\"mapped\",[66618]],[[66579,66579],\"mapped\",[66619]],[[66580,66580],\"mapped\",[66620]],[[66581,66581],\"mapped\",[66621]],[[66582,66582],\"mapped\",[66622]],[[66583,66583],\"mapped\",[66623]],[[66584,66584],\"mapped\",[66624]],[[66585,66585],\"mapped\",[66625]],[[66586,66586],\"mapped\",[66626]],[[66587,66587],\"mapped\",[66627]],[[66588,66588],\"mapped\",[66628]],[[66589,66589],\"mapped\",[66629]],[[66590,66590],\"mapped\",[66630]],[[66591,66591],\"mapped\",[66631]],[[66592,66592],\"mapped\",[66632]],[[66593,66593],\"mapped\",[66633]],[[66594,66594],\"mapped\",[66634]],[[66595,66595],\"mapped\",[66635]],[[66596,66596],\"mapped\",[66636]],[[66597,66597],\"mapped\",[66637]],[[66598,66598],\"mapped\",[66638]],[[66599,66599],\"mapped\",[66639]],[[66600,66637],\"valid\"],[[66638,66717],\"valid\"],[[66718,66719],\"disallowed\"],[[66720,66729],\"valid\"],[[66730,66815],\"disallowed\"],[[66816,66855],\"valid\"],[[66856,66863],\"disallowed\"],[[66864,66915],\"valid\"],[[66916,66926],\"disallowed\"],[[66927,66927],\"valid\",[],\"NV8\"],[[66928,67071],\"disallowed\"],[[67072,67382],\"valid\"],[[67383,67391],\"disallowed\"],[[67392,67413],\"valid\"],[[67414,67423],\"disallowed\"],[[67424,67431],\"valid\"],[[67432,67583],\"disallowed\"],[[67584,67589],\"valid\"],[[67590,67591],\"disallowed\"],[[67592,67592],\"valid\"],[[67593,67593],\"disallowed\"],[[67594,67637],\"valid\"],[[67638,67638],\"disallowed\"],[[67639,67640],\"valid\"],[[67641,67643],\"disallowed\"],[[67644,67644],\"valid\"],[[67645,67646],\"disallowed\"],[[67647,67647],\"valid\"],[[67648,67669],\"valid\"],[[67670,67670],\"disallowed\"],[[67671,67679],\"valid\",[],\"NV8\"],[[67680,67702],\"valid\"],[[67703,67711],\"valid\",[],\"NV8\"],[[67712,67742],\"valid\"],[[67743,67750],\"disallowed\"],[[67751,67759],\"valid\",[],\"NV8\"],[[67760,67807],\"disallowed\"],[[67808,67826],\"valid\"],[[67827,67827],\"disallowed\"],[[67828,67829],\"valid\"],[[67830,67834],\"disallowed\"],[[67835,67839],\"valid\",[],\"NV8\"],[[67840,67861],\"valid\"],[[67862,67865],\"valid\",[],\"NV8\"],[[67866,67867],\"valid\",[],\"NV8\"],[[67868,67870],\"disallowed\"],[[67871,67871],\"valid\",[],\"NV8\"],[[67872,67897],\"valid\"],[[67898,67902],\"disallowed\"],[[67903,67903],\"valid\",[],\"NV8\"],[[67904,67967],\"disallowed\"],[[67968,68023],\"valid\"],[[68024,68027],\"disallowed\"],[[68028,68029],\"valid\",[],\"NV8\"],[[68030,68031],\"valid\"],[[68032,68047],\"valid\",[],\"NV8\"],[[68048,68049],\"disallowed\"],[[68050,68095],\"valid\",[],\"NV8\"],[[68096,68099],\"valid\"],[[68100,68100],\"disallowed\"],[[68101,68102],\"valid\"],[[68103,68107],\"disallowed\"],[[68108,68115],\"valid\"],[[68116,68116],\"disallowed\"],[[68117,68119],\"valid\"],[[68120,68120],\"disallowed\"],[[68121,68147],\"valid\"],[[68148,68151],\"disallowed\"],[[68152,68154],\"valid\"],[[68155,68158],\"disallowed\"],[[68159,68159],\"valid\"],[[68160,68167],\"valid\",[],\"NV8\"],[[68168,68175],\"disallowed\"],[[68176,68184],\"valid\",[],\"NV8\"],[[68185,68191],\"disallowed\"],[[68192,68220],\"valid\"],[[68221,68223],\"valid\",[],\"NV8\"],[[68224,68252],\"valid\"],[[68253,68255],\"valid\",[],\"NV8\"],[[68256,68287],\"disallowed\"],[[68288,68295],\"valid\"],[[68296,68296],\"valid\",[],\"NV8\"],[[68297,68326],\"valid\"],[[68327,68330],\"disallowed\"],[[68331,68342],\"valid\",[],\"NV8\"],[[68343,68351],\"disallowed\"],[[68352,68405],\"valid\"],[[68406,68408],\"disallowed\"],[[68409,68415],\"valid\",[],\"NV8\"],[[68416,68437],\"valid\"],[[68438,68439],\"disallowed\"],[[68440,68447],\"valid\",[],\"NV8\"],[[68448,68466],\"valid\"],[[68467,68471],\"disallowed\"],[[68472,68479],\"valid\",[],\"NV8\"],[[68480,68497],\"valid\"],[[68498,68504],\"disallowed\"],[[68505,68508],\"valid\",[],\"NV8\"],[[68509,68520],\"disallowed\"],[[68521,68527],\"valid\",[],\"NV8\"],[[68528,68607],\"disallowed\"],[[68608,68680],\"valid\"],[[68681,68735],\"disallowed\"],[[68736,68736],\"mapped\",[68800]],[[68737,68737],\"mapped\",[68801]],[[68738,68738],\"mapped\",[68802]],[[68739,68739],\"mapped\",[68803]],[[68740,68740],\"mapped\",[68804]],[[68741,68741],\"mapped\",[68805]],[[68742,68742],\"mapped\",[68806]],[[68743,68743],\"mapped\",[68807]],[[68744,68744],\"mapped\",[68808]],[[68745,68745],\"mapped\",[68809]],[[68746,68746],\"mapped\",[68810]],[[68747,68747],\"mapped\",[68811]],[[68748,68748],\"mapped\",[68812]],[[68749,68749],\"mapped\",[68813]],[[68750,68750],\"mapped\",[68814]],[[68751,68751],\"mapped\",[68815]],[[68752,68752],\"mapped\",[68816]],[[68753,68753],\"mapped\",[68817]],[[68754,68754],\"mapped\",[68818]],[[68755,68755],\"mapped\",[68819]],[[68756,68756],\"mapped\",[68820]],[[68757,68757],\"mapped\",[68821]],[[68758,68758],\"mapped\",[68822]],[[68759,68759],\"mapped\",[68823]],[[68760,68760],\"mapped\",[68824]],[[68761,68761],\"mapped\",[68825]],[[68762,68762],\"mapped\",[68826]],[[68763,68763],\"mapped\",[68827]],[[68764,68764],\"mapped\",[68828]],[[68765,68765],\"mapped\",[68829]],[[68766,68766],\"mapped\",[68830]],[[68767,68767],\"mapped\",[68831]],[[68768,68768],\"mapped\",[68832]],[[68769,68769],\"mapped\",[68833]],[[68770,68770],\"mapped\",[68834]],[[68771,68771],\"mapped\",[68835]],[[68772,68772],\"mapped\",[68836]],[[68773,68773],\"mapped\",[68837]],[[68774,68774],\"mapped\",[68838]],[[68775,68775],\"mapped\",[68839]],[[68776,68776],\"mapped\",[68840]],[[68777,68777],\"mapped\",[68841]],[[68778,68778],\"mapped\",[68842]],[[68779,68779],\"mapped\",[68843]],[[68780,68780],\"mapped\",[68844]],[[68781,68781],\"mapped\",[68845]],[[68782,68782],\"mapped\",[68846]],[[68783,68783],\"mapped\",[68847]],[[68784,68784],\"mapped\",[68848]],[[68785,68785],\"mapped\",[68849]],[[68786,68786],\"mapped\",[68850]],[[68787,68799],\"disallowed\"],[[68800,68850],\"valid\"],[[68851,68857],\"disallowed\"],[[68858,68863],\"valid\",[],\"NV8\"],[[68864,69215],\"disallowed\"],[[69216,69246],\"valid\",[],\"NV8\"],[[69247,69631],\"disallowed\"],[[69632,69702],\"valid\"],[[69703,69709],\"valid\",[],\"NV8\"],[[69710,69713],\"disallowed\"],[[69714,69733],\"valid\",[],\"NV8\"],[[69734,69743],\"valid\"],[[69744,69758],\"disallowed\"],[[69759,69759],\"valid\"],[[69760,69818],\"valid\"],[[69819,69820],\"valid\",[],\"NV8\"],[[69821,69821],\"disallowed\"],[[69822,69825],\"valid\",[],\"NV8\"],[[69826,69839],\"disallowed\"],[[69840,69864],\"valid\"],[[69865,69871],\"disallowed\"],[[69872,69881],\"valid\"],[[69882,69887],\"disallowed\"],[[69888,69940],\"valid\"],[[69941,69941],\"disallowed\"],[[69942,69951],\"valid\"],[[69952,69955],\"valid\",[],\"NV8\"],[[69956,69967],\"disallowed\"],[[69968,70003],\"valid\"],[[70004,70005],\"valid\",[],\"NV8\"],[[70006,70006],\"valid\"],[[70007,70015],\"disallowed\"],[[70016,70084],\"valid\"],[[70085,70088],\"valid\",[],\"NV8\"],[[70089,70089],\"valid\",[],\"NV8\"],[[70090,70092],\"valid\"],[[70093,70093],\"valid\",[],\"NV8\"],[[70094,70095],\"disallowed\"],[[70096,70105],\"valid\"],[[70106,70106],\"valid\"],[[70107,70107],\"valid\",[],\"NV8\"],[[70108,70108],\"valid\"],[[70109,70111],\"valid\",[],\"NV8\"],[[70112,70112],\"disallowed\"],[[70113,70132],\"valid\",[],\"NV8\"],[[70133,70143],\"disallowed\"],[[70144,70161],\"valid\"],[[70162,70162],\"disallowed\"],[[70163,70199],\"valid\"],[[70200,70205],\"valid\",[],\"NV8\"],[[70206,70271],\"disallowed\"],[[70272,70278],\"valid\"],[[70279,70279],\"disallowed\"],[[70280,70280],\"valid\"],[[70281,70281],\"disallowed\"],[[70282,70285],\"valid\"],[[70286,70286],\"disallowed\"],[[70287,70301],\"valid\"],[[70302,70302],\"disallowed\"],[[70303,70312],\"valid\"],[[70313,70313],\"valid\",[],\"NV8\"],[[70314,70319],\"disallowed\"],[[70320,70378],\"valid\"],[[70379,70383],\"disallowed\"],[[70384,70393],\"valid\"],[[70394,70399],\"disallowed\"],[[70400,70400],\"valid\"],[[70401,70403],\"valid\"],[[70404,70404],\"disallowed\"],[[70405,70412],\"valid\"],[[70413,70414],\"disallowed\"],[[70415,70416],\"valid\"],[[70417,70418],\"disallowed\"],[[70419,70440],\"valid\"],[[70441,70441],\"disallowed\"],[[70442,70448],\"valid\"],[[70449,70449],\"disallowed\"],[[70450,70451],\"valid\"],[[70452,70452],\"disallowed\"],[[70453,70457],\"valid\"],[[70458,70459],\"disallowed\"],[[70460,70468],\"valid\"],[[70469,70470],\"disallowed\"],[[70471,70472],\"valid\"],[[70473,70474],\"disallowed\"],[[70475,70477],\"valid\"],[[70478,70479],\"disallowed\"],[[70480,70480],\"valid\"],[[70481,70486],\"disallowed\"],[[70487,70487],\"valid\"],[[70488,70492],\"disallowed\"],[[70493,70499],\"valid\"],[[70500,70501],\"disallowed\"],[[70502,70508],\"valid\"],[[70509,70511],\"disallowed\"],[[70512,70516],\"valid\"],[[70517,70783],\"disallowed\"],[[70784,70853],\"valid\"],[[70854,70854],\"valid\",[],\"NV8\"],[[70855,70855],\"valid\"],[[70856,70863],\"disallowed\"],[[70864,70873],\"valid\"],[[70874,71039],\"disallowed\"],[[71040,71093],\"valid\"],[[71094,71095],\"disallowed\"],[[71096,71104],\"valid\"],[[71105,71113],\"valid\",[],\"NV8\"],[[71114,71127],\"valid\",[],\"NV8\"],[[71128,71133],\"valid\"],[[71134,71167],\"disallowed\"],[[71168,71232],\"valid\"],[[71233,71235],\"valid\",[],\"NV8\"],[[71236,71236],\"valid\"],[[71237,71247],\"disallowed\"],[[71248,71257],\"valid\"],[[71258,71295],\"disallowed\"],[[71296,71351],\"valid\"],[[71352,71359],\"disallowed\"],[[71360,71369],\"valid\"],[[71370,71423],\"disallowed\"],[[71424,71449],\"valid\"],[[71450,71452],\"disallowed\"],[[71453,71467],\"valid\"],[[71468,71471],\"disallowed\"],[[71472,71481],\"valid\"],[[71482,71487],\"valid\",[],\"NV8\"],[[71488,71839],\"disallowed\"],[[71840,71840],\"mapped\",[71872]],[[71841,71841],\"mapped\",[71873]],[[71842,71842],\"mapped\",[71874]],[[71843,71843],\"mapped\",[71875]],[[71844,71844],\"mapped\",[71876]],[[71845,71845],\"mapped\",[71877]],[[71846,71846],\"mapped\",[71878]],[[71847,71847],\"mapped\",[71879]],[[71848,71848],\"mapped\",[71880]],[[71849,71849],\"mapped\",[71881]],[[71850,71850],\"mapped\",[71882]],[[71851,71851],\"mapped\",[71883]],[[71852,71852],\"mapped\",[71884]],[[71853,71853],\"mapped\",[71885]],[[71854,71854],\"mapped\",[71886]],[[71855,71855],\"mapped\",[71887]],[[71856,71856],\"mapped\",[71888]],[[71857,71857],\"mapped\",[71889]],[[71858,71858],\"mapped\",[71890]],[[71859,71859],\"mapped\",[71891]],[[71860,71860],\"mapped\",[71892]],[[71861,71861],\"mapped\",[71893]],[[71862,71862],\"mapped\",[71894]],[[71863,71863],\"mapped\",[71895]],[[71864,71864],\"mapped\",[71896]],[[71865,71865],\"mapped\",[71897]],[[71866,71866],\"mapped\",[71898]],[[71867,71867],\"mapped\",[71899]],[[71868,71868],\"mapped\",[71900]],[[71869,71869],\"mapped\",[71901]],[[71870,71870],\"mapped\",[71902]],[[71871,71871],\"mapped\",[71903]],[[71872,71913],\"valid\"],[[71914,71922],\"valid\",[],\"NV8\"],[[71923,71934],\"disallowed\"],[[71935,71935],\"valid\"],[[71936,72383],\"disallowed\"],[[72384,72440],\"valid\"],[[72441,73727],\"disallowed\"],[[73728,74606],\"valid\"],[[74607,74648],\"valid\"],[[74649,74649],\"valid\"],[[74650,74751],\"disallowed\"],[[74752,74850],\"valid\",[],\"NV8\"],[[74851,74862],\"valid\",[],\"NV8\"],[[74863,74863],\"disallowed\"],[[74864,74867],\"valid\",[],\"NV8\"],[[74868,74868],\"valid\",[],\"NV8\"],[[74869,74879],\"disallowed\"],[[74880,75075],\"valid\"],[[75076,77823],\"disallowed\"],[[77824,78894],\"valid\"],[[78895,82943],\"disallowed\"],[[82944,83526],\"valid\"],[[83527,92159],\"disallowed\"],[[92160,92728],\"valid\"],[[92729,92735],\"disallowed\"],[[92736,92766],\"valid\"],[[92767,92767],\"disallowed\"],[[92768,92777],\"valid\"],[[92778,92781],\"disallowed\"],[[92782,92783],\"valid\",[],\"NV8\"],[[92784,92879],\"disallowed\"],[[92880,92909],\"valid\"],[[92910,92911],\"disallowed\"],[[92912,92916],\"valid\"],[[92917,92917],\"valid\",[],\"NV8\"],[[92918,92927],\"disallowed\"],[[92928,92982],\"valid\"],[[92983,92991],\"valid\",[],\"NV8\"],[[92992,92995],\"valid\"],[[92996,92997],\"valid\",[],\"NV8\"],[[92998,93007],\"disallowed\"],[[93008,93017],\"valid\"],[[93018,93018],\"disallowed\"],[[93019,93025],\"valid\",[],\"NV8\"],[[93026,93026],\"disallowed\"],[[93027,93047],\"valid\"],[[93048,93052],\"disallowed\"],[[93053,93071],\"valid\"],[[93072,93951],\"disallowed\"],[[93952,94020],\"valid\"],[[94021,94031],\"disallowed\"],[[94032,94078],\"valid\"],[[94079,94094],\"disallowed\"],[[94095,94111],\"valid\"],[[94112,110591],\"disallowed\"],[[110592,110593],\"valid\"],[[110594,113663],\"disallowed\"],[[113664,113770],\"valid\"],[[113771,113775],\"disallowed\"],[[113776,113788],\"valid\"],[[113789,113791],\"disallowed\"],[[113792,113800],\"valid\"],[[113801,113807],\"disallowed\"],[[113808,113817],\"valid\"],[[113818,113819],\"disallowed\"],[[113820,113820],\"valid\",[],\"NV8\"],[[113821,113822],\"valid\"],[[113823,113823],\"valid\",[],\"NV8\"],[[113824,113827],\"ignored\"],[[113828,118783],\"disallowed\"],[[118784,119029],\"valid\",[],\"NV8\"],[[119030,119039],\"disallowed\"],[[119040,119078],\"valid\",[],\"NV8\"],[[119079,119080],\"disallowed\"],[[119081,119081],\"valid\",[],\"NV8\"],[[119082,119133],\"valid\",[],\"NV8\"],[[119134,119134],\"mapped\",[119127,119141]],[[119135,119135],\"mapped\",[119128,119141]],[[119136,119136],\"mapped\",[119128,119141,119150]],[[119137,119137],\"mapped\",[119128,119141,119151]],[[119138,119138],\"mapped\",[119128,119141,119152]],[[119139,119139],\"mapped\",[119128,119141,119153]],[[119140,119140],\"mapped\",[119128,119141,119154]],[[119141,119154],\"valid\",[],\"NV8\"],[[119155,119162],\"disallowed\"],[[119163,119226],\"valid\",[],\"NV8\"],[[119227,119227],\"mapped\",[119225,119141]],[[119228,119228],\"mapped\",[119226,119141]],[[119229,119229],\"mapped\",[119225,119141,119150]],[[119230,119230],\"mapped\",[119226,119141,119150]],[[119231,119231],\"mapped\",[119225,119141,119151]],[[119232,119232],\"mapped\",[119226,119141,119151]],[[119233,119261],\"valid\",[],\"NV8\"],[[119262,119272],\"valid\",[],\"NV8\"],[[119273,119295],\"disallowed\"],[[119296,119365],\"valid\",[],\"NV8\"],[[119366,119551],\"disallowed\"],[[119552,119638],\"valid\",[],\"NV8\"],[[119639,119647],\"disallowed\"],[[119648,119665],\"valid\",[],\"NV8\"],[[119666,119807],\"disallowed\"],[[119808,119808],\"mapped\",[97]],[[119809,119809],\"mapped\",[98]],[[119810,119810],\"mapped\",[99]],[[119811,119811],\"mapped\",[100]],[[119812,119812],\"mapped\",[101]],[[119813,119813],\"mapped\",[102]],[[119814,119814],\"mapped\",[103]],[[119815,119815],\"mapped\",[104]],[[119816,119816],\"mapped\",[105]],[[119817,119817],\"mapped\",[106]],[[119818,119818],\"mapped\",[107]],[[119819,119819],\"mapped\",[108]],[[119820,119820],\"mapped\",[109]],[[119821,119821],\"mapped\",[110]],[[119822,119822],\"mapped\",[111]],[[119823,119823],\"mapped\",[112]],[[119824,119824],\"mapped\",[113]],[[119825,119825],\"mapped\",[114]],[[119826,119826],\"mapped\",[115]],[[119827,119827],\"mapped\",[116]],[[119828,119828],\"mapped\",[117]],[[119829,119829],\"mapped\",[118]],[[119830,119830],\"mapped\",[119]],[[119831,119831],\"mapped\",[120]],[[119832,119832],\"mapped\",[121]],[[119833,119833],\"mapped\",[122]],[[119834,119834],\"mapped\",[97]],[[119835,119835],\"mapped\",[98]],[[119836,119836],\"mapped\",[99]],[[119837,119837],\"mapped\",[100]],[[119838,119838],\"mapped\",[101]],[[119839,119839],\"mapped\",[102]],[[119840,119840],\"mapped\",[103]],[[119841,119841],\"mapped\",[104]],[[119842,119842],\"mapped\",[105]],[[119843,119843],\"mapped\",[106]],[[119844,119844],\"mapped\",[107]],[[119845,119845],\"mapped\",[108]],[[119846,119846],\"mapped\",[109]],[[119847,119847],\"mapped\",[110]],[[119848,119848],\"mapped\",[111]],[[119849,119849],\"mapped\",[112]],[[119850,119850],\"mapped\",[113]],[[119851,119851],\"mapped\",[114]],[[119852,119852],\"mapped\",[115]],[[119853,119853],\"mapped\",[116]],[[119854,119854],\"mapped\",[117]],[[119855,119855],\"mapped\",[118]],[[119856,119856],\"mapped\",[119]],[[119857,119857],\"mapped\",[120]],[[119858,119858],\"mapped\",[121]],[[119859,119859],\"mapped\",[122]],[[119860,119860],\"mapped\",[97]],[[119861,119861],\"mapped\",[98]],[[119862,119862],\"mapped\",[99]],[[119863,119863],\"mapped\",[100]],[[119864,119864],\"mapped\",[101]],[[119865,119865],\"mapped\",[102]],[[119866,119866],\"mapped\",[103]],[[119867,119867],\"mapped\",[104]],[[119868,119868],\"mapped\",[105]],[[119869,119869],\"mapped\",[106]],[[119870,119870],\"mapped\",[107]],[[119871,119871],\"mapped\",[108]],[[119872,119872],\"mapped\",[109]],[[119873,119873],\"mapped\",[110]],[[119874,119874],\"mapped\",[111]],[[119875,119875],\"mapped\",[112]],[[119876,119876],\"mapped\",[113]],[[119877,119877],\"mapped\",[114]],[[119878,119878],\"mapped\",[115]],[[119879,119879],\"mapped\",[116]],[[119880,119880],\"mapped\",[117]],[[119881,119881],\"mapped\",[118]],[[119882,119882],\"mapped\",[119]],[[119883,119883],\"mapped\",[120]],[[119884,119884],\"mapped\",[121]],[[119885,119885],\"mapped\",[122]],[[119886,119886],\"mapped\",[97]],[[119887,119887],\"mapped\",[98]],[[119888,119888],\"mapped\",[99]],[[119889,119889],\"mapped\",[100]],[[119890,119890],\"mapped\",[101]],[[119891,119891],\"mapped\",[102]],[[119892,119892],\"mapped\",[103]],[[119893,119893],\"disallowed\"],[[119894,119894],\"mapped\",[105]],[[119895,119895],\"mapped\",[106]],[[119896,119896],\"mapped\",[107]],[[119897,119897],\"mapped\",[108]],[[119898,119898],\"mapped\",[109]],[[119899,119899],\"mapped\",[110]],[[119900,119900],\"mapped\",[111]],[[119901,119901],\"mapped\",[112]],[[119902,119902],\"mapped\",[113]],[[119903,119903],\"mapped\",[114]],[[119904,119904],\"mapped\",[115]],[[119905,119905],\"mapped\",[116]],[[119906,119906],\"mapped\",[117]],[[119907,119907],\"mapped\",[118]],[[119908,119908],\"mapped\",[119]],[[119909,119909],\"mapped\",[120]],[[119910,119910],\"mapped\",[121]],[[119911,119911],\"mapped\",[122]],[[119912,119912],\"mapped\",[97]],[[119913,119913],\"mapped\",[98]],[[119914,119914],\"mapped\",[99]],[[119915,119915],\"mapped\",[100]],[[119916,119916],\"mapped\",[101]],[[119917,119917],\"mapped\",[102]],[[119918,119918],\"mapped\",[103]],[[119919,119919],\"mapped\",[104]],[[119920,119920],\"mapped\",[105]],[[119921,119921],\"mapped\",[106]],[[119922,119922],\"mapped\",[107]],[[119923,119923],\"mapped\",[108]],[[119924,119924],\"mapped\",[109]],[[119925,119925],\"mapped\",[110]],[[119926,119926],\"mapped\",[111]],[[119927,119927],\"mapped\",[112]],[[119928,119928],\"mapped\",[113]],[[119929,119929],\"mapped\",[114]],[[119930,119930],\"mapped\",[115]],[[119931,119931],\"mapped\",[116]],[[119932,119932],\"mapped\",[117]],[[119933,119933],\"mapped\",[118]],[[119934,119934],\"mapped\",[119]],[[119935,119935],\"mapped\",[120]],[[119936,119936],\"mapped\",[121]],[[119937,119937],\"mapped\",[122]],[[119938,119938],\"mapped\",[97]],[[119939,119939],\"mapped\",[98]],[[119940,119940],\"mapped\",[99]],[[119941,119941],\"mapped\",[100]],[[119942,119942],\"mapped\",[101]],[[119943,119943],\"mapped\",[102]],[[119944,119944],\"mapped\",[103]],[[119945,119945],\"mapped\",[104]],[[119946,119946],\"mapped\",[105]],[[119947,119947],\"mapped\",[106]],[[119948,119948],\"mapped\",[107]],[[119949,119949],\"mapped\",[108]],[[119950,119950],\"mapped\",[109]],[[119951,119951],\"mapped\",[110]],[[119952,119952],\"mapped\",[111]],[[119953,119953],\"mapped\",[112]],[[119954,119954],\"mapped\",[113]],[[119955,119955],\"mapped\",[114]],[[119956,119956],\"mapped\",[115]],[[119957,119957],\"mapped\",[116]],[[119958,119958],\"mapped\",[117]],[[119959,119959],\"mapped\",[118]],[[119960,119960],\"mapped\",[119]],[[119961,119961],\"mapped\",[120]],[[119962,119962],\"mapped\",[121]],[[119963,119963],\"mapped\",[122]],[[119964,119964],\"mapped\",[97]],[[119965,119965],\"disallowed\"],[[119966,119966],\"mapped\",[99]],[[119967,119967],\"mapped\",[100]],[[119968,119969],\"disallowed\"],[[119970,119970],\"mapped\",[103]],[[119971,119972],\"disallowed\"],[[119973,119973],\"mapped\",[106]],[[119974,119974],\"mapped\",[107]],[[119975,119976],\"disallowed\"],[[119977,119977],\"mapped\",[110]],[[119978,119978],\"mapped\",[111]],[[119979,119979],\"mapped\",[112]],[[119980,119980],\"mapped\",[113]],[[119981,119981],\"disallowed\"],[[119982,119982],\"mapped\",[115]],[[119983,119983],\"mapped\",[116]],[[119984,119984],\"mapped\",[117]],[[119985,119985],\"mapped\",[118]],[[119986,119986],\"mapped\",[119]],[[119987,119987],\"mapped\",[120]],[[119988,119988],\"mapped\",[121]],[[119989,119989],\"mapped\",[122]],[[119990,119990],\"mapped\",[97]],[[119991,119991],\"mapped\",[98]],[[119992,119992],\"mapped\",[99]],[[119993,119993],\"mapped\",[100]],[[119994,119994],\"disallowed\"],[[119995,119995],\"mapped\",[102]],[[119996,119996],\"disallowed\"],[[119997,119997],\"mapped\",[104]],[[119998,119998],\"mapped\",[105]],[[119999,119999],\"mapped\",[106]],[[120000,120000],\"mapped\",[107]],[[120001,120001],\"mapped\",[108]],[[120002,120002],\"mapped\",[109]],[[120003,120003],\"mapped\",[110]],[[120004,120004],\"disallowed\"],[[120005,120005],\"mapped\",[112]],[[120006,120006],\"mapped\",[113]],[[120007,120007],\"mapped\",[114]],[[120008,120008],\"mapped\",[115]],[[120009,120009],\"mapped\",[116]],[[120010,120010],\"mapped\",[117]],[[120011,120011],\"mapped\",[118]],[[120012,120012],\"mapped\",[119]],[[120013,120013],\"mapped\",[120]],[[120014,120014],\"mapped\",[121]],[[120015,120015],\"mapped\",[122]],[[120016,120016],\"mapped\",[97]],[[120017,120017],\"mapped\",[98]],[[120018,120018],\"mapped\",[99]],[[120019,120019],\"mapped\",[100]],[[120020,120020],\"mapped\",[101]],[[120021,120021],\"mapped\",[102]],[[120022,120022],\"mapped\",[103]],[[120023,120023],\"mapped\",[104]],[[120024,120024],\"mapped\",[105]],[[120025,120025],\"mapped\",[106]],[[120026,120026],\"mapped\",[107]],[[120027,120027],\"mapped\",[108]],[[120028,120028],\"mapped\",[109]],[[120029,120029],\"mapped\",[110]],[[120030,120030],\"mapped\",[111]],[[120031,120031],\"mapped\",[112]],[[120032,120032],\"mapped\",[113]],[[120033,120033],\"mapped\",[114]],[[120034,120034],\"mapped\",[115]],[[120035,120035],\"mapped\",[116]],[[120036,120036],\"mapped\",[117]],[[120037,120037],\"mapped\",[118]],[[120038,120038],\"mapped\",[119]],[[120039,120039],\"mapped\",[120]],[[120040,120040],\"mapped\",[121]],[[120041,120041],\"mapped\",[122]],[[120042,120042],\"mapped\",[97]],[[120043,120043],\"mapped\",[98]],[[120044,120044],\"mapped\",[99]],[[120045,120045],\"mapped\",[100]],[[120046,120046],\"mapped\",[101]],[[120047,120047],\"mapped\",[102]],[[120048,120048],\"mapped\",[103]],[[120049,120049],\"mapped\",[104]],[[120050,120050],\"mapped\",[105]],[[120051,120051],\"mapped\",[106]],[[120052,120052],\"mapped\",[107]],[[120053,120053],\"mapped\",[108]],[[120054,120054],\"mapped\",[109]],[[120055,120055],\"mapped\",[110]],[[120056,120056],\"mapped\",[111]],[[120057,120057],\"mapped\",[112]],[[120058,120058],\"mapped\",[113]],[[120059,120059],\"mapped\",[114]],[[120060,120060],\"mapped\",[115]],[[120061,120061],\"mapped\",[116]],[[120062,120062],\"mapped\",[117]],[[120063,120063],\"mapped\",[118]],[[120064,120064],\"mapped\",[119]],[[120065,120065],\"mapped\",[120]],[[120066,120066],\"mapped\",[121]],[[120067,120067],\"mapped\",[122]],[[120068,120068],\"mapped\",[97]],[[120069,120069],\"mapped\",[98]],[[120070,120070],\"disallowed\"],[[120071,120071],\"mapped\",[100]],[[120072,120072],\"mapped\",[101]],[[120073,120073],\"mapped\",[102]],[[120074,120074],\"mapped\",[103]],[[120075,120076],\"disallowed\"],[[120077,120077],\"mapped\",[106]],[[120078,120078],\"mapped\",[107]],[[120079,120079],\"mapped\",[108]],[[120080,120080],\"mapped\",[109]],[[120081,120081],\"mapped\",[110]],[[120082,120082],\"mapped\",[111]],[[120083,120083],\"mapped\",[112]],[[120084,120084],\"mapped\",[113]],[[120085,120085],\"disallowed\"],[[120086,120086],\"mapped\",[115]],[[120087,120087],\"mapped\",[116]],[[120088,120088],\"mapped\",[117]],[[120089,120089],\"mapped\",[118]],[[120090,120090],\"mapped\",[119]],[[120091,120091],\"mapped\",[120]],[[120092,120092],\"mapped\",[121]],[[120093,120093],\"disallowed\"],[[120094,120094],\"mapped\",[97]],[[120095,120095],\"mapped\",[98]],[[120096,120096],\"mapped\",[99]],[[120097,120097],\"mapped\",[100]],[[120098,120098],\"mapped\",[101]],[[120099,120099],\"mapped\",[102]],[[120100,120100],\"mapped\",[103]],[[120101,120101],\"mapped\",[104]],[[120102,120102],\"mapped\",[105]],[[120103,120103],\"mapped\",[106]],[[120104,120104],\"mapped\",[107]],[[120105,120105],\"mapped\",[108]],[[120106,120106],\"mapped\",[109]],[[120107,120107],\"mapped\",[110]],[[120108,120108],\"mapped\",[111]],[[120109,120109],\"mapped\",[112]],[[120110,120110],\"mapped\",[113]],[[120111,120111],\"mapped\",[114]],[[120112,120112],\"mapped\",[115]],[[120113,120113],\"mapped\",[116]],[[120114,120114],\"mapped\",[117]],[[120115,120115],\"mapped\",[118]],[[120116,120116],\"mapped\",[119]],[[120117,120117],\"mapped\",[120]],[[120118,120118],\"mapped\",[121]],[[120119,120119],\"mapped\",[122]],[[120120,120120],\"mapped\",[97]],[[120121,120121],\"mapped\",[98]],[[120122,120122],\"disallowed\"],[[120123,120123],\"mapped\",[100]],[[120124,120124],\"mapped\",[101]],[[120125,120125],\"mapped\",[102]],[[120126,120126],\"mapped\",[103]],[[120127,120127],\"disallowed\"],[[120128,120128],\"mapped\",[105]],[[120129,120129],\"mapped\",[106]],[[120130,120130],\"mapped\",[107]],[[120131,120131],\"mapped\",[108]],[[120132,120132],\"mapped\",[109]],[[120133,120133],\"disallowed\"],[[120134,120134],\"mapped\",[111]],[[120135,120137],\"disallowed\"],[[120138,120138],\"mapped\",[115]],[[120139,120139],\"mapped\",[116]],[[120140,120140],\"mapped\",[117]],[[120141,120141],\"mapped\",[118]],[[120142,120142],\"mapped\",[119]],[[120143,120143],\"mapped\",[120]],[[120144,120144],\"mapped\",[121]],[[120145,120145],\"disallowed\"],[[120146,120146],\"mapped\",[97]],[[120147,120147],\"mapped\",[98]],[[120148,120148],\"mapped\",[99]],[[120149,120149],\"mapped\",[100]],[[120150,120150],\"mapped\",[101]],[[120151,120151],\"mapped\",[102]],[[120152,120152],\"mapped\",[103]],[[120153,120153],\"mapped\",[104]],[[120154,120154],\"mapped\",[105]],[[120155,120155],\"mapped\",[106]],[[120156,120156],\"mapped\",[107]],[[120157,120157],\"mapped\",[108]],[[120158,120158],\"mapped\",[109]],[[120159,120159],\"mapped\",[110]],[[120160,120160],\"mapped\",[111]],[[120161,120161],\"mapped\",[112]],[[120162,120162],\"mapped\",[113]],[[120163,120163],\"mapped\",[114]],[[120164,120164],\"mapped\",[115]],[[120165,120165],\"mapped\",[116]],[[120166,120166],\"mapped\",[117]],[[120167,120167],\"mapped\",[118]],[[120168,120168],\"mapped\",[119]],[[120169,120169],\"mapped\",[120]],[[120170,120170],\"mapped\",[121]],[[120171,120171],\"mapped\",[122]],[[120172,120172],\"mapped\",[97]],[[120173,120173],\"mapped\",[98]],[[120174,120174],\"mapped\",[99]],[[120175,120175],\"mapped\",[100]],[[120176,120176],\"mapped\",[101]],[[120177,120177],\"mapped\",[102]],[[120178,120178],\"mapped\",[103]],[[120179,120179],\"mapped\",[104]],[[120180,120180],\"mapped\",[105]],[[120181,120181],\"mapped\",[106]],[[120182,120182],\"mapped\",[107]],[[120183,120183],\"mapped\",[108]],[[120184,120184],\"mapped\",[109]],[[120185,120185],\"mapped\",[110]],[[120186,120186],\"mapped\",[111]],[[120187,120187],\"mapped\",[112]],[[120188,120188],\"mapped\",[113]],[[120189,120189],\"mapped\",[114]],[[120190,120190],\"mapped\",[115]],[[120191,120191],\"mapped\",[116]],[[120192,120192],\"mapped\",[117]],[[120193,120193],\"mapped\",[118]],[[120194,120194],\"mapped\",[119]],[[120195,120195],\"mapped\",[120]],[[120196,120196],\"mapped\",[121]],[[120197,120197],\"mapped\",[122]],[[120198,120198],\"mapped\",[97]],[[120199,120199],\"mapped\",[98]],[[120200,120200],\"mapped\",[99]],[[120201,120201],\"mapped\",[100]],[[120202,120202],\"mapped\",[101]],[[120203,120203],\"mapped\",[102]],[[120204,120204],\"mapped\",[103]],[[120205,120205],\"mapped\",[104]],[[120206,120206],\"mapped\",[105]],[[120207,120207],\"mapped\",[106]],[[120208,120208],\"mapped\",[107]],[[120209,120209],\"mapped\",[108]],[[120210,120210],\"mapped\",[109]],[[120211,120211],\"mapped\",[110]],[[120212,120212],\"mapped\",[111]],[[120213,120213],\"mapped\",[112]],[[120214,120214],\"mapped\",[113]],[[120215,120215],\"mapped\",[114]],[[120216,120216],\"mapped\",[115]],[[120217,120217],\"mapped\",[116]],[[120218,120218],\"mapped\",[117]],[[120219,120219],\"mapped\",[118]],[[120220,120220],\"mapped\",[119]],[[120221,120221],\"mapped\",[120]],[[120222,120222],\"mapped\",[121]],[[120223,120223],\"mapped\",[122]],[[120224,120224],\"mapped\",[97]],[[120225,120225],\"mapped\",[98]],[[120226,120226],\"mapped\",[99]],[[120227,120227],\"mapped\",[100]],[[120228,120228],\"mapped\",[101]],[[120229,120229],\"mapped\",[102]],[[120230,120230],\"mapped\",[103]],[[120231,120231],\"mapped\",[104]],[[120232,120232],\"mapped\",[105]],[[120233,120233],\"mapped\",[106]],[[120234,120234],\"mapped\",[107]],[[120235,120235],\"mapped\",[108]],[[120236,120236],\"mapped\",[109]],[[120237,120237],\"mapped\",[110]],[[120238,120238],\"mapped\",[111]],[[120239,120239],\"mapped\",[112]],[[120240,120240],\"mapped\",[113]],[[120241,120241],\"mapped\",[114]],[[120242,120242],\"mapped\",[115]],[[120243,120243],\"mapped\",[116]],[[120244,120244],\"mapped\",[117]],[[120245,120245],\"mapped\",[118]],[[120246,120246],\"mapped\",[119]],[[120247,120247],\"mapped\",[120]],[[120248,120248],\"mapped\",[121]],[[120249,120249],\"mapped\",[122]],[[120250,120250],\"mapped\",[97]],[[120251,120251],\"mapped\",[98]],[[120252,120252],\"mapped\",[99]],[[120253,120253],\"mapped\",[100]],[[120254,120254],\"mapped\",[101]],[[120255,120255],\"mapped\",[102]],[[120256,120256],\"mapped\",[103]],[[120257,120257],\"mapped\",[104]],[[120258,120258],\"mapped\",[105]],[[120259,120259],\"mapped\",[106]],[[120260,120260],\"mapped\",[107]],[[120261,120261],\"mapped\",[108]],[[120262,120262],\"mapped\",[109]],[[120263,120263],\"mapped\",[110]],[[120264,120264],\"mapped\",[111]],[[120265,120265],\"mapped\",[112]],[[120266,120266],\"mapped\",[113]],[[120267,120267],\"mapped\",[114]],[[120268,120268],\"mapped\",[115]],[[120269,120269],\"mapped\",[116]],[[120270,120270],\"mapped\",[117]],[[120271,120271],\"mapped\",[118]],[[120272,120272],\"mapped\",[119]],[[120273,120273],\"mapped\",[120]],[[120274,120274],\"mapped\",[121]],[[120275,120275],\"mapped\",[122]],[[120276,120276],\"mapped\",[97]],[[120277,120277],\"mapped\",[98]],[[120278,120278],\"mapped\",[99]],[[120279,120279],\"mapped\",[100]],[[120280,120280],\"mapped\",[101]],[[120281,120281],\"mapped\",[102]],[[120282,120282],\"mapped\",[103]],[[120283,120283],\"mapped\",[104]],[[120284,120284],\"mapped\",[105]],[[120285,120285],\"mapped\",[106]],[[120286,120286],\"mapped\",[107]],[[120287,120287],\"mapped\",[108]],[[120288,120288],\"mapped\",[109]],[[120289,120289],\"mapped\",[110]],[[120290,120290],\"mapped\",[111]],[[120291,120291],\"mapped\",[112]],[[120292,120292],\"mapped\",[113]],[[120293,120293],\"mapped\",[114]],[[120294,120294],\"mapped\",[115]],[[120295,120295],\"mapped\",[116]],[[120296,120296],\"mapped\",[117]],[[120297,120297],\"mapped\",[118]],[[120298,120298],\"mapped\",[119]],[[120299,120299],\"mapped\",[120]],[[120300,120300],\"mapped\",[121]],[[120301,120301],\"mapped\",[122]],[[120302,120302],\"mapped\",[97]],[[120303,120303],\"mapped\",[98]],[[120304,120304],\"mapped\",[99]],[[120305,120305],\"mapped\",[100]],[[120306,120306],\"mapped\",[101]],[[120307,120307],\"mapped\",[102]],[[120308,120308],\"mapped\",[103]],[[120309,120309],\"mapped\",[104]],[[120310,120310],\"mapped\",[105]],[[120311,120311],\"mapped\",[106]],[[120312,120312],\"mapped\",[107]],[[120313,120313],\"mapped\",[108]],[[120314,120314],\"mapped\",[109]],[[120315,120315],\"mapped\",[110]],[[120316,120316],\"mapped\",[111]],[[120317,120317],\"mapped\",[112]],[[120318,120318],\"mapped\",[113]],[[120319,120319],\"mapped\",[114]],[[120320,120320],\"mapped\",[115]],[[120321,120321],\"mapped\",[116]],[[120322,120322],\"mapped\",[117]],[[120323,120323],\"mapped\",[118]],[[120324,120324],\"mapped\",[119]],[[120325,120325],\"mapped\",[120]],[[120326,120326],\"mapped\",[121]],[[120327,120327],\"mapped\",[122]],[[120328,120328],\"mapped\",[97]],[[120329,120329],\"mapped\",[98]],[[120330,120330],\"mapped\",[99]],[[120331,120331],\"mapped\",[100]],[[120332,120332],\"mapped\",[101]],[[120333,120333],\"mapped\",[102]],[[120334,120334],\"mapped\",[103]],[[120335,120335],\"mapped\",[104]],[[120336,120336],\"mapped\",[105]],[[120337,120337],\"mapped\",[106]],[[120338,120338],\"mapped\",[107]],[[120339,120339],\"mapped\",[108]],[[120340,120340],\"mapped\",[109]],[[120341,120341],\"mapped\",[110]],[[120342,120342],\"mapped\",[111]],[[120343,120343],\"mapped\",[112]],[[120344,120344],\"mapped\",[113]],[[120345,120345],\"mapped\",[114]],[[120346,120346],\"mapped\",[115]],[[120347,120347],\"mapped\",[116]],[[120348,120348],\"mapped\",[117]],[[120349,120349],\"mapped\",[118]],[[120350,120350],\"mapped\",[119]],[[120351,120351],\"mapped\",[120]],[[120352,120352],\"mapped\",[121]],[[120353,120353],\"mapped\",[122]],[[120354,120354],\"mapped\",[97]],[[120355,120355],\"mapped\",[98]],[[120356,120356],\"mapped\",[99]],[[120357,120357],\"mapped\",[100]],[[120358,120358],\"mapped\",[101]],[[120359,120359],\"mapped\",[102]],[[120360,120360],\"mapped\",[103]],[[120361,120361],\"mapped\",[104]],[[120362,120362],\"mapped\",[105]],[[120363,120363],\"mapped\",[106]],[[120364,120364],\"mapped\",[107]],[[120365,120365],\"mapped\",[108]],[[120366,120366],\"mapped\",[109]],[[120367,120367],\"mapped\",[110]],[[120368,120368],\"mapped\",[111]],[[120369,120369],\"mapped\",[112]],[[120370,120370],\"mapped\",[113]],[[120371,120371],\"mapped\",[114]],[[120372,120372],\"mapped\",[115]],[[120373,120373],\"mapped\",[116]],[[120374,120374],\"mapped\",[117]],[[120375,120375],\"mapped\",[118]],[[120376,120376],\"mapped\",[119]],[[120377,120377],\"mapped\",[120]],[[120378,120378],\"mapped\",[121]],[[120379,120379],\"mapped\",[122]],[[120380,120380],\"mapped\",[97]],[[120381,120381],\"mapped\",[98]],[[120382,120382],\"mapped\",[99]],[[120383,120383],\"mapped\",[100]],[[120384,120384],\"mapped\",[101]],[[120385,120385],\"mapped\",[102]],[[120386,120386],\"mapped\",[103]],[[120387,120387],\"mapped\",[104]],[[120388,120388],\"mapped\",[105]],[[120389,120389],\"mapped\",[106]],[[120390,120390],\"mapped\",[107]],[[120391,120391],\"mapped\",[108]],[[120392,120392],\"mapped\",[109]],[[120393,120393],\"mapped\",[110]],[[120394,120394],\"mapped\",[111]],[[120395,120395],\"mapped\",[112]],[[120396,120396],\"mapped\",[113]],[[120397,120397],\"mapped\",[114]],[[120398,120398],\"mapped\",[115]],[[120399,120399],\"mapped\",[116]],[[120400,120400],\"mapped\",[117]],[[120401,120401],\"mapped\",[118]],[[120402,120402],\"mapped\",[119]],[[120403,120403],\"mapped\",[120]],[[120404,120404],\"mapped\",[121]],[[120405,120405],\"mapped\",[122]],[[120406,120406],\"mapped\",[97]],[[120407,120407],\"mapped\",[98]],[[120408,120408],\"mapped\",[99]],[[120409,120409],\"mapped\",[100]],[[120410,120410],\"mapped\",[101]],[[120411,120411],\"mapped\",[102]],[[120412,120412],\"mapped\",[103]],[[120413,120413],\"mapped\",[104]],[[120414,120414],\"mapped\",[105]],[[120415,120415],\"mapped\",[106]],[[120416,120416],\"mapped\",[107]],[[120417,120417],\"mapped\",[108]],[[120418,120418],\"mapped\",[109]],[[120419,120419],\"mapped\",[110]],[[120420,120420],\"mapped\",[111]],[[120421,120421],\"mapped\",[112]],[[120422,120422],\"mapped\",[113]],[[120423,120423],\"mapped\",[114]],[[120424,120424],\"mapped\",[115]],[[120425,120425],\"mapped\",[116]],[[120426,120426],\"mapped\",[117]],[[120427,120427],\"mapped\",[118]],[[120428,120428],\"mapped\",[119]],[[120429,120429],\"mapped\",[120]],[[120430,120430],\"mapped\",[121]],[[120431,120431],\"mapped\",[122]],[[120432,120432],\"mapped\",[97]],[[120433,120433],\"mapped\",[98]],[[120434,120434],\"mapped\",[99]],[[120435,120435],\"mapped\",[100]],[[120436,120436],\"mapped\",[101]],[[120437,120437],\"mapped\",[102]],[[120438,120438],\"mapped\",[103]],[[120439,120439],\"mapped\",[104]],[[120440,120440],\"mapped\",[105]],[[120441,120441],\"mapped\",[106]],[[120442,120442],\"mapped\",[107]],[[120443,120443],\"mapped\",[108]],[[120444,120444],\"mapped\",[109]],[[120445,120445],\"mapped\",[110]],[[120446,120446],\"mapped\",[111]],[[120447,120447],\"mapped\",[112]],[[120448,120448],\"mapped\",[113]],[[120449,120449],\"mapped\",[114]],[[120450,120450],\"mapped\",[115]],[[120451,120451],\"mapped\",[116]],[[120452,120452],\"mapped\",[117]],[[120453,120453],\"mapped\",[118]],[[120454,120454],\"mapped\",[119]],[[120455,120455],\"mapped\",[120]],[[120456,120456],\"mapped\",[121]],[[120457,120457],\"mapped\",[122]],[[120458,120458],\"mapped\",[97]],[[120459,120459],\"mapped\",[98]],[[120460,120460],\"mapped\",[99]],[[120461,120461],\"mapped\",[100]],[[120462,120462],\"mapped\",[101]],[[120463,120463],\"mapped\",[102]],[[120464,120464],\"mapped\",[103]],[[120465,120465],\"mapped\",[104]],[[120466,120466],\"mapped\",[105]],[[120467,120467],\"mapped\",[106]],[[120468,120468],\"mapped\",[107]],[[120469,120469],\"mapped\",[108]],[[120470,120470],\"mapped\",[109]],[[120471,120471],\"mapped\",[110]],[[120472,120472],\"mapped\",[111]],[[120473,120473],\"mapped\",[112]],[[120474,120474],\"mapped\",[113]],[[120475,120475],\"mapped\",[114]],[[120476,120476],\"mapped\",[115]],[[120477,120477],\"mapped\",[116]],[[120478,120478],\"mapped\",[117]],[[120479,120479],\"mapped\",[118]],[[120480,120480],\"mapped\",[119]],[[120481,120481],\"mapped\",[120]],[[120482,120482],\"mapped\",[121]],[[120483,120483],\"mapped\",[122]],[[120484,120484],\"mapped\",[305]],[[120485,120485],\"mapped\",[567]],[[120486,120487],\"disallowed\"],[[120488,120488],\"mapped\",[945]],[[120489,120489],\"mapped\",[946]],[[120490,120490],\"mapped\",[947]],[[120491,120491],\"mapped\",[948]],[[120492,120492],\"mapped\",[949]],[[120493,120493],\"mapped\",[950]],[[120494,120494],\"mapped\",[951]],[[120495,120495],\"mapped\",[952]],[[120496,120496],\"mapped\",[953]],[[120497,120497],\"mapped\",[954]],[[120498,120498],\"mapped\",[955]],[[120499,120499],\"mapped\",[956]],[[120500,120500],\"mapped\",[957]],[[120501,120501],\"mapped\",[958]],[[120502,120502],\"mapped\",[959]],[[120503,120503],\"mapped\",[960]],[[120504,120504],\"mapped\",[961]],[[120505,120505],\"mapped\",[952]],[[120506,120506],\"mapped\",[963]],[[120507,120507],\"mapped\",[964]],[[120508,120508],\"mapped\",[965]],[[120509,120509],\"mapped\",[966]],[[120510,120510],\"mapped\",[967]],[[120511,120511],\"mapped\",[968]],[[120512,120512],\"mapped\",[969]],[[120513,120513],\"mapped\",[8711]],[[120514,120514],\"mapped\",[945]],[[120515,120515],\"mapped\",[946]],[[120516,120516],\"mapped\",[947]],[[120517,120517],\"mapped\",[948]],[[120518,120518],\"mapped\",[949]],[[120519,120519],\"mapped\",[950]],[[120520,120520],\"mapped\",[951]],[[120521,120521],\"mapped\",[952]],[[120522,120522],\"mapped\",[953]],[[120523,120523],\"mapped\",[954]],[[120524,120524],\"mapped\",[955]],[[120525,120525],\"mapped\",[956]],[[120526,120526],\"mapped\",[957]],[[120527,120527],\"mapped\",[958]],[[120528,120528],\"mapped\",[959]],[[120529,120529],\"mapped\",[960]],[[120530,120530],\"mapped\",[961]],[[120531,120532],\"mapped\",[963]],[[120533,120533],\"mapped\",[964]],[[120534,120534],\"mapped\",[965]],[[120535,120535],\"mapped\",[966]],[[120536,120536],\"mapped\",[967]],[[120537,120537],\"mapped\",[968]],[[120538,120538],\"mapped\",[969]],[[120539,120539],\"mapped\",[8706]],[[120540,120540],\"mapped\",[949]],[[120541,120541],\"mapped\",[952]],[[120542,120542],\"mapped\",[954]],[[120543,120543],\"mapped\",[966]],[[120544,120544],\"mapped\",[961]],[[120545,120545],\"mapped\",[960]],[[120546,120546],\"mapped\",[945]],[[120547,120547],\"mapped\",[946]],[[120548,120548],\"mapped\",[947]],[[120549,120549],\"mapped\",[948]],[[120550,120550],\"mapped\",[949]],[[120551,120551],\"mapped\",[950]],[[120552,120552],\"mapped\",[951]],[[120553,120553],\"mapped\",[952]],[[120554,120554],\"mapped\",[953]],[[120555,120555],\"mapped\",[954]],[[120556,120556],\"mapped\",[955]],[[120557,120557],\"mapped\",[956]],[[120558,120558],\"mapped\",[957]],[[120559,120559],\"mapped\",[958]],[[120560,120560],\"mapped\",[959]],[[120561,120561],\"mapped\",[960]],[[120562,120562],\"mapped\",[961]],[[120563,120563],\"mapped\",[952]],[[120564,120564],\"mapped\",[963]],[[120565,120565],\"mapped\",[964]],[[120566,120566],\"mapped\",[965]],[[120567,120567],\"mapped\",[966]],[[120568,120568],\"mapped\",[967]],[[120569,120569],\"mapped\",[968]],[[120570,120570],\"mapped\",[969]],[[120571,120571],\"mapped\",[8711]],[[120572,120572],\"mapped\",[945]],[[120573,120573],\"mapped\",[946]],[[120574,120574],\"mapped\",[947]],[[120575,120575],\"mapped\",[948]],[[120576,120576],\"mapped\",[949]],[[120577,120577],\"mapped\",[950]],[[120578,120578],\"mapped\",[951]],[[120579,120579],\"mapped\",[952]],[[120580,120580],\"mapped\",[953]],[[120581,120581],\"mapped\",[954]],[[120582,120582],\"mapped\",[955]],[[120583,120583],\"mapped\",[956]],[[120584,120584],\"mapped\",[957]],[[120585,120585],\"mapped\",[958]],[[120586,120586],\"mapped\",[959]],[[120587,120587],\"mapped\",[960]],[[120588,120588],\"mapped\",[961]],[[120589,120590],\"mapped\",[963]],[[120591,120591],\"mapped\",[964]],[[120592,120592],\"mapped\",[965]],[[120593,120593],\"mapped\",[966]],[[120594,120594],\"mapped\",[967]],[[120595,120595],\"mapped\",[968]],[[120596,120596],\"mapped\",[969]],[[120597,120597],\"mapped\",[8706]],[[120598,120598],\"mapped\",[949]],[[120599,120599],\"mapped\",[952]],[[120600,120600],\"mapped\",[954]],[[120601,120601],\"mapped\",[966]],[[120602,120602],\"mapped\",[961]],[[120603,120603],\"mapped\",[960]],[[120604,120604],\"mapped\",[945]],[[120605,120605],\"mapped\",[946]],[[120606,120606],\"mapped\",[947]],[[120607,120607],\"mapped\",[948]],[[120608,120608],\"mapped\",[949]],[[120609,120609],\"mapped\",[950]],[[120610,120610],\"mapped\",[951]],[[120611,120611],\"mapped\",[952]],[[120612,120612],\"mapped\",[953]],[[120613,120613],\"mapped\",[954]],[[120614,120614],\"mapped\",[955]],[[120615,120615],\"mapped\",[956]],[[120616,120616],\"mapped\",[957]],[[120617,120617],\"mapped\",[958]],[[120618,120618],\"mapped\",[959]],[[120619,120619],\"mapped\",[960]],[[120620,120620],\"mapped\",[961]],[[120621,120621],\"mapped\",[952]],[[120622,120622],\"mapped\",[963]],[[120623,120623],\"mapped\",[964]],[[120624,120624],\"mapped\",[965]],[[120625,120625],\"mapped\",[966]],[[120626,120626],\"mapped\",[967]],[[120627,120627],\"mapped\",[968]],[[120628,120628],\"mapped\",[969]],[[120629,120629],\"mapped\",[8711]],[[120630,120630],\"mapped\",[945]],[[120631,120631],\"mapped\",[946]],[[120632,120632],\"mapped\",[947]],[[120633,120633],\"mapped\",[948]],[[120634,120634],\"mapped\",[949]],[[120635,120635],\"mapped\",[950]],[[120636,120636],\"mapped\",[951]],[[120637,120637],\"mapped\",[952]],[[120638,120638],\"mapped\",[953]],[[120639,120639],\"mapped\",[954]],[[120640,120640],\"mapped\",[955]],[[120641,120641],\"mapped\",[956]],[[120642,120642],\"mapped\",[957]],[[120643,120643],\"mapped\",[958]],[[120644,120644],\"mapped\",[959]],[[120645,120645],\"mapped\",[960]],[[120646,120646],\"mapped\",[961]],[[120647,120648],\"mapped\",[963]],[[120649,120649],\"mapped\",[964]],[[120650,120650],\"mapped\",[965]],[[120651,120651],\"mapped\",[966]],[[120652,120652],\"mapped\",[967]],[[120653,120653],\"mapped\",[968]],[[120654,120654],\"mapped\",[969]],[[120655,120655],\"mapped\",[8706]],[[120656,120656],\"mapped\",[949]],[[120657,120657],\"mapped\",[952]],[[120658,120658],\"mapped\",[954]],[[120659,120659],\"mapped\",[966]],[[120660,120660],\"mapped\",[961]],[[120661,120661],\"mapped\",[960]],[[120662,120662],\"mapped\",[945]],[[120663,120663],\"mapped\",[946]],[[120664,120664],\"mapped\",[947]],[[120665,120665],\"mapped\",[948]],[[120666,120666],\"mapped\",[949]],[[120667,120667],\"mapped\",[950]],[[120668,120668],\"mapped\",[951]],[[120669,120669],\"mapped\",[952]],[[120670,120670],\"mapped\",[953]],[[120671,120671],\"mapped\",[954]],[[120672,120672],\"mapped\",[955]],[[120673,120673],\"mapped\",[956]],[[120674,120674],\"mapped\",[957]],[[120675,120675],\"mapped\",[958]],[[120676,120676],\"mapped\",[959]],[[120677,120677],\"mapped\",[960]],[[120678,120678],\"mapped\",[961]],[[120679,120679],\"mapped\",[952]],[[120680,120680],\"mapped\",[963]],[[120681,120681],\"mapped\",[964]],[[120682,120682],\"mapped\",[965]],[[120683,120683],\"mapped\",[966]],[[120684,120684],\"mapped\",[967]],[[120685,120685],\"mapped\",[968]],[[120686,120686],\"mapped\",[969]],[[120687,120687],\"mapped\",[8711]],[[120688,120688],\"mapped\",[945]],[[120689,120689],\"mapped\",[946]],[[120690,120690],\"mapped\",[947]],[[120691,120691],\"mapped\",[948]],[[120692,120692],\"mapped\",[949]],[[120693,120693],\"mapped\",[950]],[[120694,120694],\"mapped\",[951]],[[120695,120695],\"mapped\",[952]],[[120696,120696],\"mapped\",[953]],[[120697,120697],\"mapped\",[954]],[[120698,120698],\"mapped\",[955]],[[120699,120699],\"mapped\",[956]],[[120700,120700],\"mapped\",[957]],[[120701,120701],\"mapped\",[958]],[[120702,120702],\"mapped\",[959]],[[120703,120703],\"mapped\",[960]],[[120704,120704],\"mapped\",[961]],[[120705,120706],\"mapped\",[963]],[[120707,120707],\"mapped\",[964]],[[120708,120708],\"mapped\",[965]],[[120709,120709],\"mapped\",[966]],[[120710,120710],\"mapped\",[967]],[[120711,120711],\"mapped\",[968]],[[120712,120712],\"mapped\",[969]],[[120713,120713],\"mapped\",[8706]],[[120714,120714],\"mapped\",[949]],[[120715,120715],\"mapped\",[952]],[[120716,120716],\"mapped\",[954]],[[120717,120717],\"mapped\",[966]],[[120718,120718],\"mapped\",[961]],[[120719,120719],\"mapped\",[960]],[[120720,120720],\"mapped\",[945]],[[120721,120721],\"mapped\",[946]],[[120722,120722],\"mapped\",[947]],[[120723,120723],\"mapped\",[948]],[[120724,120724],\"mapped\",[949]],[[120725,120725],\"mapped\",[950]],[[120726,120726],\"mapped\",[951]],[[120727,120727],\"mapped\",[952]],[[120728,120728],\"mapped\",[953]],[[120729,120729],\"mapped\",[954]],[[120730,120730],\"mapped\",[955]],[[120731,120731],\"mapped\",[956]],[[120732,120732],\"mapped\",[957]],[[120733,120733],\"mapped\",[958]],[[120734,120734],\"mapped\",[959]],[[120735,120735],\"mapped\",[960]],[[120736,120736],\"mapped\",[961]],[[120737,120737],\"mapped\",[952]],[[120738,120738],\"mapped\",[963]],[[120739,120739],\"mapped\",[964]],[[120740,120740],\"mapped\",[965]],[[120741,120741],\"mapped\",[966]],[[120742,120742],\"mapped\",[967]],[[120743,120743],\"mapped\",[968]],[[120744,120744],\"mapped\",[969]],[[120745,120745],\"mapped\",[8711]],[[120746,120746],\"mapped\",[945]],[[120747,120747],\"mapped\",[946]],[[120748,120748],\"mapped\",[947]],[[120749,120749],\"mapped\",[948]],[[120750,120750],\"mapped\",[949]],[[120751,120751],\"mapped\",[950]],[[120752,120752],\"mapped\",[951]],[[120753,120753],\"mapped\",[952]],[[120754,120754],\"mapped\",[953]],[[120755,120755],\"mapped\",[954]],[[120756,120756],\"mapped\",[955]],[[120757,120757],\"mapped\",[956]],[[120758,120758],\"mapped\",[957]],[[120759,120759],\"mapped\",[958]],[[120760,120760],\"mapped\",[959]],[[120761,120761],\"mapped\",[960]],[[120762,120762],\"mapped\",[961]],[[120763,120764],\"mapped\",[963]],[[120765,120765],\"mapped\",[964]],[[120766,120766],\"mapped\",[965]],[[120767,120767],\"mapped\",[966]],[[120768,120768],\"mapped\",[967]],[[120769,120769],\"mapped\",[968]],[[120770,120770],\"mapped\",[969]],[[120771,120771],\"mapped\",[8706]],[[120772,120772],\"mapped\",[949]],[[120773,120773],\"mapped\",[952]],[[120774,120774],\"mapped\",[954]],[[120775,120775],\"mapped\",[966]],[[120776,120776],\"mapped\",[961]],[[120777,120777],\"mapped\",[960]],[[120778,120779],\"mapped\",[989]],[[120780,120781],\"disallowed\"],[[120782,120782],\"mapped\",[48]],[[120783,120783],\"mapped\",[49]],[[120784,120784],\"mapped\",[50]],[[120785,120785],\"mapped\",[51]],[[120786,120786],\"mapped\",[52]],[[120787,120787],\"mapped\",[53]],[[120788,120788],\"mapped\",[54]],[[120789,120789],\"mapped\",[55]],[[120790,120790],\"mapped\",[56]],[[120791,120791],\"mapped\",[57]],[[120792,120792],\"mapped\",[48]],[[120793,120793],\"mapped\",[49]],[[120794,120794],\"mapped\",[50]],[[120795,120795],\"mapped\",[51]],[[120796,120796],\"mapped\",[52]],[[120797,120797],\"mapped\",[53]],[[120798,120798],\"mapped\",[54]],[[120799,120799],\"mapped\",[55]],[[120800,120800],\"mapped\",[56]],[[120801,120801],\"mapped\",[57]],[[120802,120802],\"mapped\",[48]],[[120803,120803],\"mapped\",[49]],[[120804,120804],\"mapped\",[50]],[[120805,120805],\"mapped\",[51]],[[120806,120806],\"mapped\",[52]],[[120807,120807],\"mapped\",[53]],[[120808,120808],\"mapped\",[54]],[[120809,120809],\"mapped\",[55]],[[120810,120810],\"mapped\",[56]],[[120811,120811],\"mapped\",[57]],[[120812,120812],\"mapped\",[48]],[[120813,120813],\"mapped\",[49]],[[120814,120814],\"mapped\",[50]],[[120815,120815],\"mapped\",[51]],[[120816,120816],\"mapped\",[52]],[[120817,120817],\"mapped\",[53]],[[120818,120818],\"mapped\",[54]],[[120819,120819],\"mapped\",[55]],[[120820,120820],\"mapped\",[56]],[[120821,120821],\"mapped\",[57]],[[120822,120822],\"mapped\",[48]],[[120823,120823],\"mapped\",[49]],[[120824,120824],\"mapped\",[50]],[[120825,120825],\"mapped\",[51]],[[120826,120826],\"mapped\",[52]],[[120827,120827],\"mapped\",[53]],[[120828,120828],\"mapped\",[54]],[[120829,120829],\"mapped\",[55]],[[120830,120830],\"mapped\",[56]],[[120831,120831],\"mapped\",[57]],[[120832,121343],\"valid\",[],\"NV8\"],[[121344,121398],\"valid\"],[[121399,121402],\"valid\",[],\"NV8\"],[[121403,121452],\"valid\"],[[121453,121460],\"valid\",[],\"NV8\"],[[121461,121461],\"valid\"],[[121462,121475],\"valid\",[],\"NV8\"],[[121476,121476],\"valid\"],[[121477,121483],\"valid\",[],\"NV8\"],[[121484,121498],\"disallowed\"],[[121499,121503],\"valid\"],[[121504,121504],\"disallowed\"],[[121505,121519],\"valid\"],[[121520,124927],\"disallowed\"],[[124928,125124],\"valid\"],[[125125,125126],\"disallowed\"],[[125127,125135],\"valid\",[],\"NV8\"],[[125136,125142],\"valid\"],[[125143,126463],\"disallowed\"],[[126464,126464],\"mapped\",[1575]],[[126465,126465],\"mapped\",[1576]],[[126466,126466],\"mapped\",[1580]],[[126467,126467],\"mapped\",[1583]],[[126468,126468],\"disallowed\"],[[126469,126469],\"mapped\",[1608]],[[126470,126470],\"mapped\",[1586]],[[126471,126471],\"mapped\",[1581]],[[126472,126472],\"mapped\",[1591]],[[126473,126473],\"mapped\",[1610]],[[126474,126474],\"mapped\",[1603]],[[126475,126475],\"mapped\",[1604]],[[126476,126476],\"mapped\",[1605]],[[126477,126477],\"mapped\",[1606]],[[126478,126478],\"mapped\",[1587]],[[126479,126479],\"mapped\",[1593]],[[126480,126480],\"mapped\",[1601]],[[126481,126481],\"mapped\",[1589]],[[126482,126482],\"mapped\",[1602]],[[126483,126483],\"mapped\",[1585]],[[126484,126484],\"mapped\",[1588]],[[126485,126485],\"mapped\",[1578]],[[126486,126486],\"mapped\",[1579]],[[126487,126487],\"mapped\",[1582]],[[126488,126488],\"mapped\",[1584]],[[126489,126489],\"mapped\",[1590]],[[126490,126490],\"mapped\",[1592]],[[126491,126491],\"mapped\",[1594]],[[126492,126492],\"mapped\",[1646]],[[126493,126493],\"mapped\",[1722]],[[126494,126494],\"mapped\",[1697]],[[126495,126495],\"mapped\",[1647]],[[126496,126496],\"disallowed\"],[[126497,126497],\"mapped\",[1576]],[[126498,126498],\"mapped\",[1580]],[[126499,126499],\"disallowed\"],[[126500,126500],\"mapped\",[1607]],[[126501,126502],\"disallowed\"],[[126503,126503],\"mapped\",[1581]],[[126504,126504],\"disallowed\"],[[126505,126505],\"mapped\",[1610]],[[126506,126506],\"mapped\",[1603]],[[126507,126507],\"mapped\",[1604]],[[126508,126508],\"mapped\",[1605]],[[126509,126509],\"mapped\",[1606]],[[126510,126510],\"mapped\",[1587]],[[126511,126511],\"mapped\",[1593]],[[126512,126512],\"mapped\",[1601]],[[126513,126513],\"mapped\",[1589]],[[126514,126514],\"mapped\",[1602]],[[126515,126515],\"disallowed\"],[[126516,126516],\"mapped\",[1588]],[[126517,126517],\"mapped\",[1578]],[[126518,126518],\"mapped\",[1579]],[[126519,126519],\"mapped\",[1582]],[[126520,126520],\"disallowed\"],[[126521,126521],\"mapped\",[1590]],[[126522,126522],\"disallowed\"],[[126523,126523],\"mapped\",[1594]],[[126524,126529],\"disallowed\"],[[126530,126530],\"mapped\",[1580]],[[126531,126534],\"disallowed\"],[[126535,126535],\"mapped\",[1581]],[[126536,126536],\"disallowed\"],[[126537,126537],\"mapped\",[1610]],[[126538,126538],\"disallowed\"],[[126539,126539],\"mapped\",[1604]],[[126540,126540],\"disallowed\"],[[126541,126541],\"mapped\",[1606]],[[126542,126542],\"mapped\",[1587]],[[126543,126543],\"mapped\",[1593]],[[126544,126544],\"disallowed\"],[[126545,126545],\"mapped\",[1589]],[[126546,126546],\"mapped\",[1602]],[[126547,126547],\"disallowed\"],[[126548,126548],\"mapped\",[1588]],[[126549,126550],\"disallowed\"],[[126551,126551],\"mapped\",[1582]],[[126552,126552],\"disallowed\"],[[126553,126553],\"mapped\",[1590]],[[126554,126554],\"disallowed\"],[[126555,126555],\"mapped\",[1594]],[[126556,126556],\"disallowed\"],[[126557,126557],\"mapped\",[1722]],[[126558,126558],\"disallowed\"],[[126559,126559],\"mapped\",[1647]],[[126560,126560],\"disallowed\"],[[126561,126561],\"mapped\",[1576]],[[126562,126562],\"mapped\",[1580]],[[126563,126563],\"disallowed\"],[[126564,126564],\"mapped\",[1607]],[[126565,126566],\"disallowed\"],[[126567,126567],\"mapped\",[1581]],[[126568,126568],\"mapped\",[1591]],[[126569,126569],\"mapped\",[1610]],[[126570,126570],\"mapped\",[1603]],[[126571,126571],\"disallowed\"],[[126572,126572],\"mapped\",[1605]],[[126573,126573],\"mapped\",[1606]],[[126574,126574],\"mapped\",[1587]],[[126575,126575],\"mapped\",[1593]],[[126576,126576],\"mapped\",[1601]],[[126577,126577],\"mapped\",[1589]],[[126578,126578],\"mapped\",[1602]],[[126579,126579],\"disallowed\"],[[126580,126580],\"mapped\",[1588]],[[126581,126581],\"mapped\",[1578]],[[126582,126582],\"mapped\",[1579]],[[126583,126583],\"mapped\",[1582]],[[126584,126584],\"disallowed\"],[[126585,126585],\"mapped\",[1590]],[[126586,126586],\"mapped\",[1592]],[[126587,126587],\"mapped\",[1594]],[[126588,126588],\"mapped\",[1646]],[[126589,126589],\"disallowed\"],[[126590,126590],\"mapped\",[1697]],[[126591,126591],\"disallowed\"],[[126592,126592],\"mapped\",[1575]],[[126593,126593],\"mapped\",[1576]],[[126594,126594],\"mapped\",[1580]],[[126595,126595],\"mapped\",[1583]],[[126596,126596],\"mapped\",[1607]],[[126597,126597],\"mapped\",[1608]],[[126598,126598],\"mapped\",[1586]],[[126599,126599],\"mapped\",[1581]],[[126600,126600],\"mapped\",[1591]],[[126601,126601],\"mapped\",[1610]],[[126602,126602],\"disallowed\"],[[126603,126603],\"mapped\",[1604]],[[126604,126604],\"mapped\",[1605]],[[126605,126605],\"mapped\",[1606]],[[126606,126606],\"mapped\",[1587]],[[126607,126607],\"mapped\",[1593]],[[126608,126608],\"mapped\",[1601]],[[126609,126609],\"mapped\",[1589]],[[126610,126610],\"mapped\",[1602]],[[126611,126611],\"mapped\",[1585]],[[126612,126612],\"mapped\",[1588]],[[126613,126613],\"mapped\",[1578]],[[126614,126614],\"mapped\",[1579]],[[126615,126615],\"mapped\",[1582]],[[126616,126616],\"mapped\",[1584]],[[126617,126617],\"mapped\",[1590]],[[126618,126618],\"mapped\",[1592]],[[126619,126619],\"mapped\",[1594]],[[126620,126624],\"disallowed\"],[[126625,126625],\"mapped\",[1576]],[[126626,126626],\"mapped\",[1580]],[[126627,126627],\"mapped\",[1583]],[[126628,126628],\"disallowed\"],[[126629,126629],\"mapped\",[1608]],[[126630,126630],\"mapped\",[1586]],[[126631,126631],\"mapped\",[1581]],[[126632,126632],\"mapped\",[1591]],[[126633,126633],\"mapped\",[1610]],[[126634,126634],\"disallowed\"],[[126635,126635],\"mapped\",[1604]],[[126636,126636],\"mapped\",[1605]],[[126637,126637],\"mapped\",[1606]],[[126638,126638],\"mapped\",[1587]],[[126639,126639],\"mapped\",[1593]],[[126640,126640],\"mapped\",[1601]],[[126641,126641],\"mapped\",[1589]],[[126642,126642],\"mapped\",[1602]],[[126643,126643],\"mapped\",[1585]],[[126644,126644],\"mapped\",[1588]],[[126645,126645],\"mapped\",[1578]],[[126646,126646],\"mapped\",[1579]],[[126647,126647],\"mapped\",[1582]],[[126648,126648],\"mapped\",[1584]],[[126649,126649],\"mapped\",[1590]],[[126650,126650],\"mapped\",[1592]],[[126651,126651],\"mapped\",[1594]],[[126652,126703],\"disallowed\"],[[126704,126705],\"valid\",[],\"NV8\"],[[126706,126975],\"disallowed\"],[[126976,127019],\"valid\",[],\"NV8\"],[[127020,127023],\"disallowed\"],[[127024,127123],\"valid\",[],\"NV8\"],[[127124,127135],\"disallowed\"],[[127136,127150],\"valid\",[],\"NV8\"],[[127151,127152],\"disallowed\"],[[127153,127166],\"valid\",[],\"NV8\"],[[127167,127167],\"valid\",[],\"NV8\"],[[127168,127168],\"disallowed\"],[[127169,127183],\"valid\",[],\"NV8\"],[[127184,127184],\"disallowed\"],[[127185,127199],\"valid\",[],\"NV8\"],[[127200,127221],\"valid\",[],\"NV8\"],[[127222,127231],\"disallowed\"],[[127232,127232],\"disallowed\"],[[127233,127233],\"disallowed_STD3_mapped\",[48,44]],[[127234,127234],\"disallowed_STD3_mapped\",[49,44]],[[127235,127235],\"disallowed_STD3_mapped\",[50,44]],[[127236,127236],\"disallowed_STD3_mapped\",[51,44]],[[127237,127237],\"disallowed_STD3_mapped\",[52,44]],[[127238,127238],\"disallowed_STD3_mapped\",[53,44]],[[127239,127239],\"disallowed_STD3_mapped\",[54,44]],[[127240,127240],\"disallowed_STD3_mapped\",[55,44]],[[127241,127241],\"disallowed_STD3_mapped\",[56,44]],[[127242,127242],\"disallowed_STD3_mapped\",[57,44]],[[127243,127244],\"valid\",[],\"NV8\"],[[127245,127247],\"disallowed\"],[[127248,127248],\"disallowed_STD3_mapped\",[40,97,41]],[[127249,127249],\"disallowed_STD3_mapped\",[40,98,41]],[[127250,127250],\"disallowed_STD3_mapped\",[40,99,41]],[[127251,127251],\"disallowed_STD3_mapped\",[40,100,41]],[[127252,127252],\"disallowed_STD3_mapped\",[40,101,41]],[[127253,127253],\"disallowed_STD3_mapped\",[40,102,41]],[[127254,127254],\"disallowed_STD3_mapped\",[40,103,41]],[[127255,127255],\"disallowed_STD3_mapped\",[40,104,41]],[[127256,127256],\"disallowed_STD3_mapped\",[40,105,41]],[[127257,127257],\"disallowed_STD3_mapped\",[40,106,41]],[[127258,127258],\"disallowed_STD3_mapped\",[40,107,41]],[[127259,127259],\"disallowed_STD3_mapped\",[40,108,41]],[[127260,127260],\"disallowed_STD3_mapped\",[40,109,41]],[[127261,127261],\"disallowed_STD3_mapped\",[40,110,41]],[[127262,127262],\"disallowed_STD3_mapped\",[40,111,41]],[[127263,127263],\"disallowed_STD3_mapped\",[40,112,41]],[[127264,127264],\"disallowed_STD3_mapped\",[40,113,41]],[[127265,127265],\"disallowed_STD3_mapped\",[40,114,41]],[[127266,127266],\"disallowed_STD3_mapped\",[40,115,41]],[[127267,127267],\"disallowed_STD3_mapped\",[40,116,41]],[[127268,127268],\"disallowed_STD3_mapped\",[40,117,41]],[[127269,127269],\"disallowed_STD3_mapped\",[40,118,41]],[[127270,127270],\"disallowed_STD3_mapped\",[40,119,41]],[[127271,127271],\"disallowed_STD3_mapped\",[40,120,41]],[[127272,127272],\"disallowed_STD3_mapped\",[40,121,41]],[[127273,127273],\"disallowed_STD3_mapped\",[40,122,41]],[[127274,127274],\"mapped\",[12308,115,12309]],[[127275,127275],\"mapped\",[99]],[[127276,127276],\"mapped\",[114]],[[127277,127277],\"mapped\",[99,100]],[[127278,127278],\"mapped\",[119,122]],[[127279,127279],\"disallowed\"],[[127280,127280],\"mapped\",[97]],[[127281,127281],\"mapped\",[98]],[[127282,127282],\"mapped\",[99]],[[127283,127283],\"mapped\",[100]],[[127284,127284],\"mapped\",[101]],[[127285,127285],\"mapped\",[102]],[[127286,127286],\"mapped\",[103]],[[127287,127287],\"mapped\",[104]],[[127288,127288],\"mapped\",[105]],[[127289,127289],\"mapped\",[106]],[[127290,127290],\"mapped\",[107]],[[127291,127291],\"mapped\",[108]],[[127292,127292],\"mapped\",[109]],[[127293,127293],\"mapped\",[110]],[[127294,127294],\"mapped\",[111]],[[127295,127295],\"mapped\",[112]],[[127296,127296],\"mapped\",[113]],[[127297,127297],\"mapped\",[114]],[[127298,127298],\"mapped\",[115]],[[127299,127299],\"mapped\",[116]],[[127300,127300],\"mapped\",[117]],[[127301,127301],\"mapped\",[118]],[[127302,127302],\"mapped\",[119]],[[127303,127303],\"mapped\",[120]],[[127304,127304],\"mapped\",[121]],[[127305,127305],\"mapped\",[122]],[[127306,127306],\"mapped\",[104,118]],[[127307,127307],\"mapped\",[109,118]],[[127308,127308],\"mapped\",[115,100]],[[127309,127309],\"mapped\",[115,115]],[[127310,127310],\"mapped\",[112,112,118]],[[127311,127311],\"mapped\",[119,99]],[[127312,127318],\"valid\",[],\"NV8\"],[[127319,127319],\"valid\",[],\"NV8\"],[[127320,127326],\"valid\",[],\"NV8\"],[[127327,127327],\"valid\",[],\"NV8\"],[[127328,127337],\"valid\",[],\"NV8\"],[[127338,127338],\"mapped\",[109,99]],[[127339,127339],\"mapped\",[109,100]],[[127340,127343],\"disallowed\"],[[127344,127352],\"valid\",[],\"NV8\"],[[127353,127353],\"valid\",[],\"NV8\"],[[127354,127354],\"valid\",[],\"NV8\"],[[127355,127356],\"valid\",[],\"NV8\"],[[127357,127358],\"valid\",[],\"NV8\"],[[127359,127359],\"valid\",[],\"NV8\"],[[127360,127369],\"valid\",[],\"NV8\"],[[127370,127373],\"valid\",[],\"NV8\"],[[127374,127375],\"valid\",[],\"NV8\"],[[127376,127376],\"mapped\",[100,106]],[[127377,127386],\"valid\",[],\"NV8\"],[[127387,127461],\"disallowed\"],[[127462,127487],\"valid\",[],\"NV8\"],[[127488,127488],\"mapped\",[12411,12363]],[[127489,127489],\"mapped\",[12467,12467]],[[127490,127490],\"mapped\",[12469]],[[127491,127503],\"disallowed\"],[[127504,127504],\"mapped\",[25163]],[[127505,127505],\"mapped\",[23383]],[[127506,127506],\"mapped\",[21452]],[[127507,127507],\"mapped\",[12487]],[[127508,127508],\"mapped\",[20108]],[[127509,127509],\"mapped\",[22810]],[[127510,127510],\"mapped\",[35299]],[[127511,127511],\"mapped\",[22825]],[[127512,127512],\"mapped\",[20132]],[[127513,127513],\"mapped\",[26144]],[[127514,127514],\"mapped\",[28961]],[[127515,127515],\"mapped\",[26009]],[[127516,127516],\"mapped\",[21069]],[[127517,127517],\"mapped\",[24460]],[[127518,127518],\"mapped\",[20877]],[[127519,127519],\"mapped\",[26032]],[[127520,127520],\"mapped\",[21021]],[[127521,127521],\"mapped\",[32066]],[[127522,127522],\"mapped\",[29983]],[[127523,127523],\"mapped\",[36009]],[[127524,127524],\"mapped\",[22768]],[[127525,127525],\"mapped\",[21561]],[[127526,127526],\"mapped\",[28436]],[[127527,127527],\"mapped\",[25237]],[[127528,127528],\"mapped\",[25429]],[[127529,127529],\"mapped\",[19968]],[[127530,127530],\"mapped\",[19977]],[[127531,127531],\"mapped\",[36938]],[[127532,127532],\"mapped\",[24038]],[[127533,127533],\"mapped\",[20013]],[[127534,127534],\"mapped\",[21491]],[[127535,127535],\"mapped\",[25351]],[[127536,127536],\"mapped\",[36208]],[[127537,127537],\"mapped\",[25171]],[[127538,127538],\"mapped\",[31105]],[[127539,127539],\"mapped\",[31354]],[[127540,127540],\"mapped\",[21512]],[[127541,127541],\"mapped\",[28288]],[[127542,127542],\"mapped\",[26377]],[[127543,127543],\"mapped\",[26376]],[[127544,127544],\"mapped\",[30003]],[[127545,127545],\"mapped\",[21106]],[[127546,127546],\"mapped\",[21942]],[[127547,127551],\"disallowed\"],[[127552,127552],\"mapped\",[12308,26412,12309]],[[127553,127553],\"mapped\",[12308,19977,12309]],[[127554,127554],\"mapped\",[12308,20108,12309]],[[127555,127555],\"mapped\",[12308,23433,12309]],[[127556,127556],\"mapped\",[12308,28857,12309]],[[127557,127557],\"mapped\",[12308,25171,12309]],[[127558,127558],\"mapped\",[12308,30423,12309]],[[127559,127559],\"mapped\",[12308,21213,12309]],[[127560,127560],\"mapped\",[12308,25943,12309]],[[127561,127567],\"disallowed\"],[[127568,127568],\"mapped\",[24471]],[[127569,127569],\"mapped\",[21487]],[[127570,127743],\"disallowed\"],[[127744,127776],\"valid\",[],\"NV8\"],[[127777,127788],\"valid\",[],\"NV8\"],[[127789,127791],\"valid\",[],\"NV8\"],[[127792,127797],\"valid\",[],\"NV8\"],[[127798,127798],\"valid\",[],\"NV8\"],[[127799,127868],\"valid\",[],\"NV8\"],[[127869,127869],\"valid\",[],\"NV8\"],[[127870,127871],\"valid\",[],\"NV8\"],[[127872,127891],\"valid\",[],\"NV8\"],[[127892,127903],\"valid\",[],\"NV8\"],[[127904,127940],\"valid\",[],\"NV8\"],[[127941,127941],\"valid\",[],\"NV8\"],[[127942,127946],\"valid\",[],\"NV8\"],[[127947,127950],\"valid\",[],\"NV8\"],[[127951,127955],\"valid\",[],\"NV8\"],[[127956,127967],\"valid\",[],\"NV8\"],[[127968,127984],\"valid\",[],\"NV8\"],[[127985,127991],\"valid\",[],\"NV8\"],[[127992,127999],\"valid\",[],\"NV8\"],[[128000,128062],\"valid\",[],\"NV8\"],[[128063,128063],\"valid\",[],\"NV8\"],[[128064,128064],\"valid\",[],\"NV8\"],[[128065,128065],\"valid\",[],\"NV8\"],[[128066,128247],\"valid\",[],\"NV8\"],[[128248,128248],\"valid\",[],\"NV8\"],[[128249,128252],\"valid\",[],\"NV8\"],[[128253,128254],\"valid\",[],\"NV8\"],[[128255,128255],\"valid\",[],\"NV8\"],[[128256,128317],\"valid\",[],\"NV8\"],[[128318,128319],\"valid\",[],\"NV8\"],[[128320,128323],\"valid\",[],\"NV8\"],[[128324,128330],\"valid\",[],\"NV8\"],[[128331,128335],\"valid\",[],\"NV8\"],[[128336,128359],\"valid\",[],\"NV8\"],[[128360,128377],\"valid\",[],\"NV8\"],[[128378,128378],\"disallowed\"],[[128379,128419],\"valid\",[],\"NV8\"],[[128420,128420],\"disallowed\"],[[128421,128506],\"valid\",[],\"NV8\"],[[128507,128511],\"valid\",[],\"NV8\"],[[128512,128512],\"valid\",[],\"NV8\"],[[128513,128528],\"valid\",[],\"NV8\"],[[128529,128529],\"valid\",[],\"NV8\"],[[128530,128532],\"valid\",[],\"NV8\"],[[128533,128533],\"valid\",[],\"NV8\"],[[128534,128534],\"valid\",[],\"NV8\"],[[128535,128535],\"valid\",[],\"NV8\"],[[128536,128536],\"valid\",[],\"NV8\"],[[128537,128537],\"valid\",[],\"NV8\"],[[128538,128538],\"valid\",[],\"NV8\"],[[128539,128539],\"valid\",[],\"NV8\"],[[128540,128542],\"valid\",[],\"NV8\"],[[128543,128543],\"valid\",[],\"NV8\"],[[128544,128549],\"valid\",[],\"NV8\"],[[128550,128551],\"valid\",[],\"NV8\"],[[128552,128555],\"valid\",[],\"NV8\"],[[128556,128556],\"valid\",[],\"NV8\"],[[128557,128557],\"valid\",[],\"NV8\"],[[128558,128559],\"valid\",[],\"NV8\"],[[128560,128563],\"valid\",[],\"NV8\"],[[128564,128564],\"valid\",[],\"NV8\"],[[128565,128576],\"valid\",[],\"NV8\"],[[128577,128578],\"valid\",[],\"NV8\"],[[128579,128580],\"valid\",[],\"NV8\"],[[128581,128591],\"valid\",[],\"NV8\"],[[128592,128639],\"valid\",[],\"NV8\"],[[128640,128709],\"valid\",[],\"NV8\"],[[128710,128719],\"valid\",[],\"NV8\"],[[128720,128720],\"valid\",[],\"NV8\"],[[128721,128735],\"disallowed\"],[[128736,128748],\"valid\",[],\"NV8\"],[[128749,128751],\"disallowed\"],[[128752,128755],\"valid\",[],\"NV8\"],[[128756,128767],\"disallowed\"],[[128768,128883],\"valid\",[],\"NV8\"],[[128884,128895],\"disallowed\"],[[128896,128980],\"valid\",[],\"NV8\"],[[128981,129023],\"disallowed\"],[[129024,129035],\"valid\",[],\"NV8\"],[[129036,129039],\"disallowed\"],[[129040,129095],\"valid\",[],\"NV8\"],[[129096,129103],\"disallowed\"],[[129104,129113],\"valid\",[],\"NV8\"],[[129114,129119],\"disallowed\"],[[129120,129159],\"valid\",[],\"NV8\"],[[129160,129167],\"disallowed\"],[[129168,129197],\"valid\",[],\"NV8\"],[[129198,129295],\"disallowed\"],[[129296,129304],\"valid\",[],\"NV8\"],[[129305,129407],\"disallowed\"],[[129408,129412],\"valid\",[],\"NV8\"],[[129413,129471],\"disallowed\"],[[129472,129472],\"valid\",[],\"NV8\"],[[129473,131069],\"disallowed\"],[[131070,131071],\"disallowed\"],[[131072,173782],\"valid\"],[[173783,173823],\"disallowed\"],[[173824,177972],\"valid\"],[[177973,177983],\"disallowed\"],[[177984,178205],\"valid\"],[[178206,178207],\"disallowed\"],[[178208,183969],\"valid\"],[[183970,194559],\"disallowed\"],[[194560,194560],\"mapped\",[20029]],[[194561,194561],\"mapped\",[20024]],[[194562,194562],\"mapped\",[20033]],[[194563,194563],\"mapped\",[131362]],[[194564,194564],\"mapped\",[20320]],[[194565,194565],\"mapped\",[20398]],[[194566,194566],\"mapped\",[20411]],[[194567,194567],\"mapped\",[20482]],[[194568,194568],\"mapped\",[20602]],[[194569,194569],\"mapped\",[20633]],[[194570,194570],\"mapped\",[20711]],[[194571,194571],\"mapped\",[20687]],[[194572,194572],\"mapped\",[13470]],[[194573,194573],\"mapped\",[132666]],[[194574,194574],\"mapped\",[20813]],[[194575,194575],\"mapped\",[20820]],[[194576,194576],\"mapped\",[20836]],[[194577,194577],\"mapped\",[20855]],[[194578,194578],\"mapped\",[132380]],[[194579,194579],\"mapped\",[13497]],[[194580,194580],\"mapped\",[20839]],[[194581,194581],\"mapped\",[20877]],[[194582,194582],\"mapped\",[132427]],[[194583,194583],\"mapped\",[20887]],[[194584,194584],\"mapped\",[20900]],[[194585,194585],\"mapped\",[20172]],[[194586,194586],\"mapped\",[20908]],[[194587,194587],\"mapped\",[20917]],[[194588,194588],\"mapped\",[168415]],[[194589,194589],\"mapped\",[20981]],[[194590,194590],\"mapped\",[20995]],[[194591,194591],\"mapped\",[13535]],[[194592,194592],\"mapped\",[21051]],[[194593,194593],\"mapped\",[21062]],[[194594,194594],\"mapped\",[21106]],[[194595,194595],\"mapped\",[21111]],[[194596,194596],\"mapped\",[13589]],[[194597,194597],\"mapped\",[21191]],[[194598,194598],\"mapped\",[21193]],[[194599,194599],\"mapped\",[21220]],[[194600,194600],\"mapped\",[21242]],[[194601,194601],\"mapped\",[21253]],[[194602,194602],\"mapped\",[21254]],[[194603,194603],\"mapped\",[21271]],[[194604,194604],\"mapped\",[21321]],[[194605,194605],\"mapped\",[21329]],[[194606,194606],\"mapped\",[21338]],[[194607,194607],\"mapped\",[21363]],[[194608,194608],\"mapped\",[21373]],[[194609,194611],\"mapped\",[21375]],[[194612,194612],\"mapped\",[133676]],[[194613,194613],\"mapped\",[28784]],[[194614,194614],\"mapped\",[21450]],[[194615,194615],\"mapped\",[21471]],[[194616,194616],\"mapped\",[133987]],[[194617,194617],\"mapped\",[21483]],[[194618,194618],\"mapped\",[21489]],[[194619,194619],\"mapped\",[21510]],[[194620,194620],\"mapped\",[21662]],[[194621,194621],\"mapped\",[21560]],[[194622,194622],\"mapped\",[21576]],[[194623,194623],\"mapped\",[21608]],[[194624,194624],\"mapped\",[21666]],[[194625,194625],\"mapped\",[21750]],[[194626,194626],\"mapped\",[21776]],[[194627,194627],\"mapped\",[21843]],[[194628,194628],\"mapped\",[21859]],[[194629,194630],\"mapped\",[21892]],[[194631,194631],\"mapped\",[21913]],[[194632,194632],\"mapped\",[21931]],[[194633,194633],\"mapped\",[21939]],[[194634,194634],\"mapped\",[21954]],[[194635,194635],\"mapped\",[22294]],[[194636,194636],\"mapped\",[22022]],[[194637,194637],\"mapped\",[22295]],[[194638,194638],\"mapped\",[22097]],[[194639,194639],\"mapped\",[22132]],[[194640,194640],\"mapped\",[20999]],[[194641,194641],\"mapped\",[22766]],[[194642,194642],\"mapped\",[22478]],[[194643,194643],\"mapped\",[22516]],[[194644,194644],\"mapped\",[22541]],[[194645,194645],\"mapped\",[22411]],[[194646,194646],\"mapped\",[22578]],[[194647,194647],\"mapped\",[22577]],[[194648,194648],\"mapped\",[22700]],[[194649,194649],\"mapped\",[136420]],[[194650,194650],\"mapped\",[22770]],[[194651,194651],\"mapped\",[22775]],[[194652,194652],\"mapped\",[22790]],[[194653,194653],\"mapped\",[22810]],[[194654,194654],\"mapped\",[22818]],[[194655,194655],\"mapped\",[22882]],[[194656,194656],\"mapped\",[136872]],[[194657,194657],\"mapped\",[136938]],[[194658,194658],\"mapped\",[23020]],[[194659,194659],\"mapped\",[23067]],[[194660,194660],\"mapped\",[23079]],[[194661,194661],\"mapped\",[23000]],[[194662,194662],\"mapped\",[23142]],[[194663,194663],\"mapped\",[14062]],[[194664,194664],\"disallowed\"],[[194665,194665],\"mapped\",[23304]],[[194666,194667],\"mapped\",[23358]],[[194668,194668],\"mapped\",[137672]],[[194669,194669],\"mapped\",[23491]],[[194670,194670],\"mapped\",[23512]],[[194671,194671],\"mapped\",[23527]],[[194672,194672],\"mapped\",[23539]],[[194673,194673],\"mapped\",[138008]],[[194674,194674],\"mapped\",[23551]],[[194675,194675],\"mapped\",[23558]],[[194676,194676],\"disallowed\"],[[194677,194677],\"mapped\",[23586]],[[194678,194678],\"mapped\",[14209]],[[194679,194679],\"mapped\",[23648]],[[194680,194680],\"mapped\",[23662]],[[194681,194681],\"mapped\",[23744]],[[194682,194682],\"mapped\",[23693]],[[194683,194683],\"mapped\",[138724]],[[194684,194684],\"mapped\",[23875]],[[194685,194685],\"mapped\",[138726]],[[194686,194686],\"mapped\",[23918]],[[194687,194687],\"mapped\",[23915]],[[194688,194688],\"mapped\",[23932]],[[194689,194689],\"mapped\",[24033]],[[194690,194690],\"mapped\",[24034]],[[194691,194691],\"mapped\",[14383]],[[194692,194692],\"mapped\",[24061]],[[194693,194693],\"mapped\",[24104]],[[194694,194694],\"mapped\",[24125]],[[194695,194695],\"mapped\",[24169]],[[194696,194696],\"mapped\",[14434]],[[194697,194697],\"mapped\",[139651]],[[194698,194698],\"mapped\",[14460]],[[194699,194699],\"mapped\",[24240]],[[194700,194700],\"mapped\",[24243]],[[194701,194701],\"mapped\",[24246]],[[194702,194702],\"mapped\",[24266]],[[194703,194703],\"mapped\",[172946]],[[194704,194704],\"mapped\",[24318]],[[194705,194706],\"mapped\",[140081]],[[194707,194707],\"mapped\",[33281]],[[194708,194709],\"mapped\",[24354]],[[194710,194710],\"mapped\",[14535]],[[194711,194711],\"mapped\",[144056]],[[194712,194712],\"mapped\",[156122]],[[194713,194713],\"mapped\",[24418]],[[194714,194714],\"mapped\",[24427]],[[194715,194715],\"mapped\",[14563]],[[194716,194716],\"mapped\",[24474]],[[194717,194717],\"mapped\",[24525]],[[194718,194718],\"mapped\",[24535]],[[194719,194719],\"mapped\",[24569]],[[194720,194720],\"mapped\",[24705]],[[194721,194721],\"mapped\",[14650]],[[194722,194722],\"mapped\",[14620]],[[194723,194723],\"mapped\",[24724]],[[194724,194724],\"mapped\",[141012]],[[194725,194725],\"mapped\",[24775]],[[194726,194726],\"mapped\",[24904]],[[194727,194727],\"mapped\",[24908]],[[194728,194728],\"mapped\",[24910]],[[194729,194729],\"mapped\",[24908]],[[194730,194730],\"mapped\",[24954]],[[194731,194731],\"mapped\",[24974]],[[194732,194732],\"mapped\",[25010]],[[194733,194733],\"mapped\",[24996]],[[194734,194734],\"mapped\",[25007]],[[194735,194735],\"mapped\",[25054]],[[194736,194736],\"mapped\",[25074]],[[194737,194737],\"mapped\",[25078]],[[194738,194738],\"mapped\",[25104]],[[194739,194739],\"mapped\",[25115]],[[194740,194740],\"mapped\",[25181]],[[194741,194741],\"mapped\",[25265]],[[194742,194742],\"mapped\",[25300]],[[194743,194743],\"mapped\",[25424]],[[194744,194744],\"mapped\",[142092]],[[194745,194745],\"mapped\",[25405]],[[194746,194746],\"mapped\",[25340]],[[194747,194747],\"mapped\",[25448]],[[194748,194748],\"mapped\",[25475]],[[194749,194749],\"mapped\",[25572]],[[194750,194750],\"mapped\",[142321]],[[194751,194751],\"mapped\",[25634]],[[194752,194752],\"mapped\",[25541]],[[194753,194753],\"mapped\",[25513]],[[194754,194754],\"mapped\",[14894]],[[194755,194755],\"mapped\",[25705]],[[194756,194756],\"mapped\",[25726]],[[194757,194757],\"mapped\",[25757]],[[194758,194758],\"mapped\",[25719]],[[194759,194759],\"mapped\",[14956]],[[194760,194760],\"mapped\",[25935]],[[194761,194761],\"mapped\",[25964]],[[194762,194762],\"mapped\",[143370]],[[194763,194763],\"mapped\",[26083]],[[194764,194764],\"mapped\",[26360]],[[194765,194765],\"mapped\",[26185]],[[194766,194766],\"mapped\",[15129]],[[194767,194767],\"mapped\",[26257]],[[194768,194768],\"mapped\",[15112]],[[194769,194769],\"mapped\",[15076]],[[194770,194770],\"mapped\",[20882]],[[194771,194771],\"mapped\",[20885]],[[194772,194772],\"mapped\",[26368]],[[194773,194773],\"mapped\",[26268]],[[194774,194774],\"mapped\",[32941]],[[194775,194775],\"mapped\",[17369]],[[194776,194776],\"mapped\",[26391]],[[194777,194777],\"mapped\",[26395]],[[194778,194778],\"mapped\",[26401]],[[194779,194779],\"mapped\",[26462]],[[194780,194780],\"mapped\",[26451]],[[194781,194781],\"mapped\",[144323]],[[194782,194782],\"mapped\",[15177]],[[194783,194783],\"mapped\",[26618]],[[194784,194784],\"mapped\",[26501]],[[194785,194785],\"mapped\",[26706]],[[194786,194786],\"mapped\",[26757]],[[194787,194787],\"mapped\",[144493]],[[194788,194788],\"mapped\",[26766]],[[194789,194789],\"mapped\",[26655]],[[194790,194790],\"mapped\",[26900]],[[194791,194791],\"mapped\",[15261]],[[194792,194792],\"mapped\",[26946]],[[194793,194793],\"mapped\",[27043]],[[194794,194794],\"mapped\",[27114]],[[194795,194795],\"mapped\",[27304]],[[194796,194796],\"mapped\",[145059]],[[194797,194797],\"mapped\",[27355]],[[194798,194798],\"mapped\",[15384]],[[194799,194799],\"mapped\",[27425]],[[194800,194800],\"mapped\",[145575]],[[194801,194801],\"mapped\",[27476]],[[194802,194802],\"mapped\",[15438]],[[194803,194803],\"mapped\",[27506]],[[194804,194804],\"mapped\",[27551]],[[194805,194805],\"mapped\",[27578]],[[194806,194806],\"mapped\",[27579]],[[194807,194807],\"mapped\",[146061]],[[194808,194808],\"mapped\",[138507]],[[194809,194809],\"mapped\",[146170]],[[194810,194810],\"mapped\",[27726]],[[194811,194811],\"mapped\",[146620]],[[194812,194812],\"mapped\",[27839]],[[194813,194813],\"mapped\",[27853]],[[194814,194814],\"mapped\",[27751]],[[194815,194815],\"mapped\",[27926]],[[194816,194816],\"mapped\",[27966]],[[194817,194817],\"mapped\",[28023]],[[194818,194818],\"mapped\",[27969]],[[194819,194819],\"mapped\",[28009]],[[194820,194820],\"mapped\",[28024]],[[194821,194821],\"mapped\",[28037]],[[194822,194822],\"mapped\",[146718]],[[194823,194823],\"mapped\",[27956]],[[194824,194824],\"mapped\",[28207]],[[194825,194825],\"mapped\",[28270]],[[194826,194826],\"mapped\",[15667]],[[194827,194827],\"mapped\",[28363]],[[194828,194828],\"mapped\",[28359]],[[194829,194829],\"mapped\",[147153]],[[194830,194830],\"mapped\",[28153]],[[194831,194831],\"mapped\",[28526]],[[194832,194832],\"mapped\",[147294]],[[194833,194833],\"mapped\",[147342]],[[194834,194834],\"mapped\",[28614]],[[194835,194835],\"mapped\",[28729]],[[194836,194836],\"mapped\",[28702]],[[194837,194837],\"mapped\",[28699]],[[194838,194838],\"mapped\",[15766]],[[194839,194839],\"mapped\",[28746]],[[194840,194840],\"mapped\",[28797]],[[194841,194841],\"mapped\",[28791]],[[194842,194842],\"mapped\",[28845]],[[194843,194843],\"mapped\",[132389]],[[194844,194844],\"mapped\",[28997]],[[194845,194845],\"mapped\",[148067]],[[194846,194846],\"mapped\",[29084]],[[194847,194847],\"disallowed\"],[[194848,194848],\"mapped\",[29224]],[[194849,194849],\"mapped\",[29237]],[[194850,194850],\"mapped\",[29264]],[[194851,194851],\"mapped\",[149000]],[[194852,194852],\"mapped\",[29312]],[[194853,194853],\"mapped\",[29333]],[[194854,194854],\"mapped\",[149301]],[[194855,194855],\"mapped\",[149524]],[[194856,194856],\"mapped\",[29562]],[[194857,194857],\"mapped\",[29579]],[[194858,194858],\"mapped\",[16044]],[[194859,194859],\"mapped\",[29605]],[[194860,194861],\"mapped\",[16056]],[[194862,194862],\"mapped\",[29767]],[[194863,194863],\"mapped\",[29788]],[[194864,194864],\"mapped\",[29809]],[[194865,194865],\"mapped\",[29829]],[[194866,194866],\"mapped\",[29898]],[[194867,194867],\"mapped\",[16155]],[[194868,194868],\"mapped\",[29988]],[[194869,194869],\"mapped\",[150582]],[[194870,194870],\"mapped\",[30014]],[[194871,194871],\"mapped\",[150674]],[[194872,194872],\"mapped\",[30064]],[[194873,194873],\"mapped\",[139679]],[[194874,194874],\"mapped\",[30224]],[[194875,194875],\"mapped\",[151457]],[[194876,194876],\"mapped\",[151480]],[[194877,194877],\"mapped\",[151620]],[[194878,194878],\"mapped\",[16380]],[[194879,194879],\"mapped\",[16392]],[[194880,194880],\"mapped\",[30452]],[[194881,194881],\"mapped\",[151795]],[[194882,194882],\"mapped\",[151794]],[[194883,194883],\"mapped\",[151833]],[[194884,194884],\"mapped\",[151859]],[[194885,194885],\"mapped\",[30494]],[[194886,194887],\"mapped\",[30495]],[[194888,194888],\"mapped\",[30538]],[[194889,194889],\"mapped\",[16441]],[[194890,194890],\"mapped\",[30603]],[[194891,194891],\"mapped\",[16454]],[[194892,194892],\"mapped\",[16534]],[[194893,194893],\"mapped\",[152605]],[[194894,194894],\"mapped\",[30798]],[[194895,194895],\"mapped\",[30860]],[[194896,194896],\"mapped\",[30924]],[[194897,194897],\"mapped\",[16611]],[[194898,194898],\"mapped\",[153126]],[[194899,194899],\"mapped\",[31062]],[[194900,194900],\"mapped\",[153242]],[[194901,194901],\"mapped\",[153285]],[[194902,194902],\"mapped\",[31119]],[[194903,194903],\"mapped\",[31211]],[[194904,194904],\"mapped\",[16687]],[[194905,194905],\"mapped\",[31296]],[[194906,194906],\"mapped\",[31306]],[[194907,194907],\"mapped\",[31311]],[[194908,194908],\"mapped\",[153980]],[[194909,194910],\"mapped\",[154279]],[[194911,194911],\"disallowed\"],[[194912,194912],\"mapped\",[16898]],[[194913,194913],\"mapped\",[154539]],[[194914,194914],\"mapped\",[31686]],[[194915,194915],\"mapped\",[31689]],[[194916,194916],\"mapped\",[16935]],[[194917,194917],\"mapped\",[154752]],[[194918,194918],\"mapped\",[31954]],[[194919,194919],\"mapped\",[17056]],[[194920,194920],\"mapped\",[31976]],[[194921,194921],\"mapped\",[31971]],[[194922,194922],\"mapped\",[32000]],[[194923,194923],\"mapped\",[155526]],[[194924,194924],\"mapped\",[32099]],[[194925,194925],\"mapped\",[17153]],[[194926,194926],\"mapped\",[32199]],[[194927,194927],\"mapped\",[32258]],[[194928,194928],\"mapped\",[32325]],[[194929,194929],\"mapped\",[17204]],[[194930,194930],\"mapped\",[156200]],[[194931,194931],\"mapped\",[156231]],[[194932,194932],\"mapped\",[17241]],[[194933,194933],\"mapped\",[156377]],[[194934,194934],\"mapped\",[32634]],[[194935,194935],\"mapped\",[156478]],[[194936,194936],\"mapped\",[32661]],[[194937,194937],\"mapped\",[32762]],[[194938,194938],\"mapped\",[32773]],[[194939,194939],\"mapped\",[156890]],[[194940,194940],\"mapped\",[156963]],[[194941,194941],\"mapped\",[32864]],[[194942,194942],\"mapped\",[157096]],[[194943,194943],\"mapped\",[32880]],[[194944,194944],\"mapped\",[144223]],[[194945,194945],\"mapped\",[17365]],[[194946,194946],\"mapped\",[32946]],[[194947,194947],\"mapped\",[33027]],[[194948,194948],\"mapped\",[17419]],[[194949,194949],\"mapped\",[33086]],[[194950,194950],\"mapped\",[23221]],[[194951,194951],\"mapped\",[157607]],[[194952,194952],\"mapped\",[157621]],[[194953,194953],\"mapped\",[144275]],[[194954,194954],\"mapped\",[144284]],[[194955,194955],\"mapped\",[33281]],[[194956,194956],\"mapped\",[33284]],[[194957,194957],\"mapped\",[36766]],[[194958,194958],\"mapped\",[17515]],[[194959,194959],\"mapped\",[33425]],[[194960,194960],\"mapped\",[33419]],[[194961,194961],\"mapped\",[33437]],[[194962,194962],\"mapped\",[21171]],[[194963,194963],\"mapped\",[33457]],[[194964,194964],\"mapped\",[33459]],[[194965,194965],\"mapped\",[33469]],[[194966,194966],\"mapped\",[33510]],[[194967,194967],\"mapped\",[158524]],[[194968,194968],\"mapped\",[33509]],[[194969,194969],\"mapped\",[33565]],[[194970,194970],\"mapped\",[33635]],[[194971,194971],\"mapped\",[33709]],[[194972,194972],\"mapped\",[33571]],[[194973,194973],\"mapped\",[33725]],[[194974,194974],\"mapped\",[33767]],[[194975,194975],\"mapped\",[33879]],[[194976,194976],\"mapped\",[33619]],[[194977,194977],\"mapped\",[33738]],[[194978,194978],\"mapped\",[33740]],[[194979,194979],\"mapped\",[33756]],[[194980,194980],\"mapped\",[158774]],[[194981,194981],\"mapped\",[159083]],[[194982,194982],\"mapped\",[158933]],[[194983,194983],\"mapped\",[17707]],[[194984,194984],\"mapped\",[34033]],[[194985,194985],\"mapped\",[34035]],[[194986,194986],\"mapped\",[34070]],[[194987,194987],\"mapped\",[160714]],[[194988,194988],\"mapped\",[34148]],[[194989,194989],\"mapped\",[159532]],[[194990,194990],\"mapped\",[17757]],[[194991,194991],\"mapped\",[17761]],[[194992,194992],\"mapped\",[159665]],[[194993,194993],\"mapped\",[159954]],[[194994,194994],\"mapped\",[17771]],[[194995,194995],\"mapped\",[34384]],[[194996,194996],\"mapped\",[34396]],[[194997,194997],\"mapped\",[34407]],[[194998,194998],\"mapped\",[34409]],[[194999,194999],\"mapped\",[34473]],[[195000,195000],\"mapped\",[34440]],[[195001,195001],\"mapped\",[34574]],[[195002,195002],\"mapped\",[34530]],[[195003,195003],\"mapped\",[34681]],[[195004,195004],\"mapped\",[34600]],[[195005,195005],\"mapped\",[34667]],[[195006,195006],\"mapped\",[34694]],[[195007,195007],\"disallowed\"],[[195008,195008],\"mapped\",[34785]],[[195009,195009],\"mapped\",[34817]],[[195010,195010],\"mapped\",[17913]],[[195011,195011],\"mapped\",[34912]],[[195012,195012],\"mapped\",[34915]],[[195013,195013],\"mapped\",[161383]],[[195014,195014],\"mapped\",[35031]],[[195015,195015],\"mapped\",[35038]],[[195016,195016],\"mapped\",[17973]],[[195017,195017],\"mapped\",[35066]],[[195018,195018],\"mapped\",[13499]],[[195019,195019],\"mapped\",[161966]],[[195020,195020],\"mapped\",[162150]],[[195021,195021],\"mapped\",[18110]],[[195022,195022],\"mapped\",[18119]],[[195023,195023],\"mapped\",[35488]],[[195024,195024],\"mapped\",[35565]],[[195025,195025],\"mapped\",[35722]],[[195026,195026],\"mapped\",[35925]],[[195027,195027],\"mapped\",[162984]],[[195028,195028],\"mapped\",[36011]],[[195029,195029],\"mapped\",[36033]],[[195030,195030],\"mapped\",[36123]],[[195031,195031],\"mapped\",[36215]],[[195032,195032],\"mapped\",[163631]],[[195033,195033],\"mapped\",[133124]],[[195034,195034],\"mapped\",[36299]],[[195035,195035],\"mapped\",[36284]],[[195036,195036],\"mapped\",[36336]],[[195037,195037],\"mapped\",[133342]],[[195038,195038],\"mapped\",[36564]],[[195039,195039],\"mapped\",[36664]],[[195040,195040],\"mapped\",[165330]],[[195041,195041],\"mapped\",[165357]],[[195042,195042],\"mapped\",[37012]],[[195043,195043],\"mapped\",[37105]],[[195044,195044],\"mapped\",[37137]],[[195045,195045],\"mapped\",[165678]],[[195046,195046],\"mapped\",[37147]],[[195047,195047],\"mapped\",[37432]],[[195048,195048],\"mapped\",[37591]],[[195049,195049],\"mapped\",[37592]],[[195050,195050],\"mapped\",[37500]],[[195051,195051],\"mapped\",[37881]],[[195052,195052],\"mapped\",[37909]],[[195053,195053],\"mapped\",[166906]],[[195054,195054],\"mapped\",[38283]],[[195055,195055],\"mapped\",[18837]],[[195056,195056],\"mapped\",[38327]],[[195057,195057],\"mapped\",[167287]],[[195058,195058],\"mapped\",[18918]],[[195059,195059],\"mapped\",[38595]],[[195060,195060],\"mapped\",[23986]],[[195061,195061],\"mapped\",[38691]],[[195062,195062],\"mapped\",[168261]],[[195063,195063],\"mapped\",[168474]],[[195064,195064],\"mapped\",[19054]],[[195065,195065],\"mapped\",[19062]],[[195066,195066],\"mapped\",[38880]],[[195067,195067],\"mapped\",[168970]],[[195068,195068],\"mapped\",[19122]],[[195069,195069],\"mapped\",[169110]],[[195070,195071],\"mapped\",[38923]],[[195072,195072],\"mapped\",[38953]],[[195073,195073],\"mapped\",[169398]],[[195074,195074],\"mapped\",[39138]],[[195075,195075],\"mapped\",[19251]],[[195076,195076],\"mapped\",[39209]],[[195077,195077],\"mapped\",[39335]],[[195078,195078],\"mapped\",[39362]],[[195079,195079],\"mapped\",[39422]],[[195080,195080],\"mapped\",[19406]],[[195081,195081],\"mapped\",[170800]],[[195082,195082],\"mapped\",[39698]],[[195083,195083],\"mapped\",[40000]],[[195084,195084],\"mapped\",[40189]],[[195085,195085],\"mapped\",[19662]],[[195086,195086],\"mapped\",[19693]],[[195087,195087],\"mapped\",[40295]],[[195088,195088],\"mapped\",[172238]],[[195089,195089],\"mapped\",[19704]],[[195090,195090],\"mapped\",[172293]],[[195091,195091],\"mapped\",[172558]],[[195092,195092],\"mapped\",[172689]],[[195093,195093],\"mapped\",[40635]],[[195094,195094],\"mapped\",[19798]],[[195095,195095],\"mapped\",[40697]],[[195096,195096],\"mapped\",[40702]],[[195097,195097],\"mapped\",[40709]],[[195098,195098],\"mapped\",[40719]],[[195099,195099],\"mapped\",[40726]],[[195100,195100],\"mapped\",[40763]],[[195101,195101],\"mapped\",[173568]],[[195102,196605],\"disallowed\"],[[196606,196607],\"disallowed\"],[[196608,262141],\"disallowed\"],[[262142,262143],\"disallowed\"],[[262144,327677],\"disallowed\"],[[327678,327679],\"disallowed\"],[[327680,393213],\"disallowed\"],[[393214,393215],\"disallowed\"],[[393216,458749],\"disallowed\"],[[458750,458751],\"disallowed\"],[[458752,524285],\"disallowed\"],[[524286,524287],\"disallowed\"],[[524288,589821],\"disallowed\"],[[589822,589823],\"disallowed\"],[[589824,655357],\"disallowed\"],[[655358,655359],\"disallowed\"],[[655360,720893],\"disallowed\"],[[720894,720895],\"disallowed\"],[[720896,786429],\"disallowed\"],[[786430,786431],\"disallowed\"],[[786432,851965],\"disallowed\"],[[851966,851967],\"disallowed\"],[[851968,917501],\"disallowed\"],[[917502,917503],\"disallowed\"],[[917504,917504],\"disallowed\"],[[917505,917505],\"disallowed\"],[[917506,917535],\"disallowed\"],[[917536,917631],\"disallowed\"],[[917632,917759],\"disallowed\"],[[917760,917999],\"ignored\"],[[918000,983037],\"disallowed\"],[[983038,983039],\"disallowed\"],[[983040,1048573],\"disallowed\"],[[1048574,1048575],\"disallowed\"],[[1048576,1114109],\"disallowed\"],[[1114110,1114111],\"disallowed\"]]");
}));
//#endregion
//#region node_modules/tr46/index.js
var require_tr46 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var punycode$1 = __require("punycode");
	var mappingTable = (init_mappingTable(), __toCommonJS(mappingTable_exports).default);
	var PROCESSING_OPTIONS = {
		TRANSITIONAL: 0,
		NONTRANSITIONAL: 1
	};
	function normalize(str) {
		return str.split("\0").map(function(s) {
			return s.normalize("NFC");
		}).join("\0");
	}
	function findStatus(val) {
		var start = 0;
		var end = mappingTable.length - 1;
		while (start <= end) {
			var mid = Math.floor((start + end) / 2);
			var target = mappingTable[mid];
			if (target[0][0] <= val && target[0][1] >= val) return target;
			else if (target[0][0] > val) end = mid - 1;
			else start = mid + 1;
		}
		return null;
	}
	var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	function countSymbols(string) {
		return string.replace(regexAstralSymbols, "_").length;
	}
	function mapChars(domain_name, useSTD3, processing_option) {
		var hasError = false;
		var processed = "";
		var len = countSymbols(domain_name);
		for (var i = 0; i < len; ++i) {
			var codePoint = domain_name.codePointAt(i);
			var status = findStatus(codePoint);
			switch (status[1]) {
				case "disallowed":
					hasError = true;
					processed += String.fromCodePoint(codePoint);
					break;
				case "ignored": break;
				case "mapped":
					processed += String.fromCodePoint.apply(String, status[2]);
					break;
				case "deviation":
					if (processing_option === PROCESSING_OPTIONS.TRANSITIONAL) processed += String.fromCodePoint.apply(String, status[2]);
					else processed += String.fromCodePoint(codePoint);
					break;
				case "valid":
					processed += String.fromCodePoint(codePoint);
					break;
				case "disallowed_STD3_mapped":
					if (useSTD3) {
						hasError = true;
						processed += String.fromCodePoint(codePoint);
					} else processed += String.fromCodePoint.apply(String, status[2]);
					break;
				case "disallowed_STD3_valid":
					if (useSTD3) hasError = true;
					processed += String.fromCodePoint(codePoint);
			}
		}
		return {
			string: processed,
			error: hasError
		};
	}
	var combiningMarksRegex = /[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08E4-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D01-\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u192B\u1930-\u193B\u19B0-\u19C0\u19C8\u19C9\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF5\u1DFC-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C4\uA8E0-\uA8F1\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2D]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC7F-\uDC82\uDCB0-\uDCBA\uDD00-\uDD02\uDD27-\uDD34\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDE2C-\uDE37\uDEDF-\uDEEA\uDF01-\uDF03\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDCB0-\uDCC3\uDDAF-\uDDB5\uDDB8-\uDDC0\uDE30-\uDE40\uDEAB-\uDEB7]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD83A[\uDCD0-\uDCD6]|\uDB40[\uDD00-\uDDEF]/;
	function validateLabel(label, processing_option) {
		if (label.substr(0, 4) === "xn--") {
			label = punycode$1.toUnicode(label);
			processing_option = PROCESSING_OPTIONS.NONTRANSITIONAL;
		}
		var error = false;
		if (normalize(label) !== label || label[3] === "-" && label[4] === "-" || label[0] === "-" || label[label.length - 1] === "-" || label.indexOf(".") !== -1 || label.search(combiningMarksRegex) === 0) error = true;
		var len = countSymbols(label);
		for (var i = 0; i < len; ++i) {
			var status = findStatus(label.codePointAt(i));
			if (processing === PROCESSING_OPTIONS.TRANSITIONAL && status[1] !== "valid" || processing === PROCESSING_OPTIONS.NONTRANSITIONAL && status[1] !== "valid" && status[1] !== "deviation") {
				error = true;
				break;
			}
		}
		return {
			label,
			error
		};
	}
	function processing(domain_name, useSTD3, processing_option) {
		var result = mapChars(domain_name, useSTD3, processing_option);
		result.string = normalize(result.string);
		var labels = result.string.split(".");
		for (var i = 0; i < labels.length; ++i) try {
			var validation = validateLabel(labels[i]);
			labels[i] = validation.label;
			result.error = result.error || validation.error;
		} catch (e) {
			result.error = true;
		}
		return {
			string: labels.join("."),
			error: result.error
		};
	}
	module.exports.toASCII = function(domain_name, useSTD3, processing_option, verifyDnsLength) {
		var result = processing(domain_name, useSTD3, processing_option);
		var labels = result.string.split(".");
		labels = labels.map(function(l) {
			try {
				return punycode$1.toASCII(l);
			} catch (e) {
				result.error = true;
				return l;
			}
		});
		if (verifyDnsLength) {
			var total = labels.slice(0, labels.length - 1).join(".").length;
			if (total.length > 253 || total.length === 0) result.error = true;
			for (var i = 0; i < labels.length; ++i) if (labels.length > 63 || labels.length === 0) {
				result.error = true;
				break;
			}
		}
		if (result.error) return null;
		return labels.join(".");
	};
	module.exports.toUnicode = function(domain_name, useSTD3) {
		var result = processing(domain_name, useSTD3, PROCESSING_OPTIONS.NONTRANSITIONAL);
		return {
			domain: result.string,
			error: result.error
		};
	};
	module.exports.PROCESSING_OPTIONS = PROCESSING_OPTIONS;
}));
//#endregion
//#region node_modules/whatwg-url/lib/url-state-machine.js
var require_url_state_machine = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var punycode = __require("punycode");
	var tr46 = require_tr46();
	var specialSchemes = {
		ftp: 21,
		file: null,
		gopher: 70,
		http: 80,
		https: 443,
		ws: 80,
		wss: 443
	};
	var failure = Symbol("failure");
	function countSymbols(str) {
		return punycode.ucs2.decode(str).length;
	}
	function at(input, idx) {
		const c = input[idx];
		return isNaN(c) ? void 0 : String.fromCodePoint(c);
	}
	function isASCIIDigit(c) {
		return c >= 48 && c <= 57;
	}
	function isASCIIAlpha(c) {
		return c >= 65 && c <= 90 || c >= 97 && c <= 122;
	}
	function isASCIIAlphanumeric(c) {
		return isASCIIAlpha(c) || isASCIIDigit(c);
	}
	function isASCIIHex(c) {
		return isASCIIDigit(c) || c >= 65 && c <= 70 || c >= 97 && c <= 102;
	}
	function isSingleDot(buffer) {
		return buffer === "." || buffer.toLowerCase() === "%2e";
	}
	function isDoubleDot(buffer) {
		buffer = buffer.toLowerCase();
		return buffer === ".." || buffer === "%2e." || buffer === ".%2e" || buffer === "%2e%2e";
	}
	function isWindowsDriveLetterCodePoints(cp1, cp2) {
		return isASCIIAlpha(cp1) && (cp2 === 58 || cp2 === 124);
	}
	function isWindowsDriveLetterString(string) {
		return string.length === 2 && isASCIIAlpha(string.codePointAt(0)) && (string[1] === ":" || string[1] === "|");
	}
	function isNormalizedWindowsDriveLetterString(string) {
		return string.length === 2 && isASCIIAlpha(string.codePointAt(0)) && string[1] === ":";
	}
	function containsForbiddenHostCodePoint(string) {
		return string.search(/\u0000|\u0009|\u000A|\u000D|\u0020|#|%|\/|:|\?|@|\[|\\|\]/) !== -1;
	}
	function containsForbiddenHostCodePointExcludingPercent(string) {
		return string.search(/\u0000|\u0009|\u000A|\u000D|\u0020|#|\/|:|\?|@|\[|\\|\]/) !== -1;
	}
	function isSpecialScheme(scheme) {
		return specialSchemes[scheme] !== void 0;
	}
	function isSpecial(url) {
		return isSpecialScheme(url.scheme);
	}
	function defaultPort(scheme) {
		return specialSchemes[scheme];
	}
	function percentEncode(c) {
		let hex = c.toString(16).toUpperCase();
		if (hex.length === 1) hex = "0" + hex;
		return "%" + hex;
	}
	function utf8PercentEncode(c) {
		const buf = new Buffer(c);
		let str = "";
		for (let i = 0; i < buf.length; ++i) str += percentEncode(buf[i]);
		return str;
	}
	function utf8PercentDecode(str) {
		const input = new Buffer(str);
		const output = [];
		for (let i = 0; i < input.length; ++i) if (input[i] !== 37) output.push(input[i]);
		else if (input[i] === 37 && isASCIIHex(input[i + 1]) && isASCIIHex(input[i + 2])) {
			output.push(parseInt(input.slice(i + 1, i + 3).toString(), 16));
			i += 2;
		} else output.push(input[i]);
		return new Buffer(output).toString();
	}
	function isC0ControlPercentEncode(c) {
		return c <= 31 || c > 126;
	}
	var extraPathPercentEncodeSet = /* @__PURE__ */ new Set([
		32,
		34,
		35,
		60,
		62,
		63,
		96,
		123,
		125
	]);
	function isPathPercentEncode(c) {
		return isC0ControlPercentEncode(c) || extraPathPercentEncodeSet.has(c);
	}
	var extraUserinfoPercentEncodeSet = /* @__PURE__ */ new Set([
		47,
		58,
		59,
		61,
		64,
		91,
		92,
		93,
		94,
		124
	]);
	function isUserinfoPercentEncode(c) {
		return isPathPercentEncode(c) || extraUserinfoPercentEncodeSet.has(c);
	}
	function percentEncodeChar(c, encodeSetPredicate) {
		const cStr = String.fromCodePoint(c);
		if (encodeSetPredicate(c)) return utf8PercentEncode(cStr);
		return cStr;
	}
	function parseIPv4Number(input) {
		let R = 10;
		if (input.length >= 2 && input.charAt(0) === "0" && input.charAt(1).toLowerCase() === "x") {
			input = input.substring(2);
			R = 16;
		} else if (input.length >= 2 && input.charAt(0) === "0") {
			input = input.substring(1);
			R = 8;
		}
		if (input === "") return 0;
		if ((R === 10 ? /[^0-9]/ : R === 16 ? /[^0-9A-Fa-f]/ : /[^0-7]/).test(input)) return failure;
		return parseInt(input, R);
	}
	function parseIPv4(input) {
		const parts = input.split(".");
		if (parts[parts.length - 1] === "") {
			if (parts.length > 1) parts.pop();
		}
		if (parts.length > 4) return input;
		const numbers = [];
		for (const part of parts) {
			if (part === "") return input;
			const n = parseIPv4Number(part);
			if (n === failure) return input;
			numbers.push(n);
		}
		for (let i = 0; i < numbers.length - 1; ++i) if (numbers[i] > 255) return failure;
		if (numbers[numbers.length - 1] >= Math.pow(256, 5 - numbers.length)) return failure;
		let ipv4 = numbers.pop();
		let counter = 0;
		for (const n of numbers) {
			ipv4 += n * Math.pow(256, 3 - counter);
			++counter;
		}
		return ipv4;
	}
	function serializeIPv4(address) {
		let output = "";
		let n = address;
		for (let i = 1; i <= 4; ++i) {
			output = String(n % 256) + output;
			if (i !== 4) output = "." + output;
			n = Math.floor(n / 256);
		}
		return output;
	}
	function parseIPv6(input) {
		const address = [
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		];
		let pieceIndex = 0;
		let compress = null;
		let pointer = 0;
		input = punycode.ucs2.decode(input);
		if (input[pointer] === 58) {
			if (input[pointer + 1] !== 58) return failure;
			pointer += 2;
			++pieceIndex;
			compress = pieceIndex;
		}
		while (pointer < input.length) {
			if (pieceIndex === 8) return failure;
			if (input[pointer] === 58) {
				if (compress !== null) return failure;
				++pointer;
				++pieceIndex;
				compress = pieceIndex;
				continue;
			}
			let value = 0;
			let length = 0;
			while (length < 4 && isASCIIHex(input[pointer])) {
				value = value * 16 + parseInt(at(input, pointer), 16);
				++pointer;
				++length;
			}
			if (input[pointer] === 46) {
				if (length === 0) return failure;
				pointer -= length;
				if (pieceIndex > 6) return failure;
				let numbersSeen = 0;
				while (input[pointer] !== void 0) {
					let ipv4Piece = null;
					if (numbersSeen > 0) {
						if (input[pointer] === 46 && numbersSeen < 4) ++pointer;
						else return failure;
					}
					if (!isASCIIDigit(input[pointer])) return failure;
					while (isASCIIDigit(input[pointer])) {
						const number = parseInt(at(input, pointer));
						if (ipv4Piece === null) ipv4Piece = number;
						else if (ipv4Piece === 0) return failure;
						else ipv4Piece = ipv4Piece * 10 + number;
						if (ipv4Piece > 255) return failure;
						++pointer;
					}
					address[pieceIndex] = address[pieceIndex] * 256 + ipv4Piece;
					++numbersSeen;
					if (numbersSeen === 2 || numbersSeen === 4) ++pieceIndex;
				}
				if (numbersSeen !== 4) return failure;
				break;
			} else if (input[pointer] === 58) {
				++pointer;
				if (input[pointer] === void 0) return failure;
			} else if (input[pointer] !== void 0) return failure;
			address[pieceIndex] = value;
			++pieceIndex;
		}
		if (compress !== null) {
			let swaps = pieceIndex - compress;
			pieceIndex = 7;
			while (pieceIndex !== 0 && swaps > 0) {
				const temp = address[compress + swaps - 1];
				address[compress + swaps - 1] = address[pieceIndex];
				address[pieceIndex] = temp;
				--pieceIndex;
				--swaps;
			}
		} else if (compress === null && pieceIndex !== 8) return failure;
		return address;
	}
	function serializeIPv6(address) {
		let output = "";
		const compress = findLongestZeroSequence(address).idx;
		let ignore0 = false;
		for (let pieceIndex = 0; pieceIndex <= 7; ++pieceIndex) {
			if (ignore0 && address[pieceIndex] === 0) continue;
			else if (ignore0) ignore0 = false;
			if (compress === pieceIndex) {
				output += pieceIndex === 0 ? "::" : ":";
				ignore0 = true;
				continue;
			}
			output += address[pieceIndex].toString(16);
			if (pieceIndex !== 7) output += ":";
		}
		return output;
	}
	function parseHost(input, isSpecialArg) {
		if (input[0] === "[") {
			if (input[input.length - 1] !== "]") return failure;
			return parseIPv6(input.substring(1, input.length - 1));
		}
		if (!isSpecialArg) return parseOpaqueHost(input);
		const domain = utf8PercentDecode(input);
		const asciiDomain = tr46.toASCII(domain, false, tr46.PROCESSING_OPTIONS.NONTRANSITIONAL, false);
		if (asciiDomain === null) return failure;
		if (containsForbiddenHostCodePoint(asciiDomain)) return failure;
		const ipv4Host = parseIPv4(asciiDomain);
		if (typeof ipv4Host === "number" || ipv4Host === failure) return ipv4Host;
		return asciiDomain;
	}
	function parseOpaqueHost(input) {
		if (containsForbiddenHostCodePointExcludingPercent(input)) return failure;
		let output = "";
		const decoded = punycode.ucs2.decode(input);
		for (let i = 0; i < decoded.length; ++i) output += percentEncodeChar(decoded[i], isC0ControlPercentEncode);
		return output;
	}
	function findLongestZeroSequence(arr) {
		let maxIdx = null;
		let maxLen = 1;
		let currStart = null;
		let currLen = 0;
		for (let i = 0; i < arr.length; ++i) if (arr[i] !== 0) {
			if (currLen > maxLen) {
				maxIdx = currStart;
				maxLen = currLen;
			}
			currStart = null;
			currLen = 0;
		} else {
			if (currStart === null) currStart = i;
			++currLen;
		}
		if (currLen > maxLen) {
			maxIdx = currStart;
			maxLen = currLen;
		}
		return {
			idx: maxIdx,
			len: maxLen
		};
	}
	function serializeHost(host) {
		if (typeof host === "number") return serializeIPv4(host);
		if (host instanceof Array) return "[" + serializeIPv6(host) + "]";
		return host;
	}
	function trimControlChars(url) {
		return url.replace(/^[\u0000-\u001F\u0020]+|[\u0000-\u001F\u0020]+$/g, "");
	}
	function trimTabAndNewline(url) {
		return url.replace(/\u0009|\u000A|\u000D/g, "");
	}
	function shortenPath(url) {
		const path = url.path;
		if (path.length === 0) return;
		if (url.scheme === "file" && path.length === 1 && isNormalizedWindowsDriveLetter(path[0])) return;
		path.pop();
	}
	function includesCredentials(url) {
		return url.username !== "" || url.password !== "";
	}
	function cannotHaveAUsernamePasswordPort(url) {
		return url.host === null || url.host === "" || url.cannotBeABaseURL || url.scheme === "file";
	}
	function isNormalizedWindowsDriveLetter(string) {
		return /^[A-Za-z]:$/.test(string);
	}
	function URLStateMachine(input, base, encodingOverride, url, stateOverride) {
		this.pointer = 0;
		this.input = input;
		this.base = base || null;
		this.encodingOverride = encodingOverride || "utf-8";
		this.stateOverride = stateOverride;
		this.url = url;
		this.failure = false;
		this.parseError = false;
		if (!this.url) {
			this.url = {
				scheme: "",
				username: "",
				password: "",
				host: null,
				port: null,
				path: [],
				query: null,
				fragment: null,
				cannotBeABaseURL: false
			};
			const res = trimControlChars(this.input);
			if (res !== this.input) this.parseError = true;
			this.input = res;
		}
		const res = trimTabAndNewline(this.input);
		if (res !== this.input) this.parseError = true;
		this.input = res;
		this.state = stateOverride || "scheme start";
		this.buffer = "";
		this.atFlag = false;
		this.arrFlag = false;
		this.passwordTokenSeenFlag = false;
		this.input = punycode.ucs2.decode(this.input);
		for (; this.pointer <= this.input.length; ++this.pointer) {
			const c = this.input[this.pointer];
			const cStr = isNaN(c) ? void 0 : String.fromCodePoint(c);
			const ret = this["parse " + this.state](c, cStr);
			if (!ret) break;
			else if (ret === failure) {
				this.failure = true;
				break;
			}
		}
	}
	URLStateMachine.prototype["parse scheme start"] = function parseSchemeStart(c, cStr) {
		if (isASCIIAlpha(c)) {
			this.buffer += cStr.toLowerCase();
			this.state = "scheme";
		} else if (!this.stateOverride) {
			this.state = "no scheme";
			--this.pointer;
		} else {
			this.parseError = true;
			return failure;
		}
		return true;
	};
	URLStateMachine.prototype["parse scheme"] = function parseScheme(c, cStr) {
		if (isASCIIAlphanumeric(c) || c === 43 || c === 45 || c === 46) this.buffer += cStr.toLowerCase();
		else if (c === 58) {
			if (this.stateOverride) {
				if (isSpecial(this.url) && !isSpecialScheme(this.buffer)) return false;
				if (!isSpecial(this.url) && isSpecialScheme(this.buffer)) return false;
				if ((includesCredentials(this.url) || this.url.port !== null) && this.buffer === "file") return false;
				if (this.url.scheme === "file" && (this.url.host === "" || this.url.host === null)) return false;
			}
			this.url.scheme = this.buffer;
			this.buffer = "";
			if (this.stateOverride) return false;
			if (this.url.scheme === "file") {
				if (this.input[this.pointer + 1] !== 47 || this.input[this.pointer + 2] !== 47) this.parseError = true;
				this.state = "file";
			} else if (isSpecial(this.url) && this.base !== null && this.base.scheme === this.url.scheme) this.state = "special relative or authority";
			else if (isSpecial(this.url)) this.state = "special authority slashes";
			else if (this.input[this.pointer + 1] === 47) {
				this.state = "path or authority";
				++this.pointer;
			} else {
				this.url.cannotBeABaseURL = true;
				this.url.path.push("");
				this.state = "cannot-be-a-base-URL path";
			}
		} else if (!this.stateOverride) {
			this.buffer = "";
			this.state = "no scheme";
			this.pointer = -1;
		} else {
			this.parseError = true;
			return failure;
		}
		return true;
	};
	URLStateMachine.prototype["parse no scheme"] = function parseNoScheme(c) {
		if (this.base === null || this.base.cannotBeABaseURL && c !== 35) return failure;
		else if (this.base.cannotBeABaseURL && c === 35) {
			this.url.scheme = this.base.scheme;
			this.url.path = this.base.path.slice();
			this.url.query = this.base.query;
			this.url.fragment = "";
			this.url.cannotBeABaseURL = true;
			this.state = "fragment";
		} else if (this.base.scheme === "file") {
			this.state = "file";
			--this.pointer;
		} else {
			this.state = "relative";
			--this.pointer;
		}
		return true;
	};
	URLStateMachine.prototype["parse special relative or authority"] = function parseSpecialRelativeOrAuthority(c) {
		if (c === 47 && this.input[this.pointer + 1] === 47) {
			this.state = "special authority ignore slashes";
			++this.pointer;
		} else {
			this.parseError = true;
			this.state = "relative";
			--this.pointer;
		}
		return true;
	};
	URLStateMachine.prototype["parse path or authority"] = function parsePathOrAuthority(c) {
		if (c === 47) this.state = "authority";
		else {
			this.state = "path";
			--this.pointer;
		}
		return true;
	};
	URLStateMachine.prototype["parse relative"] = function parseRelative(c) {
		this.url.scheme = this.base.scheme;
		if (isNaN(c)) {
			this.url.username = this.base.username;
			this.url.password = this.base.password;
			this.url.host = this.base.host;
			this.url.port = this.base.port;
			this.url.path = this.base.path.slice();
			this.url.query = this.base.query;
		} else if (c === 47) this.state = "relative slash";
		else if (c === 63) {
			this.url.username = this.base.username;
			this.url.password = this.base.password;
			this.url.host = this.base.host;
			this.url.port = this.base.port;
			this.url.path = this.base.path.slice();
			this.url.query = "";
			this.state = "query";
		} else if (c === 35) {
			this.url.username = this.base.username;
			this.url.password = this.base.password;
			this.url.host = this.base.host;
			this.url.port = this.base.port;
			this.url.path = this.base.path.slice();
			this.url.query = this.base.query;
			this.url.fragment = "";
			this.state = "fragment";
		} else if (isSpecial(this.url) && c === 92) {
			this.parseError = true;
			this.state = "relative slash";
		} else {
			this.url.username = this.base.username;
			this.url.password = this.base.password;
			this.url.host = this.base.host;
			this.url.port = this.base.port;
			this.url.path = this.base.path.slice(0, this.base.path.length - 1);
			this.state = "path";
			--this.pointer;
		}
		return true;
	};
	URLStateMachine.prototype["parse relative slash"] = function parseRelativeSlash(c) {
		if (isSpecial(this.url) && (c === 47 || c === 92)) {
			if (c === 92) this.parseError = true;
			this.state = "special authority ignore slashes";
		} else if (c === 47) this.state = "authority";
		else {
			this.url.username = this.base.username;
			this.url.password = this.base.password;
			this.url.host = this.base.host;
			this.url.port = this.base.port;
			this.state = "path";
			--this.pointer;
		}
		return true;
	};
	URLStateMachine.prototype["parse special authority slashes"] = function parseSpecialAuthoritySlashes(c) {
		if (c === 47 && this.input[this.pointer + 1] === 47) {
			this.state = "special authority ignore slashes";
			++this.pointer;
		} else {
			this.parseError = true;
			this.state = "special authority ignore slashes";
			--this.pointer;
		}
		return true;
	};
	URLStateMachine.prototype["parse special authority ignore slashes"] = function parseSpecialAuthorityIgnoreSlashes(c) {
		if (c !== 47 && c !== 92) {
			this.state = "authority";
			--this.pointer;
		} else this.parseError = true;
		return true;
	};
	URLStateMachine.prototype["parse authority"] = function parseAuthority(c, cStr) {
		if (c === 64) {
			this.parseError = true;
			if (this.atFlag) this.buffer = "%40" + this.buffer;
			this.atFlag = true;
			const len = countSymbols(this.buffer);
			for (let pointer = 0; pointer < len; ++pointer) {
				const codePoint = this.buffer.codePointAt(pointer);
				if (codePoint === 58 && !this.passwordTokenSeenFlag) {
					this.passwordTokenSeenFlag = true;
					continue;
				}
				const encodedCodePoints = percentEncodeChar(codePoint, isUserinfoPercentEncode);
				if (this.passwordTokenSeenFlag) this.url.password += encodedCodePoints;
				else this.url.username += encodedCodePoints;
			}
			this.buffer = "";
		} else if (isNaN(c) || c === 47 || c === 63 || c === 35 || isSpecial(this.url) && c === 92) {
			if (this.atFlag && this.buffer === "") {
				this.parseError = true;
				return failure;
			}
			this.pointer -= countSymbols(this.buffer) + 1;
			this.buffer = "";
			this.state = "host";
		} else this.buffer += cStr;
		return true;
	};
	URLStateMachine.prototype["parse hostname"] = URLStateMachine.prototype["parse host"] = function parseHostName(c, cStr) {
		if (this.stateOverride && this.url.scheme === "file") {
			--this.pointer;
			this.state = "file host";
		} else if (c === 58 && !this.arrFlag) {
			if (this.buffer === "") {
				this.parseError = true;
				return failure;
			}
			const host = parseHost(this.buffer, isSpecial(this.url));
			if (host === failure) return failure;
			this.url.host = host;
			this.buffer = "";
			this.state = "port";
			if (this.stateOverride === "hostname") return false;
		} else if (isNaN(c) || c === 47 || c === 63 || c === 35 || isSpecial(this.url) && c === 92) {
			--this.pointer;
			if (isSpecial(this.url) && this.buffer === "") {
				this.parseError = true;
				return failure;
			} else if (this.stateOverride && this.buffer === "" && (includesCredentials(this.url) || this.url.port !== null)) {
				this.parseError = true;
				return false;
			}
			const host = parseHost(this.buffer, isSpecial(this.url));
			if (host === failure) return failure;
			this.url.host = host;
			this.buffer = "";
			this.state = "path start";
			if (this.stateOverride) return false;
		} else {
			if (c === 91) this.arrFlag = true;
			else if (c === 93) this.arrFlag = false;
			this.buffer += cStr;
		}
		return true;
	};
	URLStateMachine.prototype["parse port"] = function parsePort(c, cStr) {
		if (isASCIIDigit(c)) this.buffer += cStr;
		else if (isNaN(c) || c === 47 || c === 63 || c === 35 || isSpecial(this.url) && c === 92 || this.stateOverride) {
			if (this.buffer !== "") {
				const port = parseInt(this.buffer);
				if (port > Math.pow(2, 16) - 1) {
					this.parseError = true;
					return failure;
				}
				this.url.port = port === defaultPort(this.url.scheme) ? null : port;
				this.buffer = "";
			}
			if (this.stateOverride) return false;
			this.state = "path start";
			--this.pointer;
		} else {
			this.parseError = true;
			return failure;
		}
		return true;
	};
	var fileOtherwiseCodePoints = /* @__PURE__ */ new Set([
		47,
		92,
		63,
		35
	]);
	URLStateMachine.prototype["parse file"] = function parseFile(c) {
		this.url.scheme = "file";
		if (c === 47 || c === 92) {
			if (c === 92) this.parseError = true;
			this.state = "file slash";
		} else if (this.base !== null && this.base.scheme === "file") {
			if (isNaN(c)) {
				this.url.host = this.base.host;
				this.url.path = this.base.path.slice();
				this.url.query = this.base.query;
			} else if (c === 63) {
				this.url.host = this.base.host;
				this.url.path = this.base.path.slice();
				this.url.query = "";
				this.state = "query";
			} else if (c === 35) {
				this.url.host = this.base.host;
				this.url.path = this.base.path.slice();
				this.url.query = this.base.query;
				this.url.fragment = "";
				this.state = "fragment";
			} else {
				if (this.input.length - this.pointer - 1 === 0 || !isWindowsDriveLetterCodePoints(c, this.input[this.pointer + 1]) || this.input.length - this.pointer - 1 >= 2 && !fileOtherwiseCodePoints.has(this.input[this.pointer + 2])) {
					this.url.host = this.base.host;
					this.url.path = this.base.path.slice();
					shortenPath(this.url);
				} else this.parseError = true;
				this.state = "path";
				--this.pointer;
			}
		} else {
			this.state = "path";
			--this.pointer;
		}
		return true;
	};
	URLStateMachine.prototype["parse file slash"] = function parseFileSlash(c) {
		if (c === 47 || c === 92) {
			if (c === 92) this.parseError = true;
			this.state = "file host";
		} else {
			if (this.base !== null && this.base.scheme === "file") {
				if (isNormalizedWindowsDriveLetterString(this.base.path[0])) this.url.path.push(this.base.path[0]);
				else this.url.host = this.base.host;
			}
			this.state = "path";
			--this.pointer;
		}
		return true;
	};
	URLStateMachine.prototype["parse file host"] = function parseFileHost(c, cStr) {
		if (isNaN(c) || c === 47 || c === 92 || c === 63 || c === 35) {
			--this.pointer;
			if (!this.stateOverride && isWindowsDriveLetterString(this.buffer)) {
				this.parseError = true;
				this.state = "path";
			} else if (this.buffer === "") {
				this.url.host = "";
				if (this.stateOverride) return false;
				this.state = "path start";
			} else {
				let host = parseHost(this.buffer, isSpecial(this.url));
				if (host === failure) return failure;
				if (host === "localhost") host = "";
				this.url.host = host;
				if (this.stateOverride) return false;
				this.buffer = "";
				this.state = "path start";
			}
		} else this.buffer += cStr;
		return true;
	};
	URLStateMachine.prototype["parse path start"] = function parsePathStart(c) {
		if (isSpecial(this.url)) {
			if (c === 92) this.parseError = true;
			this.state = "path";
			if (c !== 47 && c !== 92) --this.pointer;
		} else if (!this.stateOverride && c === 63) {
			this.url.query = "";
			this.state = "query";
		} else if (!this.stateOverride && c === 35) {
			this.url.fragment = "";
			this.state = "fragment";
		} else if (c !== void 0) {
			this.state = "path";
			if (c !== 47) --this.pointer;
		}
		return true;
	};
	URLStateMachine.prototype["parse path"] = function parsePath(c) {
		if (isNaN(c) || c === 47 || isSpecial(this.url) && c === 92 || !this.stateOverride && (c === 63 || c === 35)) {
			if (isSpecial(this.url) && c === 92) this.parseError = true;
			if (isDoubleDot(this.buffer)) {
				shortenPath(this.url);
				if (c !== 47 && !(isSpecial(this.url) && c === 92)) this.url.path.push("");
			} else if (isSingleDot(this.buffer) && c !== 47 && !(isSpecial(this.url) && c === 92)) this.url.path.push("");
			else if (!isSingleDot(this.buffer)) {
				if (this.url.scheme === "file" && this.url.path.length === 0 && isWindowsDriveLetterString(this.buffer)) {
					if (this.url.host !== "" && this.url.host !== null) {
						this.parseError = true;
						this.url.host = "";
					}
					this.buffer = this.buffer[0] + ":";
				}
				this.url.path.push(this.buffer);
			}
			this.buffer = "";
			if (this.url.scheme === "file" && (c === void 0 || c === 63 || c === 35)) while (this.url.path.length > 1 && this.url.path[0] === "") {
				this.parseError = true;
				this.url.path.shift();
			}
			if (c === 63) {
				this.url.query = "";
				this.state = "query";
			}
			if (c === 35) {
				this.url.fragment = "";
				this.state = "fragment";
			}
		} else {
			if (c === 37 && (!isASCIIHex(this.input[this.pointer + 1]) || !isASCIIHex(this.input[this.pointer + 2]))) this.parseError = true;
			this.buffer += percentEncodeChar(c, isPathPercentEncode);
		}
		return true;
	};
	URLStateMachine.prototype["parse cannot-be-a-base-URL path"] = function parseCannotBeABaseURLPath(c) {
		if (c === 63) {
			this.url.query = "";
			this.state = "query";
		} else if (c === 35) {
			this.url.fragment = "";
			this.state = "fragment";
		} else {
			if (!isNaN(c) && c !== 37) this.parseError = true;
			if (c === 37 && (!isASCIIHex(this.input[this.pointer + 1]) || !isASCIIHex(this.input[this.pointer + 2]))) this.parseError = true;
			if (!isNaN(c)) this.url.path[0] = this.url.path[0] + percentEncodeChar(c, isC0ControlPercentEncode);
		}
		return true;
	};
	URLStateMachine.prototype["parse query"] = function parseQuery(c, cStr) {
		if (isNaN(c) || !this.stateOverride && c === 35) {
			if (!isSpecial(this.url) || this.url.scheme === "ws" || this.url.scheme === "wss") this.encodingOverride = "utf-8";
			const buffer = new Buffer(this.buffer);
			for (let i = 0; i < buffer.length; ++i) if (buffer[i] < 33 || buffer[i] > 126 || buffer[i] === 34 || buffer[i] === 35 || buffer[i] === 60 || buffer[i] === 62) this.url.query += percentEncode(buffer[i]);
			else this.url.query += String.fromCodePoint(buffer[i]);
			this.buffer = "";
			if (c === 35) {
				this.url.fragment = "";
				this.state = "fragment";
			}
		} else {
			if (c === 37 && (!isASCIIHex(this.input[this.pointer + 1]) || !isASCIIHex(this.input[this.pointer + 2]))) this.parseError = true;
			this.buffer += cStr;
		}
		return true;
	};
	URLStateMachine.prototype["parse fragment"] = function parseFragment(c) {
		if (isNaN(c)) {} else if (c === 0) this.parseError = true;
		else {
			if (c === 37 && (!isASCIIHex(this.input[this.pointer + 1]) || !isASCIIHex(this.input[this.pointer + 2]))) this.parseError = true;
			this.url.fragment += percentEncodeChar(c, isC0ControlPercentEncode);
		}
		return true;
	};
	function serializeURL(url, excludeFragment) {
		let output = url.scheme + ":";
		if (url.host !== null) {
			output += "//";
			if (url.username !== "" || url.password !== "") {
				output += url.username;
				if (url.password !== "") output += ":" + url.password;
				output += "@";
			}
			output += serializeHost(url.host);
			if (url.port !== null) output += ":" + url.port;
		} else if (url.host === null && url.scheme === "file") output += "//";
		if (url.cannotBeABaseURL) output += url.path[0];
		else for (const string of url.path) output += "/" + string;
		if (url.query !== null) output += "?" + url.query;
		if (!excludeFragment && url.fragment !== null) output += "#" + url.fragment;
		return output;
	}
	function serializeOrigin(tuple) {
		let result = tuple.scheme + "://";
		result += serializeHost(tuple.host);
		if (tuple.port !== null) result += ":" + tuple.port;
		return result;
	}
	module.exports.serializeURL = serializeURL;
	module.exports.serializeURLOrigin = function(url) {
		switch (url.scheme) {
			case "blob": try {
				return module.exports.serializeURLOrigin(module.exports.parseURL(url.path[0]));
			} catch (e) {
				return "null";
			}
			case "ftp":
			case "gopher":
			case "http":
			case "https":
			case "ws":
			case "wss": return serializeOrigin({
				scheme: url.scheme,
				host: url.host,
				port: url.port
			});
			case "file": return "file://";
			default: return "null";
		}
	};
	module.exports.basicURLParse = function(input, options) {
		if (options === void 0) options = {};
		const usm = new URLStateMachine(input, options.baseURL, options.encodingOverride, options.url, options.stateOverride);
		if (usm.failure) return "failure";
		return usm.url;
	};
	module.exports.setTheUsername = function(url, username) {
		url.username = "";
		const decoded = punycode.ucs2.decode(username);
		for (let i = 0; i < decoded.length; ++i) url.username += percentEncodeChar(decoded[i], isUserinfoPercentEncode);
	};
	module.exports.setThePassword = function(url, password) {
		url.password = "";
		const decoded = punycode.ucs2.decode(password);
		for (let i = 0; i < decoded.length; ++i) url.password += percentEncodeChar(decoded[i], isUserinfoPercentEncode);
	};
	module.exports.serializeHost = serializeHost;
	module.exports.cannotHaveAUsernamePasswordPort = cannotHaveAUsernamePasswordPort;
	module.exports.serializeInteger = function(integer) {
		return String(integer);
	};
	module.exports.parseURL = function(input, options) {
		if (options === void 0) options = {};
		return module.exports.basicURLParse(input, {
			baseURL: options.baseURL,
			encodingOverride: options.encodingOverride
		});
	};
}));
//#endregion
//#region node_modules/whatwg-url/lib/URL-impl.js
var require_URL_impl = /* @__PURE__ */ __commonJSMin(((exports) => {
	var usm = require_url_state_machine();
	exports.implementation = class URLImpl {
		constructor(constructorArgs) {
			const url = constructorArgs[0];
			const base = constructorArgs[1];
			let parsedBase = null;
			if (base !== void 0) {
				parsedBase = usm.basicURLParse(base);
				if (parsedBase === "failure") throw new TypeError("Invalid base URL");
			}
			const parsedURL = usm.basicURLParse(url, { baseURL: parsedBase });
			if (parsedURL === "failure") throw new TypeError("Invalid URL");
			this._url = parsedURL;
		}
		get href() {
			return usm.serializeURL(this._url);
		}
		set href(v) {
			const parsedURL = usm.basicURLParse(v);
			if (parsedURL === "failure") throw new TypeError("Invalid URL");
			this._url = parsedURL;
		}
		get origin() {
			return usm.serializeURLOrigin(this._url);
		}
		get protocol() {
			return this._url.scheme + ":";
		}
		set protocol(v) {
			usm.basicURLParse(v + ":", {
				url: this._url,
				stateOverride: "scheme start"
			});
		}
		get username() {
			return this._url.username;
		}
		set username(v) {
			if (usm.cannotHaveAUsernamePasswordPort(this._url)) return;
			usm.setTheUsername(this._url, v);
		}
		get password() {
			return this._url.password;
		}
		set password(v) {
			if (usm.cannotHaveAUsernamePasswordPort(this._url)) return;
			usm.setThePassword(this._url, v);
		}
		get host() {
			const url = this._url;
			if (url.host === null) return "";
			if (url.port === null) return usm.serializeHost(url.host);
			return usm.serializeHost(url.host) + ":" + usm.serializeInteger(url.port);
		}
		set host(v) {
			if (this._url.cannotBeABaseURL) return;
			usm.basicURLParse(v, {
				url: this._url,
				stateOverride: "host"
			});
		}
		get hostname() {
			if (this._url.host === null) return "";
			return usm.serializeHost(this._url.host);
		}
		set hostname(v) {
			if (this._url.cannotBeABaseURL) return;
			usm.basicURLParse(v, {
				url: this._url,
				stateOverride: "hostname"
			});
		}
		get port() {
			if (this._url.port === null) return "";
			return usm.serializeInteger(this._url.port);
		}
		set port(v) {
			if (usm.cannotHaveAUsernamePasswordPort(this._url)) return;
			if (v === "") this._url.port = null;
			else usm.basicURLParse(v, {
				url: this._url,
				stateOverride: "port"
			});
		}
		get pathname() {
			if (this._url.cannotBeABaseURL) return this._url.path[0];
			if (this._url.path.length === 0) return "";
			return "/" + this._url.path.join("/");
		}
		set pathname(v) {
			if (this._url.cannotBeABaseURL) return;
			this._url.path = [];
			usm.basicURLParse(v, {
				url: this._url,
				stateOverride: "path start"
			});
		}
		get search() {
			if (this._url.query === null || this._url.query === "") return "";
			return "?" + this._url.query;
		}
		set search(v) {
			const url = this._url;
			if (v === "") {
				url.query = null;
				return;
			}
			const input = v[0] === "?" ? v.substring(1) : v;
			url.query = "";
			usm.basicURLParse(input, {
				url,
				stateOverride: "query"
			});
		}
		get hash() {
			if (this._url.fragment === null || this._url.fragment === "") return "";
			return "#" + this._url.fragment;
		}
		set hash(v) {
			if (v === "") {
				this._url.fragment = null;
				return;
			}
			const input = v[0] === "#" ? v.substring(1) : v;
			this._url.fragment = "";
			usm.basicURLParse(input, {
				url: this._url,
				stateOverride: "fragment"
			});
		}
		toJSON() {
			return this.href;
		}
	};
}));
//#endregion
//#region node_modules/whatwg-url/lib/URL.js
var require_URL = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var conversions = require_lib();
	var utils = require_utils();
	var Impl = require_URL_impl();
	var impl = utils.implSymbol;
	function URL(url) {
		if (!this || this[impl] || !(this instanceof URL)) throw new TypeError("Failed to construct 'URL': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
		if (arguments.length < 1) throw new TypeError("Failed to construct 'URL': 1 argument required, but only " + arguments.length + " present.");
		const args = [];
		for (let i = 0; i < arguments.length && i < 2; ++i) args[i] = arguments[i];
		args[0] = conversions["USVString"](args[0]);
		if (args[1] !== void 0) args[1] = conversions["USVString"](args[1]);
		module.exports.setup(this, args);
	}
	URL.prototype.toJSON = function toJSON() {
		if (!this || !module.exports.is(this)) throw new TypeError("Illegal invocation");
		const args = [];
		for (let i = 0; i < arguments.length && i < 0; ++i) args[i] = arguments[i];
		return this[impl].toJSON.apply(this[impl], args);
	};
	Object.defineProperty(URL.prototype, "href", {
		get() {
			return this[impl].href;
		},
		set(V) {
			V = conversions["USVString"](V);
			this[impl].href = V;
		},
		enumerable: true,
		configurable: true
	});
	URL.prototype.toString = function() {
		if (!this || !module.exports.is(this)) throw new TypeError("Illegal invocation");
		return this.href;
	};
	Object.defineProperty(URL.prototype, "origin", {
		get() {
			return this[impl].origin;
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(URL.prototype, "protocol", {
		get() {
			return this[impl].protocol;
		},
		set(V) {
			V = conversions["USVString"](V);
			this[impl].protocol = V;
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(URL.prototype, "username", {
		get() {
			return this[impl].username;
		},
		set(V) {
			V = conversions["USVString"](V);
			this[impl].username = V;
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(URL.prototype, "password", {
		get() {
			return this[impl].password;
		},
		set(V) {
			V = conversions["USVString"](V);
			this[impl].password = V;
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(URL.prototype, "host", {
		get() {
			return this[impl].host;
		},
		set(V) {
			V = conversions["USVString"](V);
			this[impl].host = V;
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(URL.prototype, "hostname", {
		get() {
			return this[impl].hostname;
		},
		set(V) {
			V = conversions["USVString"](V);
			this[impl].hostname = V;
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(URL.prototype, "port", {
		get() {
			return this[impl].port;
		},
		set(V) {
			V = conversions["USVString"](V);
			this[impl].port = V;
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(URL.prototype, "pathname", {
		get() {
			return this[impl].pathname;
		},
		set(V) {
			V = conversions["USVString"](V);
			this[impl].pathname = V;
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(URL.prototype, "search", {
		get() {
			return this[impl].search;
		},
		set(V) {
			V = conversions["USVString"](V);
			this[impl].search = V;
		},
		enumerable: true,
		configurable: true
	});
	Object.defineProperty(URL.prototype, "hash", {
		get() {
			return this[impl].hash;
		},
		set(V) {
			V = conversions["USVString"](V);
			this[impl].hash = V;
		},
		enumerable: true,
		configurable: true
	});
	module.exports = {
		is(obj) {
			return !!obj && obj[impl] instanceof Impl.implementation;
		},
		create(constructorArgs, privateData) {
			let obj = Object.create(URL.prototype);
			this.setup(obj, constructorArgs, privateData);
			return obj;
		},
		setup(obj, constructorArgs, privateData) {
			if (!privateData) privateData = {};
			privateData.wrapper = obj;
			obj[impl] = new Impl.implementation(constructorArgs, privateData);
			obj[impl][utils.wrapperSymbol] = obj;
		},
		interface: URL,
		expose: {
			Window: { URL },
			Worker: { URL }
		}
	};
}));
//#endregion
//#region node_modules/whatwg-url/lib/public-api.js
var require_public_api = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.URL = require_URL().interface;
	exports.serializeURL = require_url_state_machine().serializeURL;
	exports.serializeURLOrigin = require_url_state_machine().serializeURLOrigin;
	exports.basicURLParse = require_url_state_machine().basicURLParse;
	exports.setTheUsername = require_url_state_machine().setTheUsername;
	exports.setThePassword = require_url_state_machine().setThePassword;
	exports.serializeHost = require_url_state_machine().serializeHost;
	exports.serializeInteger = require_url_state_machine().serializeInteger;
	exports.parseURL = require_url_state_machine().parseURL;
}));
//#endregion
//#region __vite-optional-peer-dep:encoding:node-fetch
var __vite_optional_peer_dep_encoding_node_fetch_exports = /* @__PURE__ */ __exportAll({ default: () => __vite_optional_peer_dep_encoding_node_fetch_default });
var __vite_optional_peer_dep_encoding_node_fetch_default;
var init___vite_optional_peer_dep_encoding_node_fetch = __esmMin((() => {
	__vite_optional_peer_dep_encoding_node_fetch_default = {};
	throw new Error(`Could not resolve "encoding" imported by "node-fetch". Is it installed?`);
}));
//#endregion
//#region node_modules/node-fetch/lib/index.mjs
var import_browser = /* @__PURE__ */ __toESM(require_browser());
var import_public_api = /* @__PURE__ */ __toESM(require_public_api(), 1);
var Readable$2 = Stream.Readable;
var BUFFER = Symbol("buffer");
var TYPE = Symbol("type");
var Blob$1 = class Blob$1 {
	constructor() {
		this[TYPE] = "";
		const blobParts = arguments[0];
		const options = arguments[1];
		const buffers = [];
		let size = 0;
		if (blobParts) {
			const a = blobParts;
			const length = Number(a.length);
			for (let i = 0; i < length; i++) {
				const element = a[i];
				let buffer;
				if (element instanceof Buffer) buffer = element;
				else if (ArrayBuffer.isView(element)) buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
				else if (element instanceof ArrayBuffer) buffer = Buffer.from(element);
				else if (element instanceof Blob$1) buffer = element[BUFFER];
				else buffer = Buffer.from(typeof element === "string" ? element : String(element));
				size += buffer.length;
				buffers.push(buffer);
			}
		}
		this[BUFFER] = Buffer.concat(buffers);
		let type = options && options.type !== void 0 && String(options.type).toLowerCase();
		if (type && !/[^\u0020-\u007E]/.test(type)) this[TYPE] = type;
	}
	get size() {
		return this[BUFFER].length;
	}
	get type() {
		return this[TYPE];
	}
	text() {
		return Promise.resolve(this[BUFFER].toString());
	}
	arrayBuffer() {
		const buf = this[BUFFER];
		const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		return Promise.resolve(ab);
	}
	stream() {
		const readable = new Readable$2();
		readable._read = function() {};
		readable.push(this[BUFFER]);
		readable.push(null);
		return readable;
	}
	toString() {
		return "[object Blob]";
	}
	slice() {
		const size = this.size;
		const start = arguments[0];
		const end = arguments[1];
		let relativeStart, relativeEnd;
		if (start === void 0) relativeStart = 0;
		else if (start < 0) relativeStart = Math.max(size + start, 0);
		else relativeStart = Math.min(start, size);
		if (end === void 0) relativeEnd = size;
		else if (end < 0) relativeEnd = Math.max(size + end, 0);
		else relativeEnd = Math.min(end, size);
		const span = Math.max(relativeEnd - relativeStart, 0);
		const slicedBuffer = this[BUFFER].slice(relativeStart, relativeStart + span);
		const blob = new Blob$1([], { type: arguments[2] });
		blob[BUFFER] = slicedBuffer;
		return blob;
	}
};
Object.defineProperties(Blob$1.prototype, {
	size: { enumerable: true },
	type: { enumerable: true },
	slice: { enumerable: true }
});
Object.defineProperty(Blob$1.prototype, Symbol.toStringTag, {
	value: "Blob",
	writable: false,
	enumerable: false,
	configurable: true
});
/**
* fetch-error.js
*
* FetchError interface for operational errors
*/
/**
* Create FetchError instance
*
* @param   String      message      Error message for human
* @param   String      type         Error type for machine
* @param   String      systemError  For Node.js system error
* @return  FetchError
*/
function FetchError(message, type, systemError) {
	Error.call(this, message);
	this.message = message;
	this.type = type;
	if (systemError) this.code = this.errno = systemError.code;
	Error.captureStackTrace(this, this.constructor);
}
FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;
FetchError.prototype.name = "FetchError";
var convert;
try {
	convert = (init___vite_optional_peer_dep_encoding_node_fetch(), __toCommonJS(__vite_optional_peer_dep_encoding_node_fetch_exports)).convert;
} catch (e) {}
var INTERNALS = Symbol("Body internals");
var PassThrough = Stream.PassThrough;
/**
* Body mixin
*
* Ref: https://fetch.spec.whatwg.org/#body
*
* @param   Stream  body  Readable stream
* @param   Object  opts  Response options
* @return  Void
*/
function Body(body) {
	var _this = this;
	var _ref = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, _ref$size = _ref.size;
	let size = _ref$size === void 0 ? 0 : _ref$size;
	var _ref$timeout = _ref.timeout;
	let timeout = _ref$timeout === void 0 ? 0 : _ref$timeout;
	if (body == null) body = null;
	else if (isURLSearchParams(body)) body = Buffer.from(body.toString());
	else if (isBlob(body));
	else if (Buffer.isBuffer(body));
	else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") body = Buffer.from(body);
	else if (ArrayBuffer.isView(body)) body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
	else if (body instanceof Stream);
	else body = Buffer.from(String(body));
	this[INTERNALS] = {
		body,
		disturbed: false,
		error: null
	};
	this.size = size;
	this.timeout = timeout;
	if (body instanceof Stream) body.on("error", function(err) {
		const error = err.name === "AbortError" ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, "system", err);
		_this[INTERNALS].error = error;
	});
}
Body.prototype = {
	get body() {
		return this[INTERNALS].body;
	},
	get bodyUsed() {
		return this[INTERNALS].disturbed;
	},
	/**
	* Decode response as ArrayBuffer
	*
	* @return  Promise
	*/
	arrayBuffer() {
		return consumeBody.call(this).then(function(buf) {
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		});
	},
	/**
	* Return raw response as Blob
	*
	* @return Promise
	*/
	blob() {
		let ct = this.headers && this.headers.get("content-type") || "";
		return consumeBody.call(this).then(function(buf) {
			return Object.assign(new Blob$1([], { type: ct.toLowerCase() }), { [BUFFER]: buf });
		});
	},
	/**
	* Decode response as json
	*
	* @return  Promise
	*/
	json() {
		var _this2 = this;
		return consumeBody.call(this).then(function(buffer) {
			try {
				return JSON.parse(buffer.toString());
			} catch (err) {
				return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, "invalid-json"));
			}
		});
	},
	/**
	* Decode response as text
	*
	* @return  Promise
	*/
	text() {
		return consumeBody.call(this).then(function(buffer) {
			return buffer.toString();
		});
	},
	/**
	* Decode response as buffer (non-spec api)
	*
	* @return  Promise
	*/
	buffer() {
		return consumeBody.call(this);
	},
	/**
	* Decode response as text, while automatically detecting the encoding and
	* trying to decode to UTF-8 (non-spec api)
	*
	* @return  Promise
	*/
	textConverted() {
		var _this3 = this;
		return consumeBody.call(this).then(function(buffer) {
			return convertBody(buffer, _this3.headers);
		});
	}
};
Object.defineProperties(Body.prototype, {
	body: { enumerable: true },
	bodyUsed: { enumerable: true },
	arrayBuffer: { enumerable: true },
	blob: { enumerable: true },
	json: { enumerable: true },
	text: { enumerable: true }
});
Body.mixIn = function(proto) {
	for (const name of Object.getOwnPropertyNames(Body.prototype))
 // istanbul ignore else: future proof
	if (!(name in proto)) {
		const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
		Object.defineProperty(proto, name, desc);
	}
};
/**
* Consume and convert an entire Body to a Buffer.
*
* Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
*
* @return  Promise
*/
function consumeBody() {
	var _this4 = this;
	if (this[INTERNALS].disturbed) return Body.Promise.reject(/* @__PURE__ */ new TypeError(`body used already for: ${this.url}`));
	this[INTERNALS].disturbed = true;
	if (this[INTERNALS].error) return Body.Promise.reject(this[INTERNALS].error);
	let body = this.body;
	if (body === null) return Body.Promise.resolve(Buffer.alloc(0));
	if (isBlob(body)) body = body.stream();
	if (Buffer.isBuffer(body)) return Body.Promise.resolve(body);
	// istanbul ignore if: should never happen
	if (!(body instanceof Stream)) return Body.Promise.resolve(Buffer.alloc(0));
	let accum = [];
	let accumBytes = 0;
	let abort = false;
	return new Body.Promise(function(resolve, reject) {
		let resTimeout;
		if (_this4.timeout) resTimeout = setTimeout(function() {
			abort = true;
			reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, "body-timeout"));
		}, _this4.timeout);
		body.on("error", function(err) {
			if (err.name === "AbortError") {
				abort = true;
				reject(err);
			} else reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, "system", err));
		});
		body.on("data", function(chunk) {
			if (abort || chunk === null) return;
			if (_this4.size && accumBytes + chunk.length > _this4.size) {
				abort = true;
				reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, "max-size"));
				return;
			}
			accumBytes += chunk.length;
			accum.push(chunk);
		});
		body.on("end", function() {
			if (abort) return;
			clearTimeout(resTimeout);
			try {
				resolve(Buffer.concat(accum, accumBytes));
			} catch (err) {
				reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, "system", err));
			}
		});
	});
}
/**
* Detect buffer encoding and convert to target encoding
* ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
*
* @param   Buffer  buffer    Incoming buffer
* @param   String  encoding  Target encoding
* @return  String
*/
function convertBody(buffer, headers) {
	if (typeof convert !== "function") throw new Error("The package `encoding` must be installed to use the textConverted() function");
	const ct = headers.get("content-type");
	let charset = "utf-8";
	let res, str;
	if (ct) res = /charset=([^;]*)/i.exec(ct);
	str = buffer.slice(0, 1024).toString();
	if (!res && str) res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
	if (!res && str) {
		res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);
		if (!res) {
			res = /<meta[\s]+?content=(['"])(.+?)\1[\s]+?http-equiv=(['"])content-type\3/i.exec(str);
			if (res) res.pop();
		}
		if (res) res = /charset=(.*)/i.exec(res.pop());
	}
	if (!res && str) res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
	if (res) {
		charset = res.pop();
		if (charset === "gb2312" || charset === "gbk") charset = "gb18030";
	}
	return convert(buffer, "UTF-8", charset).toString();
}
/**
* Detect a URLSearchParams object
* ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
*
* @param   Object  obj     Object to detect by type or brand
* @return  String
*/
function isURLSearchParams(obj) {
	if (typeof obj !== "object" || typeof obj.append !== "function" || typeof obj.delete !== "function" || typeof obj.get !== "function" || typeof obj.getAll !== "function" || typeof obj.has !== "function" || typeof obj.set !== "function") return false;
	return obj.constructor.name === "URLSearchParams" || Object.prototype.toString.call(obj) === "[object URLSearchParams]" || typeof obj.sort === "function";
}
/**
* Check if `obj` is a W3C `Blob` object (which `File` inherits from)
* @param  {*} obj
* @return {boolean}
*/
function isBlob(obj) {
	return typeof obj === "object" && typeof obj.arrayBuffer === "function" && typeof obj.type === "string" && typeof obj.stream === "function" && typeof obj.constructor === "function" && typeof obj.constructor.name === "string" && /^(Blob|File)$/.test(obj.constructor.name) && /^(Blob|File)$/.test(obj[Symbol.toStringTag]);
}
/**
* Clone body given Res/Req instance
*
* @param   Mixed  instance  Response or Request instance
* @return  Mixed
*/
function clone(instance) {
	let p1, p2;
	let body = instance.body;
	if (instance.bodyUsed) throw new Error("cannot clone body after it is used");
	if (body instanceof Stream && typeof body.getBoundary !== "function") {
		p1 = new PassThrough();
		p2 = new PassThrough();
		body.pipe(p1);
		body.pipe(p2);
		instance[INTERNALS].body = p1;
		body = p2;
	}
	return body;
}
/**
* Performs the operation "extract a `Content-Type` value from |object|" as
* specified in the specification:
* https://fetch.spec.whatwg.org/#concept-bodyinit-extract
*
* This function assumes that instance.body is present.
*
* @param   Mixed  instance  Any options.body input
*/
function extractContentType(body) {
	if (body === null) return null;
	else if (typeof body === "string") return "text/plain;charset=UTF-8";
	else if (isURLSearchParams(body)) return "application/x-www-form-urlencoded;charset=UTF-8";
	else if (isBlob(body)) return body.type || null;
	else if (Buffer.isBuffer(body)) return null;
	else if (Object.prototype.toString.call(body) === "[object ArrayBuffer]") return null;
	else if (ArrayBuffer.isView(body)) return null;
	else if (typeof body.getBoundary === "function") return `multipart/form-data;boundary=${body.getBoundary()}`;
	else if (body instanceof Stream) return null;
	else return "text/plain;charset=UTF-8";
}
/**
* The Fetch Standard treats this as if "total bytes" is a property on the body.
* For us, we have to explicitly get it with a function.
*
* ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
*
* @param   Body    instance   Instance of Body
* @return  Number?            Number of bytes, or null if not possible
*/
function getTotalBytes(instance) {
	const body = instance.body;
	if (body === null) return 0;
	else if (isBlob(body)) return body.size;
	else if (Buffer.isBuffer(body)) return body.length;
	else if (body && typeof body.getLengthSync === "function") {
		if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || body.hasKnownLength && body.hasKnownLength()) return body.getLengthSync();
		return null;
	} else return null;
}
/**
* Write a Body to a Node.js WritableStream (e.g. http.Request) object.
*
* @param   Body    instance   Instance of Body
* @return  Void
*/
function writeToStream(dest, instance) {
	const body = instance.body;
	if (body === null) dest.end();
	else if (isBlob(body)) body.stream().pipe(dest);
	else if (Buffer.isBuffer(body)) {
		dest.write(body);
		dest.end();
	} else body.pipe(dest);
}
Body.Promise = global.Promise;
/**
* headers.js
*
* Headers class offers convenient helpers
*/
var invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
var invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;
function validateName(name) {
	name = `${name}`;
	if (invalidTokenRegex.test(name) || name === "") throw new TypeError(`${name} is not a legal HTTP header name`);
}
function validateValue(value) {
	value = `${value}`;
	if (invalidHeaderCharRegex.test(value)) throw new TypeError(`${value} is not a legal HTTP header value`);
}
/**
* Find the key in the map object given a header name.
*
* Returns undefined if not found.
*
* @param   String  name  Header name
* @return  String|Undefined
*/
function find(map, name) {
	name = name.toLowerCase();
	for (const key in map) if (key.toLowerCase() === name) return key;
}
var MAP = Symbol("map");
var Headers = class Headers {
	/**
	* Headers class
	*
	* @param   Object  headers  Response headers
	* @return  Void
	*/
	constructor() {
		let init = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : void 0;
		this[MAP] = Object.create(null);
		if (init instanceof Headers) {
			const rawHeaders = init.raw();
			const headerNames = Object.keys(rawHeaders);
			for (const headerName of headerNames) for (const value of rawHeaders[headerName]) this.append(headerName, value);
			return;
		}
		if (init == null);
		else if (typeof init === "object") {
			const method = init[Symbol.iterator];
			if (method != null) {
				if (typeof method !== "function") throw new TypeError("Header pairs must be iterable");
				const pairs = [];
				for (const pair of init) {
					if (typeof pair !== "object" || typeof pair[Symbol.iterator] !== "function") throw new TypeError("Each header pair must be iterable");
					pairs.push(Array.from(pair));
				}
				for (const pair of pairs) {
					if (pair.length !== 2) throw new TypeError("Each header pair must be a name/value tuple");
					this.append(pair[0], pair[1]);
				}
			} else for (const key of Object.keys(init)) {
				const value = init[key];
				this.append(key, value);
			}
		} else throw new TypeError("Provided initializer must be an object");
	}
	/**
	* Return combined header value given name
	*
	* @param   String  name  Header name
	* @return  Mixed
	*/
	get(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key === void 0) return null;
		return this[MAP][key].join(", ");
	}
	/**
	* Iterate over all headers
	*
	* @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
	* @param   Boolean   thisArg   `this` context for callback function
	* @return  Void
	*/
	forEach(callback) {
		let thisArg = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : void 0;
		let pairs = getHeaders(this);
		let i = 0;
		while (i < pairs.length) {
			var _pairs$i = pairs[i];
			const name = _pairs$i[0], value = _pairs$i[1];
			callback.call(thisArg, value, name, this);
			pairs = getHeaders(this);
			i++;
		}
	}
	/**
	* Overwrite header values given name
	*
	* @param   String  name   Header name
	* @param   String  value  Header value
	* @return  Void
	*/
	set(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		this[MAP][key !== void 0 ? key : name] = [value];
	}
	/**
	* Append a value onto existing header
	*
	* @param   String  name   Header name
	* @param   String  value  Header value
	* @return  Void
	*/
	append(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		if (key !== void 0) this[MAP][key].push(value);
		else this[MAP][name] = [value];
	}
	/**
	* Check for header name existence
	*
	* @param   String   name  Header name
	* @return  Boolean
	*/
	has(name) {
		name = `${name}`;
		validateName(name);
		return find(this[MAP], name) !== void 0;
	}
	/**
	* Delete all header values given name
	*
	* @param   String  name  Header name
	* @return  Void
	*/
	delete(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key !== void 0) delete this[MAP][key];
	}
	/**
	* Return raw headers (non-spec api)
	*
	* @return  Object
	*/
	raw() {
		return this[MAP];
	}
	/**
	* Get an iterator on keys.
	*
	* @return  Iterator
	*/
	keys() {
		return createHeadersIterator(this, "key");
	}
	/**
	* Get an iterator on values.
	*
	* @return  Iterator
	*/
	values() {
		return createHeadersIterator(this, "value");
	}
	/**
	* Get an iterator on entries.
	*
	* This is the default iterator of the Headers object.
	*
	* @return  Iterator
	*/
	[Symbol.iterator]() {
		return createHeadersIterator(this, "key+value");
	}
};
Headers.prototype.entries = Headers.prototype[Symbol.iterator];
Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
	value: "Headers",
	writable: false,
	enumerable: false,
	configurable: true
});
Object.defineProperties(Headers.prototype, {
	get: { enumerable: true },
	forEach: { enumerable: true },
	set: { enumerable: true },
	append: { enumerable: true },
	has: { enumerable: true },
	delete: { enumerable: true },
	keys: { enumerable: true },
	values: { enumerable: true },
	entries: { enumerable: true }
});
function getHeaders(headers) {
	let kind = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "key+value";
	return Object.keys(headers[MAP]).sort().map(kind === "key" ? function(k) {
		return k.toLowerCase();
	} : kind === "value" ? function(k) {
		return headers[MAP][k].join(", ");
	} : function(k) {
		return [k.toLowerCase(), headers[MAP][k].join(", ")];
	});
}
var INTERNAL = Symbol("internal");
function createHeadersIterator(target, kind) {
	const iterator = Object.create(HeadersIteratorPrototype);
	iterator[INTERNAL] = {
		target,
		kind,
		index: 0
	};
	return iterator;
}
var HeadersIteratorPrototype = Object.setPrototypeOf({ next() {
	// istanbul ignore if
	if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) throw new TypeError("Value of `this` is not a HeadersIterator");
	var _INTERNAL = this[INTERNAL];
	const target = _INTERNAL.target, kind = _INTERNAL.kind, index = _INTERNAL.index;
	const values = getHeaders(target, kind);
	if (index >= values.length) return {
		value: void 0,
		done: true
	};
	this[INTERNAL].index = index + 1;
	return {
		value: values[index],
		done: false
	};
} }, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));
Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
	value: "HeadersIterator",
	writable: false,
	enumerable: false,
	configurable: true
});
/**
* Export the Headers object in a form that Node.js can consume.
*
* @param   Headers  headers
* @return  Object
*/
function exportNodeCompatibleHeaders(headers) {
	const obj = Object.assign({ __proto__: null }, headers[MAP]);
	const hostHeaderKey = find(headers[MAP], "Host");
	if (hostHeaderKey !== void 0) obj[hostHeaderKey] = obj[hostHeaderKey][0];
	return obj;
}
/**
* Create a Headers object from an object of headers, ignoring those that do
* not conform to HTTP grammar productions.
*
* @param   Object  obj  Object of headers
* @return  Headers
*/
function createHeadersLenient(obj) {
	const headers = new Headers();
	for (const name of Object.keys(obj)) {
		if (invalidTokenRegex.test(name)) continue;
		if (Array.isArray(obj[name])) for (const val of obj[name]) {
			if (invalidHeaderCharRegex.test(val)) continue;
			if (headers[MAP][name] === void 0) headers[MAP][name] = [val];
			else headers[MAP][name].push(val);
		}
		else if (!invalidHeaderCharRegex.test(obj[name])) headers[MAP][name] = [obj[name]];
	}
	return headers;
}
var INTERNALS$1 = Symbol("Response internals");
var STATUS_CODES = http.STATUS_CODES;
/**
* Response class
*
* @param   Stream  body  Readable stream
* @param   Object  opts  Response options
* @return  Void
*/
var Response = class Response {
	constructor() {
		let body = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : null;
		let opts = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		Body.call(this, body, opts);
		const status = opts.status || 200;
		const headers = new Headers(opts.headers);
		if (body != null && !headers.has("Content-Type")) {
			const contentType = extractContentType(body);
			if (contentType) headers.append("Content-Type", contentType);
		}
		this[INTERNALS$1] = {
			url: opts.url,
			status,
			statusText: opts.statusText || STATUS_CODES[status],
			headers,
			counter: opts.counter
		};
	}
	get url() {
		return this[INTERNALS$1].url || "";
	}
	get status() {
		return this[INTERNALS$1].status;
	}
	/**
	* Convenience property representing if the request ended normally
	*/
	get ok() {
		return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
	}
	get redirected() {
		return this[INTERNALS$1].counter > 0;
	}
	get statusText() {
		return this[INTERNALS$1].statusText;
	}
	get headers() {
		return this[INTERNALS$1].headers;
	}
	/**
	* Clone this response
	*
	* @return  Response
	*/
	clone() {
		return new Response(clone(this), {
			url: this.url,
			status: this.status,
			statusText: this.statusText,
			headers: this.headers,
			ok: this.ok,
			redirected: this.redirected
		});
	}
};
Body.mixIn(Response.prototype);
Object.defineProperties(Response.prototype, {
	url: { enumerable: true },
	status: { enumerable: true },
	ok: { enumerable: true },
	redirected: { enumerable: true },
	statusText: { enumerable: true },
	headers: { enumerable: true },
	clone: { enumerable: true }
});
Object.defineProperty(Response.prototype, Symbol.toStringTag, {
	value: "Response",
	writable: false,
	enumerable: false,
	configurable: true
});
var INTERNALS$2 = Symbol("Request internals");
var URL$1 = Url.URL || import_public_api.URL;
var parse_url = Url.parse;
var format_url = Url.format;
/**
* Wrapper around `new URL` to handle arbitrary URLs
*
* @param  {string} urlStr
* @return {void}
*/
function parseURL(urlStr) {
	if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.exec(urlStr)) urlStr = new URL$1(urlStr).toString();
	return parse_url(urlStr);
}
var streamDestructionSupported = "destroy" in Stream.Readable.prototype;
/**
* Check if a value is an instance of Request.
*
* @param   Mixed   input
* @return  Boolean
*/
function isRequest(input) {
	return typeof input === "object" && typeof input[INTERNALS$2] === "object";
}
function isAbortSignal(signal) {
	const proto = signal && typeof signal === "object" && Object.getPrototypeOf(signal);
	return !!(proto && proto.constructor.name === "AbortSignal");
}
/**
* Request class
*
* @param   Mixed   input  Url or Request instance
* @param   Object  init   Custom options
* @return  Void
*/
var Request = class Request {
	constructor(input) {
		let init = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
		let parsedURL;
		if (!isRequest(input)) {
			if (input && input.href) parsedURL = parseURL(input.href);
			else parsedURL = parseURL(`${input}`);
			input = {};
		} else parsedURL = parseURL(input.url);
		let method = init.method || input.method || "GET";
		method = method.toUpperCase();
		if ((init.body != null || isRequest(input) && input.body !== null) && (method === "GET" || method === "HEAD")) throw new TypeError("Request with GET/HEAD method cannot have body");
		let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;
		Body.call(this, inputBody, {
			timeout: init.timeout || input.timeout || 0,
			size: init.size || input.size || 0
		});
		const headers = new Headers(init.headers || input.headers || {});
		if (inputBody != null && !headers.has("Content-Type")) {
			const contentType = extractContentType(inputBody);
			if (contentType) headers.append("Content-Type", contentType);
		}
		let signal = isRequest(input) ? input.signal : null;
		if ("signal" in init) signal = init.signal;
		if (signal != null && !isAbortSignal(signal)) throw new TypeError("Expected signal to be an instanceof AbortSignal");
		this[INTERNALS$2] = {
			method,
			redirect: init.redirect || input.redirect || "follow",
			headers,
			parsedURL,
			signal
		};
		this.follow = init.follow !== void 0 ? init.follow : input.follow !== void 0 ? input.follow : 20;
		this.compress = init.compress !== void 0 ? init.compress : input.compress !== void 0 ? input.compress : true;
		this.counter = init.counter || input.counter || 0;
		this.agent = init.agent || input.agent;
	}
	get method() {
		return this[INTERNALS$2].method;
	}
	get url() {
		return format_url(this[INTERNALS$2].parsedURL);
	}
	get headers() {
		return this[INTERNALS$2].headers;
	}
	get redirect() {
		return this[INTERNALS$2].redirect;
	}
	get signal() {
		return this[INTERNALS$2].signal;
	}
	/**
	* Clone this request
	*
	* @return  Request
	*/
	clone() {
		return new Request(this);
	}
};
Body.mixIn(Request.prototype);
Object.defineProperty(Request.prototype, Symbol.toStringTag, {
	value: "Request",
	writable: false,
	enumerable: false,
	configurable: true
});
Object.defineProperties(Request.prototype, {
	method: { enumerable: true },
	url: { enumerable: true },
	headers: { enumerable: true },
	redirect: { enumerable: true },
	clone: { enumerable: true },
	signal: { enumerable: true }
});
/**
* Convert a Request to Node.js http request options.
*
* @param   Request  A Request instance
* @return  Object   The options object to be passed to http.request
*/
function getNodeRequestOptions(request) {
	const parsedURL = request[INTERNALS$2].parsedURL;
	const headers = new Headers(request[INTERNALS$2].headers);
	if (!headers.has("Accept")) headers.set("Accept", "*/*");
	if (!parsedURL.protocol || !parsedURL.hostname) throw new TypeError("Only absolute URLs are supported");
	if (!/^https?:$/.test(parsedURL.protocol)) throw new TypeError("Only HTTP(S) protocols are supported");
	if (request.signal && request.body instanceof Stream.Readable && !streamDestructionSupported) throw new Error("Cancellation of streamed requests with AbortSignal is not supported in node < 8");
	let contentLengthValue = null;
	if (request.body == null && /^(POST|PUT)$/i.test(request.method)) contentLengthValue = "0";
	if (request.body != null) {
		const totalBytes = getTotalBytes(request);
		if (typeof totalBytes === "number") contentLengthValue = String(totalBytes);
	}
	if (contentLengthValue) headers.set("Content-Length", contentLengthValue);
	if (!headers.has("User-Agent")) headers.set("User-Agent", "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)");
	if (request.compress && !headers.has("Accept-Encoding")) headers.set("Accept-Encoding", "gzip,deflate");
	let agent = request.agent;
	if (typeof agent === "function") agent = agent(parsedURL);
	return Object.assign({}, parsedURL, {
		method: request.method,
		headers: exportNodeCompatibleHeaders(headers),
		agent
	});
}
/**
* abort-error.js
*
* AbortError interface for cancelled requests
*/
/**
* Create AbortError instance
*
* @param   String      message      Error message for human
* @return  AbortError
*/
function AbortError(message) {
	Error.call(this, message);
	this.type = "aborted";
	this.message = message;
	Error.captureStackTrace(this, this.constructor);
}
AbortError.prototype = Object.create(Error.prototype);
AbortError.prototype.constructor = AbortError;
AbortError.prototype.name = "AbortError";
var URL$1$1 = Url.URL || import_public_api.URL;
var PassThrough$1 = Stream.PassThrough;
var isDomainOrSubdomain = function isDomainOrSubdomain(destination, original) {
	const orig = new URL$1$1(original).hostname;
	const dest = new URL$1$1(destination).hostname;
	return orig === dest || orig[orig.length - dest.length - 1] === "." && orig.endsWith(dest);
};
/**
* isSameProtocol reports whether the two provided URLs use the same protocol.
*
* Both domains must already be in canonical form.
* @param {string|URL} original
* @param {string|URL} destination
*/
var isSameProtocol = function isSameProtocol(destination, original) {
	return new URL$1$1(original).protocol === new URL$1$1(destination).protocol;
};
/**
* Fetch function
*
* @param   Mixed    url   Absolute url or Request instance
* @param   Object   opts  Fetch options
* @return  Promise
*/
function fetch(url, opts) {
	if (!fetch.Promise) throw new Error("native promise missing, set fetch.Promise to your favorite alternative");
	Body.Promise = fetch.Promise;
	return new fetch.Promise(function(resolve, reject) {
		const request = new Request(url, opts);
		const options = getNodeRequestOptions(request);
		const send = (options.protocol === "https:" ? https : http).request;
		const signal = request.signal;
		let response = null;
		const abort = function abort() {
			let error = new AbortError("The user aborted a request.");
			reject(error);
			if (request.body && request.body instanceof Stream.Readable) destroyStream(request.body, error);
			if (!response || !response.body) return;
			response.body.emit("error", error);
		};
		if (signal && signal.aborted) {
			abort();
			return;
		}
		const abortAndFinalize = function abortAndFinalize() {
			abort();
			finalize();
		};
		const req = send(options);
		let reqTimeout;
		if (signal) signal.addEventListener("abort", abortAndFinalize);
		function finalize() {
			req.abort();
			if (signal) signal.removeEventListener("abort", abortAndFinalize);
			clearTimeout(reqTimeout);
		}
		if (request.timeout) req.once("socket", function(socket) {
			reqTimeout = setTimeout(function() {
				reject(new FetchError(`network timeout at: ${request.url}`, "request-timeout"));
				finalize();
			}, request.timeout);
		});
		req.on("error", function(err) {
			reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
			if (response && response.body) destroyStream(response.body, err);
			finalize();
		});
		fixResponseChunkedTransferBadEnding(req, function(err) {
			if (signal && signal.aborted) return;
			if (response && response.body) destroyStream(response.body, err);
		});
		/* c8 ignore next 18 */
		if (parseInt(process.version.substring(1)) < 14) req.on("socket", function(s) {
			s.addListener("close", function(hadError) {
				const hasDataListener = s.listenerCount("data") > 0;
				if (response && hasDataListener && !hadError && !(signal && signal.aborted)) {
					const err = /* @__PURE__ */ new Error("Premature close");
					err.code = "ERR_STREAM_PREMATURE_CLOSE";
					response.body.emit("error", err);
				}
			});
		});
		req.on("response", function(res) {
			clearTimeout(reqTimeout);
			const headers = createHeadersLenient(res.headers);
			if (fetch.isRedirect(res.statusCode)) {
				const location = headers.get("Location");
				let locationURL = null;
				try {
					locationURL = location === null ? null : new URL$1$1(location, request.url).toString();
				} catch (err) {
					if (request.redirect !== "manual") {
						reject(new FetchError(`uri requested responds with an invalid redirect URL: ${location}`, "invalid-redirect"));
						finalize();
						return;
					}
				}
				switch (request.redirect) {
					case "error":
						reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
						finalize();
						return;
					case "manual":
						if (locationURL !== null) try {
							headers.set("Location", locationURL);
						} catch (err) {
							// istanbul ignore next: nodejs server prevent invalid response headers, we can't test this through normal request
							reject(err);
						}
						break;
					case "follow":
						if (locationURL === null) break;
						if (request.counter >= request.follow) {
							reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
							finalize();
							return;
						}
						const requestOpts = {
							headers: new Headers(request.headers),
							follow: request.follow,
							counter: request.counter + 1,
							agent: request.agent,
							compress: request.compress,
							method: request.method,
							body: request.body,
							signal: request.signal,
							timeout: request.timeout,
							size: request.size
						};
						if (!isDomainOrSubdomain(request.url, locationURL) || !isSameProtocol(request.url, locationURL)) for (const name of [
							"authorization",
							"www-authenticate",
							"cookie",
							"cookie2"
						]) requestOpts.headers.delete(name);
						if (res.statusCode !== 303 && request.body && getTotalBytes(request) === null) {
							reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
							finalize();
							return;
						}
						if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === "POST") {
							requestOpts.method = "GET";
							requestOpts.body = void 0;
							requestOpts.headers.delete("content-length");
						}
						resolve(fetch(new Request(locationURL, requestOpts)));
						finalize();
						return;
				}
			}
			res.once("end", function() {
				if (signal) signal.removeEventListener("abort", abortAndFinalize);
			});
			let body = res.pipe(new PassThrough$1());
			const response_options = {
				url: request.url,
				status: res.statusCode,
				statusText: res.statusMessage,
				headers,
				size: request.size,
				timeout: request.timeout,
				counter: request.counter
			};
			const codings = headers.get("Content-Encoding");
			if (!request.compress || request.method === "HEAD" || codings === null || res.statusCode === 204 || res.statusCode === 304) {
				response = new Response(body, response_options);
				resolve(response);
				return;
			}
			const zlibOptions = {
				flush: zlib.Z_SYNC_FLUSH,
				finishFlush: zlib.Z_SYNC_FLUSH
			};
			if (codings == "gzip" || codings == "x-gzip") {
				body = body.pipe(zlib.createGunzip(zlibOptions));
				response = new Response(body, response_options);
				resolve(response);
				return;
			}
			if (codings == "deflate" || codings == "x-deflate") {
				const raw = res.pipe(new PassThrough$1());
				raw.once("data", function(chunk) {
					if ((chunk[0] & 15) === 8) body = body.pipe(zlib.createInflate());
					else body = body.pipe(zlib.createInflateRaw());
					response = new Response(body, response_options);
					resolve(response);
				});
				raw.on("end", function() {
					if (!response) {
						response = new Response(body, response_options);
						resolve(response);
					}
				});
				return;
			}
			if (codings == "br" && typeof zlib.createBrotliDecompress === "function") {
				body = body.pipe(zlib.createBrotliDecompress());
				response = new Response(body, response_options);
				resolve(response);
				return;
			}
			response = new Response(body, response_options);
			resolve(response);
		});
		writeToStream(req, request);
	});
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
	let socket;
	request.on("socket", function(s) {
		socket = s;
	});
	request.on("response", function(response) {
		const headers = response.headers;
		if (headers["transfer-encoding"] === "chunked" && !headers["content-length"]) response.once("close", function(hadError) {
			if (socket && socket.listenerCount("data") > 0 && !hadError) {
				const err = /* @__PURE__ */ new Error("Premature close");
				err.code = "ERR_STREAM_PREMATURE_CLOSE";
				errorCallback(err);
			}
		});
	});
}
function destroyStream(stream, err) {
	if (stream.destroy) stream.destroy(err);
	else {
		stream.emit("error", err);
		stream.end();
	}
}
/**
* Redirect code matching
*
* @param   Number   code  Status code
* @return  Boolean
*/
fetch.isRedirect = function(code) {
	return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
};
fetch.Promise = global.Promise;
//#endregion
//#region node_modules/ws/lib/constants.js
var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var BINARY_TYPES = [
		"nodebuffer",
		"arraybuffer",
		"fragments"
	];
	var hasBlob = typeof Blob !== "undefined";
	if (hasBlob) BINARY_TYPES.push("blob");
	module.exports = {
		BINARY_TYPES,
		CLOSE_TIMEOUT: 3e4,
		EMPTY_BUFFER: Buffer.alloc(0),
		GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
		hasBlob,
		kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
		kListener: Symbol("kListener"),
		kStatusCode: Symbol("status-code"),
		kWebSocket: Symbol("websocket"),
		NOOP: () => {}
	};
}));
//#endregion
//#region node_modules/ws/lib/buffer-util.js
var require_buffer_util = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { EMPTY_BUFFER } = require_constants();
	var FastBuffer = Buffer[Symbol.species];
	/**
	* Merges an array of buffers into a new buffer.
	*
	* @param {Buffer[]} list The array of buffers to concat
	* @param {Number} totalLength The total length of buffers in the list
	* @return {Buffer} The resulting buffer
	* @public
	*/
	function concat(list, totalLength) {
		if (list.length === 0) return EMPTY_BUFFER;
		if (list.length === 1) return list[0];
		const target = Buffer.allocUnsafe(totalLength);
		let offset = 0;
		for (let i = 0; i < list.length; i++) {
			const buf = list[i];
			target.set(buf, offset);
			offset += buf.length;
		}
		if (offset < totalLength) return new FastBuffer(target.buffer, target.byteOffset, offset);
		return target;
	}
	/**
	* Masks a buffer using the given mask.
	*
	* @param {Buffer} source The buffer to mask
	* @param {Buffer} mask The mask to use
	* @param {Buffer} output The buffer where to store the result
	* @param {Number} offset The offset at which to start writing
	* @param {Number} length The number of bytes to mask.
	* @public
	*/
	function _mask(source, mask, output, offset, length) {
		for (let i = 0; i < length; i++) output[offset + i] = source[i] ^ mask[i & 3];
	}
	/**
	* Unmasks a buffer using the given mask.
	*
	* @param {Buffer} buffer The buffer to unmask
	* @param {Buffer} mask The mask to use
	* @public
	*/
	function _unmask(buffer, mask) {
		for (let i = 0; i < buffer.length; i++) buffer[i] ^= mask[i & 3];
	}
	/**
	* Converts a buffer to an `ArrayBuffer`.
	*
	* @param {Buffer} buf The buffer to convert
	* @return {ArrayBuffer} Converted buffer
	* @public
	*/
	function toArrayBuffer(buf) {
		if (buf.length === buf.buffer.byteLength) return buf.buffer;
		return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
	}
	/**
	* Converts `data` to a `Buffer`.
	*
	* @param {*} data The data to convert
	* @return {Buffer} The buffer
	* @throws {TypeError}
	* @public
	*/
	function toBuffer(data) {
		toBuffer.readOnly = true;
		if (Buffer.isBuffer(data)) return data;
		let buf;
		if (data instanceof ArrayBuffer) buf = new FastBuffer(data);
		else if (ArrayBuffer.isView(data)) buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
		else {
			buf = Buffer.from(data);
			toBuffer.readOnly = false;
		}
		return buf;
	}
	module.exports = {
		concat,
		mask: _mask,
		toArrayBuffer,
		toBuffer,
		unmask: _unmask
	};
	/* istanbul ignore else  */
	if (!process.env.WS_NO_BUFFER_UTIL) try {
		const bufferUtil = __require("bufferutil");
		module.exports.mask = function(source, mask, output, offset, length) {
			if (length < 48) _mask(source, mask, output, offset, length);
			else bufferUtil.mask(source, mask, output, offset, length);
		};
		module.exports.unmask = function(buffer, mask) {
			if (buffer.length < 32) _unmask(buffer, mask);
			else bufferUtil.unmask(buffer, mask);
		};
	} catch (e) {}
}));
//#endregion
//#region node_modules/ws/lib/limiter.js
var require_limiter = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var kDone = Symbol("kDone");
	var kRun = Symbol("kRun");
	/**
	* A very simple job queue with adjustable concurrency. Adapted from
	* https://github.com/STRML/async-limiter
	*/
	var Limiter = class {
		/**
		* Creates a new `Limiter`.
		*
		* @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
		*     to run concurrently
		*/
		constructor(concurrency) {
			this[kDone] = () => {
				this.pending--;
				this[kRun]();
			};
			this.concurrency = concurrency || Infinity;
			this.jobs = [];
			this.pending = 0;
		}
		/**
		* Adds a job to the queue.
		*
		* @param {Function} job The job to run
		* @public
		*/
		add(job) {
			this.jobs.push(job);
			this[kRun]();
		}
		/**
		* Removes a job from the queue and runs it if possible.
		*
		* @private
		*/
		[kRun]() {
			if (this.pending === this.concurrency) return;
			if (this.jobs.length) {
				const job = this.jobs.shift();
				this.pending++;
				job(this[kDone]);
			}
		}
	};
	module.exports = Limiter;
}));
//#endregion
//#region node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var zlib$1 = __require("zlib");
	var bufferUtil = require_buffer_util();
	var Limiter = require_limiter();
	var { kStatusCode } = require_constants();
	var FastBuffer = Buffer[Symbol.species];
	var TRAILER = Buffer.from([
		0,
		0,
		255,
		255
	]);
	var kPerMessageDeflate = Symbol("permessage-deflate");
	var kTotalLength = Symbol("total-length");
	var kCallback = Symbol("callback");
	var kBuffers = Symbol("buffers");
	var kError = Symbol("error");
	var zlibLimiter;
	/**
	* permessage-deflate implementation.
	*/
	var PerMessageDeflate = class {
		/**
		* Creates a PerMessageDeflate instance.
		*
		* @param {Object} [options] Configuration options
		* @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
		*     for, or request, a custom client window size
		* @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
		*     acknowledge disabling of client context takeover
		* @param {Number} [options.concurrencyLimit=10] The number of concurrent
		*     calls to zlib
		* @param {Boolean} [options.isServer=false] Create the instance in either
		*     server or client mode
		* @param {Number} [options.maxPayload=0] The maximum allowed message length
		* @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
		*     use of a custom server window size
		* @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
		*     disabling of server context takeover
		* @param {Number} [options.threshold=1024] Size (in bytes) below which
		*     messages should not be compressed if context takeover is disabled
		* @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
		*     deflate
		* @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
		*     inflate
		*/
		constructor(options) {
			this._options = options || {};
			this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
			this._maxPayload = this._options.maxPayload | 0;
			this._isServer = !!this._options.isServer;
			this._deflate = null;
			this._inflate = null;
			this.params = null;
			if (!zlibLimiter) zlibLimiter = new Limiter(this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10);
		}
		/**
		* @type {String}
		*/
		static get extensionName() {
			return "permessage-deflate";
		}
		/**
		* Create an extension negotiation offer.
		*
		* @return {Object} Extension parameters
		* @public
		*/
		offer() {
			const params = {};
			if (this._options.serverNoContextTakeover) params.server_no_context_takeover = true;
			if (this._options.clientNoContextTakeover) params.client_no_context_takeover = true;
			if (this._options.serverMaxWindowBits) params.server_max_window_bits = this._options.serverMaxWindowBits;
			if (this._options.clientMaxWindowBits) params.client_max_window_bits = this._options.clientMaxWindowBits;
			else if (this._options.clientMaxWindowBits == null) params.client_max_window_bits = true;
			return params;
		}
		/**
		* Accept an extension negotiation offer/response.
		*
		* @param {Array} configurations The extension negotiation offers/reponse
		* @return {Object} Accepted configuration
		* @public
		*/
		accept(configurations) {
			configurations = this.normalizeParams(configurations);
			this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
			return this.params;
		}
		/**
		* Releases all resources used by the extension.
		*
		* @public
		*/
		cleanup() {
			if (this._inflate) {
				this._inflate.close();
				this._inflate = null;
			}
			if (this._deflate) {
				const callback = this._deflate[kCallback];
				this._deflate.close();
				this._deflate = null;
				if (callback) callback(/* @__PURE__ */ new Error("The deflate stream was closed while data was being processed"));
			}
		}
		/**
		*  Accept an extension negotiation offer.
		*
		* @param {Array} offers The extension negotiation offers
		* @return {Object} Accepted configuration
		* @private
		*/
		acceptAsServer(offers) {
			const opts = this._options;
			const accepted = offers.find((params) => {
				if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) return false;
				return true;
			});
			if (!accepted) throw new Error("None of the extension offers can be accepted");
			if (opts.serverNoContextTakeover) accepted.server_no_context_takeover = true;
			if (opts.clientNoContextTakeover) accepted.client_no_context_takeover = true;
			if (typeof opts.serverMaxWindowBits === "number") accepted.server_max_window_bits = opts.serverMaxWindowBits;
			if (typeof opts.clientMaxWindowBits === "number") accepted.client_max_window_bits = opts.clientMaxWindowBits;
			else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) delete accepted.client_max_window_bits;
			return accepted;
		}
		/**
		* Accept the extension negotiation response.
		*
		* @param {Array} response The extension negotiation response
		* @return {Object} Accepted configuration
		* @private
		*/
		acceptAsClient(response) {
			const params = response[0];
			if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) throw new Error("Unexpected parameter \"client_no_context_takeover\"");
			if (!params.client_max_window_bits) {
				if (typeof this._options.clientMaxWindowBits === "number") params.client_max_window_bits = this._options.clientMaxWindowBits;
			} else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) throw new Error("Unexpected or invalid parameter \"client_max_window_bits\"");
			return params;
		}
		/**
		* Normalize parameters.
		*
		* @param {Array} configurations The extension negotiation offers/reponse
		* @return {Array} The offers/response with normalized parameters
		* @private
		*/
		normalizeParams(configurations) {
			configurations.forEach((params) => {
				Object.keys(params).forEach((key) => {
					let value = params[key];
					if (value.length > 1) throw new Error(`Parameter "${key}" must have only a single value`);
					value = value[0];
					if (key === "client_max_window_bits") {
						if (value !== true) {
							const num = +value;
							if (!Number.isInteger(num) || num < 8 || num > 15) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
							value = num;
						} else if (!this._isServer) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
					} else if (key === "server_max_window_bits") {
						const num = +value;
						if (!Number.isInteger(num) || num < 8 || num > 15) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
						value = num;
					} else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
						if (value !== true) throw new TypeError(`Invalid value for parameter "${key}": ${value}`);
					} else throw new Error(`Unknown parameter "${key}"`);
					params[key] = value;
				});
			});
			return configurations;
		}
		/**
		* Decompress data. Concurrency limited.
		*
		* @param {Buffer} data Compressed data
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @public
		*/
		decompress(data, fin, callback) {
			zlibLimiter.add((done) => {
				this._decompress(data, fin, (err, result) => {
					done();
					callback(err, result);
				});
			});
		}
		/**
		* Compress data. Concurrency limited.
		*
		* @param {(Buffer|String)} data Data to compress
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @public
		*/
		compress(data, fin, callback) {
			zlibLimiter.add((done) => {
				this._compress(data, fin, (err, result) => {
					done();
					callback(err, result);
				});
			});
		}
		/**
		* Decompress data.
		*
		* @param {Buffer} data Compressed data
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @private
		*/
		_decompress(data, fin, callback) {
			const endpoint = this._isServer ? "client" : "server";
			if (!this._inflate) {
				const key = `${endpoint}_max_window_bits`;
				const windowBits = typeof this.params[key] !== "number" ? zlib$1.Z_DEFAULT_WINDOWBITS : this.params[key];
				this._inflate = zlib$1.createInflateRaw({
					...this._options.zlibInflateOptions,
					windowBits
				});
				this._inflate[kPerMessageDeflate] = this;
				this._inflate[kTotalLength] = 0;
				this._inflate[kBuffers] = [];
				this._inflate.on("error", inflateOnError);
				this._inflate.on("data", inflateOnData);
			}
			this._inflate[kCallback] = callback;
			this._inflate.write(data);
			if (fin) this._inflate.write(TRAILER);
			this._inflate.flush(() => {
				const err = this._inflate[kError];
				if (err) {
					this._inflate.close();
					this._inflate = null;
					callback(err);
					return;
				}
				const data = bufferUtil.concat(this._inflate[kBuffers], this._inflate[kTotalLength]);
				if (this._inflate._readableState.endEmitted) {
					this._inflate.close();
					this._inflate = null;
				} else {
					this._inflate[kTotalLength] = 0;
					this._inflate[kBuffers] = [];
					if (fin && this.params[`${endpoint}_no_context_takeover`]) this._inflate.reset();
				}
				callback(null, data);
			});
		}
		/**
		* Compress data.
		*
		* @param {(Buffer|String)} data Data to compress
		* @param {Boolean} fin Specifies whether or not this is the last fragment
		* @param {Function} callback Callback
		* @private
		*/
		_compress(data, fin, callback) {
			const endpoint = this._isServer ? "server" : "client";
			if (!this._deflate) {
				const key = `${endpoint}_max_window_bits`;
				const windowBits = typeof this.params[key] !== "number" ? zlib$1.Z_DEFAULT_WINDOWBITS : this.params[key];
				this._deflate = zlib$1.createDeflateRaw({
					...this._options.zlibDeflateOptions,
					windowBits
				});
				this._deflate[kTotalLength] = 0;
				this._deflate[kBuffers] = [];
				this._deflate.on("data", deflateOnData);
			}
			this._deflate[kCallback] = callback;
			this._deflate.write(data);
			this._deflate.flush(zlib$1.Z_SYNC_FLUSH, () => {
				if (!this._deflate) return;
				let data = bufferUtil.concat(this._deflate[kBuffers], this._deflate[kTotalLength]);
				if (fin) data = new FastBuffer(data.buffer, data.byteOffset, data.length - 4);
				this._deflate[kCallback] = null;
				this._deflate[kTotalLength] = 0;
				this._deflate[kBuffers] = [];
				if (fin && this.params[`${endpoint}_no_context_takeover`]) this._deflate.reset();
				callback(null, data);
			});
		}
	};
	module.exports = PerMessageDeflate;
	/**
	* The listener of the `zlib.DeflateRaw` stream `'data'` event.
	*
	* @param {Buffer} chunk A chunk of data
	* @private
	*/
	function deflateOnData(chunk) {
		this[kBuffers].push(chunk);
		this[kTotalLength] += chunk.length;
	}
	/**
	* The listener of the `zlib.InflateRaw` stream `'data'` event.
	*
	* @param {Buffer} chunk A chunk of data
	* @private
	*/
	function inflateOnData(chunk) {
		this[kTotalLength] += chunk.length;
		if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
			this[kBuffers].push(chunk);
			return;
		}
		this[kError] = /* @__PURE__ */ new RangeError("Max payload size exceeded");
		this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
		this[kError][kStatusCode] = 1009;
		this.removeListener("data", inflateOnData);
		this.reset();
	}
	/**
	* The listener of the `zlib.InflateRaw` stream `'error'` event.
	*
	* @param {Error} err The emitted error
	* @private
	*/
	function inflateOnError(err) {
		this[kPerMessageDeflate]._inflate = null;
		if (this[kError]) {
			this[kCallback](this[kError]);
			return;
		}
		err[kStatusCode] = 1007;
		this[kCallback](err);
	}
}));
//#endregion
//#region node_modules/ws/lib/validation.js
var require_validation = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { isUtf8 } = __require("buffer");
	var { hasBlob } = require_constants();
	var tokenChars = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		0,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		1,
		1,
		0,
		1,
		1,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		1,
		0,
		1,
		0,
		1,
		0
	];
	/**
	* Checks if a status code is allowed in a close frame.
	*
	* @param {Number} code The status code
	* @return {Boolean} `true` if the status code is valid, else `false`
	* @public
	*/
	function isValidStatusCode(code) {
		return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
	}
	/**
	* Checks if a given buffer contains only correct UTF-8.
	* Ported from https://www.cl.cam.ac.uk/%7Emgk25/ucs/utf8_check.c by
	* Markus Kuhn.
	*
	* @param {Buffer} buf The buffer to check
	* @return {Boolean} `true` if `buf` contains only correct UTF-8, else `false`
	* @public
	*/
	function _isValidUTF8(buf) {
		const len = buf.length;
		let i = 0;
		while (i < len) if ((buf[i] & 128) === 0) i++;
		else if ((buf[i] & 224) === 192) {
			if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) return false;
			i += 2;
		} else if ((buf[i] & 240) === 224) {
			if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || buf[i] === 237 && (buf[i + 1] & 224) === 160) return false;
			i += 3;
		} else if ((buf[i] & 248) === 240) {
			if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) return false;
			i += 4;
		} else return false;
		return true;
	}
	/**
	* Determines whether a value is a `Blob`.
	*
	* @param {*} value The value to be tested
	* @return {Boolean} `true` if `value` is a `Blob`, else `false`
	* @private
	*/
	function isBlob(value) {
		return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
	}
	module.exports = {
		isBlob,
		isValidStatusCode,
		isValidUTF8: _isValidUTF8,
		tokenChars
	};
	if (isUtf8) module.exports.isValidUTF8 = function(buf) {
		return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
	};
	else if (!process.env.WS_NO_UTF_8_VALIDATE) try {
		const isValidUTF8 = __require("utf-8-validate");
		module.exports.isValidUTF8 = function(buf) {
			return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
		};
	} catch (e) {}
}));
//#endregion
//#region node_modules/ws/lib/receiver.js
var require_receiver = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Writable } = __require("stream");
	var PerMessageDeflate = require_permessage_deflate();
	var { BINARY_TYPES, EMPTY_BUFFER, kStatusCode, kWebSocket } = require_constants();
	var { concat, toArrayBuffer, unmask } = require_buffer_util();
	var { isValidStatusCode, isValidUTF8 } = require_validation();
	var FastBuffer = Buffer[Symbol.species];
	var GET_INFO = 0;
	var GET_PAYLOAD_LENGTH_16 = 1;
	var GET_PAYLOAD_LENGTH_64 = 2;
	var GET_MASK = 3;
	var GET_DATA = 4;
	var INFLATING = 5;
	var DEFER_EVENT = 6;
	/**
	* HyBi Receiver implementation.
	*
	* @extends Writable
	*/
	var Receiver = class extends Writable {
		/**
		* Creates a Receiver instance.
		*
		* @param {Object} [options] Options object
		* @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
		*     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
		*     multiple times in the same tick
		* @param {String} [options.binaryType=nodebuffer] The type for binary data
		* @param {Object} [options.extensions] An object containing the negotiated
		*     extensions
		* @param {Boolean} [options.isServer=false] Specifies whether to operate in
		*     client or server mode
		* @param {Number} [options.maxBufferedChunks=0] The maximum number of
		*     buffered data chunks
		* @param {Number} [options.maxFragments=0] The maximum number of message
		*     fragments
		* @param {Number} [options.maxPayload=0] The maximum allowed message length
		* @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
		*     not to skip UTF-8 validation for text and close messages
		*/
		constructor(options = {}) {
			super();
			this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
			this._binaryType = options.binaryType || BINARY_TYPES[0];
			this._extensions = options.extensions || {};
			this._isServer = !!options.isServer;
			this._maxBufferedChunks = options.maxBufferedChunks | 0;
			this._maxFragments = options.maxFragments | 0;
			this._maxPayload = options.maxPayload | 0;
			this._skipUTF8Validation = !!options.skipUTF8Validation;
			this[kWebSocket] = void 0;
			this._bufferedBytes = 0;
			this._buffers = [];
			this._compressed = false;
			this._payloadLength = 0;
			this._mask = void 0;
			this._fragmented = 0;
			this._masked = false;
			this._fin = false;
			this._opcode = 0;
			this._totalPayloadLength = 0;
			this._messageLength = 0;
			this._fragments = [];
			this._errored = false;
			this._loop = false;
			this._state = GET_INFO;
		}
		/**
		* Implements `Writable.prototype._write()`.
		*
		* @param {Buffer} chunk The chunk of data to write
		* @param {String} encoding The character encoding of `chunk`
		* @param {Function} cb Callback
		* @private
		*/
		_write(chunk, encoding, cb) {
			if (this._opcode === 8 && this._state == GET_INFO) return cb();
			if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
				cb(this.createError(RangeError, "Too many buffered chunks", false, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
				return;
			}
			this._bufferedBytes += chunk.length;
			this._buffers.push(chunk);
			this.startLoop(cb);
		}
		/**
		* Consumes `n` bytes from the buffered data.
		*
		* @param {Number} n The number of bytes to consume
		* @return {Buffer} The consumed bytes
		* @private
		*/
		consume(n) {
			this._bufferedBytes -= n;
			if (n === this._buffers[0].length) return this._buffers.shift();
			if (n < this._buffers[0].length) {
				const buf = this._buffers[0];
				this._buffers[0] = new FastBuffer(buf.buffer, buf.byteOffset + n, buf.length - n);
				return new FastBuffer(buf.buffer, buf.byteOffset, n);
			}
			const dst = Buffer.allocUnsafe(n);
			do {
				const buf = this._buffers[0];
				const offset = dst.length - n;
				if (n >= buf.length) dst.set(this._buffers.shift(), offset);
				else {
					dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
					this._buffers[0] = new FastBuffer(buf.buffer, buf.byteOffset + n, buf.length - n);
				}
				n -= buf.length;
			} while (n > 0);
			return dst;
		}
		/**
		* Starts the parsing loop.
		*
		* @param {Function} cb Callback
		* @private
		*/
		startLoop(cb) {
			this._loop = true;
			do
				switch (this._state) {
					case GET_INFO:
						this.getInfo(cb);
						break;
					case GET_PAYLOAD_LENGTH_16:
						this.getPayloadLength16(cb);
						break;
					case GET_PAYLOAD_LENGTH_64:
						this.getPayloadLength64(cb);
						break;
					case GET_MASK:
						this.getMask();
						break;
					case GET_DATA:
						this.getData(cb);
						break;
					case INFLATING:
					case DEFER_EVENT:
						this._loop = false;
						return;
				}
			while (this._loop);
			if (!this._errored) cb();
		}
		/**
		* Reads the first two bytes of a frame.
		*
		* @param {Function} cb Callback
		* @private
		*/
		getInfo(cb) {
			if (this._bufferedBytes < 2) {
				this._loop = false;
				return;
			}
			const buf = this.consume(2);
			if ((buf[0] & 48) !== 0) {
				cb(this.createError(RangeError, "RSV2 and RSV3 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_2_3"));
				return;
			}
			const compressed = (buf[0] & 64) === 64;
			if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
				cb(this.createError(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
				return;
			}
			this._fin = (buf[0] & 128) === 128;
			this._opcode = buf[0] & 15;
			this._payloadLength = buf[1] & 127;
			if (this._opcode === 0) {
				if (compressed) {
					cb(this.createError(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
					return;
				}
				if (!this._fragmented) {
					cb(this.createError(RangeError, "invalid opcode 0", true, 1002, "WS_ERR_INVALID_OPCODE"));
					return;
				}
				this._opcode = this._fragmented;
			} else if (this._opcode === 1 || this._opcode === 2) {
				if (this._fragmented) {
					cb(this.createError(RangeError, `invalid opcode ${this._opcode}`, true, 1002, "WS_ERR_INVALID_OPCODE"));
					return;
				}
				this._compressed = compressed;
			} else if (this._opcode > 7 && this._opcode < 11) {
				if (!this._fin) {
					cb(this.createError(RangeError, "FIN must be set", true, 1002, "WS_ERR_EXPECTED_FIN"));
					return;
				}
				if (compressed) {
					cb(this.createError(RangeError, "RSV1 must be clear", true, 1002, "WS_ERR_UNEXPECTED_RSV_1"));
					return;
				}
				if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
					cb(this.createError(RangeError, `invalid payload length ${this._payloadLength}`, true, 1002, "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"));
					return;
				}
			} else {
				cb(this.createError(RangeError, `invalid opcode ${this._opcode}`, true, 1002, "WS_ERR_INVALID_OPCODE"));
				return;
			}
			if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
			this._masked = (buf[1] & 128) === 128;
			if (this._isServer) {
				if (!this._masked) {
					cb(this.createError(RangeError, "MASK must be set", true, 1002, "WS_ERR_EXPECTED_MASK"));
					return;
				}
			} else if (this._masked) {
				cb(this.createError(RangeError, "MASK must be clear", true, 1002, "WS_ERR_UNEXPECTED_MASK"));
				return;
			}
			if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
			else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
			else this.haveLength(cb);
		}
		/**
		* Gets extended payload length (7+16).
		*
		* @param {Function} cb Callback
		* @private
		*/
		getPayloadLength16(cb) {
			if (this._bufferedBytes < 2) {
				this._loop = false;
				return;
			}
			this._payloadLength = this.consume(2).readUInt16BE(0);
			this.haveLength(cb);
		}
		/**
		* Gets extended payload length (7+64).
		*
		* @param {Function} cb Callback
		* @private
		*/
		getPayloadLength64(cb) {
			if (this._bufferedBytes < 8) {
				this._loop = false;
				return;
			}
			const buf = this.consume(8);
			const num = buf.readUInt32BE(0);
			if (num > Math.pow(2, 21) - 1) {
				cb(this.createError(RangeError, "Unsupported WebSocket frame: payload length > 2^53 - 1", false, 1009, "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"));
				return;
			}
			this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
			this.haveLength(cb);
		}
		/**
		* Payload length has been read.
		*
		* @param {Function} cb Callback
		* @private
		*/
		haveLength(cb) {
			if (this._payloadLength && this._opcode < 8) {
				this._totalPayloadLength += this._payloadLength;
				if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
					cb(this.createError(RangeError, "Max payload size exceeded", false, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"));
					return;
				}
			}
			if (this._masked) this._state = GET_MASK;
			else this._state = GET_DATA;
		}
		/**
		* Reads mask bytes.
		*
		* @private
		*/
		getMask() {
			if (this._bufferedBytes < 4) {
				this._loop = false;
				return;
			}
			this._mask = this.consume(4);
			this._state = GET_DATA;
		}
		/**
		* Reads data bytes.
		*
		* @param {Function} cb Callback
		* @private
		*/
		getData(cb) {
			let data = EMPTY_BUFFER;
			if (this._payloadLength) {
				if (this._bufferedBytes < this._payloadLength) {
					this._loop = false;
					return;
				}
				data = this.consume(this._payloadLength);
				if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) unmask(data, this._mask);
			}
			if (this._opcode > 7) {
				this.controlMessage(data, cb);
				return;
			}
			if (this._compressed) {
				this._state = INFLATING;
				this.decompress(data, cb);
				return;
			}
			if (data.length) {
				if (this._maxFragments > 0 && this._fragments.length >= this._maxFragments) {
					cb(this.createError(RangeError, "Too many message fragments", false, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
					return;
				}
				this._messageLength = this._totalPayloadLength;
				this._fragments.push(data);
			}
			this.dataMessage(cb);
		}
		/**
		* Decompresses data.
		*
		* @param {Buffer} data Compressed data
		* @param {Function} cb Callback
		* @private
		*/
		decompress(data, cb) {
			this._extensions[PerMessageDeflate.extensionName].decompress(data, this._fin, (err, buf) => {
				if (err) return cb(err);
				if (buf.length) {
					this._messageLength += buf.length;
					if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
						cb(this.createError(RangeError, "Max payload size exceeded", false, 1009, "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"));
						return;
					}
					if (this._maxFragments > 0 && this._fragments.length >= this._maxFragments) {
						cb(this.createError(RangeError, "Too many message fragments", false, 1008, "WS_ERR_TOO_MANY_BUFFERED_PARTS"));
						return;
					}
					this._fragments.push(buf);
				}
				this.dataMessage(cb);
				if (this._state === GET_INFO) this.startLoop(cb);
			});
		}
		/**
		* Handles a data message.
		*
		* @param {Function} cb Callback
		* @private
		*/
		dataMessage(cb) {
			if (!this._fin) {
				this._state = GET_INFO;
				return;
			}
			const messageLength = this._messageLength;
			const fragments = this._fragments;
			this._totalPayloadLength = 0;
			this._messageLength = 0;
			this._fragmented = 0;
			this._fragments = [];
			if (this._opcode === 2) {
				let data;
				if (this._binaryType === "nodebuffer") data = concat(fragments, messageLength);
				else if (this._binaryType === "arraybuffer") data = toArrayBuffer(concat(fragments, messageLength));
				else if (this._binaryType === "blob") data = new Blob(fragments);
				else data = fragments;
				if (this._allowSynchronousEvents) {
					this.emit("message", data, true);
					this._state = GET_INFO;
				} else {
					this._state = DEFER_EVENT;
					setImmediate(() => {
						this.emit("message", data, true);
						this._state = GET_INFO;
						this.startLoop(cb);
					});
				}
			} else {
				const buf = concat(fragments, messageLength);
				if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
					cb(this.createError(Error, "invalid UTF-8 sequence", true, 1007, "WS_ERR_INVALID_UTF8"));
					return;
				}
				if (this._state === INFLATING || this._allowSynchronousEvents) {
					this.emit("message", buf, false);
					this._state = GET_INFO;
				} else {
					this._state = DEFER_EVENT;
					setImmediate(() => {
						this.emit("message", buf, false);
						this._state = GET_INFO;
						this.startLoop(cb);
					});
				}
			}
		}
		/**
		* Handles a control message.
		*
		* @param {Buffer} data Data to handle
		* @return {(Error|RangeError|undefined)} A possible error
		* @private
		*/
		controlMessage(data, cb) {
			if (this._opcode === 8) {
				if (data.length === 0) {
					this._loop = false;
					this.emit("conclude", 1005, EMPTY_BUFFER);
					this.end();
				} else {
					const code = data.readUInt16BE(0);
					if (!isValidStatusCode(code)) {
						cb(this.createError(RangeError, `invalid status code ${code}`, true, 1002, "WS_ERR_INVALID_CLOSE_CODE"));
						return;
					}
					const buf = new FastBuffer(data.buffer, data.byteOffset + 2, data.length - 2);
					if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
						cb(this.createError(Error, "invalid UTF-8 sequence", true, 1007, "WS_ERR_INVALID_UTF8"));
						return;
					}
					this._loop = false;
					this.emit("conclude", code, buf);
					this.end();
				}
				this._state = GET_INFO;
				return;
			}
			if (this._allowSynchronousEvents) {
				this.emit(this._opcode === 9 ? "ping" : "pong", data);
				this._state = GET_INFO;
			} else {
				this._state = DEFER_EVENT;
				setImmediate(() => {
					this.emit(this._opcode === 9 ? "ping" : "pong", data);
					this._state = GET_INFO;
					this.startLoop(cb);
				});
			}
		}
		/**
		* Builds an error object.
		*
		* @param {function(new:Error|RangeError)} ErrorCtor The error constructor
		* @param {String} message The error message
		* @param {Boolean} prefix Specifies whether or not to add a default prefix to
		*     `message`
		* @param {Number} statusCode The status code
		* @param {String} errorCode The exposed error code
		* @return {(Error|RangeError)} The error
		* @private
		*/
		createError(ErrorCtor, message, prefix, statusCode, errorCode) {
			this._loop = false;
			this._errored = true;
			const err = new ErrorCtor(prefix ? `Invalid WebSocket frame: ${message}` : message);
			Error.captureStackTrace(err, this.createError);
			err.code = errorCode;
			err[kStatusCode] = statusCode;
			return err;
		}
	};
	module.exports = Receiver;
}));
//#endregion
//#region node_modules/ws/lib/sender.js
var require_sender = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { Duplex: Duplex$3 } = __require("stream");
	var { randomFillSync } = __require("crypto");
	var { types: { isUint8Array } } = __require("util");
	var PerMessageDeflate = require_permessage_deflate();
	var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
	var { isBlob, isValidStatusCode } = require_validation();
	var { mask: applyMask, toBuffer } = require_buffer_util();
	var kByteLength = Symbol("kByteLength");
	var maskBuffer = Buffer.alloc(4);
	var RANDOM_POOL_SIZE = 8192;
	var randomPool;
	var randomPoolPointer = RANDOM_POOL_SIZE;
	var DEFAULT = 0;
	var DEFLATING = 1;
	var GET_BLOB_DATA = 2;
	module.exports = class Sender {
		/**
		* Creates a Sender instance.
		*
		* @param {Duplex} socket The connection socket
		* @param {Object} [extensions] An object containing the negotiated extensions
		* @param {Function} [generateMask] The function used to generate the masking
		*     key
		*/
		constructor(socket, extensions, generateMask) {
			this._extensions = extensions || {};
			if (generateMask) {
				this._generateMask = generateMask;
				this._maskBuffer = Buffer.alloc(4);
			}
			this._socket = socket;
			this._firstFragment = true;
			this._compress = false;
			this._bufferedBytes = 0;
			this._queue = [];
			this._state = DEFAULT;
			this.onerror = NOOP;
			this[kWebSocket] = void 0;
		}
		/**
		* Frames a piece of data according to the HyBi WebSocket protocol.
		*
		* @param {(Buffer|String)} data The data to frame
		* @param {Object} options Options object
		* @param {Boolean} [options.fin=false] Specifies whether or not to set the
		*     FIN bit
		* @param {Function} [options.generateMask] The function used to generate the
		*     masking key
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Buffer} [options.maskBuffer] The buffer used to store the masking
		*     key
		* @param {Number} options.opcode The opcode
		* @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
		*     modified
		* @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
		*     RSV1 bit
		* @return {(Buffer|String)[]} The framed data
		* @public
		*/
		static frame(data, options) {
			let mask;
			let merge = false;
			let offset = 2;
			let skipMasking = false;
			if (options.mask) {
				mask = options.maskBuffer || maskBuffer;
				if (options.generateMask) options.generateMask(mask);
				else {
					if (randomPoolPointer === RANDOM_POOL_SIZE) {
						/* istanbul ignore else  */
						if (randomPool === void 0) randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
						randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
						randomPoolPointer = 0;
					}
					mask[0] = randomPool[randomPoolPointer++];
					mask[1] = randomPool[randomPoolPointer++];
					mask[2] = randomPool[randomPoolPointer++];
					mask[3] = randomPool[randomPoolPointer++];
				}
				skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
				offset = 6;
			}
			let dataLength;
			if (typeof data === "string") {
				if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) dataLength = options[kByteLength];
				else {
					data = Buffer.from(data);
					dataLength = data.length;
				}
			} else {
				dataLength = data.length;
				merge = options.mask && options.readOnly && !skipMasking;
			}
			let payloadLength = dataLength;
			if (dataLength >= 65536) {
				offset += 8;
				payloadLength = 127;
			} else if (dataLength > 125) {
				offset += 2;
				payloadLength = 126;
			}
			const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
			target[0] = options.fin ? options.opcode | 128 : options.opcode;
			if (options.rsv1) target[0] |= 64;
			target[1] = payloadLength;
			if (payloadLength === 126) target.writeUInt16BE(dataLength, 2);
			else if (payloadLength === 127) {
				target[2] = target[3] = 0;
				target.writeUIntBE(dataLength, 4, 6);
			}
			if (!options.mask) return [target, data];
			target[1] |= 128;
			target[offset - 4] = mask[0];
			target[offset - 3] = mask[1];
			target[offset - 2] = mask[2];
			target[offset - 1] = mask[3];
			if (skipMasking) return [target, data];
			if (merge) {
				applyMask(data, mask, target, offset, dataLength);
				return [target];
			}
			applyMask(data, mask, data, 0, dataLength);
			return [target, data];
		}
		/**
		* Sends a close message to the other peer.
		*
		* @param {Number} [code] The status code component of the body
		* @param {(String|Buffer)} [data] The message component of the body
		* @param {Boolean} [mask=false] Specifies whether or not to mask the message
		* @param {Function} [cb] Callback
		* @public
		*/
		close(code, data, mask, cb) {
			let buf;
			if (code === void 0) buf = EMPTY_BUFFER;
			else if (typeof code !== "number" || !isValidStatusCode(code)) throw new TypeError("First argument must be a valid error code number");
			else if (data === void 0 || !data.length) {
				buf = Buffer.allocUnsafe(2);
				buf.writeUInt16BE(code, 0);
			} else {
				const length = Buffer.byteLength(data);
				if (length > 123) throw new RangeError("The message must not be greater than 123 bytes");
				buf = Buffer.allocUnsafe(2 + length);
				buf.writeUInt16BE(code, 0);
				if (typeof data === "string") buf.write(data, 2);
				else if (isUint8Array(data)) buf.set(data, 2);
				else throw new TypeError("Second argument must be a string or a Uint8Array");
			}
			const options = {
				[kByteLength]: buf.length,
				fin: true,
				generateMask: this._generateMask,
				mask,
				maskBuffer: this._maskBuffer,
				opcode: 8,
				readOnly: false,
				rsv1: false
			};
			if (this._state !== DEFAULT) this.enqueue([
				this.dispatch,
				buf,
				false,
				options,
				cb
			]);
			else this.sendFrame(Sender.frame(buf, options), cb);
		}
		/**
		* Sends a ping message to the other peer.
		*
		* @param {*} data The message to send
		* @param {Boolean} [mask=false] Specifies whether or not to mask `data`
		* @param {Function} [cb] Callback
		* @public
		*/
		ping(data, mask, cb) {
			let byteLength;
			let readOnly;
			if (typeof data === "string") {
				byteLength = Buffer.byteLength(data);
				readOnly = false;
			} else if (isBlob(data)) {
				byteLength = data.size;
				readOnly = false;
			} else {
				data = toBuffer(data);
				byteLength = data.length;
				readOnly = toBuffer.readOnly;
			}
			if (byteLength > 125) throw new RangeError("The data size must not be greater than 125 bytes");
			const options = {
				[kByteLength]: byteLength,
				fin: true,
				generateMask: this._generateMask,
				mask,
				maskBuffer: this._maskBuffer,
				opcode: 9,
				readOnly,
				rsv1: false
			};
			if (isBlob(data)) {
				if (this._state !== DEFAULT) this.enqueue([
					this.getBlobData,
					data,
					false,
					options,
					cb
				]);
				else this.getBlobData(data, false, options, cb);
			} else if (this._state !== DEFAULT) this.enqueue([
				this.dispatch,
				data,
				false,
				options,
				cb
			]);
			else this.sendFrame(Sender.frame(data, options), cb);
		}
		/**
		* Sends a pong message to the other peer.
		*
		* @param {*} data The message to send
		* @param {Boolean} [mask=false] Specifies whether or not to mask `data`
		* @param {Function} [cb] Callback
		* @public
		*/
		pong(data, mask, cb) {
			let byteLength;
			let readOnly;
			if (typeof data === "string") {
				byteLength = Buffer.byteLength(data);
				readOnly = false;
			} else if (isBlob(data)) {
				byteLength = data.size;
				readOnly = false;
			} else {
				data = toBuffer(data);
				byteLength = data.length;
				readOnly = toBuffer.readOnly;
			}
			if (byteLength > 125) throw new RangeError("The data size must not be greater than 125 bytes");
			const options = {
				[kByteLength]: byteLength,
				fin: true,
				generateMask: this._generateMask,
				mask,
				maskBuffer: this._maskBuffer,
				opcode: 10,
				readOnly,
				rsv1: false
			};
			if (isBlob(data)) {
				if (this._state !== DEFAULT) this.enqueue([
					this.getBlobData,
					data,
					false,
					options,
					cb
				]);
				else this.getBlobData(data, false, options, cb);
			} else if (this._state !== DEFAULT) this.enqueue([
				this.dispatch,
				data,
				false,
				options,
				cb
			]);
			else this.sendFrame(Sender.frame(data, options), cb);
		}
		/**
		* Sends a data message to the other peer.
		*
		* @param {*} data The message to send
		* @param {Object} options Options object
		* @param {Boolean} [options.binary=false] Specifies whether `data` is binary
		*     or text
		* @param {Boolean} [options.compress=false] Specifies whether or not to
		*     compress `data`
		* @param {Boolean} [options.fin=false] Specifies whether the fragment is the
		*     last one
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Function} [cb] Callback
		* @public
		*/
		send(data, options, cb) {
			const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
			let opcode = options.binary ? 2 : 1;
			let rsv1 = options.compress;
			let byteLength;
			let readOnly;
			if (typeof data === "string") {
				byteLength = Buffer.byteLength(data);
				readOnly = false;
			} else if (isBlob(data)) {
				byteLength = data.size;
				readOnly = false;
			} else {
				data = toBuffer(data);
				byteLength = data.length;
				readOnly = toBuffer.readOnly;
			}
			if (this._firstFragment) {
				this._firstFragment = false;
				if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) rsv1 = byteLength >= perMessageDeflate._threshold;
				this._compress = rsv1;
			} else {
				rsv1 = false;
				opcode = 0;
			}
			if (options.fin) this._firstFragment = true;
			const opts = {
				[kByteLength]: byteLength,
				fin: options.fin,
				generateMask: this._generateMask,
				mask: options.mask,
				maskBuffer: this._maskBuffer,
				opcode,
				readOnly,
				rsv1
			};
			if (isBlob(data)) {
				if (this._state !== DEFAULT) this.enqueue([
					this.getBlobData,
					data,
					this._compress,
					opts,
					cb
				]);
				else this.getBlobData(data, this._compress, opts, cb);
			} else if (this._state !== DEFAULT) this.enqueue([
				this.dispatch,
				data,
				this._compress,
				opts,
				cb
			]);
			else this.dispatch(data, this._compress, opts, cb);
		}
		/**
		* Gets the contents of a blob as binary data.
		*
		* @param {Blob} blob The blob
		* @param {Boolean} [compress=false] Specifies whether or not to compress
		*     the data
		* @param {Object} options Options object
		* @param {Boolean} [options.fin=false] Specifies whether or not to set the
		*     FIN bit
		* @param {Function} [options.generateMask] The function used to generate the
		*     masking key
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Buffer} [options.maskBuffer] The buffer used to store the masking
		*     key
		* @param {Number} options.opcode The opcode
		* @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
		*     modified
		* @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
		*     RSV1 bit
		* @param {Function} [cb] Callback
		* @private
		*/
		getBlobData(blob, compress, options, cb) {
			this._bufferedBytes += options[kByteLength];
			this._state = GET_BLOB_DATA;
			blob.arrayBuffer().then((arrayBuffer) => {
				if (this._socket.destroyed) {
					const err = /* @__PURE__ */ new Error("The socket was closed while the blob was being read");
					process.nextTick(callCallbacks, this, err, cb);
					return;
				}
				this._bufferedBytes -= options[kByteLength];
				const data = toBuffer(arrayBuffer);
				if (!compress) {
					this._state = DEFAULT;
					this.sendFrame(Sender.frame(data, options), cb);
					this.dequeue();
				} else this.dispatch(data, compress, options, cb);
			}).catch((err) => {
				process.nextTick(onError, this, err, cb);
			});
		}
		/**
		* Dispatches a message.
		*
		* @param {(Buffer|String)} data The message to send
		* @param {Boolean} [compress=false] Specifies whether or not to compress
		*     `data`
		* @param {Object} options Options object
		* @param {Boolean} [options.fin=false] Specifies whether or not to set the
		*     FIN bit
		* @param {Function} [options.generateMask] The function used to generate the
		*     masking key
		* @param {Boolean} [options.mask=false] Specifies whether or not to mask
		*     `data`
		* @param {Buffer} [options.maskBuffer] The buffer used to store the masking
		*     key
		* @param {Number} options.opcode The opcode
		* @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
		*     modified
		* @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
		*     RSV1 bit
		* @param {Function} [cb] Callback
		* @private
		*/
		dispatch(data, compress, options, cb) {
			if (!compress) {
				this.sendFrame(Sender.frame(data, options), cb);
				return;
			}
			const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
			this._bufferedBytes += options[kByteLength];
			this._state = DEFLATING;
			perMessageDeflate.compress(data, options.fin, (_, buf) => {
				if (this._socket.destroyed) {
					const err = /* @__PURE__ */ new Error("The socket was closed while data was being compressed");
					callCallbacks(this, err, cb);
					return;
				}
				this._bufferedBytes -= options[kByteLength];
				this._state = DEFAULT;
				options.readOnly = false;
				this.sendFrame(Sender.frame(buf, options), cb);
				this.dequeue();
			});
		}
		/**
		* Executes queued send operations.
		*
		* @private
		*/
		dequeue() {
			while (this._state === DEFAULT && this._queue.length) {
				const params = this._queue.shift();
				this._bufferedBytes -= params[3][kByteLength];
				Reflect.apply(params[0], this, params.slice(1));
			}
		}
		/**
		* Enqueues a send operation.
		*
		* @param {Array} params Send operation parameters.
		* @private
		*/
		enqueue(params) {
			this._bufferedBytes += params[3][kByteLength];
			this._queue.push(params);
		}
		/**
		* Sends a frame.
		*
		* @param {(Buffer | String)[]} list The frame to send
		* @param {Function} [cb] Callback
		* @private
		*/
		sendFrame(list, cb) {
			if (list.length === 2) {
				this._socket.cork();
				this._socket.write(list[0]);
				this._socket.write(list[1], cb);
				this._socket.uncork();
			} else this._socket.write(list[0], cb);
		}
	};
	/**
	* Calls queued callbacks with an error.
	*
	* @param {Sender} sender The `Sender` instance
	* @param {Error} err The error to call the callbacks with
	* @param {Function} [cb] The first callback
	* @private
	*/
	function callCallbacks(sender, err, cb) {
		if (typeof cb === "function") cb(err);
		for (let i = 0; i < sender._queue.length; i++) {
			const params = sender._queue[i];
			const callback = params[params.length - 1];
			if (typeof callback === "function") callback(err);
		}
	}
	/**
	* Handles a `Sender` error.
	*
	* @param {Sender} sender The `Sender` instance
	* @param {Error} err The error
	* @param {Function} [cb] The first pending callback
	* @private
	*/
	function onError(sender, err, cb) {
		callCallbacks(sender, err, cb);
		sender.onerror(err);
	}
}));
//#endregion
//#region node_modules/ws/lib/event-target.js
var require_event_target = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { kForOnEventAttribute, kListener } = require_constants();
	var kCode = Symbol("kCode");
	var kData = Symbol("kData");
	var kError = Symbol("kError");
	var kMessage = Symbol("kMessage");
	var kReason = Symbol("kReason");
	var kTarget = Symbol("kTarget");
	var kType = Symbol("kType");
	var kWasClean = Symbol("kWasClean");
	/**
	* Class representing an event.
	*/
	var Event = class {
		/**
		* Create a new `Event`.
		*
		* @param {String} type The name of the event
		* @throws {TypeError} If the `type` argument is not specified
		*/
		constructor(type) {
			this[kTarget] = null;
			this[kType] = type;
		}
		/**
		* @type {*}
		*/
		get target() {
			return this[kTarget];
		}
		/**
		* @type {String}
		*/
		get type() {
			return this[kType];
		}
	};
	Object.defineProperty(Event.prototype, "target", { enumerable: true });
	Object.defineProperty(Event.prototype, "type", { enumerable: true });
	/**
	* Class representing a close event.
	*
	* @extends Event
	*/
	var CloseEvent = class extends Event {
		/**
		* Create a new `CloseEvent`.
		*
		* @param {String} type The name of the event
		* @param {Object} [options] A dictionary object that allows for setting
		*     attributes via object members of the same name
		* @param {Number} [options.code=0] The status code explaining why the
		*     connection was closed
		* @param {String} [options.reason=''] A human-readable string explaining why
		*     the connection was closed
		* @param {Boolean} [options.wasClean=false] Indicates whether or not the
		*     connection was cleanly closed
		*/
		constructor(type, options = {}) {
			super(type);
			this[kCode] = options.code === void 0 ? 0 : options.code;
			this[kReason] = options.reason === void 0 ? "" : options.reason;
			this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
		}
		/**
		* @type {Number}
		*/
		get code() {
			return this[kCode];
		}
		/**
		* @type {String}
		*/
		get reason() {
			return this[kReason];
		}
		/**
		* @type {Boolean}
		*/
		get wasClean() {
			return this[kWasClean];
		}
	};
	Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
	Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
	Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
	/**
	* Class representing an error event.
	*
	* @extends Event
	*/
	var ErrorEvent = class extends Event {
		/**
		* Create a new `ErrorEvent`.
		*
		* @param {String} type The name of the event
		* @param {Object} [options] A dictionary object that allows for setting
		*     attributes via object members of the same name
		* @param {*} [options.error=null] The error that generated this event
		* @param {String} [options.message=''] The error message
		*/
		constructor(type, options = {}) {
			super(type);
			this[kError] = options.error === void 0 ? null : options.error;
			this[kMessage] = options.message === void 0 ? "" : options.message;
		}
		/**
		* @type {*}
		*/
		get error() {
			return this[kError];
		}
		/**
		* @type {String}
		*/
		get message() {
			return this[kMessage];
		}
	};
	Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
	Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
	/**
	* Class representing a message event.
	*
	* @extends Event
	*/
	var MessageEvent = class extends Event {
		/**
		* Create a new `MessageEvent`.
		*
		* @param {String} type The name of the event
		* @param {Object} [options] A dictionary object that allows for setting
		*     attributes via object members of the same name
		* @param {*} [options.data=null] The message content
		*/
		constructor(type, options = {}) {
			super(type);
			this[kData] = options.data === void 0 ? null : options.data;
		}
		/**
		* @type {*}
		*/
		get data() {
			return this[kData];
		}
	};
	Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
	module.exports = {
		CloseEvent,
		ErrorEvent,
		Event,
		EventTarget: {
			/**
			* Register an event listener.
			*
			* @param {String} type A string representing the event type to listen for
			* @param {(Function|Object)} handler The listener to add
			* @param {Object} [options] An options object specifies characteristics about
			*     the event listener
			* @param {Boolean} [options.once=false] A `Boolean` indicating that the
			*     listener should be invoked at most once after being added. If `true`,
			*     the listener would be automatically removed when invoked.
			* @public
			*/
			addEventListener(type, handler, options = {}) {
				for (const listener of this.listeners(type)) if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) return;
				let wrapper;
				if (type === "message") wrapper = function onMessage(data, isBinary) {
					const event = new MessageEvent("message", { data: isBinary ? data : data.toString() });
					event[kTarget] = this;
					callListener(handler, this, event);
				};
				else if (type === "close") wrapper = function onClose(code, message) {
					const event = new CloseEvent("close", {
						code,
						reason: message.toString(),
						wasClean: this._closeFrameReceived && this._closeFrameSent
					});
					event[kTarget] = this;
					callListener(handler, this, event);
				};
				else if (type === "error") wrapper = function onError(error) {
					const event = new ErrorEvent("error", {
						error,
						message: error.message
					});
					event[kTarget] = this;
					callListener(handler, this, event);
				};
				else if (type === "open") wrapper = function onOpen() {
					const event = new Event("open");
					event[kTarget] = this;
					callListener(handler, this, event);
				};
				else return;
				wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
				wrapper[kListener] = handler;
				if (options.once) this.once(type, wrapper);
				else this.on(type, wrapper);
			},
			/**
			* Remove an event listener.
			*
			* @param {String} type A string representing the event type to remove
			* @param {(Function|Object)} handler The listener to remove
			* @public
			*/
			removeEventListener(type, handler) {
				for (const listener of this.listeners(type)) if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
					this.removeListener(type, listener);
					break;
				}
			}
		},
		MessageEvent
	};
	/**
	* Call an event listener
	*
	* @param {(Function|Object)} listener The listener to call
	* @param {*} thisArg The value to use as `this`` when calling the listener
	* @param {Event} event The event to pass to the listener
	* @private
	*/
	function callListener(listener, thisArg, event) {
		if (typeof listener === "object" && listener.handleEvent) listener.handleEvent.call(listener, event);
		else listener.call(thisArg, event);
	}
}));
//#endregion
//#region node_modules/ws/lib/extension.js
var require_extension = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { tokenChars } = require_validation();
	/**
	* Adds an offer to the map of extension offers or a parameter to the map of
	* parameters.
	*
	* @param {Object} dest The map of extension offers or parameters
	* @param {String} name The extension or parameter name
	* @param {(Object|Boolean|String)} elem The extension parameters or the
	*     parameter value
	* @private
	*/
	function push(dest, name, elem) {
		if (dest[name] === void 0) dest[name] = [elem];
		else dest[name].push(elem);
	}
	/**
	* Parses the `Sec-WebSocket-Extensions` header into an object.
	*
	* @param {String} header The field value of the header
	* @return {Object} The parsed object
	* @public
	*/
	function parse(header) {
		const offers = Object.create(null);
		let params = Object.create(null);
		let mustUnescape = false;
		let isEscaping = false;
		let inQuotes = false;
		let extensionName;
		let paramName;
		let start = -1;
		let code = -1;
		let end = -1;
		let i = 0;
		for (; i < header.length; i++) {
			code = header.charCodeAt(i);
			if (extensionName === void 0) {
				if (end === -1 && tokenChars[code] === 1) {
					if (start === -1) start = i;
				} else if (i !== 0 && (code === 32 || code === 9)) {
					if (end === -1 && start !== -1) end = i;
				} else if (code === 59 || code === 44) {
					if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
					if (end === -1) end = i;
					const name = header.slice(start, end);
					if (code === 44) {
						push(offers, name, params);
						params = Object.create(null);
					} else extensionName = name;
					start = end = -1;
				} else throw new SyntaxError(`Unexpected character at index ${i}`);
			} else if (paramName === void 0) {
				if (end === -1 && tokenChars[code] === 1) {
					if (start === -1) start = i;
				} else if (code === 32 || code === 9) {
					if (end === -1 && start !== -1) end = i;
				} else if (code === 59 || code === 44) {
					if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
					if (end === -1) end = i;
					push(params, header.slice(start, end), true);
					if (code === 44) {
						push(offers, extensionName, params);
						params = Object.create(null);
						extensionName = void 0;
					}
					start = end = -1;
				} else if (code === 61 && start !== -1 && end === -1) {
					paramName = header.slice(start, i);
					start = end = -1;
				} else throw new SyntaxError(`Unexpected character at index ${i}`);
			} else if (isEscaping) {
				if (tokenChars[code] !== 1) throw new SyntaxError(`Unexpected character at index ${i}`);
				if (start === -1) start = i;
				else if (!mustUnescape) mustUnescape = true;
				isEscaping = false;
			} else if (inQuotes) {
				if (tokenChars[code] === 1) {
					if (start === -1) start = i;
				} else if (code === 34 && start !== -1) {
					inQuotes = false;
					end = i;
				} else if (code === 92) isEscaping = true;
				else throw new SyntaxError(`Unexpected character at index ${i}`);
			} else if (code === 34 && header.charCodeAt(i - 1) === 61) inQuotes = true;
			else if (end === -1 && tokenChars[code] === 1) {
				if (start === -1) start = i;
			} else if (start !== -1 && (code === 32 || code === 9)) {
				if (end === -1) end = i;
			} else if (code === 59 || code === 44) {
				if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
				if (end === -1) end = i;
				let value = header.slice(start, end);
				if (mustUnescape) {
					value = value.replace(/\\/g, "");
					mustUnescape = false;
				}
				push(params, paramName, value);
				if (code === 44) {
					push(offers, extensionName, params);
					params = Object.create(null);
					extensionName = void 0;
				}
				paramName = void 0;
				start = end = -1;
			} else throw new SyntaxError(`Unexpected character at index ${i}`);
		}
		if (start === -1 || inQuotes || code === 32 || code === 9) throw new SyntaxError("Unexpected end of input");
		if (end === -1) end = i;
		const token = header.slice(start, end);
		if (extensionName === void 0) push(offers, token, params);
		else {
			if (paramName === void 0) push(params, token, true);
			else if (mustUnescape) push(params, paramName, token.replace(/\\/g, ""));
			else push(params, paramName, token);
			push(offers, extensionName, params);
		}
		return offers;
	}
	/**
	* Builds the `Sec-WebSocket-Extensions` header field value.
	*
	* @param {Object} extensions The map of extensions and parameters to format
	* @return {String} A string representing the given object
	* @public
	*/
	function format(extensions) {
		return Object.keys(extensions).map((extension) => {
			let configurations = extensions[extension];
			if (!Array.isArray(configurations)) configurations = [configurations];
			return configurations.map((params) => {
				return [extension].concat(Object.keys(params).map((k) => {
					let values = params[k];
					if (!Array.isArray(values)) values = [values];
					return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
				})).join("; ");
			}).join(", ");
		}).join(", ");
	}
	module.exports = {
		format,
		parse
	};
}));
//#endregion
//#region node_modules/ws/lib/websocket.js
var require_websocket = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var EventEmitter$3 = __require("events");
	var https$1 = __require("https");
	var http$2 = __require("http");
	var net = __require("net");
	var tls = __require("tls");
	var { randomBytes, createHash: createHash$1 } = __require("crypto");
	var { Duplex: Duplex$2, Readable: Readable$1 } = __require("stream");
	var { URL } = __require("url");
	var PerMessageDeflate = require_permessage_deflate();
	var Receiver = require_receiver();
	var Sender = require_sender();
	var { isBlob } = require_validation();
	var { BINARY_TYPES, CLOSE_TIMEOUT, EMPTY_BUFFER, GUID, kForOnEventAttribute, kListener, kStatusCode, kWebSocket, NOOP } = require_constants();
	var { EventTarget: { addEventListener, removeEventListener } } = require_event_target();
	var { format, parse } = require_extension();
	var { toBuffer } = require_buffer_util();
	var kAborted = Symbol("kAborted");
	var protocolVersions = [8, 13];
	var readyStates = [
		"CONNECTING",
		"OPEN",
		"CLOSING",
		"CLOSED"
	];
	var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
	/**
	* Class representing a WebSocket.
	*
	* @extends EventEmitter
	*/
	var WebSocket = class WebSocket extends EventEmitter$3 {
		/**
		* Create a new `WebSocket`.
		*
		* @param {(String|URL)} address The URL to which to connect
		* @param {(String|String[])} [protocols] The subprotocols
		* @param {Object} [options] Connection options
		*/
		constructor(address, protocols, options) {
			super();
			this._binaryType = BINARY_TYPES[0];
			this._closeCode = 1006;
			this._closeFrameReceived = false;
			this._closeFrameSent = false;
			this._closeMessage = EMPTY_BUFFER;
			this._closeTimer = null;
			this._errorEmitted = false;
			this._extensions = {};
			this._paused = false;
			this._protocol = "";
			this._readyState = WebSocket.CONNECTING;
			this._receiver = null;
			this._sender = null;
			this._socket = null;
			if (address !== null) {
				this._bufferedAmount = 0;
				this._isServer = false;
				this._redirects = 0;
				if (protocols === void 0) protocols = [];
				else if (!Array.isArray(protocols)) {
					if (typeof protocols === "object" && protocols !== null) {
						options = protocols;
						protocols = [];
					} else protocols = [protocols];
				}
				initAsClient(this, address, protocols, options);
			} else {
				this._autoPong = options.autoPong;
				this._closeTimeout = options.closeTimeout;
				this._isServer = true;
			}
		}
		/**
		* For historical reasons, the custom "nodebuffer" type is used by the default
		* instead of "blob".
		*
		* @type {String}
		*/
		get binaryType() {
			return this._binaryType;
		}
		set binaryType(type) {
			if (!BINARY_TYPES.includes(type)) return;
			this._binaryType = type;
			if (this._receiver) this._receiver._binaryType = type;
		}
		/**
		* @type {Number}
		*/
		get bufferedAmount() {
			if (!this._socket) return this._bufferedAmount;
			return this._socket._writableState.length + this._sender._bufferedBytes;
		}
		/**
		* @type {String}
		*/
		get extensions() {
			return Object.keys(this._extensions).join();
		}
		/**
		* @type {Boolean}
		*/
		get isPaused() {
			return this._paused;
		}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onclose() {
			return null;
		}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onerror() {
			return null;
		}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onopen() {
			return null;
		}
		/**
		* @type {Function}
		*/
		/* istanbul ignore next */
		get onmessage() {
			return null;
		}
		/**
		* @type {String}
		*/
		get protocol() {
			return this._protocol;
		}
		/**
		* @type {Number}
		*/
		get readyState() {
			return this._readyState;
		}
		/**
		* @type {String}
		*/
		get url() {
			return this._url;
		}
		/**
		* Set up the socket and the internal resources.
		*
		* @param {Duplex} socket The network socket between the server and client
		* @param {Buffer} head The first packet of the upgraded stream
		* @param {Object} options Options object
		* @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
		*     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
		*     multiple times in the same tick
		* @param {Function} [options.generateMask] The function used to generate the
		*     masking key
		* @param {Number} [options.maxBufferedChunks=0] The maximum number of
		*     buffered data chunks
		* @param {Number} [options.maxFragments=0] The maximum number of message
		*     fragments
		* @param {Number} [options.maxPayload=0] The maximum allowed message size
		* @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
		*     not to skip UTF-8 validation for text and close messages
		* @private
		*/
		setSocket(socket, head, options) {
			const receiver = new Receiver({
				allowSynchronousEvents: options.allowSynchronousEvents,
				binaryType: this.binaryType,
				extensions: this._extensions,
				isServer: this._isServer,
				maxBufferedChunks: options.maxBufferedChunks,
				maxFragments: options.maxFragments,
				maxPayload: options.maxPayload,
				skipUTF8Validation: options.skipUTF8Validation
			});
			const sender = new Sender(socket, this._extensions, options.generateMask);
			this._receiver = receiver;
			this._sender = sender;
			this._socket = socket;
			receiver[kWebSocket] = this;
			sender[kWebSocket] = this;
			socket[kWebSocket] = this;
			receiver.on("conclude", receiverOnConclude);
			receiver.on("drain", receiverOnDrain);
			receiver.on("error", receiverOnError);
			receiver.on("message", receiverOnMessage);
			receiver.on("ping", receiverOnPing);
			receiver.on("pong", receiverOnPong);
			sender.onerror = senderOnError;
			if (socket.setTimeout) socket.setTimeout(0);
			if (socket.setNoDelay) socket.setNoDelay();
			if (head.length > 0) socket.unshift(head);
			socket.on("close", socketOnClose);
			socket.on("data", socketOnData);
			socket.on("end", socketOnEnd);
			socket.on("error", socketOnError);
			this._readyState = WebSocket.OPEN;
			this.emit("open");
		}
		/**
		* Emit the `'close'` event.
		*
		* @private
		*/
		emitClose() {
			if (!this._socket) {
				this._readyState = WebSocket.CLOSED;
				this.emit("close", this._closeCode, this._closeMessage);
				return;
			}
			if (this._extensions[PerMessageDeflate.extensionName]) this._extensions[PerMessageDeflate.extensionName].cleanup();
			this._receiver.removeAllListeners();
			this._readyState = WebSocket.CLOSED;
			this.emit("close", this._closeCode, this._closeMessage);
		}
		/**
		* Start a closing handshake.
		*
		*          +----------+   +-----------+   +----------+
		*     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
		*    |     +----------+   +-----------+   +----------+     |
		*          +----------+   +-----------+         |
		* CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
		*          +----------+   +-----------+   |
		*    |           |                        |   +---+        |
		*                +------------------------+-->|fin| - - - -
		*    |         +---+                      |   +---+
		*     - - - - -|fin|<---------------------+
		*              +---+
		*
		* @param {Number} [code] Status code explaining why the connection is closing
		* @param {(String|Buffer)} [data] The reason why the connection is
		*     closing
		* @public
		*/
		close(code, data) {
			if (this.readyState === WebSocket.CLOSED) return;
			if (this.readyState === WebSocket.CONNECTING) {
				abortHandshake(this, this._req, "WebSocket was closed before the connection was established");
				return;
			}
			if (this.readyState === WebSocket.CLOSING) {
				if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) this._socket.end();
				return;
			}
			this._readyState = WebSocket.CLOSING;
			this._sender.close(code, data, !this._isServer, (err) => {
				if (err) return;
				this._closeFrameSent = true;
				if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) this._socket.end();
			});
			setCloseTimer(this);
		}
		/**
		* Pause the socket.
		*
		* @public
		*/
		pause() {
			if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) return;
			this._paused = true;
			this._socket.pause();
		}
		/**
		* Send a ping.
		*
		* @param {*} [data] The data to send
		* @param {Boolean} [mask] Indicates whether or not to mask `data`
		* @param {Function} [cb] Callback which is executed when the ping is sent
		* @public
		*/
		ping(data, mask, cb) {
			if (this.readyState === WebSocket.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof data === "function") {
				cb = data;
				data = mask = void 0;
			} else if (typeof mask === "function") {
				cb = mask;
				mask = void 0;
			}
			if (typeof data === "number") data = data.toString();
			if (this.readyState !== WebSocket.OPEN) {
				sendAfterClose(this, data, cb);
				return;
			}
			if (mask === void 0) mask = !this._isServer;
			this._sender.ping(data || EMPTY_BUFFER, mask, cb);
		}
		/**
		* Send a pong.
		*
		* @param {*} [data] The data to send
		* @param {Boolean} [mask] Indicates whether or not to mask `data`
		* @param {Function} [cb] Callback which is executed when the pong is sent
		* @public
		*/
		pong(data, mask, cb) {
			if (this.readyState === WebSocket.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof data === "function") {
				cb = data;
				data = mask = void 0;
			} else if (typeof mask === "function") {
				cb = mask;
				mask = void 0;
			}
			if (typeof data === "number") data = data.toString();
			if (this.readyState !== WebSocket.OPEN) {
				sendAfterClose(this, data, cb);
				return;
			}
			if (mask === void 0) mask = !this._isServer;
			this._sender.pong(data || EMPTY_BUFFER, mask, cb);
		}
		/**
		* Resume the socket.
		*
		* @public
		*/
		resume() {
			if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) return;
			this._paused = false;
			if (!this._receiver._writableState.needDrain) this._socket.resume();
		}
		/**
		* Send a data message.
		*
		* @param {*} data The message to send
		* @param {Object} [options] Options object
		* @param {Boolean} [options.binary] Specifies whether `data` is binary or
		*     text
		* @param {Boolean} [options.compress] Specifies whether or not to compress
		*     `data`
		* @param {Boolean} [options.fin=true] Specifies whether the fragment is the
		*     last one
		* @param {Boolean} [options.mask] Specifies whether or not to mask `data`
		* @param {Function} [cb] Callback which is executed when data is written out
		* @public
		*/
		send(data, options, cb) {
			if (this.readyState === WebSocket.CONNECTING) throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
			if (typeof options === "function") {
				cb = options;
				options = {};
			}
			if (typeof data === "number") data = data.toString();
			if (this.readyState !== WebSocket.OPEN) {
				sendAfterClose(this, data, cb);
				return;
			}
			const opts = {
				binary: typeof data !== "string",
				mask: !this._isServer,
				compress: true,
				fin: true,
				...options
			};
			if (!this._extensions[PerMessageDeflate.extensionName]) opts.compress = false;
			this._sender.send(data || EMPTY_BUFFER, opts, cb);
		}
		/**
		* Forcibly close the connection.
		*
		* @public
		*/
		terminate() {
			if (this.readyState === WebSocket.CLOSED) return;
			if (this.readyState === WebSocket.CONNECTING) {
				abortHandshake(this, this._req, "WebSocket was closed before the connection was established");
				return;
			}
			if (this._socket) {
				this._readyState = WebSocket.CLOSING;
				this._socket.destroy();
			}
		}
	};
	/**
	* @constant {Number} CONNECTING
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket, "CONNECTING", {
		enumerable: true,
		value: readyStates.indexOf("CONNECTING")
	});
	/**
	* @constant {Number} CONNECTING
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket.prototype, "CONNECTING", {
		enumerable: true,
		value: readyStates.indexOf("CONNECTING")
	});
	/**
	* @constant {Number} OPEN
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket, "OPEN", {
		enumerable: true,
		value: readyStates.indexOf("OPEN")
	});
	/**
	* @constant {Number} OPEN
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket.prototype, "OPEN", {
		enumerable: true,
		value: readyStates.indexOf("OPEN")
	});
	/**
	* @constant {Number} CLOSING
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket, "CLOSING", {
		enumerable: true,
		value: readyStates.indexOf("CLOSING")
	});
	/**
	* @constant {Number} CLOSING
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket.prototype, "CLOSING", {
		enumerable: true,
		value: readyStates.indexOf("CLOSING")
	});
	/**
	* @constant {Number} CLOSED
	* @memberof WebSocket
	*/
	Object.defineProperty(WebSocket, "CLOSED", {
		enumerable: true,
		value: readyStates.indexOf("CLOSED")
	});
	/**
	* @constant {Number} CLOSED
	* @memberof WebSocket.prototype
	*/
	Object.defineProperty(WebSocket.prototype, "CLOSED", {
		enumerable: true,
		value: readyStates.indexOf("CLOSED")
	});
	[
		"binaryType",
		"bufferedAmount",
		"extensions",
		"isPaused",
		"protocol",
		"readyState",
		"url"
	].forEach((property) => {
		Object.defineProperty(WebSocket.prototype, property, { enumerable: true });
	});
	[
		"open",
		"error",
		"close",
		"message"
	].forEach((method) => {
		Object.defineProperty(WebSocket.prototype, `on${method}`, {
			enumerable: true,
			get() {
				for (const listener of this.listeners(method)) if (listener[kForOnEventAttribute]) return listener[kListener];
				return null;
			},
			set(handler) {
				for (const listener of this.listeners(method)) if (listener[kForOnEventAttribute]) {
					this.removeListener(method, listener);
					break;
				}
				if (typeof handler !== "function") return;
				this.addEventListener(method, handler, { [kForOnEventAttribute]: true });
			}
		});
	});
	WebSocket.prototype.addEventListener = addEventListener;
	WebSocket.prototype.removeEventListener = removeEventListener;
	module.exports = WebSocket;
	/**
	* Initialize a WebSocket client.
	*
	* @param {WebSocket} websocket The client to initialize
	* @param {(String|URL)} address The URL to which to connect
	* @param {Array} protocols The subprotocols
	* @param {Object} [options] Connection options
	* @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether any
	*     of the `'message'`, `'ping'`, and `'pong'` events can be emitted multiple
	*     times in the same tick
	* @param {Boolean} [options.autoPong=true] Specifies whether or not to
	*     automatically send a pong in response to a ping
	* @param {Number} [options.closeTimeout=30000] Duration in milliseconds to wait
	*     for the closing handshake to finish after `websocket.close()` is called
	* @param {Function} [options.finishRequest] A function which can be used to
	*     customize the headers of each http request before it is sent
	* @param {Boolean} [options.followRedirects=false] Whether or not to follow
	*     redirects
	* @param {Function} [options.generateMask] The function used to generate the
	*     masking key
	* @param {Number} [options.handshakeTimeout] Timeout in milliseconds for the
	*     handshake request
	* @param {Number} [options.maxBufferedChunks=1048576] The maximum number of
	*     buffered data chunks
	* @param {Number} [options.maxFragments=131072] The maximum number of message
	*     fragments
	* @param {Number} [options.maxPayload=104857600] The maximum allowed message
	*     size
	* @param {Number} [options.maxRedirects=10] The maximum number of redirects
	*     allowed
	* @param {String} [options.origin] Value of the `Origin` or
	*     `Sec-WebSocket-Origin` header
	* @param {(Boolean|Object)} [options.perMessageDeflate=true] Enable/disable
	*     permessage-deflate
	* @param {Number} [options.protocolVersion=13] Value of the
	*     `Sec-WebSocket-Version` header
	* @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
	*     not to skip UTF-8 validation for text and close messages
	* @private
	*/
	function initAsClient(websocket, address, protocols, options) {
		const opts = {
			allowSynchronousEvents: true,
			autoPong: true,
			closeTimeout: CLOSE_TIMEOUT,
			protocolVersion: protocolVersions[1],
			maxBufferedChunks: 1048576,
			maxFragments: 131072,
			maxPayload: 104857600,
			skipUTF8Validation: false,
			perMessageDeflate: true,
			followRedirects: false,
			maxRedirects: 10,
			...options,
			socketPath: void 0,
			hostname: void 0,
			protocol: void 0,
			timeout: void 0,
			method: "GET",
			host: void 0,
			path: void 0,
			port: void 0
		};
		websocket._autoPong = opts.autoPong;
		websocket._closeTimeout = opts.closeTimeout;
		if (!protocolVersions.includes(opts.protocolVersion)) throw new RangeError(`Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`);
		let parsedUrl;
		if (address instanceof URL) parsedUrl = address;
		else try {
			parsedUrl = new URL(address);
		} catch {
			throw new SyntaxError(`Invalid URL: ${address}`);
		}
		if (parsedUrl.protocol === "http:") parsedUrl.protocol = "ws:";
		else if (parsedUrl.protocol === "https:") parsedUrl.protocol = "wss:";
		websocket._url = parsedUrl.href;
		const isSecure = parsedUrl.protocol === "wss:";
		const isIpcUrl = parsedUrl.protocol === "ws+unix:";
		let invalidUrlMessage;
		if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) invalidUrlMessage = "The URL's protocol must be one of \"ws:\", \"wss:\", \"http:\", \"https:\", or \"ws+unix:\"";
		else if (isIpcUrl && !parsedUrl.pathname) invalidUrlMessage = "The URL's pathname is empty";
		else if (parsedUrl.hash) invalidUrlMessage = "The URL contains a fragment identifier";
		if (invalidUrlMessage) {
			const err = new SyntaxError(invalidUrlMessage);
			if (websocket._redirects === 0) throw err;
			else {
				emitErrorAndClose(websocket, err);
				return;
			}
		}
		const defaultPort = isSecure ? 443 : 80;
		const key = randomBytes(16).toString("base64");
		const request = isSecure ? https$1.request : http$2.request;
		const protocolSet = /* @__PURE__ */ new Set();
		let perMessageDeflate;
		opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
		opts.defaultPort = opts.defaultPort || defaultPort;
		opts.port = parsedUrl.port || defaultPort;
		opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
		opts.headers = {
			...opts.headers,
			"Sec-WebSocket-Version": opts.protocolVersion,
			"Sec-WebSocket-Key": key,
			Connection: "Upgrade",
			Upgrade: "websocket"
		};
		opts.path = parsedUrl.pathname + parsedUrl.search;
		opts.timeout = opts.handshakeTimeout;
		if (opts.perMessageDeflate) {
			perMessageDeflate = new PerMessageDeflate({
				...opts.perMessageDeflate,
				isServer: false,
				maxPayload: opts.maxPayload
			});
			opts.headers["Sec-WebSocket-Extensions"] = format({ [PerMessageDeflate.extensionName]: perMessageDeflate.offer() });
		}
		if (protocols.length) {
			for (const protocol of protocols) {
				if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) throw new SyntaxError("An invalid or duplicated subprotocol was specified");
				protocolSet.add(protocol);
			}
			opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
		}
		if (opts.origin) {
			if (opts.protocolVersion < 13) opts.headers["Sec-WebSocket-Origin"] = opts.origin;
			else opts.headers.Origin = opts.origin;
		}
		if (parsedUrl.username || parsedUrl.password) opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
		if (isIpcUrl) {
			const parts = opts.path.split(":");
			opts.socketPath = parts[0];
			opts.path = parts[1];
		}
		let req;
		if (opts.followRedirects) {
			if (websocket._redirects === 0) {
				websocket._originalIpc = isIpcUrl;
				websocket._originalSecure = isSecure;
				websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
				const headers = options && options.headers;
				options = {
					...options,
					headers: {}
				};
				if (headers) for (const [key, value] of Object.entries(headers)) options.headers[key.toLowerCase()] = value;
			} else if (websocket.listenerCount("redirect") === 0) {
				const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
				if (!isSameHost || websocket._originalSecure && !isSecure) {
					delete opts.headers.authorization;
					delete opts.headers.cookie;
					if (!isSameHost) delete opts.headers.host;
					opts.auth = void 0;
				}
			}
			if (opts.auth && !options.headers.authorization) options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
			req = websocket._req = request(opts);
			if (websocket._redirects) websocket.emit("redirect", websocket.url, req);
		} else req = websocket._req = request(opts);
		if (opts.timeout) req.on("timeout", () => {
			abortHandshake(websocket, req, "Opening handshake has timed out");
		});
		req.on("error", (err) => {
			if (req === null || req[kAborted]) return;
			req = websocket._req = null;
			emitErrorAndClose(websocket, err);
		});
		req.on("response", (res) => {
			const location = res.headers.location;
			const statusCode = res.statusCode;
			if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
				if (++websocket._redirects > opts.maxRedirects) {
					abortHandshake(websocket, req, "Maximum redirects exceeded");
					return;
				}
				req.abort();
				let addr;
				try {
					addr = new URL(location, address);
				} catch (e) {
					emitErrorAndClose(websocket, /* @__PURE__ */ new SyntaxError(`Invalid URL: ${location}`));
					return;
				}
				initAsClient(websocket, addr, protocols, options);
			} else if (!websocket.emit("unexpected-response", req, res)) abortHandshake(websocket, req, `Unexpected server response: ${res.statusCode}`);
		});
		req.on("upgrade", (res, socket, head) => {
			websocket.emit("upgrade", res);
			if (websocket.readyState !== WebSocket.CONNECTING) return;
			req = websocket._req = null;
			const upgrade = res.headers.upgrade;
			if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
				abortHandshake(websocket, socket, "Invalid Upgrade header");
				return;
			}
			const digest = createHash$1("sha1").update(key + GUID).digest("base64");
			if (res.headers["sec-websocket-accept"] !== digest) {
				abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
				return;
			}
			const serverProt = res.headers["sec-websocket-protocol"];
			let protError;
			if (serverProt !== void 0) {
				if (!protocolSet.size) protError = "Server sent a subprotocol but none was requested";
				else if (!protocolSet.has(serverProt)) protError = "Server sent an invalid subprotocol";
			} else if (protocolSet.size) protError = "Server sent no subprotocol";
			if (protError) {
				abortHandshake(websocket, socket, protError);
				return;
			}
			if (serverProt) websocket._protocol = serverProt;
			const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
			if (secWebSocketExtensions !== void 0) {
				if (!perMessageDeflate) {
					abortHandshake(websocket, socket, "Server sent a Sec-WebSocket-Extensions header but no extension was requested");
					return;
				}
				let extensions;
				try {
					extensions = parse(secWebSocketExtensions);
				} catch (err) {
					abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Extensions header");
					return;
				}
				const extensionNames = Object.keys(extensions);
				if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
					abortHandshake(websocket, socket, "Server indicated an extension that was not requested");
					return;
				}
				try {
					perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
				} catch (err) {
					abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Extensions header");
					return;
				}
				websocket._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
			}
			websocket.setSocket(socket, head, {
				allowSynchronousEvents: opts.allowSynchronousEvents,
				generateMask: opts.generateMask,
				maxBufferedChunks: opts.maxBufferedChunks,
				maxFragments: opts.maxFragments,
				maxPayload: opts.maxPayload,
				skipUTF8Validation: opts.skipUTF8Validation
			});
		});
		if (opts.finishRequest) opts.finishRequest(req, websocket);
		else req.end();
	}
	/**
	* Emit the `'error'` and `'close'` events.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @param {Error} The error to emit
	* @private
	*/
	function emitErrorAndClose(websocket, err) {
		websocket._readyState = WebSocket.CLOSING;
		websocket._errorEmitted = true;
		websocket.emit("error", err);
		websocket.emitClose();
	}
	/**
	* Create a `net.Socket` and initiate a connection.
	*
	* @param {Object} options Connection options
	* @return {net.Socket} The newly created socket used to start the connection
	* @private
	*/
	function netConnect(options) {
		options.path = options.socketPath;
		return net.connect(options);
	}
	/**
	* Create a `tls.TLSSocket` and initiate a connection.
	*
	* @param {Object} options Connection options
	* @return {tls.TLSSocket} The newly created socket used to start the connection
	* @private
	*/
	function tlsConnect(options) {
		options.path = void 0;
		if (!options.servername && options.servername !== "") options.servername = net.isIP(options.host) ? "" : options.host;
		return tls.connect(options);
	}
	/**
	* Abort the handshake and emit an error.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @param {(http.ClientRequest|net.Socket|tls.Socket)} stream The request to
	*     abort or the socket to destroy
	* @param {String} message The error message
	* @private
	*/
	function abortHandshake(websocket, stream, message) {
		websocket._readyState = WebSocket.CLOSING;
		const err = new Error(message);
		Error.captureStackTrace(err, abortHandshake);
		if (stream.setHeader) {
			stream[kAborted] = true;
			stream.abort();
			if (stream.socket && !stream.socket.destroyed) stream.socket.destroy();
			process.nextTick(emitErrorAndClose, websocket, err);
		} else {
			stream.destroy(err);
			stream.once("error", websocket.emit.bind(websocket, "error"));
			stream.once("close", websocket.emitClose.bind(websocket));
		}
	}
	/**
	* Handle cases where the `ping()`, `pong()`, or `send()` methods are called
	* when the `readyState` attribute is `CLOSING` or `CLOSED`.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @param {*} [data] The data to send
	* @param {Function} [cb] Callback
	* @private
	*/
	function sendAfterClose(websocket, data, cb) {
		if (data) {
			const length = isBlob(data) ? data.size : toBuffer(data).length;
			if (websocket._socket) websocket._sender._bufferedBytes += length;
			else websocket._bufferedAmount += length;
		}
		if (cb) {
			const err = /* @__PURE__ */ new Error(`WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`);
			process.nextTick(cb, err);
		}
	}
	/**
	* The listener of the `Receiver` `'conclude'` event.
	*
	* @param {Number} code The status code
	* @param {Buffer} reason The reason for closing
	* @private
	*/
	function receiverOnConclude(code, reason) {
		const websocket = this[kWebSocket];
		websocket._closeFrameReceived = true;
		websocket._closeMessage = reason;
		websocket._closeCode = code;
		if (websocket._socket[kWebSocket] === void 0) return;
		websocket._socket.removeListener("data", socketOnData);
		process.nextTick(resume, websocket._socket);
		if (code === 1005) websocket.close();
		else websocket.close(code, reason);
	}
	/**
	* The listener of the `Receiver` `'drain'` event.
	*
	* @private
	*/
	function receiverOnDrain() {
		const websocket = this[kWebSocket];
		if (!websocket.isPaused) websocket._socket.resume();
	}
	/**
	* The listener of the `Receiver` `'error'` event.
	*
	* @param {(RangeError|Error)} err The emitted error
	* @private
	*/
	function receiverOnError(err) {
		const websocket = this[kWebSocket];
		if (websocket._socket[kWebSocket] !== void 0) {
			websocket._socket.removeListener("data", socketOnData);
			process.nextTick(resume, websocket._socket);
			websocket.close(err[kStatusCode]);
		}
		if (!websocket._errorEmitted) {
			websocket._errorEmitted = true;
			websocket.emit("error", err);
		}
	}
	/**
	* The listener of the `Receiver` `'finish'` event.
	*
	* @private
	*/
	function receiverOnFinish() {
		this[kWebSocket].emitClose();
	}
	/**
	* The listener of the `Receiver` `'message'` event.
	*
	* @param {Buffer|ArrayBuffer|Buffer[])} data The message
	* @param {Boolean} isBinary Specifies whether the message is binary or not
	* @private
	*/
	function receiverOnMessage(data, isBinary) {
		this[kWebSocket].emit("message", data, isBinary);
	}
	/**
	* The listener of the `Receiver` `'ping'` event.
	*
	* @param {Buffer} data The data included in the ping frame
	* @private
	*/
	function receiverOnPing(data) {
		const websocket = this[kWebSocket];
		if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
		websocket.emit("ping", data);
	}
	/**
	* The listener of the `Receiver` `'pong'` event.
	*
	* @param {Buffer} data The data included in the pong frame
	* @private
	*/
	function receiverOnPong(data) {
		this[kWebSocket].emit("pong", data);
	}
	/**
	* Resume a readable stream
	*
	* @param {Readable} stream The readable stream
	* @private
	*/
	function resume(stream) {
		stream.resume();
	}
	/**
	* The `Sender` error event handler.
	*
	* @param {Error} The error
	* @private
	*/
	function senderOnError(err) {
		const websocket = this[kWebSocket];
		if (websocket.readyState === WebSocket.CLOSED) return;
		if (websocket.readyState === WebSocket.OPEN) {
			websocket._readyState = WebSocket.CLOSING;
			setCloseTimer(websocket);
		}
		this._socket.end();
		if (!websocket._errorEmitted) {
			websocket._errorEmitted = true;
			websocket.emit("error", err);
		}
	}
	/**
	* Set a timer to destroy the underlying raw socket of a WebSocket.
	*
	* @param {WebSocket} websocket The WebSocket instance
	* @private
	*/
	function setCloseTimer(websocket) {
		websocket._closeTimer = setTimeout(websocket._socket.destroy.bind(websocket._socket), websocket._closeTimeout);
	}
	/**
	* The listener of the socket `'close'` event.
	*
	* @private
	*/
	function socketOnClose() {
		const websocket = this[kWebSocket];
		this.removeListener("close", socketOnClose);
		this.removeListener("data", socketOnData);
		this.removeListener("end", socketOnEnd);
		websocket._readyState = WebSocket.CLOSING;
		if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
			const chunk = this.read(this._readableState.length);
			websocket._receiver.write(chunk);
		}
		websocket._receiver.end();
		this[kWebSocket] = void 0;
		clearTimeout(websocket._closeTimer);
		if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) websocket.emitClose();
		else {
			websocket._receiver.on("error", receiverOnFinish);
			websocket._receiver.on("finish", receiverOnFinish);
		}
	}
	/**
	* The listener of the socket `'data'` event.
	*
	* @param {Buffer} chunk A chunk of data
	* @private
	*/
	function socketOnData(chunk) {
		if (!this[kWebSocket]._receiver.write(chunk)) this.pause();
	}
	/**
	* The listener of the socket `'end'` event.
	*
	* @private
	*/
	function socketOnEnd() {
		const websocket = this[kWebSocket];
		websocket._readyState = WebSocket.CLOSING;
		websocket._receiver.end();
		this.end();
	}
	/**
	* The listener of the socket `'error'` event.
	*
	* @private
	*/
	function socketOnError() {
		const websocket = this[kWebSocket];
		this.removeListener("error", socketOnError);
		this.on("error", NOOP);
		if (websocket) {
			websocket._readyState = WebSocket.CLOSING;
			this.destroy();
		}
	}
}));
//#endregion
//#region node_modules/ws/lib/stream.js
var require_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	require_websocket();
	var { Duplex: Duplex$1 } = __require("stream");
	/**
	* Emits the `'close'` event on a stream.
	*
	* @param {Duplex} stream The stream.
	* @private
	*/
	function emitClose(stream) {
		stream.emit("close");
	}
	/**
	* The listener of the `'end'` event.
	*
	* @private
	*/
	function duplexOnEnd() {
		if (!this.destroyed && this._writableState.finished) this.destroy();
	}
	/**
	* The listener of the `'error'` event.
	*
	* @param {Error} err The error
	* @private
	*/
	function duplexOnError(err) {
		this.removeListener("error", duplexOnError);
		this.destroy();
		if (this.listenerCount("error") === 0) this.emit("error", err);
	}
	/**
	* Wraps a `WebSocket` in a duplex stream.
	*
	* @param {WebSocket} ws The `WebSocket` to wrap
	* @param {Object} [options] The options for the `Duplex` constructor
	* @return {Duplex} The duplex stream
	* @public
	*/
	function createWebSocketStream(ws, options) {
		let terminateOnDestroy = true;
		const duplex = new Duplex$1({
			...options,
			autoDestroy: false,
			emitClose: false,
			objectMode: false,
			writableObjectMode: false
		});
		ws.on("message", function message(msg, isBinary) {
			const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
			if (!duplex.push(data)) ws.pause();
		});
		ws.once("error", function error(err) {
			if (duplex.destroyed) return;
			terminateOnDestroy = false;
			duplex.destroy(err);
		});
		ws.once("close", function close() {
			if (duplex.destroyed) return;
			duplex.push(null);
		});
		duplex._destroy = function(err, callback) {
			if (ws.readyState === ws.CLOSED) {
				callback(err);
				process.nextTick(emitClose, duplex);
				return;
			}
			let called = false;
			ws.once("error", function error(err) {
				called = true;
				callback(err);
			});
			ws.once("close", function close() {
				if (!called) callback(err);
				process.nextTick(emitClose, duplex);
			});
			if (terminateOnDestroy) ws.terminate();
		};
		duplex._final = function(callback) {
			if (ws.readyState === ws.CONNECTING) {
				ws.once("open", function open() {
					duplex._final(callback);
				});
				return;
			}
			if (ws._socket === null) return;
			if (ws._socket._writableState.finished) {
				callback();
				if (duplex._readableState.endEmitted) duplex.destroy();
			} else {
				ws._socket.once("finish", function finish() {
					callback();
				});
				ws.close();
			}
		};
		duplex._read = function() {
			if (ws.isPaused) ws.resume();
		};
		duplex._write = function(chunk, encoding, callback) {
			if (ws.readyState === ws.CONNECTING) {
				ws.once("open", function open() {
					duplex._write(chunk, encoding, callback);
				});
				return;
			}
			ws.send(chunk, callback);
		};
		duplex.on("end", duplexOnEnd);
		duplex.on("error", duplexOnError);
		return duplex;
	}
	module.exports = createWebSocketStream;
}));
//#endregion
//#region node_modules/ws/lib/subprotocol.js
var require_subprotocol = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { tokenChars } = require_validation();
	/**
	* Parses the `Sec-WebSocket-Protocol` header into a set of subprotocol names.
	*
	* @param {String} header The field value of the header
	* @return {Set} The subprotocol names
	* @public
	*/
	function parse(header) {
		const protocols = /* @__PURE__ */ new Set();
		let start = -1;
		let end = -1;
		let i = 0;
		for (; i < header.length; i++) {
			const code = header.charCodeAt(i);
			if (end === -1 && tokenChars[code] === 1) {
				if (start === -1) start = i;
			} else if (i !== 0 && (code === 32 || code === 9)) {
				if (end === -1 && start !== -1) end = i;
			} else if (code === 44) {
				if (start === -1) throw new SyntaxError(`Unexpected character at index ${i}`);
				if (end === -1) end = i;
				const protocol = header.slice(start, end);
				if (protocols.has(protocol)) throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
				protocols.add(protocol);
				start = end = -1;
			} else throw new SyntaxError(`Unexpected character at index ${i}`);
		}
		if (start === -1 || end !== -1) throw new SyntaxError("Unexpected end of input");
		const protocol = header.slice(start, i);
		if (protocols.has(protocol)) throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
		protocols.add(protocol);
		return protocols;
	}
	module.exports = { parse };
}));
//#endregion
//#region node_modules/ws/lib/websocket-server.js
var require_websocket_server = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var EventEmitter$2 = __require("events");
	var http$1 = __require("http");
	var { Duplex } = __require("stream");
	var { createHash } = __require("crypto");
	var extension = require_extension();
	var PerMessageDeflate = require_permessage_deflate();
	var subprotocol = require_subprotocol();
	var WebSocket = require_websocket();
	var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
	var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
	var RUNNING = 0;
	var CLOSING = 1;
	var CLOSED = 2;
	/**
	* Class representing a WebSocket server.
	*
	* @extends EventEmitter
	*/
	var WebSocketServer = class extends EventEmitter$2 {
		/**
		* Create a `WebSocketServer` instance.
		*
		* @param {Object} options Configuration options
		* @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
		*     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
		*     multiple times in the same tick
		* @param {Boolean} [options.autoPong=true] Specifies whether or not to
		*     automatically send a pong in response to a ping
		* @param {Number} [options.backlog=511] The maximum length of the queue of
		*     pending connections
		* @param {Boolean} [options.clientTracking=true] Specifies whether or not to
		*     track clients
		* @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
		*     wait for the closing handshake to finish after `websocket.close()` is
		*     called
		* @param {Function} [options.handleProtocols] A hook to handle protocols
		* @param {String} [options.host] The hostname where to bind the server
		* @param {Number} [options.maxBufferedChunks=1048576] The maximum number of
		*     buffered data chunks
		* @param {Number} [options.maxFragments=131072] The maximum number of message
		*     fragments
		* @param {Number} [options.maxPayload=104857600] The maximum allowed message
		*     size
		* @param {Boolean} [options.noServer=false] Enable no server mode
		* @param {String} [options.path] Accept only connections matching this path
		* @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
		*     permessage-deflate
		* @param {Number} [options.port] The port where to bind the server
		* @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
		*     server to use
		* @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
		*     not to skip UTF-8 validation for text and close messages
		* @param {Function} [options.verifyClient] A hook to reject connections
		* @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
		*     class to use. It must be the `WebSocket` class or class that extends it
		* @param {Function} [callback] A listener for the `listening` event
		*/
		constructor(options, callback) {
			super();
			options = {
				allowSynchronousEvents: true,
				autoPong: true,
				maxBufferedChunks: 1048576,
				maxFragments: 131072,
				maxPayload: 104857600,
				skipUTF8Validation: false,
				perMessageDeflate: false,
				handleProtocols: null,
				clientTracking: true,
				closeTimeout: CLOSE_TIMEOUT,
				verifyClient: null,
				noServer: false,
				backlog: null,
				server: null,
				host: null,
				path: null,
				port: null,
				WebSocket,
				...options
			};
			if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) throw new TypeError("One and only one of the \"port\", \"server\", or \"noServer\" options must be specified");
			if (options.port != null) {
				this._server = http$1.createServer((req, res) => {
					const body = http$1.STATUS_CODES[426];
					res.writeHead(426, {
						"Content-Length": body.length,
						"Content-Type": "text/plain"
					});
					res.end(body);
				});
				this._server.listen(options.port, options.host, options.backlog, callback);
			} else if (options.server) this._server = options.server;
			if (this._server) {
				const emitConnection = this.emit.bind(this, "connection");
				this._removeListeners = addListeners(this._server, {
					listening: this.emit.bind(this, "listening"),
					error: this.emit.bind(this, "error"),
					upgrade: (req, socket, head) => {
						this.handleUpgrade(req, socket, head, emitConnection);
					}
				});
			}
			if (options.perMessageDeflate === true) options.perMessageDeflate = {};
			if (options.clientTracking) {
				this.clients = /* @__PURE__ */ new Set();
				this._shouldEmitClose = false;
			}
			this.options = options;
			this._state = RUNNING;
		}
		/**
		* Returns the bound address, the address family name, and port of the server
		* as reported by the operating system if listening on an IP socket.
		* If the server is listening on a pipe or UNIX domain socket, the name is
		* returned as a string.
		*
		* @return {(Object|String|null)} The address of the server
		* @public
		*/
		address() {
			if (this.options.noServer) throw new Error("The server is operating in \"noServer\" mode");
			if (!this._server) return null;
			return this._server.address();
		}
		/**
		* Stop the server from accepting new connections and emit the `'close'` event
		* when all existing connections are closed.
		*
		* @param {Function} [cb] A one-time listener for the `'close'` event
		* @public
		*/
		close(cb) {
			if (this._state === CLOSED) {
				if (cb) this.once("close", () => {
					cb(/* @__PURE__ */ new Error("The server is not running"));
				});
				process.nextTick(emitClose, this);
				return;
			}
			if (cb) this.once("close", cb);
			if (this._state === CLOSING) return;
			this._state = CLOSING;
			if (this.options.noServer || this.options.server) {
				if (this._server) {
					this._removeListeners();
					this._removeListeners = this._server = null;
				}
				if (this.clients) {
					if (!this.clients.size) process.nextTick(emitClose, this);
					else this._shouldEmitClose = true;
				} else process.nextTick(emitClose, this);
			} else {
				const server = this._server;
				this._removeListeners();
				this._removeListeners = this._server = null;
				server.close(() => {
					emitClose(this);
				});
			}
		}
		/**
		* See if a given request should be handled by this server instance.
		*
		* @param {http.IncomingMessage} req Request object to inspect
		* @return {Boolean} `true` if the request is valid, else `false`
		* @public
		*/
		shouldHandle(req) {
			if (this.options.path) {
				const index = req.url.indexOf("?");
				if ((index !== -1 ? req.url.slice(0, index) : req.url) !== this.options.path) return false;
			}
			return true;
		}
		/**
		* Handle a HTTP Upgrade request.
		*
		* @param {http.IncomingMessage} req The request object
		* @param {Duplex} socket The network socket between the server and client
		* @param {Buffer} head The first packet of the upgraded stream
		* @param {Function} cb Callback
		* @public
		*/
		handleUpgrade(req, socket, head, cb) {
			socket.on("error", socketOnError);
			const key = req.headers["sec-websocket-key"];
			const upgrade = req.headers.upgrade;
			const version = +req.headers["sec-websocket-version"];
			if (req.method !== "GET") {
				abortHandshakeOrEmitwsClientError(this, req, socket, 405, "Invalid HTTP method");
				return;
			}
			if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
				abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Invalid Upgrade header");
				return;
			}
			if (key === void 0 || !keyRegex.test(key)) {
				abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Missing or invalid Sec-WebSocket-Key header");
				return;
			}
			if (version !== 13 && version !== 8) {
				abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Missing or invalid Sec-WebSocket-Version header", { "Sec-WebSocket-Version": "13, 8" });
				return;
			}
			if (!this.shouldHandle(req)) {
				abortHandshake(socket, 400);
				return;
			}
			const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
			let protocols = /* @__PURE__ */ new Set();
			if (secWebSocketProtocol !== void 0) try {
				protocols = subprotocol.parse(secWebSocketProtocol);
			} catch (err) {
				abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Invalid Sec-WebSocket-Protocol header");
				return;
			}
			const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
			const extensions = {};
			if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
				const perMessageDeflate = new PerMessageDeflate({
					...this.options.perMessageDeflate,
					isServer: true,
					maxPayload: this.options.maxPayload
				});
				try {
					const offers = extension.parse(secWebSocketExtensions);
					if (offers[PerMessageDeflate.extensionName]) {
						perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
						extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
					}
				} catch (err) {
					abortHandshakeOrEmitwsClientError(this, req, socket, 400, "Invalid or unacceptable Sec-WebSocket-Extensions header");
					return;
				}
			}
			if (this.options.verifyClient) {
				const info = {
					origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
					secure: !!(req.socket.authorized || req.socket.encrypted),
					req
				};
				if (this.options.verifyClient.length === 2) {
					this.options.verifyClient(info, (verified, code, message, headers) => {
						if (!verified) return abortHandshake(socket, code || 401, message, headers);
						this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
					});
					return;
				}
				if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
			}
			this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
		}
		/**
		* Upgrade the connection to WebSocket.
		*
		* @param {Object} extensions The accepted extensions
		* @param {String} key The value of the `Sec-WebSocket-Key` header
		* @param {Set} protocols The subprotocols
		* @param {http.IncomingMessage} req The request object
		* @param {Duplex} socket The network socket between the server and client
		* @param {Buffer} head The first packet of the upgraded stream
		* @param {Function} cb Callback
		* @throws {Error} If called more than once with the same socket
		* @private
		*/
		completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
			if (!socket.readable || !socket.writable) return socket.destroy();
			if (socket[kWebSocket]) throw new Error("server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration");
			if (this._state > RUNNING) return abortHandshake(socket, 503);
			const headers = [
				"HTTP/1.1 101 Switching Protocols",
				"Upgrade: websocket",
				"Connection: Upgrade",
				`Sec-WebSocket-Accept: ${createHash("sha1").update(key + GUID).digest("base64")}`
			];
			const ws = new this.options.WebSocket(null, void 0, this.options);
			if (protocols.size) {
				const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
				if (protocol) {
					headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
					ws._protocol = protocol;
				}
			}
			if (extensions[PerMessageDeflate.extensionName]) {
				const params = extensions[PerMessageDeflate.extensionName].params;
				const value = extension.format({ [PerMessageDeflate.extensionName]: [params] });
				headers.push(`Sec-WebSocket-Extensions: ${value}`);
				ws._extensions = extensions;
			}
			this.emit("headers", headers, req);
			socket.write(headers.concat("\r\n").join("\r\n"));
			socket.removeListener("error", socketOnError);
			ws.setSocket(socket, head, {
				allowSynchronousEvents: this.options.allowSynchronousEvents,
				maxBufferedChunks: this.options.maxBufferedChunks,
				maxFragments: this.options.maxFragments,
				maxPayload: this.options.maxPayload,
				skipUTF8Validation: this.options.skipUTF8Validation
			});
			if (this.clients) {
				this.clients.add(ws);
				ws.on("close", () => {
					this.clients.delete(ws);
					if (this._shouldEmitClose && !this.clients.size) process.nextTick(emitClose, this);
				});
			}
			cb(ws, req);
		}
	};
	module.exports = WebSocketServer;
	/**
	* Add event listeners on an `EventEmitter` using a map of <event, listener>
	* pairs.
	*
	* @param {EventEmitter} server The event emitter
	* @param {Object.<String, Function>} map The listeners to add
	* @return {Function} A function that will remove the added listeners when
	*     called
	* @private
	*/
	function addListeners(server, map) {
		for (const event of Object.keys(map)) server.on(event, map[event]);
		return function removeListeners() {
			for (const event of Object.keys(map)) server.removeListener(event, map[event]);
		};
	}
	/**
	* Emit a `'close'` event on an `EventEmitter`.
	*
	* @param {EventEmitter} server The event emitter
	* @private
	*/
	function emitClose(server) {
		server._state = CLOSED;
		server.emit("close");
	}
	/**
	* Handle socket errors.
	*
	* @private
	*/
	function socketOnError() {
		this.destroy();
	}
	/**
	* Close the connection when preconditions are not fulfilled.
	*
	* @param {Duplex} socket The socket of the upgrade request
	* @param {Number} code The HTTP response status code
	* @param {String} [message] The HTTP response body
	* @param {Object} [headers] Additional HTTP response headers
	* @private
	*/
	function abortHandshake(socket, code, message, headers) {
		message = message || http$1.STATUS_CODES[code];
		headers = {
			Connection: "close",
			"Content-Type": "text/html",
			"Content-Length": Buffer.byteLength(message),
			...headers
		};
		socket.once("finish", socket.destroy);
		socket.end(`HTTP/1.1 ${code} ${http$1.STATUS_CODES[code]}\r\n` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message);
	}
	/**
	* Emit a `'wsClientError'` event on a `WebSocketServer` if there is at least
	* one listener for it, otherwise call `abortHandshake()`.
	*
	* @param {WebSocketServer} server The WebSocket server
	* @param {http.IncomingMessage} req The request object
	* @param {Duplex} socket The socket of the upgrade request
	* @param {Number} code The HTTP response status code
	* @param {String} message The HTTP response body
	* @param {Object} [headers] The HTTP response headers
	* @private
	*/
	function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
		if (server.listenerCount("wsClientError")) {
			const err = new Error(message);
			Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
			server.emit("wsClientError", err, socket, req);
		} else abortHandshake(socket, code, message, headers);
	}
}));
require_stream();
require_extension();
require_permessage_deflate();
require_receiver();
require_sender();
require_subprotocol();
var import_websocket = /* @__PURE__ */ __toESM(require_websocket(), 1);
require_websocket_server();
var wrapper_default = import_websocket.default;
//#endregion
//#region node_modules/rpc-websockets/node_modules/eventemitter3/index.mjs
var import_eventemitter3 = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var has = Object.prototype.hasOwnProperty;
	var prefix = "~";
	/**
	* Constructor to create a storage for our `EE` objects.
	* An `Events` instance is a plain object whose properties are event names.
	*
	* @constructor
	* @private
	*/
	function Events() {}
	if (Object.create) {
		Events.prototype = Object.create(null);
		if (!new Events().__proto__) prefix = false;
	}
	/**
	* Representation of a single event listener.
	*
	* @param {Function} fn The listener function.
	* @param {*} context The context to invoke the listener with.
	* @param {Boolean} [once=false] Specify if the listener is a one-time listener.
	* @constructor
	* @private
	*/
	function EE(fn, context, once) {
		this.fn = fn;
		this.context = context;
		this.once = once || false;
	}
	/**
	* Add a listener for a given event.
	*
	* @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	* @param {(String|Symbol)} event The event name.
	* @param {Function} fn The listener function.
	* @param {*} context The context to invoke the listener with.
	* @param {Boolean} once Specify if the listener is a one-time listener.
	* @returns {EventEmitter}
	* @private
	*/
	function addListener(emitter, event, fn, context, once) {
		if (typeof fn !== "function") throw new TypeError("The listener must be a function");
		var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
		if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
		else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
		else emitter._events[evt] = [emitter._events[evt], listener];
		return emitter;
	}
	/**
	* Clear event by name.
	*
	* @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	* @param {(String|Symbol)} evt The Event name.
	* @private
	*/
	function clearEvent(emitter, evt) {
		if (--emitter._eventsCount === 0) emitter._events = new Events();
		else delete emitter._events[evt];
	}
	/**
	* Minimal `EventEmitter` interface that is molded against the Node.js
	* `EventEmitter` interface.
	*
	* @constructor
	* @public
	*/
	function EventEmitter() {
		this._events = new Events();
		this._eventsCount = 0;
	}
	/**
	* Return an array listing the events for which the emitter has registered
	* listeners.
	*
	* @returns {Array}
	* @public
	*/
	EventEmitter.prototype.eventNames = function eventNames() {
		var names = [], events, name;
		if (this._eventsCount === 0) return names;
		for (name in events = this._events) if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
		if (Object.getOwnPropertySymbols) return names.concat(Object.getOwnPropertySymbols(events));
		return names;
	};
	/**
	* Return the listeners registered for a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @returns {Array} The registered listeners.
	* @public
	*/
	EventEmitter.prototype.listeners = function listeners(event) {
		var evt = prefix ? prefix + event : event, handlers = this._events[evt];
		if (!handlers) return [];
		if (handlers.fn) return [handlers.fn];
		for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) ee[i] = handlers[i].fn;
		return ee;
	};
	/**
	* Return the number of listeners listening to a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @returns {Number} The number of listeners.
	* @public
	*/
	EventEmitter.prototype.listenerCount = function listenerCount(event) {
		var evt = prefix ? prefix + event : event, listeners = this._events[evt];
		if (!listeners) return 0;
		if (listeners.fn) return 1;
		return listeners.length;
	};
	/**
	* Calls each of the listeners registered for a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @returns {Boolean} `true` if the event had listeners, else `false`.
	* @public
	*/
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
		var evt = prefix ? prefix + event : event;
		if (!this._events[evt]) return false;
		var listeners = this._events[evt], len = arguments.length, args, i;
		if (listeners.fn) {
			if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
			switch (len) {
				case 1: return listeners.fn.call(listeners.context), true;
				case 2: return listeners.fn.call(listeners.context, a1), true;
				case 3: return listeners.fn.call(listeners.context, a1, a2), true;
				case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
				case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
				case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
			}
			for (i = 1, args = new Array(len - 1); i < len; i++) args[i - 1] = arguments[i];
			listeners.fn.apply(listeners.context, args);
		} else {
			var length = listeners.length, j;
			for (i = 0; i < length; i++) {
				if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
				switch (len) {
					case 1:
						listeners[i].fn.call(listeners[i].context);
						break;
					case 2:
						listeners[i].fn.call(listeners[i].context, a1);
						break;
					case 3:
						listeners[i].fn.call(listeners[i].context, a1, a2);
						break;
					case 4:
						listeners[i].fn.call(listeners[i].context, a1, a2, a3);
						break;
					default:
						if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) args[j - 1] = arguments[j];
						listeners[i].fn.apply(listeners[i].context, args);
				}
			}
		}
		return true;
	};
	/**
	* Add a listener for a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @param {Function} fn The listener function.
	* @param {*} [context=this] The context to invoke the listener with.
	* @returns {EventEmitter} `this`.
	* @public
	*/
	EventEmitter.prototype.on = function on(event, fn, context) {
		return addListener(this, event, fn, context, false);
	};
	/**
	* Add a one-time listener for a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @param {Function} fn The listener function.
	* @param {*} [context=this] The context to invoke the listener with.
	* @returns {EventEmitter} `this`.
	* @public
	*/
	EventEmitter.prototype.once = function once(event, fn, context) {
		return addListener(this, event, fn, context, true);
	};
	/**
	* Remove the listeners of a given event.
	*
	* @param {(String|Symbol)} event The event name.
	* @param {Function} fn Only remove the listeners that match this function.
	* @param {*} context Only remove the listeners that have this context.
	* @param {Boolean} once Only remove one-time listeners.
	* @returns {EventEmitter} `this`.
	* @public
	*/
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
		var evt = prefix ? prefix + event : event;
		if (!this._events[evt]) return this;
		if (!fn) {
			clearEvent(this, evt);
			return this;
		}
		var listeners = this._events[evt];
		if (listeners.fn) {
			if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) clearEvent(this, evt);
		} else {
			for (var i = 0, events = [], length = listeners.length; i < length; i++) if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) events.push(listeners[i]);
			if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
			else clearEvent(this, evt);
		}
		return this;
	};
	/**
	* Remove all listeners, or those of the specified event.
	*
	* @param {(String|Symbol)} [event] The event name.
	* @returns {EventEmitter} `this`.
	* @public
	*/
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
		var evt;
		if (event) {
			evt = prefix ? prefix + event : event;
			if (this._events[evt]) clearEvent(this, evt);
		} else {
			this._events = new Events();
			this._eventsCount = 0;
		}
		return this;
	};
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;
	EventEmitter.prefixed = prefix;
	EventEmitter.EventEmitter = EventEmitter;
	if ("undefined" !== typeof module) module.exports = EventEmitter;
})))(), 1);
//#endregion
//#region node_modules/rpc-websockets/dist/index.mjs
function WebSocket(address, options) {
	return new wrapper_default(address, options);
}
var DefaultDataPack = class {
	encode(value) {
		return JSON.stringify(value);
	}
	decode(value) {
		return JSON.parse(value);
	}
};
var CommonClient = class extends import_eventemitter3.default {
	address;
	rpc_id;
	queue;
	options;
	autoconnect;
	ready;
	reconnect;
	reconnect_timer_id;
	reconnect_interval;
	max_reconnects;
	rest_options;
	current_reconnects;
	generate_request_id;
	socket;
	webSocketFactory;
	dataPack;
	/**
	* Instantiate a Client class.
	* @constructor
	* @param {webSocketFactory} webSocketFactory - factory method for WebSocket
	* @param {String} address - url to a websocket server
	* @param {Object} options - ws options object with reconnect parameters
	* @param {Function} generate_request_id - custom generation request Id
	* @param {DataPack} dataPack - data pack contains encoder and decoder
	* @return {CommonClient}
	*/
	constructor(webSocketFactory, address = "ws://localhost:8080", { autoconnect = true, reconnect = true, reconnect_interval = 1e3, max_reconnects = 5, ...rest_options } = {}, generate_request_id, dataPack) {
		super();
		this.webSocketFactory = webSocketFactory;
		this.queue = {};
		this.rpc_id = 0;
		this.address = address;
		this.autoconnect = autoconnect;
		this.ready = false;
		this.reconnect = reconnect;
		this.reconnect_timer_id = void 0;
		this.reconnect_interval = reconnect_interval;
		this.max_reconnects = max_reconnects;
		this.rest_options = rest_options;
		this.current_reconnects = 0;
		this.generate_request_id = generate_request_id || (() => typeof this.rpc_id === "number" ? ++this.rpc_id : Number(this.rpc_id) + 1);
		if (!dataPack) this.dataPack = new DefaultDataPack();
		else this.dataPack = dataPack;
		if (this.autoconnect) this._connect(this.address, {
			autoconnect: this.autoconnect,
			reconnect: this.reconnect,
			reconnect_interval: this.reconnect_interval,
			max_reconnects: this.max_reconnects,
			...this.rest_options
		});
	}
	/**
	* Connects to a defined server if not connected already.
	* @method
	* @return {Undefined}
	*/
	connect() {
		if (this.socket) return;
		this._connect(this.address, {
			autoconnect: this.autoconnect,
			reconnect: this.reconnect,
			reconnect_interval: this.reconnect_interval,
			max_reconnects: this.max_reconnects,
			...this.rest_options
		});
	}
	/**
	* Calls a registered RPC method on server.
	* @method
	* @param {String} method - RPC method name
	* @param {Object|Array} params - optional method parameters
	* @param {Number} timeout - RPC reply timeout value
	* @param {Object} ws_opts - options passed to ws
	* @return {Promise}
	*/
	call(method, params, timeout, ws_opts) {
		if (!ws_opts && "object" === typeof timeout) {
			ws_opts = timeout;
			timeout = null;
		}
		return new Promise((resolve, reject) => {
			if (!this.ready) return reject(/* @__PURE__ */ new Error("socket not ready"));
			const rpc_id = this.generate_request_id(method, params);
			const message = {
				jsonrpc: "2.0",
				method,
				params: params || void 0,
				id: rpc_id
			};
			this.socket.send(this.dataPack.encode(message), ws_opts, (error) => {
				if (error) return reject(error);
				this.queue[rpc_id] = { promise: [resolve, reject] };
				if (timeout) this.queue[rpc_id].timeout = setTimeout(() => {
					delete this.queue[rpc_id];
					reject(/* @__PURE__ */ new Error("reply timeout"));
				}, timeout);
			});
		});
	}
	/**
	* Logins with the other side of the connection.
	* @method
	* @param {Object} params - Login credentials object
	* @return {Promise}
	*/
	async login(params) {
		const resp = await this.call("rpc.login", params);
		if (!resp) throw new Error("authentication failed");
		return resp;
	}
	/**
	* Fetches a list of client's methods registered on server.
	* @method
	* @return {Array}
	*/
	async listMethods() {
		return await this.call("__listMethods");
	}
	/**
	* Sends a JSON-RPC 2.0 notification to server.
	* @method
	* @param {String} method - RPC method name
	* @param {Object} params - optional method parameters
	* @return {Promise}
	*/
	notify(method, params) {
		return new Promise((resolve, reject) => {
			if (!this.ready) return reject(/* @__PURE__ */ new Error("socket not ready"));
			const message = {
				jsonrpc: "2.0",
				method,
				params
			};
			this.socket.send(this.dataPack.encode(message), (error) => {
				if (error) return reject(error);
				resolve();
			});
		});
	}
	/**
	* Subscribes for a defined event.
	* @method
	* @param {String|Array} event - event name
	* @return {Undefined}
	* @throws {Error}
	*/
	async subscribe(event) {
		if (typeof event === "string") event = [event];
		const result = await this.call("rpc.on", event);
		if (typeof event === "string" && result[event] !== "ok") throw new Error("Failed subscribing to an event '" + event + "' with: " + result[event]);
		return result;
	}
	/**
	* Unsubscribes from a defined event.
	* @method
	* @param {String|Array} event - event name
	* @return {Undefined}
	* @throws {Error}
	*/
	async unsubscribe(event) {
		if (typeof event === "string") event = [event];
		const result = await this.call("rpc.off", event);
		if (typeof event === "string" && result[event] !== "ok") throw new Error("Failed unsubscribing from an event with: " + result);
		return result;
	}
	/**
	* Closes a WebSocket connection gracefully.
	* @method
	* @param {Number} code - socket close code
	* @param {String} data - optional data to be sent before closing
	* @return {Undefined}
	*/
	close(code, data) {
		if (this.socket) this.socket.close(code || 1e3, data);
	}
	/**
	* Enable / disable automatic reconnection.
	* @method
	* @param {Boolean} reconnect - enable / disable reconnection
	* @return {Undefined}
	*/
	setAutoReconnect(reconnect) {
		this.reconnect = reconnect;
	}
	/**
	* Set the interval between reconnection attempts.
	* @method
	* @param {Number} interval - reconnection interval in milliseconds
	* @return {Undefined}
	*/
	setReconnectInterval(interval) {
		this.reconnect_interval = interval;
	}
	/**
	* Set the maximum number of reconnection attempts.
	* @method
	* @param {Number} max_reconnects - maximum reconnection attempts
	* @return {Undefined}
	*/
	setMaxReconnects(max_reconnects) {
		this.max_reconnects = max_reconnects;
	}
	/**
	* Get the current number of reconnection attempts made.
	* @method
	* @return {Number} current reconnection attempts
	*/
	getCurrentReconnects() {
		return this.current_reconnects;
	}
	/**
	* Get the maximum number of reconnection attempts.
	* @method
	* @return {Number} maximum reconnection attempts
	*/
	getMaxReconnects() {
		return this.max_reconnects;
	}
	/**
	* Check if the client is currently attempting to reconnect.
	* @method
	* @return {Boolean} true if reconnection is in progress
	*/
	isReconnecting() {
		return this.reconnect_timer_id !== void 0;
	}
	/**
	* Check if the client will attempt to reconnect on the next close event.
	* @method
	* @return {Boolean} true if reconnection will be attempted
	*/
	willReconnect() {
		return this.reconnect && (this.max_reconnects === 0 || this.current_reconnects < this.max_reconnects);
	}
	/**
	* Connection/Message handler.
	* @method
	* @private
	* @param {String} address - WebSocket API address
	* @param {Object} options - ws options object
	* @return {Undefined}
	*/
	_connect(address, options) {
		clearTimeout(this.reconnect_timer_id);
		this.socket = this.webSocketFactory(address, options);
		this.socket.addEventListener("open", () => {
			this.ready = true;
			this.emit("open");
			this.current_reconnects = 0;
		});
		this.socket.addEventListener("message", ({ data: message }) => {
			if (message instanceof ArrayBuffer) message = Buffer.from(message).toString();
			try {
				message = this.dataPack.decode(message);
			} catch (_error) {
				return;
			}
			if (message.notification && this.listeners(message.notification).length) {
				if (!Object.keys(message.params).length) return this.emit(message.notification);
				const args = [message.notification];
				if (message.params.constructor === Object) args.push(message.params);
				else for (let i = 0; i < message.params.length; i++) args.push(message.params[i]);
				return Promise.resolve().then(() => {
					this.emit.apply(this, args);
				});
			}
			if (!this.queue[message.id]) {
				if (message.method) return Promise.resolve().then(() => {
					this.emit(message.method, message?.params);
				});
				return;
			}
			if ("error" in message === "result" in message) this.queue[message.id].promise[1](/* @__PURE__ */ new Error("Server response malformed. Response must include either \"result\" or \"error\", but not both."));
			if (this.queue[message.id].timeout) clearTimeout(this.queue[message.id].timeout);
			if (message.error) this.queue[message.id].promise[1](message.error);
			else this.queue[message.id].promise[0](message.result);
			delete this.queue[message.id];
		});
		this.socket.addEventListener("error", (error) => this.emit("error", error));
		this.socket.addEventListener("close", ({ code, reason }) => {
			if (this.ready) setTimeout(() => this.emit("close", code, reason), 0);
			this.ready = false;
			this.socket = void 0;
			if (code === 1e3) return;
			this.current_reconnects++;
			if (this.reconnect && (this.max_reconnects > this.current_reconnects || this.max_reconnects === 0)) this.reconnect_timer_id = setTimeout(() => this._connect(address, options), this.reconnect_interval);
			else if (this.reconnect && this.max_reconnects > 0 && this.current_reconnects >= this.max_reconnects) setTimeout(() => this.emit("max_reconnects_reached", code, reason), 1);
		});
	}
};
ed25519.utils.randomPrivateKey;
var generateKeypair = () => {
	const privateScalar = ed25519.utils.randomPrivateKey();
	const publicKey = getPublicKey(privateScalar);
	const secretKey = /* @__PURE__ */ new Uint8Array(64);
	secretKey.set(privateScalar);
	secretKey.set(publicKey, 32);
	return {
		publicKey,
		secretKey
	};
};
var getPublicKey = ed25519.getPublicKey;
function isOnCurve(publicKey) {
	try {
		ed25519.ExtendedPoint.fromHex(publicKey);
		return true;
	} catch {
		return false;
	}
}
var sign = (message, secretKey) => ed25519.sign(message, secretKey.slice(0, 32));
var verify = ed25519.verify;
var toBuffer = (arr) => {
	if (Buffer$1.isBuffer(arr)) return arr;
	else if (arr instanceof Uint8Array) return Buffer$1.from(arr.buffer, arr.byteOffset, arr.byteLength);
	else return Buffer$1.from(arr);
};
var Struct = class {
	constructor(properties) {
		Object.assign(this, properties);
	}
	encode() {
		return Buffer$1.from((0, import_lib.serialize)(SOLANA_SCHEMA, this));
	}
	static decode(data) {
		return (0, import_lib.deserialize)(SOLANA_SCHEMA, this, data);
	}
	static decodeUnchecked(data) {
		return (0, import_lib.deserializeUnchecked)(SOLANA_SCHEMA, this, data);
	}
};
var SOLANA_SCHEMA = /* @__PURE__ */ new Map();
var _PublicKey;
/**
* Value to be converted into public key
*/
/**
* JSON object representation of PublicKey class
*/
function isPublicKeyData(value) {
	return value._bn !== void 0;
}
var uniquePublicKeyCounter = 1;
/**
* A public key
*/
var PublicKey = class PublicKey extends Struct {
	/**
	* Create a new PublicKey object
	* @param value ed25519 public key as buffer or base-58 encoded string
	*/
	constructor(value) {
		super({});
		/** @internal */
		this._bn = void 0;
		if (isPublicKeyData(value)) this._bn = value._bn;
		else {
			if (typeof value === "string") {
				const decoded = import_bs58.default.decode(value);
				if (decoded.length != 32) throw new Error(`Invalid public key input`);
				this._bn = new import_bn.default(decoded);
			} else this._bn = new import_bn.default(value);
			if (this._bn.byteLength() > 32) throw new Error(`Invalid public key input`);
		}
	}
	/**
	* Returns a unique PublicKey for tests and benchmarks using a counter
	*/
	static unique() {
		const key = new PublicKey(uniquePublicKeyCounter);
		uniquePublicKeyCounter += 1;
		return new PublicKey(key.toBuffer());
	}
	/**
	* Default public key value. The base58-encoded string representation is all ones (as seen below)
	* The underlying BN number is 32 bytes that are all zeros
	*/
	/**
	* Checks if two publicKeys are equal
	*/
	equals(publicKey) {
		return this._bn.eq(publicKey._bn);
	}
	/**
	* Return the base-58 representation of the public key
	*/
	toBase58() {
		return import_bs58.default.encode(this.toBytes());
	}
	toJSON() {
		return this.toBase58();
	}
	/**
	* Return the byte array representation of the public key in big endian
	*/
	toBytes() {
		const buf = this.toBuffer();
		return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
	}
	/**
	* Return the Buffer representation of the public key in big endian
	*/
	toBuffer() {
		const b = this._bn.toArrayLike(Buffer$1);
		if (b.length === 32) return b;
		const zeroPad = Buffer$1.alloc(32);
		b.copy(zeroPad, 32 - b.length);
		return zeroPad;
	}
	get [Symbol.toStringTag]() {
		return `PublicKey(${this.toString()})`;
	}
	/**
	* Return the base-58 representation of the public key
	*/
	toString() {
		return this.toBase58();
	}
	/**
	* Derive a public key from another key, a seed, and a program ID.
	* The program ID will also serve as the owner of the public key, giving
	* it permission to write data to the account.
	*/
	static async createWithSeed(fromPublicKey, seed, programId) {
		const buffer = Buffer$1.concat([
			fromPublicKey.toBuffer(),
			Buffer$1.from(seed),
			programId.toBuffer()
		]);
		const publicKeyBytes = sha256(buffer);
		return new PublicKey(publicKeyBytes);
	}
	/**
	* Derive a program address from seeds and a program ID.
	*/
	static createProgramAddressSync(seeds, programId) {
		let buffer = Buffer$1.alloc(0);
		seeds.forEach(function(seed) {
			if (seed.length > 32) throw new TypeError(`Max seed length exceeded`);
			buffer = Buffer$1.concat([buffer, toBuffer(seed)]);
		});
		buffer = Buffer$1.concat([
			buffer,
			programId.toBuffer(),
			Buffer$1.from("ProgramDerivedAddress")
		]);
		const publicKeyBytes = sha256(buffer);
		if (isOnCurve(publicKeyBytes)) throw new Error(`Invalid seeds, address must fall off the curve`);
		return new PublicKey(publicKeyBytes);
	}
	/**
	* Async version of createProgramAddressSync
	* For backwards compatibility
	*
	* @deprecated Use {@link createProgramAddressSync} instead
	*/
	static async createProgramAddress(seeds, programId) {
		return this.createProgramAddressSync(seeds, programId);
	}
	/**
	* Find a valid program address
	*
	* Valid program addresses must fall off the ed25519 curve.  This function
	* iterates a nonce until it finds one that when combined with the seeds
	* results in a valid program address.
	*/
	static findProgramAddressSync(seeds, programId) {
		let nonce = 255;
		let address;
		while (nonce != 0) {
			try {
				const seedsWithNonce = seeds.concat(Buffer$1.from([nonce]));
				address = this.createProgramAddressSync(seedsWithNonce, programId);
			} catch (err) {
				if (err instanceof TypeError) throw err;
				nonce--;
				continue;
			}
			return [address, nonce];
		}
		throw new Error(`Unable to find a viable program address nonce`);
	}
	/**
	* Async version of findProgramAddressSync
	* For backwards compatibility
	*
	* @deprecated Use {@link findProgramAddressSync} instead
	*/
	static async findProgramAddress(seeds, programId) {
		return this.findProgramAddressSync(seeds, programId);
	}
	/**
	* Check that a pubkey is on the ed25519 curve.
	*/
	static isOnCurve(pubkeyData) {
		return isOnCurve(new PublicKey(pubkeyData).toBytes());
	}
};
_PublicKey = PublicKey;
PublicKey.default = new _PublicKey("11111111111111111111111111111111");
SOLANA_SCHEMA.set(PublicKey, {
	kind: "struct",
	fields: [["_bn", "u256"]]
});
new PublicKey("BPFLoader1111111111111111111111111111111111");
/**
* Maximum over-the-wire size of a Transaction
*
* 1280 is IPv6 minimum MTU
* 40 bytes is the size of the IPv6 header
* 8 bytes is the size of the fragment header
*/
var PACKET_DATA_SIZE = 1232;
var TransactionExpiredBlockheightExceededError = class extends Error {
	constructor(signature) {
		super(`Signature ${signature} has expired: block height exceeded.`);
		this.signature = void 0;
		this.signature = signature;
	}
};
Object.defineProperty(TransactionExpiredBlockheightExceededError.prototype, "name", { value: "TransactionExpiredBlockheightExceededError" });
var TransactionExpiredTimeoutError = class extends Error {
	constructor(signature, timeoutSeconds) {
		super(`Transaction was not confirmed in ${timeoutSeconds.toFixed(2)} seconds. It is unknown if it succeeded or failed. Check signature ${signature} using the Solana Explorer or CLI tools.`);
		this.signature = void 0;
		this.signature = signature;
	}
};
Object.defineProperty(TransactionExpiredTimeoutError.prototype, "name", { value: "TransactionExpiredTimeoutError" });
var TransactionExpiredNonceInvalidError = class extends Error {
	constructor(signature) {
		super(`Signature ${signature} has expired: the nonce is no longer valid.`);
		this.signature = void 0;
		this.signature = signature;
	}
};
Object.defineProperty(TransactionExpiredNonceInvalidError.prototype, "name", { value: "TransactionExpiredNonceInvalidError" });
var MessageAccountKeys = class {
	constructor(staticAccountKeys, accountKeysFromLookups) {
		this.staticAccountKeys = void 0;
		this.accountKeysFromLookups = void 0;
		this.staticAccountKeys = staticAccountKeys;
		this.accountKeysFromLookups = accountKeysFromLookups;
	}
	keySegments() {
		const keySegments = [this.staticAccountKeys];
		if (this.accountKeysFromLookups) {
			keySegments.push(this.accountKeysFromLookups.writable);
			keySegments.push(this.accountKeysFromLookups.readonly);
		}
		return keySegments;
	}
	get(index) {
		for (const keySegment of this.keySegments()) if (index < keySegment.length) return keySegment[index];
		else index -= keySegment.length;
	}
	get length() {
		return this.keySegments().flat().length;
	}
	compileInstructions(instructions) {
		if (this.length > 256) throw new Error("Account index overflow encountered during compilation");
		const keyIndexMap = /* @__PURE__ */ new Map();
		this.keySegments().flat().forEach((key, index) => {
			keyIndexMap.set(key.toBase58(), index);
		});
		const findKeyIndex = (key) => {
			const keyIndex = keyIndexMap.get(key.toBase58());
			if (keyIndex === void 0) throw new Error("Encountered an unknown instruction account key during compilation");
			return keyIndex;
		};
		return instructions.map((instruction) => {
			return {
				programIdIndex: findKeyIndex(instruction.programId),
				accountKeyIndexes: instruction.keys.map((meta) => findKeyIndex(meta.pubkey)),
				data: instruction.data
			};
		});
	}
};
/**
* Layout for a public key
*/
var publicKey = (property = "publicKey") => {
	return import_Layout.blob(32, property);
};
/**
* Layout for a Rust String type
*/
var rustString = (property = "string") => {
	const rsl = import_Layout.struct([
		import_Layout.u32("length"),
		import_Layout.u32("lengthPadding"),
		import_Layout.blob(import_Layout.offset(import_Layout.u32(), -8), "chars")
	], property);
	const _decode = rsl.decode.bind(rsl);
	const _encode = rsl.encode.bind(rsl);
	const rslShim = rsl;
	rslShim.decode = (b, offset) => {
		return _decode(b, offset)["chars"].toString();
	};
	rslShim.encode = (str, b, offset) => {
		const data = { chars: Buffer$1.from(str, "utf8") };
		return _encode(data, b, offset);
	};
	rslShim.alloc = (str) => {
		return import_Layout.u32().span + import_Layout.u32().span + Buffer$1.from(str, "utf8").length;
	};
	return rslShim;
};
/**
* Layout for an Authorized object
*/
var authorized = (property = "authorized") => {
	return import_Layout.struct([publicKey("staker"), publicKey("withdrawer")], property);
};
/**
* Layout for a Lockup object
*/
var lockup = (property = "lockup") => {
	return import_Layout.struct([
		import_Layout.ns64("unixTimestamp"),
		import_Layout.ns64("epoch"),
		publicKey("custodian")
	], property);
};
/**
*  Layout for a VoteInit object
*/
var voteInit = (property = "voteInit") => {
	return import_Layout.struct([
		publicKey("nodePubkey"),
		publicKey("authorizedVoter"),
		publicKey("authorizedWithdrawer"),
		import_Layout.u8("commission")
	], property);
};
/**
*  Layout for a VoteAuthorizeWithSeedArgs object
*/
var voteAuthorizeWithSeedArgs = (property = "voteAuthorizeWithSeedArgs") => {
	return import_Layout.struct([
		import_Layout.u32("voteAuthorizationType"),
		publicKey("currentAuthorityDerivedKeyOwnerPubkey"),
		rustString("currentAuthorityDerivedKeySeed"),
		publicKey("newAuthorized")
	], property);
};
function getAlloc(type, fields) {
	const getItemAlloc = (item) => {
		if (item.span >= 0) return item.span;
		else if (typeof item.alloc === "function") return item.alloc(fields[item.property]);
		else if ("count" in item && "elementLayout" in item) {
			const field = fields[item.property];
			if (Array.isArray(field)) return field.length * getItemAlloc(item.elementLayout);
		} else if ("fields" in item) return getAlloc({ layout: item }, fields[item.property]);
		return 0;
	};
	let alloc = 0;
	type.layout.fields.forEach((item) => {
		alloc += getItemAlloc(item);
	});
	return alloc;
}
function decodeLength(bytes) {
	let len = 0;
	let size = 0;
	for (;;) {
		let elem = bytes.shift();
		len |= (elem & 127) << size * 7;
		size += 1;
		if ((elem & 128) === 0) break;
	}
	return len;
}
function encodeLength(bytes, len) {
	let rem_len = len;
	for (;;) {
		let elem = rem_len & 127;
		rem_len >>= 7;
		if (rem_len == 0) {
			bytes.push(elem);
			break;
		} else {
			elem |= 128;
			bytes.push(elem);
		}
	}
}
function assert(condition, message) {
	if (!condition) throw new Error(message || "Assertion failed");
}
var CompiledKeys = class CompiledKeys {
	constructor(payer, keyMetaMap) {
		this.payer = void 0;
		this.keyMetaMap = void 0;
		this.payer = payer;
		this.keyMetaMap = keyMetaMap;
	}
	static compile(instructions, payer) {
		const keyMetaMap = /* @__PURE__ */ new Map();
		const getOrInsertDefault = (pubkey) => {
			const address = pubkey.toBase58();
			let keyMeta = keyMetaMap.get(address);
			if (keyMeta === void 0) {
				keyMeta = {
					isSigner: false,
					isWritable: false,
					isInvoked: false
				};
				keyMetaMap.set(address, keyMeta);
			}
			return keyMeta;
		};
		const payerKeyMeta = getOrInsertDefault(payer);
		payerKeyMeta.isSigner = true;
		payerKeyMeta.isWritable = true;
		for (const ix of instructions) {
			getOrInsertDefault(ix.programId).isInvoked = true;
			for (const accountMeta of ix.keys) {
				const keyMeta = getOrInsertDefault(accountMeta.pubkey);
				keyMeta.isSigner ||= accountMeta.isSigner;
				keyMeta.isWritable ||= accountMeta.isWritable;
			}
		}
		return new CompiledKeys(payer, keyMetaMap);
	}
	getMessageComponents() {
		const mapEntries = [...this.keyMetaMap.entries()];
		assert(mapEntries.length <= 256, "Max static account keys length exceeded");
		const writableSigners = mapEntries.filter(([, meta]) => meta.isSigner && meta.isWritable);
		const readonlySigners = mapEntries.filter(([, meta]) => meta.isSigner && !meta.isWritable);
		const writableNonSigners = mapEntries.filter(([, meta]) => !meta.isSigner && meta.isWritable);
		const readonlyNonSigners = mapEntries.filter(([, meta]) => !meta.isSigner && !meta.isWritable);
		const header = {
			numRequiredSignatures: writableSigners.length + readonlySigners.length,
			numReadonlySignedAccounts: readonlySigners.length,
			numReadonlyUnsignedAccounts: readonlyNonSigners.length
		};
		{
			assert(writableSigners.length > 0, "Expected at least one writable signer key");
			const [payerAddress] = writableSigners[0];
			assert(payerAddress === this.payer.toBase58(), "Expected first writable signer key to be the fee payer");
		}
		return [header, [
			...writableSigners.map(([address]) => new PublicKey(address)),
			...readonlySigners.map(([address]) => new PublicKey(address)),
			...writableNonSigners.map(([address]) => new PublicKey(address)),
			...readonlyNonSigners.map(([address]) => new PublicKey(address))
		]];
	}
	extractTableLookup(lookupTable) {
		const [writableIndexes, drainedWritableKeys] = this.drainKeysFoundInLookupTable(lookupTable.state.addresses, (keyMeta) => !keyMeta.isSigner && !keyMeta.isInvoked && keyMeta.isWritable);
		const [readonlyIndexes, drainedReadonlyKeys] = this.drainKeysFoundInLookupTable(lookupTable.state.addresses, (keyMeta) => !keyMeta.isSigner && !keyMeta.isInvoked && !keyMeta.isWritable);
		if (writableIndexes.length === 0 && readonlyIndexes.length === 0) return;
		return [{
			accountKey: lookupTable.key,
			writableIndexes,
			readonlyIndexes
		}, {
			writable: drainedWritableKeys,
			readonly: drainedReadonlyKeys
		}];
	}
	/** @internal */
	drainKeysFoundInLookupTable(lookupTableEntries, keyMetaFilter) {
		const lookupTableIndexes = new Array();
		const drainedKeys = new Array();
		for (const [address, keyMeta] of this.keyMetaMap.entries()) if (keyMetaFilter(keyMeta)) {
			const key = new PublicKey(address);
			const lookupTableIndex = lookupTableEntries.findIndex((entry) => entry.equals(key));
			if (lookupTableIndex >= 0) {
				assert(lookupTableIndex < 256, "Max lookup table index exceeded");
				lookupTableIndexes.push(lookupTableIndex);
				drainedKeys.push(key);
				this.keyMetaMap.delete(address);
			}
		}
		return [lookupTableIndexes, drainedKeys];
	}
};
var END_OF_BUFFER_ERROR_MESSAGE = "Reached end of buffer unexpectedly";
/**
* Delegates to `Array#shift`, but throws if the array is zero-length.
*/
function guardedShift(byteArray) {
	if (byteArray.length === 0) throw new Error(END_OF_BUFFER_ERROR_MESSAGE);
	return byteArray.shift();
}
/**
* Delegates to `Array#splice`, but throws if the section being spliced out extends past the end of
* the array.
*/
function guardedSplice(byteArray, ...args) {
	const [start] = args;
	if (args.length === 2 ? start + (args[1] ?? 0) > byteArray.length : start >= byteArray.length) throw new Error(END_OF_BUFFER_ERROR_MESSAGE);
	return byteArray.splice(...args);
}
/**
* An instruction to execute by a program
*
* @property {number} programIdIndex
* @property {number[]} accounts
* @property {string} data
*/
/**
* Message constructor arguments
*/
/**
* List of instructions to be processed atomically
*/
var Message = class Message {
	constructor(args) {
		this.header = void 0;
		this.accountKeys = void 0;
		this.recentBlockhash = void 0;
		this.instructions = void 0;
		this.indexToProgramIds = /* @__PURE__ */ new Map();
		this.header = args.header;
		this.accountKeys = args.accountKeys.map((account) => new PublicKey(account));
		this.recentBlockhash = args.recentBlockhash;
		this.instructions = args.instructions;
		this.instructions.forEach((ix) => this.indexToProgramIds.set(ix.programIdIndex, this.accountKeys[ix.programIdIndex]));
	}
	get version() {
		return "legacy";
	}
	get staticAccountKeys() {
		return this.accountKeys;
	}
	get compiledInstructions() {
		return this.instructions.map((ix) => ({
			programIdIndex: ix.programIdIndex,
			accountKeyIndexes: ix.accounts,
			data: import_bs58.default.decode(ix.data)
		}));
	}
	get addressTableLookups() {
		return [];
	}
	getAccountKeys() {
		return new MessageAccountKeys(this.staticAccountKeys);
	}
	static compile(args) {
		const [header, staticAccountKeys] = CompiledKeys.compile(args.instructions, args.payerKey).getMessageComponents();
		const instructions = new MessageAccountKeys(staticAccountKeys).compileInstructions(args.instructions).map((ix) => ({
			programIdIndex: ix.programIdIndex,
			accounts: ix.accountKeyIndexes,
			data: import_bs58.default.encode(ix.data)
		}));
		return new Message({
			header,
			accountKeys: staticAccountKeys,
			recentBlockhash: args.recentBlockhash,
			instructions
		});
	}
	isAccountSigner(index) {
		return index < this.header.numRequiredSignatures;
	}
	isAccountWritable(index) {
		const numSignedAccounts = this.header.numRequiredSignatures;
		if (index >= this.header.numRequiredSignatures) return index - numSignedAccounts < this.accountKeys.length - numSignedAccounts - this.header.numReadonlyUnsignedAccounts;
		else return index < numSignedAccounts - this.header.numReadonlySignedAccounts;
	}
	isProgramId(index) {
		return this.indexToProgramIds.has(index);
	}
	programIds() {
		return [...this.indexToProgramIds.values()];
	}
	nonProgramIds() {
		return this.accountKeys.filter((_, index) => !this.isProgramId(index));
	}
	serialize() {
		const numKeys = this.accountKeys.length;
		let keyCount = [];
		encodeLength(keyCount, numKeys);
		const instructions = this.instructions.map((instruction) => {
			const { accounts, programIdIndex } = instruction;
			const data = Array.from(import_bs58.default.decode(instruction.data));
			let keyIndicesCount = [];
			encodeLength(keyIndicesCount, accounts.length);
			let dataCount = [];
			encodeLength(dataCount, data.length);
			return {
				programIdIndex,
				keyIndicesCount: Buffer$1.from(keyIndicesCount),
				keyIndices: accounts,
				dataLength: Buffer$1.from(dataCount),
				data
			};
		});
		let instructionCount = [];
		encodeLength(instructionCount, instructions.length);
		let instructionBuffer = Buffer$1.alloc(PACKET_DATA_SIZE);
		Buffer$1.from(instructionCount).copy(instructionBuffer);
		let instructionBufferLength = instructionCount.length;
		instructions.forEach((instruction) => {
			const length = import_Layout.struct([
				import_Layout.u8("programIdIndex"),
				import_Layout.blob(instruction.keyIndicesCount.length, "keyIndicesCount"),
				import_Layout.seq(import_Layout.u8("keyIndex"), instruction.keyIndices.length, "keyIndices"),
				import_Layout.blob(instruction.dataLength.length, "dataLength"),
				import_Layout.seq(import_Layout.u8("userdatum"), instruction.data.length, "data")
			]).encode(instruction, instructionBuffer, instructionBufferLength);
			instructionBufferLength += length;
		});
		instructionBuffer = instructionBuffer.slice(0, instructionBufferLength);
		const signDataLayout = import_Layout.struct([
			import_Layout.blob(1, "numRequiredSignatures"),
			import_Layout.blob(1, "numReadonlySignedAccounts"),
			import_Layout.blob(1, "numReadonlyUnsignedAccounts"),
			import_Layout.blob(keyCount.length, "keyCount"),
			import_Layout.seq(publicKey("key"), numKeys, "keys"),
			publicKey("recentBlockhash")
		]);
		const transaction = {
			numRequiredSignatures: Buffer$1.from([this.header.numRequiredSignatures]),
			numReadonlySignedAccounts: Buffer$1.from([this.header.numReadonlySignedAccounts]),
			numReadonlyUnsignedAccounts: Buffer$1.from([this.header.numReadonlyUnsignedAccounts]),
			keyCount: Buffer$1.from(keyCount),
			keys: this.accountKeys.map((key) => toBuffer(key.toBytes())),
			recentBlockhash: import_bs58.default.decode(this.recentBlockhash)
		};
		let signData = Buffer$1.alloc(2048);
		const length = signDataLayout.encode(transaction, signData);
		instructionBuffer.copy(signData, length);
		return signData.slice(0, length + instructionBuffer.length);
	}
	/**
	* Decode a compiled message into a Message object.
	*/
	static from(buffer) {
		let byteArray = [...buffer];
		const numRequiredSignatures = guardedShift(byteArray);
		if (numRequiredSignatures !== (numRequiredSignatures & 127)) throw new Error("Versioned messages must be deserialized with VersionedMessage.deserialize()");
		const numReadonlySignedAccounts = guardedShift(byteArray);
		const numReadonlyUnsignedAccounts = guardedShift(byteArray);
		const accountCount = decodeLength(byteArray);
		let accountKeys = [];
		for (let i = 0; i < accountCount; i++) {
			const account = guardedSplice(byteArray, 0, 32);
			accountKeys.push(new PublicKey(Buffer$1.from(account)));
		}
		const recentBlockhash = guardedSplice(byteArray, 0, 32);
		const instructionCount = decodeLength(byteArray);
		let instructions = [];
		for (let i = 0; i < instructionCount; i++) {
			const programIdIndex = guardedShift(byteArray);
			const accounts = guardedSplice(byteArray, 0, decodeLength(byteArray));
			const dataSlice = guardedSplice(byteArray, 0, decodeLength(byteArray));
			const data = import_bs58.default.encode(Buffer$1.from(dataSlice));
			instructions.push({
				programIdIndex,
				accounts,
				data
			});
		}
		const messageArgs = {
			header: {
				numRequiredSignatures,
				numReadonlySignedAccounts,
				numReadonlyUnsignedAccounts
			},
			recentBlockhash: import_bs58.default.encode(Buffer$1.from(recentBlockhash)),
			accountKeys,
			instructions
		};
		return new Message(messageArgs);
	}
};
/**
* Message constructor arguments
*/
var MessageV0 = class MessageV0 {
	constructor(args) {
		this.header = void 0;
		this.staticAccountKeys = void 0;
		this.recentBlockhash = void 0;
		this.compiledInstructions = void 0;
		this.addressTableLookups = void 0;
		this.header = args.header;
		this.staticAccountKeys = args.staticAccountKeys;
		this.recentBlockhash = args.recentBlockhash;
		this.compiledInstructions = args.compiledInstructions;
		this.addressTableLookups = args.addressTableLookups;
	}
	get version() {
		return 0;
	}
	get numAccountKeysFromLookups() {
		let count = 0;
		for (const lookup of this.addressTableLookups) count += lookup.readonlyIndexes.length + lookup.writableIndexes.length;
		return count;
	}
	getAccountKeys(args) {
		let accountKeysFromLookups;
		if (args && "accountKeysFromLookups" in args && args.accountKeysFromLookups) {
			if (this.numAccountKeysFromLookups != args.accountKeysFromLookups.writable.length + args.accountKeysFromLookups.readonly.length) throw new Error("Failed to get account keys because of a mismatch in the number of account keys from lookups");
			accountKeysFromLookups = args.accountKeysFromLookups;
		} else if (args && "addressLookupTableAccounts" in args && args.addressLookupTableAccounts) accountKeysFromLookups = this.resolveAddressTableLookups(args.addressLookupTableAccounts);
		else if (this.addressTableLookups.length > 0) throw new Error("Failed to get account keys because address table lookups were not resolved");
		return new MessageAccountKeys(this.staticAccountKeys, accountKeysFromLookups);
	}
	isAccountSigner(index) {
		return index < this.header.numRequiredSignatures;
	}
	isAccountWritable(index) {
		const numSignedAccounts = this.header.numRequiredSignatures;
		const numStaticAccountKeys = this.staticAccountKeys.length;
		if (index >= numStaticAccountKeys) return index - numStaticAccountKeys < this.addressTableLookups.reduce((count, lookup) => count + lookup.writableIndexes.length, 0);
		else if (index >= this.header.numRequiredSignatures) return index - numSignedAccounts < numStaticAccountKeys - numSignedAccounts - this.header.numReadonlyUnsignedAccounts;
		else return index < numSignedAccounts - this.header.numReadonlySignedAccounts;
	}
	resolveAddressTableLookups(addressLookupTableAccounts) {
		const accountKeysFromLookups = {
			writable: [],
			readonly: []
		};
		for (const tableLookup of this.addressTableLookups) {
			const tableAccount = addressLookupTableAccounts.find((account) => account.key.equals(tableLookup.accountKey));
			if (!tableAccount) throw new Error(`Failed to find address lookup table account for table key ${tableLookup.accountKey.toBase58()}`);
			for (const index of tableLookup.writableIndexes) if (index < tableAccount.state.addresses.length) accountKeysFromLookups.writable.push(tableAccount.state.addresses[index]);
			else throw new Error(`Failed to find address for index ${index} in address lookup table ${tableLookup.accountKey.toBase58()}`);
			for (const index of tableLookup.readonlyIndexes) if (index < tableAccount.state.addresses.length) accountKeysFromLookups.readonly.push(tableAccount.state.addresses[index]);
			else throw new Error(`Failed to find address for index ${index} in address lookup table ${tableLookup.accountKey.toBase58()}`);
		}
		return accountKeysFromLookups;
	}
	static compile(args) {
		const compiledKeys = CompiledKeys.compile(args.instructions, args.payerKey);
		const addressTableLookups = new Array();
		const accountKeysFromLookups = {
			writable: new Array(),
			readonly: new Array()
		};
		const lookupTableAccounts = args.addressLookupTableAccounts || [];
		for (const lookupTable of lookupTableAccounts) {
			const extractResult = compiledKeys.extractTableLookup(lookupTable);
			if (extractResult !== void 0) {
				const [addressTableLookup, { writable, readonly }] = extractResult;
				addressTableLookups.push(addressTableLookup);
				accountKeysFromLookups.writable.push(...writable);
				accountKeysFromLookups.readonly.push(...readonly);
			}
		}
		const [header, staticAccountKeys] = compiledKeys.getMessageComponents();
		const compiledInstructions = new MessageAccountKeys(staticAccountKeys, accountKeysFromLookups).compileInstructions(args.instructions);
		return new MessageV0({
			header,
			staticAccountKeys,
			recentBlockhash: args.recentBlockhash,
			compiledInstructions,
			addressTableLookups
		});
	}
	serialize() {
		const encodedStaticAccountKeysLength = Array();
		encodeLength(encodedStaticAccountKeysLength, this.staticAccountKeys.length);
		const serializedInstructions = this.serializeInstructions();
		const encodedInstructionsLength = Array();
		encodeLength(encodedInstructionsLength, this.compiledInstructions.length);
		const serializedAddressTableLookups = this.serializeAddressTableLookups();
		const encodedAddressTableLookupsLength = Array();
		encodeLength(encodedAddressTableLookupsLength, this.addressTableLookups.length);
		const messageLayout = import_Layout.struct([
			import_Layout.u8("prefix"),
			import_Layout.struct([
				import_Layout.u8("numRequiredSignatures"),
				import_Layout.u8("numReadonlySignedAccounts"),
				import_Layout.u8("numReadonlyUnsignedAccounts")
			], "header"),
			import_Layout.blob(encodedStaticAccountKeysLength.length, "staticAccountKeysLength"),
			import_Layout.seq(publicKey(), this.staticAccountKeys.length, "staticAccountKeys"),
			publicKey("recentBlockhash"),
			import_Layout.blob(encodedInstructionsLength.length, "instructionsLength"),
			import_Layout.blob(serializedInstructions.length, "serializedInstructions"),
			import_Layout.blob(encodedAddressTableLookupsLength.length, "addressTableLookupsLength"),
			import_Layout.blob(serializedAddressTableLookups.length, "serializedAddressTableLookups")
		]);
		const serializedMessage = new Uint8Array(PACKET_DATA_SIZE);
		const serializedMessageLength = messageLayout.encode({
			prefix: 128,
			header: this.header,
			staticAccountKeysLength: new Uint8Array(encodedStaticAccountKeysLength),
			staticAccountKeys: this.staticAccountKeys.map((key) => key.toBytes()),
			recentBlockhash: import_bs58.default.decode(this.recentBlockhash),
			instructionsLength: new Uint8Array(encodedInstructionsLength),
			serializedInstructions,
			addressTableLookupsLength: new Uint8Array(encodedAddressTableLookupsLength),
			serializedAddressTableLookups
		}, serializedMessage);
		return serializedMessage.slice(0, serializedMessageLength);
	}
	serializeInstructions() {
		let serializedLength = 0;
		const serializedInstructions = new Uint8Array(PACKET_DATA_SIZE);
		for (const instruction of this.compiledInstructions) {
			const encodedAccountKeyIndexesLength = Array();
			encodeLength(encodedAccountKeyIndexesLength, instruction.accountKeyIndexes.length);
			const encodedDataLength = Array();
			encodeLength(encodedDataLength, instruction.data.length);
			const instructionLayout = import_Layout.struct([
				import_Layout.u8("programIdIndex"),
				import_Layout.blob(encodedAccountKeyIndexesLength.length, "encodedAccountKeyIndexesLength"),
				import_Layout.seq(import_Layout.u8(), instruction.accountKeyIndexes.length, "accountKeyIndexes"),
				import_Layout.blob(encodedDataLength.length, "encodedDataLength"),
				import_Layout.blob(instruction.data.length, "data")
			]);
			serializedLength += instructionLayout.encode({
				programIdIndex: instruction.programIdIndex,
				encodedAccountKeyIndexesLength: new Uint8Array(encodedAccountKeyIndexesLength),
				accountKeyIndexes: instruction.accountKeyIndexes,
				encodedDataLength: new Uint8Array(encodedDataLength),
				data: instruction.data
			}, serializedInstructions, serializedLength);
		}
		return serializedInstructions.slice(0, serializedLength);
	}
	serializeAddressTableLookups() {
		let serializedLength = 0;
		const serializedAddressTableLookups = new Uint8Array(PACKET_DATA_SIZE);
		for (const lookup of this.addressTableLookups) {
			const encodedWritableIndexesLength = Array();
			encodeLength(encodedWritableIndexesLength, lookup.writableIndexes.length);
			const encodedReadonlyIndexesLength = Array();
			encodeLength(encodedReadonlyIndexesLength, lookup.readonlyIndexes.length);
			const addressTableLookupLayout = import_Layout.struct([
				publicKey("accountKey"),
				import_Layout.blob(encodedWritableIndexesLength.length, "encodedWritableIndexesLength"),
				import_Layout.seq(import_Layout.u8(), lookup.writableIndexes.length, "writableIndexes"),
				import_Layout.blob(encodedReadonlyIndexesLength.length, "encodedReadonlyIndexesLength"),
				import_Layout.seq(import_Layout.u8(), lookup.readonlyIndexes.length, "readonlyIndexes")
			]);
			serializedLength += addressTableLookupLayout.encode({
				accountKey: lookup.accountKey.toBytes(),
				encodedWritableIndexesLength: new Uint8Array(encodedWritableIndexesLength),
				writableIndexes: lookup.writableIndexes,
				encodedReadonlyIndexesLength: new Uint8Array(encodedReadonlyIndexesLength),
				readonlyIndexes: lookup.readonlyIndexes
			}, serializedAddressTableLookups, serializedLength);
		}
		return serializedAddressTableLookups.slice(0, serializedLength);
	}
	static deserialize(serializedMessage) {
		let byteArray = [...serializedMessage];
		const prefix = guardedShift(byteArray);
		const maskedPrefix = prefix & 127;
		assert(prefix !== maskedPrefix, `Expected versioned message but received legacy message`);
		const version = maskedPrefix;
		assert(version === 0, `Expected versioned message with version 0 but found version ${version}`);
		const header = {
			numRequiredSignatures: guardedShift(byteArray),
			numReadonlySignedAccounts: guardedShift(byteArray),
			numReadonlyUnsignedAccounts: guardedShift(byteArray)
		};
		const staticAccountKeys = [];
		const staticAccountKeysLength = decodeLength(byteArray);
		for (let i = 0; i < staticAccountKeysLength; i++) staticAccountKeys.push(new PublicKey(guardedSplice(byteArray, 0, 32)));
		const recentBlockhash = import_bs58.default.encode(guardedSplice(byteArray, 0, 32));
		const instructionCount = decodeLength(byteArray);
		const compiledInstructions = [];
		for (let i = 0; i < instructionCount; i++) {
			const programIdIndex = guardedShift(byteArray);
			const accountKeyIndexes = guardedSplice(byteArray, 0, decodeLength(byteArray));
			const dataLength = decodeLength(byteArray);
			const data = new Uint8Array(guardedSplice(byteArray, 0, dataLength));
			compiledInstructions.push({
				programIdIndex,
				accountKeyIndexes,
				data
			});
		}
		const addressTableLookupsCount = decodeLength(byteArray);
		const addressTableLookups = [];
		for (let i = 0; i < addressTableLookupsCount; i++) {
			const accountKey = new PublicKey(guardedSplice(byteArray, 0, 32));
			const writableIndexes = guardedSplice(byteArray, 0, decodeLength(byteArray));
			const readonlyIndexes = guardedSplice(byteArray, 0, decodeLength(byteArray));
			addressTableLookups.push({
				accountKey,
				writableIndexes,
				readonlyIndexes
			});
		}
		return new MessageV0({
			header,
			staticAccountKeys,
			recentBlockhash,
			compiledInstructions,
			addressTableLookups
		});
	}
};
var CONFIG_MASK_PRIORITY_FEE_BITS = 3;
var CONFIG_MASK_COMPUTE_UNIT_LIMIT_BIT = 4;
var CONFIG_MASK_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT = 8;
var CONFIG_MASK_HEAP_SIZE_BIT = 16;
function decodeU32(byteArray) {
	const bytes = guardedSplice(byteArray, 0, 4);
	return bytes[0] + bytes[1] * 256 + bytes[2] * 2 ** 16 + bytes[3] * 2 ** 24;
}
function decodeU64(byteArray) {
	const bytes = guardedSplice(byteArray, 0, 8);
	let value = BigInt(0);
	for (let i = bytes.length - 1; i >= 0; i--) value = value << BigInt(8) | BigInt(bytes[i]);
	assert(value <= BigInt(Number.MAX_SAFE_INTEGER), "Expected u64 value to be within the safe integer range");
	return Number(value);
}
/**
* The transaction config of a v1 transaction message, which expresses the
* compute budget directly in the message instead of through ComputeBudget
* program instructions. Fields the transaction did not set are `null`.
*/
/**
* Message constructor arguments
*/
var MessageV1 = class MessageV1 {
	constructor(args) {
		this.header = void 0;
		this.staticAccountKeys = void 0;
		this.recentBlockhash = void 0;
		this.compiledInstructions = void 0;
		this.transactionConfig = void 0;
		this.header = args.header;
		this.staticAccountKeys = args.staticAccountKeys;
		this.recentBlockhash = args.recentBlockhash;
		this.compiledInstructions = args.compiledInstructions;
		this.transactionConfig = args.transactionConfig ?? {
			computeUnitLimit: null,
			heapSize: null,
			loadedAccountsDataSizeLimit: null,
			priorityFee: null
		};
	}
	get version() {
		return 1;
	}
	get addressTableLookups() {
		return [];
	}
	getAccountKeys() {
		return new MessageAccountKeys(this.staticAccountKeys);
	}
	isAccountSigner(index) {
		return index < this.header.numRequiredSignatures;
	}
	isAccountWritable(index) {
		const numSignedAccounts = this.header.numRequiredSignatures;
		const numStaticAccountKeys = this.staticAccountKeys.length;
		if (index >= numStaticAccountKeys) return false;
		else if (index >= this.header.numRequiredSignatures) return index - numSignedAccounts < numStaticAccountKeys - numSignedAccounts - this.header.numReadonlyUnsignedAccounts;
		else return index < numSignedAccounts - this.header.numReadonlySignedAccounts;
	}
	serialize() {
		throw new Error("Serialization of version 1 transaction messages is not supported");
	}
	static deserialize(serializedMessage) {
		let byteArray = [...serializedMessage];
		const prefix = guardedShift(byteArray);
		const maskedPrefix = prefix & 127;
		assert(prefix !== maskedPrefix, `Expected versioned message but received legacy message`);
		const version = maskedPrefix;
		assert(version === 1, `Expected versioned message with version 1 but found version ${version}`);
		const header = {
			numRequiredSignatures: guardedShift(byteArray),
			numReadonlySignedAccounts: guardedShift(byteArray),
			numReadonlyUnsignedAccounts: guardedShift(byteArray)
		};
		const configMask = decodeU32(byteArray);
		assert((configMask & -32) === 0, "Unexpected bits set in the transaction config mask");
		const priorityFeeBits = configMask & CONFIG_MASK_PRIORITY_FEE_BITS;
		assert(priorityFeeBits === 0 || priorityFeeBits === CONFIG_MASK_PRIORITY_FEE_BITS, "Expected both or neither of the priority fee bits to be set in the transaction config mask");
		const recentBlockhash = import_bs58.default.encode(guardedSplice(byteArray, 0, 32));
		const instructionCount = guardedShift(byteArray);
		const staticAccountKeysLength = guardedShift(byteArray);
		const staticAccountKeys = [];
		for (let i = 0; i < staticAccountKeysLength; i++) staticAccountKeys.push(new PublicKey(guardedSplice(byteArray, 0, 32)));
		const transactionConfig = {
			computeUnitLimit: null,
			heapSize: null,
			loadedAccountsDataSizeLimit: null,
			priorityFee: null
		};
		if (priorityFeeBits !== 0) transactionConfig.priorityFee = decodeU64(byteArray);
		if (configMask & CONFIG_MASK_COMPUTE_UNIT_LIMIT_BIT) transactionConfig.computeUnitLimit = decodeU32(byteArray);
		if (configMask & CONFIG_MASK_LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT) transactionConfig.loadedAccountsDataSizeLimit = decodeU32(byteArray);
		if (configMask & CONFIG_MASK_HEAP_SIZE_BIT) transactionConfig.heapSize = decodeU32(byteArray);
		const instructionHeaders = [];
		for (let i = 0; i < instructionCount; i++) {
			const programIdIndex = guardedShift(byteArray);
			const accountKeyIndexesLength = guardedShift(byteArray);
			const dataLength = guardedShift(byteArray) + guardedShift(byteArray) * 256;
			instructionHeaders.push({
				accountKeyIndexesLength,
				dataLength,
				programIdIndex
			});
		}
		const compiledInstructions = [];
		for (const instructionHeader of instructionHeaders) compiledInstructions.push({
			programIdIndex: instructionHeader.programIdIndex,
			accountKeyIndexes: guardedSplice(byteArray, 0, instructionHeader.accountKeyIndexesLength),
			data: new Uint8Array(guardedSplice(byteArray, 0, instructionHeader.dataLength))
		});
		assert(byteArray.length === 0, "Expected no bytes to remain after deserializing a version 1 message");
		return new MessageV1({
			header,
			staticAccountKeys,
			recentBlockhash,
			compiledInstructions,
			transactionConfig
		});
	}
};
/** @internal */
/**
* Transaction signature as base-58 encoded string
*/
var TransactionStatus = /*#__PURE__*/ function(TransactionStatus) {
	TransactionStatus[TransactionStatus["BLOCKHEIGHT_EXCEEDED"] = 0] = "BLOCKHEIGHT_EXCEEDED";
	TransactionStatus[TransactionStatus["PROCESSED"] = 1] = "PROCESSED";
	TransactionStatus[TransactionStatus["TIMED_OUT"] = 2] = "TIMED_OUT";
	TransactionStatus[TransactionStatus["NONCE_INVALID"] = 3] = "NONCE_INVALID";
	return TransactionStatus;
}({});
/**
* Default (empty) signature
*/
var DEFAULT_SIGNATURE = Buffer$1.alloc(64).fill(0);
/**
* Account metadata used to define instructions
*/
/**
* List of TransactionInstruction object fields that may be initialized at construction
*/
/**
* Configuration object for Transaction.serialize()
*/
/**
* @internal
*/
/**
* Transaction Instruction class
*/
var TransactionInstruction = class {
	constructor(opts) {
		/**
		* Public keys to include in this transaction
		* Boolean represents whether this pubkey needs to sign the transaction
		*/
		this.keys = void 0;
		/**
		* Program Id to execute
		*/
		this.programId = void 0;
		/**
		* Program input
		*/
		this.data = Buffer$1.alloc(0);
		this.programId = opts.programId;
		this.keys = opts.keys;
		if (opts.data) this.data = opts.data;
	}
	/**
	* @internal
	*/
	toJSON() {
		return {
			keys: this.keys.map(({ pubkey, isSigner, isWritable }) => ({
				pubkey: pubkey.toJSON(),
				isSigner,
				isWritable
			})),
			programId: this.programId.toJSON(),
			data: [...this.data]
		};
	}
};
/**
* Pair of signature and corresponding public key
*/
/**
* List of Transaction object fields that may be initialized at construction
*/
/**
* Blockhash-based transactions have a lifetime that are defined by
* the blockhash they include. Any transaction whose blockhash is
* too old will be rejected.
*/
/**
* Use these options to construct a durable nonce transaction.
*/
/**
* Nonce information to be used to build an offline Transaction.
*/
/**
* @internal
*/
/**
* Transaction class
*/
var Transaction = class Transaction {
	/**
	* The first (payer) Transaction signature
	*
	* @returns {Buffer | null} Buffer of payer's signature
	*/
	get signature() {
		if (this.signatures.length > 0) return this.signatures[0].signature;
		return null;
	}
	/**
	* The transaction fee payer
	*/
	/**
	* @deprecated `TransactionCtorFields` has been deprecated and will be removed in a future version.
	* Please supply a `TransactionBlockhashCtor` instead.
	*/
	/**
	* Construct an empty Transaction
	*/
	constructor(opts) {
		/**
		* Signatures for the transaction.  Typically created by invoking the
		* `sign()` method
		*/
		this.signatures = [];
		this.feePayer = void 0;
		/**
		* The instructions to atomically execute
		*/
		this.instructions = [];
		/**
		* A recent transaction id. Must be populated by the caller
		*/
		this.recentBlockhash = void 0;
		/**
		* the last block chain can advance to before tx is declared expired
		* */
		this.lastValidBlockHeight = void 0;
		/**
		* Optional Nonce information. If populated, transaction will use a durable
		* Nonce hash instead of a recentBlockhash. Must be populated by the caller
		*/
		this.nonceInfo = void 0;
		/**
		* If this is a nonce transaction this represents the minimum slot from which
		* to evaluate if the nonce has advanced when attempting to confirm the
		* transaction. This protects against a case where the transaction confirmation
		* logic loads the nonce account from an old slot and assumes the mismatch in
		* nonce value implies that the nonce has been advanced.
		*/
		this.minNonceContextSlot = void 0;
		/**
		* @internal
		*/
		this._message = void 0;
		/**
		* @internal
		*/
		this._json = void 0;
		if (!opts) return;
		if (opts.feePayer) this.feePayer = opts.feePayer;
		if (opts.signatures) this.signatures = opts.signatures;
		if (Object.prototype.hasOwnProperty.call(opts, "nonceInfo")) {
			const { minContextSlot, nonceInfo } = opts;
			this.minNonceContextSlot = minContextSlot;
			this.nonceInfo = nonceInfo;
		} else if (Object.prototype.hasOwnProperty.call(opts, "lastValidBlockHeight")) {
			const { blockhash, lastValidBlockHeight } = opts;
			this.recentBlockhash = blockhash;
			this.lastValidBlockHeight = lastValidBlockHeight;
		} else {
			const { recentBlockhash, nonceInfo } = opts;
			if (nonceInfo) this.nonceInfo = nonceInfo;
			this.recentBlockhash = recentBlockhash;
		}
	}
	/**
	* @internal
	*/
	toJSON() {
		return {
			recentBlockhash: this.recentBlockhash || null,
			feePayer: this.feePayer ? this.feePayer.toJSON() : null,
			nonceInfo: this.nonceInfo ? {
				nonce: this.nonceInfo.nonce,
				nonceInstruction: this.nonceInfo.nonceInstruction.toJSON()
			} : null,
			instructions: this.instructions.map((instruction) => instruction.toJSON()),
			signers: this.signatures.map(({ publicKey }) => {
				return publicKey.toJSON();
			})
		};
	}
	/**
	* Add one or more instructions to this Transaction
	*
	* @param {Array< Transaction | TransactionInstruction | TransactionInstructionCtorFields >} items - Instructions to add to the Transaction
	*/
	add(...items) {
		if (items.length === 0) throw new Error("No instructions");
		items.forEach((item) => {
			if ("instructions" in item) this.instructions = this.instructions.concat(item.instructions);
			else if ("data" in item && "programId" in item && "keys" in item) this.instructions.push(item);
			else this.instructions.push(new TransactionInstruction(item));
		});
		return this;
	}
	/**
	* Compile transaction data
	*/
	compileMessage() {
		if (this._message && JSON.stringify(this.toJSON()) === JSON.stringify(this._json)) return this._message;
		let recentBlockhash;
		let instructions;
		if (this.nonceInfo) {
			recentBlockhash = this.nonceInfo.nonce;
			if (this.instructions[0] != this.nonceInfo.nonceInstruction) instructions = [this.nonceInfo.nonceInstruction, ...this.instructions];
			else instructions = this.instructions;
		} else {
			recentBlockhash = this.recentBlockhash;
			instructions = this.instructions;
		}
		if (!recentBlockhash) throw new Error("Transaction recentBlockhash required");
		if (instructions.length < 1) console.warn("No instructions provided");
		let feePayer;
		if (this.feePayer) feePayer = this.feePayer;
		else if (this.signatures.length > 0 && this.signatures[0].publicKey) feePayer = this.signatures[0].publicKey;
		else throw new Error("Transaction fee payer required");
		for (let i = 0; i < instructions.length; i++) if (instructions[i].programId === void 0) throw new Error(`Transaction instruction index ${i} has undefined program id`);
		const programIds = [];
		const accountMetas = [];
		instructions.forEach((instruction) => {
			instruction.keys.forEach((accountMeta) => {
				accountMetas.push({ ...accountMeta });
			});
			const programId = instruction.programId.toString();
			if (!programIds.includes(programId)) programIds.push(programId);
		});
		programIds.forEach((programId) => {
			accountMetas.push({
				pubkey: new PublicKey(programId),
				isSigner: false,
				isWritable: false
			});
		});
		const uniqueMetas = [];
		accountMetas.forEach((accountMeta) => {
			const pubkeyString = accountMeta.pubkey.toString();
			const uniqueIndex = uniqueMetas.findIndex((x) => {
				return x.pubkey.toString() === pubkeyString;
			});
			if (uniqueIndex > -1) {
				uniqueMetas[uniqueIndex].isWritable = uniqueMetas[uniqueIndex].isWritable || accountMeta.isWritable;
				uniqueMetas[uniqueIndex].isSigner = uniqueMetas[uniqueIndex].isSigner || accountMeta.isSigner;
			} else uniqueMetas.push(accountMeta);
		});
		uniqueMetas.sort(function(x, y) {
			if (x.isSigner !== y.isSigner) return x.isSigner ? -1 : 1;
			if (x.isWritable !== y.isWritable) return x.isWritable ? -1 : 1;
			return x.pubkey.toBase58().localeCompare(y.pubkey.toBase58(), "en", {
				localeMatcher: "best fit",
				usage: "sort",
				sensitivity: "variant",
				ignorePunctuation: false,
				numeric: false,
				caseFirst: "lower"
			});
		});
		const feePayerIndex = uniqueMetas.findIndex((x) => {
			return x.pubkey.equals(feePayer);
		});
		if (feePayerIndex > -1) {
			const [payerMeta] = uniqueMetas.splice(feePayerIndex, 1);
			payerMeta.isSigner = true;
			payerMeta.isWritable = true;
			uniqueMetas.unshift(payerMeta);
		} else uniqueMetas.unshift({
			pubkey: feePayer,
			isSigner: true,
			isWritable: true
		});
		for (const signature of this.signatures) {
			const uniqueIndex = uniqueMetas.findIndex((x) => {
				return x.pubkey.equals(signature.publicKey);
			});
			if (uniqueIndex > -1) {
				if (!uniqueMetas[uniqueIndex].isSigner) {
					uniqueMetas[uniqueIndex].isSigner = true;
					console.warn("Transaction references a signature that is unnecessary, only the fee payer and instruction signer accounts should sign a transaction. This behavior is deprecated and will throw an error in the next major version release.");
				}
			} else throw new Error(`unknown signer: ${signature.publicKey.toString()}`);
		}
		let numRequiredSignatures = 0;
		let numReadonlySignedAccounts = 0;
		let numReadonlyUnsignedAccounts = 0;
		const signedKeys = [];
		const unsignedKeys = [];
		uniqueMetas.forEach(({ pubkey, isSigner, isWritable }) => {
			if (isSigner) {
				signedKeys.push(pubkey.toString());
				numRequiredSignatures += 1;
				if (!isWritable) numReadonlySignedAccounts += 1;
			} else {
				unsignedKeys.push(pubkey.toString());
				if (!isWritable) numReadonlyUnsignedAccounts += 1;
			}
		});
		const accountKeys = signedKeys.concat(unsignedKeys);
		const compiledInstructions = instructions.map((instruction) => {
			const { data, programId } = instruction;
			return {
				programIdIndex: accountKeys.indexOf(programId.toString()),
				accounts: instruction.keys.map((meta) => accountKeys.indexOf(meta.pubkey.toString())),
				data: import_bs58.default.encode(data)
			};
		});
		compiledInstructions.forEach((instruction) => {
			assert(instruction.programIdIndex >= 0);
			instruction.accounts.forEach((keyIndex) => assert(keyIndex >= 0));
		});
		return new Message({
			header: {
				numRequiredSignatures,
				numReadonlySignedAccounts,
				numReadonlyUnsignedAccounts
			},
			accountKeys,
			recentBlockhash,
			instructions: compiledInstructions
		});
	}
	/**
	* @internal
	*/
	_compile() {
		const message = this.compileMessage();
		const signedKeys = message.accountKeys.slice(0, message.header.numRequiredSignatures);
		if (this.signatures.length === signedKeys.length) {
			if (this.signatures.every((pair, index) => {
				return signedKeys[index].equals(pair.publicKey);
			})) return message;
		}
		this.signatures = signedKeys.map((publicKey) => ({
			signature: null,
			publicKey
		}));
		return message;
	}
	/**
	* Get a buffer of the Transaction data that need to be covered by signatures
	*/
	serializeMessage() {
		return this._compile().serialize();
	}
	/**
	* Get the estimated fee associated with a transaction
	*
	* @param {Connection} connection Connection to RPC Endpoint.
	*
	* @returns {Promise<number | null>} The estimated fee for the transaction
	*/
	async getEstimatedFee(connection) {
		return (await connection.getFeeForMessage(this.compileMessage())).value;
	}
	/**
	* Specify the public keys which will be used to sign the Transaction.
	* The first signer will be used as the transaction fee payer account.
	*
	* Signatures can be added with either `partialSign` or `addSignature`
	*
	* @deprecated Deprecated since v0.84.0. Only the fee payer needs to be
	* specified and it can be set in the Transaction constructor or with the
	* `feePayer` property.
	*/
	setSigners(...signers) {
		if (signers.length === 0) throw new Error("No signers");
		const seen = /* @__PURE__ */ new Set();
		this.signatures = signers.filter((publicKey) => {
			const key = publicKey.toString();
			if (seen.has(key)) return false;
			else {
				seen.add(key);
				return true;
			}
		}).map((publicKey) => ({
			signature: null,
			publicKey
		}));
	}
	/**
	* Sign the Transaction with the specified signers. Multiple signatures may
	* be applied to a Transaction. The first signature is considered "primary"
	* and is used identify and confirm transactions.
	*
	* If the Transaction `feePayer` is not set, the first signer will be used
	* as the transaction fee payer account.
	*
	* Transaction fields should not be modified after the first call to `sign`,
	* as doing so may invalidate the signature and cause the Transaction to be
	* rejected.
	*
	* The Transaction must be assigned a valid `recentBlockhash` before invoking this method
	*
	* @param {Array<Signer>} signers Array of signers that will sign the transaction
	*/
	sign(...signers) {
		if (signers.length === 0) throw new Error("No signers");
		const seen = /* @__PURE__ */ new Set();
		const uniqueSigners = [];
		for (const signer of signers) {
			const key = signer.publicKey.toString();
			if (seen.has(key)) continue;
			else {
				seen.add(key);
				uniqueSigners.push(signer);
			}
		}
		this.signatures = uniqueSigners.map((signer) => ({
			signature: null,
			publicKey: signer.publicKey
		}));
		const message = this._compile();
		this._partialSign(message, ...uniqueSigners);
	}
	/**
	* Partially sign a transaction with the specified accounts. All accounts must
	* correspond to either the fee payer or a signer account in the transaction
	* instructions.
	*
	* All the caveats from the `sign` method apply to `partialSign`
	*
	* @param {Array<Signer>} signers Array of signers that will sign the transaction
	*/
	partialSign(...signers) {
		if (signers.length === 0) throw new Error("No signers");
		const seen = /* @__PURE__ */ new Set();
		const uniqueSigners = [];
		for (const signer of signers) {
			const key = signer.publicKey.toString();
			if (seen.has(key)) continue;
			else {
				seen.add(key);
				uniqueSigners.push(signer);
			}
		}
		const message = this._compile();
		this._partialSign(message, ...uniqueSigners);
	}
	/**
	* @internal
	*/
	_partialSign(message, ...signers) {
		const signData = message.serialize();
		signers.forEach((signer) => {
			const signature = sign(signData, signer.secretKey);
			this._addSignature(signer.publicKey, toBuffer(signature));
		});
	}
	/**
	* Add an externally created signature to a transaction. The public key
	* must correspond to either the fee payer or a signer account in the transaction
	* instructions.
	*
	* @param {PublicKey} pubkey Public key that will be added to the transaction.
	* @param {Buffer} signature An externally created signature to add to the transaction.
	*/
	addSignature(pubkey, signature) {
		this._compile();
		this._addSignature(pubkey, signature);
	}
	/**
	* @internal
	*/
	_addSignature(pubkey, signature) {
		assert(signature.length === 64);
		const index = this.signatures.findIndex((sigpair) => pubkey.equals(sigpair.publicKey));
		if (index < 0) throw new Error(`unknown signer: ${pubkey.toString()}`);
		this.signatures[index].signature = Buffer$1.from(signature);
	}
	/**
	* Verify signatures of a Transaction
	* Optional parameter specifies if we're expecting a fully signed Transaction or a partially signed one.
	* If no boolean is provided, we expect a fully signed Transaction by default.
	*
	* @param {boolean} [requireAllSignatures=true] Require a fully signed Transaction
	*/
	verifySignatures(requireAllSignatures = true) {
		return !this._getMessageSignednessErrors(this.serializeMessage(), requireAllSignatures);
	}
	/**
	* @internal
	*/
	_getMessageSignednessErrors(message, requireAllSignatures) {
		const errors = {};
		for (const { signature, publicKey } of this.signatures) if (signature === null) {
			if (requireAllSignatures) (errors.missing ||= []).push(publicKey);
		} else if (!verify(signature, message, publicKey.toBytes())) (errors.invalid ||= []).push(publicKey);
		return errors.invalid || errors.missing ? errors : void 0;
	}
	/**
	* Serialize the Transaction in the wire format.
	*
	* @param {Buffer} [config] Config of transaction.
	*
	* @returns {Buffer} Signature of transaction in wire format.
	*/
	serialize(config) {
		const { requireAllSignatures, verifySignatures } = Object.assign({
			requireAllSignatures: true,
			verifySignatures: true
		}, config);
		const signData = this.serializeMessage();
		if (verifySignatures) {
			const sigErrors = this._getMessageSignednessErrors(signData, requireAllSignatures);
			if (sigErrors) {
				let errorMessage = "Signature verification failed.";
				if (sigErrors.invalid) errorMessage += `\nInvalid signature for public key${sigErrors.invalid.length === 1 ? "" : "(s)"} [\`${sigErrors.invalid.map((p) => p.toBase58()).join("`, `")}\`].`;
				if (sigErrors.missing) errorMessage += `\nMissing signature for public key${sigErrors.missing.length === 1 ? "" : "(s)"} [\`${sigErrors.missing.map((p) => p.toBase58()).join("`, `")}\`].`;
				throw new Error(errorMessage);
			}
		}
		return this._serialize(signData);
	}
	/**
	* @internal
	*/
	_serialize(signData) {
		const { signatures } = this;
		const signatureCount = [];
		encodeLength(signatureCount, signatures.length);
		const transactionLength = signatureCount.length + signatures.length * 64 + signData.length;
		const wireTransaction = Buffer$1.alloc(transactionLength);
		assert(signatures.length < 256);
		Buffer$1.from(signatureCount).copy(wireTransaction, 0);
		signatures.forEach(({ signature }, index) => {
			if (signature !== null) {
				assert(signature.length === 64, `signature has invalid length`);
				Buffer$1.from(signature).copy(wireTransaction, signatureCount.length + index * 64);
			}
		});
		signData.copy(wireTransaction, signatureCount.length + signatures.length * 64);
		assert(wireTransaction.length <= PACKET_DATA_SIZE, `Transaction too large: ${wireTransaction.length} > ${PACKET_DATA_SIZE}`);
		return wireTransaction;
	}
	/**
	* Deprecated method
	* @internal
	*/
	get keys() {
		assert(this.instructions.length === 1);
		return this.instructions[0].keys.map((keyObj) => keyObj.pubkey);
	}
	/**
	* Deprecated method
	* @internal
	*/
	get programId() {
		assert(this.instructions.length === 1);
		return this.instructions[0].programId;
	}
	/**
	* Deprecated method
	* @internal
	*/
	get data() {
		assert(this.instructions.length === 1);
		return this.instructions[0].data;
	}
	/**
	* Parse a wire transaction into a Transaction object.
	*
	* @param {Buffer | Uint8Array | Array<number>} buffer Signature of wire Transaction
	*
	* @returns {Transaction} Transaction associated with the signature
	*/
	static from(buffer) {
		let byteArray = [...buffer];
		const signatureCount = decodeLength(byteArray);
		let signatures = [];
		for (let i = 0; i < signatureCount; i++) {
			const signature = guardedSplice(byteArray, 0, 64);
			signatures.push(import_bs58.default.encode(Buffer$1.from(signature)));
		}
		return Transaction.populate(Message.from(byteArray), signatures);
	}
	/**
	* Populate Transaction object from message and signatures
	*
	* @param {Message} message Message of transaction
	* @param {Array<string>} signatures List of signatures to assign to the transaction
	*
	* @returns {Transaction} The populated Transaction
	*/
	static populate(message, signatures = []) {
		const transaction = new Transaction();
		transaction.recentBlockhash = message.recentBlockhash;
		if (message.header.numRequiredSignatures > 0) transaction.feePayer = message.accountKeys[0];
		signatures.forEach((signature, index) => {
			const sigPubkeyPair = {
				signature: signature == import_bs58.default.encode(DEFAULT_SIGNATURE) ? null : import_bs58.default.decode(signature),
				publicKey: message.accountKeys[index]
			};
			transaction.signatures.push(sigPubkeyPair);
		});
		message.instructions.forEach((instruction) => {
			const keys = instruction.accounts.map((account) => {
				const pubkey = message.accountKeys[account];
				return {
					pubkey,
					isSigner: transaction.signatures.some((keyObj) => keyObj.publicKey.toString() === pubkey.toString()) || message.isAccountSigner(account),
					isWritable: message.isAccountWritable(account)
				};
			});
			transaction.instructions.push(new TransactionInstruction({
				keys,
				programId: message.accountKeys[instruction.programIdIndex],
				data: import_bs58.default.decode(instruction.data)
			}));
		});
		transaction._message = message;
		transaction._json = transaction.toJSON();
		return transaction;
	}
};
/**
* @internal
*/
var MS_PER_SLOT = 1e3 / (160 / 64);
var SYSVAR_CLOCK_PUBKEY = new PublicKey("SysvarC1ock11111111111111111111111111111111");
new PublicKey("SysvarEpochSchedu1e111111111111111111111111");
new PublicKey("Sysvar1nstructions1111111111111111111111111");
var SYSVAR_RECENT_BLOCKHASHES_PUBKEY = new PublicKey("SysvarRecentB1ockHashes11111111111111111111");
var SYSVAR_RENT_PUBKEY = new PublicKey("SysvarRent111111111111111111111111111111111");
new PublicKey("SysvarRewards111111111111111111111111111111");
new PublicKey("SysvarS1otHashes111111111111111111111111111");
new PublicKey("SysvarS1otHistory11111111111111111111111111");
var SYSVAR_STAKE_HISTORY_PUBKEY = new PublicKey("SysvarStakeHistory1111111111111111111111111");
var SendTransactionError = class extends Error {
	constructor({ action, signature, transactionMessage, logs }) {
		const maybeLogsOutput = logs ? `Logs: \n${JSON.stringify(logs.slice(-10), null, 2)}. ` : "";
		const guideText = "\nCatch the `SendTransactionError` and call `getLogs()` on it for full details.";
		let message;
		switch (action) {
			case "send":
				message = `Transaction ${signature} resulted in an error. \n${transactionMessage}. ` + maybeLogsOutput + guideText;
				break;
			case "simulate":
				message = `Simulation failed. \nMessage: ${transactionMessage}. \n` + maybeLogsOutput + guideText;
				break;
			default: message = `Unknown action '${((a) => a)(action)}'`;
		}
		super(message);
		this.signature = void 0;
		this.transactionMessage = void 0;
		this.transactionLogs = void 0;
		this.signature = signature;
		this.transactionMessage = transactionMessage;
		this.transactionLogs = logs ? logs : void 0;
	}
	get transactionError() {
		return {
			message: this.transactionMessage,
			logs: Array.isArray(this.transactionLogs) ? this.transactionLogs : void 0
		};
	}
	get logs() {
		const cachedLogs = this.transactionLogs;
		if (cachedLogs != null && typeof cachedLogs === "object" && "then" in cachedLogs) return;
		return cachedLogs;
	}
	async getLogs(connection) {
		if (!Array.isArray(this.transactionLogs)) this.transactionLogs = new Promise((resolve, reject) => {
			connection.getTransaction(this.signature).then((tx) => {
				if (tx && tx.meta && tx.meta.logMessages) {
					const logs = tx.meta.logMessages;
					this.transactionLogs = logs;
					resolve(logs);
				} else reject(/* @__PURE__ */ new Error("Log messages not found"));
			}).catch(reject);
		});
		return await this.transactionLogs;
	}
};
var SolanaJSONRPCError = class extends Error {
	constructor({ code, message, data }, customMessage) {
		super(customMessage != null ? `${customMessage}: ${message}` : message);
		this.code = void 0;
		this.data = void 0;
		this.code = code;
		this.data = data;
		this.name = "SolanaJSONRPCError";
	}
};
/**
* Sign, send and confirm a transaction.
*
* If `commitment` option is not specified, defaults to 'max' commitment.
*
* @param {Connection} connection
* @param {Transaction} transaction
* @param {Array<Signer>} signers
* @param {ConfirmOptions} [options]
* @returns {Promise<TransactionSignature>}
*/
async function sendAndConfirmTransaction(connection, transaction, signers, options) {
	const sendOptions = options && {
		skipPreflight: options.skipPreflight,
		preflightCommitment: options.preflightCommitment || options.commitment,
		maxRetries: options.maxRetries,
		minContextSlot: options.minContextSlot
	};
	const signature = await connection.sendTransaction(transaction, signers, sendOptions);
	let status;
	if (transaction.recentBlockhash != null && transaction.lastValidBlockHeight != null) status = (await connection.confirmTransaction({
		abortSignal: options?.abortSignal,
		signature,
		blockhash: transaction.recentBlockhash,
		lastValidBlockHeight: transaction.lastValidBlockHeight
	}, options && options.commitment)).value;
	else if (transaction.minNonceContextSlot != null && transaction.nonceInfo != null) {
		const { nonceInstruction } = transaction.nonceInfo;
		const nonceAccountPubkey = nonceInstruction.keys[0].pubkey;
		status = (await connection.confirmTransaction({
			abortSignal: options?.abortSignal,
			minContextSlot: transaction.minNonceContextSlot,
			nonceAccountPubkey,
			nonceValue: transaction.nonceInfo.nonce,
			signature
		}, options && options.commitment)).value;
	} else {
		if (options?.abortSignal != null) console.warn("sendAndConfirmTransaction(): A transaction with a deprecated confirmation strategy was supplied along with an `abortSignal`. Only transactions having `lastValidBlockHeight` or a combination of `nonceInfo` and `minNonceContextSlot` are abortable.");
		status = (await connection.confirmTransaction(signature, options && options.commitment)).value;
	}
	if (status.err) {
		if (signature != null) throw new SendTransactionError({
			action: "send",
			signature,
			transactionMessage: `Status: (${JSON.stringify(status)})`
		});
		throw new Error(`Transaction ${signature} failed (${JSON.stringify(status)})`);
	}
	return signature;
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
* @internal
*/
/**
* Populate a buffer of instruction data using an InstructionType
* @internal
*/
function encodeData(type, fields) {
	const allocLength = type.layout.span >= 0 ? type.layout.span : getAlloc(type, fields);
	const data = Buffer$1.alloc(allocLength);
	const layoutFields = Object.assign({ instruction: type.index }, fields);
	type.layout.encode(layoutFields, data);
	return data;
}
/**
* https://github.com/solana-labs/solana/blob/90bedd7e067b5b8f3ddbb45da00a4e9cabb22c62/sdk/src/fee_calculator.rs#L7-L11
*
* @internal
*/
var FeeCalculatorLayout = import_Layout.nu64("lamportsPerSignature");
/**
* Calculator for transaction fees.
*
* @deprecated Deprecated since Solana v1.8.0.
*/
/**
* See https://github.com/solana-labs/solana/blob/0ea2843ec9cdc517572b8e62c959f41b55cf4453/sdk/src/nonce_state.rs#L29-L32
*
* @internal
*/
var NonceAccountLayout = import_Layout.struct([
	import_Layout.u32("version"),
	import_Layout.u32("state"),
	publicKey("authorizedPubkey"),
	publicKey("nonce"),
	import_Layout.struct([FeeCalculatorLayout], "feeCalculator")
]);
var NONCE_ACCOUNT_LENGTH = NonceAccountLayout.span;
/**
* A durable nonce is a 32 byte value encoded as a base58 string.
*/
/**
* NonceAccount class
*/
var NonceAccount = class NonceAccount {
	/**
	* @internal
	*/
	constructor(args) {
		this.authorizedPubkey = void 0;
		this.nonce = void 0;
		this.feeCalculator = void 0;
		this.authorizedPubkey = args.authorizedPubkey;
		this.nonce = args.nonce;
		this.feeCalculator = args.feeCalculator;
	}
	/**
	* Deserialize NonceAccount from the account data.
	*
	* @param buffer account data
	* @return NonceAccount
	*/
	static fromAccountData(buffer) {
		const nonceAccount = NonceAccountLayout.decode(toBuffer(buffer), 0);
		return new NonceAccount({
			authorizedPubkey: new PublicKey(nonceAccount.authorizedPubkey),
			nonce: new PublicKey(nonceAccount.nonce).toString(),
			feeCalculator: nonceAccount.feeCalculator
		});
	}
};
function u64(property) {
	const layout = (0, import_Layout.blob)(8, property);
	const decode = layout.decode.bind(layout);
	const encode = layout.encode.bind(layout);
	const bigIntLayout = layout;
	const codec = getU64Codec();
	bigIntLayout.decode = (buffer, offset) => {
		const src = decode(buffer, offset);
		return codec.decode(src);
	};
	bigIntLayout.encode = (bigInt, buffer, offset) => {
		const src = codec.encode(bigInt);
		return encode(src, buffer, offset);
	};
	return bigIntLayout;
}
/**
* An enumeration of valid SystemInstructionType's
*/
/**
* An enumeration of valid system InstructionType's
* @internal
*/
var SYSTEM_INSTRUCTION_LAYOUTS = Object.freeze({
	Create: {
		index: 0,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			import_Layout.ns64("lamports"),
			import_Layout.ns64("space"),
			publicKey("programId")
		])
	},
	Assign: {
		index: 1,
		layout: import_Layout.struct([import_Layout.u32("instruction"), publicKey("programId")])
	},
	Transfer: {
		index: 2,
		layout: import_Layout.struct([import_Layout.u32("instruction"), u64("lamports")])
	},
	CreateWithSeed: {
		index: 3,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			publicKey("base"),
			rustString("seed"),
			import_Layout.ns64("lamports"),
			import_Layout.ns64("space"),
			publicKey("programId")
		])
	},
	AdvanceNonceAccount: {
		index: 4,
		layout: import_Layout.struct([import_Layout.u32("instruction")])
	},
	WithdrawNonceAccount: {
		index: 5,
		layout: import_Layout.struct([import_Layout.u32("instruction"), import_Layout.ns64("lamports")])
	},
	InitializeNonceAccount: {
		index: 6,
		layout: import_Layout.struct([import_Layout.u32("instruction"), publicKey("authorized")])
	},
	AuthorizeNonceAccount: {
		index: 7,
		layout: import_Layout.struct([import_Layout.u32("instruction"), publicKey("authorized")])
	},
	Allocate: {
		index: 8,
		layout: import_Layout.struct([import_Layout.u32("instruction"), import_Layout.ns64("space")])
	},
	AllocateWithSeed: {
		index: 9,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			publicKey("base"),
			rustString("seed"),
			import_Layout.ns64("space"),
			publicKey("programId")
		])
	},
	AssignWithSeed: {
		index: 10,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			publicKey("base"),
			rustString("seed"),
			publicKey("programId")
		])
	},
	TransferWithSeed: {
		index: 11,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			u64("lamports"),
			rustString("seed"),
			publicKey("programId")
		])
	},
	UpgradeNonceAccount: {
		index: 12,
		layout: import_Layout.struct([import_Layout.u32("instruction")])
	}
});
/**
* Factory class for transactions to interact with the System program
*/
var SystemProgram = class SystemProgram {
	/**
	* @internal
	*/
	constructor() {}
	/**
	* Public key that identifies the System program
	*/
	/**
	* Generate a transaction instruction that creates a new account
	*/
	static createAccount(params) {
		const type = SYSTEM_INSTRUCTION_LAYOUTS.Create;
		const data = encodeData(type, {
			lamports: params.lamports,
			space: params.space,
			programId: toBuffer(params.programId.toBuffer())
		});
		return new TransactionInstruction({
			keys: [{
				pubkey: params.fromPubkey,
				isSigner: true,
				isWritable: true
			}, {
				pubkey: params.newAccountPubkey,
				isSigner: true,
				isWritable: true
			}],
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction instruction that transfers lamports from one account to another
	*/
	static transfer(params) {
		let data;
		let keys;
		if ("basePubkey" in params) {
			const type = SYSTEM_INSTRUCTION_LAYOUTS.TransferWithSeed;
			data = encodeData(type, {
				lamports: BigInt(params.lamports),
				seed: params.seed,
				programId: toBuffer(params.programId.toBuffer())
			});
			keys = [
				{
					pubkey: params.fromPubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: params.basePubkey,
					isSigner: true,
					isWritable: false
				},
				{
					pubkey: params.toPubkey,
					isSigner: false,
					isWritable: true
				}
			];
		} else {
			const type = SYSTEM_INSTRUCTION_LAYOUTS.Transfer;
			data = encodeData(type, { lamports: BigInt(params.lamports) });
			keys = [{
				pubkey: params.fromPubkey,
				isSigner: true,
				isWritable: true
			}, {
				pubkey: params.toPubkey,
				isSigner: false,
				isWritable: true
			}];
		}
		return new TransactionInstruction({
			keys,
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction instruction that assigns an account to a program
	*/
	static assign(params) {
		let data;
		let keys;
		if ("basePubkey" in params) {
			const type = SYSTEM_INSTRUCTION_LAYOUTS.AssignWithSeed;
			data = encodeData(type, {
				base: toBuffer(params.basePubkey.toBuffer()),
				seed: params.seed,
				programId: toBuffer(params.programId.toBuffer())
			});
			keys = [{
				pubkey: params.accountPubkey,
				isSigner: false,
				isWritable: true
			}, {
				pubkey: params.basePubkey,
				isSigner: true,
				isWritable: false
			}];
		} else {
			const type = SYSTEM_INSTRUCTION_LAYOUTS.Assign;
			data = encodeData(type, { programId: toBuffer(params.programId.toBuffer()) });
			keys = [{
				pubkey: params.accountPubkey,
				isSigner: true,
				isWritable: true
			}];
		}
		return new TransactionInstruction({
			keys,
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction instruction that creates a new account at
	*   an address generated with `from`, a seed, and programId
	*/
	static createAccountWithSeed(params) {
		const type = SYSTEM_INSTRUCTION_LAYOUTS.CreateWithSeed;
		const data = encodeData(type, {
			base: toBuffer(params.basePubkey.toBuffer()),
			seed: params.seed,
			lamports: params.lamports,
			space: params.space,
			programId: toBuffer(params.programId.toBuffer())
		});
		let keys = [{
			pubkey: params.fromPubkey,
			isSigner: true,
			isWritable: true
		}, {
			pubkey: params.newAccountPubkey,
			isSigner: false,
			isWritable: true
		}];
		if (!params.basePubkey.equals(params.fromPubkey)) keys.push({
			pubkey: params.basePubkey,
			isSigner: true,
			isWritable: false
		});
		return new TransactionInstruction({
			keys,
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction that creates a new Nonce account
	*/
	static createNonceAccount(params) {
		const transaction = new Transaction();
		if ("basePubkey" in params && "seed" in params) transaction.add(SystemProgram.createAccountWithSeed({
			fromPubkey: params.fromPubkey,
			newAccountPubkey: params.noncePubkey,
			basePubkey: params.basePubkey,
			seed: params.seed,
			lamports: params.lamports,
			space: NONCE_ACCOUNT_LENGTH,
			programId: this.programId
		}));
		else transaction.add(SystemProgram.createAccount({
			fromPubkey: params.fromPubkey,
			newAccountPubkey: params.noncePubkey,
			lamports: params.lamports,
			space: NONCE_ACCOUNT_LENGTH,
			programId: this.programId
		}));
		const initParams = {
			noncePubkey: params.noncePubkey,
			authorizedPubkey: params.authorizedPubkey
		};
		transaction.add(this.nonceInitialize(initParams));
		return transaction;
	}
	/**
	* Generate an instruction to initialize a Nonce account
	*/
	static nonceInitialize(params) {
		const type = SYSTEM_INSTRUCTION_LAYOUTS.InitializeNonceAccount;
		const data = encodeData(type, { authorized: toBuffer(params.authorizedPubkey.toBuffer()) });
		return new TransactionInstruction({
			keys: [
				{
					pubkey: params.noncePubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: SYSVAR_RENT_PUBKEY,
					isSigner: false,
					isWritable: false
				}
			],
			programId: this.programId,
			data
		});
	}
	/**
	* Generate an instruction to advance the nonce in a Nonce account
	*/
	static nonceAdvance(params) {
		const type = SYSTEM_INSTRUCTION_LAYOUTS.AdvanceNonceAccount;
		const data = encodeData(type);
		return new TransactionInstruction({
			keys: [
				{
					pubkey: params.noncePubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: params.authorizedPubkey,
					isSigner: true,
					isWritable: false
				}
			],
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction instruction that withdraws lamports from a Nonce account
	*/
	static nonceWithdraw(params) {
		const type = SYSTEM_INSTRUCTION_LAYOUTS.WithdrawNonceAccount;
		const data = encodeData(type, { lamports: params.lamports });
		return new TransactionInstruction({
			keys: [
				{
					pubkey: params.noncePubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: params.toPubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: SYSVAR_RECENT_BLOCKHASHES_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: SYSVAR_RENT_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: params.authorizedPubkey,
					isSigner: true,
					isWritable: false
				}
			],
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction instruction that authorizes a new PublicKey as the authority
	* on a Nonce account.
	*/
	static nonceAuthorize(params) {
		const type = SYSTEM_INSTRUCTION_LAYOUTS.AuthorizeNonceAccount;
		const data = encodeData(type, { authorized: toBuffer(params.newAuthorizedPubkey.toBuffer()) });
		return new TransactionInstruction({
			keys: [{
				pubkey: params.noncePubkey,
				isSigner: false,
				isWritable: true
			}, {
				pubkey: params.authorizedPubkey,
				isSigner: true,
				isWritable: false
			}],
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction instruction that allocates space in an account without funding
	*/
	static allocate(params) {
		let data;
		let keys;
		if ("basePubkey" in params) {
			const type = SYSTEM_INSTRUCTION_LAYOUTS.AllocateWithSeed;
			data = encodeData(type, {
				base: toBuffer(params.basePubkey.toBuffer()),
				seed: params.seed,
				space: params.space,
				programId: toBuffer(params.programId.toBuffer())
			});
			keys = [{
				pubkey: params.accountPubkey,
				isSigner: false,
				isWritable: true
			}, {
				pubkey: params.basePubkey,
				isSigner: true,
				isWritable: false
			}];
		} else {
			const type = SYSTEM_INSTRUCTION_LAYOUTS.Allocate;
			data = encodeData(type, { space: params.space });
			keys = [{
				pubkey: params.accountPubkey,
				isSigner: true,
				isWritable: true
			}];
		}
		return new TransactionInstruction({
			keys,
			programId: this.programId,
			data
		});
	}
};
SystemProgram.programId = new PublicKey("11111111111111111111111111111111");
var CHUNK_SIZE = 932;
/**
* Program loader interface
*/
var Loader = class Loader {
	/**
	* @internal
	*/
	constructor() {}
	/**
	* Amount of program data placed in each load Transaction
	*/
	/**
	* Minimum number of signatures required to load a program not including
	* retries
	*
	* Can be used to calculate transaction fees
	*/
	static getMinNumSignatures(dataLength) {
		return 2 * (Math.ceil(dataLength / Loader.chunkSize) + 1 + 1);
	}
	/**
	* Loads a generic program
	*
	* @param connection The connection to use
	* @param payer System account that pays to load the program
	* @param program Account to load the program into
	* @param programId Public key that identifies the loader
	* @param data Program octets
	* @return true if program was loaded successfully, false if program was already loaded
	*/
	static async load(connection, payer, program, programId, data) {
		{
			const balanceNeeded = await connection.getMinimumBalanceForRentExemption(data.length);
			const programInfo = await connection.getAccountInfo(program.publicKey, "confirmed");
			let transaction = null;
			if (programInfo !== null) {
				if (programInfo.executable) {
					console.error("Program load failed, account is already executable");
					return false;
				}
				if (programInfo.data.length !== data.length) {
					transaction = transaction || new Transaction();
					transaction.add(SystemProgram.allocate({
						accountPubkey: program.publicKey,
						space: data.length
					}));
				}
				if (!programInfo.owner.equals(programId)) {
					transaction = transaction || new Transaction();
					transaction.add(SystemProgram.assign({
						accountPubkey: program.publicKey,
						programId
					}));
				}
				if (programInfo.lamports < balanceNeeded) {
					transaction = transaction || new Transaction();
					transaction.add(SystemProgram.transfer({
						fromPubkey: payer.publicKey,
						toPubkey: program.publicKey,
						lamports: balanceNeeded - programInfo.lamports
					}));
				}
			} else transaction = new Transaction().add(SystemProgram.createAccount({
				fromPubkey: payer.publicKey,
				newAccountPubkey: program.publicKey,
				lamports: balanceNeeded > 0 ? balanceNeeded : 1,
				space: data.length,
				programId
			}));
			if (transaction !== null) await sendAndConfirmTransaction(connection, transaction, [payer, program], { commitment: "confirmed" });
		}
		const dataLayout = import_Layout.struct([
			import_Layout.u32("instruction"),
			import_Layout.u32("offset"),
			import_Layout.u32("bytesLength"),
			import_Layout.u32("bytesLengthPadding"),
			import_Layout.seq(import_Layout.u8("byte"), import_Layout.offset(import_Layout.u32(), -8), "bytes")
		]);
		const chunkSize = Loader.chunkSize;
		let offset = 0;
		let array = data;
		let transactions = [];
		while (array.length > 0) {
			const bytes = array.slice(0, chunkSize);
			const data = Buffer$1.alloc(chunkSize + 16);
			dataLayout.encode({
				instruction: 0,
				offset,
				bytes,
				bytesLength: 0,
				bytesLengthPadding: 0
			}, data);
			const transaction = new Transaction().add({
				keys: [{
					pubkey: program.publicKey,
					isSigner: true,
					isWritable: true
				}],
				programId,
				data
			});
			transactions.push(sendAndConfirmTransaction(connection, transaction, [payer, program], { commitment: "confirmed" }));
			if (connection._rpcEndpoint.includes("solana.com")) await sleep(250);
			offset += chunkSize;
			array = array.slice(chunkSize);
		}
		await Promise.all(transactions);
		{
			const dataLayout = import_Layout.struct([import_Layout.u32("instruction")]);
			const data = Buffer$1.alloc(dataLayout.span);
			dataLayout.encode({ instruction: 1 }, data);
			const transaction = new Transaction().add({
				keys: [{
					pubkey: program.publicKey,
					isSigner: true,
					isWritable: true
				}, {
					pubkey: SYSVAR_RENT_PUBKEY,
					isSigner: false,
					isWritable: false
				}],
				programId,
				data
			});
			const deployCommitment = "processed";
			const finalizeSignature = await connection.sendTransaction(transaction, [payer, program], { preflightCommitment: deployCommitment });
			const { context, value } = await connection.confirmTransaction({
				signature: finalizeSignature,
				lastValidBlockHeight: transaction.lastValidBlockHeight,
				blockhash: transaction.recentBlockhash
			}, deployCommitment);
			if (value.err) throw new Error(`Transaction ${finalizeSignature} failed (${JSON.stringify(value)})`);
			while (true) {
				try {
					if (await connection.getSlot({ commitment: deployCommitment }) > context.slot) break;
				} catch {}
				await new Promise((resolve) => setTimeout(resolve, Math.round(MS_PER_SLOT / 2)));
			}
		}
		return true;
	}
};
Loader.chunkSize = CHUNK_SIZE;
new PublicKey("BPFLoader2111111111111111111111111111111111");
function getDefaultExportFromCjs(x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var agentkeepalive = { exports: {} };
/**
* Helpers.
*/
var ms;
var hasRequiredMs;
function requireMs() {
	if (hasRequiredMs) return ms;
	hasRequiredMs = 1;
	var s = 1e3;
	var m = s * 60;
	var h = m * 60;
	var d = h * 24;
	var w = d * 7;
	var y = d * 365.25;
	/**
	* Parse or format the given `val`.
	*
	* Options:
	*
	*  - `long` verbose formatting [false]
	*
	* @param {String|Number} val
	* @param {Object} [options]
	* @throws {Error} throw an error if val is not a non-empty string or a number
	* @return {String|Number}
	* @api public
	*/
	ms = function(val, options) {
		options = options || {};
		var type = typeof val;
		if (type === "string" && val.length > 0) return parse(val);
		else if (type === "number" && isFinite(val)) return options.long ? fmtLong(val) : fmtShort(val);
		throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
	};
	/**
	* Parse the given `str` and return milliseconds.
	*
	* @param {String} str
	* @return {Number}
	* @api private
	*/
	function parse(str) {
		str = String(str);
		if (str.length > 100) return;
		var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
		if (!match) return;
		var n = parseFloat(match[1]);
		switch ((match[2] || "ms").toLowerCase()) {
			case "years":
			case "year":
			case "yrs":
			case "yr":
			case "y": return n * y;
			case "weeks":
			case "week":
			case "w": return n * w;
			case "days":
			case "day":
			case "d": return n * d;
			case "hours":
			case "hour":
			case "hrs":
			case "hr":
			case "h": return n * h;
			case "minutes":
			case "minute":
			case "mins":
			case "min":
			case "m": return n * m;
			case "seconds":
			case "second":
			case "secs":
			case "sec":
			case "s": return n * s;
			case "milliseconds":
			case "millisecond":
			case "msecs":
			case "msec":
			case "ms": return n;
			default: return;
		}
	}
	/**
	* Short format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtShort(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return Math.round(ms / d) + "d";
		if (msAbs >= h) return Math.round(ms / h) + "h";
		if (msAbs >= m) return Math.round(ms / m) + "m";
		if (msAbs >= s) return Math.round(ms / s) + "s";
		return ms + "ms";
	}
	/**
	* Long format for `ms`.
	*
	* @param {Number} ms
	* @return {String}
	* @api private
	*/
	function fmtLong(ms) {
		var msAbs = Math.abs(ms);
		if (msAbs >= d) return plural(ms, msAbs, d, "day");
		if (msAbs >= h) return plural(ms, msAbs, h, "hour");
		if (msAbs >= m) return plural(ms, msAbs, m, "minute");
		if (msAbs >= s) return plural(ms, msAbs, s, "second");
		return ms + " ms";
	}
	/**
	* Pluralization helper.
	*/
	function plural(ms, msAbs, n, name) {
		var isPlural = msAbs >= n * 1.5;
		return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
	}
	return ms;
}
/*!
* humanize-ms - index.js
* Copyright(c) 2014 dead_horse <dead_horse@qq.com>
* MIT Licensed
*/
var humanizeMs;
var hasRequiredHumanizeMs;
function requireHumanizeMs() {
	if (hasRequiredHumanizeMs) return humanizeMs;
	hasRequiredHumanizeMs = 1;
	/**
	* Module dependencies.
	*/
	var util = require$$0;
	var ms = /*@__PURE__*/ requireMs();
	humanizeMs = function(t) {
		if (typeof t === "number") return t;
		var r = ms(t);
		if (r === void 0) {
			var err = new Error(util.format("humanize-ms(%j) result undefined", t));
			console.warn(err.stack);
		}
		return r;
	};
	return humanizeMs;
}
var constants;
var hasRequiredConstants;
function requireConstants() {
	if (hasRequiredConstants) return constants;
	hasRequiredConstants = 1;
	constants = {
		CURRENT_ID: Symbol("agentkeepalive#currentId"),
		CREATE_ID: Symbol("agentkeepalive#createId"),
		INIT_SOCKET: Symbol("agentkeepalive#initSocket"),
		CREATE_HTTPS_CONNECTION: Symbol("agentkeepalive#createHttpsConnection"),
		SOCKET_CREATED_TIME: Symbol("agentkeepalive#socketCreatedTime"),
		SOCKET_NAME: Symbol("agentkeepalive#socketName"),
		SOCKET_REQUEST_COUNT: Symbol("agentkeepalive#socketRequestCount"),
		SOCKET_REQUEST_FINISHED_COUNT: Symbol("agentkeepalive#socketRequestFinishedCount")
	};
	return constants;
}
var agent;
var hasRequiredAgent;
function requireAgent() {
	if (hasRequiredAgent) return agent;
	hasRequiredAgent = 1;
	const OriginalAgent = http.Agent;
	const ms = /*@__PURE__*/ requireHumanizeMs();
	const debug = require$$0.debuglog("agentkeepalive");
	const { INIT_SOCKET, CURRENT_ID, CREATE_ID, SOCKET_CREATED_TIME, SOCKET_NAME, SOCKET_REQUEST_COUNT, SOCKET_REQUEST_FINISHED_COUNT } = /*@__PURE__*/ requireConstants();
	let defaultTimeoutListenerCount = 1;
	const majorVersion = parseInt(process.version.split(".", 1)[0].substring(1));
	if (majorVersion >= 11 && majorVersion <= 12) defaultTimeoutListenerCount = 2;
	else if (majorVersion >= 13) defaultTimeoutListenerCount = 3;
	function deprecate(message) {
		console.log("[agentkeepalive:deprecated] %s", message);
	}
	class Agent extends OriginalAgent {
		constructor(options) {
			options = options || {};
			options.keepAlive = options.keepAlive !== false;
			if (options.freeSocketTimeout === void 0) options.freeSocketTimeout = 4e3;
			if (options.keepAliveTimeout) {
				deprecate("options.keepAliveTimeout is deprecated, please use options.freeSocketTimeout instead");
				options.freeSocketTimeout = options.keepAliveTimeout;
				delete options.keepAliveTimeout;
			}
			if (options.freeSocketKeepAliveTimeout) {
				deprecate("options.freeSocketKeepAliveTimeout is deprecated, please use options.freeSocketTimeout instead");
				options.freeSocketTimeout = options.freeSocketKeepAliveTimeout;
				delete options.freeSocketKeepAliveTimeout;
			}
			if (options.timeout === void 0) options.timeout = Math.max(options.freeSocketTimeout * 2, 8e3);
			options.timeout = ms(options.timeout);
			options.freeSocketTimeout = ms(options.freeSocketTimeout);
			options.socketActiveTTL = options.socketActiveTTL ? ms(options.socketActiveTTL) : 0;
			super(options);
			this[CURRENT_ID] = 0;
			this.createSocketCount = 0;
			this.createSocketCountLastCheck = 0;
			this.createSocketErrorCount = 0;
			this.createSocketErrorCountLastCheck = 0;
			this.closeSocketCount = 0;
			this.closeSocketCountLastCheck = 0;
			this.errorSocketCount = 0;
			this.errorSocketCountLastCheck = 0;
			this.requestCount = 0;
			this.requestCountLastCheck = 0;
			this.timeoutSocketCount = 0;
			this.timeoutSocketCountLastCheck = 0;
			this.on("free", (socket) => {
				const timeout = this.calcSocketTimeout(socket);
				if (timeout > 0 && socket.timeout !== timeout) socket.setTimeout(timeout);
			});
		}
		get freeSocketKeepAliveTimeout() {
			deprecate("agent.freeSocketKeepAliveTimeout is deprecated, please use agent.options.freeSocketTimeout instead");
			return this.options.freeSocketTimeout;
		}
		get timeout() {
			deprecate("agent.timeout is deprecated, please use agent.options.timeout instead");
			return this.options.timeout;
		}
		get socketActiveTTL() {
			deprecate("agent.socketActiveTTL is deprecated, please use agent.options.socketActiveTTL instead");
			return this.options.socketActiveTTL;
		}
		calcSocketTimeout(socket) {
			/**
			* return <= 0: should free socket
			* return > 0: should update socket timeout
			* return undefined: not find custom timeout
			*/
			let freeSocketTimeout = this.options.freeSocketTimeout;
			const socketActiveTTL = this.options.socketActiveTTL;
			if (socketActiveTTL) {
				const diff = socketActiveTTL - (Date.now() - socket[SOCKET_CREATED_TIME]);
				if (diff <= 0) return diff;
				if (freeSocketTimeout && diff < freeSocketTimeout) freeSocketTimeout = diff;
			}
			if (freeSocketTimeout) return socket.freeSocketTimeout || socket.freeSocketKeepAliveTimeout || freeSocketTimeout;
		}
		keepSocketAlive(socket) {
			const result = super.keepSocketAlive(socket);
			if (!result) return result;
			const customTimeout = this.calcSocketTimeout(socket);
			if (typeof customTimeout === "undefined") return true;
			if (customTimeout <= 0) {
				debug("%s(requests: %s, finished: %s) free but need to destroy by TTL, request count %s, diff is %s", socket[SOCKET_NAME], socket[SOCKET_REQUEST_COUNT], socket[SOCKET_REQUEST_FINISHED_COUNT], customTimeout);
				return false;
			}
			if (socket.timeout !== customTimeout) socket.setTimeout(customTimeout);
			return true;
		}
		reuseSocket(...args) {
			super.reuseSocket(...args);
			const socket = args[0];
			const req = args[1];
			req.reusedSocket = true;
			const agentTimeout = this.options.timeout;
			if (getSocketTimeout(socket) !== agentTimeout) {
				socket.setTimeout(agentTimeout);
				debug("%s reset timeout to %sms", socket[SOCKET_NAME], agentTimeout);
			}
			socket[SOCKET_REQUEST_COUNT]++;
			debug("%s(requests: %s, finished: %s) reuse on addRequest, timeout %sms", socket[SOCKET_NAME], socket[SOCKET_REQUEST_COUNT], socket[SOCKET_REQUEST_FINISHED_COUNT], getSocketTimeout(socket));
		}
		[CREATE_ID]() {
			const id = this[CURRENT_ID]++;
			if (this[CURRENT_ID] === Number.MAX_SAFE_INTEGER) this[CURRENT_ID] = 0;
			return id;
		}
		[INIT_SOCKET](socket, options) {
			if (options.timeout) {
				if (!getSocketTimeout(socket)) socket.setTimeout(options.timeout);
			}
			if (this.options.keepAlive) socket.setNoDelay(true);
			this.createSocketCount++;
			if (this.options.socketActiveTTL) socket[SOCKET_CREATED_TIME] = Date.now();
			socket[SOCKET_NAME] = `sock[${this[CREATE_ID]()}#${options._agentKey}]`.split("-----BEGIN", 1)[0];
			socket[SOCKET_REQUEST_COUNT] = 1;
			socket[SOCKET_REQUEST_FINISHED_COUNT] = 0;
			installListeners(this, socket, options);
		}
		createConnection(options, oncreate) {
			let called = false;
			const onNewCreate = (err, socket) => {
				if (called) return;
				called = true;
				if (err) {
					this.createSocketErrorCount++;
					return oncreate(err);
				}
				this[INIT_SOCKET](socket, options);
				oncreate(err, socket);
			};
			const newSocket = super.createConnection(options, onNewCreate);
			if (newSocket) onNewCreate(null, newSocket);
			return newSocket;
		}
		get statusChanged() {
			const changed = this.createSocketCount !== this.createSocketCountLastCheck || this.createSocketErrorCount !== this.createSocketErrorCountLastCheck || this.closeSocketCount !== this.closeSocketCountLastCheck || this.errorSocketCount !== this.errorSocketCountLastCheck || this.timeoutSocketCount !== this.timeoutSocketCountLastCheck || this.requestCount !== this.requestCountLastCheck;
			if (changed) {
				this.createSocketCountLastCheck = this.createSocketCount;
				this.createSocketErrorCountLastCheck = this.createSocketErrorCount;
				this.closeSocketCountLastCheck = this.closeSocketCount;
				this.errorSocketCountLastCheck = this.errorSocketCount;
				this.timeoutSocketCountLastCheck = this.timeoutSocketCount;
				this.requestCountLastCheck = this.requestCount;
			}
			return changed;
		}
		getCurrentStatus() {
			return {
				createSocketCount: this.createSocketCount,
				createSocketErrorCount: this.createSocketErrorCount,
				closeSocketCount: this.closeSocketCount,
				errorSocketCount: this.errorSocketCount,
				timeoutSocketCount: this.timeoutSocketCount,
				requestCount: this.requestCount,
				freeSockets: inspect(this.freeSockets),
				sockets: inspect(this.sockets),
				requests: inspect(this.requests)
			};
		}
	}
	function getSocketTimeout(socket) {
		return socket.timeout || socket._idleTimeout;
	}
	function installListeners(agent, socket, options) {
		debug("%s create, timeout %sms", socket[SOCKET_NAME], getSocketTimeout(socket));
		function onFree() {
			if (!socket._httpMessage && socket[SOCKET_REQUEST_COUNT] === 1) return;
			socket[SOCKET_REQUEST_FINISHED_COUNT]++;
			agent.requestCount++;
			debug("%s(requests: %s, finished: %s) free", socket[SOCKET_NAME], socket[SOCKET_REQUEST_COUNT], socket[SOCKET_REQUEST_FINISHED_COUNT]);
			const name = agent.getName(options);
			if (socket.writable && agent.requests[name] && agent.requests[name].length) {
				socket[SOCKET_REQUEST_COUNT]++;
				debug("%s(requests: %s, finished: %s) will be reuse on agent free event", socket[SOCKET_NAME], socket[SOCKET_REQUEST_COUNT], socket[SOCKET_REQUEST_FINISHED_COUNT]);
			}
		}
		socket.on("free", onFree);
		function onClose(isError) {
			debug("%s(requests: %s, finished: %s) close, isError: %s", socket[SOCKET_NAME], socket[SOCKET_REQUEST_COUNT], socket[SOCKET_REQUEST_FINISHED_COUNT], isError);
			agent.closeSocketCount++;
		}
		socket.on("close", onClose);
		function onTimeout() {
			const listenerCount = socket.listeners("timeout").length;
			const timeout = getSocketTimeout(socket);
			const req = socket._httpMessage;
			const reqTimeoutListenerCount = req && req.listeners("timeout").length || 0;
			debug("%s(requests: %s, finished: %s) timeout after %sms, listeners %s, defaultTimeoutListenerCount %s, hasHttpRequest %s, HttpRequest timeoutListenerCount %s", socket[SOCKET_NAME], socket[SOCKET_REQUEST_COUNT], socket[SOCKET_REQUEST_FINISHED_COUNT], timeout, listenerCount, defaultTimeoutListenerCount, !!req, reqTimeoutListenerCount);
			if (debug.enabled) debug("timeout listeners: %s", socket.listeners("timeout").map((f) => f.name).join(", "));
			agent.timeoutSocketCount++;
			const name = agent.getName(options);
			if (agent.freeSockets[name] && agent.freeSockets[name].indexOf(socket) !== -1) {
				socket.destroy();
				agent.removeSocket(socket, options);
				debug("%s is free, destroy quietly", socket[SOCKET_NAME]);
			} else if (reqTimeoutListenerCount === 0) {
				const error = /* @__PURE__ */ new Error("Socket timeout");
				error.code = "ERR_SOCKET_TIMEOUT";
				error.timeout = timeout;
				socket.destroy(error);
				agent.removeSocket(socket, options);
				debug("%s destroy with timeout error", socket[SOCKET_NAME]);
			}
		}
		socket.on("timeout", onTimeout);
		function onError(err) {
			const listenerCount = socket.listeners("error").length;
			debug("%s(requests: %s, finished: %s) error: %s, listenerCount: %s", socket[SOCKET_NAME], socket[SOCKET_REQUEST_COUNT], socket[SOCKET_REQUEST_FINISHED_COUNT], err, listenerCount);
			agent.errorSocketCount++;
			if (listenerCount === 1) {
				debug("%s emit uncaught error event", socket[SOCKET_NAME]);
				socket.removeListener("error", onError);
				socket.emit("error", err);
			}
		}
		socket.on("error", onError);
		function onRemove() {
			debug("%s(requests: %s, finished: %s) agentRemove", socket[SOCKET_NAME], socket[SOCKET_REQUEST_COUNT], socket[SOCKET_REQUEST_FINISHED_COUNT]);
			socket.removeListener("close", onClose);
			socket.removeListener("error", onError);
			socket.removeListener("free", onFree);
			socket.removeListener("timeout", onTimeout);
			socket.removeListener("agentRemove", onRemove);
		}
		socket.on("agentRemove", onRemove);
	}
	agent = Agent;
	function inspect(obj) {
		const res = {};
		for (const key in obj) res[key] = obj[key].length;
		return res;
	}
	return agent;
}
var https_agent;
var hasRequiredHttps_agent;
function requireHttps_agent() {
	if (hasRequiredHttps_agent) return https_agent;
	hasRequiredHttps_agent = 1;
	const OriginalHttpsAgent = https.Agent;
	const HttpAgent = /*@__PURE__*/ requireAgent();
	const { INIT_SOCKET, CREATE_HTTPS_CONNECTION } = /*@__PURE__*/ requireConstants();
	class HttpsAgent extends HttpAgent {
		constructor(options) {
			super(options);
			this.defaultPort = 443;
			this.protocol = "https:";
			this.maxCachedSessions = this.options.maxCachedSessions;
			/* istanbul ignore next */
			if (this.maxCachedSessions === void 0) this.maxCachedSessions = 100;
			this._sessionCache = {
				map: {},
				list: []
			};
		}
		createConnection(options, oncreate) {
			const socket = this[CREATE_HTTPS_CONNECTION](options, oncreate);
			this[INIT_SOCKET](socket, options);
			return socket;
		}
	}
	HttpsAgent.prototype[CREATE_HTTPS_CONNECTION] = OriginalHttpsAgent.prototype.createConnection;
	[
		"getName",
		"_getSession",
		"_cacheSession",
		"_evictSession"
	].forEach(function(method) {
		/* istanbul ignore next */
		if (typeof OriginalHttpsAgent.prototype[method] === "function") HttpsAgent.prototype[method] = OriginalHttpsAgent.prototype[method];
	});
	https_agent = HttpsAgent;
	return https_agent;
}
var hasRequiredAgentkeepalive;
function requireAgentkeepalive() {
	if (hasRequiredAgentkeepalive) return agentkeepalive.exports;
	hasRequiredAgentkeepalive = 1;
	const HttpAgent = /*@__PURE__*/ requireAgent();
	agentkeepalive.exports = HttpAgent;
	agentkeepalive.exports.HttpAgent = HttpAgent;
	agentkeepalive.exports.HttpsAgent = /*@__PURE__*/ requireHttps_agent();
	agentkeepalive.exports.constants = /*@__PURE__*/ requireConstants();
	return agentkeepalive.exports;
}
var agentkeepaliveExports = /*@__PURE__*/ requireAgentkeepalive();
var HttpKeepAliveAgent = /*@__PURE__*/ getDefaultExportFromCjs(agentkeepaliveExports);
var fastStableStringify$1;
var hasRequiredFastStableStringify;
function requireFastStableStringify() {
	if (hasRequiredFastStableStringify) return fastStableStringify$1;
	hasRequiredFastStableStringify = 1;
	var objToString = Object.prototype.toString;
	var objKeys = Object.keys || function(obj) {
		var keys = [];
		for (var name in obj) keys.push(name);
		return keys;
	};
	function stringify(val, isArrayProp) {
		var i, max, str, keys, key, propVal, toStr;
		if (val === true) return "true";
		if (val === false) return "false";
		switch (typeof val) {
			case "object": if (val === null) return null;
			else if (val.toJSON && typeof val.toJSON === "function") return stringify(val.toJSON(), isArrayProp);
			else {
				toStr = objToString.call(val);
				if (toStr === "[object Array]") {
					str = "[";
					max = val.length - 1;
					for (i = 0; i < max; i++) str += stringify(val[i], true) + ",";
					if (max > -1) str += stringify(val[i], true);
					return str + "]";
				} else if (toStr === "[object Object]") {
					keys = objKeys(val).sort();
					max = keys.length;
					str = "";
					i = 0;
					while (i < max) {
						key = keys[i];
						propVal = stringify(val[key], false);
						if (propVal !== void 0) {
							if (str) str += ",";
							str += JSON.stringify(key) + ":" + propVal;
						}
						i++;
					}
					return "{" + str + "}";
				} else return JSON.stringify(val);
			}
			case "function":
			case "undefined": return isArrayProp ? null : void 0;
			case "string": return JSON.stringify(val);
			default: return isFinite(val) ? val : null;
		}
	}
	fastStableStringify$1 = function(val) {
		var returnVal = stringify(val, false);
		if (returnVal !== void 0) return "" + returnVal;
	};
	return fastStableStringify$1;
}
var fastStableStringify = /*@__PURE__*/ getDefaultExportFromCjs(/* @__PURE__ */ requireFastStableStringify());
var MINIMUM_SLOT_PER_EPOCH = 32;
function trailingZeros(n) {
	let trailingZeros = 0;
	while (n > 1) {
		n /= 2;
		trailingZeros++;
	}
	return trailingZeros;
}
function nextPowerOfTwo(n) {
	if (n === 0) return 1;
	n--;
	n |= n >> 1;
	n |= n >> 2;
	n |= n >> 4;
	n |= n >> 8;
	n |= n >> 16;
	n |= n >> 32;
	return n + 1;
}
/**
* Epoch schedule
* (see https://docs.solana.com/terminology#epoch)
* Can be retrieved with the {@link Connection.getEpochSchedule} method
*/
var EpochSchedule = class {
	constructor(slotsPerEpoch, leaderScheduleSlotOffset, warmup, firstNormalEpoch, firstNormalSlot) {
		/** The maximum number of slots in each epoch */
		this.slotsPerEpoch = void 0;
		/** The number of slots before beginning of an epoch to calculate a leader schedule for that epoch */
		this.leaderScheduleSlotOffset = void 0;
		/** Indicates whether epochs start short and grow */
		this.warmup = void 0;
		/** The first epoch with `slotsPerEpoch` slots */
		this.firstNormalEpoch = void 0;
		/** The first slot of `firstNormalEpoch` */
		this.firstNormalSlot = void 0;
		this.slotsPerEpoch = slotsPerEpoch;
		this.leaderScheduleSlotOffset = leaderScheduleSlotOffset;
		this.warmup = warmup;
		this.firstNormalEpoch = firstNormalEpoch;
		this.firstNormalSlot = firstNormalSlot;
	}
	getEpoch(slot) {
		return this.getEpochAndSlotIndex(slot)[0];
	}
	getEpochAndSlotIndex(slot) {
		if (slot < this.firstNormalSlot) {
			const epoch = trailingZeros(nextPowerOfTwo(slot + MINIMUM_SLOT_PER_EPOCH + 1)) - trailingZeros(MINIMUM_SLOT_PER_EPOCH) - 1;
			return [epoch, slot - (this.getSlotsInEpoch(epoch) - MINIMUM_SLOT_PER_EPOCH)];
		} else {
			const normalSlotIndex = slot - this.firstNormalSlot;
			const normalEpochIndex = Math.floor(normalSlotIndex / this.slotsPerEpoch);
			return [this.firstNormalEpoch + normalEpochIndex, normalSlotIndex % this.slotsPerEpoch];
		}
	}
	getFirstSlotInEpoch(epoch) {
		if (epoch <= this.firstNormalEpoch) return (Math.pow(2, epoch) - 1) * MINIMUM_SLOT_PER_EPOCH;
		else return (epoch - this.firstNormalEpoch) * this.slotsPerEpoch + this.firstNormalSlot;
	}
	getLastSlotInEpoch(epoch) {
		return this.getFirstSlotInEpoch(epoch) + this.getSlotsInEpoch(epoch) - 1;
	}
	getSlotsInEpoch(epoch) {
		if (epoch < this.firstNormalEpoch) return Math.pow(2, epoch + trailingZeros(MINIMUM_SLOT_PER_EPOCH));
		else return this.slotsPerEpoch;
	}
};
var fetchImpl = typeof globalThis.fetch === "function" ? globalThis.fetch : async function(input, init) {
	return await fetch(typeof input === "string" && input.slice(0, 2) === "//" ? "https:" + input : input, init);
};
var RpcWebSocketClient = class extends CommonClient {
	constructor(address, options, generate_request_id) {
		const webSocketFactory = (url) => {
			const rpc = WebSocket(url, {
				autoconnect: true,
				max_reconnects: 5,
				reconnect: true,
				reconnect_interval: 1e3,
				...options
			});
			if ("socket" in rpc) this.underlyingSocket = rpc.socket;
			else this.underlyingSocket = rpc;
			return rpc;
		};
		super(webSocketFactory, address, options, generate_request_id);
		this.underlyingSocket = void 0;
	}
	call(...args) {
		const readyState = this.underlyingSocket?.readyState;
		if (readyState === 1) return super.call(...args);
		return Promise.reject(/* @__PURE__ */ new Error("Tried to call a JSON-RPC method `" + args[0] + "` but the socket was not `CONNECTING` or `OPEN` (`readyState` was " + readyState + ")"));
	}
	notify(...args) {
		const readyState = this.underlyingSocket?.readyState;
		if (readyState === 1) return super.notify(...args);
		return Promise.reject(/* @__PURE__ */ new Error("Tried to send a JSON-RPC notification `" + args[0] + "` but the socket was not `CONNECTING` or `OPEN` (`readyState` was " + readyState + ")"));
	}
};
/**
* @internal
*/
/**
* Decode account data buffer using an AccountType
* @internal
*/
function decodeData(type, data) {
	let decoded;
	try {
		decoded = type.layout.decode(data);
	} catch (err) {
		throw new Error("invalid instruction; " + err);
	}
	if (decoded.typeIndex !== type.index) throw new Error(`invalid account data; account type mismatch ${decoded.typeIndex} != ${type.index}`);
	return decoded;
}
var LOOKUP_TABLE_META_SIZE = 56;
var AddressLookupTableAccount = class {
	constructor(args) {
		this.key = void 0;
		this.state = void 0;
		this.key = args.key;
		this.state = args.state;
	}
	isActive() {
		const U64_MAX = BigInt("0xffffffffffffffff");
		return this.state.deactivationSlot === U64_MAX;
	}
	static deserialize(accountData) {
		const meta = decodeData(LookupTableMetaLayout, accountData);
		const serializedAddressesLen = accountData.length - LOOKUP_TABLE_META_SIZE;
		assert(serializedAddressesLen >= 0, "lookup table is invalid");
		assert(serializedAddressesLen % 32 === 0, "lookup table is invalid");
		const numSerializedAddresses = serializedAddressesLen / 32;
		const { addresses } = import_Layout.struct([import_Layout.seq(publicKey(), numSerializedAddresses, "addresses")]).decode(accountData.slice(LOOKUP_TABLE_META_SIZE));
		return {
			deactivationSlot: meta.deactivationSlot,
			lastExtendedSlot: meta.lastExtendedSlot,
			lastExtendedSlotStartIndex: meta.lastExtendedStartIndex,
			authority: meta.authority.length !== 0 ? new PublicKey(meta.authority[0]) : void 0,
			addresses: addresses.map((address) => new PublicKey(address))
		};
	}
};
var LookupTableMetaLayout = {
	index: 1,
	layout: import_Layout.struct([
		import_Layout.u32("typeIndex"),
		u64("deactivationSlot"),
		import_Layout.nu64("lastExtendedSlot"),
		import_Layout.u8("lastExtendedStartIndex"),
		import_Layout.u8(),
		import_Layout.seq(publicKey(), import_Layout.offset(import_Layout.u8(), -1), "authority")
	])
};
var URL_RE = /^[^:]+:\/\/([^:[]+|\[[^\]]+\])(:\d+)?(.*)/i;
function makeWebsocketUrl(endpoint) {
	const matches = endpoint.match(URL_RE);
	if (matches == null) throw TypeError(`Failed to validate endpoint URL \`${endpoint}\``);
	const [_, hostish, portWithColon, rest] = matches;
	const protocol = endpoint.startsWith("https:") ? "wss:" : "ws:";
	const startPort = portWithColon == null ? null : parseInt(portWithColon.slice(1), 10);
	return `${protocol}//${hostish}${startPort == null ? "" : `:${startPort + 1}`}${rest}`;
}
var PublicKeyFromString = coerce(instance(PublicKey), string(), (value) => new PublicKey(value));
var RawAccountDataResult = tuple([string(), literal("base64")]);
var BufferFromRawAccountData = coerce(instance(Buffer$1), RawAccountDataResult, (value) => Buffer$1.from(value[0], "base64"));
/**
* Attempt to use a recent blockhash for up to 30 seconds
* @internal
*/
var BLOCKHASH_CACHE_TIMEOUT_MS = 3e4;
/**
* HACK.
* Copied from rpc-websockets/dist/lib/client.
* Otherwise, `yarn build` fails with:
* https://gist.github.com/steveluscher/c057eca81d479ef705cdb53162f9971d
*/
/** @internal */
/** @internal */
/** @internal */
/** @internal */
/** @internal */
/**
* @internal
* Every subscription contains the args used to open the subscription with
* the server, and a list of callers interested in notifications.
*/
/**
* @internal
* A subscription may be in various states of connectedness. Only when it is
* fully connected will it have a server subscription id associated with it.
* This id can be returned to the server to unsubscribe the client entirely.
*/
/**
* A type that encapsulates a subscription's RPC method
* names and notification (callback) signature.
*/
/**
* @internal
* Utility type that keeps tagged unions intact while omitting properties.
*/
/**
* @internal
* This type represents a single subscribable 'topic.' It's made up of:
*
* - The args used to open the subscription with the server,
* - The state of the subscription, in terms of its connectedness, and
* - The set of callbacks to call when the server publishes notifications
*
* This record gets indexed by `SubscriptionConfigHash` and is used to
* set up subscriptions, fan out notifications, and track subscription state.
*/
/**
* @internal
*/
/**
* Extra contextual information for RPC responses
*/
/**
* Options for sending transactions
*/
/**
* Options for confirming transactions
*/
/**
* Options for getConfirmedSignaturesForAddress2
*/
/**
* Options for getSignaturesForAddress
*/
/**
* RPC Response with extra contextual information
*/
/**
* A strategy for confirming transactions that uses the last valid
* block height for a given blockhash to check for transaction expiration.
*/
/**
* A strategy for confirming durable nonce transactions.
*/
/**
* Properties shared by all transaction confirmation strategies
*/
/**
* This type represents all transaction confirmation strategies
*/
function assertEndpointUrl(putativeUrl) {
	if (/^https?:/.test(putativeUrl) === false) throw new TypeError("Endpoint URL must start with `http:` or `https:`.");
	return putativeUrl;
}
/** @internal */
function extractCommitmentFromConfig(commitmentOrConfig) {
	let commitment;
	let config;
	if (typeof commitmentOrConfig === "string") commitment = commitmentOrConfig;
	else if (commitmentOrConfig) {
		const { commitment: specifiedCommitment, ...specifiedConfig } = commitmentOrConfig;
		commitment = specifiedCommitment;
		config = specifiedConfig;
	}
	return {
		commitment,
		config
	};
}
/**
* @internal
*/
function applyDefaultMemcmpEncodingToFilters(filters) {
	return filters.map((filter) => "memcmp" in filter ? {
		...filter,
		memcmp: {
			...filter.memcmp,
			encoding: filter.memcmp.encoding ?? "base58"
		}
	} : filter);
}
/**
* @internal
*/
function createRpcResult(result) {
	return union([type({
		jsonrpc: literal("2.0"),
		id: string(),
		result
	}), type({
		jsonrpc: literal("2.0"),
		id: string(),
		error: type({
			code: unknown(),
			message: string(),
			data: optional(any())
		})
	})]);
}
var UnknownRpcResult = createRpcResult(unknown());
/**
* @internal
*/
function jsonRpcResult(schema) {
	return coerce(createRpcResult(schema), UnknownRpcResult, (value) => {
		if ("error" in value) return value;
		else return {
			...value,
			result: create(value.result, schema)
		};
	});
}
/**
* @internal
*/
function jsonRpcResultAndContext(value) {
	return jsonRpcResult(type({
		context: type({ slot: number() }),
		value
	}));
}
/**
* @internal
*/
function notificationResultAndContext(value) {
	return type({
		context: type({ slot: number() }),
		value
	});
}
/**
* @internal
*/
function versionedMessageFromResponse(version, response) {
	if (version === 0) return new MessageV0({
		header: response.header,
		staticAccountKeys: response.accountKeys.map((accountKey) => new PublicKey(accountKey)),
		recentBlockhash: response.recentBlockhash,
		compiledInstructions: response.instructions.map((ix) => ({
			programIdIndex: ix.programIdIndex,
			accountKeyIndexes: ix.accounts,
			data: import_bs58.default.decode(ix.data)
		})),
		addressTableLookups: response.addressTableLookups
	});
	else if (version === 1) {
		const transactionConfig = response.transactionConfig;
		if (transactionConfig == null) throw new Error("Expected a version 1 transaction message response to have a `transactionConfig`");
		return new MessageV1({
			header: response.header,
			staticAccountKeys: response.accountKeys.map((accountKey) => new PublicKey(accountKey)),
			recentBlockhash: response.recentBlockhash,
			compiledInstructions: response.instructions.map((ix) => ({
				programIdIndex: ix.programIdIndex,
				accountKeyIndexes: ix.accounts,
				data: import_bs58.default.decode(ix.data)
			})),
			transactionConfig
		});
	} else return new Message(response);
}
/**
* The level of commitment desired when querying state
* <pre>
*   'processed': Query the most recent block which has reached 1 confirmation by the connected node
*   'confirmed': Query the most recent block which has reached 1 confirmation by the cluster
*   'finalized': Query the most recent block which has been finalized by the cluster
* </pre>
*/
/**
* A subset of Commitment levels, which are at least optimistically confirmed
* <pre>
*   'confirmed': Query the most recent block which has reached 1 confirmation by the cluster
*   'finalized': Query the most recent block which has been finalized by the cluster
* </pre>
*/
/**
* Filter for largest accounts query
* <pre>
*   'circulating':    Return the largest accounts that are part of the circulating supply
*   'nonCirculating': Return the largest accounts that are not part of the circulating supply
* </pre>
*/
/**
* Configuration object for changing `getAccountInfo` query behavior
*/
/**
* Configuration object for changing `getBalance` query behavior
*/
/**
* Configuration object for changing `getBlock` query behavior
*/
/**
* Configuration object for changing `getBlock` query behavior
*/
/**
* Configuration object for changing `getStakeMinimumDelegation` query behavior
*/
/**
* Configuration object for changing `getBlockHeight` query behavior
*/
/**
* Configuration object for changing `getEpochInfo` query behavior
*/
/**
* Configuration object for changing `getInflationReward` query behavior
*/
/**
* Configuration object for changing `getLatestBlockhash` query behavior
*/
/**
* Configuration object for changing `isBlockhashValid` query behavior
*/
/**
* Configuration object for changing `getSlot` query behavior
*/
/**
* Configuration object for changing `getSlotLeader` query behavior
*/
/**
* Configuration object for changing `getTransaction` query behavior
*/
/**
* Configuration object for changing `getTransaction` query behavior
*/
/**
* Configuration object for changing `getLargestAccounts` query behavior
*/
/**
* Configuration object for changing `getSupply` request behavior
*/
/**
* Configuration object for changing query behavior
*/
/**
* Information describing a cluster node
*/
/**
* Information describing a vote account
*/
/**
* A collection of cluster vote accounts
*/
/**
* Network Inflation
* (see https://docs.solana.com/implemented-proposals/ed_overview)
*/
var GetInflationGovernorResult = type({
	foundation: number(),
	foundationTerm: number(),
	initial: number(),
	taper: number(),
	terminal: number()
});
/**
* The inflation reward for an epoch
*/
/**
* Expected JSON RPC response for the "getInflationReward" message
*/
var GetInflationRewardResult = jsonRpcResult(array(nullable(type({
	epoch: number(),
	effectiveSlot: number(),
	amount: number(),
	postBalance: number(),
	commission: optional(nullable(number()))
}))));
/**
* Configuration object for changing `getRecentPrioritizationFees` query behavior
*/
/**
* Expected JSON RPC response for the "getRecentPrioritizationFees" message
*/
var GetRecentPrioritizationFeesResult = array(type({
	slot: number(),
	prioritizationFee: number()
}));
/**
* Expected JSON RPC response for the "getInflationRate" message
*/
var GetInflationRateResult = type({
	total: number(),
	validator: number(),
	foundation: number(),
	epoch: number()
});
/**
* Information about the current epoch
*/
var GetEpochInfoResult = type({
	epoch: number(),
	slotIndex: number(),
	slotsInEpoch: number(),
	absoluteSlot: number(),
	blockHeight: optional(number()),
	transactionCount: optional(number())
});
var GetEpochScheduleResult = type({
	slotsPerEpoch: number(),
	leaderScheduleSlotOffset: number(),
	warmup: boolean(),
	firstNormalEpoch: number(),
	firstNormalSlot: number()
});
/**
* Leader schedule
* (see https://docs.solana.com/terminology#leader-schedule)
*/
var GetLeaderScheduleResult = record(string(), array(number()));
/**
* Transaction error or null
*/
var TransactionErrorResult = nullable(union([type({}), string()]));
/**
* Signature status for a transaction
*/
var SignatureStatusResult = type({ err: TransactionErrorResult });
/**
* Transaction signature received notification
*/
var SignatureReceivedResult = literal("receivedSignature");
/**
* Version info for a node
*/
var VersionResult = type({
	"solana-core": string(),
	"feature-set": optional(number())
});
var ParsedInstructionStruct = type({
	program: string(),
	programId: PublicKeyFromString,
	parsed: unknown()
});
var PartiallyDecodedInstructionStruct = type({
	programId: PublicKeyFromString,
	accounts: array(PublicKeyFromString),
	data: string()
});
var SimulatedTransactionResponseStruct = jsonRpcResultAndContext(type({
	err: nullable(union([type({}), string()])),
	logs: nullable(array(string())),
	accounts: optional(nullable(array(nullable(type({
		executable: boolean(),
		owner: string(),
		lamports: number(),
		data: array(string()),
		rentEpoch: optional(number())
	}))))),
	unitsConsumed: optional(number()),
	returnData: optional(nullable(type({
		programId: string(),
		data: tuple([string(), literal("base64")])
	}))),
	innerInstructions: optional(nullable(array(type({
		index: number(),
		instructions: array(union([ParsedInstructionStruct, PartiallyDecodedInstructionStruct]))
	}))))
}));
/**
* Metadata for a parsed confirmed transaction on the ledger
*
* @deprecated Deprecated since RPC v1.8.0. Please use {@link ParsedTransactionMeta} instead.
*/
/**
* Collection of addresses loaded by a transaction using address table lookups
*/
/**
* Metadata for a parsed transaction on the ledger
*/
/**
* Metadata for a confirmed transaction on the ledger
*/
/**
* A processed transaction from the RPC API
*/
/**
* A processed transaction from the RPC API
*/
/**
* A processed transaction message from the RPC API
*/
/**
* A confirmed transaction on the ledger
*
* @deprecated Deprecated since RPC v1.8.0.
*/
/**
* A partially decoded transaction instruction
*/
/**
* A parsed transaction message account
*/
/**
* A parsed transaction instruction
*/
/**
* A parsed address table lookup
*/
/**
* A parsed transaction message
*/
/**
* A parsed transaction
*/
/**
* A parsed and confirmed transaction on the ledger
*
* @deprecated Deprecated since RPC v1.8.0. Please use {@link ParsedTransactionWithMeta} instead.
*/
/**
* A parsed transaction on the ledger with meta
*/
/**
* A processed block fetched from the RPC API
*/
/**
* A processed block fetched from the RPC API where the `transactionDetails` mode is `accounts`
*/
/**
* A processed block fetched from the RPC API where the `transactionDetails` mode is `none`
*/
/**
* A block with parsed transactions
*/
/**
* A block with parsed transactions where the `transactionDetails` mode is `accounts`
*/
/**
* A block with parsed transactions where the `transactionDetails` mode is `none`
*/
/**
* A processed block fetched from the RPC API
*/
/**
* A processed block fetched from the RPC API where the `transactionDetails` mode is `accounts`
*/
/**
* A processed block fetched from the RPC API where the `transactionDetails` mode is `none`
*/
/**
* A confirmed block on the ledger
*
* @deprecated Deprecated since RPC v1.8.0.
*/
/**
* A Block on the ledger with signatures only
*/
/**
* recent block production information
*/
/**
* Expected JSON RPC response for the "getBlockProduction" message
*/
var BlockProductionResponseStruct = jsonRpcResultAndContext(type({
	byIdentity: record(string(), array(number())),
	range: type({
		firstSlot: number(),
		lastSlot: number()
	})
}));
/**
* A performance sample
*/
function createRpcClient(url, httpHeaders, customFetch, fetchMiddleware, disableRetryOnRateLimit, httpAgent) {
	const fetch = customFetch ? customFetch : fetchImpl;
	let agent;
	if (httpAgent == null) {
		const agentOptions = {
			freeSocketTimeout: 19e3,
			keepAlive: true,
			maxSockets: 25
		};
		if (url.startsWith("https:")) agent = new agentkeepaliveExports.HttpsAgent(agentOptions);
		else agent = new HttpKeepAliveAgent(agentOptions);
	} else if (httpAgent !== false) {
		const isHttps = url.startsWith("https:");
		if (isHttps && !(httpAgent instanceof Agent)) throw new Error("The endpoint `" + url + "` can only be paired with an `https.Agent`. You have, instead, supplied an `http.Agent` through `httpAgent`.");
		else if (!isHttps && httpAgent instanceof Agent) throw new Error("The endpoint `" + url + "` can only be paired with an `http.Agent`. You have, instead, supplied an `https.Agent` through `httpAgent`.");
		agent = httpAgent;
	}
	let fetchWithMiddleware;
	if (fetchMiddleware) fetchWithMiddleware = async (info, init) => {
		const modifiedFetchArgs = await new Promise((resolve, reject) => {
			try {
				fetchMiddleware(info, init, (modifiedInfo, modifiedInit) => resolve([modifiedInfo, modifiedInit]));
			} catch (error) {
				reject(error);
			}
		});
		return await fetch(...modifiedFetchArgs);
	};
	return new import_browser.default(async (request, callback) => {
		const options = {
			method: "POST",
			body: request,
			agent,
			headers: Object.assign({ "Content-Type": "application/json" }, httpHeaders || {}, COMMON_HTTP_HEADERS)
		};
		try {
			let too_many_requests_retries = 5;
			let res;
			let waitTime = 500;
			for (;;) {
				if (fetchWithMiddleware) res = await fetchWithMiddleware(url, options);
				else res = await fetch(url, options);
				if (res.status !== 429) break;
				if (disableRetryOnRateLimit === true) break;
				too_many_requests_retries -= 1;
				if (too_many_requests_retries === 0) break;
				console.error(`Server responded with ${res.status} ${res.statusText}.  Retrying after ${waitTime}ms delay...`);
				await sleep(waitTime);
				waitTime *= 2;
			}
			const text = await res.text();
			if (res.ok) callback(null, text);
			else callback(/* @__PURE__ */ new Error(`${res.status} ${res.statusText}: ${text}`));
		} catch (err) {
			if (err instanceof Error) callback(err);
		}
	}, {});
}
function createRpcRequest(client) {
	return (method, args) => {
		return new Promise((resolve, reject) => {
			client.request(method, args, (err, response) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(response);
			});
		});
	};
}
function createRpcBatchRequest(client) {
	return (requests) => {
		return new Promise((resolve, reject) => {
			if (requests.length === 0) resolve([]);
			const batch = requests.map((params) => {
				return client.request(params.methodName, params.args);
			});
			client.request(batch, (err, response) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(response);
			});
		});
	};
}
/**
* Expected JSON RPC response for the "getInflationGovernor" message
*/
var GetInflationGovernorRpcResult = jsonRpcResult(GetInflationGovernorResult);
/**
* Expected JSON RPC response for the "getInflationRate" message
*/
var GetInflationRateRpcResult = jsonRpcResult(GetInflationRateResult);
/**
* Expected JSON RPC response for the "getRecentPrioritizationFees" message
*/
var GetRecentPrioritizationFeesRpcResult = jsonRpcResult(GetRecentPrioritizationFeesResult);
/**
* Expected JSON RPC response for the "getEpochInfo" message
*/
var GetEpochInfoRpcResult = jsonRpcResult(GetEpochInfoResult);
/**
* Expected JSON RPC response for the "getEpochSchedule" message
*/
var GetEpochScheduleRpcResult = jsonRpcResult(GetEpochScheduleResult);
/**
* Expected JSON RPC response for the "getLeaderSchedule" message
*/
var GetLeaderScheduleRpcResult = jsonRpcResult(GetLeaderScheduleResult);
/**
* Expected JSON RPC response for the "minimumLedgerSlot" and "getFirstAvailableBlock" messages
*/
var SlotRpcResult = jsonRpcResult(number());
/**
* Supply
*/
/**
* Expected JSON RPC response for the "getSupply" message
*/
var GetSupplyRpcResult = jsonRpcResultAndContext(type({
	total: number(),
	circulating: number(),
	nonCirculating: number(),
	nonCirculatingAccounts: array(PublicKeyFromString)
}));
/**
* Token amount object which returns a token amount in different formats
* for various client use cases.
*/
/**
* Expected JSON RPC structure for token amounts
*/
var TokenAmountResult = type({
	amount: string(),
	uiAmount: nullable(number()),
	decimals: number(),
	uiAmountString: optional(string())
});
/**
* Token address and balance.
*/
/**
* Expected JSON RPC response for the "getTokenLargestAccounts" message
*/
var GetTokenLargestAccountsResult = jsonRpcResultAndContext(array(type({
	address: PublicKeyFromString,
	amount: string(),
	uiAmount: nullable(number()),
	decimals: number(),
	uiAmountString: optional(string())
})));
/**
* Expected JSON RPC response for the "getTokenAccountsByOwner" message
*/
var GetTokenAccountsByOwner = jsonRpcResultAndContext(array(type({
	pubkey: PublicKeyFromString,
	account: type({
		executable: boolean(),
		owner: PublicKeyFromString,
		lamports: number(),
		data: BufferFromRawAccountData,
		rentEpoch: number()
	})
})));
var ParsedAccountDataResult = type({
	program: string(),
	parsed: unknown(),
	space: number()
});
/**
* Expected JSON RPC response for the "getTokenAccountsByOwner" message with parsed data
*/
var GetParsedTokenAccountsByOwner = jsonRpcResultAndContext(array(type({
	pubkey: PublicKeyFromString,
	account: type({
		executable: boolean(),
		owner: PublicKeyFromString,
		lamports: number(),
		data: ParsedAccountDataResult,
		rentEpoch: number()
	})
})));
/**
* Pair of an account address and its balance
*/
/**
* Expected JSON RPC response for the "getLargestAccounts" message
*/
var GetLargestAccountsRpcResult = jsonRpcResultAndContext(array(type({
	lamports: number(),
	address: PublicKeyFromString
})));
/**
* @internal
*/
var AccountInfoResult = type({
	executable: boolean(),
	owner: PublicKeyFromString,
	lamports: number(),
	data: BufferFromRawAccountData,
	rentEpoch: number()
});
/**
* @internal
*/
var KeyedAccountInfoResult = type({
	pubkey: PublicKeyFromString,
	account: AccountInfoResult
});
var ParsedOrRawAccountData = coerce(union([instance(Buffer$1), ParsedAccountDataResult]), union([RawAccountDataResult, ParsedAccountDataResult]), (value) => {
	if (Array.isArray(value)) return create(value, BufferFromRawAccountData);
	else return value;
});
/**
* @internal
*/
var ParsedAccountInfoResult = type({
	executable: boolean(),
	owner: PublicKeyFromString,
	lamports: number(),
	data: ParsedOrRawAccountData,
	rentEpoch: number()
});
var KeyedParsedAccountInfoResult = type({
	pubkey: PublicKeyFromString,
	account: ParsedAccountInfoResult
});
/**
* @internal
*/
var StakeActivationResult = type({
	state: union([
		literal("active"),
		literal("inactive"),
		literal("activating"),
		literal("deactivating")
	]),
	active: number(),
	inactive: number()
});
/**
* Expected JSON RPC response for the "getConfirmedSignaturesForAddress2" message
*/
var GetConfirmedSignaturesForAddress2RpcResult = jsonRpcResult(array(type({
	signature: string(),
	slot: number(),
	err: TransactionErrorResult,
	memo: nullable(string()),
	blockTime: optional(nullable(number()))
})));
/**
* Expected JSON RPC response for the "getSignaturesForAddress" message
*/
var GetSignaturesForAddressRpcResult = jsonRpcResult(array(type({
	signature: string(),
	slot: number(),
	err: TransactionErrorResult,
	memo: nullable(string()),
	blockTime: optional(nullable(number()))
})));
/***
* Expected JSON RPC response for the "accountNotification" message
*/
var AccountNotificationResult = type({
	subscription: number(),
	result: notificationResultAndContext(AccountInfoResult)
});
/**
* @internal
*/
var ProgramAccountInfoResult = type({
	pubkey: PublicKeyFromString,
	account: AccountInfoResult
});
/***
* Expected JSON RPC response for the "programNotification" message
*/
var ProgramAccountNotificationResult = type({
	subscription: number(),
	result: notificationResultAndContext(ProgramAccountInfoResult)
});
/**
* @internal
*/
var SlotInfoResult = type({
	parent: number(),
	slot: number(),
	root: number()
});
/**
* Expected JSON RPC response for the "slotNotification" message
*/
var SlotNotificationResult = type({
	subscription: number(),
	result: SlotInfoResult
});
/**
* Slot updates which can be used for tracking the live progress of a cluster.
* - `"firstShredReceived"`: connected node received the first shred of a block.
* Indicates that a new block that is being produced.
* - `"completed"`: connected node has received all shreds of a block. Indicates
* a block was recently produced.
* - `"optimisticConfirmation"`: block was optimistically confirmed by the
* cluster. It is not guaranteed that an optimistic confirmation notification
* will be sent for every finalized blocks.
* - `"root"`: the connected node rooted this block.
* - `"createdBank"`: the connected node has started validating this block.
* - `"frozen"`: the connected node has validated this block.
* - `"dead"`: the connected node failed to validate this block.
*/
/**
* @internal
*/
var SlotUpdateResult = union([
	type({
		type: union([
			literal("firstShredReceived"),
			literal("completed"),
			literal("optimisticConfirmation"),
			literal("root")
		]),
		slot: number(),
		timestamp: number()
	}),
	type({
		type: literal("createdBank"),
		parent: number(),
		slot: number(),
		timestamp: number()
	}),
	type({
		type: literal("frozen"),
		slot: number(),
		timestamp: number(),
		stats: type({
			numTransactionEntries: number(),
			numSuccessfulTransactions: number(),
			numFailedTransactions: number(),
			maxTransactionsPerEntry: number()
		})
	}),
	type({
		type: literal("dead"),
		slot: number(),
		timestamp: number(),
		err: string()
	})
]);
/**
* Expected JSON RPC response for the "slotsUpdatesNotification" message
*/
var SlotUpdateNotificationResult = type({
	subscription: number(),
	result: SlotUpdateResult
});
/**
* Expected JSON RPC response for the "signatureNotification" message
*/
var SignatureNotificationResult = type({
	subscription: number(),
	result: notificationResultAndContext(union([SignatureStatusResult, SignatureReceivedResult]))
});
/**
* Expected JSON RPC response for the "rootNotification" message
*/
var RootNotificationResult = type({
	subscription: number(),
	result: number()
});
var ContactInfoResult = type({
	pubkey: string(),
	gossip: nullable(string()),
	tpu: nullable(string()),
	rpc: nullable(string()),
	version: nullable(string())
});
var VoteAccountInfoResult = type({
	votePubkey: string(),
	nodePubkey: string(),
	activatedStake: number(),
	epochVoteAccount: boolean(),
	epochCredits: array(tuple([
		number(),
		number(),
		number()
	])),
	commission: number(),
	lastVote: number(),
	rootSlot: nullable(number())
});
/**
* Expected JSON RPC response for the "getVoteAccounts" message
*/
var GetVoteAccounts = jsonRpcResult(type({
	current: array(VoteAccountInfoResult),
	delinquent: array(VoteAccountInfoResult)
}));
var ConfirmationStatus = union([
	literal("processed"),
	literal("confirmed"),
	literal("finalized")
]);
/**
* Expected JSON RPC response for the "getSignatureStatuses" message
*/
var GetSignatureStatusesRpcResult = jsonRpcResultAndContext(array(nullable(type({
	slot: number(),
	confirmations: nullable(number()),
	err: TransactionErrorResult,
	confirmationStatus: optional(ConfirmationStatus)
}))));
/**
* Expected JSON RPC response for the "getMinimumBalanceForRentExemption" message
*/
var GetMinimumBalanceForRentExemptionRpcResult = jsonRpcResult(number());
var AddressTableLookupStruct = type({
	accountKey: PublicKeyFromString,
	writableIndexes: array(number()),
	readonlyIndexes: array(number())
});
var TransactionConfigResult = type({
	computeUnitLimit: nullable(number()),
	heapSize: nullable(number()),
	loadedAccountsDataSizeLimit: nullable(number()),
	priorityFee: nullable(number())
});
var ConfirmedTransactionResult = type({
	signatures: array(string()),
	message: type({
		accountKeys: array(string()),
		header: type({
			numRequiredSignatures: number(),
			numReadonlySignedAccounts: number(),
			numReadonlyUnsignedAccounts: number()
		}),
		instructions: array(type({
			accounts: array(number()),
			data: string(),
			programIdIndex: number()
		})),
		recentBlockhash: string(),
		addressTableLookups: optional(array(AddressTableLookupStruct)),
		transactionConfig: optional(nullable(TransactionConfigResult))
	})
});
var AnnotatedAccountKey = type({
	pubkey: PublicKeyFromString,
	signer: boolean(),
	writable: boolean(),
	source: optional(union([literal("transaction"), literal("lookupTable")]))
});
var ConfirmedTransactionAccountsModeResult = type({
	accountKeys: array(AnnotatedAccountKey),
	signatures: array(string())
});
var ParsedInstructionResult = type({
	parsed: unknown(),
	program: string(),
	programId: PublicKeyFromString
});
var RawInstructionResult = type({
	accounts: array(PublicKeyFromString),
	data: string(),
	programId: PublicKeyFromString
});
var ParsedOrRawInstruction = coerce(union([RawInstructionResult, ParsedInstructionResult]), union([type({
	parsed: unknown(),
	program: string(),
	programId: string()
}), type({
	accounts: array(string()),
	data: string(),
	programId: string()
})]), (value) => {
	if ("accounts" in value) return create(value, RawInstructionResult);
	else return create(value, ParsedInstructionResult);
});
/**
* @internal
*/
var ParsedConfirmedTransactionResult = type({
	signatures: array(string()),
	message: type({
		accountKeys: array(AnnotatedAccountKey),
		instructions: array(ParsedOrRawInstruction),
		recentBlockhash: string(),
		addressTableLookups: optional(nullable(array(AddressTableLookupStruct))),
		transactionConfig: optional(nullable(TransactionConfigResult))
	})
});
var TokenBalanceResult = type({
	accountIndex: number(),
	mint: string(),
	owner: optional(string()),
	programId: optional(string()),
	uiTokenAmount: TokenAmountResult
});
var LoadedAddressesResult = type({
	writable: array(PublicKeyFromString),
	readonly: array(PublicKeyFromString)
});
/**
* @internal
*/
var ConfirmedTransactionMetaResult = type({
	err: TransactionErrorResult,
	fee: number(),
	innerInstructions: optional(nullable(array(type({
		index: number(),
		instructions: array(type({
			accounts: array(number()),
			data: string(),
			programIdIndex: number()
		}))
	})))),
	preBalances: array(number()),
	postBalances: array(number()),
	logMessages: optional(nullable(array(string()))),
	preTokenBalances: optional(nullable(array(TokenBalanceResult))),
	postTokenBalances: optional(nullable(array(TokenBalanceResult))),
	loadedAddresses: optional(LoadedAddressesResult),
	computeUnitsConsumed: optional(number()),
	costUnits: optional(number())
});
/**
* @internal
*/
var ParsedConfirmedTransactionMetaResult = type({
	err: TransactionErrorResult,
	fee: number(),
	innerInstructions: optional(nullable(array(type({
		index: number(),
		instructions: array(ParsedOrRawInstruction)
	})))),
	preBalances: array(number()),
	postBalances: array(number()),
	logMessages: optional(nullable(array(string()))),
	preTokenBalances: optional(nullable(array(TokenBalanceResult))),
	postTokenBalances: optional(nullable(array(TokenBalanceResult))),
	loadedAddresses: optional(LoadedAddressesResult),
	computeUnitsConsumed: optional(number()),
	costUnits: optional(number())
});
var TransactionVersionStruct = union([
	literal(0),
	literal(1),
	literal("legacy")
]);
/** @internal */
var RewardsResult = type({
	pubkey: string(),
	lamports: number(),
	postBalance: nullable(number()),
	rewardType: nullable(string()),
	commission: optional(nullable(number()))
});
/**
* Expected JSON RPC response for the "getBlock" message
*/
var GetBlockRpcResult = jsonRpcResult(nullable(type({
	blockhash: string(),
	previousBlockhash: string(),
	parentSlot: number(),
	transactions: array(type({
		transaction: ConfirmedTransactionResult,
		meta: nullable(ConfirmedTransactionMetaResult),
		version: optional(TransactionVersionStruct)
	})),
	rewards: optional(array(RewardsResult)),
	blockTime: nullable(number()),
	blockHeight: nullable(number())
})));
/**
* Expected JSON RPC response for the "getBlock" message when `transactionDetails` is `none`
*/
var GetNoneModeBlockRpcResult = jsonRpcResult(nullable(type({
	blockhash: string(),
	previousBlockhash: string(),
	parentSlot: number(),
	rewards: optional(array(RewardsResult)),
	blockTime: nullable(number()),
	blockHeight: nullable(number())
})));
/**
* Expected JSON RPC response for the "getBlock" message when `transactionDetails` is `accounts`
*/
var GetAccountsModeBlockRpcResult = jsonRpcResult(nullable(type({
	blockhash: string(),
	previousBlockhash: string(),
	parentSlot: number(),
	transactions: array(type({
		transaction: ConfirmedTransactionAccountsModeResult,
		meta: nullable(ConfirmedTransactionMetaResult),
		version: optional(TransactionVersionStruct)
	})),
	rewards: optional(array(RewardsResult)),
	blockTime: nullable(number()),
	blockHeight: nullable(number())
})));
/**
* Expected parsed JSON RPC response for the "getBlock" message
*/
var GetParsedBlockRpcResult = jsonRpcResult(nullable(type({
	blockhash: string(),
	previousBlockhash: string(),
	parentSlot: number(),
	transactions: array(type({
		transaction: ParsedConfirmedTransactionResult,
		meta: nullable(ParsedConfirmedTransactionMetaResult),
		version: optional(TransactionVersionStruct)
	})),
	rewards: optional(array(RewardsResult)),
	blockTime: nullable(number()),
	blockHeight: nullable(number())
})));
/**
* Expected parsed JSON RPC response for the "getBlock" message  when `transactionDetails` is `accounts`
*/
var GetParsedAccountsModeBlockRpcResult = jsonRpcResult(nullable(type({
	blockhash: string(),
	previousBlockhash: string(),
	parentSlot: number(),
	transactions: array(type({
		transaction: ConfirmedTransactionAccountsModeResult,
		meta: nullable(ParsedConfirmedTransactionMetaResult),
		version: optional(TransactionVersionStruct)
	})),
	rewards: optional(array(RewardsResult)),
	blockTime: nullable(number()),
	blockHeight: nullable(number())
})));
/**
* Expected parsed JSON RPC response for the "getBlock" message  when `transactionDetails` is `none`
*/
var GetParsedNoneModeBlockRpcResult = jsonRpcResult(nullable(type({
	blockhash: string(),
	previousBlockhash: string(),
	parentSlot: number(),
	rewards: optional(array(RewardsResult)),
	blockTime: nullable(number()),
	blockHeight: nullable(number())
})));
/**
* Expected JSON RPC response for the "getConfirmedBlock" message
*
* @deprecated Deprecated since RPC v1.8.0. Please use {@link GetBlockRpcResult} instead.
*/
var GetConfirmedBlockRpcResult = jsonRpcResult(nullable(type({
	blockhash: string(),
	previousBlockhash: string(),
	parentSlot: number(),
	transactions: array(type({
		transaction: ConfirmedTransactionResult,
		meta: nullable(ConfirmedTransactionMetaResult)
	})),
	rewards: optional(array(RewardsResult)),
	blockTime: nullable(number())
})));
/**
* Expected JSON RPC response for the "getBlock" message
*/
var GetBlockSignaturesRpcResult = jsonRpcResult(nullable(type({
	blockhash: string(),
	previousBlockhash: string(),
	parentSlot: number(),
	signatures: array(string()),
	blockTime: nullable(number())
})));
/**
* Expected JSON RPC response for the "getTransaction" message
*/
var GetTransactionRpcResult = jsonRpcResult(nullable(type({
	slot: number(),
	meta: nullable(ConfirmedTransactionMetaResult),
	blockTime: optional(nullable(number())),
	transaction: ConfirmedTransactionResult,
	version: optional(TransactionVersionStruct)
})));
/**
* Expected parsed JSON RPC response for the "getTransaction" message
*/
var GetParsedTransactionRpcResult = jsonRpcResult(nullable(type({
	slot: number(),
	transaction: ParsedConfirmedTransactionResult,
	meta: nullable(ParsedConfirmedTransactionMetaResult),
	blockTime: optional(nullable(number())),
	version: optional(TransactionVersionStruct)
})));
/**
* Expected JSON RPC response for the "getLatestBlockhash" message
*/
var GetLatestBlockhashRpcResult = jsonRpcResultAndContext(type({
	blockhash: string(),
	lastValidBlockHeight: number()
}));
/**
* Expected JSON RPC response for the "isBlockhashValid" message
*/
var IsBlockhashValidRpcResult = jsonRpcResultAndContext(boolean());
var GetRecentPerformanceSamplesRpcResult = jsonRpcResult(array(type({
	slot: number(),
	numTransactions: number(),
	numSlots: number(),
	samplePeriodSecs: number()
})));
/**
* Expected JSON RPC response for the "getFeeCalculatorForBlockhash" message
*/
var GetFeeCalculatorRpcResult = jsonRpcResultAndContext(nullable(type({ feeCalculator: type({ lamportsPerSignature: number() }) })));
/**
* Expected JSON RPC response for the "requestAirdrop" message
*/
var RequestAirdropRpcResult = jsonRpcResult(string());
/**
* Expected JSON RPC response for the "sendTransaction" message
*/
var SendTransactionRpcResult = jsonRpcResult(string());
/**
* Logs result.
*/
/**
* Expected JSON RPC response for the "logsNotification" message.
*/
var LogsNotificationResult = type({
	result: notificationResultAndContext(type({
		err: TransactionErrorResult,
		logs: array(string()),
		signature: string()
	})),
	subscription: number()
});
/**
* Filter for log subscriptions.
*/
/**
* Callback function for log notifications.
*/
/**
* Signature result
*/
/**
* Transaction error
*/
/**
* Transaction confirmation status
* <pre>
*   'processed': Transaction landed in a block which has reached 1 confirmation by the connected node
*   'confirmed': Transaction landed in a block which has reached 1 confirmation by the cluster
*   'finalized': Transaction landed in a block which has been finalized by the cluster
* </pre>
*/
/**
* Signature status
*/
/**
* A confirmed signature with its status
*/
/**
* An object defining headers to be passed to the RPC server
*/
/**
* The type of the JavaScript `fetch()` API
*/
/**
* A callback used to augment the outgoing HTTP request
*/
/**
* Configuration for instantiating a Connection
*/
/** @internal */
var COMMON_HTTP_HEADERS = { "solana-client": `js/1.99.0` };
/**
* A connection to a fullnode JSON RPC endpoint
*/
var Connection = class {
	/**
	* Establish a JSON RPC connection
	*
	* @param endpoint URL to the fullnode JSON RPC endpoint
	* @param commitmentOrConfig optional default commitment level or optional ConnectionConfig configuration object
	*/
	constructor(endpoint, _commitmentOrConfig) {
		/** @internal */
		this._commitment = void 0;
		/** @internal */
		this._confirmTransactionInitialTimeout = void 0;
		/** @internal */
		this._rpcEndpoint = void 0;
		/** @internal */
		this._rpcWsEndpoint = void 0;
		/** @internal */
		this._rpcClient = void 0;
		/** @internal */
		this._rpcRequest = void 0;
		/** @internal */
		this._rpcBatchRequest = void 0;
		/** @internal */
		this._rpcWebSocket = void 0;
		/** @internal */
		this._rpcWebSocketConnected = false;
		/** @internal */
		this._rpcWebSocketHeartbeat = null;
		/** @internal */
		this._rpcWebSocketIdleTimeout = null;
		/** @internal
		* A number that we increment every time an active connection closes.
		* Used to determine whether the same socket connection that was open
		* when an async operation started is the same one that's active when
		* its continuation fires.
		*
		*/
		this._rpcWebSocketGeneration = 0;
		/** @internal */
		this._disableBlockhashCaching = false;
		/** @internal */
		this._pollingBlockhash = false;
		/** @internal */
		this._blockhashInfo = {
			latestBlockhash: null,
			lastFetch: 0,
			transactionSignatures: [],
			simulatedSignatures: []
		};
		/** @internal */
		this._nextClientSubscriptionId = 0;
		/** @internal */
		this._subscriptionDisposeFunctionsByClientSubscriptionId = {};
		/** @internal */
		this._subscriptionHashByClientSubscriptionId = {};
		/** @internal */
		this._subscriptionStateChangeCallbacksByHash = {};
		/** @internal */
		this._subscriptionCallbacksByServerSubscriptionId = {};
		/** @internal */
		this._subscriptionsByHash = {};
		/**
		* Special case.
		* After a signature is processed, RPCs automatically dispose of the
		* subscription on the server side. We need to track which of these
		* subscriptions have been disposed in such a way, so that we know
		* whether the client is dealing with a not-yet-processed signature
		* (in which case we must tear down the server subscription) or an
		* already-processed signature (in which case the client can simply
		* clear out the subscription locally without telling the server).
		*
		* NOTE: There is a proposal to eliminate this special case, here:
		* https://github.com/solana-labs/solana/issues/18892
		*/
		/** @internal */
		this._subscriptionsAutoDisposedByRpc = /* @__PURE__ */ new Set();
		this.getBlockHeight = (() => {
			const requestPromises = {};
			return async (commitmentOrConfig) => {
				const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
				const args = this._buildArgs([], commitment, void 0, config);
				const requestHash = fastStableStringify(args);
				requestPromises[requestHash] = requestPromises[requestHash] ?? (async () => {
					try {
						const res = create(await this._rpcRequest("getBlockHeight", args), jsonRpcResult(number()));
						if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get block height information");
						return res.result;
					} finally {
						delete requestPromises[requestHash];
					}
				})();
				return await requestPromises[requestHash];
			};
		})();
		let wsEndpoint;
		let httpHeaders;
		let fetch;
		let fetchMiddleware;
		let disableRetryOnRateLimit;
		let httpAgent;
		if (_commitmentOrConfig && typeof _commitmentOrConfig === "string") this._commitment = _commitmentOrConfig;
		else if (_commitmentOrConfig) {
			this._commitment = _commitmentOrConfig.commitment;
			this._confirmTransactionInitialTimeout = _commitmentOrConfig.confirmTransactionInitialTimeout;
			wsEndpoint = _commitmentOrConfig.wsEndpoint;
			httpHeaders = _commitmentOrConfig.httpHeaders;
			fetch = _commitmentOrConfig.fetch;
			fetchMiddleware = _commitmentOrConfig.fetchMiddleware;
			disableRetryOnRateLimit = _commitmentOrConfig.disableRetryOnRateLimit;
			httpAgent = _commitmentOrConfig.httpAgent;
		}
		this._rpcEndpoint = assertEndpointUrl(endpoint);
		this._rpcWsEndpoint = wsEndpoint || makeWebsocketUrl(endpoint);
		this._rpcClient = createRpcClient(endpoint, httpHeaders, fetch, fetchMiddleware, disableRetryOnRateLimit, httpAgent);
		this._rpcRequest = createRpcRequest(this._rpcClient);
		this._rpcBatchRequest = createRpcBatchRequest(this._rpcClient);
		this._rpcWebSocket = new RpcWebSocketClient(this._rpcWsEndpoint, {
			autoconnect: false,
			max_reconnects: Infinity
		});
		this._rpcWebSocket.on("open", this._wsOnOpen.bind(this));
		this._rpcWebSocket.on("error", this._wsOnError.bind(this));
		this._rpcWebSocket.on("close", this._wsOnClose.bind(this));
		this._rpcWebSocket.on("accountNotification", this._wsOnAccountNotification.bind(this));
		this._rpcWebSocket.on("programNotification", this._wsOnProgramAccountNotification.bind(this));
		this._rpcWebSocket.on("slotNotification", this._wsOnSlotNotification.bind(this));
		this._rpcWebSocket.on("slotsUpdatesNotification", this._wsOnSlotUpdatesNotification.bind(this));
		this._rpcWebSocket.on("signatureNotification", this._wsOnSignatureNotification.bind(this));
		this._rpcWebSocket.on("rootNotification", this._wsOnRootNotification.bind(this));
		this._rpcWebSocket.on("logsNotification", this._wsOnLogsNotification.bind(this));
	}
	/**
	* The default commitment used for requests
	*/
	get commitment() {
		return this._commitment;
	}
	/**
	* The RPC endpoint
	*/
	get rpcEndpoint() {
		return this._rpcEndpoint;
	}
	/**
	* Fetch the balance for the specified public key, return with context
	*/
	async getBalanceAndContext(publicKey, commitmentOrConfig) {
		/** @internal */
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([publicKey.toBase58()], commitment, void 0, config);
		const res = create(await this._rpcRequest("getBalance", args), jsonRpcResultAndContext(number()));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get balance for ${publicKey.toBase58()}`);
		return res.result;
	}
	/**
	* Fetch the balance for the specified public key
	*/
	async getBalance(publicKey, commitmentOrConfig) {
		return await this.getBalanceAndContext(publicKey, commitmentOrConfig).then((x) => x.value).catch((e) => {
			throw new Error("failed to get balance of account " + publicKey.toBase58() + ": " + e);
		});
	}
	/**
	* Fetch the estimated production time of a block
	*/
	async getBlockTime(slot) {
		const res = create(await this._rpcRequest("getBlockTime", [slot]), jsonRpcResult(nullable(number())));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get block time for slot ${slot}`);
		return res.result;
	}
	/**
	* Fetch the lowest slot that the node has information about in its ledger.
	* This value may increase over time if the node is configured to purge older ledger data
	*/
	async getMinimumLedgerSlot() {
		const res = create(await this._rpcRequest("minimumLedgerSlot", []), jsonRpcResult(number()));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get minimum ledger slot");
		return res.result;
	}
	/**
	* Fetch the slot of the lowest confirmed block that has not been purged from the ledger
	*/
	async getFirstAvailableBlock() {
		const res = create(await this._rpcRequest("getFirstAvailableBlock", []), SlotRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get first available block");
		return res.result;
	}
	/**
	* Fetch information about the current supply
	*/
	async getSupply(config) {
		let configArg = {};
		if (typeof config === "string") configArg = { commitment: config };
		else if (config) configArg = {
			...config,
			commitment: config && config.commitment || this.commitment
		};
		else configArg = { commitment: this.commitment };
		const res = create(await this._rpcRequest("getSupply", [configArg]), GetSupplyRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get supply");
		return res.result;
	}
	/**
	* Fetch the current supply of a token mint
	*/
	async getTokenSupply(tokenMintAddress, commitment) {
		const args = this._buildArgs([tokenMintAddress.toBase58()], commitment);
		const res = create(await this._rpcRequest("getTokenSupply", args), jsonRpcResultAndContext(TokenAmountResult));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get token supply");
		return res.result;
	}
	/**
	* Fetch the current balance of a token account
	*/
	async getTokenAccountBalance(tokenAddress, commitment) {
		const args = this._buildArgs([tokenAddress.toBase58()], commitment);
		const res = create(await this._rpcRequest("getTokenAccountBalance", args), jsonRpcResultAndContext(TokenAmountResult));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get token account balance");
		return res.result;
	}
	/**
	* Fetch all the token accounts owned by the specified account
	*
	* @return {Promise<RpcResponseAndContext<GetProgramAccountsResponse>}
	*/
	async getTokenAccountsByOwner(ownerAddress, filter, commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		let _args = [ownerAddress.toBase58()];
		if ("mint" in filter) _args.push({ mint: filter.mint.toBase58() });
		else _args.push({ programId: filter.programId.toBase58() });
		const args = this._buildArgs(_args, commitment, "base64", config);
		const res = create(await this._rpcRequest("getTokenAccountsByOwner", args), GetTokenAccountsByOwner);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get token accounts owned by account ${ownerAddress.toBase58()}`);
		return res.result;
	}
	/**
	* Fetch parsed token accounts owned by the specified account
	*
	* @return {Promise<RpcResponseAndContext<Array<{pubkey: PublicKey, account: AccountInfo<ParsedAccountData>}>>>}
	*/
	async getParsedTokenAccountsByOwner(ownerAddress, filter, commitment) {
		let _args = [ownerAddress.toBase58()];
		if ("mint" in filter) _args.push({ mint: filter.mint.toBase58() });
		else _args.push({ programId: filter.programId.toBase58() });
		const args = this._buildArgs(_args, commitment, "jsonParsed");
		const res = create(await this._rpcRequest("getTokenAccountsByOwner", args), GetParsedTokenAccountsByOwner);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get token accounts owned by account ${ownerAddress.toBase58()}`);
		return res.result;
	}
	/**
	* Fetch the 20 largest accounts with their current balances
	*/
	async getLargestAccounts(config) {
		const arg = {
			...config,
			commitment: config && config.commitment || this.commitment
		};
		const args = arg.filter || arg.commitment ? [arg] : [];
		const res = create(await this._rpcRequest("getLargestAccounts", args), GetLargestAccountsRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get largest accounts");
		return res.result;
	}
	/**
	* Fetch the 20 largest token accounts with their current balances
	* for a given mint.
	*/
	async getTokenLargestAccounts(mintAddress, commitment) {
		const args = this._buildArgs([mintAddress.toBase58()], commitment);
		const res = create(await this._rpcRequest("getTokenLargestAccounts", args), GetTokenLargestAccountsResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get token largest accounts");
		return res.result;
	}
	/**
	* Fetch all the account info for the specified public key, return with context
	*/
	async getAccountInfoAndContext(publicKey, commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([publicKey.toBase58()], commitment, "base64", config);
		const res = create(await this._rpcRequest("getAccountInfo", args), jsonRpcResultAndContext(nullable(AccountInfoResult)));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get info about account ${publicKey.toBase58()}`);
		return res.result;
	}
	/**
	* Fetch parsed account info for the specified public key
	*/
	async getParsedAccountInfo(publicKey, commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([publicKey.toBase58()], commitment, "jsonParsed", config);
		const res = create(await this._rpcRequest("getAccountInfo", args), jsonRpcResultAndContext(nullable(ParsedAccountInfoResult)));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get info about account ${publicKey.toBase58()}`);
		return res.result;
	}
	/**
	* Fetch all the account info for the specified public key
	*/
	async getAccountInfo(publicKey, commitmentOrConfig) {
		try {
			return (await this.getAccountInfoAndContext(publicKey, commitmentOrConfig)).value;
		} catch (e) {
			throw new Error("failed to get info about account " + publicKey.toBase58() + ": " + e);
		}
	}
	/**
	* Fetch all the account info for multiple accounts specified by an array of public keys, return with context
	*/
	async getMultipleParsedAccounts(publicKeys, rawConfig) {
		const { commitment, config } = extractCommitmentFromConfig(rawConfig);
		const keys = publicKeys.map((key) => key.toBase58());
		const args = this._buildArgs([keys], commitment, "jsonParsed", config);
		const res = create(await this._rpcRequest("getMultipleAccounts", args), jsonRpcResultAndContext(array(nullable(ParsedAccountInfoResult))));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get info for accounts ${keys}`);
		return res.result;
	}
	/**
	* Fetch all the account info for multiple accounts specified by an array of public keys, return with context
	*/
	async getMultipleAccountsInfoAndContext(publicKeys, commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const keys = publicKeys.map((key) => key.toBase58());
		const args = this._buildArgs([keys], commitment, "base64", config);
		const res = create(await this._rpcRequest("getMultipleAccounts", args), jsonRpcResultAndContext(array(nullable(AccountInfoResult))));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get info for accounts ${keys}`);
		return res.result;
	}
	/**
	* Fetch all the account info for multiple accounts specified by an array of public keys
	*/
	async getMultipleAccountsInfo(publicKeys, commitmentOrConfig) {
		return (await this.getMultipleAccountsInfoAndContext(publicKeys, commitmentOrConfig)).value;
	}
	/**
	* Returns epoch activation information for a stake account that has been delegated
	*
	* @deprecated Deprecated since RPC v1.18; will be removed in a future version.
	*/
	async getStakeActivation(publicKey, commitmentOrConfig, epoch) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([publicKey.toBase58()], commitment, void 0, {
			...config,
			epoch: epoch != null ? epoch : config?.epoch
		});
		const res = create(await this._rpcRequest("getStakeActivation", args), jsonRpcResult(StakeActivationResult));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get Stake Activation ${publicKey.toBase58()}`);
		return res.result;
	}
	/**
	* Fetch all the accounts owned by the specified program id
	*
	* @return {Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer>}>>}
	*/
	async getProgramAccounts(programId, configOrCommitment) {
		const { commitment, config } = extractCommitmentFromConfig(configOrCommitment);
		const { encoding, ...configWithoutEncoding } = config || {};
		const args = this._buildArgs([programId.toBase58()], commitment, encoding || "base64", {
			...configWithoutEncoding,
			...configWithoutEncoding.filters ? { filters: applyDefaultMemcmpEncodingToFilters(configWithoutEncoding.filters) } : null
		});
		const unsafeRes = await this._rpcRequest("getProgramAccounts", args);
		const baseSchema = array(KeyedAccountInfoResult);
		const res = configWithoutEncoding.withContext === true ? create(unsafeRes, jsonRpcResultAndContext(baseSchema)) : create(unsafeRes, jsonRpcResult(baseSchema));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get accounts owned by program ${programId.toBase58()}`);
		return res.result;
	}
	/**
	* Fetch and parse all the accounts owned by the specified program id
	*
	* @return {Promise<Array<{pubkey: PublicKey, account: AccountInfo<Buffer | ParsedAccountData>}>>}
	*/
	async getParsedProgramAccounts(programId, configOrCommitment) {
		const { commitment, config } = extractCommitmentFromConfig(configOrCommitment);
		const args = this._buildArgs([programId.toBase58()], commitment, "jsonParsed", config);
		const res = create(await this._rpcRequest("getProgramAccounts", args), jsonRpcResult(array(KeyedParsedAccountInfoResult)));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get accounts owned by program ${programId.toBase58()}`);
		return res.result;
	}
	/** @deprecated Instead, call `confirmTransaction` and pass in {@link TransactionConfirmationStrategy} */
	async confirmTransaction(strategy, commitment) {
		let rawSignature;
		if (typeof strategy == "string") rawSignature = strategy;
		else {
			const config = strategy;
			if (config.abortSignal?.aborted) return Promise.reject(config.abortSignal.reason);
			rawSignature = config.signature;
		}
		let decodedSignature;
		try {
			decodedSignature = import_bs58.default.decode(rawSignature);
		} catch (err) {
			throw new Error("signature must be base58 encoded: " + rawSignature);
		}
		assert(decodedSignature.length === 64, "signature has invalid length");
		if (typeof strategy === "string") return await this.confirmTransactionUsingLegacyTimeoutStrategy({
			commitment: commitment || this.commitment,
			signature: rawSignature
		});
		else if ("lastValidBlockHeight" in strategy) return await this.confirmTransactionUsingBlockHeightExceedanceStrategy({
			commitment: commitment || this.commitment,
			strategy
		});
		else return await this.confirmTransactionUsingDurableNonceStrategy({
			commitment: commitment || this.commitment,
			strategy
		});
	}
	getCancellationPromise(signal) {
		return new Promise((_, reject) => {
			if (signal == null) return;
			if (signal.aborted) reject(signal.reason);
			else signal.addEventListener("abort", () => {
				reject(signal.reason);
			});
		});
	}
	getTransactionConfirmationPromise({ commitment, signature }) {
		let signatureSubscriptionId;
		let disposeSignatureSubscriptionStateChangeObserver;
		let done = false;
		const confirmationPromise = new Promise((resolve, reject) => {
			try {
				signatureSubscriptionId = this.onSignature(signature, (result, context) => {
					signatureSubscriptionId = void 0;
					const response = {
						context,
						value: result
					};
					resolve({
						__type: TransactionStatus.PROCESSED,
						response
					});
				}, commitment);
				const subscriptionSetupPromise = new Promise((resolveSubscriptionSetup) => {
					if (signatureSubscriptionId == null) resolveSubscriptionSetup();
					else disposeSignatureSubscriptionStateChangeObserver = this._onSubscriptionStateChange(signatureSubscriptionId, (nextState) => {
						if (nextState === "subscribed") resolveSubscriptionSetup();
					});
				});
				(async () => {
					await subscriptionSetupPromise;
					if (done) return;
					const response = await this.getSignatureStatus(signature);
					if (done) return;
					if (response == null) return;
					const { context, value } = response;
					if (value == null) return;
					if (value?.err) reject(value.err);
					else {
						switch (commitment) {
							case "confirmed":
							case "single":
							case "singleGossip":
								if (value.confirmationStatus === "processed") return;
								break;
							case "finalized":
							case "max":
							case "root": if (value.confirmationStatus === "processed" || value.confirmationStatus === "confirmed") return;
						}
						done = true;
						resolve({
							__type: TransactionStatus.PROCESSED,
							response: {
								context,
								value
							}
						});
					}
				})();
			} catch (err) {
				reject(err);
			}
		});
		const abortConfirmation = () => {
			if (disposeSignatureSubscriptionStateChangeObserver) {
				disposeSignatureSubscriptionStateChangeObserver();
				disposeSignatureSubscriptionStateChangeObserver = void 0;
			}
			if (signatureSubscriptionId != null) {
				this.removeSignatureListener(signatureSubscriptionId);
				signatureSubscriptionId = void 0;
			}
		};
		return {
			abortConfirmation,
			confirmationPromise
		};
	}
	async confirmTransactionUsingBlockHeightExceedanceStrategy({ commitment, strategy: { abortSignal, lastValidBlockHeight, signature } }) {
		let done = false;
		const expiryPromise = new Promise((resolve) => {
			const checkBlockHeight = async () => {
				try {
					return await this.getBlockHeight(commitment);
				} catch (_e) {
					return -1;
				}
			};
			(async () => {
				let currentBlockHeight = await checkBlockHeight();
				if (done) return;
				while (currentBlockHeight <= lastValidBlockHeight) {
					await sleep(1e3);
					if (done) return;
					currentBlockHeight = await checkBlockHeight();
					if (done) return;
				}
				resolve({ __type: TransactionStatus.BLOCKHEIGHT_EXCEEDED });
			})();
		});
		const { abortConfirmation, confirmationPromise } = this.getTransactionConfirmationPromise({
			commitment,
			signature
		});
		const cancellationPromise = this.getCancellationPromise(abortSignal);
		let result;
		try {
			const outcome = await Promise.race([
				cancellationPromise,
				confirmationPromise,
				expiryPromise
			]);
			if (outcome.__type === TransactionStatus.PROCESSED) result = outcome.response;
			else throw new TransactionExpiredBlockheightExceededError(signature);
		} finally {
			done = true;
			abortConfirmation();
		}
		return result;
	}
	async confirmTransactionUsingDurableNonceStrategy({ commitment, strategy: { abortSignal, minContextSlot, nonceAccountPubkey, nonceValue, signature } }) {
		let done = false;
		const expiryPromise = new Promise((resolve) => {
			let currentNonceValue = nonceValue;
			let lastCheckedSlot = null;
			const getCurrentNonceValue = async () => {
				try {
					const { context, value: nonceAccount } = await this.getNonceAndContext(nonceAccountPubkey, {
						commitment,
						minContextSlot
					});
					lastCheckedSlot = context.slot;
					return nonceAccount?.nonce;
				} catch (e) {
					return currentNonceValue;
				}
			};
			(async () => {
				currentNonceValue = await getCurrentNonceValue();
				if (done) return;
				while (true) {
					if (nonceValue !== currentNonceValue) {
						resolve({
							__type: TransactionStatus.NONCE_INVALID,
							slotInWhichNonceDidAdvance: lastCheckedSlot
						});
						return;
					}
					await sleep(2e3);
					if (done) return;
					currentNonceValue = await getCurrentNonceValue();
					if (done) return;
				}
			})();
		});
		const { abortConfirmation, confirmationPromise } = this.getTransactionConfirmationPromise({
			commitment,
			signature
		});
		const cancellationPromise = this.getCancellationPromise(abortSignal);
		let result;
		try {
			const outcome = await Promise.race([
				cancellationPromise,
				confirmationPromise,
				expiryPromise
			]);
			if (outcome.__type === TransactionStatus.PROCESSED) result = outcome.response;
			else {
				let signatureStatus;
				while (true) {
					const status = await this.getSignatureStatus(signature);
					if (status == null) break;
					if (status.context.slot < (outcome.slotInWhichNonceDidAdvance ?? minContextSlot)) {
						await sleep(400);
						continue;
					}
					signatureStatus = status;
					break;
				}
				if (signatureStatus?.value) {
					const commitmentForStatus = commitment || "finalized";
					const { confirmationStatus } = signatureStatus.value;
					switch (commitmentForStatus) {
						case "processed":
						case "recent":
							if (confirmationStatus !== "processed" && confirmationStatus !== "confirmed" && confirmationStatus !== "finalized") throw new TransactionExpiredNonceInvalidError(signature);
							break;
						case "confirmed":
						case "single":
						case "singleGossip":
							if (confirmationStatus !== "confirmed" && confirmationStatus !== "finalized") throw new TransactionExpiredNonceInvalidError(signature);
							break;
						case "finalized":
						case "max":
						case "root": if (confirmationStatus !== "finalized") throw new TransactionExpiredNonceInvalidError(signature);
					}
					result = {
						context: signatureStatus.context,
						value: { err: signatureStatus.value.err }
					};
				} else throw new TransactionExpiredNonceInvalidError(signature);
			}
		} finally {
			done = true;
			abortConfirmation();
		}
		return result;
	}
	async confirmTransactionUsingLegacyTimeoutStrategy({ commitment, signature }) {
		let timeoutId;
		const expiryPromise = new Promise((resolve) => {
			let timeoutMs = this._confirmTransactionInitialTimeout || 6e4;
			switch (commitment) {
				case "processed":
				case "recent":
				case "single":
				case "confirmed":
				case "singleGossip": timeoutMs = this._confirmTransactionInitialTimeout || 3e4;
			}
			timeoutId = setTimeout(() => resolve({
				__type: TransactionStatus.TIMED_OUT,
				timeoutMs
			}), timeoutMs);
		});
		const { abortConfirmation, confirmationPromise } = this.getTransactionConfirmationPromise({
			commitment,
			signature
		});
		let result;
		try {
			const outcome = await Promise.race([confirmationPromise, expiryPromise]);
			if (outcome.__type === TransactionStatus.PROCESSED) result = outcome.response;
			else throw new TransactionExpiredTimeoutError(signature, outcome.timeoutMs / 1e3);
		} finally {
			clearTimeout(timeoutId);
			abortConfirmation();
		}
		return result;
	}
	/**
	* Return the list of nodes that are currently participating in the cluster
	*/
	async getClusterNodes() {
		const res = create(await this._rpcRequest("getClusterNodes", []), jsonRpcResult(array(ContactInfoResult)));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get cluster nodes");
		return res.result;
	}
	/**
	* Return the list of nodes that are currently participating in the cluster
	*/
	async getVoteAccounts(commitment) {
		const args = this._buildArgs([], commitment);
		const res = create(await this._rpcRequest("getVoteAccounts", args), GetVoteAccounts);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get vote accounts");
		return res.result;
	}
	/**
	* Fetch the current slot that the node is processing
	*/
	async getSlot(commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([], commitment, void 0, config);
		const res = create(await this._rpcRequest("getSlot", args), jsonRpcResult(number()));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get slot");
		return res.result;
	}
	/**
	* Fetch the current slot leader of the cluster
	*/
	async getSlotLeader(commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([], commitment, void 0, config);
		const res = create(await this._rpcRequest("getSlotLeader", args), jsonRpcResult(string()));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get slot leader");
		return res.result;
	}
	/**
	* Fetch `limit` number of slot leaders starting from `startSlot`
	*
	* @param startSlot fetch slot leaders starting from this slot
	* @param limit number of slot leaders to return
	*/
	async getSlotLeaders(startSlot, limit) {
		const args = [startSlot, limit];
		const res = create(await this._rpcRequest("getSlotLeaders", args), jsonRpcResult(array(PublicKeyFromString)));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get slot leaders");
		return res.result;
	}
	/**
	* Fetch the current status of a signature
	*/
	async getSignatureStatus(signature, config) {
		const { context, value: values } = await this.getSignatureStatuses([signature], config);
		assert(values.length === 1);
		return {
			context,
			value: values[0]
		};
	}
	/**
	* Fetch the current statuses of a batch of signatures
	*/
	async getSignatureStatuses(signatures, config) {
		const params = [signatures];
		if (config) params.push(config);
		const res = create(await this._rpcRequest("getSignatureStatuses", params), GetSignatureStatusesRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get signature status");
		return res.result;
	}
	/**
	* Fetch the current transaction count of the cluster
	*/
	async getTransactionCount(commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([], commitment, void 0, config);
		const res = create(await this._rpcRequest("getTransactionCount", args), jsonRpcResult(number()));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get transaction count");
		return res.result;
	}
	/**
	* Fetch the current total currency supply of the cluster in lamports
	*
	* @deprecated Deprecated since RPC v1.2.8. Please use {@link getSupply} instead.
	*/
	async getTotalSupply(commitment) {
		return (await this.getSupply({
			commitment,
			excludeNonCirculatingAccountsList: true
		})).value.total;
	}
	/**
	* Fetch the cluster InflationGovernor parameters
	*/
	async getInflationGovernor(commitment) {
		const args = this._buildArgs([], commitment);
		const res = create(await this._rpcRequest("getInflationGovernor", args), GetInflationGovernorRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get inflation");
		return res.result;
	}
	/**
	* Fetch the inflation reward for a list of addresses for an epoch
	*/
	async getInflationReward(addresses, epoch, commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([addresses.map((pubkey) => pubkey.toBase58())], commitment, void 0, {
			...config,
			epoch: epoch != null ? epoch : config?.epoch
		});
		const res = create(await this._rpcRequest("getInflationReward", args), GetInflationRewardResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get inflation reward");
		return res.result;
	}
	/**
	* Fetch the specific inflation values for the current epoch
	*/
	async getInflationRate() {
		const res = create(await this._rpcRequest("getInflationRate", []), GetInflationRateRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get inflation rate");
		return res.result;
	}
	/**
	* Fetch the Epoch Info parameters
	*/
	async getEpochInfo(commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([], commitment, void 0, config);
		const res = create(await this._rpcRequest("getEpochInfo", args), GetEpochInfoRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get epoch info");
		return res.result;
	}
	/**
	* Fetch the Epoch Schedule parameters
	*/
	async getEpochSchedule() {
		const res = create(await this._rpcRequest("getEpochSchedule", []), GetEpochScheduleRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get epoch schedule");
		const epochSchedule = res.result;
		return new EpochSchedule(epochSchedule.slotsPerEpoch, epochSchedule.leaderScheduleSlotOffset, epochSchedule.warmup, epochSchedule.firstNormalEpoch, epochSchedule.firstNormalSlot);
	}
	/**
	* Fetch the leader schedule for the current epoch
	* @return {Promise<RpcResponseAndContext<LeaderSchedule>>}
	*/
	async getLeaderSchedule() {
		const res = create(await this._rpcRequest("getLeaderSchedule", []), GetLeaderScheduleRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get leader schedule");
		return res.result;
	}
	/**
	* Fetch the minimum balance needed to exempt an account of `dataLength`
	* size from rent
	*/
	async getMinimumBalanceForRentExemption(dataLength, commitment) {
		const args = this._buildArgs([dataLength], commitment);
		const res = create(await this._rpcRequest("getMinimumBalanceForRentExemption", args), GetMinimumBalanceForRentExemptionRpcResult);
		if ("error" in res) {
			console.warn("Unable to fetch minimum balance for rent exemption");
			return 0;
		}
		return res.result;
	}
	/**
	* Fetch a recent blockhash from the cluster, return with context
	* @return {Promise<RpcResponseAndContext<{blockhash: Blockhash, feeCalculator: FeeCalculator}>>}
	*
	* @deprecated Deprecated since RPC v1.9.0. Please use {@link getLatestBlockhash} instead.
	*/
	async getRecentBlockhashAndContext(commitment) {
		const { context, value: { blockhash } } = await this.getLatestBlockhashAndContext(commitment);
		return {
			context,
			value: {
				blockhash,
				feeCalculator: {
					get lamportsPerSignature() {
						throw new Error("The capability to fetch `lamportsPerSignature` using the `getRecentBlockhash` API is no longer offered by the network. Use the `getFeeForMessage` API to obtain the fee for a given message.");
					},
					toJSON() {
						return {};
					}
				}
			}
		};
	}
	/**
	* Fetch recent performance samples
	* @return {Promise<Array<PerfSample>>}
	*/
	async getRecentPerformanceSamples(limit) {
		const res = create(await this._rpcRequest("getRecentPerformanceSamples", limit ? [limit] : []), GetRecentPerformanceSamplesRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get recent performance samples");
		return res.result;
	}
	/**
	* Fetch the fee calculator for a recent blockhash from the cluster, return with context
	*
	* @deprecated Deprecated since RPC v1.9.0. Please use {@link getFeeForMessage} instead.
	*/
	async getFeeCalculatorForBlockhash(blockhash, commitment) {
		const args = this._buildArgs([blockhash], commitment);
		const res = create(await this._rpcRequest("getFeeCalculatorForBlockhash", args), GetFeeCalculatorRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get fee calculator");
		const { context, value } = res.result;
		return {
			context,
			value: value !== null ? value.feeCalculator : null
		};
	}
	/**
	* Fetch the fee for a message from the cluster, return with context
	*/
	async getFeeForMessage(message, commitment) {
		const wireMessage = toBuffer(message.serialize()).toString("base64");
		const args = this._buildArgs([wireMessage], commitment);
		const res = create(await this._rpcRequest("getFeeForMessage", args), jsonRpcResultAndContext(nullable(number())));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get fee for message");
		if (res.result === null) throw new Error("invalid blockhash");
		return res.result;
	}
	/**
	* Fetch a list of prioritization fees from recent blocks.
	*/
	async getRecentPrioritizationFees(config) {
		const accounts = config?.lockedWritableAccounts?.map((key) => key.toBase58());
		const args = accounts?.length ? [accounts] : [];
		const res = create(await this._rpcRequest("getRecentPrioritizationFees", args), GetRecentPrioritizationFeesRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get recent prioritization fees");
		return res.result;
	}
	/**
	* Fetch a recent blockhash from the cluster
	* @return {Promise<{blockhash: Blockhash, feeCalculator: FeeCalculator}>}
	*
	* @deprecated Deprecated since RPC v1.8.0. Please use {@link getLatestBlockhash} instead.
	*/
	async getRecentBlockhash(commitment) {
		try {
			return (await this.getRecentBlockhashAndContext(commitment)).value;
		} catch (e) {
			throw new Error("failed to get recent blockhash: " + e);
		}
	}
	/**
	* Fetch the latest blockhash from the cluster
	* @return {Promise<BlockhashWithExpiryBlockHeight>}
	*/
	async getLatestBlockhash(commitmentOrConfig) {
		try {
			return (await this.getLatestBlockhashAndContext(commitmentOrConfig)).value;
		} catch (e) {
			throw new Error("failed to get recent blockhash: " + e);
		}
	}
	/**
	* Fetch the latest blockhash from the cluster
	* @return {Promise<BlockhashWithExpiryBlockHeight>}
	*/
	async getLatestBlockhashAndContext(commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([], commitment, void 0, config);
		const res = create(await this._rpcRequest("getLatestBlockhash", args), GetLatestBlockhashRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get latest blockhash");
		return res.result;
	}
	/**
	* Returns whether a blockhash is still valid or not
	*/
	async isBlockhashValid(blockhash, rawConfig) {
		const { commitment, config } = extractCommitmentFromConfig(rawConfig);
		const args = this._buildArgs([blockhash], commitment, void 0, config);
		const res = create(await this._rpcRequest("isBlockhashValid", args), IsBlockhashValidRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to determine if the blockhash `" + blockhash + "`is valid");
		return res.result;
	}
	/**
	* Fetch the node version
	*/
	async getVersion() {
		const res = create(await this._rpcRequest("getVersion", []), jsonRpcResult(VersionResult));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get version");
		return res.result;
	}
	/**
	* Fetch the genesis hash
	*/
	async getGenesisHash() {
		const res = create(await this._rpcRequest("getGenesisHash", []), jsonRpcResult(string()));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get genesis hash");
		return res.result;
	}
	/**
	* Fetch a processed block from the cluster.
	*
	* @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
	* setting the `maxSupportedTransactionVersion` property.
	*/
	/**
	* @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
	* setting the `maxSupportedTransactionVersion` property.
	*/
	/**
	* @deprecated Instead, call `getBlock` using a `GetVersionedBlockConfig` by
	* setting the `maxSupportedTransactionVersion` property.
	*/
	/**
	* Fetch a processed block from the cluster.
	*/
	/**
	* Fetch a processed block from the cluster.
	*/
	async getBlock(slot, rawConfig) {
		const { commitment, config } = extractCommitmentFromConfig(rawConfig);
		const args = this._buildArgsAtLeastConfirmed([slot], commitment, void 0, config);
		const unsafeRes = await this._rpcRequest("getBlock", args);
		try {
			switch (config?.transactionDetails) {
				case "accounts": {
					const res = create(unsafeRes, GetAccountsModeBlockRpcResult);
					if ("error" in res) throw res.error;
					return res.result;
				}
				case "none": {
					const res = create(unsafeRes, GetNoneModeBlockRpcResult);
					if ("error" in res) throw res.error;
					return res.result;
				}
				default: {
					const res = create(unsafeRes, GetBlockRpcResult);
					if ("error" in res) throw res.error;
					const { result } = res;
					return result ? {
						...result,
						transactions: result.transactions.map(({ transaction, meta, version }) => ({
							meta,
							transaction: {
								...transaction,
								message: versionedMessageFromResponse(version, transaction.message)
							},
							version
						}))
					} : null;
				}
			}
		} catch (e) {
			throw new SolanaJSONRPCError(e, "failed to get confirmed block");
		}
	}
	/**
	* Fetch parsed transaction details for a confirmed or finalized block
	*/
	async getParsedBlock(slot, rawConfig) {
		const { commitment, config } = extractCommitmentFromConfig(rawConfig);
		const args = this._buildArgsAtLeastConfirmed([slot], commitment, "jsonParsed", config);
		const unsafeRes = await this._rpcRequest("getBlock", args);
		try {
			switch (config?.transactionDetails) {
				case "accounts": {
					const res = create(unsafeRes, GetParsedAccountsModeBlockRpcResult);
					if ("error" in res) throw res.error;
					return res.result;
				}
				case "none": {
					const res = create(unsafeRes, GetParsedNoneModeBlockRpcResult);
					if ("error" in res) throw res.error;
					return res.result;
				}
				default: {
					const res = create(unsafeRes, GetParsedBlockRpcResult);
					if ("error" in res) throw res.error;
					return res.result;
				}
			}
		} catch (e) {
			throw new SolanaJSONRPCError(e, "failed to get block");
		}
	}
	async getBlockProduction(configOrCommitment) {
		let extra;
		let commitment;
		if (typeof configOrCommitment === "string") commitment = configOrCommitment;
		else if (configOrCommitment) {
			const { commitment: c, ...rest } = configOrCommitment;
			commitment = c;
			extra = rest;
		}
		const args = this._buildArgs([], commitment, "base64", extra);
		const res = create(await this._rpcRequest("getBlockProduction", args), BlockProductionResponseStruct);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get block production information");
		return res.result;
	}
	/**
	* Fetch a confirmed or finalized transaction from the cluster.
	*
	* @deprecated Instead, call `getTransaction` using a
	* `GetVersionedTransactionConfig` by setting the
	* `maxSupportedTransactionVersion` property.
	*/
	/**
	* Fetch a confirmed or finalized transaction from the cluster.
	*/
	/**
	* Fetch a confirmed or finalized transaction from the cluster.
	*/
	async getTransaction(signature, rawConfig) {
		const { commitment, config } = extractCommitmentFromConfig(rawConfig);
		const args = this._buildArgsAtLeastConfirmed([signature], commitment, void 0, config);
		const res = create(await this._rpcRequest("getTransaction", args), GetTransactionRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get transaction");
		const result = res.result;
		if (!result) return result;
		return {
			...result,
			transaction: {
				...result.transaction,
				message: versionedMessageFromResponse(result.version, result.transaction.message)
			}
		};
	}
	/**
	* Fetch parsed transaction details for a confirmed or finalized transaction
	*/
	async getParsedTransaction(signature, commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgsAtLeastConfirmed([signature], commitment, "jsonParsed", config);
		const res = create(await this._rpcRequest("getTransaction", args), GetParsedTransactionRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get transaction");
		return res.result;
	}
	/**
	* Fetch parsed transaction details for a batch of confirmed transactions
	*/
	async getParsedTransactions(signatures, commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const batch = signatures.map((signature) => {
			return {
				methodName: "getTransaction",
				args: this._buildArgsAtLeastConfirmed([signature], commitment, "jsonParsed", config)
			};
		});
		return (await this._rpcBatchRequest(batch)).map((unsafeRes) => {
			const res = create(unsafeRes, GetParsedTransactionRpcResult);
			if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get transactions");
			return res.result;
		});
	}
	/**
	* Fetch transaction details for a batch of confirmed transactions.
	* Similar to {@link getParsedTransactions} but returns a {@link TransactionResponse}.
	*
	* @deprecated Instead, call `getTransactions` using a
	* `GetVersionedTransactionConfig` by setting the
	* `maxSupportedTransactionVersion` property.
	*/
	/**
	* Fetch transaction details for a batch of confirmed transactions.
	* Similar to {@link getParsedTransactions} but returns a {@link
	* VersionedTransactionResponse}.
	*/
	/**
	* Fetch transaction details for a batch of confirmed transactions.
	* Similar to {@link getParsedTransactions} but returns a {@link
	* VersionedTransactionResponse}.
	*/
	async getTransactions(signatures, commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const batch = signatures.map((signature) => {
			return {
				methodName: "getTransaction",
				args: this._buildArgsAtLeastConfirmed([signature], commitment, void 0, config)
			};
		});
		return (await this._rpcBatchRequest(batch)).map((unsafeRes) => {
			const res = create(unsafeRes, GetTransactionRpcResult);
			if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get transactions");
			const result = res.result;
			if (!result) return result;
			return {
				...result,
				transaction: {
					...result.transaction,
					message: versionedMessageFromResponse(result.version, result.transaction.message)
				}
			};
		});
	}
	/**
	* Fetch a list of Transactions and transaction statuses from the cluster
	* for a confirmed block.
	*
	* @deprecated Deprecated since RPC v1.7.0. Please use {@link getBlock} instead.
	*/
	async getConfirmedBlock(slot, commitment) {
		const args = this._buildArgsAtLeastConfirmed([slot], commitment);
		const res = create(await this._rpcRequest("getBlock", args), GetConfirmedBlockRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get confirmed block");
		const result = res.result;
		if (!result) throw new Error("Confirmed block " + slot + " not found");
		const block = {
			...result,
			transactions: result.transactions.map(({ transaction, meta }) => {
				const message = new Message(transaction.message);
				return {
					meta,
					transaction: {
						...transaction,
						message
					}
				};
			})
		};
		return {
			...block,
			transactions: block.transactions.map(({ transaction, meta }) => {
				return {
					meta,
					transaction: Transaction.populate(transaction.message, transaction.signatures)
				};
			})
		};
	}
	/**
	* Fetch confirmed blocks between two slots
	*/
	async getBlocks(startSlot, endSlot, commitment) {
		const args = this._buildArgsAtLeastConfirmed(endSlot !== void 0 ? [startSlot, endSlot] : [startSlot], commitment);
		const res = create(await this._rpcRequest("getBlocks", args), jsonRpcResult(array(number())));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get blocks");
		return res.result;
	}
	/**
	* Fetch a list of Signatures from the cluster for a block, excluding rewards
	*/
	async getBlockSignatures(slot, commitment) {
		const args = this._buildArgsAtLeastConfirmed([slot], commitment, void 0, {
			transactionDetails: "signatures",
			rewards: false
		});
		const res = create(await this._rpcRequest("getBlock", args), GetBlockSignaturesRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get block");
		const result = res.result;
		if (!result) throw new Error("Block " + slot + " not found");
		return result;
	}
	/**
	* Fetch a list of Signatures from the cluster for a confirmed block, excluding rewards
	*
	* @deprecated Deprecated since RPC v1.7.0. Please use {@link getBlockSignatures} instead.
	*/
	async getConfirmedBlockSignatures(slot, commitment) {
		const args = this._buildArgsAtLeastConfirmed([slot], commitment, void 0, {
			transactionDetails: "signatures",
			rewards: false
		});
		const res = create(await this._rpcRequest("getBlock", args), GetBlockSignaturesRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get confirmed block");
		const result = res.result;
		if (!result) throw new Error("Confirmed block " + slot + " not found");
		return result;
	}
	/**
	* Fetch a transaction details for a confirmed transaction
	*
	* @deprecated Deprecated since RPC v1.7.0. Please use {@link getTransaction} instead.
	*/
	async getConfirmedTransaction(signature, commitment) {
		const args = this._buildArgsAtLeastConfirmed([signature], commitment);
		const res = create(await this._rpcRequest("getTransaction", args), GetTransactionRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get transaction");
		const result = res.result;
		if (!result) return result;
		const message = new Message(result.transaction.message);
		const signatures = result.transaction.signatures;
		return {
			...result,
			transaction: Transaction.populate(message, signatures)
		};
	}
	/**
	* Fetch parsed transaction details for a confirmed transaction
	*
	* @deprecated Deprecated since RPC v1.7.0. Please use {@link getParsedTransaction} instead.
	*/
	async getParsedConfirmedTransaction(signature, commitment) {
		const args = this._buildArgsAtLeastConfirmed([signature], commitment, "jsonParsed");
		const res = create(await this._rpcRequest("getTransaction", args), GetParsedTransactionRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get confirmed transaction");
		return res.result;
	}
	/**
	* Fetch parsed transaction details for a batch of confirmed transactions
	*
	* @deprecated Deprecated since RPC v1.7.0. Please use {@link getParsedTransactions} instead.
	*/
	async getParsedConfirmedTransactions(signatures, commitment) {
		const batch = signatures.map((signature) => {
			return {
				methodName: "getTransaction",
				args: this._buildArgsAtLeastConfirmed([signature], commitment, "jsonParsed")
			};
		});
		return (await this._rpcBatchRequest(batch)).map((unsafeRes) => {
			const res = create(unsafeRes, GetParsedTransactionRpcResult);
			if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get confirmed transactions");
			return res.result;
		});
	}
	/**
	* Fetch a list of all the confirmed signatures for transactions involving an address
	* within a specified slot range. Max range allowed is 10,000 slots.
	*
	* @deprecated Deprecated since RPC v1.3. Please use {@link getConfirmedSignaturesForAddress2} instead.
	*
	* @param address queried address
	* @param startSlot start slot, inclusive
	* @param endSlot end slot, inclusive
	*/
	async getConfirmedSignaturesForAddress(address, startSlot, endSlot) {
		let options = {};
		let firstAvailableBlock = await this.getFirstAvailableBlock();
		while (!("until" in options)) {
			startSlot--;
			if (startSlot <= 0 || startSlot < firstAvailableBlock) break;
			try {
				const block = await this.getConfirmedBlockSignatures(startSlot, "finalized");
				if (block.signatures.length > 0) options.until = block.signatures[block.signatures.length - 1].toString();
			} catch (err) {
				if (err instanceof Error && err.message.includes("skipped")) continue;
				else throw err;
			}
		}
		let highestConfirmedRoot = await this.getSlot("finalized");
		while (!("before" in options)) {
			endSlot++;
			if (endSlot > highestConfirmedRoot) break;
			try {
				const block = await this.getConfirmedBlockSignatures(endSlot);
				if (block.signatures.length > 0) options.before = block.signatures[block.signatures.length - 1].toString();
			} catch (err) {
				if (err instanceof Error && err.message.includes("skipped")) continue;
				else throw err;
			}
		}
		return (await this.getConfirmedSignaturesForAddress2(address, options)).map((info) => info.signature);
	}
	/**
	* Returns confirmed signatures for transactions involving an
	* address backwards in time from the provided signature or most recent confirmed block
	*
	* @deprecated Deprecated since RPC v1.7.0. Please use {@link getSignaturesForAddress} instead.
	*/
	async getConfirmedSignaturesForAddress2(address, options, commitment) {
		const args = this._buildArgsAtLeastConfirmed([address.toBase58()], commitment, void 0, options);
		const res = create(await this._rpcRequest("getConfirmedSignaturesForAddress2", args), GetConfirmedSignaturesForAddress2RpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get confirmed signatures for address");
		return res.result;
	}
	/**
	* Returns confirmed signatures for transactions involving an
	* address backwards in time from the provided signature or most recent confirmed block
	*
	*
	* @param address queried address
	* @param options
	*/
	async getSignaturesForAddress(address, options, commitment) {
		const args = this._buildArgsAtLeastConfirmed([address.toBase58()], commitment, void 0, options);
		const res = create(await this._rpcRequest("getSignaturesForAddress", args), GetSignaturesForAddressRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, "failed to get signatures for address");
		return res.result;
	}
	async getAddressLookupTable(accountKey, config) {
		const { context, value: accountInfo } = await this.getAccountInfoAndContext(accountKey, config);
		let value = null;
		if (accountInfo !== null) value = new AddressLookupTableAccount({
			key: accountKey,
			state: AddressLookupTableAccount.deserialize(accountInfo.data)
		});
		return {
			context,
			value
		};
	}
	/**
	* Fetch the contents of a Nonce account from the cluster, return with context
	*/
	async getNonceAndContext(nonceAccount, commitmentOrConfig) {
		const { context, value: accountInfo } = await this.getAccountInfoAndContext(nonceAccount, commitmentOrConfig);
		let value = null;
		if (accountInfo !== null) value = NonceAccount.fromAccountData(accountInfo.data);
		return {
			context,
			value
		};
	}
	/**
	* Fetch the contents of a Nonce account from the cluster
	*/
	async getNonce(nonceAccount, commitmentOrConfig) {
		return await this.getNonceAndContext(nonceAccount, commitmentOrConfig).then((x) => x.value).catch((e) => {
			throw new Error("failed to get nonce for account " + nonceAccount.toBase58() + ": " + e);
		});
	}
	/**
	* Request an allocation of lamports to the specified address
	*
	* ```typescript
	* import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
	*
	* (async () => {
	*   const connection = new Connection("https://api.testnet.solana.com", "confirmed");
	*   const myAddress = new PublicKey("2nr1bHFT86W9tGnyvmYW4vcHKsQB3sVQfnddasz4kExM");
	*   const signature = await connection.requestAirdrop(myAddress, LAMPORTS_PER_SOL);
	*   await connection.confirmTransaction(signature);
	* })();
	* ```
	*/
	async requestAirdrop(to, lamports) {
		const res = create(await this._rpcRequest("requestAirdrop", [to.toBase58(), lamports]), RequestAirdropRpcResult);
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `airdrop to ${to.toBase58()} failed`);
		return res.result;
	}
	/**
	* @internal
	*/
	async _blockhashWithExpiryBlockHeight(disableCache) {
		if (!disableCache) {
			while (this._pollingBlockhash) await sleep(100);
			const expired = Date.now() - this._blockhashInfo.lastFetch >= BLOCKHASH_CACHE_TIMEOUT_MS;
			if (this._blockhashInfo.latestBlockhash !== null && !expired) return this._blockhashInfo.latestBlockhash;
		}
		return await this._pollNewBlockhash();
	}
	/**
	* @internal
	*/
	async _pollNewBlockhash() {
		this._pollingBlockhash = true;
		try {
			const startTime = Date.now();
			const cachedLatestBlockhash = this._blockhashInfo.latestBlockhash;
			const cachedBlockhash = cachedLatestBlockhash ? cachedLatestBlockhash.blockhash : null;
			for (let i = 0; i < 50; i++) {
				const latestBlockhash = await this.getLatestBlockhash("finalized");
				if (cachedBlockhash !== latestBlockhash.blockhash) {
					this._blockhashInfo = {
						latestBlockhash,
						lastFetch: Date.now(),
						transactionSignatures: [],
						simulatedSignatures: []
					};
					return latestBlockhash;
				}
				await sleep(MS_PER_SLOT / 2);
			}
			throw new Error(`Unable to obtain a new blockhash after ${Date.now() - startTime}ms`);
		} finally {
			this._pollingBlockhash = false;
		}
	}
	/**
	* get the stake minimum delegation
	*/
	async getStakeMinimumDelegation(config) {
		const { commitment, config: configArg } = extractCommitmentFromConfig(config);
		const args = this._buildArgs([], commitment, "base64", configArg);
		const res = create(await this._rpcRequest("getStakeMinimumDelegation", args), jsonRpcResultAndContext(number()));
		if ("error" in res) throw new SolanaJSONRPCError(res.error, `failed to get stake minimum delegation`);
		return res.result;
	}
	/**
	* Simulate a transaction
	*
	* @deprecated Instead, call {@link simulateTransaction} with {@link
	* VersionedTransaction} and {@link SimulateTransactionConfig} parameters
	*/
	/**
	* Simulate a transaction
	*/
	/**
	* Simulate a transaction
	*/
	async simulateTransaction(transactionOrMessage, configOrSigners, includeAccounts) {
		if ("message" in transactionOrMessage) {
			const wireTransaction = transactionOrMessage.serialize();
			const encodedTransaction = Buffer$1.from(wireTransaction).toString("base64");
			if (Array.isArray(configOrSigners) || includeAccounts !== void 0) throw new Error("Invalid arguments");
			const config = configOrSigners || {};
			config.encoding = "base64";
			if (!("commitment" in config)) config.commitment = this.commitment;
			if (configOrSigners && typeof configOrSigners === "object" && "innerInstructions" in configOrSigners) config.innerInstructions = configOrSigners.innerInstructions;
			const args = [encodedTransaction, config];
			const res = create(await this._rpcRequest("simulateTransaction", args), SimulatedTransactionResponseStruct);
			if ("error" in res) throw new Error("failed to simulate transaction: " + res.error.message);
			return res.result;
		}
		let transaction;
		if (transactionOrMessage instanceof Transaction) {
			let originalTx = transactionOrMessage;
			transaction = new Transaction();
			transaction.feePayer = originalTx.feePayer;
			transaction.instructions = transactionOrMessage.instructions;
			transaction.nonceInfo = originalTx.nonceInfo;
			transaction.signatures = originalTx.signatures;
		} else {
			transaction = Transaction.populate(transactionOrMessage);
			transaction._message = transaction._json = void 0;
		}
		if (configOrSigners !== void 0 && !Array.isArray(configOrSigners)) throw new Error("Invalid arguments");
		const signers = configOrSigners;
		if (transaction.nonceInfo && signers) transaction.sign(...signers);
		else {
			let disableCache = this._disableBlockhashCaching;
			for (;;) {
				const latestBlockhash = await this._blockhashWithExpiryBlockHeight(disableCache);
				transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
				transaction.recentBlockhash = latestBlockhash.blockhash;
				if (!signers) break;
				transaction.sign(...signers);
				if (!transaction.signature) throw new Error("!signature");
				const signature = transaction.signature.toString("base64");
				if (!this._blockhashInfo.simulatedSignatures.includes(signature) && !this._blockhashInfo.transactionSignatures.includes(signature)) {
					this._blockhashInfo.simulatedSignatures.push(signature);
					break;
				} else disableCache = true;
			}
		}
		const message = transaction._compile();
		const signData = message.serialize();
		const encodedTransaction = transaction._serialize(signData).toString("base64");
		const config = {
			encoding: "base64",
			commitment: this.commitment
		};
		if (includeAccounts) config["accounts"] = {
			encoding: "base64",
			addresses: (Array.isArray(includeAccounts) ? includeAccounts : message.nonProgramIds()).map((key) => key.toBase58())
		};
		if (signers) config.sigVerify = true;
		if (configOrSigners && typeof configOrSigners === "object" && "innerInstructions" in configOrSigners) config.innerInstructions = configOrSigners.innerInstructions;
		const args = [encodedTransaction, config];
		const res = create(await this._rpcRequest("simulateTransaction", args), SimulatedTransactionResponseStruct);
		if ("error" in res) {
			let logs;
			if ("data" in res.error) {
				logs = res.error.data.logs;
				if (logs && Array.isArray(logs)) {
					const traceIndent = "\n    ";
					const logTrace = traceIndent + logs.join(traceIndent);
					console.error(res.error.message, logTrace);
				}
			}
			throw new SendTransactionError({
				action: "simulate",
				signature: "",
				transactionMessage: res.error.message,
				logs
			});
		}
		return res.result;
	}
	/**
	* Sign and send a transaction
	*
	* @deprecated Instead, call {@link sendTransaction} with a {@link
	* VersionedTransaction}
	*/
	/**
	* Send a signed transaction
	*/
	/**
	* Sign and send a transaction
	*/
	async sendTransaction(transaction, signersOrOptions, options) {
		if ("version" in transaction) {
			if (signersOrOptions && Array.isArray(signersOrOptions)) throw new Error("Invalid arguments");
			const wireTransaction = transaction.serialize();
			return await this.sendRawTransaction(wireTransaction, signersOrOptions);
		}
		if (signersOrOptions === void 0 || !Array.isArray(signersOrOptions)) throw new Error("Invalid arguments");
		const signers = signersOrOptions;
		if (transaction.nonceInfo) transaction.sign(...signers);
		else {
			let disableCache = this._disableBlockhashCaching;
			for (;;) {
				const latestBlockhash = await this._blockhashWithExpiryBlockHeight(disableCache);
				transaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
				transaction.recentBlockhash = latestBlockhash.blockhash;
				transaction.sign(...signers);
				if (!transaction.signature) throw new Error("!signature");
				const signature = transaction.signature.toString("base64");
				if (!this._blockhashInfo.transactionSignatures.includes(signature)) {
					this._blockhashInfo.transactionSignatures.push(signature);
					break;
				} else disableCache = true;
			}
		}
		const wireTransaction = transaction.serialize();
		return await this.sendRawTransaction(wireTransaction, options);
	}
	/**
	* Send a transaction that has already been signed and serialized into the
	* wire format
	*/
	async sendRawTransaction(rawTransaction, options) {
		const encodedTransaction = toBuffer(rawTransaction).toString("base64");
		return await this.sendEncodedTransaction(encodedTransaction, options);
	}
	/**
	* Send a transaction that has already been signed, serialized into the
	* wire format, and encoded as a base64 string
	*/
	async sendEncodedTransaction(encodedTransaction, options) {
		const config = { encoding: "base64" };
		const skipPreflight = options && options.skipPreflight;
		const preflightCommitment = skipPreflight === true ? "processed" : options && options.preflightCommitment || this.commitment;
		if (options && options.maxRetries != null) config.maxRetries = options.maxRetries;
		if (options && options.minContextSlot != null) config.minContextSlot = options.minContextSlot;
		if (skipPreflight) config.skipPreflight = skipPreflight;
		if (preflightCommitment) config.preflightCommitment = preflightCommitment;
		const args = [encodedTransaction, config];
		const res = create(await this._rpcRequest("sendTransaction", args), SendTransactionRpcResult);
		if ("error" in res) {
			let logs = void 0;
			if ("data" in res.error) logs = res.error.data.logs;
			throw new SendTransactionError({
				action: skipPreflight ? "send" : "simulate",
				signature: "",
				transactionMessage: res.error.message,
				logs
			});
		}
		return res.result;
	}
	/**
	* @internal
	*/
	_wsOnOpen() {
		this._rpcWebSocketConnected = true;
		this._rpcWebSocketHeartbeat = setInterval(() => {
			(async () => {
				try {
					await this._rpcWebSocket.notify("ping");
				} catch {}
			})();
		}, 5e3);
		this._updateSubscriptions();
	}
	/**
	* @internal
	*/
	_wsOnError(err) {
		this._rpcWebSocketConnected = false;
		console.error("ws error:", err.message);
	}
	/**
	* @internal
	*/
	_wsOnClose(code) {
		this._rpcWebSocketConnected = false;
		this._rpcWebSocketGeneration = (this._rpcWebSocketGeneration + 1) % Number.MAX_SAFE_INTEGER;
		if (this._rpcWebSocketIdleTimeout) {
			clearTimeout(this._rpcWebSocketIdleTimeout);
			this._rpcWebSocketIdleTimeout = null;
		}
		if (this._rpcWebSocketHeartbeat) {
			clearInterval(this._rpcWebSocketHeartbeat);
			this._rpcWebSocketHeartbeat = null;
		}
		if (code === 1e3) {
			this._updateSubscriptions();
			return;
		}
		this._subscriptionCallbacksByServerSubscriptionId = {};
		Object.entries(this._subscriptionsByHash).forEach(([hash, subscription]) => {
			this._setSubscription(hash, {
				...subscription,
				state: "pending"
			});
		});
	}
	/**
	* @internal
	*/
	_setSubscription(hash, nextSubscription) {
		const prevState = this._subscriptionsByHash[hash]?.state;
		this._subscriptionsByHash[hash] = nextSubscription;
		if (prevState !== nextSubscription.state) {
			const stateChangeCallbacks = this._subscriptionStateChangeCallbacksByHash[hash];
			if (stateChangeCallbacks) stateChangeCallbacks.forEach((cb) => {
				try {
					cb(nextSubscription.state);
				} catch {}
			});
		}
	}
	/**
	* @internal
	*/
	_onSubscriptionStateChange(clientSubscriptionId, callback) {
		const hash = this._subscriptionHashByClientSubscriptionId[clientSubscriptionId];
		if (hash == null) return () => {};
		const stateChangeCallbacks = this._subscriptionStateChangeCallbacksByHash[hash] ||= /* @__PURE__ */ new Set();
		stateChangeCallbacks.add(callback);
		return () => {
			stateChangeCallbacks.delete(callback);
			if (stateChangeCallbacks.size === 0) delete this._subscriptionStateChangeCallbacksByHash[hash];
		};
	}
	/**
	* @internal
	*/
	async _updateSubscriptions() {
		if (Object.keys(this._subscriptionsByHash).length === 0) {
			if (this._rpcWebSocketConnected) {
				this._rpcWebSocketConnected = false;
				this._rpcWebSocketIdleTimeout = setTimeout(() => {
					this._rpcWebSocketIdleTimeout = null;
					try {
						this._rpcWebSocket.close();
					} catch (err) {
						if (err instanceof Error) console.log(`Error when closing socket connection: ${err.message}`);
					}
				}, 500);
			}
			return;
		}
		if (this._rpcWebSocketIdleTimeout !== null) {
			clearTimeout(this._rpcWebSocketIdleTimeout);
			this._rpcWebSocketIdleTimeout = null;
			this._rpcWebSocketConnected = true;
		}
		if (!this._rpcWebSocketConnected) {
			this._rpcWebSocket.connect();
			return;
		}
		const activeWebSocketGeneration = this._rpcWebSocketGeneration;
		const isCurrentConnectionStillActive = () => {
			return activeWebSocketGeneration === this._rpcWebSocketGeneration;
		};
		await Promise.all(Object.keys(this._subscriptionsByHash).map(async (hash) => {
			const subscription = this._subscriptionsByHash[hash];
			if (subscription === void 0) return;
			switch (subscription.state) {
				case "pending":
				case "unsubscribed":
					if (subscription.callbacks.size === 0) {
						/**
						* You can end up here when:
						*
						* - a subscription has recently unsubscribed
						*   without having new callbacks added to it
						*   while the unsubscribe was in flight, or
						* - when a pending subscription has its
						*   listeners removed before a request was
						*   sent to the server.
						*
						* Being that nobody is interested in this
						* subscription any longer, delete it.
						*/
						delete this._subscriptionsByHash[hash];
						if (subscription.state === "unsubscribed") delete this._subscriptionCallbacksByServerSubscriptionId[subscription.serverSubscriptionId];
						await this._updateSubscriptions();
						return;
					}
					await (async () => {
						const { args, method } = subscription;
						try {
							this._setSubscription(hash, {
								...subscription,
								state: "subscribing"
							});
							const serverSubscriptionId = await this._rpcWebSocket.call(method, args);
							this._setSubscription(hash, {
								...subscription,
								serverSubscriptionId,
								state: "subscribed"
							});
							this._subscriptionCallbacksByServerSubscriptionId[serverSubscriptionId] = subscription.callbacks;
							await this._updateSubscriptions();
						} catch (e) {
							console.error(`Received ${e instanceof Error ? "" : "JSON-RPC "}error calling \`${method}\``, {
								args,
								error: e
							});
							if (!isCurrentConnectionStillActive()) return;
							this._setSubscription(hash, {
								...subscription,
								state: "pending"
							});
							await this._updateSubscriptions();
						}
					})();
					break;
				case "subscribed": if (subscription.callbacks.size === 0) await (async () => {
					const { serverSubscriptionId, unsubscribeMethod } = subscription;
					if (this._subscriptionsAutoDisposedByRpc.has(serverSubscriptionId))
 /**
					* Special case.
					* If we're dealing with a subscription that has been auto-
					* disposed by the RPC, then we can skip the RPC call to
					* tear down the subscription here.
					*
					* NOTE: There is a proposal to eliminate this special case, here:
					* https://github.com/solana-labs/solana/issues/18892
					*/
					this._subscriptionsAutoDisposedByRpc.delete(serverSubscriptionId);
					else {
						this._setSubscription(hash, {
							...subscription,
							state: "unsubscribing"
						});
						this._setSubscription(hash, {
							...subscription,
							state: "unsubscribing"
						});
						try {
							await this._rpcWebSocket.call(unsubscribeMethod, [serverSubscriptionId]);
						} catch (e) {
							if (e instanceof Error) console.error(`${unsubscribeMethod} error:`, e.message);
							if (!isCurrentConnectionStillActive()) return;
							this._setSubscription(hash, {
								...subscription,
								state: "subscribed"
							});
							await this._updateSubscriptions();
							return;
						}
					}
					this._setSubscription(hash, {
						...subscription,
						state: "unsubscribed"
					});
					await this._updateSubscriptions();
				})();
			}
		}));
	}
	/**
	* @internal
	*/
	_handleServerNotification(serverSubscriptionId, callbackArgs) {
		const callbacks = this._subscriptionCallbacksByServerSubscriptionId[serverSubscriptionId];
		if (callbacks === void 0) return;
		callbacks.forEach((cb) => {
			try {
				cb(...callbackArgs);
			} catch (e) {
				console.error(e);
			}
		});
	}
	/**
	* @internal
	*/
	_wsOnAccountNotification(notification) {
		const { result, subscription } = create(notification, AccountNotificationResult);
		this._handleServerNotification(subscription, [result.value, result.context]);
	}
	/**
	* @internal
	*/
	_makeSubscription(subscriptionConfig, args) {
		const clientSubscriptionId = this._nextClientSubscriptionId++;
		const hash = fastStableStringify([subscriptionConfig.method, args]);
		const existingSubscription = this._subscriptionsByHash[hash];
		if (existingSubscription === void 0) this._subscriptionsByHash[hash] = {
			...subscriptionConfig,
			args,
			callbacks: /* @__PURE__ */ new Set([subscriptionConfig.callback]),
			state: "pending"
		};
		else existingSubscription.callbacks.add(subscriptionConfig.callback);
		this._subscriptionHashByClientSubscriptionId[clientSubscriptionId] = hash;
		this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId] = async () => {
			delete this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId];
			delete this._subscriptionHashByClientSubscriptionId[clientSubscriptionId];
			const subscription = this._subscriptionsByHash[hash];
			assert(subscription !== void 0, `Could not find a \`Subscription\` when tearing down client subscription #${clientSubscriptionId}`);
			subscription.callbacks.delete(subscriptionConfig.callback);
			await this._updateSubscriptions();
		};
		this._updateSubscriptions();
		return clientSubscriptionId;
	}
	/**
	* Register a callback to be invoked whenever the specified account changes
	*
	* @param publicKey Public key of the account to monitor
	* @param callback Function to invoke whenever the account is changed
	* @param config
	* @return subscription id
	*/
	/** @deprecated Instead, pass in an {@link AccountSubscriptionConfig} */
	onAccountChange(publicKey, callback, commitmentOrConfig) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([publicKey.toBase58()], commitment || this._commitment || "finalized", "base64", config);
		return this._makeSubscription({
			callback,
			method: "accountSubscribe",
			unsubscribeMethod: "accountUnsubscribe"
		}, args);
	}
	/**
	* Deregister an account notification callback
	*
	* @param clientSubscriptionId client subscription id to deregister
	*/
	async removeAccountChangeListener(clientSubscriptionId) {
		await this._unsubscribeClientSubscription(clientSubscriptionId, "account change");
	}
	/**
	* @internal
	*/
	_wsOnProgramAccountNotification(notification) {
		const { result, subscription } = create(notification, ProgramAccountNotificationResult);
		this._handleServerNotification(subscription, [{
			accountId: result.value.pubkey,
			accountInfo: result.value.account
		}, result.context]);
	}
	/**
	* Register a callback to be invoked whenever accounts owned by the
	* specified program change
	*
	* @param programId Public key of the program to monitor
	* @param callback Function to invoke whenever the account is changed
	* @param config
	* @return subscription id
	*/
	/** @deprecated Instead, pass in a {@link ProgramAccountSubscriptionConfig} */
	onProgramAccountChange(programId, callback, commitmentOrConfig, maybeFilters) {
		const { commitment, config } = extractCommitmentFromConfig(commitmentOrConfig);
		const args = this._buildArgs([programId.toBase58()], commitment || this._commitment || "finalized", "base64", config ? config : maybeFilters ? { filters: applyDefaultMemcmpEncodingToFilters(maybeFilters) } : void 0);
		return this._makeSubscription({
			callback,
			method: "programSubscribe",
			unsubscribeMethod: "programUnsubscribe"
		}, args);
	}
	/**
	* Deregister an account notification callback
	*
	* @param clientSubscriptionId client subscription id to deregister
	*/
	async removeProgramAccountChangeListener(clientSubscriptionId) {
		await this._unsubscribeClientSubscription(clientSubscriptionId, "program account change");
	}
	/**
	* Registers a callback to be invoked whenever logs are emitted.
	*/
	onLogs(filter, callback, commitment) {
		const args = this._buildArgs([typeof filter === "object" ? { mentions: [filter.toString()] } : filter], commitment || this._commitment || "finalized");
		return this._makeSubscription({
			callback,
			method: "logsSubscribe",
			unsubscribeMethod: "logsUnsubscribe"
		}, args);
	}
	/**
	* Deregister a logs callback.
	*
	* @param clientSubscriptionId client subscription id to deregister.
	*/
	async removeOnLogsListener(clientSubscriptionId) {
		await this._unsubscribeClientSubscription(clientSubscriptionId, "logs");
	}
	/**
	* @internal
	*/
	_wsOnLogsNotification(notification) {
		const { result, subscription } = create(notification, LogsNotificationResult);
		this._handleServerNotification(subscription, [result.value, result.context]);
	}
	/**
	* @internal
	*/
	_wsOnSlotNotification(notification) {
		const { result, subscription } = create(notification, SlotNotificationResult);
		this._handleServerNotification(subscription, [result]);
	}
	/**
	* Register a callback to be invoked upon slot changes
	*
	* @param callback Function to invoke whenever the slot changes
	* @return subscription id
	*/
	onSlotChange(callback) {
		return this._makeSubscription({
			callback,
			method: "slotSubscribe",
			unsubscribeMethod: "slotUnsubscribe"
		}, []);
	}
	/**
	* Deregister a slot notification callback
	*
	* @param clientSubscriptionId client subscription id to deregister
	*/
	async removeSlotChangeListener(clientSubscriptionId) {
		await this._unsubscribeClientSubscription(clientSubscriptionId, "slot change");
	}
	/**
	* @internal
	*/
	_wsOnSlotUpdatesNotification(notification) {
		const { result, subscription } = create(notification, SlotUpdateNotificationResult);
		this._handleServerNotification(subscription, [result]);
	}
	/**
	* Register a callback to be invoked upon slot updates. {@link SlotUpdate}'s
	* may be useful to track live progress of a cluster.
	*
	* @param callback Function to invoke whenever the slot updates
	* @return subscription id
	*/
	onSlotUpdate(callback) {
		return this._makeSubscription({
			callback,
			method: "slotsUpdatesSubscribe",
			unsubscribeMethod: "slotsUpdatesUnsubscribe"
		}, []);
	}
	/**
	* Deregister a slot update notification callback
	*
	* @param clientSubscriptionId client subscription id to deregister
	*/
	async removeSlotUpdateListener(clientSubscriptionId) {
		await this._unsubscribeClientSubscription(clientSubscriptionId, "slot update");
	}
	/**
	* @internal
	*/
	async _unsubscribeClientSubscription(clientSubscriptionId, subscriptionName) {
		const dispose = this._subscriptionDisposeFunctionsByClientSubscriptionId[clientSubscriptionId];
		if (dispose) await dispose();
		else console.warn(`Ignored unsubscribe request because an active subscription with id \`${clientSubscriptionId}\` for '${subscriptionName}' events could not be found.`);
	}
	_buildArgs(args, override, encoding, extra) {
		const commitment = override || this._commitment;
		if (commitment || encoding || extra) {
			let options = {};
			if (encoding) options.encoding = encoding;
			if (commitment) options.commitment = commitment;
			if (extra) options = Object.assign(options, extra);
			args.push(options);
		}
		return args;
	}
	/**
	* @internal
	*/
	_buildArgsAtLeastConfirmed(args, override, encoding, extra) {
		const commitment = override || this._commitment;
		if (commitment && !["confirmed", "finalized"].includes(commitment)) throw new Error("Using Connection with default commitment: `" + this._commitment + "`, but method requires at least `confirmed`");
		return this._buildArgs(args, override, encoding, extra);
	}
	/**
	* @internal
	*/
	_wsOnSignatureNotification(notification) {
		const { result, subscription } = create(notification, SignatureNotificationResult);
		if (result.value !== "receivedSignature")
 /**
		* Special case.
		* After a signature is processed, RPCs automatically dispose of the
		* subscription on the server side. We need to track which of these
		* subscriptions have been disposed in such a way, so that we know
		* whether the client is dealing with a not-yet-processed signature
		* (in which case we must tear down the server subscription) or an
		* already-processed signature (in which case the client can simply
		* clear out the subscription locally without telling the server).
		*
		* NOTE: There is a proposal to eliminate this special case, here:
		* https://github.com/solana-labs/solana/issues/18892
		*/
		this._subscriptionsAutoDisposedByRpc.add(subscription);
		this._handleServerNotification(subscription, result.value === "receivedSignature" ? [{ type: "received" }, result.context] : [{
			type: "status",
			result: result.value
		}, result.context]);
	}
	/**
	* Register a callback to be invoked upon signature updates
	*
	* @param signature Transaction signature string in base 58
	* @param callback Function to invoke on signature notifications
	* @param commitment Specify the commitment level signature must reach before notification
	* @return subscription id
	*/
	onSignature(signature, callback, commitment) {
		const args = this._buildArgs([signature], commitment || this._commitment || "finalized");
		const clientSubscriptionId = this._makeSubscription({
			callback: (notification, context) => {
				if (notification.type === "status") {
					callback(notification.result, context);
					try {
						this.removeSignatureListener(clientSubscriptionId);
					} catch (_err) {}
				}
			},
			method: "signatureSubscribe",
			unsubscribeMethod: "signatureUnsubscribe"
		}, args);
		return clientSubscriptionId;
	}
	/**
	* Register a callback to be invoked when a transaction is
	* received and/or processed.
	*
	* @param signature Transaction signature string in base 58
	* @param callback Function to invoke on signature notifications
	* @param options Enable received notifications and set the commitment
	*   level that signature must reach before notification
	* @return subscription id
	*/
	onSignatureWithOptions(signature, callback, options) {
		const { commitment, ...extra } = {
			...options,
			commitment: options && options.commitment || this._commitment || "finalized"
		};
		const args = this._buildArgs([signature], commitment, void 0, extra);
		const clientSubscriptionId = this._makeSubscription({
			callback: (notification, context) => {
				callback(notification, context);
				try {
					this.removeSignatureListener(clientSubscriptionId);
				} catch (_err) {}
			},
			method: "signatureSubscribe",
			unsubscribeMethod: "signatureUnsubscribe"
		}, args);
		return clientSubscriptionId;
	}
	/**
	* Deregister a signature notification callback
	*
	* @param clientSubscriptionId client subscription id to deregister
	*/
	async removeSignatureListener(clientSubscriptionId) {
		await this._unsubscribeClientSubscription(clientSubscriptionId, "signature result");
	}
	/**
	* @internal
	*/
	_wsOnRootNotification(notification) {
		const { result, subscription } = create(notification, RootNotificationResult);
		this._handleServerNotification(subscription, [result]);
	}
	/**
	* Register a callback to be invoked upon root changes
	*
	* @param callback Function to invoke whenever the root changes
	* @return subscription id
	*/
	onRootChange(callback) {
		return this._makeSubscription({
			callback,
			method: "rootSubscribe",
			unsubscribeMethod: "rootUnsubscribe"
		}, []);
	}
	/**
	* Deregister a root notification callback
	*
	* @param clientSubscriptionId client subscription id to deregister
	*/
	async removeRootChangeListener(clientSubscriptionId) {
		await this._unsubscribeClientSubscription(clientSubscriptionId, "root change");
	}
};
/**
* Keypair signer interface
*/
/**
* An account keypair used for signing transactions.
*/
var Keypair = class Keypair {
	/**
	* Create a new keypair instance.
	* Generate random keypair if no {@link Ed25519Keypair} is provided.
	*
	* @param {Ed25519Keypair} keypair ed25519 keypair
	*/
	constructor(keypair) {
		this._keypair = void 0;
		this._keypair = keypair ?? generateKeypair();
	}
	/**
	* Generate a new random keypair
	*
	* @returns {Keypair} Keypair
	*/
	static generate() {
		return new Keypair(generateKeypair());
	}
	/**
	* Create a keypair from a raw secret key byte array.
	*
	* This method should only be used to recreate a keypair from a previously
	* generated secret key. Generating keypairs from a random seed should be done
	* with the {@link Keypair.fromSeed} method.
	*
	* @throws error if the provided secret key is invalid and validation is not skipped.
	*
	* @param secretKey secret key byte array
	* @param options skip secret key validation
	*
	* @returns {Keypair} Keypair
	*/
	static fromSecretKey(secretKey, options) {
		if (secretKey.byteLength !== 64) throw new Error("bad secret key size");
		const publicKey = secretKey.slice(32, 64);
		if (!options || !options.skipValidation) {
			const computedPublicKey = getPublicKey(secretKey.slice(0, 32));
			for (let ii = 0; ii < 32; ii++) if (publicKey[ii] !== computedPublicKey[ii]) throw new Error("provided secretKey is invalid");
		}
		return new Keypair({
			publicKey,
			secretKey
		});
	}
	/**
	* Generate a keypair from a 32 byte seed.
	*
	* @param seed seed byte array
	*
	* @returns {Keypair} Keypair
	*/
	static fromSeed(seed) {
		const publicKey = getPublicKey(seed);
		const secretKey = /* @__PURE__ */ new Uint8Array(64);
		secretKey.set(seed);
		secretKey.set(publicKey, 32);
		return new Keypair({
			publicKey,
			secretKey
		});
	}
	/**
	* The public key for this keypair
	*
	* @returns {PublicKey} PublicKey
	*/
	get publicKey() {
		return new PublicKey(this._keypair.publicKey);
	}
	/**
	* The raw secret key for this keypair
	* @returns {Uint8Array} Secret key in an array of Uint8 bytes
	*/
	get secretKey() {
		return new Uint8Array(this._keypair.secretKey);
	}
};
/**
* An enumeration of valid LookupTableInstructionType's
*/
/**
* An enumeration of valid address lookup table InstructionType's
* @internal
*/
var LOOKUP_TABLE_INSTRUCTION_LAYOUTS = Object.freeze({
	CreateLookupTable: {
		index: 0,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			u64("recentSlot"),
			import_Layout.u8("bumpSeed")
		])
	},
	FreezeLookupTable: {
		index: 1,
		layout: import_Layout.struct([import_Layout.u32("instruction")])
	},
	ExtendLookupTable: {
		index: 2,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			u64(),
			import_Layout.seq(publicKey(), import_Layout.offset(import_Layout.u32(), -8), "addresses")
		])
	},
	DeactivateLookupTable: {
		index: 3,
		layout: import_Layout.struct([import_Layout.u32("instruction")])
	},
	CloseLookupTable: {
		index: 4,
		layout: import_Layout.struct([import_Layout.u32("instruction")])
	}
});
var AddressLookupTableProgram = class {
	/**
	* @internal
	*/
	constructor() {}
	static createLookupTable(params) {
		const [lookupTableAddress, bumpSeed] = PublicKey.findProgramAddressSync([params.authority.toBuffer(), getU64Encoder().encode(params.recentSlot)], this.programId);
		const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.CreateLookupTable;
		const data = encodeData(type, {
			recentSlot: BigInt(params.recentSlot),
			bumpSeed
		});
		const keys = [
			{
				pubkey: lookupTableAddress,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: params.authority,
				isSigner: true,
				isWritable: false
			},
			{
				pubkey: params.payer,
				isSigner: true,
				isWritable: true
			},
			{
				pubkey: SystemProgram.programId,
				isSigner: false,
				isWritable: false
			}
		];
		return [new TransactionInstruction({
			programId: this.programId,
			keys,
			data
		}), lookupTableAddress];
	}
	static freezeLookupTable(params) {
		const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.FreezeLookupTable;
		const data = encodeData(type);
		const keys = [{
			pubkey: params.lookupTable,
			isSigner: false,
			isWritable: true
		}, {
			pubkey: params.authority,
			isSigner: true,
			isWritable: false
		}];
		return new TransactionInstruction({
			programId: this.programId,
			keys,
			data
		});
	}
	static extendLookupTable(params) {
		const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.ExtendLookupTable;
		const data = encodeData(type, { addresses: params.addresses.map((addr) => addr.toBytes()) });
		const keys = [{
			pubkey: params.lookupTable,
			isSigner: false,
			isWritable: true
		}, {
			pubkey: params.authority,
			isSigner: true,
			isWritable: false
		}];
		if (params.payer) keys.push({
			pubkey: params.payer,
			isSigner: true,
			isWritable: true
		}, {
			pubkey: SystemProgram.programId,
			isSigner: false,
			isWritable: false
		});
		return new TransactionInstruction({
			programId: this.programId,
			keys,
			data
		});
	}
	static deactivateLookupTable(params) {
		const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.DeactivateLookupTable;
		const data = encodeData(type);
		const keys = [{
			pubkey: params.lookupTable,
			isSigner: false,
			isWritable: true
		}, {
			pubkey: params.authority,
			isSigner: true,
			isWritable: false
		}];
		return new TransactionInstruction({
			programId: this.programId,
			keys,
			data
		});
	}
	static closeLookupTable(params) {
		const type = LOOKUP_TABLE_INSTRUCTION_LAYOUTS.CloseLookupTable;
		const data = encodeData(type);
		const keys = [
			{
				pubkey: params.lookupTable,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: params.authority,
				isSigner: true,
				isWritable: false
			},
			{
				pubkey: params.recipient,
				isSigner: false,
				isWritable: true
			}
		];
		return new TransactionInstruction({
			programId: this.programId,
			keys,
			data
		});
	}
};
AddressLookupTableProgram.programId = new PublicKey("AddressLookupTab1e1111111111111111111111111");
/**
* An enumeration of valid ComputeBudgetInstructionType's
*/
/**
* Request units instruction params
*/
/**
* Request heap frame instruction params
*/
/**
* Set compute unit limit instruction params
*/
/**
* Set compute unit price instruction params
*/
/**
* An enumeration of valid ComputeBudget InstructionType's
* @internal
*/
var COMPUTE_BUDGET_INSTRUCTION_LAYOUTS = Object.freeze({
	RequestUnits: {
		index: 0,
		layout: import_Layout.struct([
			import_Layout.u8("instruction"),
			import_Layout.u32("units"),
			import_Layout.u32("additionalFee")
		])
	},
	RequestHeapFrame: {
		index: 1,
		layout: import_Layout.struct([import_Layout.u8("instruction"), import_Layout.u32("bytes")])
	},
	SetComputeUnitLimit: {
		index: 2,
		layout: import_Layout.struct([import_Layout.u8("instruction"), import_Layout.u32("units")])
	},
	SetComputeUnitPrice: {
		index: 3,
		layout: import_Layout.struct([import_Layout.u8("instruction"), u64("microLamports")])
	}
});
/**
* Factory class for transaction instructions to interact with the Compute Budget program
*/
var ComputeBudgetProgram = class {
	/**
	* @internal
	*/
	constructor() {}
	/**
	* Public key that identifies the Compute Budget program
	*/
	/**
	* @deprecated Instead, call {@link setComputeUnitLimit} and/or {@link setComputeUnitPrice}
	*/
	static requestUnits(params) {
		const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestUnits;
		const data = encodeData(type, params);
		return new TransactionInstruction({
			keys: [],
			programId: this.programId,
			data
		});
	}
	static requestHeapFrame(params) {
		const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.RequestHeapFrame;
		const data = encodeData(type, params);
		return new TransactionInstruction({
			keys: [],
			programId: this.programId,
			data
		});
	}
	static setComputeUnitLimit(params) {
		const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.SetComputeUnitLimit;
		const data = encodeData(type, params);
		return new TransactionInstruction({
			keys: [],
			programId: this.programId,
			data
		});
	}
	static setComputeUnitPrice(params) {
		const type = COMPUTE_BUDGET_INSTRUCTION_LAYOUTS.SetComputeUnitPrice;
		const data = encodeData(type, { microLamports: BigInt(params.microLamports) });
		return new TransactionInstruction({
			keys: [],
			programId: this.programId,
			data
		});
	}
};
ComputeBudgetProgram.programId = new PublicKey("ComputeBudget111111111111111111111111111111");
var PRIVATE_KEY_BYTES$1 = 64;
var PUBLIC_KEY_BYTES$1 = 32;
var SIGNATURE_BYTES = 64;
/**
* Params for creating an ed25519 instruction using a public key
*/
/**
* Params for creating an ed25519 instruction using a private key
*/
var ED25519_INSTRUCTION_LAYOUT = import_Layout.struct([
	import_Layout.u8("numSignatures"),
	import_Layout.u8("padding"),
	import_Layout.u16("signatureOffset"),
	import_Layout.u16("signatureInstructionIndex"),
	import_Layout.u16("publicKeyOffset"),
	import_Layout.u16("publicKeyInstructionIndex"),
	import_Layout.u16("messageDataOffset"),
	import_Layout.u16("messageDataSize"),
	import_Layout.u16("messageInstructionIndex")
]);
var Ed25519Program = class Ed25519Program {
	/**
	* @internal
	*/
	constructor() {}
	/**
	* Public key that identifies the ed25519 program
	*/
	/**
	* Create an ed25519 instruction with a public key and signature. The
	* public key must be a buffer that is 32 bytes long, and the signature
	* must be a buffer of 64 bytes.
	*/
	static createInstructionWithPublicKey(params) {
		const { publicKey, message, signature, instructionIndex } = params;
		assert(publicKey.length === PUBLIC_KEY_BYTES$1, `Public Key must be ${PUBLIC_KEY_BYTES$1} bytes but received ${publicKey.length} bytes`);
		assert(signature.length === SIGNATURE_BYTES, `Signature must be ${SIGNATURE_BYTES} bytes but received ${signature.length} bytes`);
		const publicKeyOffset = ED25519_INSTRUCTION_LAYOUT.span;
		const signatureOffset = publicKeyOffset + publicKey.length;
		const messageDataOffset = signatureOffset + signature.length;
		const numSignatures = 1;
		const instructionData = Buffer$1.alloc(messageDataOffset + message.length);
		const index = instructionIndex == null ? 65535 : instructionIndex;
		ED25519_INSTRUCTION_LAYOUT.encode({
			numSignatures,
			padding: 0,
			signatureOffset,
			signatureInstructionIndex: index,
			publicKeyOffset,
			publicKeyInstructionIndex: index,
			messageDataOffset,
			messageDataSize: message.length,
			messageInstructionIndex: index
		}, instructionData);
		instructionData.fill(publicKey, publicKeyOffset);
		instructionData.fill(signature, signatureOffset);
		instructionData.fill(message, messageDataOffset);
		return new TransactionInstruction({
			keys: [],
			programId: Ed25519Program.programId,
			data: instructionData
		});
	}
	/**
	* Create an ed25519 instruction with a private key. The private key
	* must be a buffer that is 64 bytes long.
	*/
	static createInstructionWithPrivateKey(params) {
		const { privateKey, message, instructionIndex } = params;
		assert(privateKey.length === PRIVATE_KEY_BYTES$1, `Private key must be ${PRIVATE_KEY_BYTES$1} bytes but received ${privateKey.length} bytes`);
		try {
			const keypair = Keypair.fromSecretKey(privateKey);
			const publicKey = keypair.publicKey.toBytes();
			const signature = sign(message, keypair.secretKey);
			return this.createInstructionWithPublicKey({
				publicKey,
				message,
				signature,
				instructionIndex
			});
		} catch (error) {
			throw new Error(`Error creating instruction; ${error}`);
		}
	}
};
Ed25519Program.programId = new PublicKey("Ed25519SigVerify111111111111111111111111111");
var ecdsaSign = (msgHash, privKey) => {
	const signature = secp256k1.sign(msgHash, privKey);
	return [signature.toCompactRawBytes(), signature.recovery];
};
secp256k1.utils.isValidPrivateKey;
var publicKeyCreate = secp256k1.getPublicKey;
var PRIVATE_KEY_BYTES = 32;
var ETHEREUM_ADDRESS_BYTES = 20;
var PUBLIC_KEY_BYTES = 64;
/**
* Params for creating an secp256k1 instruction using a public key
*/
/**
* Params for creating an secp256k1 instruction using an Ethereum address
*/
/**
* Params for creating an secp256k1 instruction using a private key
*/
var SECP256K1_INSTRUCTION_LAYOUT = import_Layout.struct([
	import_Layout.u8("numSignatures"),
	import_Layout.u16("signatureOffset"),
	import_Layout.u8("signatureInstructionIndex"),
	import_Layout.u16("ethAddressOffset"),
	import_Layout.u8("ethAddressInstructionIndex"),
	import_Layout.u16("messageDataOffset"),
	import_Layout.u16("messageDataSize"),
	import_Layout.u8("messageInstructionIndex"),
	import_Layout.blob(20, "ethAddress"),
	import_Layout.blob(64, "signature"),
	import_Layout.u8("recoveryId")
]);
var Secp256k1Program = class Secp256k1Program {
	/**
	* @internal
	*/
	constructor() {}
	/**
	* Public key that identifies the secp256k1 program
	*/
	/**
	* Construct an Ethereum address from a secp256k1 public key buffer.
	* @param {Buffer} publicKey a 64 byte secp256k1 public key buffer
	*/
	static publicKeyToEthAddress(publicKey) {
		assert(publicKey.length === PUBLIC_KEY_BYTES, `Public key must be ${PUBLIC_KEY_BYTES} bytes but received ${publicKey.length} bytes`);
		try {
			return Buffer$1.from(keccak_256(toBuffer(publicKey))).slice(-20);
		} catch (error) {
			throw new Error(`Error constructing Ethereum address: ${error}`);
		}
	}
	/**
	* Create an secp256k1 instruction with a public key. The public key
	* must be a buffer that is 64 bytes long.
	*/
	static createInstructionWithPublicKey(params) {
		const { publicKey, message, signature, recoveryId, instructionIndex } = params;
		return Secp256k1Program.createInstructionWithEthAddress({
			ethAddress: Secp256k1Program.publicKeyToEthAddress(publicKey),
			message,
			signature,
			recoveryId,
			instructionIndex
		});
	}
	/**
	* Create an secp256k1 instruction with an Ethereum address. The address
	* must be a hex string or a buffer that is 20 bytes long.
	*/
	static createInstructionWithEthAddress(params) {
		const { ethAddress: rawAddress, message, signature, recoveryId, instructionIndex = 0 } = params;
		let ethAddress;
		if (typeof rawAddress === "string") {
			if (rawAddress.startsWith("0x")) ethAddress = Buffer$1.from(rawAddress.substr(2), "hex");
			else ethAddress = Buffer$1.from(rawAddress, "hex");
		} else ethAddress = rawAddress;
		assert(ethAddress.length === ETHEREUM_ADDRESS_BYTES, `Address must be ${ETHEREUM_ADDRESS_BYTES} bytes but received ${ethAddress.length} bytes`);
		const dataStart = 12;
		const ethAddressOffset = dataStart;
		const signatureOffset = dataStart + ethAddress.length;
		const messageDataOffset = signatureOffset + signature.length + 1;
		const numSignatures = 1;
		const instructionData = Buffer$1.alloc(SECP256K1_INSTRUCTION_LAYOUT.span + message.length);
		SECP256K1_INSTRUCTION_LAYOUT.encode({
			numSignatures,
			signatureOffset,
			signatureInstructionIndex: instructionIndex,
			ethAddressOffset,
			ethAddressInstructionIndex: instructionIndex,
			messageDataOffset,
			messageDataSize: message.length,
			messageInstructionIndex: instructionIndex,
			signature: toBuffer(signature),
			ethAddress: toBuffer(ethAddress),
			recoveryId
		}, instructionData);
		instructionData.fill(toBuffer(message), SECP256K1_INSTRUCTION_LAYOUT.span);
		return new TransactionInstruction({
			keys: [],
			programId: Secp256k1Program.programId,
			data: instructionData
		});
	}
	/**
	* Create an secp256k1 instruction with a private key. The private key
	* must be a buffer that is 32 bytes long.
	*/
	static createInstructionWithPrivateKey(params) {
		const { privateKey: pkey, message, instructionIndex } = params;
		assert(pkey.length === PRIVATE_KEY_BYTES, `Private key must be ${PRIVATE_KEY_BYTES} bytes but received ${pkey.length} bytes`);
		try {
			const privateKey = toBuffer(pkey);
			const publicKey = publicKeyCreate(privateKey, false).slice(1);
			const [signature, recoveryId] = ecdsaSign(Buffer$1.from(keccak_256(toBuffer(message))), privateKey);
			return this.createInstructionWithPublicKey({
				publicKey,
				message,
				signature,
				recoveryId,
				instructionIndex
			});
		} catch (error) {
			throw new Error(`Error creating instruction; ${error}`);
		}
	}
};
Secp256k1Program.programId = new PublicKey("KeccakSecp256k11111111111111111111111111111");
var _Lockup;
/**
* Address of the stake config account which configures the rate
* of stake warmup and cooldown as well as the slashing penalty.
*/
var STAKE_CONFIG_ID = new PublicKey("StakeConfig11111111111111111111111111111111");
/**
* Stake account lockup info
*/
var Lockup = class {
	/**
	* Create a new Lockup object
	*/
	constructor(unixTimestamp, epoch, custodian) {
		/** Unix timestamp of lockup expiration */
		this.unixTimestamp = void 0;
		/** Epoch of lockup expiration */
		this.epoch = void 0;
		/** Lockup custodian authority */
		this.custodian = void 0;
		this.unixTimestamp = unixTimestamp;
		this.epoch = epoch;
		this.custodian = custodian;
	}
};
_Lockup = Lockup;
Lockup.default = new _Lockup(0, 0, PublicKey.default);
/**
* An enumeration of valid StakeInstructionType's
*/
/**
* An enumeration of valid stake InstructionType's
* @internal
*/
var STAKE_INSTRUCTION_LAYOUTS = Object.freeze({
	Initialize: {
		index: 0,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			authorized(),
			lockup()
		])
	},
	Authorize: {
		index: 1,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			publicKey("newAuthorized"),
			import_Layout.u32("stakeAuthorizationType")
		])
	},
	Delegate: {
		index: 2,
		layout: import_Layout.struct([import_Layout.u32("instruction")])
	},
	Split: {
		index: 3,
		layout: import_Layout.struct([import_Layout.u32("instruction"), import_Layout.ns64("lamports")])
	},
	Withdraw: {
		index: 4,
		layout: import_Layout.struct([import_Layout.u32("instruction"), import_Layout.ns64("lamports")])
	},
	Deactivate: {
		index: 5,
		layout: import_Layout.struct([import_Layout.u32("instruction")])
	},
	Merge: {
		index: 7,
		layout: import_Layout.struct([import_Layout.u32("instruction")])
	},
	AuthorizeWithSeed: {
		index: 8,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			publicKey("newAuthorized"),
			import_Layout.u32("stakeAuthorizationType"),
			rustString("authoritySeed"),
			publicKey("authorityOwner")
		])
	}
});
Object.freeze({
	Staker: { index: 0 },
	Withdrawer: { index: 1 }
});
/**
* Factory class for transactions to interact with the Stake program
*/
var StakeProgram = class {
	/**
	* @internal
	*/
	constructor() {}
	/**
	* Public key that identifies the Stake program
	*/
	/**
	* Generate an Initialize instruction to add to a Stake Create transaction
	*/
	static initialize(params) {
		const { stakePubkey, authorized, lockup: maybeLockup } = params;
		const lockup = maybeLockup || Lockup.default;
		const type = STAKE_INSTRUCTION_LAYOUTS.Initialize;
		const data = encodeData(type, {
			authorized: {
				staker: toBuffer(authorized.staker.toBuffer()),
				withdrawer: toBuffer(authorized.withdrawer.toBuffer())
			},
			lockup: {
				unixTimestamp: lockup.unixTimestamp,
				epoch: lockup.epoch,
				custodian: toBuffer(lockup.custodian.toBuffer())
			}
		});
		return new TransactionInstruction({
			keys: [{
				pubkey: stakePubkey,
				isSigner: false,
				isWritable: true
			}, {
				pubkey: SYSVAR_RENT_PUBKEY,
				isSigner: false,
				isWritable: false
			}],
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a Transaction that creates a new Stake account at
	*   an address generated with `from`, a seed, and the Stake programId
	*/
	static createAccountWithSeed(params) {
		const transaction = new Transaction();
		transaction.add(SystemProgram.createAccountWithSeed({
			fromPubkey: params.fromPubkey,
			newAccountPubkey: params.stakePubkey,
			basePubkey: params.basePubkey,
			seed: params.seed,
			lamports: params.lamports,
			space: this.space,
			programId: this.programId
		}));
		const { stakePubkey, authorized, lockup } = params;
		return transaction.add(this.initialize({
			stakePubkey,
			authorized,
			lockup
		}));
	}
	/**
	* Generate a Transaction that creates a new Stake account
	*/
	static createAccount(params) {
		const transaction = new Transaction();
		transaction.add(SystemProgram.createAccount({
			fromPubkey: params.fromPubkey,
			newAccountPubkey: params.stakePubkey,
			lamports: params.lamports,
			space: this.space,
			programId: this.programId
		}));
		const { stakePubkey, authorized, lockup } = params;
		return transaction.add(this.initialize({
			stakePubkey,
			authorized,
			lockup
		}));
	}
	/**
	* Generate a Transaction that delegates Stake tokens to a validator
	* Vote PublicKey. This transaction can also be used to redelegate Stake
	* to a new validator Vote PublicKey.
	*/
	static delegate(params) {
		const { stakePubkey, authorizedPubkey, votePubkey } = params;
		const type = STAKE_INSTRUCTION_LAYOUTS.Delegate;
		const data = encodeData(type);
		return new Transaction().add({
			keys: [
				{
					pubkey: stakePubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: votePubkey,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: SYSVAR_CLOCK_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: STAKE_CONFIG_ID,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: authorizedPubkey,
					isSigner: true,
					isWritable: false
				}
			],
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a Transaction that authorizes a new PublicKey as Staker
	* or Withdrawer on the Stake account.
	*/
	static authorize(params) {
		const { stakePubkey, authorizedPubkey, newAuthorizedPubkey, stakeAuthorizationType, custodianPubkey } = params;
		const type = STAKE_INSTRUCTION_LAYOUTS.Authorize;
		const data = encodeData(type, {
			newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
			stakeAuthorizationType: stakeAuthorizationType.index
		});
		const keys = [
			{
				pubkey: stakePubkey,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: SYSVAR_CLOCK_PUBKEY,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: authorizedPubkey,
				isSigner: true,
				isWritable: false
			}
		];
		if (custodianPubkey) keys.push({
			pubkey: custodianPubkey,
			isSigner: true,
			isWritable: false
		});
		return new Transaction().add({
			keys,
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a Transaction that authorizes a new PublicKey as Staker
	* or Withdrawer on the Stake account.
	*/
	static authorizeWithSeed(params) {
		const { stakePubkey, authorityBase, authoritySeed, authorityOwner, newAuthorizedPubkey, stakeAuthorizationType, custodianPubkey } = params;
		const type = STAKE_INSTRUCTION_LAYOUTS.AuthorizeWithSeed;
		const data = encodeData(type, {
			newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
			stakeAuthorizationType: stakeAuthorizationType.index,
			authoritySeed,
			authorityOwner: toBuffer(authorityOwner.toBuffer())
		});
		const keys = [
			{
				pubkey: stakePubkey,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: authorityBase,
				isSigner: true,
				isWritable: false
			},
			{
				pubkey: SYSVAR_CLOCK_PUBKEY,
				isSigner: false,
				isWritable: false
			}
		];
		if (custodianPubkey) keys.push({
			pubkey: custodianPubkey,
			isSigner: true,
			isWritable: false
		});
		return new Transaction().add({
			keys,
			programId: this.programId,
			data
		});
	}
	/**
	* @internal
	*/
	static splitInstruction(params) {
		const { stakePubkey, authorizedPubkey, splitStakePubkey, lamports } = params;
		const type = STAKE_INSTRUCTION_LAYOUTS.Split;
		const data = encodeData(type, { lamports });
		return new TransactionInstruction({
			keys: [
				{
					pubkey: stakePubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: splitStakePubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: authorizedPubkey,
					isSigner: true,
					isWritable: false
				}
			],
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a Transaction that splits Stake tokens into another stake account
	*/
	static split(params, rentExemptReserve) {
		const transaction = new Transaction();
		transaction.add(SystemProgram.createAccount({
			fromPubkey: params.authorizedPubkey,
			newAccountPubkey: params.splitStakePubkey,
			lamports: rentExemptReserve,
			space: this.space,
			programId: this.programId
		}));
		return transaction.add(this.splitInstruction(params));
	}
	/**
	* Generate a Transaction that splits Stake tokens into another account
	* derived from a base public key and seed
	*/
	static splitWithSeed(params, rentExemptReserve) {
		const { stakePubkey, authorizedPubkey, splitStakePubkey, basePubkey, seed, lamports } = params;
		const transaction = new Transaction();
		transaction.add(SystemProgram.allocate({
			accountPubkey: splitStakePubkey,
			basePubkey,
			seed,
			space: this.space,
			programId: this.programId
		}));
		if (rentExemptReserve && rentExemptReserve > 0) transaction.add(SystemProgram.transfer({
			fromPubkey: params.authorizedPubkey,
			toPubkey: splitStakePubkey,
			lamports: rentExemptReserve
		}));
		return transaction.add(this.splitInstruction({
			stakePubkey,
			authorizedPubkey,
			splitStakePubkey,
			lamports
		}));
	}
	/**
	* Generate a Transaction that merges Stake accounts.
	*/
	static merge(params) {
		const { stakePubkey, sourceStakePubKey, authorizedPubkey } = params;
		const type = STAKE_INSTRUCTION_LAYOUTS.Merge;
		const data = encodeData(type);
		return new Transaction().add({
			keys: [
				{
					pubkey: stakePubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: sourceStakePubKey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: SYSVAR_CLOCK_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: authorizedPubkey,
					isSigner: true,
					isWritable: false
				}
			],
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a Transaction that withdraws deactivated Stake tokens.
	*/
	static withdraw(params) {
		const { stakePubkey, authorizedPubkey, toPubkey, lamports, custodianPubkey } = params;
		const type = STAKE_INSTRUCTION_LAYOUTS.Withdraw;
		const data = encodeData(type, { lamports });
		const keys = [
			{
				pubkey: stakePubkey,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: toPubkey,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: SYSVAR_CLOCK_PUBKEY,
				isSigner: false,
				isWritable: false
			},
			{
				pubkey: SYSVAR_STAKE_HISTORY_PUBKEY,
				isSigner: false,
				isWritable: false
			},
			{
				pubkey: authorizedPubkey,
				isSigner: true,
				isWritable: false
			}
		];
		if (custodianPubkey) keys.push({
			pubkey: custodianPubkey,
			isSigner: true,
			isWritable: false
		});
		return new Transaction().add({
			keys,
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a Transaction that deactivates Stake tokens.
	*/
	static deactivate(params) {
		const { stakePubkey, authorizedPubkey } = params;
		const type = STAKE_INSTRUCTION_LAYOUTS.Deactivate;
		const data = encodeData(type);
		return new Transaction().add({
			keys: [
				{
					pubkey: stakePubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: SYSVAR_CLOCK_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: authorizedPubkey,
					isSigner: true,
					isWritable: false
				}
			],
			programId: this.programId,
			data
		});
	}
};
StakeProgram.programId = new PublicKey("Stake11111111111111111111111111111111111111");
/**
* Max space of a Stake account
*
* This is generated from the solana-stake-program StakeState struct as
* `StakeStateV2::size_of()`:
* https://docs.rs/solana-stake-program/latest/solana_stake_program/stake_state/enum.StakeStateV2.html
*/
StakeProgram.space = 200;
/**
* An enumeration of valid VoteInstructionType's
*/
/** @internal */
var VOTE_INSTRUCTION_LAYOUTS = Object.freeze({
	InitializeAccount: {
		index: 0,
		layout: import_Layout.struct([import_Layout.u32("instruction"), voteInit()])
	},
	Authorize: {
		index: 1,
		layout: import_Layout.struct([
			import_Layout.u32("instruction"),
			publicKey("newAuthorized"),
			import_Layout.u32("voteAuthorizationType")
		])
	},
	Withdraw: {
		index: 3,
		layout: import_Layout.struct([import_Layout.u32("instruction"), import_Layout.ns64("lamports")])
	},
	UpdateValidatorIdentity: {
		index: 4,
		layout: import_Layout.struct([import_Layout.u32("instruction")])
	},
	AuthorizeWithSeed: {
		index: 10,
		layout: import_Layout.struct([import_Layout.u32("instruction"), voteAuthorizeWithSeedArgs()])
	}
});
Object.freeze({
	Voter: { index: 0 },
	Withdrawer: { index: 1 }
});
/**
* Factory class for transactions to interact with the Vote program
*/
var VoteProgram = class VoteProgram {
	/**
	* @internal
	*/
	constructor() {}
	/**
	* Public key that identifies the Vote program
	*/
	/**
	* Generate an Initialize instruction.
	*/
	static initializeAccount(params) {
		const { votePubkey, nodePubkey, voteInit } = params;
		const type = VOTE_INSTRUCTION_LAYOUTS.InitializeAccount;
		const data = encodeData(type, { voteInit: {
			nodePubkey: toBuffer(voteInit.nodePubkey.toBuffer()),
			authorizedVoter: toBuffer(voteInit.authorizedVoter.toBuffer()),
			authorizedWithdrawer: toBuffer(voteInit.authorizedWithdrawer.toBuffer()),
			commission: voteInit.commission
		} });
		return new TransactionInstruction({
			keys: [
				{
					pubkey: votePubkey,
					isSigner: false,
					isWritable: true
				},
				{
					pubkey: SYSVAR_RENT_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: SYSVAR_CLOCK_PUBKEY,
					isSigner: false,
					isWritable: false
				},
				{
					pubkey: nodePubkey,
					isSigner: true,
					isWritable: false
				}
			],
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction that creates a new Vote account.
	*/
	static createAccount(params) {
		const transaction = new Transaction();
		transaction.add(SystemProgram.createAccount({
			fromPubkey: params.fromPubkey,
			newAccountPubkey: params.votePubkey,
			lamports: params.lamports,
			space: this.space,
			programId: this.programId
		}));
		return transaction.add(this.initializeAccount({
			votePubkey: params.votePubkey,
			nodePubkey: params.voteInit.nodePubkey,
			voteInit: params.voteInit
		}));
	}
	/**
	* Generate a transaction that authorizes a new Voter or Withdrawer on the Vote account.
	*/
	static authorize(params) {
		const { votePubkey, authorizedPubkey, newAuthorizedPubkey, voteAuthorizationType } = params;
		const type = VOTE_INSTRUCTION_LAYOUTS.Authorize;
		const data = encodeData(type, {
			newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
			voteAuthorizationType: voteAuthorizationType.index
		});
		const keys = [
			{
				pubkey: votePubkey,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: SYSVAR_CLOCK_PUBKEY,
				isSigner: false,
				isWritable: false
			},
			{
				pubkey: authorizedPubkey,
				isSigner: true,
				isWritable: false
			}
		];
		return new Transaction().add({
			keys,
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction that authorizes a new Voter or Withdrawer on the Vote account
	* where the current Voter or Withdrawer authority is a derived key.
	*/
	static authorizeWithSeed(params) {
		const { currentAuthorityDerivedKeyBasePubkey, currentAuthorityDerivedKeyOwnerPubkey, currentAuthorityDerivedKeySeed, newAuthorizedPubkey, voteAuthorizationType, votePubkey } = params;
		const type = VOTE_INSTRUCTION_LAYOUTS.AuthorizeWithSeed;
		const data = encodeData(type, { voteAuthorizeWithSeedArgs: {
			currentAuthorityDerivedKeyOwnerPubkey: toBuffer(currentAuthorityDerivedKeyOwnerPubkey.toBuffer()),
			currentAuthorityDerivedKeySeed,
			newAuthorized: toBuffer(newAuthorizedPubkey.toBuffer()),
			voteAuthorizationType: voteAuthorizationType.index
		} });
		const keys = [
			{
				pubkey: votePubkey,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: SYSVAR_CLOCK_PUBKEY,
				isSigner: false,
				isWritable: false
			},
			{
				pubkey: currentAuthorityDerivedKeyBasePubkey,
				isSigner: true,
				isWritable: false
			}
		];
		return new Transaction().add({
			keys,
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction to withdraw from a Vote account.
	*/
	static withdraw(params) {
		const { votePubkey, authorizedWithdrawerPubkey, lamports, toPubkey } = params;
		const type = VOTE_INSTRUCTION_LAYOUTS.Withdraw;
		const data = encodeData(type, { lamports });
		const keys = [
			{
				pubkey: votePubkey,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: toPubkey,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: authorizedWithdrawerPubkey,
				isSigner: true,
				isWritable: false
			}
		];
		return new Transaction().add({
			keys,
			programId: this.programId,
			data
		});
	}
	/**
	* Generate a transaction to withdraw safely from a Vote account.
	*
	* This function was created as a safeguard for vote accounts running validators, `safeWithdraw`
	* checks that the withdraw amount will not exceed the specified balance while leaving enough left
	* to cover rent. If you wish to close the vote account by withdrawing the full amount, call the
	* `withdraw` method directly.
	*/
	static safeWithdraw(params, currentVoteAccountBalance, rentExemptMinimum) {
		if (params.lamports > currentVoteAccountBalance - rentExemptMinimum) throw new Error("Withdraw will leave vote account with insufficient funds.");
		return VoteProgram.withdraw(params);
	}
	/**
	* Generate a transaction to update the validator identity (node pubkey) of a Vote account.
	*/
	static updateValidatorIdentity(params) {
		const { votePubkey, authorizedWithdrawerPubkey, nodePubkey } = params;
		const type = VOTE_INSTRUCTION_LAYOUTS.UpdateValidatorIdentity;
		const data = encodeData(type);
		const keys = [
			{
				pubkey: votePubkey,
				isSigner: false,
				isWritable: true
			},
			{
				pubkey: nodePubkey,
				isSigner: true,
				isWritable: false
			},
			{
				pubkey: authorizedWithdrawerPubkey,
				isSigner: true,
				isWritable: false
			}
		];
		return new Transaction().add({
			keys,
			programId: this.programId,
			data
		});
	}
};
VoteProgram.programId = new PublicKey("Vote111111111111111111111111111111111111111");
/**
* Max space of a Vote account
*
* This is generated from the solana-vote-program VoteState struct as
* `VoteState::size_of()`:
* https://docs.rs/solana-vote-program/1.9.5/solana_vote_program/vote_state/struct.VoteState.html#method.size_of
*
* KEEP IN SYNC WITH `VoteState::size_of()` in https://github.com/solana-labs/solana/blob/a474cb24b9238f5edcc982f65c0b37d4a1046f7e/sdk/program/src/vote/state/mod.rs#L340-L342
*/
VoteProgram.space = 3762;
new PublicKey("Va1idator1nfo111111111111111111111111111111");
type({
	name: string(),
	website: optional(string()),
	details: optional(string()),
	iconUrl: optional(string()),
	keybaseUsername: optional(string())
});
new PublicKey("Vote111111111111111111111111111111111111111");
import_Layout.struct([
	publicKey("nodePubkey"),
	publicKey("authorizedWithdrawer"),
	import_Layout.u8("commission"),
	import_Layout.nu64(),
	import_Layout.seq(import_Layout.struct([import_Layout.nu64("slot"), import_Layout.u32("confirmationCount")]), import_Layout.offset(import_Layout.u32(), -8), "votes"),
	import_Layout.u8("rootSlotValid"),
	import_Layout.nu64("rootSlot"),
	import_Layout.nu64(),
	import_Layout.seq(import_Layout.struct([import_Layout.nu64("epoch"), publicKey("authorizedVoter")]), import_Layout.offset(import_Layout.u32(), -8), "authorizedVoters"),
	import_Layout.struct([
		import_Layout.seq(import_Layout.struct([
			publicKey("authorizedPubkey"),
			import_Layout.nu64("epochOfLastAuthorizedSwitch"),
			import_Layout.nu64("targetEpoch")
		]), 32, "buf"),
		import_Layout.nu64("idx"),
		import_Layout.u8("isEmpty")
	], "priorVoters"),
	import_Layout.nu64(),
	import_Layout.seq(import_Layout.struct([
		import_Layout.nu64("epoch"),
		import_Layout.nu64("credits"),
		import_Layout.nu64("prevCredits")
	]), import_Layout.offset(import_Layout.u32(), -8), "epochCredits"),
	import_Layout.struct([import_Layout.nu64("slot"), import_Layout.nu64("timestamp")], "lastTimestamp")
]);
//#endregion
export { PublicKey as n, require_bs58 as r, Connection as t };
