// ---------------------------------------------------------------------------
// src/ui/components/InventoryModal.tsx — Player inventory modal
// ---------------------------------------------------------------------------
// Displays carried items grouped by type: equipped, weapons, tools,
// consumables, key items, misc. Each item shows name, type badge,
// broken status, and action buttons (utiliser/examiner/jeter).
// ---------------------------------------------------------------------------

import { useGameStore } from '@stores/gameStore';
import { ITEM_DEFINITIONS } from '@content/items';
import type { ItemDefinition } from '@content/items';
import { SCENARIO_NAMES_FR } from '@content/scenarioNames';
import { Modal } from './Modal';
import { ts, itemName } from '../utils/formatters';
import type { ItemDurabilityState, ItemType } from '@engine/types';

interface Props {
  readonly onClose: () => void;
}

const TYPE_LABELS: Record<ItemType, string> = {
  weapon: 'ARME',
  tool: 'OUTIL',
  consumable: 'CONSOMMABLE',
  key_item: 'CLÉ',
  data: 'DONNÉES',
  misc: 'DIVERS',
};

const TYPE_ORDER: readonly ItemType[] = ['weapon', 'tool', 'consumable', 'key_item', 'data', 'misc'];

export function InventoryModal({ onClose }: Props): JSX.Element {
  const gameState = useGameStore((s) => s.gameState);
  const submitAction = useGameStore((s) => s.submitAction);
  const character = gameState.character;

  if (!character) {
    return (
      <Modal title="INVENTAIRE" icon="◫" onClose={onClose}>
        <p style={{ color: 'var(--amber-dim)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          Aucun personnage.
        </p>
      </Modal>
    );
  }

  const inventory = character.inventory;
  const durability = character.durability;
  const equippedWeapon = character.equippedWeapon;
  const equippedArmor = character.equippedArmor;

  // Group items by type.
  // Scenario items (e.g. standard_toolkit) have no ITEM_DEFINITIONS entry — fall back to
  // SCENARIO_NAMES_FR for the display name and treat them as 'misc' (Issue #48).
  const groupedItems = new Map<ItemType, { id: string; def: ItemDefinition | null; dur: ItemDurabilityState | undefined }[]>();
  for (const type of TYPE_ORDER) groupedItems.set(type, []);

  for (const itemId of inventory) {
    const def = ITEM_DEFINITIONS[itemId] ?? null;
    const type: ItemType = def?.type ?? 'misc';
    const group = groupedItems.get(type) ?? [];
    group.push({ id: itemId, def, dur: durability[itemId] });
    groupedItems.set(type, group);
  }

  const isEmpty = inventory.length === 0;

  function handleAction(verb: string, name: string): void {
    submitAction(`${verb} ${name}`);
    onClose();
  }

  return (
    <Modal title="INVENTAIRE" icon="◫" onClose={onClose}>
      {/* Equipped summary */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '16px',
          padding: '8px 10px',
          background: 'rgba(255, 176, 0, 0.05)',
          border: '1px solid var(--amber-dim)',
          borderRadius: '2px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
        }}
      >
        <div>
          <span style={{ color: 'var(--amber-dim)' }}>ARME: </span>
          <span style={{ color: equippedWeapon ? 'var(--amber-glow)' : 'var(--amber-dim)' }}>
            {equippedWeapon ? itemName(equippedWeapon) : '—'}
          </span>
        </div>
        <div>
          <span style={{ color: 'var(--amber-dim)' }}>ARMURE: </span>
          <span style={{ color: equippedArmor ? 'var(--amber-glow)' : 'var(--amber-dim)' }}>
            {equippedArmor ? itemName(equippedArmor) : '—'}
          </span>
        </div>
      </div>

      {isEmpty && (
        <p style={{ color: 'var(--amber-dim)', fontFamily: 'var(--font-mono)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
          Inventaire vide.
        </p>
      )}

      {/* Item groups */}
      {TYPE_ORDER.map((type) => {
        const items = groupedItems.get(type) ?? [];
        if (items.length === 0) return null;

        return (
          <div key={type} style={{ marginBottom: '14px' }}>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.15em',
                color: 'var(--amber-dim)',
                fontFamily: 'var(--font-title)',
                marginBottom: '6px',
                borderBottom: '1px solid var(--amber-dim)',
                paddingBottom: '2px',
              }}
            >
              {TYPE_LABELS[type]}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {items.map(({ id, def, dur }) => {
                const name = def ? ts(def.nameKey) : (SCENARIO_NAMES_FR[id] ?? id);
                const isBroken = dur?.broken === true;
                const isEquipped = id === equippedWeapon || id === equippedArmor;

                return (
                  <div
                    key={id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      background: isEquipped ? 'rgba(255, 176, 0, 0.08)' : 'transparent',
                      borderRadius: '2px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12px',
                    }}
                  >
                    {/* Name + status */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: isBroken ? 'var(--danger)' : 'var(--amber-glow)' }}>
                        {name}
                      </span>
                      {isBroken && (
                        <span style={{ color: 'var(--danger)', fontSize: '10px', marginLeft: '6px' }}>
                          [CASSÉ]
                        </span>
                      )}
                      {isEquipped && (
                        <span style={{ color: 'var(--success)', fontSize: '10px', marginLeft: '6px' }}>
                          [ÉQUIPÉ]
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      {def?.type === 'consumable' && (
                        <button
                          type="button"
                          className="btn-console"
                          onClick={() => handleAction('utiliser', name)}
                          style={{ padding: '2px 8px', fontSize: '9px' }}
                          disabled={isBroken}
                        >
                          UTIL.
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-console"
                        onClick={() => handleAction('examiner', name)}
                        style={{ padding: '2px 8px', fontSize: '9px' }}
                      >
                        EXAM.
                      </button>
                      {def?.type !== 'key_item' && (
                        <button
                          type="button"
                          className="btn-console"
                          onClick={() => handleAction('jeter', name)}
                          style={{ padding: '2px 8px', fontSize: '9px' }}
                        >
                          JETER
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Capacity indicator */}
      <div
        style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--amber-dim)',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--amber-dim)',
          textAlign: 'center',
        }}
      >
        {inventory.length} objet{inventory.length !== 1 ? 's' : ''} transporté{inventory.length !== 1 ? 's' : ''}
      </div>
    </Modal>
  );
}
