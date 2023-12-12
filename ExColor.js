/**
 * @typedef {[number, number, number, number?]} ColorArray
 */

/**
 * @typedef {object} RgbaObject
 * @property {number} r - The red value (0-255).
 * @property {number} g - The green value (0-255).
 * @property {number} b - The blue value (0-255).
 * @property {number=} a - The alpha value (0-255).
 */

/**
 * @typedef {object} HslaObject
 * @property {number} h - The hue value (0-1).
 * @property {number} s - The saturation value (0-1).
 * @property {number} l - The luminosity value (0-1).
 * @property {number=} a - The alpha value (0-1).
 */

/**
 * Provides many utility methods to convert between color representations.
 */
export class ExColor {
    /** @type {ColorArray?} */ #rgba;
    /** @type {ColorArray?} */ #hsla;
    /** @type {String?} */ #hex;

    /**
     * @hideconstructor 
     * Use the static constructor functions `ExColor.fromRgb()` and `ExColor.fromHsl()` instead.
     * 
     * Creates a new `ExColor` object with the specified RGB values. At least one object must be provided.
     * 
     * @param {ColorArray | RgbaObject | null} rgba An array of numbers `[r, g, b, a?]` or an object `{ r: number, g: number, b: number, a?: number }`. 
     * Numbers should be within the range `0-255`.
     * 
     * @param {ColorArray | HslaObject | null} hsla An array of numbers `[h, s, l, a?]` or an object `{ h: number, s: number, l: number, a?: number }`. 
     * Numbers should be within the range `0-1`.
     * 
     * 
     * The only validation done is checking for an array or an object for performance reasons.
     */
    constructor(rgba, hsla) {
        if (!rgba && !hsla)
            throw new Error(`No arguments provided to constructor.`);

        if (rgba) {
            if (Array.isArray(rgba)) {
                this.#rgba = rgba;
            } else if (typeof rgba === 'object') {
                this.#rgba = [rgba.r, rgba.g, rgba.b, rgba.a];
            } else {
                throw new TypeError(`Unsupported data type '${typeof rgba}'.`);
            }
        }

        if (hsla) {
            if (Array.isArray(hsla)) {
                this.#hsla = hsla;
            } else if (typeof hsla === 'object') {
                this.#hsla = [hsla.h, hsla.s, hsla.l, hsla.a];
            } else {
                throw new TypeError(`Unsupported data type '${typeof hsla}'.`);
            }
        }
    }

    /**
     * 
     * @returns {RgbaObject}
     */
    toRgb() {
        if (!this.#rgba) {
            this.#rgba = ExColor.hsl2rgb(this.#hsla);
        }
        
        const [r, g, b, a] = this.#rgba;
        return {r, g, b, a};
    }

    /**
     * 
     * @returns {HslaObject}
     */
    toHsl() {
        if (!this.#hsla) {
            this.#hsla = ExColor.rgb2hsl(this.#rgba);
        }

        const [h, s, l, a] = this.#hsla;
        return {h, s, l, a};
    }

    /**
     * Converts this color value to a hex color string. The resulting string does not have a leading hash `#`.
     * 
     * @param {boolean} shortform If `true`, will return a shortform version of the hex color if possible.
     * @returns {string}
     */
    toHex(shortform = false) {
        if (!this.#hex) {
            if (!this.#rgba) {
                this.#rgba = ExColor.hsl2rgb(this.#hsla);
            }

            this.#hex = ExColor.rgb2hex(this.#rgba);
        }

        let hex = this.#hex;
        if (shortform) {
            hex = ExColor.hexLongToShort(hex) || hex;
        }

        return hex;
    }

    /**
     * Creates a new `ExColor` object from the specified RGBA values.
     * 
     * @param {ColorArray | RgbaObject} rgba An array of numbers `[r, g, b, a?]` or an object `{ r: number, g: number, b: number, a?: number }`. 
     * Numbers should be within the range `0-255`.
     * 
     * The only validation done is checking for an array or an object for performance reasons.
     * 
     * @returns {ExColor}
     */
    static fromRgb(rgba) {
        return new ExColor(rgba, null);
    }
    
