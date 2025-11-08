using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;

/// <summary>
/// ::invocation📣:display.shop_ui() -> merchant_interface
/// School: Invocation - Public interface for NPC shop system
/// 
/// Manages the shop interface for buying and selling items with NPCs.
/// Displays available items, prices, and handles transactions.
/// 
/// Usage:
///   - Attach to UI Canvas panel
///   - Assign item prefab and shop container
///   - Call OpenShop() to display shop interface
/// </summary>
public class ShopUI : MonoBehaviour
{
    // ::warding🛡️:protect.ui_references() -> null_safety
    [Header("UI References")]
    [SerializeField] private Transform shopItemsContainer;
    [SerializeField] private GameObject shopItemPrefab;
    [SerializeField] private TextMeshProUGUI shopTitleText;
    [SerializeField] private Button closeButton;
    [SerializeField] private Button buyTabButton;
    [SerializeField] private Button sellTabButton;

    [Header("Buy Panel")]
    [SerializeField] private GameObject buyPanel;
    [SerializeField] private TextMeshProUGUI buyInstructionText;

    [Header("Sell Panel")]
    [SerializeField] private GameObject sellPanel;
    [SerializeField] private Transform sellItemsContainer;
    [SerializeField] private TextMeshProUGUI sellInstructionText;

    [Header("Confirmation Dialog")]
    [SerializeField] private GameObject confirmationDialog;
    [SerializeField] private TextMeshProUGUI confirmationText;
    [SerializeField] private Button confirmYesButton;
    [SerializeField] private Button confirmNoButton;

    [Header("Currency Display")]
    [SerializeField] private TextMeshProUGUI playerCoinsText;

    // ::cantrip🔧:configure.visual_settings() -> user_experience
    [Header("Visual Settings")]
    [SerializeField] private Color affordableColor = Color.white;
    [SerializeField] private Color unaffordableColor = new Color(0.5f, 0.5f, 0.5f, 1f);
    [SerializeField] private float priceFluctuationUpdateInterval = 5f;

    // ::memory📝:track.shop_state() -> transaction_data
    private ShopManager shopManager;
    private InventoryManager inventoryManager;
    private CurrencyManager currencyManager;

    private List<ShopManager.ShopItem> currentShopItems;
    private ItemInstance pendingTransactionItem;
    private int pendingTransactionPrice;
    private bool isPurchaseMode;

    private float priceUpdateTimer;

    private enum ShopTab { Buy, Sell }
    private ShopTab currentTab = ShopTab.Buy;

    /// <summary>
    /// ::initialization🌱:setup.shop_ui() -> manager_references
    /// Initialize shop UI and cache manager references
    /// </summary>
    private void Awake()
    {
        // ::warding🛡️:validate.required_components() -> safe_initialization
        ValidateReferences();

        shopManager = ShopManager.Instance;
        inventoryManager = InventoryManager.Instance;
        currencyManager = CurrencyManager.Instance;

        // ::invocation📣:setup.button_listeners() -> interactive_ui
        if (closeButton != null)
        {
            closeButton.onClick.AddListener(OnCloseButtonClicked);
        }

        if (buyTabButton != null)
        {
            buyTabButton.onClick.AddListener(() => SwitchTab(ShopTab.Buy));
        }

        if (sellTabButton != null)
        {
            sellTabButton.onClick.AddListener(() => SwitchTab(ShopTab.Sell));
        }

        if (confirmYesButton != null)
        {
            confirmYesButton.onClick.AddListener(OnConfirmTransaction);
        }

        if (confirmNoButton != null)
        {
            confirmNoButton.onClick.AddListener(OnCancelTransaction);
        }

        // ::cantrip🔧:initialize.visibility() -> hidden_by_default
        gameObject.SetActive(false);

        if (confirmationDialog != null)
        {
            confirmationDialog.SetActive(false);
        }
    }

    /// <summary>
    /// ::transmutation🔄:update.dynamic_prices() -> fluctuating_economy
    /// Periodically update prices to reflect dynamic economy
    /// </summary>
    private void Update()
    {
        if (!gameObject.activeSelf) return;

        priceUpdateTimer += Time.deltaTime;
        if (priceUpdateTimer >= priceFluctuationUpdateInterval)
        {
            priceUpdateTimer = 0f;
            if (currentTab == ShopTab.Buy)
            {
                RefreshBuyPanel();
            }
        }

        // ::transmutation🔄:update.currency_display() -> realtime_sync
        UpdatePlayerCurrencyDisplay();
    }

