using UnityEngine;
using UnityEngine.Events;
using System.Collections.Generic;
using System.Linq;
using CatGirlSystem.Inventory;
using CatGirlSystem.Economy;

namespace CatGirlSystem.Gambling
{
    /// <summary>
    /// Slot machine / gacha gambling system with configurable odds and rewards.
    /// Supports weighted loot tables, pity systems, and bonus features.
    /// </summary>
    public class SlotMachineManager : MonoBehaviour
    {
        public static SlotMachineManager Instance { get; private set; }

        [Header("Gambling Configuration")]
        [SerializeField] private int spinCost = 50;
        [SerializeField] private int spinCostPremium = 100; // 10-pull with bonus
        [SerializeField] private bool enablePitySystem = true;
        [SerializeField] private int pityThreshold = 90; // Guaranteed rare after 90 pulls

        [Header("Loot Tables")]
        [SerializeField] private List<LootTableEntry> commonLoot = new List<LootTableEntry>();
        [SerializeField] private List<LootTableEntry> rareLoot = new List<LootTableEntry>();
        [SerializeField] private List<LootTableEntry> epicLoot = new List<LootTableEntry>();
        [SerializeField] private List<LootTableEntry> legendaryLoot = new List<LootTableEntry>();

        [Header("Drop Rates")]
        [SerializeField][Range(0f, 1f)] private float commonDropRate = 0.70f;    // 70%
        [SerializeField][Range(0f, 1f)] private float rareDropRate = 0.20f;      // 20%
        [SerializeField][Range(0f, 1f)] private float epicDropRate = 0.08f;      // 8%
        [SerializeField][Range(0f, 1f)] private float legendaryDropRate = 0.02f;  // 2%

        [Header("Player Stats")]
        public int totalSpins = 0;
        public int spinsSinceLastRare = 0;
        public Dictionary<string, int> itemsWon = new Dictionary<string, int>();

        [Header("Events")]
        public UnityEvent<List<ItemInstance>> OnSpinCompleted;
        public UnityEvent<ItemInstance, RarityTier> OnRareItemWon;
        public UnityEvent<int> OnPityTriggered;

        /// LAW: Drop rates must sum to 1.0 (100%)
        /// FLOW: Pay cost -> Roll rarity -> Select item -> Grant reward -> Check pity
        ///<3 HEART: Near-miss animations create excitement
        ///!? UNCERTAINTY: Random outcomes drive engagement and addiction
        ///> CONSEQUENCE: Pity system prevents frustration, maintains player retention

