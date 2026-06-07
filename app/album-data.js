// ════════════════════════════════════════════════════════════════
// album-data.js — Panini FIFA World Cup 2026™
// 994 figurinhas — verificado contra checklist Ludopédio (BR)
// Estrutura: 00 + FWC1-19 (20) + 48 seleções × 20 (960) + CC1-14 (14) = 994
// Ordem dos grupos A–L conforme álbum físico brasileiro
// ════════════════════════════════════════════════════════════════

const ALBUM = [

  // ── ESPECIAIS (00 + FWC1–FWC19) ──────────────────────────────
  {
    prefix:"FWC", name:"Especiais Copa 2026", flag:"🏆",
    stickers:[
      {code:"00",    n:0,  role:"special", player:"Logo Panini"},
      {code:"FWC1",  n:1,  role:"special", player:"Emblema Oficial"},
      {code:"FWC2",  n:2,  role:"special", player:"Emblema Oficial"},
      {code:"FWC3",  n:3,  role:"special", player:"Mascotes Oficiais"},
      {code:"FWC4",  n:4,  role:"special", player:"Slogan Oficial"},
      {code:"FWC5",  n:5,  role:"special", player:"Bola Oficial"},
      {code:"FWC6",  n:6,  role:"special", player:"Canadá — Sede"},
      {code:"FWC7",  n:7,  role:"special", player:"México — Sede"},
      {code:"FWC8",  n:8,  role:"special", player:"EUA — Sede"},
      {code:"FWC9",  n:9,  role:"special", player:"Museu FIFA 1930"},
      {code:"FWC10", n:10, role:"special", player:"Museu FIFA 1950"},
      {code:"FWC11", n:11, role:"special", player:"Museu FIFA 1958"},
      {code:"FWC12", n:12, role:"special", player:"Museu FIFA 1962"},
      {code:"FWC13", n:13, role:"special", player:"Museu FIFA 1970"},
      {code:"FWC14", n:14, role:"special", player:"Museu FIFA 1994"},
      {code:"FWC15", n:15, role:"special", player:"Museu FIFA 1998"},
      {code:"FWC16", n:16, role:"special", player:"Museu FIFA 2002"},
      {code:"FWC17", n:17, role:"special", player:"Museu FIFA 2006"},
      {code:"FWC18", n:18, role:"special", player:"Museu FIFA 2010"},
      {code:"FWC19", n:19, role:"special", player:"Museu FIFA 2022"},
    ]
  },

  // ── GRUPO A ──────────────────────────────────────────────────
  {prefix:"MEX", name:"México",               flag:"🇲🇽"},
  {prefix:"RSA", name:"África do Sul",         flag:"🇿🇦"},
  {prefix:"KOR", name:"Coreia do Sul",         flag:"🇰🇷"},
  {prefix:"CZE", name:"República Tcheca",      flag:"🇨🇿"},

  // ── GRUPO B ──────────────────────────────────────────────────
  {prefix:"CAN", name:"Canadá",               flag:"🇨🇦"},
  {prefix:"BIH", name:"Bósnia e Herzegovina",  flag:"🇧🇦"},
  {prefix:"QAT", name:"Catar",                flag:"🇶🇦"},
  {prefix:"SUI", name:"Suíça",                flag:"🇨🇭"},

  // ── GRUPO C ──────────────────────────────────────────────────
  {prefix:"BRA", name:"Brasil",               flag:"🇧🇷"},
  {prefix:"MAR", name:"Marrocos",             flag:"🇲🇦"},
  {prefix:"HAI", name:"Haiti",                flag:"🇭🇹"},
  {prefix:"SCO", name:"Escócia",              flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"},

  // ── GRUPO D ──────────────────────────────────────────────────
  {prefix:"USA", name:"Estados Unidos",        flag:"🇺🇸"},
  {prefix:"PAR", name:"Paraguai",             flag:"🇵🇾"},
  {prefix:"AUS", name:"Austrália",            flag:"🇦🇺"},
  {prefix:"TUR", name:"Turquia",              flag:"🇹🇷"},

  // ── GRUPO E ──────────────────────────────────────────────────
  {prefix:"GER", name:"Alemanha",             flag:"🇩🇪"},
  {prefix:"CUW", name:"Curaçao",              flag:"🇨🇼"},
  {prefix:"CIV", name:"Costa do Marfim",      flag:"🇨🇮"},
  {prefix:"ECU", name:"Equador",              flag:"🇪🇨"},

  // ── GRUPO F ──────────────────────────────────────────────────
  {prefix:"NED", name:"Países Baixos",        flag:"🇳🇱"},
  {prefix:"JPN", name:"Japão",                flag:"🇯🇵"},
  {prefix:"SWE", name:"Suécia",               flag:"🇸🇪"},
  {prefix:"TUN", name:"Tunísia",              flag:"🇹🇳"},

  // ── GRUPO G ──────────────────────────────────────────────────
  {prefix:"BEL", name:"Bélgica",              flag:"🇧🇪"},
  {prefix:"EGY", name:"Egito",                flag:"🇪🇬"},
  {prefix:"IRN", name:"Irã",                  flag:"🇮🇷"},
  {prefix:"NZL", name:"Nova Zelândia",        flag:"🇳🇿"},

  // ── GRUPO H ──────────────────────────────────────────────────
  {prefix:"ESP", name:"Espanha",              flag:"🇪🇸"},
  {prefix:"CPV", name:"Cabo Verde",           flag:"🇨🇻"},
  {prefix:"KSA", name:"Arábia Saudita",       flag:"🇸🇦"},
  {prefix:"URU", name:"Uruguai",              flag:"🇺🇾"},

  // ── GRUPO I ──────────────────────────────────────────────────
  {prefix:"FRA", name:"França",               flag:"🇫🇷"},
  {prefix:"SEN", name:"Senegal",              flag:"🇸🇳"},
  {prefix:"IRQ", name:"Iraque",               flag:"🇮🇶"},
  {prefix:"NOR", name:"Noruega",              flag:"🇳🇴"},

  // ── GRUPO J ──────────────────────────────────────────────────
  {prefix:"ARG", name:"Argentina",            flag:"🇦🇷"},
  {prefix:"ALG", name:"Argélia",              flag:"🇩🇿"},
  {prefix:"AUT", name:"Áustria",              flag:"🇦🇹"},
  {prefix:"JOR", name:"Jordânia",             flag:"🇯🇴"},

  // ── GRUPO K ──────────────────────────────────────────────────
  {prefix:"POR", name:"Portugal",             flag:"🇵🇹"},
  {prefix:"COD", name:"Congo RD",             flag:"🇨🇩"},
  {prefix:"UZB", name:"Uzbequistão",          flag:"🇺🇿"},
  {prefix:"COL", name:"Colômbia",             flag:"🇨🇴"},

  // ── GRUPO L ──────────────────────────────────────────────────
  {prefix:"ENG", name:"Inglaterra",           flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
  {prefix:"CRO", name:"Croácia",              flag:"🇭🇷"},
  {prefix:"GHA", name:"Gana",                 flag:"🇬🇭"},
  {prefix:"PAN", name:"Panamá",               flag:"🇵🇦"},

  // ── COCA-COLA (CC1–CC14) — figurinhas promocionais ───────────
  {
    prefix:"CC", name:"Coca-Cola", flag:"🥤",
    stickers: Array.from({length:14}, (_,i) => ({
      code:`CC${i+1}`, n:i+1, role:"special", player:`Coca-Cola ${i+1}`
    }))
  },

].map(t => {
  if (t.stickers) return t;
  return {
    ...t,
    stickers: Array.from({length:20}, (_,i) => {
      const n = i + 1;
      const code = `${t.prefix}${n}`;
      let role = "player", player = "";
      if (n === 1)  { role = "logo";  player = `Logo ${t.name}`; }
      else if (n === 13) { role = "photo"; player = `Foto ${t.name}`; }
      return {code, n, role, player};
    })
  };
});

const ALL_CODES = ALBUM.flatMap(t => t.stickers.map(s => s.code));
const TOTAL = ALL_CODES.length;
const VALID_PREFIXES = ALBUM.map(t => t.prefix);