    /// <summary>
    /// ::cantrip🔧:validate.ui_references() -> error_reporting
    /// Validate that all required UI references are assigned
    /// </summary>
    private void ValidateReferences()
    {
        if (shopItemsContainer == null)
        {
            Debug.LogError("ShopUI: shopItemsContainer is not assigned!", this);
        }
        if (shopItemPrefab == null)
        {
            Debug.LogError("ShopUI: shopItemPrefab is not assigned!", this);
        }
        if (buyPanel == null)
        {
            Debug.LogWarning("ShopUI: buyPanel is not assigned", this);
        }
        if (sellPanel == null)
        {
            Debug.LogWarning("ShopUI: sellPanel is not assigned", this);
        }
    }

    /// <summary>
    /// ::invocation📣:open.shop_interface() -> display_merchant
    /// Public method to open shop with specified merchant
    /// </summary>
    /// <param name="shopName">Name of the shop/merchant</param>
    public void OpenShop(string shopName = "General Store")
    {
        if (shopManager == null)
        {
            Debug.LogError("ShopUI: ShopManager.Instance is null!");
            return;
        }

        gameObject.SetActive(true);

        if (shopTitleText != null)
        {
            shopTitleText.text = shopName;
        }

        // ::invocation📣:switch.to_buy_tab() -> default_view
        SwitchTab(ShopTab.Buy);
    }

    /// <summary>
    /// ::transmutation🔄:switch.shop_tab(tab) -> view_change
    /// Switch between Buy and Sell tabs
    /// </summary>
    /// <param name="tab">Target tab to switch to</param>
    private void SwitchTab(ShopTab tab)
    {
        currentTab = tab;

        // ::cantrip🔧:toggle.panel_visibility() -> active_panel
        if (buyPanel != null)
        {
            buyPanel.SetActive(tab == ShopTab.Buy);
        }

        if (sellPanel != null)
        {
            sellPanel.SetActive(tab == ShopTab.Sell);
        }

        // ::transmutation🔄:update.tab_button_visuals() -> active_indicator
        if (buyTabButton != null)
        {
            var buyButtonImage = buyTabButton.GetComponent<Image>();
            if (buyButtonImage != null)
            {
                buyButtonImage.color = (tab == ShopTab.Buy) ? Color.yellow : Color.white;
            }
        }

        if (sellTabButton != null)
        {
            var sellButtonImage = sellTabButton.GetComponent<Image>();
            if (sellButtonImage != null)
            {
                sellButtonImage.color = (tab == ShopTab.Sell) ? Color.yellow : Color.white;
            }
        }

        // ::invocation📣:refresh.active_panel() -> updated_content
        if (tab == ShopTab.Buy)
        {
            RefreshBuyPanel();
        }
        else
        {
            RefreshSellPanel();
        }
    }

    /// <summary>
    /// ::transmutation🔄:refresh.buy_panel() -> shop_inventory
    /// Update buy panel with current shop items and prices
    /// </summary>
    private void RefreshBuyPanel()
    {
        if (shopManager == null || shopItemsContainer == null) return;

        // ::cantrip🔧:clear.existing_items() -> empty_container
        foreach (Transform child in shopItemsContainer)
        {
            Destroy(child.gameObject);
        }

        // ::divination🔮:query.shop_inventory() -> available_items
        currentShopItems = shopManager.GetShopInventory();

        if (currentShopItems.Count == 0)
        {
            if (buyInstructionText != null)
            {
                buyInstructionText.text = "This shop has no items for sale.";
            }
            return;
        }

        if (buyInstructionText != null)
        {
            buyInstructionText.text = "Click an item to purchase it.";
        }

        // ::transmutation🔄:instantiate.shop_items() -> populated_list
        foreach (var shopItem in currentShopItems)
        {
            if (shopItem.stock <= 0) continue;

            GameObject itemObj = Instantiate(shopItemPrefab, shopItemsContainer);
            ShopItemUI itemUI = itemObj.GetComponent<ShopItemUI>();

            if (itemUI == null)
            {
                itemUI = itemObj.AddComponent<ShopItemUI>();
            }

            // ::invocation📣:initialize.shop_item_ui(item, price) -> configured_display
            int dynamicPrice = shopManager.GetDynamicPrice(shopItem.itemData);
            bool canAfford = currencyManager != null && currencyManager.GetCoins() >= dynamicPrice;

            itemUI.Initialize(
                shopItem.itemData,
                dynamicPrice,
                shopItem.stock,
                canAfford,
                () => OnBuyItemClicked(shopItem.itemData, dynamicPrice)
            );
        }
    }

