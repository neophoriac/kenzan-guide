/* Native ordered pair calculation; first and second weapon roles are significant. */
(function (root) {
  'use strict';

  function invalid(reason) {
    return { valid: false, reason: reason };
  }

  function calculatePair(data, firstId, secondId) {
    if (!data || !Array.isArray(data.weapons) || !Array.isArray(data.families)) {
      return invalid('Weapon pair data is unavailable.');
    }
    var first = data.weapons.find(function (weapon) { return weapon.id === firstId; });
    var second = data.weapons.find(function (weapon) { return weapon.id === secondId; });
    if (!first || !second) return invalid('Choose both weapons from the weapon list.');
    if (!Array.isArray(first.allowedRoles) || first.allowedRoles.indexOf('first') < 0) {
      return invalid('Choose a katana for the first weapon.');
    }
    if (!Array.isArray(second.allowedRoles) || second.allowedRoles.indexOf('second') < 0) {
      return invalid('Choose a kodachi for the second weapon.');
    }

    var match = null;
    var firstModel = first.native.model;
    var secondModel = second.native.model;
    // Native strncmp(model+2,"ORI",3) followed by literal strcmp(model+5,slot+5).
    if (firstModel.slice(2, 5) === 'ORI' && secondModel.slice(2, 5) === 'ORI') {
      for (var row = 0; row < data.families.length && !match; row += 1) {
        var family = data.families[row];
        for (var a = 0; a < family.firstSlots.length && !match; a += 1) {
          var firstSlotModel = family.firstSlots[a];
          if (firstSlotModel === null || firstSlotModel.slice(5) !== firstModel.slice(5)) continue;
          for (var b = 0; b < family.secondSlots.length; b += 1) {
            var secondSlotModel = family.secondSlots[b];
            if (secondSlotModel !== null && secondSlotModel.slice(5) === secondModel.slice(5)) {
              match = { family: family, firstSlot: a, secondSlot: b };
              break;
            }
          }
        }
      }
    }

    var code = match ? match.family.speed.nativeCode : Math.min(first.speed.nativeValue, 3) - 3;
    var speedValue = code + 3;
    return {
      valid: true,
      attack: match ? match.family.baseAttack + match.firstSlot : Math.floor(7 * first.attack / 10),
      force: match ? match.family.baseForce + match.secondSlot : Math.floor(first.force / 2) + second.force,
      speed: { nativeCode: code, value: speedValue, label: data.speedLabels[speedValue] },
      specialPair: match ? {
        id: match.family.id, firstSlot: match.firstSlot, secondSlot: match.secondSlot
      } : null
    };
  }

  var api = { calculatePair: calculatePair };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.kenzanWeaponPairs = api;
}(typeof window !== 'undefined' ? window : null));
