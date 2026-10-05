/*
 * File: ReservationService.cs
 * Module: SE4040 Enterprise Application Development
 * Description: Contains business logic and rules for Reservation management.
 */

using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Repositories;

namespace SmartSolarMicrogrid.API.Services
{
    /// <summary>
    /// Service for Reservation business logic following the FAT Service pattern.
    /// Enforces the Seven-Day scheduling rule and 12-Hour update/cancellation notice requirement.
    /// </summary>
    public class ReservationService
    {
        private readonly ReservationRepository _repository;
        private readonly EnergySlotRepository _slotRepository;
        private readonly ProsumerRepository _prosumerRepository;
        private readonly MicrogridRepository _microgridRepository;

        public ReservationService(
            ReservationRepository repository,
            EnergySlotRepository slotRepository,
            ProsumerRepository prosumerRepository,
            MicrogridRepository microgridRepository)
        {
            _repository = repository;
            _slotRepository = slotRepository;
            _prosumerRepository = prosumerRepository;
            _microgridRepository = microgridRepository;
        }

        public async Task<List<ReservationDto>> GetAllReservationsAsync()
        {
            // Retrieves all reservations from the system
            var reservations = await _repository.GetAllAsync();
            return reservations.Select(MapToDto).ToList();
        }

        public async Task<ReservationDto?> GetReservationByIdAsync(string id)
        {
            var reservation = await _repository.GetByIdAsync(id);
            return reservation != null ? MapToDto(reservation) : null;
        }

        public async Task<ReservationDetailsDto?> GetReservationDetailsByIdAsync(string id)
        {
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) return null;

            var dto = new ReservationDetailsDto
            {
                Id = reservation.Id,
                EnergySlotId = reservation.EnergySlotId,
                BuyerProsumerId = reservation.BuyerProsumerId,
                SellerProsumerId = reservation.SellerProsumerId,
                MicrogridNodeId = reservation.MicrogridNodeId,
                EnergyAmount = reservation.EnergyAmount,
                TotalPrice = reservation.TotalPrice,
                Status = reservation.Status,
                ReservedAt = reservation.ReservedAt,
                UpdatedAt = reservation.UpdatedAt,
                Notes = reservation.Notes
            };

            // Populate Buyer Details
            var buyer = await _prosumerRepository.GetByNicAsync(reservation.BuyerProsumerId);
            if (buyer != null)
            {
                dto.BuyerName = buyer.Name;
                dto.BuyerEmail = buyer.Email;
                dto.BuyerPhone = buyer.Phone;
            }

            // Populate Seller Details
            var seller = await _prosumerRepository.GetByNicAsync(reservation.SellerProsumerId);
            if (seller != null)
            {
                dto.SellerName = seller.Name;
                dto.SellerEmail = seller.Email;
                dto.SellerPhone = seller.Phone;
            }

            // Populate Microgrid Details
            var node = await _microgridRepository.GetByIdAsync(reservation.MicrogridNodeId);
            if (node != null)
            {
                dto.MicrogridNodeName = node.NodeName;
                dto.MicrogridLocation = node.Location;
            }

            // Populate Slot Details & Notice calculations
            var slot = await _slotRepository.GetByIdAsync(reservation.EnergySlotId);
            if (slot != null)
            {
                dto.SlotDate = slot.SlotDate;
                dto.StartTime = slot.StartTime;
                dto.EndTime = slot.EndTime;
                dto.PricePerUnit = slot.PricePerUnit;

                var slotStart = GetSlotStartDateTime(slot);
                var timeRemaining = slotStart - DateTime.UtcNow;
                dto.HoursUntilSlot = Math.Round(timeRemaining.TotalHours, 1);
                dto.CanModifyOrCancel = timeRemaining >= TimeSpan.FromHours(12) 
                                      && reservation.Status != "Cancelled" 
                                      && reservation.Status != "Completed";
            }

            return dto;
        }

        public async Task<List<ReservationDto>> GetReservationsByStatusAsync(string status)
        {
            // Retrieves reservations by status from the system
            var reservations = await _repository.GetByStatusAsync(status);
            return reservations.Select(MapToDto).ToList();
        }

