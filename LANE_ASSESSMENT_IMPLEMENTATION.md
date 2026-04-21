# Lane Risk Assessment Implementation Guide

## Overview
A complete risk-lane assessment system has been built for the 4VISO admin panel, allowing users to view, analyze, compare, and edit transport lanes with detailed risk metrics and node information.

## What Was Built

### 1. **Data Models** ([src/types/domain.ts](src/types/domain.ts))
Added three new interfaces:

- **`Lane`**: Represents a complete transport route with:
  - Origin/destination cities and countries
  - Array of route nodes (warehouses, airports, hubs)
  - Transportation segments between nodes
  - Overall risk level and status
  - Product type and temperature requirements

- **`Requirement`**: Product-specific requirements including:
  - Temperature range (min/max)
  - Required certifications (EU GDP, IATA CEIV, etc.)
  - Required operational and handling capabilities
  - Minimum security level
  - Estimated duration

- **`TransportationSegment`**: Details for transport between nodes:
  - Transport mode (Road, Air, Sea)
  - Estimated duration hours
  - Logistics company name
  - Associated alerts

### 2. **Demo Data** ([src/mocks/seed.ts](src/mocks/seed.ts))
- 2 complete lane options from Brussels to Washington
- Each with different routes and risk profiles
- Realistic data including certifications, alerts, and company names
- Requirements for Vaccines, Clinical Samples, and Pharmaceutical Products

### 3. **Component Library** 

#### **LaneCreation.vue** ([src/components/lanes/LaneCreation.vue](src/components/lanes/LaneCreation.vue))
Main lane management interface:
- **Product Type Filter**: Switch between Vaccines, Clinical Samples, etc.
- **Lane List (Left Panel)**: 
  - Vertically stacked lane options
  - Shows origin/destination, risk level, stops, temp range
  - Key metrics at a glance
  - Select lane to view details
- **Lane Detail (Right Panel)**: 
  - Complete flow visualization
  - Edit/Done mode toggle
  - Action buttons (Compare, Select Route)

#### **LaneFlowVisualization.vue** ([src/components/lanes/LaneFlowVisualization.vue](src/components/lanes/LaneFlowVisualization.vue))
Horizontal flow diagram:
- **Numbered nodes** with city name and location type
- **Alert badges** showing notification count for each node
- **Transportation segments** between nodes with:
  - Transport mode and duration
  - Logistics company name
  - Alert indicators (color-coded by severity)
- **Edit Mode Features**:
  - Drag-and-drop node reordering
  - Remove individual nodes
  - Add new nodes button
  - Visual "Edit Mode" badge

#### **NodeDetailModal.vue** ([src/components/lanes/NodeDetailModal.vue](src/components/lanes/NodeDetailModal.vue))
Click any node to see detailed information:
- **Location Information**: Type, transport mode, security level, dwell time
- **Risk & Validation**: Risk score, validation status, actual temperature vs. range
- **Capabilities**: Operational, handling, and monitoring systems
- **Certifications**: List of all certifications
- **Requirement Fulfillment** (when applicable):
  - ✓/✗ Certifications met
  - ✓/✗ Capabilities met
  - ✓/✗ Security level sufficient

#### **TransportationSegmentDetail.vue** ([src/components/lanes/TransportationSegmentDetail.vue](src/components/lanes/TransportationSegmentDetail.vue))
Shows transportation information between nodes:
- Transport mode (Road/Air/Sea)
- Duration estimate
- Logistics company operator
- Alert count badges (color-coded):
  - Red: Critical/High severity
  - Orange: Medium severity
  - Blue: Low severity

### 4. **State Management**

#### **Lanes Store** ([src/stores/lanes.ts](src/stores/lanes.ts))
Pinia store for lane management:
```typescript
- lanes: Lane[] - All available lanes
- requirements: Requirement[] - Product requirements
- loadLanes() - Fetch lanes from API
- loadRequirements() - Fetch requirements
- getLanesByProductType() - Filter lanes by product
- getRequirementByProductType() - Get requirement for product
```

### 5. **API Integration** ([src/services/mockApi.ts](src/services/mockApi.ts))
Added mock API methods:
- `getLanes()` - Fetch all lanes
- `getRequirements()` - Fetch all requirements
- `getLaneById(laneId)` - Get specific lane
- `updateLane(lane)` - Save lane changes
- `createLane(lane)` - Create new lane

### 6. **Admin Page Integration** ([src/views/AdminView.vue](src/views/AdminView.vue))
Updated admin view with:
- **Tab Navigation**: Overview | Lane Management
- **Overview Tab**: Users and validation queue (existing functionality)
- **Lane Management Tab**: Full lane creation/editing interface
- Integrated lanes store loading

