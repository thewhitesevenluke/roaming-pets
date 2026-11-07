type PetState = 'idle' | 'walk' | 'sleep' | 'wave' | 'boo' | 'look' | 'watch' | 'wake' | 'groom' | 'listen' | 'stretch' | 'roll';
const duration = { wave: 1600, boo: 850, look: 900, watch: 1000, wake: 1200, groom: 2000, listen: 1600, stretch: 1500, roll: 1500 };
let restingMode: 'walk' | 'idle' = 'walk';
let timer = 0;

// A floating window can be open while another app has focus. Check that
// WebKit is advancing the visible pet's CSS animations in that state.
let walkClock = new Map<Animation, number>();
let lastWalkSample = 0;
function checkWalkClock(now: number): boolean {
  if (document.title !== 'walk') return false;
  const svg = pet.querySelector('svg')!;
  const visiblePet = svg.querySelector('.' + document.body.dataset.pet)!;
  const animations = [...svg.getAnimations(), ...visiblePet.getAnimations({ subtree: true })];
  const elapsed = Math.min(now - lastWalkSample, 500);
  const next = new Map<Animation, number>();
  let recovered = false;
  for (const animation of animations) {
    if (animation.playState === 'finished' || animation.playState === 'idle') continue;
    const time = animation.currentTime;
    if (typeof time !== 'number') continue;
    if (walkClock.get(animation) === time && elapsed > 0) {
      animation.currentTime = time + elapsed;
      recovered = true;
    }
    next.set(animation, Number(animation.currentTime));
  }
  lastWalkSample = now;
  walkClock = next;
  return recovered;
}

function updateLabel() {
  const kind = document.body.dataset.pet || 'ghosty';
  pet.setAttribute('aria-label', kind + '. ' + pet.title);
}

function play(state: PetState) {
  walkClock.clear();
  lastWalkSample = 0;
  if (state === 'sleep') {
    const svg = pet.querySelector('svg')!;
    const transform = getComputedStyle(svg).transform;
    const pose = transform === 'none' ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(transform);
    pet.style.setProperty('--sleep-y', pose.f + 'px');
    pet.style.setProperty('--sleep-tilt', Math.atan2(pose.b, pose.a) + 'rad');
  }
  pet.title = state === 'sleep' ? "Click to wake" : "Click to wave · Drag to move · Right-click for actions";
  updateLabel();
  document.body.dataset.state = state;
  document.title = state;
  clearTimeout(timer);
  if (state !== 'walk' && state !== 'idle' && state !== 'sleep') {
    timer = window.setTimeout(() => play(restingMode), duration[state]);
  }
}

const pet = document.querySelector<HTMLButtonElement>('#pet')!;
// The Mac menu sends its selected action to this function.
function chooseAction(action: PetState) {
  if (action === 'walk' || action === 'idle') restingMode = action;
  const waking = action === 'walk' && document.body.dataset.state === 'sleep';
  play(waking ? 'wake' : action);
}
function switchPet(kind: string) {
  pet.querySelector('.travel-facing')!.getAnimations().forEach(animation => animation.cancel());
  delete document.body.dataset.facing;
  document.body.dataset.pet = kind;
  down = null;
  restingMode = 'walk';
  play('walk');
}
function faceTravel(direction: number) {
  const body = document.body;
  const side = direction > 0 ? 'right' : 'left';
  if (body.dataset.facing === side) return;
  const previous = body.dataset.facing;
  body.dataset.facing = side;
  if (!previous) return;

  const sign = direction > 0 ? -1 : 1;
  const drawing = pet.querySelector<HTMLElement>('.travel-facing')!;
  // Ease into the turn, switch sides, then settle at full width.
  drawing.animate([
    { transform: 'scaleX(' + -sign + ')' },
    { transform: 'scaleX(' + -sign * 0.78 + ')', offset: 0.5 },
    { transform: 'scaleX(' + sign * 0.78 + ')', offset: 0.5 },
    { transform: 'scaleX(' + sign + ')' }
  ], { duration: 380, easing: 'ease-in-out' });
}

function takeLittleNap() {
  if (document.title !== 'walk') return;
  play('sleep');
  // Other actions clear this timer, including an early wake-up click.
  timer = window.setTimeout(() => chooseAction('walk'), 5000 + Math.random() * 4000);
}
function lookAround(watchCursor: boolean) {
  if (document.title !== 'walk') return;
  if (!watchCursor && document.body.dataset.pet === 'bunny') {
    play(Math.random() < 0.5 ? 'listen' : 'groom');
    return;
  }
  const direction = Math.random() < 0.5 ? -1 : 1;
  pet.style.setProperty('--glance-x', (direction * (document.body.dataset.pet === 'bat' ? 1.5 : 5)) + 'px');
  pet.style.setProperty('--gaze-x', '0px');
  pet.style.setProperty('--gaze-y', '0px');
  pet.style.setProperty('--ear-angle', '0');
  play(watchCursor ? 'watch' : 'look');
}
function aimEyes(x: number, y: number) {
  if (document.title !== 'watch') return;
  // Close cursors get a small glance. Distant ones get the full eye movement.
  const distance = Math.max(100, Math.hypot(x, y));
  if (document.body.dataset.pet === 'turtle') pet.style.setProperty('--neck-lift', (5 * y / distance) + 'px');
  if (document.body.dataset.pet === 'bunny') pet.style.setProperty('--ear-angle', String(5 * x / distance * (document.body.dataset.facing === 'right' ? -1 : 1)));
  const isBat = document.body.dataset.pet === 'bat';
  pet.style.setProperty('--gaze-x', ((isBat ? 2 : 7) * x / distance) + 'px');
  pet.style.setProperty('--gaze-y', ((isBat ? 1.5 : 4) * y / distance) + 'px');
}
function greetOrWake() {
  if (document.body.dataset.state === 'sleep') {
    chooseAction('walk');
  } else if (document.body.dataset.state !== 'wake') {
    play('wave');
  }
}

let down: { x: number; y: number } | null = null;
let moved = false;
pet.onpointerdown = event => {
  if (event.button !== 0) return;
  down = { x: event.screenX, y: event.screenY };
  moved = false;
  pet.setPointerCapture(event.pointerId);
};
pet.onpointermove = event => {
  if (down && Math.hypot(event.screenX - down.x, event.screenY - down.y) > 4) moved = true;
};
pet.onpointerup = event => {
  if (down && !moved && Math.hypot(event.screenX - down.x, event.screenY - down.y) <= 4) greetOrWake();
  down = null;
};
pet.onpointercancel = () => { down = null; };
pet.onclick = event => { if (event.detail === 0) greetOrWake(); };
play('walk');
