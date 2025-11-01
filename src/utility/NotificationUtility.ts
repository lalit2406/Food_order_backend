// Email

// notifications

// otp
export const GenerateOTP = () => {
    // logic to generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    let expiry = new Date();
    expiry.setTime(new Date().getTime() + 30*60*1000); // 30 minutes expiry
    return { otp, expiry };
}



export const onRequestOTP = async (otp: number, toPhoneNumber: string) => {
    // send OTP to user via SMS or Email

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);

    const response = await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: '+919315365058',
        to: `+91${toPhoneNumber}`,

    });

    return response;
    
}

// payment notifications or emails