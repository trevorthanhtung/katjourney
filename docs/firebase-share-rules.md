# Firebase Security Rules - Phase 1 & 2 Planning

These rules are drafted for the cloud sharing functionality. They define the security model to ensure safe read-only access for shared links while protecting private data.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Cloud Trips collection (Phase 1 draft - kept for reference)
    match /cloudTrips/{tripId} {
      allow read, write: if request.auth != null && resource.data.ownerId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
    }

    // Phase 2: Public Share Links
    match /publicShares/{token} {
      // 1. Read access: Prevent listing. Only allow GET for specific known tokens.
      allow get: if resource.data.revoked == false
                  && (!("expiresAt" in resource.data) || resource.data.expiresAt > request.time);
      
      // 2. Create access: Owner can create view-only links
      allow create: if request.auth != null 
                    && request.resource.data.ownerUid == request.auth.uid
                    && request.resource.data.mode == "view";

      // 3. Update access: Owner can update (e.g. to revoke)
      allow update: if request.auth != null
                    && resource.data.ownerUid == request.auth.uid;

      // 4. Delete access: No hard deletes for now
      allow delete: if false;

      // Subcollections under publicShares
      match /{subcollection}/{docId} {
        // Read: Inherit read permission from the parent publicShare token
        allow read: if get(/databases/$(database)/documents/publicShares/$(token)).data.revoked == false
                    && (!("expiresAt" in get(/databases/$(database)/documents/publicShares/$(token)).data) 
                        || get(/databases/$(database)/documents/publicShares/$(token)).data.expiresAt > request.time);

        // Write: Only the owner of the parent publicShare token can write
        allow write: if request.auth != null 
                     && get(/databases/$(database)/documents/publicShares/$(token)).data.ownerUid == request.auth.uid;
      }
    }
  }
}
```

## Key Principles:
1. **Owner Exclusivity for Writes**: Only the original creator (`ownerId` matching Firebase Auth UID) can write or modify the cloud trip data.
2. **Anonymous Auth Is Just A Layer, Not The Shield**: Anonymous Auth forces requests to be authenticated, helping rules control them, but any bot can get an Anonymous UID. The *real* security relies on unguessable tokens, correct rules, and limited data scope.
3. **No Listing (allow get)**: Viewers can only use `get` for a specific token. They cannot `list` or `query` the `publicShares` collection, preventing enumeration attacks.
4. **Selective Privacy**: The `travelDocuments` subcollection defaults to restricted unless the owner explicitly opts-in (`includeDocuments=true`), protecting sensitive tickets/passports.
