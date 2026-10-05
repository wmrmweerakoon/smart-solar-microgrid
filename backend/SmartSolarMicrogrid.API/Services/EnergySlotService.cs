/*
 * File: EnergySlotService.cs
 * Module: SE4040 Enterprise Application Development
 * Description: Contains business logic and rules for EnergySlot management.
 */

using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Repositories;

namespace SmartSolarMicrogrid.API.Services
{
    /// <summary>
    /// Service for EnergySlot business logic following the FAT Service pattern.
    /// </summary>
    public class EnergySlotService
    {
        private readonly EnergySlotRepository _repository;

        public EnergySlotService(EnergySlotRepository repository)
        {
            // Initializes the service with required dependencies
            _repository = repository;
        }

        public async Task<List<EnergySlotDto>> GetAllSlotsAsync()
        {
            // Retrieves all slots from the system
            var slots = await _repository.GetAllAsync();
            return slots.Select(MapToDto).ToList();
        }

        public async Task<EnergySlotDto?> GetSlotByIdAsync(string id)
        {
            var slot = await _repository.GetByIdAsync(id);
            return slot != null ? MapToDto(slot) : null;
        }

        public async Task<List<EnergySlotDto>> GetSlotsByStatusAsync(string status)
        {
            // Retrieves slots by status from the system
            var slots = await _repository.GetByStatusAsync(status);
            return slots.Select(MapToDto).ToList();
        }

        public async Task<List<EnergySlotDto>> GetSlotsByProsumerAsync(string prosumerId)
        {
            // Retrieves slots by prosumer from the system
            var slots = await _repository.GetByProsumerIdAsync(prosumerId);
            return slots.Select(MapToDto).ToList();
        }

        public async Task<List<EnergySlotDto>> GetSlotsByNodeAsync(string nodeId)
        {
            // Retrieves slots by node from the system
            var slots = await _repository.GetByMicrogridNodeIdAsync(nodeId);
            return slots.Select(MapToDto).ToList();
        }

        public async Task<EnergySlotDto> CreateSlotAsync(EnergySlotDto dto)
        {
            // Adds a new slot to the system
            if (dto.EnergyAmount <= 0)
                throw new InvalidOperationException("Energy amount must be greater than zero.");

            if (dto.PricePerUnit <= 0)
                throw new InvalidOperationException("Price per unit must be greater than zero.");

            var slot = new EnergySlot
            {
                MicrogridNodeId = dto.MicrogridNodeId,
                ProsumerId = dto.ProsumerId,
                EnergyAmount = dto.EnergyAmount,
                PricePerUnit = dto.PricePerUnit,
                SlotDate = dto.SlotDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Status = "Available",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.CreateAsync(slot);
            return MapToDto(slot);
        }

        public async Task<EnergySlotDto?> UpdateSlotAsync(string id, EnergySlotDto dto)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.MicrogridNodeId = dto.MicrogridNodeId;
            existing.ProsumerId = dto.ProsumerId;
            existing.EnergyAmount = dto.EnergyAmount;
            existing.PricePerUnit = dto.PricePerUnit;
            existing.SlotDate = dto.SlotDate;
            existing.StartTime = dto.StartTime;
            existing.EndTime = dto.EndTime;
            existing.Status = dto.Status;
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(id, existing);
            return MapToDto(existing);
        }

        public async Task<bool> DeleteSlotAsync(string id)
        {
            // Deletes the specified slot
            var slot = await _repository.GetByIdAsync(id);
            if (slot == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<long> GetCountAsync() => await _repository.GetCountAsync();
        public async Task<long> GetAvailableCountAsync() => await _repository.GetCountByStatusAsync("Available");

        private static EnergySlotDto MapToDto(EnergySlot slot) => new EnergySlotDto
        {
            Id = slot.Id,
            MicrogridNodeId = slot.MicrogridNodeId,
            ProsumerId = slot.ProsumerId,
            EnergyAmount = slot.EnergyAmount,
            PricePerUnit = slot.PricePerUnit,
            SlotDate = slot.SlotDate,
            StartTime = slot.StartTime,
            EndTime = slot.EndTime,
            Status = slot.Status,
            CreatedAt = slot.CreatedAt,
            UpdatedAt = slot.UpdatedAt
        };
    }
}
