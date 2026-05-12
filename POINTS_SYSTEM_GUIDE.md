# Points System Guide

## Overview

The reward points system has been completely refactored to ensure consistency and reliability. The system now uses a unified calculation service with real-time updates and consistency checks.

## Key Improvements

### 1. Real-Time Updates
- **Rewards Widget** now uses Firebase real-time listeners instead of polling
- Points update instantly when earned without page refresh
- Smooth animations when points increase

### 2. Unified Points Calculation
- Single source of truth: `student_points` collection in Firebase
- Consistent calculation across all views
- Automatic synchronization when project data changes

### 3. Manual Refresh
- Added refresh button in Rewards Widget for immediate sync
- Users can manually trigger point recalculation anytime
- Prevents stale data from being displayed

### 4. Admin Consistency Checker
- New tool in Manage Rewards page to check point consistency
- Compares stored points vs calculated points from source data
- One-click sync to fix any discrepancies

### 5. Automatic Sync Triggers
- **Project Activation**: Points awarded when project status changes to 'active'
- **Progress Updates**: Syncs all student points when project progress changes
- **Evaluations**: Recalculates points when evaluations are saved
- **Chat Messages**: Immediate point award and update
- **File Uploads**: Immediate point award and update

## Point Calculation Formula

### Total Points Calculation
```
Total Points = Initiation Points + Progress Points + Weighted Score Points + Chat Points + File Points
```

### Point Types

1. **Initiation Points**
   - Earned when a project is activated/approved
   - Default: 10 points per activated project
   - Configurable in admin settings

2. **Progress Points**
   - Based on current project progress percentage
   - Formula: `Progress % × Multiplier`
   - Default multiplier: 1 point per percent
   - Recalculated from scratch on each update

3. **Weighted Score Points**
   - Based on evaluation scores and weights
   - Formula: `Σ(Score × Weight) × Multiplier`
   - Default multiplier: 10 points per unit
   - Recalculated from scratch on each update

4. **Chat Points**
   - Earned per chat message sent
   - Default: 1 point per message
   - Accumulates over time

5. **File Upload Points**
   - Earned per file uploaded
   - Default: 5 points per file
   - Accumulates over time

## For Students

### Viewing Your Points
1. Look at the top navigation bar for the Rewards Widget
2. Click on the widget to see detailed breakdown
3. View "Points Details" for complete calculation breakdown

### Refreshing Points
1. Click the refresh icon next to your points in the navigation bar
2. Wait for the animation to complete
3. Your points will update automatically in real-time

### Understanding Your Points
- **Project Activation**: When your teacher activates your project
- **Progress**: Based on your current project completion percentage
- **Quality**: Based on teacher's evaluation scores
- **Participation**: Chat messages and file uploads

## For Admins

### Checking Student Points Consistency

1. Go to **Admin Dashboard** → **Manage Rewards**
2. Find the student in the list
3. Click the **Check Consistency** button (green checkmark icon)
4. Review the consistency report:
   - ✅ Green: Points are consistent
   - ⚠️ Yellow: Inconsistency detected
5. If inconsistent, click **Sync Points** to fix

### Bulk Recalculation

1. Go to **Manage Rewards** page
2. Click **Recalculate All Points** button
3. Confirm the action
4. Monitor progress in real-time
5. Review results showing successful/failed updates

### Fixing Specific Student Issues

If a student reports incorrect points:

1. **Check Consistency**
   - Use the consistency checker tool
   - Compare stored vs calculated points

2. **View Points Details**
   - Click the details button (purple icon)
   - Review the complete breakdown
   - Verify each component is correct

3. **Sync Points**
   - If inconsistency detected, click "Sync Points"
   - This recalculates from all source data

4. **Manual Adjustment** (if needed)
   - Click the adjustment button (green + icon)
   - Enter adjustment amount (can be negative)
   - Provide a reason for the adjustment
   - Submit

### Configuring Point Values

1. Go to **Manage Rewards** page
2. Click **Configuration** button
3. Adjust values:
   - Achievement thresholds (Bronze, Silver, Gold, Platinum, Trophy)
   - Point multipliers (Progress, Weighted Score, Chat, File Upload)
   - Project activation points
4. Save changes

## Troubleshooting

### Issue: Student has 0 points but has activities

**Solution:**
1. Check consistency using the consistency checker
2. If inconsistency detected, sync the student's points
3. If problem persists, use bulk recalculation

### Issue: Points not updating in real-time

**Solution:**
1. Check internet connection
2. Use manual refresh button
3. Check browser console for errors
4. Verify Firebase connection

### Issue: Inconsistent points across different views

**Solution:**
1. This should no longer happen with the new system
2. If it does, use the consistency checker
3. Sync the affected student's points
4. Report the issue if it persists

## Technical Details

### Architecture

```
┌─────────────────────┐
│   Student Actions   │
│  (Chat, Files, etc) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Point Award Services│
│  (Immediate Update) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  student_points     │
│   (Single Source)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Real-Time Listeners │
│  (Rewards Widget)   │
└─────────────────────┘
```

### Data Flow

1. **Event Occurs** (chat message, file upload, evaluation)
2. **Point Service Triggered** (award immediate points or recalculate)
3. **Database Updated** (student_points collection)
4. **Real-Time Listener Notified** (Firebase onSnapshot)
5. **UI Updated** (Rewards Widget animates change)

### Consistency Guarantees

- All point calculations use the same formula
- Points are recalculated from source on demand
- Consistency checker validates stored vs calculated
- Automatic sync keeps data accurate

## Best Practices

### For Admins

1. **Regular Consistency Checks**
   - Run bulk recalculation weekly
   - Check high-performing students monthly
   - Monitor consistency reports

2. **Point Configuration**
   - Document any configuration changes
   - Test changes with a small group first
   - Communicate changes to teachers and students

3. **Issue Resolution**
   - Always use consistency checker first
   - Document issues and resolutions
   - Use manual adjustments sparingly

### For Teachers

1. **Project Activation**
   - Activate projects promptly
   - Verify students receive points
   - Check student progress regularly

2. **Evaluations**
   - Complete evaluations thoroughly
   - Update scores when needed
   - Verify points update correctly

3. **Student Communication**
   - Explain how points are earned
   - Encourage positive participation
   - Address point concerns promptly

## Support

If you encounter issues not covered in this guide:

1. Check the consistency of the affected student's points
2. Try syncing the points
3. Review the Points Details page for insights
4. Contact technical support with:
   - Student ID
   - Description of the issue
   - Screenshots of Points Details page
   - Recent activities (projects, evaluations, etc.)
