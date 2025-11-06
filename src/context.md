Now I want you to use the facultyContext.ts file in utils as context and Implement the departments somewhere there maybe as a store, well probably without changing the existing logic I want to be able to assign Users to a cluster, and by cluster I just mean faculty really not the departments, the departments are just there for aid, The admin in his dashboard will be able to assign a user to and the user's corresponding manuscript to a cluster/faculty, the controller for this will be added in the admin.controller.ts, so if the user is an author, after submitting the admin using his dashboard frontend will be able to see the manuscript and then select assign cluster and then he'll see the list of available cluster/faculty and there will be a see departments button for each faculty which just shows the departments list, I told just like an aid showing the list of departments for that faculty populated from the backend and then when a reviewer is added or invited or even an author invited even without submitting a manuscript a faculty can be assigned to him by the admin too. Also check the admin controller and you'll see the getFacultiesWithProposals controller, I want to be able to replace that getFacultiesWithManuscripts and then adjust the logic to do just that, that Faculty.find is obsolete since I don't have a faculty model anymore but do it in a way where it integrates with the current existing project structure . check the relevant files even the submitManuscript.controller.ts as context, all the models, the user model and all, even the article model that will be published later independently or from the manucript that are approved, then think and reason carefully and ask clarifying question about what to do before performing any actions

IMPORTANT: That above was a previous prompt and I already have the files and made the adjustments I wanted to do just use as context

Another context: Status Transitions: The ManuscriptStatus enum is a good way to manage the state of a manuscript, but there's no
logic to enforce valid transitions. For example, a manuscript could be moved from SUBMITTED to APPROVED without
a review. You might want to implement a state machine or add validation to your business logic to prevent  
 invalid state changes.

- Review Relationship: The reviewDecision and reviewComments fields are useful, but there's no direct link to the
  actual reviews. It would be beneficial to add an array of review IDs to this model to create a clear
  relationship between a manuscript and its reviews.

ANOTHER CONTEXT:
Note for Future Implementation: Reviewer Assignment for Revisions

This note outlines the steps to implement the reviewer assignment logic for revised manuscripts, as discussed.

1. Minor Revision Workflow (Assign to Admin)

When a manuscript that was marked with MINOR_REVISION is resubmitted, it should be assigned to an admin for
review.

- File to Modify: src/Review_System/controllers/assignReview.controller.ts (or a new controller for handling
  revision assignments).
- Logic:
  1.  When a revised manuscript is created, check if its revisedFrom manuscript had a status of
      MINOR_REVISION.
  2.  If it did, the revised manuscript should be flagged for admin review.
  3.  You will need to decide how to "assign" it to an admin. One approach is to add it to a list of  
      manuscripts pending admin review, which would be visible on the admin dashboard. You could add a new  
      status like PENDING_ADMIN_REVIEW to the ManuscriptStatus enum.

2. Major Revision Workflow (Assign to Original Reviewer)

When a manuscript that was marked with MAJOR_REVISION is resubmitted, it should be assigned back to the
reviewer who initially requested the major revision.

- File to Modify: src/Review_System/controllers/assignReview.controller.ts (or a new controller).
- Logic:
  1.  When a revised manuscript is created, check if its revisedFrom manuscript had a status of
      MAJOR_REVISION.
  2.  If it did, you need to identify the original reviewer. This is the most complex part. Since a manuscript
      can have multiple reviews, you need a way to determine which reviewer made the "major revision" decision.

  3.  Recommendation: When a reviewer submits a review with a reviewDecision of
      PUBLISHABLE_WITH_MAJOR_REVISION, you should store the reviewerId on the manuscript itself, perhaps in a  
      field like majorRevisionBy.
  4.  When the manuscript is resubmitted, you can then read this majorRevisionBy field to get the ID of the  
      reviewer to assign the revised manuscript to.
  5.  You would then create a new Review document, associating the revised manuscript with the identified  
      reviewer.

Handling Multiple Major Revision Decisions:

If multiple reviewers can suggest a major revision, you will need to decide on the business logic:

- Assign to all of them?: You could store an array of reviewer IDs in majorRevisionBy and create review  
  assignments for all of them.
- Assign to the first one?: You could just store the first reviewer who makes the decision.
- Let the admin decide?: You could flag the revised manuscript for the admin to manually assign to one of the
  original reviewers.

This logic should be implemented in the assignReviewer controller, which you've deferred for later.

ANOTHER CONTEXT:

This is how it works hopefully it clarifies things, the author submit a a manuscript and then the admin assigns the manuscript a cluster (maybe he inferred it from the faculty field of the author user) and then assigns the manuscript to two different reviewers in the eligible clusters and then this reviewers makes a reviewDecision with their review comments, now the admin will be able to see this review decision and comments and then use that to influence his decision of the status to update the manuscript to and that's if the reviewDecision is the same for both reviewers else there's a discrepancy and there'll be a reconciliation reviewer and in that case using these three reviews the admin makes a decision, the decision doesn't have to be exactly the reviewDecision from the reviewers but then the admin can then update the manuscript status. now I only want to edit the submit controller for now with it's relevant models, the assign review controller, reconciliation controller, reviewer controller and the rest are for later.

Cluster Rules:

Reviewer must be from different faculty than submitter
Reviewer must be in same cluster as submitter's faculty
Admin can always review regardless of cluster

Admin Override:

Admin appears in all reviewer pools regardless of faculty
Admin can manually reassign any review
Admin can self-assign any review

Assignment Rules:

Reviewer must be from different faculty than submitter
Reviewer must be in same cluster
Select reviewer with lowest workload
Admin can always self-assign regardless of cluster
