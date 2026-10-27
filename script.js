const orb = document.getElementById("orb");
const fortuneEl = document.getElementById("fortune");

const REVEAL_DELAY_MS = 2500; // length of the smoke and sparkle animation
const STORAGE_KEY = "fortuneDeck";

// Random pick without repeats. The deck is shuffled once, and each fortune is
// shown once. When the deck is empty, it is rebuilt, and the last shown fortune
// is kept out of the first position so the same one never appears twice in a row.
function loadDeck() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch (_) {
    // ignore broken storage and start a new deck
  }
  return [];
}

function saveDeck(deck) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
  } catch (_) {
    // storage may be unavailable; the deck then lives only for this page load
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

let deck = loadDeck();
let lastShown = null;

function nextFortune() {
  if (deck.length === 0) {
    deck = shuffle(FORTUNES.map((_, index) => index));
    if (deck.length > 1 && FORTUNES[deck[0]] === lastShown) {
      [deck[0], deck[1]] = [deck[1], deck[0]];
    }
  }
  const index = deck.pop();
  saveDeck(deck);
  lastShown = FORTUNES[index];
  return lastShown;
}

function revealFortune() {
  fortuneEl.classList.remove("show");
  fortuneEl.textContent = nextFortune();
  requestAnimationFrame(() => fortuneEl.classList.add("show"));
}

let busy = false;

function consultOrb() {
  if (busy) return;
  busy = true;

  // Fire-and-forget: counts the click without delaying the animation.
  fetch("/api/click", { method: "POST" }).catch(() => {
    // Counting is best-effort; the fortune still works if this fails.
  });

  fortuneEl.classList.remove("show");
  orb.classList.remove("active");
  void orb.offsetWidth; // restart the animation on repeat clicks
  orb.classList.add("active");

  setTimeout(() => {
    revealFortune();
    orb.classList.remove("active");
    // One fortune per page load: the hint disappears and the ball stops responding.
    orb.classList.add("used");
    orb.disabled = true;
    busy = false;
  }, REVEAL_DELAY_MS);
}

orb.addEventListener("click", consultOrb);
