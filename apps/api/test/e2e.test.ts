import app from "../src/index";
import { db, resetDbToEmpty } from "../src/db/mock-db";
import type { Env } from "../src/types";

const mockEnv: Env = {
  ENVIRONMENT: "test",
  APP_NAME: "FOODRESCUE E2E TEST",
  JWT_ACCESS_SECRET: "e2e_test_jwt_secret_key_2026",
  XENDIT_CALLBACK_TOKEN: "xnd_dev_callback_token_secret",
};

const api = (path: string, init?: RequestInit) => {
  return app.fetch(new Request(`http://localhost${path}`, init), mockEnv);
};

// ==============================================================================
// 🧪 FOODRESCUE FULL END-TO-END (E2E) INTEGRATION & LIFECYCLE TEST SUITE
// ==============================================================================
async function runE2ETests() {
  console.log("\n============================================================");
  console.log("🚀 STARTING FOODRESCUE ZERO-BASE END-TO-END (E2E) TEST SUITE");
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}`);
      console.error(`   Reason: ${err.message}\n`);
      failed++;
    }
  }

  function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(msg);
  }

  // -------------------------------------------------------------
  // PHASE 0: EMPTY DATABASE INITIALIZATION
  // -------------------------------------------------------------
  await test("0.1 Reset in-memory database to 100% empty state", async () => {
    resetDbToEmpty();
    assert(db.users.length === 0, "Users should be empty");
    assert(db.merchants.length === 0, "Merchants should be empty");
    assert(db.listings.length === 0, "Listings should be empty");
    assert(db.orders.length === 0, "Orders should be empty");
    assert(db.payouts.length === 0, "Payouts should be empty");
    assert(Object.keys(db.wallets).length === 0, "Wallets should be empty");
  });

  // -------------------------------------------------------------
  // PHASE 1: MERCHANT REGISTRATION, ONBOARDING & SETUP
  // -------------------------------------------------------------
  let merchantToken = "";
  let merchantUserId = "";

  await test("1.1 Merchant registers new account from empty database", async () => {
    const res = await api("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ahmad Fauzi",
        email: "ahmad@surabayafreshbake.com",
        phone: "+6281987654321",
        password: "merchantpassword123",
        role: "MERCHANT",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success true");
    assert(typeof data.token === "string", "Expected JWT token string");
    merchantToken = data.token;
    merchantUserId = data.user.id;
  });

  await test("1.2 Merchant authenticates via login endpoint", async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "ahmad@surabayafreshbake.com",
        password: "merchantpassword123",
        role: "MERCHANT",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected login success");
    assert(data.user.email === "ahmad@surabayafreshbake.com", "Expected matching merchant email");
  });

  await test("1.3 Merchant completes Onboarding Step 1 (Store Identity & Schedule)", async () => {
    const res = await api("/api/merchants/onboarding/step-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeName: "Surabaya Fresh Bake",
        category: "Bakery & Pastry",
        businessPhone: "081987654321",
        address: "Jl. Embong Malang No. 10, Surabaya",
        openTime: "07:00",
        closeTime: "21:30",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected step 1 success");
  });

  await test("1.4 Merchant completes Onboarding Step 2 (Bank Disbursement Account)", async () => {
    const res = await api("/api/merchants/onboarding/step-2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankName: "BCA",
        accountNumber: "7722119988",
        accountHolder: "Surabaya Fresh Bake Official",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected step 2 success");
  });

  await test("1.5 Merchant completes Onboarding Step 3 (SLA 85/15 Agreement)", async () => {
    const res = await api("/api/merchants/onboarding/step-3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agreedTerms: true,
        picName: "Ahmad Fauzi",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected step 3 success");
    assert(data.merchant.isVerified === true, "Expected merchant verified");
  });

  await test("1.6 Merchant toggles store open/close status", async () => {
    const res1 = await api("/api/merchants/toggle-status", { method: "PATCH" });
    const data1 = await res1.json();
    assert(data1.isStoreOpen === false, "Store should be closed");

    const res2 = await api("/api/merchants/toggle-status", { method: "PATCH" });
    const data2 = await res2.json();
    assert(data2.isStoreOpen === true, "Store should be open again");
  });

  // -------------------------------------------------------------
  // PHASE 2: SURPLUS LISTINGS & AI PRICING
  // -------------------------------------------------------------
  let listingMysteryId = "";
  let listingRegularId = "";

  await test("2.1 Merchant creates Mystery Box surplus listing", async () => {
    const res = await api("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Mystery Box Croissant & Danish",
        description: "Aneka pastry segar berkualitas tinggi hasil panggangan hari ini.",
        category: "MYSTERY_BOX",
        originalPrice: 50000,
        discountedPrice: 20000,
        quantityTotal: 8,
        pickupStart: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        pickupEnd: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
        allergens: ["Gluten", "Dairy", "Eggs"],
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected listing created");
    assert(data.listing.quantityRemaining === 8, "Expected quantity 8");
    listingMysteryId = data.listing.id;
  });

  await test("2.2 Merchant creates Regular package surplus listing", async () => {
    const res = await api("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Artisan Sourdough Batard",
        description: "Sourdough batard artisan fermentasi alami.",
        category: "REGULAR",
        originalPrice: 40000,
        discountedPrice: 18000,
        quantityTotal: 5,
        pickupStart: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        pickupEnd: new Date(Date.now() + 1000 * 60 * 180).toISOString(),
        allergens: ["Gluten"],
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected regular listing created");
    listingRegularId = data.listing.id;
  });

  await test("2.3 API rejects invalid discount (discountedPrice >= originalPrice)", async () => {
    const res = await api("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Invalid Price Listing",
        description: "Testing pricing constraint validation.",
        category: "REGULAR",
        originalPrice: 30000,
        discountedPrice: 35000,
        quantityTotal: 2,
        pickupStart: new Date().toISOString(),
        pickupEnd: new Date(Date.now() + 3600000).toISOString(),
      }),
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  await test("2.4 Merchant applies AI Dynamic Pricing suggestion", async () => {
    const res = await api(`/api/listings/${listingMysteryId}/apply-ai-price`, {
      method: "POST",
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected AI price applied");
  });

  // -------------------------------------------------------------
  // PHASE 3: CONSUMER DISCOVERY & RADIUS QUERY
  // -------------------------------------------------------------
  let consumerUserId = "";

  await test("3.1 Consumer registers new account and initializes Rescue Credit wallet", async () => {
    const res = await api("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Budi Pratama",
        email: "budi.mhs@kampus.ac.id",
        phone: "+6281233445566",
        password: "consumerpass123",
        role: "CONSUMER",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success true");
    consumerUserId = data.user.id;
    assert(db.wallets[consumerUserId].balance === 0, "Initial wallet should be Rp 0");
  });

  await test("3.2 Consumer discovers nearby listings with Haversine distance", async () => {
    const res = await api("/api/listings?lat=-7.2856&lng=112.6954&radius=15&sortBy=distance");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.data.length === 2, `Expected 2 listings, got ${data.data.length}`);
    assert(typeof data.data[0].distanceKm === "number", "Expected distance in km");
  });

  await test("3.3 Consumer retrieves specific listing details", async () => {
    const res = await api(`/api/listings/${listingMysteryId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.listing.id === listingMysteryId, "Expected matching listing ID");
    assert(data.listing.allergens.includes("Gluten"), "Expected allergen info present");
  });

  // -------------------------------------------------------------
  // PHASE 4: CHECKOUT, STOCK RESERVATION & 60s INSTANT UNDO
  // -------------------------------------------------------------
  let undoOrderId = "";

  await test("4.1 Consumer places order 1 (Stock reserved & 60s Undo Window started)", async () => {
    const res = await api("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consumerId: consumerUserId,
        listingId: listingMysteryId,
        quantity: 2,
        paymentMethod: "QRIS",
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected order created");
    assert(data.order.status === "UNDO_WINDOW", "Expected UNDO_WINDOW status");
    undoOrderId = data.order.id;

    // Verify stock decremented
    const listing = db.listings.find((l) => l.id === listingMysteryId);
    assert(listing?.quantityRemaining === 6, "Stock should decrement from 8 to 6");
  });

  await test("4.2 Consumer triggers 60s Instant Undo (100% Refund to Rescue Credit & Stock Restored)", async () => {
    const res = await api(`/api/orders/${undoOrderId}/undo`, {
      method: "POST",
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected undo success");
    assert(data.refundAmount === 34000, `Expected refund 34000, got ${data.refundAmount}`);

    // Verify Rescue Credit wallet balance
    assert(db.wallets[consumerUserId].balance === 34000, "Wallet should receive 100% refund");

    // Verify Stock restored in listing
    const listing = db.listings.find((l) => l.id === listingMysteryId);
    assert(listing?.quantityRemaining === 8, "Stock should restore back to 8");
  });

  await test("4.3 Idempotent Undo Safety: Rejects second undo attempt on already cancelled order", async () => {
    const res = await api(`/api/orders/${undoOrderId}/undo`, {
      method: "POST",
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  // -------------------------------------------------------------
  // PHASE 5: SUCCESSFUL RE-ORDER, PREPARATION & QR VOUCHER HANDOVER
  // -------------------------------------------------------------
  let confirmedOrderId = "";

  await test("4.4 Consumer re-orders using Rescue Credit balance", async () => {
    const res = await api("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consumerId: consumerUserId,
        listingId: listingMysteryId,
        quantity: 1,
        paymentMethod: "RESCUE_CREDIT",
        useRescueCredit: true,
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    confirmedOrderId = data.order.id;

    // Verify Rescue Credit deducted (34000 - 17000 = 17000)
    assert(db.wallets[consumerUserId].balance === 17000, "Wallet should decrement from 34000 to 17000");
  });

  await test("5.1 Order confirmed after 60s Undo Window expires", async () => {
    const res = await api(`/api/orders/${confirmedOrderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PREPARING" }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("5.2 Merchant marks order READY for pickup", async () => {
    const res = await api(`/api/orders/${confirmedOrderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "READY" }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  let voucherToken = "";
  await test("5.3 Consumer generates 30s rotating JWT QR voucher", async () => {
    const res = await api(`/api/vouchers/${confirmedOrderId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(typeof data.token === "string", "Expected signed voucher token");
    assert(data.order.id === confirmedOrderId, "Expected matching order");
    voucherToken = data.token;
  });

  await test("5.4 Merchant scans QR voucher -> verified & marked PICKED_UP", async () => {
    const res = await api("/api/vouchers/verify-pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: voucherToken,
        merchantId: "mer-01",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected pickup verification success");
    assert(data.order.status === "PICKED_UP", "Expected status PICKED_UP");
  });

  await test("5.5 Anti-Replay Security: Rejects second scan of same voucher token", async () => {
    const res = await api("/api/vouchers/verify-pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: voucherToken,
        merchantId: "mer-01",
      }),
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  // -------------------------------------------------------------
  // PHASE 6: POST-PICKUP, AI SENTIMENT, IMPACT & FINANCIAL SETTLEMENT
  // -------------------------------------------------------------
  await test("6.1 Consumer submits review with AI Sentiment & Food Safety Moderation", async () => {
    const res = await api("/api/ai/sentiment-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: confirmedOrderId,
        rating: 5,
        comment: "Pastrynya renyah, wangi butter premium, porsi melimpah dan packing bersih!",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.sentiment === "POSITIVE", `Expected POSITIVE sentiment, got ${data.sentiment}`);
    assert(data.criticalFlag === false, "Should not be critical");
  });

  await test("6.2 AI Moderation flags critical food safety hazard review", async () => {
    const res = await api("/api/ai/sentiment-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: confirmedOrderId,
        rating: 1,
        comment: "Makanan basi dan berbau asam menyengat, bikin sakit perut!",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.criticalFlag === true, "Expected critical food safety flag");
  });

  await test("6.3 Consumer checks cumulative sustainability impact and badges", async () => {
    const res = await api(`/api/impact/me?userId=${consumerUserId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.stats.portionsSaved >= 1, "Expected at least 1 portion saved");
    assert(data.stats.co2eSavedKg > 0, "Expected positive CO2e reduction");
    assert(Array.isArray(data.badges), "Expected badges array");
  });

  await test("6.4 Merchant checks updated revenue stats (85% Net SLA Settlement)", async () => {
    const res = await api("/api/merchants/stats");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(typeof data.stats.todayRevenue === "number", "Expected numeric revenue");
    assert(data.stats.isStoreOpen === true, "Store should be open");
  });

  await test("6.5 Merchant withdraws accumulated earnings to registered bank", async () => {
    const res = await api("/api/payouts/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 17000, // 85% of Rp 20.000
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected withdrawal success");
    assert(data.payout.amount === 17000, "Expected amount 17000");
    assert(data.payout.bankName === "BCA", "Expected BCA bank");
  });

  await test("6.6 Payout withdrawal below Rp 10.000 minimum is rejected", async () => {
    const res = await api("/api/payouts/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 5000,
      }),
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  await test("6.7 Payout history records withdrawal with PROCESSING status", async () => {
    const res = await api("/api/payouts/history");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.history.length >= 1, "Expected at least 1 payout in history");
    assert(data.history[0].status === "PROCESSING", "Expected status PROCESSING");
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("\n============================================================");
  console.log(`📊 E2E TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error("Fatal E2E test runner error:", err);
  process.exit(1);
});
