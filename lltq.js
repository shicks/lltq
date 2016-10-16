var main = document.getElementById('main');
var resultDiv = document.getElementById('result');

var defaultDecisions = {};
if (window.location.hash) {
  (function() {
    var json = LZString.decompressFromEncodedURIComponent(
        window.location.hash.substring(1));
    if (json) {
      defaultDecisions = JSON.parse(json);
    } else {
      throw new Error('Bad string: ' + window.location.hash);
    }
  })();
}

var skillGroups = {
  social: {
    royal_demeanor: {composure: 1, elegance: 1, presence: 1},
    conversation: {public_speaking: 1, court_manners: 1, flattery: 1},
    expression: {decoration: 1, voice: 1, instrument: 1}},
  physical: {
    agility: {dance: 1, reflexes: 1, flexibility: 1},
    weapons: {swords: 1, archery: 1, polearms: 1},
    athletics: {running: 1, climbing: 1, swimming: 1},
    animal_handling: {horses: 1, dogs: 1, falcons: 1}},
  intellectual: {
    history: {novan_history: 1, foreign_affairs: 1, world_history: 1},
    intrigue: {internal_affairs: 1, foreign_intelligence: 1, ciphering: 1},
    medicine: {herbs: 1, battlefield: 1, poison: 1},
    economics: {accounting: 1, trade: 1, production: 1},
    military: {strategy: 1, naval_strategy: 1, logistics: 1}},
  mystical: {
    faith: {meditation: 1, divination: 1, lore: 1},
    lumen: {sense_magic: 1, resist_magic: 1, wield_magic: 1}}};
var skillParents = (function() {
  var p = {};
  for (var g in skillGroups) {
    for (var c in skillGroups[g]) {
      p[c] = g;
      for (var s in skillGroups[g][c]) {
        p[s] = c;
      }
    }
  }
  return p;
})();

var bonus = {
  afraid: {
    agility: +1, faith: +1,
    royal_demeanor: -1, weapons: -1, intrigue: -1, military: -1},
  angry: {
    weapons: +1, military: +1,
    royal_demeanor: -1, expression: -1, animal_handling: -1, medicine: -1},
  depressed: {
    expression: +1, animal_handling: +1,
    royal_demeanor: -1, conversation: -2, athletics: -1},
  cheerful: {
    conversation: +1, athletics: +1,
    weapons: -1, intrigue: -1, military: -2},
  yielding: {
    royal_demeanor: +1, history: +1, faith: +1,
    weapons: -3, lumen: -3},
  willful: {
    intrigue: +1, military: +1, lumen: +1,
    royal_demeanor: -2, history: -2, economics: -2},
  lonely: {
    conversation: +1, medicine: +1,
    royal_demeanor: -1, intrigue: -1, faith: -1},
  pressured: {
    athletics: +1, faith: +1,
    conversation: -1, history: -1, economics: -1},
  injured: {agility: -3, weapons: -3, athletics: -3, animal_handling: -3},
  neutral: {}};

var moodCategories = ['anger', 'cheerfulness', 'willfulness', 'crowded'];
var moods = {
  anger: ['afraid', 'angry'],
  cheerfulness: ['depressed', 'cheerful'],
  willfulness: ['yielding', 'willful'],
  crowded: ['lonely', 'pressured']};

const achievements = {
  crowned: 'been crowned Queen?',
  broken_off_engagement: 'broken off an engagement?',
  brin_flowers: 'been sent flowers by a woman?',
  lumen: 'transformed into a Lumen?',
  confidence_vote: 'faced a vote of no-confidence?',
  challenged_banion: 'challenged someone to a duel?',
  held_a_hostage_to_ransom: 'held a hostage to ransom?',
  family_secret: 'discovered a terrible family secret?',
  forced_into_marriage: 'been forced into marriage?',
  spare_crystal: 'found a spare Lumen crystal?',
  civil_war: 'faced a civil war?',
  been_challenged: 'been challenged to a duel?',
  ordered_an_execution: 'ordered an execution?',
  talarist_elath: 'made a foreign duke your subject?',
  killed_julianna: 'paid a reward for killing a fugitive?',
  titan: 'spoken to Adair',
  survived_a_forest_adventure: 'survived the Old Forest?',
  lumen_minister: 'hired a Lumen Minister?',
  ordered_an_assassination: 'ordered an assassination?',
  forced_marriage: 'forced someone else to get married?',
  naval_victory: 'achieved a naval victory?',
  evil_minion: 'become an evil minion?',
  power_of_music: 'saved the day with the power of music?',
  sunk_with_magic: 'sunk a fleet with magic?',
  tentacle_monster: 'encountered a tentacle monster?',
  caused_a_couple_to_divorce: 'caused a couple to divorce?',
  military_alliance: 'forged a military alliance?',
  blessed_by_cats: 'been blessed by the favor of cats?',
  commoner_romance: 'romanced a commoner?',
  summoned_a_creeping_shade: 'summoned a creeping shade?',
  commoner_uprising: 'faced a commoner uprising?',
  find_out_who_killed_your_mother: 'discovered who killed your mother?',
  ordered_a_human_sacrifice: 'ordered a human sacrifice?',
  magic_mirror: 'found a magic mirror?',
  rebellion_in_merva: 'faced a rebellion in Merva?',
  spy: 'hired a spy?',
};

const deaths = {
  arrow: 'taken an arrow to the gut',
  bleed: 'let your blood run dry',
  choked: 'choked on magical chains',
  drowned: 'drowned at sea',
  heavy_object: 'cracked your skull',
  life_energy: 'had your life drained',
  life_essence: 'fallen victim to monsters',
  magic: 'been blasted by magic',
  magic_too_strong: 'blown yourself up',
  poisoned: 'been poisoned',
  stabbed: 'gotten too close to a sword',
};

const windows = ['',
                 'lumen', 'non-lumen', 'marriage', 'sad father',
                 'death', 'rebellion', 'elevation', 'loser',
                 'thorns', 'dark magic', 'massacre', 'barren',
                 'celebrate', 'briony', 'ursul', 'evil', // 13-16
                 'kraken', 'distrust lumens', 'angel', 'war', // 17-20
                 'rejected', 'printing press', 'hospital', 'primary', // 21-24
                ];

const epilogues = {
  never_lumen: [2, 'Never became a lumen'],
  late_lumen: [1, 'Became a lumen after coronation'],
  coronation_tragedy: ['Coronation scarred by tragedy'],
  married_talarist: [3, 'Marries Talarist'],
  married_banion_friendly: [3, 'Marries Banion on friendly terms'],
  married_banion_hostile: [3, 'Marries Banion on hostile terms'],
  married_thaddeus: [3, 'Marries Thaddeus'],
  married_thaddeus_forced: [3, 'Forced to marry Thaddeus'],
  joslyn_coma: [4, 'Joslyn sick'],
  joslyn_brin: [3, 'Joslyn marries Brin'],
  joslyn_sirin: [3, 'Joslyn marries Sirin'],
  joslyn_bachelor: [4, 'Joslyn a bachelor'],
  caloris_elodie: [5, 'Caloris claimed by Elodie'],
  caloris_minor_lords: [5, 7, 'Caloris given to minor lords'],
  merva_rebellion: [6, 'Rebellion in Merva ignored'],
  merva_rebellion_torched: [6, 'Rebellion in Merva quelled cruelly'],
  caloris_laurent: [5, 7, 'Grants Caloris to Laurent'],
  caloris_administrators: [5, 9, 'Caloris run by administrators'],
  charlotte_demon_crystal: [10, 'Charlotte attempts to use demon crystal'],
  lucille_execute: [11, 'Lucille hunted and killed'],
  lucille_execute_all: [11, 'Lucille\'s family massacred'],
  lucille_execute_trauma: [11, 'Lucille executed traumatically'],
  lucille_execute_justified: [11, 'Lucille executed justifiably'],
  lucille_execute_some: [11, 'Lucille and Laurent executed'],
  lucille_banish: [10, 'Lucille\'s family banished'],
  laurent_mutilated: [10, 'Laurent mutilated'],
  elodie_barren: [12, 'Elodie barren'],
  elodie_charlotte_code: [9, 'Elodie and Charlotte become close'],
  elodie_charlotte_mend: [9, 'Elodie and Charlotte mend awkwardly'],
  lumens_celebrated: [13, 'Public opinion of Lumens rises'],
  lumens_demonized: [10, 'Public opinion of Lumens falls'],
  lumens_uneasy: [18, 'Public opinion of Lumens uneasy'],
  ursul_selene: ['Julianna marries Selene'],
  ursul_briony: [14, 'Briony heir of Ursul'],
  ursul_suspicion: [15, 'Julianna met with suspicion'],
  kraken_unleashed: [17, 'Kraken unleashed on pirates'],
  kraken_struggle: [17, 'Sealing kraken leads to economic hardship'],
  kraken_charlotte: [10, 17, 'Charlotte sacrified to kraken'],
  shanjia_peace: [19, 'Peace with Shanjia'],
  shanjia_thaddeus: ['Thaddeus suspects an affair with Togami'],
  shanjia_victory_siege: [20, 'Nova under Shanjian siege for years'],
  shanjia_victory_revenge: [20, 'Shanjia plots revenge'],
  shanjia_ignore: [20, 'Shanjia ignores Nova'],
  shanjia_ignore_never_lumen: [10, 'Elodie hopes Togami succumbs in Borealis'],
  shanjia_tense: [20, 'Relations with Shanjia tense'],
  tombula: [20, 'Tombula invades Ursul'],
  ixion_backfire_ok: [20, 'Ixion bluff backfires, but Nova prevails'],
  ixion_backfire_cede: [20, 'Ixion bluff backfires, much land ceded'],
  elath_compromise: [3, 'Elevate a Duchess of Elath to marry Talasse'],
  talasse_tensions: [20, 'Tensions between Nova and Talasse'],
  talasse_tensions_wed: [3, 'Marries Talarist to ease Nova-Talasse tensions'],
  married_talarist_barren: [3, 'Marries Talarist, but divorced because barren'],
  married_talarist_barren_cruel: ['Assassinates Talarist\'s misstress'],
  married_talarist_twins: [3, 'Marries Talarist and has twins but poor health'],
  married_talarist_jilted: [3, 'Jilted by Talarist, but marries his brother'],
  married_talarist_happy: [3, 'Marries Talarist and lives happily ever after'],
  married_banion_brin: [3, 'Marries Banion and effectively Brin as well'],
  married_banion_double: [3, 'Marries Banion, complicated family relations'],
  married_banion_agenda: [3, 'Marries Banion, but tension from political agenda'],
  married_nobody_brin: [9, 'Never marries, spends lots of time with Brin'],
  married_adair_friends: [3, 'Married Adair as platonic friends'],
  married_adair_pants: [3, 'Married Adair and clearly wore the pants'],
  married_adair_barren: [9, 'Failed to provide an heir for Elath'],
  kiran_rejected: ['Rejected by Kiran'],
  kiran_civil_war: [9, 'Married Kiran, but assassination led to civil war'],
  linley_rejected: [21, 'Rejected by Linley'],
  linley_married: [3, 'Married Linley'],
  married_anciet: [9, 3, 'Married Anciet'],
  briony_flirtation: [9, 'Public flirtation with Briony'],
  evrard_romance: [3, 'Successful romance with Evrard'],
  evrard_servant: [9, 'Evrard as servant, romance failed'],
  evrard_cruel: [9, 3, 'Evrard disappeared, married Earl of Mima'],
  evrard_married: [9, 3, 'Married Evrard'],
  evrard_friends: [9, 'Could not marry Evrard, for good of the realm'],
  kevan_attempt: [9, 'Kevan attempts assassination at wedding'],
  kevan_loyal: [9, 'Marries Kevan, who is eventually devoutly loyal'],
  kevan_rejected: [21, 'Rejected by Kevan'],
  ignatius_married: [9, 3, 'Married Ignatius, to Briony\'s dismay'],
  ignatius_not_married: [9, 'Proposed to Ignatius, but finally married another'],
  alice_romance: [9, 'Romanced Alice'],
  married_foreign_duke: [3, 'Married a foreign duke for strategic reasons'],
  never_married_cruel: [9, 'Never married, kept a stable of favorites'],
  married_romantic_earl: [3, 'Eventually married a romantic earl'],
  printing_press: [22, 'Printing press invented'],
  hospital: [23, 'Advanced field of medicine'],
  primary_royal_demeanor: [24, 'Primary subskill is royal demeanor'],
  primary_conversation: [24, 'Primary subskill is royal demeanor'],
  primary_expression: [24, 'Primary subskill is royal demeanor'],
  primary_agility: [24, 'Primary subskill is royal demeanor'],
  primary_weapons: [24, 'Primary subskill is royal demeanor'],
  primary_athletics: [24, 'Primary subskill is royal demeanor'],
  primary_animal_handling: [24, 'Primary subskill is royal demeanor'],
  primary_history: [24, 'Primary subskill is royal demeanor'],
  primary_intrigue: [24, 'Primary subskill is royal demeanor'],
  primary_medicine: [24, 'Primary subskill is royal demeanor'],
  primary_medicine_poison: [24, 'Primary subskill is royal demeanor'],
  primary_medicine_hospital: [24, 'Primary subskill is royal demeanor'],
  primary_economics: [24, 'Primary subskill is royal demeanor'],
  primary_military: [24, 'Primary subskill is royal demeanor'],
  primary_military_expand: [24, 'Primary subskill is royal demeanor'],
  primary_faith: [24, 'Primary subskill is royal demeanor'],
  primary_faith_solace: [24, 'Primary subskill is royal demeanor'],
  primary_lumen: [24, 'Primary subskill is royal demeanor'],
  primary_lumen_power: [24, 'Primary subskill is royal demeanor'],
  fear: ['People of Nova feared their capricious queen'],
  evil: [16, 'Trade crown and father\'s life for love of evil'],
};

