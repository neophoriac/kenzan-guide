const assert = require('node:assert/strict');
const { renderLazyDetails } = require('../guide/lazy-details.cjs');
const { formatNativeText } = require('../guide/native-text.cjs');

const profiles = [
  ['Kinuyo', 'Yumejiya', 2500, [-0.5, -0.25, 0, 0.5, 1]],
  ['Suzukaze', 'Yumejiya', 2500, [-1, -0.5, 0, 0.5, 1]],
  ['Momochika', 'Yumejiya', 5000, [-1.25, -0.75, 0, 0.75, 1.25]],
  ['Hinagiku', 'Azamiya', 1500, [-0.5, -0.25, 0, 0.25, 0.75]],
  ['Hanamaru', 'Azamiya', 1500, [-1.5, -1, 0, 1, 1.5]],
  ['Shirayuki', 'Azamiya', 4000, [-0.75, -0.5, -0.25, 0, 1]],
  ['Asagiri', 'Yumejiya', 10000, [-1.5, -1, -0.5, 0, 1]],
].map(([name, house, fee, gear], index) => ({ id: index + 1, slug: name.toLowerCase(), name, house, fee, gear }));
const yujoByQuest = new Map(profiles.map(profile => [profile.id, profile]));
const number = new Intl.NumberFormat('en-US');
const parlorGames = {
  konpira: 'Konpira Fune Fune',
  tokkuri: 'Tokkuri Toppling',
  tosenkyo: 'Tosenkyo',
  karuta: 'Iroha Karuta',
};
const parlorGameOrder = {
  Yumejiya: ['konpira', 'tokkuri'],
  Azamiya: ['tosenkyo', 'karuta'],
};

function parlorGameLink(game) {
  return `<a href="#parlor-${game}">${parlorGames[game]}</a>`;
}

function renderParlorGames({ house, slug }) {
  const [first, second] = parlorGameOrder[house].map(parlorGameLink);
  return `<div class="yujo-parlor">
    <h4>Parlor games</h4>
    <p><strong>First offer</strong> ${first} · <strong>Second offer</strong> ${second}</p>
    <p>Lose both in a row and she’ll let you pick either at the <a href="#yujo-parlor-game-loss">next eligible visit</a>.${slug === 'asagiri' ? ` After finishing her substory, request her again to choose from all four games, including ${parlorGameLink('tosenkyo')} and ${parlorGameLink('karuta')}.` : ''}</p>
  </div>`;
}

function mon(price) {
  if (price === 0) return 'Free';
  const ryo = Math.floor(price / 10000);
  const remainder = price % 10000;
  return [ryo && `${number.format(ryo)} ryō`, remainder && `${number.format(remainder)} mon`].filter(Boolean).join(' ');
}

function delta(points) {
  if (points === 0) return '0';
  return points > 0 ? `+${points}` : `−${-points}`;
}

function mood(points) {
  return points > 0 ? 'gain' : points < 0 ? 'loss' : 'neutral';
}

function score(points) {
  assert(Number.isFinite(points), `Invalid yūjo heart change: ${points}`);
  return `<span class="yujo-score yujo-${mood(points)}">${delta(points)}</span>`;
}

const mealTiers = new Map([[1, 'Likes a lot'], [0.5, 'Likes a little'], [0, 'Neutral'], [-0.25, 'Dislikes a little'], [-0.5, 'Dislikes a lot']]);
const giftTiers = new Map([[2, 'Likes a lot'], [1, 'Likes a little'], [0, 'Neutral'], [-0.5, 'Dislikes a little'], [-1, 'Dislikes a lot']]);

