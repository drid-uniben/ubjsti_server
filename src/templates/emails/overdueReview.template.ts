import { commonStyles, commonFooter } from './styles';

export const overdueReviewTemplate = (
  reviewerName: string,
  manuscriptTitle: string,
  reviewUrl: string,
  reminderType: '3_WEEKS' | '4_WEEKS' | '5_WEEKS'
): string => {
  let reminderMessage = '';
  switch (reminderType) {
    case '3_WEEKS':
      reminderMessage = 'This is a 3-week overdue reminder.';
      break;
    case '4_WEEKS':
      reminderMessage = 'This is a 4-week overdue reminder.';
      break;
    case '5_WEEKS':
      reminderMessage = 'This is a 5-week overdue reminder. Further action may be taken if the review is not submitted soon.';
      break;
  }

  return `
<html>
<head>
    <style type="text/css">
        ${commonStyles}
        .overdue-notice {
            color: #cc0000;
            font-weight: bold;
            padding: 10px;
            background-color: #ffecec;
            border-left: 3px solid #cc0000;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>OVERDUE: Manuscript Review</h1>
    </div>
    
    <div class="content">
        <p>Dear <strong>${reviewerName}</strong>,</p>
        
        <p>Our records indicate that your review for the following manuscript is now <strong>overdue</strong>:</p>
        
        <div class="proposal-title">"${manuscriptTitle}"</div>
        
        <p class="overdue-notice">${reminderMessage}</p>
        
        <p>Your expert evaluation is critical to our journal's quality, and the decision on this manuscript cannot be finalized without your input.</p>
        
        <a href="${reviewUrl}" class="button">Complete Review Now</a>
        
        <p>If you are experiencing difficulties completing the review or need an extension, please inform the editorial office immediately.</p>
    </div>
    
    ${commonFooter}
</body>
</html>
`;
};
