// utils/avatar.js
export function hashInt(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function colorFromName(name) {
  const hues = [210, 260, 300, 340, 10, 30, 140];
  const h = hues[hashInt(name) % hues.length];
  return `hsl(${h} 70% 55%)`;
}

export function initials(name) {
  const parts = (name || "").trim().split(/\s+/);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[parts.length - 1]?.[0] || "").toUpperCase();
  return (a + b) || "U";
}

export function avatarOf(name, size = 128) {
  const bg = colorFromName(name || "Usuario");
  const text = initials(name || "Usuario");
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
      <defs>
        <clipPath id='r'><circle cx='${size / 2}' cy='${size / 2}' r='${size / 2}'/></clipPath>
      </defs>
      <rect width='100%' height='100%' fill='${bg}' />
      <g clip-path='url(#r)'>
        <rect width='100%' height='100%' fill='${bg}' />
      </g>
      <text x='50%' y='58%' font-family='Inter,system-ui,sans-serif'
            font-size='${size * 0.4}' text-anchor='middle'
            fill='white' font-weight='700'>${text}</text>
    </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
