// ════════════════════════════════════════════════════════════════
// album-data.js — Álbum Panini FIFA World Cup 2026™
// 980 figurinhas reais (checklist oficial Panini)
// Estrutura: 00 + FWC1-19 (especiais) + 48 seleções × 20 = 980
// Ordem exata do álbum físico por grupo
// ════════════════════════════════════════════════════════════════

const ALBUM = [

  // ── ESPECIAIS (00 + FWC1–FWC19) ──────────────────────────────
  {
    prefix: "FWC", name: "Especiais Copa 2026", flag: "🏆",
    stickers: [
      { code: "00",    n: 0,  role: "special", player: "Logo Panini" },
      { code: "FWC1",  n: 1,  role: "special", player: "Emblema Oficial" },
      { code: "FWC2",  n: 2,  role: "special", player: "Emblema Oficial" },
      { code: "FWC3",  n: 3,  role: "special", player: "Mascotes Oficiais" },
      { code: "FWC4",  n: 4,  role: "special", player: "Slogan Oficial" },
      { code: "FWC5",  n: 5,  role: "special", player: "Bola Oficial" },
      { code: "FWC6",  n: 6,  role: "special", player: "Canadá — Sede" },
      { code: "FWC7",  n: 7,  role: "special", player: "México — Sede" },
      { code: "FWC8",  n: 8,  role: "special", player: "EUA — Sede" },
      { code: "FWC9",  n: 9,  role: "special", player: "Museu FIFA 1930" },
      { code: "FWC10", n: 10, role: "special", player: "Museu FIFA 1950" },
      { code: "FWC11", n: 11, role: "special", player: "Museu FIFA 1958" },
      { code: "FWC12", n: 12, role: "special", player: "Museu FIFA 1962" },
      { code: "FWC13", n: 13, role: "special", player: "Museu FIFA 1970" },
      { code: "FWC14", n: 14, role: "special", player: "Museu FIFA 1994" },
      { code: "FWC15", n: 15, role: "special", player: "Museu FIFA 1998" },
      { code: "FWC16", n: 16, role: "special", player: "Museu FIFA 2002" },
      { code: "FWC17", n: 17, role: "special", player: "Museu FIFA 2006" },
      { code: "FWC18", n: 18, role: "special", player: "Museu FIFA 2010" },
      { code: "FWC19", n: 19, role: "special", player: "Museu FIFA 2022" },
    ]
  },

  // ── GRUPO A ──────────────────────────────────────────────────
  { prefix:"MEX", name:"México",               flag:"🇲🇽" },
  { prefix:"RSA", name:"África do Sul",         flag:"🇿🇦" },
  { prefix:"KOR", name:"Coreia do Sul",         flag:"🇰🇷" },
  { prefix:"CZE", name:"República Tcheca",      flag:"🇨🇿" },

  // ── GRUPO B ──────────────────────────────────────────────────
  { prefix:"CAN", name:"Canadá",               flag:"🇨🇦" },
  { prefix:"BIH", name:"Bósnia e Herzegovina",  flag:"🇧🇦" },
  { prefix:"QAT", name:"Catar",                flag:"🇶🇦" },
  { prefix:"SUI", name:"Suíça",                flag:"🇨🇭" },

  // ── GRUPO C ──────────────────────────────────────────────────
  { prefix:"BRA", name:"Brasil",               flag:"🇧🇷" },
  { prefix:"MAR", name:"Marrocos",             flag:"🇲🇦" },
  { prefix:"HAI", name:"Haiti",                flag:"🇭🇹" },
  { prefix:"SCO", name:"Escócia",              flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿" },

  // ── GRUPO D ──────────────────────────────────────────────────
  { prefix:"USA", name:"Estados Unidos",        flag:"🇺🇸" },
  { prefix:"PAR", name:"Paraguai",             flag:"🇵🇾" },
  { prefix:"AUS", name:"Austrália",            flag:"🇦🇺" },
  { prefix:"TUR", name:"Turquia",              flag:"🇹🇷" },

  // ── GRUPO E ──────────────────────────────────────────────────
  { prefix:"ARG", name:"Argentina",            flag:"🇦🇷" },
  { prefix:"CHI", name:"Chile",                flag:"🇨🇱" },
  { prefix:"ALB", name:"Albânia",              flag:"🇦🇱" },
  { prefix:"MAL", name:"Mali",                 flag:"🇲🇱" },

  // ── GRUPO F ──────────────────────────────────────────────────
  { prefix:"GER", name:"Alemanha",             flag:"🇩🇪" },
  { prefix:"JPN", name:"Japão",                flag:"🇯🇵" },
  { prefix:"TRI", name:"Trinidad e Tobago",    flag:"🇹🇹" },
  { prefix:"OMA", name:"Omã",                  flag:"🇴🇲" },

  // ── GRUPO G ──────────────────────────────────────────────────
  { prefix:"ESP", name:"Espanha",              flag:"🇪🇸" },
  { prefix:"CRO", name:"Croácia",              flag:"🇭🇷" },
  { prefix:"KEN", name:"Quênia",               flag:"🇰🇪" },
  { prefix:"THA", name:"Tailândia",            flag:"🇹🇭" },

  // ── GRUPO H ──────────────────────────────────────────────────
  { prefix:"FRA", name:"França",               flag:"🇫🇷" },
  { prefix:"COD", name:"Congo RD",             flag:"🇨🇩" },
  { prefix:"PAN", name:"Panamá",               flag:"🇵🇦" },
  { prefix:"ARB", name:"Arábia Saudita",        flag:"🇸🇦" },

  // ── GRUPO I ──────────────────────────────────────────────────
  { prefix:"POR", name:"Portugal",             flag:"🇵🇹" },
  { prefix:"NED", name:"Países Baixos",        flag:"🇳🇱" },
  { prefix:"CIV", name:"Costa do Marfim",      flag:"🇨🇮" },
  { prefix:"CPV", name:"Cabo Verde",           flag:"🇨🇻" },

  // ── GRUPO J ──────────────────────────────────────────────────
  { prefix:"ENG", name:"Inglaterra",           flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { prefix:"SEN", name:"Senegal",              flag:"🇸🇳" },
  { prefix:"HON", name:"Honduras",             flag:"🇭🇳" },
  { prefix:"AZE", name:"Azerbaijão",           flag:"🇦🇿" },

  // ── GRUPO K ──────────────────────────────────────────────────
  { prefix:"COL", name:"Colômbia",             flag:"🇨🇴" },
  { prefix:"SVK", name:"Eslováquia",           flag:"🇸🇰" },
  { prefix:"ROM", name:"Romênia",              flag:"🇷🇴" },
  { prefix:"BOL", name:"Bolívia",              flag:"🇧🇴" },

  // ── GRUPO L ──────────────────────────────────────────────────
  { prefix:"URU", name:"Uruguai",              flag:"🇺🇾" },
  { prefix:"GHA", name:"Gana",                 flag:"🇬🇭" },
  { prefix:"INA", name:"Indonésia",            flag:"🇮🇩" },
  { prefix:"VNZ", name:"Venezuela",            flag:"🇻🇪" },

].map(t => {
  // FWC já tem stickers definidos
  if (t.stickers) return t;
  // Todas as seleções: 20 figurinhas (1=logo foil, 13=foto do time, demais=jogadores)
  return {
    ...t,
    stickers: Array.from({ length: 20 }, (_, i) => {
      const n = i + 1;
      const code = `${t.prefix}${n}`;
      let role = "player", player = "";
      if (n === 1)  { role = "logo";  player = `Logo ${t.name}`; }
      else if (n === 13) { role = "photo"; player = `Foto ${t.name}`; }
      return { code, n, role, player };
    })
  };
});

// Nomes dos jogadores reais por prefixo (confirmados via checklist oficial)
const PLAYERS = {
  MEX: ["Logo","Luis Malagón","Johan Vasquez","Jorge Sánchez","Cesar Montes","Jesus Gallardo","Israel Reyes","Diego Lainez","Carlos Rodriguez","Edson Alvarez","Orbelin Pineda","Marcel Ruiz","Foto","Érick Sánchez","Hirving Lozano","Santiago Giménez","Raúl Jiménez","Alexis Vega","Roberto Alvarado","Cesar Huerta"],
  RSA: ["Logo","Ronwen Williams","Sipho Chaine","Aubrey Modiba","Samukele Kabini","Mbekezeli Mbokazi","Khulumani Ndamane","Siyabonga Ngezana","Khuliso Mudau","Nkosinathi Sibisi","Teboho Mokoena","Thalente Mbatha","Foto","Bathasi Aubaas","Yaya Sithole","Sipho Mbule","Lyle Foster","Iqraam Rayners","Mohau Nkota","Oswin Appollis"],
  KOR: ["Logo","Hyeon-woo Jo","Seung-Gyu Kim","Min-jae Kim","Yu-min Cho","Young-woo Seol","Han-beom Lee","Tae-seok Lee","Myung-jae Lee","Jae-sung Lee","In-beom Hwang","Kang-in Lee","Foto","Seung-ho Paik","Jens Castrop","Dongg-yeong Lee","Gue-sung Cho","Heung-min Son","Hee-chan Hwang","Hyeon-Gyu Oh"],
  CZE: ["Logo","Matej Kovar","Jindrich Stanek","Ladislav Krejci","Vladimir Coufal","Jaroslav Zeleny","Tomas Holes","David Zima","Michal Sadilek","Lukas Provod","Lukas Cerv","Tomas Soucek","Foto","Pavel Sulc","Matej Vydra","Vasil Kusej","Tomas Chory","Vaclav Cerny","Adam Hlozek","Patrik Schick"],
  CAN: ["Logo","Dayne St.Clair","Alphonso Davies","Alistair Johnston","Samuel Adekugbe","Riche Larvea","Derek Cornelius","Moïse Bombito","Kamal Miller","Stephen Eustáquio","Ismaël Koné","Jonathan Osorio","Foto","Jacob Shaffelburg","Mathieu Choinière","Niko Sigur","Tajon Buchanan","Liam Millar","Cyle Larin","Jonathan David"],
  BIH: ["Logo","Nikola Vasilj","Amer Dedic","Sead Kolasinac","Tarik Muharemovic","Nihad Mujakic","Nikola Katic","Amir Hadziahmetovic","Benjamin Tahirovic","Armin Gigovic","Ivan Sunjic","Ivan Basic","Foto","Dzenis Burnic","Esmir Bajraktarevic","Amar Memic","Ermedin Demirovic","Edin Dzeko","Samed Bazdar","Haris Tabakovic"],
  QAT: ["Logo","Meshaal Barsham","Sultan Albrake","Lucas Mendes","Homam Ahmed","Boualem Khoukhi","Pedro Miguel","Tarek Salman","Mohamed Al-Mannai","Karim Boudiaf","Assim Madibo","Ahmed Fatehi","Foto","Mohammed Waad","Abdulaziz Hatem","Hassan Al-Haydos","Edmilson Junior","Akram Hassan Afif","Ahmed Al Ganehi","Almoez Ali"],
  SUI: ["Logo","Gregor Kobel","Yvon Mvogo","Manuel Akanji","Ricardo Rodriguez","Nico Elvedi","Aurèle Amenda","Silvan Widmer","Granit Xhaka","Denis Zakaria","Remo Freuler","Fabian Rieder","Foto","Ardon Jashari","Johan Manzambi","Michel Aebischer","Breel Embolo","Ruben Vargas","Dan Ndoye","Zeki Amdouni"],
  BRA: ["Logo","Alisson","Bento","Marquinhos","Éder Militão","Gabriel Magalhães","Danilo","Wesley","Lucas Paquetá","Casemiro","Bruno Guimarães","Luiz Henrique","Foto","Vinicius Júnior","Rodrygo","João Pedro","Matheus Cunha","Gabriel Martinelli","Raphinha","Estévão"],
  MAR: ["Logo","Yassine Bounou","Munir El Kajoui","Achraf Hakimi","Noussair Mazraoui","Nayef Aguerd","Roman Saiss","Jawad El Yamio","Adam Masina","Sofyan Amrabat","Azzedine Ounahi","Eliesse Ben Seghir","Foto","Bilal El Khannouss","Ismael Saibari","Youssef En-Nesyri","Abde Ezzalzouli","Soufiane Rahimi","Brahim Diaz","Ayoub El Kaabi"],
  HAI: ["Logo","Johny Placide","Carlens Arcus","Martin Expérience","Jean-Kevin Duverne","Ricardo Adé","Duke Lacroix","Garven Metusala","Hannes Delcroix","Leverton Pierre","Danley Jean Jacques","Jean-Ricner Bellegarde","Foto","Christopher Attys","Derrick Etienne Jr","Josue Casimir","Ruben Providence","Duckens Nazon","Louicius Deedson","Frantzdy Pierrot"],
  SCO: ["Logo","Angus Gunn","Jack Hendry","Kieran Tierney","Aaron Hickey","Andrew Robertson","Scott McKenna","John Souttar","Anthony Ralston","Grant Hanley","Scott McTominay","Billy Gilmour","Foto","Lewis Ferguson","Ryan Christie","Kenny McLean","John McGinn","Lyndon Dykes","Che Adams","Ben Gannon-Doak"],
  USA: ["Logo","Math Freese","Chris Richards","Tim Ream","Mark McKenzie","Alex Freeman","Antonee Robinson","Tyler Adams","Tanner Tessmann","Weston McKennie","Christian Roldan","Timothy Weah","Foto","Diego Luna","Malik Tillman","Christian Pulisic","Brenden Aaronson","Ricardo Pepi","Haji Wright","Folarin Balogun"],
  PAR: ["Logo","Roberto Fernandez","Orlando Gill","Gustavo Gomez","Fabián Balbuena","Juan José Cáceres","Omar Alderete","Junior Alonso","Mathías Villasanti","Diego Gomez","Damián Bobadilla","Andres Cubas","Foto","Matias Galarza Fonda","Julio Enciso","Alejandro Romero Gamarra","Miguel Almirón","Ramon Sosa","Angel Romero","Antonio Sanabria"],
  AUS: ["Logo","Mathew Ryan","Joe Gauci","Harry Souttar","Alessandro Circati","Jordan Bos","Aziz Behich","Cameron Burgess","Lewis Miller","Milos Degenek","Jackson Irvine","Riley McGree","Foto","Aiden O'Neill","Connor Metcalfe","Patrick Yazbek","Craig Goodwin","Kusini Vengi","Nestory Irankunda","Mohamed Touré"],
};

// Aplica nomes dos jogadores onde disponível
ALBUM.forEach(team => {
  const names = PLAYERS[team.prefix];
  if (!names) return;
  team.stickers.forEach((s, i) => {
    if (names[i]) s.player = names[i];
  });
});

const ALL_CODES = ALBUM.flatMap(t => t.stickers.map(s => s.code));
const TOTAL = ALL_CODES.length; // 980
const VALID_PREFIXES = ALBUM.map(t => t.prefix);
