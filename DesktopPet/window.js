// Native Mac window. The pet and its animations live in pet.ts and pet.html.
ObjC.import('Cocoa');
ObjC.import('WebKit');

// Keep the whole pet accessible if a display is resized or disconnected.
function startingPoint(saved, screens, main, width, height) {
  const fallback = { x: main.origin.x + main.size.width - width - 32, y: main.origin.y + 34 };
  const point = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y) ? saved : fallback;
  let area = main;
  let bestOverlap = 0;
  for (const screen of screens) {
    const overlapWidth = Math.min(point.x + width, screen.origin.x + screen.size.width) -
      Math.max(point.x, screen.origin.x);
    const overlapHeight = Math.min(point.y + height, screen.origin.y + screen.size.height) -
      Math.max(point.y, screen.origin.y);
    const overlap = Math.max(0, overlapWidth) * Math.max(0, overlapHeight);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      area = screen;
    }
  }
  return {
    x: Math.max(area.origin.x, Math.min(point.x, area.origin.x + area.size.width - width)),
    y: Math.max(area.origin.y, Math.min(point.y, area.origin.y + area.size.height - height))
  };
}

function run(args) {
  const app = $.NSApplication.sharedApplication;
  app.setActivationPolicy($.NSApplicationActivationPolicyAccessory);
  app.finishLaunching;
  const area = $.NSScreen.mainScreen.visibleFrame;
  const width = 176, height = 156;
  const name = args[1] || 'Ghosty';
  const preferences = $.NSUserDefaults.alloc.initWithSuiteName('local.' + name.toLowerCase() + '.desktop-pet');
  const saved = ObjC.deepUnwrap(preferences.dictionaryForKey('lastDrop'));
  const displays = $.NSScreen.screens;
  const screens = Array.from({ length: Number(displays.count) },
    (_, index) => displays.objectAtIndex(index).visibleFrame);
  const start = startingPoint(saved, screens, area, width, height);
  if (!saved && name !== 'Ghosty') {
    const offset = { Bat: 1, Skeleton: 2, Bunny: 3 }[name] || 1;
    start.x = Math.max(area.origin.x, start.x - offset * width);
    start.y = Math.min(area.origin.y + area.size.height - height, start.y + offset * 45);
  }
  const window = $.NSPanel.alloc.initWithContentRectStyleMaskBackingDefer(
    $.NSMakeRect(start.x, start.y, width, height),
    $.NSWindowStyleMaskBorderless, $.NSBackingStoreBuffered, false);
  window.opaque = false;
  window.backgroundColor = $.NSColor.clearColor;
  window.hasShadow = false;
  window.hidesOnDeactivate = false;
  window.level = $.NSFloatingWindowLevel;
  window.collectionBehavior = $.NSWindowCollectionBehaviorCanJoinAllSpaces;
  ObjC.registerSubclass({
    name: 'GhostyWebView',
    superclass: 'WKWebView',
    methods: { 'acceptsFirstMouse:': { types: ['bool', ['id']], implementation: () => true } }
  });
  const config = $.WKWebViewConfiguration.new;
  const view = $.GhostyWebView.alloc.initWithFrameConfiguration(
    $.NSMakeRect(0, 0, width, height), config);
  view.setValueForKey($.NSNumber.numberWithBool(false), $('drawsBackground'));
  window.contentView = view;
  const url = $.NSURL.fileURLWithPath(args[0]);
  view.loadFileURLAllowingReadAccessToURL(url, url);
  window.orderFrontRegardless;
  console.log(name + " is running (window " + window.windowNumber + "). Right-click for actions.");
  let shouldQuit = false;
  ObjC.registerSubclass({
    name: 'GhostyMenuTarget',
    methods: {
      'moveDuringMenu:': { types: ['void', ['id']], implementation() { advanceGlide(); } },
      'choose:': {
        types: ['void', ['id']],
        implementation(item) {
          const action = ObjC.unwrap(item.representedObject);
          if (action === 'quit') shouldQuit = true;
          else view.evaluateJavaScriptCompletionHandler('chooseAction(' + JSON.stringify(action) + ')', () => {});
        }
      }
    }
  });
  const target = $.GhostyMenuTarget.new;
  function addAction(menu, label, action) {
    const item = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent(label, 'choose:', '');
    item.target = target;
    item.representedObject = $(action);
    menu.addItem(item);
    return item;
  }

  function showMenu() {
    const menu = $.NSMenu.alloc.initWithTitle(name);
    menu.autoenablesItems = false;
    const asleep = ObjC.unwrap(view.title) === 'sleep';
    const actions = {
      Ghosty: [['Boo!', 'boo'], ['Glide around', 'walk'], ['Hover in place', 'idle']],
      Bat: [['Fly around', 'walk']],
      Bunny: [['Binky', 'boo'], ['Groom', 'groom'], ['Listen', 'listen'], ['Roam around', 'walk'], ['Rest', 'idle']],
      Skeleton: [['Rattle', 'boo'], ['Walk around', 'walk'], ['Rest', 'idle']]
    }[name];
    addAction(menu, 'Wave', 'wave');
    for (const [label, action] of actions) addAction(menu, label, action);
    menu.addItem($.NSMenuItem.separatorItem);
    addAction(menu, asleep ? 'Wake up' : 'Sleep', asleep ? 'walk' : 'sleep');
    menu.addItem($.NSMenuItem.separatorItem);
    addAction(menu, 'Quit ' + name, 'quit');

    const frame = window.frame;
    const screen = window.screen.visibleFrame;
    const gap = 4;
    const right = frame.origin.x + width + gap;
    const fitsRight = right + menu.size.width <= screen.origin.x + screen.size.width;
    const x = fitsRight ? right : frame.origin.x - menu.size.width - gap;
    const y = frame.origin.y + (height + menu.size.height) / 2;
    const localY = view.isFlipped ? height - (y - frame.origin.y) : y - frame.origin.y;
    // AppKit runs its own event loop until the menu closes.
    const timer = $.NSTimer.timerWithTimeIntervalTargetSelectorUserInfoRepeats(
      0.05, target, 'moveDuringMenu:', $(), true);
    $.NSRunLoop.mainRunLoop.addTimerForMode(timer, $.NSEventTrackingRunLoopMode);
    try {
      menu.popUpMenuPositioningItemAtLocationInView($(), $.NSMakePoint(x - frame.origin.x, localY), view);
    } finally {
      timer.invalidate;
    }
  }

  let anchor = null;
  let dragged = false;
  const startsOnLeft = start.x + width / 2 < area.origin.x + area.size.width / 2;
  let heading = Math.atan2(11, startsOnLeft ? -17 : 17);
  let secondsUntilTurn = 6 + Math.random() * 6;
  let remainingTurn = 0;
  const usualSpeed = 20;
  const slowStretchSeconds = 4;
  let secondsUntilSlowdown = 8 + Math.random() * 8;
  let secondsUntilNap = 90 + Math.random() * 90;
  let secondsUntilLook = 15 + Math.random() * 15;
  let glideX = null;
  let lastTick = Date.now();
  let glideY = null;
  function advanceGlide() {
    const now = Date.now();
    const state = ObjC.unwrap(view.title);
    if (!anchor && state === 'watch') {
      const mouse = $.NSEvent.mouseLocation;
      const origin = window.frame.origin;
      const x = mouse.x - (origin.x + width / 2);
      // Cocoa's y-axis points upward. The drawing's y-axis points downward.
      const y = origin.y + height * (['Bat', 'Bunny'].includes(name) ? 0.55 : 0.70) - mouse.y;
      view.evaluateJavaScriptCompletionHandler('aimEyes(' + x + ',' + y + ')', () => {});
    }
    if (!anchor && state === 'walk') {
      const bounds = window.screen.visibleFrame;
      const origin = window.frame.origin;
      const left = bounds.origin.x, right = left + bounds.size.width - width;
      // macOS rounds window positions. Accumulate small steps before rounding.
      const seconds = Math.min(now - lastTick, 100) / 1000;
      secondsUntilNap -= seconds;
      if (secondsUntilNap <= 0) {
        secondsUntilNap = 90 + Math.random() * 90;
        view.evaluateJavaScriptCompletionHandler('takeLittleNap()', () => {});
        lastTick = now;
        return;
      }
      secondsUntilLook -= seconds;
      if (secondsUntilLook <= 0) {
        secondsUntilLook = 15 + Math.random() * 15;
        view.evaluateJavaScriptCompletionHandler('lookAround(' + (Math.random() < 0.5) + ')', () => {});
        lastTick = now;
        return;
      }
      secondsUntilTurn -= seconds;
      if (secondsUntilTurn <= 0) {
        remainingTurn = (35 + Math.random() * 65) * Math.PI / 180;
        if (Math.random() < 0.5) remainingTurn *= -1;
        secondsUntilTurn = 6 + Math.random() * 6;
      }
      const turn = Math.sign(remainingTurn) * Math.min(Math.abs(remainingTurn), seconds * 0.9);
      heading += turn;
      remainingTurn -= turn;
      secondsUntilSlowdown -= seconds;
      let speed = usualSpeed;
      if (secondsUntilSlowdown <= 0) {
        // One smooth dip in speed over four seconds of actual roaming.
        const progress = Math.min(-secondsUntilSlowdown / slowStretchSeconds, 1);
        speed -= 11 * Math.sin(Math.PI * progress) ** 2;
        if (progress === 1) secondsUntilSlowdown = 8 + Math.random() * 8;
      }
      const dx = Math.cos(heading) * speed * seconds;
      const dy = Math.sin(heading) * speed * seconds;
      const next = (glideX ?? origin.x) + dx;
      const bottom = bounds.origin.y, top = bottom + bounds.size.height - height;
      const nextY = (glideY ?? origin.y) + dy;
      glideY = Math.max(bottom, Math.min(top, nextY));
      if ((dy < 0 && nextY <= bottom) || (dy > 0 && nextY >= top)) {
        heading = -heading;
        remainingTurn = 0;
      }
      glideX = Math.max(left, Math.min(right, next));
      const x = Math.round(glideX);
      const y = Math.round(glideY);
      if (x !== origin.x || y !== origin.y) window.setFrameOrigin($.NSMakePoint(x, y));
      if ((dx < 0 && next <= left) || (dx > 0 && next >= right)) {
        heading = Math.PI - heading;
        remainingTurn = 0;
      }
    } else {
      glideX = null;
      glideY = null;
    }
    lastTick = now;
  }
  while (!shouldQuit) {
    const event = app.nextEventMatchingMaskUntilDateInModeDequeue(
      0xffffffff, $.NSDate.dateWithTimeIntervalSinceNow(0.05),
      $.NSDefaultRunLoopMode, true);
    advanceGlide();
    if (!event || event.isNil()) continue;
    const type = Number(event.type);
    const onPet = Number(event.windowNumber) === Number(window.windowNumber);
    const leftDown = type === Number($.NSEventTypeLeftMouseDown);
    if (onPet && (type === Number($.NSEventTypeRightMouseDown) ||
        (leftDown && (Number(event.modifierFlags) & Number($.NSEventModifierFlagControl))))) {
      anchor = null;
      showMenu();
      lastTick = Date.now();
      continue;
    }
    if (onPet && leftDown) {
      anchor = event.locationInWindow;
      dragged = false;
    }
    if (anchor && type === Number($.NSEventTypeLeftMouseDragged)) {
      const point = event.locationInWindow;
      if (point.x !== anchor.x || point.y !== anchor.y) dragged = true;
      const origin = window.frame.origin;
      window.setFrameOrigin($.NSMakePoint(origin.x + point.x - anchor.x,
        origin.y + point.y - anchor.y));
    }
    if (type === Number($.NSEventTypeLeftMouseUp)) {
      if (anchor && dragged) {
        const origin = window.frame.origin;
        preferences.setObjectForKey($({ x: origin.x, y: origin.y }), 'lastDrop');
      }
      anchor = null;
    }
    app.sendEvent(event);
  }
  window.orderOut(null);
}
