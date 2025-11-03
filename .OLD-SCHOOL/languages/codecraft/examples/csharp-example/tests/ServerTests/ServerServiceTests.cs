using System;
using Xunit;
using bambisleep_church.src.server.Services;

namespace bambisleep_church.tests.ServerTests
{
    public class ServerServiceTests
    {
        private readonly ServerService _serverService;

        public ServerServiceTests()
        {
            _serverService = new ServerService();
        }

        [Fact]
        public void Test_ProcessRequest_ShouldReturnExpectedResult()
        {
            // Arrange
            var request = "Test Request";
            var expectedResponse = "Expected Response";

            // Act
            var result = _serverService.ProcessRequest(request);

            // Assert
            Assert.Equal(expectedResponse, result);
        }

        [Fact]
        public void Test_ManageResources_ShouldIncreaseResourceCount()
        {
            // Arrange
            var initialCount = _serverService.GetResourceCount();

            // Act
            _serverService.ManageResources();

            // Assert
            Assert.True(_serverService.GetResourceCount() > initialCount);
        }
    }
}