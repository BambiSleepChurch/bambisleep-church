# CatGirl System Integration Guide

Complete guide for integrating the CatGirl avatar system into existing Unity projects.

---

## Prerequisites

- Unity 2022.3 LTS or newer
- TextMeshPro package (optional, for UI)
- Input System package (optional, for modern input)

---

## Installation Steps

### 1. Import the CatGirl System

```bash
# Copy the catgirl-unity-system folder to your Unity project's Assets folder
Assets/
└── catgirl-unity-system/
    ├── Scripts/
    ├── ScriptableObjects/
    ├── Prefabs/
    └── Documentation/
```

### 2. Setup Scene Managers

Create an empty GameObject named "GameManagers" and add these components:

```csharp
// Add via Inspector or code:
gameObject.AddComponent<CatGirlSystem.Economy.CurrencyManager>();
gameObject.AddComponent<CatGirlSystem.Inventory.InventoryManager>();
gameObject.AddComponent<CatGirlSystem.Crafting.CraftingManager>();
gameObject.AddComponent<CatGirlSystem.Quest.QuestManager>();
gameObject.AddComponent<CatGirlSystem.TechTree.TechTreeManager>();
```

### 3. Create ScriptableObject Templates

Right-click in Project window:

- `Create > CatGirl > Item Data` (for inventory items)
- `Create > CatGirl > Craft Recipe` (for crafting recipes)
- `Create > CatGirl > Quest` (for quest definitions)
- `Create > CatGirl > Tech Node` (for tech tree nodes)
- `Create > CatGirl > Enchantment` (for item enchantments)

### 4. Configure UI

The system provides UI-agnostic backend. Connect your UI to managers:

```csharp
public class CoinDisplayUI : MonoBehaviour
{
    public TMPro.TextMeshProUGUI coinText;

    void Start()
    {
        // Subscribe to currency changes
        CurrencyManager.Instance.OnCoinsChanged.AddListener(UpdateDisplay);
        UpdateDisplay(CurrencyManager.Instance.GetCoins());
    }

    void UpdateDisplay(int coins)
    {
        coinText.text = $"Coins: {coins}";
    }
}
```

---

## Integration Examples

### Example 1: Basic Shop System

```csharp
using UnityEngine;
using CatGirlSystem.Economy;
using CatGirlSystem.Inventory;

public class SimpleShop : MonoBehaviour
{
    public ItemData itemForSale;
    public int price = 100;

    public void OnBuyButtonClicked()
    {
        if (CurrencyManager.Instance.SpendCoins(price))
        {
            InventoryManager.Instance.AddItem(itemForSale, 1);
            Debug.Log("Purchase successful!");
        }
        else
        {
            Debug.Log("Not enough coins!");
        }
    }
}
```

### Example 2: Quest Objective Tracking

```csharp
using UnityEngine;
using CatGirlSystem.Quest;

public class Enemy : MonoBehaviour
{
    public string enemyID = "enemy_goblin";

    void Die()
    {
        // Update any active quests with "Kill" objectives
        var activeQuests = QuestManager.Instance.GetActiveQuests();
        
        foreach (var quest in activeQuests)
        {
            for (int i = 0; i < quest.objectives.Count; i++)
            {
                var obj = quest.objectives[i];
                if (obj.objectiveType == ObjectiveType.Kill && obj.targetID == enemyID)
                {
                    QuestManager.Instance.UpdateObjective(quest.questData.questID, i, 1);
                }
            }
        }

        Destroy(gameObject);
    }
}
```

### Example 3: Crafting UI Integration

