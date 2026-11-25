// Additional checkpoints without new quest unlocks. A null clock marks a locked story segment.
const extraWindows = [
  ['4-7', null, 'Chapters 1–4 · Before substories open'],
  ['5-3', 'day', 'Speak to Ito behind Tsuruya again'],
  ['5-5', 'day', 'Take the hidden passage from Tatsuya into Rakugai'],
  ['5-7', 'day', 'Ask the man near the checkpoint about a permit'],
  ['5-8', 'day', 'Look for the counterfeiter in the shopping district'],
  ['5-9', 'day', 'Get a permit from the counterfeiter at Narikin'],
  ['5-10', null, 'Fight the bodyguard outside Narikin'],
  ['5-14', null, 'Greatsword fight outside the blacksmith'],
  ['5-16', null, 'Fights inside Shishido’s cave', '5-16–19'],
  ['6-2', 'night', 'Meet Ito and Gion Toji behind Tsuruya'],
  ['6-4', 'day', 'Speak with Koetsu at his mansion'],
  ['6-6', 'day', 'Bring the dango to Koetsu and do the scarecrow training'],
  ['6-7', 'day', 'Speak to Toji at Yoshioka Dojo'],
  ['6-8', null, 'Fights at Yoshioka Dojo', '6-8–9'],
  ['7-1', null, 'Fight Ito and travel to Gion with him', '7-1–3'],
  ['7-7', 'day', 'Go behind Tsuruya to arrange the room'],
  ['7-9', null, 'Sneak into Tsuruya and fight inside', '7-9–17'],
  ['8-3', 'day', 'Speak to Yoshino outside Kamenoya'],
  ['8-6', null, 'Speak to the old man and fight Hozoin Inei', '8-6–7'],
  ['8-8', null, 'Enter Hozoin and train with En no Ozuma'],
  ['8-9', null, 'Speak to the receptionist to enter the Hozoin tournament'],
  ['8-10', null, 'Fight in the Hozoin tournament', '8-10–12'],
  ['9-6', null, 'Fight at Rendai Field', '9-6–7'],
  ['9-8', null, 'Head to Sanjusangendo'],
  ['9-9', null, 'Fight at Sanjusangendo'],
  ['10-1', null, 'Give the old man a tour of Kyoto', '10-1–8'],
  ['10-9', 'evening', 'After the tour, return to Tatsuya and then the Gion gate'],
  ['10-10', null, 'Speak to the Tsuruya attendant during the story sequence'],
  ['10-12', null, 'Fight at Kiyomizudera', '10-12–17'],
  ['11-3', null, 'Fights in Yagyu Village', '11-3–4'],
  ['12-2', 'night', 'Collect Ito’s sword at the Rakugai blacksmith'],
  ['12-3', 'night', 'Tell Ito you’re ready to leave at Tatsuya'],
  ['12-4', 'day', 'Meet Koetsu at his mansion after leaving Gion'],
  ['12-5', 'day', 'Board the boat at Riverside Tea House'],
  ['12-5', 'evening', 'Board the boat at Riverside Tea House'],
  ['12-5', 'night', 'Board the boat at Riverside Tea House'],
  ['12-6', null, 'Ganryu Island battles', '12-6–19'],
];

// Only quest completions are tracked. Item, choice, level and other gates stay in the quest instructions.
const completedRequirements = {
  7: [1, 2, 3, 4, 5, 6], 9: [8], 11: [10], 15: [14], 17: [16], 20: [19], 21: [18],
  24: [12], 25: [19], 26: [15], 27: [22], 28: [17], 30: [29], 33: [23], 34: [33],
  36: [11], 37: [24], 38: [37], 40: [21], 41: [19], 42: [19], 43: [19], 44: [13],
  45: [44], 46: [45], 47: [39], 48: [30], 49: [36], 50: [38], 51: [46], 52: [51],
  53: [52], 55: [26], 56: [40], 58: [47], 59: [58], 61: [49], 62: [49], 63: [27],
  64: [59], 65: [54], 66: [56], 68: [50], 69: [62], 70: [64], 71: [55], 72: [63],
  73: [65], 74: [73], 75: [72], 76: [57], 77: [74], 78: [77], 79: [29], 80: [76],
  83: [82], 84: [83], 85: [34], 86: [35, 71], 88: [87], 89: [88], 91: [90], 92: [75],
  94: [93], 96: [91], 98: [94], 103: [102], 105: [103], 106: [105], 107: [106], 108: [101],
  109: [108], 110: [109], 111: [104], 112: [107], 113: [111], 114: [113], 115: [110],
  116: [115], 117: [112], 118: [114], 119: [118], 120: [119],
  100: Array.from({ length: 140 }, (_, i) => i + 1).filter(id => id !== 100),
  140: [60, ...Array.from({ length: 19 }, (_, i) => i + 121)],
};

const clockGroups = [
  [['day'], [81, 123, 125, 127, 128, 130]],
  [['day', 'evening'], [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 36, 37, 40, 41, 42, 43, 44, 45,
    49, 50, 51, 53, 54, 55, 57, 58, 59, 60, 66, 70, 73, 74, 76, 77, 87, 88, 96, 98]],
  [['evening', 'night'], [24, 67, 92]],
  [['night'], [28, 29, 32, 47, 48, 79, 95, 122, 124, 129, 131, 132, 134, 135, 136, 137, 138]],
  [['evening'], [140]],
];

// Conditional progress outside the ordinary start window. The note identifies the required prior step.
const continuations = {
  20: [
    ['10-11', '12-3', ['night'], 'You can obtain the sword from bounty #136 tonight and hand in enchanted swords at the Rakugai Blacksmith.'],
    ['12-4', null, ['day', 'evening', 'night'], 'You can hand in enchanted swords you already have at the Rakugai Blacksmith. You can no longer buy Bassarimaru in Gion.'],
  ],
  36: [['12-4', null, ['day'], 'You can deliver the poultice if you obtained it from Gyotensai before Gion closed.']],
  79: [['12-4', null, ['night'], 'You can continue in Kawaramachi if you already spoke to the attendant at Kamenoya in Gion.']],
  81: [['10-11', null, ['night'], 'Continue at the field if you already spoke to the farmer and showed him the paper during the day.']],
  99: [
    ['12-1', '12-1', ['evening'], 'If you started before leaving for Yagyu Village, you can hear the Gion conversation now.'],
    // This is the conservative recommended return window, not a native
    // daylight-only condition. Other Finale travel windows were not audited.
    ['12-4', null, ['day'], 'Recommended return: visit Seizo in the 12-4 daytime window if you already heard the Gion conversation before leaving.'],
  ],
  129: [['8-1', '9-3', ['day', 'evening'], 'Read Matsu’s wanted poster at the Rakugai police box. His first encounter window is 9-4 at night.']],
  134: [['9-5', '10-9', ['day', 'evening'], 'Read Kaien’s wanted poster at the Rakugai police box. His first encounter window is 10-11 at night.']],
};

const lastWindows = { 97: '11-2', 99: '11-2' };

module.exports = { extraWindows, completedRequirements, clockGroups, continuations, lastWindows };
