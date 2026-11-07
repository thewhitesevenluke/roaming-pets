# Roaming Pets

Little roaming desktop pets for your Mac. Ghosty waves and watches your cursor, Bat flies and hangs upside down to sleep, and Tiny Skeleton folds into a pile of bones to nap.

The General pack includes Turtle, a slow ambler that naps inside its shell, and Bunny, a cream-colored rabbit that roams, sniffs, and does a little twisting jump called a binky.

## Get the pets

[Download the latest release](https://github.com/thewhitesevenluke/roaming-pets/releases/latest). Choose the General Pack ZIP for Bunny, Turtle, and Hedgehog, the Halloween Pack ZIP for Ghosty, Bat, and Tiny Skeleton, or an individual pet ZIP. Unzip it in Finder and double-click the app. Open multiple pets to have them roam together.

Requires macOS 11 or newer. These apps are locally signed and have not been notarized by Apple. macOS may block a downloaded app. [Apple’s guide to opening downloaded apps](https://support.apple.com/en-us/102445)

## Controls

Click a pet to wave or wake it. Drag it to choose a spot, which it remembers on its next launch. Right-click to see its actions or quit. Each pet sometimes takes a short nap on its own. Choose Sleep to let it rest until you wake it.

## Build from source

On a Mac with Node.js 24 or newer and Apple Command Line Tools installed, open Terminal in the project folder and run:

```sh
cd DesktopPet
npm run package
```

This builds Hedgehog.app, Turtle.app, Bunny.app, Ghosty.app, Bat.app, and Skeleton.app in the parent folder.

Right-click any pet and open **Choose pet** to switch characters in its window. The menu changes to that pet’s actions. Each app starts with its own pet when opened.
