st2 i160 – Create icons and compile icon set

- Creates icon set `st2` in Fontello including all icons (fron Adri)
- Selects only the icons asked for and mentioned in issue 160
- Includes `st2-config.json` file in the main `fonts` folder
	1. Includes screenshot of the entire icon set `st2-allicons-110818.png`
	2. To add or update icons, got to Fontello.com and drag the `st2-config.json` file into the browser window
	3. Choose the icons you want to add to the set (click the icon to highlight)
	4. You may need to check and update the unicode under the "Customize Codes" – if the icon exists in the application already, check for CSS references to `content: "\e(that code)"` and update the "Customize Codes" in Fontello to be the same reference
	5. In Fontello, click the "Download webfont" button
	6. Open the downloaded ZIP file
	7. Rename `config.json` to `st2-config.json`
	8. Copy the renamed `st2-config.json` file and the fonts in the `font` folder into the top level `font` folder in the application
	9. In the "css" folder, open the file `st2.css`
	10. Copy all of the icon declaration lines (e.g. ".icon-plus:before { content: '\e915'; }..." to the bottom)
	11. In in `st2flow/modules/st2-style/font/` in the `st2.css' file, replace the declarations with the ones you just copied 