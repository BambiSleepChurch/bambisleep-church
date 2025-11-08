using UnityEngine;
using UnityEditor;
using CatGirlSystem.Inventory;
using CatGirlSystem.Crafting;
using CatGirlSystem.Quest;
using CatGirlSystem.TechTree;

namespace CatGirlSystem.Editor
{
    /// <summary>
    /// Unity Editor utility for creating CatGirl system ScriptableObjects via menu.
    /// Provides quick access to create Items, Recipes, Quests, Tech Nodes, etc.
    /// </summary>
    public static class CatGirlAssetCreator
    {
        // ::cantrip🔧:CreateAssetMenu(path, name) -> menu_item

        private const string MenuRoot = "Assets/Create/CatGirl/";
        private const int MenuPriority = 50;

        #region Item System

        [MenuItem(MenuRoot + "Item Data", priority = MenuPriority)]
        public static void CreateItemData()
        {
            var asset = ScriptableObject.CreateInstance<ItemData>();

            // Set default values
            asset.itemName = "New Item";
            asset.itemID = $"item_{System.Guid.NewGuid().ToString().Substring(0, 8)}";
            asset.itemType = ItemType.Consumable;
            asset.rarity = ItemRarity.Common;
            asset.width = 1;
            asset.height = 1;
            asset.maxStack = 99;
            asset.baseValue = 10;

            CreateAsset(asset, "NewItemData");
        }

        [MenuItem(MenuRoot + "Enchantment Data", priority = MenuPriority + 1)]
        public static void CreateEnchantmentData()
        {
            var asset = ScriptableObject.CreateInstance<EnchantmentData>();

            asset.enchantmentName = "New Enchantment";
            asset.enchantmentID = $"ench_{System.Guid.NewGuid().ToString().Substring(0, 8)}";
            asset.enchantmentLevel = 1;
            asset.statModifier = 0f;

            CreateAsset(asset, "NewEnchantment");
        }

        #endregion

        #region Crafting System

        [MenuItem(MenuRoot + "Craft Recipe", priority = MenuPriority + 10)]
        public static void CreateCraftRecipe()
        {
            var asset = ScriptableObject.CreateInstance<CraftRecipe>();

            asset.recipeName = "New Recipe";
            asset.recipeID = $"recipe_{System.Guid.NewGuid().ToString().Substring(0, 8)}";
            asset.requiredItems = new string[9]; // 3x3 grid
            asset.isOrdered = true;
            asset.resultQuantity = 1;
            asset.requiredCraftingLevel = 1;

            CreateAsset(asset, "NewRecipe");
        }

        #endregion

        #region Quest System

        [MenuItem(MenuRoot + "Quest Data", priority = MenuPriority + 20)]
        public static void CreateQuestData()
        {
            var asset = ScriptableObject.CreateInstance<QuestData>();

            asset.questName = "New Quest";
            asset.questID = $"quest_{System.Guid.NewGuid().ToString().Substring(0, 8)}";
            asset.description = "Quest description here...";
            asset.questType = QuestType.Main;
            asset.requiredLevel = 1;
            asset.objectives = new System.Collections.Generic.List<QuestObjective>();

            // Add default objective
            asset.objectives.Add(new QuestObjective
            {
                objectiveType = ObjectiveType.Collect,
                targetID = "item_example",
                requiredCount = 1,
                description = "Collect 1 item"
            });

            // Add default reward
            asset.rewards = new System.Collections.Generic.List<QuestReward>();
            asset.rewards.Add(new QuestReward
            {
                rewardType = RewardType.Currency,
                currencyType = CurrencyType.Coins,
                amount = 100
            });

            CreateAsset(asset, "NewQuest");
        }

        #endregion

        #region Tech Tree System

        [MenuItem(MenuRoot + "Tech Node", priority = MenuPriority + 30)]
        public static void CreateTechNode()
        {
            var asset = ScriptableObject.CreateInstance<TechNode>();

            asset.techName = "New Technology";
            asset.techID = $"tech_{System.Guid.NewGuid().ToString().Substring(0, 8)}";
            asset.description = "Technology description here...";
            asset.coinCost = 100;
            asset.gemCost = 0;
            asset.requiredLevel = 1;
            asset.prerequisites = new System.Collections.Generic.List<string>();
            asset.resourceRequirements = new System.Collections.Generic.List<ResourceRequirement>();
            asset.statBonuses = new System.Collections.Generic.List<StatBonus>();
            asset.status = TechStatus.Locked;

            CreateAsset(asset, "NewTechNode");
        }

        #endregion

        #region Shop System

        [MenuItem(MenuRoot + "Shop Configuration", priority = MenuPriority + 40)]
        public static void CreateShopConfiguration()
        {
            var asset = ScriptableObject.CreateInstance<ScriptableObject>(); // TODO: Create ShopConfigSO
            CreateAsset(asset, "NewShopConfig");
        }

        #endregion

        #region Loot Tables

        [MenuItem(MenuRoot + "Loot Table", priority = MenuPriority + 50)]
        public static void CreateLootTable()
        {
            var asset = ScriptableObject.CreateInstance<ScriptableObject>(); // TODO: Create LootTableSO
            CreateAsset(asset, "NewLootTable");
        }

        #endregion

        #region Utility Methods

