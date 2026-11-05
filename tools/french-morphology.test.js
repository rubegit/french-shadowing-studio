'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const FrenchMorphology = require('./french-morphology.js');

test('M13a: French Morphology Core - normalizeLemma', () => {
  assert.equal(FrenchMorphology.normalizeLemma('se balader'), 'balader');
  assert.equal(FrenchMorphology.normalizeLemma("s'appeler"), 'appeler');
  assert.equal(FrenchMorphology.normalizeLemma('  se   souvenir  '), 'souvenir');
  assert.equal(FrenchMorphology.normalizeLemma('manger'), 'manger');
});

test('M13a: French Morphology Core - Group 1 (-er) Orthographic Variations', () => {
  // 1. -ger: manger -> mangeons, mangeait, mangeant
  const mangerForms = new Set(FrenchMorphology.getVerbConjugations('manger'));
  assert.ok(mangerForms.has('mangeons'), 'manger phai co mangeons');
  assert.ok(mangerForms.has('mangeait'), 'manger phai co mangeait');
  assert.ok(mangerForms.has('mangeant'), 'manger phai co mangeant');
  assert.ok(mangerForms.has('mangé'), 'manger phai co mangé');

  // 2. -cer: commencer -> commençons, commençait, commençant
  const commencerForms = new Set(FrenchMorphology.getVerbConjugations('commencer'));
  assert.ok(commencerForms.has('commençons'), 'commencer phai co commençons');
  assert.ok(commencerForms.has('commençait'), 'commencer phai co commençait');
  assert.ok(commencerForms.has('commençant'), 'commencer phai co commençant');
  assert.ok(commencerForms.has('commencé'), 'commencer phai co commencé');

  // 3. -eler / -eter: appeler -> appelle, appelons, appellera
  const appelerForms = new Set(FrenchMorphology.getVerbConjugations('appeler'));
  assert.ok(appelerForms.has('appelle'), 'appeler phai co appelle');
  assert.ok(appelerForms.has('appelons'), 'appeler phai co appelons');
  assert.ok(appelerForms.has('appellera'), 'appeler phai co appellera');

  const jeterForms = new Set(FrenchMorphology.getVerbConjugations('jeter'));
  assert.ok(jeterForms.has('jette'), 'jeter phai co jette');
  assert.ok(jeterForms.has('jetons'), 'jeter phai co jetons');
  assert.ok(jeterForms.has('jettera'), 'jeter phai co jettera');

  // 4. -yer: payer -> paie, paye, payons
  const payerForms = new Set(FrenchMorphology.getVerbConjugations('payer'));
  assert.ok(payerForms.has('paie'), 'payer phai co paie');
  assert.ok(payerForms.has('paye'), 'payer phai co paye');
  assert.ok(payerForms.has('payons'), 'payer phai co payons');

  // 5. envoyer -> enverrai, envoyons
  const envoyerForms = new Set(FrenchMorphology.getVerbConjugations('envoyer'));
  assert.ok(envoyerForms.has('enverrai'), 'envoyer phai co enverrai');
  assert.ok(envoyerForms.has('enverra'), 'envoyer phai co enverra');
  assert.ok(envoyerForms.has('envoyons'), 'envoyer phai co envoyons');

  // 6. acheter -> achète, achetons, achètera
  const acheterForms = new Set(FrenchMorphology.getVerbConjugations('acheter'));
  assert.ok(acheterForms.has('achète'), 'acheter phai co achète');
  assert.ok(acheterForms.has('achetons'), 'acheter phai co achetons');
  assert.ok(acheterForms.has('achètera'), 'acheter phai co achètera');

  // 7. préférer -> préfère, préférons
  const prefererForms = new Set(FrenchMorphology.getVerbConjugations('préférer'));
  assert.ok(prefererForms.has('préfère'), 'préférer phai co préfère');
  assert.ok(prefererForms.has('préférons'), 'préférer phai co préférons');
});

