using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;

/// <summary>
/// ::invocation📣:display.quest_log_ui() -> quest_tracker
/// School: Invocation - Public interface for quest tracking system
/// 
/// Displays active, completed, and available quests with objective tracking.
/// Shows quest details, progress, and rewards.
/// 
/// Usage:
///   - Attach to UI Canvas panel
///   - Assign quest entry prefab
///   - Automatically syncs with QuestManager
/// </summary>
public class QuestLogUI : MonoBehaviour
{
    // ::warding🛡️:protect.ui_references() -> null_safety
    [Header("UI References")]
    [SerializeField] private Transform questListContainer;
    [SerializeField] private GameObject questEntryPrefab;
    [SerializeField] private TextMeshProUGUI titleText;
    [SerializeField] private Button closeButton;

    [Header("Quest Details Panel")]
    [SerializeField] private GameObject questDetailsPanel;
    [SerializeField] private TextMeshProUGUI questTitleText;
    [SerializeField] private TextMeshProUGUI questDescriptionText;
    [SerializeField] private Transform objectivesContainer;
    [SerializeField] private GameObject objectiveEntryPrefab;
    [SerializeField] private TextMeshProUGUI rewardsText;
    [SerializeField] private Button abandonQuestButton;
    [SerializeField] private Button trackQuestButton;

    [Header("Quest Tabs")]
    [SerializeField] private Button activeTabButton;
    [SerializeField] private Button completedTabButton;
    [SerializeField] private Button availableTabButton;

    [Header("Visual Settings")]
    [SerializeField] private Color activeQuestColor = Color.yellow;
    [SerializeField] private Color completedQuestColor = Color.green;
    [SerializeField] private Color availableQuestColor = Color.white;
    [SerializeField] private Color trackedQuestColor = new Color(1f, 0.5f, 0f, 1f);

    // ::memory📝:track.quest_state() -> current_view
    private QuestManager questManager;
    private QuestManager.Quest selectedQuest;

    private enum QuestTab { Active, Completed, Available }
    private QuestTab currentTab = QuestTab.Active;

    private List<QuestManager.Quest> displayedQuests = new List<QuestManager.Quest>();

    /// <summary>
    /// ::initialization🌱:setup.quest_log_ui() -> manager_references
    /// Initialize quest log UI and cache manager references
    /// </summary>
    private void Awake()
    {
        // ::warding🛡️:validate.required_components() -> safe_initialization
        ValidateReferences();

        questManager = QuestManager.Instance;

        // ::invocation📣:setup.button_listeners() -> interactive_ui
        if (closeButton != null)
        {
            closeButton.onClick.AddListener(OnCloseButtonClicked);
        }

        if (activeTabButton != null)
        {
            activeTabButton.onClick.AddListener(() => SwitchTab(QuestTab.Active));
        }

        if (completedTabButton != null)
        {
            completedTabButton.onClick.AddListener(() => SwitchTab(QuestTab.Completed));
        }

        if (availableTabButton != null)
        {
            availableTabButton.onClick.AddListener(() => SwitchTab(QuestTab.Available));
        }

        if (abandonQuestButton != null)
        {
            abandonQuestButton.onClick.AddListener(OnAbandonQuestClicked);
        }

        if (trackQuestButton != null)
        {
            trackQuestButton.onClick.AddListener(OnTrackQuestClicked);
        }

        // ::cantrip🔧:initialize.visibility() -> hidden_by_default
        gameObject.SetActive(false);

        if (questDetailsPanel != null)
        {
            questDetailsPanel.SetActive(false);
        }

        if (titleText != null)
        {
            titleText.text = "Quest Log";
        }
    }

    /// <summary>
    /// ::invocation📣:subscribe.quest_events() -> active_monitoring
    /// Subscribe to quest change events
    /// </summary>
    private void OnEnable()
    {
        if (questManager != null)
        {
            questManager.OnQuestAccepted += OnQuestUpdated;
            questManager.OnQuestCompleted += OnQuestUpdated;
            questManager.OnQuestProgressUpdated += OnQuestProgressChanged;
        }

        // ::invocation📣:show.active_quests() -> default_view
        SwitchTab(QuestTab.Active);
    }

    /// <summary>
    /// ::invocation📣:unsubscribe.quest_events() -> clean_shutdown
    /// Clean up event subscriptions
    /// </summary>
    private void OnDisable()
    {
        if (questManager != null)
        {
            questManager.OnQuestAccepted -= OnQuestUpdated;
            questManager.OnQuestCompleted -= OnQuestUpdated;
            questManager.OnQuestProgressUpdated -= OnQuestProgressChanged;
        }
    }

