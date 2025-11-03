using UnityEngine;
using UnityEngine.Events;
using System.Collections.Generic;

namespace CatGirlSystem.TechTree
{
    /// <summary>
    /// Tech tree / skill progression system with node-based unlocks.
    /// </summary>
    public class TechTreeManager : MonoBehaviour
    {
        public static TechTreeManager Instance { get; private set; }

        [Header("Tech Tree Configuration")]
        [SerializeField] private List<TechNode> allTechnologies = new List<TechNode>();

        private Dictionary<string, TechNode> techLookup = new Dictionary<string, TechNode>();
        private List<string> unlockedTechs = new List<string>();

        [Header("Events")]
        public UnityEvent<TechNode> OnTechUnlocked;
        public UnityEvent<TechNode> OnTechResearching;

        /// LAW: Tech prerequisites must be unlocked before dependent techs
        /// FLOW: Check prerequisites -> Validate resources -> Unlock tech -> Apply bonuses
        ///<3 HEART: Tech tree progression gives long-term goals and satisfaction
        ///⚡ PERF: Use dictionary for O(1) tech lookup by ID

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeTechTree();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeTechTree()
        {
            // ::conjure🎨:BuildTechDatabase() -> lookup
            foreach (var tech in allTechnologies)
            {
                if (!string.IsNullOrEmpty(tech.techID))
                {
                    techLookup[tech.techID] = tech;
                }
            }

            LoadTechState();
        }

        /// <summary>
        /// Check if tech can be unlocked.
        /// </summary>
        public bool CanUnlock(string techID)
        {
            if (!techLookup.ContainsKey(techID))
                return false;

            TechNode tech = techLookup[techID];

            // Already unlocked?
            if (tech.status == TechStatus.Unlocked)
                return false;

            // Check prerequisites
            foreach (string prereqID in tech.prerequisiteTechIDs)
            {
                if (!IsUnlocked(prereqID))
                {
                    return false;
                }
            }

            // Check resource costs
            return HasRequiredResources(tech);
        }

        /// <summary>
        /// Attempt to unlock technology.
        /// </summary>
        public bool UnlockTech(string techID)
        {
            // ::abjure🛡️:ValidateUnlock(techID) -> canUnlock
            if (!CanUnlock(techID))
            {
                Debug.LogWarning($"[TechTreeManager] Cannot unlock {techID}");
                return false;
            }

            TechNode tech = techLookup[techID];

            // Consume resources
            ConsumeResources(tech);

            // Unlock
            tech.status = TechStatus.Unlocked;
            unlockedTechs.Add(techID);

            // Apply stat bonuses
            ApplyTechBonuses(tech);

            OnTechUnlocked?.Invoke(tech);

            // ::benediction🎉:CelebrateTechUnlock()
            Debug.Log($"[BENEDICTION] Unlocked technology: {tech.techName}!");

            SaveTechState();
            return true;
        }

        /// <summary>
        /// Check if player has required resources.
        /// </summary>
        private bool HasRequiredResources(TechNode tech)
        {
            // Check currency
            if (!Economy.CurrencyManager.Instance.CanAfford(tech.coinCost, tech.gemCost))
            {
                return false;
            }

            // Check items
            foreach (var resourceReq in tech.requiredResources)
            {
                int playerAmount = Inventory.InventoryManager.Instance.GetItemCount(resourceReq.itemID);
                if (playerAmount < resourceReq.amount)
                {
                    return false;
                }
            }

            return true;
        }

        /// <summary>
        /// Consume resources for unlock.
        /// </summary>
        private void ConsumeResources(TechNode tech)
        {
            // ::transmute⚗️:ConsumeResources(tech.Costs) -> consumed
            Economy.CurrencyManager.Instance.SpendCoins(tech.coinCost);
            Economy.CurrencyManager.Instance.SpendGems(tech.gemCost);

            foreach (var resourceReq in tech.requiredResources)
            {
                Inventory.InventoryManager.Instance.RemoveItem(resourceReq.itemID, resourceReq.amount);
            }
        }