const budgetRoutes = {
  kinuyo: {
    orders: ['Green Tea', null], extra: ['Green Tea', 'Pickles'],
    gift: 'An Incense Burner from <a href="#quest-11">#11</a> earns +1. A Potted Chrysanthemum from <a href="#quest-44">#44</a> earns +2 if you already have it.',
    note: 'The free-order plan uses the sake reply “You don’t have to force yourself to drink.” when it comes up. For an alcohol-free route, give a +2 gift on visit 2 or add Pickles on visit 2 and both order rounds of visit 3 (90 mon extra).',
  },
  suzukaze: {
    orders: [null, null], extra: ['Green Tea', 'Red and White Manju'],
    gift: 'Konpeito earns +1. It costs 500 mon from Arigataya Market in Rakugai or the candy seller there. The seller’s discounted stock costs 250 mon.',
  },
  momochika: {
    orders: [null, null], afterGame: { 3: [null, 'Dried Squid'] }, extra: [null, 'Dried Squid'],
    gift: 'Itami Sake from Sake Nakanokura’s takeout menu costs 50 mon and earns +1. Cloudy Sake from Sake Ikkonya costs 40 mon and also earns +1.',
    note: 'Skip the Dried Squid if you give a +1 gift you already own on visit 2 or have 6–15 handsomeness on visits 2 and 3.',
  },
  hinagiku: {
    orders: ['Green Tea', null], extra: ['Green Tea', 'Red and White Manju'],
    gift: 'Konpeito earns +2. It costs 500 mon from Arigataya Market in Rakugai or the candy seller there. The seller’s discounted stock costs 250 mon.',
  },
  hanamaru: {
    orders: ['Green Tea', null], afterGame: { 4: ['Green Tea', 'Pickles'] }, extra: ['Green Tea', 'Dried Squid'],
    gift: 'An Incense Burner from <a href="#quest-11">#11</a> earns +1. If you already have the Glass Kiseru from <a href="#quest-53">#53</a>, it earns +2.',
    note: 'Skip the Pickles if you give a +1 gift you already own on visit 2 or have 6–15 handsomeness on visits 2 and 3.',
    questCost: 'Keep 1 ryō for the medicine in her substory.',
  },
  shirayuki: {
    orders: [null, null], afterGame: { 3: [null, 'Red and White Manju'], 4: [null, 'Red and White Manju'] }, extra: ['Blackcurrant Liquor', 'Red and White Manju'],
    dateOrder: 'Large Fried Egg',
    gift: 'A Potted Chrysanthemum from <a href="#quest-44">#44</a> earns +2 if you have one. Kyoto Perfume Sachet from Arigataya Market in Gion earns +1 and costs 2,000 mon.',
    note: 'With a +2 gift on visit 2 or 16+ handsomeness on visits 2 and 3, skip all room orders and get Large Futomaki at Sushi Ginya for 100 mon. That drops the estimate before extensions to 1 ryō 2,100 mon.',
  },
  asagiri: {
    orders: [null, null], changes: { 2: [null, 'Fresh Vegetables'], 3: [null, 'Fresh Vegetables'], 4: [null, 'Fresh Vegetables'] }, afterGame: { 3: [null, 'Grilled Sparrow'] }, extra: [null, 'Grilled Tuna Head'],
    gift: 'A spare Old Taiken or Rusted Old Taiken earns +1. A Polishing Cloth earns +2. <a href="#quest-12">#12</a> gives you two cloths for 200 mon.',
    note: 'A +2 gift on visit 2 lets you skip all room orders and brings the estimate before extensions to 3 ryō 140 mon, or 3 ryō 340 mon if you spend the 200 mon to get the cloths from #12. With an owned +1 gift on visit 2, buy Fresh Vegetables only after the visit 3 game and at the start of the date return. That also comes to 3 ryō 340 mon before extensions.',
    questCost: 'Have 50 ryō available for her substory. You get it back after the fight.',
  },
};

function orderPair(names, items, ratings, escape) {
  const orders = names.map((name, index) => {
    if (name === null) return { label: index === 0 ? 'skip the drink' : 'skip the food', price: 0, points: -0.25 };
    const menu = index === 0 ? items.drink : items.food;
    const position = menu.findIndex(item => item.name === name);
    assert(position >= 0, `Unknown yūjo order: ${name}`);
    return { label: escape(name), price: menu[position].price, points: (index === 0 ? ratings.drinks : ratings.food)[position] };
  });
  const price = orders[0].price + orders[1].price;
  const label = names.every(name => name === null) ? 'Skip drink and food' : orders.map(order => order.label).join(' + ');
  return { price, text: `${label} (${mon(price)}, ${score(orders[0].points + orders[1].points)} hearts)` };
}

