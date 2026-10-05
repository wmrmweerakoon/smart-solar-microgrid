/*
 * File: MicrogridService.cs
 * Module: SE4040 Enterprise Application Development
 * Description: Contains business logic and rules for Microgrid management.
 */

using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Repositories;

namespace SmartSolarMicrogrid.API.Services
{
    /// <summary>
    /// Service for MicrogridNode business logic following the FAT Service pattern.
    /// </summary>
    public class MicrogridService
    {
        private readonly MicrogridRepository _repository;
        private readonly ReservationRepository _reservationRepository;

        public MicrogridService(MicrogridRepository repository, ReservationRepository reservationRepository)
        {
            // Initializes the service with required dependencies
            _repository = repository;
            _reservationRepository = reservationRepository;
        }

        public async Task<List<MicrogridNodeDto>> GetAllNodesAsync()
        {
            // Retrieves all nodes from the system
            var nodes = await _repository.GetAllAsync();
            return nodes.Select(MapToDto).ToList();
        }

        public async Task<MicrogridNodeDto?> GetNodeByIdAsync(string id)
        {
            var node = await _repository.GetByIdAsync(id);
            return node != null ? MapToDto(node) : null;
        }

        public async Task<List<MicrogridNodeDto>> GetNodesByStatusAsync(string status)
        {
            // Retrieves nodes by status from the system
            var nodes = await _repository.GetByStatusAsync(status);
            return nodes.Select(MapToDto).ToList();
        }

        public async Task<MicrogridNodeDto> CreateNodeAsync(MicrogridNodeDto dto)
        {
            // Adds a new node to the system
            if (string.IsNullOrWhiteSpace(dto.NodeName))
                throw new InvalidOperationException("Node name is required.");

            if (dto.Capacity <= 0)
                throw new InvalidOperationException("Capacity must be greater than zero.");

            var node = new MicrogridNode
            {
                NodeName = dto.NodeName,
                Location = dto.Location,
                Capacity = dto.Capacity,
                CurrentLoad = 0,
                Status = "Active",
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                BatteryStorageSlots = dto.BatteryStorageSlots,
                Schedules = dto.Schedules ?? new List<NodeSchedule>(),
                CreatedBy = dto.CreatedBy,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.CreateAsync(node);
            return MapToDto(node);
        }

        public async Task<MicrogridNodeDto?> UpdateNodeAsync(string id, MicrogridNodeDto dto)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.NodeName = dto.NodeName;
            existing.Location = dto.Location;
            existing.Capacity = dto.Capacity;
            existing.CurrentLoad = dto.CurrentLoad;
            existing.Status = dto.Status;
            existing.Latitude = dto.Latitude;
            existing.Longitude = dto.Longitude;
            existing.BatteryStorageSlots = dto.BatteryStorageSlots;
            existing.Schedules = dto.Schedules ?? new List<NodeSchedule>();
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(id, existing);
            return MapToDto(existing);
        }

        public async Task<MicrogridNodeDto?> DeactivateNodeAsync(string id)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            var activeReservations = await _reservationRepository.GetActiveReservationsByNodeIdAsync(id);
            if (activeReservations.Any())
            {
                throw new InvalidOperationException("Cannot deactivate a node that has active energy reservations.");
            }

            existing.Status = "Inactive";
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(id, existing);
            return MapToDto(existing);
        }

        public async Task<bool> DeleteNodeAsync(string id)
        {
            // Deletes the specified node
            var node = await _repository.GetByIdAsync(id);
            if (node == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<long> GetCountAsync() => await _repository.GetCountAsync();
        public async Task<long> GetActiveCountAsync() => await _repository.GetCountByStatusAsync("Active");

        private static MicrogridNodeDto MapToDto(MicrogridNode node) => new MicrogridNodeDto
        {
            Id = node.Id,
            NodeName = node.NodeName,
            Location = node.Location,
            Capacity = node.Capacity,
            CurrentLoad = node.CurrentLoad,
            Status = node.Status,
            Latitude = node.Latitude,
            Longitude = node.Longitude,
            BatteryStorageSlots = node.BatteryStorageSlots,
            Schedules = node.Schedules,
            CreatedBy = node.CreatedBy,
            CreatedAt = node.CreatedAt,
            UpdatedAt = node.UpdatedAt
        };
    }
}
