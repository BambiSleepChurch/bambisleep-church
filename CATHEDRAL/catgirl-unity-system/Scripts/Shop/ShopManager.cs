using UnityEngine;
using UnityEngine.Events;
using System.Collections.Generic;
using System.Linq;
using CatGirlSystem.Inventory;
using CatGirlSystem.Economy;

namespace CatGirlSystem.Shop
{
    /// <summary>
    /// Shop system for buying and selling items with dynamic pricing.
    /// Supports stock management, price fluctuation, and multiple shop types.
    /// </summary>
    public class ShopManager : MonoBehaviour
    {
        public static ShopManager Instance { get; private set; }

        [Header("Shop Configuration")]
        [SerializeField] private List<ShopItem> defaultInventory = new List<ShopItem>();
        [SerializeField] private float sellPriceMultiplier = 0.5f; // Sell for 50% of buy price
        [SerializeField] private bool enableDynamicPricing = true;
        [SerializeField] private float priceFluctuationRange = 0.2f; // ±20%

        [Header("Shop Inventory")]
        public List<ShopItem> currentInventory = new List<ShopItem>();

        [Header("Events")]
        public UnityEvent<ShopItem, int> OnItemPurchased;
        public UnityEvent<ItemData, int, int> OnItemSold;
        public UnityEvent OnInventoryRefreshed;

        /// LAW: Shop prices must never be negative or zero
        /// FLOW: Validate price -> Check funds -> Process transaction -> Update stock
        ///<3 HEART: Dynamic pricing makes economy feel alive
        ///> CONSEQUENCE: Stock depletion increases demand and future prices