function renderBudgetRoute({ slug, fee }, items, ratings, date, escape) {
  const plan = budgetRoutes[slug];
  const liked = date.outings.flatMap(outing => outing.options.filter(option => option.hearts > 0).map(option => ({
    ...option, venue: outing.venue, earlyHearts: 1 + outing.hearts + option.hearts,
  }))).sort((a, b) => a.price - b.price || b.earlyHearts - a.earlyHearts);
  const cheapest = liked[0];
  const plannedDate = plan.dateOrder ? liked.find(option => option.name === plan.dateOrder) : cheapest;
  const upgrade = liked.find(option => option.earlyHearts > plannedDate.earlyHearts && option.price <= plannedDate.price + 200);
  const dateChoice = option => `<strong>${escape(option.name)}</strong> at ${escape(option.venue)} (${mon(option.price)}, ${score(option.earlyHearts)} hearts with early arrival, before the cap)`;
  const roomOrders = new Map();
  let roomCost = 0;
  const rounds = [
    ['Visit 1', plan.changes?.[1]], ['Visit 2', plan.changes?.[2]],
    ['Visit 3 start', plan.changes?.[3]], ['Visit 3 extension', plan.afterGame?.[3]],
    ['Date return start', plan.changes?.[4]], ['Date return extension', plan.afterGame?.[4]],
  ];
  for (const [label, names] of rounds) {
    const order = orderPair(names ?? plan.orders, items, ratings, escape);
    roomCost += order.price;
    if (!roomOrders.has(order.text)) roomOrders.set(order.text, []);
    roomOrders.get(order.text).push(label);
  }
  const floor = 3 * fee + cheapest.price;
  const total = 3 * fee + plannedDate.price + roomCost;
  const usualOrder = orderPair(plan.orders, items, ratings, escape).text;
  const orderList = [...roomOrders].sort(([a], [b]) => Number(a === usualOrder) - Number(b === usualOrder));
  return `<div class="yujo-route">
    <h4>Low-cost route</h4>
    <ol>
      <li><strong>Room orders.</strong><ul>${orderList.map(([order, visits]) => `<li>${orderList.length === 1 ? 'Every order round' : order === usualOrder ? 'Other rounds' : visits.join(' · ')}. ${order}.</li>`).join('')}</ul></li>
      <li><strong>Date.</strong> Meet at ${escape(date.meeting.place)} within two minutes and order ${dateChoice(plannedDate)} to waive the return room fee.${upgrade ? ` For an extra ${mon(upgrade.price - plannedDate.price)}, ${dateChoice(upgrade)} can help if you’re short on hearts.` : ''}${slug === 'hinagiku' ? ' If you miss the early greeting, pick the menu option labeled Hatsukaze Kitchen to go to Sushi Ginya.' : ''}</li>
      <li><strong>If you need more hearts.</strong> An inexpensive room order is ${orderPair(plan.extra, items, ratings, escape).text}. ${plan.gift}</li>
    </ol>
    <p><strong>${mon(total)} for the route above.</strong> This covers three room fees, the date, and every listed order, including both extensions. Extending adds no extra room fee; you pay only for anything you order.${total !== floor ? ` The cheapest liked date with free room orders starts at ${mon(floor)}.` : ''}${plan.questCost ? ` ${plan.questCost}` : ''}</p>
    ${plan.note ? `<p>${plan.note}</p>` : ''}
  </div>`;
}

function renderMenu(label, items, ratings, escape) {
  assert.equal(items.length, ratings.length);
  assert(ratings.every(points => mealTiers.has(points)), `Unknown ${label.toLowerCase()} rating`);
  const sorted = items.map((item, index) => ({ ...item, points: ratings[index] })).sort((a, b) => b.points - a.points);
  return `<div><h4>${label}</h4><div class="table-wrap" tabindex="0" role="region" aria-label="${label} menu"><table aria-label="${label}">
    <thead><tr><th scope="col">Item</th><th scope="col">Price</th><th scope="col">Reaction</th><th scope="col">Intoxication</th></tr></thead>
    <tbody>${sorted.map(({ name, price, points, intoxication: [min, max] }) => `<tr><td>${escape(name)}</td><td>${mon(price)}</td><td>${mealTiers.get(points)} (${score(points)})</td><td>${min === max ? delta(min) : `${delta(min)} to ${delta(max)}`}</td></tr>`).join('')}</tbody>
  </table></div></div>`;
}

