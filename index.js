// This is a bit of a mess. A lot of functions could be streamlined and combined or separated out.
// Ah well - it's a decent first project I suppose.

import { extension_settings } from "../../../extensions.js";

//You'll likely need to import some other functions from the main script
import { active_character, eventSource, event_types, saveSettingsDebounced } from "../../../../script.js";
import { debounce } from "../../../utils.js";

import { ExColor } from "./ExColor.js";

const extensionName = "SillyTavern-Dialogue-Colorizer";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

/**
 * 
 * @param {Function} func 
 * @param {Number} timeout 
 * @returns {Promise}
 */
const invokeDebounced = async (func, timeout) => await debounce(func, timeout)();

const colorize_source_types = {
    AVATAR_COLOR: "avatar_color",
    CHAR_CARD_COLOR: "char_card_color",
    STATIC_COLOR: "static_color",
    DISABLED: "disabled"
};

const defaultSettings = {
    "colorize_source": colorize_source_types.AVATAR_COLOR,
    "static_color": "#e18a24",
    "saved_char_card_colors": {}
};

// TODO: Could have an option to use either
// colorthief (takes the most prominent color) 
// or
// Vibrant (takes the most 'vibrant'/eyecatching color)
// Could also have more options for Vibrant to use different swtaches.
//const colorthiefUrl = "https://cdnjs.cloudflare.com/ajax/libs/color-thief/2.3.0/color-thief.umd.js";
//const colorthiefUrl = `${extensionFolderPath}/color-thief.umd.js`;
//const colorthiefUrl = `${extensionFolderPath}/color-thief.umd.js`;
const vibrantUrl = `${extensionFolderPath}/vibrant.min.js`;

/**
 * 
 * @param {HTMLImageElement} img 
 * @param {Number} paletteSize 
 * @param {Number} quality 
 * @returns {Object}
 */
//let Vibrant = function(img, paletteSize, quality) { return null; } // stub

/** @type {Promise<Function | string>} */
const ensureVibrant = new Promise(async (resolve, reject) => {
    $.getScript(vibrantUrl, (data, textStatus, jqxhr) => {
        if (textStatus === "success") 
            // @ts-ignore
            resolve(Vibrant);
        else
            reject(`Couldn't load: status ${jqxhr.status}`);
    });
});
/**
 * @param {HTMLImageElement} img
 * @param {number} paletteSize
 * @param {number} quality
 */
async function getVibrant(img, paletteSize, quality) {
    await ensureVibrant;

    // @ts-ignore
   return await ensureImage(img).then((i) => new Vibrant(i, paletteSize, quality), () => null);
}

/**
 * 
 * @param {HTMLImageElement} img 
 * @returns {Promise<HTMLImageElement>}
 */
async function ensureImage(img) {
    return new Promise((resolve, reject) => {
        if (img.complete) {
            resolve(img);
        } else {
            // TODO: Could the image be loaded by the time this branch fires?
            // I assume so, but I'm not entirely sure how to handle that.
            // Check for 'complete' after adding these event listeners I suppose?
            img.addEventListener('load', () => resolve(img), { once: true });
            img.addEventListener('error', (err) => reject(err.message), { once: true });
        }
    });
}

let quotesStyleSheet;
function getOrCreateQuotesStyleSheet() {
    if (quotesStyleSheet) return quotesStyleSheet;
    quotesStyleSheet = document.createElement('style');
    quotesStyleSheet.id = "xdc-quotes_style_sheet";

    document.body.appendChild(quotesStyleSheet);
    return quotesStyleSheet;
}

function getCheckedRadioButtonInGroup(name) {
    // @ts-ignore
    return document.querySelector(`input[type="radio"][name="${name}"]:checked`).value;
}

function getRadioButtonInGroup(name, value) {
    return document.querySelector(`input[type="radio"][name="${name}"][value="${value}"]`);
}

function getAllRadioButtonsInGroup(name) {
    return document.querySelectorAll(`input[type="radio"][name="${name}"]`)
}

/**
 * 
 * @param {string} templateId 
 * @param {boolean?} deep 
 * @returns {HTMLElement}
 */
function getTemplateClone(templateId, deep) {
    const tpl = document.getElementById(templateId);
    // @ts-ignore
    return tpl.content.cloneNode(deep);
}

function getSettings() {
    return extension_settings[extensionName];
}

/**
 * @param {string} key
 * @param {string=} [defaultValue=null]
 */
function getSetting(key, defaultValue) {
    let extSettings = extension_settings[extensionName];
    if (defaultValue === undefined) defaultValue = defaultSettings[key] ?? null;

    return (extSettings[key] !== undefined) ? extSettings[key] : defaultValue;
}

