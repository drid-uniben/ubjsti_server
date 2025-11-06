export const newArticleNotificationTemplate = (
  title: string,
  authorName: string,
  articleId: string,
  unsubscribeToken: string
): string => {
  const articleUrl = `${process.env.FRONTEND_URL}/articles/${articleId}`;
  const unsubscribeUrl = `${process.env.FRONTEND_URL}/unsubscribe/${unsubscribeToken}`;

  return `
<html>
<head>
    <style type="text/css">
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7A0019 0%, #5A0A1A 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .article-title { color: #7A0019; font-size: 20px; font-weight: bold; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 30px; background: #7A0019; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .unsubscribe { color: #999; font-size: 11px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Article Published!</h1>
        </div>
        
        <div class="content">
            <p>A new article has been published in UNIBEN Journal of Science, Technology and Innovation:</p>
            
            <div class="article-title">${title}</div>
            
            <p><strong>Author:</strong> ${authorName}</p>
            
            <p>Click the button below to read the full article:</p>
            
            <a href="${articleUrl}" class="button">Read Article</a>
            
            <p>Thank you for your continued interest in our research!</p>
        </div>
        
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} University of Benin. All rights reserved.</p>
            <p>UNIBEN Journal of Science, Technology and Innovation</p>
            <div class="unsubscribe">
                <p>Don't want to receive these emails? <a href="${unsubscribeUrl}">Unsubscribe</a></p>
            </div>
        </div>
    </div>
</body>
</html>
`;
};
