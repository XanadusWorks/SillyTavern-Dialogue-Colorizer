import { ColorizeSourceType } from "./index.js";
import { linkInputColorTextPicker } from "./utils.js";

/**
 * 
 * @param {string} templateId 
 * @param {boolean?} deep 
 * @returns {DocumentFragment}
 */
export function createTemplateClone(templateId, deep) {
    const tpl = /** @type {HTMLTemplateElement} */ (document.getElementById(templateId));
    return /** @type {DocumentFragment} */ (tpl.content.cloneNode(deep));
}

/**
 * 
 * @param {string} id The ID to set on the created elements.
 * @param {((event: Event) => void)=} onChangedCallback The 'onchange' callback to add to the dropdown.
 * @returns {HTMLDivElement} The div containing the label and dropdown.
 */
export function createColorSourceDropdown(id, onChangedCallback) {
    const wrapper = document.createElement('div');

    const dropdownLabel = document.createElement('label');
    dropdownLabel.htmlFor = id;
    dropdownLabel.title = "The source to use for dialogue color.";
    dropdownLabel.innerHTML = `Color Source<span class="margin5 fa-solid fa-circle-info opacity50p"></span>`;

    const dropdown = document.createElement('select');
    dropdown.id = id;
    dropdown.name = id;
    createOption(ColorizeSourceType.AVATAR_VIBRANT, "Avatar Vibrant", "Use a vibrant color dynamically calculated from the character's avatar.");
    //createOption(ColorizeSourceType.AVATAR_DOMINANT, "Use a dominant color dynamically calculated from the character's avatar.");
    createOption(ColorizeSourceType.STATIC_COLOR, "Static Color", "Use a specified static color.");
    createOption(ColorizeSourceType.CHAR_COLOR_OVERRIDE, "Per-Character Only", "Use the default quote color except for characters with a specified override color.");

    if (onChangedCallback)
        dropdown.addEventListener('change', onChangedCallback);

    wrapper.appendChild(dropdownLabel);
    wrapper.appendChild(dropdown);
    return wrapper;

    function createOption(value, content, title) {
        const option = document.createElement('option');
        option.value = value;
        option.title = title;
        option.innerHTML = content;
        dropdown.appendChild(option);
    }
}

/**
 * @param {(textboxValue: string) => string?} textboxValueProcessor 
 * @param {(colorHex: string) => void} onColorChanged 
 * @returns 
 */
export function createColorTextPickerCombo(textboxValueProcessor, onColorChanged) {
    const textInput = document.createElement('input');
    textInput.className = "text_pole textarea_compact";
    textInput.type = "text";

    const pickerInput = document.createElement('input');
    pickerInput.className = "dc-color-picker";
    pickerInput.type = "color";

    const pickerWrapper = document.createElement('div');
    pickerWrapper.className = "dc-color-picker-wrapper";
    pickerWrapper.appendChild(pickerInput);

    const wrapper = document.createElement('div');
    wrapper.className = "dc-color-input-combo";
    wrapper.appendChild(pickerWrapper);
    wrapper.appendChild(textInput);

    linkInputColorTextPicker(pickerInput, textInput, textboxValueProcessor, onColorChanged);
    return wrapper;
}