/**
 * @param {string} key
 * @param {string} value
 */
function setSetting(key, value) {
    let extSettings = extension_settings[extensionName];
    extSettings[key] = value;
    console.debug(`[XDC] set setting '${key}' to '${value}'`);
}

async function loadSettings() {
    const savedSettings = extension_settings[extensionName] || {};
    extension_settings[extensionName] = Object.assign({}, defaultSettings, savedSettings); // Make sure any missing keys have defaults.

    const colorizeSource = getSetting("colorize_source");
    const elemColorizeSource = getRadioButtonInGroup("xdc-colorize_source", colorizeSource) || document.getElementById("xdc-colorize_source-avatar_color");
    $(elemColorizeSource).prop("checked", true).trigger("input");

    const staticColor = getSetting("static_color");
    const elemStaticColorPicker = $("#xdc-static_color-input_picker");
    const elemStaticColorTextbox = $("#xdc-static_color-input_hex");
    elemStaticColorTextbox.prop("value", staticColor);

    let elemCharCardColorWrapper = $("#xdc-char_card_color");
    if (elemCharCardColorWrapper.length === 0) {
        const elemColorInputCombo = getTemplateClone("xdc-tpl-color_input_combo", true);
        const elemColorPicker = elemColorInputCombo.querySelector('input[type="color"]');
        const elemColorTextbox = elemColorInputCombo.querySelector('input[type="text"]');

        // @ts-ignore
        linkInputColorTextPicker(elemColorPicker, elemColorTextbox, 
            (textboxValue) => {
                textboxValue = textboxValue.trim();
                if (textboxValue.length > 0) {
                    if (!ExColor.isValidHexString(textboxValue)) return null;
                    if (textboxValue[0] !== '#') textboxValue = '#' + textboxValue;
                }

                // Allow empty strings to use as a sentinel for the global value.
                return textboxValue;
            },
            (hexColor) => {
                if (active_character === undefined) return;

                const charCardColors = getSetting("saved_char_card_colors");
                if (hexColor) {
                    charCardColors[active_character] = hexColor;
                } else {
                    delete charCardColors[active_character];
                }

                invokeDebounced(updateQuotesStyle, 50);
                saveSettingsDebounced();
            });
        
        const elemCharCardColor = getTemplateClone("xdc-tpl-char_card_color", true);
        elemCharCardColor.id = "xdc-char_card_color";
        elemCharCardColor.querySelector("label").appendChild(elemColorInputCombo);

        const elemCardAvatarNameBlock = document.getElementById("avatar-and-name-block");
        elemCardAvatarNameBlock.after(elemCharCardColor);
    }
}

/**
 * 
 * @param {HTMLInputElement} picker 
 * @param {HTMLInputElement} textbox 
 * @param {function(string):string?} textboxValueProcessor 
 * @param {function(string):void} onSuccess 
 */
function linkInputColorTextPicker(picker, textbox, textboxValueProcessor, onSuccess) {
    // Using .addEventListener was not seeming to work correctly, so I swapped to JQuery. 
    // It was probably an error on my part.
    $(picker).on('change', () => {
        const pickerValue = picker.value;
        textbox.value = pickerValue;
        textbox.setAttribute("lastValidValue", pickerValue);

        /* const changeEvent = new FocusEvent('focusout', {});
        textbox.dispatchEvent(changeEvent); */
        onSuccess(pickerValue);
    });
    
    $(textbox).on('focusout', () => {
        let textboxValue = textboxValueProcessor(textbox.value);
        if (textboxValue === null) {
            const lastValidValue = textbox.getAttribute("lastValidValue") ?? picker.value;
            textbox.value = lastValidValue;
            textbox.setAttribute("lastValidValue", lastValidValue);
            return;
        }
        
        let pickerValue = "#000000";
        if (textboxValue.length !== 0) pickerValue = '#' + ExColor.hexShortToLong(textboxValue);

        textbox.value = textboxValue;
        textbox.setAttribute("lastValidValue", textboxValue);
        picker.value = pickerValue;

        /* const changeEvent = new Event('change', {});
        picker.dispatchEvent(changeEvent); */
        onSuccess(textboxValue);
    });
}

// /**
//  * 
//  * @param {JQuery<HTMLElement>} jPicker 
//  * @param {JQuery<HTMLElement>} jTextbox 
//  * @param {function(string):void} callback 
//  */
// function linkInputColorTextPicker(jPicker, jTextbox, callback) {
//     jPicker.on("change", { elem: jTextbox[0], cb: callback }, syncInputPickerToText);
//     jTextbox.on("focusout", { elem: jPicker[0], cb: callback }, syncInputTextToPicker);
// }

