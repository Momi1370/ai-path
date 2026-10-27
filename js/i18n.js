// Farsi explanations: the setting turns on a class on <body>; the Farsi blocks are already in the page and a rule in
// css/app.css shows them. Nothing is fetched or re-rendered when the setting changes.
import { h } from './dom.js';

export const applyFarsi = (on) => document.body.classList.toggle('fa-on', Boolean(on));
export const farsi = (html) => (html ? h('div', { class: 'fa', lang: 'fa', dir: 'rtl', html }) : null);
