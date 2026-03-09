import { Window } from "happy-dom";

const window = new Window();
const document = window.document;

// Install DOM globals
Object.assign(globalThis, {
  window,
  document,
  Element: window.Element,
  HTMLElement: window.HTMLElement,
});