        /// <summary>
        /// Create ScriptableObject asset at selected path.
        /// </summary>
        private static void CreateAsset(ScriptableObject asset, string defaultName)
        {
            // ::cantrip🔧:CreateAsset(asset, path) -> created

            string path = AssetDatabase.GetAssetPath(Selection.activeObject);

            if (string.IsNullOrEmpty(path))
            {
                path = "Assets";
            }
            else if (System.IO.Path.GetExtension(path) != "")
            {
                path = path.Replace(System.IO.Path.GetFileName(AssetDatabase.GetAssetPath(Selection.activeObject)), "");
            }

            string assetPathAndName = AssetDatabase.GenerateUniqueAssetPath($"{path}/{defaultName}.asset");

            AssetDatabase.CreateAsset(asset, assetPathAndName);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            EditorUtility.FocusProjectWindow();
            Selection.activeObject = asset;

            Debug.Log($"[CatGirlAssetCreator] Created {asset.GetType().Name} at {assetPathAndName}");
        }

        #endregion

        #region Batch Creation Tools

        [MenuItem(MenuRoot + "Batch Tools/Create Example Items", priority = MenuPriority + 100)]
        public static void CreateExampleItems()
        {
            // ::conjure🎨:CreateExampleItems() -> batch_created

            CreateExampleSword();
            CreateExamplePotion();
            CreateExampleCraftingMaterial();

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log("[CatGirlAssetCreator] Created 3 example items!");
        }

        private static void CreateExampleSword()
        {
            var asset = ScriptableObject.CreateInstance<ItemData>();
            asset.itemName = "Iron Sword";
            asset.itemID = "item_iron_sword";
            asset.description = "A basic iron sword.";
            asset.itemType = ItemType.Weapon;
            asset.rarity = ItemRarity.Common;
            asset.width = 1;
            asset.height = 3;
            asset.maxStack = 1;
            asset.baseValue = 50;
            asset.maxDurability = 100;
            asset.currentDurability = 100;

            string path = "Assets/CatGirl/Items";
            if (!AssetDatabase.IsValidFolder(path))
            {
                AssetDatabase.CreateFolder("Assets", "CatGirl");
                AssetDatabase.CreateFolder("Assets/CatGirl", "Items");
            }

            AssetDatabase.CreateAsset(asset, $"{path}/IronSword.asset");
        }

        private static void CreateExamplePotion()
        {
            var asset = ScriptableObject.CreateInstance<ItemData>();
            asset.itemName = "Health Potion";
            asset.itemID = "item_health_potion";
            asset.description = "Restores 50 HP.";
            asset.itemType = ItemType.Consumable;
            asset.rarity = ItemRarity.Common;
            asset.width = 1;
            asset.height = 1;
            asset.maxStack = 99;
            asset.baseValue = 10;

            string path = "Assets/CatGirl/Items";
            AssetDatabase.CreateAsset(asset, $"{path}/HealthPotion.asset");
        }

        private static void CreateExampleCraftingMaterial()
        {
            var asset = ScriptableObject.CreateInstance<ItemData>();
            asset.itemName = "Iron Ore";
            asset.itemID = "item_iron_ore";
            asset.description = "Raw iron ore for crafting.";
            asset.itemType = ItemType.Material;
            asset.rarity = ItemRarity.Common;
            asset.width = 1;
            asset.height = 1;
            asset.maxStack = 99;
            asset.baseValue = 5;

            string path = "Assets/CatGirl/Items";
            AssetDatabase.CreateAsset(asset, $"{path}/IronOre.asset");
        }

        [MenuItem(MenuRoot + "Batch Tools/Create Example Quest Chain", priority = MenuPriority + 101)]
        public static void CreateExampleQuestChain()
        {
            // ::conjure🎨:CreateQuestChain() -> chain_created

            string path = "Assets/CatGirl/Quests";
            if (!AssetDatabase.IsValidFolder(path))
            {
                AssetDatabase.CreateFolder("Assets/CatGirl", "Quests");
            }

            // Quest 1: Gather materials
            var quest1 = ScriptableObject.CreateInstance<QuestData>();
            quest1.questName = "Gathering Resources";
            quest1.questID = "quest_gather_intro";
            quest1.description = "Collect 10 Iron Ore.";
            quest1.questType = QuestType.Main;
            quest1.objectives = new System.Collections.Generic.List<QuestObjective>
            {
                new QuestObjective
                {
                    objectiveType = ObjectiveType.Collect,
                    targetID = "item_iron_ore",
                    requiredCount = 10,
                    description = "Collect Iron Ore"
                }
            };
            quest1.rewards = new System.Collections.Generic.List<QuestReward>
            {
                new QuestReward { rewardType = RewardType.Currency, currencyType = CurrencyType.Coins, amount = 100 },
                new QuestReward { rewardType = RewardType.Experience, amount = 50 }
            };

            AssetDatabase.CreateAsset(quest1, $"{path}/Quest1_GatheringResources.asset");

            // Quest 2: Craft sword
            var quest2 = ScriptableObject.CreateInstance<QuestData>();
            quest2.questName = "First Craft";
            quest2.questID = "quest_craft_intro";
            quest2.description = "Craft an Iron Sword.";
            quest2.questType = QuestType.Main;
            quest2.objectives = new System.Collections.Generic.List<QuestObjective>
            {
                new QuestObjective
                {
                    objectiveType = ObjectiveType.Craft,
                    targetID = "item_iron_sword",
                    requiredCount = 1,
                    description = "Craft Iron Sword"
                }
            };
            quest2.rewards = new System.Collections.Generic.List<QuestReward>
            {
                new QuestReward { rewardType = RewardType.Currency, currencyType = CurrencyType.Coins, amount = 200 },
                new QuestReward { rewardType = RewardType.Experience, amount = 100 }
            };

            AssetDatabase.CreateAsset(quest2, $"{path}/Quest2_FirstCraft.asset");

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();

            Debug.Log("[CatGirlAssetCreator] Created quest chain with 2 quests!");
        }

        #endregion
    }
}
