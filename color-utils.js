import "./Vibrant.min.js";
import { waitForImage } from "./utils.js";

/** @type {VibrantConstructor} */
export const Vibrant = window["Vibrant"];

/**
 * Creates a Vibrant object from the given image.
 * 
 * @param {HTMLImageElement} image
 * @returns {Promise<VibrantObj>}
 */
export async function getImageVibrant(image) {
    const loadedImage = await waitForImage(image);
    return new Vibrant(loadedImage, 96, 6);
}

/**
 * Attempts to get a valid swatch from the list in the defined order, returning `null` if none are valid.
 * 
 * @param {VibrantSwatches} swatchesObject 
 * @param {...keyof VibrantSwatches} swatches 
 * @returns {VibrantSwatch?}
 */
export function getValidSwatch(swatchesObject, ...swatches) {
    for (const swatch of swatches) {
        if (swatchesObject.hasOwnProperty(swatch) && swatchesObject[swatch]){
            return swatchesObject[swatch];
        }
    }

    return null;
}