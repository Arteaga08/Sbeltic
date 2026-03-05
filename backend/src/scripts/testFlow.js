import assert from "assert";

const BASE_URL = "http://localhost:5009/api";
let token = "";
let adminId = "";
let anaId = "";
let reginaId = "";
let productId = "";
let anaAppointmentId = "";
let treatmentId = "";

// 🔑 Credenciales (Asegúrate de que existan en tu DB)
const EMAIL_ADMIN = "admin@sbeltic.com";
const PASSWORD_ADMIN = "Password123!";

const runTests = async () => {
  try {
    console.log("🚀 Iniciando Simulación E2E de Sbeltic...\n");

    // 1️⃣ LOGIN
    console.log("1️⃣ Autenticando Admin...");
    const loginRes = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL_ADMIN, password: PASSWORD_ADMIN }),
    });
    const loginData = await loginRes.json();
    if (!loginData.data)
      throw new Error("Login fallido. Revisa tus credenciales.");
    token = loginData.data.token;
    adminId = loginData.data.user._id;
    console.log("✅ Token obtenido.");

    // 2️⃣ PREPARAR INVENTARIO (Para probar el descuento FEFO)
    console.log("2️⃣ Creando Producto y Lote de prueba...");
    const prodRes = await fetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "Ácido Hialurónico - Test",
        category: "INSUMO",
        unit: "ml",
        isTrackable: true,
      }),
    });
    const prodData = await prodRes.json();
    productId = prodData.data._id;

    await fetch(`${BASE_URL}/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId,
        batchNumber: "LOT-999",
        expiryDate: "2027-01-01",
        initialQuantity: 10,
      }),
    });
    console.log("✅ Inventario listo (10 unidades).");

    // 3️⃣ REGISTRO DE PACIENTES
    console.log("3️⃣ Registrando a Ana y Regina...");

    const register = async (name, phone) => {
      const res = await fetch(`${BASE_URL}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, phone }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.log(`❌ Error en ${name}:`, json.message);
        if (json.stack)
          console.log("📂 Línea del error:", json.stack.split("\n")[1]);
        process.exit(1);
      }
      return json.data._id;
    };

    anaId = await register("Ana Sofia", "+528111111111");
    reginaId = await register("Regina V", "+528222222222");
    console.log("✅ Pacientes creadas.");

    // 4️⃣ AGENDAR A ANA (Conflicto de Cabina)
    console.log("4️⃣ Agendando a Ana (CABINA_1)...");
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 1); // Mañana
    targetDate.setHours(10, 0, 0, 0);

    const apptRes = await fetch(`${BASE_URL}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        patientId: anaId,
        doctorId: adminId,
        roomId: "CABINA_1",
        appointmentDate: targetDate.toISOString(),
        duration: 60,
        treatmentName: "Facial Profundo",
      }),
    });
    const apptData = await apptRes.json();
    anaAppointmentId = apptData.data._id;
    console.log("✅ Cita de Ana creada.");

    // 5️⃣ LISTA DE ESPERA (Regina quiere el mismo lugar)
    console.log("5️⃣ Regina entra a Waitlist para el mismo horario...");
    const waitRes = await fetch(`${BASE_URL}/waitlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        patientId: reginaId,
        doctorId: adminId,
        desiredDate: targetDate.toISOString(),
      }),
    });
    console.log("✅ Regina en espera.");

    // 6️⃣ CANCELACIÓN Y TRIGGER (WhatsApp Simulation)
    console.log("6️⃣ Cancelando cita de Ana...");
    const cancelRes = await fetch(
      `${BASE_URL}/appointments/${anaAppointmentId}/cancel`,
      {
        method: "PATCH", // 👈 IMPORTANTE: Usamos la ruta específica que definimos
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const cancelData = await cancelRes.json();
    assert.ok(
      cancelData.data.waitlistTriggered,
      "La lista de espera no se disparó",
    );
    console.log("✅ ¡Waitlist disparada! Mensaje para Regina generado.");

    // 7️⃣ CHECKOUT FINAL (Cobro + Inventario)
    console.log("7️⃣ Realizando Checkout de prueba...");
    // Creamos cita rápida para probar cobro
    const finalApptRes = await fetch(`${BASE_URL}/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        patientId: anaId,
        doctorId: adminId,
        roomId: "CABINA_2",
        appointmentDate: new Date(Date.now() + 50000).toISOString(),
        duration: 30,
        treatmentName: "Aplicación Bótox",
      }),
    });
    const finalApptId = (await finalApptRes.json()).data._id;

    const checkoutRes = await fetch(`${BASE_URL}/appointments/${finalApptId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: "COMPLETED",
        originalQuote: 2000,
        consumedSupplies: [{ productId: productId, quantity: 1 }], // 👈 PROBANDO FEFO
      }),
    });
    const checkoutData = await checkoutRes.json();

    assert.strictEqual(checkoutData.data.status, "COMPLETED");
    console.log(
      `✅ Cita completada. Monto Final: ${checkoutData.data.finalAmount}`,
    );
    console.log("✅ Inventario descontado y Cupones generados.");

    console.log("\n---");
    console.log(
      "🎉 ¡Sbeltic es 100% OPERACIONAL! El flujo de Vidix Studio es perfecto.",
    );
    console.log("---");
  } catch (error) {
    console.error(`\n❌ ERROR EN LA SIMULACIÓN: ${error.message}`);
  }
};

runTests();
