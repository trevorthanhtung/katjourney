# Firebase Security Rules - Request Edit Model

These rules are drafted for the cloud sharing functionality. They define the security model to ensure safe read-only access for shared links, while allowing viewers to submit change requests instead of editing directly.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public Share Links
    match /publicShares/{token} {
      // 1. Read access: Prevent listing. Only allow GET for specific known tokens.
      allow get: if resource.data.revoked == false
                  && (!("expiresAt" in resource.data) || resource.data.expiresAt > request.time);
      
      // 2. Create access: Owner can create view or request_edit links
      allow create: if request.auth != null 
                    && request.resource.data.ownerUid == request.auth.uid;

      // 3. Update access: Owner can update (e.g. to revoke or change mode)
      allow update: if request.auth != null
                    && resource.data.ownerUid == request.auth.uid;

      // 4. Delete access: No hard deletes for now
      allow delete: if false;

      // Subcollections under publicShares
      // ----------------------------------------------------------------------
      // Generic Read rule for all subcollections
      match /{subcollection}/{docId} {
        allow read: if get(/databases/$(database)/documents/publicShares/$(token)).data.revoked == false
                    && (!("expiresAt" in get(/databases/$(database)/documents/publicShares/$(token)).data) 
                        || get(/databases/$(database)/documents/publicShares/$(token)).data.expiresAt > request.time);
      }

      function isOwner() {
        return get(/databases/$(database)/documents/publicShares/$(token)).data.ownerUid == request.auth.uid;
      }
      
      function isRequestEditAllowed(flag) {
        let parent = get(/databases/$(database)/documents/publicShares/$(token)).data;
        return (parent.mode == "request_edit" || parent.mode == "edit") 
               && parent.revoked == false 
               && (flag == null || parent[flag] == true);
      }

      // Write rules for data collections: ONLY OWNER can write.
      match /members/{docId} {
        allow write: if request.auth != null && isOwner();
      }

      match /activities/{docId} {
        allow write: if request.auth != null && isOwner();
      }

      match /expenses/{docId} {
        allow write: if request.auth != null && isOwner();
      }

      match /checklist/{docId} {
        allow write: if request.auth != null && isOwner();
      }

      match /journals/{docId} {
        allow write: if request.auth != null && isOwner();
      }

      match /backupPlans/{docId} {
        allow write: if request.auth != null && isOwner();
      }

      match /travelDocuments/{docId} {
        allow write: if request.auth != null && isOwner();
      }

      // Change Requests Subcollection
      match /changeRequests/{docId} {
        // Owner can read and write (to approve/reject)
        // Viewer can read (to see their own requests maybe, covered by generic read above)
        // Viewer can CREATE a request if it's pending and mode is request_edit
        allow create: if request.auth != null 
                      && isRequestEditAllowed(null)
                      && request.resource.data.status == "pending"
                      && request.resource.data.requesterUid == request.auth.uid;
                      
        allow update, delete: if request.auth != null && isOwner();
      }
    }
  }
}
```
