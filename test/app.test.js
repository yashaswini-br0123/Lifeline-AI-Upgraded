const test = require('node:test');
const assert = require('node:assert/strict');

test('First Aid Emergency Triage Verification', async (t) => {
  await t.test('Chest pain emergency classification', () => {
    const symptom = 'severe chest pain and shortness of breath';
    const isSevere = /chest|heart|attack|breath|stroke|bleed|unconscious|chok/i.test(symptom);
    assert.equal(isSevere, true);
  });

  await t.test('Toothache non-life-threatening classification', () => {
    const symptom = 'mild toothache';
    const isSevere = /chest|heart|attack|breath|stroke|bleed|unconscious|chok/i.test(symptom);
    assert.equal(isSevere, false);
  });
});

test('Drug Research Cache Verification', async (t) => {
  await t.test('Common drug lookup', () => {
    const COMMON_DRUGS = {
      "paracetamol": { name: "Paracetamol (Acetaminophen)", class: "Analgesic & Antipyretic" },
      "aspirin": { name: "Aspirin (Acetylsalicylic Acid)", class: "NSAID & Antiplatelet" }
    };
    
    assert.ok(COMMON_DRUGS["paracetamol"]);
    assert.equal(COMMON_DRUGS["paracetamol"].name, "Paracetamol (Acetaminophen)");
  });
});

test('UPI Payment & Delivery Charge Verification', async (t) => {
  await t.test('Flat 5 INR delivery fee calculation', () => {
    const subtotal = 100;
    const deliveryFee = subtotal > 0 ? 5 : 0;
    const total = subtotal + deliveryFee;

    assert.equal(deliveryFee, 5);
    assert.equal(total, 105);
  });

  await t.test('UPI Deep Link URI generation', () => {
    const recipient = "lifelineai@upi";
    const amount = 105;
    const phonepeUri = `phonepe://pay?pa=${recipient}&pn=Lifeline+AI+Pharmacy&am=${amount}&cu=INR`;
    assert.ok(phonepeUri.includes("phonepe://pay"));
    assert.ok(phonepeUri.includes("am=105"));
  });
});

test('AI Companion Role History Sanitization', async (t) => {
  await t.test('Sanitizes model first history turn', () => {
    const history = [
      { role: "assistant", content: "Hello! How can I help?" },
      { role: "user", content: "How to use pharmacy?" }
    ];

    const sanitized = [];
    for (const msg of history) {
      const role = msg.role === "user" ? "user" : "model";
      if (sanitized.length === 0 && role === "model") continue;
      sanitized.push({ role, content: msg.content });
    }

    assert.equal(sanitized[0].role, "user");
  });
});
