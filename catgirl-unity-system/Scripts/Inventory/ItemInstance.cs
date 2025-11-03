using UnityEngine;
using System;
using System.Collections.Generic;

namespace CatGirlSystem.Inventory
{
    /// <summary>
    /// Base interface for all inventory items.
    /// Supports grid-based inventory with item shapes (Diablo-style).
    /// </summary>
    public interface IInventoryItem
    {
        string ItemID { get; }
        string Name { get; }
        string Description { get; }
        Sprite Icon { get; }
        int Width { get; }  // Grid width (1-4)
        int Height { get; } // Grid height (1-4)
        int MaxStack { get; }
        ItemRarity Rarity { get; }
        ItemType Type { get; }
    }

    public enum ItemRarity
    {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }

    public enum ItemType
    {
        Consumable,
        Equipment,
        Material,
        QuestItem,
        Currency
    }

    /// <summary>
    /// Represents an instance of an item with unique properties.
    /// </summary>
    [Serializable]
    public class ItemInstance
    {
        public string instanceID;
        public ItemData itemData;
        public int stackSize;
        public int currentDurability;
        public List<EnchantmentData> enchantments;
        public bool isEquipped;

        /// LAW: Each item instance must have unique ID for tracking
        //!? UNCERTAINTY: Should enchantments stack or be mutually exclusive?
        //> FLOW: Create instance -> Assign data -> Generate ID -> Track state

        public ItemInstance(ItemData data, int stack = 1)
        {
            // ::cantrip🔧:GenerateUniqueID() -> instanceID
            instanceID = Guid.NewGuid().ToString();
            itemData = data;
            stackSize = Mathf.Min(stack, data.maxStack);
            currentDurability = data.maxDurability;
            enchantments = new List<EnchantmentData>();
            isEquipped = false;
        }

        /// <summary>
        /// Apply durability damage.
        /// </summary>
        public void DamageDurability(int amount)
        {
            // ::transmute⚗️:ReduceDurability(amount) -> newDurability
            currentDurability = Mathf.Max(0, currentDurability - amount);

            if (currentDurability == 0)
            {
                Debug.Log($"[ItemInstance] {itemData.itemName} is broken!");
            }
        }

        /// <summary>
        /// Repair item durability.
        /// </summary>
        public void Repair(int amount)
        {
            currentDurability = Mathf.Min(itemData.maxDurability, currentDurability + amount);
        }

        /// <summary>
        /// Add enchantment to item.
        /// </summary>
        public void AddEnchantment(EnchantmentData enchantment)
        {
            // ::enchant💫:ApplyMagic(enchantment) -> enhanced
            if (!enchantments.Contains(enchantment))
            {
                enchantments.Add(enchantment);
                Debug.Log($"[BENEDICTION] Enchanted {itemData.itemName} with {enchantment.enchantmentName}!");
            }
        }

        /// <summary>
        /// Check if item can stack with another instance.
        /// </summary>
        public bool CanStackWith(ItemInstance other)
        {
            return other != null
                && other.itemData.itemID == this.itemData.itemID
                && other.enchantments.Count == 0
                && this.enchantments.Count == 0;
        }
    }

    /// <summary>
    /// ScriptableObject defining item properties.
    /// </summary>
    [CreateAssetMenu(fileName = "NewItem", menuName = "CatGirl/Item Data")]
    public class ItemData : ScriptableObject, IInventoryItem
    {
        [Header("Basic Info")]
        public string itemID;
        public string itemName;
        [TextArea(3, 6)]
        public string description;
        public Sprite icon;

        [Header("Grid Properties")]
        public int width = 1;
        public int height = 1;
        public int maxStack = 1;

        [Header("Item Properties")]
        public ItemRarity rarity = ItemRarity.Common;
        public ItemType type = ItemType.Consumable;
        public int baseValue = 100;

        [Header("Equipment Properties")]
        public int maxDurability = 100;
        public int attackPower;
        public int defense;
        public int magicResist;

        // IInventoryItem implementation
        public string ItemID => itemID;
        public string Name => itemName;
        public string Description => description;
        public Sprite Icon => icon;
        public int Width => width;
        public int Height => height;
        public int MaxStack => maxStack;
        public ItemRarity Rarity => rarity;
        public ItemType Type => type;

        private void OnValidate()
        {
            // Auto-generate ID if empty
            if (string.IsNullOrEmpty(itemID))
            {
                itemID = $"item_{name}_{GetInstanceID()}";
            }
        }
    }

    /// <summary>
    /// ScriptableObject defining enchantment properties.
    /// </summary>
    [CreateAssetMenu(fileName = "NewEnchantment", menuName = "CatGirl/Enchantment")]
    public class EnchantmentData : ScriptableObject
    {
        public string enchantmentID;
        public string enchantmentName;
        [TextArea(2, 4)]
        public string description;
        public Sprite icon;

        [Header("Stat Modifiers")]
        public int attackBonus;
        public int defenseBonus;
        public int magicBonus;
        public float critChanceBonus;

        [Header("Visual Effects")]
        public Color glowColor = Color.cyan;
        public GameObject particleEffect;
    }
}
