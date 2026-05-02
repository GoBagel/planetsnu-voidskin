# planetsnu-voidskin

A lightweight Tampermonkey userscript for customizing the **Planets.nu** starmap background.

VoidSkin lets you replace the default galactic canvas background with a solid color, remote image URL, or locally uploaded image.

## Features

- Solid color background
- Remote image URL background
- Local image upload using browser storage
- Display modes:
  - Stretch
  - Tile
  - Contain
- Injects settings into the Planets.nu settings screen
- No server required
- No external dependencies

## Installation

1. Install Tampermonkey or another compatible userscript manager.
2. Create a new userscript.
3. Paste in the contents of the VoidSkin script.
4. Save the script.
5. Open or reload Planets.nu.

## Usage

Open **Settings** in Planets.nu and look for the **Galactic Background** section.

From there, choose:

- **Solid Color** for a simple RGB/color-picker background
- **Image** for a URL or uploaded local image
- **Stretch / Tile / Contain** to control how the image is displayed

## Local Images

Local image support uses a file picker and stores the selected image as a browser-local data URL.

Direct file paths (file:///) are not reliable from within a web page/userscript context.

## Supported Sites

- https://planets.nu/*
- https://play.planets.nu/*

## Project Status

Early/simple utility script. Intended as a small visual enhancement and potential companion to larger Parallax Nu visual projects.

## License

MIT License

Copyright (c) 2026 GoBagel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND.
