# Lane Risk Assessment - Quick Reference

## 🎯 What You Can Do

### View & Analyze
- **Browse Lane Options**: Vertically stacked list showing all routes
- **Product Filtering**: Switch between Vaccines, Clinical Samples, etc.
- **Risk At a Glance**: Color-coded risk badges (Low 🟢 → Critical 🔴)
- **Key Metrics**: See stops, duration, temperature range, status at a glance

### Inspect Node Details
- Click any node in the flow diagram to open detailed information
- See company information, capabilities, certifications
- Check requirement fulfillment (✓ = Met, ✗ = Not Met)
- View current vs. required temperature ranges

### Monitor Alerts
- Red badges show critical alerts at each node
- Orange badges show medium-severity issues
- Blue badges show information/low-priority items
- Hover transportation segments to see logistics company details

### Edit Lanes (Admin)
- **Drag & Drop**: Reorder nodes by dragging
- **Remove**: Click ✕ on node to remove (keep at least 1)
- **Add**: Click "+ Add Node" to extend route
- **Save**: Click "Done Editing" to save changes

---

## 🗺️ Lane Flow Visualization

```
[1] Brussels      Road→        [2] London         Air→        [3] Washington
    Warehouse      8h           Airport            8h          Airport
    ✓ 2 alerts     DHL        ✓ 3 alerts        Lufthansa   ✓ 0 alerts
    Risk: Low                   Risk: High                     Risk: Medium
    [View Details]             [View Details]                [View Details]
```

---

## 📊 Risk Assessment Metrics

### Per Lane
- Overall Risk Score
- Status (Active, Draft, Archived)
- Number of Stops
- Total Duration
- Temperature Compliance

### Per Node  
- Risk Score (Low/Medium/High/Critical)
- Validation Status
- Certifications Held
- Security Level
- Active Alert Count
- Requirement Fulfillment

### Per Transportation Segment
- Mode (Road/Air/Sea)
- Duration Estimate
- Logistics Company
- Alert Count & Severity

---

## 🔍 Node Detail Modal Content

When clicking a node:

```
╔════════════════════════════════════╗
║ Brussels Pharma DC                 ║
║ Brussels, Belgium                  ║
╠════════════════════════════════════╣
║ LOCATION INFORMATION               ║
║ Type: Warehouse                    ║
║ Mode: Road                         ║
║ Security: Enhanced                 ║
║ Dwell: 2h 15m                      ║
║                                    ║
║ CAPABILITIES                       ║
║ ✓ Perishable goods handling        ║
║ ✓ Active cooling                   ║
║ ✓ Temperature monitoring           ║
║                                    ║
║ CERTIFICATIONS                     ║
║ ✓ EU GDP (Valid)                   ║
║ ✓ ISO 9001 (Valid)                 ║
║                                    ║
║ REQUIREMENT FULFILLMENT            ║
║ ✓ Certifications: Met              ║
║ ✓ Capabilities: Met                ║
║ ✓ Security Level: Met              ║
╚════════════════════════════════════╝
```

---

## 🎮 Interaction Map

```
AdminView
├─ Tab: "Overview" 
│  ├─ Users List
│  └─ Validation Queue
│
└─ Tab: "Lane Management" ← You are here
   ├─ Product Filter
   │  └─ [Vaccines] [Clinical Samples] [Pharma Products]
   │
   ├─ Lane List (Left)
   │  ├─ [Lane Card 1] ← Click to select
   │  ├─ [Lane Card 2]
   │  └─ [Lane Card 3]
   │
   └─ Lane Detail (Right)
      ├─ Lane Flow Visualization
      │  ├─ [1]Node ─ Transport ─ [2]Node ─ Transport ─ [3]Node
      │  │   ↓ Click for details     ↓ Hover for info
      │  │ NodeDetailModal       TransportationDetails
      │  │
      │  └─ Edit Features (if editing)
      │     ├─ Drag nodes to reorder
      │     ├─ Click ✕ to remove
      │     └─ Click "Add Node" to add
      │
      └─ Action Buttons
         ├─ [Edit Lane] / [Done Editing]
         ├─ [Compare with Other]
         └─ [Select This Route]
```

---

## 📈 Risk Color Coding

| Color | Risk Level | Meaning |
|-------|-----------|---------|
| 🟢 Green | Low | Safe, high confidence |
| 🟡 Yellow | Medium | Acceptable, monitor closely |
| 🟠 Orange | High | Concerning, requires attention |
| 🔴 Red | Critical | Urgent action needed |

---

## ✅ Demo Data

### Lane 1: Brussels → Washington (Direct)
- Route: Brussels DC → Heathrow Hub → Dulles Gateway
- Duration: 24 hours
- Risk: HIGH ⚠️
- Issues: Labor slowdown at Heathrow, temperature drift

### Lane 2: Brussels → Washington (Via Shannon)
- Route: Brussels DC → Paris Hub → Shannon Airport → JFK → Washington
- Duration: 32 hours  
- Risk: MEDIUM ⚡
- Better: More stable operators, no labor issues

---

## 🔧 How to Use in Your Workflow

1. **Admin logs in** → Navigate to "Lane Management" tab
2. **Filter by product** → Select "Vaccines"
3. **Compare routes** → View both options side-by-side (vertically)
4. **Inspect nodes** → Click each node to verify requirements
5. **Check alerts** → Review any active incidents
6. **Make decision** → Select the best-fit route
7. **Optional: Customize** → Edit lane if needed, then save
8. **Confirm selection** → Click "Select This Route" to proceed

---

## 🚀 Try It Out

1. Log in as Admin:
   - Email: `admin@4viso.com`
   - Password: `demo123`

2. Click the "Lane Management" tab

3. Default product is "Vaccines" - see 2 routes

4. Click a route card to see the flow

5. Click any node to see details

6. Click "Edit Lane" to test drag/drop reordering

Enjoy the risk assessment interface! 🎉
