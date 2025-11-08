/// <summary>
/// 🎮 Avatar State Controller
/// Manages avatar emotions, animations, and visual effects
/// CyberNeonGothWave aesthetic implementation
/// </summary>

using System;
using System.Collections;
using UnityEngine;

namespace BambiSleep.MCP
{
    public enum AvatarState
    {
        Idle,
        Happy,
        Concerned,
        Playful,
        Thinking,
        Surprised
    }

    [Serializable]
    public class EmotionConfig
    {
        public AvatarState state;
        public string animationTrigger;
        public Color glowColor;
        public float particleIntensity;
        public Vector3 cameraOffset;
    }

    public class AvatarStateController : MonoBehaviour
    {
        [Header("🌸 Animator Reference")]
        [SerializeField] private Animator animator;

        [Header("⚡ Visual Effects")]
        [SerializeField] private Renderer avatarRenderer;
        [SerializeField] private ParticleSystem energyTrailParticles;
        [SerializeField] private Light rimLight;

        [Header("💎 CyberNeonGothWave Colors")]
        [SerializeField] private Color cyberCyan = new Color(0f, 0.941f, 1f); // #00F0FF
        [SerializeField] private Color neonPurple = new Color(1f, 0.063f, 0.941f); // #FF10F0
        [SerializeField] private Color hotPink = new Color(1f, 0f, 0.431f); // #FF006E
        [SerializeField] private Color electricLime = new Color(0.224f, 1f, 0.078f); // #39FF14

        [Header("🎨 Emotion Configurations")]
        [SerializeField]
        private EmotionConfig[] emotionConfigs = new EmotionConfig[]
        {
            new EmotionConfig { state = AvatarState.Idle, animationTrigger = "Idle", glowColor = new Color(0f, 0.941f, 1f), particleIntensity = 0.3f },
            new EmotionConfig { state = AvatarState.Happy, animationTrigger = "Happy", glowColor = new Color(0.224f, 1f, 0.078f), particleIntensity = 0.8f },
            new EmotionConfig { state = AvatarState.Concerned, animationTrigger = "Concerned", glowColor = new Color(0f, 0.851f, 1f), particleIntensity = 0.4f },
            new EmotionConfig { state = AvatarState.Playful, animationTrigger = "Playful", glowColor = new Color(1f, 0f, 0.431f), particleIntensity = 1f },
            new EmotionConfig { state = AvatarState.Thinking, animationTrigger = "Thinking", glowColor = new Color(1f, 0.063f, 0.941f), particleIntensity = 0.5f },
            new EmotionConfig { state = AvatarState.Surprised, animationTrigger = "Surprised", glowColor = new Color(1f, 1f, 0f), particleIntensity = 0.9f }
        };

        public AvatarState CurrentState { get; private set; } = AvatarState.Idle;

        private Material avatarMaterial;
        private Coroutine transitionCoroutine;

        private void Awake()
        {
            if (animator == null)
            {
                animator = GetComponent<Animator>();
            }

            if (avatarRenderer != null)
            {
                avatarMaterial = avatarRenderer.material;
            }
        }

        private void Start()
        {
            // Initialize with idle state
            TransitionTo(AvatarState.Idle, 0.5f);
        }

        /// <summary>
        /// Transition to new emotional state
        /// </summary>
        public void TransitionTo(AvatarState newState, float intensity = 0.8f)
        {
            if (CurrentState == newState) return;

            Debug.Log($"🌸 Transitioning from {CurrentState} to {newState}");

            CurrentState = newState;

            // Stop previous transition
            if (transitionCoroutine != null)
            {
                StopCoroutine(transitionCoroutine);
            }

            // Start new transition
            transitionCoroutine = StartCoroutine(TransitionCoroutine(newState, intensity));
        }

