package com.smartsolar.microgrid.api.models;

import java.io.Serializable;

/**
 * BookingDetailsDto — DTO representing extended booking details including buyer and seller profiles.
 * Component: Member 3 (Nethum) — Booking Extended Details Model
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class BookingDetailsDto extends BookingDto implements Serializable {
    private String sellerEmail;
    private String sellerPhone;

    private String buyerEmail;
    private String buyerPhone;

    private boolean canConfirm;
    private boolean canComplete;
    private boolean canCancel;

    public String getSellerEmail() { return sellerEmail != null ? sellerEmail : ""; }
    public String getSellerPhone() { return sellerPhone != null ? sellerPhone : ""; }
    public String getBuyerEmail() { return buyerEmail != null ? buyerEmail : ""; }
    public String getBuyerPhone() { return buyerPhone != null ? buyerPhone : ""; }
    public boolean isCanConfirm() { return canConfirm; }
    public boolean isCanComplete() { return canComplete; }
    public boolean isCanCancel() { return canCancel; }
}
