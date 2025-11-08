using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// <summary>
/// ::invocation📣:display.currency_ui() -> currency_display
/// School: Invocation - Public interface for currency display
/// 
/// Manages the on-screen display of coins and gems with animated updates.
/// Updates in real-time when CurrencyManager values change.
/// 
/// Usage:
///   - Attach to UI Canvas GameObject
///   - Assign TextMeshProUGUI references in Inspector
///   - Automatically subscribes to currency change events
/// </summary>
public class CurrencyDisplay : MonoBehaviour
{
    // ::warding🛡️:protect.ui_references() -> null_safety
    [Header("UI References")]
    [SerializeField] private TextMeshProUGUI coinsText;
    [SerializeField] private TextMeshProUGUI gemsText;
    [SerializeField] private Image coinsIcon;
    [SerializeField] private Image gemsIcon;

    // ::cantrip🔧:configure.animation() -> smooth_transitions
    [Header("Animation Settings")]
    [SerializeField] private float updateDuration = 0.5f;
    [SerializeField] private AnimationCurve updateCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);
    [SerializeField] private bool enablePulseEffect = true;
    [SerializeField] private float pulseScale = 1.2f;
    [SerializeField] private float pulseDuration = 0.3f;

    // ::memory📝:track.currency_state() -> display_values
    private int currentCoinsDisplay;
    private int targetCoins;
    private int currentGemsDisplay;
    private int targetGems;

    private float animationTimer;
    private bool isAnimating;

    // ::memory📝:cache.component_references() -> performance
    private CanvasGroup canvasGroup;

    /// <summary>
    /// ::initialization🌱:setup.currency_display() -> subscribed_listeners
    /// Initialize component and subscribe to currency change events
    /// </summary>
    private void Awake()
    {
        // ::warding🛡️:validate.component_dependencies() -> safe_initialization
        ValidateReferences();

        canvasGroup = GetComponent<CanvasGroup>();
        if (canvasGroup == null)
        {
            canvasGroup = gameObject.AddComponent<CanvasGroup>();
        }
    }

    /// <summary>
    /// ::invocation📣:subscribe.currency_events() -> active_monitoring
    /// Subscribe to CurrencyManager events when component becomes active
    /// </summary>
    private void OnEnable()
    {
        if (CurrencyManager.Instance != null)
        {
            CurrencyManager.Instance.OnCoinsChanged += OnCoinsChanged;
            CurrencyManager.Instance.OnGemsChanged += OnGemsChanged;

            // ::invocation📣:sync.initial_values() -> current_state
            currentCoinsDisplay = CurrencyManager.Instance.GetCoins();
            targetCoins = currentCoinsDisplay;
            currentGemsDisplay = CurrencyManager.Instance.GetGems();
            targetGems = currentGemsDisplay;

            UpdateDisplayImmediate();
        }
        else
        {
            Debug.LogWarning("CurrencyDisplay: CurrencyManager.Instance is null on Enable");
        }
    }

    /// <summary>
    /// ::invocation📣:unsubscribe.currency_events() -> clean_shutdown
    /// Clean up event subscriptions when component is disabled
    /// </summary>
    private void OnDisable()
    {
        if (CurrencyManager.Instance != null)
        {
            CurrencyManager.Instance.OnCoinsChanged -= OnCoinsChanged;
            CurrencyManager.Instance.OnGemsChanged -= OnGemsChanged;
        }
    }

    /// <summary>
    /// ::cantrip🔧:validate.ui_references() -> error_reporting
    /// Validate that all required UI references are assigned
    /// </summary>
    private void ValidateReferences()
    {
        if (coinsText == null)
        {
            Debug.LogError("CurrencyDisplay: coinsText is not assigned!", this);
        }
        if (gemsText == null)
        {
            Debug.LogError("CurrencyDisplay: gemsText is not assigned!", this);
        }
        if (coinsIcon == null)
        {
            Debug.LogWarning("CurrencyDisplay: coinsIcon is not assigned (optional)", this);
        }
        if (gemsIcon == null)
        {
            Debug.LogWarning("CurrencyDisplay: gemsIcon is not assigned (optional)", this);
        }
    }

    /// <summary>
    /// ::transmutation🔄:animate.currency_update() -> smooth_transition
    /// Smoothly animate currency values from current to target
    /// </summary>
    private void Update()
    {
        if (isAnimating)
        {
            animationTimer += Time.deltaTime;
            float progress = Mathf.Clamp01(animationTimer / updateDuration);
            float curveValue = updateCurve.Evaluate(progress);

            // ::transmutation🔄:lerp.display_values() -> smooth_numbers
            if (targetCoins != currentCoinsDisplay)
            {
                int startCoins = currentCoinsDisplay;
                currentCoinsDisplay = Mathf.RoundToInt(Mathf.Lerp(startCoins, targetCoins, curveValue));
                UpdateCoinsText();
            }

            if (targetGems != currentGemsDisplay)
            {
                int startGems = currentGemsDisplay;
                currentGemsDisplay = Mathf.RoundToInt(Mathf.Lerp(startGems, targetGems, curveValue));
                UpdateGemsText();
            }

            // ::cantrip🔧:check.animation_complete() -> state_transition
            if (progress >= 1.0f)
            {
                isAnimating = false;
                currentCoinsDisplay = targetCoins;
                currentGemsDisplay = targetGems;
                UpdateDisplayImmediate();
            }
        }
    }

    /// <summary>
    /// ::invocation📣:handle.coins_changed_event(amount_changed) -> ui_update
    /// Event handler for coin amount changes
    /// </summary>
    /// <param name="newAmount">New total coin amount</param>
    private void OnCoinsChanged(int newAmount)
    {
        targetCoins = newAmount;
        StartAnimation();

        // ::transmutation🔄:pulse.coins_icon() -> visual_feedback
        if (enablePulseEffect && coinsIcon != null)
        {
            StartCoroutine(PulseIcon(coinsIcon));
        }
    }

    /// <summary>
    /// ::invocation📣:handle.gems_changed_event(amount_changed) -> ui_update
    /// Event handler for gem amount changes
    /// </summary>
    /// <param name="newAmount">New total gem amount</param>
    private void OnGemsChanged(int newAmount)
    {
        targetGems = newAmount;
        StartAnimation();

        // ::transmutation🔄:pulse.gems_icon() -> visual_feedback
        if (enablePulseEffect && gemsIcon != null)
        {
            StartCoroutine(PulseIcon(gemsIcon));
        }
    }

    /// <summary>
    /// ::cantrip🔧:start.animation_sequence() -> active_update
    /// Begin animation of currency values
    /// </summary>
    private void StartAnimation()
    {
        if (!isAnimating)
        {
            animationTimer = 0f;
        }
        isAnimating = true;
    }

    /// <summary>
    /// ::transmutation🔄:pulse.icon_animation(icon) -> visual_feedback
    /// Animate icon with pulse effect for visual feedback
    /// </summary>
    /// <param name="icon">Icon to pulse</param>
    private System.Collections.IEnumerator PulseIcon(Image icon)
    {
        Vector3 originalScale = icon.transform.localScale;
        Vector3 targetScale = originalScale * pulseScale;

        float elapsed = 0f;
        float halfDuration = pulseDuration / 2f;

        // ::transmutation🔄:scale.up() -> enlarged
        while (elapsed < halfDuration)
        {
            elapsed += Time.deltaTime;
            float progress = elapsed / halfDuration;
            icon.transform.localScale = Vector3.Lerp(originalScale, targetScale, progress);
            yield return null;
        }

        elapsed = 0f;
        // ::transmutation🔄:scale.down() -> original_size
        while (elapsed < halfDuration)
        {
            elapsed += Time.deltaTime;
            float progress = elapsed / halfDuration;
            icon.transform.localScale = Vector3.Lerp(targetScale, originalScale, progress);
            yield return null;
        }

        icon.transform.localScale = originalScale;
    }

    /// <summary>
    /// ::invocation📣:update.display_immediate() -> instant_sync
    /// Update display immediately without animation (used for initialization)
    /// </summary>
    private void UpdateDisplayImmediate()
    {
        UpdateCoinsText();
        UpdateGemsText();
    }

    /// <summary>
    /// ::cantrip🔧:format.coins_text() -> formatted_display
    /// Update coins text with formatted number
    /// </summary>
    private void UpdateCoinsText()
    {
        if (coinsText != null)
        {
            coinsText.text = FormatCurrency(currentCoinsDisplay);
        }
    }

    /// <summary>
    /// ::cantrip🔧:format.gems_text() -> formatted_display
    /// Update gems text with formatted number
    /// </summary>
    private void UpdateGemsText()
    {
        if (gemsText != null)
        {
            gemsText.text = FormatCurrency(currentGemsDisplay);
        }
    }

    /// <summary>
    /// ::transmutation🔄:format.number_display(amount) -> readable_string
    /// Format currency amount with thousands separators
    /// </summary>
    /// <param name="amount">Currency amount to format</param>
    /// <returns>Formatted string (e.g., "1,234,567")</returns>
    private string FormatCurrency(int amount)
    {
        // ::cantrip🔧:apply.thousand_separators() -> readable_format
        if (amount >= 1000000)
        {
            return $"{amount / 1000000f:0.##}M";
        }
        else if (amount >= 1000)
        {
            return $"{amount / 1000f:0.##}K";
        }
        else
        {
            return amount.ToString("N0");
        }
    }

    /// <summary>
    /// ::invocation📣:set.visibility(visible) -> ui_state
    /// Show or hide currency display with fade effect
    /// </summary>
    /// <param name="visible">True to show, false to hide</param>
    public void SetVisible(bool visible)
    {
        if (canvasGroup != null)
        {
            StartCoroutine(FadeCanvasGroup(visible ? 1f : 0f));
        }
    }

    /// <summary>
    /// ::transmutation🔄:fade.canvas_group(target_alpha) -> smooth_visibility
    /// Smoothly fade canvas group alpha
    /// </summary>
    /// <param name="targetAlpha">Target alpha value (0-1)</param>
    private System.Collections.IEnumerator FadeCanvasGroup(float targetAlpha)
    {
        float startAlpha = canvasGroup.alpha;
        float elapsed = 0f;
        float fadeDuration = 0.3f;

        while (elapsed < fadeDuration)
        {
            elapsed += Time.deltaTime;
            float progress = elapsed / fadeDuration;
            canvasGroup.alpha = Mathf.Lerp(startAlpha, targetAlpha, progress);
            yield return null;
        }

        canvasGroup.alpha = targetAlpha;
        canvasGroup.interactable = targetAlpha > 0.5f;
        canvasGroup.blocksRaycasts = targetAlpha > 0.5f;
    }

    /// <summary>
    /// ::divination🔮:debug.display_state() -> diagnostic_info
    /// Log current display state for debugging
    /// </summary>
    [ContextMenu("Debug Display State")]
    private void DebugDisplayState()
    {
        Debug.Log($"CurrencyDisplay State:\n" +
                  $"  Current Coins Display: {currentCoinsDisplay}\n" +
                  $"  Target Coins: {targetCoins}\n" +
                  $"  Current Gems Display: {currentGemsDisplay}\n" +
                  $"  Target Gems: {targetGems}\n" +
                  $"  Is Animating: {isAnimating}\n" +
                  $"  Animation Timer: {animationTimer:F2}s");
    }
}
