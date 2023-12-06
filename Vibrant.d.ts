type Tuple<T, N extends number, TArr extends T[] = []> = 
    number extends N ? T[] : TArr['length'] extends N ? TArr : Tuple<T, N, [T, ...TArr]>;

type Maybe<T> = T | undefined;

interface VibrantConstructor {
    /**
     * @param image
     * @param [paletteNumberCount=64]
     * @param [quality=5] 
     */
    new (image: HTMLImageElement!, paletteNumberCount?: number = 64, quality?: number = 5): VibrantObj;
}

interface VibrantObj {
    swatches(): VibrantSwatches;
}

interface VibrantSwatches {
    Vibrant: Maybe<VibrantSwatch>;
    Muted: Maybe<VibrantSwatch>;
    DarkVibrant: Maybe<VibrantSwatch>;
    DarkMuted: Maybe<VibrantSwatch>;
    LightVibrant: Maybe<VibrantSwatch>;
    LightMuted: Maybe<VibrantSwatch>;
};

interface VibrantSwatch {
    //new (rgb: Tuple<number, 3>, population: number): VibrantSwatch;

    getRgb(): Tuple<number, 3>;
    getHsl(): Tuple<number, 3>;
    getHex(): string;
    getPopulation(): number;
    getTitleTextColor(): string;
    getBodyTextColor(): string;
}