test('M13a: French Morphology Core - Group 2 (-ir avec -iss-)', () => {
  const finirForms = new Set(FrenchMorphology.getVerbConjugations('finir'));
  assert.ok(finirForms.has('finis'), 'finir phai co finis');
  assert.ok(finirForms.has('finit'), 'finir phai co finit');
  assert.ok(finirForms.has('finissons'), 'finir phai co finissons');
  assert.ok(finirForms.has('finissait'), 'finir phai co finissait');
  assert.ok(finirForms.has('fini'), 'finir phai co fini');
  assert.ok(finirForms.has('finira'), 'finir phai co finira');
  assert.ok(finirForms.has('finissant'), 'finir phai co finissant');

  const choisirForms = new Set(FrenchMorphology.getVerbConjugations('choisir'));
  assert.ok(choisirForms.has('choisis'), 'choisir phai co choisis');
  assert.ok(choisirForms.has('choisissons'), 'choisir phai co choisissons');
  assert.ok(choisirForms.has('choisi'), 'choisir phai co choisi');
});

test('M13a: French Morphology Core - Group 3 Core Irregulars & Reflexives', () => {
  // être
  const etreForms = new Set(FrenchMorphology.getVerbConjugations('être'));
  ['suis', 'es', 'est', 'sommes', 'êtes', 'sont', 'étais', 'été', 'serai', 'soit'].forEach(f => {
    assert.ok(etreForms.has(f), `être phai co ${f}`);
  });

  // avoir
  const avoirForms = new Set(FrenchMorphology.getVerbConjugations('avoir'));
  ['ai', 'as', 'a', 'avons', 'avez', 'ont', 'avais', 'eu', 'aurai', 'ait'].forEach(f => {
    assert.ok(avoirForms.has(f), `avoir phai co ${f}`);
  });

  // aller
  const allerForms = new Set(FrenchMorphology.getVerbConjugations('aller'));
  ['vais', 'vas', 'va', 'allons', 'allez', 'vont', 'allé', 'irai', 'irons', 'aille'].forEach(f => {
    assert.ok(allerForms.has(f), `aller phai co ${f}`);
  });

  // faire
  const faireForms = new Set(FrenchMorphology.getVerbConjugations('faire'));
  ['fais', 'fait', 'faisons', 'faites', 'font', 'faisait', 'fera', 'ferons', 'fasse'].forEach(f => {
    assert.ok(faireForms.has(f), `faire phai co ${f}`);
  });

  // savoir
  const savoirForms = new Set(FrenchMorphology.getVerbConjugations('savoir'));
  ['sais', 'sait', 'savons', 'su', 'saurai', 'saurons', 'sache'].forEach(f => {
    assert.ok(savoirForms.has(f), `savoir phai co ${f}`);
  });

  // pouvoir
  const pouvoirForms = new Set(FrenchMorphology.getVerbConjugations('pouvoir'));
  ['peux', 'peut', 'pouvons', 'peuvent', 'pu', 'pourra', 'pourrons', 'puisse'].forEach(f => {
    assert.ok(pouvoirForms.has(f), `pouvoir phai co ${f}`);
  });

  // vouloir
  const vouloirForms = new Set(FrenchMorphology.getVerbConjugations('vouloir'));
  ['veux', 'veut', 'voulons', 'voulu', 'voudra', 'voudrons', 'veuille'].forEach(f => {
    assert.ok(vouloirForms.has(f), `vouloir phai co ${f}`);
  });

  // devoir
  const devoirForms = new Set(FrenchMorphology.getVerbConjugations('devoir'));
  ['dois', 'doit', 'devons', 'dû', 'devra', 'doive'].forEach(f => {
    assert.ok(devoirForms.has(f), `devoir phai co ${f}`);
  });

  // Reflexive verb normalization: se balader
  const baladerForms = new Set(FrenchMorphology.getVerbConjugations('se balader'));
  assert.ok(baladerForms.has('balade'), 'se balader phai co balade');
  assert.ok(baladerForms.has('baladons'), 'se balader phai co baladons');
  assert.ok(baladerForms.has('baladé'), 'se balader phai co baladé');
});