// Re-runs the whole thing, updating the main div.
function evaluate() {

  function showEpilogue(name) {
    const wins = [];
    const epi = epilogues[name];
    for (let i = 0; i < epi.length - 1; i++) {
      wins.push(windows[epi[i]]);
    }
    const text = ['Epilogue'];
    if (wins.length) {
      text.push(' (', wins.join(', '), ')');
    }
    text.push(': ', epi[epi.length - 1]);
    showResult(text.join(''));
  }

  function epilogue() {
    const never_lumen = (() => {
      if (state.lumen_unlocked) return false;
      const after = decisions.after_joslyn_dies_become_lumen;
      if (after !== undefined) return !after;
      if (decisions.ursul_dungeon_free == 'refuse') return false; // ...?
      return state.let_ursul_return === false;
    })();
    const briony_alive =
        state.briony != 'dead' &&
        (decisions.week28_briony || decisions.week29_pardon);
    const sedna_mollified = () => {
      if (state.betrothed == 'sedna' && !elodie_married) return true;
      if (elodie_married == 'Talarist') return true;
      if (state.week26_elath_heir_1 == 'Talarist') return true;
      if (decisions.week39_husband == 'Talarist' && !elodie_married) return true;
      return false;
    };
    let elodie_married = false;
    let talarist_married = false;
    let elodie_barren = false;
    let brin_married = false;
    let lucille_driven_off_by_arisse = false;
    let lucille_pleased = false;

    function show(name) {
      showEpilogue(name);
    }

    function merva_rebellion() {
      achievement('rebellion_in_merva');
      if (test('cruelty', 10)) {
        show('merva_rebellion_torched');
      } else {
        show('merva_rebellion');
      }
    }
    
    if (decisions.week10_hellas_punishment == 'marriage') brin_married = 'Ixion';
    if (never_lumen) {
      show('never_lumen');
    } else if (!state.lumen_unlocked) {
      show('late_lumen');
    }
    if (decisions.week38_feast == 'small' &&
        week35_retreat_strategy_check_succeeded === undefined) {
      show('coronation_tragedy');
      set('commoner_approval', -15);
    }

    // Early marriage
    if (decisions.week39_wedding != 'delay') {
      if (state.betrothed == 'sedna') {
        show('married_talarist');
        elodie_married = 'Talarist';
        talarist_married = true;
      } else if (state.betrothed == 'banion') {
        if (decisions.week17_banion_plan == 'marry') {
          show('married_banion_friendly');
        } else {
          show('married_banion_hostile');
        }
        elodie_married = 'Banion';
      } else if (state.betrothed == 'Thaddeus') {
        show('married_thaddeus');
        elodie_married = 'Thaddeus';
      }
    } else if (state.betrothed == 'Thaddeus' && !lucille_dead()) {
      show('married_thaddeus_forced');
      elodie_married = 'Thaddeus';
      lucille_driven_off_by_arisse = true;
    }

    // Father / Caloris
    if (state.father == 'coma') {
      show('joslyn_coma');
    } else if (state.father == 'dead') {
      if (decisions.week37_duel_lost_lucille_reaction == 'execute') {
        if (state.noble_approval <= -40) {
          show('caloris_minor_lords');
        } else {
          show('caloris_elodie');
          merva_rebellion();
        }
      } else if (state.current_merva == 'Laurent' && !lucille_dead() &&
                 test('interal_affairs', 20)) {
        show('caloris_laurent');
        lucille_pleased = true;
      } else {
        show('caloris_administrators');
      }
    } else {
      if (state.week39_brin_proposal && decisions.week39_husband == 'Banion' &&
          state.current_hellas == 'Brin' && !brin_married) {
        show('joslyn_brin');
        brin_married = 'Joslyn';
      } else {
        show(state.week18_snub_success === false ?
             'joslyn_sirin' : 'joslyn_bachelor');
      }
    }

    // Lucille
    if (decisions.week17_lucille_lumen == 'offer' &&
        decisions.week20_demons == 'question') {
      show('charlotte_demon_crystal');
    }
    if (state.father != 'dead') {
      const guilty = decisions.week37_lucille_guilty;
      if (guilty == 'execute_all') {
        show('lucille_execute_all');
        merva_rebellion();
      } else if (/execute_(lucille$|banish)/.test(guilty) &&
                 state.current_merva == 'Laurent') {
        if (guilty == 'execute_lucille') {
          show('lucille_execute_trauma');
        } else {
          show('lucille_execute_justified');
        }
      } else if (guilty == 'execute_lucille_and_laurent') {
        show('lucille_execute_some');
      } else if (guilty == 'banish_all') {
        show('lucille_banish');
        if (state.current_merva == 'Laurent') {
          show('laurent_mutilated');
        }
      } else if (guilty) {
        show('lucille_execute');
      }
    }

    // Barren
    if (state.father == 'dead' && !lucille_dead() &&
        !lucille_driven_off_by_arisse && !lucille_pleased) {
      elodie_barren = true;
      show('elodie_barren');
      test('herbs', 90);
    }

    // Charlotte
    if (decisions.week17_lucille_lumen == 'accuse' &&
        decisions.week37_kraken != 'charlotte') {
      show('elodie_charlotte_' + (test('ciphering', 50) ? 'code' : 'mend'));
    }
  
    // Fate of lumens
    if (decisions.week36_shanjia_contest == 'accept' &&
        decisions.week20_demons != 'execute' &&
        (decisions.week37_lucille_guilty != 'banish_all' ||
         state.current_merva != 'Laurent') &&
        decisions.crystal_progress != 'drastic' && state.father != 'dead' &&
        !state.week39_mob_burnt) {
      show('lumens_celebrated');
      if (state.week7_ursul != 'ignatius') show('ursul_selene');
      if (decisions.week30_war_resolution != 'exile' && briony_alive) {
        show('ursul_briony');
      }
    } else if (decisions.week37_kraken == 'seal') {
      show('kraken_' + (test('cruelty', 10) ? 'unleashed' : 'struggle'));
    } else if (decisions.week37_kraken == 'charlotte') {
      show('kraken_charlotte');
    } else if (never_lumen) {
      show('lumens_demonized');
    } else {
      show('lumens_uneasy');
      if (state.current_ursul == 'Julianna' &&
          decisions.week17_lucille_lumen != 'offer') {
        show('ursul_suspicion');
        // Note: modifications for Elodie supporting her, as well as
        // the public worrying about an heir if Elodie still unmarried.
      }
    }

    // Shanjia
    if (decisions.week36_shanjia_contest == 'sing') {
      show('shanjia_peace');
      if (state.betrothed == 'thaddeus') show('shanjia_thaddeus');
    } else if (state.week35_shanjia_naval_victory) {
      show('shanjia_victory_' +
           (decisions.week36_shanjia_prisoners == 'execute_all' ?
            'siege' : 'revenge'));
    } else if (state.father == 'dead') {
      show('shanjia_ignore');
      test('foreign_intelligence', 60) || // chasing false rumors
          test('world_history', 40) || test('lore', 30); // rumors
      if (never_lumen) {
        show('shanjia_ignore_never_lumen');
      }
    } else if (decisions.week36_shanjia_contest == 'accept') {
      show('shanjia_tense');
    }

    // Other foreign relations
    if (state.julianna == 'dead') {
      show('tombula');
    }
    if (decisions.week10_ixion_bluff == 'talasse' && !sedna_mollified()) {
      const ok = state.week35_shanjia_naval_victory || state.week35_shanjia_defeat;
      show('ixion_backfire_' + (ok ? 'ok' : 'cede'));
      // extra: if ok and hellas=brin then claims more southern land
    } else if (state.week26_elath_heir_1 == 'Delay') {
      show('elath_compromise');
      talarist_married = true;
    } else if (state.week26_elath_heir_1 == 'Novan') {
      if (!elodie_married && decisions.week39_husband == 'Talarist') {
        show('talasse_tensions_wed');
        elodie_married = 'Talarist';
        talarist_married = true;
      } else {
        show('talasse_tensions');
      }
    }

    // Late marriage
    if (!elodie_married) {
      if (decisions.week39_husband == 'Talarist') {
        if (decisions.week26_elath_heir == 'Talarist' && !talarist_married) {
          talarist_married = true;
          if (elodie_barren) {
            show('married_talarist_barren');
            if (test('cruelty', 10)) {
              show('married_talarist_barren_cruel');
              achievement('ordered_an_assassination');
            }
          } else {
            elodie_married = 'Talarist';
            show('married_talarist_twins');
          }
        } else if (state.week12_sednan_marriage_manners_fail) {
          show('married_talarist_jilted'); // extra: squid poem if lost
        } else if (elodie_barren) {
          show('married_talarist_barren');
        } else {
          elodie_married = 'Talarist';
          talarist_married = true;
          show('married_talarist_happy');
        }
      } else if (decisions.week39_husband == 'Banion') {
        if (state.week39_brin_proposal) {
          if (brin_married != 'Joslyn') {
            show('married_banion_brin'); // minor change if Brin married Ixion
          } else {
            show('married_banion_double');
          }
        } else {
          show('married_banion_agenda');
        }
      } else if ((decisions.week39_husband == 'None' ||
                  state.father == 'dead') &&
                 decisions.week18_brin_flowers == 'accept') {
        show('married_nobody_brin');
      } else if (decisions.week39_husband == 'Adair' ||
                 decisions.elath_regent == 'marry') {
        show('married_adair_' +
             (decisions.elath_regent == 'marry' ? 'friends' : 'pants'));
        if (elodie_barren) show('married_adair_barren');
      } else if (decisions.week39_husband == 'Kiran') {
        if (decisions.week29_pardon) {
          show('kiran_rejected');
        } else if (decisions.week24_lillah_action == 'kill') {
          show('kiran_civil_war');
        } // else - any way to have a smooth marriage???
      } else if (decisions.week39_husband == 'Linley') {
        if (decisions.week30_war_resolution == 'exile') {
          show('linley_rejected');
        } else {
          show('linley_married');
        }
      } else if (decisions.week39_husband == 'Anciet' && test('cruelty*-1', -5)) {
        show('married_anciet');
      } else if (decisions.week39_husband == 'Briony') {
        show('briony_flirtation');
      } else if (decisions.week39_husband == 'Evrard') {
        if (decisions.week28_evrard_cookies == 'taster') {
          if (test('commoner_approval', -20) && test('noble_approval', -20)) {
            show('evrard_servant');
          } else {
            show('evrard_romance');
            achievement('commoner_romance');
          }
        } else if (test('cruelty', 5)) {
          show('evrard_cruel');
        } else if (test('commoner_approval', 0) && test('noble_approval', 0) &&
            decisions.week37_kraken != 'seal' &&
            (decisions.week10_ixion_bluff != 'talasse' || !sedna_mollified()) &&
            decisions.week36_shanjia_prisoners != 'execute_all') {
          show('evrard_married');
          achievement('commoner_romance');
        } else {
          show('evrard_friends');
        }
      } else if (decisions.week39_husband == 'Kevan') {
        if (/alone|tell_her_not_to/.test(decisions.week29_briony_help) ||
            state.civil_war_victory ||
            (!decisions.week29_pardon &&
             !/tattle|help/.test(decisions.week28_briony) &&
             !decisions.week28_briony_conversation)) {
          show('kevan_attempt');
        } else if (state.family_secret_discovered) {
          show('kevan_loyal');
        } else {
          show('kevan_rejected');
        }
      } else if (decisions.week39_husband == 'Ignatius') {
        show('ignatius_' +
             (decisions.week36_shanjia_contest == 'sing' ? '' : 'not_') +
             'married');
      } else if (state.alice_romance) {
        achievement('commoner_romance');
        show('alice_romance');
      } else if (get('military+intrigue') > get('expression+conversation')) {
        show('married_foreign_duke');
      } else if (test('cruelty', 5)) {
        show('never_married_cruel');
      }
    }

    // Misc
    if (decisions.printing_press == 'invest') {
      show('printing_press');
    }
    if (decisions.invest_hospital == 'invest') {
      show('hospital');
    }

    let primary;
    for (let g in skillGroups) {
      g = skillGroups[g];
      for (let s in g) {
        if (!primary || get(s) > get(primary)) primary = s;
      }
    }
    if (primary == 'medicine' && state.cruelty >= 10) {
      show('primary_medicine_poison');
    } else if (primary == 'medicine' && state.invest_hospital) {
      show('primary_medicine_hospital');
    } else if (primary == 'military' && state.cruelty >= 5) {
      show('primary_military_expand');
    } else if (primary == 'faith' && state.father == 'dead') {
      show('primary_faith_solace');
    } else if (primary == 'lumen' && decisions.week37_kraken == 'seal') {
      // no epilogue...
    } else if (primary == 'lumen' && state.cruelty > 10) {
      show('primary_lumen_power');
    } else {
      show('primary_' + primary);
    }

    if (test('cruelty', 10)) {
      show('fear');
    }
  }

  history.replaceState(null, '', '#' +
      LZString.compressToEncodedURIComponent(
          JSON.stringify(defaultDecisions)));
  var decisions = {};
  var out = document.createElement('div');
  var resultOut = document.createElement('div');
  var state = {
    army_size: 12000,
    lassi: 10000,
    week: 1,
    weeknum: 0,
    anger: -2,
    cheerfulness: -4,
    willfulness: 0,
    crowded: 0,
    cruelty: 0,
    commoner_approval: 0,
    noble_approval: 0,
    outfit: 'none'
  };
  var tests = [];

  function mood(categories) {
    if (!categories && state.week < state.injured + 2) return 'injured';
    categories = categories || moodCategories;
    var best = 0;
    var mood = 'neutral';
    forEach(categories, function(c) {
      var amt = state[c];
      if (Math.abs(amt) > best) {
        mood = moods[c][+(amt > 0)];
        best = Math.abs(amt);
      }
    });
    return mood;
  }

  function set(mood, delta, var_args) {
    // TODO - add text?!?
    var args = [].slice.call(arguments);
    while (args.length) {
      mood = args[0];
      delta = args[1];
      if (delta === +delta) { // is a number
        tests.push(mood + ' ' + num(delta));
        var newVal = (state[mood] || 0) + delta;
        if (moodCategories.indexOf(mood) >= 0) {
          newVal = Math.max(-5, Math.min(5, newVal));
        }
        state[mood] = newVal
      } else if (mood == 'achievement') {
        achievement(delta);
      } else {
        tests.push(mood + ' = ' + delta);
        state[mood] = delta;
      }
      args = args.slice(2);
    }
  }

  function studyRates() {
    var rates = {};
    var gtot = {};
    var ctot = {};
    for (var g in skillGroups) {
      gtot[g] = 0;
      for (var c in skillGroups[g]) {
        ctot[c] = 0;
        for (var s in skillGroups[g][c]) {
          ctot[c] += (state[s] || 0) / 100;
          gtot[g] += (state[s] || 0) / 1000;
        }
      }
    }
    for (g in skillGroups) {
      for (c in skillGroups[g]) {
        var b = bonus[mood()][c] || 0;
        rates[c] = 5 * (2 + b + gtot[g] + ctot[c]);
      }
    }
    return rates;
  }

  function study(skill, rates) {
    // figure out all the bonuses...
    var category = skillParents[skill];
    var group = skillParents[category];
    if (!group) throw new Error('Bad skill ' + skill);
    var rate = Math.max(0, rates[category]);
    other = 100;
    for (var s in skillGroups[group][category]) {
      if (s != skill) other = Math.min(other, state[s] || 0);
    }
    var cap = other < 25 ? 50 : 100;
    state[skill] = Math.min(cap, (state[skill] || 0) + rate);
  }

  function heading(text, type) {
    var h = document.createElement(type || 'h2');
    h.textContent = text;
    out.appendChild(h);
  }

  function showResult(text) {
    var h = document.createElement('div');
    h.textContent = text;
    resultOut.appendChild(h);
  }

  function text(text) {
    var e = document.createElement('div');
    e.textContent = text;
    out.appendChild(e);
  }

  function achievement(achievement) {
    if (state[achievement]) return;
    state[achievement] = true;
    showResult('Achievement unlocked: ' + achievements[achievement]);
    //unlocked[achievement] = true;
  }

  function get(skillExpr) {
    function g(s) {
      if (!skillParents[s]) return state[s] || 0;
      return Math.min(100, (state[s] || 0) +
                      (state.outfit === skillParents[s] ? 10 : 0));
    }
    let value = 0;
    const split = skillExpr.split('+');
    for (var i = 0; i < split.length; i++) {
      let cs = split[i];
      let factor = 1;
      const split2 = cs.split('*');
      if (split2.length > 1) {
        factor = parseInt(split[1], 10);
        cs = split2[0];
      }
      let curr = g(cs);
      const  parent = skillParents[cs];
      if (!(parent in skillParents) && skillGroups[parent]) {
        const  c = skillGroups[parent][cs];
        curr = 0;
        for (var s in c) {
          curr += g(s);
        }
      }
      value += curr * factor;
    }
    return value;
  }

  function test(skill, threshold, /* opt */ partial, pass, mid, fail) {
    var value = get(skill);
    var threshStr = threshold;
    if (partial) threshStr = threshStr + '/' + partial;
    if (value >= threshold) {
      tests.push('test ' + skill + ' >= ' + threshStr + ': pass (' + value.toFixed(2) + ')');
      if (pass instanceof Function) return pass(); else if (pass) doObject(pass);
      return true;
    } else if (value >= partial) {
      tests.push('test ' + skill + ' >= ' + threshStr + ': partial (' + value.toFixed(2) + ')');
      if (mid instanceof Function) return mid(); else if (mid) doObject(mid);
      return 'partial';
    }
    tests.push('test ' + skill + ' >= ' + threshStr + ': fail (' + value.toFixed(2) + ')');
    if (fail instanceof Function) return fail(); else if (fail) doObject(fail);
    return false;
  }

  function choice(id, text, options) {
    if (id[0] == '_') id = 'week' + state.week + id;
    text = text ? text + ': ' : '';
    var selected = defaultDecisions[id];
    if (selected == null) selected = decisions[id];
    if (!(selected in options)) selected = pickAny(options);
    decisions[id] = selected;
    var elt;
    if (text) {
      elt = document.createElement('div');
      var txt = document.createElement('span');
      elt.appendChild(txt);
      txt.textContent = text;
    } else {
      elt = out.childNodes[out.childNodes.length - 1];
    }
    var select = document.createElement('select');
    elt.appendChild(select);
    var callback = function() {};
    for (var opt in options) {
      if (!options[opt]) continue;
      var option = document.createElement('option');
      select.appendChild(option);
      option.value = opt;
      var val = options[opt];
      if (val instanceof Array) {
        option.textContent = val[0];
        val = val[1];
      } else if (val instanceof Object) {
        option.textContent = val.text;
      } else {
        option.textContent = val;
        val = null;
      }
      if (selected == opt) {
        option.selected = true;
        callback = val;
      }
    }
    select.addEventListener('change', function() {
      // TODO - do this in a timeout or rate limit?
      decisions[id] = defaultDecisions[id] = select.value;
      evaluate();
    });
    out.appendChild(elt);
    if (callback instanceof Function) {
      const result = callback();
      if (result !== undefined) return result;
    } else if (callback) {
      doObject(callback);
    }
    return selected;
  }

  function outfits() {
    var outfits = {no_change: 'no change', none: 'none'};
    for (var g in skillGroups) {
      for (var c in skillGroups[g]) {
        var min = 100;
        for (var s in skillGroups[g][c]) {
          min = Math.min(min, state[s]);
        }
        if (min >= 25) {
          outfits[c] = c.replace(/_/g, ' ');
        }
      }
    }
    return outfits;
  }

  function weekBanner() {
    text(mood() + ': ' +
         ['anger ' + num(state.anger),
          'cheerfulness ' + num(state.cheerfulness),
          'willfulness ' + num(state.willfulness),
          'crowded ' + num(state.crowded),
          'cruelty ' + num(state.cruelty),
          'noble approval ' + num(state.noble_approval),
          'commoner approval ' + num(state.commoner_approval),
          'lassi ' + state.lassi,
          'army size ' + state.army_size].join(', '));
  }

  function doObject(result) {
    for (var mod in result) {
      if (moods[mod]) set(mod, result[mod]);
      else if (mod == 'effect') {
        result[mod]();
      } else if (mod == 'achievement') {
        achievement(result[mod]);
      } else if (mod != 'text') {
        if (result[mod] === +result[mod]) { // is a number
          tests.push(mod + ' ' + num(result[mod]));
          state[mod] = (state[mod] || 0) + result[mod];
        } else {
          tests.push(mod + ' = ' + result[mod]);
          state[mod] = result[mod];
        }
      }
    }
  }

  function doWeek(i) {
    tests = [];
    try {
      heading('Week ' + i);
      weekBanner();
      state.weeknum = i - 1;
      state.week = i;
      // Choose outfit
      var outfit = choice('_outfit', 'Plan', outfits());
      if (outfit != 'no_change') state.outfit = outfit;
      // Choose classes
      var classOpts = {};
      var rates = studyRates();
      for (var c in rates) {
        if (c == 'lumen' && !state.lumen_unlocked) continue;
        for (var s in skillGroups[skillParents[c]][c]) {
          classOpts[s] = s.replace(/_/g, ' ') + ': ' +
              (state[s] || 0).toFixed(2) + ' +' + rates[c].toFixed(2);
        }
      }
      var amClass = choice('_am', '', classOpts);
      var pmClass = choice('_pm', '', classOpts);
      study(amClass, rates);
      study(pmClass, rates);
      // Events
      weeks[i - 1]();
      if (state.dead) {
        showResult('Dead: ' + state.dead);
        doWeek = function() {};
        return;
      } else if (state.epilogue) {
        showEpilogue(state.epilogue);
        doWeek = function() {};
        return;
      } else if (state.skip_weekend || i == 40) {
        state.skip_weekend = false;
        return;
      }
      // Weekend activities
      var activityOpts = {};
      for (var activity in activities) {
        var result = activities[activity]();
        if (result == null) continue;
        // TODO - move the summary into common choice code - may be
        //        able to pull this out into basically just a simple
        //        call to choice... (i.e. with function support?)
        //      - pull out an interesting_stats = {..., cruelty, *_approval}
        var summary = [];
        var other = '';
        for (var mod in result) {
          if (moods[mod] || mod == 'cruelty' || mod == 'noble_approval') {
            if (result[mod]) {
              summary.push(mod + (result[mod] > 0 ? ' +' : ' ') + result[mod]);
            }
          } else {
            other = '*';
          }
        }
        if (other) summary.push(other);
        activityOpts[activity] = activity.replace(/_/g, ' ') + ': ' +
            summary.join(', ');
      }
      var activityPicked = choice('_activity', 'Weekend activity', activityOpts);
      doObject(activities[activityPicked]());
    } finally {
      text(tests.join(', '));
    }
  }

  var activities = {
    attend_service: function() {
      var base = {
        angry: {anger: -1},
        afraid: {anger: +1},
        depressed: {cheerfulness: +1},
        cheerful: {cheerfulness: -1},
        neutral: null
      }[mood(['anger', 'cheerfulness'])];
      if (base && get('sense_magic') >= 80 && !state.talked_to_ursul_about_selene)
        base.can_talk_to_ursul_about_selene = true;
      return base;
    },
    attend_ball: function() {
      if ((state.dance || 0) < 50) return null;
      return {crowded: +1, noble_approval: +1,
              cheerfulness: -Math.sign(state.crowded)};
    },
    attend_court: constant({cheerfulness: -1, willfulness: -2, crowded: +1,
                            noble_approval: +1, commoner_approval: +1}),
    explore_castle: constant({anger: -1, crowded: -1}),
    hunt: function() {
      if ((state.horses || 0) < 50) return null;
      if (state.anger == 0) return {};
      return state.anger > 0 ?
          {anger: Math.max(-state.anger, -2), cheerfulness: +1, cruelty: +1} :
          {anger: Math.min(-state.anger, 2), cheerfulness: -1, cruelty: +0.5};
    },
    play_with_toys: constant({cheerfulness: +1, willfulness: -1, crowded: -1}),
    sneak_out: function() {
      if (state.father_died)
        return {cheerfulness: -1, willfulness: +1, crowded: -1};
      return {willfulness: +2, crowded: -1};
    },
    sports: function() {
      if ((state.reflexes || 0) < 30) return null;
      return {anger: +1, crowded: Math.max(0, Math.min(1, -state.crowded))};
    },
    talk_to_father: function() {
      if (state.week == 1) return {crowded: -1};
      if (state.father == 'coma' && !state.talked_to_father_coma) return {
        crowded: -1, cheerfulness: -1, achievement: 'magic_mirror',
        talked_to_father_coma: true };
      if (state.week == 2) return {talked_to_father: true};
      if (state.crystal == 'father') return {
        willfulness: +1, crystal: 'pre-treasury'};
      if (!state.talked_to_father && (state.ursul_visited || 0) < 2
          && !state.let_ursul_return) return {talked_to_father: true};
      if (state.week > (state.ixion_battle_pending ? 10 : 9) && state.week < 16
          && (state.ixion_battle_pending
              || decisions.week9_aid_banion == 'troops')
          && !state.talked_to_father_about_ixion)
        return {willfulness: -1, crowded: +1,
                talked_to_father_about_ixion: true};
      if (state.week >= 3 && state.week <= 5 && !state.ursul_visited
          && !state.talked_to_father_love)
        return {
            cheerfulness: +1, willfulness: -1, talked_to_father_love: true};
      if (state.week >= 21 && !state.talked_to_father_about_lumens &&
          state.selene == 'disappeared')
        return {talked_to_father_about_lumens: true};
      // Any more cases?
      return null;
    },
    talk_to_magic_tutor: function() {
      if (state.ursul == 'stay') {
        if (!state.ursul_visited) { // note: effectively postincrement
          return {ursul_visited: +1, crystal: 'father'};
        } else if (state.ursul_visited == 1 && state.crystal == 'father') {
          return {ursul_visited: +1};
        } else if (state.father == 'dead' &&
                   !decisions.after_joslyn_dies_become_lumen) {
          return {ursul_visited: +1, anger: +1, effect: function() {
            choice('after_joslyn_dies_become_lumen', 'Become a lumen', {
              'yes': 'I\'ll do it',
              '': 'I won\'t'});
          }};
        } else if (state.week == 18 && decisions.week17_lucille_lumen == 'accuse') {
          var lore = get('lore') >= 100;
          return {ursul_visited: +1,
                  crowded: lore ? +1 : 0,
                  willfulness: lore ? 0 : -1,
                  anger: lore ? 0 : -1,
                  week18_ursul_darkness_lore: lore};
        } else if (state.week >= 18 && state.crystal != 'has' &&
                   !decisions.crystal_progress) {
          choice('crystal_progress', 'Crystal', {
            leave: 'Leave it to me',
            drastic: {text: 'Take drastic action', willfulness: -1,
                      crystal: 'removed',
                      cheerfulness: -1, lassi: -450, noble_approval: -10}});
        } else if (state.crystal == 'pre-treasury') {
          return {ursul_visited: +1, crystal: 'treasury', treasury: true,
                  effect: function() {
                    choice('ursul_drastic', 'Visit Treasury', {
                      wait: ['I\'ll wait until I\'m older', function() {
                        set('willfulness', -1);
                      }],
                      find: ['I\'ll try to find a way', function() {
                        set('willfulness', +1);
                      }],
                      what: 'What drastic action?'});
                  }};
        } else if (state.crystal == 'has' && !decisions.ursul_crystal) {
          return {ursul_visited: +1, effect: function() {
            choice('ursul_crystal', 'Crystal', {
              accept: {text: 'Do it', cheerfulness: +2, willfulness: +1,
                       lumen_unlocked: true, achievement: 'lumen'},
              reject: {text: 'Don\'t do it', willfulness: -1}});
          }};
        } else if (state.can_talk_to_ursul_about_selene &&
                   !state.talked_to_ursul_about_selene) {
          return {ursul_visited: +1, anger: +1, talked_to_ursul_about_selene: true,
                  effect: function() {
                    choice('ursul_about_selene', 'Selene', {
                      explain: {text: 'Order her to explain',
                                anger: test('lore', 70) &&
                                       (test('presence', 40) ||
                                        test('conversation', 60)) ? 0 : +1},
                      letitgo: {text: 'Let it go', willfulness: -1}});
                  }};
        } else if (state.lumen_unlocked && get('meditation') >= 80 &&
                   !decisions.talked_to_ursul_about_glow) {
          return {ursul_visited: +1, effect: function() {
            choice('talked_to_ursul_about_glow', 'Glow', {
              drop: {text: 'Drop the subject', willfulness: -1},
              push: {text: 'Keep pushing', willfulness: +1,
                     wrote_to_charlotte_about_healing:
                         state.charlotte_healed_elodie}});
          }};
        } else if (state.crystal == 'has' && state.week16_bad_omen &&
                   !decisions.taken_up_crystal_after_splut &&
                   state.week16_bad_omen_crystal_obtained) {
          return {ursul_visited: +1, effect: function() {
            choice('taken_up_crystal_after_splut', 'Crystal', {
              yes: {text: 'I\'m ready', lumen_unlocked: true,
                    achievement: 'lumen',
                    cheerfulness: +2, willfulness: +1},
              no: {text: 'I\'m still not ready', anger: -1}});
          }};
        } else if (!state.lumen_unlocked &&
                   decisions.crystal_progress == 'drastic') {
          var cruel = get('cruelty') >= 5;
          return {ursul_visited: +1, lumen_unlocked: true, achievement: 'lumen',
                  willfulness: cruel ? +1 : 0, crowded: cruel ? 0 : +1,
                  cheerfulness: cruel || state.cheerfulness < 0 ? +1 : 0};
        } else if (state.week >= 21 && (decisions.week17_lucille_lumen == 'accuse' ||
                                        decisions.week20_demons == 'question') &&
                   !state.talked_to_mentor_about_extra_crystals) {
          return {ursul_visited: +1, talked_to_mentor_about_extra_crystals: true,
                  crowded: +1, effect: function() { test('lore', 70); }};
        }
    ////////////////////////////////////////////////////////////////
      } else if (state.mentor == 'selene') {
        if (state.father == 'dead' &&
            !decisions.after_joslyn_dies_become_lumen) {
          return {anger: +1, effect: function() {
            choice('after_joslyn_dies_become_lumen', 'Become a lumen', {
              'yes': 'I\'ll do it',
              '': 'I won\'t'});
          }};
        } else if (state.crystal == 'has' && decisions.selene_crystal) {
          return {effect: function() {
            choice('selene_crystal', 'Crystal', {
              accept: {text: 'Do it', cheerfulness: +1, willfulness: +1,
                       lumen_unlocked: true, achievement: 'lumen'},
              reject: {text: 'Don\'t do it', willfulness: -1}});
          }};
        } else if (state.week == 18 && decisions.week17_lucille_lumen == 'accuse') {
          var lore = get('lore') >= 100;
          return {crowded: lore ? +1 : 0,
                  willfulness: lore ? 0 : -1,
                  week18_selene_darkness_lore: lore};
        } else if (state.week >= 18 && state.crystal == 'pre-treasury' &&
                   !decisions.crystal_progress &&
                   state.talked_to_selene_about_crystal_2) {
          choice('crystal_progress', 'Crystal', {
            leave: 'Keep trying on your own',
            drastic: {text: 'Let Selene have her way', willfulness: -1,
                      crystal: 'removed', cheerfulness: -1,
                      commoner_approval: -10, noble_approval: -10}});
        } else if (!state.lumen_unlocked &&
                   decisions.crystal_progress == 'drastic') {
          var cruel = get('cruelty') >= 5;
          return {lumen_unlocked: true, achievement: 'lumen',
                  willfulness: cruel ? +1 : 0, crowded: cruel ? 0 : +1,
                  cheerfulness: cruel || state.cheerfulness < 0 ? +1 : 0};
        } else if (state.crystal == 'pre-treasury') {
          return {anger: -1, crystal: 'treasury', treasury: true};
        } else if (state.crystal == 'has' && state.week16_bad_omen &&
                   !decisions.taken_up_crystal_after_splut &&
                   state.week16_bad_omen_crystal_obtained) {
          return {effect: function() {
            choice('taken_up_crystal_after_splut', 'Crystal', {
              yes: {text: 'I\'m ready', lumen_unlocked: true,
                    achievement: 'lumen', cheerfulness: +1, willfulness: +1},
              no: {text: 'I\'m still not ready', anger: -1}});
          }};
        } else if (state.lumen_unlocked && get('meditation') >= 80 &&
                   !state.talked_to_selene_about_glow) {
          return {talked_to_selene_about_glow: true,
                  wrote_to_charlotte_about_healing: state.charlotte_healed_elodie};
        } else if (state.week >= 21 && (decisions.week17_lucille_lumen == 'accuse' ||
                                        decisions.week20_demons == 'question') &&
                   !state.talked_to_mentor_about_extra_crystals) {
          return {talked_to_mentor_about_extra_crystals: true,
                  crowded: +1, effect: function() { test('lore', 70); }};
        }
      }
      return null;
    },
    tour_barracks: function() {
      if ((state.strategy || 0) < 40) return null;
      if (state.week35_shanjia_landed) return {cheerfulness: -1, crowded: +1};
      return {willfulness: -Math.sign(state.willfullness), crowded: +1};
    },
    visit_charlotte: function() {
      if (state.week <= 2) {
        if (state.visited_charlotte) return {};
        return {cheerfulness: +1, visited_charlotte: true};
      }
      if (state.week >= 38) {
        if (state.week38_charlotte_present == 'nonlumen') {
          if ((decisions.week17_accused_laurent + '').match(/imprison|execute/)) {
            return {cheerfulness: -1};
          } else {
            return {cheerfulness: state.cheerfulness < 0 ? +1 : 0};
          }
        } else if (state.week38_charlotte_present == 'lumen') {
          return {cheerfulness: +1};
        }
      }
      return null;
    },
    visit_dungeons: function() {
      if (state.ursul == 'dungeon' && !state.dungeon_visit_ursul
          && state.week < 7) {
        return {effect: function() {
          choice('ursul_dungeon1', 'Ursul', {
            hear: ['Hear her out: *', function() {
              test('lore', 20);
              choice('ursul_dungeon_free', '', {
                free: {text: 'Free her', crowded: +1, ursul: 'stay',
                       mentor: 'ursul'},
                refuse: {text: 'Refuse', anger: +1, willfulness: +1}
              })}],
            taunt: ['Taunt her: anger -1', set.bind(null, 'anger', -1)]});
        }};
      } else if (state.ursul == 'dungeon' && state.week7_ursul == 'ignatius') {
        return {effect: function() {
          choice('ursul_dungeon2', 'Ursul', {
            taunt: ['Taunt her anyway', function() {
              set('anger', +1); state.ursul = 'away';
            }],
            execute: ['Execute her', function() {
              achievement('ordered_an_execution'); state.dead = 'choked';
            }],
            leave: ['Leave her alone', function() {
              set('anger', -1); state.ursul = 'away';
            }]});
        }};
      }
      var sgn = Math.sign(state.willfulness);
      return {anger: sgn, willfulness: sgn};
    },
    visit_tomb: constant({anger: -1, cheerfulness: -1}),
    visit_treasury: function() {
      if (!state.treasury && get('accounting') < 60) return null;
      var ret = {willfulness: +1,
                 anger: +(get('presence') < 70 && get('accounting') < 60 &&
                          (state.crystal == 'treasury' || get('presence') < 40))};
      if (state.crystal == 'treasury')
        ret.effect = function() {
          if (state.crystal == 'treasury' &&
              test('presence', 70) || test('accounting', 60))
            state.crystal = 'has';
        };
      return ret;
    },
    walk_in_gardens: constant({cheerfulness: +1, crowded: -1})
  };

  function lucille_dead() {
    return /execute/.test(decisions.week37_lucille_guilty) ||
        decisions.week17_lucille_lumen == 'accuse' ||
        decisions.week37_duel_lost_lucille_reaction == 'execute';
  }

  var weeks = [
    // Week 1
    function() {
      set('cheerfulness', +1);
    },
    // Week 2
    function() {
      choice('_ursul', 'Ursul', {
        send: {text: 'Send Her Away', anger: +1, willfulness: -1, ursul: 'away'},
        arrest: {text: 'Arrest Her', anger: +1, cruelty: +1, ursul: 'dungeon'},
        stay: {text: 'Let Her Stay',
               willfulness: +1, ursul: 'stay', mentor: 'ursul'}});
    },
    // Week 3
    function() {
      if (state.ursul == 'stay') {
        choice('_snake', 'Snake', {
          'still': ['Hold Still', function() {
            if (!test('composure', 10)) {
              set('anger', -1);
              state.charlotte_bitten = true;
            }
          }],
          'look': ['Look Down', function() {
            set('anger', -1);
            state.charlotte_bitten = true;
          }]});
      } else {
        var reflexes = test('reflexes', 20);
        set('anger', reflexes ? +1 : -1);
        state.charlotte_healed_elodie = !reflexes;
      }
    },
    // Week 4
    function() {
      if (state.charlotte_bitten) test('poison', 40);
    },
    // Week 5
    function() {
      if (!test('foreign_intelligence', 10) && !test('foreign_affairs', 40)) {
        set('commoner_approval', -3);
      }
      if (test('court_manners', 10)) {
        choice('_sednan_necklace', 'Necklace', {
          'wear': {text: 'Wear it', sednan_necklace: 'wear', willfullness: +1},
          'don\'t': {text: 'Don\'t wear it', sednan_necklace: 'refuse',
                     'willfulnes': -1}});
      } else {
        set('cheerfulness', +1);
        state.sednan_necklace = 'auto';
      }
    },
    // Week 6
    function() {
      if (state.ursul == 'away') {
        test('lore', 10);
        choice('_selene_away', 'Learn magic', {
          'won\'t': {text: 'I won\'t do it', willfulness: -1,
                     let_ursul_return: false},
          'will': {text: 'I will do it', willfulness: +1,
                   let_ursul_return: true, mentor: 'selene',
                   crystal: 'father'}});
      } else if (state.ursul == 'dungeon') {
        choice('_selene_dungeon', 'Selene/Ursul', {
          'free': ['I will free her', function() {
            set('willfulness', +1, 'noble_approval', -5);
            state.ursul = 'stay';
          }],
          'won\'t': ['I won\'t free her', function() {
            set('anger', +1);
          }]});
      } else if (state.ursul_visited) {
        choice('_evrard', 'Someone by hedge', {
          climb: ['Climb up to look over the hedge', function() {
            state.week6_evrard_climb_success = test('climbing', 30);
          }],
          guards: ['Call the guards', set.bind(null, 'anger', +1)],
          hide: ['Run and hide', set.bind(null, 'anger', -1)]});
      }
    },
    // Week 7
    function() {
      if (!test('elegance', 10) && !test('reflexes', 10)) {
        choice('_maid', 'Bump into maid', {
          accept: test('court_manners', 20) &&
            ['Accept her apology', function() {
              set('cheerfulness', +1, 'commoner_approval', +5); }],
          apologize: ['Apologize to her', function() {
            set('cheerfulness', -1, 'noble_approval', -5); }],
          punish: ['Punish her', function() {
            set('anger', +1, 'cruelty', +1, 'commoner_approval', -5); }]});
      }
      if (state.ursul == 'dungeon') {
        test('internal_affairs', 40);
        choice('_ursul', 'Ignatius', {
          free: ['Free Julianna', function() {
            state.ursul = 'stay'; set('crowded', +1);
          }],
          ignatius: ['Give her title to Ignatius', function() {
            set('cheerfulness', +1, 'willfulness', +1);
          }]});
      }
    },
    // Week 8
    function() {
      if (test('production+trade', 50)) {
        choice('printing_press', 'Invest in printing press', {
          invest: {text: 'Invest', lassi: -875},
          'don\'t': 'Don\'t invest'});
      }
    },
    // Week 9
    function() {
      test('foreign_affairs', 20);
      var negotiate = !test('military', 1) ? 'negotiate' : choice(
        '_aid_banion', 'Banion', {
          negotiate: 'Try to negotiate',
          troops: 'Prepare for battle'});
      if (negotiate == 'negotiate') {
        set('willfulness', -1);
      } else { // troops
        set('willfulness', +1);
        if (state.lumen_unlocked) {
          choice('_use_battle_magic', '', {
            yes: {text: 'Use battle-magic', anger: +1},
            '': 'Don\'t use battle-magic'});
        }
      }
      if (state.sednan_necklace != 'refuse') {
        if (test('court_manners', 10)) {
          choice('_sednan_necklace', 'Sednan Necklace', {
            considering: {text: 'I\'m considering it',
                          noble_approval: +5, cheerfulness: +1},
            jewelry: {text: 'I just like jewelry',
                      noble_approval: -3, willfulness: +1}});
        } else {
          set('noble_approval', -5);
        }
      }
    },
    // Week 10
    function() {
      if (state.week9_aid_banion == 'troops') {
        if (state.week9_use_battle_magic) {
          // firstIxionNonmagicalBattle();
          var lost = Math.floor(
              (.86-(get('strategy')+get('logistics')*.2)*.0036)*1200);
          set('army_size', -lost, 'anger', +1);
        } else {
          test('wield_magic', 40, 30, function() { // pass
            set('noble_approval', +20, 'anger', +1,
                'cheerfulness', +1, 'willfulness', +2);
          }, function() { // partial
            set('army_size', Math.floor(get('strategy') * 2) - 637,
                'anger', +1, 'cheerfulness', +1);
          }, function() { // fail
            var strat = Math.floor(get('strategy')*2 + get('logistics'));
            set('army_size', strat - 1750, 'noble_approval', -5, 'anger', +2);
          });
        }
      } else { // negotiate
        choice('_ixion_diplomacy', 'Negotiate', {
          surrender: {text: 'Surrender Province',
                      noble_approval: -30, commoner_approval: -30,
                      willfulness: -1, cheerfulness: -2},
          pay: {text: 'Offer him money if Ixion withdraws', effect: function() {
            var accounting = test('accounting+trade', 50);
            var counter = accounting || test('logistics', 50);
            choice('_ixion_pay', '', {
              agree: {text: 'Agree',
                      crowded: +1, lassi: -8000, noble_approval: -10},
              counter: (accounting || logistics) &&
                {text: 'Make counter-offer', willfulness: +1,
                 lassi: accounting ? 4000 : 5000, crowded: accounting ? 0 : 1}
              // refuse: back to previous menu...
            });
          }},
          punish: test('foreign_affairs', 20) &&
            {text: 'Offer to punish the Duchess of Hellas', effect: function() {
              choice('_hellas_punishment', '', {
                titles: {text: 'Make her a commoner', noble_approval: -15,
                         crowded: +1,
                         effect: function() { test('internal_affairs', 60); }},
                marriage: {text: 'Command her to marry an Ixionite',
                           achievement: 'forced_marriage',
                           effect: function() {
                             if (test('internal_affairs', 40)) {
                               state.week10_lesbian_check = true;
                             } else {
                               set('noble_approval', -10);
                             }
                           }},
                execute: {text: 'Execute her', anger: +1, cruelty: +3,
                          achievement: 'ordered_an_execution',
                          noble_approval: -15, effect: function() {
                            test('internal_affairs', 60) }}});
            }},
          bluff: {text: 'Bluff / Intimidate', effect: function() {
            var sedna =
                state.sednan_necklace != 'refuse' && test('court_manners', 10);
            var terrax =
                test('foreign_affairs', 80) || test('foreign_intelligence', 80);
            choice('_ixion_bluff', '', {
              attack: {text: 'Threaten to attack', effect: function() {
                if (test('presence', 60)) {
                  set('noble_approval', +10, 'cheerfulness', +1);
                } else {
                  set('cheerfulness', -1);
                  state.week10_ixion_battle_pending = true;
                }
              }},
              terrax: terrax && {text: 'Threaten to ally with Terrax',
                                cheerfulness: +1, noble_approval: +10},
              talasse: sedna && {text: 'Claim you are allied with Talasse',
                                cheerfulness: +1, noble_approval: +10},
              magic: state.lumen_unlocked &&
                {text: 'Demonstrate your magical powers', effect: function() {
                  if (test('wield_magic+presence', 60)) {
                    set('noble_approval', +10);
                  } else {
                    set('cheerfulness', -1);
                    state.week10_ixion_battle_pending = true;
                  }
                }}});
          }},
          execute: {text: 'Execute him', anger: +1, cruelty: +5,
                    week10_ixion_battle_pending: true}});
      }
    },
    // Week 11
    function() {
      state.keythong_convo = function() {
        test('lore', 60) || test('novan_history', 90);
        set('cheerfulness', -1);
        state.keythong_convo = function() { return false; };
        return true;
      };
      if (state.week10_ixion_battle_pending) {
        // COPIED FROM ABOVE (firstIxionNonmagicalBattle())
        var lost = Math.floor(
          (.86-(get('strategy')+get('logistics')*.2)*.0036)*1200);
        set('army_size', -lost, 'anger', +1);
        // Not from above...
      } else {
        state.keythong_convo();
      }
    },
    // Week 12
    function() {
      state.hospital_convo = function() {
        if (test('herbs+battlefield', 50)) {
          choice('invest_hospital', 'Hospital', {
            invest: {text: 'Invest', lassi: -1200, commoner_approval: +20},
            decline: 'Don\'t invest'});
        }
        state.hospital_convo = function() {}; // don't do this again
      };
      if (state.sednan_necklace != 'refuse') {
        test('flattery', 30);
        choice('_sednan_marriage', 'Sedna proposal', {
          accept: {text: 'Accept his offer', cheerfulness: +1,
                   willfulness: +1, betrothed: 'sedna'},
          decline: {text: 'Politely decline', effect: function() {
            var manners = test('court_manners', 40);
            state.week12_sednan_marriage_manners_fail = !manners;
            if (decisions.week10_ixion_bluff == 'talasse') {
              choice('_sednan_marriage_2', '', {
                marry: {text: 'All right, I\'ll marry you', // auto?
                      betrothed: 'sedna', willfulness: -1},
                no: mood() != 'yielding' && extend(
                  // TODO - indicate annoyance status somewhere?
                  {text: 'I still won\'t marry you', sedna_annoyed: true},
                  manners ? {noble_approval: -10, willfulness: +1} :
                            {noble_approval: -15, crowded: +1})});
            } else if (!manners) {
              set('noble_approval', -10, 'sedna_annoyed', true);
            }
          }}});
      } else state.hospital_convo();      
    },
    // Week 13
    function() {
      test('novan_history', 40);
      var ia = test('internal_affairs', 100, 30);
      choice('_condemned', 'Condemned woman', {
        work: {text: 'Put her to work', cheerfulness: -1,
               noble_approval: -5, commoner_approval: +10, effect: function() {
                 state.week13_trial_lost_noble_approval = true; }},
        imprison: {text: 'Imprison her', anger: +1, effect: function() {
                    if (!test('archery', 60)) {
                      set('commoner_approval', -5);
                      state.week13_trial_prisoner_dead = true;
                    }}},
        execute: {text: 'Execute her', anger: +1, noble_approval: +10,
                  commoner_approval: -10, effect: function() {
                    state.week13_trial_prisoner_dead = true;
                    if (!test('archery', 60)) set('cruelty', +1);
                  }},
        ask: ia == 'partial' &&
          {text: 'Ask the Earl of Io about her story', effect: function() {
            if (test('court_manners', 60)) {
              set('cheerful', 1);
            } else {
              set('anger', +2, 'noble_approval', -10, 'commoner_approval', -10);
              state.week13_trial_prisoner_dead = true;
              state.week13_trial_lost_noble_approval = true;
            }}},
        tell: ia === true &&
          {text: 'Tell her justice was already done', cheerfulness: +1}});
    },
    // Week 14
    function() {
      state.week14_omen = test('divination', 60) ? 'death' :
        test('falcons', 10) ? 'day' : 'derp';
      if (state.week6_evrard_climb_success) {
        var manners = test('court_manners', 50, 10);
        if (manners == 'partial') test('intrigue', 10);
        if (manners) {
          choice('_evrard', 'Evrard', {
            guards: {text: 'Call the guads to arrest him'},
            leave: test('court_manners', 10) &&
              {text: '(Challenge and) Tell him to leave',
               commoner_approval: +5},
            let_it_go: state.court_manners < 50 &&
              {text: 'Let it go', willfulness: -1}});
        }
      }
      state.keythong_convo() || state.hospital_convo();
    },
    // Week 15
    function() {
      if (decisions.printing_press == 'invest') {
        choice('_first_printing', 'First printing', {
          poems: {text: 'Poems praising your mother', cheerfulness: -1,
                  commoner_approval: -10, noble_approval: +10},
          army: test('strategy', 30) && {text: 'Army recruitment',
                                         willfulness: +1, army_size: +500},
          religious: {text: 'Religious doctrine', willfulness: -1}});
      }
    },
    // Week 16
    function() {
      var parade = choice('_parade', 'Festival of the Good Lady', {
        lead: 'I will lead the parade',
        speech: 'I will parade and make a speech',
        no: {text: 'I would rather not go', willfulness: -1, crowded: -1,
             effect: function() {
               choice('_stay_home', '', {
                 fear: {text: 'Confess your fears', anger: -1,
                        commoner_approval: -5, noble_approval: -5},
                 yell: {text: 'Yell at her', anger: +1,
                        commoner_approval: -5, cruelty: +1},
                 excuse: test('faith', 30) && 'Make a religious excuse'});
             }}});
      if (parade != 'no') {
        set('cheerfulness', +1, 'willfulness', +1, 'crowded', +1);
        if (test('elegance', 70)) set('commoner_approval', +10);
        else test('decoration', 70, 50,
                  function() { set('commoner_approval', +10); },
                  function() { set('commoner_approval', +5); });
        if (parade == 'speech') {
          if (test('public_speaking', 50)) {
            set('noble_approval', +10, 'commoner_approval', +10);
            if (test('voice', 70)) set('commoner_approval', +5);
          } else {
            set('noble_approval', -10);
          }
        }
        if (state.wrote_to_charlotte_about_healing ||
            state.week9_use_battle_magic ||
            decisions.week10_ixion_bluff == 'magic' ||
            decisions.week10_hellas_punishment == 'execute') {
          state.week16_assassin = true;
          var reflexes = test('reflexes', 80, 30);
          var flexibility = test('flexibility', 50, 30);
          var wounded = 0;
          if (!reflexes && !flexibility) { state.dead = 'stabbed'; return; }
          else if (reflexes == 'partial' && flexibility == 'partial') {
            wounded = test('battlefield', 20) ? 1 : 2;              
          }
          choice('_parade_fight', 'Assassin', {
            fight: {text: 'Fight him', effect: function() {
              test('polearms', wounded ? 80 : 50, 30,
                   function() { // pass
                     set('noble_approval', +10);
                     choice('_assassin_kill', '', {
                       yes: {text: 'Kill him', anger: +10, cruelty: +1},
                       no: {text: 'Don\'t', anger: +5}});},
                   function() { // partial
                     if (wounded) state.dead = 'stabbed';
                     else set('anger', -10);
                   }, function() { state.dead = 'stabbed'; });
            }},
            blast: {text: 'Blast him with magic', effect: function() {
              if (wounded == 2) {
                if (!test('wield_magic', 100)) state.dead = 'bleed';
              } else if (!test('wield_magic', 60)) state.dead = 'stabbed';
            }},
            run: {text: 'Run away', effect: function() {
              if (wounded == 2) state.dead = 'bleed';
              else if (test('running', 40)) set('anger', -3);
              else if (test('commoner_approval', 25))
                set('cheerfulness', -5, 'crowded', +3);
              else state.dead = 'stabbed';
            }}});
        } else if (state.ursul == 'dungeon' || state.ursul_drastic == 'wait' ||
                   (!state.lumen_unlocked &&
                    (decisions.selene_crystal || decisions.ursul_crystal))) {
          set('anger', -1, 'commoner_approval', -10);
          state.week16_bad_omen = true;
          state.week16_bad_omen_crystal_obtained = state.crystal == 'has';
        }
      }
      if (state.ursul == 'dungeon') {
        state.ursul = 'escaped';
        set('anger', -1);
      }
    },
    // Week 17
    function() {
      // common handling
      function strip_maree() {
        state.current_maree = state.current_hellas == 'Brin' ?
          'Bennet' : 'Anciet';
      }
      var after_ball = false;
      heading('Grand Ball', 'h3');
      var approval = state.noble_approval;
      state.current_ursul = decisions.week7_ursul == 'ignatius' ?
        'Ignatius' : 'Julianna';
      state.current_hellas = {titles: true, execute: true}[
        decisions.week10_hellas_punishment] ? 'Bennett' : 'Brin';
      state.current_maree = 'Banion';
      state.current_merva = 'Laurent';
      if (state.week16_assassin) {
        state.week17_trace_assassin = !test('ciphering', 60) ? 'meaningless' :
          decisions.week10_hellas_punishment == 'execute' ? 'maree' : 'merva';
      }
      if (test('presence', 50) || test('elegance', 50) || test('composure', 50)
          || test('decoration', 70)) {} else {
            set('noble_approval', -10, 'anger', -1, 'crowded', +1);
          }
      var dance = true;
      if (state.betrothed == 'sedna') {
        choice('_dance_with_suitors', 'Betrothed to Sedna', {
          dance: 'Dance with suitors',
          refuse: {text: 'Refuse', noble_approval: -5,
                   effect: function() { dance = false; }}});
      }
      if (dance) {
        if (state.betrothed != 'sedna' && test('court_manners', 40) &&
            test('intrigue', 40)) {
          // detailed list
          choice('_dance_partner_specific', 'Dance partner', {
            Linley: {text: 'Linley of Kigal', effect: function() {
              decisions.week17_dance_partner_choice = 'your_age'; }},
            Adair: {text: 'Adair, Young Lord of Elath', effect: function() {
              decisions.week17_dance_partner_choice = 'younger'; }},
            Banion: 'Banion, Duke of Maree',
            Chaine: {text: 'Chaine, Earl of Mima', effect: function() {
              decisions.week17_dance_partner_choice = 'older'; }},
            Armand: 'Armand, Duke of Mazomba',
            Erwin: {text: 'Erwin, Earl of Ishtar', effect: function() {
              decisions.week17_dance_partner_choice = 'married'; }},
            Julianna: state.ursul == 'stay' &&
              {text: 'Julianna, Duchess of Ursul', crowded: +1, willfulness: +1},
            Brin: state.current_hellas == 'Brin' &&
              {text: 'Brin, Duchess of Hellas', crowded: +1, willfulness: +1},
            Arisse: {text: 'Arisse, Duchess of Lillah',
                     crowded: +1, willfulness: +1},
            Alice: {text: 'Alice, the maid',
                    cruelty: +1, crowded: +1, willfulness: +1,
                    noble_approval: -15, commoner_approval: -5}});            
        } else {
          // simple list
          choice('_dance_partner_choice', 'Dance partner', {
            your_age: {text: 'Someone about your age', effect: function() {
              decisions.week17_dance_partner_specific = 'Linley'; }},
            younger: {text: 'Someone younger than you', effect: function() {
              decisions.week17_dance_partner_specific = 'Adair'; }},
            older: {text: 'Someone older than you', effect: function() {
              decisions.week17_dance_partner_specific = 'Chaine'; }},
            married: {text: 'Someone already married', effect: function() {
              decisions.week17_dance_partner_specific = 'Erwin'; }},
            scandalous: {text: 'Someone scandalous', willfulness: 1, 
                         effect: function() {
              decisions.week17_dance_partner_specific =
                             state.ursul == 'stay' ? 'Julianna' :
                             state.current_hellas == 'Brin' ? 'Brin' :
                             'Lillah'; }}});
        }
        if (test('dance', 90))
          set('noble_approval', {Adair: true, Alice: true}[
            decisions.week17_dance_partner_specific] ? -5 : +5);
        if (decisions.week17_dance_partner_specific == 'Alice' &&
            test('dance', 30)) set('commoner_approval', -5, 'cruelty', +1);
        if (!test('dance', 50)) set('noble_approval', -10);
      }
      if (test('court_manners+flattery', 50)) set('noble_approval', +10);
      if (state.week14_omen == 'death') {
        test('foreign_intelligence', 70);
        choice('_titan', 'Fabian omen', {
          talk: {text: 'Talk to him', effect: function() {
            test('conversation', 50);
            if (decisions.week17_dance_partner_specific != 'Adair' ||
                state.betrothed == 'sedna')
              state.week17_adele_regency_suggested = true;
            achievement('titan');
          }},
          silence: 'Say nothing'});
      }
      if (decisions.week10_hellas_punishment == 'marriage') {
        test('court_manners', 40);
        choice('_banion_dance', 'Dance with Banion', {
          accept: {text: 'Accept', effect: function() {
            if (test('court_manners', 40)) {
              choice('_banion_plan', '', {
                drop_you: {text: 'I plan to use you, then drop you',
                           willfulness: +1, cruelty: +1},
                marry: {text: 'I plan to marry you.', effect: function() {
                  if (state.betrothed == 'sedna')
                    set('willfulness', +1,
                        'achievement', 'broken_off_engagement',
                        'betrothed', 'banion');
                }}});
            } else if (state.betrothed == 'sedna') {
              choice('_banion_plan', '', {
                Sedna: {text: 'Choose Duke of Sedna',
                        anger: +1, noble_approval: -10},
                Maree: {text: 'Choose Duke of Maree', willfulness: -1,
                        achievement: 'broken_off_engagement',
                        betrothed: 'banion'}});
            } else {
              set('willfulness', -1, 'crowded', +1, 'betrothed', 'banion');
            }
          }},
          refuse: {text: 'Refuse', effect: function() {
            set('crowded', +1);
            if (!state.betrothed == 'sedna' &&
                test('conversation', 50)) set('noble_approval', +10);
          }},
          sedna: state.betrothed == 'sedna' &&
            {text: 'Mention betrothal to Sedna', effect: function() {
              if (test('conversation', 50)) set('noble_approval', +5);
            }}});
      } else if (decisions.week10_ixion_diplomacy == 'surrender' ||
                 state.current_hellas != 'Brin') {
        choice('_banion_insult', 'Banion insult', {
          duel: {text: 'Challenge him to a duel', anger: +1, willfulness: +1,
                 achievement: 'challenged_banion',
                 effect: function() {
                   if (test('swords', 70) && test('athletics', 40)) {
                     strip_maree();
                   } else state.dead = 'stabbed';
                 }},
          ignore: test('composure', 20) &&
            {text: 'Ignore him', effect: function() {
              set('willfulness', -1, 'noble_approval', -10);
            }},
          assassin: state.week16_assassin &&
            {text: 'Accuse him of sending assassins', effect: function() {
              choice('_accuse_banion', '', {
                 imprison: {text: 'Imprison him', anger: +1},
                 execute: {text: 'Execute him', cruelty: +3, anger: +1,
                           achievement: 'ordered_an_execution'}});
              strip_maree();
             }},
          execute: {text: 'Order his execution', anger: +1, cruelty: +5,
                    achievement: 'ordered_an_execution',
                    effect: function() {
                      if (test('public_speaking+presence', 100)) {
                        strip_maree();
                      } else {
                        var change = 1;
                        var queen = 2;
                        var abstentions = 1;
                        // Ursul
                        if (state.ursul == 'stay') {
                          if (!state.taken_up_crystal_after_splut) change++;
                          else queen++;
                        } else if (state.current_ursul == 'Ignatius')
                          abstentions++;
                        // Kigal
                        if (state.betrothed == 'sedna' &&
                          decisions.week17_dance_partner_specific != 'Linley' &&
                            (decisions.week10_hellas_punishment == 'execute' ||
                             decisions.week10_ixion_diplomacy == 'surrender'))
                          change++;
                        else queen++;
                        // Sudbury
                        if (decisions.week10_hellas_punishment == 'execute' ||
                            decisions.week10_ixion_diplomacy == 'surrender')
                          change++;
                        else queen++;
                        // Mead
                        if (state.week13_trial_lost_noble_approval) change++;
                        else if (state.current_ursul == 'Ignatius') queen++;
                        else abstentions++;
                        // Lillah
                        if (state.week13_trial_lost_noble_approval ||
                            state.betrothed == 'sedna' ||
                            state.sedna_annoyed) change += 2;
                        else queen += 2;
                        // Hellas
                        if (state.current_hellas == 'Brin') change++;
                        else queen++;
                        achievement('confidence_vote');
                        if (change > queen) {
                          if (state.betrothed == 'sedna')
                            achievement('broken_off_engagement');
                          achievement('forced_into_marriage');
                          state.dead == 'loser';
                        } else strip_maree();
                      }
                    }}});
      }
      if (state.current_maree != 'Banion') return;
      // Continuing the ball...
      if (state.week17_trace_assassin == 'merva') {
        choice('_accuse_laurent', 'Merva assassins', {
          accuse: {text: 'Accuse him', effect: function() {
            test('court_manners', 60);
            choice('_accused_laurent', '', {
              mistake: {text: 'Agree that you made a mistake',
                        noble_approval: -10, willfulness: -1},
              imprison: {text: 'Imprison him', cheerfulness: -1, anger: +1},
              execute: {text: 'Execute him', anger: +1, cruelty: +1,
                        current_merva: 'Charlotte'}});
          }},
          silent: {text: 'Say nothing', anger: -1}});
        if (decisions.week17_accuse_laurent != 'silent') return;
      }
      if (test('sense_magic', 80)) {
        state.detected_lucille_lumen = true;
      }
      if (state.detected_lucille_lumen || state.wrote_to_charlotte_about_healing) {
        choice('_lucille', 'Lucille', {
          talk: {text: 'Talk to your aunt', effect: function() {
            state.week17_lucille_talk = state.detected_lucille_lumen ?
              'lumen' : 'charlotte';
            choice('_lucille_lumen', '', {
              accuse: test('sense_magic', 100) &&
                {text: 'Accuse her', lucille_pacified: true, effect: function() {
                  if (test('resist_magic', 80)) {
                    set('willfulness', +1, 'cheerfulness', -5,
                        'achievement', 'spare_crystal');
                  } else state.dead = 'loser';
                }},
              offer: {text: 'Offer her a court position',
                      achievement: 'lumen_minister', lucille_pacified: true},
              secret: 'Keep her secret'});
          }},
          let_it_go: 'Let it go'});
      }
    },
    // Week 18
    function() {
      // Gift
      if (decisions.week17_dance_partner_specific == 'Brin') {
        achievement('brin_flowers');
        test('court_manners', 90); test('poison', 50);
        choice('_brin_flowers', 'Brin flowers', {
          accept: {text: 'Accept them', willfulness: +1},
          reject: {text: 'Reject them', anger: +1},
          alice: test('cruelty', 1) &&
            {text: 'Give them to Alice', willfulness: +1, alice_gift: true},
          alice_fail: state.cruelty < 1 &&
            {text: 'Give them to Alice', crowded: +1}});
      }
      if (state.betrothed == 'banion') {
        choice('_banion_engagement_present', 'Engagement present', {
          away: {text: 'Put it away', willfulness: -1},
          display: {text: 'Display it', cheerfulness: +1},
          smash: {text: 'Smash it',
                  anger: +1, willfulness: +1, commoner_approval: -5},
          alice: test('cruelty', 3) &&
            {text: 'Give it to Alice', willfulness: +1, alice_gift: true},
          alice_fail: state.cruelty < 3 &&
            {text: 'Give it to Alice', crowded: +1},
        });
      }
      // Sirin
      choice('_snub', 'Sirin', {
        none: test('composure', 50) &&
          {text: 'Greet her politely',
           effect: test.bind(null, 'court_manners', 10)},
        silence: {text: 'Shame her with silent scorn', effect: function() {
          if (state.week18_snub_success = test('presence', 50))
            set('cheerfulness', +1);
          else set('anger', +1);
        }},
        insult: {text: 'Insult her with false flattery', effect: function() {
          if (state.week18_snub_success = test('flattery', 50))
            set('cheerfulness', +1);
          else set('anger', +1);
        }},
        trip: {text: 'Trip her as she passes', effect: function() {
          if (state.week18_snub_success = test('flexibility', 30))
            set('willfulness', +1);
          else set('anger', +1);
        }},
      });
      if (state.betrothed || decisions.week10_hellas_punishment == 'marriage') {
        set('cheerfulness', -1);
      }
      // No effect from assassin question
      // Noble approval -30 check
      // Agents
      if (test('intrigue', 40)) {
        choice('_greatest_concern', 'Greatest concern', {
          nobles: 'Nobles',
          commoners: 'Commoner uprisings',
          foreigners: 'Foreign threats',
          assassins: {text: 'Assassins', effect: function() {
            choice('_assassin_countermeasure', '', {
              training: {text: 'More training',
                         anger: (state.anger < 0 ? 1 : 0),
                         cheerfulness: (state.cheerfulness < 0 ? 1 : 0)},
              guards: {text: 'More guards',
                       anger: -1, army_size: -100, week18_personal_guard: 100},
              punishment: {text: 'More punishment', cruelty: +5, anger: +1,
                           commoner_approval:
                               (!state.week16_assassin ? -10 : 0)}});
          }},
          Julianna: state.ursul == 'escaped' &&
            {text: 'Julianna of Ursul', effect: function() {
              choice('_julianna_kill', '', {
                kill: {text: 'She has to die', cruelty: +3,
                       achievement: 'ordered_an_execution'},
                alive: 'I want her alive'});
              choice('_julianna', '', {
                soldiers: {text: 'Send soldiers on patrol', army_size: -300},
                reward: {text: 'Post a reward', effect: function() {
                  if (test('decoration', 100))
                    state.week18_julianna_painting = true;
                }},
                ask: test('internal_affairs', 40) &&
                  state.current_maree == 'Banion' &&
                  state.current_hellas == 'Brin' && 'Ask Maree and Hellas'});
            }}});
      }
      // Lucille accused
      if (decisions.week17_lucille_lumen == 'accuse') {
        achievement('summoned_a_creeping_shade');
        set('anger', -1);
        test('sense_magic', 1); test('lore', 70, 60) || test('novan_history', 80);
      }
    },
    // Week 19
    function() {
      test('accounting', 50);
      var accountingTrade = test('accounting+trade', 100);
      choice('_taxes', 'Taxes', {
        raise_adjusted: accountingTrade &&
          {text: 'Raise taxes', lassi: +3000, noble_approval: -10},
        raise: !accountingTrade &&
          {text: 'Raise taxes',
           lassi: +3000, noble_approval: -10, commoner_approval: -10},
        same: 'Keep them the same',
        // TODO - lower w/ <3000 is noble-10, crowded+1, retry
        lower: state.lassi >= 3000 &&
          {text: 'Lower taxes',
           lassi: -3000, noble_approval: +10, commoner_approval: +10}});
      if (state.broken_off_engagement) {
        choice('_sedna_breakup_pay', 'Sedna tribute', {
          pay: test('lassi', 2000) &&
            {text: 'Pay him', lassi: -2000, sedna_annoyed: false},
          refuse: {text: 'Refuse', sedna_annoyed: true}});
      }
      if (decisions.week18_julianna == 'ask') {
        set('anger', -1, 'selene', 'disappeared', 'commoner_approval', -15);
      }
    },
    // Week 20
    function() {
      choice('_demons', 'Judgment', {
        question: test('sense_magic', 80) &&
          {text: 'Question him about crystal', effect: function() {
            if (test('resist_magic', 60)) {
              set('anger', +1, 'noble_approval', +10, 'commoner_approval', +10);
            } else if (test('flexibility', 50)) {
              // nothing
            } else if (test('reflexes+running', 50)) {
              set('anger', -1, 'noble_approval', -5);
            } else {
              state.dead = 'choked';
            }
            if (!state.dead) achievement('spare_crystal');
          }},
        pardon: {text: 'Pardon him', cheerfulness: -1, commoner_approval: -10},
        imprison: {text: 'Imprison him', anger: +1},
        execute: {text: 'Execute him', willfulness: +1,
                  achievement: 'ordered_an_execution'}});
      if (decisions.week18_greatest_concern == 'foreigners' &&
          state.sedna_annoyed) {
        choice('_sedna_response', 'Sedna report', {
          invest: test('trade', 60) &&
            {text: 'Invest in food to ship to Elath', lassi: -600},
          soldiers: {text: 'Send soldiers to the border', army_size: -1200},
          nothing: 'Do nothing'});
      }
    },
    // Week 21
    function() {
      state.week21_poem = function() {
        choice('week21_poem', 'Poem', {
          hilarious: {text: 'That\'s hilarious!', cheerfulness: +1},
          terrible: {text: 'That\'s terrible!', anger: +1},
        });
        choice('week21_poem_chase', '', {
          climb: {text: 'Climb out and grab it', effect: function() {
            test('climbing', 100, 40, function() {
              set('cheerfulness', +1, 'willfulness', +1);
            }, function() {
            }, function() {
              set('anger', -2, 'willfulness', -4, 'commoner_approval', -5,
                  'injured', state.week);
            });
          }},
          ignore: {text: 'Ignore it', commoner_approval: -5}});
        state.week21_poem = function() { return false; };
        return true;
      }
      if (decisions.week20_demons == 'imprison') {
        set('commoner_approval', -10, 'lassi', -250);
      } else if (decisions.week20_demons == 'execute') {
        set('commoner_approval', -5, 'noble_approval', -5);
        if (state.ursul == 'stay')
          set('commoner_approval', -5, 'noble_approval', -5);
      } else if (decisions.week18_julianna != 'soldiers' &&
                 decisions.week18_julianna != 'reward') {
        state.week21_poem();
      }

      if (decisions.week18_julianna == 'reward' &&
                 decisions.week18_julianna_kill == 'kill' &&
                 !state.week18_julianna_painting) {
        set('commoner_approval', -10);
      } else if (decisions.week18_julianna == 'reward' &&
                 decisions.week18_julianna_kill == 'kill' &&
                 state.week18_julianna_painting) {
        achievement('killed_julianna');
        set('anger', +1, 'lassi', -300, 'commoner_approval', 10,
            'julianna', 'dead');
      }
    },
    // Week 22
    function() {
      test('novan_history', 40);
      test('internal_affairs', 90, 80);
      test('internal_affairs', 100);
      choice('elath_regent', 'Adair', {
        Arisse: 'Leave him with Arisse',
        Erwin: 'Send him to his grandfather',
        marry: !state.betrothed &&
          {text: 'Marry him', betrothed: 'adair', commoner_approval: -10},
        Armand: {text: 'Send him to your uncle', noble_approval: -10},
        Adele: state.week17_adele_regency_suggested &&
          {text: 'Make his stepsister Adele regent', cheerfulness: +1}});
    },
    // Week 23
    function() {
      if (test('lassi', 250)) {
        test('foreign_intelligence', 100, 90) && test('sense_magic', 80);
        choice('_musician', 'Musician', {
          accept: {text: 'Accept her as court musician',
                   lassi: -250, commoner_approval: +10},
          test: test('instrument+voice', 50) && test('intrigue', 20) &&
            {text: 'Test her for secret skills', lassi: -250,
             commoner_approval: +10, achievement: 'spy'},
          reject: 'Reject her'});
      } else decisions.week23_musician = 'skip';
    },
    // Week 24
    function() {
      if (state.betrothed == 'adair') {
        test('animal_handling', 30) ? set('cheerfulness', +1) : set('crowded', +1);
      }
      if (decisions.week18_greatest_concern == 'nobles' &&
          (state.noble_approval <= -40 ||
           {Armand: true, Erwin: true}[decisions.elath_regent])) {
        choice('_lillah_action', 'Lillah', {
          arrest: {text: 'Send soldiers to arrest her', army_size: -400},
          kill: {text: 'Send assassins to kill her', cruelty: +3,
                 achievement: 'ordered_an_assassination'},
          wait: 'Wait for more information'});
      }
    },
    // Week 25
    function() {
      if (decisions.week18_greatest_concern == 'foreigners' ||
          (test('logistics', 70) && test('trade', 40))) {
        if (test('lassi', 4000)) {
          choice('_shanjia_action', 'Shanjia', {
            warships: {text: 'Build more warships', lassi: -4000},
            nothing: 'Do nothing'
          });
        } else decisions.week25_shanjia_action = 'insufficient_funds';
      } else if (test('divination', 90)) {
        choice('_shanjia_omen', 'Falling star', {
          soldiers: test('lassi', 1000) &&
            {text: 'Hire more soldiers', lassi: -1000, army_size: +1000},
          nothing: {text: 'Do nothing', anger: state.anger < 0 ? +1 : 0}});
      } else set('cheerfulness', +1);
      
      if (decisions.week24_lillah_action == 'arrest') {
        set('noble_approval', -10);
      } // if kill, then successul, but nothing happens right now
    },
    // Week 26
    function() {
      if (state.betrothed != 'sedna' && state.elath_regent == 'Erwin') {
        set('noble_approval', -20, 'anger', -1);
        choice('_adair_assassination_blame', 'Adair assassination', {
          Ishtar: {text: 'Blame the Earl of Ishtar', function() {
            choice('_ishtar_punishment', '', {
              imprison: {text: 'Imprison him', anger: +1},
              execute: {text: 'Execute him', anger: +1, cruelty: +3,
                        achievement: 'ordered_an_execution'}});
          }},
          Talasse: test('foreign_intelligence', 70) &&
            {text: 'Blame Talasse', arrest: -1200},
          no_one: {text: 'Blame no one', cheerfulness: -1}});
        choice('_elath_heir', 'Elath heir', {
          Talarist: {text: 'Name Talarist the heir', commoner_approval: -10,
                     achievement: 'talarist_elath'},
          Delay: {text: 'Delay', commoner_approval: -5},
          Kigal_child: {text: 'A child of the Duke of Kigal',
                        week26_elath_heir_1: 'Novan'},
          Lillah_child: state.week24_lillah_action != 'kill' &&
            {text: 'A child of the Duchess of Lillah',
             week26_elath_heir_1: 'Novan'},
          Lillah_sibling: state.week24_lillah_action == 'kill' &&
            {text: 'A sibling of the Duke of Lillah',
             week26_elath_heir_1: 'Novan'},
          Administrator: {text: 'An administrator from Elath',
                          commoner_approval: +10,
                          week26_elath_heir_1: 'Novan'},
          Commoner: {text: 'A random commoner!', crowded: +1,
                     commoner_approval: +10, noble_approval: -10,
                     week26_elath_heir_1: 'Novan'}});
        state.week26_elath_heir_1 =
            state.week26_elath_heir_1 || decisions.week26_elath_heir;
      } else if (state.sedna_annoyed || state.betrothed == 'adair') {
        if (decisions.week20_sedna_response == 'invest') set('lassi', +800);
        else choice('_sedna_blockade', 'Sedna blockade', {
          aid: test('lassi', 890) &&
            {text: 'Send emergency aid', lassi: -890, commoner_approval: +10},
          nothing: {text: 'Do nothing', commoner_approval: -10}});
      }
      state.week21_poem() || set('cheerfulness', +1);
    },
    // Week 27
    function() {
      if (state.week26_elath_heir_1 == 'Novan') {
        if (decisions.week20_sedna_response == 'soldiers' || 
            decisions.week26_adair_assassination_blame == 'Talasse') {
          set('cheerfulness', +1);
        } else {
          set('crowded', +1);
          if (decisions.week20_sedna_response == 'invest') {
            set('army_size', -1200, 'week27_sedna_reinforcements', true);
          } else if (test('lassi', 550)) {
            set('army_size', -1200, 'week27_sedna_reinforcements', true,
                'lassi', -550, 'week27_sedna_supplies', true);
          } else {
            set('noble_approval', -10, 'commoner_approval', -10,
                'army_size', -1200, 'week27_sedna_reinforcements', true,
                'week27_sedna_supplies', false);
          }
        }
      }
      if (decisions.week18_greatest_concern = 'commoners') {
        test('divination', 80);
        choice('_party', 'Gwenelle\'s party', {
          go: {text: 'Go to Sudbury for Gwenelle\'s party', cheerfulness: +1},
          regrets: 'Send your regrets'});
      }
    },
    // Week 28
    function() {
      if (decisions.week27_party == 'regrets') {
        set('crowded', -1);
        if (!test('court_manners', 80)) set('noble_approval', -10);
        if (decisions.week14_evrard == 'leave') {
          test('falcons', 10);
          choice('_evrard', 'Evrard', {
            sneak_out: {text: 'Sneak Out', willfulness: +1, effect: function() {
              test('poison', 70);
              var cookie = choice('_evrard_cookies', '', {
                eat: 'Eat a cookie',
                taster: 'Make him eat one first',
                refuse: 'Refuse'});
              if (cookie != 'refuse') {
                set('cheerfulness', +1, 'evrard_dossier_father', true,
                    'evrard_dossier_sister', true);
              }
            }},
            ignore: 'Ignore Him'});
        }
      } else {
        // Gwenelle's party
        var ambush = !state.lucille_pacified || !test('commoner_approval', -45);
        if (ambush) {
          if (decisions.week18_assassin_countermeasure == 'guards') {
            set('anger', +1);
          } else if (test('archery+reflexes', 100)) {
            set('cheerfulness', -1, 'anger', -1);
          } else {
            set('anger', -3);
            if (!test('battlefield', 70) ||
                !(test('composure', 50) || test('meditation', 50)))
              return state.dead = 'arrow';
          }
        }
        heading('Gwenelle\'s Party', 'h3');
        choice('_dispute', 'Gwenelle dispute', {
          Gwenelle: {text: 'Side wth Gwenelle', willfulness: +1, cheerfulness: -1},
          Lieke: {text: 'Side with her mother',
                  willfulness: -1, noble_approval: -10},
          Both: test('flattery', 60) && 'Flatter them both'});
        if (test('novan_history', 90) || test('lore', 60)) {
          choice('_briony', 'Briony', {
            help: {text: 'Offer to help', willfulness: +1},
            discourage: {text: 'Try to talk her out of it', effect: function() {
              state.week28_briony_conversation = test('conversation', 75);
              if (state.week28_briony_conversation) set('anger', +1);
              else state.briony = 'dead';
            }},
            tattle: {text: 'Tattle to her parents', noble_approval: +10}});
        }
      }
      if (state.crowded < 0) set('crowded', +1);
      if (decisions.week17_lucille_lumen == 'accuse') {
        set('cheerfulness', -1);
      }
    },
    // Week 29
    function() {
      if (!test('noble_approval', -40)
          && decisions.week24_lillah_action != 'kill') {
        achievement('civil_war');
        var rebel = .45;
        if (state.elath_regent == 'Arisse') rebel += .1;
        if (decisions.week27_party != 'go') rebel += .1;
        state.rebel_percent = rebel;
        state.loyal_army = state.army_size * (1-rebel);
        state.rebel_army = state.army_size * rebel;
        if (decisions.printing_press == 'invest') {
          state.week29_loyalist_propaganda_effectiveness =
            5 * Math.max(0, Math.min(4, Math.ciel(state.commoner_approval / 10)));
        }
        if (decisions.week28_briony == 'help') {
          choice('_briony_war', 'Briony', {
            home: 'Send Briony home as a gesture of good will',
            hostage: {text: 'Hold Briony hostage',
                      cruelty: +1, achievement: 'held_a_hostage_to_ransom'}});
        }
        choice('_pardon', 'Civil war', {
          pardon: {text: 'Pardon criminals',
                   commoner_approval: -10, army_size: +623},
          'don\'t': 'Don\'t'});
      } else if (decisions.week28_briony == 'help') {
        choice('_briony_help', 'Briony', {
          with: {text: 'Go with Briony', briony: 'friend', skip_weekend: true,
                 effect() {
            test('sense_magic', 50);
            achievement('tentacle_monster');
            if (!test('herbs', 70) || !test('running', 50))
              return state.dead = 'life_essence';
            set('anger', -10);
            if (test('horses', 70))
              return achievement('survived_a_forest_adventure');
            choice('_briony_trip', 'Briony', {
              leave: {text: 'Leave her', cruelty: +3,
                      achievement: 'survived_a_forest_adventure',
                      briony: 'dead'},
              support: {text: 'Support her', cruelty: -3, effect: function() {
                if (test('dance', 30)) {
                  achievement('survived_a_forest_adventure');
                } else {
                  state.dead = 'life_essence';
                }
              }}});
          }},
          alone: {text: 'Send her alone / Tell her not to go', briony: 'dead'},
          parents: test('conversation', 40) &&
            {text: 'Ask about Briony\'s parents', anger: +1}});
      } else if (decisions.week18_greatest_concern == 'foreigners' ||
                 decisions.week25_shanjia_action ||
                 decisions.week25_shanjia_omen) {
        choice('_shanjia_pardon', 'Shanjia', {
          pardon: {text: 'Recruit soldiers from prison',
                   commoner_approval: -10, army_size: +879},
          '': 'Don\'t'});
      } else {
        if (decisions.week24_lillah_action != 'kill') {
          var cruel = test('cruelty', 3);
          choice('_pillow_action', 'Pillow', {
            keep: 'Keep it',
            alice: cruel &&
              {text: 'Give it to Alice', willfulness: +1, alice_gift: true},
            alice_fail: !cruel &&
              {text: 'Give it to Alice', crowded: +1}});
        } else {
          set('anger', -1);
        }
      }
    },
    // Week 30
    function() {
      if (decisions.week29_pardon) {
        if (decisions.week29_briony_war == 'hostage') {
          var exile = test('cruelty', 10) || test('cruelty*10+presence', 150);
          choice('_war_resolution', 'Demands', {
            peace: {text: 'I only want peace', anger: +1, noble_approval: +5},
            ransom: {text: 'A ransom payment', willfulness: +1,
                     noble_approval: -10, lassi: +2000},
            exile: exile &&
              {text: 'Exile for the rebels', anger: +1, willfulness: +1,
               noble_approval: -10},
            exile_rejected: !exile &&
              {text: 'Exile for the rebels', anger: +1, willfulness: +1,
               week30_war: true}});
        } else if (!state.betrothed) {
          var compromise = test('public_speaking', 70);
          choice('_surrender_marry', 'Surrender and marry', {
            agree: {text: 'Agree', willfulness: -1, noble_approval: +10,
                    achievement: 'forced_into_marriage', dead: 'loser'},
            refuse: {text: 'Refuse', willfulness: +1, week30_war: true},
            compromise: compromise &&
              {text: 'Suggest compromise', achievement: 'forced_into_marriage',
               betrothed: 'thaddeus', noble_approval: +10},
            compromise_failed: !compromise &&
              {text: 'Suggest compromise / Refuse', anger: +1,
               week30_war: true}});
        } else {
          choice('_surrender', 'Surrender', {
            surrender: {text: 'Surrender', dead: 'loser'},
            never: {text: 'Never!', anger: +1, week30_war: true}});
        }
      } else if (state.briony == 'dead') {
        choice('_briony_gone', 'Briony\'s death', {
          my_fault: {text: 'It\'s my fault', cheerfulness: -1, crowded: +1},
          your_fault: {text: 'It was your fault', cruelty: +1}});
      } else if (decisions.week29_briony_help == 'parents') {
        set('cheerfulness', +1);
      } else if (state.briony == 'friend') {
        set('anger', +1, 'crowded', +5);
      }
    },
    // Week 31
    function() {
      if (state.week30_war) {
        var combat_bonus = 0;
        if (!test('military', 0.1)) combat_bonus -= .05;
        if (state.lumen_unlocked) {
          combat_bonus += .05;
          test('wield_magic', 90, 40);
          var wm = get('wield_magic');
          if (wm >= 90) combat_bonus += .5;
          else if (wm >= 70) combat_bonus += .2;
          else if (wm >= 40) combat_bonus += .1;
        }
        if (mood() == 'afraid') combat_bonus -= .2;
        var loyal_army = state.army_size * (1 - state.rebel_percent);
        var rebel_army = state.army_size * state.rebel_percent;
        if (decisions.week24_lillah_action == 'arrest')
          rebel_army += 200;
        if (state.week29_loyalist_propaganda_effectiveness) {
          var recruitment = int(
            state.week29_loyalist_propaganda_effectiveness * .01 * rebel_army);
          loyal_army += recruitment;
          rebel_army -= recruitment;
        }
        var rebel_str = rebel_army * .5;
        var loyal_str = loyal_army * Math.max(.1,
            (get('logistics')+get('strategy'))*.01 + combat_bonus);
        if (loyal_str < rebel_str) {
          state.dead = 'loser';
          return;
        } else {
          state.civil_war_victory = true;
          var rebel_loss = .3;
          var loyal_loss = .3;
          loyal_loss /= (loyal_army / rebel_army);
          rebel_loss /= (rebel_army / loyal_army);
          if (get('wield_magic') >= 90) { loyal_loss *= .5; rebel_loss *= 2; }
          if (test('strategy', 100)) { loyal_loss *= .5; rebel_loss *= .5; }
          else if (test('strategy+logistics', 170)) loyal_loss *= .5;
          if (test(cruelty, 10)) rebel_loss += .1;
          var loyal_loss_soldiers = loyal_army * loyal_loss;
          var rebel_loss_soldiers = rebel_army * rebel_loss;
          if (test('battlefield+herbs', .1)) {
            var saved = get('battlefield') + get('herbs');
            loyal_loss_soldiers -= 2 * saved;
            if (!test('cruelty', 5)) rebel_loss_soldiers -= saved;
          } else if (decisions.invest_hospital == 'invest') {
            loyal_loss_soldiers *= .5;
            if (!test('cruelty', 10)) rebel_loss_soldiers *= .5;
          }
          loyal_loss_soldiers = Math.max(0, Math.min(loyal_army - 200,
                                                     loyal_loss_soldiers));
          rebel_loss_soldiers = Math.max(0, Math.min(rebel_army - 200,
                                                     rebel_loss_soldiers));
          var total_loss = loyal_loss_soldiers + rebel_loss_soldiers;
          set('army_size', -total_loss, 'lassi', +1000);
        }
      } else {
        if (test('divination', 40)) {
          set('anger', -1);
          if (decisions.week30_war_resolution || decisions.week30_surrender_marry) {
            choice('_omen', 'Omen', {
              dispatch_east: {text: 'Dispatch soldiers',
                              cheerfulness: +1, army_size: -1200},
              keep: 'Don\'t'});
          } else if (decisions.week25_shanjia_action ||
                     decisions.week18_greatest_concern == 'foreigners') {
            set('anger', +1);
          }
        }
      }
      if (decisions.week29_briony_help == 'parents' &&
          decisions.week7_ursul == 'ignatius') {
        achievement('caused_a_couple_to_divorce');
        state.week31_know_ignatius_single = true;
      }
      if (test('ciphering', 30)) {
        achievement('family_secret');
        state.family_secret_discovered = true;
      }
    },
    // Week 32
    function() {
      choice('_prize', 'Tournament reward', {
        status: 'Status and praise',
        employment: {text: 'Employment', army_size: +400},
        gold: test('lassi', 100) && {text: 'Gold', lassi: -100}});
      if (state.lucille_pacified) return;
      var can_skip = false;
      if (test('divination', 70)) can_skip = true;
      else if (test('decoration', 50)) set('cheerfulness', +1);
      if (test('production+trade', 60)) can_skip = true;
      if (test('court_manners', 80)) can_skip = true;
      if (test('dogs', 50)) can_skip = true;
      if (!can_skip) decisions.week32_chocolate = 'fail';
      var eat = can_skip ? choice('_chocolate', 'Chocolates', {
        eat: 'Eat candy now', save: 'Save it for later'}) : 'eat';
      if (eat == 'eat') {
        set('cheerfulness', -1); // +1 but then -2
        if (!test('poison', 70)) state.dead = 'poisoned';
      }
    },
    // Week 33
    function() {
      var tired = false;
      var tournament = choice('_tournament', 'Tournament', {
        parade: {text: 'Mounted Parade', effect: function() {
          if (test('horses', 50) || test('composure+elegance', 60))
            set('commoner_approval', +10);
          else set('anger', -1, 'commoner_approval', -10);
        }},
        joust: {text: 'Jousting', effect: function() {
          tired = true;
          if (!test('horses', 50))
            set('commoner_approval', -10, 'week33_joust', 'fall');
          else if (!test('polearms', 50))
            set('commoner_approval', -10, 'week33_joust', 'lose');
          else if (!test('horses+polearms', 160)) state.week33_joust = 'defeat';
          else set('week33_joust', 'win', 'commoner_approval', +15);
        }},
        fencing: {text: 'Fencing', effect: function() {
          tired = true;
          test('swords', 80, 30, function() {
            set('commoner_approval', +15);
          }, function() {}, function() {
            set('commoner_approval', -10);
          });
        }},
        archery: {text: 'Archery', effect: function() {
          if (test('archery', 100)) set('commoner_approval', +10);
        }},
        music: {text: 'Music', effect: function() {
          if (test('instrument', 90)) {
            if (test('voice', 100)) set('commoner_approval', +15);
          } else {
            test('voice', 100, 50, function() {
              set('commoner_approval', +10);
            }, function() {}, function() {
              set('commoner_approval', test('public_speaking', 40) ? -10 : -5);
            });
          }
        }},
        falconry: {text: 'Falconry', effect: function() {
          if (test('falcons', 100)) {
            set('noble_approval', +10);
          } else {
            set('crowded', +1, 'cheerfulness', -1);
          }
        }},
        none: {text: 'None', cheerfulness: -1, commoner_approval: -10}});
      if (tournament != 'none' &&
          (state.briony == 'dead' || state.civil_war_victory)) {
        // TODO - potentially doesn't trigger if Briony was abandoned in wk29?
        achievement('been_challenged');
        choice('_duel', 'Duel', {
          accept: {text: 'Accept', anger: +1, effect: function() {
            choice('_duel_weapon', '', {
              swords: {text: 'Swords', effect: function() {
                if (tired && !test('athletics', 100)) state.dead = 'stabbed';
                else if (!test('swords', 90)) state.dead = 'stabbed';
                else state.kevan = 'dead';
              }},
              staves: {text: 'Staves', effect: function() {
                if (tired && !test('athletics', 120)) state.dead = 'heavy_object';
                else if (!test('polearms', 50)) state.dead = 'heavy_object';
                else if (test('polearms+flexibility', 100)) {
                  choice('_duel_hit', '', {
                    hit: {text: 'Hit him', anger: +1, kevan: 'dead'},
                    'don\'t': {text: 'Don\'t', effect: function() {
                      if (test('presence+public_speaking', 60)) {
                        set('noble_approval', +10, 'commoner_approval', +10,
                            'week33_duel_kevan_yielded', true);
                      } else {
                        set('cheerfulness', -1, 'week33_duel_kevan_yielded', false);
                      }
                    }}});
                } else if (test('presence+public_speaking', 60)) {
                  set('noble_approval', -10, 'commoner_approval', -10);
                } else state.dead = 'heavy_object';                  
              }}});
          }},
          refuse: {text: 'Refuse', effect: function() {
            if (test('reflexes+running', 80)) {
              set('commoner_approval', -10);
            } else if (!test('falcons', 80)) state.dead = 'stabbed';
          }},
          magic: test('wield_magic', 30) &&
            {text: 'Kill him with magic', anger: +1, effect: function() {
              if (test('wield_magic', 60)) {
                set('willfulness', +1, 'cruelty', +3, 'noble_approval', -20,
                    'commoner_approval', -20, 'kevan', 'dead');
              } else state.dead = 'stabbed';
            }}});
      }
      if (decisions.week32_chocolate == 'save') {
        if (test('cruelty', 5)) set('cheerfulness', +1);
        else set('anger', -1);
      }
    },
    // Week 34
    function() {
      if (decisions.week32_chocolate) {
        if (decisions.week23_musician == 'test') {
          // TODO - set a flag here for later? either way, skip the rest
        } else if (decisions.week18_greatest_concern == 'commoners') {
          if (!test('commoner_approval', -30)) set('anger', +1);
        } else if (decisions.week18_greatest_concern == 'nobles') {
          // nothing here
        }
      }
      if (!decisions.week25_shanjia_action) set('anger', -1);
      choice('_recruit', 'Shanjia', {
        recruit: {text: 'Recruit soldiers',
                  lassi: -Math.min(state.lassi, 2000),
                  army_size: +Math.min(state.lassi, 2000)/2},
        '': 'Don\'t'});
      choice('_fleet', '', {
        direct: (state.betrothed != 'thaddeus' ||
                 test('naval_strategy+swimming', 100)) && 'Direct the fleet',
        '': 'Stay in the capital'});
      if (state.lumen_unlocked && decisions.week34_fleet) {
        var lumens = 2;
        if (decisions.week17_lucille_lumen == 'offer') lumens++;
        if (state.talked_to_ursul_about_selene) lumens++;
        if (lumens > 2) {
          choice('_concert', '', {
            magic: {text: 'Use magic against the fleet',
                    week34_concert_lumens: lumens, willfulness: +1},
            '': {text: 'Fight with navy only', anger: -1}});
        }
      }
    },
    // Week 35
    function() {
      heading('Danger on the high seas!', 'h3');
      var shanjia = 18000;
      var lumens = state.week34_concert_lumens;
      if (lumens) {
        if (!test('wield_magic', 100)) {
          var strength = test('lumen', 200, 120);
          if (lumens == 4 && strength === true) {
            return state.dead = 'drowned';
          } else if (strength === true ||
                     (lumens == 4 && strength === 'partial')) {
            shanjia = 9000;
          } else {
            return state.dead = 'magic_too_strong';
          }
        } else {
          if (test('lumen', lumens == 4 ? 200 : 300)) {
            state.week35_shanjia_defeat = true;
            achievement('sunk_with_magic');
            return; // nothing more to do
          } else if (test('lumen', lumens == 4 ? 120 : 200)) {
            shanjia = 9000;
          }
        }
      }
      var navy = state.army_size;
      if (decisions.week10_ixion_diplomacy == 'surrender' &&
          test('court_manners', 60)) {
        set('commoner_approval', -10);
        achievement('military_alliance');
        navy += 2000;
      }
      if (decisions.week25_shanjia_action == 'warships') navy += 3000;
      var climb = decisions.week34_fleet && test('climbing', 60);
      var bonus = 0;
      var naval = get('naval_strategy');
      if (!naval) bonus = -.25;
      if (naval >= 50) {
        bonus = (naval - 50) / 1000;
        if (climb) bonus += naval / 10000;
      }
      if (naval >= 100) {
        bonus += get('strategy') / 2000;
      }
      if (get('logistics') >= 90) {
        bonus += get('logistics') / 2000;
      }
      if (!decisions.week34_fleet) bonus *= .5;
      else if (get('wield_magic') >= 60 && climb) bonus += get('wield_magic') / 3333;
      var nova = navy * (1 + bonus);
      if (nova < shanjia) {
        // lose
        text('Naval battle lost');
        state.week35_shanjia_landed = true;
        if (decisions.week34_fleet) {
          if (test('strategy+naval_strategy', 150)) {
            state.week35_retreat_strategy_check_succeeded = true;
            set('commoner_approval', -5);
          } else {
            test('swimming', 100, 50);
            var swimming = get('swimming');
            if (swimming < 50) {
              return state.dead = 'drowned';
            } else if (swimming < 80) {
              if (test('composure', 70) || test('meditation', 70))
                set('anger', -5, 'injured', state.week);
              else return state.dead = 'drowned';
            } else if (swimming < 100) {
              set('cheerfulness', -5);
            }              
          }
        }
      } else {
        // win
        text('Naval battle won (' + nova + ' vs ' + shanjia + ')');
        state.week35_shanjia_naval_victory = true;
        set('cheerfulness', +3, 'commoner_approval', +20, 'noble_approval', +20);
        if (shanjia > 10000) achievement('naval_victory');
      }
    },
    // Week 36
    function() {
      if (state.week34_concert_lumens && !state.week35_shanjia_landed) {
        set('anger', -1, 'commoner_approval', -10);
      } else if (state.week35_shanjia_naval_victory) {
        choice('_shanjia_prisoners', 'Shanjia prisoners', {
          ransom_all: test('world_history', 80) &&
            {text: 'Ransom them all', lassi: +1000,
             achievement: 'held_a_hostage_to_ransom'},
          conscript_poor: {text: 'Ransom the rich, conscript the poor',
                           lassi: +700, army_size: +890, commoner_approval: -10,
                           achievement: 'held_a_hostage_to_ransom'},
          execute_poor: {text: 'Ransom the rich, execute the poor',
                         lassi: +700, cruelty: +3,
                         effect: function() {
                           achievement('held_a_hostage_to_ransom');
                           achievement('ordered_an_execution');
                         }},
          execute_all: {text: 'Execute them all', anger: +1, cruelty: +3,
                        achievement: 'ordered_an_execution'}});
        if (decisions.week36_shanjia_prisoners.match(/execute/) &&
            (state.alice_gift ||
             decisions.week17_dance_partner_specific == 'Alice'))
          state.alice_romance = true;
      } else {
        if (state.betrothed == 'sedna') {
          choice('_flee_sedna', 'Flee to Sedna', {
            flee: {text: 'Run away', dead: 'loser'},
            stay: 'Meet with diplomats'});
          if (state.dead) return;
        }
        if (!test('composure', 40) || !test('court_manners', 60)) set('anger', +1);
        choice('_shanjia_contest', 'Togami duel', {
          accept: {text: 'Accept his terms', effect: function() {
            if (state.lumen_unlocked) {
              if (!test('resist_magic', 60)) return state.dead = 'magic';
              if (!test('sense_magic', 60)) {
                if (!test('resist_magic', 100) || !test('meditation', 30))
                  return state.dead = 'life_energy';
                else set('willfulness', +1);
              }
              var sword = test('wield_magic', 50) &&
                choice('_duel_tactic', '', {
                  sword: 'Magic sword',
                  '': 'Dazzle him'});
              if (sword) {
                if (!test('reflexes+swords', 100)) return state.dead = 'magic';
              } else if (!test('wield_magic', 80) || !test('decoration', 70))
                return state.dead = 'magic';
              // if still alive, then we've won!
            } else {
              if (state.talked_to_father_about_lumens) {
                set('anger', -8, 'father', 'coma');
              } else {
                set('cheerfulness', -10, 'father', 'dead', 'anger', +1);
                achievement('find_out_who_killed_your_mother');
                var obey = test('composure', 70) && choice('_obey', '', {
                  obey: {text: 'Obey', willfulness: -2},
                  '': 'Refuse'});
                if (!obey) return state.dead = 'magic';
              }
            }
          }},
          // no point for offer marriage alliance
          offer: test('cruelty', 10) &&
                 (state.talked_to_mentor_about_extra_crystals ||
                  state.week34_concert_lumens) &&
            {text: 'Offer to give him your power / Do it',
             achievement: 'evil_minion', epilogue: 'evil'},
          sing: test('foreign_intelligence', 90) &&
                test('instrument+voice', 100) &&
                test('public_speaking', 70) &&
                test('presence', 70) &&
            {text: 'Sing to him', achievement: 'power_of_music',
             noble_approval: +15, commoner_approval: +15},
          refuse: {text: 'Refuse outright', dead: 'bleed'}});
      }
    },
    // Week 37
    function() {
      const musician_chocolate =
          decisions.week32_chocolate &&
          decisions.week23_musician == 'test'

      function musician_lucille_lumen() {
        if (state.detected_lucille_lumen && decisions.week17_lucille == 'let_it_go') {
          set('willfullness', -1);
        }
        set('cheerfulness', -1);
        function musician_lucille_lumen_guilty() {
          choice('_lucille_guilty', 'Lucille guilty', {
            execute_lucille: {text: 'Execute Lucille only'},
            execute_lucille_and_laurent:
                decisions.week17_accused_laurent != 'execute' &&
                {text: 'Execute Lucille and Laurent'},
            execute_banish: {text: 'Execute Lucille, banish the rest'},
            execute_all: {text: 'Execute the entire family'},
            banish_all: {text: 'Banish the entire family'},
          });                       
          if (lucille_dead()) {
            achievement('ordered_an_execution');
          }
        }
        choice('_musician_lucille_lumen', 'Musician/Lucille/Lumen', {
          guilty: {text: 'Decide Lucille is guilty',
                   effect: musician_lucille_lumen_guilty},
          lying: {text: 'Decide the musician is lying', 'anger': +1,
                  effect() {
                    choice('_musician_lying', 'Musician lying', {
                      imprison: {text: 'Imprison her'},
                      execute: {text: 'Execute her', cruelty: +3,
                                achievement: 'ordered_an_execution'},
                    });
                  }},
          ask: state.charlotte_healed_elodie &&
            {text: 'Ask about Charlotte\'s powers',
             effect: musician_lucille_lumen_guilty},
        });
      }

      if (decisions.week36_shanjia_prisoners) {
        set('cheerfulness', +2);
        if (musician_chocolate) {
          musician_lucille_lumen();
        }
      } else if (state.week34_concert_lumens && !state.week35_shanjia_landed) {
        if (musician_chocolate) {
          musician_lucille_lumen();
        }
        choice('_kraken', 'Kraken', {
          sacrifice: {text: 'Sacrifice yourself', dead: 'life_essence'},
          charlotte: (decisions.week37_musician_lucille_lumen ||
                      (decisions.week17_lucille == 'talk' && state.cruelty >= 10)) &&
            {text: 'Sacrifice Charlotte',
             achievement: 'ordered_a_human_sacrifice',
             cruelty: !decisions.week37_musician_lucille_lumen &&
                      !decisions.week17_accuse_laurent ? +5 : 0,
             effect() {
               if (state.alice_gift ||
                   decisions.week17_dance_partner_specific == 'Alice') {
                 state.alice_romance = true;
               }
             }},
          seal: {text: 'Try to seal it', willfullness: +1},
        });
      } else if (state.father == 'dead') {
        if (decisions.week23_musician != 'accept' &&
            (decisions.week23_musician != 'test' ||
             decisions.week32_chocolate)) { // not quite same as musician_chocolate
          set('commoner_approval',
              decisions.week18_greatest_concern == 'commoners' ? -5 : -10);
        }
        if (musician_chocolate) {
          if (mood() != 'depressed') {
            choice('_duel_lost_lucille_reaction', 'Lucille trying to kill', {
              execute: {text: 'Execute them', commoner_approval: -15,
                        noble_approval: -15, achievement: 'ordered_an_execution'},
              do_nothing: {text: 'Do nothing',
                           cheerfulness: -1, willfullness: -2},
            });
          }
        }
      } else if (decisions.week36_shanjia_contest == 'sing') {
        set('cheerfulness', +1);
        if (musician_chocolate) musician_lucille_lumen();
      } else if (decisions.week36_shanjia_contest == 'accept') {
        set('lassi', -766);
        if (decisions.week18_greatest_concern != 'commoners' &&
            state.betrothed != 'sedna') {
          set('commoner_approval', -10, 'shanjian_deserter_bandits', true);
        }
        if (musician_chocolate) musician_lucille_lumen();
      } else {
        // BUG MISSING IF ???
      }
    },
    // Week 38
    function() {
      // script.rpy line 5875
      if (decisions.week37_kraken == 'charlotte' && !lucille_dead()) {
        return state.dead = 'life_energy';
      }
      if (state.commoner_approval < -45) {
        state.week38_commoner_disapproval_saved = true;
        if (decisions.week18_greatest_concern == 'commoners') {
          choice('_boost', 'Make yourself more popular', {
            concert: /accept|test/.test(decisions.week23_musician) &&
                     decisions.week37_musician_lucille_lumen != 'lying' &&
                     {text: 'Stage a free concert', commoner_approval: +10},
            heal: test('herbs', 10) &&
                  {text: 'Heal the sick',
                   effect() {
                    if (test('herbs', 80)) {
                      achievement('blessed_by_cats');
                      set('commoner_approval', +15);
                    } else if (test('herbs+battlefield', 50)) {
                      set('commoner_approval', +10);
                    } else if (test('decoration', 50)) {
                      set('commoner_approval', +10);
                    } else {
                      state.week38_commoner_disapproval_saved = false;
                    }
                   }},
            public: {text: 'Make a public appearance',
                     effect() {
                       if (test('presence+public_speaking', 100)) {
                         set('commoner_approval', +10);
                       } else if (test('presence+elegance', 100) ||
                                  test('presence+decoration', 100)) {
                         set('commoner_approval', +10);
                       } else {
                         state.week38_commoner_disapproval_saved = false;
                       }
                     }},
          });
        } else if (state.father != 'dead' &&
                   (decisions.week37_lucille_guilty == 'execute_all' ||
                    decisions.week37_duel_lost_lucille_reaction == 'execute')) {
          set('crowded', +1);
        }
      }
      if (state.father == 'dead' && !lucille_dead()) {
        set('willfullness', -1);
        state.week38_charlotte_present = 'nonlumen';
      } else if (decisions.week17_lucille_lumen == 'offer' &&
                 state.commoner_approval >= -45) {
        state.week38_charlotte_present = 'lumen';
      }
      if (decisions.week37_kraken == 'seal') {
        set('lassi', -200);
      }
      if (state.lassi < 100) {
        set('commoner_approval', -10);
      } else {
        choice('_feast', 'Feast', {
          extravagant: state.lassi >= 500 && {
            text: 'An extravagant feast', lassi: -500,
            commoner_approval: state.father != 'dead' ? +15 : 0,
          },
          respectable: state.lassi >= 250 &&
            {text: 'A respectable feast', lassi: -250, commoner_approval: +10},
          small: state.lassi >= 100 &&
            {text: 'A small feast', lassi: -100, commoner_approval: +10},
          none: state.lassi >= 100 &&
            {text: 'No celebration', commoner_approval: -10},
        });
      }
    },
    // Week 39
    function() {
      if (state.commoner_approval <= -45 &&
          !state.week38_commoner_disapproval_saved) {
        achievement('commoner_uprising');
        if (state.lumen_unlocked) {
          const skip = choice('_mob', 'Mob (as lumen)', {
            attack: {text: 'Attack them', effect() {
              if (test('wield_magic', 30)) {
                set('commoner_approval', -10, 'noble_approval', -10,
                    'cruelty', +1);
                state.week39_mob_burnt = true;
              } else {
                if (test('presence', 100)) {
                  set('commoner_approval', +10);
                  return 'SKIP';
                } else {
                  state.dead = 'heavy_object';
                }
              }
            }},
            wait: {text: 'Wait for them to go away', dead: 'loser'},
          });
          if (skip == 'SKIP') return;
        } else {
          state.dead = 'loser';
        }
        if (state.dead) return;
      }
      if (test('decoration', 30)) set('commoner_approval', +10);
      if (state.elath_regent == 'Adair') {
        // do nothing
      } else if (state.father == 'dead' && !lucille_dead()) {
        if (state.betrothed) {
          choice('_wedding', 'Wedding', {
            this_year: 'Plan for a wedding this year',
            delay: 'Delay longer',
          });
        }
      } else if (!state.betrothed) {
        // Figure out who are options.
        if (state.current_maree == 'Banion' &&
            decisions.week17_banion_insult != 'execute' &&
            decisions.week17_dance_partner_specific == 'Brin') {
          state.week39_brin_proposal = true;
        }
        const kiran =
            decisions.week24_lillah_action == 'kill' ||
            decisions.week30_war_resolution == 'exile' ||
            state.civil_war_victory;
        const kevan = (() => {
          if (!decisions.week33_duel) return true;
          if (/refuse|magic/.test(decisions.week33_duel)) return false;
          if (decisions.week33_duel_hit ||
              decisions.week33_duel_weapon == 'swords') return false;
          if (state.week33_duel_kevan_yielded != undefined) {
            return !!state.week33_duel_kevan_yielded;
          }
          const avail = outfits();
          const possible =
              state.presence + state.public_speaking +
              ('royal_demeanor' in avail || 'conversation' in avail ? 10 : 0);
          return possible > 60;
        })();
        const briony =
            decisions.week29_briony_help == 'with' && state.briony != 'dead';
        const evrard = /eat|taster/.test(decisions.week28_evrard_cookies);

        const check = (flag, value) => flag == value ? value : null;
        choice('_husband', 'Husband', {
          Talarist: 'Talarist',
          Banion: check(state.current_maree, 'Banion'),
          Kiran: kiran && 'Kiran',
          Linley: check(decisions.week17_dance_partner_specific, 'Linley'),
          Ignatius: state.week31_know_ignatius_single && 'Ignatius',
          Kevan: kevan && 'Kevan',
          Adair: !decisions.week26_adair_assassination_blame ? 'Adair' : null,
          Anciet: 'Anciet',
          Briony: briony && 'Briony',
          Evrard: evrard && 'Evrard',
          None: {text: 'No one', willfullness: +1},
        });
      }
    },
    // Week 40
    function() {
      achievement('crowned');
      state.outfit = 'none';
    }];


  for (var i = 0; i < weeks.length; i++) {
    doWeek(i + 1);
  }
  if (!state.dead && !state.epilogue) epilogue();

  // methods for displaying text, presenting choices, headers, etc...
  // double-buffer everything: compare innerHTML before replacing...

  moveChildren(main, out);
  moveChildren(resultDiv, resultOut);
}