    /**
     * Creates a new `ExColor` object from the specified HSLA values.
     * 
     * @param {ColorArray | HslaObject} hsla An array of numbers `[h, s, l, a?]` or an object `{ h: number, s: number, l: number, a?: number }`. 
     * Numbers should be within the range `0-1`.
     * 
     * The only validation done is checking for an array or an object for performance reasons.
     * 
     * @returns {ExColor}
     */
    static fromHsl(hsla) {
        return new ExColor(null, hsla);
    }

    /**
     * Creates a new `ExColor` object from the specified hex color value.
     * 
     * @param {string} hex A string with an optional leading hash `#`, followed by exactly three or six hexadecimal characters.
     * @param {number=} alpha An optional alpha value between `0-255`.
     * 
     * The only validation done is checking for an array or an object for performance reasons.
     * 
     * @returns {ExColor}
     */
    static fromHex(hex, alpha) {
        const rgba = ExColor.hex2rgb(hex, alpha);
        return new ExColor(rgba, null);
    }

    /**
     * Converts the specified RGBA values to HSLA. The alpha value is scaled to fit the resulting range.
     * 
     * @param {ColorArray | RgbaObject} rgba An array of numbers `[r, g, b, a?]` or an object `{ r: number, g: number, b: number, a?: number }`.
     * Numbers should be within the range `0-255`.
     * 
     * @returns {ColorArray} The resulting HSLA values, in the range `0-1`.
     */
    static rgb2hsl(rgba) {
        let r, g, b, a;
        if (Array.isArray(rgba)) {
            [r, g, b, a = 255] = rgba;
        } else if (typeof rgba === 'object') {
            [r, g, b, a = 255] = [rgba.r, rgba.g, rgba.b, rgba.a];
        } else {
            throw new TypeError(`Unsupported data type '${typeof rgba}'.`);
        }

        r /= 255;
        g /= 255;
        b /= 255;
        a /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const maxMin = (max + min);

        let h, s, l = maxMin / 2;
        if (max !== min) {
            let d = max - min;
            s = l > 0.5 ? d / (2 - d) : d / maxMin;

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4;
            }

            h /= 6;
        } else { // achromatic
            h = s = 0;
        }

