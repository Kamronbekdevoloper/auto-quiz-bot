import { config } from "../config.js";

// === SUBSCRIPTION CHECKER ===

function getChannelLink(channelId, channelLink) {
  if (channelLink) return channelLink;
  if (!channelId) return null;
  if (channelId.startsWith("http")) return channelId;
  if (channelId.startsWith("@")) return `https://t.me/${channelId.substring(1)}`;
  return null;
}

export async function isUserSubscribed(bot, userId, chatType = "private") {
  // Guruhda tekshiruv shart emas
  if (chatType !== "private") {
    return true;
  }

  // Kanal ID sozlanmagan bo'lsa
  if (!config.CHANNEL_ID) {
    console.warn("⚠️ CHANNEL_ID sozlanmagan! Obuna tekshiruvi o'tkazib yuborildi.");
    return true;
  }

  try {
    console.log(`🔍 Subscription check: User ${userId} → ${config.CHANNEL_ID}`);

    const member = await bot.getChatMember(config.CHANNEL_ID, userId);
    console.log(`ℹ️ User ${userId}: status = ${member.status}`);

    const validStatuses = ["member", "administrator", "creator"];
    const isSubscribed = validStatuses.includes(member.status);

    if (isSubscribed) {
      console.log(`✅ User ${userId} obuna qilgan`);
    } else {
      console.log(`❌ User ${userId} obuna qilmagan (status: ${member.status})`);
    }

    return isSubscribed;

  } catch (error) {
    // ✅ FIX #1: Xato turini aniqlaymiz
    const description =
      (error.response?.body && JSON.parse(error.response.body)?.description) ||
      error.message ||
      "";

    console.error(`❌ Subscription check xatosi (User ${userId}): ${description}`);

    // Bot kanalda admin emas yoki kanal topilmadi — CONFIG muammosi
    // Bu holda userlarni bloklamaymiz!
    if (
      description.includes("bot is not a member") ||
      description.includes("chat not found") ||
      description.includes("bot was kicked") ||
      description.includes("have no rights") ||
      description.includes("not enough rights")
    ) {
      console.error("🔧 MUAMMO: Bot kanalga admin sifatida qo'shilmagan!");
      console.error(`   Yechim: @${config.CHANNEL_ID?.replace("@", "")} kanalga botni admin qiling`);
      return true; // Config xatosi — userlarni bloklamaymiz
    }

    // User kanalda topilmadi yoki chiqib ketgan — obuna qilmagan
    if (description.includes("user not found") || description.includes("kicked")) {
      return false;
    }

    // Boshqa xatolar — ehtiyot uchun false
    return false;
  }
}

export function getSubscriptionBlockMessage() {
  const channelLink = getChannelLink(config.CHANNEL_ID, config.CHANNEL_LINK);

  if (!channelLink) {
    console.error("❌ Kanal linki yaratib bo'lmadi. CHANNEL_ID va CHANNEL_LINK tekshiring.");
  }

  const displayId = config.CHANNEL_ID || "Kanal";

  const text = `🔒 <b>Botdan foydalanish uchun kanalga obuna bo'ling!</b>

📢 Kanal: <code>${displayId}</code>

Quyidagi bosqichlarni bajaring:
1️⃣ "📢 Kanalga obuna bo'lish" tugmasini bosing
2️⃣ Kanalga obuna bo'ling
3️⃣ "✅ Tekshirish" tugmasini bosing`;

  const keyboard = {
    inline_keyboard: [
      ...(channelLink
        ? [[{ text: "📢 Kanalga obuna bo'lish", url: channelLink }]]
        : []),
      [{ text: "✅ Tekshirish", callback_data: "check_subscription" }],
    ],
  };

  return { text, keyboard };
}

export function getReCheckSubscriptionKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "✅ Tekshirish", callback_data: "check_subscription" }],
    ],
  };
}

export function debugChannelConfig() {
  console.log("\n========== KANAL KONFIGURATSIYASI ==========");
  console.log(`CHANNEL_ID:   ${config.CHANNEL_ID || "❌ SOZLANMAGAN"}`);
  console.log(`CHANNEL_LINK: ${config.CHANNEL_LINK || "❌ SOZLANMAGAN"}`);

  const generatedLink = getChannelLink(config.CHANNEL_ID, config.CHANNEL_LINK);
  console.log(`Kanal linki:  ${generatedLink || "❌ YARATIB BO'LMADI"}`);

  if (!config.CHANNEL_ID) {
    console.warn("⚠️  .env faylida CHANNEL_ID yo'q!");
  } else {
    console.log("✅ Kanal konfiguratsiyasi to'g'ri ko'rinadi");
    console.log("💡 Eslatma: Bot kanalda ADMIN bo'lishi shart!");
  }

  console.log("=============================================\n");
}