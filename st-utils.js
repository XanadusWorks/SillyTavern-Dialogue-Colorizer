import { EventEmitter } from "../../../../lib/eventemitter.js";
import { user_avatar } from "../../../../script.js";
import { getContext } from "../../../extensions.js";
import { power_user } from "../../../power-user.js";
import { STCharacter, CharacterType } from "./STCharacter.js";

//#region Events

export const expEventSource = new EventEmitter();
export const exp_event_type = {
    /**
     * Emitted when the character card panel is changed to a different character. 
     * Receives an {@linkcode STCharacter} object representing the newly-selected character.
     * @param {STCharacter} character An object representing the new character.
     */
    CHAR_CARD_CHANGED: "char_card_changed",
    /**
     * Emitted when a new persona is added to the DOM.
     * Receives an {@linkcode STCharacter} object representing the created persona.
     * @param {STCharacter} persona An object representing the new persona.
     */
    PERSONA_ADDED: "persona_added",
    /**
     * Emitted when a persona is removed from the DOM. 
     * Receives an {@linkcode STCharacter} object representing the removed persona.
     * @param {STCharacter} persona An object representing the removed persona.
     */
    PERSONA_REMOVED: "persona_removed",
    /**
     * Emitted when the user changes persona. 
     * Receives an {@linkcode STCharacter} object representing the newly-selected persona.
     * @param {STCharacter} persona An object representing the selected persona.
     */
    PERSONA_CHANGED: "persona_changed",
    /**
     * Emitted when a message is added to the chat.
     * Receives the message element that was added.
     * @param {HTMLElement} addedMessage
     */
    MESSAGE_ADDED: "message_added",
    /**
     * Emitted when a message is removed from the chat.
     * Receives the message element that was removed.
     * @param {HTMLElement} removedMessage
     */
    MESSAGE_REMOVED: "message_removed",
};

/**
 * 
 * @param {MutationRecord[]} mutationList 
 * @param {MutationObserver} observer 
 */
function onCharCardChanged(mutationList, observer) {
    for (const mutation of mutationList) {
        const target = /** @type {HTMLElement} */ (mutation.target);

        const avatarFilePath = target.getAttribute("value");
        if (!avatarFilePath) {
            continue;
        }

        const stChar = STCharacter.fromAvatar(CharacterType.CHARACTER, avatarFilePath);
        expEventSource.emit(exp_event_type.CHAR_CARD_CHANGED, stChar);
    }
}

/**
 * 
 * @param {MutationRecord[]} mutationList 
 * @param {MutationObserver} observer 
 */
function onPersonasChanged(mutationList, observer) {
    for (const mutation of mutationList) {
        const target = /** @type {HTMLElement} */ (mutation.target);
        if (mutation.type === "attributes") {
            if (!target.classList.contains("selected")) {
                continue;
            }
            
            const stChar = getSTCharFromAvatarElem(target);
            if (!stChar) {
                continue;
            }
            expEventSource.emit(exp_event_type.PERSONA_CHANGED, stChar);
        }
        else if (mutation.type === "childList") {
            for (const removedNode of mutation.removedNodes) {
                if (!(removedNode instanceof HTMLElement)) {
                    continue;
                }

                if (!removedNode.classList.contains("avatar")) {
                    continue;
                }

                const stChar = getSTCharFromAvatarElem(removedNode);
                if (!stChar) {
                    continue;
                }
                expEventSource.emit(exp_event_type.PERSONA_REMOVED, stChar);
            }
            for (const addedNode of mutation.addedNodes) {
                if (!(addedNode instanceof HTMLElement)) {
                    continue;
                }

                if (!addedNode.classList.contains("avatar")) {
                    continue;
                }

                const stChar = getSTCharFromAvatarElem(addedNode);
                if (!stChar) {
                    continue;
                }
                expEventSource.emit(exp_event_type.PERSONA_ADDED, stChar);
            }
        }
    }

    function getSTCharFromAvatarElem(avatarElem) {
        const avatarFilePath = avatarElem.getAttribute("imgfile");
        if (!avatarFilePath) {
            return null;
        }

        const avatarFileName = avatarFilePath.slice(avatarFilePath.lastIndexOf('/') + 1);
        return STCharacter.fromAvatar(CharacterType.PERSONA, avatarFileName);
    }
}

/**
 * 
 * @param {MutationRecord[]} mutationList 
 * @param {MutationObserver} observer 
 */
function onChatChanged(mutationList, observer) {
    for (const mutation of mutationList) {
        for (const removedNode of mutation.removedNodes) {
            if (!(removedNode instanceof HTMLElement)) {
                continue;
            }
            if (!removedNode.classList.contains("mes"))
                continue;

            expEventSource.emit(exp_event_type.MESSAGE_REMOVED, removedNode);
        }
        
        for (const addedNode of mutation.addedNodes) {
            if (!(addedNode instanceof HTMLElement)) {
                continue;
            }
            if (!addedNode.classList.contains("mes"))
                continue;

            expEventSource.emit(exp_event_type.MESSAGE_ADDED, addedNode);
        }
    }
}

//#region charCardChanged

const elemCharCardForm = document.getElementById("form_create");
const elemAvatarUrl = elemCharCardForm.querySelector("input#avatar_url_pole");

const charCardChangedObserver = new MutationObserver(onCharCardChanged);
/** @type {MutationObserverInit} */
const charCardChangedObserverConfig = { attributeFilter: ["value"] };

charCardChangedObserver.observe(elemAvatarUrl, charCardChangedObserverConfig);