        /// <summary>
        /// Apply technology bonuses.
        /// </summary>
        private void ApplyTechBonuses(TechNode tech)
        {
            // ::enchant💫:ApplyStatBonuses(tech.Bonuses) -> applied
            // This would integrate with your stat system
            Debug.Log($"[TechTreeManager] Applied bonuses from {tech.techName}");
        }

        /// <summary>
        /// Check if tech is unlocked.
        /// </summary>
        public bool IsUnlocked(string techID)
        {
            return unlockedTechs.Contains(techID);
        }

        /// <summary>
        /// Get tech node by ID.
        /// </summary>
        public TechNode GetTech(string techID)
        {
            return techLookup.ContainsKey(techID) ? techLookup[techID] : null;
        }

        /// <summary>
        /// Get all technologies.
        /// </summary>
        public List<TechNode> GetAllTechs() => allTechnologies;

        /// <summary>
        /// Get unlocked technologies.
        /// </summary>
        public List<string> GetUnlockedTechs() => unlockedTechs;

        /// <summary>
        /// Save tech tree state.
        /// </summary>
        private void SaveTechState()
        {
            // ::glyph📜:PersistTechTree() -> saved
            string json = string.Join(",", unlockedTechs);
            PlayerPrefs.SetString("UnlockedTechs", json);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// Load tech tree state.
        /// </summary>
        private void LoadTechState()
        {
            string json = PlayerPrefs.GetString("UnlockedTechs", "");
            if (!string.IsNullOrEmpty(json))
            {
                unlockedTechs = new List<string>(json.Split(','));

                // Update tech statuses
                foreach (string techID in unlockedTechs)
                {
                    if (techLookup.ContainsKey(techID))
                    {
                        techLookup[techID].status = TechStatus.Unlocked;
                    }
                }
            }
            Debug.Log("[TechTreeManager] Tech tree loaded.");
        }

        [ContextMenu("Reset Tech Tree")]
        public void ResetTechTree()
        {
            unlockedTechs.Clear();
            foreach (var tech in allTechnologies)
            {
                tech.status = TechStatus.Locked;
            }
            SaveTechState();
            Debug.Log("[TechTreeManager] Tech tree reset.");
        }
    }

    /// <summary>
    /// Technology node status.
    /// </summary>
    public enum TechStatus
    {
        Locked,
        Unlocked,
        Researching
    }

    /// <summary>
    /// Resource requirement for tech unlock.
    /// </summary>
    [System.Serializable]
    public class ResourceRequirement
    {
        public string itemID;
        public int amount;
    }

    /// <summary>
    /// Stat bonus from technology.
    /// </summary>
    [System.Serializable]
    public class StatBonus
    {
        public string statName;
        public float bonusValue;
        public bool isPercentage;
    }

    /// <summary>
    /// ScriptableObject defining tech node.
    /// </summary>
    [CreateAssetMenu(fileName = "NewTech", menuName = "CatGirl/Tech Node")]
    public class TechNode : ScriptableObject
    {
        [Header("Tech Info")]
        public string techID;
        public string techName;
        [TextArea(3, 6)]
        public string description;
        public Sprite icon;

        [Header("Status")]
        public TechStatus status = TechStatus.Locked;

        [Header("Requirements")]
        public List<string> prerequisiteTechIDs;
        public int requiredLevel = 1;

        [Header("Costs")]
        public int coinCost = 1000;
        public int gemCost = 0;
        public List<ResourceRequirement> requiredResources;

        [Header("Bonuses")]
        public List<StatBonus> statBonuses;

        [Header("Unlocks")]
        public List<Crafting.CraftRecipe> unlockedRecipes;
        public List<Quest.QuestData> unlockedQuests;

        [Header("Visual")]
        public Vector2 graphPosition; // For UI positioning in tech tree graph

        private void OnValidate()
        {
            if (string.IsNullOrEmpty(techID))
            {
                techID = $"tech_{name}";
            }
        }
    }
}