        /// <summary>
        /// Smooth transition between states
        /// </summary>
        private IEnumerator TransitionCoroutine(AvatarState targetState, float intensity)
        {
            EmotionConfig config = GetEmotionConfig(targetState);
            if (config == null)
            {
                Debug.LogWarning($"No configuration found for state: {targetState}");
                yield break;
            }

            // Trigger animation
            if (animator != null)
            {
                animator.SetTrigger(config.animationTrigger);
            }

            // Transition duration
            float duration = 0.5f;
            float elapsed = 0f;

            Color startColor = avatarMaterial != null ? avatarMaterial.GetColor("_EmissionColor") : Color.black;
            Color targetColor = config.glowColor * intensity * 2f; // HDR color for emission

            while (elapsed < duration)
            {
                float t = elapsed / duration;
                t = Mathf.SmoothStep(0f, 1f, t); // Smooth curve

                // Lerp emission color
                if (avatarMaterial != null)
                {
                    Color currentColor = Color.Lerp(startColor, targetColor, t);
                    avatarMaterial.SetColor("_EmissionColor", currentColor);
                }

                // Lerp rim light
                if (rimLight != null)
                {
                    rimLight.color = Color.Lerp(startColor, config.glowColor, t);
                    rimLight.intensity = Mathf.Lerp(0.5f, intensity * 2f, t);
                }

                // Adjust particle system
                if (energyTrailParticles != null)
                {
                    var main = energyTrailParticles.main;
                    main.startColor = new ParticleSystem.MinMaxGradient(config.glowColor);
                    var emission = energyTrailParticles.emission;
                    emission.rateOverTime = Mathf.Lerp(5f, config.particleIntensity * 20f, t);
                }

                elapsed += Time.deltaTime;
                yield return null;
            }

            Debug.Log($"⚡ Transition to {targetState} complete!");
        }

        /// <summary>
        /// Trigger specific animation
        /// </summary>
        public void TriggerAnimation(string animationName, float duration = 0f)
        {
            if (animator == null)
            {
                Debug.LogWarning("No animator assigned!");
                return;
            }

            Debug.Log($"⚡ Triggering animation: {animationName}");
            animator.SetTrigger(animationName);

            if (duration > 0)
            {
                StartCoroutine(ResetAnimationAfterDuration(duration));
            }
        }

        /// <summary>
        /// Reset to idle after animation duration
        /// </summary>
        private IEnumerator ResetAnimationAfterDuration(float duration)
        {
            yield return new WaitForSeconds(duration);
            animator.SetTrigger("Idle");
        }

        /// <summary>
        /// Get emotion configuration for state
        /// </summary>
        private EmotionConfig GetEmotionConfig(AvatarState state)
        {
            foreach (var config in emotionConfigs)
            {
                if (config.state == state)
                {
                    return config;
                }
            }
            return null;
        }

        /// <summary>
        /// Trigger particle burst effect
        /// </summary>
        public void TriggerParticleBurst(Color color, int count = 50)
        {
            if (energyTrailParticles == null) return;

            var main = energyTrailParticles.main;
            main.startColor = new ParticleSystem.MinMaxGradient(color);
            energyTrailParticles.Emit(count);
        }

        /// <summary>
        /// Set glow intensity manually
        /// </summary>
        public void SetGlowIntensity(float intensity)
        {
            if (avatarMaterial != null)
            {
                avatarMaterial.SetFloat("_EmissionIntensity", intensity);
            }

            if (rimLight != null)
            {
                rimLight.intensity = intensity;
            }
        }

        private void OnValidate()
        {
            // Ensure emotion configs are initialized
            if (emotionConfigs == null || emotionConfigs.Length == 0)
            {
                emotionConfigs = new EmotionConfig[]
                {
                    new EmotionConfig { state = AvatarState.Idle, animationTrigger = "Idle", glowColor = cyberCyan, particleIntensity = 0.3f },
                    new EmotionConfig { state = AvatarState.Happy, animationTrigger = "Happy", glowColor = electricLime, particleIntensity = 0.8f },
                    new EmotionConfig { state = AvatarState.Concerned, animationTrigger = "Concerned", glowColor = cyberCyan, particleIntensity = 0.4f },
                    new EmotionConfig { state = AvatarState.Playful, animationTrigger = "Playful", glowColor = hotPink, particleIntensity = 1f },
                    new EmotionConfig { state = AvatarState.Thinking, animationTrigger = "Thinking", glowColor = neonPurple, particleIntensity = 0.5f },
                    new EmotionConfig { state = AvatarState.Surprised, animationTrigger = "Surprised", glowColor = Color.yellow, particleIntensity = 0.9f }
                };
            }
        }
    }
}
