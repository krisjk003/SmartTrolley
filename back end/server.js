const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 👇 Serve frontend properly (IMPORTANT)
app.use(express.static(path.join(__dirname, "../front end")));

// 🔥 Barcode based products
const products = {
    "8901234567890": { name: "Milk", price: 40, gst: 5 },
    "8901111111111": { name: "Bread", price: 60, gst: 5 },
    "8902222222222": { name: "Chips", price: 80, gst: 12 }
};

let liveCart = [];

// 🔥 Scan barcode route
app.post("/scan", (req, res) => {
    const { barcode } = req.body;

    const product = products[barcode];

    if (!product) {
        return res.status(404).json({ error: "Product not found" });
    }

    const existing = liveCart.find(p => p.name === product.name);

    if (existing) {
        existing.qty += 1;
    } else {
        liveCart.push({
            name: product.name,
            qty: 1,
            price: product.price,
            gst: product.gst
        });
    }

    res.json(product); // 👈 Send product back to frontend
});

// 🔥 Get full cart
app.get("/cart", (req, res) => {
    res.json(liveCart);
});

// 🔥 Clear cart
app.post("/clear", (req, res) => {
    liveCart = [];
    res.json({ success: true });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});