// UTILITY

function constant(c) { return function() { return c; }; }

function num(n) { return !n ? 0 : n < 0 ? n : '+' + n; }

function extend(x, y) {
  var z = {};
  for (k in x) z[k] = x[k];
  for (k in y) z[k] = x[k];
  return z;
}

function forEach(arr, f) {
  for (var i = 0; i < arr.length; i++) {
    f(arr[i], i, arr);
  }
}

function moveChildren(dst, src) {
  for (var i = 0; src.childNodes.length; i++) {
    if (i < dst.childNodes.length) {
      dst.replaceChild(src.childNodes[0], dst.childNodes[i]);
    } else {
      dst.appendChild(src.childNodes[0]);
    }
  }
  while (dst.childNodes.length > i) {
    dst.removeChild(dst.childNodes[i]);
  }
}

function pickAny(obj) {
  for (var k in obj) { return k; }
}

evaluate();

/*
Working on early magic, briony woods:
http://localhost:8000/#N4Ig7gphDWCMD6BDAtiAXCAFgewE4GcJ8QAacKOeAB1QxwKNPJgUQGMAXASwDcuOAnuhBUANogHww-TPA7YBxMpBgAmeACsArqK6IAdvsTDEuXEQ5MV0dSmHmAZqIgAPRsorqa9iE9fvmGyROXn4hDDEJKRk5BSVAgGZqWhAIZwBzAzYIKwoAFmThNIhM-WzcmAL2bj5BYQ5EUWhY+GREdK42OS15XAroAFYkFKpzQjKcjxgh6tC6jAamlodEDkwIPqnBwoixiAn+9S0CHRMzC36k2drwkD58fngAEy19dIhsfXjrADZgmrC9UazXkrXanW6vX6f2O+B0z1wiHw3DYwjAmFW0OGwmQECe-FWXE+WO8GFEeEmgQA7NiMLj8Q1uMStjTSSByeZ+jTroCMPdHhxzEjjkItgAOf5zW6LEHYMEdLocHp4foSuwRLQAI10XXwVAgiGgXDeqp2ICcqw4G1FgT+2B6Dn49gUjWeEFxBhVWwAnLSQLhXvpjel+r62QHDMHQ5KbiYOFb9E94IRcHxygBfIA

http://localhost:8000/#N4Ig7gphDWCMD6BDAtiAXCAFgewE4GcJ8QAacKOeAB1QxwKNPJgUQGMAXASwDcuOAnuhBUANogHww-TPA7YBxMpBgAmeACsArqK6IAdvsTDEuXEQ5MV0dSmHmAZqIgAPRsorqa9iE9fvmGyROXn4hDDEJKRk5BSVAgGZqWhAIZwBzAzYIKwoAFmThNIhM-WzcmAL2bj5BYQ5EUWhY+GREdK42OS15XAroAFYkFKpzQjKcjxgh6tC6jAamlodEDkwIPqnBwoixiAn+9S0CHRMzC36k2drwkD58fngAEy19dIhsfXjrADZgmrC9UazXkrXanW6vX6f2O+B0z1wiHw3DYwjAmFW0OGwlGRH25S2f28GFEeEmgQA7NiMMgIE9+KsuJ9+lTiSBSeYWf85rd7o8OOYkcchFsABzcm5ApagtodLocHp4friuwYNjYY4cMGGDbfCjitnqzXa-S6rEajgOfj2BSNZ4QWkGJVbACc1JARtwWraOoI-TdbKoWgARrouvgqBBENAuG9-RLARhVhx9k94IRcHwCSBYfCnojkZ00RjLK703SjPp4Ka2NBxOU1Z8Hk8NrH0v1YAAGeBcFxMqv0sTYNpsW6hrQOBwd9SEJ6VsFmPTvYQtti6U0d7u9-vwceTkwcBq1zfupzJjYiwJdnYgM+Hi8d1gjENh9OR6Ntx83u8p3CX6xDLO841nW7A5BgkCmCe1yJiA+CmtG8AWl+MHzHcXAPFqApRnCf7Tu60hpGmspFlssBeCkYwYd64KomRtghJKGB8lhw7Bh2VyMbBEZ4BweosFclFENRYJyhxN6EaIxG0R2VQpOMhCiaRV4FGyCkQEpdFXkk6r6C2yCmk8aJ4NAIAAL5AA

http://localhost:8000/#N4Ig7gphDWCMD6BDAtiAXCAxge2QB2wGcBXAJwhABpwo549UMBLAOwBcJSXEAbJAM36ImpQlRowEiTGyYA3JmwCe6EHh6Il8MIoAW8NtiVjqkGACZ4AK2I8miFt1WJS5Qm3FnollKvL8eCAAPCBMJb3pGEH9AkLCvHxl5RRUMdU1tPQMjeNoAZkjVCECAcwdMClNaABZCjGKIMpYKzxqkJIVlVTZeaGz4ZEQSpkwDYkNSVpgAViQovDcIZsrw2elZTtSQHp4+w3ghNl1OKehZhlUF0KWWqot4MhIeZ1dQjzvoAvXkrowFQkU8AAJsQWCUINgWLkYAA2dobFLdXr9QbDUZscbYSYfOGPWzA0iIdwjVRgXSId7hOG+NKLZanOEXDA8LErLwAdjmlzpt3CnKZIBZ5FOnO+m1U-0BbHIRLIKg+AA54T8tjs9tgBkMRmMJqclTSsNgyGxNY5ONDoEqBThjaaWOaGfAjWx+Io-EZeMCIMgIA4sacAJxcjCkUEsVglQN1NTEABGdlGhDwvugEajYsRGApHBYQPghE4Cl5eL4QMJxMwpPJlK8QYLQO4LHg9sw0A0LQwOChTCBnDTH1gAAZ4EwgkxIcCmOpcNItvHiIJTrBLPXG5rXPZwape5g7Pal8PR+Om-PF1m2D1WwfgyAAtnOPLwkPo3eLw+l1J5nGE-nk4hU2CH7RqGjj9qs+YQA2DjNhArbthQGCQC414Zr8ICEPa-5OuMQGoVskomtKvokKQj5eMuN46MUeaoiSA6WAKbhMO4mpokuiQImhBHZMgsZLl8HSZuhBCkGwFqwF8URMSxtGVgOBQClRPA0VqclPrUBoFlCECsXR6nRlpBa6Wp5EFF2vbIPaQKkli0DsdhLpup2kJyOaFLHkujIuIgvaqEmUCYLonn0N5vYHEwJS6B4GDxkSNa0LA1JfvG2r+f+YHkRpgloekWg6Ec2TGEuazZVsSZYmJxU3oZOmyVVAo1cZwUNUsRl1QO1KlUUQTTuQ8CYHFgRLqKUSsBwXCeoggjCKIw3RmNnDcHwU1CCI4mcjwxCYEwPCBPAm0+iwqjYIIJwDpyQLlDpeAuGw9qkP1ujYCMCHoQNua8Ea60Oa60UgCwGqBQ4W7ncCV0haJ92-rBTCupWGAAEKkKwS5Ks6v3ukonoWb6APYk+VpRJd9IDvqUQ4PgRBkGyCWil1545nmNqiajyrimkGh5VkhhFQOQYGj6QKKO5kJLkGApCwo3CyKLfNs0JuWZAVPPiUGPRxH5KA0xYw4C5Bwsy0dHzmLr9MgPeuYQaQRba94w4S8k0secbUhm4r+X6CrpzmAgBDet0nDI-Gts+-Q2Deo9RKvRFeMhxxKrOG+lsFtbL3e5+fhhhltChxLV3ez4RP58bDFRMcpCxha5iSao5eV97Cll5w9fGwJnFbBbeYpzb6c-U55tHIEsiYFXGlRLG2aBK61He7UAoEMxsvhOYWXt4njNWz3xtrOPk8QNPyne+c8zPYQS8JCVa8M0sXeFmnxtJaozMmoMZqzQ-0Z11XcLo-3gsjKwEOnUr4Dw3t3e+y8RqqFfONMiOd+RNwrlXMmqghQhyVELJM4xXoI2wEcb2QZYzI0hFoY4PA8Ckj0AQ+ARDjxaGlFOPyxA8AiXihYfUZsMIpgctQg00kX6qWoYpJg1EmrG35mbTum8IEJEJpnUCgFjZo3GBjDAq18HGzpiAqRz8QAAF8gA
  -- something changed on week 20 - no longer works to question a/b crystal
      --> (resist magic fail)
*/