function onColorizeSourceClicked() {
    const value = $(this).prop("value");

    setSetting("colorize_source", value);
    invokeDebounced(updateQuotesStyle, 100);
    saveSettingsDebounced();
}

function makeBetterContrast(rgb) {
    const [h, s, l] = ExColor.rgb2hsl(rgb);
    
    // TODO: Very arbitrary and probably doesn't really make sense.
    // Change this?
    const nHue = h;
    const nSat = s > 0.5 ? s - 0.1 : s + 0.3;
    const nLum = l > 0.7 ? l : 0.7;

    return ExColor.hsl2rgb([nHue, nSat, nLum]);
}

async function getCurrentCharAvatarColor() {
    const charAvatarDiv = document.querySelector(`div.avatar[title="${active_character}"]`);
    const charAvatarImg = charAvatarDiv.querySelector("img");
    const charAvatarVibrant = await getVibrant(charAvatarImg, 96, 5);

    return ExColor.hex2rgb(charAvatarVibrant.swatches()["Vibrant"].getHex());
    //return (await getColorThief()).getColor(charAvatarImg);
}

function getCharCardColor(character) {
    const charCardColors = getSetting("saved_char_card_colors");
    return charCardColors[character];
}

async function getCharQuotesColor() {
    if (!active_character) return;
    let colorizeSource = getSetting("colorize_source");

    const charCardColor = getCharCardColor(active_character);
    if (charCardColor) colorizeSource = colorize_source_types.CHAR_CARD_COLOR;

    let charQuotesColor;
    switch (colorizeSource) {
        case colorize_source_types.AVATAR_COLOR:
            const domAvatarColor = await getCurrentCharAvatarColor();
            const fixedContrast = makeBetterContrast(domAvatarColor);
            charQuotesColor = '#' + ExColor.rgb2hex(fixedContrast);
            break;
        case colorize_source_types.CHAR_CARD_COLOR:
            charQuotesColor = charCardColor;
            break;
        case colorize_source_types.STATIC_COLOR:
            charQuotesColor = getSetting("static_color");
            break
        case colorize_source_types.DISABLED:
        default:
            charQuotesColor = null;
    }

    return charQuotesColor;
}

function doesParentMessageBelongToChar(elem) {
    const imgSrc = `/thumbnail?type=avatar&file=${encodeURIComponent(active_character)}`;
    return $(elem).closest(".mes").has(`.avatar > img[src="${imgSrc}"]`).length > 0;
}

async function updateQuotesStyle() {
    if (!active_character) return;
    const sheet = getOrCreateQuotesStyleSheet();
    const charQuotesColor = await getCharQuotesColor();

    sheet.innerHTML = `
        .mes[is_user="false"] .mes_text q {
            color: ${charQuotesColor};
        }
    `;
}

async function updateCharCardColorUI() {
    const elemCharCardColor = document.getElementById("xdc-char_card_color");
    if (!elemCharCardColor || !active_character) return;

    const charCardColors = getSetting("saved_char_card_colors");
    const charCardColor = charCardColors[active_character] || "";

    const jCharCardColor = $(elemCharCardColor);
    jCharCardColor.find('input[type="text"]').prop("value", charCardColor).trigger('focusout');
}

jQuery(async () => {
    const settingsHtml = await $.get(`${extensionFolderPath}/dialogue-colorizer.html`);
    
    // extension_settings and extensions_settings2 are the left and right columns of the settings menu
    // Left should be extensions that deal with system functions and right should be visual/UI related 
    $("#extensions_settings2").append(settingsHtml);
    $(getAllRadioButtonsInGroup("xdc-colorize_source")).on("click", onColorizeSourceClicked);

    // Load settings when starting things up (if you have any)
    loadSettings();

    const elemStaticColorPicker = document.getElementById("xdc-static_color-input_picker");
    const elemStaticColorTextbox = document.getElementById("xdc-static_color-input_hex");
    // @ts-ignore
    linkInputColorTextPicker(elemStaticColorPicker, elemStaticColorTextbox, 
        (textboxValue) => {
            const trimmed = textboxValue.trim();
            if (!ExColor.isValidHexString(trimmed)) return null;

            return trimmed[0] !== '#' ? '#' + trimmed : trimmed;
        }, 
        (hexColor) => {
            setSetting("static_color", hexColor);
            invokeDebounced(updateQuotesStyle, 50);
            saveSettingsDebounced();
        });

    $(elemStaticColorTextbox).trigger('focusout');

    eventSource.on(event_types.CHAT_CHANGED, updateCharCardColorUI);
    eventSource.on(event_types.CHAT_CHANGED, updateQuotesStyle);
    eventSource.on(event_types.CHARACTER_EDITED, updateQuotesStyle);
});