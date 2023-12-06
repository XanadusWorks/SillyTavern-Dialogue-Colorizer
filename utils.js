import { ExColor } from "./ExColor.js";

/**
 * C#-style string format. Does not support named arguments.
 * 
 * @param {string} str
 * @param {any[]} args
 * 
 * @link https://stackoverflow.com/a/8463429
 */
export function stringFormat(str, ...args) {
    return str.replace(/\{\{|\}\}|\{(\d+)\}/g, function (curlyBrack, index) {
        return ((curlyBrack == "{{") ? "{" : ((curlyBrack == "}}") ? "}" : args[index]));
    });
}

/**
 * Loads an image from the specified url.
 * 
 * @param {string} url 
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener('load', () => resolve(img), { once: true });
        img.addEventListener('error', reject, { once: true });
        img.src = url;
    });
}

/**
 * Ensures that the given image is fully loaded.
 * 
 * @param {HTMLImageElement} img 
 * @returns {Promise<HTMLImageElement>}
 */
export function waitForImage(img) {
    return new Promise((resolve, reject) =>
    {
        img.addEventListener('load', () => resolve(img), { once: true });
        img.addEventListener('error', reject, { once: true });
        if (img.complete)
            resolve(img);
    });
}

/**
 * Loads a script from a URI.
 * 
 * @param {string} scriptUri 
 * 
 * @returns {Promise<void>}
 */
export function loadScript(scriptUri) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = "text/javascript";
        script.async = true;

        script.addEventListener('load', () => {
            script.parentNode.removeChild(script);
            resolve();
        }, { once: true });
        
        script.addEventListener('error', (err) => {
            script.parentNode.removeChild(script);
            reject(err);
        }, { once: true });

        script.src = scriptUri;
        document.body.appendChild(script);
    });
}

/**
 * @param {string} groupName
 * @returns {HTMLInputElement}
 */
export function getCheckedRadioButtonInGroup(groupName) {
    // @ts-ignore
    return document.querySelector(`input[type="radio"][name="${groupName}"]:checked`).value;
}

/**
 * 
 * @param {string} groupName 
 * @param {string} value 
 * @returns {HTMLInputElement}
 */
export function getRadioButtonInGroup(groupName, value) {
    return document.querySelector(`input[type="radio"][name="${groupName}"][value="${value}"]`);
}

/**
 * @param {string} groupName
 * @returns {NodeListOf<HTMLInputElement>}
 */
export function getAllRadioButtonsInGroup(groupName) {
    return document.querySelectorAll(`input[type="radio"][name="${groupName}"]`)
}

/**
 * 
 * @param {HTMLInputElement} picker 
 * @param {HTMLInputElement} textbox 
 * @param {(textboxValue: string) => string?} textboxValueProcessor 
 * @param {(colorValue: string) => void} onSuccess 
 */
export function linkInputColorTextPicker(picker, textbox, textboxValueProcessor, onSuccess) {
    // Using .addEventListener was not seeming to work correctly, so I swapped to JQuery. 
    // It was probably an error on my part.
    $(picker).on('change', () => {
        const pickerValue = picker.value;
        const textValue = convertColorPickerValueToTextValue(pickerValue);

        textbox.value = textValue;
        textbox.setAttribute("lastValidValue", textValue);

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
        if (textboxValue.length !== 0) 
            pickerValue = '#' + ExColor.hexShortToLong(textboxValue);

        textbox.value = textboxValue;
        textbox.setAttribute("lastValidValue", textboxValue);
        picker.value = pickerValue;

        onSuccess(textboxValue);
    });
}

/**
 * Sets the values of the text and color inputs of a combo picker.
 * 
 * @param {HTMLElement} elemComboWrapper 
 * @param {string?} hexValue 
 */
export function setInputColorPickerComboValue(elemComboWrapper, hexValue) {
    const textInput = /** @type {HTMLInputElement} */ (elemComboWrapper.querySelector(`input[type="text"]`));
    const colorInput =/** @type {HTMLInputElement} */ (elemComboWrapper.querySelector(`input[type="color"]`));
    
    textInput.value = hexValue ?? "";
    colorInput.value = hexValue ?? "#000000";
}

/**
 * Assumes a value directly taken from a color picker value property.
 * 
 * @param {string} pickerHexValue 
 */
function convertColorPickerValueToTextValue(pickerHexValue) {
    if (pickerHexValue === undefined) 
        throw new TypeError("Picker hex string value is undefined.");

    if (ExColor.hexCanBeShort(pickerHexValue)) 
        pickerHexValue = '#' + ExColor.hexLongToShort(pickerHexValue);

    return pickerHexValue;
}

/**
 * Assumes a value directly taken from a textbox value property. 
 * 
 * Returns `null` on invalid hex values.  
 * Returns `#000000` on empty string.
 * 
 * @param {string?} textHexValue 
 */
function convertColorTextValueToPickerValue(textHexValue) {
    if (textHexValue === undefined || textHexValue === null) 
        return null;

    textHexValue = textHexValue.trim();
    if (textHexValue.length === 0) 
        return "#000000";
    if (!ExColor.isValidHexString(textHexValue)) 
        return null;

    textHexValue = '#' + ExColor.hexShortToLong(textHexValue);
    return textHexValue;
}