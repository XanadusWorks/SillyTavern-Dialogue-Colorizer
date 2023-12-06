import { getContext } from "../../../extensions.js";
import { power_user } from "../../../power-user.js";
import { stringFormat } from "./utils.js";

/**
 * @typedef {ValueOf<typeof CharacterType>} CharacterType
 * @readonly
 */
export const CharacterType = {
    CHARACTER: "character",
    PERSONA: "persona",
    SYSTEM: "system"
};

const PRIVATE_CTOR_KEY = Symbol();
const SYSTEM_AVATAR_PATH = "img/five.png";
const CharTypeToAvatarSrcFmt = {
    [CharacterType.CHARACTER]: {
        ["thumbnail"]: "/thumbnail?type=avatar&file={0}",
        ["full"]: "/characters/{0}",
    },
    [CharacterType.PERSONA]: {
        ["thumbnail"]: "/User Avatars/{0}",
        ["full"]: "/User Avatars/{0}",
    },
    [CharacterType.SYSTEM]: {
        ["thumbnail"]: SYSTEM_AVATAR_PATH,
        ["full"]: SYSTEM_AVATAR_PATH,
    },
};

/**
 * Represents a SillyTavern character, which can be a character, user persona or the system.
 * Provides a consistent way to get avatar images for any characer type.
 */
export class STCharacter {
    /** @readonly */
    static #systemChar = new STCharacter(PRIVATE_CTOR_KEY, CharacterType.SYSTEM, SYSTEM_AVATAR_PATH);
    
    #charType;
    #avatarName;

    /**
     * Private constructor; use the {@link STCharacter}.from[...] factory methods instead.
     * 
     * @param {symbol} ctorKey 
     * @param {CharacterType} charType 
     * @param {string} avatarName 
     */
    constructor(ctorKey, charType, avatarName) {
        if (ctorKey !== PRIVATE_CTOR_KEY) {
            throw new TypeError("Cannot call private constructor on STCharacter.");
        }

        this.#charType = charType;
        this.#avatarName = avatarName;
    }

    /** Gets the character type. */
    get type() {
        return this.#charType;
    }

    /** Gets the character's avatar file name. */
    get avatarName() {
        return this.#avatarName;
    }

    /** Gets the image file path of the character's avatar. */
    get avatarImageFilePath() {
        const avatarPathFmt = CharTypeToAvatarSrcFmt[this.#charType]["full"];
        return stringFormat(avatarPathFmt, encodeURIComponent(this.#avatarName));
    }
    
    /** Gets the thumbnail image file path of the character's avatar. */
    get avatarImageThumbnailFilePath() {
        const avatarPathFmt = CharTypeToAvatarSrcFmt[this.#charType]["thumbnail"];
        return stringFormat(avatarPathFmt, encodeURIComponent(this.#avatarName));
    }

    /** Gets a unique string identifier with the character's type and avatar name. */
    get uid() {
        return `${this.#charType}|${this.#avatarName}`;
    }

    /** Creates and returns a new image element of the character's avatar. */
    getAvatarImage() {
        return this.#getAvatar(false);
    }

    /** Creates and returns a new image element of the character's thumbnail avatar. */
    getAvatarImageThumbnail() {
        return this.#getAvatar(true);
    }

    /**
     * 
     * @param {boolean} thumbnail 
     */
    #getAvatar(thumbnail) {
        const avatarSrc = thumbnail
            ? this.avatarImageThumbnailFilePath
            : this.avatarImageFilePath;

        const avatarImage = new Image();
        avatarImage.src = avatarSrc;
        return avatarImage;
    }

    /** 
     * Gets the character representing the system. 
     * @readonly
     * */
    static get System() {
        return this.#systemChar;
    }

    /**
     * Creates a new character of the specified type by using `name` to look up the character's avatar name.
     * Prefer using {@linkcode STCharacter.fromAvatar()} where possible.
     * 
     * @param {CharacterType} charType The character type.
     * @param {string} name The character name.
     * @returns {STCharacter}
     */
    static fromName(charType, name) {
        if (!name) {
            throw new Error("Invalid/empty character name.");
        }
        const avatarFileName = getAvatarFileNameFromCharName(charType, name);
        return new STCharacter(PRIVATE_CTOR_KEY, charType, avatarFileName);
    }

    /**
     * Creates a new character of the specified type with the given avatar file name.
     * 
     * @param {CharacterType} charType The character type.
     * @param {string} avatarFileName The avatar file name. This must be the name alone and not a path.
     * @returns {STCharacter}
     */
    static fromAvatar(charType, avatarFileName) {
        validateAvatarName(charType, avatarFileName);
        return new STCharacter(PRIVATE_CTOR_KEY, charType, avatarFileName);
    }
}

/**
 * 
 * @param {CharacterType} charType 
 * @param {string} name 
 * @returns {string}
 */
function getAvatarFileNameFromCharName(charType, name) {
    let avatarFileName;
    switch (charType) {
        case CharacterType.CHARACTER: {
            const character = getContext().characters.find(char => char.name === name);
            if (!character) {
                throw new Error(`Couldn't find '${name}' in character list; is the character list initialized?`);
            }

            avatarFileName = character.avatar;
        }
        case CharacterType.PERSONA: {
            const personaId = Object.keys(power_user.personas).find(avatarId => power_user.personas[avatarId] === name);
            if (!personaId) {
                throw new Error(`Couldn't find '${name}' in persona list.`)
            }

            avatarFileName = personaId;
        }
        case CharacterType.SYSTEM: {
            avatarFileName = SYSTEM_AVATAR_PATH;
        }
        default: {
            throw new Error(`Invalid character type '${charType}'.`);
        }
    }

    return avatarFileName;
}

/**
 * 
 * @param {CharacterType} charType 
 * @param {string} avatarFileName 
 */
function validateAvatarName(charType, avatarFileName) {
    switch (charType) {
        case CharacterType.CHARACTER: {
            if (!getContext().characters.find(char => char.avatar === avatarFileName)) {
                throw new Error(`Couldn't find '${avatarFileName}' in character list; is the character list initialized?`)
            }
            break;
        }
        case CharacterType.PERSONA: {
            if (!Object.keys(power_user.personas).find(avatarId => avatarId === avatarFileName)) {
                throw new Error(`Couldn't find '${avatarFileName}' in persona list.`)
            }
            break;
        }
        case CharacterType.SYSTEM: {
            if (avatarFileName !== SYSTEM_AVATAR_PATH) {
                throw new Error(`Invalid system character avatar name '${avatarFileName}'; expected '${SYSTEM_AVATAR_PATH}'.`);
            }
            break;
        }
        default: {
            throw new Error(`Invalid character type '${charType}'.`);
        }
    }
}