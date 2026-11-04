// Faktentabellen Alltag & Allerlei
export default {
  klasse: 'alltag',
  tabellen: [
    {
      prefix: 'all-ho',
      spalten: ['jahre', 'name', 's'],
      zeilen: [
        ['5', 'Hölzerne Hochzeit', 2], ['10', 'Rosenhochzeit', 2], ['25', 'Silberne Hochzeit', 1], ['30', 'Perlenhochzeit', 2],
        ['40', 'Rubinhochzeit', 2], ['50', 'Goldene Hochzeit', 1], ['60', 'Diamantene Hochzeit', 1], ['65', 'Eiserne Hochzeit', 3], ['70', 'Gnadenhochzeit', 3],
      ],
      fragen: [{
        frage: (r) => `Wie heißt der Hochzeitstag nach ${r.jahre} Ehejahren?`,
        richtig: (r) => r.name,
        titel: () => 'Hochzeitstage',
        merke: (r) => `${r.jahre} Jahre: ${r.name}.`,
        text: () => 'Für manche Jahrestage gibt es je nach Region unterschiedliche Namen. Silber, Gold und Diamant sind überall gleich.',
        ddf: (r) => r.s === 1,
      }],
    },
    {
      prefix: 'all-vz',
      spalten: ['schild', 'form', 's'],
      zeilen: [
        ['das Stoppschild', 'Achteckig und rot', 1], ['das Schild „Vorfahrtstraße“', 'Auf der Spitze stehendes gelbes Quadrat (Raute)', 1],
        ['das Schild „Vorfahrt gewähren“', 'Auf der Spitze stehendes Dreieck mit rotem Rand', 1], ['ein Gefahrzeichen (z. B. „Kinder“)', 'Dreieck mit rotem Rand, Spitze nach oben', 2],
        ['ein Verbotszeichen (z. B. Tempolimit)', 'Rund mit rotem Rand', 1], ['ein Gebotszeichen (z. B. „Radweg“)', 'Rund und blau', 2],
        ['ein Autobahn-Wegweiser', 'Rechteckig und blau', 2], ['das Ortsschild', 'Rechteckig und gelb', 1],
      ],
      fragen: [{
        frage: (r) => `Wie sieht ${r.schild} in Deutschland aus?`,
        richtig: (r) => r.form,
        titel: (r) => r.schild.replace(/^(das|ein) /, '').replace(/^\S/, (c) => c.toUpperCase()),
        merke: (r) => `${r.schild.charAt(0).toUpperCase() + r.schild.slice(1)}: ${r.form.charAt(0).toLowerCase() + r.form.slice(1)}.`,
        text: (r) => (r.schild === 'das Stoppschild' ? 'Die besondere Form soll man auch erkennen, wenn das Schild verschmutzt oder von hinten zu sehen ist.' : null),
        ddf: (r) => r.s === 1,
      }],
    },
    {
      prefix: 'all-ma',
      spalten: ['mass', 'wert', 's'],
      zeilen: [
        ['ein Dutzend', '12 Stück', 1], ['ein Schock', '60 Stück', 3], ['ein Gros', '144 Stück', 3], ['eine Maß Bier', '1 Liter', 1],
        ['ein Pfund', '500 Gramm', 1], ['ein Zentner', '50 Kilogramm', 2], ['ein Doppelzentner', '100 Kilogramm', 2], ['ein Zoll', '2,54 Zentimeter', 2],
        ['eine Meile', 'etwa 1,6 Kilometer', 2], ['eine Seemeile', '1,852 Kilometer', 3], ['ein Fuß', '30,48 Zentimeter', 3], ['ein Karat bei Edelsteinen', '0,2 Gramm', 3],
        ['eine Pferdestärke (PS)', 'etwa 0,74 Kilowatt', 3], ['ein Knoten', 'eine Seemeile pro Stunde', 3], ['ein Ar', '100 Quadratmeter', 2], ['ein Barrel Öl', 'etwa 159 Liter', 3],
        ['eine US-Gallone', 'etwa 3,8 Liter', 3], ['ein Hektar', '10.000 Quadratmeter', 2],
      ],
      fragen: [{
        frage: (r) => `Wie viel ist ${r.mass}?`,
        richtig: (r) => r.wert,
        titel: (r) => r.mass.replace(/^(ein|eine) /, '').replace(/^\S/, (c) => c.toUpperCase()),
        merke: (r) => `${r.mass.charAt(0).toUpperCase() + r.mass.slice(1)} = ${r.wert}.`,
        ddf: (r) => r.s === 1,
      }],
    },
    {
      prefix: 'all-mo',
      spalten: ['monat', 'tage', 's'],
      zeilen: [
        ['Januar', '31', 1], ['Februar', '28, im Schaltjahr 29', 1], ['März', '31', 1], ['April', '30', 1], ['Mai', '31', 1], ['Juni', '30', 1],
        ['Juli', '31', 1], ['August', '31', 2], ['September', '30', 1], ['Oktober', '31', 1], ['November', '30', 1], ['Dezember', '31', 1],
      ],
      fragen: [{
        frage: (r) => `Wie viele Tage hat der ${r.monat}?`,
        richtig: (r) => r.tage,
        extraFalsch: ['29', '30', '31', '28, im Schaltjahr 29'],
        titel: () => 'Monate',
        merke: (r) => `${r.monat}: ${r.tage} Tage.`,
        text: () => 'Knöchel-Regel: Zähl die Monate über deine Fingerknöchel und die Lücken dazwischen. Knöchel-Monate haben 31 Tage. Juli und August liegen beide auf einem Knöchel.',
      }],
    },
    {
      prefix: 'all-st',
      spalten: ['datum', 'zeichen', 's'],
      zeilen: [
        ['10. Januar', 'Steinbock', 2], ['5. Februar', 'Wassermann', 2], ['10. März', 'Fische', 2], ['10. April', 'Widder', 2], ['10. Mai', 'Stier', 2],
        ['10. Juni', 'Zwillinge', 2], ['10. Juli', 'Krebs', 2], ['10. August', 'Löwe', 2], ['10. September', 'Jungfrau', 2], ['10. Oktober', 'Waage', 2],
        ['10. November', 'Skorpion', 2], ['10. Dezember', 'Schütze', 2],
      ],
      fragen: [{
        frage: (r) => `Welches Sternzeichen hat laut Horoskop, wer am ${r.datum} Geburtstag hat?`,
        richtig: (r) => r.zeichen,
        titel: () => 'Sternzeichen',
        merke: (r) => `${r.datum}: ${r.zeichen}.`,
        text: () => 'Sternzeichen stammen aus der Astrologie. Wissenschaftlich gibt es keinen Beleg, dass sie den Charakter beeinflussen.',
      }],
    },
    {
      prefix: 'all-ab',
      spalten: ['abk', 'lang', 's'],
      zeilen: [
        ['usw.', 'und so weiter', 1], ['bzw.', 'beziehungsweise', 1], ['ca.', 'circa (ungefähr)', 1], ['evtl.', 'eventuell', 1], ['ggf.', 'gegebenenfalls', 1],
        ['inkl.', 'inklusive', 1], ['zzgl.', 'zuzüglich', 2], ['MwSt.', 'Mehrwertsteuer', 1], ['z. Hd.', 'zu Händen', 2], ['i. A.', 'im Auftrag', 2],
        ['PLZ', 'Postleitzahl', 1], ['Kfz', 'Kraftfahrzeug', 1], ['ÖPNV', 'öffentlicher Personennahverkehr', 2], ['WG', 'Wohngemeinschaft', 1],
        ['Azubi', 'Auszubildende oder Auszubildender', 1], ['Hbf', 'Hauptbahnhof', 1], ['ICE', 'Intercity-Express', 1], ['u. U.', 'unter Umständen', 2],
        ['o. Ä.', 'oder Ähnliches', 2], ['Pkw', 'Personenkraftwagen', 1],
      ],
      fragen: [{
        frage: (r) => `Wofür steht die Abkürzung „${r.abk}“?`,
        richtig: (r) => r.lang.charAt(0).toUpperCase() + r.lang.slice(1),
        titel: (r) => r.abk,
        merke: (r) => `${r.abk} = ${r.lang}.`,
      }],
    },
  ],
};
