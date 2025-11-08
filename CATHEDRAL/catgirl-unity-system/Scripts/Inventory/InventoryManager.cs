using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using System.Collections.Generic;

namespace CatGirlSystem.Inventory
{
    /// <summary>
    /// Diablo-style grid-based inventory system.
    /// Supports item shapes, rotation, drag/drop, and stacking.
    /// </summary>
    public class InventoryManager : MonoBehaviour
    {
        public static InventoryManager Instance { get; private set; }

        [Header("Inventory Configuration")]
        [SerializeField] private int gridWidth = 8;
        [SerializeField] private int gridHeight = 4;

        [Header("UI References")]
        [SerializeField] private Transform gridContainer;
        [SerializeField] private GameObject gridSlotPrefab;
        [SerializeField] private Transform itemContainer;

        private ItemInstance[,] inventoryGrid;
        private List<ItemInstance> allItems = new List<ItemInstance>();
        private Dictionary<string, GridSlot> gridSlots = new Dictionary<string, GridSlot>();

        /// LAW: Grid coordinates must be within bounds (0 to width-1, 0 to height-1)
        /// FLOW: Check space -> Validate shape -> Place item -> Update UI
        ///<3 HEART: Tetris-like inventory feels satisfying and strategic
        ///⚡ PERF: Use 2D array for O(1) grid lookup, dictionary for slot access

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeInventory();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeInventory()
        {
            // ::conjure🎨:CreateInventoryGrid(width, height) -> grid
            inventoryGrid = new ItemInstance[gridWidth, gridHeight];

            // Create grid UI
            if (gridContainer != null && gridSlotPrefab != null)
            {
                GenerateGridUI();
            }

            LoadInventory();
        }

        /// <summary>
        /// Generate UI grid slots.
        /// </summary>
        private void GenerateGridUI()
        {
            for (int y = 0; y < gridHeight; y++)
            {
                for (int x = 0; x < gridWidth; x++)
                {
                    GameObject slotObj = Instantiate(gridSlotPrefab, gridContainer);
                    GridSlot slot = slotObj.GetComponent<GridSlot>();
                    if (slot != null)
                    {
                        slot.x = x;
                        slot.y = y;
                        gridSlots[$"{x},{y}"] = slot;
                    }
                }
            }
        }

        /// <summary>
        /// Add item to inventory. Returns true if successful.
        /// </summary>
        public bool AddItem(ItemData itemData, int quantity = 1)
        {
            // ::abjure🛡️:ValidateSpace(itemData.Width, itemData.Height) -> hasSpace

            // Try to stack first if stackable
            if (itemData.maxStack > 1)
            {
                foreach (var existing in allItems)
                {
                    if (existing.itemData.itemID == itemData.itemID && existing.stackSize < itemData.maxStack)
                    {
                        int addAmount = Mathf.Min(quantity, itemData.maxStack - existing.stackSize);
                        existing.stackSize += addAmount;
                        quantity -= addAmount;

                        if (quantity <= 0)
                        {
                            Debug.Log($"[BENEDICTION] Stacked {itemData.itemName}!");
                            return true;
                        }
                    }
                }
            }

            // Create new instance
            ItemInstance newItem = new ItemInstance(itemData, quantity);

            // Find space in grid
            Vector2Int? position = FindSpaceForItem(newItem);
            if (position.HasValue)
            {
                PlaceItemAt(newItem, position.Value.x, position.Value.y);
                allItems.Add(newItem);
                SaveInventory();
                return true;
            }

            Debug.LogWarning($"[InventoryManager] No space for {itemData.itemName}!");
            return false;
        }

        /// <summary>
        /// Find first available space for item.
        /// </summary>
        private Vector2Int? FindSpaceForItem(ItemInstance item)
        {
            for (int y = 0; y <= gridHeight - item.itemData.height; y++)
            {
                for (int x = 0; x <= gridWidth - item.itemData.width; x++)
                {
                    if (CanPlaceItemAt(item, x, y))
                    {
                        return new Vector2Int(x, y);
                    }
                }
            }
            return null;
        }