function renderGifts(items, ratings, escape) {
  assert.equal(items.length, ratings.length);
  const byRating = new Map();
  for (const [index, { name }] of items.entries()) {
    const points = ratings[index];
    assert(giftTiers.has(points), `Unknown gift rating for ${name}: ${points}`);
    if (!byRating.has(points)) byRating.set(points, []);
    byRating.get(points).push(name);
  }
  return renderLazyDetails('yujo-details', 'Gifts during visits', `
    <p>Choose from items you’re carrying, including eligible equipment. Giving the same gift again can trigger a ${score(-0.25)} heart response. Gifts bought during dates use the ratings under Dates and encounters.</p>
    <div class="table-wrap" tabindex="0" role="region" aria-label="Gift preferences"><table aria-label="Gift reactions"><thead><tr><th scope="col">Reaction</th><th scope="col">Hearts</th><th scope="col">Gifts</th></tr></thead>
    <tbody>${[...giftTiers].filter(([points]) => byRating.has(points)).map(([points, label]) => {
      const gifts = [...new Set(byRating.get(points))].sort((a, b) => a.localeCompare(b));
      const names = gifts.map(escape).join(', ');
      const list = gifts.length > 30 ? `<details><summary>Show ${gifts.length} gifts</summary><p>${names}</p></details>` : names;
      return `<tr><th scope="row">${label}</th><td>${score(points)}</td><td>${list}</td></tr>`;
    }).join('')}</tbody></table></div>`);
}

function renderOptions(choices, best, escape, bestWithoutDrink = []) {
  assert.equal(choices.length, 3);
  assert(best.length && best.every(index => index >= 1 && index <= choices.length));
  return `<ol class="yujo-answers">${choices.map((choice, index) => {
    const recommended = best.includes(index + 1);
    const text = formatNativeText(choice.text);
    const points = choice.points ?? choice.hearts;
    const effects = [choice.effects?.length ? 'Serves sake' : '', choice.endsDate ? 'Ends the date' : '',
      choice.drinkPoints ? `${score(choice.drinkPoints)} hearts after the drink` : '',
      !recommended && bestWithoutDrink.includes(index + 1) ? 'Best without drinking' : ''].filter(Boolean);
    return `<li>${recommended ? `<strong>${text}</strong>` : text} <span class="yujo-answer-effect">(${score(points)}${choice.target ? ` for ${escape(choice.target)}` : ''}${effects.length ? ` · ${effects.join(' · ')}` : ''})</span></li>`;
  }).join('')}</ol>`;
}

function renderTalks(label, topics, escape) {
  return renderLazyDetails('yujo-details', `${label} <span class="yujo-muted">(${topics.length})</span>`, `
    <p class="yujo-muted">The highest-scoring answers are in bold. If an answer serves sake, its rating assumes you can finish the drink.</p>
    <ol class="yujo-topics">${topics.map(topic => `<li>
      ${topic.threshold ? `<p class="yujo-muted">At ${topic.threshold} hearts</p>` : ''}
      <p class="yujo-prompt">${formatNativeText(topic.prompt)}</p>
      ${topic.leadIn?.length > 1 ? `<details class="yujo-leadin"><summary>Full prompt</summary><p>${topic.leadIn.map(formatNativeText).join('<br>')}</p></details>` : ''}
      ${renderOptions(topic.choices, topic.best, escape, topic.bestWithoutDrink)}
    </li>`).join('')}</ol>`);
}

