using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Repositories;

namespace SmartSolarMicrogrid.API.Services
{
    /// <summary>
    /// Service for Prosumer business logic following the FAT Service pattern.
    /// All validation and business rules are enforced here.
    /// </summary>
    public class ProsumerService
    {
        private readonly ProsumerRepository _repository;

        public ProsumerService(ProsumerRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<ProsumerDto>> GetAllProsumersAsync()
        {
            var prosumers = await _repository.GetAllAsync();
            return prosumers.Select(MapToDto).ToList();
        }

        public async Task<ProsumerDto?> GetProsumerByIdAsync(string id)
        {
            var prosumer = await _repository.GetByIdAsync(id);
            return prosumer != null ? MapToDto(prosumer) : null;
        }

        public async Task<List<ProsumerDto>> GetProsumersByStatusAsync(string status)
        {
            var prosumers = await _repository.GetByStatusAsync(status);
            return prosumers.Select(MapToDto).ToList();
        }

        public async Task<List<ProsumerDto>> GetProsumersByNodeAsync(string nodeId)
        {
            var prosumers = await _repository.GetByMicrogridNodeIdAsync(nodeId);
            return prosumers.Select(MapToDto).ToList();
        }

        public async Task<ProsumerDto> CreateProsumerAsync(ProsumerDto dto)
        {
            // Validate unique email
            var existing = await _repository.GetByEmailAsync(dto.Email);
            if (existing != null)
                throw new InvalidOperationException("A prosumer with this email already exists.");

            var prosumer = new Prosumer
            {
                Nic = dto.Nic,
                Name = dto.Name,
                Email = dto.Email,
                Phone = dto.Phone,
                Address = dto.Address,
                MicrogridNodeId = dto.MicrogridNodeId,
                Status = "Pending",
                SolarCapacity = dto.SolarCapacity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.CreateAsync(prosumer);
            return MapToDto(prosumer);
        }

        public async Task<ProsumerDto?> UpdateProsumerAsync(string id, ProsumerDto dto)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.Name = dto.Name;
            existing.Email = dto.Email;
            existing.Phone = dto.Phone;
            existing.Address = dto.Address;
            existing.MicrogridNodeId = dto.MicrogridNodeId;
            existing.SolarCapacity = dto.SolarCapacity;
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(id, existing);
            return MapToDto(existing);
        }

        public async Task<bool> ActivateProsumerAsync(string id, string activatedBy)
        {
            var prosumer = await _repository.GetByIdAsync(id);
            if (prosumer == null) return false;

            prosumer.Status = "Active";
            prosumer.ActivatedBy = activatedBy;
            prosumer.ActivatedAt = DateTime.UtcNow;
            prosumer.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(id, prosumer);
            return true;
        }

        public async Task<bool> DeactivateProsumerAsync(string id)
        {
            var prosumer = await _repository.GetByIdAsync(id);
            if (prosumer == null) return false;

            prosumer.Status = "Inactive";
            prosumer.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(id, prosumer);
            return true;
        }

        public async Task<bool> DeleteProsumerAsync(string id)
        {
            var prosumer = await _repository.GetByIdAsync(id);
            if (prosumer == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<long> GetCountAsync() => await _repository.GetCountAsync();
        public async Task<long> GetPendingCountAsync() => await _repository.GetCountByStatusAsync("Pending");

        private static ProsumerDto MapToDto(Prosumer prosumer) => new ProsumerDto
        {
            Id = prosumer.Id,
            Nic = prosumer.Nic,
            Name = prosumer.Name,
            Email = prosumer.Email,
            Phone = prosumer.Phone,
            Address = prosumer.Address,
            MicrogridNodeId = prosumer.MicrogridNodeId,
            Status = prosumer.Status,
            SolarCapacity = prosumer.SolarCapacity,
            ActivatedBy = prosumer.ActivatedBy,
            ActivatedAt = prosumer.ActivatedAt,
            CreatedAt = prosumer.CreatedAt,
            UpdatedAt = prosumer.UpdatedAt
        };
    }
}
