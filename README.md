# SillyTavern Dialogue Colorizer

This extension for SillyTavern gives you various options to automatically color quoted text for character and user persona dialogue.

![Colored dialogue example](https://github.com/XanadusWorks/SillyTavern-Dialogue-Colorizer/assets/72997068/75aac07c-34e8-4f66-a4b5-5c9be415fbb6)


## Features

- Change character's quoted text color to a different color, either dynamically based on the character's avatar card, a per-character color, or a simple static color.
- Can change each individual user persona's quoted text color in the same way.
- Character-specific color (set via the character card edit panel or the persona edit panel) overrides the global setting.
- Works for user-to-character chats and group chats!

## Installation and Usage

### Installation

Use ST's inbuilt third-party extension installer button to install. Go to the Extensions tab, then click `Install extension`. Enter the URL of this Github repository, then hit `Save`.

![SillyTavern Extensions > Install extension](https://github.com/XanadusWorks/SillyTavern-Dialogue-Colorizer/assets/72997068/5e3c1537-18c3-4758-9159-446c2b3b52b9)

![Enter Github URL > Save](https://github.com/XanadusWorks/SillyTavern-Dialogue-Colorizer/assets/72997068/83127307-c861-4684-a075-401df5870a18)


### Usage

By default, the extension will be active and will change the color of quoted text within a character chat based on the most vibrant color in the character's avatar image.

You can set a color per-character by opening the character card's edit panel and setting a color in the `Dialogue Color` section via either using the color picker or entering a hex code manually. This color will override the `Color Source` setting in the extension settings. If you no longer want the character-specific color, simply clear the textbox.

The process is similar for user personas: go into the persona tab, select your persona, and set the dialogue color using the picker just above the persona description.

![Dialogue Color setting in the character card edit panel](https://github.com/XanadusWorks/SillyTavern-Dialogue-Colorizer/assets/72997068/d2fdf104-be8e-4a4b-a90e-9bb6719bb6e7)


Note that the character-specific dialogue color is saved to the extension's settings in SillyTavern, *not* the character card.

There are a couple of options to change what color is used for dialogue. Open the Extensions tab and then open the settings for `Dialogue Colorizer`. There are separate settings for characters and personas, but they work in the same way.

**Color Source**: This is how you choose where the color used comes from.  
    1. **Avatar Vibrant**: This dynamically chooses a dialogue color by finding the most 'vibrant' color in the character's avatar, then does some saturation/lightness adjustments to make sure it's readable.  
    2. **Static Color**: This uses the `Static Color` color - set further down in the extension settings - for the character's dialogue (aside from the characters you give a specific color to).  
    3. **Per-Character Only**: This enables the dialogue coloring only for characters where a color is specified. Other characters will use the default SillyTavern quotes color.  

Note that if a character has a color specified in their card settings, that color will always be used instead unless you remove it by clearing the textbox.

**Static Color**: If `Color Source` is set to `Static Color`, this is the color used for character dialogue. Click the color swatch to bring up a color picker or type in a hex code manually.

![Showcase of extension settings](https://github.com/XanadusWorks/SillyTavern-Dialogue-Colorizer/assets/72997068/8c5e1375-3bb2-4070-987d-160bc2811a31)



## Prerequisites

This extension was built on SillyTavern commit [74e5e0e](https://github.com/SillyTavern/SillyTavern/commit/74e5e0e4c0f800651fea7c57604158f552435393) and may not function correctly on older versions.

## Support and Contributions

If you encounter a bug or issue, please file an issue on the GitHub. 

If you'd like to contribute you can send me suggestions through the SillyTavern discord, or you may fork and submit a pull request—though I'll probably be very slow at reviewing and accepting them.  

Beware: the code is rough as it's my first ever project using JS/HTML/CSS.

## License

SillyTavern Dialogue Colorizer is licenced under the [MIT License](./LICENSE).

[Vibrant.js](https://github.com/jariz/vibrant.js/) is licensed under the [MIT License](./LICENSE).
