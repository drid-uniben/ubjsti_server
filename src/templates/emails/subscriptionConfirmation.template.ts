export const subscriptionConfirmationTemplate = (
  email: string,
  unsubscribeToken: string
): string => {
  const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe/${unsubscribeToken}`;

  return `
<html>
<head>
    <style type="text/css">
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7A0019 0%, #5A0A1A 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .button { display: inline-block; padding: 12px 30px; background: #7A0019; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to UBJSTI Updates!</h1>
        </div>
        
        <div class="content">
            <p>Thank you for subscribing to UNIBEN Journal of Science, Technology and Innovation email alerts!</p>
            
            <p>You will now receive notifications when new articles are published in our journal.</p>
            
            <p>You can unsubscribe at any time by clicking the link below:</p>
            
            <a href="${unsubscribeUrl}" class="button">Unsubscribe</a>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} University of Benin. All rights reserved.</p>
            <p>UNIBEN Journal of Science, Technology and Innovation</p>
        </div>
    </div>
</body>
</html>
`;
};
