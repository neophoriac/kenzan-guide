// Kenzan host enrichment: curated labelled facts, with fail-closed source checks.
// Provenance and generation: research/kenzan60/atlas-details-implementation-20261120/data/.
// This module supplements the original prose. It never edits instructions, IDs or coordinates.
const assert = require('node:assert/strict');
const weaponBindings = require('../../data/weapons/weapon-pickup-bindings.json');
const weaponStats = require('../../data/weapons/weapon-stats.json');
const patches = [
  {
    "scope": "quest",
    "match": {
      "id": 3
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Reach 1,000,000 chips to finish without a fight. If you run out, defeat the lender outside. Either outcome completes the request."
      ]
    ],
    "facts": [
      {
        "label": "No-fight target",
        "value": "1,000,000 chips",
        "note": "Optional route. If you run out of chips, defeat the lender outside; either outcome completes the request."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 5
    },
    "expected": [
      [
        "requires",
        "Max Hanamaru's heart gauge at Azamiya and bring 1 ryō."
      ],
      [
        "steps.1.text",
        "Buy the fourth medicine from the seller outside Tenguya Drugs for 1 ryō."
      ]
    ],
    "facts": [
      {
        "label": "Medicine cost",
        "value": "1 ryō",
        "note": "Buy the fourth medicine from the seller outside Tenguya Drugs, then deliver it to Hanamaru’s father."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 7
    },
    "expected": [
      [
        "requires",
        "Complete Requests #1–6, max Asagiri's heart gauge, and have 50 ryō for the final scene."
      ],
      [
        "steps.2.text",
        "Talk to Asagiri with at least 50 ryō. Win the ensuing fight. You get the money back."
      ]
    ],
    "facts": [
      {
        "label": "Cash needed",
        "value": "At least 50 ryō; returned afterward",
        "note": "For the final Asagiri scene after requests #1–6 and maxing her heart gauge. Win the fight; the money is returned."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 101
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Find Kumanosuke inside Sushi Ginya. Accept his challenge and win the fight outside for 1 ryō."
      ]
    ],
    "facts": [
      {
        "label": "Fight payout",
        "value": "1 ryō"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 8
    },
    "expected": [
      [
        "requires",
        "Complete at least one of Requests #1–7 and receive that Yūjo’s final letter to start. You’ll need all seven final letters and reports to finish."
      ],
      [
        "steps.3.text",
        "Return to collect your payment. Repeat until you’ve covered all seven yujo."
      ]
    ],
    "facts": [
      {
        "label": "Reports to finish",
        "value": "All seven yujo",
        "note": "At least one completed request and its final letter starts the request; all seven final letters and reports are needed to finish."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 8
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "For the best payment, choose Kinuyo 3/3/2/1, Suzukaze 3/1/2/1, Momochika 1/2/2/3, Hinagiku 3/1/2/1, Hanamaru 1/2/2/3, Shirayuki 2/2/3/2, Asagiri 1/2/1/3. Count from the top."
      ]
    ],
    "facts": [
      {
        "label": "Best-payment answers",
        "value": "Kinuyo 3/3/2/1; Suzukaze 3/1/2/1; Momochika 1/2/2/3; Hinagiku 3/1/2/1; Hanamaru 1/2/2/3; Shirayuki 2/2/3/2; Asagiri 1/2/1/3",
        "note": "Count choices from the top. Report only on a yūjo whose request is complete."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 103
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Bring two food items to the dog outside the den off Inari Shrine Path. Interact and take the first option twice to feed it."
      ]
    ],
    "facts": [
      {
        "label": "Food needed",
        "value": "2 food items",
        "note": "Interact with the dog and take the first option twice to feed it."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 104
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.2.text",
        "Return the key to the man at the lockers. Use Locker Key J-2 to get the Book of Offerings to Suijin. Other locker keys can now appear."
      ]
    ],
    "facts": [
      {
        "label": "Locker J-2 item",
        "value": "Book of Offerings to Suijin",
        "note": "Return the roof key to the man, then open Locker J-2; collecting the key alone does not give the book."
      },
      {
        "label": "After completion",
        "value": "Other locker keys can appear",
        "note": "Return the key to the man at the lockers and complete commission #104."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 10
    },
    "expected": [
      [
        "requires",
        "Bring 10 mon."
      ]
    ],
    "facts": [
      {
        "label": "Pepper cost",
        "value": "10 mon"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 12
    },
    "expected": [
      [
        "requires",
        "Bring 200 mon."
      ],
      [
        "steps.0.text",
        "Buy Tanaka’s coin purse for 200 mon. Walk away and pick the first option to try putting money into it."
      ]
    ],
    "facts": [
      {
        "label": "Purse cost",
        "value": "200 mon"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 13
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Take the first option to help Mametaro with his homework. Answer with options 2, 1, 1 from the top. The first answer affects #53."
      ]
    ],
    "facts": [
      {
        "label": "Answers",
        "value": "2 → 1 → 1 (count from top)",
        "note": "Count from the top. The first answer affects the Glass Kiseru requirement in #53."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 14
    },
    "expected": [
      [
        "requires",
        "Bring 1,500 mon."
      ],
      [
        "steps.1.text",
        "Buy gold-colored candy, fourth on the list, for 1,500 mon. Confirm with the left option."
      ]
    ],
    "facts": [
      {
        "label": "Gold candy cost",
        "value": "1,500 mon",
        "note": "Fourth item on the list; confirm with the left option and give it to the boy with the second option."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 20
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Meet the old man at the Rakugai Blacksmith and hand in the five swords one at a time."
      ]
    ],
    "facts": [
      {
        "label": "Swords to hand in",
        "value": "5, one at a time",
        "note": "Hand them to the old man at the Rakugai Blacksmith, one at a time."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 20
    },
    "expected": [
      [
        "requires",
        "Complete #19 Old Man of the Enchanted Swords. If needed, buy Bassarimaru at Ebisuya Pawn from Chapter 6. The other blades come from #25, #42, #43 and Bounty #136. You can hand in blades you already have directly at the Blacksmith."
      ]
    ],
    "facts": [
      {
        "label": "Swords and sources",
        "value": "Bassarimaru—Ebisuya Pawn from Chapter 6; Drunken Blade—#25; Beckoning Sword—#42; Greedy Katana—#43; Mortal Blade—#136",
        "note": "Bassarimaru is actionable from Chapter 6; buy it only if needed. Already-carried swords can be taken straight to the old man."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 24
    },
    "expected": [
      [
        "requires",
        "Complete #12 Crazy Tanaka Appears and bring 1 ryō."
      ]
    ],
    "facts": [
      {
        "label": "Bring for tip",
        "value": "1 ryō",
        "note": "After #12, buy the tip with the second option."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 25
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Follow Hikobei to the fight outside Sake Ikkonya and defeat him. Keep his Drunken Blade for #20."
      ]
    ],
    "facts": [
      {
        "label": "Keep for #20",
        "value": "Drunken Blade"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 27
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.2.text",
        "Visit the waterfall during the day or evening. Choose the first option to drop the sword in, walk away until the woman appears and refuse both replacement swords with the second option each time."
      ]
    ],
    "facts": [
      {
        "label": "Waterfall visit",
        "value": "Day or evening",
        "note": "Drop in the apprentice’s sword, then refuse both replacement swords with the second option."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 27
    },
    "target": "steps.3",
    "expected": [
      [
        "steps.3.text",
        "Leave the waterfall toward Mountain Path and defeat her partner in the next scene. This opens waterfall training."
      ]
    ],
    "facts": [
      {
        "label": "Unlocks",
        "value": "Waterfall training",
        "note": "Leave toward Mountain Path and defeat the woman’s partner."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 30
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Interrupt the man and yujo on Nakatsuji Alley East. Pick 1, 1, 1, 4 to identify him. Accept his money and talk to the yujo."
      ]
    ],
    "facts": [
      {
        "label": "Identification answers",
        "value": "1 → 1 → 1 → 4",
        "note": "Then accept his money and talk to the yūjo."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 31
    },
    "expected": [
      [
        "requires",
        "Travel by palanquin at least 30 times."
      ]
    ],
    "facts": [
      {
        "label": "Palanquin trips needed",
        "value": "At least 30",
        "note": "Travel by palanquin at least 30 times before the request can begin."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 32
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Approach the three men by Yasaka Shrine Entrance and defeat them. Follow the automatic scene into Okuni’s theater and win the onstage fight with the umbrella. Choose the second option outside to unlock Kabuki Acting."
      ]
    ],
    "facts": [
      {
        "label": "Unlocks",
        "value": "Kabuki Acting",
        "note": "After both fights, choose the second option outside the theater."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 106
    },
    "expected": [
      [
        "requires",
        "A Cry for Help (#105), 5 ryō on hand, and request #36 inactive"
      ],
      [
        "steps.0.text",
        "Approach the wakashu and older customer in Kamemachi Alley. Choose the first option to help and again to pay 5 ryō. Follow the scene to his house for the scroll."
      ]
    ],
    "facts": [
      {
        "label": "Pay customer",
        "value": "5 ryō",
        "note": "After #105, with #36 inactive, choose the first option to help and again to pay."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 106
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Sell the Incomprehensible Scroll at Ebisuya Pawn for 10 ryō."
      ]
    ],
    "facts": [
      {
        "label": "Scroll sale",
        "value": "10 ryō at Ebisuya Pawn",
        "note": "Sell the Incomprehensible Scroll received at his house to Ebisuya Pawn."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 108
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Speak to the sick Horaiya clerk by outdoor mahjong on Tsurumachi Alley. Take over with the second option. Admit customers 1, 4 and 5 with the second option. Refuse 2 and 3 with the first option and defeat them. Refuse customer 6 twice with the first option."
      ]
    ],
    "facts": [
      {
        "label": "Admit",
        "value": "Customers 1, 4, 5; second option",
        "note": "Take over the clerk’s job with the second option first."
      },
      {
        "label": "Refuse",
        "value": "Customers 2, 3; first option, then fight",
        "note": "Defeat customers 2 and 3 after refusing."
      },
      {
        "label": "Refuse twice",
        "value": "Customer 6; first option twice",
        "note": "Choose the first option twice for customer 6."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 111
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Talk to the owner at Ebisuya Pawn. Leave the shop, defeat the samurai and offer to buy his sword for the 2 ryō result."
      ]
    ],
    "facts": [
      {
        "label": "Buy-sword offer result",
        "value": "2 ryō",
        "note": "After defeating the samurai, offer to buy his sword for this result."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 34
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.2.text",
        "Catch him near the east side of the Nakatsuji crossroads within 30 seconds, then win the fight."
      ]
    ],
    "facts": [
      {
        "label": "Chase limit",
        "value": "30 seconds",
        "note": "Applies to the chase near the Nakatsuji crossroads. Report to the collector even if the impostor escapes."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 35
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "At night, meet him outside Tsuruya, to the right of the bridge, and watch the contest."
      ],
      [
        "steps.2.text",
        "Visit the magistrate’s mansion at Yoshioka Dojo at night. Use the green in-game marker and defeat him and his men."
      ]
    ],
    "facts": [
      {
        "label": "Contest and mansion scenes",
        "value": "Night",
        "note": "Both the contest outside Tsuruya and the mansion visit at Yoshioka Dojo require night."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 35
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.1.text",
        "At night, meet him outside Tsuruya, to the right of the bridge, and watch the contest."
      ],
      [
        "steps.2.text",
        "Visit the magistrate’s mansion at Yoshioka Dojo at night. Use the green in-game marker and defeat him and his men."
      ]
    ],
    "facts": [
      {
        "label": "Contest and mansion scenes",
        "value": "Night",
        "note": "Both the contest outside Tsuruya and the mansion visit at Yoshioka Dojo require night."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 36
    },
    "target": "steps.5",
    "expected": [
      [
        "steps.5.text",
        "Wait at least three minutes, change areas and return to the girl’s stall."
      ]
    ],
    "facts": [
      {
        "label": "Wait before returning",
        "value": "At least 3 minutes, then change areas",
        "note": "After delivering the poultice in daylight, wait at least three minutes AND change areas before returning to the stall."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 36
    },
    "expected": [
      [
        "steps.1.text",
        "Talk to her father in Nagayamachi to get the Togarashi Set."
      ],
      [
        "steps.2.text",
        "Get Dried Agar from the turtle seller on Shijo Avenue."
      ],
      [
        "steps.3.text",
        "After #47, take one Washi and the Togarashi Set to Gyotensai. Show him the set and choose Back Pain Remedy. Select Dried Agar for Something Adhesive to make Togarashi Poultice."
      ]
    ],
    "facts": [
      {
        "label": "Remedy materials",
        "value": "Togarashi Set + 1 Washi + Dried Agar",
        "note": "Keep the Washi obtained from #47. At Gyotensai, choose Back Pain Remedy and Dried Agar as Something Adhesive."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 36
    },
    "target": "steps.4",
    "expected": [
      [
        "steps.4.text",
        "Bring the poultice to her father in daylight."
      ]
    ],
    "facts": [
      {
        "label": "Give father poultice",
        "value": "Daylight",
        "note": "Applies to the delivery to her father, before the wait and area change."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 37
    },
    "expected": [
      [
        "requires",
        "Complete #24 The Dual Sword Man and bring 500 mon."
      ]
    ],
    "facts": [
      {
        "label": "Bring for gourd",
        "value": "500 mon"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 38
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Walk past Sake Ikkonya and follow the man into the shop. Answer his wife’s questions with options 2, 3, 1, 1, 2 from the top."
      ]
    ],
    "facts": [
      {
        "label": "Answers",
        "value": "2 → 3 → 1 → 1 → 2",
        "note": "Count choices from the top."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 39
    },
    "expected": [
      [
        "requires",
        "Carry any food item."
      ],
      [
        "steps.1.text",
        "Find Kintaro blocking the little dead-end bridge by the monk’s hut near the south end of Mountain Path. Pick the first option to cross, beat him unarmed and give him one food item."
      ]
    ],
    "facts": [
      {
        "label": "Food needed",
        "value": "1, any food item",
        "note": "After beating Kintaro unarmed, give him one food item."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 40
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Approach the woman and samurai outside the same inn as #18. Refuse with the second option and beat both men. Forgiving her in #18 adds 2 ryō here."
      ]
    ],
    "facts": [
      {
        "label": "Bonus if forgiven in #18",
        "value": "2 ryō",
        "note": "Conditional bonus: forgive the woman in #18, then refuse here with the second option and defeat both men."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 41
    },
    "expected": [
      [
        "requires",
        "Complete #19 and bring 100 mon."
      ],
      [
        "steps.0.text",
        "Pay Zenjiro 100 mon to try drawing the sword. Beat him after the demonstration, then defeat his three debt collectors."
      ]
    ],
    "facts": [
      {
        "label": "Sword attempt",
        "value": "100 mon"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 42
    },
    "expected": [
      [
        "steps.2.text",
        "Walk east to the sword seller. Refuse to pay with the second option and take the sword for free."
      ],
      [
        "steps.3.text",
        "Give it to either merchant and defeat both groups of thugs. Save the Beckoning Sword for #20."
      ]
    ],
    "facts": [
      {
        "label": "Keep for #20",
        "value": "Beckoning Sword",
        "note": "Refuse payment to take the sword free, then give it to either merchant and defeat both groups."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 43
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Follow him toward Shijo Bridge and defeat the four thugs. Keep the Greedy Katana for #20."
      ]
    ],
    "facts": [
      {
        "label": "Keep for #20",
        "value": "Greedy Katana"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 44
    },
    "expected": [
      [
        "requires",
        "Complete #13. Bring a Special Vitality Pill from Etchuya Drugs and Kusa Dango from Riverside Teahouse."
      ],
      [
        "steps.2.text",
        "Buy Mugwort Dango from the Riverside Tea House."
      ]
    ],
    "facts": [
      {
        "label": "Bring",
        "value": "Special Vitality Pill—Etchuya Drugs; Kusa/Mugwort Dango—Riverside Tea House",
        "note": "Buy the Special Vitality Pill only if needed; deliver it to the man, then fetch and deliver the dango."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 45
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Agree to help Mametaro. Answer his five questions with 2, 2, 1, 3, 2 from the top. The second answer affects #53."
      ]
    ],
    "facts": [
      {
        "label": "Answers",
        "value": "2 → 2 → 1 → 3 → 2",
        "note": "Count from the top. The second answer affects the Glass Kiseru requirement in #53."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 47
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Help Kamotaro on Forest Path and beat the swordsman. Choose first to escort him home, second to paint in his place and first to question Kinzo. Defeat the bodyguard and keep one Washi for #36 and one for #97."
      ]
    ],
    "facts": [
      {
        "label": "Washi to keep",
        "value": "1 for #36 + 1 for #97",
        "note": "Keep one Washi for each later request after escorting Kamotaro, questioning Kinzo and defeating the bodyguard."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 124
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Speak to him near the southern stairs on Riverside Path and win. Use an unarmed finishing hit for 2 ryō."
      ]
    ],
    "facts": [
      {
        "label": "Unarmed finishing hit",
        "value": "2 ryō",
        "note": "Use an unarmed finishing hit to receive this conditional payout."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 50
    },
    "expected": [
      [
        "requires",
        "Complete request 38 and bring 500 mon."
      ],
      [
        "steps.0.text",
        "Buy Tanaka’s box for 500 mon. When the foreigner approaches, choose the first option to try the box and get the Portuguese mirror."
      ]
    ],
    "facts": [
      {
        "label": "Box cost",
        "value": "500 mon"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 50
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Buy Tanaka’s box for 500 mon. When the foreigner approaches, choose the first option to try the box and get the Portuguese mirror."
      ]
    ],
    "facts": [
      {
        "label": "Trade item",
        "value": "Portuguese mirror",
        "note": "Choose the first option to try the box when the foreigner approaches."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 51
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Accept Mametaro’s homework request. Answer 6, 140, 11111 with the bottom, middle and top choices. The first answer affects #53."
      ]
    ],
    "facts": [
      {
        "label": "Answers",
        "value": "6 (bottom) → 140 (middle) → 11111 (top)",
        "note": "Choose bottom, middle, then top. The first answer affects the Glass Kiseru requirement in #53."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 52
    },
    "expected": [
      [
        "requires",
        "Complete request 51 and bring 15 mon."
      ],
      [
        "steps.0.text",
        "Buy Bunzo’s news sheet for 15 mon at the Hanami Alley and Nagayamachi junction."
      ]
    ],
    "facts": [
      {
        "label": "News sheet",
        "value": "15 mon"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 53
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Speak to Mametaro and hear the letter. The Glass Kiseru requires question one in #13 and #51 and question two in #45 answered correctly."
      ]
    ],
    "facts": [
      {
        "label": "Glass Kiseru needs",
        "value": "#13 Q1 correct; #45 Q2 correct; #51 Q1 correct",
        "note": "All three earlier answers must be correct; finishing the requests alone does not establish this condition."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 55
    },
    "expected": [
      [
        "requires",
        "Complete request 26 and bring 750 mon."
      ]
    ],
    "facts": [
      {
        "label": "Bring for candy",
        "value": "750 mon"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 55
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.2.text",
        "Give her the candy with the bottom choice. Leave the area and return to tell the old man you gave her candy and where to buy it. Use the first choice twice for 5 ryō."
      ]
    ],
    "facts": [
      {
        "label": "Correct report payout",
        "value": "5 ryō",
        "note": "Give the girl Golden Candy with the bottom choice, leave the area and return. Tell the old man she received candy and where to buy it; first choice twice."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 57
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Accept Ranzan’s offer by the canal north of Kawaramachi’s road. At his studio, agree to pose and beat him unarmed. The first two paintings are each worth 1 ryō. The third is worth 1 mon."
      ]
    ],
    "facts": [
      {
        "label": "Painting values",
        "value": "First and second: 1 ryō each; third: 1 mon",
        "note": "The first two paintings are worth 1 ryō each; the third is worth only 1 mon."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 58
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Accept Tsuchiura’s search with the first option twice. You have two minutes."
      ]
    ],
    "facts": [
      {
        "label": "Search limit",
        "value": "2 minutes",
        "note": "Applies to Tsuchiura’s cat search. Each catch returns you to him; first option continues, second stops."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 58
    },
    "target": "steps.6",
    "expected": [
      [
        "steps.6.text",
        "The game brings you back after each catch. Use the first option to continue or the second to stop. Catch at least one to play #59."
      ]
    ],
    "facts": [
      {
        "label": "Cats needed for #59",
        "value": "At least 1",
        "note": "Catch at least one cat in this request to make #59 playable."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 59
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Talk to the girl on Shijo Bridge. Use choices 1, 1, 1, 1, 2, 1 to identify the cat and offer to recover it."
      ]
    ],
    "facts": [
      {
        "label": "Identification answers",
        "value": "1 → 1 → 1 → 1 → 2 → 1",
        "note": "Afterward choose Her collar as proof, then Don’t Pay, and defeat Tsuchiura’s group."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 60
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.2.text",
        "Check the place where the gate chain was cut on your first visit. Beat the thieves and take Shishido’s Eyepatch to open Bounty #140."
      ]
    ],
    "facts": [
      {
        "label": "Item and unlock",
        "value": "Shishido’s Eyepatch → Bounty #140",
        "note": "Check the first-visit chain-cut location in the cave and defeat the thieves."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 112
    },
    "target": "steps.3",
    "expected": [
      [
        "steps.3.text",
        "Take both items to Kōetsu’s mansion in Kawaramachi. If entering advances the story, leave and return after the scene for the appraisal. He pays 12 ryō for the pot and scroll."
      ]
    ],
    "facts": [
      {
        "label": "Appraisal pays",
        "value": "12 ryō",
        "note": "For both the pot and scroll. If the mansion entrance advances the story, leave and return after the scene."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 112
    },
    "target": "steps.4",
    "expected": [
      [
        "steps.4.text",
        "Give 1 ryō to the proprietor at Sake Nakanokura. You keep 11 ryō."
      ]
    ],
    "facts": [
      {
        "label": "Return to proprietor",
        "value": "1 ryō",
        "note": "Give 1 ryō of the 12-ryō appraisal payment to the Sake Nakanokura proprietor."
      },
      {
        "label": "You keep",
        "value": "11 ryō",
        "note": "After giving the proprietor 1 ryō from the 12-ryō appraisal payment."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 125
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Approach the cave junction on Forest Path in daylight. Talk to him and win. Use throws to get past his guard."
      ]
    ],
    "facts": [
      {
        "label": "Target encounter",
        "value": "Daylight"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 61
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Buy Shiso, Sansho, Ginger and Sesame at Etchuya Drugs."
      ]
    ],
    "facts": [
      {
        "label": "Buy at Etchuya Drugs",
        "value": "Shiso, Sansho, Ginger, Sesame",
        "note": "Buy one of each ingredient."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 61
    },
    "expected": [
      [
        "steps.2.text",
        "Buy Nori from the turtle seller on Shijo Avenue."
      ],
      [
        "steps.3.text",
        "Buy an Orange at the Rakugai branch of Arigataya Market."
      ]
    ],
    "facts": [
      {
        "label": "Other ingredients",
        "value": "Nori—turtle seller; Orange—Rakugai Arigataya",
        "note": "Buy one of each ingredient."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 61
    },
    "target": "steps.4",
    "expected": [
      [
        "steps.4.text",
        "Use the first option to give the father one of each ingredient. Save all three blends for #62."
      ]
    ],
    "facts": [
      {
        "label": "Quantity",
        "value": "1 of each; keep all 3 blends for #62",
        "note": "Give one of each to the father with the first option. Keep all three blends for #62."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 62
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Speak to the employee inside Whitesnake Udon and choose “Add New Spices.” Hand over 3-Blend, then 5-Blend, then 7-Blend for the full payment. The last blend advances the quest."
      ]
    ],
    "facts": [
      {
        "label": "Hand-in order for full payment",
        "value": "3-Blend → 5-Blend → 7-Blend; last advances quest",
        "note": "Choose Add New Spices. Hand in all three in this order; the 7-Blend advances the quest."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 65
    },
    "expected": [
      [
        "steps.1.text",
        "Buy three Raw Chicken from the merchant at the north end of Riverside Path."
      ],
      [
        "steps.2.text",
        "Feed the dog all three, one at a time."
      ]
    ],
    "facts": [
      {
        "label": "Raw Chicken needed",
        "value": "3, feed one at a time",
        "note": "Buy three at the north Riverside Path merchant and feed them to the dog one at a time."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 65
    },
    "target": "steps.3",
    "expected": [
      [
        "steps.3.text",
        "Follow the dog and interact when it stops. Pick the first option to dig up Jomon Pottery."
      ]
    ],
    "facts": [
      {
        "label": "Dig item",
        "value": "Jomon Pottery",
        "note": "Follow the dog after feeding all three; interact where it stops and choose the first option."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 67
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Approach the crowd north of Hatsukaze and choose the first option to help. The indoor choices are 2, 1, 2, 1, 1, 2, 1, 1 from the top."
      ]
    ],
    "facts": [
      {
        "label": "Indoor answers",
        "value": "2 → 1 → 2 → 1 → 1 → 2 → 1 → 1",
        "note": "Count choices from the top."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 126
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Speak to Kinta by Rakugai Shrine. Use an unarmed finishing hit for 2 ryō."
      ]
    ],
    "facts": [
      {
        "label": "Unarmed finishing hit",
        "value": "2 ryō",
        "note": "Use an unarmed finishing hit to receive this conditional payout."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 129
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "At night, bump into the man who runs at you near the turnoff in Kawaramachi. Choose the second option to identify him. Finish him unarmed for 2 ryō."
      ]
    ],
    "facts": [
      {
        "label": "Target encounter",
        "value": "Night"
      },
      {
        "label": "Unarmed finishing hit",
        "value": "2 ryō",
        "note": "At night, identify him with the second option and use an unarmed finishing hit for this payout."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 71
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Find the Portuguese man in green by the Shishido cave turnoff on Forest Path. Give directions to Kiyomizudera using yes, no, yes."
      ]
    ],
    "facts": [
      {
        "label": "Directions",
        "value": "Yes → No → Yes"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 74
    },
    "expected": [
      [
        "requires",
        "Complete request 73 and carry at least 2 ryo for the Complete result."
      ],
      [
        "steps.1.text",
        "Follow Osaki south. Choose the second option to help and win. Choose the second option twice afterward to pay 2 ryō."
      ]
    ],
    "facts": [
      {
        "label": "For Complete result",
        "value": "2 ryō",
        "note": "Carry at least 2 ryō. Choose the second option to help, win the fight, then choose the second option twice to pay."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 75
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Agree to watch over Enkiridera on Ebisu Street and defeat the first husband. Choose the first option to keep watching and defeat the second husband for the Meditating Monk Picture."
      ]
    ],
    "facts": [
      {
        "label": "Continue watching for",
        "value": "Meditating Monk Picture",
        "note": "Learn Two Bones first. After the first fight, stay with the first option and defeat the second husband. Leaving early forfeits the picture."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 130
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "In daylight, find him by the branch to the waterfall on Mountain Path. Finish him unarmed for 2 ryō."
      ]
    ],
    "facts": [
      {
        "label": "Target encounter",
        "value": "Daylight"
      },
      {
        "label": "Unarmed finishing hit",
        "value": "2 ryō",
        "note": "Find him in daylight and use an unarmed finishing hit for this payout."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 131
    },
    "expected": [
      [
        "requires",
        "Read Tatsu's poster and enter the street below 20% health, with the health bar flashing red."
      ]
    ],
    "facts": [
      {
        "label": "Health to trigger",
        "value": "Below 20%; flashing red",
        "note": "Read Tatsu’s poster, then enter the street at night below 20% health with the bar flashing red."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 131
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Walk through the street at night with critical health. Refuse the massage with the second option. Defeat all four men and collect their money drops before finishing Tatsu to double the payout."
      ]
    ],
    "facts": [
      {
        "label": "Target encounter",
        "value": "Night"
      },
      {
        "label": "Double payout condition",
        "value": "Defeat four men and collect their drops before finishing Tatsu",
        "note": "Defeat all four men AND collect their money drops before finishing Tatsu."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 81
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.2.text",
        "Return after dark when the farmers bring the cow. The next story opportunity is 10-11."
      ]
    ],
    "facts": [
      {
        "label": "Return with farmers",
        "value": "After dark; next story opportunity 10-11",
        "note": "Return after dark when the farmers bring the cow; the next story opportunity is 10-11."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 83
    },
    "expected": [
      [
        "steps.4.text",
        "At Arigataya Market in Rakugai, choose “I’m here to buy a rare item” and buy the Red Hairpiece. Beat the man outside."
      ],
      [
        "steps.5.text",
        "Give Omayu the Red Hairpiece back at Waseya."
      ]
    ],
    "facts": [
      {
        "label": "Gift to buy and deliver",
        "value": "Red Hairpiece",
        "note": "Use I’m here to buy a rare item at Rakugai’s Arigataya, buy the Red Hairpiece, beat the man outside and deliver it to Omayu."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 85
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Speak to the worried man by the crowd on the east side of Nakanomachi. Agree to look for Ken to get the Fly Picture."
      ]
    ],
    "facts": [
      {
        "label": "Agree to search for Ken",
        "value": "Fly Picture",
        "note": "Agree to search; then ask at Sushi Ginya, find Ken by Gion Main Gate and defeat Wakamatsu’s group to get the diagram."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 86
    },
    "expected": [
      [
        "requires",
        "Finish How to Make Delicious Sweets (#35) and Troubled Foreigner (#71). Bring 700 mon for the egg and 100 more for flour if #62 is unfinished."
      ],
      [
        "steps.4.text",
        "Buy an egg from the woman with a chicken at the northwest end of Countryside Path for 700 mon."
      ],
      [
        "steps.2.text",
        "Get sugar from the confectioner at the west end of Ebisu Street."
      ],
      [
        "steps.3.text",
        "Get mizuame from the candy vendor in central Higashiyama Shopping District."
      ],
      [
        "steps.5.text",
        "Get flour from the woman outside Whitesnake Udon."
      ]
    ],
    "facts": [
      {
        "label": "Egg cost",
        "value": "700 mon"
      },
      {
        "label": "Extra flour if #62 unfinished",
        "value": "100 mon",
        "note": "Add this 100 mon only if #62 is unfinished."
      },
      {
        "label": "Ingredients and sources",
        "value": "Sugar—confectioner; mizuame—candy vendor; egg—Countryside chicken seller; flour—Whitesnake Udon",
        "note": "The egg costs 700 mon; flour adds 100 mon only if #62 is unfinished."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 87
    },
    "expected": [
      [
        "requires",
        "Bring two ohagi. Buy them for 18 mon each from Nonaka Tea House at Yoshioka Dojo, using the middle option to open the shop."
      ]
    ],
    "facts": [
      {
        "label": "Ohagi needed",
        "value": "2",
        "note": "Buy only if needed. Offer them separately at the Jizō statues, following the eye-closing sequence."
      },
      {
        "label": "Ohagi unit price",
        "value": "18 mon each, Nonaka Tea House",
        "note": "Buy only if needed; use the middle option at Nonaka Tea House, Yoshioka Dojo, to open the shop."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 90
    },
    "expected": [
      [
        "steps.1.text",
        "Talk to the man with chickens just inside Countryside Path from the dojo side for a boiled egg."
      ],
      [
        "steps.2.text",
        "Give the boiled egg to the woman."
      ]
    ],
    "facts": [
      {
        "label": "Deliver",
        "value": "Boiled egg from Countryside chicken farmer"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 134
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Speak to the monk by the Countryside Path statues at night and beat him."
      ]
    ],
    "facts": [
      {
        "label": "Target encounter",
        "value": "Night"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 97
    },
    "expected": [
      [
        "requires",
        "Invent Sober Pill, Hunger Pill and Ultra All-Purpose Medicine. Keep a Washi from #47, and start this request before completing all 21 inventions."
      ],
      [
        "steps.1.text",
        "Pick up the rake beside the stable in the middle of Countryside Path."
      ],
      [
        "steps.3.text",
        "Pick up the bamboo sticks south of the Rakugai Blacksmith."
      ],
      [
        "steps.4.text",
        "Give him the bamboo and the Washi from #47. Use the second option to agree to a test."
      ]
    ],
    "facts": [
      {
        "label": "Invent first",
        "value": "Sober Pill; Hunger Pill; Ultra All-Purpose Medicine",
        "note": "Also keep one Washi from #47 and start before completing all 21 inventions."
      },
      {
        "label": "Start before",
        "value": "Completing all 21 inventions",
        "note": "Start this request before all 21 inventions are complete; Sober Pill, Hunger Pill and Ultra All-Purpose Medicine must already be invented."
      },
      {
        "label": "Flight materials",
        "value": "Rake; bamboo sticks; Washi from #47",
        "note": "Keep the Washi from #47. Deliver the rake first, then bamboo and Washi; choose the second option to agree to a test."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 97
    },
    "target": "steps.5",
    "expected": [
      [
        "steps.5.text",
        "In Chapter 11 daylight, talk to the people at the south end of Cliffside Path."
      ]
    ],
    "facts": [
      {
        "label": "Launch scene",
        "value": "Chapter 11 daylight",
        "note": "Applies to the Cliffside Path launch scene; complete the material deliveries and agree to the test first."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 119
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Read the pigeon letter near Tatsuya. Bring any food item."
      ]
    ],
    "facts": [
      {
        "label": "Bring",
        "value": "Any food item"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 120
    },
    "expected": [
      [
        "requires",
        "Food Delivery (#119) and a regular hairpin other than the Maiden’s Hairpin"
      ],
      [
        "steps.0.text",
        "Read the pigeon letter near Tatsuya. Bring a regular hairpin from Arigataya or Ebisuya. The Maiden’s Hairpin is excluded."
      ]
    ],
    "facts": [
      {
        "label": "Bring",
        "value": "Regular hairpin from Arigataya or Ebisuya; Maiden’s Hairpin excluded",
        "note": "A regular hairpin from Arigataya or Ebisuya qualifies; the Maiden’s Hairpin does not."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 135
    },
    "expected": [
      [
        "requires",
        "Read Arashiyama's poster and carry a bottle of sake. Nakanokura sells takeout drinks."
      ]
    ],
    "facts": [
      {
        "label": "Bring",
        "value": "A bottle of sake; Nakanokura sells takeout",
        "note": "Read his poster and take a bottle of sake to Suiten Inari at night; Nakanokura sells takeout."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 135
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Speak to him at Suiten Inari at night. Pick the first option and select the sake from your inventory. Win the fight."
      ]
    ],
    "facts": [
      {
        "label": "Target encounter",
        "value": "Night"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 136
    },
    "expected": [
      [
        "requires",
        "Reach level 30 and read Heinosuke's poster."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 30",
        "note": "Reach level 30 and read Heinosuke’s poster."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 136
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Speak to the lone traveler in southern Cliffside Path, then walk away and respond to the ambush prompt. Beat him to obtain the Mortal Blade for #20."
      ]
    ],
    "facts": [
      {
        "label": "Keep for #20",
        "value": "Mortal Blade"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 137
    },
    "expected": [
      [
        "requires",
        "Reach level 35 and read Rikken's poster."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 35",
        "note": "Reach level 35 and read Rikken’s poster."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 138
    },
    "expected": [
      [
        "requires",
        "Fight at least 80 ordinary street encounters and read Toyokichi's poster. Only random street battles qualify."
      ]
    ],
    "facts": [
      {
        "label": "Street encounters needed",
        "value": "At least 80 ordinary random encounters",
        "note": "Only ordinary random street battles count. Read Toyokichi’s poster as well."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 99
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.2.text",
        "Find Seizo outside the small hall near the south end of Mountain Path where you stayed with the monk."
      ]
    ],
    "facts": [
      {
        "label": "Final Seizo meeting",
        "value": "Any time once available",
        "note": "The Mountain Path actor has no time-of-day restriction. Hear the Gion conversation first; later story travel restrictions can still limit access."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 100
    },
    "expected": [
      [
        "requires",
        "Finish requests #1–99, commissions #101–120 and bounties #121–140. Defeat every Hozoin Coliseum fighter at least once."
      ]
    ],
    "facts": [
      {
        "label": "Quest ranges needed",
        "value": "Requests #1–99; commissions #101–120; bounties #121–140"
      },
      {
        "label": "Coliseum prerequisite",
        "value": "Every fighter at least once",
        "note": "Also finish requests #1–99, commissions #101–120 and bounties #121–140."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 100
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "Return at night and inspect the empty police box for a letter. If you first spoke at night, leave Rakugai and come back."
      ],
      [
        "steps.2.text",
        "After dark, bring healing items to Shijo Bridge and confront Amon. He restores his health and switches style three times."
      ]
    ],
    "facts": [
      {
        "label": "Letter and Amon fight",
        "value": "Night/after dark",
        "note": "Return to the police box at night; if the first talk was already at night, leave Rakugai and return. Confront Amon after dark."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 100
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.1.text",
        "Return at night and inspect the empty police box for a letter. If you first spoke at night, leave Rakugai and come back."
      ],
      [
        "steps.2.text",
        "After dark, bring healing items to Shijo Bridge and confront Amon. He restores his health and switches style three times."
      ]
    ],
    "facts": [
      {
        "label": "Letter and Amon fight",
        "value": "Night/after dark",
        "note": "Return to the police box at night; if the first talk was already at night, leave Rakugai and return. Confront Amon after dark."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 140
    },
    "expected": [
      [
        "requires",
        "Complete request 60 and the other 19 bounties. Read Raiden's poster."
      ]
    ],
    "facts": [
      {
        "label": "Other bounties needed",
        "value": "19, plus request #60",
        "note": "Complete #60 and all other 19 bounties, then read Raiden’s poster."
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 140
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.1.text",
        "In the evening, speak to Baiken’s man at the Shishido cave branch on Forest Path and choose the first option to enter."
      ]
    ],
    "facts": [
      {
        "label": "Cave-branch encounter",
        "value": "Evening"
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 76
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Agree to help the woman near Shijo Bridge find a good view of Kiyomizudera."
      ],
      [
        "steps.1.text",
        "Facing the temple, go below the stairs on your right. Talk to the elderly local and choose “Tell Her” to recommend his viewpoint and receive Mother of Pearl. Choose to keep looking if you want to visit the other viewpoints."
      ],
      [
        "steps.2.text",
        "Alternate viewpoint. Recommend this local’s spot to receive the Thief’s Netsuke and a Finished result."
      ],
      [
        "steps.3.text",
        "Alternate viewpoint. Recommend this local’s spot to receive Hariti’s Amulet and a Finished result."
      ]
    ],
    "factSections": [
      {
        "label": "Viewpoint B",
        "note": "Recommend this spot with Tell Her. Choose to keep looking if you want the other viewpoints.",
        "facts": [
          {
            "label": "Reward",
            "value": "Mother of Pearl"
          }
        ]
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 76
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "Agree to help the woman near Shijo Bridge find a good view of Kiyomizudera."
      ],
      [
        "steps.1.text",
        "Facing the temple, go below the stairs on your right. Talk to the elderly local and choose “Tell Her” to recommend his viewpoint and receive Mother of Pearl. Choose to keep looking if you want to visit the other viewpoints."
      ],
      [
        "steps.2.text",
        "Alternate viewpoint. Recommend this local’s spot to receive the Thief’s Netsuke and a Finished result."
      ],
      [
        "steps.3.text",
        "Alternate viewpoint. Recommend this local’s spot to receive Hariti’s Amulet and a Finished result."
      ]
    ],
    "factSections": [
      {
        "label": "Viewpoint C",
        "note": "Alternate viewpoint; recommend this local’s spot.",
        "facts": [
          {
            "label": "Reward",
            "value": "Thief’s Netsuke"
          },
          {
            "label": "Result",
            "value": "Finished"
          }
        ]
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 76
    },
    "target": "steps.3",
    "expected": [
      [
        "steps.0.text",
        "Agree to help the woman near Shijo Bridge find a good view of Kiyomizudera."
      ],
      [
        "steps.1.text",
        "Facing the temple, go below the stairs on your right. Talk to the elderly local and choose “Tell Her” to recommend his viewpoint and receive Mother of Pearl. Choose to keep looking if you want to visit the other viewpoints."
      ],
      [
        "steps.2.text",
        "Alternate viewpoint. Recommend this local’s spot to receive the Thief’s Netsuke and a Finished result."
      ],
      [
        "steps.3.text",
        "Alternate viewpoint. Recommend this local’s spot to receive Hariti’s Amulet and a Finished result."
      ]
    ],
    "factSections": [
      {
        "label": "Viewpoint D",
        "note": "Alternate viewpoint; recommend this local’s spot.",
        "facts": [
          {
            "label": "Reward",
            "value": "Hariti’s Amulet"
          },
          {
            "label": "Result",
            "value": "Finished"
          }
        ]
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 78
    },
    "expected": [
      [
        "steps.0.text",
        "Hear out the man at the north tea stall on Riverside Path and agree to invest. Choose 5,000 mon for Excellent Steel, or 1 ryō (10,000 mon) for Celestial Steel."
      ],
      [
        "steps.1.text",
        "Leave Riverside Path and return. Choose “Trust Him” to give him another chance at no extra cost. Taking the half refund ends the quest without steel."
      ],
      [
        "steps.2.text",
        "Leave and reenter again. Either final reply works: the 5,000-mon investment returns 1 ryō and Excellent Steel; the 1-ryō investment returns 2 ryō and Celestial Steel. Both successful routes give 1,000 XP."
      ]
    ],
    "factSections": [
      {
        "label": "5,000-mon investment",
        "note": "Leave Riverside Path and return, choose Trust Him at no extra cost, then leave and re-enter again. Taking the half refund ends the quest without steel. Either final reply works after trusting him.",
        "facts": [
          {
            "label": "Investment",
            "value": "5,000 mon"
          },
          {
            "label": "Successful return",
            "value": "1 ryō"
          },
          {
            "label": "Material",
            "value": "Excellent Steel"
          },
          {
            "label": "XP",
            "value": "1,000"
          }
        ]
      },
      {
        "label": "1-ryō investment",
        "note": "Leave Riverside Path and return, choose Trust Him at no extra cost, then leave and re-enter again. Taking the half refund ends the quest without steel. Either final reply works after trusting him.",
        "facts": [
          {
            "label": "Investment",
            "value": "1 ryō (10,000 mon)"
          },
          {
            "label": "Successful return",
            "value": "2 ryō"
          },
          {
            "label": "Material",
            "value": "Celestial Steel"
          },
          {
            "label": "XP",
            "value": "1,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 78
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Hear out the man at the north tea stall on Riverside Path and agree to invest. Choose 5,000 mon for Excellent Steel, or 1 ryō (10,000 mon) for Celestial Steel."
      ],
      [
        "steps.1.text",
        "Leave Riverside Path and return. Choose “Trust Him” to give him another chance at no extra cost. Taking the half refund ends the quest without steel."
      ],
      [
        "steps.2.text",
        "Leave and reenter again. Either final reply works: the 5,000-mon investment returns 1 ryō and Excellent Steel; the 1-ryō investment returns 2 ryō and Celestial Steel. Both successful routes give 1,000 XP."
      ]
    ],
    "factSections": [
      {
        "label": "5,000-mon investment",
        "note": "Leave Riverside Path and return, choose Trust Him at no extra cost, then leave and re-enter again. Taking the half refund ends the quest without steel. Either final reply works after trusting him.",
        "facts": [
          {
            "label": "Investment",
            "value": "5,000 mon"
          },
          {
            "label": "Successful return",
            "value": "1 ryō"
          },
          {
            "label": "Material",
            "value": "Excellent Steel"
          },
          {
            "label": "XP",
            "value": "1,000"
          }
        ]
      },
      {
        "label": "1-ryō investment",
        "note": "Leave Riverside Path and return, choose Trust Him at no extra cost, then leave and re-enter again. Taking the half refund ends the quest without steel. Either final reply works after trusting him.",
        "facts": [
          {
            "label": "Investment",
            "value": "1 ryō (10,000 mon)"
          },
          {
            "label": "Successful return",
            "value": "2 ryō"
          },
          {
            "label": "Material",
            "value": "Celestial Steel"
          },
          {
            "label": "XP",
            "value": "1,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 78
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "Hear out the man at the north tea stall on Riverside Path and agree to invest. Choose 5,000 mon for Excellent Steel, or 1 ryō (10,000 mon) for Celestial Steel."
      ],
      [
        "steps.1.text",
        "Leave Riverside Path and return. Choose “Trust Him” to give him another chance at no extra cost. Taking the half refund ends the quest without steel."
      ],
      [
        "steps.2.text",
        "Leave and reenter again. Either final reply works: the 5,000-mon investment returns 1 ryō and Excellent Steel; the 1-ryō investment returns 2 ryō and Celestial Steel. Both successful routes give 1,000 XP."
      ]
    ],
    "factSections": [
      {
        "label": "5,000-mon investment",
        "note": "Leave Riverside Path and return, choose Trust Him at no extra cost, then leave and re-enter again. Taking the half refund ends the quest without steel. Either final reply works after trusting him.",
        "facts": [
          {
            "label": "Investment",
            "value": "5,000 mon"
          },
          {
            "label": "Successful return",
            "value": "1 ryō"
          },
          {
            "label": "Material",
            "value": "Excellent Steel"
          },
          {
            "label": "XP",
            "value": "1,000"
          }
        ]
      },
      {
        "label": "1-ryō investment",
        "note": "Leave Riverside Path and return, choose Trust Him at no extra cost, then leave and re-enter again. Taking the half refund ends the quest without steel. Either final reply works after trusting him.",
        "facts": [
          {
            "label": "Investment",
            "value": "1 ryō (10,000 mon)"
          },
          {
            "label": "Successful return",
            "value": "2 ryō"
          },
          {
            "label": "Material",
            "value": "Celestial Steel"
          },
          {
            "label": "XP",
            "value": "1,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 82
    },
    "target": "steps.3",
    "expected": [
      [
        "steps.0.text",
        "Accept Suisen’s request at the west end of Suiten Alley."
      ],
      [
        "steps.1.text",
        "Enter Countryside Path from Yoshioka Dojo and ask the elderly woman beside the first rice paddy on your right."
      ],
      [
        "steps.2.text",
        "Look toward the parents’ house from the northeast side of the paddy and interact."
      ],
      [
        "steps.3.text",
        "Report to Suisen. Saying they make an honest living earns 1 ryō. The truth pays 5,000 mon and also completes the request."
      ]
    ],
    "factSections": [
      {
        "label": "Honest-living report",
        "note": "Report to Suisen that her parents make an honest living.",
        "facts": [
          {
            "label": "Payout",
            "value": "1 ryō"
          }
        ]
      },
      {
        "label": "Truthful report",
        "note": "The truth also completes the request.",
        "facts": [
          {
            "label": "Payout",
            "value": "5,000 mon"
          }
        ]
      }
    ]
  },
  {
    "scope": "quest",
    "match": {
      "id": 96
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Talk to the elderly woman west of Yoshioka Dojo."
      ],
      [
        "steps.1.text",
        "Buy an egg from the same Countryside Path chicken farmer as #90. Choose “Buy” to pay 500 mon. To pay 100, choose “Haggle,” offer 200, choose “Haggle Further,” then offer 100."
      ],
      [
        "steps.2.text",
        "Back at the dojo, choose “Are you really feeling sick, lady?” Speak to her again and choose “Hand Over Egg” before leaving."
      ]
    ],
    "factSections": [
      {
        "label": "Buy directly",
        "note": "Choose Buy.",
        "facts": [
          {
            "label": "Price",
            "value": "500 mon"
          }
        ]
      },
      {
        "label": "Haggle",
        "note": "Haggle → offer 200 → Haggle Further → offer 100. The 200-mon offer is intermediate.",
        "facts": [
          {
            "label": "Final price",
            "value": "100 mon"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "oblivious-cat",
      "retry": false
    },
    "target": "steps.3",
    "expected": [
      [
        "steps.0.text",
        "After Itō tells you about Kōetsu, meet Shichigoro in the back alley near Tsuruya."
      ],
      [
        "steps.1.text",
        "Follow Shichigoro to Gion Inari Shrine for the painting, Paintbrush and Inkwell."
      ],
      [
        "steps.2.text",
        "Examine the cat beside Shichigoro at Gion Inari Shrine."
      ],
      [
        "steps.3.text",
        "Follow the timed prompts in this order: Cross. Then choose option 1, about the cat keeping its prey behind it."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Cross",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 1, about the cat keeping its prey behind it."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "spectacular-squirrel",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat, report back to Shichigoro at Gion Inari Shrine to collect the painting."
      ],
      [
        "steps.1.text",
        "On Forest Path, interact with the squirrel observation spot at the map pin."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Cross → Triangle. Then choose option 3, about being distracted by something overhead."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Cross → Triangle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 3, about being distracted by something overhead."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "two-bones",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat, reach level 15 and speak to Shichigoro at Gion Inari Shrine for the painting."
      ],
      [
        "steps.1.text",
        "Examine the dog on Yamato Alley South in Rakugai."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Triangle. Then choose option 3, about using two bones instead of one."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Triangle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 3, about using two bones instead of one."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "two-bones",
      "retry": false
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat, reach level 15 and speak to Shichigoro at Gion Inari Shrine for the painting."
      ],
      [
        "steps.1.text",
        "Examine the dog on Yamato Alley South in Rakugai."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Triangle. Then choose option 3, about using two bones instead of one."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 15",
        "note": "After learning Oblivious Cat, reach level 15 and speak to Shichigoro at Gion Inari Shrine for the painting."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "two-bones",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat, reach level 15 and speak to Shichigoro at Gion Inari Shrine for the painting."
      ],
      [
        "steps.1.text",
        "Examine the dog on Yamato Alley South in Rakugai."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Triangle. Then choose option 3, about using two bones instead of one."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 15",
        "note": "After learning Oblivious Cat, reach level 15 and speak to Shichigoro at Gion Inari Shrine for the painting."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "true-dual-sword-dance",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "After Kōetsu tells you about the bandits in his basement, complete substory #18, Water from the Ladle 1, to receive the portrait. Any answer in that substory gives you the portrait."
      ],
      [
        "steps.1.text",
        "Watch the woman with two fans outside Tsuruya’s rear entrance in Gion."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Triangle → Square → Circle. Then choose option 3, about the dancer leaving no opening."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Triangle → Square → Circle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 3, about the dancer leaving no opening."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "monkey-drop",
      "retry": false
    },
    "target": "steps.4",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 17 and get the painting from Shichigoro."
      ],
      [
        "steps.1.text",
        "Eat four times at Shirohebi Udon in Rakugai for Ticket (Leaping Monkey)."
      ],
      [
        "steps.2.text",
        "Speak to the attendant outside Rakugai’s Sideshow Tent. The first showing is free with the ticket."
      ],
      [
        "steps.3.text",
        "Choose “An Extraordinary Trick! The Amazing Jumping Monkey!” Repeat showings cost 50 mon."
      ],
      [
        "steps.4.text",
        "Follow the timed prompts in this order: Cross → Triangle. Then choose option 2, about how high the little monkey jumps with a pole."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Cross → Triangle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 2, about how high the little monkey jumps with a pole."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "monkey-drop",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 17 and get the painting from Shichigoro."
      ],
      [
        "steps.1.text",
        "Eat four times at Shirohebi Udon in Rakugai for Ticket (Leaping Monkey)."
      ],
      [
        "steps.2.text",
        "Speak to the attendant outside Rakugai’s Sideshow Tent. The first showing is free with the ticket."
      ],
      [
        "steps.3.text",
        "Choose “An Extraordinary Trick! The Amazing Jumping Monkey!” Repeat showings cost 50 mon."
      ],
      [
        "steps.4.text",
        "Follow the timed prompts in this order: Cross → Triangle. Then choose option 2, about how high the little monkey jumps with a pole."
      ]
    ],
    "facts": [
      {
        "label": "Orders for ticket",
        "value": "4 at Shirohebi Udon",
        "note": "Earn Ticket (Leaping Monkey); the first showing is free with it."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "monkey-drop",
      "retry": false
    },
    "target": "steps.3",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 17 and get the painting from Shichigoro."
      ],
      [
        "steps.1.text",
        "Eat four times at Shirohebi Udon in Rakugai for Ticket (Leaping Monkey)."
      ],
      [
        "steps.2.text",
        "Speak to the attendant outside Rakugai’s Sideshow Tent. The first showing is free with the ticket."
      ],
      [
        "steps.3.text",
        "Choose “An Extraordinary Trick! The Amazing Jumping Monkey!” Repeat showings cost 50 mon."
      ],
      [
        "steps.4.text",
        "Follow the timed prompts in this order: Cross → Triangle. Then choose option 2, about how high the little monkey jumps with a pole."
      ]
    ],
    "facts": [
      {
        "label": "Repeat showing",
        "value": "50 mon",
        "note": "The first showing is free with Ticket (Leaping Monkey), earned with four orders at Shirohebi Udon."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "monkey-drop",
      "retry": false
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 17 and get the painting from Shichigoro."
      ],
      [
        "steps.1.text",
        "Eat four times at Shirohebi Udon in Rakugai for Ticket (Leaping Monkey)."
      ],
      [
        "steps.2.text",
        "Speak to the attendant outside Rakugai’s Sideshow Tent. The first showing is free with the ticket."
      ],
      [
        "steps.3.text",
        "Choose “An Extraordinary Trick! The Amazing Jumping Monkey!” Repeat showings cost 50 mon."
      ],
      [
        "steps.4.text",
        "Follow the timed prompts in this order: Cross → Triangle. Then choose option 2, about how high the little monkey jumps with a pole."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 17",
        "note": "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 17 and get the painting from Shichigoro."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "monkey-drop",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 17 and get the painting from Shichigoro."
      ],
      [
        "steps.1.text",
        "Eat four times at Shirohebi Udon in Rakugai for Ticket (Leaping Monkey)."
      ],
      [
        "steps.2.text",
        "Speak to the attendant outside Rakugai’s Sideshow Tent. The first showing is free with the ticket."
      ],
      [
        "steps.3.text",
        "Choose “An Extraordinary Trick! The Amazing Jumping Monkey!” Repeat showings cost 50 mon."
      ],
      [
        "steps.4.text",
        "Follow the timed prompts in this order: Cross → Triangle. Then choose option 2, about how high the little monkey jumps with a pole."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 17",
        "note": "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 17 and get the painting from Shichigoro."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "dancing-cat",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 18 and collect the painting from Shichigoro at Gion Inari Shrine."
      ],
      [
        "steps.1.text",
        "At Kiyomizudera Entrance, examine the cat beside the temple approach."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: 2 × Triangle. Then choose option 2, about the cat scaling the rock with its leaps."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "2 × Triangle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 2, about the cat scaling the rock with its leaps."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "dancing-cat",
      "retry": false
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 18 and collect the painting from Shichigoro at Gion Inari Shrine."
      ],
      [
        "steps.1.text",
        "At Kiyomizudera Entrance, examine the cat beside the temple approach."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: 2 × Triangle. Then choose option 2, about the cat scaling the rock with its leaps."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 18",
        "note": "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 18 and collect the painting from Shichigoro at Gion Inari Shrine."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "dancing-cat",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 18 and collect the painting from Shichigoro at Gion Inari Shrine."
      ],
      [
        "steps.1.text",
        "At Kiyomizudera Entrance, examine the cat beside the temple approach."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: 2 × Triangle. Then choose option 2, about the cat scaling the rock with its leaps."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 18",
        "note": "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 18 and collect the painting from Shichigoro at Gion Inari Shrine."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "karakuri-spin",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "Buy the schematic for 2,000 mon from the man inside Ebisuya Pawn in Gion."
      ],
      [
        "steps.1.text",
        "Take the schematic to Gyotensai at Gyotensai's House in Gion and speak to him about the clock."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Circle → Triangle → Cross → Square → Circle. Then choose option 3, about how the parts work together to create movement."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Circle → Triangle → Cross → Square → Circle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 3, about how the parts work together to create movement."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "karakuri-spin",
      "retry": false
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Buy the schematic for 2,000 mon from the man inside Ebisuya Pawn in Gion."
      ],
      [
        "steps.1.text",
        "Take the schematic to Gyotensai at Gyotensai's House in Gion and speak to him about the clock."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Circle → Triangle → Cross → Square → Circle. Then choose option 3, about how the parts work together to create movement."
      ]
    ],
    "facts": [
      {
        "label": "Schematic price",
        "value": "2,000 mon",
        "note": "Buy the Schematic of a Clock inside Ebisuya Pawn in Gion, then take it to Gyotensai."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "diving-swallow",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat, check Shichigoro’s Chapter 6 letter and collect the painting at Gion Inari Shrine."
      ],
      [
        "steps.1.text",
        "Go to the middle of the bridge in Kawaramachi, near the girl, and interact with the swallow observation spot."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Square → Triangle → Cross. Then choose option 3, about the swallow’s fast dive."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Square → Triangle → Cross",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 3, about the swallow’s fast dive."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "ascending-fish",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat, check Shichigoro’s Chapter 6 letter and collect the painting at Gion Inari Shrine."
      ],
      [
        "steps.1.text",
        "Speak to the fisherman at the marked spot beside the Kamo River on Riverside Path."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Triangle. Then choose option 2, about the fish’s scales catching the light as it rises."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Triangle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 2, about the fish’s scales catching the light as it rises."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "soundless-serpent",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "Collect the painting from Shichigoro after his Chapter 7 letter. Collect Painting of a Kite first if he has both to hand out."
      ],
      [
        "steps.1.text",
        "At the fork on Forest Path, examine the snake observation spot."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Triangle → Circle. Then choose option 1, about the snake striking instantly without warning."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Triangle → Circle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 1, about the snake striking instantly without warning."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "orochi-bladestorm",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "Complete substory #53, Terakoya Homework - The Letter, to obtain the painting."
      ],
      [
        "steps.1.text",
        "Listen to the picture storyteller with the children on Shijo Avenue in Rakugai, in front of the shrine."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Cross → Triangle → Circle → Triangle → Cross → Square. Then choose option 2, about the fierce attacks of Yamata no Orochi."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Cross → Triangle → Circle → Triangle → Cross → Square",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 2, about the fierce attacks of Yamata no Orochi."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "snatching-kite",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "After learning Oblivious Cat, check Shichigoro’s Chapter 7 letter and collect the painting at Gion Inari Shrine."
      ],
      [
        "steps.1.text",
        "Speak to the man looking skyward on Mountain Path."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Circle → Triangle. Then choose option 2, about the kite snatching a sparrow from its flock."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Circle → Triangle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 2, about the kite snatching a sparrow from its flock."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "dragon-catch",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "Speak to the retired man sitting at the Riverside Tea House to get the painting."
      ],
      [
        "steps.1.text",
        "At the same tea house, interact with the children at the marked spot and watch their scuffle."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Triangle. Then choose option 3, about the accidental flip against the opponent."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Triangle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 3, about the accidental flip against the opponent."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "enmei",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "Learn Two Bones first. In substory #75, Enkiridera, agree to stay after the first fight and finish the rest of the request to get the painting. Leaving early forfeits it."
      ],
      [
        "steps.1.text",
        "Return to the dog on Yamato Alley South in Rakugai."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Circle → Triangle → Square → Cross → Circle. Then choose option 3, about the circle helping maintain an unwavering state of mind."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Circle → Triangle → Square → Cross → Circle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 3, about the circle helping maintain an unwavering state of mind."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "fly-swatter",
      "retry": false
    },
    "target": "steps.4",
    "expected": [
      [
        "steps.0.text",
        "In substory #85, Gion’s Famous Doctor 2, agree to look for Ken-san."
      ],
      [
        "steps.1.text",
        "Ask the worker at Sushi Ginya about Ken."
      ],
      [
        "steps.2.text",
        "Find Ken by Gion Main Gate and defeat Wakamatsu’s group to get the diagram."
      ],
      [
        "steps.3.text",
        "Examine the seated man behind Nonaka Tea House on the Yoshioka Dojo approach."
      ],
      [
        "steps.4.text",
        "Follow the timed prompts in this order: 3 × Triangle. Then choose option 3, about the fly being crushed against a wall."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "3 × Triangle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 3, about the fly being crushed against a wall."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "devastating-duo",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "Reach level 25 and speak to Shichigoro at Gion Inari Shrine. He can give you the painting after the Sleeping Cat painting, before the countryside event opens."
      ],
      [
        "steps.1.text",
        "Speak to the farmer at the marked spot on Countryside Path."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Cross → Triangle. Then choose option 2, about the bull’s horns pinning the man in place."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "Cross → Triangle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 2, about the bull’s horns pinning the man in place."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "devastating-duo",
      "retry": false
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Reach level 25 and speak to Shichigoro at Gion Inari Shrine. He can give you the painting after the Sleeping Cat painting, before the countryside event opens."
      ],
      [
        "steps.1.text",
        "Speak to the farmer at the marked spot on Countryside Path."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Cross → Triangle. Then choose option 2, about the bull’s horns pinning the man in place."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 25",
        "note": "Reach level 25 and speak to Shichigoro at Gion Inari Shrine. He can give you the painting after the Sleeping Cat painting, before the countryside event opens."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "devastating-duo",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Reach level 25 and speak to Shichigoro at Gion Inari Shrine. He can give you the painting after the Sleeping Cat painting, before the countryside event opens."
      ],
      [
        "steps.1.text",
        "Speak to the farmer at the marked spot on Countryside Path."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: Cross → Triangle. Then choose option 2, about the bull’s horns pinning the man in place."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 25",
        "note": "Reach level 25 and speak to Shichigoro at Gion Inari Shrine. He can give you the painting after the Sleeping Cat painting, before the countryside event opens."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "raging-bull",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "Learn Devastating Duo, then collect this second bull painting from Shichigoro at Gion Inari Shrine in Chapter 9."
      ],
      [
        "steps.1.text",
        "Go to the farmer at the Raging Bull pin on Countryside Path and watch the bull charge."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: 3 × Triangle. Then choose option 3, about the bull building up power before charging."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "3 × Triangle",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 3, about the bull building up power before charging."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "illusory-wolf",
      "retry": false
    },
    "target": "steps.2",
    "expected": [
      [
        "steps.0.text",
        "Reach level 30 and get the painting from Shichigoro at Gion Inari Shrine after the Running Bull painting."
      ],
      [
        "steps.1.text",
        "At night, use the observation spot on Cliffside Path to look up at the wolf."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: 8 × Cross. Then choose option 2, about the wolf’s movement and power as it scales the cliff."
      ]
    ],
    "facts": [
      {
        "label": "Timed inputs",
        "value": "8 × Cross",
        "note": "Follow these prompts in order, then choose the separate answer."
      },
      {
        "label": "Answer choice",
        "value": "option 2, about the wolf’s movement and power as it scales the cliff."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "illusory-wolf",
      "retry": false
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Reach level 30 and get the painting from Shichigoro at Gion Inari Shrine after the Running Bull painting."
      ],
      [
        "steps.1.text",
        "At night, use the observation spot on Cliffside Path to look up at the wolf."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: 8 × Cross. Then choose option 2, about the wolf’s movement and power as it scales the cliff."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 30",
        "note": "Reach level 30 and get the painting from Shichigoro at Gion Inari Shrine after the Running Bull painting."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "illusory-wolf",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Reach level 30 and get the painting from Shichigoro at Gion Inari Shrine after the Running Bull painting."
      ],
      [
        "steps.1.text",
        "At night, use the observation spot on Cliffside Path to look up at the wolf."
      ],
      [
        "steps.2.text",
        "Follow the timed prompts in this order: 8 × Cross. Then choose option 2, about the wolf’s movement and power as it scales the cliff."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 30",
        "note": "Reach level 30 and get the painting from Shichigoro at Gion Inari Shrine after the Running Bull painting."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "swordless-catch",
      "retry": false
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Visit Komaki Sōzaemon at the Gion Martial Arts Dojo in southeast Gion. If this is your first visit, agree to join the dojo. The introductory spar is optional."
      ],
      [
        "steps.1.text",
        "At level 20 or higher, select Gion Martial Arts Dojo Secret Technique Initiation Exam 1. Pass the sparring exam, then watch Komaki’s demonstration to learn Swordless Catch."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 20",
        "note": "Visit Komaki Sōzaemon at the Gion Martial Arts Dojo in southeast Gion. If this is your first visit, agree to join the dojo. The introductory spar is optional."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "swordless-catch",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Visit Komaki Sōzaemon at the Gion Martial Arts Dojo in southeast Gion. If this is your first visit, agree to join the dojo. The introductory spar is optional."
      ],
      [
        "steps.1.text",
        "At level 20 or higher, select Gion Martial Arts Dojo Secret Technique Initiation Exam 1. Pass the sparring exam, then watch Komaki’s demonstration to learn Swordless Catch."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 20",
        "note": "Visit Komaki Sōzaemon at the Gion Martial Arts Dojo in southeast Gion. If this is your first visit, agree to join the dojo. The introductory spar is optional."
      }
    ],
    "factSections": [
      {
        "label": "Exam",
        "note": "Visit Komaki Sōzaemon at the Gion Martial Arts Dojo in southeast Gion. If this is your first visit, agree to join the dojo. The introductory spar is optional. At level 20 or higher, select Gion Martial Arts Dojo Secret Technique Initiation Exam 1. Pass the sparring exam, then watch Komaki’s demonstration to learn Swordless Catch.",
        "facts": [
          {
            "label": "Exam",
            "value": "1"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "swordless-catch",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Visit Komaki Sōzaemon at the Gion Martial Arts Dojo in southeast Gion. If this is your first visit, agree to join the dojo. The introductory spar is optional."
      ],
      [
        "steps.1.text",
        "At level 20 or higher, select Gion Martial Arts Dojo Secret Technique Initiation Exam 1. Pass the sparring exam, then watch Komaki’s demonstration to learn Swordless Catch."
      ]
    ],
    "factSections": [
      {
        "label": "Exam",
        "note": "Visit Komaki Sōzaemon at the Gion Martial Arts Dojo in southeast Gion. If this is your first visit, agree to join the dojo. The introductory spar is optional. At level 20 or higher, select Gion Martial Arts Dojo Secret Technique Initiation Exam 1. Pass the sparring exam, then watch Komaki’s demonstration to learn Swordless Catch.",
        "facts": [
          {
            "label": "Exam",
            "value": "1"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "bowl-crusher",
      "retry": false
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 25 if the lesson is still locked."
      ],
      [
        "steps.1.text",
        "Select Gion Martial Arts Dojo Secret Technique Initiation Exam 2. Pass the sparring exam, then watch Komaki’s demonstration to learn Bowl Crusher."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 25",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 25 if the lesson is still locked."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "bowl-crusher",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 25 if the lesson is still locked."
      ],
      [
        "steps.1.text",
        "Select Gion Martial Arts Dojo Secret Technique Initiation Exam 2. Pass the sparring exam, then watch Komaki’s demonstration to learn Bowl Crusher."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 25",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 25 if the lesson is still locked."
      }
    ],
    "factSections": [
      {
        "label": "Exam",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 25 if the lesson is still locked. Select Gion Martial Arts Dojo Secret Technique Initiation Exam 2. Pass the sparring exam, then watch Komaki’s demonstration to learn Bowl Crusher.",
        "facts": [
          {
            "label": "Exam",
            "value": "2"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "bowl-crusher",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 25 if the lesson is still locked."
      ],
      [
        "steps.1.text",
        "Select Gion Martial Arts Dojo Secret Technique Initiation Exam 2. Pass the sparring exam, then watch Komaki’s demonstration to learn Bowl Crusher."
      ]
    ],
    "factSections": [
      {
        "label": "Exam",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 25 if the lesson is still locked. Select Gion Martial Arts Dojo Secret Technique Initiation Exam 2. Pass the sparring exam, then watch Komaki’s demonstration to learn Bowl Crusher.",
        "facts": [
          {
            "label": "Exam",
            "value": "2"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "fist-reversal",
      "retry": false
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 32 if the lesson is still locked."
      ],
      [
        "steps.1.text",
        "Select Gion Martial Arts Dojo Secret Technique Initiation Exam 3. Pass the sparring exam, then watch Komaki’s demonstration to learn Fist Reversal."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 32",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 32 if the lesson is still locked."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "fist-reversal",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 32 if the lesson is still locked."
      ],
      [
        "steps.1.text",
        "Select Gion Martial Arts Dojo Secret Technique Initiation Exam 3. Pass the sparring exam, then watch Komaki’s demonstration to learn Fist Reversal."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 32",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 32 if the lesson is still locked."
      }
    ],
    "factSections": [
      {
        "label": "Exam",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 32 if the lesson is still locked. Select Gion Martial Arts Dojo Secret Technique Initiation Exam 3. Pass the sparring exam, then watch Komaki’s demonstration to learn Fist Reversal.",
        "facts": [
          {
            "label": "Exam",
            "value": "3"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "fist-reversal",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 32 if the lesson is still locked."
      ],
      [
        "steps.1.text",
        "Select Gion Martial Arts Dojo Secret Technique Initiation Exam 3. Pass the sparring exam, then watch Komaki’s demonstration to learn Fist Reversal."
      ]
    ],
    "factSections": [
      {
        "label": "Exam",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 32 if the lesson is still locked. Select Gion Martial Arts Dojo Secret Technique Initiation Exam 3. Pass the sparring exam, then watch Komaki’s demonstration to learn Fist Reversal.",
        "facts": [
          {
            "label": "Exam",
            "value": "3"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "shot-stopper",
      "retry": false
    },
    "target": "steps.0",
    "expected": [
      [
        "steps.0.text",
        "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 35 if the lesson is still locked."
      ],
      [
        "steps.1.text",
        "Select Gion Martial Arts Dojo Secret Technique Initiation Exam 4. Pass the sparring exam, then watch Komaki’s demonstration to learn Shot Stopper."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 35",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 35 if the lesson is still locked."
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "shot-stopper",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 35 if the lesson is still locked."
      ],
      [
        "steps.1.text",
        "Select Gion Martial Arts Dojo Secret Technique Initiation Exam 4. Pass the sparring exam, then watch Komaki’s demonstration to learn Shot Stopper."
      ]
    ],
    "facts": [
      {
        "label": "Level needed",
        "value": "At least 35",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 35 if the lesson is still locked."
      }
    ],
    "factSections": [
      {
        "label": "Exam",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 35 if the lesson is still locked. Select Gion Martial Arts Dojo Secret Technique Initiation Exam 4. Pass the sparring exam, then watch Komaki’s demonstration to learn Shot Stopper.",
        "facts": [
          {
            "label": "Exam",
            "value": "4"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "shot-stopper",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 35 if the lesson is still locked."
      ],
      [
        "steps.1.text",
        "Select Gion Martial Arts Dojo Secret Technique Initiation Exam 4. Pass the sparring exam, then watch Komaki’s demonstration to learn Shot Stopper."
      ]
    ],
    "factSections": [
      {
        "label": "Exam",
        "note": "Go to Komaki at the Gion Martial Arts Dojo in southeast Gion. Reach level 35 if the lesson is still locked. Select Gion Martial Arts Dojo Secret Technique Initiation Exam 4. Pass the sparring exam, then watch Komaki’s demonstration to learn Shot Stopper.",
        "facts": [
          {
            "label": "Exam",
            "value": "4"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "dry-leaf-smash",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Speak to En no Ozuma at Hozoin Temple during the Chapter 8 tournament story sequence."
      ],
      [
        "steps.1.text",
        "Accept Special Lecture - Boar Scroll. Finish the watermelon-cutting exercise with the training gauge at or above 3,500 to learn Dry Leaf Smash."
      ],
      [
        "steps.2.text",
        "If you leave Hozoin without learning it, take the same lesson from En no Ozuma on Riverside Path from 9-1. Learn it at Hozoin if you want to use it in the Chapter 8 fight against Inshun."
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "Speak to En no Ozuma at Hozoin Temple during the Chapter 8 tournament story sequence. Accept Special Lecture - Boar Scroll. Finish the watermelon-cutting exercise with the training gauge at or above 3,500 to learn Dry Leaf Smash. If you leave Hozoin without learning it, take the same lesson from En no Ozuma on Riverside Path from 9-1. Learn it at Hozoin if you want to use it in the Chapter 8 fight against Inshun.",
        "facts": [
          {
            "label": "Course",
            "value": "Special Lecture - Boar Scroll"
          },
          {
            "label": "Training gauge target",
            "value": "At least 3,500"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "dry-leaf-smash",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Speak to En no Ozuma at Hozoin Temple during the Chapter 8 tournament story sequence."
      ],
      [
        "steps.1.text",
        "Accept Special Lecture - Boar Scroll. Finish the watermelon-cutting exercise with the training gauge at or above 3,500 to learn Dry Leaf Smash."
      ],
      [
        "steps.2.text",
        "If you leave Hozoin without learning it, take the same lesson from En no Ozuma on Riverside Path from 9-1. Learn it at Hozoin if you want to use it in the Chapter 8 fight against Inshun."
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "Speak to En no Ozuma at Hozoin Temple during the Chapter 8 tournament story sequence. Accept Special Lecture - Boar Scroll. Finish the watermelon-cutting exercise with the training gauge at or above 3,500 to learn Dry Leaf Smash. If you leave Hozoin without learning it, take the same lesson from En no Ozuma on Riverside Path from 9-1. Learn it at Hozoin if you want to use it in the Chapter 8 fight against Inshun.",
        "facts": [
          {
            "label": "Course",
            "value": "Special Lecture - Boar Scroll"
          },
          {
            "label": "Training gauge target",
            "value": "At least 3,500"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "flowing-stream",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Find En no Ozuma on Riverside Path after the Hozoin tournament."
      ],
      [
        "steps.1.text",
        "Choose Foundational Training. Finish the watermelon-cutting exercise with the training gauge at or above 4,200 to learn Flowing Stream."
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "Find En no Ozuma on Riverside Path after the Hozoin tournament. Choose Foundational Training. Finish the watermelon-cutting exercise with the training gauge at or above 4,200 to learn Flowing Stream.",
        "facts": [
          {
            "label": "Course",
            "value": "Foundational Training"
          },
          {
            "label": "Training gauge target",
            "value": "At least 4,200"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "flowing-stream",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Find En no Ozuma on Riverside Path after the Hozoin tournament."
      ],
      [
        "steps.1.text",
        "Choose Foundational Training. Finish the watermelon-cutting exercise with the training gauge at or above 4,200 to learn Flowing Stream."
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "Find En no Ozuma on Riverside Path after the Hozoin tournament. Choose Foundational Training. Finish the watermelon-cutting exercise with the training gauge at or above 4,200 to learn Flowing Stream.",
        "facts": [
          {
            "label": "Course",
            "value": "Foundational Training"
          },
          {
            "label": "Training gauge target",
            "value": "At least 4,200"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "strong-judgment",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Clear Special Lecture - Boar Scroll and Foundational Training, then return to En no Ozuma on Riverside Path."
      ],
      [
        "steps.1.text",
        "Choose Applied Training. Finish with the training gauge at or above 5,000 to learn Strong Judgment."
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "Clear Special Lecture - Boar Scroll and Foundational Training, then return to En no Ozuma on Riverside Path. Choose Applied Training. Finish with the training gauge at or above 5,000 to learn Strong Judgment.",
        "facts": [
          {
            "label": "Course",
            "value": "Applied Training"
          },
          {
            "label": "Training gauge target",
            "value": "At least 5,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "strong-judgment",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Clear Special Lecture - Boar Scroll and Foundational Training, then return to En no Ozuma on Riverside Path."
      ],
      [
        "steps.1.text",
        "Choose Applied Training. Finish with the training gauge at or above 5,000 to learn Strong Judgment."
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "Clear Special Lecture - Boar Scroll and Foundational Training, then return to En no Ozuma on Riverside Path. Choose Applied Training. Finish with the training gauge at or above 5,000 to learn Strong Judgment.",
        "facts": [
          {
            "label": "Course",
            "value": "Applied Training"
          },
          {
            "label": "Training gauge target",
            "value": "At least 5,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "heavens-converge",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Clear Applied Training. Once you can roam again after the Chapter 10 tour, return to En no Ozuma on Riverside Path."
      ],
      [
        "steps.1.text",
        "Choose Advanced Training. Finish with the training gauge at or above 5,000 to learn Heavens Converge."
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "Clear Applied Training. Once you can roam again after the Chapter 10 tour, return to En no Ozuma on Riverside Path. Choose Advanced Training. Finish with the training gauge at or above 5,000 to learn Heavens Converge.",
        "facts": [
          {
            "label": "Course",
            "value": "Advanced Training"
          },
          {
            "label": "Training gauge target",
            "value": "At least 5,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "heavens-converge",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Clear Applied Training. Once you can roam again after the Chapter 10 tour, return to En no Ozuma on Riverside Path."
      ],
      [
        "steps.1.text",
        "Choose Advanced Training. Finish with the training gauge at or above 5,000 to learn Heavens Converge."
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "Clear Applied Training. Once you can roam again after the Chapter 10 tour, return to En no Ozuma on Riverside Path. Choose Advanced Training. Finish with the training gauge at or above 5,000 to learn Heavens Converge.",
        "facts": [
          {
            "label": "Course",
            "value": "Advanced Training"
          },
          {
            "label": "Training gauge target",
            "value": "At least 5,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "unshackling-slash",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "On the way from Tsuruya to Tatsuya during the Chapter 10 rescue preparations, receive En no Ozuma’s letter near Gion’s south gate. It directs you to Riverside Path."
      ],
      [
        "steps.1.text",
        "Talk to En no Ozuma and take Special Lecture - Snake Scroll. Finish with the training gauge at or above 4,000 to learn Unshackling Slash."
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "On the way from Tsuruya to Tatsuya during the Chapter 10 rescue preparations, receive En no Ozuma’s letter near Gion’s south gate. It directs you to Riverside Path. Talk to En no Ozuma and take Special Lecture - Snake Scroll. Finish with the training gauge at or above 4,000 to learn Unshackling Slash.",
        "facts": [
          {
            "label": "Course",
            "value": "Special Lecture - Snake Scroll"
          },
          {
            "label": "Training gauge target",
            "value": "At least 4,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "unshackling-slash",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "On the way from Tsuruya to Tatsuya during the Chapter 10 rescue preparations, receive En no Ozuma’s letter near Gion’s south gate. It directs you to Riverside Path."
      ],
      [
        "steps.1.text",
        "Talk to En no Ozuma and take Special Lecture - Snake Scroll. Finish with the training gauge at or above 4,000 to learn Unshackling Slash."
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "On the way from Tsuruya to Tatsuya during the Chapter 10 rescue preparations, receive En no Ozuma’s letter near Gion’s south gate. It directs you to Riverside Path. Talk to En no Ozuma and take Special Lecture - Snake Scroll. Finish with the training gauge at or above 4,000 to learn Unshackling Slash.",
        "facts": [
          {
            "label": "Course",
            "value": "Special Lecture - Snake Scroll"
          },
          {
            "label": "Training gauge target",
            "value": "At least 4,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "swallow-drop",
      "retry": false
    },
    "expected": [
      [
        "steps.0.text",
        "Clear En no Ozuma’s other five courses. After receiving the route to Ganryu Island from Koetsu, collect En no Ozuma’s final letter on the road through Kawaramachi."
      ],
      [
        "steps.1.text",
        "Go to En no Ozuma on Riverside Path. Accept Special Lecture - Asura Scroll. Finish with the training gauge at or above 5,000 to learn Swallow Drop."
      ],
      [
        "time",
        "Before sailing to Ganryu Island"
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "Before sailing to Ganryu Island. Clear En no Ozuma’s other five courses. After receiving the route to Ganryu Island from Koetsu, collect En no Ozuma’s final letter on the road through Kawaramachi. Go to En no Ozuma on Riverside Path. Accept Special Lecture - Asura Scroll. Finish with the training gauge at or above 5,000 to learn Swallow Drop.",
        "facts": [
          {
            "label": "Course",
            "value": "Special Lecture - Asura Scroll"
          },
          {
            "label": "Training gauge target",
            "value": "At least 5,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "swallow-drop",
      "retry": false
    },
    "target": "steps.1",
    "expected": [
      [
        "steps.0.text",
        "Clear En no Ozuma’s other five courses. After receiving the route to Ganryu Island from Koetsu, collect En no Ozuma’s final letter on the road through Kawaramachi."
      ],
      [
        "steps.1.text",
        "Go to En no Ozuma on Riverside Path. Accept Special Lecture - Asura Scroll. Finish with the training gauge at or above 5,000 to learn Swallow Drop."
      ],
      [
        "time",
        "Before sailing to Ganryu Island"
      ]
    ],
    "factSections": [
      {
        "label": "Training target",
        "note": "Before sailing to Ganryu Island. Clear En no Ozuma’s other five courses. After receiving the route to Ganryu Island from Koetsu, collect En no Ozuma’s final letter on the road through Kawaramachi. Go to En no Ozuma on Riverside Path. Accept Special Lecture - Asura Scroll. Finish with the training gauge at or above 5,000 to learn Swallow Drop.",
        "facts": [
          {
            "label": "Course",
            "value": "Special Lecture - Asura Scroll"
          },
          {
            "label": "Training gauge target",
            "value": "At least 5,000"
          }
        ]
      }
    ]
  },
  {
    "scope": "activity",
    "match": {
      "id": "dry-leaf-smash",
      "retry": true
    },
    "expected": [
      [
        "steps.0.text",
        "If you leave Hozoin without learning it, take the same lesson from En no Ozuma on Riverside Path from 9-1. Learn it at Hozoin if you want to use it in the Chapter 8 fight against Inshun."
      ]
    ],
    "facts": [
      {
        "label": "Riverside retry",
        "value": "From 9-1",
        "note": "This is the one-step retry route. The first Hozoin lesson is at 8-8."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "building",
      "area": "st_gion",
      "x": 0.314845,
      "y": 0.897124,
      "name": "Tatsuya"
    },
    "expected": [
      [
        "detail",
        "Kiryu’s home, also called the House of the Dragon. Read commission letters, save or use item storage, and take the hidden passage to Rakugai."
      ]
    ],
    "facts": [
      {
        "label": "Services",
        "value": "Letters · Save · Item storage · Rakugai passage"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "landmark",
      "area": "st_rakugaicho",
      "x": 0.115748,
      "y": 0.160443,
      "name": "Police Box and Wanted Board"
    },
    "expected": [
      [
        "detail",
        "Read wanted posters for bounty missions from Chapter 6."
      ]
    ],
    "facts": [
      {
        "label": "Opens",
        "value": "Chapter 6"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "building",
      "area": "st_hozoin",
      "x": 0.507561,
      "y": 0.168459,
      "name": "Hozoin Coliseum"
    },
    "expected": [
      [
        "detail",
        "Enter repeatable three-round tournaments from Chapter 9. Defeating all 50 fighters earns the Ganryu Bokuto."
      ]
    ],
    "facts": [
      {
        "label": "Opens",
        "value": "Chapter 9"
      },
      {
        "label": "Tournament",
        "value": "3 rounds · Repeatable"
      },
      {
        "label": "Completion",
        "value": "Defeat all 50 fighters"
      },
      {
        "label": "Reward",
        "value": "Ganryu Bokuto",
        "note": "Earned by defeating all 50 Hozoin Coliseum fighters."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "landmark",
      "area": "st_kaido_rindo",
      "x": 0.114683,
      "y": 0.624012,
      "name": "Horse Archery Grounds"
    },
    "expected": [
      [
        "detail",
        "Horseback archery training, available during the day and evening."
      ]
    ],
    "facts": [
      {
        "label": "Time",
        "value": "Day or evening"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "building",
      "area": "st_rakugaicho",
      "x": 0.912243,
      "y": 0.196309,
      "name": "Kabuki Theatre"
    },
    "expected": [
      [
        "detail",
        "The stage near Yasaka Shrine hosts Kabuki Acting at night after you finish Request #32."
      ]
    ],
    "facts": [
      {
        "label": "Time",
        "value": "Night"
      },
      {
        "label": "Unlock",
        "value": "Finish request #32"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "palanquin",
      "area": "st_rakugaicho",
      "x": 0.442469,
      "y": 0.15874,
      "name": "Gion Main Gate palanquin"
    },
    "expected": [
      [
        "detail",
        "On the Rakugai side of the gate. Fast travel costs 71 mon."
      ]
    ],
    "facts": [
      {
        "label": "Fare",
        "value": "71 mon"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "palanquin",
      "area": "st_rakugaicho",
      "x": 0.147653,
      "y": 0.637403,
      "name": "Theater palanquin"
    },
    "expected": [
      [
        "detail",
        "Fast travel costs 71 mon."
      ]
    ],
    "facts": [
      {
        "label": "Fare",
        "value": "71 mon"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "palanquin",
      "area": "st_rakugaicho",
      "x": 0.535031,
      "y": 0.69931,
      "name": "East Market palanquin"
    },
    "expected": [
      [
        "detail",
        "Fast travel costs 71 mon."
      ]
    ],
    "facts": [
      {
        "label": "Fare",
        "value": "71 mon"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "palanquin",
      "area": "st_yoshioka_jnt",
      "x": 0.688913,
      "y": 0.439407,
      "name": "Yoshioka Dojo palanquin"
    },
    "expected": [
      [
        "detail",
        "Visit Yoshioka Dojo once to unlock this destination. Fast travel costs 71 mon."
      ]
    ],
    "facts": [
      {
        "label": "Fare",
        "value": "71 mon"
      },
      {
        "label": "Unlock",
        "value": "Visit Yoshioka Dojo once"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "palanquin",
      "area": "st_kawa_jnt",
      "x": 0.518125,
      "y": 0.305092,
      "name": "Riverside Tea House palanquin"
    },
    "expected": [
      [
        "detail",
        "Visit the Riverside Tea House once to unlock this destination. Fast travel costs 71 mon."
      ]
    ],
    "facts": [
      {
        "label": "Fare",
        "value": "71 mon"
      },
      {
        "label": "Unlock",
        "value": "Visit Riverside Tea House once"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "palanquin",
      "area": "st_rakugaicho",
      "x": 0.42764,
      "y": 0.453329,
      "name": "Back Alley palanquin"
    },
    "expected": [
      [
        "detail",
        "Optional stop near the small shrine. Pick the bottom answer at the end of request #31 to open it."
      ]
    ],
    "facts": [
      {
        "label": "Unlock",
        "value": "Request #31 · bottom answer",
        "note": "The two optional destinations are alternative request #31 ending choices."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "type": "palanquin",
      "area": "st_rakugaicho",
      "x": 0.837742,
      "y": 0.164019,
      "name": "Great Torii palanquin"
    },
    "expected": [
      [
        "detail",
        "Optional northeast stop. Pick the top answer at the end of request #31 to open it."
      ]
    ],
    "facts": [
      {
        "label": "Unlock",
        "value": "Request #31 · top answer",
        "note": "The two optional destinations are alternative request #31 ending choices."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "A-1"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Thunder Stone"
      ],
      [
        "pickup.steps",
        [
          "Check the narrow lane west of Koyoro in Gion."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Thunder Stone",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "A-2"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Nigi-Mitama Jewel"
      ],
      [
        "pickup.steps",
        [
          "Go into Sake Ikkonya in Rakugai and look on the counter."
        ]
      ],
      [
        "pickup.summary",
        "Indoors · Counter"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Nigi-Mitama Jewel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Indoors · Counter"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "A-3"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Gold Tortoiseshell"
      ],
      [
        "pickup.steps",
        [
          "Walk around to the back of Gion Inari Shrine and look up at the beam."
        ]
      ],
      [
        "pickup.summary",
        "Shrine beam · Look up"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Gold Tortoiseshell",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Shrine beam · Look up"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "A-4"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Brittle Wakizashi"
      ],
      [
        "pickup.steps",
        [
          "Enter Tenguya Drugs in Gion and check the top of the chest near the entrance."
        ]
      ],
      [
        "pickup.summary",
        "Indoors · On chest"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Brittle Wakizashi",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Indoors · On chest"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "A-5"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Archive of Yamimaro - Volume 2"
      ],
      [
        "pickup.steps",
        [
          "Check the middle of the bridge at Hozoin."
        ]
      ],
      [
        "pickup.summary",
        "Bridge"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Archive of Yamimaro - Volume 2",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Bridge"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "B-1"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Rough Steel"
      ],
      [
        "pickup.steps",
        [
          "In the field closest to the Rendai Field exit, check along the south fence."
        ]
      ],
      [
        "pickup.summary",
        "Along fence"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Rough Steel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Along fence"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "B-2"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Ara-Mitama Jewel"
      ],
      [
        "pickup.steps",
        [
          "Stand outside the Gion Martial Arts Dojo and look up at the roof of the building immediately to its east."
        ]
      ],
      [
        "pickup.summary",
        "Roof · Look up"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Ara-Mitama Jewel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Roof · Look up"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "B-3"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Celestial Steel"
      ],
      [
        "pickup.steps",
        [
          "Check the ground where Mountain Path leads into Kiyomizudera."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Celestial Steel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "B-4"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Chunk of Wood (Ash)"
      ],
      [
        "pickup.steps",
        [
          "In Rakugai, check the bench on Nagayamachi just north of Arigataya."
        ]
      ],
      [
        "pickup.summary",
        "Bench"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Chunk of Wood (Ash)",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Bench"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "B-5"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Coveted Shunga"
      ],
      [
        "pickup.steps",
        [
          "Enter Sushi Ginya in Gion and check the floor inside."
        ]
      ],
      [
        "pickup.summary",
        "Indoors · Floor"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Coveted Shunga",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Indoors · Floor"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "C-1"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Resurrection Magatama"
      ],
      [
        "pickup.steps",
        [
          "At the small shrine in central Rakugai, inspect the offering box."
        ]
      ],
      [
        "pickup.summary",
        "Offering box"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Resurrection Magatama",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Offering box"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "C-2"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Ara-Mitama Jewel"
      ],
      [
        "pickup.steps",
        [
          "Check the middle of the road outside the soba shop on the west side of Kawaramachi."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Ara-Mitama Jewel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "C-3"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Book of 100 Nights and 1,000 Darknesses"
      ],
      [
        "pickup.steps",
        [
          "At the Riverside Tea House, check the pot beside the building on the storage side."
        ]
      ],
      [
        "pickup.summary",
        "Pot"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Book of 100 Nights and 1,000 Darknesses",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Pot"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "C-4"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Mummy Pedestal Fragment"
      ],
      [
        "pickup.steps",
        [
          "From the Yoshioka Dojo side of Countryside Path, check the walkway in the first set of fields."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Mummy Pedestal Fragment",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "C-5"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Millennium Ice Stone"
      ],
      [
        "pickup.steps",
        [
          "Look underneath the steps near the middle of Riverside Path."
        ]
      ],
      [
        "pickup.summary",
        "Under stairs"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Millennium Ice Stone",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Under stairs"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "D-1"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Temari Stone"
      ],
      [
        "pickup.steps",
        [
          "Check the bench near the western Kawaramachi exit toward Yoshioka Dojo."
        ]
      ],
      [
        "pickup.summary",
        "Bench"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Temari Stone",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Bench"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "D-2"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Dragon Whisker"
      ],
      [
        "pickup.steps",
        [
          "At the Gion branch of Arigataya, look up at the outer corner of the shop roof."
        ]
      ],
      [
        "pickup.summary",
        "Roof · Look up"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Dragon Whisker",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Roof · Look up"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "D-3"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Oni Hair"
      ],
      [
        "pickup.steps",
        [
          "On the east side of Forest Path, check the raised ground on the Kiyomizudera side."
        ]
      ],
      [
        "pickup.summary",
        "Raised bank"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Oni Hair",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Raised bank"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "D-4"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Steel"
      ],
      [
        "pickup.steps",
        [
          "Follow the passage beside the entrance to Gion’s gambling den and look up at the roof at the end."
        ]
      ],
      [
        "pickup.summary",
        "Roof · Look up"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Steel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Roof · Look up"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "D-5"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Book of Resurrection"
      ],
      [
        "pickup.steps",
        [
          "Follow the southwest arm of Cliffside Path and check where the path meets the rock wall."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Book of Resurrection",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "E-1"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Gold Tortoiseshell"
      ],
      [
        "pickup.steps",
        [
          "On Forest Path, check the small hut near the Rakugai end, across from the stables. The key sits on a box inside."
        ]
      ],
      [
        "pickup.summary",
        "Indoors · On box"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Gold Tortoiseshell",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Indoors · On box"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "E-2"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Suijin Stone"
      ],
      [
        "pickup.steps",
        [
          "Enter Sake Nakanokura in Gion and inspect the floor."
        ]
      ],
      [
        "pickup.summary",
        "Indoors · Floor"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Suijin Stone",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Indoors · Floor"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "E-3"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Nigi-Mitama Jewel"
      ],
      [
        "pickup.steps",
        [
          "Find the well in southwest Gion and inspect the wooden box just to its west."
        ]
      ],
      [
        "pickup.summary",
        "Crate"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Nigi-Mitama Jewel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Crate"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "E-4"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · White Lion Hair"
      ],
      [
        "pickup.steps",
        [
          "Check the ground on the fields side of the path leading from Countryside Path to Yoshioka Dojo."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "White Lion Hair",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "E-5"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Adamantine Crystal"
      ],
      [
        "pickup.steps",
        [
          "Check behind the komainu guardian statue at Kiyomizudera’s entrance."
        ]
      ],
      [
        "pickup.summary",
        "Behind guardian statue"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Adamantine Crystal",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Behind guardian statue"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "F-1"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Buddha Statue Fragment"
      ],
      [
        "pickup.steps",
        [
          "Cross the little bridge on Mountain Path and follow the short dead end to the pickup."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Buddha Statue Fragment",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "F-2"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Yasaka Shrine Talisman"
      ],
      [
        "pickup.steps",
        [
          "Check the narrow passage between Sake Nakanokura and the sushi shop in Gion."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ],
      [
        "pickup.note",
        "Collect this during the day or at night. The pickup is unavailable in the evening."
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Yasaka Shrine Talisman",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      },
      {
        "label": "Time",
        "value": "Day or night",
        "note": "Unavailable in the evening."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "F-3"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Resurrection Magatama"
      ],
      [
        "pickup.steps",
        [
          "Head southwest of the Jizō on Yamato Alley South in Rakugai and look above the doorway under the eaves."
        ]
      ],
      [
        "pickup.summary",
        "Eaves · Look up"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Resurrection Magatama",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Eaves · Look up"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "F-4"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Onryo Hair"
      ],
      [
        "pickup.steps",
        [
          "Check the ground just outside Kōetsu’s mansion in Kawaramachi."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Onryo Hair",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "F-5"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Beautiful Sword Appraisal Guide"
      ],
      [
        "pickup.steps",
        [
          "Across from the Yoshioka Dojo, inspect the building wall near the Jizō."
        ]
      ],
      [
        "pickup.summary",
        "Wall · Look up"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Beautiful Sword Appraisal Guide",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Wall · Look up"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "G-1"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Book of Lion Swordfighting"
      ],
      [
        "pickup.steps",
        [
          "At the Gion branch of Arigataya, follow the narrow alley behind the shop and check between the houses."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Book of Lion Swordfighting",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "G-2"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Fine Steel"
      ],
      [
        "pickup.steps",
        [
          "Enter the narrow alley north of Sake Nakanokura in Gion. Look up at the roof over the passage."
        ]
      ],
      [
        "pickup.summary",
        "Roof · Look up"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Fine Steel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Roof · Look up"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "G-3"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Ara-Mitama Jewel"
      ],
      [
        "pickup.steps",
        [
          "Find the small teahouse at the Rakugai end of Riverside Path and check the tray on the raised seating area."
        ]
      ],
      [
        "pickup.summary",
        "Indoors · Serving tray"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Ara-Mitama Jewel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Indoors · Serving tray"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "G-4"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Chunk of Wood (Sacred)"
      ],
      [
        "pickup.steps",
        [
          "On the Rakugai side of Gion Main Gate, check the bridge railing."
        ]
      ],
      [
        "pickup.summary",
        "Bridge railing"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Chunk of Wood (Sacred)",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Bridge railing"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "G-5"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Fighter's Kimono"
      ],
      [
        "pickup.steps",
        [
          "At the Kawaramachi turnoff to Kōetsu’s mansion, look on top of the stone lantern."
        ]
      ],
      [
        "pickup.summary",
        "On stone lantern · Look up"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Fighter's Kimono",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "On stone lantern · Look up"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "H-1"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Lapis Lazuli"
      ],
      [
        "pickup.steps",
        [
          "Check the bridge in Kawaramachi just before the entrance to Rakugai."
        ]
      ],
      [
        "pickup.summary",
        "Bridge"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Lapis Lazuli",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Bridge"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "H-2"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Strange Tale of the Tengu"
      ],
      [
        "pickup.steps",
        [
          "Follow Countryside Path to the little creek bridge near the middle of the fields. Check the bridge itself."
        ]
      ],
      [
        "pickup.summary",
        "Bridge"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Strange Tale of the Tengu",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Bridge"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "H-3"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Tengu Stone"
      ],
      [
        "pickup.steps",
        [
          "In Rakugai’s Higashiyama Shopping District, check the ground beside the cooking pot."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Tengu Stone",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "H-4"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Archive of Yamimaro - Volume 3"
      ],
      [
        "pickup.steps",
        [
          "At the Cliffside Path bridge, check the edge of the cliff beside the crossing."
        ]
      ],
      [
        "pickup.summary",
        "Ledge"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Archive of Yamimaro - Volume 3",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ledge"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "H-5"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Ara-Mitama Jewel"
      ],
      [
        "pickup.steps",
        [
          "Find the small shrine on the southwest part of Mountain Path, then check below the nearby stairs."
        ]
      ],
      [
        "pickup.summary",
        "Under stairs"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Ara-Mitama Jewel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Under stairs"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "I-1"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Dragon Whisker"
      ],
      [
        "pickup.steps",
        [
          "Enter the blacksmith in Rakugai and look on the floor in the back room."
        ]
      ],
      [
        "pickup.summary",
        "Indoors · Floor"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Dragon Whisker",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Indoors · Floor"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "I-2"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Futsumitama Spirit Pearl"
      ],
      [
        "pickup.steps",
        [
          "Follow Forest Path to the turnoff for Shishido’s cave and check the ground near the cave entrance."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Futsumitama Spirit Pearl",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "I-3"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Celestial Hairpin"
      ],
      [
        "pickup.steps",
        [
          "Go into the Rakugai branch of Arigataya and inspect the container inside the shop."
        ]
      ],
      [
        "pickup.summary",
        "Indoors · Container"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Celestial Hairpin",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Indoors · Container"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "I-4"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Fine Steel"
      ],
      [
        "pickup.steps",
        [
          "Take the small footbridge from Okubomachi into the back lanes of Nakanomachi. Check the veranda north of Koyoro."
        ]
      ],
      [
        "pickup.summary",
        "Veranda"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Fine Steel",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Veranda"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "I-5"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Dragon Scale"
      ],
      [
        "pickup.steps",
        [
          "Enter the Gion Information Desk and look on the floor in the corner."
        ]
      ],
      [
        "pickup.summary",
        "Indoors · Floor"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Dragon Scale",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Indoors · Floor"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "J-1-story"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Collection Money (Ebisuya Pawn)"
      ],
      [
        "pickup.steps",
        [
          "During the prologue's Ebisuya collection, check beside the stone figure at Gion Inari Shrine."
        ]
      ],
      [
        "pickup.summary",
        "Ground · Main story"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Collection Money (Ebisuya Pawn)",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      },
      {
        "label": "Mode",
        "value": "Main story",
        "note": "This is the story pickup. In Kyoto Adventure, find the key at Gyotensai’s house."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "J-1-tour"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Ancient Shichishito"
      ],
      [
        "pickup.steps",
        [
          "In Kyoto Adventure, enter Gyotensai’s house in northeast Gion and look inside for the key."
        ]
      ],
      [
        "pickup.summary",
        "Indoors · Kyoto Adventure"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Ancient Shichishito",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Indoors"
      },
      {
        "label": "Mode",
        "value": "Kyoto Adventure"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "J-2"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Book of Offerings to Suijin"
      ],
      [
        "pickup.steps",
        [
          "In #104 Storage Locker Instructions, go to Suiten Inari Shrine in southwest Gion. Stand in the northeast corner of the shrine grounds and look up toward the roof.",
          "Interact with the glint, choose the top option to retrieve the key, then take it to the man at the lockers. He gives it back to you."
        ]
      ],
      [
        "pickup.summary",
        "Roof · Look up"
      ],
      [
        "pickup.note",
        "This commission unlocks ordinary key pickups."
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Book of Offerings to Suijin",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Roof · Look up"
      },
      {
        "label": "Unlocks",
        "value": "Ordinary key pickups",
        "note": "Complete commission #104 by returning the key to the man at the lockers."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "J-3"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Sacred Waterfall Water"
      ],
      [
        "pickup.steps",
        [
          "Check the ground just outside Tatsuya, Kiryu’s home in Gion."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Sacred Waterfall Water",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "J-4"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Suijin Stone"
      ],
      [
        "pickup.steps",
        [
          "At the south end of Gion’s main street, look in the narrow gap just south of Yumejiya."
        ]
      ],
      [
        "pickup.summary",
        "Ground"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Suijin Stone",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Ground"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "J-5"
    },
    "target": "pickup",
    "expected": [
      [
        "pickup.reward",
        "Locker reward · Buddha Statue Fragment"
      ],
      [
        "pickup.steps",
        [
          "Check the bench by the shrine at the northeast end of Rakugai."
        ]
      ],
      [
        "pickup.summary",
        "Bench"
      ]
    ],
    "facts": [
      {
        "label": "Locker reward",
        "value": "Buddha Statue Fragment",
        "note": "Open the matching locker at the Gion storage lockers to receive this reward."
      },
      {
        "label": "Placement",
        "value": "Bench"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "farm-turtle-pickup"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Rescue it in 3-2 and have the Turtle Bucket in use. Once 3 turtles in your care have died, collect it inside Tatsuya."
      ],
      [
        "entries.0.name",
        "Farm Turtle pickup"
      ]
    ],
    "facts": [
      {
        "label": "Replacement threshold",
        "value": "3 turtle deaths",
        "note": "Prior rescue at 3-2 and Turtle Bucket in use are both required. This is a recorded-death threshold."
      },
      {
        "label": "Rescue first",
        "value": "3-2",
        "note": "Rescue this turtle during its one-time story opportunity before collecting its replacement at Tatsuya."
      },
      {
        "label": "Requires",
        "value": "Turtle Bucket in use",
        "note": "The prior rescue and this turtle’s recorded-death threshold must also be satisfied."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "miyamoto-turtle-pickup"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Rescue it in 1-4 and have the Turtle Bucket in use. Once 1 turtle in your care has died, collect it inside Tatsuya."
      ],
      [
        "entries.0.name",
        "Miyamoto Turtle pickup"
      ]
    ],
    "facts": [
      {
        "label": "Replacement threshold",
        "value": "1 turtle death",
        "note": "Prior rescue at 1-4 and Turtle Bucket in use are both required. This is a recorded-death threshold."
      },
      {
        "label": "Rescue first",
        "value": "1-4",
        "note": "Rescue this turtle during its one-time story opportunity before collecting its replacement at Tatsuya."
      },
      {
        "label": "Requires",
        "value": "Turtle Bucket in use",
        "note": "The prior rescue and this turtle’s recorded-death threshold must also be satisfied."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "riverbed-turtle-pickup"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Rescue it in 7-2 and have the Turtle Bucket in use. Once 4 turtles in your care have died, collect it inside Tatsuya."
      ],
      [
        "entries.0.name",
        "Riverbed Turtle pickup"
      ]
    ],
    "facts": [
      {
        "label": "Replacement threshold",
        "value": "4 turtle deaths",
        "note": "Prior rescue at 7-2 and Turtle Bucket in use are both required. This is a recorded-death threshold."
      },
      {
        "label": "Rescue first",
        "value": "7-2",
        "note": "Rescue this turtle during its one-time story opportunity before collecting its replacement at Tatsuya."
      },
      {
        "label": "Requires",
        "value": "Turtle Bucket in use",
        "note": "The prior rescue and this turtle’s recorded-death threshold must also be satisfied."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "temple-turtle-pickup"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Rescue it in 2-1 and have the Turtle Bucket in use. Once 2 turtles in your care have died, collect it inside Tatsuya."
      ],
      [
        "entries.0.name",
        "Temple Turtle pickup"
      ]
    ],
    "facts": [
      {
        "label": "Replacement threshold",
        "value": "2 turtle deaths",
        "note": "Prior rescue at 2-1 and Turtle Bucket in use are both required. This is a recorded-death threshold."
      },
      {
        "label": "Rescue first",
        "value": "2-1",
        "note": "Rescue this turtle during its one-time story opportunity before collecting its replacement at Tatsuya."
      },
      {
        "label": "Requires",
        "value": "Turtle Bucket in use",
        "note": "The prior rescue and this turtle’s recorded-death threshold must also be satisfied."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00086"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the southwest corner near Suiten Inari. Chinese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Gion · Spawn 2"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b000ab"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the Gion Inari shrine grounds. Japanese Pond Turtle. Standard-tier starter; Mud head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Mud 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Gion · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Mud"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Mud",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00222"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check near the Hozoin reception desk. Japanese Pond Turtle. Higher-tier starter; Water head start. Caps at pickup: Stamina 140–179; Leg Power 102–153; Water 204–255. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Hozoin · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Higher-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Water"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "140–179"
          },
          {
            "label": "Leg Power",
            "value": "102–153"
          },
          {
            "label": "Water",
            "value": "204–255"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b001f4"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check by the tea stall at the north end of Riverside Path. Chinese Pond Turtle. Standard-tier starter; Water head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Water 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Riverside Path · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Water"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Water",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b001f5"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the lower stretch of Riverside Path north of the small building by the stairs. Japanese Pond Turtle. Lower-tier starter; Sand head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Sand 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Riverside Path · Spawn 4"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Lower-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Sand"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "64–103"
          },
          {
            "label": "Leg Power",
            "value": "10–51"
          },
          {
            "label": "Sand",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b001f6"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the west edge of the narrow bend just north of the big tree. Japanese Pond Turtle. Lower-tier starter. Caps at pickup: Stamina 64–103; Leg Power 10–51. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Riverside Path · Spawn 2"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Lower-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "64–103"
          },
          {
            "label": "Leg Power",
            "value": "10–51"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b001f7"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check near the stairs at the south end of Riverside Path. Japanese Pond Turtle. Lower-tier starter. Caps at pickup: Stamina 64–103; Leg Power 10–51. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Riverside Path · Spawn 5"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Lower-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "64–103"
          },
          {
            "label": "Leg Power",
            "value": "10–51"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0021d"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the east edge of the narrow bend just north of the big tree. Japanese Pond Turtle. Lower-tier starter; Water head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Water 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Riverside Path · Spawn 3"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Lower-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Water"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "64–103"
          },
          {
            "label": "Leg Power",
            "value": "10–51"
          },
          {
            "label": "Water",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0020c"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check by the maple before Shijo Bridge. Chinese Pond Turtle. Higher-tier starter. Caps at pickup: Stamina 140–179; Leg Power 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Kawaramachi · Spawn 3"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Higher-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "140–179"
          },
          {
            "label": "Leg Power",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0020d"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check northwest of Kawaramachi Inn. Japanese Pond Turtle. Lower-tier starter; Sand head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Sand 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Kawaramachi · Spawn 2"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Lower-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Sand"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "64–103"
          },
          {
            "label": "Leg Power",
            "value": "10–51"
          },
          {
            "label": "Sand",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0020e"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check by the lantern near the turnoff to Kōetsu’s mansion. Japanese Pond Turtle. Standard-tier starter; Water head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Water 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Kawaramachi · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Water"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Water",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0020f"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check near the Rakugai exit. Chinese Pond Turtle. Standard-tier starter; Sand head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Sand 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Kawaramachi · Spawn 5"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Sand"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Sand",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00210"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check toward the Rakugai end of Shijo Bridge. Chinese Pond Turtle. Higher-tier starter. Caps at pickup: Stamina 140–179; Leg Power 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Kawaramachi · Spawn 4"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Higher-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "140–179"
          },
          {
            "label": "Leg Power",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00220"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check near the horse archery stable. Chinese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Forest Path · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00221"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the path by the turnoff to Shishido’s cave. Chinese Pond Turtle. Higher-tier starter; Sand head start. Caps at pickup: Stamina 140–179; Leg Power 102–153; Sand 204–255. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Forest Path · Spawn 2"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Higher-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Sand"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "140–179"
          },
          {
            "label": "Leg Power",
            "value": "102–153"
          },
          {
            "label": "Sand",
            "value": "204–255"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0014f"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the west bend near the roadside Jizo statues. Japanese Pond Turtle. Standard-tier starter; Sand head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Sand 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Countryside Path · Spawn 3"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Sand"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Sand",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00150"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check just east of the small stream bridge. Chinese Pond Turtle. Standard-tier starter; Mud head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Mud 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Countryside Path · Spawn 5"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Mud"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Mud",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00211"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check near the exit to Rendai Field. Chinese Pond Turtle. Higher-tier starter. Caps at pickup: Stamina 140–179; Leg Power 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Countryside Path · Spawn 2"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Higher-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "140–179"
          },
          {
            "label": "Leg Power",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00212"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check near the small stream bridge. Japanese Pond Turtle. Standard-tier starter; Sand head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Sand 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Countryside Path · Spawn 4"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Sand"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Sand",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00213"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check beside the stables. Chinese Pond Turtle. Lower-tier starter; Mud head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Mud 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Countryside Path · Spawn 6"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Lower-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Mud"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "64–103"
          },
          {
            "label": "Leg Power",
            "value": "10–51"
          },
          {
            "label": "Mud",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00214"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check by the chicken seller near the Yoshioka Dojo exit. Chinese Pond Turtle. Lower-tier starter; Sand head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Sand 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Countryside Path · Spawn 10"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Lower-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Sand"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "64–103"
          },
          {
            "label": "Leg Power",
            "value": "10–51"
          },
          {
            "label": "Sand",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00215"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check near the egg seller at the west end of the path. Japanese Pond Turtle. Higher-tier starter. Caps at pickup: Stamina 140–179; Leg Power 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Countryside Path · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Higher-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "140–179"
          },
          {
            "label": "Leg Power",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00216"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the south side of the path as you reach the eastern fields from the stables. Chinese Pond Turtle. Standard-tier starter; Mud head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Mud 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Countryside Path · Spawn 7"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Mud"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Mud",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00217"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the south side of the path in the eastern fields, toward the dojo exit. Japanese Pond Turtle. Lower-tier starter; Mud head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Mud 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Countryside Path · Spawn 9"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Lower-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Mud"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "64–103"
          },
          {
            "label": "Leg Power",
            "value": "10–51"
          },
          {
            "label": "Mud",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00218"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the north side of the path in the eastern fields. Japanese Pond Turtle. Standard-tier starter; Mud head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Mud 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Countryside Path · Spawn 8"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Mud"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Mud",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0021e"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check just west of the bridge. Japanese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Cliffside Path · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0021f"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the south end of Cliffside Path toward the tea house. Japanese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Cliffside Path · Spawn 2"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0014e"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the bridge branch at the south end of Mountain Path. Chinese Pond Turtle. Standard-tier starter; Sand head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Sand 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Mountain Path · Spawn 4"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Sand"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Sand",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00151"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the main road near the top of the waterfall spur. Japanese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Mountain Path · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00219"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the spur leading down toward the waterfall. Chinese Pond Turtle. Standard-tier starter; Water head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Water 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Mountain Path · Spawn 2"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Water"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Water",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0021a"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the main path east of the monk’s hall. Chinese Pond Turtle. Higher-tier starter; Sand head start. Caps at pickup: Stamina 140–179; Leg Power 102–153; Sand 204–255. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Mountain Path · Spawn 3"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Higher-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Sand"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "140–179"
          },
          {
            "label": "Leg Power",
            "value": "102–153"
          },
          {
            "label": "Sand",
            "value": "204–255"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00223"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check east of the Riverside Tea House palanquin stop. Chinese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Riverside Teahouse · Spawn 2"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b00224"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the tea house approach from the Riverside Path exit. Japanese Pond Turtle. Standard-tier starter; Water head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Water 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Riverside Teahouse · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Water"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Water",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0020b"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the Zanki Dojo grounds. Chinese Pond Turtle. Standard-tier starter; Sand head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Sand 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Zanki Dojo · grounds · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Chinese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Standard-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Sand"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "102–141"
          },
          {
            "label": "Leg Power",
            "value": "51–102"
          },
          {
            "label": "Sand",
            "value": "153–204"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0021b"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the lower bend nearer Mountain Path. Japanese Pond Turtle. Lower-tier starter; Water head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Water 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Waterfall · Spawn 2"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Lower-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Water"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "64–103"
          },
          {
            "label": "Leg Power",
            "value": "10–51"
          },
          {
            "label": "Water",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "wild-turtle-00b0021c"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Check the upper bend on the waterfall approach. Japanese Pond Turtle. Lower-tier starter; Water head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Water 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots."
      ],
      [
        "entries.0.name",
        "Waterfall · Spawn 1"
      ]
    ],
    "facts": [
      {
        "label": "Species",
        "value": "Japanese Pond Turtle"
      },
      {
        "label": "Starting tier",
        "value": "Lower-tier"
      },
      {
        "label": "Terrain head start",
        "value": "Water"
      }
    ],
    "factSections": [
      {
        "label": "Caps at pickup",
        "note": "Current stats can be lower.",
        "facts": [
          {
            "label": "Stamina",
            "value": "64–103"
          },
          {
            "label": "Leg Power",
            "value": "10–51"
          },
          {
            "label": "Water",
            "value": "102–153"
          }
        ]
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "cat-search-b"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Catch the cat on Kōetsu’s mansion grounds during #58’s two-minute search. Each catch takes you back to Tsuchiura. Choose the first option to keep looking."
      ],
      [
        "entries.0.name",
        "Missing cat B"
      ]
    ],
    "facts": [
      {
        "label": "Search limit",
        "value": "2 minutes",
        "note": "Quest #58 search phase. Each catch returns you to Tsuchiura; first option continues, second stops."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "cat-search-c"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Catch the cat by the maple before Shijo Bridge during #58’s two-minute search. Each catch takes you back to Tsuchiura. Choose the first option to keep looking."
      ],
      [
        "entries.0.name",
        "Missing cat C"
      ]
    ],
    "facts": [
      {
        "label": "Search limit",
        "value": "2 minutes",
        "note": "Quest #58 search phase. Each catch returns you to Tsuchiura; first option continues, second stops."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "cat-search-d"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Catch the cat near the Rakugai exit across Shijo Bridge during #58’s two-minute search. Each catch takes you back to Tsuchiura. Choose the first option to keep looking."
      ],
      [
        "entries.0.name",
        "Missing cat D"
      ]
    ],
    "facts": [
      {
        "label": "Search limit",
        "value": "2 minutes",
        "note": "Quest #58 search phase. Each catch returns you to Tsuchiura; first option continues, second stops."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "cat-search-e"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Catch the cat near Tsuchiura during #58’s two-minute search. Each catch takes you back to Tsuchiura. Choose the first option to keep looking."
      ],
      [
        "entries.0.name",
        "Missing cat E"
      ]
    ],
    "facts": [
      {
        "label": "Search limit",
        "value": "2 minutes",
        "note": "Quest #58 search phase. Each catch returns you to Tsuchiura; first option continues, second stops."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "cat-search-f"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Catch the cat by the exit to Yoshioka Dojo during #58’s two-minute search. Each catch takes you back to Tsuchiura. Choose the first option to keep looking."
      ],
      [
        "entries.0.name",
        "Missing cat F"
      ]
    ],
    "facts": [
      {
        "label": "Search limit",
        "value": "2 minutes",
        "note": "Quest #58 search phase. Each catch returns you to Tsuchiura; first option continues, second stops."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "buried-jomon-pottery"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "In #65, feed the rescued dog three Raw Chicken, one at a time. Follow it to the dig spot on Riverside Path and choose the first option to dig. Other foods yield different rewards."
      ],
      [
        "entries.0.name",
        "Jomon Pottery"
      ]
    ],
    "facts": [
      {
        "label": "Feed",
        "value": "3 × Raw Chicken",
        "note": "Feed one at a time; other foods give different rewards."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "eternal-turtle"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Complete all seven yūjo requests (#1–7) and receive their final letters. Open the reward letter at Tatsuya and claim the attached turtle with a free inventory space and turtle slot. It can keep racing without dying of old age and can reach the maximum in every stat."
      ],
      [
        "entries.0.name",
        "Eternal Turtle"
      ]
    ],
    "facts": [
      {
        "label": "Requests",
        "value": "All 7 yūjo requests + final letters",
        "note": "Receive all seven final letters, then open the reward letter at Tatsuya. Either route counts."
      },
      {
        "label": "Space needed",
        "value": "Inventory space + turtle slot",
        "note": "Both are needed when claiming the attachment from the reward letter at Tatsuya."
      },
      {
        "label": "Longevity",
        "value": "Does not die of old age"
      },
      {
        "label": "Potential",
        "value": "Can reach maximum in every stat"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "eternal-turtle-gion"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "With the Turtle Bucket unlocked, collect all four replacement turtles and record five turtle deaths at Tatsuya. Then check this spot in southern Gion. Either route counts toward the Eternal Turtle reward."
      ],
      [
        "entries.0.name",
        "Eternal Turtle · Gion route"
      ]
    ],
    "facts": [
      {
        "label": "Replacement turtles",
        "value": "4",
        "note": "This Gion route needs the Turtle Bucket unlocked, all four replacement turtles collected, and five turtle deaths recorded at Tatsuya. Either route counts."
      },
      {
        "label": "Recorded turtle deaths",
        "value": "5",
        "note": "This Gion route needs the Turtle Bucket unlocked, all four replacement turtles collected, and five turtle deaths recorded at Tatsuya. Either route counts."
      },
      {
        "label": "Requires",
        "value": "Turtle Bucket unlocked",
        "note": "This Gion route needs the Turtle Bucket unlocked, all four replacement turtles collected, and five turtle deaths recorded at Tatsuya. Either route counts."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "revelation-picture-oblivious-cat"
    },
    "target": "entries.2",
    "expected": [
      [
        "entries.2.detail",
        "After learning Oblivious Cat, reach level 15 and speak to Shichigoro at Gion Inari Shrine for the painting."
      ],
      [
        "entries.2.name",
        "Painting of a Dog"
      ]
    ],
    "facts": [
      {
        "label": "Level",
        "value": "At least 15",
        "note": "After learning Oblivious Cat, reach level 15 and speak to Shichigoro at Gion Inari Shrine for the painting."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "revelation-picture-oblivious-cat"
    },
    "target": "entries.3",
    "expected": [
      [
        "entries.3.detail",
        "Learn Oblivious Cat and finish the greatsword tutorial, then reach level 17 and get the painting from Shichigoro at Gion Inari Shrine."
      ],
      [
        "entries.3.name",
        "Painting of a Monkey"
      ]
    ],
    "facts": [
      {
        "label": "Level",
        "value": "At least 17",
        "note": "Learn Oblivious Cat and finish the greatsword tutorial, then reach level 17 and get the painting from Shichigoro at Gion Inari Shrine."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "revelation-picture-oblivious-cat"
    },
    "target": "entries.4",
    "expected": [
      [
        "entries.4.detail",
        "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 18 and collect the painting from Shichigoro at Gion Inari Shrine."
      ],
      [
        "entries.4.name",
        "Painting of a Sleeping Cat"
      ]
    ],
    "facts": [
      {
        "label": "Level",
        "value": "At least 18",
        "note": "After learning Oblivious Cat and finishing the greatsword tutorial, reach level 18 and collect the painting from Shichigoro at Gion Inari Shrine."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "revelation-picture-oblivious-cat"
    },
    "target": "entries.9",
    "expected": [
      [
        "entries.9.detail",
        "Reach level 25 and speak to Shichigoro at Gion Inari Shrine. He can give you the painting after the Sleeping Cat painting, before the countryside event opens."
      ],
      [
        "entries.9.name",
        "Painting of a Running Bull"
      ]
    ],
    "facts": [
      {
        "label": "Level",
        "value": "At least 25",
        "note": "Reach level 25 and speak to Shichigoro at Gion Inari Shrine. He can give you the painting after the Sleeping Cat painting, before the countryside event opens."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "revelation-picture-oblivious-cat"
    },
    "target": "entries.11",
    "expected": [
      [
        "entries.11.detail",
        "Reach level 30 and get the painting from Shichigoro at Gion Inari Shrine after the Running Bull painting."
      ],
      [
        "entries.11.name",
        "Painting of a Wolf"
      ]
    ],
    "facts": [
      {
        "label": "Level",
        "value": "At least 30",
        "note": "Reach level 30 and get the painting from Shichigoro at Gion Inari Shrine after the Running Bull painting."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "revelation-picture-karakuri-spin"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Buy the schematic for 2,000 mon from the man inside Ebisuya Pawn in Gion."
      ],
      [
        "entries.0.name",
        "Schematic of a Clock"
      ]
    ],
    "facts": [
      {
        "label": "Cost",
        "value": "2,000 mon",
        "note": "Buy the schematic for 2,000 mon from the man inside Ebisuya Pawn in Gion."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-beautiful-sword-appraisal"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Find key F-5 at this pin, then use it at the Gion storage lockers to get the book."
      ],
      [
        "entries.0.name",
        "Beautiful Sword Appraisal Guide"
      ]
    ],
    "facts": [
      {
        "label": "Locker key",
        "value": "F-5",
        "note": "Use this key at the Gion storage lockers to obtain the book; the book is not picked up at the key location."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-lion-swordfighting"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Find key G-1 at this pin, then use it at the Gion storage lockers to get the book."
      ],
      [
        "entries.0.name",
        "Book of Lion Swordfighting"
      ]
    ],
    "facts": [
      {
        "label": "Locker key",
        "value": "G-1",
        "note": "Use this key at the Gion storage lockers to obtain the book; the book is not picked up at the key location."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-hundred-nights"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Find key C-3 at this pin, then use it at the Gion storage lockers to get the book."
      ],
      [
        "entries.0.name",
        "Book of 100 Nights and 1,000 Darknesses"
      ]
    ],
    "facts": [
      {
        "label": "Locker key",
        "value": "C-3",
        "note": "Use this key at the Gion storage lockers to obtain the book; the book is not picked up at the key location."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-suijin-offerings"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Find key J-2 at this pin, then use it at the Gion storage lockers to get the book."
      ],
      [
        "entries.0.name",
        "Book of Offerings to Suijin"
      ]
    ],
    "facts": [
      {
        "label": "Locker key",
        "value": "J-2",
        "note": "Use this key at the Gion storage lockers to obtain the book; the book is not picked up at the key location."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-yamimaro-2"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Find key A-5 at this pin, then use it at the Gion storage lockers to get the book."
      ],
      [
        "entries.0.name",
        "Archive of Yamimaro - Volume 2"
      ]
    ],
    "facts": [
      {
        "label": "Locker key",
        "value": "A-5",
        "note": "Use this key at the Gion storage lockers to obtain the book; the book is not picked up at the key location."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-yamimaro-3"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Find key H-4 at this pin, then use it at the Gion storage lockers to get the book."
      ],
      [
        "entries.0.name",
        "Archive of Yamimaro - Volume 3"
      ]
    ],
    "facts": [
      {
        "label": "Locker key",
        "value": "H-4",
        "note": "Use this key at the Gion storage lockers to obtain the book; the book is not picked up at the key location."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-resurrection"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Find key D-5 at this pin, then use it at the Gion storage lockers to get the book."
      ],
      [
        "entries.0.name",
        "Book of Resurrection"
      ]
    ],
    "facts": [
      {
        "label": "Locker key",
        "value": "D-5",
        "note": "Use this key at the Gion storage lockers to obtain the book; the book is not picked up at the key location."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-strange-tengu"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Find key H-2 at this pin, then use it at the Gion storage lockers to get the book."
      ],
      [
        "entries.0.name",
        "Strange Tale of the Tengu"
      ]
    ],
    "facts": [
      {
        "label": "Locker key",
        "value": "H-2",
        "note": "Use this key at the Gion storage lockers to obtain the book; the book is not picked up at the key location."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-nue-mizuchi"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "During #41, pay Zenjiro 100 mon to try drawing the sword. Defeat him and the Takeo Family to get the book."
      ],
      [
        "entries.0.name",
        "Legend of the Defeat of the Nue and Mizuchi"
      ]
    ],
    "facts": [
      {
        "label": "Sword attempt fee",
        "value": "100 mon",
        "note": "During #41, pay to try drawing the sword, then defeat Zenjiro and the Takeo Family to get the book."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-oni-forging"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "From Chapter 10, buy this book for 2 ryō as the merchant’s third offer at Sanjūsangendō. Buy each earlier offer and leave and re-enter to see the next one."
      ],
      [
        "entries.0.name",
        "Oni Blade Forging Guide"
      ]
    ],
    "facts": [
      {
        "label": "Cost",
        "value": "2 ryō",
        "note": "From Chapter 10, buy this book for 2 ryō as the merchant’s third offer at Sanjūsangendō. Buy each earlier offer and leave and re-enter to see the next one."
      },
      {
        "label": "Offer",
        "value": "3",
        "note": "From Chapter 10. Buy each earlier offer and leave and re-enter to see the next offer."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-oni-forging"
    },
    "target": "entries.1",
    "expected": [
      [
        "entries.1.detail",
        "Buy this mask for 2 ryō as the Sanjūsangendō merchant’s offer #1. Buy each earlier offer and leave and re-enter to reveal the next one. Bring the mask to Rendai Field in the evening and win its duel to receive the finished mask."
      ],
      [
        "entries.1.name",
        "Mysterious Small Tengu Mask"
      ]
    ],
    "facts": [
      {
        "label": "Cost",
        "value": "2 ryō",
        "note": "Buy this mask for 2 ryō as the Sanjūsangendō merchant’s offer #1. Buy each earlier offer and leave and re-enter to reveal the next one. Bring the mask to Rendai Field in the evening and win its duel to receive the finished mask."
      },
      {
        "label": "Offer",
        "value": "1",
        "note": "From Chapter 10. Buy each earlier offer and leave and re-enter to see the next offer."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-oni-forging"
    },
    "target": "entries.2",
    "expected": [
      [
        "entries.2.detail",
        "Buy this mask for 2 ryō as the Sanjūsangendō merchant’s offer #8. Buy each earlier offer and leave and re-enter to reveal the next one. Bring the mask to Rendai Field in the evening and win its duel to receive the finished mask."
      ],
      [
        "entries.2.name",
        "Mysterious Raven Tengu Mask"
      ]
    ],
    "facts": [
      {
        "label": "Cost",
        "value": "2 ryō",
        "note": "Buy this mask for 2 ryō as the Sanjūsangendō merchant’s offer #8. Buy each earlier offer and leave and re-enter to reveal the next one. Bring the mask to Rendai Field in the evening and win its duel to receive the finished mask."
      },
      {
        "label": "Offer",
        "value": "8",
        "note": "From Chapter 10. Buy each earlier offer and leave and re-enter to see the next offer."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-oni-forging"
    },
    "target": "entries.3",
    "expected": [
      [
        "entries.3.detail",
        "Buy this mask for 2 ryō as the Sanjūsangendō merchant’s offer #10. Buy each earlier offer and leave and re-enter to reveal the next one. Bring the mask to Rendai Field in the evening and win its duel to receive the finished mask."
      ],
      [
        "entries.3.name",
        "Mysterious Tengu Mask"
      ]
    ],
    "facts": [
      {
        "label": "Cost",
        "value": "2 ryō",
        "note": "Buy this mask for 2 ryō as the Sanjūsangendō merchant’s offer #10. Buy each earlier offer and leave and re-enter to reveal the next one. Bring the mask to Rendai Field in the evening and win its duel to receive the finished mask."
      },
      {
        "label": "Offer",
        "value": "10",
        "note": "From Chapter 10. Buy each earlier offer and leave and re-enter to see the next offer."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "recipe-oni-forging"
    },
    "target": "entries.4",
    "expected": [
      [
        "entries.4.detail",
        "Buy this mask for 2 ryō as the Sanjūsangendō merchant’s offer #12. Buy each earlier offer and leave and re-enter to reveal the next one. Bring the mask to Rendai Field in the evening and win its duel to receive the finished mask."
      ],
      [
        "entries.4.name",
        "Mysterious Great Tengu Mask"
      ]
    ],
    "facts": [
      {
        "label": "Cost",
        "value": "2 ryō",
        "note": "Buy this mask for 2 ryō as the Sanjūsangendō merchant’s offer #12. Buy each earlier offer and leave and re-enter to reveal the next one. Bring the mask to Rendai Field in the evening and win its duel to receive the finished mask."
      },
      {
        "label": "Offer",
        "value": "12",
        "note": "From Chapter 10. Buy each earlier offer and leave and re-enter to see the next offer."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "sideshow-ticket-nude-dance"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Order 4 times at Sushi Ginya to earn the ticket. Redeem it at the Rakugai Sideshow Tent."
      ],
      [
        "entries.0.name",
        "Ticket (Nude Dance)"
      ]
    ],
    "facts": [
      {
        "label": "Orders",
        "value": "4",
        "note": "Redeem it at the Rakugai Sideshow Tent."
      },
      {
        "label": "Restaurant",
        "value": "Sushi Ginya"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "sideshow-ticket-erotic-dance"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Order 3 times at Koyoro to earn the ticket. Redeem it at the Rakugai Sideshow Tent."
      ],
      [
        "entries.0.name",
        "Ticket (Erotic Dance)"
      ]
    ],
    "facts": [
      {
        "label": "Orders",
        "value": "3",
        "note": "Redeem it at the Rakugai Sideshow Tent."
      },
      {
        "label": "Restaurant",
        "value": "Koyoro"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "sideshow-ticket-snake-eating"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Order 4 times at Sake Ikkonya to earn the ticket. Redeem it at the Rakugai Sideshow Tent."
      ],
      [
        "entries.0.name",
        "Ticket (Snake-Eating Woman)"
      ]
    ],
    "facts": [
      {
        "label": "Orders",
        "value": "4",
        "note": "Redeem it at the Rakugai Sideshow Tent."
      },
      {
        "label": "Restaurant",
        "value": "Sake Ikkonya"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "sideshow-ticket-flaming-man"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Order 4 times at Sake Nakanokura to earn the ticket. Redeem it at the Rakugai Sideshow Tent."
      ],
      [
        "entries.0.name",
        "Ticket (Flaming Man)"
      ]
    ],
    "facts": [
      {
        "label": "Orders",
        "value": "4",
        "note": "Redeem it at the Rakugai Sideshow Tent."
      },
      {
        "label": "Restaurant",
        "value": "Sake Nakanokura"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "sideshow-ticket-naked-couple"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Order 3 times at Hatsukaze to earn the ticket. Redeem it at the Rakugai Sideshow Tent."
      ],
      [
        "entries.0.name",
        "Ticket (Naked Couple)"
      ]
    ],
    "facts": [
      {
        "label": "Orders",
        "value": "3",
        "note": "Redeem it at the Rakugai Sideshow Tent."
      },
      {
        "label": "Restaurant",
        "value": "Hatsukaze"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "sideshow-ticket-sword-dance-nonaka"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Order 5 times at Nonaka Tea House to earn the ticket. Redeem it at the Rakugai Sideshow Tent. You can also earn it at Riverside Tea House."
      ],
      [
        "entries.0.name",
        "Ticket (Sword Dance)"
      ]
    ],
    "facts": [
      {
        "label": "Orders",
        "value": "5",
        "note": "Redeem it at the Rakugai Sideshow Tent. You can also earn it at Riverside Tea House."
      },
      {
        "label": "Restaurant",
        "value": "Nonaka Tea House"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "sideshow-ticket-sword-dance-riverside"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Order 5 times at Riverside Tea House to earn the ticket. Redeem it at the Rakugai Sideshow Tent. You can also earn it at Nonaka Tea House."
      ],
      [
        "entries.0.name",
        "Ticket (Sword Dance)"
      ]
    ],
    "facts": [
      {
        "label": "Orders",
        "value": "5",
        "note": "Redeem it at the Rakugai Sideshow Tent. You can also earn it at Nonaka Tea House."
      },
      {
        "label": "Restaurant",
        "value": "Riverside Tea House"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "sideshow-ticket-leaping-monkey"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Order 4 times at Shirohebi Udon to earn the ticket. Redeem it at the Rakugai Sideshow Tent."
      ],
      [
        "entries.0.name",
        "Ticket (Leaping Monkey)"
      ]
    ],
    "facts": [
      {
        "label": "Orders",
        "value": "4",
        "note": "Redeem it at the Rakugai Sideshow Tent."
      },
      {
        "label": "Restaurant",
        "value": "Shirohebi Udon"
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "enchanted-sword-bassarimaru"
    },
    "target": "entries.0",
    "expected": [
      [
        "entries.0.detail",
        "Buy the sword inside Ebisuya Pawn for 34,000 mon from Chapter 6 onward, before Gion closes. Keep it for #20, the Enchanted Swords request at the Rakugai Blacksmith."
      ],
      [
        "entries.0.name",
        "Bassarimaru"
      ]
    ],
    "facts": [
      {
        "label": "Cost",
        "value": "34,000 mon",
        "note": "Buy the sword inside Ebisuya Pawn for 34,000 mon from Chapter 6 onward, before Gion closes. Keep it for #20, the Enchanted Swords request at the Rakugai Blacksmith."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c064d"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c064e"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0650"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0651"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0656"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0657"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0653"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0654"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0289"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c028a"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c028b"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c028c"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c028d"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c028e"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c028f"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0290"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0291"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 5. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "5"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0292"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 5. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "5"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c025c"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 7",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c025d"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 7",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c025e"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 7",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c025f"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 7",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0261"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 7",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0262"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 7",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0263"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 7",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0264"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 5 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 5",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0265"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 5 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 5",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0266"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 5 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 5",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0267"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 5 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 5",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0268"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 5 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 5",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c026a"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c026b"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c026d"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c026e"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c026f"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0270"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0271"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0293"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0294"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0295"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0299"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c029a"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c029d"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c029e"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c029f"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02a3"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02a4"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02a7"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02a8"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02a9"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02ab"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02ac"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02ad"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02ae"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02af"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02b0"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02b1"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02b2"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02b3"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02b4"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c063f"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0640"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0642"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0643"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0644"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0646"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0647"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0648"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c064a"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c064b"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02b5"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02b6"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02b7"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02b8"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02b9"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02ba"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02bb"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02bc"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02bd"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02be"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c02bf"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 3",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "May patrol",
        "note": "Enemies may patrol away from this marked starting point."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0248"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0249"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "1"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c024a"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c024b"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "2"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c024c"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c024e"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "3"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c024f"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0250"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "4"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 2",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0251"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 5. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "5"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0252"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 5. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "5"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0254"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 5. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "5"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0255"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 5. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "5"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0257"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 6. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "6"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c0259"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 6. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "6"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c025a"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 6. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "6"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  },
  {
    "scope": "place",
    "match": {
      "id": "encounter-007c025b"
    },
    "expected": [
      [
        "detail",
        "Possible spawn in section 6. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here."
      ]
    ],
    "facts": [
      {
        "label": "Section",
        "value": "6"
      },
      {
        "label": "Active sites",
        "value": "At most 1 of 4",
        "note": "Maximum active starting sites in this section; this is not an enemy count or spawn probability."
      },
      {
        "label": "Behavior",
        "value": "Starts standing",
        "note": "This is the starting position and initial behavior."
      }
    ]
  }
];
const get = (object, route) => route ? route.split('.').reduce((value,key)=>value?.[key],object) : object;
function append(target, key, values) {
  target[key] ??= [];
  for (const value of values) if (!target[key].some(existing=>JSON.stringify(existing)===JSON.stringify(value))) target[key].push(structuredClone(value));
}
function matches(value, match) {
  return Object.entries(match).every(([key,expected]) => key === 'retry' ? Boolean(value[key]) === expected : value[key] === expected);
}
function enrichAtlasFacts({quests,places}) {
  const result = structuredClone({quests,places});
  const activities = result.places.flatMap(place=>place.routes??[]);
  for (const patch of patches) {
    const records = patch.scope === 'quest' ? result.quests : patch.scope === 'activity' ? activities : result.places;
    const found = records.filter(record=>matches(record,patch.match));
    assert(found.length <= 1, 'Ambiguous Kenzan fact binding: '+JSON.stringify(patch.match));
    if (!found.length) continue; // The integrated guide can provide a subset of routes.
    const record = found[0];
    for (const [field,expected] of patch.expected) assert.deepEqual(get(record,field),expected,'Kenzan fact source changed: '+JSON.stringify(patch.match)+' '+field);
    const target = get(record,patch.target);
    assert(target && typeof target === 'object', 'Missing Kenzan fact target: '+JSON.stringify(patch.match));
    for (const key of ['facts','factSections']) if (patch[key]) append(target,key,patch[key]);
  }
  assert.equal(weaponBindings.bindings.length,8,'Expected eight native stage-weapon bindings');
  for (const binding of weaponBindings.bindings) {
    assert.deepEqual(binding.matchingNativeItemIds,[binding.itemId],'Ambiguous native stage-weapon item ID');
    const pins = result.places.filter(place=>place.id===binding.pinId);
    assert(pins.length<=1,'Duplicate stage-weapon pin '+binding.pinId);
    if (!pins.length) continue;
    const pin=pins[0];
    assert.equal(pin.type,'stage-weapon','Wrong stage-weapon layer for '+binding.pinId);
    const weapons=weaponStats.weapons.filter(weapon=>weapon.itemId===binding.itemId);
    assert.equal(weapons.length,1,'Missing weapon stats for native item ID '+binding.itemId);
    const weapon=weapons[0];
    assert.equal(weapon.name,binding.name,'Weapon item binding changed for '+binding.pinId);
    const entries=pin.entries.filter(entry=>entry.name===binding.name);
    assert.equal(entries.length,1,'Stage-weapon entry changed for '+binding.pinId);
    append(entries[0],'factSections',[{
      label:'Base weapon stats',
      note:'Base stats of this individual, unmodified weapon. Character Attack and combat damage can differ.',
      facts:[{label:'Base Attack',value:String(weapon.attack)},{label:'Force',value:String(weapon.force)},{label:'Speed',value:weapon.speed.label}],
    }]);
  }
  return result;
}
module.exports = {enrichAtlasFacts};
