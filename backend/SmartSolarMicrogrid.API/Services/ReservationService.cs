using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Repositories;

namespace SmartSolarMicrogrid.API.Services
{
    /// <summary>
    /// Service for Reservation business logic following the FAT Service pattern.
    /// </summary>
    public class ReservationService
    {
        private readonly ReservationRepository _repository;
        private readonly EnergySlotRepository _slotRepository;

        public ReservationService(ReservationRepository repository, EnergySlotRepository slotRepository)
        {
            _repository = repository;
            _slotRepository = slotRepository;
        }

        public async Task<List<ReservationDto>> GetAllReservationsAsync()
        {
            var reservations = await _repository.GetAllAsync();
            return reservations.Select(MapToDto).ToList();
        }

        public async Task<ReservationDto?> GetReservationByIdAsync(string id)
        {
            var reservation = await _repository.GetByIdAsync(id);
            return reservation != null ? MapToDto(reservation) : null;
        }

        public async Task<List<ReservationDto>> GetReservationsByStatusAsync(string status)
        {
            var reservations = await _repository.GetByStatusAsync(status);
            return reservations.Select(MapToDto).ToList();
        }

        public async Task<ReservationDto> CreateReservationAsync(ReservationDto dto)
        {
            // Validate energy slot exists and is available
            var slot = await _slotRepository.GetByIdAsync(dto.EnergySlotId);
            if (slot == null)
                throw new InvalidOperationException("Energy slot not found.");

            if (slot.Status != "Available")
                throw new InvalidOperationException("Energy slot is not available for reservation.");

            var reservation = new Reservation
            {
                EnergySlotId = dto.EnergySlotId,
                BuyerProsumerId = dto.BuyerProsumerId,
                SellerProsumerId = dto.SellerProsumerId,
                MicrogridNodeId = dto.MicrogridNodeId,
                EnergyAmount = dto.EnergyAmount,
                TotalPrice = dto.TotalPrice,
                Status = "Pending",
                ReservedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Notes = dto.Notes
            };

            await _repository.CreateAsync(reservation);

            // Update the energy slot status to Booked
            slot.Status = "Booked";
            slot.UpdatedAt = DateTime.UtcNow;
            await _slotRepository.UpdateAsync(slot.Id, slot);

            return MapToDto(reservation);
        }

        public async Task<ReservationDto?> UpdateReservationAsync(string id, ReservationDto dto)
        {
            var existing = await _repository.GetByIdAsync(id);
            if (existing == null) return null;

            existing.BuyerProsumerId = dto.BuyerProsumerId;
            existing.SellerProsumerId = dto.SellerProsumerId;
            existing.MicrogridNodeId = dto.MicrogridNodeId;
            existing.EnergyAmount = dto.EnergyAmount;
            existing.TotalPrice = dto.TotalPrice;
            existing.Notes = dto.Notes;
            existing.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAsync(id, existing);
            return MapToDto(existing);
        }

        public async Task<bool> ConfirmReservationAsync(string id)
        {
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) return false;

            reservation.Status = "Confirmed";
            reservation.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(id, reservation);
            return true;
        }

        public async Task<bool> CancelReservationAsync(string id)
        {
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) return false;

            reservation.Status = "Cancelled";
            reservation.UpdatedAt = DateTime.UtcNow;
            await _repository.UpdateAsync(id, reservation);

            // Release the energy slot back to Available
            var slot = await _slotRepository.GetByIdAsync(reservation.EnergySlotId);
            if (slot != null)
            {
                slot.Status = "Available";
                slot.UpdatedAt = DateTime.UtcNow;
                await _slotRepository.UpdateAsync(slot.Id, slot);
            }

            return true;
        }

        public async Task<bool> CompleteReservationAsync(string id)
        {
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) return false;

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
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) return false;

            await _repository.DeleteAsync(id);
            return true;
        }

        public async Task<long> GetCountAsync() => await _repository.GetCountAsync();
        public async Task<long> GetPendingCountAsync() => await _repository.GetCountByStatusAsync("Pending");

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