    /// <summary>
    /// ::cantrip🔧:validate.ui_references() -> error_reporting
    /// Validate that all required UI references are assigned
    /// </summary>
    private void ValidateReferences()
    {
        if (questListContainer == null)
        {
            Debug.LogError("QuestLogUI: questListContainer is not assigned!", this);
        }
        if (questEntryPrefab == null)
        {
            Debug.LogError("QuestLogUI: questEntryPrefab is not assigned!", this);
        }
        if (questDetailsPanel == null)
        {
            Debug.LogWarning("QuestLogUI: questDetailsPanel is not assigned", this);
        }
    }

    /// <summary>
    /// ::transmutation🔄:switch.quest_tab(tab) -> view_change
    /// Switch between Active, Completed, and Available quest tabs
    /// </summary>
    /// <param name="tab">Target tab to switch to</param>
    private void SwitchTab(QuestTab tab)
    {
        currentTab = tab;

        // ::transmutation🔄:update.tab_button_visuals() -> active_indicator
        UpdateTabButtons();

        // ::invocation📣:refresh.quest_list() -> updated_content
        RefreshQuestList();
    }

    /// <summary>
    /// ::transmutation🔄:update.tab_visuals() -> active_indicator
    /// Update tab button visuals to show active tab
    /// </summary>
    private void UpdateTabButtons()
    {
        if (activeTabButton != null)
        {
            var image = activeTabButton.GetComponent<Image>();
            if (image != null)
            {
                image.color = (currentTab == QuestTab.Active) ? activeQuestColor : Color.white;
            }
        }

        if (completedTabButton != null)
        {
            var image = completedTabButton.GetComponent<Image>();
            if (image != null)
            {
                image.color = (currentTab == QuestTab.Completed) ? completedQuestColor : Color.white;
            }
        }

        if (availableTabButton != null)
        {
            var image = availableTabButton.GetComponent<Image>();
            if (image != null)
            {
                image.color = (currentTab == QuestTab.Available) ? availableQuestColor : Color.white;
            }
        }
    }

    /// <summary>
    /// ::transmutation🔄:refresh.quest_list() -> populated_display
    /// Update quest list based on current tab
    /// </summary>
    private void RefreshQuestList()
    {
        if (questManager == null || questListContainer == null) return;

        // ::cantrip🔧:clear.existing_entries() -> empty_container
        foreach (Transform child in questListContainer)
        {
            Destroy(child.gameObject);
        }

        displayedQuests.Clear();

        // ::divination🔮:query.quests_by_tab() -> filtered_list
        switch (currentTab)
        {
            case QuestTab.Active:
                displayedQuests = questManager.GetActiveQuests();
                break;
            case QuestTab.Completed:
                displayedQuests = questManager.GetCompletedQuests();
                break;
            case QuestTab.Available:
                // For available quests, you'd query NPCs or quest database
                // This is a placeholder
                displayedQuests = new List<QuestManager.Quest>();
                break;
        }

        if (displayedQuests.Count == 0)
        {
            // ::invocation📣:show.empty_message() -> user_feedback
            GameObject emptyObj = new GameObject("EmptyMessage");
            emptyObj.transform.SetParent(questListContainer);
            TextMeshProUGUI emptyText = emptyObj.AddComponent<TextMeshProUGUI>();
            emptyText.text = GetEmptyMessage();
            emptyText.alignment = TextAlignmentOptions.Center;
            emptyText.fontSize = 18;
            emptyText.color = Color.gray;
            return;
        }

        // ::transmutation🔄:instantiate.quest_entries() -> populated_list
        foreach (var quest in displayedQuests)
        {
            GameObject entryObj = Instantiate(questEntryPrefab, questListContainer);
            QuestEntryUI entryUI = entryObj.GetComponent<QuestEntryUI>();

            if (entryUI == null)
            {
                entryUI = entryObj.AddComponent<QuestEntryUI>();
            }

            // ::invocation📣:initialize.quest_entry(quest) -> configured_display
            bool isTracked = (questManager.GetTrackedQuest() == quest);
            entryUI.Initialize(quest, isTracked, () => OnQuestEntryClicked(quest));
        }
    }

