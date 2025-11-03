using System;

namespace BambisleepChurch.Shared.Interfaces
{
    public interface IShared
    {
        Guid Id { get; set; }
        string Name { get; set; }
        DateTime CreatedAt { get; set; }

        void Initialize();
        void Validate();
    }
}