        private void Awake()
        {
            // ::abjure🛡️:EnsureSingleton() -> valid
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                LoadGamblingData();
                ValidateDropRates();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void ValidateDropRates()
        {
            float totalRate = commonDropRate + rareDropRate + epicDropRate + legendaryDropRate;
            if (Mathf.Abs(totalRate - 1f) > 0.01f)
            {
                Debug.LogWarning($"[SlotMachine] Drop rates sum to {totalRate:F2}, should be 1.0!");
            }
        }

        /// <summary>
        /// Perform single spin.
        /// </summary>
        public List<ItemInstance> Spin()
        {
            // ::abjure🛡️:ValidateSpin(cost) -> canSpin
            if (!CurrencyManager.Instance.CanAfford(spinCost))
            {
                Debug.LogWarning($"[SlotMachine] Insufficient funds! Need {spinCost} coins.");
                return null;
            }

            // ::transmute⚗️:ProcessSpin() -> rewards
            CurrencyManager.Instance.SpendCoins(spinCost);
            totalSpins++;
            spinsSinceLastRare++;

            List<ItemInstance> rewards = new List<ItemInstance>();
            RarityTier rarity = RollRarity();
            ItemInstance item = SelectItemFromRarity(rarity);

            if (item != null)
            {
                rewards.Add(item);
                InventoryManager.Instance.AddItem(item.itemData, 1);
                TrackWonItem(item);

                // Check for rare or better
                if (rarity >= RarityTier.Rare)
                {
                    spinsSinceLastRare = 0;
                    OnRareItemWon?.Invoke(item, rarity);
                    // ::benediction🎉:RareItemWon()
                    Debug.Log($"[BENEDICTION] Won {rarity} item: {item.itemData.itemName}!");
                }
            }

            SaveGamblingData();
            OnSpinCompleted?.Invoke(rewards);

            return rewards;
        }

        /// <summary>
        /// Perform 10-pull spin with guaranteed bonus.
        /// </summary>
        public List<ItemInstance> SpinPremium()
        {
            // ::abjure🛡️:ValidatePremiumSpin(cost) -> canSpin
            if (!CurrencyManager.Instance.CanAfford(spinCostPremium))
            {
                Debug.LogWarning($"[SlotMachine] Insufficient funds! Need {spinCostPremium} coins.");
                return null;
            }

            // ::transmute⚗️:ProcessPremiumSpin() -> rewards
            CurrencyManager.Instance.SpendCoins(spinCostPremium);

            List<ItemInstance> rewards = new List<ItemInstance>();

            // Perform 9 regular spins
            for (int i = 0; i < 9; i++)
            {
                totalSpins++;
                spinsSinceLastRare++;

                RarityTier rarity = RollRarity();
                ItemInstance item = SelectItemFromRarity(rarity);

                if (item != null)
                {
                    rewards.Add(item);
                    InventoryManager.Instance.AddItem(item.itemData, 1);
                    TrackWonItem(item);

                    if (rarity >= RarityTier.Rare)
                    {
                        spinsSinceLastRare = 0;
                    }
                }
            }

            // 10th spin guaranteed rare or better
            RarityTier guaranteedRarity = RollRarityGuaranteed();
            ItemInstance guaranteedItem = SelectItemFromRarity(guaranteedRarity);

            if (guaranteedItem != null)
            {
                rewards.Add(guaranteedItem);
                InventoryManager.Instance.AddItem(guaranteedItem.itemData, 1);
                TrackWonItem(guaranteedItem);
                spinsSinceLastRare = 0;

                OnRareItemWon?.Invoke(guaranteedItem, guaranteedRarity);
                // ::benediction🎉:GuaranteedRareWon()
                Debug.Log($"[BENEDICTION] 10-pull guaranteed: {guaranteedItem.itemData.itemName}!");
            }

            totalSpins++;
            SaveGamblingData();
            OnSpinCompleted?.Invoke(rewards);

            return rewards;
        }

        /// <summary>
        /// Roll rarity tier based on drop rates.
        /// </summary>
        private RarityTier RollRarity()
        {
            // ::cantrip🔧:RollRarity() -> tier

            // Check pity system
            if (enablePitySystem && spinsSinceLastRare >= pityThreshold)
            {
                OnPityTriggered?.Invoke(spinsSinceLastRare);
                Debug.Log($"[SlotMachine] Pity system triggered at {spinsSinceLastRare} spins!");
                return RollRarityGuaranteed();
            }

            float roll = Random.value;
            float cumulative = 0f;

            cumulative += legendaryDropRate;
            if (roll < cumulative) return RarityTier.Legendary;

            cumulative += epicDropRate;
            if (roll < cumulative) return RarityTier.Epic;

            cumulative += rareDropRate;
            if (roll < cumulative) return RarityTier.Rare;

            return RarityTier.Common;
        }

        /// <summary>
        /// Roll guaranteed rare or better rarity.
        /// </summary>
        private RarityTier RollRarityGuaranteed()
        {
            // Reweight without common
            float totalRate = rareDropRate + epicDropRate + legendaryDropRate;
            float roll = Random.value * totalRate;
            float cumulative = 0f;

            cumulative += legendaryDropRate;
            if (roll < cumulative) return RarityTier.Legendary;

            cumulative += epicDropRate;
            if (roll < cumulative) return RarityTier.Epic;

            return RarityTier.Rare;
        }

        /// <summary>
        /// Select random item from rarity tier.
        /// </summary>
        private ItemInstance SelectItemFromRarity(RarityTier rarity)
        {
            // ::cantrip🔧:SelectItem(rarity) -> item
            List<LootTableEntry> lootTable = rarity switch
            {
                RarityTier.Common => commonLoot,
                RarityTier.Rare => rareLoot,
                RarityTier.Epic => epicLoot,
                RarityTier.Legendary => legendaryLoot,
                _ => commonLoot
            };

            if (lootTable.Count == 0)
            {
                Debug.LogWarning($"[SlotMachine] No items in {rarity} loot table!");
                return null;
            }

            // Weighted random selection
            float totalWeight = lootTable.Sum(entry => entry.weight);
            float roll = Random.value * totalWeight;
            float cumulative = 0f;

            foreach (var entry in lootTable)
            {
                cumulative += entry.weight;
                if (roll < cumulative)
                {
                    return new ItemInstance(entry.itemData, 1);
                }
            }

            return new ItemInstance(lootTable[0].itemData, 1);
        }

        /// <summary>
        /// Track won items for statistics.
        /// </summary>
        private void TrackWonItem(ItemInstance item)
        {
            string itemID = item.itemData.itemID;
            if (itemsWon.ContainsKey(itemID))
            {
                itemsWon[itemID]++;
            }
            else
            {
                itemsWon[itemID] = 1;
            }
        }

        /// <summary>
        /// Get total value won.
        /// </summary>
        public int GetTotalValueWon()
        {
            int total = 0;
            foreach (var kvp in itemsWon)
            {
                // Find item data and multiply by count
                // total += itemValue * kvp.Value;
            }
            return total;
        }

        /// <summary>
        /// Get win statistics.
        /// </summary>
        public Dictionary<RarityTier, int> GetRarityStatistics()
        {
            // TODO: Track rarity counts
            return new Dictionary<RarityTier, int>
            {
                { RarityTier.Common, 0 },
                { RarityTier.Rare, 0 },
                { RarityTier.Epic, 0 },
                { RarityTier.Legendary, 0 }
            };
        }

        /// <summary>
        /// Reset pity counter (for testing).
        /// </summary>
        public void ResetPity()
        {
            spinsSinceLastRare = 0;
            Debug.Log("[SlotMachine] Pity counter reset.");
        }

        private void SaveGamblingData()
        {
            // ::glyph📜:SerializeGambling() -> json
            PlayerPrefs.SetInt("SlotMachine_TotalSpins", totalSpins);
            PlayerPrefs.SetInt("SlotMachine_SpinsSinceRare", spinsSinceLastRare);
            PlayerPrefs.Save();
        }

        private void LoadGamblingData()
        {
            totalSpins = PlayerPrefs.GetInt("SlotMachine_TotalSpins", 0);
            spinsSinceLastRare = PlayerPrefs.GetInt("SlotMachine_SpinsSinceRare", 0);
            Debug.Log($"[SlotMachine] Loaded data: {totalSpins} total spins, {spinsSinceLastRare} since rare.");
        }
    }

    /// <summary>
    /// Loot table entry with item and weight.
    /// </summary>
    [System.Serializable]
    public class LootTableEntry
    {
        public ItemData itemData;
        public float weight = 1f;
    }

    /// <summary>
    /// Rarity tier enumeration.
    /// </summary>
    public enum RarityTier
    {
        Common = 0,
        Rare = 1,
        Epic = 2,
        Legendary = 3
    }
}
