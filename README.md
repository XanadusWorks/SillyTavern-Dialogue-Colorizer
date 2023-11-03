# SillyTavern Dialogue Colorizer

This extension for SillyTavern gives you various options to automatically color quoted text for character dialogue. User dialogue is unaffected for now.

![Colored dialogue example](./images/st-dialogue-colorizer-dialogue-example.png)

## Features

- Change quoted text color to a different color, either dynamically based on the character's avatar card, a per-character color, or a simple static color.
- Character-specific color (set via the character card edit panel) overrides the global setting.

## Installation and Usage

### Installation

Use ST's inbuilt third-party extension installer button to install. Go to the Extensions tab, then click `Install extension`. Enter the URL of this Github repository, then hit `Save`.

![SillyTavern Extensions > Install extension](./images/st-tp-extension-install.png)

![Enter Github URL > Save](./images/st-tp-extension-install2.png)

### Usage

By default, the extension will be active and will change the color of quoted text within a character chat based on the most vibrant color in their character's avatar image.

You can set a color per-character by opening the character card's edit panel and setting a color in the `Dialogue Color` section via either using the color picker or entering a hex code manually. This color will override the `Colorize Source` setting in the extension settings. If you no longer want the character-specific color, simply clear the textbox.

![Dialogue Color setting in the character card edit panel.](./images/st-character-card-dialogue-color.png)

Note that the character-specific dialogue color is saved to the extension's settings, *not* the character card. If you change the character's avatar, you will have to set the color again.

There are a couple of options to change what color is used for dialogue. Open the Extensions tab and then open the settings for `Dialogue Colorizer`.

**Colorize Source** This is how you choose where the color used comes from.  
    1. **Dominant Avatar** This dynamically chooses a dialogue color by finding the most 'vibrant' color in the character's avatar, then does some saturation/lightness adjustments to make sure it's readable.  
    2. **Static Color** This uses the `Static Color` color - set further down in the extension settings - for every character's dialogue (aside from the characters you give a specific color to).  
    3. **Per-Character Only** This enables the dialogue coloring only for characters where a color is specified. Other characters will use the normal ST dialogue color.

Note that if a character has a color specified in their card settings, that color will always be used instead unless you remove it by clearing the textbox.

**Static Color** If `Colorize Source` is set to `Static Color`, this is the color used for character dialogue. Click the color swatch to bring up a color picker or type in a hex code manually.

![Showcase of extension settings](./images/st-extension-settings.png)

## Prerequisites

This extension was built on SillyTavern commit [064d331](https://github.com/SillyTavern/SillyTavern/commit/064d33111038f16c28b16c7d9d4e7b65e0fe72c8) and may not function correctly on older versions.

## Support and Contributions

If you encounter a bug or issue, please file an issue on the GitHub. 

If you'd like to contribute, you may fork and submit a pull request, though I'll probably be very slow at reviewing and accepting them. Beware: the code is rough as it's my first ever project using JS/HTML/CSS.

## License

SillyTavern Dialogue Colorizer is licenced under the [MIT License](./LICENSE).

[Vibrant.js](https://github.com/jariz/vibrant.js/) is licensed under the [MIT License](./LICENSE).
