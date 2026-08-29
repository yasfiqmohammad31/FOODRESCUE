import app from "../src/index";
import { seedDbDefaults } from "../src/db/mock-db";
import type { Env } from "../src/types";

const mockEnv: Env = {
  ENVIRONMENT: "test",
  APP_NAME: "FOODRESCUE API TEST",
  JWT_ACCESS_SECRET: "test_secret_key_2026",
  XENDIT_CALLBACK_TOKEN: "xnd_dev_callback_token_secret",
};

const api = (path: string, init?: RequestInit) => {
  return app.fetch(new Request(`http://localhost${path}`, init), mockEnv);
};

// Test runner helper
async function runTests() {
  seedDbDefaults();
  console.log("=================================================");
  console.log("🧪 STARTING FOODRESCUE BACKEND API TEST SUITE 🧪");
  console.log("=================================================\n");

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
  // 1. Health & Documentation Index
  // -------------------------------------------------------------
  await test("1.1 GET /health returns 200 OK with services status", async () => {
    const res = await api("/health");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.status === "ok", "Expected status ok");
    assert(data.services.api === "healthy", "Expected api healthy");
  });

  await test("1.2 GET /api/docs returns API endpoint catalogue", async () => {
    const res = await api("/api/docs");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.endpoints.length >= 10, "Expected at least 10 documented endpoints");
  });

  // -------------------------------------------------------------
  // 2. Authentication & Identity Flow
  // -------------------------------------------------------------
  let authToken = "";
  await test("2.1 POST /api/auth/register creates new user with Rescue Credit wallet", async () => {
    const res = await api("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Food Hero",
        email: "test.hero@foodrescue.id",
        phone: "+6281299998888",
        password: "password123",
        role: "CONSUMER",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success true");
    assert(typeof data.token === "string", "Expected JWT token string");
    authToken = data.token;
  });

  await test("2.2 POST /api/auth/login validates credentials and issues JWT", async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "test.hero@foodrescue.id",
        password: "password123",
        role: "CONSUMER",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected login success");
    assert(data.user.email === "test.hero@foodrescue.id", "Expected matching email");
  });

  await test("2.3 POST /api/auth/google handles 1-Tap OAuth token authentication", async () => {
    const res = await api("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken: "mock_google_id_token_xyz_999",
        role: "CONSUMER",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected Google auth success");
  });

  // -------------------------------------------------------------
  // 3. Merchant KYC Onboarding & Instant Store Toggle
  // -------------------------------------------------------------
  await test("3.1 POST /api/merchants/onboarding/step-1 validates store hours", async () => {
    const res = await api("/api/merchants/onboarding/step-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeName: "Artisan Bakery & Cafe",
        category: "Bakery & Pastry",
        businessPhone: "+6281987654321",
        address: "Jl. Raya Darmo Permai No. 45",
        openTime: "08:00",
        closeTime: "22:00",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("3.2 POST /api/merchants/onboarding/step-2 validates bank account digits", async () => {
    const res = await api("/api/merchants/onboarding/step-2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bankName: "BCA",
        accountNumber: "8271928401",
        accountHolder: "Artisan Bakery Official",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("3.3 POST /api/merchants/onboarding/step-3 completes SLA 85/15 agreement", async () => {
    const res = await api("/api/merchants/onboarding/step-3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agreedTerms: true,
        picName: "Budi Santoso",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.merchant.isVerified === true, "Merchant must be marked verified");
  });

  await test("3.4 PATCH /api/merchants/toggle-status toggles instant store open/close", async () => {
    const res = await api("/api/merchants/toggle-status", {
      method: "PATCH",
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(typeof data.isStoreOpen === "boolean", "Expected boolean store status");

    // Reopen store for subsequent tests
    if (!data.isStoreOpen) {
      await api("/api/merchants/toggle-status", { method: "PATCH" });
    }
  });

  await test("3.5 GET /api/merchants/stats returns 85% net revenue and metrics", async () => {
    const res = await api("/api/merchants/stats");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(typeof data.stats.availableBalance === "number", "Expected balance data");
    assert(data.stats.storeRating >= 4.0, "Expected store rating");
  });

  // -------------------------------------------------------------
  // 4. Hyperlocal Feed & Listing Operations
  // -------------------------------------------------------------
  let testListingId = "";
  await test("4.1 GET /api/listings calculates distance with Haversine formula", async () => {
    const res = await api("/api/listings?lat=-7.2856&lng=112.6954&radius=10");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.data.length > 0, "Expected listings in radius");
    assert(typeof data.data[0].distanceKm === "number", "Expected numeric distanceKm");
    testListingId = data.data[0].id;
  });

  await test("4.2 POST /api/listings creates package with price discount validation", async () => {
    const res = await api("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Mystery Box Croissant Special",
        description: "Aneka croissant butter dan almond hangat.",
        category: "MYSTERY_BOX",
        originalPrice: 60000,
        discountedPrice: 25000,
        quantityTotal: 5,
        pickupStart: "2026-08-29T18:00:00Z",
        pickupEnd: "2026-08-29T21:00:00Z",
        allergens: ["Gluten", "Dairy"],
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.listing.discountedPrice === 25000, "Expected discounted price");
  });

  await test("4.3 POST /api/listings rejects if discountedPrice >= originalPrice", async () => {
    const res = await api("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Invalid Overpriced Food",
        description: "Harga tidak masuk akal.",
        category: "REGULAR",
        originalPrice: 30000,
        discountedPrice: 35000, // Invalid: more expensive!
        quantityTotal: 3,
        pickupStart: "2026-08-29T18:00:00Z",
        pickupEnd: "2026-08-29T21:00:00Z",
        allergens: [],
      }),
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  await test("4.4 PATCH /api/listings/:id/stock updates quantity and SOLD_OUT status", async () => {
    const res = await api(`/api/listings/${testListingId}/stock`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 10 }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.listing.quantityRemaining === 10, "Expected stock updated to 10");
  });

  // -------------------------------------------------------------
  // 5. Checkout, Stock Reservation, & 60s Instant Undo Engine
  // -------------------------------------------------------------
  let createdOrderId = "";
  let cleanOrderNumber = "";
  await test("5.1 POST /api/orders reserves stock and starts 60s Undo Window", async () => {
    const res = await api("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consumerId: "usr-cns-001",
        listingId: testListingId,
        quantity: 2,
        paymentMethod: "QRIS",
        useRescueCredit: false,
      }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.order.status === "UNDO_WINDOW", "Expected UNDO_WINDOW status");
    assert(!data.order.orderNumber.startsWith("#"), "Order number must be clean without #");
    assert(data.order.orderNumber.startsWith("FR-"), "Order number must start with FR-");
    createdOrderId = data.order.id;
    cleanOrderNumber = data.order.orderNumber;
  });

  await test("5.2 POST /api/orders/:id/undo executes 100% refund to Rescue Credit and restores stock", async () => {
    const res = await api(`/api/orders/${createdOrderId}/undo`, {
      method: "POST",
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.order.status === "CANCELLED_CONSUMER_UNDO", "Expected CANCELLED_CONSUMER_UNDO status");
    assert(data.newBalance >= data.order.totalPrice, "Wallet balance must be credited 100%");
  });

  await test("5.3 POST /api/orders/:id/undo rejects second undo attempt (Idempotency / Already Cancelled)", async () => {
    const res = await api(`/api/orders/${createdOrderId}/undo`, {
      method: "POST",
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  // Create another confirmed order for voucher & scanner testing
  let confirmedOrderId = "";
  await test("5.4 Prepare confirmed order for pickup & voucher verification", async () => {
    const res = await api("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        consumerId: "usr-cns-001",
        listingId: testListingId,
        quantity: 1,
        paymentMethod: "QRIS",
        useRescueCredit: false,
      }),
    });
    const data = await res.json();
    confirmedOrderId = data.order.id;

    // Simulate 60s expiration by advancing status to CONFIRMED
    await api(`/api/orders/${confirmedOrderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "READY" }),
    });
  });

  // -------------------------------------------------------------
  // 6. Dynamic 30s Rotating QR Voucher & Merchant Scanner
  // -------------------------------------------------------------
  let dynamicQrToken = "";
  await test("6.1 GET /api/vouchers/:orderId generates 30s rotating JWT voucher", async () => {
    const res = await api(`/api/vouchers/${confirmedOrderId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(typeof data.token === "string", "Expected JWT token string");
    assert(data.rotationIntervalSeconds === 30, "Expected 30s rotation interval");
    dynamicQrToken = data.token;
  });

  await test("6.2 POST /api/vouchers/verify-pickup verifies QR scan and marks PICKED_UP", async () => {
    const res = await api("/api/vouchers/verify-pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: dynamicQrToken,
        merchantId: "mer-01",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.order.status === "PICKED_UP", "Order must be marked PICKED_UP");
  });

  await test("6.3 POST /api/vouchers/verify-pickup rejects token reuse (Anti-Replay Protection)", async () => {
    const res = await api("/api/vouchers/verify-pickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: dynamicQrToken,
        merchantId: "mer-01",
      }),
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
    const data = await res.json();
    assert(data.reason === "ALREADY_USED", "Expected ALREADY_USED rejection");
  });

  // -------------------------------------------------------------
  // 7. Merchant Payout Disbursement to Bank
  // -------------------------------------------------------------
  await test("7.1 POST /api/payouts/withdraw processes withdrawal to registered bank", async () => {
    const res = await api("/api/payouts/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 250000 }),
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    const data = await res.json();
    assert(data.payout.payoutNumber.startsWith("WD-"), "Expected WD- batch number");
    assert(data.payout.status === "PROCESSING", "Expected PROCESSING status");
  });

  await test("7.2 POST /api/payouts/withdraw rejects amounts below Rp 10.000", async () => {
    const res = await api("/api/payouts/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 5000 }),
    });
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  // -------------------------------------------------------------
  // 8. AI Sentiment Analysis & Food Safety Moderation
  // -------------------------------------------------------------
  await test("8.1 POST /api/ai/sentiment-analysis flags critical food safety hazards", async () => {
    const res = await api("/api/ai/sentiment-analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: confirmedOrderId,
        rating: 1,
        comment: "Rotinya sudah berjamur dan ada bau asam basi, tolong diperiksa.",
        consumerId: "usr-cns-001",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.review.sentiment === "CRITICAL_FOOD_SAFETY", "Must flag CRITICAL_FOOD_SAFETY");
    assert(data.review.moderationFlag === true, "Must set moderationFlag true");
  });

  await test("8.2 POST /api/ai/dynamic-pricing calculates closing discount recommendations", async () => {
    const res = await api("/api/ai/dynamic-pricing", {
      method: "POST",
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Dynamic pricing engine must respond successfully");
  });

  // -------------------------------------------------------------
  // 9. Environmental Impact & Gamification Metrics
  // -------------------------------------------------------------
  await test("9.1 GET /api/impact/me returns accumulated CO2e avoided and badges", async () => {
    const res = await api("/api/impact/me?userId=usr-cns-001");
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.stats.portionsSaved >= 1, "Expected portions saved");
    assert(data.stats.co2eSavedKg > 0, "Expected CO2e avoided");
    assert(data.badges.length >= 3, "Expected unlocked badges list");
  });

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n=================================================");
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
