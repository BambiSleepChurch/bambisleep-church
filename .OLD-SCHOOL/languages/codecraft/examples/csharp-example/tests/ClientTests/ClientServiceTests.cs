using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using bambisleep_church.client.Services;
using bambisleep_church.client.Models;

namespace bambisleep_church.tests.ClientTests
{
    [TestClass]
    public class ClientServiceTests
    {
        private ClientService _clientService;

        [TestInitialize]
        public void Setup()
        {
            _clientService = new ClientService();
        }

        [TestMethod]
        public void TestFetchClientData_ValidId_ReturnsClientModel()
        {
            // Arrange
            var clientId = 1;

            // Act
            var result = _clientService.FetchClientData(clientId);

            // Assert
            Assert.IsNotNull(result);
            Assert.AreEqual(clientId, result.Id);
        }

        [TestMethod]
        public void TestFetchClientData_InvalidId_ReturnsNull()
        {
            // Arrange
            var clientId = -1;

            // Act
            var result = _clientService.FetchClientData(clientId);

            // Assert
            Assert.IsNull(result);
        }

        [TestMethod]
        public void TestManageClientInteraction_ValidClientModel_ReturnsTrue()
        {
            // Arrange
            var clientModel = new ClientModel { Id = 1, Name = "Test Client", Email = "test@example.com" };

            // Act
            var result = _clientService.ManageClientInteraction(clientModel);

            // Assert
            Assert.IsTrue(result);
        }

        [TestMethod]
        public void TestManageClientInteraction_NullClientModel_ReturnsFalse()
        {
            // Act
            var result = _clientService.ManageClientInteraction(null);

            // Assert
            Assert.IsFalse(result);
        }
    }
}