        public async Task<ReservationDto> CreateReservationAsync(CreateReservationRequest request)
        {
            // Adds a new reservation to the system
            if (string.IsNullOrWhiteSpace(request.EnergySlotId))
                throw new InvalidOperationException("Energy Slot ID is required.");

            if (string.IsNullOrWhiteSpace(request.BuyerProsumerId))
                throw new InvalidOperationException("Buyer Prosumer NIC is required.");

            // 1. Validate energy slot exists and is Available
            var slot = await _slotRepository.GetByIdAsync(request.EnergySlotId);
            if (slot == null)
                throw new InvalidOperationException("Energy slot not found.");

            if (slot.Status != "Available")
                throw new InvalidOperationException($"Energy slot is currently '{slot.Status}' and cannot be reserved.");

            // 2. Validate Seven-Day Rule: Reservations must be scheduled within 7 days from now
            var slotStart = GetSlotStartDateTime(slot);
            var now = DateTime.UtcNow;

            if (slotStart < now)
                throw new InvalidOperationException("Cannot reserve an energy slot that has already started or passed.");

            if (slotStart > now.AddDays(7))
                throw new InvalidOperationException("Reservations must be scheduled within seven days from today. This slot is scheduled beyond the 7-day limit.");

            // 3. Validate Buyer Prosumer
            var cleanBuyerNic = request.BuyerProsumerId.Trim().ToUpperInvariant();
            var buyer = await _prosumerRepository.GetByNicAsync(cleanBuyerNic);
            if (buyer == null)
                throw new InvalidOperationException($"Buyer prosumer with NIC '{cleanBuyerNic}' not found.");

            if (buyer.Status != "Active")
                throw new InvalidOperationException($"Buyer prosumer account is currently '{buyer.Status}'. Only Active prosumers are permitted to reserve energy.");

            // 4. Prevent self-trading
            if (string.Equals(buyer.Nic, slot.ProsumerId, StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("A prosumer cannot reserve their own energy slot.");

            // 5. Validate Energy Amount
            if (request.EnergyAmount <= 0)
                throw new InvalidOperationException("Reserved energy amount must be greater than zero.");

            if (request.EnergyAmount > slot.EnergyAmount)
                throw new InvalidOperationException($"Requested energy amount ({request.EnergyAmount} kWh) exceeds available slot capacity ({slot.EnergyAmount} kWh).");

            var totalPrice = (decimal)request.EnergyAmount * slot.PricePerUnit;

            var reservation = new Reservation
            {
                EnergySlotId = slot.Id,
                BuyerProsumerId = buyer.Nic,
                SellerProsumerId = slot.ProsumerId,
                MicrogridNodeId = slot.MicrogridNodeId,
                EnergyAmount = request.EnergyAmount,
                TotalPrice = totalPrice,
                Status = "Pending",
                ReservedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Notes = request.Notes?.Trim() ?? string.Empty
            };

            await _repository.CreateAsync(reservation);

            // Mark the energy slot as Booked
            slot.Status = "Booked";
            slot.UpdatedAt = DateTime.UtcNow;
            await _slotRepository.UpdateAsync(slot.Id, slot);

            return MapToDto(reservation);
        }

        public async Task<ReservationDto?> UpdateReservationAsync(string id, UpdateReservationRequest request)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            if (existing.Status == "Cancelled" || existing.Status == "Completed")
                throw new InvalidOperationException($"Cannot modify a reservation that is already {existing.Status}.");

            var slot = await _slotRepository.GetByIdAsync(existing.EnergySlotId);
            if (slot == null)
                throw new InvalidOperationException("Associated energy slot not found.");

            // 12-Hour notice requirement check
            var slotStart = GetSlotStartDateTime(slot);
            var now = DateTime.UtcNow;
            var timeRemaining = slotStart - now;

            if (timeRemaining < TimeSpan.FromHours(12))
            {
                throw new InvalidOperationException(
                    $"Reservation updates require at least 12 hours' notice before the scheduled slot start ({slotStart:yyyy-MM-dd HH:mm} UTC). Time remaining: {timeRemaining.TotalHours:F1} hours.");
            }

            if (request.EnergyAmount <= 0)
                throw new InvalidOperationException("Energy amount must be greater than zero.");

            if (request.EnergyAmount > slot.EnergyAmount)
                throw new InvalidOperationException($"Requested energy amount ({request.EnergyAmount} kWh) exceeds slot capacity ({slot.EnergyAmount} kWh).");

            existing.EnergyAmount = request.EnergyAmount;
            existing.TotalPrice = (decimal)request.EnergyAmount * slot.PricePerUnit;
            existing.Notes = request.Notes?.Trim() ?? string.Empty;
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(id, existing);
            return MapToDto(existing);
        }

        public async Task<bool> ConfirmReservationAsync(string id)
        {
            // Confirms the reservation
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) return false;

            if (reservation.Status != "Pending")
                throw new InvalidOperationException($"Only Pending reservations can be confirmed. Current status: '{reservation.Status}'.");

            reservation.Status = "Confirmed";
            reservation.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(id, reservation);
            return true;
        }