test('M13a: French Morphology Core - Prefix Derivations', () => {
  // prendre -> comprendre, apprendre, surprendre
  const comprendreForms = new Set(FrenchMorphology.getVerbConjugations('comprendre'));
  assert.ok(comprendreForms.has('comprends'), 'comprendre phai co comprends');
  assert.ok(comprendreForms.has('compris'), 'comprendre phai co compris');
  assert.ok(comprendreForms.has('comprendra'), 'comprendre phai co comprendra');

  const apprendreForms = new Set(FrenchMorphology.getVerbConjugations('apprendre'));
  assert.ok(apprendreForms.has('apprends'), 'apprendre phai co apprends');
  assert.ok(apprendreForms.has('appris'), 'apprendre phai co appris');

  // venir -> devenir, revenir
  const devenirForms = new Set(FrenchMorphology.getVerbConjugations('devenir'));
  assert.ok(devenirForms.has('deviens'), 'devenir phai co deviens');
  assert.ok(devenirForms.has('devient'), 'devenir phai co devient');
  assert.ok(devenirForms.has('devenu'), 'devenir phai co devenu');
  assert.ok(devenirForms.has('deviendra'), 'devenir phai co deviendra');

  // mettre -> permettre, promettre
  const permettreForms = new Set(FrenchMorphology.getVerbConjugations('permettre'));
  assert.ok(permettreForms.has('permets'), 'permettre phai co permets');
  assert.ok(permettreForms.has('permet'), 'permettre phai co permet');
  assert.ok(permettreForms.has('permis'), 'permettre phai co permis');
  assert.ok(permettreForms.has('permettra'), 'permettre phai co permettra');

  // voir -> revoir, prévoir
  const revoirForms = new Set(FrenchMorphology.getVerbConjugations('revoir'));
  assert.ok(revoirForms.has('revois'), 'revoir phai co revois');
  assert.ok(revoirForms.has('revu'), 'revoir phai co revu');
  assert.ok(revoirForms.has('reverra'), 'revoir phai co reverra');

  // ouvrir -> découvrir
  const decouvrirForms = new Set(FrenchMorphology.getVerbConjugations('découvrir'));
  assert.ok(decouvrirForms.has('découvre'), 'découvrir phai co découvre');
  assert.ok(decouvrirForms.has('découvert'), 'découvrir phai co découvert');
  assert.ok(decouvrirForms.has('découvrira'), 'découvrir phai co découvrira');
});

test('M13a: French Morphology Core - Special Verb Families (-dre, -ndre, -uire)', () => {
  // -dre: attendre, répondre
  const attendreForms = new Set(FrenchMorphology.getVerbConjugations('attendre'));
  assert.ok(attendreForms.has('attends'), 'attendre phai co attends');
  assert.ok(attendreForms.has('attend'), 'attendre phai co attend');
  assert.ok(attendreForms.has('attendons'), 'attendre phai co attendons');
  assert.ok(attendreForms.has('attendu'), 'attendre phai co attendu');
  assert.ok(attendreForms.has('attendra'), 'attendre phai co attendra');

  const repondreForms = new Set(FrenchMorphology.getVerbConjugations('répondre'));
  assert.ok(repondreForms.has('réponds'), 'répondre phai co réponds');
  assert.ok(repondreForms.has('répondu'), 'répondre phai co répondu');

  // -ndre: craindre, éteindre
  const craindreForms = new Set(FrenchMorphology.getVerbConjugations('craindre'));
  assert.ok(craindreForms.has('crains'), 'craindre phai co crains');
  assert.ok(craindreForms.has('craint'), 'craindre phai co craint');
  assert.ok(craindreForms.has('craignons'), 'craindre phai co craignons');
  assert.ok(craindreForms.has('craindrai'), 'craindre phai co craindrai');

  const eteindreForms = new Set(FrenchMorphology.getVerbConjugations('éteindre'));
  assert.ok(eteindreForms.has('éteins'), 'éteindre phai co éteins');
  assert.ok(eteindreForms.has('éteint'), 'éteindre phai co éteint');
  assert.ok(eteindreForms.has('éteignons'), 'éteindre phai co éteignons');

  // -uire: conduire, traduire
  const conduireForms = new Set(FrenchMorphology.getVerbConjugations('conduire'));
  assert.ok(conduireForms.has('conduis'), 'conduire phai co conduis');
  assert.ok(conduireForms.has('conduit'), 'conduire phai co conduit');
  assert.ok(conduireForms.has('conduisons'), 'conduire phai co conduisons');
  assert.ok(conduireForms.has('conduira'), 'conduire phai co conduira');
});

