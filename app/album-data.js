// album-data.js — Panini FIFA World Cup 2026™
// 994 figurinhas: 00 + FWC1-19 (20) + 48 seleções × 20 (960) + CC1-14 (14)

const ALBUM = [

  // ── ESPECIAIS ────────────────────────────────────────────────
  {
    prefix:"FWC", name:"Especiais Copa 2026", flag:"🏆",
    stickers:[
      {code:"00"},{code:"FWC1"},{code:"FWC2"},{code:"FWC3"},{code:"FWC4"},
      {code:"FWC5"},{code:"FWC6"},{code:"FWC7"},{code:"FWC8"},{code:"FWC9"},
      {code:"FWC10"},{code:"FWC11"},{code:"FWC12"},{code:"FWC13"},{code:"FWC14"},
      {code:"FWC15"},{code:"FWC16"},{code:"FWC17"},{code:"FWC18"},{code:"FWC19"},
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

  // ── COCA-COLA ────────────────────────────────────────────────
  {
    prefix:"CC", name:"Coca-Cola", flag:"🥤",
    stickers: Array.from({length:14}, (_,i) => ({code:`CC${i+1}`}))
  },

].map(t => {
  if (t.stickers) return t;
  return {
    ...t,
    stickers: Array.from({length:20}, (_,i) => ({code:`${t.prefix}${i+1}`}))
  };
});

const ALL_CODES = ALBUM.flatMap(t => t.stickers.map(s => s.code));
const TOTAL = ALL_CODES.length; // 994
