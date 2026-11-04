// Faktentabellen Sport
export default {
  klasse: 'sport',
  tabellen: [
    {
      prefix: 'spo-sa',
      spalten: ['person', 'sport', 's'],
      zeilen: [
        ['Michael Schumacher', 'Formel 1', 1], ['Boris Becker', 'Tennis', 1], ['Steffi Graf', 'Tennis', 1], ['Dirk Nowitzki', 'Basketball', 1],
        ['Usain Bolt', 'Leichtathletik', 1], ['Michael Phelps', 'Schwimmen', 1], ['Roger Federer', 'Tennis', 1], ['Lionel Messi', 'Fußball', 1],
        ['Magdalena Neuner', 'Biathlon', 2], ['Katarina Witt', 'Eiskunstlauf', 2], ['Tiger Woods', 'Golf', 1], ['Muhammad Ali', 'Boxen', 1],
        ['Wladimir Klitschko', 'Boxen', 1], ['Simone Biles', 'Turnen', 1], ['Sebastian Vettel', 'Formel 1', 1], ['Timo Boll', 'Tischtennis', 2],
        ['Dennis Schröder', 'Basketball', 2], ['Sven Hannawald', 'Skispringen', 2], ['Mikaela Shiffrin', 'Ski alpin', 2], ['Felix Neureuther', 'Ski alpin', 2],
        ['LeBron James', 'Basketball', 1], ['Tom Brady', 'American Football', 2], ['Wayne Gretzky', 'Eishockey', 2], ['Leon Draisaitl', 'Eishockey', 2],
        ['Alexander Zverev', 'Tennis', 1], ['Malaika Mihambo', 'Leichtathletik', 2], ['Jan Ullrich', 'Radsport', 2], ['Tadej Pogačar', 'Radsport', 2],
        ['Max Verstappen', 'Formel 1', 1], ['Serena Williams', 'Tennis', 1], ['Cristiano Ronaldo', 'Fußball', 1], ['Pelé', 'Fußball', 1],
        ['Laura Dahlmeier', 'Biathlon', 2], ['Franziska van Almsick', 'Schwimmen', 2], ['Magnus Carlsen', 'Schach', 2], ['Kristin Otto', 'Schwimmen', 3],
      ],
      fragen: [{
        frage: (r) => `In welcher Sportart wurde ${r.person} bekannt?`,
        richtig: (r) => r.sport,
        titel: (r) => r.person,
        merke: (r) => `${r.person}: ${r.sport}.`,
        ddf: (r) => r.s === 1,
      }],
    },
    {
      prefix: 'spo-te',
      spalten: ['sport', 'zahl', 's'],
      zeilen: [
        ['Fußball', 11, 1], ['Handball', 7, 1], ['Basketball', 5, 1], ['Volleyball', 6, 1], ['Eishockey', 6, 2], ['Wasserball', 7, 3],
        ['Rugby Union', 15, 3], ['Feldhockey', 11, 2], ['Baseball', 9, 2], ['American Football', 11, 2], ['Beachvolleyball', 2, 1], ['Curling', 4, 2],
      ],
      fragen: [{
        frage: (r) => `Wie viele Spieler einer Mannschaft sind beim ${r.sport} gleichzeitig im Spiel (mit Torwart, falls es einen gibt)?`,
        richtig: (r) => String(r.zahl),
        extraFalsch: ['8', '10', '12'],
        titel: (r) => r.sport,
        merke: (r) => `${r.sport}: ${r.zahl} Spieler pro Team.`,
        ddf: (r) => r.s === 1,
      }],
    },
    {
      prefix: 'spo-be',
      spalten: ['begriff', 'sport', 's'],
      zeilen: [
        ['Touchdown', 'American Football', 1], ['Birdie', 'Golf', 2], ['Albatros', 'Golf', 3], ['Slam Dunk', 'Basketball', 1],
        ['Dreipunktwurf', 'Basketball', 1], ['Ippon', 'Judo', 2], ['Rochade', 'Schach', 2], ['Telemark-Landung', 'Skispringen', 2],
        ['Siebenmeter', 'Handball', 1], ['Axel', 'Eiskunstlauf', 2], ['Gelbes Trikot', 'Radsport', 1], ['Fosbury-Flop', 'Leichtathletik', 2],
        ['Boxengasse', 'Formel 1', 1], ['Butterfly', 'Schwimmen', 2], ['Strike', 'Bowling', 2], ['Love (null Punkte)', 'Tennis', 2],
      ],
      fragen: [{
        frage: (r) => `Aus welcher Sportart stammt der Begriff „${r.begriff}“?`,
        richtig: (r) => r.sport,
        titel: (r) => r.begriff,
        merke: (r) => `„${r.begriff}“: ${r.sport}.`,
      }],
    },
    {
      prefix: 'spo-ol',
      spalten: ['jahr', 'ort', 's'],
      zeilen: [
        [2024, 'Paris', 1], [2021, 'Tokio', 1], [2016, 'Rio de Janeiro', 1], [2012, 'London', 1], [2008, 'Peking', 1], [2004, 'Athen', 2],
        [2000, 'Sydney', 2], [1996, 'Atlanta', 2], [1992, 'Barcelona', 2], [1988, 'Seoul', 3], [1972, 'München', 1], [1936, 'Berlin', 2],
        [2028, 'Los Angeles', 2], [2032, 'Brisbane', 3],
      ],
      fragen: [{
        frage: (r) => (r.jahr > 2026 ? `Wo finden die Olympischen Sommerspiele ${r.jahr} statt?` : r.jahr === 2021 ? 'Wo fanden die Olympischen Sommerspiele 2020 statt, die wegen Corona 2021 ausgetragen wurden?' : `Wo fanden die Olympischen Sommerspiele ${r.jahr} statt?`),
        richtig: (r) => r.ort,
        titel: (r) => `Olympia ${r.jahr === 2021 ? '2020 (2021)' : r.jahr}`,
        merke: (r) => `Sommerspiele ${r.jahr === 2021 ? '2020 (ausgetragen 2021)' : r.jahr}: ${r.ort}.`,
      }],
      stand: '2026-11',
    },
    {
      prefix: 'spo-wm',
      spalten: ['jahr', 'sieger', 's'],
      zeilen: [
        [2022, 'Argentinien', 1], [2018, 'Frankreich', 1], [2014, 'Deutschland', 1], [2010, 'Spanien', 1], [2006, 'Italien', 1], [2002, 'Brasilien', 2],
        [1998, 'Frankreich', 2], [1994, 'Brasilien', 2], [1990, 'Deutschland', 2], [1986, 'Argentinien', 2], [1974, 'Deutschland', 2], [1966, 'England', 2],
        [1970, 'Brasilien', 3], [1954, 'Deutschland', 2],
      ],
      fragen: [{
        frage: (r) => `Wer wurde ${r.jahr} Fußball-Weltmeister der Männer?`,
        richtig: (r) => r.sieger,
        extraFalsch: ['Niederlande', 'Uruguay', 'Kroatien', 'Portugal'],
        titel: (r) => `WM ${r.jahr}`,
        merke: (r) => `Weltmeister ${r.jahr}: ${r.sieger}${r.sieger === 'Deutschland' && r.jahr < 1990 ? ' (Bundesrepublik)' : ''}.`,
        text: (r) => ({ 2006: 'Die WM 2006 fand in Deutschland statt, das „Sommermärchen“. Deutschland wurde Dritter.', 2014: 'Mario Götze schoss im Finale gegen Argentinien das 1:0.', 1954: 'Das „Wunder von Bern“: Deutschland besiegte im Finale Ungarn 3:2.', 2022: 'Die WM in Katar fand erstmals im Winter statt. Lionel Messi wurde endlich Weltmeister.' }[r.jahr] ?? null),
        ddf: (r) => r.jahr >= 2006,
      }],
    },
  ],
};