        public async Task<bool> CancelReservationAsync(string id)
        {
            // Cancels the reservation
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) return false;

            if (reservation.Status == "Cancelled")
                return true;

            if (reservation.Status == "Completed")
                throw new InvalidOperationException("Completed reservations cannot be cancelled.");

            var slot = await _slotRepository.GetByIdAsync(reservation.EnergySlotId);
            if (slot != null)
            {
                // 12-Hour notice requirement check
                var slotStart = GetSlotStartDateTime(slot);
                var now = DateTime.UtcNow;
                var timeRemaining = slotStart - now;

                if (timeRemaining < TimeSpan.FromHours(12))
                {
                    throw new InvalidOperationException(
                        $"Reservation cancellations require at least 12 hours' notice before the scheduled slot start ({slotStart:yyyy-MM-dd HH:mm} UTC). Time remaining: {timeRemaining.TotalHours:F1} hours.");
                }

                // Release the slot back to Available
                slot.Status = "Available";
                slot.UpdatedAt = DateTime.UtcNow;
                await _slotRepository.UpdateAsync(slot.Id, slot);
            }

            reservation.Status = "Cancelled";
            reservation.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(id, reservation);

            return true;
        }

        public async Task<bool> CompleteReservationAsync(string id)
        {
            // Marks the reservation as complete
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) return false;

            if (reservation.Status != "Confirmed")
                throw new InvalidOperationException($"Only Confirmed reservations can be completed. Current status: '{reservation.Status}'.");

            reservation.Status = "Completed";
            reservation.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(id, reservation);

            // Mark the energy slot as Completed
            var slot = await _slotRepository.GetByIdAsync(reservation.EnergySlotId);
            if (slot != null)
            {
                slot.Status = "Completed";
                slot.UpdatedAt = DateTime.UtcNow;
                await _slotRepository.UpdateAsync(slot.Id, slot);
            }

            return true;
        }

        public async Task<bool> DeleteReservationAsync(string id)
        {
            // Deletes the specified reservation
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) return false;

            // If deleting an active reservation, release the slot
            if (reservation.Status == "Pending" || reservation.Status == "Confirmed")
            {
                var slot = await _slotRepository.GetByIdAsync(reservation.EnergySlotId);
                if (slot != null && slot.Status == "Booked")
                {
                    slot.Status = "Available";
                    slot.UpdatedAt = DateTime.UtcNow;
                    await _slotRepository.UpdateAsync(slot.Id, slot);
                }
            }

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<long> GetCountAsync() => await _repository.GetCountAsync();
        public async Task<long> GetPendingCountAsync() => await _repository.GetCountByStatusAsync("Pending");

        private static DateTime GetSlotStartDateTime(EnergySlot slot)
        {
            if (TimeSpan.TryParse(slot.StartTime, out var timeSpan))
            {
                return slot.SlotDate.Date.Add(timeSpan);
            }
            return slot.SlotDate.Date;
        }

        private static ReservationDto MapToDto(Reservation r) => new ReservationDto
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
        };
    }
}