    /// <summary>
    /// ::cantrip🔧:get.empty_message() -> contextual_text
    /// Get appropriate empty message based on current tab
    /// </summary>
    private string GetEmptyMessage()
    {
        switch (currentTab)
        {
            case QuestTab.Active:
                return "No active quests.\nTalk to NPCs to find quests!";
            case QuestTab.Completed:
                return "No completed quests yet.\nComplete quests to see them here!";
            case QuestTab.Available:
                return "No available quests.\nExplore the world to find more!";
            default:
                return "No quests to display.";
        }
    }

    /// <summary>
    /// ::invocation📣:handle.quest_entry_clicked(quest) -> show_details
    /// Handle when a quest entry is clicked
    /// </summary>
    /// <param name="quest">The clicked quest</param>
    private void OnQuestEntryClicked(QuestManager.Quest quest)
    {
        selectedQuest = quest;
        ShowQuestDetails(quest);
    }

    /// <summary>
    /// ::transmutation🔄:display.quest_details(quest) -> detailed_view
    /// Show detailed information about a quest
    /// </summary>
    /// <param name="quest">Quest to display</param>
    private void ShowQuestDetails(QuestManager.Quest quest)
    {
        if (questDetailsPanel == null) return;

        questDetailsPanel.SetActive(true);

        // ::transmutation🔄:populate.quest_info() -> formatted_display
        if (questTitleText != null)
        {
            questTitleText.text = quest.questName;
        }

        if (questDescriptionText != null)
        {
            questDescriptionText.text = quest.description;
        }

        // ::transmutation🔄:display.objectives() -> progress_tracking
        if (objectivesContainer != null && objectiveEntryPrefab != null)
        {
            foreach (Transform child in objectivesContainer)
            {
                Destroy(child.gameObject);
            }

            foreach (var objective in quest.objectives)
            {
                GameObject objObj = Instantiate(objectiveEntryPrefab, objectivesContainer);
                TextMeshProUGUI objText = objObj.GetComponent<TextMeshProUGUI>();

                if (objText != null)
                {
                    string checkmark = objective.isCompleted ? "✓" : "○";
                    objText.text = $"{checkmark} {objective.description} ({objective.currentProgress}/{objective.targetProgress})";
                    objText.color = objective.isCompleted ? completedQuestColor : Color.white;
                }
            }
        }

        // ::transmutation🔄:display.rewards() -> formatted_list
        if (rewardsText != null)
        {
            string rewards = "Rewards:\n";
            rewards += $"  • {quest.coinReward} coins\n";
            rewards += $"  • {quest.expReward} XP\n";

            if (quest.itemRewards != null && quest.itemRewards.Count > 0)
            {
                foreach (var item in quest.itemRewards)
                {
                    rewards += $"  • {item.itemName}\n";
                }
            }

            rewardsText.text = rewards;
        }

        // ::cantrip🔧:configure.action_buttons() -> contextual_options
        if (abandonQuestButton != null)
        {
            abandonQuestButton.gameObject.SetActive(currentTab == QuestTab.Active);
        }

        if (trackQuestButton != null)
        {
            trackQuestButton.gameObject.SetActive(currentTab == QuestTab.Active);
            bool isTracked = (questManager.GetTrackedQuest() == quest);

            var trackButtonText = trackQuestButton.GetComponentInChildren<TextMeshProUGUI>();
            if (trackButtonText != null)
            {
                trackButtonText.text = isTracked ? "Untrack" : "Track";
            }
        }
    }

    /// <summary>
    /// ::invocation📣:handle.abandon_quest() -> quest_removal
    /// Handle abandoning the selected quest
    /// </summary>
    private void OnAbandonQuestClicked()
    {
        if (selectedQuest == null) return;

        // ::transmutation🔄:abandon.quest() -> removed_from_active
        bool success = questManager.AbandonQuest(selectedQuest.questID);

        if (success)
        {
            Debug.Log($"QuestLogUI: Abandoned quest {selectedQuest.questName}");
            selectedQuest = null;
            questDetailsPanel.SetActive(false);
            RefreshQuestList();
        }
        else
        {
            Debug.LogWarning($"QuestLogUI: Failed to abandon quest {selectedQuest.questName}");
        }
    }

