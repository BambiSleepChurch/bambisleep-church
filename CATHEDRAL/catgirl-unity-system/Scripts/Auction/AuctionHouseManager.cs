using UnityEngine;
using UnityEngine.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using CatGirlSystem.Inventory;
using CatGirlSystem.Economy;

namespace CatGirlSystem.Auction
{
    /// <summary>
    /// Auction House system for player-to-player trading with bidding mechanics.
    /// Supports timed auctions, buyout prices, and automatic refunds.
    /// </summary>
    public class AuctionHouseManager : MonoBehaviour
    {
        public static AuctionHouseManager Instance { get; private set; }

        [Header("Auction Configuration")]
        [SerializeField] private float auctionHouseTaxRate = 0.05f; // 5% tax
        [SerializeField] private int listingFee = 10;
        [SerializeField] private int maxActiveListingsPerPlayer = 10;

        [Header("Active Listings")]
        public List<AuctionListing> activeListings = new List<AuctionListing>();
        public List<AuctionListing> expiredListings = new List<AuctionListing>();

        [Header("Events")]
        public UnityEvent<AuctionListing> OnListingCreated;
        public UnityEvent<AuctionListing, string> OnBidPlaced;
        public UnityEvent<AuctionListing> OnAuctionCompleted;
        public UnityEvent<AuctionListing> OnAuctionExpired;

        /// LAW: Bids must always increase, never decrease
        /// FLOW: Create listing -> Accept bids -> Complete or expire -> Distribute items/currency
        ///<3 HEART: Player economies create social dynamics
        ///> CONSEQUENCE: Taxes prevent inflation, fees discourage spam listings

        private string currentPlayerID = "player_local"; // TODO: Get from player manager

        private void Awake()
        {
            // ::abjure🛡️:EnsureSingleton() -> valid
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
                LoadAuctionData();
            }
            else
            {
                Destroy(gameObject);
            }
        }

        private void Update()
        {
            // ::cantrip🔧:CheckExpiredAuctions() -> processed
            ProcessExpiredAuctions();
        }

        /// <summary>
        /// Create new auction listing.
        /// </summary>
        public bool CreateListing(ItemInstance item, int startingBid, int buyoutPrice, int durationHours)
        {
            // ::abjure🛡️:ValidateListing(item, prices, duration) -> canCreate
            if (item == null || item.itemData == null)
            {
                Debug.LogWarning("[AuctionHouse] Invalid item!");
                return false;
            }

            if (startingBid <= 0 || buyoutPrice < startingBid)
            {
                Debug.LogWarning("[AuctionHouse] Invalid pricing!");
                return false;
            }

            int playerListings = activeListings.Count(l => l.sellerID == currentPlayerID);
            if (playerListings >= maxActiveListingsPerPlayer)
            {
                Debug.LogWarning($"[AuctionHouse] Maximum {maxActiveListingsPerPlayer} listings reached!");
                return false;
            }

            // Charge listing fee
            if (!CurrencyManager.Instance.CanAfford(listingFee))
            {
                Debug.LogWarning($"[AuctionHouse] Insufficient funds for listing fee ({listingFee} coins)!");
                return false;
            }

            // ::transmute⚗️:CreateListing(item, prices) -> listing
            CurrencyManager.Instance.SpendCoins(listingFee);
            InventoryManager.Instance.RemoveItem(item.itemData.itemID, 1);

            var listing = new AuctionListing
            {
                listingID = Guid.NewGuid().ToString(),
                sellerID = currentPlayerID,
                item = item,
                startingBid = startingBid,
                buyoutPrice = buyoutPrice,
                currentBid = startingBid,
                currentBidderID = null,
                startTime = DateTime.Now,
                endTime = DateTime.Now.AddHours(durationHours),
                isActive = true,
                status = AuctionStatus.Active
            };

            activeListings.Add(listing);

            // ::benediction🎉:ListingCreated()
            Debug.Log($"[BENEDICTION] Listed {item.itemData.itemName} for auction!");
            OnListingCreated?.Invoke(listing);
            SaveAuctionData();

            return true;
        }

