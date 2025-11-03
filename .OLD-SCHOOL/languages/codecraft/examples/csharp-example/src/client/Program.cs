using System;

namespace BambisleepChurch.Client
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // Initialize client services
            var clientService = new Services.ClientService();
            clientService.Start();

            // Start the client application
            Console.WriteLine("Client application started.");
        }
    }
}