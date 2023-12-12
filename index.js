//#region ST imports

import { eventSource, event_types, saveSettingsDebounced } from "../../../../script.js";
import { extension_settings } from "../../../extensions.js";

//#endregion ST imports

//#region Local imports

import { ExColor } from "./ExColor.js";
import { CharacterType, STCharacter } from "./STCharacter.js";
import { getImageVibrant, getValidSwatch } from "./color-utils.js";
import { createColorSourceDropdown, createColorTargetDropdown, createColorTextPickerCombo } from "./element-creators.js";
import { initializeSettings } from "./settings-utils.js";
import { 
    expEventSource, 
    exp_event_type, 
    getAllPersonas, 
    getCharacterBeingEdited, 
    getCurrentCharacter, 
    getCurrentGroupCharacters, 
    getCurrentPersona, 
    getMessageAuthor, 
    isInAnyChat, 
    isInCharacterChat, 
    isInGroupChat } from "./st-utils.js";
import { setInputColorPickerComboValue } from "./utils.js";

//#endregion Local imports

const DEFAULT_STATIC_DIALOGUE_COLOR_HEX = "#e18a24";
/** @type {[number, number, number]} */
const DEFAULT_STATIC_DIALOGUE_COLOR_RGB = [225, 138, 36];

/**
 * @typedef {ValueOf<typeof ColorizeSourceType>} ColorizeSourceType
 * @readonly
 */
export const ColorizeSourceType = {
    AVATAR_VIBRANT: "avatar_vibrant",
    //AVATAR_DOMINANT: "avatar_dominant",
    CHAR_COLOR_OVERRIDE: "char_color_override",
    STATIC_COLOR: "static_color",
    DISABLED: "disabled"
};

/**
 * @typedef {ValueOf<typeof ColorizeTargetType>} ColorizeTargetType
 * @readonly
 */
export const ColorizeTargetType = {
    QUOTED_TEXT: 1 << 0,
    BUBBLES: 1 << 1,
    QUOTED_TEXT_AND_BUBBLES: (1 << 0) | (1 << 1)
};

/**
 * @typedef {defaultExtSettings} XDCSettings
 */
const defaultCharColorSettings = {
    colorizeSource: ColorizeSourceType.AVATAR_VIBRANT,
    staticColor: DEFAULT_STATIC_DIALOGUE_COLOR_HEX,
    colorOverrides: {},
};
const defaultExtSettings = {
    charColorSettings: defaultCharColorSettings,
    personaColorSettings: defaultCharColorSettings,
    colorizeTargets: ColorizeTargetType.QUOTED_TEXT,
    chatBubbleLightness: 0.15,
};

const extName = "SillyTavern-Dialogue-Colorizer";
const extFolderPath = `scripts/extensions/third-party/${extName}`;
const extSettings = initializeSettings(extName, defaultExtSettings);

/** @type {HTMLStyleElement} */
let charactersStyleSheet;
/** @type {HTMLStyleElement} */
let personasStyleSheet;

/**
 * @param {STCharacter} stChar
 */
async function getCharStyleString(stChar) {
    let styleHtml = "";
    if ((extSettings.colorizeTargets & ColorizeTargetType.QUOTED_TEXT) === ColorizeTargetType.QUOTED_TEXT) {
        const charDialogueColor = await getCharacterDialogueColor(stChar);
        if (charDialogueColor) {
            styleHtml += `
                .mes[xdc-author_uid="${stChar.uid}"] .mes_text q {
                    color: #${charDialogueColor.toHex()};
                }
            `;
        }
    }
    if ((extSettings.colorizeTargets & ColorizeTargetType.BUBBLES) === ColorizeTargetType.BUBBLES) {
        const charBubbleColor = await getCharacterBubbleColor(stChar);
        if (charBubbleColor) {
            styleHtml += `
                .bubblechat .mes[xdc-author_uid="${stChar.uid}"] {
                    background-color: #${charBubbleColor.toHex()} !important;
                    border-color: #${charBubbleColor.toHex()} !important;
                }
            `;
        }
    }

    return styleHtml;
}

/**
 * 
 * @param {STCharacter[]=} characterList 
 */
async function updateCharactersStyleSheet(characterList) {
    if (!characterList) {
        if (!isInAnyChat()) {
            return;
        }
        if (isInGroupChat()) {
            characterList = getCurrentGroupCharacters();
        }
        else if (isInCharacterChat()) {
            characterList = [getCurrentCharacter()];
        }
    }

    const stylesHtml = await Promise.all(characterList.map(async char => await getCharStyleString(char)));
    charactersStyleSheet.innerHTML = stylesHtml.join("");
}