function renderDates(date, escape) {
  assert.equal(date.outings.length, 4);
  const reactions = new Map([[1, 'Liked'], [0, 'Neutral'], [-1, 'Disliked']]);
  return renderLazyDetails('yujo-details', 'Dates and encounters', `
    <p>Meet her at <strong>${escape(date.meeting.place)}</strong>. The venue and the order or gift each affect the heart gauge.</p>
    ${date.meeting.note ? `<p class="quest-window-note"><strong>English patch note.</strong> ${escape(date.meeting.note)}</p>` : ''}
    <div class="table-wrap" tabindex="0" role="region" aria-label="Date venue preferences"><table aria-label="Date choices"><thead><tr><th scope="col">Venue</th><th scope="col">Venue hearts</th><th scope="col">Food or gifts</th></tr></thead>
    <tbody>${date.outings.map(outing => `<tr><td>${escape(outing.venue)}<br><span class="yujo-muted">Bring at least ${mon(outing.minimumFunds)}</span></td><td>${score(outing.hearts)}</td><td>${[...reactions].map(([points, label]) => {
      const options = outing.options.filter(option => option.hearts === points);
      return options.length ? `<p class="yujo-date-reaction"><strong>${label}</strong> (${score(points)})</p><ul class="yujo-orders">${options.map(option => `<li>${escape(option.name)} <span class="yujo-muted">(${mon(option.price)})</span></li>`).join('')}</ul>` : '';
    }).join('')}</td></tr>`).join('')}</tbody></table></div>
    ${date.encounters.length ? `<h4>If you meet another yūjo</h4><ul class="yujo-topics">${date.encounters.map(encounter => `<li><p class="yujo-prompt">${escape(encounter.met)} at ${escape(encounter.venue)}</p>${renderOptions(encounter.options, [encounter.best], escape)}</li>`).join('')}</ul>` : '<p>Asagiri’s dates have no encounters with other yūjo.</p>'}`);
}

function renderEquipment(items, escape) {
  return renderLazyDetails('yujo-details', 'Equipment that changes handsomeness', `
    <p>Add the points for the items you equip. Each yūjo’s profile shows the heart change for the resulting score.</p>
    <div class="table-wrap"><table aria-label="Equipment handsomeness"><thead><tr><th scope="col">Equipment</th><th scope="col">Handsomeness</th></tr></thead>
    <tbody>${items.map(({ name, points }) => `<tr><td>${escape(name)}</td><td>${score(points)}</td></tr>`).join('')}</tbody></table></div>`);
}

function gearThreshold({ min, max }) {
  const label = min === null ? `≤${max}` : max === null ? `≥${min}` : `${min} to ${max}`;
  return label.replaceAll('-', '−');
}

function renderOverview() {
  return renderLazyDetails('yujo-details', 'More visit and date rules', `
    <ul>
      <li>Taking more than 10 minutes to meet your date costs 3 hearts. A liked meal or gift earns +1 heart. A neutral choice leaves the return fee in place. A disliked choice costs 1 heart and ends the outing.</li>
      <li>Falling below the venue’s minimum funds costs 2 hearts. Being short of the return visit fee costs 1 heart.</li>
      <li>Reaching 800–949 intoxication can award +2 hearts. Sake served during some answers adds 300–600 intoxication. Use a Sober Pill before a visit if you’re already drunk.</li>
      <li>The first visit has two conversations. Later visits can offer more at higher hearts. An extension opens the food and drink menus again and keeps the same visit count.</li>
      <li>From the second visit, equipped items can change the starting heart gauge through the hidden handsomeness score. Each profile lists the heart changes and any item she scores differently.</li>
      <li>Each listed date encounter can happen once. Asagiri’s dates have no encounters with other yūjo.</li>
    </ul>
    <p class="yujo-muted">Sources include the installed game files, the <a href="https://www.khhsubs.com/kenzan/yujo/">KHHsubs Yūjo guide</a>, and the <a href="https://game.daihouko.com/ryu-ga-gotoku/kenzan/99.html">Japanese Yūjo guide</a>.</p>`);
}

