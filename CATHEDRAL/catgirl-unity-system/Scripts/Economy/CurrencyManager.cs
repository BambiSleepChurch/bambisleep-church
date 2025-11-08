using UnityEngine;
using UnityEngine.Events;
using System;

namespace CatGirlSystem.Core
{
    /// <summary>
    /// Singleton Currency Manager for handling all in-game currency transactions.
    /// Supports multiple currency types with event-driven updates.
    /// </summary>
    public class CurrencyManager : MonoBehaviour
    {
        public static CurrencyManager Instance { get; private set; }

        [Header("Currency Configuration")]
        [SerializeField] private int startingCoins = 1000;
        [SerializeField] private int startingGems = 100;

        [Header("Current Balances")]
        public int currentCoins;
        public int currentGems;

        [Header("Events")]
        public UnityEvent<int> OnCoinsChanged;
        public UnityEvent<int> OnGemsChanged;
        public UnityEvent<string, int> OnCurrencySpent;
        public UnityEvent<string, int> OnCurrencyAdded;

        /// LAW: Currency values must never go negative
        /// FLOW: Validate amount -> Check balance -> Deduct/Add -> Fire events
        ///<3 HEART: Players feel rewarded when they see currency animations
        ///⚡ PERF: Event system allows UI to subscribe without polling

        private void Awake()
        {
            // ::abjure🛡️:EnsureSingleton() -> valid
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                InitializeCurrency();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void InitializeCurrency()
        {
            // ::cantrip🔧:LoadSavedCurrency() -> balances
            currentCoins = PlayerPrefs.GetInt("SavedCoins", startingCoins);
            currentGems = PlayerPrefs.GetInt("SavedGems", startingGems);

            OnCoinsChanged?.Invoke(currentCoins);
            OnGemsChanged?.Invoke(currentGems);
        }

        /// <summary>
        /// Attempt to spend coins. Returns true if successful.
        /// </summary>
        public bool SpendCoins(int amount)
        {
            // ::abjure🛡️:ValidateTransaction(amount) -> canAfford
            if (amount < 0 || currentCoins < amount)
            {
                Debug.LogWarning($"[CurrencyManager] Cannot spend {amount} coins. Current: {currentCoins}");
                return false;
            }

            // ::transmute⚗️:DeductCurrency(amount) -> newBalance
            currentCoins -= amount;
            SaveCurrency();

            OnCoinsChanged?.Invoke(currentCoins);
            OnCurrencySpent?.Invoke("Coins", amount);

            return true;
        }

        /// <summary>
        /// Add coins to player balance.
        /// </summary>
        public void AddCoins(int amount)
        {
            // ::conjure🎨:GrantCurrency(amount) -> newBalance
            if (amount < 0)
            {
                Debug.LogError("[CurrencyManager] Cannot add negative coins!");
                return;
            }

            currentCoins += amount;
            SaveCurrency();

            OnCoinsChanged?.Invoke(currentCoins);
            OnCurrencyAdded?.Invoke("Coins", amount);

            // ::benediction🎉:CelebrateCurrencyGain()
            Debug.Log($"[BENEDICTION] Added {amount} coins! New balance: {currentCoins}");
        }

        /// <summary>
        /// Spend gems (premium currency).
        /// </summary>
        public bool SpendGems(int amount)
        {
            if (amount < 0 || currentGems < amount)
            {
                Debug.LogWarning($"[CurrencyManager] Cannot spend {amount} gems. Current: {currentGems}");
                return false;
            }

            currentGems -= amount;
            SaveCurrency();

            OnGemsChanged?.Invoke(currentGems);
            OnCurrencySpent?.Invoke("Gems", amount);

            return true;
        }

        /// <summary>
        /// Add gems to player balance.
        /// </summary>
        public void AddGems(int amount)
        {
            if (amount < 0)
            {
                Debug.LogError("[CurrencyManager] Cannot add negative gems!");
                return;
            }

            currentGems += amount;
            SaveCurrency();

            OnGemsChanged?.Invoke(currentGems);
            OnCurrencyAdded?.Invoke("Gems", amount);
        }

        /// <summary>
        /// Check if player can afford a purchase.
        /// </summary>
        public bool CanAfford(int coinCost, int gemCost = 0)
        {
            return currentCoins >= coinCost && currentGems >= gemCost;
        }

        /// <summary>
        /// Get current coin balance.
        /// </summary>
        public int GetCoins() => currentCoins;

        /// <summary>
        /// Get current gem balance.
        /// </summary>
        public int GetGems() => currentGems;

        /// <summary>
        /// Save currency state to PlayerPrefs.
        /// </summary>
        private void SaveCurrency()
        {
            // ::glyph📜:PersistCurrency() -> saved
            PlayerPrefs.SetInt("SavedCoins", currentCoins);
            PlayerPrefs.SetInt("SavedGems", currentGems);
            PlayerPrefs.Save();
        }

        /// <summary>
        /// Reset currency to starting values (for testing/debug).
        /// </summary>
        [ContextMenu("Reset Currency")]
        public void ResetCurrency()
        {
            currentCoins = startingCoins;
            currentGems = startingGems;
            SaveCurrency();

            OnCoinsChanged?.Invoke(currentCoins);
            OnGemsChanged?.Invoke(currentGems);

            Debug.Log("[CurrencyManager] Currency reset to starting values.");
        }

        private void OnApplicationQuit()
        {
            SaveCurrency();
        }
    }
}
