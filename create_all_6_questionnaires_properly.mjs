import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env.local file
const envFile = readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const USER_EMAIL = 'ilir.bicja@hape-kosovo.eu';
const USER_PASSWORD = 'Admin123';

async function loginAndGetUserId() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: USER_EMAIL,
    password: USER_PASSWORD
  });

  if (authError) {
    console.error('Login error:', authError.message);
    return null;
  }

  console.log('Successfully logged in as', USER_EMAIL);
  return authData.user.id;
}

async function deleteAllQuestionnaires(userId) {
  console.log('Deleting all existing questionnaires...');
  const { data: forms } = await supabase.from('forms').select('id, title').eq('user_id', userId);

  if (forms && forms.length > 0) {
    console.log(`Found ${forms.length} forms to delete`);
    for (const form of forms) {
      console.log(`  Deleting: ${form.title}`);
      await supabase.from('forms').delete().eq('id', form.id);
    }
  }
  console.log('');
}

// Common options
const suitabilityOptions = {
  choices: [
    { id: '1', label: 'Shumë e përshtatshme' },
    { id: '2', label: 'E përshtatshme' },
    { id: '3', label: 'Disi e përshtatshme' },
    { id: '4', label: 'E papërshtatshme' }
  ]
};

const conditionOptions = {
  choices: [
    { id: '1', label: 'Shkëlqyeshme (moderne, plotësisht funksionale)' },
    { id: '2', label: 'Mirë (me kufizime të vogla)' },
    { id: '3', label: 'Mesatare (defekte të shpeshta, të vjetruara)' },
    { id: '4', label: 'Dobët (kryesisht të papërdorshme ose të pasigurta)' }
  ]
};

const frequencyOptions = {
  choices: [
    { id: '1', label: 'Rrallë' },
    { id: '2', label: 'Herë pas here' },
    { id: '3', label: 'Shpesh' },
    { id: '4', label: 'Pothuajse gjithmonë' }
  ]
};

const timelineOptions = {
  choices: [
    { id: '1', label: 'Afat i shkurtër (6 muaj – 1 vit)' },
    { id: '2', label: 'Afat mesëm (1–2 vite)' },
    { id: '3', label: 'Afat i gjatë (më shumë se 2 vite)' }
  ]
};

const riskOptions = {
  choices: [
    { id: '1', label: 'Rreziqet Operacionale dhe të Mirëmbajtjes (p.sh., vonesa, keqpërdorim)' },
    { id: '2', label: 'Rreziqet e sigurisë (p.sh., trajtimi i pajisjeve të ndjeshme)' },
    { id: '3', label: 'Çështjet e pajtueshmërisë ligjore ose rregullatore (p.sh., kontrollet e eksportit, teknologjia e klasifikuar)' },
    { id: '4', label: 'Rreziqet e Furnitorëve ose Etike (p.sh., konflikte interesi me furnitor, korrupsioni, problemet e furnizimit)' },
    { id: '5', label: 'Tjera' }
  ]
};

const equipmentCategoriesAll = {
  choices: [
    { id: '1', label: 'Pajisje personale mbrojtëse (helmeta, jelekë, mburoja, etj.)' },
    { id: '2', label: 'Armë dhe municion' },
    { id: '3', label: 'Pajisje komunikimi (radio, sisteme mobile, rrjete të sigurta)' },
    { id: '4', label: 'Logjistikë & Automjete (vetura patrullimi, motoçikleta, automjete të blinduara)' },
    { id: '5', label: 'Pajisje për mbikëqyrje dhe monitorim (CCTV, dronë, pajisje për shikim natën)' },
    { id: '6', label: 'Pajisje TIK dhe mjete për forenzikë digjitale' },
    { id: '7', label: 'Pajisje për mbledhjen e provave dhe hetime' },
    { id: '8', label: 'Pajisje për kontrollin e turmave (armë jo-vdekjeprurëse, gaz lotsjellës, etj.)' },
    { id: '9', label: 'Tjera (specifiko)' }
  ]
};

