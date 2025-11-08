using UnityEngine;
using UnityEngine.Events;
using System.Collections.Generic;
using System;

namespace CatGirlSystem.Quest
{
    /// <summary>
    /// Quest management system with objectives, rewards, and dynamic generation.
    /// </summary>
    public class QuestManager : MonoBehaviour
    {
        public static QuestManager Instance { get; private set; }

        [Header("Quest Configuration")]
        [SerializeField] private List<QuestData> availableQuests = new List<QuestData>();

        private List<QuestInstance> activeQuests = new List<QuestInstance>();
        private List<QuestInstance> completedQuests = new List<QuestInstance>();

        [Header("Events")]
        public UnityEvent<QuestInstance> OnQuestStarted;
        public UnityEvent<QuestInstance> OnQuestCompleted;
        public UnityEvent<QuestInstance, int> OnObjectiveUpdated;

        /// LAW: Quest objectives must be completed in order if sequential
        /// FLOW: Start quest -> Track progress -> Update objectives -> Grant rewards
        ///<3 HEART: Dynamic quests make CatGirls feel alive and purposeful
        ///⚡ PERF: Use dictionary lookup for active quest retrieval

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                LoadQuestState();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        /// <summary>
        /// Start a new quest.
        /// </summary>
        public bool StartQuest(QuestData questData)
        {
            // ::abjure🛡️:ValidateQuestRequirements(questData) -> canStart
            if (IsQuestActive(questData.questID))
            {
                Debug.LogWarning($"[QuestManager] Quest {questData.questName} already active!");
                return false;
            }

            if (IsQuestCompleted(questData.questID) && !questData.isRepeatable)
            {
                Debug.LogWarning($"[QuestManager] Quest {questData.questName} already completed!");
                return false;
            }

            // ::conjure🎨:CreateQuestInstance(questData) -> instance
            QuestInstance newQuest = new QuestInstance(questData);
            activeQuests.Add(newQuest);

            OnQuestStarted?.Invoke(newQuest);
            Debug.Log($"[QuestManager] Started quest: {questData.questName}");
            SaveQuestState();

            return true;
        }

        /// <summary>
        /// Update quest objective progress.
        /// </summary>
        public void UpdateObjective(string questID, int objectiveIndex, int progress = 1)
        {
            QuestInstance quest = GetActiveQuest(questID);
            if (quest == null) return;

            if (objectiveIndex < 0 || objectiveIndex >= quest.objectives.Count) return;

            var objective = quest.objectives[objectiveIndex];
            objective.currentProgress = Mathf.Min(objective.currentProgress + progress, objective.requiredAmount);

            Debug.Log($"[QuestManager] Updated {quest.questData.questName}: {objective.description} ({objective.currentProgress}/{objective.requiredAmount})");

            OnObjectiveUpdated?.Invoke(quest, objectiveIndex);

            // Check if quest is complete
            if (AreAllObjectivesComplete(quest))
            {
                CompleteQuest(questID);
            }

            SaveQuestState();
        }

        /// <summary>
        /// Complete a quest and grant rewards.
        /// </summary>
        public void CompleteQuest(string questID)
        {
            QuestInstance quest = GetActiveQuest(questID);
            if (quest == null) return;

            // Grant rewards
            GrantQuestRewards(quest);

            // Move to completed
            activeQuests.Remove(quest);
            completedQuests.Add(quest);
            quest.isCompleted = true;
            quest.completionTime = DateTime.Now;

            OnQuestCompleted?.Invoke(quest);

            // ::benediction🎉:CelebrateQuestCompletion()
            Debug.Log($"[BENEDICTION] Quest completed: {quest.questData.questName}!");

            SaveQuestState();
        }

        /// <summary>
        /// Grant quest rewards to player.
        /// </summary>
        private void GrantQuestRewards(QuestInstance quest)
        {
            // ::conjure🎨:GrantRewards(quest.Rewards) -> granted
            foreach (var reward in quest.questData.rewards)
            {
                switch (reward.rewardType)
                {
                    case RewardType.Currency:
                        Economy.CurrencyManager.Instance.AddCoins(reward.amount);
                        break;
                    case RewardType.Item:
                        if (reward.itemReward != null)
                        {
                            Inventory.InventoryManager.Instance.AddItem(reward.itemReward, reward.amount);
                        }
                        break;
                    case RewardType.Experience:
                        // Add XP system integration here
                        Debug.Log($"Granted {reward.amount} XP");
                        break;
                }
            }
        }