// Handled differently from the chars style sheet so we don't have to do any dirty/complex tricks when a chat has messages
// from a persona the user isn't currently using (otherwise the message color would revert to the default).
/**
 * 
 * @param {STCharacter[]=} personaList 
 */
async function updatePersonasStyleSheet(personaList) {
    personaList ??= getAllPersonas();

    const stylesHtml = await Promise.all(personaList.map(async persona => await getCharStyleString(persona)));
    personasStyleSheet.innerHTML = stylesHtml.join("");
}

/**
 * 
 * @param {STCharacter | CharacterType} charType 
 */
function getSettingsForChar(charType) {
    if (charType instanceof STCharacter) {
        charType = charType.type;
    }
    
    switch (charType) {
        case CharacterType.CHARACTER:
            return extSettings.charColorSettings;
        case CharacterType.PERSONA:
            return extSettings.personaColorSettings;
        default:
            console.warn(`Character type '${charType}' has no settings key, using defaults.`);
            return structuredClone(defaultCharColorSettings);
    }
}

/**
 * 
 * @param {import("./ExColor.js").ColorArray} rgb 
 * @returns {import("./ExColor.js").ColorArray}
 */
function makeBetterContrast(rgb) {
    const [h, s, l, a] = ExColor.rgb2hsl(rgb);

    // TODO: Very arbitrary and probably doesn't really make sense.
    // Change this?
    const nHue = h;
    const nSat = s > 0.5 ? s - 0.1 : s + 0.3;
    const nLum = l > 0.7 ? l : 0.7;

    return ExColor.hsl2rgb([nHue, nSat, nLum, a]);
}

/**
 *  
 * @param {HTMLImageElement} image 
 * @param  {...(keyof VibrantSwatches)} swatchKeys 
 * @returns {Promise<[number, number, number]?>}
 */
async function getVibrantColorRgb(image, ...swatchKeys) {
    const vibrant = await getImageVibrant(image);
    const swatch = getValidSwatch(vibrant.swatches(), ...swatchKeys);
    return swatch?.getRgb();
}

let avatarVibrantColorCache = {};
/**
 * 
 * @param {STCharacter} stChar 
 * @returns {Promise<ExColor?>}
 */
async function getCharacterDialogueColor(stChar) {
    const colorSettings = getSettingsForChar(stChar);
    const colorizeSource = Object.keys(colorSettings.colorOverrides).includes(stChar.avatarName)
        ? ColorizeSourceType.CHAR_COLOR_OVERRIDE
        : colorSettings.colorizeSource;

    switch (colorizeSource) {
        case ColorizeSourceType.AVATAR_VIBRANT: {
            if (avatarVibrantColorCache[stChar.uid]) {
                return avatarVibrantColorCache[stChar.uid];
            }
            const avatar = stChar.getAvatarImageThumbnail();
            const colorRgb = await getVibrantColorRgb(avatar, "Vibrant", "Muted");
            const betterContrastRgb = colorRgb ? makeBetterContrast(colorRgb) : DEFAULT_STATIC_DIALOGUE_COLOR_RGB;
            const exColor = ExColor.fromRgb(betterContrastRgb);
            avatarVibrantColorCache[stChar.uid] = exColor;
            return exColor;
        }
        case ColorizeSourceType.STATIC_COLOR: {
            return ExColor.fromHex(colorSettings.staticColor);
        }
        case ColorizeSourceType.CHAR_COLOR_OVERRIDE: {
            const overrideColor = colorSettings.colorOverrides[stChar.avatarName];
            return overrideColor ? ExColor.fromHex(overrideColor) : null;
        }
        case ColorizeSourceType.DISABLED:
        default:
            return null;
    }
}

/**
 * 
 * @param {STCharacter} stChar 
 * @returns {Promise<ExColor?>}
 */
async function getCharacterBubbleColor(stChar) {
    const dialogueColor = await getCharacterDialogueColor(stChar);
    if (!dialogueColor) {
        return null;
    }

    const hsl = dialogueColor.toHsl();
    //hsl.s = 0.5;
    hsl.l = extSettings.chatBubbleLightness;

    return ExColor.fromHsl(hsl);
}

/**
 * 
 * @param {string} textboxValue 
 * @param {any} defaultValue 
 * @returns {string | null}
 */
function getTextValidHexOrDefault(textboxValue, defaultValue) {
    const trimmed = textboxValue.trim();
    if (!ExColor.isValidHexString(trimmed))
        return defaultValue;

    return ExColor.getHexWithHash(trimmed);
}

/**
 * 
 * @param {HTMLElement} message 
 */