const questionnaires = [
  // 1. DRONE UNIT
  {
    title: 'Pyetësor për Nevojat e Prokurimit - Njësia për Dron dhe Antidron',
    description: 'Vlerësim gjithëpërfshirës i nevojave për pajisje të Njësisë për Dron dhe Antidron, Drejtoria e Njësive Ajrore, Departamenti i Njësive Speciale.\n\nQëllimi: Vlerësimi i nevojave ekzistuese për pajisje që lidhen me operacionet ajrore, mbikëqyrjen, ISR (Intelligence, Surveillance, Reconnaissance), dhe mbrojtjen kundër dronëve të paautorizuar.\n\nMOHIM PËRGJEGJËSIE: Çdo mbështetje ose prokurim i mundshëm përmes projektit HAPE është i kushtëzuar nga heqja e sanksioneve nga BE ndaj Kosovës dhe brenda kufijve të financimit të projektit.',
    questions: [
      { type: 'short_text', title: 'Emri i zyrtarit', required: true, order_index: 1 },
      { type: 'short_text', title: 'Grada/Pozita', required: true, order_index: 2 },
      { type: 'short_text', title: 'Departamenti/Njësia', required: true, order_index: 3 },
      { type: 'date_time', title: 'Data e vlerësimit', options: { dateType: 'date' }, required: true, order_index: 4 },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: suitabilityOptions,
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj? (Zgjidhni të gjitha që aplikohen)',
        options: equipmentCategoriesAll,
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: conditionOptions,
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: frequencyOptions,
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        description: 'Listoni pajisjet specifike që mungojnë (p.sh., dronë me kamera të avancuara, monitorë, kartela SD të enkriptuara)',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme?',
        description: 'Renditni 5 pajisjet më të rëndësishme (p.sh., Drone, Antidrone, Kartela të enkriptuara)',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 1: Dronë - Specifikimet e Detajuara',
        description: 'Emri: _______________\nQëllimi (p.sh., Vëzhgimi, ISR, Mbikëqyrje në kohë reale): _______________\nSpecifikimet e kërkuara (p.sh., DJI Matrice 4TD me shikim termal): _______________\nKosto e parashikuar (Euro): _______________\nSasia e nevojshme: _______________',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 2: Antidrone - Specifikimet e Detajuara',
        description: 'Emri: _______________\nQëllimi (p.sh., Mbrojtje kundër dronëve të paautorizuar): _______________\nSpecifikimet e kërkuara (p.sh., Antidron taktik dore): _______________\nKosto e parashikuar (Euro): _______________\nSasia e nevojshme: _______________',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 3: Kartela SD të Enkriptuara - Specifikimet e Detajuara',
        description: 'Emri: _______________\nQëllimi (p.sh., Enkriptim të video-imazheve në dron): _______________\nSpecifikimet e kërkuara: _______________\nKosto e parashikuar (Euro): _______________\nSasia e nevojshme: _______________',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 4: Pajisje Shtesë (nëse aplikohet)',
        description: 'Emri: _______________\nQëllimi: _______________\nSpecifikimet e kërkuara: _______________\nKosto e parashikuar (Euro): _______________\nSasia e nevojshme: _______________',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin operacional?',
        description: 'Përshkruani ndikimin në: kohë reagimi, mbledhje prove, mbrojtje personale, mbledhje inteligjence, etj.',
        required: true,
        order_index: 15
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: timelineOptions,
        required: true,
        order_index: 16
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: riskOptions,
        required: true,
        order_index: 17
      },
      {
        type: 'long_text',
        title: 'Trajnimi dhe Ngritja e Kapaciteteve',
        description: 'A ka nevojë departamenti juaj për trajnim të specializuar? (p.sh., Trajnime për Antidron, Trajnime për Operator/Pilot)',
        required: false,
        order_index: 18
      },
      {
        type: 'long_text',
        title: 'Komente ose Informacion Shtesë',
        required: false,
        order_index: 19
      }
    ]
  },

  // 2. SVMT-DMVH (Surveillance & Technical Support)
  {
    title: 'Pyetësor për Nevojat e Prokurimit - Sektori i Vëzhgimit dhe Mbështetjes Teknike (SVMT)',
    description: 'Vlerësim gjithëpërfshirës i nevojave për pajisje të Sektorit të Vëzhgimit dhe Mbështetjes Teknike, DMH-DMVH-SVMT.\n\nQëllimi: Vlerësimi i nevojave për pajisje për operacione të fshehta, vëzhgim, monitorim audio/video, dhe gjurmim GPS.\n\nMOHIM PËRGJEGJËSIE: Çdo mbështetje ose prokurim i mundshëm përmes projektit HAPE është i kushtëzuar nga heqja e sanksioneve nga BE ndaj Kosovës.',
    questions: [
      { type: 'short_text', title: 'Emri i zyrtarit', required: true, order_index: 1 },
      { type: 'short_text', title: 'Grada/Pozita', required: true, order_index: 2 },
      { type: 'short_text', title: 'Departamenti/Njësia', required: true, order_index: 3 },
      { type: 'date_time', title: 'Data e vlerësimit', options: { dateType: 'date' }, required: true, order_index: 4 },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: suitabilityOptions,
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: equipmentCategoriesAll,
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: conditionOptions,
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: frequencyOptions,
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        description: 'Listoni pajisjet (p.sh., Dronë, Kamera të fshehta, Pajisje GPS, Pajisje audio)',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme?',
        description: 'Renditni 5-7 pajisjet më të rëndësishme',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 1: Pajisjet Audio dhe GPS (për vetura)',
        description: 'Qëllimi: Monitorim i fshehtë i bisedave dhe lokacionit në automjete\nSpecifikimet: Sistem i kompletuar (server, pajisje fundore, lidhje internet)\nKosto e parashikuar: _____ Euro\nSasia: Serveri + minimum 50 pajisje për instalim në automjete',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 2: Pajisjet Video dhe Audio të Fshehta',
        description: 'Qëllimi: Monitorim audio/video në lokacione të ndryshme\nSpecifikimet: Cilësi video/audio të lartë, kapacitet ruajtjeje i madh, transfer përmes internetit\nKosto e parashikuar: _____ Euro\nSasia: Serveri + minimum 10 pajisje fundore',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 3: Dronë për Vëzhgim',
        description: 'Qëllimi: Vëzhgim\nSpecifikimet: Min. 50 min fluturim, kamera me optical zoom dhe termale, min. 50 megapiksel, 3 bateri\nKosto e parashikuar: _____ Euro\nSasia: _____ Dronë',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 4: Fotoaparate Profesionale',
        description: 'Qëllimi: Fotografi profesionale për vëzhgim\nSpecifikimet: Rezolucion i lartë, optical zoom i madh\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 5: Pajisje për Hapjen e Dyerve',
        description: 'Qëllimi: Hapje dyerash/veturash pa çelësa\nSpecifikimet: M-Scan, skaner ultrasonik për lexim bravash\nKosto e parashikuar: _____ Euro\nSasia: 1 skaner me pajisjet përcjellëse',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 6: Pajisje për Hapjen e Veturave (Silent Key)',
        description: 'Qëllimi: Hapje veturash dhe ndalje alarmesh\nSpecifikimet: Silent key - skanim dhe kopjim kodi i çelësit origjinal\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 16
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 7: Kamera në Forma të Ndryshme (të fshehta)',
        description: 'Qëllimi: Monitorim në vende publike\nSpecifikimet: Kamera në forma çelësi veture, cigareve elektronike VAPE, pajisje audio në forma kartele bankare\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 17
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin operacional?',
        description: 'Përshkruani ndikimin në operacionet tuaja',
        required: true,
        order_index: 18
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: timelineOptions,
        required: true,
        order_index: 19
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: riskOptions,
        required: true,
        order_index: 20
      },
      {
        type: 'long_text',
        title: 'Trajnimi dhe Ngritja e Kapaciteteve',
        description: 'Listoni trajnimet e nevojshme',
        required: false,
        order_index: 21
      },
      {
        type: 'long_text',
        title: 'Komente ose Informacion Shtesë',
        required: false,
        order_index: 22
      }
    ]
  },

  // 3. DTK - Crime Scene Investigation
  {
    title: 'Pyetësor për Nevojat e Prokurimit - Sektori për Hetimin e Vendit të Ngjarjes (DTK)',
    description: 'Vlerësim gjithëpërfshirës i nevojave për pajisje të Sektorit për Hetimin e Vendit të Ngjarjes, Drejtoria e Teknikës Kriminalistike.\n\nQëllimi: Vlerësimi i nevojave për pajisje forenzike për zbulimin, dokumentimin dhe analizën e vendit të ngjarjes.\n\nMOHIM PËRGJEGJËSIE: Çdo mbështetje ose prokurim i mundshëm përmes projektit HAPE është i kushtëzuar nga heqja e sanksioneve nga BE ndaj Kosovës.',
    questions: [
      { type: 'short_text', title: 'Emri i zyrtarit', required: true, order_index: 1 },
      { type: 'short_text', title: 'Grada/Pozita', required: true, order_index: 2 },
      { type: 'short_text', title: 'Departamenti/Njësia', required: true, order_index: 3 },
      { type: 'date_time', title: 'Data e vlerësimit', options: { dateType: 'date' }, required: true, order_index: 4 },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: suitabilityOptions,
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: equipmentCategoriesAll,
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: conditionOptions,
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: frequencyOptions,
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        description: 'Listoni pajisjet (p.sh., Forenscope Tablet, Faro Blink 3D, Laptop, GoPro, Reflektorë)',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme?',
        description: 'Renditni 5 pajisjet më të rëndësishme',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 1: Forenscope Mobile Multispectral Forensic Tablet',
        description: 'Qëllimi: Zbulimi dhe dokumentimi i gjurmëve të gishtërinjve në vendin e ngjarjes\nSpecifikimet: Modeli më i avancuar për pamje dhe mundësi më të mira\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 2: Faro Blink (Skanimi 3D i vendit të ngjarjes)',
        description: 'Qëllimi: Skanim 3D për dokumentim të shkëlqyeshëm të vendit të ngjarjes\nSpecifikimet: Modeli i fundit për mundësi më të mira skanimi\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 3: Laptop për Faro 3D',
        description: 'Qëllimi: Instalimi i pajisjes Faro 3D\nSpecifikimet: Madhësia 17", RAM 32GB, 500GB SSD\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 4: Kamera GoPro (11/12)',
        description: 'Qëllimi: Incizimi i vendit të ngjarjes në vende me rrezik të lartë, dokumentim i të gjitha veprimeve\nSpecifikimet: Gjenerata 11 ose 12\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 5: Reflektorë Dorë dhe Trupi',
        description: 'Qëllimi: Ndriçimi i vendit të ngjarjes për kërkimin e gjurmëve dhe dokumentim\nSpecifikimet: _____\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin operacional?',
        description: 'Përshkruani ndikimin në mbledhjen e provave dhe dokumentimin',
        required: true,
        order_index: 16
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: timelineOptions,
        required: true,
        order_index: 17
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: riskOptions,
        required: true,
        order_index: 18
      },
      {
        type: 'long_text',
        title: 'Trajnimi dhe Ngritja e Kapaciteteve',
        description: 'A ka nevojë për trajnim? (p.sh., Trajnim për skanerin 3D, Trajnim për Forenscope)',
        required: false,
        order_index: 19
      },
      {
        type: 'long_text',
        title: 'Komente ose Informacion Shtesë',
        required: false,
        order_index: 20
      }
    ]
  },

  // 4. Criminal Registry Sector
  {
    title: 'Pyetësor për Nevojat e Prokurimit - Sektori për Regjistrim Kriminalistik',
    description: 'Vlerësim gjithëpërfshirës i nevojave për pajisje të Sektorit për Regjistrim Kriminalistik, Drejtoria e Teknikës Kriminalistike.\n\nQëllimi: Vlerësimi i nevojave për pajisje biometrike, sisteme daktiloskopimi, dhe pajisje për identifikim.\n\nMOHIM PËRGJEGJËSIE: Çdo mbështetje ose prokurim i mundshëm përmes projektit HAPE është i kushtëzuar nga heqja e sanksioneve nga BE ndaj Kosovës.',
    questions: [
      { type: 'short_text', title: 'Emri i zyrtarit', required: true, order_index: 1 },
      { type: 'short_text', title: 'Grada/Pozita', required: true, order_index: 2 },
      { type: 'short_text', title: 'Departamenti/Njësia', required: true, order_index: 3 },
      { type: 'date_time', title: 'Data e vlerësimit', options: { dateType: 'date' }, required: true, order_index: 4 },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: suitabilityOptions,
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: { choices: [
          { id: '1', label: 'Pajisje TIK dhe mjete për forenzikë digjitale' },
          { id: '2', label: 'Pajisje biometrike dhe daktiloskopimi' },
          { id: '3', label: 'Monitorë dhe ekrane' },
          { id: '4', label: 'Kompjuterë dhe laptopë' },
          { id: '5', label: 'Fotokamera digjitale' },
          { id: '6', label: 'Tjera (specifiko)' }
        ]},
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: conditionOptions,
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: frequencyOptions,
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        description: 'Listoni pajisjet (p.sh., Monitorë, Laptop, Projektor, PC, Fotokamera, Live Scan, Kit daktiloskopimi)',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme?',
        description: 'Renditni 5 pajisjet më të rëndësishme',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 1: Konfigurime me Shumë Ekrane',
        description: 'Qëllimi: Lehtësimi i punës së ekzaminuesit të gjurmëve të gishtave, krahasim më i saktë\nSpecifikimet: Madhësia 34-43 inç, Rezolucioni 4K UHD (3840×2160)\nKosto e parashikuar: _____ Euro (total për 20 copë)\nSasia: 20 copë',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 2: Skaner Live Scan (CABIS 7.0)',
        description: 'Qëllimi: Daktiloskopim digjital, integruar me sistemin CABIS 7.0\nSpecifikimet: Kompatibilitet i plotë me CABIS 7.0, skanim optik digjital (Flat platen, rolling & Slap), Rezolucioni min. 500 ppi (FBI/EBTS), Format NIST ITL 1-2007\nKosto e parashikuar: 8,000 Euro për copë\nSasia: 20 copë',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 3: Laptop',
        description: 'Qëllimi: Përdorim në terren, mbështetje trajnimesh, prezantime në gjykatë\nSpecifikimet: Dell Inspiron 15 3000 Business, 15.6" FHD, Intel Core i7-1255U, Windows 11 Pro, 32GB DDR4 RAM, 1TB PCIe SSD\nKosto e parashikuar: 1,000 Euro\nSasia: 1 copë',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 4: Kompjuter PC për Terminalet SPIS',
        description: 'Qëllimi: Zëvendësim i kompjuterëve të vjetëruar në terminalet SPIS dhe njësitë e Teknikës Kriminalistike\nSpecifikimet: Dell Tower Plus Desktop, Intel Core Ultra 5 225 (10-Core), 16GB DDR5 RAM, 512GB M.2 PCIe NVMe SSD\nKosto e parashikuar: 17,960 Euro (total për 20 copë)\nSasia: 20 copë',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 5: Fotokamera Digjitale me Aksesorë',
        description: 'Qëllimi: Fotografi në qendrat e ndalimit dhe njësitë e Teknikës Kriminalistike\nSpecifikimet: Senzori 24 Mpix CMOS, ISO 100-6400, Zum optik 1.5X, Rezolucioni max 4272×2848 px, Video 1280×720 px, Kartel MMC/SD, Bateri Li-Ion, USB/HDMI, Tripod Manfrotto Befree Advanced\nKosto e parashikuar: 18,000 Euro (total për 20 copë)\nSasia: 20 copë',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin operacional?',
        description: 'Përshkruani ndikimin në punën tuaj profesionale dhe performancën institucionale',
        required: true,
        order_index: 16
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: timelineOptions,
        required: true,
        order_index: 17
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: riskOptions,
        required: true,
        order_index: 18
      },
      {
        type: 'long_text',
        title: 'Trajnimi dhe Ngritja e Kapaciteteve',
        description: 'Listoni trajnimet (p.sh., Biometria e fytyrës, Fotografi kriminalistike, Identikit, Makroskop, Latent Fingerprint Comparison, Trajnim për nxitjen e gjurmëve latente)',
        required: false,
        order_index: 19
      },
      {
        type: 'long_text',
        title: 'Komente ose Informacion Shtesë',
        required: false,
        order_index: 20
      }
    ]
  },

  // 5. Digital Forensics
  {
    title: 'Pyetësor për Nevojat e Prokurimit - Sektori i Forenzikës Digjitale',
    description: 'Vlerësim gjithëpërfshirës i nevojave për pajisje të Sektorit për Fotografi, Video Analizë dhe Ekzaminime të TI-së, Drejtoria e Teknikës Kriminalistike.\n\nQëllimi: Vlerësimi i nevojave për pajisje dhe softuer për forenzikë digjitale, mobile forensics, video analizë forenzike, dhe ruajtje të të dhënave.\n\nMOHIM PËRGJEGJËSIE: Çdo mbështetje ose prokurim i mundshëm përmes projektit HAPE është i kushtëzuar nga heqja e sanksioneve nga BE ndaj Kosovës.',
    questions: [
      { type: 'short_text', title: 'Emri i zyrtarit', required: true, order_index: 1 },
      { type: 'short_text', title: 'Grada/Pozita', required: true, order_index: 2 },
      { type: 'short_text', title: 'Departamenti/Njësia', required: true, order_index: 3 },
      { type: 'date_time', title: 'Data e vlerësimit', options: { dateType: 'date' }, required: true, order_index: 4 },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: suitabilityOptions,
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: equipmentCategoriesAll,
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: conditionOptions,
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: frequencyOptions,
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        description: 'Listoni pajisjet (p.sh., PC, ThinkPad P16 Gen 2, Grey Key, TALINO workstations)',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme?',
        description: 'Renditni pajisjet më të rëndësishme',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 1: GrayKey - Mobile Forensics',
        description: 'Qëllimi: Harduer dhe softuer për të hyrë në iPhone dhe pajisje të tjera mobile për analizë forenzike\nSpecifikimet: GrayKey sistem për mobile forensics, analizë ligjore e të dhënave\nKosto e parashikuar: 100,000 Euro\nSasia: 1 (një)',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 2: TALINO KA-301 Forensic Workstation',
        description: 'Qëllimi: Workstation i specializuar për forenzikë digjitale, ekzaminime të pajisjeve elektronike, përpunim të dhënash provuese\nSpecifikimet: Sistem komplet për forenzikë digjitale\nKosto e parashikuar: 50,000 Euro\nSasia: 2 copë',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 3: TALINO KA-VIZ - Forensic Video Analysis Workstation',
        description: 'Qëllimi: Workstation i specializuar për video analizë forenzike, përpunim të dhënash video provuese\nSpecifikimet: Sistem komplet për video analizë forenzike\nKosto e parashikuar: 50,000 Euro\nSasia: 2 copë',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 4: TALINO KA-Ultra - 700TB Storage',
        description: 'Qëllimi: Server/pajisje për ruajtjen e të dhënave me kapacitet shumë të madh\nSpecifikimet: ~704TB hapësirë raw storage, desk-mounted server\nKosto e parashikuar: 20,000 Euro\nSasia: 1 copë',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 5: Pajisje Shtesë (nëse aplikohet)',
        description: 'Përshkruani pajisje shtesë të nevojshme',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin operacional?',
        description: 'Përshkruani: Përshpejtim hetimesh, mbledhje/ruajtje prove, kapacitete forenzike, mbrojtje prove, bashkëpunim ndër-institucional',
        required: true,
        order_index: 16
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: timelineOptions,
        required: true,
        order_index: 17
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: riskOptions,
        required: true,
        order_index: 18
      },
      {
        type: 'long_text',
        title: 'Trajnimi dhe Ngritja e Kapaciteteve',
        description: 'Listoni certifikimet e nevojshme (p.sh., Grey Key Certification, MSAB XRY Certification, MAGNET AXIOM Certification, Forensic Video Analysis)',
        required: false,
        order_index: 19
      },
      {
        type: 'long_text',
        title: 'Komente ose Informacion Shtesë',
        required: false,
        order_index: 20
      }
    ]
  },

  // 6. DIA - Intelligence & Analytics
  {
    title: 'Pyetësor për Nevojat e Prokurimit - Sektori për Vlerësime dhe Analiza (DIA)',
    description: 'Vlerësim gjithëpërfshirës i nevojave për pajisje të Sektorit për Vlerësime dhe Analiza, Departamenti i Inteligjencës dhe Analizave.\n\nQëllimi: Vlerësimi i nevojave për infrastrukturë rrjeti, servera, pajisje sigurie, workstations, dhe softuer për analizë të dhënash.\n\nMOHIM PËRGJEGJËSIE: Çdo mbështetje ose prokurim i mundshëm përmes projektit HAPE është i kushtëzuar nga heqja e sanksioneve nga BE ndaj Kosovës.',
    questions: [
      { type: 'short_text', title: 'Emri i zyrtarit', required: true, order_index: 1 },
      { type: 'short_text', title: 'Grada/Pozita', required: true, order_index: 2 },
      { type: 'short_text', title: 'Departamenti/Njësia', required: true, order_index: 3 },
      { type: 'date_time', title: 'Data e vlerësimit', options: { dateType: 'date' }, required: true, order_index: 4 },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: suitabilityOptions,
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: equipmentCategoriesAll,
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: conditionOptions,
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: frequencyOptions,
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        description: 'Listoni pajisjet (p.sh., Workstations, Monitorë, Disqe të enkriptuara, Firewall, Switch-e, Router, Dronë, Kamera IP)',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme?',
        description: 'Renditni 5 pajisjet më të rëndësishme (p.sh., Infrastruktura LAN, Serverat, Firewall/Router/Switch, Workstations, Kamera IP)',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 1: Infrastruktura LAN (Rrjeti i brendshëm i DIA-s)',
        description: 'Qëllimi: Pajisje për qasje dhe siguri të rrjetit. Rrjeti duhet të jetë i izoluar, i monitoruar dhe i mbrojtur.\nSpecifikimet: _____\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 2: Serverat e rrjetit të brendshëm të DIA-s',
        description: 'Qëllimi: Pajisje për menaxhim dhe ruajtje të të dhënave\nSpecifikimet: _____\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 3: Firewall, Router dhe Switch',
        description: 'Qëllimi: Rrjeti duhet të jetë i izoluar, i monitoruar dhe i mbrojtur\nSpecifikimet: _____\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 4: Workstation-e të fuqishme',
        description: 'Qëllimi: Pajisje për analizë dhe vizualizim të të dhënave\nSpecifikimet: _____\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'ARTIKULLI 5: Kamera sigurie IP dhe regjistrues NVR',
        description: 'Qëllimi: Pajisje për siguri fizike dhe kontroll aksesesh\nSpecifikimet: _____\nKosto e parashikuar: _____ Euro\nSasia: _____',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin operacional?',
        description: 'Përshkruani ndikimin në operacionet tuaja',
        required: true,
        order_index: 16
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: timelineOptions,
        required: true,
        order_index: 17
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: riskOptions,
        required: true,
        order_index: 18
      },
      {
        type: 'long_text',
        title: 'Nevoja për Softuer dhe Sistemet',
        description: 'Listoni softueret e nevojshëm (p.sh., Face Recognition Software, OSINT/social media monitoring, GIS/hartografi krimi, sisteme integrimi bazash të dhënash, softuer për analizën e të dhënave nga telefonat)',
        required: false,
        order_index: 19
      },
      {
        type: 'long_text',
        title: 'Komente ose Informacion Shtesë',
        required: false,
        order_index: 20
      }
    ]
  }
];

