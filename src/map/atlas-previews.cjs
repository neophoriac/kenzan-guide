// Kenzan-only tooltip action curation. Keep the complete source instructions
// in the selected details; only the hover action is shortened here.
// Review/generation: research/kenzan60/focused-tooltips-20261120/data/.
// Apply after enrichAtlasFacts so omitted repeated numbers remain qualified.
const assert = require('node:assert/strict');
const patches = [
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00086"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00086",
    "entryName": "Gion · Spawn 2",
    "expected": "Check the southwest corner near Suiten Inari. Chinese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the southwest corner near Suiten Inari."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b000ab"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b000ab",
    "entryName": "Gion · Spawn 1",
    "expected": "Check the Gion Inari shrine grounds. Japanese Pond Turtle. Standard-tier starter; Mud head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Mud 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the Gion Inari shrine grounds."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00222"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00222",
    "entryName": "Hozoin · Spawn 1",
    "expected": "Check near the Hozoin reception desk. Japanese Pond Turtle. Higher-tier starter; Water head start. Caps at pickup: Stamina 140–179; Leg Power 102–153; Water 204–255. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check near the Hozoin reception desk."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b001f4"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b001f4",
    "entryName": "Riverside Path · Spawn 1",
    "expected": "Check by the tea stall at the north end of Riverside Path. Chinese Pond Turtle. Standard-tier starter; Water head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Water 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check by the tea stall at the north end of Riverside Path."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b001f5"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b001f5",
    "entryName": "Riverside Path · Spawn 4",
    "expected": "Check the lower stretch of Riverside Path north of the small building by the stairs. Japanese Pond Turtle. Lower-tier starter; Sand head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Sand 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the lower stretch of Riverside Path north of the small building by the stairs."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b001f6"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b001f6",
    "entryName": "Riverside Path · Spawn 2",
    "expected": "Check the west edge of the narrow bend just north of the big tree. Japanese Pond Turtle. Lower-tier starter. Caps at pickup: Stamina 64–103; Leg Power 10–51. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the west edge of the narrow bend just north of the big tree."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b001f7"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b001f7",
    "entryName": "Riverside Path · Spawn 5",
    "expected": "Check near the stairs at the south end of Riverside Path. Japanese Pond Turtle. Lower-tier starter. Caps at pickup: Stamina 64–103; Leg Power 10–51. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check near the stairs at the south end of Riverside Path."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0021d"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0021d",
    "entryName": "Riverside Path · Spawn 3",
    "expected": "Check the east edge of the narrow bend just north of the big tree. Japanese Pond Turtle. Lower-tier starter; Water head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Water 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the east edge of the narrow bend just north of the big tree."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0020c"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0020c",
    "entryName": "Kawaramachi · Spawn 3",
    "expected": "Check by the maple before Shijo Bridge. Chinese Pond Turtle. Higher-tier starter. Caps at pickup: Stamina 140–179; Leg Power 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check by the maple before Shijo Bridge."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0020d"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0020d",
    "entryName": "Kawaramachi · Spawn 2",
    "expected": "Check northwest of Kawaramachi Inn. Japanese Pond Turtle. Lower-tier starter; Sand head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Sand 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check northwest of Kawaramachi Inn."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0020e"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0020e",
    "entryName": "Kawaramachi · Spawn 1",
    "expected": "Check by the lantern near the turnoff to Kōetsu’s mansion. Japanese Pond Turtle. Standard-tier starter; Water head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Water 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check by the lantern near the turnoff to Kōetsu’s mansion."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0020f"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0020f",
    "entryName": "Kawaramachi · Spawn 5",
    "expected": "Check near the Rakugai exit. Chinese Pond Turtle. Standard-tier starter; Sand head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Sand 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check near the Rakugai exit."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00210"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00210",
    "entryName": "Kawaramachi · Spawn 4",
    "expected": "Check toward the Rakugai end of Shijo Bridge. Chinese Pond Turtle. Higher-tier starter. Caps at pickup: Stamina 140–179; Leg Power 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check toward the Rakugai end of Shijo Bridge."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00220"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00220",
    "entryName": "Forest Path · Spawn 1",
    "expected": "Check near the horse archery stable. Chinese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check near the horse archery stable."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00221"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00221",
    "entryName": "Forest Path · Spawn 2",
    "expected": "Check the path by the turnoff to Shishido’s cave. Chinese Pond Turtle. Higher-tier starter; Sand head start. Caps at pickup: Stamina 140–179; Leg Power 102–153; Sand 204–255. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the path by the turnoff to Shishido’s cave."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0014f"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0014f",
    "entryName": "Countryside Path · Spawn 3",
    "expected": "Check the west bend near the roadside Jizo statues. Japanese Pond Turtle. Standard-tier starter; Sand head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Sand 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the west bend near the roadside Jizo statues."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00150"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00150",
    "entryName": "Countryside Path · Spawn 5",
    "expected": "Check just east of the small stream bridge. Chinese Pond Turtle. Standard-tier starter; Mud head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Mud 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check just east of the small stream bridge."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00211"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00211",
    "entryName": "Countryside Path · Spawn 2",
    "expected": "Check near the exit to Rendai Field. Chinese Pond Turtle. Higher-tier starter. Caps at pickup: Stamina 140–179; Leg Power 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check near the exit to Rendai Field."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00212"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00212",
    "entryName": "Countryside Path · Spawn 4",
    "expected": "Check near the small stream bridge. Japanese Pond Turtle. Standard-tier starter; Sand head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Sand 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check near the small stream bridge."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00213"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00213",
    "entryName": "Countryside Path · Spawn 6",
    "expected": "Check beside the stables. Chinese Pond Turtle. Lower-tier starter; Mud head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Mud 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check beside the stables."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00214"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00214",
    "entryName": "Countryside Path · Spawn 10",
    "expected": "Check by the chicken seller near the Yoshioka Dojo exit. Chinese Pond Turtle. Lower-tier starter; Sand head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Sand 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check by the chicken seller near the Yoshioka Dojo exit."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00215"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00215",
    "entryName": "Countryside Path · Spawn 1",
    "expected": "Check near the egg seller at the west end of the path. Japanese Pond Turtle. Higher-tier starter. Caps at pickup: Stamina 140–179; Leg Power 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check near the egg seller at the west end of the path."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00216"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00216",
    "entryName": "Countryside Path · Spawn 7",
    "expected": "Check the south side of the path as you reach the eastern fields from the stables. Chinese Pond Turtle. Standard-tier starter; Mud head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Mud 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the south side of the path as you reach the eastern fields from the stables."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00217"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00217",
    "entryName": "Countryside Path · Spawn 9",
    "expected": "Check the south side of the path in the eastern fields, toward the dojo exit. Japanese Pond Turtle. Lower-tier starter; Mud head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Mud 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the south side of the path in the eastern fields, toward the dojo exit."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00218"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00218",
    "entryName": "Countryside Path · Spawn 8",
    "expected": "Check the north side of the path in the eastern fields. Japanese Pond Turtle. Standard-tier starter; Mud head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Mud 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the north side of the path in the eastern fields."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0021e"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0021e",
    "entryName": "Cliffside Path · Spawn 1",
    "expected": "Check just west of the bridge. Japanese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check just west of the bridge."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0021f"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0021f",
    "entryName": "Cliffside Path · Spawn 2",
    "expected": "Check the south end of Cliffside Path toward the tea house. Japanese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the south end of Cliffside Path toward the tea house."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0014e"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0014e",
    "entryName": "Mountain Path · Spawn 4",
    "expected": "Check the bridge branch at the south end of Mountain Path. Chinese Pond Turtle. Standard-tier starter; Sand head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Sand 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the bridge branch at the south end of Mountain Path."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00151"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00151",
    "entryName": "Mountain Path · Spawn 1",
    "expected": "Check the main road near the top of the waterfall spur. Japanese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the main road near the top of the waterfall spur."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00219"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00219",
    "entryName": "Mountain Path · Spawn 2",
    "expected": "Check the spur leading down toward the waterfall. Chinese Pond Turtle. Standard-tier starter; Water head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Water 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the spur leading down toward the waterfall."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0021a"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0021a",
    "entryName": "Mountain Path · Spawn 3",
    "expected": "Check the main path east of the monk’s hall. Chinese Pond Turtle. Higher-tier starter; Sand head start. Caps at pickup: Stamina 140–179; Leg Power 102–153; Sand 204–255. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the main path east of the monk’s hall."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00223"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00223",
    "entryName": "Riverside Teahouse · Spawn 2",
    "expected": "Check east of the Riverside Tea House palanquin stop. Chinese Pond Turtle. Standard-tier starter. Caps at pickup: Stamina 102–141; Leg Power 51–102. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check east of the Riverside Tea House palanquin stop."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b00224"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b00224",
    "entryName": "Riverside Teahouse · Spawn 1",
    "expected": "Check the tea house approach from the Riverside Path exit. Japanese Pond Turtle. Standard-tier starter; Water head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Water 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the tea house approach from the Riverside Path exit."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0020b"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0020b",
    "entryName": "Zanki Dojo · grounds · Spawn 1",
    "expected": "Check the Zanki Dojo grounds. Chinese Pond Turtle. Standard-tier starter; Sand head start. Caps at pickup: Stamina 102–141; Leg Power 51–102; Sand 153–204. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the Zanki Dojo grounds."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0021b"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0021b",
    "entryName": "Waterfall · Spawn 2",
    "expected": "Check the lower bend nearer Mountain Path. Japanese Pond Turtle. Lower-tier starter; Water head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Water 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the lower bend nearer Mountain Path."
  },
  {
    "kind": "turtle",
    "match": {
      "id": "wild-turtle-00b0021c"
    },
    "type": "wild-turtle",
    "entryId": "wild-turtle-00b0021c",
    "entryName": "Waterfall · Spawn 1",
    "expected": "Check the upper bend on the waterfall approach. Japanese Pond Turtle. Lower-tier starter; Water head start. Caps at pickup: Stamina 64–103; Leg Power 10–51; Water 102–153. Current stats can be lower. Wild turtles can respawn at other spots after a catch. If this spot is empty, check the other marked spots.",
    "text": "Check the upper bend on the waterfall approach."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c064d"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 1. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c064e"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0650"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 2. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0651"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 2. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0656"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 3. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0657"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0653"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0654"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0289"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 1. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c028a"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 1. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c028b"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 2. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c028c"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 2. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c028d"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 3. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c028e"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 3. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c028f"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0290"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 4. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0291"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 5. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 5. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0292"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 5. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 5. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c025c"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 1. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c025d"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c025e"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c025f"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 1. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0261"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0262"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0263"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 7 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0264"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 5 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 2. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0265"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 5 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 2. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0266"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 5 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 2. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0267"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 5 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 2. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0268"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 5 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 2. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c026a"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 3. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c026b"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c026d"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c026e"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 3. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c026f"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0270"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0271"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0293"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 1. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0294"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0295"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0299"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 2. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c029a"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 2. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c029d"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 3. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c029e"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c029f"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02a3"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 4. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02a4"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02a7"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02a8"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02a9"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 1. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02ab"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 2. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02ac"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 2. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02ad"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02ae"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02af"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02b0"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02b1"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02b2"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02b3"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02b4"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 4 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c063f"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0640"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0642"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 2. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0643"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 2. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0644"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 2. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0646"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 3. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0647"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 3. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0648"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 3. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c064a"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 4. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c064b"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02b5"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 1. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02b6"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02b7"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 1. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02b8"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 2. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02b9"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 2. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02ba"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02bb"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 3. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02bc"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02bd"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 4. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02be"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 4. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c02bf"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 3 sites in this section at a time. Enemies may patrol away from this starting point.",
    "text": "Possible spawn in section 4. Enemies may patrol away from this starting point."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0248"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0249"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 1. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 1. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c024a"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 2. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c024b"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 2. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 2. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c024c"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c024e"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 3. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 3. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c024f"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 4. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0250"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 4. The game can use at most one of the 2 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 4. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0251"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 5. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 5. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0252"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 5. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 5. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0254"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 5. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 5. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0255"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 5. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 5. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0257"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 6. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 6. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c0259"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 6. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 6. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c025a"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 6. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 6. Enemies start standing here."
  },
  {
    "kind": "encounter",
    "match": {
      "id": "encounter-007c025b"
    },
    "type": "encounter",
    "expected": "Possible spawn in section 6. The game can use at most one of the 4 sites in this section at a time. Enemies start standing here.",
    "text": "Possible spawn in section 6. Enemies start standing here."
  },
  {
    "kind": "venue",
    "match": {
      "area": "st_gion",
      "type": "building",
      "name": "Tatsuya"
    },
    "type": "building",
    "expected": "Kiryu’s home, also called the House of the Dragon. Read commission letters, save or use item storage, and take the hidden passage to Rakugai.",
    "text": "Kiryu’s home, also called the House of the Dragon."
  },
  {
    "kind": "venue",
    "match": {
      "area": "st_gion",
      "type": "building",
      "name": "Sushi Ginya"
    },
    "type": "building",
    "expected": "A sushi restaurant serving rolls, pressed sushi and grilled eel. Dine here for restaurant completion and a theatre ticket.",
    "text": "A sushi restaurant serving rolls, pressed sushi and grilled eel."
  }
];