test('M13a: French Morphology Core - Reverse Lookup & Homographs', () => {
  // suis -> être and suivre (homograph)
  const suisLemmas = FrenchMorphology.findLemmasForForm('suis');
  assert.ok(suisLemmas.includes('être'), 'suis phai trỏ về être');
  assert.ok(suisLemmas.includes('suivre'), 'suis phai trỏ về suivre');

  // lit -> lire
  const litLemmas = FrenchMorphology.findLemmasForForm('lit');
  assert.ok(litLemmas.includes('lire'), 'lit phai trỏ về lire');

  // pris -> prendre
  const prisLemmas = FrenchMorphology.findLemmasForForm('pris');
  assert.ok(prisLemmas.includes('prendre'), 'pris phai trỏ về prendre');

  // compris -> comprendre
  const comprisLemmas = FrenchMorphology.findLemmasForForm('compris');
  assert.ok(comprisLemmas.includes('comprendre'), 'compris phai trỏ về comprendre');

  // su -> savoir
  const suLemmas = FrenchMorphology.findLemmasForForm('su');
  assert.ok(suLemmas.includes('savoir'), 'su phai trỏ về savoir');

  // pu -> pouvoir
  const puLemmas = FrenchMorphology.findLemmasForForm('pu');
  assert.ok(puLemmas.includes('pouvoir'), 'pu phai trỏ về pouvoir');

  // allé -> aller
  const alleLemmas = FrenchMorphology.findLemmasForForm('allé');
  assert.ok(alleLemmas.includes('aller'), 'allé phai trỏ về aller');
});

test('M13a: Golden Test Suite - 30 Standard French Verbs', () => {
  const goldenVerbs = [
    { inf: 'parler', check: ['parle', 'parlons', 'parlé', 'parlera'] },
    { inf: 'manger', check: ['mange', 'mangeons', 'mangeait', 'mangé'] },
    { inf: 'commencer', check: ['commence', 'commençons', 'commencé'] },
    { inf: 'appeler', check: ['appelle', 'appelons', 'appellera'] },
    { inf: 'payer', check: ['paie', 'paye', 'payons', 'payé'] },
    { inf: 'acheter', check: ['achète', 'achetons', 'acheté'] },
    { inf: 'finir', check: ['finis', 'finit', 'finissons', 'fini'] },
    { inf: 'choisir', check: ['choisis', 'choisit', 'choisi'] },
    { inf: 'être', check: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont', 'été', 'serai'] },
    { inf: 'avoir', check: ['ai', 'as', 'a', 'avons', 'avez', 'ont', 'eu', 'aurai'] },
    { inf: 'aller', check: ['vais', 'va', 'allons', 'vont', 'allé', 'irai'] },
    { inf: 'faire', check: ['fais', 'fait', 'faisons', 'faites', 'font', 'fera'] },
    { inf: 'prendre', check: ['prends', 'prend', 'prenons', 'pris', 'prendra'] },
    { inf: 'comprendre', check: ['comprends', 'compris', 'comprendra'] },
    { inf: 'venir', check: ['viens', 'vient', 'venons', 'venu', 'viendra'] },
    { inf: 'devenir', check: ['deviens', 'devient', 'devenu', 'deviendra'] },
    { inf: 'mettre', check: ['mets', 'met', 'mettons', 'mis', 'mettra'] },
    { inf: 'permettre', check: ['permets', 'permet', 'permis', 'permettra'] },
    { inf: 'savoir', check: ['sais', 'sait', 'savons', 'su', 'saura'] },
    { inf: 'pouvoir', check: ['peux', 'peut', 'pouvons', 'peuvent', 'pu', 'pourra'] },
    { inf: 'vouloir', check: ['veux', 'veut', 'voulons', 'voulu', 'voudra'] },
    { inf: 'devoir', check: ['dois', 'doit', 'devons', 'dû', 'devra'] },
    { inf: 'dire', check: ['dis', 'dit', 'disons', 'dites', 'disent', 'dira'] },
    { inf: 'voir', check: ['vois', 'voit', 'voyons', 'vu', 'verra'] },
    { inf: 'lire', check: ['lis', 'lit', 'lisons', 'lu', 'lira'] },
    { inf: 'écrire', check: ['écris', 'écrit', 'écrivons', 'écrira'] },
    { inf: 'croire', check: ['crois', 'croit', 'croyons', 'cru', 'croira'] },
    { inf: 'attendre', check: ['attends', 'attend', 'attendons', 'attendu'] },
    { inf: 'craindre', check: ['crains', 'craint', 'craignons', 'craint'] },
    { inf: 'conduire', check: ['conduis', 'conduit', 'conduisons', 'conduit'] }
  ];

  goldenVerbs.forEach(g => {
    const forms = new Set(FrenchMorphology.getVerbConjugations(g.inf));
    g.check.forEach(target => {
      assert.ok(forms.has(target), `Động từ ${g.inf} phải sinh ra dạng chia "${target}"`);
    });
  });
});