function addAuthorUidClassToMessage(message) {
    const authorChatUidAttr = "xdc-author_uid";
    if (message.hasAttribute(authorChatUidAttr)) {
        console.debug(`[XDC] Message already has '${authorChatUidAttr}' attribute, skipping.`);
    }

    const messageAuthorChar = getMessageAuthor(message);
    if (!messageAuthorChar) {
        console.error("[XDC] Couldn't get message author character to add class.");
        return;
    }

    message.setAttribute(authorChatUidAttr, messageAuthorChar.uid);
}

//#region Event Handlers

async function onCharacterSettingsUpdated() {
    await updateCharactersStyleSheet();
    saveSettingsDebounced();
}

async function onPersonaSettingsUpdated() {
    await updatePersonasStyleSheet();
    saveSettingsDebounced();
}

async function onAnySettingsUpdated() {
    await updateCharactersStyleSheet();
    await updatePersonasStyleSheet();
    saveSettingsDebounced();
}

/**
 * 
 * @param {STCharacter} char 
 */
function onCharacterChanged(char) {
    const colorOverride = document.getElementById("xdc-char_color_override");
    setInputColorPickerComboValue(colorOverride, extSettings.charColorSettings.colorOverrides[char.avatarName]);
}

/**
 * 
 * @param {STCharacter} persona 
 */
function onPersonaChanged(persona) {
    const colorOverride = document.getElementById("xdc-persona_color_override");
    setInputColorPickerComboValue(colorOverride, extSettings.personaColorSettings.colorOverrides[persona.avatarName]);
}

//#endregion Event Handlers

//#region Initialization

function initializeStyleSheets() {
    charactersStyleSheet = createAndAppendStyleSheet("xdc-chars_style_sheet");
    personasStyleSheet = createAndAppendStyleSheet("xdc-personas_style_sheet");

    function createAndAppendStyleSheet(id) {
        const styleSheet = document.createElement('style');
        styleSheet.id = id;
        return document.body.appendChild(styleSheet);
    }
}

function initializeSettingsUI() {
    const elemExtensionSettings = document.getElementById("xdc-extension-settings");

    const elemGlobalDialogueSettings = elemExtensionSettings.querySelector("#xdc-global_dialogue_settings");
    const elemColorTargetDropdown = createColorTargetDropdown("xdc-global_colorize_target", (changedEvent) => {
        const value = $(changedEvent.target).prop("value");
        extSettings.colorizeTargets = value;
        onAnySettingsUpdated();
    });
    elemGlobalDialogueSettings.children[0].insertAdjacentElement("afterend", elemColorTargetDropdown);
    $(elemColorTargetDropdown.querySelector('select')).prop("value", extSettings.colorizeTargets);

    const elemChatBubbleLightness = elemGlobalDialogueSettings.querySelector("#xdc-chat_bubble_color_lightness");
    $(elemChatBubbleLightness)
        .prop("value", extSettings.chatBubbleLightness)
        .on('focusout', (event) => {
            const target = $(event.target);
            const value = target.prop("value");
            const numValue = parseFloat(value);
            if (Number.isNaN(numValue)) {
                const lastValidValue = target.prop("lastValidValue") || extSettings.chatBubbleLightness;
                target.prop("value", lastValidValue);
                return;
            }

            const resultValue = numValue < 0.0 ? 0.0 
                : numValue > 1.0 ? 1.0 
                : numValue;

            target.prop("value", resultValue);
            extSettings.chatBubbleLightness = resultValue;
            onAnySettingsUpdated();
        });

    const charDialogueSettings = elemExtensionSettings.querySelector("#xdc-char_dialogue_settings");
    const charColorSourceDropdown = createColorSourceDropdown("xdc-char_colorize_source", (changedEvent) => {
        const value = $(changedEvent.target).prop("value");
        extSettings.charColorSettings.colorizeSource = value;
        onCharacterSettingsUpdated();
    });
    const charStaticColorPickerCombo = createColorTextPickerCombo(
        (textboxValue) => getTextValidHexOrDefault(textboxValue, null), 
        (colorValue) => {
            extSettings.charColorSettings.staticColor = colorValue;
            onCharacterSettingsUpdated();
        }
    );
    charDialogueSettings.children[0].insertAdjacentElement("afterend", charColorSourceDropdown);
    charDialogueSettings.children[3].insertAdjacentElement("beforeend", charStaticColorPickerCombo);

    $(charColorSourceDropdown.querySelector('select'))
        .prop("value", extSettings.charColorSettings.colorizeSource)
        .trigger('change');
    $(charStaticColorPickerCombo.querySelector('input[type="text"]'))
        .prop("value", extSettings.charColorSettings.staticColor)
        .trigger('focusout');

    const personaDialogueSettings = elemExtensionSettings.querySelector("#xdc-persona_dialogue_settings");
    const personaColorSourceDropdown = createColorSourceDropdown("xdc-persona_colorize_source", (changedEvent) => {
        const value = $(changedEvent.target).prop("value");
        extSettings.personaColorSettings.colorizeSource = value;
        onPersonaSettingsUpdated();
    });
    
    const personaStaticColorPickerCombo = createColorTextPickerCombo(
        (textboxValue) => getTextValidHexOrDefault(textboxValue, null), 
        (colorValue) => {
            extSettings.personaColorSettings.staticColor = colorValue;
            onPersonaSettingsUpdated();
        }
    );
    personaDialogueSettings.children[0].insertAdjacentElement("afterend", personaColorSourceDropdown);
    personaDialogueSettings.children[3].insertAdjacentElement("beforeend", personaStaticColorPickerCombo);
    
    $(personaColorSourceDropdown.querySelector('select'))
        .prop("value", extSettings.personaColorSettings.colorizeSource)
        .trigger('change');
    $(personaStaticColorPickerCombo.querySelector('input[type="text"]'))
        .prop("value", extSettings.personaColorSettings.staticColor)
        .trigger('focusout');
}

