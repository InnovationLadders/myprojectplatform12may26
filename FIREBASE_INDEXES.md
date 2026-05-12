# Firebase Indexes Configuration

This document contains all the Firebase Firestore composite indexes required for optimal performance of the Mashroui platform.

## Why Indexes Are Important

Firestore requires composite indexes for queries that:
- Filter on multiple fields
- Combine equality and range filters
- Order results while also filtering

Without proper indexes, queries will fail or perform full collection scans, which are slow and expensive.

## How to Create Indexes

### Option 1: Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `my-project-plateform-react`
3. Navigate to **Firestore Database** → **Indexes** tab
4. Click **Create Index** and add the indexes below

### Option 2: Using Firebase CLI
```bash
firebase deploy --only firestore:indexes
```

## Required Composite Indexes

### 1. Projects Collection

#### Index 1: Teacher Projects Query
- **Collection**: `projects`
- **Fields**:
  - `teacher_id` (Ascending)
  - `status` (Ascending)
  - `updated_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: Fetch projects for a specific teacher, filtered by status

#### Index 2: School Projects Query
- **Collection**: `projects`
- **Fields**:
  - `school_id` (Ascending)
  - `status` (Ascending)
  - `updated_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: Fetch projects for a specific school, filtered by status

#### Index 3: Project Status and Update Tracking
- **Collection**: `projects`
- **Fields**:
  - `status` (Ascending)
  - `updated_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: General project queries filtered by status

### 2. Project Students Collection

#### Index 1: Student Projects
- **Collection**: `project_students`
- **Fields**:
  - `student_id` (Ascending)
  - `project_id` (Ascending)
- **Query Collection Group**: No
- **Purpose**: Find all projects a student is part of

#### Index 2: Project Team Members
- **Collection**: `project_students`
- **Fields**:
  - `project_id` (Ascending)
  - `student_id` (Ascending)
- **Query Collection Group**: No
- **Purpose**: Find all students in a project

### 3. Chat Messages Collection

#### Index 1: Project Messages by Time
- **Collection**: `chat_messages`
- **Fields**:
  - `project_id` (Ascending)
  - `created_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: Fetch recent messages for a project

#### Index 2: Recent Project Conversations
- **Collection**: `chat_messages`
- **Fields**:
  - `project_id` (Ascending)
  - `created_at` (Ascending)
- **Query Collection Group**: No
- **Purpose**: Filter messages by project and time range

### 4. Project Tasks Collection

#### Index 1: Project Tasks Query
- **Collection**: `project_tasks`
- **Fields**:
  - `project_id` (Ascending)
  - `completed` (Ascending)
- **Query Collection Group**: No
- **Purpose**: Fetch incomplete tasks for a project

#### Index 2: Project Tasks by Status
- **Collection**: `project_tasks`
- **Fields**:
  - `project_id` (Ascending)
  - `status` (Ascending)
  - `due_date` (Ascending)
- **Query Collection Group**: No
- **Purpose**: Fetch tasks with specific status ordered by due date

#### Index 3: Project Tasks Creation Order
- **Collection**: `project_tasks`
- **Fields**:
  - `project_id` (Ascending)
  - `created_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: Fetch tasks in creation order

### 5. Consultations Collection

#### Index 1: Student Consultations
- **Collection**: `consultations`
- **Fields**:
  - `student_id` (Ascending)
  - `status` (Ascending)
  - `updated_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: Fetch consultations for a student by status

#### Index 2: Upcoming Consultations
- **Collection**: `consultations`
- **Fields**:
  - `student_id` (Ascending)
  - `status` (Ascending)
  - `scheduledDate` (Ascending)
- **Query Collection Group**: No
- **Purpose**: Find upcoming scheduled consultations

### 6. Users Collection

#### Index 1: Teachers by School
- **Collection**: `users`
- **Fields**:
  - `role` (Ascending)
  - `school_id` (Ascending)
  - `status` (Ascending)
- **Query Collection Group**: No
- **Purpose**: Find active teachers for a specific school

#### Index 2: Students by School
- **Collection**: `users`
- **Fields**:
  - `role` (Ascending)
  - `school_id` (Ascending)
- **Query Collection Group**: No
- **Purpose**: Find all students in a school

#### Index 3: Active Users by Role
- **Collection**: `users`
- **Fields**:
  - `role` (Ascending)
  - `status` (Ascending)
- **Query Collection Group**: No
- **Purpose**: Query users by role and status

### 7. Store Items Collection

#### Index 1: Store Items by Date
- **Collection**: `store_items`
- **Fields**:
  - `status` (Ascending)
  - `created_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: Fetch active store items ordered by date

### 8. Summer Program Registrations Collection

#### Index 1: Registrations by Status
- **Collection**: `summer_program_registrations`
- **Fields**:
  - `status` (Ascending)
  - `createdAt` (Descending)
- **Query Collection Group**: No
- **Purpose**: Fetch registrations by status

### 9. Project Ideas Collection

#### Index 1: Approved Ideas
- **Collection**: `project_ideas`
- **Fields**:
  - `status` (Ascending)
  - `created_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: Fetch approved project ideas

#### Index 2: Ideas by Category
- **Collection**: `project_ideas`
- **Fields**:
  - `category` (Ascending)
  - `status` (Ascending)
  - `created_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: Browse ideas by category

### 10. Gallery Projects Collection

#### Index 1: Gallery Projects by School
- **Collection**: `gallery_projects`
- **Fields**:
  - `school_id` (Ascending)
  - `created_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: Fetch gallery projects for a specific school (subdomain filtering)
- **Usage**: When users access the gallery via a school subdomain

#### Index 2: All Gallery Projects
- **Collection**: `gallery_projects`
- **Fields**:
  - `created_at` (Descending)
- **Query Collection Group**: No
- **Purpose**: Fetch all gallery projects in chronological order
- **Note**: This is a single-field index and is created automatically by Firestore

## Monitoring Index Performance

After creating indexes, monitor their usage:
1. Go to Firebase Console → Firestore → Usage tab
2. Check query performance metrics
3. Look for slow queries or missing indexes

## Index Creation Time

- Small collections (< 1000 docs): Usually instant
- Medium collections (1000-10000 docs): 1-5 minutes
- Large collections (> 10000 docs): 5-30 minutes

## Important Notes

1. **Indexes consume storage**: Each index adds to your storage usage
2. **Write costs increase**: More indexes mean slightly higher write costs
3. **Automatic single-field indexes**: Firestore automatically creates indexes for single-field queries
4. **Test before deploying**: Always test queries in development first

## Verification Commands

To verify if an index is working:

```javascript
// This query will automatically suggest the required index if missing
const q = query(
  collection(db, 'projects'),
  where('teacher_id', '==', userId),
  where('status', '==', 'active'),
  orderBy('updated_at', 'desc')
);
```

If the index is missing, Firestore will provide a direct link to create it.

## Performance Impact

With proper indexes in place, you should see:
- **Query response time**: < 200ms (down from 2-5 seconds)
- **Dashboard load time**: < 1 second (down from 3-5 seconds)
- **Reduced read operations**: 60-70% reduction through caching
- **Better user experience**: Instant data loading with cached results

## Maintenance

Review and update indexes:
- **Monthly**: Check for unused indexes
- **After major features**: Add new indexes as needed
- **Performance issues**: Use Firebase Console to identify slow queries