function renderPreface() {
  return `<div class="yujo-preface" id="yujo-budget">
    <h3>What you’re trying to do</h3>
    <p><strong>Reach 20 hearts to unlock each yūjo’s substory.</strong> Complete her special conversations at 11, 16, and 20 hearts, then finish the visit with the gauge full. The gauge holds only 10 hearts at first, so you’ll need to raise its limit as you go.</p>
    <h3>How visits work</h3>
    <p>Request a yūjo at Yumejiya or Azamiya in Gion. Liked orders and good dialogue answers build hearts. The room fee is separate from the price of your drink and dish. Green Tea is free, and skipping either order costs a quarter heart. Each profile lists order reactions and puts the best dialogue answers in bold.</p>
    <p><strong>Gifts are optional.</strong> Bring a liked item in your inventory if you need a boost. The gift prompt can appear from the second visit. Use a reward or spare item you already own before paying for one. Giving it uses up the item, and repeating a gift can lose hearts. A gift bought on a date uses that venue’s separate preference list.</p>
    <p><strong>Parlor games</strong> are short contests the yūjo offers during a visit. At Yumejiya, ${parlorGameLink('konpira')} is a rhythm game with a tabletop piece and ${parlorGameLink('tokkuri')} is a bowling game. At Azamiya, ${parlorGameLink('tosenkyo')} has you aim a fan at a target and ${parlorGameLink('karuta')} has you grab the card matching a spoken cue. Each profile lists the opening offer order. The order counts game offers across eligible visits, so a visit without a game leaves the next offer in place.</p>
    <h3>Heart milestones</h3>
    <ol>
      <li><strong>6 hearts unlocks the first game.</strong> From your third separate visit, reach 6 hearts by the end of the third conversation. Winning adds 2 hearts and raises the limit from 10 to 15. <a href="#yujo-parlor-game-loss">What to do if you lose</a>.</li>
      <li><strong>11 hearts opens the date.</strong> Check her letter for the meeting spot. Arrive within two minutes for +1 heart. A successful date raises the limit to 20, and buying something she likes waives the return room fee.</li>
      <li><strong>16 hearts opens the later game.</strong> Aim for 16 by the third conversation on the date return. A win adds 2 hearts. Reach 20 with a conversation slot left for her final special dialogue.</li>
    </ol>
    <h3 id="yujo-extend-session">Should you extend the session?</h3>
    <p><strong>Already at 11 hearts when the extension prompt appears? Choose Extend Session if she hasn’t asked her date milestone question yet.</strong> She can ask it during the extension, even if you reached 11 hearts before choosing more time. If you’re still below 11 after winning the first game, extend if you can reach 11 hearts with another order or conversation. Once you’ve answered the 11-heart question, choose <strong>Call It Quits</strong> and watch for her letter.</p>
    <p><strong>On the date return, extend if you still need the 20-heart conversation.</strong> Once you’ve had it and the gauge is full, choose <strong>Call It Quits</strong> to finish the visit.</p>
    <p>Extending the session does not charge another room fee. You still pay for any food or drinks you order. A successful date can waive the room fee for the return visit. <a href="https://www.khhsubs.com/kenzan/yujo/">KHHsubs Yūjo guide</a></p>
    <h3 id="yujo-parlor-game-loss">What to do if you lose a parlor game</h3>
    <p>The loss costs 1 heart and can make Kiryu drink sake. If he gets too drunk, the visit ends. <strong>Call It Quits</strong> ends the visit with the hearts you have left. <a href="https://game.daihouko.com/ryu-ga-gotoku/kenzan/99.html">Japanese Yūjo guide</a></p>
    <h4>First game, before the date</h4>
    <ol>
      <li>Choose <strong>Call It Quits</strong> at the extension prompt. Extending gives you more orders and conversation without another room fee, but you only get your rematch on a fresh visit.</li>
      <li>Come back sober and reach at least <strong>6 hearts by the end of the third conversation</strong> to play again. The new visit costs her usual room fee. She offers the other game on the second attempt. Lose twice in a row to the same yūjo and she lets you choose either game on the next eligible visit.</li>
      <li>Win to raise the cap from <strong>10 to 15 hearts</strong>. You can then reach <strong>11 hearts</strong> and have the conversation that opens the date.</li>
    </ol>
    <p><a href="https://m-pe.tv/u/m/bbs/plread.php?id=3&amp;o=0&amp;tid=296&amp;uid=ryugadata&amp;v=i">Japanese parlor-game guide</a> · <a href="https://gamefaqs.gamespot.com/ps3/943326-ryu-ga-gotoku-kenzan/faqs/52464">Patrick Coffman’s walkthrough</a> · <a href="https://www.khhsubs.com/kenzan/minigames/">KHHsubs minigame guide</a></p>
    <h4>Later game, after the date</h4>
    <p>A win clears the loss streak, so she can go back to offering the games in rotation. If you lose the later game, use any remaining orders or conversation to recover the lost heart. Choose <strong>Extend Session</strong> if you need more time and can reach 20 safely. Once you’ve had her final conversation, end the visit with <strong>20 hearts</strong> to unlock her substory, even if you lost the later game. If the visit ends early, return sober and finish on a fresh visit. Winning the later game earns a dance and counts toward minigame completion. <a href="https://gamefaqs.gamespot.com/ps3/943326-ryu-ga-gotoku-kenzan/faqs/52464">Patrick Coffman’s walkthrough</a></p>
    <p>After you finish her substory, request her again to choose a game directly. Asagiri’s menu then includes all four games. <a href="https://game.daihouko.com/ryu-ga-gotoku/kenzan/74.html">Japanese Asagiri guide</a></p>
    <h3>What can interrupt your progress</h3>
    <p><strong>Running into another yūjo on a date.</strong> At the venue, you can run into a yūjo you’ve already visited whose substory is still unfinished. A bad reply can cost 3 hearts with either woman, and some replies end the date. Use the safe reply under <strong>Dates and encounters</strong>, or finish one yūjo’s substory before visiting another.</p>
    <p><strong>Getting too drunk.</strong> Alcohol orders and some dialogue replies make Kiryu drink. At 950 intoxication the staff end the visit and you lose 1 heart, cutting off the rest of that session’s conversations and games. Start sober, use Green Tea to lower intoxication, and favor replies that skip the sake when your intoxication is already high.</p>
    <h3>How to spend less</h3>
    <p>Follow the visit-by-visit route in each profile. End visit two after the third conversation unless her route calls for an extension. The date return starts at the order menus, so use your gift and equipment bonuses on visits two and three.</p>
    <p>The estimates assume <strong>0–5 handsomeness</strong>, no gifts, the best replies that avoid sake unless the route specifies one, early date arrival, and both games won. Each profile shows the cost with two extensions. Better gear or a gift you already own can cut the cost. If you fall short of the heart milestones, budget another visit.</p>
  </div>`;
}