function initializeCharSpecificUI() {
    // Character
    const elemCharColorOverride = createColorOverrideElem("xdc-char_color_override", getCharacterBeingEdited);

    const elemCharCardForm = document.getElementById("form_create");
    const elemAvatarNameBlock = elemCharCardForm.querySelector("div#avatar-and-name-block");
    elemAvatarNameBlock.insertAdjacentElement("afterend", elemCharColorOverride);

    // Persona
    const elemPersonaColorOverride = createColorOverrideElem("xdc-persona_color_override", getCurrentPersona);
    elemPersonaColorOverride.removeChild(elemPersonaColorOverride.querySelector("hr.sysHR")); // eh

    const elemPersonaDescription = document.getElementById("persona_description");
    const elemDescParent = elemPersonaDescription.parentElement;
    elemDescParent.insertAdjacentElement("afterbegin", elemPersonaColorOverride);

    /**
     * 
     * @param {string} id 
     * @param {() => STCharacter} stCharGetter
     */
    function createColorOverrideElem(id, stCharGetter) {
        const label = document.createElement('label');
        label.htmlFor = id;
        label.title = "The color to use for this character's dialogue (quoted text). Overrides the global setting.";
        label.innerHTML = `Dialogue Color<span class="margin5 fa-solid fa-circle-info opacity50p"></span>`;

        const hr = document.createElement('hr');
        hr.className = "sysHR";

        const inputColorPickerCombo = createColorTextPickerCombo(
            (textboxValue) => getTextValidHexOrDefault(textboxValue, ""), 
            (colorValue) => {
                const stChar = stCharGetter();
                const colorSettings = getSettingsForChar(stChar);
                if (colorValue.length > 0)
                    colorSettings.colorOverrides[stChar.avatarName] = colorValue;
                else
                    delete colorSettings.colorOverrides[stChar.avatarName];

                if (stChar.type === CharacterType.PERSONA) {
                    onPersonaSettingsUpdated();
                }
                else {
                    onCharacterSettingsUpdated();
                }
            }
        );

        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.className = "dc-flex-container";
        wrapper.appendChild(hr);
        wrapper.appendChild(label);
        wrapper.appendChild(inputColorPickerCombo);

        return wrapper;
    }
}

jQuery(async ($) => {
    const settingsHtml = await $.get(`${extFolderPath}/dialogue-colorizer.html`);

    const elemStExtensionSettings2 = document.getElementById("extensions_settings2");
    $(elemStExtensionSettings2).append(settingsHtml);

    initializeStyleSheets();
    initializeSettingsUI();
    initializeCharSpecificUI();

    eventSource.on(event_types.CHAT_CHANGED, () => updateCharactersStyleSheet());
    expEventSource.on(exp_event_type.MESSAGE_ADDED, addAuthorUidClassToMessage);

    expEventSource.on(exp_event_type.CHAR_CARD_CHANGED, onCharacterChanged);
    expEventSource.on(exp_event_type.PERSONA_CHANGED, onPersonaChanged);
    
    eventSource.once(event_types.APP_READY, () => {
        onPersonaChanged(getCurrentPersona()); // Initialize color inputs with starting values.
        updatePersonasStyleSheet();
    });
})

//#endregion Initialization