    /// <summary>
    /// ::transmutation🔄:refresh.sell_panel() -> player_inventory
    /// Update sell panel with player's sellable items
    /// </summary>
    private void RefreshSellPanel()
    {
        if (inventoryManager == null || sellItemsContainer == null) return;

        // ::cantrip🔧:clear.existing_items() -> empty_container
        foreach (Transform child in sellItemsContainer)
        {
            Destroy(child.gameObject);
        }

        // ::divination🔮:query.player_inventory() -> sellable_items
        var allItems = inventoryManager.GetAllItems();

        if (allItems.Count == 0)
        {
            if (sellInstructionText != null)
            {
                sellInstructionText.text = "Your inventory is empty.";
            }
            return;
        }

        if (sellInstructionText != null)
        {
            sellInstructionText.text = "Click an item to sell it.";
        }

        // ::transmutation🔄:instantiate.sellable_items() -> populated_list
        foreach (var kvp in allItems)
        {
            ItemInstance item = kvp.Value;

            GameObject itemObj = Instantiate(shopItemPrefab, sellItemsContainer);
            ShopItemUI itemUI = itemObj.GetComponent<ShopItemUI>();

            if (itemUI == null)
            {
                itemUI = itemObj.AddComponent<ShopItemUI>();
            }

            // ::invocation📣:calculate.sell_price() -> merchant_offer
            int sellPrice = shopManager.GetSellPrice(item.itemData);

            itemUI.Initialize(
                item.itemData,
                sellPrice,
                item.stackSize,
                true, // Always can "afford" to sell
                () => OnSellItemClicked(item, sellPrice)
            );
        }
    }

    /// <summary>
    /// ::invocation📣:handle.buy_item_clicked(item, price) -> purchase_attempt
    /// Handle when player clicks to buy an item
    /// </summary>
    /// <param name="itemData">Item to purchase</param>
    /// <param name="price">Current price of item</param>
    private void OnBuyItemClicked(ItemData itemData, int price)
    {
        // ::warding🛡️:validate.can_afford() -> purchase_eligibility
        if (currencyManager == null || currencyManager.GetCoins() < price)
        {
            Debug.Log("ShopUI: Cannot afford item!");
            return;
        }

        // ::invocation📣:show.confirmation_dialog() -> transaction_verification
        pendingTransactionItem = new ItemInstance(itemData, 1);
        pendingTransactionPrice = price;
        isPurchaseMode = true;

        ShowConfirmationDialog(
            $"Buy {itemData.itemName} for {price} coins?",
            true
        );
    }

    /// <summary>
    /// ::invocation📣:handle.sell_item_clicked(item, price) -> sell_attempt
    /// Handle when player clicks to sell an item
    /// </summary>
    /// <param name="item">Item to sell</param>
    /// <param name="price">Sell price offered</param>
    private void OnSellItemClicked(ItemInstance item, int price)
    {
        // ::invocation📣:show.confirmation_dialog() -> transaction_verification
        pendingTransactionItem = item;
        pendingTransactionPrice = price;
        isPurchaseMode = false;

        ShowConfirmationDialog(
            $"Sell {item.itemData.itemName} for {price} coins?",
            false
        );
    }

    /// <summary>
    /// ::invocation📣:display.confirmation_dialog(message, is_purchase) -> modal_prompt
    /// Show confirmation dialog for transaction
    /// </summary>
    /// <param name="message">Confirmation message</param>
    /// <param name="isPurchase">True if buying, false if selling</param>
    private void ShowConfirmationDialog(string message, bool isPurchase)
    {
        if (confirmationDialog == null) return;

        confirmationDialog.SetActive(true);

        if (confirmationText != null)
        {
            confirmationText.text = message;
        }
    }

    /// <summary>
    /// ::invocation📣:confirm.transaction() -> execute_trade
    /// Execute confirmed transaction
    /// </summary>
    private void OnConfirmTransaction()
    {
        if (confirmationDialog != null)
        {
            confirmationDialog.SetActive(false);
        }

        if (pendingTransactionItem == null) return;

        if (isPurchaseMode)
        {
            // ::transmutation🔄:execute.purchase() -> item_acquired
            bool success = shopManager.BuyItem(pendingTransactionItem.itemData);

            if (success)
            {
                Debug.Log($"ShopUI: Purchased {pendingTransactionItem.itemData.itemName} for {pendingTransactionPrice} coins");
                RefreshBuyPanel();
            }
            else
            {
                Debug.LogWarning($"ShopUI: Failed to purchase {pendingTransactionItem.itemData.itemName}");
            }
        }
        else
        {
            // ::transmutation🔄:execute.sale() -> coins_acquired
            bool success = shopManager.SellItem(pendingTransactionItem.itemData);

            if (success)
            {
                Debug.Log($"ShopUI: Sold {pendingTransactionItem.itemData.itemName} for {pendingTransactionPrice} coins");
                RefreshSellPanel();
            }
            else
            {
                Debug.LogWarning($"ShopUI: Failed to sell {pendingTransactionItem.itemData.itemName}");
            }
        }

        // ::cantrip🔧:clear.pending_transaction() -> clean_state
        pendingTransactionItem = null;
        pendingTransactionPrice = 0;
    }

