/**
 * @template T
 */
export class ByRef {
    #getter;
    #setter;

    /**
     * 
     * @param {() => T} getter 
     * @param {((value: T) => void)=} [setter=null] 
     */
    constructor(getter, setter) {
        if (!getter) {
            throw new Error("Cannot create a ByRef without a valid getter.");
        }
        this.#getter = getter;
        this.#setter = setter || null;
    }

    /** Get or set the value of the referenced object. */
    get ref() {
        return this.#getter();
    }

    set ref(value) {
        if (this.isReadOnly) {
            throw new Error("Cannot set the value of a read-only reference.");
        }

        this.#setter(value);
    }

    /** Gets whether this ByRef is read-only. */
    get isReadOnly() {
        return !this.#setter;
    }

    /** Gets this ByRef as a new read-only ByRef. */
    asReadOnly() {
        return new ByRef(this.#getter);
    }

    /**
     * Creates a ByRef that can be used to read or write the value of a specified key.
     * @template TObject
     * @template {TObject[keyof TObject]} TValue
     * @param {TObject} object
     * @param {keyof any} key 
     * @returns {ByRef<TValue>}
     */
    static createKeyAccessor(object, key) {
        const getter = () => object[key];
        const setter = ((/** @type {TValue} */ value) => object[key] = value);

        return new ByRef(getter, setter);
    }
}