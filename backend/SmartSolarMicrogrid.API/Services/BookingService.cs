using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Repositories;

namespace SmartSolarMicrogrid.API.Services
{
    /// <summary>
    /// Service for Booking business logic following the FAT Service pattern.
    /// Bookings represent energy slots that have been claimed.
    /// </summary>
    public class BookingService
    {
        private readonly BookingRepository _repository;

        public BookingService(BookingRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<EnergySlotDto>> GetCurrentBookingsAsync()
        {
            var bookings = await _repository.GetCurrentBookingsAsync();
            return bookings.Select(MapToDto).ToList();
        }

        public async Task<List<EnergySlotDto>> GetPendingBookingsAsync()
        {
            var bookings = await _repository.GetPendingBookingsAsync();
            return bookings.Select(MapToDto).ToList();
        }

        public async Task<List<EnergySlotDto>> GetBookingHistoryAsync()
        {
            var bookings = await _repository.GetBookingHistoryAsync();
            return bookings.Select(MapToDto).ToList();
        }

        public async Task<EnergySlotDto?> GetBookingByIdAsync(string id)
        {
            var booking = await _repository.GetBookingByIdAsync(id);
            return booking != null ? MapToDto(booking) : null;
        }

        public async Task<bool> ConfirmBookingAsync(string id)
        {
            var booking = await _repository.GetBookingByIdAsync(id);
            if (booking == null) return false;

            await _repository.UpdateBookingStatusAsync(id, "Booked");
            return true;
        }

        public async Task<bool> CompleteBookingAsync(string id)
        {
            var booking = await _repository.GetBookingByIdAsync(id);
            if (booking == null) return false;

            await _repository.UpdateBookingStatusAsync(id, "Completed");
            return true;
        }

        public async Task<bool> CancelBookingAsync(string id)
        {
            var booking = await _repository.GetBookingByIdAsync(id);
            if (booking == null) return false;

            await _repository.UpdateBookingStatusAsync(id, "Cancelled");
            return true;
        }

        public async Task<long> GetCurrentBookingsCountAsync() =>
            await _repository.GetCurrentBookingsCountAsync();

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