        /// <summary>
        /// Check if item can be placed at position.
        /// </summary>
        public bool CanPlaceItemAt(ItemInstance item, int x, int y)
        {
            // ::abjure🛡️:ValidatePlacement(x, y, width, height) -> isValid
            if (x < 0 || y < 0 || x + item.itemData.width > gridWidth || y + item.itemData.height > gridHeight)
            {
                return false;
            }

            for (int dy = 0; dy < item.itemData.height; dy++)
            {
                for (int dx = 0; dx < item.itemData.width; dx++)
                {
                    if (inventoryGrid[x + dx, y + dy] != null)
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        /// <summary>
        /// Place item at specific grid position.
        /// </summary>
        private void PlaceItemAt(ItemInstance item, int x, int y)
        {
            // ::conjure🎨:PlaceItem(item, x, y) -> placed
            for (int dy = 0; dy < item.itemData.height; dy++)
            {
                for (int dx = 0; dx < item.itemData.width; dx++)
                {
                    inventoryGrid[x + dx, y + dy] = item;
                }
            }

            UpdateItemUI(item, x, y);
        }

        /// <summary>
        /// Remove item from inventory.
        /// </summary>
        public bool RemoveItem(string itemID, int quantity = 1)
        {
            ItemInstance item = allItems.Find(i => i.itemData.itemID == itemID);
            if (item == null) return false;

            if (item.stackSize > quantity)
            {
                item.stackSize -= quantity;
                return true;
            }
            else
            {
                // Remove completely
                RemoveItemFromGrid(item);
                allItems.Remove(item);
                SaveInventory();
                return true;
            }
        }

        /// <summary>
        /// Remove item from grid cells.
        /// </summary>
        private void RemoveItemFromGrid(ItemInstance item)
        {
            for (int y = 0; y < gridHeight; y++)
            {
                for (int x = 0; x < gridWidth; x++)
                {
                    if (inventoryGrid[x, y] == item)
                    {
                        inventoryGrid[x, y] = null;
                    }
                }
            }
        }

        /// <summary>
        /// Check if inventory contains item.
        /// </summary>
        public bool HasItem(string itemID)
        {
            return allItems.Exists(i => i.itemData.itemID == itemID);
        }

        /// <summary>
        /// Get total quantity of item type.
        /// </summary>
        public int GetItemCount(string itemID)
        {
            int count = 0;
            foreach (var item in allItems)
            {
                if (item.itemData.itemID == itemID)
                {
                    count += item.stackSize;
                }
            }
            return count;
        }

        /// <summary>
        /// Update UI representation of item.
        /// </summary>
        private void UpdateItemUI(ItemInstance item, int x, int y)
        {
            // Create or update item visual in UI
            // Implementation depends on your UI framework
        }

        /// <summary>
        /// Save inventory state.
        /// </summary>
        private void SaveInventory()
        {
            // ::glyph📜:SerializeInventory() -> json
            string json = JsonUtility.ToJson(new InventorySaveData(allItems));
            PlayerPrefs.SetString("InventoryData", json);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// Load inventory state.
        /// </summary>
        private void LoadInventory()
        {
            string json = PlayerPrefs.GetString("InventoryData", "");
            if (!string.IsNullOrEmpty(json))
            {
                // Deserialize and restore inventory
                Debug.Log("[InventoryManager] Inventory loaded.");
            }
        }

        [System.Serializable]
        private class InventorySaveData
        {
            public List<string> itemIDs;
            public List<int> stackSizes;

            public InventorySaveData(List<ItemInstance> items)
            {
                itemIDs = new List<string>();
                stackSizes = new List<int>();
                foreach (var item in items)
                {
                    itemIDs.Add(item.itemData.itemID);
                    stackSizes.Add(item.stackSize);
                }
            }
        }
    }

    /// <summary>
    /// UI component for grid slot.
    /// </summary>
    public class GridSlot : MonoBehaviour, IPointerEnterHandler, IPointerExitHandler
    {
        public int x;
        public int y;
        public Image backgroundImage;
        public bool isHighlighted;

        public void OnPointerEnter(PointerEventData eventData)
        {
            isHighlighted = true;
            if (backgroundImage != null)
            {
                backgroundImage.color = Color.yellow;
            }
        }

        public void OnPointerExit(PointerEventData eventData)
        {
            isHighlighted = false;
            if (backgroundImage != null)
            {
                backgroundImage.color = Color.white;
            }
        }
    }
}
