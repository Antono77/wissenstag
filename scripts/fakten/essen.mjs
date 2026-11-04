// Faktentabellen Essen & Trinken
export default {
  klasse: 'essen',
  tabellen: [
    {
      prefix: 'ess-la',
      spalten: ['gericht', 'land', 's'],
      zeilen: [
        ['Paella', 'Spanien', 1], ['Sushi', 'Japan', 1], ['Ramen', 'Japan', 1], ['Pizza', 'Italien', 1], ['Risotto', 'Italien', 1], ['Tiramisu', 'Italien', 1],
        ['Gulasch', 'Ungarn', 1], ['Moussaka', 'Griechenland', 1], ['Tacos', 'Mexiko', 1], ['Borschtsch', 'Ukraine', 2], ['Kimchi', 'Südkorea', 1],
        ['Pho', 'Vietnam', 2], ['Pad Thai', 'Thailand', 1], ['Fish and Chips', 'Vereinigtes Königreich', 1], ['Ratatouille', 'Frankreich', 1],
        ['Bouillabaisse', 'Frankreich', 2], ['Käsefondue', 'Schweiz', 1], ['Rösti', 'Schweiz', 2], ['Wiener Schnitzel', 'Österreich', 1],
        ['Kaiserschmarrn', 'Österreich', 1], ['Smørrebrød', 'Dänemark', 2], ['Pierogi', 'Polen', 2], ['Feijoada', 'Brasilien', 3], ['Ceviche', 'Peru', 3],
        ['Tapas', 'Spanien', 1], ['Gazpacho', 'Spanien', 2], ['Haggis', 'Vereinigtes Königreich', 2], ['Poutine', 'Kanada', 3], ['Peking-Ente', 'China', 1],
        ['Currywurst', 'Deutschland', 1], ['Köttbullar', 'Schweden', 1], ['Churros', 'Spanien', 2], ['Bigos', 'Polen', 3], ['Dim Sum', 'China', 2],
      ],
      fragen: [{
        frage: (r) => `Aus welchem Land stammt das Gericht ${r.gericht}?`,
        richtig: (r) => r.land,
        titel: (r) => r.gericht,
        merke: (r) => `${r.gericht}: ${r.land}.`,
        text: (r) => ({ Haggis: 'Haggis ist ein Nationalgericht Schottlands: Schafsinnereien mit Hafer im Schafsmagen gegart.', Borschtsch: 'Die UNESCO hat 2022 die Borschtsch-Kultur der Ukraine als bedrohtes Kulturerbe anerkannt.', Currywurst: 'Herta Heuwer erfand die Currysoße 1949 in Berlin.', 'Wiener Schnitzel': 'Ein echtes Wiener Schnitzel ist aus Kalbfleisch.' }[r.gericht] ?? null),
        ddf: (r) => r.s === 1,
      }],
    },
    {
      prefix: 'ess-zu',
      spalten: ['speise', 'zutat', 's'],
      zeilen: [
        ['Guacamole', 'Avocado', 1], ['Hummus', 'Kichererbsen', 1], ['Pesto alla genovese', 'Basilikum', 1], ['Tzatziki', 'Joghurt', 1],
        ['Sauerkraut', 'Weißkohl', 1], ['Marzipan', 'Mandeln', 1], ['Popcorn', 'Mais', 1], ['Tofu', 'Sojabohnen', 1], ['Polenta', 'Maisgrieß', 2],
        ['Nutella', 'Haselnüsse', 1], ['Kaviar', 'Fischrogen', 1], ['Tahini', 'Sesam', 2], ['Couscous', 'Hartweizengrieß', 2], ['Cidre', 'Äpfel', 2],
        ['Sake', 'Reis', 2], ['Tequila', 'Agave', 2], ['Rum', 'Zuckerrohr', 2], ['Pommes frites', 'Kartoffeln', 1], ['Ketchup', 'Tomaten', 1], ['Baba Ganoush', 'Auberginen', 3],
      ],
      fragen: [{
        frage: (r) => `Woraus wird ${r.speise} hauptsächlich gemacht?`,
        richtig: (r) => r.zutat,
        titel: (r) => r.speise,
        merke: (r) => `${r.speise}: aus ${r.zutat}.`,
        ddf: (r) => r.s === 1,
      }],
    },
    {
      prefix: 'ess-de',
      spalten: ['spezialitaet', 'herkunft', 's'],
      zeilen: [
        ['Weißwurst', 'München', 1], ['Kölsch', 'Köln', 1], ['Altbier', 'Düsseldorf', 2], ['Grüne Soße', 'Frankfurt am Main', 2],
        ['Leipziger Allerlei', 'Leipzig', 1], ['Lebkuchen nach Nürnberger Art', 'Nürnberg', 1], ['Printen', 'Aachen', 2], ['Christstollen', 'Dresden', 2],
        ['Marzipan nach Lübecker Art', 'Lübeck', 1], ['Saumagen', 'Pfalz', 2], ['Maultaschen', 'Schwaben', 1], ['Labskaus', 'Norddeutschland', 2],
        ['Thüringer Rostbratwurst', 'Thüringen', 1], ['Schwarzwälder Kirschtorte', 'Schwarzwald', 1], ['Königsberger Klopse', 'Ostpreußen', 2],
      ],
      fragen: [{
        frage: (r) => `Woher stammt die Spezialität ${r.spezialitaet}?`,
        richtig: (r) => r.herkunft,
        titel: (r) => r.spezialitaet,
        merke: (r) => `${r.spezialitaet}: ${r.herkunft}.`,
        text: (r) => (r.spezialitaet === 'Weißwurst' ? 'Eine alte Regel sagt: Die Weißwurst darf das Zwölf-Uhr-Läuten nicht hören, also isst man sie vormittags.' : r.spezialitaet === 'Königsberger Klopse' ? 'Königsberg heißt heute Kaliningrad und gehört zu Russland.' : null),
      }],
    },
    {
      prefix: 'ess-ka',
      spalten: ['kaese', 'land', 's'],
      zeilen: [
        ['Gouda', 'Niederlande', 1], ['Edamer', 'Niederlande', 2], ['Camembert', 'Frankreich', 1], ['Roquefort', 'Frankreich', 2], ['Parmesan', 'Italien', 1],
        ['Mozzarella', 'Italien', 1], ['Feta', 'Griechenland', 1], ['Emmentaler', 'Schweiz', 1], ['Gruyère', 'Schweiz', 2], ['Cheddar', 'Vereinigtes Königreich', 1],
        ['Manchego', 'Spanien', 2], ['Halloumi', 'Zypern', 2],
      ],
      fragen: [{
        frage: (r) => `Aus welchem Land stammt der Käse ${r.kaese}?`,
        richtig: (r) => r.land,
        titel: (r) => r.kaese,
        merke: (r) => `${r.kaese}: ${r.land}.`,
        text: (r) => (r.kaese === 'Cheddar' ? 'Cheddar ist nach einem Dorf in der englischen Grafschaft Somerset benannt.' : r.kaese === 'Feta' ? 'Seit 2002 darf nur Käse aus Griechenland Feta heißen.' : null),
        ddf: (r) => r.s === 1,
      }],
    },
  ],
};
