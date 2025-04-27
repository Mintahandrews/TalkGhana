require("dotenv").config();
const axios = require("axios");

async function testWhatsAppConnection() {
  try {
    // Get environment variables
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiVersion = process.env.WHATSAPP_API_VERSION || "v17.0";

    if (!accessToken || !phoneNumberId) {
      console.error(
        "Error: Missing environment variables. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID."
      );
      process.exit(1);
    }

    // Test the WhatsApp API connection
    const response = await axios.get(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("✅ Connection successful!");
    console.log("Phone number details:", response.data);

    return true;
  } catch (error) {
    console.error("❌ Connection failed:");

    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error("Error details:", error.response.data);
    } else {
      console.error(error.message);
    }

    return false;
  }
}

testWhatsAppConnection();