function setPreview(target, text) {
  const preview = { text };
  if (target.preview !== undefined) assert.deepEqual(target.preview, preview, 'Conflicting Kenzan tooltip preview');
  target.preview = preview;
}

function enrichAtlasPreviews({quests, places}) {
  const result = structuredClone({quests, places});
  for (const patch of patches) {
    const found = result.places.filter(place => Object.entries(patch.match).every(([key,value]) => place[key] === value));
    assert(found.length <= 1, 'Ambiguous Kenzan tooltip source: '+JSON.stringify(patch.match));
    if (!found.length) continue; // Hosts may expose only part of the map.
    const place = found[0];
    assert.equal(place.type, patch.type, 'Kenzan tooltip place type changed');
    let target = place;
    if (patch.kind === 'turtle') {
      assert.equal(place.entries?.length, 1, 'Wild turtle preview needs one bound entry');
      target = place.entries[0];
      assert.equal(target.progressId, patch.entryId, 'Wild turtle entry binding changed');
      assert.equal(target.name, patch.entryName, 'Wild turtle preview name changed');
      for (const label of ['Species','Starting tier']) assert(target.facts?.some(fact => fact.label === label), 'Missing turtle preview fact: '+label);
      const caps = target.factSections?.find(section => section.label === 'Caps at pickup');
      assert(caps && caps.note === 'Current stats can be lower.', 'Missing turtle cap qualification');
      for (const label of ['Stamina','Leg Power']) assert(caps.facts.some(fact => fact.label === label), 'Missing turtle cap fact: '+label);
    } else if (patch.kind === 'encounter') {
      for (const label of ['Section','Active sites','Behavior']) assert(place.facts?.some(fact => fact.label === label), 'Missing encounter preview fact: '+label);
      assert(place.facts.find(fact => fact.label === 'Active sites').note?.includes('not an enemy count or spawn probability'), 'Missing encounter count qualification');
    } else if (place.name === 'Tatsuya') {
      assert(place.facts?.some(fact => fact.label === 'Services' && fact.value === 'Letters · Save · Item storage · Rakugai passage'), 'Missing Tatsuya service facts');
    }
    assert.equal(target.detail, patch.expected, 'Kenzan tooltip source changed: '+JSON.stringify(patch.match));
    setPreview(target, patch.text);
  }
  return result;
}

module.exports = {enrichAtlasPreviews};
