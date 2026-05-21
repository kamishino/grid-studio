declare module 'culori' {
  export type CuloriColor = {
    mode: string;
    [channel: string]: number | string | undefined;
  };

  export function converter(mode: string): (color: CuloriColor | string) => CuloriColor | undefined;
  export function formatHex(color: CuloriColor): string;
  export function parse(color: string): CuloriColor | undefined;
}