## Features

### Lane Selection Flow
1. **Filter by Product Type**: Choose Vaccines, Clinical Samples, etc.
2. **View Route Options**: See all available routes as vertical list
3. **Select Lane**: Click to see detailed flow visualization
4. **Review Details**: 
   - Click any node to see company info, certifications, requirements fulfillment
   - Hover/click transportation segments to see logistics company and alerts
5. **Make Decision**: Compare routes based on:
   - Overall risk level
   - Number of stops
   - Total duration
   - Certification compliance
   - Active alerts and incidents

### Lane Editing (Admin Only)
1. **Toggle Edit Mode**: Click "Edit Lane" button
2. **Reorder Nodes**: Drag nodes to change route sequence
3. **Remove Nodes**: Click ✕ on a node to remove it (minimum 1 node required)
4. **Add Nodes**: Click "+ Add Node" to expand route
5. **Save Changes**: Click "Done Editing" to save modifications

## Risk Assessment Display

Each lane shows risk metrics at multiple levels:

### Lane Level
- Overall risk score (Low/Medium/High/Critical)
- Risk pill badge with color coding:
  - Green: Low
  - Yellow/Orange: Medium
  - Red: High
  - Dark Red: Critical

### Node Level
- Individual risk scores
- Validation status (Validated/Pending/Rejected)
- Current temperature vs. required range
- Security level
- Alert badges showing active notifications

### Transportation Level
- Alert indicators with severity colors
- Logistics company reliability indicators
- Duration estimates

## Requirement Fulfillment Tracking

When viewing a node, the system shows if it meets product requirements:

✅ **Certifications**: All required certifications present
✅ **Capabilities**: All required operational/handling capabilities available
✅ **Security Level**: Facility security level meets minimum requirement

✗ Indicates missing certification or insufficient capability

## User Interface Design

- **Clean, Modern Design**: Gradient backgrounds, rounded corners, smooth transitions
- **Color-Coded Risk**: Intuitive visual hierarchy
- **Compact Cards**: Information density without clutter
- **Horizontal Flow**: Mimics Freightos.com lane visualization
- **Mobile Responsive**: Adapts to smaller screens
- **Interactive Elements**: Hover states, click feedback, drag-drop

## Testing the Feature

1. **Log in as Admin**: 
   - Email: `admin@4viso.com`
   - Password: `demo123`

2. **Navigate to Admin Panel**: Click Admin in sidebar (if accessible)

3. **Go to Lane Management Tab**: Click the "Lane Management" tab

4. **View Demo Lanes**:
   - Product filter shows "Vaccines"
   - Two routes from Brussels to Washington
   - Option 1: Direct via Heathrow (High Risk)
   - Option 2: Via Paris & Shannon (Medium Risk)

5. **Interact with Lanes**:
   - Click a lane card to see flow diagram
   - Click any node to see detailed information
   - Hover transportation segments for company details
   - Click "Edit Lane" to test reordering and node management

## API Integration Points

When connecting to a real backend:

1. **Replace `mockApi.getLanes()`** with real backend call
2. **Replace `mockApi.getRequirements()`** with real backend call
3. **Implement `mockApi.updateLane()`** to persist changes
4. **Implement `mockApi.createLane()`** for new lane creation
5. **Add error handling** and validation

## Future Enhancements

- [ ] Side-by-side lane comparison view
- [ ] Historical performance metrics display
- [ ] "What-if" analysis for lane changes
- [ ] Cost comparison between routes
- [ ] Real-time alert integration from IoT sensors
- [ ] Custom risk calculation algorithm
- [ ] Lane template creation
- [ ] Export lane details (PDF/Excel)
- [ ] Multi-node drag-select for batch operations
- [ ] Route optimization suggestions

## File Structure

```
src/
├── components/lanes/
│   ├── LaneCreation.vue                 # Main UI component
│   ├── LaneFlowVisualization.vue        # Flow diagram & editing
│   ├── NodeDetailModal.vue              # Node information modal
│   └── TransportationSegmentDetail.vue  # Transportation info
├── stores/
│   └── lanes.ts                         # Pinia state management
├── services/
│   └── mockApi.ts                       # API integration (updated)
├── types/
│   └── domain.ts                        # Domain models (updated)
├── mocks/
│   └── seed.ts                          # Demo data (updated)
└── views/
    └── AdminView.vue                    # Admin page (updated)
```

## Dependencies

All components use existing project dependencies:
- Vue 3 (Composition API)
- TypeScript
- Pinia (state management)
- Existing component library (StatusPill, etc.)

No additional npm packages required!
