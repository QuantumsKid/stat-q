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

// Common options used across all questionnaires
const suitabilityOptions = {
  choices: [
    { id: '1', label: 'Shumë e përshtatshme' },
    { id: '2', label: 'E përshtatshme' },
    { id: '3', label: 'Disi e përshtatshme' },
    { id: '4', label: 'E papërshtatshme' }
  ]
};

const equipmentCategories = {
  choices: [
    { id: '1', label: 'Pajisje personale mbrojtëse (helmeta, jelekë, mburoja, etj.)' },
    { id: '2', label: 'Armë dhe municion' },
    { id: '3', label: 'Pajisje komunikimi (radio, sisteme mobile, rrjete të sigurta)' },
    { id: '4', label: 'Logjistikë & Automjete (vetura patrullimi, motoçikleta, automjete të blinduara)' },
    { id: '5', label: 'Pajisje për mbikëqyrje dhe monitorim (CCTV, dronë, pajisje për shikim natën)' },
    { id: '6', label: 'Pajisje TIK dhe mjete për forenzikë digjitale' },
    { id: '7', label: 'Pajisje për mbledhjen e provave dhe hetime' },
    { id: '8', label: 'Pajisje për kontrollin e turmave (armë jo-vdekjeprurëse, gaz lotsjellës, etj.)' },
    { id: '9', label: 'Tjera' }
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

async function deleteOldQuestionnaires(userId) {
  console.log('Deleting old questionnaires...');

  // Get all forms for this user
  const { data: forms, error } = await supabase
    .from('forms')
    .select('id, title')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching forms:', error);
    return;
  }

  if (!forms || forms.length === 0) {
    console.log('No forms to delete');
    return;
  }

  console.log(`Found ${forms.length} forms to delete`);

  for (const form of forms) {
    console.log(`  Deleting: ${form.title}`);
    const { error: deleteError } = await supabase
      .from('forms')
      .delete()
      .eq('id', form.id);

    if (deleteError) {
      console.error(`    Error deleting form ${form.id}:`, deleteError);
    } else {
      console.log(`    ✓ Deleted`);
    }
  }
}

// Template function to create common questions
function createCommonQuestions() {
  return [
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
      options: suitabilityOptions,
      required: true,
      order_index: 5
    },
    {
      type: 'checkboxes',
      title: 'Cilat kategori të pajisjeve janë më kritike për punën tuaj?',
      options: equipmentCategories,
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
      description: 'Listoni pajisjet që mungojnë',
      required: true,
      order_index: 9
    },
    {
      type: 'long_text',
      title: 'Duke parë përpara, cilat pajisje do të jenë më kritike për departamentin tuaj gjatë 1–5 viteve të ardhshme?',
      description: 'Renditni 5 më të rëndësishmet',
      required: true,
      order_index: 10
    }
  ];
}

const questionnaires = [
  {
    title: 'Pyetësor për Pajisje - Njësia për Dron dhe Antidron',
    description: 'Vlerësim i nevojave për pajisje të Njësisë për Dron dhe Antidron (Drejtoria e Njësive Ajrore)\n\nMOHIM PËRGJEGJËSIE: Ky pyetësor ka për qëllim vlerësimin e nevojave ekzistuese dhe të ardhshme për pajisje të Policisë së Kosovës. Çdo mbështetje ose prokurim i mundshëm i mallrave përmes projektit HAPE është i kushtëzuar nga heqja e sanksioneve nga Bashkimi Evropian ndaj Kosovës dhe brenda kufijve të financimit të projektit HAPE.',
    department: 'Departamenti i Njësive Speciale / Drejtoria e Njësive Ajrore',
    questions: [
      ...createCommonQuestions(),
      {
        type: 'long_text',
        title: 'Artikulli 1: Emri dhe përshkrimi',
        description: 'Specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: true,
        order_index: 11
      },
      {
        type: 'long_text',
        title: 'Artikulli 2: Emri dhe përshkrimi',
        description: 'Specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 12
      },
      {
        type: 'long_text',
        title: 'Artikulli 3: Emri dhe përshkrimi',
        description: 'Specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 13
      },
      {
        type: 'long_text',
        title: 'Artikulli 4: Emri dhe përshkrimi',
        description: 'Specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 14
      },
      {
        type: 'long_text',
        title: 'Artikulli 5: Emri dhe përshkrimi',
        description: 'Specifikoni: Emrin e artikullit, Qëllimin, Specifikimet, Koston e parashikuar, Sasinë e nevojshme',
        required: false,
        order_index: 15
      },
      {
        type: 'long_text',
        title: 'Si prokurimi i këtyre mallrave do të përmirësojë efektivitetin dhe operacionet e departamentit tuaj?',
        description: 'Përshkruani shkurtimisht ndikimin e pritshëm (p.sh. kohë më e shpejtë reagimi, mbledhja e provave, mbrojtje personale, mbledhja e inteligjencës, etj.)',
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
        title: 'A ka nevojë departamenti juaj për trajnim të specializuar ose ngritje të kapaciteteve?',
        description: 'Listoni trajnimet e nevojshme',
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
  console.log('\n=== Starting Questionnaire Recreation ===\n');

  const userId = await loginAndGetUserId();
  if (!userId) {
    console.error('Could not log in. Exiting.');
    return;
  }

  console.log(`User ID: ${userId}\n`);

  // Delete old questionnaires
  await deleteOldQuestionnaires(userId);

  console.log(`\nCreating ${questionnaires.length} new questionnaires with proper options...\n`);

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
            department: q.department
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

      console.log(`  ✓ Created ${q.questions.length} questions with options\n`);
    } catch (error) {
      console.error(`  Unexpected error: ${error.message}\n`);
    }
  }

  console.log('✓ All questionnaires recreated with proper options!');
}

createQuestionnaires().catch(console.error);
