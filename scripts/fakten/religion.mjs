// Faktentabellen Religion & Mythologie
export default {
  klasse: 'religion',
  tabellen: [
    {
      prefix: 'rel-gg',
      spalten: ['gott', 'bereich', 'roemisch', 's'],
      zeilen: [
        ['Zeus', 'Göttervater und Herr des Himmels', 'Jupiter', 1], ['Poseidon', 'Gott des Meeres', 'Neptun', 1], ['Hades', 'Gott der Unterwelt', 'Pluto', 1],
        ['Athene', 'Göttin der Weisheit', 'Minerva', 1], ['Aphrodite', 'Göttin der Liebe und Schönheit', 'Venus', 1], ['Ares', 'Gott des Krieges', 'Mars', 1],
        ['Apollon', 'Gott des Lichts und der Künste', 'Apollo', 2], ['Artemis', 'Göttin der Jagd', 'Diana', 2], ['Hermes', 'Götterbote', 'Merkur', 1],
        ['Hephaistos', 'Gott des Feuers und der Schmiede', 'Vulcanus', 2], ['Demeter', 'Göttin des Ackerbaus', 'Ceres', 2], ['Dionysos', 'Gott des Weines', 'Bacchus', 2],
        ['Hera', 'Göttin der Ehe', 'Juno', 2], ['Hestia', 'Göttin des Herdfeuers', 'Vesta', 3], ['Eros', 'Gott der Liebe (Liebespfeile)', 'Amor', 2],
      ],
      fragen: [
        {
          frage: (r) => `Wofür war ${r.gott} in der griechischen Mythologie zuständig?`,
          richtig: (r) => r.bereich,
          auchRichtig: (r) => (r.gott === 'Eros' ? ['Göttin der Liebe und Schönheit'] : r.gott === 'Aphrodite' ? ['Gott der Liebe (Liebespfeile)'] : []),
          titel: (r) => r.gott,
          merke: (r) => `${r.gott}: ${r.bereich}, bei den Römern ${r.roemisch}.`,
          ddf: (r) => r.s === 1,
        },
        {
          frage: (r) => `Wie heißt ${['Athene', 'Aphrodite', 'Artemis', 'Demeter', 'Hera', 'Hestia'].includes(r.gott) ? 'die griechische Göttin' : 'der griechische Gott'} ${r.gott} bei den Römern?`,
          richtig: (r) => r.roemisch,
          titel: (r) => `${r.gott} = ${r.roemisch}`,
          merke: (r) => `${r.gott} (griechisch) = ${r.roemisch} (römisch).`,
        },
      ],
    },
    {
      prefix: 'rel-ng',
      spalten: ['gott', 'rolle', 'kultur', 's'],
      zeilen: [
        ['Odin', 'Göttervater mit nur einem Auge', 'nordisch', 1], ['Thor', 'Donnergott mit dem Hammer Mjölnir', 'nordisch', 1],
        ['Loki', 'Listiger Gott der Täuschung', 'nordisch', 1], ['Freya', 'Göttin der Liebe und Fruchtbarkeit', 'nordisch', 2],
        ['Frigg', 'Göttermutter und Frau Odins', 'nordisch', 3], ['Heimdall', 'Wächter der Regenbogenbrücke Bifröst', 'nordisch', 3],
        ['Ra', 'Sonnengott', 'ägyptisch', 2], ['Anubis', 'Gott der Totenriten mit Schakalkopf', 'ägyptisch', 2], ['Osiris', 'Herrscher des Totenreichs', 'ägyptisch', 3],
        ['Horus', 'Himmelsgott mit Falkenkopf', 'ägyptisch', 3], ['Thot', 'Gott der Weisheit und Schrift', 'ägyptisch', 3], ['Isis', 'Muttergöttin und Zauberin', 'ägyptisch', 3],
      ],
      fragen: [{
        frage: (r) => `Wer war ${r.gott} in der ${r.kultur === 'nordisch' ? 'nordischen' : 'ägyptischen'} Mythologie?`,
        richtig: (r) => r.rolle,
        gleicheGruppe: (x, r) => x.kultur === r.kultur,
        titel: (r) => r.gott,
        merke: (r) => `${r.gott}: ${r.rolle}.`,
        ddf: (r) => r.s === 1,
      }],
    },
    {
      prefix: 'rel-wr',
      spalten: ['religion', 'schrift', 'haus', 's'],
      zeilen: [
        ['das Christentum', 'Bibel', 'Kirche', 1], ['der Islam', 'Koran', 'Moschee', 1], ['das Judentum', 'Tora', 'Synagoge', 1],
        ['der Hinduismus', 'Veden', 'Mandir (Tempel)', 2], ['der Buddhismus', 'Pali-Kanon', 'Pagode oder Vihara', 3], ['der Sikhismus', 'Guru Granth Sahib', 'Gurdwara', 3],
      ],
      fragen: [
        {
          frage: (r) => `Wie heißt die wichtigste heilige Schrift für ${r.religion.replace(/^das /, 'das ').replace(/^der /, 'den ')}?`,
          richtig: (r) => r.schrift,
          titel: (r) => r.religion.replace(/^(der|das) /, '').replace(/^\S/, (c) => c.toUpperCase()),
          merke: (r) => `${r.religion.replace(/^(der|das) /, '').replace(/^\S/, (c) => c.toUpperCase())}: Schrift ${r.schrift}, Gotteshaus ${r.haus}.`,
        },
        {
          frage: (r) => `Wie heißt das Gotteshaus für ${r.religion.replace(/^der /, 'den ')}?`,
          richtig: (r) => r.haus,
          titel: (r) => r.religion.replace(/^(der|das) /, '').replace(/^\S/, (c) => c.toUpperCase()),
          merke: (r) => `${r.religion.replace(/^(der|das) /, '').replace(/^\S/, (c) => c.toUpperCase())}: Gotteshaus ${r.haus}.`,
        },
      ],
    },
    {
      prefix: 'rel-fe',
      spalten: ['fest', 'religion', 's', 'info'],
      zeilen: [
        ['Weihnachten', 'Christentum', 1, 'Christen feiern die Geburt Jesu.'], ['Ostern', 'Christentum', 1, 'Christen feiern die Auferstehung Jesu.'],
        ['Pfingsten', 'Christentum', 2, 'Pfingsten erinnert an die Ausgießung des Heiligen Geistes, 50 Tage nach Ostern.'],
        ['Ramadan', 'Islam', 1, 'Im Fastenmonat Ramadan essen und trinken gläubige Muslime von Sonnenaufgang bis Sonnenuntergang nichts.'],
        ['Opferfest', 'Islam', 2, 'Das Opferfest ist das höchste islamische Fest und erinnert an Abrahams Bereitschaft, seinen Sohn zu opfern.'],
        ['Chanukka', 'Judentum', 2, 'An acht Tagen zünden Juden nach und nach die Kerzen des Chanukka-Leuchters an.'],
        ['Jom Kippur', 'Judentum', 2, 'Jom Kippur ist der Versöhnungstag und der höchste jüdische Feiertag.'],
        ['Pessach', 'Judentum', 2, 'Pessach erinnert an den Auszug der Israeliten aus Ägypten.'],
        ['Diwali', 'Hinduismus', 2, 'Beim Lichterfest Diwali feiern Hindus den Sieg des Lichts über die Dunkelheit.'],
        ['Holi', 'Hinduismus', 2, 'Beim Frühlingsfest Holi bewerfen sich die Menschen mit Farbpulver.'],
        ['Vesakh', 'Buddhismus', 3, 'Buddhisten feiern an Vesakh Geburt, Erleuchtung und Tod Buddhas.'],
      ],
      fragen: [{
        frage: (r) => `Zu welcher Religion gehört das Fest ${r.fest}?`,
        richtig: (r) => r.religion,
        extraFalsch: ['Sikhismus'],
        titel: (r) => r.fest,
        merke: (r) => `${r.fest}: ${r.religion}.`,
        ddf: (r) => r.s === 1,
      }],
    },
    {
      prefix: 'rel-bi',
      spalten: ['person', 'geschichte', 's'],
      zeilen: [
        ['Noah', 'Er baute die Arche und rettete die Tiere vor der Sintflut', 1], ['Mose', 'Er empfing auf dem Berg Sinai die Zehn Gebote', 1],
        ['David', 'Er besiegte den Riesen Goliath mit einer Steinschleuder', 1], ['Jona', 'Ein großer Fisch verschluckte ihn und spie ihn nach drei Tagen aus', 2],
        ['Daniel', 'Er überlebte eine Nacht in der Löwengrube', 2], ['Josef', 'Seine Brüder verkauften ihn nach Ägypten, wo er Traumdeuter des Pharaos wurde', 2],
        ['Simson', 'Seine übermenschliche Kraft steckte in seinen Haaren', 2], ['Judas', 'Er verriet Jesus für 30 Silberlinge', 1],
        ['Petrus', 'Er verleugnete Jesus dreimal, bevor der Hahn krähte', 2], ['Kain', 'Er erschlug seinen Bruder Abel', 1],
        ['Salomo', 'Der König war für seine Weisheit berühmt', 2], ['Methusalem', 'Er wurde laut Bibel 969 Jahre alt', 2],
        ['Lazarus', 'Jesus erweckte ihn von den Toten', 2], ['Abraham', 'Er sollte auf Gottes Befehl seinen Sohn Isaak opfern', 2],
      ],
      fragen: [{
        frage: (r) => `Welche Geschichte erzählt die Bibel über ${r.person}?`,
        richtig: (r) => r.geschichte,
        titel: (r) => r.person,
        merke: (r) => `${r.person}: ${r.geschichte.charAt(0).toLowerCase() + r.geschichte.slice(1)}.`,
      }],
    },
  ],
};