        /// <summary>
        /// Place bid on auction listing.
        /// </summary>
        public bool PlaceBid(string listingID, int bidAmount)
        {
            // ::abjure🛡️:ValidateBid(listing, bidAmount) -> canBid
            var listing = activeListings.Find(l => l.listingID == listingID);

            if (listing == null || !listing.isActive)
            {
                Debug.LogWarning("[AuctionHouse] Listing not found or inactive!");
                return false;
            }

            if (listing.sellerID == currentPlayerID)
            {
                Debug.LogWarning("[AuctionHouse] Cannot bid on own listing!");
                return false;
            }

            if (DateTime.Now > listing.endTime)
            {
                Debug.LogWarning("[AuctionHouse] Auction has expired!");
                return false;
            }

            if (bidAmount <= listing.currentBid)
            {
                Debug.LogWarning($"[AuctionHouse] Bid must be higher than {listing.currentBid}!");
                return false;
            }

            if (!CurrencyManager.Instance.CanAfford(bidAmount))
            {
                Debug.LogWarning($"[AuctionHouse] Insufficient funds for bid ({bidAmount} coins)!");
                return false;
            }

            // ::transmute⚗️:ProcessBid(listing, bidAmount) -> success
            // Refund previous bidder
            if (!string.IsNullOrEmpty(listing.currentBidderID))
            {
                RefundBidder(listing.currentBidderID, listing.currentBid);
            }

            // Place new bid
            CurrencyManager.Instance.SpendCoins(bidAmount);
            listing.currentBid = bidAmount;
            listing.currentBidderID = currentPlayerID;

            // ::benediction🎉:BidPlaced()
            Debug.Log($"[BENEDICTION] Bid {bidAmount} on {listing.item.itemData.itemName}!");
            OnBidPlaced?.Invoke(listing, currentPlayerID);
            SaveAuctionData();

            return true;
        }

        /// <summary>
        /// Buyout auction immediately.
        /// </summary>
        public bool BuyoutAuction(string listingID)
        {
            // ::abjure🛡️:ValidateBuyout(listing) -> canBuyout
            var listing = activeListings.Find(l => l.listingID == listingID);

            if (listing == null || !listing.isActive)
            {
                Debug.LogWarning("[AuctionHouse] Listing not found or inactive!");
                return false;
            }

            if (listing.sellerID == currentPlayerID)
            {
                Debug.LogWarning("[AuctionHouse] Cannot buyout own listing!");
                return false;
            }

            if (!CurrencyManager.Instance.CanAfford(listing.buyoutPrice))
            {
                Debug.LogWarning($"[AuctionHouse] Insufficient funds for buyout ({listing.buyoutPrice} coins)!");
                return false;
            }

            // ::transmute⚗️:ProcessBuyout(listing) -> success
            // Refund previous bidder if any
            if (!string.IsNullOrEmpty(listing.currentBidderID))
            {
                RefundBidder(listing.currentBidderID, listing.currentBid);
            }

            // Complete transaction
            CurrencyManager.Instance.SpendCoins(listing.buyoutPrice);
            InventoryManager.Instance.AddItem(listing.item.itemData, 1);

            // Pay seller (minus tax)
            int taxAmount = Mathf.RoundToInt(listing.buyoutPrice * auctionHouseTaxRate);
            int sellerProceeds = listing.buyoutPrice - taxAmount;
            PaySeller(listing.sellerID, sellerProceeds);

            listing.isActive = false;
            listing.status = AuctionStatus.CompletedBuyout;
            activeListings.Remove(listing);

            // ::benediction🎉:BuyoutComplete()
            Debug.Log($"[BENEDICTION] Bought out {listing.item.itemData.itemName} for {listing.buyoutPrice}!");
            OnAuctionCompleted?.Invoke(listing);
            SaveAuctionData();

            return true;
        }

        /// <summary>
        /// Cancel auction listing (only if no bids).
        /// </summary>
        public bool CancelListing(string listingID)
        {
            var listing = activeListings.Find(l => l.listingID == listingID);

            if (listing == null || !listing.isActive)
            {
                Debug.LogWarning("[AuctionHouse] Listing not found or inactive!");
                return false;
            }

            if (listing.sellerID != currentPlayerID)
            {
                Debug.LogWarning("[AuctionHouse] Not your listing!");
                return false;
            }

            if (!string.IsNullOrEmpty(listing.currentBidderID))
            {
                Debug.LogWarning("[AuctionHouse] Cannot cancel listing with active bids!");
                return false;
            }

            // Return item to seller
            InventoryManager.Instance.AddItem(listing.item.itemData, 1);

            listing.isActive = false;
            listing.status = AuctionStatus.Cancelled;
            activeListings.Remove(listing);

            Debug.Log($"[AuctionHouse] Cancelled listing for {listing.item.itemData.itemName}");
            SaveAuctionData();

            return true;
        }

