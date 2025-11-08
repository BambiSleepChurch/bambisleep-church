using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;

/// <summary>
/// ::invocation📣:display.inventory_ui() -> grid_interface
/// School: Invocation - Public interface for inventory grid display
/// 
/// Manages the visual grid-based inventory UI with drag-and-drop support.
/// Dynamically creates item slots and handles item visualization.
/// 
/// Usage:
///   - Attach to UI Canvas panel
///   - Assign slot prefab and grid container
///   - Automatically syncs with InventoryManager
/// </summary>
public class InventoryUI : MonoBehaviour
{
    // ::warding🛡️:protect.ui_references() -> null_safety
    [Header("UI References")]
    [SerializeField] private GameObject slotPrefab;
    [SerializeField] private Transform gridContainer;
    [SerializeField] private TextMeshProUGUI titleText;
    [SerializeField] private Button closeButton;

    [Header("Item Info Panel")]
    [SerializeField] private GameObject itemInfoPanel;
    [SerializeField] private TextMeshProUGUI itemNameText;
    [SerializeField] private TextMeshProUGUI itemDescriptionText;
    [SerializeField] private Image itemIcon;
    [SerializeField] private TextMeshProUGUI itemStatsText;

    // ::cantrip🔧:configure.grid_layout() -> visual_structure
    [Header("Grid Settings")]
    [SerializeField] private int gridWidth = 10;
    [SerializeField] private int gridHeight = 10;
    [SerializeField] private float slotSize = 64f;
    [SerializeField] private float slotSpacing = 4f;

    // ::cantrip🔧:configure.visual_feedback() -> user_experience
    [Header("Visual Settings")]
    [SerializeField] private Color emptySlotColor = new Color(0.2f, 0.2f, 0.2f, 0.5f);
    [SerializeField] private Color occupiedSlotColor = new Color(0.3f, 0.3f, 0.3f, 0.8f);
    [SerializeField] private Color highlightColor = new Color(1f, 1f, 0f, 0.5f);
    [SerializeField] private Color invalidPlacementColor = new Color(1f, 0f, 0f, 0.5f);

    // ::memory📝:track.ui_state() -> slot_management
    private InventorySlot[,] slotGrid;
    private ItemInstance selectedItem;
    private Vector2Int selectedItemPosition;
    private bool isDragging;

    // ::memory📝:cache.manager_reference() -> performance
    private InventoryManager inventoryManager;
    private Canvas parentCanvas;

    /// <summary>
    /// ::initialization🌱:setup.inventory_ui() -> grid_creation
    /// Initialize UI components and create inventory grid
    /// </summary>
    private void Awake()
    {
        // ::warding🛡️:validate.required_references() -> safe_initialization
        ValidateReferences();

        parentCanvas = GetComponentInParent<Canvas>();
        inventoryManager = InventoryManager.Instance;

        // ::invocation📣:create.inventory_grid() -> slot_array
        CreateInventoryGrid();

        // ::invocation📣:setup.event_listeners() -> interactive_ui
        if (closeButton != null)
        {
            closeButton.onClick.AddListener(OnCloseButtonClicked);
        }

        // ::cantrip🔧:initialize.visibility() -> hidden_by_default
        gameObject.SetActive(false);
    }

    /// <summary>
    /// ::invocation📣:subscribe.inventory_events() -> active_monitoring
    /// Subscribe to inventory change events
    /// </summary>
    private void OnEnable()
    {
        if (inventoryManager != null)
        {
            inventoryManager.OnInventoryChanged += RefreshInventoryDisplay;
            RefreshInventoryDisplay();
        }

        // ::cantrip🔧:show.item_info_panel() -> initial_state
        if (itemInfoPanel != null)
        {
            itemInfoPanel.SetActive(false);
        }
    }

    /// <summary>
    /// ::invocation📣:unsubscribe.inventory_events() -> clean_shutdown
    /// Clean up event subscriptions
    /// </summary>
    private void OnDisable()
    {
        if (inventoryManager != null)
        {
            inventoryManager.OnInventoryChanged -= RefreshInventoryDisplay;
        }
    }

