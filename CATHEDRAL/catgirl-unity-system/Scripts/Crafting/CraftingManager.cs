using UnityEngine;
using System.Collections.Generic;
using System.Linq;

namespace CatGirlSystem.Crafting
{
    /// <summary>
    /// Grid-based crafting system with recipe matching.
    /// Supports ordered and unordered recipes.
    /// </summary>
    public class CraftingManager : MonoBehaviour
    {
        public static CraftingManager Instance { get; private set; }

        [Header("Crafting Configuration")]
        [SerializeField] private List<CraftRecipe> allRecipes = new List<CraftRecipe>();
        [SerializeField] private int craftingGridSize = 9; // 3x3 grid

        private string[] currentCraftingGrid;

        /// LAW: Recipe ingredients must exactly match for crafting success
        /// FLOW: Place items in grid -> Match recipe -> Consume materials -> Grant result
        ///<3 HEART: Discovery of new recipes feels magical and rewarding
        ///⚡ PERF: Cache recipe lookups by hash for O(1) matching

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                currentCraftingGrid = new string[craftingGridSize];
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        /// <summary>
        /// Set item in crafting grid slot.
        /// </summary>
        public void SetCraftingSlot(int slotIndex, string itemID)
        {
            // ::cantrip🔧:UpdateCraftingSlot(index, itemID) -> updated
            if (slotIndex >= 0 && slotIndex < craftingGridSize)
            {
                currentCraftingGrid[slotIndex] = itemID;
                CheckForValidRecipe();
            }
        }

        /// <summary>
        /// Clear crafting grid.
        /// </summary>
        public void ClearCraftingGrid()
        {
            for (int i = 0; i < craftingGridSize; i++)
            {
                currentCraftingGrid[i] = null;
            }
        }

        /// <summary>
        /// Check if current grid matches any recipe.
        /// </summary>
        private CraftRecipe CheckForValidRecipe()
        {
            foreach (var recipe in allRecipes)
            {
                if (recipe.isOrdered)
                {
                    if (MatchesOrderedRecipe(recipe))
                    {
                        return recipe;
                    }
                }
                else
                {
                    if (MatchesUnorderedRecipe(recipe))
                    {
                        return recipe;
                    }
                }
            }
            return null;
        }

        /// <summary>
        /// Match ordered recipe (position-specific).
        /// </summary>
        private bool MatchesOrderedRecipe(CraftRecipe recipe)
        {
            // ::abjure🛡️:ValidateOrderedPattern(recipe) -> matches
            if (recipe.requiredItems.Length != currentCraftingGrid.Length)
                return false;

            for (int i = 0; i < craftingGridSize; i++)
            {
                string required = recipe.requiredItems[i];
                string current = currentCraftingGrid[i] ?? "";

                if (required != current)
                {
                    return false;
                }
            }
            return true;
        }

        /// <summary>
        /// Match unordered recipe (any position).
        /// </summary>
        private bool MatchesUnorderedRecipe(CraftRecipe recipe)
        {
            // ::divine🔮:DiscoverRecipeMatch(ingredients) -> matches
            var requiredItems = recipe.requiredItems.Where(x => !string.IsNullOrEmpty(x)).ToList();
            var currentItems = currentCraftingGrid.Where(x => !string.IsNullOrEmpty(x)).ToList();

            if (requiredItems.Count != currentItems.Count)
                return false;

            var requiredSorted = requiredItems.OrderBy(x => x).ToList();
            var currentSorted = currentItems.OrderBy(x => x).ToList();

            return requiredSorted.SequenceEqual(currentSorted);
        }

        /// <summary>
        /// Attempt to craft using current grid.
        /// </summary>
        public bool AttemptCraft()
        {
            CraftRecipe recipe = CheckForValidRecipe();

            if (recipe == null)
            {
                Debug.Log("[CraftingManager] No valid recipe found.");
                return false;
            }

            // Check if player has required items
            if (!HasRequiredItems(recipe))
            {
                Debug.LogWarning("[CraftingManager] Missing required materials!");
                return false;
            }

            // Consume materials
            ConsumeIngredients(recipe);

            // Grant result
            var resultItem = CreateCraftedItem(recipe);
            bool added = Inventory.InventoryManager.Instance.AddItem(resultItem.itemData, resultItem.stackSize);

            if (added)
            {
                // ::benediction🎉:CelebrateCraft()
                Debug.Log($"[BENEDICTION] Successfully crafted {resultItem.itemData.itemName}!");
                ClearCraftingGrid();
                return true;
            }

            return false;
        }

        /// <summary>
        /// Check if player has all required items.
        /// </summary>
        private bool HasRequiredItems(CraftRecipe recipe)
        {
            foreach (string itemID in recipe.requiredItems)
            {
                if (string.IsNullOrEmpty(itemID)) continue;

                if (!Inventory.InventoryManager.Instance.HasItem(itemID))
                {
                    return false;
                }
            }
            return true;
        }

        /// <summary>
        /// Consume crafting ingredients from inventory.
        /// </summary>
        private void ConsumeIngredients(CraftRecipe recipe)
        {
            // ::transmute⚗️:ConsumeIngredients(recipe) -> consumed
            foreach (string itemID in recipe.requiredItems)
            {
                if (string.IsNullOrEmpty(itemID)) continue;
                Inventory.InventoryManager.Instance.RemoveItem(itemID, 1);
            }
        }

        /// <summary>
        /// Create result item instance.
        /// </summary>
        private Inventory.ItemInstance CreateCraftedItem(CraftRecipe recipe)
        {
            // ::conjure🎨:CreateItem(recipeResult) -> itemInstance
            return new Inventory.ItemInstance(recipe.resultItem, recipe.resultQuantity);
        }

        /// <summary>
        /// Get all available recipes.
        /// </summary>
        public List<CraftRecipe> GetAllRecipes() => allRecipes;

        /// <summary>
        /// Add new recipe to database.
        /// </summary>
        public void UnlockRecipe(CraftRecipe recipe)
        {
            if (!allRecipes.Contains(recipe))
            {
                allRecipes.Add(recipe);
                Debug.Log($"[CraftingManager] Unlocked recipe: {recipe.recipeName}");
            }
        }
    }

    /// <summary>
    /// ScriptableObject defining crafting recipe.
    /// </summary>
    [CreateAssetMenu(fileName = "NewRecipe", menuName = "CatGirl/Craft Recipe")]
    public class CraftRecipe : ScriptableObject
    {
        [Header("Recipe Info")]
        public string recipeID;
        public string recipeName;
        [TextArea(2, 4)]
        public string description;

        [Header("Ingredients (3x3 grid)")]
        [Tooltip("9 slots for 3x3 grid. Use empty string for empty slots.")]
        public string[] requiredItems = new string[9];

        [Header("Recipe Type")]
        public bool isOrdered = true; // If false, ingredients can be in any position

        [Header("Result")]
        public Inventory.ItemData resultItem;
        public int resultQuantity = 1;

        [Header("Requirements")]
        public int requiredCraftingLevel = 1;
        public bool isLocked = false;

        private void OnValidate()
        {
            if (string.IsNullOrEmpty(recipeID))
            {
                recipeID = $"recipe_{name}";
            }

            // Ensure array is size 9
            if (requiredItems.Length != 9)
            {
                System.Array.Resize(ref requiredItems, 9);
            }
        }
    }
}