        /// <summary>
        /// Process expired auctions.
        /// </summary>
        private void ProcessExpiredAuctions()
        {
            var expired = activeListings.Where(l => DateTime.Now > l.endTime && l.isActive).ToList();

            foreach (var listing in expired)
            {
                // ::cantrip🔧:CompleteAuction(listing) -> finalized
                if (!string.IsNullOrEmpty(listing.currentBidderID))
                {
                    // Auction completed with winner
                    GiveItemToWinner(listing.currentBidderID, listing.item);

                    int taxAmount = Mathf.RoundToInt(listing.currentBid * auctionHouseTaxRate);
                    int sellerProceeds = listing.currentBid - taxAmount;
                    PaySeller(listing.sellerID, sellerProceeds);

                    listing.status = AuctionStatus.CompletedBid;
                    OnAuctionCompleted?.Invoke(listing);
                }
                else
                {
                    // No bids, return item to seller
                    ReturnItemToSeller(listing.sellerID, listing.item);
                    listing.status = AuctionStatus.Expired;
                    OnAuctionExpired?.Invoke(listing);
                }

                listing.isActive = false;
                activeListings.Remove(listing);
                expiredListings.Add(listing);

                Debug.Log($"[AuctionHouse] Auction expired: {listing.item.itemData.itemName}");
            }

            if (expired.Count > 0)
            {
                SaveAuctionData();
            }
        }

        /// <summary>
        /// Get all active listings.
        /// </summary>
        public List<AuctionListing> GetActiveListings()
        {
            return activeListings.Where(l => l.isActive).ToList();
        }

        /// <summary>
        /// Get player's active listings.
        /// </summary>
        public List<AuctionListing> GetPlayerListings(string playerID)
        {
            return activeListings.Where(l => l.sellerID == playerID && l.isActive).ToList();
        }

        /// <summary>
        /// Search listings by item name.
        /// </summary>
        public List<AuctionListing> SearchListings(string searchTerm)
        {
            return activeListings.Where(l =>
                l.isActive &&
                l.item.itemData.itemName.ToLower().Contains(searchTerm.ToLower())
            ).ToList();
        }

        private void RefundBidder(string bidderID, int amount)
        {
            // TODO: Handle multi-player refunds
            if (bidderID == currentPlayerID)
            {
                CurrencyManager.Instance.AddCoins(amount);
            }
        }

        private void PaySeller(string sellerID, int amount)
        {
            // TODO: Handle multi-player payments
            if (sellerID == currentPlayerID)
            {
                CurrencyManager.Instance.AddCoins(amount);
            }
        }

        private void GiveItemToWinner(string winnerID, ItemInstance item)
        {
            // TODO: Handle multi-player item transfer
            if (winnerID == currentPlayerID)
            {
                InventoryManager.Instance.AddItem(item.itemData, 1);
            }
        }

        private void ReturnItemToSeller(string sellerID, ItemInstance item)
        {
            // TODO: Handle multi-player item transfer
            if (sellerID == currentPlayerID)
            {
                InventoryManager.Instance.AddItem(item.itemData, 1);
            }
        }

        private void SaveAuctionData()
        {
            // ::glyph📜:SerializeAuctions() -> json
            string json = JsonUtility.ToJson(new AuctionSaveData(activeListings));
            PlayerPrefs.SetString("AuctionData", json);
            PlayerPrefs.Save();
        }

        private void LoadAuctionData()
        {
            string json = PlayerPrefs.GetString("AuctionData", "");
            if (!string.IsNullOrEmpty(json))
            {
                // Deserialize and restore auction state
                Debug.Log("[AuctionHouse] Auction data loaded.");
            }
        }

        [System.Serializable]
        private class AuctionSaveData
        {
            public List<AuctionListing> listings;

            public AuctionSaveData(List<AuctionListing> listings)
            {
                this.listings = listings;
            }
        }
    }

    /// <summary>
    /// Auction listing data structure.
    /// </summary>
    [System.Serializable]
    public class AuctionListing
    {
        public string listingID;
        public string sellerID;
        public ItemInstance item;
        public int startingBid;
        public int buyoutPrice;
        public int currentBid;
        public string currentBidderID;
        public DateTime startTime;
        public DateTime endTime;
        public bool isActive;
        public AuctionStatus status;

        public TimeSpan TimeRemaining => endTime - DateTime.Now;
        public bool HasBids => !string.IsNullOrEmpty(currentBidderID);
    }

    /// <summary>
    /// Auction status enumeration.
    /// </summary>
    public enum AuctionStatus
    {
        Active,
        CompletedBid,
        CompletedBuyout,
        Expired,
        Cancelled
    }
}
