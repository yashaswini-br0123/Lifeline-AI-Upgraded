"use client";

import { useState } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  CreditCard,
  CheckCircle,
  Truck,
  Zap,
  BriefcaseMedical,
  MapPin,
  Phone,
  QrCode,
  ExternalLink,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: "Medication" | "First Aid" | "Diagnostics";
  price: number; // in INR (₹)
  description: string;
  unit: string;
  inStock: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const PHARMACY_PRODUCTS: Product[] = [
  { id: "p1", name: "Paracetamol 650mg", category: "Medication", price: 35, description: "Fast-acting relief for fever and body pain.", unit: "Strip of 15 tablets", inStock: true },
  { id: "p2", name: "Ibuprofen 200mg", category: "Medication", price: 45, description: "Effective anti-inflammatory painkiller.", unit: "Strip of 10 tablets", inStock: true },
  { id: "p3", name: "Cough Relief Syrup", category: "Medication", price: 110, description: "Soothes throat irritation and relieves productive cough.", unit: "100ml bottle", inStock: true },
  { id: "p4", name: "Antacid Chewable Gel", category: "Medication", price: 85, description: "Quick relief from acidity, heartburn, and gas.", unit: "Pack of 10 tablets", inStock: true },
  { id: "p5", name: "Multi-Vitamin Gummies", category: "Medication", price: 290, description: "Daily health support chewables with essential vitamins.", unit: "Bottle of 30 gummies", inStock: true },
  
  { id: "p6", name: "Premium Elastic Bandage", category: "First Aid", price: 120, description: "Flexible support wrap for sprains and joints.", unit: "1 roll (8cm x 4m)", inStock: true },
  { id: "p7", name: "Sterile Gauze Pads", category: "First Aid", price: 50, description: "Pre-cut, individually wrapped cotton dressing.", unit: "Pack of 10 pads", inStock: true },
  { id: "p8", name: "Adhesive Band-Aids", category: "First Aid", price: 30, description: "Waterproof, sterile plastic bandages for small cuts.", unit: "Box of 20 strips", inStock: true },
  { id: "p9", name: "Antiseptic Wound Spray", category: "First Aid", price: 165, description: "Cleans cuts, scratches, and minor burns to prevent infection.", unit: "50ml spray", inStock: true },
  
  { id: "p10", name: "Digital Thermometer", category: "Diagnostics", price: 190, description: "Accurate oral/underarm temperature reading in 60s.", unit: "1 unit", inStock: true },
  { id: "p11", name: "BP Monitor (Upper Arm)", category: "Diagnostics", price: 1450, description: "Fully automatic blood pressure and pulse tracker.", unit: "1 unit", inStock: true },
  { id: "p12", name: "Fingertip Pulse Oximeter", category: "Diagnostics", price: 850, description: "Instantly checks blood oxygen levels (SpO2) and pulse rate.", unit: "1 unit", inStock: true },
];

