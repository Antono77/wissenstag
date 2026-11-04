// Faktentabellen Deutschland-Wissen
export default {
  klasse: 'deutschland',
  tabellen: [
    {
      prefix: 'deu-lh',
      spalten: ['land', 'hauptstadt', 's'],
      zeilen: [
        ['Baden-Württemberg', 'Stuttgart', 1], ['Bayern', 'München', 1], ['Brandenburg', 'Potsdam', 1], ['Hessen', 'Wiesbaden', 2],
        ['Mecklenburg-Vorpommern', 'Schwerin', 2], ['Niedersachsen', 'Hannover', 1], ['Nordrhein-Westfalen', 'Düsseldorf', 1],
        ['Rheinland-Pfalz', 'Mainz', 2], ['Saarland', 'Saarbrücken', 1], ['Sachsen', 'Dresden', 1], ['Sachsen-Anhalt', 'Magdeburg', 2],
        ['Schleswig-Holstein', 'Kiel', 1], ['Thüringen', 'Erfurt', 2],
      ],
      fragen: [
        {
          frage: (r) => `Wie heißt die Landeshauptstadt von ${r.land === 'Saarland' ? 'dem Saarland' : r.land}?`.replace('von dem Saarland', 'des Saarlandes'),
          richtig: (r) => r.hauptstadt,
          titel: (r) => r.land,
          merke: (r) => `${r.land}: Landeshauptstadt ${r.hauptstadt}.`,
          text: (r) => (r.land === 'Hessen' ? 'Die größte Stadt Hessens ist Frankfurt am Main, Landeshauptstadt ist Wiesbaden.' : r.land === 'Nordrhein-Westfalen' ? 'Die größte Stadt in NRW ist Köln, regiert wird aus Düsseldorf.' : r.land === 'Mecklenburg-Vorpommern' ? 'Rostock ist größer, Landeshauptstadt ist Schwerin mit seinem Schloss.' : null),
          ddf: (r) => r.s === 1,
        },
        {
          frage: (r) => `${r.hauptstadt} ist die Landeshauptstadt von …`,
          richtig: (r) => r.land,
          titel: (r) => r.hauptstadt,
          merke: (r) => `${r.hauptstadt} ist Landeshauptstadt von ${r.land === 'Saarland' ? 'dem Saarland' : r.land}.`,
        },
      ],
    },
    {
      prefix: 'deu-st',
      spalten: ['stadt', 'land', 's'],
      zeilen: [
        ['Köln', 'Nordrhein-Westfalen', 1], ['Frankfurt am Main', 'Hessen', 1], ['Leipzig', 'Sachsen', 1], ['Nürnberg', 'Bayern', 1], ['Rostock', 'Mecklenburg-Vorpommern', 1],
        ['Freiburg im Breisgau', 'Baden-Württemberg', 1], ['Heidelberg', 'Baden-Württemberg', 1], ['Trier', 'Rheinland-Pfalz', 2], ['Jena', 'Thüringen', 2], ['Lübeck', 'Schleswig-Holstein', 1],
        ['Göttingen', 'Niedersachsen', 2], ['Kassel', 'Hessen', 2], ['Cottbus', 'Brandenburg', 2], ['Halle (Saale)', 'Sachsen-Anhalt', 2], ['Augsburg', 'Bayern', 1],
        ['Wolfsburg', 'Niedersachsen', 1], ['Bochum', 'Nordrhein-Westfalen', 1], ['Flensburg', 'Schleswig-Holstein', 1], ['Regensburg', 'Bayern', 1], ['Chemnitz', 'Sachsen', 2],
        ['Weimar', 'Thüringen', 2], ['Koblenz', 'Rheinland-Pfalz', 2], ['Ulm', 'Baden-Württemberg', 2], ['Oldenburg', 'Niedersachsen', 2], ['Stralsund', 'Mecklenburg-Vorpommern', 2],
        ['Bielefeld', 'Nordrhein-Westfalen', 2], ['Würzburg', 'Bayern', 2], ['Wittenberg', 'Sachsen-Anhalt', 3], ['Frankfurt (Oder)', 'Brandenburg', 3], ['Darmstadt', 'Hessen', 2],
      ],
      fragen: [{
        frage: (r) => `In welchem Bundesland liegt ${r.stadt}?`,
        richtig: (r) => r.land,
        titel: (r) => r.stadt,
        merke: (r) => `${r.stadt} liegt in ${r.land === 'Saarland' ? 'dem Saarland' : r.land}.`,
        text: (r) => (r.stadt === 'Bielefeld' ? 'Im Internet hält sich der Witz, Bielefeld gebe es gar nicht. Die Stadt hat über 330.000 Einwohner.' : r.stadt === 'Frankfurt (Oder)' ? 'Frankfurt an der Oder liegt an der Grenze zu Polen, nicht zu verwechseln mit Frankfurt am Main in Hessen.' : null),
      }],
    },
    {
      prefix: 'deu-ft',
      spalten: ['tag', 'datum', 's'],
      zeilen: [
        ['der Tag der Deutschen Einheit', '3. Oktober', 1], ['Neujahr', '1. Januar', 1], ['der Tag der Arbeit', '1. Mai', 1], ['Heiligabend', '24. Dezember', 1],
        ['der Reformationstag', '31. Oktober', 2], ['Allerheiligen', '1. November', 2], ['der Dreikönigstag', '6. Januar', 2], ['Silvester', '31. Dezember', 1],
        ['der Nikolaustag', '6. Dezember', 1], ['der Martinstag', '11. November', 2], ['der Valentinstag', '14. Februar', 1], ['Mariä Himmelfahrt', '15. August', 3],
        ['der Internationale Frauentag', '8. März', 2], ['der Johannistag', '24. Juni', 3],
      ],
      fragen: [{
        frage: (r) => `An welchem Datum ist ${r.tag}?`,
        richtig: (r) => r.datum,
        titel: (r) => r.tag.replace(/^der /, '').replace(/^\S/, (c) => c.toUpperCase()),
        merke: (r) => `${r.tag.replace(/^der /, '').replace(/^\S/, (c) => c.toUpperCase())}: ${r.datum}.`,
        text: (r) => ({ 'der Reformationstag': 'Der Reformationstag ist in den östlichen und einigen nördlichen Bundesländern gesetzlicher Feiertag.', 'Heiligabend': 'Heiligabend ist kein gesetzlicher Feiertag. Die Weihnachtsfeiertage sind der 25. und 26. Dezember.', 'der Internationale Frauentag': 'In Berlin und Mecklenburg-Vorpommern ist der Frauentag ein gesetzlicher Feiertag.' }[r.tag] ?? null),
        ddf: (r) => r.s === 1,
      }],
      stand: '2026-11',
    },
    {
      prefix: 'deu-kz',
      spalten: ['kennzeichen', 'stadt', 's'],
      zeilen: [
        ['B', 'Berlin', 1], ['M', 'München', 1], ['HH', 'Hamburg', 1], ['K', 'Köln', 1], ['F', 'Frankfurt am Main', 1], ['S', 'Stuttgart', 1],
        ['D', 'Düsseldorf', 1], ['HB', 'Bremen', 1], ['L', 'Leipzig', 1], ['DD', 'Dresden', 1], ['H', 'Hannover', 1], ['N', 'Nürnberg', 1],
        ['E', 'Essen', 2], ['DO', 'Dortmund', 1], ['KI', 'Kiel', 2], ['HRO', 'Rostock', 2], ['MZ', 'Mainz', 2], ['WI', 'Wiesbaden', 2],
        ['SB', 'Saarbrücken', 2], ['EF', 'Erfurt', 2], ['MD', 'Magdeburg', 2], ['P', 'Potsdam', 2], ['SN', 'Schwerin', 2], ['HD', 'Heidelberg', 2],
        ['BN', 'Bonn', 2], ['KA', 'Karlsruhe', 2], ['A', 'Augsburg', 2], ['HL', 'Lübeck', 2], ['FR', 'Freiburg im Breisgau', 2], ['GÖ', 'Göttingen', 3],
      ],
      fragen: [{
        frage: (r) => `Zu welcher Stadt gehört das Autokennzeichen ${r.kennzeichen}?`,
        richtig: (r) => r.stadt,
        titel: (r) => `Kennzeichen ${r.kennzeichen}`,
        merke: (r) => `${r.kennzeichen} = ${r.stadt}.`,
        text: (r) => (['HH', 'HB', 'HRO', 'HL'].includes(r.kennzeichen) ? 'Das H am Anfang steht für Hansestadt.' : null),
        ddf: (r) => r.s === 1,
      }],
    },
  ],
};