async function createAllQuestionnaires() {
  console.log('\n========================================');
  console.log('  CREATING ALL 6 QUESTIONNAIRES');
  console.log('  WITH PROPER ALBANIAN PARSING');
  console.log('========================================\n');

  const userId = await loginAndGetUserId();
  if (!userId) {
    console.error('Could not log in. Exiting.');
    return;
  }

  console.log(`User ID: ${userId}\n`);

  await deleteAllQuestionnaires(userId);

  console.log(`Creating ${questionnaires.length} questionnaires...\n`);

  for (let i = 0; i < questionnaires.length; i++) {
    const q = questionnaires[i];
    console.log(`[${i + 1}/${questionnaires.length}] Creating: ${q.title}`);

    try {
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          title: q.title,
          description: q.description,
          user_id: userId,
          is_published: true,
          schema_json: {}
        })
        .select()
        .single();

      if (formError) {
        console.error(`  ✗ Error creating form: ${formError.message}`);
        continue;
      }

      console.log(`  Form ID: ${form.id}`);

      let successCount = 0;
      for (const question of q.questions) {
        const { error: questionError } = await supabase
          .from('questions')
          .insert({
            form_id: form.id,
            type: question.type,
            title: question.title,
            description: question.description || null,
            options: question.options || null,
            required: question.required,
            order_index: question.order_index
          });

        if (questionError) {
          console.error(`    ✗ Question error: ${questionError.message}`);
        } else {
          successCount++;
        }
      }

      console.log(`  ✓ Created ${successCount}/${q.questions.length} questions\n`);
    } catch (error) {
      console.error(`  ✗ Unexpected error: ${error.message}\n`);
    }
  }

  console.log('========================================');
  console.log('  ✓ ALL 6 QUESTIONNAIRES CREATED!');
  console.log('========================================\n');
}

createAllQuestionnaires().catch(console.error);