export default function PharmacyPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<"All" | "Medication" | "First Aid" | "Diagnostics">("All");
  
  // Checkout flow states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod" | "card">("upi");
  const [selectedUpiApp, setSelectedUpiApp] = useState<"phonepe" | "gpay" | "paytm" | "bhim" | "mobikwik" | "qr">("phonepe");
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  
  const [orderStatus, setOrderStatus] = useState<"idle" | "placing" | "upi_pending" | "success">("idle");
  const [orderId, setOrderId] = useState("");

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setShowCartDrawer(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const deliveryFee = subtotal > 0 ? 5 : 0; // Fixed flat delivery fee: ₹5
    return { subtotal, deliveryFee, total: subtotal + deliveryFee };
  };

  const cartTotalInfo = getCartTotal();
  const upiId = "lifelineai@upi";

  const getUpiDeepLink = (app: string) => {
    const amount = cartTotalInfo.total;
    const note = encodeURIComponent(`Pharmacy Order ${orderId || 'LL-999'}`);
    const recipient = "lifelineai@upi";
    const name = encodeURIComponent("Lifeline AI Pharmacy");

    switch (app) {
      case "phonepe":
        return `phonepe://pay?pa=${recipient}&pn=${name}&am=${amount}&tn=${note}&cu=INR`;
      case "gpay":
        return `tez://upi/pay?pa=${recipient}&pn=${name}&am=${amount}&tn=${note}&cu=INR`;
      case "paytm":
        return `paytmmp://pay?pa=${recipient}&pn=${name}&am=${amount}&tn=${note}&cu=INR`;
      case "bhim":
        return `bhim://pay?pa=${recipient}&pn=${name}&am=${amount}&tn=${note}&cu=INR`;
      default:
        return `upi://pay?pa=${recipient}&pn=${name}&am=${amount}&tn=${note}&cu=INR`;
    }
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryAddress.trim() || !phoneNumber.trim()) {
      alert("Please enter delivery address and phone number.");
      return;
    }

    const randomId = "LL-" + Math.floor(100000 + Math.random() * 900000);
    setOrderId(randomId);

    if (paymentMethod === "upi") {
      setShowCheckoutModal(false);
      setShowUpiModal(true);
      setOrderStatus("upi_pending");
    } else {
      setOrderStatus("placing");
      setTimeout(() => {
        setOrderStatus("success");
      }, 1500);
    }
  };

  const confirmUpiPayment = () => {
    setShowUpiModal(false);
    setShowCheckoutModal(true);
    setOrderStatus("success");
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const resetStore = () => {
    setCart([]);
    setShowCheckoutModal(false);
    setShowUpiModal(false);
    setShowCartDrawer(false);
    setOrderStatus("idle");
    setDeliveryAddress("");
    setPhoneNumber("");
    setPaymentMethod("upi");
    setSelectedUpiApp("phonepe");
  };

  const filteredProducts = selectedCategory === "All" 
    ? PHARMACY_PRODUCTS 
    : PHARMACY_PRODUCTS.filter(p => p.category === selectedCategory);

  const qrData = encodeURIComponent(`upi://pay?pa=${upiId}&pn=Lifeline+AI+Pharmacy&am=${cartTotalInfo.total}&tn=Pharmacy+Order+${orderId}&cu=INR`);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}`;

  return (
    <div className="flex-1 p-6 md:p-10 space-y-8 bg-slate-950 text-slate-100 min-h-full relative overflow-y-auto">
      {/* Background glow effects */}
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <ShoppingBag className="w-8 h-8 text-emerald-400" />
            24/7 Lifeline Pharmacy Store
          </h1>
          <p className="text-slate-400 text-sm">
            Order OTC medications, bandages, diagnostics tools, and clinical essentials. Express delivery in 15 minutes.
          </p>
        </div>
        <button
          onClick={() => setShowCartDrawer(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/35 hover:bg-slate-900 text-sm font-bold text-white transition-all cursor-pointer relative"
        >
          <ShoppingBag className="w-4 h-4 text-emerald-400" />
          My Basket
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-[10px] text-white flex items-center justify-center font-extrabold shadow-md animate-pulse">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* 24/7 Banner Tagline */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-900/50 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400 animate-pulse">
          <Zap className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            Superfast 24/7 Doorstep Delivery &bull; Flat ₹5 Shipping Fee
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed font-light mt-0.5">
            Select emergency medicines, bandages, or diagnostic monitors. Express delivery partner reaches your location in 12-15 minutes.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-slate-900 pb-px relative z-10">
        {(["All", "Medication", "First Aid", "Diagnostics"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`pb-3 px-5 text-xs font-bold relative transition-all cursor-pointer ${
              selectedCategory === cat ? "text-emerald-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {cat === "All" ? "All Products" : cat === "Medication" ? "OTC Medicines" : cat === "First Aid" ? "First Aid & Bandages" : "Diagnostic Monitors"}
            {selectedCategory === cat && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
            )}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="bg-slate-900/20 border border-slate-850 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between hover:shadow-lg transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <span className={`text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  prod.category === "Medication" 
                    ? "bg-purple-500/10 border-purple-500/20 text-purple-400" 
                    : prod.category === "First Aid"
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                }`}>
                  {prod.category}
                </span>
                <span className="text-[10px] text-slate-500 italic font-mono">{prod.unit}</span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white group-hover:text-emerald-400 transition-colors leading-snug">{prod.name}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-light mt-1.5">{prod.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-900/60">
              <div className="text-base font-black text-white">
                ₹{prod.price}
              </div>
              <button
                onClick={() => addToCart(prod)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/35 text-[11px] font-bold text-emerald-400 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Slide-Out Drawer overlay */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="flex-1" onClick={() => setShowCartDrawer(false)} />
          
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col justify-between p-6 shadow-2xl relative animate-slideLeft">
            <div>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                Your Basket
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Edit items and confirm your pharmacy delivery.</p>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto py-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 space-y-3">
                  <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">Your basket is currently empty.</p>
                  <p className="text-[10px] text-slate-500 leading-relaxed px-6">Add medical products or first aid items to configure an express delivery order.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="bg-slate-950/40 border border-slate-900 rounded-xl p-4.5 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-white truncate">{item.product.name}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">₹{item.product.price} &bull; {item.product.unit}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-850 p-1 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1.5 text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart summary block */}
            {cart.length > 0 && (
              <div className="space-y-5 pt-4 border-t border-slate-900">
                <div className="space-y-2 text-xs text-slate-350">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="text-white font-bold">₹{cartTotalInfo.subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Express Delivery (15 mins)</span>
                    <span className="text-emerald-400 font-extrabold text-xs">₹{cartTotalInfo.deliveryFee}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black border-t border-slate-900 pt-2.5 mt-1">
                    <span className="text-white">Total Amount</span>
                    <span className="text-emerald-400 text-base">₹{cartTotalInfo.total}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-white shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Truck className="w-4 h-4" />
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal Dialog */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {orderStatus !== "success" && (
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}

            {orderStatus === "idle" && (
              <div className="space-y-5">
                <div className="space-y-1">
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <BriefcaseMedical className="w-5 h-5 text-emerald-400" />
                    Express Checkout
                  </h2>
                  <p className="text-xs text-slate-400 leading-normal">
                    Enter delivery location and select your payment method.
                  </p>
                </div>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  {/* Delivery Address */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      Delivery Address
                    </label>
                    <textarea
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Flat No, Wing, Apartment/Building, Sector, Nearby Landmark, City..."
                      className="w-full h-20 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-xs text-white transition-all placeholder:text-slate-600 resize-none"
                    />
                  </div>

                  {/* Phone number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 outline-none text-sm text-white transition-all placeholder:text-slate-600"
                    />
                  </div>

                  {/* Payment option */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-350 tracking-wide uppercase block">Select Payment Mode</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("upi")}
                        className={`p-3 rounded-xl border text-center space-y-1.5 transition-all cursor-pointer ${
                          paymentMethod === "upi"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <QrCode className="w-5 h-5 mx-auto" />
                        <span className="text-[10px] font-bold block">UPI Payment</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cod")}
                        className={`p-3 rounded-xl border text-center space-y-1.5 transition-all cursor-pointer ${
                          paymentMethod === "cod"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <Truck className="w-5 h-5 mx-auto" />
                        <span className="text-[10px] font-bold block">COD</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`p-3 rounded-xl border text-center space-y-1.5 transition-all cursor-pointer ${
                          paymentMethod === "card"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <CreditCard className="w-5 h-5 mx-auto" />
                        <span className="text-[10px] font-bold block">Card</span>
                      </button>
                    </div>
                  </div>

                  {/* UPI App Selection Sub-Panel */}
                  {paymentMethod === "upi" && (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <label className="text-[11px] font-bold text-slate-350 block">Select UPI App / Scanner:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "phonepe", name: "PhonePe", color: "bg-purple-900/30 text-purple-300 border-purple-700/40" },
                          { id: "gpay", name: "Google Pay", color: "bg-blue-900/30 text-blue-300 border-blue-700/40" },
                          { id: "paytm", name: "Paytm", color: "bg-cyan-900/30 text-cyan-300 border-cyan-700/40" },
                          { id: "bhim", name: "BHIM UPI", color: "bg-amber-900/30 text-amber-300 border-amber-700/40" },
                          { id: "mobikwik", name: "MobiKwik", color: "bg-emerald-900/30 text-emerald-300 border-emerald-700/40" },
                          { id: "qr", name: "UPI QR Scan", color: "bg-slate-800/40 text-slate-200 border-slate-700/40" },
                        ].map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => setSelectedUpiApp(app.id as any)}
                            className={`px-2.5 py-2 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              selectedUpiApp === app.id
                                ? `${app.color} ring-2 ring-emerald-400/50`
                                : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <span>{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing Total */}
                  <div className="bg-slate-950 border border-slate-900 rounded-xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Items Subtotal:</span>
                      <span className="text-white font-semibold">₹{cartTotalInfo.subtotal}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Delivery Fee:</span>
                      <span className="text-emerald-400 font-bold">₹{cartTotalInfo.deliveryFee}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-slate-900">
                      <span className="text-slate-350">Payable Amount:</span>
                      <span className="text-emerald-400 text-sm font-black">₹{cartTotalInfo.total}</span>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-white shadow-lg hover:shadow-emerald-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Place Order & Pay
                  </button>
                </form>
              </div>
            )}

            {orderStatus === "success" && (
              <div className="flex flex-col items-center text-center space-y-6 py-4 animate-scaleUp">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-white">Order Confirmed!</h3>
                  <p className="text-xs text-slate-350 max-w-sm leading-relaxed font-light">
                    Your payment was verified. The clinical order <strong className="text-white font-mono font-bold">{orderId}</strong> has been sent to our 24/7 dark-store hub.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-900 rounded-xl p-4.5 w-full flex items-center gap-4 text-left">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <Truck className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white">Delivery Dispatch Active</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                      Driver arriving at your address in <strong className="text-emerald-400 font-bold">12 minutes</strong>.
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetStore}
                  className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
                >
                  Return to Pharmacy
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dedicated UPI Scanner & Direct App Payment Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 text-center animate-scaleUp">
            <button
              onClick={() => {
                setShowUpiModal(false);
                setShowCheckoutModal(true);
                setOrderStatus("idle");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-1 text-center">
              <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
                UPI Payment Request
              </span>
              <h2 className="text-xl font-black text-white mt-1">Scan or Open UPI App to Pay</h2>
              <p className="text-xs text-slate-400">Order ID: <span className="font-mono text-white font-bold">{orderId}</span> &bull; Total Amount: <strong className="text-emerald-400">₹{cartTotalInfo.total}</strong></p>
            </div>

            {/* Generated Dynamic QR Code */}
            <div className="bg-white p-4 rounded-2xl w-52 h-52 mx-auto flex items-center justify-center shadow-lg border border-slate-700 relative group">
              <img
                src={qrCodeUrl}
                alt="UPI Payment QR Code Scanner"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              Scan with PhonePe, Google Pay, Paytm, BHIM, or any camera app
            </p>

            {/* Direct UPI App Launch Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-extrabold text-slate-400 uppercase block tracking-wider text-left">
                Direct App Payment:
              </label>
              
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={getUpiDeepLink("phonepe")}
                  className="py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open PhonePe
                </a>
                
                <a
                  href={getUpiDeepLink("gpay")}
                  className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Google Pay
                </a>

                <a
                  href={getUpiDeepLink("paytm")}
                  className="py-2.5 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Paytm
                </a>

                <a
                  href={getUpiDeepLink("bhim")}
                  className="py-2.5 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open BHIM UPI
                </a>
              </div>

              {/* Generic UPI Link */}
              <a
                href={getUpiDeepLink("generic")}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                Open Any Installed UPI App
              </a>
            </div>

            {/* UPI ID copy field */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
              <div className="text-left">
                <span className="text-[10px] text-slate-500 block">UPI ID / VPA:</span>
                <span className="font-mono text-xs font-bold text-emerald-400">{upiId}</span>
              </div>
              <button
                onClick={copyUpiId}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-[11px] font-bold text-white flex items-center gap-1 cursor-pointer transition-all"
              >
                {copiedUpi ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    Copy ID
                  </>
                )}
              </button>
            </div>

            {/* Confirm Payment Action Button */}
            <button
              onClick={confirmUpiPayment}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-extrabold text-white text-sm shadow-lg hover:shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4.5 h-4.5" />
              I Have Paid ₹{cartTotalInfo.total} &bull; Confirm Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
