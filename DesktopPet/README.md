# Ghosty for macOS

Ghosty floats above your other windows. The artwork comes from the supplied reference. The app hides the blue-gray background as it draws the ghost.

## Open Ghosty

Double-click **Ghosty.app**, **Bat.app**, **Skeleton.app**, **Bunny.app**, **Turtle.app**, or **Hedgehog.app** in Finder. Each launches its own pet, with a separate sleeping pose and saved spot. Ghosty starts gliding right away and occasionally curves onto a new course as it roams. Every 90–180 seconds of roaming, Ghosty naps for 5–9 seconds, slowly opens its eyes, and glides on. You can click to wake it early. It sometimes slows for a few seconds, then picks up its usual pace. Occasionally it pauses for a second to glance around. Sometimes its eyes follow your cursor during the pause, then it blinks and moves on. It turns back at the top and bottom. You can open its menu while it moves. Choose **Hover in place** to pause or **Glide around** to resume. At either side of the screen, the pet turns and keeps roaming. Right-click and choose **Quit Ghosty** to close it.

## Run or edit the source

1. Use a Mac with Node.js 24 or newer. To check your version, type `node -v` in Terminal.
2. In Terminal, type `cd ` (including the space), drag the DesktopPet folder into Terminal, and press Return.
3. Type `npm start` and press Return. Ghosty appears near the bottom-right of your main screen. Keep Terminal open while you play.

Click Ghosty to wave. Drag to reposition. Ghosty remembers where you drop it and starts there next time, even if it glides away afterward. If your display setup changes, Ghosty starts within a visible screen. Choose **Sleep** from the right-click menu for a lasting nap. Dragging keeps Ghosty asleep. A single click wakes Ghosty and starts it roaming again. Right-click or Control-click to open the Mac menu beside Ghosty. While Ghosty sleeps, the menu offers **Wake up**. Press Escape or click outside to close the menu. You can also stop the app with Control-C in its Terminal window.

## First-version plan

1. Show the reference ghost in a small transparent floating window.
2. Let Ghosty roam continuously and pause to wave when clicked.
3. Support dragging and a small action menu, including a playful BOO! that briefly enlarges the ghost.

## Make your first change

Open `pet.ts` and change the wave duration from `1600` to `2000` for a two-second greeting. Restart Ghosty to try it.

The timers and interactions live in `pet.ts`. The drawing and animations live in `pet.html`. A small native Mac window in `window.js` hosts them. Node starts the app directly, with no packages to install.

After editing the source, run `npm run package` to rebuild the pet apps beside the project folder.


Right-click any pet and open **Choose pet** to switch characters in its window. The menu changes to that pet’s actions. Each app starts with its own pet when opened.