    /// <summary>
    /// ::invocation📣:handle.track_quest() -> tracking_toggle
    /// Handle tracking/untracking the selected quest
    /// </summary>
    private void OnTrackQuestClicked()
    {
        if (selectedQuest == null) return;

        // ::transmutation🔄:toggle.quest_tracking() -> hud_update
        bool isCurrentlyTracked = (questManager.GetTrackedQuest() == selectedQuest);

        if (isCurrentlyTracked)
        {
            questManager.SetTrackedQuest(null);
        }
        else
        {
            questManager.SetTrackedQuest(selectedQuest);
        }

        // ::invocation📣:refresh.display() -> updated_ui
        ShowQuestDetails(selectedQuest);
        RefreshQuestList();
    }

    /// <summary>
    /// ::invocation📣:handle.quest_updated() -> ui_refresh
    /// Event handler for quest state changes
    /// </summary>
    private void OnQuestUpdated(QuestManager.Quest quest)
    {
        RefreshQuestList();

        if (selectedQuest != null && selectedQuest.questID == quest.questID)
        {
            ShowQuestDetails(quest);
        }
    }

    /// <summary>
    /// ::invocation📣:handle.quest_progress_changed() -> progress_update
    /// Event handler for quest progress changes
    /// </summary>
    private void OnQuestProgressChanged(QuestManager.Quest quest, QuestManager.QuestObjective objective)
    {
        if (selectedQuest != null && selectedQuest.questID == quest.questID)
        {
            ShowQuestDetails(quest);
        }
    }

    /// <summary>
    /// ::invocation📣:close.quest_log() -> hide_ui
    /// Close quest log UI
    /// </summary>
    private void OnCloseButtonClicked()
    {
        gameObject.SetActive(false);
    }

    /// <summary>
    /// ::invocation📣:toggle.visibility() -> show_hide
    /// Public method to toggle quest log visibility
    /// </summary>
    public void ToggleQuestLog()
    {
        gameObject.SetActive(!gameObject.activeSelf);
    }

    /// <summary>
    /// ::divination🔮:debug.quest_log_state() -> diagnostic_info
    /// Log current quest log UI state for debugging
    /// </summary>
    [ContextMenu("Debug Quest Log State")]
    private void DebugQuestLogState()
    {
        Debug.Log($"QuestLogUI State:\n" +
                  $"  Current Tab: {currentTab}\n" +
                  $"  Displayed Quests: {displayedQuests.Count}\n" +
                  $"  Selected Quest: {(selectedQuest != null ? selectedQuest.questName : "None")}\n" +
                  $"  Details Panel Visible: {(questDetailsPanel != null && questDetailsPanel.activeSelf)}");
    }
}

/// <summary>
/// ::invocation📣:define.quest_entry_ui() -> quest_list_item
/// School: Invocation - Individual quest entry in quest list
/// 
/// Displays quest name, level, and tracking status.
/// Handles click events for quest selection.
/// </summary>
public class QuestEntryUI : MonoBehaviour
{
    // ::memory📝:cache.ui_components() -> performance
    private TextMeshProUGUI questNameText;
    private TextMeshProUGUI questLevelText;
    private Image trackingIndicator;
    private Button entryButton;

    private System.Action onClickCallback;

    /// <summary>
    /// ::initialization🌱:setup.quest_entry(quest, tracked, callback) -> configured_display
    /// Initialize quest entry UI with quest data
    /// </summary>
    public void Initialize(QuestManager.Quest quest, bool isTracked, System.Action onClick)
    {
        onClickCallback = onClick;

        // ::cantrip🔧:find.ui_components() -> cached_references
        questNameText = transform.Find("QuestName")?.GetComponent<TextMeshProUGUI>();
        questLevelText = transform.Find("QuestLevel")?.GetComponent<TextMeshProUGUI>();
        trackingIndicator = transform.Find("TrackingIndicator")?.GetComponent<Image>();
        entryButton = GetComponent<Button>();

        // ::transmutation🔄:populate.quest_display() -> visual_update
        if (questNameText != null)
        {
            questNameText.text = quest.questName;
        }

        if (questLevelText != null)
        {
            questLevelText.text = $"Lv.{quest.recommendedLevel}";
        }

        if (trackingIndicator != null)
        {
            trackingIndicator.gameObject.SetActive(isTracked);
        }

        // ::invocation📣:setup.click_handler() -> interactive_button
        if (entryButton != null)
        {
            entryButton.onClick.AddListener(OnEntryClicked);
        }
    }

    /// <summary>
    /// ::invocation📣:handle.entry_clicked() -> callback_execution
    /// Handle when this quest entry is clicked
    /// </summary>
    private void OnEntryClicked()
    {
        onClickCallback?.Invoke();
    }
}
