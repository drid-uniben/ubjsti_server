/* eslint-disable max-len */
// migrate_articles.js
// Usage: mongosh "mongodb://localhost:27017/YOUR_DB_NAME" migrate_articles.js
// Migrate ONE ISSUE AT A TIME — change the array below for each run.

// ============================================================
// EDIT THIS ARRAY — one object per article
// ============================================================
const ARTICLES_TO_MIGRATE = [
  {
    title:
      'JOURNAL SELECTION PRACTICES AS DETERMINANTS OF ACADEMIC LIBRARIAN’S RESEARCH PRODUCTIVITY IN UNIVERSITIES IN SOUTH-SOUTH, NIGERIA',
    abstract:
      "Research productivity is an important condition for the recognition, promotion and career advancement of librarians. However, previous studies have established low level of research productivity of librarians in South-South, Nigeria, making it a subject of concern to the university and library management. While existing studies have analyzed bibliometric data of librarians' publications, the influence of journal selection practices (choice of journal, discoverability, scope of journal, impact factor, indexing, peer review process)  on research productivity has not been fully measured in the existing body of knowledge. Therefore, this study investigated the influence of journal selection practices as determinants of academic librarians research productivity in South-South, Nigeria. The study adopted survey research design. The population comprised 229 academic librarians in 30 universities in South-South, Nigeria. Total enumeration sampling technique was used for the study. A structured and validated questionnaire was used for data collection. Cronbach’s alpha reliability coefficients for the constructs ranged from 0.82 to 0.88 The response rate was 86.4%. Data were analyzed using descriptive and inferential (simple and multiple regression) statistics at 5% level of significance. Findings revealed journal selection practices had a significant influence on research productivity (Adj.R2 = 0.63, F(5, 192) = 203.47, p < 0.05). Of the indicators of journal selection practices: choice of journal (β = 0.31, t(192) = 4.80, p < 0.05), discoverability (β = 0.60, t(192) = 12.35, p < 0.05) and scope of journal (β = 0.53, t(192) = 8.47, p < 0.05) positively and significantly influenced research productivity. Indexing (β = -0.20, t(192) = -0.22, p > 0.05) and peer review process (β = -0.04, t(192) = -0.14, p > 0.05) had no significant influence on research productivity. The study concluded that journal selection practices affected research productivity of academic librarians in universities in South-South, Nigeria. It was recommended that the management of universities and library management, should periodically organize workshops and seminars on acceptable journal selection practices for librarians.",
    keywords: [
      'Academic librarians',
      'Journal selection practices',
      'Research productivity',
      'University librarians',
      'librarians',
    ],
    authorEmail: 'babalolay@babcock.edu.ng',
    coAuthorEmails: ['etinosa.omwanghe@uniben.edu'],
    volumeNumber: 7,
    issueNumber: 2,
    articleType: 'research_article',
    pages: { start: 1, end: 21 },
  },
  {
    title:
      'FINANCIAL DEVELOPMENT AND HIGH-POWERED MONEY IN NIGERIA: EVIDENCE FROM THE DYNAMIC OLS MODEL',
    abstract:
      'This study examines the endogeneity of high-powered money in relation to financial development in Nigeria. High-powered money which is made up of currency and reserves has mostly been taken as given whereas its values and that of its components could vary with financial sector fundamentals and other macroeconomic and institutional factors within the economy. Employing the Dynamic Ordinary Least squares regression technique spanning 1986 to 2021 for Nigeria, this study finds that financial development positively enhances high powered money in Nigeria. The implication of the finding is that the higher the level of financial development, the easier monetary authorities are able to influence broad monetary aggregates through the influence of the monetary base. High-powered money was also found to be significantly impacted by real GDP, currency ratio, prime lending rate and political right in Nigeria. Currency in circulation and reserves which are non-interest yielding components of high-powered are similarly influenced significantly by the same influencers of high-powered money hence their substitutability. These have interesting implications for monetary policy implementation and effectiveness in Nigeria.',
    keywords: [
      'High-Powered Money',
      'Dynamic Ordinary Least Squares',
      'Financial Development Real Gross Domestic Product',
      'Nigeria',
      'Dynamic Ordinary',
    ],
    authorEmail: 'osamede.abusomwan@uniben.edu',
    coAuthorEmails: ['heoaikhenan@uniben.edu'],
    volumeNumber: 7,
    issueNumber: 2,
    articleType: 'research_article',
    pages: { start: 22, end: 40 },
  },
  {
    title:
      'FINANCIAL DEVELOPMENT AND INDUSTRIAL OUTPUT IN NIGERIA: EXPLORING THE LONG RUN AND SHORT RUN DYNAMIC NEXUS',
    abstract:
      'Contrasting empirical findings abound in literature on the nexus between financial development and industrial growth. It is against this backdrop and that of the declining industrial growth and financial development in Nigeria that this study examines a new evidence of the short-run dynamic, and long- run relationship between financial development and industrial growth in Nigeria. The study employs Error Correction Model (ECM) and Fully Modified OLS (FMOLS) regression techniques for a period spanning 1990 to 2021. A significant positive relationship was found in the long run and short run dynamics between financial development and industrial growth in Nigeria. The study recommends the removal of obvious impediments to financial development in Nigeria such as; multiple tax regimes, over regulation of the financial system, multiple charges on banking transactions, insider abuses in the financial system, socio-political tensions and monetary policy conflicts so as to reap the gains of financial development on industrial growth.',
    keywords: [
      'Industrial Growth',
      'Financial Development',
      'Fully Modified OLS',
      'Nigeria',
      'socio-political tensions',
    ],
    authorEmail: 'osamedeabusomwan@gmail.com',
    coAuthorEmails: ['norense.izevbigie@uniben.edu'],
    volumeNumber: 7,
    issueNumber: 2,
    articleType: 'research_article',
    pages: { start: 41, end: 57 },
  },
  {
    title:
      'LIBRARIANS’ AND PARA-PROFESSIONALS’ PERSPECTIVE ON RESOURCES PROVISION FOR ELECTRONIC COLLECTION DEVELOPMENT PRACTICES',
    abstract:
      'There are twenty-six (26) Universities in South East Nigeria and each of them has a University or an Academic Library. The main objective of this study was to assess Librarians’ and Para-professionals’ perspective on resources provision for electronic collection development practices in three University Libraries in South East Nigeria. The study employed descriptive survey design method. The instruments used to collect data include questionnaire, observation checklist and interview schedule. The initial draft of the instruments was validated by experts in the field of Library and Information Science and their criticisms, comments and observations articulated and used in modifying and producing the final copies of the instruments. A total population of 208, comprising Professional Librarians and Para-professionals working in the three studied institution libraries (90 Professional librarians and 118 Paraprofessionals) were used for this study. From the Librarians’ and Para-professionals’ respondents perspective, a good number of electronic resources were not only identified as requirements for electronic collection development practices but some were also recognized and identified to be either available or unavailable in the three University Libraries that were studied. The study identified adequate funding, tackling erratic power supply, training of Librarians and Para-professionals, formulation of sound administrative policies and guidelines and creation of higher Internet bandwidth as some of the strategic measures of mitigating the identified militating factors of electronic collection development practices in Nigeria University Libraries such as inadequate funding, inadequate electricity power supply, automation at infancy level, lack of higher bandwidth in Internet connectivity and poor access to materials for acquisition. Nigerian University Libraries should strive and embrace electronic collection development practice especially in this era of Information and Communication Technology. Academic Libraries should make it a top priority to employ qualified and competent Professional Librarians and Para-professionals for efficient and effective provision of library services to users.',
    keywords: [
      'librarians',
      'Para-professionals',
      'Academic Libraries',
      'Electronic resources',
      'Universities',
    ],
    authorEmail: 'nnenna.obidike@unn.edu.ng',
    coAuthorEmails: ['austin.mole@unn.edu.ng'],
    volumeNumber: 7,
    issueNumber: 2,
    articleType: 'research_article',
    pages: { start: 58, end: 76 },
  },
  {
    title:
      'PRIMARY HEALTH CARE SERVICES ADMINISTRATION AND CHALLENGES IN UHUNMWODE LOCAL GOVERNMENT AREA, EDO STATE– NIGERIA',
    abstract:
      'This study examined the primary health care activities in Uhunmwode Local Government Area, Edo State. Taking into consideration is the ambience with which primary health care facilities are put to use in relation to the ultimate task of meeting up the desired health care needs of the people in the locality. The paper also sought the efforts of the stakeholders in provision of adequate primary health care service delivery. It also attempted to draw a link between health care providers and users in the study areas. Health care service users and providers in Uhunmwode Local Government Area constitute the population of this study. Two communities were sampled from each of the ten wards in the Local Government Area. The descriptive survey research design was adopted for the study and the purposive sampling technique was utilized in selecting research respondents. The instruments used in gathering data in this study were the in-depth interview (IDI), focus group discussion (FGD), record and viewing project visitation. Data obtained were qualitatively analyzed using inductive reasoning to analyze the narrative and descriptive data using manual and content analysis as perceived by the participants. Findings shows that health services in the study area is not meeting the needs of the people and for below the set standards of the World Health Organization (WHO) and global best practice. The study however recommended that researchers and other technical experts should evolve strategies that are more effective for implementation in mitigating rural health challenges, especially in Uhunmwode Local Government Area.',
    keywords: [
      'Communities development',
      'Local Government Area',
      'Primary health care',
      'Rural Areas',
      'Uhunmwode Local Government Area',
    ],
    authorEmail: 'lucky.odia@aauekpoma.edu.ng',
    coAuthorEmails: [],
    volumeNumber: 7,
    issueNumber: 2,
    articleType: 'research_article',
    pages: { start: 77, end: 98 },
  },
];
// ============================================================

