/**
 * French Shadowing Studio - French Morphology Engine (Verbs Core)
 * Module UMD thuần JavaScript: sinh biến thể và tra ngược hình thái động từ tiếng Pháp.
 * Không phụ thuộc bên ngoài, chạy trên cả Node.js và Trình duyệt.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FrenchMorphology = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Chuẩn hóa lemma đầu vào (bỏ đại từ phản thân se/s', nháy, khoảng trắng)
  function normalizeLemma(lemma) {
    if (!lemma || typeof lemma !== 'string') return '';
    return lemma
      .trim()
      .toLowerCase()
      .replace(/\s*[\u2018\u2019\u201B\u0060\u00B4ʻʼ']\s*/g, "'")
      .replace(/^(se|s')\s*/i, '')
      .trim();
  }

  // Bảng động từ bất quy tắc Nhóm 3 cốt lõi (Roots)
  // Mỗi gốc từ chứa danh sách các dạng chia đơn chuẩn xác
  var IRREGULAR_ROOTS = {
    'être': [
      'suis', 'es', 'est', 'sommes', 'êtes', 'etes', 'sont',
      'étais', 'etais', 'était', 'etait', 'étions', 'etions', 'étiez', 'etiez', 'étaient', 'etaient',
      'été', 'ete',
      'fus', 'fut', 'fûmes', 'fumes', 'fûtes', 'futes', 'furent',
      'serai', 'seras', 'sera', 'serons', 'serez', 'seront',
      'serais', 'serait', 'serions', 'seriez', 'seraient',
      'sois', 'soit', 'soyons', 'soyez', 'soient',
      'étant', 'etant'
    ],
    'avoir': [
      'ai', 'as', 'a', 'avons', 'avez', 'ont',
      'avais', 'avait', 'avions', 'aviez', 'avaient',
      'eu', 'eue', 'eus', 'eues',
      'eus', 'eut', 'eûmes', 'eumes', 'eûtes', 'eutes', 'eurent',
      'aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront',
      'aurais', 'aurait', 'aurions', 'auriez', 'auraient',
      'aie', 'aies', 'ait', 'ayons', 'ayez', 'aient',
      'ayant'
    ],
    'aller': [
      'vais', 'vas', 'va', 'allons', 'allez', 'vont',
      'allais', 'allait', 'allions', 'alliez', 'allaient',
      'allé', 'allée', 'allés', 'allées', 'alle', 'allee', 'alles', 'allees',
      'irai', 'iras', 'ira', 'irons', 'irez', 'iront',
      'irais', 'irait', 'irions', 'iriez', 'iraient',
      'aille', 'ailles', 'aillent',
      'allant'
    ],
    'faire': [
      'fais', 'fait', 'faisons', 'faites', 'font',
      'faisais', 'faisait', 'faisions', 'faisiez', 'faisaient',
      'fait', 'faite', 'faits', 'faites',
      'fis', 'fit', 'fîmes', 'fimes', 'fîtes', 'fites', 'firent',
      'ferai', 'feras', 'fera', 'ferons', 'ferez', 'feront',
      'ferais', 'ferait', 'ferions', 'feriez', 'feraient',
      'fasse', 'fasses', 'fassions', 'fassiez', 'fassent',
      'faisant'
    ],
    'prendre': [
      'prends', 'prend', 'prenons', 'prenez', 'prennent',
      'prenais', 'prenait', 'prenions', 'preniez', 'prenaient',
      'pris', 'prise', 'prises',
      'prit', 'prîmes', 'prîtes', 'prirent',
      'prendrai', 'prendras', 'prendra', 'prendrons', 'prendrez', 'prendront',
      'prendrais', 'prendrait', 'prendrions', 'prendriez', 'prendraient',
      'prenne', 'prennes',
      'prenant'
    ],
    'venir': [
      'viens', 'vient', 'venons', 'venez', 'viennent',
      'venais', 'venait', 'venions', 'veniez', 'venaient',
      'venu', 'venue', 'venus', 'venues',
      'vins', 'vint', 'vînmes', 'vintes', 'vinrent',
      'viendrai', 'viendras', 'viendra', 'viendrons', 'viendrez', 'viendront',
      'viendrais', 'viendrait', 'viendrions', 'viendriez', 'viendraient',
      'vienne', 'viennes',
      'venant'
    ],
    'tenir': [
      'tiens', 'tient', 'tenons', 'tenez', 'tiennent',
      'tenais', 'tenait', 'tenions', 'teniez', 'tenaient',
      'tenu', 'tenue', 'tenus', 'tenues',
      'tins', 'tint', 'tînmes', 'tintes', 'tinrent',
      'tiendrai', 'tiendras', 'tiendra', 'tiendrons', 'tiendrez', 'tiendront',
      'tiendrais', 'tiendrait', 'tiendrions', 'tiendriez', 'tiendraient',
      'tienne', 'tiennes',
      'tenant'
    ],
    'mettre': [
      'mets', 'met', 'mettons', 'mettez', 'mettent',
      'mettais', 'mettait', 'mettions', 'mettiez', 'mettaient',
      'mis', 'mise', 'mises',
      'mit', 'mîmes', 'mîtes', 'mirent',
      'mettrai', 'mettras', 'mettra', 'mettrons', 'mettrez', 'mettront',
      'mettrais', 'mettrait', 'mettrions', 'mettriez', 'mettraient',
      'mette', 'mettes',
      'mettant'
    ],
    'dire': [
      'dis', 'dit', 'disons', 'dites', 'disent',
      'disais', 'disait', 'disions', 'disiez', 'disaient',
      'dit', 'dite', 'dits', 'dites',
      'dirai', 'diras', 'dira', 'dirons', 'direz', 'diront',
      'dirais', 'dirait', 'dirions', 'diriez', 'diraient',
      'dise', 'dises',
      'disant'
    ],
    'voir': [
      'vois', 'voit', 'voyons', 'voyez', 'voient',
      'voyais', 'voyait', 'voyions', 'voyiez', 'voyaient',
      'vu', 'vue', 'vus', 'vues',
      'vis', 'vit', 'vîmes', 'vîtes', 'virent',
      'verrai', 'verras', 'verra', 'verrons', 'verrez', 'verront',
      'verrais', 'verrait', 'verrions', 'verriez', 'verraient',
      'voie', 'voies',
      'voyant'
    ],
    'savoir': [
      'sais', 'sait', 'savons', 'savez', 'savent',
      'savais', 'savait', 'savions', 'saviez', 'savaient',
      'su', 'sue', 'sus', 'sues',
      'sut', 'sûmes', 'sûtes', 'surent',
      'saurai', 'sauras', 'saura', 'saurons', 'saurez', 'sauront',
      'saurais', 'saurait', 'saurions', 'sauriez', 'sauraient',
      'sache', 'saches', 'sachions', 'sachiez', 'sachent',
      'sachant'
    ],
    'pouvoir': [
      'peux', 'puis', 'peut', 'pouvons', 'pouvez', 'peuvent',
      'pouvais', 'pouvait', 'pouvions', 'pouviez', 'pouvaient',
      'pu',
      'pus', 'put', 'pûmes', 'pûtes', 'purent',
      'pourrai', 'pourras', 'pourra', 'pourrons', 'pourrez', 'pourront',
      'pourrais', 'pourrait', 'pourrions', 'pourriez', 'pourraient',
      'puisse', 'puisses', 'puissions', 'puissiez', 'puissent',
      'pouvant'
    ],
    'vouloir': [
      'veux', 'veut', 'voulons', 'voulez', 'veulent',
      'voulais', 'voulait', 'voulions', 'vouliez', 'voulaient',
      'voulu', 'voulue', 'voulus', 'voulues',
      'voulus', 'voulut', 'voulûmes', 'voulûtes', 'voulurent',
      'voudrai', 'voudras', 'voudra', 'voudrons', 'voudrez', 'voudront',
      'voudrais', 'voudrait', 'voudrions', 'voudriez', 'voudraient',
      'veuille', 'veuilles', 'veuillez', 'veuillent',
      'voulant'
    ],
    'devoir': [
      'dois', 'doit', 'devons', 'devez', 'doivent',
      'devais', 'devait', 'devions', 'deviez', 'devaient',
      'dû', 'due', 'dus', 'dues', 'du',
      'dut', 'dûmes', 'dûtes', 'durent',
      'devrai', 'devras', 'devra', 'devrons', 'devrez', 'devront',
      'devrais', 'devrait', 'devrions', 'devriez', 'devraient',
      'doive', 'doives',
      'devant'
    ],
    'lire': [
      'lis', 'lit', 'lisons', 'lisez', 'lisent',
      'lisais', 'lisait', 'lisions', 'lisiez', 'lisaient',
      'lu', 'lue', 'lus', 'lues',
      'lut', 'lûmes', 'lûtes', 'lurent',
      'lirai', 'liras', 'lira', 'lirons', 'lirez', 'liront',
      'lirais', 'lirait', 'lirions', 'liriez', 'liraient',
      'lise', 'lises',
      'lisant'
    ],
    'écrire': [
      'écris', 'ecris', 'écrit', 'ecrit', 'écrivons', 'ecrivons', 'écrivez', 'ecrivez', 'écrivent', 'ecrivent',
      'écrivais', 'ecrivais', 'écrivait', 'ecrivait', 'écrivions', 'ecrivions', 'écriviez', 'ecriviez', 'écrivaient', 'ecrivaient',
      'écrit', 'ecrit', 'écrite', 'ecrite', 'écrits', 'ecrits', 'écrites', 'ecrites',
      'écrivis', 'écrivit', 'écrivirent',
      'écrirai', 'ecrirai', 'écriras', 'ecriras', 'écrira', 'ecrira', 'écrirons', 'ecrirons', 'écrirez', 'ecrirez', 'écriront', 'ecriront',
      'écrirais', 'ecrirais', 'écrirait', 'ecrirait', 'écririons', 'ecririons', 'écririez', 'ecririez', 'écriraient', 'ecriraient',
      'écrive', 'ecrive', 'écrives', 'ecrives',
      'écrivant', 'ecrivant'
    ],
    'croire': [
      'crois', 'croit', 'croyons', 'croyez', 'croient',
      'croyais', 'croyait', 'croyions', 'croyiez', 'croyaient',
      'cru', 'crue', 'crus', 'crues',
      'crut', 'crûmes', 'crûtes', 'crurent',
      'croirai', 'croiras', 'croira', 'croirons', 'croirez', 'croiront',
      'croirais', 'croirait', 'croirions', 'croiriez', 'croiraient',
      'croie', 'croies',
      'croyant'
    ],
    'boire': [
      'bois', 'boit', 'buvons', 'buvez', 'boivent',
      'buvais', 'buvait', 'buvions', 'buviez', 'buvaient',
      'bu', 'bue', 'bus', 'bues',
      'but', 'bûmes', 'bûtes', 'burent',
      'boirai', 'boiras', 'boira', 'boirons', 'boirez', 'boiront',
      'boirais', 'boirait', 'boirions', 'boiriez', 'boiraient',
      'boive', 'boives',
      'buvant'
    ],
    'connaître': [
      'connais', 'connait', 'connaît', 'connaissons', 'connaissez', 'connaissent',
      'connaissais', 'connaissait', 'connaissions', 'connaissiez', 'connaissaient',
      'connu', 'connue', 'connus', 'connues',
      'connut', 'connûmes', 'connûtes', 'connurent',
      'connaîtrai', 'connaitrai', 'connaîtras', 'connaitras', 'connaîtra', 'connaitra',
      'connaîtrons', 'connaitrons', 'connaîtrez', 'connaitrez', 'connaîtront', 'connaitront',
      'connaîtrais', 'connaissait',
      'connaisse', 'connaisses',
      'connaissant'
    ],
    'paraître': [
      'parais', 'parait', 'paraît', 'paraissons', 'paraissez', 'paraissent',
      'paraissais', 'paraissait', 'paraissions', 'paraissiez', 'paraissaient',
      'paru', 'parue', 'parus', 'parues',
      'parut', 'parûmes', 'parurent',
      'paraîtrai', 'paraitrai', 'paraîtras', 'paraitras', 'paraîtra', 'paraitra',
      'paraîtrons', 'paraitrons', 'paraîtrez', 'paraitrez', 'paraîtront', 'paraitront',
      'paraisse', 'paraisses',
      'paraissant'
    ],
    'vivre': [
      'vis', 'vit', 'vivons', 'vivez', 'vivent',
      'vivais', 'vivait', 'vivions', 'viviez', 'vivaient',
      'vécu', 'vecu', 'vécue', 'vecue', 'vécus', 'vecus', 'vécues', 'vecues',
      'vécus', 'vécut', 'vécurent',
      'vivrai', 'vivras', 'vivra', 'vivrons', 'vivrez', 'vivront',
      'vivrais', 'vivrait', 'vivrions', 'vivriez', 'vivraient',
      'vive', 'vives',
      'vivant'
    ],
    'partir': [
      'pars', 'part', 'partons', 'partez', 'partent',
      'partais', 'partait', 'partions', 'partiez', 'partaient',
      'parti', 'partie', 'partis', 'parties',
      'partis', 'partit', 'partirent',
      'partirai', 'partiras', 'partira', 'partirons', 'partirez', 'partiront',
      'partirais', 'partirait', 'partirions', 'partiriez', 'partiraient',
      'parte', 'partes',
      'partant'
    ],
    'sortir': [
      'sors', 'sort', 'sortons', 'sortez', 'sortent',
      'sortais', 'sortait', 'sortions', 'sortiez', 'sortaient',
      'sorti', 'sortie', 'sortis', 'sorties',
      'sortis', 'sortit', 'sortirent',
      'sortirai', 'sortiras', 'sortira', 'sortirons', 'sortirez', 'sortiront',
      'sortirais', 'sortirait',
      'sorte', 'sortes',
      'sortant'
    ],
    'dormir': [
      'dors', 'dort', 'dormons', 'dormez', 'dorment',
      'dormais', 'dormait', 'dormions', 'dormiez', 'dormaient',
      'dormi', 'dormie', 'dormis', 'dormies',
      'dormis', 'dormit', 'dormirent',
      'dormirai', 'dormiras', 'dormira', 'dormirons', 'dormirez', 'dormiront',
      'dormirais', 'dormirait',
      'dorme', 'dormes',
      'dormant'
    ],
    'servir': [
      'sers', 'sert', 'servons', 'servez', 'servent',
      'servais', 'servait', 'servions', 'serviez', 'servaient',
      'servi', 'servie', 'servis', 'servies',
      'servis', 'servit', 'servirent',
      'servirai', 'serviras', 'servira', 'servirons', 'servirez', 'serviront',
      'servirais', 'servirait',
      'serve', 'serves',
      'servant'
    ],
    'sentir': [
      'sens', 'sent', 'sentons', 'sentez', 'sentent',
      'sentais', 'sentait', 'sentions', 'sentiez', 'sentaient',
      'senti', 'sentie', 'sentis', 'senties',
      'sentis', 'sentit', 'sentirent',
      'sentirai', 'sentiras', 'sentira', 'sentirons', 'sentirez', 'sentiront',
      'sentirais', 'sentirait',
      'sente', 'sentes',
      'sentant'
    ],
    'ouvrir': [
      'ouvre', 'ouvres', 'ouvrons', 'ouvrez', 'ouvrent',
      'ouvrais', 'ouvrait', 'ouvrions', 'ouvriez', 'ouvraient',
      'ouvert', 'ouverte', 'ouverts', 'ouvertes',
      'ouvris', 'ouvrit', 'ouvrirent',
      'ouvrirai', 'ouvriras', 'ouvrira', 'ouvrirons', 'ouvrirez', 'ouvriront',
      'ouvrirais', 'ouvrirait',
      'ouvre', 'ouvrant'
    ],
    'offrir': [
      'offre', 'offres', 'offrons', 'offrez', 'offrent',
      'offrais', 'offrait', 'offrions', 'offriez', 'offraient',
      'offert', 'offerte', 'offerts', 'offertes',
      'offris', 'offrit', 'offrirent',
      'offrirai', 'offriras', 'offrira', 'offrirons', 'offrirez', 'offriront',
      'offrirais', 'offrirait',
      'offrant'
    ],
    'suivre': [
      'suis', 'suit', 'suivons', 'suivez', 'suivent',
      'suivais', 'suivait', 'suivions', 'suiviez', 'suivaient',
      'suivi', 'suivie', 'suivis', 'suivies',
      'suivis', 'suivit', 'suivirent',
      'suivrai', 'suivras', 'suivra', 'suivrons', 'suivrez', 'suivront',
      'suivrais', 'suivrait',
      'suive', 'suives',
      'suivant'
    ],
    'mourir': [
      'meurs', 'meurt', 'mourons', 'mourez', 'meurent',
      'mourais', 'mourait', 'mourions', 'mouriez', 'mouraient',
      'mort', 'morte', 'morts', 'mortes',
      'mourus', 'mourut', 'moururent',
      'mourrai', 'mourras', 'mourra', 'mourrons', 'mourrez', 'mourront',
      'mourrais', 'mourrait',
      'meure', 'meures',
      'mourant'
    ],
    'falloir': [
      'faut', 'fallait', 'fallu', 'faudra', 'faudrait', 'faille'
    ],
    'valoir': [
      'vaux', 'vaut', 'valons', 'valez', 'valent',
      'valais', 'valait', 'valions', 'valiez', 'valaient',
      'valu', 'value', 'valus', 'values',
      'vaudrai', 'vaudras', 'vaudra', 'vaudrons', 'vaudrez', 'vaudront',
      'vaudrais', 'vaudrait',
      'vaille', 'vailles',
      'valant'
    ]
  };

  // Tiền tố dẫn xuất cho các động từ Nhóm 3 (Prefix derivations)
  var PREFIX_MAP = {
    'prendre': ['ap', 'com', 'dé', 'de', 'entre', 'mé', 'me', 're', 'sur'],
    'venir': ['ad', 'circon', 'con', 'contre', 'de', 'inter', 'par', 'pré', 'pre', 'pro', 're', 'sou', 'sur'],
    'tenir': ['abs', 'appar', 'con', 'dé', 'de', 'entre', 'main', 'ob', 're', 'sou'],
    'mettre': ['ad', 'compro', 'dé', 'de', 'é', 'e', 'o', 'per', 'pro', 're', 'sou', 'trans'],
    'dire': ['contre', 'inter', 'mé', 'me', 'pré', 'pre', 're'],
    'voir': ['entre', 'pré', 'pre', 're'],
    'faire': ['dé', 'de', 're', 'satis'],
    'écrire': ['d', 'in', 'pres', 'sous', 'trans'],
    'lire': ['re', 'é', 'e'],
    'croire': ['mé', 'me'],
    'connaître': ['re', 'mé', 'me'],
    'connaitre': ['re', 'mé', 'me'],
    'paraître': ['ap', 'dis', 're'],
    'paraitre': ['ap', 'dis', 're'],
    'vivre': ['sur', 're'],
    'partir': ['re'],
    'sortir': ['res'],
    'dormir': ['en', 're'],
    'servir': ['des', 'res'],
    'sentir': ['con', 'pres', 'res'],
    'ouvrir': ['c', 'déc', 'dec', 'entr', 'r'],
    'offrir': ['souffr'],
    'suivre': ['pour']
  };

  // Các họ động từ có mẫu chia chung (Pattern families)
  // 1. Họ -dre (attendre, vendre, perdre, entendre, répondre, rendre, défendre, descendre)
  var DRE_VERBS = [
    'attendre', 'vendre', 'perdre', 'entendre', 'répondre', 'repondre',
    'rendre', 'défendre', 'defendre', 'descendre', 'confondre', 'correspondre',
    'dépendre', 'dependre', 'fondre', 'mordre', 'pendre', 'prétendre', 'pretendre', 'tendre'
  ];

  // 2. Họ -ndre (craindre, peindre, éteindre, atteindre, joindre, plaindre)
  var NDRE_VERBS = {
    'craindre': { stem: 'crain', root: 'craign', part: 'craint' },
    'plaindre': { stem: 'plain', root: 'plaign', part: 'plaint' },
    'peindre': { stem: 'pein', root: 'peign', part: 'peint' },
    'éteindre': { stem: 'étein', root: 'éteign', part: 'éteint' },
    'eteindre': { stem: 'etein', root: 'eteign', part: 'eteint' },
    'atteindre': { stem: 'attein', root: 'atteign', part: 'atteint' },
    'joindre': { stem: 'join', root: 'joign', part: 'joint' },
    'rejoindre': { stem: 'rejoin', root: 'rejoign', part: 'rejoint' },
    'contraindre': { stem: 'contrain', root: 'contraign', part: 'contraint' }
  };

  // 3. Họ -uire (conduire, produire, traduire, construire, détruire, séduire, réduire)
  var UIRE_VERBS = [
    'conduire', 'produire', 'traduire', 'construire', 'détruire', 'detruire',
    'séduire', 'seduire', 'réduire', 'reduire', 'introduire', 'reproduire', 'cuire'
  ];

  // 4. Các động từ Nhóm 2 (-ir) phổ biến
  var GROUP2_VERBS = new Set([
    'finir', 'choisir', 'réussir', 'reussir', 'grandir', 'agir', 'obéir', 'obeir',
    'remplir', 'réfléchir', 'reflechir', 'punir', 'bâtir', 'batir', 'nourrir',
    'vieillir', 'applaudir', 'atterrir', 'avertir', 'définir', 'definir',
    'établir', 'etablir', 'investir', 'ralentir', 'réunir', 'reunir',
    'saisir', 'subir', 'unir', 'grossir', 'maigrir', 'rougir', 'blanchir'
  ]);

  // Sinh dạng chia cho họ -dre (attendre)
  function conjugateDre(inf) {
    var base = inf.slice(0, -2); // bỏ -re (ví dụ 'attendre' -> 'attend')
    return [
      base + 's', base, base + 'ons', base + 'ez', base + 'ent',
      base + 'ais', base + 'ait', base + 'ions', base + 'iez', base + 'aient',
      base + 'u', base + 'ue', base + 'us', base + 'ues',
      base + 'rai', base + 'ras', base + 'ra', base + 'rons', base + 'rez', base + 'ront',
      base + 'rais', base + 'rait', base + 'rions', base + 'riez', base + 'raient',
      base + 'e', base + 'es', base + 'ant'
    ];
  }

  // Sinh dạng chia cho họ -ndre (craindre)
  function conjugateNdre(inf) {
    var spec = NDRE_VERBS[inf];
    if (!spec) return [];
    var s = spec.stem;
    var r = spec.root;
    var p = spec.part;
    return [
      s + 's', s + 't', r + 'ons', r + 'ez', r + 'ent',
      r + 'ais', r + 'ait', r + 'ions', r + 'iez', r + 'aient',
      p, p + 'e', p + 's', p + 'es',
      s + 'drai', s + 'dras', s + 'dra', s + 'drons', s + 'drez', s + 'dront',
      s + 'drais', s + 'drait', s + 'drions', s + 'driez', s + 'draient',
      r + 'e', r + 'es', r + 'ant'
    ];
  }

  // Sinh dạng chia cho họ -uire (conduire)
  function conjugateUire(inf) {
    var base = inf.slice(0, -2); // bỏ -re (ví dụ 'conduire' -> 'condui')
    var root = base + 's';      // 'conduis'
    var p = base + 't';        // 'conduit'
    return [
      root, p, root + 'ons', root + 'ez', root + 'ent',
      root + 'ais', root + 'ait', root + 'ions', root + 'iez', root + 'aient',
      p, p + 'e', p + 's', p + 'es',
      base + 'rai', base + 'ras', base + 'ra', base + 'rons', base + 'rez', base + 'ront',
      base + 'rais', base + 'rait', base + 'rions', base + 'riez', base + 'raient',
      root + 'e', root + 'es', root + 'ant'
    ];
  }

  // Sinh dạng chia cho Động từ Nhóm 2 (-ir avec -iss-)
  function conjugateGroup2(inf) {
    var stem = inf.slice(0, -2);
    return [
      stem + 'is', stem + 'it', stem + 'issons', stem + 'issez', stem + 'issent',
      stem + 'issais', stem + 'issait', stem + 'issions', stem + 'issiez', stem + 'issaient',
      stem + 'i', stem + 'ie', stem + 'is', stem + 'ies',
      stem + 'irai', stem + 'iras', stem + 'ira', stem + 'irons', stem + 'irez', stem + 'iront',
      stem + 'irais', stem + 'irait', stem + 'irions', stem + 'iriez', stem + 'iraient',
      stem + 'isse', stem + 'isses', stem + 'issant'
    ];
  }

  // Sinh dạng chia cho Động từ Nhóm 1 (-er) kèm các biến đổi chính tả
  function conjugateGroup1(inf) {
    var res = [];
    var baseStem = inf.slice(0, -2);

    // 1. -ger (manger, nager, voyager...): chèn e trước a và o
    var isGer = inf.endsWith('ger');
    // 2. -cer (commencer, lancer...): c -> ç trước a và o
    var isCer = inf.endsWith('cer');
    var stemCer = isCer ? inf.slice(0, -3) + 'ç' : baseStem;
    // 3. -eler / -eter (appeler, jeter): gấp đôi phụ âm trước e câm
    var isAppeler = (inf === 'appeler' || inf === 'rappeler');
    var isJeter = (inf === 'jeter' || inf === 'rejeter');
    // 4. -yer (payer, nettoyer, envoyer, employer): y -> i trước e câm
    var isYer = inf.endsWith('yer');
    var isEnvoyer = (inf === 'envoyer' || inf === 'renvoyer');
    // 5. é/e + C + er (acheter, céder, préférer, lever, mener)
    var isAcheter = (inf === 'acheter');
    var matchAccent = baseStem.match(/^(.*)([éèe])([^aeiouy]+)$/);

    // Tính toán thân từ biến đổi trước e câm (mute e)
    var stemMute = baseStem;
    var stemFutur = baseStem + 'er'; // mặc định 'parler', 'manger'
    if (isAppeler) {
      stemMute = baseStem + 'l';
      stemFutur = baseStem + 'ler';
    } else if (isJeter) {
      stemMute = baseStem + 't';
      stemFutur = baseStem + 'ter';
    } else if (isYer) {
      var yRoot = baseStem.slice(0, -1);
      stemMute = yRoot + 'i';
      stemFutur = yRoot + 'ier';
      if (inf.endsWith('ayer')) {
        // payer chấp nhận cả paie và paye
        res.push(baseStem + 'e', baseStem + 'es', baseStem + 'ent');
        res.push(baseStem + 'erai', baseStem + 'eras', baseStem + 'era', baseStem + 'erons', baseStem + 'erez', baseStem + 'eront');
      }
    } else if (isAcheter) {
      stemMute = 'achèt';
      stemFutur = 'achèter';
      res.push('acheterai', 'achèterai', 'achèteras', 'achètera', 'achèterons', 'achèterez', 'achèteront');
    } else if (matchAccent && !isGer && !isCer) {
      var prefix = matchAccent[1];
      var consonant = matchAccent[3];
      stemMute = prefix + 'è' + consonant;
      stemFutur = prefix + 'è' + consonant + 'er';
      res.push(
        baseStem + 'erai', baseStem + 'eras', baseStem + 'era',
        baseStem + 'erons', baseStem + 'erez', baseStem + 'eront'
      );
    }

    if (isEnvoyer) {
      // envoyer -> enverrai (inf.slice(0, -4) -> 'env' hoặc 'renv')
      var envPref = inf.slice(0, -4);
      res.push(
        envPref + 'errai', envPref + 'erras', envPref + 'erra',
        envPref + 'errons', envPref + 'errez', envPref + 'erront',
        envPref + 'errais', envPref + 'errait', envPref + 'errions', envPref + 'erriez', envPref + 'erraient'
      );
    } else {
      // Futur & Conditionnel chuẩn
      res.push(
        stemFutur + 'ai', stemFutur + 'as', stemFutur + 'a',
        stemFutur + 'ons', stemFutur + 'ez', stemFutur + 'ont',
        stemFutur + 'ais', stemFutur + 'ait', stemFutur + 'ions', stemFutur + 'iez', stemFutur + 'aient'
      );
    }

    // Présent & Subjonctif
    res.push(stemMute + 'e', stemMute + 'es', stemMute + 'ent');
    if (isGer) {
      res.push(baseStem + 'eons', baseStem + 'ez');
    } else if (isCer) {
      res.push(stemCer + 'ons', baseStem + 'ez');
    } else {
      res.push(baseStem + 'ons', baseStem + 'ez');
    }

    // Imparfait
    if (isGer) {
      res.push(baseStem + 'eais', baseStem + 'eait', baseStem + 'ions', baseStem + 'iez', baseStem + 'eaient');
    } else if (isCer) {
      res.push(stemCer + 'ais', stemCer + 'ait', baseStem + 'ions', baseStem + 'iez', stemCer + 'aient');
    } else {
      res.push(baseStem + 'ais', baseStem + 'ait', baseStem + 'ions', baseStem + 'iez', baseStem + 'aient');
    }

    // Participe passé & Participe présent
    var partPasse = baseStem + 'é';
    res.push(partPasse, partPasse + 'e', partPasse + 's', partPasse + 'es');
    // Dạng không dấu phụ nếu có
    res.push(baseStem + 'e', baseStem + 'ee', baseStem + 'es', baseStem + 'ees');
    if (isGer) {
      res.push(baseStem + 'eant');
    } else if (isCer) {
      res.push(stemCer + 'ant');
    } else {
      res.push(baseStem + 'ant');
    }

    return res;
  }

  // Tra cứu toàn bộ dạng chia của một động từ nguyên thể
  function getVerbConjugations(lemma) {
    var inf = normalizeLemma(lemma);
    if (!inf) return [];

    var forms = new Set();
    forms.add(inf);

    // 1. Kiểm tra bảng bất quy tắc trực tiếp (Direct Irregular Root)
    if (Object.prototype.hasOwnProperty.call(IRREGULAR_ROOTS, inf)) {
      IRREGULAR_ROOTS[inf].forEach(function (f) { forms.add(f); });
      return Array.from(forms);
    }

    // 2. Kiểm tra tiền tố dẫn xuất từ động từ bất quy tắc (Derived Verbs)
    for (var root in PREFIX_MAP) {
      if (!Object.prototype.hasOwnProperty.call(PREFIX_MAP, root)) continue;
      if (inf.endsWith(root)) {
        var pref = inf.slice(0, -root.length);
        if (PREFIX_MAP[root].indexOf(pref) !== -1) {
          var rootForms = IRREGULAR_ROOTS[root] || [];
          rootForms.forEach(function (rf) {
            forms.add(pref + rf);
          });
          return Array.from(forms);
        }
      }
    }

    // 3. Kiểm tra các họ động từ đặc biệt (-dre, -ndre, -uire)
    if (DRE_VERBS.indexOf(inf) !== -1) {
      conjugateDre(inf).forEach(function (f) { forms.add(f); });
      return Array.from(forms);
    }
    if (Object.prototype.hasOwnProperty.call(NDRE_VERBS, inf)) {
      conjugateNdre(inf).forEach(function (f) { forms.add(f); });
      return Array.from(forms);
    }
    if (UIRE_VERBS.indexOf(inf) !== -1) {
      conjugateUire(inf).forEach(function (f) { forms.add(f); });
      return Array.from(forms);
    }

    // 4. Kiểm tra Nhóm 2 (-ir với -issant)
    if (GROUP2_VERBS.has(inf)) {
      conjugateGroup2(inf).forEach(function (f) { forms.add(f); });
      return Array.from(forms);
    }

    // 5. Mặc định: nếu đuôi -er -> Nhóm 1
    if (inf.endsWith('er')) {
      conjugateGroup1(inf).forEach(function (f) { forms.add(f); });
      return Array.from(forms);
    }

    // 6. Nếu đuôi -ir -> thử chia theo Nhóm 2 nếu không có trong bảng Nhóm 3
    if (inf.endsWith('ir')) {
      conjugateGroup2(inf).forEach(function (f) { forms.add(f); });
      return Array.from(forms);
    }

    return Array.from(forms);
  }

  // Xây dựng chỉ mục tra ngược: form -> Set<lemma> (Lazy-loaded / Cached)
  var _reverseMap = null;

  function ensureReverseMap() {
    if (_reverseMap) return _reverseMap;
    _reverseMap = Object.create(null);

    function addMapping(form, lemma) {
      var clean = String(form || '').trim().toLowerCase();
      if (!clean) return;
      if (!_reverseMap[clean]) _reverseMap[clean] = [];
      if (_reverseMap[clean].indexOf(lemma) === -1) {
        _reverseMap[clean].push(lemma);
      }
    }

    // 1. Nạp tất cả động từ bất quy tắc cốt lõi
    for (var root in IRREGULAR_ROOTS) {
      if (!Object.prototype.hasOwnProperty.call(IRREGULAR_ROOTS, root)) continue;
      addMapping(root, root);
      var forms = IRREGULAR_ROOTS[root];
      for (var i = 0; i < forms.length; i++) {
        addMapping(forms[i], root);
      }
      // Nạp các tiền tố dẫn xuất phổ biến
      var prefixes = PREFIX_MAP[root] || [];
      for (var p = 0; p < prefixes.length; p++) {
        var dLemma = prefixes[p] + root;
        addMapping(dLemma, dLemma);
        for (var k = 0; k < forms.length; k++) {
          addMapping(prefixes[p] + forms[k], dLemma);
        }
      }
    }

    // 2. Nạp họ -dre, -ndre, -uire
    DRE_VERBS.forEach(function (v) {
      conjugateDre(v).forEach(function (f) { addMapping(f, v); });
    });
    for (var nv in NDRE_VERBS) {
      if (Object.prototype.hasOwnProperty.call(NDRE_VERBS, nv)) {
        conjugateNdre(nv).forEach(function (f) { addMapping(f, nv); });
      }
    }
    UIRE_VERBS.forEach(function (v) {
      conjugateUire(v).forEach(function (f) { addMapping(f, v); });
    });

    // 3. Nạp danh sách Nhóm 2
    GROUP2_VERBS.forEach(function (v) {
      conjugateGroup2(v).forEach(function (f) { addMapping(f, v); });
    });

    return _reverseMap;
  }

  // Tra ngược từ một dạng chia về các động từ nguyên thể có thể có (Homographs)
  function findLemmasForForm(wordForm) {
    if (!wordForm || typeof wordForm !== 'string') return [];
    var clean = wordForm.trim().toLowerCase().replace(/[\u2018\u2019\u201B\u0060\u00B4ʻʼ]/g, "'");
    var map = ensureReverseMap();
    if (map[clean]) {
      return map[clean].slice();
    }
    // Heuristic đơn giản cho Nhóm 1: nếu tận cùng bằng -é, -ait, -ons, -ez, -ent
    if (clean.endsWith('er')) return [clean];
    if (clean.endsWith('é') || clean.endsWith('ée') || clean.endsWith('és') || clean.endsWith('ées')) {
      var base = clean.replace(/é(es|e|s)?$/, '');
      return [base + 'er'];
    }
    return [];
  }

  return {
    normalizeLemma: normalizeLemma,
    getVerbConjugations: getVerbConjugations,
    findLemmasForForm: findLemmasForForm
  };
});
