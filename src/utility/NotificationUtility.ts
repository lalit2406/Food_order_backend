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
    const authToken = '28ec5ca4b8d92d91e65c8f581efb26f4';
    const client = require('twilio')(accountSid, authToken);

    const response = await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: '+919315365058',
        to: `+91${toPhoneNumber}`,

    });

    return response;
    
}

// payment notifications or emails