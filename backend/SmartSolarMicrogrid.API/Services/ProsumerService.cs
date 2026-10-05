/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * System Module Documentation
 * ==============================================================================
 */
using System.Text.RegularExpressions;
using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Repositories;

namespace SmartSolarMicrogrid.API.Services
{
    /// <summary>
    /// Service for Prosumer business logic following the FAT Service pattern.
    /// All validation, NIC handling, activation, and deactivation rules are enforced here.
    /// </summary>
    public class ProsumerService
    {
        private readonly ProsumerRepository _repository;
        private readonly ReservationRepository _reservationRepository;
        private readonly MicrogridRepository _microgridRepository;

        // Sri Lankan NIC pattern: 9 digits followed by V/X, or 12 digits
        private static readonly Regex NicRegex = new Regex(@"^([0-9]{9}[vVxX]|[0-9]{12})$", RegexOptions.Compiled);
        private static readonly Regex EmailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);

        public ProsumerService(
            ProsumerRepository repository,
            ReservationRepository reservationRepository,
            MicrogridRepository microgridRepository)
        {
            _repository = repository;
            _reservationRepository = reservationRepository;
            _microgridRepository = microgridRepository;
        }

        public async Task<List<ProsumerDto>> GetAllProsumersAsync()
        {
            // Executes the GetAllProsumersAsync operation flow
            var prosumers = await _repository.GetAllAsync();
            return prosumers.Select(MapToDto).ToList();
        }

        public async Task<ProsumerDto?> GetProsumerByIdAsync(string nic)
        {
            var prosumer = await _repository.GetByNicAsync(nic.Trim());
            return prosumer != null ? MapToDto(prosumer) : null;
        }

        public async Task<ProsumerDetailsDto?> GetProsumerDetailsAsync(string nic)
        {
            var prosumer = await _repository.GetByNicAsync(nic.Trim());
            if (prosumer == null) return null;

            var dto = new ProsumerDetailsDto
            {
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
                DeactivatedAt = prosumer.DeactivatedAt,
                DeactivationReason = prosumer.DeactivationReason,
                CreatedAt = prosumer.CreatedAt,
                UpdatedAt = prosumer.UpdatedAt
            };

            // Fetch node details if assigned
            if (!string.IsNullOrEmpty(prosumer.MicrogridNodeId))
            {
                var node = await _microgridRepository.GetByIdAsync(prosumer.MicrogridNodeId);
                if (node != null)
                {
                    dto.MicrogridNodeName = node.NodeName;
                    dto.MicrogridLocation = node.Location;
                }
            }

            // Fetch related reservations
            var allReservations = await _reservationRepository.GetReservationsByProsumerIdAsync(prosumer.Nic);
            dto.TotalReservationsCount = allReservations.Count;
            dto.ActiveReservationsCount = allReservations.Count(r => r.Status == "Pending" || r.Status == "Confirmed");
            dto.RecentReservations = allReservations.Take(10).Select(r => new ReservationDto
            {
                Id = r.Id,
                EnergySlotId = r.EnergySlotId,
                BuyerProsumerId = r.BuyerProsumerId,
                SellerProsumerId = r.SellerProsumerId,
                MicrogridNodeId = r.MicrogridNodeId,
                EnergyAmount = r.EnergyAmount,
                TotalPrice = r.TotalPrice,
                Status = r.Status,
                ReservedAt = r.ReservedAt,
                UpdatedAt = r.UpdatedAt,
                Notes = r.Notes
            }).ToList();

            return dto;
        }

        public async Task<List<ProsumerDto>> GetProsumersByStatusAsync(string status)
        {
            // Executes the GetProsumersByStatusAsync operation flow
            var prosumers = await _repository.GetByStatusAsync(status);
            return prosumers.Select(MapToDto).ToList();
        }

        public async Task<List<ProsumerDto>> GetProsumersByNodeAsync(string nodeId)
        {
            // Executes the GetProsumersByNodeAsync operation flow
            var prosumers = await _repository.GetByMicrogridNodeIdAsync(nodeId);
            return prosumers.Select(MapToDto).ToList();
        }

        public async Task<List<ProsumerDto>> SearchProsumersAsync(string? query, string? status, string? nodeId)
        {
            // Executes the SearchProsumersAsync operation flow
            var prosumers = await _repository.SearchAsync(query, status, nodeId);
            return prosumers.Select(MapToDto).ToList();
        }