    /// <summary>
    /// ::cantrip🔧:validate.ui_references() -> error_reporting
    /// Validate that all required UI references are assigned
    /// </summary>
    private void ValidateReferences()
    {
        if (slotPrefab == null)
        {
            Debug.LogError("InventoryUI: slotPrefab is not assigned!", this);
        }
        if (gridContainer == null)
        {
            Debug.LogError("InventoryUI: gridContainer is not assigned!", this);
        }
        if (titleText != null)
        {
            titleText.text = "Inventory";
        }
    }

    /// <summary>
    /// ::transmutation🔄:create.grid_structure() -> slot_array
    /// Instantiate slot prefabs to create inventory grid
    /// </summary>
    private void CreateInventoryGrid()
    {
        // ::memory📝:allocate.slot_array() -> grid_storage
        slotGrid = new InventorySlot[gridWidth, gridHeight];

        // ::cantrip🔧:configure.grid_layout_component() -> proper_spacing
        GridLayoutGroup gridLayout = gridContainer.GetComponent<GridLayoutGroup>();
        if (gridLayout == null)
        {
            gridLayout = gridContainer.gameObject.AddComponent<GridLayoutGroup>();
        }

        gridLayout.cellSize = new Vector2(slotSize, slotSize);
        gridLayout.spacing = new Vector2(slotSpacing, slotSpacing);
        gridLayout.constraint = GridLayoutGroup.Constraint.FixedColumnCount;
        gridLayout.constraintCount = gridWidth;

        // ::transmutation🔄:instantiate.all_slots() -> complete_grid
        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                GameObject slotObj = Instantiate(slotPrefab, gridContainer);
                InventorySlot slot = slotObj.GetComponent<InventorySlot>();

                if (slot == null)
                {
                    slot = slotObj.AddComponent<InventorySlot>();
                }

                // ::invocation📣:initialize.slot(x, y) -> configured_slot
                slot.Initialize(x, y, this);
                slotGrid[x, y] = slot;

                // ::cantrip🔧:set.slot_appearance() -> visual_state
                Image slotImage = slotObj.GetComponent<Image>();
                if (slotImage != null)
                {
                    slotImage.color = emptySlotColor;
                }
            }
        }

        Debug.Log($"InventoryUI: Created {gridWidth}x{gridHeight} grid with {gridWidth * gridHeight} slots");
    }

    /// <summary>
    /// ::invocation📣:refresh.inventory_display() -> synced_ui
    /// Update all slots to match current inventory state
    /// </summary>
    private void RefreshInventoryDisplay()
    {
        if (inventoryManager == null || slotGrid == null)
        {
            return;
        }

        // ::cantrip🔧:clear.all_slots() -> empty_state
        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                if (slotGrid[x, y] != null)
                {
                    slotGrid[x, y].ClearSlot();
                }
            }
        }

        // ::transmutation🔄:populate.slots_with_items() -> filled_grid
        var items = inventoryManager.GetAllItems();
        foreach (var kvp in items)
        {
            Vector2Int pos = kvp.Key;
            ItemInstance item = kvp.Value;

            if (pos.x >= 0 && pos.x < gridWidth && pos.y >= 0 && pos.y < gridHeight)
            {
                InventorySlot slot = slotGrid[pos.x, pos.y];
                if (slot != null)
                {
                    slot.SetItem(item);
                }
            }
        }
    }

    /// <summary>
    /// ::invocation📣:handle.slot_clicked(slot) -> item_selection
    /// Handle when a slot is clicked by the player
    /// </summary>
    /// <param name="slot">The clicked inventory slot</param>
    public void OnSlotClicked(InventorySlot slot)
    {
        if (slot.HasItem())
        {
            // ::invocation📣:show.item_details() -> info_panel
            ShowItemInfo(slot.GetItem());
            selectedItem = slot.GetItem();
            selectedItemPosition = new Vector2Int(slot.GridX, slot.GridY);
        }
        else
        {
            // ::cantrip🔧:hide.item_info() -> clean_state
            HideItemInfo();
            selectedItem = null;
        }
    }

    /// <summary>
    /// ::invocation📣:handle.slot_drag_start(slot) -> drag_state
    /// Handle when player starts dragging an item
    /// </summary>
    /// <param name="slot">The slot being dragged from</param>
    public void OnSlotDragStart(InventorySlot slot)
    {
        if (slot.HasItem())
        {
            isDragging = true;
            selectedItem = slot.GetItem();
            selectedItemPosition = new Vector2Int(slot.GridX, slot.GridY);

            // ::transmutation🔄:highlight.valid_placements() -> visual_feedback
            HighlightValidPlacements(selectedItem.itemData.width, selectedItem.itemData.height);
        }
    }

    /// <summary>
    /// ::invocation📣:handle.slot_drag_end(slot) -> placement_attempt
    /// Handle when player releases dragged item
    /// </summary>
    /// <param name="targetSlot">The slot where item was dropped</param>
    public void OnSlotDragEnd(InventorySlot targetSlot)
    {
        if (!isDragging || selectedItem == null)
        {
            return;
        }

        isDragging = false;

        Vector2Int targetPos = new Vector2Int(targetSlot.GridX, targetSlot.GridY);

        // ::warding🛡️:validate.placement(target_pos) -> legal_move
        if (inventoryManager.CanPlaceItem(targetPos, selectedItem.itemData.width, selectedItem.itemData.height))
        {
            // ::transmutation🔄:move.item(from, to) -> new_position
            if (inventoryManager.MoveItem(selectedItemPosition, targetPos))
            {
                RefreshInventoryDisplay();
            }
        }

        // ::cantrip🔧:clear.highlights() -> clean_state
        ClearHighlights();
        selectedItem = null;
    }

    /// <summary>
    /// ::transmutation🔄:highlight.placement_options(width, height) -> visual_guide
    /// Highlight slots where item can be placed
    /// </summary>
    /// <param name="itemWidth">Width of item being placed</param>
    /// <param name="itemHeight">Height of item being placed</param>
    private void HighlightValidPlacements(int itemWidth, int itemHeight)
    {
        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                Vector2Int pos = new Vector2Int(x, y);
                bool canPlace = inventoryManager.CanPlaceItem(pos, itemWidth, itemHeight);

                if (slotGrid[x, y] != null)
                {
                    Image slotImage = slotGrid[x, y].GetComponent<Image>();
                    if (slotImage != null)
                    {
                        slotImage.color = canPlace ? highlightColor : invalidPlacementColor;
                    }
                }
            }
        }
    }

    /// <summary>
    /// ::cantrip🔧:clear.slot_highlights() -> default_colors
    /// Remove all slot highlighting
    /// </summary>
    private void ClearHighlights()
    {
        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                if (slotGrid[x, y] != null)
                {
                    Image slotImage = slotGrid[x, y].GetComponent<Image>();
                    if (slotImage != null)
                    {
                        bool hasItem = slotGrid[x, y].HasItem();
                        slotImage.color = hasItem ? occupiedSlotColor : emptySlotColor;
                    }
                }
            }
        }
    }

    /// <summary>
    /// ::invocation📣:display.item_details(item) -> info_panel
    /// Show item information in detail panel
    /// </summary>
    /// <param name="item">Item to display</param>
    private void ShowItemInfo(ItemInstance item)
    {
        if (itemInfoPanel == null) return;

        itemInfoPanel.SetActive(true);

        // ::transmutation🔄:populate.item_details() -> formatted_text
        if (itemNameText != null)
        {
            itemNameText.text = item.itemData.itemName;
        }

        if (itemDescriptionText != null)
        {
            itemDescriptionText.text = item.itemData.description;
        }

        if (itemIcon != null && item.itemData.icon != null)
        {
            itemIcon.sprite = item.itemData.icon;
            itemIcon.enabled = true;
        }

        if (itemStatsText != null)
        {
            // ::transmutation🔄:format.item_statistics() -> readable_stats
            string stats = $"Value: {item.itemData.baseValue} coins\n";
            stats += $"Weight: {item.itemData.weight}kg\n";
            stats += $"Stack: {item.stackSize}/{item.itemData.maxStack}\n";
            stats += $"Size: {item.itemData.width}x{item.itemData.height}\n";

            if (item.durability > 0)
            {
                stats += $"Durability: {item.durability}/{item.maxDurability}\n";
            }

            if (item.enchantments.Count > 0)
            {
                stats += $"Enchantments: {item.enchantments.Count}\n";
            }

            itemStatsText.text = stats;
        }
    }

    /// <summary>
    /// ::cantrip🔧:hide.item_info_panel() -> clean_state
    /// Hide item information panel
    /// </summary>
    private void HideItemInfo()
    {
        if (itemInfoPanel != null)
        {
            itemInfoPanel.SetActive(false);
        }
    }

    /// <summary>
    /// ::invocation📣:handle.close_button() -> hide_inventory
    /// Close inventory UI when close button is clicked
    /// </summary>
    private void OnCloseButtonClicked()
    {
        gameObject.SetActive(false);
    }

    /// <summary>
    /// ::invocation📣:toggle.visibility() -> show_hide
    /// Public method to toggle inventory visibility
    /// </summary>
    public void ToggleInventory()
    {
        gameObject.SetActive(!gameObject.activeSelf);
    }

    /// <summary>
    /// ::divination🔮:debug.inventory_state() -> diagnostic_info
    /// Log current inventory UI state for debugging
    /// </summary>
    [ContextMenu("Debug Inventory State")]
    private void DebugInventoryState()
    {
        int occupiedSlots = 0;
        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                if (slotGrid[x, y] != null && slotGrid[x, y].HasItem())
                {
                    occupiedSlots++;
                }
            }
        }

        Debug.Log($"InventoryUI State:\n" +
                  $"  Grid Size: {gridWidth}x{gridHeight} ({gridWidth * gridHeight} slots)\n" +
                  $"  Occupied Slots: {occupiedSlots}\n" +
                  $"  Is Dragging: {isDragging}\n" +
                  $"  Selected Item: {(selectedItem != null ? selectedItem.itemData.itemName : "None")}");
    }
}

