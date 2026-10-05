/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * System Module Documentation
 * ==============================================================================
 */
using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Repositories;

namespace SmartSolarMicrogrid.API.Services
{
    /// <summary>
    /// Service for Booking business logic following the FAT Service pattern.
    /// Bookings represent energy slots that are actively claimed, pending approval, or completed/cancelled.
    /// Enriches booking data with linked Prosumers, Microgrid Nodes, and Reservations.
    /// </summary>
    public class BookingService
    {
        private readonly BookingRepository _repository;
        private readonly ReservationRepository _reservationRepository;
        private readonly ProsumerRepository _prosumerRepository;
        private readonly MicrogridRepository _microgridRepository;
        private readonly EnergySlotRepository _slotRepository;

        public BookingService(
            BookingRepository repository,
            ReservationRepository reservationRepository,
            ProsumerRepository prosumerRepository,
            MicrogridRepository microgridRepository,
            EnergySlotRepository slotRepository)
        {
            _repository = repository;
            _reservationRepository = reservationRepository;
            _prosumerRepository = prosumerRepository;
            _microgridRepository = microgridRepository;
            _slotRepository = slotRepository;
        }

        public async Task<List<BookingDto>> GetCurrentBookingsAsync()
        {
            // Executes the GetCurrentBookingsAsync operation flow
            var slots = await _repository.GetCurrentBookingsAsync();
            return await EnrichBookingsAsync(slots);
        }

        public async Task<List<BookingDto>> GetPendingBookingsAsync()
        {
            // Executes the GetPendingBookingsAsync operation flow
            var slots = await _repository.GetPendingBookingsAsync();
            return await EnrichBookingsAsync(slots);
        }

        public async Task<List<BookingDto>> GetBookingHistoryAsync()
        {
            // Executes the GetBookingHistoryAsync operation flow
            var slots = await _repository.GetBookingHistoryAsync();
            return await EnrichBookingsAsync(slots);
        }

        public async Task<BookingDto?> GetBookingByIdAsync(string id)
        {
            var slot = await _repository.GetBookingByIdAsync(id);
            if (slot == null) return null;

            var enriched = await EnrichBookingsAsync(new List<EnergySlot> { slot });
            return enriched.FirstOrDefault();
        }

        public async Task<BookingDetailsDto?> GetBookingDetailsByIdAsync(string id)
        {
            var slot = await _repository.GetBookingByIdAsync(id);
            if (slot == null) return null;

            var reservation = await _repository.GetReservationBySlotIdAsync(slot.Id);
            var buyer = reservation != null ? await _prosumerRepository.GetByNicAsync(reservation.BuyerProsumerId) : null;
            var seller = await _prosumerRepository.GetByNicAsync(slot.ProsumerId);
            var node = await _microgridRepository.GetByIdAsync(slot.MicrogridNodeId);

            var energyAmount = reservation != null && reservation.EnergyAmount > 0 ? reservation.EnergyAmount : slot.EnergyAmount;
            var totalPrice = reservation != null ? reservation.TotalPrice : (decimal)energyAmount * slot.PricePerUnit;

            var effectiveStatus = slot.Status;
            if (reservation != null && reservation.Status == "Pending" && slot.Status == "Available")
            {
                effectiveStatus = "Pending";
            }

            return new BookingDetailsDto
            {
                Id = slot.Id,
                EnergySlotId = slot.Id,
                ReservationId = reservation?.Id,
                MicrogridNodeId = slot.MicrogridNodeId,
                MicrogridNodeName = node?.NodeName ?? "Unknown Node",
                MicrogridLocation = node?.Location ?? "Unknown Location",
                SellerProsumerId = slot.ProsumerId,
                SellerName = seller?.Name ?? slot.ProsumerId,
                SellerEmail = seller?.Email ?? "N/A",
                SellerPhone = seller?.Phone ?? "N/A",
                BuyerProsumerId = reservation?.BuyerProsumerId ?? "N/A",
                BuyerName = buyer?.Name ?? (reservation?.BuyerProsumerId ?? "N/A"),
                BuyerEmail = buyer?.Email ?? "N/A",
                BuyerPhone = buyer?.Phone ?? "N/A",
                EnergyAmount = energyAmount,
                PricePerUnit = slot.PricePerUnit,
                TotalPrice = totalPrice,
                SlotDate = slot.SlotDate,
                StartTime = slot.StartTime,
                EndTime = slot.EndTime,
                Status = effectiveStatus,
                CreatedAt = slot.CreatedAt,
                UpdatedAt = slot.UpdatedAt,
                Notes = reservation?.Notes ?? string.Empty,
                CanConfirm = effectiveStatus == "Pending",
                CanComplete = effectiveStatus == "Booked",
                CanCancel = effectiveStatus == "Booked" || effectiveStatus == "Pending"
            };
        }

        public async Task<List<BookingDto>> SearchBookingsAsync(BookingFilterRequest request)
        {
            // Executes the SearchBookingsAsync operation flow
            var slots = await _repository.SearchBookingsAsync(request.Status, request.NodeId, request.Date, request.ProsumerId);
            var enriched = await EnrichBookingsAsync(slots);

            // In-memory text matching if query is provided
            if (!string.IsNullOrWhiteSpace(request.Query))
            {
                var q = request.Query.Trim().ToLowerInvariant();
                enriched = enriched.Where(b =>
                    b.Id.ToLowerInvariant().Contains(q) ||
                    b.SellerName.ToLowerInvariant().Contains(q) ||
                    b.SellerProsumerId.ToLowerInvariant().Contains(q) ||
                    b.BuyerName.ToLowerInvariant().Contains(q) ||
                    b.BuyerProsumerId.ToLowerInvariant().Contains(q) ||
                    b.MicrogridNodeName.ToLowerInvariant().Contains(q) ||
                    b.MicrogridLocation.ToLowerInvariant().Contains(q) ||
                    b.Notes.ToLowerInvariant().Contains(q)
                ).ToList();
            }

            return enriched;
        }

