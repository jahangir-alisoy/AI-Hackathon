import { initials } from '../lib/format.js';

const PALETTE = 6;

const hash = (text) => [...text].reduce((sum, char) => sum + char.charCodeAt(0), 0);

export const Avatar = ({ name, size = 32 }) => (
  <span className={`avatar avatar--${hash(name ?? '') % PALETTE}`} style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
    {initials(name)}
  </span>
);