        return [h, s, l, a];
    }

    /**
     * Converts the specified HSLA values to RGBA. The alpha value is scaled to fit the resulting range.
     * 
     * @param {ColorArray | HslaObject} hsla An array of numbers `[h, s, l, a?]` or an object `{ h: number, s: number, l: number, a?: number }`.
     * Numbers should be within the range `0-1`.
     * 
     * @returns {ColorArray} The resulting RGBA values, in the range `0-255`.
     */
    static hsl2rgb(hsla) {
        let h, s, l, a;
        if (Array.isArray(hsla)) {
            [h, s, l, a = 1] = hsla;
        } else if (typeof hsla === 'object') {
            [h, s, l, a = 1] = [hsla.h, hsla.s, hsla.l, hsla.a];
        } else {
            throw new TypeError(`Unsupported data type '${typeof hsla}'.`);
        }

        let r, g, b;
        if (s !== 0) {
            function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            let q = l < 0.5 
                ? l * (1 + s) 
                : l + s - l * s;
            let p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        } else { // achromatic
            r = g = b = l;
        }

        r = Math.round(r * 255);
        g = Math.round(g * 255);
        b = Math.round(b * 255);
        a = Math.round(a * 255);
        return [r, g, b, a];
    }

    /**
     * Converts the specified RGB value into a hex color string. The resulting string does not have a leading hash `#`.
     * @param {ColorArray | RgbaObject} rgb 
     * @returns {string}
     */
    static rgb2hex(rgb) {
        let r, g, b;
        if (Array.isArray(rgb)) {
            [r, g, b] = rgb;
        } else if (typeof rgb === 'object') {
            [r, g, b] = [rgb.r, rgb.g, rgb.b];
        } else {
            throw new TypeError(`Unsupported data type '${typeof rgb}'.`);
        }

        function num2hex(num) {
            const hex = num.toString(16);
            return hex.length == 1 ? '0' + hex : hex;
        }

        return num2hex(r) + num2hex(g) + num2hex(b);
    }

    /**
     * Converts the specified HSL value into a hex color string. The resulting string does not have a leading hash `#`.
     * 
     * This function works by first converting to RGB.
     * 
     * @param {ColorArray | HslaObject} hsl 
     * @returns {string}
     */
    static hsl2hex(hsl) {
        let rgb = ExColor.hsl2rgb(hsl);
        return ExColor.rgb2hex(rgb);
    }

    /**
     * Converts the specified hex color value into an RGB value. Does not support alpha.
     * 
     * @param {string} hex A string with an optional leading hash `#` followed by exactly three or six hexadecimal characters.
     * @param {number=} alpha An optional alpha value between `0-255`.
     * @returns {ColorArray}
     */
    static hex2rgb(hex, alpha) {
        hex = this.#hexNormalize(hex);
        if (hex.length === 3) hex = ExColor.hexShortToLong(hex);

        let r = parseInt(hex.slice(0, 2), 16);
        let g = parseInt(hex.slice(2, 4), 16);
        let b = parseInt(hex.slice(4, 6), 16);
        return [r, g, b, alpha];
    }

    /**
     * Gets whether the given object is a valid hex color string. A leading hash `#` is allowed.
     * 
     * @param {any} obj
     * @returns {boolean}
     */
    static isValidHexString(obj) {
        if (typeof obj !== 'string') return false;
        return /^#?(?:[0-9A-F]{3}){1,2}$/i.test(obj);
    }

    /**
     * Returns whether the specified long hex string can be converted to shortform. Returns `true` if the hex string is already short.
     * @param {string} hex
     * @returns {boolean}
     */
    static hexCanBeShort(hex) {
        hex = this.#hexNormalize(hex);
        if (hex.length === 3) return true;

        return hex[0] == hex[1] &&
               hex[2] == hex[3] &&
               hex[4] == hex[5];
    }

    /**
     * @param {string} hex
     * @returns {boolean}
     */
    static hexIsShort(hex) {
        hex = this.#hexNormalize(hex);
        return length === 3;
    }

    /**
     * Converts the specified long hex color string into shortform. 
     * Returns `hex` if it is already short. 
     * Returns `null` if it cannot be represented in shortform.
     * 
     * @param {string} hex
     * @returns {string?}
     */
    static hexLongToShort(hex) {
        hex = this.#hexNormalize(hex);
        if (!this.hexCanBeShort(hex)) return null;
        if (hex.length === 3) return hex;

        return hex[0] + hex [2] + hex[4];
    }

    /**
     * Converts the specified short hex color string into longform.
     * 
     * @param {string} hex
     * @returns {string}
     */
    static hexShortToLong(hex) {
        hex = this.#hexNormalize(hex);
        if (hex.length === 6) return hex;
        
        return hex[0] + hex[0] +
               hex[1] + hex[1] +
               hex[2] + hex[2];
    }

    /**
     * Ensures the given hex string has a leading hash.
     * 
     * @param {string} hex 
     * @returns {string}
     */
    static getHexWithHash(hex) {
        hex = this.#hexNormalize(hex);
        return '#' + hex;
    }

    /**
     * Gets the given hex string without any leading hash.
     * 
     * @param {string} hex 
     * @returns {string}
     */
    static getHexWithoutHash(hex) {
        return this.#hexNormalize(hex);
    }

    /**
     * Trims any beginning hash `#` from the hex string and throws on an invalid hex color string.
     * 
     * @param {any} hex 
     * @returns {string}
     */
    static #hexNormalize(hex) {
        if (!this.isValidHexString(hex)) 
            throw new TypeError("Invalid hex color string.");

        hex = hex.substring(hex.lastIndexOf('#') + 1);
        return hex;
    }
}