function renderSavedProgress(slug, name, quest) {
  const steps = [
    ['visit', 'First visit'],
    ['first-game', 'First parlor win', '15-heart limit'],
    ['date-talk', '11-heart talk'],
    ['date', 'Successful date return', '20-heart limit'],
    ['later-talk', '16-heart talk'],
    ['final-talk', '20-heart talk'],
    ['quest-unlocked', 'Substory unlocked'],
    ['quest-complete', `<a href="#quest-${quest}">Substory complete</a>`],
    ['letter', 'Final letter received'],
  ];
  const heartGroup = `<span class="yujo-heart-group">${'<span data-yujo-heart>♥</span>'.repeat(5)}</span>`;
  const heartRow = `<span class="yujo-heart-row">${heartGroup.repeat(2)}</span>`;
  return `<div class="yujo-progress" data-yujo-progress="${slug}">
    <div class="yujo-saved-progress" role="group" aria-label="${name}’s saved progress" hidden>
      <strong data-yujo-hearts></strong>
      <div class="yujo-hearts" aria-hidden="true">${heartRow.repeat(2)}</div>
      <p class="yujo-muted" data-yujo-record></p>
      <ol class="yujo-milestones" role="list" aria-label="Relationship milestones">${steps.map(([key, label, note]) =>
        `<li data-yujo-step="${key}">
          <span class="yujo-milestone-dot" aria-hidden="true"><span>✓</span></span>
          <span class="yujo-milestone-label">${label}${note ? `<small>${note}</small>` : ''}</span>
          <span class="yujo-milestone-state" data-yujo-step-state></span>
        </li>`).join('')}</ol>
    </div>
  </div>`;
}