```csharp
using UnityEngine;
using UnityEngine.UI;
using CatGirlSystem.Crafting;
using CatGirlSystem.Inventory;

public class CraftingUI : MonoBehaviour
{
    public Transform recipeListContainer;
    public GameObject recipeButtonPrefab;

    void Start()
    {
        PopulateRecipeList();
    }

    void PopulateRecipeList()
    {
        var recipes = CraftingManager.Instance.GetAllRecipes();
        
        foreach (var recipe in recipes)
        {
            GameObject btn = Instantiate(recipeButtonPrefab, recipeListContainer);
            btn.GetComponentInChildren<TMPro.TextMeshProUGUI>().text = recipe.recipeName;
            btn.GetComponent<Button>().onClick.AddListener(() => AttemptCraft(recipe));
        }
    }

    void AttemptCraft(CraftRecipe recipe)
    {
        // Set up crafting grid
        for (int i = 0; i < recipe.requiredItems.Length; i++)
        {
            CraftingManager.Instance.SetCraftingSlot(i, recipe.requiredItems[i]);
        }

        // Attempt craft
        bool success = CraftingManager.Instance.AttemptCraft();
        
        if (success)
        {
            Debug.Log("Crafting successful!");
            // Play success animation
        }
        else
        {
            Debug.Log("Crafting failed!");
            // Show error message
        }
    }
}
```

### Example 4: Tech Tree Visualization

```csharp
using UnityEngine;
using CatGirlSystem.TechTree;

public class TechTreeUI : MonoBehaviour
{
    public GameObject techNodePrefab;
    public Transform techTreeContainer;

    void Start()
    {
        GenerateTechTree();
    }

    void GenerateTechTree()
    {
        var allTechs = TechTreeManager.Instance.GetAllTechs();

        foreach (var tech in allTechs)
        {
            GameObject node = Instantiate(techNodePrefab, techTreeContainer);
            
            // Position based on tech.graphPosition
            RectTransform rect = node.GetComponent<RectTransform>();
            rect.anchoredPosition = tech.graphPosition;

            // Setup button
            var button = node.GetComponent<UnityEngine.UI.Button>();
            button.onClick.AddListener(() => OnTechNodeClicked(tech));

            // Visual state
            UpdateNodeVisual(node, tech);
        }
    }

    void OnTechNodeClicked(TechNode tech)
    {
        if (TechTreeManager.Instance.CanUnlock(tech.techID))
        {
            bool success = TechTreeManager.Instance.UnlockTech(tech.techID);
            if (success)
            {
                // Refresh UI
                UpdateNodeVisual(/* find node */, tech);
            }
        }
        else
        {
            // Show requirements tooltip
            ShowTechRequirements(tech);
        }
    }

    void UpdateNodeVisual(GameObject node, TechNode tech)
    {
        var image = node.GetComponent<UnityEngine.UI.Image>();
        
        switch (tech.status)
        {
            case TechStatus.Locked:
                image.color = Color.gray;
                break;
            case TechStatus.Unlocked:
                image.color = Color.green;
                break;
            case TechStatus.Researching:
                image.color = Color.yellow;
                break;
        }
    }

    void ShowTechRequirements(TechNode tech)
    {
        Debug.Log($"Requires: {tech.coinCost} coins, Level {tech.requiredLevel}");
    }
}
```

---

## MCP Integration

### Memory Server Integration

```csharp
// Store inventory state in MCP memory server
public class MCPInventorySync : MonoBehaviour
{
    async void SaveInventoryToMCP()
    {
        var items = InventoryManager.Instance.GetAllItems();
        
        // Convert to JSON
        string json = JsonUtility.ToJson(new { items });
        
        // Send to MCP Memory Server
        // await MCPClient.CreateEntity("player_inventory", json);
    }

    async void LoadInventoryFromMCP()
    {
        // Retrieve from MCP Memory Server
        // string json = await MCPClient.SearchNodes("player_inventory");
        // Parse and restore inventory
    }
}
```

### Sequential Thinking for Quest Generation

```csharp
// Use MCP Sequential Thinking for dynamic quest creation
public class DynamicQuestGenerator : MonoBehaviour
{
    async Task<QuestData> GenerateQuestFromAI()
    {
        // Query MCP Sequential Thinking Server
        // Provide player context: level, completed quests, inventory
        // Receive quest parameters: objectives, rewards, difficulty
        
        // Create QuestData ScriptableObject dynamically
        QuestData newQuest = ScriptableObject.CreateInstance<QuestData>();
        // Populate from AI response
        
        return newQuest;
    }
}
```

---

## Performance Optimization

### 1. Object Pooling for Items

