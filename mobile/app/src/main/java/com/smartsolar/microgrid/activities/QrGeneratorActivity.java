package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import com.smartsolar.microgrid.R;
import java.io.File;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONObject;

/**
 * QrGeneratorActivity — Generates a high-resolution QR token for confirmed reservations.
 * Encodes a comprehensive JSON payload containing reservation ID, buyer NIC, energy kWh,
 * price, time window, and microgrid node reference.
 * Member 4 contribution: QR Code Generation (2 marks) + Seamless operator verification handoff.
 */
public class QrGeneratorActivity extends AppCompatActivity {

    private ImageView ivQrCode;
    private TextView tvReservationRef, tvEnergyAmount, tvTotalPrice, tvDeliveryWindow, tvStationName;
    private Button btnShareQr, btnClose;
    private ImageButton btnBack;

    private String reservationId;
    private String buyerNic;
    private double energyAmount;
    private double totalPrice;
    private String slotDate;
    private String startTime;
    private String endTime;
    private String nodeId;
    private String nodeName;
    private Bitmap qrBitmap;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_qr_generator);

        extractIntentExtras();
        initViews();
        generateAndDisplayQrCode();
    }

    /**
     * Extracts reservation details passed via Intent extras from previous activities.
     */
    private void extractIntentExtras() {
        Intent intent = getIntent();
        reservationId = intent.getStringExtra("EXTRA_RESERVATION_ID");
        if (reservationId == null || reservationId.isEmpty()) {
            reservationId = "RES-" + System.currentTimeMillis();
        }
        buyerNic = intent.getStringExtra("EXTRA_BUYER_NIC");
        energyAmount = intent.getDoubleExtra("EXTRA_ENERGY_AMOUNT", 20.0);
        totalPrice = intent.getDoubleExtra("EXTRA_TOTAL_PRICE", 60.0);
        slotDate = intent.getStringExtra("EXTRA_SLOT_DATE");
        startTime = intent.getStringExtra("EXTRA_START_TIME");
        endTime = intent.getStringExtra("EXTRA_END_TIME");
        nodeId = intent.getStringExtra("EXTRA_NODE_ID");
        nodeName = intent.getStringExtra("EXTRA_NODE_NAME");

        if (slotDate == null || slotDate.isEmpty()) {
            slotDate = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        }
        if (startTime == null || startTime.isEmpty()) startTime = "09:00";
        if (endTime == null || endTime.isEmpty()) endTime = "12:00";
        if (nodeName == null || nodeName.isEmpty()) nodeName = "Microgrid Main Station";
    }

    /**
     * Initializes layout components and button listeners.
     */
    private void initViews() {
        ivQrCode = findViewById(R.id.ivQrCode);
        tvReservationRef = findViewById(R.id.tvReservationRef);
        tvEnergyAmount = findViewById(R.id.tvEnergyAmount);
        tvTotalPrice = findViewById(R.id.tvTotalPrice);
        tvDeliveryWindow = findViewById(R.id.tvDeliveryWindow);
        tvStationName = findViewById(R.id.tvStationName);
        btnShareQr = findViewById(R.id.btnShareQr);
        btnClose = findViewById(R.id.btnClose);
        btnBack = findViewById(R.id.btnBack);

        String shortRef = reservationId.length() > 10 ? reservationId.substring(0, 10) : reservationId;
        tvReservationRef.setText("REF #" + shortRef);
        tvEnergyAmount.setText(String.format(Locale.US, "%.1f kWh", energyAmount));
        tvTotalPrice.setText(String.format(Locale.US, "$%.2f", totalPrice));
        tvDeliveryWindow.setText(String.format("%s (%s - %s)", slotDate.split("T")[0], startTime, endTime));
        tvStationName.setText(nodeName);

        btnBack.setOnClickListener(v -> finish());
        btnClose.setOnClickListener(v -> finish());
        btnShareQr.setOnClickListener(v -> shareQrImage());
    }

    /**
     * Compiles reservation metadata into a structured JSON string and encodes it
     * into a high-resolution 512x512 QR code Bitmap using ZXing MultiFormatWriter.
     */
    private void generateAndDisplayQrCode() {
        try {
            JSONObject json = new JSONObject();
            json.put("type", "MICROGRID_ENERGY_TRANSACTION");
            json.put("reservationId", reservationId);
            json.put("buyerNic", buyerNic != null ? buyerNic : "");
            json.put("energyAmount", energyAmount);
            json.put("totalPrice", totalPrice);
            json.put("slotDate", slotDate);
            json.put("startTime", startTime);
            json.put("endTime", endTime);
            json.put("nodeId", nodeId != null ? nodeId : "");
            json.put("nodeName", nodeName);
            json.put("timestamp", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(new Date()));

            String qrContent = json.toString();

            int size = 512;
            BitMatrix bitMatrix = new MultiFormatWriter().encode(qrContent, BarcodeFormat.QR_CODE, size, size);
            qrBitmap = Bitmap.createBitmap(size, size, Bitmap.Config.RGB_565);

            for (int x = 0; x < size; x++) {
                for (int y = 0; y < size; y++) {
                    qrBitmap.setPixel(x, y, bitMatrix.get(x, y) ? Color.BLACK : Color.WHITE);
                }
            }

            ivQrCode.setImageBitmap(qrBitmap);

        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, "Failed to render QR Code: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    /**
     * Shares the generated QR code token bitmap using Android System Sharesheet.
     */
    private void shareQrImage() {
        if (qrBitmap == null) {
            Toast.makeText(this, "QR Code not ready", Toast.LENGTH_SHORT).show();
            return;
        }

        try {
            File cachePath = new File(getCacheDir(), "images");
            cachePath.mkdirs();
            File imageFile = new File(cachePath, "energy_token_" + reservationId + ".png");
            FileOutputStream stream = new FileOutputStream(imageFile);
            qrBitmap.compress(Bitmap.CompressFormat.PNG, 100, stream);
            stream.close();

            Uri contentUri = FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", imageFile);

            Intent shareIntent = new Intent(Intent.ACTION_SEND);
            shareIntent.setType("image/png");
            shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
            shareIntent.putExtra(Intent.EXTRA_SUBJECT, "Smart Solar Energy Token");
            shareIntent.putExtra(Intent.EXTRA_TEXT, "Solar Microgrid Transfer Token for Reservation #" + reservationId);
            shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            startActivity(Intent.createChooser(shareIntent, "Share QR Token via"));

        } catch (Exception e) {
            e.printStackTrace();
            Toast.makeText(this, "Error sharing QR: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
}
