# CatGirl Unity System - API Reference

**Version**: 1.0.0  
**Unity Version**: 2022.3 LTS+  
**Namespace**: `CatGirlSystem`  
**Status**: Production-Ready

---

## Table of Contents

1. [Currency System](#1-currency-system)
2. [Inventory System](#2-inventory-system)
3. [Shop System](#3-shop-system)
4. [Auction House](#4-auction-house)
5. [Gambling System](#5-gambling-system)
6. [Crafting System](#6-crafting-system)
7. [Quest System](#7-quest-system)
8. [Tech Tree System](#8-tech-tree-system)
9. [Data Structures](#9-data-structures)
10. [Events](#10-events)

---

## 1. Currency System

**Namespace**: `CatGirlSystem.Economy`  
**Script**: `Scripts/Economy/CurrencyManager.cs` (286 lines)  
**Pattern**: Singleton MonoBehaviour

### CurrencyManager

Main currency management system supporting coins and premium gems.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `Instance` | `CurrencyManager` | `public static` | Singleton instance |
| `currentCoins` | `int` | `public` | Current coin balance |
| `currentGems` | `int` | `public` | Current gem balance (premium currency) |

#### Methods

##### `SpendCoins(int amount) : bool`

Attempts to spend coins from player's balance.

```csharp
public bool SpendCoins(int amount)
```

**Parameters**:
- `amount` (int): Number of coins to spend (must be positive)

**Returns**: `true` if transaction succeeded, `false` if insufficient funds

**Example**:
```csharp
if (CurrencyManager.Instance.SpendCoins(100)) {
    Debug.Log("Purchase successful!");
} else {
    Debug.Log("Not enough coins!");
}
```

---

##### `AddCoins(int amount) : void`

Adds coins to player's balance.

```csharp
public void AddCoins(int amount)
```

**Parameters**:
- `amount` (int): Number of coins to add (negative values clamped to 0)

**Events**: Fires `OnCoinsChanged` with new total

**Example**:
```csharp
CurrencyManager.Instance.AddCoins(500); // Award quest reward
```

---

##### `SpendGems(int amount) : bool`

Attempts to spend premium gems.

```csharp
public bool SpendGems(int amount)
```

**Parameters**:
- `amount` (int): Number of gems to spend

**Returns**: `true` if transaction succeeded, `false` if insufficient gems

**Example**:
```csharp
if (CurrencyManager.Instance.SpendGems(10)) {
    UnlockPremiumFeature();
}
```

---

##### `AddGems(int amount) : void`

Adds gems to player's balance (typically from IAP or daily rewards).

```csharp
public void AddGems(int amount)
```

**Parameters**:
- `amount` (int): Number of gems to add

**Events**: Fires `OnGemsChanged` with new total

---

##### `CanAfford(int coinCost, int gemCost = 0) : bool`

Checks if player can afford a purchase with coin and/or gem cost.

```csharp
public bool CanAfford(int coinCost, int gemCost = 0)
```

**Parameters**:
- `coinCost` (int): Required coins
- `gemCost` (int): Required gems (optional, default 0)

**Returns**: `true` if player has sufficient currency for both costs

**Example**:
```csharp
if (CurrencyManager.Instance.CanAfford(500, 10)) {
    PurchasePremiumItem();
}
```

---

##### `GetCoins() : int`

Returns current coin balance.

```csharp
public int GetCoins()
```

**Returns**: Current coins

---

##### `GetGems() : int`

Returns current gem balance.

```csharp
public int GetGems()
```

**Returns**: Current gems

---

##### `ResetCurrency() : void`

Resets currency to default values (for testing/debugging).

```csharp
public void ResetCurrency()
```

**Warning**: Use only for testing. Clears PlayerPrefs.

---

### Events

#### `OnCoinsChanged : UnityEvent<int>`

Fired whenever coin balance changes.

**Parameters**: `int newBalance`

**Example**:
```csharp
void Start() {
    CurrencyManager.Instance.OnCoinsChanged.AddListener(UpdateCoinUI);
}

void UpdateCoinUI(int newCoins) {
    coinText.text = $"Coins: {newCoins}";
}
```

---

#### `OnGemsChanged : UnityEvent<int>`

Fired whenever gem balance changes.

**Parameters**: `int newBalance`

---

## 2. Inventory System

**Namespace**: `CatGirlSystem.Inventory`  
**Script**: `Scripts/Inventory/InventoryManager.cs` (295 lines)  
**Pattern**: Singleton MonoBehaviour

### InventoryManager

Grid-based inventory system with Diablo-style item placement.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `Instance` | `InventoryManager` | `public static` | Singleton instance |
| `gridWidth` | `int` | `public` | Inventory grid width (default: 10) |
| `gridHeight` | `int` | `public` | Inventory grid height (default: 8) |

#### Methods

##### `AddItem(ItemData itemData, int quantity = 1) : bool`

Adds an item to inventory, stacking if possible.

```csharp
public bool AddItem(ItemData itemData, int quantity = 1)
```

**Parameters**:
- `itemData` (`ItemData`): Item ScriptableObject to add
- `quantity` (int): Number of items (default: 1)

**Returns**: `true` if item was successfully added, `false` if inventory full

**Example**:
```csharp
ItemData healthPotion = Resources.Load<ItemData>("Items/HealthPotion");
if (InventoryManager.Instance.AddItem(healthPotion, 5)) {
    Debug.Log("Added 5 health potions");
}
```

---

##### `RemoveItem(string itemID, int quantity = 1) : bool`

Removes specified quantity of an item from inventory.

```csharp
public bool RemoveItem(string itemID, int quantity = 1)
```

**Parameters**:
- `itemID` (string): Unique item identifier
- `quantity` (int): Number to remove (default: 1)

**Returns**: `true` if removal succeeded, `false` if insufficient quantity

**Example**:
```csharp
// Consume crafting materials
if (InventoryManager.Instance.RemoveItem("iron_ore", 3)) {
    CraftIronSword();
}
```

---

##### `HasItem(string itemID) : bool`

Checks if player has at least one of the specified item.

```csharp
public bool HasItem(string itemID)
```

**Parameters**:
- `itemID` (string): Item identifier to check

**Returns**: `true` if player has item

**Example**:
```csharp
if (InventoryManager.Instance.HasItem("quest_key")) {
    UnlockDoor();
}
```

---

##### `GetItemCount(string itemID) : int`

Returns total quantity of an item in inventory.

```csharp
public int GetItemCount(string itemID)
```

**Parameters**:
- `itemID` (string): Item identifier

**Returns**: Total quantity (0 if not found)

**Example**:
```csharp
int potionCount = InventoryManager.Instance.GetItemCount("health_potion");
healthPotionText.text = $"Potions: {potionCount}";
```

---

##### `CanPlaceItemAt(ItemInstance item, int x, int y) : bool`

Checks if an item can be placed at specified grid coordinates.

```csharp
public bool CanPlaceItemAt(ItemInstance item, int x, int y)
```

**Parameters**:
- `item` (`ItemInstance`): Item to check placement for
- `x` (int): Grid X coordinate
- `y` (int): Grid Y coordinate

**Returns**: `true` if space is available for item's width/height

**Use Case**: Drag-and-drop inventory UI validation

---

### ItemInstance

Individual item instance with unique properties.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `instanceID` | `string` | `public` | Unique instance identifier (GUID) |
| `itemData` | `ItemData` | `public` | Reference to item's ScriptableObject |
| `stackSize` | `int` | `public` | Current stack size |
| `currentDurability` | `int` | `public` | Current durability (for equipment) |
| `isEquipped` | `bool` | `public` | Whether item is currently equipped |
| `enchantments` | `List<EnchantmentData>` | `public` | Applied enchantments |

#### Methods

##### `DamageDurability(int amount) : void`

Reduces item durability (for weapons/armor).

```csharp
public void DamageDurability(int amount)
```

**Parameters**:
- `amount` (int): Durability damage

**Example**:
```csharp
// After combat
equippedSword.DamageDurability(5);
if (equippedSword.currentDurability <= 0) {
    BreakWeapon();
}
```

---

##### `Repair(int amount) : void`

Restores item durability (clamped to maxDurability).

```csharp
public void Repair(int amount)
```

**Parameters**:
- `amount` (int): Durability restored

---

##### `AddEnchantment(EnchantmentData enchantment) : void`

Applies an enchantment to the item.

```csharp
public void AddEnchantment(EnchantmentData enchantment)
```

**Parameters**:
- `enchantment` (`EnchantmentData`): Enchantment to apply

**Note**: Limits to 3 enchantments per item

---

##### `CanStackWith(ItemInstance other) : bool`

Checks if two item instances can stack together.

```csharp
public bool CanStackWith(ItemInstance other)
```

**Parameters**:
- `other` (`ItemInstance`): Item to check stacking with

**Returns**: `true` if items can stack (same itemID, unenchanted, etc.)

---

## 3. Shop System

**Namespace**: `CatGirlSystem.Economy`  
**Script**: `Scripts/Shop/ShopManager.cs` (320 lines)  
**Pattern**: Singleton MonoBehaviour

### ShopManager

NPC shop system with dynamic pricing and stock management.

#### Methods

##### `PurchaseItem(ShopItem shopItem, int quantity = 1) : bool`

Purchases item from shop.

```csharp
public bool PurchaseItem(ShopItem shopItem, int quantity = 1)
```

**Parameters**:
- `shopItem` (`ShopItem`): Shop item to purchase
- `quantity` (int): Quantity to buy (default: 1)

**Returns**: `true` if purchase succeeded

**Validation**:
- Checks currency (coins/gems)
- Validates stock availability
- Checks inventory space

**Example**:
```csharp
ShopItem ironSwordShopItem = FindShopItem("iron_sword");
if (ShopManager.Instance.PurchaseItem(ironSwordShopItem, 1)) {
    Debug.Log("Iron Sword purchased!");
}
```

---

##### `SellItem(ItemData itemData, int quantity = 1) : bool`

Sells item to shop for 70% of base value.

```csharp
public bool SellItem(ItemData itemData, int quantity = 1)
```

**Parameters**:
- `itemData` (`ItemData`): Item to sell
- `quantity` (int): Quantity to sell

**Returns**: `true` if sale succeeded

**Note**: Sell price is always 70% of `itemData.baseValue`

**Example**:
```csharp
if (ShopManager.Instance.SellItem(oldArmor, 1)) {
    Debug.Log($"Sold for {ShopManager.Instance.GetSellPrice(oldArmor)} coins");
}
```

---

##### `IsInStock(ShopItem shopItem, int quantity = 1) : bool`

Checks if shop has sufficient stock.

```csharp
public bool IsInStock(ShopItem shopItem, int quantity = 1)
```

**Parameters**:
- `shopItem` (`ShopItem`): Item to check
- `quantity` (int): Required quantity

**Returns**: `true` if stock available (`stock == -1` means infinite)

---

##### `RefreshInventory() : void`

Refreshes shop inventory (restocks items, applies price fluctuation).

```csharp
public void RefreshInventory()
```

**Use Case**: Call daily or after fast travel

**Example**:
```csharp
// Refresh shop every in-game day
ShopManager.Instance.RefreshInventory();
```

---

##### `GetSellPrice(ItemData itemData) : int`

Calculates sell price for an item (70% of base value).

```csharp
public int GetSellPrice(ItemData itemData)
```

**Parameters**:
- `itemData` (`ItemData`): Item to price

**Returns**: Sell price in coins

---

### ShopItem

Shop-specific item configuration.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `itemData` | `ItemData` | `public` | Reference to item |
| `basePrice` | `int` | `public` | Base price (before fluctuation) |
| `price` | `int` | `public` | Current price (after fluctuation) |
| `stock` | `int` | `public` | Current stock (-1 = infinite) |
| `maxStock` | `int` | `public` | Maximum stock (for restocking) |
| `allowPriceFluctuation` | `bool` | `public` | Whether price changes on refresh |

---

## 4. Auction House

**Namespace**: `CatGirlSystem.Economy`  
**Script**: `Scripts/Auction/AuctionHouseManager.cs` (420 lines)  
**Pattern**: Singleton MonoBehaviour

### AuctionHouseManager

Player-to-player trading with timed auctions and bidding.

#### Methods

##### `CreateListing(ItemInstance item, int startingBid, int buyoutPrice, int durationHours) : bool`

Creates a new auction listing.

```csharp
public bool CreateListing(ItemInstance item, int startingBid, int buyoutPrice, int durationHours)
```

**Parameters**:
- `item` (`ItemInstance`): Item to auction
- `startingBid` (int): Minimum starting bid
- `buyoutPrice` (int): Instant buyout price (0 = no buyout)
- `durationHours` (int): Auction duration (1-24 hours)

**Returns**: `true` if listing created

**Fees**:
- Listing fee: 10 coins (paid upfront)
- Auction tax: 5% of final sale price (deducted from seller payout)

**Limits**: Maximum 10 active listings per player

**Example**:
```csharp
ItemInstance rareArmor = GetItemFromInventory("legendary_plate");
if (AuctionHouseManager.Instance.CreateListing(rareArmor, 1000, 2000, 24)) {
    Debug.Log("Auction created! Expires in 24 hours.");
}
```

---

##### `PlaceBid(string listingID, int bidAmount) : bool`

Places a bid on an active auction.

```csharp
public bool PlaceBid(string listingID, int bidAmount)
```

**Parameters**:
- `listingID` (string): Auction listing ID
- `bidAmount` (int): Bid amount (must exceed current bid)

**Returns**: `true` if bid placed

**Automatic Refunds**: Previous highest bidder is immediately refunded

**Example**:
```csharp
if (AuctionHouseManager.Instance.PlaceBid("listing-12345", 1500)) {
    Debug.Log("Bid placed! You're now the highest bidder.");
}
```

---

##### `BuyoutAuction(string listingID) : bool`

Instantly purchases an auction at buyout price.

```csharp
public bool BuyoutAuction(string listingID)
```

**Parameters**:
- `listingID` (string): Auction listing ID

**Returns**: `true` if buyout succeeded

**Validation**:
- Checks buyout price is set (> 0)
- Validates currency
- Refunds any existing bidders

**Example**:
```csharp
if (AuctionHouseManager.Instance.BuyoutAuction("listing-67890")) {
    Debug.Log("Instant purchase successful!");
}
```

---

##### `CancelListing(string listingID) : bool`

Cancels an auction (only if no bids placed).

```csharp
public bool CancelListing(string listingID)
```

**Parameters**:
- `listingID` (string): Auction listing ID

**Returns**: `true` if cancellation succeeded

**Restriction**: Cannot cancel auctions with active bids

**Note**: Listing fee (10 coins) is NOT refunded

---

### AuctionListing

Represents an active auction listing.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `listingID` | `string` | `public` | Unique listing identifier |
| `sellerID` | `string` | `public` | Seller's player ID |
| `itemInstance` | `ItemInstance` | `public` | Item being auctioned |
| `startingBid` | `int` | `public` | Minimum bid |
| `buyoutPrice` | `int` | `public` | Instant buyout price (0 = disabled) |
| `currentBid` | `int` | `public` | Current highest bid |
| `currentBidderID` | `string` | `public` | Current highest bidder ID |
| `expirationTime` | `float` | `public` | Unity Time.time when auction expires |
| `isActive` | `bool` | `public` | Whether auction is still active |

#### Computed Properties

| Property | Description |
|----------|-------------|
| `HasBids` | `true` if any bids have been placed |

---

## 5. Gambling System

**Namespace**: `CatGirlSystem.Economy`  
**Script**: `Scripts/Gambling/SlotMachineManager.cs` (380 lines)  
**Pattern**: Singleton MonoBehaviour

### SlotMachineManager

Gacha/slot machine system with weighted loot tables and pity mechanics.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `totalSpins` | `int` | `public` | Total spins performed |
| `spinsSinceLastRare` | `int` | `public` | Spins since last rare+ drop (pity counter) |

#### Methods

##### `Spin() : ItemData`

Performs a single spin (50 coins).

```csharp
public ItemData Spin()
```

**Cost**: 50 coins

**Returns**: `ItemData` of won item (or `null` if insufficient funds)

**Rarity Weights**:
- Common: 70%
- Rare: 20%
- Epic: 8%
- Legendary: 2%

**Pity System**: Guaranteed rare+ after 90 spins

**Example**:
```csharp
ItemData reward = SlotMachineManager.Instance.Spin();
if (reward != null) {
    Debug.Log($"You won: {reward.itemName}!");
    DisplayRewardAnimation(reward);
}
```

---

##### `SpinPremium() : List<ItemData>`

Performs 10 spins (100 coins, 10th guaranteed rare+).

```csharp
public List<ItemData> SpinPremium()
```

**Cost**: 100 coins (20% discount vs 10 single spins)

**Returns**: `List<ItemData>` of 10 won items

**Guarantee**: 10th pull is always Rare or better

**Example**:
```csharp
List<ItemData> rewards = SlotMachineManager.Instance.SpinPremium();
if (rewards != null) {
    foreach (ItemData reward in rewards) {
        InventoryManager.Instance.AddItem(reward, 1);
    }
    Display10PullResults(rewards);
}
```

---

##### `GetTotalValueWon() : int`

Calculates total value of all items won.

```csharp
public int GetTotalValueWon()
```

**Returns**: Sum of `baseValue` for all won items

**Use Case**: Statistics tracking, achievements

---

##### `ResetPity() : void`

Resets pity counter to 0 (for testing).

```csharp
public void ResetPity()
```

**Warning**: Use only for debugging

---

## 6. Crafting System

**Namespace**: `CatGirlSystem.Crafting`  
**Script**: `Scripts/Crafting/CraftingManager.cs` (271 lines)  
**Pattern**: Singleton MonoBehaviour

### CraftingManager

Grid-based crafting system similar to Minecraft.

#### Methods

##### `AttemptCraft() : bool`

Attempts to craft using current crafting grid contents.

```csharp
public bool AttemptCraft()
```

**Returns**: `true` if crafting succeeded

**Validation**:
- Matches grid against all known recipes
- Checks material availability
- Validates crafting level

**Example**:
```csharp
// Player arranged materials in crafting grid
if (CraftingManager.Instance.AttemptCraft()) {
    Debug.Log("Crafting successful!");
} else {
    Debug.Log("Invalid recipe or missing materials");
}
```

---

##### `SetCraftingSlot(int slotIndex, string itemID) : void`

Sets a specific crafting grid slot.

```csharp
public void SetCraftingSlot(int slotIndex, string itemID)
```

**Parameters**:
- `slotIndex` (int): Slot index (0-8 for 3x3 grid)
- `itemID` (string): Item ID to place (`null` or empty string clears slot)

**Example**:
```csharp
// Iron Sword Recipe: 
// [ ][ ][iron]
// [ ][iron][ ]
// [stick][ ][ ]
CraftingManager.Instance.SetCraftingSlot(2, "iron_ingot");
CraftingManager.Instance.SetCraftingSlot(4, "iron_ingot");
CraftingManager.Instance.SetCraftingSlot(6, "wooden_stick");
CraftingManager.Instance.AttemptCraft();
```

---

##### `ClearCraftingGrid() : void`

Clears all crafting grid slots.

```csharp
public void ClearCraftingGrid()
```

**Use Case**: Reset UI after successful craft

---

##### `UnlockRecipe(CraftRecipe recipe) : void`

Unlocks a previously locked recipe.

```csharp
public void UnlockRecipe(CraftRecipe recipe)
```

**Parameters**:
- `recipe` (`CraftRecipe`): Recipe to unlock

**Use Case**: Quest rewards, tech tree unlocks

---

### CraftRecipe

ScriptableObject defining a crafting recipe.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `recipeID` | `string` | `public` | Unique recipe identifier |
| `recipeName` | `string` | `public` | Display name |
| `description` | `string` | `public` | Recipe description |
| `requiredItems` | `string[]` | `public` | 9-element array (3x3 grid) of item IDs |
| `isOrdered` | `bool` | `public` | If false, ingredients can be in any position |
| `resultItem` | `ItemData` | `public` | Crafted result |
| `resultQuantity` | `int` | `public` | Number of items produced |
| `requiredCraftingLevel` | `int` | `public` | Minimum crafting level |
| `isLocked` | `bool` | `public` | Whether recipe is initially locked |

---

## 7. Quest System

**Namespace**: `CatGirlSystem.Quest`  
**Script**: `Scripts/Quest/QuestManager.cs` (362 lines)  
**Pattern**: Singleton MonoBehaviour

### QuestManager

Dynamic quest system with objectives, rewards, and chains.

#### Methods

##### `StartQuest(QuestData questData) : bool`

Starts a new quest.

```csharp
public bool StartQuest(QuestData questData)
```

**Parameters**:
- `questData` (`QuestData`): Quest ScriptableObject

**Returns**: `true` if quest started

**Validation**:
- Checks player level requirement
- Validates prerequisites completed
- Ensures quest not already active/completed

**Example**:
```csharp
QuestData tutorialQuest = Resources.Load<QuestData>("Quests/Tutorial_01");
if (QuestManager.Instance.StartQuest(tutorialQuest)) {
    DisplayQuestNotification(tutorialQuest);
}
```

---

##### `UpdateObjective(string questID, int objectiveIndex, int progress = 1) : void`

Updates progress on a specific quest objective.

```csharp
public void UpdateObjective(string questID, int objectiveIndex, int progress = 1)
```

**Parameters**:
- `questID` (string): Quest identifier
- `objectiveIndex` (int): Objective index (0-based)
- `progress` (int): Amount to increment (default: 1)

**Example**:
```csharp
// Player kills a slime
QuestManager.Instance.UpdateObjective("quest_slime_hunter", 0, 1);
```

---

##### `CompleteQuest(string questID) : void`

Marks quest as complete and grants rewards.

```csharp
public void CompleteQuest(string questID)
```

**Parameters**:
- `questID` (string): Quest identifier

**Rewards**:
- Awards coins, experience, items
- Fires `OnQuestCompleted` event
- Unlocks prerequisite quests

**Example**:
```csharp
if (AllObjectivesComplete("quest_tutorial_01")) {
    QuestManager.Instance.CompleteQuest("quest_tutorial_01");
}
```

---

##### `IsQuestActive(string questID) : bool`

Checks if quest is currently active.

```csharp
public bool IsQuestActive(string questID)
```

**Parameters**:
- `questID` (string): Quest identifier

**Returns**: `true` if quest is active

---

##### `IsQuestCompleted(string questID) : bool`

Checks if quest has been completed.

```csharp
public bool IsQuestCompleted(string questID)
```

**Parameters**:
- `questID` (string): Quest identifier

**Returns**: `true` if quest completed

**Use Case**: Prerequisite checking, quest chain logic

---

### QuestData

ScriptableObject defining a quest.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `questID` | `string` | `public` | Unique quest identifier |
| `questName` | `string` | `public` | Display name |
| `description` | `string` | `public` | Quest description |
| `objectives` | `List<QuestObjective>` | `public` | Quest objectives |
| `rewards` | `List<QuestReward>` | `public` | Quest rewards |
| `requiredLevel` | `int` | `public` | Minimum player level |
| `prerequisiteQuests` | `List<QuestData>` | `public` | Quests that must be completed first |
| `isRepeatable` | `bool` | `public` | Can be repeated |
| `isDaily` | `bool` | `public` | Daily quest (resets daily) |
| `timeLimit` | `int` | `public` | Time limit in seconds (0 = no limit) |

---

### QuestObjective

Individual quest objective.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `description` | `string` | `public` | Objective description (e.g., "Kill 10 Slimes") |
| `targetID` | `string` | `public` | Target entity ID (item, enemy, location) |
| `requiredAmount` | `int` | `public` | Required count |
| `currentProgress` | `int` | `public` | Current progress |

---

## 8. Tech Tree System

**Namespace**: `CatGirlSystem.TechTree`  
**Script**: `Scripts/TechTree/TechTreeManager.cs` (268 lines)  
**Pattern**: Singleton MonoBehaviour

### TechTreeManager

Node-based skill progression with prerequisites and unlocks.

#### Methods

##### `CanUnlock(string techID) : bool`

Checks if a tech node can be unlocked.

```csharp
public bool CanUnlock(string techID)
```

**Parameters**:
- `techID` (string): Tech node identifier

**Returns**: `true` if all prerequisites met and currency available

**Checks**:
- Player level requirement
- Prerequisite nodes unlocked
- Currency (coins/gems)
- Resource requirements

---

##### `UnlockTech(string techID) : bool`

Unlocks a tech node.

```csharp
public bool UnlockTech(string techID)
```

**Parameters**:
- `techID` (string): Tech node identifier

**Returns**: `true` if unlock succeeded

**Effects**:
- Deducts currency/resources
- Applies stat bonuses
- Unlocks recipes/features
- Fires `OnTechUnlocked` event

**Example**:
```csharp
if (TechTreeManager.Instance.UnlockTech("combat_mastery_1")) {
    Debug.Log("Combat Mastery unlocked! +10% damage");
}
```

---

##### `IsUnlocked(string techID) : bool`

Checks if a tech node is unlocked.

```csharp
public bool IsUnlocked(string techID)
```

**Parameters**:
- `techID` (string): Tech node identifier

**Returns**: `true` if unlocked

---

##### `GetTech(string techID) : TechNode`

Retrieves a tech node by ID.

```csharp
public TechNode GetTech(string techID)
```

**Parameters**:
- `techID` (string): Tech node identifier

**Returns**: `TechNode` ScriptableObject (or `null` if not found)

---

##### `ResetTechTree() : void`

Resets all unlocked tech nodes (refunds 50% of costs).

```csharp
public void ResetTechTree()
```

**Warning**: Use for respec mechanics only

---

### TechNode

ScriptableObject defining a tech tree node.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `techID` | `string` | `public` | Unique tech identifier |
| `techName` | `string` | `public` | Display name |
| `description` | `string` | `public` | Node description |
| `icon` | `Sprite` | `public` | Node icon |
| `requiredLevel` | `int` | `public` | Minimum player level |
| `coinCost` | `int` | `public` | Unlock cost (coins) |
| `gemCost` | `int` | `public` | Unlock cost (gems) |
| `prerequisites` | `List<TechNode>` | `public` | Required previous nodes |
| `resourceRequirements` | `List<ResourceRequirement>` | `public` | Required items |
| `statBonuses` | `List<StatBonus>` | `public` | Applied stat modifiers |
| `unlocksRecipes` | `List<CraftRecipe>` | `public` | Recipes unlocked |

---

## 9. Data Structures

### ItemData

ScriptableObject representing an item template.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `itemID` | `string` | `public` | Unique item identifier |
| `itemName` | `string` | `public` | Display name |
| `description` | `string` | `public` | Item description |
| `icon` | `Sprite` | `public` | Item icon |
| `width` | `int` | `public` | Grid width (1-4) |
| `height` | `int` | `public` | Grid height (1-4) |
| `maxStack` | `int` | `public` | Maximum stack size |
| `baseValue` | `int` | `public` | Base monetary value |
| `maxDurability` | `int` | `public` | Maximum durability (0 = non-degradable) |
| `attackPower` | `int` | `public` | Attack stat bonus |
| `defense` | `int` | `public` | Defense stat bonus |
| `magicResist` | `int` | `public` | Magic resistance bonus |

---

### EnchantmentData

ScriptableObject representing an item enchantment.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `enchantmentID` | `string` | `public` | Unique enchantment identifier |
| `enchantmentName` | `string` | `public` | Display name (e.g., "Fire Damage") |
| `description` | `string` | `public` | Enchantment description |
| `icon` | `Sprite` | `public` | Enchantment icon |
| `attackBonus` | `int` | `public` | Flat attack bonus |
| `defenseBonus` | `int` | `public` | Flat defense bonus |
| `magicBonus` | `int` | `public` | Flat magic bonus |
| `critChanceBonus` | `float` | `public` | Critical chance % bonus |

---

### ResourceRequirement

Represents an item requirement (for crafting, tech unlocks, etc.).

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `itemID` | `string` | `public` | Required item ID |
| `amount` | `int` | `public` | Required quantity |

---

### StatBonus

Represents a stat modifier from tech tree nodes.

#### Properties

| Property | Type | Access | Description |
|----------|------|--------|-------------|
| `statName` | `string` | `public` | Stat name (e.g., "attack", "defense") |
| `bonusValue` | `float` | `public` | Bonus value |
| `isPercentage` | `bool` | `public` | If true, bonusValue is percentage (0.1 = +10%) |

---

## 10. Events

All manager systems provide UnityEvents for UI updates and game logic integration.

### Currency Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `OnCoinsChanged` | `int newBalance` | Fired when coin balance changes |
| `OnGemsChanged` | `int newBalance` | Fired when gem balance changes |

---

### Shop Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `OnItemPurchased` | `ItemData item, int quantity` | Fired after successful purchase |
| `OnItemSold` | `ItemData item, int quantity` | Fired after successful sale |
| `OnInventoryRefreshed` | None | Fired when shop restocks |

---

### Auction Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `OnListingCreated` | `AuctionListing listing` | Fired when auction created |
| `OnBidPlaced` | `string listingID, int bidAmount` | Fired when bid placed |
| `OnAuctionCompleted` | `AuctionListing listing` | Fired when auction expires |

---

### Quest Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `OnQuestStarted` | `QuestData quest` | Fired when quest begins |
| `OnQuestCompleted` | `QuestData quest` | Fired when quest completes |
| `OnObjectiveUpdated` | `string questID, int objectiveIndex` | Fired when objective progress changes |

---

### Tech Tree Events

| Event | Parameters | Description |
|-------|------------|-------------|
| `OnTechUnlocked` | `TechNode node` | Fired when tech node unlocked |

---

## Usage Examples

### Example 1: Complete Purchase Flow

```csharp
using CatGirlSystem.Economy;
using CatGirlSystem.Inventory;

public class ShopUI : MonoBehaviour
{
    public void OnBuyButtonClicked(ShopItem item)
    {
        // Check if player can afford
        if (!CurrencyManager.Instance.CanAfford(item.price))
        {
            ShowMessage("Not enough coins!");
            return;
        }

        // Attempt purchase
        if (ShopManager.Instance.PurchaseItem(item, 1))
        {
            ShowMessage($"Purchased {item.itemData.itemName}!");
            UpdateCoinDisplay();
        }
        else
        {
            ShowMessage("Inventory full or item out of stock!");
        }
    }
}
```

---

### Example 2: Quest Objective Integration

```csharp
using CatGirlSystem.Quest;

public class Enemy : MonoBehaviour
{
    public string enemyID = "slime";

    void OnDeath()
    {
        // Update any active quests tracking this enemy type
        QuestManager.Instance.UpdateObjective("quest_slime_hunter", 0, 1);
    }
}
```

---

### Example 3: Crafting UI Integration

```csharp
using CatGirlSystem.Crafting;

public class CraftingUI : MonoBehaviour
{
    public void OnCraftButtonClicked()
    {
        if (CraftingManager.Instance.AttemptCraft())
        {
            ShowSuccessAnimation();
            CraftingManager.Instance.ClearCraftingGrid();
            RefreshInventory();
        }
        else
        {
            ShowErrorMessage("Invalid recipe!");
        }
    }

    public void OnSlotClicked(int slotIndex, ItemData item)
    {
        CraftingManager.Instance.SetCraftingSlot(slotIndex, item?.itemID);
        UpdateGridVisuals();
    }
}
```

---

### Example 4: Tech Tree Progression

```csharp
using CatGirlSystem.TechTree;

public class TechTreeUI : MonoBehaviour
{
    public void OnNodeClicked(string techID)
    {
        if (TechTreeManager.Instance.CanUnlock(techID))
        {
            if (ShowConfirmationDialog($"Unlock {techID}?"))
            {
                if (TechTreeManager.Instance.UnlockTech(techID))
                {
                    ShowSuccessEffect();
                    RefreshTechTree();
                }
            }
        }
        else
        {
            ShowRequirements(techID);
        }
    }
}
```

---

## Notes

- All managers use **Singleton pattern** - access via `ManagerName.Instance`
- All systems persist via **PlayerPrefs** (consider switching to JSON for production)
- Currency transactions are **atomic** - no partial failures
- Grid coordinates are **0-based** with origin at top-left
- All ScriptableObjects should be created via Unity Editor tools (`Assets/Create/CatGirl/...`)

---

## Further Reading

- **[TECHNICAL.md](TECHNICAL.md)** - Complete technical documentation
- **[INTEGRATION.md](INTEGRATION.md)** - Integration guide for existing projects
- **[../README.md](../README.md)** - System overview
- **[../../../infrastructure/languages/codecraft/examples/UNITY_EXAMPLES.md](../../../infrastructure/languages/codecraft/examples/UNITY_EXAMPLES.md)** - CodeCraft integration examples

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-02  
**Author**: VSCode MCP Agent Team

---

**Built with ❤️ for the CatGirl Unity System**
