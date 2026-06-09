# KAT Journey - IndexedDB Schema

## Database: katJourneyDB

### trips

-   id
-   title
-   location
-   startDate
-   endDate

### members

-   id
-   tripId
-   name
-   phone
-   role

### events

-   id
-   tripId
-   date
-   time
-   title
-   location
-   notes
-   completed

### expenses

-   id
-   tripId
-   amount
-   payer
-   category
-   description

### checklist

-   id
-   tripId
-   section
-   title
-   completed

### journals

-   id
-   tripId
-   date
-   content