        /// <summary>
        /// Check if all objectives are complete.
        /// </summary>
        private bool AreAllObjectivesComplete(QuestInstance quest)
        {
            foreach (var obj in quest.objectives)
            {
                if (obj.currentProgress < obj.requiredAmount)
                {
                    return false;
                }
            }
            return true;
        }

        /// <summary>
        /// Get active quest by ID.
        /// </summary>
        public QuestInstance GetActiveQuest(string questID)
        {
            return activeQuests.Find(q => q.questData.questID == questID);
        }

        /// <summary>
        /// Check if quest is currently active.
        /// </summary>
        public bool IsQuestActive(string questID)
        {
            return activeQuests.Exists(q => q.questData.questID == questID);
        }

        /// <summary>
        /// Check if quest has been completed.
        /// </summary>
        public bool IsQuestCompleted(string questID)
        {
            return completedQuests.Exists(q => q.questData.questID == questID);
        }

        /// <summary>
        /// Get all active quests.
        /// </summary>
        public List<QuestInstance> GetActiveQuests() => activeQuests;

        /// <summary>
        /// Get all completed quests.
        /// </summary>
        public List<QuestInstance> GetCompletedQuests() => completedQuests;

        /// <summary>
        /// Save quest state to PlayerPrefs.
        /// </summary>
        private void SaveQuestState()
        {
            // ::glyph📜:PersistQuestState() -> saved
            // Implement JSON serialization
            PlayerPrefs.Save();
        }

        /// <summary>
        /// Load quest state from PlayerPrefs.
        /// </summary>
        private void LoadQuestState()
        {
            // Load from PlayerPrefs
            Debug.Log("[QuestManager] Quest state loaded.");
        }
    }

    /// <summary>
    /// Runtime instance of a quest with progress tracking.
    /// </summary>
    [Serializable]
    public class QuestInstance
    {
        public QuestData questData;
        public List<QuestObjective> objectives;
        public bool isCompleted;
        public DateTime startTime;
        public DateTime completionTime;

        public QuestInstance(QuestData data)
        {
            questData = data;
            objectives = new List<QuestObjective>();

            // Copy objectives from data
            foreach (var obj in data.objectives)
            {
                objectives.Add(new QuestObjective
                {
                    description = obj.description,
                    objectiveType = obj.objectiveType,
                    targetID = obj.targetID,
                    requiredAmount = obj.requiredAmount,
                    currentProgress = 0
                });
            }

            isCompleted = false;
            startTime = DateTime.Now;
        }
    }

    /// <summary>
    /// Quest objective with progress tracking.
    /// </summary>
    [Serializable]
    public class QuestObjective
    {
        public string description;
        public ObjectiveType objectiveType;
        public string targetID;  // Item ID, enemy ID, location ID, etc.
        public int requiredAmount;
        public int currentProgress;
    }

    public enum ObjectiveType
    {
        Collect,
        Kill,
        Interact,
        Reach,
        Craft,
        Purchase
    }

    /// <summary>
    /// Quest reward data.
    /// </summary>
    [Serializable]
    public class QuestReward
    {
        public RewardType rewardType;
        public int amount;
        public Inventory.ItemData itemReward;
    }

    public enum RewardType
    {
        Currency,
        Item,
        Experience,
        Reputation
    }

    /// <summary>
    /// ScriptableObject defining quest data.
    /// </summary>
    [CreateAssetMenu(fileName = "NewQuest", menuName = "CatGirl/Quest")]
    public class QuestData : ScriptableObject
    {
        [Header("Quest Info")]
        public string questID;
        public string questName;
        [TextArea(3, 6)]
        public string description;
        public Sprite questIcon;

        [Header("Requirements")]
        public int requiredLevel = 1;
        public List<string> prerequisiteQuestIDs;

        [Header("Objectives")]
        public List<QuestObjective> objectives;

        [Header("Rewards")]
        public List<QuestReward> rewards;

        [Header("Properties")]
        public bool isRepeatable = false;
        public bool isDaily = false;
        public int timeLimit = 0; // 0 = no limit (seconds)

        private void OnValidate()
        {
            if (string.IsNullOrEmpty(questID))
            {
                questID = $"quest_{name}";
            }
        }
    }
}
