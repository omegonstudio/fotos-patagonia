import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    //console.log("🟡 /api/contact hit")

    const body = await req.json()
    const {
      recaptchaToken,
      fullName,
      email,
      phone,
      message,
      contactType,
      location,
      date,
      eventType,
      eventDate,
      estimatedPeople,
    } = body

    // 1️⃣ Verificar captcha
    const captchaRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY!,
          response: recaptchaToken,
        }),
      }
    )

    const captchaData = await captchaRes.json()
    //console.log("🟢 captchaData:", captchaData)

    if (!captchaData.success) {
      return NextResponse.json({ error: "Captcha inválido" }, { status: 403 })
    }

    // 2️⃣ EmailJS — TEMPLATE PARAMS EXACTOS
    const emailRes = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost", // requerido por EmailJS
        },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          template_params: {
            title: "Contacto Web Fotos Patagonia",
            name: fullName,
            time: new Date().toLocaleString("es-AR"),
            fullName,
            email,
            phone: phone || "-",
            contactType,
            location: location || "-",
            date: date || "-",
            eventType: eventType || "-",
            eventDate: eventDate || "-",
            estimatedPeople: estimatedPeople || "-",
            message,
          },
        }),
      }
    )

    if (!emailRes.ok) {
      const errText = await emailRes.text()
      console.error("❌ EmailJS error:", errText)
      return NextResponse.json(
        { error: "Error enviando email" },
        { status: 500 }
      )
    }

    //console.log("🟢 Email enviado correctamente")
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("🔴 error /api/contact", error)
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    )
  }
}