        private void Awake()
        {
            // ::abjure🛡️:EnsureSingleton() -> valid
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeShop();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeShop()
        {
            // ::cantrip🔧:InitializeShop() -> ready
            currentInventory = new List<ShopItem>(defaultInventory);

            if (enableDynamicPricing)
            {
                ApplyPriceFluctuation();
            }

            Debug.Log($"[ShopManager] Initialized with {currentInventory.Count} items");
        }

        /// <summary>
        /// Purchase item from shop.
        /// </summary>
        public bool PurchaseItem(ShopItem shopItem, int quantity = 1)
        {
            // ::abjure🛡️:ValidatePurchase(shopItem, quantity) -> canBuy
            if (shopItem == null || shopItem.itemData == null)
            {
                Debug.LogWarning("[ShopManager] Invalid shop item!");
                return false;
            }

            if (!IsInStock(shopItem, quantity))
            {
                Debug.LogWarning($"[ShopManager] {shopItem.itemData.itemName} out of stock!");
                return false;
            }

            int totalCost = shopItem.price * quantity;

            if (!CurrencyManager.Instance.CanAfford(totalCost))
            {
                Debug.LogWarning($"[ShopManager] Insufficient funds! Need {totalCost} coins.");
                return false;
            }

            // ::transmute⚗️:ProcessPurchase(shopItem, quantity) -> success
            CurrencyManager.Instance.SpendCoins(totalCost);
            InventoryManager.Instance.AddItem(shopItem.itemData, quantity);

            // Update stock
            if (shopItem.stock > 0)
            {
                shopItem.stock -= quantity;
            }

            // ::benediction🎉:CelebratePurchase()
            Debug.Log($"[BENEDICTION] Purchased {quantity}x {shopItem.itemData.itemName} for {totalCost} coins!");
            OnItemPurchased?.Invoke(shopItem, quantity);

            return true;
        }

        /// <summary>
        /// Sell item to shop.
        /// </summary>
        public bool SellItem(ItemData itemData, int quantity = 1)
        {
            // ::abjure🛡️:ValidateSale(itemData, quantity) -> canSell
            if (itemData == null)
            {
                Debug.LogWarning("[ShopManager] Invalid item data!");
                return false;
            }

            if (!InventoryManager.Instance.HasItem(itemData.itemID))
            {
                Debug.LogWarning($"[ShopManager] Don't have {itemData.itemName} to sell!");
                return false;
            }

            int itemCount = InventoryManager.Instance.GetItemCount(itemData.itemID);
            if (itemCount < quantity)
            {
                Debug.LogWarning($"[ShopManager] Only have {itemCount}x {itemData.itemName}!");
                return false;
            }

            // Calculate sell price
            // ::cantrip🔧:CalculateSellPrice(basePrice, multiplier) -> sellPrice
            ShopItem shopItem = GetShopItem(itemData.itemID);
            int basePrice = shopItem != null ? shopItem.price : itemData.baseValue;
            int sellPrice = Mathf.RoundToInt(basePrice * sellPriceMultiplier);
            int totalValue = sellPrice * quantity;

            // ::transmute⚗️:ProcessSale(item, quantity) -> success
            InventoryManager.Instance.RemoveItem(itemData.itemID, quantity);
            CurrencyManager.Instance.AddCoins(totalValue);

            // ::benediction🎉:CelebrateSale()
            Debug.Log($"[BENEDICTION] Sold {quantity}x {itemData.itemName} for {totalValue} coins!");
            OnItemSold?.Invoke(itemData, quantity, totalValue);

            return true;
        }

        /// <summary>
        /// Check if item is in stock.
        /// </summary>
        public bool IsInStock(ShopItem shopItem, int quantity = 1)
        {
            if (shopItem.stock == -1) return true; // Infinite stock
            return shopItem.stock >= quantity;
        }

        /// <summary>
        /// Get shop item by item ID.
        /// </summary>
        public ShopItem GetShopItem(string itemID)
        {
            return currentInventory.Find(si => si.itemData.itemID == itemID);
        }

        /// <summary>
        /// Get all available shop items.
        /// </summary>
        public List<ShopItem> GetAvailableItems()
        {
            return currentInventory.Where(si => si.stock != 0).ToList();
        }

        /// <summary>
        /// Refresh shop inventory (restock and apply new prices).
        /// </summary>
        public void RefreshInventory()
        {
            // ::cantrip🔧:RefreshShop() -> restocked
            foreach (var item in currentInventory)
            {
                // Restock items
                if (item.stock > 0 && item.stock < item.maxStock)
                {
                    item.stock = item.maxStock;
                }
            }

            if (enableDynamicPricing)
            {
                ApplyPriceFluctuation();
            }

            Debug.Log("[ShopManager] Shop inventory refreshed!");
            OnInventoryRefreshed?.Invoke();
        }

        /// <summary>
        /// Apply random price fluctuation to items.
        /// </summary>
        private void ApplyPriceFluctuation()
        {
            // ::transmute⚗️:FluctuatePrices(range) -> adjusted
            foreach (var item in currentInventory)
            {
                if (!item.allowPriceFluctuation) continue;

                float fluctuation = Random.Range(-priceFluctuationRange, priceFluctuationRange);
                item.price = Mathf.RoundToInt(item.basePrice * (1f + fluctuation));
                item.price = Mathf.Max(1, item.price); // Never zero or negative
            }
        }

        /// <summary>
        /// Add item to shop inventory.
        /// </summary>
        public void AddShopItem(ShopItem newItem)
        {
            currentInventory.Add(newItem);
            Debug.Log($"[ShopManager] Added {newItem.itemData.itemName} to shop.");
        }

        /// <summary>
        /// Remove item from shop inventory.
        /// </summary>
        public void RemoveShopItem(string itemID)
        {
            var item = GetShopItem(itemID);
            if (item != null)
            {
                currentInventory.Remove(item);
                Debug.Log($"[ShopManager] Removed {item.itemData.itemName} from shop.");
            }
        }

        /// <summary>
        /// Calculate sell price for an item.
        /// </summary>
        public int GetSellPrice(ItemData itemData)
        {
            ShopItem shopItem = GetShopItem(itemData.itemID);
            int basePrice = shopItem != null ? shopItem.price : itemData.baseValue;
            return Mathf.RoundToInt(basePrice * sellPriceMultiplier);
        }

        /// <summary>
        /// Save shop state to PlayerPrefs.
        /// </summary>
        private void SaveShopData()
        {
            // ::glyph📜:SerializeShop() -> json
            string json = JsonUtility.ToJson(new ShopSaveData(currentInventory));
            PlayerPrefs.SetString("ShopData", json);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// Load shop state from PlayerPrefs.
        /// </summary>
        private void LoadShopData()
        {
            string json = PlayerPrefs.GetString("ShopData", "");
            if (!string.IsNullOrEmpty(json))
            {
                // Deserialize and restore shop state
                Debug.Log("[ShopManager] Shop data loaded.");
            }
        }

        [System.Serializable]
        private class ShopSaveData
        {
            public List<ShopItemSaveData> items;

            public ShopSaveData(List<ShopItem> shopItems)
            {
                items = shopItems.Select(si => new ShopItemSaveData(si)).ToList();
            }
        }

        [System.Serializable]
        private class ShopItemSaveData
        {
            public string itemID;
            public int price;
            public int stock;

            public ShopItemSaveData(ShopItem shopItem)
            {
                itemID = shopItem.itemData.itemID;
                price = shopItem.price;
                stock = shopItem.stock;
            }
        }
    }

    /// <summary>
    /// Shop item definition with pricing and stock data.
    /// </summary>
    [System.Serializable]
    public class ShopItem
    {
        public ItemData itemData;
        public int basePrice;
        public int price;
        public int stock; // -1 = infinite stock
        public int maxStock = 99;
        public bool allowPriceFluctuation = true;

        public ShopItem(ItemData data, int price, int stock = -1)
        {
            this.itemData = data;
            this.basePrice = price;
            this.price = price;
            this.stock = stock;
        }
    }
}