function renderYujoGuide(quests, escape) {
  const visits = require('../../data/activities/yujo-visit-dialogue.json');
  const dates = require('../../data/activities/yujo-date-dialogue.json');
  const preferences = require('../../data/activities/yujo-preferences.json');
  const completionOrder = [2, 3, 1, 4, 5, 6, 7];
  return `<section data-side-checklist class="supplement" id="yujo" aria-labelledby="yujo-title">
    <h2 id="yujo-title">Yujo</h2>
    ${renderPreface()}
    <details class="collectible-group" id="yujo-completion">
      <summary>Yujo Completion List</summary>
      <p>Raise each yujo to 20 hearts and finish her final substory. Then walk past the entrance listed below in Gion. Her <strong>kamuro</strong> (attendant) will approach and hand you her final love letter. Once you’ve received it, you can read it at the letterbox.</p>
      <p>Complete all seven to earn the <strong>Eternal Turtle</strong>. The four parlor games have their own goals in <a href="#minigame-yujo">Minigames</a>.</p>
      <p class="quest-meta" data-side-progress role="status" tabindex="-1"></p>
      <div class="table-wrap"><table aria-label="Yujo Completion List">
        <thead><tr><th scope="col">Yujo</th><th scope="col">Final substory</th><th scope="col">Final letter pickup</th><th scope="col">Done</th></tr></thead>
        <tbody>${completionOrder.map(id => {
          const { slug, name, house } = yujoByQuest.get(id);
          return `<tr><th scope="row"><a href="#yujo-${slug}">${name}</a></th><td><a href="#quest-${id}">#${id} ${escape(quests.get(id).name)}</a></td>
            <td>Outside ${escape(house)}</td><td><label class="quest-check"><input type="checkbox" data-side-done="yujo-final-${slug}" autocomplete="off" aria-label="Mark ${name}’s final event done"></label></td></tr>`;
        }).join('')}</tbody>
      </table></div>
    </details>
    <p>Visit and date dialogue cross-checked with <a href="https://www.khhsubs.com/kenzan/yujo/">KHHSubs’ Yūjo guide</a>.</p>
    <nav class="yujo-index" aria-label="Yūjo profiles">${profiles.map(({ slug, name }) => `<a href="#yujo-${slug}">${name}</a>`).join('')}</nav>
    <p class="yujo-muted" data-yujo-progress-empty><a href="#save-sync">Sync a gameplay save</a> to see saved hearts and milestones under each profile.</p>
    ${renderOverview()}
    ${renderEquipment(preferences.handsomeness.items, escape)}
    ${profiles.map(profile => {
      const { id, slug, name, house, fee, gear } = profile;
      const quest = quests.get(id);
      const visit = visits.yujo.find(entry => entry.id === id);
      const date = dates[name];
      const preferencesForYujo = preferences.patrons[slug];
      assert.equal(visit.name, name);
      const regular = visit.topics.filter(topic => topic.context === 'random');
      const milestones = visit.topics.filter(topic => topic.context === 'milestone');
      assert.equal(regular.length, 21);
      assert.equal(milestones.length, 3);
      return `<article class="yujo-profile" id="yujo-${slug}" aria-labelledby="yujo-title-${slug}">
        <h3 id="yujo-title-${slug}">${name}</h3>
        <p class="yujo-meta"><strong>${house}, Gion</strong> · ${mon(fee)} per visit · <a href="#quest-${id}">#${id} ${escape(quest.name)}</a></p>
        ${renderSavedProgress(slug, name, id)}
        ${id === 7 ? `<p>Complete substories ${profiles.slice(0, 6).map(({ id: required }) => `<a href="#quest-${required}">#${required}</a>`).join(', ')} to visit Asagiri.</p>` : ''}
        ${renderParlorGames(profile)}
        ${renderBudgetRoute(profile, preferences.items, preferencesForYujo, date, escape)}
        <p class="yujo-muted">Hearts from equipment, by handsomeness score ${preferences.handsomeness.tiers.map((tier, index) => ` · <span class="yujo-gear-tier">${gearThreshold(tier)} (${score(gear[index])})</span>`).join('')}${preferencesForYujo.handsomeness.length ? `<br>${preferencesForYujo.handsomeness.map(({ name: item, points }) => `${escape(item)} gives ${score(points)} handsomeness for ${name}`).join(' · ')}` : ''}</p>
        ${renderLazyDetails('yujo-details', 'Food and drinks', `<div class="yujo-menus">
          ${renderMenu('Food', preferences.items.food, preferencesForYujo.food, escape)}
          ${renderMenu('Drinks', preferences.items.drink, preferencesForYujo.drinks, escape)}
        </div>`)}
        ${renderGifts(preferences.items.gift, preferencesForYujo.gifts, escape)}
        ${renderTalks('Regular dialogue', regular, escape)}
        ${renderTalks('Milestone dialogue', milestones, escape)}
        ${renderDates(date, escape)}
      </article>`;
    }).join('\n')}
  </section>`;
}

module.exports = { yujoByQuest, renderYujoGuide };
