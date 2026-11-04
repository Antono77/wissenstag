// Kurze Einordnungen („Gut zu wissen“) zu Begriffen, die oft in Nachrichten vorkommen.
// Die Seite sucht im Titel und Text einer Meldung nach dem Muster und zeigt den passenden Hintergrund.
// Stand: November 2026. Neue Einträge einfach unten anfügen.
export const EINORDNUNGEN = [
  { muster: /\bBundestag/i, text: 'Der Bundestag ist das Parlament Deutschlands. Er beschließt Gesetze, wählt den Bundeskanzler und kontrolliert die Regierung. Seit 2025 hat er 630 Sitze.' },
  { muster: /\bBundesrat/i, text: 'Im Bundesrat sitzen Vertreter der 16 Landesregierungen. Über ihn wirken die Länder an Bundesgesetzen mit.' },
  { muster: /Bundesverfassungsgericht|Karlsruher Richter/i, text: 'Das Bundesverfassungsgericht in Karlsruhe prüft, ob Gesetze und staatliches Handeln mit dem Grundgesetz vereinbar sind.' },
  { muster: /Kabinett\b|Bundesregierung/i, text: 'Die Bundesregierung besteht aus dem Bundeskanzler und den Bundesministerinnen und -ministern. Zusammen heißen sie Kabinett.' },
  { muster: /EU-Kommission|Europäische Kommission|von der Leyen/i, text: 'Die EU-Kommission schlägt Gesetze für die Europäische Union vor und wacht über die Einhaltung der Verträge. Präsidentin ist Ursula von der Leyen.' },
  { muster: /EU-Parlament|Europaparlament|Europäische[ns]? Parlament/i, text: 'Das Europäische Parlament wird alle fünf Jahre direkt gewählt und entscheidet mit dem Rat der EU über europäische Gesetze.' },
  { muster: /\bNATO\b|Nato\b/, text: 'Die NATO ist ein Verteidigungsbündnis von 32 Staaten aus Europa und Nordamerika. Ein Angriff auf ein Mitglied gilt als Angriff auf alle.' },
  { muster: /Sicherheitsrat/i, text: 'Der UN-Sicherheitsrat hat 15 Mitglieder. Die fünf ständigen Mitglieder USA, Russland, China, Frankreich und Großbritannien können Beschlüsse mit einem Veto stoppen.' },
  { muster: /Vereinte[nr]? Nationen|\bUNO?\b/, text: 'Die Vereinten Nationen wurden 1945 gegründet und haben 193 Mitgliedstaaten. Sie sollen Frieden sichern und internationale Zusammenarbeit fördern.' },
  { muster: /\bEZB\b|Europäische Zentralbank|Leitzins/i, text: 'Die Europäische Zentralbank in Frankfurt legt die Leitzinsen für den Euroraum fest. Ihr Ziel ist eine Inflation von rund zwei Prozent.' },
  { muster: /Inflation|Teuerung|Verbraucherpreise/i, text: 'Inflation heißt: Die Preise steigen allgemein, dein Geld verliert an Kaufkraft. Das Statistische Bundesamt misst sie mit einem Warenkorb.' },
  { muster: /\bDAX\b/, text: 'Der DAX bildet die Kursentwicklung der 40 größten börsennotierten Unternehmen in Deutschland ab.' },
  { muster: /Midterm|Zwischenwahl|US-Kongress|Repräsentantenhaus|US-Senat/i, text: 'Der US-Kongress besteht aus Repräsentantenhaus und Senat. Bei den Zwischenwahlen („Midterms“) zur Mitte der Amtszeit des Präsidenten wird das ganze Repräsentantenhaus und ein Drittel des Senats neu gewählt.' },
  { muster: /Weißes Haus|US-Präsident|Trump/i, text: 'Der US-Präsident ist Staats- und Regierungschef der USA und wird für vier Jahre gewählt, höchstens zweimal. Donald Trump ist seit Januar 2025 im Amt.' },
  { muster: /Klimakonferenz|\bCOP ?\d+|Weltklima/i, text: 'Auf den UN-Klimakonferenzen (COP) verhandeln fast alle Staaten der Welt über den Klimaschutz. Grundlage ist das Pariser Abkommen von 2015.' },
  { muster: /\bG7\b|\bG20\b/, text: 'In der G7 treffen sich sieben große Industriestaaten, darunter Deutschland. Die G20 umfasst zusätzlich große Schwellenländer wie China, Indien und Brasilien.' },
  { muster: /Ukraine/i, text: 'Russland führt seit Februar 2022 einen großangelegten Angriffskrieg gegen die Ukraine. Bereits 2014 hatte Russland die Halbinsel Krim annektiert.' },
  { muster: /Gaza/i, text: 'Der Gazastreifen ist ein schmales Küstengebiet am Mittelmeer zwischen Israel und Ägypten, in dem rund zwei Millionen Menschen leben.' },
  { muster: /\bIran\b|Iranisch/i, text: 'Der Iran ist seit der Revolution von 1979 eine Islamische Republik. Das Land hat rund 90 Millionen Einwohner, Hauptstadt ist Teheran.' },
  { muster: /Landtag/i, text: 'Der Landtag ist das Parlament eines Bundeslandes. Er wählt den Ministerpräsidenten und beschließt Landesgesetze, etwa zu Schulen und Polizei.' },
  { muster: /Bundespräsident|Steinmeier/i, text: 'Der Bundespräsident ist Staatsoberhaupt. Er unterzeichnet Gesetze, ernennt Minister und vertritt Deutschland. Frank-Walter Steinmeiers Amtszeit endet im März 2027.' },
  { muster: /Mindestlohn/i, text: 'Der gesetzliche Mindestlohn liegt 2026 bei 13,90 Euro pro Stunde und steigt 2027 auf 14,60 Euro.' },
  { muster: /Rente\b|Renten/i, text: 'Die gesetzliche Rente funktioniert im Umlageverfahren: Die heutigen Beschäftigten zahlen die Renten der heutigen Rentner.' },
  { muster: /Bürgergeld|Grundsicherung/i, text: 'Bürgergeld bzw. Grundsicherung sichert das Existenzminimum von Menschen, die ihren Lebensunterhalt nicht selbst bestreiten können.' },
  { muster: /Schuldenbremse/i, text: 'Die Schuldenbremse im Grundgesetz begrenzt, wie viele neue Schulden Bund und Länder machen dürfen. Ausnahmen gelten etwa in Notlagen.' },
  { muster: /Bundeswehr|Wehrdienst/i, text: 'Die Bundeswehr ist die Armee Deutschlands und eine Parlamentsarmee: Für Auslandseinsätze braucht sie die Zustimmung des Bundestags.' },
  { muster: /\bWHO\b|Weltgesundheitsorganisation/i, text: 'Die Weltgesundheitsorganisation WHO ist die UN-Behörde für Gesundheit mit Sitz in Genf.' },
  { muster: /Nobelpreis/i, text: 'Die Nobelpreise gehen auf das Testament von Alfred Nobel zurück. Verliehen werden sie jedes Jahr im Dezember in Stockholm, der Friedensnobelpreis in Oslo.' },
  { muster: /Papst|Vatikan/i, text: 'Der Papst ist Oberhaupt der katholischen Kirche und Staatsoberhaupt der Vatikanstadt. Seit Mai 2025 ist es Leo XIV.' },
  { muster: /Zoll|Zölle/i, text: 'Zölle sind Abgaben auf eingeführte Waren. Sie verteuern Importe und sollen oft die heimische Wirtschaft schützen.' },
  { muster: /Wärmepumpe|Heizungsgesetz|Gebäudeenergiegesetz/i, text: 'Wärmepumpen heizen mit Wärme aus Luft, Erde oder Wasser und Strom. Das Gebäudeenergiegesetz regelt, wie neue Heizungen klimafreundlicher werden sollen.' },
];

export function findeEinordnung(meldung) {
  const text = `${meldung.titel} ${meldung.kontext ?? ''} ${meldung.text ?? ''}`;
  return EINORDNUNGEN.find((e) => e.muster.test(text))?.text ?? null;
}
