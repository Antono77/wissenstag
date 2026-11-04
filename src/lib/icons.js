// Eigene, schlichte Linien-Icons (feste Strings, keine Nutzerdaten)
const s = (inhalt) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inhalt}</svg>`;

export const icons = {
  start: s('<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>'),
  lernen: s('<rect x="3.5" y="4" width="7" height="7" rx="2"/><rect x="13.5" y="4" width="7" height="7" rx="2"/><rect x="3.5" y="14" width="7" height="7" rx="2"/><rect x="13.5" y="14" width="7" height="7" rx="2"/>'),
  duemmste: s('<path d="M12 3.5c-3 0-5.5 2.3-5.5 5.2 0 1.9 1 3.4 2.5 4.3V16h6v-3c1.5-.9 2.5-2.4 2.5-4.3 0-2.9-2.5-5.2-5.5-5.2Z"/><path d="M10 19.5h4"/><path d="M12 7.5v3"/><circle cx="12" cy="12.6" r=".4" fill="currentColor"/>'),
  aktuell: s('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="M7 9h10M7 12.5h10M7 16h6"/>'),
  fortschritt: s('<path d="M4 19.5h16"/><path d="M7 16V11"/><path d="M12 16V7"/><path d="M17 16v-3.5"/>'),
  sonne: s('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
  mond: s('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'),
  auto: s('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17" /><path d="M12 3.5a8.5 8.5 0 0 1 0 17Z" fill="currentColor"/>'),
  herz: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#B8361F" d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"/></svg>',
  pfeil: s('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  uhr: s('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
};
