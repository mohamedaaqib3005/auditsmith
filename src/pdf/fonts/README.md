# Fonts

Bundled (both under the SIL Open Font License, free for commercial use):

- Manrope-Regular.ttf, Manrope-Bold.ttf  (c) Mikhail Sharanda, https://manropefont.com
- GeistMono-Regular.ttf  (c) Vercel, https://vercel.com/font

## Adding Cabinet Grotesk (headings)

Fontshare's ITF Free Font Licence doesn't permit redistributing the file in this
repo, so download it yourself (free):

1. Go to https://www.fontshare.com/fonts/cabinet-grotesk and download the family
2. From the zip, copy `Fonts/WEB/fonts/CabinetGrotesk-Extrabold.ttf` into this folder
3. In `src/pdf/styles/theme.js`, uncomment the Cabinet Grotesk import and
   Font.register block, and set `fonts.heading` to "Cabinet Grotesk"

Restart the dev server after adding font files.

## Adding any other font

1. Get the font as .ttf (react-pdf does not support woff2 or variable fonts)
2. Drop the file(s) here
3. Register in theme.js with Font.register, one entry per weight
4. Reference the family name in the `fonts` export