//#endregion

//#region personaChanged

const elemUserAvatarBlock = document.getElementById("user_avatar_block");

const personasObserver = new MutationObserver(onPersonasChanged);
/** @type {MutationObserverInit} */
const personasObserverConfig = { subtree: true, attributeFilter: ["class"], childList: true };

personasObserver.observe(elemUserAvatarBlock, personasObserverConfig);

//#endregion

//#region chatChanged

const elemChat = document.getElementById("chat");

const chatObserver = new MutationObserver(onChatChanged);
/** @type {MutationObserverInit} */
const chatObserverConfig = { childList: true };

chatObserver.observe(elemChat, chatObserverConfig);

//#endregion

//#endregion Events

/**
 * Returns a value indicating whether the user is currently in any chat.
 * 
 * @returns {boolean}
 */
export function isInAnyChat() {
    return isInCharacterChat() || isInGroupChat();
}

/**
 * Returns a value indicating whether the user is currently in a user-to-character chat.
 * 
 * @returns {boolean}
 */
export function isInCharacterChat() {
    return !!getContext().characterId;
}

/**
 * Returns a value indicating whether the user is currently in a group chat.
 * 
 * @returns {boolean}
 */
export function isInGroupChat() {
    return !!getContext().groupId;
}

/**
 * Gets all characters as a list of {@linkcode STCharacter} objects.
 * 
 * @returns {STCharacter[]}
 */
export function getAllCharacters() {
    return Object.values(getContext().characters).map(
        (char) => STCharacter.fromAvatar(CharacterType.CHARACTER, char.avatar)
    );
}

/**
 * Gets all of the user's personas as a list of {@linkcode STCharacter} objects.
 * 
 * @returns {STCharacter[]}
 */
export function getAllPersonas() {
    return Object.entries(power_user.personas).map(
        ([avatarId, name]) => STCharacter.fromAvatar(CharacterType.PERSONA, avatarId)
    );
}

/**
 * Gets the user's currently selected persona.
 * @returns {STCharacter}
 */
export function getCurrentPersona() {
    return STCharacter.fromAvatar(CharacterType.PERSONA, user_avatar);
}

/**
 * Gets the current chat character as an {@linkcode STCharacter}.
 * 
 * @returns {STCharacter?} The current character, or `null` if not currently in a user-to-character chat.
 */
export function getCurrentCharacter() {
    const stContext = getContext();
    const currCharIndex = stContext.characterId;
    if (!currCharIndex)
        return null;

    const currCharAvatar = stContext.characters[currCharIndex].avatar;
    return STCharacter.fromAvatar(CharacterType.CHARACTER, currCharAvatar);
}

/**
 * Gets the character members in the current group chat as a list of {@linkcode STCharacter} objects.
 * 
 * @returns {STCharacter[]?} An array containing the characters in the current group chat, or `null` if not currently in a group chat.
 */
export function getCurrentGroupCharacters() {
    const stContext = getContext();
    const currGroupId = stContext.groupId;
    if (!currGroupId)
        return null;

    const currGroup = stContext.groups.find(group => group.id === currGroupId);
    return currGroup.members
        .map(charAvatar => STCharacter.fromAvatar(CharacterType.CHARACTER, charAvatar));
}

const avatarUrlPole = document.getElementById("avatar_url_pole");
/**
 * Gets the character that is currently being or was last edited. This is not necessarily the current character,
 * as a character's card can be edited from a group chat.
 * 
 * @returns {STCharacter}
 */
export function getCharacterBeingEdited() {
    return STCharacter.fromAvatar(CharacterType.CHARACTER, avatarUrlPole.getAttribute("value"));
}

/**
 * Gets the author of the given message as an {@link STCharacter}.
 * 
 * @param {HTMLElement} message 
 * @returns {STCharacter?} The author of the message, or `null` if the author couldn't be determined.
 */
export function getMessageAuthor(message) {
    /** @type {HTMLImageElement} */
    const avatarThumbImg = message.querySelector(".mesAvatarWrapper > .avatar > img");
    const avatarThumbSrc = avatarThumbImg.getAttribute("src");

    const isUser = message.getAttribute("is_user") === "true";
    // workaround for bug(?) in ST ('/sys {msg}' does not set 'is_system' attr to 'true')
    const isSystem = message.getAttribute("is_system") === "true" || avatarThumbSrc === STCharacter.System.avatarImageThumbnailFilePath;

    /** @type {CharacterType} */
    let charType;
    if (isUser)
        charType = CharacterType.PERSONA;
    else if (isSystem)
        charType = CharacterType.SYSTEM;
    else
        charType = CharacterType.CHARACTER;

    const avatarFileName = getAvatarFileNameFromImgSrc(charType, avatarThumbSrc);
    return STCharacter.fromAvatar(charType, avatarFileName);
}

/**
 * @param {CharacterType} charType
 * @param {string} imageSrc
 * @returns {string?}
 */
function getAvatarFileNameFromImgSrc(charType, imageSrc) {
    let split = imageSrc.split('/').pop();
    switch (charType) {
        case CharacterType.CHARACTER:
            const charThumbRegexp = /\?type=avatar&file=(.*)/i;
            const charMatch = split.match(charThumbRegexp)?.at(1);
            return charMatch ? decodeURIComponent(charMatch) : split;
        case CharacterType.PERSONA:
            return split; // TODO: Needs uri decode?
        case CharacterType.SYSTEM:
            return imageSrc;
        default:
            return null;
    }
}