        public async Task<ProsumerDto> CreateProsumerAsync(CreateProsumerDto dto)
        {
            // Executes the CreateProsumerAsync operation flow
            if (string.IsNullOrWhiteSpace(dto.Nic))
                throw new ArgumentException("NIC is required as the primary identifier.");

            var cleanNic = dto.Nic.Trim().ToUpperInvariant();
            if (!NicRegex.IsMatch(cleanNic))
                throw new ArgumentException("Invalid NIC format. Must be 9 digits followed by 'V'/'X' (e.g., 981234567V) or 12 digits (e.g., 200012345678).");

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Full name is required.");

            if (string.IsNullOrWhiteSpace(dto.Email) || !EmailRegex.IsMatch(dto.Email.Trim()))
                throw new ArgumentException("A valid email address is required.");

            if (dto.SolarCapacity <= 0)
                throw new ArgumentException("Solar capacity must be greater than 0 kW.");

            // Check duplicate NIC
            var existingByNic = await _repository.GetByNicAsync(cleanNic);
            if (existingByNic != null)
                throw new InvalidOperationException($"A prosumer with NIC '{cleanNic}' already exists.");

            // Check duplicate Email
            var existingByEmail = await _repository.GetByEmailAsync(dto.Email.Trim());
            if (existingByEmail != null)
                throw new InvalidOperationException("A prosumer with this email address already exists.");

            var prosumer = new Prosumer
            {
                Nic = cleanNic,
                Name = dto.Name.Trim(),
                Email = dto.Email.Trim(),
                Phone = dto.Phone?.Trim() ?? string.Empty,
                Address = dto.Address?.Trim() ?? string.Empty,
                MicrogridNodeId = dto.MicrogridNodeId ?? string.Empty,
                Status = "Pending",
                SolarCapacity = dto.SolarCapacity,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _repository.CreateAsync(prosumer);
            return MapToDto(prosumer);
        }

        public async Task<ProsumerDto?> UpdateProsumerAsync(string nic, UpdateProsumerDto dto)
        {
            var existing = await _repository.GetByNicAsync(nic.Trim().ToUpperInvariant());
            if (existing == null) return null;

            if (string.IsNullOrWhiteSpace(dto.Name))
                throw new ArgumentException("Full name is required.");

            if (string.IsNullOrWhiteSpace(dto.Email) || !EmailRegex.IsMatch(dto.Email.Trim()))
                throw new ArgumentException("A valid email address is required.");

            if (dto.SolarCapacity <= 0)
                throw new ArgumentException("Solar capacity must be greater than 0 kW.");

            // Check if email changed and is taken by another prosumer
            if (!string.Equals(existing.Email, dto.Email.Trim(), StringComparison.OrdinalIgnoreCase))
            {
                var duplicateEmail = await _repository.GetByEmailAsync(dto.Email.Trim());
                if (duplicateEmail != null && duplicateEmail.Nic != existing.Nic)
                    throw new InvalidOperationException("This email address is already in use by another prosumer.");
            }

            existing.Name = dto.Name.Trim();
            existing.Email = dto.Email.Trim();
            existing.Phone = dto.Phone?.Trim() ?? string.Empty;
            existing.Address = dto.Address?.Trim() ?? string.Empty;
            existing.MicrogridNodeId = dto.MicrogridNodeId ?? string.Empty;
            existing.SolarCapacity = dto.SolarCapacity;
            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                existing.Status = dto.Status;
            }
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(existing.Nic, existing);
            return MapToDto(existing);
        }

        public async Task<bool> ActivateProsumerAsync(string nic, string activatedBy)
        {
            // Executes the ActivateProsumerAsync operation flow
            var prosumer = await _repository.GetByNicAsync(nic.Trim().ToUpperInvariant());
            if (prosumer == null) return false;

            prosumer.Status = "Active";
            prosumer.ActivatedBy = activatedBy;
            prosumer.ActivatedAt = DateTime.UtcNow;
            prosumer.DeactivatedAt = null;
            prosumer.DeactivationReason = string.Empty;
            prosumer.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(prosumer.Nic, prosumer);
            return true;
        }

        public async Task<bool> DeactivateProsumerAsync(string nic, string reason)
        {
            // Executes the DeactivateProsumerAsync operation flow
            var prosumer = await _repository.GetByNicAsync(nic.Trim().ToUpperInvariant());
            if (prosumer == null) return false;

            // Enforce business rule: Prevent deactivation if active reservations exist
            var activeReservations = await _reservationRepository.GetActiveReservationsByProsumerIdAsync(prosumer.Nic);
            if (activeReservations.Any())
            {
                throw new InvalidOperationException("Cannot deactivate a prosumer who has active (Pending or Confirmed) energy reservations. Please resolve active reservations before deactivation.");
            }

            prosumer.Status = "Inactive";
            prosumer.DeactivatedAt = DateTime.UtcNow;
            prosumer.DeactivationReason = string.IsNullOrWhiteSpace(reason) ? "Administrative deactivation" : reason.Trim();
            prosumer.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(prosumer.Nic, prosumer);
            return true;
        }

        public async Task<bool> DeleteProsumerAsync(string nic)
        {
            // Executes the DeleteProsumerAsync operation flow
            var cleanNic = nic.Trim().ToUpperInvariant();
            var prosumer = await _repository.GetByNicAsync(cleanNic);
            if (prosumer == null) return false;

            var activeReservations = await _reservationRepository.GetActiveReservationsByProsumerIdAsync(cleanNic);
            if (activeReservations.Any())
            {
                throw new InvalidOperationException("Cannot delete a prosumer with active reservations.");
            }

            await _repository.DeleteAsync(cleanNic);
            return true;
        }

        public async Task<long> GetCountAsync() => await _repository.GetCountAsync();
        public async Task<long> GetPendingCountAsync() => await _repository.GetCountByStatusAsync("Pending");

        private static ProsumerDto MapToDto(Prosumer prosumer) => new ProsumerDto
        {
            // Executes the GetCountAsync operation flow
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
            DeactivatedAt = prosumer.DeactivatedAt,
            DeactivationReason = prosumer.DeactivationReason,
            CreatedAt = prosumer.CreatedAt,
            UpdatedAt = prosumer.UpdatedAt
        };
    }
}