```csharp
public class ItemPool : MonoBehaviour
{
    private Queue<GameObject> pool = new Queue<GameObject>();
    public GameObject itemPrefab;
    public int initialSize = 50;

    void Start()
    {
        for (int i = 0; i < initialSize; i++)
        {
            GameObject obj = Instantiate(itemPrefab);
            obj.SetActive(false);
            pool.Enqueue(obj);
        }
    }

    public GameObject GetItem()
    {
        if (pool.Count > 0)
        {
            GameObject obj = pool.Dequeue();
            obj.SetActive(true);
            return obj;
        }
        return Instantiate(itemPrefab);
    }

    public void ReturnItem(GameObject obj)
    {
        obj.SetActive(false);
        pool.Enqueue(obj);
    }
}
```

### 2. Async Save/Load

```csharp
public class AsyncSaveSystem : MonoBehaviour
{
    public async Task SaveGameAsync()
    {
        await Task.Run(() =>
        {
            // Heavy serialization work
            string json = SerializeGameState();
            System.IO.File.WriteAllText("save.json", json);
        });
    }

    public async Task LoadGameAsync()
    {
        string json = await Task.Run(() =>
        {
            return System.IO.File.ReadAllText("save.json");
        });
        
        DeserializeGameState(json);
    }
}
```

### 3. Cached Lookups

```csharp
// Cache frequently accessed data
private Dictionary<string, ItemData> itemCache = new Dictionary<string, ItemData>();

ItemData GetItem(string itemID)
{
    if (!itemCache.ContainsKey(itemID))
    {
        itemCache[itemID] = Resources.Load<ItemData>($"Items/{itemID}");
    }
    return itemCache[itemID];
}
```

---

## Testing

### Unit Test Example

```csharp
using NUnit.Framework;
using CatGirlSystem.Economy;

public class CurrencyManagerTests
{
    [Test]
    public void TestSpendCoins_InsufficientFunds_ReturnsFalse()
    {
        var manager = new GameObject().AddComponent<CurrencyManager>();
        manager.currentCoins = 50;

        bool result = manager.SpendCoins(100);

        Assert.IsFalse(result);
        Assert.AreEqual(50, manager.currentCoins);
    }

    [Test]
    public void TestAddCoins_IncreasesBalance()
    {
        var manager = new GameObject().AddComponent<CurrencyManager>();
        manager.currentCoins = 100;

        manager.AddCoins(50);

        Assert.AreEqual(150, manager.currentCoins);
    }
}
```

---

## Troubleshooting

### Common Issues

**Issue**: "CurrencyManager.Instance is null"
- **Solution**: Ensure CurrencyManager exists in scene before accessing Instance

**Issue**: "Items not appearing in inventory"
- **Solution**: Check that ItemData ScriptableObject is properly assigned

**Issue**: "Quest objectives not updating"
- **Solution**: Verify questID and objectiveIndex are correct, check console for warnings

**Issue**: "Crafting always fails"
- **Solution**: Ensure crafting grid matches recipe exactly (including empty slots)

---

## Migration Guide

### From Existing Inventory System

```csharp
// 1. Export existing item data to JSON
// 2. Create ItemData ScriptableObjects from JSON
// 3. Map old item IDs to new ItemData references
// 4. Update save/load to use new format

public class InventoryMigration : MonoBehaviour
{
    public void MigrateFromOldSystem()
    {
        // Load old inventory data
        var oldItems = OldInventorySystem.GetAllItems();

        // Convert to new system
        foreach (var oldItem in oldItems)
        {
            ItemData newItemData = FindOrCreateItemData(oldItem);
            InventoryManager.Instance.AddItem(newItemData, oldItem.quantity);
        }

        Debug.Log("Migration complete!");
    }
}
```

---

## Best Practices

1. **Always check Instance != null** before accessing singleton managers
2. **Use events** instead of Update loops for UI updates
3. **Cache frequently accessed** ScriptableObjects
4. **Implement auto-save** on critical events (item acquired, quest complete)
5. **Version your save data** for future migrations
6. **Use namespaces** to avoid naming conflicts
7. **Follow CodeCraft syntax** for consistency with MCP Agent

---

## Support

For issues, questions, or contributions:

- See `Documentation/TECHNICAL.md` for detailed API reference
- Check `Examples/` folder for sample implementations
- Review `.github/copilot-instructions.md` for development guidelines

---

**Happy Developing! 🎮**
