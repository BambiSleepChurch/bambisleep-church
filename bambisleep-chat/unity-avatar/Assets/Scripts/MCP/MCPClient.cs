/// <summary>
/// 🌸 MCP Client - Unity WebSocket Client
/// Connects to BambiSleep MCP Control Tower for avatar control
/// </summary>

using System;
using System.Collections;
using UnityEngine;
using NativeWebSocket;
using Newtonsoft.Json;

namespace BambiSleep.MCP
{
    [Serializable]
    public class MCPCommand
    {
        public string type;
        public CommandData data;
    }

    [Serializable]
    public class CommandData
    {
        public string emotion;
        public float intensity;
        public string animation;
        public float duration;
    }

    [Serializable]
    public class MCPEvent
    {
        public string type;
        public EventData data;
    }

    [Serializable]
    public class EventData
    {
        public string message;
        public long timestamp;
        public string currentState;
        public float frameRate;
    }

    public class MCPClient : MonoBehaviour
    {
        [Header("🌸 MCP Connection Settings")]
        [SerializeField] private string mcpServerUrl = "ws://localhost:3001";
        [SerializeField] private float reconnectDelay = 3f;
        [SerializeField] private bool autoConnect = true;

        [Header("🎮 Avatar Controller Reference")]
        [SerializeField] private AvatarStateController avatarController;

        private WebSocket websocket;
        private bool isConnected = false;
        private bool shouldReconnect = true;

        // Events
        public event Action OnConnected;
        public event Action OnDisconnected;
        public event Action<string> OnError;

        private void Start()
        {
            if (avatarController == null)
            {
                avatarController = GetComponent<AvatarStateController>();
            }

            if (autoConnect)
            {
                StartCoroutine(ConnectToMCP());
            }
        }

        /// <summary>
        /// Connect to MCP Control Tower
        /// </summary>
        public IEnumerator ConnectToMCP()
        {
            Debug.Log($"🌸 Connecting to MCP Control Tower at {mcpServerUrl}...");

            websocket = new WebSocket(mcpServerUrl);

            websocket.OnOpen += () =>
            {
                Debug.Log("⚡ Connected to MCP Control Tower!");
                isConnected = true;
                OnConnected?.Invoke();
                SendEvent("connected", new EventData
                {
                    message = "Unity avatar connected",
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                    currentState = avatarController != null ? avatarController.CurrentState.ToString() : "unknown"
                });
            };

            websocket.OnMessage += (bytes) =>
            {
                string message = System.Text.Encoding.UTF8.GetString(bytes);
                HandleMCPCommand(message);
            };

            websocket.OnError += (error) =>
            {
                Debug.LogError($"❌ WebSocket error: {error}");
                OnError?.Invoke(error);
            };

            websocket.OnClose += (code) =>
            {
                Debug.Log($"🔌 Disconnected from MCP (code: {code})");
                isConnected = false;
                OnDisconnected?.Invoke();

                if (shouldReconnect)
                {
                    StartCoroutine(ReconnectAfterDelay());
                }
            };

            yield return websocket.Connect();
        }

        /// <summary>
        /// Handle incoming commands from MCP server
        /// </summary>
        private void HandleMCPCommand(string json)
        {
            try
            {
                MCPCommand command = JsonConvert.DeserializeObject<MCPCommand>(json);

                switch (command.type)
                {
                    case "emotion":
                        HandleEmotionCommand(command.data);
                        break;

                    case "animation":
                        HandleAnimationCommand(command.data);
                        break;

                    case "particle":
                        HandleParticleCommand(command.data);
                        break;

                    case "connected":
                        Debug.Log($"💎 {command.data.message}");
                        break;

                    default:
                        Debug.LogWarning($"Unknown command type: {command.type}");
                        break;
                }
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to parse MCP command: {e.Message}");
            }
        }

        /// <summary>
        /// Handle emotion state change
        /// </summary>
        private void HandleEmotionCommand(CommandData data)
        {
            if (avatarController == null)
            {
                Debug.LogWarning("No AvatarStateController assigned!");
                return;
            }

            AvatarState state = ParseEmotionState(data.emotion);
            float intensity = data.intensity > 0 ? data.intensity : 0.8f;

            Debug.Log($"🌸 Changing avatar emotion to {state} (intensity: {intensity})");
            avatarController.TransitionTo(state, intensity);

            // Send telemetry back
            SendEvent("state_change", new EventData
            {
                currentState = state.ToString(),
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            });
        }

        /// <summary>
        /// Handle animation trigger
        /// </summary>
        private void HandleAnimationCommand(CommandData data)
        {
            if (avatarController == null) return;

            Debug.Log($"⚡ Triggering animation: {data.animation}");
            avatarController.TriggerAnimation(data.animation, data.duration);
        }

        /// <summary>
        /// Handle particle effect
        /// </summary>
        private void HandleParticleCommand(CommandData data)
        {
            // TODO: Implement particle system control
            Debug.Log($"✨ Particle effect: {data.animation}");
        }

        /// <summary>
        /// Parse emotion string to AvatarState enum
        /// </summary>
        private AvatarState ParseEmotionState(string emotion)
        {
            return emotion.ToLower() switch
            {
                "idle" => AvatarState.Idle,
                "happy" => AvatarState.Happy,
                "concerned" => AvatarState.Concerned,
                "playful" => AvatarState.Playful,
                "thinking" => AvatarState.Thinking,
                "surprised" => AvatarState.Surprised,
                _ => AvatarState.Idle
            };
        }

        /// <summary>
        /// Send event to MCP server
        /// </summary>
        public void SendEvent(string eventType, EventData data)
        {
            if (!isConnected) return;

            MCPEvent mcpEvent = new MCPEvent
            {
                type = eventType,
                data = data
            };

            string json = JsonConvert.SerializeObject(mcpEvent);
            websocket.SendText(json);
        }

        /// <summary>
        /// Reconnect after delay
        /// </summary>
        private IEnumerator ReconnectAfterDelay()
        {
            Debug.Log($"🔄 Reconnecting in {reconnectDelay} seconds...");
            yield return new WaitForSeconds(reconnectDelay);
            yield return ConnectToMCP();
        }

        private void Update()
        {
#if !UNITY_WEBGL || UNITY_EDITOR
            websocket?.DispatchMessageQueue();
#endif

            // Send telemetry every 5 seconds
            if (isConnected && Time.frameCount % 300 == 0)
            {
                SendEvent("telemetry", new EventData
                {
                    frameRate = 1f / Time.deltaTime,
                    currentState = avatarController?.CurrentState.ToString() ?? "unknown",
                    timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
                });
            }
        }

        private async void OnApplicationQuit()
        {
            shouldReconnect = false;
            if (websocket != null)
            {
                await websocket.Close();
            }
        }
    }
}
