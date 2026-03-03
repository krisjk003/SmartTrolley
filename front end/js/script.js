/* =========================================================
   SmartTrolley Dashboard Script
   Production Version - ESP32 + Barcode Integrated
   ========================================================= */

(() => {
    "use strict";

    const qs = (selector) => document.querySelector(selector);
    const safeNumber = (value) => isNaN(Number(value)) ? 0 : Number(value);
    const log = (...args) => console.log("[SmartTrolley]", ...args);

    /* ---------- CONFIG ---------- */

    const BASE_URL = "https://smarttrolley.onrender.com"; // 🔥 CHANGE if IP changes

    /* ---------- STATE ---------- */

    const cartState = {
        items: [],
        systemOnline: true
    };

    /* ---------- CALCULATIONS ---------- */

    const calculateTotals = () => {
        let totalItems = 0;
        let totalPrice = 0;

        cartState.items.forEach(item => {
            totalItems += safeNumber(item.qty);
            totalPrice += safeNumber(item.price);
        });

        return { totalItems, totalPrice };
    };

    /* ---------- UI FUNCTIONS ---------- */

    const updateSummaryUI = () => {
        const totalItemsEl = qs("#total-items");
        const totalPriceEl = qs("#total-price");

        if (!totalItemsEl || !totalPriceEl) return;

        const { totalItems, totalPrice } = calculateTotals();

        totalItemsEl.textContent = totalItems;
        totalPriceEl.textContent = totalPrice.toFixed(2);
    };

    const updateCartTable = () => {
        const tbody = qs("#cart-body");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (cartState.items.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="4">Waiting for barcode scan...</td>
                </tr>
            `;
            return;
        }

        cartState.items.forEach(item => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>₹${item.price}</td>
                <td><span class="badge added">Added</span></td>
            `;

            tbody.appendChild(row);
        });
    };

    const updateSystemStatus = () => {
        const statusEl = qs(".status");
        if (!statusEl) return;

        if (cartState.systemOnline) {
            statusEl.textContent = "Online";
            statusEl.classList.add("online");
        } else {
            statusEl.textContent = "Offline";
            statusEl.classList.remove("online");
        }
    };

    /* ---------- BACKEND SYNC ---------- */

    const fetchCartFromBackend = () => {

        fetch(`${BASE_URL}/cart`)
            .then(res => res.json())
            .then(data => {

                cartState.items = data.map(item => {

                    const gstAmount = (item.price * item.gst) / 100;
                    const totalPrice = (item.price + gstAmount) * item.qty;

                    return {
                        name: item.name,
                        qty: item.qty,
                        price: totalPrice
                    };
                });

                cartState.systemOnline = true;

                updateCartTable();
                updateSummaryUI();
                updateSystemStatus();

            })
            .catch(error => {
                cartState.systemOnline = false;
                updateSystemStatus();
                log("Backend connection error:", error);
            });
    };

    /* ---------- BARCODE SCANNER ---------- */

    const initScanner = () => {

        if (!window.Html5QrcodeScanner) return;

        function onScanSuccess(decodedText) {

            log("Scanned barcode:", decodedText);

            fetch(`${BASE_URL}/scan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ barcode: decodedText })
            })
            .then(res => res.json())
            .then(() => {
                fetchCartFromBackend(); // 🔥 Refresh cart immediately
            })
            .catch(err => log("Scan error:", err));
        }

        const scanner = new Html5QrcodeScanner(
            "reader",
            {
                fps: 10,
                qrbox: { width: 50, height: 50 },
                rememberLastUsedCamera: true,
                supportedScanTypes: [
                    Html5QrcodeScanType.SCAN_TYPE_CAMERA,
                    Html5QrcodeScanType.SCAN_TYPE_FILE
                ]
            },
            false
        );

        scanner.render(onScanSuccess);
    };

    /* ---------- BILL GENERATION ---------- */

    const setupGenerateBill = () => {
        const billBtn = document.getElementById("generate-bill-btn");
        if (!billBtn) return;

        billBtn.addEventListener("click", () => {

            const cartItems = cartState.items;
            const { totalPrice } = calculateTotals();

            localStorage.setItem("smarttrolley_cart", JSON.stringify(cartItems));
            localStorage.setItem("smarttrolley_total", totalPrice);

            window.open("bill.html", "_blank");
        });
    };

    /* ---------- INITIALIZATION ---------- */

    const init = () => {
        log("SmartTrolley Dashboard Initialized");

        updateCartTable();
        updateSummaryUI();
        updateSystemStatus();
        setupGenerateBill();
        initScanner();

        fetchCartFromBackend();
        setInterval(fetchCartFromBackend, 2000);
    };

    document.addEventListener("DOMContentLoaded", init);

})();