/// <summary>
/// ::invocation📣:define.inventory_slot() -> slot_component
/// School: Invocation - Individual inventory slot component
/// 
/// Represents a single slot in the inventory grid.
/// Handles click and drag events for item interaction.
/// </summary>
public class InventorySlot : MonoBehaviour
{
    // ::memory📝:track.slot_state() -> position_and_item
    private int gridX;
    private int gridY;
    private ItemInstance itemInstance;
    private InventoryUI parentUI;

    // ::memory📝:cache.ui_components() -> performance
    private Image iconImage;
    private TextMeshProUGUI stackText;

    public int GridX => gridX;
    public int GridY => gridY;

    /// <summary>
    /// ::initialization🌱:configure.slot(x, y, parent) -> initialized_slot
    /// Initialize slot with grid position and parent UI
    /// </summary>
    public void Initialize(int x, int y, InventoryUI parent)
    {
        gridX = x;
        gridY = y;
        parentUI = parent;

        // ::cantrip🔧:setup.ui_components() -> cached_references
        Transform iconTransform = transform.Find("Icon");
        if (iconTransform != null)
        {
            iconImage = iconTransform.GetComponent<Image>();
        }

        Transform stackTransform = transform.Find("StackText");
        if (stackTransform != null)
        {
            stackText = stackTransform.GetComponent<TextMeshProUGUI>();
        }
    }