print('=== Article Migration Script ===');
print(`Articles to process: ${ARTICLES_TO_MIGRATE.length}`);

let successCount = 0;
let skipCount = 0;
const errors = [];

for (let i = 0; i < ARTICLES_TO_MIGRATE.length; i++) {
  const articleData = ARTICLES_TO_MIGRATE[i];
  print(
    `\n[${i + 1}/${ARTICLES_TO_MIGRATE.length}] Processing: "${articleData.title.substring(0, 60)}..."`
  );

  try {
    // 1. Find primary author
    const author = db.Users.findOne({
      email: articleData.authorEmail.toLowerCase().trim(),
      role: 'author',
    });
    if (!author)
      throw new Error(`Author not found: ${articleData.authorEmail}`);

    // 2. Find co-authors
    const coAuthorIds = [];
    for (const coEmail of articleData.coAuthorEmails || []) {
      const coAuthor = db.Users.findOne({
        email: coEmail.toLowerCase().trim(),
      });
      if (!coAuthor) throw new Error(`Co-author not found: ${coEmail}`);
      coAuthorIds.push(coAuthor._id);
    }

    // 3. Find volume
    const volume = db.Volumes.findOne({
      volumeNumber: articleData.volumeNumber,
    });
    if (!volume)
      throw new Error(
        `Volume ${articleData.volumeNumber} not found. Create it first in the admin panel.`
      );

    // 4. Find issue — use its publishDate for the article
    const issue = db.Issues.findOne({
      volume: volume._id,
      issueNumber: articleData.issueNumber,
    });
    if (!issue)
      throw new Error(
        `Issue ${articleData.issueNumber} not found for Volume ${articleData.volumeNumber}. Create it first.`
      );

    // 5. Duplicate check
    const duplicate = db.Articles.findOne({
      title: articleData.title,
      issue: issue._id,
    });
    if (duplicate) {
      print(`  ⚠ SKIPPED — article already exists in this issue`);
      skipCount++;
      continue;
    }

    // 6. Build document
    const now = new Date();
    const article = {
      title: articleData.title.trim(),
      abstract: articleData.abstract.trim(),
      keywords: (articleData.keywords || []).map((k) => k.trim()),
      pdfFile: '', // empty — upload later via admin "Manual Articles" tab
      author: author._id,
      coAuthors: coAuthorIds,
      // NO manuscriptId — marks this as manually published
      publishDate: issue.publishDate, // use issue's publish date
      volume: volume._id,
      issue: issue._id,
      articleType: articleData.articleType || 'research_article',
      pages:
        articleData.pages?.start && articleData.pages?.end
          ? { start: articleData.pages.start, end: articleData.pages.end }
          : undefined,
      views: { count: 0, viewers: [] },
      downloads: { count: 0, downloaders: [] },
      citationCount: 0,
      license: 'CC BY 4.0',
      copyrightHolder: 'The Authors',
      isPublished: true,
      publishedAt: now,
      indexingStatus: {
        googleScholar: false,
        base: false,
        core: false,
        internetArchive: false,
      },
      publicationOptions: {
        doiEnabled: false,
        internetArchiveEnabled: false,
        emailNotificationEnabled: false,
      },
      emailNotificationStatus: {
        sent: false,
        idempotencyKey: `migration_${now.getTime()}_${i}`,
        recipientCount: 0,
        failureCount: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    db.Articles.insertOne(article);
    successCount++;
    print(
      `  ✓ Inserted — Author: ${author.name}, Vol ${articleData.volumeNumber} Iss ${articleData.issueNumber}, Pages ${articleData.pages?.start}-${articleData.pages?.end}`
    );
  } catch (err) {
    errors.push({
      title: articleData.title.substring(0, 50),
      error: err.message,
    });
    print(`  ✗ ERROR: ${err.message}`);
  }
}

print('\n======== SUMMARY ========');
print(`✓ Inserted : ${successCount}`);
print(`⚠ Skipped  : ${skipCount}`);
print(`✗ Errors   : ${errors.length}`);
if (errors.length > 0) {
  print('\nFailed articles:');
  errors.forEach((e, i) => print(`  ${i + 1}. "${e.title}..." — ${e.error}`));
}
print('=========================');
print(
  '\nNext step: Go to Admin → Publication → Manual Articles to upload PDFs.'
);