        public async Task<bool> ConfirmBookingAsync(string id)
        {
            // Executes the ConfirmBookingAsync operation flow
            var booking = await _repository.GetBookingByIdAsync(id);
            if (booking == null) return false;

            await _repository.UpdateBookingStatusAsync(id, "Booked");
            await _repository.UpdateReservationStatusBySlotIdAsync(id, "Confirmed");
            return true;
        }

        public async Task<bool> CompleteBookingAsync(string id)
        {
            // Executes the CompleteBookingAsync operation flow
            var booking = await _repository.GetBookingByIdAsync(id);
            if (booking == null) return false;

            await _repository.UpdateBookingStatusAsync(id, "Completed");
            await _repository.UpdateReservationStatusBySlotIdAsync(id, "Completed");
            return true;
        }

        public async Task<bool> CancelBookingAsync(string id)
        {
            // Executes the CancelBookingAsync operation flow
            var booking = await _repository.GetBookingByIdAsync(id);
            if (booking == null) return false;

            await _repository.UpdateBookingStatusAsync(id, "Cancelled");
            await _repository.UpdateReservationStatusBySlotIdAsync(id, "Cancelled");
            return true;
        }

        public async Task<long> GetCurrentBookingsCountAsync() =>
            await _repository.GetCurrentBookingsCountAsync();

        private async Task<List<BookingDto>> EnrichBookingsAsync(List<EnergySlot> slots)
        {
            // Executes the GetCurrentBookingsCountAsync operation flow
            if (slots.Count == 0) return new List<BookingDto>();

            var slotIds = slots.Select(s => s.Id).ToList();
            var reservations = await _repository.GetReservationsForSlotsAsync(slotIds);
            var reservationMap = reservations
                .GroupBy(r => r.EnergySlotId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(r => r.ReservedAt).First());

            // Collect unique prosumer NICs and node IDs to fetch in batches
            var sellerNics = slots.Select(s => s.ProsumerId).Where(n => !string.IsNullOrEmpty(n));
            var buyerNics = reservations.Select(r => r.BuyerProsumerId).Where(n => !string.IsNullOrEmpty(n));
            var allNics = sellerNics.Concat(buyerNics).Distinct().ToList();

            var prosumerMap = new Dictionary<string, Prosumer>();
            foreach (var nic in allNics)
            {
                var p = await _prosumerRepository.GetByNicAsync(nic);
                if (p != null) prosumerMap[nic] = p;
            }

            var nodeIds = slots.Select(s => s.MicrogridNodeId).Distinct().ToList();
            var nodeMap = new Dictionary<string, MicrogridNode>();
            foreach (var nid in nodeIds)
            {
                var n = await _microgridRepository.GetByIdAsync(nid);
                if (n != null) nodeMap[nid] = n;
            }

            var result = new List<BookingDto>();
            foreach (var slot in slots)
            {
                reservationMap.TryGetValue(slot.Id, out var res);
                nodeMap.TryGetValue(slot.MicrogridNodeId, out var node);

                prosumerMap.TryGetValue(slot.ProsumerId, out var seller);
                Prosumer? buyer = null;
                if (res != null && !string.IsNullOrEmpty(res.BuyerProsumerId))
                {
                    prosumerMap.TryGetValue(res.BuyerProsumerId, out buyer);
                }

                var energyAmount = res != null && res.EnergyAmount > 0 ? res.EnergyAmount : slot.EnergyAmount;
                var totalPrice = res != null ? res.TotalPrice : (decimal)energyAmount * slot.PricePerUnit;

                var effectiveStatus = slot.Status;
                if (res != null && res.Status == "Pending" && slot.Status == "Available")
                {
                    effectiveStatus = "Pending";
                }

                result.Add(new BookingDto
                {
                    Id = slot.Id,
                    EnergySlotId = slot.Id,
                    ReservationId = res?.Id,
                    MicrogridNodeId = slot.MicrogridNodeId,
                    MicrogridNodeName = node?.NodeName ?? "Unknown Node",
                    MicrogridLocation = node?.Location ?? "Unknown Location",
                    SellerProsumerId = slot.ProsumerId,
                    SellerName = seller?.Name ?? slot.ProsumerId,
                    BuyerProsumerId = res?.BuyerProsumerId ?? "N/A",
                    BuyerName = buyer?.Name ?? (res?.BuyerProsumerId ?? "N/A"),
                    EnergyAmount = energyAmount,
                    PricePerUnit = slot.PricePerUnit,
                    TotalPrice = totalPrice,
                    SlotDate = slot.SlotDate,
                    StartTime = slot.StartTime,
                    EndTime = slot.EndTime,
                    Status = effectiveStatus,
                    CreatedAt = slot.CreatedAt,
                    UpdatedAt = slot.UpdatedAt,
                    Notes = res?.Notes ?? string.Empty
                });
            }

            return result;
        }
    }
}