    /// <summary>
    /// ::transmutation🔄:set.slot_item(item) -> visual_update
    /// Set item displayed in this slot
    /// </summary>
    public void SetItem(ItemInstance item)
    {
        itemInstance = item;

        // ::transmutation🔄:update.visual_representation() -> item_display
        if (iconImage != null && item.itemData.icon != null)
        {
            iconImage.sprite = item.itemData.icon;
            iconImage.enabled = true;
        }

        if (stackText != null)
        {
            if (item.stackSize > 1)
            {
                stackText.text = item.stackSize.ToString();
                stackText.enabled = true;
            }
            else
            {
                stackText.enabled = false;
            }
        }
    }

    /// <summary>
    /// ::cantrip🔧:clear.slot_contents() -> empty_state
    /// Remove item from slot
    /// </summary>
    public void ClearSlot()
    {
        itemInstance = null;

        if (iconImage != null)
        {
            iconImage.enabled = false;
        }

        if (stackText != null)
        {
            stackText.enabled = false;
        }
    }

    /// <summary>
    /// ::divination🔮:query.has_item() -> boolean
    /// Check if slot contains an item
    /// </summary>
    public bool HasItem()
    {
        return itemInstance != null;
    }

    /// <summary>
    /// ::divination🔮:query.item_instance() -> item_data
    /// Get item instance stored in slot
    /// </summary>
    public ItemInstance GetItem()
    {
        return itemInstance;
    }
}