    /// <summary>
    /// ::cantrip🔧:cancel.transaction() -> revert_state
    /// Cancel pending transaction
    /// </summary>
    private void OnCancelTransaction()
    {
        if (confirmationDialog != null)
        {
            confirmationDialog.SetActive(false);
        }

        pendingTransactionItem = null;
        pendingTransactionPrice = 0;
    }

    /// <summary>
    /// ::transmutation🔄:update.currency_display() -> realtime_sync
    /// Update player's coin count display
    /// </summary>
    private void UpdatePlayerCurrencyDisplay()
    {
        if (playerCoinsText != null && currencyManager != null)
        {
            playerCoinsText.text = $"Coins: {currencyManager.GetCoins()}";
        }
    }

    /// <summary>
    /// ::invocation📣:close.shop_interface() -> hide_ui
    /// Close shop UI
    /// </summary>
    private void OnCloseButtonClicked()
    {
        gameObject.SetActive(false);
    }

    /// <summary>
    /// ::divination🔮:debug.shop_state() -> diagnostic_info
    /// Log current shop UI state for debugging
    /// </summary>
    [ContextMenu("Debug Shop State")]
    private void DebugShopState()
    {
        int itemCount = currentShopItems != null ? currentShopItems.Count : 0;
        Debug.Log($"ShopUI State:\n" +
                  $"  Current Tab: {currentTab}\n" +
                  $"  Shop Items: {itemCount}\n" +
                  $"  Pending Transaction: {(pendingTransactionItem != null ? pendingTransactionItem.itemData.itemName : "None")}\n" +
                  $"  Transaction Price: {pendingTransactionPrice}\n" +
                  $"  Is Purchase Mode: {isPurchaseMode}");
    }
}

/// <summary>
/// ::invocation📣:define.shop_item_ui() -> item_display_component
/// School: Invocation - Individual shop item display component
/// 
/// Represents a single item in the shop with icon, name, price, and stock.
/// Handles click events for purchasing/selling.
/// </summary>
public class ShopItemUI : MonoBehaviour
{
    // ::memory📝:cache.ui_components() -> performance
    private Image iconImage;
    private TextMeshProUGUI nameText;
    private TextMeshProUGUI priceText;
    private TextMeshProUGUI stockText;
    private Button itemButton;

    private System.Action onClickCallback;

    /// <summary>
    /// ::initialization🌱:setup.shop_item_ui(item, price, stock, affordable, callback) -> configured_display
    /// Initialize shop item UI with item data
    /// </summary>
    public void Initialize(ItemData itemData, int price, int stock, bool canAfford, System.Action onClick)
    {
        onClickCallback = onClick;

        // ::cantrip🔧:find.ui_components() -> cached_references
        iconImage = transform.Find("Icon")?.GetComponent<Image>();
        nameText = transform.Find("Name")?.GetComponent<TextMeshProUGUI>();
        priceText = transform.Find("Price")?.GetComponent<TextMeshProUGUI>();
        stockText = transform.Find("Stock")?.GetComponent<TextMeshProUGUI>();
        itemButton = GetComponent<Button>();

        // ::transmutation🔄:populate.item_display() -> visual_update
        if (iconImage != null && itemData.icon != null)
        {
            iconImage.sprite = itemData.icon;
        }

        if (nameText != null)
        {
            nameText.text = itemData.itemName;
        }

        if (priceText != null)
        {
            priceText.text = $"{price} coins";
            priceText.color = canAfford ? Color.white : Color.red;
        }

        if (stockText != null)
        {
            stockText.text = $"Stock: {stock}";
        }

        // ::invocation📣:setup.click_handler() -> interactive_button
        if (itemButton != null)
        {
            itemButton.onClick.AddListener(OnItemClicked);
            itemButton.interactable = canAfford && stock > 0;
        }
    }

    /// <summary>
    /// ::invocation📣:handle.item_clicked() -> callback_execution
    /// Handle when this item is clicked
    /// </summary>
    private void OnItemClicked()
    {
        onClickCallback?.Invoke();
    }
}
