// Faktentabellen Politik & Gesellschaft
export default {
  klasse: 'politik',
  tabellen: [
    {
      prefix: 'pol-eu',
      spalten: ['land', 'jahr', 's'],
      // Beitritt zur EU bzw. ihren Vorgängern (EWG/EG)
      zeilen: [
        ['Belgien', 1958, 2], ['Deutschland', 1958, 1], ['Frankreich', 1958, 1], ['Italien', 1958, 2], ['Luxemburg', 1958, 2], ['den Niederlanden', 1958, 2],
        ['Dänemark', 1973, 2], ['Irland', 1973, 3], ['Griechenland', 1981, 2], ['Spanien', 1986, 2], ['Portugal', 1986, 2],
        ['Österreich', 1995, 1], ['Finnland', 1995, 2], ['Schweden', 1995, 2],
        ['Polen', 2004, 1], ['Tschechien', 2004, 2], ['der Slowakei', 2004, 3], ['Ungarn', 2004, 2], ['Slowenien', 2004, 3],
        ['Estland', 2004, 3], ['Lettland', 2004, 3], ['Litauen', 2004, 3], ['Malta', 2004, 3], ['Zypern', 2004, 3],
        ['Bulgarien', 2007, 2], ['Rumänien', 2007, 2], ['Kroatien', 2013, 2],
      ],
      fragen: [{
        frage: (r) => `Seit wann gehört ${r.land.replace(/^der /, 'die ').replace(/^den Niederlanden/, 'die Niederlande')} zur EU (oder ihren Vorgängern)?`.replace('gehört die Niederlande', 'gehören die Niederlande'),
        richtig: (r) => String(r.jahr),
        extraFalsch: ['1952', '1990', '2010', '2020'],
        titel: (r) => `EU-Beitritt: ${r.land.replace(/^der /, '').replace(/^den Niederlanden/, 'Niederlande')}`,
        text: (r) => (r.jahr === 1958 ? 'Die sechs Gründerstaaten unterschrieben 1957 die Römischen Verträge. Die Europäische Wirtschaftsgemeinschaft startete am 1. Januar 1958.'
          : r.jahr === 2004 ? '2004 traten zehn Länder auf einmal bei, die größte Erweiterung der EU-Geschichte.'
            : r.jahr === 1995 ? '1995 kamen Österreich, Finnland und Schweden hinzu. Norwegen hatte den Beitritt in einer Volksabstimmung abgelehnt.'
              : null),
        merke: (r) => `EU-Mitglied seit ${r.jahr}: ${r.land.replace(/^der /, '').replace(/^den Niederlanden/, 'Niederlande')}.`,
      }],
    },
    {
      prefix: 'pol-bk',
      spalten: ['name', 'jahr', 'partei', 's'],
      zeilen: [
        ['Konrad Adenauer', 1949, 'CDU', 1], ['Ludwig Erhard', 1963, 'CDU', 2], ['Kurt Georg Kiesinger', 1966, 'CDU', 3],
        ['Willy Brandt', 1969, 'SPD', 1], ['Helmut Schmidt', 1974, 'SPD', 2], ['Helmut Kohl', 1982, 'CDU', 1],
        ['Gerhard Schröder', 1998, 'SPD', 1], ['Angela Merkel', 2005, 'CDU', 1], ['Olaf Scholz', 2021, 'SPD', 1], ['Friedrich Merz', 2025, 'CDU', 1],
      ],
      fragen: [{
        frage: (r) => `Wer wurde ${r.jahr} Bundeskanzler${r.name === 'Angela Merkel' ? 'in' : ''}?`,
        richtig: (r) => r.name,
        titel: (r) => r.name,
        text: (r) => `${r.name} (${r.partei}) wurde ${r.jahr} ${r.name === 'Angela Merkel' ? 'Bundeskanzlerin' : 'Bundeskanzler'}.`,
        merke: (r) => `${r.jahr}: ${r.name} (${r.partei}).`,
      }, {
        frage: (r) => `Welcher Partei gehört${r.name !== 'Friedrich Merz' ? 'e' : ''} ${r.name} als Kanzler${r.name === 'Angela Merkel' ? 'in' : ''} an?`,
        richtig: (r) => r.partei,
        extraFalsch: ['FDP', 'CSU', 'Grüne', 'SPD', 'CDU'],
        titel: (r) => r.name,
        merke: (r) => `${r.name}: ${r.partei}.`,
      }],
    },
    {
      prefix: 'pol-bp',
      spalten: ['name', 'jahr', 's'],
      zeilen: [
        ['Theodor Heuss', 1949, 1], ['Heinrich Lübke', 1959, 3], ['Gustav Heinemann', 1969, 3], ['Walter Scheel', 1974, 3],
        ['Karl Carstens', 1979, 3], ['Richard von Weizsäcker', 1984, 2], ['Roman Herzog', 1994, 2], ['Johannes Rau', 1999, 2],
        ['Horst Köhler', 2004, 2], ['Christian Wulff', 2010, 2], ['Joachim Gauck', 2012, 1], ['Frank-Walter Steinmeier', 2017, 1],
      ],
      fragen: [{
        frage: (r) => `Wer wurde ${r.jahr} Bundespräsident?`,
        richtig: (r) => r.name,
        titel: (r) => r.name,
        merke: (r) => `Bundespräsident ab ${r.jahr}: ${r.name}.`,
      }],
    },
    {
      prefix: 'pol-be',
      spalten: ['begriff', 'bedeutung', 's'],
      zeilen: [
        ['Koalition', 'Zusammenschluss von Parteien, die gemeinsam regieren', 1],
        ['Opposition', 'Parteien im Parlament, die nicht an der Regierung beteiligt sind', 1],
        ['Fraktion', 'Zusammenschluss der Abgeordneten einer Partei im Parlament', 2],
        ['Legislaturperiode', 'Zeitraum, für den ein Parlament gewählt ist', 2],
        ['Föderalismus', 'Aufteilung der Staatsaufgaben zwischen Bund und Ländern', 2],
        ['Konstruktives Misstrauensvotum', 'Sturz des Kanzlers durch Wahl eines Nachfolgers', 3],
        ['Immunität', 'Schutz von Abgeordneten vor Strafverfolgung ohne Zustimmung des Parlaments', 3],
        ['Petition', 'Bitte oder Beschwerde von Bürgern an das Parlament', 2],
        ['Volksentscheid', 'Abstimmung, bei der die Bürger direkt über eine Sachfrage entscheiden', 2],
        ['Diäten', 'Bezahlung der Abgeordneten', 2],
        ['Lobbyismus', 'Versuch von Interessengruppen, Politik zu beeinflussen', 2],
        ['Fraktionsdisziplin', 'Erwartung, dass Abgeordnete wie ihre Fraktion abstimmen', 3],
        ['Gewaltenteilung', 'Verteilung der Staatsmacht auf Gesetzgebung, Regierung und Gerichte', 1],
        ['Rechtsstaat', 'Staat, in dem auch die Regierung an Gesetze gebunden ist', 2],
        ['Sozialstaat', 'Staat, der für soziale Sicherheit seiner Bürger sorgt', 2],
        ['Wahlgeheimnis', 'Niemand darf erfahren, wen du gewählt hast', 1],
        ['Briefwahl', 'Stimmabgabe per Post statt im Wahllokal', 1],
        ['Kabinett', 'Regierungschef und Minister zusammen', 2],
        ['Ressort', 'Zuständigkeitsbereich eines Ministeriums', 3],
        ['Hammelsprung', 'Abstimmungsverfahren, bei dem Abgeordnete durch verschiedene Türen gehen', 3],
        ['Überhangmandat', 'Sitz durch mehr gewonnene Wahlkreise, als einer Partei nach Zweitstimmen zustehen (bis 2023)', 3],
        ['Kanzlermehrheit', 'Mehrheit der Mitglieder des Bundestags, nicht nur der Anwesenden', 3],
        ['Ministerpräsident', 'Regierungschef eines Bundeslandes', 1],
        ['Bundesrat', 'Verfassungsorgan, über das die Länder an der Gesetzgebung mitwirken', 2],
        ['Vermittlungsausschuss', 'Gremium, das Streit zwischen Bundestag und Bundesrat schlichtet', 3],
        ['Populismus', 'Politikstil, der „das Volk“ gegen „die Elite“ ausspielt', 2],
        ['Demokratie', 'Herrschaft des Volkes', 1],
        ['Monarchie', 'Staatsform mit einem König oder einer Königin an der Spitze', 1],
        ['Pressefreiheit', 'Recht der Medien, ohne staatliche Zensur zu berichten', 1],
        ['Asyl', 'Schutz für Menschen, die in ihrer Heimat verfolgt werden', 1],
      ],
      fragen: [{
        frage: (r) => `Was bedeutet „${r.begriff}“?`,
        richtig: (r) => r.bedeutung,
        titel: (r) => r.begriff,
        merke: (r) => `${r.begriff}: ${r.bedeutung}.`,
      }],
    },
  ],
};
