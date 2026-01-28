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
  console.error('Missing Supabase credentials. Please check your .env.local file');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseAnonKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const USER_EMAIL = 'ilir.bicja@hape-kosovo.eu';
const USER_PASSWORD = 'Admin123';

async function loginAndGetUserId() {
  // Sign in as the user
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

const questionnaires = [
  {
    title: 'Pyetësor për Pajisje - Njësia për Dron dhe Antidron',
    description: 'Vlerësim i nevojave për pajisje të Njësisë për Dron dhe Antidron (Drejtoria e Njësive Ajrore)',
    department: 'Departamenti i Njësive Speciale / Drejtoria e Njësive Ajrore',
    official: 'Muhamet Rushiti',
    date: '27.10.2025',
    questions: [
      {
        type: 'short_text',
        title: 'Emri i zyrtarit',
        required: true,
        order_index: 1
      },
      {
        type: 'short_text',
        title: 'Grada/Pozita',
        required: true,
        order_index: 2
      },
      {
        type: 'short_text',
        title: 'Departamenti/Njësia',
        required: true,
        order_index: 3
      },
      {
        type: 'short_text',
        title: 'Data e vlerësimit',
        required: true,
        order_index: 4
      },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: {
          choices: [
            'Shumë e përshtatshme',
            'E përshtatshme',
            'Disi e përshtatshme',
            'E papërshtatshme'
          ]
        },
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: {
          choices: [
            'Pajisje personale mbrojtëse (helmeta, jelekë, mburoja, etj.)',
            'Armë dhe municion',
            'Pajisje komunikimi (radio, sisteme mobile, rrjete të sigurta)',
            'Logjistikë & Automjete (vetura patrullimi, motoçikleta, automjete të blinduara)',
            'Pajisje për mbikëqyrje dhe monitorim (CCTV, dronë, pajisje për shikim natën)',
            'Pajisje TIK dhe mjete për forenzikë digjitale',
            'Pajisje për mbledhjen e provave dhe hetime',
            'Pajisje për kontrollin e turmave (armë jo-vdekjeprurëse, gaz lotsjellës, etj.)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: {
          choices: [
            'Shkëlqyeshme (moderne, plotësisht funksionale)',
            'Mirë (me kufizime të vogla)',
            'Mesatare (defekte të shpeshta, të vjetruara)',
            'Dobët (kryesisht të papërdorshme ose të pasigurta)'
          ]
        },
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: {
          choices: [
            'Rrallë',
            'Herë pas here',
            'Shpesh',
            'Pothuajse gjithmonë'
          ]
        },
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Duke parë përpara, cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme? (Renditni 5 më të rëndësishmet)',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'Artikulli 1: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'Artikulli 2: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'Artikulli 3: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'Artikulli 4: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'Artikulli 5: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin dhe operacionet e departamentit tuaj?',
        required: true,
        order_index: 16
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: {
          choices: [
            'Afat i shkurtër (6 muaj – 1 vit)',
            'Afat mesëm (1–2 vite)',
            'Afat i gjatë (më shumë se 2 vite)'
          ]
        },
        required: true,
        order_index: 17
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: {
          choices: [
            'Rreziqet Operacionale dhe të Mirëmbajtjes (p.sh., vonesa, keqpërdorim)',
            'Rreziqet e sigurisë (p.sh., trajtimi i pajisjeve të ndjeshme)',
            'Çështjet e pajtueshmërisë ligjore ose rregullatore (p.sh., kontrollet e eksportit, teknologjia e klasifikuar)',
            'Rreziqet e Furnitorëve ose Etike (p.sh., konflikte interesi me furnitor, korrupsioni, problemet e furnizimit)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 18
      },
      {
        type: 'long_text',
        title: 'A ka nevojë departamenti juaj për trajnim të specializuar ose ngritje të kapaciteteve?',
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
  {
    title: 'Pyetësor për Pajisje - Sektori i Vëzhgimit dhe Mbështetjes Teknike (SVMT-DMVH)',
    description: 'Vlerësim i nevojave për pajisje të Sektorit të Vëzhgimit dhe Mbështetjes Teknike',
    department: 'DMH-DMVH-SVMT',
    official: 'Halil Morina',
    date: '29.10.2025',
    questions: [
      {
        type: 'short_text',
        title: 'Emri i zyrtarit',
        required: true,
        order_index: 1
      },
      {
        type: 'short_text',
        title: 'Grada/Pozita',
        required: true,
        order_index: 2
      },
      {
        type: 'short_text',
        title: 'Departamenti/Njësia',
        required: true,
        order_index: 3
      },
      {
        type: 'short_text',
        title: 'Data e vlerësimit',
        required: true,
        order_index: 4
      },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: {
          choices: [
            'Shumë e përshtatshme',
            'E përshtatshme',
            'Disi e përshtatshme',
            'E papërshtatshme'
          ]
        },
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: {
          choices: [
            'Pajisje personale mbrojtëse (helmeta, jelekë, mburoja, etj.)',
            'Armë dhe municion',
            'Pajisje komunikimi (radio, sisteme mobile, rrjete të sigurta)',
            'Logjistikë & Automjete (vetura patrullimi, motoçikleta, automjete të blinduara)',
            'Pajisje për mbikëqyrje dhe monitorim (CCTV, dronë, pajisje për shikim natën)',
            'Pajisje TIK dhe mjete për forenzikë digjitale',
            'Pajisje për mbledhjen e provave dhe hetime',
            'Pajisje për kontrollin e turmave (armë jo-vdekjeprurëse, gaz lotsjellës, etj.)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: {
          choices: [
            'Shkëlqyeshme (moderne, plotësisht funksionale)',
            'Mirë (me kufizime të vogla)',
            'Mesatare (defekte të shpeshta, të vjetruara)',
            'Dobët (kryesisht të papërdorshme ose të pasigurta)'
          ]
        },
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: {
          choices: [
            'Rrallë',
            'Herë pas here',
            'Shpesh',
            'Pothuajse gjithmonë'
          ]
        },
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Duke parë përpara, cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme? (Renditni 5 më të rëndësishmet)',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'Artikulli 1: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'Artikulli 2: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'Artikulli 3: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'Artikulli 4: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'Artikulli 5: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'Artikulli 6: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 16
      },
      {
        type: 'long_text',
        title: 'Artikulli 7: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 17
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin dhe operacionet e departamentit tuaj?',
        required: true,
        order_index: 18
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: {
          choices: [
            'Afat i shkurtër (6 muaj – 1 vit)',
            'Afat mesëm (1–2 vite)',
            'Afat i gjatë (më shumë se 2 vite)'
          ]
        },
        required: true,
        order_index: 19
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: {
          choices: [
            'Rreziqet Operacionale dhe të Mirëmbajtjes (p.sh., vonesa, keqpërdorim)',
            'Rreziqet e sigurisë (p.sh., trajtimi i pajisjeve të ndjeshme)',
            'Çështjet e pajtueshmërisë ligjore ose rregullatore (p.sh., kontrollet e eksportit, teknologjia e klasifikuar)',
            'Rreziqet e Furnitorëve ose Etike (p.sh., konflikte interesi me furnitor, korrupsioni, problemet e furnizimit)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 20
      },
      {
        type: 'long_text',
        title: 'A ka nevojë departamenti juaj për trajnim të specializuar ose ngritje të kapaciteteve?',
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
  {
    title: 'Pyetësor për Pajisje - Sektori për Hetimin e Vendit të Ngjarjes (DTK)',
    description: 'Vlerësim i nevojave për pajisje të Sektorit për Hetimin e Vendit të Ngjarjes',
    department: 'DTK',
    official: 'Fehmi Aliu',
    date: '30.10.2025',
    questions: [
      {
        type: 'short_text',
        title: 'Emri i zyrtarit',
        required: true,
        order_index: 1
      },
      {
        type: 'short_text',
        title: 'Grada/Pozita',
        required: true,
        order_index: 2
      },
      {
        type: 'short_text',
        title: 'Departamenti/Njësia',
        required: true,
        order_index: 3
      },
      {
        type: 'short_text',
        title: 'Data e vlerësimit',
        required: true,
        order_index: 4
      },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: {
          choices: [
            'Shumë e përshtatshme',
            'E përshtatshme',
            'Disi e përshtatshme',
            'E papërshtatshme'
          ]
        },
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: {
          choices: [
            'Pajisje personale mbrojtëse (helmeta, jelekë, mburoja, etj.)',
            'Armë dhe municion',
            'Pajisje komunikimi (radio, sisteme mobile, rrjete të sigurta)',
            'Logjistikë & Automjete (vetura patrullimi, motoçikleta, automjete të blinduara)',
            'Pajisje për mbikëqyrje dhe monitorim (CCTV, dronë, pajisje për shikim natën)',
            'Pajisje TIK dhe mjete për forenzikë digjitale',
            'Pajisje për mbledhjen e provave dhe hetime',
            'Pajisje për kontrollin e turmave (armë jo-vdekjeprurëse, gaz lotsjellës, etj.)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: {
          choices: [
            'Shkëlqyeshme (moderne, plotësisht funksionale)',
            'Mirë (me kufizime të vogla)',
            'Mesatare (defekte të shpeshta, të vjetruara)',
            'Dobët (kryesisht të papërdorshme ose të pasigurta)'
          ]
        },
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: {
          choices: [
            'Rrallë',
            'Herë pas here',
            'Shpesh',
            'Pothuajse gjithmonë'
          ]
        },
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Duke parë përpara, cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme? (Renditni 5 më të rëndësishmet)',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'Artikulli 1: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'Artikulli 2: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'Artikulli 3: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'Artikulli 4: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'Artikulli 5: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin dhe operacionet e departamentit tuaj?',
        required: true,
        order_index: 16
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: {
          choices: [
            'Afat i shkurtër (6 muaj – 1 vit)',
            'Afat mesëm (1–2 vite)',
            'Afat i gjatë (më shumë se 2 vite)'
          ]
        },
        required: true,
        order_index: 17
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: {
          choices: [
            'Rreziqet Operacionale dhe të Mirëmbajtjes (p.sh., vonesa, keqpërdorim)',
            'Rreziqet e sigurisë (p.sh., trajtimi i pajisjeve të ndjeshme)',
            'Çështjet e pajtueshmërisë ligjore ose rregullatore (p.sh., kontrollet e eksportit, teknologjia e klasifikuar)',
            'Rreziqet e Furnitorëve ose Etike (p.sh., konflikte interesi me furnitor, korrupsioni, problemet e furnizimit)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 18
      },
      {
        type: 'long_text',
        title: 'A ka nevojë departamenti juaj për trajnim të specializuar ose ngritje të kapaciteteve?',
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
  {
    title: 'Pyetësor për Pajisje - Sektori për Regjistrim Kriminalistik',
    description: 'Vlerësim i nevojave për pajisje të Sektorit për Regjistrim Kriminalistik',
    department: 'Drejtoria e Teknikës Kriminalistike',
    official: 'Artifete Spahija Racaj',
    date: '24.10.2025',
    questions: [
      {
        type: 'short_text',
        title: 'Emri i zyrtarit',
        required: true,
        order_index: 1
      },
      {
        type: 'short_text',
        title: 'Grada/Pozita',
        required: true,
        order_index: 2
      },
      {
        type: 'short_text',
        title: 'Departamenti/Njësia',
        required: true,
        order_index: 3
      },
      {
        type: 'short_text',
        title: 'Data e vlerësimit',
        required: true,
        order_index: 4
      },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: {
          choices: [
            'Shumë e përshtatshme',
            'E përshtatshme',
            'Disi e përshtatshme',
            'E papërshtatshme'
          ]
        },
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: {
          choices: [
            'Pajisje TIK dhe mjete për forenzikë digjitale',
            'Tjera'
          ]
        },
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: {
          choices: [
            'Shkëlqyeshme (moderne, plotësisht funksionale)',
            'Mirë (me kufizime të vogla)',
            'Mesatare (defekte të shpeshta, të vjetruara)',
            'Dobët (kryesisht të papërdorshme ose të pasigurta)'
          ]
        },
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: {
          choices: [
            'Rrallë',
            'Herë pas here',
            'Shpesh',
            'Pothuajse gjithmonë'
          ]
        },
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Duke parë përpara, cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme? (Renditni 5 më të rëndësishmet)',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'Artikulli 1: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'Artikulli 2: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'Artikulli 3: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'Artikulli 4: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'Artikulli 5: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin dhe operacionet e departamentit tuaj?',
        required: true,
        order_index: 16
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: {
          choices: [
            'Afat i shkurtër (6 muaj – 1 vit)',
            'Afat mesëm (1–2 vite)',
            'Afat i gjatë (më shumë se 2 vite)'
          ]
        },
        required: true,
        order_index: 17
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: {
          choices: [
            'Rreziqet Operacionale dhe të Mirëmbajtjes (p.sh., vonesa, keqpërdorim)',
            'Rreziqet e sigurisë (p.sh., trajtimi i pajisjeve të ndjeshme)',
            'Çështjet e pajtueshmërisë ligjore ose rregullatore (p.sh., kontrollet e eksportit, teknologjia e klasifikuar)',
            'Rreziqet e Furnitorëve ose Etike (p.sh., konflikte interesi me furnitor, korrupsioni, problemet e furnizimit)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 18
      },
      {
        type: 'long_text',
        title: 'A ka nevojë departamenti juaj për trajnim të specializuar ose ngritje të kapaciteteve?',
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
  {
    title: 'Pyetësor për Pajisje - Sektori i Forenzikës Digjitale',
    description: 'Vlerësim i nevojave për pajisje të Sektorit për Fotografi, Video Analizë dhe Ekzaminime të TI-së',
    department: 'Departamenti i Hetimeve / Divizioni për Mbështetje të Hetimeve / Drejtoria e Teknikës Kriminalistike',
    official: 'Laura Ahmeti',
    date: '30.10.2025',
    questions: [
      {
        type: 'short_text',
        title: 'Emri i zyrtarit',
        required: true,
        order_index: 1
      },
      {
        type: 'short_text',
        title: 'Grada/Pozita',
        required: true,
        order_index: 2
      },
      {
        type: 'short_text',
        title: 'Departamenti/Njësia',
        required: true,
        order_index: 3
      },
      {
        type: 'short_text',
        title: 'Data e vlerësimit',
        required: true,
        order_index: 4
      },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: {
          choices: [
            'Shumë e përshtatshme',
            'E përshtatshme',
            'Disi e përshtatshme',
            'E papërshtatshme'
          ]
        },
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: {
          choices: [
            'Pajisje personale mbrojtëse (helmeta, jelekë, mburoja, etj.)',
            'Armë dhe municion',
            'Pajisje komunikimi (radio, sisteme mobile, rrjete të sigurta)',
            'Logjistikë & Automjete (vetura patrullimi, motoçikleta, automjete të blinduara)',
            'Pajisje për mbikëqyrje dhe monitorim (CCTV, dronë, pajisje për shikim natën)',
            'Pajisje TIK dhe mjete për forenzikë digjitale',
            'Pajisje për mbledhjen e provave dhe hetime',
            'Pajisje për kontrollin e turmave (armë jo-vdekjeprurëse, gaz lotsjellës, etj.)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: {
          choices: [
            'Shkëlqyeshme (moderne, plotësisht funksionale)',
            'Mirë (me kufizime të vogla)',
            'Mesatare (defekte të shpeshta, të vjetruara)',
            'Dobët (kryesisht të papërdorshme ose të pasigurta)'
          ]
        },
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: {
          choices: [
            'Rrallë',
            'Herë pas here',
            'Shpesh',
            'Pothuajse gjithmonë'
          ]
        },
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Duke parë përpara, cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme? (Renditni 5 më të rëndësishmet)',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'Artikulli 1: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'Artikulli 2: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'Artikulli 3: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'Artikulli 4: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin dhe operacionet e departamentit tuaj?',
        required: true,
        order_index: 15
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: {
          choices: [
            'Afat i shkurtër (6 muaj – 1 vit)',
            'Afat mesëm (1–2 vite)',
            'Afat i gjatë (më shumë se 2 vite)'
          ]
        },
        required: true,
        order_index: 16
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: {
          choices: [
            'Rreziqet Operacionale dhe të Mirëmbajtjes (p.sh., vonesa, keqpërdorim)',
            'Rreziqet e sigurisë (p.sh., trajtimi i pajisjeve të ndjeshme)',
            'Çështjet e pajtueshmërisë ligjore ose rregullatore (p.sh., kontrollet e eksportit, teknologjia e klasifikuar)',
            'Rreziqet e Furnitorëve ose Etike (p.sh., konflikte interesi me furnitor, korrupsioni, problemet e furnizimit)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 17
      },
      {
        type: 'long_text',
        title: 'A ka nevojë departamenti juaj për trajnim të specializuar ose ngritje të kapaciteteve?',
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
  {
    title: 'Pyetësor për Pajisje - Sektori për Vlerësime dhe Analiza (DIA)',
    description: 'Vlerësim i nevojave për pajisje të Sektorit për Vlerësime dhe Analiza',
    department: 'Departamenti i Inteligjencës dhe Analizave',
    official: 'Driton Marevci',
    date: '06.10.2025',
    questions: [
      {
        type: 'short_text',
        title: 'Emri i zyrtarit',
        required: true,
        order_index: 1
      },
      {
        type: 'short_text',
        title: 'Grada/Pozita',
        required: true,
        order_index: 2
      },
      {
        type: 'short_text',
        title: 'Departamenti/Njësia',
        required: true,
        order_index: 3
      },
      {
        type: 'short_text',
        title: 'Data e vlerësimit',
        required: true,
        order_index: 4
      },
      {
        type: 'multiple_choice',
        title: 'Si do të vlerësonit përshtatshmërinë e pajisjeve tuaja aktuale për kryerjen e detyrave ditore?',
        options: {
          choices: [
            'Shumë e përshtatshme',
            'E përshtatshme',
            'Disi e përshtatshme',
            'E papërshtatshme'
          ]
        },
        required: true,
        order_index: 5
      },
      {
        type: 'checkboxes',
        title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
        options: {
          choices: [
            'Pajisje personale mbrojtëse (helmeta, jelekë, mburoja, etj.)',
            'Armë dhe municion',
            'Pajisje komunikimi (radio, sisteme mobile, rrjete të sigurta)',
            'Logjistikë & Automjete (vetura patrullimi, motoçikleta, automjete të blinduara)',
            'Pajisje për mbikëqyrje dhe monitorim (CCTV, dronë, pajisje për shikim natën)',
            'Pajisje TIK dhe mjete për forenzikë digjitale',
            'Pajisje për mbledhjen e provave dhe hetime',
            'Pajisje për kontrollin e turmave (armë jo-vdekjeprurëse, gaz lotsjellës, etj.)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 6
      },
      {
        type: 'multiple_choice',
        title: 'Cila është gjendja aktuale e pajisjeve në njësinë tuaj?',
        options: {
          choices: [
            'Shkëlqyeshme (moderne, plotësisht funksionale)',
            'Mirë (me kufizime të vogla)',
            'Mesatare (defekte të shpeshta, të vjetruara)',
            'Dobët (kryesisht të papërdorshme ose të pasigurta)'
          ]
        },
        required: true,
        order_index: 7
      },
      {
        type: 'multiple_choice',
        title: 'Sa shpesh dështimi ose mungesa e pajisjeve ndikon në aftësinë tuaj për të kryer detyrat?',
        options: {
          choices: [
            'Rrallë',
            'Herë pas here',
            'Shpesh',
            'Pothuajse gjithmonë'
          ]
        },
        required: true,
        order_index: 8
      },
      {
        type: 'long_text',
        title: 'Çfarë lloj pajisjesh mungojnë aktualisht në njësinë tuaj?',
        required: true,
        order_index: 9
      },
      {
        type: 'long_text',
        title: 'Duke parë përpara, cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme? (Renditni 5 më të rëndësishmet)',
        required: true,
        order_index: 10
      },
      {
        type: 'long_text',
        title: 'Artikulli 1: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'Artikulli 2: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'Artikulli 3: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'Artikulli 4: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'Artikulli 5: Emri dhe përshkrimi',
        description: 'Ju lutemi specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin dhe operacionet e departamentit tuaj?',
        required: true,
        order_index: 16
      },
      {
        type: 'multiple_choice',
        title: 'Cili është afati kohor për sigurimin e këtyre pajisjeve?',
        options: {
          choices: [
            'Afat i shkurtër (6 muaj – 1 vit)',
            'Afat mesëm (1–2 vite)',
            'Afat i gjatë (më shumë se 2 vite)'
          ]
        },
        required: true,
        order_index: 17
      },
      {
        type: 'checkboxes',
        title: 'Cilat janë rreziqet kryesore që lidhen me këtë proces prokurimi?',
        options: {
          choices: [
            'Rreziqet Operacionale dhe të Mirëmbajtjes (p.sh., vonesa, keqpërdorim)',
            'Rreziqet e sigurisë (p.sh., trajtimi i pajisjeve të ndjeshme)',
            'Çështjet e pajtueshmërisë ligjore ose rregullatore (p.sh., kontrollet e eksportit, teknologjia e klasifikuar)',
            'Rreziqet e Furnitorëve ose Etike (p.sh., konflikte interesi me furnitor, korrupsioni, problemet e furnizimit)',
            'Tjera'
          ]
        },
        required: true,
        order_index: 18
      },
      {
        type: 'long_text',
        title: 'A ka nevojë departamenti juaj për trajnim të specializuar ose ngritje të kapaciteteve?',
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

async function createQuestionnaires() {
  console.log('Starting questionnaire creation...');
  console.log('Logging in...');

  const userId = await loginAndGetUserId();
  if (!userId) {
    console.error('Could not log in. Exiting.');
    return;
  }

  console.log(`User ID: ${userId}`);
  console.log(`Creating ${questionnaires.length} questionnaires...\n`);

  for (const q of questionnaires) {
    console.log(`Creating: ${q.title}`);

    try {
      // Create form
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          title: q.title,
          description: q.description,
          user_id: userId,
          is_published: true,
          schema_json: {
            department: q.department,
            official: q.official,
            date: q.date
          }
        })
        .select()
        .single();

      if (formError) {
        console.error(`  Error creating form: ${formError.message}`);
        continue;
      }

      console.log(`  Form created with ID: ${form.id}`);

      // Create questions
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
          console.error(`    Error creating question: ${questionError.message}`);
        }
      }

      console.log(`  ✓ Created ${q.questions.length} questions\n`);
    } catch (error) {
      console.error(`  Unexpected error: ${error.message}\n`);
    }
  }

  console.log('✓ All questionnaires created successfully!');
}

createQuestionnaires().catch(console.error);
