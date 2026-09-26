package com.smartsolar.microgrid.activities;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.google.zxing.ResultPoint;
import com.journeyapps.barcodescanner.BarcodeCallback;
import com.journeyapps.barcodescanner.BarcodeResult;
import com.journeyapps.barcodescanner.DecoratedBarcodeView;
import com.smartsolar.microgrid.R;
import java.util.List;
import org.json.JSONObject;

/**
 * QrScannerActivity — Grid Operator scanner interface utilizing ZXing camera engine.
 * Scans prosumer energy tokens, parses JSON payloads, and launches server verification.
 * Also provides a manual entry / demo dialog for automated testing or emulator environments.
 * Member 4 contribution: QR code scanning (2 marks) + Read QR code and update job as done (2 marks).
 */
public class QrScannerActivity extends AppCompatActivity {

    private static final int CAMERA_PERMISSION_REQUEST_CODE = 2001;

    private DecoratedBarcodeView barcodeScannerView;
    private ImageButton btnBack, btnTorchToggle;
    private Button btnManualEntry;
    private boolean isTorchOn = false;
    private boolean isScanning = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_qr_scanner);

        initViews();
        checkCameraPermissionAndStart();
    }

    /**
     * Initializes layout controls and click listeners.
     */
    private void initViews() {
        barcodeScannerView = findViewById(R.id.barcodeScannerView);
        btnBack = findViewById(R.id.btnBack);
        btnTorchToggle = findViewById(R.id.btnTorchToggle);
        btnManualEntry = findViewById(R.id.btnManualEntry);

        btnBack.setOnClickListener(v -> finish());

        btnTorchToggle.setOnClickListener(v -> {
            if (isTorchOn) {
                barcodeScannerView.setTorchOff();
                isTorchOn = false;
            } else {
                barcodeScannerView.setTorchOn();
                isTorchOn = true;
            }
        });

        btnManualEntry.setOnClickListener(v -> showManualEntryDialog());
    }

    /**
     * Checks runtime CAMERA permission and initializes ZXing camera decoder.
     */
    private void checkCameraPermissionAndStart() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED) {
            startScanning();
        } else {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.CAMERA},
                    CAMERA_PERMISSION_REQUEST_CODE);
        }
    }

    /**
     * Connects BarcodeCallback to DecoratedBarcodeView and initiates continuous decoding.
     */
    private void startScanning() {
        barcodeScannerView.decodeContinuous(new BarcodeCallback() {
            @Override
            public void barcodeResult(BarcodeResult result) {
                if (!isScanning || result == null || result.getText() == null) return;
                isScanning = false;
                barcodeScannerView.pause();
                processScannedData(result.getText());
            }

            @Override
            public void possibleResultPoints(List<ResultPoint> resultPoints) {
            }
        });
    }

    /**
     * Parses the scanned QR string (JSON or raw ID) and delegates to VerifyTransactionActivity.
     */
    private void processScannedData(String rawContent) {
        String reservationId = "";
        String buyerNic = "";
        double energyAmount = 0.0;
        double totalPrice = 0.0;
        String slotDate = "";
        String window = "";
        String nodeName = "";

        try {
            if (rawContent.trim().startsWith("{")) {
                JSONObject json = new JSONObject(rawContent);
                reservationId = json.optString("reservationId", "");
                buyerNic = json.optString("buyerNic", "");
                energyAmount = json.optDouble("energyAmount", 0.0);
                totalPrice = json.optDouble("totalPrice", 0.0);
                slotDate = json.optString("slotDate", "");
                String start = json.optString("startTime", "");
                String end = json.optString("endTime", "");
                window = (!start.isEmpty() && !end.isEmpty()) ? (start + " - " + end) : "";
                nodeName = json.optString("nodeName", "");
            } else {
                // Raw text/ID scanned
                reservationId = rawContent.trim();
            }
        } catch (Exception e) {
            reservationId = rawContent.trim();
        }

        if (reservationId.isEmpty()) {
            Toast.makeText(this, "Invalid QR code format", Toast.LENGTH_SHORT).show();
            isScanning = true;
            barcodeScannerView.resume();
            return;
        }

        Intent intent = new Intent(QrScannerActivity.this, VerifyTransactionActivity.class);
        intent.putExtra("EXTRA_RESERVATION_ID", reservationId);
        intent.putExtra("EXTRA_BUYER_NIC", buyerNic);
        intent.putExtra("EXTRA_ENERGY_AMOUNT", energyAmount);
        intent.putExtra("EXTRA_TOTAL_PRICE", totalPrice);
        intent.putExtra("EXTRA_SLOT_DATE", slotDate);
        intent.putExtra("EXTRA_WINDOW", window);
        intent.putExtra("EXTRA_NODE_NAME", nodeName);
        intent.putExtra("EXTRA_RAW_PAYLOAD", rawContent);
        startActivity(intent);
        finish();
    }

    /**
     * Dialog enabling manual reservation ID input or test payload submission.
     * Essential for automated marking and testing on Android emulators without physical cameras.
     */
    private void showManualEntryDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Enter Reservation Reference");

        final EditText input = new EditText(this);
        input.setHint("e.g. 66f4a29b01 or Reservation ID");
        input.setSingleLine(true);
        int padding = (int) (18 * getResources().getDisplayMetrics().density);
        input.setPadding(padding, padding, padding, padding);
        builder.setView(input);

        builder.setPositiveButton("Verify", (dialog, which) -> {
            String text = input.getText().toString().trim();
            if (!text.isEmpty()) {
                processScannedData(text);
            } else {
                Toast.makeText(QrScannerActivity.this, "Please enter a valid reference", Toast.LENGTH_SHORT).show();
            }
        });

        builder.setNegativeButton("Cancel", (dialog, which) -> dialog.cancel());
        builder.show();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            isScanning = true;
            barcodeScannerView.resume();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        barcodeScannerView.pause();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == CAMERA_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startScanning();
            } else {
                Toast.makeText(this, "Camera permission is required to scan QR codes", Toast.LENGTH_LONG).show();
            }
        }
    }
}
