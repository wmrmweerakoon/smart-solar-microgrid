/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * File: EnergySlotService.cs
 * Purpose: Encapsulates the core business logic and rules for EnergySlot management.
 * ==============================================================================
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
            _repository = repository;
        }

        public async Task<List<EnergySlotDto>> GetAllSlotsAsync()
        {
            // Executes the GetAllSlotsAsync operation flow
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
            // Executes the GetSlotsByStatusAsync operation flow
            var slots = await _repository.GetByStatusAsync(status);
            return slots.Select(MapToDto).ToList();
        }

        public async Task<List<EnergySlotDto>> GetSlotsByProsumerAsync(string prosumerId)
        {
            // Executes the GetSlotsByProsumerAsync operation flow
            var slots = await _repository.GetByProsumerIdAsync(prosumerId);
            return slots.Select(MapToDto).ToList();
        }

        public async Task<List<EnergySlotDto>> GetSlotsByNodeAsync(string nodeId)
        {
            // Executes the GetSlotsByNodeAsync operation flow
            var slots = await _repository.GetByMicrogridNodeIdAsync(nodeId);
            return slots.Select(MapToDto).ToList();
        }

        public async Task<EnergySlotDto> CreateSlotAsync(EnergySlotDto dto)
        {
            // Executes the CreateSlotAsync operation flow
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
            // Executes the DeleteSlotAsync operation flow
            var slot = await _repository.GetByIdAsync(id);
            if (slot == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<long> GetCountAsync() => await _repository.GetCountAsync();
        public async Task<long> GetAvailableCountAsync() => await _repository.GetCountByStatusAsync("Available");

        private static EnergySlotDto MapToDto(EnergySlot slot) => new EnergySlotDto
        {
            // Executes the GetCountAsync operation flow
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


