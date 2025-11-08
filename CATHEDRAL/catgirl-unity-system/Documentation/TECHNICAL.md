# CatGirl Avatar Technical Documentation

**Comprehensive Pipeline, Core Systems, and RPG Gameplay Integration**

---

## Table of Contents

1. [Introduction](#introduction)
2. [3D Model Creation and Import Workflow](#section-1-3d-model-creation-and-import-workflow)
3. [Animation Controller Setup](#section-2-animation-controller-setup-and-blend-trees)
4. [Unity Integration](#section-3-unity-integration-prefabs-avatars-materials)
5. [Core Game Mechanics and Economic Systems](#section-4-core-game-mechanics-and-economic-systems)
6. [CatGirl Quest, Reward, and Tech Tree Systems](#section-5-catgirl-quest-reward-goal-and-tech-tree-systems)
7. [In-Game Currency & Economy Management](#section-6-in-game-currency--economy-management)
8. [Diablo-Style Inventory System](#section-7-diablo-style-inventory-system-implementation)
9. [Player Engagement and Retention](#section-8-player-engagement-and-retention-via-catgirl-systems)
10. [System Features Table](#section-9-catgirl-system-features-table)
11. [Best Practices](#best-practices-and-advanced-tips)
12. [Conclusion](#conclusion)

---

## Introduction

Creating an interactive and deeply engaging CatGirl Avatar system in Unity necessitates a fusion of cutting-edge character pipeline techniques and robust, data-driven game system architecture. This documentation delivers a thorough, step-by-step guide for Unity developers, technical artists, and game designers, covering every phase: from 3D character creation/import, rigging, and advanced humanoid animation setups, to the full in-engine implementation of economic, quest, inventory, upgrade, crafting, and progression systems.

### Core Philosophy

The CatGirl system is built on three pillars:

1. **MCP Protocol Layer** - JSON-RPC 2.0, client-server architecture
2. **CodeCraft Semantic Layer** - Ritual syntax, dual-memory commentomancy
3. **RPG Gameplay Layer** - Economy, progression, and engagement systems

### System Requirements

- **Unity Version**: 2022.3 LTS or newer
- **C# Version**: 9.0+ (.NET Standard 2.1)
- **Dependencies**: Unity UI, TextMeshPro (optional), JSON.NET (optional)

---

## Section 1: 3D Model Creation and Import Workflow

### 1.1 Principles of the CatGirl Model Pipeline

The visual and functional appeal of CatGirl avatars hinges on both the quality of the 3D model and its suitability for animation and real-time use.

#### Model Workflow Steps

1. **Design and sculpt base mesh** in Blender/Maya
2. **Optimize for real-time**: Target 10k-30k polygons
3. **Unwrap UVs**: Create texture maps (diffuse, normal, roughness)
4. **Export as FBX**: Version 2012+ with embedded textures

#### Blender Workflow Example

```plaintext
1. Create base mesh using subdivision surface (Level 2)
2. Add ears (cone primitive, bend modifier)
3. Create tail (curve with bevel, convert to mesh)
4. Optimize topology (Remesh modifier, Decimate)
5. UV unwrap (Smart UV Project)
6. Export: File > Export > FBX (.fbx)
   - Apply Transform: ON
   - Forward: -Z Forward
   - Up: Y Up
```

### 1.2 Importing to Unity

```csharp
// Import Settings (Unity Inspector)
// Model Tab:
// - Scale Factor: 1
// - Mesh Compression: Off
// - Read/Write Enabled: ON (for runtime mesh access)

// Rig Tab:
// - Animation Type: Humanoid
// - Avatar Definition: Create From This Model
// - Optimize Game Objects: ON

// Materials Tab:
// - Location: Use Embedded Materials
// - Naming: By Base Texture Name
```

### 1.3 Rigging for Unity Mecanim

#### Critical Bones for Humanoid Rig

| Bone Name | Required | Notes |
|-----------|----------|-------|
| Hips | ✓ | Root bone, center of mass |
| Spine | ✓ | Lower spine |
| Chest | Optional | Upper spine |
| Neck | ✓ | Neck joint |
| Head | ✓ | Head bone |
| Left/Right Shoulder | ✓ | Shoulder joints |
| Left/Right Upper Arm | ✓ | Arm bones |
| Left/Right Lower Arm | ✓ | Forearm bones |
| Left/Right Hand | ✓ | Hand bones |
| Left/Right Upper Leg | ✓ | Thigh bones |
| Left/Right Lower Leg | ✓ | Shin bones |
| Left/Right Foot | ✓ | Foot bones |
| Left/Right Toes | Optional | Toe bones |
| **Tail** | Optional | CatGirl-specific |
| **Ears** | Optional | CatGirl-specific |

#### Avatar Configuration

```csharp
// After import, select model in Project
// Inspector > Rig > Configure Avatar
// - Check all green checkmarks (required bones mapped)
// - Configure Muscles & Settings for custom ranges
// - Save Avatar as separate asset for reuse
```

---

## Section 2: Animation Controller Setup and Blend Trees

### 2.1 Animation Asset Preparation

Download or create animations:
- **Mixamo**: Free humanoid animations (walk, run, idle, jump)
- **MakeHuman**: Open-source character creator with animations
- **Custom**: Blender, Maya, 3ds Max

### 2.2 Animator Controller Structure

```
CatGirlAnimatorController
├── Parameters
│   ├── Speed (float)
│   ├── IsGrounded (bool)
│   ├── IsJumping (bool)
│   └── EmoteID (int)
├── Layers
│   ├── Base Layer (Full Body)
│   ├── Upper Body Layer (Avatar Mask)
│   └── Additive Layer (Facial expressions)
└── States
    ├── Idle
    ├── Locomotion (Blend Tree)
    ├── Jump
    ├── Attack
    └── Interact
```

### 2.3 Blend Tree Configuration

#### Locomotion Blend Tree (1D)

```csharp
// Blend Parameter: Speed (0.0 - 10.0)
// - Threshold 0.0: Idle animation
// - Threshold 2.0: Walk animation
// - Threshold 5.0: Run animation
// - Threshold 10.0: Sprint animation

// Script to update blend parameter:
public class CatGirlController : MonoBehaviour
{
    private Animator animator;
    private float currentSpeed;

    void Update()
    {
        // ::cantrip🔧:CalculateMovementSpeed() -> speed
        currentSpeed = GetMovementSpeed();
        
        // ::transmute⚗️:UpdateAnimationState(speed) -> blended
        animator.SetFloat("Speed", currentSpeed);
    }

    float GetMovementSpeed()
    {
        Vector3 velocity = GetComponent<Rigidbody>().velocity;
        return new Vector3(velocity.x, 0, velocity.z).magnitude;
    }
}
```

#### 2D Blend Tree (Directional Movement)

```
Blend Type: 2D Simple Directional
X Parameter: Horizontal
Y Parameter: Vertical

Positions:
- (0, 1): Forward Walk
- (0, -1): Backward Walk
- (-1, 0): Strafe Left
- (1, 0): Strafe Right
- (1, 1): Forward-Right Diagonal
```

### 2.4 Avatar Masks

Create Avatar Mask for upper body animations:

```csharp
// Assets > Create > Avatar Mask
// Name: UpperBodyMask
// Enable: Spine, Chest, Shoulders, Arms, Hands
// Disable: Hips, Legs, Feet
// Use in Animator Layer for emotes/aiming while walking
```

---

## Section 3: Unity Integration—Prefabs, Avatars, Materials

### 3.1 Prefab Creation Workflow

```csharp
// 1. Create CatGirl GameObject hierarchy
CatGirl (Root)
├── Model (Skinned Mesh Renderer)
├── Rig (Animator)
├── Scripts
│   ├── CatGirlAvatar.cs
│   ├── CatGirlController.cs
│   └── CatGirlStats.cs
├── Equipment Slots
│   ├── Head
│   ├── Body
│   ├── Tail
│   └── Accessory
└── VFX
    ├── Aura Particle System
    └── Enchantment Glow

// 2. Drag to Project folder to create Prefab
// 3. Use Prefab Variants for customization
```

### 3.2 Material Setup

```csharp
// Standard PBR Material
// - Albedo: Base color texture
// - Metallic: 0 (fur/skin)
// - Smoothness: 0.3-0.5
// - Normal Map: Detail texture
// - Emission: For magical effects

// Shader Graph (Optional)
// Create custom CatGirl fur shader with:
// - Anisotropic highlights
// - Rim lighting
// - Subsurface scattering (ears)
```

### 3.3 Equipment System Integration

```csharp
public class CatGirlAvatar : MonoBehaviour
{
    [Header("Equipment Slots")]
    public Transform headSlot;
    public Transform bodySlot;
    public Transform tailSlot;
    public Transform accessorySlot;

    private Dictionary<string, GameObject> equippedItems = new Dictionary<string, GameObject>();

    /// <summary>
    /// Equip item to specific slot.
    /// </summary>
    public void EquipItem(string slotName, GameObject itemPrefab)
    {
        // ::conjure🎨:AttachEquipment(slot, item) -> equipped
        Transform slot = GetSlotTransform(slotName);
        if (slot == null) return;

        // Unequip current
        UnequipSlot(slotName);

        // Instantiate and parent
        GameObject equipped = Instantiate(itemPrefab, slot);
        equipped.transform.localPosition = Vector3.zero;
        equipped.transform.localRotation = Quaternion.identity;
        
        equippedItems[slotName] = equipped;
    }

    public void UnequipSlot(string slotName)
    {
        if (equippedItems.ContainsKey(slotName))
        {
            Destroy(equippedItems[slotName]);
            equippedItems.Remove(slotName);
        }
    }

    Transform GetSlotTransform(string slotName)
    {
        return slotName switch
        {
            "Head" => headSlot,
            "Body" => bodySlot,
            "Tail" => tailSlot,
            "Accessory" => accessorySlot,
            _ => null
        };
    }
}
```

---

## Section 4: Core Game Mechanics and Economic Systems

### 4.1 Currency System Architecture

See `Scripts/Economy/CurrencyManager.cs` for full implementation.

```csharp
// Usage Example
if (CurrencyManager.Instance.SpendCoins(100))
{
    Debug.Log("Purchase successful!");
    InventoryManager.Instance.AddItem(itemData, 1);
}

// Subscribe to events
CurrencyManager.Instance.OnCoinsChanged.AddListener(UpdateCoinUI);
```

### 4.2 Shop System Implementation

```csharp
public class ShopManager : MonoBehaviour
{
    [System.Serializable]
    public class ShopItem
    {
        public Inventory.ItemData itemData;
        public int price;
        public int stock; // -1 for infinite
    }

    public List<ShopItem> shopInventory;

    public bool PurchaseItem(ShopItem item)
    {
        // ::abjure🛡️:ValidatePurchase(item, price) -> canBuy
        if (!Economy.CurrencyManager.Instance.CanAfford(item.price))
        {
            Debug.LogWarning("Insufficient funds!");
            return false;
        }

        if (item.stock == 0)
        {
            Debug.LogWarning("Out of stock!");
            return false;
        }

        // Process transaction
        Economy.CurrencyManager.Instance.SpendCoins(item.price);
        Inventory.InventoryManager.Instance.AddItem(item.itemData, 1);
        
        if (item.stock > 0)
            item.stock--;

        // ::benediction🎉:CelebratePurchase()
        Debug.Log($"[BENEDICTION] Purchased {item.itemData.itemName}!");
        return true;
    }
}
```

### 4.3 Auction House System

```csharp
[System.Serializable]
public class AuctionListing
{
    public string listingID;
    public string sellerID;
    public Inventory.ItemInstance item;
    public int startingBid;
    public int buyoutPrice;
    public int currentBid;
    public string currentBidderID;
    public DateTime endTime;
    public bool isActive;
}

public class AuctionHouseManager : MonoBehaviour
{
    private List<AuctionListing> activeListings = new List<AuctionListing>();

    public void CreateListing(Inventory.ItemInstance item, int startBid, int buyout, int durationHours)
    {
        var listing = new AuctionListing
        {
            listingID = System.Guid.NewGuid().ToString(),
            sellerID = "player", // Get from player manager
            item = item,
            startingBid = startBid,
            buyoutPrice = buyout,
            currentBid = startBid,
            endTime = DateTime.Now.AddHours(durationHours),
            isActive = true
        };

        activeListings.Add(listing);
        Inventory.InventoryManager.Instance.RemoveItem(item.itemData.itemID, 1);
    }

    public bool PlaceBid(string listingID, int bidAmount)
    {
        var listing = activeListings.Find(l => l.listingID == listingID);
        if (listing == null || !listing.isActive) return false;

        if (bidAmount <= listing.currentBid)
        {
            Debug.LogWarning("Bid must be higher than current bid!");
            return false;
        }

        if (!Economy.CurrencyManager.Instance.CanAfford(bidAmount))
        {
            Debug.LogWarning("Insufficient funds for bid!");
            return false;
        }

        // Refund previous bidder
        if (!string.IsNullOrEmpty(listing.currentBidderID))
        {
            // Refund previous bid
        }

        // Place new bid
        listing.currentBid = bidAmount;
        listing.currentBidderID = "player";
        
        Economy.CurrencyManager.Instance.SpendCoins(bidAmount);
        return true;
    }
}
```

### 4.4 Gambling System (Slot Machine)

```csharp
public class SlotMachineManager : MonoBehaviour
{
    [System.Serializable]
    public class SlotReward
    {
        public Inventory.ItemData item;
        public int weight; // Higher = more common
    }

    public List<SlotReward> possibleRewards;
    public int costPerSpin = 10;

    public void Spin()
    {
        // ::abjure🛡️:ValidateGambleCost(cost) -> canAfford
        if (!Economy.CurrencyManager.Instance.SpendCoins(costPerSpin))
        {
            Debug.LogWarning("Not enough coins to spin!");
            return;
        }

        // ::divine🔮:RollReward(weights) -> result
        SlotReward reward = GetWeightedRandomReward();
        
        if (reward != null)
        {
            Inventory.InventoryManager.Instance.AddItem(reward.item, 1);
            // ::benediction🎉:CelebrateWin()
            Debug.Log($"[BENEDICTION] You won {reward.item.itemName}!");
        }
    }

    SlotReward GetWeightedRandomReward()
    {
        int totalWeight = 0;
        foreach (var reward in possibleRewards)
            totalWeight += reward.weight;

        int randomValue = Random.Range(0, totalWeight);
        int currentWeight = 0;

        foreach (var reward in possibleRewards)
        {
            currentWeight += reward.weight;
            if (randomValue < currentWeight)
                return reward;
        }

        return null;
    }
}
```

---

## Section 5: CatGirl Quest, Reward, Goal, and Tech Tree Systems

See `Scripts/Quest/QuestManager.cs` and `Scripts/TechTree/TechTreeManager.cs` for full implementations.

### 5.1 Quest System Usage

```csharp
// Start a quest
QuestManager.Instance.StartQuest(questData);

// Update objective (e.g., collect item)
QuestManager.Instance.UpdateObjective("quest_001", objectiveIndex: 0, progress: 1);

// Subscribe to events
QuestManager.Instance.OnQuestCompleted.AddListener(OnQuestComplete);

void OnQuestComplete(QuestInstance quest)
{
    Debug.Log($"Quest completed: {quest.questData.questName}");
    // Show completion UI
}
```

### 5.2 Tech Tree Usage

```csharp
// Unlock technology
if (TechTreeManager.Instance.CanUnlock("tech_crafting_advanced"))
{
    TechTreeManager.Instance.UnlockTech("tech_crafting_advanced");
}

// Check if unlocked
bool hasAdvancedCrafting = TechTreeManager.Instance.IsUnlocked("tech_crafting_advanced");
```

---

## Section 6: In-Game Currency & Economy Management

### 6.1 Economic Balance Guidelines

| Sink (Spending) | Source (Earning) | Balance Ratio |
|-----------------|------------------|---------------|
| Shop purchases | Quest rewards | 1:1.2 |
| Repairs | Enemy drops | 1:1.5 |
| Crafting costs | Daily login | 1:1.0 |
| Enchanting | Gambling (avg) | 1:0.8 |
| Upgrades | Auction sales | 1:1.3 |

### 6.2 Inflation Prevention

```csharp
// Implement currency sinks
// - Repair costs scale with item level
// - Tax on auction house sales (5-10%)
// - Limited-time shop items at premium prices
// - Cosmetic purchases (no gameplay advantage)
```

---

## Section 7: Diablo-Style Inventory System Implementation

See `Scripts/Inventory/InventoryManager.cs` for full implementation.

### 7.1 Grid-Based Inventory Features

| Feature | Implementation | Status |
|---------|---------------|--------|
| 2D Grid (8x4) | `ItemInstance[,]` array | ✅ |
| Item Shapes | Width/Height per item | ✅ |
| Drag & Drop | UI EventSystem | ✅ |
| Stacking | MaxStack property | ✅ |
| Equipment Slots | Separate slot system | ✅ |
| Persistence | JSON serialization | ✅ |

### 7.2 Usage Example

```csharp
// Add item
InventoryManager.Instance.AddItem(swordItemData, quantity: 1);

// Remove item
InventoryManager.Instance.RemoveItem("item_sword", quantity: 1);

// Check inventory
bool hasSword = InventoryManager.Instance.HasItem("item_sword");
int swordCount = InventoryManager.Instance.GetItemCount("item_sword");
```

---

## Section 8: Player Engagement and Retention via CatGirl Systems

### 8.1 Engagement Loops

```
Daily Loop:
Login → Claim Reward → Complete Daily Quest → Shop Visit → Logout

Weekly Loop:
Weekly Challenge → Auction House → Tech Tree Progress → Gambling

Long-term Loop:
Quest Chain → Equipment Upgrades → Tech Tree Completion → Collection Goals
```

### 8.2 Analytics Integration

```csharp
// Track key metrics
// - Daily Active Users (DAU)
// - Session length
// - Quest completion rate
// - Shop conversion rate
// - Retention (D1, D7, D30)

// Example event tracking
public static class AnalyticsEvents
{
    public static void TrackQuestComplete(string questID)
    {
        // Send to analytics service
    }

    public static void TrackPurchase(string itemID, int price)
    {
        // Track economy metrics
    }
}
```

---

## Section 9: CatGirl System Features Table

| System Feature | Core Capability | Scripts | Status |
|---------------|-----------------|---------|--------|
| Currency System | Multi-currency economy | `CurrencyManager.cs` | ✅ |
| Inventory System | Grid-based with shapes | `InventoryManager.cs` | ✅ |
| Crafting System | Recipe-based crafting | `CraftingManager.cs` | ✅ |
| Quest System | Dynamic quests, objectives | `QuestManager.cs` | ✅ |
| Tech Tree | Node-based progression | `TechTreeManager.cs` | ✅ |
| Shop System | Buy/sell, dynamic pricing | `ShopManager.cs` | 📝 |
| Auction House | Player trading, bidding | `AuctionHouseManager.cs` | 📝 |
| Gambling | Slot machine, gacha | `SlotMachineManager.cs` | 📝 |
| Equipment System | Attachable gear | `CatGirlAvatar.cs` | 📝 |

**Legend**: ✅ Complete | 📝 Template/Partial | ⏳ Planned

---

## Best Practices and Advanced Tips

### Code Organization

```csharp
// Use namespaces for organization
namespace CatGirlSystem.Economy { }
namespace CatGirlSystem.Inventory { }
namespace CatGirlSystem.Quest { }
namespace CatGirlSystem.TechTree { }
```

### ScriptableObject-Driven Design

```csharp
// All game data as ScriptableObjects
// - ItemData
// - QuestData
// - TechNode
// - CraftRecipe
// - EnchantmentData

// Benefits:
// - Designer-friendly
// - Hot-reload in editor
// - No recompilation
// - Easy to version control
```

### Event-Driven Architecture

```csharp
// Use UnityEvents for system communication
// - OnCurrencyChanged
// - OnItemAdded
// - OnQuestCompleted
// - OnTechUnlocked

// Benefits:
// - Loose coupling
// - Easy to extend
// - Inspector-visible connections
```

### Save System Best Practices

```csharp
// Use JSON for save data
// Implement auto-save on critical events
// Cloud save integration (PlayFab, Firebase)
// Version your save format for migrations
```

---

## Conclusion

The CatGirl Avatar system provides a comprehensive foundation for building engaging, monetizable, and retention-focused gameplay. By combining high-quality character pipeline techniques with robust economic and progression systems, developers can create compelling experiences that keep players invested long-term.

### Next Steps

1. ✅ Import 3D model and configure Avatar
2. ✅ Setup Animator Controller with blend trees
3. ✅ Integrate core manager scripts
4. ✅ Create ScriptableObject templates
5. ⏳ Design UI for inventory, shop, quests
6. ⏳ Implement visual effects and animations
7. ⏳ Balance economy and progression
8. ⏳ Playtest and iterate

### Integration with MCP Agent

This CatGirl system seamlessly integrates with the Model Context Protocol architecture:

- **Memory Server**: Persist player state, quest progress
- **Sequential Thinking**: AI-driven quest generation
- **Browser Server**: Fetch dynamic content, auction listings
- **CodeCraft Syntax**: All code follows ritual syntax conventions

---

**Built with ❤️ for Unity Developers**

*Last Updated: November 3, 2025*
