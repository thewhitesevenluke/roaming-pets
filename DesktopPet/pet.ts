type PetState = 'idle' | 'walk' | 'sleep' | 'wave' | 'boo' | 'look' | 'watch' | 'wake';
const duration = { wave: 1600, boo: 850, look: 1000, watch: 1300, wake: 1200 };
let restingMode: 'walk' | 'idle' = 'walk';
let timer = 0;

function updateLabel() {
  const kind = document.body.dataset.pet || 'ghosty';
  pet.setAttribute('aria-label', kind + '. ' + pet.title);
}

function play(state: PetState) {
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
  if (state === 'wave' || state === 'boo' || state === 'look' || state === 'watch' || state === 'wake') {
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
function takeLittleNap() {
  if (document.title !== 'walk') return;
  play('sleep');
  // Other actions clear this timer, including an early wake-up click.
  timer = window.setTimeout(() => chooseAction('walk'), 5000 + Math.random() * 4000);
}
function lookAround(watchCursor: boolean) {
  if (document.title === 'walk') play(watchCursor ? 'watch' : 'look');
}
function aimEyes(x: number, y: number) {
  if (document.title !== 'watch') return;
  // Close cursors get a small glance. Distant ones get the full eye movement.
  const distance = Math.max(42, Math.hypot(x, y));
  if (document.body.dataset.pet === 'bunny') pet.style.setProperty('--ear-angle', String(12 * x / distance));
  const isBat = document.body.dataset.pet === 'bat';
  pet.style.setProperty('--gaze-x', ((isBat ? 4 : 22) * x / distance) + 'px');
  pet.style.setProperty('--gaze-y', ((isBat ? 3 : 14) * y / distance) + 'px');
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
