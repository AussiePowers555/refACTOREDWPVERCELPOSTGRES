# Workspace Functionality

## Overview

The application now supports workspace-based navigation that displays the current workspace name prominently at the top of every screen. This helps users understand their current context and which set of cases they're viewing.

## How It Works

### Admin Users (Main Workspace)
- **When no workspace is selected**: Displays "**Main Workspace**" at the top of all screens
- **Access**: Can see all cases across all workspaces
- **Navigation**: Can switch between workspaces or return to Main Workspace
- **Button**: Shows "Back to Main" button when in a specific workspace

### Workspace Users (e.g., Dave's Workspace)
- **When logged in as a workspace user**: Displays "**[Contact Type]: [Contact Name] Workspace**"
- **Examples**: 
  - "Insurer: Dave's Workspace"
  - "Lawyer: Smith & Co Workspace" 
  - "Rental Company: City Wide Rentals Workspace"
- **Access**: Only sees cases assigned to their specific workspace
- **Restrictions**: Cannot switch workspaces or access Main Workspace

## Visual Display

### Header Layout
```
[Sidebar Toggle] [Workspace Name]                    [Admin Badge] [User Menu]
                 "Main Workspace"                     Administrator    [Avatar]
                 or
                 "Insurer: Dave's Workspace [Back to Main]"
```

### Workspace Name Styling
- **Font**: Large, semibold, primary color
- **Format**: 
  - Main Workspace: Just "Main Workspace"
  - Specific Workspace: "[Type]: [Name] Workspace"
- **Button**: Small "Back to Main" button for admins when in workspace

## User Experience

### For Admin Users
1. **Login**: Automatically shows "Main Workspace" 
2. **View All Cases**: See cases from all workspaces when in Main
3. **Switch Workspace**: Go to `/workspaces` and click any workspace
4. **Filtered View**: Workspace name displays, only see cases for that workspace
5. **Return**: Click "Back to Main" button to return to Main Workspace

### For Workspace Users  
1. **Login**: Automatically set to their assigned workspace
2. **Restricted View**: Only see cases for their workspace
3. **Fixed Context**: Cannot change workspaces or access Main
4. **Clear Identity**: Always see their workspace name at top

## Implementation Details

### Components Modified
- **`UserHeader.tsx`**: Enhanced workspace display logic
- **`cases/page.tsx`**: Workspace-based case filtering (existing)
- **`workspaces/page.tsx`**: Workspace selection interface (existing)

### Key Features
- **Session Storage**: Workspace selection persists across page refreshes
- **Toast Notifications**: Confirms workspace switches
- **Responsive Design**: Works on all screen sizes
- **Role-Based**: Different behavior for admin vs workspace users

### Data Flow
1. User authentication sets role and permissions
2. Workspace selection stored in session storage as `activeWorkspace`
3. `UserHeader` reads workspace and displays appropriately
4. Pages filter content based on workspace context
5. Admin users can clear workspace to return to Main

## Benefits

### For Businesses
- **Multi-tenant Support**: Multiple companies/departments can use same system
- **Data Isolation**: Workspace users only see their relevant cases
- **Admin Oversight**: Admin can view all data or focus on specific workspace

### For Users
- **Clear Context**: Always know which workspace they're viewing
- **Easy Navigation**: Simple switching between workspaces for admins
- **Focused Experience**: Workspace users see only relevant data

## Usage Examples

### Scenario 1: Admin Managing Multiple Insurance Companies
1. Admin logs in → sees "Main Workspace" 
2. Views all cases from all insurers
3. Clicks workspace → "Insurer: NRMA Workspace"
4. Now only sees NRMA cases
5. Clicks "Back to Main" → returns to all cases

### Scenario 2: Insurance Company User
1. Dave (insurer user) logs in
2. Automatically sees "Insurer: Dave's Insurance Workspace"
3. Only sees cases assigned to Dave's company
4. Cannot access other company data
5. Workspace name always visible for context

## Configuration

### Creating Workspaces
1. Admin goes to `/workspaces`
2. Creates workspace linked to a contact (insurer, lawyer, rental company)
3. Workspace becomes available for selection
4. Cases can be assigned to workspace when created

### User Assignment
- Admin users: Can access any workspace + Main Workspace
- Workspace users: Assigned to specific workspace in user settings
- Contact-based: Workspaces tied to contacts in the system

This creates a clear, intuitive multi-tenant experience where users always know their context and can easily navigate between different business areas.